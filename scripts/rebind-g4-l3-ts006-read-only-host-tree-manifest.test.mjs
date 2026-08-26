import assert from "node:assert/strict";
import {
  chmod,
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PRODUCTION_CONFIGURATION,
  jsonDifferencePointers,
  parseArguments,
  runHostTreeManifestRebind,
  sha256,
  stableJson,
} from "./rebind-g4-l3-ts006-read-only-host-tree-manifest.mjs";

const FLASH_COMMAND =
  "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";

function fingerprintedManifest(document) {
  const result = structuredClone(document);
  delete result.manifestFingerprintSha256;
  result.manifestFingerprintSha256 = sha256(stableJson(result));
  return result;
}

function withContractSha(document, contractSha256) {
  const result = structuredClone(document);
  result.sourceBindings.runtimeAcquisitionContract.sha256 = contractSha256;
  return fingerprintedManifest(result);
}

async function recursivelyMakeWritable(target) {
  const metadata = await lstat(target).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error),
  );
  if (!metadata) return;
  if (metadata.isSymbolicLink()) return;
  if (metadata.isDirectory()) {
    await chmod(target, 0o755);
    const entries = await readdir(target);
    for (const entry of entries) {
      await recursivelyMakeWritable(path.join(target, entry));
    }
  } else {
    await chmod(target, 0o644);
  }
}

