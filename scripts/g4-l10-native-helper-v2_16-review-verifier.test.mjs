import assert from "node:assert/strict";
import {
  chmod,
  link,
  lstat,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_ROOT,
  addReceiptId,
  canonicalJson,
  classifyFailure,
  closedAuthority,
  computeReviewSetDigest,
  publishFixtureAttemptForTest,
  sha256,
  snapshotFixtureFile,
  validReceiptId,
  validateCanonicalRootLiteral,
  validateInvocationBinding,
  validateParserBufferBinding,
  validateReviewSetManifestShape,
  validateReviewSetOutputCustody,
  writeNoClobberReceipt,
} from "./g4-l10-native-helper-v2_16-review-verifier.mjs";

const VERIFIER = `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.mjs`;
const PROTOCOL = `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md`;
const HEX_A = "a".repeat(64);
const HEX_B = "b".repeat(64);
const HEX_C = "c".repeat(64);
const SCOPES = ["schema", "adversarial", "whole"];

async function tempDirectory() {
  return mkdtemp("/tmp/g4-l10-v216-focused-");
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

function reviewer(scope, index, directory = "/tmp/g4-v216-fixture") {
  const stem = `${directory}/${scope}`;
  return {
    scope,
    taskSystemId: `task-v216-${index + 1}`,
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
    fixedRow("target", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md`, 0),
    fixedRow("protocol", PROTOCOL, 1),
    fixedRow("verifier", VERIFIER, 2),
    fixedRow("focused-test", `${CANONICAL_ROOT}/scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs`, 3),
    fixedRow("v2.13-predecessor", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_13_SECURITY_CONTRACT_SUCCESSOR.md`, 4),
    fixedRow("v2.12-ledger-source", `${CANONICAL_ROOT}/docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md`, 5),
    fixedRow("history-closure", `${CANONICAL_ROOT}/reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json`, 6),
  ];
  const body = {
    schemaVersion: 1,
    artifactType: "g4-l10-native-helper-v2-16-authenticated-review-set",
    authority: "correlation-only-never-self-authorizing",
    protocolVersion: "v2.16",
    sourceThreadId: "source-thread-v216",
    userAuthorizationTurnId: "user-turn-v216",
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
    await assert.rejects(writeNoClobberReceipt(output, { status: "SHOULD_NOT_WRITE" }), /EEXIST/);
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
      /EEXIST/,
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
    reviewerTaskId: "task-v216-1",
    scope: "schema",
    successOutput: "/tmp/a.json",
  });
  const second = addReceiptId("EVIDENCE", {
    reviewSetDigest: HEX_A,
    reviewerTaskId: "task-v216-2",
    scope: "adversarial",
    successOutput: "/tmp/b.json",
  });
  assert.notEqual(first.receiptId, second.receiptId);
  assert.equal(validReceiptId("EVIDENCE", first), true);
  assert.equal(validReceiptId("EVIDENCE", { ...first, scope: "whole" }), false);
});

test("successor source has no pathname readFile parser and exposes no formal test mode", async () => {
  const source = await readFile(VERIFIER, "utf8");
  assert.doesNotMatch(source, /(?<!\.)\breadFile\s*\(/);
  assert.match(source, /handle\.readFile\(\)/);
  assert.match(source, /O_NOFOLLOW/);
  assert.match(source, /CANONICAL_ROOT = "\/Volumes\/WestWorld\/HELP MATH 2\.0"/);
  assert.doesNotMatch(source, /--test-mode|formal-test|(?:return|status:)\s*["']USAGE_ERROR["']/);
  assert.match(source, /ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT/);
  assert.equal(canonicalJson(closedAuthority()).includes("true"), false);
});

test("focused tests never invoke the formal preflight or evidence CLI", async () => {
  const source = await readFile(fileURLToPath(import.meta.url), "utf8");
  const forbiddenNames = [
    ["node:child", "_process"].join(""),
    ["spawn", "Sync"].join(""),
    ["exec", "File"].join(""),
  ];
  for (const forbiddenName of forbiddenNames) assert.equal(source.includes(forbiddenName), false);
  assert.doesNotMatch(source, /\[\s*["']preflight["']|\[\s*["']evidence["']/);
});
