# 🦾 Clawdie CLI

> **Agent Infrastructure Orchestrator** — Manage your autonomous agents with surgical precision.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/dazeb/clawdie-cli)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](./LICENSE)

Clawdie CLI is the command-line interface for the Clawdie platform, designed for hackers and developers who need high-throughput control over their agent clusters.

---

## 🚀 Quick Start

### Installation

Download the latest release from the [Releases](https://github.com/dazeb/clawdie-cli/releases) page or build from source:

```bash
git clone https://github.com/dazeb/clawdie-cli.git
cd clawdie-cli
npm install
npm run build
```

Link the binary globally (optional):
```bash
npm link
```

---

## 🕹️ Usage

### 🔐 Authentication

```bash
clawdie login     # Authenticate with your Clawdie credentials
clawdie logout    # Securely clear your session
```

### 🧠 Agent Management

```bash
clawdie agents              # List all active agents in your fleet
clawdie status [id]         # Deep-dive into agent health and metrics
clawdie restart <id>        # Hot-reload an agent instance
clawdie stop <id>           # Terminate an agent lifecycle
```

### 📜 Observability

```bash
clawdie logs <id>           # Dump recent agent logs
clawdie logs <id> --follow  # Real-time log stream (3s polling)
```

### 🏗️ Deployment

```bash
clawdie deploy              # Interactive deployment wizard
```

### 🛰️ Nexus Dashboard

Launch the high-fidelity TUI dashboard for real-time monitoring.

```bash
clawdie nexus
```

**Hotkeys:**
- `TAB` — Cycle views (Agents, Telemetry, Logs)
- `j` / `k` — Navigate selection
- `q` — Exit Nexus

---

## ⚙️ Configuration

Persistence is handled at `~/.clawdie/config.json`.

```json
{
  "apiUrl": "https://api.clawdie.ai",
  "cookie": "session=...",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

### Environment Overrides

- `CLAWDIE_API_URL`: Direct the CLI to a custom Nexus endpoint.

---

## 🛡️ Security

This CLI operates under the **Sentinel Protocol**. Session cookies are stored locally with user-level permissions. Always `logout` on shared machines.

---

## 📜 License

ISC © [dazeb](https://github.com/dazeb)
