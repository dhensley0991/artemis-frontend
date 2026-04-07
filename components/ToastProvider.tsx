"use client";

/**
 * Artemis Toast System
 * --------------------
 * Reusable global toast provider for success / error / info messages.
 * Wrap the app in this provider once, then call useToast() anywhere.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ToastContextType = {
  showToast: (args: {
    title: string;
    message?: string;
    variant?: ToastVariant;
    duration?: number;
  }) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      title,
      message,
      variant = "info",
      duration = 3500,
    }: {
      title: string;
      message?: string;
      variant?: ToastVariant;
      duration?: number;
    }) => {
      const id = idRef.current++;

      setToasts((prev) => [
        ...prev,
        {
          id,
          title,
          message,
          variant,
        },
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div className="pointer-events-none fixed top-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const variantStyles =
            toast.variant === "success"
              ? "border-emerald-500/40 bg-[#0F1A14] text-emerald-100"
              : toast.variant === "error"
              ? "border-red-500/40 bg-[#1A1010] text-red-100"
              : "border-[#D4AF37]/40 bg-[#111111] text-[#F5E7A1]";

          const accentStyles =
            toast.variant === "success"
              ? "bg-emerald-400"
              : toast.variant === "error"
              ? "bg-red-400"
              : "bg-[#D4AF37]";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-md ${variantStyles}`}
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${accentStyles}`} />

              <div className="px-4 py-4 pl-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-wide">
                      {toast.title}
                    </p>

                    {toast.message ? (
                      <p className="mt-1 text-sm text-white/80">{toast.message}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="rounded-md px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}