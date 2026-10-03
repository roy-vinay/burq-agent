"use client";
import { useState, useRef, useEffect } from "react";
import { Phone } from "lucide-react";
import Nav from "../components/Nav";
import "../globals.css";

const SCENARIOS = [
  {
    label: "Wrong Order",
    emoji: "🍕",
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
    label: "Driver No-Show",
    emoji: "🚨",
    color: "#DC2626",
    transcript: `[Inbound call — Dispatch Merchant Line — 6:15 PM]

Agent: Dispatch merchant support, how can I help?

Caller: This is Ahmed from Karachi Grill on Main. I need to speak to a manager right now.

Agent: Of course, what's happening?

Caller: Your driver has not shown up again. This is the third time this week. I have food sitting here getting cold, the customer is calling me directly now, and your app says the driver is "on the way" but he's not here. He's been "on the way" for 45 minutes.

Agent: I apologize, let me check on that order—

Caller: Order KG-7741. And I'm telling you, if this keeps happening I'm switching to a different platform. We've been with you for two years. Two years. And this month has been a disaster. Every Friday evening, same problem.

Caller: I don't care what the GPS shows. The food is here and the driver is not. I need someone to either send another driver in the next 10 minutes or I'm canceling this order and you're paying for the food.

Agent: I'm escalating this right now to our dispatch team.

Caller: You said that last time too. I want a call back from a supervisor today.

[Call ended — duration 5m 51s]`,
  },
  {
    label: "Catering Order",
    emoji: "📦",
    color: "#2563EB",
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
    color: "#7C3AED",
    transcript: `[Inbound call — Dispatch main line — 2:45 PM]

Agent: Thank you for calling Dispatch, how can I direct your call?

Caller: Hi, my name is Priya Sharma. I'm the operations director at FreshBowl — we're a fast-casual chain with 12 locations across Lahore and Karachi. I was hoping to speak with someone about potentially partnering with you for our delivery operations.

Caller: Sure. We currently use two different delivery providers and it's becoming a management headache. We're doing roughly 400 to 500 deliveries a day across all locations. We've heard good things about the platform's dashboard and the way you handle SLA tracking. We're interested in consolidating everything onto one platform.

Agent: That's a significant volume. We'd definitely want to set up a proper conversation with our partnerships team.

Caller: Yes, that would be ideal. We're looking to make a decision by end of July. I should mention we've also had a preliminary call with Foodpanda's B2B team so we're comparing options.

Agent: Understood, I'll make sure our team reaches out to you today.

[Call ended — duration 4m 08s]`,
  },
  {
    label: "Confused Caller",
    emoji: "😤",
    color: "#6B7280",
    transcript: `[Inbound call — Tony's Pizza — 8:55 PM]

Agent: Tony's Pizza, how can I help?

Caller: Yeah hi I need to figure out what's going on with my order.

Agent: Of course, can I get your order number?

Caller: I don't know the number. I ordered online like an hour ago. My name's Mike. Mike Davidson.

Agent: Let me look that up. I see a few orders here — was it tonight?

Caller: Yes tonight obviously. I'm waiting for it. The app said 35 to 45 minutes. It's been way longer than that.

Agent: I see one order placed at 7:58pm, is that yours?

Caller: Maybe? I don't know. It said delivered but I never got anything. And also I wanted to ask about the charge on my card because I got charged twice I think. Or maybe it's from last time. I'm not sure.

Agent: Okay, let me check—

Caller: And actually can you also tell me if you guys do gluten free crust? My wife just found out she can't eat gluten and I want to order for her next time.

Caller: Right yeah so the order, the charge, and the gluten thing. I also might want to cancel and reorder if you have a different deal.

[Call ended — duration 7m 02s]`,
  },
];

const STEP_LABELS = ["Call Parse", "Intent Classification", "Urgency Assessment", "Routing Decision", "Agent Handoff Summary"];
const STEP_COLORS = [
  { bg: "#EFF6FF", border: "#2563EB", text: "#2563EB", num: "#2563EB" },
  { bg: "#FFF7ED", border: "#F97316", text: "#EA580C", num: "#F97316" },
  { bg: "#F0FDF4", border: "#16A34A", text: "#15803D", num: "#16A34A" },
  { bg: "#F5F3FF", border: "#7C3AED", text: "#6D28D9", num: "#7C3AED" },
  { bg: "#ECFEFF", border: "#0891B2", text: "#0E7490", num: "#0891B2" },
];

