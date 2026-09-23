import assert from "node:assert/strict";
import {createHash, generateKeyPairSync, sign} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  EVIDENCE_RECEIPT_V1_TYPE,
  evidenceReceiptV1PayloadSha256,
  evidenceReceiptV1Sha256,
  validateEvidenceReceiptV1,
  verifyEvidenceReceiptV1,
} from "./lib/evidence-receipt-v1.mjs";
import {
  canonicalJson,
  ed25519PublicKeyFingerprint,
} from "./lib/original-runtime-promotion-trust.mjs";
import {parseArguments, usage} from "./verify-evidence-receipt-v1.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOW = "2027-06-01T00:00:00.000Z";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fixture() {
  const {privateKey, publicKey} = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({type: "spki", format: "pem"});
  const build = {
    commitSha: sha256("release commit").slice(0, 40),
    releaseDefinitionSha256: sha256("release definition"),
    sourceManifestSha256: sha256("source manifest"),
    rendererRegistrySha256: sha256("renderer registry"),
    completionLedgerSha256: sha256("completion ledger"),
    releaseLedgerSha256: sha256("release ledger"),
  };
  const acceptance = {
    expectedMemberCount: 55,
    strictCompleteCount: 55,
    expectedPublishedCount: 1,
    publishedCount: 1,
    strictValidatorSha256: sha256("strict validator"),
    reviewDecisionSha256: sha256("review decision"),
    ownerDecisionSha256: sha256("owner decision"),
    promotionReleaseBundleSha256: sha256("promotion release bundle"),
    allExactAssetsCurrent: true,
    atomicPublicationAuthorized: true,
  };
  const payload = {
    schemaVersion: 1,
    evidenceType: EVIDENCE_RECEIPT_V1_TYPE,
    receiptId: "receipt-lesson-g05-l04-number-lines-2027-05-31",
    releaseId: "lesson-g05-l04-number-lines",
    issuedAt: "2027-05-31T23:00:00.000Z",
    expiresAt: "2027-06-30T23:00:00.000Z",
    build,
    execution: {
      runner: {
        name: "help-math-release-runner",
        version: "1.0.0",
        artifactSha256: sha256("runner"),
      },
      tools: [
        {name: "node", version: "24.18.0", artifactSha256: sha256("node")},
        {name: "strict-validator", version: "1.0.0", artifactSha256: sha256("strict validator")},
      ],
      commands: [
        {
          commandId: "strict-validation",
          argv: ["node", "strict-validator", "--release-id=lesson-g05-l04-number-lines"],
          startedAt: "2027-05-31T22:00:00.000Z",
          endedAt: "2027-05-31T22:10:00.000Z",
          exitCode: 0,
          stdoutSha256: sha256("stdout"),
          stderrSha256: sha256("stderr"),
        },
      ],
      inputs: [
        {logicalId: "release-definition", artifactType: "application/json", bytes: 101, sha256: build.releaseDefinitionSha256},
        {logicalId: "source-manifest", artifactType: "application/json", bytes: 202, sha256: build.sourceManifestSha256},
      ],
      outputs: [
        {logicalId: "evidence-summary", artifactType: "application/json", bytes: 303, sha256: sha256("evidence summary")},
        {logicalId: "release-ledger", artifactType: "application/json", bytes: 404, sha256: build.releaseLedgerSha256},
      ],
    },
    acceptance,
    invalidation: {
      policy: "exact-hash-drift-closes-release-v1",
      bindings: [
        {kind: "candidate-evidence", logicalId: "all-55-candidates", sha256: sha256("all candidates")},
        {kind: "completion-ledger", logicalId: "completion-ledger", sha256: build.completionLedgerSha256},
        {kind: "owner-decision", logicalId: "owner-decision", sha256: acceptance.ownerDecisionSha256},
        {kind: "promotion-release-bundle", logicalId: "promotion-release-bundle", sha256: acceptance.promotionReleaseBundleSha256},
        {kind: "release-definition", logicalId: "release-definition", sha256: build.releaseDefinitionSha256},
        {kind: "release-ledger", logicalId: "release-ledger", sha256: build.releaseLedgerSha256},
        {kind: "renderer-registry", logicalId: "renderer-registry", sha256: build.rendererRegistrySha256},
        {kind: "review-decision", logicalId: "review-decision", sha256: acceptance.reviewDecisionSha256},
        {kind: "source-manifest", logicalId: "source-manifest", sha256: build.sourceManifestSha256},
      ],
    },
    privacy: {
      exportClass: "public-hash-metadata-only",
      containsRawFrames: false,
      containsRawAudio: false,
      containsPrivatePaths: false,
      containsContactInformation: false,
      containsStudentData: false,
      containsSecrets: false,
    },
  };
  const signatureBase64 = sign(
    null,
    Buffer.from(canonicalJson(payload), "utf8"),
    privateKey,
  ).toString("base64");
  const receipt = {
    payload,
    signature: {
      algorithm: "Ed25519",
      subjectId: "release-authority-fixture",
      keyFingerprintSha256: ed25519PublicKeyFingerprint(publicKeyPem),
      signatureBase64,
    },
  };
  return {receipt, publicKeyPem, expectedBindings: {...build}};
}

