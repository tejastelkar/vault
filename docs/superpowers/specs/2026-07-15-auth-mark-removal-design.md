# Authentication Mark Removal Design

## Goal

Remove the blue lock icon and its rounded container from the top of the shared authentication experience.

## Scope

- Remove the `AppleLockIcon` import and mark element from `AuthShell`.
- Remove the unused `.mark` desktop and mobile CSS rules.
- Let the existing heading become the first item in the centered authentication rail.
- Apply the change consistently to sign-in, request access, invitation, onboarding, and password-reset screens through the shared shell.

## Constraints

- Keep the upper-right appearance toggle.
- Keep all existing headings, forms, segmented navigation, motion, responsive behavior, and safe-area handling.
- Do not change Supabase authentication, invitation handling, onboarding, password reset, or master-key behavior.
- Preserve all unrelated and untracked workspace files.

## Verification

- Add a structural regression assertion that the shared shell no longer references `AppleLockIcon` or `styles.mark`.
- Run the focused authentication UI test, full test suite, lint, and TypeScript checks.
- Visually confirm the sign-in layout at desktop and mobile widths without horizontal overflow.
