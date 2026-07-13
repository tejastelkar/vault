import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_AI_RENAME_BYTES,
  buildSafeDocumentFilename,
  getAiRenameEligibility,
} from "../src/lib/documentFilename.ts";

test("sanitizes an AI title and preserves exactly one original extension", () => {
  assert.equal(
    buildSafeDocumentFilename('  "July / Bank: Statement.pdf"  ', "scan.PDF"),
    "July Bank Statement.pdf",
  );
});

test("falls back to a safe original filename when the AI title is empty", () => {
  assert.equal(
    buildSafeDocumentFilename(" ../ ", "unsafe/path\\statement.pdf"),
    "statement.pdf",
  );
});

test("rejects unsupported and oversized files for AI naming", () => {
  assert.deepEqual(
    getAiRenameEligibility({ type: "text/plain", size: 100 }),
    { eligible: false, reason: "unsupported-type" },
  );
  assert.deepEqual(
    getAiRenameEligibility({ type: "application/pdf", size: MAX_AI_RENAME_BYTES + 1 }),
    { eligible: false, reason: "too-large" },
  );
});

test("accepts supported images and PDFs within the AI naming limit", () => {
  assert.deepEqual(
    getAiRenameEligibility({ type: "image/jpeg", size: MAX_AI_RENAME_BYTES }),
    { eligible: true },
  );
  assert.deepEqual(
    getAiRenameEligibility({ type: "application/pdf", size: 1024 }),
    { eligible: true },
  );
});
