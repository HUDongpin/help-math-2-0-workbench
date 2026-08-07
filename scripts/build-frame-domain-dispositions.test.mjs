import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  DISPOSITIONS,
  buildDispositionReport,
  buildFrameDomainDispositions,
  parseArguments,
  resolveFrameDomainDispositionIds,
} from "./build-frame-domain-dispositions.mjs";
import {COURSE_PILOT_IDS} from "./build-course-scenario-inventories.mjs";
import {LEGACY_PILOT_IDS} from "./build-legacy-scenario-inventories.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  NESTED_DECLARED_PARENT_BINDING_MODE,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
  canonicalIndependentPairSet,
} from "./source-proven-independent-frame-domain-evidence.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const G5_L5_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
const G5_L5_RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const G5_L5_ORDERED_MEMBER_IDENTITY_SHA256 =
  "c3961a2b552a825ba4fce167a502f20e5bcb9ae73a4938c57f4fea6f6e947ccd";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function syntheticEvidence(manifestSha256, source = {path: "source.swf", sha256: digest("source")}) {
  return [
    {artifactId: "source-swf", path: source.path, sha256: source.sha256},
    {
      artifactId: "migration-technical-contract",
      path: "migration.json",
      sha256: manifestSha256,
      hashMode: "canonical-json-v1",
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    },
    {
      artifactId: "swfmill-xml",
      path: "audit/machine/swfmill.xml.gz",
      sha256: digest("swfmill"),
      uncompressedSha256: digest("swfmill-uncompressed"),
    },
    {
      artifactId: "ffdec-scripts",
      path: "audit/machine/ffdec-scripts.txt.gz",
      sha256: digest("scripts"),
      uncompressedSha256: digest("scripts-uncompressed"),
    },
  ];
}

function timeline({timelineId, objectId, frameCount, reachability, namedPlacements = [], controlStateCount = 2, labelCount = 0}) {
  return {
    timelineId,
    objectId,
    frameCount,
    structuralReachability: reachability,
    namedPlacements,
    controlStates: Array.from({length: controlStateCount}, (_, index) => ({frame: index + 1})),
    frameLabels: Array.from({length: labelCount}, (_, index) => ({frame: index + 1, label: `label-${index + 1}`})),
  };
}

function syntheticFixture({
  animationId = COURSE_PILOT_IDS[0],
  declareChild = false,
  compositeChild = false,
  releaseSource = null,
} = {}) {
  const timelineInventory = [
      timeline({
        timelineId: "root",
        objectId: null,
        frameCount: 10,
        reachability: "root",
        namedPlacements: [
          {objectId: "7", frame: 6, depth: "1", name: "animation", tag: "PlaceObject2", replace: "0", hasClipActions: false},
          ...(compositeChild ? [] : [{objectId: "8", frame: 6, depth: "2", name: "ornament", tag: "PlaceObject2", replace: "0", hasClipActions: false}]),
        ],
      }),
      timeline({
        timelineId: "sprite-7",
        objectId: "7",
        frameCount: 120,
        reachability: "reachable-from-root-placement-graph",
        controlStateCount: 12,
        labelCount: 5,
        namedPlacements: compositeChild
          ? [{objectId: "8", frame: 1, depth: "16", name: "Mc_Sound_0", tag: "PlaceObject2", replace: "0", hasClipActions: false}]
          : [],
      }),
      timeline({
        timelineId: "sprite-8",
        objectId: "8",
        frameCount: 1,
        reachability: "reachable-from-root-placement-graph",
      }),
      timeline({
        timelineId: "sprite-99",
        objectId: "99",
        frameCount: 200,
        reachability: "not-proven-by-root-placement-graph",
      }),
    ];
  const manifest = {
    ...(releaseSource ? {
      id: animationId,
      assetId: `swf-${releaseSource.sha256}`,
      source: {
        swf: releaseSource.path,
        placementPath: releaseSource.path,
        swfSha256: releaseSource.sha256,
      },
    } : {}),
    animationId,
    status: "preserved",
    runtime: {frameCount: 10},
    implementation: {
      frameDomains: [
        {
          id: "root",
          kind: "root",
          sourceTimelineId: "root",
          sourceInstanceId: "root",
          parentFrameDomainId: null,
          frameCount: 10,
          role: "root-shell-placement",
        },
        ...((declareChild || compositeChild) ? [{
          id: "sprite-7",
          kind: "nested",
          sourceTimelineId: "sprite-7",
          sourceInstanceId: "main-animation",
          parentFrameDomainId: "root",
          parentEntryFrame: 6,
          localEntryFrame: 1,
          frameCount: 120,
          role: "main-animation",
        }] : []),
      ],
    },
  };
  const manifestSha256 = technicalManifestSha256(manifest);
  const inventory = {
    schemaVersion: 1,
    animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    evidenceIndex: syntheticEvidence(manifestSha256, releaseSource || undefined),
    timelineInventory,
  };
  return {animationId, inventory, manifest, manifestSha256};
}

function lessonReleaseDocument(members, releaseId = "lesson-fixture") {
  return {
    schemaVersion: 1,
    releases: [{
      releaseId,
      expectedCounts: {members: members.length, shards: 1},
      shards: [{shardId: "fixture-shard", memberCount: members.length}],
      members: members.map((member, index) => ({
        ...member,
        ordinal: index + 1,
        shardId: "fixture-shard",
      })),
    }],
  };
}

async function materializeReleaseFixture(t, {
  ids = ["course-release-fixture-001"],
  missingScenarioIds = [],
  releaseId = "lesson-fixture",
} = {}) {
  const root = await mkdtemp(path.join(PROJECT_ROOT, ".frame-domain-release-test-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const migrationsRoot = path.join(root, "migrations");
  const members = [];
  const fixtures = new Map();

  for (const id of ids) {
    const sourceBytes = Buffer.from(`source:${id}`);
    const source = {
      path: `sources/${id}.swf`,
      sha256: digest(sourceBytes),
    };
    const sourcePath = path.join(root, source.path);
    const workspace = path.join(migrationsRoot, id);
    await mkdir(path.dirname(sourcePath), {recursive: true});
    await mkdir(path.join(workspace, "audit"), {recursive: true});
    await writeFile(sourcePath, sourceBytes);
    const fixture = syntheticFixture({animationId: id, releaseSource: source});
    await writeFile(path.join(workspace, "migration.json"), `${JSON.stringify(fixture.manifest, null, 2)}\n`);
    if (!missingScenarioIds.includes(id)) {
      await writeFile(
        path.join(workspace, "audit", "scenario-inventory.json"),
        `${JSON.stringify(fixture.inventory, null, 2)}\n`,
      );
    }
    members.push({
      animationId: id,
      assetId: `swf-${source.sha256}`,
      source,
    });
    fixtures.set(id, {fixture, sourcePath, workspace});
  }

  const lessonReleasePath = path.join(root, "lesson-releases.json");
  await writeFile(
    lessonReleasePath,
    `${JSON.stringify(lessonReleaseDocument(members, releaseId), null, 2)}\n`,
  );
  return {fixtures, lessonReleasePath, migrationsRoot, releaseId, root};
}

function staticCompositeEvidence(fixture, inventorySha256) {
  const source = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "source-swf");
  const swfmill = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "swfmill-xml");
  const scripts = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "ffdec-scripts");
  return {
    schemaVersion: 2,
    evidenceType: "static-frame-domain-disposition-evidence",
    animationId: fixture.animationId,
    status: "verified-static-composite-claims",
    migrationStatusChanged: false,
    authorityStatement: ["source", "matrix", "obligations"],
    generatedFrom: {
      sourceSwf: {path: source.path, sha256: source.sha256},
      migrationManifest: {
        path: "migration.json",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        sha256: fixture.manifestSha256,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      scenarioInventory: {path: "audit/scenario-inventory.json", sha256: inventorySha256, schemaVersion: 1},
      swfmillStructure: {path: swfmill.path, sha256: swfmill.sha256, uncompressedSha256: digest("swfmill-uncompressed")},
      ffdecScripts: {path: scripts.path, sha256: scripts.sha256, uncompressedSha256: scripts.uncompressedSha256},
    },
    nativeStage: {twipsPerPixel: 20, boundsTwips: {left: 0, right: 16000, top: 0, bottom: 12000}, widthPixels: 800, heightPixels: 600},
    claimSetContracts: [{
      proofType: "audio-only-offstage-visual-marker",
      expectedTimelineCount: 1,
      expectedTimelineIds: ["sprite-8"],
      verifiedTimelineCount: 1,
      verifiedTimelineIds: ["sprite-8"],
      exactMatch: true,
    }],
    claims: [{
      timelineId: "sprite-8",
      sourceObjectId: "8",
      frameCount: 1,
      disposition: "composite-child-with-parent",
      parentTimelineId: "sprite-7",
      parentSourceObjectId: "7",
      parentFrameDomainId: "sprite-7",
      role: "audio-only-offstage-visual-marker",
      tagCensus: {observed: {SoundStreamBlock: 1}, allowedTags: ["SoundStreamBlock"], declaredFrameCount: 1, observedShowFrameCount: 1, exactMatch: true},
      audioStructure: {required: true, acceptanceSatisfied: false, headTag: "SoundStreamHead", headCount: 1, blockCount: 1, compressionCode: 2, playbackRateCode: 2, playbackStereo: true, sourceFrameDomain: "sprite-8"},
      placementChain: [
        {parentTimelineId: "root", childTimelineId: "sprite-7", sourceObjectId: "7"},
        {parentTimelineId: "sprite-7", childTimelineId: "sprite-8", sourceObjectId: "8"},
        {parentTimelineId: "sprite-8", childTimelineId: null, sourceObjectId: "6"},
      ],
      lifetime: {parentPlacementFrame: 1, parentRemovalFrame: 2, parentPlacementUpdateCount: 0, childPlacementUpdateCount: 0, clipActionCount: 0},
      visualBounds: {nativeStageIntersection: false},
      scriptReferenceAudit: {
        selectorPrefix: {occurrenceCount: 1},
        selectorVariable: {occurrenceCount: 2},
        directInstanceName: {occurrenceCount: 0},
        unsupportedReferenceCount: 0,
      },
      preservedObligations: {
        audio: {required: true, satisfiedByDisposition: false, status: "pending"},
        behavior: {required: true, satisfiedByDisposition: false, status: "pending"},
        fullFrame: {required: true, satisfiedByDisposition: false, status: "pending"},
      },
    }],
    acceptanceEffects: {
      buttonAccepted: false,
      interactionAccepted: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      rmseAccepted: false,
      humanReviewAccepted: false,
      ownerReviewAccepted: false,
    },
    strictAcceptanceEffect: "none; fixture evidence does not satisfy acceptance",
  };
}

