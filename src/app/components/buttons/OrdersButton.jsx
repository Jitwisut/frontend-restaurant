"use client";
import { motion } from "framer-motion";

export default function OrdersButton({ onClick }) {
  return (
    <motion.button
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 30px rgba(249, 115, 22, 0.3)",
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xl font-bold rounded-2xl shadow-xl"
    >
      ดูรายการอาหารที่สั่งล่าสุด 🍽️
    </motion.button>
  );
}
