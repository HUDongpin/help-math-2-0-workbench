import assert from "node:assert/strict";
import {createHash, generateKeyPairSync, sign as cryptographicSign} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AUTHORING_AUDIT_ARTIFACT_TYPE,
  AUTHORING_AUDIT_SCHEMA,
  AUTHORING_WORKING_COPY_PREFIX,
  FAILED_AUTHORING_AUDIT_ARTIFACT_TYPE,
  FAILED_AUTHORING_AUDIT_SCHEMA,
  MANUAL_HOLD_RECEIPT_ARTIFACT_TYPE,
  MANUAL_HOLD_RECEIPT_SCHEMA,
  QUIESCENCE_PROJECT_DEPENDENCIES,
  TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH,
  assertAuthoringWorkingCopyPath,
  assertFailedAuthoringAuditFailure,
  assertImplementationBaselineBindings,
  assertManualHoldReceiptBinding,
  assertNativeAtomicSwapBuildContract,
  assertReviewRecord,
  assertReviewerAuthorizedByRegistry,
  assertAuthoringSessionContract,
  assertUniqueNonOverlappingAuthoringSessions,
  assertUniverse,
  authoringAuditOutcome,
  buildUniverse,
  captureQuiescenceSnapshot,
  commandCheckPlan,
  canonicalJson,
  pathSetDigest,
  pairReviewRecordPayloadDigest,
  parseArguments,
  loadTrustedReviewerRegistry,
  portableRelative,
  prepareAuthoringWorkingCopy,
  prepareUnsignedReviewLedger,
  recordSetDigest,
  scanRelevantProcessCensus,
  secureResolveExistingRegular,
  sha256Text,
  sourceBoundRecordSetDigest,
  validateReviewLedger,
  validateQuiescenceSnapshots,
  verifyDetachedEd25519SignatureArtifact,
  writeImmutableNoClobber,
} from "./build-fla-swf-counterpart-successor-plan.mjs";

const NATIVE_BUILD_CONTRACT_FIXTURE = Object.freeze({
  schemaVersion:
    "help-math-darwin-atomic-directory-swap-native-build-contract/v1",
  source: Object.freeze({
    path: "scripts/lib/darwin-atomic-directory-swap-native.c",
    bytes: 8_000,
    sha256: "a".repeat(64),
  }),
  compiler: Object.freeze({
    path: "/fixture/usr/bin/clang",
    version: "Fixture clang 1.0",
    sdkPath: "/fixture/SDKs/MacOSX.sdk",
  }),
  compile: Object.freeze({
    driver: "/usr/bin/xcrun",
    sdk: "macosx",
    arguments: Object.freeze(["-std=c17", "-O2", "-Wall", "-Wextra", "-Werror"]),
    executableSha256Policy:
      "prepared-witness-and-identical-across-source-catalog-rollback-and-readme-swaps",
  }),
});

const EXPECTED = Object.freeze({
  records: 620,
  totalBytes: 593_608_118,
  uniqueSha256: 618,
  byExtension: Object.freeze({fla: 428, swf: 192}),
  priorDisposition: Object.freeze({
    "candidate-new-source-in-quarantine": 551,
    "hold-historical-custody-review": 61,
    "hold-placement-alias-review": 8,
  }),
  currentDisposition: Object.freeze({
    "candidate-new-source-in-quarantine": 549,
    "hold-historical-custody-review": 61,
    "hold-placement-alias-review": 10,
  }),
  currentHolds: 71,
  pathSetSha256: "138257ae5ebb35d0734a1f21b5fd7d9f6653efa6db0e3aaa5d6a2b135d4f5c47",
  recordSetSha256: "518cd54e8ca28241651810338417da07e3bab14ed8ce416bdcc86329957801f7",
  sourceBoundRecordSetSha256: "719b73fa924c9d6b52e27e763581bb3178f1c8057694a28bda4757be59905f12",
});

let liveUniversePromise;

function liveUniverse() {
  liveUniversePromise ??= buildUniverse();
  return liveUniversePromise;
}

function universeIdentity(universe) {
  const serialized = canonicalJson(universe);
  return {
    bytes: Buffer.byteLength(serialized),
    sha256: sha256Text(serialized),
  };
}

test("native atomic-swap plan contract rejects source, toolchain, flag, policy, and schema drift", () => {
  assert.equal(
    assertNativeAtomicSwapBuildContract(NATIVE_BUILD_CONTRACT_FIXTURE),
    NATIVE_BUILD_CONTRACT_FIXTURE,
  );
  for (const mutate of [
    (value) => { value.source.path = "scripts/lib/other.c"; },
    (value) => { value.source.sha256 = "not-a-digest"; },
    (value) => { value.compiler.path = "relative/clang"; },
    (value) => { value.compiler.version = ""; },
    (value) => { value.compiler.sdkPath = "relative/sdk"; },
    (value) => { value.compile.arguments[1] = "-O0"; },
    (value) => { value.compile.executableSha256Policy = "unbound"; },
    (value) => { value.unexpected = true; },
  ]) {
    const changed = structuredClone(NATIVE_BUILD_CONTRACT_FIXTURE);
    mutate(changed);
    assert.throws(
      () => assertNativeAtomicSwapBuildContract(changed),
      /changed|invalid|unexpected|binding|contract/u,
    );
  }
});

test("implementation baseline completion identity is plan-hash-bound and rejects replacement or tamper", () => {
  const receiptIdentity = {
    path:
      "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json",
    bytes: 12_345,
    sha256: "1".repeat(64),
  };
  const completionIdentity = {
    path:
      "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline-complete.json",
    bytes: 456,
    sha256: "2".repeat(64),
  };
  const repositoryBaseline = {
    implementationVerificationReceipt: structuredClone(receiptIdentity),
    implementationVerificationCompletion: structuredClone(completionIdentity),
  };
  assert.equal(
    assertImplementationBaselineBindings(repositoryBaseline, {
      receiptIdentity,
      completionIdentity,
    }),
    repositoryBaseline,
  );
  const originalPlanPreimageSha256 = sha256Text(canonicalJson({repositoryBaseline}));
  for (const [label, mutate] of [
    ["replacement path", (value) => {
      value.implementationVerificationCompletion.path =
        "catalog/source-promotions/replacement-complete.json";
    }],
    ["replacement bytes", (value) => {
      value.implementationVerificationCompletion.bytes += 1;
    }],
    ["tampered digest", (value) => {
      value.implementationVerificationCompletion.sha256 = "3".repeat(64);
    }],
    ["unbound field", (value) => {
      value.implementationVerificationCompletion.unbound = true;
    }],
  ]) {
    const changed = structuredClone(repositoryBaseline);
    mutate(changed);
    assert.notEqual(
      sha256Text(canonicalJson({repositoryBaseline: changed})),
      originalPlanPreimageSha256,
      `${label} must change the executable-plan preimage digest`,
    );
    assert.throws(
      () => assertImplementationBaselineBindings(changed, {
        receiptIdentity,
        completionIdentity,
      }),
      /completion|unexpected keys/u,
      label,
    );
  }
});

async function makeTemporaryRoot(prefix) {
  const created = await mkdtemp(path.join(os.tmpdir(), prefix));
  return {created, resolved: await realpath(created)};
}

