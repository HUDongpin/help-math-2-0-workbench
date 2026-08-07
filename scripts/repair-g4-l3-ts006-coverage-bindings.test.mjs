import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  buildExpectedPendingCoverageDocuments,
  canonicalJson,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";
import {
  parseArguments,
  repairedTs006Coverage,
} from "./repair-g4-l3-ts006-coverage-bindings.mjs";

const STALE_INVENTORY = "a".repeat(64);
const CURRENT_INVENTORY = "b".repeat(64);
const CAPTURE_SHA256 = "c".repeat(64);
const CAPTURE_PATH = "output/playwright/fixture/capture-manifest.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fixture() {
  const item = {
    animationId: "course-g04-l03-ts-006",
    sequence: 34,
    nativeRuntimeFacts: {rootFrameCount: 10},
  };
  const baseManifest = {
    animationId: item.animationId,
    runtime: {frameCount: 10},
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "default"}],
    implementation: {
      frameDomains: [{
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        parentFrameDomainId: null,
        frameCount: 10,
        scenarioIds: ["default"],
      }],
    },
  };
  const planned = buildExpectedPendingCoverageDocuments({item, manifest: baseManifest});
  const targetCapture = planned.coverage.requirements
    .find(({requirementId}) => requirementId === "req:sprite-23:lesson-shell-natural-entry:en");
  const manifest = {
    ...planned.manifest,
    evidence: {
      candidateCaptureManifests: [{
        requirementId: targetCapture.requirementId,
        frameDomainId: targetCapture.frameDomainId,
        traceId: targetCapture.traceId,
        entryStateSha256: targetCapture.entryStateSha256,
        scenario: targetCapture.scenario,
        language: targetCapture.language,
        seed: targetCapture.seed,
        path: CAPTURE_PATH,
        sha256: CAPTURE_SHA256,
        frames: 128,
        authority: "non-authoritative-current-javascript-output",
        strictAcceptanceEffect: "implementation-capture-only",
      }],
      currentJavaScriptImplementationCaptureAdoption: {
        path: "evidence/current-javascript-implementation-capture-adoption.json",
        sha256: "d".repeat(64),
        authority: "non-authoritative-current-javascript-output",
        strictAcceptanceEffect: "none",
      },
    },
  };
  const expected = buildExpectedPendingCoverageDocuments({item, manifest});
  const coverage = structuredClone(expected.coverage);
  for (const requirement of coverage.requirements) {
    delete requirement.entryState.authoritativeTraceExecuted;
    if (requirement.frameDomainId !== "root") delete requirement.entryState.runtimeReachabilityEstablished;
    requirement.entryStateSha256 = sha256(Buffer.from(canonicalJson(requirement.entryState)));
    requirement.blockingEvidence = [{
      file: "audit/scenario-inventory.json",
      sha256: STALE_INVENTORY,
    }];
  }
  const currentCapture = coverage.requirements
    .find(({requirementId}) => requirementId === targetCapture.requirementId);
  currentCapture.capturedFrameCount = 128;
  currentCapture.missingFrames = [];
  currentCapture.captureManifest = CAPTURE_PATH;
  currentCapture.captureManifestSha256 = CAPTURE_SHA256;
  currentCapture.blockingReason = "Acceptance-neutral current-JavaScript implementation capture only.";
  currentCapture.blockingEvidence = [
    {file: CAPTURE_PATH, sha256: CAPTURE_SHA256},
    {file: "audit/scenario-inventory.json", sha256: STALE_INVENTORY},
  ];
  const adoption = {
    schemaVersion: 1,
    evidenceType: "current-javascript-implementation-capture-adoption",
    animationId: item.animationId,
    status: "partial-non-authoritative-implementation-capture",
    authority: "Deterministic current JavaScript output only. No baseline authority.",
    strictAcceptanceEffect: "none",
    summary: {validationErrors: 0},
    requirements: [{
      requirementId: targetCapture.requirementId,
      frameDomainId: targetCapture.frameDomainId,
      traceId: targetCapture.traceId,
      entryStateSha256: targetCapture.entryStateSha256,
      scenario: targetCapture.scenario,
      language: targetCapture.language,
      seed: targetCapture.seed,
      captureManifest: {path: CAPTURE_PATH, sha256: CAPTURE_SHA256},
      capturedFrameCount: 128,
      result: "validated-current-javascript-output-only",
    }],
  };
  const captureDocument = {
    schemaVersion: 4,
    status: "complete",
    animationId: item.animationId,
    requirementId: targetCapture.requirementId,
    frameDomainId: targetCapture.frameDomainId,
    traceId: targetCapture.traceId,
    entryStateSha256: targetCapture.entryStateSha256,
    scenario: targetCapture.scenario,
    language: targetCapture.language,
    seed: targetCapture.seed,
    captured: Array.from({length: 128}, (_, index) => ({frame: index + 1})),
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
    error: null,
  };
  const captureArtifacts = new Map([[
    CAPTURE_PATH,
    {sha256: CAPTURE_SHA256, document: captureDocument},
  ]]);
  return {item, manifest, coverage, adoption, captureArtifacts, targetCapture};
}

