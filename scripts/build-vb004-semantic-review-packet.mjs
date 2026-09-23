#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {lstat, mkdir, readFile, realpath, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  SPEC_ALLOWLIST,
  redactedSemanticSha256,
} from "./refresh-course-candidate-spec-bindings.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const SHA256 = /^[a-f0-9]{64}$/;

export const VB004_SEMANTIC_REVIEW_PACKET_SCHEMA_VERSION = 1;
export const VB004_SEMANTIC_REVIEW_PACKET_GENERATOR_VERSION = "1.0.0";

export const VB004_SEMANTIC_REVIEW_CONTRACT = deepFreeze({
  animationId: "course-g03-l01-vb-004",
  adapterKind: "adapter",
  adapterSpecPath: "migrations/course-g03-l01-vb-004/audit/animate-createjs-adapter-spec.json",
  reviewPinAuthorityPath: "scripts/refresh-course-candidate-spec-bindings.mjs",
  consumerPath: "scripts/build-safe-animate-createjs-adapter.mjs",
  archivedAuthoringAuditPath: "migrations/course-g03-l01-vb-004/audit/history/6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31/adobe-animate-2021-authoring-audit.json",
  archivedAuthoringFramePath: "migrations/course-g03-l01-vb-004/audit/history/6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31/adobe-animate-2021-authoring-frame-0010.png",
  authoringArchiveManifestPath: "migrations/course-g03-l01-vb-004/audit/history/6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31/archive-manifest.json",
  currentAuthoringAuditPath: "migrations/course-g03-l01-vb-004/audit/adobe-animate-2021-authoring-audit.json",
  currentAuthoringFramePath: "migrations/course-g03-l01-vb-004/audit/adobe-animate-2021-authoring-frame-0010.png",
  currentScenarioInventoryPath: "migrations/course-g03-l01-vb-004/audit/scenario-inventory.json",
  currentAudioAuditPath: "migrations/course-g03-l01-vb-004/audit/audio-runtime-evidence.json",
  sourceFlaPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.fla",
  sourceSwfPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/VB/L1VB04.swf",
  expected: {
    adapterSpecSha256: "56ae25c82a9ffe52e4f198bcda4badeb2f3680d40decc1078ef85cf1b33a8a49",
    archivedAuthoringAuditSha256: "6b7942cf2d9a082d9b7b0b345f59b8029a8d3e398d8183658839919f021fab31",
    archivedAuthoringFrameSha256: "cfaaaab224f7ae55ab5adacd85a5d266ba920b1734065b6fcfe1fde09d0a782b",
    authoringArchiveManifestSha256: "de5c6d8b558caa2e2dea75ba12ac2683c7d5b05ac9be6c155a670481bf7f8c4f",
    currentAuthoringAuditSha256: "38cbdd18a6d3f1fa2b75843fd6eb640ae59d6c36b670a100f7fb8bc018135e83",
    currentAuthoringFrameSha256: "cfaaaab224f7ae55ab5adacd85a5d266ba920b1734065b6fcfe1fde09d0a782b",
    currentScenarioInventorySha256: "ea40576e9ff190c818d180088ecc6389f7f0b1a821df59da4ceb77cf1334334c",
    currentAudioAuditSha256: "c4b948d2893d27477e7592e3657a85097f01054b83369beae2f512991e249184",
    recordedScenarioInventorySha256: "b6ebdc8a410ce4080c2d60009ea04607e1be1750850469ac4e060c4b936abeec",
    priorReviewedSemanticSha256: "04bb3c051ba6e4af1718637f3cb1ad2fa1bcc555f2728ef5d320ab4cfae691db",
    currentSemanticSha256: "ef1a3ae5552e408682ea6387d01ad070ef6a6f3da857f21515e6607d38ae98fa",
    sourceFlaSha256: "49f1694f1a7ec200d4d3455c1bc29699b83146043b7c0f25165228b32a9e3a1a",
    sourceSwfSha256: "8c9860663714843b4d858a50528ad82d6783d8446c38d6f1cc77ec03a07ec72e",
  },
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function equal(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function projectRelative(projectRoot, filePath) {
  const relative = path.relative(projectRoot, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? portable(relative)
    : portable(path.resolve(filePath));
}

async function resolveRegularProjectFile(projectRoot, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label}: path is required`);
  invariant(!path.isAbsolute(relativePath), `${label}: path must be project-relative`);
  const absolute = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, absolute);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `${label}: path escapes project root`);
  const metadata = await lstat(absolute).catch((error) => {
    if (error?.code === "ENOENT") throw new Error(`${label}: file is missing at ${relativePath}`);
    throw error;
  });
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label}: expected a regular non-symlink file`);
  const [rootReal, fileReal] = await Promise.all([realpath(projectRoot), realpath(absolute)]);
  const realRelative = path.relative(rootReal, fileReal);
  invariant(realRelative && !realRelative.startsWith("..") && !path.isAbsolute(realRelative), `${label}: real path escapes project root`);
  return {absolute, metadata};
}

async function readArtifact(projectRoot, relativePath, expectedSha256, label, markdownOutput) {
  invariant(SHA256.test(String(expectedSha256)), `${label}: expected SHA-256 is invalid`);
  const {absolute, metadata} = await resolveRegularProjectFile(projectRoot, relativePath, label);
  const bytes = await readFile(absolute);
  const observedSha256 = sha256(bytes);
  invariant(observedSha256 === expectedSha256, `${label}: SHA-256 mismatch (expected ${expectedSha256}, observed ${observedSha256})`);
  const link = portable(path.relative(path.dirname(markdownOutput), absolute) || path.basename(absolute));
  return {
    record: {
      path: portable(relativePath),
      link,
      sha256: observedSha256,
      bytes: metadata.size,
    },
    bytes,
  };
}

async function readUnboundArtifact(projectRoot, relativePath, label, markdownOutput) {
  const {absolute, metadata} = await resolveRegularProjectFile(projectRoot, relativePath, label);
  const bytes = await readFile(absolute);
  return {
    record: {
      path: portable(relativePath),
      link: portable(path.relative(path.dirname(markdownOutput), absolute) || path.basename(absolute)),
      sha256: sha256(bytes),
      bytes: metadata.size,
    },
    bytes,
  };
}

async function readGeneratorArtifact(projectRoot, generatorPath, markdownOutput) {
  const absolute = path.resolve(generatorPath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), "generator: expected a regular non-symlink file");
  const bytes = await readFile(absolute);
  return {
    path: projectRelative(projectRoot, absolute),
    link: portable(path.relative(path.dirname(markdownOutput), absolute) || path.basename(absolute)),
    sha256: sha256(bytes),
    bytes: metadata.size,
    version: VB004_SEMANTIC_REVIEW_PACKET_GENERATOR_VERSION,
  };
}

function parseJson(artifact, label) {
  try {
    return JSON.parse(artifact.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function pngDimensions(bytes, label) {
  const signature = "89504e470d0a1a0a";
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).toString("hex") === signature, `${label}: invalid PNG signature`);
  invariant(bytes.subarray(12, 16).toString("ascii") === "IHDR", `${label}: missing PNG IHDR`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function findOne(items, predicate, label) {
  const matches = (items || []).filter(predicate);
  invariant(matches.length === 1, `${label}: expected exactly one match, observed ${matches.length}`);
  return matches[0];
}

function authoringFacts(audit, label) {
  const authoring = audit.authoringAudit;
  invariant(authoring && typeof authoring === "object", `${label}: authoringAudit is missing`);
  const local = findOne(authoring.library, (item) => item.name === "Animation03", `${label}: Animation03`);
  return {
    animationId: audit.animationId,
    animateVersion: audit.animateVersion,
    sourceFla: audit.source?.fla,
    sourceFlaSha256: audit.source?.flaSha256,
    nativeMovie: audit.nativeMovie,
    capturedAuthoringFrame: {
      flashFrame: audit.capturedAuthoringFrame?.flashFrame,
      sha256: audit.capturedAuthoringFrame?.sha256,
    },
    document: {
      name: authoring.document?.name,
      width: authoring.document?.width,
      height: authoring.document?.height,
      frameRate: authoring.document?.frameRate,
      backgroundColor: authoring.document?.backgroundColor,
      libraryItemCount: authoring.document?.libraryItemCount,
    },
    rootTimeline: {
      name: authoring.timeline?.name,
      frameCount: authoring.timeline?.frameCount,
      layerCount: authoring.timeline?.layerCount,
    },
    localTimeline: {
      name: local.name,
      itemType: local.itemType,
      frameCount: local.timeline?.frameCount,
      layerCount: local.timeline?.layerCount,
    },
  };
}

function currentRecursiveAuthoringFacts(audit) {
  const authoring = audit.authoringAudit;
  const local = findOne(authoring.library, (item) => item.name === "Animation03", "current authoring audit: Animation03");
  const actionLayer = findOne(local.timeline?.layers, (layer) => layer.name === "Action", "current authoring audit: Animation03/Action layer");
  const audioLayer = findOne(local.timeline?.layers, (layer) => layer.name === "Audio", "current authoring audit: Animation03/Audio layer");
  return {
    recursiveLibraryTimelineAudit: authoring.recursiveLibraryTimelineAudit === true,
    actionKeyframes: actionLayer.keyframes.map(({flashFrame, duration, actionScriptLength}) => ({flashFrame, duration, actionScriptLength})),
    soundPlacements: audioLayer.keyframes
      .filter(({soundName}) => Boolean(soundName))
      .map(({flashFrame, duration, soundName, soundSync}) => ({flashFrame, duration, soundName, soundSync})),
    limitations: [...(authoring.limitations || [])],
  };
}

function semanticProjection(spec, kind, authoringAuditSha256) {
  const clone = structuredClone(spec);
  invariant(clone.evidence && typeof clone.evidence === "object", "adapter spec: evidence is missing");
  clone.evidence.authoringAuditSha256 = authoringAuditSha256;
  clone.evidence.scenarioInventory = "__CURRENT_SCENARIO_INVENTORY_PATH__";
  clone.evidence.scenarioInventorySha256 = "__CURRENT_SCENARIO_INVENTORY_SHA256__";
  clone.evidence.audioAudit = "__CURRENT_AUDIO_AUDIT_PATH__";
  clone.evidence.audioAuditSha256 = "__CURRENT_AUDIO_AUDIT_SHA256__";
  invariant(redactedSemanticSha256(clone, kind) === sha256(JSON.stringify(stable(clone))), "semantic projection disagrees with the canonical reviewed-pin function");
  return stable(clone);
}

function diffValues(previous, current, prefix = "") {
  if (equal(previous, current)) return [];
  if (
    previous && current &&
    typeof previous === "object" && typeof current === "object" &&
    !Array.isArray(previous) && !Array.isArray(current)
  ) {
    const keys = [...new Set([...Object.keys(previous), ...Object.keys(current)])].sort();
    return keys.flatMap((key) => diffValues(previous[key], current[key], prefix ? `${prefix}.${key}` : key));
  }
  return [{path: prefix, previous: previous ?? null, current: current ?? null}];
}

function scenarioFacts(inventory) {
  const root = findOne(inventory.timelineInventory, ({timelineId}) => timelineId === "root", "scenario inventory: root timeline");
  const local = findOne(inventory.timelineInventory, ({timelineId}) => timelineId === "sprite-231", "scenario inventory: sprite-231 timeline");
  const placement = findOne(
    root.namedPlacements,
    ({name, objectId, frame}) => name === "animation" && String(objectId) === "231" && frame === 6,
    "scenario inventory: root Animation03 placement",
  );
  const frame56Buttons = (local.namedPlacements || [])
    .filter(({frame, name}) => frame === 56 && /^AnsBtn/.test(String(name)))
    .map(({depth, name, objectId}) => ({depth, name, objectId}));
  return {
    inventoryStatus: inventory.inventoryStatus,
    migrationStatusChanged: inventory.migrationStatusChanged,
    strictAcceptanceEffect: inventory.strictAcceptanceEffect,
    authorityStatement: [...(inventory.authorityStatement || [])],
    source: inventory.source,
    timelineCount: inventory.timelineInventory.length,
    rootPlacement: placement,
    localTimeline: {timelineId: local.timelineId, frameCount: local.frameCount},
    frame56AnswerButtons: frame56Buttons,
    conflictIds: (inventory.conflicts || []).map(({id}) => id),
    unresolvedIds: (inventory.unknowns || []).map(({id}) => id),
  };
}

function artifactLink(record) {
  return `[\`${record.path}\`](<${record.link}>) — SHA-256 \`${record.sha256}\``;
}

function bindingRecord(record) {
  return {path: record.path, sha256: record.sha256, bytes: record.bytes};
}

function markdownEscape(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

export async function buildVb004SemanticReviewPacket({
  projectRoot = defaultProjectRoot,
  markdownOutput = path.join(projectRoot, "reports", "vb004-semantic-review-packet.md"),
  generatorPath = scriptPath,
  contract = VB004_SEMANTIC_REVIEW_CONTRACT,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedMarkdown = path.resolve(markdownOutput);
  const expected = contract.expected;
  for (const [key, value] of Object.entries(expected)) {
    if (key.endsWith("Sha256")) invariant(SHA256.test(String(value)), `contract.expected.${key} is invalid`);
  }

  const [
    adapterSpecArtifact,
    reviewPinAuthorityArtifact,
    consumerArtifact,
    archivedAuditArtifact,
    archivedFrameArtifact,
    archiveManifestArtifact,
    currentAuditArtifact,
    currentFrameArtifact,
    scenarioArtifact,
    audioArtifact,
    sourceFlaArtifact,
    sourceSwfArtifact,
    generator,
  ] = await Promise.all([
    readArtifact(resolvedRoot, contract.adapterSpecPath, expected.adapterSpecSha256, "adapter spec", resolvedMarkdown),
    readUnboundArtifact(resolvedRoot, contract.reviewPinAuthorityPath, "review-pin authority", resolvedMarkdown),
    readUnboundArtifact(resolvedRoot, contract.consumerPath, "adapter consumer", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.archivedAuthoringAuditPath, expected.archivedAuthoringAuditSha256, "archived authoring audit", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.archivedAuthoringFramePath, expected.archivedAuthoringFrameSha256, "archived authoring frame", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.authoringArchiveManifestPath, expected.authoringArchiveManifestSha256, "authoring archive manifest", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.currentAuthoringAuditPath, expected.currentAuthoringAuditSha256, "current authoring audit", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.currentAuthoringFramePath, expected.currentAuthoringFrameSha256, "current authoring frame", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.currentScenarioInventoryPath, expected.currentScenarioInventorySha256, "current scenario inventory", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.currentAudioAuditPath, expected.currentAudioAuditSha256, "current audio audit", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.sourceFlaPath, expected.sourceFlaSha256, "source FLA", resolvedMarkdown),
    readArtifact(resolvedRoot, contract.sourceSwfPath, expected.sourceSwfSha256, "source SWF", resolvedMarkdown),
    readGeneratorArtifact(resolvedRoot, generatorPath, resolvedMarkdown),
  ]);

  const adapterSpec = parseJson(adapterSpecArtifact, "adapter spec");
  const archivedAudit = parseJson(archivedAuditArtifact, "archived authoring audit");
  const archiveManifest = parseJson(archiveManifestArtifact, "authoring archive manifest");
  const currentAudit = parseJson(currentAuditArtifact, "current authoring audit");
  const scenarioInventory = parseJson(scenarioArtifact, "current scenario inventory");
  const audioAudit = parseJson(audioArtifact, "current audio audit");

  invariant(adapterSpec.animationId === contract.animationId, "adapter spec: animation identity mismatch");
  invariant(adapterSpec.source?.fla === contract.sourceFlaPath && adapterSpec.source?.flaSha256 === expected.sourceFlaSha256, "adapter spec: source FLA binding mismatch");
  invariant(adapterSpec.source?.swf === contract.sourceSwfPath && adapterSpec.source?.swfSha256 === expected.sourceSwfSha256, "adapter spec: source SWF binding mismatch");
  invariant(adapterSpec.strictAcceptanceEffect?.startsWith("none;"), "adapter spec: strictAcceptanceEffect must remain none");
  invariant(adapterSpec.evidence?.authoringAudit === contract.currentAuthoringAuditPath, "adapter spec: authoring-audit path mismatch");
  invariant(adapterSpec.evidence?.authoringAuditSha256 === expected.currentAuthoringAuditSha256, "adapter spec: current authoring-audit pin mismatch");
  invariant(adapterSpec.evidence?.scenarioInventory === contract.currentScenarioInventoryPath, "adapter spec: scenario-inventory path mismatch");
  invariant(adapterSpec.evidence?.scenarioInventorySha256 === expected.recordedScenarioInventorySha256, "adapter spec: recorded scenario-inventory pin mismatch");
  invariant(adapterSpec.evidence?.audioAudit === contract.currentAudioAuditPath, "adapter spec: audio-audit path mismatch");
  invariant(adapterSpec.evidence?.audioAuditSha256 === expected.currentAudioAuditSha256, "adapter spec: audio-audit pin is not current");

  const allowlistEntries = SPEC_ALLOWLIST.filter(({animationId, artifact, kind}) =>
    animationId === contract.animationId && artifact === "audit/animate-createjs-adapter-spec.json" && kind === contract.adapterKind);
  invariant(allowlistEntries.length === 1, "review-pin authority: expected exactly one VB004 adapter allowlist entry");
  const allowlistEntry = allowlistEntries[0];
  invariant(allowlistEntry.semanticSha256 === expected.priorReviewedSemanticSha256, "review-pin authority: prior reviewed semantic pin was already changed; regenerate only after a new explicit review contract");
  invariant(allowlistEntry.consumer === contract.consumerPath, "review-pin authority: consumer path mismatch");

  invariant(archivedAudit.schemaVersion === 1 && currentAudit.schemaVersion === 2, "authoring evidence: expected archived schema v1 and current schema v2");
  invariant(archivedAudit.animationId === contract.animationId && currentAudit.animationId === contract.animationId, "authoring evidence: animation identity mismatch");
  invariant(archiveManifest.schemaVersion === 1 && archiveManifest.evidenceKind === "superseded-adobe-animate-authoring-audit-archive", "authoring archive manifest: schema/kind mismatch");
  invariant(archiveManifest.animationId === contract.animationId && archiveManifest.acceptanceEffect === "none", "authoring archive manifest: identity or acceptance boundary mismatch");
  invariant(archiveManifest.archivedCanonical?.sha256 === expected.archivedAuthoringAuditSha256, "authoring archive manifest: archived audit binding mismatch");
  invariant(archiveManifest.archivedAuthoringFrame?.sha256 === expected.archivedAuthoringFrameSha256, "authoring archive manifest: archived frame binding mismatch");
  invariant(archiveManifest.supersededByCanonicalSha256 === expected.currentAuthoringAuditSha256, "authoring archive manifest: current audit binding mismatch");
  invariant(equal(pngDimensions(archivedFrameArtifact.bytes, "archived authoring frame"), {width: 800, height: 600}), "archived authoring frame: native dimensions differ");
  invariant(equal(pngDimensions(currentFrameArtifact.bytes, "current authoring frame"), {width: 800, height: 600}), "current authoring frame: native dimensions differ");

  const archivedFacts = authoringFacts(archivedAudit, "archived authoring audit");
  const currentFacts = authoringFacts(currentAudit, "current authoring audit");
  invariant(equal(archivedFacts, currentFacts), "authoring evidence: stable movie/source/Animation03 facts differ between archived and current audits");
  invariant(archivedFacts.sourceFla === contract.sourceFlaPath && archivedFacts.sourceFlaSha256 === expected.sourceFlaSha256, "authoring evidence: source identity differs from contract");
  invariant(equal(archivedFacts.nativeMovie, adapterSpec.timeline?.stage ? {
    width: adapterSpec.timeline.stage.width,
    height: adapterSpec.timeline.stage.height,
    fps: adapterSpec.timeline.fps,
    frameCount: adapterSpec.timeline.root?.frameCount,
    backgroundColor: adapterSpec.timeline.stage.backgroundColor,
    rootLayerCount: archivedAudit.nativeMovie.rootLayerCount,
    libraryItemCount: archivedAudit.nativeMovie.libraryItemCount,
  } : null), "adapter spec: native timeline facts differ from authoring evidence");
  invariant(currentFacts.localTimeline.frameCount === adapterSpec.timeline?.local?.frameCount, "adapter spec: Animation03 frame count differs from current authoring evidence");
  invariant(currentAudit.protocol?.readOnlyWorkingCopyRequired === true && currentAudit.protocol?.readOnlyWorkingCopyPathVerified === true, "current authoring audit: read-only working-copy protocol is incomplete");
  invariant(currentAudit.protocol?.readOnlyWorkingCopyHashVerifiedAtFinalize === true && currentAudit.protocol?.readOnlyWorkingCopyPermissionsVerifiedAtFinalize === true, "current authoring audit: working-copy finalization checks are incomplete");
  invariant(currentAudit.protocol?.recursiveLibraryTimelineAuditRequired === true && currentAudit.protocol?.recursiveLibraryTimelineAuditVerified === true, "current authoring audit: recursive timeline protocol is incomplete");
  invariant(currentAudit.source?.workingCopy?.sha256 === expected.sourceFlaSha256 && currentAudit.source?.workingCopy?.readOnlyAtFinalize === true && currentAudit.source?.workingCopy?.byteIdenticalToSourceAtFinalize === true, "current authoring audit: working copy is not proven read-only and byte-identical");
  const recursiveFacts = currentRecursiveAuthoringFacts(currentAudit);
  invariant(recursiveFacts.recursiveLibraryTimelineAudit, "current authoring audit: recursive library timeline audit is not asserted");

  const priorProjection = semanticProjection(adapterSpec, contract.adapterKind, expected.archivedAuthoringAuditSha256);
  const currentProjection = semanticProjection(adapterSpec, contract.adapterKind, expected.currentAuthoringAuditSha256);
  const reconstructedPriorSha256 = sha256(JSON.stringify(priorProjection));
  const currentSemanticSha256 = sha256(JSON.stringify(currentProjection));
  invariant(reconstructedPriorSha256 === expected.priorReviewedSemanticSha256, "semantic review: replacing only the authoring-audit pin does not reconstruct the prior reviewed semantic hash");
  invariant(currentSemanticSha256 === expected.currentSemanticSha256, "semantic review: current semantic hash differs from the review contract");
  const semanticDiff = diffValues(priorProjection, currentProjection);
  invariant(equal(semanticDiff, [{
    path: "evidence.authoringAuditSha256",
    previous: expected.archivedAuthoringAuditSha256,
    current: expected.currentAuthoringAuditSha256,
  }]), "semantic review: projection delta is not exactly the authoring-audit SHA-256 pin");

  invariant(scenarioInventory.schemaVersion === 1 && scenarioInventory.animationId === contract.animationId, "scenario inventory: schema/identity mismatch");
  invariant(scenarioInventory.source?.swf === contract.sourceSwfPath && scenarioInventory.source?.swfSha256 === expected.sourceSwfSha256, "scenario inventory: source SWF mismatch");
  invariant(scenarioInventory.source?.fla === contract.sourceFlaPath && scenarioInventory.source?.flaSha256 === expected.sourceFlaSha256, "scenario inventory: source FLA mismatch");
  invariant(scenarioInventory.migrationStatusChanged === false && scenarioInventory.strictAcceptanceEffect?.startsWith("none;"), "scenario inventory: authority boundary changed");
  const currentScenarioFacts = scenarioFacts(scenarioInventory);
  invariant(currentScenarioFacts.localTimeline.frameCount === adapterSpec.timeline?.local?.frameCount, "scenario inventory: sprite-231 frame count differs from adapter spec");
  invariant(currentScenarioFacts.rootPlacement.depth === "4", "scenario inventory: root Animation03 placement depth differs");
  invariant(expected.recordedScenarioInventorySha256 !== expected.currentScenarioInventorySha256, "scenario review: expected a stale recorded scenario-inventory binding");
  invariant(audioAudit.animationId === contract.animationId, "audio audit: animation identity mismatch");
  invariant(audioAudit.source?.expectedSha256 === expected.sourceSwfSha256 && audioAudit.source?.observedSha256 === expected.sourceSwfSha256, "audio audit: source binding mismatch");

  const reviewScope = stable({
    animationId: contract.animationId,
    source: {
      fla: {path: contract.sourceFlaPath, sha256: expected.sourceFlaSha256},
      swf: {path: contract.sourceSwfPath, sha256: expected.sourceSwfSha256},
    },
    adapterSpec: bindingRecord(adapterSpecArtifact.record),
    semanticPins: {
      priorReviewed: expected.priorReviewedSemanticSha256,
      currentProposed: expected.currentSemanticSha256,
    },
    authoringEvidence: {
      archived: bindingRecord(archivedAuditArtifact.record),
      current: bindingRecord(currentAuditArtifact.record),
      semanticDiff,
    },
    scenarioEvidence: {
      recordedInAdapterSpec: expected.recordedScenarioInventorySha256,
      current: bindingRecord(scenarioArtifact.record),
    },
  });
  const reviewScopeSha256 = sha256(stableJson(reviewScope));
  const exactApprovalStatement = `我已人工审核 VB004 语义审核范围 sha256:${reviewScopeSha256}。我批准将 ${contract.animationId} 的 reviewed semantic pin 从 ${expected.priorReviewedSemanticSha256} 更新为 ${expected.currentSemanticSha256}；该批准仅涵盖当前 adapter spec 对 schema-v2 Animate authoring audit 的语义绑定，以及在既有机器校验全部通过后把 scenario-inventory 绑定从 ${expected.recordedScenarioInventorySha256} 刷新为 ${expected.currentScenarioInventorySha256}。它不批准 Flash 忠实度、原始运行时行为、音频、交互、human visual review、owner acceptance、strict completion 或 migration status 变更。`;

  const packet = {
    schemaVersion: VB004_SEMANTIC_REVIEW_PACKET_SCHEMA_VERSION,
    evidenceKind: "vb004-adapter-semantic-review-packet",
    animationId: contract.animationId,
    generator,
    authorityBoundary: {
      purpose: "request a fresh named-human decision about one reviewed engineering semantic pin",
      changesAllowlist: false,
      changesAdapterSpec: false,
      changesMigrationStatus: false,
      recordsHumanVisualReview: false,
      recordsOwnerAcceptance: false,
      claimsFlashFidelity: false,
      strictAcceptanceEffect: "none",
      rule: "Generation, --check success, matching hashes, or a semantic-pin approval is not Flash fidelity, original-runtime, audio, interaction, human-visual, owner, or completion acceptance.",
    },
    reviewScope,
    reviewScopeSha256,
    reviewPin: {
      authority: reviewPinAuthorityArtifact.record,
      allowlistEntry: {...allowlistEntry},
      priorReviewedSemanticSha256: expected.priorReviewedSemanticSha256,
      reconstructedPriorSemanticSha256: reconstructedPriorSha256,
      currentProposedSemanticSha256: currentSemanticSha256,
      currentPinStatus: "stale-pending-explicit-human-semantic-review",
      semanticProjectionEncoding: "stable key-sorted JSON with scenario-inventory and audio-audit path/SHA bindings redacted by the canonical review-pin function",
      semanticDiff,
    },
    adapter: {
      spec: adapterSpecArtifact.record,
      consumer: consumerArtifact.record,
      scope: adapterSpec.scope,
      strictAcceptanceEffect: adapterSpec.strictAcceptanceEffect,
      source: adapterSpec.source,
      timeline: adapterSpec.timeline,
      runtimeContract: adapterSpec.runtimeContract,
    },
    authoringEvidence: {
      archivedSchemaV1: {
        audit: archivedAuditArtifact.record,
        frame: {...archivedFrameArtifact.record, ...pngDimensions(archivedFrameArtifact.bytes, "archived authoring frame")},
        archiveManifest: archiveManifestArtifact.record,
        facts: archivedFacts,
      },
      currentSchemaV2: {
        audit: currentAuditArtifact.record,
        frame: {...currentFrameArtifact.record, ...pngDimensions(currentFrameArtifact.bytes, "current authoring frame")},
        facts: currentFacts,
        recursiveFacts,
        protocol: currentAudit.protocol,
        workingCopy: currentAudit.source.workingCopy,
      },
      stableFactsMatch: true,
      capturedFrameBytesMatch: archivedFrameArtifact.record.sha256 === currentFrameArtifact.record.sha256,
      expectedMaterialDifference: "schema-v2 adds a hash-verified read-only working-copy protocol and recursive library/timeline details; those added details require human semantic review even though the stable movie/source/Animation03 facts and captured frame bytes match",
      limitations: "Authoring evidence does not prove original-runtime reachability, interaction order, audio synchronization, bilingual behavior, Replay, scoring, or visual fidelity.",
    },
    scenarioEvidence: {
      currentInventory: scenarioArtifact.record,
      facts: currentScenarioFacts,
      adapterRecordedBindingSha256: expected.recordedScenarioInventorySha256,
      currentBindingSha256: expected.currentScenarioInventorySha256,
      bindingStatus: "stale",
      archivedRecordedScenarioBytesIncluded: false,
      limitation: "The packet has the stale SHA recorded by the adapter spec but no archived bytes for that old scenario inventory, so it does not claim byte-level or semantic equivalence between old and current inventories.",
      projectionTreatment: "Scenario path/SHA is excluded from the reviewed semantic hash, but any later binding-only refresh must still pass the existing source, manifest, timeline, placement, readiness, and audio invariants.",
    },
    audioBinding: {
      currentAudit: audioArtifact.record,
      adapterBindingStatus: "current",
      acceptanceEffect: "none; this binding is not authoritative listening or synchronization acceptance",
    },
    preservedSources: {
      fla: sourceFlaArtifact.record,
      swf: sourceSwfArtifact.record,
      mutationPerformed: false,
    },
    approvalRequest: {
      status: "pending-explicit-named-human-semantic-decision",
      allowedDecisions: ["approved", "rejected"],
      approvalMustBeFresh: true,
      exactApprovalStatement,
      rejectionStatement: `我拒绝 VB004 语义审核范围 sha256:${reviewScopeSha256}；不要更新 reviewed semantic pin 或刷新 adapter scenario-inventory 绑定。`,
      effectIfApproved: "Authorizes a later, separately executed update of the one VB004 reviewed-semantic allowlist pin and then the existing fail-closed binding-only refresh. This generator performs neither action.",
      prohibitedInterpretations: [
        "Approval is not human visual review or owner acceptance.",
        "Approval is not evidence that the JavaScript adapter matches Flash.",
        "Approval is not authoritative original-runtime, audio, interaction, scoring, bilingual, Replay, RMSE, accessibility, or completion evidence.",
        "Codex, this generator, and automated checks cannot supply the named-human decision.",
      ],
      decisionRecordedByPacket: false,
      reviewer: null,
      reviewedAt: null,
    },
    summary: {
      readyForHumanSemanticDecision: true,
      priorReviewedProjectionReconstructed: true,
      semanticProjectionDeltaCount: semanticDiff.length,
      currentScenarioBinding: "stale",
      strictAcceptanceEffect: "none",
      approvalRecorded: false,
    },
  };
  packet.generatedMarker = `sha256:${sha256(stableJson(packet))}`;
  return packet;
}

export function renderVb004SemanticReviewMarkdown(packet) {
  const oldAudit = packet.authoringEvidence.archivedSchemaV1;
  const currentAudit = packet.authoringEvidence.currentSchemaV2;
  const scenario = packet.scenarioEvidence;
  const lines = [
    "# VB004 JavaScript adapter 语义审核包",
    "",
    "> **这是待人工决定的工程审核包，不是批准记录。** 生成成功、`--check` 通过或哈希一致，均不批准 Flash 忠实度、human visual review、owner acceptance 或完成状态。",
    "",
    `- Animation: \`${packet.animationId}\``,
    `- Review scope: \`sha256:${packet.reviewScopeSha256}\``,
    `- Packet marker: \`${packet.generatedMarker}\``,
    `- Current decision: **${packet.approvalRequest.status}**`,
    `- Strict acceptance effect: **${packet.summary.strictAcceptanceEffect}**`,
    "",
    "## 为什么需要人工决定",
    "",
    `旧 reviewed semantic pin 是 \`${packet.reviewPin.priorReviewedSemanticSha256}\`；当前 adapter projection 是 \`${packet.reviewPin.currentProposedSemanticSha256}\`。机器重建证明，reviewed projection 中唯一变化是 \`${packet.reviewPin.semanticDiff[0].path}\`，但机器不能替人判断新增的 schema-v2 递归 authoring 证据是否可纳入已审核工程语义。`,
    "",
    "| 项目 | 旧/记录值 | 当前值 | 状态 |",
    "|---|---|---|---|",
    `| Reviewed semantic pin | \`${packet.reviewPin.priorReviewedSemanticSha256}\` | \`${packet.reviewPin.currentProposedSemanticSha256}\` | 待人工批准 |`,
    `| Animate authoring audit | schema v1 / \`${oldAudit.audit.sha256}\` | schema v2 / \`${currentAudit.audit.sha256}\` | stable facts match；递归证据新增 |`,
    `| Authoring frame | \`${oldAudit.frame.sha256}\` | \`${currentAudit.frame.sha256}\` | ${packet.authoringEvidence.capturedFrameBytesMatch ? "字节相同" : "不同"} |`,
    `| Scenario inventory binding | \`${scenario.adapterRecordedBindingSha256}\` | \`${scenario.currentBindingSha256}\` | **STALE** |`,
    "",
    "## 绑定证据",
    "",
    `- Adapter spec: ${artifactLink(packet.adapter.spec)}`,
    `- Reviewed-pin authority: ${artifactLink(packet.reviewPin.authority)}`,
    `- Adapter consumer: ${artifactLink(packet.adapter.consumer)}`,
    `- Archived authoring audit: ${artifactLink(oldAudit.audit)}`,
    `- Authoring archive manifest: ${artifactLink(oldAudit.archiveManifest)}`,
    `- Current authoring audit: ${artifactLink(currentAudit.audit)}`,
    `- Current scenario inventory: ${artifactLink(scenario.currentInventory)}`,
    `- Current audio audit: ${artifactLink(packet.audioBinding.currentAudit)}`,
    `- Source FLA: ${artifactLink(packet.preservedSources.fla)}`,
    `- Source SWF: ${artifactLink(packet.preservedSources.swf)}`,
    "",
    "## Authoring 对比",
    "",
    `稳定事实一致：stage ${currentAudit.facts.nativeMovie.width}×${currentAudit.facts.nativeMovie.height}、${currentAudit.facts.nativeMovie.fps} FPS、root ${currentAudit.facts.nativeMovie.frameCount} frames、library ${currentAudit.facts.nativeMovie.libraryItemCount} items、\`Animation03\` ${currentAudit.facts.localTimeline.frameCount} frames / ${currentAudit.facts.localTimeline.layerCount} layers。`,
    "",
    "schema-v2 新增并已机器核对：只读 working copy 的路径/哈希/权限、与源 FLA 字节一致、递归 library/timeline audit。当前递归审计还暴露：",
    "",
    `- Action keyframes: ${currentAudit.recursiveFacts.actionKeyframes.map(({flashFrame, duration, actionScriptLength}) => `frame ${flashFrame} (duration ${duration}, script length ${actionScriptLength})`).join("; ")}`,
    `- Sound placements: ${currentAudit.recursiveFacts.soundPlacements.map(({flashFrame, duration, soundName, soundSync}) => `${markdownEscape(soundName)} at frame ${flashFrame} (duration ${duration}, ${markdownEscape(soundSync)})`).join("; ")}`,
    "",
    `限制：${packet.authoringEvidence.limitations}`,
    "",
    "## Scenario 绑定状态",
    "",
    `当前 inventory 状态是 \`${scenario.facts.inventoryStatus}\`，\`sprite-231\` 为 ${scenario.facts.localTimeline.frameCount} frames；它仍列出 ${scenario.facts.unresolvedIds.length} 个 unresolved 项和 ${scenario.facts.conflictIds.length} 个 conflict。`,
    "",
    `- Unresolved: ${scenario.facts.unresolvedIds.map((id) => `\`${markdownEscape(id)}\``).join(", ")}`,
    `- Conflicts: ${scenario.facts.conflictIds.map((id) => `\`${markdownEscape(id)}\``).join(", ")}`,
    `- Important limitation: ${scenario.limitation}`,
    `- Refresh boundary: ${scenario.projectionTreatment}`,
    "",
    "## 请由具名人员作出明确决定",
    "",
    "若批准，请在对话中原样发送以下完整声明：",
    "",
    "> " + packet.approvalRequest.exactApprovalStatement,
    "",
    "若拒绝，请发送：",
    "",
    "> " + packet.approvalRequest.rejectionStatement,
    "",
    "### 不得扩大的含义",
    "",
    ...packet.approvalRequest.prohibitedInterpretations.map((item) => `- ${item}`),
    "",
    `本包没有改 allowlist、adapter spec、migration status、human visual review 或 owner acceptance。Decision recorded by packet: \`${packet.approvalRequest.decisionRecordedByPacket}\`.`,
  ];
  return `${lines.join("\n")}\n`;
}

async function atomicWrite(filePath, contents) {
  await mkdir(path.dirname(filePath), {recursive: true});
  const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, contents, {flag: "wx"});
  await rename(temporary, filePath);
}

export async function generateVb004SemanticReviewPacket({
  projectRoot = defaultProjectRoot,
  jsonOutput = path.join(projectRoot, "reports", "vb004-semantic-review-packet.json"),
  markdownOutput = path.join(projectRoot, "reports", "vb004-semantic-review-packet.md"),
  check = false,
  generatorPath = scriptPath,
  contract = VB004_SEMANTIC_REVIEW_CONTRACT,
} = {}) {
  const resolvedJson = path.resolve(jsonOutput);
  const resolvedMarkdown = path.resolve(markdownOutput);
  const packet = await buildVb004SemanticReviewPacket({projectRoot, markdownOutput: resolvedMarkdown, generatorPath, contract});
  const json = stableJson(packet);
  const markdown = renderVb004SemanticReviewMarkdown(packet);
  if (check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(resolvedJson, "utf8").catch(() => null),
      readFile(resolvedMarkdown, "utf8").catch(() => null),
    ]);
    return {
      ok: currentJson === json && currentMarkdown === markdown,
      jsonCurrent: currentJson === json,
      markdownCurrent: currentMarkdown === markdown,
      packet,
      jsonOutput: resolvedJson,
      markdownOutput: resolvedMarkdown,
    };
  }
  await Promise.all([atomicWrite(resolvedJson, json), atomicWrite(resolvedMarkdown, markdown)]);
  return {ok: true, jsonCurrent: true, markdownCurrent: true, packet, jsonOutput: resolvedJson, markdownOutput: resolvedMarkdown};
}

export function parseArguments(argv, {projectRoot = defaultProjectRoot} = {}) {
  const options = {
    projectRoot,
    jsonOutput: path.join(projectRoot, "reports", "vb004-semantic-review-packet.json"),
    markdownOutput: path.join(projectRoot, "reports", "vb004-semantic-review-packet.md"),
    check: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--output-json" || value === "--output-markdown") {
      const next = argv[index + 1];
      invariant(next && !next.startsWith("--"), `${value} requires a path`);
      if (value === "--output-json") options.jsonOutput = path.resolve(next);
      else options.markdownOutput = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown argument: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-vb004-semantic-review-packet.mjs [--check] [--json]
    [--output-json <packet.json>] [--output-markdown <packet.md>]

Builds a deterministic, acceptance-neutral VB004 engineering semantic-review
packet. It never edits the reviewed-pin allowlist, adapter spec, migration
manifest/status, human visual review, or owner acceptance.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await generateVb004SemanticReviewPacket(options);
  const summary = {
    ok: result.ok,
    jsonCurrent: result.jsonCurrent,
    markdownCurrent: result.markdownCurrent,
    jsonOutput: projectRelative(options.projectRoot, result.jsonOutput),
    markdownOutput: projectRelative(options.projectRoot, result.markdownOutput),
    generatedMarker: result.packet.generatedMarker,
    reviewScopeSha256: result.packet.reviewScopeSha256,
    summary: result.packet.summary,
  };
  if (options.json) console.log(JSON.stringify(summary, null, 2));
  else console.log(`${result.ok ? (options.check ? "PASS" : "Wrote") : "FAIL"}: ${summary.jsonOutput} and ${summary.markdownOutput}`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
