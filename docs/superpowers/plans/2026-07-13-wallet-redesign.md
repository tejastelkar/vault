# Digital Wallet Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the accumulated Wallet UI with one responsive Apple Wallet-inspired card deck, a shared secure-details component, a mobile bottom sheet, and a desktop inspector while preserving all existing encrypted data operations.

**Architecture:** `WalletVault` remains the data/state orchestrator but loses all payment-card rendering details. `PaymentCard` becomes a focused selectable card face, and a new `WalletCardDetails` renders the same metadata/actions inside both the desktop inspector and mobile dialog. A single `selectedCardId` drives both responsive presentations.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, Framer Motion 12, Base UI/shadcn Dialog, Lucide React.

## Global Constraints

- Preserve the existing `secure_wallet` schema, encryption/decryption flow, cache keys, scanning endpoint, add/delete behavior, filtering, and bulk selection.
- Do not add dependencies.
- Do not add new automated test cases, following the user's stated preference.
- Secure values must be concealed whenever a different card is selected.
- Mobile details must clear the fixed bottom tab bar and safe-area inset.
- Desktop card content must remain bounded and must not grow into oversized payment cards.
- Read the relevant documentation in `node_modules/next/dist/docs/` before implementation.

---

## File Structure

- Create `src/components/WalletCardDetails.tsx`: shared metadata, secure reveal/copy controls, and delete action.
- Rewrite `src/components/PaymentCard.tsx`: visual card only, with normal selection and bulk-selection callbacks.
- Modify `src/components/WalletVault.tsx`: selected-card state, responsive composition, filter validity, and mobile sheet state.
- Modify `src/app/globals.css`: remove obsolete wallet stacking/detail selectors and add the new deck, inspector, and sheet rules.

### Task 1: Shared Wallet Card Details

**Files:**
- Create: `src/components/WalletCardDetails.tsx`

**Interfaces:**
- Consumes: `WalletCardDetailsProps` with `title`, `number`, optional `name`, `expiry`, `cvv`, `pin`, `upiPin`, `extraDetails`, `onCopy`, `onDelete`, and optional `onClose`.
- Produces: `WalletCardDetails`, used unchanged in the desktop inspector and mobile dialog.

- [ ] **Step 1: Create the shared details component and explicit secure-field state**

```tsx
"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, TrashIcon, XIcon } from "lucide-react";
import { CardNetworkLogo, getCardNetwork } from "@/components/CardLogos";

export interface WalletCardDetailsProps {
  title: string;
  number: string;
  name?: string;
  expiry?: string;
  cvv?: string;
  pin?: string;
  upiPin?: string;
  extraDetails?: string;
  onCopy: (value: string, label: string) => void;
  onDelete: () => void;
  onClose?: () => void;
}

export function WalletCardDetails(props: WalletCardDetailsProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => { setRevealed(false); setCopied(null); }, [props.number]);

  const copy = (value: string, label: string) => {
    props.onCopy(value, label);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const secureRows = [
    ["CVV", props.cvv], ["Card PIN", props.pin], ["UPI PIN", props.upiPin],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <section className="wallet-details" aria-label={`${props.title} details`}>
      <header className="wallet-details-header">
        <div><p className="type-group-label">Selected card</p><h3>{props.title}</h3></div>
        <CardNetworkLogo network={getCardNetwork(props.number)} className="text-foreground" />
        {props.onClose && <button type="button" onClick={props.onClose} aria-label="Close card details"><XIcon /></button>}
      </header>
      <dl className="wallet-details-list">
        <div><dt>Card number</dt><dd><span>{props.number.replace(/(\d{4})/g, "$1 ").trim()}</span><button type="button" onClick={() => copy(props.number, "Card number")}><CopyIcon />{copied === "Card number" ? "Copied" : "Copy"}</button></dd></div>
        <div className="wallet-details-pair"><div><dt>Cardholder</dt><dd>{props.name || "Card holder"}</dd></div><div><dt>Expires</dt><dd>{props.expiry || "••/••"}</dd></div></div>
      </dl>
      {secureRows.length > 0 && <div className="wallet-secure"><button type="button" onClick={() => setRevealed((value) => !value)}>{revealed ? <EyeOffIcon /> : <EyeIcon />}{revealed ? "Hide secure details" : "Show secure details"}</button>{secureRows.map(([label, value]) => <div key={label}><span>{label}</span><code>{revealed ? value : "••••"}</code><button type="button" onClick={() => copy(value, label)} aria-label={`Copy ${label}`}>{copied === label ? <CheckIcon /> : <CopyIcon />}</button></div>)}</div>}
      {props.extraDetails && <div className="wallet-extra"><p className="type-group-label">Additional information</p><p>{props.extraDetails}</p></div>}
      <button type="button" className="wallet-delete" onClick={props.onDelete}><TrashIcon />Delete card</button>
    </section>
  );
}
```

