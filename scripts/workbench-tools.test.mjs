import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PNG } from "pngjs";

import { comparePngFiles } from "./compare-images.mjs";
import { assertRendererReadyContract, assertReportedCaptureIdentity, assertReportedFrame, assertReportedFrameDomain, assertReportedRuntimeContext, buildCaptureUrl, captureKeyframes, parseArguments as parseCaptureArguments } from "./capture-animation-keyframes.mjs";
import { readSwfHeader, scaffoldMigration } from "./create-flash-migration.mjs";
import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";
import {
  buildOwnerReviewRecord,
  buildHumanVisualReviewInput,
  buildHumanVisualReviewRecord,
  deriveOwnerReviewEvidence,
  deriveHumanReviewExpectations,
  writeImmutableReviewArtifact,
} from "./human-owner-review-records.mjs";
import { PILOT_MIGRATIONS, scaffoldPilotMigrations } from "./scaffold-pilot-migrations.mjs";
import { validateAdobeAnimateAuthoringAudit, validateInventory, validateMigration } from "../skills/flash-to-js/scripts/validate_migration.mjs";
import {writeAcceptedNoAudioEvidence} from "./test-fixtures/strict-audio-evidence.mjs";
import {testCaptureGeneratorProvenance} from "./test-fixtures/implementation-capture.mjs";

const testProjectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function solidPng(width, height, value = 255) {
  const png = new PNG({ width, height });
  png.data.fill(value);
  return PNG.sync.write(png);
}

async function writeHashed(filePath, bytes) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return digest(bytes);
}

async function writeValidAnimateAuthoringAudit({evidenceProjectRoot, manifest, migrationRoot, png}) {
  const animationId = manifest.animationId;
  const flaName = path.basename(manifest.source.fla);
  const auditScriptRelative = "scripts/animate-audit-current-document.jsfl";
  const auditScriptBytes = "// current fixture Animate audit script\n";
  await writeHashed(path.join(evidenceProjectRoot, auditScriptRelative), auditScriptBytes);

  const workingCopyRelative = `work/animate/read-only-fla-copies/${animationId}/${flaName}`;
  const workingCopyPath = path.join(evidenceProjectRoot, workingCopyRelative);
  const flaBytes = await readFile(manifest.source.fla);
  await writeHashed(workingCopyPath, flaBytes);
  await chmod(workingCopyPath, 0o444);

  const capturedFrameRelative = "audit/adobe-animate-2021-authoring-frame-0001.png";
  const capturedFramePath = path.join(migrationRoot, capturedFrameRelative);
  await writeHashed(capturedFramePath, png);
  const capturedAt = "2026-07-21T00:00:00.000Z";
  const animateVersion = "MAC 21,0,7,42652";
  const authoringAudit = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    capturedAt,
    animateVersion,
    recursiveLibraryTimelineAudit: true,
    document: {
      name: flaName,
      pathURI: pathToFileURL(workingCopyPath).href,
      width: manifest.runtime.stage.width,
      height: manifest.runtime.stage.height,
      frameRate: manifest.runtime.fps,
      backgroundColor: manifest.runtime.backgroundColor,
      libraryItemCount: 0,
    },
    timeline: {
      frameCount: manifest.runtime.frameCount,
      currentFlashFrame: 1,
      layerCount: 1,
      layers: [{name: "Layer 1", keyframes: [{startFrame: 0, duration: 1, elements: []}]}],
    },
    library: [],
  };
  const report = {
    schemaVersion: 2,
    evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
    authority: "Original owner-provided FLA inspected read-only in Adobe Animate 2021",
    animationId,
    capturedAt,
    animateVersion,
    protocol: {
      coldStartPerFla: true,
      openedWithoutSaving: true,
      originalSourceHashVerified: true,
      readOnlyWorkingCopyRequired: true,
      readOnlyWorkingCopyPathVerified: true,
      readOnlyWorkingCopyHashVerifiedAtFinalize: true,
      readOnlyWorkingCopyPermissionsVerifiedAtFinalize: true,
      recursiveLibraryTimelineAuditRequired: true,
      recursiveLibraryTimelineAuditVerified: true,
    },
    auditScript: {file: auditScriptRelative, sha256: digest(auditScriptBytes)},
    source: {
      fla: manifest.source.fla,
      flaSha256: manifest.source.flaSha256,
      workingCopy: {
        path: workingCopyRelative,
        sha256: manifest.source.flaSha256,
        bytes: flaBytes.length,
        readOnlyAtFinalize: true,
        byteIdenticalToSourceAtFinalize: true,
      },
    },
    nativeMovie: {
      width: manifest.runtime.stage.width,
      height: manifest.runtime.stage.height,
      fps: manifest.runtime.fps,
      frameCount: manifest.runtime.frameCount,
      backgroundColor: manifest.runtime.backgroundColor,
      rootLayerCount: 1,
      libraryItemCount: 0,
    },
    capturedAuthoringFrame: {
      flashFrame: 1,
      file: capturedFrameRelative,
      sha256: digest(png),
      width: manifest.runtime.stage.width,
      height: manifest.runtime.stage.height,
    },
    rawAuditSha256: digest(JSON.stringify(authoringAudit)),
    authoringAudit,
    limitations: ["Fixture authoring evidence does not establish runtime behavior."],
  };
  const auditPath = path.join(migrationRoot, "audit", "adobe-animate-2021-authoring-audit.json");
  const writeReport = async (value = report) => writeFile(auditPath, `${JSON.stringify(value, null, 2)}\n`);
  await writeReport();
  return {auditPath, capturedFramePath, report, workingCopyPath, writeReport};
}

function signedBits(value, width) {
  const normalized = value < 0 ? 2 ** width + value : value;
  return normalized.toString(2).padStart(width, "0");
}

function testSwf({ width = 320, height = 240, fps = 12, frameCount = 1, version = 10 } = {}) {
  const fieldBits = 15;
  const rectangleBits = `${fieldBits.toString(2).padStart(5, "0")}${signedBits(0, fieldBits)}${signedBits(width * 20, fieldBits)}${signedBits(0, fieldBits)}${signedBits(height * 20, fieldBits)}`;
  const paddedBits = rectangleBits.padEnd(Math.ceil(rectangleBits.length / 8) * 8, "0");
  const rectangle = Buffer.from(paddedBits.match(/.{8}/g).map((bits) => Number.parseInt(bits, 2)));
  const timeline = Buffer.alloc(4);
  timeline.writeUInt16LE(fps * 256, 0);
  timeline.writeUInt16LE(frameCount, 2);
  const body = Buffer.concat([rectangle, timeline]);
  const header = Buffer.alloc(8);
  header.write("FWS", 0, "ascii");
  header[3] = version;
  header.writeUInt32LE(header.length + body.length, 4);
  return Buffer.concat([header, body]);
}

