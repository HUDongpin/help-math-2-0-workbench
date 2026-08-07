#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdtemp,
  open,
  readdir,
  readFile,
  realpath,
  rm,
  unlink,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  buildLessonAudioOwnershipReadiness,
  validateLessonAudioOwnershipReadiness,
} from "./build-lesson-audio-ownership-readiness.mjs";
import {parseAudioInventory} from "./audio-listening-acceptance.mjs";
import {
  deriveFqHostUrlContract,
  parseScriptAudioOperations,
} from "./audit-pilot-audio.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const REPORT_JSON_PATH = "reports/g5-l4-audio-static-cue-reconciliation.json";
export const REPORT_MARKDOWN_PATH = "reports/g5-l4-audio-static-cue-reconciliation.md";
export const GENERATOR_PATH = "scripts/build-g5-l4-audio-static-cue-reconciliation.mjs";

const OWNERSHIP_REPORT_PATH = "reports/g5-l4-audio-ownership-readiness.json";
const SOURCE_SCOPE_PATH = "reports/g5-l4-source-scope-freeze.json";
const LESSON_RELEASES_PATH = "catalog/lesson-releases.json";
const SOURCE_FILES_PATH = "catalog/source-files.json";
const AUDIO_GROUPS_PATH = "catalog/audio-groups.json";
const AUDIO_OWNERSHIP_GENERATOR_PATH = "scripts/build-lesson-audio-ownership-readiness.mjs";
const AUDIO_INVENTORY_HELPER_PATH = "scripts/audio-listening-acceptance.mjs";
const AUDIO_AUDIT_HELPER_PATH = "scripts/audit-pilot-audio.mjs";
const SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const LESSON_ROOT = `${SOURCE_ROOT}/HELP_COURSES/ELMGR5/L4`;
const HOST_SWF_PATH = `${SOURCE_ROOT}/HELP_COURSES/indexELM.swf`;
const LESSON_MAIN_SCRIPT_PATH = `${LESSON_ROOT}/AS/MainScript_New.as`;
const LESSON_XML_PATH = `${LESSON_ROOT}/index.xml`;
const FQ_AUDIO_GROUP_ID = "course-g05-l04-fq-audio";
const FQ_BASE_PATH = `${LESSON_ROOT}/FQ`;
const FQ_MEMBER_IDS = Object.freeze([
  "course-g05-l04-fq-001",
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);
const FQ_POSITIVE_STATIC_OWNER_IDS = Object.freeze([
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);
const EXPECTED_FQ_LABELS = Object.freeze(Array.from({length: 18}, (_, index) => `Q${index + 1}`));
const EXPECTED_FQ_OPTIONS = Object.freeze(["A", "B", "C", "D"]);
const EXPECTED_FQ_LANGUAGES = Object.freeze([
  {language: "en", directory: "EA"},
  {language: "es", directory: "SA"},
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const CUE_CLASSIFICATIONS = Object.freeze([
  "external-page-host-path-hash-bound-candidate",
  "embedded-stream-root-placement-graph-observed-candidate",
  "embedded-stream-root-placement-graph-not-proven-candidate",
  "embedded-define-sound-nested-start-tag-candidate",
  "embedded-define-sound-exported-dynamic-linkage-candidate",
  "embedded-define-sound-definition-only-candidate",
]);

const PROHIBITED_TRUE_FIELDS = new Set([
  "runtimeReachabilityEstablished",
  "audibleContentEstablished",
  "spokenLanguageEstablished",
  "synchronizationEstablished",
  "listeningAccepted",
  "ownerAccepted",
  "strictComplete",
  "published",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en", {numeric: true});
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function fingerprint(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sameCanonical(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function projectRelative(root, candidate, label = "path") {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label} is missing`);
  const absolute = path.isAbsolute(candidate) ? path.resolve(candidate) : path.resolve(root, candidate);
  const relative = portable(path.relative(path.resolve(root), absolute));
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${label} escapes the project root`);
  invariant(!relative.includes("\\") && portable(path.normalize(relative)) === relative, `${label} is not normalized`);
  return relative;
}

async function readProjectFile(root, relativePath, label = relativePath) {
  const safePath = projectRelative(root, relativePath, label);
  const absolute = path.resolve(root, safePath);
  const [rootRealpath, metadata, resolved] = await Promise.all([
    realpath(root),
    lstat(absolute),
    realpath(absolute),
  ]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} is not an ordinary non-symlink file`);
  invariant(resolved.startsWith(`${rootRealpath}${path.sep}`), `${label} resolves outside the project root`);
  const bytes = await readFile(absolute);
  invariant(bytes.length === metadata.size, `${label} changed while being read`);
  return {
    path: safePath,
    absolute,
    bytes,
    descriptor: {
      path: safePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function readJsonProjectFile(root, relativePath, label = relativePath) {
  const input = await readProjectFile(root, relativePath, label);
  let value;
  try {
    value = JSON.parse(input.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {...input, value};
}

function descriptorMatches(left, right) {
  return left?.path === right?.path && Number(left?.bytes) === Number(right?.bytes) && left?.sha256 === right?.sha256;
}

function machineBoundary() {
  return {
    runtimeReachabilityEstablished: false,
    audibleContentEstablished: false,
    spokenLanguageEstablished: false,
    synchronizationEstablished: false,
    listeningAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  };
}

function cueFingerprint(record) {
  const fingerprinted = {...record};
  delete fingerprinted.cueFingerprintSha256;
  return fingerprint(fingerprinted);
}

function memberFingerprint(record) {
  const fingerprinted = {...record};
  delete fingerprinted.memberFingerprintSha256;
  return fingerprint(fingerprinted);
}

function assertMachineOutputBinding(machineReport, workspacePath, relativeOutputPath, observedDescriptor) {
  const output = (machineReport.outputs || []).find(({path: outputPath}) => outputPath === relativeOutputPath);
  invariant(output, `${machineReport.animationId}: machine report omits ${relativeOutputPath}`);
  invariant(
    observedDescriptor.path === `${workspacePath}/${relativeOutputPath}` &&
      observedDescriptor.bytes === output.bytes && observedDescriptor.sha256 === output.sha256,
    `${machineReport.animationId}: ${relativeOutputPath} differs from the machine report`,
  );
  return output;
}

function parseCueIndex(cueId, prefix) {
  const match = String(cueId || "").match(new RegExp(`^${prefix}-(\\d+)$`));
  invariant(match, `Malformed cue ID ${cueId}`);
  return Number(match[1]);
}

function mapByCharacterId(assetRows) {
  const result = new Map();
  for (const row of assetRows) {
    if (!row.swf_character_id) continue;
    const key = String(Number(row.swf_character_id));
    result.set(key, [...(result.get(key) || []), row]);
  }
  return result;
}

function staticPlacementForTimeline(timelineId, scenarioByTimeline, dispositionByTimeline) {
  const scenario = scenarioByTimeline.get(timelineId);
  invariant(scenario, `Scenario inventory has no ${timelineId}`);
  const disposition = dispositionByTimeline.get(timelineId) || null;
  const structuralReachabilityLabel = scenario.structuralReachability;
  const graphObserved = structuralReachabilityLabel === "root" || structuralReachabilityLabel === "reachable-from-root-placement-graph";
  return {
    timelineId,
    scenarioTimelineMatched: true,
    structuralReachabilityLabel,
    rootPlacementGraphObserved: graphObserved,
    frameDomainDisposition: disposition?.disposition || "not-enumerated-as-root-reachable",
    declaredFrameDomainIds: (disposition?.declaredFrameDomains || []).map(({frameDomainId}) => frameDomainId),
    rootPlacementPath: disposition?.rootPlacement?.namedPlacementPath || [],
    runtimeReachabilityEstablished: false,
  };
}

function inventoryIdentity(row) {
  return {
    cueId: row.cue_id,
    languageLabel: row.language,
    sourceFile: row.source_file,
    sha256: row.sha256,
    startFrame: row.start_frame === "" ? null : Number(row.start_frame),
    startFrameDomainId: row.start_frame_domain_id || null,
    startSemantics: row.start_semantics,
    durationMs: Number(row.duration_ms),
    format: row.format,
    channels: Number(row.channels),
    sampleRateHz: Number(row.sample_rate_hz),
    sourceCharacterId: row.source_character_id === "" ? null : Number(row.source_character_id),
  };
}

function assertInventoryMachineIdentity(inventory, machine) {
  invariant(inventory.sourceFile === machine.sourceFile && inventory.sha256 === machine.sha256, `${inventory.cueId}: source identity differs`);
  invariant(inventory.durationMs === machine.durationMs, `${inventory.cueId}: duration differs from machine audit`);
  invariant(inventory.channels === machine.channels && inventory.sampleRateHz === machine.sampleRateHz, `${inventory.cueId}: audio format metadata differs`);
}

function buildExternalCue({animationId, row, external, candidateBySource}) {
  const inventory = inventoryIdentity(row);
  const candidate = candidateBySource.get(inventory.sourceFile);
  invariant(candidate?.classification === "exact-page-catalog-candidate", `${animationId}/${row.cue_id}: exact catalog candidate is missing`);
  invariant(external.observedSha256 === inventory.sha256 && external.hashMatchesCatalog === true, `${animationId}/${row.cue_id}: external source hash differs`);
  invariant(external.associationStatus === "exact-basename-association", `${animationId}/${row.cue_id}: external association is not exact`);
  invariant(external.languageAssessment?.language === "es" && external.languageAssessment.spokenLanguageEstablished === false, `${animationId}/${row.cue_id}: external routing-language boundary changed`);
  invariant(inventory.languageLabel === "es" && inventory.startSemantics === "host-user-activated", `${animationId}/${row.cue_id}: external inventory route semantics changed`);
  assertInventoryMachineIdentity(inventory, {
    sourceFile: external.sourceFile,
    sha256: external.observedSha256,
    durationMs: external.probe.durationMs,
    channels: external.probe.channels,
    sampleRateHz: external.probe.sampleRateHz,
  });
  const cue = {
    cueCandidateId: `${animationId}:${inventory.cueId}`,
    animationId,
    origin: "external",
    classification: "external-page-host-path-hash-bound-candidate",
    inventory,
    physicalSource: {
      candidateId: candidate.candidateId,
      ...candidate.source,
      physicallyHashVerified: true,
    },
    machineEvidence: {
      associationStatus: external.associationStatus,
      codec: external.probe.codecName || external.probe.formatName,
      durationMs: external.probe.durationMs,
      startSemantics: external.startSemantics,
    },
    assetIdentity: null,
    staticPlacementGraph: null,
    hostDependency: {
      hostBindingId: "indexELM-course-spanish-page",
      pathFormula: "<lesson-base>/SA/<loaded-child-basename>.mp3",
      exactPathResolved: true,
      routingLanguageCandidate: "es",
      spokenLanguageEstablished: false,
      trigger: "host-user-activated",
      activationEvent: "unresolved",
    },
    unresolved: [
      "natural-runtime-activation",
      "exact-start-time",
      "stop-or-complete-semantics",
      "pause-resume",
      "replay-behavior",
      "spoken-language-and-audible-content",
      "runtime-synchronization",
    ],
    evidenceBoundary: machineBoundary(),
  };
  cue.cueFingerprintSha256 = cueFingerprint(cue);
  return cue;
}

function buildStreamCue({animationId, row, stream, assetByCharacterId, scenarioByTimeline, dispositionByTimeline, manifest}) {
  const inventory = inventoryIdentity(row);
  invariant(stream.context?.kind === "sprite", `${animationId}/${row.cue_id}: durationful stream is not sprite-local`);
  const characterId = Number(stream.context.characterId);
  invariant(inventory.sourceCharacterId === characterId, `${animationId}/${row.cue_id}: stream character ID differs`);
  assertInventoryMachineIdentity(inventory, {
    sourceFile: manifest.source.swf,
    sha256: manifest.source.swfSha256,
    durationMs: stream.durationMs,
    channels: stream.channels,
    sampleRateHz: stream.sampleRateHz,
  });
  invariant(inventory.languageLabel === "und" && inventory.startSemantics === "interaction-state", `${animationId}/${row.cue_id}: stream language/start boundary changed`);
  const assetMatches = (assetByCharacterId.get(String(characterId)) || []).filter(({type}) => type === "structural-sprite-definition-candidate");
  invariant(assetMatches.length === 1, `${animationId}/${row.cue_id}: expected one structural sprite asset identity`);
  const timelineId = `sprite-${characterId}`;
  const placement = staticPlacementForTimeline(timelineId, scenarioByTimeline, dispositionByTimeline);
  const classification = placement.structuralReachabilityLabel === "reachable-from-root-placement-graph"
    ? "embedded-stream-root-placement-graph-observed-candidate"
    : "embedded-stream-root-placement-graph-not-proven-candidate";
  invariant(CUE_CLASSIFICATIONS.includes(classification), `${animationId}/${row.cue_id}: unexpected stream classification`);
  const cue = {
    cueCandidateId: `${animationId}:${inventory.cueId}`,
    animationId,
    origin: "embedded-stream",
    classification,
    inventory,
    physicalSource: {
      path: manifest.source.swf,
      sha256: manifest.source.swfSha256,
    },
    machineEvidence: {
      streamIndex: stream.streamIndex,
      contextKind: stream.context.kind,
      contextCharacterId: characterId,
      contextDeclaredFrames: stream.contextDeclaredFrames,
      headFrame: stream.headFrame,
      firstBlockFrame: stream.firstBlockFrame,
      lastBlockFrame: stream.lastBlockFrame,
      blockCount: stream.blockCount,
      totalDecodedSamples: stream.totalDecodedSamples,
      durationMs: stream.durationMs,
      format: stream.format,
      syncMode: stream.syncMode,
    },
    assetIdentity: {
      assetId: assetMatches[0].asset_id,
      swfCharacterId: characterId,
      type: assetMatches[0].type,
      definitionInventoryFile: assetMatches[0].exported_file,
      definitionInventorySha256: assetMatches[0].sha256,
    },
    staticPlacementGraph: placement,
    hostDependency: null,
    unresolved: [
      "natural-runtime-trace",
      "scenario-and-entry-state",
      "exact-runtime-start-time",
      "stop-or-complete-semantics",
      "pause-resume",
      "replay-behavior",
      "spoken-language-and-audible-content",
      "runtime-synchronization",
    ],
    evidenceBoundary: machineBoundary(),
  };
  cue.cueFingerprintSha256 = cueFingerprint(cue);
  return cue;
}

function buildDefineSoundCue({
  animationId,
  row,
  sound,
  startSounds,
  actionScriptAudioOperations,
  assetByCharacterId,
  scenarioByTimeline,
  dispositionByTimeline,
  manifest,
  randomAudioMemberIds,
}) {
  const inventory = inventoryIdentity(row);
  const characterId = Number(sound.characterId);
  invariant(inventory.sourceCharacterId === characterId, `${animationId}/${row.cue_id}: DefineSound character ID differs`);
  assertInventoryMachineIdentity(inventory, {
    sourceFile: manifest.source.swf,
    sha256: manifest.source.swfSha256,
    durationMs: sound.durationMs,
    channels: sound.channels,
    sampleRateHz: sound.sampleRateHz,
  });
  invariant(inventory.languageLabel === "und" && inventory.startSemantics === "interaction-state", `${animationId}/${row.cue_id}: DefineSound language/start boundary changed`);
  const assetMatches = (assetByCharacterId.get(String(characterId)) || []).filter(({type}) => type === "structural-sound-definition-candidate");
  invariant(assetMatches.length === 1, `${animationId}/${row.cue_id}: expected one structural sound asset identity`);
  const starts = startSounds.filter((event) => Number(event.characterId) === characterId && event.stop !== true);
  let classification;
  let staticTrigger;
  let staticPlacementGraph = null;
  let hostDependency = null;
  if (starts.length > 0) {
    invariant(starts.length === 1 && starts[0].context?.kind === "sprite", `${animationId}/${row.cue_id}: nested StartSound shape changed`);
    classification = "embedded-define-sound-nested-start-tag-candidate";
    const event = starts[0];
    const timelineId = `sprite-${event.context.characterId}`;
    staticPlacementGraph = staticPlacementForTimeline(timelineId, scenarioByTimeline, dispositionByTimeline);
    staticTrigger = {
      kind: "nested-StartSound-tag",
      timelineId,
      localFrame: event.localFrame,
      syncMode: event.syncMode,
      loopCount: event.loopCount,
      staticReferenceResolved: true,
    };
  } else if (sound.linkage) {
    classification = "embedded-define-sound-exported-dynamic-linkage-candidate";
    const attachOperations = actionScriptAudioOperations.filter(({operation}) => operation === "attachSound");
    invariant(attachOperations.length >= 1, `${animationId}/${row.cue_id}: exported sound has no dynamic attachSound candidate`);
    staticTrigger = {
      kind: "exported-linkage-with-dynamic-attachSound-expression",
      linkage: sound.linkage,
      attachSoundExpressions: attachOperations.map(({location, localFrame, sourceLine, argumentExpression}) => ({
        location,
        localFrame,
        sourceLine,
        argumentExpression,
      })),
      staticReferenceResolved: false,
    };
    hostDependency = {
      hostBindingId: "g5-l4-shell-random-audio",
      staticHostDependencyCandidateAnimationIds: randomAudioMemberIds,
      exactDynamicLinkageSelectionResolved: false,
      runtimeActivationEstablished: false,
    };
  } else {
    classification = "embedded-define-sound-definition-only-candidate";
    staticTrigger = {
      kind: "definition-only-no-StartSound-or-export-linkage-observed",
      staticReferenceResolved: false,
    };
  }
  const cue = {
    cueCandidateId: `${animationId}:${inventory.cueId}`,
    animationId,
    origin: "embedded-define-sound",
    classification,
    inventory,
    physicalSource: {
      path: manifest.source.swf,
      sha256: manifest.source.swfSha256,
    },
    machineEvidence: {
      characterId,
      linkage: sound.linkage,
      samples: sound.samples,
      durationMs: sound.durationMs,
      format: sound.format,
    },
    assetIdentity: {
      assetId: assetMatches[0].asset_id,
      swfCharacterId: characterId,
      type: assetMatches[0].type,
      definitionInventoryFile: assetMatches[0].exported_file,
      definitionInventorySha256: assetMatches[0].sha256,
    },
    staticTrigger,
    staticPlacementGraph,
    hostDependency,
    unresolved: [
      "natural-runtime-trace",
      "exact-runtime-trigger",
      "stop-or-complete-semantics",
      "pause-resume",
      "replay-behavior",
      "spoken-language-and-audible-content",
      "runtime-synchronization",
    ],
    evidenceBoundary: machineBoundary(),
  };
  cue.cueFingerprintSha256 = cueFingerprint(cue);
  return cue;
}

function buildZeroBlockStructure({animationId, stream, assetByCharacterId, scenarioByTimeline, dispositionByTimeline}) {
  invariant(Number(stream.blockCount) === 0 && !stream.durationMs, `${animationId}/stream-${stream.streamIndex}: expected a zero-block stream`);
  const timelineId = stream.context?.kind === "root" ? "root" : `sprite-${stream.context.characterId}`;
  const placement = staticPlacementForTimeline(timelineId, scenarioByTimeline, dispositionByTimeline);
  let assetIdentity;
  if (stream.context?.kind === "root") {
    assetIdentity = {kind: "root-timeline"};
  } else {
    const matches = (assetByCharacterId.get(String(stream.context.characterId)) || []).filter(({type}) => type === "structural-sprite-definition-candidate");
    invariant(matches.length === 1, `${animationId}/stream-${stream.streamIndex}: zero-block stream sprite identity is missing`);
    assetIdentity = {
      assetId: matches[0].asset_id,
      swfCharacterId: Number(stream.context.characterId),
      type: matches[0].type,
    };
  }
  return {
    structureId: `${animationId}:zero-block-stream-${String(stream.streamIndex).padStart(4, "0")}`,
    animationId,
    classification: "zero-block-stream-structure-only",
    streamIndex: stream.streamIndex,
    timelineId,
    contextKind: stream.context.kind,
    contextCharacterId: stream.context.characterId ?? null,
    blockCount: 0,
    decodedSampleCount: 0,
    durationMs: null,
    assetIdentity,
    staticPlacementGraph: placement,
    cuePromoted: false,
    silenceEstablished: false,
    evidenceBoundary: machineBoundary(),
  };
}

function assertWorkspaceDescriptor(planDescriptor, observedDescriptor, label) {
  invariant(descriptorMatches(planDescriptor, observedDescriptor), `${label} differs from the audio ownership report binding`);
}

async function inspectMember({root, plan, candidateBySource, randomAudioMemberIds}) {
  const workspacePath = plan.workspace.path;
  const paths = {
    manifest: `${workspacePath}/migration.json`,
    sourceSwf: null,
    audioInventory: `${workspacePath}/audio-inventory.csv`,
    assetInventory: `${workspacePath}/asset-inventory.csv`,
    machineReport: `${workspacePath}/audit/machine/report.json`,
    audioRuntimeAudit: `${workspacePath}/audit/audio-runtime-evidence.json`,
    scenarioInventory: `${workspacePath}/audit/scenario-inventory.json`,
    frameDomainDisposition: `${workspacePath}/audit/frame-domain-disposition.json`,
    ffdecScriptIndex: `${workspacePath}/audit/machine/ffdec-script-index.txt`,
    ffdecScriptBundle: `${workspacePath}/audit/machine/ffdec-scripts.txt.gz`,
    preRuntimeScriptInventory: `${workspacePath}/audit/machine/g5-l4-pre-runtime-ffdec-script-inventory-candidate.json`,
    canonicalScriptInventory: `${workspacePath}/audit/script-inventory.json`,
  };
  const manifestInput = await readJsonProjectFile(root, paths.manifest, `${plan.animationId} migration manifest`);
  paths.sourceSwf = manifestInput.value.source?.swf;
  const [
    sourceSwfInput,
    audioInventoryInput,
    assetInventoryInput,
    machineReportInput,
    audioAuditInput,
    scenarioInput,
    dispositionInput,
    scriptIndexInput,
    scriptBundleInput,
    preRuntimeScriptInput,
    canonicalScriptInput,
  ] = await Promise.all([
    readProjectFile(root, paths.sourceSwf, `${plan.animationId} source SWF`),
    readProjectFile(root, paths.audioInventory, `${plan.animationId} audio inventory`),
    readProjectFile(root, paths.assetInventory, `${plan.animationId} asset inventory`),
    readJsonProjectFile(root, paths.machineReport, `${plan.animationId} machine report`),
    readJsonProjectFile(root, paths.audioRuntimeAudit, `${plan.animationId} audio runtime audit`),
    readJsonProjectFile(root, paths.scenarioInventory, `${plan.animationId} scenario inventory`),
    readJsonProjectFile(root, paths.frameDomainDisposition, `${plan.animationId} frame-domain disposition`),
    readProjectFile(root, paths.ffdecScriptIndex, `${plan.animationId} FFDec script index`),
    readProjectFile(root, paths.ffdecScriptBundle, `${plan.animationId} FFDec script bundle`),
    readJsonProjectFile(root, paths.preRuntimeScriptInventory, `${plan.animationId} pre-runtime script inventory`),
    readJsonProjectFile(root, paths.canonicalScriptInventory, `${plan.animationId} canonical script inventory`),
  ]);
  const manifest = manifestInput.value;
  const machineReport = machineReportInput.value;
  const audit = audioAuditInput.value;
  const scenario = scenarioInput.value;
  const disposition = dispositionInput.value;
  invariant(manifest.animationId === plan.animationId && machineReport.animationId === plan.animationId && audit.animationId === plan.animationId, `${plan.animationId}: workspace identities differ`);
  invariant(scenario.animationId === plan.animationId && disposition.animationId === plan.animationId, `${plan.animationId}: timeline evidence identities differ`);
  invariant(sourceSwfInput.descriptor.sha256 === manifest.source.swfSha256 && sourceSwfInput.descriptor.sha256 === plan.source.sha256, `${plan.animationId}: source SWF hash differs`);
  invariant(machineReport.source?.hashMatches === true && machineReport.source.observedSha256After === manifest.source.swfSha256, `${plan.animationId}: machine report source binding is stale`);
  invariant(audit.source?.hashMatches === true && audit.source.observedSha256 === manifest.source.swfSha256, `${plan.animationId}: audio audit source binding is stale`);
  invariant(audit.migrationStatusUnchanged === true, `${plan.animationId}: audio audit changed migration status`);
  assertWorkspaceDescriptor(plan.workspace.manifest, manifestInput.descriptor, `${plan.animationId} manifest`);
  assertWorkspaceDescriptor(plan.workspace.canonicalAudioInventory, audioInventoryInput.descriptor, `${plan.animationId} audio inventory`);
  assertWorkspaceDescriptor(plan.workspace.machineSwfAudit, machineReportInput.descriptor, `${plan.animationId} machine report`);
  assertWorkspaceDescriptor(plan.workspace.dedicatedMachineAudioAudit, audioAuditInput.descriptor, `${plan.animationId} audio audit`);

  assertMachineOutputBinding(machineReport, workspacePath, "audit/machine/ffdec-script-index.txt", scriptIndexInput.descriptor);
  const scriptOutput = assertMachineOutputBinding(machineReport, workspacePath, "audit/machine/ffdec-scripts.txt.gz", scriptBundleInput.descriptor);
  const scriptTextBytes = gunzipSync(scriptBundleInput.bytes);
  invariant(scriptTextBytes.length === scriptOutput.uncompressedBytes && sha256(scriptTextBytes) === scriptOutput.uncompressedSha256, `${plan.animationId}: expanded FFDec bundle differs from machine report`);
  const scriptText = scriptTextBytes.toString("utf8");
  const actionScriptAudioOperations = parseScriptAudioOperations(scriptText);
  invariant(sameCanonical(actionScriptAudioOperations, audit.actionScriptAudioOperations || []), `${plan.animationId}: ActionScript audio operation scan differs from audio audit`);
  invariant(preRuntimeScriptInput.value.summary?.scriptCount === machineReport.findings?.exportedScriptFileCount, `${plan.animationId}: pre-runtime script count differs`);
  invariant(canonicalScriptInput.value.summary?.scriptCount === machineReport.findings?.exportedScriptFileCount, `${plan.animationId}: canonical script count differs`);
  invariant(preRuntimeScriptInput.value.summary?.scriptBytes === canonicalScriptInput.value.summary?.scriptBytes, `${plan.animationId}: script-byte summaries differ`);

  const parsedAudio = parseAudioInventory(audioInventoryInput.bytes.toString("utf8"));
  const parsedAssets = parseAudioInventory(assetInventoryInput.bytes.toString("utf8"));
  invariant(parsedAudio.headers.includes("cue_id") && parsedAudio.headers.includes("source_character_id"), `${plan.animationId}: audio inventory headers are incomplete`);
  invariant(parsedAssets.headers.includes("asset_id") && parsedAssets.headers.includes("swf_character_id") && parsedAssets.headers.includes("type"), `${plan.animationId}: asset inventory headers are incomplete`);
  const assetByCharacterId = mapByCharacterId(parsedAssets.rows);
  const scenarioByTimeline = new Map((scenario.timelineInventory || []).map((timeline) => [timeline.timelineId, timeline]));
  const dispositionByTimeline = new Map((disposition.timelines || []).map((timeline) => [timeline.timelineId, timeline]));
  const exactExternal = audit.externalAudio?.exactAssociations || [];
  const defineSounds = audit.embeddedAudio?.defineSounds || [];
  const soundStreams = audit.embeddedAudio?.soundStreams || [];
  const startSounds = audit.embeddedAudio?.startSounds || [];
  const durationfulDefineSounds = defineSounds.filter(({durationMs}) => Number(durationMs) > 0);
  const durationfulStreams = soundStreams.filter(({durationMs}) => Number(durationMs) > 0);
  const expectedInventoryRowCount = exactExternal.length + durationfulDefineSounds.length + durationfulStreams.length;
  invariant(parsedAudio.rows.length === expectedInventoryRowCount && audit.inventory?.rowCount === expectedInventoryRowCount, `${plan.animationId}: audio inventory cardinality differs from machine facts`);

  const cues = [];
  for (const row of parsedAudio.rows) {
    if (row.cue_id.startsWith("catalog-audio-")) {
      const externalIndex = parseCueIndex(row.cue_id, "catalog-audio") - 1;
      invariant(externalIndex >= 0 && externalIndex < exactExternal.length, `${plan.animationId}/${row.cue_id}: external index is invalid`);
      cues.push(buildExternalCue({animationId: plan.animationId, row, external: exactExternal[externalIndex], candidateBySource}));
    } else if (row.cue_id.startsWith("embedded-stream-")) {
      const streamIndex = parseCueIndex(row.cue_id, "embedded-stream");
      const matches = durationfulStreams.filter((stream) => Number(stream.streamIndex) === streamIndex);
      invariant(matches.length === 1, `${plan.animationId}/${row.cue_id}: durationful stream match is missing or duplicated`);
      cues.push(buildStreamCue({
        animationId: plan.animationId,
        row,
        stream: matches[0],
        assetByCharacterId,
        scenarioByTimeline,
        dispositionByTimeline,
        manifest,
      }));
    } else if (row.cue_id.startsWith("embedded-define-sound-")) {
      const characterId = parseCueIndex(row.cue_id, "embedded-define-sound");
      const matches = durationfulDefineSounds.filter((sound) => Number(sound.characterId) === characterId);
      invariant(matches.length === 1, `${plan.animationId}/${row.cue_id}: DefineSound match is missing or duplicated`);
      cues.push(buildDefineSoundCue({
        animationId: plan.animationId,
        row,
        sound: matches[0],
        startSounds,
        actionScriptAudioOperations,
        assetByCharacterId,
        scenarioByTimeline,
        dispositionByTimeline,
        manifest,
        randomAudioMemberIds,
      }));
    } else throw new Error(`${plan.animationId}: unsupported inventory cue ${row.cue_id}`);
  }

  invariant(new Set(cues.map(({cueCandidateId}) => cueCandidateId)).size === cues.length, `${plan.animationId}: cue candidate IDs are duplicated`);
  const zeroBlockStreamStructures = soundStreams
    .filter(({blockCount}) => Number(blockCount) === 0)
    .map((stream) => buildZeroBlockStructure({
      animationId: plan.animationId,
      stream,
      assetByCharacterId,
      scenarioByTimeline,
      dispositionByTimeline,
    }));
  invariant(soundStreams.length === durationfulStreams.length + zeroBlockStreamStructures.length, `${plan.animationId}: stream partition is incomplete`);

  const member = {
    ordinal: plan.ordinal,
    animationId: plan.animationId,
    assetId: plan.assetId,
    releaseRole: plan.releaseRole,
    source: {
      path: manifest.source.swf,
      bytes: sourceSwfInput.descriptor.bytes,
      sha256: manifest.source.swfSha256,
    },
    inputBindings: {
      manifest: manifestInput.descriptor,
      audioInventory: audioInventoryInput.descriptor,
      assetInventory: assetInventoryInput.descriptor,
      machineReport: machineReportInput.descriptor,
      audioRuntimeAudit: audioAuditInput.descriptor,
      scenarioInventory: scenarioInput.descriptor,
      frameDomainDisposition: dispositionInput.descriptor,
      ffdecScriptIndex: scriptIndexInput.descriptor,
      ffdecScriptBundle: {
        ...scriptBundleInput.descriptor,
        expandedBytes: scriptTextBytes.length,
        expandedSha256: sha256(scriptTextBytes),
      },
      preRuntimeScriptInventory: preRuntimeScriptInput.descriptor,
      canonicalScriptInventory: canonicalScriptInput.descriptor,
    },
    summary: {
      canonicalInventoryCueCount: cues.length,
      externalCueCount: cues.filter(({origin}) => origin === "external").length,
      embeddedDefineSoundCueCount: cues.filter(({origin}) => origin === "embedded-define-sound").length,
      embeddedStreamCueCount: cues.filter(({origin}) => origin === "embedded-stream").length,
      placementGraphObservedStreamCueCount: cues.filter(({classification}) => classification === "embedded-stream-root-placement-graph-observed-candidate").length,
      placementGraphNotProvenStreamCueCount: cues.filter(({classification}) => classification === "embedded-stream-root-placement-graph-not-proven-candidate").length,
      zeroBlockStreamStructureCount: zeroBlockStreamStructures.length,
      assetInventoryRowCount: parsedAssets.rows.length,
      soundDefinitionAssetRowCount: parsedAssets.rows.filter(({type}) => type === "structural-sound-definition-candidate").length,
      ffdecScriptCount: Number(preRuntimeScriptInput.value.summary.scriptCount),
      ffdecScriptBytes: Number(preRuntimeScriptInput.value.summary.scriptBytes),
      actionScriptAudioOperationCount: actionScriptAudioOperations.length,
    },
    actionScriptAudioOperations,
    cueCandidates: cues,
    zeroBlockStreamStructures,
    evidenceBoundary: machineBoundary(),
  };
  member.memberFingerprintSha256 = memberFingerprint(member);
  return {
    reportMember: member,
    scriptText,
    hostAuthority: audit.authority?.hostScript,
    scenario,
    manifest,
    embeddedAudio: audit.embeddedAudio,
  };
}

async function walkFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(candidate));
    else result.push(candidate);
  }
  return result.sort(compareText);
}

async function extractFqHostContract(hostSwfInput) {
  const workspace = await mkdtemp(path.join(tmpdir(), "help-math-g5-l4-audio-host-"));
  try {
    const output = path.join(workspace, "scripts");
    await execFileAsync("ffdec", ["-cli", "-export", "script", output, hostSwfInput.absolute], {
      maxBuffer: 100 * 1024 * 1024,
    });
    const files = (await walkFiles(output)).filter((file) => file.endsWith(".as"));
    const records = [];
    for (const file of files) {
      const text = await readFile(file, "utf8");
      records.push({relativePath: portable(path.relative(output, file)), text});
    }
    const contract = deriveFqHostUrlContract(records);
    invariant(contract.verified === true, "indexELM final-quiz URL contract is not source-verified");
    return {
      extractorCommand: "ffdec -cli -export script",
      extractedScriptCount: files.length,
      ...contract,
      runtimeReachabilityEstablished: false,
    };
  } finally {
    await rm(workspace, {recursive: true, force: true});
  }
}

function parseLiteralFqLabels(scriptText) {
  const match = scriptText.match(/_global\.quizLabelArray\s*=\s*(\[(?:"Q\d+"\s*,?\s*)+\])\s*;/);
  if (!match) return [];
  let labels;
  try {
    labels = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`FQ literal quizLabelArray is malformed: ${error.message}`);
  }
  return labels;
}

function deriveFqChildContract(memberInternal) {
  const {reportMember: member, scenario, scriptText} = memberInternal;
  const questionTimelines = (scenario.timelineInventory || []).filter((timeline) =>
    (timeline.frameLabels || []).some(({label}) => /^Q\d+$/.test(label)),
  );
  const timeline = questionTimelines.length === 1 ? questionTimelines[0] : null;
  const questionFrames = timeline
    ? timeline.frameLabels.filter(({label}) => /^Q\d+$/.test(label)).map(({frame, label}) => ({frame, label}))
    : [];
  const literalQuestionLabels = parseLiteralFqLabels(scriptText);
  const answerReleaseHandlerCounts = timeline
    ? questionFrames.map(({frame, label}) => {
      const state = (timeline.controlStates || []).find((candidate) => candidate.frame === frame);
      return {
        label,
        frame,
        count: (state?.evidence || []).filter(({script}) => /CLIPACTIONRECORD on\(release\)\.as$/.test(script || "")).length,
      };
    })
    : [];
  const checks = {
    randomSelection: /random\(_global\.quizLabelArray\.length\)/.test(scriptText),
    selectedRemovedWithoutReplacement: /_global\.quizLabelArray\.splice\(_global\.tempQNo\s*,\s*1\)/.test(scriptText),
    sequentialSelection: /_global\.qLabelName\s*=\s*_global\.quizLabelArray\[_global\.totQuizCount\s*-\s*1\]/.test(scriptText),
    selectedQuestionEntered: /gotoAndStop\(_global\.qLabelName\)/.test(scriptText),
    englishQuestionAudioControl: /_root\.doPlayFQQuestionAudio\(this\s*,\s*"EN"\)/.test(scriptText),
    spanishQuestionAudioControl: /_root\.doPlayFQQuestionAudio\(this\s*,\s*"SP"\)/.test(scriptText),
    englishAnswerAudioControl: /_root\.doPlayFQAnswerAudio\(this\s*,\s*"EN"\)/.test(scriptText),
    spanishAnswerAudioControl: /_root\.doPlayFQAnswerAudio\(this\s*,\s*"SP"\)/.test(scriptText),
  };
  const positiveAudioControls = checks.englishQuestionAudioControl && checks.spanishQuestionAudioControl
    && checks.englishAnswerAudioControl && checks.spanishAnswerAudioControl;
  if (member.animationId === "course-g05-l04-fq-001") {
    invariant(questionTimelines.length === 0 && literalQuestionLabels.length === 0 && !positiveAudioControls, `${member.animationId}: expected no positive FQ audio-control pattern`);
  } else {
    invariant(timeline?.timelineId === "sprite-694" && timeline.frameCount === 56, `${member.animationId}: FQ question timeline identity changed`);
    invariant(timeline.structuralReachability === "reachable-from-root-placement-graph", `${member.animationId}: FQ question timeline static placement changed`);
    invariant(sameCanonical(questionFrames.map(({label}) => label), EXPECTED_FQ_LABELS), `${member.animationId}: Q1..Q18 labels changed`);
    invariant(sameCanonical(questionFrames.map(({frame}) => frame), Array.from({length: 18}, (_, index) => index + 2)), `${member.animationId}: Q1..Q18 frames changed`);
    invariant(sameCanonical(literalQuestionLabels, EXPECTED_FQ_LABELS), `${member.animationId}: literal Q1..Q18 array changed`);
    invariant(answerReleaseHandlerCounts.every(({count}) => count === 4), `${member.animationId}: a question lacks four answer release handlers`);
    invariant(positiveAudioControls && checks.selectedQuestionEntered, `${member.animationId}: bilingual FQ controls are incomplete`);
  }
  const selectionMode = checks.randomSelection && checks.selectedRemovedWithoutReplacement
    ? "random-without-replacement-static-source-contract"
    : checks.sequentialSelection
      ? "sequential-static-source-contract"
      : "no-positive-selection-contract-observed";
  return {
    animationId: member.animationId,
    classification: positiveAudioControls ? "positive-static-fq-audio-control-candidate" : "no-positive-fq-audio-control-pattern-observed",
    questionTimeline: timeline ? {
      timelineId: timeline.timelineId,
      frameCount: timeline.frameCount,
      structuralReachabilityLabel: timeline.structuralReachability,
    } : null,
    questionFrames,
    literalQuestionLabels,
    answerReleaseHandlerCounts,
    selectionMode,
    scriptChecks: checks,
    positiveStaticAudioControlObserved: positiveAudioControls,
    completeNegativeProofEstablished: false,
    runtimeSeedEstablished: false,
    naturalRuntimeTraceEstablished: false,
    evidenceBoundary: machineBoundary(),
  };
}

function expectedFqPaths() {
  const result = [];
  for (const {language, directory} of EXPECTED_FQ_LANGUAGES) {
    for (let questionNumber = 1; questionNumber <= EXPECTED_FQ_LABELS.length; questionNumber += 1) {
      const variants = [{kind: "question", option: null, basename: `Q${questionNumber}.mp3`}]
        .concat(EXPECTED_FQ_OPTIONS.map((option) => ({kind: "answer", option, basename: `Q${questionNumber}${option}.mp3`})));
      for (const variant of variants) {
        result.push({
          expectedPathId: `fq-q${String(questionNumber).padStart(2, "0")}-${variant.kind}${variant.option ? `-${variant.option.toLowerCase()}` : ""}-${language}`,
          language,
          languageDirectory: directory,
          questionNumber,
          kind: variant.kind,
          option: variant.option,
          sourceFile: `${FQ_BASE_PATH}/${directory}/${variant.basename}`,
        });
      }
    }
  }
  invariant(result.length === 180, `Expected 180 G5 L4 FQ paths, found ${result.length}`);
  return result;
}

async function assertMissingProjectPath(root, relativePath) {
  const safePath = projectRelative(root, relativePath, `Missing path ${relativePath}`);
  const absolute = path.resolve(root, safePath);
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Path represented as missing exists: ${safePath}`);
}

async function buildFqStaticRoute({root, ownershipReport, fqContracts, hostContract}) {
  const groupCandidates = ownershipReport.candidateFiles
    .filter(({classification}) => classification === "shared-final-quiz-group-candidate")
    .sort((left, right) => compareText(left.source.path, right.source.path));
  invariant(groupCandidates.length === 83, `Expected 83 FQ group candidates, found ${groupCandidates.length}`);
  invariant(groupCandidates.every((candidate) => candidate.candidateGrouping.groupIds.length === 1 && candidate.candidateGrouping.groupIds[0] === FQ_AUDIO_GROUP_ID), "FQ group membership changed");
  const groupByPath = new Map(groupCandidates.map((candidate) => [candidate.source.path, candidate]));
  const expected = expectedFqPaths();
  const expectedSet = new Set(expected.map(({sourceFile}) => sourceFile));
  const anomalies = groupCandidates
    .filter(({source}) => !expectedSet.has(source.path))
    .map((candidate) => ({
      candidateId: candidate.candidateId,
      source: candidate.source,
      classification: "unmatched-fq-group-candidate-not-promoted",
      cuePromoted: false,
    }));
  const expectedPaths = [];
  for (const row of expected) {
    const candidate = groupByPath.get(row.sourceFile) || null;
    if (!candidate) await assertMissingProjectPath(root, row.sourceFile);
    expectedPaths.push({
      ...row,
      status: candidate ? "hash-bound-canonical-path-candidate-not-promoted" : "missing-source",
      candidateId: candidate?.candidateId || null,
      source: candidate?.source || null,
      staticPositiveOwnerCandidateIds: candidate ? [...FQ_POSITIVE_STATIC_OWNER_IDS] : [],
      cuePromoted: false,
      runtimeReachabilityEstablished: false,
      audibleContentEstablished: false,
      spokenLanguageEstablished: false,
      synchronizationEstablished: false,
    });
  }
  const present = expectedPaths.filter(({status}) => status === "hash-bound-canonical-path-candidate-not-promoted");
  const missing = expectedPaths.filter(({status}) => status === "missing-source");
  invariant(present.length === 83 && missing.length === 97 && anomalies.length === 0, `FQ matrix expected 83 present / 97 missing / 0 anomalies, found ${present.length}/${missing.length}/${anomalies.length}`);
  const languageSummary = Object.fromEntries(EXPECTED_FQ_LANGUAGES.map(({language}) => {
    const rows = expectedPaths.filter((row) => row.language === language);
    return [language, {
      expected: rows.length,
      presentCandidates: rows.filter(({status}) => status.startsWith("hash-bound")).length,
      missingSources: rows.filter(({status}) => status === "missing-source").length,
    }];
  }));
  const kindSummary = Object.fromEntries(["question", "answer"].map((kind) => {
    const rows = expectedPaths.filter((row) => row.kind === kind);
    return [kind, {
      expected: rows.length,
      presentCandidates: rows.filter(({status}) => status.startsWith("hash-bound")).length,
      missingSources: rows.filter(({status}) => status === "missing-source").length,
    }];
  }));
  invariant(languageSummary.en.presentCandidates === 41 && languageSummary.en.missingSources === 49, "English FQ matrix changed");
  invariant(languageSummary.es.presentCandidates === 42 && languageSummary.es.missingSources === 48, "Spanish FQ matrix changed");
  invariant(kindSummary.question.presentCandidates === 15 && kindSummary.question.missingSources === 21, "FQ question matrix changed");
  invariant(kindSummary.answer.presentCandidates === 68 && kindSummary.answer.missingSources === 76, "FQ answer matrix changed");
  const currentCatalogOwnerIds = [...new Set(groupCandidates.flatMap((candidate) => candidate.candidateGrouping.ownerAnimationIds))].sort(compareText);
  invariant(sameCanonical(currentCatalogOwnerIds, FQ_MEMBER_IDS), "Current FQ catalog owner set changed");
  invariant(sameCanonical(fqContracts.filter(({positiveStaticAudioControlObserved}) => positiveStaticAudioControlObserved).map(({animationId}) => animationId).sort(compareText), [...FQ_POSITIVE_STATIC_OWNER_IDS].sort(compareText)), "Positive FQ static owner set changed");
  return {
    classification: "source-static-final-quiz-host-path-matrix-candidate",
    groupId: FQ_AUDIO_GROUP_ID,
    hostUrlContract: hostContract,
    childContracts: fqContracts,
    currentCatalogOwnerIds,
    staticPositiveOwnerCandidateIds: [...FQ_POSITIVE_STATIC_OWNER_IDS],
    currentCatalogMemberCandidateReferenceCount: groupCandidates.length * currentCatalogOwnerIds.length,
    positiveStaticMemberCandidateReferenceCount: groupCandidates.length * FQ_POSITIVE_STATIC_OWNER_IDS.length,
    catalogOwnershipChanged: false,
    summary: {
      expectedPathCount: expectedPaths.length,
      presentCandidateCount: present.length,
      missingSourceCount: missing.length,
      unmatchedCandidateCount: anomalies.length,
      missingPathPhysicalCheckCount: missing.length,
      languageSummary,
      kindSummary,
      presentCandidateSetSha256: fingerprint(present.map(({sourceFile, source}) => ({sourceFile, source}))),
      missingPathSetSha256: fingerprint(missing.map(({sourceFile}) => sourceFile)),
    },
    expectedPaths,
    anomalies,
    unresolved: [
      "FQ002-random-seed-and-natural-runtime-trace",
      "host-and-child-runtime-activation",
      "97-canonical-source-paths-missing",
      "spoken-language-and-audible-content",
      "start-stop-pause-replay-and-synchronization",
    ],
    evidenceBoundary: machineBoundary(),
  };
}

function buildRandomAudioContract({mainScriptText, lessonXmlText, shellInternal, randomAudioMemberIds}) {
  const activeXml = lessonXmlText.replace(/<!--[\s\S]*?-->/g, "");
  const activeRandomPages = [...activeXml.matchAll(/<Page\b[^>]*\bRandomAudio="Yes"[^>]*>([^<]+)<\/Page>/g)]
    .map((match) => match[1].trim());
  invariant(sameCanonical(activeRandomPages, ["IR/L4RW01.swf"]), `Active RandomAudio pages changed: ${activeRandomPages.join(", ")}`);
  invariant(/RandomAudioDetails\s*=\s*"[^"]*~IR~L4RW01\.swf/.test(mainScriptText), "MainScript no longer names IR/L4RW01.swf in RandomAudioDetails");
  invariant(/\.rndAud\s*=\s*random\(2\)/.test(shellInternal.scriptText), "Shell random(2) audio selector is missing");
  invariant(/\.rndAudLabel\s*=\s*"S"\s*\+\s*[^;]*\.rndAud/.test(shellInternal.scriptText), "Shell S+random audio label expression is missing");
  invariant(/\.attachSound\([^)]*\.rndAudLabel\)/.test(shellInternal.scriptText), "Shell dynamic attachSound expression is missing");
  const exportedLinkages = (shellInternal.embeddedAudio?.exportedSoundLinkages || []).map(({linkage}) => linkage).sort(compareText);
  invariant(sameCanonical(exportedLinkages, ["S1", "S2"]), `Shell exported random-audio linkage set changed: ${exportedLinkages.join(", ")}`);
  const computedLabelCandidatesUnderAvm1RandomContract = ["S0", "S1"];
  const overlap = computedLabelCandidatesUnderAvm1RandomContract.filter((label) => exportedLinkages.includes(label));
  return {
    classification: "shell-random-audio-dynamic-linkage-candidate",
    activeLessonPagePaths: activeRandomPages,
    staticHostDependencyCandidateAnimationIds: randomAudioMemberIds,
    randomExpression: "random(2)",
    labelExpression: "S + rndAud",
    computedLabelCandidatesUnderAvm1RandomContract,
    exportedLinkages,
    overlappingLinkageCandidates: overlap,
    computedCandidatesWithoutExport: computedLabelCandidatesUnderAvm1RandomContract.filter((label) => !exportedLinkages.includes(label)),
    exportsWithoutComputedCandidate: exportedLinkages.filter((label) => !computedLabelCandidatesUnderAvm1RandomContract.includes(label)),
    exactDynamicLinkageSelectionResolved: false,
    naturalRuntimeActivationEstablished: false,
    evidenceBoundary: machineBoundary(),
  };
}

function countBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = String(selector(item));
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => compareText(left, right)));
}

