import { sb, configured } from "../lib/supabase.js";

const STATUSES = new Set(["waiting", "api_update", "approved", "card_produced", "delivered"]);
const MAX_ENTRIES = 200;   // backstop so a bored visitor can't fill the table

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

  if (username.length < 2)                  return res.status(400).json({ error: "bad_username" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pp_date)) return res.status(400).json({ error: "bad_date" });
  if (Number.isNaN(Date.parse(pp_date)))    return res.status(400).json({ error: "bad_date" });
  if (!STATUSES.has(status))                return res.status(400).json({ error: "bad_status" });

  try {
    const found = await sb(
      `entries?select=username&username=eq.${encodeURIComponent(username)}`);
    const existed = Array.isArray(found) && found.length > 0;

    if (!existed) {
      const all = await sb(`entries?select=username&limit=${MAX_ENTRIES + 1}`);
      if ((all || []).length >= MAX_ENTRIES) {
        return res.status(429).json({ error: "tracker_full" });
      }
    }

    // Upsert on the username primary key. created_at is deliberately absent from
    // the payload so an update leaves the original value alone.
    const saved = await sb("entries", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: [{ username, pp_date, status, updated_at: new Date().toISOString() }],
    });

    res.status(200).json({ ok: true, existed, entry: (saved || [])[0] });
  } catch (e) {
    res.status(500).json({ error: "write_failed" });
  }
}
