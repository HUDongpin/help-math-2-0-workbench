import assert from "node:assert/strict";
import {
  createHash,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  HUMAN_REVIEW_SCOPE,
  OWNER_DECISION_SCOPE,
  RELEASE_SCOPE,
  SIGNATURE_ALGORITHM,
  TRUST_EVIDENCE_TYPES,
  TRUST_ROLES,
  canonicalJson,
  ed25519PublicKeyFingerprint,
  loadExternalTrustRootConfig,
  sha256Canonical,
  signedEnvelopeSha256,
  trustRootAuthoritySha256,
} from "./lib/original-runtime-promotion-trust.mjs";
import {
  NATURAL_EVIDENCE_MEDIA_TYPES,
  verifyOriginalRuntimeNaturalCandidateDag,
} from "./lib/original-runtime-natural-causality.mjs";
import {
  ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE,
  ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED,
  createOriginalRuntimePromotionTransaction,
  executeOriginalRuntimePromotionTransaction,
  recoverOriginalRuntimePromotionTransaction,
} from "./lib/original-runtime-promotion-transaction.mjs";
import {
  ORIGINAL_RUNTIME_LEDGER_HASH_ALGORITHM,
  ORIGINAL_RUNTIME_OWNER_LEDGER_CHECKPOINT_EVIDENCE_TYPE,
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_EVIDENCE_TYPE,
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED,
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_SCHEMA_VERSION,
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_STATUS,
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED,
  ORIGINAL_RUNTIME_TRANSACTION_SEMANTICS,
  originalRuntimeReleaseBundleCommitmentLedgerLeafSha256,
  originalRuntimeReleaseBundlePreLedgerCommitmentSha256,
  originalRuntimeOwnerLedgerNodeSha256,
  validateOriginalRuntimeReleaseBundleSchema,
  verifyOriginalRuntimeReleaseBundleDiagnostic,
} from "./lib/original-runtime-promotion-release-bundle.mjs";

const epoch = Date.UTC(2026, 6, 23, 1, 0, 0);
const atSeconds = (seconds) => new Date(epoch + seconds * 1000).toISOString();
const at = (minute) => atSeconds(minute * 60);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fixtureSigner(subjectId, displayName, roles) {
  const {publicKey, privateKey} = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({type: "spki", format: "pem"}).toString();
  return {
    privateKey,
    publicKeyPem,
    rootRecord: {
      subjectId,
      displayName,
      publicKeyPem,
      keyFingerprintSha256: ed25519PublicKeyFingerprint(publicKeyPem),
      authorizedRoles: [...roles].sort(),
      notBefore: at(0),
      notAfter: null,
      status: "active",
    },
  };
}

function signed(payload, authority) {
  return {
    payload,
    signature: {
      algorithm: SIGNATURE_ALGORITHM,
      subjectId: authority.rootRecord.subjectId,
      keyFingerprintSha256: authority.rootRecord.keyFingerprintSha256,
      signatureBase64: sign(
        null,
        Buffer.from(canonicalJson(payload)),
        authority.privateKey,
      ).toString("base64"),
    },
  };
}

