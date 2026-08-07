import assert from "node:assert/strict";
import {generateKeyPairSync, sign} from "node:crypto";
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  LIVE_SESSION_ALLOWED_ROOT,
  LIVE_SESSION_EVIDENCE_FILES,
  LIVE_SESSION_EVIDENCE_TYPES,
  LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED_CODE,
  LIVE_SESSION_PRODUCTION_OWNER_ROOT,
  LIVE_SESSION_PRODUCTION_TRUST_ROOT_PATH,
  LIVE_SESSION_STATUS,
  loadOriginalRuntimeLiveSessionBundle,
  verifyOriginalRuntimeLiveSession,
  verifyOriginalRuntimeLiveSessionDiagnostic,
} from "./lib/original-runtime-live-session-consumer.mjs";
import {
  SIGNATURE_ALGORITHM,
  TRUST_EVIDENCE_TYPES,
  TRUST_ROLES,
  canonicalJson,
  ed25519PublicKeyFingerprint,
  loadExternalTrustRootConfig,
  sha256Bytes,
  sha256Canonical,
  signedEnvelopeSha256,
  trustRootAuthoritySha256,
} from "./lib/original-runtime-promotion-trust.mjs";

const epoch = Date.UTC(2026, 6, 26, 0, 0, 0);
const at = (minute) => new Date(epoch + minute * 60 * 1000).toISOString();
const hash = (value) => sha256Bytes(Buffer.from(value));
const authorityFalse = () => ({
  authoritativeOriginalRuntimeTrace: false,
  authoritativeBaseline: false,
  baselineAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  publicRelease: false,
});

