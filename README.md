# July OPT EAD Tracker

A tiny crowd-sourced tracker for July premium-processing OPT EAD cases. Static page on Vercel,
serverless functions for the API, Supabase Postgres for the data. No signup, no email.

**username · PP start date · status** — that's the whole form. Entering the same username
again updates that row.

Statuses: `Still waiting` → `Silent API update` → `Approved` → `Card produced` → `Card delivered`

## Layout

```
public/index.html   the entire UI (no keys in it)
api/entries.js      GET  /api/entries  → all rows as JSON
api/save.js         POST /api/save     → insert or update one row
api/ping.js         GET  /api/ping     → daily cron, keeps Supabase awake
lib/supabase.js     ~25 lines of fetch() over the Supabase REST API
schema.sql          run once in Supabase
```

No dependencies, no build step.

## Setup

### 1. Supabase

Create a project, then **SQL Editor → New query** → paste `schema.sql` → **Run**.

Then copy two values — the Project URL is under **Settings → Data API**, the keys
under **Settings → API Keys**:

| Value | Where it is | Goes into Vercel as |
|---|---|---|
| Project URL | `https://xxxxxxxx.supabase.co` (a trailing `/rest/v1` is fine too) | `SUPABASE_URL` |
| Secret key (`sb_secret_…`), a.k.a. the legacy `service_role` key | same page, under API Keys | `SUPABASE_SERVICE_ROLE_KEY` |

**Use the secret/service_role key, not the publishable/anon key.** The table has row-level
security enabled with zero policies, so the anon key can do literally nothing. Only the secret
key works — and it is only ever read by the server functions, never sent to the browser.

Never paste the secret key into `public/index.html` or commit it.

### 2. Vercel

**Project → Settings → Environment Variables**, add both, all three environments checked:

```
SUPABASE_URL                = https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY   = sb_secret_...
```

Then **Deployments → ⋯ → Redeploy**. Environment variables are baked in at deploy time, so a
deployment made before you added them will not see them.

## Uptime

A free Supabase project **pauses after 7 days with no API requests**, and un-pausing is a
manual click in the dashboard. `api/ping.js` plus the cron in `vercel.json` hits the database
every day at 12:00 UTC, so the 7-day timer never gets close to expiring. Vercel Hobby allows
daily crons, which is all this needs.

Vercel functions themselves never sleep — a cold start is a few hundred milliseconds, not
downtime.

If you want a real uptime guarantee rather than a workaround, Supabase Pro ($25/mo) removes
auto-pausing entirely. For a 20-person tracker the cron is enough.

## How people use it

- First visit: username + PP start date + status → Save.
- Later: same username, new status, Save. The browser remembers the username, so returning
  visitors get their row pre-filled and highlighted.
- The page refreshes its data every 60 seconds.

## Chart range

Every date from July 15–31 always appears, even with zero entries. To widen it, edit the two
constants at the top of the `<script>` block in `public/index.html`:

```js
const RANGE_START = "2026-07-15";
const RANGE_END   = "2026-07-31";
```

Dates outside that window still show up if someone enters one — the range is a floor, not a filter.

## Moderating

There are no passwords: anyone who knows a username can change that row. That is the
deliberate trade for zero friction, and it is fine for a group of ~20.

Remove a row in **Table Editor → entries**, or in SQL Editor:

```sql
delete from public.entries where username = 'someone';
truncate public.entries;              -- wipe everything
```

New usernames are capped at 200 so nobody can fill the table.

## Local development

```bash
npx vercel link
npx vercel dev
```

`vercel dev` pulls the environment variables from the linked project.

## Troubleshooting

Open `/api/health` on the deployed site. It checks each part of the setup independently and
names the next step, without echoing any secret value.
