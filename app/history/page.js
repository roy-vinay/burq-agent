"use client";
import { useState, useEffect } from "react";
import "../globals.css";

const ROUTE_COLORS = {
  REFUNDS_TEAM: { bg: "#ECFDF5", text: "#059669", border: "#6EE7B7" },
  OPS_ESCALATION: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  ORDER_DESK: { bg: "#EBF3FF", text: "#2079F9", border: "#93C5FD" },
  PARTNERSHIPS_TEAM: { bg: "#F5F3FF", text: "#7C3AED", border: "#C4B5FD" },
  SUPPORT_L1: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  HUMAN_REVIEW: { bg: "#FFFBEB", text: "#D97706", border: "#FCD34D" },
};

const NAV_LINKS = [
  { href: "/", label: "Provider Selection" },
  { href: "/email-agent", label: "Email Triage" },
  { href: "/call-triage", label: "Call Triage" },
  { href: "/live-call", label: "Live Call" },
  { href: "/history", label: "History", active: true },
  { href: "/settings", label: "⚙ Settings" },
];

function RouteTag({ route }) {
  const colors = ROUTE_COLORS[route] || ROUTE_COLORS.SUPPORT_L1;
  return (
    <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {route.replace(/_/g, " ")}
    </span>
  );
}

function UrgencyBar({ urgency }) {
  const color = urgency >= 8 ? "#DC2626" : urgency >= 5 ? "#F59E0B" : "#10B981";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 60, height: 6, borderRadius: 3, background: "#E5E7EB", overflow: "hidden" }}>
        <div style={{ width: `${urgency * 10}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>{urgency}</span>
    </div>
  );
}

function ExpandedRow({ log }) {
  const [tab, setTab] = useState("triage");
  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ background: "#FAFAFA", padding: "20px 24px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["triage", "transcript"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #E5E7EB", background: tab === t ? "#1B1C1C" : "#fff", color: tab === t ? "#fff" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {t === "triage" ? "Triage Analysis" : "Full Transcript"}
              </button>
            ))}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.75, color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 400, overflowY: "auto" }}>
            {tab === "triage" ? log.triage_text : log.transcript}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch("/api/call-history")
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  function formatDate(ts) {
    return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function formatDuration(secs) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        .row-btn:hover { background: #F9FAFB !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, #2079F9, #00BADA)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>B</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1B1C1C", lineHeight: 1.2 }}>Pulse AI</div>
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.04em" }}>Call History</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 13, color: l.active ? "#2079F9" : "#6B7280", textDecoration: "none", fontWeight: l.active ? 600 : 500, borderBottom: l.active ? "2px solid #2079F9" : "none", paddingBottom: l.active ? 2 : 0 }}>{l.label}</a>
            ))}
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "32px" }}>
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1B1C1C" }}>Call History</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{logs.length} calls triaged</div>
            </div>
            <button onClick={() => { setLoading(true); fetch("/api/call-history").then(r => r.json()).then(d => { setLogs(d.logs || []); setLoading(false); }); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              Refresh
            </button>
          </div>

          {loading && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "60px", textAlign: "center", color: "#9CA3AF" }}>
              Loading call history...
            </div>
          )}

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "16px 20px", color: "#DC2626", fontSize: 13 }}>
              Error loading history: {error}. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set.
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #D1D5DB", padding: "60px", textAlign: "center", color: "#9CA3AF" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>No calls yet</div>
              <div style={{ fontSize: 13 }}>Triage a call on the Call Triage or Live Call pages — it will appear here.</div>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {["Time", "Source", "Intent", "Route", "Urgency", "Confidence", "Duration"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <>
                      <tr key={log.id} className="row-btn" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} style={{ cursor: "pointer", background: expandedId === log.id ? "#F0F7FF" : "#fff", borderBottom: expandedId === log.id ? "none" : "1px solid #F3F4F6", transition: "background 0.1s" }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>{formatDate(log.created_at)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: log.source === "live" ? "#EBF3FF" : "#F3F4F6", color: log.source === "live" ? "#2079F9" : "#6B7280" }}>
                            {log.source === "live" ? "📞 Live" : "📋 Manual"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#374151" }}>{(log.intent || "—").replace(/_/g, " ")}</td>
                        <td style={{ padding: "12px 16px" }}><RouteTag route={log.route || "SUPPORT_L1"} /></td>
                        <td style={{ padding: "12px 16px" }}><UrgencyBar urgency={log.urgency || 0} /></td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: log.confidence >= 80 ? "#10B981" : log.confidence >= 60 ? "#F59E0B" : "#DC2626" }}>{log.confidence}%</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>{formatDuration(log.duration_seconds)}</td>
                      </tr>
                      {expandedId === log.id && <ExpandedRow key={`exp-${log.id}`} log={log} />}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <footer style={{ padding: "16px 32px", textAlign: "center", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid var(--border)", background: "#fff" }}>
          Built on <span style={{ color: "#2079F9", fontWeight: 600 }}>Dispatch</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </>
  );
}