test("repairs only TS006 false entry-state fields, hashes, and current scenario binding", () => {
  const input = fixture();
  const repaired = repairedTs006Coverage({
    ...input,
    scenarioInventorySha256: CURRENT_INVENTORY,
  });
  assert.equal(repaired.requirements.length, 4);
  assert.equal(repaired.requirements.every(({status}) => status === "pending"), true);
  assert.equal(repaired.requirements.every(({baselineAuthority}) => baselineAuthority === "unresolved"), true);
  assert.equal(repaired.requirements.every(({entryState}) => entryState.authoritativeTraceExecuted === false), true);
  assert.equal(repaired.requirements
    .filter(({frameDomainId}) => frameDomainId !== "root")
    .every(({entryState}) => entryState.runtimeReachabilityEstablished === false), true);
  assert.equal(repaired.requirements.every(({entryState, entryStateSha256}) =>
    entryStateSha256 === sha256(Buffer.from(canonicalJson(entryState)))), true);
  assert.equal(repaired.requirements.every(({blockingEvidence}) =>
    blockingEvidence[0].file === "audit/scenario-inventory.json"
    && blockingEvidence[0].sha256 === CURRENT_INVENTORY), true);
  const capture = repaired.requirements.find(({captureManifest}) => captureManifest === CAPTURE_PATH);
  assert.equal(capture.capturedFrameCount, 128);
  assert.deepEqual(capture.missingFrames, []);
  assert.deepEqual(capture.blockingEvidence, [
    {file: "audit/scenario-inventory.json", sha256: CURRENT_INVENTORY},
    {file: CAPTURE_PATH, sha256: CAPTURE_SHA256},
  ]);
  assert.doesNotThrow(() => repairedTs006Coverage({
    ...input,
    coverage: repaired,
    scenarioInventorySha256: CURRENT_INVENTORY,
  }));
});

test("refuses authority drift and unrecognized evidence outside the exact repair allowlist", () => {
  const promoted = fixture();
  promoted.coverage.requirements[0].status = "complete";
  assert.throws(() => repairedTs006Coverage({
    ...promoted,
    scenarioInventorySha256: CURRENT_INVENTORY,
  }), /outside the exact binding-repair allowlist/);

  const extraEvidence = fixture();
  extraEvidence.coverage.requirements[0].blockingEvidence.push({
    file: "evidence/authority.json",
    sha256: "e".repeat(64),
  });
  assert.throws(() => repairedTs006Coverage({
    ...extraEvidence,
    scenarioInventorySha256: CURRENT_INVENTORY,
  }), /unrecognized blocking evidence/);
});

test("refuses a current-JavaScript capture that is not already bound to the repaired identity", () => {
  const input = fixture();
  input.manifest.evidence.candidateCaptureManifests[0].entryStateSha256 = "f".repeat(64);
  assert.throws(() => repairedTs006Coverage({
    ...input,
    scenarioInventorySha256: CURRENT_INVENTORY,
  }), /candidate capture binding is missing, stale, or promoted/);
});

test("CLI supports fail-closed write, check, dry-run, or CAS refresh and exposes no promotion mode", () => {
  assert.deepEqual(parseArguments([]), {check: false, dryRun: false, refresh: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, dryRun: false, refresh: false});
  assert.deepEqual(parseArguments(["--dry-run"]), {check: false, dryRun: true, refresh: false});
  assert.deepEqual(parseArguments(["--refresh"]), {check: false, dryRun: false, refresh: true});
  assert.throws(() => parseArguments(["--check", "--dry-run"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--check", "--refresh"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
