# Financial Vault and Global Import Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reviewable three-stage global importer and restructure Digital Wallet and Bank Vault into focused Apple-native financial surfaces.

**Architecture:** Add typed import-review state inside `GlobalMagicImport` while retaining `parseGlobalBulkData` and the existing encryption/save loop. Extend Wallet’s active stack with one segmented filter and restyle Bank Vault as compact grouped account rows; no data contract changes.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12, Supabase, Node test runner.

## Global Constraints

- Preserve SQL, RLS, crypto, cache keys, parser API, encrypted payload shapes, and `onSuccess` contract.
- Keep one global importer for all supported types.
- Do not add dependencies or stage `public/visa_transparent.svg`.
- Respect safe areas, reduced motion, keyboard focus, and 44px touch targets.

### Task 1: Three-Stage Reviewable Global Import

**Files:** `src/components/GlobalMagicImport.tsx`, `src/app/globals.css`, `tests/project-integrity.test.mjs`

- [ ] Add a failing test requiring `ImportPhase` with paste/review/saving/done, editable review state, selected/excluded items, `Review Import`, `Save N Items`, and saved/updated/excluded/failed result totals.
- [ ] Run the targeted test and confirm RED.
- [ ] Refactor the importer into Paste, Review, Save, and Result views; preserve pasted text on parse failure.
- [ ] Normalize parser output into review items with stable local IDs, type, editable payload, selected flag, and status.
- [ ] Save only selected items through the existing per-type encryption/update/insert behavior; continue after item failures and record truthful totals.
- [ ] Run integrity tests and production build; expect pass.
- [ ] Commit `src/components/GlobalMagicImport.tsx`, `src/app/globals.css`, and tests with message `feat: add reviewable global magic import`.

### Task 2: Unified Digital Wallet Layout

**Files:** `src/components/WalletVault.tsx`, `src/components/PaymentCard.tsx`, `src/app/globals.css`, `tests/project-integrity.test.mjs`

- [ ] Add a failing test requiring `WalletFilter`, All/Credit/Debit segments, one `apple-wallet-stack`, active-card details, and a compact actions menu.
- [ ] Run the targeted test and confirm RED.
- [ ] Replace separate credit/debit/other sections with one filtered card collection and segmented control.
- [ ] Keep mobile overlap and desktop grid; ensure one active card owns the visible details panel.
- [ ] Consolidate Add, Scan, Select, and Magic Import entry points into the existing compact toolbar/menu without changing handlers.
- [ ] Run tests and build; expect pass.
- [ ] Commit with message `feat: unify Digital Wallet layout`.

### Task 3: Grouped Bank Vault and Final QA

**Files:** `src/components/BankVault.tsx`, `src/app/globals.css`, `tests/project-integrity.test.mjs`

- [ ] Add a failing test requiring bank summary count, `apple-bank-list`, `apple-bank-row`, masked account suffix, routing/IFSC metadata, chevron, and inline expanded details.
- [ ] Run the targeted test and confirm RED.
- [ ] Replace large bank cards with compact grouped institution rows and inline detail expansion while preserving selection, scan, add, copy, and delete behavior.
- [ ] Run all integrity tests, production build, lint baseline comparison, and `git diff --check`.
- [ ] Inspect mobile and desktop unauthenticated surfaces; verify authenticated-only structures through tests without requesting credentials.
- [ ] Commit with message `feat: redesign Bank Vault layout`.
