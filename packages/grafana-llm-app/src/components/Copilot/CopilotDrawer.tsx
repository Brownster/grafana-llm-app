import React from 'react';
import { Drawer } from '@grafana/ui';

import { CopilotChat } from './CopilotChat';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotDrawer({ isOpen, onClose }: CopilotDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Drawer title="Grafana Copilot" onClose={onClose} width="40%" scrollableContent data-testid="copilot-drawer">
      <CopilotChat />
    </Drawer>
  );
}
