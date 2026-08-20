// Thin wrapper over Supabase's REST (PostgREST) endpoint. No npm dependency.
//
// Both env vars are set in Vercel → Project → Settings → Environment Variables.
// The key here is the SERVER-SIDE secret key, which bypasses row-level security.
// It must never appear in public/index.html or anywhere the browser can read.
// Supabase shows the Project URL in two places, one of which already has the
// /rest/v1 path on it. Accept either form rather than making the reader care.
export const normalizeUrl = u =>
  String(u || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");

const BASE = normalizeUrl(process.env.SUPABASE_URL);
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

// Exact row count, read from PostgREST's Content-Range header ("0-0/1234").
// Cheaper and more accurate than fetching rows and measuring the array.
export async function countRows(table = "entries") {
  const r = await fetch(`${BASE}/rest/v1/${table}?select=username&limit=1`, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`supabase ${r.status}: ${await r.text()}`);
  const n = Number((r.headers.get("content-range") || "").split("/")[1]);
  return Number.isFinite(n) ? n : null;
}
