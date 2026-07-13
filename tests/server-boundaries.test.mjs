import assert from "node:assert/strict";
import { test } from "node:test";

import { collectPaginated, chunkValues } from "../src/lib/server/pagination.ts";
import { PayloadTooLargeError, readBoundedJson } from "../src/lib/server/requestBody.ts";

test("collectPaginated reads every page without dropping the final partial page", async () => {
  const source = Array.from({ length: 2_505 }, (_, index) => `item-${index}`);
  const calls = [];

  const result = await collectPaginated(async (offset, limit) => {
    calls.push({ offset, limit });
    return source.slice(offset, offset + limit);
  }, 1_000);

  assert.deepEqual(result, source);
  assert.deepEqual(calls, [
    { offset: 0, limit: 1_000 },
    { offset: 1_000, limit: 1_000 },
    { offset: 2_000, limit: 1_000 },
  ]);
});

test("chunkValues keeps storage deletion batches bounded", () => {
  const values = Array.from({ length: 2_005 }, (_, index) => index);
  const chunks = chunkValues(values, 1_000);
  assert.deepEqual(chunks.map((chunk) => chunk.length), [1_000, 1_000, 5]);
  assert.deepEqual(chunks.flat(), values);
});

test("readBoundedJson rejects an oversized body without trusting Content-Length", async () => {
  const request = new Request("https://vault.test/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: "x".repeat(128) }),
  });

  await assert.rejects(() => readBoundedJson(request, 64), PayloadTooLargeError);
});

test("readBoundedJson parses a JSON object within the byte limit", async () => {
  const request = new Request("https://vault.test/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "credit_card" }),
  });

  assert.deepEqual(await readBoundedJson(request, 1_024), { type: "credit_card" });
});
