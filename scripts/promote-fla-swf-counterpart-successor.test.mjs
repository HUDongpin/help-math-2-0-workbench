import assert from "node:assert/strict";
import {
  generateKeyPairSync,
  sign as cryptographicSign,
} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  rename,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertJsonArtifactReadPathStable,
  assertMissingContainedDestination,
  copyWorkingSetToStagedSource,
  createWorkingCopy,
  decideRecoveryAction,
  inspectRegularFileNoFollow,
  inventoryDirectory,
  observeSwapPair,
  portableRelativePath,
  publishImmutableBytesNoClobber,
  publishImmutableJsonNoClobber,
  resolveContainedExistingFile,
  sha256Bytes,
  snapshotDirectoryNode,
  transactionPaths,
  validateExpectedCatalogProfile,
  validateWorkingCopyReceipt,
} from "./lib/fla-swf-counterpart-transaction.mjs";
import {
  DISPOSITION,
  CATALOG_ALLOWED_CHANGED_PATHS,
  CATALOG_OUTPUTS,
  CURRENT_PROFILE_RELATIVE,
  PLAN_RELATIVE,
  PREFIX,
  REVIEW_LEDGER_RELATIVE,
  SCHEMA,
  UNIVERSE_RELATIVE,
  assertPreparedReceiptBundleBindings,
  assertFinalReceiptBundleBindings,
  assertFinalReceiptJournalBindings,
  assertAtomicSwapReceipt,
  assertPreparedBaseUnchanged,
  assertCatalogPathClosure,
  createConfiguration,
  executePromotion,
  ensureTransactionRoot,
  independentReviewPayloadSha256,
  inspectReportingPreconditions,
  loadAndValidateBundle,
  parseArguments,
  receiptPublicationMayHaveCommitted,
  replaceReadmeStatusCompareAndSwap,
  recoverPromotion,
  setParentMutation,
  validateSuccessorBundle,
  verifyIndependentPreparedReviews,
  verifyQuiescenceSnapshots,
} from "./promote-fla-swf-counterpart-successor.mjs";

async function writeImmutableJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  await writeFile(filePath, bytes, { flag: "wx", mode: 0o444 });
  await chmod(filePath, 0o444);
  return { path: filePath, bytes: bytes.length, sha256: sha256Bytes(bytes) };
}

test("JSON artifact read rejects a pathname replaced after the second open", () => {
  const stable = {
    dev: 7n,
    ino: 101n,
    size: 12n,
    mtimeNs: 1234n,
    mode: 0o100444n,
    nlink: 1n,
  };
  const evidence = {
    node: {dev: "7", ino: "101"},
    mode: 0o444,
    nlink: 1,
  };
  assert.equal(assertJsonArtifactReadPathStable({
    evidence,
    before: stable,
    after: stable,
    atPathAfter: stable,
    filePath: "/fixture/review.json",
  }), true);
  assert.throws(() => assertJsonArtifactReadPathStable({
    evidence,
    before: stable,
    after: stable,
    atPathAfter: {...stable, ino: 202n},
    filePath: "/fixture/review.json",
  }), /changed while reading/u);
});

function fixtureUniverse() {
  const records = [];
  for (let index = 0; index < 620; index += 1) {
    const priorDisposition = index < 551
      ? DISPOSITION.ordinary
      : index < 612
        ? DISPOSITION.historical
        : DISPOSITION.alias;
    const currentDisposition = index < 2
      ? DISPOSITION.alias
      : index < 551
        ? DISPOSITION.ordinary
        : index < 612
          ? DISPOSITION.historical
          : DISPOSITION.alias;
    const canonicalPath = `HELP_COURSES/ELMGR5/L1/IN/F${String(index).padStart(3, "0")}.swf`;
    const sha256 = sha256Bytes(Buffer.from(`record-${index}`, "utf8"));
    records.push({
      recordId: `record-${String(index).padStart(3, "0")}`,
      canonicalPath,
      bytes: index + 1,
      sha256,
      priorDisposition,
      priorIntakeDecision: priorDisposition === DISPOSITION.ordinary ? "candidate" : "hold",
      currentDisposition,
      automaticCopyAllowed: false,
      promotionEligibility: currentDisposition === DISPOSITION.ordinary
        ? "pair-review-required"
        : "withheld-pending-manual-review",
      sourceBindingSha256: sha256Bytes(Buffer.from(`binding-${index}`, "utf8")),
      sourceBinding: {
        rootRef: "fixture-root",
        quarantineRelativePath: `verified/F${String(index).padStart(3, "0")}.swf`,
        manifestRelativePath: `verified/F${String(index).padStart(3, "0")}.swf`,
        manifestEntry: {
          path: `verified/F${String(index).padStart(3, "0")}.swf`,
          bytes: index + 1,
          sha256,
        },
      },
    });
  }
  return {
    schemaVersion: SCHEMA.universe,
    artifactType: SCHEMA.universeType,
    sourceRootBindings: {},
    digests: {
      recordSetSha256: "a".repeat(64),
      sourceBoundRecordSetSha256: "b".repeat(64),
    },
    records,
  };
}

function fixtureUnsignedLedger(universe) {
  return {
    schemaVersion: SCHEMA.ledger,
    artifactType: SCHEMA.ledgerType,
    records: universe.records.map((record) => ({
      recordId: record.recordId,
      canonicalPath: record.canonicalPath,
      sourceBindingSha256: record.sourceBindingSha256,
      review: { decision: "unresolved", terminal: false },
      manualHoldReview: {
        required: record.currentDisposition !== DISPOSITION.ordinary,
        decision: record.currentDisposition === DISPOSITION.ordinary ? "not-required" : "pending",
        receipt: null,
      },
    })),
    attestation: {
      state: "unsigned",
      reviewPayloadSha256: null,
      reviewers: [],
      signatureEnvelopes: [],
    },
  };
}

function fixturePlan(universe, ledger) {
  return {
    schemaVersion: SCHEMA.plan,
    artifactType: SCHEMA.planType,
    inputs: {
      universe: { path: UNIVERSE_RELATIVE, bytes: 0, sha256: "0".repeat(64) },
      reviewLedger: { path: REVIEW_LEDGER_RELATIVE, bytes: 0, sha256: "0".repeat(64) },
      trustedReviewerRegistry: {
        path: `catalog/source-promotions/${PREFIX}-trusted-reviewer-registry.json`,
        bytes: 0,
        sha256: "0".repeat(64),
      },
      repositoryBaseline: {
        implementationVerificationReceipt: {
          path: `catalog/source-promotions/${PREFIX}-implementation-baseline.json`,
          bytes: 0,
          sha256: "0".repeat(64),
        },
        implementationVerificationCompletion: {
          path:
            `catalog/source-promotions/${PREFIX}-implementation-baseline-complete.json`,
          bytes: 0,
          sha256: "1".repeat(64),
        },
      },
    },
    approvedCopyRecords: [],
    withheldRecords: universe.records.map(({ recordId }) => ({ recordId })),
    expectedCatalogProfile: {},
    executionContract: {
      nativeAtomicSwapHelper: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
    },
    reportingGate: { canonicalCountsReportable: false },
  };
}

function fixtureTerminalLedger(universe, decision = "contradicted") {
  return {
    schemaVersion: SCHEMA.ledger,
    artifactType: SCHEMA.ledgerType,
    records: universe.records.map((record) => {
      const hold = record.currentDisposition !== DISPOSITION.ordinary;
      return {
        recordId: record.recordId,
        canonicalPath: record.canonicalPath,
        sourceBindingSha256: record.sourceBindingSha256,
        review: {
          decision,
          terminal: true,
          reviewerSubjectId: "reviewer-fixture",
        },
        manualHoldReview: {
          required: hold,
          decision: hold ? "withheld" : "not-required",
          receipt: hold ? {
            path: `evidence/manual-${record.recordId}.json`,
            bytes: 1,
            sha256: "b".repeat(64),
          } : null,
        },
      };
    }),
    attestation: {
      state: "signed-complete",
      reviewPayloadSha256: "a".repeat(64),
      reviewers: [{ subjectId: "reviewer-fixture" }],
      signatureEnvelopes: [{
        reviewerSubjectId: "reviewer-fixture",
        signedPayloadSha256: "a".repeat(64),
        artifact: { path: "evidence/signature.json", bytes: 1, sha256: "c".repeat(64) },
      }],
    },
  };
}

async function attachValidProfile(plan) {
  const profile = JSON.parse(await readFile(
    new URL("../catalog/current-source-profile.json", import.meta.url),
    "utf8",
  ));
  const bytes = Buffer.from(`${JSON.stringify(profile, null, 2)}\n`, "utf8");
  plan.expectedCatalogProfile = profile;
  plan.inputs.expectedCatalogProfile = {
    embeddedAt: "expectedCatalogProfile",
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
  };
  return profile;
}

function fixtureProcessCensus({ unexpected = [] } = {}) {
  const observer = {
    pid: String(process.pid),
    ppid: String(process.ppid),
    command: "node successor-test-observer",
    cwd: null,
    relevance: ["command-references-successor-script"],
    observerRelationship: "observer",
  };
  return {
    tools: {
      ps: "/bin/ps -axo pid=,ppid=,command=",
      lsofCwd: "/usr/sbin/lsof -n -P -a -d cwd -F pRcn",
    },
    observerProcesses: { count: 1, records: [observer] },
    unexpectedRelevantProcesses: { count: unexpected.length, records: unexpected },
  };
}

const fixtureProcessScanner = async () => fixtureProcessCensus();
const fixtureSnapshotBirthtime = async (_filePath, _evidence, index) => String(
  1_000_000_000_000n + BigInt(index) * 61_000_000_000n,
);

const FIXTURE_NATIVE_BUILD_CONTRACT = Object.freeze({
  schemaVersion:
    "help-math-darwin-atomic-directory-swap-native-build-contract/v1",
  source: Object.freeze({
    path: "scripts/lib/darwin-atomic-directory-swap-native.c",
    bytes: 1,
    sha256: "f".repeat(64),
  }),
  compiler: Object.freeze({
    path: "/fixture/toolchain/usr/bin/clang",
    version: "Fixture clang version 1.0\nTarget: arm64-apple-darwin",
    sdkPath: "/fixture/toolchain/SDKs/MacOSX.sdk",
  }),
  compile: Object.freeze({
    driver: "/usr/bin/xcrun",
    sdk: "macosx",
    arguments: Object.freeze(["-std=c17", "-O2", "-Wall", "-Wextra", "-Werror"]),
    executableSha256Policy:
      "prepared-witness-and-identical-across-source-catalog-rollback-and-readme-swaps",
  }),
});

function fixtureNativeBuildReceipt(contract = FIXTURE_NATIVE_BUILD_CONTRACT) {
  return {
    schemaVersion: "help-math-darwin-atomic-directory-swap-native-build/v1",
    source: structuredClone(contract.source),
    compiler: structuredClone(contract.compiler),
    compile: {
      driver: contract.compile.driver,
      sdk: contract.compile.sdk,
      arguments: [...contract.compile.arguments],
    },
    executable: {bytes: 1, sha256: "e".repeat(64)},
  };
}

function fixtureNativeBuildIdentity(receipt = fixtureNativeBuildReceipt()) {
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return {
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    executableBytes: receipt.executable.bytes,
    executableSha256: receipt.executable.sha256,
  };
}

function fixtureNativeBuildContract(sourceSha256 = "f".repeat(64)) {
  const contract = structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT);
  contract.source.sha256 = sourceSha256;
  return contract;
}

function fixtureSwapReceipt({
  allowedParent,
  firstDirectory,
  secondDirectory,
  firstNode,
  secondNode,
} = {}) {
  return {
    status: "swapped-and-parent-fsynced",
    allowedParent,
    firstDirectory,
    secondDirectory,
    before: { first: firstNode, second: secondNode },
    after: { first: secondNode, second: firstNode },
    native: { status: "swapped", parentFsynced: true },
    nativeSourceSha256: "f".repeat(64),
    nativeBuild: fixtureNativeBuildReceipt(),
    cleanupWarning: null,
  };
}

function fixtureRecordIdentityClosureSha256(records) {
  return sha256Bytes(Buffer.from([...records]
    .sort((left, right) => left.canonicalPath < right.canonicalPath
      ? -1
      : left.canonicalPath > right.canonicalPath ? 1 : 0)
    .map((record) => [
      record.recordId,
      record.canonicalPath,
      record.bytes,
      record.sha256,
      record.sourceBindingSha256,
      record.currentDisposition,
    ].join("\t") + "\n")
    .join(""), "utf8"));
}

async function fixtureAtomicFileExchange({
  allowedParent,
  firstFile,
  secondFile,
  expectedFirstNode,
  expectedSecondNode,
  expectedNativeSourceSha256,
  expectedNativeBuildContract,
}) {
  const firstBefore = await inspectRegularFileNoFollow(firstFile, {
    requireSingleLink: true,
  });
  const secondBefore = await inspectRegularFileNoFollow(secondFile, {
    requireSingleLink: true,
  });
  assert.deepEqual(firstBefore.node, expectedFirstNode);
  assert.deepEqual(secondBefore.node, expectedSecondNode);
  const temporary = path.join(
    allowedParent,
    `.fixture-recovery-readme-exchange-${process.pid}-${Date.now()}`,
  );
  await rename(firstFile, temporary);
  await rename(secondFile, firstFile);
  await rename(temporary, secondFile);
  const firstAfter = await inspectRegularFileNoFollow(firstFile, {
    requireSingleLink: true,
  });
  const secondAfter = await inspectRegularFileNoFollow(secondFile, {
    requireSingleLink: true,
  });
  return {
    status: "swapped-and-parent-fsynced",
    allowedParent,
    firstFile,
    secondFile,
    before: {first: firstBefore.node, second: secondBefore.node},
    after: {first: firstAfter.node, second: secondAfter.node},
    native: {status: "swapped", parentFsynced: true},
    nativeSourceSha256: expectedNativeSourceSha256,
    nativeBuild: fixtureNativeBuildReceipt(expectedNativeBuildContract),
    cleanupWarning: null,
  };
}

