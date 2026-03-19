/**
 * ManageDoctors.jsx
 * src/pages/ManageDoctors.jsx
 */

import { useState, useEffect } from "react";
import { BSModal, DeleteModal, Avatar, Field, PageHeader, Loading, EmptyState, apiFetch } from "../components/helpers";

const STATUSES      = ["Active", "Inactive", "On Leave"];
const STATUS_BADGE  = { Active: "text-bg-success", Inactive: "text-bg-danger", "On Leave": "text-bg-warning" };
const EMPTY_FORM    = { doctor_id: null, name: "", email: "", password: "", specialization: "", experience_years: "", qualification: "", consultation_fees: "", mobile: "" };

export default function ManageDoctors() {
  const [doctors,     setDoctors]     = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch("doctors.php?action=list");
      if (json.status) setDoctors(json.data || []);
    } catch { setDoctors([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); };
  const openEdit = (d) => { setForm({ ...d, password: "" }); setError(""); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim())           return setError("Name is required");
    if (!form.specialization.trim()) return setError("Specialization is required");
    if (!form.doctor_id) {
      if (!form.email.trim())    return setError("Email is required");
      if (!form.password.trim()) return setError("Password is required");
      if (form.password.length < 8) return setError("Password must be at least 8 characters");
    }
    setSubmitting(true); setError("");
    try {
      const isEdit = !!form.doctor_id;
      const json = await apiFetch(`doctors.php?action=${isEdit ? "update" : "add"}`, {
        method: isEdit ? "PUT" : "POST", body: form,
      });
      if (json.status) { setModalOpen(false); setSuccess(isEdit ? "Doctor updated!" : "Doctor added!"); load(); setTimeout(() => setSuccess(""), 3000); }
      else setError(json.message || "Something went wrong");
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    try {
      const json = await apiFetch("doctors.php?action=delete", { method: "DELETE", body: { doctor_id: deleteId } });
      if (json.status) { setDeleteId(null); load(); }
    } catch {}
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const json = await apiFetch("doctors.php?action=update_status", { method: "PUT", body: { doctor_id: statusModal.doctor_id, status: newStatus } });
      if (json.status) { setStatusModal(null); load(); }
    } catch {}
  };

  const filtered = doctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <PageHeader title="Manage Doctors" subtitle={`${filtered.length} doctor${filtered.length !== 1 ? "s" : ""} found`}>
        <input className="form-control" placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, fontSize: 13 }} />
        <button className="btn fw-bold text-white" style={{ background: "#1D9E75", borderRadius: 10 }} onClick={openAdd}>+ Add Doctor</button>
      </PageHeader>

      {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: 13 }}>{success}</div>}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="No doctors found." /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {["Doctor","Specialization","Experience","Fees (₹)","Mobile","Status","Actions"].map(h => (
                      <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr key={doc.doctor_id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={doc.name} />
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 13 }}>{doc.name}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{doc.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{doc.specialization}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{doc.experience_years ? `${doc.experience_years} yrs` : "—"}</td>
                      <td className="px-4 fw-bold" style={{ fontSize: 13 }}>₹{doc.consultation_fees}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 12, fontFamily: "monospace" }}>{doc.mobile || "—"}</td>
                      <td className="px-4">
                        <span
                          className={`badge ${STATUS_BADGE[doc.status] || "text-bg-secondary"}`}
                          style={{ fontSize: 11, cursor: "pointer" }}
                          onClick={() => setStatusModal({ doctor_id: doc.doctor_id, current: doc.status })}
                          title="Click to change"
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm fw-bold" style={{ background: "#E6F1FB", color: "#042C53", fontSize: 11 }} onClick={() => openEdit(doc)}>Edit</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#FCEBEB", color: "#501313", fontSize: 11 }} onClick={() => setDeleteId(doc.doctor_id)}>Delete</button>
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
      <BSModal open={modalOpen} title={form.doctor_id ? "Edit Doctor" : "Add Doctor"} onClose={() => setModalOpen(false)} size="modal-lg">
        <div className="row g-3">
          <div className="col-12 col-md-6"><Field label="Full Name"><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. Arjun Mehta" /></Field></div>
          {!form.doctor_id && (<>
            <div className="col-12 col-md-6"><Field label="Email"><input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. arjun@brightsmile.in" /></Field></div>
            <div className="col-12 col-md-6"><Field label="Password"><input className="form-control" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" /></Field></div>
          </>)}
          <div className="col-12 col-md-6"><Field label="Specialization"><input className="form-control" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Orthodontist" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Experience (years)"><input className="form-control" type="number" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} placeholder="e.g. 5" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Consultation Fee (₹)"><input className="form-control" type="number" value={form.consultation_fees} onChange={e => setForm({ ...form, consultation_fees: e.target.value })} placeholder="e.g. 500" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Mobile"><input className="form-control" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="+91 98765 43210" /></Field></div>
          <div className="col-12"><Field label="Qualification"><input className="form-control" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. BDS, MDS" /></Field></div>
        </div>
        {error && <div className="alert alert-danger py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>{error}</div>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-light fw-semibold" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Doctor"}
          </button>
        </div>
      </BSModal>

      {/* Status Change Modal */}
      <BSModal open={!!statusModal} title="Change Doctor Status" onClose={() => setStatusModal(null)}>
        <p className="text-muted mb-3" style={{ fontSize: 13 }}>Select a new status:</p>
        <div className="d-flex flex-column gap-2 mb-3">
          {STATUSES.map(s => {
            const isCurrent = statusModal?.current === s;
            const cls = STATUS_BADGE[s] || "text-bg-secondary";
            return (
              <button key={s} onClick={() => !isCurrent && handleStatusChange(s)}
                className={`btn d-flex justify-content-between align-items-center fw-bold`}
                style={{ background: isCurrent ? "#f0f0f0" : "", opacity: isCurrent ? .6 : 1, fontSize: 13 }}
                disabled={isCurrent}>
                <span>{s}</span>
                {isCurrent && <span className={`badge ${cls}`}>Current</span>}
              </button>
            );
          })}
        </div>
        <button className="btn btn-light w-100" onClick={() => setStatusModal(null)}>Cancel</button>
      </BSModal>

      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        message="Deleting a doctor will also remove their admin account. This cannot be undone." />
    </div>
  );
}