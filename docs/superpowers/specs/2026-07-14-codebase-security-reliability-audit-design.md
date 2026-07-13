# Codebase Security and Reliability Repair

## Goal

Repair the audited security, document-renaming, runtime, and responsive UI defects without changing the approved Wallet design or replacing the vault master-key model.

## Design

- Keep the master key in memory only after unlock. Remove legacy raw-key persistence from session storage and preserve PIN/biometric local unlock as optional wrappers around the same master key.
- Treat every Server Action and API route as a public endpoint: require a valid Supabase access token, validate payload type and size, and return generic provider errors.
- Make document naming deterministic around AI: validate eligible files, sanitize the suggestion, preserve exactly one original extension, and surface fallback reasons instead of silently appearing to fail.
- Make account deletion complete and ordered: authenticate, remove storage objects and vault rows with checked errors, then remove the auth user.
- Preserve current visual language. Fix only systemic defects such as viewport centering, list keys, stale responsive assertions, dialog overflow, and inconsistent runtime states.
- Keep Supabase sign-in password recovery separate from the vault master key and state that distinction in the recovery UI.

## Verification

- Focused unit tests for filename sanitization and rename eligibility.
- Project-integrity regression checks for the mobile shell and security invariants.
- ESLint across source/config, production build, dependency audit, and logged-in browser inspection at desktop and mobile widths.