async function receiptPresentRecoveryFixture(root, {
  initialPhase = "receipt-published",
} = {}) {
  const configuration = createConfiguration({
    projectRoot: root,
    transactionRoot: path.join(root, "transactions"),
  });
  const transactionId = "20260808T112233444Z-abcabcabcabc";
  const paths = transactionPaths(configuration, transactionId);
  const preparedRelativePath =
    `source-promotions/${PREFIX}-prepared-${transactionId}.json`;
  const appliedRelativePath = `source-promotions/${PREFIX}-applied.json`;
  const nativeSwapSourceSha256 = "f".repeat(64);
  const catalogFixturePaths = [
    ...CATALOG_OUTPUTS,
    "current-source-profile.json",
    "source-manifest.sha256",
    "source-freeze.json",
  ];
  const catalogContents = new Map();
  for (const relativePath of catalogFixturePaths) {
    catalogContents.set(relativePath, await readFile(
      new URL(`../catalog/${relativePath}`, import.meta.url),
    ));
  }
  const profile = JSON.parse(
    catalogContents.get("current-source-profile.json").toString("utf8"),
  );
  const summary = JSON.parse(catalogContents.get("summary.json").toString("utf8"));
  const universe = fixtureUniverse();
  const reviewLedger = fixtureTerminalLedger(universe, "contradicted");
  const inputArtifacts = {
    universe: {path: UNIVERSE_RELATIVE, bytes: 1, sha256: "1".repeat(64)},
    reviewLedger: {path: REVIEW_LEDGER_RELATIVE, bytes: 1, sha256: "2".repeat(64)},
    trustedReviewerRegistry: {
      path: `catalog/source-promotions/${PREFIX}-trusted-reviewer-registry.json`,
      bytes: 1,
      sha256: "3".repeat(64),
    },
    implementationVerificationReceipt: {
      path: `catalog/source-promotions/${PREFIX}-implementation-baseline.json`,
      bytes: 1,
      sha256: "d".repeat(64),
    },
    implementationVerificationCompletion: {
      path:
        `catalog/source-promotions/${PREFIX}-implementation-baseline-complete.json`,
      bytes: 1,
      sha256: "e".repeat(64),
    },
    quiescenceFirstSnapshotState: {
      path: `work/fla-swf-counterpart-successor-review/${PREFIX}-quiescence-first-snapshot-state.json`,
      bytes: 1,
      sha256: "4".repeat(64),
    },
    provisionalPostStateObservation: {
      path: `work/fla-swf-counterpart-successor-review/${PREFIX}-provisional-post-state.json`,
      bytes: 1,
      sha256: "5".repeat(64),
    },
    quiescenceSnapshots: [{
      path: "evidence/quiescence-1.json",
      bytes: 1,
      sha256: "6".repeat(64),
    }, {
      path: "evidence/quiescence-2.json",
      bytes: 1,
      sha256: "7".repeat(64),
    }],
    expectedCatalogProfile: {
      embeddedAt: "expectedCatalogProfile",
      bytes: catalogContents.get("current-source-profile.json").length,
      sha256: sha256Bytes(catalogContents.get("current-source-profile.json")),
    },
  };
  const artifactReference = (relativePath) => {
    const contents = catalogContents.get(relativePath);
    return {
      path: relativePath,
      bytes: contents.length,
      sha256: sha256Bytes(contents),
    };
  };
  const catalogArtifacts = {
    outputs: CATALOG_OUTPUTS.map(artifactReference),
    currentSourceProfile: artifactReference("current-source-profile.json"),
    sourceManifest: artifactReference("source-manifest.sha256"),
    sourceFreeze: artifactReference("source-freeze.json"),
  };
  const evidenceBoundary = {
    acceptanceEffects: {
      javascriptImplementation: false,
      originalRuntimeFidelity: false,
      audioAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictCompletion: false,
      lessonRelease: false,
      publication: false,
    },
  };
  const freeze = {
    fileCount: profile.expected.files,
    totalBytes: profile.expected.totalBytes,
    manifestSha256: catalogArtifacts.sourceManifest.sha256,
    readOnlyEnforced: true,
    writableEntriesAfterFreeze: 0,
  };
  const plan = {
    schemaVersion: SCHEMA.plan,
    artifactType: SCHEMA.planType,
    inputs: {
      ...inputArtifacts,
      repositoryBaseline: {
        source: {
          fileCount: freeze.fileCount,
          totalBytes: freeze.totalBytes,
          manifestSha256: freeze.manifestSha256,
        },
        currentSourceProfile: {
          path: CURRENT_PROFILE_RELATIVE,
          bytes: inputArtifacts.expectedCatalogProfile.bytes,
          sha256: inputArtifacts.expectedCatalogProfile.sha256,
        },
        implementationVerificationReceipt:
          inputArtifacts.implementationVerificationReceipt,
        implementationVerificationCompletion:
          inputArtifacts.implementationVerificationCompletion,
      },
    },
    expectedCatalogProfile: profile,
    expectedPostState: {
      source: {...freeze},
      catalogArtifacts,
    },
    evidenceBoundary,
    reportingGate: {canonicalCountsReportable: false},
    executionContract: {
      nativeAtomicSwapHelper: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
    },
  };

  const installCatalogBase = async (catalogRoot) => {
    await mkdir(catalogRoot, {recursive: true});
    for (const [relativePath, contents] of catalogContents) {
      const destination = path.join(catalogRoot, relativePath);
      await mkdir(path.dirname(destination), {recursive: true});
      await writeFile(destination, contents, {flag: "wx", mode: 0o444});
      await chmod(destination, 0o444);
    }
    return writeImmutableJson(
      path.join(
        catalogRoot,
        path.relative(configuration.catalogRoot, configuration.planPath),
      ),
      plan,
    );
  };

  await mkdir(configuration.sourceRoot, {recursive: true});
  await mkdir(paths.sourceRecovery, {recursive: true});
  const livePlanArtifact = await installCatalogBase(configuration.catalogRoot);
  const recoveryPlanArtifact = await installCatalogBase(paths.catalogRecovery);
  assert.equal(livePlanArtifact.sha256, recoveryPlanArtifact.sha256);
  const baseCatalogInventory = await inventoryDirectory(paths.catalogRecovery);
  const sourceLive = await snapshotDirectoryNode(
    configuration.sourceRoot,
    "receipt-present fixture live source",
  );
  const sourceRecovery = await snapshotDirectoryNode(
    paths.sourceRecovery,
    "receipt-present fixture recovery source",
  );
  const catalogLive = await snapshotDirectoryNode(
    configuration.catalogRoot,
    "receipt-present fixture live catalog",
  );
  const catalogRecovery = await snapshotDirectoryNode(
    paths.catalogRecovery,
    "receipt-present fixture recovery catalog",
  );
  const directoryNodesBeforeSwap = {
    source: {live: sourceRecovery.node, staged: sourceLive.node},
    catalog: {live: catalogRecovery.node, staged: catalogLive.node},
  };
  const swaps = {
    source: fixtureSwapReceipt({
      allowedParent: paths.sourceParent,
      firstDirectory: configuration.sourceRoot,
      secondDirectory: paths.sourceRecovery,
      firstNode: directoryNodesBeforeSwap.source.live,
      secondNode: directoryNodesBeforeSwap.source.staged,
    }),
    catalog: fixtureSwapReceipt({
      allowedParent: paths.catalogParent,
      firstDirectory: configuration.catalogRoot,
      secondDirectory: paths.catalogRecovery,
      firstNode: directoryNodesBeforeSwap.catalog.live,
      secondNode: directoryNodesBeforeSwap.catalog.staged,
    }),
  };

  const outputEvidence = {};
  for (const relativePath of CATALOG_OUTPUTS) {
    outputEvidence[relativePath] = await inspectRegularFileNoFollow(
      path.join(configuration.catalogRoot, relativePath),
      {requireSingleLink: true},
    );
  }
  const currentProfileEvidence = await inspectRegularFileNoFollow(
    configuration.currentProfilePath,
    {requireSingleLink: true},
  );
  const sourceManifestEvidence = await inspectRegularFileNoFollow(
    path.join(configuration.catalogRoot, "source-manifest.sha256"),
    {requireSingleLink: true},
  );
  const sourceFreezeEvidence = await inspectRegularFileNoFollow(
    path.join(configuration.catalogRoot, "source-freeze.json"),
    {requireSingleLink: true},
  );
  const expectedPostcheck = {
    freeze,
    catalog: {observed: structuredClone(profile.expected), summary, check: true},
    profileEvidence: currentProfileEvidence,
    promoted: [],
    withheld: {checked: 620, unexpectedlyPresent: 0},
    catalogEvidenceClosure: {
      outputCount: 17,
      outputs: outputEvidence,
      sourceManifest: sourceManifestEvidence,
      sourceFreeze: sourceFreezeEvidence,
      currentSourceProfile: currentProfileEvidence,
      sourceFilesArtifact: outputEvidence["source-files.json"],
      checksumSet: outputEvidence["source-files.sha256"],
      independentPairing: {
        pairedSwfFla: profile.expected.pairedSwfFla,
        swfOnly: profile.expected.swfOnly,
        flaOnly: profile.expected.flaOnly,
      },
      boundArtifacts: catalogArtifacts,
    },
  };
  const exactUniverse = {
    records: 620,
    priorDisposition: {ordinary: 551, historicalCustodyHold: 61, placementAliasHold: 8},
    currentDisposition: {ordinary: 549, historicalCustodyHold: 61, placementAliasHold: 10},
    currentHolds: 71,
    automaticApprovals: 0,
  };
  const exactPromotion = {
    approvedCopyRecords: 0,
    withheldRecords: 620,
    copyBytes: 0,
    recordSetSha256: sha256Bytes(Buffer.alloc(0)),
    workingCopyReceiptSha256: "8".repeat(64),
    approvedClosureSha256: fixtureRecordIdentityClosureSha256([]),
    withheldClosureSha256: fixtureRecordIdentityClosureSha256(universe.records),
  };
  const nativeSwapBuildWitness = fixtureNativeBuildReceipt();
  const nativeSwapBuildWitnessIdentity = fixtureNativeBuildIdentity(
    nativeSwapBuildWitness,
  );
  const preparedAt = "2026-08-08T11:22:33.444Z";
  const prepared = {
    schemaVersion: SCHEMA.receipt,
    artifactType: SCHEMA.receiptType,
    lifecycle: "prepared",
    applied: false,
    preparedAt,
    transactionId,
    claim: "source-promotion-only",
    plan: {
      path: PLAN_RELATIVE,
      bytes: livePlanArtifact.bytes,
      sha256: livePlanArtifact.sha256,
    },
    inputArtifacts,
    nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
    nativeSwapBuildWitness,
    nativeSwapBuildWitnessIdentity,
    exactUniverse,
    exactPromotion,
    expectedCatalogProfile: {
      path: "current-source-profile.json",
      bytes: currentProfileEvidence.bytes,
      sha256: currentProfileEvidence.sha256,
      status: "staged-observed-not-canonical-until-live-postcheck",
    },
    expectedCatalogArtifacts: catalogArtifacts,
    observedCatalogArtifacts: catalogArtifacts,
    stagedVerification: expectedPostcheck,
    catalogPathClosure: {
      baseInventory: baseCatalogInventory,
      allowedChangedPaths: [...CATALOG_ALLOWED_CHANGED_PATHS],
      preparedReceipt: {
        path: preparedRelativePath,
        identityBinding: "physical immutable artifact plus transaction journal",
      },
      appliedReceipt: null,
      exactPathSetRequired: true,
    },
    evidenceBoundary,
    reportingGate: {
      canonicalCountsReportable: false,
      observedCanonical: false,
      publicationAllowed: false,
      publicationScope: "canonical-source-inventory-counts-only",
      reason: "fixture prepared receipt precedes reporting reconciliation",
    },
    swaps: {source: "pending", catalog: "pending"},
    postchecks: null,
    retainedRecoveryRoots: null,
  };
  const preparedEvidence = await writeImmutableJson(
    path.join(configuration.catalogRoot, preparedRelativePath),
    prepared,
  );

  const readmeText = [
    "# Receipt-present recovery fixture",
    "",
    "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_BEGIN -->",
    "Pending fixture status.",
    "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_END -->",
    "",
  ].join("\n");
  await writeFile(path.join(root, "README.md"), readmeText, {flag: "wx", mode: 0o644});
  await chmod(path.join(root, "README.md"), 0o644);
  const readmeBase = await inspectRegularFileNoFollow(
    path.join(root, "README.md"),
    {requireSingleLink: true},
  );
  const baseBackupRelativePath =
    `.README.md.fla-swf-counterpart-successor-base-backup-${transactionId}`;
  const baseBackupPath = path.join(root, baseBackupRelativePath);
  await writeFile(baseBackupPath, Buffer.from(readmeText, "utf8"), {
    flag: "wx",
    mode: 0o444,
  });
  await chmod(baseBackupPath, 0o444);
  const baseBackup = await inspectRegularFileNoFollow(baseBackupPath, {
    requireSingleLink: true,
    requireReadOnly: true,
  });
  assert.notDeepEqual(baseBackup.node, readmeBase.node);
  const readmeBinding = {
    bytes: readmeBase.bytes,
    sha256: readmeBase.sha256,
    mode: readmeBase.mode,
    node: readmeBase.node,
  };
  const reportingPreimage = {
    liveReadme: {path: "README.md", ...readmeBinding},
    retainedBaseBackup: {
      path: baseBackupRelativePath,
      bytes: baseBackup.bytes,
      sha256: baseBackup.sha256,
      mode: baseBackup.mode,
      nlink: baseBackup.nlink,
      node: baseBackup.node,
      distinctFromExpectedBaseInode: true,
      retentionPolicy:
        "retained; this executor never deletes the transaction-bound README base backup",
    },
    exchangeSemantics:
      "pathname exchange after an independently retained base preimage; an indeterminate final race is forward-only manual reconciliation, not a kernel inode CAS",
  };
  const independentReviews = [{
    name: "schema-review.json",
    role: "schema-reviewer",
    reviewerSubjectId: "fixture-schema-reviewer",
    reviewerFullName: "Fixture Schema Reviewer",
    publicKeySpkiSha256: "9".repeat(64),
    reviewedAt: "2026-08-08T11:23:00.000Z",
    bytes: 1,
    sha256: "a".repeat(64),
    signedPayloadSha256: "b".repeat(64),
    signatureSha256: "c".repeat(64),
    findings: {P0: 0, P1: 0, P2: 0},
  }, {
    name: "transaction-review.json",
    role: "transaction-adversarial-reviewer",
    reviewerSubjectId: "fixture-transaction-reviewer",
    reviewerFullName: "Fixture Transaction Reviewer",
    publicKeySpkiSha256: "d".repeat(64),
    reviewedAt: "2026-08-08T11:24:00.000Z",
    bytes: 1,
    sha256: "e".repeat(64),
    signedPayloadSha256: "f".repeat(64),
    signatureSha256: "0".repeat(64),
    findings: {P0: 0, P1: 0, P2: 0},
  }];
  const finalReceipt = {
    schemaVersion: SCHEMA.receipt,
    artifactType: SCHEMA.receiptType,
    lifecycle: "final",
    applied: true,
    preparedAt,
    transactionId,
    claim: "source-promotion-only",
    plan: prepared.plan,
    inputArtifacts,
    exactUniverse,
    exactPromotion,
    expectedCatalogProfile: prepared.expectedCatalogProfile,
    expectedCatalogArtifacts: catalogArtifacts,
    observedCatalogArtifacts: catalogArtifacts,
    stagedVerification: expectedPostcheck,
    catalogPathClosure: {
      baseInventory: baseCatalogInventory,
      allowedChangedPaths: [...CATALOG_ALLOWED_CHANGED_PATHS],
      preparedReceipt: {
        path: preparedRelativePath,
        bytes: preparedEvidence.bytes,
        sha256: preparedEvidence.sha256,
      },
      appliedReceipt: {
        path: appliedRelativePath,
        identityBinding: "physical immutable artifact plus committed transaction journal",
      },
      exactPathSetRequired: true,
    },
    evidenceBoundary,
    reportingGate: {
      canonicalCountsReportable: true,
      observedCanonical: true,
      publicationAllowed: true,
      publicationScope: "canonical-source-inventory-counts-only",
      source: "live rebuilt catalog after freeze/profile/check closure",
      observedPairing: structuredClone(profile.expected),
    },
    reportingPreimage,
    swaps,
    postchecks: {live: expectedPostcheck},
    retainedRecoveryRoots: {
      source: paths.sourceRecovery,
      catalog: paths.catalogRecovery,
      deletionPolicy: "retained; this executor never deletes pre-promotion roots",
    },
    completedAt: "2026-08-08T11:25:00.000Z",
    independentPreparedReviews: independentReviews,
    nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
    nativeSwapBuildWitness,
    nativeSwapBuildWitnessIdentity,
  };
  const receiptEvidence = await writeImmutableJson(
    configuration.receiptPath,
    finalReceipt,
  );
  await mkdir(path.join(root, "reports"), {recursive: true});
  await mkdir(configuration.activeRoot, {recursive: true});
  const journal = {
    schemaVersion: SCHEMA.transaction,
    artifactType: SCHEMA.transactionType,
    transactionId,
    phase: initialPhase,
    plan: prepared.plan,
    paths: {
      projectRoot: configuration.projectRoot,
      sourceLive: configuration.sourceRoot,
      catalogLive: configuration.catalogRoot,
      receipt: configuration.receiptPath,
      ...paths,
    },
    base: {
      freeze,
      catalogTreeSha256: baseCatalogInventory.treeSha256,
      currentProfileSha256: currentProfileEvidence.sha256,
      readme: readmeBinding,
      implementationVerificationCompletion:
        inputArtifacts.implementationVerificationCompletion,
      nativeSwapSourceSha256,
      nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
      sourceRootNode: directoryNodesBeforeSwap.source.live,
      catalogRootNode: directoryNodesBeforeSwap.catalog.live,
    },
    parentModes: [],
    directoryNodesBeforeSwap,
    receiptDraft: {bytes: receiptEvidence.bytes, sha256: receiptEvidence.sha256},
    receiptCommitPointPresent: true,
    finalReceipt: receiptEvidence,
    nativeSwapBuildWitness,
    nativeSwapBuildWitnessIdentity,
    workingCopy: {receiptSha256: exactPromotion.workingCopyReceiptSha256},
    staged: {
      copied: {recordSetSha256: exactPromotion.recordSetSha256},
      preparedRelativePath,
      preparedBytes: preparedEvidence.bytes,
      preparedSha256: preparedEvidence.sha256,
      postcheck: expectedPostcheck,
      catalogPathClosure: {baseInventory: baseCatalogInventory},
      reviewBindings: {
        approvedClosureSha256: exactPromotion.approvedClosureSha256,
        withheldClosureSha256: exactPromotion.withheldClosureSha256,
        trustedReviewerRegistrySha256:
          inputArtifacts.trustedReviewerRegistry.sha256,
      },
    },
    independentReviews,
    swapReceipts: swaps,
    livePostcheck: expectedPostcheck,
    reportingPreimage,
  };
  await writeImmutableJson(paths.journalPath, journal);
  const bundle = {
    universe,
    reviewLedger,
    plan,
    planEvidence: livePlanArtifact,
    profile: {
      reference: inputArtifacts.expectedCatalogProfile,
      contents: catalogContents.get("current-source-profile.json"),
    },
    validated: {
      approved: [],
      withheld: universe.records,
      byId: new Map(universe.records.map((record) => [record.recordId, record])),
      expectedQuiescenceAllowlist: [{
        path: "project/scripts/lib/darwin-atomic-directory-swap-native.c",
        bytes: FIXTURE_NATIVE_BUILD_CONTRACT.source.bytes,
        sha256: nativeSwapSourceSha256,
      }],
    },
  };
  return {
    configuration,
    transactionId,
    paths,
    bundle,
    receiptEvidence,
    readmeBase,
    dependencies: {
      verifyFreeze: async () => freeze,
      buildCatalog: async () => ({summary}),
      atomicFileSwap: fixtureAtomicFileExchange,
    },
  };
}

