type PasswordUpdateInput = {
  supabaseUrl: string;
  publishableKey: string;
  accessToken: string;
  password: string;
};

export async function putUserPasswordWithToken(
  input: PasswordUpdateInput,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(`${input.supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      apikey: input.publishableKey,
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ password: input.password }),
  });

  if (!response.ok) {
    throw new Error("Your sign-in password could not be updated. Please try again.");
  }
}
