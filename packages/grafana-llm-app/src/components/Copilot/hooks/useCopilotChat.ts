import { useCallback, useEffect, useMemo, useState } from 'react';
import { finalize, lastValueFrom, partition, startWith } from 'rxjs';
import { llm, mcp } from '@grafana/llm';
import { useAsync } from 'react-use';

import { loadLatestConversation, saveConversation } from '../utils/conversationStorage';
import { buildBaseSystemPrompt } from '../utils/systemPrompts';
import { CopilotMessage, ConversationState, ToolCallState } from '../types';
import { useGrafanaContext } from './useGrafanaContext';
import { useToolExecution } from './useToolExecution';

interface UseCopilotChatResult {
  messages: CopilotMessage[];
  toolCalls: Map<string, ToolCallState>;
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  resetConversation: () => void;
  enabled: boolean;
  toolsError?: Error | null;
  toolsLoading: boolean;
}

const CHAT_TIMEOUT_MS = 60_000;
const CORE_TOOL_ALLOWLIST = [
  // Datasources
  'list_datasources',
  'get_datasource_by_name',
  'get_datasource_by_uid',
  // Dashboards
  'get_dashboard_by_uid',
  'get_dashboard_summary',
  'get_dashboard_property',
  // Prometheus
  'query_prometheus',
  'list_prometheus_label_names',
  'list_prometheus_label_values',
  'list_prometheus_metric_names',
  // Loki
  'query_loki_logs',
  'list_loki_label_names',
  'list_loki_label_values',
  // Alerts
  'list_alert_rules',
  'get_alert_rule_by_uid',
];

let cachedToolsData: { enabled: boolean; tools: any[] } | null = null;

function createId() {
  return Math.random().toString(36).slice(2);
}

function toLLMMessage(msg: CopilotMessage): llm.Message {
  if (msg.role === 'tool') {
    return {
      role: 'tool',
      content: msg.content,
      tool_call_id: msg.toolCallId,
      name: msg.name,
    };
  }
  return { role: msg.role, content: msg.content };
}

function buildConversationTitle(messages: CopilotMessage[]) {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) {
    return 'Conversation';
  }
  return firstUser.content.slice(0, 50) || 'Conversation';
}

