import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  ANIMATION_ID,
  OUTPUT_RELATIVE_PATH,
  buildShellSourceEventFragments,
  deriveAuthorityBoundary,
  deriveHitGeometry,
  parseArguments,
  parseFfdecScriptBlocks,
  parseSwfmillShellStructure,
} from "./build-shell-g04-l01-source-event-fragments.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("CLI exposes build/check paths but no acceptance or execution mode", () => {
  assert.deepEqual(parseArguments([]), {check: false, root, output: OUTPUT_RELATIVE_PATH});
  assert.deepEqual(parseArguments(["--check", "--root", "/tmp/shell-root", "--output", "evidence.json"]), {
    check: true,
    root: "/tmp/shell-root",
    output: "evidence.json",
  });
  assert.deepEqual(parseArguments(["--help"]), {check: false, root, output: OUTPUT_RELATIVE_PATH, help: true});
  assert.throws(() => parseArguments(["--accept"]), /Unknown argument/);
  assert.throws(() => parseArguments(["--root"]), /requires a value/);
});

test("FFDec parser preserves exact source lines and hashes normalized script bodies", () => {
  const source = [
    "===== frame_1/DoAction.as =====",
    "stop();",
    "",
    "===== DefineButton2_7/BUTTONCONDACTION on(release).as =====",
    "on(release){",
    "   play();",
    "}",
    "",
  ].join("\r\n");
  const parsed = parseFfdecScriptBlocks(source);
  assert.equal(parsed.blocks.length, 2);
  assert.deepEqual(parsed.blocks[0], {
    script: "frame_1/DoAction.as",
    headingLine: 1,
    bodyLineStart: 2,
    bodyLineEnd: 2,
    lineStart: 1,
    lineEnd: 2,
    body: "stop();",
    bodySha256: sha256("stop();"),
  });
  assert.equal(parsed.blocks[1].headingLine, 4);
  assert.equal(parsed.blocks[1].lineEnd, 7);
  assert.equal(parsed.blocks[1].bodySha256, sha256("on(release){\n   play();\n}"));
});

test("swfmill geometry composes nested source matrices with exact terminating decimals", () => {
  const xml = `<?xml version="1.0"?>
<swf><Header framerate="12" frames="1"><size><Rectangle left="0" right="16000" top="0" bottom="12000"/></size><tags>
<DefineShape3 objectID="10"><bounds><Rectangle left="0" right="20" top="0" bottom="20"/></bounds></DefineShape3>
<DefineButton2 objectID="11"><buttons><Button hitTest="1" objectID="10" depth="1"><transform><Transform transX="0" transY="0"/></transform></Button></buttons><conditions/></DefineButton2>
<DefineSprite objectID="20" frames="1"><tags><PlaceObject2 depth="1" objectID="11"><transform><Transform scaleX="2" scaleY="3" transX="10" transY="20"/></transform></PlaceObject2><ShowFrame/></tags></DefineSprite>
<PlaceObject2 depth="2" objectID="20" name="child"><transform><Transform scaleX="2" scaleY="2" transX="100" transY="200"/></transform></PlaceObject2><ShowFrame/>
</tags></Header></swf>`;
  const structure = parseSwfmillShellStructure(xml);
  const geometry = deriveHitGeometry(structure, {
    id: "fixture",
    buttonObjectId: "11",
    hitShapeObjectId: "10",
    placementChain: [
      {timelineId: "root", frame: 1, depth: "2", objectId: "20", name: "child"},
      {timelineId: "sprite-20", frame: 1, depth: "1", objectId: "11", name: ""},
    ],
  });
  assert.deepEqual(geometry.bounds.exactDecimals, {
    left: "6",
    right: "10",
    top: "12",
    bottom: "18",
    width: "4",
    height: "6",
  });
  assert.deepEqual(geometry.interiorPoint.exactDecimals, {x: "8", y: "15"});
  assert.deepEqual(geometry.interiorPoint.numeric, {x: 8, y: 15});
  assert.deepEqual(geometry.derivationOrder, [
    "root-placement",
    "sprite-20-placement",
    "button-hit-record",
    "shape-bounds",
    "twips-to-pixels",
  ]);
});

function fakeAuthorityDocuments() {
  const scenarios = [
    "default",
    "section-ir",
    "section-rw",
    "section-vb",
    "section-in",
    "section-ti",
    "section-gs",
    "section-ts",
    "section-fq",
    "quit-confirmation",
  ];
  const requirements = scenarios.flatMap((scenario) => ["en", "es"].map((language) => ({
    requirementId: `req:root:${scenario}:${language}`,
    scenario,
    language,
    frameDomainId: "root",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 50},
    entryStateSha256: sha256(`${scenario}:${language}`),
    status: "blocked",
    baselineAuthority: "unresolved",
    capturedFrameCount: 0,
    missingFrames: Array.from({length: 50}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  })));
  const traceSpecs = new Map(requirements.map((requirement) => [requirement.requirementId, {
    path: `trace-specs/${requirement.requirementId.replaceAll(":", "-")}.json`,
    sha256: sha256(requirement.requirementId),
    value: {
      animationId: ANIMATION_ID,
      requirementId: requirement.requirementId,
      traceSpecStatus: "unresolved",
      schedule: {
        status: "unresolved-no-complete-source-event-schedule",
        orderedSteps: [],
        terminalSemantics: {status: "unresolved"},
      },
    },
  }]));
  return {coverage: {schemaVersion: 2, animationId: ANIMATION_ID, requirements}, traceSpecs};
}

