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
  "reports/g4-l10-scripted-one-frame-control-triage-v1.json";

const EXACT_PAIR_SET = Object.freeze({
  count: 41,
  sha256: "0dc88548e9669900cbee9e07f79f701234d6fd3eb7d59154f0678046b3c29f68",
  encoding: "sorted-animationId-tab-timelineId-newline-v1",
});

const FIXED_INPUTS = Object.freeze({
  residualTriage: Object.freeze({
    path: "reports/g4-l10-residual-frame-domain-audit-triage-v1.json",
    bytes: 124726,
    sha256: "ba515be75fbf9f8fd25ddbd9114a3e00996cdfb535f567c4518116118bb1a7f2",
    mode: "0444",
  }),
  dynamicDispositionPlan: Object.freeze({
    path: "reports/g4-l10-dynamic-indirect-parent-disposition-successor-plan-v1.json",
    bytes: 128316,
    sha256: "f5b958601ef2d1be09e60ad5e72e606fa9dff08f97e1eaba02cc469682b79c19",
    mode: "0444",
  }),
  dispositionProofEngine: Object.freeze({
    path: "scripts/build-static-frame-domain-disposition-evidence.mjs",
    bytes: 140795,
    sha256: "87b40d7d2066758669a03d08fc2366a5612775dd7967e92d1619176f2ae3b825",
    mode: "0644",
  }),
});

const ROUTES = Object.freeze({
  "stop-only-one-frame-control": Object.freeze({
    expectedPairCount: 10,
    expectedBodyGroupCount: 1,
    meaning:
      "The source executes stop(); the one-frame display list does not erase the source control event or prove the parent entry/state context.",
    nextEvidence:
      "Audit the owning control and parent-entry path, then capture its natural authorized interaction before any disposition successor is considered.",
  }),
  "on-enter-frame-geometry-controller": Object.freeze({
    expectedPairCount: 13,
    expectedBodyGroupCount: 2,
    meaning:
      "The source installs an onEnterFrame controller driven by mouse coordinates, global movement state, scale, and rotation geometry.",
    nextEvidence:
      "Bind the repeated source variants, enumerate mouse/scale/rotation states, and require natural interaction behavior plus visual evidence.",
  }),
  "wrong-feedback-hyperlink-popup": Object.freeze({
    expectedPairCount: 7,
    expectedBodyGroupCount: 1,
    meaning:
      "The source binds wrong-feedback HTML text and a Key Term hyperlink function; popup text and link behavior are runtime obligations.",
    nextEvidence:
      "Use higher-priority FLA structure evidence where authorized, then capture wrong-feedback text and hyperlink behavior in EN/ES context.",
  }),
  "game-dynamic-grid-and-drop": Object.freeze({
    expectedPairCount: 2,
    expectedBodyGroupCount: 2,
    meaning:
      "The source creates/manipulates grid clips or performs dynamic drop-target evaluation and drag lifecycle control.",
    nextEvidence:
      "Enumerate generated-grid and drag/drop branches and capture successful, failed, and reset interactions before specification.",
  }),
  "shell-runtime-components": Object.freeze({
    expectedPairCount: 9,
    expectedBodyGroupCount: 9,
    meaning:
      "The shell scripts implement volume, scrolling, skin registration, glossary/play state, calculator, Key Terms, close-button, or component initialization behavior.",
    nextEvidence:
      "Keep these shell controls separate from lesson-page visuals and capture each reachable shell interaction under an authorized shell runtime plan.",
  }),
});

