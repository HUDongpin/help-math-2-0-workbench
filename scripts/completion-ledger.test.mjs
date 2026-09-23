import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";

import {
  checkCompletionLedger,
  generateCompletionLedger,
  writeCompletionLedger,
} from "./build-completion-ledger.mjs";
import { scaffoldMigration } from "./create-flash-migration.mjs";
import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";
import {
  buildHumanVisualReviewInput,
  buildHumanVisualReviewRecord,
  buildOwnerReviewRecord,
  deriveHumanReviewExpectations,
  deriveOwnerReviewEvidence,
  projectKnownExceptions,
  writeImmutableReviewArtifact,
} from "./human-owner-review-records.mjs";
import {testCaptureGeneratorProvenance} from "./test-fixtures/implementation-capture.mjs";
import {writeAcceptedNoAudioEvidence} from "./test-fixtures/strict-audio-evidence.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function directoryDigest(frames) {
  return digest(frames.map(({frame, sha256}) => `${frame}\0${sha256}\n`).join(""));
}

async function writeHashed(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value);
  return digest(value);
}

async function createStrictFixture(root, id) {
  const sourcePath = path.join(root, "sources", `${id}.swf`);
  const sourceBytes = Buffer.from(`FWS strict fixture ${id}`);
  await writeHashed(sourcePath, sourceBytes);
  const workspace = await scaffoldMigration({ id, output: path.join(root, "migrations"), swf: sourcePath });
  const manifestPath = path.join(workspace, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  Object.assign(manifest, {
    status: "complete",
    confidence: "high",
    assetId: `swf-${digest(sourceBytes)}`,
  });
  Object.assign(manifest.classification, {
    collection: "formula",
    domain: "formula-reference",
    titleRaw: id,
    titleDisplay: id,
    status: "confirmed",
    evidence: ["strict ledger fixture"],
  });
  Object.assign(manifest.runtime, {
    swfSignature: "FWS",
    swfVersion: 10,
    stage: { width: 2, height: 2 },
    fps: 12,
    frameCount: 1,
    durationMs: 1000 / 12,
    backgroundColor: "#ffffff",
    actionScriptVersion: "AS2",
    complexity: "low",
  });
  Object.assign(manifest.localization, { bilingualRequired: false, languages: ["en"] });
  manifest.scenarios = [{ id: "default", kind: "linear", description: "One-frame strict fixture.", reachable: true }];
  manifest.audit.assetsRequired = false;
  manifest.audit.assetsNotRequiredReason = "No extracted assets in the one-frame fixture.";
  manifest.audio.required = false;
  manifest.audio.reasonNotRequired = "The fixture has no audio.";
  Object.assign(manifest.toolVersions, { ruffle: "test", browser: "Chromium test" });

  const code = {
    baseline: path.join(root, "code", id, "reference.jsx"),
    route: path.join(root, "code", id, "page.jsx"),
    component: path.join(root, "code", id, "component.jsx"),
    timeline: path.join(root, "code", id, "timeline.js"),
    test: path.join(root, "code", id, "timeline.test.mjs"),
  };
  for (const filePath of Object.values(code)) await writeHashed(filePath, "export default true;\n");
  Object.assign(manifest.baseline, {
    authority: "Ruffle",
    route: `/reference/${id}`,
    routeFile: path.relative(root, code.baseline),
    viewport: { width: 2, height: 2, deviceScaleFactor: 1 },
  });
  Object.assign(manifest.implementation, {
    rendering: "React + SVG",
    route: `/animations/${id}`,
    routeFile: path.relative(root, code.route),
    component: path.relative(root, code.component),
    registryModule: "./modules/conversion-1-2",
    timelineModule: path.relative(root, code.timeline),
    testFile: path.relative(root, code.test),
  });
  await writeHashed(
    path.join(root, "packages", "demos", "src", "modules", "conversion-1-2.tsx"),
    "export default true;\n",
  );
  // This ledger fixture exercises the legacy root-only coverage-v1 contract.
  // Explicit frame-domain audits are covered by frame-domain-validation.test.mjs.
  delete manifest.implementation.defaultFrameDomainId;
  delete manifest.implementation.frameDomains;
  delete manifest.implementation.defaultFrameDomainId;
  delete manifest.implementation.frameDomains;
  for (const key of Object.keys(manifest.accessibility)) manifest.accessibility[key] = true;
  manifest.acceptance.engineeringReview = { decision: "accepted", reviewer: "engineer", reviewedAt: "2026-07-21" };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeAcceptedNoAudioEvidence(workspace, manifest);
  await writeFile(
    path.join(workspace, "ACCEPTANCE_CHECKLIST.md"),
    (await readFile(path.join(workspace, "ACCEPTANCE_CHECKLIST.md"), "utf8")).replaceAll("- [ ]", "- [x]"),
  );

  const png = new PNG({ width: 2, height: 2 });
  png.data.fill(255);
  const pngBytes = PNG.sync.write(png);
  const entryState = { kind: "initial-load" };
  const entryStateSha256 = digest(JSON.stringify(entryState));
  const traceId = "default-root-en";
  const requirementId = `req-${traceId}`;
  const evidence = {
    baseline: "baseline/keyframes/frame-001.png",
    implementation: "evidence/implementation/frame-001.png",
    diff: "evidence/diffs/frame-001.png",
  };
  const evidenceHashes = {};
  for (const [name, relative] of Object.entries(evidence)) evidenceHashes[name] = await writeHashed(path.join(workspace, relative), pngBytes);
  await writeFile(
    path.join(workspace, "keyframes.csv"),
    "frame,requirement_id,frame_domain_id,trace_id,entry_state_sha256,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes\n" +
    `1,${requirementId},root,${traceId},${entryStateSha256},0,default,en,static,fixture,load,${evidence.baseline},${evidenceHashes.baseline},${evidence.implementation},${evidenceHashes.implementation},${evidence.diff},${evidenceHashes.diff},0,pass,pass,SWF,visual reviewer,none\n`,
  );

  const implementationArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot: root,
    workspace,
    manifest,
  });
  const captureDirectory = path.join(workspace, "evidence", "contact-sheets", requirementId);
  const captureImageHash = await writeHashed(path.join(captureDirectory, "frame-001.png"), pngBytes);
  const capture = {
    schemaVersion: 4,
    status: "complete",
    sourceUrl: `http://127.0.0.1:3213/animations/${id}`,
    generatorProvenance: testCaptureGeneratorProvenance(),
    implementationArtifactClosure,
    animationId: id,
    requirementId,
    frameDomainId: "root",
    traceId,
    entryStateSha256,
    scenario: "default",
    language: "en",
    seed: "0",
    selector: ".faithful-stage-wrap",
    reportedFrameAttribute: "data-flash-frame",
    reportedAnimationIdAttribute: "data-animation-id",
    reportedFrameDomainAttribute: "data-flash-frame-domain",
    reportedRequirementIdAttribute: "data-flash-requirement-id",
    reportedTraceAttribute: "data-flash-trace-id",
    reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
    viewport: { width: 2, height: 2, deviceScaleFactor: 1 },
    captured: [{
      animationId: id,
      frame: 1,
      reportedFrame: 1,
      requirementId,
      frameDomainId: "root",
      reportedFrameDomainId: "root",
      traceId,
      entryStateSha256,
      scenario: "default",
      language: "en",
      seed: "0",
      file: "frame-001.png",
      sha256: captureImageHash,
      width: 2,
      height: 2,
    }],
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  const captureRelative = path.relative(workspace, path.join(captureDirectory, "capture-manifest.json"));
  const captureBytes = `${JSON.stringify(capture, null, 2)}\n`;
  const captureHash = await writeHashed(path.join(workspace, captureRelative), captureBytes);
  const baselineDirectory = captureDirectory;
  const baselineFrameHash = await writeHashed(path.join(baselineDirectory, "baseline-frame-001.png"), pngBytes);
  const baseline = {
    schemaVersion: 2,
    evidenceType: "original-runtime-frame-domain-baseline",
    status: "complete",
    animationId: id,
    requirementId,
    frameDomainId: "root",
    traceId,
    entryStateSha256,
    scenario: "default",
    language: "en",
    seed: "0",
    baselineAuthority: "original-runtime-natural-trace",
    capturedAt: "2026-07-21T00:00:00.000Z",
    source: { swf: manifest.source.swf, swfSha256: manifest.source.swfSha256 },
    runtime: {
      stage: { width: 2, height: 2 },
      fps: 12,
      frameCount: 1,
      frameNumbering: "one-indexed",
    },
    capture: {
      operator: "completion-ledger-test-fixture",
      tool: "authorized-original-runtime",
      toolVersion: "fixture-1",
      traceEntryMode: "natural-runtime-navigation",
      frameCaptureMode: "deterministic-sequential-step",
      entryProtocol: "Load the source movie through the declared natural entry.",
      frameControlProtocol: "Capture frame 1 before advancing the source playhead.",
      entryTrace: [{ order: 1, action: "load source movie", resultingFrameDomainId: "root" }],
    },
    frames: [{
      animationId: id,
      frame: 1,
      requirementId,
      frameDomainId: "root",
      traceId,
      entryStateSha256,
      file: "baseline-frame-001.png",
      sha256: baselineFrameHash,
      width: 2,
      height: 2,
    }],
  };
  const baselineRelative = path.relative(workspace, path.join(baselineDirectory, "baseline-capture-manifest.json"));
  const baselineBytes = `${JSON.stringify(baseline, null, 2)}\n`;
  const baselineHash = await writeHashed(path.join(workspace, baselineRelative), baselineBytes);
  const diffFrameHash = await writeHashed(path.join(captureDirectory, "diff-frame-001.png"), pngBytes);
  const metrics = {
    schemaVersion: 2,
    status: "complete",
    evidenceType: "full-frame-directory-comparison",
    animationId: id,
    requirementId,
    scenario: "default",
    language: "en",
    seed: "0",
    frameDomainId: "root",
    traceId,
    entryStateSha256,
    baselineAuthority: "original-runtime-natural-trace",
    baselineFrameDomainId: "root",
    baselineTraceId: traceId,
    baselineEntryStateSha256: entryStateSha256,
    baselineCaptureManifest: "baseline-capture-manifest.json",
    baselineCaptureManifestSha256: baselineHash,
    implementationCaptureManifest: "capture-manifest.json",
    implementationCaptureManifestSha256: captureHash,
    contract: {
      requiredRange: {firstFrame: 1, lastFrame: 1},
      stage: {width: 2, height: 2},
    },
    inputs: {
      baseline: {directorySha256: directoryDigest([{frame: 1, sha256: baselineFrameHash}])},
      implementation: {directorySha256: directoryDigest([{frame: 1, sha256: captureImageHash}])},
    },
    diffArchive: {directorySha256: directoryDigest([{frame: 1, sha256: diffFrameHash}])},
    summary: {frameCount: 1},
    frames: [{
      frame: 1,
      requirementId,
      frameDomainId: "root",
      traceId,
      entryStateSha256,
      baselineFile: "baseline-frame-001.png",
      implementationFile: "frame-001.png",
      diffFile: "diff-frame-001.png",
      kind: "static",
      baselineSha256: baselineFrameHash,
      implementationSha256: captureImageHash,
      diffSha256: diffFrameHash,
      width: 2,
      height: 2,
      normalizedRmse: 0,
      result: "pass",
    }],
  };
  const metricsRelative = path.relative(workspace, path.join(captureDirectory, "metrics.json"));
  const metricsBytes = `${JSON.stringify(metrics, null, 2)}\n`;
  const metricsHash = await writeHashed(path.join(workspace, metricsRelative), metricsBytes);
  const contactPageHash = await writeHashed(path.join(captureDirectory, "contact-page-01.png"), pngBytes);
  const contactManifestRelative = path.relative(workspace, path.join(captureDirectory, "manifest.json"));
  await writeHashed(path.join(workspace, contactManifestRelative), `${JSON.stringify({
    schemaVersion: 1,
    evidenceType: "full-frame-contact-sheet",
    animationId: id,
    sourceEvidence: {
      comparison: {file: "metrics.json", sha256: metricsHash},
      implementationCaptureManifest: {file: "capture-manifest.json", sha256: captureHash},
    },
    contract: {frameCount: 1, stage: {width: 2, height: 2}},
    pages: [{
      page: 1,
      file: "contact-page-01.png",
      sha256: contactPageHash,
      width: 2,
      height: 2,
      frames: [1],
    }],
    verification: {
      comparisonSummaryRecomputed: true,
      completeSequentialFrameCoverage: true,
      everyFrameRepresentedExactlyOnce: true,
      implementationCaptureHashesMatchActualPngs: true,
      diffHashesMatchActualPngs: true,
      nativeStageDimensionsMatch: true,
      captureStatusComplete: true,
    },
  }, null, 2)}\n`);
  await writeFile(path.join(workspace, "evidence", "full-frame-coverage.json"), `${JSON.stringify({
    schemaVersion: 1,
    animationId: id,
    frameCount: 1,
    scenarios: ["default"],
    languages: ["en"],
    combinations: [{
      status: "complete",
      scenario: "default",
      language: "en",
      seed: "0",
      firstFrame: 1,
      lastFrame: 1,
      capturedFrameCount: 1,
      missingFrames: [],
      captureManifest: captureRelative,
      captureManifestSha256: captureHash,
      metricsFile: metricsRelative,
      metricsSha256: metricsHash,
      contactSheetManifest: contactManifestRelative,
    }],
  }, null, 2)}\n`);

  await writeFile(path.join(workspace, "evidence", "behavior-qa.json"), `${JSON.stringify({
    schemaVersion: 1,
    animationId: id,
    status: "pass",
  }, null, 2)}\n`);
  await writeFile(path.join(workspace, "evidence", "product-qa.json"), `${JSON.stringify({
    schemaVersion: 1,
    animationId: id,
    status: "pass",
  }, null, 2)}\n`);
  const expectations = await deriveHumanReviewExpectations({projectRoot: root, workspace, manifest});
  const reviewInput = await buildHumanVisualReviewInput({
    projectRoot: root,
    workspace,
    manifest,
    requirements: expectations.expectedRequirements,
    expectedRequirementIds: expectations.expectedRequirementIds,
  });
  const inputDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "input",
    value: reviewInput,
  });
  const humanRecord = buildHumanVisualReviewRecord({
    animationId: id,
    decision: "accepted",
    reviewer: {
      kind: "human",
      fullName: "Dr. Ledger Visual Reviewer",
      role: "Fixture visual evidence reviewer",
      organizationOrOwnerId: "ledger-human-fixture",
      contact: "ledger-human@example.test",
    },
    reviewedAt: "2026-07-22T09:00:00+08:00",
    reviewInput: inputDescriptor,
    requirementIds: expectations.expectedRequirementIds,
    notes: "All bound ledger fixture visual evidence was personally reviewed.",
  });
  const humanDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "human",
    value: humanRecord,
  });
  const ownerEvidence = await deriveOwnerReviewEvidence({projectRoot: root, workspace, manifest});
  const ownerRecord = buildOwnerReviewRecord({
    animationId: id,
    decision: "accepted",
    reviewer: {
      kind: "human",
      fullName: "Dr. Ledger Owner",
      role: "Fixture owner evidence reviewer",
      organizationOrOwnerId: "ledger-owner-fixture",
      contact: "ledger-owner@example.test",
      authority: "owner",
    },
    reviewedAt: "2026-07-22T10:00:00+08:00",
    reason: "I accept the exact hash-bound ledger fixture evidence and exceptions.",
    humanVisualReview: humanDescriptor,
    ...ownerEvidence,
    knownExceptions: projectKnownExceptions(manifest),
    notes: "Owner fixture review completed against current evidence.",
  });
  const ownerDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "owner",
    value: ownerRecord,
  });
  manifest.acceptance.humanVisualReview = {
    decision: "accepted",
    reviewer: humanRecord.reviewer.fullName,
    reviewedAt: humanRecord.reviewedAt,
    scope: humanRecord.scope,
    record: humanDescriptor,
  };
  manifest.acceptance.ownerReview = {
    decision: "accepted",
    reviewer: ownerRecord.reviewer.fullName,
    reviewedAt: ownerRecord.reviewedAt,
    reason: ownerRecord.reason,
    record: ownerDescriptor,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { workspace, manifestPath };
}

