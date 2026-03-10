"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { toastVariants } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

const icons = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error:   <XCircle    size={18} className="text-red-500" />,
  info:    <Info       size={18} className="text-blue-500" />,
};

const colors = {
  success: "border-green-200 bg-green-50",
  error:   "border-red-200   bg-red-50",
  info:    "border-blue-200  bg-blue-50",
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`pointer-events-auto flex items-center gap-3 min-w-72 max-w-sm px-4 py-3 rounded-xl border shadow-lg ${colors[t.type]}`}
            >
              {icons[t.type]}
              <span className="flex-1 text-sm text-gray-800">{t.message}</span>
              <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
