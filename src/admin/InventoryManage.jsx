/**
 * InventoryManage.jsx
 * src/admin/InventoryManage.jsx
 *
 * BUGS FIXED:
 *  1. trim() on undefined  → openEdit() now sanitises every field with ?? ""
 *     so no field is ever undefined/null when the modal opens
 *  2. Missing key props     → every list render has explicit key={}
 *  3. Fields not showing   → form values guaranteed to be strings, never null
 *
 * Table columns used:
 *   suppliers   → supplier_id | name | mobile | email | address | created_at
 *   stock_items → item_id | item_name | category | unit | current_stock | minimum_stock | expiry_date
 *
 * .env keys needed:
 *   REACT_APP_GET_SUPPLIERS    REACT_APP_ADD_SUPPLIER
 *   REACT_APP_UPDATE_SUPPLIER  REACT_APP_DELETE_SUPPLIER
 *   REACT_APP_GET_ITEMS        REACT_APP_ADD_ITEM
 *   REACT_APP_UPDATE_ITEM     REACT_APP_DELETE_ITEM
 */

import { useState, useEffect } from "react";
import {
  BSModal,
  DeleteModal,
  Avatar,
  Field,
  Loading,
  EmptyState,
  MiniStat,
  apiFetch,
  AlertModal,
} from "../components/helpers";

/* ─────────────── shared constants ─────────────── */

const STOCK_CATEGORIES = [
  "Consumables",
  "Instruments",
  "Medicines",
  "Anesthesia",
  "Orthodontic",
  "Radiology",
  "Sterilization",
  "Lab Materials",
  "Other",
];

const UNITS = [
  "pcs",
  "box",
  "pack",
  "bottle",
  "vial",
  "roll",
  "pair",
  "set",
  "kg",
  "g",
  "ml",
  "L",
];

const CAT_BADGE = {
  Consumables: "text-bg-primary",
  Instruments: "text-bg-secondary",
  Medicines: "text-bg-success",
  Anesthesia: "text-bg-warning",
  Orthodontic: "text-bg-info",
  Radiology: "text-bg-danger",
  Sterilization: "text-bg-dark",
  "Lab Materials": "text-bg-warning",
  Other: "text-bg-secondary",
};

/* ─────────────── safe string helper ───────────────
   Converts null / undefined / number → string ""
   so .trim() never throws "Cannot read properties of undefined"
─────────────────────────────────────────────────── */
const s = (v) => (v == null ? "" : String(v));

/* ═══════════════════════════════════════════════════════
   VALIDATION ENGINE
   Each rule returns "" (pass) or an error string (fail).
   validateAll() runs every rule and returns { field: msg }.
   fieldError() picks the message for one field so the
   input can show a red border + inline hint.
═══════════════════════════════════════════════════════ */

