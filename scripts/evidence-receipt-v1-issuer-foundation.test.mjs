import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import test from "node:test";

import {
  EVIDENCE_RECEIPT_V1_EXTERNAL_SIGNER_TRANSPORT,
  EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_TYPE,
  EVIDENCE_RECEIPT_V1_ISSUER_WRITES_ENABLED,
  EVIDENCE_RECEIPT_V1_MAX_REVOCATION_FRESHNESS_MS,
  EVIDENCE_RECEIPT_V1_PINNED_RELEASE_DEFINITION_SHA256,
  EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID,
  EVIDENCE_RECEIPT_V1_PINNED_RELEASE_MEMBER_COUNT,
  EVIDENCE_RECEIPT_V1_PRODUCTION_ISSUER_PRESENT,
  EVIDENCE_RECEIPT_V1_PRODUCTION_TRUST_AUTHORIZATION_TYPE,
  EVIDENCE_RECEIPT_V1_REQUIRED_VALIDATION_COMMAND_IDS,
  evaluateEvidenceReceiptV1IssuancePreconditions,
  inspectEvidenceReceiptV1ExternalSignerHandoff,
  inspectEvidenceReceiptV1IssuerFoundation,
  prepareEvidenceReceiptV1ExternalSignerHandoff,
} from "./lib/evidence-receipt-v1-issuer-foundation.mjs";
import {canonicalJson, sha256Canonical} from "./lib/original-runtime-promotion-trust.mjs";

const NOW = "2027-06-01T00:00:00.000Z";
const STARTED_AT = "2027-05-31T23:52:00.000Z";
const ENDED_AT = "2027-05-31T23:53:00.000Z";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function serializeSnapshot(snapshot) {
  return canonicalJson(snapshot);
}

function evaluate(snapshot, now = NOW) {
  return evaluateEvidenceReceiptV1IssuancePreconditions(serializeSnapshot(snapshot), now);
}

