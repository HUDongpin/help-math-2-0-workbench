import assert from "node:assert/strict";
import test from "node:test";

import {
  computeTemporalAssociation,
  groupControlSignatures,
  inspectPngHeader,
  parseArguments,
  parseAudioAnalysis,
  validateCaptureAudioAnalysis,
  validateCaptureManifest,
  validateControlRuns,
  validatePendingCandidate,
} from "./analyze-g4-l3-ts006-spanish-audio-control-capture.mjs";

const manifestSha256 = "9ea09d0c172da9571c3a2a1b8d1ff0c23e06165aae86225eb0ed81e776535304";
const audioSha256 = "e4f07700a9bc48876aee780a54a9b8d46ae158d204b6aea809933a6c002f05c7";
const candidateFingerprint = "c71577d01124ea515773153637701c8a190c782ab1254db2d85ecd97515aba2f";

function candidateFixture() {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-screen-capture-kit-pending-natural-trace-candidate",
    status: "pending-candidate-unresolved-trace-specifications",
    animationId: "course-g04-l03-ts-006",
    sessionId: "ts006-es-b8ba2818-cc71-4d20-84a8-4ae1ccda0b26",
    language: "es",
    promotionEligible: false,
    acceptanceEffect: "none",
    candidateFingerprintSha256: candidateFingerprint,
    capture: {
      directory: "artifacts/full-frame/g4-l3/ts006-es-b8ba2818-cc71-4d20-84a8-4ae1ccda0b26/evidence/raw-captures/spanish-audio-control-es-002",
      manifest: {
        path: "artifacts/full-frame/g4-l3/ts006-es-b8ba2818-cc71-4d20-84a8-4ae1ccda0b26/evidence/raw-captures/spanish-audio-control-es-002/capture-manifest.json",
        sha256: manifestSha256,
      },
      audio: {
        file: {
          path: "artifacts/full-frame/g4-l3/ts006-es-b8ba2818-cc71-4d20-84a8-4ae1ccda0b26/evidence/raw-captures/spanish-audio-control-es-002/system-audio-lossless.m4a",
          sha256: audioSha256,
        },
        causalAttributionEstablished: false,
        spokenLanguageIdentityEstablished: false,
        listeningAcceptanceEstablished: false,
      },
    },
    process: {pid: 79108, cleanExit: true, exactPidScreenCaptureKitBindingVerified: true},
    unresolvedGates: [
      "no-hash-chained-operation-event-log",
      "no-natural-trace-execution-report",
      "no-causal-audio-trigger-or-listening-acceptance",
    ],
    authority: {
      naturalTraceExecutionEstablished: false,
      authoritativeOriginalRuntimeTrace: false,
      authoritativeBaseline: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
}

function manifestFixture() {
  const frames = Array.from({length: 539}, (_, index) => ({
    ordinal: index + 1,
    file: `frames/frame-${String(index + 1).padStart(6, "0")}.png`,
    status: "complete",
    width: 800,
    height: 600,
    relativeTimeSeconds: index / 12,
    presentationTimeSeconds: 1000 + index / 12,
    sha256: "a".repeat(64),
  }));
  frames[312].relativeTimeSeconds = 26.194895291;
  frames[493].relativeTimeSeconds = 41.404350166;
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
    configuration: {
      fps: "12",
      sourceKind: "waited-first-window-exact-pid",
      cursor: "excluded",
      sourceRect: "0.0,28.0,800.0,600.0",
      outputWidth: "800",
      outputHeight: "600",
      audio: "system-audio-48kHz-2ch-ALAC",
    },
    window: {
      ownerName: "Flash Player",
      title: "file:///Volumes/WestWorld/HELP MATH 2.0/work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf",
      frameWidth: 800,
      frameHeight: 628,
    },
    display: {includedApplicationName: "Flash Player", includedProcessID: 79108},
    droppedOrIncompleteFrameCount: 0,
    frames,
    audio: {
      codec: "Apple Lossless Audio Codec",
      sampleRate: 48000,
      channels: 2,
      outputFile: "system-audio-lossless.m4a",
      outputSha256: audioSha256,
      inputContainsNonZeroAudio: true,
      inputNonZeroBytes: 5313158,
      inputPayloadBytes: 17333760,
      firstPresentationTimeSeconds: 1000.021628916,
    },
  };
}

const captureAnalysis = {
  meanVolumeDb: -26,
  maxVolumeDb: -5.2,
  silenceIntervals: [
    {startSeconds: 0, endSeconds: 26.235125, durationSeconds: 26.235125},
    {startSeconds: 31.435271, endSeconds: 32.274479, durationSeconds: 0.839208},
    {startSeconds: 34.490521, endSeconds: 34.952979, durationSeconds: 0.462458},
    {startSeconds: 41.41775, endSeconds: 45.14, durationSeconds: 3.72225},
  ],
};

