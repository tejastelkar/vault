"use client";

import { useEffect, useState } from "react";

export interface ConnectivityState {
  isOnline: boolean;
  lastChangedAt: number;
}

export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>(() => ({
    isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
    lastChangedAt: Date.now(),
  }));

  useEffect(() => {
    const update = () => setState({ isOnline: navigator.onLine, lastChangedAt: Date.now() });
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return state;
}
