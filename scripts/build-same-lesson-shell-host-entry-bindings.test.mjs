import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  TARGETS,
  deriveTargetEntryBinding,
  normalizeActionScript,
  parseArguments,
  parseHostStructure,
} from "./build-same-lesson-shell-host-entry-bindings.mjs";
import {buildEvidenceDependencyReport} from "./audit-course-evidence-dependencies.mjs";
import {scenarioInventorySha256} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");

const EXPECTED = Object.freeze({
  "course-g03-l01-vb-004": Object.freeze({
    childSha256: "8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e",
    hostSha256: "69d0f39b3e7b4e93f7354f7096a2c38f2335277aec116b8d9bf35d740a571a8f",
    courseXmlSha256: "f803cd0f01016385e8fd6d2ad11ee2b5379c82f252015999c62727c7fd581443",
    courseXmlLine: 48,
    childRelative: "VB/L1VB04.swf",
    preloaderObjectId: 179,
    preloaderFrameCount: 3,
    targetObjectId: 231,
    targetTimelineId: "sprite-231",
    targetDepth: 4,
    normalizedHostExcerpts: [
      "6bf7e12013255f6b14ee4e415135fa8ea08cb6b05e3b837174ead2cbfbfbeffc",
      "5ddff1cbdcbbd78927c49c707b0509cb040fad56bcda963156934cc3f972e2fc",
      "c9b24d3bf25d6a41fd70cdcfd7fc0d0c9a7edd4b6ae0a94fb89f542441940da2",
      "e8947f523ba7efed833d3ba70fc3e0550c3b4a0522251bfda9af41ea2145719a",
    ],
  }),
  "course-g04-l01-ir-001": Object.freeze({
    childSha256: "b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46",
    hostSha256: "ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e",
    courseXmlSha256: "b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2",
    courseXmlLine: 25,
    childRelative: "IR/L1RW01.swf",
    preloaderObjectId: 176,
    preloaderFrameCount: 28,
    targetObjectId: 58,
    targetTimelineId: "sprite-58",
    targetDepth: 1,
    normalizedHostExcerpts: [
      "038e5a73651f1e00b94cb6cbd0696bb10e40b7d4153f68aa99f76d536b9856aa",
      "2b1efd3c0b47b527f65a129226c18e9cc7eabcbad09ca389e3406177e095a417",
      "c9b24d3bf25d6a41fd70cdcfd7fc0d0c9a7edd4b6ae0a94fb89f542441940da2",
      "e8947f523ba7efed833d3ba70fc3e0550c3b4a0522251bfda9af41ea2145719a",
    ],
  }),
  "course-g04-l03-in-009": Object.freeze({
    childSha256: "766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c",
    hostSha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
    courseXmlSha256: "0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0",
    courseXmlLine: 77,
    childRelative: "IN/L3IN09.swf",
    preloaderObjectId: 176,
    preloaderFrameCount: 28,
    targetObjectId: 200,
    targetTimelineId: "sprite-200",
    targetDepth: 4,
    normalizedHostExcerpts: [
      "038e5a73651f1e00b94cb6cbd0696bb10e40b7d4153f68aa99f76d536b9856aa",
      "2b1efd3c0b47b527f65a129226c18e9cc7eabcbad09ca389e3406177e095a417",
      "c9b24d3bf25d6a41fd70cdcfd7fc0d0c9a7edd4b6ae0a94fb89f542441940da2",
      "e8947f523ba7efed833d3ba70fc3e0550c3b4a0522251bfda9af41ea2145719a",
    ],
  }),
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

test("argument parser exposes deterministic all-target, selected, and check modes", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    root,
    ids: TARGETS.map(({animationId}) => animationId),
  });
  assert.deepEqual(parseArguments([
    "--check",
    "--id", "course-g04-l03-in-009",
    "--id", "course-g04-l03-in-009",
    "--ffdec", "/tmp/ffdec",
    "--swfmill", "/tmp/swfmill",
    "--root", "/tmp/project",
  ]), {
    check: true,
    ffdec: "/tmp/ffdec",
    swfmill: "/tmp/swfmill",
    root: "/tmp/project",
    ids: ["course-g04-l03-in-009"],
  });
  assert.throws(() => parseArguments(["--id", "unknown"]), /Unsupported animation ID/);
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("ActionScript normalization is exact and line-ending independent", () => {
  const crlf = Buffer.from("first\r\nsecond\r\n\r\n");
  const cr = Buffer.from("first\rsecond\r");
  const lf = Buffer.from("first\nsecond\n");
  assert.equal(normalizeActionScript(crlf), "first\nsecond\n");
  assert.equal(normalizeActionScript(cr), "first\nsecond\n");
  assert.equal(normalizeActionScript(lf), "first\nsecond\n");
});

test("host structure parser binds the preloader definition, labels, and root instances", () => {
  const preloaderFrames = [
    '<FrameLabel label="inactive">',
    "</FrameLabel>",
    "<ShowFrame/>",
    ...Array.from({length: 9}, () => "<ShowFrame/>"),
    '<FrameLabel label="jump_check">',
    "</FrameLabel>",
    "<ShowFrame/>",
    ...Array.from({length: 8}, () => "<ShowFrame/>"),
    '<FrameLabel label="done">',
    "</FrameLabel>",
    "<ShowFrame/>",
  ];
  const xml = Buffer.from([
    "<swf><Header><tags>",
    '<DefineSprite objectID="176" frames="28">',
    "<tags>",
    ...preloaderFrames,
    "</tags>",
    "</DefineSprite>",
    '<PlaceObject2 replace="0" depth="47" objectID="170" name="animation_mc">',
    "</PlaceObject2>",
    '<PlaceObject2 replace="0" depth="508" objectID="176" name="InternalPreloader">',
    "</PlaceObject2>",
    "<ShowFrame/>",
    "</tags></Header></swf>",
  ].join("\n"));
  const config = TARGETS.find(({animationId}) => animationId === "course-g04-l01-ir-001");
  const parsed = parseHostStructure(xml, config);
  assert.equal(parsed.status, "source-structure-proven-runtime-unverified");
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.preloaderDefinition.objectId, 176);
  assert.equal(parsed.preloaderDefinition.frameCount, 28);
  assert.deepEqual(parsed.preloaderLabels.map(({label, frame}) => ({label, frame})), [
    {label: "inactive", frame: 1},
    {label: "jump_check", frame: 11},
    {label: "done", frame: 20},
  ]);
  assert.equal(parsed.animationMcPlacement.objectId, 170);
  assert.equal(parsed.internalPreloaderPlacement.objectId, 176);

  const ambiguous = Buffer.from(xml.toString("utf8").replace(
    "</tags></Header></swf>",
    '<PlaceObject2 replace="0" depth="509" objectID="176" name="InternalPreloader">\n</PlaceObject2>\n</tags></Header></swf>',
  ));
  const blocked = parseHostStructure(ambiguous, config);
  assert.equal(blocked.status, "blocked-unresolved");
  assert.match(blocked.issues.join("\n"), /exactly one root InternalPreloader placement/);
});

