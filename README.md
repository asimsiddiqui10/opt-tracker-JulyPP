# July OPT EAD Tracker

One static HTML page + a free Supabase database. Three fields, no signup, no email.
Total setup: ~10 minutes.

**username · PP start date · status** — that's the whole form. Entering the same username
again updates that row, so people can come back and change their status.

Statuses: `Still waiting` → `Silent API update` → `Approved` → `Card produced` → `Card delivered`

## 1. Database (5 min)

1. https://supabase.com → sign in with GitHub → **New project** (free tier, US region).
2. Wait for provisioning to finish.
3. **SQL Editor** → **New query** → paste all of `schema.sql` → **Run**.
   (Safe to re-run — it drops and recreates everything.)
4. **Project Settings → API**, copy two values:
   - **Project URL** — `https://xxxxxxxx.supabase.co`
   - **anon public** key — long string starting `eyJ...`

## 2. Paste the keys

Top of the `<script>` block in `site/index.html`:

```js
const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```

Open `site/index.html` in a browser and submit a test row to confirm it works.

## 3. Deploy (2 min)

**Netlify Drop** — drag the **`site`** folder (not the project root) onto
https://app.netlify.com/drop.
Live URL instantly, no account needed to start.

**Vercel:**

```bash
npx vercel --prod
```

GitHub Pages and Cloudflare Pages work too — it's a single static file.

Rename the site to something readable (Netlify: Site settings → Change site name), e.g.
`july-opt-ead.netlify.app`. A random auto-generated URL in a Reddit comment about immigration
paperwork reads as a phishing link.

## 4. Post to Reddit

> Made a tiny tracker so we can see the July PP queue in one place — no signup, no email.
> Just username + PP start date + status: <your-url>
> Come back and enter the same username to update when you get the API update / approval.

## Notes

- The page auto-refreshes every 60 seconds.
- The browser remembers your username, so returning visitors get their row pre-filled and
  highlighted in the table.
- There are no passwords: anyone who knows a username could change that row. That's the
  deliberate trade for zero friction. For a 100-person thread it's fine.
- To clean up junk rows: Supabase Studio → **Table Editor → entries** → delete.
- The anon key is public by design. The table has row-level security on with zero policies,
  so that key can only read the view and call `save_entry` — it can't drop, dump, or delete
  anything.

## Clearing test data

Anything you typed in while testing lives in your Supabase table. To wipe it before sharing
the link, run this in **SQL Editor**:

```sql
truncate public.entries;
```

Or delete individual rows in **Table Editor → entries**.
