import React, { Suspense, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, LoadingPlaceholder } from '@grafana/ui';
import { mcp } from '@grafana/llm';

import { CopilotDrawer } from './CopilotDrawer';

export function CopilotProvider() {
  const [isOpen, setIsOpen] = useState(false);

  // Render to document.body using portal for global visibility
  // MCP client provider wraps everything to keep it stable
  return (
    <mcp.MCPClientProvider appName="grafana-llm-app" appVersion="1.0.1">
      {createPortal(
        <>
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 9999,
            }}
          >
            <Button icon="comment-alt" size="lg" variant="primary" onClick={() => setIsOpen(true)}>
              Copilot
            </Button>
          </div>
          {isOpen && (
            <Suspense fallback={<LoadingPlaceholder text="Loading Copilot..." />}>
              <CopilotDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
            </Suspense>
          )}
        </>,
        document.body
      )}
    </mcp.MCPClientProvider>
  );
}
