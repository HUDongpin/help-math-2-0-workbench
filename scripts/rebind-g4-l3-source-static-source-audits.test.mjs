import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS,
  applySourceStaticSourceAuditRebind,
  checkSourceStaticSourceAuditRebind,
  dryRunSourceStaticSourceAuditRebind,
  safeProjectRelative,
  validateSourceStaticSourceAuditRebindReceipt,
} from "./rebind-g4-l3-source-static-source-audits.mjs";
import {
  recoverSourceStaticSourceAuditRebind,
} from "./recover-g4-l3-source-static-source-audit-rebind.mjs";
import {
  checkDerivedRefreshReceipt,
} from "./build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RECEIPT =
  "reports/g4-l3-source-static-source-audit-rebind-receipt.json";
const SCRIPT =
  "scripts/rebind-g4-l3-source-static-source-audits.mjs";
const GENERATOR =
  "scripts/build-g4-l3-source-static-candidate.mjs";
const RECOVERY =
  "scripts/recover-g4-l3-source-static-source-audit-rebind.mjs";
const PROTECTED = [
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "catalog/lesson-releases.json",
  "reports/current-javascript-output-human-approval.json",
];

async function exists(target) {
  return lstat(target).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

async function copyFileToRoot(root, relativePath, source = relativePath) {
  const bytes = await readFile(path.join(ROOT, source));
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes, {flag: "wx"});
}

async function historicalPaths() {
  if (!await exists(path.join(ROOT, RECEIPT))) return null;
  const receipt = JSON.parse(await readFile(path.join(ROOT, RECEIPT), "utf8"));
  validateSourceStaticSourceAuditRebindReceipt(receipt);
  return new Map(receipt.items.map((item) => [
    item.animationId,
    {
      spec: item.historicalEvidence.archivedSpecPath,
      candidate: item.historicalEvidence.archivedCandidatePath,
    },
  ]));
}

async function v1ReplayFixtureAvailable() {
  const historical = await historicalPaths();
  if (!historical) return true;
  const first = SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS[0];
  const archived = historical.get(first.animationId);
  const candidate = JSON.parse(
    await readFile(path.join(ROOT, archived.candidate), "utf8"),
  );
  const pinned = candidate.integrationBindings.find(
    ({path: bindingPath}) => bindingPath === GENERATOR,
  );
  const current = await readFile(path.join(ROOT, GENERATOR));
  return pinned?.bytes === current.length &&
    pinned?.sha256 === createHash("sha256").update(current).digest("hex");
}

const V1_REPLAY_FIXTURE_AVAILABLE = await v1ReplayFixtureAvailable();
const historicalReplayTest = V1_REPLAY_FIXTURE_AVAILABLE
  ? test
  : (name, fn) => test(name, {
    skip:
      "the committed v1 transaction pins an older immutable generator; use v2 transaction-time tamper/recovery tests",
  }, fn);

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(),
    "g4-l3-source-audit-rebind-test-"));
  t.after(async () => {
    const {rm} = await import("node:fs/promises");
    await rm(root, {recursive: true, force: true});
  });
  const historical = await historicalPaths();
  const paths = new Set([SCRIPT, RECOVERY, GENERATOR, ...PROTECTED]);
  for (const item of SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS) {
    paths.add(item.currentAudit.path);
    const currentAudit = JSON.parse(
      await readFile(path.join(ROOT, item.currentAudit.path), "utf8"),
    );
    paths.add(currentAudit.provenance.materializer.path);
    paths.add(currentAudit.provenance.upstreamMachineAudit.path);
    paths.add(currentAudit.provenance.lessonReleaseManifest.path);
    paths.add(currentAudit.provenance.source.swf.path);
    if (currentAudit.provenance.source.fla) {
      paths.add(currentAudit.provenance.source.fla.path);
    }
  }
  for (const relativePath of paths) {
    await copyFileToRoot(root, relativePath);
  }
  for (const item of SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS) {
    const archived = historical?.get(item.animationId);
    await copyFileToRoot(
      root,
      item.specPath,
      archived?.spec ?? item.specPath,
    );
    await copyFileToRoot(
      root,
      item.reportPath,
      archived?.candidate ?? item.reportPath,
    );
  }
  return root;
}

