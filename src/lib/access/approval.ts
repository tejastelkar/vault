export type InvitationErrorCode =
  | "DELIVERY_FAILED"
  | "ALREADY_INVITED"
  | "RATE_LIMITED"
  | "CONFIGURATION_ERROR";

export type ClaimResult =
  | { kind: "claimed"; request: { id: string; email: string; fullName: string; attempt: number } }
  | { kind: "already_processing" }
  | { kind: "not_found" };

export type AuditEntry = {
  action: "invite";
  resultCode: string;
  requestId: string;
  adminId: string;
  memberUserId?: string;
};

export type ApprovalDependencies = {
  claim: (requestId: string, adminId: string, now: string) => Promise<ClaimResult>;
  reconcile: (email: string) => Promise<{ userId: string } | null>;
  invite: (email: string, fullName: string) => Promise<{ userId: string }>;
  markInvited: (
    requestId: string,
    adminId: string,
    userId: string,
    attempt: number,
    now: string,
  ) => Promise<void>;
  markFailed: (
    requestId: string,
    adminId: string,
    code: string,
    attempt: number,
    now: string,
  ) => Promise<void>;
  mapError: (error: unknown) => InvitationErrorCode;
  audit: (entry: AuditEntry) => Promise<void>;
  reportAuditFailure?: (error: unknown) => void;
  now: () => string;
};

export async function approveAccessRequest(
  deps: ApprovalDependencies,
  args: { requestId: string; adminId: string },
) {
  const claim = await deps.claim(args.requestId, args.adminId, deps.now());
  if (claim.kind !== "claimed") return claim;

  let result:
    | { kind: "invited"; userId: string }
    | { kind: "failed"; code: InvitationErrorCode };
  let auditEntry: AuditEntry;

  try {
    const existing = await deps.reconcile(claim.request.email);
    const invited = existing ?? await deps.invite(claim.request.email, claim.request.fullName);
    await deps.markInvited(
      args.requestId,
      args.adminId,
      invited.userId,
      claim.request.attempt,
      deps.now(),
    );
    result = { kind: "invited", userId: invited.userId };
    auditEntry = {
      action: "invite",
      resultCode: existing ? "RECONCILED" : "INVITED",
      requestId: args.requestId,
      adminId: args.adminId,
      memberUserId: invited.userId,
    };
  } catch (error) {
    const code = deps.mapError(error);
    await deps.markFailed(
      args.requestId,
      args.adminId,
      code,
      claim.request.attempt,
      deps.now(),
    );
    result = { kind: "failed", code };
    auditEntry = {
      action: "invite",
      resultCode: code,
      requestId: args.requestId,
      adminId: args.adminId,
    };
  }

  try {
    await deps.audit(auditEntry);
  } catch (auditError) {
    deps.reportAuditFailure?.(auditError);
  }

  return result;
}
