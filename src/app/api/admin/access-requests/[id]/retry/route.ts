import { AuthorizationError, requireAdmin } from "@/lib/server/access";
import { approveInvitationRequest } from "@/lib/server/invitations";
import { assertSameOrigin, RequestSecurityError } from "@/lib/server/request-security";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failureResponse(error: unknown) {
  if (error instanceof AuthorizationError || error instanceof RequestSecurityError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  return Response.json({ error: "ADMIN_REQUEST_UNAVAILABLE" }, { status: 503 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    assertSameOrigin(request);
    const { id } = await context.params;
    if (!UUID.test(id)) return Response.json({ error: "INVALID_REQUEST_ID" }, { status: 400 });

    const result = await approveInvitationRequest(id, admin.id);
    if (result.kind === "already_processing") {
      return Response.json({ status: "already_processing" }, { status: 409 });
    }
    if (result.kind === "not_found") {
      return Response.json({ error: "REQUEST_NOT_FOUND" }, { status: 404 });
    }
    if (result.kind === "failed") {
      return Response.json({ status: "invite_failed", errorCode: result.code }, { status: 502 });
    }
    return Response.json({ status: "invited", userId: result.userId });
  } catch (error) {
    return failureResponse(error);
  }
}
