import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  assetInventorySemanticFields,
  buildAssetInventory,
  buildBoundManifest,
  buildImmutableInventoryReconciliationReceipt,
  buildImmutableInventoryObserverSuccessorReceipt,
  buildObserverSuccessorRefreshedReport,
  buildWorkspaceBindingMarkdown,
  commitInventoryObserverSuccessorReceiptOnlyRebind,
  materializeTs006CurrentJsWorkspaceBinding,
  parseArguments,
  validateAcceptanceNeutralManifestRebind,
  validateExactAssetInventoryManifestCellTransition,
  validateInventoryObserverTransactionDocuments,
  validateNormalizedProjectRelativePath,
  readSafeRegularBinding,
  recoverInventoryObserverSuccessorReceiptOnlyRebind,
  validateSpecializedRefreshPreimageOwnership,
} from "./materialize-g4-l3-ts006-current-js-workspace-binding.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJsonBinding(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {
    value: JSON.parse(bytes),
    binding: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

function collectBindings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  if (
    typeof value.path === "string" &&
    Number.isSafeInteger(value.bytes) &&
    /^[a-f0-9]{64}$/u.test(value.sha256 || "")
  ) {
    return [{ path: value.path, bytes: value.bytes, sha256: value.sha256 }];
  }
  return Object.values(value).flatMap(collectBindings);
}

async function copyFixtureFile(fixtureRoot, relativePath) {
  const destination = path.join(fixtureRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(ROOT, relativePath), destination);
  if (
    relativePath.includes(
      "g4-l3-ts006-current-javascript-asset-inventory-reconciliations/",
    )
  ) {
    await chmod(destination, 0o444);
  }
}

async function createSuccessorFixture() {
  const plan = await materializeTs006CurrentJsWorkspaceBinding({
    planRefresh: true,
  });
  const fixtureRoot = await mkdtemp(
    path.join(tmpdir(), "ts006-observer-successor-"),
  );
  const bindings = collectBindings(
    plan.observerSuccessorRebind.compareAndSwapPreconditions,
  );
  const uniquePaths = [...new Set(bindings.map(({ path }) => path))];
  for (const relativePath of uniquePaths) {
    await copyFixtureFile(fixtureRoot, relativePath);
  }
  const reportBytes = await readFile(
    path.join(
      ROOT,
      "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
    ),
  );
  const currentReport = {
    bytes: reportBytes,
    value: JSON.parse(reportBytes),
    binding: plan.currentReport,
  };
  const receipt = buildImmutableInventoryObserverSuccessorReceipt({
    successorRebind: plan.observerSuccessorRebind,
    generator: plan.observerSuccessorRebind.generator,
  });
  const refreshed = buildObserverSuccessorRefreshedReport({
    currentReport,
    currentModel: {
      ...structuredClone(currentReport.value),
      generator: plan.observerSuccessorRebind.generator,
    },
    successorRebind: plan.observerSuccessorRebind,
    immutableReceiptBinding: receipt.binding,
  });
  return {
    fixtureRoot,
    plan,
    receipt,
    casBindings: bindings,
    refreshedReportBytes: Buffer.from(
      `${JSON.stringify(refreshed, null, 2)}\n`,
    ),
    refreshedMarkdownBytes: Buffer.from(
      buildWorkspaceBindingMarkdown(refreshed),
    ),
  };
}

async function fixtureBinding(fixtureRoot, relativePath) {
  const bytes = await readFile(path.join(fixtureRoot, relativePath));
  return { path: relativePath, bytes: bytes.length, sha256: sha256(bytes) };
}

async function interruptSuccessorFixture(fixture) {
  let interruption = null;
  try {
    await commitInventoryObserverSuccessorReceiptOnlyRebind({
      root: fixture.fixtureRoot,
      receipt: fixture.receipt,
      refreshedReportBytes: fixture.refreshedReportBytes,
      refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
      leaveInterruptedForTest: true,
      testHooks: {
        afterState({ index, state }) {
          if (index === 0 && state === "S1_TEMP_READY") {
            throw new Error("synthetic recovery-validation interruption");
          }
        },
      },
    });
  } catch (error) {
    interruption = error;
  }
  assert.match(
    interruption?.successorRecovery?.transactionId || "",
    /^[a-f0-9]{64}-[a-f0-9]{32}$/u,
  );
  return interruption.successorRecovery.transactionId;
}

function successorTransactionRoot(fixtureRoot, transactionId) {
  return path.join(
    fixtureRoot,
    "work/g4-l3-v2-ts006-current-js-binding-successor-transactions",
    transactionId,
  );
}

