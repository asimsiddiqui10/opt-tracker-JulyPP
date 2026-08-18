# July OPT EAD Tracker

A tiny crowd-sourced tracker for July premium-processing OPT EAD cases. One static page plus
two serverless functions on Vercel, with a Redis store for the data. No signup, no email,
no third-party dashboard.

**username · PP start date · status** — that's the whole form. Entering the same username
again updates that row.

Statuses: `Still waiting` → `Silent API update` → `Approved` → `Card produced` → `Card delivered`

## Layout

```
public/index.html   the entire UI
api/entries.js      GET  /api/entries  → all rows as JSON
api/save.js         POST /api/save     → insert or update one row
lib/redis.js        ~20 lines of fetch() over the Upstash REST API
```

No dependencies, no build step. Vercel serves `public/` and turns `api/*.js` into functions.

## Setup

1. Import the repo at [vercel.com/new](https://vercel.com/new) and deploy. Framework preset
   will read as **Other** — leave it, and leave the build command empty.
2. In the project: **Storage → Create Database → Redis** (Upstash), then **Connect** it to
   this project. Vercel injects the credentials as environment variables automatically.
3. **Deployments → ⋯ → Redeploy** so the functions pick up the new variables.

That's it — there are no keys to paste into any file.

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

To remove a row, open the Redis store in the Vercel dashboard and run:

```
HDEL opt:entries <username>
```

To wipe everything: `DEL opt:entries`

New usernames are capped at 200 so nobody can fill the store.

## Local development

```bash
npx vercel dev
```

Needs the project linked (`npx vercel link`) so it can pull the Redis variables.