function completeReviewMetadata(record) {
  Object.assign(record.fla, {
    animateVersion: "Adobe Animate fixture",
    documentType: "legacy-flash-document",
    stage: structuredClone(record.swf.stage),
    fps: 12,
    rootTimeline: {name: "Scene 1", frameCount: 1, layerCount: 1},
    nestedTimelines: [],
    keyframes: [{timelinePath: "Scene 1", layerName: "Layer 1", frameIndex: 0}],
    frameLabels: [],
    stops: [],
    actionScript: {generation: "AS1/2", documentClass: null, frameScriptCount: 0, symbolScriptCount: 0},
    publishProfile: {name: "fixture", targetPlayer: "Flash Player 10", actionScriptVersion: "AS1/2", htmlWrapper: false},
    linkageExports: [],
    toolVersions: [{tool: "Adobe Animate", version: "fixture"}],
  });
  Object.assign(record.swf, {
    actionScriptGeneration: "AS1/2",
    tags: [],
    frameLabels: [],
    scripts: [],
    exports: [],
  });
  record.placement.conclusion = "not-confirmed";
  record.placement.toolVersions = [{tool: "placement-audit", version: "fixture"}];
  for (const field of Object.keys(record.comparison)) record.comparison[field] = "indeterminate";
  record.lineage = {
    conclusion: "not-confirmed",
    evidenceArtifacts: [{path: "work/fixtures/lineage-evidence.json", bytes: 1, sha256: "1".repeat(64)}],
  };
  record.authoringAuditReceipt = {
    path: "work/fixtures/authoring-audit.json",
    bytes: 1,
    sha256: "2".repeat(64),
  };
  record.review = {
    decision: "unresolved",
    terminal: true,
    reviewerSubjectId: "fixture-reviewer",
    reviewedAt: "2026-08-08T02:00:00.000Z",
    notes: "Explicit terminal unresolved after complete metadata and authoring review.",
  };
  return record;
}

function resignManualReceipt(receipt) {
  const payload = structuredClone(receipt);
  delete payload.signedPayloadSha256;
  delete payload.signatureEnvelope;
  const digest = sha256Text(canonicalJson(payload));
  receipt.signedPayloadSha256 = digest;
  receipt.signatureEnvelope = {
    reviewerSubjectId: receipt.reviewer.subjectId,
    signedPayloadSha256: digest,
    artifact: {path: "work/fixtures/manual-signature.json", bytes: 1, sha256: "9".repeat(64)},
  };
  return receipt;
}

function manualReceiptFixture({universe, ledger, reviewRecord}) {
  const identity = universeIdentity(universe);
  const reviewer = {
    subjectId: "fixture-reviewer",
    fullName: "Fixture Reviewer",
    role: "reviewer",
    publicKeySpkiSha256: "a".repeat(64),
  };
  const reviewCandidateIdentity = {
    path: "work/fla-swf-counterpart-successor-review/fla-swf-counterpart-successor-2026-08-07-v2-pair-review-ledger.unsigned.json",
    bytes: 2_088_275,
    sha256: "3f787bbf4f602311a4330e703331be05b7d2cd78fb8606d1f6e55da76e51a033",
  };
  const authoringReceipt = {
    reviewedAt: "2026-08-08T01:05:00.000Z",
    processSession: {endedAt: "2026-08-08T01:00:00.000Z"},
  };
  const universeRecord = universe.records.find((record) => record.recordId === reviewRecord.recordId);
  const receipt = resignManualReceipt({
    schemaVersion: MANUAL_HOLD_RECEIPT_SCHEMA,
    artifactType: MANUAL_HOLD_RECEIPT_ARTIFACT_TYPE,
    universe: {
      sha256: identity.sha256,
      recordSetSha256: universe.digests.recordSetSha256,
      sourceBoundRecordSetSha256: universe.digests.sourceBoundRecordSetSha256,
    },
    record: {
      recordId: universeRecord.recordId,
      canonicalPath: universeRecord.canonicalPath,
      sourceBindingSha256: universeRecord.sourceBindingSha256,
      currentDisposition: universeRecord.currentDisposition,
    },
    reviewContract: {
      reviewLedgerSchemaVersion: ledger.schemaVersion,
      reviewLedgerArtifactType: ledger.artifactType,
      reviewCandidate: reviewCandidateIdentity,
      decisionContractSha256: sha256Text(canonicalJson(ledger.decisionContract)),
    },
    pairReviewRecord: {
      payloadSha256: pairReviewRecordPayloadDigest(reviewRecord),
      terminalDecision: reviewRecord.review.decision,
      reviewedAt: reviewRecord.review.reviewedAt,
      reviewerSubjectId: reviewRecord.review.reviewerSubjectId,
      sourceBindingSha256: reviewRecord.sourceBindingSha256,
      authoringAuditReceipt: reviewRecord.authoringAuditReceipt,
      publicationLineageReceipt: reviewRecord.publicationLineageReceipt,
      lineageEvidenceArtifacts: reviewRecord.lineage.evidenceArtifacts,
    },
    decision: reviewRecord.manualHoldReview.decision,
    reviewer,
    reviewedAt: "2026-08-08T03:00:00.000Z",
    evidenceArtifacts: [{path: "work/fixtures/manual-evidence.json", bytes: 1, sha256: "8".repeat(64)}],
  });
  const context = {
    universe: {value: universe, identity},
    universeRecord,
    reviewLedger: ledger,
    reviewRecord,
    reviewCandidateIdentity,
    authoringReceipt,
    publicationLineageReceipt: null,
    ledgerReviewers: new Map([[reviewer.subjectId, reviewer]]),
  };
  return {receipt, context};
}

test("physically rederives the exact 620-record successor universe", async () => {
  const universe = await liveUniverse();

  assert.equal(assertUniverse(universe), universe);
  assert.equal(universe.summary.records, EXPECTED.records);
  assert.equal(universe.summary.totalBytes, EXPECTED.totalBytes);
  assert.equal(universe.summary.uniqueSha256, EXPECTED.uniqueSha256);
  assert.deepEqual(universe.summary.byExtension, EXPECTED.byExtension);
  assert.equal(universe.derivation.candidateFlaForCanonicalSwfOnly, 428);
  assert.equal(universe.derivation.candidateSwfForCanonicalFlaOnly, 192);
  assert.equal(universe.summary.manifestMismatches, 0);
  assert.equal(universe.summary.physicalRehashMismatches, 0);
  assert.equal(universe.summary.exactCanonicalTargetsAlreadyPresent, 0);
  assert.equal(universe.summary.counterpartPhysicalFilesVerified, 620);
  assert.equal(universe.summary.counterpartPhysicalRehashMismatches, 0);
  assert.deepEqual(universe.summary.byScope, {
    DIG: {fla: 161, swf: 156, records: 317, bytes: 30_656_989},
    ELMGR3: {fla: 98, swf: 21, records: 119, bytes: 206_601_345},
    ELMGR4: {fla: 90, swf: 5, records: 95, bytes: 172_669_194},
    ELMGR5: {fla: 79, swf: 10, records: 89, bytes: 183_680_590},
  });

  assert.deepEqual(universe.summary.priorDisposition, EXPECTED.priorDisposition);
  assert.deepEqual(universe.summary.currentDisposition, EXPECTED.currentDisposition);
  assert.equal(universe.summary.currentHoldRecords, EXPECTED.currentHolds);
  assert.equal(universe.summary.currentAutomaticCopyAllowed, 0);
  assert.equal(
    universe.records.filter((record) => record.automaticCopyAllowed).length,
    0,
  );

  assert.equal(pathSetDigest(universe.records), EXPECTED.pathSetSha256);
  assert.equal(recordSetDigest(universe.records), EXPECTED.recordSetSha256);
  assert.equal(
    sourceBoundRecordSetDigest(universe.records),
    EXPECTED.sourceBoundRecordSetSha256,
  );
  assert.equal(universe.digests.pathSetSha256, EXPECTED.pathSetSha256);
  assert.equal(universe.digests.recordSetSha256, EXPECTED.recordSetSha256);
  assert.equal(
    universe.digests.sourceBoundRecordSetSha256,
    EXPECTED.sourceBoundRecordSetSha256,
  );

  assert.equal(new Set(universe.records.map((record) => record.canonicalPath)).size, 620);
  assert.equal(new Set(universe.records.map((record) => record.sha256)).size, 618);
  assert.equal(universe.diagnostics.duplicateSha256PlacementGroups.length, 2);
  assert.equal(universe.diagnostics.candidateSwf.count, 192);
  assert.equal(universe.diagnostics.candidateSwf.parseErrors, 0);
  assert.equal(universe.diagnostics.existingCounterpartSwf.count, 428);
  assert.equal(universe.diagnostics.existingCounterpartSwf.parseErrors, 0);
  assert.deepEqual(universe.diagnostics.candidateFlaContainers, {
    "compound-binary": 428,
  });

  for (const record of universe.records) {
    assert.match(record.sha256, /^[a-f0-9]{64}$/u);
    assert.equal(record.manifestRelativePath, record.sourceBinding.manifestRelativePath);
    assert.equal(record.quarantineRelativePath, record.sourceBinding.quarantineRelativePath);
    assert.equal(record.sourceManifest.recordPath, record.manifestRelativePath);
    assert.equal(record.sourceManifest.path, record.sourceBinding.manifestArtifact.path);
    assert.equal(record.sourceManifest.bytes, record.sourceBinding.manifestArtifact.bytes);
    assert.equal(record.sourceManifest.sha256, record.sourceBinding.manifestArtifact.sha256);
    assert.equal(
      record.sourceManifest.checksumSetSha256,
      record.sourceBinding.manifestArtifact.checksumSetSha256,
    );
    assert.equal(record.sourceIntakePlan.path, record.sourceBinding.intakePlanArtifact.path);
    assert.equal(record.sourceIntakePlan.bytes, record.sourceBinding.intakePlanArtifact.bytes);
    assert.equal(record.sourceIntakePlan.sha256, record.sourceBinding.intakePlanArtifact.sha256);
    assert.equal(record.existingCounterpart.path, record.existingCounterpart.canonicalPath);
    assert.equal(record.pairReviewStatus, "pending-unsigned-review");
    assert.equal(record.placementReviewStatus, "pending-review");
    assert.equal(record.publicationLineageStatus, "unresolved");
    assert.equal(
      record.priorIntakeDecision,
      record.priorDisposition === "candidate-new-source-in-quarantine" ? "candidate" : "hold",
    );
  }
});