test("TS006 workspace-binding CLI exposes only check and acceptance-neutral candidate refresh", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    refresh: false,
    planRefresh: false,
  });
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    refresh: false,
    planRefresh: false,
  });
  assert.deepEqual(parseArguments(["--refresh"]), {
    check: false,
    refresh: true,
    planRefresh: false,
  });
  assert.deepEqual(parseArguments(["--plan-refresh"]), {
    check: false,
    refresh: false,
    planRefresh: true,
  });
  assert.throws(
    () => parseArguments(["--check", "--refresh"]),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseArguments(["--refresh", "--plan-refresh"]),
    /mutually exclusive/,
  );
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});

test("zero-change successor plan is receipt-only and leaves production bytes unchanged", async () => {
  const protectedPaths = [
    "migrations/course-g04-l03-ts-006/migration.json",
    "migrations/course-g04-l03-ts-006/evidence/full-frame-coverage.json",
    "migrations/course-g04-l03-ts-006/asset-inventory.csv",
    "migrations/course-g04-l03-ts-006/MIGRATION_BRIEF.md",
    "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-inventory-materialization.json",
    "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
    "reports/g4-l3-ts006-current-javascript-workspace-binding.md",
    "catalog/completion-ledger.json",
    "catalog/lesson-release-ledger.json",
    "catalog/lesson-releases.json",
  ];
  const before = await Promise.all(
    protectedPaths.map((relativePath) => readFile(path.join(ROOT, relativePath))),
  );
  const plan = await materializeTs006CurrentJsWorkspaceBinding({
    planRefresh: true,
  });
  assert.equal(plan.status, "validated-plan-no-files-written");
  assert.equal(plan.refreshMode, "receipt-only-observer-successor-rebind");
  assert.equal(plan.workspaceDocumentsRewritten, false);
  assert.deepEqual(plan.rewrittenWorkspaceDocuments, []);
  assert.equal(plan.immutablePreimage, null);
  assert.equal(
    plan.observerSuccessorRebind.successor.oldTransactionProvesCurrentObserver,
    false,
  );
  assert.equal(
    plan.observerSuccessorRebind.successor.observerReceipt.sha256,
    "634e38a63df445b112e9b90969f95b2dcc50b80089a142c5d0b5f305f531cd28",
  );
  assert.equal(plan.strictAcceptanceEffect, "none");
  assert.ok(Object.values(plan.acceptance).every((value) => value === false));
  const after = await Promise.all(
    protectedPaths.map((relativePath) => readFile(path.join(ROOT, relativePath))),
  );
  assert.ok(before.every((bytes, index) => bytes.equals(after[index])));
});

