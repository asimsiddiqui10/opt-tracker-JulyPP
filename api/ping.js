// Hit once a day by Vercel Cron (see vercel.json). A free Supabase project
// pauses itself after 7 days with no API traffic; this guarantees traffic.
import { sb, configured } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (!configured()) return res.status(500).json({ error: "storage_not_configured" });
  try {
    await sb("entries?select=username&limit=1");
    res.status(200).json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: "ping_failed" });
  }
}
