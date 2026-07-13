"use client";

import { ChevronRightIcon } from "lucide-react";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/components/settings/settings-types";

export function SettingsNavigation(props: {
  selected: SettingsSection;
  onSelect: (section: SettingsSection) => void;
}) {
  return (
    <nav className="settings-navigation apple-grouped-list" aria-label="Settings sections">
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;
        const active = props.selected === section.id;
        return (
          <button
            key={section.id}
            type="button"
            className={`settings-navigation-row system-interactive ${active ? "is-active" : ""} ${section.destructive ? "is-destructive" : ""}`}
            onClick={() => props.onSelect(section.id)}
            aria-current={active ? "page" : undefined}
          >
            <span className="settings-navigation-icon"><Icon aria-hidden="true" /></span>
            <span className="settings-navigation-copy">
              <strong>{section.label}</strong>
              <small>{section.description}</small>
            </span>
            <ChevronRightIcon className="settings-navigation-chevron" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
