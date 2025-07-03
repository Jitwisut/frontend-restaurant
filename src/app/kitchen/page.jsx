"use client";
/**
 * Kitchen Dashboard – JSX Version (no TypeScript)
 * ----------------------------------------------
 * • เหมาะสำหรับโปรเจ็กต์ที่เซ็ตเป็น `.jsx` / ไม่มี TypeScript
 * • Logic ทุกอย่างเหมือนเวอร์ชันก่อน แต่ตัด type annotation ออก
 */

import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

/* -------------------- Constants -------------------- */
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const WS_BASE =
  process.env.NEXT_PUBLIC_API_WS ||
  "ws://influential-denice-jitwisutthobut-4bb0d3cf.koyeb.app";

export default function KitchenDashboard() {
  /* identity / state */
  const [profile, setProfile] = useState(null); // { username, role, wsToken? }
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  /* STEP 1: sessionStorage > STEP 2: /profile > STEP 3: prompt */
  useEffect(() => {
    const cached = sessionStorage.getItem("kitchenProfile");
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        /* ignore */
      }
    }

    axios
      .get(`${API_BASE}/profile/`, { withCredentials: true })
      .then((r) => {
        const p = {
          username: r.data.username,
          role: r.data.role,
          wsToken: r.data.wsToken,
        };
        sessionStorage.setItem("kitchenProfile", JSON.stringify(p));
        setProfile(p);
      })
      .catch(() => {
        const name = prompt("กรุณาใส่ชื่อครัว (เช่น kitchen1):")?.trim();
        if (name) {
          const p = { username: name, role: "kitchen" };
          sessionStorage.setItem("kitchenProfile", JSON.stringify(p));
          setProfile(p);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /* WebSocket */
  const [connected, setConnected] = useState(false);
  const [queue, setQueue] = useState([]); // [{ orderId, items }]
  const wsRef = useRef(null);
  const pingRef = useRef();
  const retryRef = useRef({ attempts: 0, timer: null });

  const connect = useCallback(() => {
    if (!profile) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const url =
      `${WS_BASE}/ws/${profile.username}?role=${profile.role}` +
      (profile.wsToken ? `&token=${profile.wsToken}` : "");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryRef.current.attempts = 0;
      pingRef.current = setInterval(() => {
        ws.readyState === WebSocket.OPEN && ws.send("ping");
      }, 30_000);
    };

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === "order") {
          audioRef.current.play(); // เล่นเสียงแจ้งเตือน
          setQueue((q) => [
            ...q,
            {
              orderId: d.orderId || Date.now().toString(),
              items: d.menu?.items || [],
            },
          ]);
        } else if (d.type !== "pong") {
          console.warn("WS message (system):", d);
        }
      } catch (err) {
        console.error("WS: JSON parse error", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      clearInterval(pingRef.current);
      const delay = Math.min(2 ** retryRef.current.attempts * 1000, 30_000);
      retryRef.current.attempts += 1;
      retryRef.current.timer = setTimeout(connect, delay);
    };
  }, [profile]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearInterval(pingRef.current);
      clearTimeout(retryRef.current.timer);
    };
  }, [connect]);

  const sendStatus = (orderId, status) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "status", orderId, status }));
      if (status === "done")
        setQueue((q) => q.filter((o) => o.orderId !== orderId));
    }
  };

  /* UI */
  if (loading) return <p className="p-6">กำลังโหลด…</p>;
  if (!profile)
    return <p className="p-6 text-red-600">ไม่สามารถระบุตัวครัวได้</p>;

  return (
    <div className="min-h-screen p-6 space-y-4">
      <header className="flex items-center gap-4 text-xl font-bold">
        🍽️ Kitchen —{" "}
        <span className="text-base font-normal">{profile.username}</span>
        <span className={connected ? "text-green-600" : "text-red-600"}>
          {connected ? "● Online" : "● Offline"}
        </span>
      </header>
      <audio ref={audioRef} src="/sound/sound.mp4" preload="auto" />
      {queue.length === 0 ? (
        <p className="text-gray-500 mt-16 text-center">ยังไม่มีออร์เดอร์</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {queue.map((o) => (
            <div key={o.orderId} className="border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-lg">
                #{o.orderId.slice(0, 6)}
              </h2>
              <ul className="text-sm space-y-1">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.name}</span>
                    <span>x{i.qty}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2 text-sm">
                <button
                  onClick={() => sendStatus(o.orderId, "cooking")}
                  className="flex-1 bg-yellow-300/90 hover:bg-yellow-300 px-3 py-1 rounded"
                >
                  🍳 เริ่มทำ
                </button>
                <button
                  onClick={() => sendStatus(o.orderId, "done")}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded"
                >
                  ✅ เสร็จแล้ว
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
