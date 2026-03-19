/**
 * Billing.jsx
 * src/pages/Billing.jsx
 */

import { useState, useEffect } from "react";
import { BSModal, DeleteModal, Avatar, Field, PageHeader, Loading, EmptyState, MiniStat, apiFetch } from "../components/helpers";

const PAY_STATUSES  = ["Paid","Unpaid","Partial"];
const STATUS_BADGE  = { Paid:"text-bg-success", Unpaid:"text-bg-danger", Partial:"text-bg-warning" };
const PAY_METHODS   = ["Cash","UPI","Card","Net Banking","Insurance"];
const EMPTY_FORM    = { bill_id: null, patient_name: "", doctor_name: "", treatment: "", bill_date: "", total_amount: "", paid_amount: "0", discount: "0", payment_method: "Cash", notes: "" };

function autoStatus(total, paid, discount) {
  const t = parseFloat(total || 0), p = parseFloat(paid || 0), d = parseFloat(discount || 0);
  const due = t - d - p;
  if (due <= 0) return "Paid";
  if (p > 0)    return "Partial";
  return "Unpaid";
}

function InvoiceOffcanvas({ bill, onClose }) {
  if (!bill) return null;
  const due = (parseFloat(bill.total_amount || 0) - parseFloat(bill.discount || 0) - parseFloat(bill.paid_amount || 0)).toFixed(2);
  return (
    <>
      <div className="offcanvas offcanvas-end show" style={{ width: 380, visibility: "visible" }}>
        <div className="offcanvas-header border-bottom px-4">
          <h6 className="offcanvas-title fw-bold" style={{ color: "#0A1628" }}>Invoice #{bill.bill_id}</h6>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>
        <div className="offcanvas-body px-4">
          <div className="p-3 rounded-3 mb-4" style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}>
            <div className="fw-bold" style={{ fontSize: 16, color: "#0A1628" }}>{bill.patient_name}</div>
            <div style={{ fontSize: 12, color: "#1D9E75" }}>{bill.doctor_name} · {bill.treatment}</div>
            <div style={{ fontSize: 11, color: "#6B7A8D" }}>{bill.bill_date}</div>
          </div>
          <div className="rounded-3 p-3 mb-4" style={{ background: "#F8FAFC" }}>
            {[["Total Amount","₹"+parseFloat(bill.total_amount).toLocaleString("en-IN")],
              ["Discount","₹"+(bill.discount||0)],
              ["Paid","₹"+parseFloat(bill.paid_amount||0).toLocaleString("en-IN")],
              ["Due","₹"+parseFloat(due).toLocaleString("en-IN")]
            ].map(([k, v], i, arr) => (
              <div key={k} className={`d-flex justify-content-between py-2 ${i < arr.length - 1 ? "border-bottom" : ""}`}>
                <span className="text-muted" style={{ fontSize: 13 }}>{k}</span>
                <span className="fw-bold" style={{ fontSize: 13, color: i === arr.length - 1 && parseFloat(due) > 0 ? "#E24B4A" : "#0A1628" }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-between mb-3">
            <span className="text-muted" style={{ fontSize: 12 }}>Payment Method</span>
            <span className="fw-semibold" style={{ fontSize: 13 }}>{bill.payment_method}</span>
          </div>
          <span className={`badge ${STATUS_BADGE[bill.payment_status] || "text-bg-secondary"}`}>{bill.payment_status}</span>
          {bill.notes && <p className="mt-3 p-2 rounded" style={{ fontSize: 12, color: "#6B7A8D", background: "#F8FAFC" }}>{bill.notes}</p>}
        </div>
      </div>
      <div className="offcanvas-backdrop fade show" onClick={onClose} />
    </>
  );
}

export default function Billing() {
  const [items,      setItems]      = useState([]);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("All");
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [viewBill,   setViewBill]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch("billing.php?action=all");
      if (json.status) setItems(json.data || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ ...EMPTY_FORM, bill_date: new Date().toISOString().split("T")[0] }); setError(""); setModalOpen(true); };
  const openEdit = (b) => { setForm({ ...b }); setError(""); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.patient_name.trim()) return setError("Patient name is required");
    if (!form.total_amount)        return setError("Total amount is required");
    const payload = { ...form, payment_status: autoStatus(form.total_amount, form.paid_amount, form.discount) };
    setSubmitting(true); setError("");
    try {
      const isEdit = !!form.bill_id;
      const json = await apiFetch(`billing.php?action=${isEdit ? "update" : "add"}`, {
        method: isEdit ? "PUT" : "POST", body: payload,
      });
      if (json.status) { setModalOpen(false); setSuccess(isEdit ? "Bill updated!" : "Bill added!"); load(); setTimeout(() => setSuccess(""), 3000); }
      else setError(json.message || "Something went wrong");
    } catch { setError("Network error"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    try {
      const json = await apiFetch("billing.php?action=delete", { method: "DELETE", body: { bill_id: deleteId } });
      if (json.status) { setDeleteId(null); load(); }
    } catch {}
  };

  const filtered = items.filter(b =>
    (filter === "All" || b.payment_status === filter) &&
    (b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
     b.treatment?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollected = items.reduce((s, i) => s + parseFloat(i.paid_amount || 0), 0);
  const totalDue       = items.filter(i => i.payment_status !== "Paid").reduce((s, i) => s + Math.max(0, parseFloat(i.total_amount || 0) - parseFloat(i.discount || 0) - parseFloat(i.paid_amount || 0)), 0);
  const unpaidCount    = items.filter(i => i.payment_status === "Unpaid").length;

  return (
    <div className="p-3 p-lg-4" style={{ minHeight: "100vh", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      <PageHeader title="Billing" subtitle={`${filtered.length} bill${filtered.length !== 1 ? "s" : ""}`}>
        <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 150, fontSize: 13 }}>
          <option value="All">All Status</option>
          {PAY_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <input className="form-control" placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200, fontSize: 13 }} />
        <button className="btn fw-bold text-white" style={{ background: "#1D9E75", borderRadius: 10 }} onClick={openAdd}>+ Add Bill</button>
      </PageHeader>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4"><MiniStat label="Total Collected" value={"₹"+Math.round(totalCollected).toLocaleString("en-IN")} accent="#1D9E75" /></div>
        <div className="col-12 col-md-4"><MiniStat label="Pending Due"     value={"₹"+Math.round(totalDue).toLocaleString("en-IN")}     accent="#E24B4A" /></div>
        <div className="col-12 col-md-4"><MiniStat label="Unpaid Bills"    value={unpaidCount}                                           accent="#D85A30" /></div>
      </div>

      {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: 13 }}>{success}</div>}

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="No bills found." /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {["Patient","Treatment","Date","Total (₹)","Paid (₹)","Status","Actions"].map(h => (
                      <th key={h} className="text-muted fw-bold border-0 px-4 py-3" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.bill_id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={b.patient_name} />
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 13 }}>{b.patient_name}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{b.doctor_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>{b.treatment || "—"}</td>
                      <td className="px-4 text-muted" style={{ fontSize: 12 }}>{b.bill_date}</td>
                      <td className="px-4 fw-bold" style={{ fontSize: 13 }}>₹{parseFloat(b.total_amount).toLocaleString("en-IN")}</td>
                      <td className="px-4 fw-semibold" style={{ fontSize: 13, color: "#1D9E75" }}>₹{parseFloat(b.paid_amount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4"><span className={`badge ${STATUS_BADGE[b.payment_status] || "text-bg-secondary"}`} style={{ fontSize: 11 }}>{b.payment_status}</span></td>
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm fw-bold" style={{ background: "#E1F5EE", color: "#085041", fontSize: 11 }} onClick={() => setViewBill(b)}>View</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#E6F1FB", color: "#042C53", fontSize: 11 }} onClick={() => openEdit(b)}>Edit</button>
                          <button className="btn btn-sm fw-bold" style={{ background: "#FCEBEB", color: "#501313", fontSize: 11 }} onClick={() => setDeleteId(b.bill_id)}>Delete</button>
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
      <BSModal open={modalOpen} title={form.bill_id ? "Edit Bill" : "Add Bill"} onClose={() => setModalOpen(false)} size="modal-lg">
        <div className="row g-3">
          <div className="col-12 col-md-6"><Field label="Patient Name"><input className="form-control" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} placeholder="e.g. Priya Sharma" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Doctor Name"><input className="form-control" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} placeholder="e.g. Dr. Mehta" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Treatment"><input className="form-control" value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} placeholder="e.g. Root Canal" /></Field></div>
          <div className="col-12 col-md-6"><Field label="Bill Date"><input className="form-control" type="date" value={form.bill_date} onChange={e => setForm({ ...form, bill_date: e.target.value })} /></Field></div>
          <div className="col-12 col-md-4"><Field label="Total Amount (₹)"><input className="form-control" type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} placeholder="2500" /></Field></div>
          <div className="col-12 col-md-4"><Field label="Discount (₹)"><input className="form-control" type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="0" /></Field></div>
          <div className="col-12 col-md-4"><Field label="Paid Amount (₹)"><input className="form-control" type="number" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} placeholder="0" /></Field></div>
          <div className="col-12"><Field label="Payment Method"><select className="form-select" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>{PAY_METHODS.map(m => <option key={m}>{m}</option>)}</select></Field></div>
          <div className="col-12"><Field label="Notes"><textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></Field></div>
        </div>
        {/* Live status preview */}
        {form.total_amount && (
          <div className="alert alert-info py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>
            Status will be auto-set to: <strong>{autoStatus(form.total_amount, form.paid_amount, form.discount)}</strong>
          </div>
        )}
        {error && <div className="alert alert-danger py-2 px-3 mt-2 mb-0" style={{ fontSize: 12 }}>{error}</div>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-light fw-semibold" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn fw-bold text-white" style={{ background: "#1D9E75" }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : "Save Bill"}
          </button>
        </div>
      </BSModal>

      <InvoiceOffcanvas bill={viewBill} onClose={() => setViewBill(null)} />
      <DeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}