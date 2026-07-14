"use client";

import { createContext, useContext, useMemo, useState } from "react";

type VaultKeyContextValue = {
  masterKey: string | null;
  setMasterKey: (value: string) => void;
  clearMasterKey: () => void;
};

const VaultKeyContext = createContext<VaultKeyContextValue | null>(null);

export function VaultKeyProvider({ children }: { children: React.ReactNode }) {
  const [masterKey, setMasterKeyState] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      masterKey,
      setMasterKey: setMasterKeyState,
      clearMasterKey: () => setMasterKeyState(null),
    }),
    [masterKey],
  );

  return <VaultKeyContext.Provider value={value}>{children}</VaultKeyContext.Provider>;
}

export function useVaultKey() {
  const value = useContext(VaultKeyContext);
  if (!value) throw new Error("useVaultKey must be used within VaultKeyProvider");
  return value;
}