function staticSingleFrameEvidence(fixture, inventorySha256) {
  const source = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "source-swf");
  const swfmill = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "swfmill-xml");
  const scripts = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "ffdec-scripts");
  const pending = (status) => ({required: true, satisfiedByDisposition: false, status});
  return {
    schemaVersion: 2,
    evidenceType: "static-frame-domain-disposition-evidence",
    animationId: fixture.animationId,
    status: "verified-static-composite-claims",
    migrationStatusChanged: false,
    authorityStatement: ["source", "single frame", "obligations"],
    generatedFrom: {
      sourceSwf: {path: source.path, sha256: source.sha256},
      migrationManifest: {
        path: "migration.json",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        sha256: fixture.manifestSha256,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      scenarioInventory: {path: "audit/scenario-inventory.json", sha256: inventorySha256, schemaVersion: 1},
      swfmillStructure: {path: swfmill.path, sha256: swfmill.sha256, uncompressedSha256: digest("swfmill-uncompressed")},
      ffdecScripts: {path: scripts.path, sha256: scripts.sha256, uncompressedSha256: scripts.uncompressedSha256},
    },
    nativeStage: {twipsPerPixel: 20, boundsTwips: {left: 0, right: 16000, top: 0, bottom: 12000}, widthPixels: 800, heightPixels: 600},
    claimSetContracts: [{
      proofType: "single-frame-scriptless-structural-child",
      expectedTimelineCount: 1,
      expectedTimelineIds: ["sprite-8"],
      verifiedTimelineCount: 1,
      verifiedTimelineIds: ["sprite-8"],
      exactMatch: true,
    }],
    claims: [{
      timelineId: "sprite-8",
      sourceObjectId: "8",
      frameCount: 1,
      disposition: "composite-child-with-parent",
      role: "single-frame-scriptless-structural-child",
      claimScope: "independent-local-playhead-only",
      structuralReachability: "reachable-from-root-placement-graph",
      tagCensus: {observed: {End: 1, PlaceObject2: 1, ShowFrame: 1}, declaredFrameCount: 1, observedShowFrameCount: 1, doActionTagCount: 0, doInitActionTagCount: 0},
      scriptAudit: {ffdecFrameScriptCount: 0, ffdecFrameScripts: [], attributedDoInitActionCount: 0, attributedDoInitActions: [], scriptless: true},
      placementAudit: {
        incomingPlacementCount: 1,
        outgoingPlacementCount: 1,
        exportedPlacementCount: 2,
        unresolvedOutgoingObjectCount: 0,
        clipActionCount: 0,
        allExportedPlacementsHaveNoClipActions: true,
        incomingPlacements: [{parentTimelineId: "sprite-7", placedTimelineId: "sprite-8", sourceObjectId: "8", hasClipActions: false}],
        outgoingPlacements: [{parentTimelineId: "sprite-8", placedTimelineId: null, sourceObjectId: "6", hasClipActions: false}],
      },
      declaredFrameDomainAudit: {sourceTimelineDomainCount: 0, frameDomainIds: [], notDeclared: true},
      preservedObligations: {
        button: pending("pending-button"),
        interaction: pending("pending-interaction"),
        behavior: pending("pending-behavior"),
        fullFrame: pending("pending-full-frame"),
        audio: pending("pending-audio"),
      },
    }],
    acceptanceEffects: {
      buttonAccepted: false,
      interactionAccepted: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      rmseAccepted: false,
      humanReviewAccepted: false,
      ownerReviewAccepted: false,
    },
    strictAcceptanceEffect: "none; fixture evidence does not satisfy acceptance",
  };
}

function staticMultiFrameEvidence(fixture, inventorySha256, {withParentTerminalZeroWrap = false} = {}) {
  const source = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "source-swf");
  const swfmill = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "swfmill-xml");
  const scripts = fixture.inventory.evidenceIndex.find(({artifactId}) => artifactId === "ffdec-scripts");
  const pending = (status) => ({required: true, satisfiedByDisposition: false, status});
  return {
    schemaVersion: 2,
    evidenceType: "static-frame-domain-disposition-evidence",
    animationId: fixture.animationId,
    status: "verified-static-composite-claims",
    migrationStatusChanged: false,
    authorityStatement: ["source", "parent clock", "obligations"],
    generatedFrom: {
      sourceSwf: {path: source.path, sha256: source.sha256},
      migrationManifest: {
        path: "migration.json",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        sha256: fixture.manifestSha256,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      scenarioInventory: {path: "audit/scenario-inventory.json", sha256: inventorySha256, schemaVersion: 1},
      swfmillStructure: {path: swfmill.path, sha256: swfmill.sha256, uncompressedSha256: digest("swfmill-uncompressed")},
      ffdecScripts: {path: scripts.path, sha256: scripts.sha256, uncompressedSha256: scripts.uncompressedSha256},
    },
    nativeStage: {twipsPerPixel: 20, boundsTwips: {left: 0, right: 16000, top: 0, bottom: 12000}, widthPixels: 800, heightPixels: 600},
    claimSetContracts: [{
      proofType: "multi-frame-scriptless-parent-clock-composite-child",
      expectedTimelineCount: 1,
      expectedTimelineIds: ["sprite-8"],
      verifiedTimelineCount: 1,
      verifiedTimelineIds: ["sprite-8"],
      exactMatch: true,
    }],
    claims: [{
      timelineId: "sprite-8",
      sourceObjectId: "8",
      frameCount: 3,
      disposition: "composite-child-with-parent",
      role: "multi-frame-scriptless-parent-clock-composite-child",
      claimScope: "local-playhead-fully-derived-from-declared-parent-clock",
      structuralReachability: "reachable-from-root-placement-graph",
      sourceBinding: {path: source.path, sha256: source.sha256},
      parentBinding: {
        parentTimelineId: "sprite-7",
        parentSourceObjectId: "7",
        parentFrameDomainId: "sprite-7",
        parentFrameCount: 120,
        rootPlacement: {frame: 6, depth: "1", declaredSourceObjectId: "7", instanceName: "animation", hasClipActions: false},
      },
      tagCensus: {observed: {End: 1, PlaceObject2: 1, ShowFrame: 3}, expected: {End: 1, PlaceObject2: 1, ShowFrame: 3}, declaredFrameCount: 3, observedShowFrameCount: 3, doActionTagCount: 0, doInitActionTagCount: 0, endTagCount: 1, exactMatch: true},
      scriptAudit: {
        ffdecFrameScriptCount: 0,
        ffdecFrameScripts: [],
        attributedDoInitActionCount: 0,
        attributedDoInitActions: [],
        globalDoInitActionCount: 0,
        globalDoInitActionSpriteObjectIds: [],
        expectedGlobalDoInitActionSpriteObjectIds: [],
        globalDoInitActionSetExactMatch: true,
        namedIncomingInstanceCount: 0,
        namedIncomingInstances: [],
        dynamicAddressingReferenceCount: 0,
        dynamicAddressingReferences: [],
        externalTargetControlCount: 0,
        externalTargetControls: [],
        nonTargetPlayheadControlReferenceCount: 0,
        nonTargetPlayheadControlReferences: [],
        scriptlessLocalTimeline: true,
      },
      placementLifecycleAudit: {
        incomingPlacementCount: withParentTerminalZeroWrap ? 2 : 1,
        parentUpdateCount: 1,
        explicitRemovalCount: 1,
        ...(withParentTerminalZeroWrap ? {parentTerminalTerminationCount: 1} : {}),
        replacementTerminationCount: 0,
        ...(withParentTerminalZeroWrap ? {zeroWrapLifetimeCount: 1} : {}),
        clipActionCount: 0,
        allInstancesFreshAtEmptyDepth: true,
        allLifetimesMapped: true,
        lifetimes: [{
          placementOrdinal: 1,
          parentTimelineId: "sprite-7",
          parentFrameDomainId: "sprite-7",
          sourceObjectId: "8",
          depth: "16",
          startFrame: 1,
          endFrame: 4,
          durationFrames: 4,
          depthWasEmptyBeforePlacement: true,
          predecessorBoundary: null,
          placement: {frame: 1, depth: "16", declaredSourceObjectId: "8", replace: "0", hasClipActions: false},
          updates: [{frame: 2, depth: "16", declaredSourceObjectId: null, preservesInstanceIdentity: true, hasClipActions: false, localFrame: 2}],
          termination: {kind: "removal", frame: 5, depth: "16", tag: "RemoveObject2"},
          localPlayhead: {
            indexing: "one-indexed",
            entryLocalFrame: 1,
            parentFrameToLocalFrameFormula: "((parentFrame - startFrame) % frameCount) + 1",
            frameCount: 3,
            terminalLocalFrame: 1,
            completeVisibleCycleCount: 1,
            wrapCount: 1,
            implicitResetCount: 0,
            explicitFreshPlacementResetCount: 1,
            segments: [
              {kind: "entry", parentStartFrame: 1, parentEndFrame: 3, localStartFrame: 1, localEndFrame: 3},
              {kind: "scriptless-wrap", parentStartFrame: 4, parentEndFrame: 4, localStartFrame: 1, localEndFrame: 1},
            ],
          },
        }, ...(withParentTerminalZeroWrap ? [{
          placementOrdinal: 2,
          parentTimelineId: "sprite-7",
          parentFrameDomainId: "sprite-7",
          sourceObjectId: "8",
          depth: "16",
          startFrame: 118,
          endFrame: 120,
          durationFrames: 3,
          depthWasEmptyBeforePlacement: true,
          predecessorBoundary: {kind: "removal", frame: 5, depth: "16", tag: "RemoveObject2"},
          placement: {frame: 118, depth: "16", declaredSourceObjectId: "8", replace: "0", hasClipActions: false},
          updates: [],
          termination: {kind: "parent-timeline-terminal", frame: 120, depth: "16", tag: "End"},
          terminalAtParentEndPermittedByPinnedSpec: true,
          localPlayhead: {
            indexing: "one-indexed",
            entryLocalFrame: 1,
            parentFrameToLocalFrameFormula: "((parentFrame - startFrame) % frameCount) + 1",
            frameCount: 3,
            terminalLocalFrame: 3,
            completeVisibleCycleCount: 1,
            wrapCount: 0,
            zeroWrapPermittedByPinnedSpec: true,
            implicitResetCount: 0,
            explicitFreshPlacementResetCount: 1,
            segments: [
              {kind: "entry", parentStartFrame: 118, parentEndFrame: 120, localStartFrame: 1, localEndFrame: 3},
            ],
          },
        }] : [])],
      },
      internalDisplayGraph: {
        eventCount: 1,
        placementEventCount: 1,
        removalEventCount: 0,
        unresolvedObjectCount: 0,
        clipActionCount: 0,
        allEventsHaveNoClipActions: true,
        events: [{kind: "place", hasClipActions: false}],
      },
      declaredFrameDomainAudit: {sourceTimelineDomainCount: 0, frameDomainIds: [], notDeclared: true, representedByParentFrameDomainId: "sprite-7"},
      sourcePlayheadRule: {indexing: "one-indexed", sourceGraphProvesAllWrapsAndResets: true, inferredLoopOrResetCount: 0},
      preservedObligations: {
        visual: pending("pending-visual"),
        button: pending("pending-button"),
        interaction: pending("pending-interaction"),
        behavior: pending("pending-behavior"),
        fullFrame: pending("pending-full-frame"),
        rmse: pending("pending-rmse"),
        audio: pending("pending-audio"),
      },
    }],
    acceptanceEffects: {
      buttonAccepted: false,
      interactionAccepted: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      rmseAccepted: false,
      humanReviewAccepted: false,
      ownerReviewAccepted: false,
    },
    strictAcceptanceEffect: "none; fixture evidence does not satisfy acceptance",
  };
}