function descriptorProjection(input) {
  return input.descriptor;
}

function findRelease(releases, releaseId) {
  const matches = (releases.releases || []).filter((release) => release.releaseId === releaseId);
  invariant(matches.length === 1, `Expected one release ${releaseId}, found ${matches.length}`);
  return matches[0];
}

function validateHostAuthorityConsensus(internals, hostSwfDescriptor) {
  const authorities = internals.map(({hostAuthority}) => hostAuthority);
  invariant(authorities.every(Boolean), "A member audio audit lacks host authority evidence");
  invariant(authorities.every((authority) => sameCanonical(authority, authorities[0])), "Member audio audits disagree about host authority");
  const authority = authorities[0];
  invariant(authority.sourceFile === HOST_SWF_PATH && authority.sha256 === hostSwfDescriptor.sha256, "Host authority source binding differs");
  invariant(authority.conventions?.courseSpanishPage?.verified === true && authority.conventions?.finalQuiz?.verified === true, "Required host audio conventions are not verified");
  return {
    memberAuditConsensusCount: authorities.length,
    ...authority,
  };
}

function collectUnmappedCandidates({ownershipReport, searchableTexts}) {
  const results = [];
  for (const item of ownershipReport.unresolvedUnmappedCandidates || []) {
    const basename = path.basename(item.source.path);
    const lower = basename.toLowerCase();
    const literalReferences = searchableTexts.flatMap(({scope, text}) => {
      const matches = text.toLowerCase().split(lower).length - 1;
      return matches > 0 ? [{scope, occurrences: matches}] : [];
    });
    invariant(literalReferences.length === 0, `${basename}: an exact literal reference is now present`);
    results.push({
      candidateId: item.candidateId,
      source: item.source,
      classification: "unmapped-catalog-file-static-reference-not-found",
      literalReferenceSearch: {
        searchedFfdecBundleCount: 55,
        searchedReadableLessonSourceCount: 2,
        exactBasenameOccurrenceCount: 0,
        occurrences: literalReferences,
      },
      status: "pending-assignment-or-reviewed-exclusion",
      negativeProofEstablished: false,
      assignmentAccepted: false,
      exclusionAccepted: false,
      evidenceBoundary: machineBoundary(),
    });
  }
  return results;
}

