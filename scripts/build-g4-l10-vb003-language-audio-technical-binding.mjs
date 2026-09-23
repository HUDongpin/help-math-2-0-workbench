#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {parseAudioInventory} from "./audio-listening-acceptance.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const ANIMATION_ID = "course-g04-l10-vb-003";
export const RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const GENERATOR_PATH = "scripts/build-g4-l10-vb003-language-audio-technical-binding.mjs";
export const OUTPUT_PATH = `migrations/${ANIMATION_ID}/audit/language-audio-technical-binding.json`;

const SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const WORKSPACE = `migrations/${ANIMATION_ID}`;
const TRACE_ROOT = `${WORKSPACE}/audit/trace-specs/lesson-releases/${RELEASE_ID}`;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const EXPECTED_INPUTS = Object.freeze({
  sourceSwf: {
    path: `${SOURCE_ROOT}/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf`,
    bytes: 97444,
    sha256: "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d",
  },
  spanishMp3: {
    path: `${SOURCE_ROOT}/HELP_COURSES/ELMGR4/L10/SA/L10VB03.mp3`,
    bytes: 212016,
    sha256: "491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03",
  },
  migrationManifest: {
    path: `${WORKSPACE}/migration.json`,
    bytes: 8998,
    sha256: "2450dd99af1806acf04ef4130f4b63001ba785db7b5ae96b3c13080d2a06a585",
  },
  audioInventory: {
    path: `${WORKSPACE}/audio-inventory.csv`,
    bytes: 1327,
    sha256: "50492491fd02782775e92544f3f0a73f23b2d3aab02aadf46de042df7a900335",
  },
  audioRuntimeEvidence: {
    path: `${WORKSPACE}/audit/audio-runtime-evidence.json`,
    bytes: 10286,
    sha256: "dbcc0fdf0a53c37350639bb6212a8be6daa0f81c795eb3a093f2b67d49d05898",
  },
  targetFfdecScripts: {
    path: `${WORKSPACE}/audit/machine/ffdec-scripts.txt.gz`,
    bytes: 302,
    sha256: "12914750cdf35938ba3fb0daa07126fc8face1d932f3f3b6aa57e4e9afaf0ec6",
  },
  targetScenarioInventory: {
    path: `${WORKSPACE}/audit/scenario-inventory.json`,
    bytes: 134836,
    sha256: "55a149952185c0f45e5843f6018288f7036269807cca1264e41905038a08b44a",
  },
  frameDomainDisposition: {
    path: `${WORKSPACE}/audit/frame-domain-disposition.json`,
    bytes: 15617,
    sha256: "d69f282c571ed3ec19228372db425f52ae0d099c6b47bf27de9d9b680f92df68",
  },
  keyframes: {
    path: `${WORKSPACE}/keyframes.csv`,
    bytes: 15154,
    sha256: "0c2a7ee1961c581011baf94d97bc56b1337355957d244da36f01fcdbb7cff39f",
  },
  nestedTraceEn: {
    path: `${TRACE_ROOT}/req-sprite-120-source-proven-independent-domain-entry-unresolved-en.json`,
    bytes: 18214,
    sha256: "3253ff6405ff2bf15f2e4cd33657c8c57c7f710fbb8741556787654135ed2ff7",
  },
  nestedTraceEs: {
    path: `${TRACE_ROOT}/req-sprite-120-source-proven-independent-domain-entry-unresolved-es.json`,
    bytes: 18214,
    sha256: "5285c1713d4f7b74563564bc70062f13d810c9aa7bfa0ae495dab9466d226288",
  },
  hostFfdecScripts: {
    path: "migrations/shell-course-g04-l10-index-local/audit/machine/ffdec-scripts.txt.gz",
    bytes: 25028,
    sha256: "a2578f54460dc61088c170be1f7bb591bda10654d1a0f53b2360665ff7cf9969",
  },
  hostScenarioInventory: {
    path: "migrations/shell-course-g04-l10-index-local/audit/scenario-inventory.json",
    bytes: 5964702,
    sha256: "28dd4e2151eb2441797fa22a9a552f078800a7642a5d254716dacf325c56d7d2",
  },
  hostEntryAntecedent: {
    path: "reports/g4-l10-vb003-host-entry-antecedent.json",
    bytes: 38497,
    sha256: "9c64d146c8560551beac47fd493c0a9a35135e3d4dc756363f3ac643525c595d",
  },
  languageAudioMatrix: {
    path: `reports/${RELEASE_ID}-language-audio-cue-obligation-matrix.json`,
    bytes: 1247159,
    sha256: "d71e3f0bf05c6db20d02d8327d7ec53e99d9735d7045547af0a9231c69928e23",
  },
});

