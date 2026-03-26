/**
 * AdminLayout.jsx
 * src/layouts/AdminLayout.jsx
 *
 * Setup:
 *   npm install bootstrap
 *   In main.jsx → import 'bootstrap/dist/css/bootstrap.min.css'
 */

import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const ROUTES = {
  dashboard: "/admin",
  appointments: "/admin/appointments",
  patients: "/admin/patients",
  admins: "/admin/admins",
  doctors: "/admin/doctors",
  assistants: "/admin/assistants",
  treatments: "/admin/treatments",
  billing: "/admin/billing",
  reports: "/admin/reports",
  settings: "/admin/settings",
  inventory: "/admin/inventory",
};

const PATH_TO_ID = Object.fromEntries(
  Object.entries(ROUTES).map(([id, path]) => [path, id]),
);

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeMenu = PATH_TO_ID[location.pathname] || "dashboard";

  const handleMenuChange = (id) => {
    const route = ROUTES[id];
    if (route) navigate(route);
    setSidebarOpen(false); // close on mobile after click
  };

  return (
    <>
      <style>{`
        body { background: #EEF2F7; font-family: 'Nunito', 'Segoe UI', sans-serif; }
        .sidebar-fixed {
          position: fixed; top: 0; left: 0;
          width: 240px; height: 100vh;
          overflow-y: auto; overflow-x: hidden;
          z-index: 1040; background: #0A1628;
          transition: transform .25s ease;
        }
        .sidebar-fixed.hidden { transform: translateX(-100%); }
        .main-content {
          margin-left: 240px;
          min-height: 100vh;
          overflow-y: auto;
        }
        .mobile-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.45); z-index: 1039;
        }
        @media (max-width: 991px) {
          .main-content { margin-left: 0; }
          .sidebar-fixed { transform: translateX(-100%); }
          .sidebar-fixed.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar-fixed ${sidebarOpen ? "open" : ""}`}>
        <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} />
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Mobile topbar */}
        <nav
          className="navbar d-lg-none px-3 py-2"
          style={{
            background: "#0A1628",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            className="btn btn-sm me-3"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
            }}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>
            BrightSmile Dental
          </span>
        </nav>

        <Outlet />
      </div>
    </>
  );
}
