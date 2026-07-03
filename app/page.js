"use client";
import { useState, useRef, useEffect } from "react";
import "./globals.css";

const DEFAULT_ORDER = {
  order_id: "ORD-20260703-8821",
  merchant: "Safeway Store #2847",
  merchant_location: "1243 W San Carlos St, San Jose, CA 95126",
  item_type: "Pharmacy — Prescription Medication (Insulin, Controlled Substance)",
  delivery_address: "3480 Payne Ave, San Jose, CA 95117",
  distance_miles: 3.2,
  time_window_minutes: 45,
  order_value_usd: 847.50,
  priority: "High",
  special_requirements: {
    chain_of_custody: true,
    age_verification: true,
    temperature_control: true,
    signature_required: true,
  },
  notes: "Insulin — must remain 36–46°F. Patient waiting. Do not leave unattended.",
};

const STEP_LABELS = [
  "Order Analysis",
  "Hard Filters",
  "Provider Evaluation",
  "Ranking",
  "Recommendation",
];

const STEP_COLORS = [
  { bg: "#EBF3FF", border: "#2079F9", text: "#2079F9", num: "#2079F9" },
  { bg: "#FFF7ED", border: "#F97316", text: "#EA580C", num: "#F97316" },
  { bg: "#F0FDF4", border: "#22C55E", text: "#16A34A", num: "#22C55E" },
  { bg: "#F5F3FF", border: "#8B5CF6", text: "#7C3AED", num: "#8B5CF6" },
  { bg: "#E6F9FD", border: "#00BADA", text: "#0891B2", num: "#00BADA" },
];

function parseSteps(text) {
  const parts = text.split(/(\*\*STEP \d+:[^*]+\*\*)/);
  const steps = [];
  let currentStep = null;
  let preamble = "";

  for (const part of parts) {
    const headerMatch = part.match(/\*\*STEP (\d+): ([^*]+)\*\*/);
    if (headerMatch) {
      if (currentStep) steps.push(currentStep);
      currentStep = {
        num: parseInt(headerMatch[1]),
        label: headerMatch[2].trim(),
        content: "",
      };
    } else if (currentStep) {
      currentStep.content += part;
    } else {
      preamble += part;
    }
  }
  if (currentStep) steps.push(currentStep);
  return steps;
}

function extractRecommendation(text) {
  const match = text.match(/SELECTED:\s*(.+?)(?:\n|$)/i);
  return match ? match[1].replace(/\*/g, "").trim() : null;
}

