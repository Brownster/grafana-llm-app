import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2, Tag } from '@grafana/ui';

import { ToolCallState } from './types';

interface CopilotToolCallViewProps {
  toolCalls: Map<string, ToolCallState>;
}

export function CopilotToolCallView({ toolCalls }: CopilotToolCallViewProps) {
  const theme = useTheme2();
  const styles = getStyles(theme);

  if (!toolCalls.size) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Tool activity</div>
      {[...toolCalls.values()].map((call) => {
        const status = call.running ? 'Running' : call.error ? 'Error' : 'Done';
        const color = call.running ? 'blue' : call.error ? 'red' : 'green';
        const durationLabel =
          call.durationMs != null ? `${(call.durationMs / 1000).toFixed(1)}s` : call.running ? '…' : '—';

        return (
          <div key={call.id} className={styles.row}>
            <div className={styles.headerRow}>
              <div className={styles.name}>{call.name}</div>
              <Tag name={status} color={color} />
            </div>
            <div className={styles.arguments}>{call.arguments}</div>
            <div className={styles.meta}>
              <span>Duration: {durationLabel}</span>
              {call.startedAt ? <span>Started: {new Date(call.startedAt).toLocaleTimeString()}</span> : null}
            </div>
            {call.error ? <div className={styles.error}>Error: {call.error}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
  `,
  header: css`
    font-weight: ${theme.typography.fontWeightMedium};
    margin-bottom: ${theme.spacing(1)};
  `,
  row: css`
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    margin-bottom: ${theme.spacing(1)};
    background: ${theme.colors.background.primary};
  `,
  headerRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  name: css`
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  arguments: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
    margin: ${theme.spacing(0.5)} 0;
    word-break: break-word;
  `,
  meta: css`
    display: flex;
    gap: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  error: css`
    margin-top: ${theme.spacing(0.5)};
    color: ${theme.colors.error.text};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});
