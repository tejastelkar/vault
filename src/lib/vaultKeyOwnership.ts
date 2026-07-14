const SUPABASE_USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ACCESS_TOKEN_LENGTH = 8_192;

export type AuthenticatedUserPredicate = (expectedUserId: string) => boolean;

function normalizeVaultUserId(value: unknown): string | null {
  if (typeof value !== "string" || !SUPABASE_USER_ID.test(value)) return null;
  return value.toLowerCase();
}

export function requireAuthenticatedVaultUserId(value: unknown): string {
  const userId = normalizeVaultUserId(value);
  if (!userId) throw new Error("A valid authenticated user is required for local vault unlock.");
  return userId;
}

export function canUseVaultWrapper(ownerUserId: unknown, authenticatedUserId: unknown): boolean {
  const owner = normalizeVaultUserId(ownerUserId);
  const current = normalizeVaultUserId(authenticatedUserId);
  return owner !== null && current !== null && owner === current;
}

export function requireVaultWrapperOwner(ownerUserId: unknown, authenticatedUserId: unknown, label: string): string {
  const current = requireAuthenticatedVaultUserId(authenticatedUserId);
  const owner = normalizeVaultUserId(ownerUserId);
  if (!owner) throw new Error(`${label} enrollment is missing a valid owner.`);
  if (owner !== current) throw new Error(`${label} enrollment belongs to another account.`);
  return owner;
}

export function shouldClearVaultKeyForAuthChange(previousUserId: unknown, currentUserId: unknown): boolean {
  const previous = normalizeVaultUserId(previousUserId);
  const current = normalizeVaultUserId(currentUserId);
  return current === null || previous !== current;
}

export function commitVaultKeyForExpectedUser(
  masterKey: string,
  expectedUserId: unknown,
  currentUserId: unknown,
  commit: (masterKey: string, ownerUserId: string) => void,
): boolean {
  const expected = normalizeVaultUserId(expectedUserId);
  const current = normalizeVaultUserId(currentUserId);
  if (!expected || expected !== current) return false;

  commit(masterKey, expected);
  return true;
}

export function commitForExpectedAuthenticatedUser(
  expectedUserId: unknown,
  isAuthenticatedUserCurrent: AuthenticatedUserPredicate,
  commit: (ownerUserId: string) => void,
): boolean {
  const expected = normalizeVaultUserId(expectedUserId);
  if (!expected || !isAuthenticatedUserCurrent(expected)) return false;

  commit(expected);
  return true;
}

export async function captureAccessTokenForExpectedUser(
  expectedUserId: unknown,
  readAccessToken: () => Promise<unknown>,
  verifyTokenUserId: (accessToken: string) => Promise<unknown>,
): Promise<string> {
  const expected = requireAuthenticatedVaultUserId(expectedUserId);
  const accessToken = await readAccessToken();
  if (typeof accessToken !== "string" || !accessToken || accessToken.length > MAX_ACCESS_TOKEN_LENGTH) {
    throw new Error("Your session has expired. Sign in again to continue.");
  }

  const verifiedUserId = normalizeVaultUserId(await verifyTokenUserId(accessToken));
  if (verifiedUserId !== expected) {
    throw new Error("The captured access token does not belong to the expected authenticated user.");
  }
  return accessToken;
}

export function createCapturedAccessTokenProvider(accessToken: string): () => Promise<string> {
  if (!accessToken || accessToken.length > MAX_ACCESS_TOKEN_LENGTH) {
    throw new Error("A valid captured access token is required.");
  }
  return async () => accessToken;
}

export function scopeVaultKeyToAuthenticatedUser(
  masterKey: string | null,
  ownerUserId: unknown,
  authenticatedUserId: unknown,
): string | null {
  return masterKey && canUseVaultWrapper(ownerUserId, authenticatedUserId) ? masterKey : null;
}
