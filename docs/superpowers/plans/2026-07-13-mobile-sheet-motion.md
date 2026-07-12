# Mobile Sheet Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide native vertical scrollbar tracks while preserving scrolling and add restrained slide-up motion to every mobile sheet.

**Architecture:** The existing responsive sheet elements and internal scroll containers remain unchanged. One CSS contract in `globals.css` hides scrollbar visuals and uses Base UI's starting/closed states for entrance and exit transforms. No component data or form markup changes are required.

**Tech Stack:** Next.js 16.2.10, Tailwind CSS 4, Base UI Dialog, CSS `@starting-style`, dynamic viewport/safe-area CSS.

## Global Constraints

- Preserve touch, wheel, and keyboard scrolling.
- Preserve pinned grabbers, titles, and close controls.
- Do not change form data, validation, persistence, encryption, or dialog structure.
- Do not add dependencies or automated test cases.
- Reduced-motion mode must disable movement.

---

### Task 1: Hide Scrollbars and Add Sheet Motion

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `.responsive-form-sheet`, `.responsive-import-sheet`, `.wallet-mobile-sheet`, `.magic-import-scroll`, `.vault-command-surface`, and Base UI's `[data-closed]` state.
- Produces: invisible scrollbar tracks, retained scrolling, 320ms sheet entrance/exit motion, and instant reduced-motion behavior.

- [ ] **Step 1: Hide scrollbar tracks on every intended internal scroller**

```css
[data-slot="dialog-content"].responsive-form-sheet > form,
[data-slot="dialog-content"].responsive-form-sheet > [data-slot="dialog-header"] + div,
[data-slot="dialog-content"].responsive-import-sheet .magic-import-scroll,
.wallet-mobile-sheet,
.vault-command-surface * {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

[data-slot="dialog-content"].responsive-form-sheet > form::-webkit-scrollbar,
[data-slot="dialog-content"].responsive-form-sheet > [data-slot="dialog-header"] + div::-webkit-scrollbar,
[data-slot="dialog-content"].responsive-import-sheet .magic-import-scroll::-webkit-scrollbar,
.wallet-mobile-sheet::-webkit-scrollbar,
.vault-command-surface *::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
```

- [ ] **Step 2: Add the mobile resting-state motion contract**

Inside the existing `@media (max-width: 767px)` block:

```css
[data-slot="dialog-content"].responsive-form-sheet,
[data-slot="dialog-content"].responsive-import-sheet,
[role="dialog"].wallet-mobile-sheet {
  transform: translate3d(0,0,0) !important;
  opacity: 1;
  transition:
    transform 320ms cubic-bezier(.22,.88,.36,1),
    opacity 180ms ease-out !important;
  will-change: transform, opacity;
}

[data-slot="dialog-content"].responsive-form-sheet[data-closed],
[data-slot="dialog-content"].responsive-import-sheet[data-closed],
[role="dialog"].wallet-mobile-sheet[data-closed] {
  transform: translate3d(0,100%,0) !important;
  opacity: 0;
}
```

- [ ] **Step 3: Add starting-state motion without changing Tailwind translation variables**

```css
@starting-style {
  [data-slot="dialog-content"].responsive-form-sheet,
  [data-slot="dialog-content"].responsive-import-sheet,
  [role="dialog"].wallet-mobile-sheet {
    transform: translate3d(0,100%,0) !important;
    opacity: 0;
  }
}
```

- [ ] **Step 4: Strengthen reduced-motion behavior**

```css
@media (prefers-reduced-motion: reduce) {
  [data-slot="dialog-content"].responsive-form-sheet,
  [data-slot="dialog-content"].responsive-import-sheet,
  [role="dialog"].wallet-mobile-sheet {
    transform: none !important;
    transition: none !important;
    animation: none !important;
    will-change: auto;
  }
}
```

- [ ] **Step 5: Verify source and production output**

Run: `git diff --check -- src/app/globals.css && npm run build`

Expected: diff check and build exit 0.

Then locate the built stylesheet with:

```bash
CSS_FILE=$(rg -l --glob '*.css' 'responsive-form-sheet' .next/static/chunks | head -1)
rg -n 'scrollbar-width:none|translate3d\(0,100%,0\)|data-closed' "$CSS_FILE"
```

Expected: compiled CSS retains the hidden-scrollbar and closed/starting transform declarations.

- [ ] **Step 6: Commit the motion system**

```bash
git add src/app/globals.css
git commit -m "style: add mobile sheet motion"
```
