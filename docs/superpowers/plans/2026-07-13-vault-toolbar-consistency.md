# Vault Toolbar Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all vault section toolbars so primary creation actions stay at the far right on mobile and desktop.

**Architecture:** Five vault screens adopt shared semantic toolbar classes while retaining their existing actions and dialogs. A small CSS contract owns alignment, action order, mobile title hiding, and touch-target sizing. No action logic or data flow changes.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, Tailwind CSS 4, Base UI dropdown/dialog primitives.

## Global Constraints

- Preserve every existing action handler, menu item, dialog, selection mode, and data operation.
- Overflow/secondary action comes first; primary creation action comes last.
- Primary creation action is always far right, including empty states where overflow is absent.
- Mobile actions have at least 44px touch targets.
- Do not add dependencies or automated tests.

---

### Task 1: Apply the Shared Toolbar Contract

**Files:**
- Modify: `src/components/PasswordVault.tsx`
- Modify: `src/components/DocumentVault.tsx`
- Modify: `src/components/NotesVault.tsx`
- Modify: `src/components/WalletVault.tsx`
- Modify: `src/components/BankVault.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing toolbar JSX and action handlers.
- Produces: `vault-section-toolbar`, `vault-section-heading`, `vault-section-actions`, `vault-section-overflow`, and `vault-section-primary-action` presentation hooks.

- [ ] **Step 1: Update Passwords toolbar structure**

```tsx
<div className="vault-section-toolbar">
<div className="vault-section-heading">
<h2 className="type-section-title">Passwords</h2>
<div className="vault-section-actions">
<DropdownMenuTrigger className="vault-section-overflow">
<DialogTrigger className="vault-section-primary-action">
```

Remove the old `hidden md:block` from the title; the heading slot controls breakpoint visibility.

- [ ] **Step 2: Apply the same classes to Documents and Notes**

Replace each outer local toolbar class with `vault-section-toolbar`, its existing left wrapper with `vault-section-heading`, and action wrapper with `vault-section-actions`. Add `vault-section-overflow` to the dropdown trigger and `vault-section-primary-action` to the Upload/New trigger. Preserve selection-count badges in the heading slot.

- [ ] **Step 3: Update Bank toolbar structure**

Wrap the Bank title in `vault-section-heading`, use `vault-section-toolbar` on the parent and `vault-section-actions` on actions. Add `vault-section-overflow` to the dropdown trigger and `vault-section-primary-action` to Add Account.

- [ ] **Step 4: Align Wallet with the same contract**

```tsx
<header className="wallet-page-header vault-section-toolbar">
  <div className="wallet-page-heading vault-section-heading">
    <p className="wallet-page-eyebrow">{items.length} saved cards</p>
    <h2 className="wallet-page-title">Digital Wallet</h2>
  </div>
  <div className="wallet-page-actions vault-section-actions">
    <button type="button" onClick={() => setIsSelectionMode((value) => !value)}>{isSelectionMode ? "Cancel" : "Select"}</button>
    <button type="button" className="vault-section-primary-action" onClick={() => setIsAddOpen(true)}>Add card</button>
  </div>
</header>
```

Keep Select first and Add card last.

- [ ] **Step 5: Add shared CSS**

```css
.vault-section-toolbar { display: flex; min-height: 44px; align-items: center; gap: 12px; margin-bottom: 20px; }
.vault-section-heading { display: flex; min-width: 0; align-items: center; gap: 12px; }
.vault-section-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 8px; margin-left: auto; }
.vault-section-overflow { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 999px; color: var(--muted-foreground); }
.vault-section-primary-action { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; gap: 6px; border-radius: 999px; padding: 0 16px; background: var(--system-blue); color: white; font-size: 14px; font-weight: 650; }
.wallet-page-heading { display: block; }

@media (max-width: 767px) {
  .vault-section-toolbar { justify-content: flex-end; margin-bottom: 18px; }
  .vault-section-heading { display: none; }
  .vault-section-actions { width: auto; margin-left: auto; }
  .vault-section-overflow { width: 44px; height: 44px; }
  .vault-section-primary-action { min-height: 44px; }
}
```

If legacy component utilities conflict, the shared class rules are authoritative for positioning and sizing while existing hover colors may remain.

- [ ] **Step 6: Audit action order and class adoption**

Run:

```bash
rg -n "vault-section-(toolbar|heading|actions|overflow|primary-action)" src/components/{PasswordVault,DocumentVault,NotesVault,WalletVault,BankVault}.tsx src/app/globals.css
```

Expected: all five components use toolbar/heading/actions; Password, Document, Notes, and Bank use overflow/primary classes; Wallet uses the primary class and keeps Select before Add card.

- [ ] **Step 7: Verify and commit**

Run: `git diff --check && npm run build`

Expected: production build exits 0.

```bash
git add src/components/PasswordVault.tsx src/components/DocumentVault.tsx src/components/NotesVault.tsx src/components/WalletVault.tsx src/components/BankVault.tsx src/app/globals.css
git commit -m "style: standardize vault toolbars"
```
