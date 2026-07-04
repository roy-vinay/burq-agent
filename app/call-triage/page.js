"use client";
import { useState, useRef, useEffect } from "react";
import "../globals.css";

const SCENARIOS = [
  {
    label: "Wrong Order Delivered",
    emoji: "🍕",
    type: "REFUND_REQUEST",
    description: "Customer — refund",
    color: "#10B981",
    transcript: `[Inbound call — Tony's Pizza — 7:42 PM]

Agent: Thank you for calling Tony's Pizza, how can I help you?

Customer: Hi yeah, I just got my delivery and it's completely wrong. I ordered a large pepperoni with extra cheese and garlic bread, and they sent me like a veggie pizza and some random pasta. My order number is TP-20260703-8821.

Agent: I'm really sorry about that. Let me pull up your order.

Customer: And it's cold too. Like it's been sitting here for a while. I've been waiting for over an hour for this.

Agent: I completely understand your frustration. Can I get your name?

Customer: It's Sarah. Sarah Moreno.

Agent: Sarah, I can see your order here. You're absolutely right — there's been a mix-up at our end. I want to make this right for you.

Customer: I just want a refund at this point. I'm not going to wait another hour. My kids are hungry.

Agent: Of course, I completely understand. I'll process a full refund for you right now. Is there anything else I can help you with?

Customer: No, a refund is fine. Thank you.

[Call ended — duration 3m 14s]`,
  },
  {
    label: "Driver No-Show Again",
    emoji: "🚨",
    type: "ESCALATION",
    description: "Merchant — escalation",
    color: "#DC2626",
    transcript: `[Inbound call — Dispatch Merchant Line — 6:15 PM]

Agent: Dispatch merchant support, how can I help?

Caller: This is Ahmed from Karachi Grill on Main. I need to speak to a manager right now.

Agent: Of course, what's happening?

Caller: Your driver has not shown up again. This is the third time this week. I have food sitting here getting cold, the customer is calling me directly now, and your app says the driver is "on the way" but he's not here. He's been "on the way" for 45 minutes.

Agent: I apologize, let me check on that order—

Caller: Order KG-7741. And I'm telling you, if this keeps happening I'm switching to a different platform. We've been with you for two years. Two years. And this month has been a disaster. Every Friday evening, same problem.

Agent: I can see the order. The driver's GPS shows—

Caller: I don't care what the GPS shows. The food is here and the driver is not. I need someone to either send another driver in the next 10 minutes or I'm canceling this order and you're paying for the food.

Agent: I'm escalating this right now to our dispatch team.

Caller: You said that last time too. I want a call back from a supervisor today.

[Call ended — duration 5m 51s]`,
  },
  {
    label: "Catering Order Request",
    emoji: "📦",
    type: "NEW_ORDER",
    description: "Restaurant — new order",
    color: "#2079F9",
    transcript: `[Inbound call — Tony's Pizza — 10:30 AM]

Agent: Thank you for calling Tony's Pizza, how can I help you?

Caller: Hi, I'm calling from the Greenfield Corporate Park. We have our quarterly company event tomorrow afternoon and we want to place a large catering order.

Agent: Absolutely, we'd love to help with that. How many people are we talking about?

Caller: About 80 people. We're thinking 15 large pizzas, a mix of pepperoni, margherita, and BBQ chicken. And we'd need it delivered by 12:30pm. The address is 2400 Greenfield Boulevard, Building C.

Agent: Let me check our availability for tomorrow. Can I get your name and a contact number?

Caller: Sure, it's James Whitfield, 408-555-0192.

Agent: Great James. We can definitely do 15 large pizzas for tomorrow at 12:30. For an order this size we'll need a 50% deposit. Would you like to pay that now over the phone?

Caller: Yes, let's do that. I have my company card here.

[Call ended — duration 6m 22s]`,
  },
  {
    label: "Partnership Inquiry",
    emoji: "🤝",
    type: "PARTNERSHIP_INQUIRY",
    description: "Business — partnership",
    color: "#7C3AED",
    transcript: `[Inbound call — Dispatch main line — 2:45 PM]

Agent: Thank you for calling Dispatch, how can I direct your call?

Caller: Hi, my name is Priya Sharma. I'm the operations director at FreshBowl — we're a fast-casual chain with 12 locations across Lahore and Karachi. I was hoping to speak with someone about potentially partnering with you for our delivery operations.

Agent: Hi Priya, I'd love to connect you with the right person. Can you tell me a little more about what you're looking for?

Caller: Sure. We currently use two different delivery providers and it's becoming a management headache. We're doing roughly 400 to 500 deliveries a day across all locations. We've heard good things about the platform's dashboard and the way you handle SLA tracking. We're interested in consolidating everything onto one platform.

Agent: That's a significant volume. We'd definitely want to set up a proper conversation with our partnerships team.

Caller: Yes, that would be ideal. We're looking to make a decision by end of July. I should mention we've also had a preliminary call with Foodpanda's B2B team so we're comparing options.

Agent: Understood, I'll make sure our team reaches out to you today.

[Call ended — duration 4m 08s]`,
  },
  {
    label: "Confused Angry Caller",
    emoji: "😤",
    type: "GENERAL_SUPPORT",
    description: "Messy — ambiguous",
    color: "#6B7280",
    transcript: `[Inbound call — Tony's Pizza — 8:55 PM]

Agent: Tony's Pizza, how can I help?

Caller: Yeah hi I need to figure out what's going on with my order.

Agent: Of course, can I get your order number?

Caller: I don't know the number. I ordered online like an hour ago. My name's Mike.

Agent: Last name?

Caller: Uh... Davidson. Mike Davidson.

Agent: Let me look that up. I see a few orders here — was it tonight?

Caller: Yes tonight obviously. I'm waiting for it. The app said 35 to 45 minutes. It's been way longer than that.

Agent: I see one order placed at 7:58pm, is that yours?

Caller: Maybe? I don't know. It said delivered but I never got anything. And also I wanted to ask about the charge on my card because I got charged twice I think. Or maybe it's from last time. I'm not sure.

Agent: Okay, let me check—

Caller: And actually can you also tell me if you guys do gluten free crust? My wife just found out she can't eat gluten and I want to order for her next time.

Agent: We do have a gluten-free option. For your current order—

Caller: Right yeah so the order, the charge, and the gluten thing. I also might want to cancel and reorder if you have a different deal.

[Call ended — duration 7m 02s]`,
  },
];