test("parses bounded frame-domain disposition arguments", () => {
  const options = parseArguments([
    "--check",
    "--id", COURSE_PILOT_IDS[0],
    "--id", COURSE_PILOT_IDS[1],
    "--release-id", "lesson-fixture",
    "--lesson-releases", "catalog/lesson-releases.json",
    "--migrations", "migrations",
  ]);
  assert.equal(options.check, true);
  assert.deepEqual(options.ids, COURSE_PILOT_IDS.slice(0, 2));
  assert.equal(options.releaseId, "lesson-fixture");
  assert.equal(options.lessonReleasePath.endsWith("/catalog/lesson-releases.json"), true);
  assert.equal(options.lessonReleasePathExplicit, true);
  assert.equal(options.migrationsRoot.endsWith("/migrations"), true);
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
  assert.throws(() => parseArguments(["--migrations"]), /requires a value/);
  assert.throws(() => parseArguments(["--release-id"]), /requires a value/);
  assert.throws(() => parseArguments(["--lesson-releases"]), /requires a value/);
  assert.throws(
    () => parseArguments(["--lesson-releases", "catalog/lesson-releases.json"]),
    /requires --release-id/,
  );
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("keeps legacy defaults and requires exact release authority for non-pilot IDs", async (t) => {
  assert.deepEqual(await resolveFrameDomainDispositionIds({}), COURSE_PILOT_IDS);
  await assert.rejects(
    resolveFrameDomainDispositionIds({ids: ["course-release-fixture-001"]}),
    /non-pilot IDs require --release-id/,
  );
  await assert.rejects(
    resolveFrameDomainDispositionIds({
      ids: ["course-release-fixture-001", "course-release-fixture-001"],
      releaseId: "lesson-fixture",
    }),
    /must not be repeated/,
  );
  const release = await materializeReleaseFixture(t);
  assert.deepEqual(
    await resolveFrameDomainDispositionIds({
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      allowFullReleaseSelection: true,
    }),
    ["course-release-fixture-001"],
  );
  await assert.rejects(
    resolveFrameDomainDispositionIds({
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
    }),
    /allowFullReleaseSelection/,
  );
  await assert.rejects(
    resolveFrameDomainDispositionIds({
      ids: ["course-release-fixture-missing"],
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
    }),
    /not in the exact lesson release/,
  );
});

test("requires the lesson-release catalog to be a project-contained, real, single-link file", async (t) => {
  await t.test("lexically outside the project", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const outsideRoot = await mkdtemp(path.join(os.tmpdir(), "frame-domain-outside-catalog-"));
    subtest.after(() => rm(outsideRoot, {recursive: true, force: true}));
    const outsideCatalog = path.join(outsideRoot, "lesson-releases.json");
    await writeFile(outsideCatalog, await readFile(release.lessonReleasePath));
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: outsideCatalog,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /must be contained by/,
    );
  });

  await t.test("direct symbolic link", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const linkedCatalog = path.join(release.root, "lesson-releases-link.json");
    await symlink(release.lessonReleasePath, linkedCatalog);
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: linkedCatalog,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /ordinary non-symlink file/,
    );
  });

  await t.test("hard-linked file", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const hardSource = path.join(release.root, "lesson-releases-hard-source.json");
    const hardCatalog = path.join(release.root, "lesson-releases-hard-link.json");
    await writeFile(hardSource, await readFile(release.lessonReleasePath));
    await link(hardSource, hardCatalog);
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: hardCatalog,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /exactly one hard link/,
    );
  });

  await t.test("project-contained path through an escaping parent symlink", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const outsideRoot = await mkdtemp(path.join(os.tmpdir(), "frame-domain-parent-link-"));
    subtest.after(() => rm(outsideRoot, {recursive: true, force: true}));
    const outsideCatalog = path.join(outsideRoot, "lesson-releases.json");
    await writeFile(outsideCatalog, await readFile(release.lessonReleasePath));
    const linkedParent = path.join(release.root, "catalog-parent-link");
    await symlink(outsideRoot, linkedParent);
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: path.join(linkedParent, "lesson-releases.json"),
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /real path must remain contained/,
    );
  });
});

test("verifies four synthetic work-study IDs as exact physical lesson-release members", async (t) => {
  const workStudyIds = [
    "shell-course-g05-l04-index-local-fixture",
    "course-g05-l04-rw-002-fixture",
    "course-g05-l04-in-019-fixture",
    "course-g05-l04-fq-002-fixture",
  ];
  const release = await materializeReleaseFixture(t, {
    ids: workStudyIds,
    releaseId: "lesson-g05-l04-number-lines-fixture",
  });
  const selected = await resolveFrameDomainDispositionIds({
    ids: workStudyIds,
    lessonReleasePath: release.lessonReleasePath,
    migrationsRoot: release.migrationsRoot,
    releaseId: release.releaseId,
    sourceRoot: release.root,
  });
  assert.deepEqual(selected, workStudyIds);
});

test("builds an explicitly verified release member while leaving unsupported nested domains unresolved", async (t) => {
  const release = await materializeReleaseFixture(t);
  const workspace = path.join(release.migrationsRoot, "course-release-fixture-001");
  const manifestPath = path.join(workspace, "migration.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const [manifestBefore, inventoryBefore] = await Promise.all([
    readFile(manifestPath),
    readFile(inventoryPath),
  ]);
  const [result] = await buildFrameDomainDispositions({
    ids: ["course-release-fixture-001"],
    lessonReleasePath: release.lessonReleasePath,
    migrationsRoot: release.migrationsRoot,
    releaseId: release.releaseId,
    sourceRoot: release.root,
  });
  assert.equal(result.action, "written");
  assert.equal(result.report.status, "structurally-enumerated-dispositions-unresolved");
  assert.equal(result.report.summary.dispositionCounts["declared-frame-domain"], 1);
  assert.equal(result.report.summary.dispositionCounts["composite-child-with-parent"], 0);
  assert.equal(result.report.summary.dispositionCounts["independent-required"], 0);
  assert.equal(result.report.summary.dispositionCounts.nonvisual, 0);
  assert.equal(result.report.summary.dispositionCounts.unresolved, 2);
  assert.equal(result.report.migrationStatusChanged, false);
  assert.match(result.report.strictAcceptanceEffect, /^none;/);
  const releaseCatalogBytes = await readFile(release.lessonReleasePath);
  assert.deepEqual(result.report.generatedFrom.lessonReleaseCatalog, {
    releaseId: release.releaseId,
    path: path.relative(PROJECT_ROOT, release.lessonReleasePath).split(path.sep).join("/"),
    bytes: releaseCatalogBytes.length,
    sha256: digest(releaseCatalogBytes),
    schemaVersion: 1,
    member: {
      animationId: "course-release-fixture-001",
      ordinal: 1,
      shardId: "fixture-shard",
      assetId: release.fixtures.get("course-release-fixture-001").fixture.manifest.assetId,
      sourcePath: "sources/course-release-fixture-001.swf",
      sourceSha256: release.fixtures.get("course-release-fixture-001").fixture.manifest.source.swfSha256,
    },
    bindingStatus: "verified-exact-release-member",
  });

  const outputPath = path.join(workspace, "audit", "frame-domain-disposition.json");
  assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), result.report);
  const [manifestAfter, inventoryAfter] = await Promise.all([
    readFile(manifestPath),
    readFile(inventoryPath),
  ]);
  assert.deepEqual(manifestAfter, manifestBefore);
  assert.deepEqual(inventoryAfter, inventoryBefore);
});

test("release-member preflight fails closed on catalog, workspace, and physical-source drift", async (t) => {
  await t.test("catalog asset identity drift", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const document = JSON.parse(await readFile(release.lessonReleasePath, "utf8"));
    document.releases[0].members[0].assetId = `swf-${digest("wrong")}`;
    await writeFile(release.lessonReleasePath, `${JSON.stringify(document, null, 2)}\n`);
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /assetId does not match source SHA-256/,
    );
  });

  await t.test("workspace manifest identity drift", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const manifestPath = path.join(
      release.migrationsRoot,
      "course-release-fixture-001",
      "migration.json",
    );
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.assetId = `swf-${digest("wrong")}`;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /workspace assetId does not match the release member/,
    );
  });

  await t.test("physical source hash drift", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    await writeFile(release.fixtures.get("course-release-fixture-001").sourcePath, "drift");
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /physical source hash does not match the release member/,
    );
  });
});

test("preflights every selected release member before writing any disposition", async (t) => {
  const firstId = "course-release-fixture-001";
  const secondId = "course-release-fixture-002";
  const release = await materializeReleaseFixture(t, {
    ids: [firstId, secondId],
    missingScenarioIds: [secondId],
  });
  await assert.rejects(
    buildFrameDomainDispositions({
      ids: [firstId, secondId],
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
    }),
    new RegExp(`${secondId}: scenario inventory is missing`),
  );
  await assert.rejects(
    readFile(
      path.join(release.migrationsRoot, firstId, "audit", "frame-domain-disposition.json"),
      "utf8",
    ),
    {code: "ENOENT"},
  );
});

