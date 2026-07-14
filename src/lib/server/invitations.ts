import "server-only";

import { approveAccessRequest, type InvitationErrorCode } from "@/lib/access/approval";
import {
  claimAccessRequestInvitation,
  completeAccessRequestInvitation,
  markAccessRequestInvitationFailed,
  recordInviteAudit,
} from "@/lib/server/access-repository";
import { requiredAppUrl } from "@/lib/server/request-security";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

const AUTH_USER_PAGE_SIZE = 1_000;
const MAX_AUTH_USER_PAGES = 10_000;

class InvitationProviderError extends Error {
  constructor(readonly safeCode: InvitationErrorCode) {
    super(safeCode);
    this.name = "InvitationProviderError";
  }
}

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { code: "", message: "", status: 0 };
  const record = error as Record<string, unknown>;
  return {
    code: typeof record.code === "string" ? record.code.toLowerCase() : "",
    message: typeof record.message === "string" ? record.message.toLowerCase() : "",
    status: typeof record.status === "number" ? record.status : 0,
  };
}

export function mapInvitationError(error: unknown): InvitationErrorCode {
  if (error instanceof InvitationProviderError) return error.safeCode;
  const { code, message, status } = errorDetails(error);
  const searchable = `${code} ${message}`;

  if (
    searchable.includes("supabase_admin_not_configured")
    || searchable.includes("app_url_not_configured")
    || searchable.includes("app_url_invalid")
    || searchable.includes("invalid redirect")
    || status === 400
  ) {
    if (searchable.includes("already") || searchable.includes("exists")) return "ALREADY_INVITED";
    return "CONFIGURATION_ERROR";
  }
  if (status === 429 || searchable.includes("rate_limit") || searchable.includes("rate limit")) {
    return "RATE_LIMITED";
  }
  if (
    searchable.includes("already")
    || searchable.includes("user_already_exists")
    || searchable.includes("email_exists")
  ) {
    return "ALREADY_INVITED";
  }
  return "DELIVERY_FAILED";
}

export async function reconcileInvitationUser(email: string) {
  const admin = createSupabaseAdminClient();
  const canonicalEmail = email.trim().toLowerCase();

  for (let page = 1; page <= MAX_AUTH_USER_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USER_PAGE_SIZE,
    });
    if (error) throw new InvitationProviderError(mapInvitationError(error));

    const match = data.users.find((user) => user.email?.trim().toLowerCase() === canonicalEmail);
    if (match) return { userId: match.id };
    if (data.users.length < AUTH_USER_PAGE_SIZE) return null;
  }

  throw new InvitationProviderError("CONFIGURATION_ERROR");
}

export async function inviteAccessUser(email: string, fullName: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${requiredAppUrl()}/accept-invite`,
  });

  if (error) throw new InvitationProviderError(mapInvitationError(error));
  if (!data.user?.id) throw new InvitationProviderError("DELIVERY_FAILED");
  return { userId: data.user.id };
}

export async function approveInvitationRequest(requestId: string, adminId: string) {
  return approveAccessRequest(
    {
      claim: claimAccessRequestInvitation,
      reconcile: reconcileInvitationUser,
      invite: inviteAccessUser,
      markInvited: completeAccessRequestInvitation,
      markFailed: markAccessRequestInvitationFailed,
      mapError: mapInvitationError,
      audit: recordInviteAudit,
      reportAuditFailure: () => {
        console.error("ADMIN_AUDIT_WRITE_FAILED");
      },
      now: () => new Date().toISOString(),
    },
    { requestId, adminId },
  );
}
