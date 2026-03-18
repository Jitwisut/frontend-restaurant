"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

/* ─── Layout constants ─── */
const GRID = 20;
const TW = 120;
const TH = 120;
const CW = 1800;
const CH = 1200;
const MIN_Z = 0.3;
const MAX_Z = 2.0;
const Z_STEP = 0.1;
const LS_KEY = "table_layout_v2";

const snap = (v) => Math.round(v / GRID) * GRID;

/* ─── Status themes ─── */
const STATUS = {
  available: {
    bg: "#10b981",
    ring: "#34d399",
    label: "ว่าง",
    labelEn: "Available",
    iconBg: "rgba(16,185,129,0.15)",
  },
  open: {
    bg: "#ef4444",
    ring: "#f87171",
    label: "กำลังใช้งาน",
    labelEn: "Occupied",
    iconBg: "rgba(239,68,68,0.15)",
  },
  reserved: {
    bg: "#f59e0b",
    ring: "#fbbf24",
    label: "จองแล้ว",
    labelEn: "Reserved",
    iconBg: "rgba(245,158,11,0.15)",
  },
  maintenance: {
    bg: "#6b7280",
    ring: "#9ca3af",
    label: "ปิดปรับปรุง",
    labelEn: "Maintenance",
    iconBg: "rgba(107,114,128,0.15)",
  },
};
const FB = STATUS.maintenance;
const getS = (s) => STATUS[s] || FB;

/* ══════════════════════════════════════════════════════════════════════════
   SVG Icons — cleaner than emoji for production
   ══════════════════════════════════════════════════════════════════════════ */
const Icons = {
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <line x1="7" y1="20" x2="7" y2="16" />
      <line x1="17" y1="20" x2="17" y2="16" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  reset: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  ),
  zoomIn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  zoomOut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  qr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="18" y="18" width="3" height="3" />
      <rect x="18" y="14" width="3" height="1" />
      <rect x="14" y="18" width="1" height="3" />
    </svg>
  ),
  print: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  utensils: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
  move: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  ),
};

