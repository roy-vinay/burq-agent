"use client";
import { usePathname } from "next/navigation";
import { Zap, Mail, Phone, Mic, Clock, Settings, Activity } from "lucide-react";

const SECTIONS = [
  {
    label: "Agents",
    links: [
      { href: "/", label: "Provider Selection", icon: Zap },
      { href: "/email-agent", label: "Email Triage", icon: Mail },
      { href: "/call-triage", label: "Call Triage", icon: Phone },
      { href: "/live-call", label: "Live Call", icon: Mic },
    ],
  },
  {
    label: "Data",
    links: [
      { href: "/history", label: "History", icon: Clock },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="nav-sidebar">
      <div className="nav-logo">
        <div className="nav-logo-icon">
          <span>B</span>
        </div>
        <div>
          <div className="nav-logo-title">Dispatch AI</div>
          <div className="nav-logo-sub">Operations Platform</div>
        </div>
      </div>

      <nav className="nav-links">
        {SECTIONS.map((section) => (
          <div key={section.label} className="nav-section">
            <div className="nav-section-label">{section.label}</div>
            {section.links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <a
                  key={href}
                  href={href}
                  className={`nav-link ${active ? "nav-link-active" : ""}`}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                  <span>{label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="nav-status">
        <Activity size={12} />
        <span>Live Network · 487 Providers</span>
      </div>
    </aside>
  );
}