test("refuses symbolic-link and hard-link disposition targets without changing their referents", async (t) => {
  await t.test("symbolic-link target", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const fixture = release.fixtures.get("course-release-fixture-001");
    const outputPath = path.join(fixture.workspace, "audit", "frame-domain-disposition.json");
    const referentPath = path.join(release.root, "symlink-referent.json");
    const referentBytes = Buffer.from("do-not-change-symlink-referent\n");
    await writeFile(referentPath, referentBytes);
    await symlink(referentPath, outputPath);
    await assert.rejects(
      buildFrameDomainDispositions({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /ordinary non-symlink file/,
    );
    assert.deepEqual(await readFile(referentPath), referentBytes);
  });

  await t.test("hard-link target", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const fixture = release.fixtures.get("course-release-fixture-001");
    const outputPath = path.join(fixture.workspace, "audit", "frame-domain-disposition.json");
    const referentPath = path.join(release.root, "hardlink-referent.json");
    const referentBytes = Buffer.from("do-not-change-hardlink-referent\n");
    await writeFile(referentPath, referentBytes);
    await link(referentPath, outputPath);
    await assert.rejects(
      buildFrameDomainDispositions({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /exactly one hard link/,
    );
    assert.deepEqual(await readFile(referentPath), referentBytes);
  });
});

test("refuses scenario inputs with symlink ancestors or hard links", async (t) => {
  await t.test("project-contained symlink ancestor", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const fixture = release.fixtures.get("course-release-fixture-001");
    const auditPath = path.join(fixture.workspace, "audit");
    const auditRealPath = path.join(fixture.workspace, "audit-real");
    await rename(auditPath, auditRealPath);
    await symlink("audit-real", auditPath);
    await assert.rejects(
      buildFrameDomainDispositions({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /scenario inventory real path must remain contained; ancestor must be a real directory/,
    );
    await unlink(auditPath);
    await rename(auditRealPath, auditPath);
  });

  await t.test("hard-linked scenario inventory", async (subtest) => {
    const release = await materializeReleaseFixture(subtest);
    const fixture = release.fixtures.get("course-release-fixture-001");
    const inventoryPath = path.join(
      fixture.workspace,
      "audit",
      "scenario-inventory.json",
    );
    const hardLinkPath = path.join(
      fixture.workspace,
      "audit",
      "scenario-inventory-hard-link.json",
    );
    await link(inventoryPath, hardLinkPath);
    await assert.rejects(
      buildFrameDomainDispositions({
        ids: ["course-release-fixture-001"],
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
      }),
      /scenario inventory must have exactly one hard link/,
    );
  });
});

test("rolls back every earlier disposition when a later batch commit fails", async (t) => {
  const ids = ["course-release-fixture-001", "course-release-fixture-002"];
  const release = await materializeReleaseFixture(t, {ids});
  const originals = new Map();
  for (const id of ids) {
    const outputPath = path.join(
      release.fixtures.get(id).workspace,
      "audit",
      "frame-domain-disposition.json",
    );
    const bytes = Buffer.from(`original:${id}\n`);
    originals.set(id, {outputPath, bytes});
    await writeFile(outputPath, bytes);
  }

  await assert.rejects(
    buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      transactionHooks: {
        beforeCommit({index}) {
          if (index === 1) throw new Error("injected second-target commit failure");
        },
      },
    }),
    /injected second-target commit failure/,
  );

  for (const id of ids) {
    const {outputPath, bytes} = originals.get(id);
    assert.deepEqual(await readFile(outputPath), bytes);
    const auditEntries = await readdir(path.dirname(outputPath));
    assert.equal(
      auditEntries.some((name) => name.includes(".transaction") || name.endsWith(".stage")),
      false,
    );
  }
});

test("handoff install never overwrites a foreign second-target occupant", async (t) => {
  const ids = ["course-release-fixture-001", "course-release-fixture-002"];
  const release = await materializeReleaseFixture(t, {ids});
  const originals = new Map();
  for (const id of ids) {
    const outputPath = path.join(
      release.fixtures.get(id).workspace,
      "audit",
      "frame-domain-disposition.json",
    );
    const bytes = Buffer.from(`original:${id}\n`);
    originals.set(id, {outputPath, bytes});
    await writeFile(outputPath, bytes);
  }
  const foreignBytes = Buffer.from("{\"foreign\":true}\n");
  await assert.rejects(
    buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      transactionHooks: {
        async beforeInstall({index, outputPath}) {
          if (index === 1) await writeFile(outputPath, foreignBytes);
        },
      },
    }),
    /rollback|EEXIST/,
  );
  assert.deepEqual(
    await readFile(originals.get(ids[0]).outputPath),
    originals.get(ids[0]).bytes,
  );
  assert.deepEqual(
    await readFile(originals.get(ids[1]).outputPath),
    foreignBytes,
  );
});

test(
  "exact release fingerprint rejects a same-count substituted member set",
  async (t) => {
    const temporary = await mkdtemp(
      path.join(PROJECT_ROOT, ".g5-l5-release-contract-"),
    );
    t.after(() => rm(temporary, {recursive: true, force: true}));
    const document = JSON.parse(
      await readFile(
        path.join(PROJECT_ROOT, "catalog", "lesson-releases.json"),
        "utf8",
      ),
    );
    const release = document.releases.find(
      ({releaseId}) => releaseId === G5_L5_RELEASE_ID,
    );
    assert.equal(release.members.length, 57);
    release.members[0].animationId =
      "course-g05-l05-substituted-same-count";
    const catalogPath = path.join(temporary, "lesson-releases.json");
    await writeFile(
      catalogPath,
      `${JSON.stringify(document, null, 2)}\n`,
    );
    await assert.rejects(
      resolveFrameDomainDispositionIds({
        releaseId: G5_L5_RELEASE_ID,
        lessonReleasePath: catalogPath,
        migrationsRoot: path.join(PROJECT_ROOT, "migrations"),
        allowFullReleaseSelection: true,
        expectedReleaseFingerprintSha256:
          G5_L5_RELEASE_FINGERPRINT_SHA256,
        expectedOrderedMemberIdentitySha256:
          G5_L5_ORDERED_MEMBER_IDENTITY_SHA256,
      }),
      /lesson-release fingerprint drifted/,
    );
  },
);

test("stage-N failure removes every generic transaction artifact", async (t) => {
  const ids = ["course-release-fixture-001", "course-release-fixture-002"];
  const release = await materializeReleaseFixture(t, {ids});
  await assert.rejects(
    buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      transactionHooks: {
        afterStage({index}) {
          if (index === 1) throw new Error("injected generic stage-N failure");
        },
      },
    }),
    /injected generic stage-N failure/,
  );
  for (const id of ids) {
    const outputPath = path.join(
      release.fixtures.get(id).workspace,
      "audit",
      "frame-domain-disposition.json",
    );
    await assert.rejects(readFile(outputPath), {code: "ENOENT"});
    const names = await readdir(path.dirname(outputPath));
    assert.equal(
      names.some((name) =>
        name.includes(".transaction") || name.endsWith(".stage")),
      false,
    );
  }
});

test(
  "rollback preserves a same-bytes foreign disposition inode",
  async (t) => {
    const ids = ["course-release-fixture-001", "course-release-fixture-002"];
    const release = await materializeReleaseFixture(t, {ids});
    const firstOutput = path.join(
      release.fixtures.get(ids[0]).workspace,
      "audit",
      "frame-domain-disposition.json",
    );
    await writeFile(firstOutput, "original\n");
    let foreignIdentity;
    let foreignBytes;
    await assert.rejects(
      buildFrameDomainDispositions({
        ids,
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
        transactionHooks: {
          async afterCommit({index, outputPath}) {
            if (index !== 0) return;
            foreignBytes = await readFile(outputPath);
            await unlink(outputPath);
            await writeFile(outputPath, foreignBytes);
            const information = await lstat(outputPath, {bigint: true});
            foreignIdentity = {
              dev: information.dev,
              ino: information.ino,
            };
          },
        },
      }),
      /rollback/,
    );
    const current = await lstat(firstOutput, {bigint: true});
    assert.deepEqual(
      {dev: current.dev, ino: current.ino},
      foreignIdentity,
    );
    assert.deepEqual(await readFile(firstOutput), foreignBytes);
  },
);

test(
  "generic backup cleanup failure never rolls back committed targets",
  async (t) => {
    const ids = ["course-release-fixture-001", "course-release-fixture-002"];
    const release = await materializeReleaseFixture(t, {ids});
    await buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
    });
    const committed = new Map();
    let foreignBackupPath;
    let foreignBackupIdentity;
    await assert.rejects(
      buildFrameDomainDispositions({
        ids,
        lessonReleasePath: release.lessonReleasePath,
        migrationsRoot: release.migrationsRoot,
        releaseId: release.releaseId,
        sourceRoot: release.root,
        transactionHooks: {
          async beforeCleanup({transactions}) {
            for (const transaction of transactions) {
              const information = await lstat(
                transaction.outputPath,
                {bigint: true},
              );
              committed.set(transaction.outputPath, {
                bytes: await readFile(transaction.outputPath),
                dev: information.dev,
                ino: information.ino,
              });
            }
            const transaction = transactions[1];
            const backupBytes = await readFile(transaction.backupPath);
            await unlink(transaction.backupPath);
            await writeFile(transaction.backupPath, backupBytes, {flag: "wx"});
            foreignBackupPath = transaction.backupPath;
            const foreign = await lstat(foreignBackupPath, {bigint: true});
            foreignBackupIdentity = {
              dev: foreign.dev,
              ino: foreign.ino,
            };
          },
        },
      }),
      /committed, but .*cleanup/,
    );
    for (const [outputPath, expected] of committed) {
      const current = await lstat(outputPath, {bigint: true});
      assert.deepEqual(
        {dev: current.dev, ino: current.ino},
        {dev: expected.dev, ino: expected.ino},
      );
      assert.deepEqual(await readFile(outputPath), expected.bytes);
    }
    const foreign = await lstat(foreignBackupPath, {bigint: true});
    assert.deepEqual(
      {dev: foreign.dev, ino: foreign.ino},
      foreignBackupIdentity,
    );
  },
);

