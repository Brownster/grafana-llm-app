# Grafana Copilot Roadmap

**Goal:** Transform the forked `grafana-llm-app` into a production-ready Grafana OSS Copilot that helps users review metrics, create dashboards, troubleshoot issues, and leverage company knowledge bases.

**Strategy:** Leverage existing infrastructure (chat UI, MCP tools, LLM integration) rather than building from scratch.

---

## 📍 Current Status (2025-12-12)

### ✅ Completed Phases

**Phase 0: Environment Setup & Architecture Documentation**
- ✅ Development environment running (`./dev.sh` + watch servers)
- ✅ Go 1.25.1 configured via GOTOOLCHAIN
- ✅ Created `ARCHITECTURE.md` - Complete technical reference
- ✅ Created `QUICKSTART.md` - Dev environment quick start guide
- ✅ Documented data flows, component structure, integration points

**Phase 1: Copilot Chat UI** ✅ **COMPLETE**
- ✅ Complete component structure created in `packages/grafana-llm-app/src/components/Copilot/`
- ✅ Components: CopilotProvider, CopilotDrawer, CopilotChat, CopilotMessageList, CopilotInput, CopilotToolCallView
- ✅ Hooks: useCopilotChat (chat state + streaming), useToolExecution (MCP tools), useGrafanaContext (placeholder)
- ✅ Utils: conversationStorage (localStorage), systemPrompts, messageFormatting (Markdown rendering)
- ✅ Registered as global component in `plugin.json` extensions and rendered via React Portal for global visibility
- ✅ Renders as floating button on ALL Grafana pages (bottom-right corner)
- ✅ Auto-scroll to latest messages
- ✅ Contextual prompt suggestions based on current page (dashboard vs general)
- ✅ Conversation persistence with localStorage
- ✅ Copy-to-clipboard for code blocks
- ✅ Markdown support with proper styling
- ✅ LLM streaming responses working with OpenAI
- ✅ MCP client connects and loads tools from backend
- ✅ Tool execution flow implemented (with 40+ MCP tools)
- ✅ New conversation button works
- ✅ Tested successfully in development environment

**Optional Improvements Added:**
- ✅ Enhanced markdown rendering with react-markdown
- ✅ Code block formatting with copy buttons
- ✅ Context-aware suggested prompts (dashboard, explore, alerting, general)
- ✅ Auto-scroll implementation
- ✅ Improved keyboard shortcuts (Enter to send, Shift+Enter for new line)

**Phase 1.5: Bug Fixes & Optimization** 🔄 **IN PROGRESS**
- ✅ Added timeouts for LLM streaming and MCP tool calls (now 60s / 45s guards)
- ✅ Trimmed tool list to core MCP tools to reduce prompt/tool-call overhead
- ✅ Guarded against empty assistant messages on errors/timeouts
- 🟡 Tool calls still slower than desired for some queries (datasource counts, etc.)
- 🟡 Need to cache `listTools` results per session and surface tool-call latency in UI
- 🟡 Retry affordance for failed assistant messages/tool calls still pending

### 🔄 Next Steps

**Phase 1.5: Wrap-Up**
- [ ] Cache MCP `listTools` once per session (or per page load) and reuse
- [ ] Surface tool-call duration/error in the UI + add retry for failed assistant messages
- [ ] Re-evaluate timeouts after tool caching (aim for <10s on core tool calls)
- [ ] Validate no blank assistant bubbles are saved when errors occur

**Phase 2: Dashboard Context Awareness** (Next Priority)
- [ ] Implement `useGrafanaContext` hook to extract:
  - Dashboard UID, title, panels, variables
  - Current time range
  - Active datasources
  - Current page URL
- [ ] Inject context into system prompts
- [ ] Test context-aware responses

**Phase 3: MCP Tool Usage**
- [ ] Verify all 10+ MCP tool categories work
- [ ] Test tool calling loop
- [ ] Enhance tool call visualization
- [ ] Test common workflows (query metrics, create dashboards, etc.)

### 📦 Deliverables Created

- **`ARCHITECTURE.md`** - Complete technical documentation
- **`QUICKSTART.md`** - Quick start guide for dev environment
- **`dev.sh`** - Helper script for starting development environment
- **`packages/grafana-llm-app/src/components/Copilot/`** - Complete Phase 1 implementation

---

## 🎯 MVP Scope (First Release)

A chat agent accessible from anywhere in Grafana that can:
- ✅ Answer questions about Grafana dashboards, metrics, and logs
- ✅ Query Prometheus/Loki and explain results in natural language
- ✅ Create and modify dashboards based on user requests
- ✅ Understand dashboard context (what the user is currently viewing)
- ✅ Access company knowledge base (runbooks, documentation)
- ✅ Suggest alerts and create annotations

**Deferred to Post-MVP:**
- Proactive anomaly detection with notifications
- Multi-user conversation sharing
- Advanced ML-based forecasting
- Background monitoring jobs

---

## 📦 What Already Exists (Don't Rebuild These!)

### ✅ Complete LLM Infrastructure
- **Location:** `packages/grafana-llm-app/pkg/plugin/`
- **Capabilities:** Multi-provider support (OpenAI, Azure, Anthropic), streaming, tool calling
- **What you get:** Full LLM proxy with authentication, model abstraction, SSE streaming

### ✅ Feature-Complete Chat UI
- **Location:** `packages/grafana-llm-app/src/components/AppConfig/DevSandbox/DevSandboxChat.tsx`
- **Capabilities:** Message history, streaming responses, tool call visualization, error handling
- **Status:** Fully functional but hidden in config modal - needs extraction to persistent UI

### ✅ MCP Tool Ecosystem (10+ Categories)
- **Location:** `packages/grafana-llm-app/pkg/mcp/mcp.go` (registers tools from `github.com/grafana/mcp-grafana`)
- **Capabilities:**
  - `SearchTools` - Search Grafana resources
  - `DatasourceTools` - Query any datasource
  - `PrometheusTools` - PromQL queries
  - `LokiTools` - LogQL queries
  - `DashboardTools` - Create, read, update dashboards
  - `AlertingTools` - Manage alert rules
  - `IncidentTools` - Incident management integration
  - `OnCallTools` - On-call schedule integration
  - `AssertsTools` / `SiftTools` - Additional integrations

### ✅ Frontend Library
- **Package:** `@grafana/llm` (published to npm)
- **Location:** `packages/grafana-llm-frontend/src/`
- **Exports:**
  - `chatCompletions()` / `streamChatCompletions()` - LLM API
  - `MCPClientProvider` / `useMCPClient()` - MCP integration
  - `useLLMStream()` - React hook for streaming
  - Vector search utilities

