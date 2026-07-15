import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared auth shell owns presentation without authentication", () => {
  const shell = read("src/components/auth/AuthShell.tsx");
  const css = read("src/components/auth/auth-shell.module.css");

  assert.match(shell, /export type AuthMode = "sign-in" \| "request-access"/);
  assert.match(shell, /Sign In/);
  assert.match(shell, /Request Access/);
  assert.match(shell, /useTheme/);
  assert.match(shell, /AnimatePresence/);
  assert.doesNotMatch(shell, /supabase|signInWithPassword|signUp|masterKey|masterPassword/);
  assert.match(css, /100dvh/);
  assert.match(css, /safe-area-inset/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