function transactionOutputs(descriptor) {
  return [
    {
      path: descriptor.fixedPaths.coverage,
      sha256: descriptor.coverage.replacementSha256,
    },
    {
      path: descriptor.fixedPaths.baseline,
      sha256: descriptor.outputs.baseline.sha256,
    },
    {
      path: descriptor.fixedPaths.executionReport,
      sha256: descriptor.outputs.executionReport.sha256,
    },
    {
      path: descriptor.fixedPaths.promotionReceipt,
      sha256: descriptor.outputs.promotionReceipt.sha256,
    },
    ...descriptor.archive.files.map((entry) => ({
      path: path.posix.join(descriptor.fixedPaths.archive, entry.relativePath),
      sha256: entry.sha256,
    })),
  ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

function transactionBinding(plan, expectedOutputs) {
  const descriptor = plan.descriptor;
  return {
    planSchemaVersion: descriptor.schemaVersion,
    artifactType: descriptor.artifactType,
    planSha256: descriptor.planSha256,
    transactionNonce: descriptor.transactionNonce,
    semantics: ORIGINAL_RUNTIME_TRANSACTION_SEMANTICS,
    inspectionStatus: "not-started",
    productionPromotionEnabled: false,
    coverageExpectedOriginalSha256: descriptor.coverage.expectedOriginalSha256,
    fixedPathsSha256: sha256Canonical(descriptor.fixedPaths),
    archiveInventorySha256: descriptor.archive.inventorySha256,
    expectedOutputsSha256: sha256Canonical(expectedOutputs),
  };
}

async function createTransaction(projectRoot, {animationId, requirementId, nonce}) {
  const workspace = path.join(projectRoot, "migrations", animationId);
  const coverage = path.join(workspace, "evidence", "full-frame-coverage.json");
  const originalCoverage = Buffer.from('{"status":"blocked","baselineAuthority":"unresolved"}\n');
  const replacementCoverage = Buffer.from('{"status":"blocked","baselineAuthority":"original-runtime"}\n');
  await mkdir(path.dirname(coverage), {recursive: true});
  await writeFile(coverage, originalCoverage);
  await mkdir(path.join(workspace, "baseline", "original-runtime"), {recursive: true});
  await mkdir(path.join(workspace, "baseline", "trace-executions"), {recursive: true});
  await mkdir(path.join(workspace, "evidence", "original-runtime-promotions"), {recursive: true});
  await mkdir(
    path.join(
      projectRoot,
      "artifacts",
      "full-frame",
      "pilot-baselines",
      animationId,
      "req-root-default-en",
    ),
    {recursive: true},
  );
  return createOriginalRuntimePromotionTransaction({
    projectRoot,
    migrationId: animationId,
    requirementId,
    expectedCoverageSha256: sha256(originalCoverage),
    expectedCoverageMode: 0o644,
    replacementCoverage,
    baseline: Buffer.from("synthetic baseline\n"),
    executionReport: Buffer.from("synthetic execution report\n"),
    promotionReceipt: Buffer.from("synthetic promotion receipt\n"),
    archiveEntries: [
      {
        relativePath: "candidate-manifest.json",
        mode: 0o444,
        bytes: Buffer.from('{"synthetic":true}\n'),
      },
      {
        relativePath: "frames/frame-001.txt",
        mode: 0o444,
        bytes: Buffer.from("synthetic frame placeholder\n"),
      },
    ],
    transactionNonce: nonce,
  });
}

async function createDag(temporary) {
  const seedRoot = path.join(temporary, "dag-seed");
  const archiveRoot = path.join(temporary, "dag-archive");
  await Promise.all([mkdir(seedRoot), mkdir(archiveRoot)]);
  const evidenceBytes = Buffer.from("synthetic immutable evidence\n");
  const evidenceDescriptor = {
    descriptorType: "path",
    baseRoot: "archive",
    path: "evidence.txt",
    sha256: sha256(evidenceBytes),
    mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.text,
  };
  const rootBytes = Buffer.from(`${JSON.stringify({
    schemaVersion: 1,
    evidenceType: "synthetic-release-bundle-dag-root",
    evidence: evidenceDescriptor,
  }, null, 2)}\n`);
  const rootDescriptor = {
    descriptorType: "file",
    baseRoot: "seed",
    file: "candidate-root.json",
    sha256: sha256(rootBytes),
    mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.json,
  };
  await Promise.all([
    writeFile(path.join(seedRoot, rootDescriptor.file), rootBytes),
    writeFile(path.join(archiveRoot, evidenceDescriptor.path), evidenceBytes),
  ]);
  await Promise.all([
    chmod(path.join(seedRoot, rootDescriptor.file), 0o444),
    chmod(path.join(archiveRoot, evidenceDescriptor.path), 0o444),
  ]);
  await Promise.all([chmod(seedRoot, 0o555), chmod(archiveRoot, 0o555)]);
  const options = {
    baseRoots: {
      seed: {path: seedRoot, role: "seed"},
      archive: {path: archiveRoot, role: "archive"},
    },
    seeds: [rootDescriptor],
  };
  const verified = await verifyOriginalRuntimeNaturalCandidateDag({
    ...options,
    requireCompleteArchives: true,
    requireImmutableStaging: true,
  });
  return {
    seedRoot,
    archiveRoot,
    options,
    binding: {
      rootDescriptor,
      rootDescriptorSha256: sha256Canonical(rootDescriptor),
      rootContentSha256: rootDescriptor.sha256,
      fullDagSha256: verified.dagSha256,
      nodeCount: verified.inventory.length,
      edgeCount: verified.edgeInventory.length,
      completeArchiveClosure: true,
      immutableStagingRequired: true,
      verificationProfile: "generic-complete-immutable-typed-dag-closure-only",
    },
  };
}

async function createFixture(context) {
  const realTemporaryRoot = await realpath(os.tmpdir());
  const temporary = await mkdtemp(path.join(realTemporaryRoot, "helpmath-release-bundle-"));
  const projectRoot = path.join(temporary, "project");
  const ownerRoot = path.join(temporary, "owner");
  await Promise.all([mkdir(projectRoot), mkdir(ownerRoot)]);
  const dag = await createDag(temporary);
  context.after(async () => {
    await Promise.all([
      chmod(dag.seedRoot, 0o755).catch(() => {}),
      chmod(dag.archiveRoot, 0o755).catch(() => {}),
    ]);
    await rm(temporary, {recursive: true, force: true});
  });

  const animationId = "course-synthetic-release-bundle";
  const requirementId = "req:root:default:en";
  const nonce = "synthetic-nonce-0123456789abcdef0123456789";
  const plan = await createTransaction(projectRoot, {
    animationId,
    requirementId,
    nonce,
  });
  const expectedOutputs = transactionOutputs(plan.descriptor);

  const authorities = {
    registry: fixtureSigner(
      "01-synthetic-registry",
      "Synthetic Registry Authority",
      [TRUST_ROLES.registry],
    ),
    human: fixtureSigner(
      "02-synthetic-human",
      "Synthetic Human Reviewer",
      [TRUST_ROLES.humanReview],
    ),
    owner: fixtureSigner(
      "03-synthetic-owner",
      "Synthetic Owner Representative",
      [TRUST_ROLES.ownerDecision],
    ),
    release: fixtureSigner(
      "04-synthetic-release",
      "Synthetic Release Authority",
      [TRUST_ROLES.release],
    ),
    operator: fixtureSigner(
      "00-synthetic-operator",
      "Synthetic Capture Operator",
      [],
    ),
  };
  const trustRoot = {
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.trustRoot,
    trustRootId: "synthetic-owner-trust-root",
    issuedAt: at(0),
    subjects: [
      authorities.registry.rootRecord,
      authorities.human.rootRecord,
      authorities.owner.rootRecord,
      authorities.release.rootRecord,
    ],
    statePins: {
      registryHead: {sha256: "0".repeat(64), sequence: 1},
      revocationHead: {
        sha256: "0".repeat(64),
        sequence: 1,
        minimumSequence: 1,
        issuedAt: at(6),
        maximumAgeMs: 5 * 60 * 1000,
        validUntil: at(11),
      },
    },
  };
  const trustRootAuthority = trustRootAuthoritySha256(trustRoot);
  const entries = trustRoot.subjects.map((subject) => ({
    subjectId: subject.subjectId,
    keyFingerprintSha256: subject.keyFingerprintSha256,
    authorizedRoles: subject.authorizedRoles,
    registeredAt: at(0),
    status: "active",
  })).sort((left, right) => left.subjectId.localeCompare(right.subjectId));
  const registryCheckpoint = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.registryCheckpoint,
    trustRootId: trustRoot.trustRootId,
    trustRootSha256: trustRootAuthority,
    registryId: "synthetic-promotion-registry",
    sequence: 1,
    previousCheckpointSha256: null,
    issuedAt: at(1),
    entries,
  }, authorities.registry);

  const capture = {
    sessionId: "synthetic-capture-session",
    startedAt: at(2),
    endedAt: at(3),
  };
  const artifactBindings = {
    candidateManifestSha256: dag.binding.rootContentSha256,
    candidateReportSha256: sha256("synthetic-candidate-report"),
    traceSpecSha256: sha256("synthetic-trace-spec"),
    sourceSwfSha256: sha256("synthetic-source-swf"),
  };
  const expected = {
    animationId,
    requirementId,
    capture,
    artifactBindings,
    plannedOutputs: expectedOutputs,
  };
  const humanReview = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.humanReview,
    decision: "accepted",
    animationId,
    requirementId,
    capture,
    artifactBindings,
    captureRegistryCheckpointSha256: signedEnvelopeSha256(registryCheckpoint),
    verificationRegistryHeadSha256: signedEnvelopeSha256(registryCheckpoint),
    reviewedAt: at(4),
    scope: HUMAN_REVIEW_SCOPE,
  }, authorities.human);
  const ownerDecision = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.ownerDecision,
    decision: "authorized",
    animationId,
    requirementId,
    capture,
    artifactBindings,
    captureRegistryCheckpointSha256: signedEnvelopeSha256(registryCheckpoint),
    verificationRegistryHeadSha256: signedEnvelopeSha256(registryCheckpoint),
    humanReviewSha256: signedEnvelopeSha256(humanReview),
    decidedAt: at(5),
    scope: OWNER_DECISION_SCOPE,
  }, authorities.owner);
  const revocationCheckpoint = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.revocationCheckpoint,
    trustRootId: trustRoot.trustRootId,
    trustRootSha256: trustRootAuthority,
    registryCheckpointSha256: signedEnvelopeSha256(registryCheckpoint),
    sequence: 1,
    previousCheckpointSha256: null,
    issuedAt: at(6),
    revocations: [],
  }, authorities.registry);
  trustRoot.statePins = {
    registryHead: {
      sha256: signedEnvelopeSha256(registryCheckpoint),
      sequence: 1,
    },
    revocationHead: {
      sha256: signedEnvelopeSha256(revocationCheckpoint),
      sequence: 1,
      minimumSequence: 1,
      issuedAt: at(6),
      maximumAgeMs: 5 * 60 * 1000,
      validUntil: at(11),
    },
  };
  const releaseTransaction = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.releaseTransaction,
    decision: "authorized",
    releaseId: "synthetic-release-001",
    animationId,
    requirementId,
    capture,
    artifactBindings,
    captureRegistryCheckpointSha256: signedEnvelopeSha256(registryCheckpoint),
    verificationRegistryHeadSha256: signedEnvelopeSha256(registryCheckpoint),
    revocationCheckpointSha256: signedEnvelopeSha256(revocationCheckpoint),
    humanReviewSha256: signedEnvelopeSha256(humanReview),
    ownerDecisionSha256: signedEnvelopeSha256(ownerDecision),
    nonce,
    plannedOutputs: expectedOutputs,
    releasedAt: at(7),
    scope: RELEASE_SCOPE,
  }, authorities.release);

  const configPath = path.join(ownerRoot, "synthetic-trust-root.json");
  await writeFile(configPath, `${JSON.stringify(trustRoot, null, 2)}\n`);
  const loadedTrustRoot = await loadExternalTrustRootConfig({
    projectRoot,
    ownerControlledRoot: ownerRoot,
    trustRootConfigPath: configPath,
    now: at(9),
  });
  const trust = {
    trustRoot: loadedTrustRoot,
    registryCheckpoints: [registryCheckpoint],
    revocationCheckpoints: [revocationCheckpoint],
    humanReview,
    ownerDecision,
    releaseTransaction,
    expected,
    replayedNonces: new Set(),
    now: at(9),
  };

  const releaseTransactionSha256 = signedEnvelopeSha256(releaseTransaction);
  const expectedExecution = {
    operator: {
      subjectId: authorities.operator.rootRecord.subjectId,
      keyFingerprintSha256:
        authorities.operator.rootRecord.keyFingerprintSha256,
      attestationSha256: sha256("synthetic-operator-attestation"),
    },
    runtime: {
      runtimeId: "adobe-flash-player-projector",
      name: "Adobe Flash Player Projector",
      version: "synthetic-32.0.0.465",
      executableSha256: sha256("synthetic-projector-executable"),
      identityReceiptSha256: sha256("synthetic-runtime-identity-receipt"),
    },
    toolchain: {
      receiptSha256: sha256("synthetic-toolchain-receipt"),
      runtimeTreeSha256: sha256("synthetic-runtime-tree"),
      launcherSha256: sha256("synthetic-launcher"),
      sandboxProfileSha256: sha256("synthetic-sandbox"),
    },
  };
  const payload = {
    schemaVersion: ORIGINAL_RUNTIME_RELEASE_BUNDLE_SCHEMA_VERSION,
    evidenceType: ORIGINAL_RUNTIME_RELEASE_BUNDLE_EVIDENCE_TYPE,
    status: ORIGINAL_RUNTIME_RELEASE_BUNDLE_STATUS,
    animationId,
    requirementId,
    releaseId: releaseTransaction.payload.releaseId,
    capture,
    artifactBindings,
    typedDag: dag.binding,
    execution: expectedExecution,
    trustHistory: {
      trustRootAuthoritySha256: trustRootAuthority,
      trustRootConfigSha256: loadedTrustRoot.configSha256,
      trustRootFileSha256: loadedTrustRoot.fileSha256,
      trustRootFileBindingSha256: loadedTrustRoot.fileBindingSha256,
      registryCheckpointSha256: [signedEnvelopeSha256(registryCheckpoint)],
      captureRegistryCheckpointSha256: signedEnvelopeSha256(registryCheckpoint),
      verificationRegistryHeadSha256: signedEnvelopeSha256(registryCheckpoint),
      revocationCheckpointSha256: [signedEnvelopeSha256(revocationCheckpoint)],
      currentRevocationCheckpointSha256: signedEnvelopeSha256(revocationCheckpoint),
      humanReviewSha256: signedEnvelopeSha256(humanReview),
      ownerDecisionSha256: signedEnvelopeSha256(ownerDecision),
      releaseTransactionSha256,
    },
    roleBindings: {
      registry: {
        role: TRUST_ROLES.registry,
        subjectId: authorities.registry.rootRecord.subjectId,
        keyFingerprintSha256:
          authorities.registry.rootRecord.keyFingerprintSha256,
      },
      humanReview: {
        role: TRUST_ROLES.humanReview,
        subjectId: authorities.human.rootRecord.subjectId,
        keyFingerprintSha256:
          authorities.human.rootRecord.keyFingerprintSha256,
      },
      ownerDecision: {
        role: TRUST_ROLES.ownerDecision,
        subjectId: authorities.owner.rootRecord.subjectId,
        keyFingerprintSha256:
          authorities.owner.rootRecord.keyFingerprintSha256,
      },
      release: {
        role: TRUST_ROLES.release,
        subjectId: authorities.release.rootRecord.subjectId,
        keyFingerprintSha256:
          authorities.release.rootRecord.keyFingerprintSha256,
      },
    },
    ledgerInclusion: null,
    transaction: transactionBinding(plan, expectedOutputs),
    nonce,
    expectedOutputs,
    preLedgerCommitmentSha256: "0".repeat(64),
    bundledAt: at(8),
    productionPromotionEnabled: false,
  };
  payload.preLedgerCommitmentSha256 =
    originalRuntimeReleaseBundlePreLedgerCommitmentSha256(payload);
  const leafHashSha256 =
    originalRuntimeReleaseBundleCommitmentLedgerLeafSha256(
      payload.preLedgerCommitmentSha256,
    );
  const siblingSha256 = sha256("synthetic-ledger-sibling");
  const merkleRootSha256 =
    originalRuntimeOwnerLedgerNodeSha256(leafHashSha256, siblingSha256);
  const ledgerCheckpoint = signed({
    schemaVersion: 1,
    evidenceType: ORIGINAL_RUNTIME_OWNER_LEDGER_CHECKPOINT_EVIDENCE_TYPE,
    trustRootAuthoritySha256: trustRootAuthority,
    ledgerId: "synthetic-owner-ledger",
    sequence: 1,
    previousCheckpointSha256: null,
    treeSize: 2,
    merkleRootSha256,
    issuedAt: atSeconds(450),
    verificationRegistryHeadSha256: signedEnvelopeSha256(registryCheckpoint),
    revocationCheckpointSha256: signedEnvelopeSha256(revocationCheckpoint),
  }, authorities.registry);
  payload.ledgerInclusion = {
    checkpointSha256: signedEnvelopeSha256(ledgerCheckpoint),
    ledgerId: ledgerCheckpoint.payload.ledgerId,
    treeSize: 2,
    leafIndex: 0,
    leafType: "release-bundle-pre-ledger-commitment-sha256",
    leafSubjectSha256: payload.preLedgerCommitmentSha256,
    leafHashSha256,
    auditPath: [{position: "right", sha256: siblingSha256}],
    merkleRootSha256,
    hashAlgorithm: ORIGINAL_RUNTIME_LEDGER_HASH_ALGORITHM,
  };
  const bundle = signed(payload, authorities.release);
  const options = {
    bundle,
    releaseSignerPublicKeyPem: authorities.release.publicKeyPem,
    ledgerCheckpoint,
    ledgerSignerPublicKeyPem: authorities.registry.publicKeyPem,
    trust,
    dag: dag.options,
    expectedExecution,
    transactionPlan: plan,
    now: at(9),
  };
  return {
    options,
    authorities,
    plan,
    resign(mutator) {
      const changed = structuredClone(options.bundle.payload);
      mutator(changed);
      options.bundle = signed(changed, authorities.release);
    },
    reseal(mutator) {
      const changed = structuredClone(options.bundle.payload);
      mutator(changed);
      changed.preLedgerCommitmentSha256 =
        originalRuntimeReleaseBundlePreLedgerCommitmentSha256(changed);
      const newLeaf =
        originalRuntimeReleaseBundleCommitmentLedgerLeafSha256(
          changed.preLedgerCommitmentSha256,
        );
      const sibling = changed.ledgerInclusion.auditPath[0].sha256;
      const newRoot = originalRuntimeOwnerLedgerNodeSha256(newLeaf, sibling);
      const newCheckpoint = signed({
        ...options.ledgerCheckpoint.payload,
        merkleRootSha256: newRoot,
      }, authorities.registry);
      changed.ledgerInclusion = {
        ...changed.ledgerInclusion,
        checkpointSha256: signedEnvelopeSha256(newCheckpoint),
        leafSubjectSha256: changed.preLedgerCommitmentSha256,
        leafHashSha256: newLeaf,
        merkleRootSha256: newRoot,
      };
      options.ledgerCheckpoint = newCheckpoint;
      options.bundle = signed(changed, authorities.release);
    },
  };
}

