import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {link, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import test from "node:test";

import {
  assertSafeReportOutput,
  buildCatalogProbeRecord,
  parseArguments,
  renderMarkdown,
  validateG4L3CatalogAudioMediaProbe,
  writeOrCheckReport,
} from "./build-g4-l3-catalog-audio-media-probe.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const execFileAsync = promisify(execFile);

function payload() {
  return {
    streams: [{index: 0, codec_name: "mp3", codec_long_name: "MP3", codec_type: "audio", sample_fmt: "fltp", sample_rate: "22050", channels: 1, channel_layout: "mono", time_base: "1/14112000", start_pts: 0, start_time: "0.000000", duration_ts: 8128512, duration: "0.576000", bit_rate: "40000"}],
    format: {format_name: "mp3", format_long_name: "MP2/3", start_time: "0.000000", duration: "0.576000", size: "2880", bit_rate: "40000", probe_score: 51},
    frames: [{nb_samples: 576}, {nb_samples: 576}],
  };
}

test("catalog probe binds unchanged bytes and technical parse/decode facts", () => {
  const bytes = Buffer.from("catalog-audio-fixture");
  const record = buildCatalogProbeRecord({
    source: {path: "source-assets/fixture.mp3", bytes: bytes.length, sha256: digest(bytes), catalogLanguage: "und", normalizedLanguage: "es", animationIds: ["a"]},
    beforeBytes: bytes,
    afterBytes: Buffer.from(bytes),
    ffprobeResult: {exitCode: 0, signal: null, stdout: JSON.stringify(payload()), stderr: ""},
    ffmpegResult: {exitCode: 0, signal: null, stdout: "", stderr: ""},
  });
  assert.equal(record.source.unchangedByProbe, true);
  assert.equal(record.probe.media.sampleCount.value, 1152);
  assert.equal(record.probe.ffmpegDecodeToNull.decodeCheckPassed, true);
  assert.equal(record.evidenceLimits.spokenLanguageEstablished, false);
});

test("checked report covers all 143 catalog MP3 files and remains acceptance-neutral", async () => {
  const [json, markdown] = await Promise.all([
    readFile(new URL("../reports/g4-l3-catalog-audio-media-probe.json", import.meta.url), "utf8"),
    readFile(new URL("../reports/g4-l3-catalog-audio-media-probe.md", import.meta.url), "utf8"),
  ]);
  const report = validateG4L3CatalogAudioMediaProbe(JSON.parse(json));
  assert.equal(markdown, `${renderMarkdown(report)}\n`);
  assert.equal(report.summary.sourceFileCount, 143);
  assert.equal(report.summary.sourceBytes, 17798855);
  assert.equal(report.summary.ffprobeParsedCount, 143);
  assert.equal(report.summary.ffmpegDecodeCheckPassedCount, 143);
  assert.equal(report.summary.listeningReviews, 0);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("validator rejects authority promotion, missing probes, and changed source facts", async () => {
  const source = JSON.parse(await readFile(new URL("../reports/g4-l3-catalog-audio-media-probe.json", import.meta.url), "utf8"));
  const cases = [
    [(report) => { report.acceptance.listeningAccepted = true; }, /acceptance state drifted/],
    [(report) => { report.authorityBoundary.sourceAudioPlayed = true; }, /authority boundary/],
    [(report) => { report.probes[0].source.unchangedByProbe = false; }, /fingerprint|stale, failed, or over-claimed/],
    [(report) => { report.summary.ffprobeParsedCount = 142; }, /ffprobeParsedCount|technical probes are incomplete/],
  ];
  for (const [mutate, pattern] of cases) {
    const report = structuredClone(source);
    mutate(report);
    assert.throws(() => validateG4L3CatalogAudioMediaProbe(report), pattern);
  }
});

test("validator rehashes every probe and recomputes every derived summary aggregate", async () => {
  const source = JSON.parse(await readFile(new URL("../reports/g4-l3-catalog-audio-media-probe.json", import.meta.url), "utf8"));
  const probeMutations = [
    ["duration", (report) => { report.probes[0].probe.media.timing.durationSeconds += 0.125; }],
    ["sample rate", (report) => { report.probes[0].probe.media.audio.sampleRateHz += 1; }],
    ["path", (report) => { report.probes[0].source.path = report.probes[0].source.path.replace(/\.mp3$/, "-mutated.mp3"); }],
    ["hash", (report) => { report.probes[0].source.sha256 = "0".repeat(64); }],
    ["reference", (report) => { report.probes[0].source.referencedByAnimationIds[0] += "-mutated"; }],
    ["language", (report) => { report.probes[0].source.catalogLanguage = report.probes[0].source.catalogLanguage === "en" ? "es" : "en"; }],
    ["fingerprint", (report) => { report.probes[0].probeFingerprintSha256 = "0".repeat(64); }],
  ];
  for (const [label, mutate] of probeMutations) {
    const report = structuredClone(source);
    mutate(report);
    assert.throws(
      () => validateG4L3CatalogAudioMediaProbe(report),
      /fingerprint|source totals|language|reference|identity/,
      `${label} mutation was not rejected`,
    );
  }

  const summaryMutations = {
    sourceFileCount: (report) => { report.summary.sourceFileCount += 1; },
    sourceBytes: (report) => { report.summary.sourceBytes += 1; },
    sourceReferenceCount: (report) => { report.summary.sourceReferenceCount += 1; },
    animationsWithCatalogAudio: (report) => { report.summary.animationsWithCatalogAudio += 1; },
    catalogLanguageCounts: (report) => { report.summary.catalogLanguageCounts.en += 1; },
    normalizedLanguageCandidateCounts: (report) => { report.summary.normalizedLanguageCandidateCounts.es += 1; },
    ffprobeParsedCount: (report) => { report.summary.ffprobeParsedCount -= 1; },
    ffmpegDecodeCheckPassedCount: (report) => { report.summary.ffmpegDecodeCheckPassedCount -= 1; },
    sampleCountToolSupportedCount: (report) => { report.summary.sampleCountToolSupportedCount -= 1; },
    probeSetSha256: (report) => { report.summary.probeSetSha256 = "0".repeat(64); },
  };
  for (const [field, mutate] of Object.entries(summaryMutations)) {
    const report = structuredClone(source);
    mutate(report);
    assert.throws(
      () => validateG4L3CatalogAudioMediaProbe(report),
      new RegExp(field),
      `${field} summary mutation was not rejected`,
    );
  }
});

test("CLI exposes only explicit build/check and tool bindings", () => {
  const options = parseArguments(["--check", "--ffprobe", "/tool/ffprobe", "--ffmpeg", "/tool/ffmpeg"]);
  assert.equal(options.check, true);
  assert.equal(options.ffprobeCommand, "/tool/ffprobe");
  assert.equal(options.ffmpegCommand, "/tool/ffmpeg");
  assert.throws(() => parseArguments(["--listen"]), /Unknown option/);
  assert.throws(() => parseArguments(["--accept"]), /Unknown option/);
});

test("report outputs reject links and wrong extensions while check mode never writes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-l3-catalog-audio-report-output-"));
  try {
    const reports = path.join(root, "reports");
    const outside = path.join(root, "outside");
    await Promise.all([mkdir(reports), mkdir(outside)]);

    const checked = path.join(reports, "checked.json");
    await writeFile(checked, "sentinel\n");
    await writeOrCheckReport(checked, "sentinel\n", {root, extension: ".json", check: true});
    await assert.rejects(
      writeOrCheckReport(checked, "replacement\n", {root, extension: ".json", check: true}),
      /missing or stale/,
    );
    assert.equal(await readFile(checked, "utf8"), "sentinel\n");

    const missing = path.join(reports, "missing.json");
    await assert.rejects(
      writeOrCheckReport(missing, "created\n", {root, extension: ".json", check: true}),
      /missing or stale/,
    );
    await assert.rejects(readFile(missing), {code: "ENOENT"});

    const wrongExtension = path.join(reports, "wrong.txt");
    await writeFile(wrongExtension, "extension sentinel\n");
    await assert.rejects(
      writeOrCheckReport(wrongExtension, "replacement\n", {root, extension: ".json"}),
      /end in \.json/,
    );
    assert.equal(await readFile(wrongExtension, "utf8"), "extension sentinel\n");
    await assert.rejects(
      assertSafeReportOutput(path.join(outside, "outside.json"), {root, extension: ".json"}),
      /inside/,
    );

    const componentSentinel = path.join(outside, "component.json");
    await writeFile(componentSentinel, "component sentinel\n");
    await symlink(outside, path.join(reports, "escape"));
    await assert.rejects(
      writeOrCheckReport(path.join(reports, "escape", "component.json"), "replacement\n", {root, extension: ".json"}),
      /symbolic-link/,
    );
    assert.equal(await readFile(componentSentinel, "utf8"), "component sentinel\n");

    const symlinkSentinel = path.join(outside, "target.json");
    const symlinkOutput = path.join(reports, "target.json");
    await writeFile(symlinkSentinel, "symlink sentinel\n");
    await symlink(symlinkSentinel, symlinkOutput);
    await assert.rejects(
      writeOrCheckReport(symlinkOutput, "replacement\n", {root, extension: ".json"}),
      /symbolic-link/,
    );
    assert.equal(await readFile(symlinkSentinel, "utf8"), "symlink sentinel\n");

    const hardlinkSentinel = path.join(outside, "hardlink.json");
    const hardlinkOutput = path.join(reports, "hardlink.json");
    await writeFile(hardlinkSentinel, "hardlink sentinel\n");
    await link(hardlinkSentinel, hardlinkOutput);
    await assert.rejects(
      writeOrCheckReport(hardlinkOutput, "replacement\n", {root, extension: ".json"}),
      /hard-linked/,
    );
    assert.equal(await readFile(hardlinkSentinel, "utf8"), "hardlink sentinel\n");
    assert.equal(await readFile(hardlinkOutput, "utf8"), "hardlink sentinel\n");

    const fifoOutput = path.join(reports, "fifo.json");
    await execFileAsync("mkfifo", [fifoOutput]);
    await assert.rejects(
      writeOrCheckReport(fifoOutput, "replacement\n", {root, extension: ".json"}),
      /existing regular file/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
