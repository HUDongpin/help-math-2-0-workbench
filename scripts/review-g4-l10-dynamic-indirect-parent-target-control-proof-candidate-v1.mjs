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

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-dynamic-indirect-parent-target-control-proof-candidate-independent-review-v1.json";
const CANDIDATE = Object.freeze({
  path: "reports/g4-l10-dynamic-indirect-parent-target-control-proof-candidate-v1.json",
  bytes: 131123,
  sha256: "ea5aea5bcffa1e4d2b3a1d64eb82158cc3238fa972e4380b0a16dfe5203a242d",
  mode: "0444",
});
const EXPECTED_PAIR_SET = Object.freeze({
  count: 21,
  sha256: "196f722ab861926b7c9ac1b9603ed08e588296bd518e224def74f9c08f90796e",
  encoding: "sorted-animationId-tab-timelineId-newline-v1",
});
const EXPECTED_REFERENCE_SET = Object.freeze({
  count: 36,
  sha256: "a96b5e0346721bd29f5cf2c797007630c0211c2eaeaa97fae424ea8b04b340b7",
  encoding:
    "sorted-animationId-script-line-scriptBodySha256-sourceLine-operationClass-newline-v1",
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "canonicalWorkspaceMutation",
  "frameDomainDispositionChange",
  "coverageRegeneration",
  "traceRegeneration",
  "keyframeRegeneration",
  "runtimePlanRegeneration",
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
  return [info.dev, info.ino, info.mode, info.nlink, info.uid, info.gid,
    info.size, info.mtimeNs, info.ctimeNs].map(String).join(":");
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
  const record = {path: expected.path, bytes, byteCount: bytes.length,
    sha256: sha256(bytes), mode: modeString(before)};
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
  return {path: record.path, bytes: record.byteCount,
    sha256: record.sha256, mode: record.mode};
}

function pairKey(pair) {
  return `${pair.animationId}\t${pair.timelineId}`;
}

function exactSet(rows, serializer, encoding) {
  const values = rows.map(serializer).sort(compareText);
  assert.equal(new Set(values).size, values.length,
    `${encoding}: duplicate rows`);
  return {
    count: values.length,
    sha256: sha256(Buffer.from(values.map((value) => `${value}\n`).join(""),
      "utf8")),
    encoding,
  };
}

function pairSet(rows) {
  return exactSet(rows, pairKey,
    "sorted-animationId-tab-timelineId-newline-v1");
}

function referenceSet(rows) {
  return exactSet(rows, (reference) => [
    reference.animationId,
    reference.script,
    reference.line,
    reference.scriptBodySha256,
    reference.sourceLine,
    reference.operationClass,
  ].join("\t"), EXPECTED_REFERENCE_SET.encoding);
}

function parseAttributes(raw) {
  const attributes = {};
  for (const match of raw.matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g)) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function nearestPlacement(stack) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].placement) return stack[index].placement;
  }
  return null;
}

function directTimeline(stack) {
  const tags = stack.at(-1);
  const owner = stack.at(-2);
  return tags?.name === "tags"
    && (owner?.name === "Header" || owner?.name === "DefineSprite")
    ? owner.timeline : null;
}