const STEP_LABELS = ["Call Parse", "Intent Classification", "Urgency Assessment", "Routing Decision", "Agent Handoff Summary"];
const STEP_COLORS = [
  { bg: "#EBF3FF", border: "#2079F9", text: "#2079F9", num: "#2079F9" },
  { bg: "#FFF7ED", border: "#F97316", text: "#EA580C", num: "#F97316" },
  { bg: "#F0FDF4", border: "#22C55E", text: "#16A34A", num: "#22C55E" },
  { bg: "#F5F3FF", border: "#8B5CF6", text: "#7C3AED", num: "#8B5CF6" },
  { bg: "#E6F9FD", border: "#00BADA", text: "#0891B2", num: "#00BADA" },
];

const ROUTE_COLORS = {
  REFUNDS_TEAM: { bg: "#ECFDF5", text: "#059669", border: "#6EE7B7" },
  OPS_ESCALATION: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  ORDER_DESK: { bg: "#EBF3FF", text: "#2079F9", border: "#93C5FD" },
  PARTNERSHIPS_TEAM: { bg: "#F5F3FF", text: "#7C3AED", border: "#C4B5FD" },
  SUPPORT_L1: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  HUMAN_REVIEW: { bg: "#FFFBEB", text: "#D97706", border: "#FCD34D" },
};

