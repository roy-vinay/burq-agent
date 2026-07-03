import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the platform's Operations Triage Agent. You read forwarded customer and merchant emails and decide what to do about them automatically.

You reason through every email in exactly five steps using these exact headers:

**STEP 1: EMAIL PARSE**
Extract what you can: sender type (customer vs merchant vs driver), merchant name, order ID if present, item type if mentioned, what specifically went wrong, emotional urgency (low/medium/high), and any compliance or safety flags.

**STEP 2: ISSUE CLASSIFICATION**
Classify the issue as one of: DELIVERY_FAILURE, SLA_BREACH, DAMAGED_GOODS, FRAUD_SUSPICION, or WISMO. State your confidence as a percentage. If below 75%, explain why it is ambiguous and what additional information would resolve it.

**STEP 3: SEVERITY ASSESSMENT**
Score severity 1-10. Consider: order value if known, item type (medical items score higher), customer history signals, pattern indicators (words like "again", "third time", "always"), and churn risk signals. Explain your score.

**STEP 4: RECOMMENDED ACTION**
Pick one primary action: INITIATE_REFUND, ESCALATE_PROVIDER, REROUTE_ORDER, DRAFT_APOLOGY, FLAG_FRAUD, or FLAG_HUMAN_REVIEW. If confidence in Step 2 was below 75%, always recommend FLAG_HUMAN_REVIEW. Explain exactly what should happen and why.

**STEP 5: DRAFT OUTPUT**
Write the actual output of the action. If refund: draft the refund confirmation to the customer. If provider escalation: draft the internal escalation note. If apology: draft the customer-facing response. If human review: write the internal handoff note with all context. Keep it professional and on-brand.

End with: ACTION: [action type] | SEVERITY: [1-10] | CONFIDENCE: [percentage]%`;

export async function POST(req) {
  const { email } = await req.json();

  const userPrompt = `Incoming email to triage:

---
${email}
---

Analyze this and determine the right automated response.`;

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