function StepCard({ step, index, isActive }) {
  const colors = STEP_COLORS[index] || STEP_COLORS[0];
  const content = step.content.trim();

  return (
    <div
      style={{
        background: colors.bg,
        border: `1.5px solid ${isActive ? colors.border : "#E5E7EB"}`,
        borderRadius: 10,
        padding: "16px 20px",
        marginBottom: 12,
        transition: "border-color 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: colors.num,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {step.num}
        </div>
        <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>
          {STEP_LABELS[step.num - 1] || step.label}
        </span>
        {isActive && (
          <span
            style={{
              marginLeft: "auto",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: colors.border,
              animation: "pulse 1s infinite",
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12.5,
          lineHeight: 1.75,
          color: "#374151",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {content || (isActive ? "Analyzing..." : "")}
      </div>
    </div>
  );
}

function RecommendationCard({ provider, fullText }) {
  const costMatch = fullText.match(/(?:estimated cost|cost)[*\s:]+(\$[\d,.]+)/i);
  const otMatch = fullText.match(/(?:on.?time probability|on.?time rate|reliability)[*\s:]+(\d+)%/i)
    || fullText.match(/(\d+)%\s*on.?time/i);
  const etaMatch = fullText.match(/(?:pickup eta|pickup)[*\s:~]+(\d+)\s*min/i)
    || fullText.match(/~(\d+)\s*min(?:ute)?s?\s*(?:pickup|ETA)/i);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1B1C1C 0%, #2C2D2D 100%)",
        borderRadius: 12,
        padding: "20px 24px",
        marginTop: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            background: "#00BADA",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Selected Provider
        </div>
      </div>

      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 14 }}>
        {provider}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {costMatch && (
          <div style={statStyle}>
            <span style={statLabel}>Est. Cost</span>
            <span style={statValue}>{costMatch[1]}</span>
          </div>
        )}
        {otMatch && (
          <div style={statStyle}>
            <span style={statLabel}>On-Time Rate</span>
            <span style={statValue}>{otMatch[1]}%</span>
          </div>
        )}
        {etaMatch && (
          <div style={statStyle}>
            <span style={statLabel}>Pickup ETA</span>
            <span style={statValue}>{etaMatch[1]} min</span>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Decision made by Pulse AI in &lt;100ms
      </div>
    </div>
  );
}

const statStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: "8px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const statLabel = {
  fontSize: 11,
  color: "rgba(255,255,255,0.5)",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const statValue = {
  fontSize: 16,
  fontWeight: 700,
  color: "#00BADA",
};

export default function Home() {
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [streaming, setStreaming] = useState(false);
  const [fullText, setFullText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const outputRef = useRef(null);

  const steps = parseSteps(fullText);
  const recommendation = done ? extractRecommendation(fullText) : null;

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [fullText]);

  async function runAgent() {
    setStreaming(true);
    setFullText("");
    setDone(false);
    setError(null);

    try {
      const res = await fetch("/api/select-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
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

  const requirements = order.special_requirements;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .run-btn:hover:not(:disabled) {
          background: #1560D4 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(32,121,249,0.35) !important;
        }
        .run-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header style={{
          background: "#fff",
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              background: "linear-gradient(135deg, #2079F9, #00BADA)",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>B</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1B1C1C", lineHeight: 1.2 }}>
                Pulse AI
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.04em" }}>
                Provider Selection Agent
              </div>
            </div>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            color: "#16A34A",
            fontWeight: 600,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
            Live Network · 487 Providers Active
          </div>
        </header>

        {/* Main */}
        <main style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 0,
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          padding: "24px 32px",
          gap: 24,
          alignItems: "start",
        }}>

          {/* Left: Order Panel */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid var(--border)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
            position: "sticky",
            top: 84,
          }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1C1C" }}>Incoming Order</span>
              <span style={{
                background: "#FEF3C7",
                color: "#D97706",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                letterSpacing: "0.04em",
              }}>HIGH PRIORITY</span>
            </div>

            <div style={{ padding: "20px" }}>

              {/* Order ID */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Order ID</label>
                <div style={valueStyle}>{order.order_id}</div>
              </div>

              {/* Merchant */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Merchant</label>
                <div style={valueStyle}>{order.merchant}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{order.merchant_location}</div>
              </div>

              {/* Item */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Item Type</label>
                <div style={{ ...valueStyle, color: "#2079F9" }}>{order.item_type}</div>
              </div>

              {/* Delivery */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Delivery Address</label>
                <div style={valueStyle}>{order.delivery_address}</div>
              </div>

              {/* Metrics row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                <div style={metricStyle}>
                  <span style={metricLabel}>Distance</span>
                  <span style={metricValue}>{order.distance_miles} mi</span>
                </div>
                <div style={metricStyle}>
                  <span style={metricLabel}>Window</span>
                  <span style={metricValue}>{order.time_window_minutes} min</span>
                </div>
                <div style={metricStyle}>
                  <span style={metricLabel}>Value</span>
                  <span style={metricValue}>${order.order_value_usd.toFixed(0)}</span>
                </div>
              </div>

              {/* Requirements */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Requirements</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {Object.entries(requirements).map(([key, val]) => val && (
                    <div key={key} style={{
                      background: "#EBF3FF",
                      color: "#2079F9",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: 20,
                      letterSpacing: "0.03em",
                    }}>
                      {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: "#92400E",
                marginBottom: 20,
                lineHeight: 1.5,
              }}>
                {order.notes}
              </div>

              {/* Run Button */}
              <button
                className="run-btn"
                onClick={runAgent}
                disabled={streaming}
                style={{
                  width: "100%",
                  background: streaming ? "#9CA3AF" : "#2079F9",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: streaming ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  letterSpacing: "0.02em",
                }}
              >
                {streaming ? (
                  <>
                    <div style={{
                      width: 15,
                      height: 15,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    Selecting Provider...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16 }}>⚡</span>
                    Select Optimal Provider
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Agent Output */}
          <div>
            {!fullText && !streaming && (
              <div style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px dashed #D1D5DB",
                padding: "60px 40px",
                textAlign: "center",
                color: "#9CA3AF",
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>
                  Pulse AI is ready
                </div>
                <div style={{ fontSize: 13 }}>
                  Hit "Select Optimal Provider" to watch the agent reason through the assignment in real time.
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "16px 20px",
                color: "#DC2626",
                fontSize: 13,
              }}>
                Error: {error}
              </div>
            )}

            {steps.length > 0 && (
              <div>
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Agent Reasoning
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {steps.length} / 5 steps
                  </div>
                </div>

                {steps.map((step, i) => (
                  <StepCard
                    key={step.num}
                    step={step}
                    index={step.num - 1}
                    isActive={streaming && i === steps.length - 1}
                  />
                ))}

                {recommendation && (
                  <RecommendationCard provider={recommendation} fullText={fullText} />
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          padding: "16px 32px",
          textAlign: "center",
          fontSize: 12,
          color: "#9CA3AF",
          borderTop: "1px solid var(--border)",
          background: "#fff",
        }}>
          Built on <span style={{ color: "#2079F9", fontWeight: 600 }}>Dispatch</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </>
  );
}

const fieldStyle = { marginBottom: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" };
const valueStyle = { fontSize: 13, fontWeight: 500, color: "#1B1C1C", marginTop: 3 };
const metricStyle = {
  background: "var(--gray-100)",
  borderRadius: 8,
  padding: "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 3,
};
const metricLabel = { fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" };
const metricValue = { fontSize: 15, fontWeight: 700, color: "#1B1C1C" };
