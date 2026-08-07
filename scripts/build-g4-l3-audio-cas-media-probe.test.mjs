import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildObjectProbeRecord,
  normalizeFfprobePayload,
  parseArguments,
  renderG4L3AudioCasMediaProbeMarkdown,
  validateG4L3AudioCasMediaProbe,
} from "./build-g4-l3-audio-cas-media-probe.mjs";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function probePayload() {
  return {
    streams: [{
      index: 0,
      codec_name: "mp3",
      codec_long_name: "MP3",
      codec_type: "audio",
      sample_fmt: "fltp",
      sample_rate: "22050",
      channels: 1,
      channel_layout: "mono",
      bits_per_sample: 0,
      time_base: "1/14112000",
      start_pts: 0,
      start_time: "0.000000",
      duration_ts: 8128512,
      duration: "0.576000",
      bit_rate: "40000",
    }],
    format: {
      format_name: "mp3",
      format_long_name: "MP2/3",
      start_time: "0.000000",
      duration: "0.576000",
      size: "2880",
      bit_rate: "40000",
      probe_score: 51,
    },
    frames: [{nb_samples: 576}, {nb_samples: 576}],
  };
}

function objectFixture(bytes = Buffer.from("fixture-audio")) {
  return {
    path: `artifacts/g4-l3-embedded-audio/sha256/aa/${digest(bytes)}.mp3`,
    sha256: digest(bytes),
    byteLength: bytes.length,
    formatCode: 2,
    sourceAudioUnitReferenceCount: 1,
    logicalPayloadIdentityCount: 1,
  };
}

test("ffprobe normalizer retains codec/container/timing and sums tool-supported frame samples", () => {
  const normalized = normalizeFfprobePayload(probePayload());
  assert.equal(normalized.codec.name, "mp3");
  assert.equal(normalized.container.formatName, "mp3");
  assert.equal(normalized.audio.sampleRateHz, 22050);
  assert.equal(normalized.audio.channels, 1);
  assert.equal(normalized.timing.durationSeconds, 0.576);
  assert.deepEqual(normalized.sampleCount, {
    toolSupported: true,
    basis: "sum-of-ffprobe-frame-nb_samples",
    decodedAudioFrameCount: 2,
    framesWithSampleCount: 2,
    value: 1152,
  });
});

test("object probe is read-only, acceptance-neutral, and binds successful parse/decode facts", () => {
  const bytes = Buffer.from("fixture-audio");
  const record = buildObjectProbeRecord({
    object: objectFixture(bytes),
    sourceBytes: bytes,
    postProbeBytes: Buffer.from(bytes),
    ffprobeResult: {exitCode: 0, signal: null, stdout: JSON.stringify(probePayload()), stderr: ""},
    ffmpegResult: {exitCode: 0, signal: null, stdout: "", stderr: ""},
    root: "/fixture-root",
  });
  assert.equal(record.probeStatus, "ffprobe-parsed-ffmpeg-decode-check-passed");
  assert.equal(record.casObject.unchangedByProbe, true);
  assert.equal(record.media.sampleCount.value, 1152);
  assert.ok(Object.values(record.evidenceLimits).every((value) => value === false));
  assert.match(record.objectProbeFingerprintSha256, /^[a-f0-9]{64}$/);
});

test("process addresses are normalized so parse-failure evidence is deterministic", () => {
  const bytes = Buffer.alloc(0);
  const object = objectFixture(bytes);
  const build = (address) => buildObjectProbeRecord({
    object,
    sourceBytes: bytes,
    postProbeBytes: bytes,
    ffprobeResult: {exitCode: 1, signal: null, stdout: "{\n}\n", stderr: "input.bin: Invalid data\n"},
    ffmpegResult: {
      exitCode: 183,
      signal: null,
      stdout: "",
      stderr: `[in#0 @ ${address}] Error opening input: Invalid data\n`,
    },
    root: "/fixture-root",
  });
  const left = build("0x123abc");
  const right = build("0xdef456");
  assert.equal(left.probeStatus, "ffprobe-parse-failed");
  assert.equal(left.ffmpegDecodeToNull.stderr.text, "[in#0 @ <process-address>] Error opening input: Invalid data\n");
  assert.equal(left.objectProbeFingerprintSha256, right.objectProbeFingerprintSha256);
});

test("checked-in 88-object technical probe is deterministic and aggregates all 359 references", async () => {
  const [json, markdown] = await Promise.all([
    readFile(new URL("../reports/g4-l3-audio-cas-media-probe.json", import.meta.url), "utf8"),
    readFile(new URL("../reports/g4-l3-audio-cas-media-probe.md", import.meta.url), "utf8"),
  ]);
  const report = validateG4L3AudioCasMediaProbe(JSON.parse(json));
  assert.equal(markdown, renderG4L3AudioCasMediaProbeMarkdown(report));
  assert.equal(report.summary.casObjectCount, 88);
  assert.equal(report.summary.casObjectBytes, 5710816);
  assert.equal(report.summary.ffprobeParsedObjectCount, 86);
  assert.equal(report.summary.ffprobeParseFailedObjectCount, 2);
  assert.equal(report.summary.ffmpegDecodeCheckPassedObjectCount, 86);
  assert.equal(report.summary.sampleCountToolSupportedObjectCount, 86);
  assert.equal(report.summary.sourceAudioUnitReferenceCount, 359);
  assert.equal(report.summary.ffprobeParsedReferenceCount, 161);
  assert.equal(report.summary.ffprobeParseFailedReferenceCount, 198);
  const failures = report.casObjectProbes.filter((probe) => probe.probeStatus === "ffprobe-parse-failed");
  assert.deepEqual(failures.map((probe) => probe.casObject.formatCodeFromSwf).sort(), [0, 1]);
  assert.ok(report.casObjectProbes.every((probe) => probe.casObject.unchangedByProbe));
});

test("validator rejects acceptance promotion, stale tool, archive, and unit-reference evidence", async () => {
  const source = JSON.parse(await readFile(
    new URL("../reports/g4-l3-audio-cas-media-probe.json", import.meta.url),
    "utf8",
  ));
  const cases = [
    [(report) => { report.acceptance.listeningAcceptanceEstablished = true; }, /must remain false/],
    [(report) => { report.sourceBindings.tools.ffprobe.executableSha256 = "bad"; }, /ffprobe executable/],
    [(report) => { report.casObjectProbes[0].casObject.unchangedByProbe = false; }, /mutation\/hash boundary/],
    [(report) => { report.itemReferences[0].units[0].unitReferenceFingerprintSha256 = "0".repeat(64); }, /stale unit reference fingerprint/],
  ];
  for (const [mutate, pattern] of cases) {
    const report = structuredClone(source);
    mutate(report);
    assert.throws(() => validateG4L3AudioCasMediaProbe(report), pattern);
  }
});

test("CLI exposes fail-closed check and explicit tool bindings", () => {
  assert.deepEqual(parseArguments(["--check", "--ffprobe", "/tool/ffprobe", "--ffmpeg", "/tool/ffmpeg"]), {
    check: true,
    ffprobeCommand: "/tool/ffprobe",
    ffmpegCommand: "/tool/ffmpeg",
    jsonOutput: "reports/g4-l3-audio-cas-media-probe.json",
    markdownOutput: "reports/g4-l3-audio-cas-media-probe.md",
  });
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