const RULES = {
  /* ── Supplier fields ──────────────────────────────── */

  // name: letters, numbers, spaces, &, ., -, ' — no special chars
  supplier_name: (v) => {
    if (!v.trim()) return "Supplier name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    if (v.trim().length > 150) return "Name must be under 150 characters";
    if (!/^[a-zA-Z0-9 &.\-']+$/.test(v.trim()))
      return "Name contains invalid characters";
    return "";
  },

  // Indian mobile: optional +91 / 0 prefix, then 10 digits starting with 6-9
  mobile: (v) => {
    if (!v.trim()) return "Mobile number is required";
    const digits = v.replace(/[\s\-().+]/g, "");
    // strip country code if present
    const local =
      digits.startsWith("91") && digits.length === 12
        ? digits.slice(2)
        : digits.startsWith("0") && digits.length === 11
          ? digits.slice(1)
          : digits;
    if (!/^[6-9]\d{9}$/.test(local))
      return "Enter a valid 10-digit Indian mobile number (starts with 6–9)";
    return "";
  },

  // email: standard format, lowercase enforced on save
  email: (v) => {
    if (!v.trim()) return ""; // optional field
    if (v !== v.toLowerCase()) return "Email must be in lowercase";
    if (!/^[a-zA-Z0-9()\-/.,\s-]+$/.test(v.trim()))
      return "Enter a valid email (e.g. name@domain.com)";
    if (v.trim().length > 100) return "Email must be under 100 characters";
    return "";
  },

  // address: free text, reasonable length
  address: (v) => {
    if (!v.trim()) return ""; // optional field
    if (v.trim().length < 5) return "Address is too short (min 5 characters)";
    if (v.trim().length > 300) return "Address must be under 300 characters";
    return "";
  },

  /* ── Stock item fields ────────────────────────────── */

  // item_name: letters, numbers, spaces, (), -, /
  item_name: (v) => {
    if (!v.trim()) return "Item name is required";
    if (v.trim().length < 2) return "Item name must be at least 2 characters";
    if (v.trim().length > 150) return "Item name must be under 150 characters";
    if (!/^[a-zA-Z0-9()\-/.,\s-]+$/.test(v.trim()))
      return "Item name contains invalid characters";
    return "";
  },

  // current_stock: whole number ≥ 0
  current_stock: (v) => {
    if (v === "" || v === null) return "Current stock is required";
    if (!/^\d+$/.test(String(v)))
      return "Stock must be a whole number (0 or more)";
    if (parseInt(v, 10) < 0) return "Stock cannot be negative";
    if (parseInt(v, 10) > 999999) return "Stock value is unrealistically large";
    return "";
  },

  // minimum_stock: whole number ≥ 0
  minimum_stock: (v) => {
    if (v === "" || v === null) return ""; // optional
    if (!/^\d+$/.test(String(v))) return "Minimum stock must be a whole number";
    if (parseInt(v, 10) < 0) return "Minimum stock cannot be negative";
    if (parseInt(v, 10) > 999999)
      return "Minimum stock value is unrealistically large";
    return "";
  },

  // expiry_date: must be today or in the future
  expiry_date: (v) => {
    if (!v) return ""; // optional
    const chosen = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(chosen.getTime())) return "Invalid date format";
    if (chosen < today) return "Expiry date cannot be in the past";
    return "";
  },
};

/* run a set of rules, return { fieldName: errorMsg } for failing ones */
function validateAll(rules) {
  const errors = {};
  for (const [field, fn] of Object.entries(rules)) {
    const msg = fn();
    if (msg) errors[field] = msg;
  }
  return errors; // empty object = all pass
}

/* helper — red border class when a field has an error */
const fieldCls = (errs, key) => `form-control${errs[key] ? " is-invalid" : ""}`;
const selectCls = (errs, key) => `form-select${errs[key] ? " is-invalid" : ""}`;

/* inline error hint rendered below an input */
const ErrMsg = ({ errs, field }) =>
  errs[field] ? (
    <div className="invalid-feedback d-block" style={{ fontSize: 11 }}>
      {errs[field]}
    </div>
  ) : null;

/* ═══════════════════════════════════════════════════════
   TAB 1 — SUPPLIERS
   DB: supplier_id | name | mobile | email | address | created_at
═══════════════════════════════════════════════════════ */

const EMPTY_SUPPLIER = {
  supplier_id: null,
  name: "",
  mobile: "",
  email: "",
  address: "",
};

/* sanitise a row from the API before putting it into state
   so every field is a plain string — never null/undefined     */
const toSupplierForm = (row) => ({
  supplier_id: row.supplier_id ?? null,
  name: s(row.name),
  mobile: s(row.mobile),
  email: s(row.email),
  address: s(row.address),
});

function SuppliersTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* ── load ── */
  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch(`${process.env.REACT_APP_GET_SUPPLIERS}`);
      if (json.status) setItems(json.data || []);
      else setItems([]);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  // Guard: only load once on mount, never on re-renders
  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const json = await apiFetch(`${process.env.REACT_APP_GET_SUPPLIERS}`);
        if (active && json.status) setItems(json.data || []);
        else if (active) setItems([]);
      } catch {
        if (active) setItems([]);
      }
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; }; // cleanup: ignore response if unmounted
  }, []);

  /* FIX: sanitise every field with toSupplierForm() so trim() never fails */
  const openAdd = () => {
    setForm(EMPTY_SUPPLIER);
    setError("");
    setFieldErrors({});
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setForm(toSupplierForm(row));
    setError("");
    setFieldErrors({});
    setModalOpen(true);
  };

  /* live validation — runs on every keystroke so the red hint disappears immediately */
  const validate = (f = form) =>
    validateAll({
      supplier_name: () => RULES.supplier_name(f.name),
      mobile: () => RULES.mobile(f.mobile),
      email: () => RULES.email(f.email),
      address: () => RULES.address(f.address),
    });

  /* field change helper — updates form AND clears that field's error live */
  const change = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    // re-run only the rule for this field so other errors are not wiped
    const rule = key === "name" ? "supplier_name" : key;
    if (RULES[rule]) {
      setFieldErrors((prev) => ({ ...prev, [rule]: RULES[rule](val) }));
    }
  };

  /* ── handleSubmit with full validation ── */
  const handleSubmit = async () => {
    if (submitting) return; // guard: prevent double-submit

    // Hard-block: never allow submit with empty required fields
    if (!form.name.trim() || !form.mobile.trim()) {
      const errs = validate();
      setFieldErrors(errs);
      setError("Please fix the errors above before saving.");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Please fix the errors above before saving.");
      return;
    }

    setSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      const isEdit = !!form.supplier_id;
      const json = await apiFetch(
        `${isEdit ? process.env.REACT_APP_UPDATE_SUPPLIER : process.env.REACT_APP_ADD_SUPPLIER}`,
        {
          method: isEdit ? "PUT" : "POST",
          body: {
            ...(isEdit && { supplier_id: form.supplier_id }),
            name: form.name.trim(),
            mobile: form.mobile.trim(),
            email: form.email.trim().toLowerCase(), // always saved lowercase
            address: form.address.trim(),
          },
        },
      );
      if (json.status) {
        setModalOpen(false);
        setSuccess(isEdit ? "Supplier updated!" : "Supplier added!");
        load();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(json.message || "Something went wrong");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  /* ── handleDelete ── */
  const handleDelete = async () => {
    try {
      const json = await apiFetch(`${process.env.REACT_APP_DELETE_SUPPLIER}`, {
        method: "DELETE",
        body: { supplier_id: deleteId },
      });
      if (json.status) {
        setDeleteId(null);
        load();
      } else {
        setAlertMsg(json.message || "Could not delete supplier");
        setAlertOpen(true);
        setDeleteId(null);
      }
    } catch {
      setDeleteId(null);
    }
  };

  const filtered = items.filter(
    (row) =>
      s(row.name).toLowerCase().includes(search.toLowerCase()) ||
      s(row.mobile).includes(search) ||
      s(row.email).toLowerCase().includes(search.toLowerCase()),
  );

  /* ── render ── */
  return (
    <>
      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <MiniStat
            label="Total Suppliers"
            value={items.length}
            accent="#1D9E75"
          />
        </div>
        <div className="col-6 col-md-4">
          <MiniStat label="Showing" value={filtered.length} accent="#378ADD" />
        </div>
        <div className="col-12 col-md-4">
          <MiniStat
            label="Search Results"
            value={search ? filtered.length : items.length}
            accent="#7F77DD"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between">
        <input
          className="form-control"
          placeholder="Search by name, mobile or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, fontSize: 13 }}
        />
        <button
          className="btn fw-bold text-white"
          style={{ background: "#1D9E75", borderRadius: 10 }}
          onClick={openAdd}
        >
          + Add Supplier
        </button>
      </div>

      {success && (
        <div
          className="alert alert-success py-2 px-3 mb-3"
          style={{ fontSize: 13 }}
        >
          {success}
        </div>
      )}

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState message="No suppliers found." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {/* FIX: key on every header cell */}
                    {[
                      "Supplier",
                      "Mobile",
                      "Email",
                      "Address",
                      "Created At",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-muted fw-bold border-0 px-4 py-3"
                        style={{
                          fontSize: 10,
                          letterSpacing: ".6px",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    /* FIX: key uses supplier_id */
                    <tr key={row.supplier_id}>
                      {/* name */}
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={s(row.name) || "?"} />
                          <span
                            className="fw-semibold"
                            style={{ fontSize: 13 }}
                          >
                            {s(row.name) || "—"}
                          </span>
                        </div>
                      </td>

                      {/* mobile */}
                      <td
                        className="px-4"
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#6B7A8D",
                        }}
                      >
                        {s(row.mobile) || "—"}
                      </td>

                      {/* email */}
                      <td className="px-4 text-muted" style={{ fontSize: 13 }}>
                        {s(row.email) || "—"}
                      </td>

                      {/* address */}
                      <td
                        className="px-4 text-muted"
                        style={{
                          fontSize: 12,
                          maxWidth: 180,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s(row.address) || "—"}
                      </td>

                      {/* created_at */}
                      <td className="px-4 text-muted" style={{ fontSize: 12 }}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      {/* actions */}
                      <td className="px-4">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm fw-bold"
                            style={{
                              background: "#87bae9",
                              color: "#042C53",
                              fontSize: 11,
                            }}
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm fw-bold"
                            style={{
                              background: "#f1b6b6",
                              color: "#501313",
                              fontSize: 11,
                            }}
                            onClick={() => setDeleteId(row.supplier_id)}
                          >
                            Delete
                          </button>
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
      <BSModal
        open={modalOpen}
        title={form.supplier_id ? "Edit Supplier" : "Add Supplier"}
        onClose={() => setModalOpen(false)}
      >
        <div className="row g-3">
          {/* name */}
          <div className="col-12">
            <Field label="Supplier / Company Name">
              <input
                className={fieldCls(fieldErrors, "supplier_name")}
                value={form.name}
                onChange={(e) => change("name", e.target.value)}
                placeholder="e.g. Gujarat Dental Supplies"
              />
              <ErrMsg errs={fieldErrors} field="supplier_name" />
            </Field>
          </div>

          {/* mobile */}
          <div className="col-12 col-md-6">
            <Field label="Mobile">
              <input
                className={fieldCls(fieldErrors, "mobile")}
                value={form.mobile}
                onChange={(e) => change("mobile", e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={13}
              />
              <ErrMsg errs={fieldErrors} field="mobile" />
            </Field>
          </div>

          {/* email */}
          <div className="col-12 col-md-6">
            <Field label="Email (optional)">
              <input
                className={fieldCls(fieldErrors, "email")}
                type="text"
                value={form.email}
                onChange={(e) => change("email", e.target.value.toLowerCase())}
                placeholder="supplier@example.com"
              />
              <ErrMsg errs={fieldErrors} field="email" />
            </Field>
          </div>

          {/* address */}
          <div className="col-12">
            <Field label="Address (optional)">
              <textarea
                className={fieldCls(fieldErrors, "address")}
                rows={2}
                value={form.address}
                onChange={(e) => change("address", e.target.value)}
                placeholder="Full address..."
              />
              <ErrMsg errs={fieldErrors} field="address" />
            </Field>
          </div>
        </div>

        {error && (
          <div
            className="alert alert-danger py-2 px-3 mt-2 mb-0"
            style={{ fontSize: 12 }}
          >
            {error}
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button
            className="btn btn-light fw-semibold"
            onClick={() => setModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="btn fw-bold text-white"
            style={{ background: "#1D9E75" }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" />
                Saving...
              </>
            ) : (
              "Save Supplier"
            )}
          </button>
        </div>
      </BSModal>

      <DeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Deleting this supplier will remove them permanently. This cannot be undone."
      />
      <AlertModal
        open={alertOpen}
        title="Warning"
        message={alertMsg}
        type="danger"
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 2 — STOCK ITEMS
   DB: item_id | item_name | category | unit | current_stock | minimum_stock | expiry_date
═══════════════════════════════════════════════════════ */

const EMPTY_STOCK = {
  item_id: null,
  item_name: "",
  category: "Consumables",
  unit: "pcs",
  current_stock: "0",
  minimum_stock: "5",
  expiry_date: "",
};

const EMPTY_ADJUST = { item_id: null, item_name: "", type: "add", qty: "" };

/* sanitise a stock row from the API before putting into state */
const toStockForm = (row) => ({
  item_id: row.item_id ?? null,
  item_name: s(row.item_name),
  category: s(row.category) || "Consumables",
  unit: s(row.unit) || "pcs",
  current_stock: s(row.current_stock),
  minimum_stock: s(row.minimum_stock),
  expiry_date: s(row.expiry_date),
});

function StockTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustModal, setAdjustModal] = useState(EMPTY_ADJUST);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_STOCK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* ── load ── */
  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch(`${process.env.REACT_APP_GET_ITEMS}`);
      if (json.status) setItems(json.data || []);
      else setItems([]);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  // Guard: only load once on mount, never on re-renders
  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const json = await apiFetch(`${process.env.REACT_APP_GET_ITEMS}`);
        if (active && json.status) setItems(json.data || []);
        else if (active) setItems([]);
      } catch {
        if (active) setItems([]);
      }
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  /* FIX: sanitise every field with toStockForm() + clear errors */
  const openAdd = () => {
    setForm(EMPTY_STOCK);
    setError("");
    setFieldErrors({});
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setForm(toStockForm(row));
    setError("");
    setFieldErrors({});
    setModalOpen(true);
  };
  const openAdjust = (row) =>
    setAdjustModal({
      item_id: row.item_id,
      item_name: s(row.item_name),
      type: "add",
      qty: "",
    });

  /* live validation for stock fields */
  const validate = (f = form) =>
    validateAll({
      item_name: () => RULES.item_name(f.item_name),
      current_stock: () => RULES.current_stock(f.current_stock),
      minimum_stock: () => RULES.minimum_stock(f.minimum_stock),
      expiry_date: () => RULES.expiry_date(f.expiry_date),
    });

  /* field change helper — clears that field's error live */
  const change = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    if (RULES[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: RULES[key](val) }));
    }
  };

  /* ── handleSubmit with full validation ── */
  const handleSubmit = async () => {
    if (submitting) return; // guard: prevent double-submit

    // Hard-block: never allow submit with empty item_name
    if (!form.item_name.trim()) {
      const errs = validate();
      setFieldErrors(errs);
      setError("Please fix the errors above before saving.");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Please fix the errors above before saving.");
      return;
    }

    setSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      const isEdit = !!form.item_id;
      const json = await apiFetch(
        `${isEdit ? process.env.REACT_APP_UPDATE_ITEM : process.env.REACT_APP_ADD_ITEM}`,
        {
          method: isEdit ? "PUT" : "POST",
          body: {
            ...(isEdit && { item_id: form.item_id }),
            item_name: form.item_name.trim(),
            category: form.category,
            unit: form.unit,
            current_stock: form.current_stock,
            minimum_stock: form.minimum_stock,
            expiry_date: form.expiry_date || null,
          },
        },
      );
      if (json.status) {
        setModalOpen(false);
        setSuccess(isEdit ? "Item updated!" : "Item added!");
        load();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(json.message || "Something went wrong");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  /* ── handleAdjust — recalculates current_stock client-side, calls updateStock.php ── */
  const handleAdjust = async () => {
    if (!adjustModal.qty || parseInt(adjustModal.qty) <= 0) return;

    const currentItem = items.find((i) => i.item_id === adjustModal.item_id);
    if (!currentItem) return;

    const currentQty = parseInt(currentItem.current_stock, 10) || 0;
    const delta = parseInt(adjustModal.qty, 10);
    const newQty =
      adjustModal.type === "add"
        ? currentQty + delta
        : Math.max(0, currentQty - delta);

    try {
      const json = await apiFetch(`${process.env.REACT_APP_UPDATE_ITEM}`, {
        method: "PUT",
        body: {
          item_id: currentItem.item_id,
          item_name: currentItem.item_name,
          category: currentItem.category,
          unit: currentItem.unit,
          current_stock: newQty,
          minimum_stock: currentItem.minimum_stock,
          expiry_date: currentItem.expiry_date || null,
        },
      });
      if (json.status) {
        setAdjustModal(EMPTY_ADJUST);
        load();
      }
    } catch {}
  };

  /* ── handleDelete ── */
  const handleDelete = async () => {
    try {
      const json = await apiFetch(`${process.env.REACT_APP_DELETE_ITEM}`, {
        method: "DELETE",
        body: { item_id: deleteId },
      });
      if (json.status) {
        setDeleteId(null);
        load();
      } else {
        setAlertMsg(json.message || "Could not delete item");
        setAlertOpen(true);
        setDeleteId(null);
      }
    } catch {
      setDeleteId(null);
    }
  };

  /* ── status helpers ── */
  const isExpiringSoon = (d) => {
    if (!d) return false;
    const days = (new Date(d) - new Date()) / 86400000;
    return days >= 0 && days <= 30;
  };
  const isExpired = (d) => d && new Date(d) < new Date();
  const stockStatus = (row) => {
    const qty = parseInt(row.current_stock, 10) || 0;
    const min = parseInt(row.minimum_stock, 10) || 0;
    if (qty === 0) return "out";
    if (min > 0 && qty <= min) return "low";
    return "ok";
  };

  const filtered = items.filter((row) => {
    const matchCat = catFilter === "All" || row.category === catFilter;
    const st = stockStatus(row);
    const matchStock =
      stockFilter === "All" ||
      (stockFilter === "Low" && st === "low") ||
      (stockFilter === "Out" && st === "out");
    const matchSearch = s(row.item_name)
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchCat && matchStock && matchSearch;
  });

  const lowCount = items.filter((i) => stockStatus(i) === "low").length;
  const outCount = items.filter((i) => stockStatus(i) === "out").length;

  /* ── render ── */
  return (
    <>
      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <MiniStat label="Total Items" value={items.length} accent="#1D9E75" />
        </div>
        <div className="col-6 col-lg-3">
          <MiniStat label="Low Stock" value={lowCount} accent="#F59E0B" />
        </div>
        <div className="col-6 col-lg-3">
          <MiniStat label="Out of Stock" value={outCount} accent="#E24B4A" />
        </div>
        <div className="col-6 col-lg-3">
          <MiniStat
            label="Categories"
            value={[...new Set(items.map((i) => i.category))].length}
            accent="#378ADD"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between">
        <div className="d-flex flex-wrap gap-2">
          <select
            className="form-select"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ width: 175, fontSize: 13 }}
          >
            <option value="All">All Categories</option>
            {/* FIX: key on every option */}
            {STOCK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{ width: 145, fontSize: 13 }}
          >
            <option value="All">All Stock</option>
            <option value="Low">Low Stock</option>
            <option value="Out">Out of Stock</option>
          </select>
          <input
            className="form-control"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 195, fontSize: 13 }}
          />
        </div>
        <button
          className="btn fw-bold text-white"
          style={{ background: "#1D9E75", borderRadius: 10 }}
          onClick={openAdd}
        >
          + Add Item
        </button>
      </div>

      {success && (
        <div
          className="alert alert-success py-2 px-3 mb-3"
          style={{ fontSize: 13 }}
        >
          {success}
        </div>
      )}

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState message="No stock items found." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#FAFBFC" }}>
                  <tr>
                    {/* FIX: key on every header */}
                    {[
                      "Item Name",
                      "Category",
                      "Unit",
                      "Stock",
                      "Min. Stock",
                      "Expiry",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-muted fw-bold border-0 px-4 py-3"
                        style={{
                          fontSize: 10,
                          letterSpacing: ".6px",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const status = stockStatus(row);
                    const expired = isExpired(row.expiry_date);
                    const expiring = isExpiringSoon(row.expiry_date);
                    return (
                      /* FIX: key uses item_id */
                      <tr key={row.item_id}>
                        {/* item_name */}
                        <td className="px-4">
                          <span
                            className="fw-semibold"
                            style={{ fontSize: 13 }}
                          >
                            {s(row.item_name) || "—"}
                          </span>
                        </td>

                        {/* category */}
                        <td className="px-4">
                          <span
                            className={`badge ${CAT_BADGE[row.category] || "text-bg-secondary"}`}
                            style={{ fontSize: 11 }}
                          >
                            {s(row.category) || "—"}
                          </span>
                        </td>

                        {/* unit */}
                        <td
                          className="px-4 text-muted"
                          style={{ fontSize: 13 }}
                        >
                          {s(row.unit) || "—"}
                        </td>

                        {/* current_stock */}
                        <td className="px-4">
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: 15,
                              color:
                                status === "out"
                                  ? "#E24B4A"
                                  : status === "low"
                                    ? "#BA7517"
                                    : "#085041",
                            }}
                          >
                            {row.current_stock ?? 0}
                          </span>{" "}
                          <span className="text-muted" style={{ fontSize: 11 }}>
                            {s(row.unit)}
                          </span>
                          {status === "out" && (
                            <div>
                              <span
                                className="badge text-bg-danger"
                                style={{ fontSize: 10 }}
                              >
                                Out of stock
                              </span>
                            </div>
                          )}
                          {status === "low" && (
                            <div>
                              <span
                                className="badge text-bg-warning"
                                style={{ fontSize: 10 }}
                              >
                                Low stock
                              </span>
                            </div>
                          )}
                        </td>

                        {/* minimum_stock */}
                        <td
                          className="px-4 text-muted"
                          style={{ fontSize: 13 }}
                        >
                          {row.minimum_stock ?? "—"}
                        </td>

                        {/* expiry_date */}
                        <td className="px-4">
                          {row.expiry_date ? (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: expired || expiring ? 600 : 400,
                                color: expired
                                  ? "#E24B4A"
                                  : expiring
                                    ? "#BA7517"
                                    : "#6B7A8D",
                              }}
                            >
                              {expired
                                ? "⚠ Expired "
                                : expiring
                                  ? "⚠ Soon "
                                  : ""}
                              {new Date(row.expiry_date).toLocaleDateString(
                                "en-IN",
                              )}
                            </span>
                          ) : (
                            <span
                              className="text-muted"
                              style={{ fontSize: 12 }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* actions */}
                        <td className="px-4">
                          <div className="d-flex gap-1 flex-wrap">
                            <button
                              className="btn btn-sm fw-bold"
                              style={{
                                background: "#E1F5EE",
                                color: "#085041",
                                fontSize: 11,
                              }}
                              onClick={() => openAdjust(row)}
                            >
                              ± Qty
                            </button>
                            <button
                              className="btn btn-sm fw-bold"
                              style={{
                                background: "#87bae9",
                                color: "#042C53",
                                fontSize: 11,
                              }}
                              onClick={() => openEdit(row)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm fw-bold"
                              style={{
                                background: "#f1b6b6",
                                color: "#501313",
                                fontSize: 11,
                              }}
                              onClick={() => setDeleteId(row.item_id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <BSModal
        open={modalOpen}
        title={form.item_id ? "Edit Stock Item" : "Add Stock Item"}
        onClose={() => setModalOpen(false)}
        size="modal-lg"
      >
        <div className="row g-3">
          {/* item_name */}
          <div className="col-12 col-md-6">
            <Field label="Item Name">
              <input
                className={fieldCls(fieldErrors, "item_name")}
                value={form.item_name}
                onChange={(e) => change("item_name", e.target.value)}
                placeholder="e.g. Disposable Gloves"
              />
              <ErrMsg errs={fieldErrors} field="item_name" />
            </Field>
          </div>

          {/* category */}
          <div className="col-12 col-md-6">
            <Field label="Category">
              <select
                className={selectCls(fieldErrors, "category")}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {STOCK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* unit */}
          <div className="col-6 col-md-4">
            <Field label="Unit">
              <select
                className={selectCls(fieldErrors, "unit")}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* current_stock */}
          <div className="col-6 col-md-4">
            <Field label="Current Stock">
              <input
                className={fieldCls(fieldErrors, "current_stock")}
                type="number"
                min="0"
                value={form.current_stock}
                onChange={(e) => change("current_stock", e.target.value)}
                placeholder="0"
              />
              <ErrMsg errs={fieldErrors} field="current_stock" />
            </Field>
          </div>

          {/* minimum_stock */}
          <div className="col-6 col-md-4">
            <Field label="Minimum Stock (Alert Level)">
              <input
                className={fieldCls(fieldErrors, "minimum_stock")}
                type="number"
                min="0"
                value={form.minimum_stock}
                onChange={(e) => change("minimum_stock", e.target.value)}
                placeholder="5"
              />
              <ErrMsg errs={fieldErrors} field="minimum_stock" />
            </Field>
          </div>

          {/* expiry_date */}
          <div className="col-12 col-md-6">
            <Field label="Expiry Date (optional)">
              <input
                className={fieldCls(fieldErrors, "expiry_date")}
                type="date"
                value={form.expiry_date}
                onChange={(e) => change("expiry_date", e.target.value)}
              />
              <ErrMsg errs={fieldErrors} field="expiry_date" />
            </Field>
          </div>
        </div>

        {error && (
          <div
            className="alert alert-danger py-2 px-3 mt-2 mb-0"
            style={{ fontSize: 12 }}
          >
            {error}
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button
            className="btn btn-light fw-semibold"
            onClick={() => setModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="btn fw-bold text-white"
            style={{ background: "#1D9E75" }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" />
                Saving...
              </>
            ) : (
              "Save Item"
            )}
          </button>
        </div>
      </BSModal>

      {/* ── Adjust Qty Modal ── */}
      <BSModal
        open={!!adjustModal.item_id}
        title={`Adjust Stock — ${adjustModal.item_name}`}
        onClose={() => setAdjustModal(EMPTY_ADJUST)}
      >
        <div className="row g-3">
          {/* type toggle */}
          <div className="col-12">
            <Field label="Adjustment Type">
              <div className="d-flex gap-2">
                {["add", "remove"].map((t) => (
                  <button
                    key={t}
                    className={`btn flex-fill fw-bold ${adjustModal.type === t ? "text-white" : "btn-light"}`}
                    style={{
                      background:
                        adjustModal.type === t
                          ? t === "add"
                            ? "#1D9E75"
                            : "#E24B4A"
                          : "",
                      fontSize: 13,
                    }}
                    onClick={() => setAdjustModal({ ...adjustModal, type: t })}
                  >
                    {t === "add" ? "+ Add Stock" : "− Remove Stock"}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* qty */}
          <div className="col-12">
            <Field label="Quantity">
              <input
                className="form-control"
                type="number"
                min="1"
                value={adjustModal.qty}
                onChange={(e) =>
                  setAdjustModal({ ...adjustModal, qty: e.target.value })
                }
                placeholder="Enter quantity"
              />
            </Field>
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button
            className="btn btn-light fw-semibold"
            onClick={() => setAdjustModal(EMPTY_ADJUST)}
          >
            Cancel
          </button>
          <button
            className="btn fw-bold text-white"
            style={{
              background: adjustModal.type === "add" ? "#1D9E75" : "#E24B4A",
            }}
            onClick={handleAdjust}
            disabled={!adjustModal.qty || parseInt(adjustModal.qty) <= 0}
          >
            Confirm
          </button>
        </div>
      </BSModal>

      <DeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="This will permanently delete the stock item. This cannot be undone."
      />
      <AlertModal
        open={alertOpen}
        title="Warning"
        message={alertMsg}
        type="danger"
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE — tab wrapper
═══════════════════════════════════════════════════════ */
export default function InventoryManage() {
  const [activeTab, setActiveTab] = useState("suppliers");

  const tabs = [
    { id: "suppliers", label: "Suppliers", icon: "🏭" },
    { id: "stock", label: "Stock Items", icon: "📦" },
  ];

  return (
    <div
      className="p-3 p-lg-4"
      style={{
        minHeight: "100vh",
        fontFamily: "'Nunito','Segoe UI',sans-serif",
      }}
    >
      {/* Page header */}
      <div className="mb-4">
        <h4
          className="fw-bold mb-1"
          style={{ color: "#0A1628", letterSpacing: "-0.3px" }}
        >
          Inventory Management
        </h4>
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          Manage your suppliers and stock items in one place
        </p>
      </div>

      {/* Tab strip */}
      <div
        className="d-flex gap-1 mb-4 p-1"
        style={{
          background: "#E4EAF0",
          borderRadius: 12,
          display: "inline-flex",
        }}
      >
        {/* FIX: key on tab buttons */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn fw-bold"
            style={{
              fontSize: 13,
              borderRadius: 10,
              padding: "8px 22px",
              transition: "all .18s ease",
              background: activeTab === tab.id ? "#fff" : "transparent",
              color: activeTab === tab.id ? "#0A1628" : "#6B7A8D",
              boxShadow:
                activeTab === tab.id ? "0 1px 4px rgba(0,0,0,.10)" : "none",
              border: "none",
            }}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "suppliers" && <SuppliersTab />}
      {activeTab === "stock" && <StockTab />}
    </div>
  );
}
