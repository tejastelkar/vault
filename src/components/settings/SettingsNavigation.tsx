"use client";

import { ChevronRightIcon } from "lucide-react";
import { motion } from "framer-motion";
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
            className={`settings-navigation-row system-interactive relative ${active ? "is-active !bg-transparent" : ""} ${section.destructive ? "is-destructive" : ""}`}
            onClick={() => props.onSelect(section.id)}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <motion.div
                layoutId="settings-active-bg"
                className="absolute inset-0 bg-primary/10 rounded-[10px]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                style={{ zIndex: 0 }}
              />
            )}
            <span className="settings-navigation-icon relative z-10"><Icon aria-hidden="true" /></span>
            <span className="settings-navigation-copy relative z-10">
              <strong>{section.label}</strong>
              <small>{section.description}</small>
            </span>
            <ChevronRightIcon className="settings-navigation-chevron relative z-10" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
