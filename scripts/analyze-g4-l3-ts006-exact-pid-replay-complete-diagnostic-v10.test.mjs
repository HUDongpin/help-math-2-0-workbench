import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

import {
  CAPTURE_MANIFEST_RELATIVE,
  EXPECTED_ALPHA_MASK_SHA256,
  REPORT_JSON_RELATIVE,
  SESSION_ID,
  analyzeExactPidReplayCompleteDiagnosticV10,
  deriveReplaySegments,
  detectLeftStageOffset,
  inspectAlphaMask,
  normalizedRgbRmse,
  parseArguments,
  summarizeFrameTiming,
  validatePrimaryCaptureBoundary,
  validateSpanishSiblingBoundary,
} from "./analyze-g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function clone(value) {
  return structuredClone(value);
}

async function manifest(relativePath) {
  return JSON.parse(await readFile(path.join(PROJECT_ROOT, relativePath), "utf8"));
}

test("v10 CLI is check-by-default and writes only explicitly", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--check"]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Usage/u);
});

test("primary and Spanish sibling boundaries pin PID, crop, alpha, drops, and neutral authority", async () => {
  const primary = await manifest(CAPTURE_MANIFEST_RELATIVE);
  const sibling = await manifest(
    "artifacts/full-frame/g4-l3/ts006-es-page-audio-exact-pid-diagnostic-20260726T221112+0800/capture-manifest.json",
  );
  assert.equal(validatePrimaryCaptureBoundary(primary), true);
  assert.equal(validateSpanishSiblingBoundary(sibling), true);

  const wrongPid = clone(primary);
  wrongPid.display.includedProcessID = 97582;
  assert.throws(() => validatePrimaryCaptureBoundary(wrongPid), /process selection/u);
  const wrongCrop = clone(primary);
  wrongCrop.configuration.resolvedDisplaySourceRect = "25.0,58.0,800.0,600.0";
  assert.throws(() => validatePrimaryCaptureBoundary(wrongCrop), /configuration/u);
  const promoted = clone(primary);
  promoted.runtimeAuthorityClaimed = true;
  assert.throws(() => validatePrimaryCaptureBoundary(promoted), /authority boundary/u);
  const dropped = clone(primary);
  dropped.droppedOrIncompleteFrameCount = 1;
  assert.throws(() => validatePrimaryCaptureBoundary(dropped), /zero drops/u);
});

test("frame timing keeps nominal request separate from observed cadence", () => {
  const frames = Array.from({length: 6}, (_, index) => ({
    relativeTimeSeconds: index / 12,
    presentationTimeSeconds: 100 + index / 12,
  }));
  const result = summarizeFrameTiming(frames);
  assert.ok(Math.abs(result.effectiveFps - 12) < 1e-10);
  assert.equal(result.nominalCadenceWithinTolerance, true);
  frames[3].relativeTimeSeconds = frames[2].relativeTimeSeconds;
  assert.throws(() => summarizeFrameTiming(frames), /non-monotonic/u);
});

test("alpha mask and horizontal inset detectors are deterministic", () => {
  const png = new PNG({width: 800, height: 600});
  png.data.fill(255);
  for (let y = 0; y < 600; y += 1) {
    for (let x = 0; x < 25; x += 1) {
      const index = (y * 800 + x) * 4;
      png.data[index] = 0;
      png.data[index + 1] = 0;
      png.data[index + 2] = 0;
    }
  }
  png.data[(599 * 800) * 4 + 3] = 0;
  assert.equal(detectLeftStageOffset(png), 25);
  const alpha = inspectAlphaMask(png);
  assert.equal(alpha.nonOpaquePixelCount, 1);
  assert.deepEqual(alpha.nonOpaqueBounds, {
    minimumX: 0,
    minimumY: 599,
    maximumX: 0,
    maximumY: 599,
  });
  const rgb = Buffer.from([10, 20, 30]);
  assert.equal(normalizedRgbRmse(rgb, rgb), 0);
});

test("Replay segmentation fails closed around exact deterministic phases", () => {
  const metrics = Array.from({length: 537}, (_, index) => {
    const ordinal = index + 1;
    let contentCropSha256 = `dynamic-${ordinal}`;
    let adjacentContentRmse = 0.001;
    let terminalMarkerChangedPixels = ordinal <= 16 || ordinal >= 262 ? 1146 : 0;
    let rmseToInitialContent = ordinal <= 16 || ordinal >= 262 ? 0.005 : 0.1;
    for (const [first, last, signature] of [
      [18, 30, "reset"],
      [39, 119, "check"],
      [126, 155, "strategies"],
      [162, 252, "list"],
      [262, 288, "terminal"],
    ]) {
      if (ordinal >= first && ordinal <= last) contentCropSha256 = signature;
    }
    if (ordinal === 14) adjacentContentRmse = 0.024;
    if (ordinal === 17) adjacentContentRmse = 0.122;
    return {
      ordinal,
      frameSha256: `frame-${ordinal}`,
      contentCropSha256,
      instructionalRgbaSha256:
        ordinal <= 16 || ordinal >= 262 ? "terminal-instructional" : `instructional-${ordinal}`,
      adjacentContentRmse,
      terminalMarkerChangedPixels,
      rmseToInitialContent,
    };
  });
  const result = deriveReplaySegments(metrics);
  assert.deepEqual(
    [
      result.interactionNeutralTerminalPrefix.firstOrdinal,
      result.interactionNeutralTerminalPrefix.lastOrdinal,
    ],
    [1, 13],
  );
  assert.deepEqual(
    [
      result.stableInstructionalTerminalPrefix.firstOrdinal,
      result.stableInstructionalTerminalPrefix.lastOrdinal,
    ],
    [1, 16],
  );
  assert.deepEqual(
    [
      result.replayResetVisualTransition.firstOrdinal,
      result.resetLikePlateau.firstOrdinal,
      result.resetLikePlateau.lastOrdinal,
    ],
    [17, 18, 30],
  );
  assert.deepEqual(
    [result.observedRevealAnimation.firstOrdinal, result.observedRevealAnimation.lastOrdinal],
    [31, 261],
  );
  assert.deepEqual(
    [result.terminalLikeSuffix.firstOrdinal, result.terminalLikeSuffix.lastOrdinal],
    [262, 537],
  );
  assert.equal(result.replayInputCausalityEstablished, false);
  assert.equal(result.sourcePlayheadMappingEstablished, false);

  const drifted = clone(metrics);
  drifted[16].adjacentContentRmse = 0.01;
  assert.throws(() => deriveReplaySegments(drifted), /largest reset transition/u);
});

