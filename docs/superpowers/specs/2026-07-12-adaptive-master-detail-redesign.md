# Adaptive Apple Master-Detail Redesign

## Goal

Redesign the application header, Passwords, Bank Vault, Profile, and Digital Wallet for equal mobile and desktop quality using Apple-style adaptive master-detail patterns. Preserve all data, security, and navigation behavior.

## Header

- Desktop uses a compact macOS toolbar: active destination left, Spotlight-style search centered, Magic Import/theme/profile actions right.
- Mobile uses a safe-area-aware navigation bar with no repeated section name. The destination large title lives below the bar.
- Mobile shows at most two contextual actions plus the profile avatar.
- Header actions use consistent 44px mobile hit targets and compact desktop sizing.

## Passwords

- Desktop uses a two-column master-detail layout: credential list left, selected credential detail right.
- Selecting a row does not expand or resize the list.
- Mobile keeps one list; selecting a row opens a bottom detail sheet.
- Username, password, URL, notes, strength, favorite, copy, reveal, and delete behavior remain available.
- Details use compact Settings rows with trailing controls instead of large gray text boxes.
- Destructive action is visually quiet and placed at the bottom of the detail surface.

## Bank Vault

- Desktop uses accounts master list left and selected account detail pane right.
- Mobile opens account details as a bottom sheet.
- Rows show institution, masked suffix, account type, and routing/IFSC summary.
- Detail rows expose account holder, full account number, routing/IFSC, additional fields, copy, and delete actions.
- Selection mode remains separate from normal detail selection.

## Profile

- Identity becomes a compact profile header rather than a large form card.
- Account, Security, Appearance, Data, and Danger Zone become correctly labeled Settings groups.
- Desktop uses a balanced two-column section grid where content permits; mobile is one column.
- Remove duplicate `Security`/`Appearance` and Danger Zone labels.
- Keep photo upload, name update, sign out, theme, delete-data, and delete-account behavior unchanged.

## Digital Wallet

- Mobile stack exposes 76px of each covered card.
- Covered cards show only header identity and network logo; card number and metadata are hidden until active.
- Active card separates fully and owns the visible details area.
- Filter and Add actions sit directly under the large title instead of in a detached empty toolbar row.
- Desktop shows a two-column card gallery with a selected detail pane when useful.
- Network logos keep their proportional renderer and optical boxes.

## Shared Interaction Model

- Create reusable detail-shell styles for desktop panes and mobile bottom sheets.
- Use one spring family for row selection, card separation, and sheet entry.
- Pressed, hover, keyboard-focus, disabled, selected, and reduced-motion states remain explicit.
- No information or action is available only through hover.

## Boundaries

- Do not change SQL, RLS, Supabase queries, crypto, biometrics, PIN behavior, cache keys, parser APIs, or encrypted payload formats.
- Keep existing tab state and focus-by-ID navigation.
- Presentation extraction is allowed when it reduces duplicated expanded-detail markup.

## Verification

- Add failing integrity tests for adaptive master-detail classes, mobile detail sheets, header action limits, Profile group labels, and Wallet reveal geometry.
- Run the complete integrity suite, production build/TypeScript, lint-baseline comparison, and `git diff --check`.
- Browser-check 400x868 and 1440x900 in light/dark modes without requesting credentials.

## Acceptance Criteria

- Desktop Passwords and Bank Vault details no longer expand inside their lists.
- Mobile Password and Bank detail opens as a sheet.
- Header is uncluttered and does not repeat destination titles.
- Profile hierarchy has five correct, non-duplicated Settings groups.
- Covered Wallet cards never display colliding numbers, metadata, or logos.
- Existing behavior and stored data remain compatible.
- Tests and build pass with no new lint issues.
