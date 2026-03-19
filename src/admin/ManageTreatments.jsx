/**
 * Treatments.jsx
 * src/pages/Treatments.jsx
 */

import { useState, useEffect } from "react";
import { BSModal, DeleteModal, Field, PageHeader, Loading, EmptyState, MiniStat, apiFetch } from "../components/helpers";

const CATEGORIES  = ["General","Orthodontics","Endodontics","Periodontics","Prosthodontics","Oral Surgery","Cosmetic","Pediatric"];
const CAT_BADGE   = { General:"text-bg-info", Orthodontics:"text-bg-primary", Endodontics:"text-bg-warning", Periodontics:"text-bg-success", Prosthodontics:"text-bg-danger", "Oral Surgery":"text-bg-secondary", Cosmetic:"text-bg-warning", Pediatric:"text-bg-success" };
const EMPTY_FORM  = { treatment_id: null, name: "", category: "General", description: "", duration_minutes: "", price: "", is_active: 1 };

export default function Treatments() {
  const [items,      setItems]      = useState([]);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("All");
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
      const json = await apiFetch("treatments.php?action=all");
      if (json.status) setItems(json.data || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setError(""); setModalOpen(true); };
  const openEdit = (t) => { setForm({ ...t }); setError(""); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Treatment name is required");
    if (!form.price)       return setError("Price is required");
    setSubmitting(true); setError("");
    try {
      const isEdit = !!form.treatment_id;
      const json = await apiFetch(`treatments.php?action=${isEdit ? "update" : "add"}`, {
        method: isEdit ? "PUT" : "POST", body: form,
      });
      if (json.status) { setModalOpen(false); setSuccess(isEdit ? "Treatment updated!" : "Treatment added!"); load(); setTimeout(() => setSuccess(""), 3000); }
      else setError(json.message || "Something went wrong");
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    try {
      const json = await apiFetch("treatments.php?action=delete", { method: "DELETE", body: { treatment_id: deleteId } });
      if (json.status) { setDeleteId(null); load(); }
    } catch {}
  };

  const toggleActive = async (t) => {
    try {
      await apiFetch("treatments.php?action=toggle_status", { method: "PUT", body: { treatment_id: t.treatment_id, is_active: t.is_active ? 0 : 1 } });
      load();
    } catch {}
  };

  const filtered = items.filter(t =>
    (catFilter === "All" || t.category === catFilter) &&
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const active  = items.filter(i => i.is_active).length;
  const avgPrice = items.length ? Math.round(items.reduce((s, i) => s + parseFloat(i.price || 0), 0) / items.length) : 0;

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <PageHeader title="Treatments" subtitle={`${filtered.length} treatment${filtered.length !== 1 ? "s" : ""}`}>
        <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 170, fontSize: 13 }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="form-control" placeholder="Search treatments..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200, fontSize: 13 }} />
        <button className="btn fw-bold text-white" style={{ background: "#1D9E75", borderRadius: 10 }} onClick={openAdd}>+ Add Treatment</button>
      </PageHeader>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4"><MiniStat label="Total Treatments" value={items.length}  accent="#1D9E75" /></div>
        <div className="col-6 col-md-4"><MiniStat label="Active"           value={active}        accent="#378ADD" /></div>
        <div className="col-12 col-md-4"><MiniStat label="Avg Price"       value={"₹" + avgPrice} accent="#7F77DD" /></div>
      </div>

      {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: 13 }}>{success}</div>}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="No treatments found." /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {["Treatment","Category","Duration","Price (₹)","Status","Actions"].map(h => (
                      <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.treatment_id}>
                      <td className="px-4">
                        <div className="fw-semibold" style={{ fontSize: 13 }}>{t.name}</div>
                        {t.description && <div className="text-muted text-truncate" style={{ fontSize: 11, maxWidth: 200 }}>{t.description}</div>}
                      </td>
                      <td className="px-4"><span className={`badge ${CAT_BADGE[t.category] || "text-bg-secondary"}`} style={{ fontSize: 11 }}>{t.category}</span></td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{t.duration_minutes ? `${t.duration_minutes} min` : "—"}</td>
                      <td className="px-4 fw-bold" style={{ fontSize: 13 }}>₹{parseFloat(t.price).toLocaleString("en-IN")}</td>
                      <td className="px-4">
                        <div className="form-check form-switch mb-0">
                          <input className="form-check-input" type="checkbox" checked={!!t.is_active}
                            onChange={() => toggleActive(t)} style={{ cursor: "pointer", width: 36, height: 20 }} />
                          <label className="form-check-label text-muted" style={{ fontSize: 12 }}>{t.is_active ? "Active" : "Inactive"}</label>
                        </div>
                      </td>
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm fw-bold" style={{ background: "#E6F1FB", color: "#042C53", fontSize: 11 }} onClick={() => openEdit(t)}>Edit</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#FCEBEB", color: "#501313", fontSize: 11 }} onClick={() => setDeleteId(t.treatment_id)}>Delete</button>
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
      <BSModal open={modalOpen} title={form.treatment_id ? "Edit Treatment" : "Add Treatment"} onClose={() => setModalOpen(false)}>
        <div className="row g-3">
          <div className="col-12"><Field label="Treatment Name"><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Root Canal Treatment" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Category"><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field></div>
          <div className="col-12 col-md-6"><Field label="Duration (mins)"><input className="form-control" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} placeholder="e.g. 60" /></Field></div>
          <div className="col-12"><Field label="Price (₹)"><input className="form-control" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 2500" /></Field></div>
          <div className="col-12"><Field label="Description"><textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." /></Field></div>
        </div>
        {error && <div className="alert alert-danger py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>{error}</div>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-light fw-semibold" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Treatment"}
          </button>
        </div>
      </BSModal>

      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}