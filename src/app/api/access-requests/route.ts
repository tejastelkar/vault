import { parseAccessRequestInput } from "@/lib/access/validation";
import {
  accessRequestWindowStart,
  cleanupExpiredRateLimits,
  consumeAccessRequestRateLimit,
  insertAccessRequest,
} from "@/lib/server/access-repository";
import {
  assertSameOrigin,
  fingerprintAccessRequest,
  readBoundedJson,
  RequestSecurityError,
} from "@/lib/server/request-security";

const MAX_REQUEST_BYTES = 8_192;
const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1_000;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function accepted() {
  return json({ accepted: true }, 202);
}

async function cleanupIfSelected(fingerprint: string, now: Date) {
  if (parseInt(fingerprint.slice(0, 2), 16) % 32 !== 0) return;
  const cutoff = new Date(now.getTime() - RATE_LIMIT_RETENTION_MS).toISOString();
  try {
    await cleanupExpiredRateLimits(cutoff);
  } catch {
    // Opportunistic cleanup must never change the public request result.
  }
}

export async function POST(request: Request) {
  let cleanupContext: { fingerprint: string; now: Date } | null = null;

  try {
    assertSameOrigin(request);
    const body = await readBoundedJson(request, MAX_REQUEST_BYTES);

    if (typeof body.website === "string" && body.website.trim()) return accepted();

    const parsed = parseAccessRequestInput(body);
    if (!parsed.ok) return json({ code: "INVALID_REQUEST", errors: parsed.errors }, 400);

    const now = new Date();
    const windowStart = accessRequestWindowStart(now);
    const forwardedIp = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
    const fingerprint = fingerprintAccessRequest(parsed.value.email, forwardedIp, windowStart);
    cleanupContext = { fingerprint, now };

    const allowed = await consumeAccessRequestRateLimit(fingerprint, windowStart);
    if (!allowed) return json({ code: "RATE_LIMITED" }, 429);

    await insertAccessRequest(parsed.value);
    return accepted();
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      const code = error.status === 403
        ? "REQUEST_REJECTED"
        : error.status === 413
          ? "REQUEST_TOO_LARGE"
          : error.code;
      return json({ code }, error.status);
    }
    return json({ code: "REQUEST_UNAVAILABLE" }, 503);
  } finally {
    if (cleanupContext) await cleanupIfSelected(cleanupContext.fingerprint, cleanupContext.now);
  }
}
