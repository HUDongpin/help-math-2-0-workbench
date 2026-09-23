#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, realpath, stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {parseAudioInventory} from "./audio-listening-acceptance.mjs";
import {
  assertSafeReportOutput,
  writeOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const RELEASES_PATH = "catalog/lesson-releases.json";
const AUDIO_GROUPS_PATH = "catalog/audio-groups.json";
const SOURCE_FILES_PATH = "catalog/source-files.json";
const AUDIO_INVENTORY_PARSER_PATH = "scripts/audio-listening-acceptance.mjs";
const SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

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

function fingerprint(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value))));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sameCanonical(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function projectRelative(root, candidate, {prefix, extension, label}) {
  const absolute = path.isAbsolute(candidate) ? path.resolve(candidate) : path.resolve(root, candidate);
  const relative = portable(path.relative(root, absolute));
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${label} escapes the project root`);
  invariant(!relative.includes("\\") && portable(path.normalize(relative)) === relative, `${label} is not a normalized project-relative path`);
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
  const result = await readRegularProjectFile(root, relativePath, label);
  try {
    return {...result, value: JSON.parse(result.bytes.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

async function optionalDescriptor(root, relativePath, label) {
  try {
    return (await readRegularProjectFile(root, relativePath, label)).descriptor;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function catalogDescriptor(item, label) {
  invariant(typeof item?.path === "string" && item.path.length > 0, `${label} path is missing`);
  invariant(Number.isSafeInteger(item.bytes) && item.bytes > 0, `${label} bytes are invalid`);
  invariant(SHA256_PATTERN.test(item.sha256 || ""), `${label} SHA-256 is invalid`);
  return {path: item.path, bytes: item.bytes, sha256: item.sha256};
}

function exactReleaseMember(release, scopeMember) {
  invariant(/^[a-z0-9][a-z0-9-]+$/.test(scopeMember.animationId || ""), "Source-scope animationId is not a safe canonical ID");
  const matches = release.members.filter((member) => member.animationId === scopeMember.animationId);
  invariant(matches.length === 1, `${scopeMember.animationId}: release membership is missing or duplicated`);
  const member = matches[0];
  invariant(member.ordinal === scopeMember.ordinal, `${scopeMember.animationId}: release/scope ordinal differs`);
  invariant(member.assetId === scopeMember.assetId, `${scopeMember.animationId}: release/scope assetId differs`);
  invariant(member.shardId === scopeMember.shardId, `${scopeMember.animationId}: release/scope shard differs`);
  invariant(member.source?.path === scopeMember.source?.swf?.path, `${scopeMember.animationId}: release/scope source path differs`);
  invariant(member.source?.sha256 === scopeMember.source?.swf?.sha256, `${scopeMember.animationId}: release/scope source hash differs`);
  return member;
}

function normalizedManifestExactAssociations(manifest) {
  return (manifest.audio?.catalogExactAssociations || []).map((item) => ({
    path: item.sourceFile?.startsWith(`${SOURCE_ROOT}/`) ? item.sourceFile.slice(SOURCE_ROOT.length + 1) : item.sourceFile,
    bytes: item.bytes,
    sha256: item.sha256,
  })).sort((left, right) => left.path.localeCompare(right.path));
}

function normalizedScopeExactAssociations(member) {
  return (member.audioCatalog?.exact || []).map((item) => ({
    path: item.path,
    bytes: item.bytes,
    sha256: item.sha256,
  })).sort((left, right) => left.path.localeCompare(right.path));
}

function candidateId(item) {
  return `audio-${item.sha256}`;
}

function ownershipClass(member) {
  const exactCount = member.audioCatalog?.exact?.length || 0;
  const groupCount = member.audioCatalog?.groupIds?.length || 0;
  invariant(!(exactCount && groupCount), `${member.animationId}: exact and grouped audio candidate ownership are both populated`);
  if (exactCount) return "exact-page-catalog-candidate";
  if (groupCount) return "shared-final-quiz-group-candidate";
  return "no-catalog-candidate-negative-proof-pending";
}

function memberBlockers(classification, dedicatedMachineAudioAuditPresent) {
  const blockers = [
    dedicatedMachineAudioAuditPresent ? "dedicated-machine-audio-audit-present-but-not-accepted" : "dedicated-machine-audio-audit-missing",
    "runtime-cue-map-unresolved",
    "cue-start-stop-synchronization-and-replay-unresolved",
    "spoken-language-unverified-by-named-human",
    "authorized-original-runtime-listening-acceptance-missing",
  ];
  if (classification === "exact-page-catalog-candidate") {
    blockers.push("matching-basename-catalog-association-is-not-runtime-cue-proof");
  } else if (classification === "shared-final-quiz-group-candidate") {
    blockers.push("shared-fq-question-answer-seed-and-member-ownership-unresolved");
  } else {
    blockers.push("source-bound-negative-audio-proof-missing");
  }
  return blockers;
}

function nextEvidencePlan(classification) {
  const common = [
    "derive every reachable cue from FLA/SWF scripts, nested frame domains, and the reviewed lesson-host contract",
    "bind cue identity to natural trace, frame domain, entry state, scenario, language candidate, seed, start/stop semantics, synchronization, and Replay behavior",
    "prepare named-human authorized-original-runtime listening only after the machine cue map is current",
  ];
  if (classification === "exact-page-catalog-candidate") {
    return [
      "prove or reject the matching-basename page association through source and natural-runtime evidence",
      ...common,
    ];
  }
  if (classification === "shared-final-quiz-group-candidate") {
    return [
      "resolve each shared FQ file to the exact question/answer/review/score state and responsible FQ member without assuming filename semantics",
      ...common,
    ];
  }
  return [
    "perform a source-bound embedded/external audio negative audit; catalog silence alone cannot establish audio-not-required",
    ...common,
  ];
}

async function inspectWorkspace({root, scopeMember, releaseMember, candidateByCatalogPath, groupFileById}) {
  const expectedWorkspace = `migrations/${scopeMember.animationId}`;
  invariant(scopeMember.workspacePath === expectedWorkspace, `${scopeMember.animationId}: unexpected workspace path`);
  const manifestPath = `${expectedWorkspace}/migration.json`;
  const inventoryPath = `${expectedWorkspace}/audio-inventory.csv`;
  const auditPath = `${expectedWorkspace}/audit/machine/report.json`;
  const dedicatedAuditPath = `${expectedWorkspace}/audit/audio-runtime-evidence.json`;
  const [manifestInput, inventoryInput, auditInput, dedicatedMachineAudioAudit] = await Promise.all([
    readJsonProjectFile(root, manifestPath, `${scopeMember.animationId} migration manifest`),
    readRegularProjectFile(root, inventoryPath, `${scopeMember.animationId} canonical audio inventory`),
    readJsonProjectFile(root, auditPath, `${scopeMember.animationId} machine SWF audit`),
    optionalDescriptor(root, dedicatedAuditPath, `${scopeMember.animationId} dedicated machine audio audit`),
  ]);
  const manifest = manifestInput.value;
  const audit = auditInput.value;
  invariant((manifest.animationId || manifest.id) === scopeMember.animationId, `${scopeMember.animationId}: manifest identity differs`);
  invariant(manifest.assetId === scopeMember.assetId, `${scopeMember.animationId}: manifest assetId differs`);
  invariant(manifest.source?.swfSha256 === scopeMember.source.swf.sha256, `${scopeMember.animationId}: manifest SWF hash differs`);
  invariant(audit.animationId === scopeMember.animationId, `${scopeMember.animationId}: machine audit identity differs`);
  invariant(audit.source?.expectedSha256 === scopeMember.source.swf.sha256, `${scopeMember.animationId}: machine audit expected SWF hash differs`);
  invariant(audit.source?.observedSha256Before === scopeMember.source.swf.sha256
    && audit.source?.observedSha256After === scopeMember.source.swf.sha256
    && audit.source?.hashMatches === true, `${scopeMember.animationId}: machine audit source binding is not current`);
  invariant(audit.migrationStatusUnchanged === true, `${scopeMember.animationId}: machine audit changed migration status`);

  const scopeExact = normalizedScopeExactAssociations(scopeMember);
  const manifestExact = normalizedManifestExactAssociations(manifest);
  invariant(sameCanonical(scopeExact, manifestExact), `${scopeMember.animationId}: manifest exact-audio catalog associations differ from the frozen scope`);
  const scopeGroups = [...(scopeMember.audioCatalog?.groupIds || [])].sort();
  const manifestGroups = [...(manifest.audio?.catalogGroupCandidates || [])].sort();
  invariant(sameCanonical(scopeGroups, manifestGroups), `${scopeMember.animationId}: manifest audio groups differ from the frozen scope`);

  const parsedInventory = parseAudioInventory(inventoryInput.bytes.toString("utf8"));
  invariant(parsedInventory.headers.includes("source_file") && parsedInventory.headers.includes("sha256"), `${scopeMember.animationId}: canonical audio inventory headers are invalid`);
  const inventoryCatalogCandidateIds = [];
  const inventoryRows = parsedInventory.rows.map((row) => {
    const catalogPath = row.source_file?.startsWith(`${SOURCE_ROOT}/`)
      ? row.source_file.slice(SOURCE_ROOT.length + 1)
      : null;
    const candidate = catalogPath ? candidateByCatalogPath.get(catalogPath) : null;
    if (candidate) {
      invariant(row.sha256 === candidate.sha256, `${scopeMember.animationId}: inventory hash differs for ${catalogPath}`);
      inventoryCatalogCandidateIds.push(candidateId(candidate));
    }
    return {
      cueId: row.cue_id || null,
      languageLabel: row.language || null,
      sourceFile: row.source_file || null,
      sha256: row.sha256 || null,
      candidateId: candidate ? candidateId(candidate) : null,
      cueMappingComplete: Boolean(row.start_frame && row.start_frame_domain_id && row.start_semantics && row.duration_ms),
    };
  });
  for (const exact of scopeExact) {
    const matchingRows = inventoryRows.filter((row) => row.candidateId === candidateId(exact));
    invariant(matchingRows.length === 1, `${scopeMember.animationId}: exact page candidate ${exact.path} is not represented exactly once in the canonical inventory`);
  }

  const classification = ownershipClass(scopeMember);
  let candidateIds;
  if (classification === "exact-page-catalog-candidate") {
    candidateIds = scopeMember.audioCatalog.exact.map(candidateId).sort();
  } else if (classification === "shared-final-quiz-group-candidate") {
    candidateIds = scopeGroups.flatMap((groupId) => {
      const files = groupFileById.get(groupId);
      invariant(files, `${scopeMember.animationId}: audio group ${groupId} is missing`);
      return files.map(candidateId);
    }).sort();
  } else candidateIds = [];

  const record = {
    ordinal: scopeMember.ordinal,
    animationId: scopeMember.animationId,
    assetId: scopeMember.assetId,
    releaseRole: releaseMember.releaseRole,
    shardId: scopeMember.shardId,
    source: {
      path: scopeMember.source.swf.path,
      sha256: scopeMember.source.swf.sha256,
      sourceModel: scopeMember.source.sourceModel,
    },
    workspace: {
      path: expectedWorkspace,
      manifest: manifestInput.descriptor,
      canonicalAudioInventory: inventoryInput.descriptor,
      machineSwfAudit: auditInput.descriptor,
      dedicatedMachineAudioAudit,
    },
    candidateOwnership: {
      classification,
      exactCandidateCount: scopeExact.length,
      groupIds: scopeGroups,
      candidateIds,
      candidateCount: candidateIds.length,
      catalogAssociationOnly: true,
      runtimeCueOwnershipEstablished: false,
    },
    canonicalInventoryObservation: {
      rowCount: inventoryRows.length,
      catalogCandidateRowCount: inventoryRows.filter(({candidateId: id}) => id).length,
      inventoryCatalogCandidateIds: [...new Set(inventoryCatalogCandidateIds)].sort(),
      rows: inventoryRows,
      acceptanceEffect: "none-read-only-observation-of-current-canonical-file",
    },
    machineReadiness: {
      machineSwfSourceHashCurrent: true,
      dedicatedMachineAudioAuditPresent: dedicatedMachineAudioAudit !== null,
      machineCueMapComplete: false,
      runtimeSynchronizationEstablished: false,
      spokenLanguageEstablished: false,
      listeningSessionPresent: false,
      listeningAccepted: false,
      blockers: memberBlockers(classification, dedicatedMachineAudioAudit !== null),
      nextEvidence: nextEvidencePlan(classification),
    },
    acceptance: {
      audioAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  record.planFingerprintSha256 = fingerprint(record);
  return record;
}

async function verifyPhysicalAudio(root, item) {
  invariant(typeof item.path === "string" && !path.isAbsolute(item.path) && !item.path.includes("\\")
    && portable(path.normalize(item.path)) === item.path && item.path !== ".." && !item.path.startsWith("../"),
  `${item.path || "Audio candidate"}: catalog path is not safe and normalized`);
  const relativePath = `${SOURCE_ROOT}/${item.path}`;
  invariant(path.extname(item.path).toLowerCase() === ".mp3", `${item.path}: audio candidate is not MP3`);
  const input = await readRegularProjectFile(root, relativePath, `audio candidate ${item.path}`);
  invariant(input.descriptor.bytes === item.bytes && input.descriptor.sha256 === item.sha256,
    `${item.path}: physical audio candidate differs from the catalog-bound descriptor`);
  return input.descriptor;
}

async function mapLimited(items, limit, mapper) {
  const output = [];
  for (let index = 0; index < items.length; index += limit) {
    output.push(...await Promise.all(items.slice(index, index + limit).map(mapper)));
  }
  return output;
}

function describeCandidate({item, physical, exactOwners, groupOwners, groupEntries, unmapped}) {
  const exact = exactOwners.get(item.path) || [];
  const groups = groupEntries.get(item.path) || [];
  const groupedOwners = [...new Set(groups.flatMap(({groupId}) => groupOwners.get(groupId) || []))].sort();
  invariant([exact.length > 0, groups.length > 0, unmapped.has(item.path)].filter(Boolean).length === 1,
    `${item.path}: candidate ownership classes are not mutually exclusive`);
  const classification = exact.length
    ? "exact-page-catalog-candidate"
    : groups.length
      ? "shared-final-quiz-group-candidate"
      : "unmapped-candidate-pending-disposition";
  const ownerAnimationIds = exact.length ? [...exact].sort() : groupedOwners;
  const groupIds = [...new Set(groups.map(({groupId}) => groupId))].sort();
  const catalogLanguageCandidate = groups.length
    ? [...new Set(groups.map(({catalogLanguage}) => catalogLanguage))].sort().join("+")
    : "unresolved";
  const record = {
    candidateId: candidateId(item),
    source: physical,
    catalogRelativePath: item.path,
    classification,
    candidateGrouping: {
      groupIds,
      ownerAnimationIds,
      ownershipStatus: classification === "exact-page-catalog-candidate"
        ? "matching-basename-page-association-only-runtime-cue-unresolved"
        : classification === "shared-final-quiz-group-candidate"
          ? "shared-fq-pool-question-answer-seed-and-member-owner-unresolved"
          : "no-member-owner-assigned-assignment-or-reviewed-exclusion-pending",
    },
    languageEvidence: {
      catalogLanguageCandidate,
      catalogLanguageCandidateBasis: groups.length
        ? "catalog-audio-group-metadata-and-directory-convention-only"
        : "no-reviewed-catalog-language-label",
      spokenLanguage: "unresolved-not-listened",
      spokenLanguageEstablished: false,
      languageAccepted: false,
    },
    cueEvidence: {
      runtimeCueId: null,
      frameDomainId: null,
      entryStateSha256: null,
      trace: null,
      scenario: null,
      seed: null,
      startFrame: null,
      startSemantics: null,
      stopOrCompleteSemantics: null,
      synchronizationEstablished: false,
      replayBehaviorEstablished: false,
    },
    physicalVerification: {
      regularNonSymlinkFile: true,
      realpathContainedInSourceRoot: true,
      bytesAndSha256MatchCatalog: true,
    },
    listening: {
      authorizedOriginalRuntimeSessionPresent: false,
      namedHumanListened: false,
      accepted: false,
    },
  };
  record.candidateFingerprintSha256 = fingerprint(record);
  return record;
}

export async function buildLessonAudioOwnershipReadiness({
  root = PROJECT_ROOT,
  releaseId,
  scopePath,
} = {}) {
  invariant(typeof releaseId === "string" && releaseId.length > 0, "--release-id is required");
  invariant(typeof scopePath === "string" && scopePath.length > 0, "--scope is required");
  const safeScopePath = projectRelative(root, scopePath, {prefix: "reports/", extension: ".json", label: "Source-scope report"});
  const [releaseInput, groupInput, sourceFilesInput, scopeInput, parserInput, generatorBytes] = await Promise.all([
    readJsonProjectFile(root, RELEASES_PATH, "lesson release catalog"),
    readJsonProjectFile(root, AUDIO_GROUPS_PATH, "audio group catalog"),
    readJsonProjectFile(root, SOURCE_FILES_PATH, "source file catalog"),
    readJsonProjectFile(root, safeScopePath, "source-scope report"),
    readRegularProjectFile(root, AUDIO_INVENTORY_PARSER_PATH, "audio inventory parser"),
    readFile(GENERATOR_PATH),
  ]);
  const releaseMatches = (releaseInput.value.releases || []).filter((release) => release.releaseId === releaseId);
  invariant(releaseMatches.length === 1, `Expected one lesson release ${releaseId}, found ${releaseMatches.length}`);
  const release = releaseMatches[0];
  const scope = scopeInput.value;
  invariant(scope.releaseId === releaseId, `Source-scope releaseId differs from ${releaseId}`);
  invariant(Array.isArray(release.members) && Array.isArray(scope.members), "Release or source-scope member list is malformed");
  invariant(release.expectedCounts?.members === release.members.length, `${releaseId}: expected member count is stale`);
  invariant(scope.members.length === release.members.length, `${releaseId}: release/source-scope member count differs`);
  invariant(release.publicationMode === "atomic", `${releaseId}: audio readiness expects an atomic lesson release`);

  const sourceFileByPath = new Map((sourceFilesInput.value.files || []).map((item) => [item.path, item]));
  const audioGroupById = new Map((groupInput.value.groups || []).map((group) => [group.groupId, group]));
  const candidates = scope.audioCandidateDisposition?.candidates || [];
  invariant(candidates.length > 0, `${releaseId}: source-scope report has no audio candidates`);
  invariant(new Set(candidates.map(({path: filePath}) => filePath)).size === candidates.length, `${releaseId}: audio candidate paths are duplicated`);
  invariant(new Set(candidates.map(({sha256}) => sha256)).size === candidates.length, `${releaseId}: audio candidate hashes are duplicated`);
  const candidateByCatalogPath = new Map();
  for (const item of candidates) {
    const descriptor = catalogDescriptor(item, `Audio candidate ${item.path}`);
    const sourceCatalogItem = sourceFileByPath.get(item.path);
    invariant(sourceCatalogItem, `${item.path}: candidate is missing from the current source-file catalog`);
    invariant(sameCanonical(descriptor, catalogDescriptor(sourceCatalogItem, `Source catalog ${item.path}`)), `${item.path}: source-file catalog identity differs from the frozen scope`);
    candidateByCatalogPath.set(item.path, descriptor);
  }

  const exactOwners = new Map();
  const groupOwners = new Map();
  const groupFileById = new Map();
  for (const member of scope.members) {
    exactReleaseMember(release, member);
    for (const exact of member.audioCatalog?.exact || []) {
      invariant(candidateByCatalogPath.has(exact.path), `${member.animationId}: exact candidate ${exact.path} is outside the ${candidates.length}-file scope`);
      invariant(sameCanonical(catalogDescriptor(exact, `${member.animationId} exact audio`), candidateByCatalogPath.get(exact.path)), `${member.animationId}: exact candidate identity differs`);
      exactOwners.set(exact.path, [...(exactOwners.get(exact.path) || []), member.animationId]);
    }
    for (const groupId of member.audioCatalog?.groupIds || []) {
      groupOwners.set(groupId, [...(groupOwners.get(groupId) || []), member.animationId]);
    }
  }

  const groupedScope = scope.audioCandidateDisposition?.groupedCandidates || [];
  const groupEntries = new Map();
  for (const item of groupedScope) {
    invariant(candidateByCatalogPath.has(item.path), `${item.path}: grouped candidate is outside the candidate scope`);
    const group = audioGroupById.get(item.groupId);
    invariant(group, `Audio group ${item.groupId} is missing from the current audio-group catalog`);
    const catalogMatches = group.files.filter((file) => file.path === item.path);
    invariant(catalogMatches.length === 1, `${item.path}: audio group membership is missing or duplicated`);
    const catalogItem = catalogMatches[0];
    invariant(catalogItem.bytes === item.bytes && catalogItem.sha256 === item.sha256
      && (catalogItem.language || "unresolved") === item.catalogLanguage, `${item.path}: audio group descriptor differs from the frozen scope`);
    groupEntries.set(item.path, [...(groupEntries.get(item.path) || []), {
      groupId: item.groupId,
      catalogLanguage: item.catalogLanguage || "unresolved",
    }]);
  }
  for (const [groupId] of groupOwners) {
    const group = audioGroupById.get(groupId);
    invariant(group, `Referenced audio group ${groupId} is missing`);
    const files = group.files.map((item) => candidateByCatalogPath.get(item.path));
    invariant(files.every(Boolean), `${groupId}: current group contains a file outside the frozen candidate scope`);
    groupFileById.set(groupId, files);
  }

  const unmappedDescriptors = scope.audioCandidateDisposition?.unmappedCandidates || [];
  const unmapped = new Set(unmappedDescriptors.map(({path: filePath}) => filePath));
  for (const item of unmappedDescriptors) {
    invariant(candidateByCatalogPath.has(item.path), `${item.path}: unmapped candidate is outside the candidate scope`);
    invariant(sameCanonical(catalogDescriptor(item, `Unmapped candidate ${item.path}`), candidateByCatalogPath.get(item.path)), `${item.path}: unmapped candidate identity differs`);
  }
  const exactPaths = new Set(exactOwners.keys());
  const groupedPaths = new Set(groupEntries.keys());
  invariant([...candidateByCatalogPath.keys()].every((filePath) => Number(exactPaths.has(filePath)) + Number(groupedPaths.has(filePath)) + Number(unmapped.has(filePath)) === 1),
    `${releaseId}: exact/grouped/unmapped candidate partition is incomplete or overlapping`);

  const physicalDescriptors = await mapLimited(candidates, 8, (item) => verifyPhysicalAudio(root, item));
  const physicalByCatalogPath = new Map(physicalDescriptors.map((descriptor) => [descriptor.path.slice(SOURCE_ROOT.length + 1), descriptor]));
  const memberPlans = await mapLimited(scope.members, 8, (scopeMember) => inspectWorkspace({
    root,
    scopeMember,
    releaseMember: exactReleaseMember(release, scopeMember),
    candidateByCatalogPath,
    groupFileById,
  }));
  const candidateFiles = candidates.map((item) => describeCandidate({
    item,
    physical: physicalByCatalogPath.get(item.path),
    exactOwners,
    groupOwners,
    groupEntries,
    unmapped,
  })).sort((left, right) => left.catalogRelativePath.localeCompare(right.catalogRelativePath));

  const classCount = (classification) => memberPlans.filter((member) => member.candidateOwnership.classification === classification).length;
  const candidateClassCount = (classification) => candidateFiles.filter((item) => item.classification === classification).length;
  const catalogLanguageCandidateCounts = Object.fromEntries([...new Set(candidateFiles.map((item) => item.languageEvidence.catalogLanguageCandidate))]
    .sort().map((language) => [language, candidateFiles.filter((item) => item.languageEvidence.catalogLanguageCandidate === language).length]));
  const report = {
    schemaVersion: 1,
    reportType: "lesson-audio-ownership-machine-readiness",
    releaseId,
    evidenceState: "acceptance-neutral-catalog-ownership-and-machine-readiness-fail-closed",
    generator: {
      path: portable(path.relative(root, GENERATOR_PATH)),
      bytes: generatorBytes.length,
      sha256: sha256(generatorBytes),
    },
    sourceBindings: {
      lessonReleases: releaseInput.descriptor,
      sourceScope: scopeInput.descriptor,
      sourceFilesCatalog: sourceFilesInput.descriptor,
      audioGroupsCatalog: groupInput.descriptor,
      audioInventoryParser: parserInput.descriptor,
    },
    release: {
      publicationMode: release.publicationMode,
      grade: release.grade,
      lesson: release.lesson,
      title: release.titleDisplay,
      memberCount: release.members.length,
      sourceLesson: release.sourceLesson,
    },
    summary: {
      memberCount: memberPlans.length,
      exactPageCandidateMemberCount: classCount("exact-page-catalog-candidate"),
      sharedFinalQuizGroupMemberCount: classCount("shared-final-quiz-group-candidate"),
      noCatalogCandidateMemberCount: classCount("no-catalog-candidate-negative-proof-pending"),
      candidateFileCount: candidateFiles.length,
      exactPageCandidateFileCount: candidateClassCount("exact-page-catalog-candidate"),
      sharedFinalQuizGroupFileCount: candidateClassCount("shared-final-quiz-group-candidate"),
      unmappedCandidateFileCount: candidateClassCount("unmapped-candidate-pending-disposition"),
      physicalHashVerifiedFileCount: candidateFiles.filter((item) => item.physicalVerification.bytesAndSha256MatchCatalog).length,
      catalogLanguageCandidateCounts,
      memberCandidateReferenceCount: memberPlans.reduce((sum, member) => sum + member.candidateOwnership.candidateCount, 0),
      canonicalInventoryRowCount: memberPlans.reduce((sum, member) => sum + member.canonicalInventoryObservation.rowCount, 0),
      dedicatedMachineAudioAuditPresentCount: memberPlans.filter((member) => member.machineReadiness.dedicatedMachineAudioAuditPresent).length,
      machineCueMapCompleteCount: 0,
      spokenLanguageEstablishedFileCount: 0,
      authorizedOriginalRuntimeListeningSessionCount: 0,
      audioAcceptedFileCount: 0,
      audioAcceptedMemberCount: 0,
      strictCompleteMemberCount: 0,
      publishedMemberCount: 0,
      candidateSetSha256: fingerprint(candidateFiles.map(({candidateId: id, source, classification}) => ({id, source, classification}))),
      memberPlanSetSha256: fingerprint(memberPlans.map(({animationId, planFingerprintSha256}) => ({animationId, planFingerprintSha256}))),
    },
    candidateFiles,
    memberPlans,
    unresolvedUnmappedCandidates: candidateFiles
      .filter(({classification}) => classification === "unmapped-candidate-pending-disposition")
      .map(({candidateId: id, source, catalogRelativePath}) => ({
        candidateId: id,
        source,
        catalogRelativePath,
        filenameConventionOnly: "TS-and-Sp-markers-are-not-proof-of-member-cue-or-spoken-language",
        status: "pending-assignment-or-reviewed-exclusion",
        requiredDisposition: "bind-to-an-exact-member-cue-with-source-and-authorized-natural-runtime-evidence-or-record-an-explicit-reviewed-exclusion",
      })),
    releaseBlockers: [
      "all-member-source-bound-audio-cue-maps-incomplete",
      "shared-final-quiz-group-question-answer-seed-and-member-ownership-unresolved",
      "unmapped-catalog-files-pending-assignment-or-reviewed-exclusion",
      "spoken-language-and-audible-content-unverified-by-named-humans",
      "authorized-original-runtime-listening-sync-and-replay-acceptance-missing",
    ],
    authorityBoundary: {
      acceptanceNeutral: true,
      sourceFilesWritten: 0,
      workspaceFilesWritten: 0,
      canonicalAudioInventoriesWritten: 0,
      migrationStatusOrReviewFilesWritten: 0,
      ledgersWritten: 0,
      audioPlayed: false,
      spokenLanguageEstablished: false,
      runtimeCueOwnershipEstablished: false,
      runtimeSynchronizationEstablished: false,
      listeningAcceptanceEstablished: false,
      authoritativeOriginalRuntimeEstablished: false,
      humanReviewEstablished: false,
      ownerAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      publicationEstablished: false,
    },
    acceptance: {
      candidatePartitionHashBoundAndPhysicallyVerified: true,
      perMemberMachinePlanningReady: true,
      cueMappingAccepted: false,
      spokenLanguageAccepted: false,
      synchronizationAccepted: false,
      listeningAccepted: false,
      humanAccepted: false,
      ownerAccepted: false,
      strictLessonComplete: false,
      published: false,
      statement: "The catalog-level candidate partition and current workspace inputs are hash-bound and physically verified. No candidate has an accepted runtime cue, spoken-language finding, synchronization result, named-human listening decision, owner decision, strict-completion effect, or publication effect.",
    },
  };
  report.reportFingerprintSha256 = fingerprint(report);
  return validateLessonAudioOwnershipReadiness(report);
}

export function validateLessonAudioOwnershipReadiness(report) {
  invariant(report?.schemaVersion === 1 && report?.reportType === "lesson-audio-ownership-machine-readiness", "Unexpected lesson audio readiness schema");
  invariant(typeof report.releaseId === "string" && report.releaseId.length > 0, "Lesson audio readiness releaseId is missing");
  invariant(Array.isArray(report.candidateFiles) && Array.isArray(report.memberPlans), "Lesson audio readiness arrays are missing");
  const candidates = report.candidateFiles;
  const members = report.memberPlans;
  invariant(new Set(candidates.map(({candidateId: id}) => id)).size === candidates.length, "Candidate IDs are duplicated");
  invariant(new Set(candidates.map(({source}) => source.path)).size === candidates.length, "Candidate source paths are duplicated");
  invariant(new Set(candidates.map(({source}) => source.sha256)).size === candidates.length, "Candidate source hashes are duplicated");
  invariant(new Set(members.map(({animationId}) => animationId)).size === members.length, "Member plan IDs are duplicated");
  const candidateIds = new Set(candidates.map(({candidateId: id}) => id));
  for (const candidate of candidates) {
    invariant(/^audio-[a-f0-9]{64}$/.test(candidate.candidateId), `${candidate.candidateId}: malformed candidate ID`);
    invariant(candidate.candidateId === `audio-${candidate.source.sha256}`, `${candidate.candidateId}: candidate ID does not bind its source hash`);
    invariant(candidate.source.path.startsWith(`${SOURCE_ROOT}/`) && !path.isAbsolute(candidate.source.path), `${candidate.candidateId}: source path is not portable`);
    invariant(Number.isSafeInteger(candidate.source.bytes) && candidate.source.bytes > 0 && SHA256_PATTERN.test(candidate.source.sha256), `${candidate.candidateId}: source descriptor is invalid`);
    invariant(["exact-page-catalog-candidate", "shared-final-quiz-group-candidate", "unmapped-candidate-pending-disposition"].includes(candidate.classification), `${candidate.candidateId}: classification is invalid`);
    const ownerCount = candidate.candidateGrouping?.ownerAnimationIds?.length || 0;
    if (candidate.classification === "exact-page-catalog-candidate") invariant(ownerCount === 1, `${candidate.candidateId}: exact candidate must have one catalog owner`);
    if (candidate.classification === "shared-final-quiz-group-candidate") invariant(ownerCount > 0 && candidate.candidateGrouping.groupIds.length > 0, `${candidate.candidateId}: grouped candidate lacks group owners`);
    if (candidate.classification === "unmapped-candidate-pending-disposition") invariant(ownerCount === 0 && candidate.candidateGrouping.groupIds.length === 0, `${candidate.candidateId}: unmapped candidate gained an unreviewed owner`);
    invariant(candidate.languageEvidence?.spokenLanguage === "unresolved-not-listened"
      && candidate.languageEvidence.spokenLanguageEstablished === false
      && candidate.languageEvidence.languageAccepted === false, `${candidate.candidateId}: language evidence crossed the machine boundary`);
    invariant(Object.values(candidate.cueEvidence).every((value) => value === null || value === false), `${candidate.candidateId}: cue evidence crossed the machine boundary`);
    invariant(candidate.physicalVerification?.regularNonSymlinkFile === true
      && candidate.physicalVerification.realpathContainedInSourceRoot === true
      && candidate.physicalVerification.bytesAndSha256MatchCatalog === true, `${candidate.candidateId}: physical verification is incomplete`);
    invariant(candidate.listening?.authorizedOriginalRuntimeSessionPresent === false
      && candidate.listening.namedHumanListened === false && candidate.listening.accepted === false, `${candidate.candidateId}: listening state crossed the machine boundary`);
    const {candidateFingerprintSha256, ...fingerprintedCandidate} = candidate;
    invariant(candidateFingerprintSha256 === fingerprint(fingerprintedCandidate), `${candidate.candidateId}: candidate fingerprint is stale`);
  }
  for (const member of members) {
    invariant(member.ordinal >= 1 && typeof member.animationId === "string" && SHA256_PATTERN.test(member.source?.sha256 || ""), `${member.animationId || "member"}: member identity is invalid`);
    invariant(member.candidateOwnership?.candidateIds.every((id) => candidateIds.has(id)), `${member.animationId}: member references an unknown candidate`);
    invariant(member.candidateOwnership.candidateCount === member.candidateOwnership.candidateIds.length, `${member.animationId}: candidate count is stale`);
    invariant(member.candidateOwnership.catalogAssociationOnly === true && member.candidateOwnership.runtimeCueOwnershipEstablished === false, `${member.animationId}: catalog ownership was over-promoted`);
    invariant(member.machineReadiness?.machineCueMapComplete === false
      && member.machineReadiness.runtimeSynchronizationEstablished === false
      && member.machineReadiness.spokenLanguageEstablished === false
      && member.machineReadiness.listeningSessionPresent === false
      && member.machineReadiness.listeningAccepted === false, `${member.animationId}: machine readiness crossed an acceptance gate`);
    invariant(Array.isArray(member.machineReadiness.blockers) && member.machineReadiness.blockers.length >= 6, `${member.animationId}: blocker set is incomplete`);
    invariant(Object.values(member.acceptance || {}).every((value) => value === false), `${member.animationId}: acceptance must remain false`);
    const {planFingerprintSha256, ...fingerprintedMember} = member;
    invariant(planFingerprintSha256 === fingerprint(fingerprintedMember), `${member.animationId}: member plan fingerprint is stale`);
  }
  const countMembers = (classification) => members.filter((member) => member.candidateOwnership.classification === classification).length;
  const countFiles = (classification) => candidates.filter((candidate) => candidate.classification === classification).length;
  const summary = report.summary || {};
  invariant(summary.memberCount === members.length
    && summary.exactPageCandidateMemberCount === countMembers("exact-page-catalog-candidate")
    && summary.sharedFinalQuizGroupMemberCount === countMembers("shared-final-quiz-group-candidate")
    && summary.noCatalogCandidateMemberCount === countMembers("no-catalog-candidate-negative-proof-pending"), "Member summary is stale");
  invariant(summary.candidateFileCount === candidates.length
    && summary.exactPageCandidateFileCount === countFiles("exact-page-catalog-candidate")
    && summary.sharedFinalQuizGroupFileCount === countFiles("shared-final-quiz-group-candidate")
    && summary.unmappedCandidateFileCount === countFiles("unmapped-candidate-pending-disposition")
    && summary.physicalHashVerifiedFileCount === candidates.length, "Candidate summary is stale");
  const languageCandidateCounts = Object.fromEntries([...new Set(candidates.map((candidate) => candidate.languageEvidence.catalogLanguageCandidate))]
    .sort().map((language) => [language, candidates.filter((candidate) => candidate.languageEvidence.catalogLanguageCandidate === language).length]));
  invariant(sameCanonical(summary.catalogLanguageCandidateCounts, languageCandidateCounts), "Catalog language-candidate summary is stale");
  invariant(summary.memberCandidateReferenceCount === members.reduce((sum, member) => sum + member.candidateOwnership.candidateCount, 0), "Member candidate reference summary is stale");
  invariant(summary.canonicalInventoryRowCount === members.reduce((sum, member) => sum + member.canonicalInventoryObservation.rowCount, 0), "Canonical inventory row summary is stale");
  invariant(summary.dedicatedMachineAudioAuditPresentCount === members.filter((member) => member.machineReadiness.dedicatedMachineAudioAuditPresent).length, "Dedicated machine-audio audit summary is stale");
  invariant(summary.candidateSetSha256 === fingerprint(candidates.map(({candidateId: id, source, classification}) => ({id, source, classification}))), "Candidate set fingerprint is stale");
  invariant(summary.memberPlanSetSha256 === fingerprint(members.map(({animationId, planFingerprintSha256}) => ({animationId, planFingerprintSha256}))), "Member plan set fingerprint is stale");
  for (const field of ["machineCueMapCompleteCount", "spokenLanguageEstablishedFileCount", "authorizedOriginalRuntimeListeningSessionCount", "audioAcceptedFileCount", "audioAcceptedMemberCount", "strictCompleteMemberCount", "publishedMemberCount"]) {
    invariant(summary[field] === 0, `Summary ${field} must remain zero`);
  }
  const unmapped = candidates.filter(({classification}) => classification === "unmapped-candidate-pending-disposition");
  invariant(report.unresolvedUnmappedCandidates?.length === unmapped.length
    && report.unresolvedUnmappedCandidates.every((item) => item.status === "pending-assignment-or-reviewed-exclusion"), "Unmapped candidate dispositions are incomplete");
  const boundary = report.authorityBoundary || {};
  invariant(boundary.acceptanceNeutral === true && boundary.sourceFilesWritten === 0
    && boundary.workspaceFilesWritten === 0 && boundary.canonicalAudioInventoriesWritten === 0
    && boundary.migrationStatusOrReviewFilesWritten === 0 && boundary.ledgersWritten === 0
    && Object.entries(boundary).filter(([key]) => !["acceptanceNeutral", "sourceFilesWritten", "workspaceFilesWritten", "canonicalAudioInventoriesWritten", "migrationStatusOrReviewFilesWritten", "ledgersWritten"].includes(key)).every(([, value]) => value === false),
  "Lesson audio readiness crossed its authority boundary");
  invariant(report.acceptance?.candidatePartitionHashBoundAndPhysicallyVerified === true
    && report.acceptance.perMemberMachinePlanningReady === true
    && Object.entries(report.acceptance).filter(([key]) => !["candidatePartitionHashBoundAndPhysicallyVerified", "perMemberMachinePlanningReady", "statement"].includes(key)).every(([, value]) => value === false),
  "Lesson audio readiness acceptance state is invalid");
  for (const descriptor of [report.generator, ...Object.values(report.sourceBindings || {})]) {
    invariant(typeof descriptor?.path === "string" && !path.isAbsolute(descriptor.path)
      && Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0 && SHA256_PATTERN.test(descriptor.sha256 || ""), "A source binding descriptor is invalid");
  }
  const {reportFingerprintSha256, ...fingerprintedReport} = report;
  invariant(reportFingerprintSha256 === fingerprint(fingerprintedReport), "Lesson audio readiness report fingerprint is stale");
  return report;
}

function markdownEscape(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderLessonAudioOwnershipReadinessMarkdown(report) {
  const memberRows = report.memberPlans.map((member) => `| ${member.ordinal} | \`${member.animationId}\` | ${member.candidateOwnership.classification} | ${member.candidateOwnership.candidateCount} | ${member.canonicalInventoryObservation.rowCount} | ${member.machineReadiness.dedicatedMachineAudioAuditPresent ? "present-unaccepted" : "missing"} | blocked |`);
  const candidateRows = report.candidateFiles.map((candidate) => `| \`${markdownEscape(candidate.source.path)}\` | \`${candidate.source.sha256}\` | ${candidate.classification} | ${candidate.languageEvidence.catalogLanguageCandidate} | ${candidate.candidateGrouping.ownerAnimationIds.map((id) => `\`${id}\``).join(", ") || "pending"} |`);
  const unmappedRows = report.unresolvedUnmappedCandidates.map((candidate) => `- \`${candidate.source.path}\` / \`${candidate.source.sha256}\`: ${candidate.status}; ${candidate.filenameConventionOnly}.`);
  return [
    `# ${report.releaseId} audio ownership and machine readiness`,
    "",
    "> Acceptance-neutral catalog ownership and machine planning only. This report does not establish a runtime cue, spoken language, listening result, synchronization, acceptance, strict completion, or publication.",
    "",
    "## Result",
    "",
    `- Members: **${report.summary.memberCount}** = ${report.summary.exactPageCandidateMemberCount} exact-page candidates + ${report.summary.sharedFinalQuizGroupMemberCount} shared-FQ-group members + ${report.summary.noCatalogCandidateMemberCount} members requiring a source-bound negative audit.`,
    `- Candidate files: **${report.summary.candidateFileCount}** = ${report.summary.exactPageCandidateFileCount} exact-page + ${report.summary.sharedFinalQuizGroupFileCount} shared FQ + ${report.summary.unmappedCandidateFileCount} unmapped candidates.`,
    `- Physically hash verified: **${report.summary.physicalHashVerifiedFileCount}/${report.summary.candidateFileCount}**.`,
    `- Catalog/path language candidates only: en ${report.summary.catalogLanguageCandidateCounts.en || 0}, es ${report.summary.catalogLanguageCandidateCounts.es || 0}, unresolved ${report.summary.catalogLanguageCandidateCounts.unresolved || 0}; spoken-language findings remain 0.`,
    `- Accepted cue maps / listening sessions / strict members: **0 / 0 / 0**.`,
    "",
    "## Per-member plan",
    "",
    "| Ordinal | Member | Catalog candidate class | Candidate refs | Current inventory rows | Dedicated machine audio audit | State |",
    "|---:|---|---|---:|---:|---|---|",
    ...memberRows,
    "",
    "## All candidate files",
    "",
    "The language column is a catalog/path label candidate only; it is not a finding about spoken content.",
    "",
    "| Physical source | SHA-256 | Candidate class | Catalog language candidate | Catalog candidate owners |",
    "|---|---|---|---|---|",
    ...candidateRows,
    "",
    "## Unmapped candidates",
    "",
    ...unmappedRows,
    "",
    `These ${report.unresolvedUnmappedCandidates.length} files remain outside every member's candidate ownership. Filename markers must not be used as proof of Spanish content or cue ownership. Each needs source plus authorized natural-runtime evidence for an exact assignment, or an explicit reviewed exclusion.`,
    "",
    "## Gate boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseLessonAudioOwnershipArguments(argv) {
  const options = {check: false, releaseId: null, scopePath: null, jsonOutput: null, markdownOutput: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--release-id") options.releaseId = argv[++index] || invariant(false, "--release-id requires a value");
    else if (argument === "--scope") options.scopePath = argv[++index] || invariant(false, "--scope requires a value");
    else if (argument === "--json-output") options.jsonOutput = argv[++index] || invariant(false, "--json-output requires a value");
    else if (argument === "--markdown-output") options.markdownOutput = argv[++index] || invariant(false, "--markdown-output requires a value");
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (options.releaseId) {
    options.jsonOutput ||= `reports/${options.releaseId}-audio-ownership-readiness.json`;
    options.markdownOutput ||= `reports/${options.releaseId}-audio-ownership-readiness.md`;
  }
  return options;
}

async function main() {
  const options = parseLessonAudioOwnershipArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("node scripts/build-lesson-audio-ownership-readiness.mjs --release-id <id> --scope <reports/scope.json> [--json-output <reports/output.json>] [--markdown-output <reports/output.md>] [--check]\n");
    return;
  }
  invariant(options.releaseId, "--release-id is required");
  invariant(options.scopePath, "--scope is required");
  const jsonOutput = path.resolve(PROJECT_ROOT, options.jsonOutput);
  const markdownOutput = path.resolve(PROJECT_ROOT, options.markdownOutput);
  await Promise.all([
    assertSafeReportOutput(jsonOutput, {root: PROJECT_ROOT, extension: ".json"}),
    assertSafeReportOutput(markdownOutput, {root: PROJECT_ROOT, extension: ".md"}),
  ]);
  const report = await buildLessonAudioOwnershipReadiness(options);
  const json = stableJson(report);
  const markdown = `${renderLessonAudioOwnershipReadinessMarkdown(report)}\n`;
  await Promise.all([
    writeOrCheckReport(jsonOutput, json, {root: PROJECT_ROOT, extension: ".json", check: options.check}),
    writeOrCheckReport(markdownOutput, markdown, {root: PROJECT_ROOT, extension: ".md", check: options.check}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${report.summary.candidateFileCount}/${report.summary.candidateFileCount} physical candidates hash-bound across ${report.summary.memberCount} members; acceptance effect none\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