async function createFixture() {
  const projectRoot = await mkdtemp(
    path.join(os.tmpdir(), "ts006-host-manifest-rebind-"),
  );
  const hostRootRelative = "work/host/root";
  const sourceArchiveRelative = "source-assets/archive";
  const contractRelative = "reports/runtime-contract.json";
  const materializerRelative = "scripts/materializer.mjs";
  const transactionRootRelative = "work/host/manifest-rebind-transactions";
  const lockRelative = "work/host/.manifest-rebind.lock";
  const hostRoot = path.join(projectRoot, hostRootRelative);
  const sourceRoot = path.join(projectRoot, sourceArchiveRelative);
  const contractPath = path.join(projectRoot, contractRelative);
  const materializerPath = path.join(projectRoot, materializerRelative);
  const assetDescriptors = [
    {
      path: "ASSETS/clip.swf",
      extension: "swf",
      bytes: Buffer.from("fixture-swf-bytes"),
    },
    {
      path: "ASSETS/sound.mp3",
      extension: "mp3",
      bytes: Buffer.from("fixture-mp3-bytes"),
    },
  ];

  await Promise.all([
    mkdir(path.dirname(contractPath), { recursive: true }),
    mkdir(path.dirname(materializerPath), { recursive: true }),
    mkdir(path.join(hostRoot, "ASSETS"), { recursive: true }),
    mkdir(path.join(sourceRoot, "ASSETS"), { recursive: true }),
  ]);
  for (const asset of assetDescriptors) {
    const source = path.join(sourceRoot, ...asset.path.split("/"));
    const staged = path.join(hostRoot, ...asset.path.split("/"));
    await writeFile(source, asset.bytes);
    await copyFile(source, staged);
    await chmod(staged, 0o444);
  }
  const materializerBytes = Buffer.from("fixture host-tree materializer\n");
  await writeFile(materializerPath, materializerBytes);

  const sourceSwf = assetDescriptors[0];
  const sourceSwfSha256 = sha256(sourceSwf.bytes);
  const sourceFlaSha256 = "f".repeat(64);
  const contract = {
    schemaVersion: 1,
    reportType: "g4-l3-authoritative-runtime-acquisition-contract",
    summary: {
      canonicalItems: 40,
      runtimeContractRevision: "001",
    },
    items: [
      {
        animationId: "course-g04-l03-ts-006",
        source: {
          swf: {
            path: `${sourceArchiveRelative}/${sourceSwf.path}`,
            bytes: sourceSwf.bytes.length,
            sha256: sourceSwfSha256,
            physicalHashVerified: true,
          },
          fla: {
            path: "source-assets/archive/fixture.fla",
            bytes: 1,
            sha256: sourceFlaSha256,
          },
        },
        authoringGate: { authoringAuditEstablished: true },
        runtimeContainmentPrerequisite: {
          exactExternalOperationCount: 0,
          sideEffectContainmentApproved: false,
        },
      },
    ],
  };
  const contractBytes = Buffer.from(stableJson(contract));
  await writeFile(contractPath, contractBytes);
  const currentContractSha256 = sha256(contractBytes);
  const historicalContractSha256 = "a".repeat(64);

  const files = assetDescriptors
    .map((asset) => ({
      path: asset.path,
      bytes: asset.bytes.length,
      sha256: sha256(asset.bytes),
      extension: asset.extension,
      stagedMode: "0444",
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
  const fileSetSha256 = sha256(
    Buffer.from(
      files
        .map(
          (file) =>
            `${file.path}\t${file.bytes}\t${file.sha256}\t${file.stagedMode}`,
        )
        .join("\n"),
    ),
  );
  const manifestWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-read-only-original-runtime-host-tree",
    generator: {
      file: materializerRelative,
      bytes: materializerBytes.length,
      sha256: sha256(materializerBytes),
    },
    ownership: {
      purpose: "fixture acceptance-neutral read-only host tree",
      sourceAssetsModified: false,
      sourceFilesHardLinked: false,
      runtimeExecuted: false,
      acceptanceEffect: "none",
    },
    selectedCandidate: {
      animationId: "course-g04-l03-ts-006",
      sourceSwf: contract.items[0].source.swf,
      sourceFlaSha256,
    },
    sourceBindings: {
      runtimeAcquisitionContract: {
        file: contractRelative,
        bytes: contractBytes.length,
        sha256: historicalContractSha256,
        reportType: contract.reportType,
        schemaVersion: contract.schemaVersion,
      },
      archiveRoot: sourceArchiveRelative,
      includedRoots: ["ASSETS"],
      includedExtensions: [".mp3", ".swf"],
    },
    stagedRoot: {
      path: hostRootRelative,
      directoryMode: "0555",
      fileMode: "0444",
      regularCopiedFilesOnly: true,
      symbolicLinks: 0,
      hardLinks: 0,
    },
    summary: {
      files: files.length,
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      filesByExtension: { mp3: 1, swf: 1 },
      sourceRoots: 1,
      sourceFlasCopied: 0,
      sourceActionScriptFilesCopied: 0,
      runtimeSessionsExecuted: 0,
      containmentControlsApproved: 0,
      strictCompletions: 0,
    },
    fileSetSha256,
    files,
    executionGate: {
      state: "read-only-host-tree-materialized-runtime-not-authorized",
      cr02TechnicalArtifactPrepared: true,
      cr02Approved: false,
      originalRuntimeExecutionReady: false,
      launchesRuntimeByThisMaterializer: false,
      launchesAnimateByThisMaterializer: false,
      legacyEndpointsExecutedByThisMaterializer: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      readOnlyHostTreeMaterialized: true,
      containmentApproved: false,
      runtimeApproved: false,
      authoritativeOriginalRuntimeAccepted: false,
      implementationAuthorized: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "fixture only",
    },
  };
  const historicalManifest = fingerprintedManifest(manifestWithoutFingerprint);
  const expectedManifest = withContractSha(
    historicalManifest,
    currentContractSha256,
  );
  const historicalManifestBytes = Buffer.from(stableJson(historicalManifest));
  const expectedManifestBytes = Buffer.from(stableJson(expectedManifest));
  const manifestPath = path.join(hostRoot, "staging-manifest.json");
  await writeFile(manifestPath, historicalManifestBytes);
  await chmod(manifestPath, 0o444);
  await chmod(path.join(hostRoot, "ASSETS"), 0o555);
  await chmod(hostRoot, 0o555);

  const configuration = {
    projectRoot,
    hostRootRelative,
    sourceArchiveRelative,
    contractRelative,
    materializerRelative,
    transactionRootRelative,
    lockRelative,
    animationId: "course-g04-l03-ts-006",
    historicalContractSha256,
    currentContractSha256,
    historicalManifestSha256: sha256(historicalManifestBytes),
    expectedManifestSha256: sha256(expectedManifestBytes),
    historicalManifestFingerprintSha256:
      historicalManifest.manifestFingerprintSha256,
    expectedManifestFingerprintSha256:
      expectedManifest.manifestFingerprintSha256,
    manifestBytes: historicalManifestBytes.length,
    stagedFileCount: files.length,
    stagedBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    fileSetSha256,
    filesByExtension: { mp3: 1, swf: 1 },
    includedRoots: ["ASSETS"],
    includedExtensions: [".mp3", ".swf"],
    materializer: {
      bytes: materializerBytes.length,
      sha256: sha256(materializerBytes),
    },
  };
  return {
    projectRoot,
    configuration,
    hostRoot,
    sourceRoot,
    contractPath,
    manifestPath,
    historicalManifest,
    expectedManifest,
    historicalManifestBytes,
    expectedManifestBytes,
    stagedAssetPath: path.join(hostRoot, "ASSETS/clip.swf"),
    sourceAssetPath: path.join(sourceRoot, "ASSETS/clip.swf"),
    cleanup: async () => {
      await recursivelyMakeWritable(projectRoot);
      await rm(projectRoot, { recursive: true, force: true });
    },
  };
}

async function configureSecondTransition(fixture) {
  const first = fixture.configuration;
  const contract = JSON.parse(await readFile(fixture.contractPath, "utf8"));
  contract.summary.runtimeContractRevision = "002";
  const secondContractBytes = Buffer.from(stableJson(contract));
  assert.equal(
    secondContractBytes.length,
    (await readFile(fixture.contractPath)).length,
  );
  await writeFile(fixture.contractPath, secondContractBytes);

  const secondContractSha256 = sha256(secondContractBytes);
  const secondHistoricalManifest = fixture.expectedManifest;
  const secondExpectedManifest = withContractSha(
    secondHistoricalManifest,
    secondContractSha256,
  );
  const secondHistoricalManifestBytes = Buffer.from(
    stableJson(secondHistoricalManifest),
  );
  const secondExpectedManifestBytes = Buffer.from(
    stableJson(secondExpectedManifest),
  );
  const firstTransition = {
    sequence: 1,
    historicalContractSha256: first.historicalContractSha256,
    currentContractSha256: first.currentContractSha256,
    historicalManifestSha256: first.historicalManifestSha256,
    expectedManifestSha256: first.expectedManifestSha256,
    historicalManifestFingerprintSha256:
      first.historicalManifestFingerprintSha256,
    expectedManifestFingerprintSha256: first.expectedManifestFingerprintSha256,
  };
  const secondTransition = {
    sequence: 2,
    historicalContractSha256: first.currentContractSha256,
    currentContractSha256: secondContractSha256,
    historicalManifestSha256: first.expectedManifestSha256,
    expectedManifestSha256: sha256(secondExpectedManifestBytes),
    historicalManifestFingerprintSha256:
      first.expectedManifestFingerprintSha256,
    expectedManifestFingerprintSha256:
      secondExpectedManifest.manifestFingerprintSha256,
  };
  return {
    configuration: {
      ...first,
      authorizedTransitions: [firstTransition, secondTransition],
      ...Object.fromEntries(
        Object.entries(secondTransition).filter(([key]) => key !== "sequence"),
      ),
    },
    firstTransition,
    secondTransition,
    secondHistoricalManifest,
    secondExpectedManifest,
    secondHistoricalManifestBytes,
    secondExpectedManifestBytes,
  };
}

async function rewriteManifest(fixture, mutate) {
  const manifest = JSON.parse(await readFile(fixture.manifestPath, "utf8"));
  mutate(manifest);
  const rewritten = fingerprintedManifest(manifest);
  await chmod(fixture.manifestPath, 0o644);
  await writeFile(fixture.manifestPath, stableJson(rewritten));
  await chmod(fixture.manifestPath, 0o444);
  return rewritten;
}

const fakeProcessInspector = async (pid) =>
  pid === 4242 ? FLASH_COMMAND : "/usr/bin/false";

test("CLI defaults fail-safe to dry-run and rejects authority escalation options", () => {
  assert.deepEqual(parseArguments([]), {
    mode: "dry-run",
    activeFlashPid: null,
    help: false,
  });
  assert.deepEqual(parseArguments(["--check", "--active-flash-pid", "4242"]), {
    mode: "check",
    activeFlashPid: 4242,
    help: false,
  });
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /choose exactly one/,
  );
  assert.throws(() => parseArguments(["--approve"]), /unknown argument/);
  assert.throws(() => parseArguments(["--release"]), /unknown argument/);
  assert.throws(
    () => parseArguments(["--active-flash-pid", "not-a-pid"]),
    /integer greater than one/,
  );
});

test("JSON drift detector exposes only the contract SHA and derived fingerprint", async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  assert.deepEqual(
    jsonDifferencePointers(
      fixture.historicalManifest,
      fixture.expectedManifest,
    ).sort(),
    [
      "/manifestFingerprintSha256",
      "/sourceBindings/runtimeAcquisitionContract/sha256",
    ],
  );
  const result = await runHostTreeManifestRebind({
    mode: "dry-run",
    configuration: fixture.configuration,
  });
  assert.equal(result.state, "historical");
  assert.equal(result.applyRequired, true);
  assert.equal(result.writesPerformed, 0);
  assert.equal(result.transition.exactHistoricalHashReconstructed, true);
  assert.deepEqual(result.transition.changedJsonPointers, [
    "/manifestFingerprintSha256",
    "/sourceBindings/runtimeAcquisitionContract/sha256",
  ]);
});

