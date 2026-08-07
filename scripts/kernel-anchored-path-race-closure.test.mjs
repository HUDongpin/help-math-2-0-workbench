import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import * as closure from "./lib/kernel-anchored-path-race-closure.mjs";

const MODULE_PATH = fileURLToPath(new URL("./lib/kernel-anchored-path-race-closure.mjs", import.meta.url));
const BLOCKED_CODE = "KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function planInput(root = "/private/tmp/helpmath-kernel-path-fixture") {
  return {
    transactionId: "kernel-path-fixture-transaction-0001",
    canonicalRootPath: root,
    rootIdentity: {device: "16777234", inode: "987654321"},
    operations: [
      {
        kind: "mkdir-no-replace",
        relativePath: "migrations/fixture/evidence/native-transaction",
        mode: 0o700,
      },
      {
        kind: "publish-file-no-replace",
        relativePath: "migrations/fixture/baseline/original-runtime/requirement.json",
        content: {sha256: sha256("baseline\n"), size: 9, mode: 0o444},
      },
      {
        kind: "replace-file-cas",
        relativePath: "migrations/fixture/evidence/full-frame-coverage.json",
        expected: {
          sha256: sha256("old coverage\n"),
          size: 13,
          mode: 0o644,
          device: "16777234",
          inode: "987654322",
        },
        replacement: {sha256: sha256("new coverage\n"), size: 13, mode: 0o444},
      },
      {
        kind: "unlink-owned-file",
        relativePath: "migrations/fixture/evidence/native-transaction/staging.bin",
        expected: {
          sha256: sha256("owned staging\n"),
          size: 14,
          mode: 0o600,
          device: "16777234",
          inode: "987654323",
        },
      },
    ],
  };
}

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function temporaryRoot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-kernel-path-race-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  return root;
}

test("public foundation is write-disabled and has no adapter or bypass export", async () => {
  assert.deepEqual(Object.keys(closure).sort(), [
    "KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED_CODE",
    "KERNEL_ANCHORED_PATH_RACE_CLOSURE_WRITES_ENABLED",
    "assertKernelAnchoredPathRaceClosureAvailable",
    "createKernelAnchoredPathRaceClosurePlan",
    "executeKernelAnchoredPathRaceClosureTransaction",
    "inspectKernelAnchoredPathRaceClosure",
    "recoverKernelAnchoredPathRaceClosureTransaction",
  ]);
  assert.equal(closure.KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED_CODE, BLOCKED_CODE);
  assert.equal(closure.KERNEL_ANCHORED_PATH_RACE_CLOSURE_WRITES_ENABLED, false);
  assert.equal(closure.executeKernelAnchoredPathRaceClosureTransaction.length, 0);
  assert.equal(closure.recoverKernelAnchoredPathRaceClosureTransaction.length, 0);
  assert.throws(closure.assertKernelAnchoredPathRaceClosureAvailable, {code: BLOCKED_CODE});
  await assert.rejects(closure.executeKernelAnchoredPathRaceClosureTransaction(), {code: BLOCKED_CODE});
  await assert.rejects(closure.recoverKernelAnchoredPathRaceClosureTransaction(), {code: BLOCKED_CODE});
});

test("current public Node surface fails closed on every required dirfd-relative mutation", () => {
  const report = closure.inspectKernelAnchoredPathRaceClosure();
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.blockers), true);
  assert.equal(report.authority, "acceptance-neutral-fail-closed-machine-diagnostic");
  assert.equal(report.productionReady, false);
  assert.equal(report.productionWritesEnabled, false);
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal(report.publicArtifactBoundary.absoluteRootPathPermittedInPublicReportOrReceipt, false);
  assert.equal(report.publicArtifactBoundary.operationPlanDisposition, "private-local-transaction-input-only");
  assert.equal(report.publicNodeSurface.pathnameFallbackPermitted, false);
  assert.deepEqual(report.publicNodeSurface.exposedDirfdOperations, []);
  assert.deepEqual(report.publicNodeSurface.missingDirfdOperations, [
    "fstatat",
    "linkat",
    "mkdirat",
    "openat",
    "renameat",
    "renameatx_np",
    "unlinkat",
  ]);
  assert.equal(report.publicNodeSurface.leafFlags.oNoFollowFinalComponent, true);
  assert.equal(report.publicNodeSurface.leafFlags.oNoFollowAnyExposed, false);
  assert.equal(report.publicNodeSurface.leafFlags.oResolveBeneathExposed, false);
  assert.equal(report.coverageCas.kernelConditionalDestinationIdentityReplaceAvailable, false);
  assert.equal(report.coverageCas.renameSwapThenInspectAccepted, false);
  assert.match(report.coverageCas.reason, /cannot safely roll back over an independent concurrent writer/);
  assert.deepEqual(report.blockers.map(({code}) => code), [
    "NODE_DIRFD_RELATIVE_MUTATION_API_UNAVAILABLE",
    "REVIEWED_NATIVE_DIRFD_HELPER_REQUIRED",
    "KERNEL_CONDITIONAL_COVERAGE_CAS_UNAVAILABLE",
    "ADVERSARIAL_E2E_AND_INDEPENDENT_REVIEW_REQUIRED",
  ]);
});