test("keeps the dated 551/61/8 intake classification distinct from the current 549/61/10 classification", async () => {
  const universe = await liveUniverse();
  const drifted = universe.diagnostics.priorCandidateNowCurrentPlacementAliases;

  assert.equal(drifted.length, 2);
  assert.deepEqual(
    drifted.map((record) => ({
      canonicalPath: record.canonicalPath,
      sha256: record.sha256,
      currentCanonicalHashMatchPaths: record.currentCanonicalHashMatchPaths,
    })),
    [
      {
        canonicalPath: "HELP_COURSES/ELMGR4/L2/RW/L2RW01.fla",
        sha256: "8fbec3e8064ab4aa5c373f782988745810ae7a18cd0496280b2e5e7ff29e6f68",
        currentCanonicalHashMatchPaths: [
          "HELP_COURSES/ELMGR4/L2/IR/L2RW01.fla",
        ],
      },
      {
        canonicalPath: "HELP_COURSES/ELMGR4/L5/RW/L5RW01.swf",
        sha256: "fb744328c0114e9687bb2eced5afbc32d3b9dae642327b754250cf90232f3f89",
        currentCanonicalHashMatchPaths: [
          "HELP_COURSES/ELMGR4/L5/IR/L5RW01.swf",
        ],
      },
    ],
  );

  for (const drift of drifted) {
    const record = universe.records.find(({canonicalPath}) => canonicalPath === drift.canonicalPath);
    assert.equal(record.priorDisposition, "candidate-new-source-in-quarantine");
    assert.equal(record.currentDisposition, "hold-placement-alias-review");
    assert.equal(record.automaticCopyAllowed, false);
    assert.equal(
      record.promotionEligibility,
      "withheld-pending-manual-review",
    );
  }
});

test("source-bound digest binds source path, manifest row, and both dispositions", async () => {
  const universe = await liveUniverse();
  const mutations = [
    (record) => {
      record.sourceBinding.quarantineRelativePath =
        `${record.sourceBinding.quarantineRelativePath}.tampered`;
    },
    (record) => {
      record.sourceBinding.manifestEntry.path =
        `${record.sourceBinding.manifestEntry.path}.tampered`;
    },
    (record) => {
      record.priorDisposition = `${record.priorDisposition}-tampered`;
    },
    (record) => {
      record.currentDisposition = `${record.currentDisposition}-tampered`;
    },
  ];

  for (const mutate of mutations) {
    const changed = structuredClone(universe.records);
    mutate(changed[0]);
    assert.equal(recordSetDigest(changed), EXPECTED.recordSetSha256);
    assert.notEqual(
      sourceBoundRecordSetDigest(changed),
      EXPECTED.sourceBoundRecordSetSha256,
    );
  }

  const tamperedArtifact = structuredClone(universe);
  tamperedArtifact.digests.sourceBoundRecordSetSha256 = "0".repeat(64);
  assert.throws(
    () => assertUniverse(tamperedArtifact),
    /source-bound digest is invalid/u,
  );
});

test("prepares 620 unsigned, nonterminal pair reviews and isolates all 71 current holds", async () => {
  const universe = await liveUniverse();
  const identity = universeIdentity(universe);
  const ledger = prepareUnsignedReviewLedger(universe, {
    universeBytes: identity.bytes,
    universeSha256: identity.sha256,
  });

  assert.equal(ledger.records.length, 620);
  assert.deepEqual(ledger.summary, {
    records: 620,
    terminalReviews: 0,
    confirmedPublicationLineage: 0,
    unresolved: 620,
    currentHolds: 71,
    completedManualHoldReceipts: 0,
    automaticApprovals: 0,
  });
  assert.equal(ledger.attestation.state, "unsigned-machine-preparation");
  assert.equal(ledger.attestation.reviewPayloadSha256, null);
  assert.deepEqual(ledger.attestation.reviewers, []);
  assert.deepEqual(ledger.attestation.signatureEnvelopes, []);
  assert.equal(ledger.records.filter((record) => record.review.terminal).length, 0);
  assert.equal(
    ledger.records.filter((record) => record.review.decision === "unresolved").length,
    620,
  );
  assert.equal(
    ledger.records.filter((record) => record.manualHoldReview.required).length,
    71,
  );
  assert.equal(
    ledger.records.filter((record) => record.manualHoldReview.decision === "pending").length,
    71,
  );
  assert.equal(
    ledger.records.filter((record) => record.manualHoldReview.decision === "not-required").length,
    549,
  );
  assert.equal(
    ledger.records.filter((record) => record.manualHoldReview.receipt !== null).length,
    0,
  );

  const validation = await validateReviewLedger(ledger, {
    universe,
    universeIdentity: identity,
  });
  assert.equal(validation.status, "unsigned-machine-preparation");
  assert.equal(validation.terminal, false);
  assert.deepEqual(validation.summary, ledger.summary);
  await assert.rejects(
    validateReviewLedger(ledger, {
      universe,
      universeIdentity: identity,
      requireTerminal: true,
    }),
    /terminal manual decision|Unsigned review ledger cannot satisfy terminal review gate/iu,
  );
});

test("rejects review-ledger identity and SWF metadata tampering", async () => {
  const universe = await liveUniverse();
  const identity = universeIdentity(universe);
  const ledger = prepareUnsignedReviewLedger(universe, {
    universeBytes: identity.bytes,
    universeSha256: identity.sha256,
  });

  const identityTamper = structuredClone(ledger);
  identityTamper.records[0].sourceBindingSha256 = "0".repeat(64);
  await assert.rejects(
    validateReviewLedger(identityTamper, {universe, universeIdentity: identity}),
    /Review source binding changed/u,
  );

  const swfTamper = structuredClone(ledger);
  swfTamper.records[0].swf.version += 1;
  await assert.rejects(
    validateReviewLedger(swfTamper, {universe, universeIdentity: identity}),
    /Review SWF header facts changed/u,
  );

  const dispositionTamper = structuredClone(ledger);
  dispositionTamper.records[0].placement.currentDisposition =
    "hold-placement-alias-review";
  await assert.rejects(
    validateReviewLedger(dispositionTamper, {universe, universeIdentity: identity}),
    /Current disposition changed in review/u,
  );
});

