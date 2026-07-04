import { getCallLogs } from "../../lib/db";

export async function GET() {
  const logs = await getCallLogs();
  return new Response(JSON.stringify({ logs }), {
    headers: { "Content-Type": "application/json" },
  });
}