async function specBytes(root) {
  return Promise.all(SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS.map(
    ({specPath}) => readFile(path.join(root, specPath)),
  ));
}

historicalReplayTest("dry-run proves 13 bounded semantic projections without writing", async (t) => {
  const root = await fixture(t);
  const result = await dryRunSourceStaticSourceAuditRebind({root});
  assert.equal(result.mode, "dry-run");
  assert.equal(result.itemCount, 13);
  assert.equal(result.allAuditByteLengthsUnchanged, true);
  assert.equal(result.semanticProjectionSha256.length, 13);
  assert.equal(result.writesPerformed, 0);
  assert.equal(result.strictAcceptanceEffect, "none");
  assert.equal(await exists(path.join(root, RECEIPT)), false);
});

historicalReplayTest("apply writes only bounded specs and one receipt, then rejects replay", async (t) => {
  const root = await fixture(t);
  const protectedBefore = await Promise.all(
    PROTECTED.map((relativePath) => readFile(path.join(root, relativePath))),
  );
  const result = await applySourceStaticSourceAuditRebind({root});
  assert.equal(result.itemCount, 13);
  assert.equal(result.candidateReportsRebuilt, 0);
  assert.equal(result.strictAcceptanceEffect, "none");
  const checked = await checkSourceStaticSourceAuditRebind({
    root,
    requireRebuiltCandidates: false,
  });
  assert.equal(checked.itemCount, 13);
  for (const [index, relativePath] of PROTECTED.entries()) {
    assert.deepEqual(
      await readFile(path.join(root, relativePath)),
      protectedBefore[index],
    );
  }
  await assert.rejects(
    applySourceStaticSourceAuditRebind({root}),
    /transaction replay detected/,
  );
});

historicalReplayTest("receipt and spec tampering fail closed", async (t) => {
  await t.test("receipt fingerprint tampering", async (t) => {
    const root = await fixture(t);
    await applySourceStaticSourceAuditRebind({root});
    const target = path.join(root, RECEIPT);
    const receipt = JSON.parse(await readFile(target, "utf8"));
    receipt.authorityBoundary.strictCompletionCreated = true;
    await chmod(target, 0o644);
    await writeFile(target, `${JSON.stringify(receipt, null, 2)}\n`);
    await assert.rejects(
      checkSourceStaticSourceAuditRebind({
        root,
        requireRebuiltCandidates: false,
      }),
      /fingerprint is stale/,
    );
  });
  await t.test("spec descriptor tampering", async (t) => {
    const root = await fixture(t);
    await applySourceStaticSourceAuditRebind({root});
    const target = path.join(
      root,
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS[0].specPath,
    );
    const spec = JSON.parse(await readFile(target, "utf8"));
    spec.evidence.sourceAudit.sha256 = "0".repeat(64);
    await writeFile(target, `${JSON.stringify(spec, null, 2)}\n`);
    await assert.rejects(
      checkSourceStaticSourceAuditRebind({
        root,
        requireRebuiltCandidates: false,
      }),
      /post-spec receipt binding is stale/,
    );
  });
});