function prepare(snapshot, now = NOW) {
  return prepareEvidenceReceiptV1ExternalSignerHandoff(serializeSnapshot(snapshot), now);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactReleaseDefinition() {
  const catalog = JSON.parse(readFileSync(
    new URL("../catalog/lesson-releases.json", import.meta.url),
    "utf8",
  ));
  const release = catalog.releases.find(({releaseId}) => releaseId === EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID);
  assert.ok(release, "the pinned G5 L4 release must remain in the canonical catalog");
  return {
    releaseId: release.releaseId,
    publicationMode: release.publicationMode,
    expectedMemberCount: release.expectedCounts.members,
    members: release.members.map(({ordinal, animationId, assetId}) => ({
      ordinal,
      animationId,
      assetId,
    })),
  };
}

function command(commandId) {
  return {
    commandId,
    argv: ["node", `scripts/${commandId}.mjs`, `--release-id=${EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID}`],
    claimStatus: "caller-supplied-unverified-execution-claim",
    startedAt: STARTED_AT,
    endedAt: ENDED_AT,
    exitCode: 0,
    stdoutSha256: sha256(`${commandId}:stdout`),
    stderrSha256: sha256(`${commandId}:stderr`),
  };
}

function replaceBindings(snapshot, transform = (bindings) => bindings) {
  snapshot.recordedBindings = transform({
    ...snapshot.recordedBindings,
    releaseDefinitionSha256: sha256Canonical(snapshot.releaseDefinition),
    releaseLedgerSha256: sha256Canonical(snapshot.releaseLedger),
    commandsSha256: sha256Canonical(snapshot.recordedCommands),
    productionTrustAuthorizationSha256: sha256Canonical(snapshot.productionTrustAuthorization),
    candidateEvidence: snapshot.releaseLedger.members
      .map((member) => ({logicalId: member.animationId, sha256: member.manifestSha256}))
      .sort((left, right) => compareText(left.logicalId, right.logicalId)),
  });
  snapshot.currentBindings = structuredClone(snapshot.recordedBindings);
  snapshot.currentCommands = structuredClone(snapshot.recordedCommands);
}

function fixture() {
  const releaseDefinition = exactReleaseDefinition();
  const releaseLedger = {
    releaseId: releaseDefinition.releaseId,
    publicationMode: "atomic",
    expectedMemberCount: releaseDefinition.expectedMemberCount,
    strictCompleteCount: releaseDefinition.expectedMemberCount,
    expectedPublishedCount: 1,
    publishedCount: 1,
    gate: {
      kind: "atomic-all-members-strict",
      requiredCount: releaseDefinition.expectedMemberCount,
      admittedCount: releaseDefinition.expectedMemberCount,
      open: true,
    },
    members: releaseDefinition.members.map((member) => ({
      ...member,
      strictComplete: true,
      manifestSha256: sha256(`manifest:${member.animationId}`),
    })),
  };
  const recordedCommands = EVIDENCE_RECEIPT_V1_REQUIRED_VALIDATION_COMMAND_IDS.map(command);
  const trustAuthorization = {
    evidenceType: EVIDENCE_RECEIPT_V1_PRODUCTION_TRUST_AUTHORIZATION_TYPE,
    status: "caller-supplied-unverified-trust-claims",
    releaseId: EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID,
    commitSha: sha256("commit").slice(0, 40),
    promotionReleaseBundleSha256: sha256("promotion release bundle"),
    trustRootAuthoritySha256: sha256("trust root authority"),
    verificationRegistryHeadSha256: sha256("registry head"),
    revocationCheckpointSha256: sha256("revocation checkpoint"),
    releaseAuthoritySubjectId: "release-authority-fixture",
    releaseAuthorityKeyFingerprintSha256: sha256("release authority key"),
    claimsAuthenticated: true,
    claimsAuthorized: true,
    claimsRevocationStateCurrent: true,
    claimsProductionPromotionBundleVerified: true,
    verifiedAt: "2027-05-31T23:56:00.000Z",
    revocationValidUntil: "2027-06-01T00:10:00.000Z",
  };
  const bindings = {
    commitSha: trustAuthorization.commitSha,
    releaseDefinitionSha256: sha256Canonical(releaseDefinition),
    sourceManifestSha256: sha256("source manifest"),
    rendererRegistrySha256: sha256("renderer registry"),
    completionLedgerSha256: sha256("completion ledger"),
    releaseLedgerSha256: sha256Canonical(releaseLedger),
    runnerSha256: sha256("runner"),
    toolchainSha256: sha256("toolchain"),
    commandsSha256: sha256Canonical(recordedCommands),
    inputsSha256: sha256("inputs"),
    outputsSha256: sha256("outputs"),
    strictValidatorSha256: sha256("strict validator"),
    reviewDecisionSha256: sha256("review decision"),
    ownerDecisionSha256: sha256("owner decision"),
    promotionReleaseBundleSha256: trustAuthorization.promotionReleaseBundleSha256,
    productionTrustAuthorizationSha256: sha256Canonical(trustAuthorization),
    candidateEvidence: releaseLedger.members
      .map((member) => ({logicalId: member.animationId, sha256: member.manifestSha256}))
      .sort((left, right) => compareText(left.logicalId, right.logicalId)),
  };
  return {
    snapshot: {
      schemaVersion: 1,
      evidenceType: EVIDENCE_RECEIPT_V1_ISSUER_FOUNDATION_TYPE,
      releaseDefinition,
      releaseLedger,
      recordedBindings: bindings,
      currentBindings: structuredClone(bindings),
      recordedCommands,
      currentCommands: structuredClone(recordedCommands),
      productionTrustAuthorization: trustAuthorization,
    },
  };
}

test("pinned G5 L4 release passes only a caller-supplied structural preflight", () => {
  const {snapshot} = fixture();
  assert.equal(EVIDENCE_RECEIPT_V1_PRODUCTION_ISSUER_PRESENT, false);
  assert.equal(EVIDENCE_RECEIPT_V1_ISSUER_WRITES_ENABLED, false);
  assert.equal(EVIDENCE_RECEIPT_V1_PINNED_RELEASE_MEMBER_COUNT, 55);
  assert.equal(sha256Canonical(snapshot.releaseDefinition), EVIDENCE_RECEIPT_V1_PINNED_RELEASE_DEFINITION_SHA256);

  const evaluation = evaluate(snapshot);
  assert.equal(evaluation.status, "caller-supplied-structural-preflight-passed-external-verification-required");
  assert.equal(evaluation.strictCompleteCount, 55);
  assert.equal(evaluation.publishedCount, 1);
  assert.equal(evaluation.releaseDefinitionSha256, sha256Canonical(snapshot.releaseDefinition));
  assert.equal(evaluation.releaseLedgerSha256, sha256Canonical(snapshot.releaseLedger));
  assert.equal(evaluation.callerSuppliedStructuralPreflightOnly, true);
  assert.equal(evaluation.callerSuppliedTrustClaimsOnly, true);
  assert.equal(evaluation.commandClaimsStatus, "caller-supplied-unverified");
  assert.equal(evaluation.trustClaimsStatus, "caller-supplied-unverified");
  assert.equal(evaluation.authoritativeCommandExecutionEstablished, false);
  assert.equal(evaluation.externalCommandEvidenceVerificationRequired, true);
  assert.equal(evaluation.authorityVerified, false);
  assert.equal(evaluation.externalCryptographicVerificationRequired, true);
  assert.equal(evaluation.authoritative, false);
  assert.equal(evaluation.receiptPayloadCreated, false);
  assert.equal(evaluation.signatureCreated, false);
  assert.equal(evaluation.receiptCreated, false);
  assert.equal(evaluation.strictAcceptanceEffect, "none");

  const handoff = prepare(snapshot);
  assert.equal(handoff.status, "prepared-caller-supplied-structural-preflight-only");
  assert.equal(handoff.externalSignerTransport, EVIDENCE_RECEIPT_V1_EXTERNAL_SIGNER_TRANSPORT);
  assert.equal(handoff.callerCallbackInvoked, false);
  assert.equal(handoff.callerCapabilityInvoked, false);
  assert.equal(handoff.externalAcknowledgementAccepted, false);
  assert.equal(handoff.externalCryptographicVerificationRequired, true);
  assert.equal(handoff.authorityVerified, false);
  assert.equal(handoff.productionAuthorityEstablishedByFoundation, false);
  assert.equal(handoff.productionKeyLoaded, false);
  assert.equal(handoff.receiptPayloadCreated, false);
  assert.equal(handoff.signatureCreated, false);
  assert.equal(handoff.receiptCreated, false);
  assert.equal(handoff.releasePublicationChanged, false);
  assert.equal(Object.isFrozen(handoff), true);
  assert.equal(Object.isFrozen(handoff.request), true);
  assert.equal(handoff.request.authorityVerified, false);
  assert.equal(handoff.request.commandClaimsStatus, "caller-supplied-unverified");
  assert.equal(handoff.request.trustClaimsStatus, "caller-supplied-unverified");
  assert.equal(handoff.request.externalCryptographicVerificationRequired, true);
  assert.equal("payload" in handoff.request, false);
  assert.equal("signature" in handoff.request, false);
  assert.equal("receipt" in handoff.request, false);
  assert.equal(inspectEvidenceReceiptV1ExternalSignerHandoff(handoff).validFoundationHandoff, true);
});

test("zero-argument inspection is deeply frozen, callback-free, and acceptance-neutral", () => {
  const inspection = inspectEvidenceReceiptV1IssuerFoundation();
  assert.equal(inspection.capabilities.preconditionEvaluatorPresent, true);
  assert.equal(inspection.capabilities.externalSignerHandoffDescriptorPresent, true);
  assert.equal(inspection.capabilities.callerCallbackInvocationPresent, false);
  assert.equal(inspection.capabilities.canonicalJsonPrimitiveBoundaryPresent, true);
  assert.equal(inspection.capabilities.callerOwnedObjectInputAccepted, false);
  assert.equal(inspection.capabilities.rawAuthoritySubjectIdExported, false);
  assert.equal(inspection.productionIssuerPresent, false);
  assert.equal(inspection.writesEnabled, false);
  assert.equal(inspection.keyLoaderPresent, false);
  assert.equal(inspection.signatureCreationPresent, false);
  assert.equal(inspection.receiptCreationPresent, false);
  assert.equal(inspection.filesystemWriterPresent, false);
  assert.equal(inspection.callerSuppliedStructuralPreflightOnly, true);
  assert.equal(inspection.authorityVerified, false);
  assert.equal(inspection.externalCryptographicVerificationRequired, true);
  assert.equal(inspection.strictAcceptanceEffect, "none");
  assert.equal(Object.isFrozen(inspection), true);
  assert.equal(Object.isFrozen(inspection.capabilities), true);
  assert.throws(() => {
    inspection.capabilities.preconditionEvaluatorPresent = false;
  }, TypeError);
});

test("arbitrary one-member releases cannot self-authorize by recomputing their bindings", () => {
  const {snapshot} = fixture();
  snapshot.releaseDefinition.expectedMemberCount = 1;
  snapshot.releaseDefinition.members = snapshot.releaseDefinition.members.slice(0, 1);
  snapshot.releaseLedger.expectedMemberCount = 1;
  snapshot.releaseLedger.strictCompleteCount = 1;
  snapshot.releaseLedger.gate.requiredCount = 1;
  snapshot.releaseLedger.gate.admittedCount = 1;
  snapshot.releaseLedger.members = snapshot.releaseLedger.members.slice(0, 1);
  replaceBindings(snapshot);
  assert.throws(
    () => evaluate(snapshot),
    /pinned 55-member contract/,
  );
});

test("issuer foundation rejects 54/55 even when aggregate fields falsely claim 55", () => {
  const {snapshot} = fixture();
  snapshot.releaseLedger.members[53].strictComplete = false;
  assert.throws(
    () => evaluate(snapshot),
    /is not strict complete/,
  );
});

test("issuer foundation rejects a non-published technical release witness", () => {
  const {snapshot} = fixture();
  snapshot.releaseLedger.publishedCount = 0;
  assert.throws(
    () => evaluate(snapshot),
    /publishedCount must be 1/,
  );
});

test("release definition and release ledger must match their recomputed canonical hashes", async (context) => {
  await context.test("stale release definition binding", () => {
    const {snapshot} = fixture();
    snapshot.recordedBindings.releaseDefinitionSha256 = sha256("stale release definition");
    snapshot.currentBindings.releaseDefinitionSha256 = snapshot.recordedBindings.releaseDefinitionSha256;
    assert.throws(
      () => evaluate(snapshot),
      /release definition canonical hash binding is stale/,
    );
  });
  await context.test("stale release ledger binding", () => {
    const {snapshot} = fixture();
    snapshot.recordedBindings.releaseLedgerSha256 = sha256("stale release ledger");
    snapshot.currentBindings.releaseLedgerSha256 = snapshot.recordedBindings.releaseLedgerSha256;
    assert.throws(
      () => evaluate(snapshot),
      /release ledger canonical hash binding is stale/,
    );
  });
});

test("candidate evidence is one-to-one with all 55 release members and their manifest hashes", async (context) => {
  await context.test("missing member", () => {
    const {snapshot} = fixture();
    snapshot.recordedBindings.candidateEvidence.pop();
    snapshot.currentBindings.candidateEvidence.pop();
    assert.throws(
      () => evaluate(snapshot),
      /exactly one binding for each release member/,
    );
  });
  await context.test("wrong manifest hash", () => {
    const {snapshot} = fixture();
    snapshot.recordedBindings.candidateEvidence[0].sha256 = sha256("substituted candidate");
    snapshot.currentBindings.candidateEvidence[0].sha256 = snapshot.recordedBindings.candidateEvidence[0].sha256;
    assert.throws(
      () => evaluate(snapshot),
      /release-ledger manifestSha256/,
    );
  });
  await context.test("substituted member", () => {
    const {snapshot} = fixture();
    snapshot.recordedBindings.candidateEvidence[0].logicalId = "substituted-member";
    snapshot.currentBindings.candidateEvidence[0].logicalId = "substituted-member";
    assert.throws(
      () => evaluate(snapshot),
      /uniquely sorted|release-ledger manifestSha256/,
    );
  });
});

test("issuer foundation rejects recorded/current binding drift", () => {
  const {snapshot} = fixture();
  snapshot.currentBindings.rendererRegistrySha256 = sha256("drifted renderer registry");
  assert.throws(
    () => evaluate(snapshot),
    /binding drift detected/,
  );
});

test("validation command claims are exact, unverified, and fail closed", async (context) => {
  await context.test("failed command", () => {
    const {snapshot} = fixture();
    snapshot.recordedCommands[0].exitCode = 1;
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /exitCode must be zero/,
    );
  });
  await context.test("missing command", () => {
    const {snapshot} = fixture();
    snapshot.recordedCommands = snapshot.recordedCommands.slice(1);
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /exactly the required command claims/,
    );
  });
  await context.test("forged argv", () => {
    const {snapshot} = fixture();
    snapshot.recordedCommands[0].argv = ["node", "scripts/forged-validator.mjs", `--release-id=${EVIDENCE_RECEIPT_V1_PINNED_RELEASE_ID}`];
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /pinned structural command contract/,
    );
  });
  await context.test("explicit node no-op", () => {
    const {snapshot} = fixture();
    snapshot.recordedCommands[0].argv = ["node", "-e", "process.exit(0)"];
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /pinned structural command contract/,
    );
  });
  await context.test("authoritative status injection", () => {
    const {snapshot} = fixture();
    snapshot.recordedCommands[0].claimStatus = "authoritative-execution-verified";
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /must remain caller-supplied and unverified/,
    );
  });
});