const FALSE_EVIDENCE_BOUNDARY = Object.freeze({
  runtimeReachabilityEstablished: false,
  audibleContentEstablished: false,
  spokenLanguageEstablished: false,
  synchronizationEstablished: false,
  originalRuntimeListeningComplete: false,
  namedHumanListeningComplete: false,
  cueAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

const FORMAL_EVIDENCE = Object.freeze({
  authorizedOriginalRuntimeExecuted: false,
  originalRuntimeNaturalTraceEstablished: false,
  originalRuntimeBaselineEstablished: false,
  formalCueAdoptionEstablished: false,
  formalLanguageAcceptanceEstablished: false,
  formalAudioAcceptanceEstablished: false,
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntimeAccepted: false,
  audioAccepted: false,
  behaviorAccepted: false,
  humanReviewAccepted: false,
  ownerAcceptanceAccepted: false,
  strictCompletionAccepted: false,
  publicationAccepted: false,
});

const UNRESOLVED = Object.freeze([
  "exact-runtime-cue-ownership-and-reachability",
  "spoken-content-language-and-voice",
  "natural-host-state-and-interaction-trace",
  "start-stop-pause-complete-synchronization",
  "replay-reset-behavior",
  "named-human-authorized-original-runtime-listening",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
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

function safeRelativePath(root, candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label} path is missing`);
  const absolute = path.resolve(root, candidate);
  const relative = portable(path.relative(path.resolve(root), absolute));
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${label} escapes the project root`);
  invariant(!relative.includes("\\") && portable(path.normalize(relative)) === relative, `${label} path is not normalized`);
  return {absolute, relative};
}

async function readProjectFile(root, relativePath, label, expected = null) {
  const safe = safeRelativePath(root, relativePath, label);
  const [rootReal, metadata, resolved] = await Promise.all([
    realpath(root),
    lstat(safe.absolute),
    realpath(safe.absolute),
  ]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} is not an ordinary non-symlink file`);
  invariant(resolved.startsWith(`${rootReal}${path.sep}`), `${label} resolves outside the project root`);
  const bytes = await readFile(safe.absolute);
  const descriptor = {path: safe.relative, bytes: bytes.length, sha256: sha256(bytes)};
  invariant(bytes.length === metadata.size, `${label} changed while being read`);
  if (expected) {
    invariant(sameCanonical(descriptor, expected), `${label} descriptor drifted: expected ${expected.sha256}, observed ${descriptor.sha256}`);
  }
  return {descriptor, bytes};
}

async function readJsonInput(root, key, inputs) {
  const input = await readProjectFile(root, EXPECTED_INPUTS[key].path, key, EXPECTED_INPUTS[key]);
  try {
    input.value = JSON.parse(input.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${key} is not valid JSON: ${error.message}`);
  }
  inputs[key] = input;
  return input;
}

function expandedLines(input, label) {
  let expanded;
  try {
    expanded = gunzipSync(input.bytes).toString("utf8");
  } catch (error) {
    throw new Error(`${label} is not a valid gzip stream: ${error.message}`);
  }
  return {text: expanded, lines: expanded.split(/\r?\n/), sha256: sha256(Buffer.from(expanded, "utf8"))};
}

function assertSourceLine(lines, line, expected, label) {
  invariant(lines[line - 1] === expected, `${label} FFDec line ${line} drifted`);
  return {line, sourceLine: expected};
}

function findHandler(inventory, objectId, expectedScript) {
  const handlers = (inventory.interactions?.handlers || []).filter((handler) =>
    handler.scope?.objectId === String(objectId) && handler.script === expectedScript);
  invariant(handlers.length === 1, `${expectedScript} must resolve to exactly one handler`);
  return handlers[0];
}

function handlerControl(handler, expectedName, expectedFrame, expectedCall) {
  invariant(sameCanonical(handler.event, ["release"]), `${handler.script} event drifted`);
  invariant(sameCanonical(handler.categories, ["audio-control"]), `${handler.script} category drifted`);
  invariant(handler.signals?.calls?.some(({target}) => target === expectedCall), `${handler.script} call drifted`);
  const placements = handler.hitTarget?.placements || [];
  invariant(placements.length === 1, `${handler.script} placement count drifted`);
  const placement = placements[0];
  invariant(placement.name === expectedName && placement.frame === expectedFrame && placement.timelineId === "root",
    `${handler.script} placement drifted`);
  return {
    buttonObjectId: handler.scope.objectId,
    instanceName: placement.name,
    event: "release",
    hostTimelineId: placement.timelineId,
    hostFrame: placement.frame,
    sourceScript: handler.script,
    bodySha256: handler.bodySha256,
    call: expectedCall,
    exactStageBoundsEstablished: false,
    runtimeInvocationEstablished: false,
  };
}

