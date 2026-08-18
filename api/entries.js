import { redis, KEY, configured } from "../lib/redis.js";

export default async function handler(req, res) {
  if (!configured()) return res.status(500).json({ error: "storage_not_configured" });

  try {
    // HGETALL comes back as a flat [field, value, field, value, ...] array.
    const flat = (await redis("HGETALL", KEY)) || [];
    const rows = [];
    for (let i = 0; i < flat.length; i += 2) {
      try { rows.push(JSON.parse(flat[i + 1])); } catch { /* skip a corrupt row */ }
    }
    rows.sort((a, b) =>
      a.pp_date === b.pp_date ? a.username.localeCompare(b.username)
                              : a.pp_date < b.pp_date ? -1 : 1);

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: "read_failed" });
  }
}
