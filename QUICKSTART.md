# Grafana Copilot - Quick Start Guide

**Last Updated:** 2025-12-12

This guide will get your development environment up and running in under 5 minutes.

---

## 🚀 Prerequisites

- **Node.js** >= 22.x
- **npm** >= 9.x
- **Go** >= 1.25.1 (auto-downloaded via GOTOOLCHAIN if not present)
- **Docker Desktop** (for running Grafana server)
- **Mage** (installed automatically on first run)

---

## ⚡ Quick Start (3 Steps)

### 1. Install Dependencies

```bash
cd /home/marc/Documents/github/grafana-llm-app
npm install
```

**Expected output:** `1533 packages installed, 0 vulnerabilities`

---

### 2. Start Development Environment

```bash
./dev.sh
```

**What this does:**
- Sets required environment variables (`GOTOOLCHAIN=auto`, `GOSUMDB=sum.golang.org`)
- Runs frontend build (`@grafana/llm` package)
- Runs backend build (Go plugin with Mage)
- Starts watch servers for both packages
- Auto-recompiles on file changes

**Expected output:**
```
[llm-frontend] waiting for changes...
[llm-app] webpack compiled successfully
[llm-app] No typescript errors found.
```

**Leave this terminal running!**

---

### 3. Start Grafana Server

Open a **new terminal**:

```bash
cd /home/marc/Documents/github/grafana-llm-app
npm run server
```

**What this does:**
- Starts Grafana via Docker Compose
- Loads the plugin automatically
- Accessible at http://localhost:3000

**Expected output:**
```
grafana-1  | ... HTTP Server Listen ...
grafana-1  | ... Starting plugin grafana-llm-app ...
```

**Wait 30-60 seconds for Grafana to fully start.**

---

## 🌐 Access Grafana

1. **Open browser:** http://localhost:3000
2. **Login:** `admin` / `admin` (skip password change)
3. **Configure LLM Provider:**
   - Navigate to: **Configuration → Plugins → Grafana LLM App**
   - Click **Configuration** tab
   - Choose provider: OpenAI, Azure, or Anthropic
   - Enter API key
   - Click **Test Connection**
4. **Test Copilot:**
   - Look for floating **"Copilot"** button (bottom-right corner)
   - Click it → Drawer opens
   - Type "Hello" → Send

---

## 🛠️ Common Commands

```bash
# Development (with auto-reload)
./dev.sh

# Start Grafana server
npm run server

# Type check
npm run typecheck --workspace=@grafana/llm-app

# Run tests
npm run test:ci

# Build everything
npm run build:all

# Restart backend only (after Go changes)
npm run backend:restart
```

---

## 📂 Project Structure

```
/home/marc/Documents/github/grafana-llm-app/
├── dev.sh                         # Dev environment startup script
├── QUICKSTART.md                  # This file
├── ARCHITECTURE.md                # Technical reference
├── roadmap.md                     # Implementation roadmap
├── packages/
│   ├── grafana-llm-frontend/      # @grafana/llm npm package
│   │   └── src/
│   │       ├── llm.ts             # LLM API
│   │       └── mcp.tsx            # MCP client
│   └── grafana-llm-app/           # Grafana plugin
│       ├── src/                   # Frontend (React + TypeScript)
│       │   ├── components/
│       │   │   └── Copilot/       # 🎯 Phase 1 implementation
│       │   └── module.ts          # Plugin registration
│       └── pkg/                   # Backend (Go)
│           ├── plugin/            # Plugin logic
│           └── mcp/               # MCP server
└── llmclient/                     # Go client library
```

---

## 🐛 Troubleshooting

### Issue: "Error: go.mod requires go >= 1.25.1"

**Solution:** Use `./dev.sh` instead of `npm run dev`. It sets `GOTOOLCHAIN=auto` to auto-download Go 1.25.1.

### Issue: "Docker Compose not responding"

**Solutions:**
1. Restart Docker Desktop
2. Kill hanging processes:
   ```bash
   ps aux | grep "docker compose" | grep -v grep | awk '{print $2}' | xargs kill
   ```
3. Clean up:
   ```bash
   docker compose down
   docker system prune -f
   ```

### Issue: "Module not found: react-markdown"

**Solution:** The dependency should be installed. If not:
```bash
cd packages/grafana-llm-app
npm install react-markdown
```

### Issue: "LLM plugin not configured"

**Solution:**
1. Go to http://localhost:3000
2. Configuration → Plugins → Grafana LLM App
3. Add API key for OpenAI, Azure, or Anthropic
4. Click "Test Connection"

### Issue: "Copilot button not appearing"

**Possible causes:**
1. Plugin not enabled → Check Plugins page
2. Frontend not compiled → Check dev terminal for errors
3. Browser cache → Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Issue: Dev build shows errors

**Check:**
```bash
# See latest build output
tail -50 /tmp/claude/tasks/*.output | grep -E "(error|Error)"

# Or check webpack terminal directly
```

---

## 🔄 Restart After Laptop Reboot

After restarting your laptop, follow these steps:

### 1. Start Docker Desktop
Wait for Docker to fully start (check system tray icon).

### 2. Navigate to Project
```bash
cd /home/marc/Documents/github/grafana-llm-app
```

### 3. Start Dev Environment
```bash
./dev.sh
```

**In new terminal:**
```bash
npm run server
```

### 4. Access Grafana
Open http://localhost:3000 (wait 30-60 seconds for startup)

---

## 📝 Current Progress

### ✅ Completed
- **Phase 0:** Development environment setup
- **Phase 1:** Copilot chat UI extracted and registered as global component
- **Improvements:** Markdown rendering, auto-scroll, contextual prompts

### 🔄 Next Up
- **Verification:** Test Phase 1 in running Grafana instance
- **Phase 2:** Dashboard context awareness (inject dashboard/panel info)
- **Phase 3:** MCP tool usage (verify all tools work)

See `roadmap.md` for detailed implementation plan.

---

## 💡 Tips

1. **Keep dev.sh running** - It watches for changes and auto-recompiles
2. **Check both terminals** - Dev build errors appear in first terminal, Grafana logs in second
3. **Browser DevTools** - Press F12 to see console logs and network requests
4. **MCP Tools** - View available tools at: Configuration → Plugins → Grafana LLM App → MCP Tools tab

---

## 📚 Additional Documentation

- **ARCHITECTURE.md** - System architecture, data flows, component reference
- **roadmap.md** - Phase-by-phase implementation plan
- **CONTRIBUTING.md** - How to contribute (if present in upstream)

---

## 🆘 Getting Help

1. **Check logs:**
   ```bash
   # Dev build logs
   tail -f /tmp/claude/tasks/*.output

   # Grafana logs
   docker compose logs -f grafana
   ```

2. **Inspect browser console:** F12 → Console tab

3. **Check GitHub issues:** https://github.com/grafana/grafana-llm-app/issues

4. **Review architecture:** See `ARCHITECTURE.md` for deep technical reference

---

**Happy Coding! 🚀**
