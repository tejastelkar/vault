import { supabase } from "@/lib/supabase";

export async function getVaultAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your session has expired. Sign in again to continue.");
  }
  return data.session.access_token;
}

export async function vaultFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const accessToken = await getVaultAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(input, { ...init, headers });
}