test("authority boundary is fail-closed for every one of the 20 requirements", () => {
  const documents = fakeAuthorityDocuments();
  const boundary = deriveAuthorityBoundary(documents);
  assert.equal(boundary.requirementCount, 20);
  assert.equal(boundary.sourceEvidencedExecutableRequirementCount, 0);
  assert.equal(boundary.unresolvedRequirementCount, 20);
  assert.equal(boundary.implementationCapturedRequirementCount, 0);
  assert.equal(boundary.implementationCapturedFrameCount, 0);
  assert.equal(boundary.implementationCaptureAuthority, "none");
  assert.equal(boundary.allRequirementsRemainUnresolved, true);
  assert.equal(boundary.mayPopulateTraceSpecOrderedSteps, false);
  assert.equal(boundary.strictAcceptanceEffect, "none");

  const changedSpec = fakeAuthorityDocuments();
  const first = changedSpec.traceSpecs.values().next().value;
  first.value.traceSpecStatus = "source-evidenced-executable";
  assert.throws(() => deriveAuthorityBoundary(changedSpec), /trace spec must remain unresolved/);

  const changedCoverage = fakeAuthorityDocuments();
  changedCoverage.coverage.requirements[0].capturedFrameCount = 1;
  assert.throws(() => deriveAuthorityBoundary(changedCoverage), /must be either 0 or the complete 50-frame requirement/);

  const implementationCapture = fakeAuthorityDocuments();
  const captured = implementationCapture.coverage.requirements[0];
  captured.capturedFrameCount = 50;
  captured.missingFrames = [];
  captured.captureManifest = "output/playwright/schema-v4/req-root-default-en/capture-manifest.json";
  captured.captureManifestSha256 = sha256("implementation capture");
  const captureBoundary = deriveAuthorityBoundary(implementationCapture);
  assert.equal(captureBoundary.implementationCapturedRequirementCount, 1);
  assert.equal(captureBoundary.implementationCapturedFrameCount, 50);
  assert.equal(captureBoundary.implementationCaptureAuthority, "non-authoritative-current-javascript-output-only");
  assert.equal(captureBoundary.sourceEvidencedExecutableRequirementCount, 0);
  assert.equal(captureBoundary.unresolvedRequirementCount, 20);
  assert.equal(captureBoundary.requirements[0].implementationCaptureAuthority,
    "non-authoritative-current-javascript-output-only");
  assert.equal(captureBoundary.requirements[0].sourceEventFragmentEligibility,
    "unresolved-complete-schedule-not-proven");
  assert.equal(captureBoundary.baselineFramesCapturedByThisArtifact, 0);
  assert.equal(captureBoundary.visualOrRmseAcceptanceGranted, false);
  assert.equal(captureBoundary.humanOrOwnerAcceptanceGranted, false);
  assert.equal(captureBoundary.strictAcceptanceEffect, "none");

  const unboundImplementationCapture = fakeAuthorityDocuments();
  unboundImplementationCapture.coverage.requirements[0].capturedFrameCount = 50;
  unboundImplementationCapture.coverage.requirements[0].missingFrames = [];
  assert.throws(() => deriveAuthorityBoundary(unboundImplementationCapture),
    /requires a project-relative Playwright capture manifest/);

  const baselinePromotion = fakeAuthorityDocuments();
  baselinePromotion.coverage.requirements[0].baselineCaptureManifest = "baseline/capture-manifest.json";
  baselinePromotion.coverage.requirements[0].baselineCaptureManifestSha256 = sha256("baseline");
  assert.throws(() => deriveAuthorityBoundary(baselinePromotion),
    /original-runtime baseline capture binding must remain absent/);

  const metricsPromotion = fakeAuthorityDocuments();
  metricsPromotion.coverage.requirements[0].metricsFile = "evidence/full-frame-metrics.json";
  metricsPromotion.coverage.requirements[0].metricsSha256 = sha256("metrics");
  assert.throws(() => deriveAuthorityBoundary(metricsPromotion),
    /paired baseline\/implementation metrics must remain absent/);
});