test("current scenario inventories uniquely bind exact active placement and begin target", async () => {
  for (const target of TARGETS) {
    const inventory = await readJson(`migrations/${target.animationId}/audit/scenario-inventory.json`);
    const binding = deriveTargetEntryBinding(inventory);
    const expected = EXPECTED[target.animationId];
    assert.equal(binding.status, "source-structure-proven-runtime-unverified", target.animationId);
    assert.deepEqual(binding.issues, [], target.animationId);
    assert.deepEqual(binding.entryTarget, {
      rootTimelineId: "root",
      label: "begin",
      frame: 6,
      instanceName: "animation",
      objectId: expected.targetObjectId,
      timelineId: expected.targetTimelineId,
      depth: expected.targetDepth,
      placementTag: "PlaceObject2",
      hasClipActions: false,
    });
    assert.equal(binding.observations.childRelativeToLesson, expected.childRelative);
  }
});

test("missing or ambiguous target evidence remains blocked and is never inferred", async () => {
  const inventory = await readJson("migrations/course-g03-l01-vb-004/audit/scenario-inventory.json");
  const missingLabel = structuredClone(inventory);
  const rootTimeline = missingLabel.coverage.timelineStateCoverage.find(({timelineId}) => timelineId === "root");
  rootTimeline.frameLabels = [];
  const missingResult = deriveTargetEntryBinding(missingLabel);
  assert.equal(missingResult.status, "blocked-unresolved");
  assert.equal(missingResult.entryTarget, null);
  assert.match(missingResult.issues.join("\n"), /begin label/);

  const ambiguousPlacement = structuredClone(inventory);
  const ambiguousRoot = ambiguousPlacement.coverage.timelineStateCoverage.find(({timelineId}) => timelineId === "root");
  ambiguousRoot.namedPlacements.push({...ambiguousRoot.namedPlacements.find(({name}) => name === "animation"), depth: "99"});
  const ambiguousResult = deriveTargetEntryBinding(ambiguousPlacement);
  assert.equal(ambiguousResult.status, "blocked-unresolved");
  assert.equal(ambiguousResult.entryTarget, null);
  assert.match(ambiguousResult.issues.join("\n"), /exactly one child root animation placement/);

  const wrongXml = structuredClone(inventory);
  wrongXml.courseXml.currentPlacement.matchStatus = "basename-only";
  const wrongXmlResult = deriveTargetEntryBinding(wrongXml);
  assert.equal(wrongXmlResult.status, "blocked-unresolved");
  assert.equal(wrongXmlResult.entryTarget, null);
  assert.match(wrongXmlResult.issues.join("\n"), /not exact-active-page/);
});