function targetStopObligation(handler) {
  invariant(sameCanonical(handler.event, ["release"]), `${handler.script} event drifted`);
  invariant(handler.signals?.calls?.some(({target}) => target === "_root.animation_mc.animation.stop"),
    `${handler.script} no longer stops the containing animation`);
  const placements = handler.hitTarget?.placements || [];
  invariant(placements.length === 1 && placements[0].timelineId === "sprite-120", `${handler.script} placement drifted`);
  const keyAttribute = handler.signals?.assignments?.find(({target}) => target === "_global.KeyAttribute")?.expression;
  invariant(typeof keyAttribute === "string", `${handler.script} KeyAttribute assignment is missing`);
  return {
    buttonObjectId: handler.scope.objectId,
    localFrame: placements[0].frame,
    frameDomainId: "sprite-120",
    event: "release",
    keyAttributeCandidate: JSON.parse(keyAttribute),
    effectCandidate: "stop-containing-animation-during-glossary-or-hyperlink",
    sourceScript: handler.script,
    bodySha256: handler.bodySha256,
    streamSynchronizationEstablished: false,
    runtimeInvocationEstablished: false,
  };
}

function descriptorIsValid(descriptor) {
  return descriptor && typeof descriptor.path === "string" && !path.isAbsolute(descriptor.path)
    && Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0
    && SHA256_PATTERN.test(descriptor.sha256 || "");
}

function validateFalseObject(value, label) {
  invariant(value && Object.keys(value).length > 0, `${label} is missing`);
  for (const [key, field] of Object.entries(value)) invariant(field === false, `${label}.${key} must remain false`);
}

export function validateReport(report) {
  invariant(report?.schemaVersion === 1 && report.artifactType === "g4-l10-vb003-language-audio-technical-binding",
    "Unexpected VB003 language/audio technical-binding schema");
  invariant(report.animationId === ANIMATION_ID && report.releaseId === RELEASE_ID,
    "VB003 language/audio technical-binding identity drifted");
  invariant(report.status === "source-static-candidate-and-obligation-binding-runtime-and-listening-unresolved",
    "VB003 language/audio technical-binding status drifted");
  Object.entries(report.sourceBindings || {}).forEach(([key, descriptor]) =>
    invariant(descriptorIsValid(descriptor), `sourceBindings.${key} is invalid`));
  invariant(descriptorIsValid(report.generator), "generator descriptor is invalid");
  validateFalseObject(report.formalEvidence, "formalEvidence");
  validateFalseObject(report.acceptanceEffects, "acceptanceEffects");
  validateFalseObject(report.authorityBoundary, "authorityBoundary");
  invariant(Array.isArray(report.cueCandidates) && report.cueCandidates.length === 2,
    "Exactly two VB003 cue candidates are required");
  const cueById = new Map(report.cueCandidates.map((cue) => [cue.cueCandidateId, cue]));
  invariant(cueById.size === 2, "VB003 cue candidate IDs are duplicated");
  const embedded = cueById.get(`${ANIMATION_ID}:embedded-stream-0001`);
  const spanish = cueById.get(`${ANIMATION_ID}:catalog-audio-01`);
  invariant(embedded?.languageLabel === "und" && embedded.localFrameDomainId === "sprite-120"
    && embedded.headFrame === 1 && embedded.firstBlockFrame === 4 && embedded.lastBlockFrame === 203
    && embedded.runtimeCueTime === null && embedded.spokenLanguage === null,
  "Embedded stream candidate crossed its source-static boundary");
  invariant(spanish?.routingLanguageCandidate === "es" && spanish.startSemantics === "host-user-activated"
    && spanish.startFrame === null && spanish.runtimeCueTime === null && spanish.spokenLanguage === null,
  "Spanish external candidate crossed its host-routing boundary");
  report.cueCandidates.forEach((cue) => validateFalseObject(cue.evidenceBoundary, `${cue.cueCandidateId}.evidenceBoundary`));
  invariant(Array.isArray(report.languageObligations) && report.languageObligations.length === 2,
    "Exactly EN and ES obligations are required");
  const obligationByLanguage = new Map(report.languageObligations.map((row) => [row.language, row]));
  invariant(obligationByLanguage.size === 2 && obligationByLanguage.has("en") && obligationByLanguage.has("es"),
    "Language obligations must be exactly EN and ES");
  invariant(sameCanonical(obligationByLanguage.get("en").cueCandidateIds, [`${ANIMATION_ID}:embedded-stream-0001`]),
    "EN candidate binding drifted");
  invariant(sameCanonical(obligationByLanguage.get("es").cueCandidateIds, [
    `${ANIMATION_ID}:catalog-audio-01`,
    `${ANIMATION_ID}:embedded-stream-0001`,
  ]), "ES candidate binding drifted");
  for (const obligation of report.languageObligations) {
    invariant(obligation.status === "unresolved-listening-required" && obligation.accepted === false,
      `${obligation.language} obligation crossed the pending boundary`);
    invariant(sameCanonical(obligation.unresolved, UNRESOLVED), `${obligation.language} unresolved set drifted`);
  }
  invariant(report.hostAudioControlObligations?.length === 2
    && report.hostAudioControlObligations.every(({runtimeInvocationEstablished}) => runtimeInvocationEstablished === false),
  "Host audio-control obligations drifted");
  invariant(report.interactionSynchronizationObligations?.length === 3
    && report.interactionSynchronizationObligations.every(({streamSynchronizationEstablished, runtimeInvocationEstablished}) =>
      streamSynchronizationEstablished === false && runtimeInvocationEstablished === false),
  "Target interaction synchronization obligations drifted");
  invariant(report.specificationBoundary?.migrationFilesModified === false
    && report.specificationBoundary.audioCueAdopted === false
    && report.specificationBoundary.keyframeCueTimeAdded === false
    && report.specificationBoundary.traceScheduleAdded === false,
  "Specification boundary was crossed");
  const {reportFingerprintSha256, ...payload} = report;
  invariant(reportFingerprintSha256 === fingerprint(payload), "VB003 language/audio technical-binding fingerprint is stale");
  return report;
}

