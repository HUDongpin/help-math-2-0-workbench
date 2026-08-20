import assert from "node:assert/strict";
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  CANONICAL_ROOT,
  addReceiptId,
  assertAttemptLeavesUnused,
  authenticatedErrorReceiptForTest,
  canonicalJson,
  classifyFailure,
  closedAuthority,
  computeReviewSetDigest,
  hardcodedIdentityMatchesForTest,
  parseCliForTest,
  publishFixtureAttemptForTest,
  sha256,
  snapshotFixtureFile,
  syntaxCheckBufferForTest,
  unpreservedErrorReceiptForTest,
  validateCanonicalValue,
  validReceiptId,
  validateCanonicalRootLiteral,
  validateInvocationBinding,
  validateParserBufferBinding,
  validateReviewSetManifestShape,
  validateReviewSetOutputCustody,
  writeNoClobberReceipt,
} from "./g4-l10-native-helper-v2_17-review-verifier.mjs";

const VERIFIER = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_17-review-verifier.mjs`;
const PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_17_REVIEW_PROTOCOL_SUCCESSOR.md`;
const HEX_A = "a".repeat(64);
const HEX_B = "b".repeat(64);
const HEX_C = "c".repeat(64);
const SCOPES = ["schema", "adversarial", "whole"];

async function tempDirectory() {
  return mkdtemp("/tmp/g4-l10-v217-focused-");
}

function fixedRow(role, absolutePath, ordinal) {
  return {
    role,
    absolutePath,
    resolvedPath: absolutePath,
    dev: "16777244",
    ino: String(1000 + ordinal),
    mode: role === "target" || role.includes("predecessor") || role.includes("ledger") ? "0444" : "0644",
    nlink: 1,
    bytes: 10 + ordinal,
    lfCount: 1,
    finalLf: true,
    sha256: ordinal % 2 === 0 ? HEX_A : HEX_B,
  };
}

function reviewer(scope, index, directory = "/tmp/g4-v217-fixture") {
  const stem = `${directory}/${scope}`;
  return {
    scope,
    taskSystemId: `task-v217-${index + 1}`,
    reviewerNonce: String(index + 1).repeat(64),
    preflight: {
      attemptOrdinal: 1,
      successOutput: `${stem}-preflight-success.json`,
      errorOutput: `${stem}-preflight-error.json`,
    },
    evidence: {
      attemptOrdinal: 1,
      successOutput: `${stem}-evidence-success.json`,
      errorOutput: `${stem}-evidence-error.json`,
    },
  };
}

