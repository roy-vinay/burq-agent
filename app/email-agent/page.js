"use client";
import { useState, useRef, useEffect } from "react";
import { Zap, Mail } from "lucide-react";
import Nav from "../components/Nav";
import "../globals.css";

const SCENARIOS = [
  {
    label: "Insulin Left Outside",
    emoji: "🚨",
    color: "#DC2626",
    email: `From: Margaret Chen <mchen@email.com>
To: support@safeway.com
Subject: FWD: My insulin was left outside in the heat

Hi,

I am absolutely furious. I ordered insulin through your app this morning — order was supposed to arrive by 11am. The driver dropped it at my door at 11:47am without ringing the bell. I only found it at 2:30pm when I got home from my appointment.

Insulin cannot be left unattended in heat above 77 degrees. It was 89 degrees outside today. The medication is now RUINED and I cannot use it. This is a $340 order and more importantly this is my medication.

I am diabetic. This is not a convenience item. I need a full refund and I need someone to explain how this happened.

Margaret Chen
Order #SF-20260703-4421`,
  },
  {
    label: "Repeated Late Deliveries",
    emoji: "⚠️",
    color: "#F59E0B",
    email: `From: ops@kroger-sunnyvale.com
To: partnerships@dispatch.example
Subject: Ongoing delivery performance issue — DoorDash Drive

Hi team,

We need to flag a serious pattern with DoorDash Drive in our Sunnyvale zone.

Over the past 10 days we have had 14 orders assigned to DoorDash Drive. Of those, 9 arrived more than 15 minutes late, and 3 were marked delivered but customers reported no delivery.

This is impacting our customer satisfaction scores significantly. We are seeing a spike in WISMO tickets every evening between 6-8pm which correlates exactly with DoorDash Drive assignments.

We need this escalated immediately. If this cannot be resolved by end of week we will need to discuss routing all Sunnyvale evening orders to an alternative provider.

James Whitfield
Operations Manager, Kroger Sunnyvale`,
  },
  {
    label: "Suspicious Completion",
    emoji: "🔍",
    color: "#7C3AED",
    email: `From: david.park@gmail.com
To: help@albertsons.com
Subject: Order marked delivered but nothing arrived

Hello,

My order from this morning (order number ALB-8834) was marked as delivered at 9:14am with a photo of what looks like someone else's front door. That is not my house.

I have been home all morning. No one knocked, no notification, nothing. The GPS coordinates in the delivery confirmation show a location that is 0.3 miles from my address.

This is the second time in 3 weeks this has happened with the same delivery service. Last time I was told it was an honest mistake. This does not feel like a mistake anymore.

I want a refund and I want this investigated. I am also going to dispute with my credit card if I do not hear back today.

David Park`,
  },
  {
    label: "Vague Angry Customer",
    emoji: "😤",
    color: "#6B7280",
    email: `From: tammyb_1977@hotmail.com
Subject: THIS IS RIDICULOUS

your service is terrible!! ordered groceries AGAIN and same thing happened. driver called me twice i missed it because i was in a meeting and now its saying delivered but WHERE. not at my door. not with neighbor. nowhere. this happens EVERY TIME i use this

i want my money back for everything. all of it. i am done with this service honestly. been a customer for 2 years and this is how you treat people

tammy`,
  },
  {
    label: "Floral Damage",
    emoji: "🌸",
    color: "#EC4899",
    email: `From: roberto.vasquez@email.com
To: orders@1800flowers.com
Subject: Wedding flowers arrived completely destroyed

I ordered a bridal bouquet and centerpiece arrangements for my daughter's wedding today. The delivery arrived at 10am as scheduled but the bouquet was completely crushed — looks like it was placed under something heavy in the vehicle. Three of the centerpieces are also damaged beyond use.

The wedding is at 2pm today. We have 4 hours.

Order #FLR-20260703-0092. I paid $890 for these arrangements. I need either a replacement delivery immediately or a full refund.

Roberto Vasquez
(408) 555-0134`,
  },
];

const STEP_LABELS = ["Email Parse", "Issue Classification", "Severity Assessment", "Recommended Action", "Draft Output"];
const STEP_COLORS = [
  { bg: "#EFF6FF", border: "#2563EB", text: "#2563EB", num: "#2563EB" },
  { bg: "#FFF7ED", border: "#F97316", text: "#EA580C", num: "#F97316" },
  { bg: "#F0FDF4", border: "#16A34A", text: "#15803D", num: "#16A34A" },
  { bg: "#F5F3FF", border: "#7C3AED", text: "#6D28D9", num: "#7C3AED" },
  { bg: "#ECFEFF", border: "#0891B2", text: "#0E7490", num: "#0891B2" },
];

