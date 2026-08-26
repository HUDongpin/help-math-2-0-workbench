#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, mkdir, readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {
  buildTraceSpecsFromDocuments,
  canonicalJson,
  safeRequirementId,
  sha256Text,
} from "./build-course-trace-specs.mjs";
import {LEGACY_PILOT_IDS} from "./build-legacy-scenario-inventories.mjs";
import {
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  projectionDescriptor,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
export const LEGACY_TRACE_INDEX_BASENAME = "legacy-pilot-trace-spec-index.json";
const execFile = promisify(execFileCallback);
const COMPUTEGHGH_REPLAY_PARSER = "scripts/parse-swfmill-root-replay-trace.py";
const COMPUTEGHGH_PROFILE = Object.freeze({
  animationId: "keyterm-elementary-computeghgh",
  sourceSwfPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf",
  sourceSwfSha256: "fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8",
  sourceFlaPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.fla",
  sourceFlaSha256: "6307c1d0ceced1527981c40bce6bd7b4015a7f0f5c650546cac2a5c095add722",
  frameCount: 35,
  fps: 12,
  stage: Object.freeze({width: 225, height: 225}),
  buttonObjectId: "14",
  selectedHitShapeObjectId: "6",
  buttonDepth: "28",
  buttonPlacementFrame: 1,
  terminalFrame: 35,
  buttonHandlerBodySha256: "5ef8cc19780ed9cb974569391debe1299bed44f0e828e583384d93003ddb47d4",
  terminalStopBodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
  ffdecScriptsSha256: "4b3425c779f20c8f9463a55bd4ac4f8cd0f003985464cfbd243f7a870c903e45",
  swfmillXmlSha256: "701edb158e02d0584b6ccffbbe454096509248c8e07f6e1e7ce261a44a77bf9a",
  authoringAuditPath: "audit/adobe-animate-2021-authoring-audit.json",
  authoringAuditSha256: "c575901e80f046d431ea5b72a285076e122cc7fb5412a9e2a5d3f3260307be52",
});

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function assertCanonicalValue(actual, expected, label) {
  assert(canonicalEqual(actual, expected), `${label} differs from the locked source contract`);
}

function exactlyOne(items, label) {
  assert(items.length === 1, `${label}: expected exactly one item, observed ${items.length}`);
  return items[0];
}

function indexedEvidenceArtifact(inventory, artifactId, animationId) {
  return exactlyOne(
    (inventory.evidenceIndex || []).filter((item) => item.artifactId === artifactId),
    `${animationId}: ${artifactId} evidence artifact`,
  );
}

async function verifiedWorkspaceArtifact({workspace, inventory, artifactId, expectedSha256}) {
  const artifact = indexedEvidenceArtifact(inventory, artifactId, inventory.animationId);
  if (expectedSha256 && artifact.sha256 !== expectedSha256) {
    throw new Error(`${inventory.animationId}: ${artifactId} indexed SHA-256 differs from the locked source artifact`);
  }
  const resolved = path.resolve(workspace, artifact.path);
  const relative = path.relative(workspace, resolved);
  assert(!relative.startsWith("..") && !path.isAbsolute(relative), `${inventory.animationId}: ${artifactId} escapes its migration workspace`);
  assert(await sha256File(resolved) === artifact.sha256, `${inventory.animationId}: ${artifactId} file SHA-256 differs from its index`);
  return {artifact, resolved};
}

async function readDocuments({id, root, migrationsRoot}) {
  const workspace = path.join(migrationsRoot, id);
  const [manifestText, coverageText, inventoryText] = await Promise.all([
    readFile(path.join(workspace, "migration.json"), "utf8"),
    readFile(path.join(workspace, "evidence", "full-frame-coverage.json"), "utf8"),
    readFile(path.join(workspace, "audit", "scenario-inventory.json"), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const coverage = JSON.parse(coverageText);
  const inventory = JSON.parse(inventoryText);
  assert(manifest.animationId === id && coverage.animationId === id && inventory.animationId === id, `${id}: document identity mismatch`);
  const sourcePath = path.resolve(root, manifest.source?.swf || "");
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const relativeSource = path.relative(preservedRoot, sourcePath);
  assert(manifest.source?.swf && !relativeSource.startsWith("..") && !path.isAbsolute(relativeSource), `${id}: source SWF escapes preserved archive`);
  const hashes = {
    sourceSwfSha256: await sha256File(sourcePath),
    manifestTechnicalSha256: technicalManifestSha256(manifest),
    coverageTechnicalSha256: traceCoverageSha256(coverage),
    inventoryTechnicalSha256: scenarioInventorySha256(inventory),
    manifestFileSha256: sha256Text(manifestText),
    coverageFileSha256: sha256Text(coverageText),
    inventoryFileSha256: sha256Text(inventoryText),
  };
  assert(hashes.sourceSwfSha256 === manifest.source.swfSha256, `${id}: source SWF SHA-256 differs from manifest`);
  return {workspace, manifest, coverage, inventory, hashes};
}

async function jsonBasenames(directory) {
  if (!(await exists(directory))) return [];
  return (await readdir(directory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort(compareText);
}

function sourceScript(inventory, {collection, script, bodySha256}) {
  const id = inventory.animationId;
  const item = exactlyOne(
    (inventory.interactions?.[collection] || []).filter((entry) => entry.script === script),
    `${id}: ${script}`,
  );
  if (item.bodySha256 !== bodySha256) {
    throw new Error(`${id}: ${script} body SHA-256 differs from the locked shipped bytecode`);
  }
  if (item.evidence?.artifactId !== "ffdec-scripts" || item.evidence?.script !== script) {
    throw new Error(`${id}: ${script} is not bound to the indexed FFDec script artifact`);
  }
  return item;
}

function assertComputeghghAuthoringCorroboration(authoringAudit) {
  const profile = COMPUTEGHGH_PROFILE;
  if (
    authoringAudit.schemaVersion !== 2 ||
    authoringAudit.evidenceKind !== "adobe-animate-2021-cold-start-authoring-audit" ||
    authoringAudit.animationId !== profile.animationId ||
    authoringAudit.source?.fla !== profile.sourceFlaPath ||
    authoringAudit.source?.flaSha256 !== profile.sourceFlaSha256 ||
    authoringAudit.source?.workingCopy?.sha256 !== profile.sourceFlaSha256 ||
    authoringAudit.source?.workingCopy?.readOnlyAtFinalize !== true ||
    authoringAudit.source?.workingCopy?.byteIdenticalToSourceAtFinalize !== true
  ) throw new Error(`${profile.animationId}: Adobe Animate authoring corroboration identity or read-only source binding differs`);
  assertCanonicalValue(authoringAudit.nativeMovie, {
    width: 225,
    height: 225,
    fps: 12,
    frameCount: 35,
    backgroundColor: "#FFFFFF",
    rootLayerCount: 5,
    libraryItemCount: 8,
  }, `${profile.animationId}: Adobe Animate native movie`);
  const replayLayer = exactlyOne(
    (authoringAudit.authoringAudit?.timeline?.layers || []).filter(({name}) => name === "replay"),
    `${profile.animationId}: Adobe Animate replay layer`,
  );
  if (replayLayer.frameCount !== 35 || replayLayer.keyframes?.length !== 1) {
    throw new Error(`${profile.animationId}: Adobe Animate replay layer no longer spans the full 35-frame root timeline`);
  }
  const replayFrame = replayLayer.keyframes[0];
  if (replayFrame.flashFrame !== 1 || replayFrame.duration !== 35 || replayFrame.actionScriptLength !== 0) {
    throw new Error(`${profile.animationId}: Adobe Animate replay placement lifetime differs`);
  }
  const replayInstance = exactlyOne(
    (replayFrame.elements || []).filter((item) => (
      item.elementType === "instance" &&
      item.symbolType === "button" &&
      item.libraryItemName === "Replay" &&
      item.libraryItemType === "button"
    )),
    `${profile.animationId}: Adobe Animate Replay button instance`,
  );
  assertCanonicalValue({
    x: replayInstance.x,
    y: replayInstance.y,
    width: replayInstance.width,
    height: replayInstance.height,
  }, {
    x: 233.95,
    y: 203.55,
    width: 70.4,
    height: 18.45,
  }, `${profile.animationId}: Adobe Animate Replay authoring bounds`);
  if (!(authoringAudit.limitations || []).some((item) => /does not prove.*Replay behavior/i.test(item))) {
    throw new Error(`${profile.animationId}: Adobe Animate authoring audit no longer records its Replay-runtime limitation`);
  }
}

function assertComputeghghGeometry(geometry) {
  const id = COMPUTEGHGH_PROFILE.animationId;
  if (geometry.schemaVersion !== 2 || geometry.parser !== "python-xml.etree.ElementTree") {
    throw new Error(`${id}: unsupported root Replay geometry parser output`);
  }
  assertCanonicalValue(geometry.nativeStage, {height: 225, width: 225}, `${id}: native stage geometry`);
  assertCanonicalValue(geometry.rootTimeline, {
    frameCount: 35,
    frameRate: 12,
    terminalActions: [
      {attributes: {}, name: "Stop"},
      {attributes: {}, name: "EndAction"},
    ],
    terminalFrame: 35,
  }, `${id}: root terminal geometry`);
  assertCanonicalValue(geometry.buttonPlacement, {
    activeThroughFrame: 35,
    depth: 28,
    frame: 1,
    laterDepthMutationCount: 0,
    objectId: 14,
    timelineId: "root",
    transformSourceDecimals: {
      scaleX: "1",
      scaleY: "1",
      skewX: "0",
      skewY: "0",
      transX: "4679",
      transY: "4071",
    },
  }, `${id}: root Replay placement geometry`);
  assertCanonicalValue(geometry.buttonDefinition, {
    actions: [
      {attributes: {frame: "0"}, name: "GotoFrame"},
      {attributes: {}, name: "Play"},
      {attributes: {}, name: "EndAction"},
    ],
    conditionAttributes: {
      key: "0",
      menuEnter: "0",
      menuLeave: "0",
      next: "0",
      pointerDragEnter: "0",
      pointerDragLeave: "0",
      pointerEnter: "0",
      pointerLeave: "0",
      pointerPush: "0",
      pointerReleaseInside: "1",
      pointerReleaseOutside: "0",
    },
    objectId: 14,
    pointerReleaseInside: true,
    selectedHitRecord: {
      depth: 2,
      shapeObjectId: 6,
      transformSourceDecimals: {
        scaleX: "1",
        scaleY: "1",
        skewX: "0",
        skewY: "0",
        transX: "0",
        transY: "0",
      },
    },
  }, `${id}: Replay button definition`);
  assertCanonicalValue(geometry.selectedHitShape, {
    activeFillStyleOneRecordCount: 2,
    boundsTwips: {bottom: 94, left: -1637, right: -327, top: -236},
    definitionTag: "DefineShape3",
    objectId: 6,
    opaqueFillInteriorProof: {
      boundary: {
        canonicalSegmentsSha256: "e3c74404392222ff5201e9d203b5d0bd05df67e48540f5324cf8b32fbd2784bc",
        closed: true,
        lineSegmentIndexes: [0, 5],
        quadraticSegmentIndexes: [1, 2, 3, 4, 6, 7, 8, 9],
        segmentCount: 10,
      },
      centralRectangleTwips: {
        bottom: 72,
        left: -1467,
        right: -491,
        top: -213,
      },
      fill: {
        alpha: 255,
        side: "fillStyle0",
        styleEpoch: 0,
        styleIndex: 1,
        type: "Solid",
      },
      interiorPointTwipsExactDecimals: {x: "-982", y: "-71"},
      leftCap: {
        maxControlOrEndpointX: -1467,
        outsideOrOnRectangleBoundary: true,
        segmentIndexes: [1, 2, 3, 4],
        yMonotone: "increasing",
      },
      method: "exact-closed-quadratic-capsule-central-rectangle",
      proofConclusion: "point-strictly-inside-opaque-source-fill",
      rightCap: {
        minControlOrEndpointX: -491,
        outsideOrOnRectangleBoundary: true,
        segmentIndexes: [6, 7, 8, 9],
        yMonotone: "decreasing",
      },
      strictlyInsideCentralRectangle: true,
    },
    opaqueSolidFillCount: 1,
    sourceCenterTwipsExactDecimals: {x: "-982", y: "-71"},
    xmlElementSha256: "30b0ad5e68ffb45563d054dc8df3ed7c92b162e4f14374409eb0591cf337ead0",
  }, `${id}: selected opaque Replay hit shape`);
  assertCanonicalValue(geometry.stageHitBounds?.exactDecimals, {
    bottom: "208.25",
    height: "16.5",
    left: "152.1",
    right: "217.6",
    top: "191.75",
    width: "65.5",
  }, `${id}: exact native-stage Replay hit bounds`);
  assertCanonicalValue(geometry.stageHitBounds?.interiorPointExactDecimals, {
    x: "184.85",
    y: "200",
  }, `${id}: exact native-stage Replay hit point`);
  assertCanonicalValue(geometry.replayTransition, {
    event: "pointerReleaseInside",
    frameWrap: {fromFrame: 35, toFrame: 1},
    postState: {rootFrame: 1, rootPlayState: "playing"},
    preState: {rootFrame: 35, rootPlayState: "stopped"},
    sourceActions: [
      {attributes: {frame: "0"}, name: "GotoFrame"},
      {attributes: {}, name: "Play"},
      {attributes: {}, name: "EndAction"},
    ],
  }, `${id}: source Replay wrap transition`);
}

/**
 * Turn the locked computeghgh SWF structure, bytecode, and parsed root hit
 * geometry into EN/ES Replay schedules. This remains a specification only:
 * it does not execute Flash or create baseline, review, or acceptance proof.
 */
export function deriveComputeghghReplaySourceSchedulesFromEvidence({
  manifest,
  coverage,
  inventory,
  hashes,
  geometry,
  authoringAudit,
}) {
  const profile = COMPUTEGHGH_PROFILE;
  const id = profile.animationId;
  if (manifest.animationId !== id || coverage.animationId !== id || inventory.animationId !== id) {
    throw new Error(`${id}: Replay schedule derivation received a different animation identity`);
  }
  if (
    manifest.source?.swf !== profile.sourceSwfPath ||
    manifest.source?.swfSha256 !== profile.sourceSwfSha256 ||
    inventory.source?.swfSha256 !== profile.sourceSwfSha256 ||
    hashes.sourceSwfSha256 !== profile.sourceSwfSha256
  ) throw new Error(`${id}: preserved source SWF path or SHA-256 differs from the locked computeghgh source`);
  assertCanonicalValue({
    frameCount: manifest.runtime?.frameCount,
    fps: manifest.runtime?.fps,
    stage: manifest.runtime?.stage,
    actionScriptVersion: manifest.runtime?.actionScriptVersion,
  }, {
    frameCount: profile.frameCount,
    fps: profile.fps,
    stage: profile.stage,
    actionScriptVersion: "AS1/2",
  }, `${id}: runtime metadata`);
  const domain = exactlyOne(
    (manifest.implementation?.frameDomains || []).filter((item) => item.id === "root"),
    `${id}: root frame domain`,
  );
  assertCanonicalValue({
    kind: domain.kind,
    sourceTimelineId: domain.sourceTimelineId,
    sourceInstanceId: domain.sourceInstanceId,
    parentFrameDomainId: domain.parentFrameDomainId,
    frameCount: domain.frameCount,
    scenarioIds: domain.scenarioIds,
  }, {
    kind: "root",
    sourceTimelineId: "root",
    sourceInstanceId: "root",
    parentFrameDomainId: null,
    frameCount: 35,
    scenarioIds: ["default"],
  }, `${id}: root frame-domain contract`);
  const timeline = exactlyOne(
    (inventory.timelineInventory || []).filter((item) => item.timelineId === "root"),
    `${id}: root source timeline`,
  );
  if (timeline.objectId !== null || timeline.frameCount !== 35 || timeline.structuralReachability !== "root") {
    throw new Error(`${id}: root timeline identity, frame count, or reachability differs`);
  }
  const button = sourceScript(inventory, {
    collection: "handlers",
    script: "DefineButton2_14/BUTTONCONDACTION on(release).as",
    bodySha256: profile.buttonHandlerBodySha256,
  });
  assertCanonicalValue(button.event, ["release"], `${id}: Replay button event`);
  assertCanonicalValue(
    (button.signals?.transitions || []).map(({target, arguments: argumentsValue}) => ({
      target,
      arguments: argumentsValue,
    })),
    [{target: "gotoAndPlay", arguments: "1"}],
    `${id}: Replay button transition`,
  );
  const terminal = sourceScript(inventory, {
    collection: "nonEventScripts",
    script: "frame_35/DoAction.as",
    bodySha256: profile.terminalStopBodySha256,
  });
  assertCanonicalValue(
    (terminal.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({
      target,
      arguments: argumentsValue,
    })),
    [{target: "stop", arguments: ""}],
    `${id}: root frame 35 stop`,
  );
  if ((terminal.signals?.assignments || []).length || (terminal.signals?.sideEffects || []).length) {
    throw new Error(`${id}: root frame 35 contains unexpected assignments or side effects`);
  }
  if (
    inventory.interactions.handlers.length !== 1 ||
    inventory.interactions.nonEventScripts.length !== 1 ||
    (inventory.dependencies?.bindings || []).length !== 0 ||
    (inventory.dependencies?.safeSideEffectPolicy || []).length !== 0 ||
    (inventory.coverage?.inputObligations || []).length !== 0 ||
    (inventory.coverage?.conditionalBranchObligations || []).length !== 0 ||
    (inventory.coverage?.randomObligations || []).length !== 0 ||
    (inventory.coverage?.sideEffectObligations || []).length !== 0
  ) {
    throw new Error(`${id}: complete static script/dependency inventory no longer contains only Replay plus terminal stop`);
  }
  const buttonDefinition = exactlyOne(
    (inventory.interactions?.buttonDefinitions || []).filter(({objectId}) => objectId === profile.buttonObjectId),
    `${id}: button 14 source definition`,
  );
  assertCanonicalValue({
    objectId: buttonDefinition.objectId,
    conditions: buttonDefinition.conditions,
    hitRecords: buttonDefinition.hitRecords,
    placements: buttonDefinition.placements,
  }, {
    objectId: "14",
    conditions: [{
      key: "0",
      menuEnter: "0",
      menuLeave: "0",
      next: "0",
      pointerDragEnter: "0",
      pointerDragLeave: "0",
      pointerEnter: "0",
      pointerLeave: "0",
      pointerPush: "0",
      pointerReleaseInside: "1",
      pointerReleaseOutside: "0",
    }],
    hitRecords: [
      {depth: "2", shapeObjectId: "6", transform: {transX: "0", transY: "0"}},
      {depth: "5", shapeObjectId: "9", transform: {transX: "0", transY: "0"}},
      {depth: "6", shapeObjectId: "10", transform: {transX: "-2620", transY: "-235"}},
      {depth: "7", shapeObjectId: "11", transform: {transX: "0", transY: "0"}},
      {depth: "4", shapeObjectId: "13", transform: {transX: "0", transY: "0"}},
    ],
    placements: [{
      depth: "28",
      frame: 1,
      hasClipActions: false,
      name: "",
      objectId: "14",
      replace: "0",
      tag: "PlaceObject2",
      timelineId: "root",
    }],
  }, `${id}: complete button 14 static target`);
  assertComputeghghGeometry(geometry);
  assertComputeghghAuthoringCorroboration(authoringAudit);

  const requirements = (coverage.requirements || [])
    .filter((item) => item.frameDomainId === "root" && item.scenario === "default")
    .sort((left, right) => compareText(left.language, right.language));
  if (requirements.length !== 2 || requirements[0].language !== "en" || requirements[1].language !== "es") {
    throw new Error(`${id}: expected exactly the EN/ES root default requirements`);
  }
  for (const requirement of requirements) {
    if (
      requirement.requiredRange?.firstFrame !== 1 ||
      requirement.requiredRange?.lastFrame !== 35 ||
      requirement.baselineAuthorityRequirement !== "original-runtime-natural-trace" ||
      String(requirement.seed) !== "0"
    ) throw new Error(`${id}/${requirement.requirementId}: root Replay coverage identity differs`);
  }

  const swfmillTimeline = {artifactId: "swfmill-xml", timelineId: "root"};
  const swfmillButton = {
    artifactId: "swfmill-xml",
    objectId: "14",
    selectedHitShapeObjectId: "6",
    placementDepth: "28",
  };
  const firstCyclePlaying = {
    rootFrameRange: {firstFrame: 1, lastFrame: 34},
    rootPlayState: "playing",
    activeControl: {
      buttonObjectId: 14,
      selectedHitShapeObjectId: 6,
      depth: 28,
      sourceEvent: "pointerReleaseInside",
    },
  };
  const stoppedBeforeReplay = {
    rootFrame: 35,
    localFrame: 35,
    rootPlayState: "stopped",
    localPlayState: "stopped",
    activeControl: {
      buttonObjectId: 14,
      selectedHitShapeObjectId: 6,
      depth: 28,
      sourceEvent: "pointerReleaseInside",
    },
  };
  const replayRestart = {
    rootFrame: 1,
    localFrame: 1,
    rootPlayState: "playing",
    localPlayState: "playing",
    activeControl: {
      buttonObjectId: 14,
      selectedHitShapeObjectId: 6,
      depth: 28,
      sourceEvent: "pointerReleaseInside",
    },
    replayTransition: {
      fromRootFrame: 35,
      toRootFrame: 1,
      sourceCommand: "GotoFrame(0); Play",
    },
  };
  const stageHitBounds = structuredClone(geometry.stageHitBounds);
  const sourceFillInteriorProof = structuredClone(
    geometry.selectedHitShape.opaqueFillInteriorProof,
  );
  const sourceEvidence = [
    swfmillTimeline,
    swfmillButton,
    button.evidence,
    terminal.evidence,
  ];

  return requirements.map((requirement) => ({
    requirementId: requirement.requirementId,
    status: "source-evidenced-executable",
    noActionsRequired: false,
    sourceEvidence,
    playbackSegments: [{
      id: "frames-1-34-natural-first-cycle",
      requiredRange: {firstFrame: 1, lastFrame: 34},
      expectedState: {
        ...firstCyclePlaying,
        requiredLanguage: requirement.language,
      },
      evidence: [swfmillTimeline, swfmillButton],
    }, {
      id: "frame-35-source-stop-awaiting-replay-release",
      requiredRange: {firstFrame: 35, lastFrame: 35},
      expectedState: stoppedBeforeReplay,
      evidence: [swfmillTimeline, swfmillButton, terminal.evidence],
    }],
    orderedSteps: [{
      order: 1,
      action: {
        event: "release",
        sourceCondition: "pointerReleaseInside",
        dispatchSequence: ["pointer-down-inside", "pointer-up-inside"],
        dispatchPhase: "pointer-up",
        coordinateSpace: "native-stage-pixels",
        pointer: structuredClone(stageHitBounds.interiorPointNumeric),
        exactPointerDecimals: structuredClone(stageHitBounds.interiorPointExactDecimals),
        hitTest: "inside-source-derived-opaque-hit-shape",
        sourceCommand: "GotoFrame(0); Play",
        executionTiming: "after-capture-and-observation-of-source-stopped-root-frame-35",
      },
      sourceTarget: {
        timelineId: "root",
        localFrame: 35,
        buttonObjectId: 14,
        selectedHitShapeObjectId: 6,
        depth: 28,
        activeFrameRange: {firstFrame: 1, lastFrame: 35},
        sourceFillInteriorProof,
        stageHitBounds,
      },
      preStateCheckpoint: {
        checkpointId: "frame-35-before-source-replay-release",
        expectedState: stoppedBeforeReplay,
      },
      postStateCheckpoint: {
        checkpointId: "frame-1-after-source-replay-release",
        expectedState: replayRestart,
      },
      evidence: [swfmillButton, button.evidence, terminal.evidence],
      terminalEffect: "The frame-35 source stop is followed by button 14 pointerReleaseInside; GotoFrame(0) and Play restart the same root timeline at one-indexed frame 1 in the next playback cycle.",
    }],
    stateCheckpoints: [{
      id: "frame-1-natural-entry-first-cycle",
      expectedState: {
        rootFrame: 1,
        localFrame: 1,
        rootPlayState: "playing",
        localPlayState: "playing",
        requiredLanguage: requirement.language,
        activeControl: stoppedBeforeReplay.activeControl,
        playbackCycle: 1,
      },
      evidence: [swfmillTimeline, swfmillButton],
    }, {
      id: "frame-35-before-source-replay-release",
      expectedState: stoppedBeforeReplay,
      evidence: [swfmillTimeline, swfmillButton, terminal.evidence],
    }, {
      id: "frame-1-after-source-replay-release",
      expectedState: {
        ...replayRestart,
        requiredLanguage: requirement.language,
        playbackCycle: 2,
      },
      evidence: [swfmillTimeline, swfmillButton, button.evidence, terminal.evidence],
    }],
    terminalSemantics: {
      status: "source-evidenced",
      expectedState: {
        ...replayRestart,
        requiredLanguage: requirement.language,
        playbackCycle: 2,
      },
      evidence: [swfmillTimeline, swfmillButton, button.evidence, terminal.evidence],
      traceEnd: "post-replay-root-frame-1-playing",
      firstCycleTerminalStop: stoppedBeforeReplay,
      outsideThisSpecification: [
        "The original runtime must still execute and hash-chain the natural first cycle, frame-35 stop, release-inside dispatch, source-target resolution, and post-Replay frame-1 state.",
        "The standalone source does not consume a language flag; EN/ES requirements retain separate product-context identities but share this byte-identical source schedule.",
        "Audio presence, language-track selection, listening acceptance, visual RMSE, human review, owner review, and migration completion are not established by this schedule.",
      ],
    },
  }));
}

async function deriveLegacySourceSchedules({id, root, documents, python = "python3"}) {
  if (id !== COMPUTEGHGH_PROFILE.animationId) {
    return {derivedSchedules: [], scheduleDerivationBindings: {}};
  }
  const {workspace, manifest, coverage, inventory, hashes} = documents;
  const [swfmill, ffdecScripts] = await Promise.all([
    verifiedWorkspaceArtifact({
      workspace,
      inventory,
      artifactId: "swfmill-xml",
      expectedSha256: COMPUTEGHGH_PROFILE.swfmillXmlSha256,
    }),
    verifiedWorkspaceArtifact({
      workspace,
      inventory,
      artifactId: "ffdec-scripts",
      expectedSha256: COMPUTEGHGH_PROFILE.ffdecScriptsSha256,
    }),
  ]);
  const authoringAuditPath = path.join(workspace, COMPUTEGHGH_PROFILE.authoringAuditPath);
  if (await sha256File(authoringAuditPath) !== COMPUTEGHGH_PROFILE.authoringAuditSha256) {
    throw new Error(`${id}: Adobe Animate authoring audit SHA-256 differs from the current locked corroboration`);
  }
  const authoringAudit = JSON.parse(await readFile(authoringAuditPath, "utf8"));
  const parserPath = path.join(root, COMPUTEGHGH_REPLAY_PARSER);
  const [{stdout}, parserSha256, generatorSha256] = await Promise.all([
    execFile(python, [
      parserPath,
      "--swfmill", swfmill.resolved,
      "--button-object-id", "14",
      "--hit-shape-object-id", "6",
      "--button-frame", "1",
      "--button-depth", "28",
      "--terminal-frame", "35",
    ], {maxBuffer: 4 * 1024 * 1024}),
    sha256File(parserPath),
    sha256File(scriptPath),
  ]);
  let geometry;
  try {
    geometry = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`${id}: root Replay geometry parser did not return JSON: ${error.message}`);
  }
  const derivedSchedules = deriveComputeghghReplaySourceSchedulesFromEvidence({
    manifest,
    coverage,
    inventory,
    hashes,
    geometry,
    authoringAudit,
  });
  const binding = {
    status: "hash-bound-static-source-derivation-not-runtime-execution",
    generator: {
      path: "scripts/build-legacy-trace-specs.mjs",
      sha256: generatorSha256,
    },
    geometryParser: {
      path: COMPUTEGHGH_REPLAY_PARSER,
      sha256: parserSha256,
    },
    sourceArtifacts: {
      sourceSwf: {
        path: manifest.source.swf,
        sha256: hashes.sourceSwfSha256,
      },
      swfmillXml: {
        path: swfmill.artifact.path,
        sha256: swfmill.artifact.sha256,
      },
      ffdecScripts: {
        path: ffdecScripts.artifact.path,
        sha256: ffdecScripts.artifact.sha256,
      },
      adobeAnimateAuthoringCorroboration: {
        path: COMPUTEGHGH_PROFILE.authoringAuditPath,
        sha256: COMPUTEGHGH_PROFILE.authoringAuditSha256,
        role: "read-only FLA placement/lifetime corroboration only; shipped SWF bytecode remains authoritative for the removed AS1 behavior",
      },
      scenarioInventoryTechnicalProjection: {
        projection: SCENARIO_INVENTORY_PROJECTION.id,
        sha256: hashes.inventoryTechnicalSha256,
      },
    },
    derivedGeometrySha256: sha256Text(canonicalJson(geometry)),
    replayWrapContract: {
      firstCycleCaptureRange: {firstFrame: 1, lastFrame: 35},
      actionAfterCapturedFrame: 35,
      postActionRootFrame: 1,
      executionEvidenceCreated: false,
    },
    executionEvidenceCreated: false,
    strictAcceptanceEffect: "none; source schedule readiness is only a prerequisite for future authorized original-runtime natural execution",
  };
  return {
    derivedSchedules,
    scheduleDerivationBindings: Object.fromEntries(
      derivedSchedules.map((schedule) => [schedule.requirementId, binding]),
    ),
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    help: false,
    json: false,
    migrationsRoot: defaultMigrationsRoot,
    python: "python3",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--migrations" || argument === "--python") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      if (argument === "--migrations") options.migrationsRoot = path.resolve(value);
      else options.python = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export async function buildLegacyTraceSpecs(options = {}) {
  const root = path.resolve(options.projectRoot || projectRoot);
  const migrationsRoot = path.resolve(options.migrationsRoot || path.join(root, "migrations"));
  const indexPath = path.join(migrationsRoot, LEGACY_TRACE_INDEX_BASENAME);
  const prepared = [];

  for (const id of LEGACY_PILOT_IDS) {
    const documents = await readDocuments({id, root, migrationsRoot});
    const sourceSchedules = await deriveLegacySourceSchedules({
      id,
      root,
      documents,
      python: options.python || "python3",
    });
    const specs = buildTraceSpecsFromDocuments({
      id,
      ...documents,
      ...sourceSchedules,
    }).map((spec) => ({
      ...spec,
      artifactType: "legacy-pilot-original-runtime-trace-specification",
    }));
    const directory = path.join(documents.workspace, "audit", "trace-specs");
    const files = specs.map((spec) => {
      const basename = `${safeRequirementId(spec.requirementId)}.json`;
      const rendered = renderJson(spec);
      return {
        spec,
        basename,
        path: path.join(directory, basename),
        rendered,
        sha256: sha256Text(rendered),
      };
    });
    const expected = files.map(({basename}) => basename).sort(compareText);
    const existing = await jsonBasenames(directory);
    const unexpected = existing.filter((basename) => !expected.includes(basename));
    assert(!unexpected.length, `${id}: refusing to overwrite or remove unexpected trace spec(s): ${unexpected.join(", ")}`);
    prepared.push({id, documents, specs, directory, files});
  }

  const pilots = prepared.map(({id, documents, specs, directory, files}) => {
    const unresolvedCount = specs.filter(({traceSpecStatus}) => traceSpecStatus === "unresolved").length;
    const frameAccurateRootReadyCount = specs.filter(({traceSpecStatus}) => traceSpecStatus === "source-frame-accurate-root-ready-for-authoritative-capture").length;
    const naturalScheduleReadyCount = specs.filter(({traceSpecStatus}) => traceSpecStatus === "source-schedule-ready-for-authoritative-execution").length;
    return {
      animationId: id,
      sourceSwfSha256: documents.hashes.sourceSwfSha256,
      technicalBindings: {
        manifest: projectionDescriptor({
          projection: TECHNICAL_MANIFEST_PROJECTION.id,
          sha256: documents.hashes.manifestTechnicalSha256,
          excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
        }),
        coverage: projectionDescriptor({
          projection: TRACE_COVERAGE_PROJECTION.id,
          sha256: documents.hashes.coverageTechnicalSha256,
          includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
          excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
        }),
        scenarioInventory: projectionDescriptor({
          projection: SCENARIO_INVENTORY_PROJECTION.id,
          sha256: documents.hashes.inventoryTechnicalSha256,
          excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
        }),
      },
      traceSpecDirectory: portable(path.relative(root, directory)),
      requirementCount: specs.length,
      unresolvedCount,
      frameAccurateRootReadyCount,
      naturalScheduleReadyCount,
      traceSpecs: files.map((file) => ({
        requirementId: file.spec.requirementId,
        traceId: file.spec.identity.traceId,
        frameDomainId: file.spec.identity.frameDomainId,
        scenario: file.spec.identity.scenario,
        language: file.spec.identity.language,
        seed: file.spec.identity.seed,
        traceModel: file.spec.traceModel.kind,
        status: file.spec.traceSpecStatus,
        file: portable(path.relative(root, file.path)),
        sha256: file.sha256,
        expectedExecutionReport: portable(path.relative(root, path.join(documents.workspace, file.spec.executionEvidence.expectedExecutionReportPath))),
      })),
    };
  });
  const requirementCount = pilots.reduce((sum, pilot) => sum + pilot.requirementCount, 0);
  const unresolvedCount = pilots.reduce((sum, pilot) => sum + pilot.unresolvedCount, 0);
  const frameAccurateRootReadyCount = pilots.reduce((sum, pilot) => sum + pilot.frameAccurateRootReadyCount, 0);
  const naturalScheduleReadyCount = pilots.reduce((sum, pilot) => sum + pilot.naturalScheduleReadyCount, 0);
  const index = {
    schemaVersion: 1,
    artifactType: "legacy-pilot-trace-spec-index",
    status: unresolvedCount ? "partially-ready-with-unresolved-natural-traces" : "all-traces-ready-for-authoritative-execution",
    pilotCount: pilots.length,
    requirementCount,
    unresolvedCount,
    frameAccurateRootReadyCount,
    naturalScheduleReadyCount,
    readyTraceCount: frameAccurateRootReadyCount + naturalScheduleReadyCount,
    pilots,
    strictAcceptanceEffect: "none; indexed trace specifications are planning artifacts and never original-runtime execution, baseline, review, or acceptance evidence",
  };
  const indexText = renderJson(index);

  for (const item of prepared) {
    if (!options.check) await mkdir(item.directory, {recursive: true});
    for (const file of item.files) {
      if (options.check) {
        assert(await exists(file.path), `${item.id}: trace spec is missing: ${file.basename}`);
        assert(await readFile(file.path, "utf8") === file.rendered, `${item.id}: trace spec is stale: ${file.basename}`);
      } else await writeFile(file.path, file.rendered, "utf8");
    }
  }
  if (options.check) {
    assert(await exists(indexPath), `Legacy trace-spec index is missing: ${portable(path.relative(root, indexPath))}`);
    assert(await readFile(indexPath, "utf8") === indexText, "Legacy trace-spec index is stale");
  } else {
    await mkdir(path.dirname(indexPath), {recursive: true});
    await writeFile(indexPath, indexText, "utf8");
  }
  return {
    action: options.check ? "verified" : "written",
    pilotCount: pilots.length,
    requirementCount,
    unresolvedCount,
    frameAccurateRootReadyCount,
    naturalScheduleReadyCount,
    readyTraceCount: frameAccurateRootReadyCount + naturalScheduleReadyCount,
    index: portable(path.relative(root, indexPath)),
    pilots: pilots.map((pilot) => ({
      animationId: pilot.animationId,
      requirementCount: pilot.requirementCount,
      unresolvedCount: pilot.unresolvedCount,
      frameAccurateRootReadyCount: pilot.frameAccurateRootReadyCount,
      naturalScheduleReadyCount: pilot.naturalScheduleReadyCount,
    })),
  };
}

function usage() {
  return `Usage: node scripts/build-legacy-trace-specs.mjs [options]\n\nOptions:\n  --migrations <directory>  Migration root (default: migrations)\n  --python <command>        Python with xml.etree.ElementTree (default: python3)\n  --check                   Verify all six pilots, one file per requirement, and the isolated hash index\n  --json                    Print a JSON summary\n  --help                    Show this help\n\nThis command writes only audit/trace-specs/*.json and ${LEGACY_TRACE_INDEX_BASENAME}. Linear root specifications are capture-ready instructions only; interactive schedules stay unresolved unless source evidence supplies the ordered natural trace.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else {
      const result = await buildLegacyTraceSpecs(options);
      if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        for (const pilot of result.pilots) {
          process.stdout.write(`${pilot.animationId}: ${pilot.requirementCount} requirements, ${pilot.frameAccurateRootReadyCount} linear root ready, ${pilot.unresolvedCount} unresolved\n`);
        }
        process.stdout.write(`${result.action}: ${result.pilotCount}/6 pilots -> ${result.index}\n`);
      }
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
