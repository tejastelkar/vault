"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadVaultPreferences,
  subscribeVaultPreferences,
  type VaultPreferences,
} from "@/lib/vaultPreferences";

export function useAutoLock(options: { enabled: boolean; onLock: () => void }): void {
  const { enabled, onLock } = options;
  const [preferences, setPreferences] = useState<VaultPreferences>(() => loadVaultPreferences());
  const onLockRef = useRef(onLock);
  const timerRef = useRef<number | null>(null);
  const lastResetRef = useRef(0);

  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  useEffect(() => subscribeVaultPreferences(setPreferences), []);

  useEffect(() => {
    if (!enabled) return;
    const minutes = preferences.autoLockMinutes;

    const clearTimer = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const schedule = (force = false) => {
      if (minutes === 0) return;
      const now = Date.now();
      if (!force && now - lastResetRef.current < 1000) return;
      lastResetRef.current = now;
      clearTimer();
      timerRef.current = window.setTimeout(() => onLockRef.current(), minutes * 60_000);
    };

    const handleActivity = () => schedule(false);
    const handleVisibility = () => {
      if (document.hidden && minutes === 0) onLockRef.current();
      else if (!document.hidden) schedule(true);
    };
    const handleBlur = () => {
      if (minutes === 0) onLockRef.current();
    };

    schedule(true);
    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("focus", handleActivity);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimer();
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, preferences.autoLockMinutes]);
}
