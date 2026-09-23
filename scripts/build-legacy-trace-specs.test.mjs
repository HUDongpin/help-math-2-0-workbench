import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {gzipSync, gunzipSync} from "node:zlib";

import {LEGACY_PILOT_IDS} from "./build-legacy-scenario-inventories.mjs";
import {
  LEGACY_TRACE_INDEX_BASENAME,
  buildLegacyTraceSpecs,
  parseArguments,
} from "./build-legacy-trace-specs.mjs";
import {inspectPilotTraceEvidence} from "./validate-course-trace-evidence.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execFile = promisify(execFileCallback);
const computeghghParser = path.join(projectRoot, "scripts", "parse-swfmill-root-replay-trace.py");

async function parseComputeghghGeometry(swfmillPath) {
  return execFile("python3", [
    computeghghParser,
    "--swfmill", swfmillPath,
    "--button-object-id", "14",
    "--hit-shape-object-id", "6",
    "--button-frame", "1",
    "--button-depth", "28",
    "--terminal-frame", "35",
  ], {maxBuffer: 1024 * 1024});
}

function mutateComputeghghShape(xml, mutate) {
  const start = xml.indexOf('<DefineShape3 objectID="6">');
  const endMarker = "</DefineShape3>";
  const end = xml.indexOf(endMarker, start);
  assert.notEqual(start, -1, "computeghgh shape 6 start must exist");
  assert.notEqual(end, -1, "computeghgh shape 6 end must exist");
  const afterEnd = end + endMarker.length;
  const originalShape = xml.slice(start, afterEnd);
  const mutatedShape = mutate(originalShape);
  assert.notEqual(mutatedShape, originalShape, "negative fixture must mutate shape 6");
  return `${xml.slice(0, start)}${mutatedShape}${xml.slice(afterEnd)}`;
}

test("parses the isolated legacy trace factory arguments", () => {
  const options = parseArguments(["--check", "--json", "--migrations", "migrations", "--python", "python3"]);
  assert.equal(options.check, true);
  assert.equal(options.json, true);
  assert.equal(options.migrationsRoot, path.resolve("migrations"));
  assert.equal(options.python, "python3");
  assert.throws(() => parseArguments(["--migrations"]), /requires a value/);
  assert.throws(() => parseArguments(["--python"]), /requires a value/);
  assert.throws(() => parseArguments(["--id", LEGACY_PILOT_IDS[0]]), /Unknown option/);
});

test("checked-in legacy trace specs deterministically derive only the source-proven computeghgh Replay schedule", async () => {
  const result = await buildLegacyTraceSpecs({check: true});
  assert.deepEqual({
    action: result.action,
    pilotCount: result.pilotCount,
    requirementCount: result.requirementCount,
    unresolvedCount: result.unresolvedCount,
    frameAccurateRootReadyCount: result.frameAccurateRootReadyCount,
    naturalScheduleReadyCount: result.naturalScheduleReadyCount,
  }, {
    action: "verified",
    pilotCount: 6,
    requirementCount: 12,
    unresolvedCount: 0,
    frameAccurateRootReadyCount: 10,
    naturalScheduleReadyCount: 2,
  });

  const index = JSON.parse(await readFile(path.join(projectRoot, "migrations", LEGACY_TRACE_INDEX_BASENAME), "utf8"));
  assert.equal(index.artifactType, "legacy-pilot-trace-spec-index");
  assert.deepEqual(index.pilots.map(({animationId}) => animationId), LEGACY_PILOT_IDS);
  assert.equal(index.pilots.every(({traceSpecs}) => traceSpecs.every(({file}) => file.includes("/audit/trace-specs/"))), true);
  assert.equal(index.strictAcceptanceEffect.startsWith("none;"), true);

  const compute = index.pilots.find(({animationId}) => animationId === "keyterm-elementary-computeghgh");
  assert.equal(compute.unresolvedCount, 0);
  assert.equal(compute.naturalScheduleReadyCount, 2);
  assert.equal(compute.traceSpecs.every(({status}) => status === "source-schedule-ready-for-authoritative-execution"), true);
  assert.equal(index.status, "all-traces-ready-for-authoritative-execution");
  for (const pilot of index.pilots.filter(({animationId}) => animationId !== compute.animationId)) {
    assert.equal(pilot.frameAccurateRootReadyCount, 2);
    assert.equal(pilot.traceSpecs.every(({status}) => status === "source-frame-accurate-root-ready-for-authoritative-capture"), true);
  }
});

