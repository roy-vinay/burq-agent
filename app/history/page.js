"use client";
import { useState, useEffect } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Phone, FileText } from "lucide-react";
import Nav from "../components/Nav";
import "../globals.css";

const ROUTE_META = {
  REFUNDS_TEAM:      { cls: "badge-green",  label: "Refunds Team" },
  OPS_ESCALATION:    { cls: "badge-red",    label: "Ops Escalation" },
  ORDER_DESK:        { cls: "badge-blue",   label: "Order Desk" },
  PARTNERSHIPS_TEAM: { cls: "badge-purple", label: "Partnerships" },
  SUPPORT_L1:        { cls: "badge-gray",   label: "Support L1" },
  HUMAN_REVIEW:      { cls: "badge-amber",  label: "Human Review" },
};

function RouteTag({ route }) {
  const meta = ROUTE_META[route] || ROUTE_META.SUPPORT_L1;
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

function UrgencyBar({ urgency }) {
  const color = urgency >= 8 ? "#DC2626" : urgency >= 5 ? "#F59E0B" : "#10B981";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 56, height: 5, borderRadius: 3, background: "#E5E7EB", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${urgency * 10}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 700, minWidth: 14 }}>{urgency}</span>
    </div>
  );
}

function ExpandedRow({ log }) {
  const [tab, setTab] = useState("triage");
  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ background: "#F8F9FB", borderTop: "1px solid #EFF6FF", padding: "20px 24px" }} className="fade-in">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { id: "triage", label: "Triage Analysis", icon: FileText },
              { id: "transcript", label: "Transcript", icon: Phone },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 6,
                  border: "1px solid",
                  borderColor: tab === id ? "#2563EB" : "#E5E7EB",
                  background: tab === id ? "#2563EB" : "#fff",
                  color: tab === id ? "#fff" : "#374151",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 12, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 400, overflowY: "auto" }}>
            {tab === "triage" ? log.triage_text : log.transcript}
          </div>
        </div>
      </td>
    </tr>
  );
}

function ConfidenceLabel({ value }) {
  const color = value >= 80 ? "#059669" : value >= 60 ? "#D97706" : "#DC2626";
  return <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}%</span>;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  function loadLogs() {
    return fetch("/api/call-history?t=" + Date.now(), { cache: "no-store" })
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); })
      .catch(e => { setError(e.message); });
  }

  useEffect(() => {
    loadLogs().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function formatDuration(secs) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  const liveCount = logs.filter(l => l.source === "live").length;
  const manualCount = logs.filter(l => l.source === "manual").length;

  return (
    <div className="app-layout">
      <Nav />
      <div className="app-main">

        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1 className="page-title">Call History</h1>
              <p className="page-subtitle">{logs.length} calls triaged{liveCount > 0 ? ` · ${liveCount} live, ${manualCount} manual` : ""}</p>
            </div>
            <button className="btn btn-ghost" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="page-body-full">
          {loading && (
            <div className="card">
              <div className="empty-state">
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", color: "#6B7280" }}>
                  <RefreshCw size={16} className="spin" />
                  <span style={{ fontSize: 13 }}>Loading call history...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ border: "1px solid #FECACA" }}>
              <div className="card-body" style={{ color: "#DC2626", fontSize: 13 }}>
                Error loading history: {error}. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set.
              </div>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No calls yet</div>
                <div className="empty-state-body">
                  Triage a call on the Call Triage or Live Call pages. Each one will appear here automatically.
                </div>
              </div>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    {["Time", "Source", "Intent", "Route", "Urgency", "Confidence", "Duration", ""].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const isExpanded = expandedId === log.id;
                    return (
                      <>
                        <tr
                          key={log.id}
                          className={isExpanded ? "expanded" : ""}
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          style={{ borderBottom: isExpanded ? "none" : undefined }}
                        >
                          <td style={{ color: "#6B7280", whiteSpace: "nowrap", fontSize: 12 }}>{formatDate(log.created_at)}</td>
                          <td>
                            <span className={`badge ${log.source === "live" ? "badge-blue" : "badge-gray"}`}>
                              {log.source === "live" ? "📞 Live" : "📋 Manual"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: "#1E293B" }}>
                            {(log.intent || "—").replace(/_/g, " ")}
                          </td>
                          <td><RouteTag route={log.route || "SUPPORT_L1"} /></td>
                          <td><UrgencyBar urgency={log.urgency || 0} /></td>
                          <td><ConfidenceLabel value={log.confidence} /></td>
                          <td style={{ color: "#6B7280", fontSize: 12 }}>{formatDuration(log.duration_seconds)}</td>
                          <td style={{ width: 32, color: "#9CA3AF" }}>
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </td>
                        </tr>
                        {isExpanded && <ExpandedRow key={`exp-${log.id}`} log={log} />}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="page-footer">
          Built on <span style={{ color: "var(--blue)", fontWeight: 600 }}>Dispatch AI</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </div>
  );
}
