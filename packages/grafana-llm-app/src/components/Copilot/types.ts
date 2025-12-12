export type CopilotRole = 'user' | 'assistant' | 'system' | 'tool';

export interface CopilotMessage {
  id: string;
  role: CopilotRole;
  content: string;
  timestamp: number;
  toolCallId?: string;
  name?: string;
}

export interface ToolCallState {
  id: string;
  name: string;
  arguments: string;
  running: boolean;
  startedAt?: number;
  durationMs?: number;
  response?: unknown;
  error?: string;
}

export interface ConversationState {
  id: string;
  title: string;
  messages: CopilotMessage[];
  updatedAt: number;
  createdAt: number;
}