const BODY_GROUPS = Object.freeze({
  "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db": Object.freeze({
    expectedPairCount: 10,
    expectedBytes: 7,
    expectedLines: 1,
    routeId: "stop-only-one-frame-control",
    semanticSummary: "stop()",
  }),
  "c25439ba4c079127c9866f139daa22f9a45aa30546e399796f170ddd05991ff0": Object.freeze({
    expectedPairCount: 10,
    expectedBytes: 804,
    expectedLines: 31,
    routeId: "on-enter-frame-geometry-controller",
    semanticSummary: "onEnterFrame mouse/scale/rotation controller variant A",
  }),
  "39593fc8139eef2a1dc9d751fc6a580e07a8ad89a13eb8c8c370ed7d34cb1007": Object.freeze({
    expectedPairCount: 7,
    expectedBytes: 258,
    expectedLines: 9,
    routeId: "wrong-feedback-hyperlink-popup",
    semanticSummary: "wrong-feedback HTML binding and Key Term hyperlink function",
  }),
  "e1120288ec6519b2399f6d773ebf3b51ba5a244ed919813aabcf768f3cfa14b1": Object.freeze({
    expectedPairCount: 3,
    expectedBytes: 799,
    expectedLines: 31,
    routeId: "on-enter-frame-geometry-controller",
    semanticSummary: "onEnterFrame mouse/scale/rotation controller variant B",
  }),
  "478b875c921596123bc88792bf5c570ef5e629084e0fb37cdea7bed323d5877d": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 81,
    expectedLines: 4,
    routeId: "shell-runtime-components",
    semanticSummary: "Key Terms close-button onRelease binding",
  }),
  "6174d3022387ced5658f41add6d19c4ba28db7cd7c759e3e4a5af496cf38588f": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 424,
    expectedLines: 15,
    routeId: "shell-runtime-components",
    semanticSummary: "volume dragger and sound-volume lifecycle",
  }),
  "7ed98c51c4db7d18eedd10fcbdde12bf576e288a7425b21641ec3cc1e9e7fd3c": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 628,
    expectedLines: 25,
    routeId: "shell-runtime-components",
    semanticSummary: "scroll dragger onEnterFrame controller",
  }),
  "8f2b2b29f23fce08134cba110f9840a32f4839459d11019a24cceeef420169b1": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 79,
    expectedLines: 2,
    routeId: "shell-runtime-components",
    semanticSummary: "scroll skin-element registration",
  }),
  "964a46cbfad0f3abc2a319b0482bb76853784d4e0ab91ffda9993bfb430b044d": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 40,
    expectedLines: 2,
    routeId: "shell-runtime-components",
    semanticSummary: "glossary visibility initialization and stop",
  }),
  "96d9453318383cab3051bbb84ebe821ad2e1880805bfb131742a74b41e52ec8c": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 896,
    expectedLines: 35,
    routeId: "game-dynamic-grid-and-drop",
    semanticSummary: "mouse-up drop-target evaluation and drag stop",
  }),
  "a23a2606ba75f048a065875895330c456a20cf955af474f8d53f6e58dcb97992": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 35,
    expectedLines: 2,
    routeId: "shell-runtime-components",
    semanticSummary: "global play-action initialization and stop",
  }),
  "c399086775dd29b859b3b5c52634d3cfc528075f68ad49f5669fedb3bd3ff8e6": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 766,
    expectedLines: 49,
    routeId: "shell-runtime-components",
    semanticSummary: "calculator digit and operator logic",
  }),
  "c596cb5415dafd8fb0bf52d9d77c2a9412567494c5040e3ffe72300a3553d62d": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 2030,
    expectedLines: 52,
    routeId: "game-dynamic-grid-and-drop",
    semanticSummary: "dynamic grid drawing and duplicated clip interaction",
  }),
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 0,
    expectedLines: 0,
    routeId: "shell-runtime-components",
    semanticSummary: "empty FFDec frame body with SWF DoAction and attributed component DoInitAction",
  }),
  "f57bb0f972842cb82e181db766bee135816ec50f5e34e29eb9541a84b04cc364": Object.freeze({
    expectedPairCount: 1,
    expectedBytes: 3201,
    expectedLines: 146,
    routeId: "shell-runtime-components",
    semanticSummary: "Key Terms navigation, visibility, and button bindings",
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
  const a = Number.parseInt(String(left).replace(/^sprite-/, ""), 10);
  const b = Number.parseInt(String(right).replace(/^sprite-/, ""), 10);
  if (Number.isInteger(a) && Number.isInteger(b) && a !== b) return a - b;
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
  assert.equal(before.nlink, 1n, `Input must have one hard link: ${expected.path}`);
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
  return {path: record.path, bytes: record.byteCount, sha256: record.sha256,
    mode: record.mode};
}

function inputSetSha256(records) {
  const encoded = [...records].sort((a, b) => compareText(a.path, b.path))
    .map((record) =>
      `${record.path}\0${record.byteCount}\0${record.sha256}\0${record.mode}\n`)
    .join("");
  return sha256(Buffer.from(encoded, "utf8"));
}

function exactSet(rows, serializer, encoding, assertUnique = true) {
  const values = rows.map(serializer).sort(compareText);
  if (assertUnique) assert.equal(new Set(values).size, values.length,
    `${encoding}: rows are duplicated`);
  const bytes = Buffer.from(values.map((value) => `${value}\n`).join(""), "utf8");
  return {count: values.length, sha256: sha256(bytes), encoding};
}

function pairSet(pairs) {
  return exactSet(pairs, ({animationId, timelineId}) =>
    `${animationId}\t${timelineId}`,
  "sorted-animationId-tab-timelineId-newline-v1");
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

function bodyLineCount(body) {
  return body === "" ? 0 : body.split("\n").length;
}

function placementSummary(inspection) {
  const records = [
    ...inspection.incomingResolved.map((item) => ({direction: "incoming", ...item})),
    ...inspection.outgoingResolved.map((item) => ({direction: "outgoing", ...item})),
  ];
  const placementSet = exactSet(records, ({direction, parentTimelineId,
    effectiveObjectId, placement}) => [direction, parentTimelineId,
    effectiveObjectId ?? "", placement.eventIndex, placement.frame,
    placement.depth, placement.name, placement.tag, placement.replace,
    placement.hasClipActions ? "1" : "0"].join("\t"),
  "sorted-direction-parentTimelineId-effectiveObjectId-eventIndex-frame-depth-name-tag-replace-hasClipActions-newline-v1",
  false);
  const names = (rows) => [...new Set(rows.map(({placement}) => placement.name)
    .filter(Boolean))].sort(compareText);
  const parents = (rows) => [...new Set(rows.map(({parentTimelineId}) =>
    parentTimelineId))].sort(compareTimelineIds);
  return {
    incomingPlacementCount: inspection.incomingResolved.length,
    outgoingPlacementCount: inspection.outgoingResolved.length,
    incomingParentTimelineIds: parents(inspection.incomingResolved),
    outgoingParentTimelineIds: parents(inspection.outgoingResolved),
    namedIncomingInstanceNames: names(inspection.incomingResolved),
    namedOutgoingInstanceNames: names(inspection.outgoingResolved),
    unresolvedOutgoingObjectCount: inspection.unresolvedOutgoingCount,
    clipActionCount: inspection.clipActionCount,
    exactPlacementEventSet: placementSet,
  };
}

function bodyGroupSet(groups) {
  return exactSet(groups, (group) => [group.bodySha256, group.bodyBytes,
    group.bodyLines, group.routeId, group.exactPairSet.sha256].join("\t"),
  "sorted-bodySha256-bodyBytes-bodyLines-routeId-pairSetSha256-newline-v1");
}

export async function buildTriage(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const fixedRecords = Object.fromEntries(await Promise.all(
    Object.entries(FIXED_INPUTS).map(async ([key, expected]) =>
      [key, await stableRead(root, expected)]),
  ));
  const triage = parseJson(fixedRecords.residualTriage);
  const plan = parseJson(fixedRecords.dynamicDispositionPlan);
  assert.equal(triage.status,
    "residual-unresolved-exactly-enumerated-routed-no-disposition-change");
  assert.equal(triage.decision,
    "KEEP_70_UNRESOLVED_ADVANCE_ONLY_BY_BOUND_SUCCESSORS");
  assert.equal(plan.status,
    "FROZEN_PLAN_ONLY_NOT_APPLIED_NO_WORKSPACE_MUTATION_AUTHORITY");
  assert.equal(plan.scope.workspaceFilesWritten, 0);

  const selectedPairs = triage.residualPairs.filter(({categoryId}) =>
    categoryId === "scripted-one-frame");
  assert.deepEqual(pairSet(selectedPairs), EXACT_PAIR_SET);
  assert.ok(selectedPairs.every(({currentDisposition, frameCount,
    canonicalDispositionChangedByThisReport}) => currentDisposition === "unresolved"
      && frameCount === 1 && canonicalDispositionChangedByThisReport === false));

  const byAnimationId = new Map();
  for (const pair of selectedPairs) {
    if (!byAnimationId.has(pair.animationId)) byAnimationId.set(pair.animationId, []);
    byAnimationId.get(pair.animationId).push(pair);
  }
  assert.equal(byAnimationId.size, 20);

  const workspaceRecords = [];
  const members = [];
  const allTimelines = [];
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
    ].map(async ([key, filePath]) => [key, await stableRead(root, {path: filePath})])));
    workspaceRecords.push(...Object.values(records));
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
    const audit = deriveSingleFrameScriptlessEligibility({
      animationId, structure, scripts, inventory, manifest,
    });
    const timelines = [];
    for (const pair of [...pairs].sort((a, b) =>
      compareTimelineIds(a.timelineId, b.timelineId))) {
      const label = `${animationId}/${pair.timelineId}`;
      const inspection = audit.inspections.get(pair.timelineId);
      assert.ok(inspection, `${label}: generic one-frame inspection is absent`);
      assert.equal(inspection.eligible, false,
        `${label}: scripted one-frame target became scriptless-eligible`);
      const expectedDisqualifiers = label ===
        "shell-course-g04-l10-index-local/sprite-86"
        ? ["swfmill-do-action-present", "swfmill-do-init-action-present",
          "ffdec-frame-script-present"]
        : ["swfmill-do-action-present", "ffdec-frame-script-present"];
      assert.deepEqual(inspection.disqualifiers, expectedDisqualifiers,
        `${label}: exact scripted-one-frame blocker set drifted`);
      assert.equal(inspection.timeline.declaredFrames, 1,
        `${label}: declared frame count drifted`);
      assert.equal(inspection.timeline.observedShowFrames, 1,
        `${label}: ShowFrame count drifted`);
      assert.equal(inspection.directDoActionTagCount, 1,
        `${label}: expected one direct DoAction`);
      assert.equal(inspection.directDoInitActionTagCount, 0,
        `${label}: unexpected direct DoInitAction`);
      assert.equal(inspection.ffdecFrameScripts.length, 1,
        `${label}: expected one FFDec frame-script block`);
      const [block] = inspection.ffdecFrameScripts;
      assert.equal(block.scope.frame, 1, `${label}: script frame drifted`);
      const expectedBody = BODY_GROUPS[block.bodySha256];
      assert.ok(expectedBody, `${label}: unrecognized script body SHA-256`);
      const bodyBytes = Buffer.byteLength(block.body, "utf8");
      const bodyLines = bodyLineCount(block.body);
      assert.equal(bodyBytes, expectedBody.expectedBytes,
        `${label}: script body byte count drifted`);
      assert.equal(bodyLines, expectedBody.expectedLines,
        `${label}: script body line count drifted`);
      const dispositionRows = disposition.timelines.filter(({timelineId}) =>
        timelineId === pair.timelineId);
      assert.equal(dispositionRows.length, 1,
        `${label}: disposition row is missing or duplicated`);
      assert.equal(dispositionRows[0].disposition, "unresolved",
        `${label}: disposition is no longer unresolved`);
      assert.equal(Boolean(manifest.source.flaSha256), pair.flaBacked,
        `${label}: FLA backing differs from residual triage`);
      assert.equal(manifest.source.pairedFlaStatus, pair.pairedFlaStatus,
        `${label}: paired FLA status drifted`);
      const attributedDoInitActionCount = inspection.attributedDoInitActions.length;
      assert.equal(attributedDoInitActionCount,
        label === "shell-course-g04-l10-index-local/sprite-86" ? 1 : 0,
      `${label}: attributed DoInitAction count drifted`);
      const timeline = {
        animationId,
        ordinal: pair.ordinal,
        assetId: pair.assetId,
        sourceSwfSha256: pair.sourceSwfSha256,
        timelineId: pair.timelineId,
        sourceObjectId: inspection.sourceObjectId,
        frameCount: 1,
        flaBacked: pair.flaBacked,
        pairedFlaStatus: pair.pairedFlaStatus,
        sourceFlaSha256: manifest.source.flaSha256 || null,
        currentDisposition: "unresolved",
        routeId: expectedBody.routeId,
        scriptBodySha256: block.bodySha256,
        scriptBodyBytes: bodyBytes,
        scriptBodyLines: bodyLines,
        scriptBinding: {
          script: block.script,
          frame: block.scope.frame,
          lineStart: block.lineStart,
          lineEnd: block.lineEnd,
        },
        tagAndScriptAudit: {
          directDoActionTagCount: 1,
          directDoInitActionTagCount: 0,
          attributedDoInitActionCount,
          attributedDoInitActions: inspection.attributedDoInitActions,
          ffdecFrameScriptCount: 1,
          exactDisqualifiers: inspection.disqualifiers,
        },
        placementSummary: placementSummary(inspection),
        evidencePriority: pair.flaBacked
          ? "higher-priority FLA structure audit if separately authorized, followed by authorized natural-runtime behavior"
          : "SWF static evidence followed by authorized natural-runtime behavior; no FLA route exists",
        currentRuntimeGate:
          "blocked: helper/security review has not activated original-runtime launch authority",
        canonicalDispositionChangedByThisReport: false,
        authoritativeRuntimeEntryEstablished: false,
        strictAcceptanceEffect: "none",
      };
      timelines.push(timeline);
      allTimelines.push(timeline);
    }
    members.push({
      animationId,
      ordinal: Math.min(...pairs.map(({ordinal}) => ordinal)),
      assetId: manifest.assetId,
      sourceSwfSha256: manifest.source.swfSha256,
      exactPairSet: pairSet(timelines),
      inputBindings: Object.fromEntries(Object.entries(records).map(
        ([key, record]) => [key, binding(record)])),
      timelines,
      currentDispositionChangedByThisReport: false,
    });
  }

  assert.deepEqual(pairSet(allTimelines), EXACT_PAIR_SET);
  assert.equal(allTimelines.filter(({flaBacked}) => flaBacked).length, 21);
  assert.equal(allTimelines.filter(({flaBacked}) => !flaBacked).length, 20);
  assert.equal(allTimelines.filter(({tagAndScriptAudit}) =>
    tagAndScriptAudit.attributedDoInitActionCount === 1).length, 1);

  const bodyGroupSummaries = Object.entries(BODY_GROUPS).map(
    ([bodySha256, expected]) => {
      const timelines = allTimelines.filter(({scriptBodySha256}) =>
        scriptBodySha256 === bodySha256);
      assert.equal(timelines.length, expected.expectedPairCount,
        `${bodySha256}: script-body pair count drifted`);
      assert.ok(timelines.every(({scriptBodyBytes, scriptBodyLines, routeId}) =>
        scriptBodyBytes === expected.expectedBytes
          && scriptBodyLines === expected.expectedLines
          && routeId === expected.routeId),
      `${bodySha256}: script-body metadata drifted`);
      return {
        bodySha256,
        bodyBytes: expected.expectedBytes,
        bodyLines: expected.expectedLines,
        semanticSummary: expected.semanticSummary,
        routeId: expected.routeId,
        exactPairSet: pairSet(timelines),
        memberCount: new Set(timelines.map(({animationId}) => animationId)).size,
        flaBackedCount: timelines.filter(({flaBacked}) => flaBacked).length,
        swfOnlyCount: timelines.filter(({flaBacked}) => !flaBacked).length,
        rawScriptBodyIncludedInReport: false,
        currentDispositionChanged: false,
      };
    }).sort((a, b) => b.exactPairSet.count - a.exactPairSet.count
      || compareText(a.bodySha256, b.bodySha256));
  assert.equal(bodyGroupSummaries.length, 15);

  const routeSummaries = Object.entries(ROUTES).map(([id, expected]) => {
    const timelines = allTimelines.filter(({routeId}) => routeId === id);
    const bodyGroups = bodyGroupSummaries.filter(({routeId}) => routeId === id);
    assert.equal(timelines.length, expected.expectedPairCount,
      `${id}: route pair count drifted`);
    assert.equal(bodyGroups.length, expected.expectedBodyGroupCount,
      `${id}: route body-group count drifted`);
    return {
      id,
      meaning: expected.meaning,
      nextEvidence: expected.nextEvidence,
      exactPairSet: pairSet(timelines),
      bodyGroupCount: bodyGroups.length,
      bodyGroupSha256s: bodyGroups.map(({bodySha256}) => bodySha256)
        .sort(compareText),
      memberCount: new Set(timelines.map(({animationId}) => animationId)).size,
      flaBackedCount: timelines.filter(({flaBacked}) => flaBacked).length,
      swfOnlyCount: timelines.filter(({flaBacked}) => !flaBacked).length,
      currentDispositionForAllPairs: "unresolved",
      currentDispositionChanged: false,
    };
  });
  assert.equal(routeSummaries.length, 5);

  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType: "g4-l10-scripted-one-frame-control-triage-v1",
    status:
      "all-41-scripted-one-frame-pairs-hash-clustered-and-routed-current-dispositions-unresolved",
    decision:
      "FREEZE_41_SCRIPTED_ONE_FRAME_ROUTES_KEEP_ALL_41_UNRESOLVED",
    purpose: [
      "Bind the exact 41 residual one-frame objects to their complete FFDec frame-script body hashes and SWF structural control tags.",
      "Separate repeated behavior families into evidence routes without treating one frame as scriptless, composite, independent, nonvisual, accepted, or implemented.",
    ],
    fixedEvidenceInputs: Object.fromEntries(Object.entries(fixedRecords).map(
      ([key, record]) => [key, binding(record)])),
    workspaceInputSet: {
      fileCount: workspaceRecords.length,
      memberCount: members.length,
      sha256: inputSetSha256(workspaceRecords),
      encoding: "path-null-bytes-null-sha256-null-mode-newline-v1",
    },
    exactScriptedPairSet: pairSet(allTimelines),
    exactScriptBodyGroupSet: bodyGroupSet(bodyGroupSummaries),
    scope: {
      affectedMembers: members.length,
      exactPairs: allTimelines.length,
      exactLocalFrames: allTimelines.reduce((sum, {frameCount}) =>
        sum + frameCount, 0),
      flaBackedPairs: allTimelines.filter(({flaBacked}) => flaBacked).length,
      swfOnlyPairs: allTimelines.filter(({flaBacked}) => !flaBacked).length,
      distinctScriptBodyGroups: bodyGroupSummaries.length,
      evidenceRoutes: routeSummaries.length,
      directDoActionTagCount: allTimelines.reduce((sum, {tagAndScriptAudit}) =>
        sum + tagAndScriptAudit.directDoActionTagCount, 0),
      ffdecFrameScriptCount: allTimelines.reduce((sum, {tagAndScriptAudit}) =>
        sum + tagAndScriptAudit.ffdecFrameScriptCount, 0),
      attributedDoInitActionCount: allTimelines.reduce(
        (sum, {tagAndScriptAudit}) =>
          sum + tagAndScriptAudit.attributedDoInitActionCount, 0),
    },
    bodyGroupSummaries,
    routeSummaries,
    members: members.sort((a, b) => a.ordinal - b.ordinal
      || compareText(a.animationId, b.animationId)),
    conclusion: {
      sourceScriptedPairCount: 41,
      scriptlessPairCount: 0,
      oneFrameDoesNotEstablishBehavioralExhaustiveness: true,
      allCurrentDispositions: "unresolved",
      currentDispositionChangedByThisReport: false,
      routeIsNotDispositionProof: true,
      routeIsNotSpecification: true,
      routeIsNotOriginalRuntimeEvidence: true,
      routeIsNotRendererEvidence: true,
      routeIsNotAcceptance: true,
    },
    residualBoundary: {
      currentRawResidualCountBefore: 70,
      currentRawResidualCountAfter: 70,
      scriptedPairsRemovedFromResidualByThisReport: 0,
      dynamicPlanProjectionNotApplied: {
        selectedPairs: 21,
        projectedResidualIfSeparatelyAuthorizedAndApplied: 49,
        currentResidualAfterThisReport: 70,
      },
      formalRequirementProjectionResidualCount: 74,
      downstream114OutputTransactionInvoked: false,
      downstream114OutputTransactionModesStillProhibited:
        ["--apply", "--dry-run", "--check"],
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      migrationWorkspaceWriteSupported: false,
      dispositionSuccessorGenerated: false,
      applySupported: false,
      recoverSupported: false,
      rollbackSupported: false,
      helperExecutionSupported: false,
      protectedInstallationSupported: false,
      originalRuntimeLaunchSupported: false,
      productionHelperImplementationAuthorized: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 report; never write any migration workspace, source asset, disposition, helper, runtime artifact, acceptance, promotion, release, or publication artifact`,
    authorityEffects,
    nextPermittedAction:
      "Select one exact repeated route/body group for a separately bounded FLA/static or future authorized natural-runtime evidence kit. Keep every pair unresolved; do not implement a helper or launch an original runtime under this report.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const triageFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, triageFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildTriage(bundle.root);
  assert.equal(current.json, bundle.json,
    "G4 L10 scripted-one-frame triage inputs changed after derivation");
}

export async function checkTriage(bundle, outputRoot = bundle.root) {
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
    "G4 L10 scripted-one-frame triage report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    triageFingerprintSha256: bundle.document.triageFingerprintSha256,
    exactPairs: bundle.document.scope.exactPairs,
    scriptBodyGroups: bundle.document.scope.distinctScriptBodyGroups,
    evidenceRoutes: bundle.document.scope.evidenceRoutes,
    currentResidualCount: bundle.document.residualBoundary.currentRawResidualCountAfter,
    originalRuntimeLaunched: false,
    dispositionChanged: false,
    applySupported: false,
    acceptanceEffect: false,
  };
}

export async function publishTriageNoClobber(bundle, options = {}) {
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
  return checkTriage(bundle, outputRoot);
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
  const bundle = await buildTriage(projectRoot);
  if (mode === "--write-no-clobber") return publishTriageNoClobber(bundle);
  if (mode === "--check") return checkTriage(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    triageFingerprintSha256: bundle.document.triageFingerprintSha256,
    exactPairs: bundle.document.scope.exactPairs,
    scriptBodyGroups: bundle.document.scope.distinctScriptBodyGroups,
    evidenceRoutes: bundle.document.scope.evidenceRoutes,
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
