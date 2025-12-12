import React from 'react';
import { css } from '@emotion/css';
import { Alert, Button, Spinner, Stack, useTheme2 } from '@grafana/ui';

import { CopilotInput } from './CopilotInput';
import { CopilotMessageList } from './CopilotMessageList';
import { CopilotToolCallView } from './CopilotToolCallView';
import { useCopilotChat } from './hooks/useCopilotChat';

export function CopilotChat() {
  const { messages, toolCalls, isStreaming, sendMessage, resetConversation, enabled, toolsError, toolsLoading } =
    useCopilotChat();
  const theme = useTheme2();
  const styles = getStyles(theme);

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const hasRetryableError =
    !isStreaming &&
    lastAssistant &&
    lastUser &&
    /error|timed out|no response/i.test(lastAssistant.content || '');

  if (toolsLoading) {
    return (
      <div className={styles.loading}>
        <Spinner /> <span>Loading MCP tools…</span>
      </div>
    );
  }

  if (toolsError) {
    return (
      <Alert severity="error" title="Unable to load MCP tools">
        {toolsError.message}
      </Alert>
    );
  }

  if (!enabled) {
    return (
      <Alert severity="warning" title="LLM plugin not enabled">
        Configure an LLM provider in the plugin settings to use Copilot.
      </Alert>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      <CopilotMessageList messages={messages} isStreaming={isStreaming} />
      <CopilotToolCallView toolCalls={toolCalls} />
      {hasRetryableError ? (
        <Alert severity="warning" title="Request failed" data-testid="copilot-retry-alert">
          <Stack justifyContent="space-between" alignItems="center">
            <span>Last request failed. Retry?</span>
            <Button size="sm" onClick={() => lastUser && sendMessage(lastUser.content)} disabled={isStreaming}>
              Retry
            </Button>
          </Stack>
        </Alert>
      ) : null}
      <CopilotInput onSend={sendMessage} isStreaming={isStreaming} disabled={!enabled} onNewConversation={resetConversation} />
    </Stack>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme2>) => ({
  loading: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    color: ${theme.colors.text.primary};
  `,
});