export async function buildReport({root = PROJECT_ROOT} = {}) {
  const safeRoot = path.resolve(root);
  const inputs = {};
  const jsonKeys = [
    "migrationManifest",
    "audioRuntimeEvidence",
    "targetScenarioInventory",
    "frameDomainDisposition",
    "nestedTraceEn",
    "nestedTraceEs",
    "hostScenarioInventory",
    "hostEntryAntecedent",
    "languageAudioMatrix",
  ];
  await Promise.all(jsonKeys.map((key) => readJsonInput(safeRoot, key, inputs)));
  for (const key of ["sourceSwf", "spanishMp3", "audioInventory", "targetFfdecScripts", "keyframes", "hostFfdecScripts"]) {
    inputs[key] = await readProjectFile(safeRoot, EXPECTED_INPUTS[key].path, key, EXPECTED_INPUTS[key]);
  }
  const generatorInput = await readProjectFile(safeRoot, GENERATOR_PATH, "generator");

  const manifest = inputs.migrationManifest.value;
  invariant(manifest.animationId === ANIMATION_ID && sameCanonical(manifest.localization?.languages, ["en", "es"]),
    "VB003 localization manifest drifted");
  invariant(manifest.audio?.required === true && sameCanonical(manifest.audio.languages, ["und"])
    && Array.isArray(manifest.audio.cues) && manifest.audio.cues.length === 0,
  "VB003 audio manifest crossed the pre-adoption boundary");

  const audioAudit = inputs.audioRuntimeEvidence.value;
  invariant(audioAudit.animationId === ANIMATION_ID && audioAudit.source?.observedSha256 === EXPECTED_INPUTS.sourceSwf.sha256,
    "VB003 audio audit source binding drifted");
  invariant(Array.isArray(audioAudit.actionScriptAudioOperations) && audioAudit.actionScriptAudioOperations.length === 0,
    "VB003 target ActionScript audio-operation count drifted");
  invariant(audioAudit.acceptance?.structurallyAudited === true
    && audioAudit.acceptance.authoritativeListeningComplete === false
    && audioAudit.acceptance.hostStateTraversalComplete === false
    && audioAudit.acceptance.synchronizationComplete === false
    && audioAudit.acceptance.strictAudioAcceptance === "pending",
  "VB003 audio audit acceptance boundary drifted");
  const exactExternal = audioAudit.externalAudio?.exactAssociations || [];
  const streams = audioAudit.embeddedAudio?.soundStreams || [];
  invariant(exactExternal.length === 1 && streams.length === 1, "VB003 audio audit must expose one external track and one embedded stream");
  const external = exactExternal[0];
  const stream = streams[0];
  invariant(external.sourceFile === EXPECTED_INPUTS.spanishMp3.path
    && external.observedSha256 === EXPECTED_INPUTS.spanishMp3.sha256
    && external.languageAssessment?.language === "es" && external.languageAssessment.spokenLanguageEstablished === false
    && external.startFrame === null && external.startSemantics === "host-user-activated",
  "VB003 Spanish external-track binding drifted");
  invariant(stream.context?.kind === "sprite" && stream.context.characterId === 120
    && stream.contextDeclaredFrames === 203 && stream.headFrame === 1 && stream.firstBlockFrame === 4
    && stream.lastBlockFrame === 203 && stream.blockCount === 200 && stream.durationMs === 16640,
  "VB003 embedded stream structure drifted");

  const parsedInventory = parseAudioInventory(inputs.audioInventory.bytes.toString("utf8"));
  invariant(parsedInventory.rows.length === 2, "VB003 canonical audio inventory must contain exactly two rows");
  const externalRow = parsedInventory.rows.find(({cue_id: cueId}) => cueId === "catalog-audio-01");
  const embeddedRow = parsedInventory.rows.find(({cue_id: cueId}) => cueId === "embedded-stream-0001");
  invariant(externalRow?.language === "es" && externalRow.source_file === external.sourceFile
    && externalRow.sha256 === external.observedSha256 && externalRow.start_frame === ""
    && externalRow.start_semantics === "host-user-activated",
  "VB003 external inventory row drifted");
  invariant(embeddedRow?.language === "und" && embeddedRow.source_file === EXPECTED_INPUTS.sourceSwf.path
    && embeddedRow.sha256 === EXPECTED_INPUTS.sourceSwf.sha256 && embeddedRow.start_frame === ""
    && embeddedRow.start_semantics === "interaction-state" && embeddedRow.source_character_id === "120",
  "VB003 embedded inventory row drifted");

  const frameDisposition = inputs.frameDomainDisposition.value;
  const sprite120 = (frameDisposition.timelines || []).find(({timelineId}) => timelineId === "sprite-120");
  invariant(sprite120?.disposition === "declared-frame-domain" && sprite120.frameCount === 203,
    "VB003 sprite-120 frame-domain disposition drifted");
  const rootPlacement = sprite120.rootPlacement?.namedPlacementPath || [];
  invariant(rootPlacement.length === 1 && rootPlacement[0].parentTimelineId === "root"
    && rootPlacement[0].frame === 6 && rootPlacement[0].instanceName === "animation",
  "VB003 sprite-120 root placement drifted");

  for (const [key, language] of [["nestedTraceEn", "en"], ["nestedTraceEs", "es"]]) {
    const trace = inputs[key].value;
    invariant(trace.traceSpecStatus === "unresolved" && trace.frameDomain?.id === "sprite-120"
      && trace.entryState?.language === language && trace.entryState.runtimeReachabilityEstablished === false
      && trace.schedule?.orderedSteps?.length === 0,
    `VB003 ${language} nested trace crossed the unresolved boundary`);
  }
  invariant(inputs.keyframes.bytes.toString("utf8").includes("Audio cue content, timing, host synchronization, and Replay behavior remain unresolved. Nested keyframes are not invented."),
    "VB003 keyframe audio boundary drifted");

  const matrix = inputs.languageAudioMatrix.value;
  invariant(matrix.releaseId === RELEASE_ID && matrix.status === "machine-structural-obligations-current-listening-required",
    "L10 language/audio matrix identity drifted");
  const matrixMember = (matrix.members || []).find(({animationId}) => animationId === ANIMATION_ID);
  const matrixEn = (matrix.obligationRows || []).find(({obligationId}) => obligationId === `${ANIMATION_ID}:en`);
  const matrixEs = (matrix.obligationRows || []).find(({obligationId}) => obligationId === `${ANIMATION_ID}:es`);
  invariant(matrixMember?.canonicalInventory?.exactMachineTriangulation === true && matrixMember.manifestObservation?.adoptedCueCount === 0,
    "VB003 matrix member binding drifted");
  invariant(sameCanonical(matrixEn?.embeddedUnknownLanguageCandidateIds, [`${ANIMATION_ID}:embedded-stream-0001`])
    && matrixEn.exactBasenameAssociationIds.length === 0 && matrixEn.accepted === false,
  "VB003 EN matrix obligation drifted");
  invariant(matrixEs?.exactBasenameAssociationIds?.length === 1
    && sameCanonical(matrixEs.embeddedUnknownLanguageCandidateIds, [`${ANIMATION_ID}:embedded-stream-0001`])
    && matrixEs.accepted === false,
  "VB003 ES matrix obligation drifted");

  const hostAntecedent = inputs.hostEntryAntecedent.value;
  invariant(hostAntecedent.status === "source-static-antecedent-materialized-ruffle-probe-not-authoritative"
    && hostAntecedent.authority?.authoritativeOriginalRuntime === false
    && hostAntecedent.audioAntecedent?.embeddedEnglishOrUndeterminedStream?.runtimeCueTimeEstablished === false
    && hostAntecedent.audioAntecedent?.spanishHostUserTrack?.authoritativeListeningComplete === false,
  "VB003 host-entry audio antecedent crossed its authority boundary");

  const targetExpanded = expandedLines(inputs.targetFfdecScripts, "targetFfdecScripts");
  invariant(targetExpanded.sha256 === "76dbf37cf16ed35d1b1b3a1dcf520762234989721194eff761924c390a3c8ddf",
    "VB003 expanded target FFDec bundle drifted");
  for (const [line, text] of [
    [5, "   _root.animation_mc.animation.stop();"],
    [13, "   _root.animation_mc.animation.stop();"],
    [21, "   _root.animation_mc.animation.stop();"],
    [26, "stop();"],
  ]) assertSourceLine(targetExpanded.lines, line, text, "target");

  const hostExpanded = expandedLines(inputs.hostFfdecScripts, "hostFfdecScripts");
  invariant(hostExpanded.sha256 === "1bb411fb194d87c163f6f1777f8701219f30f3d58db1b39c4add2e6ed76f9f90",
    "Expanded L10 host FFDec bundle drifted");
  const hostOperationLines = [
    [255, "   _root.doStopSpanishAudio();"],
    [260, "   _root.doPlaySpanishAudio();"],
    [5021, "      _root.animation_mc.animation.stop();"],
    [5022, "      SndFName = _global.tempURL + \"/SA/\" + SSTemFName[0] + \".mp3\";"],
    [5023, "      _global.gSound.loadSound(SndFName,1);"],
    [5028, "         _loc2_.gSound.stop();"],
    [5029, "         if(_loc1_.animation_mc.animation._currentframe != _loc1_.animation_mc.animation._totalframes && _loc2_.quizSection == false)"],
    [5031, "            _loc1_.animation_mc.animation.play();"],
    [5049, "      _global.gSound.start();"],
    [5056, "   _loc2_.gSound.stop();"],
    [5057, "   if(_loc1_.animation_mc.animation._currentframe != _loc1_.animation_mc.animation._totalframes && _loc2_.quizSection == false)"],
    [5059, "      _loc1_.animation_mc.animation.play();"],
  ].map(([line, text]) => assertSourceLine(hostExpanded.lines, line, text, "host"));

  const hostInventory = inputs.hostScenarioInventory.value;
  const stopControl = handlerControl(findHandler(hostInventory, 219, "DefineButton2_219/BUTTONCONDACTION on(release).as"),
    "EA", 49, "_root.doStopSpanishAudio");
  const playControl = handlerControl(findHandler(hostInventory, 225, "DefineButton2_225/BUTTONCONDACTION on(release).as"),
    "SA", 49, "_root.doPlaySpanishAudio");
  const targetInventory = inputs.targetScenarioInventory.value;
  const targetStops = [
    [10, "DefineButton2_10/BUTTONCONDACTION on(release).as"],
    [11, "DefineButton2_11/BUTTONCONDACTION on(release).as"],
    [15, "DefineButton2_15/BUTTONCONDACTION on(release).as"],
  ].map(([objectId, script]) => targetStopObligation(findHandler(targetInventory, objectId, script)));

  const sourceBindings = Object.fromEntries(
    Object.keys(EXPECTED_INPUTS).map((key) => [key, inputs[key].descriptor]),
  );
  const embeddedCandidateId = `${ANIMATION_ID}:embedded-stream-0001`;
  const externalCandidateId = `${ANIMATION_ID}:catalog-audio-01`;
  const report = {
    schemaVersion: 1,
    artifactType: "g4-l10-vb003-language-audio-technical-binding",
    animationId: ANIMATION_ID,
    releaseId: RELEASE_ID,
    status: "source-static-candidate-and-obligation-binding-runtime-and-listening-unresolved",
    scope: "exact-source-audio-inventory-target-and-host-actionscript-frame-domain-language-route-and-obligation-binding-only",
    authorityStatement: [
      "This artifact consolidates hash-bound source-static cue candidates and EN/ES obligations only.",
      "Routing language is not spoken-language evidence; local SoundStream frames are not root/runtime cue times.",
      "No original runtime, Ruffle execution, audio playback, listening, review, acceptance, migration status, registry, ledger, or publication state is created or changed.",
    ],
    generator: generatorInput.descriptor,
    sourceBindings,
    formalEvidence: {...FORMAL_EVIDENCE},
    authorityBoundary: {
      audioPlayed: false,
      originalRuntimeExecuted: false,
      ruffleExecuted: false,
      runtimeReachabilityEstablished: false,
      audibleContentEstablished: false,
      spokenLanguageEstablished: false,
      synchronizationEstablished: false,
      listeningAccepted: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      publicationEstablished: false,
    },
    cueCandidates: [
      {
        cueCandidateId: embeddedCandidateId,
        origin: "embedded-sound-stream",
        classification: "embedded-stream-root-placement-graph-observed-runtime-unresolved-candidate",
        source: inputs.sourceSwf.descriptor,
        inventoryCueId: embeddedRow.cue_id,
        languageLabel: "und",
        routingRoleCandidate: "default-or-English-side-embedded-candidate",
        applicableLanguageObligationCandidates: ["en", "es"],
        spokenLanguage: null,
        localFrameDomainId: "sprite-120",
        sourceCharacterId: 120,
        headFrame: stream.headFrame,
        firstBlockFrame: stream.firstBlockFrame,
        lastBlockFrame: stream.lastBlockFrame,
        blockCount: stream.blockCount,
        durationMs: stream.durationMs,
        durationBasis: stream.durationBasis,
        format: "swf-mp3-stream",
        channels: stream.channels,
        sampleRateHz: stream.sampleRateHz,
        syncMode: stream.syncMode,
        rootPlacementCandidate: {
          parentTimelineId: rootPlacement[0].parentTimelineId,
          parentFrame: rootPlacement[0].frame,
          instanceName: rootPlacement[0].instanceName,
          structuralReachability: sprite120.structuralReachability,
          runtimeReachabilityEstablished: false,
        },
        runtimeCueTime: null,
        evidenceBoundary: {...FALSE_EVIDENCE_BOUNDARY},
        unresolved: [...UNRESOLVED],
      },
      {
        cueCandidateId: externalCandidateId,
        matrixCandidateId: matrixEs.exactBasenameAssociationIds[0],
        origin: "external-host-routed-mp3",
        classification: "exact-basename-SA-host-route-candidate",
        source: inputs.spanishMp3.descriptor,
        inventoryCueId: externalRow.cue_id,
        routingLanguageCandidate: "es",
        hostLanguageCodeCandidate: "SP",
        spokenLanguage: null,
        startSemantics: "host-user-activated",
        startFrame: null,
        runtimeCueTime: null,
        durationMs: external.probe.durationMs,
        format: external.probe.codecName,
        channels: external.probe.channels,
        sampleRateHz: external.probe.sampleRateHz,
        hostDependency: {
          pathFormula: "<lesson-base>/SA/<loaded-child-basename>.mp3",
          exactPathResolved: "HELP_COURSES/ELMGR4/L10/SA/L10VB03.mp3",
          activationControlObjectId: playControl.buttonObjectId,
          activationEvent: "release",
          runtimeInvocationEstablished: false,
        },
        evidenceBoundary: {...FALSE_EVIDENCE_BOUNDARY},
        unresolved: [...UNRESOLVED],
      },
    ],
    languageObligations: [
      {
        obligationId: `${ANIMATION_ID}:en`,
        language: "en",
        hostLanguageCodeCandidate: "EN",
        ordinaryPageExternalDirectoryCandidate: null,
        cueCandidateIds: [embeddedCandidateId],
        embeddedCandidateExclusivelyEnglish: false,
        accepted: false,
        status: "unresolved-listening-required",
        unresolved: [...UNRESOLVED],
      },
      {
        obligationId: `${ANIMATION_ID}:es`,
        language: "es",
        hostLanguageCodeCandidate: "SP",
        ordinaryPageExternalDirectoryCandidate: "SA",
        cueCandidateIds: [externalCandidateId, embeddedCandidateId],
        embeddedCandidateExcludedFromSpanish: false,
        accepted: false,
        status: "unresolved-listening-required",
        unresolved: [...UNRESOLVED],
      },
    ],
    hostAudioControlObligations: [
      {
        ...playControl,
        role: "Spanish host-user activation candidate",
        sourceStaticOperationSequence: hostOperationLines.slice(2, 9),
        completionResumeCondition: "child current frame differs from child total frames and quizSection is false",
      },
      {
        ...stopControl,
        role: "Spanish external-track stop and child-resume candidate",
        sourceStaticOperationSequence: hostOperationLines.slice(9),
        completionResumeCondition: "child current frame differs from child total frames and quizSection is false",
      },
    ],
    interactionSynchronizationObligations: targetStops,
    currentManifestObservation: {
      localizationLanguages: [...manifest.localization.languages],
      audioRequired: manifest.audio.required,
      declaredAudioLanguages: [...manifest.audio.languages],
      adoptedCueCount: manifest.audio.cues.length,
      exactAssociationLanguageInManifest: manifest.audio.catalogExactAssociations[0].language,
      structurallyClassifiedExternalRoutingLanguage: "es",
      followUp: audioAudit.acceptance.manifestFollowUp,
      manifestChangedByThisArtifact: false,
    },
    specificationBoundary: {
      localSoundStreamFirstBlockFrame: 4,
      rootOrRuntimeCueTime: null,
      nestedTraceStatus: "unresolved",
      migrationFilesModified: false,
      audioCueAdopted: false,
      keyframeCueTimeAdded: false,
      traceScheduleAdded: false,
      registryOrLedgerModified: false,
      strictAcceptanceEffect: "none",
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    summary: {
      cueCandidateCount: 2,
      languageObligationCount: 2,
      hostAudioControlObligationCount: 2,
      interactionSynchronizationObligationCount: 3,
      adoptedCueCount: 0,
      spokenLanguageEstablishedCueCount: 0,
      runtimeReachabilityEstablishedCueCount: 0,
      acceptedCueCount: 0,
      strictAcceptanceEffect: "none",
    },
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return validateReport(report);
}

async function safeOutput(root) {
  const safe = safeRelativePath(root, OUTPUT_PATH, "output");
  const parent = path.dirname(safe.absolute);
  const [rootReal, parentInfo, parentReal] = await Promise.all([realpath(root), lstat(parent), realpath(parent)]);
  invariant(parentInfo.isDirectory() && !parentInfo.isSymbolicLink(), "Output parent is not an ordinary directory");
  invariant(parentReal.startsWith(`${rootReal}${path.sep}`), "Output parent resolves outside the project root");
  const existing = await lstat(safe.absolute).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!existing || (existing.isFile() && !existing.isSymbolicLink() && existing.nlink === 1),
    "Output must be absent or one ordinary non-linked file");
  return safe;
}

export async function checkReport({root = PROJECT_ROOT, report}) {
  const safe = await safeOutput(path.resolve(root));
  const actual = await readFile(safe.absolute, "utf8").catch((error) => {
    if (error.code === "ENOENT") throw new Error(`${OUTPUT_PATH} is missing; run with --write`);
    throw error;
  });
  const expected = stableJson(report);
  invariant(actual === expected, `${OUTPUT_PATH} is stale; run with --write after review`);
  return {path: OUTPUT_PATH, bytes: Buffer.byteLength(actual), sha256: sha256(Buffer.from(actual, "utf8"))};
}

export async function writeReport({root = PROJECT_ROOT, report}) {
  const safeRoot = path.resolve(root);
  const safe = await safeOutput(safeRoot);
  const expected = stableJson(report);
  const existing = await readFile(safe.absolute, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing === expected) {
    return {path: OUTPUT_PATH, bytes: Buffer.byteLength(existing), sha256: sha256(Buffer.from(existing, "utf8")), changed: false};
  }
  const temporary = `${safe.absolute}.tmp-${process.pid}`;
  let handle;
  try {
    handle = await open(temporary, "wx", 0o644);
    await handle.writeFile(expected, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, safe.absolute);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch((unlinkError) => {
      if (unlinkError.code !== "ENOENT") throw unlinkError;
    });
    throw error;
  }
  return {path: OUTPUT_PATH, bytes: Buffer.byteLength(expected), sha256: sha256(Buffer.from(expected, "utf8")), changed: true};
}

export function parseArguments(argv) {
  const options = {root: PROJECT_ROOT, mode: "check", help: false};
  let explicitMode = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check" || argument === "--write") {
      const mode = argument.slice(2);
      invariant(!explicitMode || explicitMode === mode, "--check and --write are mutually exclusive");
      explicitMode = mode;
      options.mode = mode;
    } else if (argument === "--root") {
      const root = argv[++index];
      invariant(root && !root.startsWith("--"), "--root requires a path");
      options.root = path.resolve(root);
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage: node ${GENERATOR_PATH} [--check | --write] [--root <project-root>]

Default mode is --check. It rebuilds the source-static, acceptance-neutral
binding in memory and compares ${OUTPUT_PATH} without writing.

--write is the only mode that creates or atomically refreshes the generated
binding. It never changes migration.json, inventories, keyframes, trace specs,
registries, ledgers, reviews, acceptance, strict-completion, or publication state.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const report = await buildReport({root: options.root});
  const descriptor = options.mode === "write"
    ? await writeReport({root: options.root, report})
    : await checkReport({root: options.root, report});
  process.stdout.write(`${options.mode === "write" ? (descriptor.changed ? "WROTE" : "UNCHANGED") : "PASS"}: ${descriptor.path} ${descriptor.bytes} bytes sha256=${descriptor.sha256}; 2 cue candidates, 2 language obligations, all formal/acceptance effects false\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