test("input CAS drift rolls back earlier frame-domain outputs", async (t) => {
  const ids = ["course-release-fixture-001", "course-release-fixture-002"];
  const release = await materializeReleaseFixture(t, {ids});
  const driftingManifest = path.join(
    release.fixtures.get(ids[1]).workspace,
    "migration.json",
  );
  const manifestBefore = await readFile(driftingManifest);
  await assert.rejects(
    buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      transactionHooks: {
        async afterCommit({index}) {
          if (index === 0) {
            await writeFile(
              driftingManifest,
              Buffer.concat([manifestBefore, Buffer.from("\n")]),
            );
          }
        },
      },
    }),
    /migration manifest changed after preflight/,
  );
  for (const id of ids) {
    await assert.rejects(
      readFile(
        path.join(
          release.fixtures.get(id).workspace,
          "audit",
          "frame-domain-disposition.json",
        ),
      ),
      {code: "ENOENT"},
    );
  }
});

test("removes newly created earlier dispositions when a later batch commit fails", async (t) => {
  const ids = ["course-release-fixture-001", "course-release-fixture-002"];
  const release = await materializeReleaseFixture(t, {ids});
  await assert.rejects(
    buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      transactionHooks: {
        beforeCommit({index}) {
          if (index === 1) throw new Error("injected absent-target second commit failure");
        },
      },
    }),
    /injected absent-target second commit failure/,
  );
  for (const id of ids) {
    const outputPath = path.join(
      release.fixtures.get(id).workspace,
      "audit",
      "frame-domain-disposition.json",
    );
    await assert.rejects(readFile(outputPath), {code: "ENOENT"});
    const auditEntries = await readdir(path.dirname(outputPath));
    assert.equal(
      auditEntries.some((name) => name.includes(".transaction") || name.endsWith(".stage")),
      false,
    );
  }
});

test("CAS recheck preserves earlier outputs when a later target changes externally", async (t) => {
  const ids = ["course-release-fixture-001", "course-release-fixture-002"];
  const release = await materializeReleaseFixture(t, {ids});
  const firstOutput = path.join(
    release.fixtures.get(ids[0]).workspace,
    "audit",
    "frame-domain-disposition.json",
  );
  const secondOutput = path.join(
    release.fixtures.get(ids[1]).workspace,
    "audit",
    "frame-domain-disposition.json",
  );
  const firstOriginal = Buffer.from("first-original\n");
  const secondOriginal = Buffer.from("second-original\n");
  const secondExternal = Buffer.from("second-external-change\n");
  await writeFile(firstOutput, firstOriginal);
  await writeFile(secondOutput, secondOriginal);

  await assert.rejects(
    buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      transactionHooks: {
        async afterCommit({index}) {
          if (index === 0) await writeFile(secondOutput, secondExternal);
        },
      },
    }),
    /changed after preflight/,
  );
  assert.deepEqual(await readFile(firstOutput), firstOriginal);
  assert.deepEqual(await readFile(secondOutput), secondExternal);
});

test("release-catalog CAS guard rolls back earlier outputs after catalog drift", async (t) => {
  const ids = ["course-release-fixture-001", "course-release-fixture-002"];
  const release = await materializeReleaseFixture(t, {ids});
  const catalogBefore = await readFile(release.lessonReleasePath, "utf8");
  await assert.rejects(
    buildFrameDomainDispositions({
      ids,
      lessonReleasePath: release.lessonReleasePath,
      migrationsRoot: release.migrationsRoot,
      releaseId: release.releaseId,
      sourceRoot: release.root,
      transactionHooks: {
        async afterCommit({index}) {
          if (index === 0) {
            await writeFile(release.lessonReleasePath, `${catalogBefore.trimEnd()}\n\n`);
          }
        },
      },
    }),
    /Lesson-release catalog changed after preflight/,
  );
  for (const id of ids) {
    const outputPath = path.join(
      release.fixtures.get(id).workspace,
      "audit",
      "frame-domain-disposition.json",
    );
    await assert.rejects(readFile(outputPath), {code: "ENOENT"});
  }
});

function sourceProvenIndependentEvidence(fixture, inventorySha256) {
  const source = fixture.inventory.evidenceIndex.find(
    ({artifactId}) => artifactId === "source-swf",
  );
  const swfmill = fixture.inventory.evidenceIndex.find(
    ({artifactId}) => artifactId === "swfmill-xml",
  );
  const scripts = fixture.inventory.evidenceIndex.find(
    ({artifactId}) => artifactId === "ffdec-scripts",
  );
  const frameScriptBody = "stop();";
  const localActionFrames = [120];
  const localActionFrameSequenceSha256 = digest("120\n");
  const claim = {
    timelineId: "sprite-7",
    sourceObjectId: "7",
    frameCount: 120,
    parentTimelineIds: ["root"],
    priorDisqualifiers: [
      "swfmill-do-action-present",
      "ffdec-frame-script-present",
    ],
    sourceProof: {
      declaredFrameCount: 120,
      observedShowFrameCount: 120,
      exactTagCensus: {DoAction: 1, End: 1, ShowFrame: 120},
      directDoActionTagCount: 1,
      directDoInitActionTagCount: 0,
      ffdecFrameScriptCount: 1,
      nonemptyFfdecFrameScriptCount: 1,
      exactDoActionToFfdecFrameScriptCount: true,
      swfmillDoActionFrames: localActionFrames,
      ffdecFrameScriptFrames: localActionFrames,
      exactDoActionToFfdecFrameSequence: true,
      localActionFrameSequenceEncoding:
        "one-indexed-decimal-frame-newline-v1",
      swfmillDoActionFrameSequenceSha256: localActionFrameSequenceSha256,
      ffdecFrameScriptFrameSequenceSha256: localActionFrameSequenceSha256,
      allFrameScriptCoordinatesWithinLocalDomain: true,
      frameScripts: [{
        script: "DefineSprite_7/frame_120/DoAction.as",
        frame: 120,
        bodyBytes: Buffer.byteLength(frameScriptBody),
        bodySha256: digest(frameScriptBody),
        bodyNonempty: true,
        lineStart: 2,
        lineEnd: 2,
      }],
    },
    disposition: "independent-required",
    role: SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
    claimScope: "separate-local-frame-action-domain-required",
    sourceConclusion: "source-local action state requires a child domain",
    preservedObligations: Object.fromEntries([
      "naturalRuntimeReachability",
      "actionSemantics",
      "interaction",
      "visual",
      "audio",
      "fullFrameRmse",
      "humanReview",
      "ownerAcceptance",
    ].map((key) => [key, "pending"])),
  };
  const rejected = {
    timelineId: "sprite-8",
    sourceObjectId: "8",
    frameCount: 1,
    parentTimelineIds: ["root"],
    priorDisqualifiers: ["swfmill-do-action-present"],
    sourceProof: {
      declaredFrameCount: 1,
      observedShowFrameCount: 1,
      exactTagCensus: {ShowFrame: 1},
      directDoActionTagCount: 0,
      directDoInitActionTagCount: 0,
      ffdecFrameScriptCount: 0,
      nonemptyFfdecFrameScriptCount: 0,
      exactDoActionToFfdecFrameScriptCount: false,
      allFrameScriptCoordinatesWithinLocalDomain: true,
      frameScripts: [],
    },
    disposition: "unresolved",
    blockerClass: "scripted-one-frame-domain-semantics-unproved",
    nextEvidenceAction: "obtain authoring or authoritative runtime evidence",
  };
  const generatedFrom = {
    sourceSwf: {path: source.path, sha256: source.sha256},
    scenarioInventory: {
      path: `migrations/${fixture.animationId}/audit/scenario-inventory.json`,
      sha256: inventorySha256,
    },
    migrationTechnicalProjection: {
      path: `migrations/${fixture.animationId}/migration.json`,
      sha256: fixture.manifestSha256,
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
    },
    swfmillStructure: {
      path: swfmill.path,
      sha256: swfmill.sha256,
      uncompressedSha256: swfmill.uncompressedSha256,
    },
    ffdecScripts: {
      path: scripts.path,
      sha256: scripts.sha256,
      uncompressedSha256: scripts.uncompressedSha256,
    },
  };
  return {
    schemaVersion: 1,
    evidenceType: "source-proven-independent-frame-domain-evidence",
    status: "verified-source-obligation",
    animationId: fixture.animationId,
    migrationStatusChanged: false,
    generatedBy: {
      proofEngine: {
        path: "scripts/source-proven-independent-frame-domain-evidence.mjs",
        sha256: digest("independent-proof-engine"),
      },
    },
    generatedFrom,
    summary: {
      remainingBefore: 2,
      independentRequired: 1,
      unresolvedAfter: 1,
    },
    exactPairSets: {
      accepted: canonicalIndependentPairSet([{
        animationId: fixture.animationId,
        timelineId: "sprite-7",
      }]),
      rejected: canonicalIndependentPairSet([{
        animationId: fixture.animationId,
        timelineId: "sprite-8",
      }]),
    },
    claims: [claim],
    rejected: [rejected],
    acceptanceEffects: {
      authoritativeRuntimeAccepted: false,
      behaviorAccepted: false,
    },
    strictAcceptanceEffect: "none; source obligation only",
  };
}

test("enumerates root-reachable timelines and leaves unsupported dispositions unresolved", () => {
  const fixture = syntheticFixture();
  const report = buildDispositionReport({
    ...fixture,
    inventorySha256: digest("scenario-inventory"),
  });
  assert.deepEqual(report.timelines.map(({timelineId}) => timelineId), ["root", "sprite-7", "sprite-8"]);
  assert.deepEqual(Object.keys(report.summary.dispositionCounts), DISPOSITIONS);
  assert.equal(report.summary.reachableChildTimelineCount, 2);
  assert.equal(report.summary.excludedNotProvenTimelineCount, 1);
  assert.equal(report.summary.dispositionCounts["declared-frame-domain"], 1);
  assert.equal(report.summary.dispositionCounts.unresolved, 2);
  assert.equal(report.summary.dispositionCounts["composite-child-with-parent"], 0);
  assert.equal(report.summary.dispositionCounts["independent-required"], 0);
  assert.equal(report.summary.dispositionCounts.nonvisual, 0);

  const longChild = report.timelines.find(({timelineId}) => timelineId === "sprite-7");
  assert.equal(longChild.disposition, "unresolved");
  assert.equal(longChild.riskAssessment.level, "high");
  assert.equal(longChild.riskAssessment.independentFrameDomainCandidate, true);
  assert.equal(longChild.rootPlacement.status, "proven-named-placement-chain");
  assert.deepEqual(longChild.rootPlacement.namedPlacementPath.map(({parentTimelineId, childTimelineId}) => ({parentTimelineId, childTimelineId})), [
    {parentTimelineId: "root", childTimelineId: "sprite-7"},
  ]);

  const oneFrameChild = report.timelines.find(({timelineId}) => timelineId === "sprite-8");
  assert.equal(oneFrameChild.disposition, "unresolved", "one frame alone must not be guessed composite or nonvisual");
  assert.equal(oneFrameChild.riskAssessment.level, "review");
});

