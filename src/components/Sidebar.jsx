/**
 * Sidebar.jsx
 * src/components/Sidebar.jsx
 *
 * Dynamic role-based sidebar.
 * Props:
 *   role         — "admin" | "doctor" | "assistant"
 *   user         — { name, email }
 *   activeMenu   — currently active item id (string)
 *   onMenuChange — callback(id: string)
 *   onLogout     — callback()
 *
 * Example usage in AdminLayout:
 *   const { user } = useAuth();   // your auth context
 *   <Sidebar role={user.role} user={user} activeMenu={activeMenu} onMenuChange={handleMenuChange} onLogout={handleLogout} />
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog, useConfirm } from "./helpers";

/* ══════════════════════════════════════════════════
   MENU DEFINITIONS  (one object per role)
══════════════════════════════════════════════════ */
const MENUS = {

  /* ─── ADMIN ─── */
  admin: [
    {
      label: "Main",
      items: [
        { id: "dashboard",          label: "Dashboard",           icon: "🏠", badge: null }
      ],
    },
    {
      label: "Management",
      items: [
        { id: "admins",             label: "Manage Admins",       icon: "🛡️", badge: null },
        { id: "doctors",            label: "Manage Doctors",      icon: "🦷", badge: null },
        { id: "assistants",         label: "Manage Assistants",   icon: "🤝", badge: null },
      ],
    },
    {
      label: "Insights",
      items: [
        { id: "reports",            label: "Reports",             icon: "📊", badge: null },
      ],
    },
    {
      label: "System",
      items: [
        { id: "settings",           label: "Settings",            icon: "⚙️", badge: null },
      ],
    },
  ],

  /* ─── DOCTOR ─── */
  doctor: [
    {
      label: "Main",
      items: [
        { id: "doctor_dashboard",   label: "Dashboard",           icon: "🏠", badge: null },
        { id: "my_appointments",    label: "My Appointments",     icon: "📅", badge: { count: 8, cls: "bg-success" } },
        { id: "my_patients",        label: "My Patients",         icon: "👥", badge: null },
      ],
    },
    {
      label: "Clinical",
      items: [
        { id: "prescriptions",      label: "Prescriptions",       icon: "💊", badge: null },
        { id: "medical_records",    label: "Medical Records",     icon: "🗂️", badge: null },
        { id: "treatment_plans",    label: "Treatment Plans",     icon: "📋", badge: null },
        { id: "lab_reports",        label: "Lab Reports",         icon: "🔬", badge: { count: 2, cls: "bg-warning" } },
      ],
    },
    {
      label: "Schedule",
      items: [
        { id: "availability",       label: "My Availability",     icon: "🗓️", badge: null },
        { id: "leave_requests",     label: "Leave Requests",      icon: "🏖️", badge: null },
      ],
    },
    {
      label: "Communication",
      items: [
        { id: "patient_messages",   label: "Patient Messages",    icon: "💬", badge: { count: 5, cls: "bg-danger" } },
        { id: "notifications",      label: "Notifications",       icon: "🔔", badge: null },
      ],
    },
    {
      label: "Account",
      items: [
        { id: "my_profile",         label: "My Profile",          icon: "👤", badge: null },
        { id: "doctor_settings",    label: "Settings",            icon: "⚙️", badge: null },
      ],
    },
  ],

  /* ─── ASSISTANT ─── */
  assistant: [
    {
      label: "Main",
      items: [
        { id: "asst_dashboard",     label: "Dashboard",           icon: "🏠", badge: null },
        { id: "todays_schedule",    label: "Today's Schedule",    icon: "📅", badge: { count: 6, cls: "bg-success" } },
        { id: "all_appointments",   label: "All Appointments",    icon: "📋", badge: null },
      ],
    },
    {
      label: "Patient Care",
      items: [
        { id: "patients_list",      label: "Patient List",        icon: "👥", badge: null },
        { id: "patient_checkin",    label: "Patient Check-in",    icon: "✅", badge: { count: 3, cls: "bg-warning" } },
        { id: "patient_followup",   label: "Follow-ups",          icon: "🔄", badge: null },
      ],
    },
    {
      label: "Operations",
      items: [
        { id: "inventory",          label: "Inventory",           icon: "📦", badge: null },
        { id: "billing_assist",     label: "Billing",             icon: "💰", badge: null },
        { id: "doctor_schedule",    label: "Doctor Schedules",    icon: "👨‍⚕️", badge: null },
      ],
    },
    {
      label: "Communication",
      items: [
        { id: "messages",           label: "Messages",            icon: "💬", badge: { count: 2, cls: "bg-danger" } },
        { id: "reminders",          label: "Send Reminders",      icon: "🔔", badge: null },
      ],
    },
    {
      label: "Account",
      items: [
        { id: "asst_profile",       label: "My Profile",          icon: "👤", badge: null },
        { id: "asst_settings",      label: "Settings",            icon: "⚙️", badge: null },
      ],
    },
  ],
};