test("synthetic signed release bundle closes supported bindings but stays non-authoritative", async (context) => {
  const fixture = await createFixture(context);
  const result = await verifyOriginalRuntimeReleaseBundleDiagnostic(
    fixture.options,
  );
  assert.equal(result.validationPassed, true);
  assert.equal(result.diagnosticOnly, true);
  assert.equal(result.authoritative, false);
  assert.equal(result.trustVerified, false);
  assert.equal(result.readyForProductionPromotion, false);
  assert.equal(result.promotionWritable, false);
  assert.equal(result.strictAcceptanceEffect, false);
  assert.equal(result.authoritativePromotionPerformed, false);
  assert.equal(result.transactionInspectionStatus, "not-started");
  assert.equal(
    result.transactionPlanSha256,
    fixture.plan.descriptor.planSha256,
  );
  assert.equal(
    result.fullDagSha256,
    fixture.options.bundle.payload.typedDag.fullDagSha256,
  );
  assert.equal(
    result.releaseTransactionSha256,
    fixture.options.bundle.payload.trustHistory.releaseTransactionSha256,
  );
  assert.equal(
    result.ledgerMerkleRootSha256,
    fixture.options.bundle.payload.ledgerInclusion.merkleRootSha256,
  );
  assert.equal(result.nonceDurablyReserved, false);
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(
    new Set(result.blockingDiagnostics.map(({code}) => code)),
    new Set([
      "ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_DISABLED",
      "ORIGINAL_RUNTIME_PRODUCTION_TRUST_ANCHOR_NOT_CONFIGURED",
      "ORIGINAL_RUNTIME_CAPTURE_OPERATOR_AUTHORITY_UNPROVEN",
      "ORIGINAL_RUNTIME_DAG_SEMANTIC_AUTHORITY_UNPROVEN",
      "ORIGINAL_RUNTIME_LEDGER_DURABILITY_UNPROVEN",
      "ORIGINAL_RUNTIME_NONCE_NOT_DURABLY_RESERVED",
      "ORIGINAL_RUNTIME_TRANSACTION_WRITES_DISABLED",
    ]),
  );
});

