import "server-only";

import type { AccessRequestInput } from "@/lib/access/types";
import { createSupabaseAdminClient } from "@/lib/server/supabase-admin";

export const ACCESS_REQUEST_WINDOW_MS = 15 * 60 * 1_000;

export function accessRequestWindowStart(now: Date) {
  return new Date(Math.floor(now.getTime() / ACCESS_REQUEST_WINDOW_MS) * ACCESS_REQUEST_WINDOW_MS).toISOString();
}

export async function consumeAccessRequestRateLimit(fingerprint: string, windowStart: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("consume_access_request_rate_limit", {
    p_fingerprint: fingerprint,
    p_window_started_at: windowStart,
    p_limit: 5,
  });

  if (error || typeof data !== "boolean") throw new Error("ACCESS_REQUEST_RATE_LIMIT_FAILED");
  return data;
}

export async function insertAccessRequest(input: AccessRequestInput) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("access_requests")
    .upsert(
      { full_name: input.fullName, email: input.email },
      { onConflict: "email", ignoreDuplicates: true },
    );

  if (error) throw new Error("ACCESS_REQUEST_INSERT_FAILED");
}

export async function cleanupExpiredRateLimits(cutoff: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("access_request_rate_limits")
    .delete()
    .lt("window_started_at", cutoff);

  if (error) throw new Error("ACCESS_REQUEST_CLEANUP_FAILED");
}
