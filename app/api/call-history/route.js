import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return new Response(JSON.stringify({ logs: [], debug: "missing env vars", url: !!url, key: !!key }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("call_logs")
    .select("id, created_at, source, intent, route, urgency, confidence, duration_seconds, transcript, triage_text")
    .order("created_at", { ascending: false })
    .limit(100);

  return new Response(JSON.stringify({ logs: data || [], error: error?.message || null }), {
    headers: { "Content-Type": "application/json" },
  });
}