test("argument parser exposes only deterministic generate and check modes", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--output", "/tmp/report"]), /Unknown option/u);
});

test("PNG inspection validates signature, IHDR, and native dimensions", () => {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(800, 16);
  bytes.writeUInt32BE(600, 20);
  assert.deepEqual(inspectPngHeader(bytes), {width: 800, height: 600});
  bytes[0] = 0;
  assert.throws(() => inspectPngHeader(bytes), /invalid PNG signature/u);
});

test("candidate and capture validators reject any authority promotion", () => {
  assert.equal(validatePendingCandidate(candidateFixture()), true);
  assert.equal(validateCaptureManifest(manifestFixture(), candidateFixture()), true);
  const promoted = candidateFixture();
  promoted.authority.audioAccepted = true;
  assert.throws(() => validatePendingCandidate(promoted), /authority was promoted/u);
  const claimed = manifestFixture();
  claimed.runtimeAuthorityClaimed = true;
  assert.throws(() => validateCaptureManifest(claimed, candidateFixture()), /authority boundary/u);
  const dropped = manifestFixture();
  dropped.droppedOrIncompleteFrameCount = 1;
  assert.throws(() => validateCaptureManifest(dropped, candidateFixture()), /539 complete frames/u);
});

test("control crop admits only the exact three observed pixel runs", () => {
  const signatures = [
    ...Array(312).fill("5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701"),
    ...Array(182).fill("361aeafcc964387d3db68abcd67f5bb289c52f1ee7c48d91892424e1769dec3c"),
    ...Array(45).fill("5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701"),
  ];
  const runs = validateControlRuns(groupControlSignatures(signatures));
  assert.deepEqual(runs.map(({firstFrame, lastFrame, visualState}) => ({firstFrame, lastFrame, visualState})), [
    {firstFrame: 1, lastFrame: 312, visualState: "non-pause-control-state"},
    {firstFrame: 313, lastFrame: 494, visualState: "pause-icon-visible"},
    {firstFrame: 495, lastFrame: 539, visualState: "non-pause-control-state"},
  ]);
  signatures[493] = signatures[0];
  assert.throws(() => validateControlRuns(groupControlSignatures(signatures)), /visual run/u);
});

test("ffmpeg analysis parser preserves all four silence intervals", () => {
  const parsed = parseAudioAnalysis([
    "silence_start: 0",
    "silence_end: 26.235125 | silence_duration: 26.235125",
    "silence_start: 31.435271",
    "silence_end: 32.274479 | silence_duration: 0.839208",
    "silence_start: 34.490521",
    "silence_end: 34.952979 | silence_duration: 0.462458",
    "silence_start: 41.41775",
    "mean_volume: -26.0 dB",
    "max_volume: -5.2 dB",
    "silence_end: 45.14 | silence_duration: 3.72225",
  ].join("\n"));
  assert.deepEqual(parsed, captureAnalysis);
  assert.equal(validateCaptureAudioAnalysis(parsed), true);
  parsed.silenceIntervals[3].endSeconds = 45;
  assert.throws(() => validateCaptureAudioAnalysis(parsed), /interval 4 drifted/u);
});

test("PTS alignment proves temporal association only, never causality or source match", () => {
  const controlRuns = validateControlRuns([
    {firstFrame: 1, lastFrame: 312, cropSignature: "5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701"},
    {firstFrame: 313, lastFrame: 494, cropSignature: "361aeafcc964387d3db68abcd67f5bb289c52f1ee7c48d91892424e1769dec3c"},
    {firstFrame: 495, lastFrame: 539, cropSignature: "5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701"},
  ]);
  const result = computeTemporalAssociation({
    manifest: manifestFixture(),
    controlRuns,
    captureAudioAnalysis: captureAnalysis,
  });
  assert.equal(result.temporalAssociationObserved, true);
  assert.ok(Math.abs(result.startBoundaryOffsetFromFirstPauseFrameSeconds - 0.061858625) < 1e-9);
  assert.ok(Math.abs(result.endBoundaryOffsetFromLastPauseFrameSeconds - 0.03502875) < 1e-9);
  assert.equal(result.eventTriggerLogPresent, false);
  assert.equal(result.sourceMediaRequestLogPresent, false);
  assert.equal(result.causalAttributionEstablished, false);
  assert.equal(result.sourceMediaMatchEstablished, false);
});

