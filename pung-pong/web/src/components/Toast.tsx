import React, { useEffect, useState, useCallback } from "react";

interface T { id: string; message: string; type: "success" | "error" | "info" }
let addFn: ((m: string, t?: T["type"]) => void) | null = null;
export function showToast(m: string, t: T["type"] = "info") { addFn?.(m, t); }

export default function ToastContainer() {
  const [toasts, setToasts] = useState<T[]>([]);
  const add = useCallback((message: string, type: T["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  useEffect(() => { addFn = add; return () => { addFn = null; }; }, [add]);

  const bg = { success: "bg-mint-500/90", error: "bg-coral-500/90", info: "bg-pp-500/90" };
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] space-y-2 w-[90%] max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`${bg[t.type]} text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-slide-down backdrop-blur-lg text-center`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