test("observer bridge proves the exact global transaction and rejects unknown, tampered, or escaping evidence", async () => {
  const transactionId =
    "78d34420595778c22dd614f2d3e672f19ec2839484cd04703b2f173279717ae5";
  const transactionRoot = `work/g4-l3-workspace-inventory-refresh-preimages/transactions/${transactionId}`;
  const archiveRoot =
    "work/g4-l3-workspace-inventory-refresh-preimages/sets/77b8e14a14cead5b7c54b1d2a93aa50959c044424473e626de7ebe8bfaddf704";
  const observerPath =
    "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-inventory-materialization.json";
  const [plan, receipt, archiveManifest, observerPreimage, observerPostimage] =
    await Promise.all([
      readJsonBinding(`${transactionRoot}/plan.json`),
      readJsonBinding(`${transactionRoot}/receipt.json`),
      readJsonBinding(`${archiveRoot}/manifest.json`),
      readJsonBinding(`${archiveRoot}/files/${observerPath}`),
      readJsonBinding(`${transactionRoot}/desired/${observerPath}`),
    ]);
  observerPostimage.binding.path = observerPath;
  const workspaceReport = JSON.parse(
    await readFile(
      path.join(
        ROOT,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
    ),
  );
  const currentPreimage =
    workspaceReport.refreshHistory.at(-1).immutablePreimage;
  const canonicalAssetInventoryBytes = await readFile(
    path.join(
      ROOT,
      currentPreimage.root,
      path.basename(
        currentPreimage.bindings[
          "migrations/course-g04-l03-ts-006/asset-inventory.csv"
        ].path,
      ),
    ),
  );
  const canonicalAssetInventoryBinding = {
    path: "migrations/course-g04-l03-ts-006/asset-inventory.csv",
    bytes: canonicalAssetInventoryBytes.length,
    sha256: sha256(canonicalAssetInventoryBytes),
  };
  const inputs = {
    plan: plan.value,
    planBinding: plan.binding,
    receipt: receipt.value,
    receiptBinding: receipt.binding,
    archiveManifest: archiveManifest.value,
    archiveManifestBinding: archiveManifest.binding,
    observerPreimage: observerPreimage.value,
    observerPreimageBinding: observerPreimage.binding,
    observerPostimage: observerPostimage.value,
    observerPostimageBinding: observerPostimage.binding,
    canonicalAssetInventoryBinding,
    canonicalAssetInventoryBytes,
  };
  const witness = validateInventoryObserverTransactionDocuments(inputs);
  assert.equal(witness.transactionId, transactionId);
  assert.equal(witness.allowedSemanticChanges.length, 4);
  assert.equal(witness.canonicalInventoriesUnchanged, true);
  assert.equal(witness.strictAcceptanceEffect, "none");
  assert.equal(witness.canonicalAssetInventorySemanticFields.records.length, 2);

  const unknown = {
    ...inputs,
    observerPreimageBinding: {
      ...inputs.observerPreimageBinding,
      sha256: "0".repeat(64),
    },
  };
  assert.throws(
    () => validateInventoryObserverTransactionDocuments(unknown),
    /unknown exact preimage or postimage/,
  );

  const tampered = {
    ...inputs,
    observerPostimage: structuredClone(inputs.observerPostimage),
  };
  tampered.observerPostimage.sourceBindings.assetDefinitionCensus.sha256 =
    "0".repeat(64);
  assert.throws(
    () => validateInventoryObserverTransactionDocuments(tampered),
    /fingerprint is stale|outside its four allowlisted semantic leaves/,
  );

  assert.throws(
    () =>
      validateNormalizedProjectRelativePath(
        "work/g4-l3-workspace-inventory-refresh-preimages/../outside.json",
        {
          requiredPrefix: "work/g4-l3-workspace-inventory-refresh-preimages",
        },
      ),
    /not a normalized allowlisted project-relative path/,
  );
  assert.equal(
    assetInventorySemanticFields(canonicalAssetInventoryBytes).records[1]
      .sha256,
    "3e53077860ab9e6f9aeea22989770d2605e8ccd8b56e124342cf536a4c8200de",
  );
});

test("inventory reconciliation permits exactly one manifest hash cell", async () => {
  const candidate = JSON.parse(
    await readFile(
      path.join(ROOT, "reports/g4-l3-ts006-current-javascript-candidate.json"),
    ),
  );
  const report = JSON.parse(
    await readFile(
      path.join(
        ROOT,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
    ),
  );
  const latest = report.refreshHistory.at(-1);
  const beforeBytes = await readFile(
    path.join(
      ROOT,
      latest.immutablePreimage.root,
      path.basename(
        latest.immutablePreimage.bindings[
          "migrations/course-g04-l03-ts-006/asset-inventory.csv"
        ].path,
      ),
    ),
  );
  const afterBytes = await readFile(
    path.join(ROOT, "migrations/course-g04-l03-ts-006/asset-inventory.csv"),
  );
  assert.equal(afterBytes.toString("utf8"), buildAssetInventory(candidate));
  const transition = validateExactAssetInventoryManifestCellTransition({
    beforeBytes,
    afterBytes,
    nextManifestSha256: candidate.outputs.canvasManifest.sha256,
  });
  assert.deepEqual(transition, {
    row: 3,
    field: "sha256",
    priorSha256:
      "3e53077860ab9e6f9aeea22989770d2605e8ccd8b56e124342cf536a4c8200de",
    nextSha256:
      "eea637df94f8c7e9ba149138bcf05426e4f8fec1fc894e2703dc4a9b39a626a0",
    allOtherBytesUnchanged: true,
  });
  const changedRuntime = Buffer.from(afterBytes);
  changedRuntime[afterBytes.indexOf("Canvas")] = "X".charCodeAt(0);
  assert.throws(
    () =>
      validateExactAssetInventoryManifestCellTransition({
        beforeBytes,
        afterBytes: changedRuntime,
        nextManifestSha256: candidate.outputs.canvasManifest.sha256,
      }),
    /changed structure or the Canvas runtime row/,
  );
});

test("immutable reconciliation intent is deterministic and content addressed", async () => {
  const report = JSON.parse(
    await readFile(
      path.join(
        ROOT,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
    ),
  );
  const latest = report.refreshHistory.at(-1);
  const historicalReceiptDocument = JSON.parse(
    await readFile(
      path.join(ROOT, latest.immutableReconciliationReceipt.path),
      "utf8",
    ),
  );
  const historicalGenerator = historicalReceiptDocument.generator;
  const receipt = buildImmutableInventoryReconciliationReceipt({
    reconciliation: latest.inventoryObserverReconciliation,
    generator: historicalGenerator,
  });
  const { reusedExistingExactBytes: _reused, ...checkedInBinding } =
    latest.immutableReconciliationReceipt;
  assert.deepEqual(receipt.binding, checkedInBinding);
  assert.deepEqual(
    await readFile(path.join(ROOT, receipt.path)),
    receipt.bytes,
  );
  assert.equal(
    receipt.document.writeContract.orphanPreparedReceiptIsNotApplicationProof,
    true,
  );
  assert.equal(
    receipt.document.reconciliation.transitionId,
    "v16-progress-inverse-gamma-current-js-rebind-2026-07-27",
  );
  assert.equal(receipt.document.writeContract.acceptanceWritable, false);
  assert.equal(receipt.document.strictAcceptanceEffect, "none");
  const tampered = structuredClone(latest.inventoryObserverReconciliation);
  tampered.acceptanceChanged = true;
  assert.throws(
    () =>
      buildImmutableInventoryReconciliationReceipt({
        reconciliation: tampered,
        generator: historicalGenerator,
      }),
    /inputs are invalid/,
  );
});

test("observer successor receipt is deterministic, acceptance-neutral, and tamper rejecting", async () => {
  const plan = await materializeTs006CurrentJsWorkspaceBinding({
    planRefresh: true,
  });
  const receipt = buildImmutableInventoryObserverSuccessorReceipt({
    successorRebind: plan.observerSuccessorRebind,
    generator: plan.observerSuccessorRebind.generator,
  });
  assert.deepEqual(receipt.binding, plan.immutableObserverSuccessorReceipt);
  assert.equal(
    receipt.document.writeContract.workspaceDocumentsWritable,
    false,
  );
  assert.equal(receipt.document.writeContract.acceptanceWritable, false);
  assert.ok(
    Object.values(receipt.document.acceptance).every(
      (value) => value === false,
    ),
  );
  assert.equal(receipt.document.strictAcceptanceEffect, "none");
  const tampered = structuredClone(plan.observerSuccessorRebind);
  tampered.acceptanceChanged = true;
  assert.throws(
    () =>
      buildImmutableInventoryObserverSuccessorReceipt({
        successorRebind: tampered,
        generator: tampered.generator,
      }),
    /successor rebind is stale, incomplete, or promoted/,
  );
});

test("fixture successor refresh changes only report, Markdown, and immutable receipt and replays idempotently", async () => {
  const fixture = await createSuccessorFixture();
  try {
    const before = new Map();
    for (const binding of fixture.casBindings) {
      before.set(
        binding.path,
        await fixtureBinding(fixture.fixtureRoot, binding.path),
      );
    }
    const applied =
      await commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: fixture.fixtureRoot,
        receipt: fixture.receipt,
        refreshedReportBytes: fixture.refreshedReportBytes,
        refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
      });
    assert.equal(applied.applied, true);
    assert.equal(applied.idempotentReplay, false);
    assert.deepEqual(applied.rewrittenWorkspaceDocuments, []);
    for (const [relativePath, binding] of before) {
      if (
        relativePath.endsWith(
          "g4-l3-ts006-current-javascript-workspace-binding.json",
        ) ||
        relativePath.endsWith(
          "g4-l3-ts006-current-javascript-workspace-binding.md",
        )
      ) {
        continue;
      }
      assert.deepEqual(
        await fixtureBinding(fixture.fixtureRoot, relativePath),
        binding,
      );
    }
    const receiptMetadata = await lstat(
      path.join(fixture.fixtureRoot, fixture.receipt.path),
    );
    assert.equal(receiptMetadata.isFile(), true);
    assert.equal(receiptMetadata.isSymbolicLink(), false);
    assert.equal(receiptMetadata.nlink, 1);
    assert.equal(receiptMetadata.mode & 0o777, 0o444);
    const postApplyReport = await fixtureBinding(
      fixture.fixtureRoot,
      "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
    );
    const postApplyMarkdown = await fixtureBinding(
      fixture.fixtureRoot,
      "reports/g4-l3-ts006-current-javascript-workspace-binding.md",
    );
    const replay =
      await commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: fixture.fixtureRoot,
        receipt: fixture.receipt,
        refreshedReportBytes: fixture.refreshedReportBytes,
        refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
      });
    assert.equal(replay.applied, false);
    assert.equal(replay.idempotentReplay, true);
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
      postApplyReport,
    );
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.md",
      ),
      postApplyMarkdown,
    );
    await assert.rejects(
      lstat(
        path.join(
          fixture.fixtureRoot,
          "reports/g4-l3-ts006-current-javascript-workspace-binding.json.observer-successor.lock",
        ),
      ),
      { code: "ENOENT" },
    );
  } finally {
    await rm(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test("wave2b successor CAS preserves after-read drift without overwriting it", async () => {
  const fixture = await createSuccessorFixture();
  const reportPath = path.join(
    fixture.fixtureRoot,
    "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
  );
  const externalBytes = Buffer.from('{"external":"after-read-drift"}\n');
  let injected = false;
  try {
    await assert.rejects(
      commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: fixture.fixtureRoot,
        receipt: fixture.receipt,
        refreshedReportBytes: fixture.refreshedReportBytes,
        refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
        testHooks: {
          async afterState({ index, state }) {
            if (index === 0 && state === "S1_TEMP_READY" && !injected) {
              injected = true;
              await writeFile(reportPath, externalBytes);
            }
          },
        },
      }),
      /snapshot|drift|preimage|FOREIGN|changed/u,
    );
    assert.equal(injected, true);
    assert.deepEqual(await readFile(reportPath), externalBytes);
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.md",
      ),
      fixture.plan.observerSuccessorRebind.predecessor
        .workspaceBindingMarkdown,
    );
  } finally {
    await rm(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test("wave2b successor crash after first install is recovered on restart before retry", async () => {
  const fixture = await createSuccessorFixture();
  let crashError = null;
  try {
    try {
      await commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: fixture.fixtureRoot,
        receipt: fixture.receipt,
        refreshedReportBytes: fixture.refreshedReportBytes,
        refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
        leaveInterruptedForTest: true,
        testHooks: {
          afterState({ index, state }) {
            if (index === 0 && state === "S6_VERIFIED") {
              throw new Error("synthetic crash after first install");
            }
          },
        },
      });
    } catch (error) {
      crashError = error;
    }
    assert.match(crashError?.message || "", /synthetic crash/u);
    assert.match(
      crashError?.successorRecovery?.transactionId || "",
      /^[a-f0-9]{64}-[a-f0-9]{32}$/u,
    );
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
      {
        path:
          "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
        bytes: fixture.refreshedReportBytes.length,
        sha256: sha256(fixture.refreshedReportBytes),
      },
    );
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.md",
      ),
      fixture.plan.observerSuccessorRebind.predecessor
        .workspaceBindingMarkdown,
    );
    const recovery =
      await recoverInventoryObserverSuccessorReceiptOnlyRebind({
        root: fixture.fixtureRoot,
        transactionId: crashError.successorRecovery.transactionId,
        decideOwnerLiveness: async () => "dead",
      });
    assert.equal(recovery.restoredToPreimage, true);
    assert.equal(recovery.itemCount, 2);
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
      fixture.plan.observerSuccessorRebind.predecessor.workspaceBindingReport,
    );
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.md",
      ),
      fixture.plan.observerSuccessorRebind.predecessor
        .workspaceBindingMarkdown,
    );
    const retried =
      await commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: fixture.fixtureRoot,
        receipt: fixture.receipt,
        refreshedReportBytes: fixture.refreshedReportBytes,
        refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
      });
    assert.equal(retried.applied, true);
  } finally {
    await rm(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test("successor recovery rejects tampered in-root targets and pre/post hashes", async () => {
  for (const tamper of ["target", "hash"]) {
    const fixture = await createSuccessorFixture();
    try {
      const transactionId = await interruptSuccessorFixture(fixture);
      const planPath = path.join(
        successorTransactionRoot(fixture.fixtureRoot, transactionId),
        "transaction-plan.json",
      );
      const plan = JSON.parse(await readFile(planPath));
      if (tamper === "target") {
        plan.items[0].targetPath = "catalog/completion-ledger.json";
      } else {
        plan.items[0].preimage.sha256 = "0".repeat(64);
        plan.items[0].postimage.sha256 = "f".repeat(64);
      }
      await chmod(planPath, 0o644);
      await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
      await chmod(planPath, 0o444);
      await assert.rejects(
        recoverInventoryObserverSuccessorReceiptOnlyRebind({
          root: fixture.fixtureRoot,
          transactionId,
          decideOwnerLiveness: async () => "dead",
        }),
        /exact receipt-derived target\/hash plan|receipt-derived report\/Markdown/u,
        tamper,
      );
      assert.deepEqual(
        await fixtureBinding(
          fixture.fixtureRoot,
          "catalog/completion-ledger.json",
        ),
        fixture.plan.observerSuccessorRebind.ledgers.completion,
      );
    } finally {
      await rm(fixture.fixtureRoot, { recursive: true, force: true });
    }
  }
});

test("successor recovery rejects journal hash, transaction, sequence, and chain tampering", async () => {
  const fixture = await createSuccessorFixture();
  try {
    const transactionId = await interruptSuccessorFixture(fixture);
    const journalDirectory = path.join(
      successorTransactionRoot(fixture.fixtureRoot, transactionId),
      "journal",
    );
    const originalName = (await readdir(journalDirectory)).sort()[0];
    const originalPath = path.join(journalDirectory, originalName);
    const originalBytes = await readFile(originalPath);
    const originalDocument = JSON.parse(originalBytes);

    const assertRecoveryRejected = () =>
      assert.rejects(
        recoverInventoryObserverSuccessorReceiptOnlyRebind({
          root: fixture.fixtureRoot,
          transactionId,
          decideOwnerLiveness: async () => "dead",
        }),
        /journal content hash, sequence, transaction, or chain is invalid/u,
      );

    await chmod(originalPath, 0o644);
    await writeFile(
      originalPath,
      `${JSON.stringify(
        { ...originalDocument, event: { tampered: true } },
        null,
        2,
      )}\n`,
    );
    await chmod(originalPath, 0o444);
    await assertRecoveryRejected();

    await chmod(originalPath, 0o644);
    await writeFile(originalPath, originalBytes);
    await chmod(originalPath, 0o444);
    const wrongTransactionDocument = {
      ...originalDocument,
      transactionId: `${"0".repeat(64)}-${"1".repeat(32)}`,
    };
    const wrongTransactionBytes = Buffer.from(
      `${JSON.stringify(wrongTransactionDocument, null, 2)}\n`,
    );
    const wrongTransactionName =
      `000001-${sha256(wrongTransactionBytes)}.json`;
    await unlink(originalPath);
    await writeFile(
      path.join(journalDirectory, wrongTransactionName),
      wrongTransactionBytes,
      { flag: "wx", mode: 0o444 },
    );
    await chmod(path.join(journalDirectory, wrongTransactionName), 0o444);
    await assertRecoveryRejected();

    await unlink(path.join(journalDirectory, wrongTransactionName));
    await writeFile(originalPath, originalBytes, {
      flag: "wx",
      mode: 0o444,
    });
    await chmod(originalPath, 0o444);
    const wrongSequenceName = originalName.replace(/^000001-/u, "000999-");
    await rename(
      originalPath,
      path.join(journalDirectory, wrongSequenceName),
    );
    await assertRecoveryRejected();
  } finally {
    await rm(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test("fixture successor refresh rejects observer, workspace, and ledger drift", async () => {
  const fixture = await createSuccessorFixture();
  const driftTargets = [
    "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-inventory-materialization.json",
    "migrations/course-g04-l03-ts-006/asset-inventory.csv",
    "migrations/course-g04-l03-ts-006/migration.json",
    "migrations/course-g04-l03-ts-006/evidence/full-frame-coverage.json",
    "migrations/course-g04-l03-ts-006/MIGRATION_BRIEF.md",
    "catalog/completion-ledger.json",
    "catalog/lesson-release-ledger.json",
  ];
  try {
    for (const relativePath of driftTargets) {
      await writeFile(path.join(fixture.fixtureRoot, relativePath), "x", {
        flag: "a",
      });
      await assert.rejects(
        commitInventoryObserverSuccessorReceiptOnlyRebind({
          root: fixture.fixtureRoot,
          receipt: fixture.receipt,
          refreshedReportBytes: fixture.refreshedReportBytes,
          refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
        }),
        /CAS precondition drifted/,
        relativePath,
      );
      await copyFile(
        path.join(ROOT, relativePath),
        path.join(fixture.fixtureRoot, relativePath),
      );
    }
  } finally {
    await rm(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test("fixture successor refresh rejects symlink escape, path escape, and receipt collision", async () => {
  const symlinkFixture = await createSuccessorFixture();
  const observerPath =
    "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-inventory-materialization.json";
  try {
    await unlink(path.join(symlinkFixture.fixtureRoot, observerPath));
    await symlink(
      path.join(ROOT, observerPath),
      path.join(symlinkFixture.fixtureRoot, observerPath),
    );
    await assert.rejects(
      commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: symlinkFixture.fixtureRoot,
        receipt: symlinkFixture.receipt,
        refreshedReportBytes: symlinkFixture.refreshedReportBytes,
        refreshedMarkdownBytes: symlinkFixture.refreshedMarkdownBytes,
      }),
      /not one regular no-link file inside its root/,
    );
    await assert.rejects(
      readSafeRegularBinding("../outside.json", {
        root: symlinkFixture.fixtureRoot,
      }),
      /not a normalized allowlisted project-relative path/,
    );
  } finally {
    await rm(symlinkFixture.fixtureRoot, { recursive: true, force: true });
  }

  const collisionFixture = await createSuccessorFixture();
  try {
    const receiptTarget = path.join(
      collisionFixture.fixtureRoot,
      collisionFixture.receipt.path,
    );
    await writeFile(receiptTarget, "{}\n", { flag: "wx", mode: 0o444 });
    await chmod(receiptTarget, 0o444);
    await assert.rejects(
      commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: collisionFixture.fixtureRoot,
        receipt: collisionFixture.receipt,
        refreshedReportBytes: collisionFixture.refreshedReportBytes,
        refreshedMarkdownBytes: collisionFixture.refreshedMarkdownBytes,
      }),
      /receipt collision/,
    );
    assert.deepEqual(
      await fixtureBinding(
        collisionFixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
      collisionFixture.plan.currentReport,
    );
  } finally {
    await rm(collisionFixture.fixtureRoot, {
      recursive: true,
      force: true,
    });
  }
});

test("wave2b successor CAS rechecks and rejects an ancestor symlink race", async () => {
  const fixture = await createSuccessorFixture();
  let injected = false;
  try {
    await assert.rejects(
      commitInventoryObserverSuccessorReceiptOnlyRebind({
        root: fixture.fixtureRoot,
        receipt: fixture.receipt,
        refreshedReportBytes: fixture.refreshedReportBytes,
        refreshedMarkdownBytes: fixture.refreshedMarkdownBytes,
        testHooks: {
          async afterState({ index, state }) {
            if (index === 0 && state === "S1_TEMP_READY" && !injected) {
              injected = true;
              await rename(
                path.join(fixture.fixtureRoot, "reports"),
                path.join(fixture.fixtureRoot, "reports-real"),
              );
              await symlink(
                "reports-real",
                path.join(fixture.fixtureRoot, "reports"),
                "dir",
              );
            }
          },
        },
      }),
      /afterState hook failed and post-callback validation detected drift|ancestor contains a symlink/u,
    );
    assert.equal(injected, true);
    assert.equal(
      (
        await lstat(path.join(fixture.fixtureRoot, "reports"))
      ).isSymbolicLink(),
      true,
    );
    assert.deepEqual(
      await fixtureBinding(
        fixture.fixtureRoot,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
      fixture.plan.currentReport,
    );
  } finally {
    await rm(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test("specialized refresh refuses an unowned current workspace preimage", async () => {
  const report = JSON.parse(
    await readFile(
      path.join(
        ROOT,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
    ),
  );
  assert.equal(
    validateSpecializedRefreshPreimageOwnership({
      report,
      observedBindings: report.after,
    }),
    report,
  );
  const unowned = structuredClone(report.after);
  unowned.assetInventory.sha256 = "0".repeat(64);
  assert.throws(
    () =>
      validateSpecializedRefreshPreimageOwnership({
        report,
        observedBindings: unowned,
      }),
    /does not own the current workspace preimage/,
  );
  const promoted = structuredClone(report);
  promoted.acceptance.ownerAccepted = true;
  assert.throws(
    () =>
      validateSpecializedRefreshPreimageOwnership({
        report: promoted,
        observedBindings: promoted.after,
      }),
    /authority or acceptance drift/,
  );
});

test("checked-in TS006 workspace binding is reproducible and acceptance-neutral", async () => {
  const report = JSON.parse(
    await readFile(
      path.join(
        ROOT,
        "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
      ),
      "utf8",
    ),
  );
  const plan = await materializeTs006CurrentJsWorkspaceBinding({
    planRefresh: true,
  });
  assert.equal(report.summary.migrationStatusBefore, "preserved");
  assert.equal(report.summary.migrationStatusAfter, "preserved");
  assert.equal(report.summary.pendingRequirements, 4);
  assert.equal(report.summary.executedCandidateFrames, 128);
  assert.equal(report.summary.uniqueCandidateVisuals, 1);
  assert.equal(report.disposition.currentJavascriptCandidateOnly, true);
  assert.equal(report.disposition.completionLedgerChanged, false);
  assert.equal(report.disposition.approvalOrPinChanged, false);
  assert.equal(report.summary.spanishHostAudioEngineeringCandidate, true);
  assert.equal(report.summary.embeddedAudioEnabled, false);
  assert.equal(report.summary.sourceMediaMatchEstablished, false);
  assert.equal(report.summary.authoritativeListeningComplete, false);
  assert.equal(
    report.sourceBindings.implementationFiles[
      "packages/demos/tests/course-g04-l03-ts-006.test.ts"
    ].path,
    "packages/demos/tests/course-g04-l03-ts-006.test.ts",
  );
  assert.equal(
    report.sourceBindings.spanishHostAudioCurrentJsProductQa.path,
    "migrations/course-g04-l03-ts-006/evidence/spanish-host-audio-current-js-product-qa.json",
  );
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.match(report.strictAcceptanceEffect, /^none;/);
  assert.deepEqual(plan.currentWorkspace, plan.plannedWorkspace);
});

test("bound manifest exposes exact candidate paths while preserving all acceptance gates", async () => {
  const manifest = JSON.parse(
    await readFile(
      path.join(ROOT, "migrations/course-g04-l03-ts-006/migration.json"),
      "utf8",
    ),
  );
  assert.equal(manifest.status, "preserved");
  assert.equal(manifest.confidence, "low");
  assert.equal(manifest.runtime.backgroundColor, "#b8d8f7");
  assert.equal(manifest.runtime.actionScriptVersion, "AS1/2");
  assert.deepEqual(manifest.runtime.externalDependencies, [
    {
      evidence: "audit/machine/ffdec-scripts.txt.gz",
      kind: "lesson-shell-host-preloader-control",
      name: '_level0.InternalPreloader.gotoAndPlay("jump_check")',
      requiredFor:
        "natural Lesson Shell entry and source root-timeline progression",
      status: "source-script-proven-runtime-unverified",
    },
  ]);
  assert.equal(manifest.implementation.defaultFrameDomainId, "sprite-23");
  assert.equal(
    manifest.implementation.registryModule,
    "./modules/course-g04-l03-ts-006",
  );
  assert.equal(
    manifest.implementation.timelineModule,
    "packages/demos/src/timelines/course-g04-l03-ts-006.ts",
  );
  assert.equal(
    manifest.implementation.testFile,
    "packages/demos/tests/course-g04-l03-ts-006.test.ts",
  );
  assert.equal(manifest.implementation.candidateState.audioEnabled, true);
  assert.equal(
    manifest.implementation.candidateState.audioEnablementScope,
    "same-origin-user-activated-spanish-host-track-engineering-candidate-only",
  );
  assert.equal(
    manifest.implementation.candidateState.embeddedAudioEnabled,
    false,
  );
  assert.equal(
    manifest.implementation.candidateState.sourceMediaMatchEstablished,
    false,
  );
  assert.equal(
    manifest.implementation.candidateState.authoritativeListeningComplete,
    false,
  );
  assert.equal(
    manifest.evidence.spanishHostAudioCurrentJsProductQa.audioAccepted,
    false,
  );
  assert.deepEqual(
    manifest.implementation.frameDomains.map(({ id, scenarioIds }) => [
      id,
      scenarioIds,
    ]),
    [
      ["root", ["root-unavailable"]],
      ["sprite-23", ["source-static-frame"]],
    ],
  );
  assert.ok(
    Object.values(manifest.accessibility).every((value) => value === false),
  );
  assert.deepEqual(
    Object.values(manifest.acceptance)
      .filter((value) => value?.decision)
      .map(({ decision }) => decision),
    ["pending", "pending", "pending"],
  );
});

test("acceptance-neutral manifest rebind allows only candidate and QA declarations", async () => {
  const before = JSON.parse(
    await readFile(
      path.join(ROOT, "migrations/course-g04-l03-ts-006/migration.json"),
      "utf8",
    ),
  );
  const after = structuredClone(before);
  after.implementation.rendering =
    "source-static Canvas engineering candidate plus an exact same-origin Spanish host-audio candidate";
  after.implementation.testFile =
    "packages/demos/tests/course-g04-l03-ts-006.test.ts";
  after.evidence.spanishHostAudioCurrentJsProductQa = {
    path: "migrations/course-g04-l03-ts-006/evidence/spanish-host-audio-current-js-product-qa.json",
    sha256: "a".repeat(64),
    authority: "acceptance-neutral-current-javascript-product-qa-only",
    sourceMediaMatchEstablished: false,
    authoritativeListeningComplete: false,
    audioAccepted: false,
    strictAcceptanceEffect: "none",
  };
  assert.equal(validateAcceptanceNeutralManifestRebind(before, after), after);
  const promoted = structuredClone(after);
  promoted.acceptance.ownerReview.decision = "accepted";
  assert.throws(
    () => validateAcceptanceNeutralManifestRebind(before, promoted),
    /cannot change ownerReview/,
  );
  const sourceDrift = structuredClone(after);
  sourceDrift.source.swfSha256 = "0".repeat(64);
  assert.throws(
    () => validateAcceptanceNeutralManifestRebind(before, sourceDrift),
    /identity, source, or status/,
  );
});

test("asset inventory binds both candidate artifacts without promoting them", async () => {
  const candidate = JSON.parse(
    await readFile(
      path.join(ROOT, "reports/g4-l3-ts006-current-javascript-candidate.json"),
      "utf8",
    ),
  );
  const expected = buildAssetInventory(candidate);
  const actual = await readFile(
    path.join(ROOT, "migrations/course-g04-l03-ts-006/asset-inventory.csv"),
    "utf8",
  );
  assert.equal(actual, expected);
  assert.match(actual, /ts006-source-static-canvas-runtime/);
  assert.match(actual, /engineering-candidate/);
  assert.match(actual, /strict completion remain unresolved/);
});

test("manifest builder rejects a promoted review boundary", () => {
  const manifest = {
    animationId: "course-g04-l03-ts-006",
    status: "preserved",
    accessibility: { keyboardReplay: false },
    acceptance: {
      engineeringReview: { decision: "accepted" },
      humanVisualReview: { decision: "pending" },
      ownerReview: { decision: "pending" },
      knownExceptions: [],
    },
  };
  assert.throws(
    () => buildBoundManifest({ manifest }),
    /cannot change engineeringReview/,
  );
});
