"use client";
import { useState, useRef, useEffect } from "react";
import "./globals.css";

const MERCHANTS = [
  { name: "Safeway Store #2847", location: "1243 W San Carlos St, San Jose, CA 95126", delivery: "3480 Payne Ave, San Jose, CA 95117" },
  { name: "Kroger Store #4521", location: "750 W Remington Dr, Sunnyvale, CA 94087", delivery: "1122 Hollenbeck Ave, Sunnyvale, CA 94087" },
  { name: "Albertsons #3302", location: "5765 Santa Teresa Blvd, San Jose, CA 95123", delivery: "6100 Snell Ave, San Jose, CA 95123" },
  { name: "Ace Hardware #0892", location: "1875 S Bascom Ave, Campbell, CA 95008", delivery: "420 W Hamilton Ave, Campbell, CA 95008" },
  { name: "1-800-Flowers #SJ01", location: "2855 Stevens Creek Blvd, Santa Clara, CA 95050", delivery: "900 N Winchester Blvd, Santa Clara, CA 95128" },
];

const ITEM_TYPES = [
  {
    label: "Pharmacy — Prescription Medication (Insulin, Controlled Substance)",
    value: "pharmacy_controlled",
    requirements: { chain_of_custody: true, age_verification: true, temperature_control: true, signature_required: true },
    notes: "Insulin — must remain 36–46°F. Patient waiting. Do not leave unattended.",
    value_usd: 847.50,
    priority: "High",
  },
  {
    label: "Grocery — Standard Household Items",
    value: "grocery_standard",
    requirements: { chain_of_custody: false, age_verification: false, temperature_control: false, signature_required: false },
    notes: "Standard grocery order. No special handling required.",
    value_usd: 124.75,
    priority: "Medium",
  },
  {
    label: "Grocery — Alcohol (Age Verification Required)",
    value: "grocery_alcohol",
    requirements: { chain_of_custody: false, age_verification: true, temperature_control: false, signature_required: true },
    notes: "Alcohol included. Valid ID must be checked at door.",
    value_usd: 89.50,
    priority: "Medium",
  },
  {
    label: "Furniture — Large Item Delivery",
    value: "furniture_large",
    requirements: { chain_of_custody: false, age_verification: false, temperature_control: false, signature_required: true },
    notes: "Large item. Requires truck and two-person team. Assembly not included.",
    value_usd: 649.00,
    priority: "Low",
  },
  {
    label: "Floral — Event Delivery (Fragile)",
    value: "floral_fragile",
    requirements: { chain_of_custody: false, age_verification: false, temperature_control: true, signature_required: false },
    notes: "Fragile floral arrangement. Must remain upright. Time-sensitive event delivery.",
    value_usd: 215.00,
    priority: "High",
  },
  {
    label: "Pharmacy — OTC Medication (No Controlled Substance)",
    value: "pharmacy_otc",
    requirements: { chain_of_custody: false, age_verification: false, temperature_control: false, signature_required: false },
    notes: "Over-the-counter medication. Standard delivery.",
    value_usd: 42.00,
    priority: "Medium",
  },
];

const SCENARIOS = [
  {
    label: "Pharmacy",
    emoji: "💊",
    description: "Controlled substance — compliance critical",
    color: "#2079F9",
    merchant: MERCHANTS[0],
    item: ITEM_TYPES[0],
    distance: 3.2,
    window: 45,
  },
  {
    label: "Grocery Tradeoff",
    emoji: "🛒",
    description: "Multiple viable providers — cost vs reliability",
    color: "#10B981",
    merchant: MERCHANTS[1],
    item: ITEM_TYPES[1],
    distance: 2.8,
    window: 60,
  },
  {
    label: "Furniture",
    emoji: "🛋️",
    description: "Large item — specialist provider required",
    color: "#F59E0B",
    merchant: MERCHANTS[3],
    item: ITEM_TYPES[3],
    distance: 5.1,
    window: 120,
  },
];

const STEP_LABELS = ["Order Analysis", "Hard Filters", "Provider Evaluation", "Ranking", "Recommendation"];
const STEP_COLORS = [
  { bg: "#EBF3FF", border: "#2079F9", text: "#2079F9", num: "#2079F9" },
  { bg: "#FFF7ED", border: "#F97316", text: "#EA580C", num: "#F97316" },
  { bg: "#F0FDF4", border: "#22C55E", text: "#16A34A", num: "#22C55E" },
  { bg: "#F5F3FF", border: "#8B5CF6", text: "#7C3AED", num: "#8B5CF6" },
  { bg: "#E6F9FD", border: "#00BADA", text: "#0891B2", num: "#00BADA" },
];

