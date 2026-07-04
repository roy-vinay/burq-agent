import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function saveCallLog({ source, transcript, triageText, intent, route, urgency, confidence, durationSeconds }) {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("call_logs").insert([
    { source, transcript, triage_text: triageText, intent, route, urgency, confidence, duration_seconds: durationSeconds ?? null },
  ]).select().single();

  if (error) console.error("Supabase insert error:", error.message);
  return data;
}

export async function getCallLogs() {
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("call_logs")
    .select("id, created_at, source, intent, route, urgency, confidence, duration_seconds, transcript, triage_text")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) console.error("Supabase fetch error:", error.message);
  return data || [];
}