### ✅ Authentication & Permissions
- **Location:** `packages/grafana-llm-app/src/plugin.json`
- **Grants:** Full IAM permissions for datasources, dashboards, alerts, users, folders, incidents

---

## 🏗️ Phase 0: Environment Setup & Baseline Understanding

**Goal:** Verify your fork works and understand the existing architecture.

### 0.1 Run Development Environment
```bash
cd /home/marc/Documents/github/grafana-llm-app

# Install dependencies
npm install

# Start dev server (watches for changes)
npm run dev

# In separate terminal, start Grafana with plugin
npm run server
```

**Verification:**
- Go to http://localhost:3000
- Navigate to Configuration → Plugins → Grafana LLM App
- Configure an LLM provider (OpenAI, Azure, or Anthropic)
- Open "Developer Sandbox" and test the chat interface

**Expected Outcome:** Chat works, can call MCP tools, streaming functions properly.

### 0.2 Study Key Files

Read and understand these critical files:

**Frontend:**
- `packages/grafana-llm-app/src/components/AppConfig/DevSandbox/DevSandboxChat.tsx` - The chat UI you'll extract
- `packages/grafana-llm-frontend/src/llm.ts` - LLM API functions
- `packages/grafana-llm-frontend/src/mcp.tsx` - MCP client provider

**Backend:**
- `packages/grafana-llm-app/pkg/plugin/plugin.go` - Main plugin entrypoint
- `packages/grafana-llm-app/pkg/mcp/mcp.go` - MCP server setup and tool registration
- `packages/grafana-llm-app/pkg/plugin/routes.go` - HTTP endpoints

**Configuration:**
- `packages/grafana-llm-app/src/plugin.json` - Plugin metadata and permissions
- `packages/grafana-llm-app/src/module.ts` - Frontend plugin registration

**Deliverable:** Understanding document (can be in your notes) mapping:
- How messages flow from UI → Backend → LLM → Response
- How MCP tools are registered and called
- What permissions the plugin has

---

## 🎨 Phase 1: Extract & Convert Chat UI to Global Sidebar

**Goal:** Make the chat accessible from anywhere in Grafana as a persistent sidebar.

### 1.1 Create Copilot Component Structure

Create new directory structure:
```
packages/grafana-llm-app/src/components/Copilot/
├── CopilotDrawer.tsx          # Main drawer/sidebar wrapper
├── CopilotChat.tsx             # Extracted from DevSandboxChat
├── CopilotMessageList.tsx      # Message display component
├── CopilotInput.tsx            # Message input box
├── CopilotToolCallView.tsx     # Tool execution visualization
├── hooks/
│   ├── useCopilotChat.ts      # Chat state management
│   ├── useGrafanaContext.ts   # Dashboard context extraction
│   └── useToolExecution.ts    # MCP tool execution logic
├── utils/
│   ├── messageFormatting.ts   # Markdown rendering, code highlighting
│   └── systemPrompts.ts       # Prompt templates
└── types.ts                    # TypeScript interfaces
```
• Implemented Phase 1 Copilot sidebar scaffolding. Key changes:

  - Added Copilot component suite (packages/grafana-llm-app/src/components/Copilot/*): chat container, message list, input with suggested prompts, tool call view, drawer, and provider with
    floating button.
  - Extracted chat logic into hooks (useCopilotChat, useToolExecution, placeholder useGrafanaContext) with streaming/tool-call handling, localStorage conversation persistence, and a base
    system prompt (utils/ and types.ts).
  - Registered the Copilot provider as an app chrome extension and exposed component via packages/grafana-llm-app/src/module.ts so the floating button/drawer can render globally.

  Tests:

  - npm run typecheck --workspace=@grafana/llm-app

  Next steps to consider:

  1. Hook real dashboard/time/variable context into useGrafanaContext and system prompts.
  2. Upgrade message rendering to full Markdown/code highlighting and richer tool-call visualization.
  3. Exercise the extension point in a running Grafana instance to confirm the floating button/drawer render and MCP calls succeed.
  
**Files to create:**

1. **`CopilotChat.tsx`** - Copy from `DevSandboxChat.tsx` and refactor:
   - Remove modal-specific code
   - Extract hooks to `useCopilotChat.ts`
   - Add conversation persistence (localStorage)
   - Improve message rendering (use `react-markdown`)

2. **`CopilotDrawer.tsx`** - New component:
   ```typescript
   import { Drawer } from '@grafana/ui';
   import { CopilotChat } from './CopilotChat';

   export const CopilotDrawer = ({ isOpen, onClose }) => {
     return (
       <Drawer
         title="Grafana Copilot"
         onClose={onClose}
         width="40%"
         scrollableContent
       >
         <CopilotChat />
       </Drawer>
     );
   };
   ```

3. **`hooks/useCopilotChat.ts`** - Extract chat logic:
   - Message history management
   - Streaming response handling
   - Tool call detection and execution
   - Error handling and timeouts
   - Conversation persistence

**Key Implementation Details:**

```typescript
// hooks/useCopilotChat.ts
import { useState, useCallback } from 'react';
import { streamChatCompletions } from '@grafana/llm';
import { useToolExecution } from './useToolExecution';
import { useGrafanaContext } from './useGrafanaContext';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string; // For tool messages
}

export const useCopilotChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { executeToolCall } = useToolExecution();
  const grafanaContext = useGrafanaContext();

  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsStreaming(true);

    // Inject system context
    const systemMessage = {
      role: 'system',
      content: `You are a Grafana observability copilot.

Current Context:
${grafanaContext.dashboard ? `- Dashboard: ${grafanaContext.dashboard.title}` : ''}
${grafanaContext.timeRange ? `- Time Range: ${grafanaContext.timeRange}` : ''}
${grafanaContext.variables ? `- Variables: ${grafanaContext.variables}` : ''}

You have access to tools for querying metrics, logs, and managing Grafana resources.`
    };

    const messagesWithContext = [systemMessage, ...newMessages];

    // Stream response
    streamChatCompletions({
      messages: messagesWithContext,
      model: 'base', // Use configured base model
      stream: true,
      tools: [], // Tools will be provided by MCP
    }).subscribe({
      next: (chunk) => {
        // Accumulate response
        // Handle tool calls if present
      },
      error: (err) => {
        console.error('Stream error:', err);
        setIsStreaming(false);
      },
      complete: () => {
        setIsStreaming(false);
      }
    });
  }, [messages, grafanaContext]);

  return { messages, sendMessage, isStreaming };
};
```

### 1.2 Register Global Extension Point

**File:** `packages/grafana-llm-app/src/module.ts`

Add app extension to make chat accessible globally:

```typescript
import { AppPlugin, AppRootProps } from '@grafana/data';
import { CopilotProvider } from './components/Copilot/CopilotProvider';

export const plugin = new AppPlugin<{}>()
  .setRootPage((props: AppRootProps) => <RootComponent {...props} />)
  .addConfigPage({
    title: 'Configuration',
    icon: 'cog',
    body: AppConfig,
    id: 'configuration',
  })
  .addConfigPage({
    title: 'MCP Tools',
    icon: 'list-ul',
    body: MCPToolsPage,
    id: 'mcp-tools',
  })
  // NEW: Add global component that renders copilot button + drawer
  .exposeComponent((props) => <CopilotProvider {...props} />);
```

**File:** `packages/grafana-llm-app/src/components/Copilot/CopilotProvider.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { Button } from '@grafana/ui';
import { CopilotDrawer } from './CopilotDrawer';
import { MCPClientProvider } from '@grafana/llm';

export const CopilotProvider = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MCPClientProvider>
      {/* Floating button (bottom-right corner) */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
        <Button
          icon="comment-alt"
          onClick={() => setIsOpen(true)}
          size="lg"
          variant="primary"
        >
          Copilot
        </Button>
      </div>

      {/* Drawer */}
      <CopilotDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </MCPClientProvider>
  );
};
```

**Alternative:** Use Grafana's command palette integration (more advanced):
- Add keyboard shortcut (Cmd+K → "Ask Copilot")
- Requires Grafana 10.3+ and additional plugin configuration

### 1.3 Add Conversation Persistence

**File:** `packages/grafana-llm-app/src/components/Copilot/utils/conversationStorage.ts` (NEW)

```typescript
const STORAGE_KEY = 'grafana-copilot-conversations';

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export const saveConversation = (conversation: Conversation) => {
  const existing = getConversations();
  const updated = existing.filter(c => c.id !== conversation.id);
  updated.unshift(conversation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50))); // Keep last 50
};

