"use client";

import { useState } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";
import { SETTINGS_SECTIONS, type SettingsProps, type SettingsSection } from "@/components/settings/settings-types";
import { StateView } from "@/components/ui/state-view";

export function Settings({ masterPassword, onLock }: SettingsProps) {
  void masterPassword;
  const [selected, setSelected] = useState<SettingsSection | null>(null);
  const active = selected ?? "account";
  const meta = SETTINGS_SECTIONS.find((section) => section.id === active)!;

  return (
    <div className={`vault-settings vault-system-surface ${selected ? "has-mobile-selection" : ""}`}>
      <header className="settings-page-header"><p className="type-group-label">Telkar Vault</p><h1>Settings</h1><p>Account, security and preferences for this device.</p></header>
      <div className="settings-layout">
        <aside className="settings-sidebar"><SettingsNavigation selected={active} onSelect={setSelected} /></aside>
        <main className="settings-detail">
          <button type="button" className="settings-mobile-back system-interactive" onClick={() => setSelected(null)}><ChevronLeftIcon aria-hidden="true" />Settings</button>
          {active === "account" && <AccountSettings />}
          {active === "appearance" && <AppearanceSettings />}
          {active === "security" && <StateView kind="unsupported" title="Security settings" description="Auto-lock, biometrics, clipboard and sessions are added in the next implementation task." action={{ label: "Lock Vault", onClick: onLock }} compact />}
          {active === "backup" && <StateView kind="empty" title="Data & Backup" description="Encrypted export controls are added after the security foundation." compact />}
          {active === "danger" && <StateView kind="unsupported" title="Danger Zone" description="Destructive actions remain in the existing Profile until fresh local verification is connected." compact />}
          <span className="sr-only">{meta.label}</span>
        </main>
      </div>
    </div>
  );
}