test("declares a source timeline only from a matching bound manifest frame domain", () => {
  const fixture = syntheticFixture({declareChild: true});
  const report = buildDispositionReport({
    ...fixture,
    inventorySha256: digest("scenario-inventory-with-child"),
  });
  const child = report.timelines.find(({timelineId}) => timelineId === "sprite-7");
  assert.equal(child.disposition, "declared-frame-domain");
  assert.equal(child.declaredFrameDomains[0].frameDomainId, "sprite-7");
  assert.equal(child.riskAssessment.level, "none");
  assert.throws(() => buildDispositionReport({
    ...fixture,
    inventorySha256: digest("scenario-inventory-with-child"),
    manifest: {
      ...fixture.manifest,
      implementation: {
        frameDomains: fixture.manifest.implementation.frameDomains.map((domain) => (
          domain.id === "sprite-7" ? {...domain, frameCount: 119} : domain
        )),
      },
    },
  }), /does not match sprite-7 frameCount/);
});

test("assigns independent-required only from an exact source-local action contract", () => {
  const fixture = syntheticFixture();
  const inventorySha256 = digest("scenario-inventory-with-independent-proof");
  const evidence = sourceProvenIndependentEvidence(fixture, inventorySha256);
  const build = (document) => buildDispositionReport({
    ...fixture,
    inventorySha256,
    independentDispositionEvidence: document,
    independentDispositionEvidenceSha256: digest(JSON.stringify(document)),
  });
  const report = build(evidence);
  const child = report.timelines.find(
    ({timelineId}) => timelineId === "sprite-7",
  );
  assert.equal(child.disposition, "independent-required");
  assert.equal(
    child.sourceProvenIndependentEvidence.role,
    SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
  );
  assert.equal(
    child.sourceProvenIndependentEvidence.directDoActionTagCount,
    1,
  );
  assert.equal(child.riskAssessment.level, "blocking-required-domain");
  assert.equal(report.summary.dispositionCounts["independent-required"], 1);
  assert.equal(report.summary.dispositionCounts.unresolved, 1);
  assert.match(report.strictAcceptanceEffect, /^none;/);

  const parityDrift = structuredClone(evidence);
  parityDrift.claims[0].sourceProof.directDoActionTagCount = 2;
  assert.throws(
    () => build(parityDrift),
    /independent-required proof is incomplete/,
  );

  const partitionDrift = structuredClone(evidence);
  partitionDrift.rejected = [];
  partitionDrift.summary.remainingBefore = 1;
  partitionDrift.summary.unresolvedAfter = 0;
  partitionDrift.exactPairSets.rejected = canonicalIndependentPairSet([]);
  assert.throws(
    () => build(partitionDrift),
    /does not exactly partition the first-wave unresolved set/,
  );
});

test("fails closed when the current manifest no longer matches the scenario inventory binding", () => {
  const fixture = syntheticFixture();
  assert.throws(() => buildDispositionReport({
    ...fixture,
    inventorySha256: digest("scenario-inventory"),
    manifestSha256: digest("changed-manifest"),
  }), /migration technical projection is stale against scenario inventory/);
});

test("acceptance and status edits do not invalidate a disposition technical binding", () => {
  const fixture = syntheticFixture({declareChild: true});
  const signed = structuredClone(fixture.manifest);
  signed.status = "complete";
  signed.acceptance = {ownerReview: {decision: "accepted", reviewer: "Named owner", reviewedAt: "2026-07-22T00:00:00.000Z"}};
  assert.equal(technicalManifestSha256(signed), fixture.manifestSha256);
  assert.doesNotThrow(() => buildDispositionReport({
    ...fixture,
    manifest: signed,
    manifestSha256: technicalManifestSha256(signed),
    inventorySha256: digest("signed-scenario-inventory"),
  }));
});

test("promotes only a verified static audio child and preserves its audio, behavior, and full-frame obligations", () => {
  const fixture = syntheticFixture({compositeChild: true});
  const inventorySha256 = digest("scenario-inventory-with-static-composite");
  const evidence = staticCompositeEvidence(fixture, inventorySha256);
  const report = buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });
  const child = report.timelines.find(({timelineId}) => timelineId === "sprite-8");
  assert.equal(child.disposition, "composite-child-with-parent");
  assert.equal(child.staticCompositeEvidence.parentTimelineId, "sprite-7");
  assert.equal(child.staticCompositeEvidence.audioObligation.satisfiedByDisposition, false);
  assert.equal(child.staticCompositeEvidence.behaviorObligation.satisfiedByDisposition, false);
  assert.equal(child.staticCompositeEvidence.fullFrameObligation.satisfiedByDisposition, false);
  assert.equal(report.summary.dispositionCounts["composite-child-with-parent"], 1);
  assert.equal(report.strictAcceptanceEffect.startsWith("none;"), true);
});

test("promotes a verified one-frame scriptless child only as a local-playhead disposition", () => {
  const fixture = syntheticFixture({compositeChild: true});
  const inventorySha256 = digest("scenario-inventory-with-single-frame-structural-child");
  const evidence = staticSingleFrameEvidence(fixture, inventorySha256);
  const report = buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });
  const child = report.timelines.find(({timelineId}) => timelineId === "sprite-8");
  assert.equal(child.disposition, "composite-child-with-parent");
  assert.equal(child.staticCompositeEvidence.role, "single-frame-scriptless-structural-child");
  assert.equal(child.staticCompositeEvidence.claimScope, "independent-local-playhead-only");
  assert.deepEqual(child.staticCompositeEvidence.parentTimelineIds, ["sprite-7"]);
  for (const obligation of ["button", "interaction", "behavior", "fullFrame", "audio"]) {
    assert.equal(child.staticCompositeEvidence[`${obligation}Obligation`].satisfiedByDisposition, false);
  }
  assert.equal(child.riskAssessment.independentFrameDomainCandidate, false);
  assert.equal(child.riskAssessment.signals.includes("all-exported-placements-have-no-clip-actions"), true);
});

test("single-frame proof accepts exhaustively recorded reuse from an excluded parent only when a reachable parent also places the child", () => {
  const fixture = syntheticFixture({compositeChild: true});
  const inventorySha256 = digest("scenario-inventory-with-reused-single-frame-child");
  const evidence = staticSingleFrameEvidence(fixture, inventorySha256);
  evidence.claims[0].placementAudit.incomingPlacements.push({
    parentTimelineId: "sprite-99",
    placedTimelineId: "sprite-8",
    sourceObjectId: "8",
    hasClipActions: false,
  });
  evidence.claims[0].placementAudit.incomingPlacementCount = 2;
  evidence.claims[0].placementAudit.exportedPlacementCount = 3;
  const build = () => buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });
  const report = build();
  const child = report.timelines.find(({timelineId}) => timelineId === "sprite-8");
  assert.deepEqual(child.staticCompositeEvidence.parentTimelineIds, ["sprite-7", "sprite-99"]);

  evidence.claims[0].placementAudit.incomingPlacements.shift();
  evidence.claims[0].placementAudit.incomingPlacementCount = 1;
  evidence.claims[0].placementAudit.exportedPlacementCount = 2;
  assert.throws(() => build(), /lacks the exhaustive no-clipActions exported-placement proof/);
});

test("single-frame disposition rejects exact-set, script, placement, domain, and obligation drift", () => {
  const fixture = syntheticFixture({compositeChild: true});
  const inventorySha256 = digest("scenario-inventory-with-single-frame-rejections");
  const baseline = staticSingleFrameEvidence(fixture, inventorySha256);
  const build = (evidence) => buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });

  const setDrift = structuredClone(baseline);
  setDrift.claimSetContracts[0].verifiedTimelineIds = ["sprite-7"];
  assert.throws(() => build(setDrift), /does not pin one exact matching timeline ID set and count/);

  const scriptDrift = structuredClone(baseline);
  scriptDrift.claims[0].scriptAudit.ffdecFrameScriptCount = 1;
  assert.throws(() => build(scriptDrift), /lacks the exact one-frame scriptless/);

  const placementDrift = structuredClone(baseline);
  placementDrift.claims[0].placementAudit.incomingPlacements[0].hasClipActions = true;
  assert.throws(() => build(placementDrift), /lacks the exhaustive no-clipActions/);

  const domainDrift = structuredClone(baseline);
  domainDrift.claims[0].declaredFrameDomainAudit.notDeclared = false;
  assert.throws(() => build(domainDrift), /lacks the exact one-frame scriptless/);

  const obligationDrift = structuredClone(baseline);
  obligationDrift.claims[0].preservedObligations.interaction.satisfiedByDisposition = true;
  assert.throws(() => build(obligationDrift), /does not preserve the interaction obligation/);
});

test("promotes a verified multi-frame scriptless child only through its exact declared-parent clock mapping", () => {
  const fixture = syntheticFixture({compositeChild: true});
  fixture.inventory.timelineInventory.find(({timelineId}) => timelineId === "sprite-8").frameCount = 3;
  fixture.inventory.timelineInventory.find(({timelineId}) => timelineId === "sprite-7").namedPlacements = [];
  const inventorySha256 = digest("scenario-inventory-with-multi-frame-parent-clock-child");
  const evidence = staticMultiFrameEvidence(fixture, inventorySha256);
  const report = buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });
  const child = report.timelines.find(({timelineId}) => timelineId === "sprite-8");
  assert.equal(child.disposition, "composite-child-with-parent");
  assert.equal(child.staticCompositeEvidence.role, "multi-frame-scriptless-parent-clock-composite-child");
  assert.equal(child.staticCompositeEvidence.parentFrameDomainId, "sprite-7");
  assert.equal(child.staticCompositeEvidence.incomingPlacementCount, 1);
  assert.equal(child.staticCompositeEvidence.sourceProvenWrapCount, 1);
  for (const obligation of ["visual", "behavior", "fullFrame", "rmse"]) {
    assert.equal(child.staticCompositeEvidence[`${obligation}Obligation`].satisfiedByDisposition, false);
  }
  assert.equal(child.riskAssessment.independentFrameDomainCandidate, false);
});

