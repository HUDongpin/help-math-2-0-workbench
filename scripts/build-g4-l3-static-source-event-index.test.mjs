import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildCandidateFamilies,
  buildStaticSourceEventIndex,
  parseArguments,
  parseExportedScriptLocation,
  renderStaticSourceEventIndexMarkdown,
  validateStaticSourceEventIndex,
} from "./build-g4-l3-static-source-event-index.mjs";

test("parses only source-exact scope, event, and target identifiers encoded by FFDec export paths", () => {
  const placed = parseExportedScriptLocation(
    "DefineSprite_1151/frame_50/PlaceObject2_671_13/CLIPACTIONRECORD on(release).as",
  );
  assert.deepEqual(placed.scope, {
    kind: "sprite-frame",
    frameDomainCandidate: "sprite-1151",
    spriteObjectId: 1151,
    frame: 50,
    sourceExactFromExportPath: true,
  });
  assert.equal(placed.handler.syntax, "on");
  assert.deepEqual(placed.handler.events, [{raw: "release", type: "release", family: "pointer"}]);
  assert.deepEqual(placed.handler.target, {
    kind: "placed-character-export-path",
    objectId: 671,
    depth: 13,
    exportedNameToken: null,
    ownerFrameDomainCandidate: "sprite-1151",
    ownerFrame: 50,
    sourceExactFromExportPath: true,
    stageBoundsResolved: false,
    runtimeDispatchEstablished: false,
  });

  const button = parseExportedScriptLocation(
    'DefineButton2_210/BUTTONCONDACTION on(release, keyPress "<Enter>").as',
  );
  assert.equal(button.scope.kind, "button-definition");
  assert.equal(button.handler.target.objectId, 210);
  assert.deepEqual(button.handler.events.map((event) => event.family), ["pointer", "keyboard"]);

  const root = parseExportedScriptLocation("frame_6/DoAction.as");
  assert.equal(root.scope.kind, "root-frame");
  assert.equal(root.scope.frame, 6);
  assert.equal(root.handler, null);
});

test("candidate families stay source-only and never invent scenarios, schedules, or seeds", () => {
  const families = buildCandidateFamilies([
    {
      sourceEventId: "source-event-0001",
      handler: {events: [{family: "pointer"}]},
      machineSignals: [{signalId: "random-calls"}, {signalId: "timeline-navigation"}],
      externalApiCandidates: [{apiId: "loadMovie"}],
    },
  ]);
  assert.deepEqual(families.map((family) => family.familyId), [
    "external-api-candidates",
    "pointer-handler-candidates",
    "random-branch-candidates",
    "timeline-navigation-candidates",
  ]);
  assert.ok(families.every((family) => family.classification === "static-source-candidate-family-only"));
  assert.ok(families.every((family) => family.runtimeScenarioIds.length === 0));
  assert.ok(families.every((family) => family.runtimeReachabilityEstablished === false));
  assert.ok(families.every((family) => family.captureScheduleEstablished === false));
  assert.ok(families.every((family) => family.deterministicSeedContractEstablished === false));
});

test("checked-in index deterministically binds all 40 sources without running FFDec", async () => {
  const [checkedJson, checkedMarkdown, rebuilt] = await Promise.all([
    readFile(new URL("../reports/g4-l3-static-source-event-index.json", import.meta.url), "utf8"),
    readFile(new URL("../reports/g4-l3-static-source-event-index.md", import.meta.url), "utf8"),
    buildStaticSourceEventIndex(),
  ]);
  const checked = validateStaticSourceEventIndex(JSON.parse(checkedJson));
  assert.deepEqual(checked, rebuilt);
  assert.equal(checkedMarkdown, renderStaticSourceEventIndexMarkdown(checked));
  assert.equal(checked.summary.canonicalItems, 40);
  assert.equal(checked.summary.physicallyRehashedSwfs, 40);
  assert.equal(checked.summary.physicallyRehashedFlas, 29);
  assert.equal(checked.summary.sourceScriptFilesBound, 1809);
  assert.equal(checked.summary.indexedSourceEventFiles, 1546);
  assert.equal(checked.summary.handlerFiles, 816);
  assert.equal(checked.summary.handlerEventTokens, 877);
  assert.equal(checked.summary.pointerEventTokens, 798);
  assert.equal(checked.summary.keyboardEventTokens, 2);
  assert.equal(checked.summary.clipEventTokens, 72);
  assert.equal(checked.summary.timelineNavigationOccurrences, 1577);
  assert.equal(checked.summary.randomCallOccurrences, 18);
  assert.equal(checked.summary.externalApiOccurrences, 21);
  assert.equal(checked.summary.replayOrResetOccurrences, 11);
  assert.equal(checked.sourceBindings.ffdecInvokedByThisGenerator, false);
  assert.equal(checked.sourceBindings.scriptBodiesReadByThisGenerator, false);
});