test("trust booleans remain bounded caller claims with a fixed freshness maximum", async (context) => {
  await context.test("expired freshness", () => {
    const {snapshot} = fixture();
    snapshot.productionTrustAuthorization.revocationValidUntil = "2027-05-31T23:59:59.000Z";
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /revocation state is stale/,
    );
  });
  await context.test("overlong freshness", () => {
    const {snapshot} = fixture();
    snapshot.productionTrustAuthorization.verifiedAt = "2027-05-31T23:45:00.000Z";
    snapshot.productionTrustAuthorization.revocationValidUntil = "2027-06-01T00:10:00.000Z";
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /freshness window exceeds the fixed maximum|verifiedAt is outside the fixed freshness window/,
    );
  });
  await context.test("caller says revocation is not current", () => {
    const {snapshot} = fixture();
    snapshot.productionTrustAuthorization.claimsRevocationStateCurrent = false;
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /claimsRevocationStateCurrent must be true/,
    );
  });
  await context.test("verified-authority status injection", () => {
    const {snapshot} = fixture();
    snapshot.productionTrustAuthorization.status = "authenticated-authorized-current";
    replaceBindings(snapshot);
    assert.throws(
      () => evaluate(snapshot),
      /must remain an unverified caller-supplied claim/,
    );
  });
  assert.equal(EVIDENCE_RECEIPT_V1_MAX_REVOCATION_FRESHNESS_MS, 900_000);
});

