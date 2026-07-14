"use client";

import { AlertCircleIcon, ArrowUpRightIcon, Clock3Icon, SendIcon } from "lucide-react";
import { StateView } from "@/components/ui/state-view";
import { RequestCard } from "./RequestCard";
import type { AdminAccessRequest } from "./types";
import styles from "@/app/admin/admin.module.css";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function relativeDate(value: string) {
  const days = Math.round((Date.now() - Date.parse(value)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function RequestQueue(props: {
  items: AdminAccessRequest[];
  sendingId: string | null;
  searchActive: boolean;
  error: string | null;
  onRetryLoad: () => void;
  onApprove: (request: AdminAccessRequest, trigger: HTMLButtonElement) => void;
}) {
  if (props.error) {
    return <StateView kind="error" title="Requests unavailable" description={props.error} action={{ label: "Try again", onClick: props.onRetryLoad }} />;
  }

  if (props.items.length === 0) {
    return props.searchActive
      ? <div data-state="search-empty"><StateView kind="empty" title="No matching requests" description="Try a name or email with fewer terms." /></div>
      : <div data-state="pending-empty"><StateView kind="empty" title="Nothing waiting" description="New access requests will appear here for review." /></div>;
  }

  return (
    <>
      <div className={styles.desktopQueue} role="list" aria-label="Access requests">
        {props.items.map((request) => {
          const sending = props.sendingId === request.id || request.status === "inviting";
          const failed = request.status === "invite_failed";
          const invited = request.status === "invited" || request.status === "active";
          return (
            <article className={styles.requestRow} data-status={request.status} key={request.id} role="listitem">
              <span className={styles.avatar} aria-hidden="true">{initials(request.fullName)}</span>
              <span className={styles.requestIdentity}>
                <strong>{request.fullName}</strong>
                <small>{request.email}</small>
              </span>
              <span className={styles.requestTime}>{relativeDate(request.requestedAt)}</span>
              <span className={styles.statusPill} data-tone={failed ? "danger" : invited ? "success" : "neutral"}>
                {failed ? <AlertCircleIcon aria-hidden="true" /> : invited ? <SendIcon aria-hidden="true" /> : <Clock3Icon aria-hidden="true" />}
                {failed ? "Needs retry" : invited ? "Invited" : sending ? "Sending" : "Pending"}
              </span>
              {!invited && (
                <button
                  type="button"
                  className={styles.rowAction}
                  disabled={sending}
                  onClick={(event) => props.onApprove(request, event.currentTarget)}
                >
                  {sending ? "Sending invitation" : failed ? "Retry" : "Review"}
                  {!sending && <ArrowUpRightIcon aria-hidden="true" />}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <div className={styles.mobileQueue}>
        {props.items.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            sending={props.sendingId === request.id}
            onApprove={props.onApprove}
          />
        ))}
      </div>
    </>
  );
}
