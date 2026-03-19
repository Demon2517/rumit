/**
 * ManageAssistants.jsx
 * src/pages/ManageAssistants.jsx
 */

import { useState, useEffect } from "react";
import { BSModal, DeleteModal, Avatar, Field, PageHeader, Loading, EmptyState, apiFetch } from "../components/helpers";

const STATUSES     = ["active", "inactive", "on_leave"];
const STATUS_LABEL = { active: "Active", inactive: "Inactive", on_leave: "On Leave" };
const STATUS_BADGE = { active: "text-bg-success", inactive: "text-bg-danger", on_leave: "text-bg-warning" };
const EMPTY_FORM   = { assistant_id: null, name: "", email: "", password: "", phone: "", specialization: "", experience: "", qualifications: "" };

export default function ManageAssistants() {
  const [assistants,  setAssistants]  = useState([]);
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
      const json = await apiFetch("assistants.php?action=list");
      if (json.status) setAssistants(json.data || []);
    } catch { setAssistants([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); };
  const openEdit = (a) => { setForm({ ...a, password: "" }); setError(""); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim())           return setError("Name is required");
    if (!form.phone.trim())          return setError("Phone is required");
    if (!form.specialization.trim()) return setError("Specialization is required");
    if (!form.assistant_id) {
      if (!form.email.trim())    return setError("Email is required");
      if (!form.password.trim()) return setError("Password is required");
      if (form.password.length < 8) return setError("Password must be at least 8 characters");
    }
    setSubmitting(true); setError("");
    try {
      const isEdit = !!form.assistant_id;
      const json = await apiFetch(`assistants.php?action=${isEdit ? "update" : "add"}`, {
        method: isEdit ? "PUT" : "POST", body: form,
      });
      if (json.status) { setModalOpen(false); setSuccess(isEdit ? "Assistant updated!" : "Assistant added!"); load(); setTimeout(() => setSuccess(""), 3000); }
      else setError(json.message || "Something went wrong");
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    try {
      const json = await apiFetch("assistants.php?action=delete", { method: "DELETE", body: { assistant_id: deleteId } });
      if (json.status) { setDeleteId(null); load(); }
    } catch {}
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const json = await apiFetch("assistants.php?action=update_status", { method: "PUT", body: { assistant_id: statusModal.assistant_id, status: newStatus } });
      if (json.status) { setStatusModal(null); load(); }
    } catch {}
  };

  const filtered = assistants.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search)
  );

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <PageHeader title="Manage Assistants" subtitle={`${filtered.length} assistant${filtered.length !== 1 ? "s" : ""} found`}>
        <input className="form-control" placeholder="Search assistants..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, fontSize: 13 }} />
        <button className="btn fw-bold text-white" style={{ background: "#1D9E75", borderRadius: 10 }} onClick={openAdd}>+ Add Assistant</button>
      </PageHeader>

      {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: 13 }}>{success}</div>}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="No assistants found." /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {["Assistant","Specialization","Phone","Experience","Qualifications","Status","Actions"].map(h => (
                      <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(asst => (
                    <tr key={asst.assistant_id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={asst.name} />
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 13 }}>{asst.name}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{asst.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{asst.specialization}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 12, fontFamily: "monospace" }}>{asst.phone}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{asst.experience || "—"}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{asst.qualifications || "—"}</td>
                      <td className="px-4">
                        <span
                          className={`badge ${STATUS_BADGE[asst.status] || "text-bg-secondary"}`}
                          style={{ fontSize: 11, cursor: "pointer" }}
                          onClick={() => setStatusModal({ assistant_id: asst.assistant_id, current: asst.status })}
                          title="Click to change"
                        >
                          {STATUS_LABEL[asst.status] || asst.status}
                        </span>
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm fw-bold" style={{ background: "#E6F1FB", color: "#042C53", fontSize: 11 }} onClick={() => openEdit(asst)}>Edit</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#FCEBEB", color: "#501313", fontSize: 11 }} onClick={() => setDeleteId(asst.assistant_id)}>Delete</button>
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
      <BSModal open={modalOpen} title={form.assistant_id ? "Edit Assistant" : "Add Assistant"} onClose={() => setModalOpen(false)} size="modal-lg">
        <div className="row g-3">
          <div className="col-12 col-md-6"><Field label="Full Name"><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Neha Sharma" /></Field></div>
          {!form.assistant_id && (<>
            <div className="col-12 col-md-6"><Field label="Email"><input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. neha@brightsmile.in" /></Field></div>
            <div className="col-12 col-md-6"><Field label="Password"><input className="form-control" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" /></Field></div>
          </>)}
          <div className="col-12 col-md-6"><Field label="Phone"><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Specialization"><input className="form-control" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Dental Hygiene" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Experience"><input className="form-control" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 3 years" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Qualifications"><input className="form-control" value={form.qualifications} onChange={e => setForm({ ...form, qualifications: e.target.value })} placeholder="e.g. BDH" /></Field></div>
        </div>
        {error && <div className="alert alert-danger py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>{error}</div>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-light fw-semibold" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Assistant"}
          </button>
        </div>
      </BSModal>

      {/* Status Modal */}
      <BSModal open={!!statusModal} title="Change Assistant Status" onClose={() => setStatusModal(null)}>
        <div className="d-flex flex-column gap-2 mb-3">
          {STATUSES.map(s => {
            const isCurrent = statusModal?.current === s;
            return (
              <button key={s} onClick={() => !isCurrent && handleStatusChange(s)}
                className="btn d-flex justify-content-between align-items-center fw-bold"
                style={{ background: isCurrent ? "#f0f0f0" : "#F8FAFC", opacity: isCurrent ? .6 : 1, fontSize: 13 }}
                disabled={isCurrent}>
                <span>{STATUS_LABEL[s]}</span>
                {isCurrent && <span className={`badge ${STATUS_BADGE[s]}`}>Current</span>}
              </button>
            );
          })}
        </div>
        <button className="btn btn-light w-100" onClick={() => setStatusModal(null)}>Cancel</button>
      </BSModal>

      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        message="Deleting an assistant will also remove their admin account. This cannot be undone." />
    </div>
  );
}