async function quiescenceFixture(root, {
  separationMs = 61_000,
  openWriteHandles = 0,
  unexpectedRelevantProcesses = [],
  secondRecordPatch = null,
} = {}) {
  const targetPath = path.join(root, "scope/target.swf");
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, "quiescent bytes");
  const evidence = await inspectRegularFileNoFollow(targetPath);
  const record = {
    path: "project/scope/target.swf",
    bytes: evidence.bytes,
    sha256: evidence.sha256,
    dev: evidence.node.dev,
    ino: evidence.node.ino,
    mode: evidence.mode,
    mtimeNs: evidence.mtimeNs,
  };
  const secondAt = Date.now() - 1_000;
  const values = [secondAt - separationMs, secondAt].map((capturedAt) => ({
    schemaVersion: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot/v1",
    artifactType: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot",
    capturedAt: new Date(capturedAt).toISOString(),
    scope: {
      recordSetSha256: "a".repeat(64),
      sourceBoundRecordSetSha256: "b".repeat(64),
      records: 1,
      identitySha256: sha256Bytes(Buffer.from(
        `${record.path}\t${record.bytes}\t${record.sha256}\n`,
      )),
    },
    allowlist: [record],
    openWriteHandles: {
      count: openWriteHandles,
      records: openWriteHandles ? [{ path: record.path }] : [],
    },
    processCensus: fixtureProcessCensus({ unexpected: unexpectedRelevantProcesses }),
  }));
  if (secondRecordPatch) {
    values[1].allowlist[0] = { ...values[1].allowlist[0], ...secondRecordPatch };
  }
  const references = [];
  for (const [index, value] of values.entries()) {
    const artifact = await writeImmutableJson(
      path.join(root, `evidence/quiescence-${index + 1}.json`),
      value,
    );
    references.push({
      path: path.relative(root, artifact.path).split(path.sep).join("/"),
      bytes: artifact.bytes,
      sha256: artifact.sha256,
    });
  }
  return {
    configuration: createConfiguration({ projectRoot: root }),
    plan: {
      inputs: {
        quiescenceSnapshots: references,
        quiescenceScope: {
          records: 1,
          identitySha256: sha256Bytes(Buffer.from(
            `${record.path}\t${record.bytes}\t${record.sha256}\n`,
          )),
          algorithm: "sha256(sorted path<TAB>bytes<TAB>sha256<LF>); exact paths include all canonical source files, all 620 private candidate files, pinned catalog inputs, README, universe, trusted reviewer registry, signed review ledger, and direct review evidence",
          selfReferentialExclusions: [
            {
              artifact: PLAN_RELATIVE,
              reason: "the plan hash cannot be included in snapshots that are themselves inputs to that plan",
            },
            {
              artifact: "two-quiescence-snapshot-receipts",
              reason: "each snapshot is directly bound by immutable path/bytes/SHA-256 in plan.inputs.quiescenceSnapshots",
            },
            {
              artifact: `work/fla-swf-counterpart-successor-review/${PREFIX}-quiescence-first-snapshot-state.json`,
              reason: "created after the first snapshot; directly bound by immutable path/bytes/SHA-256 and enforces the producer-owned physical not-before",
            },
          ],
        },
      },
    },
    targetPath,
    record,
  };
}

async function preparedReviewFixture(root, {
  roles = ["schema-reviewer", "transaction-adversarial-reviewer"],
  findings = [{ P0: 0, P1: 0, P2: 0 }, { P0: 0, P1: 0, P2: 0 }],
  mutateReview = null,
} = {}) {
  const configuration = createConfiguration({
    projectRoot: root,
    transactionRoot: path.join(root, "transactions"),
  });
  await mkdir(configuration.activeRoot, { recursive: true });
  const catalogRecovery = path.join(root, "staged-catalog");
  const preparedRelativePath = "source-promotions/prepared.json";
  const preparedAt = "2026-08-08T00:00:00.000Z";
  const reviewOpenedAt = "2026-08-08T00:01:00.000Z";
  const reviewedAt = "2026-08-08T00:02:00.000Z";
  const nativeSwapBuildWitness = fixtureNativeBuildReceipt();
  const nativeSwapBuildWitnessIdentity = fixtureNativeBuildIdentity(
    nativeSwapBuildWitness,
  );
  const preparedArtifact = await writeImmutableJson(
    path.join(catalogRecovery, preparedRelativePath),
    {
      lifecycle: "prepared",
      applied: false,
      preparedAt,
      nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
      nativeSwapBuildWitness,
      nativeSwapBuildWitnessIdentity,
    },
  );
  const stagedCatalogInventory = await inventoryDirectory(catalogRecovery);
  const transactionId = "20260808T000000000Z-aaaaaaaaaaaa";
  const planSha256 = "1".repeat(64);
  const trustedReviewerRegistrySha256 = "0".repeat(64);
  const workingCopyReceiptSha256 = "2".repeat(64);
  const bindings = {
    transactionId,
    planSha256,
    trustedReviewerRegistrySha256,
    preparedReceiptSha256: preparedArtifact.sha256,
    stagedManifestSha256: "3".repeat(64),
    stagedProfileSha256: "4".repeat(64),
    stagedCatalogTreeSha256: stagedCatalogInventory.treeSha256,
    stagedSourceRootNode: { dev: "7", ino: "8" },
    stagedCatalogRootNode: { dev: "7", ino: "9" },
    workingCopyReceiptSha256,
    approvedClosureSha256: "5".repeat(64),
    withheldClosureSha256: "6".repeat(64),
    nativeSwapBuildWitnessSha256: nativeSwapBuildWitnessIdentity.sha256,
    nativeSwapExecutableBytes: nativeSwapBuildWitness.executable.bytes,
    nativeSwapExecutableSha256: nativeSwapBuildWitness.executable.sha256,
    journalPhase: "awaiting-independent-review",
  };
  const transaction = {
    paths: { catalogRecovery },
    journal: {
      transactionId,
      phase: "awaiting-independent-review",
      independentReview: { openedAt: reviewOpenedAt },
      nativeSwapBuildWitness,
      nativeSwapBuildWitnessIdentity,
      workingCopy: { receiptSha256: workingCopyReceiptSha256 },
      staged: {
        preparedRelativePath,
        preparedSha256: preparedArtifact.sha256,
        profile: { sha256: bindings.stagedProfileSha256 },
        postcheck: { freeze: { manifestSha256: bindings.stagedManifestSha256 } },
        stagedCatalogInventory,
        reviewBindings: bindings,
      },
    },
  };
  const reviewRoot = path.join(configuration.activeRoot, "independent-reviews");
  await mkdir(reviewRoot);
  const authorizedReviewers = [];
  for (const [index, role] of roles.entries()) {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const publicKeyDer = publicKey.export({ format: "der", type: "spki" });
    const publicKeySpkiSha256 = sha256Bytes(publicKeyDer);
    const value = {
      schemaVersion: "help-math-fla-swf-counterpart-prepared-independent-review/v1",
      artifactType: "help-math-fla-swf-counterpart-prepared-independent-review",
      role,
      reviewer: {
        subjectId: `reviewer-${index + 1}`,
        fullName: `Fixture Reviewer ${index + 1}`,
        role,
        publicKeySpkiSha256,
      },
      reviewedAt,
      decision: "FINAL_GO",
      findings: findings[index] ?? { P0: 0, P1: 0, P2: 0 },
      bindings,
    };
    value.signedPayloadSha256 = independentReviewPayloadSha256(value);
    const signature = cryptographicSign(
      null,
      Buffer.from(value.signedPayloadSha256, "utf8"),
      privateKey,
    );
    value.signatureEnvelope = {
      algorithm: "Ed25519",
      reviewerSubjectId: value.reviewer.subjectId,
      publicKeySpkiSha256,
      publicKeySpkiDerBase64: publicKeyDer.toString("base64"),
      signedPayloadSha256: value.signedPayloadSha256,
      signedAt: reviewedAt,
      signatureBase64: signature.toString("base64"),
    };
    if (mutateReview) mutateReview(value, index);
    authorizedReviewers.push({
      subjectId: `reviewer-${index + 1}`,
      fullName: `Fixture Reviewer ${index + 1}`,
      allowedRoles: [role],
      publicKeySpkiSha256,
    });
    await writeImmutableJson(path.join(reviewRoot, `review-${index + 1}.json`), value);
  }
  const trustedReviewerRegistry = {
    identity: {
      path: `catalog/source-promotions/${PREFIX}-trusted-reviewer-registry.json`,
      bytes: 123,
      sha256: trustedReviewerRegistrySha256,
    },
    bySubjectId: new Map(authorizedReviewers.map((reviewer) => [
      reviewer.subjectId,
      reviewer,
    ])),
  };
  return {
    configuration,
    transaction,
    preflightEvidence: {
      bundle: {
        planEvidence: { sha256: planSha256 },
        plan: {
          inputs: {
            trustedReviewerRegistry: trustedReviewerRegistry.identity,
          },
        },
        validated: { trustedReviewerRegistry },
      },
    },
  };
}

test("CLI exposes only explicit preflight, apply, and recover modes", () => {
  assert.equal(PREFIX, "fla-swf-counterpart-successor-2026-08-07-v2");
  assert.match(UNIVERSE_RELATIVE, /-v2-universe\.json$/);
  assert.deepEqual(parseArguments(["--preflight"]), { mode: "preflight" });
  assert.deepEqual(parseArguments(["--apply"]), { mode: "apply" });
  assert.deepEqual(parseArguments(["--recover"]), { mode: "recover" });
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments([]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--apply", "--recover"]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--dry-run"]), /Unknown argument/);
  assert.throws(() => parseArguments(["--apply", "--allow-unsigned"]), /Unknown argument/);
  assert.throws(() => parseArguments(["--apply", "--project-root", "/tmp/fixture"]),
    /Unknown argument/);
  assert.throws(() => parseArguments(["--apply", "--transaction-root", "/tmp/fixture"]),
    /Unknown argument/);
});