test("scaffolds a portable draft and enforces complete strict evidence", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-migration-"));
  try {
    const flaPath = path.join(temporaryRoot, "Conversion_Test.fla");
    const swfPath = path.join(temporaryRoot, "Conversion_Test.swf");
    const swfBytes = testSwf();
    await writeFile(flaPath, "test FLA source");
    await writeFile(swfPath, swfBytes);
    const destination = await scaffoldMigration({
      id: "Conversion_Test",
      output: temporaryRoot,
      fla: flaPath,
      swf: swfPath,
    });
    const validateFixtureMigration = (options = {}) => validateMigration(destination, {
      ...options,
      evidenceProjectRoot: temporaryRoot,
    });
    const manifest = JSON.parse(await readFile(path.join(destination, "migration.json"), "utf8"));
    assert.equal(manifest.id, "Conversion_Test");
    assert.equal(manifest.schemaVersion, 2);
    assert.equal(manifest.animationId, "Conversion_Test");
    assert.equal(manifest.source.fla, flaPath);
    assert.equal(manifest.source.swf, swfPath);
    assert.equal(manifest.source.placementPath, swfPath);
    assert.equal(manifest.source.pairedFlaStatus, "present");
    assert.equal(manifest.status, "preserved");
    assert.equal(manifest.source.flaSha256, digest("test FLA source"));
    assert.equal(manifest.source.swfSha256, digest(swfBytes));
    assert.equal(manifest.assetId, `swf-${digest(swfBytes)}`);
    assert.deepEqual(manifest.runtime.stage, { width: 320, height: 240 });
    assert.equal(manifest.runtime.swfSignature, "FWS");
    assert.equal(manifest.runtime.swfVersion, 10);
    assert.equal(manifest.runtime.fps, 12);
    assert.equal(manifest.runtime.frameCount, 1);
    assert.equal(await readFile(flaPath, "utf8"), "test FLA source");
    assert.deepEqual(await readFile(swfPath), swfBytes);
    assert.equal(manifest.acceptance.humanVisualReview.record, null);
    assert.equal(manifest.acceptance.ownerReview.record, null);

    const draft = await validateFixtureMigration({ allowDraft: true });
    assert.equal(draft.ok, true, draft.errors.join("\n"));
    const legacyPending = structuredClone(manifest);
    delete legacyPending.acceptance.humanVisualReview.record;
    delete legacyPending.acceptance.ownerReview.record;
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(legacyPending, null, 2)}\n`);
    const legacyPendingDraft = await validateFixtureMigration({allowDraft: true});
    assert.equal(legacyPendingDraft.ok, true, legacyPendingDraft.errors.join("\n"));
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const strict = await validateFixtureMigration();
    assert.equal(strict.ok, false);
    assert.ok(strict.errors.some((error) => error.includes("status must be 'complete'")));

    const swfHash = digest(swfBytes);
    Object.assign(manifest, {
      status: "complete",
      confidence: "high",
      assetId: `swf-${swfHash}`,
    });
    Object.assign(manifest.classification, {
      collection: "formula",
      domain: "formula-reference",
      titleRaw: "Conversion Test",
      titleDisplay: "Conversion Test",
      status: "confirmed",
      evidence: ["owner source path"],
    });
    Object.assign(manifest.source, {
      placementPath: swfPath,
      pairedFlaStatus: "present",
      flaSha256: digest("test FLA source"),
      swfSha256: swfHash,
    });
    Object.assign(manifest.runtime, {
      swfSignature: "FWS",
      swfVersion: 10,
      fps: 12,
      frameCount: 1,
      durationMs: 83.333,
      backgroundColor: "#ffffff",
      actionScriptVersion: "AS2",
      complexity: "low",
    });
    Object.assign(manifest.runtime.stage, { width: 320, height: 240 });
    Object.assign(manifest.toolVersions, { ruffle: "test", browser: "Chromium test" });
    const implementationFiles = {
      baseline: path.join(temporaryRoot, "app", "ruffle", "test", "page.jsx"),
      route: path.join(temporaryRoot, "app", "test", "page.jsx"),
      component: path.join(temporaryRoot, "components", "Test.jsx"),
      timeline: path.join(temporaryRoot, "lib", "testTimeline.js"),
      test: path.join(temporaryRoot, "lib", "testTimeline.test.mjs"),
    };
    for (const filePath of Object.values(implementationFiles)) await writeHashed(filePath, "export default true;\n");
    Object.assign(manifest.baseline, {
      authority: "Ruffle",
      route: "/ruffle/test",
      routeFile: implementationFiles.baseline,
      viewport: { width: 320, height: 240, deviceScaleFactor: 1 },
    });
    Object.assign(manifest.implementation, {
      rendering: "React + SVG",
      route: "/test",
      routeFile: path.relative(temporaryRoot, implementationFiles.route),
      component: path.relative(temporaryRoot, implementationFiles.component),
      registryModule: "./modules/conversion-1-2",
      timelineModule: path.relative(temporaryRoot, implementationFiles.timeline),
      testFile: path.relative(temporaryRoot, implementationFiles.test),
    });
    await writeHashed(
      path.join(temporaryRoot, "packages", "demos", "src", "modules", "conversion-1-2.tsx"),
      "export default true;\n",
    );
    // This workbench fixture exercises the legacy root-only coverage-v1 contract.
    // Explicit frame-domain audits are covered by frame-domain-validation.test.mjs.
    delete manifest.implementation.defaultFrameDomainId;
    delete manifest.implementation.frameDomains;
    delete manifest.implementation.defaultFrameDomainId;
    delete manifest.implementation.frameDomains;
    manifest.audit.assetsRequired = false;
    manifest.audit.assetsNotRequiredReason = "The renderer uses only semantic SVG primitives.";
    manifest.audio.required = false;
    manifest.audio.reasonNotRequired = "The source movie has no audio tags or external audio cues.";
    manifest.scenarios[0].description = "Linear default playback from frame 1 through completion.";
    for (const key of Object.keys(manifest.accessibility)) manifest.accessibility[key] = true;
    manifest.acceptance.engineeringReview = { decision: "accepted", reviewer: "test engineer", reviewedAt: "2026-07-21" };
    manifest.acceptance.humanVisualReview = {
      decision: "accepted",
      reviewer: "test visual reviewer",
      reviewedAt: "2026-07-21",
      scope: "all-keyframe-and-full-frame-diffs",
    };
    manifest.acceptance.ownerReview = { decision: "not-required", reviewer: "", reviewedAt: "", reason: "Automated fixture only." };
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeAcceptedNoAudioEvidence(destination, manifest);
    await writeFile(
      path.join(destination, "ACCEPTANCE_CHECKLIST.md"),
      (await readFile(path.join(destination, "ACCEPTANCE_CHECKLIST.md"), "utf8")).replaceAll("- [ ]", "- [x]"),
    );
    const png = solidPng(320, 240);
    const implementationArtifactClosure = await collectImplementationArtifactClosure({
      projectRoot: temporaryRoot,
      workspace: destination,
      manifest,
    });
    const entryState = { kind: "initial-load" };
    const entryStateHash = digest(JSON.stringify(entryState));
    const keyframeHashes = {};
    for (const relative of [
      "baseline/keyframes/frame-001.png",
      "evidence/implementation/frame-001.png",
      "evidence/diffs/frame-001.png",
    ]) keyframeHashes[relative] = await writeHashed(path.join(destination, relative), png);
    await writeFile(
      path.join(destination, "keyframes.csv"),
      "frame,requirement_id,frame_domain_id,trace_id,entry_state_sha256,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes\n" +
      `1,req-default-root-en,root,default-root-en,${entryStateHash},0,default,en,static,initial state,load,baseline/keyframes/frame-001.png,${keyframeHashes["baseline/keyframes/frame-001.png"]},evidence/implementation/frame-001.png,${keyframeHashes["evidence/implementation/frame-001.png"]},evidence/diffs/frame-001.png,${keyframeHashes["evidence/diffs/frame-001.png"]},0.01,pass,pass,SWF,test reviewer,none\n`,
    );

    const requirements = [];
    for (const language of ["en", "es"]) {
      const traceId = `default-root-${language}`;
      const requirementId = `req-${traceId}`;
      const captureDirectory = path.join(destination, "evidence", "contact-sheets", requirementId);
      const captured = [];
      for (const frame of [1]) {
        const filename = `frame-${String(frame).padStart(3, "0")}.png`;
        const checksum = await writeHashed(path.join(captureDirectory, filename), png);
        captured.push({
          animationId: "Conversion_Test",
          frame,
          reportedFrame: frame,
          requirementId,
          frameDomainId: "root",
          reportedFrameDomainId: "root",
          traceId,
          entryStateSha256: entryStateHash,
          scenario: "default",
          language,
          seed: "0",
          file: filename,
          sha256: checksum,
          width: 320,
          height: 240,
        });
      }
      const capture = {
        schemaVersion: 4,
        status: "complete",
        sourceUrl: "http://127.0.0.1:3213/animations/Conversion_Test",
        generatorProvenance: testCaptureGeneratorProvenance(),
        implementationArtifactClosure,
        animationId: "Conversion_Test",
        requirementId,
        frameDomainId: "root",
        traceId,
        entryStateSha256: entryStateHash,
        scenario: "default",
        language,
        seed: "0",
        selector: ".faithful-stage-wrap",
        reportedFrameAttribute: "data-flash-frame",
        reportedAnimationIdAttribute: "data-animation-id",
        reportedFrameDomainAttribute: "data-flash-frame-domain",
        reportedRequirementIdAttribute: "data-flash-requirement-id",
        reportedTraceAttribute: "data-flash-trace-id",
        reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
        viewport: { width: 320, height: 240, deviceScaleFactor: 1 },
        captured,
        consoleErrors: [],
        failedRequests: [],
        httpErrors: [],
        unexpectedRequests: [],
      };
      const captureRelative = path.relative(destination, path.join(captureDirectory, "capture-manifest.json"));
      const captureSha256 = await writeHashed(path.join(destination, captureRelative), `${JSON.stringify(capture, null, 2)}\n`);
      const baselineDirectory = captureDirectory;
      const baselineFrame = path.join(baselineDirectory, "baseline-frame-001.png");
      const baselineFrameSha256 = await writeHashed(baselineFrame, png);
      const baseline = {
        schemaVersion: 2,
        evidenceType: "original-runtime-frame-domain-baseline",
        status: "complete",
        animationId: "Conversion_Test",
        requirementId,
        frameDomainId: "root",
        traceId,
        entryStateSha256: entryStateHash,
        scenario: "default",
        language,
        seed: "0",
        baselineAuthority: "original-runtime-natural-trace",
        capturedAt: "2026-07-21T00:00:00.000Z",
        source: { swf: swfPath, swfSha256: swfHash },
        runtime: {
          stage: { width: 320, height: 240 },
          fps: 12,
          frameCount: 1,
          frameNumbering: "one-indexed",
        },
        capture: {
          operator: "workbench-test-fixture",
          tool: "authorized-original-runtime",
          toolVersion: "fixture-1",
          traceEntryMode: "natural-runtime-navigation",
          frameCaptureMode: "deterministic-sequential-step",
          entryProtocol: "Load the source movie through the declared natural entry.",
          frameControlProtocol: "Capture frame 1 before advancing the source playhead.",
          entryTrace: [{ order: 1, action: "load source movie", resultingFrameDomainId: "root" }],
        },
        frames: [{
          animationId: "Conversion_Test",
          frame: 1,
          requirementId,
          frameDomainId: "root",
          traceId,
          entryStateSha256: entryStateHash,
          file: "baseline-frame-001.png",
          sha256: baselineFrameSha256,
          width: 320,
          height: 240,
        }],
      };
      const baselineRelative = path.relative(destination, path.join(baselineDirectory, "baseline-capture-manifest.json"));
      const baselineSha256 = await writeHashed(path.join(destination, baselineRelative), `${JSON.stringify(baseline, null, 2)}\n`);
      const diffFrameSha256 = await writeHashed(path.join(captureDirectory, "diff-frame-001.png"), png);
      const metrics = {
        schemaVersion: 2,
        status: "complete",
        evidenceType: "full-frame-directory-comparison",
        animationId: "Conversion_Test",
        requirementId,
        scenario: "default",
        language,
        seed: "0",
        frameDomainId: "root",
        traceId,
        entryStateSha256: entryStateHash,
        baselineAuthority: "original-runtime-natural-trace",
        baselineFrameDomainId: "root",
        baselineTraceId: traceId,
        baselineEntryStateSha256: entryStateHash,
        baselineCaptureManifest: "baseline-capture-manifest.json",
        baselineCaptureManifestSha256: baselineSha256,
        implementationCaptureManifest: "capture-manifest.json",
        implementationCaptureManifestSha256: captureSha256,
        contract: {
          requiredRange: {firstFrame: 1, lastFrame: 1},
          stage: {width: 320, height: 240},
        },
        inputs: {
          baseline: {directorySha256: digest(`1\0${baselineFrameSha256}\n`)},
          implementation: {directorySha256: digest(`1\0${captured[0].sha256}\n`)},
        },
        diffArchive: {directorySha256: digest(`1\0${diffFrameSha256}\n`)},
        summary: {frameCount: 1},
        frames: [{
          frame: 1,
          requirementId,
          frameDomainId: "root",
          traceId,
          entryStateSha256: entryStateHash,
          baselineFile: "baseline-frame-001.png",
          baselineSha256: baselineFrameSha256,
          implementationFile: "frame-001.png",
          implementationSha256: captured[0].sha256,
          diffFile: "diff-frame-001.png",
          diffSha256: diffFrameSha256,
          width: 320,
          height: 240,
          kind: "static",
          normalizedRmse: 0.01,
          result: "pass",
        }],
      };
      const metricsRelative = path.relative(destination, path.join(captureDirectory, "metrics.json"));
      const metricsSha256 = await writeHashed(path.join(destination, metricsRelative), `${JSON.stringify(metrics, null, 2)}\n`);
      const contactPageSha256 = await writeHashed(path.join(captureDirectory, "contact-page-01.png"), png);
      const contactManifestRelative = path.relative(destination, path.join(captureDirectory, "manifest.json"));
      await writeHashed(path.join(destination, contactManifestRelative), `${JSON.stringify({
        schemaVersion: 1,
        evidenceType: "full-frame-contact-sheet",
        animationId: "Conversion_Test",
        sourceEvidence: {
          comparison: {file: "metrics.json", sha256: metricsSha256},
          implementationCaptureManifest: {file: "capture-manifest.json", sha256: captureSha256},
        },
        contract: {frameCount: 1, stage: {width: 320, height: 240}},
        pages: [{
          page: 1,
          file: "contact-page-01.png",
          sha256: contactPageSha256,
          width: 320,
          height: 240,
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
      requirements.push({
        requirementId,
        status: "complete",
        scenario: "default",
        frameDomainId: "root",
        traceId,
        language,
        seed: "0",
        requiredRange: { firstFrame: 1, lastFrame: 1 },
        entryState,
        entryStateSha256: entryStateHash,
        baselineAuthorityRequirement: "original-runtime-natural-trace",
        baselineAuthority: "original-runtime-natural-trace",
        baselineCaptureManifest: baselineRelative,
        baselineCaptureManifestSha256: baselineSha256,
        capturedFrameCount: 1,
        missingFrames: [],
        captureManifest: captureRelative,
        captureManifestSha256: captureSha256,
        metricsFile: metricsRelative,
        metricsSha256,
        contactSheetManifest: contactManifestRelative,
      });
    }
    await writeFile(path.join(destination, "evidence", "full-frame-coverage.json"), `${JSON.stringify({
      schemaVersion: 1,
      animationId: "Conversion_Test",
      frameCount: 1,
      scenarios: ["default"],
      languages: ["en", "es"],
      combinations: requirements.map((requirement) => ({
        status: requirement.status,
        scenario: requirement.scenario,
        language: requirement.language,
        seed: requirement.seed,
        firstFrame: requirement.requiredRange.firstFrame,
        lastFrame: requirement.requiredRange.lastFrame,
        capturedFrameCount: requirement.capturedFrameCount,
        missingFrames: requirement.missingFrames,
        captureManifest: requirement.captureManifest,
        captureManifestSha256: requirement.captureManifestSha256,
        metricsFile: requirement.metricsFile,
        metricsSha256: requirement.metricsSha256,
        contactSheetManifest: requirement.contactSheetManifest,
      })),
    }, null, 2)}\n`);

    const missingAuthoringAudit = await validateFixtureMigration();
    assert.equal(missingAuthoringAudit.ok, false);
    assert.ok(
      missingAuthoringAudit.errors.some((error) => error.includes("Missing required paired-FLA authoring audit")),
      missingAuthoringAudit.errors.join("\n"),
    );
    const swfOnlyManifest = structuredClone(manifest);
    delete swfOnlyManifest.source.fla;
    delete swfOnlyManifest.source.flaSha256;
    swfOnlyManifest.source.pairedFlaStatus = "not-applicable";
    const swfOnlyErrors = [];
    const swfOnlyAudit = await validateAdobeAnimateAuthoringAudit({
      root: destination,
      manifest: swfOnlyManifest,
      errors: swfOnlyErrors,
      evidenceProjectRoot: temporaryRoot,
    });
    assert.equal(swfOnlyAudit.applicable, false);
    assert.deepEqual(swfOnlyErrors, []);

    const authoringFixture = await writeValidAnimateAuthoringAudit({
      evidenceProjectRoot: temporaryRoot,
      manifest,
      migrationRoot: destination,
      png,
    });
    const expectAuthoringAuditFailure = async (mutate, expectedError) => {
      const tampered = structuredClone(authoringFixture.report);
      mutate(tampered);
      await authoringFixture.writeReport(tampered);
      const result = await validateFixtureMigration();
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((error) => error.includes(expectedError)), result.errors.join("\n"));
      await authoringFixture.writeReport();
    };
    await expectAuthoringAuditFailure((report) => { report.schemaVersion = 1; }, "schemaVersion must be 2");
    await expectAuthoringAuditFailure((report) => { report.auditScript.sha256 = "0".repeat(64); }, "auditScript: sha256 does not match");
    await expectAuthoringAuditFailure((report) => { report.source.flaSha256 = "0".repeat(64); }, "source.flaSha256 must match migration.json");
    await expectAuthoringAuditFailure((report) => { report.source.workingCopy.sha256 = "0".repeat(64); }, "working-copy FLA must be byte-identical");
    await expectAuthoringAuditFailure((report) => { report.capturedAuthoringFrame.sha256 = "0".repeat(64); }, "captured frame: sha256 does not match");
    await expectAuthoringAuditFailure((report) => { report.nativeMovie.width = 319; }, "nativeMovie.width must match migration runtime");
    await expectAuthoringAuditFailure((report) => { report.authoringAudit.schemaVersion = 2; }, "authoringAudit.schemaVersion must be 1");
    await expectAuthoringAuditFailure((report) => { report.authoringAudit.document.name = "tampered.fla"; }, "rawAuditSha256 does not match authoringAudit");
    await expectAuthoringAuditFailure((report) => { report.authoringAudit.recursiveLibraryTimelineAudit = false; }, "recursiveLibraryTimelineAudit must be true");
    await chmod(authoringFixture.workingCopyPath, 0o644);
    const writableWorkingCopy = await validateFixtureMigration();
    assert.equal(writableWorkingCopy.ok, false);
    assert.ok(writableWorkingCopy.errors.some((error) => error.includes("working-copy FLA is writable")), writableWorkingCopy.errors.join("\n"));
    await chmod(authoringFixture.workingCopyPath, 0o444);

    const legacyInlineAccepted = await validateFixtureMigration();
    assert.equal(legacyInlineAccepted.ok, false);
    assert.ok(
      legacyInlineAccepted.errors.some((error) => error.includes("accepted legacy-unbound inline data")),
      legacyInlineAccepted.errors.join("\n"),
    );
    const reviewExpectations = await deriveHumanReviewExpectations({
      projectRoot: temporaryRoot,
      workspace: destination,
      manifest,
    });
    const reviewInput = await buildHumanVisualReviewInput({
      projectRoot: temporaryRoot,
      workspace: destination,
      manifest,
      requirements: reviewExpectations.expectedRequirements,
      expectedRequirementIds: reviewExpectations.expectedRequirementIds,
    });
    const reviewInputDescriptor = await writeImmutableReviewArtifact({
      projectRoot: temporaryRoot,
      workspace: destination,
      kind: "input",
      value: reviewInput,
    });
    const humanRecord = buildHumanVisualReviewRecord({
      animationId: manifest.animationId,
      decision: "accepted",
      reviewer: {
        kind: "human",
        fullName: "Dr. Workbench Visual Reviewer",
        role: "Fixture visual evidence reviewer",
        organizationOrOwnerId: "workbench-fixture-human",
        contact: "workbench-human@example.test",
      },
      reviewedAt: "2026-07-22T09:00:00+08:00",
      reviewInput: reviewInputDescriptor,
      requirementIds: reviewExpectations.expectedRequirementIds,
      notes: "Every fixture frame diff and contact sheet was reviewed.",
    });
    const humanRecordDescriptor = await writeImmutableReviewArtifact({
      projectRoot: temporaryRoot,
      workspace: destination,
      kind: "human",
      value: humanRecord,
    });
    manifest.acceptance.humanVisualReview = {
      decision: "accepted",
      reviewer: humanRecord.reviewer.fullName,
      reviewedAt: humanRecord.reviewedAt,
      scope: humanRecord.scope,
      record: humanRecordDescriptor,
    };
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const ownerNotRequired = await validateFixtureMigration();
    assert.equal(ownerNotRequired.ok, false);
    assert.ok(
      ownerNotRequired.errors.some((error) => error.includes("acceptance.ownerReview.decision must be accepted")),
      ownerNotRequired.errors.join("\n"),
    );

    await writeFile(
      path.join(destination, "evidence", "behavior-qa.json"),
      `${JSON.stringify({schemaVersion: 1, status: "pass", evidenceType: "fixture-behavior-qa"}, null, 2)}\n`,
    );
    await writeFile(
      path.join(destination, "evidence", "product-qa.json"),
      `${JSON.stringify({schemaVersion: 1, status: "pass", evidenceType: "fixture-product-qa"}, null, 2)}\n`,
    );
    const ownerEvidence = await deriveOwnerReviewEvidence({
      projectRoot: temporaryRoot,
      workspace: destination,
      manifest,
    });
    const ownerRecord = buildOwnerReviewRecord({
      animationId: manifest.animationId,
      decision: "accepted",
      reviewer: {
        kind: "human",
        fullName: "Dr. Workbench Owner Reviewer",
        role: "Fixture owner",
        organizationOrOwnerId: "workbench-fixture-owner",
        contact: "workbench-owner@example.test",
        authority: "owner",
      },
      reviewedAt: "2026-07-22T10:00:00+08:00",
      reason: "I accept the complete hash-bound fixture evidence packet.",
      humanVisualReview: humanRecordDescriptor,
      ...ownerEvidence,
      knownExceptions: [],
      notes: "The complete fixture evidence packet was reviewed and accepted.",
    });
    const ownerRecordDescriptor = await writeImmutableReviewArtifact({
      projectRoot: temporaryRoot,
      workspace: destination,
      kind: "owner",
      value: ownerRecord,
    });
    manifest.acceptance.ownerReview = {
      decision: "accepted",
      reviewer: ownerRecord.reviewer.fullName,
      reviewedAt: ownerRecord.reviewedAt,
      reason: ownerRecord.reason,
      record: ownerRecordDescriptor,
    };
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const complete = await validateFixtureMigration();
    assert.equal(complete.ok, true, complete.errors.join("\n"));
    const staleReviewDescriptor = structuredClone(manifest);
    staleReviewDescriptor.acceptance.humanVisualReview.record.bytes += 1;
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(staleReviewDescriptor, null, 2)}\n`);
    const staleReview = await validateFixtureMigration();
    assert.equal(staleReview.ok, false);
    assert.ok(
      staleReview.errors.some((error) => error.includes("record descriptor bytes are stale")),
      staleReview.errors.join("\n"),
    );
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const projectRootEvidence = path.join(temporaryRoot, "project-root-frame.png");
    const projectRootEvidenceHash = await writeHashed(projectRootEvidence, png);
    const projectRootReference = path.relative(testProjectRoot, projectRootEvidence).split(path.sep).join("/");
    const originalKeyframes = await readFile(path.join(destination, "keyframes.csv"), "utf8");
    await writeFile(
      path.join(destination, "keyframes.csv"),
      originalKeyframes
        .replace("baseline/keyframes/frame-001.png", projectRootReference)
        .replace(keyframeHashes["baseline/keyframes/frame-001.png"], projectRootEvidenceHash),
    );
    const projectRootEvidenceResult = await validateFixtureMigration();
    assert.equal(projectRootEvidenceResult.ok, true, projectRootEvidenceResult.errors.join("\n"));
    await writeFile(path.join(destination, "keyframes.csv"), originalKeyframes);

    const externalAudio = path.join(temporaryRoot, "host-triggered.mp3");
    const externalAudioHash = await writeHashed(externalAudio, "fixture audio bytes");
    const emptyAudioInventory = await readFile(path.join(destination, "audio-inventory.csv"), "utf8");
    const validateCurrentInventory = async () => {
      const errors = [];
      await validateInventory({root: destination, manifest, errors});
      return {ok: errors.length === 0, errors};
    };
    const hostTriggeredAudio =
      "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms\n" +
      `host-track,en,${externalAudio},${externalAudioHash},,,host-user-activated,1000\n`;
    await writeFile(path.join(destination, "audio-inventory.csv"), hostTriggeredAudio);
    const hostTriggered = await validateCurrentInventory();
    assert.equal(hostTriggered.ok, true, hostTriggered.errors.join("\n"));
    await writeFile(path.join(destination, "audio-inventory.csv"), hostTriggeredAudio.replace("host-track,en", "host-track,und"));
    const undeterminedLanguageAudio = await validateCurrentInventory();
    assert.equal(undeterminedLanguageAudio.ok, true, undeterminedLanguageAudio.errors.join("\n"));
    await writeFile(path.join(destination, "audio-inventory.csv"), hostTriggeredAudio.replace(",,,host-user-activated,1000", ",1,,host-user-activated,1000"));
    const falseFrameCue = await validateCurrentInventory();
    assert.equal(falseFrameCue.ok, false);
    assert.ok(falseFrameCue.errors.some((error) => error.includes("start_frame must be blank when start_semantics is host-user-activated")));
    await writeFile(path.join(destination, "audio-inventory.csv"), hostTriggeredAudio.replace(",,,host-user-activated,1000", ",,root,host-user-activated,1000"));
    const falseDomainCue = await validateCurrentInventory();
    assert.equal(falseDomainCue.ok, false);
    assert.ok(falseDomainCue.errors.some((error) => error.includes("start_frame_domain_id must be blank when start_semantics is host-user-activated")));

    const timelineAudio = hostTriggeredAudio.replace(",,,host-user-activated,1000", ",1,root,timeline-frame,1000");
    await writeFile(path.join(destination, "audio-inventory.csv"), timelineAudio);
    const validTimelineCue = await validateCurrentInventory();
    assert.equal(validTimelineCue.ok, true, validTimelineCue.errors.join("\n"));
    await writeFile(path.join(destination, "audio-inventory.csv"), timelineAudio.replace(",1,root,timeline-frame", ",1,,timeline-frame"));
    const missingTimelineDomain = await validateCurrentInventory();
    assert.equal(missingTimelineDomain.ok, false);
    assert.ok(missingTimelineDomain.errors.some((error) => error.includes("start_frame_domain_id must identify a declared frame domain")));
    await writeFile(path.join(destination, "audio-inventory.csv"), emptyAudioInventory);

    manifest.implementation.testFile = path.join(temporaryRoot, "lib", "missing.test.mjs");
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const missingCode = await validateFixtureMigration();
    assert.equal(missingCode.ok, false);
    assert.ok(missingCode.errors.some((error) => error.includes("implementation.testFile does not exist")));
    manifest.implementation.testFile = implementationFiles.test;
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const coveragePath = path.join(destination, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    await writeFile(coveragePath, `${JSON.stringify({ ...coverage, combinations: coverage.combinations.slice(0, 1) }, null, 2)}\n`);
    const missingLanguageCoverage = await validateFixtureMigration();
    assert.equal(missingLanguageCoverage.ok, false);
    assert.ok(missingLanguageCoverage.errors.some((error) => error.includes("missing scenario/language combination default/es")));
    await writeFile(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);

    const failedCapturePath = path.join(destination, coverage.combinations[0].captureManifest);
    const failedCapture = JSON.parse(await readFile(failedCapturePath, "utf8"));
    failedCapture.consoleErrors = ["fixture console failure"];
    await writeFile(failedCapturePath, `${JSON.stringify(failedCapture, null, 2)}\n`);
    coverage.combinations[0].captureManifestSha256 = digest(`${JSON.stringify(failedCapture, null, 2)}\n`);
    await writeFile(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
    const failedCaptureResult = await validateFixtureMigration();
    assert.equal(failedCaptureResult.ok, false);
    assert.ok(failedCaptureResult.errors.some((error) => error.includes("consoleErrors must be an empty array")));
    failedCapture.consoleErrors = [];
    await writeFile(failedCapturePath, `${JSON.stringify(failedCapture, null, 2)}\n`);
    coverage.combinations[0].captureManifestSha256 = digest(`${JSON.stringify(failedCapture, null, 2)}\n`);
    await writeFile(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);

    const fakePng = "this file merely has a .png extension";
    await writeFile(path.join(destination, "baseline/keyframes/frame-001.png"), fakePng);
    const csvWithFakeHash = (await readFile(path.join(destination, "keyframes.csv"), "utf8")).replace(
      keyframeHashes["baseline/keyframes/frame-001.png"],
      digest(fakePng),
    );
    await writeFile(path.join(destination, "keyframes.csv"), csvWithFakeHash);
    const fakePngResult = await validateFixtureMigration();
    assert.equal(fakePngResult.ok, false);
    assert.ok(fakePngResult.errors.some((error) => error.includes("is not a decodable PNG")), fakePngResult.errors.join("\n"));

    await assert.rejects(
      scaffoldMigration({ id: "Conversion_Test", output: temporaryRoot }),
      /already exists/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("capture arguments preserve animation, frame domain, scenario, language, seed, and require reporting", async () => {
  const entryStateSha256 = "a".repeat(64);
  const options = parseCaptureArguments([
    "--id", "course-g04-l01-ir-001",
    "--url", "http://127.0.0.1:3000/animations/test?existing=1",
    "--frames", "1,12",
    "--output", "evidence",
    "--frame-domain", "sprite-58",
    "--requirement-id", "req-natural-entry-sprite-58-en",
    "--trace", "natural-entry-sprite-58-en",
    "--entry-state-sha256", entryStateSha256,
    "--scenario", "wrong-answer",
    "--lang", "es",
    "--seed", "42",
  ]);
  assert.equal(options.id, "course-g04-l01-ir-001");
  assert.equal(options.selector, '[data-capture-stage="true"]');
  await assert.rejects(
    captureKeyframes({...options, id: undefined}, {browserType: {}}),
    /id must be a stable non-empty animation identifier/,
  );
  const url = buildCaptureUrl(options, 12);
  assert.equal(url.searchParams.get("frame"), "12");
  assert.equal(url.searchParams.get("frameDomain"), "sprite-58");
  assert.equal(url.searchParams.get("requirementId"), "req-natural-entry-sprite-58-en");
  assert.equal(url.searchParams.get("trace"), "natural-entry-sprite-58-en");
  assert.equal(url.searchParams.get("entryStateSha256"), entryStateSha256);
  assert.equal(url.searchParams.get("scenario"), "wrong-answer");
  assert.equal(url.searchParams.get("lang"), "es");
  assert.equal(url.searchParams.get("seed"), "42");
  assert.equal(assertReportedCaptureIdentity("course-g04-l01-ir-001", "course-g04-l01-ir-001", "data-animation-id", ".stage"), "course-g04-l01-ir-001");
  assert.equal(assertReportedFrame("12", 12, ".stage"), 12);
  assert.equal(assertReportedFrameDomain("sprite-58", "sprite-58", ".stage"), "sprite-58");
  assert.equal(assertReportedCaptureIdentity("req-natural-entry-sprite-58-en", "req-natural-entry-sprite-58-en", "data-flash-requirement-id", ".stage"), "req-natural-entry-sprite-58-en");
  assert.equal(assertReportedCaptureIdentity("natural-entry-sprite-58-en", "natural-entry-sprite-58-en", "data-flash-trace-id", ".stage"), "natural-entry-sprite-58-en");
  assert.equal(assertReportedCaptureIdentity(entryStateSha256, entryStateSha256, "data-flash-entry-state-sha256", ".stage"), entryStateSha256);
  assert.deepEqual(assertReportedRuntimeContext(
    { scenario: "wrong-answer", language: "es", seed: "42", flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42" },
    { scenario: "wrong-answer", language: "es", seed: "42" },
    ".stage",
  ), { scenario: "wrong-answer", language: "es", seed: "42", flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42", flashContextIdentityComplete: true });
  assert.throws(() => assertReportedFrame(null, 12, ".stage"), /missing mandatory data-flash-frame/);
  assert.throws(() => assertReportedCaptureIdentity("wrong-id", "course-g04-l01-ir-001", "data-animation-id", ".stage"), /Requested data-animation-id course-g04-l01-ir-001.*reports wrong-id/);
  assert.throws(() => assertReportedFrame("11", 12, ".stage"), /reports frame 11/);
  assert.throws(() => assertReportedFrameDomain(null, "sprite-58", ".stage"), /missing mandatory data-flash-frame-domain/);
  assert.throws(() => assertReportedFrameDomain("root", "sprite-58", ".stage"), /reports domain root/);
  assert.throws(() => assertReportedCaptureIdentity(null, "req", "data-flash-requirement-id", ".stage"), /missing mandatory data-flash-requirement-id/);
  assert.throws(() => assertReportedCaptureIdentity(null, "trace", "data-flash-trace-id", ".stage"), /missing mandatory data-flash-trace-id/);
  assert.throws(() => assertReportedCaptureIdentity("wrong", "trace", "data-flash-trace-id", ".stage"), /reports wrong/);
  assert.throws(() => assertReportedRuntimeContext(
    { scenario: null, language: "es", seed: "42", flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42" },
    { scenario: "wrong-answer", language: "es", seed: "42" },
    ".stage",
  ), /missing mandatory data-runtime-scenario/);
  assert.throws(() => assertReportedRuntimeContext(
    { scenario: "default", language: "es", seed: "42", flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42" },
    { scenario: "wrong-answer", language: "es", seed: "42" },
    ".stage",
  ), /Requested data-runtime-scenario wrong-answer.*reports default/);
  assert.throws(() => assertReportedRuntimeContext(
    { scenario: "wrong-answer", language: null, seed: "42", flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42" },
    { scenario: "wrong-answer", language: "es", seed: "42" },
    ".stage",
  ), /missing mandatory data-runtime-language/);
  assert.throws(() => assertReportedRuntimeContext(
    { scenario: "wrong-answer", language: "en", seed: "42", flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42" },
    { scenario: "wrong-answer", language: "es", seed: "42" },
    ".stage",
  ), /Requested data-runtime-language es.*reports en/);
  assert.throws(() => assertReportedRuntimeContext(
    { scenario: "wrong-answer", language: "es", seed: null, flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42" },
    { scenario: "wrong-answer", language: "es", seed: "42" },
    ".stage",
  ), /missing mandatory data-runtime-seed/);
  assert.throws(() => assertReportedRuntimeContext(
    { scenario: "wrong-answer", language: "es", seed: "0", flashScenario: "wrong-answer", flashLanguage: "es", flashSeed: "42" },
    { scenario: "wrong-answer", language: "es", seed: "42" },
    ".stage",
  ), /Requested data-runtime-seed 42.*reports 0/);
});

test("capture re-reads migration/tool provenance and rejects implementation, projection, script, or package drift after a screenshot", async (t) => {
  const animationId = "capture-freshness-fixture";
  const entryStateSha256 = "c".repeat(64);
  for (const driftKind of ["implementation-pointer", "catalog-projection", "generator-script", "playwright-package"]) {
    await t.test(driftKind, async () => {
      const projectRoot = await mkdtemp(path.join(os.tmpdir(), `capture-freshness-${driftKind}-`));
      t.after(() => rm(projectRoot, {recursive: true, force: true}));
      const workspace = path.join(projectRoot, "migrations", animationId);
      const output = path.join(workspace, "evidence", "capture");
      const manifestPath = path.join(workspace, "migration.json");
      const componentPath = "packages/demos/src/modules/capture-freshness-fixture.tsx";
      const alternateComponentPath = "packages/demos/src/modules/capture-freshness-fixture-v2.tsx";
      const routePath = "apps/web/app/[locale]/animations/[animationId]/page.tsx";
      const timelinePath = "packages/demos/src/timelines/capture-freshness-fixture.ts";
      for (const [relativePath, bytes] of [
        [componentPath, "export default {version: 1};\n"],
        [alternateComponentPath, "export default {version: 2};\n"],
        [routePath, "export default true;\n"],
        [timelinePath, "export const frame = 1;\n"],
      ]) await writeHashed(path.join(projectRoot, relativePath), bytes);
      const migration = {
        animationId,
        source: {swf: {path: "COURSES/FIXTURE.swf"}},
        implementation: {
          component: componentPath,
          timelineModule: timelinePath,
          routeFile: routePath,
          registryModule: "./modules/capture-freshness-fixture",
        },
      };
      await mkdir(workspace, {recursive: true});
      await writeFile(manifestPath, `${JSON.stringify(migration, null, 2)}\n`);
      const catalogPath = path.join(projectRoot, "catalog", "animations.json");
      await mkdir(path.dirname(catalogPath), {recursive: true});
      await writeFile(catalogPath, `${JSON.stringify({
        schemaVersion: 1,
        animations: [{
          animationId,
          source: {path: "COURSES/FIXTURE.swf", swf: {stage: {width: 32, height: 24}, fps: 12, frameCount: 1}},
        }],
      }, null, 2)}\n`);

      let drifted = false;
      const snapshot = {
        target: {
          tagName: "DIV",
          captureStage: "true",
          renderState: "ready",
          animationId,
          frame: "1",
          frameDomain: "root",
          rootFrame: "1",
          requirementId: "req-root-en",
          traceId: "root-en",
          entryStateSha256,
          scenario: "default",
          language: "en",
          seed: "0",
          flashScenario: "default",
          flashLanguage: "en",
          flashSeed: "0",
          visible: true,
        },
        visual: {
          tagName: "SVG",
          renderVisual: "true",
          renderState: "ready",
          animationId,
          frame: "1",
          frameDomain: "root",
          rootFrame: "1",
          requirementId: "req-root-en",
          traceId: "root-en",
          entryStateSha256,
          scenario: "default",
          language: "en",
          seed: "0",
          flashScenario: "default",
          flashLanguage: "en",
          flashSeed: "0",
          visible: true,
        },
      };
      const targetLocator = {
        first() { return this; },
        waitFor: async () => undefined,
        evaluate: async () => snapshot,
        screenshot: async ({path: screenshotPath}) => {
          await writeFile(screenshotPath, solidPng(32, 24));
          if (drifted) return;
          drifted = true;
          if (driftKind === "implementation-pointer") {
            const changed = JSON.parse(await readFile(manifestPath, "utf8"));
            changed.implementation.component = alternateComponentPath;
            await writeFile(manifestPath, `${JSON.stringify(changed, null, 2)}\n`);
          } else if (driftKind === "catalog-projection") {
            const changed = JSON.parse(await readFile(catalogPath, "utf8"));
            changed.animations[0].source.path = "COURSES/FIXTURE-REVISED.swf";
            await writeFile(catalogPath, `${JSON.stringify(changed, null, 2)}\n`);
          }
        },
      };
      const failedDomainLocator = {
        first() { return this; },
        waitFor: async () => new Promise(() => {}),
        getAttribute: async () => null,
      };
      const page = {
        on: () => undefined,
        goto: async () => undefined,
        addStyleTag: async () => undefined,
        evaluate: async () => undefined,
        locator: (selector) => selector === "[data-runtime-domain-error]" ? failedDomainLocator : targetLocator,
        waitForFunction: async () => ({jsonValue: async () => "ready"}),
      };
      const browserType = {
        launch: async () => ({
          newContext: async () => ({newPage: async () => page}),
          version: () => "Chromium fixture 1",
          close: async () => undefined,
        }),
      };
      const options = parseCaptureArguments([
        "--id", animationId,
        "--project-root", projectRoot,
        "--url", `http://127.0.0.1:3213/animations/${animationId}`,
        "--frames", "1",
        "--output", output,
        "--frame-domain", "root",
        "--requirement-id", "req-root-en",
        "--trace", "root-en",
        "--entry-state-sha256", entryStateSha256,
        "--scenario", "default",
        "--lang", "en",
        "--seed", "0",
        "--width", "32",
        "--height", "24",
      ]);
      let generatorReads = 0;
      let collectGeneratorProvenance = driftKind === "generator-script" || driftKind === "playwright-package"
        ? async () => ({
            schemaVersion: 1,
            script: {
              path: "scripts/capture-animation-keyframes.mjs",
              sha256: (
                driftKind === "generator-script" && generatorReads > 0 ? "e" : "d"
              ).repeat(64),
            },
            playwright: {
              package: "@playwright/test",
              version: "1.61.1",
              packageJsonPath: "node_modules/@playwright/test/package.json",
              packageJsonSha256: (
                driftKind === "playwright-package" && generatorReads > 0 ? "a" : "f"
              ).repeat(64),
            },
          })
        : undefined;
      if (collectGeneratorProvenance) {
        const collect = collectGeneratorProvenance;
        collectGeneratorProvenance = async () => {
          const result = await collect();
          generatorReads += 1;
          return result;
        };
      }
      await assert.rejects(
        captureKeyframes(options, {
          browserType,
          ...(collectGeneratorProvenance ? {collectGeneratorProvenance} : {}),
        }),
        driftKind === "generator-script" || driftKind === "playwright-package"
          ? /Capture generator script or Playwright package changed during capture/
          : /Render-affecting implementation artifacts changed during capture/,
      );
      const failedCapture = JSON.parse(await readFile(path.join(output, "capture-manifest.json"), "utf8"));
      assert.equal(failedCapture.schemaVersion, 4);
      assert.equal(failedCapture.status, "failed");
      assert.match(
        failedCapture.error,
        driftKind === "generator-script" || driftKind === "playwright-package"
          ? /Capture generator script or Playwright package changed during capture/
          : /implementationArtifactClosure is stale/,
      );
    });
  }
});

