import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {
  CAPTURE_MANIFEST_RELATIVE,
  SESSION_ID,
  analyzeNativeReplayDiagnostic,
  classifyPidEvidence,
  deriveReplayVisualSequence,
  extractRgbCrop,
  inspectPng,
  normalizedRgbRmse,
  parseArguments,
  summarizeFrameTiming,
  validateCaptureBoundary,
} from "./analyze-g4-l3-ts006-native-replay-diagnostic.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function actualManifest() {
  return JSON.parse(
    await readFile(
      `${PROJECT_ROOT}/${CAPTURE_MANIFEST_RELATIVE}`,
      "utf8",
    ),
  );
}

function clone(value) {
  return structuredClone(value);
}

test("CLI is check-by-default and permits only explicit report write", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--check"]), {
    write: false,
  });
  assert.deepEqual(parseArguments(["--write"]), {
    write: true,
  });
  assert.throws(
    () => parseArguments(["--write", "elsewhere"]),
    /Usage/u,
  );
});

test("frame timing distinguishes nominal request from observed cadence", () => {
  const frames = Array.from({length: 5}, (_, index) => ({
    relativeTimeSeconds: index / 12,
    presentationTimeSeconds: 100 + index / 12,
  }));
  const summary = summarizeFrameTiming(frames);
  assert.ok(
    Math.abs(summary.effectiveFps - 12) < 1e-10,
  );
  assert.equal(
    summary.nominalCadenceWithinTolerance,
    true,
  );
  const repeated = clone(frames);
  repeated[3].relativeTimeSeconds =
    repeated[2].relativeTimeSeconds;
  assert.throws(
    () => summarizeFrameTiming(repeated),
    /strictly monotonic/u,
  );
});

test("PNG decode, crop, and normalized RGB RMSE are deterministic", () => {
  const png = new PNG({width: 800, height: 600});
  png.data.fill(255);
  const bytes = PNG.sync.write(png);
  const decoded = inspectPng(bytes);
  const crop = extractRgbCrop(decoded);
  assert.equal(crop.length, 800 * 420 * 3);
  assert.equal(normalizedRgbRmse(crop, crop), 0);
  const changed = Buffer.from(crop);
  changed[0] = 0;
  assert.ok(normalizedRgbRmse(crop, changed) > 0);
  const invalid = Buffer.from(bytes);
  invalid[0] = 0;
  assert.throws(
    () => inspectPng(invalid),
    /signature is invalid/u,
  );
});

test("capture boundary remains raw/neutral and PID classification does not confuse windowID with PID", async () => {
  const manifest = await actualManifest();
  assert.equal(validateCaptureBoundary(manifest), true);
  const pid = classifyPidEvidence(manifest);
  assert.equal(pid.windowID, 6310);
  assert.equal(pid.includedProcessID, null);
  assert.equal(pid.exactPidBindingEstablished, false);
  assert.match(pid.reason, /window identifier, not a Unix PID/u);

  const exactPid = clone(manifest);
  exactPid.configuration.sourceKind =
    "waited-first-window-exact-pid";
  exactPid.configuration.waitForPidSeconds = "120.0";
  exactPid.display = {
    includedApplicationName: "Flash Player",
    includedProcessID: 12345,
  };
  assert.equal(
    classifyPidEvidence(exactPid)
      .exactPidBindingEstablished,
    true,
  );

  const promoted = clone(manifest);
  promoted.runtimeAuthorityClaimed = true;
  assert.throws(
    () => validateCaptureBoundary(promoted),
    /authority boundary/u,
  );
  const dropped = clone(manifest);
  dropped.droppedOrIncompleteFrameCount = 1;
  assert.throws(
    () => validateCaptureBoundary(dropped),
    /zero reported drops/u,
  );
});

