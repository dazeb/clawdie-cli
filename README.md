# Clawdie CLI

Agent Infrastructure Orchestrator CLI for managing Clawdie agents.

## Installation

```bash
npm install
npm run build
```

## Usage

### Authentication

```bash
clawdie login     # Authenticate with email/password
clawdie logout    # Clear session
```

### Agent Management

```bash
clawdie agents              # List all agents
clawdie status [id]         # View agent status and metrics
clawdie restart <id>        # Restart an agent
clawdie stop <id>           # Stop an agent
```

### Logs

```bash
clawdie logs <id>           # View agent logs
clawdie logs <id> --follow  # Follow logs (poll every 3s)
```

### Deployment

```bash
clawdie deploy              # Deploy a new agent (interactive checkout)
```

### Dashboard

```bash
clawdie nexus               # Launch the interactive Nexus dashboard
```

In the dashboard:
- **TAB** — Switch between tabs (Agents, Telemetry, Logs)
- **j** / **k** — Navigate agents (Telemetry tab)
- **q** — Exit dashboard

## Configuration

Config is stored at `~/.clawdie/config.json`:

```json
{
  "apiUrl": "https://api.clawdie.ai",
  "cookie": "session=...",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

## Environment Variables

- `CLAWDIE_API_URL` — Override API URL (default: `https://api.clawdie.ai`)

## Version

1.0.0
