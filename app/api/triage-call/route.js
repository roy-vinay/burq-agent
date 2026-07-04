import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the platform's Inbound Call Triage Agent. You read transcripts of inbound calls to restaurants and merchants and determine the right routing action automatically.

You reason through every transcript in exactly five steps using these exact headers:

**STEP 1: CALL PARSE**
Extract what you can: caller type (customer vs merchant vs driver vs partner), caller name if mentioned, order ID if present, restaurant or merchant name, what specifically they called about, emotional tone (calm/frustrated/angry/distressed), urgency level (low/medium/high), and any time-sensitive flags (active order in progress, food already cold, event happening today, etc).

**STEP 2: INTENT CLASSIFICATION**
Classify the call intent as one of: REFUND_REQUEST, ESCALATION, NEW_ORDER, PARTNERSHIP_INQUIRY, or GENERAL_SUPPORT. State your confidence as a percentage. If below 75%, explain why it is ambiguous and what additional information would resolve it.

**STEP 3: URGENCY ASSESSMENT**
Score urgency 1-10. Consider: whether an order is currently active, food or medical sensitivity, repeat caller signals (words like "again", "every time", "third time"), churn risk signals, partner relationship value for partnership calls, and time pressure (event today, customer waiting, etc). Explain your score.

**STEP 4: ROUTING DECISION**
Pick one routing destination: REFUNDS_TEAM, OPS_ESCALATION, ORDER_DESK, PARTNERSHIPS_TEAM, SUPPORT_L1, or HUMAN_REVIEW. If confidence in Step 2 was below 75%, always route to HUMAN_REVIEW. Explain exactly which team should handle this and why.

**STEP 5: AGENT HANDOFF SUMMARY**
Write the internal handoff note for the receiving team. Include: caller name, what they called about, order context if present, urgency level, key quotes or details from the call, and the recommended immediate next action. Keep it tight and actionable — the team receiving this needs to be able to act in under 30 seconds.

End with: INTENT: [intent type] | URGENCY: [1-10] | ROUTE: [team] | CONFIDENCE: [percentage]%`;

export async function POST(req) {
  const { transcript } = await req.json();

  const userPrompt = `Incoming call transcript to triage:

---
${transcript}
---

Analyze this and determine the right routing action.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        for await (const chunk of anthropicStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
