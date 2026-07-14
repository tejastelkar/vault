import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("admin page protects owner data and handles authentication outcomes", () => {
  const page = read("src/app/admin/page.tsx");
  assert.match(page, /requireAdmin\(\)/);
  assert.match(page, /AuthorizationError/);
  assert.match(page, /\/login\?next=\/admin/);
  assert.match(page, /Unauthorized/);
  assert.match(page, /adminEmail/);
});

test("admin console exposes the approved desktop sections and URL filters", () => {
  const consoleSource = read("src/components/admin/AdminConsole.tsx");
  const sidebar = read("src/components/admin/AdminSidebar.tsx");

  for (const label of ["Pending", "Invited", "Members", "Activity"]) {
    assert.match(sidebar, new RegExp(`label: "${label}"`));
  }
  assert.match(consoleSource, /useSearchParams/);
  assert.match(consoleSource, /useRouter/);
  assert.match(consoleSource, /250/);
  assert.match(consoleSource, /nextCursor/);
  assert.match(consoleSource, /setItems\(\(current\).*\.\.\.current.*\.\.\.page\.items/s);
});

test("mobile queue uses request cards and shared approval sheet", () => {
  const queue = read("src/components/admin/RequestQueue.tsx");
  const card = read("src/components/admin/RequestCard.tsx");
  const sheet = read("src/components/admin/ApprovalSheet.tsx");

  assert.match(queue, /<RequestCard/);
  assert.match(card, /minHeight:\s*44|styles\.touchTarget/);
  assert.match(sheet, /<AdaptiveSheet/);
  assert.match(sheet, /request\.fullName/);
  assert.match(sheet, /request\.email/);
  assert.match(sheet, /Sending invitation/);
});

test("approval states, shaped skeletons, and directed empty states are present", () => {
  const consoleSource = read("src/components/admin/AdminConsole.tsx");
  const queue = read("src/components/admin/RequestQueue.tsx");
  const skeleton = read("src/components/admin/AdminSkeleton.tsx");

  assert.match(consoleSource, /useToast\(\)/);
  assert.match(consoleSource, /aria-live="polite"/);
  assert.match(queue, /pending-empty/);
  assert.match(queue, /search-empty/);
  assert.match(queue, /invite_failed/);
  assert.match(queue, /Sending invitation/);
  assert.match(queue, /"Retry"/);
  assert.match(queue, /<StateView/);
  assert.match(skeleton, /rowSkeleton/);
  assert.match(skeleton, /cardSkeleton/);
});

test("admin components never expose public signup or post-invite undo", () => {
  const sources = [
    "src/components/admin/AdminConsole.tsx",
    "src/components/admin/RequestQueue.tsx",
    "src/components/admin/RequestCard.tsx",
    "src/components/admin/ApprovalSheet.tsx",
    "src/components/admin/AdminSidebar.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(sources, /sign\s?up|create account|request access/i);
  assert.doesNotMatch(sources, /\bundo\b/i);
});
