import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const sql = readFileSync(new URL("../invite_access_schema.sql", import.meta.url), "utf8");

test("invite schema creates protected access tables and indexes", () => {
  for (const table of ["access_requests", "app_members", "admin_audit_log", "access_request_rate_limits"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /access_requests[\s\S]+email text not null unique check/i);
  assert.match(sql, /app_members[\s\S]+email text not null unique check/i);
  assert.match(sql, /where status in \('pending', 'invite_failed'\)/i);
  assert.match(sql, /revoke all[^;]+from anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.consume_access_request_rate_limit/i);
});

test("existing vault policies require active membership", () => {
  for (const table of ["vault_items", "vault_documents", "secure_notes", "secure_wallet"]) {
    assert.match(sql, new RegExp(`on public\\.${table}[\\s\\S]+app_members`, "i"));
  }
  assert.match(sql, /storage\.objects[\s\S]+app_members/i);
});