historicalReplayTest("path escape, symlink, and concurrent lock are rejected", async (t) => {
  assert.throws(() => safeProjectRelative("../escape.json"), /not a normalized/);
  assert.throws(() => safeProjectRelative("/tmp/escape.json"), /not a normalized/);
  assert.throws(() => safeProjectRelative("a/../escape.json"), /not a normalized/);

  await t.test("symlink input", async (t) => {
    const root = await fixture(t);
    const item = SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS[0];
    const target = path.join(root, item.specPath);
    await unlink(target);
    await symlink(path.join(root, item.reportPath), target);
    await assert.rejects(
      applySourceStaticSourceAuditRebind({root}),
      /ELOOP|symbolic|regular file/,
    );
  });

  await t.test("concurrent lock", async (t) => {
    const root = await fixture(t);
    await mkdir(path.join(
      root,
      "work/g4-l3-source-static-source-audit-rebind/.rebind.lock",
    ), {recursive: true});
    await assert.rejects(
      applySourceStaticSourceAuditRebind({root}),
      /lock is already held/,
    );
  });
});

historicalReplayTest("partial spec write rolls back every preimage and leaves no receipt", async (t) => {
  const root = await fixture(t);
  const before = await specBytes(root);
  await assert.rejects(
    applySourceStaticSourceAuditRebind({
      root,
      hooks: {
        afterSpecWrite({index}) {
          if (index === 2) throw new Error("synthetic partial-write failure");
        },
      },
    }),
    /synthetic partial-write failure/,
  );
  const after = await specBytes(root);
  assert.equal(after.length, before.length);
  for (let index = 0; index < before.length; index += 1) {
    assert.deepEqual(after[index], before[index]);
  }
  assert.equal(await exists(path.join(root, RECEIPT)), false);
});

async function markWriterLockStale(root) {
  const target = path.join(
    root,
    "work/g4-l3-source-static-source-audit-rebind/.rebind.lock/owner.json",
  );
  const owner = JSON.parse(await readFile(target, "utf8"));
  owner.pid = 2_147_483_647;
  await chmod(target, 0o644);
  await writeFile(target, `${JSON.stringify(owner, null, 2)}\n`);
  await chmod(target, 0o444);
}

historicalReplayTest("deterministic recovery restores an interrupted transaction", async (t) => {
  const root = await fixture(t);
  const before = await specBytes(root);
  await assert.rejects(
    applySourceStaticSourceAuditRebind({
      root,
      leaveInterruptedForTest: true,
      hooks: {
        afterSpecWrite({index}) {
          if (index === 2) throw new Error("synthetic process crash");
        },
      },
    }),
    /synthetic process crash/,
  );
  const transactionNames = await (await import("node:fs/promises"))
    .readdir(path.join(
      root,
      "work/g4-l3-source-static-source-audit-rebind/transactions",
    ));
  assert.equal(transactionNames.length, 1);
  const [transactionId] = transactionNames;
  await markWriterLockStale(root);
  const result = await recoverSourceStaticSourceAuditRebind({
    root,
    transactionId,
  });
  assert.equal(result.mode, "recover");
  assert.equal(result.restoredSpecCount, 3);
  assert.equal(result.strictAcceptanceEffect, "none");
  const after = await specBytes(root);
  for (let index = 0; index < before.length; index += 1) {
    assert.deepEqual(after[index], before[index]);
  }
  assert.equal(await exists(path.join(root, RECEIPT)), false);
  await assert.rejects(
    recoverSourceStaticSourceAuditRebind({root, transactionId}),
    /recovered transaction cannot be replayed/,
  );
});

