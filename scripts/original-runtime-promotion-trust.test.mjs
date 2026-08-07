import assert from "node:assert/strict";
import {generateKeyPairSync, sign} from "node:crypto";
import {link, mkdir, mkdtemp, realpath, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  HUMAN_REVIEW_SCOPE,
  ANCHOR_NOT_CONFIGURED_CODE,
  OWNER_DECISION_SCOPE,
  PROMOTION_WRITES_ENABLED,
  RELEASE_SCOPE,
  REVOCATION_FRESHNESS_PROTOCOL_MAX_MS,
  SIGNATURE_ALGORITHM,
  TRUST_EVIDENCE_TYPES,
  TRUST_ROLES,
  canonicalJson,
  ed25519PublicKeyFingerprint,
  loadExternalTrustRootConfig,
  sha256Bytes,
  signedEnvelopeSha256,
  trustRootAuthoritySha256,
  validateTrustRootConfig,
  verifyOriginalRuntimePromotionTrust,
  verifyOriginalRuntimePromotionTrustDiagnostic,
} from "./lib/original-runtime-promotion-trust.mjs";

const epoch = Date.UTC(2026, 6, 23, 1, 0, 0);
const atSeconds = (seconds) => new Date(epoch + seconds * 1000).toISOString();
const at = (minute) => atSeconds(minute * 60);
const hash = (value) => sha256Bytes(Buffer.from(value));

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
      signatureBase64: sign(null, Buffer.from(canonicalJson(payload)), authority.privateKey).toString("base64"),
    },
  };
}