export const getConversations = (): Conversation[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const deleteConversation = (id: string) => {
  const existing = getConversations();
  const filtered = existing.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
```

**Integrate into `useCopilotChat.ts`:**
- Auto-save after each message
- Auto-generate title from first user message
- Add "New Conversation" button
- Add conversation history sidebar

### 1.4 Testing Phase 1

**Manual Tests:**
1. Open Grafana → See copilot button in bottom-right
2. Click button → Drawer opens
3. Type "Hello" → LLM responds
4. Close drawer → Reopen → Conversation persists
5. Navigate to different page → Button still present

**Expected Deliverables:**
- ✅ Copilot accessible from any Grafana page
- ✅ Chat UI with streaming responses
- ✅ Conversation persistence
- ✅ Basic error handling

---

## 🧠 Phase 2: Dashboard Context Awareness

**Goal:** Make the copilot automatically aware of what dashboard/panel the user is viewing.

### 2.1 Create Context Extraction Utilities

**File:** `packages/grafana-llm-app/src/components/Copilot/hooks/useGrafanaContext.ts` (NEW)

```typescript
import { useEffect, useState } from 'react';
import { locationService, getTemplateSrv } from '@grafana/runtime';
import { getBackendSrv } from '@grafana/runtime';

interface GrafanaContext {
  dashboard?: {
    uid: string;
    title: string;
    panels: Array<{ id: number; title: string; type: string }>;
  };
  timeRange?: string;
  variables?: Record<string, string>;
  datasources?: string[];
  url: string;
}

export const useGrafanaContext = (): GrafanaContext => {
  const [context, setContext] = useState<GrafanaContext>({ url: '' });

  useEffect(() => {
    const updateContext = async () => {
      const location = locationService.getLocation();
      const newContext: GrafanaContext = { url: location.pathname };

      // Extract dashboard UID from URL
      const dashboardUidMatch = location.pathname.match(/\/d\/([^/]+)/);
      if (dashboardUidMatch) {
        const uid = dashboardUidMatch[1];

        try {
          // Fetch dashboard details
          const dashboard = await getBackendSrv().get(`/api/dashboards/uid/${uid}`);
          newContext.dashboard = {
            uid,
            title: dashboard.dashboard.title,
            panels: dashboard.dashboard.panels.map((p: any) => ({
              id: p.id,
              title: p.title || `Panel ${p.id}`,
              type: p.type,
            })),
          };
        } catch (err) {
          console.warn('Could not fetch dashboard context:', err);
        }
      }

      // Get template variables
      const variables = getTemplateSrv().getVariables();
      if (variables.length > 0) {
        newContext.variables = variables.reduce((acc: any, v: any) => {
          acc[v.name] = v.current?.value;
          return acc;
        }, {});
      }

      // Get time range from URL params
      const searchParams = new URLSearchParams(location.search);
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      if (from && to) {
        newContext.timeRange = `${from} to ${to}`;
      }

      setContext(newContext);
    };

    updateContext();

    // Re-run when URL changes
    const unsubscribe = locationService.getHistory().listen(updateContext);
    return () => unsubscribe();
  }, []);

  return context;
};
```

### 2.2 Inject Context into System Prompt

**File:** `packages/grafana-llm-app/src/components/Copilot/utils/systemPrompts.ts` (NEW)

```typescript
import { GrafanaContext } from '../hooks/useGrafanaContext';

export const buildSystemPrompt = (context: GrafanaContext): string => {
  let prompt = `You are the Grafana Copilot, an expert observability assistant.

Your role is to help users:
- Query and analyze metrics and logs
- Create and modify dashboards
- Troubleshoot issues
- Set up alerts
- Understand Grafana concepts

You have access to tools via MCP (Model Context Protocol) that let you:
- Query Prometheus datasources (prometheus_query_range, prometheus_query_instant)
- Query Loki logs (loki_query_range)
- Search Grafana resources (grafana_search)
- Read dashboard definitions (grafana_get_dashboard)
- Create/update dashboards (grafana_create_dashboard, grafana_update_dashboard)
- Manage alerts (grafana_list_alert_rules, grafana_create_alert_rule)

When using tools:
- Always explain what you're doing before calling a tool
- Interpret results for the user in plain language
- If a query returns no data, help debug (wrong datasource? wrong time range?)
- Suggest next steps or related queries

`;

  // Add current context
  if (context.dashboard) {
    prompt += `\nCURRENT CONTEXT:\n`;
    prompt += `- User is viewing dashboard: "${context.dashboard.title}" (UID: ${context.dashboard.uid})\n`;
    prompt += `- Panels on this dashboard:\n`;
    context.dashboard.panels.forEach(p => {
      prompt += `  • ${p.title} (${p.type})\n`;
    });
  }

  if (context.variables) {
    prompt += `- Template variables:\n`;
    Object.entries(context.variables).forEach(([key, value]) => {
      prompt += `  • $${key} = ${value}\n`;
    });
  }

  if (context.timeRange) {
    prompt += `- Time range: ${context.timeRange}\n`;
  }

  prompt += `\nWhen the user asks questions without specifying a dashboard, assume they mean the current dashboard shown above.`;

  return prompt;
};
```

**Update `useCopilotChat.ts`:**
```typescript
const systemMessage = {
  role: 'system',
  content: buildSystemPrompt(grafanaContext)
};
```

### 2.3 Add Contextual Suggestions

**File:** `packages/grafana-llm-app/src/components/Copilot/CopilotInput.tsx`

Add suggested prompts based on context:

```typescript
const getSuggestedPrompts = (context: GrafanaContext): string[] => {
  if (context.dashboard) {
    return [
      `Summarize what this dashboard shows`,
      `Are there any unusual patterns in the metrics?`,
      `Create an alert for high CPU usage`,
      `Show me error logs from the last hour`,
    ];
  }
  return [
    'Create a new dashboard for monitoring',
    'List all Prometheus datasources',
    'Show me recent alerts',
  ];
};
```

Display as clickable chips below the input box.

### 2.4 Testing Phase 2

**Test Scenarios:**

1. **Dashboard Context:**
   - Navigate to a dashboard
   - Open copilot
   - Ask: "What does this dashboard show?"
   - Expected: LLM describes the dashboard using fetched metadata

2. **Panel Context:**
   - Ask: "Explain panel 1"
   - Expected: LLM uses dashboard context to identify panel 1

3. **Variables:**
   - Set template variable (e.g., `$host=server-1`)
   - Ask: "Show me CPU for this host"
   - Expected: LLM uses `$host` value in queries

4. **Time Range:**
   - Change dashboard time range to "Last 24 hours"
   - Ask: "Query metrics"
   - Expected: Queries use the dashboard's time range

**Deliverables:**
- ✅ Automatic context extraction
- ✅ Context-aware system prompts
- ✅ Suggested prompts based on context
- ✅ Dashboard/panel awareness

---

## 🧰 Phase 3: Enable MCP Tool Usage

**Goal:** Ensure all MCP tools work correctly and the LLM can use them effectively.

### 3.1 Verify MCP Tool Registration

**File:** `packages/grafana-llm-app/pkg/mcp/mcp.go`

Ensure all required tools are registered:

```go
func setupMCPServer(ctx context.Context, pluginCtx backend.PluginContext, appSettings *config.AppSettings) (*server.MCPServer, error) {
    srv := server.NewMCPServer(
        "grafana-llm-app",
        "1.0.0",
    )

    // Register all tool categories
    tools.AddSearchTools(srv)        // grafana_search
    tools.AddDatasourceTools(srv)    // datasource_query
    tools.AddPrometheusTools(srv)    // prometheus_query_range, prometheus_query_instant
    tools.AddLokiTools(srv)          // loki_query_range
    tools.AddDashboardTools(srv)     // grafana_get_dashboard, grafana_create_dashboard, etc.
    tools.AddAlertingTools(srv)      // grafana_list_alert_rules, grafana_create_alert_rule
    tools.AddIncidentTools(srv)      // Incident management
    tools.AddOnCallTools(srv)        // On-call schedules
    // Add more as needed...

    return srv, nil
}
```

**Verify in UI:**
- Navigate to Configuration → Grafana LLM App → MCP Tools
- Should see list of all available tools with descriptions

### 3.2 Configure MCP Client in Frontend

**File:** `packages/grafana-llm-app/src/components/Copilot/CopilotProvider.tsx`

Update to properly initialize MCP client:

```typescript
import { MCPClientProvider, StreamableHTTPClientTransport } from '@grafana/llm';
import { getBackendSrv } from '@grafana/runtime';

const transport = new StreamableHTTPClientTransport(
  '/api/plugins/grafana-llm-app/resources/mcp/grafana',
  {
    fetch: (url, options) => {
      return getBackendSrv().fetch({
        url,
        method: options?.method || 'POST',
        data: options?.body,
      }).toPromise();
    },
  }
);

export const CopilotProvider = () => {
  return (
    <MCPClientProvider transport={transport}>
      {/* Copilot UI */}
    </MCPClientProvider>
  );
};
```

### 3.3 Implement Tool Execution Loop

**File:** `packages/grafana-llm-app/src/components/Copilot/hooks/useToolExecution.ts` (NEW)

```typescript
import { useMCPClient } from '@grafana/llm';
import { useCallback } from 'react';

export const useToolExecution = () => {
  const mcpClient = useMCPClient();

  const executeToolCall = useCallback(async (toolName: string, parameters: any) => {
    if (!mcpClient) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await mcpClient.callTool({
        name: toolName,
        arguments: parameters,
      });

      return result;
    } catch (error) {
      console.error(`Tool execution failed: ${toolName}`, error);
      throw error;
    }
  }, [mcpClient]);

  return { executeToolCall };
};
```

**Update `useCopilotChat.ts`** to handle tool calls:

```typescript
// When streaming response contains tool calls:
streamChatCompletions({
  messages: messagesWithContext,
  model: 'base',
  stream: true,
}).subscribe({
  next: (chunk) => {
    if (chunk.choices?.[0]?.delta?.tool_calls) {
      // Tool call detected
      const toolCalls = chunk.choices[0].delta.tool_calls;

      toolCalls.forEach(async (toolCall) => {
        // Execute tool
        const result = await executeToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );

        // Add tool response to conversation
        const toolMessage = {
          role: 'tool',
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
          name: toolCall.function.name,
        };

        // Continue conversation with tool result
        // LLM will interpret the result and respond to user
        continueConversationWithToolResult(toolMessage);
      });
    }
  }
});
```

### 3.4 Add Tool Call Visualization

**File:** `packages/grafana-llm-app/src/components/Copilot/CopilotToolCallView.tsx` (NEW)

Copy and adapt from `DevSandboxToolInspector.tsx`:

```typescript
import { Alert, Collapse, CodeEditor } from '@grafana/ui';