/* ══════════════════════════════════════════════════
   ROLE THEMING
══════════════════════════════════════════════════ */
const ROLE_THEME = {
  admin:     { label: "Admin Panel",     accent: "#1D9E75", avatarColor: "#5DCAA5" },
  doctor:    { label: "Doctor Panel",    accent: "#378ADD", avatarColor: "#85B7EB" },
  assistant: { label: "Assistant Panel", accent: "#D85A30", avatarColor: "#F0997B" },
};

/* ══════════════════════════════════════════════════
   TOOTH ICON
══════════════════════════════════════════════════ */
function ToothIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C9 2 6.5 4.2 6.5 7C6.5 8.6 7.1 9.7 7.1 11.2C7.1 13.8 6 16.2 6 18.6C6 20.6 7 22 8.5 22C10 22 10.5 20 12 20C13.5 20 14 22 15.5 22C17 22 18 20.6 18 18.6C18 16.2 16.9 13.8 16.9 11.2C16.9 9.7 17.5 8.6 17.5 7C17.5 4.2 15 2 12 2Z" fill={color} />
      <path d="M9.5 7.5C9.5 6 10.6 5 12 5C13.4 5 14.5 6 14.5 7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   LOGOUT SVG ICON
══════════════════════════════════════════════════ */
function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   SIDEBAR COMPONENT
══════════════════════════════════════════════════ */
export default function Sidebar({
  role         = localStorage.getItem("logintype") || "admin",
  user         = (() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return { name: "User", email: "" };
 
      const parsed = JSON.parse(stored);
 
      // Handle both storage formats:
      // Old format → localStorage.setItem("user", JSON.stringify("Rumit"))  → parsed = "Rumit" (string)
      // New format → localStorage.setItem("user", JSON.stringify({ name, email })) → parsed = object
      if (typeof parsed === "string") {
        // Plain string stored — name only, no email available
        return { name: parsed || "User", email: "" };
      }
 
      if (typeof parsed === "object" && parsed !== null) {
        return {
          name:  parsed.name  || parsed.Name  || "User",
          email: parsed.email || parsed.Email || "",
        };
      }
 
      return { name: "User", email: "" };
    } catch { return { name: "User", email: "" }; }
  })(),
  activeMenu   = "",
  onMenuChange,
  onLogout,
})

