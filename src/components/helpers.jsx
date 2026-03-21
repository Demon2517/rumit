/**
 * helpers.jsx
 * src/components/helpers.jsx
 *
 * Shared Bootstrap components used across all pages.
 * Import from here to keep pages DRY.
 *
 * ── Confirm Dialog Usage ──────────────────────────────────────
 *
 * STEP 1 — Mount <ConfirmDialog /> once at the top level of your
 *           component (or in App.jsx):
 *
 *   import { ConfirmDialog, useConfirm } from "../components/helpers";
 *
 *   export default function MyPage() {
 *     const { confirmProps, confirm } = useConfirm();
 *     ...
 *     return (
 *       <>
 *         <ConfirmDialog {...confirmProps} />
 *         ...your page content...
 *       </>
 *     );
 *   }
 *
 * STEP 2 — Call confirm() anywhere — it returns a Promise<boolean>:
 *
 *   const handleLogout = async () => {
 *     const ok = await confirm({
 *       title:       "Logout",
 *       message:     "Are you sure you want to logout?",
 *       confirmText: "Yes, Logout",
 *       cancelText:  "Cancel",
 *       variant:     "danger",   // "danger" | "warning" | "primary" (default)
 *       icon:        "🚪",       // optional emoji shown above title
 *     });
 *     if (!ok) return;
 *     // proceed...
 *   };
 * ─────────────────────────────────────────────────────────────
 */


import { useState, useCallback, useRef } from "react";
 
/* ══════════════════════════════════════════════════
   useConfirm HOOK
   Returns { confirmProps, confirm }
   • confirmProps  → spread onto <ConfirmDialog {...confirmProps} />
   • confirm(opts) → returns Promise<boolean>
══════════════════════════════════════════════════ */
export function useConfirm() {
  const [state, setState] = useState({
    open:        false,
    title:       "Confirm",
    message:     "Are you sure?",
    confirmText: "Confirm",
    cancelText:  "Cancel",
    variant:     "primary",
    icon:        null,
  });
 
  // Store the resolve function of the current pending Promise
  const resolveRef = useRef(null);
 
  /**
   * confirm(opts) — call this instead of window.confirm()
   * Returns a Promise that resolves to true (confirmed) or false (cancelled).
   *
   * opts: {
   *   title?:       string   — dialog heading
   *   message?:     string   — body text
   *   confirmText?: string   — confirm button label
   *   cancelText?:  string   — cancel button label
   *   variant?:     "danger" | "warning" | "primary"
   *   icon?:        string   — emoji shown above title
   * }
   */
  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        open:        true,
        title:       opts.title       ?? "Confirm",
        message:     opts.message     ?? "Are you sure?",
        confirmText: opts.confirmText ?? "Confirm",
        cancelText:  opts.cancelText  ?? "Cancel",
        variant:     opts.variant     ?? "primary",
        icon:        opts.icon        ?? null,
      });
    });
  }, []);
 
  const handleConfirm = useCallback(() => {
    setState(s => ({ ...s, open: false }));
    resolveRef.current?.(true);
  }, []);
 
  const handleCancel = useCallback(() => {
    setState(s => ({ ...s, open: false }));
    resolveRef.current?.(false);
  }, []);
 
  return {
    confirm,
    confirmProps: { ...state, onConfirm: handleConfirm, onCancel: handleCancel },
  };
}
 