function buildFixture({
  registryIssuedAt = at(1),
  revokedSigners = [],
  roleOverrides = {},
  crossRegistry = false,
  omitCarryForward = false,
  staleRegistryPin = false,
  releaseRegisteredPostCapture = false,
} = {}) {
  const authorities = {
    registry: signer("01-registry", "Registry Authority", roleOverrides.registry || [TRUST_ROLES.registry]),
    human: signer("02-human", "Human Reviewer", roleOverrides.human || [TRUST_ROLES.humanReview]),
    owner: signer("03-owner", "Owner Representative", roleOverrides.owner || [TRUST_ROLES.ownerDecision]),
    release: signer("04-release", "Release Authority", roleOverrides.release || [TRUST_ROLES.release]),
    spare: signer("05-spare", "Registered Spare Key", [TRUST_ROLES.release]),
  };
  const trustRoot = {
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.trustRoot,
    trustRootId: "owner-trust-root-2026",
    issuedAt: at(0),
    subjects: Object.values(authorities).map(({rootRecord}) => rootRecord),
    statePins: {
      registryHead: {sha256: "0".repeat(64), sequence: 1},
      revocationHead: {
        sha256: "0".repeat(64),
        sequence: 1,
        minimumSequence: 1,
        issuedAt: at(6),
        maximumAgeMs: 5 * 60 * 1000,
        validUntil: at(10),
      },
    },
  };
  const authoritySha256 = trustRootAuthoritySha256(trustRoot);
  const allEntries = Object.values(authorities).map(({rootRecord}) => ({
    subjectId: rootRecord.subjectId,
    keyFingerprintSha256: rootRecord.keyFingerprintSha256,
    authorizedRoles: rootRecord.authorizedRoles,
    registeredAt: at(0),
    status: "active",
  })).sort((left, right) => left.subjectId.localeCompare(right.subjectId));
  const captureEntries = releaseRegisteredPostCapture
    ? allEntries.filter(({subjectId}) => subjectId !== authorities.release.rootRecord.subjectId)
    : allEntries;
  const registry1 = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.registryCheckpoint,
    trustRootId: trustRoot.trustRootId,
    trustRootSha256: authoritySha256,
    registryId: "promotion-registry",
    sequence: 1,
    previousCheckpointSha256: null,
    issuedAt: registryIssuedAt,
    entries: captureEntries,
  }, authorities.registry);
  const registryCheckpoints = [registry1];
  if (crossRegistry) {
    registryCheckpoints.push(signed({
      ...registry1.payload,
      entries: allEntries,
      sequence: 2,
      previousCheckpointSha256: signedEnvelopeSha256(registry1),
      issuedAt: atSeconds(210),
    }, authorities.registry));
  }
  const registryHead = registryCheckpoints.at(-1);
  const capture = {sessionId: "capture-session-001", startedAt: at(2), endedAt: at(3)};
  const artifactBindings = {
    candidateManifestSha256: hash("candidate-manifest"),
    candidateReportSha256: hash("candidate-report"),
    traceSpecSha256: hash("trace-spec"),
    sourceSwfSha256: hash("source-swf"),
  };
  const plannedOutputs = [
    {path: "artifacts/full-frame/accepted/frame-001.png", sha256: hash("frame")},
    {path: "migrations/demo/baseline/original-runtime/requirement.json", sha256: hash("baseline")},
  ];
  const expected = {
    animationId: "course-g04-l01-ir-001",
    requirementId: "req:sprite-58:sound-0:en",
    capture,
    artifactBindings,
    plannedOutputs,
  };
  const humanReview = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.humanReview,
    decision: "accepted",
    animationId: expected.animationId,
    requirementId: expected.requirementId,
    capture,
    artifactBindings,
    captureRegistryCheckpointSha256: signedEnvelopeSha256(registry1),
    verificationRegistryHeadSha256: signedEnvelopeSha256(registryHead),
    reviewedAt: at(4),
    scope: HUMAN_REVIEW_SCOPE,
  }, authorities.human);
  const ownerDecision = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.ownerDecision,
    decision: "authorized",
    animationId: expected.animationId,
    requirementId: expected.requirementId,
    capture,
    artifactBindings,
    captureRegistryCheckpointSha256: signedEnvelopeSha256(registry1),
    verificationRegistryHeadSha256: signedEnvelopeSha256(registryHead),
    humanReviewSha256: signedEnvelopeSha256(humanReview),
    decidedAt: at(5),
    scope: OWNER_DECISION_SCOPE,
  }, authorities.owner);

  let revocationCheckpoints;
  if (crossRegistry) {
    const carriedRevocation = {
      subjectId: authorities.spare.rootRecord.subjectId,
      keyFingerprintSha256: authorities.spare.rootRecord.keyFingerprintSha256,
      revokedAt: atSeconds(190),
      reason: "retired spare fixture key",
    };
    const revocation1 = signed({
      schemaVersion: 1,
      evidenceType: TRUST_EVIDENCE_TYPES.revocationCheckpoint,
      trustRootId: trustRoot.trustRootId,
      trustRootSha256: authoritySha256,
      registryCheckpointSha256: signedEnvelopeSha256(registry1),
      sequence: 1,
      previousCheckpointSha256: null,
      issuedAt: atSeconds(195),
      revocations: [carriedRevocation],
    }, authorities.registry);
    const finalRecords = omitCarryForward ? [] : [carriedRevocation];
    revocationCheckpoints = [revocation1, signed({
      ...revocation1.payload,
      registryCheckpointSha256: signedEnvelopeSha256(registryHead),
      sequence: 2,
      previousCheckpointSha256: signedEnvelopeSha256(revocation1),
      issuedAt: at(6),
      revocations: finalRecords,
    }, authorities.registry)];
  } else {
    const normalizedRevocations = revokedSigners.map((name) => ({
      subjectId: authorities[name].rootRecord.subjectId,
      keyFingerprintSha256: authorities[name].rootRecord.keyFingerprintSha256,
      revokedAt: at(6),
      reason: "fixture revocation",
    })).sort((left, right) => `${left.subjectId}\0${left.keyFingerprintSha256}`.localeCompare(`${right.subjectId}\0${right.keyFingerprintSha256}`));
    revocationCheckpoints = [signed({
      schemaVersion: 1,
      evidenceType: TRUST_EVIDENCE_TYPES.revocationCheckpoint,
      trustRootId: trustRoot.trustRootId,
      trustRootSha256: authoritySha256,
      registryCheckpointSha256: signedEnvelopeSha256(registryHead),
      sequence: 1,
      previousCheckpointSha256: null,
      issuedAt: at(6),
      revocations: normalizedRevocations,
    }, authorities.registry)];
  }
  const revocationHead = revocationCheckpoints.at(-1);
  trustRoot.statePins = {
    registryHead: {
      sha256: staleRegistryPin ? hash("stale-registry-head") : signedEnvelopeSha256(registryHead),
      sequence: registryHead.payload.sequence,
    },
    revocationHead: {
      sha256: signedEnvelopeSha256(revocationHead),
      sequence: revocationHead.payload.sequence,
      minimumSequence: revocationHead.payload.sequence,
      issuedAt: revocationHead.payload.issuedAt,
      maximumAgeMs: 5 * 60 * 1000,
      validUntil: at(10),
    },
  };
  const nonce = "nonce-0123456789abcdef0123456789";
  const releaseTransaction = signed({
    schemaVersion: 1,
    evidenceType: TRUST_EVIDENCE_TYPES.releaseTransaction,
    decision: "authorized",
    releaseId: "release-001",
    animationId: expected.animationId,
    requirementId: expected.requirementId,
    capture,
    artifactBindings,
    captureRegistryCheckpointSha256: signedEnvelopeSha256(registry1),
    verificationRegistryHeadSha256: signedEnvelopeSha256(registryHead),
    revocationCheckpointSha256: signedEnvelopeSha256(revocationHead),
    humanReviewSha256: signedEnvelopeSha256(humanReview),
    ownerDecisionSha256: signedEnvelopeSha256(ownerDecision),
    nonce,
    plannedOutputs,
    releasedAt: at(7),
    scope: RELEASE_SCOPE,
  }, authorities.release);
  return {
    rawTrustRoot: trustRoot,
    args: {
      trustRoot,
      registryCheckpoints,
      revocationCheckpoints,
      humanReview,
      ownerDecision,
      releaseTransaction,
      expected,
      replayedNonces: new Set(),
      now: at(8),
    },
    authorities,
    signed: (name, payload) => signed(payload, authorities[name]),
  };
}

