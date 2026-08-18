// Diagnostic endpoint: open /api/health in a browser to see which piece of the
// setup is missing. Deliberately reports no secret values — only whether they
// are present and what the database said back.
import { normalizeUrl } from "../lib/supabase.js";

const RAW_URL = normalizeUrl(process.env.SUPABASE_URL);
const RAW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export default async function handler(req, res) {
  const out = {
    SUPABASE_URL_set: Boolean(RAW_URL),
    SUPABASE_KEY_set: Boolean(RAW_KEY),
    url_looks_right: /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(RAW_URL),
    url_value: RAW_URL || null,   // not a secret
    key_kind: !RAW_KEY ? null
      : RAW_KEY.startsWith("sb_secret_") ? "secret key (correct)"
      : RAW_KEY.startsWith("sb_publishable_") ? "PUBLISHABLE key — wrong, use the secret key"
      : RAW_KEY.startsWith("eyJ") ? "legacy JWT key (works if it is service_role, not anon)"
      : "unrecognized",
    key_length: RAW_KEY.length || 0,
  };

  if (!out.SUPABASE_URL_set || !out.SUPABASE_KEY_set) {
    out.ok = false;
    out.next_step = "Add the missing variable in Vercel → Settings → Environment " +
                    "Variables, then redeploy.";
    return res.status(200).json(out);
  }

  try {
    const r = await fetch(`${RAW_URL}/rest/v1/entries?select=username&limit=1`, {
      headers: { apikey: RAW_KEY, Authorization: `Bearer ${RAW_KEY}` },
      cache: "no-store",
    });
    const body = await r.text();
    out.database_status = r.status;
    out.ok = r.ok;

    if (!r.ok) {
      out.database_said = body.slice(0, 300);
      if (body.includes("PGRST125")) {
        out.next_step = "SUPABASE_URL has an extra path on it — it should end at " +
                        ".supabase.co, with no /rest/v1.";
      } else if (r.status === 404 || body.includes("PGRST205")) {
        out.next_step = "The entries table does not exist — run schema.sql in the " +
                        "Supabase SQL Editor.";
      } else if (r.status === 401 || r.status === 403) {
        out.next_step = "The key was rejected. Use the SECRET key (sb_secret_...), " +
                        "not the publishable/anon one, then redeploy.";
      } else {
        out.next_step = "See database_said above.";
      }
    } else {
      out.row_count_sample = JSON.parse(body).length;
      out.next_step = "Everything is wired up correctly.";
    }
  } catch (e) {
    out.ok = false;
    out.fetch_error = String(e.message).slice(0, 200);
    out.next_step = "Could not reach that URL at all — check SUPABASE_URL is the " +
                    "Project URL from Settings → Data API.";
  }

  res.status(200).json(out);
}
