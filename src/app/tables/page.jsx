"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

/* ─── Layout constants ─── */
const GRID = 20;
const TW = 130;
const TH = 130;
const CW = 1800;
const CH = 1200;
const MIN_Z = 0.3;
const MAX_Z = 2.0;
const Z_STEP = 0.1;
const LS_KEY = "table_layout_v3";

const snap = (v) => Math.round(v / GRID) * GRID;

/* ─── Status themes ─── */
const STATUS = {
  available: {
    bg: "#059669",
    gradient: "from-[#10b981] to-[#047857]",
    ring: "#34d399",
    label: "ว่าง",
    shadow: "rgba(16,185,129,0.4)",
  },
  open: {
    bg: "#e11d48",
    gradient: "from-[#f43f5e] to-[#be123c]",
    ring: "#fb7185",
    label: "ใช้งาน",
    shadow: "rgba(244,63,94,0.4)",
  },
  reserved: {
    bg: "#d97706",
    gradient: "from-[#f59e0b] to-[#b45309]",
    ring: "#fbbf24",
    label: "จอง",
    shadow: "rgba(245,158,11,0.4)",
  },
  maintenance: {
    bg: "#4b5563",
    gradient: "from-[#6b7280] to-[#374151]",
    ring: "#9ca3af",
    label: "ปรับปรุง",
    shadow: "rgba(107,114,128,0.4)",
  },
};
const FB = STATUS.maintenance;
const getS = (s) => STATUS[s] || FB;

/* ══════════════════════════════════════════════════════════════════════════
   SVG Icons
   ══════════════════════════════════════════════════════════════════════════ */
const Icons = {
  table: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <line x1="7" y1="20" x2="7" y2="16" />
      <line x1="17" y1="20" x2="17" y2="16" />
    </svg>
  ),
  edit: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  lock: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  plus: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="w-4 h-4"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  refresh: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  reset: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  ),
  zoomIn: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="w-4 h-4"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  zoomOut: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="w-4 h-4"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  x: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="w-5 h-5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  qr: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="w-5 h-5"
    >
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  utensils: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
  move: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  ),
  copy: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
};

