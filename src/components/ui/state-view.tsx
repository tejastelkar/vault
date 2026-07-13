"use client";

import { AlertCircleIcon, CloudOffIcon, InboxIcon, ShieldAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  empty: InboxIcon,
  error: AlertCircleIcon,
  offline: CloudOffIcon,
  unsupported: ShieldAlertIcon,
};

export function StateView(props: {
  kind: "empty" | "error" | "offline" | "unsupported";
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}) {
  const Icon = icons[props.kind];
  return (
    <div className={cn("vault-state-view", props.compact && "is-compact")} role={props.kind === "error" ? "alert" : "status"}>
      <span className="vault-state-icon"><Icon aria-hidden="true" /></span>
      <div>
        <h3>{props.title}</h3>
        <p>{props.description}</p>
      </div>
      {props.action && <button type="button" className="system-interactive" onClick={props.action.onClick}>{props.action.label}</button>}
    </div>
  );
}
