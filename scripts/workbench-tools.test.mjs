import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";

import { comparePngFiles } from "./compare-images.mjs";
import { assertReportedFrame, buildCaptureUrl, parseArguments as parseCaptureArguments } from "./capture-animation-keyframes.mjs";
import { readSwfHeader, scaffoldMigration } from "./create-flash-migration.mjs";
import { PILOT_MIGRATIONS, scaffoldPilotMigrations } from "./scaffold-pilot-migrations.mjs";
import { validateMigration } from "../skills/flash-to-js/scripts/validate_migration.mjs";

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

    const draft = await validateMigration(destination, { allowDraft: true });
    assert.equal(draft.ok, true, draft.errors.join("\n"));
    const strict = await validateMigration(destination);
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
      routeFile: implementationFiles.route,
      component: implementationFiles.component,
      registryModule: "./modules/conversion-1-2",
      timelineModule: implementationFiles.timeline,
      testFile: implementationFiles.test,
    });
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
    await writeFile(
      path.join(destination, "ACCEPTANCE_CHECKLIST.md"),
      (await readFile(path.join(destination, "ACCEPTANCE_CHECKLIST.md"), "utf8")).replaceAll("- [ ]", "- [x]"),
    );
    const png = solidPng(320, 240);
    const keyframeHashes = {};
    for (const relative of [
      "baseline/keyframes/frame-001.png",
      "evidence/implementation/frame-001.png",
      "evidence/diffs/frame-001.png",
    ]) keyframeHashes[relative] = await writeHashed(path.join(destination, relative), png);
    await writeFile(
      path.join(destination, "keyframes.csv"),
      "frame,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes\n" +
      `1,0,default,en,static,initial state,load,baseline/keyframes/frame-001.png,${keyframeHashes["baseline/keyframes/frame-001.png"]},evidence/implementation/frame-001.png,${keyframeHashes["evidence/implementation/frame-001.png"]},evidence/diffs/frame-001.png,${keyframeHashes["evidence/diffs/frame-001.png"]},0.01,pass,pass,SWF,test reviewer,none\n`,
    );

    const combinations = [];
    for (const language of ["en", "es"]) {
      const captureDirectory = path.join(destination, "evidence", "full-frame", "default", language);
      const captured = [];
      for (const frame of [1]) {
        const filename = `frame-${String(frame).padStart(3, "0")}.png`;
        const checksum = await writeHashed(path.join(captureDirectory, filename), png);
        captured.push({ frame, reportedFrame: frame, scenario: "default", language, seed: "0", file: filename, sha256: checksum, width: 320, height: 240 });
      }
      const capture = {
        schemaVersion: 2,
        status: "complete",
        scenario: "default",
        language,
        seed: "0",
        selector: ".faithful-stage-wrap",
        reportedFrameAttribute: "data-flash-frame",
        viewport: { width: 320, height: 240, deviceScaleFactor: 1 },
        captured,
        consoleErrors: [],
        failedRequests: [],
        httpErrors: [],
        unexpectedRequests: [],
      };
      const captureRelative = path.relative(destination, path.join(captureDirectory, "capture-manifest.json"));
      const captureSha256 = await writeHashed(path.join(destination, captureRelative), `${JSON.stringify(capture, null, 2)}\n`);
      const metrics = { scenario: "default", language, seed: "0", frames: [{ frame: 1, kind: "static", normalizedRmse: 0.01, result: "pass" }] };
      const metricsRelative = path.relative(destination, path.join(captureDirectory, "metrics.json"));
      const metricsSha256 = await writeHashed(path.join(destination, metricsRelative), `${JSON.stringify(metrics, null, 2)}\n`);
      combinations.push({
        scenario: "default",
        language,
        seed: "0",
        firstFrame: 1,
        lastFrame: 1,
        capturedFrameCount: 1,
        missingFrames: [],
        captureManifest: captureRelative,
        captureManifestSha256: captureSha256,
        metricsFile: metricsRelative,
        metricsSha256,
      });
    }
    await writeFile(path.join(destination, "evidence", "full-frame-coverage.json"), `${JSON.stringify({
      schemaVersion: 1,
      animationId: "Conversion_Test",
      frameCount: 1,
      languages: ["en", "es"],
      scenarios: ["default"],
      combinations,
    }, null, 2)}\n`);
    const complete = await validateMigration(destination);
    assert.equal(complete.ok, true, complete.errors.join("\n"));

    manifest.implementation.testFile = path.join(temporaryRoot, "lib", "missing.test.mjs");
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const missingCode = await validateMigration(destination);
    assert.equal(missingCode.ok, false);
    assert.ok(missingCode.errors.some((error) => error.includes("implementation.testFile does not exist")));
    manifest.implementation.testFile = implementationFiles.test;
    await writeFile(path.join(destination, "migration.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const coveragePath = path.join(destination, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    await writeFile(coveragePath, `${JSON.stringify({ ...coverage, combinations: coverage.combinations.slice(0, 1) }, null, 2)}\n`);
    const missingLanguageCoverage = await validateMigration(destination);
    assert.equal(missingLanguageCoverage.ok, false);
    assert.ok(missingLanguageCoverage.errors.some((error) => error.includes("missing scenario/language combination default/es")));
    await writeFile(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);

    const failedCapturePath = path.join(destination, coverage.combinations[0].captureManifest);
    const failedCapture = JSON.parse(await readFile(failedCapturePath, "utf8"));
    failedCapture.consoleErrors = ["fixture console failure"];
    await writeFile(failedCapturePath, `${JSON.stringify(failedCapture, null, 2)}\n`);
    coverage.combinations[0].captureManifestSha256 = digest(`${JSON.stringify(failedCapture, null, 2)}\n`);
    await writeFile(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
    const failedCaptureResult = await validateMigration(destination);
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
    const fakePngResult = await validateMigration(destination);
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

test("capture arguments preserve scenario, language, seed, and require frame reporting", () => {
  const options = parseCaptureArguments([
    "--url", "http://127.0.0.1:3000/animations/test?existing=1",
    "--frames", "1,12",
    "--output", "evidence",
    "--scenario", "wrong-answer",
    "--lang", "es",
    "--seed", "42",
  ]);
  const url = buildCaptureUrl(options, 12);
  assert.equal(url.searchParams.get("frame"), "12");
  assert.equal(url.searchParams.get("scenario"), "wrong-answer");
  assert.equal(url.searchParams.get("lang"), "es");
  assert.equal(url.searchParams.get("seed"), "42");
  assert.equal(assertReportedFrame("12", 12, ".stage"), 12);
  assert.throws(() => assertReportedFrame(null, 12, ".stage"), /missing mandatory data-flash-frame/);
  assert.throws(() => assertReportedFrame("11", 12, ".stage"), /reports frame 11/);
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