test("checked-in reports bind current source bytes, technical inventory, scripts, and explicit authority limits", async () => {
  const generatorRaw = await readFile(path.join(root, "scripts/build-same-lesson-shell-host-entry-bindings.mjs"));
  for (const target of TARGETS) {
    const id = target.animationId;
    const expected = EXPECTED[id];
    const report = await readJson(`migrations/${id}/audit/same-lesson-shell-host-entry-binding.json`);
    const inventoryRaw = await readFile(path.join(root, `migrations/${id}/audit/scenario-inventory.json`));
    const inventory = JSON.parse(inventoryRaw);
    assert.equal(report.schemaVersion, 1, id);
    assert.equal(report.artifactType, "help-math-same-lesson-shell-host-entry-binding", id);
    assert.equal(report.animationId, id);
    assert.equal(report.bindingStatus, "static-candidate-runtime-unverified", id);
    assert.deepEqual(report.protocol.qualificationIssues, [], id);
    assert.equal(report.sources.targetChild.sha256, expected.childSha256, id);
    assert.equal(report.sources.sameLessonHost.sha256, expected.hostSha256, id);
    assert.equal(report.sources.courseXml.sha256, expected.courseXmlSha256, id);
    assert.equal(report.sources.courseXml.exactActivePlacementLine.line, expected.courseXmlLine, id);
    assert.match(report.sources.courseXml.exactActivePlacementLine.text, new RegExp(`${expected.childRelative.replaceAll(".", "\\.")}<\\/Page>`), id);
    for (const source of Object.values(report.sources)) {
      const raw = await readFile(path.join(root, source.path));
      assert.equal(sha256(raw), source.sha256, source.path);
      assert.equal(raw.length, source.bytes, source.path);
    }
    assert.equal(report.scenarioInventory.fullFileSha256, sha256(inventoryRaw), id);
    assert.equal(report.scenarioInventory.technicalSha256, scenarioInventorySha256(inventory), id);
    assert.equal(report.scenarioInventory.sha256, report.scenarioInventory.technicalSha256, id);
    assert.equal(report.scenarioInventory.projection, "help-math-scenario-inventory-technical-v1", id);
    assert.equal(report.generatedBy.scriptSha256, sha256(generatorRaw), id);
    assert.equal(report.protocol.sameLessonHostStructure.preloaderDefinition.objectId, expected.preloaderObjectId, id);
    assert.equal(report.protocol.sameLessonHostStructure.preloaderDefinition.frameCount, expected.preloaderFrameCount, id);
    assert.equal(report.protocol.sameLessonHostStructure.animationMcPlacement.instanceName, "animation_mc", id);
    assert.equal(report.protocol.sameLessonHostStructure.internalPreloaderPlacement.instanceName, "InternalPreloader", id);
    assert.equal(report.protocol.targetRootEntry.frame, 6, id);
    assert.equal(report.protocol.targetRootEntry.label, "begin", id);
    assert.equal(report.protocol.targetRootEntry.instanceName, "animation", id);
    assert.equal(report.protocol.targetRootEntry.objectId, expected.targetObjectId, id);
    assert.equal(report.protocol.childEntryRequest.excerpts[0].normalizedSha256,
      "8edb4298364fccc1a492b99afd35910c38775e841df758cc2f8f09063e448862", id);
    assert.deepEqual(
      report.protocol.sameLessonHostActionScript.excerpts.map(({normalizedSha256}) => normalizedSha256),
      expected.normalizedHostExcerpts,
      id,
    );
    assert.equal(report.spanishQualification.globalSpanishEntryProtocolProven, false, id);
    assert.equal(report.spanishQualification.status, "separate-blocker-unresolved", id);
    assert.equal(report.authority.staticSameLessonHandoffCandidateProven, true, id);
    assert.equal(report.authority.authorizedOriginalRuntimeReachedTarget, false, id);
    assert.equal(report.authority.naturalEntryTimingProven, false, id);
    assert.equal(report.authority.feedbackFunctionsProven, false, id);
    assert.equal(report.authority.audioExecutedOrListened, false, id);
    assert.equal(report.authority.terminalOrReplayProven, false, id);
    assert.equal(report.authority.fullShellTerminalSemanticsProven, false, id);
    assert.equal(report.authority.eventFreeFullShellTerminalProof, false, id);
    assert.equal(report.authority.fidelityClaimed, false, id);
    assert.equal(report.authority.strictCompletionEffect, "none", id);
    assert.equal(report.authority.migrationStatusChanged, false, id);
    assert.match(report.limitations.join("\n"), /human review, owner acceptance/);
  }
});

