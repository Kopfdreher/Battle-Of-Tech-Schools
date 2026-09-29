# Landlord Tenant Screener

Hackathon demo for reviewing tenant applications. Listings and applications live in Supabase Postgres. The app reads and writes them with Prisma. n8n can update scores through the same tables or through the callback route.

## Setup

```sh
pnpm install
cp .env.example .env.local
```

Fill in:

- `DATABASE_URL` — Postgres connection string (used by the app and by `prisma generate`)
- `N8N_WEBHOOK_URL` — webhook that receives `{ "applicationId": "<uuid>" }`

## Vercel

Deploy the `nextjs-rebuild` branch. In the Vercel project:

- Production branch: `nextjs-rebuild`
- Root directory: repository root (leave it empty; do not use `apps/web`)
- Environment variables: `DATABASE_URL` and `N8N_WEBHOOK_URL`

`main` is the old Turborepo and has no `next` dependency, so a deploy of that branch fails with “No Next.js version detected.” `prisma generate` runs during install and again before `next build`. The build fails if `DATABASE_URL` is missing.

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
