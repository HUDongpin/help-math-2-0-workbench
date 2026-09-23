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
  deriveMultiFrameScriptlessCandidateAudit,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-dynamic-indirect-parent-target-control-proof-candidate-v1.json";

const EXACT_PAIR_SET = Object.freeze({
  count: 21,
  sha256: "196f722ab861926b7c9ac1b9603ed08e588296bd518e224def74f9c08f90796e",
  encoding: "sorted-animationId-tab-timelineId-newline-v1",
});

const FIXED_INPUTS = Object.freeze({
  residualTriage: Object.freeze({
    path: "reports/g4-l10-residual-frame-domain-audit-triage-v1.json",
    bytes: 124726,
    sha256: "ba515be75fbf9f8fd25ddbd9114a3e00996cdfb535f567c4518116118bb1a7f2",
    mode: "0444",
  }),
  dispositionProofEngine: Object.freeze({
    path: "scripts/build-static-frame-domain-disposition-evidence.mjs",
    bytes: 140795,
    sha256: "87b40d7d2066758669a03d08fc2366a5612775dd7967e92d1619176f2ae3b825",
    mode: "0644",
  }),
});

const CLUSTERS = Object.freeze({
  "feedback-html-property-write": Object.freeze({
    expectedPairCount: 10,
    expectedMemberCount: 7,
    members: Object.freeze([
      "course-g04-l10-vb-006",
      "course-g04-l10-vb-007",
      "course-g04-l10-in-006",
      "course-g04-l10-in-008",
      "course-g04-l10-in-011",
      "course-g04-l10-in-013",
      "course-g04-l10-in-016",
    ]),
  }),
  "ti002-named-parent-and-peer-control": Object.freeze({
    expectedPairCount: 3,
    expectedMemberCount: 1,
    members: Object.freeze(["course-g04-l10-ti-002"]),
  }),
  "rect-visibility-property-write": Object.freeze({
    expectedPairCount: 8,
    expectedMemberCount: 3,
    members: Object.freeze([
      "course-g04-l10-ti-003",
      "course-g04-l10-ti-004",
      "course-g04-l10-ti-005",
    ]),
  }),
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "canonicalWorkspaceMutation",
  "frameDomainDispositionChange",
  "coverageRegeneration",
  "traceRegeneration",
  "keyframeRegeneration",
  "runtimePlanRegeneration",
  "authoringAuditAcceptance",
  "originalRuntimeLaunch",
  "authoritativeOriginalRuntimeEvidence",
  "specificationAcceptance",
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

function compareText(left, right) {
  return Buffer.compare(Buffer.from(String(left)), Buffer.from(String(right)));
}

function compareTimelineIds(left, right) {
  const leftNumber = Number.parseInt(String(left).replace(/^sprite-/, ""), 10);
  const rightNumber = Number.parseInt(String(right).replace(/^sprite-/, ""), 10);
  if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber)
      && leftNumber !== rightNumber) return leftNumber - rightNumber;
  return compareText(left, right);
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
  return relative !== "" && relative !== ".."
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
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
  const record = {
    path: expected.path,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(before),
  };
  if (expected.bytes !== undefined) assert.equal(record.byteCount,
    expected.bytes, `Input byte count drifted: ${expected.path}`);
  if (expected.sha256) assert.equal(record.sha256, expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  if (expected.mode) assert.equal(record.mode, expected.mode,
    `Input mode drifted: ${expected.path}`);
  return record;
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

function binding(record) {
  return {
    path: record.path,
    bytes: record.byteCount,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function inputSetSha256(records) {
  const encoded = [...records].sort((left, right) =>
    compareText(left.path, right.path)).map((record) =>
    `${record.path}\0${record.byteCount}\0${record.sha256}\0${record.mode}\n`).join("");
  return sha256(Buffer.from(encoded, "utf8"));
}

function pairKey(pair) {
  return `${pair.animationId}\t${pair.timelineId}`;
}

function exactSet(rows, serializer, encoding) {
  const values = rows.map(serializer).sort(compareText);
  assert.equal(new Set(values).size, values.length,
    `${encoding}: rows are duplicated`);
  const bytes = Buffer.from(values.map((value) => `${value}\n`).join(""), "utf8");
  return {count: values.length, sha256: sha256(bytes), encoding};
}

function pairSet(pairs) {
  return exactSet(pairs, pairKey,
    "sorted-animationId-tab-timelineId-newline-v1");
}

function clusterFor(animationId) {
  const matches = Object.entries(CLUSTERS).filter(([, cluster]) =>
    cluster.members.includes(animationId));
  assert.equal(matches.length, 1,
    `${animationId}: expected exactly one dynamic-reference cluster`);
  return matches[0][0];
}

function exactFreshNamedRootPath(structure, targetTimelineId, label) {
  assert.notEqual(targetTimelineId, "root", `${label}: target must be nested`);
  const reverse = [];
  const visited = new Set();
  let childTimelineId = targetTimelineId;
  while (childTimelineId !== "root") {
    assert.equal(visited.has(childTimelineId), false,
      `${label}: placement graph contains a cycle`);
    visited.add(childTimelineId);
    const child = structure.timelines.get(childTimelineId);
    assert.ok(child?.objectId,
      `${label}: ${childTimelineId} lacks source object identity`);
    const incoming = [];
    for (const parent of structure.timelines.values()) {
      for (const placement of parent.placements || []) {
        if (String(placement.objectId ?? "") === String(child.objectId)) {
          incoming.push({parent, placement});
        }
      }
    }
    assert.equal(incoming.length, 1,
      `${label}: ${childTimelineId} must have one explicit incoming placement`);
    const [{parent, placement}] = incoming;
    assert.equal(placement.tag, "PlaceObject2",
      `${label}: root-path placement tag drifted`);
    assert.equal(placement.replace, "0",
      `${label}: root-path placement is not fresh`);
    assert.ok(placement.name.length > 0,
      `${label}: root-path placement is unnamed`);
    assert.equal(placement.hasClipActions, false,
      `${label}: root-path placement has clip actions`);
    reverse.push({
      parentTimelineId: parent.timelineId,
      childTimelineId,
      sourceObjectId: String(child.objectId),
      frame: placement.frame,
      depth: placement.depth,
      instanceName: placement.name,
      tag: placement.tag,
      replace: placement.replace,
      hasClipActions: false,
    });
    childTimelineId = parent.timelineId;
  }
  const result = reverse.reverse();
  assert.ok(result.length >= 2, `${label}: expected an indirect root path`);
  return result;
}

function normalizedTagCensus(tagCounts) {
  return Object.fromEntries(Object.entries(tagCounts)
    .sort(([left], [right]) => compareText(left, right)));
}

function classifyDynamicReference(reference, parentInstanceNames) {
  const source = reference.sourceLine;
  const classifications = [];
  if (/^eval\("Mc_Wrong_Feed" \+ i\)\.Mc_Feed_Popup\.txtFeed\.html = true;$/u.test(source)) {
    classifications.push({
      operationClass: "named-peer-property-write",
      constructedNameFamily: "Mc_Wrong_Feed<i>",
      property: "Mc_Feed_Popup.txtFeed.html",
      directPlayheadMutation: false,
      mayAddressDeclaredParent: false,
    });
  }
  if (/^eval\("rect" \+ parseInt\(arr1\[0\]\) \+ parseInt\(arr1\[1\]\)\)\._visible = true;$/u.test(source)) {
    classifications.push({
      operationClass: "named-rect-property-write",
      constructedNameFamily: "rect<row><column>",
      property: "_visible",
      directPlayheadMutation: false,
      mayAddressDeclaredParent: false,
    });
  }
  if (/^removeMovieClip\(_parent\.Mc_SwapDepth\);$/u.test(source)) {
    classifications.push({
      operationClass: "named-peer-lifecycle-operation",
      constructedNameFamily: "Mc_SwapDepth",
      property: null,
      directPlayheadMutation: false,
      mayAddressDeclaredParent: false,
    });
  }
  if (/^eval\("_root\.animation_mc\.animation\.Mc_Right_Feed" \+ i\)\.gotoAndStop\(1\);$/u.test(source)) {
    classifications.push({
      operationClass: "named-parent-or-peer-playhead-control",
      constructedNameFamily: "_root.animation_mc.animation.Mc_Right_Feed<i>",
      property: "gotoAndStop(1)",
      directPlayheadMutation: true,
      mayAddressDeclaredParent: parentInstanceNames.some((name) =>
        /^Mc_Right_Feed\d+$/u.test(name)),
    });
  }
  if (/^eval\("_root\.animation_mc\.animation\.Mc_Wrong_Feed" \+ i\)\.gotoAndStop\(1\);$/u.test(source)) {
    classifications.push({
      operationClass: "named-peer-playhead-control",
      constructedNameFamily: "_root.animation_mc.animation.Mc_Wrong_Feed<i>",
      property: "gotoAndStop(1)",
      directPlayheadMutation: true,
      mayAddressDeclaredParent: false,
    });
  }
  if (/^if\(eval\(this\._droptarget\) == _parent\["Mc_Tar_" \+ tempSplSrc\[tempSplSrc\.length - 1\]\]\)$/u.test(source)) {
    classifications.push({
      operationClass: "drop-target-identity-comparison",
      constructedNameFamily: "Mc_Tar_<suffix>",
      property: null,
      directPlayheadMutation: false,
      mayAddressDeclaredParent: false,
    });
  }
  if (/^_parent\["Mc_Tar_" \+ tempSplSrc\[tempSplSrc\.length - 1\]\]\._alpha = 100;$/u.test(source)) {
    classifications.push({
      operationClass: "named-drop-target-property-write",
      constructedNameFamily: "Mc_Tar_<suffix>",
      property: "_alpha",
      directPlayheadMutation: false,
      mayAddressDeclaredParent: false,
    });
  }
  assert.equal(classifications.length, 1,
    `${reference.script}:${reference.line}: unclassified or ambiguous dynamic reference: ${source}`);
  return classifications[0];
}

function scriptBlockForReference(scripts, reference) {
  const matches = scripts.blocks.filter(({script}) => script === reference.script);
  assert.equal(matches.length, 1,
    `${reference.script}: dynamic-reference script block is not unique`);
  const [block] = matches;
  assert.ok(reference.line >= block.lineStart && reference.line <= block.lineEnd,
    `${reference.script}:${reference.line}: reference is outside its script block`);
  return block;
}

function dynamicReferenceSet(references) {
  return exactSet(references, (reference) => [
    reference.animationId,
    reference.script,
    reference.line,
    reference.scriptBodySha256,
    reference.sourceLine,
    reference.operationClass,
  ].join("\t"),
  "sorted-animationId-script-line-scriptBodySha256-sourceLine-operationClass-newline-v1");
}

function parentDomainContract(manifest, inspection, parentRootPath, label) {
  const matches = (manifest.implementation?.frameDomains || []).filter(
    ({sourceTimelineId}) => sourceTimelineId === inspection.parentTimelineId);
  assert.equal(matches.length, 1,
    `${label}: exact declared parent domain is missing or duplicated`);
  const [domain] = matches;
  assert.equal(domain.id, inspection.parentFrameDomainId,
    `${label}: parent domain ID drifted`);
  assert.equal(domain.kind, "nested", `${label}: parent domain is not nested`);
  assert.equal(domain.frameCount, inspection.parentFrameCount,
    `${label}: parent frame count drifted`);
  assert.deepEqual(domain.sourceParentTimelineIds,
    [parentRootPath.at(-1).parentTimelineId],
    `${label}: parent source-parent identity differs from root path`);
  assert.equal(typeof domain.parentFrameDomainId, "string",
    `${label}: parent frame-domain ancestry is absent`);
  assert.ok(domain.parentFrameDomainId.length > 0,
    `${label}: parent frame-domain ancestry is empty`);
  assert.equal(typeof domain.captureParentResolution, "string",
    `${label}: parent capture-resolution statement is absent`);
  assert.ok(domain.captureParentResolution.includes(
    "parentEntryState remains unresolved"),
  `${label}: unresolved parent-entry boundary was not retained`);
  assert.equal(domain.sourceProof?.authoritativeRuntimeEntryEstablished, false,
    `${label}: parent domain unexpectedly claims runtime entry authority`);
  assert.equal(domain.sourceProof?.strictAcceptanceEffect, "none",
    `${label}: parent domain unexpectedly claims strict acceptance`);
  return {
    id: domain.id,
    kind: domain.kind,
    frameCount: domain.frameCount,
    parentFrameDomainId: domain.parentFrameDomainId,
    sourceTimelineId: domain.sourceTimelineId,
    sourceParentTimelineIds: domain.sourceParentTimelineIds,
    captureParentResolution: domain.captureParentResolution,
    authoritativeRuntimeEntryEstablished: false,
    strictAcceptanceEffect: "none",
  };
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

export async function buildCandidate(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const fixedRecords = Object.fromEntries(await Promise.all(
    Object.entries(FIXED_INPUTS).map(async ([key, expected]) =>
      [key, await stableRead(root, expected)]),
  ));
  const triage = parseJson(fixedRecords.residualTriage);
  assert.equal(triage.status,
    "residual-unresolved-exactly-enumerated-routed-no-disposition-change");
  assert.equal(triage.decision,
    "KEEP_70_UNRESOLVED_ADVANCE_ONLY_BY_BOUND_SUCCESSORS");
  const selectedPairs = triage.residualPairs.filter(({categoryId}) =>
    categoryId === "dynamic-indirect-parent");
  assert.deepEqual(pairSet(selectedPairs), EXACT_PAIR_SET);
  assert.ok(selectedPairs.every(({currentDisposition}) =>
    currentDisposition === "unresolved"));

  const byAnimationId = new Map();
  for (const pair of selectedPairs) {
    if (!byAnimationId.has(pair.animationId)) byAnimationId.set(pair.animationId, []);
    byAnimationId.get(pair.animationId).push(pair);
  }
  assert.equal(byAnimationId.size, 11);

  const memberResults = [];
  const allWorkspaceRecords = [];
  const allReferences = [];
  for (const [animationId, pairs] of [...byAnimationId.entries()].sort(
    ([left], [right]) => compareText(left, right))) {
    const base = `migrations/${animationId}`;
    const records = Object.fromEntries(await Promise.all([
      ["manifest", `${base}/migration.json`],
      ["disposition", `${base}/audit/frame-domain-disposition.json`],
      ["inventory", `${base}/audit/scenario-inventory.json`],
      ["staticEvidence", `${base}/audit/static-frame-domain-disposition-evidence.json`],
      ["swfmill", `${base}/audit/machine/swfmill.xml.gz`],
      ["ffdec", `${base}/audit/machine/ffdec-scripts.txt.gz`],
    ].map(async ([key, filePath]) =>
      [key, await stableRead(root, {path: filePath})])));
    allWorkspaceRecords.push(...Object.values(records));
    const manifest = parseJson(records.manifest);
    const disposition = parseJson(records.disposition);
    const inventory = parseJson(records.inventory);
    const staticEvidence = parseJson(records.staticEvidence);
    assert.equal(manifest.id, animationId);
    assert.equal(disposition.animationId, animationId);
    assert.equal(staticEvidence.animationId, animationId);
    assert.equal(records.swfmill.sha256,
      staticEvidence.generatedFrom.swfmillStructure.sha256);
    assert.equal(records.ffdec.sha256,
      staticEvidence.generatedFrom.ffdecScripts.sha256);
    const swfmillXml = gunzipSync(records.swfmill.bytes).toString("utf8");
    const ffdecText = gunzipSync(records.ffdec.bytes).toString("utf8");
    assert.equal(sha256(Buffer.from(swfmillXml, "utf8")),
      staticEvidence.generatedFrom.swfmillStructure.uncompressedSha256);
    assert.equal(sha256(Buffer.from(ffdecText, "utf8")),
      staticEvidence.generatedFrom.ffdecScripts.uncompressedSha256);
    const structure = parseSwfmillDispositionStructure(swfmillXml);
    const scripts = parseFfdecDispositionScripts(ffdecText);
    const audit = deriveMultiFrameScriptlessCandidateAudit({
      animationId,
      structure,
      scripts,
      inventory,
      manifest,
    });
    const clusterId = clusterFor(animationId);
    const timelineIds = pairs.map(({timelineId}) => timelineId)
      .sort(compareTimelineIds);
    const inspectionByTimelineId = new Map(audit.inspections.map((inspection) =>
      [inspection.timelineId, inspection]));
    const parentPaths = new Map();
    const parentContracts = new Map();
    const candidateTimelines = [];
    for (const timelineId of timelineIds) {
      const label = `${animationId}/${timelineId}`;
      const inspection = inspectionByTimelineId.get(timelineId);
      assert.ok(inspection, `${label}: generic candidate inspection is absent`);
      assert.equal(inspection.eligible, false, `${label}: unexpectedly generic-eligible`);
      assert.deepEqual(inspection.disqualifiers, [
        "dynamic-movieclip-addressing-present",
        "declared-parent-does-not-have-one-direct-root-placement",
      ], `${label}: exact generic disqualifier set drifted`);
      assert.equal(inspection.namedIncomingInstances.length, 0,
        `${label}: target child has a named incoming instance`);
      assert.equal(inspection.ffdecFrameScriptCount, 0,
        `${label}: target child has an FFDec frame script`);
      assert.equal(inspection.attributedDoInitActionCount, 0,
        `${label}: target child has a DoInitAction`);
      assert.ok(inspection.internalDisplayEventCount > 0,
        `${label}: target child internal display graph is empty`);
      assert.ok(inspection.placements.length > 0,
        `${label}: target child has no serializable lifetime`);
      const currentRows = disposition.timelines.filter(({timelineId: value}) =>
        value === timelineId);
      assert.equal(currentRows.length, 1,
        `${label}: current disposition row is missing or duplicated`);
      assert.equal(currentRows[0].disposition, "unresolved",
        `${label}: current disposition is no longer unresolved`);
      if (!parentPaths.has(inspection.parentTimelineId)) {
        parentPaths.set(inspection.parentTimelineId,
          exactFreshNamedRootPath(structure, inspection.parentTimelineId,
            `${animationId}/${inspection.parentTimelineId}`));
      }
      const parentRootPath = parentPaths.get(inspection.parentTimelineId);
      if (!parentContracts.has(inspection.parentTimelineId)) {
        parentContracts.set(inspection.parentTimelineId,
          parentDomainContract(manifest, inspection, parentRootPath, label));
      }
      assert.equal(structure.timelines.get(timelineId)?.tagCounts.DoAction || 0, 0,
        `${label}: target timeline contains DoAction`);
      assert.equal(structure.timelines.get(timelineId)?.tagCounts.DoInitAction || 0, 0,
        `${label}: target timeline contains DoInitAction`);
      candidateTimelines.push({
        animationId,
        timelineId,
        sourceObjectId: inspection.sourceObjectId,
        frameCount: inspection.frameCount,
        parentTimelineId: inspection.parentTimelineId,
        parentSourceObjectId: inspection.parentSourceObjectId,
        parentFrameCount: inspection.parentFrameCount,
        parentFrameDomainId: inspection.parentFrameDomainId,
        currentDisposition: "unresolved",
        proposedProofRole: "multi-frame-scriptless-child-parent-clock",
        targetIncomingInstanceNames: [],
        directDoActionTagCount: 0,
        directDoInitActionTagCount: 0,
        ffdecFrameScriptCount: 0,
        attributedDoInitActionCount: 0,
        internalDisplayEventCount: inspection.internalDisplayEventCount,
        expectedTagCensus: inspection.expectedTagCensus,
        placements: inspection.placements,
        genericDisqualifiersRetained: inspection.disqualifiers,
        parentEntryStateEstablished: false,
        dispositionChangedByThisReport: false,
      });
    }
    const parentInstanceNames = [...new Set([...parentPaths.values()]
      .flat().map(({instanceName}) => instanceName))].sort(compareText);
    const dynamicReferences = audit.globalAudit.dynamicAddressingReferences.map(
      (reference) => {
        const block = scriptBlockForReference(scripts, reference);
        const classification = classifyDynamicReference(reference,
          parentInstanceNames);
        const record = {
          animationId,
          script: reference.script,
          scriptScope: block.scope,
          scriptBodySha256: block.bodySha256,
          scriptLineStart: block.lineStart,
          scriptLineEnd: block.lineEnd,
          line: reference.line,
          sourceLine: reference.sourceLine,
          ...classification,
          targetChildInstanceNameCount: 0,
          directTargetChildControlEstablished: false,
        };
        allReferences.push(record);
        return record;
      });
    assert.ok(dynamicReferences.length > 0,
      `${animationId}: expected at least one dynamic reference`);
    if (clusterId === "ti002-named-parent-and-peer-control") {
      assert.ok(dynamicReferences.some(({mayAddressDeclaredParent}) =>
        mayAddressDeclaredParent),
      `${animationId}: TI002 must retain named parent playhead control`);
    } else {
      assert.ok(dynamicReferences.every(({mayAddressDeclaredParent}) =>
        !mayAddressDeclaredParent),
      `${animationId}: property-only cluster unexpectedly addresses a parent`);
      assert.ok(dynamicReferences.every(({directPlayheadMutation}) =>
        !directPlayheadMutation),
      `${animationId}: property-only cluster unexpectedly mutates a playhead`);
    }
    memberResults.push({
      animationId,
      ordinal: Math.min(...pairs.map(({ordinal}) => ordinal)),
      assetId: manifest.assetId,
      sourceSwfSha256: manifest.source.swfSha256,
      clusterId,
      exactPairSet: pairSet(pairs),
      inputBindings: Object.fromEntries(Object.entries(records).map(
        ([key, record]) => [key, binding(record)])),
      globalDoInitActionSpriteObjectIds:
        audit.globalAudit.globalDoInitActionSpriteObjectIds,
      parentRootPaths: [...parentPaths.entries()].sort(([left], [right]) =>
        compareTimelineIds(left, right)).map(([parentTimelineId, rootPath]) => ({
        parentTimelineId,
        rootPath,
        declaredParentDomain: parentContracts.get(parentTimelineId),
      })),
      dynamicReferenceSet: dynamicReferenceSet(dynamicReferences),
      dynamicReferences,
      candidateTimelines,
      proofBoundary: {
        directDynamicControlOfUnnamedTargetChildrenFound: false,
        targetChildDepthLookupApiFound: false,
        targetChildAttachDuplicateOrCreateApiFound: false,
        namedParentOrPeerPlayheadControlRetained:
          dynamicReferences.some(({directPlayheadMutation}) =>
            directPlayheadMutation),
        parentEntryStateEstablished: false,
        authoritativeRuntimeEntryEstablished: false,
        currentDispositionChanged: false,
      },
    });
  }

  const allCandidateTimelines = memberResults.flatMap(({candidateTimelines}) =>
    candidateTimelines);
  assert.deepEqual(pairSet(allCandidateTimelines), EXACT_PAIR_SET);
  const clusterSummaries = Object.entries(CLUSTERS).map(([id, expected]) => {
    const members = memberResults.filter(({clusterId}) => clusterId === id);
    const timelines = members.flatMap(({candidateTimelines}) => candidateTimelines);
    assert.equal(members.length, expected.expectedMemberCount,
      `${id}: member count drifted`);
    assert.equal(timelines.length, expected.expectedPairCount,
      `${id}: pair count drifted`);
    assert.deepEqual(members.map(({animationId}) => animationId).sort(compareText),
      [...expected.members].sort(compareText), `${id}: member set drifted`);
    return {
      id,
      memberCount: members.length,
      pairSet: pairSet(timelines),
      localFrameCount: timelines.reduce((total, {frameCount}) =>
        total + frameCount, 0),
      dynamicReferenceSet: dynamicReferenceSet(members.flatMap(
        ({dynamicReferences}) => dynamicReferences)),
      directTargetChildControlFound: false,
      parentEntryStateEstablished: false,
      currentDispositionChanged: false,
    };
  });
  assert.equal(allCandidateTimelines.reduce((total, {frameCount}) =>
    total + frameCount, 0), 457);
  assert.equal(new Set(allCandidateTimelines.map(({animationId}) =>
    animationId)).size, 11);
  assert.ok(allReferences.every(({directTargetChildControlEstablished}) =>
    directTargetChildControlEstablished === false));
  assert.ok(allReferences.every(({operationClass}) => ![
    "depth-lookup",
    "dynamic-attach",
    "dynamic-duplicate",
    "dynamic-create",
  ].includes(operationClass)));

  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const workspaceInputSet = {
    fileCount: allWorkspaceRecords.length,
    memberCount: memberResults.length,
    sha256: inputSetSha256(allWorkspaceRecords),
    encoding: "path-null-bytes-null-sha256-null-mode-newline-v1",
  };
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-dynamic-indirect-parent-target-control-proof-candidate-v1",
    status:
      "all-21-target-control-candidates-frozen-current-dispositions-unresolved",
    decision:
      "FREEZE_21_AS_SOURCE_CONTROL_PROOF_CANDIDATES_KEEP_ALL_21_UNRESOLVED",
    purpose: [
      "Determine whether the generic SWF-wide dynamic-addressing blocker directly controls any of the exact 21 unnamed target child playheads.",
      "Freeze the exact script, parent-path, declared-parent-domain, target-lifetime, and no-authority facts needed by a later disposition successor without performing that successor here.",
    ],
    fixedEvidenceInputs: Object.fromEntries(Object.entries(fixedRecords).map(
      ([key, record]) => [key, binding(record)])),
    workspaceInputSet,
    exactCandidatePairSet: pairSet(allCandidateTimelines),
    scope: {
      affectedMembers: memberResults.length,
      exactPairs: allCandidateTimelines.length,
      exactLocalFrames: allCandidateTimelines.reduce((total, {frameCount}) =>
        total + frameCount, 0),
      parentDomainCount: memberResults.reduce((total, {parentRootPaths}) =>
        total + parentRootPaths.length, 0),
      dynamicReferenceCount: allReferences.length,
      dynamicReferenceSet: dynamicReferenceSet(allReferences),
    },
    clusterSummaries,
    members: memberResults.sort((left, right) =>
      left.ordinal - right.ordinal || compareText(left.animationId, right.animationId)),
    sourceControlConclusion: {
      directDynamicControlOfTargetChildPlayheadFound: false,
      reason: [
        "Every selected target source object is placed only through unnamed incoming placements, has zero direct DoAction/DoInitAction and zero FFDec frame scripts, and exposes no target instance name to the observed ActionScript.",
        "Every SWF-wide dynamic reference matches one exact reviewed operation family. No getInstanceAtDepth, attachMovie, duplicateMovieClip, createEmptyMovieClip, setProperty, getProperty, or targetPath operation is admitted by this candidate.",
        "VB/IN references write only Mc_Wrong_Feed<i>.Mc_Feed_Popup.txtFeed.html; TI003-TI005 references write only rect<row><column>._visible.",
        "TI002 can reset named Mc_Right_Feed<i>/Mc_Wrong_Feed<i> clips and mutate named drag/drop peers. Named Mc_Right_Feed controls may address a selected declared parent, so parent entry/control remains unresolved; this does not establish direct control of the unnamed child playhead.",
      ],
      candidateMeaning:
        "The exact 21 pairs are eligible inputs to a separate hash-bound source-control disposition successor that may test the child-parent-clock claim while preserving unresolved parent entry. This report does not itself change any disposition.",
      currentDispositionForAllPairs: "unresolved",
      canonicalDispositionChangedByThisReport: false,
      parentEntryStateEstablished: false,
      authoritativeRuntimeEvidenceCreated: false,
    },
    residualBoundary: {
      predecessorResidualPairs: triage.reconciliation.currentResidual,
      selectedCandidatePairs: pairSet(allCandidateTimelines),
      selectedPairsRemovedFromResidualByThisReport: 0,
      currentRawResidualCountBefore: 70,
      currentRawResidualCountAfter: 70,
      formalRequirementProjectionResidualCount: 74,
      downstreamTransactionModesStillProhibited:
        triage.formalProjectionBoundary.prohibitedTransactionModes,
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      canonicalWorkspaceWriteSupported: false,
      dispositionSuccessorSupported: false,
      applySupported: false,
      recoverSupported: false,
      rollbackSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 report; never write a migration workspace, disposition, coverage artifact, source asset, helper, or runtime artifact`,
    authorityEffects,
    nextPermittedAction:
      "Independently review this exact candidate and, if it remains valid, create a separate no-clobber disposition successor for these exact 21 pairs. That successor must preserve every declared parent-entry/runtime/audio/human/owner obligation and must not execute the prohibited 114-output transaction.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const candidateFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, candidateFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildCandidate(bundle.root);
  assert.equal(current.json, bundle.json,
    "G4 L10 dynamic-indirect-parent candidate inputs changed after derivation");
}

export async function checkCandidate(bundle, outputRoot = bundle.root) {
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
    "G4 L10 dynamic-indirect-parent candidate report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    candidateFingerprintSha256: bundle.document.candidateFingerprintSha256,
    exactPairs: bundle.document.scope.exactPairs,
    dynamicReferenceCount: bundle.document.scope.dynamicReferenceCount,
    currentResidualCount: bundle.document.residualBoundary.currentRawResidualCountAfter,
    originalRuntimeLaunched: false,
    dispositionChanged: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

export async function publishCandidateNoClobber(bundle, options = {}) {
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
  return checkCandidate(bundle, outputRoot);
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
  const bundle = await buildCandidate(projectRoot);
  if (mode === "--write-no-clobber") return publishCandidateNoClobber(bundle);
  if (mode === "--check") return checkCandidate(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    candidateFingerprintSha256: bundle.document.candidateFingerprintSha256,
    exactPairs: bundle.document.scope.exactPairs,
    dynamicReferenceCount: bundle.document.scope.dynamicReferenceCount,
    currentResidualCount: bundle.document.residualBoundary.currentRawResidualCountAfter,
    originalRuntimeLaunched: false,
    dispositionChanged: false,
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
