"use client";
import { useState, useRef, useEffect } from "react";
import "../globals.css";

// Shared triage rendering helpers (copied from call-triage page)
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
  const match = text.match(/INTENT:\s*([A-Z_]+)\s*\|\s*URGENCY:\s*(\d+)\s*\|\s*ROUTE:\s*([A-Z_]+)\s*\|\s*CONFIDENCE:\s*(\d+)%/i);
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
  const colors = ROUTE_COLORS[verdict.route] || ROUTE_COLORS.HUMAN_REVIEW;
  const urgencyColor = verdict.urgency >= 8 ? "#DC2626" : verdict.urgency >= 5 ? "#F59E0B" : "#10B981";
  const confidenceColor = verdict.confidence >= 80 ? "#10B981" : verdict.confidence >= 60 ? "#F59E0B" : "#DC2626";
  return (
    <div style={{ background: "linear-gradient(135deg, #1B1C1C 0%, #2C2D2D 100%)", borderRadius: 12, padding: "20px 24px", marginTop: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#00BADA", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>Routing Decision</div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Intent</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{verdict.intent.replace(/_/g, " ")}</div>
      </div>
      <div style={{ display: "inline-block", background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 8, padding: "8px 16px", marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>→ {verdict.route.replace(/_/g, " ")}</span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Urgency</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: urgencyColor }}>{verdict.urgency} / 10</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confidence</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: confidenceColor }}>{verdict.confidence}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Triaged By</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#00BADA" }}>Pulse AI</span>
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>
        Routed automatically · Ready for handoff
      </div>
    </div>
  );
}

// Call states
const STATE = { IDLE: "idle", CONNECTING: "connecting", ACTIVE: "active", ENDED: "ended", TRIAGING: "triaging", DONE: "done" };