function signer(subjectId, displayName, roles) {
  const {publicKey, privateKey} = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({type: "spki", format: "pem"}).toString();
  return {
    privateKey,
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

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function fileSha256(value) {
  return sha256Bytes(jsonBytes(value));
}

function phaseStateSha256({phase, sequence, envelopeSha256, sessionPlanSha256, sessionNonce}) {
  return sha256Canonical({
    schemaVersion: 1,
    evidenceType: "original-runtime-live-session-phase-state",
    phase,
    sequence,
    envelopeSha256,
    sessionPlanSha256,
    sessionNonce,
  });
}

async function createFixture(context, {
  processId = 100123,
  observedFlashPids = [97581],
  processStartedAt = at(6),
  reuseReleaseAsOperator = false,
  withAudio = false,
  unexpectedAudioWhenNull = false,
} = {}) {
  const temporary = await mkdtemp(path.join(await realpath(os.tmpdir()), "help-math-live-session-"));
  context.after(() => rm(temporary, {recursive: true, force: true}));
  const projectRoot = path.join(temporary, "project");
  const ownerRoot = path.join(temporary, "owner");
  const sessionId = "ts006-live-session-001";
  const sessionRoot = path.join(projectRoot, LIVE_SESSION_ALLOWED_ROOT, sessionId);
  await Promise.all([
    mkdir(sessionRoot, {recursive: true}),
    mkdir(ownerRoot, {recursive: true}),
  ]);

  const authorities = {
    registry: signer("01-registry", "Registry Authority", [TRUST_ROLES.registry]),
    operator: signer("02-operator", "Capture Operator", [TRUST_ROLES.captureOperator]),
    reviewer: signer("03-reviewer", "Independent Reviewer", [TRUST_ROLES.humanReview]),
    owner: signer("04-owner", "Owner Representative", [TRUST_ROLES.ownerDecision]),
    release: signer(
      "05-release",
      "Release Custodian",
      reuseReleaseAsOperator
        ? [TRUST_ROLES.captureOperator, TRUST_ROLES.release]
        : [TRUST_ROLES.release],
    ),
  };
  const operatorAuthority = reuseReleaseAsOperator ? authorities.release : authorities.operator;
  const trustRoot = {
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.trustRoot,
    trustRootId: "owner-live-session-root-2026",
    issuedAt: at(0),
    subjects: Object.values(authorities).map(({rootRecord}) => rootRecord),
    statePins: {
      registryHead: {sha256: "0".repeat(64), sequence: 1},
      revocationHead: {
        sha256: "0".repeat(64),
        sequence: 1,
        minimumSequence: 1,
        issuedAt: at(11),
        maximumAgeMs: 5 * 60 * 1000,
        validUntil: at(15),
      },
    },
  };
  const rootAuthoritySha256 = trustRootAuthoritySha256(trustRoot);
  const registry = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.registryCheckpoint,
    trustRootId: trustRoot.trustRootId,
    trustRootSha256: rootAuthoritySha256,
    registryId: "live-session-registry",
    sequence: 1,
    previousCheckpointSha256: null,
    issuedAt: at(1),
    entries: Object.values(authorities).map(({rootRecord}) => ({
      subjectId: rootRecord.subjectId,
      keyFingerprintSha256: rootRecord.keyFingerprintSha256,
      authorizedRoles: rootRecord.authorizedRoles,
      registeredAt: at(0),
      status: "active",
    })).sort((left, right) => left.subjectId.localeCompare(right.subjectId)),
  }, authorities.registry);
  const revocation = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.revocationCheckpoint,
    trustRootId: trustRoot.trustRootId,
    trustRootSha256: rootAuthoritySha256,
    registryCheckpointSha256: signedEnvelopeSha256(registry),
    sequence: 1,
    previousCheckpointSha256: null,
    issuedAt: at(11),
    revocations: [],
  }, authorities.registry);
  trustRoot.statePins = {
    registryHead: {
      sha256: signedEnvelopeSha256(registry),
      sequence: 1,
    },
    revocationHead: {
      sha256: signedEnvelopeSha256(revocation),
      sequence: 1,
      minimumSequence: 1,
      issuedAt: at(11),
      maximumAgeMs: 5 * 60 * 1000,
      validUntil: at(15),
    },
  };
  const trustRootPath = path.join(ownerRoot, "trust-root.json");
  await writeFile(trustRootPath, jsonBytes(trustRoot));

  const sessionPlan = {
    schemaVersion: 1,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.sessionPlan,
    status: "pending-candidate-session-plan",
    sessionId,
    animationId: "course-g04-l03-ts-006",
    language: "en",
    requirementIds: [
      "req:root:lesson-shell-natural-entry:en",
      "req:sprite-23:lesson-shell-natural-entry:en",
    ],
    traceSpecSetSha256: hash("trace-spec-set"),
    sessionKitSha256: hash("session-kit"),
    profileManifestSha256: hash("profile-manifest"),
    hostTreeManifestSha256: hash("host-tree"),
    projectorExecutableSha256: hash("projector"),
    containmentReadinessSha256: hash("containment"),
    runtimeEnvironmentReadinessSha256: hash("runtime-environment"),
    hostIdSha256: hash("authorized-host"),
    createdAt: at(1),
    authority: authorityFalse(),
  };
  const sessionPlanSha256 = fileSha256(sessionPlan);
  const sessionNonce = "nonce-live-session-0123456789abcdef";
  const nonceReservation = signed({
    schemaVersion: 1,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.nonceReservation,
    status: "reserved-for-one-live-session",
    sessionId,
    animationId: sessionPlan.animationId,
    language: "en",
    sessionPlanSha256,
    sessionNonce,
    reservationId: "live-session-nonce-reservation-001",
    nonceSequence: 1,
    previousNonceReservationSha256: null,
    reservedAt: at(2),
    scope: "reserve-one-live-session-nonce-no-promotion-authority",
  }, authorities.release);
  const nonceReservationSha256 = fileSha256(nonceReservation);
  const prelaunchAuthorization = signed({
    schemaVersion: 1,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.prelaunchAuthorization,
    decision: "authorized",
    sessionId,
    animationId: sessionPlan.animationId,
    language: "en",
    sessionPlanSha256,
    nonceReservationSha256,
    sessionNonce,
    phaseSequence: 1,
    previousEnvelopeSha256: null,
    expectedPriorStateSha256: null,
    operatorSubjectId: operatorAuthority.rootRecord.subjectId,
    independentReviewerSubjectId: authorities.reviewer.rootRecord.subjectId,
    releaseCustodianSubjectId: authorities.release.rootRecord.subjectId,
    processAbsenceSnapshot: {
      capturedAt: at(3),
      hostIdSha256: sessionPlan.hostIdSha256,
      processTableSha256: hash("prelaunch-process-table"),
      observedFlashPids,
    },
    containmentApproval: {
      controlIds: ["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08"],
      approvalManifestSha256: hash("owner-containment-approval"),
      liveNoEgressPreflightSha256: hash("no-egress-preflight"),
      liveCapacityPreflightSha256: hash("capacity-preflight"),
    },
    authorizedAt: at(4),
    notAfter: at(7),
    scope: "authorize-exact-live-session-only-no-baseline-or-acceptance",
  }, authorities.owner);
  const prelaunchAuthorizationSha256 = fileSha256(prelaunchAuthorization);
  const independentReviewAssignment = signed({
    schemaVersion: 1,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.independentReviewAssignment,
    status: "assigned-no-review-performed",
    sessionId,
    animationId: sessionPlan.animationId,
    language: "en",
    sessionPlanSha256,
    prelaunchAuthorizationSha256,
    assignedAt: at(5),
    scope: "future-independent-review-assignment-no-acceptance-effect",
  }, authorities.reviewer);
  const independentReviewAssignmentSha256 = fileSha256(independentReviewAssignment);
  const prelaunchStateSha256 = phaseStateSha256({
    phase: "prelaunch",
    sequence: 1,
    envelopeSha256: prelaunchAuthorizationSha256,
    sessionPlanSha256,
    sessionNonce,
  });
  const processClaim = signed({
    schemaVersion: 1,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.processClaim,
    status: "fresh-process-claimed",
    sessionId,
    animationId: sessionPlan.animationId,
    language: "en",
    sessionPlanSha256,
    nonceReservationSha256,
    prelaunchAuthorizationSha256,
    independentReviewAssignmentSha256,
    sessionNonce,
    phaseSequence: 2,
    previousEnvelopeSha256: prelaunchAuthorizationSha256,
    expectedPriorStateSha256: prelaunchStateSha256,
    processId,
    processStartedAt,
    processIdentitySha256: hash(`process-identity-${processId}`),
    projectorExecutableSha256: sessionPlan.projectorExecutableSha256,
    claimedAt: at(7),
    scope: "claim-fresh-post-authorization-process-only-no-baseline-authority",
  }, operatorAuthority);
  const processClaimSha256 = fileSha256(processClaim);
  const evidenceFiles = {
    [LIVE_SESSION_EVIDENCE_FILES.operationLog]: Buffer.from([
      0xff, 0xfe, 0xfd, 0x00, 0x6f, 0x70, 0x73,
    ]),
    [LIVE_SESSION_EVIDENCE_FILES.stateLog]: Buffer.from("opaque state evidence\n"),
    [LIVE_SESSION_EVIDENCE_FILES.sourceTargetLog]: Buffer.from("opaque source-target evidence\n"),
    [LIVE_SESSION_EVIDENCE_FILES.hostEntryLog]: Buffer.from("opaque host-entry evidence\n"),
    [LIVE_SESSION_EVIDENCE_FILES.frameManifest]: Buffer.from("opaque frame-manifest evidence; deliberately not parsed\n"),
    [LIVE_SESSION_EVIDENCE_FILES.requestAudit]: Buffer.from("PRIVATE_REQUEST_AUDIT_CONTENT_DO_NOT_LEAK\n"),
  };
  if (withAudio || unexpectedAudioWhenNull) {
    evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.audioManifest] =
      Buffer.from("opaque audio-manifest evidence; deliberately not parsed\n");
  }
  const candidateManifest = {
    schemaVersion: 1,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.candidateManifest,
    status: "pending-candidate",
    sessionId,
    animationId: sessionPlan.animationId,
    language: "en",
    sessionPlanSha256,
    prelaunchAuthorizationSha256,
    processClaimSha256,
    operationLogSha256: sha256Bytes(evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.operationLog]),
    stateLogSha256: sha256Bytes(evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.stateLog]),
    sourceTargetLogSha256: sha256Bytes(evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.sourceTargetLog]),
    hostEntryLogSha256: sha256Bytes(evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.hostEntryLog]),
    frameManifestSha256: sha256Bytes(evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.frameManifest]),
    audioManifestSha256: withAudio
      ? sha256Bytes(evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.audioManifest])
      : null,
    requestAuditSha256: sha256Bytes(evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.requestAudit]),
    createdAt: at(9),
    authority: authorityFalse(),
  };
  const candidateManifestSha256 = fileSha256(candidateManifest);
  const claimStateSha256 = phaseStateSha256({
    phase: "claim",
    sequence: 2,
    envelopeSha256: processClaimSha256,
    sessionPlanSha256,
    sessionNonce,
  });
  const sessionCompletion = signed({
    schemaVersion: 1,
    evidenceType: LIVE_SESSION_EVIDENCE_TYPES.sessionCompletion,
    status: "completed-for-pending-candidate-only",
    sessionId,
    animationId: sessionPlan.animationId,
    language: "en",
    sessionPlanSha256,
    candidateManifestSha256,
    nonceReservationSha256,
    prelaunchAuthorizationSha256,
    independentReviewAssignmentSha256,
    processClaimSha256,
    sessionNonce,
    phaseSequence: 3,
    previousEnvelopeSha256: processClaimSha256,
    expectedPriorStateSha256: claimStateSha256,
    endedAt: at(8),
    completedAt: at(10),
    processExited: true,
    successfulOutboundRequests: 0,
    persistentSideEffects: 0,
    scope: "complete-session-as-pending-candidate-only-no-baseline-or-acceptance",
  }, operatorAuthority);

  const documents = {
    "session-plan.json": sessionPlan,
    "candidate-manifest.json": candidateManifest,
    "nonce-reservation-envelope.json": nonceReservation,
    "prelaunch-authorization-envelope.json": prelaunchAuthorization,
    "independent-review-assignment-envelope.json": independentReviewAssignment,
    "process-claim-envelope.json": processClaim,
    "session-completion-envelope.json": sessionCompletion,
  };
  await Promise.all(Object.entries(documents).map(([fileName, document]) =>
    writeFile(path.join(sessionRoot, fileName), jsonBytes(document))));
  await Promise.all(Object.entries(evidenceFiles).map(([fileName, bytes]) =>
    writeFile(path.join(sessionRoot, fileName), bytes)));
  const trustRootContext = await loadExternalTrustRootConfig({
    projectRoot,
    ownerControlledRoot: ownerRoot,
    trustRootConfigPath: trustRootPath,
    now: at(12),
  });

  return {
    temporary,
    projectRoot,
    ownerRoot,
    sessionRoot,
    trustRootContext,
    registryCheckpoints: [registry],
    revocationCheckpoints: [revocation],
    documents,
    authorities,
    sessionNonce,
    evidenceFiles,
    async load() {
      return loadOriginalRuntimeLiveSessionBundle({projectRoot, sessionRoot});
    },
    async rewrite(fileName) {
      await writeFile(path.join(sessionRoot, fileName), jsonBytes(documents[fileName]));
    },
    async rewriteEvidence(fileName, bytes) {
      evidenceFiles[fileName] = bytes;
      await writeFile(path.join(sessionRoot, fileName), bytes);
    },
  };
}

