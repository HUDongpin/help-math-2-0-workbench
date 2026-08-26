import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  analyzeG4L3RuntimeCaptureAudioCalibration,
  classifySystemAudioCalibration,
  validateCalibrationAuthorityBoundary,
  validateCalibrationCaptureManifest,
  validateCaptureToolReadiness,
} from "./analyze-g4-l3-runtime-capture-audio-calibration.mjs";

function captureManifestFixture() {
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    window: null,
    display: {
      displayID: 1,
      frameX: 0,
      frameY: 0,
      frameWidth: 1920,
      frameHeight: 1080,
      pointWidth: 1920,
      pointHeight: 1080,
      includedProcessID: 26594,
      includedApplicationName: "QuickTime Player",
      includedBundleIdentifier: "com.apple.QuickTimePlayerX",
    },
    configuration: {
      audio: "system-audio-48kHz-2ch-ALAC",
      cursor: "excluded",
      fps: "12",
      minimumWindowHeight: "1",
      minimumWindowWidth: "1",
      outputHeight: "135",
      outputWidth: "350",
      pixelFormat: "BGRA",
      sourceKind: "display-exact-application",
      sourceRect: "50.0,180.0,350.0,135.0",
      waitForPidSeconds: "0.0",
    },
    startedAt: "2026-07-26T07:21:58Z",
    endedAt: "2026-07-26T07:22:10Z",
    frames: Array.from({length: 144}, (_, index) => ({
      ordinal: index + 1,
      file: `frames/frame-${String(index + 1).padStart(6, "0")}.png`,
      bytes: 9_000,
      sha256: "a".repeat(64),
      width: 350,
      height: 135,
      presentationTimeSeconds: 83_006 + index / 12,
      relativeTimeSeconds: index / 12,
      status: "complete",
    })),
    audio: {
      bufferCount: 604,
      inputPayloadBytes: 4_638_720,
      inputNonZeroBytes: 832_554,
      inputContainsNonZeroAudio: true,
      firstPresentationTimeSeconds: 83_006.106552083,
      lastPresentationTimeSeconds: 83_018.166552083,
      outputFile: "system-audio-lossless.m4a",
      outputBytes: 1_257_549,
      outputSha256: "17eff98ae7bc7399a8cc405d10871b8ca3a346ad81cd1312bd156a4e9bedb2d4",
      codec: "Apple Lossless Audio Codec",
      sampleRate: 48_000,
      channels: 2,
    },
    droppedOrIncompleteFrameCount: 0,
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
  };
}

test("calibration capture manifest requires exact app, complete frames, and non-zero source buffers", () => {
  assert.equal(validateCalibrationCaptureManifest(captureManifestFixture()), true);

  const zeroPayload = captureManifestFixture();
  zeroPayload.audio.inputNonZeroBytes = 0;
  zeroPayload.audio.inputContainsNonZeroAudio = false;
  assert.throws(() => validateCalibrationCaptureManifest(zeroPayload),
    /source-buffer or encoded-audio manifest binding drifted/u);

  const wrongApplication = captureManifestFixture();
  wrongApplication.display.includedBundleIdentifier = "com.macromedia.Flash Player.app";
  assert.throws(() => validateCalibrationCaptureManifest(wrongApplication),
    /exact QuickTime application/u);

  const frameGap = captureManifestFixture();
  frameGap.frames[80].ordinal = 82;
  assert.throws(() => validateCalibrationCaptureManifest(frameGap),
    /frame 81 identity or ordering drifted/u);

  const promoted = captureManifestFixture();
  promoted.runtimeAuthorityClaimed = true;
  assert.throws(() => validateCalibrationCaptureManifest(promoted),
    /authority- and acceptance-neutral/u);
});

test("calibration classification passes only with non-zero input and decoded encoded audio", () => {
  const result = classifySystemAudioCalibration({
    manifestAudio: {
      inputContainsNonZeroAudio: true,
      inputNonZeroBytes: 832_554,
    },
    encodedAudioProbe: {
      decodedNonZeroBytes: 593_196,
      meanVolumeDb: -27.7,
      maxVolumeDb: -5.5,
    },
    sourceAudioProbe: {
      decodedNonZeroBytes: 300_000,
      meanVolumeDb: -21,
      maxVolumeDb: -4.7,
    },
  });
  assert.equal(result.calibration, true);
  assert.equal(validateCalibrationAuthorityBoundary(result), true);

  const encodedSilence = classifySystemAudioCalibration({
    manifestAudio: {
      inputContainsNonZeroAudio: true,
      inputNonZeroBytes: 832_554,
    },
    encodedAudioProbe: {
      decodedNonZeroBytes: 0,
      meanVolumeDb: -91,
      maxVolumeDb: -91,
    },
    sourceAudioProbe: {
      decodedNonZeroBytes: 300_000,
      meanVolumeDb: -21,
      maxVolumeDb: -4.7,
    },
  });
  assert.equal(encodedSilence.calibration, false);
  assert.throws(() => validateCalibrationAuthorityBoundary(encodedSilence),
    /calibration success is not established/u);
});

