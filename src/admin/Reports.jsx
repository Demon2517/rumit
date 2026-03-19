/**
 * Reports.jsx
 * src/pages/Reports.jsx
 * Dependencies: npm install recharts
 */

import { useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MiniStat } from "../components/helpers";

const MONTHLY = [
  { month: "Oct", revenue: 38000, appointments: 18 },
  { month: "Nov", revenue: 42000, appointments: 22 },
  { month: "Dec", revenue: 35000, appointments: 16 },
  { month: "Jan", revenue: 51000, appointments: 28 },
  { month: "Feb", revenue: 47000, appointments: 24 },
  { month: "Mar", revenue: 62000, appointments: 32 },
];

const TREATMENT_DIST = [
  { name: "Root Canal", value: 28, color: "#1D9E75" },
  { name: "Scaling",    value: 22, color: "#378ADD" },
  { name: "Whitening",  value: 18, color: "#D85A30" },
  { name: "Braces",     value: 15, color: "#7F77DD" },
  { name: "Extraction", value: 12, color: "#BA7517" },
  { name: "Others",     value: 5,  color: "#B0B8C1" },
];

const DOCTOR_PERF = [
  { name: "Dr. Mehta", patients: 48, revenue: 24000, rating: 4.9 },
  { name: "Dr. Singh", patients: 36, revenue: 18000, rating: 4.7 },
  { name: "Dr. Verma", patients: 29, revenue: 17400, rating: 4.8 },
  { name: "Dr. Kumar", patients: 22, revenue: 9900,  rating: 4.5 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-3 px-3 py-2" style={{ background: "#0A1628", color: "#fff", fontSize: 12 }}>
      <p className="mb-1" style={{ opacity: .6, fontSize: 11 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} className="mb-0 fw-bold">
          {p.name}: {p.name === "revenue" ? "₹" + p.value.toLocaleString("en-IN") : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [range, setRange] = useState("6months");

  const totalRevenue = MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const totalAppts   = MONTHLY.reduce((s, m) => s + m.appointments, 0);
  const avgPerAppt   = Math.round(totalRevenue / totalAppts);
  const growth       = Math.round(((MONTHLY[5].revenue - MONTHLY[0].revenue) / MONTHLY[0].revenue) * 100);
  const totalDoctorRev = DOCTOR_PERF.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: "#0A1628" }}>Reports & Analytics</h4>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Clinic performance overview</p>
        </div>
        <select className="form-select" value={range} onChange={e => setRange(e.target.value)} style={{ width: 170, fontSize: 13 }}>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><MiniStat label="Total Revenue"       value={"₹" + totalRevenue.toLocaleString("en-IN")} accent="#1D9E75" /></div>
        <div className="col-6 col-lg-3"><MiniStat label="Appointments"        value={totalAppts}         accent="#378ADD" /></div>
        <div className="col-6 col-lg-3"><MiniStat label="Avg per Appointment" value={"₹" + avgPerAppt}   accent="#7F77DD" /></div>
        <div className="col-6 col-lg-3"><MiniStat label="Growth"              value={"+" + growth + "%"} accent="#1D9E75" /></div>
      </div>

      {/* Charts row */}
      <div className="row g-3 mb-4">

        {/* Revenue bar chart */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 p-lg-4">
              <p className="text-muted fw-bold mb-3" style={{ fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Revenue & Appointments</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MONTHLY} barCategoryGap="35%">
                  <CartesianGrid vertical={false} stroke="#F0F4F8" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7A8D" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7A8D" }} axisLine={false} tickLine={false} tickFormatter={v => "₹" + v / 1000 + "k"} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,109,119,0.05)" }} />
                  <Bar dataKey="revenue" name="revenue" fill="#1D9E75" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="appointments" name="appointments" fill="#E6F1FB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="d-flex gap-3 mt-2">
                {[["revenue", "#1D9E75", "Revenue"], ["appointments", "#B5D4F4", "Appointments"]].map(([k, c, l]) => (
                  <span key={k} className="d-flex align-items-center gap-1" style={{ fontSize: 11, color: "#6B7A8D" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body p-3">
              <p className="text-muted fw-bold mb-2" style={{ fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Treatment Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={TREATMENT_DIST} cx="50%" cy="50%" outerRadius={72} innerRadius={40} dataKey="value">
                    {TREATMENT_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {TREATMENT_DIST.map(t => (
                  <span key={t.name} className="d-flex align-items-center gap-1" style={{ fontSize: 10, color: "#6B7A8D" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, display: "inline-block" }} />
                    {t.name} {t.value}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Performance */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          <div className="px-4 pt-3 pb-2">
            <p className="text-muted fw-bold mb-0" style={{ fontSize: 10, letterSpacing: ".8px", textTransform: "uppercase" }}>Doctor Performance</p>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: "#FAFBFC" }}>
                <tr>
                  {["Doctor","Patients","Revenue","Rating","Revenue Share"].map(h => (
                    <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCTOR_PERF.map((d, i) => {
                  const share = Math.round((d.revenue / totalDoctorRev) * 100);
                  return (
                    <tr key={d.name}>
                      <td className="px-4 fw-semibold" style={{ fontSize: 13 }}>{d.name}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{d.patients}</td>
                      <td className="px-4 fw-bold" style={{ fontSize: 13 }}>₹{d.revenue.toLocaleString("en-IN")}</td>
                      <td className="px-4"><span className="badge text-bg-warning" style={{ fontSize: 11 }}>⭐ {d.rating}</span></td>
                      <td className="px-4" style={{ minWidth: 160 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: 6, borderRadius: 4 }}>
                            <div className="progress-bar" style={{ width: `${share}%`, background: "#1D9E75", borderRadius: 4 }} />
                          </div>
                          <span className="text-muted" style={{ fontSize: 12, minWidth: 32 }}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}