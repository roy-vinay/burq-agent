export async function POST(req) {
  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_RETELL_AGENT_ID;

  if (!apiKey || !agentId) {
    return new Response(JSON.stringify({ error: "Retell not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { profile } = await req.json();

  const res = await fetch("https://api.retellai.com/v2/create-web-call", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      retell_llm_dynamic_variables: {
        restaurant_name: profile?.name || "Tony's Pizza",
        agent_name: profile?.agentName || "Maya",
        menu: profile?.menu || "",
        hours: profile?.hours || "",
        refund_policy: profile?.refundPolicy || "",
        phone: profile?.phone || "",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify({ access_token: data.access_token }), {
    headers: { "Content-Type": "application/json" },
  });
}
