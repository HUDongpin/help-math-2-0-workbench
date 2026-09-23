import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCandidateBoundManifest,
  normalizeCandidateTimeline,
  parseArguments,
} from "./materialize-g4-l3-source-static-current-js-workspaces.mjs";

test("normalizes both generic and dedicated source-static candidate timeline shapes", () => {
  const generic = normalizeCandidateTimeline({
    animationId: "course-g04-l03-fixture",
    timeline: {
      root: {frameCount: 10},
      main: {frameDomain: "sprite-27", frameCount: 136, blockedFrameCount: 0},
      companions: [{frameDomain: "sprite-9", frameCount: 135}],
    },
  });
  assert.deepEqual(generic, {
    rootFrameCount: 10,
    main: {id: "sprite-27", frameCount: 136, blockedFrameCount: 0},
    companions: [{id: "sprite-9", frameCount: 135}],
  });
  const dedicated = normalizeCandidateTimeline({
    animationId: "course-g04-l03-fixture",
    timeline: {
      root: {frameCount: 10},
      local: {timelineId: "sprite-84", frameCount: 472},
      companion: {timelineId: "sprite-5", frameCount: 1},
    },
  });
  assert.equal(dedicated.main.id, "sprite-84");
  assert.deepEqual(dedicated.companions, [{id: "sprite-5", frameCount: 1}]);
});

test("rejects behavior-blocked or duplicate source-static domains", () => {
  assert.throws(() => normalizeCandidateTimeline({
    animationId: "course-g04-l03-fixture",
    timeline: {
      root: {frameCount: 10},
      main: {frameDomain: "sprite-27", frameCount: 136, blockedFrameCount: 1},
      companions: [],
    },
  }), /not an exhaustive renderable/);
  assert.throws(() => normalizeCandidateTimeline({
    animationId: "course-g04-l03-fixture",
    timeline: {
      root: {frameCount: 10},
      main: {frameDomain: "sprite-27", frameCount: 136},
      companions: [{frameDomain: "sprite-27", frameCount: 1}],
    },
  }), /duplicated/);
});

test("candidate binding keeps root and nested domains separate and leaves authority false", () => {
  const animationId = "course-g04-l03-fixture";
  const manifest = {
    animationId,
    status: "preserved",
    runtime: {frameCount: 10},
    localization: {languages: ["en", "es"]},
    implementation: {
      captureContract: {},
      frameDomains: [{
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        parentFrameDomainId: null,
        frameCount: 10,
        scenarioIds: ["default"],
      }],
    },
    evidence: {},
  };
  const candidate = {
    outputs: {
      prototypeModule: `packages/demos/src/modules/${animationId}.tsx`,
      pureTimeline: `packages/demos/src/timelines/${animationId}.ts`,
      canvasManifest: `public/flash-assets/courses/${animationId}/manifest.json`,
    },
  };
  const machineItem = {swf: {frameDomains: {domains: [
    {domainId: "root", declaredFrameCount: 10, placementEdges: [{childSpriteId: 27, firstFrame: 6}]},
    {domainId: "sprite-27", declaredFrameCount: 136, staticallyRootReachable: true},
    {domainId: "sprite-9", declaredFrameCount: 135, staticallyRootReachable: true},
  ]}}};
  const upgraded = buildCandidateBoundManifest({
    manifest,
    animationId,
    sequence: 1,
    candidatePath: "reports/fixture.json",
    candidate,
    timeline: {
      rootFrameCount: 10,
      main: {id: "sprite-27", frameCount: 136, blockedFrameCount: 0},
      companions: [{id: "sprite-9", frameCount: 135}],
    },
    machineItem,
    registryEntry: {key: animationId, module: `./modules/${animationId}`, maturity: "legacy-prototype"},
  });
  assert.deepEqual(upgraded.implementation.frameDomains.map(({id, frameCount}) => ({id, frameCount})), [
    {id: "root", frameCount: 10},
    {id: "sprite-27", frameCount: 136},
  ]);
  assert.equal(upgraded.implementation.defaultFrameDomainId, "sprite-27");
  assert.equal(upgraded.implementation.candidateState.spanishEnabled, false);
  assert.equal(upgraded.implementation.candidateState.originalRuntimeBaselineUsed, false);
  assert.deepEqual(upgraded.implementation.candidateState.sourceStaticCompositeCandidateTimelineIds, ["sprite-9"]);
});

test("CLI supports only check and receipt refresh", () => {
  assert.deepEqual(parseArguments([]), {check: false, refresh: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, refresh: false});
  assert.deepEqual(parseArguments(["--refresh"]), {check: false, refresh: true});
  assert.throws(() => parseArguments(["--check", "--refresh"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