const ACTION_COLORS = {
  INITIATE_REFUND:   { bg: "#ECFDF5", text: "#059669", border: "#6EE7B7" },
  ESCALATE_PROVIDER: { bg: "#FFF7ED", text: "#D97706", border: "#FCD34D" },
  REROUTE_ORDER:     { bg: "#EFF6FF", text: "#2563EB", border: "#93C5FD" },
  DRAFT_APOLOGY:     { bg: "#F5F3FF", text: "#7C3AED", border: "#C4B5FD" },
  FLAG_FRAUD:        { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  FLAG_HUMAN_REVIEW: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
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
  const m = text.match(/ACTION:\s*([A-Z_]+)\s*\|\s*SEVERITY:\s*(\d+)\s*\|\s*CONFIDENCE:\s*(\d+)%/i);
  if (!m) return null;
  return { action: m[1], severity: parseInt(m[2]), confidence: parseInt(m[3]) };
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
  const colors = ACTION_COLORS[verdict.action] || ACTION_COLORS.FLAG_HUMAN_REVIEW;
  const severityColor = verdict.severity >= 8 ? "#DC2626" : verdict.severity >= 5 ? "#D97706" : "#059669";
  const confidenceColor = verdict.confidence >= 80 ? "#059669" : verdict.confidence >= 60 ? "#D97706" : "#DC2626";

  return (
    <div className="verdict-card fade-in">
      <div style={{ marginBottom: 16 }}>
        <span style={{ background: "#0891B2", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Triage Decision
        </span>
      </div>
      <div style={{ display: "inline-block", background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px", marginBottom: 18 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{verdict.action.replace(/_/g, " ")}</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div className="stat-block">
          <span className="stat-label">Severity</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: severityColor }}>{verdict.severity} / 10</span>
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
        Triaged automatically in &lt;2s · No human review required
      </div>
    </div>
  );
}

export default function EmailAgent() {
  const [emailText, setEmailText] = useState(SCENARIOS[0].email);
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
    setEmailText(SCENARIOS[idx].email);
    setFullText("");
    setDone(false);
    setError(null);
  }

  async function runAgent() {
    if (!emailText.trim()) return;
    setStreaming(true);
    setFullText("");
    setDone(false);
    setError(null);
    try {
      const res = await fetch("/api/triage-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailText }),
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

        {/* Page header + scenario bar */}
        <div className="page-header" style={{ padding: "0" }}>
          <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="flex-between">
              <div>
                <h1 className="page-title">Email Triage</h1>
                <p className="page-subtitle">Classify, score, and route inbound customer emails automatically.</p>
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

        {/* Main content */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "420px 1fr", gap: 24, padding: "24px 28px", alignItems: "start" }}>

          {/* Left: email input */}
          <div className="card" style={{ position: "sticky", top: 24 }}>
            <div className="card-header">
              <span className="card-header-title">Incoming Email</span>
              <span style={{ fontSize: 11, color: "var(--gray-400)" }}>Paste or type any email</span>
            </div>
            <div className="card-body">
              <textarea
                className="form-textarea mono"
                value={emailText}
                onChange={e => { setEmailText(e.target.value); setActiveScenario(null); }}
                placeholder="Paste a customer complaint, merchant escalation, or delivery issue email here..."
                style={{ height: 340, fontSize: 12, lineHeight: 1.75 }}
              />
              <button
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 14, justifyContent: "center" }}
                onClick={runAgent}
                disabled={streaming || !emailText.trim()}
              >
                {streaming ? (
                  <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%" }} className="spin" />Triaging email...</>
                ) : (
                  <><Mail size={16} />Triage This Email</>
                )}
              </button>
            </div>
          </div>

          {/* Right: output */}
          <div ref={outputRef}>
            {!fullText && !streaming && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📧</div>
                  <div className="empty-state-title">Triage Agent is ready</div>
                  <div className="empty-state-body">Load a scenario or paste your own email, then click "Triage This Email" to watch the agent classify, score, and route in real time.</div>
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
          Built on <span style={{ color: "var(--blue)", fontWeight: 600 }}>Dispatch</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </div>
  );
}