test("operation plan is deterministic, content-addressed, deeply immutable, and non-executable", () => {
  const first = closure.createKernelAnchoredPathRaceClosurePlan(planInput());
  const second = closure.createKernelAnchoredPathRaceClosurePlan(structuredClone(planInput()));
  assert.deepEqual(first, second);
  const {planSha256, ...withoutHash} = first;
  assert.equal(planSha256, sha256(JSON.stringify(stable(withoutHash))));
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.operations), true);
  assert.equal(Object.isFrozen(first.operations[2].expected), true);
  assert.equal(first.executionEnabled, false);
  assert.equal(first.productionPromotionEnabled, false);
  assert.equal(first.acceptanceEffect, "none");
  assert.deepEqual(first.privacy, {
    disposition: "private-local-transaction-input-only",
    containsWorkstationAbsolutePath: true,
    publicReportOrReceiptEligible: false,
  });
  assert.equal(first.requiredExecutionEngine, "reviewed-native-dirfd-helper-with-true-coverage-cas");
  assert.throws(() => { first.executionEnabled = true; }, TypeError);
  assert.throws(() => { first.operations[0].relativePath = "foreign"; }, TypeError);
});

test("operation plan rejects traversal, normalization ambiguity, source-assets, and target reuse", () => {
  const malicious = [
    "../escape",
    "safe/../escape",
    "/absolute/path",
    "safe\\windows",
    "safe//empty",
    "safe/./dot",
    "source-assets/flash/source.swf",
    `safe/${"e\u0301"}/file`,
    "safe/zero\0byte",
  ];
  for (const relativePath of malicious) {
    const input = planInput();
    input.operations = [{kind: "mkdir-no-replace", relativePath, mode: 0o700}];
    assert.throws(
      () => closure.createKernelAnchoredPathRaceClosurePlan(input),
      /portable relative path|NFKC|empty, dot, or parent|normalized|source-assets/,
      relativePath,
    );
  }

  const duplicate = planInput();
  duplicate.operations = [
    {kind: "mkdir-no-replace", relativePath: "same/path", mode: 0o700},
    {kind: "mkdir-no-replace", relativePath: "same/path", mode: 0o700},
  ];
  assert.throws(() => closure.createKernelAnchoredPathRaceClosurePlan(duplicate), /must not target the same relative path twice/);

  for (const canonicalRootPath of [
    path.parse("/").root,
    "/private/tmp/project/source-assets",
    "/private/tmp/project/source-assets/nested",
    "/private/tmp/project/../other",
  ]) {
    const input = planInput();
    input.canonicalRootPath = canonicalRootPath;
    assert.throws(
      () => closure.createKernelAnchoredPathRaceClosurePlan(input),
      /filesystem root|source-assets|normalized/,
      canonicalRootPath,
    );
  }
});

test("CAS and owned-unlink plans require expected bytes, mode, device, and inode", () => {
  for (const field of ["sha256", "size", "mode", "device", "inode"]) {
    const input = planInput();
    delete input.operations[2].expected[field];
    assert.throws(
      () => closure.createKernelAnchoredPathRaceClosurePlan(input),
      new RegExp(`expected\\.${field}`),
    );
  }
  const sameBytes = planInput();
  sameBytes.operations[2].replacement.sha256 = sameBytes.operations[2].expected.sha256;
  assert.throws(() => closure.createKernelAnchoredPathRaceClosurePlan(sameBytes), /replacement must differ/);
});

test("environment flags, forged adapters, and poison arguments cannot enable execution", async () => {
  const previous = process.env.HELPMATH_KERNEL_PATH_WRITES_ENABLED;
  process.env.HELPMATH_KERNEL_PATH_WRITES_ENABLED = "true";
  const poison = new Proxy({}, {
    get() {
      throw new Error("disabled entry inspected an untrusted argument");
    },
  });
  try {
    const clonedPlan = structuredClone(closure.createKernelAnchoredPathRaceClosurePlan(planInput()));
    await assert.rejects(
      closure.executeKernelAnchoredPathRaceClosureTransaction(poison, {
        nativeAdapter: {reviewed: true, productionReady: true},
      }),
      {code: BLOCKED_CODE},
    );
    await assert.rejects(
      closure.recoverKernelAnchoredPathRaceClosureTransaction(poison),
      {code: BLOCKED_CODE},
    );
    await assert.rejects(
      closure.executeKernelAnchoredPathRaceClosureTransaction(clonedPlan),
      {code: BLOCKED_CODE},
    );
    await assert.rejects(
      closure.recoverKernelAnchoredPathRaceClosureTransaction(clonedPlan),
      {code: BLOCKED_CODE},
    );
  } finally {
    if (previous === undefined) delete process.env.HELPMATH_KERNEL_PATH_WRITES_ENABLED;
    else process.env.HELPMATH_KERNEL_PATH_WRITES_ENABLED = previous;
  }
});

