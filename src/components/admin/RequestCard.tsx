"use client";

import { AlertCircleIcon, ArrowUpRightIcon, Clock3Icon, SendIcon } from "lucide-react";
import type { AdminAccessRequest } from "./types";
import styles from "@/app/admin/admin.module.css";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function RequestCard(props: {
  request: AdminAccessRequest;
  sending: boolean;
  onApprove: (request: AdminAccessRequest, trigger: HTMLButtonElement) => void;
}) {
  const failed = props.request.status === "invite_failed";
  const invited = props.request.status === "invited" || props.request.status === "active";
  const processing = props.request.status === "inviting" || props.sending;

  return (
    <article className={styles.requestCard} data-status={props.request.status}>
      <div className={styles.requestCardTop}>
        <span className={styles.avatar} aria-hidden="true">{initials(props.request.fullName)}</span>
        <span className={styles.requestIdentity}>
          <strong>{props.request.fullName}</strong>
          <small>{props.request.email}</small>
        </span>
        <span className={styles.statusPill} data-tone={failed ? "danger" : invited ? "success" : "neutral"}>
          {failed ? <AlertCircleIcon aria-hidden="true" /> : invited ? <SendIcon aria-hidden="true" /> : <Clock3Icon aria-hidden="true" />}
          {failed ? "Needs retry" : invited ? "Invited" : processing ? "Sending" : "Pending"}
        </span>
      </div>
      <div className={styles.requestMeta}>
        <span>Requested {formatDate(props.request.requestedAt)}</span>
        {props.request.inviteAttempts > 0 && <span>{props.request.inviteAttempts} attempt{props.request.inviteAttempts === 1 ? "" : "s"}</span>}
      </div>
      {!invited && (
        <button
          type="button"
          className={`${styles.cardAction} ${styles.touchTarget}`}
          disabled={processing}
          onClick={(event) => props.onApprove(props.request, event.currentTarget)}
        >
          {processing ? "Sending invitation" : failed ? "Retry" : "Review"}
          {!processing && <ArrowUpRightIcon aria-hidden="true" />}
        </button>
      )}
    </article>
  );
}
