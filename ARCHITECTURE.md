# Grafana LLM App - Architecture Documentation

**Created:** 2025-12-12
**Purpose:** Technical reference for building the Grafana Copilot

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Flow](#data-flow)
5. [Key Components Reference](#key-components-reference)
6. [Integration Points](#integration-points)

---

## 1. System Overview

### Architecture Pattern
**3-Tier Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                          │
│  - @grafana/llm library (npm package)                   │
│  - grafana-llm-app plugin UI                            │
└─────────────┬───────────────────────────────────────────┘
              │ HTTP/SSE + Grafana Live (WebSocket)
┌─────────────▼───────────────────────────────────────────┐
│  Backend (Go + Grafana Plugin SDK)                      │
│  - LLM Provider Proxy                                   │
│  - MCP Server (Model Context Protocol)                  │
│  - Streaming Handler                                    │
└─────────────┬───────────────────────────────────────────┘
              │ HTTP/gRPC
┌─────────────▼───────────────────────────────────────────┐
│  External Services                                       │
│  - OpenAI / Azure / Anthropic APIs                      │
│  - Grafana APIs (dashboards, datasources, alerts)       │
│  - Vector Database (Qdrant / Grafana VectorAPI)         │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- **Language:** TypeScript 5.6.2
- **Framework:** React 18.3.1
- **State Management:** React Hooks + RxJS 7.8.2
- **UI Library:** @grafana/ui components
- **Build Tool:** Rollup (library) + Webpack (plugin)

**Backend:**
- **Language:** Go 1.25.1
- **Framework:** Grafana Plugin SDK v0.281.0
- **MCP:** Model Context Protocol SDK (TypeScript + Go)
- **LLM SDKs:**
  - go-openai v1.41.2
  - anthropic-sdk-go v1.14.0

---

## 2. Frontend Architecture

### 2.1 Package Structure

```
packages/
├── grafana-llm-frontend/          # @grafana/llm npm package
│   ├── src/
│   │   ├── llm.ts                # Core LLM API functions
│   │   ├── mcp.tsx               # MCP client provider
│   │   ├── openai.ts             # OpenAI type definitions
│   │   ├── vector.ts             # Vector search utilities
│   │   └── types.ts              # Shared TypeScript types
│   └── package.json
│
└── grafana-llm-app/               # Grafana app plugin
    ├── src/
    │   ├── components/
    │   │   └── AppConfig/
    │   │       ├── DevSandbox/   # 🎯 CRITICAL: Chat UI to extract
    │   │       │   ├── DevSandboxChat.tsx
    │   │       │   ├── DevSandboxToolInspector.tsx
    │   │       │   └── types.ts
    │   │       ├── AppConfig.tsx
    │   │       └── LLMConfig.tsx
    │   ├── pages/
    │   │   ├── MainPage.tsx
    │   │   ├── MCPTools.tsx      # MCP tool inspector page
    │   │   └── Models.tsx
    │   ├── module.ts              # Plugin registration
    │   └── plugin.json            # Plugin metadata
    └── package.json
```

### 2.2 Core Frontend Components

#### A. LLM API (`llm.ts`)

**Purpose:** Provides functions for interacting with LLM providers via the backend plugin.

**Key Functions:**

```typescript
// Check if LLM plugin is enabled
async function enabled(): Promise<boolean>

// Non-streaming chat completion
async function chatCompletions(request: ChatCompletionsRequest):
  Promise<ChatCompletionsResponse>

// Streaming chat completion (returns RxJS Observable)
function streamChatCompletions(request: ChatCompletionsRequest):
  Observable<ChatCompletionsResponse<ChatCompletionsChunk>>

// React hook for streaming with state management
function useLLMStream(options): {
  stream: (messages, tools) => void;
  reply: string;
  isLoading: boolean;
  error: Error | undefined;
}
```

**RxJS Operators:**
- `accumulateContent()` - Accumulates streaming content chunks
- `extractContent()` - Extracts content from response chunks
- `accumulateToolCalls()` - Accumulates tool call chunks

**API Endpoint:**
```
POST /api/plugins/grafana-llm-app/resources/llm/v1/chat/completions
```

**Request Format:** OpenAI-compatible chat completions API

---

#### B. MCP Client (`mcp.tsx`)

**Purpose:** Provides React components and utilities for MCP (Model Context Protocol) integration.

**Key Components:**

```typescript
// React context provider for MCP client
export const MCPClientProvider: React.FC<{
  transport?: Transport;
  children: React.ReactNode;
}>

// Hook to access MCP client
export const useMCPClient = (): {
  client: Client | null;
  isConnecting: boolean;
}

// Convert MCP tools to OpenAI function calling format
export function convertToolsToOpenAI(tools: MCPTool[]): OpenAITool[]
```

**Transport Options:**

1. **StreamableHTTPClientTransport (Recommended):**
   ```typescript
   const transport = new StreamableHTTPClientTransport(
     '/api/plugins/grafana-llm-app/resources/mcp/grafana',
     {
       fetch: (url, options) => {
         return getBackendSrv().fetch({ url, method: 'POST', data: options?.body }).toPromise();
       }
     }
   );
   ```

2. **GrafanaLiveTransport (Deprecated):**
   - Uses Grafana Live WebSocket
   - Being phased out in favor of HTTP transport

---

#### C. DevSandboxChat Component

**Location:** `packages/grafana-llm-app/src/components/AppConfig/DevSandbox/DevSandboxChat.tsx`

**⭐ This is the component we'll extract in Phase 1**

**Key Features:**
- ✅ Message history management (`ChatMessage[]`)
- ✅ Streaming LLM responses with RxJS
- ✅ Tool call detection and execution
- ✅ Tool call visualization
- ✅ Auto-scrolling chat container
- ✅ Error handling

**Architecture Pattern:**

```typescript
// Message type
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Component structure
export function DevSandboxChat({ useStream, toolCalls, setToolCalls }) {
  // 1. Get MCP client
  const { client } = mcp.useMCPClient();

  // 2. State management
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 3. Get available tools
  const { tools } = useAsync(() => client?.listTools());

  // 4. Streaming handler with tool calling loop
  const handleStreamingChatWithHistory = async (messages, tools) => {
    // Stream LLM response
    let stream = llm.streamChatCompletions({ model, messages, tools });

    // Partition into tool calls and content
    let [toolCallsStream, contentStream] = partition(stream, isToolCall);

    // Subscribe to content updates
    contentStream.pipe(llm.accumulateContent()).subscribe(updateChat);

    // Handle tool calls
    let toolCallMessages = await lastValueFrom(
      toolCallsStream.pipe(llm.accumulateToolCalls())
    );

    // Loop: Execute tools → Get more LLM response → Repeat until no tools
    while (toolCallMessages.tool_calls.length > 0) {
      await Promise.all(toolCallMessages.tool_calls.map(executeToolCall));
      // Continue with new stream...
    }
  };
}
```

**Tool Execution Pattern:**

```typescript
async function handleToolCall(fc, client, toolCalls, setToolCalls, messages) {
  // 1. Mark tool as running
  setToolCalls(new Map(toolCalls.set(id, { ...fc, running: true })));

  // 2. Execute via MCP client
  const response = await client.callTool({
    name: fc.function.name,
    arguments: JSON.parse(fc.function.arguments)
  });

  // 3. Add tool result to message history
  messages.push({
    role: 'tool',
    tool_call_id: id,
    content: extractTextContent(response)
  });

  // 4. Mark tool as completed
  setToolCalls(new Map(toolCalls.set(id, { ...fc, running: false, response })));
}
```

---

## 3. Backend Architecture

### 3.1 Package Structure

```
packages/grafana-llm-app/pkg/
├── plugin/
│   ├── plugin.go              # Main plugin entrypoint
│   ├── routes.go              # HTTP route handlers
│   ├── app.go                 # App instance setup
│   ├── config/                # Configuration management
│   ├── provider/              # LLM provider implementations
│   │   ├── openai_provider.go
│   │   ├── azure_provider.go
│   │   ├── anthropic_provider.go
│   │   └── grafana_provider.go
│   └── vector/                # Vector search services
│       ├── service.go
│       ├── embedder.go
│       └── store.go
│
└── mcp/
    ├── mcp.go                 # MCP server setup
    ├── live_server.go         # Grafana Live MCP transport
    ├── auth.go                # Authentication handling
    └── logger.go              # MCP logger implementation
```

### 3.2 Core Backend Components

#### A. Plugin Entrypoint (`plugin.go`)

**Purpose:** Grafana plugin SDK integration and lifecycle management.

**Key Structure:**

```go
type App struct {
    // Grafana plugin SDK backend instance
    backend.CallResourceHandler

    // LLM provider (OpenAI, Azure, Anthropic, etc.)
    llmProvider provider.LLMProvider

    // MCP (Model Context Protocol) server
    mcp *mcp.MCP

    // Configuration
    settings *config.AppSettings
}

// Grafana plugin SDK lifecycle methods
func (a *App) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest)
    (*backend.CheckHealthResult, error)

func (a *App) CallResource(ctx context.Context, req *backend.CallResourceRequest,
    sender backend.CallResourceResponseSender) error
```

**HTTP Resource Routes:**
- `/llm/v1/chat/completions` - LLM chat completions (streaming + non-streaming)
- `/mcp/grafana` - MCP Streamable HTTP endpoint
- `/health` - Health check endpoint

---

#### B. MCP Server (`mcp.go`)

**Purpose:** Manages MCP server and tool registration.

**Key Structure:**

```go
// MCP represents the complete MCP infrastructure
type MCP struct {
    // Core MCP server (handles tool registration and execution)
    Server *server.MCPServer

    // Grafana Live server (WebSocket transport - deprecated)
    LiveServer *GrafanaLiveServer

    // HTTP server (modern transport)
    HTTPServer *server.StreamableHTTPServer

    // Configuration
    Settings Settings
}

// Initialize MCP with all Grafana tools
func New(settings Settings, pluginVersion string) (*MCP, error) {
    srv := server.NewMCPServer("grafana-llm-app", pluginVersion)

    // Register all tool categories from github.com/grafana/mcp-grafana
    tools.AddSearchTools(srv)        // Grafana resource search
    tools.AddDatasourceTools(srv)    // Query any datasource
    tools.AddPrometheusTools(srv)    // PromQL queries
    tools.AddLokiTools(srv)          // LogQL queries
    tools.AddDashboardTools(srv)     // Dashboard CRUD
    tools.AddAlertingTools(srv)      // Alert rules
    tools.AddIncidentTools(srv)      // Incident management
    tools.AddOnCallTools(srv)        // On-call schedules
    tools.AddAssertsTools(srv)       // Asserts integration
    tools.AddSiftTools(srv)          // Sift integration

    // Initialize transports (Live + HTTP)
    // ...

    return &MCP{Server: srv, ...}, nil
}
```

**MCP Tool Categories (from `github.com/grafana/mcp-grafana`):**

| Tool Category | Description | Example Tools |
|---------------|-------------|---------------|
| Search | Search Grafana resources | `grafana_search` |
| Datasource | Query any configured datasource | `datasource_query` |
| Prometheus | Execute PromQL queries | `prometheus_query_range`, `prometheus_query_instant` |
| Loki | Execute LogQL queries | `loki_query_range` |
| Dashboard | CRUD operations on dashboards | `grafana_get_dashboard`, `grafana_create_dashboard` |
| Alerting | Manage alert rules | `grafana_list_alert_rules`, `grafana_create_alert_rule` |
| Incident | Incident management | Incident CRUD operations |
| OnCall | On-call schedule access | Schedule and user settings |
| Asserts | Asserts integration | Asserts-specific tools |
| Sift | Sift integration | Sift-specific tools |

**Authentication:**
- **Service Account Token:** Default authentication (plugin token from Grafana)
- **On-Behalf-Of (Cloud):** Exchange access policy token for user-specific token

---

#### C. LLM Provider Abstraction

**Purpose:** Unified interface for multiple LLM providers.

**Pattern:**

```go
type LLMProvider interface {
    // Stream chat completions
    StreamChatCompletions(ctx context.Context, req ChatCompletionsRequest)
        (chan ChatCompletionsChunk, error)

    // Non-streaming chat completions
    ChatCompletions(ctx context.Context, req ChatCompletionsRequest)
        (ChatCompletionsResponse, error)

    // Health check
    Enabled(ctx context.Context) (HealthCheckResponse, error)
}

// Implementations:
// - OpenAIProvider (go-openai)
// - AzureProvider (Azure OpenAI)
// - AnthropicProvider (anthropic-sdk-go)
// - GrafanaProvider (llm-gateway)
```

**Model Tiers:**
- `base` - Efficient, high-throughput (e.g., GPT-4o Mini, Claude Sonnet)
- `large` - Advanced with longer context (e.g., GPT-4o, Claude Sonnet)

---

## 4. Data Flow

### 4.1 Chat Message Flow (No Tool Calls)

```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Frontend (DevSandboxChat.tsx)               │
│ - Add user message to chatHistory           │
│ - Call llm.streamChatCompletions()          │
└──────────────┬──────────────────────────────┘
               │ HTTP POST + SSE
               ▼
┌─────────────────────────────────────────────┐
│ Backend (plugin/routes.go)                  │
│ - Route: /llm/v1/chat/completions           │
│ - Forward to LLM Provider                   │
└──────────────┬──────────────────────────────┘
               │ HTTP/gRPC
               ▼
┌─────────────────────────────────────────────┐
│ LLM Provider (OpenAI/Azure/Anthropic)       │
│ - Generate response tokens                  │
└──────────────┬──────────────────────────────┘
               │ Streaming response
               ▼
┌─────────────────────────────────────────────┐
│ Backend                                      │
│ - Proxy chunks to frontend via SSE          │
└──────────────┬──────────────────────────────┘
               │ RxJS Observable
               ▼
┌─────────────────────────────────────────────┐
│ Frontend                                     │
│ - accumulateContent() operator              │
│ - Update chatHistory with streaming content │
└─────────────────────────────────────────────┘
```

### 4.2 Chat Message Flow (With Tool Calls)

```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Frontend: Send to LLM with tools            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ LLM: Generates tool_calls                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Frontend: Detect tool_calls                 │
│ - partition() stream into tool calls vs content │
│ - accumulateToolCalls() operator            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Frontend: Execute tool via MCP client       │
│ - client.callTool({ name, arguments })      │
└──────────────┬──────────────────────────────┘
               │ HTTP POST
               ▼
┌─────────────────────────────────────────────┐
│ Backend: MCP HTTP Server                    │
│ - Route: /mcp/grafana                       │
│ - Dispatch to registered tool handler       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Tool Handler (mcp-grafana package)          │
│ - Execute Grafana API call                  │
│ - Query datasource / Fetch dashboard / etc. │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Frontend: Receive tool result               │
│ - Add to messages as role: 'tool'           │
│ - Send back to LLM with updated history     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ LLM: Interprets tool result                 │
│ - Generates natural language response       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Frontend: Display final response            │
└─────────────────────────────────────────────┘
```

**Loop Continues:** If LLM generates more tool_calls, repeat the tool execution cycle.

---

## 5. Key Components Reference

### 5.1 Frontend Components to Extract (Phase 1)

#### Components to Copy/Refactor:

| Component | Source | Destination | Purpose |
|-----------|--------|-------------|---------|
| `DevSandboxChat` | `DevSandbox/DevSandboxChat.tsx` | `Copilot/CopilotChat.tsx` | Main chat interface |
| Message rendering | Inline in DevSandboxChat | `Copilot/CopilotMessageList.tsx` | Message display with markdown |
| Input box | Inline in DevSandboxChat | `Copilot/CopilotInput.tsx` | Message input with suggested prompts |
| Tool call view | `DevSandbox/DevSandboxToolInspector.tsx` | `Copilot/CopilotToolCallView.tsx` | Tool execution visualization |

#### Hooks to Create:

| Hook | File | Purpose |
|------|------|---------|
| `useCopilotChat` | `Copilot/hooks/useCopilotChat.ts` | Chat state + streaming logic |
| `useGrafanaContext` | `Copilot/hooks/useGrafanaContext.ts` | Extract dashboard context |
| `useToolExecution` | `Copilot/hooks/useToolExecution.ts` | MCP tool execution |

#### Utilities to Create:

| Utility | File | Purpose |
|---------|------|---------|
| `buildSystemPrompt` | `Copilot/utils/systemPrompts.ts` | Generate context-aware prompts |
| `messageFormatting` | `Copilot/utils/messageFormatting.ts` | Markdown rendering, syntax highlighting |
| `conversationStorage` | `Copilot/utils/conversationStorage.ts` | localStorage persistence |

---

### 5.2 Backend Components to Extend (Phase 4)

#### For Knowledge Base Integration:

| Component | File | Purpose |
|-----------|------|---------|
| `KnowledgeBaseService` | `pkg/plugin/vector/knowledge.go` (NEW) | Vector search for docs/runbooks |
| `AddKnowledgeBaseTools` | `pkg/mcp/knowledge_tools.go` (NEW) | MCP tools for search/ingest |
| Knowledge base ingestion | `scripts/ingest-knowledge.ts` (NEW) | CLI tool for bulk ingestion |

---

## 6. Integration Points

### 6.1 Grafana Services Used

**Frontend (`@grafana/runtime`):**
```typescript
import {
  getBackendSrv,      // HTTP requests to backend
  getTemplateSrv,     // Template variables
  locationService,    // URL/routing
  getGrafanaLiveSrv   // WebSocket (deprecated for MCP)
} from '@grafana/runtime';
```

**Backend (Grafana Plugin SDK):**
```go
import (
    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/backend/log"
    "github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)
```

### 6.2 External Dependencies

**LLM Providers:**
- OpenAI API (go-openai)
- Azure OpenAI API
- Anthropic API (anthropic-sdk-go)
- Grafana LLM Gateway (Cloud)

**Vector Services:**
- Qdrant (vector database)
- Grafana VectorAPI (Cloud)
- OpenAI Embeddings API

**MCP:**
- `@modelcontextprotocol/sdk` (TypeScript)
- `github.com/mark3labs/mcp-go` (Go)
- `github.com/grafana/mcp-grafana` (Tool implementations)

---

## 7. Security & Authentication

### 7.1 API Key Storage

**Storage:** Encrypted in Grafana's plugin settings database

**Access:** Backend reads via `ctx.DataSourceInstanceSettings`

**User Never Sees:** API keys are write-only from UI, never read back

### 7.2 IAM Permissions (from plugin.json)

The plugin has extensive permissions granted:

```json
{
  "iam": {
    "permissions": [
      { "action": "datasources:read" },
      { "action": "datasources:query" },
      { "action": "dashboards:read" },
      { "action": "dashboards:create" },
      { "action": "dashboards:write" },
      { "action": "folders:read" },
      { "action": "alert.rules:read" },
      // ... OnCall, IRM, Incident app access
    ]
  }
}
```

**Implication:** The copilot can:
- ✅ Read all dashboards and panels
- ✅ Create and modify dashboards
- ✅ Query all datasources
- ✅ Read alert rules
- ✅ Access incident/on-call data

**Does NOT have:**
- ❌ User/team write permissions
- ❌ Datasource configuration write
- ❌ Admin API access

---

## 8. Development Workflow

### 8.1 Starting Dev Environment

```bash
# Terminal 1: Start dev builds (watches for changes)
./dev.sh

# Terminal 2: Start Grafana server
npm run server

# Access: http://localhost:3000
```

### 8.2 Making Changes

**Frontend changes:**
- Edit files in `packages/grafana-llm-frontend/src/` or `packages/grafana-llm-app/src/`
- Webpack/Rollup automatically rebuilds
- Refresh browser to see changes

**Backend changes:**
- Edit files in `packages/grafana-llm-app/pkg/`
- Run: `npm run backend:restart`
- Plugin automatically reloads in Grafana

### 8.3 Testing

```bash
# Run all tests
npm run test:ci

# Run E2E tests
npm run test:e2e

# Run backend tests only
npm run backend:test
```

---

## 9. Next Steps (Implementation Phases)

### Phase 1: Extract Chat UI
1. Copy `DevSandboxChat.tsx` → `CopilotChat.tsx`
2. Extract hooks: `useCopilotChat`, `useToolExecution`
3. Create `CopilotDrawer` component (Grafana `<Drawer>` component)
4. Register in `module.ts` as global component
5. Add conversation persistence (localStorage)

### Phase 2: Context Awareness
1. Create `useGrafanaContext` hook
2. Extract dashboard UID, title, panels, variables, time range
3. Create `buildSystemPrompt` utility
4. Inject context into system message

### Phase 3: Enable MCP Tools
1. Verify all MCP tools in `mcp.go`
2. Test tool execution from frontend
3. Add tool call visualization in UI
4. Implement error handling for failed tools

### Phase 4: Knowledge Base
1. Extend vector service: `KnowledgeBaseService`
2. Create MCP tools: `search_knowledge_base`, `ingest_knowledge_document`
3. Build ingestion pipeline (CLI script)
4. Update system prompt for RAG usage
5. Test with sample documents

### Phase 5-7: Polish, Test, Deploy
- See roadmap.md for detailed steps

---

## 10. Glossary

**MCP (Model Context Protocol):** Standard protocol for connecting LLMs to tools/data sources

**SSE (Server-Sent Events):** HTTP-based streaming protocol used for LLM responses

**RxJS:** Reactive programming library for handling async data streams

**RAG (Retrieval Augmented Generation):** Pattern where LLM queries knowledge base before generating response

**Grafana Live:** Grafana's WebSocket-based real-time messaging system

**Tool Calling:** LLM feature where model can request execution of predefined functions

**Streaming:** Real-time token-by-token response delivery (vs waiting for complete response)

---

## 11. Troubleshooting

### Common Issues

**"LLM plugin not configured":**
- Navigate to Configuration → Plugins → Grafana LLM App
- Configure an LLM provider (OpenAI, Azure, or Anthropic)
- Add API key and test connection

**"MCP client not initialized":**
- Ensure `MCPClientProvider` wraps your component
- Check browser console for connection errors
- Verify `/mcp/grafana` endpoint is accessible

**Tool execution fails:**
- Check IAM permissions in plugin.json
- Verify service account has required permissions
- Check backend logs for detailed error

**Backend build fails with Go version error:**
- Use `./dev.sh` script (sets GOTOOLCHAIN=auto)
- Or manually set: `export GOTOOLCHAIN=auto`

---

**End of Architecture Documentation**
