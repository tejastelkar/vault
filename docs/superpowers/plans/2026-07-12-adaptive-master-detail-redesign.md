# Adaptive Apple Master-Detail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan inline. Steps use checkbox syntax.

**Goal:** Fix the screenshot-identified hierarchy, header crowding, oversized expanded details, Profile grouping, and Wallet card collisions on mobile and desktop.

**Architecture:** Add shared adaptive detail-shell CSS, then reshape existing component markup without changing domain state. Desktop details occupy a stable pane; mobile details use bottom-sheet geometry; Wallet covered cards reveal only their headers.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, Tailwind CSS 4, Framer Motion.

## Constraints

- Preserve all Supabase, encryption, cache, import, scan, and navigation behavior.
- No dependency or schema changes.
- Do not stage `public/visa_transparent.svg`.

### Task 1: Header

- [ ] Add a failing integrity test requiring adaptive desktop/mobile header regions and maximum mobile contextual actions.
- [ ] Rebuild `src/app/page.tsx` header classes and `src/app/globals.css` toolbar layout.
- [ ] Run tests/build and commit.

### Task 2: Password and Bank Master-Detail

- [ ] Add failing tests for `apple-master-detail`, `apple-master-list`, `apple-detail-pane`, and `apple-mobile-detail-sheet` adoption.
- [ ] Restructure Password and Bank containers so desktop list width remains stable while selected details occupy a pane; apply mobile sheet geometry below 768px.
- [ ] Replace large field blocks with compact labeled detail rows and trailing actions.
- [ ] Run tests/build and commit.

### Task 3: Profile and Wallet

- [ ] Add failing tests for five unique Profile groups and 76px Wallet reveal geometry with covered metadata hidden.
- [ ] Correct Profile group labels and reduce nested card depth.
- [ ] Move Wallet filter/actions beneath the destination title; hide covered card body content and expose 76px per covered card.
- [ ] Run full tests, build, lint baseline comparison, `git diff --check`, and responsive browser QA.
- [ ] Commit and finish the branch.