async function externalize(context, item = buildFixture()) {
  const realTempRoot = await realpath(os.tmpdir());
  const temporary = await mkdtemp(path.join(realTempRoot, "help-math-trust-fixture-"));
  context.after(() => rm(temporary, {recursive: true, force: true}));
  const projectRoot = path.join(temporary, "project");
  const ownerRoot = path.join(temporary, "owner");
  await Promise.all([mkdir(projectRoot), mkdir(ownerRoot)]);
  const configPath = path.join(ownerRoot, "trust-root.json");
  await writeFile(configPath, `${JSON.stringify(item.rawTrustRoot, null, 2)}\n`);
  item.args.trustRoot = await loadExternalTrustRootConfig({
    projectRoot,
    ownerControlledRoot: ownerRoot,
    trustRootConfigPath: configPath,
    now: item.args.now,
  });
  return {...item, paths: {temporary, projectRoot, ownerRoot, configPath}};
}

test("full verification requires the unforgeable externally loaded trust context", async (context) => {
  const inline = buildFixture();
  validateTrustRootConfig(inline.rawTrustRoot, {now: inline.args.now});
  assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(inline.args), /requires a trust root loaded from a real external/);

  const {args} = await externalize(context);
  assert.equal(Object.isFrozen(args.trustRoot), true);
  assert.equal("config" in args.trustRoot, false);
  assert.throws(
    () => verifyOriginalRuntimePromotionTrust(args),
    (error) => error.code === ANCHOR_NOT_CONFIGURED_CODE && /no module-fixed out-of-band owner/.test(error.message),
  );
  const result = verifyOriginalRuntimePromotionTrustDiagnostic(args);
  assert.equal(result.ok, true);
  assert.equal(result.cryptographicChecksPassed, true);
  assert.equal(result.diagnosticOnly, true);
  assert.equal(result.authoritative, false);
  assert.equal(result.trustVerified, false);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.promotionWritesEnabled, false);
  assert.equal(PROMOTION_WRITES_ENABLED, false);
  assert.equal(result.nonceReplayEvidence.durableReservationProven, false);
  assert.equal(result.nonceReservationDescriptor.status, "reservation-required-not-persisted");
  assert.match(result.nonceReservationDescriptor.statement, /no durable atomic nonce reservation/);
  assert.equal(result.externalTrustAnchor.configSha256, args.trustRoot.configSha256);
  assert.equal(result.externalTrustAnchor.fileSha256, args.trustRoot.fileSha256);
  assert.equal(result.freshnessPolicy.protocolMaximumAgeMs, REVOCATION_FRESHNESS_PROTOCOL_MAX_MS);
  assert.equal(result.verifiedAt, at(8));
  const forgedArgs = {...args, trustRoot: {...args.trustRoot}};
  assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(forgedArgs), /requires a trust root loaded from a real external/);
});