historicalReplayTest("recovery closes a missing-target crash window and rejects tamper", async (t) => {
  await t.test("missing target is restored from immutable preimage", async (t) => {
    const root = await fixture(t);
    await assert.rejects(
      applySourceStaticSourceAuditRebind({
        root,
        leaveInterruptedForTest: true,
        hooks: {
          afterSpecWrite({index}) {
            if (index === 0) throw new Error("synthetic process crash");
          },
        },
      }),
      /synthetic process crash/,
    );
    const transactionNames = await (await import("node:fs/promises"))
      .readdir(path.join(
        root,
        "work/g4-l3-source-static-source-audit-rebind/transactions",
      ));
    const transactionId = transactionNames[0];
    const first = SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS[0];
    await unlink(path.join(root, first.specPath));
    await markWriterLockStale(root);
    const result = await recoverSourceStaticSourceAuditRebind({
      root,
      transactionId,
    });
    assert.equal(result.missingTargetRecoveryCount, 1);
    const restored = await readFile(path.join(root, first.specPath));
    const plan = JSON.parse(await readFile(path.join(
      root,
      "work/g4-l3-source-static-source-audit-rebind/transactions",
      transactionId,
      "plan.json",
    ), "utf8"));
    assert.equal(
      (await import("node:crypto")).createHash("sha256")
        .update(restored).digest("hex"),
      plan.specPreimages[0].sha256,
    );
  });

  await t.test("tampered plan fails before recovery writes", async (t) => {
    const root = await fixture(t);
    await assert.rejects(
      applySourceStaticSourceAuditRebind({
        root,
        leaveInterruptedForTest: true,
        hooks: {
          afterSpecWrite({index}) {
            if (index === 0) throw new Error("synthetic process crash");
          },
        },
      }),
      /synthetic process crash/,
    );
    const transactionNames = await (await import("node:fs/promises"))
      .readdir(path.join(
        root,
        "work/g4-l3-source-static-source-audit-rebind/transactions",
      ));
    const transactionId = transactionNames[0];
    const planPath = path.join(
      root,
      "work/g4-l3-source-static-source-audit-rebind/transactions",
      transactionId,
      "plan.json",
    );
    const plan = JSON.parse(await readFile(planPath, "utf8"));
    plan.specPreimages[0].path = "../escape.json";
    await chmod(planPath, 0o644);
    await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
    await chmod(planPath, 0o444);
    await markWriterLockStale(root);
    await assert.rejects(
      recoverSourceStaticSourceAuditRebind({root, transactionId}),
      /spec scope drifted/,
    );
  });
});

test("recovery refuses the committed checked-in transaction", async () => {
  if (!await exists(path.join(ROOT, RECEIPT))) return;
  const receipt = JSON.parse(await readFile(path.join(ROOT, RECEIPT), "utf8"));
  await assert.rejects(
    recoverSourceStaticSourceAuditRebind({
      root: ROOT,
      transactionId: receipt.transactionId,
    }),
    /committed transaction cannot be recovered/,
  );
});

test("committed v1 history keeps the exact archived generator pin immutable",
  async () => {
    if (!await exists(path.join(ROOT, RECEIPT))) return;
    const receipt = JSON.parse(await readFile(path.join(ROOT, RECEIPT), "utf8"));
    validateSourceStaticSourceAuditRebindReceipt(receipt);
    const first = receipt.items[0];
    const archivedCandidate = JSON.parse(
      await readFile(
        path.join(ROOT, first.historicalEvidence.archivedCandidatePath),
        "utf8",
      ),
    );
    const pinned = archivedCandidate.integrationBindings.find(
      ({path: bindingPath}) => bindingPath === GENERATOR,
    );
    assert.equal(
      pinned.sha256,
      "f7f8c8b357bd0580eb1dbe6bb99e9fbe52aff15a1736d0179188637960f04821",
    );
    assert.equal(first.historicalEvidence.candidateReport.sha256,
      SOURCE_STATIC_SOURCE_AUDIT_TRANSITIONS[0].archivedCandidate.sha256);
    assert.equal(receipt.transactionId,
      "75f8766a9fb4648979f7c0fbae3badf05d31c43f5ca83b40f3f2c2c85344fcf7");
  });

test("checked-in workspace validates through the current derived-refresh successor", async () => {
  const result = await checkDerivedRefreshReceipt({root: ROOT});
  assert.equal(result.status, "already-created-and-verified");
  assert.equal(result.sourceSpecCount, 19);
  assert.equal(result.intentionalDerivedRefreshCount, 2);
  assert.equal(result.strictComplete, 0);
  assert.equal(result.published, false);
  assert.equal(result.strictAcceptanceEffect, "none");
  assert.equal(result.releaseEffect, "none");
});
