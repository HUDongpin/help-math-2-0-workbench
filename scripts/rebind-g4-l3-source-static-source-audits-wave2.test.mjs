import assert from "node:assert/strict";
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  WAVE2_SOURCE_AUDIT_TRANSITIONS,
  applyWave2SourceAuditRebind,
  checkWave2SourceAuditRebind,
  dryRunWave2SourceAuditRebind,
  recoverWave2SourceAuditRebind,
  safeWave2ProjectRelative,
} from "./rebind-g4-l3-source-static-source-audits-wave2.mjs";
import {
  checkDerivedRefreshReceipt,
} from "./build-g4-l3-source-static-wave2b-derived-refresh-receipt.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT =
  "scripts/rebind-g4-l3-source-static-source-audits-wave2.mjs";
const GENERATOR =
  "scripts/build-g4-l3-source-static-candidate.mjs";
const MATERIALIZER =
  "scripts/materialize-g4-l3-workspace-source-audits.mjs";
const RECEIPT =
  "reports/g4-l3-source-static-source-audit-rebind-wave2-receipt.json";
const WORK_ROOT =
  "work/g4-l3-source-static-source-audit-rebind-wave2";
const PROTECTED = [
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "catalog/lesson-releases.json",
  "reports/current-javascript-output-human-approval.json",
  "reports/pilot-owner-review-packet.json",
  "catalog/source-manifest.sha256",
  "reports/pilot-strict-acceptance.json",
  "reports/vb004-semantic-review-packet.json",
  ".gitignore",
  ".vercelignore",
];
const CURRENT_DERIVED_REFRESH =
  await checkDerivedRefreshReceipt({root: ROOT});
const HISTORICAL_PROTECTED_FIXTURE_SKIP =
  "the immutable Wave2 writer pins transaction-time ledgers whose original " +
  "bytes are no longer live; the verified derived-refresh successor binds " +
  "the intentional strict-zero unpublished transition";

function historicalProtectedTest(name, fn) {
  return test(name, {skip: HISTORICAL_PROTECTED_FIXTURE_SKIP}, fn);
}

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
  const receipt = JSON.parse(
    await readFile(path.join(ROOT, RECEIPT), "utf8"),
  );
  return new Map(receipt.items.map((item) => [
    item.animationId,
    {
      spec: item.preimages.archivedSpecPath,
      candidateJson: item.preimages.archivedCandidateJsonPath,
      candidateMarkdown: item.preimages.archivedCandidateMarkdownPath,
    },
  ]));
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(),
    "g4-l3-source-audit-wave2-test-"));
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  const historical = await historicalPaths();
  const paths = new Set([SCRIPT, GENERATOR, MATERIALIZER, ...PROTECTED]);
  for (const item of WAVE2_SOURCE_AUDIT_TRANSITIONS) {
    paths.add(item.currentAudit.path);
    const sourceSpecPath =
      historical?.get(item.animationId)?.spec ?? item.specPath;
    const spec = JSON.parse(
      await readFile(path.join(ROOT, sourceSpecPath), "utf8"),
    );
    for (const kind of ["swf", "fla"]) {
      if (spec.source?.[kind]?.path) paths.add(spec.source[kind].path);
    }
  }
  for (const relativePath of paths) {
    await copyFileToRoot(root, relativePath);
  }
  for (const item of WAVE2_SOURCE_AUDIT_TRANSITIONS) {
    const archived = historical?.get(item.animationId);
    await copyFileToRoot(root, item.specPath, archived?.spec ?? item.specPath);
    await copyFileToRoot(
      root,
      item.reportPath,
      archived?.candidateJson ?? item.reportPath,
    );
    await copyFileToRoot(
      root,
      item.reportMarkdownPath,
      archived?.candidateMarkdown ?? item.reportMarkdownPath,
    );
  }
  return root;
}

async function specBytes(root) {
  return Promise.all(WAVE2_SOURCE_AUDIT_TRANSITIONS.map(
    ({specPath}) => readFile(path.join(root, specPath)),
  ));
}

historicalProtectedTest(
  "wave2 dry-run pins exactly 19 generic members and writes nothing",
  async (t) => {
    const root = await fixture(t);
    const result = await dryRunWave2SourceAuditRebind({root});
    assert.equal(result.mode, "dry-run");
    assert.equal(result.itemCount, 19);
    assert.equal(result.protectedCount, 10);
    assert.equal(result.physicalSourceBindingCount, 31);
    assert.equal(result.writesPerformed, 0);
    assert.equal(result.strictAcceptanceEffect, "none");
    assert.match(result.transactionId, /^[a-f0-9]{64}$/u);
    assert.equal(await exists(path.join(root, RECEIPT)), false);
  });