function validateNoProhibitedTrueFields(value, pathLabel = "report") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoProhibitedTrueFields(item, `${pathLabel}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_TRUE_FIELDS.has(key)) invariant(child === false, `${pathLabel}.${key} must remain false`);
    validateNoProhibitedTrueFields(child, `${pathLabel}.${key}`);
  }
}

export async function buildReport({root = projectRoot} = {}) {
  const safeRoot = path.resolve(root);
  const [
    ownershipInput,
    sourceScopeInput,
    releasesInput,
    sourceFilesInput,
    audioGroupsInput,
    hostSwfInput,
    mainScriptInput,
    lessonXmlInput,
    generatorInput,
    ownershipGeneratorInput,
    inventoryHelperInput,
    audioAuditHelperInput,
  ] = await Promise.all([
    readJsonProjectFile(safeRoot, OWNERSHIP_REPORT_PATH, "G5 L4 audio ownership report"),
    readJsonProjectFile(safeRoot, SOURCE_SCOPE_PATH, "G5 L4 source scope"),
    readJsonProjectFile(safeRoot, LESSON_RELEASES_PATH, "lesson releases"),
    readJsonProjectFile(safeRoot, SOURCE_FILES_PATH, "source file catalog"),
    readJsonProjectFile(safeRoot, AUDIO_GROUPS_PATH, "audio group catalog"),
    readProjectFile(safeRoot, HOST_SWF_PATH, "indexELM host SWF"),
    readProjectFile(safeRoot, LESSON_MAIN_SCRIPT_PATH, "G5 L4 MainScript_New.as"),
    readProjectFile(safeRoot, LESSON_XML_PATH, "G5 L4 index.xml"),
    readProjectFile(safeRoot, GENERATOR_PATH, "audio static reconciliation generator"),
    readProjectFile(safeRoot, AUDIO_OWNERSHIP_GENERATOR_PATH, "audio ownership generator"),
    readProjectFile(safeRoot, AUDIO_INVENTORY_HELPER_PATH, "audio inventory helper"),
    readProjectFile(safeRoot, AUDIO_AUDIT_HELPER_PATH, "audio audit helper"),
  ]);
  const ownershipReport = validateLessonAudioOwnershipReadiness(ownershipInput.value);
  invariant(ownershipReport.releaseId === RELEASE_ID && sourceScopeInput.value.releaseId === RELEASE_ID, "G5 L4 release identity differs");
  const release = findRelease(releasesInput.value, RELEASE_ID);
  invariant(release.publicationMode === "atomic" && release.members.length === 55, "G5 L4 release membership changed");
  invariant(sourceFilesInput.value.files?.length === 7919, "Source-file catalog cardinality changed");
  invariant((audioGroupsInput.value.groups || []).some(({groupId}) => groupId === FQ_AUDIO_GROUP_ID), "G5 L4 FQ audio group is missing");

  const rebuiltOwnership = await buildLessonAudioOwnershipReadiness({
    root: safeRoot,
    releaseId: RELEASE_ID,
    scopePath: SOURCE_SCOPE_PATH,
  });
  invariant(stableJson(rebuiltOwnership) === ownershipInput.bytes.toString("utf8"), "Checked-in audio ownership report is not current" );
  const candidateBySource = new Map(ownershipReport.candidateFiles.map((candidate) => [candidate.source.path, candidate]));
  const randomAudioMembers = ownershipReport.memberPlans.filter(({source}) => source.path === "HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf");
  invariant(randomAudioMembers.length === 1, "IR/L4RW01 release member is missing or duplicated");
  const randomAudioMemberIds = randomAudioMembers.map(({animationId}) => animationId);

  const internals = [];
  for (const plan of ownershipReport.memberPlans) {
    internals.push(await inspectMember({root: safeRoot, plan, candidateBySource, randomAudioMemberIds}));
  }
  const members = internals.map(({reportMember}) => reportMember);
  const allCues = members.flatMap(({cueCandidates}) => cueCandidates);
  const zeroBlockStructures = members.flatMap(({zeroBlockStreamStructures}) => zeroBlockStreamStructures);
  const hostAuthorityConsensus = validateHostAuthorityConsensus(internals, hostSwfInput.descriptor);
  const fqHostContract = await extractFqHostContract(hostSwfInput);
  invariant(fqHostContract.extractedScriptCount === hostAuthorityConsensus.extractedScriptCount, "Current host extraction script count differs from member audio audits");
  invariant(fqHostContract.evidenceScript === hostAuthorityConsensus.conventions.finalQuiz.evidenceScript, "FQ host contract uses a different script than the member audio audits");
  const fqContracts = FQ_MEMBER_IDS.map((animationId) => {
    const matches = internals.filter(({reportMember}) => reportMember.animationId === animationId);
    invariant(matches.length === 1, `${animationId}: FQ member evidence is missing or duplicated`);
    return deriveFqChildContract(matches[0]);
  });
  const fqStaticRoute = await buildFqStaticRoute({root: safeRoot, ownershipReport, fqContracts, hostContract: fqHostContract});
  const shellMatches = internals.filter(({reportMember}) => reportMember.animationId === "shell-course-g05-l04-index-local");
  invariant(shellMatches.length === 1, "G5 L4 shell member is missing or duplicated");
  const randomAudioContract = buildRandomAudioContract({
    mainScriptText: mainScriptInput.bytes.toString("utf8"),
    lessonXmlText: lessonXmlInput.bytes.toString("utf8"),
    shellInternal: shellMatches[0],
    randomAudioMemberIds,
  });
  const searchableTexts = internals.map(({reportMember, scriptText}) => ({scope: `${reportMember.animationId}:ffdec-scripts`, text: scriptText}));
  searchableTexts.push(
    {scope: LESSON_MAIN_SCRIPT_PATH, text: mainScriptInput.bytes.toString("utf8")},
    {scope: LESSON_XML_PATH, text: lessonXmlInput.bytes.toString("utf8")},
  );
  const unmappedCandidates = collectUnmappedCandidates({ownershipReport, searchableTexts});

  const externalRoutes = allCues.filter(({classification}) => classification === "external-page-host-path-hash-bound-candidate");
  invariant(externalRoutes.length === 50, `Expected 50 external page routes, found ${externalRoutes.length}`);
  const routingLanguageCandidateCounts = {
    en: fqStaticRoute.expectedPaths.filter(({status, language}) => status.startsWith("hash-bound") && language === "en").length,
    es: externalRoutes.length + fqStaticRoute.expectedPaths.filter(({status, language}) => status.startsWith("hash-bound") && language === "es").length,
    unresolved: unmappedCandidates.length,
  };
  invariant(sameCanonical(routingLanguageCandidateCounts, {en: 41, es: 92, unresolved: 2}), "Routing-language candidate counts changed");

  const cueClassificationCounts = countBy(allCues, ({classification}) => classification);
  const zeroBlockReachabilityCounts = countBy(zeroBlockStructures, ({staticPlacementGraph}) => staticPlacementGraph.structuralReachabilityLabel);
  const assetInventoryRowCount = members.reduce((sum, member) => sum + member.summary.assetInventoryRowCount, 0);
  const soundDefinitionAssetRowCount = members.reduce((sum, member) => sum + member.summary.soundDefinitionAssetRowCount, 0);
  const ffdecScriptCount = members.reduce((sum, member) => sum + member.summary.ffdecScriptCount, 0);
  const ffdecScriptBytes = members.reduce((sum, member) => sum + member.summary.ffdecScriptBytes, 0);
  const actionScriptAudioOperations = members.flatMap(({animationId, actionScriptAudioOperations: operations}) => operations.map((operation) => ({animationId, ...operation})));
  const membersWithPlacementGraphObservedStream = new Set(allCues.filter(({classification}) => classification === "embedded-stream-root-placement-graph-observed-candidate").map(({animationId}) => animationId));
  const membersWithPlacementGraphNotProvenStream = new Set(allCues.filter(({classification}) => classification === "embedded-stream-root-placement-graph-not-proven-candidate").map(({animationId}) => animationId));
  const report = {
    schemaVersion: 1,
    artifactType: "g5-l4-audio-static-cue-reconciliation",
    releaseId: RELEASE_ID,
    status: "machine-static-reconciliation-complete-runtime-evidence-unresolved",
    scope: "source-hash-inventory-machine-asset-script-scenario-frame-domain-and-host-static-reconciliation-only",
    generator: descriptorProjection(generatorInput),
    sourceBindings: {
      audioOwnershipReadiness: descriptorProjection(ownershipInput),
      sourceScope: descriptorProjection(sourceScopeInput),
      lessonReleases: descriptorProjection(releasesInput),
      sourceFilesCatalog: descriptorProjection(sourceFilesInput),
      audioGroupsCatalog: descriptorProjection(audioGroupsInput),
      hostSwf: descriptorProjection(hostSwfInput),
      lessonMainScript: descriptorProjection(mainScriptInput),
      lessonXml: descriptorProjection(lessonXmlInput),
      audioOwnershipGenerator: descriptorProjection(ownershipGeneratorInput),
      audioInventoryHelper: descriptorProjection(inventoryHelperInput),
      audioAuditHelper: descriptorProjection(audioAuditHelperInput),
    },
    hostAuthorityConsensus,
    summary: {
      memberCount: members.length,
      physicalCatalogCandidateFileCount: ownershipReport.summary.candidateFileCount,
      externalPageCandidateFileCount: externalRoutes.length,
      fqGroupCandidateFileCount: fqStaticRoute.summary.presentCandidateCount,
      unmappedCandidateFileCount: unmappedCandidates.length,
      canonicalInventoryCueCount: allCues.length,
      externalInventoryCueCount: allCues.filter(({origin}) => origin === "external").length,
      embeddedDefineSoundCueCount: allCues.filter(({origin}) => origin === "embedded-define-sound").length,
      embeddedStreamCueCount: allCues.filter(({origin}) => origin === "embedded-stream").length,
      cueClassificationCounts,
      inventoryIdentityTriangulatedCount: allCues.length,
      zeroBlockStreamStructureCount: zeroBlockStructures.length,
      zeroBlockStructuralReachabilityCounts: zeroBlockReachabilityCounts,
      membersWithPlacementGraphObservedStreamCount: membersWithPlacementGraphObservedStream.size,
      membersWithPlacementGraphNotProvenStreamCount: membersWithPlacementGraphNotProvenStream.size,
      assetInventoryCount: members.length,
      assetInventoryRowCount,
      soundDefinitionAssetRowCount,
      ffdecBundleCount: members.length,
      ffdecScriptCount,
      ffdecScriptBytes,
      actionScriptAudioOperationCount: actionScriptAudioOperations.length,
      actionScriptAudioOperationCounts: countBy(actionScriptAudioOperations, ({operation}) => operation),
      fqExpectedPathCount: fqStaticRoute.summary.expectedPathCount,
      fqPresentCandidateCount: fqStaticRoute.summary.presentCandidateCount,
      fqMissingSourceCount: fqStaticRoute.summary.missingSourceCount,
      fqUnmatchedCandidateCount: fqStaticRoute.summary.unmatchedCandidateCount,
      routingLanguageCandidateCounts,
      spokenLanguageEstablishedFileCount: 0,
      runtimeReachabilityEstablishedCueCount: 0,
      audibleContentEstablishedCueCount: 0,
      synchronizationEstablishedCueCount: 0,
      listeningAcceptedCueCount: 0,
      ownerAcceptedCueCount: 0,
      strictCompleteMemberCount: 0,
      publishedMemberCount: 0,
      memberInputSetSha256: fingerprint(members.map(({animationId, memberFingerprintSha256}) => ({animationId, memberFingerprintSha256}))),
      cueSetSha256: fingerprint(allCues.map(({cueCandidateId, cueFingerprintSha256}) => ({cueCandidateId, cueFingerprintSha256}))),
      zeroBlockStructureSetSha256: fingerprint(zeroBlockStructures),
    },
    routingLanguageBoundary: {
      candidateCounts: routingLanguageCandidateCounts,
      interpretation: "EA/SA and verified host branches establish routing-language candidates only. They do not establish spoken language or audible content.",
      spokenLanguageEstablishedFileCount: 0,
      languageAcceptedFileCount: 0,
    },
    randomAudioContract,
    finalQuizStaticRoute: fqStaticRoute,
    actionScriptAudioOperations,
    members,
    unmappedCandidates,
    remainingBlockers: [
      "all-natural-runtime-cue-reachability-and-entry-state-traces-unresolved",
      "57-durationful-streams-have-no-proven-root-placement-graph",
      "shell-random-audio-dynamic-linkage-set-requires-runtime-and-owner-disposition",
      "97-canonical-final-quiz-audio-paths-are-missing",
      "two-catalog-mp3-files-remain-unmapped",
      "spoken-language-and-audible-content-unverified",
      "start-stop-pause-replay-and-runtime-synchronization-unverified",
      "named-human-authorized-original-runtime-listening-missing",
    ],
    authorityBoundary: {
      acceptanceNeutral: true,
      audioPlayed: false,
      sourceFilesWritten: 0,
      workspaceFilesWritten: 0,
      canonicalInventoriesWritten: 0,
      migrationStatusOrReviewFilesWritten: 0,
      ledgersWritten: 0,
      runtimeReachabilityEstablished: false,
      audibleContentEstablished: false,
      spokenLanguageEstablished: false,
      synchronizationEstablished: false,
      listeningAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    acceptanceEffects: {
      cueMapAccepted: false,
      runtimeReachabilityAccepted: false,
      audibleContentAccepted: false,
      spokenLanguageAccepted: false,
      synchronizationAccepted: false,
      listeningAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return validateReport(report);
}

function validateDescriptor(descriptor, label) {
  invariant(typeof descriptor?.path === "string" && !path.isAbsolute(descriptor.path), `${label} path is invalid`);
  invariant(Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0 && SHA256_PATTERN.test(descriptor.sha256 || ""), `${label} descriptor is invalid`);
}

function validateCue(cue) {
  invariant(typeof cue.cueCandidateId === "string" && CUE_CLASSIFICATIONS.includes(cue.classification), `${cue.cueCandidateId || "cue"}: classification is invalid`);
  invariant(cue.evidenceBoundary && Object.values(cue.evidenceBoundary).every((value) => value === false), `${cue.cueCandidateId}: evidence boundary changed`);
  invariant(cue.cueFingerprintSha256 === cueFingerprint(cue), `${cue.cueCandidateId}: cue fingerprint is stale`);
  if (cue.origin === "external") {
    invariant(cue.classification === "external-page-host-path-hash-bound-candidate" && cue.hostDependency?.routingLanguageCandidate === "es", `${cue.cueCandidateId}: external route is invalid`);
  }
  if (cue.origin === "embedded-stream") {
    invariant(cue.inventory.languageLabel === "und" && cue.staticPlacementGraph?.runtimeReachabilityEstablished === false, `${cue.cueCandidateId}: embedded stream crossed an evidence boundary`);
  }
  if (cue.origin === "embedded-define-sound") invariant(cue.staticTrigger && cue.inventory.languageLabel === "und", `${cue.cueCandidateId}: DefineSound evidence is incomplete`);
}

export function validateReport(report) {
  invariant(report?.schemaVersion === 1 && report?.artifactType === "g5-l4-audio-static-cue-reconciliation", "Unexpected G5 L4 audio static reconciliation schema");
  invariant(report.releaseId === RELEASE_ID && report.status === "machine-static-reconciliation-complete-runtime-evidence-unresolved", "G5 L4 audio static reconciliation identity is invalid");
  invariant(Array.isArray(report.members) && report.members.length === 55, "G5 L4 audio static reconciliation must contain 55 members");
  invariant(new Set(report.members.map(({animationId}) => animationId)).size === 55, "Member IDs are duplicated");
  const allCues = report.members.flatMap(({cueCandidates}) => cueCandidates);
  const zeroBlockStructures = report.members.flatMap(({zeroBlockStreamStructures}) => zeroBlockStreamStructures);
  invariant(new Set(allCues.map(({cueCandidateId}) => cueCandidateId)).size === allCues.length, "Cue candidate IDs are duplicated");
  allCues.forEach(validateCue);
  for (const member of report.members) {
    invariant(member.memberFingerprintSha256 === memberFingerprint(member), `${member.animationId}: member fingerprint is stale`);
    invariant(member.evidenceBoundary && Object.values(member.evidenceBoundary).every((value) => value === false), `${member.animationId}: member evidence boundary changed`);
    Object.entries(member.inputBindings || {}).forEach(([key, descriptor]) => validateDescriptor(descriptor, `${member.animationId}.${key}`));
    invariant(member.summary.canonicalInventoryCueCount === member.cueCandidates.length, `${member.animationId}: cue summary is stale`);
    invariant(member.summary.zeroBlockStreamStructureCount === member.zeroBlockStreamStructures.length, `${member.animationId}: zero-block summary is stale`);
    invariant(member.zeroBlockStreamStructures.every((item) => item.classification === "zero-block-stream-structure-only" && item.cuePromoted === false && item.silenceEstablished === false), `${member.animationId}: zero-block structure was over-promoted`);
  }
  const summary = report.summary || {};
  const classificationCounts = countBy(allCues, ({classification}) => classification);
  invariant(summary.memberCount === 55 && summary.physicalCatalogCandidateFileCount === 135, "Member or physical candidate summary changed");
  invariant(summary.externalPageCandidateFileCount === 50 && summary.fqGroupCandidateFileCount === 83 && summary.unmappedCandidateFileCount === 2, "Catalog candidate partition is stale");
  invariant(summary.canonicalInventoryCueCount === 373 && allCues.length === 373, "Canonical cue count must remain 373");
  invariant(summary.externalInventoryCueCount === 50 && summary.embeddedDefineSoundCueCount === 6 && summary.embeddedStreamCueCount === 317, "Canonical cue type partition is stale");
  invariant(sameCanonical(summary.cueClassificationCounts, classificationCounts), "Cue classification summary is stale");
  invariant(sameCanonical(classificationCounts, {
    "embedded-define-sound-definition-only-candidate": 2,
    "embedded-define-sound-exported-dynamic-linkage-candidate": 2,
    "embedded-define-sound-nested-start-tag-candidate": 2,
    "embedded-stream-root-placement-graph-not-proven-candidate": 57,
    "embedded-stream-root-placement-graph-observed-candidate": 260,
    "external-page-host-path-hash-bound-candidate": 50,
  }), "Expected cue classification counts changed");
  invariant(summary.inventoryIdentityTriangulatedCount === 373, "Inventory triangulation summary is stale");
  invariant(summary.zeroBlockStreamStructureCount === zeroBlockStructures.length && zeroBlockStructures.length === 267, "Zero-block structure count must remain 267");
  invariant(sameCanonical(summary.zeroBlockStructuralReachabilityCounts, {root: 3, "reachable-from-root-placement-graph": 177, "not-proven-by-root-placement-graph": 87}), "Zero-block structural reachability summary changed");
  invariant(summary.membersWithPlacementGraphObservedStreamCount === 51 && summary.membersWithPlacementGraphNotProvenStreamCount === 31, "Placement-graph member counts changed");
  invariant(summary.assetInventoryCount === 55 && summary.assetInventoryRowCount === 12066 && summary.soundDefinitionAssetRowCount === 6, "Asset inventory summary changed");
  invariant(summary.ffdecBundleCount === 55 && summary.ffdecScriptCount === 2332 && summary.ffdecScriptBytes === 452488, "FFDec script summary changed");
  invariant(summary.actionScriptAudioOperationCount === 20 && sameCanonical(summary.actionScriptAudioOperationCounts, {attachSound: 1, loadSound: 1, start: 3, stop: 15}), "ActionScript audio operation summary changed");
  invariant(summary.fqExpectedPathCount === 180 && summary.fqPresentCandidateCount === 83 && summary.fqMissingSourceCount === 97 && summary.fqUnmatchedCandidateCount === 0, "FQ path summary changed");
  invariant(sameCanonical(summary.routingLanguageCandidateCounts, {en: 41, es: 92, unresolved: 2}), "Routing-language candidate summary changed");
  for (const field of [
    "spokenLanguageEstablishedFileCount",
    "runtimeReachabilityEstablishedCueCount",
    "audibleContentEstablishedCueCount",
    "synchronizationEstablishedCueCount",
    "listeningAcceptedCueCount",
    "ownerAcceptedCueCount",
    "strictCompleteMemberCount",
    "publishedMemberCount",
  ]) invariant(summary[field] === 0, `${field} must remain zero`);
  invariant(summary.memberInputSetSha256 === fingerprint(report.members.map(({animationId, memberFingerprintSha256}) => ({animationId, memberFingerprintSha256}))), "Member input set fingerprint is stale");
  invariant(summary.cueSetSha256 === fingerprint(allCues.map(({cueCandidateId, cueFingerprintSha256}) => ({cueCandidateId, cueFingerprintSha256}))), "Cue set fingerprint is stale");
  invariant(summary.zeroBlockStructureSetSha256 === fingerprint(zeroBlockStructures), "Zero-block set fingerprint is stale");
  invariant(report.finalQuizStaticRoute?.summary?.expectedPathCount === 180 && report.finalQuizStaticRoute.expectedPaths.length === 180, "FQ expected path matrix is incomplete");
  invariant(report.finalQuizStaticRoute.expectedPaths.filter(({status}) => status.startsWith("hash-bound")).length === 83, "FQ present path count is stale");
  invariant(report.finalQuizStaticRoute.expectedPaths.filter(({status}) => status === "missing-source").length === 97, "FQ missing path count is stale");
  invariant(report.finalQuizStaticRoute.expectedPaths.every(({cuePromoted, runtimeReachabilityEstablished, audibleContentEstablished, spokenLanguageEstablished, synchronizationEstablished}) =>
    cuePromoted === false && runtimeReachabilityEstablished === false && audibleContentEstablished === false && spokenLanguageEstablished === false && synchronizationEstablished === false), "An FQ path crossed the static-candidate boundary");
  invariant(sameCanonical(report.finalQuizStaticRoute.staticPositiveOwnerCandidateIds, FQ_POSITIVE_STATIC_OWNER_IDS), "FQ positive static owner candidate set changed");
  invariant(report.finalQuizStaticRoute.catalogOwnershipChanged === false, "FQ catalog ownership must remain unchanged");
  invariant(report.unmappedCandidates?.length === 2 && report.unmappedCandidates.every((item) => item.status === "pending-assignment-or-reviewed-exclusion" && item.negativeProofEstablished === false && item.assignmentAccepted === false && item.exclusionAccepted === false), "Unmapped candidate disposition changed");
  invariant(report.routingLanguageBoundary.spokenLanguageEstablishedFileCount === 0 && report.routingLanguageBoundary.languageAcceptedFileCount === 0, "Routing-language evidence was promoted to spoken-language acceptance");
  invariant(report.authorityBoundary?.acceptanceNeutral === true && report.authorityBoundary.audioPlayed === false, "Authority boundary is invalid");
  invariant(Object.values(report.acceptanceEffects || {}).every((value) => value === false), "acceptanceEffects must remain false");
  Object.entries(report.sourceBindings || {}).forEach(([key, descriptor]) => validateDescriptor(descriptor, `sourceBindings.${key}`));
  validateDescriptor(report.generator, "generator");
  validateNoProhibitedTrueFields(report);
  const {reportFingerprintSha256, ...fingerprintedReport} = report;
  invariant(reportFingerprintSha256 === fingerprint(fingerprintedReport), "Report fingerprint is stale");
  return report;
}

function markdownEscape(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderMarkdown(report) {
  const classificationRows = Object.entries(report.summary.cueClassificationCounts)
    .map(([classification, count]) => `| \`${markdownEscape(classification)}\` | ${count} |`);
  const memberRows = report.members.map((member) => `| ${member.ordinal} | \`${member.animationId}\` | ${member.summary.canonicalInventoryCueCount} | ${member.summary.externalCueCount} | ${member.summary.embeddedDefineSoundCueCount} | ${member.summary.embeddedStreamCueCount} | ${member.summary.placementGraphObservedStreamCueCount} | ${member.summary.placementGraphNotProvenStreamCueCount} | ${member.summary.zeroBlockStreamStructureCount} |`);
  const unmappedRows = report.unmappedCandidates.map((candidate) => `- \`${candidate.source.path}\` / \`${candidate.source.sha256}\`: 0 literal references in 55 FFDec bundles plus the two readable lesson sources; still \`${candidate.status}\`, not excluded.`);
  return [
    "# G5 L4 audio static cue reconciliation",
    "",
    "> Machine/static candidate evidence only. No row in this report establishes runtime reachability, audible content, spoken language, synchronization, listening acceptance, owner acceptance, strict completion, or publication.",
    "",
    "## Result",
    "",
    `- Members: **${report.summary.memberCount}/55** with current hash-bound audio, asset, FFDec, scenario, and frame-domain inputs.`,
    `- Canonical inventory cues: **${report.summary.canonicalInventoryCueCount}** = ${report.summary.externalInventoryCueCount} external + ${report.summary.embeddedDefineSoundCueCount} DefineSound + ${report.summary.embeddedStreamCueCount} non-empty SoundStream; identity triangulation **${report.summary.inventoryIdentityTriangulatedCount}/${report.summary.canonicalInventoryCueCount}**.`,
    `- Durationful stream static placement: **260** root-placement-graph observed + **57** not proven; runtime reachability remains **0**.`,
    `- Zero-block stream structures: **${report.summary.zeroBlockStreamStructureCount}**; these are structure-only and do not prove silence or a cue.`,
    `- Catalog MP3 candidates: **135** = 50 exact page routes + 83 FQ group candidates + 2 unmapped.`,
    `- Routing-language candidates: en ${report.summary.routingLanguageCandidateCounts.en}, es ${report.summary.routingLanguageCandidateCounts.es}, unresolved ${report.summary.routingLanguageCandidateCounts.unresolved}; spoken-language findings remain **0**.`,
    `- Fingerprint: \`${report.reportFingerprintSha256}\`.`,
    "",
    "## Cue candidate classes",
    "",
    "| Static candidate class | Count |",
    "|---|---:|",
    ...classificationRows,
    "",
    "## Final-quiz static route matrix",
    "",
    `- Q1-Q18 × question plus A-D answers × EN/ES: **${report.finalQuizStaticRoute.summary.expectedPathCount}** canonical paths.`,
    `- Present, hash-bound path candidates: **${report.finalQuizStaticRoute.summary.presentCandidateCount}**; missing source paths: **${report.finalQuizStaticRoute.summary.missingSourceCount}**; unmatched group candidates: **${report.finalQuizStaticRoute.summary.unmatchedCandidateCount}**.`,
    `- Positive static control candidates: \`${report.finalQuizStaticRoute.staticPositiveOwnerCandidateIds.join("\`, \`")}\`; the existing three-member catalog ownership record was not changed.`,
    `- FQ002 is statically random-without-replacement and FQ003 statically sequential. Seed, natural runtime trace, activation, audible content, and synchronization remain unresolved.`,
    "",
    "## Per-member machine reconciliation",
    "",
    "| # | Member | Cues | External | DefineSound | Streams | Placement graph observed | Placement graph not proven | Zero-block structures |",
    "|---:|---|---:|---:|---:|---:|---:|---:|---:|",
    ...memberRows,
    "",
    "## Unmapped files",
    "",
    ...unmappedRows,
    "",
    "## Remaining boundary",
    "",
    ...report.remainingBlockers.map((blocker) => `- \`${blocker}\``),
    "",
    "Every acceptance effect remains false. This report writes no source, workspace, inventory, migration, review, owner, ledger, strict, product, or publication state.",
    "",
  ].join("\n");
}