test("verifies a five-role signed live session only as a pending candidate", async (context) => {
  const fixture = await createFixture(context);
  const bundle = await fixture.load();
  const result = verifyOriginalRuntimeLiveSessionDiagnostic({
    bundle,
    trustRoot: fixture.trustRootContext,
    registryCheckpoints: fixture.registryCheckpoints,
    revocationCheckpoints: fixture.revocationCheckpoints,
    replayedNonces: [],
    now: at(12),
  });
  assert.equal(result.status, LIVE_SESSION_STATUS);
  assert.equal(result.originalRuntimeCandidateVerified, true);
  assert.equal(result.diagnosticOnly, true);
  assert.equal(result.productionAnchorConfigured, false);
  assert.equal(result.trustVerifiedForLiveSession, false);
  assert.equal(result.authoritativeOriginalRuntimeTrace, false);
  assert.equal(result.authoritativeBaseline, false);
  assert.equal(result.baselineAccepted, false);
  assert.equal(result.humanVisualAccepted, false);
  assert.equal(result.ownerAccepted, false);
  assert.equal(result.strictMigrationComplete, false);
  assert.equal(result.publicRelease, false);
  assert.equal(result.strictAcceptanceEffect, "none");
  assert.equal(new Set(Object.values(result.roles).map(({subjectId}) => subjectId)).size, 5);
  assert.equal(new Set(Object.values(result.roles).map(({keyFingerprintSha256}) => keyFingerprintSha256)).size, 5);
  assert.equal(result.replayProtection.phaseCasChainVerified, true);
  assert.deepEqual(
    Object.keys(result.bindings.evidenceFiles).sort(),
    Object.keys(LIVE_SESSION_EVIDENCE_FILES).sort(),
  );
  for (const [key, fileName] of Object.entries(LIVE_SESSION_EVIDENCE_FILES)) {
    if (key === "audioManifest") {
      assert.equal(result.bindings.evidenceFiles[key], null);
      continue;
    }
    assert.deepEqual(result.bindings.evidenceFiles[key], {
      file: fileName,
      bytes: fixture.evidenceFiles[fileName].length,
      sha256: sha256Bytes(fixture.evidenceFiles[fileName]),
    });
  }
  assert.doesNotMatch(JSON.stringify(bundle), /PRIVATE_REQUEST_AUDIT_CONTENT_DO_NOT_LEAK/);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_REQUEST_AUDIT_CONTENT_DO_NOT_LEAK/);
  assert.equal(Object.isFrozen(result), true);
});

