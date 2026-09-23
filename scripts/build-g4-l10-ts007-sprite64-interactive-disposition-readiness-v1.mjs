#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  deriveSingleFrameScriptlessEligibility,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-ts007-sprite64-interactive-disposition-readiness-v1.json";

const ANIMATION_ID = "course-g04-l10-ts-007";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const BASE = `migrations/${ANIMATION_ID}`;
const INPUTS = Object.freeze({
  manifest: Object.freeze({
    path: `${BASE}/migration.json`,
    bytes: 28936,
    sha256: "62a981ef41d274f5ec9b3ad69852d3e7b860db4270cb895085387ca395cc8337",
    mode: "0644",
  }),
  coverage: Object.freeze({
    path: `${BASE}/evidence/full-frame-coverage.json`,
    bytes: 97875,
    sha256: "7a0b368f1d1f222a40a6a3185cfc0842036f7967063940e0511758aac100d789",
    mode: "0644",
  }),
  disposition: Object.freeze({
    path: `${BASE}/audit/frame-domain-disposition.json`,
    bytes: 100597,
    sha256: "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da",
    mode: "0644",
  }),
  staticEvidence: Object.freeze({
    path: `${BASE}/audit/static-frame-domain-disposition-evidence.json`,
    bytes: 165860,
    sha256: "3e965e69081ce4affedfcfa86ff02b14559d5fbee73039539b8e475a57a2aaea",
    mode: "0644",
  }),
  independentEvidence: Object.freeze({
    path: `${BASE}/audit/source-proven-independent-frame-domain-evidence.json`,
    bytes: 54647,
    sha256: "110ad73562c8e01b205c4449504612dcf6cb0d86b6cea051d1da81bb25f60f02",
    mode: "0644",
  }),
  inventory: Object.freeze({
    path: `${BASE}/audit/scenario-inventory.json`,
    bytes: 1030575,
    sha256: "a7601f0e9a1508f446ccb630d182d3004316b52ef3cd38dc2734115c292430f6",
    mode: "0644",
  }),
  swfmill: Object.freeze({
    path: `${BASE}/audit/machine/swfmill.xml.gz`,
    bytes: 987643,
    sha256: "a2cdc609431c5a6571383828e2a180b9034137ebe9275f19e9da107330873183",
    mode: "0644",
  }),
  ffdecScripts: Object.freeze({
    path: `${BASE}/audit/machine/ffdec-scripts.txt.gz`,
    bytes: 1475,
    sha256: "37ae1f45789624e1bbc68937074eaf7c59818877692701a71ab4f82b6bafc447",
    mode: "0644",
  }),
  sourceSwf: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf",
    bytes: 585839,
    sha256: "64070bdec0badb3cb009a741fe1b5e9c96bd98e68b92c4dfe125db3b43617eff",
    mode: "0500",
  }),
  templateContract: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.json",
    bytes: 237667,
    sha256: "4bc3884451303da1342763ec65095bb13b3d67f2ba28bfbfda739c58485f9e51",
    mode: "0644",
  }),
  failedHelperReview: Object.freeze({
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-487d5f85-failed-v1.json",
    bytes: 8768,
    sha256: "7b07824a378d232e89f46eb744fd572042a455f3203c7e41c2b0b16fda477b1d",
    mode: "0444",
  }),
});