test("EvidenceReceiptV1 validates, verifies, and exposes stable hashes", () => {
  const {receipt, publicKeyPem, expectedBindings} = fixture();
  const validated = validateEvidenceReceiptV1(receipt, {now: NOW});
  const verified = verifyEvidenceReceiptV1({
    receipt,
    publicKeyPem,
    expectedBindings,
    now: NOW,
  });
  assert.equal(validated.releaseId, "lesson-g05-l04-number-lines");
  assert.equal(validated.strictCompleteCount, 55);
  assert.equal(verified.signer.subjectId, "release-authority-fixture");
  assert.equal(validated.payloadSha256, evidenceReceiptV1PayloadSha256(receipt));
  assert.equal(validated.receiptSha256, evidenceReceiptV1Sha256(receipt));
});

test("EvidenceReceiptV1 schema is a closed 2020-12 envelope", async () => {
  const schema = JSON.parse(
    await readFile(path.join(projectRoot, "schemas/evidence-receipt-v1.schema.json"), "utf8"),
  );
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.deepEqual(schema.required, ["payload", "signature"]);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.$defs.payload.additionalProperties, false);
  assert.equal(schema.$defs.acceptance.properties.atomicPublicationAuthorized.const, true);
});

test("EvidenceReceiptV1 cannot publish a partially strict lesson", () => {
  const {receipt} = fixture();
  receipt.payload.acceptance.strictCompleteCount = 54;
  assert.throws(
    () => validateEvidenceReceiptV1(receipt, {now: NOW}),
    /before every member is strict complete/,
  );
});

test("EvidenceReceiptV1 closes on a current build binding drift", () => {
  const {receipt, publicKeyPem, expectedBindings} = fixture();
  expectedBindings.rendererRegistrySha256 = sha256("drifted renderer registry");
  assert.throws(
    () => verifyEvidenceReceiptV1({receipt, publicKeyPem, expectedBindings, now: NOW}),
    /binding drift: rendererRegistrySha256/,
  );
});

test("EvidenceReceiptV1 rejects payload tampering", () => {
  const {receipt, publicKeyPem, expectedBindings} = fixture();
  receipt.payload.releaseId = "lesson-g05-l04-number-lines-tampered";
  assert.throws(
    () => verifyEvidenceReceiptV1({receipt, publicKeyPem, expectedBindings, now: NOW}),
    /signature is invalid/,
  );
});

test("EvidenceReceiptV1 rejects expired receipts", () => {
  const {receipt} = fixture();
  assert.throws(
    () => validateEvidenceReceiptV1(receipt, {now: "2027-07-01T00:00:00.000Z"}),
    /is expired/,
  );
});

test("EvidenceReceiptV1 rejects private paths even when privacy flags are false", () => {
  const {receipt} = fixture();
  receipt.payload.execution.commands[0].argv.push("/Volumes/WestWorld/private/evidence.json");
  assert.throws(
    () => validateEvidenceReceiptV1(receipt, {now: NOW}),
    /exposes a private filesystem path/,
  );
});

test("EvidenceReceiptV1 rejects internally inconsistent invalidation bindings", () => {
  const {receipt} = fixture();
  const binding = receipt.payload.invalidation.bindings.find(
    (item) => item.kind === "source-manifest",
  );
  binding.sha256 = sha256("different source manifest");
  assert.throws(
    () => validateEvidenceReceiptV1(receipt, {now: NOW}),
    /source-manifest differs from payload.build.sourceManifestSha256/,
  );
});

test("EvidenceReceiptV1 rejects a failed command", () => {
  const {receipt} = fixture();
  receipt.payload.execution.commands[0].exitCode = 1;
  assert.throws(
    () => validateEvidenceReceiptV1(receipt, {now: NOW}),
    /exitCode must be zero/,
  );
});

test("EvidenceReceiptV1 CLI requires every current binding", () => {
  const hash = sha256("binding");
  const parsed = parseArguments([
    "--receipt", "receipt.json",
    "--public-key", "release.pem",
    "--expected-commit", hash.slice(0, 40),
    "--expected-release-definition", hash,
    "--expected-source-manifest", hash,
    "--expected-renderer-registry", hash,
    "--expected-completion-ledger", hash,
    "--expected-release-ledger", hash,
    "--json",
  ]);
  assert.equal(parsed.expectedBindings.releaseLedgerSha256, hash);
  assert.equal(parsed.json, true);
  assert.match(usage(), /does not establish signer authority/);
  assert.throws(
    () => parseArguments(["--receipt", "receipt.json", "--public-key", "release.pem"]),
    /--expected-commit is required/,
  );
});