test("rejects payload tampering, wrong roles, signer reuse, revocation, and replay", async (context) => {
  await context.test("tampering", async (subtest) => {
    const item = await externalize(subtest);
    item.args.humanReview = structuredClone(item.args.humanReview);
    item.args.humanReview.payload.scope = "tampered";
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(item.args), /Ed25519 signature is invalid/);
  });
  await context.test("wrong role", async (subtest) => {
    const item = await externalize(subtest);
    item.args.humanReview = item.signed("release", item.args.humanReview.payload);
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(item.args), /not authorized for human-evidence-reviewer/);
  });
  await context.test("same subject reused", async (subtest) => {
    const item = await externalize(subtest, buildFixture({roleOverrides: {release: [TRUST_ROLES.humanReview, TRUST_ROLES.release]}}));
    item.args.humanReview = item.signed("release", item.args.humanReview.payload);
    item.args.ownerDecision = item.signed("owner", {...item.args.ownerDecision.payload, humanReviewSha256: signedEnvelopeSha256(item.args.humanReview)});
    item.args.releaseTransaction = item.signed("release", {
      ...item.args.releaseTransaction.payload,
      humanReviewSha256: signedEnvelopeSha256(item.args.humanReview),
      ownerDecisionSha256: signedEnvelopeSha256(item.args.ownerDecision),
    });
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(item.args), /four distinct subject IDs/);
  });
  await context.test("revoked reviewer", async (subtest) => {
    const {args} = await externalize(subtest, buildFixture({revokedSigners: ["human"]}));
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(args), /human review signer key is revoked/);
  });
  await context.test("replayed nonce", async (subtest) => {
    const {args} = await externalize(subtest);
    args.replayedNonces = new Set([args.releaseTransaction.payload.nonce]);
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(args), /nonce has already been used/);
  });
});

test("external pins reject omitted or stale heads and carry revocations across registry checkpoints", async (context) => {
  await context.test("valid cross-registry carry-forward", async (subtest) => {
    const {args} = await externalize(subtest, buildFixture({crossRegistry: true}));
    const result = verifyOriginalRuntimePromotionTrustDiagnostic(args);
    assert.equal(result.cryptographicChecksPassed, true);
    assert.notEqual(result.captureRegistryCheckpointSha256, result.verificationRegistryHeadSha256);
  });
  await context.test("promotion role added only after capture", async (subtest) => {
    const {args} = await externalize(subtest, buildFixture({crossRegistry: true, releaseRegisteredPostCapture: true}));
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(args), /release transaction capture-time registration signer is not active and authorized/);
  });
  await context.test("omitted externally pinned revocation head", async (subtest) => {
    const {args} = await externalize(subtest, buildFixture({crossRegistry: true}));
    args.revocationCheckpoints = args.revocationCheckpoints.slice(0, 1);
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(args), /current revocation head|externally pinned current revocation head/);
  });
  await context.test("stale externally pinned registry head", async (subtest) => {
    const {args} = await externalize(subtest, buildFixture({staleRegistryPin: true}));
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(args), /externally pinned current registry head/);
  });
  await context.test("revocation omission at registry rollover", async (subtest) => {
    const {args} = await externalize(subtest, buildFixture({crossRegistry: true, omitCarryForward: true}));
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(args), /revocations is not append-only/);
  });
});

