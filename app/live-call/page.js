"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { PhoneCall, PhoneOff, Activity } from "lucide-react";
import Nav from "../components/Nav";
import "../globals.css";

const DEFAULTS = {
  name: "Tony's Pizza", tagline: "Best pizza in the city", agentName: "Maya",
  menu: "Large Pepperoni - $18\nLarge Margherita - $16\nLarge BBQ Chicken - $19\nLarge Mushroom - $16\nGarlic Bread - $5\nCoke/Diet Coke - $3",
  hours: "Mon-Sun 11am - 11pm",
  refundPolicy: "We offer full refunds for wrong or cold orders within 30 minutes of delivery.",
  phone: "(408) 555-0100",
  voiceProvider: "vapi",
};

const ANGRY_WORDS = ["furious", "angry", "ridiculous", "terrible", "lawsuit", "useless", "disgusting", "every time", "again", "third time", "never again", "worst", "outraged", "unacceptable"];
const FRUSTRATED_WORDS = ["frustrated", "disappointed", "waiting", "late", "wrong", "issue", "problem", "not working", "confused", "still", "hour", "long time"];

function computeSentiment(transcript) {
  const text = transcript.map(t => t.text).join(" ").toLowerCase();
  const angryScore = ANGRY_WORDS.filter(w => text.includes(w)).length;
  const frustratedScore = FRUSTRATED_WORDS.filter(w => text.includes(w)).length;
  if (angryScore >= 2) return "angry";
  if (angryScore >= 1 || frustratedScore >= 1) return "frustrated";
  return "calm";
}