const ROUTE_COLORS = {
  REFUNDS_TEAM:      { bg: "#ECFDF5", text: "#059669", border: "#6EE7B7" },
  OPS_ESCALATION:    { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  ORDER_DESK:        { bg: "#EFF6FF", text: "#2563EB", border: "#93C5FD" },
  PARTNERSHIPS_TEAM: { bg: "#F5F3FF", text: "#7C3AED", border: "#C4B5FD" },
  SUPPORT_L1:        { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  HUMAN_REVIEW:      { bg: "#FFFBEB", text: "#D97706", border: "#FCD34D" },
};

function parseSteps(text) {
  const parts = text.split(/(\*\*STEP \d+:[^*]+\*\*)/);
  const steps = [];
  let currentStep = null;
  for (const part of parts) {
    const m = part.match(/\*\*STEP (\d+): ([^*]+)\*\*/);
    if (m) {
      if (currentStep) steps.push(currentStep);
      currentStep = { num: parseInt(m[1]), label: m[2].trim(), content: "" };
    } else if (currentStep) {
      currentStep.content += part;
    }
  }
  if (currentStep) steps.push(currentStep);
  return steps;
}

function extractVerdict(text) {
  const m = text.match(/\*{0,2}INTENT:\*{0,2}\s*([A-Z_]+)[^|]*\|\s*\*{0,2}\s*URGENCY:\*{0,2}\s*(\d+)(?:\/\d+)?\s*\*{0,2}\s*\|\s*\*{0,2}\s*ROUTE:\*{0,2}\s*([A-Z_]+)[^|]*\|\s*\*{0,2}\s*CONFIDENCE:\*{0,2}\s*(\d+)%\*{0,2}/i);
  if (!m) return null;
  return { intent: m[1], urgency: parseInt(m[2]), route: m[3], confidence: parseInt(m[4]) };
}

function StepCard({ step, isActive }) {
  const colors = STEP_COLORS[step.num - 1] || STEP_COLORS[0];
  return (
    <div style={{ background: colors.bg, border: `1.5px solid ${isActive ? colors.border : "var(--border)"}`, borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 10, transition: "border-color 0.25s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: colors.num, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{step.num}</div>
        <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{STEP_LABELS[step.num - 1] || step.label}</span>
        {isActive && <span className="pulse-dot" style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: colors.border, flexShrink: 0 }} />}
      </div>
      <div className="step-content">{step.content.trim() || (isActive ? "Analyzing..." : "")}</div>
    </div>
  );
}

function VerdictCard({ verdict }) {
  const lowConfidence = verdict.confidence < 70;
  const displayRoute = lowConfidence ? "HUMAN_REVIEW" : verdict.route;
  const colors = ROUTE_COLORS[displayRoute] || ROUTE_COLORS.HUMAN_REVIEW;
  const urgencyColor = verdict.urgency >= 8 ? "#DC2626" : verdict.urgency >= 5 ? "#D97706" : "#059669";
  const confidenceColor = verdict.confidence >= 80 ? "#059669" : verdict.confidence >= 60 ? "#D97706" : "#DC2626";

  return (
    <div className="verdict-card fade-in">
      {lowConfidence && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>Low confidence ({verdict.confidence}%) — flagged for human review</div>
            <div style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>Originally routed to: {verdict.route.replace(/_/g, " ")}</div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <span style={{ background: "#0891B2", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>Routing Decision</span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Intent</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>{verdict.intent.replace(/_/g, " ")}</div>
      <div style={{ display: "inline-block", background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px", marginBottom: 18 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>→ {displayRoute.replace(/_/g, " ")}</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div className="stat-block">
          <span className="stat-label">Urgency</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: urgencyColor }}>{verdict.urgency} / 10</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Confidence</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: confidenceColor }}>{verdict.confidence}%</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Triaged By</span>
          <span className="stat-value">Pulse AI</span>
        </div>
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
        Routed automatically in &lt;2s · Ready for handoff
      </div>
    </div>
  );
}

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
      let acc = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        acc += decoder.decode(value, { stream: true });
        setFullText(acc);
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="app-layout">
      <Nav />
      <div className="app-main">

        <div className="page-header" style={{ padding: 0 }}>
          <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="flex-between">
              <div>
                <h1 className="page-title">Call Triage</h1>
                <p className="page-subtitle">Paste a call transcript and let the agent classify, score, and route it.</p>
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 28px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "var(--gray-50)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4 }}>Scenarios</span>
            {SCENARIOS.map((s, i) => (
              <button
                key={i}
                className="scenario-btn"
                onClick={() => loadScenario(i)}
                style={{
                  borderColor: activeScenario === i ? s.color : "var(--border)",
                  background: activeScenario === i ? s.color + "15" : "#fff",
                  color: activeScenario === i ? s.color : "var(--gray-700)",
                }}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "420px 1fr", gap: 24, padding: "24px 28px", alignItems: "start" }}>

          <div className="card" style={{ position: "sticky", top: 24 }}>
            <div className="card-header">
              <span className="card-header-title">Call Transcript</span>
              <span style={{ fontSize: 11, color: "var(--gray-400)" }}>Paste or type any transcript</span>
            </div>
            <div className="card-body">
              <textarea
                className="form-textarea mono"
                value={transcriptText}
                onChange={e => { setTranscriptText(e.target.value); setActiveScenario(null); }}
                placeholder="Paste a call transcript here — customer complaint, merchant escalation, new order, or partnership inquiry..."
                style={{ height: 340, fontSize: 12, lineHeight: 1.75 }}
              />
              <button
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 14, justifyContent: "center" }}
                onClick={runAgent}
                disabled={streaming || !transcriptText.trim()}
              >
                {streaming ? (
                  <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%" }} className="spin" />Triaging call...</>
                ) : (
                  <><Phone size={16} />Triage This Call</>
                )}
              </button>
            </div>
          </div>

          <div ref={outputRef}>
            {!fullText && !streaming && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📞</div>
                  <div className="empty-state-title">Call Triage Agent is ready</div>
                  <div className="empty-state-body">Load a scenario or paste your own call transcript, then click "Triage This Call" to watch the agent classify, score, and route in real time.</div>
                </div>
              </div>
            )}
            {error && (
              <div className="card" style={{ border: "1px solid #FECACA" }}>
                <div className="card-body" style={{ color: "var(--danger)", fontSize: 13 }}>Error: {error}</div>
              </div>
            )}
            {steps.length > 0 && (
              <div>
                <div className="flex-between" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)" }}>Agent Reasoning</span>
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{steps.length} / 5 steps</span>
                </div>
                {steps.map((step, i) => (
                  <StepCard key={step.num} step={step} isActive={streaming && i === steps.length - 1} />
                ))}
                {verdict && <VerdictCard verdict={verdict} />}
              </div>
            )}
          </div>
        </div>

        <footer className="page-footer">
          Built on <span style={{ color: "var(--blue)", fontWeight: 600 }}>Dispatch AI</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </div>
  );
}
