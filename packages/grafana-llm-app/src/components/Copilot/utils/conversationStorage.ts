import { ConversationState } from '../types';

const STORAGE_KEY = 'grafana-copilot-conversations';
const MAX_CONVERSATIONS = 20;

export function loadLatestConversation(): ConversationState | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const conversations: ConversationState[] = JSON.parse(stored);
    return conversations.length > 0 ? conversations[0] : null;
  } catch {
    return null;
  }
}

export function saveConversation(conversation: ConversationState) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const existing = getConversations().filter((c) => c.id !== conversation.id);
  const updated = [conversation, ...existing].slice(0, MAX_CONVERSATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getConversations(): ConversationState[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as ConversationState[];
  } catch {
    return [];
  }
}

export function clearConversation(id: string) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const filtered = getConversations().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