export function useCopilotChat(): UseCopilotChatResult {
  const existingConversation = useMemo(() => loadLatestConversation(), []);
  const [conversationId, setConversationId] = useState(existingConversation?.id ?? createId());
  const [messages, setMessages] = useState<CopilotMessage[]>(existingConversation?.messages ?? []);
  const [conversationCreatedAt, setConversationCreatedAt] = useState(existingConversation?.createdAt ?? Date.now());
  const [toolCalls, setToolCalls] = useState<Map<string, ToolCallState>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const context = useGrafanaContext();
  const { executeToolCall } = useToolExecution();
  const { client } = mcp.useMCPClient();

  const {
    loading: toolsLoading,
    error: toolsError,
    value: toolsData,
  } = useAsync(async () => {
    if (cachedToolsData) {
      return cachedToolsData;
    }

    const pluginEnabled = await llm.enabled();
    if (!pluginEnabled) {
      cachedToolsData = { enabled: false, tools: [] };
      return cachedToolsData;
    }

    if (!client) {
      return { enabled: false, tools: [] };
    }

    const { tools } = (await client.listTools()) ?? { tools: [] };
    cachedToolsData = { enabled: true, tools };
    return cachedToolsData;
  }, [client]);

  const enabled = Boolean(toolsData?.enabled);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const conversation: ConversationState = {
      id: conversationId,
      title: buildConversationTitle(messages),
      messages,
      createdAt: conversationCreatedAt,
      updatedAt: Date.now(),
    };

    saveConversation(conversation);
  }, [conversationCreatedAt, conversationId, messages]);

  const resetConversation = useCallback(() => {
    const newId = createId();
    setConversationId(newId);
    setMessages([]);
    setToolCalls(new Map());
    setConversationCreatedAt(Date.now());
  }, []);

  const updateAssistantContent = useCallback((assistantId: string, content: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? { ...msg, content } : msg)));
  }, []);

  const appendToolMessage = useCallback((content: string, toolCallId: string, llmMessages: llm.Message[]) => {
    const toolMessage: CopilotMessage = {
      id: createId(),
      role: 'tool',
      content,
      timestamp: Date.now(),
      toolCallId,
    };

    setMessages((prev) => [...prev, toolMessage]);
    llmMessages.push({
      role: 'tool',
      content,
      tool_call_id: toolCallId,
    });
  }, []);

  const handleStreamingChat = useCallback(
    async (
      llmMessages: llm.Message[],
      assistantId: string,
      availableTools: any[],
      onContentUpdate: (content: string) => void
    ) => {
      const filteredTools =
        availableTools?.filter((tool) => CORE_TOOL_ALLOWLIST.includes(tool.name)) ?? [];

      // ALWAYS use filtered tools - never fallback to all tools (causes 30s+ timeouts)
      const tools = mcp.convertToolsToOpenAI(filteredTools);

      const makeContentSubscription = (source: any) =>
        source
          .pipe(
            startWith({
              choices: [{ delta: { role: 'assistant', content: '' } }],
            }),
            llm.accumulateContent(),
            finalize(() => undefined)
          )
          .subscribe((content: string) => onContentUpdate(content));

      let stream = llm.streamChatCompletions({
        model: llm.Model.LARGE,
        messages: llmMessages,
        tools,
      });

      let [toolCallsStream, otherMessages] = partition(
        stream,
        (chunk: llm.ChatCompletionsResponse<llm.ChatCompletionsChunk>) =>
          llm.isToolCallsMessage(chunk.choices[0].delta)
      );

      let contentSubscription = makeContentSubscription(otherMessages);

      let toolCallMessages = await lastValueFrom(toolCallsStream.pipe(llm.accumulateToolCalls()));

      while (toolCallMessages.tool_calls.length > 0) {
        const functionCalls = toolCallMessages.tool_calls.filter((tc) => tc.type === 'function');

        // CRITICAL: Add assistant message with tool_calls to conversation
        // OpenAI requires: user → assistant(with tool_calls) → tool(results)
        llmMessages.push({
          role: 'assistant',
          tool_calls: toolCallMessages.tool_calls,
        });

        await Promise.all(
          functionCalls.map((fc) =>
            executeToolCall(
              { id: fc.id, name: fc.function.name, arguments: fc.function.arguments },
              (toolContent, toolCallId) => appendToolMessage(toolContent, toolCallId, llmMessages),
              setToolCalls
            )
          )
        );

        contentSubscription.unsubscribe();

        stream = llm.streamChatCompletions({
          model: llm.Model.LARGE,
          messages: llmMessages,
          tools,
        });

        [toolCallsStream, otherMessages] = partition(
          stream,
          (chunk: llm.ChatCompletionsResponse<llm.ChatCompletionsChunk>) =>
            llm.isToolCallsMessage(chunk.choices[0].delta)
        );

        contentSubscription = makeContentSubscription(otherMessages);
        toolCallMessages = await lastValueFrom(toolCallsStream.pipe(llm.accumulateToolCalls()));
      }

      contentSubscription.unsubscribe();
    },
    [appendToolMessage, executeToolCall]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming || !enabled) {
        return;
      }

      const userMessage: CopilotMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const assistantMessage: CopilotMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setToolCalls(new Map());
      setIsStreaming(true);

      const systemContent = [buildBaseSystemPrompt(), context.url ? `Current page: ${context.url}` : '']
        .filter(Boolean)
        .join('\n');

      const llmMessages: llm.Message[] = [
        { role: 'system', content: systemContent },
        ...messages.map(toLLMMessage),
        { role: 'user', content: trimmed },
      ];

      let contentReceived = false;
      const handleContent = (content: string) => {
        if (content && content.trim().length > 0) {
          contentReceived = true;
        }
        updateAssistantContent(assistantMessage.id, content);
      };

      try {
        await Promise.race([
          handleStreamingChat(llmMessages, assistantMessage.id, toolsData?.tools ?? [], handleContent),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), CHAT_TIMEOUT_MS)),
        ]);
      } catch (err: any) {
        const error = err?.message ?? 'Unknown error';
        updateAssistantContent(assistantMessage.id, `Error: ${error}`);
        contentReceived = true;
      } finally {
        if (!contentReceived) {
          updateAssistantContent(
            assistantMessage.id,
            'Request timed out or no response received. Please try again.'
          );
        }
        setIsStreaming(false);
      }
    },
    [context.url, enabled, handleStreamingChat, isStreaming, messages, toolsData?.tools, updateAssistantContent]
  );

  return {
    messages,
    toolCalls,
    isStreaming,
    sendMessage,
    resetConversation,
    enabled,
    toolsError,
    toolsLoading,
  };
}