function independentlyParseSwfmill(xml) {
  const stack = [];
  const timelines = new Map();
  const initActions = [];
  const tokens = /<\/?([A-Za-z_][\w:.-]*)([^>]*)>/g;
  for (const match of xml.matchAll(tokens)) {
    const raw = match[0];
    if (raw.startsWith("<?") || raw.startsWith("<!")) continue;
    const name = match[1];
    if (raw.startsWith("</")) {
      const node = stack.pop();
      assert.equal(node?.name, name, "Independent swfmill parser nesting mismatch");
      continue;
    }
    const attributes = parseAttributes(match[2]);
    const selfClosing = /\/\s*>$/u.test(raw);
    const timeline = directTimeline(stack);
    const node = {name};
    if (name === "Header" || name === "DefineSprite") {
      const objectId = name === "Header" ? null : String(attributes.objectID ?? "");
      const timelineId = name === "Header" ? "root" : `sprite-${objectId}`;
      const record = {
        timelineId,
        objectId,
        declaredFrames: Number.parseInt(attributes.frames, 10),
        currentFrame: 1,
        observedShowFrames: 0,
        tagCounts: {},
        placements: [],
      };
      assert.ok(Number.isInteger(record.declaredFrames)
        && record.declaredFrames > 0, `${timelineId}: invalid frame count`);
      assert.equal(timelines.has(timelineId), false,
        `${timelineId}: duplicate timeline`);
      timelines.set(timelineId, record);
      node.timeline = record;
    }
    if (timeline) {
      timeline.tagCounts[name] = (timeline.tagCounts[name] || 0) + 1;
      if (name === "ShowFrame") {
        timeline.observedShowFrames += 1;
        timeline.currentFrame += 1;
      } else if (["PlaceObject", "PlaceObject2", "PlaceObject3"].includes(name)) {
        const placement = {
          tag: name,
          frame: timeline.currentFrame,
          depth: String(attributes.depth ?? ""),
          objectId: attributes.objectID === undefined
            ? null : String(attributes.objectID),
          name: attributes.name || "",
          replace: attributes.replace || "",
          hasClipActions: false,
        };
        timeline.placements.push(placement);
        node.placement = placement;
      }
    }
    if (name === "DoInitAction") {
      initActions.push({spriteObjectId:
        String(attributes.sprite ?? attributes.objectID ?? "")});
    }
    if (name === "clipActions" || name === "ClipActions") {
      const placement = nearestPlacement(stack);
      if (placement) placement.hasClipActions = true;
    }
    if (!selfClosing) stack.push(node);
  }
  assert.equal(stack.length, 0, "Independent swfmill parser has unclosed nodes");
  return {timelines, initActions};
}

