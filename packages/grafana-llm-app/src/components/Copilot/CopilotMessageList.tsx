import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';

import { CopilotMessage } from './types';
import { FormattedContent } from './utils/messageFormatting';

interface CopilotMessageListProps {
  messages: CopilotMessage[];
  isStreaming: boolean;
}

export function CopilotMessageList({ messages, isStreaming }: CopilotMessageListProps) {
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const styles = getStyles(theme);

  // Filter out tool messages - they're internal to the LLM conversation
  const visibleMessages = messages.filter((msg) => msg.role !== 'tool');

  return (
    <div ref={containerRef} className={styles.container} data-testid="copilot-message-list">
      {visibleMessages.length === 0 ? (
        <div className={styles.empty}>Start a conversation by typing a message below.</div>
      ) : (
        visibleMessages.map((message) => (
          <div key={message.id} className={styles.messageRow} data-testid="copilot-message">
            <div className={message.role === 'user' ? styles.userBubble : styles.assistantBubble}>
              <FormattedContent content={message.content || (isStreaming && message.role === 'assistant' ? '…' : '')} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    height: 420px;
    overflow-y: auto;
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.secondary};
  `,
  empty: css`
    color: ${theme.colors.text.secondary};
    font-style: italic;
  `,
  messageRow: css`
    display: flex;
    margin-bottom: ${theme.spacing(1.5)};
  `,
  userBubble: css`
    margin-left: auto;
    max-width: 90%;
    background: ${theme.colors.primary.main};
    color: ${theme.colors.text.maxContrast};
    padding: ${theme.spacing(1.5)};
    border-radius: ${theme.shape.radius.default};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `,
  assistantBubble: css`
    max-width: 90%;
    background: ${theme.colors.background.canvas};
    color: ${theme.colors.text.primary};
    padding: ${theme.spacing(1.5)};
    border-radius: ${theme.shape.radius.default};
    border: 1px solid ${theme.colors.border.medium};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `,
});
