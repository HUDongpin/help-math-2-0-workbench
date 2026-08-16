import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {
  buildListeningReview,
  parseArguments,
  stableJson,
  validateListeningReview,
} from "./build-g5-l4-current-js-audio-listening-review.mjs";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = "reports/g5-l4-current-js-audio-listening-review-v1.json";
const GENERATOR_PATH = "scripts/build-g5-l4-current-js-audio-listening-review.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("checked-in G5 L4 listening packet binds 185 exact decodable tracks and remains unsigned", async () => {
  const [reportBytes, generatorBytes] = await Promise.all([
    readFile(path.join(ROOT, REPORT_PATH)),
    readFile(path.join(ROOT, GENERATOR_PATH)),
  ]);
  const report = JSON.parse(reportBytes.toString("utf8"));
  assert.equal(stableJson(report), reportBytes.toString("utf8"));
  assert.equal(validateListeningReview(report), true);
  assert.deepEqual(report.generator, {
    path: GENERATOR_PATH,
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
  });
  assert.equal(report.pages.length, 54);
  assert.equal(report.tracks.length, 185);
  assert.equal(report.tracks.reduce((sum, track) => sum + track.bytes, 0), 21_055_023);
  assert.equal(report.humanRecordTemplate.reviewerIdentity, null);
  assert.equal(report.ownerGate.accepted, false);
  assert.equal(report.publicationGate.audioEnvironmentEnabled, false);
  assert.equal(report.acceptanceEffects.machineAudioIdentityVerified, true);
  assert.equal(report.acceptanceEffects.humanListeningAccepted, false);
});

test("every listening row rehashes the committed server-only MP3 bytes without private source custody", async () => {
  const report = JSON.parse(
    await readFile(path.join(ROOT, REPORT_PATH), "utf8"),
  );
  for (const track of report.tracks) {
    const bytes = await readFile(path.join(ROOT, track.outputPath));
    assert.equal(bytes.length, track.bytes, `${track.id}: byte count`);
    assert.equal(sha256(bytes), track.sha256, `${track.id}: SHA-256`);
    assert.match(track.route, new RegExp(`\\?sha256=${track.sha256}$`));
  }
});

test("sourceful ffprobe rebuild is deterministic when the recorded tool version is available", async (t) => {
  const reportBytes = await readFile(path.join(ROOT, REPORT_PATH));
  const report = JSON.parse(reportBytes.toString("utf8"));
  const version = await execFileAsync("ffprobe", ["-version"], {encoding: "utf8"})
    .then(({stdout}) => stdout.split(/\r?\n/, 1)[0])
    .catch(() => null);
  if (version !== report.machineProbe.version) {
    t.skip("recorded ffprobe version is not available; exact committed-byte test remains active");
    return;
  }
  const rebuilt = await buildListeningReview({projectRoot: ROOT});
  assert.equal(stableJson(rebuilt), reportBytes.toString("utf8"));
});

test("listening packet validator rejects automated acceptance and publication expansion", async () => {
  assert.deepEqual(parseArguments([]), {help: false, check: true});
  assert.deepEqual(parseArguments(["--write"]), {help: false, check: false});
  assert.throws(() => parseArguments(["--write", "--check"]), /exactly one mode/);
  assert.throws(() => parseArguments(["--accept"]), /unknown argument/);

  const report = JSON.parse(
    await readFile(path.join(ROOT, REPORT_PATH), "utf8"),
  );
  const human = structuredClone(report);
  human.tracks[0].reviewTemplate.reviewerIdentity = "automation";
  assert.throws(() => validateListeningReview(human), /must remain unsigned/);

  const originalRuntime = structuredClone(report);
  originalRuntime.originalRuntimeGate.naturalListeningSessionCount = 1;
  assert.throws(() => validateListeningReview(originalRuntime), /protected gates changed/);

  const published = structuredClone(report);
  published.publicationGate.published = true;
  assert.throws(() => validateListeningReview(published), /protected gates changed/);

  const accepted = structuredClone(report);
  accepted.acceptanceEffects.humanListeningAccepted = true;
  assert.throws(() => validateListeningReview(accepted), /machine-only boundary/);
});
