// Thin wrapper over Supabase's REST (PostgREST) endpoint. No npm dependency.
//
// Both env vars are set in Vercel → Project → Settings → Environment Variables.
// The key here is the SERVER-SIDE secret key, which bypasses row-level security.
// It must never appear in public/index.html or anywhere the browser can read.
const BASE = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export const configured = () => Boolean(BASE && KEY);

export async function sb(pathAndQuery, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;

  const r = await fetch(`${BASE}/rest/v1/${pathAndQuery}`, {
    method, headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`supabase ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}