test("current v10 report verifies exact bytes while every authority and acceptance remains false", async () => {
  const result = await analyzeExactPidReplayCompleteDiagnosticV10({write: false});
  const report = result.report;
  assert.equal(report.primaryCapture.sessionId, SESSION_ID);
  assert.equal(report.primaryCapture.exactPidAndDisplayCrop.includedProcessID, 97581);
  assert.equal(
    report.primaryCapture.exactPidAndDisplayCrop.resolvedDisplaySourceRect,
    "0.0,58.0,800.0,600.0",
  );
  assert.equal(report.primaryCapture.frames.count, 537);
  assert.equal(report.primaryCapture.frames.completeFrameCount, 537);
  assert.equal(report.primaryCapture.frames.droppedOrIncompleteFrameCount, 0);
  assert.equal(report.primaryCapture.alphaMask.declaredSha256, EXPECTED_ALPHA_MASK_SHA256);
  assert.equal(report.primaryCapture.alphaMask.verifiedFrameCount, 537);
  assert.equal(report.primaryCapture.alphaMask.nonOpaquePixelCount, 116);
  assert.deepEqual(
    report.primaryCapture.horizontalRegistration.detectedLeftStageOffsetsPixels,
    [0],
  );
  assert.equal(
    report.primaryCapture.horizontalRegistration.noHorizontalRegistrationDriftDetected,
    true,
  );
  assert.equal(
    report.primaryCapture.audio.sha256,
    "dcebe8af5e012b395f46ffebe8edae1a575807e5d2164924a133cd4a783fec06",
  );
  assert.equal(
    report.primaryCapture.audio.decodedPcm.sha256,
    "bb6750534eeddafb73188b101c17e7a4a47bd804fabe0ab1036cb9e70c46ad1f",
  );
  assert.deepEqual(
    [
      report.replayDiagnostic.stableInstructionalTerminalPrefix.firstOrdinal,
      report.replayDiagnostic.stableInstructionalTerminalPrefix.lastOrdinal,
      report.replayDiagnostic.replayResetVisualTransition.firstOrdinal,
      report.replayDiagnostic.observedRevealAnimation.firstOrdinal,
      report.replayDiagnostic.observedRevealAnimation.lastOrdinal,
      report.replayDiagnostic.terminalLikeSuffix.firstOrdinal,
      report.replayDiagnostic.terminalLikeSuffix.lastOrdinal,
    ],
    [1, 16, 17, 31, 261, 262, 537],
  );
  assert.deepEqual(
    [
      report.replayDiagnostic.terminalLikeSuffix.fullFramePixelStaticTail.firstOrdinal,
      report.replayDiagnostic.terminalLikeSuffix.fullFramePixelStaticTail.lastOrdinal,
    ],
    [536, 537],
  );
  assert.equal(report.diagnosticSibling.frames.count, 240);
  assert.equal(report.diagnosticSibling.frames.droppedOrIncompleteFrameCount, 0);
  assert.equal(
    report.diagnosticSibling.audio.sha256,
    "02165163f0c8692ee6194c6250705aa0aceba2506c2e4b93c31f375de23e7600",
  );
  assert.equal(
    report.diagnosticSibling.audio.decodedPcm.sha256,
    "95ec3b93269be7eac06398406c7015717417b5007fc7832184c95eddeb36283e",
  );
  assert.equal(report.diagnosticSibling.independentMacOsAccountEstablished, false);
  assert.equal(report.diagnosticSibling.naturalTraceEstablished, false);
  assert.equal(report.diagnosticSibling.humanListeningAccepted, false);
  for (const value of Object.values(report.authority)) assert.equal(value, false);
  for (const value of Object.values(report.acceptance)) assert.equal(value, false);
  assert.equal(report.acceptanceEffect, "none");
  assert.equal(report.strictAcceptanceEffect, "none");
  assert.equal(report.coverageMutationPerformed, false);
  assert.equal(report.candidateMutationPerformed, false);
  assert.equal(report.protectedPinsMutationPerformed, false);
  assert.equal(result.wroteReports, false);

  const checkedIn = JSON.parse(
    await readFile(path.join(PROJECT_ROOT, REPORT_JSON_RELATIVE), "utf8"),
  );
  assert.equal(checkedIn.reportFingerprintSha256, report.reportFingerprintSha256);
});
