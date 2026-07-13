"use client";

import { clearKeyCache } from "@/lib/keyCache";
import { clearAllCaches } from "@/lib/vaultCache";

export const SESSION_MASTER_KEY = "vault_session_master";

export function clearLocalVaultSession() {
  clearKeyCache();
  clearAllCaches();
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_MASTER_KEY);
  }
}
