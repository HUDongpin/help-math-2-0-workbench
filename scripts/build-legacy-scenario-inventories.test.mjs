import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  LEGACY_PILOT_IDS,
  buildLegacyScenarioInventories,
  buildLegacyTimelineInventory,
  canonicalLegacyBlockingEvidence,
  parseArguments,
  validateLegacyScenarioInventory,
} from "./build-legacy-scenario-inventories.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("parses only bounded legacy scenario-inventory arguments", () => {
  const options = parseArguments([
    "--check",
    "--id", LEGACY_PILOT_IDS[0],
    "--migrations", "migrations",
    "--python", "/usr/bin/python3",
  ]);
  assert.equal(options.check, true);
  assert.deepEqual(options.ids, [LEGACY_PILOT_IDS[0]]);
  assert.equal(options.migrationsRoot, path.resolve("migrations"));
  assert.equal(options.python, "/usr/bin/python3");
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("derives one-indexed control states without promoting static structure to runtime authority", () => {
  const timelines = buildLegacyTimelineInventory([
    {
      id: "root-script",
      scope: {kind: "root", frame: 2},
      event: [],
      signals: {calls: [{target: "stop"}]},
      evidence: {artifactId: "ffdec-scripts", lineStart: 1, lineEnd: 1},
    },
    {
      id: "child-handler",
      scope: {kind: "sprite", objectId: "7", frame: 3},
      event: ["release"],
      signals: {calls: []},
      evidence: {artifactId: "ffdec-scripts", lineStart: 2, lineEnd: 4},
    },
  ], {
    timelines: [
      {
        timelineId: "root",
        objectId: null,
        declaredFrameCount: 4,
        observedShowFrameCount: 4,
        structuralReachability: "root",
        frameLabels: [{frame: 3, label: "terminal"}],
        actionFrames: [{frame: 2, tag: "DoAction"}],
        namedPlacements: [],
      },
      {
        timelineId: "sprite-7",
        objectId: "7",
        declaredFrameCount: 3,
        observedShowFrameCount: 3,
        structuralReachability: "reachable-from-root-placement-graph",
        frameLabels: [],
        actionFrames: [],
        namedPlacements: [],
      },
    ],
  });
  assert.deepEqual(timelines.map(({timelineId, frameCount}) => [timelineId, frameCount]), [
    ["root", 4],
    ["sprite-7", 3],
  ]);
  assert.deepEqual(timelines[0].controlStates.map(({frame}) => frame), [1, 2, 3, 4]);
  assert.equal(timelines[0].controlStates.find(({frame}) => frame === 2).reasons.includes("script-stop-state"), true);
  assert.equal(timelines[1].controlStates.find(({frame}) => frame === 3).reasons.includes("event-handler:release"), true);
  assert.equal(timelines.every(({frameDomain}) => frameDomain.captureRequirement === "every-frame-for-every-reachable-runtime-scenario"), true);
});

test("orders scenario inventory immediately before the unchanged current capture like the adopter", () => {
  const capture = {
    file: "output/playwright/schema-v4-queue/pilot-v3/req/capture-manifest.json",
    sha256: "c".repeat(64),
  };
  const inventorySha256 = "d".repeat(64);
  const requirement = {
    requirementId: "req:root:default:en",
    captureManifest: capture.file,
    blockingEvidence: [
      {file: "source.swf", sha256: "a".repeat(64)},
      capture,
      {file: "audit/scenario-inventory.json", sha256: "b".repeat(64)},
    ],
  };
  const canonical = canonicalLegacyBlockingEvidence(requirement, inventorySha256);
  assert.deepEqual(canonical, [
    requirement.blockingEvidence[0],
    {file: "audit/scenario-inventory.json", sha256: inventorySha256},
    capture,
  ]);
  assert.deepEqual(
    canonicalLegacyBlockingEvidence({...requirement, blockingEvidence: canonical}, inventorySha256),
    canonical,
  );
  assert.throws(
    () => canonicalLegacyBlockingEvidence({
      ...requirement,
      blockingEvidence: [...requirement.blockingEvidence, capture],
    }, inventorySha256),
    /duplicate current capture entries/,
  );
});

test("all six checked-in legacy inventories are deterministic, source-bound, and fail closed", async () => {
  const results = await buildLegacyScenarioInventories({check: true});
  assert.deepEqual(results.map(({animationId}) => animationId), LEGACY_PILOT_IDS);
  assert.equal(results.every(({action}) => action === "verified"), true);

  const expectedReachableChildren = new Map([
    ["formula-elementary-conversion-01-01", ["sprite-131", "sprite-134"]],
    ["formula-elementary-conversion-01-02", ["sprite-131", "sprite-134"]],
    ["formula-elementary-conversion-01-03", ["sprite-131", "sprite-134"]],
    ["formula-elementary-conversion-01-04", ["sprite-131", "sprite-134", "sprite-156"]],
    ["keyterm-elementary-acute-angle", []],
    ["keyterm-elementary-computeghgh", []],
  ]);
  for (const id of LEGACY_PILOT_IDS) {
    const inventory = JSON.parse(await readFile(path.join(projectRoot, "migrations", id, "audit", "scenario-inventory.json"), "utf8"));
    assert.equal(validateLegacyScenarioInventory(inventory), true);
    assert.deepEqual(
      inventory.timelineInventory
        .filter(({structuralReachability}) => structuralReachability === "reachable-from-root-placement-graph")
        .map(({timelineId}) => timelineId),
      expectedReachableChildren.get(id),
    );
    assert.deepEqual(inventory.authoritativeRuntimeEvidence, []);
    assert.equal(inventory.strictAcceptanceEffect.startsWith("none;"), true);
  }
});