- [ ] **Step 2: Verify component compilation**

Run: `npm run build`

Expected: TypeScript and Next.js compilation complete with exit code 0.

- [ ] **Step 3: Commit the focused component**

```bash
git add src/components/WalletCardDetails.tsx
git commit -m "feat: add shared wallet card details"
```

### Task 2: Rebuild the Payment Card Face

**Files:**
- Modify: `src/components/PaymentCard.tsx`

**Interfaces:**
- Consumes: card display values, `selected`, `selectionMode`, `checked`, `index`, `onActivate`, `onToggleChecked`, and `onCopyNumber`.
- Produces: a visual card that never renders secure fields, delete buttons, sheets, or inspector UI.

- [ ] **Step 1: Replace the current prop contract**

```tsx
export interface PaymentCardProps {
  id: string;
  title: string;
  number: string;
  name?: string;
  expiry?: string;
  subtype?: "credit" | "debit";
  colorClass: string;
  selected: boolean;
  selectionMode: boolean;
  checked: boolean;
  index: number;
  onActivate: () => void;
  onToggleChecked: (event: React.SyntheticEvent) => void;
  onCopyNumber: (value: string) => void;
}
```

- [ ] **Step 2: Replace the accumulated expanded/stacked rendering with one card face**

```tsx
<motion.article
  id={`item-${id}`}
  layout
  data-selected={selected || undefined}
  className="wallet-card-wrap"
>
  <button
    type="button"
    className={`wallet-card bg-gradient-to-br ${colorClass}`}
    onClick={selectionMode ? onToggleChecked : onActivate}
    aria-current={selected ? "true" : undefined}
    aria-label={`${title}, ${subtype ?? "payment"} card`}
  >
    <span className="wallet-card-highlight" aria-hidden="true" />
    {selectionMode && <span className="wallet-card-check">{checked ? <CheckSquareIcon /> : <SquareIcon />}</span>}
    <span className="wallet-card-top"><span><small>{subtype ?? "payment"} card</small><strong>{title}</strong></span><CardNetworkLogo network={network} /></span>
    <span className="wallet-card-number">{formattedNumber}</span>
    <span className="wallet-card-bottom"><span><small>Cardholder</small><strong>{name || "Card holder"}</strong></span><span><small>Expires</small><strong>{expiry || "••/••"}</strong></span></span>
  </button>
</motion.article>
```

Use the existing `CardNetworkLogo`, preserve the 1.586:1 ratio, remove `TiltCard`, remove inline secure disclosure controls, and keep all visible card content within the button.

- [ ] **Step 3: Verify the focused card component compiles**

Run: `npm run build`

Expected: TypeScript and Next.js compilation complete with exit code 0.

- [ ] **Step 4: Commit the card-face rewrite**

```bash
git add src/components/PaymentCard.tsx
git commit -m "feat: rebuild wallet payment card"
```

### Task 3: Recompose WalletVault Around One Selection State

**Files:**
- Modify: `src/components/WalletVault.tsx`

**Interfaces:**
- Consumes: existing Supabase, crypto, cache, scanning, dialog, empty-state, skeleton, and bulk-selection utilities.
- Produces: `selectedCardId`, `mobileDetailsOpen`, filtered deck, desktop inspector, and mobile dialog using `WalletCardDetails`.

- [ ] **Step 1: Replace expanded state with selection and mobile-sheet state**

```tsx
const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

const filteredCards = items.filter((item) =>
  walletFilter === "all" || inferSubtype(item) === walletFilter
);
const selectedCard = filteredCards.find((item) => item.id === selectedCardId)
  ?? filteredCards[0]
  ?? null;

useEffect(() => {
  if (!filteredCards.length) setSelectedCardId(null);
  else if (!filteredCards.some((item) => item.id === selectedCardId)) {
    setSelectedCardId(filteredCards[0].id);
  }
}, [filteredCards, selectedCardId]);

const selectedDetails = selectedCard ? {
  title: selectedCard.title,
  number: selectedCard.payload.number || "",
  name: selectedCard.payload.name,
  expiry: selectedCard.payload.expiry,
  cvv: selectedCard.payload.cvv,
  pin: selectedCard.payload.pin,
  upiPin: selectedCard.payload.upi_pin,
  extraDetails: selectedCard.payload.extra_details,
  onCopy: (value: string, _label: string) => copyToClipboard(value),
  onDelete: () => handleDelete(selectedCard.id),
} : null;
```