test("production dry-run fails closed after canonical host-tree rematerialization", async () => {
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: PRODUCTION_CONFIGURATION,
    }),
    /staging manifest is neither the exact historical nor expected CAS state/,
  );
});

test("dry-run rejects staged-byte tamper and canonical-source hard links", async (t) => {
  const stagedFixture = await createFixture();
  t.after(stagedFixture.cleanup);
  await chmod(stagedFixture.stagedAssetPath, 0o644);
  await writeFile(stagedFixture.stagedAssetPath, "tampered");
  await chmod(stagedFixture.stagedAssetPath, 0o444);
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: stagedFixture.configuration,
    }),
    /staged or canonical source bytes drifted/,
  );

  const sourceFixture = await createFixture();
  t.after(sourceFixture.cleanup);
  await link(
    sourceFixture.sourceAssetPath,
    path.join(sourceFixture.projectRoot, "source-hardlink-alias"),
  );
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: sourceFixture.configuration,
    }),
    /canonical source.*single-link/,
  );
});

test("dry-run rejects symlink and hard-link escape paths", async (t) => {
  const symlinkFixture = await createFixture();
  t.after(symlinkFixture.cleanup);
  const stagedParent = path.dirname(symlinkFixture.stagedAssetPath);
  await chmod(stagedParent, 0o755);
  await unlink(symlinkFixture.stagedAssetPath);
  await symlink(symlinkFixture.sourceAssetPath, symlinkFixture.stagedAssetPath);
  await chmod(stagedParent, 0o555);
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: symlinkFixture.configuration,
    }),
    /single-link file|symlink/,
  );

  const hardlinkFixture = await createFixture();
  t.after(hardlinkFixture.cleanup);
  await link(
    hardlinkFixture.manifestPath,
    path.join(hardlinkFixture.projectRoot, "manifest-hardlink-alias"),
  );
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: hardlinkFixture.configuration,
    }),
    /staging manifest.*single-link/,
  );
});

