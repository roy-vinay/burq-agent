"use client";
import { useState, useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import Nav from "./components/Nav";
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
    <div style={{ background: colors.bg, border: `1.5px solid ${isActive ? colors.border : "var(--border)"}`, borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 10, transition: "border-color 0.25s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: colors.num, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {step.num}
        </div>
        <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{STEP_LABELS[step.num - 1] || step.label}</span>
        {isActive && <span className="pulse-dot" style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: colors.border, flexShrink: 0 }} />}
      </div>
      <div className="step-content">{step.content.trim() || (isActive ? "Analyzing..." : "")}</div>
    </div>
  );
}

function RecommendationCard({ provider, fullText }) {
  const costMatch = fullText.match(/(?:estimated cost|cost)[*\s:]+(\$[\d,.]+)/i);
  const otMatch = fullText.match(/(?:on.?time probability|on.?time rate|reliability)[*\s:]+(\d+)%/i) || fullText.match(/(\d+)%\s*on.?time/i);
  const etaMatch = fullText.match(/(?:pickup eta|pickup)[*\s:~]+(\d+)\s*min/i) || fullText.match(/~(\d+)\s*min(?:ute)?s?\s*(?:pickup|ETA)/i);
  return (
    <div className="verdict-card fade-in" style={{ marginTop: 6 }}>
      <div style={{ marginBottom: 14 }}>
        <span style={{ background: "#0891B2", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>Selected Provider</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>{provider}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {costMatch && <div className="stat-block"><span className="stat-label">Est. Cost</span><span className="stat-value">{costMatch[1]}</span></div>}
        {otMatch && <div className="stat-block"><span className="stat-label">On-Time Rate</span><span className="stat-value">{otMatch[1]}%</span></div>}
        {etaMatch && <div className="stat-block"><span className="stat-label">Pickup ETA</span><span className="stat-value">{etaMatch[1]} min</span></div>}
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
        Decision made by Pulse AI in &lt;100ms
      </div>
    </div>
  );
}


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
    <div className="app-layout">
      <Nav />
      <div className="app-main">

        {/* Page header + scenario bar */}
        <div className="page-header" style={{ padding: 0 }}>
          <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="flex-between">
              <div>
                <h1 className="page-title">Provider Selection</h1>
                <p className="page-subtitle">AI-powered last-mile delivery provider selection for delivery merchants.</p>
              </div>
              <div className="badge badge-green" style={{ gap: 6, padding: "5px 12px" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981" }} />
                Live Network · 487 Providers
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 28px", display: "flex", gap: 8, alignItems: "center", background: "var(--gray-50)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4 }}>Scenarios</span>
            {SCENARIOS.map((s, i) => (
              <button key={i} className="scenario-btn" onClick={() => loadScenario(i)} style={{ borderColor: activeScenario === i ? s.color : "var(--border)", background: activeScenario === i ? s.color + "15" : "#fff", color: activeScenario === i ? s.color : "var(--gray-700)" }}>
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, padding: "24px 28px", alignItems: "start" }}>

          {/* Left: Order Config */}
          <div className="card" style={{ position: "sticky", top: 24 }}>
            <div className="card-header">
              <span className="card-header-title">Order Configuration</span>
              <span className={`badge ${currentItem.priority === "High" ? "badge-amber" : currentItem.priority === "Medium" ? "badge-blue" : "badge-gray"}`}>
                {currentItem.priority} Priority
              </span>
            </div>

            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div>
                <label className="form-label">Merchant</label>
                <select className="form-select" value={merchantIdx} onChange={e => setMerchantIdx(Number(e.target.value))}>
                  {MERCHANTS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
                </select>
                <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 4 }}>{MERCHANTS[merchantIdx].location}</div>
              </div>

              <div>
                <label className="form-label">Item Type</label>
                <select className="form-select" style={{ color: "var(--blue)", fontWeight: 500 }} value={itemIdx} onChange={e => handleItemChange(Number(e.target.value))}>
                  {ITEM_TYPES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Delivery Address</label>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dark)" }}>{MERCHANTS[merchantIdx].delivery}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">Distance (mi)</label>
                  <select className="form-select" value={distance} onChange={e => setDistance(Number(e.target.value))}>
                    {[1.2, 2.1, 2.8, 3.2, 4.5, 5.1, 7.8, 12.3].map(d => <option key={d} value={d}>{d} mi</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Time Window</label>
                  <select className="form-select" value={window_} onChange={e => setWindow(Number(e.target.value))}>
                    {[30, 45, 60, 90, 120, 180].map(w => <option key={w} value={w}>{w} min</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Order Value</label>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--dark)" }}>${currentItem.value_usd.toFixed(2)}</div>
              </div>

              <div>
                <label className="form-label">Requirements</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  {Object.entries(requirements).map(([key, val]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={val} onChange={() => toggleReq(key)} style={{ width: 15, height: 15, accentColor: "var(--blue)", cursor: "pointer" }} />
                      <span style={{ fontSize: 13, color: val ? "var(--dark)" : "var(--gray-400)", fontWeight: val ? 500 : 400 }}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--warning-light)", border: "1px solid #FED7AA", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                {currentItem.notes}
              </div>

              <button className="btn btn-primary btn-lg w-full" style={{ justifyContent: "center" }} onClick={runAgent} disabled={streaming}>
                {streaming ? (
                  <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%" }} className="spin" />Selecting Provider...</>
                ) : (
                  <><Zap size={16} />Select Optimal Provider</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Agent Output */}
          <div ref={outputRef}>
            {!fullText && !streaming && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🤖</div>
                  <div className="empty-state-title">Pulse AI is ready</div>
                  <div className="empty-state-body">Load a scenario or configure your order, then click "Select Optimal Provider" to watch the agent reason in real time.</div>
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
                  <StepCard key={step.num} step={step} index={step.num - 1} isActive={streaming && i === steps.length - 1} />
                ))}
                {recommendation && <RecommendationCard provider={recommendation} fullText={fullText} />}
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
