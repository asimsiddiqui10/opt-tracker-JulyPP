import { sb, configured } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (!configured()) return res.status(500).json({ error: "storage_not_configured" });

  try {
    const rows = await sb(
      "entries?select=username,pp_date,status,created_at,updated_at" +
      "&order=pp_date.asc,username.asc");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(rows || []);
  } catch (e) {
    res.status(500).json({ error: "read_failed" });
  }
}
