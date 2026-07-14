import type { AccessRequestStatus, MemberStatus } from "@/lib/access/types";

export type SafeInvitationErrorCode =
  | "DELIVERY_FAILED"
  | "ALREADY_INVITED"
  | "RATE_LIMITED"
  | "CONFIGURATION_ERROR";

export type AdminAccessRequest = {
  id: string;
  fullName: string;
  email: string;
  status: AccessRequestStatus;
  requestedAt: string;
  updatedAt: string;
  inviteStartedAt: string | null;
  invitedAt: string | null;
  inviteAttempts: number;
  lastErrorCode: SafeInvitationErrorCode | null;
};

export type AdminMember = {
  id: string;
  email: string;
  status: MemberStatus;
  accessRequestId: string | null;
  approvedAt: string;
  activatedAt: string | null;
  createdAt: string;
};

export type AdminRecord = AdminAccessRequest | AdminMember;
export type AdminView = "pending" | "invited" | "members" | "activity";
export type PendingFilter = "pending" | "inviting" | "invite_failed";
export type MemberFilter = "all" | MemberStatus;

export function isAccessRequest(item: AdminRecord): item is AdminAccessRequest {
  return "fullName" in item;
}
