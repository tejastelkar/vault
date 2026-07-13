# Codebase Security and Reliability Repair Plan

1. Add failing regression coverage for document filename handling, security boundaries, the context-action trigger key, and the current responsive Wallet implementation.
2. Add reusable filename and authentication helpers; make document rename failures explicit and safe.
3. Authenticate and validate all Gemini Server Actions and scan API requests; update callers to send the current access token.
4. Remove raw master-key session persistence, harden PIN derivation compatibility, complete account deletion, and add sign-in password recovery.
5. Resolve React key/effect/type warnings and visual/runtime inconsistencies without changing Wallet layout or styling.
6. Apply safe dependency patches, then run tests, lint, build, npm audit, and desktop/mobile browser QA.