test("handoff rejects capabilities, callbacks, acknowledgements, keys, signatures, and receipts without invoking them", async (context) => {
  for (const [label, extra] of [
    ["private key", {privateKeyPem: "-----BEGIN PRIVATE KEY-----"}],
    ["sign callback", {sign() { throw new Error("must never run"); }}],
    ["receipt object", {receipt: {}}],
    ["signature", {signature: "forbidden"}],
    ["acknowledgement", {acknowledgement: {status: "accepted"}}],
  ]) {
    await context.test(label, () => {
      const {snapshot} = fixture();
      assert.throws(
        () => prepareEvidenceReceiptV1ExternalSignerHandoff(serializeSnapshot(snapshot), NOW, extra),
        /requires exactly snapshotCanonicalJson and now primitives/,
      );
    });
  }

  await context.test("caller capability getter has no side effect", () => {
    const {snapshot} = fixture();
    let getterReads = 0;
    const externalSignerCapability = {};
    Object.defineProperty(externalSignerCapability, "authorizeHandoff", {
      enumerable: true,
      get() {
        getterReads += 1;
        throw new Error("caller code must never run");
      },
    });
    assert.throws(
      () => prepareEvidenceReceiptV1ExternalSignerHandoff(
        serializeSnapshot(snapshot),
        NOW,
        externalSignerCapability,
      ),
      /requires exactly snapshotCanonicalJson and now primitives/,
    );
    assert.equal(getterReads, 0);
  });
});