function parseSteps(text) {
  const parts = text.split(/(\*\*STEP \d+:[^*]+\*\*)/);
  const steps = [];
  let currentStep = null;
  for (const part of parts) {
    const headerMatch = part.match(/\*\*STEP (\d+): ([^*]+)\*\*/);
    if (headerMatch) {
      if (currentStep) steps.push(currentStep);
      currentStep = { num: parseInt(headerMatch[1]), label: headerMatch[2].trim(), content: "" };
    } else if (currentStep) {
      currentStep.content += part;
    }
  }
  if (currentStep) steps.push(currentStep);
  return steps;
}

function extractVerdict(text) {
  const match = text.match(/INTENT:\*{0,2}\s*([A-Z_]+)(?:\s*\([^)]*\))?\s*\*{0,2}\s*\|\s*\*{0,2}\s*URGENCY:\*{0,2}\s*(\d+)(?:\/\d+)?\s*\*{0,2}\s*\|\s*\*{0,2}\s*ROUTE:\*{0,2}\s*([A-Z_]+)\s*\*{0,2}\s*\|\s*\*{0,2}\s*CONFIDENCE:\*{0,2}\s*(\d+)%/i);
  if (!match) return null;
  return { intent: match[1], urgency: parseInt(match[2]), route: match[3], confidence: parseInt(match[4]) };
}

function StepCard({ step, isActive }) {
  const colors = STEP_COLORS[step.num - 1] || STEP_COLORS[0];
  return (
    <div style={{ background: colors.bg, border: `1.5px solid ${isActive ? colors.border : "#E5E7EB"}`, borderRadius: 10, padding: "16px 20px", marginBottom: 12, transition: "border-color 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: colors.num, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{step.num}</div>
        <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{STEP_LABELS[step.num - 1] || step.label}</span>
        {isActive && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: colors.border, animation: "pulse 1s infinite", flexShrink: 0 }} />}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.75, color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {step.content.trim() || (isActive ? "Analyzing..." : "")}
      </div>
    </div>
  );
}