test("extra manifest drift and authority escalation fail closed", async (t) => {
  const extraFixture = await createFixture();
  t.after(extraFixture.cleanup);
  await rewriteManifest(extraFixture, (manifest) => {
    manifest.ownership.purpose = "unexpected semantic drift";
  });
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: extraFixture.configuration,
    }),
    /manifest byte length drifted|historical staging-manifest hash cannot be reconstructed/,
  );

  const authorityFixture = await createFixture();
  t.after(authorityFixture.cleanup);
  await rewriteManifest(authorityFixture, (manifest) => {
    manifest.acceptance.strictMigrationComplete = true;
  });
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: authorityFixture.configuration,
    }),
    /crossed an authority or acceptance boundary/,
  );
});

test("apply preserves active Flash PID boundary, asset paths/inodes, and root inode", async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  const assetBefore = await lstat(fixture.stagedAssetPath);
  const rootBefore = await lstat(fixture.hostRoot);
  const result = await runHostTreeManifestRebind({
    mode: "apply",
    activeFlashPid: 4242,
    processInspector: fakeProcessInspector,
    configuration: fixture.configuration,
  });
  assert.equal(result.changed, true);
  assert.equal(result.state, "expected");
  assert.equal(result.activeProcess.pid, 4242);
  assert.equal(result.activeProcess.verifiedFlashPlayer, true);
  assert.equal(result.activeProcess.affectsAuthority, false);
  assert.equal(
    sha256(await readFile(fixture.manifestPath)),
    fixture.configuration.expectedManifestSha256,
  );
  const assetAfter = await lstat(fixture.stagedAssetPath);
  const rootAfter = await lstat(fixture.hostRoot);
  assert.equal(assetAfter.dev, assetBefore.dev);
  assert.equal(assetAfter.ino, assetBefore.ino);
  assert.equal(assetAfter.mode & 0o777, 0o444);
  assert.equal(rootAfter.dev, rootBefore.dev);
  assert.equal(rootAfter.ino, rootBefore.ino);
  assert.equal(rootAfter.mode & 0o777, 0o555);

  const checked = await runHostTreeManifestRebind({
    mode: "check",
    activeFlashPid: 4242,
    processInspector: fakeProcessInspector,
    configuration: fixture.configuration,
  });
  assert.equal(checked.state, "expected");
  assert.equal(checked.authorityBoundary.strictCompletionCreated, false);

  const transactionRoot = path.join(
    fixture.projectRoot,
    fixture.configuration.transactionRootRelative,
  );
  const transactionsBefore = await readdir(transactionRoot);
  const repeated = await runHostTreeManifestRebind({
    mode: "apply",
    activeFlashPid: 4242,
    processInspector: fakeProcessInspector,
    configuration: fixture.configuration,
  });
  assert.equal(repeated.idempotent, true);
  assert.equal(repeated.changed, false);
  assert.deepEqual(await readdir(transactionRoot), transactionsBefore);
});

