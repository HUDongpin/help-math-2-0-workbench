import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {gunzipSync} from "node:zlib";

import {
  buildReleaseSourceStaticEngineeringCandidates,
  deriveReleaseSourceStaticProfile,
  parseArguments,
  resolveDirectNamedAnimationTimeline,
  validateDeclaredTargetLineage,
} from "./build-release-source-static-engineering-candidates.mjs";
import {technicalManifestSha256} from "./evidence-projections.mjs";

const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const DECLARATION_REPORT_SHA256 =
  "d961ff2401d01740a6dc04b6084d3849f2cac1f729b43b3fe40565a7a7a15e20";
const IDS = Object.freeze([
  "course-g04-l10-vb-003",
  "course-g04-l10-ti-003",
  "course-g04-l10-ts-006",
  "course-g04-l10-fq-002",
  "course-g04-l10-rw-004",
  "course-g04-l10-in-009",
  "course-g04-l10-vb-008",
  "course-g04-l10-ts-002",
]);
const WAVE2_IDS = Object.freeze(IDS.slice(4));
const WAVE2_VISUAL_SEQUENCE = Object.freeze({
  "course-g04-l10-rw-004": {
    unchanged: 1059,
    changed: 265,
    frameOneMatches: 1,
  },
  "course-g04-l10-in-009": {
    unchanged: 768,
    changed: 184,
    frameOneMatches: 1,
  },
  "course-g04-l10-vb-008": {
    unchanged: 147,
    changed: 265,
    frameOneMatches: 4,
  },
  "course-g04-l10-ts-002": {
    unchanged: 272,
    changed: 51,
    frameOneMatches: 1,
  },
});
const EXPECTED = Object.freeze({
  "course-g04-l10-vb-003": {
    frameDomain: "sprite-120",
    frameCount: 203,
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "4",
    twips: {x: 8026, y: 4885},
    pixels: {x: 401.3, y: 244.25},
    instanceName: "animation",
  },
  "course-g04-l10-ti-003": {
    frameDomain: "sprite-308",
    frameCount: 395,
    nativeStage: {width: 799.9, height: 599.75, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "4",
    twips: {x: 8248, y: 5666},
    pixels: {x: 412.4, y: 283.3},
    instanceName: "animation",
  },
  "course-g04-l10-ts-006": {
    frameDomain: "sprite-13",
    frameCount: 245,
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "3",
    twips: {x: 8241, y: 5668},
    pixels: {x: 412.05, y: 283.4},
    instanceName: "animation",
  },
  "course-g04-l10-fq-002": {
    frameDomain: "sprite-823",
    frameCount: 70,
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "3",
    twips: {x: 7350, y: 4322},
    pixels: {x: 367.5, y: 216.1},
    instanceName: "animation",
  },
  "course-g04-l10-rw-004": {
    frameDomain: "sprite-109",
    frameCount: 1325,
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "1",
    twips: {x: 7219, y: 5460},
    pixels: {x: 360.95, y: 273},
    instanceName: "Animation",
  },
  "course-g04-l10-in-009": {
    frameDomain: "sprite-89",
    frameCount: 953,
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "4",
    twips: {x: 8026, y: 4885},
    pixels: {x: 401.3, y: 244.25},
    instanceName: "animation",
  },
  "course-g04-l10-vb-008": {
    frameDomain: "sprite-62",
    frameCount: 413,
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "4",
    twips: {x: 8026, y: 4885},
    pixels: {x: 401.3, y: 244.25},
    instanceName: "animation",
  },
  "course-g04-l10-ts-002": {
    frameDomain: "sprite-29",
    frameCount: 324,
    nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
    backingStage: {width: 800, height: 600, rule: "ceil-positive-native-stage-dimensions"},
    depth: "6",
    twips: {x: 8248, y: 5666},
    pixels: {x: 412.4, y: 283.3},
    instanceName: "animation",
  },
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fixtureBinding(path) {
  const contents = await readFile(path);
  return {path, bytes: contents.length, sha256: sha256(contents), contents};
}

function replaceMigrationBinding(bindings, report, migration, animationId) {
  const contents = Buffer.from(`${JSON.stringify(migration, null, 2)}\n`);
  const replacement = {
    path: bindings.migration.path,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
  const member = report.members.find((candidate) =>
    candidate.animationId === animationId);
  member.successor.migrationJson = {
    path: replacement.path,
    bytes: replacement.bytes,
    sha256: replacement.sha256,
    technicalProjectionSha256: technicalManifestSha256(migration),
  };
  return {...bindings, migration: replacement};
}

async function declaredLineageFixture(animationId, timelineId) {
  const workspace = `migrations/${animationId}`;
  const entries = await Promise.all(Object.entries({
    migration: `${workspace}/migration.json`,
    scenario: `${workspace}/audit/scenario-inventory.json`,
    disposition: `${workspace}/audit/frame-domain-disposition.json`,
    independentEvidence:
      `${workspace}/audit/source-proven-independent-frame-domain-evidence.json`,
    swfmill: `${workspace}/audit/machine/swfmill.xml.gz`,
    ffdecScripts: `${workspace}/audit/machine/ffdec-scripts.txt.gz`,
    declarationReport:
      "reports/g4-l10-independent-frame-domain-declarations.json",
  }).map(async ([key, path]) => [key, await fixtureBinding(path)]));
  const bindings = Object.fromEntries(entries);
  const migration = JSON.parse(bindings.migration.contents.toString("utf8"));
  const declarationReport = JSON.parse(
    bindings.declarationReport.contents.toString("utf8"),
  );
  const independentEvidence = JSON.parse(
    bindings.independentEvidence.contents.toString("utf8"),
  );
  const disposition = JSON.parse(
    bindings.disposition.contents.toString("utf8"),
  );
  const target = disposition.timelines.find((timeline) =>
    timeline.timelineId === timelineId);
  assert.ok(target);
  return {
    animationId,
    bindings,
    declarationReport,
    independentEvidence,
    migration,
    target,
  };
}

test("release source-static CLI requires an exact release and exact subset", () => {
  assert.deepEqual(parseArguments([
    "--release-id", RELEASE_ID,
    "--id", IDS[0],
    "--check",
  ]), {
    check: true,
    ffdec: "ffdec",
    ids: [IDS[0]],
    releaseId: RELEASE_ID,
  });
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () => parseArguments(["--release-id", RELEASE_ID]),
    /at least one exact --id is required/,
  );
  assert.throws(
    () => parseArguments([
      "--release-id", RELEASE_ID,
      "--id", IDS[0],
      "--id", IDS[0],
    ]),
    /duplicate --id/,
  );
});

test("direct named animation target resolution is case-insensitive and fail-closed on ambiguity", () => {
  const directNamedTarget = {
    timelineId: "sprite-109",
    sourceObjectId: "109",
    frameCount: 1325,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: {
      status: "proven-named-placement-chain",
      namedPlacementPath: [{
        parentTimelineId: "root",
        childTimelineId: "sprite-109",
        sourceObjectId: "109",
        instanceName: "Animation",
        tag: "PlaceObject2",
        replace: "0",
        hasClipActions: false,
      }],
    },
  };
  assert.equal(resolveDirectNamedAnimationTimeline({
    timelines: [
      {timelineId: "root", frameCount: 10},
      directNamedTarget,
    ],
  }, {animationId: "case-insensitive-fixture"}), directNamedTarget);
  assert.throws(
    () => resolveDirectNamedAnimationTimeline({
      timelines: [
        directNamedTarget,
        {
          ...directNamedTarget,
          timelineId: "sprite-110",
          sourceObjectId: "110",
          rootPlacement: {
            ...directNamedTarget.rootPlacement,
            namedPlacementPath: [{
              ...directNamedTarget.rootPlacement.namedPlacementPath[0],
              childTimelineId: "sprite-110",
              sourceObjectId: "110",
              instanceName: "animation",
            }],
          },
        },
      ],
    }, {animationId: "ambiguous-fixture"}),
    /expected one exact direct named animation timeline, observed 2/,
  );
});

test("eight L10 profiles derive exact direct named child placement from current hash-bound evidence", async () => {
  const catalog = JSON.parse(await readFile("catalog/lesson-releases.json", "utf8"));
  const release = catalog.releases.find(({releaseId}) => releaseId === RELEASE_ID);
  for (const animationId of IDS) {
    const profile = await deriveReleaseSourceStaticProfile({
      animationId,
      release,
    });
    const expected = EXPECTED[animationId];
    assert.equal(profile.target.timelineId, expected.frameDomain);
    assert.equal(profile.target.frameCount, expected.frameCount);
    if (animationId === "course-g04-l10-in-009") {
      assert.equal(profile.target.disposition, "unresolved");
      assert.equal(
        profile.target.declarationProofLineage.status,
        "unresolved-runtime-continuation-proof-required",
      );
      assert.equal(profile.target.declarationProofLineage.frameDomainId, null);
      assert.equal(
        profile.target.declarationProofLineage.blockerClass,
        "scriptless-direct-root-local-playhead-needs-runtime-continuation-proof",
      );
    } else {
      assert.equal(profile.target.disposition, "declared-frame-domain");
      assert.equal(
        profile.target.declarationProofLineage.status,
        "declared-source-proven-independent-domain",
      );
      assert.equal(
        profile.target.declarationProofLineage.frameDomainId,
        expected.frameDomain,
      );
      assert.match(
        profile.target.declarationProofLineage.actionFrameSequenceSha256,
        /^[a-f0-9]{64}$/,
      );
      assert.equal(profile.target.declarationProofLineage.blockerClass, null);
    }
    assert.equal(
      profile.target.declarationProofLineage.declarationReportSha256,
      DECLARATION_REPORT_SHA256,
    );
    assert.match(
      profile.target.declarationProofLineage.sourceProofSha256,
      /^[a-f0-9]{64}$/,
    );
    assert.deepEqual(profile.stage.native, expected.nativeStage);
    assert.deepEqual(profile.stage.backing, expected.backingStage);
    assert.deepEqual(profile.root.placement, {
      parentTimelineId: "root",
      childTimelineId: expected.frameDomain,
      sourceObjectId: expected.frameDomain.slice("sprite-".length),
      frame: 6,
      depth: expected.depth,
      instanceName: expected.instanceName,
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
      placementTwips: expected.twips,
      placementPixels: expected.pixels,
    });
    assert.equal(profile.source.swf.sha256,
      profile.release.assetId.slice("swf-".length));
  }
});

test("declared target lineage rejects manifest-domain and source-proof hash drift", async () => {
  const fixture = await declaredLineageFixture(
    "course-g04-l10-vb-003",
    "sprite-120",
  );
  {
    const migration = structuredClone(fixture.migration);
    migration.implementation.frameDomains.find((domain) =>
      domain.sourceTimelineId === fixture.target.timelineId).frameCount += 1;
    const declarationReport = structuredClone(fixture.declarationReport);
    const bindings = replaceMigrationBinding(
      fixture.bindings,
      declarationReport,
      migration,
      fixture.animationId,
    );
    assert.throws(
      () => validateDeclaredTargetLineage({
        ...fixture,
        bindings,
        declarationReport,
        migration,
      }),
      /exact declared manifest\/report domain binding drifted/,
    );
  }
  {
    const migration = structuredClone(fixture.migration);
    const declarationReport = structuredClone(fixture.declarationReport);
    const reportMember = declarationReport.members.find((member) =>
      member.animationId === fixture.animationId);
    const reportDomain = reportMember.declaration.domains.find((domain) =>
      domain.sourceTimelineId === fixture.target.timelineId);
    const manifestDomain = migration.implementation.frameDomains.find((domain) =>
      domain.sourceTimelineId === fixture.target.timelineId);
    const driftedProofSha256 = "0".repeat(64);
    reportDomain.sourceProof.sha256 = driftedProofSha256;
    manifestDomain.sourceProof.sha256 = driftedProofSha256;
    const bindings = replaceMigrationBinding(
      fixture.bindings,
      declarationReport,
      migration,
      fixture.animationId,
    );
    assert.throws(
      () => validateDeclaredTargetLineage({
        ...fixture,
        bindings,
        declarationReport,
        migration,
      }),
      /declared domain source-proof binding drifted/,
    );
  }
});

test("wave 2 targets are paired-source, label-free, placement-free, and have at most a terminal stop script", async () => {
  const catalog = JSON.parse(await readFile("catalog/lesson-releases.json", "utf8"));
  const release = catalog.releases.find(({releaseId}) => releaseId === RELEASE_ID);
  for (const animationId of WAVE2_IDS) {
    const profile = await deriveReleaseSourceStaticProfile({animationId, release});
    assert.equal(profile.source.pairedFlaStatus, "present");
    assert.ok(profile.source.fla);
    const target = profile.scenario.timelineInventory.find(
      ({timelineId}) => timelineId === profile.target.timelineId,
    );
    assert.ok(target);
    assert.deepEqual(target.frameLabels, []);
    assert.deepEqual(target.namedPlacements, []);
    const scriptStates = target.controlStates.filter(({reasons}) =>
      reasons.includes("exported-action-script") ||
      reasons.some((reason) => reason.startsWith("event-handler:")),
    );
    assert.equal(
      scriptStates.every(({frame, reasons}) =>
        frame === target.frameCount &&
        reasons.includes("script-stop-state") &&
        !reasons.some((reason) => reason.startsWith("event-handler:"))),
      true,
    );
    const objectId = profile.target.objectId;
    const scripts = gunzipSync(await readFile(
      `migrations/${animationId}/audit/machine/ffdec-scripts.txt.gz`,
    )).toString("utf8").replace(/\r\n?/g, "\n");
    const targetBlocks = [...scripts.matchAll(new RegExp(
      `===== DefineSprite_${objectId}/([^=]+) =====\\n([\\s\\S]*?)(?=\\n===== |$)`,
      "g",
    ))];
    assert.equal(targetBlocks.length, scriptStates.length);
    for (const block of targetBlocks) {
      assert.equal(block[1], `frame_${target.frameCount}/DoAction.as`);
      assert.equal(block[2].trim(), "stop();");
    }
  }
});

test("generated L10 assets remain unregistered, inert, hash-bound, and network-free", async () => {
  const protectedSources = await Promise.all([
    "packages/demos/prototype-registry.json",
    "packages/demos/src/registry.generated.ts",
    "packages/demos/src/prototype-manifest.ts",
    "apps/web/lib/whole-lesson-course-registry.ts",
  ].map((path) => readFile(path, "utf8")));
  for (const source of protectedSources) {
    for (const animationId of IDS) assert.doesNotMatch(source, new RegExp(animationId));
  }
  for (const animationId of IDS) {
    const base = `public/flash-assets/courses/${animationId}`;
    const [runtime, manifestText] = await Promise.all([
      readFile(`${base}/canvas-renderer.js`),
      readFile(`${base}/manifest.json`, "utf8"),
    ]);
    const manifest = JSON.parse(manifestText);
    assert.equal(manifest.output.sha256, sha256(runtime));
    assert.equal(manifest.output.bytes, runtime.length);
    assert.equal(manifest.output.registeredInProductRegistry, false);
    assert.equal(manifest.status,
      "unregistered-acceptance-neutral-engineering-artifact");
    assert.equal(manifest.runtimeBoundary.actionScriptExecuted, false);
    assert.deepEqual(manifest.runtimeBoundary.audioCues, []);
    assert.equal(manifest.runtimeBoundary.controlsEnabled, false);
    assert.equal(manifest.runtimeBoundary.maturity, "legacy-prototype");
    assert.equal(manifest.browserQa.fullFrameVisualSequence.frameDomain,
      EXPECTED[animationId].frameDomain);
    assert.equal(manifest.browserQa.fullFrameVisualSequence.frameCount,
      EXPECTED[animationId].frameCount);
    assert.equal(
      manifest.browserQa.fullFrameVisualSequence.comparedConsecutivePairCount,
      EXPECTED[animationId].frameCount - 1,
    );
    assert.equal(
      manifest.browserQa.fullFrameVisualSequence.byteIdenticalToPreviousFrameCount +
        manifest.browserQa.fullFrameVisualSequence.changedFromPreviousFrameCount,
      EXPECTED[animationId].frameCount - 1,
    );
    assert.equal(
      manifest.browserQa.fullFrameVisualSequence.transitionStartFrames.length,
      manifest.browserQa.fullFrameVisualSequence.changedFromPreviousFrameCount,
    );
    assert.match(manifest.browserQa.fullFrameVisualSequence.authority,
      /no original-runtime frame binding, fidelity, RMSE, or acceptance effect/);
    assert.equal(manifest.browserQa.unexpectedNetworkRequestCount, 0);
    assert.deepEqual(manifest.browserQa.invalidRejections, [
      "frame-zero",
      "frame-overflow",
      "fractional-frame",
      "scenario",
      "spanish",
      "seed",
    ]);
    assert.equal(manifest.registryChanged, false);
    assert.equal(manifest.strictAcceptanceEffect, "none");
    const source = runtime.toString("utf8");
    for (const pattern of [
      /\bfetch\b/,
      /XMLHttpRequest/,
      /WebSocket/,
      /\bsetTimeout\s*\(/,
      /\bsetInterval\s*\(/,
      /requestAnimationFrame/,
      /localStorage/,
      /sessionStorage/,
      /addEventListener\s*\(/,
    ]) assert.doesNotMatch(source, pattern);
  }
});

test("TS006 current-JavaScript source-static visual is byte-identical across all 245 local frames", async () => {
  const manifest = JSON.parse(await readFile(
    "public/flash-assets/courses/course-g04-l10-ts-006/manifest.json",
    "utf8",
  ));
  const sequence = manifest.browserQa.fullFrameVisualSequence;
  assert.equal(sequence.frameDomain, "sprite-13");
  assert.equal(sequence.frameCount, 245);
  assert.equal(sequence.rgbaByteCountPerFrame, 1_920_000);
  assert.equal(sequence.byteIdenticalToPreviousFrameCount, 244);
  assert.equal(sequence.changedFromPreviousFrameCount, 0);
  assert.deepEqual(sequence.transitionStartFrames, []);
  assert.equal(sequence.byteIdenticalToFrameOneCount, 245);
  assert.equal(sequence.allFramesByteIdenticalToFrameOne, true);
});

test("wave 2 full-canvas RGBA sequence census is exact and non-static", async () => {
  for (const animationId of WAVE2_IDS) {
    const manifest = JSON.parse(await readFile(
      `public/flash-assets/courses/${animationId}/manifest.json`,
      "utf8",
    ));
    const sequence = manifest.browserQa.fullFrameVisualSequence;
    const expected = WAVE2_VISUAL_SEQUENCE[animationId];
    assert.equal(sequence.frameDomain, EXPECTED[animationId].frameDomain);
    assert.equal(sequence.frameCount, EXPECTED[animationId].frameCount);
    assert.equal(sequence.rgbaByteCountPerFrame, 1_920_000);
    assert.equal(sequence.byteIdenticalToPreviousFrameCount, expected.unchanged);
    assert.equal(sequence.changedFromPreviousFrameCount, expected.changed);
    assert.equal(sequence.transitionStartFrames.length, expected.changed);
    assert.equal(sequence.byteIdenticalToFrameOneCount, expected.frameOneMatches);
    assert.equal(sequence.allFramesByteIdenticalToFrameOne, false);
  }
});

test("eight checked-in L10 assets regenerate deterministically", async () => {
  const result = await buildReleaseSourceStaticEngineeringCandidates({
    check: true,
    ids: [...IDS],
    releaseId: RELEASE_ID,
  });
  assert.equal(result.operation, "check");
  assert.equal(result.selectedMemberCount, 8);
  assert.equal(result.protectedRegistriesUnchanged, true);
  assert.equal(result.results.every(({registered}) => registered === false), true);
  assert.equal(result.strictAcceptanceEffect, "none");
});