test("fixed production trust anchor cannot be supplied by the candidate or environment", async (context) => {
  const fixture = await createFixture(context);
  const bundle = await fixture.load();
  assert.equal(
    LIVE_SESSION_PRODUCTION_TRUST_ROOT_PATH,
    `${LIVE_SESSION_PRODUCTION_OWNER_ROOT}/trust-root.json`,
  );
  await assert.rejects(
    () => verifyOriginalRuntimeLiveSession({
      projectRoot: fixture.projectRoot,
      bundle,
      registryCheckpoints: fixture.registryCheckpoints,
      revocationCheckpoints: fixture.revocationCheckpoints,
      replayedNonces: [],
      now: at(12),
      trustRoot: fixture.trustRootContext,
    }),
    (error) =>
      error.code === LIVE_SESSION_PRODUCTION_ANCHOR_NOT_CONFIGURED_CODE &&
      /fixed production trust anchor is unavailable or invalid/.test(error.message),
  );
});

test("rejects protected, observed, or retroactively claimed PIDs", async (context) => {
  await context.test("currently running diagnostic PID 97581", async (subtest) => {
    const fixture = await createFixture(subtest, {processId: 97581});
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /protected pre-existing diagnostic PID 97581|reuses a PID observed before authorization/,
    );
  });
  await context.test("PID observed before authorization", async (subtest) => {
    const fixture = await createFixture(subtest, {processId: 100123, observedFlashPids: [97581, 100123]});
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /reuses a PID observed before authorization/,
    );
  });
  await context.test("process start predates authorization", async (subtest) => {
    const fixture = await createFixture(subtest, {processStartedAt: at(3)});
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /retroactive or predates owner authorization/,
    );
  });
});

