import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";
import {
  compareFrameDirectories,
  parseArguments,
  parseFrameSelection,
  validateSequentialFrameStepSemantics,
} from "./compare-frame-directories.mjs";
import {
  IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM,
  IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION,
  implementationArtifactRowsSha256,
} from "./implementation-artifact-closure.mjs";
import {testCaptureGeneratorProvenance} from "./test-fixtures/implementation-capture.mjs";

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function writeSolidPng(destination, { width = 2, height = 1, red = 0, green = red, blue = red } = {}) {
  const image = new PNG({ width, height });
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = 255;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, PNG.sync.write(image));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("parses variable-padded frame selections and directory-comparison options", () => {
  assert.deepEqual([...parseFrameSelection("1,3-5,5,12")], [1, 3, 4, 5, 12]);
  assert.throws(() => parseFrameSelection("4-2"), /Invalid transition frame range/);
  const options = parseArguments([
    "--id", "formula-one",
    "--baseline", "baseline",
    "--implementation", "implementation",
    "--scenario", "default",
    "--lang", "es",
    "--transition-frames", "2-3",
  ]);
  assert.equal(options.animationId, "formula-one");
  assert.equal(options.language, "es");
  assert.deepEqual([...options.transitionFrames], [2, 3]);
});

test("parses complete frame-domain identity and rejects partial or invalid identity", () => {
  const entryStateSha256 = "a".repeat(64);
  const options = parseArguments([
    "--id", "course-one",
    "--baseline", "baseline",
    "--implementation", "implementation",
    "--scenario", "learn",
    "--lang", "es",
    "--seed", "17",
    "--requirement-id", "sprite-42-learn-es",
    "--frame-domain", "sprite-42",
    "--trace", "learn-natural-trace",
    "--entry-state-sha256", entryStateSha256,
    "--baseline-authority", "original-runtime-natural-trace",
    "--baseline-manifest", "baseline-manifest.json",
    "--implementation-manifest", "capture-manifest.json",
  ]);
  assert.equal(options.requirementId, "sprite-42-learn-es");
  assert.equal(options.frameDomainId, "sprite-42");
  assert.equal(options.traceId, "learn-natural-trace");
  assert.equal(options.entryStateSha256, entryStateSha256);
  assert.equal(options.baselineAuthority, "original-runtime-natural-trace");

  const frameStep = parseArguments([
    "--id", "course-one",
    "--baseline", "baseline",
    "--implementation", "implementation",
    "--requirement-id", "root-en",
    "--frame-domain", "root",
    "--trace", "root-frame-step",
    "--entry-state-sha256", entryStateSha256,
    "--baseline-authority", "original-runtime-frame-step",
    "--baseline-manifest", "baseline-manifest.json",
    "--implementation-manifest", "capture-manifest.json",
  ]);
  assert.equal(frameStep.baselineAuthority, "original-runtime-frame-step");

  assert.throws(() => parseArguments([
    "--id", "course-one",
    "--baseline", "baseline",
    "--implementation", "implementation",
    "--requirement-id", "only-one-field",
  ]), /must be supplied together/);
  assert.throws(() => parseArguments([
    "--id", "course-one",
    "--baseline", "baseline",
    "--implementation", "implementation",
    "--requirement-id", "sprite-42-learn-en",
    "--frame-domain", "sprite-42",
    "--trace", "learn-natural-trace",
    "--entry-state-sha256", "ABC",
    "--baseline-authority", "original-runtime-natural-trace",
    "--baseline-manifest", "baseline-manifest.json",
    "--implementation-manifest", "capture-manifest.json",
  ]), /lowercase 64-character SHA-256/);
  assert.throws(() => parseArguments([
    "--id", "course-one",
    "--baseline", "baseline",
    "--implementation", "implementation",
    "--requirement-id", "sprite-42-learn-en",
    "--frame-domain", "sprite-42",
    "--trace", "learn-natural-trace",
    "--entry-state-sha256", entryStateSha256,
    "--baseline-authority", "ruffle",
    "--baseline-manifest", "baseline-manifest.json",
    "--implementation-manifest", "capture-manifest.json",
  ]), /baseline-authority is invalid/);
});