test("schema rejects self-hash/circular-hash fields and bundle signature tampering", async (context) => {
  const fixture = await createFixture(context);
  const circular = structuredClone(fixture.options.bundle);
  circular.payload.bundleSha256 = sha256("forbidden-self-hash");
  assert.throws(
    () => validateOriginalRuntimeReleaseBundleSchema(circular, {now: at(9)}),
    /fields must be exactly/,
  );

  fixture.options.bundle = structuredClone(fixture.options.bundle);
  fixture.options.bundle.payload.bundledAt = atSeconds(481);
  await assert.rejects(
    verifyOriginalRuntimeReleaseBundleDiagnostic(fixture.options),
    /release bundle Ed25519 signature is invalid/,
  );
});

test("re-signed substitution cannot alter typed DAG, execution, trust history, outputs, or nonce/plan", async (context) => {
  const cases = [
    [
      "typed DAG",
      (payload) => {
        payload.typedDag.fullDagSha256 = sha256("substituted-full-dag");
      },
      /typed DAG root\/full-DAG binding differs/,
    ],
    [
      "runtime",
      (payload) => {
        payload.execution.runtime.version = "substituted-runtime";
      },
      /operator\/runtime\/toolchain binding differs/,
    ],
    [
      "registry history",
      (payload) => {
        payload.trustHistory.registryCheckpointSha256[0] =
          sha256("substituted-registry-checkpoint");
      },
      /registry\/revocation\/review history binding differs/,
    ],
    [
      "expected output",
      (payload) => {
        payload.expectedOutputs[0].sha256 =
          sha256("substituted-canonical-output");
        payload.transaction.expectedOutputsSha256 =
          sha256Canonical(payload.expectedOutputs);
      },
      /expected output hashes differ from the transaction plan/,
    ],
    [
      "transaction plan",
      (payload) => {
        payload.transaction.planSha256 = sha256("substituted-plan");
      },
      /transaction semantics\/plan binding differs/,
    ],
    [
      "nonce",
      (payload) => {
        payload.nonce = "substituted-nonce-0123456789abcdef0123456789";
        payload.transaction.transactionNonce = payload.nonce;
      },
      /transaction semantics\/plan binding differs/,
    ],
  ];
  for (const [label, mutate, expected] of cases) {
    await context.test(label, async (subtest) => {
      const fixture = await createFixture(subtest);
      fixture.reseal(mutate);
      await assert.rejects(
        verifyOriginalRuntimeReleaseBundleDiagnostic(fixture.options),
        expected,
      );
    });
  }
});