test("calibration authority cannot be promoted into Flash, review, Owner, or strict acceptance", () => {
  const conclusion = classifySystemAudioCalibration({
    manifestAudio: {inputContainsNonZeroAudio: true, inputNonZeroBytes: 1},
    encodedAudioProbe: {decodedNonZeroBytes: 1, meanVolumeDb: -30, maxVolumeDb: -6},
    sourceAudioProbe: {decodedNonZeroBytes: 1, meanVolumeDb: -20, maxVolumeDb: -4},
  });
  for (const field of [
    "flashAudioEstablished",
    "spokenSpanishEstablished",
    "cueTimingEstablished",
    "listeningReviewCompleted",
    "baselineAuthorityClaimed",
    "runtimeAuthorityClaimed",
    "audioAccepted",
    "humanReviewAccepted",
    "ownerAccepted",
    "strictMigrationComplete",
    "publicRelease",
  ]) assert.equal(conclusion[field], false, field);
  assert.equal(conclusion.strictAcceptanceEffect, "none");

  const promoted = {...conclusion, ownerAccepted: true};
  assert.throws(() => validateCalibrationAuthorityBoundary(promoted),
    /improperly promoted ownerAccepted/u);
});

test("capture-tool readiness rejects source or acceptance drift", () => {
  const source = {path: "tools/g4-l3-runtime-capture/CaptureMain.swift", bytes: 10, sha256: "a".repeat(64)};
  const executable = {
    path: "work/g4-l3-runtime-capture-tool/HELP Math Runtime Capture.app/Contents/MacOS/g4-l3-runtime-capture",
    bytes: 20,
    sha256: "b".repeat(64),
    mode: "0500",
  };
  const readinessWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-screen-capture-kit-tool-readiness",
    source,
    executable,
    capabilities: {
      screenCaptureKitDisplayExactApplicationCapture: true,
      systemAudio: {
        codec: "ALAC",
        sampleRate: 48_000,
        channels: 2,
        lossless: true,
        sourceBufferPayloadDiagnostics: true,
      },
    },
    execution: {
      helpOnlyExecuted: true,
      screenReadAttempted: false,
      flashProjectorLaunched: false,
      swfOpened: false,
      runtimeSessionExecuted: false,
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
  const stable = (value) => {
    if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  };
  const readiness = {
    ...readinessWithoutFingerprint,
    reportFingerprintSha256:
      createHash("sha256").update(Buffer.from(stable(readinessWithoutFingerprint))).digest("hex"),
  };
  assert.equal(validateCaptureToolReadiness(readiness, source, executable), true);

  const promotedWithoutFingerprint = structuredClone(readinessWithoutFingerprint);
  promotedWithoutFingerprint.acceptance.audioAccepted = true;
  const promoted = {
    ...promotedWithoutFingerprint,
    reportFingerprintSha256:
      createHash("sha256").update(Buffer.from(stable(promotedWithoutFingerprint))).digest("hex"),
  };
  assert.throws(() => validateCaptureToolReadiness(promoted, source, executable),
    /acceptance claim/u);
});

test("bound calibration artifact passes end to end without writing reports", async () => {
  const report = await analyzeG4L3RuntimeCaptureAudioCalibration({writeReports: false});
  assert.equal(report.conclusion.calibration, true);
  assert.equal(report.calibration.frames.count, 144);
  assert.equal(report.calibration.frames.files.length, 144);
  assert.equal(report.calibration.sourceBufferDiagnostics.inputNonZeroBytes, 832_554);
  assert.ok(report.calibration.encodedAudio.decodedNonZeroBytes > 0);
  assert.equal(report.calibration.encodedAudio.decodedPcmSha256,
    "4ce8a65016f543398f94cdd28b0ed7d6391d383cf2fd3f737fe9c7062dcc3873");
  assert.equal(report.conclusion.flashAudioEstablished, false);
  assert.equal(report.conclusion.spokenSpanishEstablished, false);
  assert.equal(report.conclusion.cueTimingEstablished, false);
  assert.equal(report.conclusion.listeningReviewCompleted, false);
  assert.equal(report.conclusion.baselineAuthorityClaimed, false);
  assert.equal(report.conclusion.humanReviewAccepted, false);
  assert.equal(report.conclusion.ownerAccepted, false);
  assert.equal(report.conclusion.strictMigrationComplete, false);
  assert.equal(report.strictAcceptanceEffect, "none");
});
