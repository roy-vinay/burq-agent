const ROUTE_EMOJI = {
  REFUNDS_TEAM: "💚",
  OPS_ESCALATION: "🔴",
  ORDER_DESK: "🔵",
  PARTNERSHIPS_TEAM: "🟣",
  SUPPORT_L1: "⚪",
  HUMAN_REVIEW: "🟡",
};

export async function sendSlackNotification({ intent, route, urgency, confidence, transcript, source }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const needsHuman = confidence < 70;
  const emoji = ROUTE_EMOJI[route] || "⚪";
  const preview = transcript ? transcript.slice(0, 300).replace(/\n/g, " ") : "No transcript";
  const urgencyBar = "█".repeat(urgency) + "░".repeat(10 - urgency);

  const headerText = needsHuman
    ? `🚨 NEEDS HUMAN REVIEW — Low confidence triage (${confidence}%)`
    : `${emoji} Call Triaged → ${route.replace(/_/g, " ")}`;

  const payload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: headerText, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Intent*\n${intent.replace(/_/g, " ")}` },
          { type: "mrkdwn", text: `*Route*\n${emoji} ${route.replace(/_/g, " ")}` },
          { type: "mrkdwn", text: `*Urgency*\n${urgencyBar} ${urgency}/10` },
          { type: "mrkdwn", text: `*Confidence*\n${confidence}%` },
          { type: "mrkdwn", text: `*Source*\n${source === "live" ? "📞 Live Call" : "📋 Manual Triage"}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Transcript Preview*\n>${preview}${transcript && transcript.length > 300 ? "..." : ""}` },
      },
      { type: "divider" },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Slack notification failed:", err.message);
  }
}
