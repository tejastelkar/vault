"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangleIcon, CheckIcon, InfoIcon, XCircleIcon, XIcon } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  durationMs?: number | null;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}

export interface ToastHandle {
  id: string;
  dismiss: () => void;
}

interface ToastRecord extends Required<Pick<ToastOptions, "message" | "type">> {
  id: string;
  durationMs: number | null;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}

interface ToastContextValue {
  toast: (messageOrOptions: string | ToastOptions, legacyType?: ToastType) => ToastHandle;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const ICONS = { success: CheckIcon, error: XCircleIcon, info: InfoIcon, warning: AlertTriangleIcon };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const prefersReducedMotion = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback((messageOrOptions: string | ToastOptions, legacyType: ToastType = "success"): ToastHandle => {
    const options: ToastOptions = typeof messageOrOptions === "string"
      ? { message: messageOrOptions, type: legacyType }
      : messageOrOptions;
    const id = crypto.randomUUID();
    const record: ToastRecord = {
      id,
      message: options.message,
      type: options.type ?? "success",
      durationMs: options.durationMs === undefined ? 3200 : options.durationMs,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
    };
    setToasts((current) => [...current.slice(-2), record]);
    if (record.durationMs !== null) {
      timers.current.set(id, setTimeout(() => dismiss(id), record.durationMs));
    }
    return { id, dismiss: () => dismiss(id) };
  }, [dismiss]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="vault-toast-region" aria-label="Notifications">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => {
            const Icon = ICONS[item.type];
            const hasAction = Boolean(item.actionLabel && item.onAction);
            return (
              <motion.div
                key={item.id}
                layout={!prefersReducedMotion}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", bounce: 0.18, duration: 0.36 }}
                className="vault-toast system-motion"
                role={item.type === "error" ? "alert" : "status"}
              >
                <span className={`vault-toast-icon is-${item.type}`}><Icon aria-hidden="true" /></span>
                <span className="vault-toast-message">{item.message}</span>
                {hasAction && (
                  <button
                    type="button"
                    className="vault-toast-action system-interactive"
                    onClick={async () => {
                      await item.onAction?.();
                      dismiss(item.id);
                    }}
                  >
                    {item.actionLabel}
                  </button>
                )}
                <button type="button" className="vault-toast-close system-interactive" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
                  <XIcon aria-hidden="true" />
                </button>
                {item.durationMs !== null && !prefersReducedMotion && (
                  <span className="vault-toast-deadline" style={{ animationDuration: `${item.durationMs}ms` }} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context.toast;
}