const SENTIMENT_CONFIG = {
  calm:       { emoji: "🟢", label: "Calm",       color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
  frustrated: { emoji: "🟡", label: "Frustrated", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  angry:      { emoji: "🔴", label: "Angry",      color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

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
  let cur = null;
  for (const part of parts) {
    const m = part.match(/\*\*STEP (\d+): ([^*]+)\*\*/);
    if (m) { if (cur) steps.push(cur); cur = { num: parseInt(m[1]), label: m[2].trim(), content: "" }; }
    else if (cur) cur.content += part;
  }
  if (cur) steps.push(cur);
  return steps;
}

function extractVerdict(text) {
  const m = text.match(/\*{0,2}INTENT:\*{0,2}\s*([A-Z_]+)(?:\s*\([^)]*\))?\s*\*{0,2}\s*\|\s*\*{0,2}\s*URGENCY:\*{0,2}\s*(\d+)(?:\/\d+)?\s*\*{0,2}\s*\|\s*\*{0,2}\s*ROUTE:\*{0,2}\s*([A-Z_]+)\s*\*{0,2}\s*\|\s*\*{0,2}\s*CONFIDENCE:\*{0,2}\s*(\d+)%\*{0,2}/i);
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
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8 }}>
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
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Intent</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>{verdict.intent.replace(/_/g, " ")}</div>
      <div style={{ display: "inline-block", background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px", marginBottom: 18 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>→ {displayRoute.replace(/_/g, " ")}</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div className="stat-block"><span className="stat-label">Urgency</span><span style={{ fontSize: 17, fontWeight: 700, color: urgencyColor }}>{verdict.urgency} / 10</span></div>
        <div className="stat-block"><span className="stat-label">Confidence</span><span style={{ fontSize: 17, fontWeight: 700, color: confidenceColor }}>{verdict.confidence}%</span></div>
        <div className="stat-block"><span className="stat-label">Triaged By</span><span className="stat-value">Pulse AI</span></div>
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
        Routed automatically · Ready for handoff
      </div>
    </div>
  );
}

const STATE = { IDLE: "idle", CONNECTING: "connecting", ACTIVE: "active", ENDED: "ended", TRIAGING: "triaging", DONE: "done" };

export default function LiveCallPage() {
  const [callState, setCallState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState([]);
  const [triageText, setTriageText] = useState("");
  const [triageDone, setTriageDone] = useState(false);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [vapiConfigured, setVapiConfigured] = useState(false);
  const [retellConfigured, setRetellConfigured] = useState(false);
  const [profile, setProfile] = useState(DEFAULTS);
  const vapiRef = useRef(null);
  const retellRef = useRef(null);
  const timerRef = useRef(null);
  const triageOutputRef = useRef(null);
  const transcriptRef = useRef([]);

  const steps = parseSteps(triageText);
  const verdict = triageDone ? extractVerdict(triageText) : null;
  const sentiment = useMemo(() => computeSentiment(transcript), [transcript]);

  useEffect(() => {
    setVapiConfigured(!!process.env.NEXT_PUBLIC_VAPI_API_KEY && !!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
    setRetellConfigured(!!process.env.NEXT_PUBLIC_RETELL_API_KEY && !!process.env.NEXT_PUBLIC_RETELL_AGENT_ID);
    try {
      const stored = localStorage.getItem("restaurantProfile");
      if (stored) setProfile({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  useEffect(() => {
    if (triageOutputRef.current) triageOutputRef.current.scrollTop = triageOutputRef.current.scrollHeight;
  }, [triageText]);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const activeProvider = profile.voiceProvider || "vapi";
  const isConfigured = activeProvider === "retell" ? retellConfigured : vapiConfigured;

  async function startCall() {
    if (!isConfigured) {
      setError(`${activeProvider === "retell" ? "Retell AI" : "Vapi"} not configured. Add the required env vars.`);
      return;
    }
    setError(null);
    setCallState(STATE.CONNECTING);
    setTranscript([]);
    transcriptRef.current = [];
    setTriageText("");
    setTriageDone(false);
    setCallDuration(0);
    if (activeProvider === "retell") await startRetellCall();
    else await startVapiCall();
  }

  async function startVapiCall() {
    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);
      vapiRef.current = vapi;
      vapi.on("call-start", () => {
        setCallState(STATE.ACTIVE);
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      });
      vapi.on("message", (msg) => {
        if (msg.type === "transcript" && msg.transcriptType === "final") {
          const entry = { role: msg.role, text: msg.transcript, final: true };
          transcriptRef.current = [...transcriptRef.current, entry];
          setTranscript(prev => [...prev, entry]);
        }
      });
      vapi.on("call-end", () => {
        clearInterval(timerRef.current);
        setCallState(STATE.ENDED);
        setTimeout(() => runTriageWithTranscript(transcriptRef.current), 500);
      });
      vapi.on("error", (err) => {
        setError(err.message || "Call error");
        setCallState(STATE.IDLE);
        clearInterval(timerRef.current);
      });
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
    } catch (err) {
      setError("Failed to start call: " + err.message);
      setCallState(STATE.IDLE);
    }
  }

  async function startRetellCall() {
    try {
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const retell = new RetellWebClient();
      retellRef.current = retell;
      const res = await fetch("/api/retell-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error(`Failed to create Retell call: ${res.status}`);
      const { access_token } = await res.json();
      retell.on("call_started", () => {
        setCallState(STATE.ACTIVE);
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      });
      retell.on("update", (update) => {
        if (update.transcript) {
          const entries = update.transcript.map(t => ({ role: t.role === "agent" ? "assistant" : "user", text: t.content, final: true }));
          transcriptRef.current = entries;
          setTranscript(entries);
        }
      });
      retell.on("call_ended", () => {
        clearInterval(timerRef.current);
        setCallState(STATE.ENDED);
        setTimeout(() => runTriageWithTranscript(transcriptRef.current), 500);
      });
      retell.on("error", (err) => {
        setError(err.message || "Retell call error");
        setCallState(STATE.IDLE);
        clearInterval(timerRef.current);
      });
      await retell.startCall({ accessToken: access_token });
    } catch (err) {
      setError("Failed to start Retell call: " + err.message);
      setCallState(STATE.IDLE);
    }
  }

  function endCall() {
    if (activeProvider === "retell" && retellRef.current) retellRef.current.stopCall();
    else if (vapiRef.current) vapiRef.current.stop();
  }

  async function runTriageWithTranscript(capturedTranscript) {
    setCallState(STATE.TRIAGING);
    setTriageText("");
    setTriageDone(false);
    const transcriptText = capturedTranscript
      .map(t => `${t.role === "assistant" ? "Maya (Tony's Pizza)" : "Customer"}: ${t.text}`)
      .join("\n\n");
    if (!transcriptText.trim()) {
      setCallState(STATE.DONE);
      setTriageText("No speech detected in this call.");
      setTriageDone(true);
      return;
    }
    try {
      const res = await fetch("/api/triage-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText, source: "live" }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        acc += decoder.decode(value, { stream: true });
        setTriageText(acc);
      }
      setTriageDone(true);
      setCallState(STATE.DONE);
    } catch (err) {
      setError("Triage failed: " + err.message);
      setCallState(STATE.DONE);
    }
  }

  function formatDuration(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const finalTranscript = transcript.filter(t => t.final);
  const isLive = callState === STATE.ACTIVE;
  const sentConf = SENTIMENT_CONFIG[sentiment];

  return (
    <div className="app-layout">
      <Nav />
      <div className="app-main">

        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1 className="page-title">Live Call</h1>
              <p className="page-subtitle">Browser-based AI front desk — speak directly to Maya. Auto-triaged after every call.</p>
            </div>
            {isConfigured && (
              <span className={`badge ${activeProvider === "retell" ? "badge-green" : "badge-blue"}`}>
                {activeProvider === "retell" ? "Retell AI" : "Vapi.ai"}
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, padding: "24px 28px", alignItems: "start" }}>

          {/* Left: Call panel */}
          <div>
            {/* Main call card */}
            <div style={{ background: "linear-gradient(160deg, #0F172A 0%, #1E293B 100%)", borderRadius: "var(--radius-xl)", padding: "32px 24px", textAlign: "center", boxShadow: "var(--shadow-lg)", marginBottom: 14 }}>

              {/* Avatar with ripple */}
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                {isLive && (
                  <>
                    <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(37,99,235,0.15)", animation: "ripple 1.5s ease-out infinite" }} />
                    <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(37,99,235,0.1)", animation: "ripple 1.5s ease-out 0.6s infinite" }} />
                  </>
                )}
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg, #2563EB, #0891B2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, position: "relative", boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}>
                  🍕
                </div>
              </div>

              <div style={{ fontSize: 17, fontWeight: 700, color: "#F1F5F9", marginBottom: 3 }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>AI Front Desk — {profile.agentName}</div>

              {/* Duration + Sentiment */}
              {isLive && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "#7DD3FA", letterSpacing: "0.1em" }}>{formatDuration(callDuration)}</div>
                  {finalTranscript.length > 0 && (
                    <div className="sentiment-pill" style={{ background: sentConf.bg, border: `1px solid ${sentConf.border}`, color: sentConf.color, animation: sentiment === "angry" ? "pulse 1.5s ease-in-out infinite" : "none" }}>
                      {sentConf.emoji} {sentConf.label}
                    </div>
                  )}
                </div>
              )}

              {/* State label */}
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24, minHeight: 16 }}>
                {callState === STATE.IDLE && "Ready to answer calls"}
                {callState === STATE.CONNECTING && "Connecting to Maya..."}
                {callState === STATE.ACTIVE && "Call in progress"}
                {callState === STATE.ENDED && "Call ended"}
                {callState === STATE.TRIAGING && "Analyzing call..."}
                {callState === STATE.DONE && "Triage complete"}
              </div>

              {/* Action button */}
              {(callState === STATE.IDLE || callState === STATE.DONE) && (
                <button
                  onClick={startCall}
                  style={{ background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", border: "none", borderRadius: 50, padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(5,150,105,0.4)" }}
                >
                  <PhoneCall size={17} /> Start Call
                </button>
              )}
              {callState === STATE.CONNECTING && (
                <button disabled style={{ background: "#334155", color: "rgba(255,255,255,0.4)", border: "none", borderRadius: 50, padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid rgba(255,255,255,0.7)", borderRadius: "50%" }} className="spin" />
                  Connecting...
                </button>
              )}
              {callState === STATE.ACTIVE && (
                <button
                  onClick={endCall}
                  style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)", color: "#fff", border: "none", borderRadius: 50, padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(220,38,38,0.4)" }}
                >
                  <PhoneOff size={17} /> End Call
                </button>
              )}
              {(callState === STATE.ENDED || callState === STATE.TRIAGING) && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#7DD3FA", fontSize: 13, fontWeight: 600 }}>
                  <Activity size={15} className="spin" /> Running triage...
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="card" style={{ border: "1px solid #FECACA", marginBottom: 12 }}>
                <div className="card-body" style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>
              </div>
            )}

            {/* Not configured */}
            {!isConfigured && (
              <div className="card">
                <div className="card-header">
                  <span className="card-header-title">Setup Required</span>
                  <span className="badge badge-amber">{activeProvider === "retell" ? "Retell AI" : "Vapi"}</span>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 12 }}>Add these environment variables to Vercel:</p>
                  <div style={{ background: "var(--dark)", borderRadius: 8, padding: "12px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94A3B8", lineHeight: 2 }}>
                    {activeProvider === "retell" ? (
                      <><div><span style={{ color: "#7DD3FA" }}>NEXT_PUBLIC_RETELL_API_KEY</span>=your_key</div><div><span style={{ color: "#7DD3FA" }}>NEXT_PUBLIC_RETELL_AGENT_ID</span>=your_id</div></>
                    ) : (
                      <><div><span style={{ color: "#7DD3FA" }}>NEXT_PUBLIC_VAPI_API_KEY</span>=your_key</div><div><span style={{ color: "#7DD3FA" }}>NEXT_PUBLIC_VAPI_ASSISTANT_ID</span>=your_id</div></>
                    )}
                  </div>
                  <p style={{ marginTop: 12, fontSize: 12, color: "var(--gray-500)" }}>Switch providers in <a href="/settings" style={{ color: "var(--blue)", fontWeight: 600 }}>Settings</a>.</p>
                </div>
              </div>
            )}

            {/* Live transcript panel */}
            {isLive && finalTranscript.length > 0 && (
              <div className="card fade-in" style={{ marginTop: 0 }}>
                <div className="card-header">
                  <span className="card-header-title">Live Transcript</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} className="pulse-dot" />
                </div>
                <div className="card-body" style={{ maxHeight: 220, overflowY: "auto" }}>
                  {finalTranscript.map((t, i) => (
                    <div key={i} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.role === "assistant" ? "var(--blue)" : "var(--gray-700)", minWidth: 60, flexShrink: 0, paddingTop: 1 }}>
                        {t.role === "assistant" ? "Maya" : "Customer"}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--gray-700)", lineHeight: 1.6 }}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Post-call triage */}
          <div ref={triageOutputRef}>
            {callState === STATE.IDLE && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🍕</div>
                  <div className="empty-state-title">Maya is standing by</div>
                  <div className="empty-state-body">
                    Click "Start Call" to connect your browser microphone to the AI front desk. Maya will handle orders, complaints, and questions. After the call, the transcript is automatically triaged and routed.
                  </div>
                </div>
              </div>
            )}

            {(callState === STATE.DONE || callState === STATE.TRIAGING) && finalTranscript.length > 0 && (
              <div className="card fade-in" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <span className="card-header-title">Call Transcript</span>
                  <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{finalTranscript.length} turns · {formatDuration(callDuration)}</span>
                </div>
                <div className="card-body" style={{ maxHeight: 360, overflowY: "auto" }}>
                  {finalTranscript.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.role === "assistant" ? "var(--blue-light)" : "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                        {t.role === "assistant" ? "🍕" : "👤"}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: t.role === "assistant" ? "var(--blue)" : "var(--gray-700)", marginBottom: 2 }}>
                          {t.role === "assistant" ? `${profile.agentName} (${profile.name})` : "Customer"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--gray-700)", lineHeight: 1.5 }}>{t.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {steps.length > 0 && (
              <div>
                <div className="flex-between" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)" }}>Auto-Triage</span>
                  <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{steps.length} / 5 steps</span>
                </div>
                {steps.map((step, i) => (
                  <StepCard key={step.num} step={step} isActive={callState === STATE.TRIAGING && i === steps.length - 1} />
                ))}
                {verdict && <VerdictCard verdict={verdict} />}
              </div>
            )}
          </div>
        </div>

        <footer className="page-footer">
          Built on <span style={{ color: "var(--blue)", fontWeight: 600 }}>Dispatch</span> · Voice by {activeProvider === "retell" ? "Retell AI" : "Vapi.ai"} · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </div>
  );
}