test("dependency audit recognizes every same-lesson scenario inventory technical projection pin", async () => {
  const ids = TARGETS.map(({animationId}) => animationId);
  const dependencyReport = await buildEvidenceDependencyReport({
    projectRoot: root,
    migrationsRoot: path.join(root, "migrations"),
    pilotIds: ids,
  });
  for (const id of ids) {
    const pilot = dependencyReport.pilots.find(({animationId}) => animationId === id);
    const artifact = pilot.artifacts.find(
      ({artifactRelative}) => artifactRelative === "audit/same-lesson-shell-host-entry-binding.json",
    );
    assert.equal(artifact.dependencyCount, 1, id);
    const [dependency] = artifact.dependencies;
    assert.equal(dependency.type, "scenario-inventory-technical", id);
    assert.equal(dependency.status, "current", id);
    assert.equal(dependency.hashPointer, "/scenarioInventory/sha256", id);
    assert.equal(dependency.declaredSha256, artifact.dependencies[0].observedSha256, id);
  }
});

test("all three reports retain shell doCheckSpanishAudio only as an explicit separate blocker", async () => {
  for (const id of TARGETS.map(({animationId}) => animationId)) {
    const report = await readJson(`migrations/${id}/audit/same-lesson-shell-host-entry-binding.json`);
    assert.equal(report.spanishQualification.sourceCallObservedInSelectedHostExcerpt, true, id);
    assert.equal(report.spanishQualification.observedCall, "_root.doCheckSpanishAudio()", id);
    assert.match(
      report.protocol.sameLessonHostActionScript.excerpts.map(({text}) => text).join("\n"),
      /_root\.doCheckSpanishAudio\(\)/,
      id,
    );
    assert.equal(report.spanishQualification.globalSpanishEntryProtocolProven, false, id);
  }
});

test("full-shell boundary monitor drift is hash-bound and cannot become event-free terminal proof", async () => {
  for (const id of TARGETS.map(({animationId}) => animationId)) {
    const report = await readJson(`migrations/${id}/audit/same-lesson-shell-host-entry-binding.json`);
    const boundary = report.fullShellBoundaryQualification;
    assert.equal(boundary.status, "source-monitor-proven-runtime-ordering-unresolved", id);
    assert.equal(boundary.sourceMonitorMayStopNestedAnimationAtOrBeyondTotalFrames, true, id);
    assert.equal(boundary.fullShellEventFreeTerminalProofAllowed, false, id);
    assert.equal(boundary.authorizedRuntimeEventOrderingRequired, true, id);
    assert.match(boundary.firstCycleBoundaryPlayingClassification, /minimal-child-entry-adapter-candidate/, id);
    assert.deepEqual(boundary.evidence.map(({role, normalizedSha256}) => ({role, normalizedSha256})), [
      {
        role: "root-frame-50-full-shell-prev-next-monitor",
        normalizedSha256: "c9b24d3bf25d6a41fd70cdcfd7fc0d0c9a7edd4b6ae0a94fb89f542441940da2",
      },
      {
        role: "root-frame-35-full-shell-prev-next-terminal-boundary-function",
        normalizedSha256: "e8947f523ba7efed833d3ba70fc3e0550c3b4a0522251bfda9af41ea2145719a",
      },
    ], id);
    const excerpts = report.protocol.sameLessonHostActionScript.excerpts;
    const monitor = excerpts.find(({role}) => role === "root-frame-50-full-shell-prev-next-monitor");
    const terminalFunction = excerpts.find(({role}) => role === "root-frame-35-full-shell-prev-next-terminal-boundary-function");
    assert.match(monitor.text, /_root\.doCheckPrevAndNext\(\)/, id);
    assert.match(terminalFunction.text, /_root\.animation_mc\.animation\.stop\(\)/, id);
    assert.match(terminalFunction.text, /_currentframe >= _root\.animation_mc\.animation\._totalframes/, id);
    assert.match(report.limitations.join("\n"), /not event-free or full-shell terminal proof/, id);
  }
});
