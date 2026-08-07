import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  VARIANTS,
  compareScriptExports,
  normalizeActionScript,
  parseArguments,
} from "./build-fq002-review-variant-binding.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const reportRelative = "migrations/course-g03-l06-fq-002-review/audit/fq002-review-variant-binding.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function syntheticExport(entries, indexSha = "index") {
  return {
    records: entries.map(({path: relativePath, body}) => ({
      path: relativePath,
      normalizedSha256: sha256(Buffer.from(body)),
    })),
    summary: {pathAndBytesIndexSha256: indexSha},
  };
}

test("argument parser exposes deterministic generate/check modes", () => {
  assert.deepEqual(parseArguments([]), {check: false, ffdec: "ffdec", root});
  assert.deepEqual(parseArguments([
    "--check",
    "--ffdec", "/tmp/ffdec",
    "--root", "/tmp/project",
  ]), {check: true, ffdec: "/tmp/ffdec", root: "/tmp/project"});
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("ActionScript normalization is exact and line-ending independent", () => {
  assert.equal(normalizeActionScript(Buffer.from("one\r\ntwo\r\n\r\n")), "one\ntwo\n");
  assert.equal(normalizeActionScript(Buffer.from("one\rtwo\r")), "one\ntwo\n");
  assert.equal(normalizeActionScript(Buffer.from("one\ntwo\n")), "one\ntwo\n");
});

test("script comparison preserves multiplicity and distinguishes path identity from body identity", () => {
  const left = syntheticExport([
    {path: "a.as", body: "shared"},
    {path: "b.as", body: "shared"},
    {path: "c.as", body: "left"},
  ], "left-index");
  const right = syntheticExport([
    {path: "renumbered-a.as", body: "shared"},
    {path: "d.as", body: "right"},
  ], "right-index");
  const comparison = compareScriptExports("left", left, "right", right);
  assert.equal(comparison.sharedBodyCount, 1);
  assert.equal(comparison.normalizedBodyMultisetsEqual, false);
  assert.equal(comparison.pathAndBytesIndexesEqual, false);
  assert.deepEqual(comparison.leftOnly.map(({count, paths}) => ({count, paths})), [
    {count: 1, paths: ["c.as"]},
    {count: 1, paths: ["b.as"]},
  ]);
  assert.deepEqual(comparison.rightOnly.map(({count, paths}) => ({count, paths})), [
    {count: 1, paths: ["d.as"]},
  ]);

  const renumbered = syntheticExport([
    {path: "x.as", body: "shared"},
    {path: "y.as", body: "left"},
    {path: "z.as", body: "shared"},
  ], "renumbered-index");
  const equalBodies = compareScriptExports("left", left, "renumbered", renumbered);
  assert.equal(equalBodies.sharedBodyCount, 3);
  assert.equal(equalBodies.normalizedBodyMultisetsEqual, true);
  assert.equal(equalBodies.pathAndBytesIndexesEqual, false);
});

test("checked report binds all three distinct frozen SWFs and the active XML conflict", async () => {
  const reportRaw = await readFile(path.join(root, reportRelative));
  const report = JSON.parse(reportRaw);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.artifactType, "help-math-fq002-review-variant-binding");
  assert.equal(report.animationId, "course-g03-l06-fq-002-review");
  assert.equal(report.bindingStatus, "source-variant-relationship-proven-runtime-host-unresolved");
  assert.equal(report.generator.path, "scripts/build-fq002-review-variant-binding.mjs");
  const generatorRaw = await readFile(path.join(root, report.generator.path));
  assert.equal(sha256(generatorRaw), report.generator.sha256);

  const expectedSources = {
    "active-course-placement": [1361425, "230abcb4302068f31589b6947eb53cb7c12f95ff87077f1b58fdb8e41928bf80"],
    "review-pilot-source": [1363405, "fadffa9df169b4c3417066431f8bfbc16a923778ec17a213b21a7ba2d0a51563"],
    "missing-audio-button-history": [1356867, "99ac64f66bc43420430d06ca0f93df2dc14af65504c24f7abeaa379dfe86d1fc"],
  };
  assert.deepEqual(report.sources.map(({id}) => id), VARIANTS.map(({id}) => id));
  for (const source of report.sources) {
    const raw = await readFile(path.join(root, source.path));
    assert.equal(raw.length, expectedSources[source.id][0], source.id);
    assert.equal(sha256(raw), expectedSources[source.id][1], source.id);
    assert.equal(source.sha256, expectedSources[source.id][1], source.id);
    assert.equal(source.catalogBindingStatus, "verified-current-frozen-source", source.id);
  }
  assert.equal(new Set(report.sources.map(({sha256: value}) => value)).size, 3);

  const courseXmlRaw = await readFile(path.join(root, report.courseXml.path));
  assert.equal(sha256(courseXmlRaw), report.courseXml.sha256);
  assert.deepEqual(report.courseXml.activeBasenameMatches, [{
    line: 164,
    text: '<Page Title="Page 1" RandomAudio="" BGText="" Navigation="OFF">FQ/L6FQ02.swf</Page>',
  }]);
  assert.equal(report.courseXml.reviewExactPlacementCount, 0);
  assert.equal(report.courseXml.missingAudioButtonExactPlacementCount, 0);

  const inventoryRaw = await readFile(path.join(root, "migrations/course-g03-l06-fq-002-review", report.scenarioInventory.path.replace("migrations/course-g03-l06-fq-002-review/", "")));
  assert.equal(sha256(inventoryRaw), report.scenarioInventory.sha256);
  assert.equal(report.scenarioInventory.currentPlacementMatchStatus, "basename-only-conflict");
  assert.equal(report.scenarioInventory.exactPlacement, null);
  assert.match(report.strictAcceptanceEffect, /^none;/);
  assert.ok(report.authorityStatement.every((statement) => !/strict (?:complete|accepted)|faithful/i.test(statement)));
});

test("checked report proves exactly the bounded script-body relationships and two semantic deltas", async () => {
  const report = await readJson(reportRelative);
  for (const exported of Object.values(report.scriptExports)) assert.equal(exported.scriptCount, 150);
  assert.equal(report.scriptExports["active-course-placement"].normalizedBodyMultisetSha256,
    "3d7287cac6e4d40e85b018cce23496fa551325f088caa652e5571ae373ff22ea");
  assert.equal(report.scriptExports["review-pilot-source"].normalizedBodyMultisetSha256,
    "e85f51983e96cbca5305c01f542fe19b6ed6f71d7884adc56171c1c4f4919e15");
  assert.equal(report.scriptExports["missing-audio-button-history"].normalizedBodyMultisetSha256,
    "e85f51983e96cbca5305c01f542fe19b6ed6f71d7884adc56171c1c4f4919e15");

  const [activeReview, activeMissing, reviewMissing] = report.pairwiseScriptBodyComparisons;
  assert.deepEqual([activeReview.sharedBodyCount, activeMissing.sharedBodyCount, reviewMissing.sharedBodyCount], [148, 148, 150]);
  assert.deepEqual([activeReview.leftOnly.length, activeReview.rightOnly.length], [2, 2]);
  assert.deepEqual([activeMissing.leftOnly.length, activeMissing.rightOnly.length], [2, 2]);
  assert.deepEqual([reviewMissing.leftOnly.length, reviewMissing.rightOnly.length], [0, 0]);
  assert.equal(reviewMissing.normalizedBodyMultisetsEqual, true);
  assert.equal(reviewMissing.pathAndBytesIndexesEqual, false);

  assert.deepEqual(report.provenSemanticDeltasBetweenActiveAndReview.map(({id}) => id), [
    "finish-score-field",
    "terminal-button-release",
  ]);
  assert.equal(report.provenSemanticDeltasBetweenActiveAndReview[0].active.rawSha256,
    "6bc233ce1b89ed3819951a8836b0dd0d7ea8cb2e5d15e8646c3f6b95ac9dbc66");
  assert.equal(report.provenSemanticDeltasBetweenActiveAndReview[0].review.rawSha256,
    "9df2de68181dcb47d44c587c14e510a50ae5afa80a3d9ca09eb8b8a359312bd5");
  assert.equal(report.provenSemanticDeltasBetweenActiveAndReview[1].active.rawSha256,
    "e247ae39aabc621f0ae1f861ff9bf20dc89d16b6b0ef8e1ccd8d5d16c346aaef");
  assert.equal(report.provenSemanticDeltasBetweenActiveAndReview[1].review.rawSha256,
    "3d582f1c6fe806de3fa82bdb96fe8f44034b85fd3c6942511c90b58589c45305");
  assert.ok(report.variantRelationships.every(({aliasEligible}) => aliasEligible === false));
});
