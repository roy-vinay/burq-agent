"use client";
import { useState, useRef, useEffect } from "react";
import "../globals.css";

const SCENARIOS = [
  {
    label: "Insulin Left Outside",
    emoji: "🚨",
    type: "DAMAGED_GOODS",
    description: "Medical — high severity",
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
    type: "SLA_BREACH",
    description: "Pattern — provider issue",
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
    type: "FRAUD_SUSPICION",
    description: "Fraud flag — needs review",
    color: "#7C3AED",
    email: `From: david.park@gmail.com
To: help@albertsons.com
Subject: Order marked delivered but nothing arrived

Hello,

My order from this morning (order number ALB-8834) was marked as delivered at 9:14am with a photo of what looks like someone else's front door. That is not my house.

I have been home all morning. No one knocked, no notification, nothing. The GPS coordinates in the delivery confirmation show a location that is 0.3 miles from my address.

This is the second time in 3 weeks this has happened with the same delivery service. Last time I was told it was an honest mistake. This does not feel like a mistake anymore.

I want a refund and I want this investigated. I am also going to dispute with my credit card if I do not hear back today.

David Park
847 Maple Street
Campbell, CA 95008`,
  },
  {
    label: "Vague Angry Customer",
    emoji: "😤",
    type: "WISMO",
    description: "Messy — ambiguous intent",
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
    type: "DAMAGED_GOODS",
    description: "Event delivery — time sensitive",
    color: "#EC4899",
    email: `From: roberto.vasquez@email.com
To: orders@1800flowers.com
Subject: Wedding flowers arrived completely destroyed

I ordered a bridal bouquet and centerpiece arrangements for my daughter's wedding today. The delivery arrived at 10am as scheduled but the bouquet was completely crushed — looks like it was placed under something heavy in the vehicle. Three of the centerpieces are also damaged beyond use.

The wedding is at 2pm today. We have 4 hours.

Order #FLR-20260703-0092. I paid $890 for these arrangements. I need either a replacement delivery immediately or a full refund. I cannot have my daughter walk down the aisle with a crushed bouquet.

Roberto Vasquez
(408) 555-0134`,
  },
];

const STEP_LABELS = ["Email Parse", "Issue Classification", "Severity Assessment", "Recommended Action", "Draft Output"];
const STEP_COLORS = [
  { bg: "#EBF3FF", border: "#2079F9", text: "#2079F9", num: "#2079F9" },
  { bg: "#FFF7ED", border: "#F97316", text: "#EA580C", num: "#F97316" },
  { bg: "#F0FDF4", border: "#22C55E", text: "#16A34A", num: "#22C55E" },
  { bg: "#F5F3FF", border: "#8B5CF6", text: "#7C3AED", num: "#8B5CF6" },
  { bg: "#E6F9FD", border: "#00BADA", text: "#0891B2", num: "#00BADA" },
];

const ACTION_COLORS = {
  INITIATE_REFUND: { bg: "#ECFDF5", text: "#059669", border: "#6EE7B7" },
  ESCALATE_PROVIDER: { bg: "#FFF7ED", text: "#D97706", border: "#FCD34D" },
  REROUTE_ORDER: { bg: "#EBF3FF", text: "#2079F9", border: "#93C5FD" },
  DRAFT_APOLOGY: { bg: "#F5F3FF", text: "#7C3AED", border: "#C4B5FD" },
  FLAG_FRAUD: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  FLAG_HUMAN_REVIEW: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
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
  const match = text.match(/ACTION:\s*([A-Z_]+)\s*\|\s*SEVERITY:\s*(\d+)\s*\|\s*CONFIDENCE:\s*(\d+)%/i);
  if (!match) return null;
  return { action: match[1], severity: parseInt(match[2]), confidence: parseInt(match[3]) };
}

