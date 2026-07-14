import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";

import {
  fingerprintAccessRequest,
  readBoundedJson,
  RequestSecurityError,
} from "../src/lib/server/request-security.ts";

const ORIGINAL_SECRET = process.env.ACCESS_REQUEST_HMAC_SECRET;
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.ACCESS_REQUEST_HMAC_SECRET;
  else process.env.ACCESS_REQUEST_HMAC_SECRET = ORIGINAL_SECRET;
});

test("access request fingerprints normalize email and IP without exposing either", () => {
  process.env.ACCESS_REQUEST_HMAC_SECRET = "a-test-secret-with-enough-entropy";
  const windowStart = "2026-07-14T09:15:00.000Z";

  const first = fingerprintAccessRequest("  Person@Example.COM ", " 203.0.113.42 ", windowStart);
  const equivalent = fingerprintAccessRequest("person@example.com", "203.0.113.42", windowStart);
  const expected = createHmac("sha256", process.env.ACCESS_REQUEST_HMAC_SECRET)
    .update(`person@example.com|203.0.113.42|${windowStart}`)
    .digest("hex");

  assert.equal(first, equivalent);
  assert.equal(first, expected);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first.includes("person@example.com"), false);
  assert.equal(first.includes("203.0.113.42"), false);
});

test("access request fingerprints change across rate-limit windows", () => {
  process.env.ACCESS_REQUEST_HMAC_SECRET = "a-test-secret-with-enough-entropy";

  const first = fingerprintAccessRequest("person@example.com", "203.0.113.42", "2026-07-14T09:15:00.000Z");
  const next = fingerprintAccessRequest("person@example.com", "203.0.113.42", "2026-07-14T09:30:00.000Z");

  assert.notEqual(first, next);
});

test("access request fingerprinting requires its dedicated secret", () => {
  delete process.env.ACCESS_REQUEST_HMAC_SECRET;

  assert.throws(
    () => fingerprintAccessRequest("person@example.com", "203.0.113.42", "2026-07-14T09:15:00.000Z"),
    /ACCESS_REQUEST_HMAC_SECRET_NOT_CONFIGURED/,
  );
});

test("bounded request JSON requires application/json and exactly one object", async () => {
  const textRequest = new Request("https://vault.test/api/access-requests", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({ fullName: "Aarav Thakur", email: "aarav@example.com" }),
  });
  await assert.rejects(
    () => readBoundedJson(textRequest, 8_192),
    (error) => error instanceof RequestSecurityError && error.code === "UNSUPPORTED_MEDIA_TYPE" && error.status === 415,
  );

  for (const body of ["[]", "null", "{} {}"] ) {
    const request = new Request("https://vault.test/api/access-requests", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body,
    });
    await assert.rejects(
      () => readBoundedJson(request, 8_192),
      (error) => error instanceof RequestSecurityError && error.code === "INVALID_JSON" && error.status === 400,
    );
  }
});

test("bounded request JSON rejects a streamed body over 8 KiB despite a small declared length", async () => {
  const encoder = new TextEncoder();
  const request = new Request("https://vault.test/api/access-requests", {
    method: "POST",
    headers: {
      "content-length": "2",
      "content-type": "application/json",
    },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"payload":"'));
        controller.enqueue(encoder.encode("x".repeat(8_192)));
        controller.enqueue(encoder.encode('"}'));
        controller.close();
      },
    }),
    duplex: "half",
  });

  await assert.rejects(
    () => readBoundedJson(request, 8_192),
    (error) => error instanceof RequestSecurityError && error.code === "PAYLOAD_TOO_LARGE" && error.status === 413,
  );
});

test("access request repository enforces the durable limiter and duplicate-safe insert", () => {
  const repository = read("src/lib/server/access-repository.ts");

  assert.match(repository, /consume_access_request_rate_limit/);
  assert.match(repository, /p_limit:\s*5/);
  assert.match(repository, /15\s*\*\s*60\s*\*\s*1_000/);
  assert.match(repository, /upsert\([\s\S]*onConflict:\s*"email"[\s\S]*ignoreDuplicates:\s*true/);
  assert.match(repository, /from\("access_request_rate_limits"\)[\s\S]*\.delete\(\)[\s\S]*\.lt\("window_started_at",\s*cutoff\)/);
  assert.doesNotMatch(repository, /console\.(?:log|error|warn)/);
});

test("public route keeps honeypot, throttling, and generic response semantics ordered safely", () => {
  const route = read("src/app/api/access-requests/route.ts");
  const originIndex = route.indexOf("assertSameOrigin(request)");
  const readIndex = route.indexOf("readBoundedJson(request, MAX_REQUEST_BYTES)");
  const honeypotIndex = route.indexOf("body.website");
  const validationIndex = route.indexOf("parseAccessRequestInput(body)");
  const rateLimitIndex = route.indexOf("await consumeAccessRequestRateLimit", validationIndex);
  const insertIndex = route.indexOf("await insertAccessRequest", rateLimitIndex);

  assert.ok(originIndex >= 0 && readIndex > originIndex);
  assert.ok(honeypotIndex > readIndex && validationIndex > honeypotIndex);
  assert.ok(rateLimitIndex > validationIndex && insertIndex > rateLimitIndex);
  assert.match(route, /const MAX_REQUEST_BYTES = 8_192/);
  assert.match(route, /accepted:\s*true\s*},\s*202/);
  assert.match(route, /RATE_LIMITED"\s*},\s*429/);
  assert.match(route, /REQUEST_UNAVAILABLE"\s*},\s*503/);
  assert.match(route, /REQUEST_UNAVAILABLE/);
  assert.match(route, /24\s*\*\s*60\s*\*\s*60\s*\*\s*1_000/);
  assert.match(route, /parseInt\(fingerprint\.slice\(0,\s*2\),\s*16\)\s*%\s*32/);
  assert.doesNotMatch(route, /request\.json\(\)/);
  assert.doesNotMatch(route, /error\.message/);
});

test("request page preserves entries for retry and exposes accessible completion and errors", () => {
  const page = read("src/app/request-access/page.tsx");
  const form = read("src/components/access/RequestAccessForm.tsx");
  const css = read("src/app/request-access/request-access.module.css");

  assert.match(page, /<RequestAccessForm\s*\/>/);
  assert.match(form, /label[\s\S]*Full name/);
  assert.match(form, /label[\s\S]*Email/);
  assert.match(form, /name="website"/);
  assert.match(form, /aria-live="polite"/);
  assert.match(form, /role="alert"/);
  assert.match(form, /Request received\. If an invitation becomes available, we’ll email you\./);
  assert.match(form, /navigator\.onLine/);
  assert.match(form, /Retry request/);
  assert.match(form, /setFullName/);
  assert.match(form, /setEmail/);
  assert.doesNotMatch(form, /setFullName\(""\)/);
  assert.doesNotMatch(form, /setEmail\(""\)/);
  assert.doesNotMatch(form, /master.?key|password/i);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width:\s*700px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
