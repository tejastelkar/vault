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
  const page = read("src/app/page.tsx");
  assert.equal(auth.includes("vault_password"), false);
  assert.equal(auth.includes("vault_master_key"), false);
  assert.equal(auth.includes("localStorage.setItem(\"vault_email\""), false);
  assert.equal(page.includes("sessionStorage.setItem"), false);
  assert.equal(page.includes("SESSION_MASTER_KEY"), false);
});

test("account deletion authenticates the caller and revokes refresh sessions", () => {
  const route = read("src/app/api/delete-account/route.ts");
  assert.match(route, /authenticateRequest\(request\)/);
  assert.match(route, /admin\.auth\.admin\.signOut\(accessToken,\s*"global"\)/);
  assert.match(route, /collectPaginated/);
  assert.match(route, /chunkValues/);
  assert.match(route, /admin\.auth\.admin\.deleteUser\(user\.id\)/);
});

test("scan requests are byte-bounded before JSON parsing", () => {
  const route = read("src/app/api/scan/route.ts");
  assert.match(route, /readBoundedJson\(req,\s*MAX_REQUEST_BYTES\)/);
  assert.doesNotMatch(route, /req\.json\(\)/);
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
  assert.match(page, /vault-header/);
  assert.match(page, /apple-tabbar/);
  assert.match(page, /layoutId="mobile-bg"/);
  assert.match(page, /max-w-6xl/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /--bottom-bar-height:\s*82px/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
});

test("responsive shell uses the shared Apple ecosystem chrome", () => {
  const page = read("src/app/page.tsx");
  for (const klass of ["apple-app", "apple-sidebar", "vault-header", "vault-header-search", "apple-tabbar"]) {
    assert.match(page, new RegExp(klass));
  }
  assert.match(page, /aria-label="Primary navigation"/);
});

test("adaptive header separates desktop search and mobile actions", () => {
  const page = read("src/app/page.tsx");
  const css = read("src/app/globals.css");

  for (const klass of ["vault-header", "vault-header-title", "vault-header-search", "vault-header-actions", "vault-header-mobile-search"]) {
    assert.match(page, new RegExp(klass));
  }
  assert.match(page, /vault-header-theme/);
  assert.match(css, /\.vault-header\s*\{[^}]*grid-template-columns:\s*1fr minmax\(280px,420px\) 1fr/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*?\.vault-header\s*\{[^}]*safe-area-inset-top/s);
});

test("passwords use sibling master detail and an accessible mobile sheet", () => {
  const passwords = read("src/components/PasswordVault.tsx");
  assert.match(passwords, /data-password-master/);
  assert.ok(passwords.lastIndexOf("renderPasswordDetail(selectedItem)") > passwords.indexOf("data-password-master"));
  assert.match(passwords, /role="dialog"/);
  assert.match(passwords, /aria-modal="true"/);
  assert.match(passwords, /aria-label="Close password details"/);
  assert.match(passwords, /e\.key === "Escape"/);
  assert.match(passwords, /EyeIcon/);
  assert.match(passwords, /CopyIcon/);
});

test("wallet presentation is isolated in an accessible PaymentCard", () => {
  assert.equal(existsSync(new URL("../src/components/PaymentCard.tsx", import.meta.url)), true);
  const card = read("src/components/PaymentCard.tsx");
  const wallet = read("src/components/WalletVault.tsx");
  assert.match(card, /export interface PaymentCardProps/);
  assert.match(card, /export function PaymentCard/);
  assert.match(card, /CardNetworkLogo/);
  assert.match(card, /aria-current/);
  assert.match(card, /wallet-card-number/);
  assert.match(wallet, /<PaymentCard/);
});

test("native Apple primitives cover lists, sheets, selection, and tactile states", () => {
  for (const file of [
    "src/components/ui/apple-grouped-list.tsx",
    "src/components/ui/responsive-sheet-frame.tsx",
    "src/components/SelectionToolbar.tsx",
  ]) assert.equal(existsSync(new URL(`../${file}`, import.meta.url)), true, `${file} is missing`);
  const list = read("src/components/ui/apple-grouped-list.tsx");
  const sheet = read("src/components/ui/responsive-sheet-frame.tsx");
  const selection = read("src/components/SelectionToolbar.tsx");
  const css = read("src/app/globals.css");
  assert.match(list, /AppleGroupedList/);
  assert.match(list, /AppleGroupedRow/);
  assert.match(list, /AppleGroupLabel/);
  assert.match(sheet, /ResponsiveSheetFrame/);
  assert.match(selection, /SelectionToolbar/);
  assert.match(selection, /"vibrate" in navigator/);
  for (const klass of ["apple-grouped-list", "apple-grouped-row", "apple-bottom-sheet", "apple-selection-toolbar", "apple-pressed", "type-large-title", "type-section-title", "type-row-title", "type-supporting", "type-metadata", "type-group-label"]) assert.match(css, new RegExp(`\\.${klass}`));
});

test("Wallet workspace and Settings expose native structure", () => {
  const card = read("src/components/PaymentCard.tsx");
  const wallet = read("src/components/WalletVault.tsx");
  const settings = read("src/components/settings/Settings.tsx") + read("src/components/settings/settings-types.ts");
  const css = read("src/app/globals.css");
  assert.match(card, /selected: boolean/);
  assert.match(wallet, /wallet-workspace/);
  assert.match(css, /\.wallet-card-wrap\[data-selected\]/);
  assert.match(css, /--apple-spring/);
  for (const label of ["Account", "Security", "Appearance", "Data & Backup", "Danger Zone"]) assert.match(settings, new RegExp(label));
});

test("global importer has paste review saving and truthful result stages", () => {
  const importer = read("src/components/GlobalMagicImport.tsx");
  assert.match(importer, /type State/);
  for (const phase of ["source", "analyzing", "review", "saving", "results"]) assert.match(importer, new RegExp(`"${phase}"`));
  assert.match(importer, /Review import/);
  assert.match(importer, /saveImportDrafts/);
  assert.match(importer, /classifyDuplicates/);
  assert.match(importer, /failures/);
});

test("Digital Wallet uses one filterable card stack", () => {
  const wallet = read("src/components/WalletVault.tsx");
  const card = read("src/components/PaymentCard.tsx");
  const css = read("src/app/globals.css");
  assert.match(wallet, /type WalletFilter/);
  assert.match(wallet, /walletFilter/);
  assert.match(wallet, /"All".*"Credit".*"Debit"/s);
  assert.match(wallet, /className="wallet-workspace"/);
  assert.match(wallet, /className="wallet-deck"/);
  assert.match(card, /wallet-card-top/);
  assert.match(card, /wallet-card-bottom/);
  assert.match(card, /onClick=\{selectionMode \? onToggleChecked : onActivate\}/);
  assert.match(wallet, /wallet-inspector/);
  assert.match(wallet, /wallet-mobile-sheet md:hidden/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.wallet-workspace\s*\{[^}]*display:\s*block/s);
});

test("Bank Vault uses compact grouped institution rows", () => {
  const bank = read("src/components/BankVault.tsx");
  assert.match(bank, /apple-bank-list/);
  assert.match(bank, /apple-bank-list apple-master-list/);
  assert.match(bank, /Account suffix/);
  assert.match(bank, /IFSC \/ Routing/);
  assert.match(bank, /ChevronRightIcon/);
});

test("Bank Vault renders selected account in an accessible sibling detail surface", () => {
  const bank = read("src/components/BankVault.tsx");
  assert.match(bank, /const selectedBank =/);
  assert.match(bank, /apple-bank-master-detail/);
  assert.match(bank, /role="dialog"/);
  assert.match(bank, /role="dialog"/);
  assert.match(bank, /aria-label="Close account details"/);
  assert.match(bank, /Account Holder/);
  assert.match(bank, /Account Type/);
  assert.match(bank, /aria-label={`Copy/);
  assert.equal(bank.includes("apple-mobile-detail-sheet space-y-4 relative z-10 mt-5"), false);
});

test("Bank Vault locks desktop master and detail into a compact two-column workspace", () => {
  const bank = read("src/components/BankVault.tsx");
  assert.match(bank, /apple-bank-workspace grid w-full items-start/);
  assert.match(bank, /md:grid-cols-\[minmax\(280px,0\.82fr\)_minmax\(360px,1\.18fr\)\]/);
  assert.match(bank, /apple-bank-detail-fields/);
  assert.doesNotMatch(bank, /selectedBank\.payload\.name \|\| "Not provided"/);
  assert.doesNotMatch(bank, /accountType \|\| "Bank account"/);
});

test("desktop master-detail starts at the same breakpoint as the desktop sidebar", () => {
  const css = read("src/app/globals.css");
  const page = read("src/app/page.tsx");
  const settings = read("src/components/settings/Settings.tsx");
  const wallet = read("src/components/WalletVault.tsx");
  assert.match(css, /@media \(min-width:\s*768px\)[\s\S]*?\.apple-bank-master-detail\s*\{[^}]*grid-template-columns/);
  assert.match(css, /@media \(min-width:\s*768px\)[\s\S]*?\.wallet-workspace\s*\{[^}]*grid-template-columns/);
  assert.doesNotMatch(css, /\.apple-detail-pane\s*>\s*div\s*\{/);
  assert.match(page, /max-w-6xl/);
  assert.match(page, /contentScrollRef\.current\?\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/);
  assert.match(settings, /settings-layout/);
  assert.doesNotMatch(wallet, /apple-wallet-stack[^\n]*lg:grid-cols-2/);
  assert.match(wallet, /className="wallet-workspace"/);
  assert.match(wallet, /className="wallet-mobile-sheet md:hidden"/);
});

test("Passwords and Bank Vault adopt adaptive master-detail surfaces", () => {
  const passwords = read("src/components/PasswordVault.tsx");
  const bank = read("src/components/BankVault.tsx");
  const css = read("src/app/globals.css");

  for (const source of [passwords, bank]) {
    assert.match(source, /apple-master-detail/);
    assert.match(source, /apple-master-list/);
    assert.match(source, /apple-detail-pane/);
  }
  assert.match(passwords, /apple-mobile-detail-sheet/);
  assert.match(bank, /apple-bank-detail/);

  assert.match(css, /\.apple-master-detail/);
  assert.match(css, /\.apple-detail-row/);
});

test("Profile uses a compact Apple Settings hierarchy", () => {
  const settings = read("src/components/settings/Settings.tsx");
  const navigation = read("src/components/settings/settings-types.ts");
  assert.match(settings, /settings-layout/);
  for (const section of ["account", "security", "appearance", "backup", "danger"]) {
    assert.match(navigation, new RegExp(`id: "${section}"`));
  }
  assert.match(settings, /DangerSettings/);
});