test("frame-step authority requires root-entry deterministic sequential-step semantics and never an interactive scenario", () => {
  const valid = {
    baselineAuthority: "original-runtime-frame-step",
    frameDomainId: "root",
    frameDomainKind: "root",
    scenarioKind: "linear",
    capture: {
      traceEntryMode: "original-runtime-root-entry",
      frameCaptureMode: "deterministic-sequential-step",
      entryTrace: [{ order: 1, action: "Enter the original root timeline", resultingFrameDomainId: "root" }],
    },
  };
  assert.equal(validateSequentialFrameStepSemantics(valid), true);
  assert.throws(() => validateSequentialFrameStepSemantics({ ...valid, frameDomainKind: "nested" }), /only for a root frame domain/);
  assert.throws(() => validateSequentialFrameStepSemantics({ ...valid, scenarioKind: "interactive" }), /cannot satisfy an interactive scenario/);
  assert.throws(() => validateSequentialFrameStepSemantics({ ...valid, capture: { ...valid.capture, frameCaptureMode: "deterministic-direct-seek" } }), /deterministic-sequential-step/);
  assert.throws(() => validateSequentialFrameStepSemantics({ ...valid, capture: { ...valid.capture, entryTrace: [] } }), /must document root entry/);
});

test("compares complete frame directories, supports different zero padding, and writes archive plus tracked evidence", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-full-frame-compare-"));
  try {
    const baselineDirectory = path.join(temporaryRoot, "baseline");
    const implementationDirectory = path.join(temporaryRoot, "implementation");
    const migrationDirectory = path.join(temporaryRoot, "migrations", "formula-one");
    const artifactsRoot = path.join(temporaryRoot, "artifacts", "full-frame");
    const shades = [0, 0, 0, 0];
    const implementationShades = [0, 13, 20, 26];
    for (let index = 0; index < shades.length; index += 1) {
      const frame = index + 1;
      await writeSolidPng(path.join(baselineDirectory, `frame-${String(frame).padStart(4, "0")}.png`), { red: shades[index] });
      await writeSolidPng(path.join(implementationDirectory, `frame-${String(frame).padStart(3, "0")}.png`), { red: implementationShades[index] });
    }

    const result = await compareFrameDirectories({
      animationId: "formula-one",
      baselineDirectory,
      implementationDirectory,
      migrationDirectory,
      artifactsRoot,
      projectDirectory: temporaryRoot,
      expectedFrameCount: 4,
      stage: { width: 2, height: 1 },
      transitionFrames: new Set([2, 3]),
      generatedAt: "2026-07-21T00:00:00.000Z",
    });

    assert.ok(result.diffDirectory.startsWith(artifactsRoot));
    assert.ok(result.evidenceFile.startsWith(path.join(migrationDirectory, "evidence")));
    const evidence = JSON.parse(await readFile(result.evidenceFile, "utf8"));
    assert.equal(evidence.frames.length, 4);
    assert.deepEqual(evidence.frames.map(({ frame }) => frame), [1, 2, 3, 4]);
    assert.deepEqual(evidence.frames.map(({ kind }) => kind), ["static", "transition", "transition", "static"]);
    assert.equal(evidence.frames[0].normalizedRmse, 0);
    assert.equal(evidence.frames[1].normalizedRmse, 13 / 255);
    assert.equal(evidence.summary.normalizedRmse.min, 0);
    assert.equal(evidence.summary.normalizedRmse.max, 26 / 255);
    assert.equal(evidence.summary.normalizedRmse.median, (13 / 255 + 20 / 255) / 2);
    assert.equal(evidence.summary.normalizedRmse.p95, 26 / 255);
    assert.equal(evidence.summary.atOrBelowStaticThreshold.count, 1);
    assert.equal(evidence.summary.atOrBelowTransitionThreshold.count, 3);
    assert.deepEqual(evidence.summary.outliers.aboveStaticThreshold, [2, 3, 4]);
    assert.deepEqual(evidence.summary.outliers.aboveTransitionThreshold, [4]);
    assert.deepEqual(evidence.summary.outliers.failingAssignedThreshold, [4]);
    assert.equal(evidence.summary.allAssignedThresholdsPass, false);
    assert.ok(evidence.frames.every(({ mismatchedPixels }) => Number.isInteger(mismatchedPixels)));
    assert.ok(evidence.frames.every(({ diffFile }) => diffFile.startsWith("artifacts/full-frame/")));
    for (const { diffFile, diffSha256 } of evidence.frames) {
      assert.match(diffSha256, /^[a-f0-9]{64}$/);
      assert.equal(await exists(path.join(temporaryRoot, diffFile)), true);
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("writes metrics v2 with exact requirement, frame-domain, trace, state, and baseline pairing", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-domain-frame-compare-"));
  try {
    const baselineDirectory = path.join(temporaryRoot, "baseline");
    const implementationDirectory = path.join(temporaryRoot, "implementation");
    const migrationDirectory = path.join(temporaryRoot, "migrations", "course-one");
    const artifactsRoot = path.join(temporaryRoot, "artifacts", "full-frame");
    for (let frame = 1; frame <= 3; frame += 1) {
      await writeSolidPng(path.join(baselineDirectory, `frame-${String(frame).padStart(4, "0")}.png`), { red: frame });
      await writeSolidPng(path.join(implementationDirectory, `frame-${String(frame).padStart(4, "0")}.png`), { red: frame });
    }
    const identity = {
      requirementId: "sprite-42-learn-es",
      frameDomainId: "sprite-42",
      traceId: "learn-natural-trace",
      entryStateSha256: "b".repeat(64),
      baselineAuthority: "original-runtime-natural-trace",
    };
    const baselineFrames = [];
    const implementationFrames = [];
    for (let frame = 1; frame <= 3; frame += 1) {
      const filename = `frame-${String(frame).padStart(4, "0")}.png`;
      const baselineBytes = await readFile(path.join(baselineDirectory, filename));
      const implementationBytes = await readFile(path.join(implementationDirectory, filename));
      const boundIdentity = {
        animationId: "course-one",
        frame,
        requirementId: identity.requirementId,
        frameDomainId: identity.frameDomainId,
        traceId: identity.traceId,
        entryStateSha256: identity.entryStateSha256,
        file: filename,
      };
      baselineFrames.push({ ...boundIdentity, sha256: sha256(baselineBytes) });
      implementationFrames.push({
        ...boundIdentity,
        reportedRenderState: "ready",
        visualTarget: {
          tagName: "canvas",
          reportedRenderState: "ready",
          animationId: "course-one",
          reportedFrame: frame,
          requirementId: identity.requirementId,
          frameDomainId: identity.frameDomainId,
          traceId: identity.traceId,
          entryStateSha256: identity.entryStateSha256,
          scenario: "learn",
          language: "es",
          seed: "17",
        },
        sha256: sha256(implementationBytes),
      });
    }
    const baselineManifest = path.join(baselineDirectory, "baseline-manifest.json");
    const implementationManifest = path.join(implementationDirectory, "capture-manifest.json");
    const closureArtifacts = [{
      path: "packages/demos/src/modules/course-one.tsx",
      bytes: 1,
      sha256: sha256("x"),
    }];
    const implementationArtifactClosure = {
      schemaVersion: IMPLEMENTATION_ARTIFACT_CLOSURE_SCHEMA_VERSION,
      algorithm: IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM,
      artifactCount: closureArtifacts.length,
      projectionCount: 0,
      totalBytes: 1,
      aggregateSha256: implementationArtifactRowsSha256(closureArtifacts, []),
      artifacts: closureArtifacts,
      projections: [],
    };
    await writeFile(baselineManifest, `${JSON.stringify({
      schemaVersion: 2,
      evidenceType: "original-runtime-frame-domain-baseline",
      status: "complete",
      animationId: "course-one",
      ...identity,
      scenario: "learn",
      language: "es",
      seed: "17",
      frames: baselineFrames,
    }, null, 2)}\n`);
    await writeFile(implementationManifest, `${JSON.stringify({
      schemaVersion: 4,
      status: "complete",
      sourceUrl: "http://127.0.0.1:3213/animations/course-one",
      generatorProvenance: testCaptureGeneratorProvenance(),
      implementationArtifactClosure,
      animationId: "course-one",
      requirementId: identity.requirementId,
      frameDomainId: identity.frameDomainId,
      traceId: identity.traceId,
      entryStateSha256: identity.entryStateSha256,
      scenario: "learn",
      language: "es",
      seed: "17",
      captureStageAttribute: "data-capture-stage",
      reportedRenderStateAttribute: "data-render-state",
      reportedVisualTargetAttribute: "data-render-visual",
      requiredRenderState: "ready",
      captured: implementationFrames,
    }, null, 2)}\n`);
    const result = await compareFrameDirectories({
      animationId: "course-one",
      baselineDirectory,
      implementationDirectory,
      migrationDirectory,
      artifactsRoot,
      projectDirectory: temporaryRoot,
      expectedFrameCount: 3,
      stage: { width: 2, height: 1 },
      scenario: "learn",
      language: "es",
      seed: "17",
      ...identity,
      baselineManifest,
      implementationManifest,
      generatedAt: "2026-07-21T00:00:00.000Z",
    });

    assert.equal(path.basename(result.evidenceFile), "full-frame-comparison-sprite-42-learn-es.json");
    const evidence = JSON.parse(await readFile(result.evidenceFile, "utf8"));
    assert.equal(evidence.schemaVersion, 2);
    assert.equal(evidence.status, "complete");
    assert.equal(evidence.requirementId, identity.requirementId);
    assert.equal(evidence.frameDomainId, identity.frameDomainId);
    assert.equal(evidence.traceId, identity.traceId);
    assert.equal(evidence.entryStateSha256, identity.entryStateSha256);
    assert.equal(evidence.baselineAuthority, identity.baselineAuthority);
    assert.equal(evidence.baselineFrameDomainId, identity.frameDomainId);
    assert.equal(evidence.baselineTraceId, identity.traceId);
    assert.equal(evidence.baselineEntryStateSha256, identity.entryStateSha256);
    assert.equal(evidence.baselineCaptureManifestSha256, sha256(await readFile(baselineManifest)));
    assert.equal(evidence.implementationCaptureManifestSha256, sha256(await readFile(implementationManifest)));
    assert.deepEqual(evidence.contract.requiredRange, { firstFrame: 1, lastFrame: 3 });
    assert.equal(evidence.summary.allAssignedThresholdsPass, true);
    assert.ok(evidence.frames.every((frame) => (
      frame.requirementId === identity.requirementId &&
      frame.frameDomainId === identity.frameDomainId &&
      frame.traceId === identity.traceId &&
      frame.entryStateSha256 === identity.entryStateSha256 &&
      frame.result === "pass"
    )));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("fails closed when direct comparison receives only part of a frame-domain identity", async () => {
  await assert.rejects(
    compareFrameDirectories({
      animationId: "course-one",
      baselineDirectory: "/does/not/matter",
      implementationDirectory: "/does/not/matter",
      migrationDirectory: "/does/not/matter",
      artifactsRoot: "/does/not/matter",
      expectedFrameCount: 1,
      stage: { width: 1, height: 1 },
      requirementId: "partial",
    }),
    /must be supplied together/,
  );
});

test("fails closed on a native-stage dimension mismatch before creating artifacts or evidence", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-full-frame-size-"));
  try {
    const baselineDirectory = path.join(temporaryRoot, "baseline");
    const implementationDirectory = path.join(temporaryRoot, "implementation");
    const migrationDirectory = path.join(temporaryRoot, "migrations", "formula-one");
    const artifactsRoot = path.join(temporaryRoot, "artifacts", "full-frame");
    await writeSolidPng(path.join(baselineDirectory, "frame-0001.png"));
    await writeSolidPng(path.join(implementationDirectory, "frame-001.png"), { width: 3 });

    await assert.rejects(
      compareFrameDirectories({
        animationId: "formula-one",
        baselineDirectory,
        implementationDirectory,
        migrationDirectory,
        artifactsRoot,
        projectDirectory: temporaryRoot,
        expectedFrameCount: 1,
        stage: { width: 2, height: 1 },
      }),
      /Implementation directory frame 1 is 3x1; expected native stage 2x1/,
    );
    assert.equal(await exists(artifactsRoot), false);
    assert.equal(await exists(path.join(migrationDirectory, "evidence")), false);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("rejects missing and duplicate numeric frame identities", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-full-frame-identity-"));
  try {
    const baselineDirectory = path.join(temporaryRoot, "baseline");
    const implementationDirectory = path.join(temporaryRoot, "implementation");
    const migrationDirectory = path.join(temporaryRoot, "migrations", "formula-one");
    const artifactsRoot = path.join(temporaryRoot, "artifacts", "full-frame");
    await writeSolidPng(path.join(baselineDirectory, "frame-0001.png"));
    await writeSolidPng(path.join(baselineDirectory, "frame-1.png"));
    await writeSolidPng(path.join(implementationDirectory, "frame-001.png"));

    await assert.rejects(
      compareFrameDirectories({
        animationId: "formula-one",
        baselineDirectory,
        implementationDirectory,
        migrationDirectory,
        artifactsRoot,
        projectDirectory: temporaryRoot,
        expectedFrameCount: 1,
        stage: { width: 2, height: 1 },
      }),
      /duplicate frame 1/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("rejects a gap even when the directory contains the expected number of PNGs", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "flash-full-frame-gap-"));
  try {
    const baselineDirectory = path.join(temporaryRoot, "baseline");
    const implementationDirectory = path.join(temporaryRoot, "implementation");
    const migrationDirectory = path.join(temporaryRoot, "migrations", "formula-one");
    const artifactsRoot = path.join(temporaryRoot, "artifacts", "full-frame");
    await writeSolidPng(path.join(baselineDirectory, "frame-0001.png"));
    await writeSolidPng(path.join(baselineDirectory, "frame-0003.png"));
    await writeSolidPng(path.join(implementationDirectory, "frame-001.png"));
    await writeSolidPng(path.join(implementationDirectory, "frame-002.png"));

    await assert.rejects(
      compareFrameDirectories({
        animationId: "formula-one",
        baselineDirectory,
        implementationDirectory,
        migrationDirectory,
        artifactsRoot,
        projectDirectory: temporaryRoot,
        expectedFrameCount: 2,
        stage: { width: 2, height: 1 },
      }),
      /Baseline directory is missing frame 2/,
    );
    assert.equal(await exists(artifactsRoot), false);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