test("transaction root validates symlink ancestry and disjointness before mkdir", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-root-safety-"));
  try {
    const projectRoot = path.join(temporaryRoot, "project");
    const outsideRoot = path.join(temporaryRoot, "outside");
    await mkdir(projectRoot);
    await mkdir(outsideRoot);
    await symlink(outsideRoot, path.join(projectRoot, "alias"));
    const unsafe = createConfiguration({
      projectRoot,
      transactionRoot: path.join(projectRoot, "alias/new-transaction-root"),
    });
    await assert.rejects(
      ensureTransactionRoot(unsafe),
      /traverses a symbolic link|resolves through a symbolic link/,
    );
    await assert.rejects(
      lstat(path.join(outsideRoot, "new-transaction-root")),
      /ENOENT/,
    );

    const overlapping = createConfiguration({
      projectRoot,
      transactionRoot: path.join(projectRoot, "catalog/transactions"),
    });
    await assert.rejects(
      ensureTransactionRoot(overlapping),
      /disjoint from live source and catalog roots/,
    );
    await assert.rejects(lstat(overlapping.transactionRoot), /ENOENT/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("transaction parent mutation refuses to overwrite ambient mode drift", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-parent-mode-"),
  ));
  try {
    await chmod(temporaryRoot, 0o500);
    const initial = await lstat(temporaryRoot, {bigint: true});
    const snapshot = {
      path: temporaryRoot,
      node: {dev: String(initial.dev), ino: String(initial.ino)},
      mode: Number(initial.mode & 0o7777n),
    };
    await setParentMutation([snapshot], true);
    assert.equal(Number((await lstat(temporaryRoot, {bigint: true})).mode & 0o7777n), 0o700);
    await chmod(temporaryRoot, 0o755);
    await assert.rejects(
      setParentMutation([snapshot], false),
      /parent mode drifted before restoring mutation boundary/u,
    );
    assert.equal(Number((await lstat(temporaryRoot, {bigint: true})).mode & 0o7777n), 0o755);
    await chmod(temporaryRoot, 0o700);
    await setParentMutation([snapshot], false);
    assert.equal(Number((await lstat(temporaryRoot, {bigint: true})).mode & 0o7777n), 0o500);
  } finally {
    await chmod(temporaryRoot, 0o700).catch(() => {});
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("report destination and unique README markers are fail-closed before commit", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-reporting-gate-"));
  try {
    const configuration = createConfiguration({ projectRoot: temporaryRoot });
    await writeFile(path.join(temporaryRoot, "README.md"), "# Missing successor markers\n");
    await assert.rejects(
      inspectReportingPreconditions(configuration),
      /markers are missing or ambiguous/,
    );

    await writeFile(path.join(temporaryRoot, "README.md"), [
      "# Fixture",
      "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_BEGIN -->",
      "Pending.",
      "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_END -->",
      "",
    ].join("\n"));
    await mkdir(path.join(temporaryRoot, "reports"));
    await writeFile(
      path.join(temporaryRoot, "reports/fla-swf-counterpart-successor-2026-08-07.md"),
      "conflicting report\n",
    );
    await assert.rejects(
      inspectReportingPreconditions(configuration),
      /report destination must be missing before commit/,
    );
    await rm(
      path.join(temporaryRoot, "reports/fla-swf-counterpart-successor-2026-08-07.md"),
    );
    const ready = await inspectReportingPreconditions(configuration);
    assert.deepEqual(ready.reportDestination, {
      path: "reports/fla-swf-counterpart-successor-2026-08-07.md",
      state: "missing",
    });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("unsigned or incomplete review blocks before plan/profile promotion logic", () => {
  const universe = fixtureUniverse();
  const reviewLedger = fixtureUnsignedLedger(universe);
  const plan = fixturePlan(universe, reviewLedger);
  assert.throws(
    () => validateSuccessorBundle({ universe, reviewLedger, plan }),
    /unsigned or incomplete/,
  );
});

test("contradicted is terminal only when withheld and can never be promoted", async () => {
  const universe = fixtureUniverse();
  const reviewLedger = fixtureTerminalLedger(universe, "contradicted");
  const plan = fixturePlan(universe, reviewLedger);
  await attachValidProfile(plan);
  assert.equal(validateSuccessorBundle({ universe, reviewLedger, plan }).withheld.length, 620);
  const source = universe.records[0];
  plan.withheldRecords = plan.withheldRecords.slice(1);
  plan.approvedCopyRecords = [{
    ...source,
    approvalBasis: "ordinary-confirmed-publication-lineage",
  }];
  assert.throws(
    () => validateSuccessorBundle({ universe, reviewLedger, plan }),
    /lacks confirmed publication lineage/,
  );
});

test("preflight pins baseline completion and revalidates nested review evidence", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-nested-review-"));
  try {
    const configuration = createConfiguration({ projectRoot: temporaryRoot });
    const universe = fixtureUniverse();
    const reviewLedger = fixtureTerminalLedger(universe, "contradicted");
    const universeEvidence = await writeImmutableJson(configuration.universePath, universe);
    const ledgerEvidence = await writeImmutableJson(configuration.reviewLedgerPath, reviewLedger);
    const plan = fixturePlan(universe, reviewLedger);
    await attachValidProfile(plan);
    plan.inputs.universe = {
      path: UNIVERSE_RELATIVE,
      bytes: universeEvidence.bytes,
      sha256: universeEvidence.sha256,
    };
    plan.inputs.reviewLedger = {
      path: REVIEW_LEDGER_RELATIVE,
      bytes: ledgerEvidence.bytes,
      sha256: ledgerEvidence.sha256,
    };
    const registryPath =
      `catalog/source-promotions/${PREFIX}-trusted-reviewer-registry.json`;
    const registryEvidence = await writeImmutableJson(
      path.join(temporaryRoot, registryPath),
      { kind: "externally-provisioned-fixture-registry" },
    );
    plan.inputs.trustedReviewerRegistry = {
      path: registryPath,
      bytes: registryEvidence.bytes,
      sha256: registryEvidence.sha256,
    };
    const firstSnapshotStatePath =
      `work/fla-swf-counterpart-successor-review/${PREFIX}-quiescence-first-snapshot-state.json`;
    const firstSnapshotStateEvidence = await writeImmutableJson(
      path.join(temporaryRoot, firstSnapshotStatePath),
      { kind: "producer-owned-first-snapshot-state-fixture" },
    );
    plan.inputs.quiescenceFirstSnapshotState = {
      path: firstSnapshotStatePath,
      bytes: firstSnapshotStateEvidence.bytes,
      sha256: firstSnapshotStateEvidence.sha256,
    };
    await writeImmutableJson(configuration.planPath, plan);
    let validatorCalled = false;
    const builderModule = (completionIdentity) => ({
      validateReviewLedger: async (_ledger, options) => {
        validatorCalled = true;
        assert.equal(options.requireTerminal, true);
        assert.equal(options.verifyExternalArtifacts, true);
        throw new Error("authoring audit nested artifact SHA-256 mismatch");
      },
      assertExecutablePlan: () => {},
      assertCurrentUniverse: async () => {},
      expectedQuiescenceAllowlist: async () => [],
      loadTrustedReviewerRegistry: async () => ({
        identity: plan.inputs.trustedReviewerRegistry,
        bySubjectId: new Map(),
      }),
      loadFirstSnapshotState: async () => ({
        identity: plan.inputs.quiescenceFirstSnapshotState,
      }),
      verifyImplementationBaselineCurrent: async () => ({
        identity: plan.inputs.repositoryBaseline
          .implementationVerificationReceipt,
        completionIdentity,
      }),
      assertReviewerAuthorizedByRegistry: () => {},
      scanRelevantProcessCensus: fixtureProcessScanner,
    });
    const replacementCompletion = {
      ...plan.inputs.repositoryBaseline.implementationVerificationCompletion,
      sha256: "f".repeat(64),
    };
    await assert.rejects(
      loadAndValidateBundle(configuration, {
        builderModule: builderModule(replacementCompletion),
      }),
      /Implementation-baseline completion input SHA-256 drift/u,
    );
    assert.equal(validatorCalled, false,
      "replacement completion identity must fail before downstream review validation");
    await assert.rejects(
      loadAndValidateBundle(configuration, {
        builderModule: builderModule(
          plan.inputs.repositoryBaseline.implementationVerificationCompletion,
        ),
      }),
      /authoring audit nested artifact SHA-256 mismatch/,
    );
    assert.equal(validatorCalled, true);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("path validation rejects absolute, traversal, backslash, NUL, symlink, and special file", async () => {
  for (const candidate of ["/absolute.swf", "../escape.swf", "a\\b.swf", "a\0b.swf"]) {
    assert.throws(() => portableRelativePath(candidate), /relative|escapes|forbidden/);
  }
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-path-safety-"));
  try {
    await mkdir(path.join(temporaryRoot, "real"));
    await writeFile(path.join(temporaryRoot, "real/source.swf"), "bytes");
    await symlink(path.join(temporaryRoot, "real"), path.join(temporaryRoot, "alias"));
    await assert.rejects(
      resolveContainedExistingFile(temporaryRoot, "alias/source.swf"),
      /symbolic link/,
    );
    await assert.rejects(
      resolveContainedExistingFile("/dev", "null"),
      /not a regular file/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("no-overwrite rejects different bytes, case aliases, and directory conflicts", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-dest-conflicts-"));
  try {
    await mkdir(path.join(temporaryRoot, "course"));
    await writeFile(path.join(temporaryRoot, "course/existing.swf"), "different");
    await writeFile(path.join(temporaryRoot, "course/CaseAlias.swf"), "alias");
    await mkdir(path.join(temporaryRoot, "course/directory.swf"));
    await assert.rejects(
      assertMissingContainedDestination(temporaryRoot, "course/existing.swf"),
      /already exists; no-overwrite/,
    );
    await assert.rejects(
      assertMissingContainedDestination(temporaryRoot, "course/casealias.swf"),
      /case-insensitive path conflict/,
    );
    await assert.rejects(
      assertMissingContainedDestination(temporaryRoot, "course/directory.swf"),
      /already exists; no-overwrite/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("expanded profile rejects duplicateGroups and schema drift", async () => {
  const profile = JSON.parse(await readFile(
    new URL("../catalog/current-source-profile.json", import.meta.url),
    "utf8",
  ));
  assert.equal(validateExpectedCatalogProfile(profile), profile);
  const missing = structuredClone(profile);
  delete missing.expected.duplicateGroups;
  assert.throws(() => validateExpectedCatalogProfile(missing), /missing or unexpected keys/);
  const impossible = structuredClone(profile);
  impossible.expected.duplicateGroups = impossible.expected.duplicatePlacements + 1;
  assert.throws(() => validateExpectedCatalogProfile(impossible), /exceeds duplicatePlacements/);
  const schemaDrift = structuredClone(profile);
  schemaDrift.schemaVersion = 2;
  assert.throws(() => validateExpectedCatalogProfile(schemaDrift), /schemaVersion/);
});

test("catalog closure rejects extras, missing paths, and unauthorized base-file edits", () => {
  const unchangedSha = "a".repeat(64);
  const changedSha = "b".repeat(64);
  const receipt = {
    path: "source-promotions/prepared.json",
    bytes: 99,
    sha256: "c".repeat(64),
  };
  const baseRecords = [
    ...CATALOG_ALLOWED_CHANGED_PATHS.map((relativePath) => ({
      path: relativePath, bytes: 1, sha256: unchangedSha,
    })),
    { path: "README.md", bytes: 1, sha256: unchangedSha },
  ].sort((left, right) => left.path.localeCompare(right.path));
  const currentRecords = [
    ...baseRecords.map((record) => CATALOG_ALLOWED_CHANGED_PATHS.includes(record.path)
      ? { ...record, bytes: 2, sha256: changedSha }
      : { ...record }),
    { path: receipt.path, bytes: receipt.bytes, sha256: receipt.sha256 },
  ].sort((left, right) => left.path.localeCompare(right.path));
  const inventory = (records) => ({
    fileCount: records.length,
    totalBytes: records.reduce((sum, record) => sum + record.bytes, 0),
    treeSha256: sha256Bytes(Buffer.from(JSON.stringify(records))),
    records,
  });
  assert.equal(assertCatalogPathClosure({
    baseInventory: inventory(baseRecords),
    currentInventory: inventory(currentRecords),
    preparedReceipt: receipt,
  }).unexpectedPaths, 0);
  assert.throws(() => assertCatalogPathClosure({
    baseInventory: inventory(baseRecords),
    currentInventory: inventory([
      ...currentRecords,
      { path: "unexpected.json", bytes: 1, sha256: unchangedSha },
    ]),
    preparedReceipt: receipt,
  }), /path-set drift/);
  assert.throws(() => assertCatalogPathClosure({
    baseInventory: inventory(baseRecords),
    currentInventory: inventory(currentRecords.map((record) => record.path === "README.md"
      ? { ...record, sha256: changedSha }
      : record)),
    preparedReceipt: receipt,
  }), /Non-output catalog artifact changed/);
  assert.throws(() => assertCatalogPathClosure({
    baseInventory: inventory(baseRecords),
    currentInventory: inventory(currentRecords.filter((record) => record.path !== "README.md")),
    preparedReceipt: receipt,
  }), /path-set drift/);
});

test("quiescence requires 60 seconds, stable allowlist, zero writers, and current identity", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-quiescence-"));
  try {
    const valid = await quiescenceFixture(path.join(temporaryRoot, "valid"));
    const verified = await verifyQuiescenceSnapshots(valid.configuration, valid.plan, {
      scanOpenWriters: async () => [],
      scanProcesses: fixtureProcessScanner,
      inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
    });
    assert.equal(verified[1].currentFilesystemReverified, true);

    const tooClose = await quiescenceFixture(path.join(temporaryRoot, "too-close"), {
      separationMs: 59_999,
    });
    await assert.rejects(
      verifyQuiescenceSnapshots(tooClose.configuration, tooClose.plan, {
        scanOpenWriters: async () => [],
        scanProcesses: fixtureProcessScanner,
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      }),
      /at least 60 seconds/,
    );

    const physicallyTooClose = await quiescenceFixture(
      path.join(temporaryRoot, "physically-too-close"),
    );
    await assert.rejects(
      verifyQuiescenceSnapshots(
        physicallyTooClose.configuration,
        physicallyTooClose.plan,
        {
          scanOpenWriters: async () => [],
          scanProcesses: fixtureProcessScanner,
          inspectSnapshotBirthtime: async (_filePath, _evidence, index) => String(
            1_000_000_000_000n + BigInt(index) * 59_999_999_999n,
          ),
        },
      ),
      /physically created at least 60 seconds apart/,
    );

    const driftedAllowlist = await quiescenceFixture(path.join(temporaryRoot, "allowlist"), {
      secondRecordPatch: { sha256: "0".repeat(64) },
    });
    await assert.rejects(
      verifyQuiescenceSnapshots(driftedAllowlist.configuration, driftedAllowlist.plan, {
        scanOpenWriters: async () => [],
        scanProcesses: fixtureProcessScanner,
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      }),
      /allowlist drift|scope identity drift/,
    );

    const observedWriter = await quiescenceFixture(path.join(temporaryRoot, "snapshot-writer"), {
      openWriteHandles: 1,
    });
    await assert.rejects(
      verifyQuiescenceSnapshots(observedWriter.configuration, observedWriter.plan, {
        scanOpenWriters: async () => [],
        scanProcesses: fixtureProcessScanner,
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      }),
      /observed open write handles/,
    );

    const unexpectedProcess = {
      pid: "99999",
      ppid: "1",
      command: "node build-fla-swf-counterpart-successor-plan.mjs --watch",
      cwd: null,
      relevance: ["command-references-successor-script"],
      observerRelationship: "none",
    };
    const snapshotProcess = await quiescenceFixture(
      path.join(temporaryRoot, "snapshot-process"),
      { unexpectedRelevantProcesses: [unexpectedProcess] },
    );
    await assert.rejects(
      verifyQuiescenceSnapshots(snapshotProcess.configuration, snapshotProcess.plan, {
        scanOpenWriters: async () => [],
        scanProcesses: fixtureProcessScanner,
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      }),
      /observed an unexpected relevant process/,
    );

    const liveProcess = await quiescenceFixture(path.join(temporaryRoot, "live-process"));
    await assert.rejects(
      verifyQuiescenceSnapshots(liveProcess.configuration, liveProcess.plan, {
        scanOpenWriters: async () => [],
        scanProcesses: async () => fixtureProcessCensus({
          unexpected: [unexpectedProcess],
        }),
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      }),
      /Current relevant-process census observed an unexpected relevant process/,
    );

    const liveWriter = await quiescenceFixture(path.join(temporaryRoot, "live-writer"));
    await assert.rejects(
      verifyQuiescenceSnapshots(liveWriter.configuration, liveWriter.plan, {
        scanOpenWriters: async () => [{ processId: "42" }],
        scanProcesses: fixtureProcessScanner,
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      }),
      /Current live write handles/,
    );

    const currentDrift = await quiescenceFixture(path.join(temporaryRoot, "current-drift"));
    await writeFile(currentDrift.targetPath, "changed after snapshot");
    await assert.rejects(
      verifyQuiescenceSnapshots(currentDrift.configuration, currentDrift.plan, {
        scanOpenWriters: async () => [],
        scanProcesses: fixtureProcessScanner,
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      }),
      /Byte mismatch|SHA-256 mismatch|mtime drift/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("quiescence resolves project and private-intake namespaces against distinct roots", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-quiescence-roots-"));
  try {
    const projectRoot = path.join(temporaryRoot, "project-root");
    const privateRoot = path.join(temporaryRoot, "private-root");
    const projectFile = path.join(projectRoot, "scope/current.swf");
    const privateFile = path.join(privateRoot, "candidate.swf");
    await mkdir(path.dirname(projectFile), { recursive: true });
    await mkdir(privateRoot);
    await writeFile(projectFile, "project");
    await writeFile(privateFile, "private");
    const identities = await Promise.all([
      inspectRegularFileNoFollow(projectFile),
      inspectRegularFileNoFollow(privateFile),
    ]);
    const records = [
      { path: "project/scope/current.swf", evidence: identities[0] },
      {
        path: "private-intake-2026-08-02-help-elm-final/candidate.swf",
        evidence: identities[1],
      },
    ].map(({ path: virtualPath, evidence }) => ({
      path: virtualPath,
      bytes: evidence.bytes,
      sha256: evidence.sha256,
      dev: evidence.node.dev,
      ino: evidence.node.ino,
      mode: evidence.mode,
      mtimeNs: evidence.mtimeNs,
    })).sort((left, right) => left.path.localeCompare(right.path));
    const identitySha256 = sha256Bytes(Buffer.from(records
      .map((record) => `${record.path}\t${record.bytes}\t${record.sha256}\n`).join("")));
    const references = [];
    for (const [index, capturedAt] of [Date.now() - 62_000, Date.now() - 1_000].entries()) {
      const artifact = await writeImmutableJson(
        path.join(projectRoot, `evidence/q-${index + 1}.json`),
        {
          schemaVersion: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot/v1",
          artifactType: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot",
          capturedAt: new Date(capturedAt).toISOString(),
          scope: {
            recordSetSha256: "a".repeat(64),
            sourceBoundRecordSetSha256: "b".repeat(64),
            records: records.length,
            identitySha256,
          },
          allowlist: records,
          openWriteHandles: { count: 0, records: [] },
          processCensus: fixtureProcessCensus(),
        },
      );
      references.push({
        path: path.relative(projectRoot, artifact.path).split(path.sep).join("/"),
        bytes: artifact.bytes,
        sha256: artifact.sha256,
      });
    }
    let scannedPaths;
    await verifyQuiescenceSnapshots(
      createConfiguration({ projectRoot }),
      {
        inputs: {
          quiescenceSnapshots: references,
          quiescenceScope: {
            records: 2,
            identitySha256,
            algorithm: "sha256(sorted path<TAB>bytes<TAB>sha256<LF>); exact paths include all canonical source files, all 620 private candidate files, pinned catalog inputs, README, universe, trusted reviewer registry, signed review ledger, and direct review evidence",
            selfReferentialExclusions: [
              {
                artifact: PLAN_RELATIVE,
                reason: "the plan hash cannot be included in snapshots that are themselves inputs to that plan",
              },
              {
                artifact: "two-quiescence-snapshot-receipts",
                reason: "each snapshot is directly bound by immutable path/bytes/SHA-256 in plan.inputs.quiescenceSnapshots",
              },
              {
                artifact: `work/fla-swf-counterpart-successor-review/${PREFIX}-quiescence-first-snapshot-state.json`,
                reason: "created after the first snapshot; directly bound by immutable path/bytes/SHA-256 and enforces the producer-owned physical not-before",
              },
            ],
          },
        },
      },
      {
        universe: {
          sourceRootBindings: {
            "private-intake-2026-08-02-help-elm-final": { absolutePath: privateRoot },
          },
        },
        scanOpenWriters: async (paths) => {
          scannedPaths = paths;
          return [];
        },
        scanProcesses: fixtureProcessScanner,
        inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
      },
    );
    assert.deepEqual(new Set(scannedPaths), new Set(await Promise.all([
      realpath(projectFile), realpath(privateFile),
    ])));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("prepared review gate requires exactly two roles and zero P0/P1/P2 findings", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-prepared-review-"));
  try {
    const valid = await preparedReviewFixture(path.join(temporaryRoot, "valid"));
    const receipts = await verifyIndependentPreparedReviews(
      valid.configuration,
      valid.transaction,
      valid.preflightEvidence,
    );
    assert.deepEqual(receipts.map((receipt) => receipt.role), [
      "schema-reviewer", "transaction-adversarial-reviewer",
    ]);

    const missing = await preparedReviewFixture(path.join(temporaryRoot, "missing"), {
      roles: ["schema-reviewer"],
    });
    await assert.rejects(
      verifyIndependentPreparedReviews(
        missing.configuration, missing.transaction, missing.preflightEvidence,
      ),
      /exactly two immutable independent-review JSON receipts/,
    );

    const duplicateRole = await preparedReviewFixture(path.join(temporaryRoot, "roles"), {
      roles: ["schema-reviewer", "schema-reviewer"],
    });
    await assert.rejects(
      verifyIndependentPreparedReviews(
        duplicateRole.configuration, duplicateRole.transaction, duplicateRole.preflightEvidence,
      ),
      /exactly one required reviewer role each/,
    );

    const findings = await preparedReviewFixture(path.join(temporaryRoot, "findings"), {
      findings: [{ P0: 0, P1: 0, P2: 0 }, { P0: 0, P1: 1, P2: 0 }],
    });
    await assert.rejects(
      verifyIndependentPreparedReviews(
        findings.configuration, findings.transaction, findings.preflightEvidence,
      ),
      /has P0\/P1\/P2 findings/,
    );

    const forgedSignature = await preparedReviewFixture(
      path.join(temporaryRoot, "forged-signature"),
      {
        mutateReview: (value, index) => {
          if (index === 0) value.signatureEnvelope.signatureBase64 = Buffer.alloc(64).toString("base64");
        },
      },
    );
    await assert.rejects(
      verifyIndependentPreparedReviews(
        forgedSignature.configuration,
        forgedSignature.transaction,
        forgedSignature.preflightEvidence,
      ),
      /detached Ed25519 signature is invalid/,
    );

    const stale = await preparedReviewFixture(path.join(temporaryRoot, "stale"), {
      mutateReview: (value, index) => {
        if (index === 0) value.reviewedAt = "2026-08-07T23:59:59.000Z";
      },
    });
    await assert.rejects(
      verifyIndependentPreparedReviews(
        stale.configuration,
        stale.transaction,
        stale.preflightEvidence,
      ),
      /invalid or stale/,
    );

    const substitutedKey = await preparedReviewFixture(path.join(temporaryRoot, "key"), {
      mutateReview: (value, index) => {
        if (index === 0) value.reviewer.publicKeySpkiSha256 = "d".repeat(64);
      },
    });
    await assert.rejects(
      verifyIndependentPreparedReviews(
        substitutedKey.configuration,
        substitutedKey.transaction,
        substitutedKey.preflightEvidence,
      ),
      /signed payload digest drift|signature envelope identity/,
    );

    const unauthorized = await preparedReviewFixture(
      path.join(temporaryRoot, "unauthorized-reviewer"),
    );
    unauthorized.preflightEvidence.bundle.validated
      .trustedReviewerRegistry.bySubjectId.delete("reviewer-1");
    await assert.rejects(
      verifyIndependentPreparedReviews(
        unauthorized.configuration,
        unauthorized.transaction,
        unauthorized.preflightEvidence,
      ),
      /not present in the external trusted reviewer registry/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("prepared and final machine schemas reject extra critical nested fields before any applied receipt", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-receipt-schema-closure-"),
  ));
  try {
    const fixture = await receiptPresentRecoveryFixture(temporaryRoot);
    const finalReceipt = JSON.parse(
      await readFile(fixture.configuration.receiptPath, "utf8"),
    );
    const preparedReference = finalReceipt.catalogPathClosure.preparedReceipt;
    const preparedPath = path.join(
      fixture.configuration.catalogRoot,
      preparedReference.path,
    );
    const preparedReceipt = JSON.parse(await readFile(preparedPath, "utf8"));
    const preparedEvidence = await inspectRegularFileNoFollow(preparedPath, {
      expectedBytes: preparedReference.bytes,
      expectedSha256: preparedReference.sha256,
      requireSingleLink: true,
      requireReadOnly: true,
    });
    const journal = JSON.parse(await readFile(fixture.paths.journalPath, "utf8"));
    const transaction = {journal, paths: fixture.paths};
    const preflightEvidence = {bundle: fixture.bundle};

    assert.doesNotThrow(() => assertFinalReceiptBundleBindings(
      finalReceipt,
      fixture.receiptEvidence,
      preflightEvidence,
      fixture.configuration,
    ));
    for (const [label, mutate] of [
      ["reporting gate", (value) => { value.reportingGate.releaseAuthorized = true; }],
      ["catalog closure", (value) => {
        value.catalogPathClosure.appliedReceipt.unboundDigest = "a".repeat(64);
      }],
      ["postchecks", (value) => { value.postchecks.unreviewed = {}; }],
      ["recovery roots", (value) => { value.retainedRecoveryRoots.autoDelete = true; }],
    ]) {
      const changed = structuredClone(finalReceipt);
      mutate(changed);
      assert.throws(
        () => assertFinalReceiptBundleBindings(
          changed,
          fixture.receiptEvidence,
          preflightEvidence,
          fixture.configuration,
        ),
        /missing or unexpected keys|keys changed/u,
        label,
      );
    }

    await unlink(fixture.configuration.receiptPath);
    await assert.rejects(
      lstat(fixture.configuration.receiptPath),
      (error) => error.code === "ENOENT",
    );
    assert.doesNotThrow(() => assertPreparedReceiptBundleBindings(
      preparedReceipt,
      preparedEvidence,
      preflightEvidence,
      transaction,
    ));
    for (const [label, mutate] of [
      ["reporting gate", (value) => { value.reportingGate.releaseAuthorized = true; }],
      ["catalog closure", (value) => {
        value.catalogPathClosure.preparedReceipt.unboundDigest = "a".repeat(64);
      }],
      ["postchecks", (value) => { value.postchecks = {live: {}}; }],
      ["recovery roots", (value) => {
        value.retainedRecoveryRoots = {source: "/unreviewed"};
      }],
      ["promotion closure", (value) => { value.exactPromotion.unbound = true; }],
    ]) {
      const changed = structuredClone(preparedReceipt);
      mutate(changed);
      assert.throws(
        () => assertPreparedReceiptBundleBindings(
          changed,
          preparedEvidence,
          preflightEvidence,
          transaction,
        ),
        /Prepared receipt/u,
        label,
      );
      await assert.rejects(
        lstat(fixture.configuration.receiptPath),
        (error) => error.code === "ENOENT",
      );
    }
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("apply with the unsigned fixture creates no transaction or live mutation", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-preflight-block-"));
  try {
    const configuration = createConfiguration({
      projectRoot: temporaryRoot,
      transactionRoot: path.join(temporaryRoot, "transactions"),
    });
    await mkdir(configuration.sourceRoot, { recursive: true });
    await mkdir(path.dirname(configuration.reviewLedgerPath), { recursive: true });
    const universe = fixtureUniverse();
    const ledger = fixtureUnsignedLedger(universe);
    const universeEvidence = await writeImmutableJson(configuration.universePath, universe);
    const ledgerEvidence = await writeImmutableJson(configuration.reviewLedgerPath, ledger);
    const plan = fixturePlan(universe, ledger);
    plan.inputs.universe = {
      path: UNIVERSE_RELATIVE,
      bytes: universeEvidence.bytes,
      sha256: universeEvidence.sha256,
    };
    plan.inputs.reviewLedger = {
      path: REVIEW_LEDGER_RELATIVE,
      bytes: ledgerEvidence.bytes,
      sha256: ledgerEvidence.sha256,
    };
    await writeImmutableJson(configuration.planPath, plan);
    await assert.rejects(
      executePromotion(configuration, { requireBuilderValidator: false }),
      /unsigned or incomplete/,
    );
    assert.equal(await lstat(configuration.sourceRoot).then(() => true), true);
    await assert.rejects(lstat(configuration.transactionRoot), /ENOENT/);
    await assert.rejects(lstat(configuration.receiptPath), /ENOENT/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("executePromotion with 620 terminal withheld records creates no transaction or tree swap and records an immutable closure", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-zero-approved-"));
  try {
    const configuration = createConfiguration({
      projectRoot: temporaryRoot,
      transactionRoot: path.join(temporaryRoot, "transactions"),
    });
    await mkdir(configuration.sourceRoot, { recursive: true });
    await mkdir(configuration.catalogRoot, { recursive: true });
    await writeFile(path.join(temporaryRoot, "README.md"), [
      "# Fixture",
      "",
      "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_BEGIN -->",
      "Pending fixture status.",
      "<!-- FLA_SWF_COUNTERPART_SUCCESSOR_CURRENT_END -->",
      "",
    ].join("\n"));

    const currentProfile = JSON.parse(await readFile(
      new URL("../catalog/current-source-profile.json", import.meta.url),
      "utf8",
    ));
    const currentProfileEvidence = await writeImmutableJson(
      configuration.currentProfilePath,
      currentProfile,
    );
    for (const output of CATALOG_OUTPUTS) {
      const fixtureOutputPath = path.join(configuration.catalogRoot, output);
      const bytes = output === "lesson-releases.json"
        ? await readFile(new URL("../catalog/lesson-releases.json", import.meta.url))
        : Buffer.from(`fixture ${output}\n`, "utf8");
      await writeFile(fixtureOutputPath, bytes, {flag: "wx", mode: 0o444});
      await chmod(fixtureOutputPath, 0o444);
    }

    const signatureEvidence = await writeImmutableJson(
      path.join(temporaryRoot, "evidence/reviewer-attestation.json"),
      { kind: "fixture-reviewer-attestation" },
    );
    const universe = fixtureUniverse();
    const ledger = fixtureTerminalLedger(universe, "contradicted");
    ledger.attestation.signatureEnvelopes[0].artifact = {
      path: "evidence/reviewer-attestation.json",
      bytes: signatureEvidence.bytes,
      sha256: signatureEvidence.sha256,
    };
    for (const record of ledger.records) {
      if (record.manualHoldReview.required) {
        record.manualHoldReview.receipt = {
          path: "evidence/reviewer-attestation.json",
          bytes: signatureEvidence.bytes,
          sha256: signatureEvidence.sha256,
        };
      }
    }

    const universeEvidence = await writeImmutableJson(configuration.universePath, universe);
    const ledgerEvidence = await writeImmutableJson(configuration.reviewLedgerPath, ledger);
    const plan = fixturePlan(universe, ledger);
    plan.inputs.universe = {
      path: UNIVERSE_RELATIVE,
      bytes: universeEvidence.bytes,
      sha256: universeEvidence.sha256,
    };
    plan.inputs.reviewLedger = {
      path: REVIEW_LEDGER_RELATIVE,
      bytes: ledgerEvidence.bytes,
      sha256: ledgerEvidence.sha256,
    };
    await attachValidProfile(plan);
    plan.inputs.repositoryBaseline = {
      source: {
        fileCount: currentProfile.expected.files,
        totalBytes: currentProfile.expected.totalBytes,
        manifestSha256: "d".repeat(64),
      },
      currentSourceProfile: {
        path: CURRENT_PROFILE_RELATIVE,
        bytes: currentProfileEvidence.bytes,
        sha256: currentProfileEvidence.sha256,
      },
    };

    const quiescenceTarget = await inspectRegularFileNoFollow(configuration.currentProfilePath);
    const quiescenceRecord = {
      path: `project/${CURRENT_PROFILE_RELATIVE}`,
      bytes: quiescenceTarget.bytes,
      sha256: quiescenceTarget.sha256,
      dev: quiescenceTarget.node.dev,
      ino: quiescenceTarget.node.ino,
      mode: quiescenceTarget.mode,
      mtimeNs: quiescenceTarget.mtimeNs,
    };
    const snapshotReferences = [];
    const quiescenceIdentitySha256 = sha256Bytes(Buffer.from(
      `${quiescenceRecord.path}\t${quiescenceRecord.bytes}\t${quiescenceRecord.sha256}\n`,
      "utf8",
    ));
    for (const [index, capturedAt] of [
      "2026-08-07T00:00:00.000Z",
      "2026-08-07T00:01:00.000Z",
    ].entries()) {
      const snapshot = await writeImmutableJson(
        path.join(temporaryRoot, `evidence/quiescence-${index + 1}.json`),
        {
          schemaVersion: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot/v1",
          artifactType: "help-math-fla-swf-counterpart-scoped-quiescence-snapshot",
          capturedAt,
          scope: {
            recordSetSha256: universe.digests.recordSetSha256,
            sourceBoundRecordSetSha256: universe.digests.sourceBoundRecordSetSha256,
            records: 1,
            identitySha256: quiescenceIdentitySha256,
          },
          allowlist: [quiescenceRecord],
          openWriteHandles: { count: 0, records: [] },
          processCensus: fixtureProcessCensus(),
        },
      );
      snapshotReferences.push({
        path: `evidence/quiescence-${index + 1}.json`,
        bytes: snapshot.bytes,
        sha256: snapshot.sha256,
      });
    }
    plan.inputs.quiescenceSnapshots = snapshotReferences;
    plan.inputs.quiescenceScope = {
      records: 1,
      identitySha256: quiescenceIdentitySha256,
      algorithm: "sha256(sorted path<TAB>bytes<TAB>sha256<LF>); exact paths include all canonical source files, all 620 private candidate files, pinned catalog inputs, README, universe, trusted reviewer registry, signed review ledger, and direct review evidence",
      selfReferentialExclusions: [
        {
          artifact: PLAN_RELATIVE,
          reason: "the plan hash cannot be included in snapshots that are themselves inputs to that plan",
        },
        {
          artifact: "two-quiescence-snapshot-receipts",
          reason: "each snapshot is directly bound by immutable path/bytes/SHA-256 in plan.inputs.quiescenceSnapshots",
        },
        {
          artifact: `work/fla-swf-counterpart-successor-review/${PREFIX}-quiescence-first-snapshot-state.json`,
          reason: "created after the first snapshot; directly bound by immutable path/bytes/SHA-256 and enforces the producer-owned physical not-before",
        },
      ],
    };
    await writeImmutableJson(configuration.planPath, plan);

    const liveSummary = JSON.parse(await readFile(
      new URL("../catalog/summary.json", import.meta.url),
      "utf8",
    ));
    const baseFreeze = {
      fileCount: currentProfile.expected.files,
      totalBytes: currentProfile.expected.totalBytes,
      manifestSha256: "d".repeat(64),
    };
    const dependencies = {
      verifyFreeze: async () => baseFreeze,
      buildCatalog: async () => ({ summary: liveSummary }),
    };
    const sourceBefore = await inventoryDirectory(configuration.sourceRoot);
    const catalogBefore = await inventoryDirectory(configuration.catalogRoot);

    const result = await executePromotion(configuration, {
      dependencies,
      requireBuilderValidator: false,
      scanProcesses: fixtureProcessScanner,
      inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
    });

    assert.equal(result.status, "terminal-reviewed-all-withheld-no-copy-no-transaction");
    assert.equal(result.frozenUniverseRecords, 620);
    assert.equal(result.approvedCopyRecords, 0);
    assert.equal(result.withheldRecords, 620);
    assert.equal(result.sourceCopyPerformed, false);
    assert.equal(result.workingCopyCreated, false);
    assert.equal(result.sourceSwapped, false);
    assert.equal(result.catalogSwapped, false);
    assert.equal(result.appliedReceiptPublished, false);
    assert.equal(result.observedCanonical, false);
    assert.equal(result.publicationAllowed, false);
    assert.equal(result.noCopyClosure.path,
      `catalog/source-promotions/${PREFIX}-no-copy-closure.json`);
    const closureInformation = await lstat(configuration.noCopyClosurePath);
    assert.equal(closureInformation.mode & 0o222, 0);
    assert.equal(closureInformation.nlink, 1);
    const closure = JSON.parse(await readFile(configuration.noCopyClosurePath, "utf8"));
    assert.equal(closure.lifecycle, "final-reviewed-no-copy");
    assert.equal(closure.applied, false);
    assert.equal(closure.exactNoCopyClosure.approvedCopyRecords, 0);
    assert.equal(closure.exactNoCopyClosure.withheldRecords, 620);
    assert.equal(closure.exactDisposition.currentHoldsAutomaticallyCopied, 0);
    assert.equal(closure.liveVerification.catalogGeneratedOutputs.length, 17);
    assert.equal(closure.reportingGate.canonicalCountsReportableAsNewPromotionResult, false);
    assert.deepEqual(await inventoryDirectory(configuration.sourceRoot), sourceBefore);
    const catalogAfter = await inventoryDirectory(configuration.catalogRoot);
    assert.equal(catalogAfter.fileCount, catalogBefore.fileCount + 1);
    assert.equal(catalogAfter.records.some((record) =>
      record.path === `source-promotions/${PREFIX}-no-copy-closure.json`), true);
    await assert.rejects(lstat(configuration.transactionRoot), /ENOENT/);
    await assert.rejects(lstat(configuration.activeRoot), /ENOENT/);
    await assert.rejects(lstat(configuration.receiptPath), /ENOENT/);

    const repeated = await executePromotion(configuration, {
      dependencies,
      requireBuilderValidator: false,
      scanProcesses: fixtureProcessScanner,
      inspectSnapshotBirthtime: fixtureSnapshotBirthtime,
    });
    assert.equal(repeated.noCopyClosure.sha256, result.noCopyClosure.sha256);
    assert.equal((await inventoryDirectory(configuration.catalogRoot)).fileCount,
      catalogAfter.fileCount);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("working copy is exclusive, 0444, single-link, separate-inode, and byte-identical", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-working-copy-"));
  try {
    const sourceRoot = path.join(temporaryRoot, "source");
    const workingRoot = path.join(temporaryRoot, "working");
    await mkdir(path.join(sourceRoot, "quarantine"), { recursive: true });
    const sourceBytes = Buffer.from("immutable counterpart bytes", "utf8");
    const sourcePath = path.join(sourceRoot, "quarantine/source.swf");
    await writeFile(sourcePath, sourceBytes);
    const record = {
      recordId: "fixture-record",
      canonicalPath: "HELP_COURSES/ELMGR5/L1/IN/source.swf",
      bytes: sourceBytes.length,
      sha256: sha256Bytes(sourceBytes),
      sourceBindingSha256: sha256Bytes(Buffer.from("binding")),
      sourceBinding: { quarantineRelativePath: "quarantine/source.swf" },
      priorDisposition: DISPOSITION.ordinary,
      currentDisposition: DISPOSITION.ordinary,
      approvalBasis: "ordinary-confirmed-publication-lineage",
    };
    const result = await createWorkingCopy({
      records: [record],
      sourceRoot,
      workingRoot,
      planSha256: "a".repeat(64),
    });
    const workingPath = path.join(result.filesRoot, record.canonicalPath);
    const [sourceInformation, workingInformation] = await Promise.all([
      lstat(sourcePath, { bigint: true }),
      lstat(workingPath, { bigint: true }),
    ]);
    assert.equal(Number(workingInformation.mode & 0o777n), 0o444);
    assert.equal(workingInformation.nlink, 1n);
    assert.notEqual(workingInformation.ino, sourceInformation.ino);
    assert.deepEqual(await readFile(workingPath), sourceBytes);
    await assert.rejects(
      createWorkingCopy({
        records: [record], sourceRoot, workingRoot, planSha256: "a".repeat(64),
      }),
      /already exists/,
    );

    const mismatched = { ...record, sha256: "b".repeat(64) };
    await assert.rejects(
      createWorkingCopy({
        records: [mismatched],
        sourceRoot,
        workingRoot: path.join(temporaryRoot, "mismatch-working"),
        planSha256: "a".repeat(64),
      }),
      /SHA-256 drift|SHA-256 mismatch/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("working-copy receipt tamper and same-byte inode replacement both fail closed", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-working-binding-"));
  try {
    const sourceRoot = path.join(temporaryRoot, "source");
    const workingRoot = path.join(temporaryRoot, "working");
    await mkdir(path.join(sourceRoot, "quarantine"), { recursive: true });
    const bytes = Buffer.from("receipt-bound bytes", "utf8");
    await writeFile(path.join(sourceRoot, "quarantine/source.swf"), bytes);
    const record = {
      recordId: "fixture-record",
      canonicalPath: "HELP_COURSES/ELMGR5/L1/IN/source.swf",
      bytes: bytes.length,
      sha256: sha256Bytes(bytes),
      sourceBindingSha256: sha256Bytes(Buffer.from("binding")),
      sourceBinding: { quarantineRelativePath: "quarantine/source.swf" },
      priorDisposition: DISPOSITION.ordinary,
      currentDisposition: DISPOSITION.ordinary,
      approvalBasis: "ordinary-confirmed-publication-lineage",
    };
    const working = await createWorkingCopy({
      records: [record], sourceRoot, workingRoot, planSha256: "a".repeat(64),
    });
    const workingFile = path.join(working.filesRoot, record.canonicalPath);
    await rename(workingFile, `${workingFile}.receipt-original`);
    await writeFile(workingFile, bytes, { mode: 0o444 });
    await chmod(workingFile, 0o444);
    await assert.rejects(
      validateWorkingCopyReceipt({
        records: [record],
        receiptPath: working.receiptPath,
        receiptSha256: working.receiptEvidence.sha256,
        planSha256: "a".repeat(64),
        sourceRoot,
        workingRoot,
      }),
      /inode differs/,
    );
    await chmod(working.receiptPath, 0o644);
    const tamperedReceipt = JSON.parse(await readFile(working.receiptPath, "utf8"));
    tamperedReceipt.recordCount = 2;
    await writeFile(working.receiptPath, `${JSON.stringify(tamperedReceipt, null, 2)}\n`);
    await chmod(working.receiptPath, 0o444);
    await assert.rejects(
      validateWorkingCopyReceipt({
        records: [record],
        receiptPath: working.receiptPath,
        receiptSha256: working.receiptEvidence.sha256,
        planSha256: "a".repeat(64),
        sourceRoot,
        workingRoot,
      }),
      /SHA-256 mismatch/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("canonical destination no-overwrite fails even for identical bytes", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-no-overwrite-"));
  try {
    const sourceRoot = path.join(temporaryRoot, "source");
    const workingRoot = path.join(temporaryRoot, "working");
    const stagedRoot = path.join(temporaryRoot, "staged");
    await mkdir(path.join(sourceRoot, "quarantine"), { recursive: true });
    await mkdir(path.join(stagedRoot, "HELP_COURSES/ELMGR5/L1/IN"), { recursive: true });
    const bytes = Buffer.from("same bytes", "utf8");
    await writeFile(path.join(sourceRoot, "quarantine/source.swf"), bytes);
    const record = {
      recordId: "fixture-record",
      canonicalPath: "HELP_COURSES/ELMGR5/L1/IN/source.swf",
      bytes: bytes.length,
      sha256: sha256Bytes(bytes),
      sourceBindingSha256: sha256Bytes(Buffer.from("binding")),
      sourceBinding: { quarantineRelativePath: "quarantine/source.swf" },
      priorDisposition: DISPOSITION.ordinary,
      currentDisposition: DISPOSITION.ordinary,
      approvalBasis: "ordinary-confirmed-publication-lineage",
    };
    const working = await createWorkingCopy({
      records: [record], sourceRoot, workingRoot, planSha256: "a".repeat(64),
    });
    await writeFile(path.join(stagedRoot, record.canonicalPath), bytes);
    await assert.rejects(
      copyWorkingSetToStagedSource({
        records: [record],
        workingCopyReceiptPath: working.receiptPath,
        workingCopyReceiptSha256: working.receiptEvidence.sha256,
        planSha256: "a".repeat(64),
        sourceRoot,
        workingRoot,
        stagedSourceRoot: stagedRoot,
      }),
      /already exists; no-overwrite/,
    );
    await assert.rejects(
      assertMissingContainedDestination(stagedRoot, record.canonicalPath),
      /already exists; no-overwrite/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("final receipt is inseparable from its journal draft, working copy, reviews, swaps, and postchecks", () => {
  const plan = { path: PLAN_RELATIVE, bytes: 123, sha256: "1".repeat(64) };
  const stagedPostcheck = { freeze: { manifestSha256: "2".repeat(64) } };
  const livePostcheck = { freeze: { manifestSha256: "3".repeat(64) } };
  const baseInventory = {
    fileCount: 0,
    totalBytes: 0,
    treeSha256: sha256Bytes(Buffer.alloc(0)),
    records: [],
  };
  const reviews = [{
    name: "schema.json",
    role: "schema-reviewer",
    reviewerSubjectId: "reviewer-a",
    reviewedAt: "2026-08-07T00:02:00.000Z",
    bytes: 10,
    sha256: "4".repeat(64),
    findings: { P0: 0, P1: 0, P2: 0 },
  }, {
    name: "adversarial.json",
    role: "transaction-adversarial-reviewer",
    reviewerSubjectId: "reviewer-b",
    reviewedAt: "2026-08-07T00:03:00.000Z",
    bytes: 11,
    sha256: "5".repeat(64),
    findings: { P0: 0, P1: 0, P2: 0 },
  }];
  const sourceNodes = {
    live: { dev: "7", ino: "10" },
    staged: { dev: "7", ino: "11" },
  };
  const catalogNodes = {
    live: { dev: "7", ino: "12" },
    staged: { dev: "7", ino: "13" },
  };
  const swaps = {
    source: fixtureSwapReceipt({
      allowedParent: "/fixture",
      firstDirectory: "/fixture/source-live",
      secondDirectory: "/fixture/source-recovery",
      firstNode: sourceNodes.live,
      secondNode: sourceNodes.staged,
    }),
    catalog: fixtureSwapReceipt({
      allowedParent: "/fixture",
      firstDirectory: "/fixture/catalog-live",
      secondDirectory: "/fixture/catalog-recovery",
      firstNode: catalogNodes.live,
      secondNode: catalogNodes.staged,
    }),
  };
  const receiptEvidence = { bytes: 456, sha256: "6".repeat(64) };
  const readmeBase = {
    bytes: 321,
    sha256: "e".repeat(64),
    mode: 0o644,
    node: {dev: "7", ino: "14"},
  };
  const reportingPreimage = {
    liveReadme: {path: "README.md", ...readmeBase},
    retainedBaseBackup: {
      path: ".README.md.fla-swf-counterpart-successor-base-backup-20260807T000000000Z-aaaaaaaaaaaa",
      bytes: readmeBase.bytes,
      sha256: readmeBase.sha256,
      mode: 0o444,
      nlink: 1,
      node: {dev: "7", ino: "15"},
      distinctFromExpectedBaseInode: true,
      retentionPolicy:
        "retained; this executor never deletes the transaction-bound README base backup",
    },
    exchangeSemantics:
      "pathname exchange after an independently retained base preimage; an indeterminate final race is forward-only manual reconciliation, not a kernel inode CAS",
  };
  const transaction = {
    paths: {
      sourceParent: "/fixture",
      catalogParent: "/fixture",
      sourceRecovery: "/fixture/source-recovery",
      catalogRecovery: "/fixture/catalog-recovery",
    },
    journal: {
      transactionId: "20260807T000000000Z-aaaaaaaaaaaa",
      plan,
      base: {
        nativeSwapSourceSha256: "f".repeat(64),
        nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
        readme: readmeBase,
      },
      nativeSwapBuildWitness: fixtureNativeBuildReceipt(),
      nativeSwapBuildWitnessIdentity: fixtureNativeBuildIdentity(),
      paths: {
        sourceLive: "/fixture/source-live",
        catalogLive: "/fixture/catalog-live",
      },
      directoryNodesBeforeSwap: {
        source: sourceNodes,
        catalog: catalogNodes,
      },
      receiptDraft: receiptEvidence,
      workingCopy: { receiptSha256: "7".repeat(64) },
      staged: {
        copied: { recordSetSha256: "8".repeat(64) },
        preparedRelativePath: "source-promotions/prepared.json",
        preparedBytes: 99,
        preparedSha256: "9".repeat(64),
        postcheck: stagedPostcheck,
        catalogPathClosure: { baseInventory },
        reviewBindings: {
          approvedClosureSha256: "a".repeat(64),
          withheldClosureSha256: "b".repeat(64),
          trustedReviewerRegistrySha256: "0".repeat(64),
        },
      },
      independentReviews: reviews,
      swapReceipts: swaps,
      livePostcheck,
      reportingPreimage,
    },
  };
  const receipt = {
    transactionId: transaction.journal.transactionId,
    plan,
    nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
    nativeSwapBuildWitness: fixtureNativeBuildReceipt(),
    nativeSwapBuildWitnessIdentity: fixtureNativeBuildIdentity(),
    inputArtifacts: {
      trustedReviewerRegistry: {
        path: `catalog/source-promotions/${PREFIX}-trusted-reviewer-registry.json`,
        bytes: 123,
        sha256: "0".repeat(64),
      },
    },
    exactPromotion: {
      workingCopyReceiptSha256: "7".repeat(64),
      recordSetSha256: "8".repeat(64),
      approvedClosureSha256: "a".repeat(64),
      withheldClosureSha256: "b".repeat(64),
    },
    catalogPathClosure: {
      preparedReceipt: {
        path: "source-promotions/prepared.json",
        bytes: 99,
        sha256: "9".repeat(64),
      },
      baseInventory,
    },
    stagedVerification: stagedPostcheck,
    observedCatalogArtifacts: stagedPostcheck.catalogEvidenceClosure?.boundArtifacts,
    independentPreparedReviews: reviews,
    swaps,
    postchecks: { live: livePostcheck },
    reportingPreimage,
    retainedRecoveryRoots: {
      source: transaction.paths.sourceRecovery,
      catalog: transaction.paths.catalogRecovery,
    },
  };
  assert.doesNotThrow(() => assertFinalReceiptJournalBindings(
    receipt,
    receiptEvidence,
    transaction,
  ));
  for (const [label, mutate] of [
    ["transaction", (value) => { value.transactionId = "20260807T000000000Z-bbbbbbbbbbbb"; }],
    ["draft", (_value, context) => { context.journal.receiptDraft.sha256 = "c".repeat(64); }],
    ["working copy", (value) => { value.exactPromotion.workingCopyReceiptSha256 = "d".repeat(64); }],
    ["prepared", (value) => { value.catalogPathClosure.preparedReceipt.sha256 = "e".repeat(64); }],
    ["reviews", (value) => { value.independentPreparedReviews[0].reviewerSubjectId = "forged"; }],
    ["swaps", (value) => { value.swaps.source.status = "forged"; }],
    ["compiled helper", (value) => {
      value.swaps.source.nativeBuild.executable.sha256 = "d".repeat(64);
    }],
    ["live postcheck", (value) => { value.postchecks.live.freeze.manifestSha256 = "f".repeat(64); }],
  ]) {
    const changedReceipt = structuredClone(receipt);
    const changedTransaction = structuredClone(transaction);
    mutate(changedReceipt, changedTransaction);
    assert.throws(
      () => assertFinalReceiptJournalBindings(
        changedReceipt,
        receiptEvidence,
        changedTransaction,
      ),
      /binding drift/,
      label,
    );
  }
});

test("swap receipts prove exact inode exchange, native durability, and helper source", () => {
  const before = {
    live: { dev: "7", ino: "101" },
    staged: { dev: "7", ino: "202" },
  };
  const valid = fixtureSwapReceipt({
    allowedParent: "/fixture",
    firstDirectory: "/fixture/live",
    secondDirectory: "/fixture/staged",
    firstNode: before.live,
    secondNode: before.staged,
  });
  assert.doesNotThrow(() => assertAtomicSwapReceipt(valid, {
    allowedParent: "/fixture",
    firstDirectory: "/fixture/live",
    secondDirectory: "/fixture/staged",
    before,
    expectedNativeSourceSha256: valid.nativeSourceSha256,
    expectedNativeBuildContract: FIXTURE_NATIVE_BUILD_CONTRACT,
  }));
  for (const mutate of [
    (value) => { value.after.first = before.live; },
    (value) => { value.native.parentFsynced = false; },
    (value) => { value.nativeSourceSha256 = "not-a-digest"; },
    (value) => { value.nativeSourceSha256 = "e".repeat(64); },
    (value) => { value.nativeBuild.compiler.version = "forged compiler"; },
    (value) => { value.nativeBuild.compile.arguments[1] = "-O0"; },
    (value) => { value.allowedParent = "/wrong"; },
    (value) => { value.cleanupWarning = "forged tolerated cleanup warning"; },
  ]) {
    const changed = structuredClone(valid);
    mutate(changed);
    assert.throws(() => assertAtomicSwapReceipt(changed, {
      allowedParent: "/fixture",
      firstDirectory: "/fixture/live",
      secondDirectory: "/fixture/staged",
      before,
      expectedNativeSourceSha256: valid.nativeSourceSha256,
      expectedNativeBuildContract: FIXTURE_NATIVE_BUILD_CONTRACT,
    }), /invalid|drift|exchange|differs|changed/);
  }
});

test("recovery state machine rolls back only before receipt and reconciles after receipt", () => {
  assert.equal(decideRecoveryAction({
    receiptKind: "file", phase: "source-swapped", sourceState: "swapped", catalogState: "unchanged",
  }), "reconcile-forward-commit");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "source-swapped", sourceState: "swapped", catalogState: "unchanged",
  }), "rollback-catalog-then-source");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "catalog-swapped", sourceState: "swapped", catalogState: "swapped",
  }), "rollback-catalog-then-source");
  assert.equal(decideRecoveryAction({
    receiptKind: "file", phase: "ready-to-publish-receipt",
    sourceState: "swapped", catalogState: "swapped",
  }), "reconcile-forward-commit");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "staged-and-verified", sourceState: "unchanged", catalogState: "unchanged",
  }), "verify-base-and-mark-recovered");
  assert.equal(decideRecoveryAction({
    receiptKind: "symlink", phase: "catalog-swapped", sourceState: "swapped", catalogState: "swapped",
  }), "manual-intervention");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "committed", sourceState: "swapped", catalogState: "swapped",
  }), "manual-intervention");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "committed-and-reported", sourceState: "swapped", catalogState: "swapped",
  }), "manual-intervention");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "publishing-receipt", sourceState: "swapped", catalogState: "swapped",
  }), "manual-intervention");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "manual-intervention-required", sourceState: "swapped", catalogState: "swapped",
    receiptCommitPointPresent: true,
  }), "manual-intervention");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "ready-to-publish-receipt", sourceState: "swapped", catalogState: "swapped",
  }), "rollback-catalog-then-source");
  assert.equal(decideRecoveryAction({
    receiptKind: "missing", phase: "source-swapped", sourceState: "indeterminate", catalogState: "unchanged",
  }), "manual-intervention");
  for (const phase of [
    "publishing-receipt",
    "receipt-published",
    "committed",
    "committed-and-reported",
  ]) {
    assert.equal(receiptPublicationMayHaveCommitted({phase}), true);
  }
  assert.equal(receiptPublicationMayHaveCommitted({
    phase: "manual-intervention-required",
    receiptCommitPointPresent: true,
  }), true);
  assert.equal(receiptPublicationMayHaveCommitted({
    phase: "manual-intervention-required",
    finalReceipt: {sha256: "a".repeat(64)},
  }), true);
  assert.equal(receiptPublicationMayHaveCommitted({
    phase: "ready-to-publish-receipt",
  }), false);
});

test("real recovery rolls source-swapped/catalog-unchanged back before current-universe validation", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-real-recovery-"));
  try {
    const configuration = createConfiguration({
      projectRoot: temporaryRoot,
      transactionRoot: path.join(temporaryRoot, "transactions"),
    });
    const transactionId = "20260808T010203004Z-abcdefabcdef";
    const paths = transactionPaths(configuration, transactionId);
    await mkdir(configuration.sourceRoot, { recursive: true });
    await writeFile(path.join(configuration.sourceRoot, "base-sentinel"), "base");
    await mkdir(paths.sourceRecovery);
    await writeFile(path.join(paths.sourceRecovery, "staged-sentinel"), "staged");
    await mkdir(configuration.catalogRoot, { recursive: true });
    await mkdir(paths.catalogRecovery);
    const planArtifact = await writeImmutableJson(configuration.planPath, { fixture: true });
    const baseCatalogInventory = await inventoryDirectory(configuration.catalogRoot);
    const [sourceBase, sourceStaged, catalogBase, catalogStaged] = await Promise.all([
      snapshotDirectoryNode(configuration.sourceRoot, "source base"),
      snapshotDirectoryNode(paths.sourceRecovery, "source staged"),
      snapshotDirectoryNode(configuration.catalogRoot, "catalog base"),
      snapshotDirectoryNode(paths.catalogRecovery, "catalog staged"),
    ]);
    const swapDirectories = async ({
      firstDirectory,
      secondDirectory,
      expectedFirstNode,
      expectedSecondNode,
      expectedNativeSourceSha256,
      expectedNativeBuildContract = FIXTURE_NATIVE_BUILD_CONTRACT,
    }) => {
      if (expectedFirstNode || expectedSecondNode) {
        const [firstAtCall, secondAtCall] = await Promise.all([
          lstat(firstDirectory, {bigint: true}),
          lstat(secondDirectory, {bigint: true}),
        ]);
        assert.deepEqual(expectedFirstNode, {
          dev: String(firstAtCall.dev), ino: String(firstAtCall.ino),
        });
        assert.deepEqual(expectedSecondNode, {
          dev: String(secondAtCall.dev), ino: String(secondAtCall.ino),
        });
      }
      const temporary = path.join(path.dirname(firstDirectory), `.test-swap-${Date.now()}`);
      await rename(firstDirectory, temporary);
      await rename(secondDirectory, firstDirectory);
      await rename(temporary, secondDirectory);
      return {
        status: "swapped-and-parent-fsynced",
        firstDirectory,
        secondDirectory,
        native: {status: "swapped", parentFsynced: true},
        nativeSourceSha256: expectedNativeSourceSha256 ?? "f".repeat(64),
        nativeBuild: fixtureNativeBuildReceipt(expectedNativeBuildContract),
      };
    };
    await swapDirectories({
      firstDirectory: configuration.sourceRoot,
      secondDirectory: paths.sourceRecovery,
    });
    await mkdir(configuration.activeRoot, { recursive: true });
    const baseFreeze = {
      fileCount: 1,
      totalBytes: 4,
      manifestSha256: "a".repeat(64),
      readOnlyEnforced: true,
      writableEntriesAfterFreeze: 0,
    };
    const journal = {
      schemaVersion: SCHEMA.transaction,
      artifactType: SCHEMA.transactionType,
      transactionId,
      phase: "source-swapped",
      plan: {
        path: PLAN_RELATIVE,
        bytes: planArtifact.bytes,
        sha256: planArtifact.sha256,
      },
      paths: {
        projectRoot: configuration.projectRoot,
        sourceLive: configuration.sourceRoot,
        catalogLive: configuration.catalogRoot,
        receipt: configuration.receiptPath,
        ...paths,
      },
      base: {
        freeze: baseFreeze,
        catalogTreeSha256: baseCatalogInventory.treeSha256,
        currentProfileSha256: "b".repeat(64),
        nativeSwapSourceSha256: "f".repeat(64),
        nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
        sourceRootNode: sourceBase.node,
        catalogRootNode: catalogBase.node,
      },
      nativeSwapBuildWitness: fixtureNativeBuildReceipt(),
      nativeSwapBuildWitnessIdentity: fixtureNativeBuildIdentity(),
      parentModes: [],
      directoryNodesBeforeSwap: {
        source: { live: sourceBase.node, staged: sourceStaged.node },
        catalog: { live: catalogBase.node, staged: catalogStaged.node },
      },
      swapReceipts: {},
    };
    await writeImmutableJson(paths.journalPath, journal);
    let bundleLoaderCalls = 0;
    const result = await recoverPromotion(configuration, {
      requireBuilderValidator: false,
      bundleLoader: async () => {
        bundleLoaderCalls += 1;
        return { planEvidence: planArtifact };
      },
      dependencies: {
        ...{},
        atomicSwap: swapDirectories,
        verifyFreeze: async (sourceRoot) => {
          assert.equal(await readFile(path.join(sourceRoot, "base-sentinel"), "utf8"), "base");
          return baseFreeze;
        },
      },
    });
    assert.equal(bundleLoaderCalls, 0,
      "rollback-only recovery must not load post-swap pre-state review/quiescence inputs");
    assert.equal(result.status, "recovered-to-base-and-verified");
    assert.equal(result.recoveryAction, "rollback-catalog-then-source");
    assert.equal(await readFile(path.join(configuration.sourceRoot, "base-sentinel"), "utf8"), "base");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("real recovery rolls both swapped trees back in catalog-then-source order before receipt publication", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-both-swapped-recovery-"));
  try {
    const configuration = createConfiguration({
      projectRoot: temporaryRoot,
      transactionRoot: path.join(temporaryRoot, "transactions"),
    });
    const transactionId = "20260808T010203004Z-bbbbbbbbbbbb";
    const paths = transactionPaths(configuration, transactionId);
    await mkdir(configuration.sourceRoot, {recursive: true});
    await writeFile(path.join(configuration.sourceRoot, "base-source"), "base");
    await mkdir(paths.sourceRecovery);
    await writeFile(path.join(paths.sourceRecovery, "staged-source"), "staged");
    await mkdir(configuration.catalogRoot, {recursive: true});
    await writeFile(path.join(configuration.catalogRoot, "base-catalog"), "base");
    await mkdir(paths.catalogRecovery);
    await writeFile(path.join(paths.catalogRecovery, "staged-catalog"), "staged");
    const planArtifact = await writeImmutableJson(configuration.planPath, {fixture: true});
    const stagedPlanArtifact = await writeImmutableJson(
      path.join(
        paths.catalogRecovery,
        path.relative(configuration.catalogRoot, configuration.planPath),
      ),
      {fixture: true},
    );
    assert.equal(stagedPlanArtifact.sha256, planArtifact.sha256);
    const baseCatalogInventory = await inventoryDirectory(configuration.catalogRoot);
    const [sourceBase, sourceStaged, catalogBase, catalogStaged] = await Promise.all([
      snapshotDirectoryNode(configuration.sourceRoot, "source base"),
      snapshotDirectoryNode(paths.sourceRecovery, "source staged"),
      snapshotDirectoryNode(configuration.catalogRoot, "catalog base"),
      snapshotDirectoryNode(paths.catalogRecovery, "catalog staged"),
    ]);
    const swapOrder = [];
    const swapDirectories = async ({
      firstDirectory,
      secondDirectory,
      expectedFirstNode,
      expectedSecondNode,
      expectedNativeSourceSha256,
      expectedNativeBuildContract = FIXTURE_NATIVE_BUILD_CONTRACT,
    }) => {
      if (expectedFirstNode || expectedSecondNode) {
        const [firstAtCall, secondAtCall] = await Promise.all([
          lstat(firstDirectory, {bigint: true}),
          lstat(secondDirectory, {bigint: true}),
        ]);
        assert.deepEqual(expectedFirstNode, {
          dev: String(firstAtCall.dev), ino: String(firstAtCall.ino),
        });
        assert.deepEqual(expectedSecondNode, {
          dev: String(secondAtCall.dev), ino: String(secondAtCall.ino),
        });
      }
      swapOrder.push(firstDirectory === configuration.catalogRoot ? "catalog" : "source");
      const temporary = path.join(
        path.dirname(firstDirectory),
        `.test-swap-${swapOrder.length}-${Date.now()}`,
      );
      await rename(firstDirectory, temporary);
      await rename(secondDirectory, firstDirectory);
      await rename(temporary, secondDirectory);
      return {
        status: "swapped-and-parent-fsynced",
        firstDirectory,
        secondDirectory,
        native: {status: "swapped", parentFsynced: true},
        nativeSourceSha256: expectedNativeSourceSha256 ?? "f".repeat(64),
        nativeBuild: fixtureNativeBuildReceipt(expectedNativeBuildContract),
      };
    };
    await swapDirectories({
      firstDirectory: configuration.sourceRoot,
      secondDirectory: paths.sourceRecovery,
    });
    await swapDirectories({
      firstDirectory: configuration.catalogRoot,
      secondDirectory: paths.catalogRecovery,
    });
    swapOrder.length = 0;
    await mkdir(configuration.activeRoot, {recursive: true});
    const baseFreeze = {
      fileCount: 1,
      totalBytes: 4,
      manifestSha256: "a".repeat(64),
      readOnlyEnforced: true,
      writableEntriesAfterFreeze: 0,
    };
    await writeImmutableJson(paths.journalPath, {
      schemaVersion: SCHEMA.transaction,
      artifactType: SCHEMA.transactionType,
      transactionId,
      phase: "catalog-swapped",
      plan: {path: PLAN_RELATIVE, bytes: planArtifact.bytes, sha256: planArtifact.sha256},
      paths: {
        projectRoot: configuration.projectRoot,
        sourceLive: configuration.sourceRoot,
        catalogLive: configuration.catalogRoot,
        receipt: configuration.receiptPath,
        ...paths,
      },
      base: {
        freeze: baseFreeze,
        catalogTreeSha256: baseCatalogInventory.treeSha256,
        currentProfileSha256: "b".repeat(64),
        nativeSwapSourceSha256: "f".repeat(64),
        nativeSwapBuildContract: structuredClone(FIXTURE_NATIVE_BUILD_CONTRACT),
        sourceRootNode: sourceBase.node,
        catalogRootNode: catalogBase.node,
      },
      nativeSwapBuildWitness: fixtureNativeBuildReceipt(),
      nativeSwapBuildWitnessIdentity: fixtureNativeBuildIdentity(),
      parentModes: [],
      directoryNodesBeforeSwap: {
        source: {live: sourceBase.node, staged: sourceStaged.node},
        catalog: {live: catalogBase.node, staged: catalogStaged.node},
      },
      swapReceipts: {},
    });
    let bundleLoaderCalls = 0;
    const result = await recoverPromotion(configuration, {
      requireBuilderValidator: false,
      bundleLoader: async () => {
        bundleLoaderCalls += 1;
        return {planEvidence: planArtifact};
      },
      dependencies: {
        atomicSwap: swapDirectories,
        verifyFreeze: async (sourceRoot) => {
          assert.equal(await readFile(path.join(sourceRoot, "base-source"), "utf8"), "base");
          return baseFreeze;
        },
      },
    });
    assert.equal(bundleLoaderCalls, 0);
    assert.equal(result.status, "recovered-to-base-and-verified");
    assert.equal(result.recoveryAction, "rollback-catalog-then-source");
    assert.deepEqual(swapOrder, ["catalog", "source"]);
    assert.equal(await readFile(path.join(configuration.sourceRoot, "base-source"), "utf8"), "base");
    assert.equal(await readFile(path.join(configuration.catalogRoot, "base-catalog"), "utf8"), "base");
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("receipt-present recovery verifies the committed trees and completes a not-yet-exchanged README", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-receipt-present-before-readme-"),
  ));
  try {
    const fixture = await receiptPresentRecoveryFixture(temporaryRoot, {
      initialPhase: "receipt-published",
    });
    const receiptBefore = await inspectRegularFileNoFollow(
      fixture.configuration.receiptPath,
      {requireSingleLink: true, requireReadOnly: true},
    );
    const sourceBefore = await snapshotDirectoryNode(
      fixture.configuration.sourceRoot,
      "receipt-present source before recovery",
    );
    const catalogBefore = await snapshotDirectoryNode(
      fixture.configuration.catalogRoot,
      "receipt-present catalog before recovery",
    );
    let bundleLoads = 0;
    let readmeExchanges = 0;
    const result = await recoverPromotion(fixture.configuration, {
      requireBuilderValidator: false,
      bundleLoader: async () => {
        bundleLoads += 1;
        return fixture.bundle;
      },
      dependencies: {
        ...fixture.dependencies,
        atomicFileSwap: async (arguments_) => {
          readmeExchanges += 1;
          return fixtureAtomicFileExchange(arguments_);
        },
      },
    });
    assert.equal(result.status, "committed-receipt-reconciled-and-verified");
    assert.equal(bundleLoads, 1);
    assert.equal(readmeExchanges, 1);
    assert.equal(
      result.postCommitReporting.readmeCompareAndSwap.status,
      "swapped-and-parent-fsynced",
    );
    assert.match(
      await readFile(path.join(temporaryRoot, "README.md"), "utf8"),
      /is applied and live-verified/u,
    );
    const reportPath = path.join(
      temporaryRoot,
      "reports/fla-swf-counterpart-successor-2026-08-07.md",
    );
    const report = await inspectRegularFileNoFollow(reportPath, {
      requireSingleLink: true,
      requireReadOnly: true,
    });
    assert.ok(report.bytes > 0);
    const receiptAfter = await inspectRegularFileNoFollow(
      fixture.configuration.receiptPath,
      {requireSingleLink: true, requireReadOnly: true},
    );
    assert.deepEqual(receiptAfter.node, receiptBefore.node);
    assert.equal(receiptAfter.sha256, receiptBefore.sha256);
    assert.deepEqual(
      (await snapshotDirectoryNode(
        fixture.configuration.sourceRoot,
        "receipt-present source after recovery",
      )).node,
      sourceBefore.node,
    );
    assert.deepEqual(
      (await snapshotDirectoryNode(
        fixture.configuration.catalogRoot,
        "receipt-present catalog after recovery",
      )).node,
      catalogBefore.node,
    );
    const journal = JSON.parse(await readFile(fixture.paths.journalPath, "utf8"));
    assert.equal(journal.phase, "committed-and-reported");
    assert.equal(journal.receiptCommitPointPresent, true);
    assert.equal(journal.postCommitReporting.readmeCompareAndSwap.status,
      "swapped-and-parent-fsynced");
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("receipt-present recovery reconciles an exchanged README when the final reporting journal write was missed", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-receipt-present-after-readme-"),
  ));
  try {
    const fixture = await receiptPresentRecoveryFixture(temporaryRoot, {
      initialPhase: "receipt-published",
    });
    let crashExchangeCalls = 0;
    await assert.rejects(
      recoverPromotion(fixture.configuration, {
        requireBuilderValidator: false,
        bundleLoader: async () => fixture.bundle,
        dependencies: {
          ...fixture.dependencies,
          atomicFileSwap: async (arguments_) => {
            crashExchangeCalls += 1;
            await fixtureAtomicFileExchange(arguments_);
            throw new Error("fixture crash after README exchange before reporting journal");
          },
        },
      }),
      /fixture crash after README exchange before reporting journal/u,
    );
    assert.equal(crashExchangeCalls, 1);
    const journalAfterCrash = JSON.parse(
      await readFile(fixture.paths.journalPath, "utf8"),
    );
    assert.equal(journalAfterCrash.phase, "committed-reporting-readme-swap-authorized");
    assert.equal(journalAfterCrash.receiptCommitPointPresent, true);
    assert.deepEqual(
      journalAfterCrash.postCommitReportingProgress.readmeSwapInvocation
        .nativeSwapBuildWitness,
      fixtureNativeBuildReceipt(),
    );
    const readmeAfterCrash = await inspectRegularFileNoFollow(
      path.join(temporaryRoot, "README.md"),
      {requireSingleLink: true},
    );
    assert.match(
      await readFile(path.join(temporaryRoot, "README.md"), "utf8"),
      /is applied and live-verified/u,
    );
    const reportPath = path.join(
      temporaryRoot,
      "reports/fla-swf-counterpart-successor-2026-08-07.md",
    );
    const reportAfterCrash = await inspectRegularFileNoFollow(reportPath, {
      requireSingleLink: true,
      requireReadOnly: true,
    });
    let forbiddenSecondExchangeCalls = 0;
    const result = await recoverPromotion(fixture.configuration, {
      requireBuilderValidator: false,
      bundleLoader: async () => fixture.bundle,
      dependencies: {
        ...fixture.dependencies,
        atomicFileSwap: async () => {
          forbiddenSecondExchangeCalls += 1;
          throw new Error("already-exchanged recovery must not swap README again");
        },
      },
    });
    assert.equal(result.status, "committed-receipt-reconciled-and-verified");
    assert.equal(forbiddenSecondExchangeCalls, 0);
    assert.equal(
      result.postCommitReporting.readmeCompareAndSwap.status,
      "already-swapped-and-reconciled",
    );
    const readmeAfterRecovery = await inspectRegularFileNoFollow(
      path.join(temporaryRoot, "README.md"),
      {requireSingleLink: true},
    );
    assert.deepEqual(readmeAfterRecovery.node, readmeAfterCrash.node);
    assert.equal(readmeAfterRecovery.sha256, readmeAfterCrash.sha256);
    const reportAfterRecovery = await inspectRegularFileNoFollow(reportPath, {
      requireSingleLink: true,
      requireReadOnly: true,
    });
    assert.deepEqual(reportAfterRecovery.node, reportAfterCrash.node);
    assert.equal(reportAfterRecovery.sha256, reportAfterCrash.sha256);
    const journalAfterRecovery = JSON.parse(
      await readFile(fixture.paths.journalPath, "utf8"),
    );
    assert.equal(journalAfterRecovery.phase, "committed-and-reported");
    assert.equal(
      journalAfterRecovery.postCommitReporting.readmeCompareAndSwap.status,
      "already-swapped-and-reconciled",
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("real recoverPromotion closes the exact nlink-2 final-receipt preparing crash state", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-recover-receipt-link-crash-"),
  ));
  try {
    const fixture = await receiptPresentRecoveryFixture(temporaryRoot, {
      initialPhase: "publishing-receipt",
    });
    const preparingPath = path.join(
      path.dirname(fixture.configuration.receiptPath),
      `.${path.basename(fixture.configuration.receiptPath)}.crash-fixture.preparing`,
    );
    await link(fixture.configuration.receiptPath, preparingPath);
    assert.equal((await lstat(fixture.configuration.receiptPath)).nlink, 2);
    const result = await recoverPromotion(fixture.configuration, {
      requireBuilderValidator: false,
      bundleLoader: async () => fixture.bundle,
      dependencies: fixture.dependencies,
    });
    assert.equal(result.status, "committed-receipt-reconciled-and-verified");
    assert.equal((await lstat(fixture.configuration.receiptPath)).nlink, 1);
    await assert.rejects(lstat(preparingPath), (error) => error.code === "ENOENT");
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("real recoverPromotion rejects an nlink-2 receipt without its exact preparing alias", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-recover-receipt-link-invalid-"),
  ));
  try {
    const fixture = await receiptPresentRecoveryFixture(temporaryRoot, {
      initialPhase: "publishing-receipt",
    });
    await link(
      fixture.configuration.receiptPath,
      path.join(path.dirname(fixture.configuration.receiptPath), "foreign-hardlink.json"),
    );
    await assert.rejects(
      recoverPromotion(fixture.configuration, {
        requireBuilderValidator: false,
        bundleLoader: async () => fixture.bundle,
        dependencies: fixture.dependencies,
      }),
      /ambiguous preparing-link closure/u,
    );
    assert.equal((await lstat(fixture.configuration.receiptPath)).nlink, 2);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("prepared resume rejects live catalog/source identity or tree drift", () => {
  const journal = {
    base: {
      freeze: { fileCount: 10, totalBytes: 20, manifestSha256: "a".repeat(64) },
      catalogTreeSha256: "b".repeat(64),
      currentProfileSha256: "c".repeat(64),
      readme: {
        bytes: 100,
        sha256: "e".repeat(64),
        mode: 0o644,
        node: { dev: "1", ino: "4" },
      },
      sourceRootNode: { dev: "1", ino: "2" },
      catalogRootNode: { dev: "1", ino: "3" },
    },
  };
  const evidence = {
    baseFreeze: { fileCount: 10, totalBytes: 20, manifestSha256: "a".repeat(64) },
    catalogInventory: { treeSha256: "b".repeat(64) },
    currentProfile: { evidence: { sha256: "c".repeat(64) } },
    currentReadme: {
      bytes: 100,
      sha256: "e".repeat(64),
      mode: 0o644,
      node: { dev: "1", ino: "4" },
    },
  };
  assert.doesNotThrow(() => assertPreparedBaseUnchanged(evidence, journal, {
    currentSourceNode: { dev: "1", ino: "2" },
    currentCatalogNode: { dev: "1", ino: "3" },
  }));
  assert.throws(() => assertPreparedBaseUnchanged({
    ...evidence,
    catalogInventory: { treeSha256: "d".repeat(64) },
  }, journal, {
    currentSourceNode: { dev: "1", ino: "2" },
    currentCatalogNode: { dev: "1", ino: "3" },
  }), /drift after staging/);
  assert.throws(() => assertPreparedBaseUnchanged(evidence, journal, {
    currentSourceNode: { dev: "1", ino: "999" },
    currentCatalogNode: { dev: "1", ino: "3" },
  }), /drift after staging/);
});

test("recovery observation becomes indeterminate when a recovery root inode is replaced", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-recovery-root-"));
  try {
    const live = path.join(temporaryRoot, "live");
    const recovery = path.join(temporaryRoot, "recovery");
    await mkdir(live);
    await mkdir(recovery);
    const liveBefore = await snapshotDirectoryNode(live, "fixture live");
    const recoveryBefore = await snapshotDirectoryNode(recovery, "fixture recovery");
    const before = { live: liveBefore.node, staged: recoveryBefore.node };
    assert.equal((await observeSwapPair({
      livePath: live, recoveryPath: recovery, before, label: "fixture",
    })).state, "unchanged");
    await rename(recovery, `${recovery}.replaced`);
    await mkdir(recovery);
    assert.equal((await observeSwapPair({
      livePath: live, recoveryPath: recovery, before, label: "fixture",
    })).state, "indeterminate");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("final receipt publication is 0444, single-link, and no-clobber", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-receipt-"));
  const receiptPath = path.join(temporaryRoot, "applied.json");
  try {
    const receipt = {
      schemaVersion: SCHEMA.receipt,
      artifactType: SCHEMA.receiptType,
      lifecycle: "final",
      applied: true,
    };
    const evidence = await publishImmutableJsonNoClobber(receiptPath, receipt, {
      mode: 0o444,
      label: "fixture receipt",
    });
    const information = await lstat(receiptPath);
    assert.equal(information.mode & 0o222, 0);
    assert.equal(information.nlink, 1);
    assert.equal(evidence.nlink, 1);
    await assert.rejects(
      publishImmutableJsonNoClobber(receiptPath, receipt, {
        mode: 0o444,
        label: "fixture receipt",
      }),
      /already exists/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("final receipt publication reconciles only its exact nlink-2 preparing crash state", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-receipt-link-crash-"),
  ));
  const receiptPath = path.join(temporaryRoot, "applied.json");
  const preparingPath = path.join(
    temporaryRoot,
    ".applied.json.12345678-fixture.preparing",
  );
  const contents = Buffer.from("exact receipt bytes\n", "utf8");
  try {
    await writeFile(preparingPath, contents, {flag: "wx", mode: 0o444});
    await chmod(preparingPath, 0o444);
    await link(preparingPath, receiptPath);
    assert.equal((await lstat(receiptPath)).nlink, 2);
    const reconciled = await publishImmutableBytesNoClobber(
      receiptPath,
      contents,
      {mode: 0o444, label: "fixture interrupted final receipt"},
    );
    assert.equal(reconciled.nlink, 1);
    assert.equal(await readFile(receiptPath, "utf8"), contents.toString("utf8"));
    await assert.rejects(lstat(preparingPath), (error) => error.code === "ENOENT");
    await assert.rejects(
      publishImmutableBytesNoClobber(
        receiptPath,
        contents,
        {mode: 0o444, label: "fixture interrupted final receipt"},
      ),
      /already exists/u,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("post-commit README status uses an inode-bound verified exchange, retains the preimage, and is idempotent", async () => {
  const temporaryRoot = await realpath(await mkdtemp(path.join(os.tmpdir(), "counterpart-readme-cas-")));
  const readmePath = path.join(temporaryRoot, "README.md");
  const transactionId = "20260808T000000000Z-aaaaaaaaaaaa";
  const readmeNativeBuildContract = fixtureNativeBuildContract("1".repeat(64));
  try {
    await writeFile(readmePath, "base README\n", {mode: 0o644});
    const base = await inspectRegularFileNoFollow(readmePath, {requireSingleLink: true});
    const replacementBytes = Buffer.from("committed README\n", "utf8");
    const fakeAtomicFileSwap = async ({
      allowedParent,
      firstFile,
      secondFile,
      expectedFirstNode,
      expectedSecondNode,
    }) => {
      const firstBefore = await inspectRegularFileNoFollow(firstFile, {requireSingleLink: true});
      const secondBefore = await inspectRegularFileNoFollow(secondFile, {requireSingleLink: true});
      assert.deepEqual(firstBefore.node, expectedFirstNode);
      assert.deepEqual(secondBefore.node, expectedSecondNode);
      const temporary = path.join(allowedParent, ".fixture-readme-swap");
      await rename(firstFile, temporary);
      await rename(secondFile, firstFile);
      await rename(temporary, secondFile);
      const firstAfter = await inspectRegularFileNoFollow(firstFile, {requireSingleLink: true});
      const secondAfter = await inspectRegularFileNoFollow(secondFile, {requireSingleLink: true});
      return {
        status: "swapped-and-parent-fsynced",
        allowedParent,
        firstFile,
        secondFile,
        before: {first: firstBefore.node, second: secondBefore.node},
        after: {first: firstAfter.node, second: secondAfter.node},
        native: {status: "swapped", parentFsynced: true},
        nativeSourceSha256: "1".repeat(64),
        nativeBuild: fixtureNativeBuildReceipt(readmeNativeBuildContract),
        cleanupWarning: null,
      };
    };
    const configuration = {projectRoot: temporaryRoot};
    const committed = await replaceReadmeStatusCompareAndSwap({
      configuration,
      transactionId,
      expectedBase: base,
      replacementBytes,
      expectedNativeSourceSha256: "1".repeat(64),
      expectedNativeBuildContract: readmeNativeBuildContract,
      expectedNativeBuildReceipt: fixtureNativeBuildReceipt(readmeNativeBuildContract),
      atomicFileSwap: fakeAtomicFileSwap,
    });
    assert.equal(committed.status, "swapped-and-parent-fsynced");
    assert.equal(await readFile(readmePath, "utf8"), "committed README\n");
    assert.equal(
      await readFile(path.join(temporaryRoot, committed.retainedPreimage.path), "utf8"),
      "base README\n",
    );
    assert.deepEqual(committed.retainedPreimage.node, base.node);
    assert.equal(
      await readFile(path.join(temporaryRoot, committed.retainedBaseBackup.path), "utf8"),
      "base README\n",
    );
    const retainedBaseBackup = await lstat(
      path.join(temporaryRoot, committed.retainedBaseBackup.path),
      {bigint: true},
    );
    assert.equal(Number(retainedBaseBackup.mode & 0o777n), 0o444);
    assert.equal(retainedBaseBackup.nlink, 1n);
    assert.notEqual(String(retainedBaseBackup.ino), base.node.ino);

    await assert.rejects(
      replaceReadmeStatusCompareAndSwap({
        configuration,
        transactionId,
        expectedBase: base,
        replacementBytes,
        expectedNativeSourceSha256: "1".repeat(64),
        expectedNativeBuildContract: readmeNativeBuildContract,
        expectedNativeBuildReceipt: fixtureNativeBuildReceipt(readmeNativeBuildContract),
        atomicFileSwap: async () => {
          throw new Error("already-exchanged reconciliation must not swap twice");
        },
        syncParent: async () => {
          throw new Error("fixture parent fsync failure");
        },
      }),
      /fixture parent fsync failure/u,
    );

    const reconciled = await replaceReadmeStatusCompareAndSwap({
      configuration,
      transactionId,
      expectedBase: base,
      replacementBytes,
      expectedNativeSourceSha256: "1".repeat(64),
      expectedNativeBuildContract: readmeNativeBuildContract,
      expectedNativeBuildReceipt: fixtureNativeBuildReceipt(readmeNativeBuildContract),
      atomicFileSwap: async () => {
        throw new Error("idempotent reconciliation must not swap twice");
      },
    });
    assert.equal(reconciled.status, "already-swapped-and-reconciled");
    assert.equal(reconciled.swapReceipt, null);
    assert.equal(reconciled.parentFsynced, true);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("post-commit README exchange preserves a concurrent replacement and fails closed", async () => {
  const temporaryRoot = await realpath(await mkdtemp(path.join(os.tmpdir(), "counterpart-readme-race-")));
  const readmePath = path.join(temporaryRoot, "README.md");
  const readmeNativeBuildContract = fixtureNativeBuildContract("1".repeat(64));
  try {
    await writeFile(readmePath, "base README\n", {mode: 0o644});
    const base = await inspectRegularFileNoFollow(readmePath, {requireSingleLink: true});
    const foreignPath = path.join(temporaryRoot, ".foreign-readme");
    await writeFile(foreignPath, "foreign concurrent README\n", {mode: 0o644});
    await assert.rejects(
      replaceReadmeStatusCompareAndSwap({
        configuration: {projectRoot: temporaryRoot},
        transactionId: "20260808T000000000Z-bbbbbbbbbbbb",
        expectedBase: base,
        replacementBytes: Buffer.from("committed README\n", "utf8"),
        expectedNativeSourceSha256: "1".repeat(64),
        expectedNativeBuildContract: readmeNativeBuildContract,
        expectedNativeBuildReceipt: fixtureNativeBuildReceipt(readmeNativeBuildContract),
        atomicFileSwap: async ({firstFile}) => {
          await rename(foreignPath, firstFile);
          throw new Error("compare-and-swap inode changed before mutation");
        },
      }),
      /inode changed before mutation/u,
    );
    assert.equal(await readFile(readmePath, "utf8"), "foreign concurrent README\n");
    assert.equal(
      await readFile(path.join(
        temporaryRoot,
        ".README.md.fla-swf-counterpart-successor-base-backup-20260808T000000000Z-bbbbbbbbbbbb",
      ), "utf8"),
      "base README\n",
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("executor contains complete staged/profile/freeze/swap/receipt flow and no dated executor dependency", async () => {
  const source = await readFile(
    new URL("./promote-fla-swf-counterpart-successor.mjs", import.meta.url),
    "utf8",
  );
  const transactionSource = await readFile(
    new URL("./lib/fla-swf-counterpart-transaction.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /promote-g4-active-sources/);
  assert.doesNotMatch(transactionSource, /promote-g4-active-sources/);
  assert.match(source, /creating-byte-identical-working-copy/);
  assert.match(source, /building-staged-catalog/);
  assert.match(source, /freezing-staged-source/);
  assert.match(source, /expectedProfileSha256/);
  assert.match(source, /source-swapped/);
  assert.match(source, /catalog-swapped/);
  assert.match(source, /ready-to-publish-receipt/);
  assert.match(source, /inputArtifacts/);
  assert.match(source, /verifyCryptographicSignature/);
  assert.match(source, /finalizePostCommitReporting/);
  assert.match(source, /replaceReadmeStatusCompareAndSwap/);
  assert.match(source, /fla-swf-counterpart-successor-2026-08-07\.md/);
  assert.match(source, /README successor status markers/);
  assert.match(source, /rollbackCatalogThenSource/);
  assert.match(source, /reconcile-forward-commit/);
  const initialStageSource = source.slice(source.indexOf("async function executePromotion"));
  const stagedTransaction = initialStageSource.indexOf("const staged = await stageTransaction(");
  const initialPreparedValidation = initialStageSource.indexOf(
    "await readAndValidatePreparedReceipt(\n      configuration,",
  );
  const independentReviewOpening = initialStageSource.indexOf(
    "const independentReviewOpenedAt",
  );
  assert.ok(stagedTransaction >= 0
    && stagedTransaction < initialPreparedValidation
    && initialPreparedValidation < independentReviewOpening,
  "the physical prepared receipt must pass full machine validation before review opens");
  const resumeSource = source.slice(source.indexOf("async function resumePreparedPromotion"));
  const firstPreparedValidation = resumeSource.indexOf("readAndValidatePreparedReceipt(");
  const independentReviewGate = resumeSource.indexOf("verifyIndependentPreparedReviews(");
  const readyToSwapJournal = resumeSource.indexOf("ready-to-swap-after-independent-review");
  const secondPreparedValidation = resumeSource.indexOf(
    "readAndValidatePreparedReceipt(",
    firstPreparedValidation + 1,
  );
  const sourceSwap = resumeSource.indexOf("const sourceSwap = await dependencies.atomicSwap");
  assert.ok(firstPreparedValidation >= 0
    && firstPreparedValidation < independentReviewGate,
  "full prepared receipt validation must precede independent-review acceptance");
  assert.ok(readyToSwapJournal >= 0
    && readyToSwapJournal < secondPreparedValidation
    && secondPreparedValidation < sourceSwap,
  "full prepared receipt validation must run again immediately before the source swap");
  const finalConstruction = resumeSource.indexOf("const final = finalReceipt(");
  const finalBundleValidation = resumeSource.indexOf(
    "assertFinalReceiptBundleBindings(\n      final,",
  );
  const readyToPublishJournal = resumeSource.indexOf("ready-to-publish-receipt");
  const firstFinalJournalValidation = resumeSource.indexOf(
    "assertFinalReceiptJournalBindings(\n      final,",
  );
  const secondFinalJournalValidation = resumeSource.indexOf(
    "assertFinalReceiptJournalBindings(final, receiptDraftEvidence, transaction)",
  );
  const receiptPublication = resumeSource.indexOf("publishing-receipt");
  assert.ok(finalConstruction >= 0
    && finalConstruction < finalBundleValidation
    && finalBundleValidation < firstFinalJournalValidation
    && firstFinalJournalValidation < readyToPublishJournal
    && readyToPublishJournal < secondFinalJournalValidation
    && secondFinalJournalValidation < receiptPublication,
  "constructed final receipt must pass full validation before ready and again before publication");
  assert.doesNotMatch(executePromotion.toString(),
    /await dependencies\.atomicSwap|phase:\s*"source-swapped"|phase:\s*"catalog-swapped"/,
    "first-stage executePromotion must not contain a direct live swap path");
});