export const CopilotToolCallView = ({ toolCall, result }) => {
  return (
    <div style={{ margin: '8px 0', padding: '8px', background: '#f5f5f5' }}>
      <Collapse label={`🔧 ${toolCall.name}`} isOpen={false}>
        <div>
          <strong>Parameters:</strong>
          <CodeEditor
            value={JSON.stringify(toolCall.arguments, null, 2)}
            language="json"
            height="100px"
            readOnly
            showLineNumbers={false}
          />

          <strong>Result:</strong>
          <CodeEditor
            value={JSON.stringify(result, null, 2)}
            language="json"
            height="200px"
            readOnly
            showLineNumbers={false}
          />
        </div>
      </Collapse>
    </div>
  );
};
```

Integrate into `CopilotMessageList.tsx` to show tool calls inline with messages.

### 3.5 Test Common Tool Workflows

**Test Cases:**

1. **Prometheus Query:**
   - User: "What's the CPU usage for server-1?"
   - Expected: LLM calls `prometheus_query_instant` with appropriate PromQL
   - Expected: LLM interprets results and explains in plain language

2. **Loki Logs:**
   - User: "Show me error logs from the last 10 minutes"
   - Expected: LLM calls `loki_query_range` with LogQL
   - Expected: LLM summarizes log entries

3. **Dashboard Search:**
   - User: "Find dashboards related to Kubernetes"
   - Expected: LLM calls `grafana_search` with query="Kubernetes"
   - Expected: LLM lists found dashboards

4. **Dashboard Creation:**
   - User: "Create a dashboard to monitor nginx"
   - Expected: LLM calls `grafana_create_dashboard` with appropriate JSON
   - Expected: LLM confirms creation and provides link

5. **Alert Management:**
   - User: "List all critical alerts"
   - Expected: LLM calls `grafana_list_alert_rules` with filters
   - Expected: LLM presents results in readable format

**Deliverables:**
- ✅ All MCP tools callable from chat
- ✅ Tool execution loop handles multi-step workflows
- ✅ Tool calls visualized in UI
- ✅ Error handling for failed tool calls
- ✅ Common workflows tested and working

---

## 📚 Phase 4: Company Knowledge Base Integration

**Goal:** Allow copilot to search internal documentation, runbooks, and incident reports.

### 4.1 Extend Vector Service for Knowledge Base

**File:** `packages/grafana-llm-app/pkg/plugin/vector/knowledge.go` (NEW)

```go
package vector