/* ══════════════════════════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════════════════════════ */
function Toast({ message, type, onClose }) {
  const styles = {
    success: "bg-emerald-500/90 border-emerald-400 shadow-emerald-500/20",
    error: "bg-rose-500/90 border-rose-400 shadow-rose-500/20",
    info: "bg-indigo-500/90 border-indigo-400 shadow-indigo-500/20",
  };

  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-toast-in w-full max-w-sm px-4">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-semibold backdrop-blur-xl border-t border-l ${styles[type || "info"]}`}
      >
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
        >
          {Icons.x}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TABLE NODE
   ══════════════════════════════════════════════════════════════════════════ */
function TableNode({ table, pos, zoom, editMode, onDragEnd, onClick }) {
  const s = getS(table.status);
  const el = useRef(null);
  const drag = useRef(false);
  const off = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onDown = useCallback(
    (e) => {
      if (!editMode) return;
      e.stopPropagation();
      const isTouch = e.type === "touchstart";
      const startX = isTouch ? e.touches[0].clientX : e.clientX;
      const startY = isTouch ? e.touches[0].clientY : e.clientY;

      drag.current = true;
      setIsDragging(true);
      off.current = { x: startX / zoom - pos.x, y: startY / zoom - pos.y };

      const onMove = (ev) => {
        if (!drag.current) return;
        if (isTouch && ev.cancelable) ev.preventDefault();

        const clientX = isTouch ? ev.touches[0].clientX : ev.clientX;
        const clientY = isTouch ? ev.touches[0].clientY : ev.clientY;

        const nx = Math.max(
          0,
          Math.min(snap(clientX / zoom - off.current.x), CW - TW),
        );
        const ny = Math.max(
          0,
          Math.min(snap(clientY / zoom - off.current.y), CH - TH),
        );

        el.current.style.left = nx + "px";
        el.current.style.top = ny + "px";
        el.current.dataset.x = nx;
        el.current.dataset.y = ny;
      };

      const onUp = () => {
        drag.current = false;
        setIsDragging(false);
        if (isTouch) {
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("touchend", onUp);
        } else {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        const fx = parseFloat(el.current.dataset.x ?? pos.x);
        const fy = parseFloat(el.current.dataset.y ?? pos.y);
        onDragEnd(table.table_number, fx, fy);
      };

      if (isTouch) {
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onUp);
      } else {
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      }
    },
    [editMode, zoom, pos, onDragEnd, table.table_number],
  );

  return (
    <div
      ref={el}
      onMouseDown={onDown}
      onTouchStart={onDown}
      onClick={(e) => {
        if (!editMode) {
          e.stopPropagation();
          onClick(table);
        }
      }}
      className={`absolute select-none group transition-all duration-300 ${isDragging ? "scale-110 z-50" : "hover:-translate-y-1 z-10"} ${editMode ? "touch-none" : ""}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: TW,
        height: TH,
        cursor: editMode ? (isDragging ? "grabbing" : "grab") : "pointer",
      }}
    >
      <div
        className={`relative w-full h-full rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 bg-gradient-to-br ${s.gradient}`}
        style={{
          boxShadow: isDragging
            ? `0 25px 50px -12px ${s.shadow}, inset 0 2px 4px rgba(255,255,255,0.4)`
            : `0 10px 25px -5px ${s.shadow}, inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.2)`,
          border: `1px solid rgba(255,255,255,0.15)`,
        }}
      >
        <div className="absolute inset-2 rounded-[2rem] border border-white/10 mix-blend-overlay" />

        <span className="text-white font-black text-4xl leading-none drop-shadow-lg z-10 font-sans tracking-tighter">
          {table.table_number}
        </span>

        <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 z-10">
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/95">
            {s.label}
          </span>
        </div>

        {table.status === "open" && !editMode && (
          <div className="absolute -inset-2 rounded-[3rem] border-2 border-rose-400/50 animate-ping-slow pointer-events-none" />
        )}
      </div>

      {editMode && (
        <div
          className={`absolute -top-2 -right-2 w-8 h-8 bg-white text-slate-800 rounded-full shadow-xl flex items-center justify-center transition-all ${isDragging ? "scale-125 opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          {Icons.move}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TOOLBAR BUTTON
   ══════════════════════════════════════════════════════════════════════════ */
function ToolBtn({
  icon,
  label,
  onClick,
  active,
  variant = "default",
  className = "",
}) {
  const base =
    "inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]";
  const styles = {
    default: active
      ? "bg-white/20 text-white shadow-inner border border-white/20"
      : "text-slate-300 hover:bg-white/10 hover:text-white bg-slate-800/60 border border-slate-700/50",
    primary:
      "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30",
    warning: active
      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 border border-amber-400"
      : "text-amber-400/80 hover:bg-amber-500/20 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20",
    ghost: "text-slate-400 hover:text-white hover:bg-white/10",
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {icon}
      {label && (
        <span className="hidden sm:inline-block tracking-wide">{label}</span>
      )}
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
  const [zoom, setZoom] = useState(0.8);
  const [selected, setSelected] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qr64, setQr64] = useState("");
  const [fullurl, setFullurl] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const notify = useCallback(
    (msg, type) => setToast({ message: msg, type }),
    [],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPositions(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  const savePos = useCallback((next) => {
    setPositions(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/tables/gettable`, {
        withCredentials: true,
      });
      const sorted = data.tables.sort(
        (a, b) => a.table_number - b.table_number,
      );
      setTables(sorted);

      setPositions((prev) => {
        const next = { ...prev };
        let changed = false;
        const cols = Math.floor(CW / (TW + 50));
        sorted.forEach((t, i) => {
          if (next[t.table_number] === undefined) {
            next[t.table_number] = {
              x: snap(80 + (i % cols) * (TW + 50)),
              y: snap(80 + Math.floor(i / cols) * (TH + 50)),
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

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleDragEnd = useCallback(
    (num, x, y) => savePos({ ...positions, [num]: { x, y } }),
    [positions, savePos],
  );

  const zIn = () => setZoom((z) => Math.min(z + Z_STEP, MAX_Z));
  const zOut = () => setZoom((z) => Math.max(z - Z_STEP, MIN_Z));
  const zReset = () => setZoom(0.8);

  const onWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) =>
        Math.max(MIN_Z, Math.min(MAX_Z, z + (e.deltaY < 0 ? Z_STEP : -Z_STEP))),
      );
    }
  }, []);

  const openTable = async (num) => {
    try {
      setBusy(true);
      const { data } = await axios.post(
        `${API}/tables/opentable`,
        { number: num },
        { withCredentials: true },
      );
      setTables((p) =>
        p.map((t) =>
          t.table_number === num
            ? {
                ...t,
                status: "open",
                fullurl: data.fullurl,
                qr_code_url: data.qr_code_url,
              }
            : t,
        ),
      );
      setFullurl(data.fullurl);
      setQr64(data.qr_code_url);
      setShowQR(true);
      setSelected(null);
      notify(`เปิดโต๊ะ ${num} สำเร็จ`, "success");
    } catch (err) {
      notify(err.response?.data?.message || "ไม่สามารถเปิดโต๊ะได้", "error");
    } finally {
      setBusy(false);
    }
  };

  const closeTable = async (num) => {
    try {
      setBusy(true);
      const { data } = await axios.post(
        `${API}/tables/closetable`,
        { number: num },
        { withCredentials: true },
      );
      setTables((p) =>
        p.map((t) =>
          t.table_number === num
            ? { ...t, status: "available", fullurl: null, qr_code_url: null }
            : t,
        ),
      );
      setSelected(null);
      notify(data.message || `ปิดโต๊ะ ${num} สำเร็จ`, "success");
    } catch {
      notify("ไม่สามารถปิดโต๊ะได้", "error");
    } finally {
      setBusy(false);
    }
  };

  const addTable = async () => {
    try {
      const { data } = await axios.post(
        `${API}/tables/addtable`,
        {},
        { withCredentials: true },
      );
      notify(data.message || "เพิ่มโต๊ะสำเร็จ", "success");
      await fetchTables();
    } catch {
      notify("ไม่สามารถเพิ่มโต๊ะได้", "error");
    }
  };

  const resetLayout = () => {
    const next = {};
    const cols = Math.floor(CW / (TW + 50));
    tables.forEach((t, i) => {
      next[t.table_number] = {
        x: snap(80 + (i % cols) * (TW + 50)),
        y: snap(80 + Math.floor(i / cols) * (TH + 50)),
      };
    });
    savePos(next);
    setConfirmReset(false);
    notify("จัดเรียงโต๊ะใหม่เรียบร้อย", "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6 shadow-lg shadow-indigo-500/20" />
          <p className="text-indigo-200 text-sm font-medium tracking-widest animate-pulse">
            LOADING FLOOR PLAN...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0B1120] text-slate-100 font-sans selection:bg-indigo-500/30">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className="flex-none z-20 bg-[#0B1120]/70 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
        <div className="px-5 py-4 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              {Icons.table}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                ผังโต๊ะอาหาร
              </h1>
              <p className="text-xs text-indigo-200/70 font-medium tracking-wide uppercase">
                Restaurant Layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className="hidden lg:flex items-center rounded-xl bg-slate-800/50 border border-slate-700 p-1">
              <button
                onClick={zOut}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                {Icons.zoomOut}
              </button>
              <div className="px-3 py-1 font-mono text-xs text-slate-300 min-w-[60px] text-center font-semibold">
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={zIn}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                {Icons.zoomIn}
              </button>
            </div>

            <div className="w-px h-8 bg-slate-700 hidden lg:block mx-1" />

            <ToolBtn
              icon={editMode ? Icons.lock : Icons.edit}
              label={editMode ? "บันทึกผัง" : "จัดผังใหม่"}
              onClick={() => {
                if (editMode) notify("บันทึกตำแหน่งโต๊ะเรียบร้อย", "success");
                setEditMode(!editMode);
              }}
              variant="warning"
              active={editMode}
            />

            {editMode && (
              <ToolBtn
                icon={Icons.reset}
                label="จัดเรียงใหม่"
                onClick={() => setConfirmReset(true)}
                variant="ghost"
              />
            )}

            <ToolBtn
              icon={Icons.plus}
              label="เพิ่มโต๊ะ"
              onClick={addTable}
              variant="primary"
            />
            <ToolBtn
              icon={Icons.refresh}
              onClick={async () => {
                await fetchTables();
                notify("อัปเดตข้อมูลแล้ว", "info");
              }}
              variant="ghost"
              className="px-3"
            />
          </div>
        </div>

        {editMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 flex justify-center items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
            <span className="text-xs font-semibold text-amber-300 tracking-wide">
              โหมดแก้ไข : ลากเพื่อย้ายตำแหน่งโต๊ะ
            </span>
          </div>
        )}
      </header>

      <main
        className="flex-1 overflow-auto relative touch-pan-x touch-pan-y"
        style={{ cursor: editMode ? "default" : "grab" }}
        onWheel={onWheel}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
            width: CW,
            height: CH,
            position: "relative",
            margin: "40px",
            transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none opacity-40"
            width={CW}
            height={CH}
          >
            <defs>
              <pattern
                id="grid"
                width={GRID * 2}
                height={GRID * 2}
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.5" fill="#475569" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {tables.map((t) => (
            <TableNode
              key={t.table_number}
              table={t}
              pos={positions[t.table_number] || { x: 80, y: 80 }}
              zoom={zoom}
              editMode={editMode}
              onDragEnd={handleDragEnd}
              onClick={(tbl) => setSelected(tbl)}
            />
          ))}
        </div>
      </main>

      <footer className="flex-none z-20 px-6 py-3.5 flex items-center justify-between bg-[#0B1120]/80 backdrop-blur-xl border-t border-white/10 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-5 shrink-0">
          {Object.entries(STATUS).map(([, cfg]) => (
            <div key={cfg.label} className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{
                  background: cfg.bg,
                  boxShadow: `0 0 10px ${cfg.bg}60`,
                }}
              />
              <span className="text-xs text-slate-300 font-semibold tracking-wide">
                {cfg.label}
              </span>
            </div>
          ))}
        </div>
      </footer>

      {/* TABLE DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-md">
          <div className="w-full sm:max-w-md rounded-[2rem] animate-modal-in bg-slate-900 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
            <div
              className={`p-8 pb-6 bg-gradient-to-br ${getS(selected.status).gradient} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-0 right-0 p-4 z-10">
                <button
                  onClick={() => setSelected(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-all backdrop-blur-sm"
                >
                  {Icons.x}
                </button>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/30 backdrop-blur-md flex items-center justify-center text-5xl font-black text-white shadow-2xl mb-4">
                  {selected.table_number}
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  โต๊ะหมายเลข {selected.table_number}
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-sm font-bold text-white uppercase tracking-widest">
                    {getS(selected.status).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-4 bg-slate-900 relative">
              {selected.status === "available" ? (
                <button
                  onClick={() => openTable(selected.table_number)}
                  disabled={busy}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    Icons.utensils
                  )}
                  {busy ? "กำลังเปิดโต๊ะ..." : "เปิดโต๊ะรับลูกค้า"}
                </button>
              ) : (
                <button
                  onClick={() => closeTable(selected.table_number)}
                  disabled={busy}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                >
                  {busy ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    Icons.check
                  )}
                  {busy ? "กำลังเคลียร์โต๊ะ..." : "เคลียร์โต๊ะ / เช็คบิล"}
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
                  className="w-full py-4 rounded-2xl font-bold text-base text-indigo-300 flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
                >
                  {Icons.qr}
                  <span>ดู QR Code สั่งอาหาร</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL (Refined & Added Link Back) */}
      {showQR && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[2rem] p-8 animate-modal-in bg-slate-900 border border-white/10 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              {Icons.qr}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              สแกนเพื่อสั่งอาหาร
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              QR Code สำหรับโต๊ะปัจจุบัน
            </p>

            <div className="bg-white rounded-2xl p-4 mb-5 shadow-inner mx-auto inline-block">
              <img src={qr64} alt="QR" className="w-48 h-48 object-contain" />
            </div>

            {/* เพิ่ม Link พร้อมปุ่ม Copy กลับมาแล้วครับ! */}
            <div className="mb-6 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3 shadow-inner">
              <span
                className="text-xs font-mono text-slate-300 truncate text-left w-full"
                title={fullurl}
              >
                {fullurl}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullurl);
                  notify("คัดลอกลิงก์แล้ว!", "success");
                }}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 transition-colors shrink-0"
                title="คัดลอกลิงก์"
              >
                {Icons.copy}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                ปิด
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/30 transition-colors flex items-center justify-center gap-2"
              >
                {Icons.print} พิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET DIALOG */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl p-8 text-center animate-modal-in bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-white bg-amber-500 shadow-lg shadow-amber-500/30">
              {Icons.reset}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              จัดเรียงใหม่ทั้งหมด?
            </h3>
            <p className="text-sm text-slate-400 mb-8">
              ตำแหน่งโต๊ะที่คุณจัดไว้จะถูกล้างและเรียงใหม่ตามค่าเริ่มต้น
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={resetLayout}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition-all"
              >
                ยืนยันการจัดเรียง
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="w-full py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes toast-in {
          0% {
            transform: translate(-50%, -20px) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes modal-in {
          0% {
            transform: scale(0.95) translateY(20px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
            border-width: 2px;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
            border-width: 8px;
          }
        }
        .animate-toast-in {
          animation: toast-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-modal-in {
          animation: modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
