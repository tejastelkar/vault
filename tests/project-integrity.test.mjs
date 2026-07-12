import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("document queries consistently use the vault_documents table", () => {
  const files = [
    "src/app/page.tsx",
    "src/components/Dashboard.tsx",
    "src/components/DocumentVault.tsx",
    "src/components/GlobalSearch.tsx",
  ];

  for (const file of files) {
    assert.equal(read(file).includes("secure_documents"), false, `${file} still references secure_documents`);
  }
});

test("SQL setup covers all vault tables and update policies preserve ownership", () => {
  const sql = [
    "supabase_schema.sql",
    "documents_schema.sql",
    "notes_schema.sql",
    "vault_update_schema.sql",
  ].map(read).join("\n");

  assert.match(sql, /create table if not exists secure_wallet/i);
  assert.match(sql, /vault_documents[\s\S]*category text/i);
  assert.match(sql, /on vault_items for update[\s\S]*with check\s*\(\s*\(select auth\.uid\(\)\)\s*=\s*user_id\s*\)/i);
  assert.match(sql, /on secure_notes for update[\s\S]*with check\s*\(\s*\(select auth\.uid\(\)\)\s*=\s*user_id\s*\)/i);
  assert.match(sql, /on secure_wallet for update[\s\S]*with check\s*\(\s*\(select auth\.uid\(\)\)\s*=\s*user_id\s*\)/i);
});

test("raw account password and master key are not persisted in localStorage", () => {
  const auth = read("src/components/Auth.tsx");
  assert.equal(auth.includes("vault_password"), false);
  assert.equal(auth.includes("vault_master_key"), false);
  assert.equal(auth.includes("localStorage.setItem(\"vault_email\""), false);
});

test("client crypto does not depend on Node Buffer", () => {
  assert.equal(read("src/lib/crypto.ts").includes("Buffer."), false);
});

test("payment cards use one proportional network-logo source of truth", () => {
  const logos = read("src/components/CardLogos.tsx");
  const wallet = read("src/components/WalletVault.tsx");
  assert.match(logos, /export type CardNetwork/);
  assert.match(logos, /export function getCardNetwork/);
  assert.match(logos, /export function CardNetworkLogo/);
  assert.match(logos, /object-contain/);
  assert.match(logos, /mastercard/i);
  assert.equal(wallet.includes("VisaLogo, RuPayLogo"), false);
});

test("Apple visual primitives include safe areas, focus, and reduced motion", () => {
  const css = read("src/app/globals.css");
  for (const token of ["--system-blue", "--grouped-bg", "--elevated-bg", "--separator", "--apple-shadow"]) {
    assert.match(css, new RegExp(token));
  }
  for (const klass of ["apple-material", "apple-group", "apple-control", "apple-sheet", "apple-tabbar"]) {
    assert.match(css, new RegExp(`\\.${klass}`));
  }
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /min-height:\s*44px/);
});

test("mobile shell keeps iOS-style safe areas and native tab treatment", () => {
  const page = read("src/app/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(page, /ios-app-shell/);
  assert.match(page, /ios-mobile-header/);
  assert.match(page, /apple-tabbar/);
  assert.match(page, /layoutId="mobile-bg"/);
  assert.match(page, /max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-7/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /--bottom-bar-height:\s*82px/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
});

test("responsive shell uses the shared Apple ecosystem chrome", () => {
  const page = read("src/app/page.tsx");
  for (const klass of ["apple-app", "apple-sidebar", "apple-toolbar", "apple-large-title", "apple-tabbar"]) {
    assert.match(page, new RegExp(klass));
  }
  assert.match(page, /aria-label="Primary navigation"/);
});

test("wallet presentation is isolated in an accessible PaymentCard", () => {
  assert.equal(existsSync(new URL("../src/components/PaymentCard.tsx", import.meta.url)), true);
  const card = read("src/components/PaymentCard.tsx");
  const wallet = read("src/components/WalletVault.tsx");
  assert.match(card, /export interface PaymentCardProps/);
  assert.match(card, /export function PaymentCard/);
  assert.match(card, /CardNetworkLogo/);
  assert.match(card, /aria-expanded/);
  assert.match(card, /tabular-nums/);
  assert.match(wallet, /<PaymentCard/);
});
