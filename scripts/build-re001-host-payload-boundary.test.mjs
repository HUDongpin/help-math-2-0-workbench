import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildRe001HostPayloadBoundary,
  normalizeActionScript,
  parseArguments,
  parseMachineScriptBundle,
} from "./build-re001-host-payload-boundary.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const reportRelative =
  "migrations/course-g03-l08-re-001/audit/host-payload-boundary.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readReport() {
  return JSON.parse(await readFile(path.join(root, reportRelative), "utf8"));
}

test("argument parser and ActionScript normalization are explicit", () => {
  assert.deepEqual(parseArguments([]), {check: false, ffdec: "ffdec", root});
  assert.deepEqual(
    parseArguments(["--check", "--ffdec", "/tmp/ffdec", "--root", "/tmp/project"]),
    {check: true, ffdec: "/tmp/ffdec", root: "/tmp/project"},
  );
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
  assert.equal(normalizeActionScript(Buffer.from("one\r\ntwo\r\n\r\n")), "one\ntwo\n");
});

test("machine script bundle parser preserves all six named sections", async () => {
  const {gunzipSync} = await import("node:zlib");
  const bundle = await readFile(
    path.join(
      root,
      "migrations/course-g03-l08-re-001/audit/machine/ffdec-scripts.txt.gz",
    ),
  );
  const records = parseMachineScriptBundle(gunzipSync(bundle));
  assert.deepEqual(records.map(({path: recordPath}) => recordPath), [
    "DefineButton2_75/BUTTONCONDACTION on(release).as",
    "DefineButton2_80/BUTTONCONDACTION on(release).as",
    "DefineButton2_85/BUTTONCONDACTION on(release).as",
    "DefineSprite_621/frame_1/DoAction.as",
    "frame_1/DoAction.as",
    "frame_51/DoAction.as",
  ]);
});

test("checked report re-extracts owner sources and machine evidence deterministically", async () => {
  const result = await buildRe001HostPayloadBoundary({root, check: true});
  assert.equal(result.path, reportRelative);
  assert.equal(
    result.report.status,
    "host-payload-producer-unavailable-cross-reference-bounded",
  );
  assert.deepEqual(result.report.qualificationIssues, []);
});

test("report proves the active XML and same-lesson host payload boundary", async () => {
  const report = await readReport();
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.evidenceType, "re001-host-payload-boundary");
  assert.equal(report.animationId, "course-g03-l08-re-001");
  const generatorRaw = await readFile(path.join(root, report.generatedBy.path));
  assert.equal(report.generatedBy.sha256, sha256(generatorRaw));

  assert.equal(report.activeCourseXml.reviewSectionCount, 0);
  assert.equal(report.activeCourseXml.targetExactPlacementCount, 0);
  assert.equal(report.activeCourseXml.targetBasenameMatchCount, 0);
  assert.equal(report.activeCourseXml.historicalReviewExactPlacementCount, 0);
  assert.deepEqual(report.activeCourseXml.activeFqPages, [
    "FQ/L8FQ01.swf",
    "FQ/L8FQ02.swf",
    "FQ/L8FQ03.swf",
  ]);
  assert.deepEqual(
    report.activeMissingFqSources.map(({expectedPath, exists}) => ({
      expectedPath,
      exists,
    })),
    [
      {
        expectedPath: "HELP_COURSES/ELMGR3/L8/FQ/L8FQ02.swf",
        exists: false,
      },
      {
        expectedPath: "HELP_COURSES/ELMGR3/L8/FQ/L8FQ03.swf",
        exists: false,
      },
    ],
  );

  assert.equal(report.sameLessonHostActionScript.scriptCount, 573);
  assert.ok(
    report.sameLessonHostActionScript.searches.every(
      ({matchingFileCount, occurrenceCount}) =>
        matchingFileCount === 0 && occurrenceCount === 0,
    ),
  );
  assert.equal(report.sameLessonHostActionScript.reviewAnsProducerFound, false);
  assert.equal(report.sameLessonHostActionScript.targetLoaderBindingFound, false);
});

test("report binds empty target fields and exact seven-segment 1..10/Back semantics", async () => {
  const report = await readReport();
  const target = report.targetMachineContract;
  assert.equal(target.exportedScriptCount, 6);
  assert.deepEqual(
    target.rootDynamicFields.map(
      ({instanceName, variableName, initialTextAttributePresent, initialText}) => ({
        instanceName,
        variableName,
        initialTextAttributePresent,
        initialText,
      }),
    ),
    [
      {
        instanceName: "dtfSTUDENT",
        variableName: "STUDENT",
        initialTextAttributePresent: false,
        initialText: null,
      },
      {
        instanceName: "dtfREVIEWANS",
        variableName: "REVIEWANS",
        initialTextAttributePresent: false,
        initialText: null,
      },
    ],
  );
  assert.equal(target.sprite621.splPayload.requiredSegmentCount, 7);
  assert.deepEqual(target.sprite621.splPayload.requiredSegmentIndexes, [
    0, 1, 2, 3, 4, 5, 6,
  ]);
  assert.equal(target.sprite621.splPayload.sourcePayloadAvailable, false);
  assert.equal(target.sprite621.boundedReviewNavigation.reachableCounterLowerBound, 1);
  assert.equal(target.sprite621.boundedReviewNavigation.reachableCounterUpperBound, 10);
  assert.equal(
    target.sprite621.back.sourceOperation,
    'getURL("javascript:history.back()")',
  );
  assert.equal(target.sprite621.back.safeModernExecutionAuthorized, false);
  assert.deepEqual(target.sprite621.structure.frameLabels, [
    "FirstSection",
    ...Array.from({length: 25}, (_, index) => `R${index + 1}`),
  ]);
});

test("historical FQ Review stays cross-reference-only and every acceptance remains false", async () => {
  const report = await readReport();
  const historical = report.historicalFqReviewCrossReference;
  assert.equal(historical.activeExactPlacement, false);
  assert.equal(historical.catalogUnreferenced, true);
  assert.equal(historical.catalogVariantKind, "review");
  assert.equal(historical.scriptCount, 135);
  assert.equal(historical.payloadBuilder.seed.segmentCount, 2);
  assert.equal(historical.payloadBuilder.final.derivedSegmentCount, 7);
  assert.deepEqual(historical.payloadBuilder.final.derivedSegmentOrder, [
    "arrayCorrectAnswer",
    "arrayWrongAnswer",
    "arrayResponseAnswer",
    "quizLabelArray",
    "revLabelArray",
    "arrayAnswer",
    "arrayReview",
  ]);
  assert.equal(historical.payloadTransferIntoL8RE01Observed, false);
  assert.equal(historical.requirementUnlockEffect, "none");
  assert.equal(report.evidenceDelta.requirementsAdded, 0);
  assert.equal(report.evidenceDelta.implementationFramesAdded, 0);
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.ok(
    Object.values(report.boundaryConclusion).every((value) => value === false),
  );
});
