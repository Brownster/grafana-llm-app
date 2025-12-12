import { useMemo } from 'react';

export interface GrafanaContext {
  url?: string;
}

// Placeholder for Phase 2. Returns stable empty context for now.
export function useGrafanaContext(): GrafanaContext {
  return useMemo(() => ({ url: window.location?.pathname }), []);
}
