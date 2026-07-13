export const ACCESS_REQUEST_STATUSES = ["pending", "inviting", "invited", "invite_failed", "active"] as const;
export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];

export const MEMBER_STATUSES = ["invited", "active", "suspended", "revoked"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export type AccessRequestInput = { fullName: string; email: string };
export type InviteCursor = { requestedAt: string; id: string };
export type FieldErrors = Partial<Record<"fullName" | "email" | "form", string>>;
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };
