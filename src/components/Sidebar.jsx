/**
 * Sidebar.jsx
 * src/components/Sidebar.jsx
 */

import { useState } from "react";

const MENU_SECTIONS = [
  {
    label: "Main",
    items: [
      { id: "dashboard",    label: "Dashboard",    icon: "🏠", badge: null },
    ],
  },
  {
    label: "Management",
    items: [
      { id: "admins",     label: "Manage Admins",      icon: "🛡️", badge: null },
      { id: "doctors",    label: "Manage Doctors",      icon: "🦷", badge: null },
      { id: "assistants", label: "Manage Assistants",   icon: "🤝", badge: null },
    ],
  },
  {
    label: "Clinic",
    items: [
      { id: "billing",    label: "Billing",    icon: "💰", badge: { count: 3, cls: "bg-danger" } },
      { id: "reports",    label: "Reports",    icon: "📊", badge: null },
    ],
  },
  {
    label: "System",
    items: [
      { id: "settings", label: "Settings", icon: "⚙️", badge: null },
    ],
  },
];

function ToothIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C9 2 6.5 4.2 6.5 7C6.5 8.6 7.1 9.7 7.1 11.2C7.1 13.8 6 16.2 6 18.6C6 20.6 7 22 8.5 22C10 22 10.5 20 12 20C13.5 20 14 22 15.5 22C17 22 18 20.6 18 18.6C18 16.2 16.9 13.8 16.9 11.2C16.9 9.7 17.5 8.6 17.5 7C17.5 4.2 15 2 12 2Z" fill="#1D9E75"/>
      <path d="M9.5 7.5C9.5 6 10.6 5 12 5C13.4 5 14.5 6 14.5 7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export default function Sidebar({ activeMenu = "dashboard", onMenuChange }) {
  const [active, setActive] = useState(activeMenu);

  const handleClick = (id) => {
    setActive(id);
    if (onMenuChange) onMenuChange(id);
  };

  return (
    <div className="d-flex flex-column" style={{ height: "100vh", background: "#0A1628" }}>

      {/* Logo */}
      <div className="px-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(29,158,117,0.15)", border: "1px solid rgba(29,158,117,0.3)" }}>
            <ToothIcon />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>BrightSmile</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.3px" }}>Dental Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-grow-1 overflow-auto py-2 px-2">
        {MENU_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-2 mt-3 mb-1" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = active === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 mb-1 position-relative"
                  style={{
                    cursor: "pointer",
                    background: isActive ? "rgba(29,158,117,0.18)" : "transparent",
                    color: isActive ? "#5DCAA5" : "rgba(255,255,255,0.55)",
                    fontSize: 13, fontWeight: 500,
                    borderLeft: isActive ? "3px solid #1D9E75" : "3px solid transparent",
                    transition: "all .15s",
                    userSelect: "none",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
                >
                  <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                    style={{ width: 28, height: 28, fontSize: 14, background: isActive ? "rgba(29,158,117,0.2)" : "transparent" }}>
                    {item.icon}
                  </div>
                  <span className="flex-grow-1">{item.label}</span>
                  {item.badge && (
                    <span className={`badge ${item.badge.cls}`} style={{ fontSize: 10 }}>
                      {item.badge.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Profile footer */}
      <div className="px-2 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="d-flex align-items-center gap-2 px-2 py-2 rounded-3"
          style={{ background: "rgba(255,255,255,0.05)", cursor: "pointer" }}>
          <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: 30, height: 30, background: "rgba(29,158,117,0.2)", border: "1px solid rgba(29,158,117,0.3)", fontSize: 11, fontWeight: 700, color: "#5DCAA5" }}>
            SA
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Super Admin</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>admin@brightsmile.in</div>
          </div>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>⇄</span>
        </div>
      </div>

    </div>
  );
}