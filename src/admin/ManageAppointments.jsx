/**
 * Appointments.jsx
 * src/pages/Appointments.jsx
 */

import { useState, useEffect } from "react";
import { BSModal, DeleteModal, Avatar, Field, PageHeader, Loading, EmptyState, apiFetch } from "../components/helpers";

const STATUSES     = ["Pending","Confirmed","In Progress","Completed","Cancelled"];
// const STATUS_BADGE = { Pending:"text-bg-info", Confirmed:"text-bg-primary", "In Progress":"text-bg-warning", Completed:"text-bg-success", Cancelled:"text-bg-danger" };
const EMPTY_FORM   = { appointment_id: null, patient_name: "", doctor_name: "", appointment_date: "", appointment_time: "", treatment: "", notes: "", status: "Pending" };

export default function Appointments() {
  const [items,      setItems]      = useState([]);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("All");
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch("appointments.php?action=all");
      if (json.status) setItems(json.data || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ ...EMPTY_FORM, appointment_date: new Date().toISOString().split("T")[0] }); setError(""); setModalOpen(true); };
  const openEdit = (item) => { setForm({ ...item }); setError(""); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.patient_name.trim()) return setError("Patient name is required");
    if (!form.doctor_name.trim())  return setError("Doctor name is required");
    if (!form.appointment_date)    return setError("Date is required");
    if (!form.appointment_time)    return setError("Time is required");
    setSubmitting(true); setError("");
    try {
      const isEdit = !!form.appointment_id;
      const json = await apiFetch(`appointments.php?action=${isEdit ? "update" : "add"}`, {
        method: isEdit ? "PUT" : "POST", body: form,
      });
      if (json.status) { setModalOpen(false); setSuccess(isEdit ? "Appointment updated!" : "Appointment added!"); load(); setTimeout(() => setSuccess(""), 3000); }
      else setError(json.message || "Something went wrong");
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    try {
      const json = await apiFetch("appointments.php?action=delete", { method: "DELETE", body: { appointment_id: deleteId } });
      if (json.status) { setDeleteId(null); load(); }
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apiFetch("appointments.php?action=update_status", { method: "PUT", body: { appointment_id: id, status } });
      load();
    } catch {}
  };

  const filtered = items.filter(a =>
    (filter === "All" || a.status === filter) &&
    (a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
     a.doctor_name?.toLowerCase().includes(search.toLowerCase()))
  );

  // Summary counts
  const counts = STATUSES.reduce((acc, s) => { acc[s] = items.filter(i => i.status === s).length; return acc; }, {});

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <PageHeader title="Appointments" subtitle={`${filtered.length} appointment${filtered.length !== 1 ? "s" : ""}`}>
        <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 150, fontSize: 13 }}>
          <option value="All">All Status</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <input className="form-control" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200, fontSize: 13 }} />
        <button className="btn fw-bold text-white" style={{ background: "#1D9E75", borderRadius: 10 }} onClick={openAdd}>+ Add</button>
      </PageHeader>

      {/* Quick status tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {["All", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm fw-semibold ${filter === s ? "text-white" : "btn-light"}`}
            style={{ background: filter === s ? "#1D9E75" : "", fontSize: 12, borderRadius: 20, padding: "3px 14px" }}>
            {s} {s !== "All" && <span className="ms-1 opacity-75">({counts[s] || 0})</span>}
          </button>
        ))}
      </div>

      {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: 13 }}>{success}</div>}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="No appointments found." /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {["Patient","Doctor","Date","Time","Treatment","Status","Actions"].map(h => (
                      <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.appointment_id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={a.patient_name} />
                          <span className="fw-semibold" style={{ fontSize: 13 }}>{a.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-4 fw-semibold" style={{ fontSize: 13, color: "#1D9E75" }}>{a.doctor_name}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{a.appointment_date}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 12, fontFamily: "monospace" }}>{a.appointment_time}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{a.treatment || "—"}</td>
                      <td className="px-4">
                        <select
                          className="form-select form-select-sm fw-bold border-0"
                          value={a.status}
                          onChange={e => handleStatusChange(a.appointment_id, e.target.value)}
                          style={{ fontSize: 11, width: "auto", background: "transparent", cursor: "pointer" }}
                        >
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm fw-bold" style={{ background: "#E6F1FB", color: "#042C53", fontSize: 11 }} onClick={() => openEdit(a)}>Edit</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#FCEBEB", color: "#501313", fontSize: 11 }} onClick={() => setDeleteId(a.appointment_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <BSModal open={modalOpen} title={form.appointment_id ? "Edit Appointment" : "Add Appointment"} onClose={() => setModalOpen(false)} size="modal-lg">
        <div className="row g-3">
          <div className="col-12 col-md-6"><Field label="Patient Name"><input className="form-control" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} placeholder="e.g. Priya Sharma" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Doctor Name"><input className="form-control" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} placeholder="e.g. Dr. Mehta" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Date"><input className="form-control" type="date" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} /></Field></div>
          <div className="col-12 col-md-6"><Field label="Time"><input className="form-control" type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} /></Field></div>
          <div className="col-12 col-md-6"><Field label="Treatment"><input className="form-control" value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} placeholder="e.g. Root Canal" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Status"><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field></div>
          <div className="col-12"><Field label="Notes"><textarea className="form-control" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></Field></div>
        </div>
        {error && <div className="alert alert-danger py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>{error}</div>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-light fw-semibold" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save"}
          </button>
        </div>
      </BSModal>

      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}