test("rejects signer reuse, nonce replay, phase-CAS drift, and manifest substitution", async (context) => {
  await context.test("same release subject reused as operator", async (subtest) => {
    const fixture = await createFixture(subtest, {reuseReleaseAsOperator: true});
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /five distinct subject IDs/,
    );
  });
  await context.test("replayed nonce", async (subtest) => {
    const fixture = await createFixture(subtest);
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [fixture.sessionNonce],
        now: at(12),
      }),
      /session nonce has already been used/,
    );
  });
  await context.test("phase CAS drift", async (subtest) => {
    const fixture = await createFixture(subtest);
    fixture.documents["process-claim-envelope.json"].payload.expectedPriorStateSha256 = hash("wrong-prior-state");
    await fixture.rewrite("process-claim-envelope.json");
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /expected-prior-state CAS digest drifted/,
    );
  });
  await context.test("candidate manifest substitution", async (subtest) => {
    const fixture = await createFixture(subtest);
    fixture.documents["candidate-manifest.json"].frameManifestSha256 = hash("substituted-frame-manifest");
    await fixture.rewrite("candidate-manifest.json");
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /completion candidate-manifest digest drifted/,
    );
  });
});

test("bundle loader rejects path escape, symbolic links, and hard links", async (context) => {
  await context.test("path escape", async (subtest) => {
    const fixture = await createFixture(subtest);
    await assert.rejects(
      () => loadOriginalRuntimeLiveSessionBundle({
        projectRoot: fixture.projectRoot,
        sessionRoot: fixture.ownerRoot,
      }),
      /session root must be a child of the fixed live-session allowlist/,
    );
  });
  await context.test("symbolic-link evidence file", async (subtest) => {
    const fixture = await createFixture(subtest);
    const target = path.join(fixture.sessionRoot, "session-plan.json");
    const linked = path.join(fixture.sessionRoot, "candidate-manifest.json");
    await unlink(linked);
    await symlink(target, linked);
    await assert.rejects(
      () => fixture.load(),
      /regular non-symlink file|resolve without symbolic links/,
    );
  });
  await context.test("hard-linked evidence file", async (subtest) => {
    const fixture = await createFixture(subtest);
    const source = path.join(fixture.sessionRoot, "session-plan.json");
    const linked = path.join(fixture.sessionRoot, "candidate-manifest.json");
    await unlink(linked);
    await link(source, linked);
    await assert.rejects(
      () => fixture.load(),
      /exactly one hard link/,
    );
  });
  await context.test("symbolic-link opaque evidence file", async (subtest) => {
    const fixture = await createFixture(subtest);
    const target = path.join(
      fixture.sessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.stateLog,
    );
    const linked = path.join(
      fixture.sessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.operationLog,
    );
    await unlink(linked);
    await symlink(target, linked);
    await assert.rejects(
      () => fixture.load(),
      /regular non-symlink file|resolve without symbolic links/,
    );
  });
  await context.test("hard-linked opaque evidence file", async (subtest) => {
    const fixture = await createFixture(subtest);
    const source = path.join(
      fixture.sessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.stateLog,
    );
    const linked = path.join(
      fixture.sessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.operationLog,
    );
    await unlink(linked);
    await link(source, linked);
    await assert.rejects(
      () => fixture.load(),
      /exactly one hard link/,
    );
  });
});

