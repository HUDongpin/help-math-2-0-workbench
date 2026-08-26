import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  parseArguments,
  renderG4L3Vb006SourcePreflightMarkdown,
  validateG4L3Vb006SourcePreflight,
} from "./build-g4-l3-vb006-source-preflight.mjs";

const REPORT_URL = new URL("../reports/g4-l3-vb006-source-preflight.json", import.meta.url);
const MARKDOWN_URL = new URL("../reports/g4-l3-vb006-source-preflight.md", import.meta.url);

async function checkedInReport() {
  return JSON.parse(await readFile(REPORT_URL, "utf8"));
}

test("VB006 source preflight is hash-bound, bounded, and acceptance-neutral", async () => {
  const report = validateG4L3Vb006SourcePreflight(await checkedInReport());

  assert.equal(report.source.swf.sha256,
    "e83889619f1a162491b2d7bbc720be78c5ca1eda7f6348680a949e5a71e90168");
  assert.equal(report.source.fla.sha256,
    "44ce279b65a6ffb552dc8f0b4f10f9bdc05b5bfe874bf6de574ef2cce418f058");
  assert.equal(report.timeline.root.frameCount, 10);
  assert.equal(report.timeline.main.frameDomain, "sprite-44");
  assert.equal(report.timeline.main.frameCount, 163);
  assert.deepEqual(report.timeline.main.sourceStaticPlacementActivityFrameCandidates,
    [1, 32, 107, 113, 116, 123, 125, 127, 129]);
  assert.equal(report.actionScript.buttonHandlers.length, 4);
  assert.deepEqual(report.actionScript.buttonHandlers.map((button) => button.keyAttribute),
    ["Zero", "Value", "Positive number", "Negative number"]);
  assert.equal(report.audio.embedded.blockCount, 157);
  assert.equal(report.audio.embedded.decodeToNullPassed, true);
  assert.equal(report.audio.catalogAssociated.decodeToNullPassed, true);
  assert.equal(report.canvasPreflight.safeAdapterInMemoryBuild.persistedRendererFiles, 0);
  assert.equal(report.candidateDisposition.boundedSourceStaticDrawingCandidateTechnicallySupported, true);
  assert.equal(report.candidateDisposition.completeCurrentJavascriptCandidateSourceSupported, false);
  assert.equal(report.candidateDisposition.permissionToImplement, false);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
});

test("VB006 Markdown is reproducible from the checked-in JSON report", async () => {
  const [report, markdown] = await Promise.all([
    checkedInReport(),
    readFile(MARKDOWN_URL, "utf8"),
  ]);

  assert.equal(markdown, renderG4L3Vb006SourcePreflightMarkdown(
    validateG4L3Vb006SourcePreflight(report),
  ));
  assert.match(markdown, /Full current-JavaScript candidate source-supported now: \*\*false\*\*/);
  assert.match(markdown, /permission to implement remains \*\*false\*\*/);
  assert.match(markdown, /\*\*0 renderer files were persisted\*\*/);
});

test("VB006 validator fails closed on acceptance or candidate promotion", async () => {
  const original = await checkedInReport();

  const accepted = structuredClone(original);
  accepted.acceptance.ownerAccepted = true;
  assert.throws(
    () => validateG4L3Vb006SourcePreflight(accepted),
    /acceptance fields must all remain false/,
  );

  const authorized = structuredClone(original);
  authorized.candidateDisposition.permissionToImplement = true;
  assert.throws(
    () => validateG4L3Vb006SourcePreflight(authorized),
    /promoted beyond the audit boundary/,
  );

  const production = structuredClone(original);
  production.candidateDisposition.productionAdmission = true;
  assert.throws(
    () => validateG4L3Vb006SourcePreflight(production),
    /promoted beyond the audit boundary/,
  );
});

test("VB006 validator rejects source, timeline, audio, and fingerprint drift", async () => {
  const original = await checkedInReport();
  const cases = [
    ["source", (report) => { report.source.swf.sha256 = "0"; }, /source identities/],
    ["timeline", (report) => { report.timeline.main.frameCount = 162; }, /timeline contract/],
    ["audio", (report) => { report.audio.embedded.blockCount = 156; }, /audio inventory/],
    ["fingerprint", (report) => { report.classification.titleDisplay = "Changed"; }, /fingerprint is stale/],
  ];

  for (const [label, mutate, pattern] of cases) {
    const report = structuredClone(original);
    mutate(report);
    assert.throws(() => validateG4L3Vb006SourcePreflight(report), pattern, label);
  }
});

test("VB006 CLI exposes only read-only probe and check options", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    python: "python3",
    ffprobe: "ffprobe",
    ffmpeg: "ffmpeg",
  });
  assert.deepEqual(
    parseArguments([
      "--check",
      "--ffdec", "/tools/ffdec",
      "--swfmill", "/tools/swfmill",
      "--python", "/tools/python3",
      "--ffprobe", "/tools/ffprobe",
      "--ffmpeg", "/tools/ffmpeg",
    ]),
    {
      check: true,
      ffdec: "/tools/ffdec",
      swfmill: "/tools/swfmill",
      python: "/tools/python3",
      ffprobe: "/tools/ffprobe",
      ffmpeg: "/tools/ffmpeg",
    },
  );
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
});