function independentlyParseFfdec(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^===== (.+) =====$/u);
    if (match) headings.push({index, script: match[1]});
  }
  const blocks = headings.map((heading, position) => {
    const end = headings[position + 1]?.index ?? lines.length;
    const bodyLines = lines.slice(heading.index + 1, end);
    while (bodyLines[0] === "") bodyLines.shift();
    while (bodyLines.at(-1) === "") bodyLines.pop();
    const firstBodyLine = lines.findIndex((line, index) =>
      index > heading.index && index < end && line !== "");
    const sprite = heading.script.match(
      /^DefineSprite_(\d+)(?:_[^/]*)?\/frame_(\d+)\/([^/]+\.as)$/u);
    return {
      script: heading.script,
      scope: sprite ? {kind: "sprite", objectId: sprite[1],
        frame: Number(sprite[2]), actionFile: sprite[3]} : {kind: "other"},
      body: bodyLines.join("\n"),
      bodySha256: sha256(bodyLines.join("\n")),
      lineStart: firstBodyLine >= 0 ? firstBodyLine + 1 : heading.index + 2,
      lineEnd: Math.max(firstBodyLine >= 0
        ? firstBodyLine + 1 : heading.index + 2, end),
    };
  });
  const dynamicPattern = /\b(?:eval|getInstanceAtDepth|attachMovie|duplicateMovieClip|createEmptyMovieClip|removeMovieClip|setProperty|getProperty|targetPath)\s*\(|(?:this|_root|_parent|_global|_level\d+)\s*\[/u;
  const references = [];
  for (const block of blocks) {
    for (const [index, line] of block.body.split("\n").entries()) {
      if (!dynamicPattern.test(line)) continue;
      references.push({
        script: block.script,
        scriptScope: block.scope,
        scriptBodySha256: block.bodySha256,
        scriptLineStart: block.lineStart,
        scriptLineEnd: block.lineEnd,
        line: block.lineStart + index,
        sourceLine: line.trim(),
      });
    }
  }
  return {blocks, references};
}

function independentOperationClass(sourceLine, parentInstanceNames) {
  if (sourceLine ===
      'eval("Mc_Wrong_Feed" + i).Mc_Feed_Popup.txtFeed.html = true;') {
    return {operationClass: "named-peer-property-write",
      directPlayheadMutation: false, mayAddressDeclaredParent: false};
  }
  if (sourceLine ===
      'eval("rect" + parseInt(arr1[0]) + parseInt(arr1[1]))._visible = true;') {
    return {operationClass: "named-rect-property-write",
      directPlayheadMutation: false, mayAddressDeclaredParent: false};
  }
  if (sourceLine === "removeMovieClip(_parent.Mc_SwapDepth);") {
    return {operationClass: "named-peer-lifecycle-operation",
      directPlayheadMutation: false, mayAddressDeclaredParent: false};
  }
  if (sourceLine ===
      'eval("_root.animation_mc.animation.Mc_Right_Feed" + i).gotoAndStop(1);') {
    return {operationClass: "named-parent-or-peer-playhead-control",
      directPlayheadMutation: true,
      mayAddressDeclaredParent: parentInstanceNames.some((name) =>
        /^Mc_Right_Feed\d+$/u.test(name))};
  }
  if (sourceLine ===
      'eval("_root.animation_mc.animation.Mc_Wrong_Feed" + i).gotoAndStop(1);') {
    return {operationClass: "named-peer-playhead-control",
      directPlayheadMutation: true, mayAddressDeclaredParent: false};
  }
  if (sourceLine ===
      'if(eval(this._droptarget) == _parent["Mc_Tar_" + tempSplSrc[tempSplSrc.length - 1]])') {
    return {operationClass: "drop-target-identity-comparison",
      directPlayheadMutation: false, mayAddressDeclaredParent: false};
  }
  if (sourceLine ===
      '_parent["Mc_Tar_" + tempSplSrc[tempSplSrc.length - 1]]._alpha = 100;') {
    return {operationClass: "named-drop-target-property-write",
      directPlayheadMutation: false, mayAddressDeclaredParent: false};
  }
  assert.fail(`Independent reviewer found an unclassified dynamic line: ${sourceLine}`);
}

function normalizedTagCensus(tagCounts) {
  return Object.fromEntries(Object.entries(tagCounts)
    .sort(([left], [right]) => compareText(left, right)));
}

function exactFreshNamedRootPath(structure, targetTimelineId, label) {
  const reverse = [];
  const visited = new Set();
  let childTimelineId = targetTimelineId;
  while (childTimelineId !== "root") {
    assert.equal(visited.has(childTimelineId), false,
      `${label}: cycle in placement graph`);
    visited.add(childTimelineId);
    const child = structure.timelines.get(childTimelineId);
    assert.ok(child?.objectId, `${label}: child object identity absent`);
    const incoming = [];
    for (const parent of structure.timelines.values()) {
      for (const placement of parent.placements) {
        if (placement.objectId === child.objectId) incoming.push({parent, placement});
      }
    }
    assert.equal(incoming.length, 1,
      `${label}: root-path child does not have one explicit incoming placement`);
    const [{parent, placement}] = incoming;
    assert.equal(placement.tag, "PlaceObject2");
    assert.equal(placement.replace, "0");
    assert.ok(placement.name.length > 0);
    assert.equal(placement.hasClipActions, false);
    reverse.push({
      parentTimelineId: parent.timelineId,
      childTimelineId,
      sourceObjectId: child.objectId,
      frame: placement.frame,
      depth: placement.depth,
      instanceName: placement.name,
      tag: placement.tag,
      replace: placement.replace,
      hasClipActions: false,
    });
    childTimelineId = parent.timelineId;
  }
  const rootPath = reverse.reverse();
  assert.ok(rootPath.length >= 2, `${label}: root path is not indirect`);
  return rootPath;
}

function inputSetSha256(records) {
  const lines = [...records].sort((left, right) =>
    compareText(left.path, right.path)).map((record) =>
    `${record.path}\0${record.byteCount}\0${record.sha256}\0${record.mode}\n`);
  return sha256(Buffer.from(lines.join(""), "utf8"));
}

export async function buildIndependentReview(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const candidateRecord = await stableRead(root, CANDIDATE);
  const candidate = JSON.parse(candidateRecord.bytes.toString("utf8"));
  assert.equal(candidate.status,
    "all-21-target-control-candidates-frozen-current-dispositions-unresolved");
  assert.equal(candidate.decision,
    "FREEZE_21_AS_SOURCE_CONTROL_PROOF_CANDIDATES_KEEP_ALL_21_UNRESOLVED");
  assert.deepEqual(candidate.exactCandidatePairSet, EXPECTED_PAIR_SET);
  assert.deepEqual(candidate.scope.dynamicReferenceSet, EXPECTED_REFERENCE_SET);
  assert.equal(candidate.members.length, 11);
  assert.ok(Object.values(candidate.authorityEffects).every((value) =>
    value === false));

  const rawRecords = [];
  const independentlyObservedPairs = [];
  const independentlyObservedReferences = [];
  const memberReviews = [];
  for (const member of candidate.members) {
    const records = {};
    for (const [key, expected] of Object.entries(member.inputBindings)) {
      records[key] = await stableRead(root, expected);
      assert.deepEqual(binding(records[key]), expected,
        `${member.animationId}/${key}: candidate input binding drifted`);
    }
    rawRecords.push(...Object.values(records));
    const manifest = JSON.parse(records.manifest.bytes.toString("utf8"));
    const disposition = JSON.parse(records.disposition.bytes.toString("utf8"));
    const staticEvidence = JSON.parse(records.staticEvidence.bytes.toString("utf8"));
    const swfmillXml = gunzipSync(records.swfmill.bytes).toString("utf8");
    const ffdecText = gunzipSync(records.ffdec.bytes).toString("utf8");
    assert.equal(sha256(Buffer.from(swfmillXml, "utf8")),
      staticEvidence.generatedFrom.swfmillStructure.uncompressedSha256);
    assert.equal(sha256(Buffer.from(ffdecText, "utf8")),
      staticEvidence.generatedFrom.ffdecScripts.uncompressedSha256);
    const structure = independentlyParseSwfmill(swfmillXml);
    const ffdec = independentlyParseFfdec(ffdecText);
    const parentPaths = new Map(member.parentRootPaths.map((item) =>
      [item.parentTimelineId, item]));
    const parentInstanceNames = member.parentRootPaths.flatMap(({rootPath}) =>
      rootPath.map(({instanceName}) => instanceName));
    const observedReferences = ffdec.references.map((reference) => {
      const classification = independentOperationClass(reference.sourceLine,
        parentInstanceNames);
      return {animationId: member.animationId, ...reference, ...classification};
    });
    const candidateReferenceProjection = member.dynamicReferences.map((reference) => ({
      animationId: reference.animationId,
      script: reference.script,
      scriptScope: reference.scriptScope,
      scriptBodySha256: reference.scriptBodySha256,
      scriptLineStart: reference.scriptLineStart,
      scriptLineEnd: reference.scriptLineEnd,
      line: reference.line,
      sourceLine: reference.sourceLine,
      operationClass: reference.operationClass,
      directPlayheadMutation: reference.directPlayheadMutation,
      mayAddressDeclaredParent: reference.mayAddressDeclaredParent,
    }));
    assert.deepEqual(observedReferences, candidateReferenceProjection,
      `${member.animationId}: independent FFDec dynamic-reference result differs`);
    independentlyObservedReferences.push(...observedReferences);

    const timelineReviews = [];
    for (const target of member.candidateTimelines) {
      const label = `${member.animationId}/${target.timelineId}`;
      independentlyObservedPairs.push({animationId: member.animationId,
        timelineId: target.timelineId});
      const timeline = structure.timelines.get(target.timelineId);
      assert.ok(timeline, `${label}: target timeline missing`);
      assert.equal(timeline.objectId, target.sourceObjectId,
        `${label}: target object identity differs`);
      assert.equal(timeline.declaredFrames, target.frameCount,
        `${label}: target frame count differs`);
      assert.equal(timeline.observedShowFrames, target.frameCount,
        `${label}: target ShowFrame count differs`);
      assert.deepEqual(normalizedTagCensus(timeline.tagCounts),
        target.expectedTagCensus, `${label}: tag census differs`);
      assert.equal(timeline.tagCounts.DoAction || 0, 0,
        `${label}: direct DoAction found`);
      assert.equal(timeline.tagCounts.DoInitAction || 0, 0,
        `${label}: direct DoInitAction found`);
      assert.equal(structure.initActions.filter(({spriteObjectId}) =>
        spriteObjectId === target.sourceObjectId).length, 0,
      `${label}: attributed DoInitAction found`);
      assert.equal(ffdec.blocks.filter(({scope}) =>
        scope.kind === "sprite" && scope.objectId === target.sourceObjectId).length,
      0, `${label}: FFDec target frame script found`);
      const incoming = [];
      for (const parent of structure.timelines.values()) {
        for (const placement of parent.placements) {
          if (placement.objectId === target.sourceObjectId) {
            incoming.push({parentTimelineId: parent.timelineId, ...placement});
          }
        }
      }
      assert.equal(incoming.length, target.placements.length,
        `${label}: explicit incoming placement count differs`);
      assert.ok(incoming.length > 0, `${label}: no incoming placement`);
      assert.ok(incoming.every(({parentTimelineId, name, tag, replace,
        hasClipActions}) => parentTimelineId === target.parentTimelineId
          && name === "" && tag === "PlaceObject2" && replace === "0"
          && hasClipActions === false),
      `${label}: incoming placement is not unnamed, fresh, and clip-action free`);
      const parentPathRecord = parentPaths.get(target.parentTimelineId);
      assert.ok(parentPathRecord, `${label}: candidate parent path missing`);
      const independentParentPath = exactFreshNamedRootPath(structure,
        target.parentTimelineId, label);
      assert.deepEqual(independentParentPath, parentPathRecord.rootPath,
        `${label}: independent parent root path differs`);
      const domains = (manifest.implementation?.frameDomains || []).filter(
        ({sourceTimelineId}) => sourceTimelineId === target.parentTimelineId);
      assert.equal(domains.length, 1, `${label}: declared parent domain differs`);
      const [domain] = domains;
      assert.equal(domain.id, target.parentFrameDomainId);
      assert.equal(domain.kind, "nested");
      assert.equal(domain.frameCount, target.parentFrameCount);
      assert.deepEqual(domain.sourceParentTimelineIds,
        [independentParentPath.at(-1).parentTimelineId]);
      assert.ok(domain.captureParentResolution.includes(
        "parentEntryState remains unresolved"));
      assert.equal(domain.sourceProof?.authoritativeRuntimeEntryEstablished,
        false);
      assert.equal(domain.sourceProof?.strictAcceptanceEffect, "none");
      const dispositionRows = disposition.timelines.filter(({timelineId}) =>
        timelineId === target.timelineId);
      assert.equal(dispositionRows.length, 1,
        `${label}: disposition row missing or duplicated`);
      assert.equal(dispositionRows[0].disposition, "unresolved",
        `${label}: disposition is no longer unresolved`);
      timelineReviews.push({
        timelineId: target.timelineId,
        sourceObjectId: target.sourceObjectId,
        frameCount: target.frameCount,
        incomingPlacementCount: incoming.length,
        incomingInstancesAllUnnamed: true,
        directDoActionCount: 0,
        directDoInitActionCount: 0,
        ffdecTargetFrameScriptCount: 0,
        parentTimelineId: target.parentTimelineId,
        parentRootPath: independentParentPath,
        parentEntryStateEstablished: false,
        currentDisposition: "unresolved",
      });
    }
    assert.deepEqual(pairSet(timelineReviews.map(({timelineId}) => ({
      animationId: member.animationId, timelineId,
    }))), member.exactPairSet,
    `${member.animationId}: independently reviewed pair set differs`);
    memberReviews.push({
      animationId: member.animationId,
      clusterId: member.clusterId,
      inputSetSha256: inputSetSha256(Object.values(records)),
      pairSet: member.exactPairSet,
      dynamicReferenceSet: referenceSet(observedReferences),
      dynamicReferenceCount: observedReferences.length,
      targetTimelineCount: timelineReviews.length,
      targetTimelines: timelineReviews,
      directTargetChildControlFound: false,
      parentEntryStateEstablished: false,
      currentDispositionChanged: false,
    });
  }
  assert.deepEqual(pairSet(independentlyObservedPairs), EXPECTED_PAIR_SET);
  assert.deepEqual(referenceSet(independentlyObservedReferences),
    EXPECTED_REFERENCE_SET);
  assert.equal(memberReviews.reduce((total, {targetTimelineCount}) =>
    total + targetTimelineCount, 0), 21);
  assert.equal(memberReviews.reduce((total, {dynamicReferenceCount}) =>
    total + dynamicReferenceCount, 0), 36);
  assert.ok(independentlyObservedReferences.every(({operationClass}) => [
    "named-peer-property-write",
    "named-rect-property-write",
    "named-peer-lifecycle-operation",
    "named-parent-or-peer-playhead-control",
    "named-peer-playhead-control",
    "drop-target-identity-comparison",
    "named-drop-target-property-write",
  ].includes(operationClass)));

  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-dynamic-indirect-parent-target-control-proof-candidate-independent-review-v1",
    status: "PASS_READ_ONLY_INDEPENDENT_REPARSE_NO_DISPOSITION_AUTHORITY",
    decision: "CANDIDATE_ACCURATE_FOR_PLAN_ONLY_SUCCESSOR_INPUT",
    reviewMethod: {
      importsCandidateGenerator: false,
      importsDispositionProofEngine: false,
      independentlyParsedFfdec: true,
      independentlyParsedSwfmill: true,
      independentlyRecomputedScriptBlockHashes: true,
      independentlyRecomputedDynamicReferences: true,
      independentlyRecomputedTargetPlacementsAndTagCensus: true,
      independentlyRecomputedParentRootPaths: true,
      independentlyCheckedManifestParentDomains: true,
      independentlyCheckedCurrentDispositions: true,
    },
    candidate: binding(candidateRecord),
    reviewedInputSet: {
      fileCount: rawRecords.length,
      memberCount: memberReviews.length,
      sha256: inputSetSha256(rawRecords),
      encoding: "path-null-bytes-null-sha256-null-mode-newline-v1",
    },
    findings: {P0: 0, P1: 0, P2: 0, total: 0},
    exactPairSet: pairSet(independentlyObservedPairs),
    exactDynamicReferenceSet: referenceSet(independentlyObservedReferences),
    scope: {
      members: memberReviews.length,
      targetPairs: independentlyObservedPairs.length,
      dynamicReferences: independentlyObservedReferences.length,
      currentRawResidualCount: 70,
      projectedResidualCountNotApplied: 49,
    },
    memberReviews,
    conclusion: {
      candidateInternalAndRawSourceBindingsAccurate: true,
      directDynamicControlOfUnnamedTargetChildPlayheadFound: false,
      namedParentOrPeerControlStillRequiresUnresolvedParentEntryBoundary: true,
      all21CurrentDispositionsRemainUnresolved: true,
      reportMayFeedPlanOnlySuccessor: true,
      reportMayFeedWorkspaceMutation: false,
      originalRuntimeEvidenceEstablished: false,
      acceptanceEstablished: false,
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      workspaceMutationSupported: false,
      successorApplicationSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 review report; never write a migration workspace, disposition, source asset, helper, or runtime artifact`,
    authorityEffects,
    nextPermittedAction:
      "Freeze a separate exact-preimage, plan-only disposition successor for the exact 21 reviewed pairs. Do not apply it to the 11 untracked migration directories without explicit ownership/edit authorization and a separate no-clobber transaction review.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const reviewFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, reviewFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildIndependentReview(bundle.root);
  assert.equal(current.json, bundle.json,
    "Independent review inputs changed after derivation");
}

export async function checkIndependentReview(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, {path: REPORT_RELATIVE,
    bytes: expected.length, sha256: sha256(expected), mode: "0444"});
  assert.deepEqual(observed.bytes, expected,
    "Independent review report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    reviewFingerprintSha256: bundle.document.reviewFingerprintSha256,
    findings: bundle.document.findings,
    targetPairs: bundle.document.scope.targetPairs,
    dynamicReferences: bundle.document.scope.dynamicReferences,
    currentRawResidualCount: bundle.document.scope.currentRawResidualCount,
    originalRuntimeLaunched: false,
    dispositionChanged: false,
    applySupported: false,
  };
}

export async function publishIndependentReviewNoClobber(bundle, options = {}) {
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
  return checkIndependentReview(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(argv);
  const bundle = await buildIndependentReview(projectRoot);
  if (mode === "--write-no-clobber") {
    return publishIndependentReviewNoClobber(bundle);
  }
  if (mode === "--check") return checkIndependentReview(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reviewFingerprintSha256: bundle.document.reviewFingerprintSha256,
    findings: bundle.document.findings,
    targetPairs: bundle.document.scope.targetPairs,
    dynamicReferences: bundle.document.scope.dynamicReferences,
    currentRawResidualCount: bundle.document.scope.currentRawResidualCount,
    originalRuntimeLaunched: false,
    dispositionChanged: false,
    applySupported: false,
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