Keep `inferSubtype` outside JSX so it can be reused by derived state.

- [ ] **Step 2: Add one activation path for every card**

```tsx
const activateCard = (id: string) => {
  setSelectedCardId(id);
  if (window.matchMedia("(max-width: 767px)").matches) {
    setMobileDetailsOpen(true);
  }
};
```

Focused search navigation sets `selectedCardId(focusedItemId)` before scrolling the card into view.

- [ ] **Step 3: Replace the current wallet JSX after loading/empty states**

```tsx
<section className="wallet-page">
  <header className="wallet-page-header">
    <div>
      <p className="wallet-page-eyebrow">{items.length} saved cards</p>
      <h2 className="wallet-page-title">Digital Wallet</h2>
    </div>
    <div className="wallet-page-actions"><button type="button" onClick={() => setIsSelectionMode((value) => !value)}>Select</button><button type="button" onClick={() => setIsAddOpen(true)}>Add card</button></div>
  </header>

  <div className="wallet-segmented" role="tablist" aria-label="Card type">
    {(["all", "credit", "debit"] as WalletFilter[]).map((filter) => <button key={filter} type="button" aria-selected={walletFilter === filter} onClick={() => setWalletFilter(filter)}>{filter === "all" ? "All" : filter === "credit" ? "Credit" : "Debit"}</button>)}
  </div>

  {filteredCards.length ? (
    <div className="wallet-workspace">
      <motion.div layout className="wallet-deck">
        <AnimatePresence initial={false}>{filteredCards.map((item, index) => <PaymentCard key={item.id} id={item.id} title={item.title} number={item.payload.number || ""} name={item.payload.name} expiry={item.payload.expiry} subtype={inferSubtype(item) === "other" ? undefined : inferSubtype(item)} colorClass={getCardColor(item.payload.number || "")} selected={selectedCard?.id === item.id} selectionMode={isSelectionMode} checked={selectedIds.has(item.id)} index={index} onActivate={() => activateCard(item.id)} onToggleChecked={(event) => toggleSelection(item.id, event)} onCopyNumber={copyToClipboard} />)}</AnimatePresence>
      </motion.div>
      {selectedCard && (
        <aside className="wallet-inspector">
          {selectedDetails && <WalletCardDetails {...selectedDetails} />}
        </aside>
      )}
    </div>
  ) : (
    <div className="wallet-filter-empty">
      <p>No cards in this category.</p>
      <button type="button" onClick={() => setWalletFilter("all")}>Show all cards</button>
    </div>
  )}
</section>
```

- [ ] **Step 4: Add the mobile bottom sheet using the existing Dialog primitives**

```tsx
<Dialog open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
  <DialogContent className="wallet-mobile-sheet md:hidden">
    <DialogTitle className="sr-only">{selectedCard?.title ?? "Card details"}</DialogTitle>
    {selectedDetails && <WalletCardDetails {...selectedDetails} onClose={() => setMobileDetailsOpen(false)} />}
  </DialogContent>
</Dialog>
```

The details mapper passes `payload.cvv`, `payload.pin`, `payload.upi_pin`, and `payload.extra_details` without duplicating detail markup.

- [ ] **Step 5: Remove dead wallet presentation code**

Delete `TiltCard`, the `false &&` legacy card block, `CardGrid`, `expandedCardId`, Escape handling for that state, inline details `<aside>`, and the old secure disclosure rows. Retain the add-card dialog, scan form, data methods, and `SelectionToolbar`.

- [ ] **Step 6: Verify the orchestration compiles**

Run: `npm run build`

Expected: TypeScript and Next.js compilation complete with exit code 0.

- [ ] **Step 7: Commit the WalletVault rewrite**

```bash
git add src/components/WalletVault.tsx
git commit -m "feat: rebuild responsive wallet workspace"
```

### Task 4: Replace Wallet CSS With the New Responsive System

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: class names emitted by Tasks 1–3.
- Produces: bounded desktop geometry, mobile deck, safe-area sheet, selection treatment, light/dark materials, focus states, and reduced-motion behavior.

- [ ] **Step 1: Remove obsolete selectors**

Delete `.apple-wallet-stack`, `.apple-wallet-master-detail`, `.apple-wallet-detail-pane`, `.apple-wallet-detail-backdrop`, `.apple-wallet-filter-sticky`, `.apple-wallet-card-stacked`, `.apple-wallet-card-active`, and their wallet-specific media-query descendants.

- [ ] **Step 2: Add the base wallet design system**

