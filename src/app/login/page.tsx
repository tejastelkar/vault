import { AuthGateway } from "@/components/auth/AuthGateway";
import { parseSafeNextPath } from "@/lib/access/validation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const nextPath = parseSafeNextPath(typeof next === "string" ? next : null);

  return <AuthGateway initialMode="sign-in" nextPath={nextPath} />;
}
