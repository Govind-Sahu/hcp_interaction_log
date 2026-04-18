# HCP CRM – AI-First Pharma Field Sales CRM

## Overview

pnpm workspace monorepo using TypeScript. Pharmaceutical field sales CRM with AI-powered HCP interaction management.

## Architecture

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Redux Toolkit
- **API Server**: Node.js + Fastify (port 8080)
- **AI Backend**: Python FastAPI + LangGraph (port 8000)
- **Database**: PostgreSQL + Drizzle ORM
- **LLM**: Groq API (llama-3.3-70b-versatile)
- **API codegen**: Orval (from OpenAPI spec)

## Project Structure

```
artifacts/
  hcp-crm/          → React + Vite frontend (main app)
  api-server/       → Node.js API server + DB access
  python-ai-backend/ → Python FastAPI + LangGraph AI agent
lib/
  api-spec/         → OpenAPI spec (source of truth)
  api-client-react/ → Generated React Query hooks (orval)
  db/               → Drizzle ORM schema + migrations
```

## Key Features

1. **Dashboard** — HCP stats, interaction charts (recharts)
2. **HCP List/Detail** — 8 seeded HCPs with tier badges, search, interaction history
3. **Log Interaction** — Structured form OR AI chat toggle (Redux state)
4. **Edit Interaction** — Update existing interactions
5. **AI Agent Playground** — Direct LangGraph agent with 5 tools

## LangGraph Tools (5)

1. `log_interaction` — Logs interaction with AI summarization
2. `edit_interaction` — Modifies existing interaction records
3. `search_hcp` — Finds HCPs by name/specialty/territory
4. `get_interaction_history` — Retrieves HCP engagement history