test("promotes the narrow nested declared-parent binding without resolving the parent root-entry schedule", () => {
  const fixture = syntheticFixture({compositeChild: true});
  fixture.inventory.timelineInventory.find(
    ({timelineId}) => timelineId === "sprite-8",
  ).frameCount = 3;
  const root = fixture.inventory.timelineInventory.find(
    ({timelineId}) => timelineId === "root",
  );
  root.namedPlacements = [{
    objectId: "9",
    frame: 6,
    depth: "1",
    name: "animation",
    tag: "PlaceObject2",
    replace: "0",
    hasClipActions: false,
  }];
  fixture.inventory.timelineInventory.find(
    ({timelineId}) => timelineId === "sprite-7",
  ).namedPlacements = [];
  fixture.inventory.timelineInventory.splice(-1, 0, timeline({
    timelineId: "sprite-9",
    objectId: "9",
    frameCount: 2,
    reachability: "reachable-from-root-placement-graph",
    namedPlacements: [{
      objectId: "7",
      frame: 1,
      depth: "1",
      name: "indirectParent",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    }],
  }));
  const parentDomain = fixture.manifest.implementation.frameDomains.find(
    ({id}) => id === "sprite-7",
  );
  Object.assign(parentDomain, {
    sourceParentTimelineIds: ["sprite-9"],
    captureParentResolution: "root is the nearest universally declared containing capture domain; sourceParentTimelineIds preserve the exact direct source parents and parentEntryState remains unresolved",
    sourceProof: {
      authoritativeRuntimeEntryEstablished: false,
      strictAcceptanceEffect: "none",
    },
  });
  fixture.manifest.implementation.frameDomains.push({
    id: "sprite-9",
    kind: "nested",
    sourceTimelineId: "sprite-9",
    parentFrameDomainId: "root",
    frameCount: 2,
    role: "fixture-indirect-parent",
  });
  fixture.manifestSha256 = technicalManifestSha256(fixture.manifest);
  fixture.inventory.evidenceIndex.find(
    ({artifactId}) => artifactId === "migration-technical-contract",
  ).sha256 = fixture.manifestSha256;
  const inventorySha256 = digest(
    "scenario-inventory-with-nested-declared-parent-clock-child",
  );
  const evidence = staticMultiFrameEvidence(fixture, inventorySha256);
  evidence.claims[0].parentBinding.rootPlacement = null;
  evidence.claims[0].parentBinding.parentBindingMode =
    NESTED_DECLARED_PARENT_BINDING_MODE;
  evidence.claims[0].parentBinding.parentEntryStateEstablished = false;
  evidence.claims[0].parentBinding.parentRootPath = [
    {
      parentTimelineId: "root",
      childTimelineId: "sprite-9",
      sourceObjectId: "9",
      frame: 6,
      depth: "1",
      instanceName: "animation",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    },
    {
      parentTimelineId: "sprite-9",
      childTimelineId: "sprite-7",
      sourceObjectId: "7",
      frame: 1,
      depth: "1",
      instanceName: "indirectParent",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    },
  ];
  const build = (document) => buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: document,
    staticDispositionEvidenceSha256: digest(JSON.stringify(document)),
  });
  const report = build(evidence);
  const child = report.timelines.find(({timelineId}) => timelineId === "sprite-8");
  assert.equal(child.disposition, "composite-child-with-parent");
  assert.equal(
    child.staticCompositeEvidence.role,
    "multi-frame-scriptless-parent-clock-composite-child",
  );
  assert.equal(
    child.staticCompositeEvidence.parentBindingMode,
    NESTED_DECLARED_PARENT_BINDING_MODE,
  );
  assert.equal(
    child.staticCompositeEvidence.parentEntryStateEstablished,
    false,
  );
  assert.deepEqual(
    child.staticCompositeEvidence.parentRootPath,
    evidence.claims[0].parentBinding.parentRootPath,
  );
  assert.match(child.dispositionBasis, /parent root-entry schedule.*pending/);
  assert.equal(child.riskAssessment.independentFrameDomainCandidate, false);
  assert.match(report.strictAcceptanceEffect, /^none;/);

  const boundaryDrift = structuredClone(evidence);
  boundaryDrift.claims[0].parentBinding.parentRootPath[1].sourceObjectId = "999";
  assert.throws(
    () => build(boundaryDrift),
    /lacks the exact source\/declared-parent\/root-path binding/,
  );

  const rootPlacementDrift = structuredClone(evidence);
  rootPlacementDrift.claims[0].parentBinding.rootPlacement = {
    declaredSourceObjectId: "7",
  };
  assert.throws(
    () => build(rootPlacementDrift),
    /lacks the exact source\/declared-parent\/root-path binding/,
  );

  const nullOnly = structuredClone(evidence);
  delete nullOnly.claims[0].parentBinding.parentBindingMode;
  delete nullOnly.claims[0].parentBinding.parentEntryStateEstablished;
  delete nullOnly.claims[0].parentBinding.parentRootPath;
  assert.throws(
    () => build(nullOnly),
    /lacks the exact source\/declared-parent\/root-path binding/,
  );

  root.namedPlacements.push({
    objectId: "10",
    frame: 6,
    depth: "2",
    name: "alternateContainer",
    tag: "PlaceObject2",
    replace: "0",
    hasClipActions: false,
  });
  fixture.inventory.timelineInventory.splice(-1, 0, timeline({
    timelineId: "sprite-10",
    objectId: "10",
    frameCount: 2,
    reachability: "reachable-from-root-placement-graph",
    namedPlacements: [{
      objectId: "7",
      frame: 1,
      depth: "4",
      name: "alternateParent",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    }],
  }));
  assert.throws(
    () => build(evidence),
    /lacks the exact source\/declared-parent\/root-path binding/,
  );
});

test("promotes explicitly pinned parent-terminal and zero-wrap lifetimes with exact termination census", () => {
  const fixture = syntheticFixture({compositeChild: true});
  fixture.inventory.timelineInventory.find(({timelineId}) => timelineId === "sprite-8").frameCount = 3;
  fixture.inventory.timelineInventory.find(({timelineId}) => timelineId === "sprite-7").namedPlacements = [];
  const inventorySha256 = digest("scenario-inventory-with-terminal-zero-wrap-child");
  const evidence = staticMultiFrameEvidence(fixture, inventorySha256, {withParentTerminalZeroWrap: true});
  const report = buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });
  const child = report.timelines.find(({timelineId}) => timelineId === "sprite-8");
  assert.equal(child.disposition, "composite-child-with-parent");
  assert.equal(child.staticCompositeEvidence.incomingPlacementCount, 2);
  assert.equal(child.staticCompositeEvidence.explicitRemovalCount, 1);
  assert.equal(child.staticCompositeEvidence.parentTerminalTerminationCount, 1);
  assert.equal(child.staticCompositeEvidence.replacementTerminationCount, 0);
  assert.equal(child.staticCompositeEvidence.sourceProvenWrapCount, 1);
  assert.equal(child.staticCompositeEvidence.zeroWrapLifetimeCount, 1);
});

test("multi-frame parent-clock disposition rejects lifetime, reset, external-control, internal-graph, and RMSE-obligation drift", () => {
  const fixture = syntheticFixture({compositeChild: true});
  fixture.inventory.timelineInventory.find(({timelineId}) => timelineId === "sprite-8").frameCount = 3;
  fixture.inventory.timelineInventory.find(({timelineId}) => timelineId === "sprite-7").namedPlacements = [];
  const inventorySha256 = digest("scenario-inventory-with-multi-frame-rejections");
  const baseline = staticMultiFrameEvidence(fixture, inventorySha256);
  const build = (evidence) => buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });

  const resetDrift = structuredClone(baseline);
  resetDrift.claims[0].placementLifecycleAudit.lifetimes[0].depthWasEmptyBeforePlacement = false;
  assert.throws(() => build(resetDrift), /does not prove its exact one-indexed lifetime\/reset mapping/);

  const controlDrift = structuredClone(baseline);
  controlDrift.claims[0].scriptAudit.externalTargetControlCount = 1;
  assert.throws(() => build(controlDrift), /lacks the no-script\/init\/clip\/dynamic\/external-target-control proof/);

  const globalInitDrift = structuredClone(baseline);
  globalInitDrift.claims[0].scriptAudit.globalDoInitActionSpriteObjectIds = ["99"];
  globalInitDrift.claims[0].scriptAudit.globalDoInitActionCount = 1;
  assert.throws(() => build(globalInitDrift), /lacks the no-script\/init\/clip\/dynamic\/external-target-control proof/);

  const displayDrift = structuredClone(baseline);
  displayDrift.claims[0].internalDisplayGraph.unresolvedObjectCount = 1;
  assert.throws(() => build(displayDrift), /lacks the exhaustive internal-display/);

  const rmseDrift = structuredClone(baseline);
  rmseDrift.claims[0].preservedObligations.rmse.satisfiedByDisposition = true;
  assert.throws(() => build(rmseDrift), /does not preserve the rmse obligation/);

  const terminalBaseline = staticMultiFrameEvidence(fixture, inventorySha256, {withParentTerminalZeroWrap: true});
  const missingTerminalPermit = structuredClone(terminalBaseline);
  delete missingTerminalPermit.claims[0].placementLifecycleAudit.lifetimes[1].terminalAtParentEndPermittedByPinnedSpec;
  assert.throws(() => build(missingTerminalPermit), /does not prove its exact one-indexed lifetime\/reset mapping/);

  const wrongTerminalFrame = structuredClone(terminalBaseline);
  wrongTerminalFrame.claims[0].placementLifecycleAudit.lifetimes[1].termination.frame = 119;
  assert.throws(() => build(wrongTerminalFrame), /does not prove its exact one-indexed lifetime\/reset mapping/);

  const missingZeroWrapPermit = structuredClone(terminalBaseline);
  delete missingZeroWrapPermit.claims[0].placementLifecycleAudit.lifetimes[1].localPlayhead.zeroWrapPermittedByPinnedSpec;
  assert.throws(() => build(missingZeroWrapPermit), /does not prove its exact one-indexed lifetime\/reset mapping/);

  const terminationCountDrift = structuredClone(terminalBaseline);
  terminationCountDrift.claims[0].placementLifecycleAudit.parentTerminalTerminationCount = 0;
  assert.throws(() => build(terminationCountDrift), /lacks the exhaustive placement\/update\/termination lifetime graph/);

  const zeroWrapCountDrift = structuredClone(terminalBaseline);
  zeroWrapCountDrift.claims[0].placementLifecycleAudit.zeroWrapLifetimeCount = 2;
  assert.throws(() => build(zeroWrapCountDrift), /lacks the exhaustive placement\/update\/termination lifetime graph/);
});