/* ══════════════════════════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════════════════════════ */
function Toast({ message, type, onClose }) {
  const colors = {
    success: { bg: "#059669", border: "#10b981" },
    error: { bg: "#dc2626", border: "#ef4444" },
    info: { bg: "#2563eb", border: "#3b82f6" },
  };
  const c = colors[type] || colors.info;
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-[200] animate-toast-in">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium backdrop-blur-sm"
        style={{ backgroundColor: c.bg, borderLeft: `4px solid ${c.border}` }}
      >
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition">
          {Icons.x}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TABLE NODE — round restaurant table
   ══════════════════════════════════════════════════════════════════════════ */
function TableNode({ table, pos, zoom, editMode, onDragEnd, onClick }) {
  const s = getS(table.status);
  const el = useRef(null);
  const drag = useRef(false);
  const off = useRef({ x: 0, y: 0 });

  const onDown = useCallback(
    (e) => {
      if (!editMode) return;
      e.stopPropagation();
      drag.current = true;
      off.current = { x: e.clientX / zoom - pos.x, y: e.clientY / zoom - pos.y };

      const onMove = (ev) => {
        if (!drag.current) return;
        const nx = Math.max(0, Math.min(snap(ev.clientX / zoom - off.current.x), CW - TW));
        const ny = Math.max(0, Math.min(snap(ev.clientY / zoom - off.current.y), CH - TH));
        el.current.style.left = nx + "px";
        el.current.style.top = ny + "px";
        el.current.dataset.x = nx;
        el.current.dataset.y = ny;
      };

      const onUp = () => {
        drag.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        const fx = parseFloat(el.current.dataset.x ?? pos.x);
        const fy = parseFloat(el.current.dataset.y ?? pos.y);
        onDragEnd(table.table_number, fx, fy);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [editMode, zoom, pos, onDragEnd, table.table_number]
  );

  return (
    <div
      ref={el}
      onMouseDown={onDown}
      onClick={(e) => {
        if (!editMode) { e.stopPropagation(); onClick(table); }
      }}
      className="absolute select-none group"
      style={{
        left: pos.x,
        top: pos.y,
        width: TW,
        height: TH,
        cursor: editMode ? "grab" : "pointer",
      }}
    >
      {/* Outer glow ring on hover */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 0 3px ${s.ring}40, 0 0 20px ${s.bg}30`,
        }}
      />

      {/* Main circle */}
      <div
        className="relative w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-200"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${s.ring}, ${s.bg})`,
          boxShadow: `0 4px 16px ${s.bg}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
      >
        {/* Table number — large and prominent */}
        <span className="text-white font-black text-2xl leading-none drop-shadow-sm">
          {table.table_number}
        </span>

        {/* Status label */}
        <span
          className="mt-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.9)" }}
        >
          {s.label}
        </span>

        {/* Active pulse for occupied tables */}
        {table.status === "open" && (
          <div
            className="absolute inset-0 rounded-full animate-ping-slow"
            style={{ border: `2px solid ${s.ring}`, opacity: 0.3 }}
          />
        )}
      </div>

      {/* Edit mode drag indicator */}
      {editMode && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 opacity-80 group-hover:opacity-100 transition">
          {Icons.move}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TOOLBAR BUTTON
   ══════════════════════════════════════════════════════════════════════════ */
function ToolBtn({ icon, label, onClick, active, variant = "default", className = "" }) {
  const base = "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap";
  const styles = {
    default: active
      ? "bg-white/15 text-white ring-1 ring-white/20"
      : "text-slate-300 hover:bg-white/10 hover:text-white",
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25",
    warning: active
      ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-1 ring-amber-400"
      : "text-slate-300 hover:bg-white/10 hover:text-white",
    ghost: "text-slate-400 hover:text-white hover:bg-white/10",
  };

  return (
    <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function TableLayoutPage() {
  const [tables, setTables] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [zoom, setZoom] = useState(0.75);
  const [selected, setSelected] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qr64, setQr64] = useState("");
  const [fullurl, setFullurl] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const notify = useCallback((msg, type) => setToast({ message: msg, type }), []);

  /* — positions persistence — */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPositions(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  const savePos = useCallback((next) => {
    setPositions(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }, []);

  /* — fetch tables — */
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/tables/gettable`, { withCredentials: true });
      const sorted = data.tables.sort((a, b) => a.table_number - b.table_number);
      setTables(sorted);

      setPositions((prev) => {
        const next = { ...prev };
        let changed = false;
        const cols = Math.floor(CW / (TW + 40));
        sorted.forEach((t, i) => {
          if (next[t.table_number] === undefined) {
            next[t.table_number] = {
              x: snap(60 + (i % cols) * (TW + 40)),
              y: snap(60 + Math.floor(i / cols) * (TH + 40)),
            };
            changed = true;
          }
        });
        if (changed) localStorage.setItem(LS_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      notify("ไม่สามารถโหลดข้อมูลโต๊ะได้", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  /* — drag end — */
  const handleDragEnd = useCallback(
    (num, x, y) => savePos({ ...positions, [num]: { x, y } }),
    [positions, savePos]
  );

  /* — zoom — */
  const zIn = () => setZoom((z) => Math.min(z + Z_STEP, MAX_Z));
  const zOut = () => setZoom((z) => Math.max(z - Z_STEP, MIN_Z));
  const zReset = () => setZoom(0.75);

  const onWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.max(MIN_Z, Math.min(MAX_Z, z + (e.deltaY < 0 ? Z_STEP : -Z_STEP))));
    }
  }, []);

  /* — table actions — */
  const openTable = async (num) => {
    try {
      setBusy(true);
      const { data } = await axios.post(`${API}/tables/opentable`, { number: num }, { withCredentials: true });
      setTables((p) => p.map((t) => t.table_number === num ? { ...t, status: "open", fullurl: data.fullurl, qr_code_url: data.qr_code_url } : t));
      setFullurl(data.fullurl);
      setQr64(data.qr_code_url);
      setShowQR(true);
      setSelected(null);
      notify(`เปิดโต๊ะ ${num} สำเร็จ`, "success");
    } catch (err) {
      notify(err.response?.data?.message || "ไม่สามารถเปิดโต๊ะได้", "error");
    } finally { setBusy(false); }
  };

  const closeTable = async (num) => {
    try {
      setBusy(true);
      const { data } = await axios.post(`${API}/tables/closetable`, { number: num }, { withCredentials: true });
      setTables((p) => p.map((t) => t.table_number === num ? { ...t, status: "available", fullurl: null, qr_code_url: null } : t));
      setSelected(null);
      notify(data.message || `ปิดโต๊ะ ${num} สำเร็จ`, "success");
    } catch { notify("ไม่สามารถปิดโต๊ะได้", "error"); }
    finally { setBusy(false); }
  };

  const addTable = async () => {
    try {
      const { data } = await axios.post(`${API}/tables/addtable`, {}, { withCredentials: true });
      notify(data.message || "เพิ่มโต๊ะสำเร็จ", "success");
      await fetchTables();
    } catch { notify("ไม่สามารถเพิ่มโต๊ะได้", "error"); }
  };

  const resetLayout = () => {
    const next = {};
    const cols = Math.floor(CW / (TW + 40));
    tables.forEach((t, i) => {
      next[t.table_number] = {
        x: snap(60 + (i % cols) * (TW + 40)),
        y: snap(60 + Math.floor(i / cols) * (TH + 40)),
      };
    });
    savePos(next);
    setConfirmReset(false);
    notify("รีเซ็ตผังโต๊ะเรียบร้อย", "info");
  };

  /* — counts — */
  const cnt = (s) => tables.filter((t) => t.status === s).length;

  /* ────── LOADING ────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-700" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-400 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลโต๊ะ...</p>
        </div>
      </div>
    );
  }

  /* ────── RENDER ────── */
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0f172a", color: "#f1f5f9" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ═══ HEADER ═══ */}
      <header className="flex-none z-20" style={{ background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}>
        <div className="px-5 py-3 flex items-center gap-5">
          {/* Title section */}
          <div className="flex items-center gap-3 mr-auto">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
              <span className="text-indigo-400">{Icons.table}</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">ผังโต๊ะร้าน</h1>
              <p className="text-[11px] text-slate-500 font-medium">Table Floor Plan</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-1.5">
            {[
              { label: "ทั้งหมด", val: tables.length, color: "#64748b" },
              { label: "ว่าง", val: cnt("available"), color: "#10b981" },
              { label: "ใช้งาน", val: cnt("open"), color: "#ef4444" },
              { label: "จอง", val: cnt("reserved"), color: "#f59e0b" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                {s.val}
                <span className="text-[10px] opacity-70">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-7 bg-white/10 hidden lg:block" />

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={zOut} className="px-2.5 py-1.5 hover:bg-white/10 transition text-slate-400 hover:text-white">{Icons.zoomOut}</button>
            <button onClick={zReset} className="px-3 py-1.5 border-x border-white/8 hover:bg-white/10 transition text-xs font-mono text-slate-300 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={zIn} className="px-2.5 py-1.5 hover:bg-white/10 transition text-slate-400 hover:text-white">{Icons.zoomIn}</button>
          </div>

          {/* Action buttons */}
          <ToolBtn
            icon={editMode ? Icons.lock : Icons.edit}
            label={editMode ? "บันทึกผัง" : "จัดผังโต๊ะ"}
            onClick={() => {
              if (editMode) notify("บันทึกผังโต๊ะเรียบร้อย", "success");
              setEditMode(!editMode);
            }}
            variant="warning"
            active={editMode}
          />

          {editMode && (
            <ToolBtn
              icon={Icons.reset}
              label="รีเซ็ต"
              onClick={() => setConfirmReset(true)}
              variant="ghost"
            />
          )}

          <ToolBtn icon={Icons.plus} label="เพิ่มโต๊ะ" onClick={addTable} variant="primary" />

          <ToolBtn
            icon={Icons.refresh}
            onClick={async () => { await fetchTables(); notify("รีเฟรชข้อมูลเรียบร้อย", "info"); }}
            variant="ghost"
          />
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div className="px-5 py-2 flex items-center justify-center gap-2 text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", borderTop: "1px solid rgba(245,158,11,0.15)", color: "#fbbf24" }}>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            โหมดจัดผังโต๊ะ — ลากโต๊ะเพื่อจัดวาง เสร็จแล้วกด &quot;บันทึกผัง&quot;
          </div>
        )}
      </header>

      {/* ═══ CANVAS ═══ */}
      <main
        className="flex-1 overflow-auto relative"
        style={{ cursor: "default" }}
        onWheel={onWheel}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
            width: CW,
            height: CH,
            position: "relative",
            margin: "20px",
          }}
        >
          {/* Grid pattern */}
          <svg className="absolute inset-0 pointer-events-none" width={CW} height={CH}>
            <defs>
              <pattern id="dots" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.6" fill="rgba(148,163,184,0.08)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          {/* Boundary */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.04)" }} />

          {/* Tables */}
          {tables.map((t) => (
            <TableNode
              key={t.table_number}
              table={t}
              pos={positions[t.table_number] || { x: 60, y: 60 }}
              zoom={zoom}
              editMode={editMode}
              onDragEnd={handleDragEnd}
              onClick={(tbl) => setSelected(tbl)}
            />
          ))}
        </div>
      </main>

      {/* ═══ BOTTOM BAR — Legend + Shortcuts ═══ */}
      <footer className="flex-none z-20 px-5 py-2 flex items-center justify-between" style={{ background: "rgba(15,23,42,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4">
          {Object.entries(STATUS).map(([, cfg]) => (
            <div key={cfg.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.bg }} />
              <span className="text-[11px] text-slate-400 font-medium">{cfg.label}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 font-mono text-[10px]">Ctrl</kbd> + Scroll = Zoom</span>
          <span>Scroll = เลื่อนผัง</span>
        </div>
      </footer>

      {/* ═══ QR MODAL ═══ */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-7 animate-modal-in" style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-emerald-400" style={{ background: "rgba(16,185,129,0.15)" }}>
                {Icons.qr}
              </div>
              <h2 className="text-lg font-bold text-white">QR Code สั่งอาหาร</h2>
              <p className="text-sm text-slate-400 mt-1">ให้ลูกค้าสแกนเพื่อเริ่มสั่งอาหาร</p>
            </div>

            <div className="bg-white rounded-xl p-5 mb-4">
              <img src={qr64} alt="QR Code" className="w-44 h-44 mx-auto" />
            </div>

            <div className="mb-5 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 break-all" style={{ background: "rgba(255,255,255,0.04)" }}>
              {fullurl}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                เสร็จสิ้น
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-300 transition hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {Icons.print}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TABLE DETAIL MODAL ═══ */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl animate-modal-in" style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Header with table visual */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Mini table circle */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${getS(selected.status).ring}, ${getS(selected.status).bg})`,
                      boxShadow: `0 4px 12px ${getS(selected.status).bg}50`,
                    }}
                  >
                    {selected.table_number}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">โต๊ะ {selected.table_number}</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: getS(selected.status).bg }} />
                      <span className="text-sm font-medium" style={{ color: getS(selected.status).ring }}>
                        {getS(selected.status).label}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  {Icons.x}
                </button>
              </div>
            </div>

            {/* Info rows */}
            <div className="px-6 pb-4">
              <div className="rounded-xl p-3 space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                {Boolean(selected.guestCount) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">จำนวนลูกค้า</span>
                    <span className="text-white font-semibold">{selected.guestCount} คน</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">QR Code</span>
                  <span className={`font-semibold ${selected.qr_code_url ? "text-emerald-400" : "text-slate-500"}`}>
                    {selected.qr_code_url ? "พร้อมใช้งาน" : "ยังไม่ได้สร้าง"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-2.5">
              {selected.status === "available" && (
                <button
                  onClick={() => openTable(selected.table_number)}
                  disabled={busy}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : Icons.utensils}
                  {busy ? "กำลังดำเนินการ..." : "เปิดโต๊ะ — รับลูกค้า"}
                </button>
              )}

              {selected.status !== "available" && (
                <button
                  onClick={() => closeTable(selected.table_number)}
                  disabled={busy}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  {busy ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : Icons.check}
                  {busy ? "กำลังดำเนินการ..." : "ปิดโต๊ะ — ว่างพร้อมใช้"}
                </button>
              )}

              {selected.qr_code_url && (
                <button
                  onClick={() => {
                    setQr64(selected.qr_code_url);
                    setFullurl(selected.fullurl);
                    setShowQR(true);
                    setSelected(null);
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {Icons.qr}
                  <span>แสดง QR Code</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM RESET DIALOG ═══ */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-6 text-center animate-modal-in" style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-amber-400" style={{ background: "rgba(245,158,11,0.15)" }}>
              {Icons.reset}
            </div>
            <h3 className="text-base font-bold text-white mb-1">รีเซ็ตผังโต๊ะ?</h3>
            <p className="text-sm text-slate-400 mb-5">ตำแหน่งโต๊ะทั้งหมดจะถูกจัดเรียงใหม่</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                ยกเลิก
              </button>
              <button
                onClick={resetLayout}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STYLES ═══ */}
      <style jsx>{`
        @keyframes toast-in {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes modal-in {
          from { transform: scale(0.95) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-toast-in { animation: toast-in 0.35s cubic-bezier(0.16,1,0.3,1); }
        .animate-modal-in { animation: modal-in 0.25s cubic-bezier(0.16,1,0.3,1); }
        .animate-ping-slow { animation: ping-slow 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
