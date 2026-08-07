#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  copyFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawn, spawnSync} from "node:child_process";
import test from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";
import {
  WAVE2B_AUTHORITY_BOUNDARY,
  WAVE2B_CLOSURE_PATHS,
  WAVE2B_PROTECTED_PINS,
  executeWave2bSecurityClosure,
  inspectWave2bSecurityClosure,
  recoverWave2bSecurityClosure,
} from "./rebind-g4-l3-source-static-source-audits-wave2b.mjs";
import {
  CAS_STATES,
  acquireWave2bLock,
  adoptWave2bLockForRecovery,
  applyWave2bCasBatch,
  recoverWave2bCasBatch,
  releaseWave2bLock,
} from "./rebind-g4-l3-source-static-source-audits-wave2b-cas.mjs";
import {
  checkDerivedRefreshReceipt,
} from "./build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
const SOURCE_ROOT = path.resolve(path.dirname(TEST_PATH), "..");
const PRIOR_TRANSACTION_ID =
  "9986e13f4520001c4366a591b7c40bbd66953b7a9b9b6dc5be25d07300c763de";
const PRIOR_TRANSACTION_PATH =
  `work/g4-l3-source-static-source-audit-rebind-wave2/transactions/${PRIOR_TRANSACTION_ID}`;
const CURRENT_DERIVED_REFRESH =
  await checkDerivedRefreshReceipt({root: SOURCE_ROOT});
const HISTORICAL_PROTECTED_FIXTURE_SKIP =
  "the immutable Wave2B wrapper pins transaction-time ledgers whose original " +
  "bytes are no longer live; the verified derived-refresh successor binds " +
  "the intentional strict-zero unpublished transition";

function historicalProtectedTest(name, fn) {
  return test(name, {skip: HISTORICAL_PROTECTED_FIXTURE_SKIP}, fn);
}

const FIXED_PATHS = [
  WAVE2B_CLOSURE_PATHS.script,
  WAVE2B_CLOSURE_PATHS.test,
  WAVE2B_CLOSURE_PATHS.cas,
  WAVE2B_CLOSURE_PATHS.casTest,
  WAVE2B_CLOSURE_PATHS.priorWriter,
  WAVE2B_CLOSURE_PATHS.priorWriterTest,
  WAVE2B_CLOSURE_PATHS.priorReceipt,
  WAVE2B_CLOSURE_PATHS.candidateBuilder,
  WAVE2B_CLOSURE_PATHS.sourceAuditMaterializer,
  ...WAVE2B_PROTECTED_PINS.map((pin) => pin.path),
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function refingerprint(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  value[field] = sha256(Buffer.from(stableJson(copy)));
  return value;
}

async function overwriteFrozenJson(target, value) {
  await chmod(target, 0o644);
  await writeFile(target, Buffer.from(stableJson(value)));
  await chmod(target, 0o444);
}

async function overwriteFrozenBytes(target, bytes) {
  await chmod(target, 0o644);
  await writeFile(target, bytes);
  await chmod(target, 0o444);
}

async function copyOne(sourceRoot, targetRoot, relativePath) {
  const source = path.join(sourceRoot, ...relativePath.split("/"));
  const target = path.join(targetRoot, ...relativePath.split("/"));
  await mkdir(path.dirname(target), {recursive: true});
  await copyFile(source, target);
  const metadata = await lstat(source);
  await chmod(target, metadata.mode & 0o777);
}

async function fixtureMemberPaths() {
  const receipt = JSON.parse(
    await readFile(path.join(
      SOURCE_ROOT,
      ...WAVE2B_CLOSURE_PATHS.priorReceipt.split("/"),
    )),
  );
  return receipt.items.flatMap((item) => [
    item.currentEvidence.sourceAudit.path,
    item.specPath,
    item.preimages.candidateJson.path,
    item.preimages.candidateMarkdown.path,
  ]);
}

async function makeFixture() {
  const tempParent = await realpath(os.tmpdir());
  const created = await mkdtemp(path.join(tempParent, "g4-l3-wave2b-test-"));
  const root = await realpath(created);
  const paths = [...new Set([
    ...FIXED_PATHS,
    ...await fixtureMemberPaths(),
  ])];
  for (const relativePath of paths) {
    await copyOne(SOURCE_ROOT, root, relativePath);
  }
  const priorSource = path.join(
    SOURCE_ROOT,
    ...PRIOR_TRANSACTION_PATH.split("/"),
  );
  const priorTarget = path.join(root, ...PRIOR_TRANSACTION_PATH.split("/"));
  await mkdir(path.dirname(priorTarget), {recursive: true});
  await cp(priorSource, priorTarget, {
    recursive: true,
    preserveTimestamps: true,
    force: false,
    errorOnExist: true,
  });
  return root;
}

async function disposeFixture(root) {
  assert.match(path.basename(root), /^g4-l3-wave2b-test-/u);
  await rm(root, {recursive: true, force: true});
}

async function withFixture(callback) {
  const root = await makeFixture();
  try {
    return await callback(root);
  } finally {
    await disposeFixture(root);
  }
}

async function snapshotTree(root, {
  ignoreAtime = true,
} = {}) {
  const rows = [];
  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const metadata = await lstat(absolute);
      if (entry.isDirectory()) {
        rows.push({
          path: relative,
          kind: "directory",
          mode: metadata.mode & 0o777,
        });
        await visit(absolute, relative);
      } else if (entry.isSymbolicLink()) {
        rows.push({path: relative, kind: "symlink"});
      } else if (entry.isFile()) {
        const bytes = await readFile(absolute);
        rows.push({
          path: relative,
          kind: "file",
          mode: metadata.mode & 0o777,
          bytes: bytes.length,
          sha256: sha256(bytes),
          ...(ignoreAtime ? {} : {mtimeMs: metadata.mtimeMs}),
        });
      } else {
        rows.push({path: relative, kind: "other"});
      }
    }
  }
  await visit(root);
  return rows;
}

function fixturePath(root, relativePath) {
  return path.join(root, ...relativePath.split("/"));
}

async function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({code, signal}));
  });
}

