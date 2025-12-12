import { Dispatch, SetStateAction, useCallback } from 'react';
import { mcp } from '@grafana/llm';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types';

import { ToolCallState } from '../types';

interface ToolCallSpec {
  id: string;
  name: string;
  arguments: string;
}

const TOOL_CALL_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function useToolExecution() {
  const { client } = mcp.useMCPClient();

  const executeToolCall = useCallback(
    async (
      spec: ToolCallSpec,
      pushToolMessage: (content: string, toolCallId: string) => void,
      setToolCalls: Dispatch<SetStateAction<Map<string, ToolCallState>>>
    ) => {
      setToolCalls((prev) => {
        const next = new Map(prev);
        next.set(spec.id, {
          id: spec.id,
          name: spec.name,
          arguments: spec.arguments,
          running: true,
          startedAt: Date.now(),
        });
        return next;
      });

      try {
        const args = JSON.parse(spec.arguments || '{}');
        const response = await withTimeout(
          client?.callTool({ name: spec.name, arguments: args }) ?? Promise.reject(new Error('MCP client unavailable')),
          TOOL_CALL_TIMEOUT_MS,
          `Tool call "${spec.name}" timed out after ${TOOL_CALL_TIMEOUT_MS / 1000}s`
        );
        const toolResult = CallToolResultSchema.parse(response);
        const textContent = toolResult.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('');

        pushToolMessage(textContent, spec.id);
        setToolCalls((prev) => {
          const next = new Map(prev);
          const startedAt = next.get(spec.id)?.startedAt ?? Date.now();
          next.set(spec.id, {
            id: spec.id,
            name: spec.name,
            arguments: spec.arguments,
            running: false,
            startedAt,
            durationMs: Date.now() - startedAt,
            response,
          });
          return next;
        });
      } catch (err: any) {
        const error = err?.message ?? String(err);
        pushToolMessage(error, spec.id);
        setToolCalls((prev) => {
          const next = new Map(prev);
          const startedAt = next.get(spec.id)?.startedAt ?? Date.now();
          next.set(spec.id, {
            id: spec.id,
            name: spec.name,
            arguments: spec.arguments,
            running: false,
            startedAt,
            durationMs: Date.now() - startedAt,
            error,
          });
          return next;
        });
      }
    },
    [client]
  );

  return { executeToolCall };
}
