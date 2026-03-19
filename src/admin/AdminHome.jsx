/**
 * AdminHome.jsx
 * src/pages/AdminHome.jsx
 *
 * Dependencies: npm install recharts bootstrap
 */

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const BASE_URL = "http://localhost/your-project/api";

const weeklyData = [
  { day: "Mon", appointments: 18 }, { day: "Tue", appointments: 24 },
  { day: "Wed", appointments: 16 }, { day: "Thu", appointments: 28 },
  { day: "Fri", appointments: 22 }, { day: "Sat", appointments: 14 }, { day: "Sun", appointments: 8 },
];

const doctors = [
  { name: "Dr. A. Mehta",  spec: "Orthodontist",   patients: 8, active: true  },
  { name: "Dr. R. Singh",  spec: "Endodontist",    patients: 6, active: true  },
  { name: "Dr. P. Verma",  spec: "Periodontist",   patients: 5, active: false },
  { name: "Dr. S. Kumar",  spec: "Prosthodontist", patients: 5, active: true  },
];

const recentAppointments = [
  { patient: "Priya Sharma", doctor: "Dr. Mehta", time: "09:00 AM", treatment: "Root Canal",  status: "Completed",   statusCls: "bg-success" },
  { patient: "Raj Patel",    doctor: "Dr. Singh",  time: "09:30 AM", treatment: "Scaling",      status: "In Progress", statusCls: "bg-warning text-dark" },
  { patient: "Anita Joshi",  doctor: "Dr. Mehta",  time: "10:00 AM", treatment: "Whitening",    status: "Pending",     statusCls: "bg-info text-dark" },
  { patient: "Mohan Das",    doctor: "Dr. Verma",  time: "10:30 AM", treatment: "Extraction",   status: "Cancelled",   statusCls: "bg-danger" },
  { patient: "Sunita Rao",   doctor: "Dr. Singh",  time: "11:00 AM", treatment: "Braces Check", status: "Pending",     statusCls: "bg-info text-dark" },
];

function useAnimatedCounter(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame, start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function Avatar({ name, size = 32 }) {
  const ini = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = [["#E1F5EE","#085041"],["#FAEEDA","#633806"],["#E6F1FB","#042C53"],["#EEEDFE","#3C3489"]];
  const [bg, color] = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
      style={{ width: size, height: size, background: bg, color, fontSize: size * 0.35, fontWeight: 700 }}>
      {ini}
    </div>
  );
}

function StatCard({ icon, label, target, trend, trendUp, accent, prefix = "" }) {
  const count = useAnimatedCounter(target);
  return (
    <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: `3px solid ${accent} !important`, borderRadius: 14 }}>
      <div className="card-body p-3" style={{ borderLeft: `3px solid ${accent}`, borderRadius: 14 }}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <p className="text-muted mb-0" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase" }}>{label}</p>
          <span style={{ fontSize: 22, opacity: 0.12 }}>{icon}</span>
        </div>
        <h3 className="mb-1 fw-bold" style={{ color: "#0A1628", fontSize: 26 }}>
          {prefix}{count.toLocaleString("en-IN")}
        </h3>
        <p className="mb-0" style={{ fontSize: 11, fontWeight: 600, color: trendUp ? "#1D9E75" : "#E24B4A" }}>
          {trendUp ? "▲" : "▼"} {trend}
        </p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-3 p-2 px-3" style={{ background: "#0A1628", color: "#fff", fontSize: 13 }}>
      <p className="mb-1" style={{ opacity: .6, fontSize: 11 }}>{label}</p>
      <p className="mb-0 fw-bold">{payload[0].value} appointments</p>
    </div>
  );
};

