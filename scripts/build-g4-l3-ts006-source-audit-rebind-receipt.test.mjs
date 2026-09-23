import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildG4L3Ts006SourceAuditRebindReceipt,
  currentAuditProjection,
  parseArguments,
  validateG4L3Ts006SourceAuditRebindReceipt,
} from "./build-g4-l3-ts006-source-audit-rebind-receipt.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RECEIPT = path.join(ROOT,
  "reports/g4-l3-ts006-source-audit-rebind-receipt.json");
const SOURCE_AUDIT = path.join(ROOT,
  "migrations/course-g04-l03-ts-006/audit/machine/g4-l3-source-audit.json");

const fingerprint = (value) => createHash("sha256")
  .update(`${JSON.stringify(value, null, 2)}\n`).digest("hex");

test("TS006 source-audit rebind CLI is explicit", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
});

test("checked-in TS006 source-audit rebind receipt is bounded and neutral", async () => {
  const receipt = JSON.parse(await readFile(RECEIPT, "utf8"));
  assert.equal(validateG4L3Ts006SourceAuditRebindReceipt(receipt), receipt);
  assert.equal(receipt.transition.bytesUnchanged, true);
  assert.equal(receipt.transition.sha256Changed, true);
  assert.equal(receipt.semanticProjection.equal, true);
  assert.equal(receipt.semanticProjection.historicalSha256,
    receipt.semanticProjection.currentSha256);
  assert.equal(receipt.historicalEvidence.oldSourceAuditCompleteBytesAvailable,
    false);
  assert.equal(receipt.historicalEvidence.oldSourceAuditFullByteDiffPerformed,
    false);
  assert.equal(
    receipt.driftAssessment.onlyDerivedProvenanceChangedProvenByFullByteDiff,
    false,
  );
  assert.equal(receipt.authorityBoundary.strictAcceptanceEffect, "none");
  assert.equal(receipt.authorityBoundary.strictCompletionCreated, false);
  assert.equal(receipt.authorityBoundary.publicReleaseAuthorized, false);
});

test("current TS006 source audit reproduces the receipt semantic projection", async () => {
  const [receipt, audit] = await Promise.all([
    readFile(RECEIPT, "utf8").then(JSON.parse),
    readFile(SOURCE_AUDIT, "utf8").then(JSON.parse),
  ]);
  const projection = currentAuditProjection(audit);
  assert.deepEqual(projection, receipt.semanticProjection.current);
  assert.equal(fingerprint(projection),
    receipt.semanticProjection.currentSha256);
});

test("TS006 source-audit rebind rejects semantic and authority promotion", async () => {
  const receipt = JSON.parse(await readFile(RECEIPT, "utf8"));
  const semanticDrift = structuredClone(receipt);
  semanticDrift.semanticProjection.current.runtime.fps = 24;
  assert.throws(
    () => validateG4L3Ts006SourceAuditRebindReceipt(semanticDrift),
    /fingerprint is stale/,
  );
  const promoted = structuredClone(receipt);
  promoted.authorityBoundary.strictCompletionCreated = true;
  const projected = structuredClone(promoted);
  delete projected.receiptFingerprintSha256;
  promoted.receiptFingerprintSha256 = fingerprint(projected);
  assert.throws(
    () => validateG4L3Ts006SourceAuditRebindReceipt(promoted),
    /crossed an authority boundary/,
  );
});

test("TS006 source-audit rebind receipt reproduces in check mode", async () => {
  const result = await buildG4L3Ts006SourceAuditRebindReceipt({check: true});
  assert.equal(result.animationId, "course-g04-l03-ts-006");
  assert.equal(result.fullHistoricalByteDiffPerformed, false);
  assert.equal(result.strictAcceptanceEffect, "none");
});
