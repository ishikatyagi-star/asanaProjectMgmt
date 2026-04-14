# Asana GPT Action Backend

A lightweight Express webhook that lets a Custom GPT manage Asana. The GPT handles all conversation and AI logic — this service is a pure tool executor: it receives structured function calls from GPT, forwards them to the Asana REST API, and returns JSON.

## Architecture

```
ChatGPT (Custom GPT)
  │  POST /tasks  {"name": "Review PR", "projects": ["...gid..."]}
  ▼
This service (Express)
  │  Bearer token check → Asana REST API
  ▼
Asana API  →  JSON result back to GPT  →  GPT summarises naturally
```

## Local development

### Prerequisites

- Node.js 18+
- An [Asana Personal Access Token](https://app.asana.com/0/my-apps)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Edit .env and fill in both values
#    ASANA_PAT    — paste your Asana PAT
#    WEBHOOK_SECRET — choose any strong random string (e.g. openssl rand -hex 32)

# 4. Start the server (auto-restarts on file changes)
npm run dev
```

The server starts on `http://localhost:3000`.

### Smoke tests

Replace `<SECRET>` with your `WEBHOOK_SECRET` value and `<GID>` with real IDs from your Asana workspace.

```bash
# Health check (no auth required)
curl http://localhost:3000/health

# Auth rejection
curl http://localhost:3000/workspaces
# → 401 {"error":"Unauthorized"}

# List workspaces
curl -H "Authorization: Bearer <SECRET>" \
  http://localhost:3000/workspaces

# List projects in a workspace
curl -H "Authorization: Bearer <SECRET>" \
  http://localhost:3000/workspaces/<WORKSPACE_GID>/projects

# List members of a workspace
curl -H "Authorization: Bearer <SECRET>" \
  http://localhost:3000/workspaces/<WORKSPACE_GID>/users

# Create a project
curl -X POST \
  -H "Authorization: Bearer <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","workspace":"<WORKSPACE_GID>"}' \
  http://localhost:3000/projects

# List tasks in a project
curl -H "Authorization: Bearer <SECRET>" \
  http://localhost:3000/projects/<PROJECT_GID>/tasks

# Create a task
curl -X POST \
  -H "Authorization: Bearer <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Review PR","projects":["<PROJECT_GID>"]}' \
  http://localhost:3000/tasks

# Update a task (mark complete)
curl -X PATCH \
  -H "Authorization: Bearer <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}' \
  http://localhost:3000/tasks/<TASK_GID>

# Move task to another project
curl -X POST \
  -H "Authorization: Bearer <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"project":"<PROJECT_GID>"}' \
  http://localhost:3000/tasks/<TASK_GID>/addProject
```

---

## Deploy to Railway

1. Push this repo to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select the repo.
3. Railway auto-detects Node.js and runs `npm start`.
4. In the Railway dashboard → **Variables**, add:
   - `ASANA_PAT` — your Asana PAT
   - `WEBHOOK_SECRET` — your chosen shared secret
   - (`PORT` is set automatically by Railway — do not override it)
5. Set the health check path to `/health` in the Railway service settings.
6. Copy the generated `*.up.railway.app` URL — you'll need it in the next step.

## Deploy to Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect the repo.
3. Set:
   - **Build command**: `npm install`
   - **Start command**: `npm start`
4. Under **Environment**, add `ASANA_PAT` and `WEBHOOK_SECRET`.
5. Set the health check path to `/health`.
6. Copy the `*.onrender.com` URL.

> **Note:** Render's free tier spins down after inactivity. Since GPT Actions have a short timeout, use a paid tier (Starter) or Railway to avoid cold-start failures.

---

## Configure the Custom GPT Action

1. Go to **ChatGPT** → **Explore GPTs** → **Create** → **Configure** tab.
2. Scroll to **Actions** → **Create new action**.
3. In the schema editor, paste the full contents of `openapi.yaml`.
4. Update the `servers[0].url` in the YAML to your deployed HTTPS URL (Railway or Render).
5. Under **Authentication**: select **API Key**, set type to **Bearer**, paste your `WEBHOOK_SECRET`.
6. Click **Test** on the `listWorkspaces` operation — it should return live data from your Asana account.
7. Save the GPT.

### Verify in conversation

> *"List my Asana workspaces."*

The GPT should call `listWorkspaces`, receive the JSON, and summarise it.

> *"Create a task called 'Review PR' in project 1234567890."*

The GPT should call `createTask` and confirm the task was created.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ASANA_PAT` | Yes | Asana Personal Access Token |
| `WEBHOOK_SECRET` | Yes | Shared secret for bearer token auth |
| `PORT` | No | Defaults to 3000; set automatically by Railway/Render |

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Service health check |
| GET | `/workspaces` | Bearer | List all workspaces |
| GET | `/workspaces/:id/projects` | Bearer | List projects in workspace |
| GET | `/workspaces/:id/users` | Bearer | List members of workspace |
| POST | `/projects` | Bearer | Create a project |
| GET | `/projects/:id/tasks` | Bearer | List tasks in project |
| POST | `/tasks` | Bearer | Create a task |
| PATCH | `/tasks/:id` | Bearer | Update a task |
| POST | `/tasks/:id/addProject` | Bearer | Add task to a project |