export default function AdminHome() {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-3 p-lg-4" style={{ background: "#EEF2F7", minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 44, height: 44, background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C9 2 6.5 4.2 6.5 7C6.5 8.6 7.1 9.7 7.1 11.2C7.1 13.8 6 16.2 6 18.6C6 20.6 7 22 8.5 22C10 22 10.5 20 12 20C13.5 20 14 22 15.5 22C17 22 18 20.6 18 18.6C18 16.2 16.9 13.8 16.9 11.2C16.9 9.7 17.5 8.6 17.5 7C17.5 4.2 15 2 12 2Z" fill="#1D9E75"/>
              <path d="M9.5 7.5C9.5 6 10.6 5 12 5C13.4 5 14.5 6 14.5 7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h5 className="mb-0 fw-bold" style={{ color: "#0A1628" }}>BrightSmile Dental</h5>
            <small className="text-muted">Admin Dashboard</small>
          </div>
        </div>
        <div className="text-end">
          <p className="mb-0 fw-semibold" style={{ fontSize: 13, color: "#0A1628" }}>{today}</p>
          <small className="text-muted">Welcome back, Admin 👋</small>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><StatCard icon="👥" label="Total Patients"       target={1248}  trend="12% this month"        trendUp={true}  accent="#1D9E75" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="📅" label="Today's Appointments" target={24}    trend="4 more than yesterday"  trendUp={true}  accent="#D85A30" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="🦷" label="Active Doctors"       target={8}     trend="1 on leave today"       trendUp={false} accent="#7F77DD" /></div>
        <div className="col-6 col-lg-3"><StatCard icon="₹"  label="Revenue Today"        target={48500} trend="8% vs last week"        trendUp={true}  accent="#378ADD" prefix="₹" /></div>
      </div>

      {/* Chart + Doctors */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 p-lg-4">
              <p className="text-muted fw-bold mb-3" style={{ fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Weekly Appointments</p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={weeklyData} barCategoryGap="38%">
                  <CartesianGrid vertical={false} stroke="#F0F4F8" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6B7A8D" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7A8D" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,109,119,0.05)" }} />
                  <Bar dataKey="appointments" fill="#1D9E75" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body p-3">
              <p className="text-muted fw-bold mb-3" style={{ fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Doctors on Duty</p>
              <div className="d-flex flex-column gap-2">
                {doctors.map((doc) => {
                  const ini = doc.name.replace("Dr. ", "").split(" ").map(n => n[0]).join("").slice(0, 2);
                  return (
                    <div key={doc.name} className="d-flex align-items-center justify-content-between rounded-3 px-2 py-2"
                      style={{ background: doc.active ? "#E1F5EE" : "#F5F5F5", border: `1px solid ${doc.active ? "#9FE1CB" : "#E4EAF0"}` }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                          style={{ width: 30, height: 30, background: doc.active ? "#1D9E75" : "#B0B8C1", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                          {ini}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#0A1628" }}>{doc.name}</div>
                          <div style={{ fontSize: 10, color: "#6B7A8D" }}>{doc.spec}</div>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge" style={{ fontSize: 10, background: doc.active ? "#1D9E75" : "#9BA8B5", color: "#fff" }}>{doc.active ? "Active" : "Off"}</span>
                        <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 2 }}>{doc.patients} pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          <div className="px-4 pt-3 pb-2">
            <p className="text-muted fw-bold mb-0" style={{ fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Recent Appointments</p>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ background: "#FAFBFC" }}>
                <tr>
                  {["Patient","Doctor","Time","Treatment","Status"].map(h => (
                    <th key={h} className="text-muted fw-bold border-0 px-4 py-2" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appt, i) => (
                  <tr key={i}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={appt.patient} />
                        <span className="fw-semibold" style={{ fontSize: 13 }}>{appt.patient}</span>
                      </div>
                    </td>
                    <td className="px-4" style={{ fontSize: 13, color: "#1D9E75", fontWeight: 600 }}>{appt.doctor}</td>
                    <td className="px-4" style={{ fontSize: 12, fontFamily: "monospace", color: "#6B7A8D" }}>{appt.time}</td>
                    <td className="px-4" style={{ fontSize: 13, color: "#6B7A8D" }}>{appt.treatment}</td>
                    <td className="px-4"><span className={`badge ${appt.statusCls}`} style={{ fontSize: 11 }}>{appt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}