test("requires and hashes the complete fixed-name opaque evidence closure", async (context) => {
  await context.test("missing mandatory operation log", async (subtest) => {
    const fixture = await createFixture(subtest);
    await unlink(path.join(
      fixture.sessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.operationLog,
    ));
    await assert.rejects(
      () => fixture.load(),
      /required operationLog file is missing/,
    );
  });
  await context.test("actual evidence bytes substituted after manifest creation", async (subtest) => {
    const fixture = await createFixture(subtest);
    await fixture.rewriteEvidence(
      LIVE_SESSION_EVIDENCE_FILES.stateLog,
      Buffer.from("substituted state evidence bytes\n"),
    );
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /stateLogSha256 differs from the actual state-log\.jsonl bytes/,
    );
  });
  await context.test("empty mandatory evidence file", async (subtest) => {
    const fixture = await createFixture(subtest);
    await fixture.rewriteEvidence(
      LIVE_SESSION_EVIDENCE_FILES.requestAudit,
      Buffer.alloc(0),
    );
    const bundle = await fixture.load();
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /required evidence file request-audit\.json must not be empty/,
    );
  });
  await context.test("evidence substituted after bundle load but before verification", async (subtest) => {
    const fixture = await createFixture(subtest);
    const bundle = await fixture.load();
    await fixture.rewriteEvidence(
      LIVE_SESSION_EVIDENCE_FILES.hostEntryLog,
      Buffer.from("post-load host-entry substitution\n"),
    );
    assert.throws(
      () => verifyOriginalRuntimeLiveSessionDiagnostic({
        bundle,
        trustRoot: fixture.trustRootContext,
        registryCheckpoints: fixture.registryCheckpoints,
        revocationCheckpoints: fixture.revocationCheckpoints,
        replayedNonces: [],
        now: at(12),
      }),
      /hostEntryLog.*metadata changed|hostEntryLog.*SHA-256 changed/,
    );
  });
  await context.test("all six mandatory file bindings are actual byte hashes", async (subtest) => {
    const fixture = await createFixture(subtest);
    const bundle = await fixture.load();
    for (const [key, fileName] of Object.entries(LIVE_SESSION_EVIDENCE_FILES)) {
      if (key === "audioManifest") continue;
      const actualBytes = await readFile(path.join(fixture.sessionRoot, fileName));
      assert.deepEqual(bundle.evidenceFiles[key], {
        file: fileName,
        bytes: actualBytes.length,
        sha256: sha256Bytes(actualBytes),
      });
    }
  });
});