test("serialized primitive boundary rejects caller-owned objects without reading accessors or Proxy traps", async (context) => {
  await context.test("snapshot getter", () => {
    let getterReads = 0;
    const accessorSnapshot = {};
    Object.defineProperty(accessorSnapshot, "releaseDefinition", {
      enumerable: true,
      get() {
        getterReads += 1;
        throw new Error("snapshot getter must never run");
      },
    });
    assert.throws(
      () => evaluateEvidenceReceiptV1IssuancePreconditions(accessorSnapshot, NOW),
      /primitive canonical JSON string/,
    );
    assert.equal(getterReads, 0);
  });

  await context.test("then getter", () => {
    let getterReads = 0;
    const thenable = {};
    Object.defineProperty(thenable, "then", {
      enumerable: true,
      get() {
        getterReads += 1;
        throw new Error("then getter must never run");
      },
    });
    assert.throws(
      () => prepareEvidenceReceiptV1ExternalSignerHandoff(thenable, NOW),
      /primitive canonical JSON string/,
    );
    assert.equal(getterReads, 0);
  });

  await context.test("Proxy", () => {
    let trapCalls = 0;
    const proxy = new Proxy({}, {
      get() {
        trapCalls += 1;
        throw new Error("Proxy get trap must never run");
      },
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error("Proxy prototype trap must never run");
      },
      ownKeys() {
        trapCalls += 1;
        throw new Error("Proxy ownKeys trap must never run");
      },
    });
    assert.throws(
      () => evaluateEvidenceReceiptV1IssuancePreconditions(proxy, NOW),
      /primitive canonical JSON string/,
    );
    assert.equal(trapCalls, 0);
  });

  await context.test("custom Date getTime", () => {
    const {snapshot} = fixture();
    let getterReads = 0;
    const hostileDate = new Date(NOW);
    Object.defineProperty(hostileDate, "getTime", {
      get() {
        getterReads += 1;
        throw new Error("custom Date getter must never run");
      },
    });
    assert.throws(
      () => evaluateEvidenceReceiptV1IssuancePreconditions(serializeSnapshot(snapshot), hostileDate),
      /primitive canonical UTC ISO string or epoch millisecond integer/,
    );
    assert.equal(getterReads, 0);
  });

  await context.test("callable and non-canonical JSON", () => {
    let callableRuns = 0;
    function snapshotCallable() {
      callableRuns += 1;
    }
    assert.throws(
      () => evaluateEvidenceReceiptV1IssuancePreconditions(snapshotCallable, NOW),
      /primitive canonical JSON string/,
    );
    assert.equal(callableRuns, 0);
    const {snapshot} = fixture();
    assert.throws(
      () => evaluateEvidenceReceiptV1IssuancePreconditions(JSON.stringify(snapshot, null, 2), NOW),
      /exact canonical JSON encoding/,
    );
  });
});