test("confirmed publication lineage cannot rely on an arbitrary evidence reference", async () => {
  const universe = await liveUniverse();
  const identity = universeIdentity(universe);
  const ledger = prepareUnsignedReviewLedger(universe, {
    universeBytes: identity.bytes,
    universeSha256: identity.sha256,
  });
  const index = universe.records.findIndex((record) =>
    record.currentDisposition === "candidate-new-source-in-quarantine");
  const review = completeReviewMetadata(structuredClone(ledger.records[index]));
  const frozen = universe.records[index];
  review.placement.conclusion = "confirmed";
  for (const key of Object.keys(review.comparison)) review.comparison[key] = "consistent";
  const arbitraryEvidence = {path: "work/fixture/evidence.json", bytes: 1, sha256: "1".repeat(64)};
  review.lineage = {conclusion: "confirmed", evidenceArtifacts: [arbitraryEvidence]};
  review.authoringAuditReceipt = {path: "work/fixture/authoring.json", bytes: 1, sha256: "2".repeat(64)};
  review.review = {
    decision: "confirmed-publication-lineage",
    terminal: true,
    reviewerSubjectId: "fixture-reviewer",
    reviewedAt: "2026-08-08T00:00:00.000Z",
    notes: "Fixture review deliberately lacks the required publication-lineage wrapper.",
  };
  assert.throws(
    () => assertReviewRecord(review, frozen, {requireTerminal: true}),
    /Publication-lineage receipt/u,
  );
});

test("every terminal review including unresolved requires complete typed metadata and an authoring receipt", async () => {
  const universe = await liveUniverse();
  const identity = universeIdentity(universe);
  const ledger = prepareUnsignedReviewLedger(universe, {
    universeBytes: identity.bytes,
    universeSha256: identity.sha256,
  });
  const index = universe.records.findIndex((record) => record.currentDisposition === "candidate-new-source-in-quarantine");
  const frozen = universe.records[index];
  const valid = completeReviewMetadata(structuredClone(ledger.records[index]));
  assert.equal(assertReviewRecord(valid, frozen, {requireTerminal: true}), valid);

  const missingAuthoring = structuredClone(valid);
  missingAuthoring.authoringAuditReceipt = null;
  assert.throws(
    () => assertReviewRecord(missingAuthoring, frozen, {requireTerminal: true}),
    /Animate authoring audit receipt/u,
  );

  for (const [mutate, pattern] of [
    [(record) => { record.fla.rootTimeline = {}; }, /rootTimeline fields changed/u],
    [(record) => { record.swf.tags = [{}]; }, /tags\[0\] fields changed/u],
    [(record) => { record.placement.variants = [{}]; }, /variants\[0\] fields changed/u],
    [(record) => { record.comparison.timeline = "looks-good"; }, /comparison.*timeline enum is invalid/iu],
    [(record) => { record.fla.documentType = "unknown-document"; }, /documentType enum is invalid/u],
    [(record) => { record.fla.fps = "12"; }, /fps must be a positive finite number/u],
  ]) {
    const changed = structuredClone(valid);
    mutate(changed);
    assert.throws(() => assertReviewRecord(changed, frozen, {requireTerminal: true}), pattern);
  }
});

test("typed adverse findings cannot be overridden and multiple findings use a deterministic primary decision", async () => {
  const universe = await liveUniverse();
  const identity = universeIdentity(universe);
  const ledger = prepareUnsignedReviewLedger(universe, {
    universeBytes: identity.bytes,
    universeSha256: identity.sha256,
  });
  const index = universe.records.findIndex((record) => record.currentDisposition === "candidate-new-source-in-quarantine");
  const frozen = universe.records[index];
  const valid = completeReviewMetadata(structuredClone(ledger.records[index]));
  const publicationReceipt = {path: "work/fixtures/publication-lineage.json", bytes: 1, sha256: "4".repeat(64)};
  valid.placement.conclusion = "confirmed";
  valid.lineage = {conclusion: "confirmed", evidenceArtifacts: [publicationReceipt]};
  valid.publicationLineageReceipt = publicationReceipt;
  for (const field of Object.keys(valid.comparison)) valid.comparison[field] = "consistent";
  valid.review.decision = "confirmed-publication-lineage";
  assert.equal(assertReviewRecord(valid, frozen, {requireTerminal: true}), valid);

  const mismatchClaimedConfirmed = structuredClone(valid);
  mismatchClaimedConfirmed.comparison.timeline = "mismatch";
  assert.throws(
    () => assertReviewRecord(mismatchClaimedConfirmed, frozen, {requireTerminal: true}),
    /primary terminal decision timeline-or-version-mismatch/u,
  );

  const placementClaimedConfirmed = structuredClone(valid);
  placementClaimedConfirmed.placement.conclusion = "conflict";
  assert.throws(
    () => assertReviewRecord(placementClaimedConfirmed, frozen, {requireTerminal: true}),
    /primary terminal decision placement-conflict|confirmed placement/iu,
  );

  const mismatchDecisionWithoutMismatch = structuredClone(valid);
  mismatchDecisionWithoutMismatch.review.decision = "timeline-or-version-mismatch";
  mismatchDecisionWithoutMismatch.publicationLineageReceipt = null;
  mismatchDecisionWithoutMismatch.lineage.conclusion = "not-confirmed";
  assert.throws(
    () => assertReviewRecord(mismatchDecisionWithoutMismatch, frozen, {requireTerminal: true}),
    /requires a comparison mismatch/u,
  );

  const combinedMismatchAndPlacement = structuredClone(valid);
  combinedMismatchAndPlacement.publicationLineageReceipt = null;
  combinedMismatchAndPlacement.lineage = {
    conclusion: "not-confirmed",
    evidenceArtifacts: [publicationReceipt],
  };
  combinedMismatchAndPlacement.comparison.timeline = "mismatch";
  combinedMismatchAndPlacement.placement.conclusion = "conflict";
  combinedMismatchAndPlacement.review.decision = "placement-conflict";
  assert.equal(
    assertReviewRecord(combinedMismatchAndPlacement, frozen, {requireTerminal: true}),
    combinedMismatchAndPlacement,
  );

  const combinedWithLineageContradiction = structuredClone(combinedMismatchAndPlacement);
  combinedWithLineageContradiction.lineage.conclusion = "contradicted";
  combinedWithLineageContradiction.review.decision = "contradicted";
  assert.equal(
    assertReviewRecord(combinedWithLineageContradiction, frozen, {requireTerminal: true}),
    combinedWithLineageContradiction,
  );
});

test("failed authoring attempts are explicit, evidence-bound, unresolved-only, and path-restricted", () => {
  const unresolved = {review: {decision: "unresolved"}};
  const failed = {
    schemaVersion: FAILED_AUTHORING_AUDIT_SCHEMA,
    artifactType: FAILED_AUTHORING_AUDIT_ARTIFACT_TYPE,
  };
  assert.equal(authoringAuditOutcome(failed, unresolved), "failed-authoring-attempt");
  assert.throws(
    () => authoringAuditOutcome(failed, {review: {decision: "confirmed-publication-lineage"}}),
    /only an explicit terminal unresolved/u,
  );
  assert.equal(
    authoringAuditOutcome({schemaVersion: AUTHORING_AUDIT_SCHEMA, artifactType: AUTHORING_AUDIT_ARTIFACT_TYPE}, unresolved),
    "completed-read-only-authoring-audit",
  );
  assert.equal(
    assertAuthoringWorkingCopyPath(`${AUTHORING_WORKING_COPY_PREFIX}/record-1/source.fla`, "record-1"),
    `${AUTHORING_WORKING_COPY_PREFIX}/record-1/source.fla`,
  );
  assert.throws(
    () => assertAuthoringWorkingCopyPath("work/fixtures/source.fla", "record-1"),
    /must be inside/u,
  );
  assert.equal(assertFailedAuthoringAuditFailure({
    stage: "open-document",
    code: "ANIMATE_OPEN_FAILED",
    message: "Animate rejected the legacy FLA without saving it.",
    evidenceArtifacts: [{path: "work/fixtures/animate-failure.json", bytes: 1, sha256: "5".repeat(64)}],
  }).code, "ANIMATE_OPEN_FAILED");
  assert.throws(
    () => assertFailedAuthoringAuditFailure({stage: "open-document", code: "FAIL", message: "failed", evidenceArtifacts: []}),
    /requires immutable failure evidence/u,
  );
  assert.doesNotThrow(() => assertAuthoringSessionContract({
    sessionId: "failed-session",
    freshSession: true,
    tool: "Adobe Animate",
    version: "fixture",
    startedAt: "2026-08-08T00:00:00.000Z",
    endedAt: "2026-08-08T00:01:00.000Z",
  }, {
    legacyConversionWarning: {present: false, confirmed: false},
    otherInteractions: [],
  }, {failedAttempt: true}));
});