test("completion ledger admits only real strict passes in stable order without mutating manifests", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "completion-ledger-"));
  try {
    const zeta = await createStrictFixture(root, "zeta-complete");
    const alpha = await createStrictFixture(root, "alpha-complete");
    const draftSource = path.join(root, "sources", "draft.swf");
    await writeHashed(draftSource, "draft SWF");
    const draftWorkspace = await scaffoldMigration({ id: "draft-only", output: path.join(root, "migrations"), swf: draftSource });
    const falseCompleteManifestPath = path.join(draftWorkspace, "migration.json");
    const falseComplete = JSON.parse(await readFile(falseCompleteManifestPath, "utf8"));
    falseComplete.status = "complete";
    await writeFile(falseCompleteManifestPath, `${JSON.stringify(falseComplete, null, 2)}\n`);

    const before = new Map();
    for (const filePath of [zeta.manifestPath, alpha.manifestPath, falseCompleteManifestPath]) before.set(filePath, await readFile(filePath, "utf8"));
    const ledger = await generateCompletionLedger({ migrationsRoot: path.join(root, "migrations") });
    assert.deepEqual(
      ledger.entries.map(({ animationId }) => animationId),
      ["alpha-complete", "zeta-complete"],
      JSON.stringify(ledger.diagnostics, null, 2),
    );
    assert.equal(ledger.summary.migrationDirectories, 3);
    assert.equal(ledger.summary.declaredComplete, 3);
    assert.equal(ledger.summary.strictComplete, 2);
    assert.equal(ledger.summary.strictFailed, 1);
    assert.match(ledger.generatedMarker, /^sha256:[a-f0-9]{64}$/);
    assert.match(ledger.validator.sha256, /^[a-f0-9]{64}$/);
    assert.equal(ledger.entries[0].validation.mode, "strict");
    assert.equal(ledger.entries[0].route, "/animations/alpha-complete");
    assert.equal(ledger.entries[0].acceptance.ownerReview.decision, "accepted");
    assert.match(ledger.entries[0].acceptance.humanVisualReview.record.sha256, /^[a-f0-9]{64}$/);
    assert.match(ledger.entries[0].acceptance.ownerReview.record.sha256, /^[a-f0-9]{64}$/);
    assert.equal(ledger.diagnostics[0].animationId, "draft-only");
    assert.ok(ledger.diagnostics[0].errorCount > 0);
    for (const [filePath, contents] of before) assert.equal(await readFile(filePath, "utf8"), contents);

    const output = path.join(root, "catalog", "completion-ledger.json");
    const firstWrite = await writeCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output });
    const secondWrite = await writeCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output });
    assert.equal(firstWrite.serialized, secondWrite.serialized);
    assert.equal((await checkCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output })).ok, true);
    assert.equal((await readdir(path.dirname(output))).some((name) => name.endsWith(".tmp")), false);

    const changed = JSON.parse(await readFile(falseCompleteManifestPath, "utf8"));
    changed.classification.titleRaw = "changed diagnostic input";
    await writeFile(falseCompleteManifestPath, `${JSON.stringify(changed, null, 2)}\n`);
    const stale = await checkCompletionLedger({ migrationsRoot: path.join(root, "migrations"), output });
    assert.equal(stale.ok, false);
    assert.equal(stale.reason, "stale");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("zero strict-complete migrations produce a valid checkable ledger", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "completion-ledger-empty-"));
  try {
    const migrationsRoot = path.join(root, "migrations");
    const output = path.join(root, "catalog", "completion-ledger.json");
    const { ledger } = await writeCompletionLedger({ migrationsRoot, output });
    assert.equal(ledger.summary.migrationDirectories, 0);
    assert.equal(ledger.summary.strictComplete, 0);
    assert.deepEqual(ledger.entries, []);
    assert.equal((await checkCompletionLedger({ migrationsRoot, output })).ok, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