test("renderer-ready capture contract rejects loading, errors, missing visuals, and stale inner frames", () => {
  const requested = {
    animationId: "course-g03-l06-ti-001",
    frame: 14,
    frameDomain: "sprite-21",
    rootFrame: 6,
    requirementId: "req-natural-sprite-21-en",
    traceId: "natural-sprite-21-en",
    entryStateSha256: "b".repeat(64),
    scenario: "sound-from-seed",
    language: "en",
    seed: "17",
  };
  const identity = {
    animationId: requested.animationId,
    frame: String(requested.frame),
    frameDomain: requested.frameDomain,
    rootFrame: String(requested.rootFrame),
    requirementId: requested.requirementId,
    traceId: requested.traceId,
    entryStateSha256: requested.entryStateSha256,
    scenario: requested.scenario,
    language: requested.language,
    seed: requested.seed,
    flashScenario: requested.scenario,
    flashLanguage: requested.language,
    flashSeed: requested.seed,
  };
  const ready = {
    target: {
      ...identity,
      captureStage: "true",
      renderState: "ready",
    },
    visual: {
      ...identity,
      tagName: "CANVAS",
      renderVisual: "true",
      renderState: "ready",
      visible: true,
    },
  };
  const accepted = assertRendererReadyContract(ready, requested, ".faithful-stage-wrap");
  assert.equal(accepted.target.frame, 14);
  assert.equal(accepted.visual.tagName, "canvas");

  assert.throws(
    () => assertRendererReadyContract({
      ...ready,
      target: {...ready.target, renderState: "loading", frame: null},
    }, requested, ".faithful-stage-wrap"),
    /renderer is not ready.*loading/,
  );
  assert.throws(
    () => assertRendererReadyContract({
      ...ready,
      target: {...ready.target, renderState: "error", frame: null},
    }, requested, ".faithful-stage-wrap"),
    /renderer is not ready.*error/,
  );
  assert.throws(
    () => assertRendererReadyContract({...ready, visual: null}, requested, ".faithful-stage-wrap"),
    /missing a real visual target/,
  );
  assert.throws(
    () => assertRendererReadyContract({
      ...ready,
      visual: {...ready.visual, renderState: "loading", frame: null},
    }, requested, ".faithful-stage-wrap"),
    /renderer is not ready.*loading/,
  );
  assert.throws(
    () => assertRendererReadyContract({
      ...ready,
      visual: {...ready.visual, frame: "13"},
    }, requested, ".faithful-stage-wrap"),
    /Requested frame 14.*reports frame 13/,
  );
  assert.throws(
    () => assertRendererReadyContract({
      ...ready,
      visual: {...ready.visual, rootFrame: "5"},
    }, requested, ".faithful-stage-wrap"),
    /Requested root frame 6.*reports root frame 5/,
  );
  assert.throws(
    () => assertRendererReadyContract({
      ...ready,
      visual: {...ready.visual, scenario: "sound-1"},
    }, requested, ".faithful-stage-wrap"),
    /Requested data-runtime-scenario sound-from-seed.*reports sound-1/,
  );
  assert.throws(
    () => assertRendererReadyContract({
      ...ready,
      visual: {...ready.visual, flashScenario: null},
    }, requested, ".faithful-stage-wrap"),
    /missing mandatory data-flash-scenario/,
  );
});

