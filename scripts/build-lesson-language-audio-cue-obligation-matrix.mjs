#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  embeddedInventoryRows,
  externalInventoryRows,
} from "./audit-pilot-audio.mjs";
import {parseAudioInventory} from "./audio-listening-acceptance.mjs";
import {
  assertSafeReportOutput,
  writeOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const RELEASES_PATH = "catalog/lesson-releases.json";
const LESSONS_PATH = "catalog/lessons.json";
const SOURCE_FILES_PATH = "catalog/source-files.json";
const ANIMATIONS_PATH = "catalog/animations.json";
const AUDIO_GROUPS_PATH = "catalog/audio-groups.json";
const AUDIO_PARSER_PATH = "scripts/audio-listening-acceptance.mjs";
const AUDIO_AUDITOR_PATH = "scripts/audit-pilot-audio.mjs";
const SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const LANGUAGES = Object.freeze(["en", "es"]);
const UNRESOLVED_REQUIREMENTS = Object.freeze([
  "exact-runtime-cue-ownership-and-reachability",
  "spoken-content-language-and-voice",
  "natural-host-state-and-interaction-trace",
  "start-stop-pause-complete-synchronization",
  "replay-reset-behavior",
  "named-human-authorized-original-runtime-listening",
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const INVENTORY_HEADERS = Object.freeze([
  "cue_id",
  "language",
  "source_file",
  "sha256",
  "start_frame",
  "start_frame_domain_id",
  "start_semantics",
  "duration_ms",
  "format",
  "channels",
  "sample_rate_hz",
  "source_character_id",
  "notes",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function sameCanonical(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function fingerprint(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value))));
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectRelative(root, candidate, {prefix, extension, label}) {
  const absolute = path.isAbsolute(candidate) ? path.resolve(candidate) : path.resolve(root, candidate);
  const relative = portable(path.relative(root, absolute));
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${label} escapes the project root`);
  invariant(!relative.includes("\\") && portable(path.normalize(relative)) === relative, `${label} is not normalized`);
  if (prefix) invariant(relative.startsWith(prefix), `${label} must be below ${prefix}`);
  if (extension) invariant(path.extname(relative).toLowerCase() === extension, `${label} must use ${extension}`);
  return relative;
}

async function readRegularProjectFile(root, relativePath, label) {
  const safePath = projectRelative(root, relativePath, {label});
  const absolute = path.join(root, safePath);
  const information = await lstat(absolute);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symlink file: ${safePath}`);
  invariant(await realpath(absolute) === absolute, `${label} contains a symlink path component: ${safePath}`);
  const bytes = await readFile(absolute);
  return {
    bytes,
    descriptor: {path: safePath, bytes: bytes.length, sha256: sha256(bytes)},
  };
}

async function readJsonProjectFile(root, relativePath, label) {
  const input = await readRegularProjectFile(root, relativePath, label);
  try {
    return {...input, value: JSON.parse(input.bytes.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function normalizeGeneratedInventoryRow(row) {
  return Object.fromEntries(INVENTORY_HEADERS.map((header) => [header, String(row[header] ?? "")]));
}

function catalogPathFromSourceFile(sourceFile, label) {
  invariant(typeof sourceFile === "string" && sourceFile.startsWith(`${SOURCE_ROOT}/`), `${label} is outside the canonical source root`);
  const relative = sourceFile.slice(SOURCE_ROOT.length + 1);
  invariant(relative && !path.isAbsolute(relative) && !relative.includes("\\") && portable(path.normalize(relative)) === relative,
    `${label} is not a normalized catalog path`);
  return relative;
}

function catalogRecord(sourceByPath, catalogPath, label) {
  const record = sourceByPath.get(catalogPath);
  invariant(record, `${label} is absent from catalog/source-files.json: ${catalogPath}`);
  invariant(Number.isSafeInteger(record.bytes) && record.bytes > 0 && SHA256_PATTERN.test(record.sha256 || ""),
    `${label} catalog descriptor is invalid: ${catalogPath}`);
  return record;
}

function routeCandidateFromLanguageAssessment(assessment, label) {
  invariant(assessment && LANGUAGES.includes(assessment.language), `${label} lacks an EN/ES route classification`);
  invariant(assessment.routingLanguage === assessment.language, `${label} routing language differs from its language candidate`);
  invariant(assessment.classificationScope === "legacy-host-routing-only" && assessment.confidence === "verified-structural",
    `${label} language classification is not a structural host-route candidate`);
  invariant(assessment.spokenLanguage === null && assessment.spokenLanguageEstablished === false,
    `${label} improperly claims spoken-language evidence`);
  return assessment.language;
}

function externalFileIdentity(item) {
  return {
    path: item.sourceFile,
    sha256: item.observedSha256,
    bytes: item.bytes,
  };
}

function exactAssociationIdentity(item) {
  return {
    sourceFile: item.sourceFile,
    sha256: item.observedSha256,
    bytes: item.bytes,
  };
}

function manifestAssociationIdentity(item) {
  return {
    sourceFile: item.sourceFile,
    sha256: item.sha256,
    bytes: item.bytes,
  };
}

function catalogAudioFileIdentity(record, {groupId = null, label}) {
  invariant(record && typeof record.path === "string" && record.path.length > 0,
    `${label}: catalog audio path is missing`);
  invariant(Number.isSafeInteger(record.bytes) && record.bytes > 0 && SHA256_PATTERN.test(record.sha256 || ""),
    `${label}: catalog audio descriptor is invalid`);
  const identity = {
    sourceFile: `${SOURCE_ROOT}/${record.path}`,
    sha256: record.sha256,
    bytes: record.bytes,
  };
  if (groupId !== null) {
    invariant(typeof groupId === "string" && groupId.length > 0, `${label}: catalog audio group ID is invalid`);
    invariant(LANGUAGES.includes(record.language), `${label}: candidate-only catalog language must be en or es`);
    return {...identity, groupId, routingLanguageCandidate: record.language};
  }
  invariant(record.association === "matching-basename", `${label}: exact catalog association is not matching-basename`);
  return {...identity, association: record.association};
}

function auditedExactCatalogIdentity(item) {
  return {
    sourceFile: item.sourceFile,
    sha256: item.catalogSha256,
    bytes: item.bytes,
    association: item.association,
  };
}

function auditedGroupCatalogIdentity(item) {
  return {
    sourceFile: item.sourceFile,
    sha256: item.catalogSha256,
    bytes: item.bytes,
    groupId: item.groupId,
    routingLanguageCandidate: item.languageAssessment?.language,
  };
}

function hostRouteCandidate(language) {
  invariant(LANGUAGES.includes(language), `Unsupported language route: ${language}`);
  return language === "en"
    ? {languageCode: "EN", finalQuizDirectory: "EA", ordinaryPageExternalDirectory: null}
    : {languageCode: "SP", finalQuizDirectory: "SA", ordinaryPageExternalDirectory: "SA"};
}

function hostAuthorityProjection(authority) {
  return {
    sourceFile: authority.sourceFile,
    sha256: authority.sha256,
    extractor: authority.extractor,
    extractedScriptCount: authority.extractedScriptCount,
    audioRelevantScriptCount: authority.audioRelevantScriptCount,
    combinedAudioRelevantScriptsSha256: authority.combinedAudioRelevantScriptsSha256,
    conventions: authority.conventions,
  };
}

function activeXmlPageLine(reference, member) {
  const lines = (reference.matchedLines || []).filter(({text}) => String(text || "").trimStart().startsWith("<Page "));
  invariant(lines.length === 1, `${member.animationId}: expected exactly one active XML Page line, found ${lines.length}`);
  const lessonPrefix = `${reference.lessonPageRoot || ""}/`;
  invariant(lessonPrefix !== "/" && member.source.path.startsWith(lessonPrefix),
    `${member.animationId}: release source is outside the lesson PageRoot`);
  const relativePagePath = member.source.path.slice(lessonPrefix.length);
  invariant(lines[0].text.includes(`>${relativePagePath}</Page>`), `${member.animationId}: active XML line does not bind its release source path`);
  return {
    lineNumber: lines[0].lineNumber,
    text: lines[0].text,
    randomAudio: lines[0].text.includes('RandomAudio="Yes"')
      ? "yes"
      : lines[0].text.includes('RandomAudio=""')
        ? "empty"
        : "not-declared",
  };
}

async function inspectPhysicalCatalogFile(root, sourceByPath, sourceFile, expected, label) {
  const catalogPath = catalogPathFromSourceFile(sourceFile, label);
  const catalog = catalogRecord(sourceByPath, catalogPath, label);
  invariant(catalog.sha256 === expected.sha256 && catalog.bytes === expected.bytes,
    `${label} audit/catalog identity differs: ${catalogPath}`);
  const physical = await readRegularProjectFile(root, sourceFile, label);
  invariant(physical.descriptor.sha256 === catalog.sha256 && physical.descriptor.bytes === catalog.bytes,
    `${label} physical bytes differ from catalog: ${catalogPath}`);
  return physical.descriptor;
}

async function inspectMember({
  root,
  release,
  member,
  lesson,
  sourceByPath,
  animationsById,
  audioGroupsById,
}) {
  const workspace = `migrations/${member.animationId}`;
  const [manifestInput, inventoryInput, auditInput] = await Promise.all([
    readJsonProjectFile(root, `${workspace}/migration.json`, `${member.animationId} migration manifest`),
    readRegularProjectFile(root, `${workspace}/audio-inventory.csv`, `${member.animationId} audio inventory`),
    readJsonProjectFile(root, `${workspace}/audit/audio-runtime-evidence.json`, `${member.animationId} audio runtime audit`),
  ]);
  const manifest = manifestInput.value;
  const audit = auditInput.value;

  const catalogAnimation = animationsById.get(member.animationId);
  invariant(catalogAnimation?.animationId === member.animationId
    && catalogAnimation.assetId === member.assetId
    && catalogAnimation.source?.path === member.source.path
    && catalogAnimation.source.sha256 === member.source.sha256,
  `${member.animationId}: current animations catalog identity differs from release membership`);

  invariant((manifest.animationId || manifest.id) === member.animationId, `${member.animationId}: manifest identity differs`);
  invariant(manifest.assetId === member.assetId, `${member.animationId}: manifest assetId differs`);
  invariant(manifest.source?.swfSha256 === member.source.sha256, `${member.animationId}: manifest SWF hash differs`);
  invariant(manifest.localization?.bilingualRequired === true && sameCanonical(manifest.localization.languages, LANGUAGES),
    `${member.animationId}: EN/ES localization contract differs`);
  invariant(manifest.audio?.inventoryFile === "audio-inventory.csv", `${member.animationId}: canonical audio inventory path differs`);

  invariant(audit.schemaVersion === 2 && audit.scope === "strict-audio-structural-and-file-metadata-audit",
    `${member.animationId}: audio runtime audit schema/scope differs`);
  invariant(audit.animationId === member.animationId, `${member.animationId}: audio runtime audit identity differs`);
  invariant(audit.source?.expectedSha256 === member.source.sha256 && audit.source.observedSha256 === member.source.sha256
    && audit.source.hashMatches === true, `${member.animationId}: audio runtime audit source binding is stale`);
  invariant(audit.migrationStatusUnchanged === true, `${member.animationId}: audio runtime audit changed migration status`);
  invariant(audit.acceptance?.structurallyAudited === true
    && audit.acceptance.authoritativeListeningComplete === false
    && audit.acceptance.hostStateTraversalComplete === false
    && audit.acceptance.synchronizationComplete === false
    && audit.acceptance.strictAudioAcceptance === "pending",
  `${member.animationId}: audio audit crossed the pending machine-evidence boundary`);
  invariant(Object.values(audit.acceptance.releaseBoundary || {}).every((value) => value === false || value === "none"),
    `${member.animationId}: audio audit release boundary is not acceptance-neutral`);

  const membership = audit.authority?.lessonReleaseMembership;
  invariant(membership?.releaseId === release.releaseId && membership.expectedMemberCount === release.members.length
    && membership.ordinal === member.ordinal && membership.animationId === member.animationId
    && membership.assetId === member.assetId && membership.source?.path === member.source.path
    && membership.source?.sha256 === member.source.sha256,
  `${member.animationId}: audio audit lesson-release binding differs`);

  const sourceCatalogRecord = catalogRecord(sourceByPath, member.source.path, `${member.animationId} source SWF`);
  invariant(sourceCatalogRecord.sha256 === member.source.sha256, `${member.animationId}: release/source catalog hash differs`);
  const physicalSwf = await readRegularProjectFile(root, `${SOURCE_ROOT}/${member.source.path}`, `${member.animationId} source SWF`);
  invariant(physicalSwf.descriptor.sha256 === member.source.sha256 && physicalSwf.descriptor.bytes === sourceCatalogRecord.bytes,
    `${member.animationId}: physical source SWF differs`);

  let xmlPage = null;
  if (member.releaseRole === "course-shell") {
    invariant((audit.authority?.xmlReferences || []).length === 0, `${member.animationId}: shell unexpectedly has a page XML occurrence`);
  } else {
    invariant(Number.isInteger(member.xmlOccurrence) && member.xmlOccurrence >= 1, `${member.animationId}: active page lacks XML occurrence`);
    const references = audit.authority?.xmlReferences || [];
    invariant(references.length === 1, `${member.animationId}: expected exactly one XML reference`);
    const reference = references[0];
    invariant(reference.sourceFile === `${SOURCE_ROOT}/${lesson.path}` && reference.sha256 === lesson.sha256
      && reference.catalogOccurrence === member.xmlOccurrence,
    `${member.animationId}: XML reference differs from the lesson/release binding`);
    xmlPage = activeXmlPageLine({...reference, lessonPageRoot: lesson.pageRoot}, member);
  }

  const parsedInventory = parseAudioInventory(inventoryInput.bytes.toString("utf8"));
  invariant(sameCanonical(parsedInventory.headers, INVENTORY_HEADERS), `${member.animationId}: audio inventory headers differ`);
  const expectedInventory = [
    ...externalInventoryRows(audit.externalAudio?.exactAssociations || [], manifest, audit.authority.hostScript),
    ...embeddedInventoryRows(manifest, audit.embeddedAudio || {defineSounds: [], startSounds: [], soundStreams: []}),
  ].map(normalizeGeneratedInventoryRow);
  invariant(sameCanonical(parsedInventory.rows, expectedInventory), `${member.animationId}: inventory does not exactly triangulate with the audio audit`);
  invariant(audit.inventory?.rowCount === parsedInventory.rows.length
    && audit.inventory.exactExternalRows === (audit.externalAudio?.exactAssociations || []).length
    && audit.inventory.embeddedRows === expectedInventory.filter(({cue_id: cueId}) => cueId.startsWith("embedded-")).length,
  `${member.animationId}: audio audit inventory summary is stale`);

  const exactAssociations = audit.externalAudio?.exactAssociations || [];
  const groupCandidates = audit.externalAudio?.lessonGroupCandidates || [];
  const expectedMissing = audit.externalAudio?.expectedButMissing || [];
  invariant(audit.externalAudio?.exactCount === exactAssociations.length
    && audit.externalAudio.candidateOnlyCount === groupCandidates.length
    && audit.externalAudio.missingExpectedCount === expectedMissing.length,
  `${member.animationId}: external audio counts are stale`);
  invariant(expectedMissing.length === 0, `${member.animationId}: expected external source is missing`);
  invariant(!(exactAssociations.length && groupCandidates.length), `${member.animationId}: exact and candidate-only external pools overlap`);

  const currentCatalogExact = (catalogAnimation.audio?.exact || [])
    .map((record, index) => catalogAudioFileIdentity(record, {
      label: `${member.animationId} animations catalog exact association ${index + 1}`,
    }))
    .sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
  const auditedCatalogExact = exactAssociations
    .map(auditedExactCatalogIdentity)
    .sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
  invariant(sameCanonical(currentCatalogExact, auditedCatalogExact),
    `${member.animationId}: audio audit exact associations are stale against catalog/animations.json`);

  const currentCatalogGroupIds = [...(catalogAnimation.audio?.groupIds || [])].sort();
  invariant(new Set(currentCatalogGroupIds).size === currentCatalogGroupIds.length,
    `${member.animationId}: animations catalog audio-group IDs are duplicated`);
  const currentCatalogCandidates = [];
  for (const groupId of currentCatalogGroupIds) {
    const group = audioGroupsById.get(groupId);
    invariant(group, `${member.animationId}: current audio-groups catalog lacks ${groupId}`);
    const groupFiles = (group.files || []).map((record, index) => catalogAudioFileIdentity(record, {
      groupId,
      label: `${member.animationId} ${groupId} catalog candidate ${index + 1}`,
    }));
    invariant(new Set(groupFiles.map(({sourceFile}) => sourceFile)).size === groupFiles.length,
      `${member.animationId}: ${groupId} catalog candidate paths are duplicated`);
    currentCatalogCandidates.push(...groupFiles);
  }
  currentCatalogCandidates.sort((left, right) =>
    left.sourceFile.localeCompare(right.sourceFile) || left.groupId.localeCompare(right.groupId));
  const auditedCatalogCandidates = groupCandidates
    .map(auditedGroupCatalogIdentity)
    .sort((left, right) =>
      left.sourceFile.localeCompare(right.sourceFile) || left.groupId.localeCompare(right.groupId));
  invariant(sameCanonical(currentCatalogCandidates, auditedCatalogCandidates),
    `${member.animationId}: audio audit candidate-only pool is stale against catalog/animations.json or catalog/audio-groups.json`);

  invariant(sameCanonical((manifest.audio.catalogExactAssociations || []).map(manifestAssociationIdentity).sort((a, b) => a.sourceFile.localeCompare(b.sourceFile)),
    exactAssociations.map(exactAssociationIdentity).sort((a, b) => a.sourceFile.localeCompare(b.sourceFile))),
  `${member.animationId}: manifest and audit exact-basename associations differ`);
  const auditedGroupIds = [...new Set(groupCandidates.map(({groupId}) => groupId))].sort();
  invariant(sameCanonical([...(manifest.audio.catalogGroupCandidates || [])].sort(), auditedGroupIds),
    `${member.animationId}: manifest and audit candidate-only group IDs differ`);
  invariant(sameCanonical([...(manifest.audio.catalogGroupCandidates || [])].sort(), currentCatalogGroupIds),
    `${member.animationId}: manifest candidate-only group IDs are stale against catalog/animations.json`);

  const exactReferences = exactAssociations.map((item, index) => {
    invariant(item.associationStatus === "exact-basename-association" && item.association === "matching-basename",
      `${member.animationId}: exact external association ${index + 1} is not matching-basename-only`);
    invariant(item.hashMatchesCatalog === true && item.catalogSha256 === item.observedSha256,
      `${member.animationId}: exact external association ${index + 1} has stale bytes`);
    const routingLanguage = routeCandidateFromLanguageAssessment(item.languageAssessment,
      `${member.animationId} exact association ${index + 1}`);
    invariant(routingLanguage === "es", `${member.animationId}: ordinary matching-basename audio is not an SA/Spanish host-route candidate`);
    return {item, routingLanguage};
  });
  const candidateReferences = groupCandidates.map((item, index) => {
    invariant(item.associationStatus === "lesson-group-candidate-only" && item.association === "lesson-group-candidate-only",
      `${member.animationId}: group candidate ${index + 1} crossed the candidate-only boundary`);
    invariant(item.hashMatchesCatalog === true && item.catalogSha256 === item.observedSha256,
      `${member.animationId}: group candidate ${index + 1} has stale bytes`);
    const routingLanguage = routeCandidateFromLanguageAssessment(item.languageAssessment,
      `${member.animationId} group candidate ${index + 1}`);
    return {item, routingLanguage};
  });

  const streams = (audit.embeddedAudio?.soundStreams || []).map((stream) => ({
    candidateId: `${member.animationId}:embedded-stream-${String(stream.streamIndex).padStart(4, "0")}`,
    animationId: member.animationId,
    origin: "embedded-sound-stream",
    sourceSwf: physicalSwf.descriptor,
    streamIndex: stream.streamIndex,
    context: stream.context,
    contextLabel: stream.contextLabel,
    contextDeclaredFrames: stream.contextDeclaredFrames,
    headFrame: stream.headFrame,
    firstBlockFrame: stream.firstBlockFrame,
    lastBlockFrame: stream.lastBlockFrame,
    blockCount: stream.blockCount,
    durationMs: stream.durationMs,
    durationBasis: stream.durationBasis,
    format: stream.format,
    channels: stream.channels,
    sampleRateHz: stream.sampleRateHz,
    syncMode: stream.syncMode,
    inventoryRepresented: Number(stream.durationMs) > 0,
    inventoryCueId: Number(stream.durationMs) > 0 ? `embedded-stream-${String(stream.streamIndex).padStart(4, "0")}` : null,
    languageCandidate: "und",
    spokenLanguage: null,
    rootRuntimeCueTime: null,
    status: Number(stream.durationMs) > 0
      ? "timed-structural-stream-candidate-listening-required"
      : "zero-block-or-unknown-duration-stream-structure-not-proven-audible",
  }));
  invariant(new Set(streams.map(({candidateId}) => candidateId)).size === streams.length,
    `${member.animationId}: embedded SoundStream identities are duplicated`);

  const defineSounds = (audit.embeddedAudio?.defineSounds || []).map((sound) => ({
    candidateId: `${member.animationId}:embedded-define-sound-${String(sound.characterId).padStart(4, "0")}`,
    animationId: member.animationId,
    origin: "embedded-define-sound",
    sourceSwf: physicalSwf.descriptor,
    characterId: sound.characterId,
    linkage: sound.linkage || null,
    samples: sound.samples,
    durationMs: sound.durationMs,
    durationBasis: sound.durationBasis,
    format: sound.format,
    channels: sound.channels,
    sampleRateHz: sound.sampleRateHz,
    inventoryRepresented: Number(sound.durationMs) > 0,
    inventoryCueId: Number(sound.durationMs) > 0 ? `embedded-define-sound-${String(sound.characterId).padStart(4, "0")}` : null,
    languageCandidate: "und",
    spokenLanguage: null,
    rootRuntimeCueTime: null,
    status: Number(sound.durationMs) > 0
      ? "timed-structural-define-sound-candidate-trigger-unresolved"
      : "define-sound-structure-not-proven-audible",
  }));
  invariant(new Set(defineSounds.map(({candidateId}) => candidateId)).size === defineSounds.length,
    `${member.animationId}: embedded DefineSound identities are duplicated`);

  const actionScriptOperations = (audit.actionScriptAudioOperations || []).map((operation, index) => ({
    operationId: `${member.animationId}:actionscript-audio-operation-${String(index + 1).padStart(3, "0")}`,
    animationId: member.animationId,
    location: operation.location,
    sourceLocalFrame: operation.localFrame,
    sourceLine: operation.sourceLine,
    receiver: operation.receiver,
    operation: operation.operation,
    argumentExpression: operation.argumentExpression,
    literal: operation.literal,
    cueFrameAuthority: operation.cueFrameAuthority,
    resolvedCueCandidateId: null,
    runtimeInvocationEstablished: false,
    routingLanguageCandidate: "und",
    status: "source-operation-natural-host-traversal-required",
  }));

  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    source: physicalSwf.descriptor,
    xmlOccurrence: member.xmlOccurrence,
    xmlPage,
    inputBindings: {
      manifest: manifestInput.descriptor,
      audioInventory: inventoryInput.descriptor,
      audioRuntimeAudit: auditInput.descriptor,
    },
    catalogAudioBinding: {
      currentCatalogReconciled: true,
      animationIdentitySha256: fingerprint({
        animationId: catalogAnimation.animationId,
        assetId: catalogAnimation.assetId,
        source: {
          path: catalogAnimation.source.path,
          bytes: catalogAnimation.source.bytes,
          sha256: catalogAnimation.source.sha256,
        },
      }),
      exactAssociationCount: currentCatalogExact.length,
      exactAssociationSetSha256: fingerprint(currentCatalogExact),
      groupIds: currentCatalogGroupIds,
      candidateOnlyFileCount: currentCatalogCandidates.length,
      candidateOnlySetSha256: fingerprint(currentCatalogCandidates),
      evidenceScope: "current-catalog-membership-and-byte-identity-only",
    },
    manifestObservation: {
      audioRequired: manifest.audio.required,
      declaredAudioLanguages: manifest.audio.languages,
      adoptedCueCount: (manifest.audio.cues || []).length,
      exactCatalogAssociationCount: (manifest.audio.catalogExactAssociations || []).length,
      candidateGroupIds: manifest.audio.catalogGroupCandidates || [],
      acceptanceEffect: "none-observation-only",
    },
    canonicalInventory: {
      rowCount: parsedInventory.rows.length,
      rows: parsedInventory.rows,
      exactMachineTriangulation: true,
    },
    hostAuthority: hostAuthorityProjection(audit.authority.hostScript),
    exactReferences,
    candidateReferences,
    streams,
    defineSounds,
    actionScriptOperations,
    manifestFollowUp: [...(audit.acceptance.manifestFollowUp || [])],
  };
}

function mergeExternalPool(references, classification) {
  const byPath = new Map();
  for (const reference of references) {
    const {member, item, routingLanguage} = reference;
    if (classification === "lesson-group-candidate-only") {
      invariant(typeof item.groupId === "string" && item.groupId.length > 0,
        `${member.animationId}: candidate-only reference lacks an audio-group ID`);
    }
    const identity = externalFileIdentity(item);
    const current = byPath.get(identity.path);
    if (current) {
      invariant(current.source.sha256 === identity.sha256 && current.source.bytes === identity.bytes,
        `${identity.path}: repeated external reference has conflicting bytes`);
      invariant(current.routingLanguageCandidate === routingLanguage,
        `${identity.path}: repeated external reference has conflicting language-route candidates`);
      current.ownerAnimationIds.push(member.animationId);
      current.ownerOrdinals.push(member.ordinal);
      current.ownerReferences.push({
        animationId: member.animationId,
        ordinal: member.ordinal,
        groupId: classification === "lesson-group-candidate-only" ? item.groupId : null,
      });
      if (classification === "lesson-group-candidate-only") {
        invariant(typeof item.groupId === "string" && item.groupId.length > 0,
          `${identity.path}: candidate-only reference lacks an audio-group ID`);
        if (!current.catalogGroupIds.includes(item.groupId)) current.catalogGroupIds.push(item.groupId);
        current.catalogGroupIds.sort();
      }
      current.referenceCount += 1;
      continue;
    }
    byPath.set(identity.path, {
      candidateId: `external-${fingerprint(identity)}`,
      classification,
      source: identity,
      routingLanguageCandidate: routingLanguage,
      spokenLanguage: null,
      spokenLanguageEstablished: false,
      ownerAnimationIds: [member.animationId],
      ownerOrdinals: [member.ordinal],
      ownerReferences: [{
        animationId: member.animationId,
        ordinal: member.ordinal,
        groupId: classification === "lesson-group-candidate-only" ? item.groupId : null,
      }],
      catalogGroupIds: classification === "lesson-group-candidate-only" ? [item.groupId] : [],
      referenceCount: 1,
      probe: {
        codecName: item.probe?.codecName || null,
        durationMs: item.probe?.durationMs || null,
        channels: item.probe?.channels || null,
        sampleRateHz: item.probe?.sampleRateHz || null,
      },
      cueTiming: null,
      voiceIdentity: null,
      runtimeReachabilityEstablished: false,
      listeningRequired: true,
      status: classification === "exact-basename-association-only"
        ? "hash-bound-member-association-runtime-cue-unresolved"
        : "lesson-group-candidate-only-member-cue-unresolved",
    });
  }
  return [...byPath.values()].sort((left, right) => left.source.path.localeCompare(right.source.path));
}

function duplicateHashGroups(files) {
  const byHash = new Map();
  for (const file of files) {
    const group = byHash.get(file.source.sha256) || [];
    group.push(file.source.path);
    byHash.set(file.source.sha256, group);
  }
  return [...byHash.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([sha256Value, paths]) => ({sha256: sha256Value, paths: paths.sort()}))
    .sort((left, right) => left.sha256.localeCompare(right.sha256));
}

function countsBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => String(left).localeCompare(String(right))));
}

export async function buildLessonLanguageAudioCueObligationMatrix({
  root = PROJECT_ROOT,
  releaseId,
} = {}) {
  invariant(typeof releaseId === "string" && /^[a-z0-9][a-z0-9-]+$/.test(releaseId), "--release-id is required and must be a safe release ID");
  const [
    releaseInput,
    lessonInput,
    sourceFilesInput,
    animationsInput,
    audioGroupsInput,
    parserInput,
    auditorInput,
    generatorBytes,
  ] = await Promise.all([
    readJsonProjectFile(root, RELEASES_PATH, "lesson release catalog"),
    readJsonProjectFile(root, LESSONS_PATH, "lesson catalog"),
    readJsonProjectFile(root, SOURCE_FILES_PATH, "source file catalog"),
    readJsonProjectFile(root, ANIMATIONS_PATH, "animations catalog"),
    readJsonProjectFile(root, AUDIO_GROUPS_PATH, "audio groups catalog"),
    readRegularProjectFile(root, AUDIO_PARSER_PATH, "audio inventory parser"),
    readRegularProjectFile(root, AUDIO_AUDITOR_PATH, "audio audit generator"),
    readFile(GENERATOR_PATH),
  ]);

  const releaseMatches = (releaseInput.value.releases || []).filter((release) => release.releaseId === releaseId);
  invariant(releaseMatches.length === 1, `Expected one lesson release ${releaseId}, found ${releaseMatches.length}`);
  const release = releaseMatches[0];
  invariant(release.publicationMode === "atomic" && release.releaseType === "complete-lesson",
    `${releaseId}: cue obligations require an atomic complete-lesson release`);
  invariant(release.expectedCounts?.members === release.members.length, `${releaseId}: expected member count is stale`);
  invariant(new Set(release.members.map(({animationId}) => animationId)).size === release.members.length,
    `${releaseId}: member IDs are duplicated`);
  invariant(release.members.every((member, index) => member.ordinal === index + 1), `${releaseId}: member ordinals are not contiguous`);
  const activePageMembers = release.members.filter(({releaseRole}) => releaseRole === "active-xml-referenced-page");
  const shellMembers = release.members.filter(({releaseRole}) => releaseRole === "course-shell");
  invariant(activePageMembers.length === release.expectedCounts.activeXmlReferencedPages
    && shellMembers.length === release.expectedCounts.courseShells
    && activePageMembers.length + shellMembers.length === release.members.length,
  `${releaseId}: release role partition differs from its expected counts`);
  const expectedXmlOccurrences = Array.from({length: release.expectedCounts.activeXmlReferencedPages}, (_, index) => index + 1);
  const actualXmlOccurrences = activePageMembers.map(({xmlOccurrence}) => xmlOccurrence).sort((left, right) => left - right);
  invariant(sameCanonical(actualXmlOccurrences, expectedXmlOccurrences),
    `${releaseId}: active-page XML occurrences are not unique and exhaustive`);
  invariant(shellMembers.every(({xmlOccurrence}) => xmlOccurrence === null || xmlOccurrence === undefined),
    `${releaseId}: course shell unexpectedly declares an XML occurrence`);

  const lessonMatches = (lessonInput.value.lessons || []).filter((lesson) => lesson.grade === release.grade && lesson.lesson === release.lesson);
  invariant(lessonMatches.length === 1, `${releaseId}: expected one lesson catalog row, found ${lessonMatches.length}`);
  const lesson = lessonMatches[0];
  invariant(lesson.path === release.sourceLesson.path && lesson.sha256 === release.sourceLesson.sha256
    && lesson.bytes === release.sourceLesson.bytes, `${releaseId}: release and lesson catalog XML descriptors differ`);
  invariant(lesson.pageReferenceCount === release.expectedCounts.activeXmlReferencedPages
    && lesson.sectionCount === lesson.sections.length, `${releaseId}: lesson XML counts differ from the release`);
  invariant(lesson.sections.every((section) => typeof section.titleEnglish === "string" && section.titleEnglish.length > 0
    && typeof section.titleSpanish === "string" && section.titleSpanish.length > 0),
  `${releaseId}: lesson catalog lacks bilingual section labels`);

  const sourceByPath = new Map();
  for (const record of sourceFilesInput.value.files || []) {
    invariant(typeof record.path === "string" && !sourceByPath.has(record.path), `Duplicate source catalog path: ${record.path || "missing"}`);
    sourceByPath.set(record.path, record);
  }
  const animationsById = new Map();
  for (const animation of animationsInput.value.animations || []) {
    invariant(typeof animation.animationId === "string" && !animationsById.has(animation.animationId),
      `Duplicate animations catalog ID: ${animation.animationId || "missing"}`);
    animationsById.set(animation.animationId, animation);
  }
  const audioGroupsById = new Map();
  for (const group of audioGroupsInput.value.groups || []) {
    invariant(typeof group.groupId === "string" && !audioGroupsById.has(group.groupId),
      `Duplicate audio-groups catalog ID: ${group.groupId || "missing"}`);
    audioGroupsById.set(group.groupId, group);
  }
  const lessonCatalogRecord = catalogRecord(sourceByPath, lesson.path, "lesson XML");
  invariant(lessonCatalogRecord.sha256 === lesson.sha256 && lessonCatalogRecord.bytes === lesson.bytes,
    `${releaseId}: lesson XML source catalog identity differs`);
  const lessonXmlInput = await readRegularProjectFile(root, `${SOURCE_ROOT}/${lesson.path}`, "lesson XML source");
  invariant(lessonXmlInput.descriptor.sha256 === lesson.sha256 && lessonXmlInput.descriptor.bytes === lesson.bytes,
    `${releaseId}: physical lesson XML differs`);

  const members = [];
  for (const member of release.members) {
    members.push(await inspectMember({
      root,
      release,
      member,
      lesson,
      sourceByPath,
      animationsById,
      audioGroupsById,
    }));
  }
  const hostAuthorities = members.map(({hostAuthority}) => hostAuthority);
  invariant(hostAuthorities.every((authority) => sameCanonical(authority, hostAuthorities[0])),
    `${releaseId}: member audio audits disagree on host language authority`);
  const hostAuthority = hostAuthorities[0];
  invariant(hostAuthority?.conventions?.finalQuiz?.verified === true
    && hostAuthority.conventions.courseSpanishPage?.verified === true,
  `${releaseId}: required final-quiz and Spanish-page host route conventions are unverified`);
  invariant(SHA256_PATTERN.test(hostAuthority.sha256 || "") && SHA256_PATTERN.test(hostAuthority.combinedAudioRelevantScriptsSha256 || ""),
    `${releaseId}: host script authority hashes are invalid`);
  const hostCatalogPath = catalogPathFromSourceFile(hostAuthority.sourceFile, "lesson host SWF");
  const hostCatalogRecord = catalogRecord(sourceByPath, hostCatalogPath, "lesson host SWF");
  invariant(hostCatalogRecord.sha256 === hostAuthority.sha256, `${releaseId}: host SWF audit/catalog hash differs`);
  const hostPhysical = await readRegularProjectFile(root, hostAuthority.sourceFile, "lesson host SWF");
  invariant(hostPhysical.descriptor.sha256 === hostAuthority.sha256 && hostPhysical.descriptor.bytes === hostCatalogRecord.bytes,
    `${releaseId}: physical host SWF differs`);

  const exactReferences = members.flatMap((member) => member.exactReferences.map(({item, routingLanguage}) => ({member, item, routingLanguage})));
  const candidateReferences = members.flatMap((member) => member.candidateReferences.map(({item, routingLanguage}) => ({member, item, routingLanguage})));
  const exactFiles = mergeExternalPool(exactReferences, "exact-basename-association-only");
  const candidateFiles = mergeExternalPool(candidateReferences, "lesson-group-candidate-only");
  const externalFiles = [...exactFiles, ...candidateFiles];
  invariant(new Set(externalFiles.map(({source}) => source.path)).size === externalFiles.length,
    `${releaseId}: exact and candidate-only external pools overlap by path`);

  for (const file of externalFiles) {
    const physical = await inspectPhysicalCatalogFile(root, sourceByPath, file.source.path, file.source, `external audio ${file.source.path}`);
    file.physicalVerification = {
      descriptor: physical,
      sourceCatalogBytesAndSha256Match: true,
      regularNonSymlinkFile: true,
    };
  }

  const embeddedStreams = members.flatMap(({streams}) => streams);
  const defineSounds = members.flatMap(({defineSounds: definitions}) => definitions);
  const actionScriptOperations = members.flatMap(({actionScriptOperations: operations}) => operations);
  invariant(new Set(embeddedStreams.map(({candidateId}) => candidateId)).size === embeddedStreams.length,
    `${releaseId}: release SoundStream identities are duplicated`);
  invariant(new Set(defineSounds.map(({candidateId}) => candidateId)).size === defineSounds.length,
    `${releaseId}: release DefineSound identities are duplicated`);
  invariant(new Set(actionScriptOperations.map(({operationId}) => operationId)).size === actionScriptOperations.length,
    `${releaseId}: release ActionScript audio operation identities are duplicated`);

  const exactIdsByMemberLanguage = new Map();
  for (const file of exactFiles) {
    for (const animationId of file.ownerAnimationIds) {
      exactIdsByMemberLanguage.set(`${animationId}\u0000${file.routingLanguageCandidate}`,
        [...(exactIdsByMemberLanguage.get(`${animationId}\u0000${file.routingLanguageCandidate}`) || []), file.candidateId]);
    }
  }
  const candidateIdsByMemberLanguage = new Map();
  for (const file of candidateFiles) {
    for (const animationId of file.ownerAnimationIds) {
      candidateIdsByMemberLanguage.set(`${animationId}\u0000${file.routingLanguageCandidate}`,
        [...(candidateIdsByMemberLanguage.get(`${animationId}\u0000${file.routingLanguageCandidate}`) || []), file.candidateId]);
    }
  }

  const obligationRows = members.flatMap((member) => LANGUAGES.map((language) => {
    const exactCandidateIds = [...(exactIdsByMemberLanguage.get(`${member.animationId}\u0000${language}`) || [])].sort();
    const candidateOnlyIds = [...(candidateIdsByMemberLanguage.get(`${member.animationId}\u0000${language}`) || [])].sort();
    const embeddedCandidateIds = [...member.streams.map(({candidateId}) => candidateId), ...member.defineSounds.map(({candidateId}) => candidateId)].sort();
    const actionScriptOperationIds = member.actionScriptOperations.map(({operationId}) => operationId).sort();
    return {
      obligationId: `${member.animationId}:${language}`,
      ordinal: member.ordinal,
      animationId: member.animationId,
      releaseRole: member.releaseRole,
      language,
      hostRouteCandidate: hostRouteCandidate(language),
      exactBasenameAssociationIds: exactCandidateIds,
      candidateOnlyPoolIds: candidateOnlyIds,
      embeddedUnknownLanguageCandidateIds: embeddedCandidateIds,
      actionScriptOperationIds,
      counts: {
        exactBasenameAssociations: exactCandidateIds.length,
        candidateOnlyReferences: candidateOnlyIds.length,
        embeddedSoundStreams: member.streams.length,
        embeddedTimedSoundStreams: member.streams.filter(({durationMs}) => Number(durationMs) > 0).length,
        embeddedZeroBlockOrUnknownDurationSoundStreams: member.streams.filter(({durationMs}) => !(Number(durationMs) > 0)).length,
        embeddedDefineSounds: member.defineSounds.length,
        actionScriptAudioOperations: member.actionScriptOperations.length,
      },
      unresolved: [...UNRESOLVED_REQUIREMENTS],
      preListeningRouteResolutionRequired: candidateOnlyIds.length > 0,
      authoritativeOriginalRuntimeTraversalComplete: false,
      namedHumanListeningComplete: false,
      accepted: false,
      status: "unresolved-listening-required",
    };
  }));

  const repeatedCandidateReferenceGroups = candidateFiles
    .filter(({referenceCount}) => referenceCount > 1)
    .map(({candidateId, source, ownerAnimationIds, referenceCount, routingLanguageCandidate}) => ({
      candidateId,
      source,
      ownerAnimationIds,
      referenceCount,
      routingLanguageCandidate,
      duplicateMeaning: "same physical candidate repeated across member candidate pools; not multiple unique files and not a proven cue for any member",
    }));
  const duplicateContentHashGroups = duplicateHashGroups(externalFiles);
  const inventoryRows = members.flatMap(({canonicalInventory}) => canonicalInventory.rows);
  const randomAudioYesMembers = members.filter(({xmlPage}) => xmlPage?.randomAudio === "yes").map(({animationId}) => animationId);

  const report = {
    schemaVersion: 1,
    artifactType: "lesson-language-audio-cue-obligation-matrix",
    releaseId,
    status: "machine-structural-obligations-current-listening-required",
    scope: "hash-bound-lesson-xml-host-language-routing-audio-inventory-embedded-audio-and-actionscript-operation-reconciliation",
    generator: {path: portable(path.relative(root, GENERATOR_PATH)), bytes: generatorBytes.length, sha256: sha256(generatorBytes)},
    sourceBindings: {
      lessonReleases: releaseInput.descriptor,
      lessonsCatalog: lessonInput.descriptor,
      sourceFilesCatalog: sourceFilesInput.descriptor,
      animationsCatalog: animationsInput.descriptor,
      audioGroupsCatalog: audioGroupsInput.descriptor,
      lessonXml: lessonXmlInput.descriptor,
      hostSwf: hostPhysical.descriptor,
      audioInventoryParser: parserInput.descriptor,
      audioAuditGenerator: auditorInput.descriptor,
    },
    lessonXmlLanguageEvidence: {
      grade: lesson.grade,
      lesson: lesson.lesson,
      title: lesson.titleDisplay,
      sectionCount: lesson.sectionCount,
      activePageReferenceCount: lesson.pageReferenceCount,
      bilingualSectionLabels: lesson.sections.map((section) => ({
        code: section.code,
        number: section.number,
        english: section.titleEnglish,
        spanish: section.titleSpanish,
        activePageReferenceCount: section.pageReferenceCount,
      })),
      randomAudioYesMemberIds: randomAudioYesMembers,
      explicitAudioCueTimingOrVoiceBindingsPresent: false,
      boundary: "The lesson XML binds bilingual labels, active page order, and the IR RandomAudio flag. It does not establish a spoken language, voice, exact audio file, cue time, runtime reachability, or listening result.",
    },
    hostLanguageRouting: {
      authority: hostAuthority,
      physicalHostSwf: hostPhysical.descriptor,
      routeCandidates: {
        en: {
          hostLanguageCode: "EN",
          finalQuizDirectory: "EA",
          ordinaryPageExternalDirectory: null,
          evidenceScope: "legacy-host-routing-only",
        },
        es: {
          hostLanguageCode: "SP",
          finalQuizDirectory: "SA",
          ordinaryPageExternalDirectory: "SA",
          ordinaryPageAssociation: "matching-loaded-page-basename-only",
          evidenceScope: "legacy-host-routing-only",
        },
      },
      spokenLanguageEstablished: false,
      audibleContentEstablished: false,
      runtimeRouteTraversalEstablished: false,
      boundary: "Directory and language-code routing are structural candidates. They do not establish what a file says, which voice is heard, whether the route executes, or when playback occurs.",
    },
    summary: {
      memberCount: members.length,
      memberLanguageObligationCount: obligationRows.length,
      languages: LANGUAGES,
      audioInventoryFileCount: members.length,
      audioInventoryExactMachineTriangulationCount: members.filter(({canonicalInventory}) => canonicalInventory.exactMachineTriangulation).length,
      canonicalInventoryMemberCount: members.filter(({canonicalInventory}) => canonicalInventory.rowCount > 0).length,
      emptyCanonicalAudioInventoryMemberCount: members.filter(({canonicalInventory}) => canonicalInventory.rowCount === 0).length,
      canonicalInventoryRowCount: inventoryRows.length,
      canonicalInventoryLanguageLabelCounts: countsBy(inventoryRows, ({language}) => language),
      exactBasenameReferenceCount: exactReferences.length,
      exactBasenameUniquePhysicalFileCount: exactFiles.length,
      candidateOnlyReferenceCount: candidateReferences.length,
      candidateOnlyUniquePhysicalFileCount: candidateFiles.length,
      candidateOnlyUniquePhysicalFileLanguageCounts: countsBy(candidateFiles, ({routingLanguageCandidate}) => routingLanguageCandidate),
      externalUniquePhysicalFileCount: externalFiles.length,
      externalUniqueContentHashCount: new Set(externalFiles.map(({source}) => source.sha256)).size,
      externalDuplicateContentHashGroupCount: duplicateContentHashGroups.length,
      repeatedCandidateReferenceGroupCount: repeatedCandidateReferenceGroups.length,
      embeddedSoundStreamStructureCount: embeddedStreams.length,
      embeddedTimedSoundStreamCount: embeddedStreams.filter(({durationMs}) => Number(durationMs) > 0).length,
      embeddedZeroBlockOrUnknownDurationSoundStreamCount: embeddedStreams.filter(({durationMs}) => !(Number(durationMs) > 0)).length,
      embeddedDefineSoundCount: defineSounds.length,
      embeddedTimedDefineSoundCount: defineSounds.filter(({durationMs}) => Number(durationMs) > 0).length,
      actionScriptAudioOperationCount: actionScriptOperations.length,
      actionScriptAudioOperationCounts: countsBy(actionScriptOperations, ({operation}) => operation),
      manifestAudioRequiredMemberCount: members.filter(({manifestObservation}) => manifestObservation.audioRequired === true).length,
      manifestAudioNotRequiredMemberCount: members.filter(({manifestObservation}) => manifestObservation.audioRequired === false).length,
      manifestAudioNotRequiredButTimedEmbeddedEvidenceMemberIds: members
        .filter((member) => member.manifestObservation.audioRequired === false
          && (member.streams.some(({durationMs}) => Number(durationMs) > 0)
            || member.defineSounds.some(({durationMs}) => Number(durationMs) > 0)))
        .map(({animationId}) => animationId),
      manifestCueAdoptionCount: members.reduce((sum, {manifestObservation}) => sum + manifestObservation.adoptedCueCount, 0),
      manifestFollowUpMemberCount: members.filter(({manifestFollowUp}) => manifestFollowUp.length > 0).length,
      structurallyUniqueAudioCandidateCount: externalFiles.length + embeddedStreams.length + defineSounds.length,
      acceptedCueCount: 0,
      spokenLanguageEstablishedCueCount: 0,
      authoritativeOriginalRuntimeListeningSessionCount: 0,
      namedHumanListeningCompleteMemberCount: 0,
      strictCompleteMemberCount: 0,
      publishedMemberCount: 0,
      memberInputSetSha256: fingerprint(members.map(({animationId, inputBindings, catalogAudioBinding}) => ({
        animationId,
        inputBindings,
        catalogAudioBinding,
      }))),
      externalPoolSha256: fingerprint(externalFiles.map(({candidateId, source, classification, ownerAnimationIds}) => ({candidateId, source, classification, ownerAnimationIds}))),
      embeddedCandidateSetSha256: fingerprint([...embeddedStreams, ...defineSounds].map(({candidateId, sourceSwf, status}) => ({candidateId, sourceSwf, status}))),
      obligationSetSha256: fingerprint(obligationRows),
    },
    externalPools: {
      exactBasenameAssociations: exactFiles,
      candidateOnly: candidateFiles,
      repeatedCandidateReferenceGroups,
      duplicateContentHashGroups,
      boundary: "Exact basename means a hash-bound file/member association only. Candidate-only files remain shared unresolved pools. Neither class establishes a runtime cue, spoken content, timing, or acceptance.",
    },
    embeddedStructuralCandidates: {
      soundStreams: embeddedStreams,
      defineSounds,
      boundary: "SoundStream and DefineSound entries are structural SWF evidence. Zero-block stream heads are not treated as audible cues; individual embedded audio content hashes and spoken languages are not invented.",
    },
    actionScriptAudioOperations: actionScriptOperations,
    members: members.map((member) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      source: member.source,
      xmlOccurrence: member.xmlOccurrence,
      xmlPage: member.xmlPage,
      inputBindings: member.inputBindings,
      catalogAudioBinding: member.catalogAudioBinding,
      manifestObservation: member.manifestObservation,
      canonicalInventory: {
        rowCount: member.canonicalInventory.rowCount,
        exactMachineTriangulation: member.canonicalInventory.exactMachineTriangulation,
      },
      structuralCounts: {
        exactBasenameAssociations: member.exactReferences.length,
        candidateOnlyReferences: member.candidateReferences.length,
        embeddedSoundStreams: member.streams.length,
        embeddedTimedSoundStreams: member.streams.filter(({durationMs}) => Number(durationMs) > 0).length,
        embeddedZeroBlockOrUnknownDurationSoundStreams: member.streams.filter(({durationMs}) => !(Number(durationMs) > 0)).length,
        embeddedDefineSounds: member.defineSounds.length,
        actionScriptAudioOperations: member.actionScriptOperations.length,
      },
      manifestFollowUp: member.manifestFollowUp,
      languageObligationIds: LANGUAGES.map((language) => `${member.animationId}:${language}`),
      namedHumanOriginalRuntimeListeningRequired: true,
      acceptanceEffect: "none",
    })),
    obligationRows,
    remainingHumanAndRuntimeWork: [
      "Resolve every candidate-only FQ file to an exact member/state cue or record a reviewed exclusion before listening adoption.",
      "Run authorized original-host/runtime natural traversal for both EN and ES states; structural directory routing and Ruffle playback are insufficient.",
      "Have a named human listen to every resolved reachable cue and record spoken content/language, voice where relevant, start/stop/pause/complete behavior, synchronization, and Replay reset.",
      "Preserve separate immutable audio listening, human visual, and owner decisions; this matrix cannot sign or close any of them.",
    ],
    authorityBoundary: {
      acceptanceNeutral: true,
      sourceFilesWritten: 0,
      workspaceFilesWritten: 0,
      canonicalAudioInventoriesWritten: 0,
      frameDomainOrBehaviorFilesRead: 0,
      frameDomainOrBehaviorFilesWritten: 0,
      migrationStatusOrReviewFilesWritten: 0,
      ledgersWritten: 0,
      audioPlayed: false,
      cueTimingInvented: false,
      voiceIdentityInvented: false,
      spokenLanguageInvented: false,
      runtimeReachabilityEstablished: false,
      listeningAccepted: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      publicationEstablished: false,
    },
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return validateLessonLanguageAudioCueObligationMatrix(report);
}

export function validateLessonLanguageAudioCueObligationMatrix(report) {
  invariant(report?.schemaVersion === 1 && report.artifactType === "lesson-language-audio-cue-obligation-matrix",
    "Unexpected lesson language/audio cue obligation schema");
  invariant(report.status === "machine-structural-obligations-current-listening-required", "Cue obligation report status differs");
  invariant(Array.isArray(report.members) && Array.isArray(report.obligationRows), "Cue obligation member/matrix arrays are missing");
  const summary = report.summary || {};
  invariant(sameCanonical(summary.languages, LANGUAGES), "Cue obligation summary language set differs");
  const requiredSourceBindings = new Map([
    ["lessonReleases", RELEASES_PATH],
    ["lessonsCatalog", LESSONS_PATH],
    ["sourceFilesCatalog", SOURCE_FILES_PATH],
    ["animationsCatalog", ANIMATIONS_PATH],
    ["audioGroupsCatalog", AUDIO_GROUPS_PATH],
    ["audioInventoryParser", AUDIO_PARSER_PATH],
    ["audioAuditGenerator", AUDIO_AUDITOR_PATH],
  ]);
  for (const [key, expectedPath] of requiredSourceBindings) {
    const descriptor = report.sourceBindings?.[key];
    invariant(descriptor?.path === expectedPath && Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0
      && SHA256_PATTERN.test(descriptor.sha256 || ""),
    `Cue obligation source binding ${key} is missing or invalid`);
  }
  for (const key of ["lessonXml", "hostSwf"]) {
    const descriptor = report.sourceBindings?.[key];
    invariant(typeof descriptor?.path === "string" && descriptor.path.startsWith(`${SOURCE_ROOT}/`)
      && Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0 && SHA256_PATTERN.test(descriptor.sha256 || ""),
    `Cue obligation source binding ${key} is missing or invalid`);
  }

  invariant(new Set(report.members.map(({animationId}) => animationId)).size === report.members.length,
    "Cue obligation member IDs are duplicated");
  invariant(report.members.every(({ordinal}, index) => ordinal === index + 1),
    "Cue obligation member ordinals are not contiguous");
  const membersById = new Map(report.members.map((member) => [member.animationId, member]));
  const activePageMembers = report.members.filter(({releaseRole}) => releaseRole === "active-xml-referenced-page");
  const shellMembers = report.members.filter(({releaseRole}) => releaseRole === "course-shell");
  invariant(activePageMembers.length + shellMembers.length === report.members.length,
    "Cue obligation member role partition is invalid");
  invariant(activePageMembers.length === report.lessonXmlLanguageEvidence?.activePageReferenceCount,
    "Cue obligation active-page member count differs from lesson XML evidence");
  const expectedOccurrences = Array.from({length: activePageMembers.length}, (_, index) => index + 1);
  invariant(sameCanonical(activePageMembers.map(({xmlOccurrence}) => xmlOccurrence).sort((left, right) => left - right), expectedOccurrences),
    "Cue obligation XML occurrences are not unique and exhaustive");
  invariant(shellMembers.length > 0 && shellMembers.every(({xmlOccurrence, xmlPage}) =>
    (xmlOccurrence === null || xmlOccurrence === undefined) && xmlPage === null),
  "Cue obligation shell/XML role binding is invalid");

  invariant(report.obligationRows.length === report.members.length * LANGUAGES.length,
    "Cue obligation matrix must contain exactly EN and ES rows for every member");
  invariant(new Set(report.obligationRows.map(({obligationId}) => obligationId)).size === report.obligationRows.length,
    "Cue obligation IDs are duplicated");
  const expectedObligationIds = report.members.flatMap(({animationId}) => LANGUAGES.map((language) => `${animationId}:${language}`)).sort();
  invariant(sameCanonical(report.obligationRows.map(({obligationId}) => obligationId).sort(), expectedObligationIds),
    "Cue obligation matrix does not cover every member/language exactly once");

  const exactFiles = report.externalPools?.exactBasenameAssociations || [];
  const candidateFiles = report.externalPools?.candidateOnly || [];
  const externalFiles = [...exactFiles, ...candidateFiles];
  invariant(new Set(externalFiles.map(({candidateId}) => candidateId)).size === externalFiles.length,
    "External candidate IDs are duplicated");
  invariant(new Set(externalFiles.map(({source}) => source.path)).size === externalFiles.length,
    "External candidate paths are duplicated across unique pools");
  for (const file of exactFiles) {
    invariant(file.classification === "exact-basename-association-only" && file.routingLanguageCandidate === "es",
      `${file.candidateId}: exact basename classification/routing differs`);
    invariant(file.referenceCount === 1 && file.ownerAnimationIds.length === 1
      && file.ownerReferences?.length === 1 && file.catalogGroupIds?.length === 0,
      `${file.candidateId}: exact basename association is not member-unique`);
  }
  for (const file of candidateFiles) {
    invariant(file.classification === "lesson-group-candidate-only" && LANGUAGES.includes(file.routingLanguageCandidate),
      `${file.candidateId}: candidate-only classification/routing differs`);
    invariant(file.referenceCount === file.ownerAnimationIds.length && file.referenceCount === file.ownerReferences?.length
      && file.referenceCount >= 1 && Array.isArray(file.catalogGroupIds) && file.catalogGroupIds.length >= 1
      && new Set(file.catalogGroupIds).size === file.catalogGroupIds.length,
      `${file.candidateId}: candidate-only reference count is stale`);
  }
  for (const file of externalFiles) {
    invariant(SHA256_PATTERN.test(file.source?.sha256 || "") && Number.isSafeInteger(file.source?.bytes) && file.source.bytes > 0,
      `${file.candidateId}: external physical descriptor is invalid`);
    invariant(file.spokenLanguage === null && file.spokenLanguageEstablished === false
      && file.cueTiming === null && file.voiceIdentity === null
      && file.runtimeReachabilityEstablished === false && file.listeningRequired === true,
    `${file.candidateId}: external candidate crossed an evidence boundary`);
    invariant(file.physicalVerification?.descriptor?.sha256 === file.source.sha256
      && file.physicalVerification.descriptor.bytes === file.source.bytes
      && file.physicalVerification.descriptor.path === file.source.path,
    `${file.candidateId}: external candidate physical verification differs`);
    invariant(file.candidateId === `external-${fingerprint(file.source)}`,
      `${file.candidateId}: external candidate identity is stale`);
    invariant(new Set(file.ownerAnimationIds).size === file.ownerAnimationIds.length,
      `${file.candidateId}: owner animation IDs are duplicated`);
    invariant(file.ownerReferences.every((reference, index) => {
      const member = membersById.get(reference.animationId);
      return member && reference.animationId === file.ownerAnimationIds[index]
        && reference.ordinal === file.ownerOrdinals[index] && reference.ordinal === member.ordinal
        && (file.classification === "lesson-group-candidate-only"
          ? file.catalogGroupIds.includes(reference.groupId)
          : reference.groupId === null);
    }), `${file.candidateId}: owner references differ from release members`);
  }
  const streams = report.embeddedStructuralCandidates?.soundStreams || [];
  const definitions = report.embeddedStructuralCandidates?.defineSounds || [];
  invariant(new Set([...streams, ...definitions].map(({candidateId}) => candidateId)).size === streams.length + definitions.length,
    "Embedded structural candidate IDs are duplicated");
  for (const item of [...streams, ...definitions]) {
    invariant(item.languageCandidate === "und" && item.spokenLanguage === null && item.rootRuntimeCueTime === null,
      `${item.candidateId}: embedded language/timing was invented`);
    const member = membersById.get(item.animationId);
    invariant(member && sameCanonical(item.sourceSwf, member.source),
      `${item.candidateId}: embedded source/member binding differs`);
    if (item.origin === "embedded-sound-stream") {
      invariant(item.candidateId === `${item.animationId}:embedded-stream-${String(item.streamIndex).padStart(4, "0")}`,
        `${item.candidateId}: embedded SoundStream identity differs`);
      const timed = Number(item.durationMs) > 0;
      invariant(item.inventoryRepresented === timed
        && item.inventoryCueId === (timed ? `embedded-stream-${String(item.streamIndex).padStart(4, "0")}` : null),
      `${item.candidateId}: embedded SoundStream inventory disposition differs`);
    } else {
      invariant(item.origin === "embedded-define-sound"
        && item.candidateId === `${item.animationId}:embedded-define-sound-${String(item.characterId).padStart(4, "0")}`,
      `${item.candidateId}: embedded DefineSound identity differs`);
      const timed = Number(item.durationMs) > 0;
      invariant(item.inventoryRepresented === timed
        && item.inventoryCueId === (timed ? `embedded-define-sound-${String(item.characterId).padStart(4, "0")}` : null),
      `${item.candidateId}: embedded DefineSound inventory disposition differs`);
    }
  }
  const operations = report.actionScriptAudioOperations || [];
  invariant(new Set(operations.map(({operationId}) => operationId)).size === operations.length,
    "ActionScript audio operation IDs are duplicated");
  for (const operation of operations) {
    invariant(operation.resolvedCueCandidateId === null && operation.runtimeInvocationEstablished === false
      && operation.routingLanguageCandidate === "und"
      && operation.status === "source-operation-natural-host-traversal-required",
    `${operation.operationId}: ActionScript operation was over-resolved`);
    invariant(membersById.has(operation.animationId)
      && operation.operationId.startsWith(`${operation.animationId}:actionscript-audio-operation-`),
    `${operation.operationId}: ActionScript operation/member identity differs`);
  }

  for (const member of report.members) {
    invariant(typeof member.animationId === "string" && typeof member.assetId === "string"
      && SHA256_PATTERN.test(member.source?.sha256 || "") && Number.isSafeInteger(member.source?.bytes) && member.source.bytes > 0,
    `${member.animationId || "member"}: member identity/source descriptor is invalid`);
    const catalogBinding = member.catalogAudioBinding || {};
    const catalogSourcePath = catalogPathFromSourceFile(member.source.path, `${member.animationId} member source`);
    invariant(catalogBinding.currentCatalogReconciled === true
      && catalogBinding.evidenceScope === "current-catalog-membership-and-byte-identity-only"
      && catalogBinding.animationIdentitySha256 === fingerprint({
        animationId: member.animationId,
        assetId: member.assetId,
        source: {path: catalogSourcePath, bytes: member.source.bytes, sha256: member.source.sha256},
      }),
    `${member.animationId}: current animations catalog binding is invalid`);

    const memberExactFiles = exactFiles.filter(({ownerAnimationIds}) => ownerAnimationIds.includes(member.animationId));
    const memberCandidateFiles = candidateFiles.filter(({ownerAnimationIds}) => ownerAnimationIds.includes(member.animationId));
    const memberStreams = streams.filter(({animationId}) => animationId === member.animationId);
    const memberDefinitions = definitions.filter(({animationId}) => animationId === member.animationId);
    const memberOperations = operations.filter(({animationId}) => animationId === member.animationId);
    const currentCatalogExact = memberExactFiles.map(({source}) => ({
      sourceFile: source.path,
      sha256: source.sha256,
      bytes: source.bytes,
      association: "matching-basename",
    })).sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
    const currentCatalogCandidates = memberCandidateFiles.flatMap((file) =>
      file.ownerReferences
        .filter(({animationId}) => animationId === member.animationId)
        .map(({groupId}) => ({
          sourceFile: file.source.path,
          sha256: file.source.sha256,
          bytes: file.source.bytes,
          groupId,
          routingLanguageCandidate: file.routingLanguageCandidate,
        })))
      .sort((left, right) => left.sourceFile.localeCompare(right.sourceFile) || left.groupId.localeCompare(right.groupId));
    invariant(catalogBinding.exactAssociationCount === currentCatalogExact.length
      && catalogBinding.exactAssociationSetSha256 === fingerprint(currentCatalogExact)
      && catalogBinding.candidateOnlyFileCount === currentCatalogCandidates.length
      && catalogBinding.candidateOnlySetSha256 === fingerprint(currentCatalogCandidates)
      && sameCanonical(catalogBinding.groupIds, [...new Set(currentCatalogCandidates.map(({groupId}) => groupId))].sort()),
    `${member.animationId}: current audio catalog set binding is stale`);

    const expectedStructuralCounts = {
      exactBasenameAssociations: memberExactFiles.length,
      candidateOnlyReferences: currentCatalogCandidates.length,
      embeddedSoundStreams: memberStreams.length,
      embeddedTimedSoundStreams: memberStreams.filter(({durationMs}) => Number(durationMs) > 0).length,
      embeddedZeroBlockOrUnknownDurationSoundStreams: memberStreams.filter(({durationMs}) => !(Number(durationMs) > 0)).length,
      embeddedDefineSounds: memberDefinitions.length,
      actionScriptAudioOperations: memberOperations.length,
    };
    invariant(sameCanonical(member.structuralCounts, expectedStructuralCounts),
      `${member.animationId}: member structural counts are stale`);
    invariant(sameCanonical(member.languageObligationIds, LANGUAGES.map((language) => `${member.animationId}:${language}`)),
      `${member.animationId}: member obligation references are stale`);
    invariant(member.namedHumanOriginalRuntimeListeningRequired === true && member.acceptanceEffect === "none",
      `${member.animationId}: member crossed the pending listening boundary`);
    invariant(member.canonicalInventory?.exactMachineTriangulation === true
      && Number.isSafeInteger(member.canonicalInventory.rowCount) && member.canonicalInventory.rowCount >= 0,
    `${member.animationId}: member canonical inventory binding is invalid`);
    invariant(member.manifestObservation?.exactCatalogAssociationCount === memberExactFiles.length
      && sameCanonical([...(member.manifestObservation.candidateGroupIds || [])].sort(), catalogBinding.groupIds)
      && member.manifestObservation.adoptedCueCount === 0
      && member.manifestObservation.acceptanceEffect === "none-observation-only",
    `${member.animationId}: manifest audio observation is stale or over-accepted`);
  }

  for (const member of report.members) {
    const memberOperations = operations.filter(({animationId}) => animationId === member.animationId);
    invariant(sameCanonical(memberOperations.map(({operationId}) => operationId),
      memberOperations.map((_, index) => `${member.animationId}:actionscript-audio-operation-${String(index + 1).padStart(3, "0")}`)),
    `${member.animationId}: ActionScript operation sequence is stale`);
  }

  for (const row of report.obligationRows) {
    const member = membersById.get(row.animationId);
    invariant(member && LANGUAGES.includes(row.language) && row.obligationId === `${row.animationId}:${row.language}`
      && row.ordinal === member.ordinal && row.releaseRole === member.releaseRole,
    `${row.obligationId || "obligation"}: invalid member/language identity`);
    invariant(row.status === "unresolved-listening-required"
      && row.authoritativeOriginalRuntimeTraversalComplete === false
      && row.namedHumanListeningComplete === false && row.accepted === false,
    `${row.obligationId}: obligation crossed the pending human/runtime boundary`);
    invariant(sameCanonical(row.unresolved, UNRESOLVED_REQUIREMENTS)
      && sameCanonical(row.hostRouteCandidate, hostRouteCandidate(row.language)),
    `${row.obligationId}: unresolved/host-route contract differs`);

    const expectedExactIds = exactFiles
      .filter((file) => file.routingLanguageCandidate === row.language && file.ownerAnimationIds.includes(row.animationId))
      .map(({candidateId}) => candidateId).sort();
    const expectedCandidateIds = candidateFiles
      .filter((file) => file.routingLanguageCandidate === row.language && file.ownerAnimationIds.includes(row.animationId))
      .map(({candidateId}) => candidateId).sort();
    const expectedEmbeddedIds = [...streams, ...definitions]
      .filter(({animationId}) => animationId === row.animationId).map(({candidateId}) => candidateId).sort();
    const expectedOperationIds = operations
      .filter(({animationId}) => animationId === row.animationId).map(({operationId}) => operationId).sort();
    invariant(sameCanonical(row.exactBasenameAssociationIds, expectedExactIds)
      && sameCanonical(row.candidateOnlyPoolIds, expectedCandidateIds)
      && sameCanonical(row.embeddedUnknownLanguageCandidateIds, expectedEmbeddedIds)
      && sameCanonical(row.actionScriptOperationIds, expectedOperationIds),
    `${row.obligationId}: obligation candidate references are stale or dangling`);
    const memberStreams = streams.filter(({animationId}) => animationId === row.animationId);
    const memberDefinitions = definitions.filter(({animationId}) => animationId === row.animationId);
    const expectedCounts = {
      exactBasenameAssociations: expectedExactIds.length,
      candidateOnlyReferences: expectedCandidateIds.length,
      embeddedSoundStreams: memberStreams.length,
      embeddedTimedSoundStreams: memberStreams.filter(({durationMs}) => Number(durationMs) > 0).length,
      embeddedZeroBlockOrUnknownDurationSoundStreams: memberStreams.filter(({durationMs}) => !(Number(durationMs) > 0)).length,
      embeddedDefineSounds: memberDefinitions.length,
      actionScriptAudioOperations: expectedOperationIds.length,
    };
    invariant(sameCanonical(row.counts, expectedCounts)
      && row.preListeningRouteResolutionRequired === (expectedCandidateIds.length > 0),
    `${row.obligationId}: obligation counts/route-resolution flag are stale`);
  }

  const exactReferenceCount = exactFiles.reduce((sum, {referenceCount}) => sum + referenceCount, 0);
  const candidateReferenceCount = candidateFiles.reduce((sum, {referenceCount}) => sum + referenceCount, 0);
  const timedStreams = streams.filter(({durationMs}) => Number(durationMs) > 0);
  const untimedStreams = streams.filter(({durationMs}) => !(Number(durationMs) > 0));
  const timedDefinitions = definitions.filter(({durationMs}) => Number(durationMs) > 0);
  const repeatedCandidateReferenceGroups = candidateFiles
    .filter(({referenceCount}) => referenceCount > 1)
    .map(({candidateId, source, ownerAnimationIds, referenceCount, routingLanguageCandidate}) => ({
      candidateId,
      source,
      ownerAnimationIds,
      referenceCount,
      routingLanguageCandidate,
      duplicateMeaning: "same physical candidate repeated across member candidate pools; not multiple unique files and not a proven cue for any member",
    }));
  const duplicateContentHashGroups = duplicateHashGroups(externalFiles);
  invariant(sameCanonical(report.externalPools.repeatedCandidateReferenceGroups, repeatedCandidateReferenceGroups)
    && sameCanonical(report.externalPools.duplicateContentHashGroups, duplicateContentHashGroups),
  "External repeated-reference or duplicate-hash groups are stale");

  const canonicalInventoryLanguageLabelCounts = {};
  if (exactReferenceCount > 0) canonicalInventoryLanguageLabelCounts.es = exactReferenceCount;
  if (timedStreams.length + timedDefinitions.length > 0) {
    canonicalInventoryLanguageLabelCounts.und = timedStreams.length + timedDefinitions.length;
  }
  const expectedScalarSummary = {
    memberCount: report.members.length,
    memberLanguageObligationCount: report.obligationRows.length,
    audioInventoryFileCount: report.members.length,
    audioInventoryExactMachineTriangulationCount: report.members.filter(({canonicalInventory}) => canonicalInventory.exactMachineTriangulation).length,
    canonicalInventoryMemberCount: report.members.filter(({canonicalInventory}) => canonicalInventory.rowCount > 0).length,
    emptyCanonicalAudioInventoryMemberCount: report.members.filter(({canonicalInventory}) => canonicalInventory.rowCount === 0).length,
    canonicalInventoryRowCount: report.members.reduce((sum, {canonicalInventory}) => sum + canonicalInventory.rowCount, 0),
    exactBasenameReferenceCount: exactReferenceCount,
    exactBasenameUniquePhysicalFileCount: exactFiles.length,
    candidateOnlyReferenceCount: candidateReferenceCount,
    candidateOnlyUniquePhysicalFileCount: candidateFiles.length,
    externalUniquePhysicalFileCount: externalFiles.length,
    externalUniqueContentHashCount: new Set(externalFiles.map(({source}) => source.sha256)).size,
    externalDuplicateContentHashGroupCount: duplicateContentHashGroups.length,
    repeatedCandidateReferenceGroupCount: repeatedCandidateReferenceGroups.length,
    embeddedSoundStreamStructureCount: streams.length,
    embeddedTimedSoundStreamCount: timedStreams.length,
    embeddedZeroBlockOrUnknownDurationSoundStreamCount: untimedStreams.length,
    embeddedDefineSoundCount: definitions.length,
    embeddedTimedDefineSoundCount: timedDefinitions.length,
    actionScriptAudioOperationCount: operations.length,
    manifestAudioRequiredMemberCount: report.members.filter(({manifestObservation}) => manifestObservation.audioRequired === true).length,
    manifestAudioNotRequiredMemberCount: report.members.filter(({manifestObservation}) => manifestObservation.audioRequired === false).length,
    manifestCueAdoptionCount: report.members.reduce((sum, {manifestObservation}) => sum + manifestObservation.adoptedCueCount, 0),
    manifestFollowUpMemberCount: report.members.filter(({manifestFollowUp}) => manifestFollowUp.length > 0).length,
    structurallyUniqueAudioCandidateCount: externalFiles.length + streams.length + definitions.length,
  };
  for (const [field, expected] of Object.entries(expectedScalarSummary)) {
    invariant(summary[field] === expected, `${field} summary is stale`);
  }
  invariant(expectedScalarSummary.canonicalInventoryRowCount === exactReferenceCount + timedStreams.length + timedDefinitions.length,
    "Canonical inventory partition is stale");
  invariant(sameCanonical(summary.canonicalInventoryLanguageLabelCounts, canonicalInventoryLanguageLabelCounts)
    && sameCanonical(summary.candidateOnlyUniquePhysicalFileLanguageCounts,
      countsBy(candidateFiles, ({routingLanguageCandidate}) => routingLanguageCandidate))
    && sameCanonical(summary.actionScriptAudioOperationCounts, countsBy(operations, ({operation}) => operation)),
  "Cue obligation categorical summary is stale");
  invariant(sameCanonical(summary.manifestAudioNotRequiredButTimedEmbeddedEvidenceMemberIds,
    report.members.filter(({animationId, manifestObservation}) => manifestObservation.audioRequired === false
      && (streams.some((item) => item.animationId === animationId && Number(item.durationMs) > 0)
        || definitions.some((item) => item.animationId === animationId && Number(item.durationMs) > 0)))
      .map(({animationId}) => animationId)),
  "Manifest no-audio/timed-embedded exception set is stale");
  invariant(summary.manifestCueAdoptionCount === 0,
    "Cue obligation report cannot consume already-adopted manifest cues without a reviewed successor protocol");
  invariant(summary.memberInputSetSha256 === fingerprint(report.members.map(({animationId, inputBindings, catalogAudioBinding}) => ({
    animationId,
    inputBindings,
    catalogAudioBinding,
  }))), "Member input-set fingerprint is stale");
  invariant(summary.externalPoolSha256 === fingerprint(externalFiles.map(({candidateId, source, classification, ownerAnimationIds}) => ({
    candidateId,
    source,
    classification,
    ownerAnimationIds,
  }))), "External pool fingerprint is stale");
  invariant(summary.embeddedCandidateSetSha256 === fingerprint([...streams, ...definitions].map(({candidateId, sourceSwf, status}) => ({
    candidateId,
    sourceSwf,
    status,
  }))), "Embedded candidate-set fingerprint is stale");
  invariant(summary.obligationSetSha256 === fingerprint(report.obligationRows), "Obligation-set fingerprint is stale");
  for (const field of [
    "acceptedCueCount",
    "spokenLanguageEstablishedCueCount",
    "authoritativeOriginalRuntimeListeningSessionCount",
    "namedHumanListeningCompleteMemberCount",
    "strictCompleteMemberCount",
    "publishedMemberCount",
  ]) invariant(summary[field] === 0, `${field} must remain zero`);
  const boundary = report.authorityBoundary || {};
  invariant(boundary.acceptanceNeutral === true && boundary.sourceFilesWritten === 0
    && boundary.workspaceFilesWritten === 0 && boundary.canonicalAudioInventoriesWritten === 0
    && boundary.frameDomainOrBehaviorFilesRead === 0 && boundary.frameDomainOrBehaviorFilesWritten === 0
    && boundary.migrationStatusOrReviewFilesWritten === 0 && boundary.ledgersWritten === 0,
  "Cue obligation authority boundary write/read counts differ");
  for (const [key, value] of Object.entries(boundary)) {
    if (["acceptanceNeutral", "sourceFilesWritten", "workspaceFilesWritten", "canonicalAudioInventoriesWritten",
      "frameDomainOrBehaviorFilesRead", "frameDomainOrBehaviorFilesWritten", "migrationStatusOrReviewFilesWritten", "ledgersWritten"].includes(key)) continue;
    invariant(value === false, `Cue obligation authority boundary ${key} must remain false`);
  }
  const {reportFingerprintSha256, ...fingerprintedReport} = report;
  invariant(reportFingerprintSha256 === fingerprint(fingerprintedReport), "Cue obligation report fingerprint is stale");
  return report;
}

export function parseLessonLanguageAudioCueObligationArguments(argv) {
  const options = {check: false, releaseId: null, output: null, help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--release-id") options.releaseId = argv[++index] || invariant(false, "--release-id requires a value");
    else if (argument === "--output") options.output = argv[++index] || invariant(false, "--output requires a value");
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (options.releaseId) options.output ||= `reports/${options.releaseId}-language-audio-cue-obligation-matrix.json`;
  return options;
}

async function main() {
  const options = parseLessonLanguageAudioCueObligationArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("node scripts/build-lesson-language-audio-cue-obligation-matrix.mjs --release-id <id> [--output <reports/file.json>] [--check]\n");
    return;
  }
  invariant(options.releaseId, "--release-id is required");
  const output = path.resolve(PROJECT_ROOT, options.output);
  await assertSafeReportOutput(output, {root: PROJECT_ROOT, extension: ".json"});
  const report = await buildLessonLanguageAudioCueObligationMatrix(options);
  await writeOrCheckReport(output, stableJson(report), {root: PROJECT_ROOT, extension: ".json", check: options.check});
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${report.summary.memberLanguageObligationCount} EN/ES obligations across ${report.summary.memberCount} members; ${report.summary.externalUniquePhysicalFileCount} unique external files; ${report.summary.embeddedSoundStreamStructureCount} SoundStream structures; listening required\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
