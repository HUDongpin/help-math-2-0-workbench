import assert from "node:assert/strict";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  applyTransactionTimeProof,
  checkTransactionTimeProof,
} from "./validate-g4-l3-source-static-source-audit-rebind-v2.mjs";
import {
  checkDerivedRefreshReceipt,
} from "./build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const TRANSACTION_ID =
  "75f8766a9fb4648979f7c0fbae3badf05d31c43f5ca83b40f3f2c2c85344fcf7";
const TRANSACTION_ROOT =
  `work/g4-l3-source-static-source-audit-rebind/transactions/${TRANSACTION_ID}`;
const V1_RECEIPT =
  "reports/g4-l3-source-static-source-audit-rebind-receipt.json";
const V2_RECEIPT =
  "reports/g4-l3-source-static-source-audit-rebind-transaction-proof-v2.json";
const V2_PROOF =
  `${TRANSACTION_ROOT}/transaction-time-protected-state-proof-v2.json`;
const PLAN = `${TRANSACTION_ROOT}/plan.json`;
const COMMIT = `${TRANSACTION_ROOT}/commit.json`;
const HISTORICAL_PROTECTED_FIXTURE_SKIP =
  "v2 proof creation requires transaction-time protected bytes that are no " +
  "longer live; the immutable proof check and verified derived-refresh " +
  "successor are the current validation path";

function historicalProtectedTest(name, fn) {
  return test(name, {skip: HISTORICAL_PROTECTED_FIXTURE_SKIP}, fn);
}

async function copy(relativePath, root) {
  const source = path.join(PROJECT_ROOT, relativePath);
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(source, destination);
  const immutable = relativePath === V1_RECEIPT ||
    relativePath === V2_RECEIPT ||
    relativePath.startsWith(`${TRANSACTION_ROOT}/`);
  await chmod(destination, immutable ? 0o444 : 0o644);
}

async function fixture({includeProtected = false} = {}) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g4-l3-source-audit-v2-"),
  );
  const receipt = JSON.parse(
    await readFile(path.join(PROJECT_ROOT, V1_RECEIPT), "utf8"),
  );
  const plan = JSON.parse(
    await readFile(path.join(PROJECT_ROOT, PLAN), "utf8"),
  );
  const paths = [
    V1_RECEIPT,
    V2_RECEIPT,
    V2_PROOF,
    PLAN,
    COMMIT,
    "scripts/rebind-g4-l3-source-static-source-audits.mjs",
    "scripts/validate-g4-l3-source-static-source-audit-rebind-v2.mjs",
    ...receipt.items.flatMap((item) => [
      item.historicalEvidence.archivedSpecPath,
      item.historicalEvidence.archivedCandidatePath,
    ]),
    ...receipt.items.map((item, index) =>
      `${TRANSACTION_ROOT}/quarantine/${String(index + 1)
        .padStart(2, "0")}.json`),
  ];
  if (includeProtected) {
    paths.push(...plan.protectedBefore.map(({path: value}) => value));
  }
  for (const relativePath of paths) await copy(relativePath, root);
  return {root, receipt, plan};
}

test("canonical v2 check reads immutable transaction artifacts, not live pins",
  async (t) => {
    const {root, plan} = await fixture();
    t.after(() => rm(root, {recursive: true, force: true}));
    const changedLivePath = path.join(root, plan.protectedBefore[0].path);
    await mkdir(path.dirname(changedLivePath), {recursive: true});
    await writeFile(changedLivePath, "legitimate future transaction\n");
    const result = await checkTransactionTimeProof({root});
    assert.equal(result.archivedPreimageCount, 13);
    assert.equal(result.liveProtectedFilesRead, 0);
    assert.equal(
      result.protectedBeforeEqualsProtectedAfterAtCommit,
      true,
    );
    assert.equal(result.strictAcceptanceEffect, "none");
  });

test("tampered immutable plan is rejected", async (t) => {
  const {root} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  const target = path.join(root, PLAN);
  await chmod(target, 0o644);
  const plan = JSON.parse(await readFile(target, "utf8"));
  plan.protectedBefore[0].sha256 = "0".repeat(64);
  await writeFile(target, `${JSON.stringify(plan, null, 2)}\n`);
  await chmod(target, 0o444);
  await assert.rejects(
    checkTransactionTimeProof({root}),
    /transaction plan is invalid|bindings are stale/u,
  );
});

test("symlinked archived preimage is rejected", async (t) => {
  const {root, receipt} = await fixture();
  t.after(() => rm(root, {recursive: true, force: true}));
  const target = receipt.items[0].historicalEvidence.archivedSpecPath;
  const absolute = path.join(root, target);
  await rm(absolute);
  await symlink(path.join(root, V1_RECEIPT), absolute);
  await assert.rejects(
    checkTransactionTimeProof({root}),
    /unsafe immutable file/u,
  );
});

historicalProtectedTest(
  "interrupted v2 write resumes from the immutable commit proof",
  async (t) => {
    const {root} = await fixture({includeProtected: true});
    t.after(() => rm(root, {recursive: true, force: true}));
    await rm(path.join(root, V2_RECEIPT));
    const result = await applyTransactionTimeProof({root});
    assert.equal(result.liveProtectedFilesRead, 0);
    assert.equal(result.archivedPreimageCount, 13);
    assert.equal(result.strictAcceptanceEffect, "none");
  });

test("existing v2 transaction proof check is idempotent and replay-safe",
  async (t) => {
    const {root} = await fixture();
    t.after(() => rm(root, {recursive: true, force: true}));
    const first = await checkTransactionTimeProof({root});
    const second = await checkTransactionTimeProof({root});
    assert.deepEqual(second, first);
    assert.equal(first.liveProtectedFilesRead, 0);
  });

// The derived-refresh successor replays a dated wave2b transaction against the
// live tree, so it is the one check here bound to artifacts that legitimately
// advance. Keep it in its own test: evaluating it at module scope aborted the
// whole file, discarding the immutable-artifact coverage above.
test("derived-refresh successor confers no strict, acceptance, or release effect",
  async () => {
    const current = await checkDerivedRefreshReceipt({root: PROJECT_ROOT});
    assert.equal(current.strictComplete, 0);
    assert.equal(current.published, false);
    assert.equal(current.strictAcceptanceEffect, "none");
    assert.equal(current.releaseEffect, "none");
  });