test("computeghgh EN/ES trace specs bind the exact source release-inside hit target and 35-to-1 Replay wrap", async () => {
  const workspace = path.join(projectRoot, "migrations", "keyterm-elementary-computeghgh");
  for (const language of ["en", "es"]) {
    const spec = JSON.parse(await readFile(path.join(
      workspace,
      "audit",
      "trace-specs",
      `req-root-default-${language}.json`,
    ), "utf8"));
    assert.equal(spec.traceSpecStatus, "source-schedule-ready-for-authoritative-execution");
    assert.equal(spec.schedule.status, "source-evidenced-executable");
    assert.deepEqual(spec.unresolvedMappings, []);
    assert.equal(spec.schedule.orderedSteps.length, 1);
    const step = spec.schedule.orderedSteps[0];
    assert.equal(step.action.sourceCondition, "pointerReleaseInside");
    assert.equal(step.action.sourceCommand, "GotoFrame(0); Play");
    assert.deepEqual(step.action.exactPointerDecimals, {x: "184.85", y: "200"});
    assert.equal(step.sourceTarget.buttonObjectId, 14);
    assert.equal(step.sourceTarget.selectedHitShapeObjectId, 6);
    assert.equal(step.sourceTarget.depth, 28);
    assert.deepEqual(step.sourceTarget.activeFrameRange, {firstFrame: 1, lastFrame: 35});
    assert.equal(
      step.sourceTarget.sourceFillInteriorProof.proofConclusion,
      "point-strictly-inside-opaque-source-fill",
    );
    assert.deepEqual(
      step.sourceTarget.sourceFillInteriorProof.centralRectangleTwips,
      {bottom: 72, left: -1467, right: -491, top: -213},
    );
    assert.equal(
      step.sourceTarget.sourceFillInteriorProof.boundary.canonicalSegmentsSha256,
      "e3c74404392222ff5201e9d203b5d0bd05df67e48540f5324cf8b32fbd2784bc",
    );
    assert.equal(step.preStateCheckpoint.expectedState.rootFrame, 35);
    assert.equal(step.preStateCheckpoint.expectedState.rootPlayState, "stopped");
    assert.equal(step.postStateCheckpoint.expectedState.rootFrame, 1);
    assert.equal(step.postStateCheckpoint.expectedState.rootPlayState, "playing");
    assert.equal(spec.schedule.terminalSemantics.traceEnd, "post-replay-root-frame-1-playing");
    assert.equal(spec.schedule.terminalSemantics.expectedState.requiredLanguage, language);
    assert.equal(spec.sourceBindings.scheduleDerivation.executionEvidenceCreated, false);
    assert.equal(spec.executionEvidence.executionReport, null);
    assert.equal(spec.executionEvidence.originalRuntimeCaptureManifest, null);
    assert.equal(spec.strictAcceptanceEffect.startsWith("none;"), true);
  }
});

test("computeghgh geometry parser fails closed for hollow and inward-concave hit shapes", async () => {
  const source = path.join(
    projectRoot,
    "migrations",
    "keyterm-elementary-computeghgh",
    "audit",
    "machine",
    "swfmill.xml.gz",
  );
  const xml = gunzipSync(await readFile(source)).toString("utf8");
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "computeghgh-replay-geometry-"));
  const cases = [
    {
      name: "hollow",
      expectedFailure: /selected hit shape has no opaque source fill/,
      xml: mutateComputeghghShape(xml, (shape) => shape.replace(
        /<Color red="255" green="255" blue="255" alpha="255"\s*\/>/,
        '<Color red="255" green="255" blue="255" alpha="0"/>',
      )),
    },
    {
      name: "inward-concave",
      expectedFailure: /expected exactly one exact closed opaque fill interior proof, observed 0/,
      xml: mutateComputeghghShape(xml, (shape) => shape.replace(
        /<CurveTo x1="-60" y1="0" x2="-41" y2="42"\s*\/>/,
        '<CurveTo x1="1100" y1="0" x2="-1201" y2="42"/>',
      )),
    },
  ];
  try {
    for (const fixture of cases) {
      const fixturePath = path.join(temporaryDirectory, `${fixture.name}.xml.gz`);
      await writeFile(fixturePath, gzipSync(Buffer.from(fixture.xml, "utf8")));
      await assert.rejects(
        parseComputeghghGeometry(fixturePath),
        (error) => {
          assert.match(`${error.message}\n${error.stderr || ""}`, fixture.expectedFailure);
          return true;
        },
        `${fixture.name} geometry must not produce an executable pointer target`,
      );
    }
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});

test("legacy trace inspection is read-only and distinguishes ready instructions from absent authority", async () => {
  const formula = await inspectPilotTraceEvidence({animationId: "formula-elementary-conversion-01-01"});
  assert.equal(formula.applicable, true);
  assert.equal(formula.failureCount, 0);
  assert.equal(formula.readySpecCount, 2);
  assert.equal(formula.unresolvedCount, 2);
  assert.equal(formula.ok, false);

  const compute = await inspectPilotTraceEvidence({animationId: "keyterm-elementary-computeghgh"});
  assert.equal(compute.applicable, true);
  assert.equal(compute.failureCount, 0);
  assert.equal(compute.readySpecCount, 2);
  assert.equal(compute.unresolvedSpecCount, 0);
  assert.equal(compute.unresolvedCount, 2);
  assert.equal(compute.ok, false);
});
