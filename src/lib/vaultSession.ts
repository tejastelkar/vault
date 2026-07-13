"use client";

import { clearKeyCache } from "@/lib/keyCache";
import { clearAllCaches } from "@/lib/vaultCache";

const LEGACY_SESSION_MASTER_KEY = "vault_session_master";

export function clearLocalVaultSession() {
  clearKeyCache();
  clearAllCaches();
  if (typeof window !== "undefined") {
    // Purge master keys persisted by older builds. The unlocked key now lives in memory only.
    window.sessionStorage.removeItem(LEGACY_SESSION_MASTER_KEY);
  }
}
