import { AuthorizationError, getMembershipForUser, requireUser } from "@/lib/server/access";
import { activateInvitedMember, recordActivationAudit } from "@/lib/server/access-repository";
import { assertSameOrigin, readBoundedJson, RequestSecurityError } from "@/lib/server/request-security";

function failure(error: unknown) {
  if (error instanceof AuthorizationError || error instanceof RequestSecurityError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  return Response.json({ error: "ONBOARDING_UNAVAILABLE" }, { status: 503 });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readBoundedJson(request, 128);
    if (Object.keys(body).length !== 1 || body.completed !== true) {
      return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const user = await requireUser();
    const membership = await getMembershipForUser(user.id);
    if (membership?.status !== "invited") {
      return Response.json({ error: "MEMBERSHIP_NOT_INVITED" }, { status: 403 });
    }

    await activateInvitedMember(user.id);
    try {
      await recordActivationAudit(user.id);
    } catch (auditError) {
      console.error("Activation audit unavailable", auditError instanceof Error ? auditError.name : "unknown");
    }
    return Response.json({ activated: true });
  } catch (error) {
    return failure(error);
  }
}