import (
    "context"
    "fmt"
)

type KnowledgeDocument struct {
    ID          string            `json:"id"`
    Content     string            `json:"content"`
    Title       string            `json:"title"`
    Source      string            `json:"source"`      // "runbook", "docs", "incident"
    Metadata    map[string]string `json:"metadata"`
    Embedding   []float32         `json:"-"`
}

type KnowledgeBaseService struct {
    vectorService *Service
    collectionName string
}

func NewKnowledgeBaseService(vectorService *Service) *KnowledgeBaseService {
    return &KnowledgeBaseService{
        vectorService: vectorService,
        collectionName: "grafana_knowledge_base",
    }
}

func (s *KnowledgeBaseService) IngestDocument(ctx context.Context, doc KnowledgeDocument) error {
    // Generate embedding for document content
    embedding, err := s.vectorService.embedder.Embed(ctx, doc.Content)
    if err != nil {
        return fmt.Errorf("failed to generate embedding: %w", err)
    }

    doc.Embedding = embedding

    // Store in vector database
    return s.vectorService.store.Upsert(ctx, s.collectionName, []VectorPoint{
        {
            ID:      doc.ID,
            Vector:  doc.Embedding,
            Payload: map[string]interface{}{
                "content":  doc.Content,
                "title":    doc.Title,
                "source":   doc.Source,
                "metadata": doc.Metadata,
            },
        },
    })
}

func (s *KnowledgeBaseService) Search(ctx context.Context, query string, limit int) ([]KnowledgeDocument, error) {
    // Generate embedding for query
    queryEmbedding, err := s.vectorService.embedder.Embed(ctx, query)
    if err != nil {
        return nil, fmt.Errorf("failed to generate query embedding: %w", err)
    }

    // Search vector database
    results, err := s.vectorService.store.Search(ctx, s.collectionName, queryEmbedding, limit)
    if err != nil {
        return nil, fmt.Errorf("search failed: %w", err)
    }

    // Convert results to documents
    docs := make([]KnowledgeDocument, len(results))
    for i, result := range results {
        docs[i] = KnowledgeDocument{
            ID:      result.ID,
            Content: result.Payload["content"].(string),
            Title:   result.Payload["title"].(string),
            Source:  result.Payload["source"].(string),
            Metadata: result.Payload["metadata"].(map[string]string),
        }
    }

    return docs, nil
}
```

### 4.2 Add MCP Tools for Knowledge Base

**File:** `packages/grafana-llm-app/pkg/mcp/knowledge_tools.go` (NEW)

```go
package mcp

import (
    "context"
    "encoding/json"
    "github.com/grafana/grafana-llm-app/pkg/plugin/vector"
    "github.com/mark3labs/mcp-go/server"
)

