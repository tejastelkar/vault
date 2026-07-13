"use client";

import { loadVaultPreferences } from "@/lib/vaultPreferences";

export async function copySensitiveText(value: string): Promise<{ scheduled: boolean }> {
  await navigator.clipboard.writeText(value);
  const seconds = loadVaultPreferences().clipboardClearSeconds;
  if (seconds === 0) return { scheduled: false };

  window.setTimeout(async () => {
    try {
      if ((await navigator.clipboard.readText()) === value) {
        await navigator.clipboard.writeText("");
      }
    } catch {
      // Clipboard reads can be denied after the original user-initiated write.
    }
  }, seconds * 1000);

  return { scheduled: true };
}
