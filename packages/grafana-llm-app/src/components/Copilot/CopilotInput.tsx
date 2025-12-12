/**
 * Copilot input component with contextual prompt suggestions.
 *
 * Features:
 * - Text area for user input with Enter to send (Shift+Enter for new line)
 * - Contextual suggested prompts based on current Grafana page
 * - New conversation button
 * - Disabled state during streaming
 */
import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Button, Stack, TextArea, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

import { useGrafanaContext } from './hooks/useGrafanaContext';

interface CopilotInputProps {
  onSend: (text: string) => Promise<void>;
  isStreaming: boolean;
  disabled?: boolean;
  onNewConversation: () => void;
}

/**
 * Input component for the Copilot chat interface.
 *
 * Provides:
 * - Multi-line text input with keyboard shortcuts
 * - Context-aware suggested prompts (dashboard vs general)
 * - Send and New Conversation actions
 */
export function CopilotInput({ onSend, isStreaming, disabled, onNewConversation }: CopilotInputProps) {
  const [text, setText] = useState('');
  const context = useGrafanaContext();
  const theme = useTheme2();
  const styles = getStyles(theme);

  // Get contextual suggestions based on current Grafana page
  const suggestions = getSuggestions(context);

  /**
   * Sends the current message to the LLM.
   * Clears the input after sending.
   */
  const handleSend = async () => {
    if (!text.trim()) {
      return;
    }
    await onSend(text);
    setText('');
  };

  /**
   * Handles keyboard shortcuts:
   * - Enter: Send message
   * - Shift+Enter: New line
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Fills the input with a suggested prompt.
   */
  const handleSuggestionClick = (prompt: string) => {
    setText(prompt);
  };

  return (
    <Stack direction="column" gap={1}>
      {/* Suggested prompts (context-aware) */}
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((prompt) => (
            <Button
              key={prompt}
              size="sm"
              variant="secondary"
              onClick={() => handleSuggestionClick(prompt)}
              disabled={isStreaming || disabled}
              tooltip="Click to use this suggestion"
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {/* Input area with send/new buttons */}
      <Stack direction="row" gap={1}>
        <TextArea
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Grafana Copilot… (Enter to send, Shift+Enter for new line)"
          disabled={isStreaming || disabled}
          rows={3}
          style={{ flex: 1 }}
          data-testid="copilot-input"
        />
        <Stack direction="column" gap={1}>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={isStreaming || disabled || !text.trim()}
            icon={isStreaming ? 'fa fa-spinner' : 'arrow-right'}
            data-testid="copilot-send"
          >
            {isStreaming ? 'Sending…' : 'Send'}
          </Button>
          <Button
            variant="secondary"
            onClick={onNewConversation}
            disabled={isStreaming}
            icon="plus"
            tooltip="Start a new conversation"
          >
            New
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

/**
 * Returns contextual prompt suggestions based on the current Grafana page.
 *
 * Suggestions adapt to:
 * - Dashboard page: Dashboard-specific prompts
 * - Explore page: Query-focused prompts
 * - Alerting page: Alert-focused prompts
 * - General: Common Grafana tasks
 *
 * @param context - Current Grafana context (URL, dashboard, etc.)
 * @returns Array of suggested prompt strings
 */
function getSuggestions(context: ReturnType<typeof useGrafanaContext>): string[] {
  const url = context.url || '';

  // Dashboard-specific suggestions
  if (url.includes('/d/')) {
    return [
      'Summarize this dashboard',
      'Are there any unusual patterns in the metrics?',
      'Show me error logs from the last hour',
      'Create an alert for high CPU usage',
    ];
  }

  // Explore page suggestions
  if (url.includes('/explore')) {
    return [
      'Help me write a PromQL query for CPU usage',
      'Show me LogQL query for error logs',
      'Explain this query result',
    ];
  }

  // Alerting page suggestions
  if (url.includes('/alerting')) {
    return [
      'List all firing alerts',
      'Create an alert rule for disk usage',
      'Explain this alert rule',
    ];
  }

  // General suggestions (home, datasources, etc.)
  return [
    'Create a new dashboard for monitoring',
    'List all Prometheus datasources',
    'Show me recent alerts',
    'Help me troubleshoot high latency',
  ];
}

const getStyles = (theme: GrafanaTheme2) => ({
  suggestions: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(0.5)};

    /* Fade in animation */
    animation: fadeIn 0.3s ease-in-out;

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
});