test("symlink ancestor replacement cannot redirect a disabled no-replace publication", async (t) => {
  const root = await temporaryRoot(t);
  const canonicalParent = path.join(root, "trusted", "output-parent");
  const detachedParent = path.join(root, "detached-output-parent");
  const foreignParent = path.join(root, "foreign-output-parent");
  await mkdir(canonicalParent, {recursive: true});
  await mkdir(foreignParent);
  const rootInfo = await lstat(root, {bigint: true});
  const plan = closure.createKernelAnchoredPathRaceClosurePlan({
    transactionId: "kernel-path-adversarial-symlink-0001",
    canonicalRootPath: root,
    rootIdentity: {device: String(rootInfo.dev), inode: String(rootInfo.ino)},
    operations: [{
      kind: "publish-file-no-replace",
      relativePath: "trusted/output-parent/result.json",
      content: {sha256: sha256("candidate\n"), size: 10, mode: 0o444},
    }],
  });
  await rename(canonicalParent, detachedParent);
  await symlink(foreignParent, canonicalParent);
  await assert.rejects(closure.executeKernelAnchoredPathRaceClosureTransaction(plan), {code: BLOCKED_CODE});
  assert.equal(await exists(path.join(foreignParent, "result.json")), false);
  assert.equal(await exists(path.join(detachedParent, "result.json")), false);
});

test("real-directory ancestor substitution cannot redirect a disabled publication", async (t) => {
  const root = await temporaryRoot(t);
  const canonical = path.join(root, "canonical-parent");
  const detached = path.join(root, "detached-parent");
  const replacement = path.join(root, "replacement-parent");
  await mkdir(canonical);
  await mkdir(replacement);
  const rootInfo = await lstat(root, {bigint: true});
  const plan = closure.createKernelAnchoredPathRaceClosurePlan({
    transactionId: "kernel-path-adversarial-directory-0001",
    canonicalRootPath: root,
    rootIdentity: {device: String(rootInfo.dev), inode: String(rootInfo.ino)},
    operations: [{
      kind: "publish-file-no-replace",
      relativePath: "canonical-parent/result.json",
      content: {sha256: sha256("candidate\n"), size: 10, mode: 0o444},
    }],
  });
  await rename(canonical, detached);
  await rename(replacement, canonical);
  await assert.rejects(closure.executeKernelAnchoredPathRaceClosureTransaction(plan), {code: BLOCKED_CODE});
  assert.equal(await exists(path.join(canonical, "result.json")), false);
  assert.equal(await exists(path.join(detached, "result.json")), false);
});

test("destination replacement preserves both expected and foreign coverage bytes", async (t) => {
  const root = await temporaryRoot(t);
  const coverage = path.join(root, "migrations", "fixture", "evidence", "full-frame-coverage.json");
  const displaced = path.join(root, "expected-coverage.displaced");
  const expectedBytes = Buffer.from("expected coverage\n");
  const foreignBytes = Buffer.from("foreign concurrent writer\n");
  const replacementBytes = Buffer.from("candidate replacement\n");
  await mkdir(path.dirname(coverage), {recursive: true});
  await writeFile(coverage, expectedBytes, {mode: 0o644});
  const rootInfo = await lstat(root, {bigint: true});
  const coverageInfo = await lstat(coverage, {bigint: true});
  const plan = closure.createKernelAnchoredPathRaceClosurePlan({
    transactionId: "kernel-path-adversarial-cas-0001",
    canonicalRootPath: root,
    rootIdentity: {device: String(rootInfo.dev), inode: String(rootInfo.ino)},
    operations: [{
      kind: "replace-file-cas",
      relativePath: "migrations/fixture/evidence/full-frame-coverage.json",
      expected: {
        sha256: sha256(expectedBytes),
        size: expectedBytes.length,
        mode: 0o644,
        device: String(coverageInfo.dev),
        inode: String(coverageInfo.ino),
      },
      replacement: {sha256: sha256(replacementBytes), size: replacementBytes.length, mode: 0o444},
    }],
  });
  await rename(coverage, displaced);
  await writeFile(coverage, foreignBytes, {mode: 0o600});
  await assert.rejects(closure.executeKernelAnchoredPathRaceClosureTransaction(plan), {code: BLOCKED_CODE});
  assert.deepEqual(await readFile(displaced), expectedBytes);
  assert.deepEqual(await readFile(coverage), foreignBytes);
});

test("module contains no filesystem mutation call path", async () => {
  const source = await readFile(MODULE_PATH, "utf8");
  for (const method of [
    "appendFile",
    "chmod",
    "chown",
    "copyFile",
    "cp",
    "link",
    "mkdir",
    "rename",
    "rm",
    "rmdir",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile",
  ]) {
    assert.doesNotMatch(source, new RegExp(`fsPromises\\.${method}\\s*\\(`), method);
  }
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /child_process|node-gyp|ffi|dlopen/);
});
