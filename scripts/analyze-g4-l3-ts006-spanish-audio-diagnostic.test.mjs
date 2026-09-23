import assert from "node:assert/strict";
import test from "node:test";

import {
  classifySpanishAudioEvidence,
  parseVolume,
  validateButtonRuns,
  validateSpanishAudioDiagnosticManifest,
} from "./analyze-g4-l3-ts006-spanish-audio-diagnostic.mjs";

function manifestFixture() {
  return {
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
    evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
    configuration: {
      fps: "12",
      outputWidth: "800",
      outputHeight: "600",
      sourceRect: "0.0,28.0,800.0,600.0",
      audio: "system-audio-48kHz-2ch-ALAC",
    },
    window: {
      ownerName: "Flash Player",
      title: "file:///Volumes/WestWorld/HELP MATH 2.0/work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf",
    },
    droppedOrIncompleteFrameCount: 0,
    frames: Array.from({length: 1069}, (_, index) => ({
      ordinal: index + 1,
      status: "complete",
      width: 800,
      height: 600,
      file: `frames/frame-${String(index + 1).padStart(6, "0")}.png`,
      sha256: "a".repeat(64),
    })),
    audio: {
      codec: "Apple Lossless Audio Codec",
      sampleRate: 48000,
      channels: 2,
      outputFile: "system-audio-lossless.m4a",
      outputSha256: "41a56f6d4c22e34f7badf3e880c0c1c13b9ec8f9d6e0a899e308dc1ed9855761",
    },
  };
}

test("TS006 Spanish-audio diagnostic accepts only the complete fail-closed capture", () => {
  assert.equal(validateSpanishAudioDiagnosticManifest(manifestFixture()), true);
  const promoted = manifestFixture();
  promoted.runtimeAuthorityClaimed = true;
  assert.throws(() => validateSpanishAudioDiagnosticManifest(promoted),
    /must not claim runtime authority/);
  const dropped = manifestFixture();
  dropped.droppedOrIncompleteFrameCount = 1;
  assert.throws(() => validateSpanishAudioDiagnosticManifest(dropped),
    /1069 complete frames/);
});

test("TS006 Spanish-audio diagnostic distinguishes session silence from source media", () => {
  assert.deepEqual(classifySpanishAudioEvidence({
    captureProbe: {
      durationSeconds: 90.112,
      meanVolumeDb: -91,
      maxVolumeDb: -91,
      totalSilenceDurationSeconds: 90.04,
      longestSilenceDurationSeconds: 90.04,
    },
    sourceProbe: {
      durationSeconds: 7.632,
      meanVolumeDb: -21,
      maxVolumeDb: -4.7,
      totalSilenceDurationSeconds: 0.682833,
      longestSilenceDurationSeconds: 0.682833,
    },
  }), {
    capturedAudioDigitalSilence: true,
    sourceMp3NonSilent: true,
    runtimeAudioEmissionObservedCandidate: false,
    causalAttributionAvailable: false,
    runtimeAudioEmissionEstablished: false,
    audioAcceptance: false,
    strictAcceptanceEffect: "none",
  });
});

test("TS006 Spanish-audio diagnostic never promotes unrelated non-silent system audio", () => {
  assert.deepEqual(classifySpanishAudioEvidence({
    captureProbe: {
      durationSeconds: 15,
      meanVolumeDb: -24,
      maxVolumeDb: -2,
      totalSilenceDurationSeconds: 2,
    },
    sourceProbe: {
      durationSeconds: 7.632,
      meanVolumeDb: -21,
      maxVolumeDb: -4.7,
      totalSilenceDurationSeconds: 0.682833,
    },
  }), {
    capturedAudioDigitalSilence: false,
    sourceMp3NonSilent: true,
    runtimeAudioEmissionObservedCandidate: true,
    causalAttributionAvailable: false,
    runtimeAudioEmissionEstablished: false,
    audioAcceptance: false,
    strictAcceptanceEffect: "none",
  });
});

test("TS006 Spanish-audio diagnostic reports total and longest silence separately", () => {
  assert.deepEqual(parseVolume([
    "[Parsed_volumedetect] mean_volume: -42.0 dB",
    "[Parsed_volumedetect] max_volume: -3.0 dB",
    "[silencedetect] silence_duration: 1.25",
    "[silencedetect] silence_duration: 2.50",
  ].join("\n")), {
    meanVolumeDb: -42,
    maxVolumeDb: -3,
    silenceIntervalCount: 2,
    totalSilenceDurationSeconds: 3.75,
    longestSilenceDurationSeconds: 2.5,
  });
});

test("TS006 Spanish-audio diagnostic rejects button-state range drift", () => {
  const valid = [
    {firstFrame: 1, lastFrame: 156, cropSignature: "9331f4ed672b7aad3388e8b912ebb0bc28e836198aa56a9c5c6045c46d57cb25"},
    {firstFrame: 157, lastFrame: 562, cropSignature: "5ef8ba5dfdf25b72282479e40b4deb7b1a8d58788e4072d92ec040219a9b5701"},
    {firstFrame: 563, lastFrame: 1069, cropSignature: "361aeafcc964387d3db68abcd67f5bb289c52f1ee7c48d91892424e1769dec3c"},
  ];
  assert.equal(validateButtonRuns(valid).at(-1).visualState, "pause-icon-visible");
  const drifted = structuredClone(valid);
  drifted[2].firstFrame = 564;
  assert.throws(() => validateButtonRuns(drifted), /visual run 3 drifted/);
});
