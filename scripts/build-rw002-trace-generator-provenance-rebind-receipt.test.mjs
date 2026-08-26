import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  RW002_TRACE_REBIND_RECEIPT,
  buildRw002TraceGeneratorProvenanceRebindReceipt,
  jsonDifferencePointers,
  parseArguments,
  reconstructHistoricalRw002Trace,
  validateRw002TraceGeneratorProvenanceRebindReceipt,
} from "./build-rw002-trace-generator-provenance-rebind-receipt.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const receiptPath = path.join(projectRoot, RW002_TRACE_REBIND_RECEIPT);
const englishTracePath = path.join(
  projectRoot,
  "migrations/course-g05-l13-rw-002/audit/trace-specs/req-sprite-334-default-en.json",
);

function fingerprint(value) {
  return createHash("sha256")
    .update(`${JSON.stringify(value, null, 2)}\n`)
    .digest("hex");
}

test("RW002 trace-generator rebind CLI is explicit", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
});

test("RW002 trace-generator rebind receipt covers EN/ES and stays neutral", async () => {
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  assert.equal(
    validateRw002TraceGeneratorProvenanceRebindReceipt(receipt),
    receipt,
  );
  assert.deepEqual(
    receipt.nestedTraces.map(({language}) => language),
    ["en", "es"],
  );
  assert.equal(
    receipt.nestedTraces.every(
      (trace) =>
        trace.historicalHashReconstructed === true &&
        trace.sourceInputsUnchangedAcrossTransition === true &&
        trace.changedJsonPointers.length === 1,
    ),
    true,
  );
  assert.equal(receipt.currentTraceIndex.current, true);
  assert.equal(receipt.verification.legacyPreimageCopiedIntoProject, false);
  assert.equal(receipt.authorityBoundary.strictAcceptanceEffect, "none");
  assert.equal(receipt.authorityBoundary.strictCompletionCreated, false);
  assert.equal(receipt.authorityBoundary.publicReleaseAuthorized, false);
});

test("RW002 prior English trace hash is reconstructed through one pointer only", async () => {
  const trace = JSON.parse(await readFile(englishTracePath, "utf8"));
  const transition = {
    language: "en",
    requirementId: "req:sprite-334:default:en",
    traceId: "trace:sprite-334:default:en:seed-0",
    bytes: 28_992,
    historicalSha256:
      "a77ffc7b52a12c1023122d37d250e607adaa7b34e3ab170a380d84c85705589e",
  };
  const reconstructed = reconstructHistoricalRw002Trace(trace, transition);
  assert.deepEqual(reconstructed.changedJsonPointers, [
    "/sourceBindings/scheduleDerivation/generator/sha256",
  ]);
  assert.equal(
    createHash("sha256").update(reconstructed.rendered).digest("hex"),
    transition.historicalSha256,
  );
  assert.deepEqual(
    jsonDifferencePointers(reconstructed.historicalTrace, trace),
    reconstructed.changedJsonPointers,
  );
});

test("RW002 trace-generator rebind rejects authority promotion and extra drift", async () => {
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  const promoted = structuredClone(receipt);
  promoted.authorityBoundary.strictCompletionCreated = true;
  delete promoted.receiptFingerprintSha256;
  promoted.receiptFingerprintSha256 = fingerprint(promoted);
  assert.throws(
    () => validateRw002TraceGeneratorProvenanceRebindReceipt(promoted),
    /crossed an authority boundary/,
  );

  const extraDrift = {
    sourceBindings: {
      scheduleDerivation: {
        generator: {sha256: "current"},
        unexpected: true,
      },
    },
  };
  const prior = structuredClone(extraDrift);
  prior.sourceBindings.scheduleDerivation.generator.sha256 = "historical";
  delete prior.sourceBindings.scheduleDerivation.unexpected;
  assert.deepEqual(jsonDifferencePointers(prior, extraDrift), [
    "/sourceBindings/scheduleDerivation/generator/sha256",
    "/sourceBindings/scheduleDerivation/unexpected",
  ]);
});

test("checked-in RW002 trace-generator rebind receipt is reproducible", async () => {
  const result =
    await buildRw002TraceGeneratorProvenanceRebindReceipt({check: true});
  assert.equal(result.animationId, "course-g05-l13-rw-002");
  assert.equal(result.traceCount, 2);
  assert.equal(result.everyHistoricalTraceHashReconstructed, true);
  assert.equal(result.sourceInputsUnchanged, true);
  assert.equal(result.currentIndexVerified, true);
  assert.equal(result.strictAcceptanceEffect, "none");
});
