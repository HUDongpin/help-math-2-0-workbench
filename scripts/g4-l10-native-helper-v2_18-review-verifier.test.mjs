import assert from "node:assert/strict";
import {
  chown,
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  AuthenticationFailure,
  AttemptStateMismatch,
  CANONICAL_ROOT,
  EvidenceInputMismatch,
  MechanicalFailure,
  addReceiptMac,
  canonicalJson,
  chooseErrorReceiptDestinationForTest,
  classifyFailure,
  cleanupFailureDiagnosticForTest,
  closeAttemptReservation,
  closedAuthority,
  computeCapabilityCommitment,
  computeReviewSetDigest,
  exitCodeForStatusForTest,
  hardcodedIdentityMatchesForTest,
  isolatedLaunchPolicyForTest,
  localTaskAuthenticationStateForTest,
  outputParentBindingForTest,
  parseCliForTest,
  reserveAttemptLeaves,
  revalidateFixtureSnapshotForTest,
  runFocusedTestSourcesForTest,
  sha256,
  snapshotFixtureFile,
  syntaxCheckBufferForTest,
  validReceiptMac,
  validateCanonicalRootLiteral,
  validateCanonicalValue,
  validateExactPreflightReceiptForTest,
  validateInvocationBinding,
  validateIsolatedStartupEnvironmentForTest,
  validateParserBufferBinding,
  validateReviewSetManifestShape,
  validateReviewSetOutputCustody,
  writeReservedReceipt,
} from "./g4-l10-native-helper-v2_18-review-verifier.mjs";

const TARGET = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_18_SECURITY_CONTRACT_SUCCESSOR.md`;
const PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_18_REVIEW_PROTOCOL_SUCCESSOR.md`;
const VERIFIER = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_18-review-verifier.mjs`;
const FOCUSED_TEST = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_18-review-verifier.test.mjs`;
const EXPECTED_NODE = "/Users/peter/.local/share/node-v24.18.0-darwin-arm64/bin/node";
const HEX_A = "a1".repeat(32);
const HEX_B = "b2".repeat(32);
const HEX_C = "c3".repeat(32);
const EMPTY_SHA256 = sha256(Buffer.alloc(0));
const SCOPES = ["schema", "adversarial", "whole"];

