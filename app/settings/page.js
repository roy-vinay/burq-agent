"use client";
import { useState, useEffect } from "react";
import { Save, RotateCcw, CheckCircle, Zap, Mic } from "lucide-react";
import Nav from "../components/Nav";
import "../globals.css";

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

const VOICE_PROVIDERS = [
  {
    value: "vapi",
    label: "Vapi.ai",
    desc: "Paid ($10 minimum). Excellent voice quality, easy setup.",
    badge: "Paid",
    badgeCls: "badge-gray",
    Icon: Zap,
  },
  {
    value: "retell",
    label: "Retell AI",
    desc: "Free tier available. Supports Hindi + 30 languages.",
    badge: "Free tier",
    badgeCls: "badge-green",
    Icon: Mic,
  },
];

function Section({ title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-header-title">{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

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
    setTimeout(() => setSaved(false), 2500);
  }

  function reset() {
    setProfile(DEFAULTS);
    localStorage.removeItem("restaurantProfile");
    setSaved(false);
  }

  return (
    <div className="app-layout">
      <Nav />
      <div className="app-main">

        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">Configure Maya's persona and voice provider for live calls.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={reset}>
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                className={`btn ${saved ? "btn-success" : "btn-primary"}`}
                onClick={save}
                style={{ minWidth: 120, transition: "background 0.2s" }}
              >
                {saved ? <CheckCircle size={14} /> : <Save size={14} />}
                {saved ? "Saved!" : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="page-body" style={{ maxWidth: 820 }}>

          {/* Voice Provider */}
          <Section title="Voice Provider" subtitle="Choose which AI voice platform handles live calls.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {VOICE_PROVIDERS.map(({ value, label, desc, badge, badgeCls, Icon }) => {
                const active = profile.voiceProvider === value;
                return (
                  <div
                    key={value}
                    onClick={() => handleChange("voiceProvider", value)}
                    style={{
                      border: `2px solid ${active ? "var(--blue)" : "var(--border)"}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      cursor: "pointer",
                      background: active ? "var(--blue-light)" : "var(--gray-50)",
                      transition: "all 0.15s",
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Icon size={14} color={active ? "var(--blue)" : "var(--gray-400)"} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--blue)" : "var(--gray-800)" }}>{label}</span>
                      </div>
                      <span className={`badge ${active ? "badge-blue" : badgeCls}`}>{badge}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Identity */}
          <Section title="Identity" subtitle="Maya introduces herself using these details on every call.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Restaurant Name">
                <input className="form-input" value={profile.name} onChange={e => handleChange("name", e.target.value)} placeholder="Tony's Pizza" />
              </Field>
              <Field label="Agent Name">
                <input className="form-input" value={profile.agentName} onChange={e => handleChange("agentName", e.target.value)} placeholder="Maya" />
              </Field>
              <Field label="Tagline">
                <input className="form-input" value={profile.tagline} onChange={e => handleChange("tagline", e.target.value)} placeholder="Best pizza in the city" />
              </Field>
              <Field label="Phone Number">
                <input className="form-input" value={profile.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(408) 555-0100" />
              </Field>
              <Field label="Operating Hours">
                <input className="form-input" value={profile.hours} onChange={e => handleChange("hours", e.target.value)} placeholder="Mon-Sun 11am - 11pm" />
              </Field>
            </div>
          </Section>

          {/* Menu */}
          <Section title="Menu" subtitle="One item per line. Maya quotes these prices when customers ask.">
            <textarea
              className="form-textarea mono"
              style={{ height: 160, fontSize: 12 }}
              value={profile.menu}
              onChange={e => handleChange("menu", e.target.value)}
              placeholder={"Large Pepperoni - $18\nLarge Margherita - $16"}
            />
          </Section>

          {/* Refund Policy */}
          <Section title="Refund Policy" subtitle="Maya follows this policy when handling complaints.">
            <textarea
              className="form-textarea"
              style={{ height: 100 }}
              value={profile.refundPolicy}
              onChange={e => handleChange("refundPolicy", e.target.value)}
              placeholder="We offer full refunds for wrong or cold orders..."
            />
          </Section>

          {/* Preview */}
          <div style={{ background: "var(--dark)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Preview — Maya's Opening Line
            </div>
            <div style={{ fontSize: 14, color: "#E2E8F0", lineHeight: 1.7, fontStyle: "italic" }}>
              "Thank you for calling {profile.name || "your restaurant"}, this is {profile.agentName || "Maya"} speaking. How can I help you today?"
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingBottom: 8 }}>
            <button className="btn btn-ghost" onClick={reset}>
              <RotateCcw size={14} />
              Reset to Defaults
            </button>
            <button
              className={`btn btn-lg ${saved ? "btn-success" : "btn-primary"}`}
              onClick={save}
              style={{ minWidth: 140, transition: "background 0.2s" }}
            >
              {saved ? <CheckCircle size={15} /> : <Save size={15} />}
              {saved ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>

        <footer className="page-footer">
          Built on <span style={{ color: "var(--blue)", fontWeight: 600 }}>Dispatch</span> · Powered by Claude claude-sonnet-4-6
        </footer>
      </div>
    </div>
  );
}
