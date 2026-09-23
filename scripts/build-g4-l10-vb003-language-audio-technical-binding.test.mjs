import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  ANIMATION_ID,
  OUTPUT_PATH,
  buildReport,
  parseArguments,
  stableJson,
  validateReport,
} from "./build-g4-l10-vb003-language-audio-technical-binding.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let reportPromise;

function report() {
  reportPromise ||= buildReport({root: ROOT});
  return reportPromise;
}

test("builds the exact VB003 EN/ES source-static cue binding", async () => {
  const value = await report();
  assert.equal(value.animationId, ANIMATION_ID);
  assert.equal(value.summary.cueCandidateCount, 2);
  assert.equal(value.summary.languageObligationCount, 2);
  assert.equal(value.summary.hostAudioControlObligationCount, 2);
  assert.equal(value.summary.interactionSynchronizationObligationCount, 3);
  assert.equal(value.summary.adoptedCueCount, 0);

  const embedded = value.cueCandidates.find(({origin}) => origin === "embedded-sound-stream");
  assert.equal(embedded.languageLabel, "und");
  assert.equal(embedded.localFrameDomainId, "sprite-120");
  assert.equal(embedded.firstBlockFrame, 4);
  assert.equal(embedded.lastBlockFrame, 203);
  assert.equal(embedded.runtimeCueTime, null);
  assert.equal(embedded.spokenLanguage, null);

  const spanish = value.cueCandidates.find(({origin}) => origin === "external-host-routed-mp3");
  assert.equal(spanish.routingLanguageCandidate, "es");
  assert.equal(spanish.startSemantics, "host-user-activated");
  assert.equal(spanish.source.sha256, "491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03");
  assert.equal(spanish.startFrame, null);
  assert.equal(spanish.runtimeCueTime, null);
  assert.equal(spanish.spokenLanguage, null);
});

test("binds EN to the unknown embedded candidate and ES to exact SA plus the unknown embedded candidate", async () => {
  const value = await report();
  const byLanguage = new Map(value.languageObligations.map((row) => [row.language, row]));
  assert.deepEqual(byLanguage.get("en").cueCandidateIds, [`${ANIMATION_ID}:embedded-stream-0001`]);
  assert.deepEqual(byLanguage.get("es").cueCandidateIds, [
    `${ANIMATION_ID}:catalog-audio-01`,
    `${ANIMATION_ID}:embedded-stream-0001`,
  ]);
  assert.ok(value.languageObligations.every(({accepted, status}) =>
    accepted === false && status === "unresolved-listening-required"));
});

test("keeps every formal, authority, cue, and acceptance effect false", async () => {
  const value = await report();
  assert.ok(Object.values(value.formalEvidence).every((field) => field === false));
  assert.ok(Object.values(value.authorityBoundary).every((field) => field === false));
  assert.ok(Object.values(value.acceptanceEffects).every((field) => field === false));
  assert.ok(value.cueCandidates.every(({evidenceBoundary}) =>
    Object.values(evidenceBoundary).every((field) => field === false)));
  assert.deepEqual(value.specificationBoundary, {
    localSoundStreamFirstBlockFrame: 4,
    rootOrRuntimeCueTime: null,
    nestedTraceStatus: "unresolved",
    migrationFilesModified: false,
    audioCueAdopted: false,
    keyframeCueTimeAdded: false,
    traceScheduleAdded: false,
    registryOrLedgerModified: false,
    strictAcceptanceEffect: "none",
  });
});

test("is deterministic and matches the generated JSON byte-for-byte", async () => {
  const first = await report();
  const second = await buildReport({root: ROOT});
  assert.equal(stableJson(second), stableJson(first));
  assert.equal(await readFile(path.join(ROOT, OUTPUT_PATH), "utf8"), stableJson(first));
});

test("validator fails closed on invented runtime, spoken-language, or acceptance claims", async () => {
  const original = await report();

  const runtime = structuredClone(original);
  runtime.cueCandidates[0].runtimeCueTime = {rootFrame: 6};
  assert.throws(() => validateReport(runtime), /source-static boundary/);

  const spoken = structuredClone(original);
  spoken.cueCandidates[1].spokenLanguage = "es";
  assert.throws(() => validateReport(spoken), /host-routing boundary/);

  const accepted = structuredClone(original);
  accepted.acceptanceEffects.audioAccepted = true;
  assert.throws(() => validateReport(accepted), /must remain false/);
});

test("defaults to check and requires an explicit non-conflicting write mode", () => {
  assert.deepEqual(parseArguments([]), {root: ROOT, mode: "check", help: false});
  assert.deepEqual(parseArguments(["--write"]), {root: ROOT, mode: "write", help: false});
  assert.deepEqual(parseArguments(["--check"]), {root: ROOT, mode: "check", help: false});
  assert.throws(() => parseArguments(["--check", "--write"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--wat"]), /Unknown option/);
});