test("second chained CAS validates and preserves the prior immutable receipt", async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  const assetBefore = await lstat(fixture.stagedAssetPath);
  const rootBefore = await lstat(fixture.hostRoot);
  const first = await runHostTreeManifestRebind({
    mode: "apply",
    activeFlashPid: 4242,
    processInspector: fakeProcessInspector,
    configuration: fixture.configuration,
  });
  const firstReceiptPath = path.join(fixture.projectRoot, first.receiptPath);
  const firstReceiptBefore = await readFile(firstReceiptPath);
  const firstReceiptMetadataBefore = await lstat(firstReceiptPath);
  const firstTransactionDirectory = path.dirname(firstReceiptPath);
  const firstTransactionEntriesBefore = await readdir(
    firstTransactionDirectory,
  );

  const second = await configureSecondTransition(fixture);
  const dryRun = await runHostTreeManifestRebind({
    mode: "dry-run",
    activeFlashPid: 4242,
    processInspector: fakeProcessInspector,
    configuration: second.configuration,
  });
  assert.equal(dryRun.state, "historical");
  assert.equal(dryRun.applyRequired, true);
  assert.equal(dryRun.writesPerformed, 0);
  assert.equal(dryRun.transition.sequence, 2);
  assert.equal(dryRun.transition.authorizedTransitionCount, 2);
  assert.equal(dryRun.transitionHistory.priorReceiptsRequired, 1);
  assert.equal(dryRun.transitionHistory.priorReceiptsValidated, 1);
  assert.equal(
    dryRun.transitionHistory.receipts[0].receiptSha256,
    sha256(firstReceiptBefore),
  );

  const applied = await runHostTreeManifestRebind({
    mode: "apply",
    activeFlashPid: 4242,
    processInspector: fakeProcessInspector,
    configuration: second.configuration,
  });
  assert.equal(applied.changed, true);
  assert.equal(applied.state, "expected");
  assert.equal(applied.transition.sequence, 2);
  assert.equal(applied.activeProcess.pid, 4242);
  assert.equal(applied.activeProcess.verifiedFlashPlayer, true);
  assert.equal(applied.authorityBoundary.acceptanceEffect, "none");
  assert.equal(
    sha256(await readFile(fixture.manifestPath)),
    second.secondTransition.expectedManifestSha256,
  );

  const firstReceiptAfter = await readFile(firstReceiptPath);
  const firstReceiptMetadataAfter = await lstat(firstReceiptPath);
  assert.deepEqual(firstReceiptAfter, firstReceiptBefore);
  assert.equal(firstReceiptMetadataAfter.dev, firstReceiptMetadataBefore.dev);
  assert.equal(firstReceiptMetadataAfter.ino, firstReceiptMetadataBefore.ino);
  assert.equal(firstReceiptMetadataAfter.mode & 0o777, 0o444);
  assert.deepEqual(
    await readdir(firstTransactionDirectory),
    firstTransactionEntriesBefore,
  );

  const assetAfter = await lstat(fixture.stagedAssetPath);
  const rootAfter = await lstat(fixture.hostRoot);
  assert.equal(assetAfter.dev, assetBefore.dev);
  assert.equal(assetAfter.ino, assetBefore.ino);
  assert.equal(assetAfter.mode & 0o777, 0o444);
  assert.equal(rootAfter.dev, rootBefore.dev);
  assert.equal(rootAfter.ino, rootBefore.ino);
  assert.equal(rootAfter.mode & 0o777, 0o555);

  const transactionRoot = path.join(
    fixture.projectRoot,
    second.configuration.transactionRootRelative,
  );
  assert.equal((await readdir(transactionRoot)).length, 2);
});