function StepCard({ step, index, isActive }) {
  const colors = STEP_COLORS[index] || STEP_COLORS[0];
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
  const colors = ACTION_COLORS[verdict.action] || ACTION_COLORS.FLAG_HUMAN_REVIEW;
  const severityColor = verdict.severity >= 8 ? "#DC2626" : verdict.severity >= 5 ? "#F59E0B" : "#10B981";
  const confidenceColor = verdict.confidence >= 80 ? "#10B981" : verdict.confidence >= 60 ? "#F59E0B" : "#DC2626";

  return (
    <div style={{ background: "linear-gradient(135deg, #1B1C1C 0%, #2C2D2D 100%)", borderRadius: 12, padding: "20px 24px", marginTop: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#00BADA", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>Triage Decision</div>
      </div>

      <div style={{ display: "inline-block", background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px", marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{verdict.action.replace(/_/g, " ")}</span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={statStyle}>
          <span style={statLabel}>Severity</span>
          <span style={{ ...statValueBase, color: severityColor }}>{verdict.severity} / 10</span>
        </div>
        <div style={statStyle}>
          <span style={statLabel}>Confidence</span>
          <span style={{ ...statValueBase, color: confidenceColor }}>{verdict.confidence}%</span>
        </div>
        <div style={statStyle}>
          <span style={statLabel}>Routed By</span>
          <span style={{ ...statValueBase, color: "#00BADA" }}>Pulse AI</span>
        </div>
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>
        Triaged automatically in &lt;2s · No human review required
      </div>
    </div>
  );
}

const statStyle = { background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2 };
const statLabel = { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" };
const statValueBase = { fontSize: 16, fontWeight: 700 };

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

        {/* Header */}
        <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, #2079F9, #00BADA)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>B</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1B1C1C", lineHeight: 1.2 }}>Pulse AI</div>
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.04em" }}>Email Triage Agent</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Provider Selection</a>
            <a href="/email-agent" style={{ fontSize: 13, color: "#2079F9", textDecoration: "none", fontWeight: 600, borderBottom: "2px solid #2079F9", paddingBottom: 2 }}>Email Triage</a>
          </div>
        </header>

        {/* Scenario Presets */}
        <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "12px 32px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Quick Load</span>
          {SCENARIOS.map((s, i) => (
            <button key={i} className="scenario-btn" onClick={() => loadScenario(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${activeScenario === i ? s.color : "#E5E7EB"}`, background: activeScenario === i ? s.color + "14" : "#fff", color: activeScenario === i ? s.color : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Main */}
        <main style={{ flex: 1, display: "grid", gridTemplateColumns: "440px 1fr", gap: 24, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "24px 32px", alignItems: "start" }}>

          {/* Left: Email Input */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)", position: "sticky", top: 120 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1C1C" }}>Incoming Email</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>Paste or type any email</span>
            </div>

            <div style={{ padding: "20px" }}>
              <textarea
                value={emailText}
                onChange={e => { setEmailText(e.target.value); setActiveScenario(null); }}
                placeholder="Paste a customer complaint, merchant escalation, or delivery issue email here..."
                style={{ width: "100%", height: 340, padding: "12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, color: "#374151", resize: "vertical", transition: "border-color 0.2s", background: "#FAFAFA" }}
              />

              <button className="run-btn" onClick={runAgent} disabled={streaming || !emailText.trim()} style={{ width: "100%", marginTop: 14, background: streaming ? "#9CA3AF" : "#2079F9", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: streaming ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {streaming ? (
                  <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Triaging Email...</>
                ) : (
                  <><span style={{ fontSize: 16 }}>⚡</span>Triage This Email</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Agent Output */}
          <div ref={outputRef}>
            {!fullText && !streaming && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #D1D5DB", padding: "60px 40px", textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>Triage Agent is ready</div>
                <div style={{ fontSize: 13 }}>Load a scenario or paste your own email, then hit "Triage This Email" to watch the agent classify, score, and act in real time.</div>
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
                  <StepCard key={step.num} step={step} index={step.num - 1} isActive={streaming && i === steps.length - 1} />
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