export default function LiveCallPage() {
  const [callState, setCallState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState([]);
  const [triageText, setTriageText] = useState("");
  const [triageDone, setTriageDone] = useState(false);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [vapiConfigured, setVapiConfigured] = useState(false);
  const vapiRef = useRef(null);
  const timerRef = useRef(null);
  const triageOutputRef = useRef(null);
  const transcriptRef = useRef([]);

  const steps = parseSteps(triageText);
  const verdict = triageDone ? extractVerdict(triageText) : null;

  useEffect(() => {
    // Check if Vapi is configured by seeing if env vars would be present
    const hasConfig = !!process.env.NEXT_PUBLIC_VAPI_API_KEY && !!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    setVapiConfigured(hasConfig);
  }, []);

  useEffect(() => {
    if (triageOutputRef.current) triageOutputRef.current.scrollTop = triageOutputRef.current.scrollHeight;
  }, [triageText]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startCall() {
    if (!vapiConfigured) {
      setError("Vapi not configured. See setup instructions below.");
      return;
    }

    setError(null);
    setCallState(STATE.CONNECTING);
    setTranscript([]);
    transcriptRef.current = [];
    setTriageText("");
    setTriageDone(false);
    setCallDuration(0);

    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setCallState(STATE.ACTIVE);
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      });

      vapi.on("speech-start", () => {});
      vapi.on("speech-end", () => {});

      vapi.on("message", (msg) => {
        if (msg.type === "transcript" && msg.transcriptType === "final") {
          const entry = { role: msg.role, text: msg.transcript, final: true };
          transcriptRef.current = [...transcriptRef.current, entry];
          setTranscript(prev => [...prev, entry]);
        }
      });

      vapi.on("call-end", async () => {
        clearInterval(timerRef.current);
        setCallState(STATE.ENDED);
        // Use ref so we get the actual accumulated transcript, not stale closure
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

  function endCall() {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
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
        setTriageText(accumulated);
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

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.2); opacity: 0; } }
        .call-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
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
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.04em" }}>Live Call Agent</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Provider Selection</a>
            <a href="/email-agent" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Email Triage</a>
            <a href="/call-triage" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Call Triage</a>
            <a href="/live-call" style={{ fontSize: 13, color: "#2079F9", textDecoration: "none", fontWeight: 600, borderBottom: "2px solid #2079F9", paddingBottom: 2 }}>Live Call</a>
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "32px 32px", display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, alignItems: "start" }}>

          {/* Left: Call Panel */}
          <div>
            {/* Call UI */}
            <div style={{ background: "linear-gradient(135deg, #1B1C1C 0%, #2C2D2D 100%)", borderRadius: 16, padding: "32px 24px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", marginBottom: 16 }}>

              {/* Avatar */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
                {callState === STATE.ACTIVE && (
                  <>
                    <div style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "rgba(0,186,218,0.2)", animation: "ripple 1.5s ease-out infinite" }} />
                    <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: "rgba(0,186,218,0.15)", animation: "ripple 1.5s ease-out 0.5s infinite" }} />
                  </>
                )}
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #2079F9, #00BADA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, position: "relative" }}>
                  🍕
                </div>
              </div>

              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Tony's Pizza</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Front Desk — Maya (AI)</div>

              {callState === STATE.ACTIVE && (
                <div style={{ fontSize: 12, color: "#00BADA", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{formatDuration(callDuration)}</div>
              )}

              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24, minHeight: 18 }}>
                {callState === STATE.IDLE && "Ready to answer"}
                {callState === STATE.CONNECTING && "Connecting..."}
                {callState === STATE.ACTIVE && "Call in progress"}
                {callState === STATE.ENDED && "Call ended"}
                {callState === STATE.TRIAGING && "Triaging call..."}
                {callState === STATE.DONE && "Triage complete"}
              </div>

              {(callState === STATE.IDLE || callState === STATE.DONE) && (
                <button className="call-btn" onClick={startCall} style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 50, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📞</span> Start Call
                </button>
              )}

              {callState === STATE.CONNECTING && (
                <button disabled style={{ background: "#374151", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: 50, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Connecting...
                </button>
              )}

              {callState === STATE.ACTIVE && (
                <button className="call-btn" onClick={endCall} style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 50, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📵</span> End Call
                </button>
              )}

              {(callState === STATE.ENDED || callState === STATE.TRIAGING) && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#00BADA", fontSize: 14, fontWeight: 600 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(0,186,218,0.3)", borderTop: "2px solid #00BADA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Running triage...
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            {/* Setup instructions if not configured */}
            {!vapiConfigured && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "20px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1B1C1C", marginBottom: 12 }}>Setup Required</div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
                  Add these to <code style={{ background: "#F3F4F6", padding: "1px 4px", borderRadius: 3 }}>.env.local</code>:
                </div>
                <div style={{ background: "#1B1C1C", borderRadius: 8, padding: "12px 14px", marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#9CA3AF", lineHeight: 1.8 }}>
                  <div><span style={{ color: "#00BADA" }}>NEXT_PUBLIC_VAPI_API_KEY</span>=your_key</div>
                  <div><span style={{ color: "#00BADA" }}>NEXT_PUBLIC_VAPI_ASSISTANT_ID</span>=asst_id</div>
                  <div style={{ marginTop: 8, color: "#6B7280" }}># Optional: for real phone calls</div>
                  <div><span style={{ color: "#00BADA" }}>VAPI_WEBHOOK_SECRET</span>=secret</div>
                </div>
                <div style={{ marginTop: 14, padding: "10px 12px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#16A34A", marginBottom: 6 }}>How to get Vapi credentials</div>
                  <ol style={{ fontSize: 11.5, color: "#374151", lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                    <li>Sign up at <strong>vapi.ai</strong></li>
                    <li>Get your API key from Dashboard → Keys</li>
                    <li>Create an Assistant with Maya's system prompt (see README)</li>
                    <li>Copy the Assistant ID</li>
                    <li>Set LLM to Claude claude-sonnet-4-6 in the assistant config</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Live transcript during call */}
            {callState === STATE.ACTIVE && finalTranscript.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "16px", boxShadow: "var(--shadow-sm)", marginTop: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Live Transcript</div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {finalTranscript.map((t, i) => (
                    <div key={i} style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.role === "assistant" ? "#2079F9" : "#374151", minWidth: 60, flexShrink: 0 }}>{t.role === "assistant" ? "Maya" : "Customer"}</span>
                      <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Post-call triage + full transcript */}
          <div ref={triageOutputRef}>
            {callState === STATE.IDLE && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #D1D5DB", padding: "60px 40px", textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🍕</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>Maya is standing by</div>
                <div style={{ fontSize: 13, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                  Click "Start Call" to connect your browser microphone to the AI front desk. Maya will take orders, handle complaints, and answer questions as Tony's Pizza. When the call ends, the transcript is automatically triaged and routed.
                </div>
              </div>
            )}

            {(callState === STATE.DONE || callState === STATE.TRIAGING) && finalTranscript.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "20px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📋</span> Call Transcript
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF" }}>{finalTranscript.length} turns · {formatDuration(callDuration)}</span>
                </div>
                {finalTranscript.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.role === "assistant" ? "#EBF3FF" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                      {t.role === "assistant" ? "🍕" : "👤"}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: t.role === "assistant" ? "#2079F9" : "#374151", marginBottom: 2 }}>{t.role === "assistant" ? "Maya (Tony's Pizza)" : "Customer"}</div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{t.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {steps.length > 0 && (
              <div>
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Auto-Triage</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{steps.length} / 5 steps</div>
                </div>
                {steps.map((step, i) => (
                  <StepCard key={step.num} step={step} isActive={callState === STATE.TRIAGING && i === steps.length - 1} />
                ))}
                {verdict && <VerdictCard verdict={verdict} />}
              </div>
            )}
          </div>
        </main>

        <footer style={{ padding: "16px 32px", textAlign: "center", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid var(--border)", background: "#fff" }}>
          Built on <span style={{ color: "#2079F9", fontWeight: 600 }}>Dispatch</span> · Voice by Vapi.ai · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </>
  );
}