test("signed authority requires a separately provisioned immutable trusted-reviewer registry", async () => {
  const fixture = await makeTemporaryRoot("help-math-successor-trust-registry-");
  try {
    const universe = await liveUniverse();
    const serialized = canonicalJson(universe);
    const identity = {
      path: "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-universe.json",
      bytes: Buffer.byteLength(serialized),
      sha256: sha256Text(serialized),
    };
    await assert.rejects(loadTrustedReviewerRegistry({root: fixture.resolved, universeIdentity: identity}), /registry is missing/u);
    const authorized = {
      subjectId: "authorized-reviewer",
      fullName: "Authorized Reviewer",
      allowedRoles: [
        "pair-reviewer",
        "owner-reviewer",
        "schema-reviewer",
      ],
      publicKeySpkiSha256: "a".repeat(64),
    };
    const authorizedTransactionReviewer = {
      subjectId: "authorized-transaction-reviewer",
      fullName: "Authorized Transaction Reviewer",
      allowedRoles: ["transaction-adversarial-reviewer"],
      publicKeySpkiSha256: "b".repeat(64),
    };
    const registry = {
      schemaVersion: "help-math-fla-swf-counterpart-trusted-reviewer-registry/v1",
      artifactType: "help-math-fla-swf-counterpart-trusted-reviewer-registry",
      authorizedAt: "2026-08-08T00:00:00.000Z",
      universe: identity,
      reviewers: [authorized, authorizedTransactionReviewer],
      evidenceBoundary: {
        externallyProvisioned: true,
        generatedBySuccessorTools: false,
        templateIsAuthority: false,
        authorityScope: "v2-successor-review-signers-only",
      },
    };
    await writeImmutableNoClobber(
      path.join(fixture.resolved, TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH),
      canonicalJson(registry),
    );
    const context = await loadTrustedReviewerRegistry({root: fixture.resolved, universeIdentity: identity});
    const ledgerReviewer = {
      subjectId: authorized.subjectId,
      fullName: authorized.fullName,
      role: "pair-reviewer",
      publicKeySpkiSha256: authorized.publicKeySpkiSha256,
    };
    assert.equal(assertReviewerAuthorizedByRegistry(ledgerReviewer, context).subjectId, authorized.subjectId);
    assert.throws(
      () => assertReviewerAuthorizedByRegistry({...ledgerReviewer, publicKeySpkiSha256: "b".repeat(64)}, context),
      /differs from external trusted reviewer authorization/u,
    );
    assert.throws(
      () => assertReviewerAuthorizedByRegistry({...ledgerReviewer, role: "unauthorized-role"}, context),
      /differs from external trusted reviewer authorization/u,
    );

    const dualOnlyRoot = path.join(fixture.resolved, "dual-only");
    await mkdir(path.dirname(path.join(dualOnlyRoot, TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH)), {
      recursive: true,
    });
    const dualOnly = structuredClone(registry);
    dualOnly.reviewers = [{
      ...authorized,
      allowedRoles: [
        "pair-reviewer",
        "owner-reviewer",
        "schema-reviewer",
        "transaction-adversarial-reviewer",
      ],
    }];
    await writeImmutableNoClobber(
      path.join(dualOnlyRoot, TRUSTED_REVIEWER_REGISTRY_RELATIVE_PATH),
      canonicalJson(dualOnly),
    );
    await assert.rejects(
      loadTrustedReviewerRegistry({root: dualOnlyRoot, universeIdentity: identity}),
      /cannot supply distinct schema and transaction reviewers/u,
    );
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
  await assert.rejects(loadTrustedReviewerRegistry({
    universeIdentity: {
      path: "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-universe.json",
      bytes: 2_763_439,
      sha256: "887122b2abefc3ca7492be3baafc39cfbf4a5f1b0195c11985e41c48482e6098",
    },
  }), /registry is missing/u);
});

test("detached reviewer signatures reject invalid signatures, key substitution, payload tamper, subject mismatch, and stale signing", async () => {
  const fixture = await makeTemporaryRoot("help-math-successor-signature-");
  try {
    const first = generateKeyPairSync("ed25519");
    const second = generateKeyPairSync("ed25519");
    const firstDer = first.publicKey.export({format: "der", type: "spki"});
    const secondDer = second.publicKey.export({format: "der", type: "spki"});
    const payloadSha256 = "c".repeat(64);
    const reviewer = {
      subjectId: "crypto-reviewer",
      fullName: "Cryptographic Reviewer",
      role: "pair-reviewer",
      publicKeySpkiSha256: createHash("sha256").update(firstDer).digest("hex"),
    };

    async function publish(name, overrides = {}, {key = first.privateKey, publicDer = firstDer} = {}) {
      const value = {
        schemaVersion: "help-math-reviewer-detached-ed25519-signature/v1",
        artifactType: "help-math-reviewer-detached-ed25519-signature",
        algorithm: "Ed25519",
        reviewerSubjectId: reviewer.subjectId,
        publicKeySpkiSha256: reviewer.publicKeySpkiSha256,
        publicKeySpkiDerBase64: publicDer.toString("base64"),
        signedPayloadSha256: payloadSha256,
        signedAt: "2026-08-08T04:00:00.000Z",
        signatureBase64: cryptographicSign(null, Buffer.from(payloadSha256, "utf8"), key).toString("base64"),
        ...overrides,
      };
      const written = await writeImmutableNoClobber(path.join(fixture.resolved, name), canonicalJson(value));
      return {path: name, bytes: written.bytes, sha256: written.sha256};
    }

    const valid = await publish("valid.json");
    assert.equal((await verifyDetachedEd25519SignatureArtifact(valid, {
      root: fixture.resolved,
      reviewer,
      payloadSha256,
      minimumSignedAt: "2026-08-08T03:00:00.000Z",
    })).reviewerSubjectId, reviewer.subjectId);

    const invalidSignature = await publish("invalid-signature.json", {
      signatureBase64: cryptographicSign(null, Buffer.from("d".repeat(64), "utf8"), first.privateKey).toString("base64"),
    });
    await assert.rejects(verifyDetachedEd25519SignatureArtifact(invalidSignature, {
      root: fixture.resolved, reviewer, payloadSha256, minimumSignedAt: "2026-08-08T03:00:00.000Z",
    }), /detached Ed25519 signature is invalid/u);

    const keySubstitution = await publish("key-substitution.json", {}, {key: second.privateKey, publicDer: secondDer});
    await assert.rejects(verifyDetachedEd25519SignatureArtifact(keySubstitution, {
      root: fixture.resolved, reviewer, payloadSha256, minimumSignedAt: "2026-08-08T03:00:00.000Z",
    }), /public-key substitution|fingerprint drift/u);

    const payloadTamper = await publish("payload-tamper.json");
    await assert.rejects(verifyDetachedEd25519SignatureArtifact(payloadTamper, {
      root: fixture.resolved, reviewer, payloadSha256: "d".repeat(64), minimumSignedAt: "2026-08-08T03:00:00.000Z",
    }), /signed payload digest mismatch/u);

    const subjectMismatch = await publish("subject-mismatch.json", {reviewerSubjectId: "someone-else"});
    await assert.rejects(verifyDetachedEd25519SignatureArtifact(subjectMismatch, {
      root: fixture.resolved, reviewer, payloadSha256, minimumSignedAt: "2026-08-08T03:00:00.000Z",
    }), /reviewer subject mismatch/u);

    const stale = await publish("stale.json", {signedAt: "2026-08-08T02:00:00.000Z"});
    await assert.rejects(verifyDetachedEd25519SignatureArtifact(stale, {
      root: fixture.resolved, reviewer, payloadSha256, minimumSignedAt: "2026-08-08T03:00:00.000Z",
    }), /signature is stale/u);
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
});

test("manual hold receipt binds the exact pair payload, candidate contract, reviewer, and evidence chronology", async () => {
  const universe = await liveUniverse();
  const identity = universeIdentity(universe);
  const ledger = prepareUnsignedReviewLedger(universe, {
    universeBytes: identity.bytes,
    universeSha256: identity.sha256,
  });
  const index = universe.records.findIndex((record) => record.currentDisposition !== "candidate-new-source-in-quarantine");
  const reviewRecord = completeReviewMetadata(structuredClone(ledger.records[index]));
  reviewRecord.manualHoldReview.decision = "withheld";
  reviewRecord.manualHoldReview.receipt = {path: "work/fixtures/manual-hold.json", bytes: 1, sha256: "7".repeat(64)};
  const {receipt, context} = manualReceiptFixture({universe, ledger, reviewRecord});
  assert.equal(assertManualHoldReceiptBinding(receipt, context), receipt);

  const stale = resignManualReceipt({...structuredClone(receipt), reviewedAt: "2026-08-08T00:30:00.000Z"});
  assert.throws(() => assertManualHoldReceiptBinding(stale, context), /predates pair review/u);

  const pairTamperedAfterReceipt = structuredClone(reviewRecord);
  pairTamperedAfterReceipt.review.notes = "Tampered after the manual receipt was signed.";
  assert.throws(
    () => assertManualHoldReceiptBinding(receipt, {...context, reviewRecord: pairTamperedAfterReceipt}),
    /pair-review record payload digest changed/u,
  );

  const reviewerMismatch = structuredClone(receipt);
  reviewerMismatch.reviewer = {
    subjectId: "different-reviewer",
    fullName: "Different Reviewer",
    role: "reviewer",
    publicKeySpkiSha256: "b".repeat(64),
  };
  resignManualReceipt(reviewerMismatch);
  const reviewers = new Map(context.ledgerReviewers);
  reviewers.set("different-reviewer", reviewerMismatch.reviewer);
  assert.throws(
    () => assertManualHoldReceiptBinding(reviewerMismatch, {...context, ledgerReviewers: reviewers}),
    /differs from pair-review reviewer/u,
  );

  const contractMismatch = structuredClone(receipt);
  contractMismatch.reviewContract.decisionContractSha256 = "0".repeat(64);
  resignManualReceipt(contractMismatch);
  assert.throws(() => assertManualHoldReceiptBinding(contractMismatch, context), /decision-contract digest changed/u);

  const candidateMismatch = structuredClone(receipt);
  candidateMismatch.reviewContract.reviewCandidate.sha256 = "0".repeat(64);
  resignManualReceipt(candidateMismatch);
  assert.throws(() => assertManualHoldReceiptBinding(candidateMismatch, context), /review-candidate identity changed/u);
});

test("quiescence producer rehashes exact paths, records inode/mode/mtime, and fails on a live writer", async () => {
  assert.ok(QUIESCENCE_PROJECT_DEPENDENCIES.includes("README.md"), "managed-status README must be inside the fixed quiescence scope");
  assert.ok(
    QUIESCENCE_PROJECT_DEPENDENCIES.includes(
      "scripts/lib/darwin-atomic-directory-swap-native.c",
    ),
    "runtime-compiled native swap source must be inside the fixed quiescence scope",
  );
  const fixture = await makeTemporaryRoot("help-math-successor-quiescence-");
  try {
    const universe = await liveUniverse();
    await writeFile(path.join(fixture.resolved, "stable.txt"), "stable bytes\n");
    const contents = await readFile(path.join(fixture.resolved, "stable.txt"));
    const expectedAllowlist = [{
      path: "project/stable.txt",
      bytes: contents.length,
      sha256: createHash("sha256").update(contents).digest("hex"),
    }];
    const quietProcessCensus = {
      tools: {
        ps: "/bin/ps -axo pid=,ppid=,command=",
        lsofCwd: "/usr/sbin/lsof -n -P -a -d cwd -F pRcn",
      },
      observerProcesses: {
        count: 1,
        records: [{
          pid: "100",
          ppid: "1",
          command: "node snapshot-observer",
          cwd: fixture.resolved,
          relevance: ["cwd-under-project-root"],
          observerRelationship: "observer",
        }],
      },
      unexpectedRelevantProcesses: {count: 0, records: []},
    };
    const captured = await captureQuiescenceSnapshot({
      universe,
      expectedAllowlist,
      root: fixture.resolved,
      outputRelativePath: "evidence/snapshot.json",
      capturedAt: "2026-08-08T05:00:00.000Z",
      scanOpenWriters: async (paths) => {
        assert.deepEqual(paths, [path.join(fixture.resolved, "stable.txt")]);
        return [];
      },
      scanProcesses: async () => quietProcessCensus,
    });
    assert.equal(captured.snapshot.allowlist.length, 1);
    assert.match(captured.snapshot.allowlist[0].dev, /^\d+$/u);
    assert.match(captured.snapshot.allowlist[0].ino, /^\d+$/u);
    assert.match(captured.snapshot.allowlist[0].mtimeNs, /^\d+$/u);
    assert.equal(captured.snapshot.allowlist[0].mode, 0o644);
    const receiptInfo = await lstat(path.join(fixture.resolved, captured.reference.path), {bigint: true});
    assert.equal(Number(receiptInfo.mode) & 0o777, 0o444);
    assert.equal(receiptInfo.nlink, 1n);

    const second = await captureQuiescenceSnapshot({
      universe,
      expectedAllowlist,
      root: fixture.resolved,
      outputRelativePath: "evidence/snapshot-2.json",
      capturedAt: "2026-08-08T05:01:00.000Z",
      scanOpenWriters: async () => [],
      scanProcesses: async () => quietProcessCensus,
    });
    assert.equal((await validateQuiescenceSnapshots([
      captured.reference,
      second.reference,
    ], {
      universe,
      root: fixture.resolved,
      expectedAllowlist,
      snapshotBirthtimeNsReader: async (reference) => reference.path.endsWith("snapshot-2.json") ? 60_000_000_000n : 0n,
    })).length, 2);
    await assert.rejects(validateQuiescenceSnapshots([
      captured.reference,
      second.reference,
    ], {
      universe,
      root: fixture.resolved,
      expectedAllowlist,
    }), /not actually created at least 60 seconds apart/u);
    const forgedZero = structuredClone(second.snapshot);
    delete forgedZero.processCensus;
    forgedZero.writeCapableProcesses = {count: 0, records: []};
    const forgedWrite = await writeImmutableNoClobber(
      path.join(fixture.resolved, "evidence/forged-zero.json"),
      canonicalJson(forgedZero),
    );
    await assert.rejects(validateQuiescenceSnapshots([
      captured.reference,
      {path: "evidence/forged-zero.json", bytes: forgedWrite.bytes, sha256: forgedWrite.sha256},
    ], {
      universe,
      root: fixture.resolved,
      expectedAllowlist,
    }), /fields changed/u);

    await assert.rejects(captureQuiescenceSnapshot({
      universe,
      expectedAllowlist,
      root: fixture.resolved,
      capturedAt: "2026-08-08T05:01:00.000Z",
      scanOpenWriters: async () => [{processId: "1", descriptor: "3", access: "w", path: "stable.txt"}],
      scanProcesses: async () => quietProcessCensus,
    }), /open write-capable handle/u);

    const watcherCensus = structuredClone(quietProcessCensus);
    watcherCensus.unexpectedRelevantProcesses = {
      count: 1,
      records: [{
        pid: "200",
        ppid: "1",
        command: "watcher",
        cwd: fixture.resolved,
        relevance: ["cwd-under-project-root"],
        observerRelationship: "none",
      }],
    };
    await assert.rejects(captureQuiescenceSnapshot({
      universe,
      expectedAllowlist,
      root: fixture.resolved,
      capturedAt: "2026-08-08T05:02:00.000Z",
      scanOpenWriters: async () => [],
      scanProcesses: async () => watcherCensus,
    }), /unexpected relevant process/u);
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
});

test("relevant-process census brackets lsof, ignores only an exited helper, and catches a newly persistent process", async () => {
  const universe = await liveUniverse();
  let psCompleted = false;
  let psCalls = 0;
  const calls = [];
  const result = await scanRelevantProcessCensus({
    universe,
    observerPid: "100",
    runProcess: async (executable) => {
      calls.push(executable);
      if (executable === "/bin/ps") {
        psCalls += 1;
        psCompleted = true;
        return {stdout: " 100 1 node snapshot-observer\n 1 0 /sbin/launchd\n"};
      }
      assert.equal(psCompleted, true, "lsof must start only after the ps snapshot is complete");
      return {
        stdout: [
          "p100", "R1", "cnode", `n${process.cwd()}`,
          // This transient lsof process was not in the earlier ps snapshot and
          // therefore must not become a false foreign-process finding.
          "p200", "R100", "clsof", `n${process.cwd()}`,
          "",
        ].join("\n"),
      };
    },
  });
  assert.deepEqual(calls, ["/bin/ps", "/usr/sbin/lsof", "/bin/ps"]);
  assert.equal(psCalls, 2);
  assert.equal(result.unexpectedRelevantProcesses.count, 0);
  assert.equal(result.observerProcesses.records.some((record) => record.pid === "200"), false);

  let foreignPsCalls = 0;
  const withNewPersistentProcess = await scanRelevantProcessCensus({
    universe,
    observerPid: "100",
    runProcess: async (executable) => {
      if (executable === "/bin/ps") {
        foreignPsCalls += 1;
        return {
          stdout: foreignPsCalls === 1
            ? " 100 1 node snapshot-observer\n 1 0 /sbin/launchd\n"
            : " 100 1 node snapshot-observer\n 201 1 node foreign-writer\n 1 0 /sbin/launchd\n",
        };
      }
      return {
        stdout: [
          "p100", "R1", "cnode", `n${process.cwd()}`,
          "p201", "R1", "cnode", `n${process.cwd()}`,
          "",
        ].join("\n"),
      };
    },
  });
  assert.equal(withNewPersistentProcess.unexpectedRelevantProcesses.count, 1);
  assert.equal(withNewPersistentProcess.unexpectedRelevantProcesses.records[0].pid, "201");

  let shortLivedPsCalls = 0;
  const withShortLivedForeignProcess = await scanRelevantProcessCensus({
    universe,
    observerPid: "100",
    runProcess: async (executable) => {
      if (executable === "/bin/ps") {
        shortLivedPsCalls += 1;
        return {stdout: " 100 1 node snapshot-observer\n 1 0 /sbin/launchd\n"};
      }
      return {
        stdout: [
          "p100", "R1", "cnode", `n${process.cwd()}`,
          // This foreign process exits before ps-after, but is not the exact
          // direct-child lsof helper and therefore remains fail-closed.
          "p202", "R1", "cforeign-writer", `n${process.cwd()}`,
          "",
        ].join("\n"),
      };
    },
  });
  assert.equal(shortLivedPsCalls, 2);
  assert.equal(withShortLivedForeignProcess.unexpectedRelevantProcesses.count, 1);
  assert.equal(withShortLivedForeignProcess.unexpectedRelevantProcesses.records[0].pid, "202");
});

test("authoring preparer makes only an unsigned byte-identical 0444 single-link independent-inode copy", async () => {
  const fixture = await makeTemporaryRoot("help-math-successor-authoring-copy-");
  try {
    const universe = await liveUniverse();
    const record = universe.records
      .filter((candidate) => candidate.extension === "fla")
      .sort((left, right) => left.bytes - right.bytes)[0];
    const serialized = canonicalJson(universe);
    const identity = {
      path: "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-universe.json",
      bytes: Buffer.byteLength(serialized),
      sha256: sha256Text(serialized),
    };
    const prepared = await prepareAuthoringWorkingCopy({
      universe,
      universeIdentity: identity,
      recordId: record.recordId,
      root: fixture.resolved,
    });
    assert.equal(prepared.status, "authoring-working-copy-prepared-unsigned");
    assert.match(prepared.workingCopy.artifact.path, new RegExp(`^${AUTHORING_WORKING_COPY_PREFIX}/${record.recordId}/`, "u"));
    assert.equal(prepared.workingCopy.artifact.bytes, record.bytes);
    assert.equal(prepared.workingCopy.artifact.sha256, record.sha256);
    assert.equal(prepared.workingCopy.mode, "0444");
    assert.equal(prepared.workingCopy.nlink, 1);
    assert.equal(prepared.workingCopy.separateInode, true);
    const workingInfo = await lstat(path.join(fixture.resolved, prepared.workingCopy.artifact.path), {bigint: true});
    assert.equal(Number(workingInfo.mode) & 0o777, 0o444);
    assert.equal(workingInfo.nlink, 1n);
    const receipt = JSON.parse(await readFile(path.join(fixture.resolved, prepared.preparationReceipt.path), "utf8"));
    assert.equal(receipt.signatureState, "unsigned-preparation-only");
    assert.deepEqual(receipt.actions, {animateLaunch: false, save: false, publish: false, repair: false, normalize: false});
    const repeated = await prepareAuthoringWorkingCopy({
      universe,
      universeIdentity: identity,
      recordId: record.recordId,
      root: fixture.resolved,
    });
    assert.equal(repeated.status, "authoring-working-copy-already-prepared-unsigned");
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
});

test("Animate authoring sessions are fresh, Adobe-only, warning-only, unique, and non-overlapping", () => {
  const interactions = {
    legacyConversionWarning: {present: true, confirmed: true},
    otherInteractions: [],
  };
  const first = assertAuthoringSessionContract({
    sessionId: "animate-session-1",
    freshSession: true,
    tool: "Adobe Animate",
    version: "fixture-version",
    startedAt: "2026-08-08T00:00:00.000Z",
    endedAt: "2026-08-08T00:01:00.000Z",
  }, interactions);
  const second = assertAuthoringSessionContract({
    sessionId: "animate-session-2",
    freshSession: true,
    tool: "Adobe Animate",
    version: "fixture-version",
    startedAt: "2026-08-08T00:01:00.000Z",
    endedAt: "2026-08-08T00:02:00.000Z",
  }, interactions);
  assert.equal(assertUniqueNonOverlappingAuthoringSessions([second, first]).length, 2);
  assert.throws(
    () => assertAuthoringSessionContract({
      sessionId: "wrong-tool",
      freshSession: true,
      tool: "Metadata Parser",
      version: "1",
      startedAt: "2026-08-08T00:00:00.000Z",
      endedAt: "2026-08-08T00:01:00.000Z",
    }, interactions),
    /Adobe Animate/u,
  );
  assert.throws(
    () => assertAuthoringSessionContract({
      sessionId: "extra-interaction",
      freshSession: true,
      tool: "Adobe Animate",
      version: "1",
      startedAt: "2026-08-08T00:00:00.000Z",
      endedAt: "2026-08-08T00:01:00.000Z",
    }, {...interactions, otherInteractions: ["clicked timeline"]}),
    /interaction\/edit/u,
  );
  assert.throws(
    () => assertUniqueNonOverlappingAuthoringSessions([first, {...second, sessionId: first.sessionId}]),
    /unique fresh sessionId/u,
  );
  assert.throws(
    () => assertUniqueNonOverlappingAuthoringSessions([first, {...second, startedAt: first.startedAt + 1}]),
    /sessions overlap/u,
  );
});

test("portable relative paths reject traversal, aliases, separators, controls, and non-NFC text", () => {
  assert.equal(
    portableRelative("HELP_COURSES/ELMGR4/L1/IR/example.fla"),
    "HELP_COURSES/ELMGR4/L1/IR/example.fla",
  );
  assert.equal(portableRelative("caf\u00e9/example.swf"), "caf\u00e9/example.swf");

  for (const unsafe of [
    "",
    ".",
    "..",
    "../escape.fla",
    "nested/../../escape.fla",
    "nested/../alias.fla",
    "/absolute/file.fla",
    "C:\\windows\\file.fla",
    "nested\\file.fla",
    "nested//file.fla",
    "nested/./file.fla",
    "nested/file\0.fla",
    "nested/file\n.fla",
    "nested/file\t.fla",
    "cafe\u0301/example.swf",
  ]) {
    assert.throws(
      () => portableRelative(unsafe, "fixture path"),
      /fixture path/u,
      `expected unsafe path rejection for ${JSON.stringify(unsafe)}`,
    );
  }
});

test("CLI defaults to progressive plan advancement and plan:check fails closed when the plan is absent", async () => {
  assert.equal(parseArguments([]).mode, "advance-plan");
  assert.deepEqual(parseArguments(["--prepare-authoring-copy", "--record-id", "record-1"]), {
    mode: "prepare-authoring-copy",
    quiescenceSnapshots: [],
    recordId: "record-1",
  });
  assert.throws(
    () => parseArguments(["--write-plan", "--quiescence-snapshot", "/tmp/forged.json"]),
    /Unknown argument: --write-plan/u,
  );
  assert.throws(
    () => parseArguments(["--advance-plan", "--quiescence-snapshot", "/tmp/forged.json"]),
    /Unknown argument: --quiescence-snapshot/u,
  );
  assert.throws(
    () => parseArguments(["--advance-plan", "--provisional-post-state-observation", "/tmp/forged.json"]),
    /Unknown argument: --provisional-post-state-observation/u,
  );
  const fixture = await makeTemporaryRoot("help-math-successor-missing-plan-");
  try {
    await assert.rejects(commandCheckPlan(fixture.resolved), /Executable successor plan is missing/u);
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
});

test("secure path resolution rejects symlink roots, symlink traversal, symlink leaves, and directory leaves", async () => {
  const fixture = await makeTemporaryRoot("help-math-successor-path-");
  try {
    await mkdir(path.join(fixture.resolved, "inside"));
    await writeFile(path.join(fixture.resolved, "inside", "source.fla"), "source");
    await mkdir(path.join(fixture.resolved, "outside"));
    await writeFile(path.join(fixture.resolved, "outside", "other.fla"), "other");

    const resolved = await secureResolveExistingRegular(
      fixture.resolved,
      "inside/source.fla",
      "valid source",
    );
    assert.equal(resolved.absolutePath, path.join(fixture.resolved, "inside", "source.fla"));

    await symlink(path.join(fixture.resolved, "outside"), path.join(fixture.resolved, "via-link"));
    await assert.rejects(
      secureResolveExistingRegular(fixture.resolved, "via-link/other.fla", "ancestor link"),
      /traverses a symbolic link/u,
    );

    await symlink(
      path.join(fixture.resolved, "outside", "other.fla"),
      path.join(fixture.resolved, "leaf-link.fla"),
    );
    await assert.rejects(
      secureResolveExistingRegular(fixture.resolved, "leaf-link.fla", "leaf link"),
      /traverses a symbolic link/u,
    );
    await assert.rejects(
      secureResolveExistingRegular(fixture.resolved, "inside", "directory leaf"),
      /leaf is not a regular file/u,
    );
    await assert.rejects(
      secureResolveExistingRegular(fixture.resolved, "../escape.fla", "escape"),
      /escapes its root/u,
    );

    const rootAlias = `${fixture.resolved}-alias`;
    await symlink(fixture.resolved, rootAlias);
    try {
      await assert.rejects(
        secureResolveExistingRegular(rootAlias, "inside/source.fla", "root alias"),
        /root must be a real directory/u,
      );
    } finally {
      await rm(rootAlias, {force: true});
    }
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
});

test("immutable publication is atomic, idempotent only for identical bytes, and no-clobber", async () => {
  const fixture = await makeTemporaryRoot("help-math-successor-write-");
  const output = path.join(fixture.resolved, "catalog", "artifact.json");
  const contents = `${JSON.stringify({status: "frozen"}, null, 2)}\n`;
  try {
    const written = await writeImmutableNoClobber(output, contents);
    assert.deepEqual(written, {
      outcome: "written",
      bytes: Buffer.byteLength(contents),
      sha256: sha256Text(contents),
      mode: "0444",
    });
    const info = await lstat(output, {bigint: true});
    assert.equal(Number(info.mode) & 0o777, 0o444);
    assert.equal(info.nlink, 1n);
    assert.equal(await readFile(output, "utf8"), contents);
    await assert.rejects(lstat(`${path.dirname(output)}/.${path.basename(output)}.preparing`), {
      code: "ENOENT",
    });

    const repeated = await writeImmutableNoClobber(output, contents);
    assert.equal(repeated.outcome, "already-current");
    assert.equal(repeated.sha256, written.sha256);

    await assert.rejects(
      writeImmutableNoClobber(output, "different bytes\n"),
      /Refusing to overwrite a different immutable output/u,
    );
    assert.equal(await readFile(output, "utf8"), contents);

    const staleOutput = path.join(fixture.resolved, "catalog", "stale.json");
    const stalePreparing = path.join(
      path.dirname(staleOutput),
      `.${path.basename(staleOutput)}.preparing`,
    );
    await writeFile(stalePreparing, "retained evidence");
    await assert.rejects(
      writeImmutableNoClobber(staleOutput, "new artifact"),
      /Refusing to remove or replace stale preparing file/u,
    );
    assert.equal(await readFile(stalePreparing, "utf8"), "retained evidence");
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
});

test("immutable publication rejects symlink, writable, and multiply-linked existing outputs", async () => {
  const fixture = await makeTemporaryRoot("help-math-successor-existing-");
  try {
    const parent = path.join(fixture.resolved, "outputs");
    await mkdir(parent);

    const referent = path.join(parent, "referent.json");
    const symlinkOutput = path.join(parent, "symlink.json");
    await writeFile(referent, "referent\n");
    await symlink(referent, symlinkOutput);
    await assert.rejects(
      writeImmutableNoClobber(symlinkOutput, "referent\n"),
      /regular non-symlink file/u,
    );

    const outside = path.join(fixture.resolved, "outside-parent");
    const parentAlias = path.join(fixture.resolved, "parent-alias");
    await mkdir(outside);
    await symlink(outside, parentAlias);
    await assert.rejects(
      writeImmutableNoClobber(path.join(parentAlias, "must-not-exist", "artifact.json"), "unsafe\n"),
      /ancestor is unsafe/u,
    );
    await assert.rejects(lstat(path.join(outside, "must-not-exist")), {code: "ENOENT"});

    const writableOutput = path.join(parent, "writable.json");
    await writeFile(writableOutput, "writable\n", {mode: 0o644});
    await assert.rejects(
      writeImmutableNoClobber(writableOutput, "writable\n"),
      /mode 0444/u,
    );

    const linkedOutput = path.join(parent, "linked.json");
    const linkedAlias = path.join(parent, "linked-alias.json");
    await writeFile(linkedOutput, "linked\n", {mode: 0o444});
    await link(linkedOutput, linkedAlias);
    await assert.rejects(
      writeImmutableNoClobber(linkedOutput, "linked\n"),
      /exactly one hard link/u,
    );

    await chmod(writableOutput, 0o444);
  } finally {
    await rm(fixture.created, {recursive: true, force: true});
  }
});
