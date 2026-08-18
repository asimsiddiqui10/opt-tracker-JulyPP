import { redis, KEY, configured } from "../lib/redis.js";

const STATUSES = new Set(["waiting", "api_update", "approved", "card_produced", "delivered"]);
const MAX_ENTRIES = 200;   // backstop so a bored visitor can't fill the store

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!configured()) return res.status(500).json({ error: "storage_not_configured" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const username = String(body.username || "")
    .trim().toLowerCase()
    .replace(/^\/?u\//, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30);
  const pp_date = String(body.pp_date || "");
  const status  = String(body.status  || "");

  if (username.length < 2)                    return res.status(400).json({ error: "bad_username" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pp_date))   return res.status(400).json({ error: "bad_date" });
  if (Number.isNaN(Date.parse(pp_date)))      return res.status(400).json({ error: "bad_date" });
  if (!STATUSES.has(status))                  return res.status(400).json({ error: "bad_status" });

  try {
    const prevRaw = await redis("HGET", KEY, username);
    let prev = null;
    if (prevRaw) { try { prev = JSON.parse(prevRaw); } catch { /* overwrite junk */ } }

    if (!prev && (await redis("HLEN", KEY)) >= MAX_ENTRIES) {
      return res.status(429).json({ error: "tracker_full" });
    }

    const now = new Date().toISOString();
    const entry = {
      username, pp_date, status,
      created_at: (prev && prev.created_at) || now,
      updated_at: now,
    };
    await redis("HSET", KEY, username, JSON.stringify(entry));

    res.status(200).json({ ok: true, existed: Boolean(prev), entry });
  } catch (e) {
    res.status(500).json({ error: "write_failed" });
  }
}
