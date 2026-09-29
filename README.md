# Landlord Tenant Screener

Hackathon demo for reviewing tenant applications. Listings and applications live in Supabase Postgres. The app reads and writes them with Prisma. n8n can update scores through the same tables or through the callback route.

## Setup

```sh
pnpm install
cp .env.example .env.local
```

Fill in:

- `DATABASE_URL` — Supabase Postgres connection string (used by the app)
- `N8N_WEBHOOK_URL` — webhook that receives `{ "applicationId": "<uuid>" }`
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — for the Supabase dashboard or a later client; the app does not read them

Apply the schema in the Supabase SQL editor with [`prisma/sql/0000_init.sql`](prisma/sql/0000_init.sql), or push it from this repo:

```sh
pnpm db:push
pnpm dev
```

Open `/` and use **Generate sample applications**. That inserts two Berlin listings (if the table is empty) and eight applications.

## n8n

`status` is plain text constrained to `pending`, `shortlisted`, and `rejected`. `risk_flags` is a JSON array of strings. `score` is `numeric(5,2)` and stays null until a workflow writes it.

n8n can update `applications` with a Postgres node, or POST JSON to `/api/webhook/n8n-callback`:

```json
{
  "applicationId": "00000000-0000-4000-8000-000000000000",
  "score": 82.5,
  "status": "shortlisted",
  "riskFlags": ["Stripped nationality from message"]
}
```

Only the fields you send are written. A missing application returns 404. A body without `score`, `status`, or `riskFlags` returns 400.

On an application page, **Re-run AI evaluation** POSTs the application id to `N8N_WEBHOOK_URL`.
