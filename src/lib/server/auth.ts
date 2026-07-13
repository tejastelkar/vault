import "server-only";

import { createClient, type User } from "@supabase/supabase-js";

const MAX_ACCESS_TOKEN_LENGTH = 8_192;

function getAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Server authentication is not configured.");

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

export async function requireAuthenticatedUser(accessToken: string): Promise<User> {
  if (!accessToken || accessToken.length > MAX_ACCESS_TOKEN_LENGTH) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await getAuthClient().auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token && token.length <= MAX_ACCESS_TOKEN_LENGTH ? token : null;
}

export async function authenticateRequest(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  try {
    return await requireAuthenticatedUser(token);
  } catch {
    return null;
  }
}
