import Anthropic from "@anthropic-ai/sdk";
import { sendSlackNotification } from "../../lib/slack";
import { saveCallLog } from "../../lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the platform's Inbound Call Triage Agent. You read transcripts of inbound calls to restaurants and merchants and determine the right routing action automatically.

The transcript may be in any language. Perform your analysis in English but note the caller's language in STEP 1.

You reason through every transcript in exactly five steps using these exact headers:

**STEP 1: CALL PARSE**
Extract what you can: caller type (customer vs merchant vs driver vs partner), caller name if mentioned, order ID if present, restaurant or merchant name, what specifically they called about, emotional tone (calm/frustrated/angry/distressed), urgency level (low/medium/high), caller's language, and any time-sensitive flags (active order in progress, food already cold, event happening today, etc).

**STEP 2: INTENT CLASSIFICATION**
Classify the call intent as one of: REFUND_REQUEST, ESCALATION, NEW_ORDER, PARTNERSHIP_INQUIRY, or GENERAL_SUPPORT. State your confidence as a percentage. If below 75%, explain why it is ambiguous and what additional information would resolve it.

**STEP 3: URGENCY ASSESSMENT**
Score urgency 1-10. Consider: whether an order is currently active, food or medical sensitivity, repeat caller signals (words like "again", "every time", "third time"), churn risk signals, partner relationship value for partnership calls, and time pressure (event today, customer waiting, etc). Explain your score.

**STEP 4: ROUTING DECISION**
Pick one routing destination: REFUNDS_TEAM, OPS_ESCALATION, ORDER_DESK, PARTNERSHIPS_TEAM, SUPPORT_L1, or HUMAN_REVIEW. If confidence in Step 2 was below 70%, you MUST route to HUMAN_REVIEW regardless of intent. Explain exactly which team should handle this and why.

**STEP 5: AGENT HANDOFF SUMMARY**
Write the internal handoff note for the receiving team. Include: caller name, what they called about, order context if present, urgency level, key quotes or details from the call, and the recommended immediate next action. If routed to HUMAN_REVIEW due to low confidence, explicitly state what additional information is needed to resolve the ambiguity. Keep it tight and actionable.

End with: INTENT: [intent type] | URGENCY: [1-10] | ROUTE: [team] | CONFIDENCE: [percentage]%`;

function extractVerdict(text) {
  const match = text.match(/\*{0,2}INTENT:\*{0,2}\s*([A-Z_]+)[^|]*\|\s*\*{0,2}\s*URGENCY:\*{0,2}\s*(\d+)(?:\/\d+)?\s*\*{0,2}\s*\|\s*\*{0,2}\s*ROUTE:\*{0,2}\s*([A-Z_]+)[^|]*\|\s*\*{0,2}\s*CONFIDENCE:\*{0,2}\s*(\d+)%\*{0,2}/i);
  if (!match) {
    console.error("[triage-call] extractVerdict failed. Last 300 chars:", text.slice(-300));
    return null;
  }
  return { intent: match[1], urgency: parseInt(match[2]), route: match[3], confidence: parseInt(match[4]) };
}

export async function POST(req) {
  const { transcript, source = "manual", durationSeconds } = await req.json();

  const userPrompt = `Incoming call transcript to triage:\n\n---\n${transcript}\n---\n\nAnalyze this and determine the right routing action.`;
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

        let accumulated = "";
        for await (const chunk of anthropicStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            accumulated += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        // Fire Slack + Supabase before closing stream so Vercel doesn't kill the function
        const verdict = extractVerdict(accumulated);
        if (verdict) {
          await Promise.allSettled([
            sendSlackNotification({ ...verdict, transcript, source }),
            saveCallLog({ source, transcript, triageText: accumulated, ...verdict, durationSeconds }),
          ]);
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
