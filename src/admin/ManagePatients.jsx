/**
 * Patients.jsx
 * src/pages/Patients.jsx
 */

import { useState, useEffect } from "react";
import { BSModal, DeleteModal, Avatar, Field, PageHeader, Loading, EmptyState, apiFetch } from "../components/helpers";

const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const GENDERS      = ["Male","Female","Other"];
const EMPTY_FORM   = { patient_id: null, name: "", email: "", mobile: "", dob: "", gender: "Male", blood_group: "", address: "", medical_history: "" };

function ProfileOffcanvas({ patient, onClose }) {
  if (!patient) return null;
  const rows = [
    ["Email", patient.email], ["Mobile", patient.mobile],
    ["Date of Birth", patient.dob], ["Gender", patient.gender],
    ["Blood Group", patient.blood_group], ["Address", patient.address],
    ["Medical History", patient.medical_history],
  ].filter(([, v]) => v);
  return (
    <>
      <div className="offcanvas offcanvas-end show" style={{ width: 360, visibility: "visible" }}>
        <div className="offcanvas-header border-bottom px-4">
          <h6 className="offcanvas-title fw-bold" style={{ color: "#0A1628" }}>Patient Profile</h6>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>
        <div className="offcanvas-body px-4">
          <div className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
            <Avatar name={patient.name} size={48} />
            <div>
              <div className="fw-bold" style={{ fontSize: 16, color: "#0A1628" }}>{patient.name}</div>
              <div style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>Patient #{patient.patient_id}</div>
            </div>
          </div>
          <table className="table table-sm">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td className="text-muted fw-semibold" style={{ fontSize: 12, width: "42%" }}>{k}</td>
                  <td style={{ fontSize: 13 }}>{k === "Blood Group" ? <span className="badge text-bg-warning">{v}</span> : v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="offcanvas-backdrop fade show" onClick={onClose} />
    </>
  );
}

export default function Patients() {
  const [items,       setItems]       = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteId,    setDeleteId]    = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch("patients.php?action=all");
      if (json.status) setItems(json.data || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); };
  const openEdit = (p) => { setForm({ ...p }); setError(""); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim())   return setError("Name is required");
    if (!form.mobile.trim()) return setError("Mobile is required");
    setSubmitting(true); setError("");
    try {
      const isEdit = !!form.patient_id;
      const json = await apiFetch(`patients.php?action=${isEdit ? "update" : "add"}`, {
        method: isEdit ? "PUT" : "POST", body: form,
      });
      if (json.status) { setModalOpen(false); setSuccess(isEdit ? "Patient updated!" : "Patient added!"); load(); setTimeout(() => setSuccess(""), 3000); }
      else setError(json.message || "Something went wrong");
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    try {
      const json = await apiFetch("patients.php?action=delete", { method: "DELETE", body: { patient_id: deleteId } });
      if (json.status) { setDeleteId(null); load(); }
    } catch {}
  };

  const filtered = items.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.mobile?.includes(search) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <PageHeader title="Patients" subtitle={`${filtered.length} patient${filtered.length !== 1 ? "s" : ""}`}>
        <input className="form-control" placeholder="Search by name / mobile..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240, fontSize: 13 }} />
        <button className="btn fw-bold text-white" style={{ background: "#1D9E75", borderRadius: 10 }} onClick={openAdd}>+ Add Patient</button>
      </PageHeader>

      {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: 13 }}>{success}</div>}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="No patients found." /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {["Patient","Mobile","Gender","Blood Group","DOB","Registered","Actions"].map(h => (
                      <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.patient_id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={p.name} />
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 13 }}>{p.name}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-muted" style={{ fontSize: 12, fontFamily: "monospace" }}>{p.mobile}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{p.gender || "—"}</td>
                      <td className="px-4">{p.blood_group ? <span className="badge text-bg-warning" style={{ fontSize: 11 }}>{p.blood_group}</span> : "—"}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 12 }}>{p.dob || "—"}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 12 }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm fw-bold" style={{ background: "#E1F5EE", color: "#085041", fontSize: 11 }} onClick={() => setViewPatient(p)}>View</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#E6F1FB", color: "#042C53", fontSize: 11 }} onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#FCEBEB", color: "#501313", fontSize: 11 }} onClick={() => setDeleteId(p.patient_id)}>Delete</button>
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
      <BSModal open={modalOpen} title={form.patient_id ? "Edit Patient" : "Add Patient"} onClose={() => setModalOpen(false)} size="modal-lg">
        <div className="row g-3">
          <div className="col-12 col-md-6"><Field label="Full Name"><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Sharma" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Mobile"><input className="form-control" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="+91 98765 43210" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Email"><input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. priya@email.com" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Date of Birth"><input className="form-control" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></Field></div>
          <div className="col-12 col-md-6"><Field label="Gender"><select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></Field></div>
          <div className="col-12 col-md-6"><Field label="Blood Group"><select className="form-select" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}><option value="">Select</option>{BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}</select></Field></div>
          <div className="col-12"><Field label="Address"><input className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, State" /></Field></div>
          <div className="col-12"><Field label="Medical History / Allergies"><textarea className="form-control" rows={3} value={form.medical_history} onChange={e => setForm({ ...form, medical_history: e.target.value })} placeholder="e.g. Diabetic, allergic to penicillin..." /></Field></div>
        </div>
        {error && <div className="alert alert-danger py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>{error}</div>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-light fw-semibold" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Patient"}
          </button>
        </div>
      </BSModal>

      <ProfileOffcanvas patient={viewPatient} onClose={() => setViewPatient(null)} />
      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        message="Are you sure? All appointment history for this patient may be affected." />
    </div>
  );
}