function VerdictCard({ verdict }) {
  const lowConfidence = verdict.confidence < 70;
  const displayRoute = lowConfidence ? "HUMAN_REVIEW" : verdict.route;
  const colors = ROUTE_COLORS[displayRoute] || ROUTE_COLORS.HUMAN_REVIEW;
  const urgencyColor = verdict.urgency >= 8 ? "#DC2626" : verdict.urgency >= 5 ? "#F59E0B" : "#10B981";
  const confidenceColor = verdict.confidence >= 80 ? "#10B981" : verdict.confidence >= 60 ? "#F59E0B" : "#DC2626";

  return (
    <div style={{ background: "linear-gradient(135deg, #1B1C1C 0%, #2C2D2D 100%)", borderRadius: 12, padding: "20px 24px", marginTop: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
      {lowConfidence && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>Low confidence ({verdict.confidence}%) — flagged for human review</div>
            <div style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>Originally routed to: {verdict.route.replace(/_/g, " ")}</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#00BADA", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>Routing Decision</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Intent</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{verdict.intent.replace(/_/g, " ")}</div>
      </div>

      <div style={{ display: "inline-block", background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px", marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>→ {displayRoute.replace(/_/g, " ")}</span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={statStyle}>
          <span style={statLabel}>Urgency</span>
          <span style={{ ...statValueBase, color: urgencyColor }}>{verdict.urgency} / 10</span>
        </div>
        <div style={statStyle}>
          <span style={statLabel}>Confidence</span>
          <span style={{ ...statValueBase, color: confidenceColor }}>{verdict.confidence}%</span>
        </div>
        <div style={statStyle}>
          <span style={statLabel}>Triaged By</span>
          <span style={{ ...statValueBase, color: "#00BADA" }}>Pulse AI</span>
        </div>
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>
        Routed automatically in &lt;2s · Ready for handoff
      </div>
    </div>
  );
}

const statStyle = { background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2 };
const statLabel = { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" };
const statValueBase = { fontSize: 16, fontWeight: 700 };

export default function CallTriagePage() {
  const [transcriptText, setTranscriptText] = useState(SCENARIOS[0].transcript);
  const [activeScenario, setActiveScenario] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [fullText, setFullText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const outputRef = useRef(null);

  const steps = parseSteps(fullText);
  const verdict = done ? extractVerdict(fullText) : null;

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [fullText]);

  function loadScenario(idx) {
    setActiveScenario(idx);
    setTranscriptText(SCENARIOS[idx].transcript);
    setFullText("");
    setDone(false);
    setError(null);
  }

  async function runAgent() {
    if (!transcriptText.trim()) return;
    setStreaming(true);
    setFullText("");
    setDone(false);
    setError(null);

    try {
      const res = await fetch("/api/triage-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        accumulated += decoder.decode(value, { stream: true });
        setFullText(accumulated);
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .run-btn:hover:not(:disabled) { background: #1560D4 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(32,121,249,0.35) !important; }
        .scenario-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        textarea:focus { border-color: #2079F9 !important; box-shadow: 0 0 0 3px rgba(32,121,249,0.1); outline: none; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>

        <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, #2079F9, #00BADA)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>B</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1B1C1C", lineHeight: 1.2 }}>Pulse AI</div>
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.04em" }}>Call Triage Agent</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Provider Selection</a>
            <a href="/email-agent" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Email Triage</a>
            <a href="/call-triage" style={{ fontSize: 13, color: "#2079F9", textDecoration: "none", fontWeight: 600, borderBottom: "2px solid #2079F9", paddingBottom: 2 }}>Call Triage</a>
            <a href="/live-call" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Live Call</a>
            <a href="/history" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>History</a>
            <a href="/settings" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>⚙ Settings</a>
          </div>
        </header>

        <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "12px 32px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Quick Load</span>
          {SCENARIOS.map((s, i) => (
            <button key={i} className="scenario-btn" onClick={() => loadScenario(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${activeScenario === i ? s.color : "#E5E7EB"}`, background: activeScenario === i ? s.color + "14" : "#fff", color: activeScenario === i ? s.color : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <main style={{ flex: 1, display: "grid", gridTemplateColumns: "440px 1fr", gap: 24, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "24px 32px", alignItems: "start" }}>

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)", position: "sticky", top: 120 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1C1C" }}>Call Transcript</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>Paste or type any transcript</span>
            </div>

            <div style={{ padding: "20px" }}>
              <textarea
                value={transcriptText}
                onChange={e => { setTranscriptText(e.target.value); setActiveScenario(null); }}
                placeholder="Paste a call transcript here — customer complaint, merchant escalation, new order request, or partnership inquiry..."
                style={{ width: "100%", height: 340, padding: "12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, color: "#374151", resize: "vertical", transition: "border-color 0.2s", background: "#FAFAFA" }}
              />

              <button className="run-btn" onClick={runAgent} disabled={streaming || !transcriptText.trim()} style={{ width: "100%", marginTop: 14, background: streaming ? "#9CA3AF" : "#2079F9", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: streaming ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {streaming ? (
                  <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Triaging Call...</>
                ) : (
                  <><span style={{ fontSize: 16 }}>📞</span>Triage This Call</>
                )}
              </button>
            </div>
          </div>

          <div ref={outputRef}>
            {!fullText && !streaming && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #D1D5DB", padding: "60px 40px", textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📞</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>Call Triage Agent is ready</div>
                <div style={{ fontSize: 13 }}>Load a scenario or paste your own call transcript, then hit "Triage This Call" to watch the agent classify, score, and route in real time.</div>
              </div>
            )}

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "16px 20px", color: "#DC2626", fontSize: 13 }}>Error: {error}</div>
            )}

            {steps.length > 0 && (
              <div>
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Agent Reasoning</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{steps.length} / 5 steps</div>
                </div>
                {steps.map((step, i) => (
                  <StepCard key={step.num} step={step} isActive={streaming && i === steps.length - 1} />
                ))}
                {verdict && <VerdictCard verdict={verdict} />}
              </div>
            )}
          </div>
        </main>

        <footer style={{ padding: "16px 32px", textAlign: "center", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid var(--border)", background: "#fff" }}>
          Built on <span style={{ color: "#2079F9", fontWeight: 600 }}>Dispatch</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </>
  );
}
