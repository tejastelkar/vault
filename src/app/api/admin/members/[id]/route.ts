import { AuthorizationError, requireAdmin } from "@/lib/server/access";
import { recordMemberAudit, updateMemberStatus } from "@/lib/server/access-repository";
import {
  assertSameOrigin,
  readBoundedJson,
  RequestSecurityError,
} from "@/lib/server/request-security";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MEMBER_MUTATION_BYTES = 1_024;

function failureResponse(error: unknown) {
  if (error instanceof AuthorizationError || error instanceof RequestSecurityError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  return Response.json({ error: "ADMIN_REQUEST_UNAVAILABLE" }, { status: 503 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    assertSameOrigin(request);
    const { id } = await context.params;
    if (!UUID.test(id)) return Response.json({ error: "INVALID_MEMBER_ID" }, { status: 400 });

    const body = await readBoundedJson(request, MAX_MEMBER_MUTATION_BYTES);
    const keys = Object.keys(body);
    const status = body.status;
    if (
      keys.length !== 1
      || keys[0] !== "status"
      || (status !== "suspended" && status !== "revoked")
    ) {
      return Response.json({ error: "INVALID_MEMBER_UPDATE" }, { status: 400 });
    }

    const member = await updateMemberStatus(id, status);
    if (!member) return Response.json({ error: "MEMBER_NOT_FOUND" }, { status: 404 });

    try {
      await recordMemberAudit({ adminId: admin.id, memberId: id, status });
    } catch {
      console.error("ADMIN_AUDIT_WRITE_FAILED");
    }
    return Response.json({ member });
  } catch (error) {
    return failureResponse(error);
  }
}
