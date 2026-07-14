"use client";

import { Loader2Icon, SendIcon } from "lucide-react";
import { AdaptiveSheet, AdaptiveSheetBody, AdaptiveSheetFooter } from "@/components/ui/adaptive-sheet";
import type { AdminAccessRequest } from "./types";
import styles from "@/app/admin/admin.module.css";

export function ApprovalSheet(props: {
  request: AdminAccessRequest | null;
  open: boolean;
  sending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const request = props.request;
  const retry = request?.status === "invite_failed";

  return (
    <AdaptiveSheet
      open={props.open}
      onOpenChange={(open) => { if (!props.sending) props.onOpenChange(open); }}
      title={retry ? "Retry invitation" : "Approve access"}
      description="Confirm the exact recipient before sending."
      size="sm"
      className={styles.approvalSheet}
    >
      <AdaptiveSheetBody className={styles.approvalBody}>
        {request && (
          <>
            <span className={styles.approvalIcon}><SendIcon aria-hidden="true" /></span>
            <p className={styles.approvalLead}>An account invitation will be sent to:</p>
            <div className={styles.approvalIdentity}>
              <strong>{request.fullName}</strong>
              <span>{request.email}</span>
            </div>
            <p className={styles.approvalNote}>The recipient will set a sign-in password first. Their existing vault master key remains separate.</p>
          </>
        )}
      </AdaptiveSheetBody>
      <AdaptiveSheetFooter className={styles.approvalFooter}>
        <button type="button" className={styles.secondaryButton} disabled={props.sending} onClick={() => props.onOpenChange(false)}>Cancel</button>
        <button type="button" className={styles.primaryButton} disabled={props.sending || !request} onClick={props.onConfirm}>
          {props.sending ? <><Loader2Icon className={styles.spinner} aria-hidden="true" />Sending invitation</> : retry ? "Retry invitation" : "Send invitation"}
        </button>
      </AdaptiveSheetFooter>
    </AdaptiveSheet>
  );
}