test("authority subject IDs use a privacy-safe input format and only a SHA-256 digest leaves the parser", async (context) => {
  for (const unsafeSubjectId of [
    "peter.hu@example.com",
    "x/Volumes/WestWorld/private",
    "token:abc",
  ]) {
    await context.test(unsafeSubjectId.split("@").at(0), () => {
      const {snapshot} = fixture();
      snapshot.productionTrustAuthorization.releaseAuthoritySubjectId = unsafeSubjectId;
      replaceBindings(snapshot);
      let error;
      try {
        evaluate(snapshot);
      } catch (caught) {
        error = caught;
      }
      assert.ok(error instanceof Error);
      assert.match(error.message, /lowercase opaque identifier/);
      assert.equal(error.message.includes(unsafeSubjectId), false);
    });
  }

  const {snapshot} = fixture();
  const rawSubjectId = snapshot.productionTrustAuthorization.releaseAuthoritySubjectId;
  const handoff = prepare(snapshot);
  assert.equal("releaseAuthoritySubjectId" in handoff.request, false);
  assert.equal(handoff.request.releaseAuthoritySubjectKind, "opaque-release-authority-subject-sha256");
  assert.equal(handoff.request.releaseAuthoritySubjectIdSha256, sha256(rawSubjectId));
  const serializedHandoff = canonicalJson(handoff);
  assert.equal(serializedHandoff.includes(rawSubjectId), false);
  assert.doesNotMatch(serializedHandoff, /(?:file:\/\/|\/(?:Users|Volumes|home|private|var\/folders)\/|[A-Za-z]:\\)/i);
  assert.doesNotMatch(serializedHandoff, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  assert.doesNotMatch(serializedHandoff, /(?:-----BEGIN (?:OPENSSH )?PRIVATE KEY-----|bearer\s+\S+|(?:password|api[_-]?key|secret|token)\s*[:=]\s*\S+)/i);
});

test("issuer module has no filesystem, process, network, or caller-callback execution surface", () => {
  const source = readFileSync(
    new URL("./lib/evidence-receipt-v1-issuer-foundation.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /^import \{createHash\} from "node:crypto";/m);
  assert.doesNotMatch(source, /from\s+["']\.\/original-runtime-promotion-trust\.mjs["']/);
  assert.doesNotMatch(source, /from\s+["']node:(?:fs|fs\/promises|child_process|net|http|https)["']/);
  assert.doesNotMatch(source, /\.\s*authorizeHandoff\s*\(/);
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|rename|unlink|mkdir|spawn|execFile|execSync)\s*\(/);
  assert.doesNotMatch(source, /\bawait\b/);
});

test("handoff is deeply frozen and cloned or reconstructed descriptors lose the process-private brand", () => {
  const {snapshot} = fixture();
  const handoff = prepare(snapshot);
  assert.throws(() => {
    handoff.status = "tampered";
  }, TypeError);
  assert.throws(() => {
    handoff.request.authorityVerified = true;
  }, TypeError);
  assert.throws(
    () => inspectEvidenceReceiptV1ExternalSignerHandoff(structuredClone(handoff)),
    /cloned, reconstructed, or was not created/,
  );
  assert.throws(
    () => inspectEvidenceReceiptV1ExternalSignerHandoff({...handoff, receiptCreated: true}),
    /cloned, reconstructed, or was not created/,
  );
});