test("visual-sequence derivation requires ordered terminal-like, reset-like, terminal-like regions", () => {
  const metrics = Array.from(
    {length: 477},
    (_, index) => {
      const ordinal = index + 1;
      let signature = `dynamic-${ordinal}`;
      let rmse = 0.1;
      if (ordinal <= 157) {
        signature = `terminal-${ordinal}`;
        rmse = 0.005;
      } else if (ordinal >= 162 && ordinal <= 164) {
        signature = "reset";
        rmse = 0.22;
      } else if (ordinal >= 406) {
        signature = `terminal-return-${ordinal}`;
        rmse = 0.005;
      }
      return {
        ordinal,
        contentCropSha256: signature,
        rmseToInitialContent: rmse,
        rmseToResetCandidateContent:
          signature === "reset" ? 0 : 0.2,
      };
    },
  );
  const result = deriveReplayVisualSequence(metrics);
  assert.deepEqual(
    result.preTerminalLikePrefix,
    {
      firstOrdinal: 1,
      lastOrdinal: 157,
      frameCount: 157,
      maximumRmseToInitialContent: 0.005,
      interpretation:
        "The recording begins in a stable terminal-like visual state; it does not capture arrival at that state.",
    },
  );
  assert.equal(
    result.resetLikePlateau.firstOrdinal,
    162,
  );
  assert.equal(
    result.resetLikePlateau.lastOrdinal,
    164,
  );
  assert.equal(
    result.secondTerminalLikeSuffix.firstOrdinal,
    406,
  );
  assert.equal(
    result.diagnosticVisualSequenceEstablished,
    true,
  );
  assert.equal(
    result.replayOperationCausalityEstablished,
    false,
  );
  assert.equal(
    result.semanticTerminalStateEstablished,
    false,
  );

  const noReturn = clone(metrics);
  for (let ordinal = 406; ordinal <= 477; ordinal += 1) {
    noReturn[ordinal - 1].rmseToInitialContent = 0.2;
  }
  assert.throws(
    () => deriveReplayVisualSequence(noReturn),
    /no terminal-like suffix/u,
  );
});

test("current 477-frame artifact and generated reports verify exactly while all authority stays false", async () => {
  const result =
    await analyzeNativeReplayDiagnostic({
      write: false,
    });
  const report = result.report;
  assert.equal(report.sessionId, SESSION_ID);
  assert.equal(
    report.capture.frames.count,
    477,
  );
  assert.equal(
    report.capture.frames.completeFrameCount,
    477,
  );
  assert.equal(
    report.capture.frames
      .droppedOrIncompleteFrameCount,
    0,
  );
  assert.equal(
    report.capture.frames.width,
    800,
  );
  assert.equal(
    report.capture.frames.height,
    600,
  );
  assert.equal(
    report.capture.frames
      .orderedFrameSetSha256,
    "b0ddf80dccdc1bcad283eb68cd8380633f6d07d3ce1271c8aec14f1d47f86acf",
  );
  assert.equal(
    report.capture.audio.sha256,
    "eb96a4732159c49c907d68949d37fcf8d12d0bf67a9f36347311ba7856a57ddc",
  );
  assert.equal(
    report.capture.audio.decodedPcm.sha256,
    "98daa621127a0f6a5d8070f2dcfb64159debb35f793ceeee9c51154188cc4449",
  );
  assert.equal(
    report.capture.pidEvidence
      .exactPidBindingEstablished,
    false,
  );
  assert.equal(
    report.replayDiagnostic
      .resetLikePlateau.firstOrdinal,
    162,
  );
  assert.equal(
    report.replayDiagnostic
      .resetLikePlateau.lastOrdinal,
    164,
  );
  assert.equal(
    report.replayDiagnostic
      .secondTerminalLikeSuffix.firstOrdinal,
    406,
  );
  assert.equal(
    report.acceptanceEffect,
    "none",
  );
  assert.equal(
    report.strictAcceptanceEffect,
    "none",
  );
  for (const value of Object.values(
    report.authority,
  )) {
    assert.equal(value, false);
  }
  for (const value of Object.values(
    report.acceptance,
  )) {
    assert.equal(value, false);
  }
  assert.equal(result.wroteReports, false);
});