function makeManifest({
  reviewSetNonce = "d".repeat(64),
  reviewers = SCOPES.map((scope, index) => reviewer(scope, index)),
  fixedInputs = null,
} = {}) {
  const core = fixedInputs ?? [
    fixedRow("target", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md`, 0),
    fixedRow("protocol", PROTOCOL, 1),
    fixedRow("verifier", VERIFIER, 2),
    fixedRow("focused-test", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs`, 3),
    fixedRow("v2.16-protocol", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md`, 4),
    fixedRow("v2.16-verifier", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.mjs`, 5),
    fixedRow("v2.16-focused-test", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs`, 6),
    fixedRow("v2.15-protocol", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md`, 7),
    fixedRow("v2.15-verifier", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_15-review-verifier.mjs`, 8),
    fixedRow("v2.15-focused-test", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs`, 9),
    fixedRow("v2.14-predecessor", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md`, 10),
    fixedRow("v2.13-predecessor", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_13_SECURITY_CONTRACT_SUCCESSOR.md`, 11),
    fixedRow("v2.12-ledger-source", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md`, 12),
    fixedRow("v2-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md`, 13),
    fixedRow("v2.1-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR.md`, 14),
    fixedRow("v2.2-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md`, 15),
    fixedRow("v2.3-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md`, 16),
    fixedRow("v2.4-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_4_SECURITY_CONTRACT_SUCCESSOR.md`, 17),
    fixedRow("v2.5-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_5_SECURITY_CONTRACT_SUCCESSOR.md`, 18),
    fixedRow("v2.6-production", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR.md`, 19),
    fixedRow("history-closure", `${CANONICAL_ROOT}/reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json`, 20),
  ];
  const body = {
    schemaVersion: 1,
    artifactType: "g4-l10-native-helper-v2-17-authenticated-review-set",
    authority: "correlation-only-never-self-authorizing",
    protocolVersion: "v2.17",
    sourceThreadId: "source-thread-v217",
    userAuthorizationTurnId: "user-turn-v217",
    userAuthorizationTextSha256: HEX_C,
    reviewSetNonce,
    canonicalRoot: {
      declared: CANONICAL_ROOT,
      resolved: CANONICAL_ROOT,
      dev: "16777244",
      ino: "193",
    },
    fixedInputs: core,
    reviewers,
  };
  return { ...body, reviewSetDigest: computeReviewSetDigest(body) };
}

function invocation(manifest, scope, taskSystemId = null, command = "preflight") {
  const row = manifest.reviewers.find((entry) => entry.scope === scope);
  const phase = row[command];
  return {
    command,
    scope,
    reviewerTaskId: taskSystemId ?? row.taskSystemId,
    successOutput: phase.successOutput,
    errorOutput: phase.errorOutput,
  };
}

test("review-set manifest is closed, digest-bound, and never self-authorizing", () => {
  const manifest = makeManifest();
  assert.equal(validateReviewSetManifestShape(manifest), manifest);
  assert.equal(computeReviewSetDigest(manifest), manifest.reviewSetDigest);
  assert.equal(Object.values(closedAuthority()).every((value) => value === false), true);
  assert.equal(manifest.authority, "correlation-only-never-self-authorizing");
});

test("one task/scope preflight cannot be reused by either sibling scope", () => {
  const manifest = makeManifest();
  const schema = manifest.reviewers[0];
  assert.equal(validateInvocationBinding(manifest, invocation(manifest, "schema")), schema);
  assert.throws(
    () => validateInvocationBinding(manifest, invocation(manifest, "adversarial", schema.taskSystemId)),
    /bound to a different scope/,
  );
  assert.throws(
    () => validateInvocationBinding(manifest, invocation(manifest, "whole", schema.taskSystemId)),
    /bound to a different scope/,
  );
});

test("ordered task substitution invalidates the review-set digest", () => {
  const original = makeManifest();
  const changedReviewers = original.reviewers.map((row) => structuredClone(row));
  [changedReviewers[0].taskSystemId, changedReviewers[1].taskSystemId] = [
    changedReviewers[1].taskSystemId,
    changedReviewers[0].taskSystemId,
  ];
  const substituted = { ...original, reviewers: changedReviewers };
  assert.notEqual(computeReviewSetDigest(substituted), original.reviewSetDigest);
  assert.throws(() => validateReviewSetManifestShape(substituted), /reviewSetDigest/);
});

test("a new authenticated-start nonce cannot replay an old receipt", () => {
  const first = makeManifest({ reviewSetNonce: "d".repeat(64) });
  const second = makeManifest({ reviewSetNonce: "e".repeat(64) });
  assert.notEqual(first.reviewSetDigest, second.reviewSetDigest);
  const oldReceipt = addReceiptId("PREFLIGHT", {
    reviewSetDigest: first.reviewSetDigest,
    reviewerTaskId: first.reviewers[0].taskSystemId,
    scope: "schema",
  });
  const relabeled = { ...oldReceipt, reviewSetDigest: second.reviewSetDigest };
  assert.equal(validReceiptId("PREFLIGHT", oldReceipt), true);
  assert.equal(validReceiptId("PREFLIGHT", relabeled), false);
});

test("mixed reviewer-set outputs and alternate output paths are rejected", () => {
  const first = makeManifest({ reviewSetNonce: "d".repeat(64) });
  const second = makeManifest({ reviewSetNonce: "e".repeat(64) });
  const mixed = invocation(first, "schema");
  mixed.successOutput = second.reviewers[0].preflight.successOutput.replace("schema", "schema-other");
  assert.throws(() => validateInvocationBinding(first, mixed), /success output differs/);

  const duplicateOutputs = first.reviewers.map((row) => structuredClone(row));
  duplicateOutputs[1].preflight.successOutput = duplicateOutputs[0].preflight.successOutput;
  const invalid = makeManifest({ reviewers: duplicateOutputs });
  assert.throws(() => validateReviewSetManifestShape(invalid), /output paths must be distinct|reviewSetDigest/);
});

test("reviewer output custody requires one distinct physical parent per reviewer", async () => {
  const directories = await Promise.all(SCOPES.map(() => tempDirectory()));
  try {
    const validReviewers = SCOPES.map((scope, index) => reviewer(scope, index, directories[index]));
    const valid = makeManifest({ reviewers: validReviewers });
    const parents = await validateReviewSetOutputCustody(valid);
    assert.equal(new Set(parents).size, 3);

    const sharedParentReviewers = SCOPES.map((scope, index) => reviewer(
      scope,
      index,
      index < 2 ? directories[0] : directories[2],
    ));
    await assert.rejects(
      validateReviewSetOutputCustody(makeManifest({ reviewers: sharedParentReviewers })),
      /reviewer output parents are not reviewer-unique/,
    );

    const splitParentReviewers = validReviewers.map((row) => structuredClone(row));
    splitParentReviewers[0].evidence.successOutput = `${directories[1]}/schema-evidence-success.json`;
    splitParentReviewers[0].evidence.errorOutput = `${directories[1]}/schema-evidence-error.json`;
    await assert.rejects(
      validateReviewSetOutputCustody(makeManifest({ reviewers: splitParentReviewers })),
      /outputs do not share one physical parent/,
    );
  } finally {
    await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
  }
});

test("only the exact canonical absolute root literal is accepted", () => {
  assert.equal(validateCanonicalRootLiteral(CANONICAL_ROOT), true);
  for (const candidate of [
    `${CANONICAL_ROOT}/`,
    "/tmp/HELP MATH 2.0",
    "/Users/peter/.codex/worktrees/clone/HELP MATH 2.0",
    "/Volumes/WestWorld/HELP MATH 2.0-copy",
  ]) {
    assert.throws(() => validateCanonicalRootLiteral(candidate), /canonical root literal mismatch/);
  }
});

test("one retained descriptor buffer is bound to its exact parser digest", async () => {
  const directory = await tempDirectory();
  try {
    const file = path.join(directory, "input.txt");
    await writeFile(file, "alpha\nbeta\n", { mode: 0o600 });
    const snapshot = await snapshotFixtureFile(file);
    assert.equal(validateParserBufferBinding(snapshot.bytes, snapshot.binding), true);
    assert.equal(snapshot.binding.sha256, sha256(Buffer.from("alpha\nbeta\n")));
    assert.throws(
      () => validateParserBufferBinding(Buffer.from("alpha\nBETA\n"), snapshot.binding),
      /parser buffer digest differs/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("pathname substitution after descriptor open is detected before a snapshot can pass", async () => {
  const directory = await tempDirectory();
  try {
    const file = path.join(directory, "input.txt");
    const displaced = path.join(directory, "displaced.txt");
    await writeFile(file, "expected\n", { mode: 0o600 });
    await assert.rejects(
      snapshotFixtureFile(file, null, {
        afterOpen: async () => {
          await rename(file, displaced);
          await writeFile(file, "replacement\n", { mode: 0o600 });
        },
      }),
      /retained descriptor identity changed during snapshot|pathname differs from retained descriptor after read/,
    );
    assert.equal(await readFile(file, "utf8"), "replacement\n");
    assert.equal(await readFile(displaced, "utf8"), "expected\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("symlink and hard-link aliases cannot become snapshot inputs", async () => {
  const directory = await tempDirectory();
  try {
    const source = path.join(directory, "source.txt");
    const symbolic = path.join(directory, "symbolic.txt");
    const hard = path.join(directory, "hard.txt");
    await writeFile(source, "source\n", { mode: 0o600 });
    await symlink(source, symbolic);
    await assert.rejects(snapshotFixtureFile(symbolic), /ELOOP|symbolic|regular file/);
    await link(source, hard);
    await assert.rejects(snapshotFixtureFile(source), /link count is not one/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("no-clobber publication preserves an existing occupant", async () => {
  const directory = await tempDirectory();
  try {
    const output = path.join(directory, "occupied.json");
    const foreign = Buffer.from("foreign occupant\n");
    await writeFile(output, foreign, { mode: 0o600 });
    await assert.rejects(writeNoClobberReceipt(output, { status: "SHOULD_NOT_WRITE" }), /descriptor-relative receipt writer failed/);
    assert.deepEqual(await readFile(output), foreign);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("success-output collision creates one separate durable error receipt", async () => {
  const directory = await tempDirectory();
  try {
    const successOutput = path.join(directory, "success.json");
    const errorOutput = path.join(directory, "error.json");
    const foreign = Buffer.from("foreign success occupant\n");
    await writeFile(successOutput, foreign, { mode: 0o600 });
    const result = await publishFixtureAttemptForTest({
      successOutput,
      errorOutput,
      successReceipt: { status: "SUCCESS" },
      errorReceipt: { status: "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY" },
    });
    assert.equal(result.status, "DURABLE_ERROR");
    assert.deepEqual(await readFile(successOutput), foreign);
    const durable = JSON.parse(await readFile(errorOutput, "utf8"));
    assert.equal(durable.status, "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY");
    assert.equal(Object.values(durable.authorityEffects).every((value) => value === false), true);
    assert.equal((await lstat(errorOutput)).mode & 0o777, 0o600);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("error-output collision is fail-closed and preserves both occupants", async () => {
  const directory = await tempDirectory();
  try {
    const successOutput = path.join(directory, "success.json");
    const errorOutput = path.join(directory, "error.json");
    const first = Buffer.from("foreign success\n");
    const second = Buffer.from("foreign error\n");
    await writeFile(successOutput, first, { mode: 0o600 });
    await writeFile(errorOutput, second, { mode: 0o600 });
    await assert.rejects(
      publishFixtureAttemptForTest({
        successOutput,
        errorOutput,
        successReceipt: { status: "SUCCESS" },
        errorReceipt: { status: "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY" },
      }),
      /descriptor-relative receipt writer failed/,
    );
    assert.deepEqual(await readFile(successOutput), first);
    assert.deepEqual(await readFile(errorOutput), second);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("failure taxonomy has no undeclared USAGE_ERROR state", () => {
  assert.equal(classifyFailure("preflight", new Error("usage")), "PREFLIGHT_RETRYABLE_NOT_EVIDENCE");
  assert.equal(classifyFailure("evidence", new Error("usage")), "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY");
  assert.equal(classifyFailure("evidence", { name: "Other" }), "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY");
});

test("receipt identity binds review set, reviewer task, scope, and output path", () => {
  const first = addReceiptId("EVIDENCE", {
    reviewSetDigest: HEX_A,
    reviewerTaskId: "task-v217-1",
    scope: "schema",
    successOutput: "/tmp/a.json",
  });
  const second = addReceiptId("EVIDENCE", {
    reviewSetDigest: HEX_A,
    reviewerTaskId: "task-v217-2",
    scope: "adversarial",
    successOutput: "/tmp/b.json",
  });
  assert.notEqual(first.receiptId, second.receiptId);
  assert.equal(validReceiptId("EVIDENCE", first), true);
  assert.equal(validReceiptId("EVIDENCE", { ...first, scope: "whole" }), false);
});

test("canonical JSON grammar rejects non-domain values and fixes key order", () => {
  assert.equal(canonicalJson({ z: [3, 2, 1], a: { y: true, x: null } }), '{"a":{"x":null,"y":true},"z":[3,2,1]}');
  assert.equal(validateCanonicalValue({ plain: "Aπ文" }), true);
  for (const value of [1.5, -0, Number.NaN, Number.POSITIVE_INFINITY, undefined, 1n, new Date(0)]) {
    assert.throws(() => canonicalJson(value), /canonical JSON|outside/);
  }
  assert.throws(() => canonicalJson("\ud800"), /unpaired surrogate/);
  const sparse = [];
  sparse[1] = "occupied";
  assert.throws(() => canonicalJson(sparse), /dense/);
});

test("CLI rejects relative path spellings before normalization", () => {
  const argv = [
    "preflight",
    "--scope", "schema",
    "--reviewer-task-id", "task-v217-1",
    "--review-set-manifest", "relative-manifest.json",
    "--review-set-manifest-sha256", HEX_A,
    "--success-output", "/tmp/v217/success.json",
    "--error-output", "/tmp/v217/error.json",
  ];
  assert.throws(() => parseCliForTest(argv), /must already be an absolute path literal/);
  const alternate = [...argv];
  alternate[alternate.indexOf("relative-manifest.json")] = "/tmp/v217/../v217/manifest.json";
  assert.throws(() => parseCliForTest(alternate), /lexically normalized/);
});

test("retained syntax buffers are checked without a pathname", () => {
  assert.equal(syntaxCheckBufferForTest(Buffer.from("export const valid = 1;\n")).ok, true);
  const invalid = syntaxCheckBufferForTest(Buffer.from("export const = ;\n"));
  assert.equal(invalid.ok, false);
  assert.match(invalid.stderr, /SyntaxError/);
});

test("every target, protocol, predecessor, production, and history replacement invalidates the review-set digest", () => {
  const original = makeManifest();
  const roles = [
    "target",
    "protocol",
    "v2.16-verifier",
    "v2.15-focused-test",
    "v2.14-predecessor",
    "v2.12-ledger-source",
    "v2-production",
    "v2.6-production",
    "history-closure",
  ];
  for (const role of roles) {
    const fixedInputs = original.fixedInputs.map((row) => ({ ...row }));
    fixedInputs.find((row) => row.role === role).sha256 = HEX_C;
    const changed = { ...original, fixedInputs };
    assert.notEqual(computeReviewSetDigest(changed), original.reviewSetDigest, role);
    assert.throws(() => validateReviewSetManifestShape(changed), /reviewSetDigest/, role);
  }
  const exactV216 = "5ce0a5876ec86ffb9facef5c629c47634bcc43c1bb566a52bf319aee2e4b37a9";
  assert.equal(hardcodedIdentityMatchesForTest("v2.16-verifier", { sha256: exactV216 }), true);
  assert.equal(hardcodedIdentityMatchesForTest("v2.16-verifier", { sha256: HEX_C }), false);
  const exactV2 = "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583";
  assert.equal(hardcodedIdentityMatchesForTest("v2-production", { sha256: exactV2 }), true);
  assert.equal(hardcodedIdentityMatchesForTest("v2-production", { sha256: HEX_C }), false);
});

test("authenticated binding survives a post-authentication error before candidate receipt construction", () => {
  const binding = {
    reviewSetManifestAbsolutePath: "/tmp/v217-auth/manifest.json",
    reviewSetManifestSha256: HEX_A,
    reviewSetDigest: HEX_B,
    sourceThreadId: "source-v217",
    userAuthorizationTurnId: "turn-v217",
    userAuthorizationTextSha256: HEX_C,
    reviewSetNonce: "d".repeat(64),
    orderedTaskIds: ["task-v217-1", "task-v217-2", "task-v217-3"],
    scope: "adversarial",
    reviewerTaskId: "task-v217-2",
    reviewerNonce: "2".repeat(64),
  };
  const recovered = {
    command: "evidence",
    scope: "wrong",
    reviewerTaskId: "wrong",
    reviewSetManifest: binding.reviewSetManifestAbsolutePath,
    reviewSetManifestSha256: HEX_C,
    preflightReceipt: "/tmp/v217-auth/preflight.json",
    successOutput: "/tmp/v217-auth/success.json",
    errorOutput: "/tmp/v217-auth/error.json",
  };
  const receipt = authenticatedErrorReceiptForTest(
    recovered,
    new Error("post-authentication collection failed"),
    "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY",
    binding,
  );
  assert.equal(receipt.reviewBindingAuthenticated, true);
  assert.equal(receipt.reviewSetDigest, binding.reviewSetDigest);
  assert.equal(receipt.reviewerTaskId, binding.reviewerTaskId);
  assert.equal(receipt.reviewerNonce, binding.reviewerNonce);
  assert.equal(receipt.scope, binding.scope);
  assert.equal(validReceiptId("ERROR", receipt), true);
});

test("a durable error permanently bars later success for the same attempt leaves", async () => {
  const directory = await tempDirectory();
  try {
    const successOutput = path.join(directory, "success.json");
    const errorOutput = path.join(directory, "error.json");
    const first = await publishFixtureAttemptForTest({
      successOutput,
      errorOutput,
      successReceipt: { status: "SUCCESS" },
      errorReceipt: { status: "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY" },
      forceError: true,
    });
    assert.equal(first.status, "DURABLE_ERROR");
    await assert.rejects(
      publishFixtureAttemptForTest({
        successOutput,
        errorOutput,
        successReceipt: { status: "SUCCESS" },
        errorReceipt: { status: "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY" },
      }),
      /descriptor-relative receipt writer failed|already occupied/,
    );
    await assert.rejects(readFile(successOutput), /ENOENT/);
    assert.equal(JSON.parse(await readFile(errorOutput, "utf8")).status, "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an error-only preoccupation fails closed without creating success", async () => {
  const directory = await tempDirectory();
  try {
    const successOutput = path.join(directory, "success.json");
    const errorOutput = path.join(directory, "error.json");
    const foreign = Buffer.from("foreign error occupant\n");
    await writeFile(errorOutput, foreign, { mode: 0o600 });
    await assert.rejects(assertAttemptLeavesUnused(successOutput, errorOutput), /already occupied/);
    await assert.rejects(
      publishFixtureAttemptForTest({
        successOutput,
        errorOutput,
        successReceipt: { status: "SUCCESS" },
        errorReceipt: { status: "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY" },
      }),
      /descriptor-relative receipt writer failed/,
    );
    await assert.rejects(readFile(successOutput), /ENOENT/);
    assert.deepEqual(await readFile(errorOutput), foreign);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an unpreserved error remains a no-verdict exit-74 receipt", () => {
  const report = addReceiptId("ERROR", {
    status: "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY",
    reviewBindingAuthenticated: true,
    reviewSetDigest: HEX_A,
    reviewerNonce: HEX_B,
    authorityEffects: closedAuthority(),
  });
  const persistence = new Error("error leaf occupied");
  persistence.code = "EEXIST";
  const unpreserved = unpreservedErrorReceiptForTest(
    report,
    "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY",
    persistence,
  );
  assert.equal(unpreserved.status, "ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT");
  assert.equal(unpreserved.originalStatus, "MECHANICAL_ERROR_NO_VERDICT_NO_RETRY");
  assert.equal(unpreserved.exitCode, 74);
  assert.equal(unpreserved.reviewBindingAuthenticated, true);
  assert.equal(unpreserved.receiptPersistenceError.code, "EEXIST");
  assert.equal(validReceiptId("ERROR", unpreserved), true);
  assert.equal(Object.values(unpreserved.authorityEffects).every((value) => value === false), true);
});

test("descriptor-relative creation detects a parent rename after create", async () => {
  const directory = await tempDirectory();
  const moved = `${directory}-moved`;
  const output = path.join(directory, "receipt.json");
  try {
    await assert.rejects(
      writeNoClobberReceipt(output, { status: "FIXTURE" }, {
        afterCreate: async () => {
          await rename(directory, moved);
          await mkdir(directory, { mode: 0o700 });
        },
      }),
      /ENOENT|detached|changed|differs/,
    );
    assert.equal(JSON.parse(await readFile(path.join(moved, "receipt.json"), "utf8")).status, "FIXTURE");
    await assert.rejects(readFile(output), /ENOENT/);
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(moved, { recursive: true, force: true });
  }
});

test("all receipt classes retain closed authority and no formal CLI is exercised", () => {
  const authority = closedAuthority();
  assert.equal(Object.keys(authority).length >= 20, true);
  assert.equal(Object.values(authority).every((value) => value === false), true);
  for (const kind of ["PREFLIGHT", "EVIDENCE", "ERROR", "FIXTURE"]) {
    const receipt = addReceiptId(kind, { authorityEffects: authority, status: "NO_VERDICT" });
    assert.equal(validReceiptId(kind, receipt), true);
    assert.equal(Object.values(receipt.authorityEffects).every((value) => value === false), true);
  }
});