func AddKnowledgeBaseTools(srv *server.MCPServer, kbService *vector.KnowledgeBaseService) {
    // Tool: Search knowledge base
    srv.AddTool(server.Tool{
        Name: "search_knowledge_base",
        Description: "Search internal documentation, runbooks, and incident reports. Use this when the user asks questions that might be answered by company-specific documentation.",
        InputSchema: server.ToolInputSchema{
            Type: "object",
            Properties: map[string]interface{}{
                "query": map[string]interface{}{
                    "type":        "string",
                    "description": "The search query",
                },
                "limit": map[string]interface{}{
                    "type":        "number",
                    "description": "Maximum number of results to return (default: 5)",
                },
                "source": map[string]interface{}{
                    "type":        "string",
                    "description": "Filter by source type: 'runbook', 'docs', or 'incident'",
                    "enum":        []string{"runbook", "docs", "incident"},
                },
            },
            Required: []string{"query"},
        },
    }, func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
        query := params["query"].(string)
        limit := 5
        if l, ok := params["limit"].(float64); ok {
            limit = int(l)
        }

        docs, err := kbService.Search(ctx, query, limit)
        if err != nil {
            return nil, err
        }

        return map[string]interface{}{
            "results": docs,
            "count":   len(docs),
        }, nil
    })

    // Tool: Ingest document (for admin/ingestion pipeline)
    srv.AddTool(server.Tool{
        Name: "ingest_knowledge_document",
        Description: "Add a document to the knowledge base. Requires admin permissions.",
        InputSchema: server.ToolInputSchema{
            Type: "object",
            Properties: map[string]interface{}{
                "title": map[string]interface{}{
                    "type":        "string",
                    "description": "Document title",
                },
                "content": map[string]interface{}{
                    "type":        "string",
                    "description": "Document content (markdown supported)",
                },
                "source": map[string]interface{}{
                    "type":        "string",
                    "description": "Source type",
                    "enum":        []string{"runbook", "docs", "incident"},
                },
                "metadata": map[string]interface{}{
                    "type":        "object",
                    "description": "Additional metadata (tags, author, date, etc.)",
                },
            },
            Required: []string{"title", "content", "source"},
        },
    }, func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
        // Parse parameters
        doc := vector.KnowledgeDocument{
            ID:      generateID(),
            Title:   params["title"].(string),
            Content: params["content"].(string),
            Source:  params["source"].(string),
            Metadata: params["metadata"].(map[string]string),
        }

        err := kbService.IngestDocument(ctx, doc)
        if err != nil {
            return nil, err
        }

        return map[string]interface{}{
            "success": true,
            "id":      doc.ID,
        }, nil
    })
}
```

**Register in `mcp.go`:**
```go
func setupMCPServer(...) {
    // ... existing tools ...

    // Initialize knowledge base service
    kbService := vector.NewKnowledgeBaseService(vectorService)
    AddKnowledgeBaseTools(srv, kbService)
}
```

### 4.3 Update System Prompt for RAG

**File:** `packages/grafana-llm-app/src/components/Copilot/utils/systemPrompts.ts`

```typescript
export const buildSystemPrompt = (context: GrafanaContext): string => {
  let prompt = `You are the Grafana Copilot, an expert observability assistant.

...

KNOWLEDGE BASE ACCESS:
When users ask questions that might be answered by internal documentation:
1. Use the "search_knowledge_base" tool to find relevant documents
2. Always cite your sources when using knowledge base information
3. If knowledge base has no relevant info, say so clearly

Examples:
- "How do we handle database failover?" → Search knowledge base for runbooks
- "What's our SLO for API latency?" → Search knowledge base for docs
- "How did we resolve the outage last month?" → Search knowledge base for incidents

...`;

  return prompt;
};
```

### 4.4 Create Document Ingestion Pipeline

**Option A: CLI Tool for Bulk Ingestion**

**File:** `packages/grafana-llm-app/scripts/ingest-knowledge.ts` (NEW)

```typescript
#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { getBackendSrv } from '@grafana/runtime';

interface IngestConfig {
  docsPath: string;      // Path to markdown docs
  runbooksPath: string;  // Path to runbooks
  incidentsPath: string; // Path to incident reports
}

async function ingestDirectory(dirPath: string, source: string) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const title = file.replace('.md', '');

      await getBackendSrv().post('/api/plugins/grafana-llm-app/resources/knowledge/ingest', {
        title,
        content,
        source,
        metadata: {
          filename: file,
          ingestedAt: new Date().toISOString(),
        },
      });

      console.log(`✅ Ingested: ${title}`);
    }
  }
}

async function main() {
  const config: IngestConfig = JSON.parse(
    fs.readFileSync('./knowledge-config.json', 'utf-8')
  );

  console.log('📚 Ingesting knowledge base...');

  await ingestDirectory(config.docsPath, 'docs');
  await ingestDirectory(config.runbooksPath, 'runbook');
  await ingestDirectory(config.incidentsPath, 'incident');

  console.log('✨ Ingestion complete!');
}

main();
```

**Usage:**
```bash
# Create config
cat > knowledge-config.json << EOF
{
  "docsPath": "/path/to/your/docs",
  "runbooksPath": "/path/to/your/runbooks",
  "incidentsPath": "/path/to/your/incident-reports"
}
EOF

