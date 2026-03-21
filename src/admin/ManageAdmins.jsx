/**
 * ManageAdmins.jsx
 * src/pages/ManageAdmins.jsx
 */

import { useState, useEffect } from "react";
import { BSModal, DeleteModal, Avatar, Field, PageHeader, Loading, EmptyState, apiFetch, AlertModal } from "../components/helpers";

const ROLES        = ["admin", "superadmin", "moderator"];
const ROLE_BADGE   = { superadmin: "text-bg-primary", admin: "text-bg-success", moderator: "text-bg-info" };
const EMPTY_FORM   = { admin_id: null, name: "", email: "", password: "", role: "admin" };

export default function ManageAdmins() {
  const [admins,     setAdmins]     = useState([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch(`${process.env.REACT_APP_GET_ALL_ADMINS}`);
      if (json.status) setAdmins(json.data || []);
    } catch { setAdmins([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); };
  const openEdit = (a) => { setForm({ ...a, password: "" }); setError(""); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim())  return setError("Name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!form.admin_id && !form.password) return setError("Password is required for new admin");
    if (form.password && form.password.length < 6) return setError("Password must be at least 6 characters");
    setSubmitting(true); setError("");
    try {
      const isEdit = !!form.admin_id;
      const json = await apiFetch(`${isEdit ? `${process.env.REACT_APP_UPDATE_ADMIN_PROFILE}` : "create"}`, {
        method: isEdit ? "PUT" : "POST",
        body: isEdit ? { admin_id: form.admin_id, name: form.name, email: form.email }
                     : { name: form.name, email: form.email, password: form.password, role: form.role },
      });
      if (json.status) { setModalOpen(false); setSuccess(isEdit ? "Admin updated!" : "Admin added!"); load(); setTimeout(() => setSuccess(""), 3000); }
      else setError(json.message || "Something went wrong");
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    try {
      if (admins.length === 1) {
        setAlertOpen(true);
        setDeleteId(null);
      }
      const json = await apiFetch(`${process.env.delete_admin.php}`, { method: "DELETE", body: { admin_id: deleteId } });
      if (json.status) { setDeleteId(null); load(); }
    } catch {}
  };

  const filtered = admins.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <PageHeader title="Manage Admins" subtitle={`${filtered.length} admin${filtered.length !== 1 ? "s" : ""} found`}>
        <input className="form-control" placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, fontSize: 13 }} />
        <button className="btn fw-bold text-white" style={{ background: "#1D9E75", borderRadius: 10 }} onClick={openAdd}>
          + Add Admin
        </button>
      </PageHeader>

      {success && <div className="alert alert-success alert-dismissible py-2 px-3 mb-3" style={{ fontSize: 13 }}>{success}</div>}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="No admins found." /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {["Admin","Email","Role","Created At","Actions"].map(h => (
                      <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(admin => (
                    <tr key={admin.admin_id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={admin.name} />
                          <span className="fw-semibold" style={{ fontSize: 13 }}>{admin.name}</span>
                        </div>
                      </td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{admin.email}</td>
                      <td className="px-4">
                        <span className={`badge ${ROLE_BADGE[admin.role?.toLowerCase()] || "text-bg-secondary"}`} style={{ fontSize: 11, textTransform: "capitalize" }}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-4 text-muted" style={{ fontSize: 12 }}>
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm fw-bold" style={{ background: "#87bae9", color: "#042C53", fontSize: 11 }} onClick={() => openEdit(admin)}>Edit</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#f1b6b6", color: "#501313", fontSize: 11 }} onClick={() => setDeleteId(admin.admin_id)}>Delete</button>
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
      <BSModal open={modalOpen} title={form.admin_id ? "Edit Admin" : "Add Admin"} onClose={() => setModalOpen(false)}>
        <div className="row g-3">
          <div className="col-12">
            <Field label="Full Name">
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Mehta" />
            </Field>
          </div>
          <div className="col-12">
            <Field label="Email">
              <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. rahul@brightsmile.in" />
            </Field>
          </div>
          {!form.admin_id && (
            <>
              <div className="col-12">
                <Field label="Password">
                  <input className="form-control" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                </Field>
              </div>
              <div className="col-12">
                <Field label="Role">
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}
        </div>
        {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: 12 }}>{error}</div>}
        <div className="d-flex gap-2 justify-content-end mt-2">
          <button className="btn btn-light fw-semibold" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Admin"}
          </button>
        </div>
      </BSModal>

      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
       <AlertModal
        open={alertOpen}
        title="Warning"
        message="At least one admin must remain"
        type="danger"
        onClose={() => setAlertOpen(false)}
        />  
    </div>
  );
}