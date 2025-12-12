/**
 * Message content formatter with Markdown rendering.
 *
 * This component renders LLM messages with:
 * - Full Markdown support (headings, lists, links, etc.)
 * - Copy-to-clipboard button for code snippets
 * - Proper styling for inline and block code
 *
 * TODO: Add syntax highlighting with react-syntax-highlighter once package is properly configured
 */
import React, { useState } from 'react';
import { css } from '@emotion/css';
import ReactMarkdown, { Components } from 'react-markdown';
import { Button, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

interface FormattedContentProps {
  content: string;
}

/**
 * Copies text to clipboard and shows temporary feedback.
 */
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return { copied, copy };
}

/**
 * Renders message content with Markdown formatting.
 *
 * Features:
 * - Markdown parsing via react-markdown
 * - Code blocks with copy button
 * - Inline code styling
 * - Responsive layout
 */
export function FormattedContent({ content }: FormattedContentProps) {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const { copied, copy } = useCopyToClipboard();

  // Custom markdown component renderers with proper typing
  const components: Components = {
    // Custom code block renderer with copy button
    code({ node, inline, className, children, ...props }: any) {
      const code = String(children).replace(/\n$/, '');
      const language = /language-(\w+)/.exec(className || '')?.[1] || 'text';

      // Inline code: simple styling
      if (inline) {
        return (
          <code className={styles.inlineCode} {...props}>
            {children}
          </code>
        );
      }

      // Block code: with copy button
      return (
        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <span className={styles.language}>{language}</span>
            <Button
              size="sm"
              variant="secondary"
              fill="text"
              onClick={() => copy(code)}
              icon={copied ? 'check' : 'copy'}
              tooltip={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className={styles.codeContent}>{children}</pre>
        </div>
      );
    },

    // Custom link renderer (opens in new tab)
    a({ node, children, href, ...props }: any) {
      return (
        <a href={href as string} target="_blank" rel="noopener noreferrer" className={styles.link} {...props}>
          {children}
        </a>
      );
    },

    // Custom paragraph renderer (proper spacing)
    p({ children }: any) {
      return <p className={styles.paragraph}>{children}</p>;
    },
  };

  return (
    <div className={styles.content}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  content: css`
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.body.fontSize};
    line-height: ${theme.typography.body.lineHeight};
    color: ${theme.colors.text.primary};

    /* Reset margins for first/last children */
    > *:first-child {
      margin-top: 0;
    }
    > *:last-child {
      margin-bottom: 0;
    }

    /* Headings */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: ${theme.spacing(2)};
      margin-bottom: ${theme.spacing(1)};
      font-weight: ${theme.typography.fontWeightMedium};
    }

    /* Lists */
    ul,
    ol {
      margin: ${theme.spacing(1, 0)};
      padding-left: ${theme.spacing(3)};
    }

    li {
      margin: ${theme.spacing(0.5, 0)};
    }

    /* Blockquotes */
    blockquote {
      margin: ${theme.spacing(1, 0)};
      padding-left: ${theme.spacing(2)};
      border-left: 3px solid ${theme.colors.border.strong};
      color: ${theme.colors.text.secondary};
    }

    /* Horizontal rules */
    hr {
      border: none;
      border-top: 1px solid ${theme.colors.border.medium};
      margin: ${theme.spacing(2, 0)};
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: ${theme.spacing(1, 0)};
    }

    th,
    td {
      border: 1px solid ${theme.colors.border.medium};
      padding: ${theme.spacing(0.5, 1)};
      text-align: left;
    }

    th {
      background: ${theme.colors.background.secondary};
      font-weight: ${theme.typography.fontWeightMedium};
    }
  `,

  paragraph: css`
    margin: ${theme.spacing(1, 0)};
    white-space: pre-wrap;
    word-break: break-word;
  `,

  inlineCode: css`
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    padding: 2px 6px;
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: 0.9em;
    color: ${theme.colors.text.primary};
  `,

  codeBlock: css`
    margin: ${theme.spacing(1, 0)};
    border-radius: ${theme.shape.radius.default};
    overflow: hidden;
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.medium};
  `,

  codeHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing(0.5, 1)};
    background: ${theme.colors.background.canvas};
    border-bottom: 1px solid ${theme.colors.border.medium};
  `,

  language: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: 0.75rem;
    color: ${theme.colors.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  codeContent: css`
    margin: 0;
    padding: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: 0.9em;
    overflow-x: auto;
    white-space: pre;
  `,

  link: css`
    color: ${theme.colors.primary.text};
    text-decoration: underline;

    &:hover {
      color: ${theme.colors.primary.main};
    }
  `,
});
