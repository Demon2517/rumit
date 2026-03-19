/**
 * Settings.jsx
 * src/pages/Settings.jsx
 */

import { useState } from "react";
import { apiFetch } from "../components/helpers";

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
      <div className="card-header border-0 px-4 py-3" style={{ background: "#FAFBFC", borderRadius: "16px 16px 0 0" }}>
        <h6 className="fw-bold mb-1" style={{ color: "#0A1628", fontSize: 14 }}>{title}</h6>
        {subtitle && <p className="text-muted mb-0" style={{ fontSize: 12 }}>{subtitle}</p>}
      </div>
      <div className="card-body px-4 py-4">{children}</div>
    </div>
  );
}

function FeedbackMsg({ text, ok }) {
  if (!text) return null;
  return <div className={`alert py-2 px-3 mb-3 ${ok ? "alert-success" : "alert-danger"}`} style={{ fontSize: 12 }}>{text}</div>;
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#0A1628" }}>{label}</div>
        {desc && <div className="text-muted" style={{ fontSize: 11 }}>{desc}</div>}
      </div>
      <div className="form-check form-switch mb-0 ms-3">
        <input className="form-check-input" type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          style={{ cursor: "pointer", width: 42, height: 22 }} />
      </div>
    </div>
  );
}

export default function Settings() {

  /* ── Clinic Info ── */
  const [clinic, setClinic] = useState({
    name: "BrightSmile Dental", email: "info@brightsmile.in",
    phone: "+91 98765 43210", address: "12, Dental House, MG Road, Bhuj, Gujarat 370001",
    website: "www.brightsmile.in", gst_number: "", registration_number: "",
  });
  const [clinicMsg, setClinicMsg] = useState({ text: "", ok: true });
  const [clinicSaving, setClinicSaving] = useState(false);

  const saveClinic = async () => {
    setClinicSaving(true); setClinicMsg({ text: "", ok: true });
    try {
      const json = await apiFetch("settings.php?action=update_clinic", { method: "PUT", body: clinic });
      setClinicMsg({ text: json.status ? "Clinic info saved!" : json.message || "Failed", ok: json.status });
    } catch { setClinicMsg({ text: "Network error", ok: false }); }
    setClinicSaving(false);
    setTimeout(() => setClinicMsg({ text: "", ok: true }), 4000);
  };

  /* ── Working Hours ── */
  const [hours, setHours] = useState({ mon_fri_open: "09:00", mon_fri_close: "20:00", sat_open: "09:00", sat_close: "16:00", sunday_closed: true });
  const [hoursMsg, setHoursMsg] = useState({ text: "", ok: true });
  const [hoursSaving, setHoursSaving] = useState(false);

  const saveHours = async () => {
    setHoursSaving(true); setHoursMsg({ text: "", ok: true });
    try {
      const json = await apiFetch("settings.php?action=update_hours", { method: "PUT", body: hours });
      setHoursMsg({ text: json.status ? "Working hours saved!" : json.message || "Failed", ok: json.status });
    } catch { setHoursMsg({ text: "Network error", ok: false }); }
    setHoursSaving(false);
    setTimeout(() => setHoursMsg({ text: "", ok: true }), 4000);
  };

  /* ── Password ── */
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwMsg, setPwMsg] = useState({ text: "", ok: true });
  const [pwSaving, setPwSaving] = useState(false);

  const savePassword = async () => {
    if (!pw.current_password)   return setPwMsg({ text: "Current password is required", ok: false });
    if (pw.new_password.length < 8) return setPwMsg({ text: "Password must be at least 8 characters", ok: false });
    if (pw.new_password !== pw.confirm_password) return setPwMsg({ text: "Passwords do not match", ok: false });
    setPwSaving(true); setPwMsg({ text: "", ok: true });
    try {
      const adminId = localStorage.getItem("admin_id") || 1;
      const json = await apiFetch("admins.php?action=update_password", { method: "PUT", body: { admin_id: adminId, password: pw.new_password } });
      if (json.status) { setPwMsg({ text: "Password updated!", ok: true }); setPw({ current_password: "", new_password: "", confirm_password: "" }); }
      else setPwMsg({ text: json.message || "Failed", ok: false });
    } catch { setPwMsg({ text: "Network error", ok: false }); }
    setPwSaving(false);
    setTimeout(() => setPwMsg({ text: "", ok: true }), 4000);
  };

  /* ── Notifications ── */
  const [notifs, setNotifs] = useState({
    appointment_reminders: true, new_patient_alert: true, billing_reminders: true,
    daily_summary: false, sms_alerts: false, email_reports: true,
  });
  const [notifMsg, setNotifMsg] = useState({ text: "", ok: true });
  const [notifSaving, setNotifSaving] = useState(false);

  const saveNotifs = async () => {
    setNotifSaving(true); setNotifMsg({ text: "", ok: true });
    try {
      const json = await apiFetch("settings.php?action=update_notifications", { method: "PUT", body: notifs });
      setNotifMsg({ text: json.status ? "Preferences saved!" : json.message || "Failed", ok: json.status });
    } catch { setNotifMsg({ text: "Network error", ok: false }); }
    setNotifSaving(false);
    setTimeout(() => setNotifMsg({ text: "", ok: true }), 4000);
  };

  const SaveBtn = ({ onClick, saving, label = "Save Changes" }) => (
    <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={onClick} disabled={saving}>
      {saving ? <><span className="spinner-border spinner-border-sm me-1" />{label}...</> : label}
    </button>
  );

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: "#0A1628" }}>Settings</h4>
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>Manage clinic configuration and preferences</p>
      </div>

      {/* ── Clinic Info ── */}
      <SectionCard title="Clinic Information" subtitle="Details shown on invoices and reports">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>CLINIC NAME</label>
            <input className="form-control" value={clinic.name} onChange={e => setClinic({ ...clinic, name: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>EMAIL</label>
            <input className="form-control" type="email" value={clinic.email} onChange={e => setClinic({ ...clinic, email: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>PHONE</label>
            <input className="form-control" value={clinic.phone} onChange={e => setClinic({ ...clinic, phone: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>WEBSITE</label>
            <input className="form-control" value={clinic.website} onChange={e => setClinic({ ...clinic, website: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>GST NUMBER</label>
            <input className="form-control" value={clinic.gst_number} onChange={e => setClinic({ ...clinic, gst_number: e.target.value })} placeholder="Optional" />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>REGISTRATION NO.</label>
            <input className="form-control" value={clinic.registration_number} onChange={e => setClinic({ ...clinic, registration_number: e.target.value })} placeholder="Optional" />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>FULL ADDRESS</label>
            <textarea className="form-control" rows={2} value={clinic.address} onChange={e => setClinic({ ...clinic, address: e.target.value })} />
          </div>
        </div>
        <div className="mt-3">
          <FeedbackMsg text={clinicMsg.text} ok={clinicMsg.ok} />
          <SaveBtn onClick={saveClinic} saving={clinicSaving} />
        </div>
      </SectionCard>

      {/* ── Working Hours ── */}
      <SectionCard title="Working Hours" subtitle="Set clinic operating hours">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>MON – FRI OPEN</label>
            <input className="form-control" type="time" value={hours.mon_fri_open} onChange={e => setHours({ ...hours, mon_fri_open: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>MON – FRI CLOSE</label>
            <input className="form-control" type="time" value={hours.mon_fri_close} onChange={e => setHours({ ...hours, mon_fri_close: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>SATURDAY OPEN</label>
            <input className="form-control" type="time" value={hours.sat_open} onChange={e => setHours({ ...hours, sat_open: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>SATURDAY CLOSE</label>
            <input className="form-control" type="time" value={hours.sat_close} onChange={e => setHours({ ...hours, sat_close: e.target.value })} />
          </div>
          <div className="col-12">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="sunClosed" checked={hours.sunday_closed} onChange={e => setHours({ ...hours, sunday_closed: e.target.checked })} />
              <label className="form-check-label" htmlFor="sunClosed" style={{ fontSize: 13 }}>Clinic is closed on Sundays</label>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <FeedbackMsg text={hoursMsg.text} ok={hoursMsg.ok} />
          <SaveBtn onClick={saveHours} saving={hoursSaving} />
        </div>
      </SectionCard>

      {/* ── Change Password ── */}
      <SectionCard title="Change Password" subtitle="Update your admin account password">
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>CURRENT PASSWORD</label>
            <input className="form-control" type="password" value={pw.current_password} onChange={e => setPw({ ...pw, current_password: e.target.value })} placeholder="Enter current password" />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>NEW PASSWORD</label>
            <input className="form-control" type="password" value={pw.new_password} onChange={e => setPw({ ...pw, new_password: e.target.value })} placeholder="Min 8 characters" />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold text-muted" style={{ fontSize: 11 }}>CONFIRM NEW PASSWORD</label>
            <input className="form-control" type="password" value={pw.confirm_password} onChange={e => setPw({ ...pw, confirm_password: e.target.value })} placeholder="Repeat new password" />
          </div>
        </div>
        <div className="mt-3">
          <FeedbackMsg text={pwMsg.text} ok={pwMsg.ok} />
          <SaveBtn onClick={savePassword} saving={pwSaving} label="Update Password" />
        </div>
      </SectionCard>

      {/* ── Notifications ── */}
      <SectionCard title="Notification Preferences" subtitle="Choose which alerts you receive">
        <ToggleRow label="Appointment reminders"       desc="Remind admin of upcoming appointments"         checked={notifs.appointment_reminders} onChange={v => setNotifs({ ...notifs, appointment_reminders: v })} />
        <ToggleRow label="New patient registration"    desc="Alert when a new patient is added"             checked={notifs.new_patient_alert}     onChange={v => setNotifs({ ...notifs, new_patient_alert: v })} />
        <ToggleRow label="Billing reminders"           desc="Unpaid bill notifications"                     checked={notifs.billing_reminders}     onChange={v => setNotifs({ ...notifs, billing_reminders: v })} />
        <ToggleRow label="Daily appointment summary"   desc="End-of-day summary email"                     checked={notifs.daily_summary}         onChange={v => setNotifs({ ...notifs, daily_summary: v })} />
        <ToggleRow label="SMS alerts"                  desc="Send critical alerts via SMS"                  checked={notifs.sms_alerts}            onChange={v => setNotifs({ ...notifs, sms_alerts: v })} />
        <ToggleRow label="Weekly email reports"        desc="Performance report every Monday"               checked={notifs.email_reports}         onChange={v => setNotifs({ ...notifs, email_reports: v })} />
        <div className="mt-3">
          <FeedbackMsg text={notifMsg.text} ok={notifMsg.ok} />
          <SaveBtn onClick={saveNotifs} saving={notifSaving} label="Save Preferences" />
        </div>
      </SectionCard>

      {/* ── Danger Zone ── */}
      <SectionCard title="Danger Zone" subtitle="Irreversible actions — proceed with caution">
        <div className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded-3 gap-3" style={{ background: "#FFF8F8", border: "1px solid #FCEBEB" }}>
          <div>
            <div className="fw-bold" style={{ fontSize: 13, color: "#0A1628" }}>Clear all appointment records</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Permanently delete all appointment data. This cannot be undone.</div>
          </div>
          <button className="btn btn-outline-danger btn-sm fw-bold">Clear Data</button>
        </div>
      </SectionCard>

    </div>
  );
}