test("checked-in shell artifact rehashes, preserves exact fragments, and grants no acceptance", async () => {
  const result = await buildShellSourceEventFragments({root, check: true});
  const outputBytes = await readFile(path.join(root, OUTPUT_RELATIVE_PATH));
  const document = JSON.parse(outputBytes);
  const generatorBytes = await readFile(path.join(root, "scripts/build-shell-g04-l01-source-event-fragments.mjs"));
  assert.equal(result.sha256, sha256(outputBytes));
  assert.equal(document.generatedBy.scriptSha256, sha256(generatorBytes));
  assert.equal(document.evidenceStatus, "static-source-event-fragments-runtime-unverified");
  assert.equal(document.precondition.checkpointId, "P0");
  assert.equal(document.precondition.status, "blocked-unresolved");
  assert.equal(document.fragments.length, 9);
  assert.deepEqual(document.fragments.map(({fragmentId}) => fragmentId), [
    "M1", "M2-RW", "M2-VB", "M2-IN", "M2-TI", "M2-GS", "M2-TS", "M2-FQ", "Q1",
  ]);
  assert.deepEqual(document.fragments.map(({action}) => action.pointer.exactDecimals), [
    {x: "92.35", y: "568.25"},
    {x: "103.132734592159977193572998046875", y: "213.6"},
    {x: "103.08290928018977866658935546875", y: "260.3"},
    {x: "103.132734592159977193572998046875", y: "307.1"},
    {x: "103.082721652305917825201416015625", y: "353.8"},
    {x: "103.132540494349086667999267578125", y: "400.55"},
    {x: "103.132721652305917825201416015625", y: "447.3"},
    {x: "103.082721652305917825201416015625", y: "494.05"},
    {x: "771.37749977111816405", y: "21.2"},
  ]);
  assert.deepEqual(document.fragments.slice(1, 8).map(({immediatePostState}) => immediatePostState.mapTimeline.frame),
    [9, 18, 28, 9, 9, 38, 9]);
  assert.ok(document.fragments.every(({fragmentStatus}) => fragmentStatus.endsWith("runtime-unverified")));
  assert.ok(document.fragments.every(({executableRequirementEffect}) => executableRequirementEffect === "none"));
  assert.equal(document.authorityBoundary.requirementCount, 20);
  assert.equal(document.authorityBoundary.sourceEvidencedExecutableRequirementCount, 0);
  assert.equal(document.authorityBoundary.unresolvedRequirementCount, 20);
  assert.equal(document.authorityBoundary.implementationCapturedRequirementCount, 20);
  assert.equal(document.authorityBoundary.implementationCapturedFrameCount, 1000);
  assert.equal(document.authorityBoundary.implementationCaptureAuthority,
    "non-authoritative-current-javascript-output-only");
  assert.ok(document.authorityBoundary.requirements.every(({coverageStatus}) => coverageStatus === "blocked"));
  assert.ok(document.authorityBoundary.requirements.every(({capturedFrameCount}) => capturedFrameCount === 50));
  assert.ok(document.authorityBoundary.requirements.every(({implementationCaptureAuthority}) => (
    implementationCaptureAuthority === "non-authoritative-current-javascript-output-only"
  )));
  assert.ok(document.authorityBoundary.requirements.every(({traceSpec}) => traceSpec.status === "unresolved" && traceSpec.orderedStepCount === 0));
  assert.equal(document.languageAndSeedBoundary.spanishWholeShellEntryProven, false);
  assert.equal(document.languageAndSeedBoundary.seedToLegacyPrngMappingProven, false);
  assert.equal(document.authorityBoundary.originalRuntimeExecutedByThisArtifact, false);
  assert.equal(document.authorityBoundary.baselineFramesCapturedByThisArtifact, 0);
  assert.equal(document.authorityBoundary.visualOrRmseAcceptanceGranted, false);
  assert.equal(document.authorityBoundary.audioAcceptanceGranted, false);
  assert.equal(document.authorityBoundary.humanOrOwnerAcceptanceGranted, false);
  assert.equal(document.strictAcceptanceEffect, "none");
  assert.equal(document.sourceBindings.sourceSwf.sha256,
    "ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e");
  assert.equal(document.sourceBindings.courseXml.sha256,
    "b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2");
  const manifest = JSON.parse(await readFile(path.join(root, "migrations/shell-course-g04-l01-index-local/migration.json"), "utf8"));
  const coverage = JSON.parse(await readFile(path.join(root, "migrations/shell-course-g04-l01-index-local/evidence/full-frame-coverage.json"), "utf8"));
  assert.deepEqual(document.sourceBindings.migrationManifest, {
    path: "migrations/shell-course-g04-l01-index-local/migration.json",
    hashMode: CANONICAL_PROJECTION_ENCODING,
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    sha256: technicalManifestSha256(manifest),
  });
  assert.deepEqual(document.sourceBindings.fullFrameCoverage, {
    path: "migrations/shell-course-g04-l01-index-local/evidence/full-frame-coverage.json",
    hashMode: CANONICAL_PROJECTION_ENCODING,
    projection: TRACE_COVERAGE_PROJECTION.id,
    sha256: traceCoverageSha256(coverage),
  });
  assert.equal(document.sourceBindings.shellExecutionExclusion.sha256,
    "d5f25737cfab3dfdd96704378962a2e4fadc208729f5909b36ecc0d11a97a408");
});