test("audio manifest follows a fail-closed null-or-required fixed-file rule", async (context) => {
  await context.test("non-null audio digest requires and binds the fixed audio file", async (subtest) => {
    const fixture = await createFixture(subtest, {withAudio: true});
    const bundle = await fixture.load();
    const result = verifyOriginalRuntimeLiveSessionDiagnostic({
      bundle,
      trustRoot: fixture.trustRootContext,
      registryCheckpoints: fixture.registryCheckpoints,
      revocationCheckpoints: fixture.revocationCheckpoints,
      replayedNonces: [],
      now: at(12),
    });
    const audioBytes = fixture.evidenceFiles[LIVE_SESSION_EVIDENCE_FILES.audioManifest];
    assert.deepEqual(result.bindings.evidenceFiles.audioManifest, {
      file: LIVE_SESSION_EVIDENCE_FILES.audioManifest,
      bytes: audioBytes.length,
      sha256: sha256Bytes(audioBytes),
    });
  });
  await context.test("non-null audio digest with missing file", async (subtest) => {
    const fixture = await createFixture(subtest, {withAudio: true});
    await unlink(path.join(
      fixture.sessionRoot,
      LIVE_SESSION_EVIDENCE_FILES.audioManifest,
    ));
    await assert.rejects(
      () => fixture.load(),
      /required audioManifest file is missing/,
    );
  });
  await context.test("null audio digest forbids an unbound audio file", async (subtest) => {
    const fixture = await createFixture(subtest, {unexpectedAudioWhenNull: true});
    await assert.rejects(
      () => fixture.load(),
      /audio manifest must be absent when audioManifestSha256 is null/,
    );
  });
});

test("closure-wide revalidation rejects a file changed after its individual read", async (context) => {
  const fixture = await createFixture(context);
  await fixture.rewriteEvidence(
    LIVE_SESSION_EVIDENCE_FILES.operationLog,
    Buffer.alloc(64 * 1024 * 1024, 0x5a),
  );
  const statePath = path.join(
    fixture.sessionRoot,
    LIVE_SESSION_EVIDENCE_FILES.stateLog,
  );
  let stop = false;
  let writes = 0;
  const churn = (async () => {
    while (!stop) {
      writes += 1;
      await writeFile(
        statePath,
        Buffer.from(`state evidence mutation ${writes.toString().padStart(8, "0")}\n`),
      );
      await new Promise((resolve) => setImmediate(resolve));
    }
  })();
  try {
    await assert.rejects(
      () => fixture.load(),
      /metadata changed|closure|evidence-closure completion/,
    );
  } finally {
    stop = true;
    await churn;
  }
  assert.ok(writes > 0);
});

test("opaque bundle and trust contexts cannot be reconstructed from JSON", async (context) => {
  const fixture = await createFixture(context);
  const bundle = await fixture.load();
  const forgedBundle = JSON.parse(JSON.stringify(bundle));
  assert.throws(
    () => verifyOriginalRuntimeLiveSessionDiagnostic({
      bundle: forgedBundle,
      trustRoot: fixture.trustRootContext,
      registryCheckpoints: fixture.registryCheckpoints,
      revocationCheckpoints: fixture.revocationCheckpoints,
      replayedNonces: [],
      now: at(12),
    }),
    /opaque bundle/,
  );
  const bytes = await readFile(path.join(fixture.sessionRoot, "session-plan.json"));
  assert.equal(sha256Bytes(bytes), bundle.files.sessionPlan.sha256);
});
