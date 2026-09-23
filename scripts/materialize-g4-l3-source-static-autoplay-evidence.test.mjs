import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS,
  materializeSourceStaticAutoplayEvidence,
  validateAugmentedReport,
} from "./materialize-g4-l3-source-static-autoplay-evidence.mjs";
import {
  generateG4L3SourceStaticCandidate,
} from "./build-g4-l3-source-static-candidate.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const INDEX_PATH = "reports/g4-l3-source-operation-index-v2.json";
const CONTRACT_PATH =
  "packages/demos/src/g4-l3-source-static-autoplay-contract.ts";
const MATERIALIZER_PATH =
  "scripts/materialize-g4-l3-source-static-autoplay-evidence.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  const copy = structuredClone(value);
  delete copy.reportFingerprintSha256;
  return sha256(Buffer.from(stableJson(copy)));
}

async function binding(relativePath) {
  const contents = await readFile(path.join(PROJECT_ROOT, relativePath));
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
  };
}

async function context(item) {
  const [reportBytes, indexBinding, contractBinding, materializerBinding,
    timelineBinding] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, item.reportPath)),
    binding(INDEX_PATH),
    binding(CONTRACT_PATH),
    binding(MATERIALIZER_PATH),
    binding(item.timelinePath),
  ]);
  return {
    report: JSON.parse(reportBytes.toString("utf8")),
    bindings: {
      indexBinding,
      contractBinding,
      materializerBinding,
      timelineBinding,
    },
  };
}

function expectSemanticTamperRejected(report, item, bindings, mutate) {
  const tampered = structuredClone(report);
  mutate(tampered);
  tampered.reportFingerprintSha256 = fingerprint(tampered);
  assert.throws(
    () => validateAugmentedReport(tampered, item, bindings),
    /stale|changed|boundary|invalid/u,
  );
}

test("all 13 reports carry explicit source-bound autoplay evidence", async () => {
  assert.equal(SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS.length, 13);
  for (const item of SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS) {
    const {report, bindings} = await context(item);
    validateAugmentedReport(report, item, bindings);
    assert.deepEqual(
      {
        frameDomain: report.autoplayEvidence.frameDomain,
        firstExactStopFrame:
          report.autoplayEvidence.firstExactStopFrame,
        operationId: report.autoplayEvidence.operationId,
        sourceEventId: report.autoplayEvidence.sourceEventId,
        scriptPath: report.autoplayEvidence.scriptPath,
        scriptSha256: report.autoplayEvidence.scriptSha256,
      },
      {
        frameDomain: item.frameDomain,
        firstExactStopFrame: item.firstExactStopFrame,
        operationId: item.operationId,
        sourceEventId: item.sourceEventId,
        scriptPath: item.scriptPath,
        scriptSha256: item.scriptSha256,
      },
    );
    assert.equal(
      report.autoplayEvidence.diagnosticDirectSeek.lastInclusive,
      report.timeline.main.frameCount,
    );
    assert.equal(report.autoplayEvidence.interactionEnabled, false);
    assert.equal(report.autoplayEvidence.audioEnabled, false);
    assert.equal(report.autoplayEvidence.strictAcceptanceEffect, "none");
  }
});

test("semantic tampering is rejected after recomputing the outer fingerprint",
  async () => {
    const item = SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS[0];
    const {report, bindings} = await context(item);
    const mutations = [
      (value) => {
        value.autoplayEvidence.firstExactStopFrame += 1;
      },
      (value) => {
        value.autoplayEvidence.operationId = "operation-tampered";
      },
      (value) => {
        value.autoplayEvidence.sourceOperationIndex.sha256 = "0".repeat(64);
      },
      (value) => {
        value.autoplayEvidence.autoplayContract.sha256 = "0".repeat(64);
      },
      (value) => {
        value.autoplayEvidence.diagnosticDirectSeek.fullDomainAddressable =
          false;
      },
      (value) => {
        value.autoplayEvidence.interactionEnabled = true;
      },
      (value) => {
        value.autoplayEvidence.audioEnabled = true;
      },
      (value) => {
        value.autoplayEvidence.strictCompletionEstablished = true;
      },
      (value) => {
        value.autoplayEvidence.strictAcceptanceEffect = "complete";
      },
      (value) => {
        value.autoplayEvidence.baseReportFingerprintSha256 = "0".repeat(64);
      },
    ];
    for (const mutate of mutations) {
      expectSemanticTamperRejected(report, item, bindings, mutate);
    }
  });

test("canonical materializer check performs no writes", async () => {
  const result = await materializeSourceStaticAutoplayEvidence({
    root: PROJECT_ROOT,
    check: true,
  });
  assert.equal(result.check, true);
  assert.equal(result.itemCount, 13);
  assert.equal(result.filesWritten, 0);
  assert.equal(result.interactionEnabled, false);
  assert.equal(result.audioEnabled, false);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("generic candidate check recognizes the materialized report pair",
  async () => {
    const item = SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS[0];
    const result = await generateG4L3SourceStaticCandidate({
      check: true,
      specPath: item.specPath,
    });
    assert.equal(result.reportOutputMode, "materialized");
    assert.equal(result.autoplayEvidenceValidated, true);
    assert.equal(result.strictAcceptanceEffect, "none");
  });