function buildOrderFromState(state) {
  return {
    order_id: `ORD-${Date.now().toString().slice(-8)}`,
    merchant: state.merchant.name,
    merchant_location: state.merchant.location,
    item_type: state.item.label,
    delivery_address: state.merchant.delivery,
    distance_miles: state.distance,
    time_window_minutes: state.window,
    order_value_usd: state.item.value_usd,
    priority: state.item.priority,
    special_requirements: state.requirements,
    notes: state.item.notes,
  };
}

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

function extractRecommendation(text) {
  const match = text.match(/SELECTED:\s*(.+?)(?:\n|$)/i);
  return match ? match[1].replace(/\*/g, "").trim() : null;
}

function StepCard({ step, index, isActive }) {
  const colors = STEP_COLORS[index] || STEP_COLORS[0];
  return (
    <div style={{ background: colors.bg, border: `1.5px solid ${isActive ? colors.border : "#E5E7EB"}`, borderRadius: 10, padding: "16px 20px", marginBottom: 12, transition: "border-color 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: colors.num, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {step.num}
        </div>
        <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{STEP_LABELS[step.num - 1] || step.label}</span>
        {isActive && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: colors.border, animation: "pulse 1s infinite", flexShrink: 0 }} />}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.75, color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {step.content.trim() || (isActive ? "Analyzing..." : "")}
      </div>
    </div>
  );
}

function RecommendationCard({ provider, fullText }) {
  const costMatch = fullText.match(/(?:estimated cost|cost)[*\s:]+(\$[\d,.]+)/i);
  const otMatch = fullText.match(/(?:on.?time probability|on.?time rate|reliability)[*\s:]+(\d+)%/i) || fullText.match(/(\d+)%\s*on.?time/i);
  const etaMatch = fullText.match(/(?:pickup eta|pickup)[*\s:~]+(\d+)\s*min/i) || fullText.match(/~(\d+)\s*min(?:ute)?s?\s*(?:pickup|ETA)/i);
  return (
    <div style={{ background: "linear-gradient(135deg, #1B1C1C 0%, #2C2D2D 100%)", borderRadius: 12, padding: "20px 24px", marginTop: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ background: "#00BADA", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>Selected Provider</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 14 }}>{provider}</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {costMatch && <div style={statStyle}><span style={statLabel}>Est. Cost</span><span style={statValue}>{costMatch[1]}</span></div>}
        {otMatch && <div style={statStyle}><span style={statLabel}>On-Time Rate</span><span style={statValue}>{otMatch[1]}%</span></div>}
        {etaMatch && <div style={statStyle}><span style={statLabel}>Pickup ETA</span><span style={statValue}>{etaMatch[1]} min</span></div>}
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>
        Decision made by Pulse AI in &lt;100ms
      </div>
    </div>
  );
}