test("release binds owner review, artifact hashes, exact outputs, ordering, and safe paths", async (context) => {
  await context.test("owner review binding", async (subtest) => {
    const item = await externalize(subtest);
    item.args.ownerDecision = item.signed("owner", {...item.args.ownerDecision.payload, humanReviewSha256: hash("wrong-human")});
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(item.args), /does not bind the exact signed human review/);
  });
  await context.test("candidate substitution", async (subtest) => {
    const item = await externalize(subtest);
    const payload = structuredClone(item.args.releaseTransaction.payload);
    payload.artifactBindings.candidateManifestSha256 = hash("substitution");
    item.args.releaseTransaction = item.signed("release", payload);
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(item.args), /candidate\/spec\/source hashes differ/);
  });
  await context.test("output substitution", async (subtest) => {
    const item = await externalize(subtest);
    const payload = structuredClone(item.args.releaseTransaction.payload);
    payload.plannedOutputs[0].sha256 = hash("substitution");
    item.args.releaseTransaction = item.signed("release", payload);
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(item.args), /planned output paths\/hashes differ/);
  });
  await context.test("invalid ordering", async (subtest) => {
    const item = await externalize(subtest);
    item.args.releaseTransaction = item.signed("release", {...item.args.releaseTransaction.payload, releasedAt: at(5)});
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(item.args), /predates its revocation checkpoint/);
  });
  await context.test("path escape", async (subtest) => {
    const {args} = await externalize(subtest);
    args.expected.plannedOutputs = [{path: "../escape.json", sha256: hash("escape")}];
    assert.throws(() => verifyOriginalRuntimePromotionTrustDiagnostic(args), /escapes or is not normalized/);
  });
});

test("external loader rejects project paths, symlinks, and hard-linked trust files", async (context) => {
  const realTempRoot = await realpath(os.tmpdir());
  const temporary = await mkdtemp(path.join(realTempRoot, "help-math-external-paths-"));
  context.after(() => rm(temporary, {recursive: true, force: true}));
  const projectRoot = path.join(temporary, "project");
  const ownerRoot = path.join(temporary, "owner");
  await Promise.all([mkdir(projectRoot), mkdir(ownerRoot)]);
  const {rawTrustRoot} = buildFixture();
  const configBytes = `${JSON.stringify(rawTrustRoot, null, 2)}\n`;
  const configPath = path.join(ownerRoot, "trust-root.json");
  await writeFile(configPath, configBytes);
  const loaded = await loadExternalTrustRootConfig({projectRoot, ownerControlledRoot: ownerRoot, trustRootConfigPath: configPath, now: at(8)});
  assert.equal(loaded.sha256, trustRootAuthoritySha256(rawTrustRoot));

  const linked = path.join(ownerRoot, "linked.json");
  await symlink(configPath, linked);
  await assert.rejects(
    () => loadExternalTrustRootConfig({projectRoot, ownerControlledRoot: ownerRoot, trustRootConfigPath: linked, now: at(8)}),
    /symbolic links|non-symlink/,
  );

  const projectControlled = path.join(projectRoot, "project-controlled-trust.json");
  const hardLinkedExternal = path.join(ownerRoot, "hard-linked-trust.json");
  await writeFile(projectControlled, configBytes);
  await link(projectControlled, hardLinkedExternal);
  await assert.rejects(
    () => loadExternalTrustRootConfig({projectRoot, ownerControlledRoot: ownerRoot, trustRootConfigPath: hardLinkedExternal, now: at(8)}),
    /exactly one hard link/,
  );

  const projectOnly = path.join(projectRoot, "project-only-trust.json");
  await writeFile(projectOnly, configBytes);
  await assert.rejects(
    () => loadExternalTrustRootConfig({projectRoot, ownerControlledRoot: projectRoot, trustRootConfigPath: projectOnly, now: at(8)}),
    /disjoint trees/,
  );

  const overbroadFreshness = buildFixture().rawTrustRoot;
  overbroadFreshness.statePins.revocationHead.maximumAgeMs = REVOCATION_FRESHNESS_PROTOCOL_MAX_MS + 1;
  assert.throws(
    () => validateTrustRootConfig(overbroadFreshness, {now: at(8)}),
    /exceeds the protocol maximum/,
  );
});