historicalProtectedTest(
  "wave2 apply is CAS/no-replace and preserves every protected byte",
  async (t) => {
    const root = await fixture(t);
    const protectedBefore = await Promise.all(
      PROTECTED.map((relativePath) => readFile(path.join(root, relativePath))),
    );
    const result = await applyWave2SourceAuditRebind({root});
    assert.equal(result.itemCount, 19);
    assert.equal(result.candidateReportsRebuilt, 0);
    assert.equal(result.strictAcceptanceEffect, "none");
    assert.ok(result.journalRecordCount >= 42);
    const checked = await checkWave2SourceAuditRebind({
      root,
      requireRebuiltCandidates: false,
    });
    assert.equal(checked.itemCount, 19);
    for (const [index, relativePath] of PROTECTED.entries()) {
      assert.deepEqual(
        await readFile(path.join(root, relativePath)),
        protectedBefore[index],
      );
    }
    await assert.rejects(
      applyWave2SourceAuditRebind({root}),
      /preimage|already exists|replay|receipt/u,
    );
  });

historicalProtectedTest(
  "wave2 partial-write failure rolls back all specs and publishes no receipt",
  async (t) => {
    const root = await fixture(t);
    const before = await specBytes(root);
    await assert.rejects(
      applyWave2SourceAuditRebind({
        root,
        hooks: {
          afterSpecWrite({index}) {
            if (index === 2) throw new Error("synthetic wave2 failure");
          },
        },
      }),
      /synthetic wave2 failure/u,
    );
    const after = await specBytes(root);
    assert.equal(after.length, before.length);
    for (let index = 0; index < before.length; index += 1) {
      assert.deepEqual(after[index], before[index]);
    }
    assert.equal(await exists(path.join(root, RECEIPT)), false);
  });

historicalProtectedTest(
  "wave2 interrupted transaction recovers exact preimages",
  async (t) => {
    const root = await fixture(t);
    const before = await specBytes(root);
    await assert.rejects(
      applyWave2SourceAuditRebind({
        root,
        leaveInterruptedForTest: true,
        hooks: {
          afterSpecWrite({index}) {
            if (index === 2) throw new Error("synthetic wave2 crash");
          },
        },
      }),
      /synthetic wave2 crash/u,
    );
    const transactionNames = await (await import("node:fs/promises"))
      .readdir(path.join(root, WORK_ROOT, "transactions"));
    assert.equal(transactionNames.length, 1);
    const [transactionId] = transactionNames;
    const ownerPath = path.join(root, WORK_ROOT, ".rebind.lock/owner.json");
    const owner = JSON.parse(await readFile(ownerPath, "utf8"));
    owner.pid = 2_147_483_647;
    await chmod(ownerPath, 0o644);
    await writeFile(ownerPath, `${JSON.stringify(owner, null, 2)}\n`);
    await chmod(ownerPath, 0o444);
    const recovered = await recoverWave2SourceAuditRebind({
      root,
      transactionId,
    });
    assert.equal(recovered.restoredSpecCount, 3);
    const after = await specBytes(root);
    for (let index = 0; index < before.length; index += 1) {
      assert.deepEqual(after[index], before[index]);
    }
    await assert.rejects(
      recoverWave2SourceAuditRebind({root, transactionId}),
      /cannot be replayed/u,
    );
  });

historicalProtectedTest(
  "wave2 path escape, symlink, hardlink, and concurrent lock fail closed",
  async (t) => {
  assert.throws(
    () => safeWave2ProjectRelative("../escape.json"),
    /not a normalized/u,
  );
  assert.throws(
    () => safeWave2ProjectRelative("/tmp/escape.json"),
    /not a normalized/u,
  );
  await t.test("symlink input", async (t) => {
    const root = await fixture(t);
    const first = WAVE2_SOURCE_AUDIT_TRANSITIONS[0];
    await unlink(path.join(root, first.specPath));
    await symlink(
      path.join(root, first.reportPath),
      path.join(root, first.specPath),
    );
    await assert.rejects(
      applyWave2SourceAuditRebind({root}),
      /ELOOP|symbolic|regular file/u,
    );
  });

  await t.test("hardlink input", async (t) => {
    const root = await fixture(t);
    const first = WAVE2_SOURCE_AUDIT_TRANSITIONS[0];
    const foreign = path.join(root, `${first.specPath}.foreign-hardlink`);
    await link(path.join(root, first.specPath), foreign);
    await assert.rejects(
      applyWave2SourceAuditRebind({root}),
      /multiple hard links/u,
    );
  });

  await t.test("concurrent lock", async (t) => {
    const root = await fixture(t);
    await mkdir(path.join(root, WORK_ROOT, ".rebind.lock"), {
      recursive: true,
    });
    await assert.rejects(
      applyWave2SourceAuditRebind({root}),
      /lock is already held/u,
    );
  });
});

test("current workspace uses the verified successor without rewriting Wave2", () => {
  assert.equal(
    CURRENT_DERIVED_REFRESH.status,
    "already-created-and-verified",
  );
  assert.equal(CURRENT_DERIVED_REFRESH.sourceSpecCount, 19);
  assert.equal(CURRENT_DERIVED_REFRESH.intentionalDerivedRefreshCount, 2);
  assert.equal(CURRENT_DERIVED_REFRESH.strictComplete, 0);
  assert.equal(CURRENT_DERIVED_REFRESH.published, false);
  assert.equal(CURRENT_DERIVED_REFRESH.strictAcceptanceEffect, "none");
  assert.equal(CURRENT_DERIVED_REFRESH.releaseEffect, "none");
});