const statStyle = { background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2 };
const statLabel = { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" };
const statValue = { fontSize: 16, fontWeight: 700, color: "#00BADA" };
const labelStyle = { fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
const selectStyle = { width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #E5E7EB", fontSize: 13, color: "#1B1C1C", background: "#fff", cursor: "pointer", outline: "none" };

export default function Home() {
  const [merchantIdx, setMerchantIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [distance, setDistance] = useState(3.2);
  const [window_, setWindow] = useState(45);
  const [requirements, setRequirements] = useState(ITEM_TYPES[0].requirements);
  const [streaming, setStreaming] = useState(false);
  const [fullText, setFullText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [activeScenario, setActiveScenario] = useState(0);
  const outputRef = useRef(null);

  const steps = parseSteps(fullText);
  const recommendation = done ? extractRecommendation(fullText) : null;

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [fullText]);

  function loadScenario(idx) {
    const s = SCENARIOS[idx];
    setActiveScenario(idx);
    setMerchantIdx(MERCHANTS.indexOf(s.merchant));
    setItemIdx(ITEM_TYPES.indexOf(s.item));
    setDistance(s.distance);
    setWindow(s.window);
    setRequirements(s.item.requirements);
    setFullText("");
    setDone(false);
    setError(null);
  }

  function handleItemChange(idx) {
    setItemIdx(idx);
    setRequirements(ITEM_TYPES[idx].requirements);
    setWindow(ITEM_TYPES[idx].value === "furniture_large" ? 120 : ITEM_TYPES[idx].priority === "High" ? 45 : 60);
  }

  function toggleReq(key) {
    setRequirements(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function runAgent() {
    setStreaming(true);
    setFullText("");
    setDone(false);
    setError(null);

    const order = buildOrderFromState({
      merchant: MERCHANTS[merchantIdx],
      item: ITEM_TYPES[itemIdx],
      distance,
      window: window_,
      requirements,
    });

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

  const currentItem = ITEM_TYPES[itemIdx];

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .run-btn:hover:not(:disabled) { background: #1560D4 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(32,121,249,0.35) !important; }
        .scenario-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        select:focus { border-color: #2079F9 !important; box-shadow: 0 0 0 3px rgba(32,121,249,0.1); }
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
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.04em" }}>Provider Selection Agent</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <a href="/" style={{ fontSize: 13, color: "#2079F9", textDecoration: "none", fontWeight: 600, borderBottom: "2px solid #2079F9", paddingBottom: 2 }}>Provider Selection</a>
              <a href="/email-agent" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Email Triage</a>
              <a href="/call-triage" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Call Triage</a>
              <a href="/live-call" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>Live Call</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
              Live Network · 487 Providers Active
            </div>
          </div>
        </header>

        {/* Scenario Presets */}
        <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "12px 32px", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Quick Load</span>
          {SCENARIOS.map((s, i) => (
            <button key={i} className="scenario-btn" onClick={() => loadScenario(i)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${activeScenario === i ? s.color : "#E5E7EB"}`, background: activeScenario === i ? s.color + "14" : "#fff", color: activeScenario === i ? s.color : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              {activeScenario === i && <span style={{ fontSize: 10, opacity: 0.7 }}>— {s.description}</span>}
            </button>
          ))}
        </div>

        {/* Main */}
        <main style={{ flex: 1, display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "24px 32px", alignItems: "start" }}>

          {/* Left: Order Config */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)", position: "sticky", top: 120 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1C1C" }}>Order Configuration</span>
              <span style={{ background: currentItem.priority === "High" ? "#FEF3C7" : currentItem.priority === "Medium" ? "#EBF3FF" : "#F3F4F6", color: currentItem.priority === "High" ? "#D97706" : currentItem.priority === "Medium" ? "#2079F9" : "#6B7280", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                {currentItem.priority.toUpperCase()} PRIORITY
              </span>
            </div>

            <div style={{ padding: "20px" }}>

              {/* Merchant */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Merchant</label>
                <select style={selectStyle} value={merchantIdx} onChange={e => setMerchantIdx(Number(e.target.value))}>
                  {MERCHANTS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
                </select>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{MERCHANTS[merchantIdx].location}</div>
              </div>

              {/* Item Type */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Item Type</label>
                <select style={{ ...selectStyle, color: "#2079F9", fontWeight: 500 }} value={itemIdx} onChange={e => handleItemChange(Number(e.target.value))}>
                  {ITEM_TYPES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                </select>
              </div>

              {/* Delivery Address */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Delivery Address</label>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1B1C1C" }}>{MERCHANTS[merchantIdx].delivery}</div>
              </div>

              {/* Distance / Window */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Distance (miles)</label>
                  <select style={selectStyle} value={distance} onChange={e => setDistance(Number(e.target.value))}>
                    {[1.2, 2.1, 2.8, 3.2, 4.5, 5.1, 7.8, 12.3].map(d => <option key={d} value={d}>{d} mi</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Time Window (min)</label>
                  <select style={selectStyle} value={window_} onChange={e => setWindow(Number(e.target.value))}>
                    {[30, 45, 60, 90, 120, 180].map(w => <option key={w} value={w}>{w} min</option>)}
                  </select>
                </div>
              </div>

              {/* Order Value */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Order Value</label>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1B1C1C" }}>${currentItem.value_usd.toFixed(2)}</div>
              </div>

              {/* Requirements */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Requirements</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {Object.entries(requirements).map(([key, val]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={val} onChange={() => toggleReq(key)} style={{ width: 15, height: 15, accentColor: "#2079F9", cursor: "pointer" }} />
                      <span style={{ fontSize: 13, color: val ? "#1B1C1C" : "#9CA3AF", fontWeight: val ? 500 : 400 }}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#92400E", marginBottom: 20, lineHeight: 1.5 }}>
                {currentItem.notes}
              </div>

              {/* Run Button */}
              <button className="run-btn" onClick={runAgent} disabled={streaming} style={{ width: "100%", background: streaming ? "#9CA3AF" : "#2079F9", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: streaming ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {streaming ? (
                  <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Selecting Provider...</>
                ) : (
                  <><span style={{ fontSize: 16 }}>⚡</span>Select Optimal Provider</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Agent Output */}
          <div ref={outputRef}>
            {!fullText && !streaming && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #D1D5DB", padding: "60px 40px", textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>Pulse AI is ready</div>
                <div style={{ fontSize: 13 }}>Load a scenario or configure your order, then hit "Select Optimal Provider" to watch the agent reason in real time.</div>
              </div>
            )}

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "16px 20px", color: "#DC2626", fontSize: 13 }}>
                Error: {error}
              </div>
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
                {recommendation && <RecommendationCard provider={recommendation} fullText={fullText} />}
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