test("rejects stale, wrong-parent, missing-audio, visible-bounds, and unsupported static disposition claims", () => {
  const fixture = syntheticFixture({compositeChild: true});
  const inventorySha256 = digest("scenario-inventory-with-static-rejections");
  const baseline = staticCompositeEvidence(fixture, inventorySha256);
  const build = (evidence) => buildDispositionReport({
    ...fixture,
    inventorySha256,
    staticDispositionEvidence: evidence,
    staticDispositionEvidenceSha256: digest(JSON.stringify(evidence)),
  });

  const stale = structuredClone(baseline);
  stale.generatedFrom.scenarioInventory.sha256 = digest("stale");
  assert.throws(() => build(stale), /stale source\/scenario\/swfmill bindings/);

  const wrongParent = structuredClone(baseline);
  wrongParent.claims[0].parentTimelineId = "sprite-99";
  assert.throws(() => build(wrongParent), /wrong or undeclared parent timeline/);

  const missingAudio = structuredClone(baseline);
  missingAudio.claims[0].audioStructure.blockCount = 0;
  assert.throws(() => build(missingAudio), /lacks the required exact MP3 SoundStream tag census/);

  const visible = structuredClone(baseline);
  visible.claims[0].visualBounds.nativeStageIntersection = true;
  assert.throws(() => build(visible), /lacks the required off-stage lifecycle\/script proof/);

  const unsupported = structuredClone(baseline);
  unsupported.claims[0].disposition = "nonvisual";
  assert.throws(() => build(unsupported), /uses unsupported disposition nonvisual/);
});

test("all ten checked-in frame-domain disposition audits are deterministic and shell coverage is exhaustive", async () => {
  const results = await buildFrameDomainDispositions({check: true});
  assert.deepEqual(results.map(({animationId}) => animationId), COURSE_PILOT_IDS);
  assert.equal(results.every(({action}) => action === "verified"), true);
  assert.equal(results.reduce((sum, {report}) => sum + report.summary.enumeratedTimelineCount, 0), 557);
  assert.equal(results.reduce((sum, {report}) => sum + report.summary.dispositionCounts["declared-frame-domain"], 0), 19);
  assert.equal(results.reduce((sum, {report}) => sum + report.summary.dispositionCounts["composite-child-with-parent"], 0), 465);
  assert.equal(results.reduce((sum, {report}) => sum + report.summary.dispositionCounts.unresolved, 0), 73);

  for (const {report} of results) {
    assert.equal(report.migrationStatusChanged, false);
    assert.equal(report.strictAcceptanceEffect.startsWith("none;"), true);
    assert.equal(report.generatedFrom.migrationManifest.bindingStatus, "verified");
    assert.equal(report.timelines.every((timeline) => timeline.sourceEvidence.scenarioInventorySha256 === report.generatedFrom.scenarioInventory.sha256), true);
    assert.equal(report.timelines.every((timeline) => DISPOSITIONS.includes(timeline.disposition)), true);
  }

  const shell = results.find(({animationId}) => animationId === "shell-course-g04-l01-index-local").report;
  assert.equal(shell.summary.reachableChildTimelineCount, 113);
  assert.equal(shell.timelines.length, 114);
  assert.equal(shell.summary.dispositionCounts["composite-child-with-parent"], 80);
  assert.equal(shell.summary.dispositionCounts.unresolved, 33);
  for (const [timelineId, frameCount] of [["sprite-528", 871], ["sprite-302", 149], ["sprite-327", 132], ["sprite-132", 100]]) {
    const timeline = shell.timelines.find((item) => item.timelineId === timelineId);
    assert.ok(timeline, `${timelineId} must be enumerated`);
    assert.equal(timeline.frameCount, frameCount);
    assert.equal(timeline.disposition, "unresolved");
    assert.equal(timeline.riskAssessment.level, "high");
    assert.equal(timeline.riskAssessment.independentFrameDomainCandidate, true);
    assert.equal(shell.summary.highRiskIndependentCandidates.some((item) => item.timelineId === timelineId), true);
  }

  const in009 = results.find(({animationId}) => animationId === "course-g04-l03-in-009").report;
  assert.equal(in009.summary.dispositionCounts["composite-child-with-parent"], 4);
  assert.equal(in009.summary.dispositionCounts.unresolved, 0);
  for (const [timelineId, terminalCount, zeroWrapCount] of [
    ["sprite-123", 1, 1],
    ["sprite-146", 1, 1],
    ["sprite-150", 1, 3],
  ]) {
    const timeline = in009.timelines.find((item) => item.timelineId === timelineId);
    assert.equal(timeline.disposition, "composite-child-with-parent");
    assert.equal(timeline.staticCompositeEvidence.parentTimelineId, "sprite-200");
    assert.equal(timeline.staticCompositeEvidence.parentTerminalTerminationCount, terminalCount);
    assert.equal(timeline.staticCompositeEvidence.zeroWrapLifetimeCount, zeroWrapCount);
    assert.equal(timeline.riskAssessment.independentFrameDomainCandidate, false);
  }
});

test("G4 L3 shell declares every source-required independent domain while retaining only exact source-proven composites", async () => {
  const [result] = await buildFrameDomainDispositions({
    ids: ["shell-course-g04-l03-index-local"],
    check: true,
  });
  assert.equal(result.animationId, "shell-course-g04-l03-index-local");
  assert.equal(result.report.summary.reachableChildTimelineCount, 89);
  assert.equal(result.report.summary.dispositionCounts["declared-frame-domain"], 34);
  assert.equal(result.report.summary.dispositionCounts["composite-child-with-parent"], 56);
  assert.equal(result.report.summary.dispositionCounts["independent-required"], 0);
  assert.equal(result.report.summary.dispositionCounts.nonvisual, 0);
  assert.equal(result.report.summary.dispositionCounts.unresolved, 0);
  assert.equal(result.report.summary.highRiskIndependentCandidateCount, 0);
  assert.equal(
    result.report.timelines.find(({timelineId}) => timelineId === "sprite-1011")?.disposition,
    "declared-frame-domain",
  );
  assert.deepEqual(
    result.report.timelines
      .filter(({disposition}) => disposition === "declared-frame-domain")
      .map(({timelineId}) => timelineId),
    [
      "root", "sprite-87", "sprite-88", "sprite-112", "sprite-132", "sprite-135",
      "sprite-152", "sprite-155", "sprite-164", "sprite-169", "sprite-176", "sprite-179",
      "sprite-185", "sprite-199", "sprite-200", "sprite-253", "sprite-257", "sprite-261",
      "sprite-266", "sprite-302", "sprite-327", "sprite-335", "sprite-341", "sprite-343",
      "sprite-528", "sprite-549", "sprite-562", "sprite-586", "sprite-687", "sprite-693",
      "sprite-702", "sprite-709", "sprite-774", "sprite-1011",
    ],
  );
  assert.equal(result.report.timelines.filter(({disposition}) => disposition === "composite-child-with-parent")
    .every(({staticCompositeEvidence}) => (
      staticCompositeEvidence.role === "single-frame-scriptless-structural-child"
      && staticCompositeEvidence.claimScope === "independent-local-playhead-only"
    )), true);
});

test("TS006 enumerates root and both reachable children with no unresolved disposition", async () => {
  const [result] = await buildFrameDomainDispositions({
    ids: ["course-g04-l03-ts-006"],
    check: true,
  });
  assert.equal(result.report.status, "structurally-enumerated");
  assert.equal(result.report.summary.enumeratedTimelineCount, 3);
  assert.equal(result.report.summary.dispositionCounts["declared-frame-domain"], 2);
  assert.equal(result.report.summary.dispositionCounts["composite-child-with-parent"], 1);
  assert.equal(result.report.summary.dispositionCounts.unresolved, 0);
  assert.deepEqual(result.report.timelines.map(({timelineId, disposition}) => ({timelineId, disposition})), [
    {timelineId: "root", disposition: "declared-frame-domain"},
    {timelineId: "sprite-3", disposition: "composite-child-with-parent"},
    {timelineId: "sprite-23", disposition: "declared-frame-domain"},
  ]);
});

test("six legacy frame-domain dispositions stay source-bound and leave unsupported children unresolved", async () => {
  const results = await buildFrameDomainDispositions({check: true, ids: LEGACY_PILOT_IDS});
  assert.deepEqual(results.map(({animationId}) => animationId), LEGACY_PILOT_IDS);
  assert.equal(results.every(({action}) => action === "verified"), true);

  for (const {animationId, report} of results) {
    assert.equal(report.migrationStatusChanged, false);
    assert.equal(report.strictAcceptanceEffect.startsWith("none;"), true);
    assert.equal(report.generatedFrom.migrationManifest.bindingStatus, "verified");
    assert.equal(report.timelines.every(({disposition}) => DISPOSITIONS.includes(disposition)), true);
    if (animationId.startsWith("keyterm-")) {
      assert.equal(report.summary.reachableChildTimelineCount, 0);
      assert.equal(report.summary.dispositionCounts.unresolved, 0);
    } else {
      assert.equal(
        report.summary.dispositionCounts["composite-child-with-parent"],
        animationId === "formula-elementary-conversion-01-04" ? 3 : 2,
      );
    }
  }

  for (const animationId of LEGACY_PILOT_IDS.slice(0, 3)) {
    const report = results.find((item) => item.animationId === animationId).report;
    assert.equal(report.summary.reachableChildTimelineCount, 2);
    assert.equal(report.summary.dispositionCounts.unresolved, 0);
  }
  const conversion04 = results.find(({animationId}) => animationId === "formula-elementary-conversion-01-04").report;
  assert.equal(conversion04.summary.reachableChildTimelineCount, 3);
  assert.equal(conversion04.summary.dispositionCounts.unresolved, 0);
  const sprite156 = conversion04.timelines.find(({timelineId}) => timelineId === "sprite-156");
  assert.equal(sprite156.frameCount, 3);
  assert.equal(sprite156.disposition, "composite-child-with-parent");
  assert.equal(sprite156.staticCompositeEvidence.parentTimelineId, "root");
  assert.equal(sprite156.staticCompositeEvidence.parentUpdateCount, 34);
  assert.equal(sprite156.riskAssessment.independentFrameDomainCandidate, false);
});