# Run ingestion
ts-node scripts/ingest-knowledge.ts
```

**Option B: UI for Document Upload**

Add admin page in plugin for uploading documents via web UI.

### 4.5 Test Knowledge Base Integration

**Test Workflow:**

1. **Ingest Sample Documents:**
   ```bash
   mkdir -p /tmp/test-kb/docs
   echo "# Database Failover Procedure\n\n1. Check replication lag\n2. Promote standby\n3. Update DNS" > /tmp/test-kb/docs/db-failover.md

   # Ingest
   ts-node scripts/ingest-knowledge.ts
   ```

2. **Test Search:**
   - Open copilot
   - Ask: "How do we handle database failover?"
   - Expected: LLM calls `search_knowledge_base`, finds document, explains procedure

3. **Test Citation:**
   - Expected: LLM response includes: "According to our runbook 'Database Failover Procedure'..."

**Deliverables:**
- ✅ Vector-based knowledge base storage
- ✅ MCP tools for searching knowledge base
- ✅ Ingestion pipeline for bulk document upload
- ✅ RAG integration in copilot (retrieval + generation)
- ✅ Source citation in responses

---

## 🎨 Phase 5: UX Polish & Enhancement

**Goal:** Make the copilot delightful to use with professional UI/UX.

### 5.1 Improve Message Rendering

**File:** `packages/grafana-llm-app/src/components/Copilot/CopilotMessageList.tsx`

**Add:**
- ✅ Markdown rendering (use `react-markdown`)
- ✅ Syntax highlighting for code blocks (use `react-syntax-highlighter`)
- ✅ Copy button for code snippets
- ✅ Timestamps on messages
- ✅ Typing indicator while LLM is responding
- ✅ Error messages with retry button

**Example:**
```typescript
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const CopilotMessageList = ({ messages }) => {
  return (
    <div>
      {messages.map((msg, idx) => (
        <div key={idx} className={`message message-${msg.role}`}>
          <div className="message-header">
            <span className="role">{msg.role}</span>
            <span className="timestamp">{formatTime(msg.timestamp)}</span>
          </div>
          <div className="message-content">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => copyToClipboard(String(children))}
                        style={{ position: 'absolute', top: 5, right: 5 }}
                      >
                        Copy
                      </button>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 5.2 Add Conversation Management

**Features:**
- ✅ "New Conversation" button
- ✅ Conversation history sidebar (list of past conversations)
- ✅ Search through conversation history
- ✅ Delete conversations
- ✅ Rename conversations

**File:** `packages/grafana-llm-app/src/components/Copilot/CopilotHistory.tsx` (NEW)

### 5.3 Add Keyboard Shortcuts

```typescript
// In CopilotDrawer.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + K to open copilot
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }

    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen]);
```

### 5.4 Add Suggested Actions

After certain responses, show action buttons:

```typescript
// Example: After LLM describes a dashboard
{msg.role === 'assistant' && msg.content.includes('dashboard') && (
  <div className="suggested-actions">
    <Button size="sm" onClick={() => navigateToDashboard()}>
      Open Dashboard
    </Button>
    <Button size="sm" variant="secondary" onClick={() => sendMessage('Create a similar dashboard')}>
      Create Similar
    </Button>
  </div>
)}
```

### 5.5 Add Loading States & Error Handling

- ✅ Skeleton loaders while fetching context
- ✅ Error boundaries for component crashes
- ✅ Retry logic for failed API calls
- ✅ Graceful degradation when LLM is unavailable

### 5.6 Add Analytics/Telemetry (Optional)

Track usage for improvement:
- Most common queries
- Tool usage frequency
- Error rates
- Response times

**Deliverables:**
- ✅ Professional message rendering
- ✅ Conversation management UI
- ✅ Keyboard shortcuts
- ✅ Suggested actions
- ✅ Robust error handling

---

## 🧪 Phase 6: Testing & Documentation

**Goal:** Ensure reliability and provide documentation for users and developers.

### 6.1 Automated Tests

**Frontend Tests:**

**File:** `packages/grafana-llm-app/src/components/Copilot/__tests__/useCopilotChat.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCopilotChat } from '../hooks/useCopilotChat';

describe('useCopilotChat', () => {
  it('should add user message to history', () => {
    const { result } = renderHook(() => useCopilotChat());

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello');
  });

  it('should handle streaming responses', async () => {
    // Test streaming logic
  });

  it('should execute tool calls', async () => {
    // Test tool execution
  });
});
```

**Backend Tests:**

**File:** `packages/grafana-llm-app/pkg/mcp/knowledge_tools_test.go`

```go
func TestKnowledgeBaseSearch(t *testing.T) {
    kbService := setupTestKnowledgeBase(t)

    // Ingest test document
    doc := vector.KnowledgeDocument{
        ID:      "test-1",
        Title:   "Test Runbook",
        Content: "This is a test runbook about database failover",
        Source:  "runbook",
    }
    err := kbService.IngestDocument(context.Background(), doc)
    require.NoError(t, err)

    // Search
    results, err := kbService.Search(context.Background(), "database failover", 5)
    require.NoError(t, err)
    assert.Len(t, results, 1)
    assert.Equal(t, "Test Runbook", results[0].Title)
}
```

**E2E Tests:**

**File:** `packages/grafana-llm-app/tests/copilot.spec.ts`

```typescript
import { test, expect } from '@grafana/plugin-e2e';

test('copilot should open and respond to messages', async ({ page }) => {
  await page.goto('/');

  // Click copilot button
  await page.click('button:has-text("Copilot")');

  // Wait for drawer
  await expect(page.locator('[data-testid="copilot-drawer"]')).toBeVisible();

  // Type message
  await page.fill('[data-testid="copilot-input"]', 'Hello');
  await page.click('[data-testid="copilot-send"]');

  // Wait for response
  await expect(page.locator('[data-testid="copilot-message"]')).toContainText('assistant');
});
```

### 6.2 User Documentation

**File:** `COPILOT_USER_GUIDE.md` (NEW)

```markdown
# Grafana Copilot User Guide

## Getting Started

### Opening the Copilot
- Click the "Copilot" button in the bottom-right corner of any Grafana page
- Or press `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)

### Asking Questions

The copilot understands natural language questions about your Grafana environment:

**Metrics & Logs:**
- "What's the CPU usage for server-1 over the last hour?"
- "Show me error logs from the nginx service"
- "Are there any anomalies in the API latency metrics?"

**Dashboards:**
- "Create a dashboard for monitoring PostgreSQL"
- "What does this dashboard show?" (when viewing a dashboard)
- "Add a panel showing memory usage to this dashboard"

**Alerts:**
- "List all critical alerts"
- "Create an alert for high disk usage"
- "Why did the API alert fire?"

**Knowledge Base:**
- "How do we handle database failover?"
- "What's our SLO for the payment service?"
- "Show me the runbook for incident response"

### Dashboard Context

When you open the copilot while viewing a dashboard, it automatically knows:
- Which dashboard you're viewing
- The current time range
- Template variable values
- Configured datasources

This means you can ask contextual questions like:
- "Summarize this dashboard" ✅
- "What's unusual here?" ✅
- "Zoom in on panel 3" ✅

### Tips for Best Results

1. **Be specific:** Instead of "show metrics", say "show CPU metrics for the web-server pod"
2. **Use context:** The copilot knows where you are in Grafana
3. **Follow up:** You can have multi-turn conversations - "Now do the same for memory"
4. **Check sources:** When the copilot cites knowledge base docs, verify the information

## Troubleshooting

**Copilot not responding:**
- Check that an LLM provider is configured (Configuration → Plugins → Grafana LLM App)
- Verify API keys are valid

**Tool calls failing:**
- Ensure your Grafana user has appropriate permissions
- Check datasource connectivity

**No knowledge base results:**
- Verify documents have been ingested (ask an admin)
- Try different search terms
```

### 6.3 Developer Documentation

**File:** `COPILOT_DEVELOPER_GUIDE.md` (NEW)

Include:
- Architecture overview
- How to add new MCP tools
- How to modify system prompts
- How to extend context extraction
- How to add new conversation features

### 6.4 Performance Testing

**Benchmarks to measure:**
- Time to first token (TTFT) for LLM responses
- Tool execution latency
- Context extraction overhead
- Vector search performance (knowledge base)

**Targets:**
- TTFT < 1 second
- Tool execution < 2 seconds
- Context extraction < 100ms

### 6.5 Security Review

**Checklist:**
- ✅ API keys stored securely (encrypted in Grafana)
- ✅ MCP tool calls require authentication
- ✅ User can only access resources they have permissions for
- ✅ No PII logged in LLM requests
- ✅ Rate limiting on LLM requests
- ✅ Input sanitization on user messages

**Deliverables:**
- ✅ Automated test suite (unit, integration, E2E)
- ✅ User documentation
- ✅ Developer documentation
- ✅ Performance benchmarks
- ✅ Security review completed

---

## 🚀 Phase 7: Deployment & Rollout

**Goal:** Package the copilot and deploy to production.

### 7.1 Build & Package

```bash
# Build all packages
npm run build:all

# Run tests
npm run test:ci

# Package plugin
cd packages/grafana-llm-app
npm run build
npm run sign  # If plugin signing is required

# Create release archive
npm pack
```

**Output:** `grafana-llm-app-x.x.x.tgz`

### 7.2 Installation

**Option A: Local Installation**
```bash
# Extract to Grafana plugins directory
unzip grafana-llm-app-x.x.x.zip -d /var/lib/grafana/plugins/

# Restart Grafana
systemctl restart grafana-server

# Enable plugin
grafana-cli plugins enable grafana-llm-app
```

**Option B: Grafana Cloud**
- Upload plugin via Grafana Cloud UI
- Configure via plugin settings

### 7.3 Configuration

1. **LLM Provider:**
   - Navigate to Configuration → Plugins → Grafana LLM App
   - Choose provider (OpenAI, Azure, Anthropic)
   - Enter API key
   - Test connection

2. **Vector Service (for Knowledge Base):**
   - Start Qdrant or configure Grafana VectorAPI
   - Update plugin settings with connection details

3. **Knowledge Base:**
   - Run ingestion script to load initial documents
   - Verify search works via MCP Tools page

### 7.4 User Training

- Create demo video showing common workflows
- Host training session for early adopters
- Provide quick reference guide

### 7.5 Monitoring

**Track:**
- Plugin usage (number of active users)
- LLM request volume and latency
- Tool call success rates
- Error rates
- User feedback/issues

**Set up alerts for:**
- High error rates
- LLM API failures
- Slow response times

### 7.6 Feedback Loop

- Create feedback form in copilot UI ("Was this helpful?")
- Monitor GitHub issues for bug reports
- Iterate based on user feedback

**Deliverables:**
- ✅ Packaged plugin ready for deployment
- ✅ Installation guide
- ✅ Configuration documentation
- ✅ Monitoring setup
- ✅ User training materials

---

## 🔮 Future Enhancements (Post-MVP)

### Proactive Anomaly Detection
- Background jobs that continuously monitor metrics
- LLM-based anomaly interpretation
- Proactive notifications: "I detected unusual CPU spike on server-3"
- Integration with Grafana's built-in anomaly detection

### Advanced Dashboard Generation
- "Generate dashboard from logs" - analyze log patterns, create panels
- Template library for common use cases
- AI-powered layout optimization

### Collaborative Features
- Share conversations with team members
- Conversation comments and annotations
- Team knowledge base contributions

### Multi-Agent System
- Specialized agents: Dashboard Agent, Alert Agent, Query Agent
- Agent orchestration for complex tasks
- Agent can delegate to specialists

### Advanced RAG
- Fine-tune embeddings on company data
- Hybrid search (vector + keyword)
- Automatic knowledge base updates from incidents

### Voice Interface
- Voice-to-text for queries
- Text-to-speech for responses
- Hands-free operation mode

---

## 📅 Suggested Timeline

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 0 | 2-3 days | Dev environment working, codebase understood |
| Phase 1 | 1-2 weeks | Persistent chat UI accessible globally |
| Phase 2 | 3-5 days | Dashboard context awareness |
| Phase 3 | 1 week | All MCP tools working, tool execution loop complete |
| Phase 4 | 1-2 weeks | Knowledge base integration with RAG |
| Phase 5 | 1 week | UX polish, conversation management |
| Phase 6 | 1 week | Testing, documentation |
| Phase 7 | 3-5 days | Deployment, training, monitoring |

**Total: 6-8 weeks to MVP**

---

## 🧠 Key Success Factors

### What Makes This Approach Different

1. **Leverage Existing Infrastructure:** Don't rebuild what's already there (LLM proxy, MCP tools)
2. **Start with UX:** Extract working chat UI first, then enhance
3. **Context is King:** Auto-inject dashboard/panel context for relevant responses
4. **Tool-Powered:** MCP tools give LLM "hands" to interact with Grafana
5. **Knowledge-Aware:** RAG integration makes copilot company-specific

### Common Pitfalls to Avoid

❌ **Don't:**
- Rebuild LLM infrastructure from scratch
- Send entire dashboard JSON to LLM (too many tokens)
- Forget to test tool execution loop thoroughly
- Skip conversation persistence (bad UX)
- Ignore context extraction (makes copilot generic)

✅ **Do:**
- Start simple, iterate based on feedback
- Test with real users early
- Monitor LLM costs and latency
- Document prompts and tool capabilities
- Version system prompts (they'll evolve)

---

## 📚 Resources

### Official Documentation
- [Grafana Plugin Development](https://grafana.com/developers/plugin-tools/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

### Example Projects
- [grafana-llmexamples-app](https://github.com/grafana/grafana-llmexamples-app)
- [mcp-grafana](https://github.com/grafana/mcp-grafana)

### Internal Files to Reference
- `packages/grafana-llm-app/src/components/AppConfig/DevSandbox/DevSandboxChat.tsx` - Working chat implementation
- `packages/grafana-llm-frontend/src/llm.ts` - LLM API reference
- `packages/grafana-llm-frontend/src/mcp.tsx` - MCP client usage
- `packages/grafana-llm-app/pkg/mcp/mcp.go` - Tool registration patterns

---

## 🎯 Checklist for First Release

Use this checklist to track progress:

### Phase 0: Setup
- [ ] Dev environment running (`npm run dev` + `npm run server`)
- [ ] LLM provider configured and working
- [ ] DevSandbox chat tested and functional
- [ ] Codebase architecture understood

### Phase 1: Chat UI
- [ ] `CopilotDrawer` component created
- [ ] `CopilotChat` extracted and refactored
- [ ] Global button/shortcut to open copilot
- [ ] Conversation persistence working
- [ ] Basic message rendering

### Phase 2: Context Awareness
- [ ] `useGrafanaContext` hook implemented
- [ ] Dashboard metadata extraction working
- [ ] Template variable extraction working
- [ ] Time range extraction working
- [ ] Context injected into system prompt
- [ ] Suggested prompts based on context

### Phase 3: MCP Tools
- [ ] MCP client configured in frontend
- [ ] Tool execution loop implemented
- [ ] Prometheus tools tested
- [ ] Loki tools tested
- [ ] Dashboard tools tested
- [ ] Alert tools tested
- [ ] Tool call visualization in UI

### Phase 4: Knowledge Base
- [ ] Vector service extended for knowledge base
- [ ] MCP tools for search/ingest created
- [ ] Document ingestion pipeline built
- [ ] Sample documents ingested
- [ ] RAG working in copilot
- [ ] Source citations working

### Phase 5: UX Polish
- [ ] Markdown rendering with syntax highlighting
- [ ] Code copy buttons
- [ ] Conversation management (new/delete/rename)
- [ ] Keyboard shortcuts (Cmd+K to open)
- [ ] Typing indicators
- [ ] Error handling with retry
- [ ] Suggested actions after responses

### Phase 6: Testing & Docs
- [ ] Unit tests for hooks
- [ ] Backend tests for knowledge base
- [ ] E2E tests for copilot workflow
- [ ] User documentation written
- [ ] Developer documentation written
- [ ] Performance benchmarked
- [ ] Security reviewed

### Phase 7: Deployment
- [ ] Plugin built and packaged
- [ ] Installation guide written
- [ ] Monitoring configured
- [ ] User training completed
- [ ] Feedback mechanism in place

---

**Ready to start? Begin with Phase 0 and work through each phase sequentially. Good luck! 🚀**