test("reads valid SWF timeline headers and rejects extension-only impostors", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-header-"));
  try {
    const validPath = path.join(temporaryRoot, "valid.swf");
    const invalidPath = path.join(temporaryRoot, "invalid.swf");
    await writeFile(validPath, testSwf({ width: 640, height: 360, fps: 24, frameCount: 48, version: 9 }));
    await writeFile(invalidPath, "FWS is not enough to make this a SWF");
    const metadata = await readSwfHeader(validPath);
    assert.equal(metadata.swfSignature, "FWS");
    assert.equal(metadata.swfVersion, 9);
    assert.deepEqual(metadata.stage, { width: 640, height: 360 });
    assert.equal(metadata.fps, 24);
    assert.equal(metadata.frameCount, 48);
    assert.equal(metadata.durationMs, 2000);
    assert.equal(await readSwfHeader(invalidPath), null);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("pilot scaffolding dry-runs, creates, skips, and rejects conflicts idempotently", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-pilots-"));
  try {
    assert.equal(PILOT_MIGRATIONS.length, 16);
    assert.equal(new Set(PILOT_MIGRATIONS.map(({ id }) => id)).size, 16);
    assert.ok(PILOT_MIGRATIONS.some(({ id }) => id === "course-g03-l06-fq-002-review"));
    assert.ok(PILOT_MIGRATIONS.some(({ id }) => id === "shell-course-g04-l01-index-local"));

    const sourceRoot = path.join(temporaryRoot, "sources");
    const swf = path.join(sourceRoot, "pilot.swf");
    const fla = path.join(sourceRoot, "pilot.fla");
    await writeHashed(swf, testSwf({ frameCount: 2 }));
    await writeHashed(fla, "binary FLA fixture");
    const output = path.join(temporaryRoot, "migrations");
    const pilots = [{ id: "pilot-one", swf, fla }];

    const dryRun = await scaffoldPilotMigrations({ pilots, output, dryRun: true });
    assert.deepEqual(dryRun.map(({ action, id }) => ({ action, id })), [{ action: "create", id: "pilot-one" }]);
    await assert.rejects(stat(output), /ENOENT/);

    const created = await scaffoldPilotMigrations({ pilots, output });
    assert.equal(created[0].action, "create");
    const manifestPath = path.join(output, "pilot-one", "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifest.status, "preserved");
    assert.equal(manifest.source.pairedFlaStatus, "present");

    const skipped = await scaffoldPilotMigrations({ pilots, output });
    assert.equal(skipped[0].action, "skip");
    manifest.source.swfSha256 = "0".repeat(64);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(
      scaffoldPilotMigrations({ pilots, output, dryRun: true }),
      /existing workspace conflicts/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("computes normalized PNG RMSE and writes difference evidence", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-image-diff-"));
  try {
    const baseline = new PNG({ width: 2, height: 2 });
    const implementation = new PNG({ width: 2, height: 2 });
    baseline.data.fill(255);
    implementation.data.fill(255);
    implementation.data[0] = 0;
    implementation.data[1] = 0;
    implementation.data[2] = 0;

    const baselinePath = path.join(temporaryRoot, "baseline.png");
    const implementationPath = path.join(temporaryRoot, "implementation.png");
    const diffPath = path.join(temporaryRoot, "difference.png");
    const jsonPath = path.join(temporaryRoot, "difference.json");
    await writeFile(baselinePath, PNG.sync.write(baseline));
    await writeFile(implementationPath, PNG.sync.write(implementation));

    const result = await comparePngFiles(baselinePath, implementationPath, {
      diff: diffPath,
      json: jsonPath,
    });
    assert.equal(result.width, 2);
    assert.equal(result.height, 2);
    assert.equal(result.mismatchedPixels, 1);
    assert.ok(result.normalizedRmse > 0);
    assert.ok((await readFile(diffPath)).length > 0);
    assert.equal(JSON.parse(await readFile(jsonPath, "utf8")).mismatchedPixels, 1);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
