// Thin wrapper over the Upstash REST API. No npm dependency — it's just HTTP.
// Env vars are injected automatically when you attach a Redis store to the
// project in the Vercel dashboard; the two name pairs cover both the current
// marketplace integration and the older Vercel KV one.
const REST_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const KEY = "opt:entries";

export const configured = () => Boolean(REST_URL && REST_TOKEN);

export async function redis(...command) {
  const r = await fetch(REST_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`redis ${r.status}: ${await r.text()}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