{
  const navigate = useNavigate();
  const { confirm, confirmProps }    = useConfirm();
  const [active,        setActive]       = useState(activeMenu);
  const [logoutHover,   setLogoutHover]  = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const sections = MENUS[role] || MENUS.admin;
  const theme    = ROLE_THEME[role] || ROLE_THEME.admin;
  const { accent, avatarColor, label: roleLabel } = theme;

  const initials = (user.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleClick = (id) => {
    setActive(id);
    if (onMenuChange) onMenuChange(id);
  };

  /**
   * Handles logout:
   * 1. Shows custom ConfirmDialog (no browser native dialog)
   * 2. Clears all localStorage / sessionStorage
   * 3. Calls optional onLogout prop (e.g. to clear React auth context)
   * 4. Redirects to login page
   */
  const handleLogout = async () => {
    const ok = await confirm({
      title:       "Logout",
      message:     "Are you sure you want to logout? You will be redirected to the login page.",
      confirmText: "Yes, Logout",
      cancelText:  "Stay",
      variant:     "danger",
      icon:        "🚪",
    });
    if (!ok) return;

    setLogoutLoading(true);

    // Clear all auth-related storage
    localStorage.removeItem("islogin");
    localStorage.removeItem("user");
    localStorage.removeItem("logintype");
    localStorage.removeItem("rememberEmail");
    sessionStorage.clear();

    // Call parent logout handler if provided (e.g. clear auth context)
    if (typeof onLogout === "function") {
      await onLogout();
    }

    // Redirect to login
    navigate("/", { replace: true });
  };
  return (
    <>
    {/* ── Custom Confirm Dialog (replaces window.confirm) ── */}
    <ConfirmDialog {...confirmProps} />

    <div
      className="d-flex flex-column"
      style={{ height: "100vh", background: "#0A1628", overflow: "hidden" }}
    >

      {/* ── LOGO ── */}
      <div className="px-3 pt-3 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{ width: 38, height: 38, background: `${accent}22`, border: `1px solid ${accent}55` }}
          >
            <ToothIcon color={accent} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>OM</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Dental Clinic</div>
          </div>
        </div>
      </div>

      {/* ── ROLE INDICATOR ── */}
      <div className="mx-3 mt-2 mb-1 px-3 py-2 rounded-3 flex-shrink-0" style={{ background: `${accent}15`, border: `1px solid ${accent}35` }}>
        <div className="d-flex align-items-center gap-2">
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block", boxShadow: `0 0 6px ${accent}` }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: ".6px", textTransform: "uppercase" }}>{roleLabel}</span>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className="flex-grow-1 px-2 pb-2" style={{ overflowY: "auto", overflowX: "hidden" }}>
        {sections.map((section) => (
          <div key={section.label}>

            <div className="px-2 mt-3 mb-1" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.1px", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
              {section.label}
            </div>

            {section.items.map((item) => {
              const isActive = active === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 mb-1"
                  style={{
                    cursor:     "pointer",
                    userSelect: "none",
                    background: isActive ? `${accent}22` : "transparent",
                    color:      isActive ? accent : "rgba(255,255,255,0.55)",
                    fontSize:   13,
                    fontWeight: isActive ? 600 : 500,
                    borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                    style={{ width: 28, height: 28, fontSize: 14, background: isActive ? `${accent}30` : "transparent" }}
                  >
                    {item.icon}
                  </div>

                  <span className="flex-grow-1 text-truncate">{item.label}</span>

                  {item.badge && (
                    <span className={`badge flex-shrink-0 ${item.badge.cls}`} style={{ fontSize: 10 }}>
                      {item.badge.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── PROFILE + LOGOUT ── */}
      <div className="px-2 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Profile card */}
        <div className="d-flex align-items-center gap-2 px-2 py-2 rounded-3 mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: 32, height: 32, background: `${accent}28`, border: `1px solid ${accent}50`, fontSize: 11, fontWeight: 700, color: avatarColor }}
          >
            {initials}
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
          </div>
          <span
            className="badge flex-shrink-0"
            style={{ fontSize: 9, fontWeight: 700, background: `${accent}28`, color: accent, border: `1px solid ${accent}50`, textTransform: "capitalize" }}
          >
            {role}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          disabled={logoutLoading}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-2"
          style={{
            background:   logoutHover ? "rgba(226,75,74,0.15)" : "rgba(255,255,255,0.05)",
            color:        logoutHover ? "#E24B4A"               : "rgba(255,255,255,0.45)",
            border:       `1px solid ${logoutHover ? "rgba(226,75,74,0.35)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 10, fontSize: 12, fontWeight: 600,
            transition:   "all .15s",
            opacity:      logoutLoading ? 0.6 : 1,
            cursor:       logoutLoading ? "not-allowed" : "pointer",
          }}
        >
          {logoutLoading
            ? <><span className="spinner-border spinner-border-sm" style={{ width: 13, height: 13, borderWidth: 2 }} /> Logging out...</>
            : <><LogoutIcon /> Logout</>
          }
        </button>
      </div>

    </div>
    </>
  );
}