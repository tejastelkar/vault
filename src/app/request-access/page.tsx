import type { Metadata } from "next";
import { AuthGateway } from "@/components/auth/AuthGateway";

export const metadata: Metadata = {
  title: "Request access — Telkar Vault",
  description: "Request an invitation to Telkar Vault.",
};

export default function RequestAccessPage() {
  return <AuthGateway initialMode="request-access" />;
}
