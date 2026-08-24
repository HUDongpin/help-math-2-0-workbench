import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  checkG5L4AudioSpeechPreflight,
  parseArguments,
  stableJson,
  validateG5L4AudioSpeechPreflight,
} from "./build-g5-l4-audio-speech-preflight.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = "reports/g5-l4-current-js-audio-speech-preflight-v1.json";
const GENERATOR_PATH = "scripts/build-g5-l4-audio-speech-preflight.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("checked-in speech preflight binds 185 machine rows without human acceptance", async () => {
  const [reportBytes, generatorBytes] = await Promise.all([
    readFile(path.join(ROOT, REPORT_PATH)),
    readFile(path.join(ROOT, GENERATOR_PATH)),
  ]);
  const report = JSON.parse(reportBytes.toString("utf8"));
  assert.equal(stableJson(report), reportBytes.toString("utf8"));
  assert.equal(validateG5L4AudioSpeechPreflight(report), true);
  assert.deepEqual(report.generator, {
    path: GENERATOR_PATH,
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
  });
  assert.equal(report.tracks.length, 185);
  assert.equal(report.summary.trackCount, 185);
  assert.equal(report.summary.humanReviewedTrackCount, 0);
  assert.equal(report.summary.spokenLanguageEstablishedCount, 0);
  assert.equal(report.tracks.every((track) => track.humanListeningAccepted === false), true);
  assert.equal(report.acceptanceEffects.spokenLanguageEstablished, false);
  assert.equal(report.acceptanceEffects.humanListeningAccepted, false);
  assert.equal(report.acceptanceEffects.ownerAccepted, false);
  assert.equal(report.acceptanceEffects.published, false);
});

test("clean-check verifier rehashes report, listening packet, generator, and 185 MP3s", async () => {
  const report = await checkG5L4AudioSpeechPreflight({projectRoot: ROOT});
  assert.equal(report.status, "machine-speech-preflight-complete-human-review-pending");
  assert.equal(report.model.sha256, "422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898");
  assert.equal(report.model.bytes, 59_707_625);
});

test("speech preflight parser and validator reject acceptance expansion", async () => {
  assert.equal(parseArguments([]).mode, "check");
  assert.equal(parseArguments(["--check"]).mode, "check");
  assert.throws(
    () => parseArguments(["--write", "--results-dir", "/tmp/results"]),
    /requires --results-dir, --model, and --executed-at/,
  );
  assert.throws(() => parseArguments(["--accept"]), /unknown argument/);

  const report = JSON.parse(await readFile(path.join(ROOT, REPORT_PATH), "utf8"));
  const human = structuredClone(report);
  human.summary.humanReviewedTrackCount = 1;
  assert.throws(() => validateG5L4AudioSpeechPreflight(human), /summary changed/);

  const language = structuredClone(report);
  language.tracks[0].spokenLanguageEstablished = true;
  assert.throws(() => validateG5L4AudioSpeechPreflight(language), /machine-only boundary/);

  const accepted = structuredClone(report);
  accepted.acceptanceEffects.ownerAccepted = true;
  assert.throws(() => validateG5L4AudioSpeechPreflight(accepted), /acceptance envelope/);

  const published = structuredClone(report);
  published.tracks[0].acceptanceEffect = "published";
  assert.throws(() => validateG5L4AudioSpeechPreflight(published), /machine-only boundary/);
});