const CORE_INPUTS = [
  ["target", TARGET],
  ["protocol", PROTOCOL],
  ["verifier", VERIFIER],
  ["focused-test", FOCUSED_TEST],
  ["v2.17-target", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.17-protocol", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_17_REVIEW_PROTOCOL_SUCCESSOR.md`],
  ["v2.17-verifier", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_17-review-verifier.mjs`],
  ["v2.17-focused-test", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs`],
  ["v2.16-protocol", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md`],
  ["v2.16-verifier", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.mjs`],
  ["v2.16-focused-test", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs`],
  ["v2.15-protocol", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md`],
  ["v2.15-verifier", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_15-review-verifier.mjs`],
  ["v2.15-focused-test", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs`],
  ["v2.14-predecessor", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.13-predecessor", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_13_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.12-ledger-source", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md`],
  ["v2.1-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.2-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.3-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.4-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_4_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.5-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_5_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["v2.6-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR.md`],
  ["history-closure", `${CANONICAL_ROOT}/reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json`],
];

const RUNTIME_ROWS = [
  {
    role: "env",
    absolutePath: "/usr/bin/env",
    resolvedPath: "/usr/bin/env",
    dev: "101",
    ino: "201",
    uid: 0,
    gid: 0,
    mode: "0755",
    nlink: 1,
    bytes: 102368,
    sha256: "6e506aec3c0cff703ac1e66cedc6f1945354ad41339a38db4425c7c88227128f",
  },
  {
    role: "node",
    absolutePath: EXPECTED_NODE,
    resolvedPath: EXPECTED_NODE,
    dev: "102",
    ino: "202",
    uid: 501,
    gid: 20,
    mode: "0755",
    nlink: 1,
    bytes: 120965360,
    sha256: "ee6fb0e015284d83a91e8ec5213f43a157f8a392b58555301682892ba928c04a",
  },
  {
    role: "python",
    absolutePath: "/usr/bin/python3",
    resolvedPath: "/usr/bin/python3",
    dev: "103",
    ino: "203",
    uid: 0,
    gid: 0,
    mode: "0755",
    nlink: 78,
    bytes: 118928,
    sha256: "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818",
  },
];

function fixedRow(role, absolutePath, ordinal) {
  return {
    role,
    absolutePath,
    resolvedPath: absolutePath,
    dev: String(1000 + ordinal),
    ino: String(2000 + ordinal),
    mode: "0644",
    nlink: 1,
    bytes: 20 + ordinal,
    lfCount: 1,
    finalLf: true,
    sha256: ordinal % 2 === 0 ? HEX_A : HEX_B,
  };
}

function fixedInputs() {
  const core = CORE_INPUTS.map(([role, absolutePath], index) => fixedRow(role, absolutePath, index));
  const history = Array.from({ length: 16 }, (_, index) => fixedRow(
    `history-member-${String(index + 1).padStart(2, "0")}`,
    `${CANONICAL_ROOT}/reports/g4-l10-v218-focused-history-${String(index + 1).padStart(2, "0")}.json`,
    CORE_INPUTS.length + index,
  ));
  return [...core, ...history];
}

function rawCapabilities(index) {
  const prefix = String(index + 1);
  return {
    preflight: `${prefix}0`.repeat(32),
    evidence: `${prefix}1`.repeat(32),
  };
}

async function createFixture() {
  const parents = [];
  for (const scope of SCOPES) {
    const parent = await mkdtemp(`/tmp/g4-l10-v218-${scope}.`);
    await chmod(parent, 0o700);
    parents.push(parent);
  }
  const reviewSetNonce = "d4".repeat(32);
  const capabilities = {};
  const reviewers = [];
  for (let index = 0; index < SCOPES.length; index += 1) {
    const scope = SCOPES[index];
    const parent = parents[index];
    const taskSystemId = `task-v218-${index + 1}`;
    const taskHostId = "host-v218-shared";
    const reviewerNonce = `${index + 5}${index + 5}`.repeat(32);
    const outputParent = await outputParentBindingForTest(parent);
    const phaseCapabilities = rawCapabilities(index);
    capabilities[scope] = phaseCapabilities;
    const phase = (name) => {
      const successOutput = `${parent}/${scope}-${name}-success.json`;
      const errorOutput = `${parent}/${scope}-${name}-error.json`;
      return {
        attemptOrdinal: 1,
        phaseCapabilityCommitment: computeCapabilityCommitment({
        reviewSetNonce,
        taskSystemId,
        taskHostId,
        reviewerNonce,
        scope,
        phase: name,
        outputParent,
        successOutput,
        errorOutput,
        capability: phaseCapabilities[name],
        }),
        successOutput,
        errorOutput,
      };
    };
    reviewers.push({
      scope,
      taskSystemId,
      taskHostId,
      reviewerNonce,
      outputParent,
      preflight: phase("preflight"),
      evidence: phase("evidence"),
    });
  }
  const body = {
    schemaVersion: 2,
    artifactType: "g4-l10-native-helper-v2-18-live-control-plane-bound-review-set",
    authority: "correlation-and-capability-only-never-self-authorizing",
    protocolVersion: "v2.18",
    attestationMode: "live-codex-control-plane",
    portableTaskSystemSignatureAvailable: false,
    localFilesSelfAuthenticateTaskIdentity: false,
    qualificationRequiresBoundThreadObservation: true,
    attemptLedger: "codex-task-history",
    sourceThreadId: "source-thread-v218",
    userAuthorizationTurnId: "user-turn-v218",
    userAuthorizationTextSha256: HEX_C,
    reviewSetNonce,
    canonicalRoot: {
      declared: CANONICAL_ROOT,
      resolved: CANONICAL_ROOT,
      dev: "16777233",
      ino: "193",
    },
    runtimeExecutables: RUNTIME_ROWS.map((row) => ({ ...row })),
    fixedInputs: fixedInputs(),
    reviewers,
  };
  return {
    manifest: { ...body, reviewSetDigest: computeReviewSetDigest(body) },
    capabilities,
    parents,
  };
}

async function cleanupFixture(fixture) {
  await Promise.all(fixture.parents.map((parent) => rm(parent, { recursive: true, force: true })));
}

function invocation(fixture, scope, command = "preflight", overrides = {}) {
  const reviewer = fixture.manifest.reviewers.find((row) => row.scope === scope);
  const phase = reviewer[command];
  return {
    command,
    scope,
    reviewerTaskId: reviewer.taskSystemId,
    phaseCapability: fixture.capabilities[scope][command],
    successOutput: phase.successOutput,
    errorOutput: phase.errorOutput,
    ...overrides,
  };
}

function manifestWithFreshDigest(manifest, mutate) {
  const changed = structuredClone(manifest);
  mutate(changed);
  delete changed.reviewSetDigest;
  changed.reviewSetDigest = computeReviewSetDigest(changed);
  return changed;
}

function preflightBody() {
  return {
    schemaVersion: 2,
    artifactType: "g4-l10-native-helper-v2-18-review-preflight",
    status: "READY_FOR_FORMAL_EVIDENCE",
    reviewBinding: {
      manifestBindingVerified: true,
      phaseCapabilityVerified: true,
      taskIdentityAuthenticatedLocally: false,
      taskTransportAuthenticationRequired: true,
    },
    phaseBinding: {
      phase: "preflight",
      attemptOrdinal: 1,
      expectedInventory: ["a", "b"],
    },
    runtimeExecutables: RUNTIME_ROWS,
    checks: [
      { id: "syntax:verifier", ok: true },
      { id: "focused-test:retained-buffer-execution", ok: true },
    ],
    syntax: { verifier: { ok: true }, focusedTest: { ok: true } },
    focusedTestExecution: {
      ok: true,
      syntaxOk: true,
      exitCode: 0,
      verifierSha256: HEX_A,
      focusedTestSha256: HEX_B,
      transformedSha256: HEX_C,
      importSubstitutionCount: 1,
      expectedTestCount: 33,
      testCount: 33,
      passCount: 33,
      failCount: 0,
      cancelledCount: 0,
      skippedCount: 0,
      todoCount: 0,
      diagnosticSha256: null,
    },
    authorityEffects: closedAuthority(),
  };
}

test("manifest is exact, live-control-plane-bound, 41-input, and closed-authority", async () => {
  const fixture = await createFixture();
  try {
    assert.equal(validateReviewSetManifestShape(fixture.manifest), fixture.manifest);
    assert.equal(fixture.manifest.fixedInputs.length, 41);
    assert.deepEqual(fixture.manifest.fixedInputs.slice(0, 25).map((row) => row.role), CORE_INPUTS.map(([role]) => role));
    assert.equal(fixture.manifest.reviewers.length, 3);
    assert.equal(new Set(fixture.manifest.reviewers.flatMap((row) => [
      row.preflight.successOutput,
      row.preflight.errorOutput,
      row.evidence.successOutput,
      row.evidence.errorOutput,
    ])).size, 12);
    assert.equal(fixture.manifest.localFilesSelfAuthenticateTaskIdentity, false);
    assert.equal(fixture.manifest.qualificationRequiresBoundThreadObservation, true);
    assert.equal(Object.values(closedAuthority()).every((value) => value === false), true);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("manifest rejects extra fields and wrong route, input count, runtime order, or parent prestate", async () => {
  const fixture = await createFixture();
  try {
    const extra = structuredClone(fixture.manifest);
    extra.extra = true;
    assert.throws(() => validateReviewSetManifestShape(extra), EvidenceInputMismatch);
    const wrongRoute = manifestWithFreshDigest(fixture.manifest, (manifest) => {
      manifest.reviewers[1].taskSystemId = manifest.reviewers[0].taskSystemId;
    });
    assert.throws(() => validateReviewSetManifestShape(wrongRoute), /task IDs must be distinct/);
    const shortInputs = manifestWithFreshDigest(fixture.manifest, (manifest) => {
      manifest.fixedInputs.pop();
    });
    assert.throws(() => validateReviewSetManifestShape(shortInputs), /exactly 41/);
    const wrongRuntime = manifestWithFreshDigest(fixture.manifest, (manifest) => {
      [manifest.runtimeExecutables[0], manifest.runtimeExecutables[1]] = [
        manifest.runtimeExecutables[1],
        manifest.runtimeExecutables[0],
      ];
    });
    assert.throws(() => validateReviewSetManifestShape(wrongRuntime), /role mismatch/);
    const wrongParent = manifestWithFreshDigest(fixture.manifest, (manifest) => {
      manifest.reviewers[0].outputParent.nlink = 3;
    });
    assert.throws(() => validateReviewSetManifestShape(wrongParent), /link count two/);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("review-set digest binds task route, parent state, nonce, capability commitment, and inputs", async () => {
  const fixture = await createFixture();
  try {
    const original = fixture.manifest.reviewSetDigest;
    for (const mutate of [
      (manifest) => { manifest.reviewers[0].taskHostId = "host-substituted"; },
      (manifest) => { manifest.reviewers[0].outputParent.ctimeNs = String(BigInt(manifest.reviewers[0].outputParent.ctimeNs) + 1n); },
      (manifest) => { manifest.reviewers[0].reviewerNonce = "ee".repeat(32); },
      (manifest) => { manifest.reviewers[0].preflight.phaseCapabilityCommitment = "ff".repeat(32); },
      (manifest) => { manifest.fixedInputs[40].sha256 = "01".repeat(32); },
    ]) {
      const changed = structuredClone(fixture.manifest);
      mutate(changed);
      assert.notEqual(computeReviewSetDigest(changed), original);
    }
  } finally {
    await cleanupFixture(fixture);
  }
});

test("task ID alone is insufficient; capability binds route, reviewer, phase, parent, and leaves", async () => {
  const fixture = await createFixture();
  try {
    const valid = invocation(fixture, "schema");
    assert.equal(validateInvocationBinding(fixture.manifest, valid).scope, "schema");
    assert.throws(
      () => validateInvocationBinding(fixture.manifest, { ...valid, phaseCapability: "ef".repeat(32) }),
      AuthenticationFailure,
    );
    assert.throws(
      () => validateInvocationBinding(fixture.manifest, {
        ...valid,
        scope: "adversarial",
      }),
      /different scope/,
    );
    assert.throws(
      () => validateInvocationBinding(fixture.manifest, invocation(fixture, "schema", "evidence", {
        phaseCapability: fixture.capabilities.schema.preflight,
      })),
      AuthenticationFailure,
    );
    const changedSet = manifestWithFreshDigest(fixture.manifest, (manifest) => {
      manifest.reviewSetNonce = "f0".repeat(32);
    });
    assert.throws(() => validateInvocationBinding(changedSet, valid), AuthenticationFailure);
    for (const [mutate, invocationFor] of [
      [(manifest) => { manifest.reviewers[0].taskHostId = "host-substituted"; }, () => valid],
      [(manifest) => { manifest.reviewers[0].reviewerNonce = "ef".repeat(32); }, () => valid],
      [(manifest) => { manifest.reviewers[0].outputParent.ctimeNs = String(BigInt(manifest.reviewers[0].outputParent.ctimeNs) + 1n); }, () => valid],
      [(manifest) => { manifest.reviewers[0].preflight.successOutput = `${fixture.parents[0]}/schema-preflight-substituted.json`; }, (manifest) => ({
        ...valid,
        successOutput: manifest.reviewers[0].preflight.successOutput,
      })],
    ]) {
      const substituted = manifestWithFreshDigest(fixture.manifest, mutate);
      assert.throws(
        () => validateInvocationBinding(substituted, invocationFor(substituted)),
        AuthenticationFailure,
      );
    }
  } finally {
    await cleanupFixture(fixture);
  }
});

test("receipt HMAC binds kind, complete body, and capability without serializing the capability", () => {
  const capability = "12".repeat(32);
  const body = { a: 1, nested: { b: 2 } };
  const receipt = addReceiptMac("PREFLIGHT", body, capability);
  assert.equal(validReceiptMac("PREFLIGHT", receipt, capability), true);
  assert.equal(validReceiptMac("EVIDENCE", receipt, capability), false);
  assert.equal(validReceiptMac("PREFLIGHT", receipt, "13".repeat(32)), false);
  assert.equal(validReceiptMac("PREFLIGHT", { ...receipt, a: 2 }, capability), false);
  assert.equal(JSON.stringify(receipt).includes(capability), false);
});

test("complete Phase A recomputation rejects correctly re-MACed truncation, extras, reordering, and nested changes", () => {
  const capability = "21".repeat(32);
  const expected = addReceiptMac("PREFLIGHT", preflightBody(), capability);
  assert.equal(validateExactPreflightReceiptForTest(expected, expected, capability), true);
  const mutations = [
    (body) => { delete body.syntax; },
    (body) => { body.extra = true; },
    (body) => { body.phaseBinding.attemptOrdinal = 2; },
    (body) => { body.checks.reverse(); },
    (body) => { body.focusedTestExecution.passCount = 32; },
    (body) => { body.runtimeExecutables[0].bytes += 1; },
    (body) => { body.authorityEffects.release = true; },
  ];
  for (const mutate of mutations) {
    const body = structuredClone(preflightBody());
    mutate(body);
    const actual = addReceiptMac("PREFLIGHT", body, capability);
    assert.equal(validReceiptMac("PREFLIGHT", actual, capability), true);
    assert.throws(
      () => validateExactPreflightReceiptForTest(actual, expected, capability),
      EvidenceInputMismatch,
    );
  }
});

test("three live reviewer parents validate only at their exact empty manifest prestate", async () => {
  const fixture = await createFixture();
  try {
    assert.equal((await validateReviewSetOutputCustody(fixture.manifest)).length, 3);
    await writeFile(`${fixture.parents[0]}/foreign`, "x");
    await assert.rejects(() => validateReviewSetOutputCustody(fixture.manifest), AttemptStateMismatch);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("two-leaf reservation consumes distinct zero-byte inodes descriptor-relatively", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(
      reviewer.preflight.successOutput,
      reviewer.preflight.errorOutput,
      reviewer.outputParent,
      [],
    );
    assert.notEqual(reservation.success.binding.ino, reservation.error.binding.ino);
    for (const entry of [reservation.success, reservation.error]) {
      assert.equal(entry.binding.bytes, 0);
      assert.equal(entry.binding.sha256, EMPTY_SHA256);
      assert.equal(entry.binding.mode, "0600");
      assert.equal(entry.binding.nlink, 1);
    }
    assert.equal(
      reservation.parentAfter.nlink,
      (await outputParentBindingForTest(fixture.parents[0])).nlink,
    );
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("concurrent reservation has at most one winner and no retry winner", async () => {
  const fixture = await createFixture();
  const reviewer = fixture.manifest.reviewers[1];
  const attempts = await Promise.allSettled([
    reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []),
    reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []),
  ]);
  try {
    const winners = attempts.filter((entry) => entry.status === "fulfilled");
    const losers = attempts.filter((entry) => entry.status === "rejected");
    assert.equal(winners.length, 1);
    assert.equal(losers.length, 1);
    assert.equal(
      losers[0].reason instanceof MechanicalFailure
        || losers[0].reason instanceof AttemptStateMismatch,
      true,
    );
    await closeAttemptReservation(winners[0].value);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("partial two-leaf reservation leaves a spent first inode when the second collides", async () => {
  const fixture = await createFixture();
  try {
    const parent = fixture.parents[2];
    const success = `${parent}/partial-success.json`;
    const error = `${parent}/partial-error.json`;
    await writeFile(error, "occupied", { mode: 0o600 });
    const binding = await outputParentBindingForTest(parent);
    await assert.rejects(
      () => reserveAttemptLeaves(success, error, binding, [path.basename(error)]),
      MechanicalFailure,
    );
    const first = await lstat(success);
    assert.equal(first.isFile(), true);
    assert.equal(first.size, 0);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("writing one reserved leaf preserves the exact zero-byte sibling", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    await writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "candidate" });
    assert.equal((await stat(reviewer.preflight.successOutput)).size > 0, true);
    assert.equal((await stat(reviewer.preflight.errorOutput)).size, 0);
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("a reserved inode cannot be written twice and the first receipt is not clobbered", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    await writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "first" });
    const before = await readFile(reviewer.preflight.successOutput);
    await assert.rejects(
      () => writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "second" }),
      MechanicalFailure,
    );
    assert.deepEqual(await readFile(reviewer.preflight.successOutput), before);
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("nonzero sibling tampering blocks first publication", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    await writeFile(reviewer.preflight.errorOutput, "tamper");
    await assert.rejects(
      () => writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "candidate" }),
      MechanicalFailure,
    );
    assert.equal((await stat(reviewer.preflight.successOutput)).size, 0);
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("frozen leaf GID drift blocks descriptor-relative publication", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    const originalGid = reservation.error.binding.gid;
    const alternateGid = process.getgroups().find((gid) => gid !== originalGid);
    assert.notEqual(alternateGid, undefined, "focused host must expose an alternate supplementary group for the GID drift case");
    await chown(reviewer.preflight.errorOutput, process.getuid(), alternateGid);
    await assert.rejects(
      () => writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "candidate" }),
      MechanicalFailure,
    );
    assert.equal((await stat(reviewer.preflight.successOutput)).size, 0);
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("partial candidate preserves its bytes while the opposite zero leaf receives the error receipt", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    await writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "partial-candidate" });
    const candidateBefore = await readFile(reviewer.preflight.successOutput);
    const destination = await chooseErrorReceiptDestinationForTest(reservation);
    assert.equal(destination.path, reviewer.preflight.errorOutput);
    assert.equal(destination.allowNonzeroSibling, true);
    await writeReservedReceipt(
      reservation,
      destination.path,
      { status: "error-after-partial" },
      { allowNonzeroSibling: destination.allowNonzeroSibling },
    );
    assert.deepEqual(await readFile(reviewer.preflight.successOutput), candidateBefore);
    assert.equal((await stat(reviewer.preflight.errorOutput)).size > 0, true);
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("leaf deletion/recreation cannot reuse the frozen reservation inode", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    await unlink(reviewer.preflight.successOutput);
    await writeFile(reviewer.preflight.successOutput, "", { mode: 0o600 });
    await assert.rejects(
      () => writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "replay" }),
      AttemptStateMismatch,
    );
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("inventory restoration does not restore the frozen parent ctime", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    const transient = `${fixture.parents[0]}/transient`;
    await mkdir(transient);
    await rm(transient, { recursive: true });
    await assert.rejects(
      () => writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "replay" }),
      AttemptStateMismatch,
    );
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    await cleanupFixture(fixture);
  }
});

test("parent rename and same-name replacement is rejected", async () => {
  const fixture = await createFixture();
  let reservation = null;
  try {
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    const moved = `${fixture.parents[0]}-moved`;
    await rename(fixture.parents[0], moved);
    fixture.parents[0] = moved;
    await mkdir(reviewer.outputParent.declaredPath, { mode: 0o700 });
    fixture.parents.push(reviewer.outputParent.declaredPath);
    await assert.rejects(
      () => writeReservedReceipt(reservation, reviewer.preflight.successOutput, { status: "candidate" }),
      MechanicalFailure,
    );
  } finally {
    if (reservation) {
      try { await closeAttemptReservation(reservation); } catch { /* expected detached-parent cleanup */ }
    }
    await cleanupFixture(fixture);
  }
});

test("retained snapshot accepts unchanged bytes and rejects byte, inode, mode, and hard-link drift", async () => {
  const directory = await mkdtemp("/tmp/g4-l10-v218-input.");
  try {
    const unchanged = `${directory}/unchanged.txt`;
    await writeFile(unchanged, "alpha\n", { mode: 0o600 });
    assert.equal(await revalidateFixtureSnapshotForTest(unchanged), true);

    const bytes = `${directory}/bytes.txt`;
    await writeFile(bytes, "alpha\n", { mode: 0o600 });
    await assert.rejects(
      () => revalidateFixtureSnapshotForTest(bytes, async () => writeFile(bytes, "bravo\n")),
      EvidenceInputMismatch,
    );

    const inode = `${directory}/inode.txt`;
    await writeFile(inode, "alpha\n", { mode: 0o600 });
    await assert.rejects(
      () => revalidateFixtureSnapshotForTest(inode, async () => {
        await rename(inode, `${inode}.old`);
        await writeFile(inode, "alpha\n", { mode: 0o600 });
      }),
      EvidenceInputMismatch,
    );

    const mode = `${directory}/mode.txt`;
    await writeFile(mode, "alpha\n", { mode: 0o600 });
    await assert.rejects(
      () => revalidateFixtureSnapshotForTest(mode, async () => chmod(mode, 0o400)),
      EvidenceInputMismatch,
    );

    const linked = `${directory}/linked.txt`;
    await writeFile(linked, "alpha\n", { mode: 0o600 });
    await assert.rejects(
      () => revalidateFixtureSnapshotForTest(linked, async () => link(linked, `${linked}.alias`)),
      EvidenceInputMismatch,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("snapshot and parser reject symlink/hard-link custody and buffer substitution", async () => {
  const directory = await mkdtemp("/tmp/g4-l10-v218-parser.");
  try {
    const source = `${directory}/source.txt`;
    const symbolic = `${directory}/symbolic.txt`;
    const hard = `${directory}/hard.txt`;
    await writeFile(source, "source\n", { mode: 0o600 });
    await symlink(source, symbolic);
    await assert.rejects(() => snapshotFixtureFile(symbolic));
    await link(source, hard);
    await assert.rejects(() => snapshotFixtureFile(source), EvidenceInputMismatch);
    const exactHardLinkSnapshot = await snapshotFixtureFile(source, null, { expectedNlink: 2 });
    assert.equal(exactHardLinkSnapshot.binding.nlink, 2);
    await unlink(hard);
    const snapshot = await snapshotFixtureFile(source);
    assert.equal(validateParserBufferBinding(snapshot.bytes, snapshot.binding), true);
    assert.throws(
      () => validateParserBufferBinding(Buffer.from("changed\n"), snapshot.binding),
      EvidenceInputMismatch,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("formal startup accepts only the exact env-i envelope without leaking values", () => {
  const policy = isolatedLaunchPolicyForTest();
  assert.equal(validateIsolatedStartupEnvironmentForTest(policy.environment, [], policy.node), true);
  assert.equal(
    validateIsolatedStartupEnvironmentForTest(Object.assign(Object.create(null), policy.environment), [], policy.node),
    true,
  );
  for (const mutation of [
    (env) => { env.NODE_OPTIONS = "--require=/tmp/hostile.js"; },
    (env) => { env.PYTHONPATH = "/tmp/hostile"; },
    (env) => { env.DYLD_INSERT_LIBRARIES = "/tmp/hostile.dylib"; },
    (env) => { env.EXTRA = "secret-value-must-not-be-echoed"; },
  ]) {
    const env = { ...policy.environment };
    mutation(env);
    assert.throws(
      () => validateIsolatedStartupEnvironmentForTest(env, [], policy.node),
      (error) => error instanceof AuthenticationFailure
        && !JSON.stringify(error.details).includes("secret-value-must-not-be-echoed"),
    );
  }
  assert.throws(() => validateIsolatedStartupEnvironmentForTest(policy.environment, ["--inspect"], policy.node), AuthenticationFailure);
  assert.throws(() => validateIsolatedStartupEnvironmentForTest(policy.environment, [], "/tmp/node"), AuthenticationFailure);
});

test("retained Worker module execution ignores ambient NODE_OPTIONS preload", async () => {
  const directory = await mkdtemp("/tmp/g4-l10-v218-node-options.");
  const marker = `${directory}/marker`;
  const preload = `${directory}/preload.cjs`;
  const hostileShell = `${directory}/hostile-shell`;
  const hostileKeys = [
    "NODE_OPTIONS",
    "NODE_PATH",
    "npm_config_script_shell",
    "NPM_CONFIG_SCRIPT_SHELL",
    "npm_execpath",
    "npm_node_execpath",
    "DYLD_INSERT_LIBRARIES",
  ];
  const previous = Object.fromEntries(hostileKeys.map((key) => [key, process.env[key]]));
  try {
    await writeFile(preload, `require("node:fs").writeFileSync(${JSON.stringify(marker)}, "executed")\n`);
    await writeFile(hostileShell, `#!/bin/sh\n/usr/bin/touch ${JSON.stringify(marker)}\nexit 97\n`, { mode: 0o700 });
    process.env.NODE_OPTIONS = `--require=${preload}`;
    process.env.NODE_PATH = directory;
    process.env.npm_config_script_shell = hostileShell;
    process.env.NPM_CONFIG_SCRIPT_SHELL = hostileShell;
    process.env.npm_execpath = hostileShell;
    process.env.npm_node_execpath = hostileShell;
    process.env.DYLD_INSERT_LIBRARIES = `${directory}/hostile.dylib`;
    const probeModule = `import { writeFileSync } from "node:fs";\nconst expected = ${JSON.stringify({
      HOME: "/var/empty",
      LANG: "C",
      LC_ALL: "C",
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      TMPDIR: "/tmp",
      __CF_USER_TEXT_ENCODING: "0x1F5:0x0:0x0",
    })};\nconst actual = Object.fromEntries(Object.keys(process.env).sort().map((key) => [key, process.env[key]]));\nif (JSON.stringify(actual) !== JSON.stringify(expected) || process.execArgv.length !== 0) { writeFileSync(${JSON.stringify(marker)}, "ambient-startup-leak"); throw new Error("ambient startup state leaked into retained Worker"); }\nexport const workerIsolation = true;\n`;
    const result = await syntaxCheckBufferForTest(Buffer.from(probeModule));
    assert.equal(result.ok, true);
    await assert.rejects(() => lstat(marker), { code: "ENOENT" });
  } finally {
    for (const key of hostileKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    await rm(directory, { recursive: true, force: true });
  }
});

test("retained focused-test execution rejects zero-test and skipped-test summaries", async () => {
  const verifierSource = Buffer.from("export const retainedSentinel = true;\n");
  const verifierSpecifier = `./g4-l10-native-helper-${"v2_18"}-review-verifier.mjs`;
  const zeroTest = Buffer.from(`import { retainedSentinel } from ${JSON.stringify(verifierSpecifier)};\nvoid retainedSentinel;\n`);
  const skippedTest = Buffer.from(`import test from "node:test";\nimport { retainedSentinel } from ${JSON.stringify(verifierSpecifier)};\nvoid retainedSentinel;\ntest("skipped", { skip: true }, () => {});\n`);
  const zeroResult = await runFocusedTestSourcesForTest(verifierSource, zeroTest);
  const skippedResult = await runFocusedTestSourcesForTest(verifierSource, skippedTest);
  assert.equal(zeroResult.ok, false);
  assert.equal(skippedResult.ok, false);
  assert.equal(skippedResult.skippedCount, 1);
});

test("Python reservation ignores ambient PYTHONPATH and sitecustomize", async () => {
  const fixture = await createFixture();
  const hostile = await mkdtemp("/tmp/g4-l10-v218-python-path.");
  const marker = `${hostile}/marker`;
  const previous = process.env.PYTHONPATH;
  let reservation = null;
  try {
    await writeFile(`${hostile}/sitecustomize.py`, `open(${JSON.stringify(marker)},"w").write("executed")\n`);
    process.env.PYTHONPATH = hostile;
    const reviewer = fixture.manifest.reviewers[0];
    reservation = await reserveAttemptLeaves(reviewer.preflight.successOutput, reviewer.preflight.errorOutput, reviewer.outputParent, []);
    await assert.rejects(() => lstat(marker), { code: "ENOENT" });
  } finally {
    if (reservation) await closeAttemptReservation(reservation);
    if (previous === undefined) delete process.env.PYTHONPATH;
    else process.env.PYTHONPATH = previous;
    await rm(hostile, { recursive: true, force: true });
    await cleanupFixture(fixture);
  }
});

test("failure taxonomy keeps authentication, attempt, evidence, and mechanical classes distinct", () => {
  const usage = (() => {
    try { parseCliForTest([]); } catch (error) { return error; }
    return null;
  })();
  const rows = [
    [new AuthenticationFailure("auth"), "UNAUTHENTICATED_INVOCATION_NO_VERDICT", "UNAUTHENTICATED_INVOCATION_NO_VERDICT"],
    [usage, "UNAUTHENTICATED_INVOCATION_NO_VERDICT", "UNAUTHENTICATED_INVOCATION_NO_VERDICT"],
    [new AttemptStateMismatch("spent"), "ATTEMPT_STATE_MISMATCH_NO_VERDICT_NO_RETRY", "ATTEMPT_STATE_MISMATCH_NO_VERDICT_NO_RETRY"],
    [new EvidenceInputMismatch("input"), "PREFLIGHT_INPUT_MISMATCH_NO_VERDICT_NO_RETRY", "EVIDENCE_INPUT_MISMATCH"],
    [new MechanicalFailure("mechanical"), "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY", "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY"],
    [new Error("unknown"), "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY", "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY"],
  ];
  for (const [error, preflight, evidence] of rows) {
    assert.equal(classifyFailure("preflight", error), preflight);
    assert.equal(classifyFailure("evidence", error), evidence);
  }
});

test("cleanup-close fault produces an unpreserved exit-74 diagnostic", async () => {
  const throwingHandle = { close: async () => { throw new Error("injected close fault"); } };
  const context = { close: async () => { throw new MechanicalFailure("injected context close fault"); } };
  const evidencePrestate = {
    errorSiblingSnapshot: { handle: throwingHandle },
    snapshot: { handle: throwingHandle },
  };
  const reservation = { custody: { handle: throwingHandle } };
  const result = await cleanupFailureDiagnosticForTest(context, evidencePrestate, reservation);
  assert.equal(result.failures.length, 4);
  assert.equal(result.diagnostic.status, "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT");
  assert.equal(result.diagnostic.exitCode, 74);
  assert.equal(result.diagnostic.receiptPersistenceError.name, "MechanicalFailure");
  assert.equal(Object.values(result.diagnostic.authorityEffects).every((value) => value === false), true);
});

test("status exit codes are exact and unknown status fails closed", () => {
  assert.equal(exitCodeForStatusForTest("READY_FOR_FORMAL_EVIDENCE"), 0);
  assert.equal(exitCodeForStatusForTest("VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW"), 0);
  assert.equal(exitCodeForStatusForTest("EVIDENCE_INPUT_MISMATCH"), 3);
  assert.equal(exitCodeForStatusForTest("MECHANICAL_ERROR_NO_VERDICT_NO_RETRY"), 70);
  assert.equal(exitCodeForStatusForTest("UNAUTHENTICATED_INVOCATION_NO_VERDICT"), 77);
  assert.equal(exitCodeForStatusForTest("ATTEMPT_STATE_MISMATCH_NO_VERDICT_NO_RETRY"), 78);
  assert.equal(exitCodeForStatusForTest("unknown"), 74);
});

test("CLI requires phase capabilities and canonical absolute paths", async () => {
  const fixture = await createFixture();
  try {
    const reviewer = fixture.manifest.reviewers[0];
    const base = [
      "preflight",
      "--scope", "schema",
      "--reviewer-task-id", reviewer.taskSystemId,
      "--phase-capability", fixture.capabilities.schema.preflight,
      "--review-set-manifest", "/tmp/manifest.json",
      "--review-set-manifest-sha256", HEX_A,
      "--success-output", reviewer.preflight.successOutput,
      "--error-output", reviewer.preflight.errorOutput,
    ];
    assert.equal(parseCliForTest(base).phaseCapability, fixture.capabilities.schema.preflight);
    assert.throws(() => parseCliForTest(base.filter((_, index) => index !== 5 && index !== 6)));
    const relative = [...base];
    relative[relative.indexOf("/tmp/manifest.json")] = "manifest.json";
    assert.throws(() => parseCliForTest(relative), /absolute path/);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("canonical JSON rejects nonportable values and is key-order stable", () => {
  assert.equal(canonicalJson({ b: 2, a: 1 }), '{"a":1,"b":2}');
  for (const value of [1.5, -0, Number.NaN, Number.POSITIVE_INFINITY, 1n, new Date()]) {
    assert.throws(() => validateCanonicalValue(value), EvidenceInputMismatch);
  }
  assert.throws(() => validateCanonicalValue("\ud800"), EvidenceInputMismatch);
  const sparse = [];
  sparse[1] = "x";
  assert.throws(() => validateCanonicalValue(sparse), EvidenceInputMismatch);
});

test("canonical root literal is exact", () => {
  assert.equal(validateCanonicalRootLiteral(CANONICAL_ROOT), true);
  assert.throws(() => validateCanonicalRootLiteral(`${CANONICAL_ROOT}/`), EvidenceInputMismatch);
});

test("v2.17 predecessor quartet remains hash-pinned and never becomes a v2.18 result", () => {
  const hashes = {
    "v2.17-target": "bbeb9bfb7a436e6144026b18b8c3629af192a0cf035f87bd0de26484bf346ef3",
    "v2.17-protocol": "7d4fd2861d53f57c1d1ee06b006784fbf1933739a92ec04733c4364723460f44",
    "v2.17-verifier": "20bdbd5e481f898d5c64c89b6487bd0c6ad125c547e96ff66ad8c6c6f6723bf0",
    "v2.17-focused-test": "f25d0b78eff61f9184baddf10da6fee467e69cc53be9b0c63a91b8d4897cf8d1",
  };
  for (const [role, digest] of Object.entries(hashes)) {
    assert.equal(hardcodedIdentityMatchesForTest(role, { sha256: digest }), true);
    assert.equal(hardcodedIdentityMatchesForTest(role, { sha256: HEX_A }), false);
  }
});

test("local authentication state never claims Codex task identity", () => {
  assert.deepEqual(localTaskAuthenticationStateForTest(), {
    taskIdentityAuthenticatedLocally: false,
    taskTransportAuthenticationRequired: true,
  });
  const policy = isolatedLaunchPolicyForTest();
  assert.equal(policy.node, EXPECTED_NODE);
  assert.deepEqual(policy.pythonFlags, ["-I", "-S", "-E"]);
  assert.equal(policy.cwd, "/var/empty");
});

test("manifest parent physical paths are direct children of physical tmp", async () => {
  const fixture = await createFixture();
  try {
    const physicalTmp = await realpath("/tmp");
    for (const reviewer of fixture.manifest.reviewers) {
      assert.equal(path.dirname(reviewer.outputParent.resolvedPath), physicalTmp);
      assert.equal((await stat(reviewer.outputParent.declaredPath)).isDirectory(), true);
    }
  } finally {
    await cleanupFixture(fixture);
  }
});
