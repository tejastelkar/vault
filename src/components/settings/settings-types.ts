import type { ComponentType } from "react";
import { AlertTriangleIcon, ArchiveIcon, PaletteIcon, ShieldCheckIcon, UserCircleIcon, ScaleIcon } from "lucide-react";

export type SettingsSection = "account" | "security" | "appearance" | "backup" | "danger" | "legal";

export interface SettingsProps {
  masterPassword: string;
  onLock: () => void;
}

export interface SettingsSectionMeta {
  id: SettingsSection;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  destructive?: boolean;
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  { id: "account", label: "Account", description: "Photo, name and email", icon: UserCircleIcon },
  { id: "security", label: "Security", description: "Unlock, sessions and clipboard", icon: ShieldCheckIcon },
  { id: "appearance", label: "Appearance", description: "System, Light or Dark", icon: PaletteIcon },
  { id: "backup", label: "Data & Backup", description: "Encrypted export and vault data", icon: ArchiveIcon },
  { id: "legal", label: "Legal & Privacy", description: "Terms, Privacy Policy, and Compliance", icon: ScaleIcon },
  { id: "danger", label: "Danger Zone", description: "Destructive account actions", icon: AlertTriangleIcon, destructive: true },
];