async function waitForJsonLine(child, timeoutMs = 120_000) {
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let stdout = "";
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timed out waiting for child phase; stderr=${stderr}`));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      child.stdout.off("data", onData);
      child.off("exit", onExit);
      child.off("error", onError);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onExit = (code, signal) => {
      cleanup();
      reject(new Error(
        `child exited before phase (code=${code}, signal=${signal}); stderr=${stderr}`,
      ));
    };
    const onData = (chunk) => {
      stdout += chunk;
      const newline = stdout.indexOf("\n");
      if (newline < 0) return;
      cleanup();
      try {
        resolve(JSON.parse(stdout.slice(0, newline)));
      } catch (error) {
        reject(new Error(
          `child emitted non-JSON phase line: ${stdout.slice(0, newline)}`,
          {cause: error},
        ));
      }
    };
    child.stdout.on("data", onData);
    child.once("exit", onExit);
    child.once("error", onError);
  });
}

async function waitForCanonicalReceipt(root, child, timeoutMs = 120_000) {
  const receiptPath = fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt);
  const lockPath = fixturePath(root, WAVE2B_CLOSURE_PATHS.lock);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error("child exited before canonical receipt observation");
    }
    try {
      const metadata = await lstat(receiptPath);
      const lock = await lstat(lockPath);
      if (
        metadata.isFile() &&
        (metadata.mode & 0o777) === 0o444 &&
        lock.isDirectory()
      ) {
        const receipt = JSON.parse(await readFile(receiptPath));
        if (
          receipt.publicationSeal?.sealType ===
            "wave2b-receipt-last-prepared-commit-binding"
        ) {
          return {
            phase: "canonical-published",
            transactionId: receipt.transactionId,
          };
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  throw new Error("timed out waiting for canonical receipt with residual lock");
}

async function crashApplyAtPhase(root, phase) {
  const moduleUrl = pathToFileURL(
    fixturePath(root, WAVE2B_CLOSURE_PATHS.script),
  ).href;
  const source = `
    const module = await import(${JSON.stringify(moduleUrl)});
    await module.executeWave2bSecurityClosure({
      projectRoot: ${JSON.stringify(root)},
      apply: true,
      phaseObserver: async (event) => {
        if (event.phase === ${JSON.stringify(phase)}) {
          process.stdout.write(JSON.stringify(event) + "\\n");
          await new Promise(() => {});
        }
      },
    });
  `;
  const child = spawn(process.execPath, ["--input-type=module", "-e", source], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const event = phase === "canonical-published"
    ? await waitForCanonicalReceipt(root, child)
    : await waitForJsonLine(child);
  const exitPromise = waitForExit(child);
  child.kill("SIGKILL");
  const exited = await exitPromise;
  assert.equal(exited.signal, "SIGKILL");
  return event;
}

async function deathDecisionFor(root, transactionId) {
  const binding = JSON.parse(await readFile(fixturePath(
    root,
    `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${transactionId}/lock-binding.json`,
  )));
  return {
    schemaVersion: 1,
    decisionType: "wave2b-runtime-lock-owner-liveness-decision",
    decision: "dead",
    transactionId,
    acquisitionId: binding.acquisitionId,
    ownerSha256: binding.ownerSha256,
    descriptorSha256: binding.descriptorSha256,
    decidingAuthority: "runtime-lock-liveness-authority-only",
    projectOwnerAcceptanceClaimed: false,
    humanReviewClaimed: false,
    releaseAuthorityClaimed: false,
    evidenceSha256: "d".repeat(64),
  };
}

async function assertAllSpecsAtPreimage(root) {
  const prior = JSON.parse(await readFile(
    fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt),
  ));
  for (const item of prior.items) {
    const spec = JSON.parse(await readFile(fixturePath(root, item.specPath)));
    assert.equal(
      spec.integrationBindings.filter(
        (binding) => binding === WAVE2B_CLOSURE_PATHS.receipt,
      ).length,
      0,
      item.animationId,
    );
  }
}

async function replaceWithSameBytesNewInode(target) {
  const before = await lstat(target);
  const temporary = `${target}.same-byte-replacement`;
  await copyFile(target, temporary);
  await chmod(temporary, before.mode & 0o777);
  await rename(temporary, target);
  const after = await lstat(target);
  assert.notEqual(String(after.ino), String(before.ino));
}

async function bumpDirectoryTimestamp(directory) {
  const before = await lstat(directory);
  const marker = path.join(
    directory,
    `.wave2b-external-drift-${process.pid}-${Date.now()}`,
  );
  await writeFile(marker, Buffer.from("external drift\n"));
  await unlink(marker);
  const after = await lstat(directory);
  assert.ok(
    after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs ||
      after.nlink !== before.nlink,
    `${directory}: test did not change directory identity`,
  );
  return after;
}

async function replaceResidualLockWithForeignClone(root) {
  const lockTarget = fixturePath(root, WAVE2B_CLOSURE_PATHS.lock);
  const displaced = `${lockTarget}.displaced-bound-lock`;
  const original = await lstat(lockTarget);
  await rename(lockTarget, displaced);
  await mkdir(lockTarget, {mode: 0o700});
  const ownerTarget = path.join(lockTarget, "owner.json");
  await copyFile(path.join(displaced, "owner.json"), ownerTarget);
  await chmod(ownerTarget, 0o444);
  const foreign = await lstat(lockTarget);
  assert.notEqual(String(foreign.ino), String(original.ino));
  return {lockTarget, displaced, foreign};
}

historicalProtectedTest(
  "default inspection is a true dry-run and creates no work/receipt",
  async () => {
  await withFixture(async (root) => {
    const before = await snapshotTree(root);
    const result = await executeWave2bSecurityClosure({projectRoot: root});
    const after = await snapshotTree(root);
    assert.equal(result.mode, "dry-run");
    assert.equal(result.status, "ready-no-writes-performed");
    assert.equal(result.memberCount, 19);
    assert.equal(result.exactBytesAddedPerSpec, 85);
    assert.equal(result.priorTree.fileCount, 120);
    assert.equal(result.priorTree.totalBytes, 2_097_970);
    assert.equal(result.candidateRebuildIncluded, false);
    assert.equal(result.strictAcceptanceEffect, "none");
    assert.equal(result.releaseEffect, "none");
    assert.deepEqual(after, before);
    await assert.rejects(
      lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt)),
      {code: "ENOENT"},
    );
    await assert.rejects(
      lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.workRoot)),
      {code: "ENOENT"},
    );
  });
});

historicalProtectedTest(
  "fixture apply archives 19 specs/38 candidates, commits S6, and replay is read-only",
  async () => {
  await withFixture(async (root) => {
    const receiptSource = JSON.parse(
      await readFile(fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt)),
    );
    const protectedBefore = new Map();
    for (const pin of WAVE2B_PROTECTED_PINS) {
      protectedBefore.set(pin.path, sha256(await readFile(
        fixturePath(root, pin.path),
      )));
    }
    const candidatesBefore = new Map();
    for (const item of receiptSource.items) {
      for (const key of ["candidateJson", "candidateMarkdown"]) {
        const relativePath = item.preimages[key].path;
        candidatesBefore.set(
          relativePath,
          sha256(await readFile(fixturePath(root, relativePath))),
        );
      }
    }

    const applied = await executeWave2bSecurityClosure({
      projectRoot: root,
      apply: true,
    });
    assert.equal(applied.mode, "replay");
    assert.equal(applied.status, "already-committed-and-verified");
    const receiptPath = fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt);
    const receipt = JSON.parse(await readFile(receiptPath));
    assert.equal(receipt.scope.memberCount, 19);
    assert.equal(receipt.scope.bytesAddedPerSpec, 85);
    assert.equal(receipt.scope.candidateReportsRebuiltByThisTransaction, false);
    assert.equal(receipt.scope.candidateRebuildRequiredAfterTransaction, true);
    assert.equal(receipt.scope.strictCompleteMembersCreated, 0);
    assert.equal(receipt.scope.releaseMembersPublished, 0);
    assert.deepEqual(receipt.authorityBoundary, WAVE2B_AUTHORITY_BOUNDARY);
    assert.equal(receipt.authorityBoundary.ownerAcceptanceCreated, false);
    assert.equal(receipt.authorityBoundary.strictCompletionCreated, false);
    assert.equal(receipt.authorityBoundary.strictAcceptanceEffect, "none");
    assert.equal(receipt.authorityBoundary.releaseEffect, "none");
    assert.match(
      JSON.stringify(receipt),
      /does not impersonate or satisfy any human evidence role/u,
    );

    const transactionRoot = fixturePath(
      root,
      `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${receipt.transactionId}`,
    );
    const plan = JSON.parse(await readFile(path.join(transactionRoot, "plan.json")));
    const commit = JSON.parse(
      await readFile(path.join(transactionRoot, "commit.json")),
    );
    const preparedReceiptBytes = await readFile(
      path.join(transactionRoot, "prepared", "receipt.json"),
    );
    const priorTreeManifest = JSON.parse(await readFile(
      path.join(transactionRoot, "prior-wave2-tree-manifest.json"),
    ));
    assert.equal(plan.items.length, 19);
    assert.deepEqual(
      plan.items.map((item) => item.animationId),
      receipt.items.map((item) => item.animationId),
    );
    assert.equal(plan.lockInIdentitySnapshot.exactInputs.length, 10);
    assert.equal(plan.lockInIdentitySnapshot.implementation.length, 2);
    assert.equal(plan.lockInIdentitySnapshot.protectedPins.length, 10);
    assert.equal(plan.lockInIdentitySnapshot.sourceAudits.length, 19);
    assert.equal(plan.lockInIdentitySnapshot.candidatePreimages.length, 38);
    assert.equal(plan.lockInIdentitySnapshot.specPreimages.length, 19);
    assert.equal(
      typeof plan.lockInIdentitySnapshot.priorTreeManifest.files[0].mtimeMs,
      "string",
    );
    assert.equal(priorTreeManifest.fileCount, 120);
    assert.equal(priorTreeManifest.directoryCount, 45);
    assert.equal(priorTreeManifest.totalBytes, 2_097_970);
    assert.equal(
      priorTreeManifest.contentTreeSha256,
      "e45e5d978def7061f8382f26f04defaeb1049867d12aed2800f4ed00dcd86cf2",
    );
    assert.equal(commit.specCasFinalState, CAS_STATES.VERIFIED);
    assert.equal(
      commit.commitType,
      "g4-l3-source-static-wave2b-security-closure-prepared-commit",
    );
    assert.equal(commit.orderedSpecFinalIdentities.length, 19);
    assert.notDeepEqual(preparedReceiptBytes, await readFile(receiptPath));
    assert.deepEqual(
      receipt.publicationSeal.preparedCommit,
      {
        path:
          `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${receipt.transactionId}/commit.json`,
        bytes: (await readFile(path.join(transactionRoot, "commit.json"))).length,
        sha256: sha256(await readFile(path.join(transactionRoot, "commit.json"))),
        mode: 0o444,
      },
    );
    assert.equal(commit.candidateRebuildState, "pending-outside-transaction");
    assert.equal(commit.strictAcceptanceEffect, "none");
    assert.equal(commit.releaseEffect, "none");
    for (const item of plan.items) {
      const spec = await readFile(fixturePath(root, item.specPostimage.path));
      assert.equal(spec.length, item.specPreimage.bytes + 85);
      assert.equal(sha256(spec), item.specPostimage.sha256);
      const value = JSON.parse(spec);
      assert.equal(
        value.integrationBindings.filter(
          (binding) => binding === WAVE2B_CLOSURE_PATHS.receipt,
        ).length,
        1,
      );
      assert.equal(
        value.integrationBindings.at(-1),
        WAVE2B_CLOSURE_PATHS.receipt,
      );
      for (const [archive, expected] of [
        [item.archives.spec, item.specPreimage],
        [item.archives.candidateJson, item.candidateJsonPreimage],
        [item.archives.candidateMarkdown, item.candidateMarkdownPreimage],
      ]) {
        const archived = await readFile(fixturePath(root, archive));
        assert.equal(archived.length, expected.bytes);
        assert.equal(sha256(archived), expected.sha256);
        assert.equal(
          (await lstat(fixturePath(root, archive))).mode & 0o777,
          0o444,
        );
      }
    }
    for (const [relativePath, digest] of candidatesBefore) {
      assert.equal(
        sha256(await readFile(fixturePath(root, relativePath))),
        digest,
      );
    }
    for (const [relativePath, digest] of protectedBefore) {
      assert.equal(
        sha256(await readFile(fixturePath(root, relativePath))),
        digest,
      );
    }
    await assert.rejects(
      lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock)),
      {code: "ENOENT"},
    );

    const beforeReplay = await snapshotTree(root);
    const replay = await executeWave2bSecurityClosure({
      projectRoot: root,
      apply: true,
    });
    const afterReplay = await snapshotTree(root);
    assert.equal(replay.status, "already-committed-and-verified");
    assert.equal(
      replay.candidateRebuild.state,
      "candidate-rebuild-pending",
    );
    assert.deepEqual(afterReplay, beforeReplay);

    const candidatePath = candidatesBefore.keys().next().value;
    const candidateTarget = fixturePath(root, candidatePath);
    await replaceWithSameBytesNewInode(candidateTarget);
    const sameBytesReplay = await inspectWave2bSecurityClosure({
      projectRoot: root,
    });
    assert.equal(
      sameBytesReplay.candidateRebuild.state,
      "candidate-rebuild-pending",
    );

    await writeFile(candidateTarget, Buffer.from('{"external":true}\n'));
    const externalReplay = await inspectWave2bSecurityClosure({
      projectRoot: root,
    });
    assert.equal(
      externalReplay.status,
      "already-committed-and-verified",
    );
    assert.equal(
      externalReplay.candidateRebuild.counts[
        "candidate-rebuild-external-unverified"
      ],
      1,
    );

    await unlink(candidateTarget);
    await symlink(fixturePath(root, ".gitignore"), candidateTarget);
    const unsafeReplay = await inspectWave2bSecurityClosure({
      projectRoot: root,
    });
    assert.equal(unsafeReplay.status, "already-committed-and-verified");
    assert.equal(
      unsafeReplay.candidateRebuild.counts[
        "candidate-rebuild-external-unverified-unsafe"
      ],
      1,
    );

    const canonicalReceiptTarget = fixturePath(
      root,
      WAVE2B_CLOSURE_PATHS.receipt,
    );
    const planTarget = path.join(transactionRoot, "plan.json");
    const commitTarget = path.join(transactionRoot, "commit.json");
    const lockBindingTarget = path.join(transactionRoot, "lock-binding.json");
    const receiptOriginal = await readFile(canonicalReceiptTarget);
    const planOriginal = await readFile(planTarget);
    const commitOriginal = await readFile(commitTarget);
    const lockBindingOriginal = await readFile(lockBindingTarget);

    const authorityTamper = JSON.parse(receiptOriginal);
    authorityTamper.authorityBoundary.ownerAcceptanceCreated = true;
    refingerprint(authorityTamper, "receiptFingerprintSha256");
    await overwriteFrozenJson(canonicalReceiptTarget, authorityTamper);
    await assert.rejects(
      inspectWave2bSecurityClosure({projectRoot: root}),
      /prepared receipt|semantics\/authority|differs/u,
    );
    await overwriteFrozenBytes(canonicalReceiptTarget, receiptOriginal);

    const planTamper = JSON.parse(planOriginal);
    planTamper.items = planTamper.items.slice(0, 18);
    planTamper.memberCount = 18;
    refingerprint(planTamper, "planFingerprintSha256");
    await overwriteFrozenJson(planTarget, planTamper);
    await assert.rejects(
      inspectWave2bSecurityClosure({projectRoot: root}),
      /plan|scope|pin drifted/u,
    );
    await overwriteFrozenBytes(planTarget, planOriginal);

    const commitTamper = JSON.parse(commitOriginal);
    commitTamper.authorityBoundary.releaseEffect = "publish";
    refingerprint(commitTamper, "commitFingerprintSha256");
    await overwriteFrozenJson(commitTarget, commitTamper);
    await assert.rejects(
      inspectWave2bSecurityClosure({projectRoot: root}),
      /prepared commit semantics\/authority/u,
    );
    await overwriteFrozenBytes(commitTarget, commitOriginal);

    const bindingTamper = JSON.parse(lockBindingOriginal);
    bindingTamper.rootDev = String(Number(bindingTamper.rootDev) + 1);
    const bindingDescriptorPayload = structuredClone(bindingTamper);
    delete bindingDescriptorPayload.descriptorSha256;
    bindingTamper.descriptorSha256 = sha256(Buffer.from(
      `${JSON.stringify(bindingDescriptorPayload)}\n`,
    ));
    const bindingTamperBytes = Buffer.from(stableJson(bindingTamper));
    await overwriteFrozenBytes(lockBindingTarget, bindingTamperBytes);
    const coordinatedCommit = JSON.parse(commitOriginal);
    coordinatedCommit.persistedLockBinding.bytes = bindingTamperBytes.length;
    coordinatedCommit.persistedLockBinding.sha256 =
      sha256(bindingTamperBytes);
    refingerprint(coordinatedCommit, "commitFingerprintSha256");
    const coordinatedCommitBytes = Buffer.from(stableJson(coordinatedCommit));
    await overwriteFrozenBytes(commitTarget, coordinatedCommitBytes);
    const coordinatedReceipt = JSON.parse(receiptOriginal);
    coordinatedReceipt.publicationSeal.preparedCommit.bytes =
      coordinatedCommitBytes.length;
    coordinatedReceipt.publicationSeal.preparedCommit.sha256 =
      sha256(coordinatedCommitBytes);
    refingerprint(coordinatedReceipt, "receiptFingerprintSha256");
    await overwriteFrozenJson(canonicalReceiptTarget, coordinatedReceipt);
    await assert.rejects(
      inspectWave2bSecurityClosure({projectRoot: root}),
      /persisted lock root differs|schema\/root\/transaction/u,
    );
    await overwriteFrozenBytes(lockBindingTarget, lockBindingOriginal);
    await overwriteFrozenBytes(commitTarget, commitOriginal);
    await overwriteFrozenBytes(canonicalReceiptTarget, receiptOriginal);

    const extraOwnerFieldBinding = JSON.parse(lockBindingOriginal);
    const extraOwnerRecord = JSON.parse(Buffer.from(
      extraOwnerFieldBinding.ownerBytesBase64,
      "base64",
    ));
    extraOwnerRecord.releaseAuthorityLikeField = false;
    const extraOwnerBytes = Buffer.from(
      `${JSON.stringify(extraOwnerRecord)}\n`,
    );
    extraOwnerFieldBinding.ownerBytesBase64 =
      extraOwnerBytes.toString("base64");
    extraOwnerFieldBinding.ownerSha256 = sha256(extraOwnerBytes);
    const extraOwnerDescriptorPayload =
      structuredClone(extraOwnerFieldBinding);
    delete extraOwnerDescriptorPayload.descriptorSha256;
    extraOwnerFieldBinding.descriptorSha256 = sha256(Buffer.from(
      `${JSON.stringify(extraOwnerDescriptorPayload)}\n`,
    ));
    const extraOwnerBindingBytes = Buffer.from(
      stableJson(extraOwnerFieldBinding),
    );
    await overwriteFrozenBytes(lockBindingTarget, extraOwnerBindingBytes);
    const extraOwnerCommit = JSON.parse(commitOriginal);
    extraOwnerCommit.persistedLockBinding.bytes =
      extraOwnerBindingBytes.length;
    extraOwnerCommit.persistedLockBinding.sha256 =
      sha256(extraOwnerBindingBytes);
    refingerprint(extraOwnerCommit, "commitFingerprintSha256");
    const extraOwnerCommitBytes = Buffer.from(stableJson(extraOwnerCommit));
    await overwriteFrozenBytes(commitTarget, extraOwnerCommitBytes);
    const extraOwnerReceipt = JSON.parse(receiptOriginal);
    extraOwnerReceipt.publicationSeal.preparedCommit.bytes =
      extraOwnerCommitBytes.length;
    extraOwnerReceipt.publicationSeal.preparedCommit.sha256 =
      sha256(extraOwnerCommitBytes);
    refingerprint(extraOwnerReceipt, "receiptFingerprintSha256");
    await overwriteFrozenJson(canonicalReceiptTarget, extraOwnerReceipt);
    await assert.rejects(
      inspectWave2bSecurityClosure({projectRoot: root}),
      /owner canonical record|persisted acquired lock/u,
    );
    await overwriteFrozenBytes(lockBindingTarget, lockBindingOriginal);
    await overwriteFrozenBytes(commitTarget, commitOriginal);
    await overwriteFrozenBytes(canonicalReceiptTarget, receiptOriginal);
  });
});

historicalProtectedTest(
  "actual outer child crashes recover by receipt-last state, once only",
  async (t) => {
  for (const phase of [
    "lock-only",
    "partial-artifact",
    "partial-archive",
    "first-journal",
    "cas-partial",
    "prepared-receipt",
    "prepared-commit",
    "canonical-published",
  ]) {
    await t.test(phase, async () => {
      await withFixture(async (root) => {
        const protectedPath = WAVE2B_PROTECTED_PINS[0].path;
        const protectedBefore = await lstat(fixturePath(root, protectedPath));
        const protectedSha = sha256(await readFile(
          fixturePath(root, protectedPath),
        ));
        const event = await crashApplyAtPhase(root, phase);
        assert.equal(event.phase, phase);
        assert.match(event.transactionId, /^[a-f0-9]{64}$/u);
        const crashedTransaction = fixturePath(
          root,
          `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${event.transactionId}`,
        );
        if (phase === "partial-artifact") {
          await writeFile(
            path.join(crashedTransaction, "plan.json"),
            Buffer.from('{"partial":'),
          );
        } else if (phase === "partial-archive") {
          const crashedPlan = JSON.parse(await readFile(
            path.join(crashedTransaction, "plan.json"),
          ));
          const partialArchive = fixturePath(
            root,
            crashedPlan.items[0].archives.candidateJson,
          );
          await mkdir(path.dirname(partialArchive), {recursive: true});
          await writeFile(partialArchive, Buffer.from("partial"));
        } else if (phase === "first-journal") {
          await writeFile(
            path.join(crashedTransaction, "apply-journal.jsonl"),
            Buffer.from('{"partial":'),
            {flag: "a"},
          );
        }
        const interrupted = await inspectWave2bSecurityClosure({
          projectRoot: root,
        });
        assert.equal(
          interrupted.status,
          phase === "canonical-published"
            ? "committed-recovery-required"
            : "recovery-required",
        );
        const decision = await deathDecisionFor(root, event.transactionId);
        if (phase === "lock-only") {
          await assert.rejects(
            recoverWave2bSecurityClosure({
              projectRoot: root,
              transactionId: event.transactionId,
              deathDecision: {
                ...decision,
                releaseAuthorityClaimed: true,
              },
            }),
            /dead-owner decision|release role/u,
          );
          await assert.rejects(
            lstat(path.join(
              crashedTransaction,
              "recovery-attempt.json",
            )),
            {code: "ENOENT"},
          );
        }
        const recovered = await recoverWave2bSecurityClosure({
          projectRoot: root,
          transactionId: event.transactionId,
          deathDecision: decision,
        });
        if (phase === "canonical-published") {
          assert.equal(
            recovered.status,
            "published-closure-verified-lock-released",
          );
          const replay = await inspectWave2bSecurityClosure({
            projectRoot: root,
          });
          assert.equal(replay.status, "already-committed-and-verified");
          assert.equal(
            replay.candidateRebuild.state,
            "candidate-rebuild-pending",
          );
        } else {
          assert.equal(recovered.status, "exact-preimages-restored");
          await assertAllSpecsAtPreimage(root);
          await assert.rejects(
            lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt)),
            {code: "ENOENT"},
          );
          const ready = await inspectWave2bSecurityClosure({
            projectRoot: root,
          });
          assert.equal(ready.status, "ready-no-writes-performed");
        }
        await assert.rejects(
          lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock)),
          {code: "ENOENT"},
        );
        const protectedAfter = await lstat(fixturePath(root, protectedPath));
        assert.equal(String(protectedAfter.ino), String(protectedBefore.ino));
        assert.equal(
          sha256(await readFile(fixturePath(root, protectedPath))),
          protectedSha,
        );
        await assert.rejects(
          recoverWave2bSecurityClosure({
            projectRoot: root,
            transactionId: event.transactionId,
            deathDecision: decision,
          }),
          /second uncertainty|residual transaction lock|recovery-required/u,
        );
      });
    });
  }
});

historicalProtectedTest(
  "foreign residual lock is rejected before one-shot recovery writes with or without receipt",
  async (t) => {
  for (const phase of ["partial-artifact", "canonical-published"]) {
    await t.test(phase, async () => {
      await withFixture(async (root) => {
        const event = await crashApplyAtPhase(root, phase);
        const transactionRoot = fixturePath(
          root,
          `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${event.transactionId}`,
        );
        const decision = await deathDecisionFor(root, event.transactionId);
        const {lockTarget, foreign} =
          await replaceResidualLockWithForeignClone(root);
        await assert.rejects(
          recoverWave2bSecurityClosure({
            projectRoot: root,
            transactionId: event.transactionId,
            deathDecision: decision,
          }),
          /exact residual transaction lock|lock directory was replaced|lock owner was replaced/u,
        );
        assert.equal(
          String((await lstat(lockTarget)).ino),
          String(foreign.ino),
        );
        await assert.rejects(
          lstat(path.join(transactionRoot, "recovery-attempt.json")),
          {code: "ENOENT"},
        );
        await assert.rejects(
          lstat(path.join(transactionRoot, "recovery-journal.jsonl")),
          {code: "ENOENT"},
        );
      });
    });
  }
});

historicalProtectedTest(
  "isolated live-lock watcher drift is typed and cannot be fresh-capture rebased",
  async () => {
  await withFixture(async (root) => {
    const moduleUrl = pathToFileURL(
      fixturePath(root, WAVE2B_CLOSURE_PATHS.script),
    ).href;
    const source = `
      const module = await import(${JSON.stringify(moduleUrl)});
      try {
        await module.executeWave2bSecurityClosure({
          projectRoot: ${JSON.stringify(root)},
          apply: true,
          phaseObserver: async (event) => {
            if (event.phase === "lock-only") {
              process.stdout.write(JSON.stringify(event) + "\\n");
              await new Promise((resolve) =>
                process.stdin.once("data", resolve));
              throw new Error("ordinary observer failure after live-lock drift");
            }
            if (event.phase === "first-journal") {
              process.stdout.write(JSON.stringify(event) + "\\n");
            }
          },
        });
      } catch (error) {
        process.stdout.write(JSON.stringify({
          phase: "terminal-error",
          code: error.code ?? null,
          message: error.message,
        }) + "\\n");
        process.exitCode = 1;
      }
    `;
    const child = spawn(
      process.execPath,
      ["--input-type=module", "-e", source],
      {
        cwd: root,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const lockEvent = await waitForJsonLine(child);
    assert.equal(lockEvent.phase, "lock-only");
    const outerTarget = fixturePath(root, WAVE2B_CLOSURE_PATHS.script);
    await replaceWithSameBytesNewInode(outerTarget);
    const foreign = await lstat(outerTarget);
    let remainingStdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      remainingStdout += chunk;
    });
    const exitPromise = waitForExit(child);
    child.stdin.end("continue\n");
    const exited = await exitPromise;
    assert.equal(exited.code, 1);
    const terminalLines = remainingStdout.trim().split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.equal(
      terminalLines.some((line) => line.phase === "first-journal"),
      false,
    );
    const terminal = terminalLines.find(
      (line) => line.phase === "terminal-error",
    );
    assert.equal(terminal?.code, "WAVE2B_OUTER_SNAPSHOT_DRIFT");
    assert.equal(
      String((await lstat(outerTarget)).ino),
      String(foreign.ino),
    );
    const transactionRoot = fixturePath(
      root,
      `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${lockEvent.transactionId}`,
    );
    await assert.rejects(
      lstat(path.join(transactionRoot, "plan.json")),
      {code: "ENOENT"},
    );
    await lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock));
    await assertAllSpecsAtPreimage(root);
  });
});

historicalProtectedTest(
  "full lock-in identity rejects same-byte inode and root/ancestor drift after first journal",
  async (t) => {
  for (const driftKind of [
    "exact-input",
    "outer-script",
    "prior-tree",
    "source-audit",
    "candidate",
    "protected-pin",
    "ancestor",
    "project-root",
  ]) {
    await t.test(driftKind, async () => {
      await withFixture(async (root) => {
        const prior = JSON.parse(await readFile(
          fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt),
        ));
        let mutatedPath = null;
        const mutate = async () => {
          if (driftKind === "exact-input") {
            mutatedPath = fixturePath(
              root,
              WAVE2B_CLOSURE_PATHS.candidateBuilder,
            );
            await replaceWithSameBytesNewInode(mutatedPath);
          } else if (driftKind === "outer-script") {
            mutatedPath = fixturePath(root, WAVE2B_CLOSURE_PATHS.script);
            await replaceWithSameBytesNewInode(mutatedPath);
          } else if (driftKind === "prior-tree") {
            mutatedPath = fixturePath(
              root,
              `${PRIOR_TRANSACTION_PATH}/journal/000001-preflight-locked.json`,
            );
            await replaceWithSameBytesNewInode(mutatedPath);
          } else if (driftKind === "source-audit") {
            mutatedPath = fixturePath(
              root,
              prior.items[0].currentEvidence.sourceAudit.path,
            );
            await replaceWithSameBytesNewInode(mutatedPath);
          } else if (driftKind === "candidate") {
            mutatedPath = fixturePath(
              root,
              prior.items[0].preimages.candidateJson.path,
            );
            await replaceWithSameBytesNewInode(mutatedPath);
          } else if (driftKind === "protected-pin") {
            mutatedPath = fixturePath(root, WAVE2B_PROTECTED_PINS[0].path);
            await replaceWithSameBytesNewInode(mutatedPath);
          } else if (driftKind === "ancestor") {
            const spec = fixturePath(root, prior.items[0].specPath);
            const directory = path.dirname(spec);
            const moved = `${directory}.old-identity`;
            await rename(directory, moved);
            await mkdir(directory, {mode: 0o755});
            for (const entry of await readdir(moved)) {
              await rename(path.join(moved, entry), path.join(directory, entry));
            }
            mutatedPath = directory;
          } else {
            mutatedPath = root;
            await chmod(root, 0o755);
          }
        };
        let observerCalls = 0;
        await assert.rejects(
          executeWave2bSecurityClosure({
            projectRoot: root,
            apply: true,
            phaseObserver: async (event) => {
              if (event.phase === "first-journal") {
                observerCalls += 1;
                await mutate();
              }
            },
          }),
          /snapshot|identity drift|prior-tree/u,
        );
        assert.equal(observerCalls, 1);
        assert.ok(mutatedPath);
        await lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock));
        await assert.rejects(
          lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt)),
          {code: "ENOENT"},
        );
      });
    });
  }
});

historicalProtectedTest(
  "nested CAS member snapshot drift preserves the lock and foreign inode",
  async () => {
  await withFixture(async (root) => {
    const prior = JSON.parse(await readFile(
      fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt),
    ));
    const foreignTarget = fixturePath(root, prior.items[1].specPath);
    const original = await lstat(foreignTarget);
    let foreign = null;
    await assert.rejects(
      executeWave2bSecurityClosure({
        projectRoot: root,
        apply: true,
        phaseObserver: async (event) => {
          if (event.phase === "cas-partial") {
            await replaceWithSameBytesNewInode(foreignTarget);
            foreign = await lstat(foreignTarget);
          }
        },
      }),
      /snapshot drift|member snapshot changed|automatic CAS recovery is forbidden/u,
    );
    assert.ok(foreign);
    assert.notEqual(String(foreign.ino), String(original.ino));
    assert.equal(
      String((await lstat(foreignTarget)).ino),
      String(foreign.ino),
    );
    await lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock));
    await assert.rejects(
      lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt)),
      {code: "ENOENT"},
    );
  });
});

historicalProtectedTest(
  "refingerprinted lock-in identity-vector truncation blocks recovery",
  async () => {
  await withFixture(async (root) => {
    const event = await crashApplyAtPhase(root, "first-journal");
    const transactionRoot = fixturePath(
      root,
      `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${event.transactionId}`,
    );
    const planTarget = path.join(transactionRoot, "plan.json");
    const originalPlanBytes = await readFile(planTarget);
    const plan = JSON.parse(originalPlanBytes);
    plan.lockInIdentitySnapshot.exactInputs =
      plan.lockInIdentitySnapshot.exactInputs.slice(1);
    refingerprint(
      plan.lockInIdentitySnapshot,
      "snapshotFingerprintSha256",
    );
    refingerprint(plan, "planFingerprintSha256");
    await overwriteFrozenJson(planTarget, plan);
    const decision = await deathDecisionFor(root, event.transactionId);
    await assert.rejects(
      recoverWave2bSecurityClosure({
        projectRoot: root,
        transactionId: event.transactionId,
        deathDecision: decision,
      }),
      /identity snapshot scope|identity vector drifted/u,
    );
    await assert.rejects(
      lstat(path.join(transactionRoot, "recovery-attempt.json")),
      {code: "ENOENT"},
    );
    await overwriteFrozenBytes(planTarget, originalPlanBytes);
    const modeTamper = JSON.parse(originalPlanBytes);
    modeTamper.items[0].candidateJsonPreimage.mode = 0o600;
    modeTamper.lockInIdentitySnapshot.candidatePreimages[0].mode = 0o600;
    refingerprint(
      modeTamper.lockInIdentitySnapshot,
      "snapshotFingerprintSha256",
    );
    refingerprint(modeTamper, "planFingerprintSha256");
    await overwriteFrozenJson(planTarget, modeTamper);
    await assert.rejects(
      recoverWave2bSecurityClosure({
        projectRoot: root,
        transactionId: event.transactionId,
        deathDecision: decision,
      }),
      /canonical ordered plan bindings|candidate/u,
    );
    await assert.rejects(
      lstat(path.join(transactionRoot, "recovery-attempt.json")),
      {code: "ENOENT"},
    );
    await lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock));
  });
});

historicalProtectedTest(
  "missing-plan recovery rejects post-crash outer inode replacement without cleanup",
  async () => {
  await withFixture(async (root) => {
    const event = await crashApplyAtPhase(root, "partial-artifact");
    const transactionRoot = fixturePath(
      root,
      `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${event.transactionId}`,
    );
    await writeFile(
      path.join(transactionRoot, "plan.json"),
      Buffer.from('{"partial":'),
    );
    const outerTarget = fixturePath(root, WAVE2B_CLOSURE_PATHS.script);
    await replaceWithSameBytesNewInode(outerTarget);
    const foreign = await lstat(outerTarget);
    const decision = await deathDecisionFor(root, event.transactionId);
    await assert.rejects(
      recoverWave2bSecurityClosure({
        projectRoot: root,
        transactionId: event.transactionId,
        deathDecision: decision,
      }),
      /owner-bound recovery outer implementation|identity drift/u,
    );
    assert.equal(String((await lstat(outerTarget)).ino), String(foreign.ino));
    await assert.rejects(
      lstat(path.join(transactionRoot, "recovery-attempt.json")),
      {code: "ENOENT"},
    );
    await lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock));
  });
});

historicalProtectedTest(
  "missing-plan owner authority rejects root, reports, and audit timestamp drift before attempt",
  async (t) => {
  for (const driftKind of ["project-root", "reports", "audit"]) {
    await t.test(driftKind, async () => {
      await withFixture(async (root) => {
        const event = await crashApplyAtPhase(root, "partial-artifact");
        const transactionRoot = fixturePath(
          root,
          `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${event.transactionId}`,
        );
        await writeFile(
          path.join(transactionRoot, "plan.json"),
          Buffer.from('{"partial":'),
        );
        const prior = JSON.parse(await readFile(
          fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt),
        ));
        const driftTarget = driftKind === "project-root"
          ? root
          : driftKind === "reports"
            ? fixturePath(root, "reports")
            : path.dirname(path.dirname(fixturePath(
              root,
              prior.items[0].currentEvidence.sourceAudit.path,
            )));
        await bumpDirectoryTimestamp(driftTarget);
        const decision = await deathDecisionFor(root, event.transactionId);
        await assert.rejects(
          recoverWave2bSecurityClosure({
            projectRoot: root,
            transactionId: event.transactionId,
            deathDecision: decision,
          }),
          /owner-bound recovery project root identity drifted|owner-bound ancestor identity drifted/u,
        );
        await assert.rejects(
          lstat(path.join(transactionRoot, "recovery-attempt.json")),
          {code: "ENOENT"},
        );
        await assert.rejects(
          lstat(path.join(transactionRoot, "recovery-journal.jsonl")),
          {code: "ENOENT"},
        );
        await lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock));
      });
    });
  }
});

historicalProtectedTest(
  "recoverable preimage mtime drift is rejected before one-shot recovery writes",
  async () => {
  await withFixture(async (root) => {
    const event = await crashApplyAtPhase(root, "cas-partial");
    const transactionRoot = fixturePath(
      root,
      `${WAVE2B_CLOSURE_PATHS.transactionRoot}/${event.transactionId}`,
    );
    const plan = JSON.parse(
      await readFile(path.join(transactionRoot, "plan.json")),
    );
    const quarantineTarget = fixturePath(
      root,
      plan.items[0].cas.quarantinePath,
    );
    const before = await lstat(quarantineTarget);
    await utimes(
      quarantineTarget,
      new Date(before.atimeMs),
      new Date(before.mtimeMs - 10_000),
    );
    const foreign = await lstat(quarantineTarget);
    assert.equal(String(foreign.ino), String(before.ino));
    assert.notEqual(String(foreign.mtimeMs), String(before.mtimeMs));
    const decision = await deathDecisionFor(root, event.transactionId);
    await assert.rejects(
      recoverWave2bSecurityClosure({
        projectRoot: root,
        transactionId: event.transactionId,
        deathDecision: decision,
      }),
      /recoverable preimage inode\/mtime drifted/u,
    );
    assert.equal(
      String((await lstat(quarantineTarget)).ino),
      String(foreign.ino),
    );
    await assert.rejects(
      lstat(path.join(transactionRoot, "recovery-attempt.json")),
      {code: "ENOENT"},
    );
    await lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock));
  });
});

historicalProtectedTest(
  "ordinary pre-CAS observer failure releases only a proven S0 lock",
  async () => {
  await withFixture(async (root) => {
    await assert.rejects(
      executeWave2bSecurityClosure({
        projectRoot: root,
        apply: true,
        phaseObserver: async (event) => {
          if (event.phase === "partial-artifact") {
            throw new Error("ordinary pre-CAS observer failure");
          }
        },
      }),
      /ordinary pre-CAS observer failure/u,
    );
    await assertAllSpecsAtPreimage(root);
    await assert.rejects(
      lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.lock)),
      {code: "ENOENT"},
    );
    await assert.rejects(
      lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt)),
      {code: "ENOENT"},
    );
  });
});

test("exact input, protected pin, and partial receipt drift fail closed", async (t) => {
  await t.test("builder hash drift", async () => {
    await withFixture(async (root) => {
      await writeFile(
        fixturePath(root, WAVE2B_CLOSURE_PATHS.candidateBuilder),
        Buffer.from("drift\n"),
      );
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /exact bytes\/SHA-256 pin drifted/u,
      );
    });
  });
  await t.test("protected pin drift", async () => {
    await withFixture(async (root) => {
      await writeFile(
        fixturePath(root, WAVE2B_PROTECTED_PINS[0].path),
        Buffer.from("{}\n"),
      );
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /exact bytes\/SHA-256 pin drifted/u,
      );
    });
  });
  await t.test("partial receipt", async () => {
    await withFixture(async (root) => {
      const target = fixturePath(root, WAVE2B_CLOSURE_PATHS.receipt);
      await writeFile(target, Buffer.from('{"partial":true}\n'));
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /fingerprint is stale|receipt/u,
      );
      await assert.rejects(
        lstat(fixturePath(root, WAVE2B_CLOSURE_PATHS.workRoot)),
        {code: "ENOENT"},
      );
    });
  });
});

historicalProtectedTest(
  "prior tree addition, deletion, mode, hash, journal, and hardlink drift fail",
  async (t) => {
  const commitRelative = `${PRIOR_TRANSACTION_PATH}/commit.json`;
  const firstJournal =
    `${PRIOR_TRANSACTION_PATH}/journal/000001-preflight-locked.json`;
  await t.test("addition", async () => {
    await withFixture(async (root) => {
      await writeFile(
        fixturePath(root, `${PRIOR_TRANSACTION_PATH}/unexpected.json`),
        Buffer.from("{}\n"),
      );
      await chmod(
        fixturePath(root, `${PRIOR_TRANSACTION_PATH}/unexpected.json`),
        0o444,
      );
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /transaction tree content|file count/u,
      );
    });
  });
  await t.test("deletion", async () => {
    await withFixture(async (root) => {
      await unlink(fixturePath(root, commitRelative));
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /ENOENT|transaction tree/u,
      );
    });
  });
  await t.test("file mode", async () => {
    await withFixture(async (root) => {
      await chmod(fixturePath(root, firstJournal), 0o644);
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /transaction tree content|pin drifted/u,
      );
    });
  });
  await t.test("directory mode", async () => {
    await withFixture(async (root) => {
      await chmod(
        fixturePath(root, `${PRIOR_TRANSACTION_PATH}/journal`),
        0o700,
      );
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /prior-tree directory/u,
      );
    });
  });
  await t.test("file hash", async () => {
    await withFixture(async (root) => {
      await chmod(fixturePath(root, firstJournal), 0o644);
      await writeFile(fixturePath(root, firstJournal), Buffer.from("{}\n"));
      await chmod(fixturePath(root, firstJournal), 0o444);
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /pin drifted|transaction tree|section summary/u,
      );
    });
  });
  await t.test("hardlink", async () => {
    await withFixture(async (root) => {
      const source = fixturePath(root, firstJournal);
      const target = fixturePath(
        root,
        `${PRIOR_TRANSACTION_PATH}/journal/hardlink.json`,
      );
      const sourceBytes = await readFile(source);
      await writeFile(target, sourceBytes);
      await unlink(target);
      const linkResult = spawnSync("ln", [source, target], {encoding: "utf8"});
      assert.equal(linkResult.status, 0, linkResult.stderr);
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /no hardlinks|single-link/u,
      );
    });
  });
});

historicalProtectedTest(
  "symlink, symlink ancestor, FIFO, and noncanonical root are rejected",
  async (t) => {
  await t.test("leaf symlink", async () => {
    await withFixture(async (root) => {
      const receipt = JSON.parse(
        await readFile(fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt)),
      );
      const candidate = receipt.items[0].preimages.candidateJson.path;
      const target = fixturePath(root, candidate);
      await unlink(target);
      await symlink(fixturePath(root, ".gitignore"), target);
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /symlink rejected|regular file/u,
      );
    });
  });
  await t.test("ancestor symlink", async () => {
    await withFixture(async (root) => {
      const receipt = JSON.parse(
        await readFile(fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt)),
      );
      const specPath = receipt.items[0].specPath;
      const auditDirectory = path.dirname(fixturePath(root, specPath));
      const moved = `${auditDirectory}.real`;
      await rename(auditDirectory, moved);
      await symlink(moved, auditDirectory);
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /parent must be a real directory/u,
      );
    });
  });
  await t.test("FIFO", async () => {
    await withFixture(async (root) => {
      const receipt = JSON.parse(
        await readFile(fixturePath(root, WAVE2B_CLOSURE_PATHS.priorReceipt)),
      );
      const candidate = receipt.items[0].preimages.candidateJson.path;
      const target = fixturePath(root, candidate);
      await unlink(target);
      const made = spawnSync("mkfifo", [target], {encoding: "utf8"});
      assert.equal(made.status, 0, made.stderr);
      await assert.rejects(
        inspectWave2bSecurityClosure({projectRoot: root}),
        /regular file/u,
      );
    });
  });
  await t.test("noncanonical root", async () => {
    await withFixture(async (root) => {
      await assert.rejects(
        inspectWave2bSecurityClosure({
          projectRoot: `${root}${path.sep}migrations${path.sep}..`,
        }),
        /normalized absolute|canonical/u,
      );
    });
  });
});

test("persistent lock excludes concurrent apply and carries no human role", async () => {
  await withFixture(async (root) => {
    await mkdir(fixturePath(root, WAVE2B_CLOSURE_PATHS.workRoot), {
      recursive: true,
    });
    const lock = await acquireWave2bLock({
      rootPath: root,
      lockPath: fixturePath(root, WAVE2B_CLOSURE_PATHS.lock),
      owner: {
        transactionId: "concurrency-test",
        actorKind: "software-process",
        authority: "single-writer-exclusion-only",
        projectOwnerRoleClaimed: false,
        humanReviewerRoleClaimed: false,
        releaseCustodianRoleClaimed: false,
      },
    });
    const owner = JSON.parse(Buffer.from(
      lock.persistedBinding.ownerBytesBase64,
      "base64",
    ));
    assert.equal(owner.owner.projectOwnerRoleClaimed, false);
    assert.equal(owner.owner.humanReviewerRoleClaimed, false);
    assert.equal(owner.owner.releaseCustodianRoleClaimed, false);
    await assert.rejects(
      executeWave2bSecurityClosure({projectRoot: root, apply: true}),
      /EEXIST|lock/u,
    );
    await releaseWave2bLock(lock);
  });
});

async function makeCasCrashFixture() {
  const root = await realpath(await mkdtemp(
    path.join(await realpath(os.tmpdir()), "g4-l3-wave2b-cas-crash-"),
  ));
  await mkdir(path.join(root, "member"), {recursive: true});
  await mkdir(path.join(root, "work"), {recursive: true});
  const preBytes = Buffer.from('{"state":"pre"}\n');
  const postBytes = Buffer.from('{"state":"post"}\n');
  const targetPath = path.join(root, "member", "spec.json");
  await writeFile(targetPath, preBytes);
  await chmod(targetPath, 0o644);
  const item = {
    id: "crash-member",
    rootPath: root,
    targetPath,
    tempOwnershipPath: path.join(root, "work", "temp-owner"),
    tempPath: path.join(root, "work", "post.tmp"),
    quarantinePath: path.join(root, "work", "pre.quarantine"),
    postArchivePath: path.join(root, "work", "post.archive"),
    preimage: {bytes: preBytes.length, sha256: sha256(preBytes)},
    postimage: {bytes: postBytes.length, sha256: sha256(postBytes)},
    postBytes,
    originalMode: 0o644,
  };
  const lock = await acquireWave2bLock({
    rootPath: root,
    lockPath: path.join(root, "work", "lock"),
    owner: {
      transactionId: randomTestId(),
      actorKind: "software-process",
      authority: "test-exclusion-only",
    },
  });
  return {root, item, lock, preBytes};
}

function randomTestId() {
  return `${process.pid}-${Date.now()}-${Math.random()}`;
}

test("crash states recover only through exact one-shot adopted lock", async (t) => {
  for (const crashState of [
    CAS_STATES.TEMP_READY,
    CAS_STATES.TARGET_QUARANTINED,
    CAS_STATES.TARGET_LINKED,
    CAS_STATES.QUARANTINE_FROZEN,
  ]) {
    await t.test(crashState, async () => {
      const fixture = await makeCasCrashFixture();
      try {
        await assert.rejects(
          applyWave2bCasBatch({
            items: [fixture.item],
            lock: fixture.lock,
            journal: async () => {},
            leaveInterruptedForTest: true,
            hooks: {
              afterState: async ({state}) => {
                if (state === crashState) {
                  throw new Error(`simulated crash at ${state}`);
                }
              },
            },
          }),
          /simulated crash/u,
        );
        let livenessCalls = 0;
        const adopted = await adoptWave2bLockForRecovery({
          rootPath: fixture.root,
          lockPath: path.join(fixture.root, "work", "lock"),
          items: [fixture.item],
          persistedBinding: fixture.lock.persistedBinding,
          decideOwnerLiveness: async (subject) => {
            livenessCalls += 1;
            assert.equal(
              subject.transactionId,
              fixture.lock.persistedBinding.transactionId,
            );
            return "dead";
          },
          journal: async () => {},
        });
        assert.equal(livenessCalls, 1);
        const recovered = await recoverWave2bCasBatch({
          items: [fixture.item],
          lock: adopted,
          journal: async () => {},
        });
        assert.equal(recovered.itemCount, 1);
        assert.deepEqual(await readFile(fixture.item.targetPath), fixture.preBytes);
        await releaseWave2bLock(adopted);
        await assert.rejects(
          adoptWave2bLockForRecovery({
            rootPath: fixture.root,
            lockPath: path.join(fixture.root, "work", "lock"),
            items: [fixture.item],
            persistedBinding: fixture.lock.persistedBinding,
            decideOwnerLiveness: async () => "dead",
            journal: async () => {},
          }),
          /ENOENT|lock/u,
        );
      } finally {
        assert.match(
          path.basename(fixture.root),
          /^g4-l3-wave2b-cas-crash-/u,
        );
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  }
});

test("CLI has no hook/crash injection option and defaults to dry-run", async () => {
  const receiptPath = fixturePath(
    SOURCE_ROOT,
    WAVE2B_CLOSURE_PATHS.receipt,
  );
  const workRootPath = fixturePath(
    SOURCE_ROOT,
    WAVE2B_CLOSURE_PATHS.workRoot,
  );
  const receiptBefore = await readFile(receiptPath);
  const receiptIdentityBefore = await lstat(receiptPath);
  const workRootIdentityBefore = await lstat(workRootPath);
  const workTreeBefore = await snapshotTree(workRootPath);
  const child = spawn(process.execPath, [
    fixturePath(SOURCE_ROOT, WAVE2B_CLOSURE_PATHS.script),
    "--hook",
  ], {
    cwd: SOURCE_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const result = await waitForExit(child);
  assert.equal(result.code, 1);
  assert.match(stderr, /unknown option: --hook/u);
  assert.deepEqual(await readFile(receiptPath), receiptBefore);
  const receiptIdentityAfter = await lstat(receiptPath);
  assert.deepEqual(
    [
      receiptIdentityAfter.dev,
      receiptIdentityAfter.ino,
      receiptIdentityAfter.mode,
      receiptIdentityAfter.nlink,
      receiptIdentityAfter.size,
    ],
    [
      receiptIdentityBefore.dev,
      receiptIdentityBefore.ino,
      receiptIdentityBefore.mode,
      receiptIdentityBefore.nlink,
      receiptIdentityBefore.size,
    ],
  );
  const workRootIdentityAfter = await lstat(workRootPath);
  assert.deepEqual(
    [
      workRootIdentityAfter.dev,
      workRootIdentityAfter.ino,
      workRootIdentityAfter.mode,
    ],
    [
      workRootIdentityBefore.dev,
      workRootIdentityBefore.ino,
      workRootIdentityBefore.mode,
    ],
  );
  assert.deepEqual(await snapshotTree(workRootPath), workTreeBefore);
  assert.equal(
    CURRENT_DERIVED_REFRESH.status,
    "already-created-and-verified",
  );
  assert.equal(CURRENT_DERIVED_REFRESH.strictComplete, 0);
  assert.equal(CURRENT_DERIVED_REFRESH.published, false);
});