test("every indexed source event is bound to an exact upstream file hash while unavailable detail stays unresolved", async () => {
  const report = validateStaticSourceEventIndex(JSON.parse(await readFile(
    new URL("../reports/g4-l3-static-source-event-index.json", import.meta.url),
    "utf8",
  )));
  for (const item of report.items) {
    const manifest = new Map(item.upstreamMachineAudit.fullScriptManifest.map((file) => [file.path, file]));
    for (const event of item.sourceEvents) {
      assert.equal(event.script.sha256, manifest.get(event.script.path).sha256);
      assert.equal(event.evidenceResolution.sourceBodyRetainedUpstream, false);
      assert.equal(event.evidenceResolution.sourceLineNumbersRetainedUpstream, false);
      assert.equal(event.evidenceResolution.runtimeReachabilityEstablished, false);
      for (const signal of event.machineSignals.filter((signal) => signal.signalId === "timeline-navigation")) {
        assert.deepEqual(signal.detailResolution.exactOperationMethods, []);
        assert.deepEqual(signal.detailResolution.unresolvedPossibleMethods, [
          "gotoAndPlay", "gotoAndStop", "nextFrame", "prevFrame", "play", "stop",
        ]);
      }
    }
    assert.equal(item.counts.languageScriptSignalOccurrences, 0);
    assert.equal(item.parsingLimits.languageScriptLexicalClassifierAvailable, false);
    assert.deepEqual(item.runtimeBoundary.runtimeScenarios, []);
    assert.deepEqual(item.runtimeBoundary.captureSchedules, []);
    assert.deepEqual(item.runtimeBoundary.deterministicSeedContracts, []);
  }
});

test("validator fails closed on acceptance, runtime, candidate-family, or invented-detail promotion", async () => {
  const original = JSON.parse(await readFile(
    new URL("../reports/g4-l3-static-source-event-index.json", import.meta.url),
    "utf8",
  ));
  const cases = [
    [(report) => { report.acceptance.strictGateChanges = 1; }, /strictGateChanges/],
    [(report) => { report.authority.actualRuntimeScenarioCount = 1; }, /runtime scenarios/],
    [(report) => { report.items[0].candidateScenarioFamilies[0].runtimeReachabilityEstablished = true; }, /candidate family/],
    [(report) => { report.items[0].runtimeBoundary.runtimeScenarios.push({id: "invented"}); }, /runtime boundary/],
    [(report) => { report.items[0].parsingLimits.exactTimelineOperationMethodsResolved = 1; }, /unavailable script detail/],
    [(report) => { report.items[0].sourceEvents[0].script.sha256 = "0".repeat(64); }, /upstream script manifest/],
  ];
  for (const [mutate, pattern] of cases) {
    const report = structuredClone(original);
    mutate(report);
    assert.throws(() => validateStaticSourceEventIndex(report), pattern);
  }
});

test("CLI exposes byte-for-byte check mode and rejects unknown or incomplete options", () => {
  const parsed = parseArguments(["--check", "--json-output", "reports/custom.json"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.jsonOutput, "reports/custom.json");
  assert.throws(() => parseArguments(["--markdown-output"]), /requires a path/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