/* ══════════════════════════════════════════════════
   ConfirmDialog COMPONENT
   Spread confirmProps from useConfirm() onto this.
══════════════════════════════════════════════════ */
const VARIANT_CONFIG = {
  danger:  { btnCls: "btn-danger",             iconBg: "#FCEBEB", iconColor: "#E24B4A", headerColor: "#E24B4A" },
  warning: { btnCls: "btn-warning text-dark",  iconBg: "#FAEEDA", iconColor: "#BA7517", headerColor: "#BA7517" },
  primary: { btnCls: "btn-primary",            iconBg: "#E6F1FB", iconColor: "#378ADD", headerColor: "#0A1628" },
};
 
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  variant,
  icon,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
 
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.primary;
 
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(10, 22, 40, 0.55)",
          zIndex: 1055,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
          animation: "fadeIn .15s ease",
        }}
      >
        {/* Dialog box */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background:   "#fff",
            borderRadius: 20,
            width:        "100%",
            maxWidth:     420,
            boxShadow:    "0 20px 60px rgba(0,0,0,0.2)",
            overflow:     "hidden",
            animation:    "slideUp .18s ease",
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: 4, background: cfg.headerColor === "#0A1628" ? "#378ADD" : cfg.headerColor, borderRadius: "20px 20px 0 0" }} />
 
          <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
 
            {/* Icon */}
            {icon && (
              <div
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: cfg.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: "1rem",
                }}
              >
                {icon}
              </div>
            )}
 
            {/* Title */}
            <h5
              style={{
                fontSize: 17, fontWeight: 700,
                color: "#0A1628", margin: "0 0 .6rem",
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </h5>
 
            {/* Message */}
            <p style={{ fontSize: 14, color: "#6B7A8D", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
              {message}
            </p>
 
            {/* Divider */}
            <div style={{ height: 1, background: "#F0F4F8", margin: "0 0 1.25rem" }} />
 
            {/* Buttons */}
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-light fw-semibold px-4"
                style={{ borderRadius: 10, fontSize: 13 }}
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button
                className={`btn ${cfg.btnCls} fw-bold px-4`}
                style={{ borderRadius: 10, fontSize: 13 }}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
 
          </div>
        </div>
      </div>
 
      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </>
  );
}

/* ── Bootstrap Modal (React-controlled) ── */
export function BSModal({ open, title, onClose, size = "", children }) {
  if (!open) return null;
  return (
    <>
      <div className={`modal fade show d-block`} tabIndex="-1" onClick={onClose}>
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`} onClick={e => e.stopPropagation()}>
          <div className="modal-content border-0 shadow" style={{ borderRadius: 18 }}>
            <div className="modal-header border-0 pb-0 px-4 pt-4 hover">
              <h5 className="modal-title fw-bold" style={{ color: "#0A1628", fontSize: 16 , }}>{title}</h5>
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

/* ── Alert Dialog Box ── */
export function AlertModal({ open, title = "Alert", message, onClose, type = "warning" }) {
  if (!open) return null;
  const colors = {
    success: "#1D9E75",
    danger: "#dc3545",
    warning: "#f59e0b",
    info: "#0d6efd",
  };
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" onClick={onClose}>
        <div
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content border-0 shadow"
            style={{ borderRadius: 18 }}
          >
            {/* Header */}
            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <h5
                className="modal-title fw-bold"
                style={{ color: "#0A1628", fontSize: 16 }}
              >
                {title}
              </h5>
              <button className="btn-close" onClick={onClose} />
            </div>

            {/* Body */}
            <div className="modal-body px-4 text-center">
              <div
                style={{
                  fontSize: 14,
                  color: "#555",
                  marginBottom: 15,
                }}
              >
                {message}
              </div>
            </div>

            {/* Footer */}
            <div className="d-flex justify-content-center pb-4">
              <button
                className="btn fw-bold text-white px-4"
                style={{
                  background: colors[type],
                  borderRadius: 10,
                }}
                onClick={onClose}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Backdrop */}
      <div className="modal-backdrop fade show" />
    </>
  );
}

/* ── Confirm Dialog Box ── */
export function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" onClick={onCancel}>
        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
          <div className="modal-content border-0 shadow" style={{ borderRadius: 18 }}>
            <div className="modal-body text-center p-4">
              <p style={{ fontSize: 14 }}>{message}</p>

              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-light" onClick={onCancel}>Cancel</button>
                <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

/* ── API helper ── */
export const BASE_URL = `${process.env.REACT_APP_API_URL}`;

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
}