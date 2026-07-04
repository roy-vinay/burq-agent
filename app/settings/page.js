"use client";
import { useState, useEffect } from "react";
import "../globals.css";

const NAV_LINKS = [
  { href: "/", label: "Provider Selection" },
  { href: "/email-agent", label: "Email Triage" },
  { href: "/call-triage", label: "Call Triage" },
  { href: "/live-call", label: "Live Call" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "⚙ Settings", active: true },
];

const DEFAULTS = {
  name: "Tony's Pizza",
  tagline: "Best pizza in the city",
  agentName: "Maya",
  menu: "Large Pepperoni - $18\nLarge Margherita - $16\nLarge BBQ Chicken - $19\nLarge Mushroom - $16\nGarlic Bread - $5\nCoke/Diet Coke - $3",
  hours: "Mon-Sun 11am - 11pm",
  refundPolicy: "We offer full refunds for wrong or cold orders within 30 minutes of delivery. Contact us and we will process your refund immediately.",
  phone: "(408) 555-0100",
  voiceProvider: "vapi",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("restaurantProfile");
      if (stored) setProfile({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  function handleChange(field, value) {
    setProfile(p => ({ ...p, [field]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem("restaurantProfile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function reset() {
    setProfile(DEFAULTS);
    localStorage.removeItem("restaurantProfile");
    setSaved(false);
  }

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", color: "#374151", background: "#FAFAFA", transition: "border-color 0.2s", outline: "none" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };

  return (
    <>
      <style>{`
        input:focus, textarea:focus { border-color: #2079F9 !important; box-shadow: 0 0 0 3px rgba(32,121,249,0.1); background: #fff !important; }
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
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.04em" }}>Restaurant Settings</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 13, color: l.active ? "#2079F9" : "#6B7280", textDecoration: "none", fontWeight: l.active ? 600 : 500, borderBottom: l.active ? "2px solid #2079F9" : "none", paddingBottom: l.active ? 2 : 0 }}>{l.label}</a>
            ))}
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: 800, margin: "0 auto", width: "100%", padding: "32px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1B1C1C" }}>Restaurant Profile</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              These settings are used by Maya during live calls. Changes take effect on the next call.
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>

            {/* Voice Provider */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1B1C1C", marginBottom: 4 }}>Voice Provider</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>Choose which AI voice platform handles live calls. Both require their own API key in environment variables.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { value: "vapi", label: "Vapi.ai", desc: "Paid ($10 min). Great voice quality, easy setup.", badge: "Current" },
                  { value: "retell", label: "Retell AI", desc: "Free tier available. Supports Hindi + 30 languages.", badge: "Free tier" },
                ].map(opt => {
                  const active = profile.voiceProvider === opt.value;
                  return (
                    <div key={opt.value} onClick={() => handleChange("voiceProvider", opt.value)} style={{ border: `2px solid ${active ? "#2079F9" : "#E5E7EB"}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", background: active ? "#EBF3FF" : "#FAFAFA", transition: "all 0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? "#2079F9" : "#374151" }}>{opt.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: active ? "#2079F9" : "#E5E7EB", color: active ? "#fff" : "#6B7280" }}>{opt.badge}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Identity */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1B1C1C", marginBottom: 16 }}>Identity</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Restaurant Name</label>
                  <input style={inputStyle} value={profile.name} onChange={e => handleChange("name", e.target.value)} placeholder="Tony's Pizza" />
                </div>
                <div>
                  <label style={labelStyle}>Agent Name</label>
                  <input style={inputStyle} value={profile.agentName} onChange={e => handleChange("agentName", e.target.value)} placeholder="Maya" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Tagline</label>
                  <input style={inputStyle} value={profile.tagline} onChange={e => handleChange("tagline", e.target.value)} placeholder="Best pizza in the city" />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input style={inputStyle} value={profile.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(408) 555-0100" />
                </div>
                <div>
                  <label style={labelStyle}>Operating Hours</label>
                  <input style={inputStyle} value={profile.hours} onChange={e => handleChange("hours", e.target.value)} placeholder="Mon-Sun 11am - 11pm" />
                </div>
              </div>
            </div>

            {/* Menu */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1B1C1C", marginBottom: 6 }}>Menu</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>One item per line. Maya will quote these when customers ask about the menu.</div>
              <textarea
                style={{ ...inputStyle, height: 160, resize: "vertical", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7 }}
                value={profile.menu}
                onChange={e => handleChange("menu", e.target.value)}
                placeholder="Large Pepperoni - $18&#10;Large Margherita - $16"
              />
            </div>

            {/* Refund Policy */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1B1C1C", marginBottom: 6 }}>Refund Policy</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>Maya will follow this policy when handling complaints and refund requests.</div>
              <textarea
                style={{ ...inputStyle, height: 100, resize: "vertical" }}
                value={profile.refundPolicy}
                onChange={e => handleChange("refundPolicy", e.target.value)}
                placeholder="We offer full refunds for wrong or cold orders..."
              />
            </div>

            {/* Preview */}
            <div style={{ background: "#1B1C1C", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Preview — Maya's First Message</div>
              <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.6, fontStyle: "italic" }}>
                "Thank you for calling {profile.name || "your restaurant"}, this is {profile.agentName || "Maya"} speaking. How can I help you today?"
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={reset} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
                Reset to Defaults
              </button>
              <button onClick={save} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: saved ? "#10B981" : "#2079F9", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", minWidth: 120 }}>
                {saved ? "Saved!" : "Save Profile"}
              </button>
            </div>
          </div>
        </main>

        <footer style={{ padding: "16px 32px", textAlign: "center", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid var(--border)", background: "#fff" }}>
          Built on <span style={{ color: "#2079F9", fontWeight: 600 }}>Dispatch</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </>
  );
}
