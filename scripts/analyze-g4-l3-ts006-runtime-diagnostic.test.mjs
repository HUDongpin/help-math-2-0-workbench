import assert from "node:assert/strict";
import test from "node:test";

import {
  inspectPngHeader,
  parseArguments,
  summarizeFrameTiming,
  validateCaptureManifest,
  validateDiagnosticBoundary,
} from "./analyze-g4-l3-ts006-runtime-diagnostic.mjs";

const sourceSha256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";

function intake() {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-manual-original-runtime-diagnostic-intake",
    status: "running-diagnostic-not-promotion-eligible",
    animationId: "course-g04-l03-ts-006",
    language: "en",
    source: {sha256: sourceSha256},
    process: {commandLineSwfArgumentUsed: false, guiFileOpenReportedByOperator: true, guiFileOpenVisuallyObserved: true},
    limitations: {
      currentAdministratorHomeUsed: true,
      disposableProfileUsed: false,
      networkContainmentBound: false,
      preEntryFramesCaptured: false,
      completeNaturalEntryTrace: false,
      independentHumanRolesSatisfied: false,
      promotionEligible: false,
      strictAcceptanceEffect: "none",
    },
  };
}

function manifest() {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
    configuration: {
      fps: "12", sourceKind: "window", cursor: "excluded", sourceRect: "0.0,28.0,800.0,600.0",
      outputWidth: "800", outputHeight: "600", audio: "system-audio-48kHz-2ch-ALAC",
    },
    window: {
      ownerName: "Flash Player",
      title: "file:///Volumes/WestWorld/HELP MATH 2.0/work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf",
      frameWidth: 800,
      frameHeight: 628,
    },
    droppedOrIncompleteFrameCount: 0,
    frames: [{ordinal: 1}],
    audio: {codec: "Apple Lossless Audio Codec", sampleRate: 48000, channels: 2, outputFile: "system-audio-lossless.m4a", outputSha256: "a".repeat(64)},
  };
}

test("TS006 diagnostic parser requires a bounded session root", () => {
  assert.deepEqual(parseArguments(["--session-root", "artifacts/full-frame/g4-l3/session", "--check"]), {
    sessionRoot: "artifacts/full-frame/g4-l3/session", check: true,
  });
  assert.throws(() => parseArguments([]), /session-root is required/u);
  assert.throws(() => parseArguments(["--session-root", "x", "--write-anywhere"]), /Unknown option/u);
});

test("PNG header inspection verifies signature, IHDR, and dimensions", () => {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(800, 16);
  bytes.writeUInt32BE(600, 20);
  assert.deepEqual(inspectPngHeader(bytes), {width: 800, height: 600});
  bytes[0] = 0;
  assert.throws(() => inspectPngHeader(bytes), /invalid PNG signature/u);
});

test("frame timing summary is one-index neutral and reports effective FPS", () => {
  const summary = summarizeFrameTiming([
    {relativeTimeSeconds: 0},
    {relativeTimeSeconds: 1 / 12},
    {relativeTimeSeconds: 2 / 12},
    {relativeTimeSeconds: 3 / 12},
  ]);
  assert.equal(summary.durationSeconds, 0.25);
  assert.equal(summary.effectiveFps, 12);
  assert.ok(Math.abs(summary.intervalSeconds.median - 1 / 12) < 1e-12);
  assert.throws(() => summarizeFrameTiming([{relativeTimeSeconds: 0}, {relativeTimeSeconds: 0}]), /increase monotonically/u);
});

test("diagnostic boundary accepts only explicit non-promotion limitations", () => {
  assert.equal(validateDiagnosticBoundary(intake(), manifest()), true);
  const promoted = intake();
  promoted.limitations.promotionEligible = true;
  assert.throws(() => validateDiagnosticBoundary(promoted, manifest()), /weakened or promoted/u);
  const authorityClaim = manifest();
  authorityClaim.runtimeAuthorityClaimed = true;
  assert.throws(() => validateDiagnosticBoundary(intake(), authorityClaim), /authority boundary/u);
});

test("capture manifest validates native crop, window, lossless audio, and zero incomplete frames", () => {
  assert.equal(validateCaptureManifest(manifest()).configuration.fps, "12");
  const wrongCrop = manifest();
  wrongCrop.configuration.sourceRect = "0.0,0.0,800.0,600.0";
  assert.throws(() => validateCaptureManifest(wrongCrop), /crop drifted/u);
  const incomplete = manifest();
  incomplete.droppedOrIncompleteFrameCount = 1;
  assert.throws(() => validateCaptureManifest(incomplete), /incomplete frames/u);
  const lossy = manifest();
  lossy.audio.codec = "AAC";
  assert.throws(() => validateCaptureManifest(lossy), /audio descriptor/u);
});

