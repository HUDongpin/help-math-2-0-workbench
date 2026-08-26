import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildG4L3Ts006LiveDiagnosticCaptureReceiptV13,
  parseArguments,
  receiptFingerprint,
  validateCaptureManifestShape,
  validateG4L3Ts006LiveDiagnosticCaptureReceiptV13,
  verifyCaptureFiles,
} from "./build-g4-l3-ts006-live-diagnostic-capture-receipt-v13.mjs";

const ROOT = new URL("../", import.meta.url);
const REPORT = new URL(
  "reports/g4-l3-ts006-live-diagnostic-capture-receipt-v13.json",
  ROOT,
);
const V5_MANIFEST = new URL(
  "artifacts/full-frame/g4-l3/"
  + "ts006-natural-forward-diagnostic-exact-pid-v5/capture-manifest.json",
  ROOT,
);
const V6_MANIFEST = new URL(
  "artifacts/full-frame/g4-l3/"
  + "ts006-answer-feedback-diagnostic-exact-pid-v6/capture-manifest.json",
  ROOT,
);

const V5_SPEC = Object.freeze({
  id: "ts006-natural-forward-diagnostic-exact-pid-v5",
  directory:
    "artifacts/full-frame/g4-l3/"
    + "ts006-natural-forward-diagnostic-exact-pid-v5",
  expectedFrames: 479,
  expectedAudio: Object.freeze({
    outputBytes: 4_246_316,
    outputSha256:
      "8cc153e5a5ac151b9a7e6caa66fd8a7a1f39e0ef5789fe911c0f0ba31eac7b45",
    inputContainsNonZeroAudio: true,
    inputNonZeroBytes: 3_703_226,
  }),
});
const V6_SPEC = Object.freeze({
  id: "ts006-answer-feedback-diagnostic-exact-pid-v6",
  expectedFrames: 360,
  expectedAudio: Object.freeze({
    outputBytes: 2_905_219,
    outputSha256:
      "cb23898413627ddd807e3a1b0e12664d96981e4515b58c8a957bcafbc7bc92c0",
    inputContainsNonZeroAudio: false,
    inputNonZeroBytes: 0,
  }),
});

async function json(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

test("TS006 live diagnostic receipt CLI is explicit", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
});

test("both raw capture manifests retain fail-closed identity", async () => {
  const [v5, v6] = await Promise.all([json(V5_MANIFEST), json(V6_MANIFEST)]);
  assert.equal(validateCaptureManifestShape(v5, V5_SPEC), true);
  assert.equal(validateCaptureManifestShape(v6, V6_SPEC), true);

  const tamperedFrame = structuredClone(v5);
  tamperedFrame.frames.pop();
  assert.throws(
    () => validateCaptureManifestShape(tamperedFrame, V5_SPEC),
    /frame count differs/,
  );

  const tamperedFrameHash = structuredClone(v5);
  tamperedFrameHash.frames[0].sha256 = "0".repeat(64);
  await assert.rejects(
    () => verifyCaptureFiles(V5_SPEC, tamperedFrameHash),
    /frame 1 bytes\/hash differ/,
  );

  const wrongPid = structuredClone(v6);
  wrongPid.display.includedProcessID = 12345;
  assert.throws(
    () => validateCaptureManifestShape(wrongPid, V6_SPEC),
    /display exact-PID identity/,
  );

  const promoted = structuredClone(v6);
  promoted.runtimeAuthorityClaimed = true;
  assert.throws(
    () => validateCaptureManifestShape(promoted, V6_SPEC),
    /crossed its authority boundary/,
  );
});

test("checked-in receipt binds verified findings without acceptance", async () => {
  const receipt = await json(REPORT);
  assert.equal(
    validateG4L3Ts006LiveDiagnosticCaptureReceiptV13(receipt),
    receipt,
  );
  assert.equal(receipt.captures[0].frames.count, 479);
  assert.equal(receipt.captures[0].audio.decodedStream.nonZeroSamples, 919_922);
  assert.equal(receipt.captures[1].frames.count, 360);
  assert.equal(receipt.captures[1].audio.decodedStream.nonZeroSamples, 0);
  assert.equal(
    receipt.captures[1].instructionalState.conclusion,
    "stable-question-1-state-with-footer-ui-only-variants-no-visible-feedback",
  );
  assert.equal(receipt.authorityBoundary.runtimeAuthority, false);
  assert.equal(receipt.authorityBoundary.promotionEligible, false);
  assert.equal(receipt.result.strictCompletion, "0/40");
});

test("receipt rejects authority escalation even with a recomputed fingerprint", async () => {
  const receipt = await json(REPORT);
  const mutations = [
    (value) => {
      value.authorityBoundary.runtimeAuthority = true;
    },
    (value) => {
      value.authorityBoundary.promotionEligible = true;
    },
    (value) => {
      value.authorityBoundary.strictCompletion.after = 1;
      value.result.strictCompletion = "1/40";
    },
    (value) => {
      value.missingAuthorityEvidence.networkAudit = {
        invented: true,
      };
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(receipt);
    mutate(changed);
    changed.receiptFingerprintSha256 = receiptFingerprint(changed);
    assert.throws(
      () => validateG4L3Ts006LiveDiagnosticCaptureReceiptV13(changed),
      /authority|invented|acceptance-neutral/,
    );
  }
});

test(
  "live raw artifacts deterministically reproduce the checked-in receipt",
  {timeout: 120_000},
  async () => {
    const [checkedIn, built] = await Promise.all([
      json(REPORT),
      buildG4L3Ts006LiveDiagnosticCaptureReceiptV13(),
    ]);
    assert.deepEqual(built.report, checkedIn);
    assert.equal(
      built.report.captures[0].frames.firstLastRgbComparison.changedPixels,
      168_860,
    );
    assert.deepEqual(
      built.report.captures[1].instructionalState.allFrameDifferenceUnion,
      {
        changedPixels: 582,
        bounds: {minX: 34, minY: 563, maxX: 457, maxY: 575},
      },
    );
  },
);