```css
.wallet-page { width: 100%; max-width: 1080px; margin-inline: auto; }
.wallet-page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.wallet-page-eyebrow { color: var(--muted-foreground); font-size: 12px; font-weight: 650; }
.wallet-page-title { font-size: 24px; font-weight: 720; letter-spacing: -.035em; }
.wallet-segmented { display: grid; grid-template-columns: repeat(3, 1fr); width: min(100%, 360px); margin: 0 auto 24px; padding: 4px; border-radius: 14px; background: var(--fill-tertiary); }
.wallet-workspace { display: grid; grid-template-columns: minmax(0, 640px) minmax(300px, 360px); justify-content: center; align-items: start; gap: 28px; }
.wallet-deck { display: grid; gap: 18px; min-width: 0; }
.wallet-card { position: relative; display: flex; width: 100%; aspect-ratio: 1.586 / 1; flex-direction: column; justify-content: space-between; overflow: hidden; border-radius: 28px; padding: 28px; color: white; text-align: left; box-shadow: 0 22px 52px rgba(7,18,48,.20); }
.wallet-card-wrap[data-selected] .wallet-card { box-shadow: 0 24px 56px rgba(7,18,48,.22), 0 0 0 3px color-mix(in srgb, var(--system-blue) 82%, white); }
.wallet-inspector { position: sticky; top: 20px; border: 1px solid var(--separator); border-radius: 26px; background: color-mix(in srgb, var(--elevated-bg) 94%, transparent); box-shadow: var(--apple-shadow); }
.wallet-details { padding: 22px; }
```

- [ ] **Step 3: Add mobile deck and sheet behavior**

```css
@media (max-width: 767px) {
  .wallet-page-header { margin-bottom: 18px; }
  .wallet-page-title { font-size: 22px; }
  .wallet-segmented { position: sticky; top: 0; z-index: 30; width: 100%; margin-bottom: 18px; backdrop-filter: blur(18px); }
  .wallet-workspace { display: block; }
  .wallet-inspector { display: none; }
  .wallet-deck { gap: 10px; }
  .wallet-card { border-radius: 24px; padding: 22px; }
  .wallet-mobile-sheet { top: auto !important; bottom: calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px)); left: 0 !important; width: 100% !important; max-width: none !important; max-height: min(74dvh, 620px); transform: none !important; overflow-y: auto; border-radius: 28px 28px 0 0 !important; padding: 8px 16px 20px; }
}
```

At 400px, card numbers remain inside the card without horizontal overflow. At 768–1023px, the desktop grid may narrow the card column but must not exceed the viewport.

- [ ] **Step 4: Add focus and motion safeguards**

```css
.wallet-card:focus-visible { outline: 3px solid color-mix(in srgb, var(--system-blue) 70%, white); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .wallet-card, .wallet-card-wrap, .wallet-mobile-sheet { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 5: Verify CSS and production compilation**

Run: `git diff --check -- src/app/globals.css && npm run build`

Expected: no whitespace errors in the Wallet CSS diff and build exits 0.

- [ ] **Step 6: Commit the responsive design system**

```bash
git add src/app/globals.css
git commit -m "style: replace wallet responsive design"
```

### Task 5: Browser Verification and Final Cleanup

**Files:**
- Modify if required by observed defects: `src/components/WalletVault.tsx`, `src/components/PaymentCard.tsx`, `src/components/WalletCardDetails.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: completed responsive Wallet UI.
- Produces: visually verified mobile and desktop behavior with no dead wallet selectors or components.

- [ ] **Step 1: Run final static verification**

Run: `npm run build`

Expected: build exits 0.

- [ ] **Step 2: Inspect desktop at 1440px or wider**

Verify: bounded 640px card column, sticky inspector, correct selected treatment, filter switching, copy actions, Add Card dialog, selection mode, and no horizontal overflow.

- [ ] **Step 3: Inspect mobile at 400 × 863**

Verify: readable deck, selected card opens the bottom sheet, sheet clears the bottom tab bar, close/backdrop/Escape work, secure values begin concealed, and Add Card remains usable.

- [ ] **Step 4: Exercise state transitions**

Verify: All/Credit/Debit filtering keeps a valid selection; deleting the selected card falls back to the next visible card; selecting a different card reconceals secure values; selection mode does not open details.

- [ ] **Step 5: Remove remaining obsolete code**

Run: `rg -n "TiltCard|expandedCardId|apple-wallet-card-stacked|apple-wallet-detail-pane|apple-wallet-master-detail" src/components/WalletVault.tsx src/components/PaymentCard.tsx src/app/globals.css`

Expected: no matches.

- [ ] **Step 6: Commit browser-driven corrections**

```bash
git add src/components/WalletVault.tsx src/components/PaymentCard.tsx src/components/WalletCardDetails.tsx src/app/globals.css
git commit -m "fix: polish wallet responsive interactions"
```
