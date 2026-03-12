"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import OrdersView from "./OrdersView";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE}/order/orderhistory`,
        {},
        { withCredentials: true }
      );
      setOrders(res.data.order ?? []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(
        err.response?.data?.message ??
          "ไม่สามารถดึงข้อมูลออเดอร์ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-orange-50 via-amber-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-600 font-medium">
            กำลังโหลดข้อมูลออเดอร์...
          </p>
        </div>
      </main>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-orange-50 via-amber-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Data ---------- */
  return <OrdersView orders={orders} />;
}
