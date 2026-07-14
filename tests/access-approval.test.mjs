import assert from "node:assert/strict";
import { test } from "node:test";

import { approveAccessRequest } from "../src/lib/access/approval.ts";

const REQUEST = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  email: "invitee@example.com",
  fullName: "Invitee Person",
  attempt: 1,
};

function approvalFixture(overrides = {}) {
  let state = "pending";
  let existingUser = null;
  let inviteCount = 0;
  let markInvitedCount = 0;
  let markFailedCount = 0;
  const audits = [];

  const deps = {
    now: () => "2026-07-14T10:00:00.000Z",
    async claim() {
      if (state === "inviting") return { kind: "already_processing" };
      if (state !== "pending" && state !== "invite_failed") return { kind: "not_found" };
      state = "inviting";
      return { kind: "claimed", request: REQUEST };
    },
    async reconcile() {
      return existingUser;
    },
    async invite() {
      inviteCount += 1;
      existingUser = { userId: "550e8400-e29b-41d4-a716-446655440002" };
      return existingUser;
    },
    async markInvited() {
      markInvitedCount += 1;
      state = "invited";
    },
    async markFailed() {
      markFailedCount += 1;
      state = "invite_failed";
    },
    mapError: () => "DELIVERY_FAILED",
    async audit(entry) {
      audits.push(entry);
    },
    ...overrides,
  };

  return {
    deps,
    audits,
    get state() { return state; },
    set state(value) { state = value; },
    get existingUser() { return existingUser; },
    set existingUser(value) { existingUser = value; },
    get inviteCount() { return inviteCount; },
    get markInvitedCount() { return markInvitedCount; },
    get markFailedCount() { return markFailedCount; },
  };
}

test("a pending approval sends once and records the invited member", async () => {
  const fixture = approvalFixture();

  const result = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });

  assert.deepEqual(result, { kind: "invited", userId: "550e8400-e29b-41d4-a716-446655440002" });
  assert.equal(fixture.inviteCount, 1);
  assert.equal(fixture.markInvitedCount, 1);
  assert.equal(fixture.state, "invited");
  assert.deepEqual(fixture.audits.map(({ resultCode }) => resultCode), ["INVITED"]);
});

test("a concurrent second claim returns already_processing without another send", async () => {
  const fixture = approvalFixture({
    claim: async () => ({ kind: "already_processing" }),
  });

  const result = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });

  assert.deepEqual(result, { kind: "already_processing" });
  assert.equal(fixture.inviteCount, 0);
  assert.equal(fixture.markInvitedCount, 0);
});

test("a provider failure stores only a safe invite_failed code", async () => {
  const fixture = approvalFixture({
    invite: async () => { throw new Error("smtp provider secret payload"); },
    mapError: () => "RATE_LIMITED",
  });

  const result = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });

  assert.deepEqual(result, { kind: "failed", code: "RATE_LIMITED" });
  assert.equal(fixture.state, "invite_failed");
  assert.equal(fixture.markFailedCount, 1);
  assert.deepEqual(fixture.audits.map(({ resultCode }) => resultCode), ["RATE_LIMITED"]);
});

test("retry acquires invite_failed and sends once", async () => {
  const fixture = approvalFixture();
  fixture.state = "invite_failed";

  const result = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });

  assert.equal(result.kind, "invited");
  assert.equal(fixture.inviteCount, 1);
  assert.equal(fixture.state, "invited");
});

test("stale invitation recovery reconciles an Auth user before any resend", async () => {
  const fixture = approvalFixture({
    claim: async () => ({ kind: "claimed", request: REQUEST }),
  });
  fixture.existingUser = { userId: "550e8400-e29b-41d4-a716-446655440003" };

  const result = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });

  assert.deepEqual(result, { kind: "invited", userId: "550e8400-e29b-41d4-a716-446655440003" });
  assert.equal(fixture.inviteCount, 0);
  assert.deepEqual(fixture.audits.map(({ resultCode }) => resultCode), ["RECONCILED"]);
});

test("provider success followed by persistence failure reconciles on retry without a duplicate invite", async () => {
  let failPersistenceOnce = true;
  const fixture = approvalFixture({
    async markInvited() {
      if (failPersistenceOnce) {
        failPersistenceOnce = false;
        throw new Error("database unavailable");
      }
      fixture.state = "invited";
    },
  });

  const first = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });
  const retry = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });

  assert.deepEqual(first, { kind: "failed", code: "DELIVERY_FAILED" });
  assert.deepEqual(retry, { kind: "invited", userId: "550e8400-e29b-41d4-a716-446655440002" });
  assert.equal(fixture.inviteCount, 1);
});

test("audit failure is reported without changing a durable invitation result", async () => {
  const reported = [];
  const fixture = approvalFixture({
    audit: async () => { throw new Error("audit unavailable"); },
    reportAuditFailure: (error) => reported.push(error),
  });

  const result = await approveAccessRequest(fixture.deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });

  assert.equal(result.kind, "invited");
  assert.equal(fixture.state, "invited");
  assert.equal(reported.length, 1);
});

test("a reclaimed attempt fences delayed completion and failure from the stale worker", async () => {
  let attempt = 0;
  let currentAttempt = 0;
  let state = "pending";
  let releaseFirstInvite;
  const firstInviteGate = new Promise((resolve) => { releaseFirstInvite = resolve; });
  const completions = [];
  const failures = [];

  const deps = {
    now: () => "2026-07-14T10:00:00.000Z",
    async claim() {
      attempt += 1;
      currentAttempt = attempt;
      state = "inviting";
      return { kind: "claimed", request: { ...REQUEST, attempt } };
    },
    reconcile: async () => null,
    async invite() {
      if (attempt === 1) await firstInviteGate;
      return { userId: `550e8400-e29b-41d4-a716-44665544000${attempt + 1}` };
    },
    async markInvited(_requestId, _adminId, userId, claimedAttempt) {
      if (claimedAttempt !== currentAttempt || state !== "inviting") throw new Error("STALE_ATTEMPT");
      completions.push({ claimedAttempt, userId });
      state = "invited";
    },
    async markFailed(_requestId, _adminId, _code, claimedAttempt) {
      if (claimedAttempt !== currentAttempt || state !== "inviting") throw new Error("STALE_ATTEMPT");
      failures.push(claimedAttempt);
      state = "invite_failed";
    },
    mapError: () => "DELIVERY_FAILED",
    audit: async () => {},
  };

  const first = approveAccessRequest(deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });
  await new Promise((resolve) => setImmediate(resolve));

  const second = await approveAccessRequest(deps, {
    requestId: REQUEST.id,
    adminId: "550e8400-e29b-41d4-a716-446655440000",
  });
  releaseFirstInvite();

  await assert.rejects(first, /STALE_ATTEMPT/);
  assert.equal(second.kind, "invited");
  assert.equal(state, "invited");
  assert.deepEqual(completions.map(({ claimedAttempt }) => claimedAttempt), [2]);
  assert.deepEqual(failures, []);
});