const EXPECTED_ELIGIBLE_SINGLE_FRAME = Object.freeze([
  "sprite-60",
  "sprite-62",
  "sprite-63",
  "sprite-77",
  "sprite-79",
  "sprite-203",
  "sprite-226",
  "sprite-419",
]);
const EXPECTED_STATIC_CLAIMS = Object.freeze([
  "sprite-60",
  "sprite-62",
  "sprite-63",
  "sprite-77",
  "sprite-79",
  "sprite-203",
  "sprite-226",
  "sprite-355",
  "sprite-379",
  "sprite-419",
]);
const EXPECTED_SCRIPTS = Object.freeze({
  "script-0083": Object.freeze({
    script: "DefineSprite_63/frame_1/PlaceObject2_60_1/CLIPACTIONRECORD on(press).as",
    bodySha256: "9607d5ee075d80c14d6d8382af8d73abcc2e40313f98aee646d918322ace8db6",
    lineStart: 501,
    lineEnd: 504,
  }),
  "script-0084": Object.freeze({
    script: "DefineSprite_63/frame_1/PlaceObject2_60_1/CLIPACTIONRECORD on(releaseOutside,release).as",
    bodySha256: "828c5a3b328e8dfdd1621579990cf204c1d5ad953c64fad4a9751cf37cba3ab5",
    lineStart: 506,
    lineEnd: 509,
  }),
  "script-0085": Object.freeze({
    script: "DefineSprite_63/frame_1/PlaceObject2_62_12/CLIPACTIONRECORD on(press).as",
    bodySha256: "af57c5a006160bee204a895f22e269207dc6e33ab28d8a7b84647d97ef023660",
    lineStart: 511,
    lineEnd: 514,
  }),
  "script-0086": Object.freeze({
    script: "DefineSprite_63/frame_1/PlaceObject2_62_12/CLIPACTIONRECORD on(releaseOutside,release).as",
    bodySha256: "f6080c6d013fd0e8380a2c23da0f9379b09a75b1958428f58cbb8847d776a41e",
    lineStart: 516,
    lineEnd: 519,
  }),
  "script-0087": Object.freeze({
    script: "DefineSprite_64/frame_1/DoAction.as",
    bodySha256: "c25439ba4c079127c9866f139daa22f9a45aa30546e399796f170ddd05991ff0",
    lineStart: 521,
    lineEnd: 552,
  }),
  "script-0088": Object.freeze({
    script: "DefineSprite_64/frame_1/PlaceObject2_63_1/CLIPACTIONRECORD onClipEvent(enterFrame).as",
    bodySha256: "6b24d80a18f65976f7216643b9a9ece029e9887111660327d105f0f36f9f4c83",
    lineStart: 554,
    lineEnd: 560,
  }),
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "canonicalWorkspaceMutation",
  "frameDomainDispositionChange",
  "coverageRegeneration",
  "specificationAcceptance",
  "productionHelperImplementation",
  "productionHelperTest",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "baselineAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "sourcePromotion",
  "release",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [
    info.dev,
    info.ino,
    info.mode,
    info.nlink,
    info.uid,
    info.gid,
    info.size,
    info.mtimeNs,
    info.ctimeNs,
  ].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${expected.path}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${expected.path}`);
  assert.equal(before.nlink, 1n,
    `Input must have one hard link: ${expected.path}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${expected.path}`);
  assert.equal(bytes.length, expected.bytes,
    `Input byte count drifted: ${expected.path}`);
  assert.equal(sha256(bytes), expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  assert.equal(modeString(before), expected.mode,
    `Input mode drifted: ${expected.path}`);
  return {...expected, bytes};
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  assert.fail(`Target must be absent: ${relativePath}`);
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

function exactScript(inventory, id) {
  const candidates = [
    ...(inventory.interactions?.handlers || []),
    ...(inventory.interactions?.nonEventScripts || []),
  ].filter((entry) => entry.id === id);
  assert.equal(candidates.length, 1, `${id}: expected exactly one scenario-inventory script`);
  const entry = candidates[0];
  const expected = EXPECTED_SCRIPTS[id];
  assert.ok(expected, `${id}: expected-script contract is missing`);
  for (const key of ["script", "bodySha256", "lineStart", "lineEnd"]) {
    assert.deepEqual(entry[key], expected[key], `${id}: ${key} drifted`);
  }
  return {
    id,
    script: entry.script,
    bodySha256: entry.bodySha256,
    lineStart: entry.lineStart,
    lineEnd: entry.lineEnd,
    scope: entry.scope,
    hitTargetCandidate: entry.hitTargetCandidate,
    event: entry.event,
    categories: entry.categories,
    signals: entry.signals,
  };
}

function ffdecBlock(scripts, expected) {
  const candidates = scripts.blocks.filter(({script}) => script === expected.script);
  assert.equal(candidates.length, 1, `${expected.script}: expected one FFDec block`);
  const [block] = candidates;
  assert.equal(block.bodySha256, expected.bodySha256,
    `${expected.script}: FFDec body SHA-256 drifted`);
  return {
    script: block.script,
    bodySha256: block.bodySha256,
    headingLine: block.headingLine,
    lineStart: block.lineStart,
    lineEnd: block.lineEnd,
  };
}

function placementProjection(resolved) {
  return {
    parentTimelineId: resolved.parentTimelineId,
    sourceObjectId: resolved.effectiveObjectId,
    frame: resolved.placement.frame,
    depth: resolved.placement.depth,
    instanceName: resolved.placement.name,
    tag: resolved.placement.tag,
    replace: resolved.placement.replace,
    hasClipActionsInSwfmillExport: resolved.placement.hasClipActions,
    matrix: resolved.placement.matrix,
  };
}

export async function buildReadiness(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const entries = Object.fromEntries(await Promise.all(Object.entries(INPUTS)
    .map(async ([key, expected]) => [key, await stableRead(root, expected)])));
  const manifest = parseJson(entries.manifest);
  const inventory = parseJson(entries.inventory);
  const disposition = parseJson(entries.disposition);
  const staticEvidence = parseJson(entries.staticEvidence);
  const independentEvidence = parseJson(entries.independentEvidence);
  const coverage = parseJson(entries.coverage);
  const templateContract = parseJson(entries.templateContract);
  const failedHelperReview = parseJson(entries.failedHelperReview);
  const structure = parseSwfmillDispositionStructure(
    gunzipSync(entries.swfmill.bytes).toString("utf8"));
  const scripts = parseFfdecDispositionScripts(
    gunzipSync(entries.ffdecScripts.bytes).toString("utf8"));

  assert.equal(manifest.id, ANIMATION_ID);
  assert.equal(manifest.source?.swfSha256, INPUTS.sourceSwf.sha256);
  assert.equal(manifest.source?.swf, INPUTS.sourceSwf.path);
  assert.equal(manifest.assetId, `swf-${INPUTS.sourceSwf.sha256}`);
  assert.equal(inventory.animationId, ANIMATION_ID);
  assert.equal(disposition.animationId, ANIMATION_ID);
  assert.equal(disposition.status,
    "structurally-enumerated-dispositions-unresolved");
  assert.deepEqual(disposition.summary.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 10,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 1,
  });
  const sprite64Rows = disposition.timelines.filter(({timelineId}) =>
    timelineId === "sprite-64");
  assert.equal(sprite64Rows.length, 1);
  const [sprite64Disposition] = sprite64Rows;
  assert.equal(sprite64Disposition.frameCount, 1);
  assert.equal(sprite64Disposition.disposition, "unresolved");
  assert.deepEqual(sprite64Disposition.staticSignals, {
    controlStateCount: 1,
    frameLabelCount: 0,
    namedChildPlacementCount: 1,
  });
  assert.deepEqual(sprite64Disposition.rootPlacement.namedPlacementPath.map((item) => ({
    parentTimelineId: item.parentTimelineId,
    childTimelineId: item.childTimelineId,
    frame: item.frame,
    depth: item.depth,
    instanceName: item.instanceName,
  })), [
    {parentTimelineId: "root", childTimelineId: "sprite-415", frame: 6, depth: "1", instanceName: "animation"},
    {parentTimelineId: "sprite-415", childTimelineId: "sprite-64", frame: 23, depth: "57", instanceName: "scale"},
  ]);

  const staticClaimIds = staticEvidence.claims.map(({timelineId}) => timelineId);
  assert.deepEqual(staticClaimIds, EXPECTED_STATIC_CLAIMS);
  assert.equal(staticClaimIds.includes("sprite-64"), false);
  assert.equal(independentEvidence.claims.some(({timelineId}) =>
    timelineId === "sprite-64"), false);

  const recomputed = deriveSingleFrameScriptlessEligibility({
    animationId: ANIMATION_ID,
    structure,
    scripts,
    inventory,
    manifest,
  });
  assert.deepEqual(recomputed.eligibleTimelineIds, EXPECTED_ELIGIBLE_SINGLE_FRAME);
  const sprite64 = recomputed.inspections.get("sprite-64");
  assert.ok(sprite64, "sprite-64 inspection is missing");
  assert.equal(sprite64.eligible, false);
  assert.deepEqual(sprite64.disqualifiers, [
    "swfmill-do-action-present",
    "ffdec-frame-script-present",
  ]);
  assert.deepEqual(sprite64.timeline.tagCounts, {
    DoAction: 1,
    PlaceObject2: 1,
    ShowFrame: 1,
    End: 1,
  });
  assert.equal(sprite64.incomingResolved.length, 1);
  assert.equal(sprite64.outgoingResolved.length, 1);
  assert.equal(sprite64.unresolvedOutgoingCount, 0);
  assert.equal(sprite64.clipActionCount, 0);

  const scenarioScripts = Object.keys(EXPECTED_SCRIPTS)
    .map((id) => exactScript(inventory, id));
  const directFfdec = ffdecBlock(scripts, EXPECTED_SCRIPTS["script-0087"]);
  const placedClipFfdec = ffdecBlock(scripts, EXPECTED_SCRIPTS["script-0088"]);
  assert.deepEqual(directFfdec, {
    script: EXPECTED_SCRIPTS["script-0087"].script,
    bodySha256: EXPECTED_SCRIPTS["script-0087"].bodySha256,
    headingLine: 521,
    lineStart: 522,
    lineEnd: 553,
  });
  assert.deepEqual(placedClipFfdec, {
    script: EXPECTED_SCRIPTS["script-0088"].script,
    bodySha256: EXPECTED_SCRIPTS["script-0088"].bodySha256,
    headingLine: 554,
    lineStart: 555,
    lineEnd: 561,
  });

  const oldCoverageBinding = coverage.materialization.frameDomainDisposition;
  assert.equal(oldCoverageBinding.sha256,
    "ebc6e4aafdf48f7beb6752f437e21a5fdd1986e4b5209362c0c94628e830b3c2");
  assert.deepEqual(oldCoverageBinding.dispositionCounts, {
    "declared-frame-domain": 15,
    "composite-child-with-parent": 8,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 3,
  });
  assert.equal(oldCoverageBinding.sha256 === INPUTS.disposition.sha256, false);
  assert.equal(templateContract.status, "fail-closed-template-not-stable");
  assert.equal(templateContract.downstreamTransactionBoundary.decision,
    "DO_NOT_APPLY");
  assert.deepEqual(templateContract.downstreamTransactionBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(failedHelperReview.status,
    "FAILED_INVALIDATED_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.ok(Object.values(failedHelperReview.authorityEffects)
    .every((value) => value === false));

  const authorityEffects = Object.fromEntries(
    AUTHORITY_EFFECT_KEYS.map((key) => [key, false]));
  const inputBindings = Object.fromEntries(Object.entries(entries)
    .map(([key, entry]) => [key, {
      path: entry.path,
      bytes: entry.bytes.length,
      sha256: entry.sha256,
      mode: entry.mode,
    }]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-ts007-sprite64-interactive-disposition-readiness-v1",
    status: "source-static-interactive-gap-frozen-disposition-unresolved",
    decision: "KEEP_UNRESOLVED_DO_NOT_CLASSIFY_DO_NOT_APPLY",
    releaseId: RELEASE_ID,
    animationId: ANIMATION_ID,
    sourceIdentity: {
      assetId: `swf-${INPUTS.sourceSwf.sha256}`,
      sourceSwfPath: INPUTS.sourceSwf.path,
      sourceSwfSha256: INPUTS.sourceSwf.sha256,
    },
    purpose: [
      "Freeze the exact source-static interactive behavior that prevents sprite-64 from being classified as a single-frame scriptless composite.",
      "Define an acceptance-neutral original-runtime observation matrix without launching any runtime or changing the migration workspace.",
    ],
    evidenceInputs: inputBindings,
    currentDisposition: {
      status: disposition.status,
      summary: disposition.summary,
      definitions: disposition.dispositionDefinitions,
      sprite64: sprite64Disposition,
      staticClaimTimelineIds: staticClaimIds,
      sourceProvenIndependentClaimCount: independentEvidence.claims.length,
      sprite64ClaimedByStaticCompositeEvidence: false,
      sprite64ClaimedBySourceProvenIndependentEvidence: false,
    },
    independentStaticRecomputation: {
      algorithm:
        "deriveSingleFrameScriptlessEligibility from the bound swfmill, FFDec, scenario-inventory, and migration-manifest bytes",
      eligibleSingleFrameTimelineIds: recomputed.eligibleTimelineIds,
      sprite64: {
        eligibleAsSingleFrameScriptlessComposite: false,
        disqualifiers: sprite64.disqualifiers,
        declaredFrameCount: sprite64.timeline.declaredFrames,
        observedShowFrameCount: sprite64.timeline.observedShowFrames,
        directTimelineTagCounts: sprite64.timeline.tagCounts,
        directDoActionCount: sprite64.directDoActionTagCount,
        directFfdecFrameScriptCount: sprite64.ffdecFrameScripts.length,
        ffdecPlacedClipActionPresentOutsideDirectFrameScriptClassifier: true,
        incomingPlacement: placementProjection(sprite64.incomingResolved[0]),
        outgoingPlacement: placementProjection(sprite64.outgoingResolved[0]),
        unresolvedOutgoingObjectCount: sprite64.unresolvedOutgoingCount,
        swfmillExportedPlacementClipActionCount: sprite64.clipActionCount,
      },
    },
    interactiveScriptCluster: {
      scenarioInventoryRecords: scenarioScripts,
      exactFfdecBlocks: {
        sprite64FrameAction: directFfdec,
        sprite63PlacedEnterFrameAction: placedClipFfdec,
      },
      sourceStaticSemantics: [
        "sprite-63 object 60 press calls _parent.startDrag(); release or releaseOutside calls _parent.stopDrag().",
        "sprite-63 object 62 press writes _global.mcMovement=true; release or releaseOutside writes _global.mcMovement=false.",
        "sprite-64 frame 1 installs this.onEnterFrame. While _global.mcMovement is truthy it reads local mouse coordinates and scale_mc coordinates, computes atan2-derived mirrored degrees through four explicit branches, and writes _global.degreesRotation=degrees-85.",
        "sprite-64's placed sprite-63 clip action runs on enterFrame. While _global.mcMovement is truthy it assigns this._rotation=Math.floor(_global.degreesRotation).",
      ],
      unresolvedSourceBindings: [
        {
          name: "_global.mcMovement",
          sourceWritesObserved: [true, false],
          authoritativeEntryValueKnown: false,
          rule: "capture must observe or explicitly seed the value; no default may be guessed",
        },
        {
          name: "_global.degreesRotation",
          sourceWriteFormula: "degrees - 85",
          authoritativeEntryValueKnown: false,
          rule: "capture must observe or explicitly seed the value; no default may be guessed",
        },
      ],
    },
    sourceStaticBehaviorSpecificationCandidate: {
      acceptanceStatus: "candidate-only-not-adopted",
      states: [
        {
          id: "movement-inactive",
          condition: "_global.mcMovement is false or otherwise not truthy",
          sourceProvenEffect: "the two sprite-64 enterFrame handlers do not execute their guarded writes",
          runtimeVisualPersistence: "unresolved-until-authoritative-observation",
        },
        {
          id: "movement-active",
          entryEvent: "press on sprite-63 object 62 at depth 12",
          sourceProvenEffect: "each eligible enterFrame callback recomputes degreesRotation and floors it into sprite-63 rotation",
          exitEvents: ["release", "releaseOutside"],
        },
        {
          id: "drag-active",
          entryEvent: "press on sprite-63 object 60 at depth 1",
          sourceProvenEffect: "calls _parent.startDrag()",
          exitEvents: ["release", "releaseOutside"],
          relationshipToRotationControl: "unresolved-until-natural-runtime-observation",
        },
      ],
      angleBranches: [
        "degrees_Mirrored > 180 && degrees_Mirrored < 360",
        "degrees_Mirrored > 0 && degrees_Mirrored < 180",
        "degrees_Mirrored == 360 || degrees_Mirrored == 0",
        "degrees_Mirrored == 180",
      ],
    },
    requiredFutureOriginalRuntimeObservationMatrix: {
      status: "required-not-executed",
      prerequisite:
        "a separately qualified security review, implementation authorization, reviewed helper, approved disposable offline environment, named Peter Hu operation, and a checked launch receipt",
      languages: ["en", "es"],
      naturalEntry: [
        "root frame 6 named instance animation -> sprite-415",
        "sprite-415 frame 23 depth 57 named instance scale -> sprite-64",
      ],
      scenarios: [
        "entry before any interaction, including observed _global.mcMovement and _global.degreesRotation",
        "movement-inactive across multiple enterFrame ticks",
        "press movement control, then sample multiple mouse positions covering all four angle branches and axis boundaries",
        "release and releaseOutside as separate paths, followed by multiple enterFrame ticks",
        "drag press/move/release and drag press/move/releaseOutside",
        "Replay/reset and natural re-entry",
        "terminal progression and navigation away/back",
      ],
      observables: [
        "event ordering across sprite-64 frame action and placed sprite-63 enterFrame clip action",
        "sprite-64 visibility and bounds; scale_mc anchor and transform",
        "sprite-64 local _xmouse/_ymouse, dx, dy, alpha, degrees_Mirrored, degrees, and _global.degreesRotation",
        "sprite-63 rotation before and after each callback",
        "_global.mcMovement before and after press, release, releaseOutside, Replay, and re-entry",
        "language-dependent visual, text, host, or audio differences if any",
      ],
      exactMouseCoordinatesPredeclared: false,
      reason:
        "source-static evidence does not establish authoritative hit bounds or natural runtime coordinate samples; the operator kit must bind them before launch without guessing",
    },
    dispositionConclusion: {
      currentDisposition: "unresolved",
      compositeChildWithParentSupported: false,
      independentRequiredSupported: false,
      nonvisualSupported: false,
      reason:
        "sprite-64 is structurally reachable and interactive, but current source-static evidence neither proves exhaustive representation inside a parent domain nor proves that an independent frame domain is required; authoritative runtime or authoring evidence remains absent",
      allowedFutureTransition:
        "only a separately reviewed, hash-bound successor based on authoritative original-runtime or higher-priority authoring evidence",
    },
    downstreamStalenessAndSafetyBoundary: {
      coverageCurrentAgainstDisposition: false,
      coverageBindsDisposition: oldCoverageBinding,
      currentDisposition: {
        bytes: INPUTS.disposition.bytes,
        sha256: INPUTS.disposition.sha256,
        dispositionCounts: disposition.summary.dispositionCounts,
      },
      staleCoverageEffect:
        "full-frame coverage remains a predecessor projection and cannot be cited as current for the two later nested-parent composite classifications",
      downstreamTransactionDecision:
        templateContract.downstreamTransactionBoundary.decision,
      downstreamTransactionProhibitedModes:
        templateContract.downstreamTransactionBoundary.prohibitedModes,
      independentlyReproducedP0Findings:
        templateContract.downstreamTransactionBoundary.independentlyReproducedP0Findings,
      rule:
        "Do not execute the 114-output downstream candidate in any mode; this report does not refresh coverage, traces, keyframes, plans, caches, or receipts",
    },
    helperAndRuntimeBoundary: {
      latestBoundReviewBatchStatus: failedHelperReview.status,
      reviewBatchReusable: false,
      productionHelperImplementationAuthorized: false,
      helperExecutionAuthorized: false,
      originalRuntimeLaunchAuthorized: false,
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      canonicalWorkspaceWriteSupported: false,
      applySupported: false,
      recoverSupported: false,
      rollbackSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 report; never modify a migration workspace or source asset`,
    authorityEffects,
    nextPermittedAction:
      "Use this frozen source-static gap as an input to a future separately authorized review/capture-kit successor after the native-helper security path is independently requalified; do not launch a runtime or implement a renderer from this report alone.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const readinessFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, readinessFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildReadiness(bundle.root);
  assert.equal(current.json, bundle.json,
    "TS007 sprite-64 readiness inputs changed after derivation");
}

export async function checkReadiness(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, {
    path: REPORT_RELATIVE,
    bytes: expected.length,
    sha256: sha256(expected),
    mode: "0444",
  });
  assert.deepEqual(observed.bytes, expected,
    "TS007 sprite-64 readiness report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    readinessFingerprintSha256:
      bundle.document.readinessFingerprintSha256,
    sprite64Disposition:
      bundle.document.dispositionConclusion.currentDisposition,
    originalRuntimeLaunched: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

export async function publishReadinessNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const absolute = resolveInside(outputRoot, REPORT_RELATIVE);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  await assertAbsent(outputRoot, REPORT_RELATIVE);
  await (options.beforeWrite ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkReadiness(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(
  argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT,
) {
  const mode = parseArguments(argv);
  const bundle = await buildReadiness(projectRoot);
  if (mode === "--write-no-clobber") {
    return publishReadinessNoClobber(bundle);
  }
  if (mode === "--check") return checkReadiness(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    readinessFingerprintSha256:
      bundle.document.readinessFingerprintSha256,
    sprite64Disposition:
      bundle.document.dispositionConclusion.currentDisposition,
    originalRuntimeLaunched: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