test("ledger inclusion and registry-authority signature fail closed", async (context) => {
  await context.test("impossible audit path", async (subtest) => {
    const fixture = await createFixture(subtest);
    fixture.resign((payload) => {
      payload.ledgerInclusion.auditPath[0].position = "left";
    });
    await assert.rejects(
      verifyOriginalRuntimeReleaseBundleDiagnostic(fixture.options),
      /audit path shape is impossible/,
    );
  });
  await context.test("tampered checkpoint", async (subtest) => {
    const fixture = await createFixture(subtest);
    fixture.options.ledgerCheckpoint = structuredClone(
      fixture.options.ledgerCheckpoint,
    );
    fixture.options.ledgerCheckpoint.payload.issuedAt = atSeconds(451);
    await assert.rejects(
      verifyOriginalRuntimeReleaseBundleDiagnostic(fixture.options),
      /owner ledger checkpoint Ed25519 signature is invalid/,
    );
  });
  await context.test("wrong ledger authority key", async (subtest) => {
    const fixture = await createFixture(subtest);
    fixture.options.ledgerSignerPublicKeyPem =
      fixture.authorities.owner.publicKeyPem;
    await assert.rejects(
      verifyOriginalRuntimeReleaseBundleDiagnostic(fixture.options),
      /ledger checkpoint public key differs/,
    );
  });
});

test("all production and transaction write fuses remain hard-disabled", async () => {
  assert.equal(ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED, false);
  assert.equal(ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED, false);
  assert.equal(ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED, false);
  await assert.rejects(
    executeOriginalRuntimePromotionTransaction(),
    {code: ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE},
  );
  await assert.rejects(
    recoverOriginalRuntimePromotionTransaction(),
    {code: ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_DISABLED_CODE},
  );
});
