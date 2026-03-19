/**
 * helpers.jsx
 * src/components/helpers.jsx
 *
 * Shared Bootstrap components used across all pages.
 * Import from here to keep pages DRY.
 */

/* ── Bootstrap Modal (React-controlled) ── */
export function BSModal({ open, title, onClose, size = "", children }) {
  if (!open) return null;
  return (
    <>
      <div className={`modal fade show d-block`} tabIndex="-1" onClick={onClose}>
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`} onClick={e => e.stopPropagation()}>
          <div className="modal-content border-0 shadow" style={{ borderRadius: 18 }}>
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <h5 className="modal-title fw-bold" style={{ color: "#0A1628", fontSize: 16 }}>{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body px-4 pb-4">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

/* ── Delete Confirm Modal ── */
export function DeleteModal({ open, onClose, onConfirm, message = "Are you sure you want to delete this record? This action cannot be undone." }) {
  return (
    <BSModal open={open} title="Confirm Delete" onClose={onClose}>
      <p className="text-muted mb-4" style={{ fontSize: 14 }}>{message}</p>
      <div className="d-flex gap-2 justify-content-end">
        <button className="btn btn-light fw-semibold" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger fw-bold" onClick={onConfirm}>Yes, Delete</button>
      </div>
    </BSModal>
  );
}

/* ── Avatar circle with initials ── */
export function Avatar({ name = "", size = 32 }) {
  const ini = name.replace("Dr. ", "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const palettes = [["#E1F5EE","#085041"],["#FAEEDA","#633806"],["#E6F1FB","#042C53"],["#EEEDFE","#3C3489"]];
  const [bg, color] = palettes[(name.charCodeAt(0) || 0) % palettes.length];
  return (
    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
      style={{ width: size, height: size, background: bg, color, fontSize: size * 0.35, fontWeight: 700 }}>
      {ini}
    </div>
  );
}

/* ── Form Field wrapper ── */
export function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-bold text-muted" style={{ fontSize: 11, letterSpacing: ".4px" }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

/* ── Page Header ── */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h4 className="fw-bold mb-1" style={{ color: "#0A1628", letterSpacing: "-0.3px" }}>{title}</h4>
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>{subtitle}</p>
      </div>
      <div className="d-flex gap-2 flex-wrap">{children}</div>
    </div>
  );
}

/* ── Stat card for summary rows ── */
export function MiniStat({ label, value, accent }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, borderLeft: `3px solid ${accent}` }}>
      <div className="card-body p-3" style={{ borderLeft: `3px solid ${accent}`, borderRadius: 14 }}>
        <p className="text-muted mb-1 fw-bold" style={{ fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{label}</p>
        <h4 className="mb-0 fw-bold" style={{ color: "#0A1628" }}>{value}</h4>
      </div>
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ message = "No records found." }) {
  return (
    <div className="text-center py-5 text-muted">
      <div style={{ fontSize: 36, marginBottom: 8 }}>🦷</div>
      <p className="mb-0">{message}</p>
    </div>
  );
}

/* ── Loading spinner ── */
export function Loading() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: "#1D9E75" }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

/* ── API helper ── */
export const BASE_URL = "http://localhost/your-project/api";

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
}