async function assertOutputAbsent(root, relativePath) {
  const safePath = projectRelative(root, relativePath, `Output ${relativePath}`);
  try {
    await lstat(path.resolve(root, safePath));
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Refusing to overwrite existing output: ${safePath}`);
}

export async function writeExclusiveReportPair({root = projectRoot, jsonText, markdownText}) {
  const safeRoot = path.resolve(root);
  const outputs = [
    {relativePath: REPORT_JSON_PATH, text: jsonText},
    {relativePath: REPORT_MARKDOWN_PATH, text: markdownText},
  ];
  for (const {relativePath} of outputs) await assertOutputAbsent(safeRoot, relativePath);
  const opened = [];
  try {
    for (const output of outputs) {
      const absolute = path.resolve(safeRoot, projectRelative(safeRoot, output.relativePath, `Output ${output.relativePath}`));
      const handle = await open(absolute, "wx", 0o644);
      opened.push({...output, absolute, handle});
    }
    for (const output of opened) {
      await output.handle.writeFile(output.text, "utf8");
      await output.handle.sync();
    }
    for (const output of opened) await output.handle.close();
  } catch (error) {
    await Promise.all(opened.map(async ({handle}) => {
      try { await handle.close(); } catch {}
    }));
    await Promise.all(opened.map(async ({absolute}) => {
      try { await unlink(absolute); } catch (unlinkError) { if (unlinkError?.code !== "ENOENT") throw unlinkError; }
    }));
    throw error;
  }
  return outputs.map(({relativePath, text}) => ({
    path: relativePath,
    bytes: Buffer.byteLength(text),
    sha256: sha256(Buffer.from(text, "utf8")),
  }));
}

export async function checkReports({root = projectRoot, report}) {
  const jsonText = stableJson(report);
  const markdownText = `${renderMarkdown(report)}\n`;
  const [jsonInput, markdownInput] = await Promise.all([
    readProjectFile(root, REPORT_JSON_PATH, "checked-in G5 L4 audio static reconciliation JSON"),
    readProjectFile(root, REPORT_MARKDOWN_PATH, "checked-in G5 L4 audio static reconciliation Markdown"),
  ]);
  invariant(jsonInput.bytes.toString("utf8") === jsonText, `${REPORT_JSON_PATH} differs from the current builder`);
  invariant(markdownInput.bytes.toString("utf8") === markdownText, `${REPORT_MARKDOWN_PATH} differs from the current builder`);
  return [jsonInput.descriptor, markdownInput.descriptor];
}

export function parseArguments(argv) {
  const options = {root: projectRoot, check: false, help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--root") {
      const root = argv[++index];
      invariant(root && !root.startsWith("--"), "--root requires a path");
      options.root = path.resolve(root);
    } else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage: node ${GENERATOR_PATH} [--check] [--root <project-root>]

Without --check, creates exactly these two files with exclusive-create semantics
and refuses to overwrite either one:
  ${REPORT_JSON_PATH}
  ${REPORT_MARKDOWN_PATH}

--check rebuilds the acceptance-neutral report in memory and compares both
checked-in files without writing.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const report = await buildReport({root: options.root});
  if (options.check) {
    const descriptors = await checkReports({root: options.root, report});
    process.stdout.write(`PASS: G5 L4 audio static cue reconciliation is current; ${report.summary.canonicalInventoryCueCount}/373 cue identities, ${report.summary.fqPresentCandidateCount}/180 FQ paths present, all acceptance effects false; ${descriptors.map(({path: filePath, sha256: digest}) => `${filePath}=${digest}`).join(" ")}\n`);
    return;
  }
  const descriptors = await writeExclusiveReportPair({
    root: options.root,
    jsonText: stableJson(report),
    markdownText: `${renderMarkdown(report)}\n`,
  });
  process.stdout.write(`CREATED: ${descriptors.map(({path: filePath, sha256: digest}) => `${filePath}=${digest}`).join(" ")}; all acceptance effects false\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