test("second transition fails closed when the prior receipt is not immutable and valid", async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  const first = await runHostTreeManifestRebind({
    mode: "apply",
    configuration: fixture.configuration,
  });
  const second = await configureSecondTransition(fixture);
  const firstReceiptPath = path.join(fixture.projectRoot, first.receiptPath);
  const receipt = JSON.parse(await readFile(firstReceiptPath, "utf8"));
  receipt.operation.ledgerModified = true;
  await chmod(firstReceiptPath, 0o644);
  await writeFile(firstReceiptPath, stableJson(receipt));
  await chmod(firstReceiptPath, 0o444);

  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "dry-run",
      configuration: second.configuration,
    }),
    /receiptFingerprintSha256 is invalid/,
  );
  assert.equal(
    sha256(await readFile(fixture.manifestPath)),
    second.secondTransition.historicalManifestSha256,
  );
});

test("CAS drift after preimage preparation is never overwritten", async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  let driftSha256;
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "apply",
      configuration: fixture.configuration,
      hooks: {
        afterPrepared: async () => {
          const drifted = await rewriteManifest(fixture, (manifest) => {
            manifest.ownership.purpose = "external concurrent drift";
          });
          driftSha256 = sha256(stableJson(drifted));
        },
      },
    }),
    /manifest CAS drifted|manifest byte length drifted|historical staging-manifest hash cannot be reconstructed/,
  );
  assert.equal(sha256(await readFile(fixture.manifestPath)), driftSha256);
});

test("post-write validation failure rolls the manifest back with immutable evidence", async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "apply",
      configuration: fixture.configuration,
      hooks: {
        afterWrite: async () => {
          await chmod(fixture.stagedAssetPath, 0o644);
        },
      },
    }),
    /rollback attempted=true restored=true/,
  );
  assert.equal(
    sha256(await readFile(fixture.manifestPath)),
    fixture.configuration.historicalManifestSha256,
  );
  const transactionRoot = path.join(
    fixture.projectRoot,
    fixture.configuration.transactionRootRelative,
  );
  const transactions = await readdir(transactionRoot);
  assert.equal(transactions.length, 1);
  const transactionDirectory = path.join(transactionRoot, transactions[0]);
  assert.equal((await lstat(transactionDirectory)).mode & 0o777, 0o555);
  assert.equal(
    (await lstat(path.join(transactionDirectory, "rolled-back.json"))).mode &
      0o777,
    0o444,
  );
});

test("concurrent transaction lock fails closed before any manifest change", async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  const lockPath = path.join(
    fixture.projectRoot,
    fixture.configuration.lockRelative,
  );
  await mkdir(lockPath, { recursive: true });
  await assert.rejects(
    runHostTreeManifestRebind({
      mode: "apply",
      configuration: fixture.configuration,
    }),
    /transaction lock already exists/,
  );
  assert.equal(
    sha256(await readFile(fixture.manifestPath)),
    fixture.configuration.historicalManifestSha256,
  );
});
