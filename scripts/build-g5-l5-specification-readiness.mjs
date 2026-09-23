#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH = "scripts/build-g5-l5-specification-readiness.mjs";
const CANDIDATE_GENERATOR_PATH =
  "scripts/materialize-g5-l5-pre-runtime-specification-candidates.mjs";
const CANDIDATE_PARSER_PATH =
  "scripts/build-g4-l3-swf-asset-definition-census.mjs";
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const TITLE = "Add & Subtract Negative Numbers";
const DEFAULT_OUTPUT_PREFIX = "reports/g5-l5-specification-readiness";
const SHA256 = /^[a-f0-9]{64}$/;
const STATIC_RECONCILIATION_RECEIPT_NAME =
  "g5-l5-m1-static-reconciliation-receipt.json";

const CORE_INPUTS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  sourceScope: "reports/g5-l5-source-scope-freeze.json",
  workspaceReadiness: "reports/g5-l5-workspace-readiness.json",
  runtimePlanning:
    "reports/g05-l05-add-subtract-negative-numbers-runtime-acquisition-planning-readiness.json",
});

const WORKSPACE_FILES = Object.freeze({
  migrationManifest: "migration.json",
  assetInventory: "asset-inventory.csv",
  audioInventory: "audio-inventory.csv",
  keyframes: "keyframes.csv",
  fullFrameCoverage: "evidence/full-frame-coverage.json",
  migrationBrief: "MIGRATION_BRIEF.md",
  machineAudit: "audit/machine/report.json",
  frameDomainCandidates: "audit/machine/swf-frame-domain-candidates.json",
  runtimePlan: "audit/machine/release-runtime-acquisition-plan.json",
  sourceScopeBinding: "audit/machine/g5-l5-source-scope-binding.json",
  audioRuntimeEvidence: "audit/audio-runtime-evidence.json",
  scriptIndex: "audit/machine/ffdec-script-index.txt",
  scriptExport: "audit/machine/ffdec-scripts.txt.gz",
  ffdecHeader: "audit/machine/ffdec-header.txt",
  swfmillSummary: "audit/machine/swfmill-summary.json",
  candidateRuntimeFacts:
    "audit/machine/manifest-runtime-facts-candidate.json",
  candidateAssetCensus:
    "audit/machine/swf-asset-definition-census.json",
  candidateDefinitionInventory:
    "audit/machine/swf-definition-inventory.csv",
  candidateScriptInventory:
    "audit/machine/ffdec-script-inventory-candidate.json",
  candidateDependencyInventory:
    "audit/machine/static-dependency-inventory-candidate.json",
  candidateBrief:
    "audit/machine/migration-brief-static-prefill-candidate.md",
  candidateReceipt:
    "audit/machine/pre-runtime-specification-candidate-receipt.json",
});

const OPTIONAL_SPECIFICATION_FILES = Object.freeze({
  frameDomainDisposition: "audit/frame-domain-disposition.json",
  scenarioInventory: "audit/scenario-inventory.json",
  scriptInventory: "audit/script-inventory.json",
  dependencyInventory: "audit/dependency-inventory.json",
});

const HISTORICAL_CANDIDATE_RECEIPT_INPUTS = Object.freeze({
  candidateRuntimeFacts: "runtimeFactsCandidate",
  candidateAssetCensus: "candidateAssetCensus",
  candidateDefinitionInventory: "candidateDefinitionInventory",
  candidateScriptInventory: "scriptCandidate",
  candidateDependencyInventory: "dependencyCandidate",
  candidateBrief: "briefCandidate",
  candidateReceipt: "candidateReceipt",
});

const ASSET_HEADERS = Object.freeze([
  "asset_id",
  "swf_character_id",
  "library_symbol",
  "type",
  "source_file",
  "source_frame",
  "exported_file",
  "sha256",
  "format",
  "dimensions_or_bounds",
  "font_glyphs",
  "transformation",
  "confidence",
  "license_or_provenance",
  "notes",
]);

const AUDIO_HEADERS = Object.freeze([
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

const KEYFRAME_HEADERS = Object.freeze([
  "frame",
  "requirement_id",
  "frame_domain_id",
  "trace_id",
  "entry_state_sha256",
  "time_ms",
  "scenario",
  "language",
  "kind",
  "expected_state",
  "trigger",
  "baseline_file",
  "baseline_sha256",
  "implementation_file",
  "implementation_sha256",
  "diff_file",
  "diff_sha256",
  "normalized_rmse",
  "timing_result",
  "visual_result",
  "evidence_source",
  "reviewer",
  "notes",
]);

const CANDIDATE_ACCEPTANCE_KEYS = Object.freeze([
  "audioAccepted",
  "authoritativeOriginalRuntime",
  "currentJavaScriptCandidate",
  "fidelityAccepted",
  "humanVisualAccepted",
  "implementationAuthorized",
  "ownerAccepted",
  "published",
  "strictComplete",
]);

const ASSET_DEFINITION_TAGS = Object.freeze([
  "DefineShape",
  "DefineShape2",
  "DefineShape3",
  "DefineShape4",
  "DefineMorphShape",
  "DefineMorphShape2",
  "DefineBits",
  "DefineBitsJPEG2",
  "DefineBitsJPEG3",
  "DefineBitsJPEG4",
  "DefineBitsLossless",
  "DefineBitsLossless2",
  "DefineFont",
  "DefineFont2",
  "DefineFont3",
  "DefineFont4",
  "DefineSound",
  "DefineSprite",
  "DefineText",
  "DefineText2",
  "DefineEditText",
  "DefineButton",
  "DefineButton2",
]);

const AUTOMATIC_TASK_DEFINITIONS = Object.freeze({
  "machine-sync-manifest-runtime-facts":
    "Copy hash-bound SWF signature/version, stage, FPS, root frame count, duration, background, AS generation, and tool versions from the checked machine audit into a reviewable candidate patch.",
  "machine-materialize-asset-candidates":
    "Materialize source-tag-backed asset candidates with character IDs and provenance. This does not choose renderer transformations or prove visual completeness.",
  "machine-materialize-script-candidates":
    "Index the existing FFDec script export into candidate script records and bind each record to the source SWF and export hashes.",
  "machine-materialize-static-dependency-candidates":
    "Record static external-call and dependency candidates from the machine audit without executing legacy endpoints or deciding runtime reachability.",
  "machine-prefill-brief-static-sections":
    "Prefill identity, source, native root metadata, structural tag counts, and unresolved evidence boundaries in the migration brief; leave instructional and renderer decisions unanswered.",
});

const RUNTIME_HUMAN_TASK_DEFINITIONS = Object.freeze({
  "human-read-only-authoring-audit":
    "A named human must inspect the paired legacy FLA through the reviewed read-only Animate protocol; preparation artifacts do not count as an authoring audit.",
  "human-swf-only-source-gap-disposition":
    "A human must record whether the missing paired FLA can be recovered or whether the shipped-SWF-only limitation remains an explicit source gap.",
  "original-runtime-reachable-scenarios-and-natural-traces":
    "An authorized original runtime must establish reachable scenarios, branches, host entry, event schedules, terminal states, Replay, languages, and deterministic/random behavior.",
  "original-runtime-frame-domain-reachability-and-entry-state":
    "An authorized original runtime plus source review must resolve which nested definitions are root-reachable and bind each reachable domain to placement and entry-state evidence.",
  "original-runtime-keyframes-and-behavior-map":
    "Original-runtime observation and human instructional review must identify teaching beats, visual transitions, interaction states, formulas, terminal states, and Replay keyframes.",
  "original-runtime-audio-listening-language-and-sync":
    "A named listener in the authorized original runtime must decide cue reachability, spoken language/content, synchronization, stop/loop behavior, or a source-bound not-required disposition.",
  "human-renderer-accessibility-and-localization-decision":
    "A human must choose and justify the renderer, rejected alternatives, accessibility behavior, localization approach, and asset transformation strategy.",
  "human-external-call-security-disposition":
    "A human security/product decision must disposition every static legacy external-call candidate without invoking the endpoint.",
  "authoritative-baseline-requirement-plan":
    "Requirement-level original-runtime authority and full reachable coverage must be defined before implementation capture can be compared.",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be non-empty, project-relative, and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() &&
      !metadata.isSymbolicLink() &&
      metadata.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  return metadata;
}

export async function readFileRecord(
  projectRoot,
  relativePath,
  label = relativePath,
) {
  const resolvedRoot = path.resolve(projectRoot);
  const absolutePath = resolveProjectPath(resolvedRoot, relativePath, label);
  const before = await assertOrdinaryFile(absolutePath, label);
  const [contents, realRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(resolvedRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const after = await assertOrdinaryFile(absolutePath, label);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs &&
      after.size === contents.length,
    `${label}: changed during read`,
  );
  return {
    path: relativePath,
    absolutePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

async function readJsonRecord(projectRoot, relativePath, label = relativePath) {
  const record = await readFileRecord(projectRoot, relativePath, label);
  try {
    return {
      ...record,
      document: JSON.parse(record.contents.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

async function optionalFileState(projectRoot, relativePath, label) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  try {
    const record = await readFileRecord(projectRoot, relativePath, label);
    return {present: true, path: relativePath, bytes: record.bytes, sha256: record.sha256};
  } catch (error) {
    if (error?.code === "ENOENT") return {present: false, path: relativePath};
    throw error;
  }
}

export function classifyStaticReconciliationState(receiptStates) {
  invariant(
    Array.isArray(receiptStates) &&
      receiptStates.length === 57 &&
      receiptStates.every(
        (state) => state && typeof state.present === "boolean",
      ),
    "static reconciliation state must contain 57 receipt states",
  );
  const count = receiptStates.filter(({present}) => present).length;
  invariant(
    count === 0 || count === 57,
    `G5 L5 static reconciliation receipt set is partial (${count}/57)`,
  );
  return count === 57 ? "post-adoption" : "pre-adoption";
}

function descriptor(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function parseCsv(text, expectedHeaders, label) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === "\"") {
      if (quoted && text[index + 1] === "\"") {
        field += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  invariant(!quoted, `${label}: unterminated quoted CSV field`);
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  invariant(rows.length > 0, `${label}: CSV is empty`);
  invariant(
    stableJson(rows[0]) === stableJson(expectedHeaders),
    `${label}: CSV headers drifted`,
  );
  for (const [index, dataRow] of rows.slice(1).entries()) {
    invariant(
      dataRow.length === expectedHeaders.length,
      `${label}: row ${index + 2} has ${dataRow.length} fields instead of ${expectedHeaders.length}`,
    );
  }
  return {
    headers: rows[0],
    rows: rows.slice(1),
  };
}

function selectRelease(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "release manifest is malformed",
  );
  const matches = document.releases.filter(({releaseId}) => releaseId === RELEASE_ID);
  invariant(matches.length === 1, `${RELEASE_ID}: release is not unique`);
  const release = matches[0];
  invariant(
    release.titleDisplay === TITLE &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 57 &&
      Array.isArray(release.members) &&
      release.members.length === 57,
    `${RELEASE_ID}: release identity or scope drifted`,
  );
  invariant(
    release.members.every((member, index) => member.ordinal === index + 1) &&
      new Set(release.members.map(({animationId}) => animationId)).size === 57 &&
      new Set(release.members.map(({assetId}) => assetId)).size === 57,
    `${RELEASE_ID}: ordered member identity drifted`,
  );
  return release;
}

function validateReleaseReports(release, sourceScope, workspaceReadiness, runtimePlanning) {
  invariant(
    sourceScope?.schemaVersion === 1 &&
      sourceScope.releaseId === RELEASE_ID &&
      sourceScope.summary?.memberCount === 57 &&
      sourceScope.summary?.strictCompleteCount === 0 &&
      sourceScope.summary?.publishedCount === 0 &&
      Array.isArray(sourceScope.members) &&
      sourceScope.members.length === 57,
    "G5 L5 source-scope report drifted or crossed an acceptance boundary",
  );
  invariant(
    workspaceReadiness?.schemaVersion === 1 &&
      workspaceReadiness.releaseId === RELEASE_ID &&
      workspaceReadiness.summary?.expectedWorkspaceCount === 57 &&
      workspaceReadiness.summary?.presentWorkspaceCount === 57 &&
      workspaceReadiness.summary?.draftValidationPassCount === 57 &&
      workspaceReadiness.summary?.implementationStartedCount === 0 &&
      workspaceReadiness.summary?.strictCompleteCount === 0 &&
      workspaceReadiness.summary?.publishedCount === 0 &&
      Array.isArray(workspaceReadiness.workspaces) &&
      workspaceReadiness.workspaces.length === 57,
    "G5 L5 workspace-readiness report drifted or crossed an implementation boundary",
  );
  invariant(
    runtimePlanning?.schemaVersion === 2 &&
      runtimePlanning.identity?.releaseId === RELEASE_ID &&
      runtimePlanning.scope?.releaseMemberCount === 57 &&
      runtimePlanning.summary?.selectedMemberCount === 57 &&
      runtimePlanning.summary?.runtimeSessionCount === 0 &&
      runtimePlanning.summary?.authoritativeBaselineCount === 0 &&
      runtimePlanning.gates?.implementationAuthorized === false &&
      runtimePlanning.gates?.strictCompletionAffected === false &&
      runtimePlanning.gates?.publicationAffected === false,
    "G5 L5 runtime-planning report drifted or crossed a runtime/implementation boundary",
  );
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const scoped = sourceScope.members[index];
    const workspace = workspaceReadiness.workspaces[index];
    invariant(
      scoped?.ordinal === member.ordinal &&
        scoped?.animationId === member.animationId &&
        scoped?.assetId === member.assetId &&
        scoped?.source?.swf?.path === member.source.path &&
        scoped?.source?.swf?.sha256 === member.source.sha256 &&
        scoped?.strictComplete === false,
      `${member.animationId}: source-scope membership drifted`,
    );
    invariant(
      workspace?.ordinal === member.ordinal &&
        workspace?.animationId === member.animationId &&
        workspace?.assetId === member.assetId &&
        workspace?.workspacePath === `migrations/${member.animationId}` &&
        workspace?.draftValidation?.passed === true &&
        workspace?.implementationStatus === "not-started" &&
        workspace?.strictComplete === false,
      `${member.animationId}: workspace-readiness membership drifted`,
    );
  }
}

function sumTagCounts(tags, names) {
  return names.reduce(
    (sum, name) => sum + (Number.isSafeInteger(tags?.[name]) ? tags[name] : 0),
    0,
  );
}

function briefIsTemplate(text) {
  return text.includes(
    "Describe the instructional purpose, target users, required languages, interactions, and exact stakeholder request.",
  ) &&
    text.includes(
      "Selected renderer: React + SVG / Canvas + CreateJS / Canvas + PixiJS / other",
    ) &&
    text.includes(
      "Summarize object phases, one-indexed frame windows, transforms, alpha, depth, text/count changes, audio cues, and interaction transitions.",
    );
}

function allFalse(value, keys) {
  return keys.every((key) => value?.[key] === false);
}

function fingerprintIsValid(document) {
  if (
    !document ||
    typeof document !== "object" ||
    !SHA256.test(document.artifactFingerprintSha256 || "") ||
    document.generatedMarker !==
      `sha256:${document.artifactFingerprintSha256}`
  ) {
    return false;
  }
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  delete projected.generatedMarker;
  return sha256(stableJson(projected)) === document.artifactFingerprintSha256;
}

function candidateDocumentIsNeutral({
  document,
  artifactType,
  member,
  candidateGenerator,
  candidateParser,
  label,
}) {
  const acceptanceKeys = Object.keys(
    document?.acceptanceEffects || {},
  ).sort();
  invariant(
    document?.schemaVersion === 1 &&
      document.artifactType === artifactType &&
      document.releaseId === RELEASE_ID &&
      document.animationId === member.animationId &&
      document.assetId === member.assetId &&
      document.generatedBy?.path === CANDIDATE_GENERATOR_PATH &&
      document.generatedBy?.bytes === candidateGenerator.bytes &&
      document.generatedBy?.sha256 === candidateGenerator.sha256 &&
      document.generatedBy?.dependencies?.swfDefinitionParser?.path ===
        CANDIDATE_PARSER_PATH &&
      document.generatedBy.dependencies.swfDefinitionParser.bytes ===
        candidateParser.bytes &&
      document.generatedBy.dependencies.swfDefinitionParser.sha256 ===
        candidateParser.sha256 &&
      document.generatedBy.dependencies.swfDefinitionParser
        .importedFunction === "collectSwfAssetDefinitions" &&
      document.ownership?.owner ===
        "g5-l5-pre-runtime-specification-candidate-materializer" &&
      document.ownership?.safeToReplaceOnlyWithThisMaterializer === true &&
      document.ownership?.canonicalFile === false &&
      document.ownership?.acceptanceEvidence === false &&
      stableJson(acceptanceKeys) ===
        stableJson([...CANDIDATE_ACCEPTANCE_KEYS].sort()) &&
      Object.values(document.acceptanceEffects).every(
        (value) => value === false,
      ) &&
      fingerprintIsValid(document),
    `${label}: candidate identity, generator binding, fingerprint, or acceptance boundary drifted`,
  );
}

export function validateCandidatePackage({
  member,
  migration,
  machineAudit,
  frameDomains,
  records,
  candidateGenerator,
  candidateParser,
  releaseManifestBinding,
  staticReconciliation = null,
}) {
  if (staticReconciliation) {
    invariant(
      staticReconciliation.receipt?.reconciliation?.applied === true &&
        staticReconciliation.receipt.reconciliation.machineOnlyStatic ===
          true &&
        staticReconciliation.receipt.summary?.runtimeReachabilityResolved ===
          false,
      `${member.animationId}: static reconciliation receipt crossed its machine-only boundary`,
    );
    for (const [recordKey, inputKey] of Object.entries(
      HISTORICAL_CANDIDATE_RECEIPT_INPUTS,
    )) {
      const expected = staticReconciliation.receipt.inputs?.[inputKey];
      const actual = descriptor(records[recordKey]);
      invariant(
        expected?.path === actual.path &&
          expected.bytes === actual.bytes &&
          expected.sha256 === actual.sha256,
        `${member.animationId}: historical ${recordKey} differs from the static reconciliation receipt`,
      );
    }
  }
  const documents = {
    candidateRuntimeFacts: {
      artifactType: "g5-l5-manifest-runtime-facts-candidate",
      document: records.candidateRuntimeFacts.document,
    },
    candidateAssetCensus: {
      artifactType: "g5-l5-swf-asset-definition-census-candidate",
      document: records.candidateAssetCensus.document,
    },
    candidateScriptInventory: {
      artifactType: "g5-l5-ffdec-script-inventory-candidate",
      document: records.candidateScriptInventory.document,
    },
    candidateDependencyInventory: {
      artifactType: "g5-l5-static-dependency-inventory-candidate",
      document: records.candidateDependencyInventory.document,
    },
    candidateReceipt: {
      artifactType:
        "g5-l5-pre-runtime-specification-candidate-receipt",
      document: records.candidateReceipt.document,
    },
  };
  for (const [key, {artifactType, document}] of Object.entries(documents)) {
    candidateDocumentIsNeutral({
      document,
      artifactType,
      member,
      candidateGenerator,
      candidateParser,
      label: `${member.animationId} ${key}`,
    });
  }

  const runtimeFacts = records.candidateRuntimeFacts.document;
  const census = records.candidateAssetCensus.document;
  const scripts = records.candidateScriptInventory.document;
  const dependencies = records.candidateDependencyInventory.document;
  const receipt = records.candidateReceipt.document;
  const historicalBefore = (name, fallback) => {
    if (!staticReconciliation) return fallback;
    const value = staticReconciliation.receipt.outputs?.[name]?.before;
    invariant(
      value?.exists === true &&
        value.path === fallback.path &&
        Number.isSafeInteger(value.bytes) &&
        value.bytes > 0 &&
        SHA256.test(value.sha256 || ""),
      `${member.animationId}: static reconciliation lacks ${name} preimage`,
    );
    return {path: value.path, bytes: value.bytes, sha256: value.sha256};
  };
  const expectedFullBindings = {
    lessonReleaseCatalog: releaseManifestBinding,
    migrationManifest: historicalBefore(
      "migrationManifest",
      descriptor(records.migrationManifest),
    ),
    migrationBrief: historicalBefore(
      "migrationBrief",
      descriptor(records.migrationBrief),
    ),
    canonicalAssetInventory: descriptor(records.assetInventory),
    canonicalAudioInventory: descriptor(records.audioInventory),
    canonicalKeyframes: descriptor(records.keyframes),
    canonicalCoverageV2: descriptor(records.fullFrameCoverage),
    sourceScopeBinding: descriptor(records.sourceScopeBinding),
    machineAudit: descriptor(records.machineAudit),
    frameDomainCandidates: descriptor(records.frameDomainCandidates),
    swfmillSummary: descriptor(records.swfmillSummary),
    ffdecHeader: descriptor(records.ffdecHeader),
    ffdecScriptIndex: descriptor(records.scriptIndex),
    ffdecScripts: descriptor(records.scriptExport),
  };
  const expectedScriptBindings = {
    lessonReleaseCatalog: expectedFullBindings.lessonReleaseCatalog,
    migrationManifest: expectedFullBindings.migrationManifest,
    machineAudit: expectedFullBindings.machineAudit,
    ffdecScriptIndex: expectedFullBindings.ffdecScriptIndex,
    ffdecScripts: expectedFullBindings.ffdecScripts,
  };
  const expectedDependencyBindings = {
    lessonReleaseCatalog: expectedFullBindings.lessonReleaseCatalog,
    migrationManifest: expectedFullBindings.migrationManifest,
    machineAudit: expectedFullBindings.machineAudit,
    ffdecScripts: expectedFullBindings.ffdecScripts,
  };
  invariant(
    stableJson(runtimeFacts.inputs) === stableJson(expectedFullBindings) &&
      stableJson(census.inputs) === stableJson(expectedFullBindings) &&
      stableJson(receipt.inputs) === stableJson(expectedFullBindings) &&
      stableJson(scripts.inputs) === stableJson(expectedScriptBindings) &&
      stableJson(dependencies.inputs) ===
        stableJson(expectedDependencyBindings),
    `${member.animationId}: candidate input bindings are stale or incomplete`,
  );
  const definitionCsv = parseCsv(
    records.candidateDefinitionInventory.contents.toString("utf8"),
    ASSET_HEADERS,
    `${member.animationId} machine definition candidate inventory`,
  );
  const machineExternalCalls =
    machineAudit.findings.externalCallCandidates.map(({api, occurrences}) => ({
      api,
      occurrences,
    }));
  const candidateExternalCalls =
    dependencies.candidates.map(({api, occurrences}) => ({api, occurrences}));
  const expectedCommonUnresolved = {
    rootReachableNestedDomains:
      frameDomains.summary.nestedDefinitionCount,
    nestedPlacementEntryStates:
      frameDomains.summary.nestedDefinitionCount,
    reachableScenarios: true,
    naturalTraces: true,
    keyframeBehaviorMap: true,
    rendererSelection: true,
    audioListeningLanguageAndSynchronization: true,
    authoritativeBaseline: true,
    humanDecisions: true,
  };
  invariant(
    stableJson(runtimeFacts.unresolved) ===
      stableJson(expectedCommonUnresolved) &&
      stableJson(census.unresolved) ===
        stableJson(expectedCommonUnresolved) &&
      stableJson(receipt.unresolved) ===
        stableJson(expectedCommonUnresolved) &&
      stableJson(scripts.unresolved) === stableJson({
        runtimeReachability: true,
        sourceTargetSemantics: true,
        scenarioAndTraceBinding: true,
        hostAndExternalDependencySemantics: true,
      }) &&
      stableJson(dependencies.unresolved) === stableJson({
        runtimeReachability: true,
        endpointOrTarget: candidateExternalCalls.length > 0,
        securityDisposition: candidateExternalCalls.length > 0,
        reviewedReplacementApi: true,
        hostDependencyClosure: true,
      }),
    `${member.animationId}: candidate unresolved-state contract drifted`,
  );

  invariant(
    runtimeFacts.source?.swf?.sha256 === member.source.sha256 &&
      runtimeFacts.candidateRuntimeFacts?.stage?.width ===
        migration.runtime.stage.width &&
      runtimeFacts.candidateRuntimeFacts?.stage?.height ===
        migration.runtime.stage.height &&
      runtimeFacts.candidateRuntimeFacts?.fps === migration.runtime.fps &&
      runtimeFacts.candidateRuntimeFacts?.rootFrameCount ===
        migration.runtime.frameCount &&
      runtimeFacts.candidateRuntimeFacts?.durationMs ===
        migration.runtime.durationMs &&
      runtimeFacts.candidateRuntimeFacts?.actionScriptGeneration ===
        machineAudit.findings.actionScriptVersion &&
      runtimeFacts.candidateRuntimeFacts?.backgroundColor ===
        machineAudit.findings.backgroundColor &&
      runtimeFacts.canonicalPatchApplied === false &&
      runtimeFacts.canonicalManifestBefore?.actionScriptVersion ===
        (staticReconciliation
          ? "unknown"
          : migration.runtime.actionScriptVersion) &&
      runtimeFacts.canonicalManifestBefore?.backgroundColor ===
        (staticReconciliation ? "" : migration.runtime.backgroundColor) &&
      runtimeFacts.canonicalManifestBefore?.complexity ===
        migration.runtime.complexity &&
      runtimeFacts.canonicalManifestBefore?.scriptCount ===
        (staticReconciliation ? 0 : migration.runtime.scripts.length) &&
      runtimeFacts.canonicalManifestBefore?.externalDependencyCount ===
        migration.runtime.externalDependencies.length &&
      runtimeFacts.canonicalManifestBefore?.rendering ===
        migration.implementation.rendering &&
      runtimeFacts.canonicalManifestBefore?.changedByThisCandidate === false,
    `${member.animationId}: manifest runtime-facts candidate drifted`,
  );
  invariant(
    census.source?.sha256 === member.source.sha256 &&
      census.summary?.definitionCount === census.definitions?.length &&
      census.summary.definitionCount === definitionCsv.rows.length &&
      census.summary.definitionCount ===
        sumTagCounts(
          machineAudit.findings.swfmill?.tagCounts ?? {},
          ASSET_DEFINITION_TAGS,
        ) &&
      census.summary.canonicalAssetInventoryRowsAdded === 0 &&
      census.summary.rendererAssetExportCount === 0 &&
      census.summary.runtimePlacementDispositionCount === 0 &&
      census.summary.finalCanonicalAssetSpecificationComplete === false,
    `${member.animationId}: asset-definition candidates drifted`,
  );
  invariant(
    scripts.summary?.scriptCount === scripts.scripts?.length &&
      scripts.summary.scriptCount ===
        machineAudit.findings.exportedScriptFileCount &&
      scripts.summary.canonicalManifestScriptRecordsAdded === 0 &&
      scripts.summary.completeReachableScriptInventory === false &&
      scripts.scripts.every(
        (record) =>
          record.runtimeReachability === "unresolved" &&
          record.scenario === "unresolved" &&
          record.naturalTrace === "unresolved",
      ),
    `${member.animationId}: FFDec script candidates drifted or claim runtime reachability`,
  );
  invariant(
    stableJson(candidateExternalCalls) === stableJson(machineExternalCalls) &&
      dependencies.summary?.apiCandidateCount ===
        candidateExternalCalls.length &&
      dependencies.summary?.occurrenceCount ===
        candidateExternalCalls.reduce(
          (sum, {occurrences}) => sum + occurrences,
          0,
        ) &&
      dependencies.summary.runtimeDependencyClearance === false &&
      dependencies.summary.canonicalManifestDependencyRecordsAdded === 0 &&
      dependencies.summary.executedLegacyEndpointCount === 0 &&
      dependencies.candidates.every(
        ({runtimeReachability, securityDisposition}) =>
          runtimeReachability === "unresolved" &&
          securityDisposition === "pending-human-review",
      ),
    `${member.animationId}: dependency candidates drifted or claim runtime/security clearance`,
  );
  invariant(
    records.candidateBrief.contents
      .toString("utf8")
      .startsWith(
        `# ${member.animationId} Static Migration-Brief Prefill Candidate\n`,
      ) &&
      records.candidateBrief.contents
        .toString("utf8")
        .includes("Canonical `MIGRATION_BRIEF.md` is unchanged.") &&
      records.candidateBrief.contents
        .toString("utf8")
        .includes("all false/pending"),
    `${member.animationId}: migration-brief static candidate drifted`,
  );

  const outputMap = {
    manifestRuntimeFacts: "candidateRuntimeFacts",
    assetDefinitionCensus: "candidateAssetCensus",
    definitionInventory: "candidateDefinitionInventory",
    scriptInventory: "candidateScriptInventory",
    dependencyInventory: "candidateDependencyInventory",
    briefStaticPrefill: "candidateBrief",
  };
  for (const [receiptKey, recordKey] of Object.entries(outputMap)) {
    const output = receipt.outputs?.[receiptKey];
    const record = records[recordKey];
    invariant(
      output?.path === record.path &&
        output.bytes === record.bytes &&
        output.sha256 === record.sha256,
      `${member.animationId}: receipt output binding drifted for ${receiptKey}`,
    );
  }
  invariant(
    receipt.outputs.assetDefinitionCensus.definitionCount ===
      census.summary.definitionCount &&
      receipt.outputs.definitionInventory.rowCount ===
        definitionCsv.rows.length &&
      receipt.outputs.scriptInventory.scriptCount ===
        scripts.summary.scriptCount &&
      receipt.outputs.dependencyInventory.apiCandidateCount ===
        dependencies.summary.apiCandidateCount &&
      receipt.outputs.dependencyInventory.occurrenceCount ===
        dependencies.summary.occurrenceCount,
    `${member.animationId}: receipt candidate count bindings drifted`,
  );
  const canonicalMap = {
    migrationManifest: "migrationManifest",
    migrationBrief: "migrationBrief",
    assetInventory: "assetInventory",
    audioInventory: "audioInventory",
    keyframes: "keyframes",
    fullFrameCoverage: "fullFrameCoverage",
  };
  for (const [receiptKey, recordKey] of Object.entries(canonicalMap)) {
    const binding = receipt.canonicalFiles?.[receiptKey];
    const record = records[recordKey];
    const expected =
      staticReconciliation &&
      ["migrationManifest", "migrationBrief"].includes(receiptKey)
        ? historicalBefore(receiptKey, descriptor(record))
        : descriptor(record);
    invariant(
      binding?.path === expected.path &&
        binding.bytes === expected.bytes &&
        binding.sha256 === expected.sha256 &&
        binding.changedByMaterializer === false,
      `${member.animationId}: receipt canonical-file binding drifted for ${receiptKey}`,
    );
  }
  invariant(
    receipt.releaseMembership?.ordinal === member.ordinal &&
      receipt.source?.swf?.sha256 === member.source.sha256 &&
      receipt.candidateReadiness?.manifestRuntimeFactsMaterialized === true &&
      receipt.candidateReadiness?.staticAssetDefinitionCensusMaterialized ===
        true &&
      receipt.candidateReadiness?.machineDefinitionInventoryMaterialized ===
        true &&
      receipt.candidateReadiness?.ffdecScriptInventoryMaterialized === true &&
      receipt.candidateReadiness?.staticDependencyInventoryMaterialized ===
        true &&
      receipt.candidateReadiness?.migrationBriefStaticPrefillMaterialized ===
        true &&
      receipt.candidateReadiness?.canonicalManifestReconciled === false &&
      receipt.candidateReadiness?.canonicalAssetInventoryFinal === false &&
      receipt.candidateReadiness?.canonicalKeyframesFinal === false &&
      receipt.candidateReadiness?.canonicalCoverageFinal === false &&
      receipt.candidateReadiness?.reachableScenarioInventoryComplete ===
        false &&
      receipt.candidateReadiness?.frameDomainDispositionComplete === false &&
      receipt.candidateReadiness?.implementationSpecificationReady === false &&
      receipt.candidateReadiness?.implementationAuthorized === false &&
      receipt.unresolved?.rootReachableNestedDomains ===
        frameDomains.summary.nestedDefinitionCount &&
      receipt.unresolved?.nestedPlacementEntryStates ===
        frameDomains.summary.nestedDefinitionCount &&
      receipt.unresolved?.reachableScenarios === true &&
      receipt.unresolved?.naturalTraces === true &&
      receipt.unresolved?.keyframeBehaviorMap === true &&
      receipt.unresolved?.rendererSelection === true &&
      receipt.unresolved?.audioListeningLanguageAndSynchronization === true &&
      receipt.unresolved?.authoritativeBaseline === true &&
      receipt.unresolved?.humanDecisions === true &&
      receipt.runtimeSessionsExecuted === 0 &&
      receipt.guiApplicationsLaunched === 0 &&
      receipt.legacyEndpointsExecuted === 0 &&
      receipt.workspaceCanonicalFilesChanged === 0 &&
      receipt.sourceAssetsChanged === false,
    `${member.animationId}: candidate receipt promoted unresolved, runtime, human, implementation, or canonical state`,
  );

  return {
    materialized: true,
    fileCount: 7,
    definitionCount: census.summary.definitionCount,
    scriptCount: scripts.summary.scriptCount,
    dependencyApiCandidateCount: dependencies.summary.apiCandidateCount,
    dependencyOccurrenceCount: dependencies.summary.occurrenceCount,
    artifacts: Object.fromEntries(
      [
        "candidateRuntimeFacts",
        "candidateAssetCensus",
        "candidateDefinitionInventory",
        "candidateScriptInventory",
        "candidateDependencyInventory",
        "candidateBrief",
        "candidateReceipt",
      ].map((key) => [key, descriptor(records[key])]),
    ),
  };
}

export function deriveMemberReadiness({
  member,
  migration,
  assetRows,
  audioRows,
  keyframeRows,
  coverage,
  migrationBrief,
  machineAudit,
  frameDomains,
  runtimePlan,
  sourceScopeBinding,
  audioRuntimeEvidence,
  optionalSpecificationFiles,
  candidatePackage,
  staticReconciliation = null,
}) {
  const label = member.animationId;
  invariant(
    candidatePackage?.materialized === true &&
      candidatePackage.fileCount === 7 &&
      Number.isSafeInteger(candidatePackage.definitionCount) &&
      candidatePackage.definitionCount > 0 &&
      Number.isSafeInteger(candidatePackage.scriptCount) &&
      candidatePackage.scriptCount > 0 &&
      Number.isSafeInteger(candidatePackage.dependencyApiCandidateCount) &&
      candidatePackage.dependencyApiCandidateCount >= 0 &&
      Number.isSafeInteger(candidatePackage.dependencyOccurrenceCount) &&
      candidatePackage.dependencyOccurrenceCount >= 0,
    `${label}: complete acceptance-neutral candidate package is required`,
  );
  invariant(
    migration?.schemaVersion === 2 &&
      migration.id === label &&
      migration.animationId === label &&
      migration.assetId === member.assetId &&
      migration.status === "preserved" &&
      migration.source?.swfSha256 === member.source.sha256 &&
      migration.source?.swf?.endsWith(member.source.path) &&
      migration.implementation?.rendering === "undecided" &&
      migration.implementation?.route === "",
    `${label}: migration manifest identity or pre-implementation state drifted`,
  );
  invariant(
    machineAudit?.schemaVersion === 1 &&
      machineAudit.animationId === label &&
      machineAudit.auditStatus === "partial" &&
      machineAudit.source?.expectedSha256 === member.source.sha256 &&
      machineAudit.source?.hashMatches === true &&
      machineAudit.migrationStatusUnchanged === true &&
      machineAudit.findings?.runtimeCrossCheck?.allMatch === true &&
      machineAudit.findings?.actionScriptVersion === "AS1/2",
    `${label}: machine audit drifted or claims more than partial structural evidence`,
  );
  invariant(
    frameDomains?.schemaVersion === 1 &&
      frameDomains.animationId === label &&
      frameDomains.source?.sha256 === member.source.sha256 &&
      frameDomains.root?.timelineId === "root" &&
      frameDomains.root.frameCount === migration.runtime.frameCount &&
      frameDomains.summary?.completeRootReachableDomainInventory === false &&
      frameDomains.summary?.unresolvedReachabilityCount ===
        frameDomains.summary?.nestedDefinitionCount &&
      allFalse(frameDomains.acceptanceEffects, [
        "authoritativeOriginalRuntime",
        "completeFrameDomainDisposition",
        "audioAccepted",
        "humanVisualAccepted",
        "ownerAccepted",
        "strictComplete",
        "published",
      ]),
    `${label}: structural frame-domain evidence drifted or promoted reachability`,
  );
  invariant(
    runtimePlan?.schemaVersion === 2 &&
      runtimePlan.identity?.releaseId === RELEASE_ID &&
      runtimePlan.identity?.ordinal === member.ordinal &&
      runtimePlan.identity?.animationId === label &&
      runtimePlan.identity?.assetId === member.assetId &&
      runtimePlan.executionGate?.runnable === false &&
      runtimePlan.emptyRuntimeAcquisitionWorksheet?.state ===
        "empty-non-runnable-planning-only" &&
      runtimePlan.emptyRuntimeAcquisitionWorksheet.runtimeReceipts.length === 0 &&
      runtimePlan.coverageV2Planning?.authoritativeBaselineCount === 0 &&
      runtimePlan.coverageV2Planning?.candidateCaptureCount === 0 &&
      runtimePlan.acceptanceEffects?.currentJavaScriptCandidate === false &&
      runtimePlan.acceptanceEffects?.strictComplete === false &&
      runtimePlan.acceptanceEffects?.published === false,
    `${label}: runtime plan drifted or contains runtime/acceptance evidence`,
  );
  invariant(
    sourceScopeBinding?.schemaVersion === 1 &&
      sourceScopeBinding.releaseId === RELEASE_ID &&
      sourceScopeBinding.member?.ordinal === member.ordinal &&
      sourceScopeBinding.member?.animationId === label &&
      sourceScopeBinding.member?.assetId === member.assetId &&
      sourceScopeBinding.member?.source?.swf?.sha256 === member.source.sha256 &&
      sourceScopeBinding.acceptanceEffects?.currentJavaScriptCandidate === false &&
      sourceScopeBinding.acceptanceEffects?.strictComplete === false &&
      sourceScopeBinding.acceptanceEffects?.published === false,
    `${label}: source-scope binding drifted`,
  );
  invariant(
    audioRuntimeEvidence?.schemaVersion === 2 &&
      audioRuntimeEvidence.animationId === label &&
      audioRuntimeEvidence.source?.expectedSha256 === member.source.sha256 &&
      audioRuntimeEvidence.source?.hashMatches === true &&
      audioRuntimeEvidence.acceptance?.structurallyAudited === true &&
      audioRuntimeEvidence.acceptance?.authoritativeListeningComplete === false &&
      audioRuntimeEvidence.acceptance?.strictAudioAcceptance === "pending" &&
      audioRuntimeEvidence.acceptance?.releaseBoundary
        ?.authoritativeOriginalRuntimeListeningComplete === false &&
      audioRuntimeEvidence.acceptance?.releaseBoundary?.strictMigrationComplete ===
        false &&
      audioRuntimeEvidence.acceptance?.releaseBoundary?.publicationAuthorized ===
        false,
    `${label}: audio structural evidence drifted or claims listening acceptance`,
  );
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === label &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length > 0,
    `${label}: coverage-v2 document is malformed`,
  );
  const rootFrameCount = migration.runtime.frameCount;
  const coverageRequiredFrameCount = coverage.requirements.reduce(
    (sum, requirement) => {
      invariant(
        requirement.frameDomainId === "root" &&
          requirement.requiredRange?.firstFrame === 1 &&
          requirement.requiredRange?.lastFrame === rootFrameCount &&
          requirement.baselineAuthority === "unresolved" &&
          requirement.status === "pending" &&
          requirement.capturedFrameCount === 0 &&
          Array.isArray(requirement.missingFrames) &&
          requirement.missingFrames.length === rootFrameCount,
        `${label}: current coverage is not the expected root-only pending scaffold`,
      );
      return sum + rootFrameCount;
    },
    0,
  );
  const coverageLanguages = [
    ...new Set(coverage.requirements.map(({language}) => language)),
  ].sort();
  invariant(
    stableJson(coverageLanguages) === stableJson(["en", "es"]),
    `${label}: expected bilingual provisional root coverage`,
  );

  const tagCounts = machineAudit.findings.swfmill?.tagCounts ?? {};
  const externalCalls = Array.isArray(machineAudit.findings.externalCallCandidates)
    ? machineAudit.findings.externalCallCandidates.map(({api, occurrences}) => ({
      api,
      occurrences,
    }))
    : [];
  const sourceModel =
    machineAudit.authoringSource?.pairedFlaStatus === "present"
      ? "paired-fla-and-shipped-swf"
      : "shipped-swf-only";
  const assetDefinitionCandidateCount = sumTagCounts(
    tagCounts,
    ASSET_DEFINITION_TAGS,
  );
  const manifestRuntimeFactsReconciled =
    migration.runtime.actionScriptVersion ===
      machineAudit.findings.actionScriptVersion &&
    migration.runtime.backgroundColor === machineAudit.findings.backgroundColor &&
    migration.runtime.complexity !== "unknown" &&
    migration.toolVersions.ffdec !== "unavailable" &&
    migration.toolVersions.swfmill !== "unavailable";
  const manifestStaticFactsReconciled =
    migration.runtime.actionScriptVersion ===
      machineAudit.findings.actionScriptVersion &&
    migration.runtime.backgroundColor === machineAudit.findings.backgroundColor &&
    migration.toolVersions.ffdec !== "unavailable" &&
    migration.toolVersions.swfmill !== "unavailable";
  const assetSpecificationReady =
    assetRows.length > 0 ||
    (migration.audit.assetsRequired === false &&
      migration.audit.assetsNotRequiredReason.length > 0);
  const audioSpecificationReady =
    audioRuntimeEvidence.acceptance.strictAudioAcceptance !== "pending";
  const keyframeSpecificationReady = keyframeRows.length > 0;
  const coverageSpecificationReady = coverage.requirements.every(
    ({status, baselineAuthority, missingFrames}) =>
      status !== "pending" &&
      baselineAuthority !== "unresolved" &&
      Array.isArray(missingFrames) &&
      missingFrames.length === 0,
  );
  const briefCompleted =
    !briefIsTemplate(migrationBrief) &&
    migration.implementation.rendering !== "undecided";
  const scenarioSpecified =
    migration.scenarios.length > 0 &&
    migration.scenarios.every(
      ({description}) => typeof description === "string" && description.length > 0,
    ) &&
    optionalSpecificationFiles.scenarioInventory.present;
  const scriptDependencySpecificationReady =
    migration.runtime.scripts.length > 0 &&
      optionalSpecificationFiles.scriptInventory.present &&
      optionalSpecificationFiles.dependencyInventory.present &&
      staticReconciliation === null;
  const frameDomainSpecificationReady =
    optionalSpecificationFiles.frameDomainDisposition.present &&
    frameDomains.summary.completeRootReachableDomainInventory === true;
  const machineAuditComplete = machineAudit.auditStatus === "complete";

  const specificationAreas = {
    migrationManifest: {
      state:
        "hash-bound-runtime-facts-candidate-materialized-canonical-reconciliation-pending",
      identityAndSourceBound: true,
      nativeRootMetadataCrossChecked: true,
      actionScriptManifestValue: migration.runtime.actionScriptVersion,
      actionScriptMachineValue: machineAudit.findings.actionScriptVersion,
      backgroundManifestValue: migration.runtime.backgroundColor,
      backgroundMachineValue: machineAudit.findings.backgroundColor,
      complexity: migration.runtime.complexity,
      candidateArtifact:
        candidatePackage.artifacts.candidateRuntimeFacts,
      candidateMaterialized: true,
      staticReconciliationApplied: staticReconciliation !== null,
      manifestStaticFactsReconciled,
      manifestRuntimeFactsReconciled,
    },
    assetInventory: {
      state: assetSpecificationReady
        ? "specified"
        : "canonical-empty-machine-definition-candidates-materialized",
      rowCount: assetRows.length,
      machineAssetDefinitionCandidateCount: assetDefinitionCandidateCount,
      materializedDefinitionCandidateCount:
        candidatePackage.definitionCount,
      censusCandidateArtifact:
        candidatePackage.artifacts.candidateAssetCensus,
      definitionInventoryCandidateArtifact:
        candidatePackage.artifacts.candidateDefinitionInventory,
      candidateMaterialized: true,
      explicitNoAssetsDecision:
        migration.audit.assetsRequired === false &&
        migration.audit.assetsNotRequiredReason.length > 0,
      specificationReady: assetSpecificationReady,
    },
    audioInventory: {
      state: audioRows.length > 0
        ? "structural-candidates-present-original-runtime-listening-required"
        : "empty-original-runtime-not-required-or-missing-disposition-required",
      rowCount: audioRows.length,
      structurallyAudited: true,
      authoritativeListeningComplete: false,
      humanListeningDecisionPending: true,
      specificationReady: audioSpecificationReady,
    },
    keyframes: {
      state: keyframeRows.length > 0
        ? "candidate-rows-present-human-runtime-validation-required"
        : "empty-original-runtime-and-human-behavior-map-required",
      rowCount: keyframeRows.length,
      specificationReady: keyframeSpecificationReady,
    },
    fullFrameCoverage: {
      state: "provisional-root-only-bilingual-all-pending",
      requirementCount: coverage.requirements.length,
      rootOnlyRequirementCount: coverage.requirements.filter(
        ({frameDomainId}) => frameDomainId === "root",
      ).length,
      requiredFrameCount: coverageRequiredFrameCount,
      missingFrameCount: coverage.requirements.reduce(
        (sum, {missingFrames}) => sum + missingFrames.length,
        0,
      ),
      languages: coverageLanguages,
      specificationReady: coverageSpecificationReady,
    },
    migrationBrief: {
      state: briefCompleted
        ? "substantively-completed"
        : staticReconciliation
          ? "canonical-static-reconciled-renderer-and-human-decisions-required"
          : "canonical-template-static-prefill-candidate-materialized-human-decisions-required",
      templateDetected: briefIsTemplate(migrationBrief),
      staticReconciliationApplied: staticReconciliation !== null,
      rendererSelected: migration.implementation.rendering !== "undecided",
      staticPrefillCandidateArtifact:
        candidatePackage.artifacts.candidateBrief,
      staticPrefillCandidateMaterialized: true,
      specificationReady: briefCompleted,
    },
    machineAudit: {
      state: "partial-structural-audit-root-metadata-cross-check-passed",
      auditStatus: machineAudit.auditStatus,
      runtimeCrossCheckPassed: true,
      exportedScriptFileCount: machineAudit.findings.exportedScriptFileCount,
      externalCallCandidates: externalCalls,
      specificationReady: machineAuditComplete,
    },
    frameDomains: {
      state: "structural-candidates-present-reachability-and-entry-state-unresolved",
      rootFrameCount: frameDomains.root.frameCount,
      nestedDefinitionCount: frameDomains.summary.nestedDefinitionCount,
      nestedLongerThanRootCount:
        frameDomains.summary.nestedLongerThanRootCount,
      unresolvedReachabilityCount:
        frameDomains.summary.unresolvedReachabilityCount,
      dispositionArtifact: optionalSpecificationFiles.frameDomainDisposition,
      specificationReady: frameDomainSpecificationReady,
    },
    scenarios: {
      state: "default-placeholder-only-natural-traces-unresolved",
      manifestScenarioCount: migration.scenarios.length,
      describedScenarioCount: migration.scenarios.filter(
        ({description}) => description.length > 0,
      ).length,
      inventoryArtifact: optionalSpecificationFiles.scenarioInventory,
      specificationReady: scenarioSpecified,
    },
    scriptsAndDependencies: {
      state: externalCalls.length > 0
        ? staticReconciliation
          ? "canonical-static-script-and-dependency-inventories-runtime-security-disposition-required"
          : "hash-bound-script-and-static-dependency-candidates-materialized-runtime-disposition-required"
        : staticReconciliation
          ? "canonical-static-script-and-dependency-inventories-no-runtime-clearance"
          : "hash-bound-script-and-empty-static-dependency-candidates-materialized-no-runtime-clearance",
      exportedScriptFileCount: machineAudit.findings.exportedScriptFileCount,
      materializedScriptCandidateCount: candidatePackage.scriptCount,
      manifestScriptCount: migration.runtime.scripts.length,
      manifestDependencyCount: migration.runtime.externalDependencies.length,
      externalCallCandidates: externalCalls,
      materializedDependencyApiCandidateCount:
        candidatePackage.dependencyApiCandidateCount,
      materializedDependencyOccurrenceCount:
        candidatePackage.dependencyOccurrenceCount,
      scriptCandidateArtifact:
        candidatePackage.artifacts.candidateScriptInventory,
      dependencyCandidateArtifact:
        candidatePackage.artifacts.candidateDependencyInventory,
      candidatesMaterialized: true,
      staticReconciliationApplied: staticReconciliation !== null,
      runtimeReachabilityResolved: false,
      scriptInventoryArtifact: optionalSpecificationFiles.scriptInventory,
      dependencyInventoryArtifact:
        optionalSpecificationFiles.dependencyInventory,
      specificationReady: scriptDependencySpecificationReady,
    },
  };

  const automaticallyAdvanceableTasks = [
    "machine-sync-manifest-runtime-facts",
    ...(assetDefinitionCandidateCount > 0
      ? ["machine-materialize-asset-candidates"]
      : []),
    "machine-materialize-script-candidates",
    "machine-materialize-static-dependency-candidates",
    "machine-prefill-brief-static-sections",
  ];
  const materializedAutomaticallyAdvanceableTasks = [
    ...automaticallyAdvanceableTasks,
  ];
  const remainingAutomaticallyAdvanceableTasks = [];
  const requiresOriginalRuntimeOrHumanTasks = [
    ...(sourceModel === "paired-fla-and-shipped-swf"
      ? ["human-read-only-authoring-audit"]
      : ["human-swf-only-source-gap-disposition"]),
    "original-runtime-reachable-scenarios-and-natural-traces",
    "original-runtime-frame-domain-reachability-and-entry-state",
    "original-runtime-keyframes-and-behavior-map",
    "original-runtime-audio-listening-language-and-sync",
    "human-renderer-accessibility-and-localization-decision",
    ...(externalCalls.length > 0
      ? ["human-external-call-security-disposition"]
      : []),
    "authoritative-baseline-requirement-plan",
  ];
  const implementationSpecificationReady = Object.values(specificationAreas)
    .every(({specificationReady}) => specificationReady === true);

  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    sourceModel,
    structuralFacts: {
      stage: migration.runtime.stage,
      fps: migration.runtime.fps,
      rootFrameCount,
      durationMs: migration.runtime.durationMs,
      actionScriptGeneration: machineAudit.findings.actionScriptVersion,
      machineAssetDefinitionCandidateCount: assetDefinitionCandidateCount,
      exportedScriptFileCount: machineAudit.findings.exportedScriptFileCount,
      externalCallCandidateApiCount: externalCalls.length,
      externalCallCandidateOccurrenceCount: externalCalls.reduce(
        (sum, {occurrences}) => sum + occurrences,
        0,
      ),
      structuralAudioInventoryRowCount: audioRows.length,
    },
    specificationAreas,
    routing: {
      automaticallyAdvanceableTasks,
      materializedAutomaticallyAdvanceableTasks,
      remainingAutomaticallyAdvanceableTasks,
      requiresOriginalRuntimeOrHumanTasks,
      safeMachineCandidateWorkAvailable:
        remainingAutomaticallyAdvanceableTasks.length > 0,
      safeMachineCandidateWorkMaterialized:
        materializedAutomaticallyAdvanceableTasks.length > 0,
      originalRuntimeOrHumanDecisionRequired:
        requiresOriginalRuntimeOrHumanTasks.length > 0,
    },
    preRuntimeCandidatePackage: candidatePackage,
    staticReconciliation: staticReconciliation
      ? {
          applied: true,
          machineOnlyStatic: true,
          receipt: staticReconciliation.binding,
          postOutputs: staticReconciliation.postOutputs,
        }
      : {
          applied: false,
          machineOnlyStatic: false,
          receipt: null,
          postOutputs: null,
        },
    implementationSpecificationReady,
    implementationAuthorizedByThisReport: false,
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      currentJavaScriptCandidate: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

function summarize(items) {
  const count = (predicate) => items.filter(predicate).length;
  const sum = (selector) =>
    items.reduce((total, item) => total + selector(item), 0);
  const area = (item, name) => item.specificationAreas[name];
  return {
    memberCount: items.length,
    activePageCount: count(
      ({releaseRole}) => releaseRole === "active-xml-referenced-page",
    ),
    shellCount: count(({releaseRole}) => releaseRole === "course-shell"),
    pairedFlaSwfCount: count(
      ({sourceModel}) => sourceModel === "paired-fla-and-shipped-swf",
    ),
    swfOnlyCount: count(
      ({sourceModel}) => sourceModel === "shipped-swf-only",
    ),
    draftValidWorkspaceCount: items.length,
    implementationStartedCount: 0,
    implementationSpecificationReadyCount: count(
      ({implementationSpecificationReady}) => implementationSpecificationReady,
    ),
    staticReconciliationCount: count(
      ({staticReconciliation}) => staticReconciliation.applied,
    ),
    safeMachineCandidateWorkAvailableCount: count(
      ({routing}) => routing.safeMachineCandidateWorkAvailable,
    ),
    safeMachineCandidateWorkMaterializedCount: count(
      ({routing}) => routing.safeMachineCandidateWorkMaterialized,
    ),
    automaticallyAdvanceableTaskCount: sum(
      ({routing}) => routing.automaticallyAdvanceableTasks.length,
    ),
    materializedAutomaticallyAdvanceableTaskCount: sum(
      ({routing}) => routing.materializedAutomaticallyAdvanceableTasks.length,
    ),
    remainingAutomaticallyAdvanceableTaskCount: sum(
      ({routing}) => routing.remainingAutomaticallyAdvanceableTasks.length,
    ),
    originalRuntimeOrHumanDecisionRequiredCount: count(
      ({routing}) => routing.originalRuntimeOrHumanDecisionRequired,
    ),
    preRuntimeCandidatePackageMaterializedCount: count(
      ({preRuntimeCandidatePackage}) =>
        preRuntimeCandidatePackage.materialized,
    ),
    preRuntimeCandidateFileCount: sum(
      ({preRuntimeCandidatePackage}) =>
        preRuntimeCandidatePackage.fileCount,
    ),
    manifestRuntimeFactsCandidateCount: count(
      ({preRuntimeCandidatePackage}) =>
        Boolean(
          preRuntimeCandidatePackage.artifacts.candidateRuntimeFacts,
        ),
    ),
    assetDefinitionCensusCandidateCount: count(
      ({preRuntimeCandidatePackage}) =>
        Boolean(
          preRuntimeCandidatePackage.artifacts.candidateAssetCensus,
        ),
    ),
    definitionInventoryCandidateCount: count(
      ({preRuntimeCandidatePackage}) =>
        Boolean(
          preRuntimeCandidatePackage.artifacts
            .candidateDefinitionInventory,
        ),
    ),
    scriptInventoryCandidateCount: count(
      ({preRuntimeCandidatePackage}) =>
        Boolean(
          preRuntimeCandidatePackage.artifacts.candidateScriptInventory,
        ),
    ),
    dependencyInventoryCandidateCount: count(
      ({preRuntimeCandidatePackage}) =>
        Boolean(
          preRuntimeCandidatePackage.artifacts
            .candidateDependencyInventory,
        ),
    ),
    migrationBriefStaticPrefillCandidateCount: count(
      ({preRuntimeCandidatePackage}) =>
        Boolean(preRuntimeCandidatePackage.artifacts.candidateBrief),
    ),
    preRuntimeCandidateReceiptCount: count(
      ({preRuntimeCandidatePackage}) =>
        Boolean(preRuntimeCandidatePackage.artifacts.candidateReceipt),
    ),
    materializedDefinitionCandidateCount: sum(
      ({preRuntimeCandidatePackage}) =>
        preRuntimeCandidatePackage.definitionCount,
    ),
    materializedScriptCandidateCount: sum(
      ({preRuntimeCandidatePackage}) =>
        preRuntimeCandidatePackage.scriptCount,
    ),
    materializedDependencyApiCandidateCount: sum(
      ({preRuntimeCandidatePackage}) =>
        preRuntimeCandidatePackage.dependencyApiCandidateCount,
    ),
    materializedDependencyOccurrenceCount: sum(
      ({preRuntimeCandidatePackage}) =>
        preRuntimeCandidatePackage.dependencyOccurrenceCount,
    ),
    nativeRootMetadataMachineVerifiedCount: count(
      (item) =>
        area(item, "migrationManifest").nativeRootMetadataCrossChecked === true,
    ),
    manifestRuntimeFactsReconciledCount: count(
      (item) => area(item, "migrationManifest").manifestRuntimeFactsReconciled,
    ),
    manifestStaticFactsReconciledCount: count(
      (item) => area(item, "migrationManifest").manifestStaticFactsReconciled,
    ),
    complexityUnknownCount: count(
      (item) => area(item, "migrationManifest").complexity === "unknown",
    ),
    rootFrameCount: sum(({structuralFacts}) => structuralFacts.rootFrameCount),
    assetInventoryPopulatedCount: count(
      (item) => area(item, "assetInventory").rowCount > 0,
    ),
    assetInventoryRowCount: sum(
      (item) => area(item, "assetInventory").rowCount,
    ),
    machineAssetDefinitionCandidateCount: sum(
      (item) =>
        area(item, "assetInventory").machineAssetDefinitionCandidateCount,
    ),
    audioInventoryPopulatedCount: count(
      (item) => area(item, "audioInventory").rowCount > 0,
    ),
    audioInventoryEmptyCount: count(
      (item) => area(item, "audioInventory").rowCount === 0,
    ),
    structuralAudioInventoryRowCount: sum(
      (item) => area(item, "audioInventory").rowCount,
    ),
    audioSpecificationReadyCount: count(
      (item) => area(item, "audioInventory").specificationReady,
    ),
    audioHumanDecisionPendingCount: count(
      (item) => area(item, "audioInventory").humanListeningDecisionPending,
    ),
    keyframeInventoryPopulatedCount: count(
      (item) => area(item, "keyframes").rowCount > 0,
    ),
    keyframeRowCount: sum((item) => area(item, "keyframes").rowCount),
    coverageRequirementCount: sum(
      (item) => area(item, "fullFrameCoverage").requirementCount,
    ),
    coverageRootOnlyRequirementCount: sum(
      (item) => area(item, "fullFrameCoverage").rootOnlyRequirementCount,
    ),
    coverageRequiredFrameCount: sum(
      (item) => area(item, "fullFrameCoverage").requiredFrameCount,
    ),
    coverageMissingFrameCount: sum(
      (item) => area(item, "fullFrameCoverage").missingFrameCount,
    ),
    migrationBriefTemplateCount: count(
      (item) => area(item, "migrationBrief").templateDetected,
    ),
    migrationBriefSubstantivelyCompletedCount: count(
      (item) => area(item, "migrationBrief").specificationReady,
    ),
    rendererUnselectedCount: count(
      (item) => area(item, "migrationBrief").rendererSelected === false,
    ),
    machineAuditPresentCount: items.length,
    machineAuditPartialCount: count(
      (item) => area(item, "machineAudit").auditStatus === "partial",
    ),
    machineAuditCompleteCount: count(
      (item) => area(item, "machineAudit").specificationReady,
    ),
    frameDomainCandidateArtifactCount: items.length,
    frameDomainDispositionPresentCount: count(
      (item) => area(item, "frameDomains").dispositionArtifact.present,
    ),
    completeFrameDomainDispositionCount: count(
      (item) => area(item, "frameDomains").specificationReady,
    ),
    nestedDefinitionCount: sum(
      (item) => area(item, "frameDomains").nestedDefinitionCount,
    ),
    nestedLongerThanRootCount: sum(
      (item) => area(item, "frameDomains").nestedLongerThanRootCount,
    ),
    unresolvedNestedReachabilityCount: sum(
      (item) => area(item, "frameDomains").unresolvedReachabilityCount,
    ),
    defaultScenarioPlaceholderOnlyCount: count(
      (item) =>
        area(item, "scenarios").state ===
        "default-placeholder-only-natural-traces-unresolved",
    ),
    scenarioInventoryPresentCount: count(
      (item) => area(item, "scenarios").inventoryArtifact.present,
    ),
    scriptExtractionPresentCount: items.length,
    exportedScriptFileCount: sum(
      (item) => area(item, "scriptsAndDependencies").exportedScriptFileCount,
    ),
    manifestScriptReconciledCount: count(
      (item) =>
        area(item, "scriptsAndDependencies").manifestScriptCount > 0 &&
        area(item, "scriptsAndDependencies").scriptInventoryArtifact.present,
    ),
    dependencyInventoryPresentCount: count(
      (item) =>
        area(item, "scriptsAndDependencies").dependencyInventoryArtifact.present,
    ),
    canonicalStaticScriptInventoryCount: count(
      (item) =>
        item.staticReconciliation.applied &&
        area(item, "scriptsAndDependencies").scriptInventoryArtifact.present,
    ),
    canonicalStaticDependencyInventoryCount: count(
      (item) =>
        item.staticReconciliation.applied &&
        area(item, "scriptsAndDependencies").dependencyInventoryArtifact.present,
    ),
    runtimeReachabilityUnresolvedCount: count(
      (item) =>
        area(item, "scriptsAndDependencies").runtimeReachabilityResolved ===
        false,
    ),
    externalCallCandidateMemberCount: count(
      (item) =>
        area(item, "scriptsAndDependencies").externalCallCandidates.length > 0,
    ),
    externalCallCandidateApiCount: sum(
      (item) =>
        area(item, "scriptsAndDependencies").externalCallCandidates.length,
    ),
    externalCallCandidateOccurrenceCount: sum((item) =>
      area(item, "scriptsAndDependencies").externalCallCandidates.reduce(
        (subtotal, {occurrences}) => subtotal + occurrences,
        0,
      )),
    authoritativeRuntimeSessionCount: 0,
    authoritativeBaselineCount: 0,
    implementationAuthorizedCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
  };
}

async function buildMember(
  projectRoot,
  member,
  candidateGenerator,
  candidateParser,
  releaseManifestBinding,
  reconciliationMode,
) {
  const workspace = `migrations/${member.animationId}`;
  const records = Object.fromEntries(
    await Promise.all(
      Object.entries(WORKSPACE_FILES).map(async ([key, suffix]) => [
        key,
        suffix.endsWith(".json")
          ? await readJsonRecord(
            projectRoot,
            `${workspace}/${suffix}`,
            `${member.animationId} ${key}`,
          )
          : await readFileRecord(
            projectRoot,
            `${workspace}/${suffix}`,
            `${member.animationId} ${key}`,
          ),
      ]),
    ),
  );
  const optionalSpecificationFiles = Object.fromEntries(
    await Promise.all(
      Object.entries(OPTIONAL_SPECIFICATION_FILES).map(async ([key, suffix]) => [
        key,
        await optionalFileState(
          projectRoot,
          `${workspace}/${suffix}`,
          `${member.animationId} ${key}`,
        ),
      ]),
    ),
  );
  let staticReconciliation = null;
  if (reconciliationMode === "post-adoption") {
    const {
      readG5L5M1StaticReconciliationReceipt,
    } = await import("./adopt-g5-l5-m1-static-specification.mjs");
    staticReconciliation =
      await readG5L5M1StaticReconciliationReceipt({
        root: projectRoot,
        animationId: member.animationId,
        member,
      });
    const receipt = staticReconciliation.receipt;
    for (const [inputKey, recordKey] of [
      ["canonicalAssetInventory", "assetInventory"],
      ["canonicalAudioInventory", "audioInventory"],
      ["canonicalKeyframes", "keyframes"],
      ["canonicalCoverage", "fullFrameCoverage"],
    ]) {
      const expected = receipt.inputs?.[inputKey];
      const current = descriptor(records[recordKey]);
      invariant(
        expected?.path === current.path &&
          expected.bytes === current.bytes &&
          expected.sha256 === current.sha256,
        `${member.animationId}: protected canonical ${recordKey} changed after static reconciliation`,
      );
    }
  }
  const assetCsv = parseCsv(
    records.assetInventory.contents.toString("utf8"),
    ASSET_HEADERS,
    `${member.animationId} asset inventory`,
  );
  const audioCsv = parseCsv(
    records.audioInventory.contents.toString("utf8"),
    AUDIO_HEADERS,
    `${member.animationId} audio inventory`,
  );
  const keyframeCsv = parseCsv(
    records.keyframes.contents.toString("utf8"),
    KEYFRAME_HEADERS,
    `${member.animationId} keyframes`,
  );
  const candidatePackage = validateCandidatePackage({
    member,
    migration: records.migrationManifest.document,
    machineAudit: records.machineAudit.document,
    frameDomains: records.frameDomainCandidates.document,
    records,
    candidateGenerator: staticReconciliation
      ? {
          bytes:
            records.candidateReceipt.document.generatedBy.bytes,
          sha256:
            records.candidateReceipt.document.generatedBy.sha256,
        }
      : candidateGenerator,
    candidateParser: staticReconciliation
      ? {
          bytes:
            records.candidateReceipt.document.generatedBy.dependencies
              .swfDefinitionParser.bytes,
          sha256:
            records.candidateReceipt.document.generatedBy.dependencies
              .swfDefinitionParser.sha256,
        }
      : candidateParser,
    releaseManifestBinding,
    staticReconciliation,
  });
  const readiness = deriveMemberReadiness({
    member,
    migration: records.migrationManifest.document,
    assetRows: assetCsv.rows,
    audioRows: audioCsv.rows,
    keyframeRows: keyframeCsv.rows,
    coverage: records.fullFrameCoverage.document,
    migrationBrief: records.migrationBrief.contents.toString("utf8"),
    machineAudit: records.machineAudit.document,
    frameDomains: records.frameDomainCandidates.document,
    runtimePlan: records.runtimePlan.document,
    sourceScopeBinding: records.sourceScopeBinding.document,
    audioRuntimeEvidence: records.audioRuntimeEvidence.document,
    optionalSpecificationFiles,
    candidatePackage,
    staticReconciliation,
  });
  const boundFiles = Object.fromEntries(
    Object.entries(records).map(([key, record]) => [key, descriptor(record)]),
  );
  return {
    ...readiness,
    workspace: {
      path: workspace,
      files: boundFiles,
      optionalSpecificationFiles,
      staticReconciliationReceipt: staticReconciliation?.binding ?? null,
      inputSetSha256: sha256(stableJson({
        files: boundFiles,
        optionalSpecificationFiles,
        staticReconciliationReceipt: staticReconciliation?.binding ?? null,
      })),
    },
  };
}

export async function buildReport({projectRoot = defaultProjectRoot} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const [
    releaseManifest,
    sourceScope,
    workspaceReadiness,
    runtimePlanning,
    generator,
    candidateGenerator,
    candidateParser,
  ] =
    await Promise.all([
      readJsonRecord(resolvedRoot, CORE_INPUTS.releaseManifest, "release manifest"),
      readJsonRecord(resolvedRoot, CORE_INPUTS.sourceScope, "source-scope report"),
      readJsonRecord(
        resolvedRoot,
        CORE_INPUTS.workspaceReadiness,
        "workspace-readiness report",
      ),
      readJsonRecord(
        resolvedRoot,
        CORE_INPUTS.runtimePlanning,
        "runtime-planning report",
      ),
      readFileRecord(resolvedRoot, GENERATOR_PATH, "specification-readiness generator"),
      readFileRecord(
        resolvedRoot,
        CANDIDATE_GENERATOR_PATH,
        "pre-runtime candidate materializer",
      ),
      readFileRecord(
        resolvedRoot,
        CANDIDATE_PARSER_PATH,
        "SWF definition candidate parser",
      ),
    ]);
  const release = selectRelease(releaseManifest.document);
  validateReleaseReports(
    release,
    sourceScope.document,
    workspaceReadiness.document,
    runtimePlanning.document,
  );
  const staticReceiptStates = await Promise.all(
    release.members.map((member) =>
      optionalFileState(
        resolvedRoot,
        `migrations/${member.animationId}/audit/machine/${STATIC_RECONCILIATION_RECEIPT_NAME}`,
        `${member.animationId} static reconciliation receipt`,
      )),
  );
  const reconciliationMode =
    classifyStaticReconciliationState(staticReceiptStates);
  const members = await Promise.all(
    release.members.map((member) =>
      buildMember(
        resolvedRoot,
        member,
        descriptor(candidateGenerator),
        descriptor(candidateParser),
        descriptor(releaseManifest),
        reconciliationMode,
      )),
  );
  const summary = summarize(members);
  invariant(
    summary.memberCount === 57 &&
      summary.preRuntimeCandidatePackageMaterializedCount === 57 &&
      summary.preRuntimeCandidateFileCount === 399 &&
      summary.materializedDefinitionCandidateCount === 9767 &&
      summary.materializedScriptCandidateCount === 2456 &&
      summary.materializedDependencyApiCandidateCount === 6 &&
      summary.materializedDependencyOccurrenceCount === 17 &&
      summary.staticReconciliationCount ===
        (reconciliationMode === "post-adoption" ? 57 : 0) &&
      summary.manifestStaticFactsReconciledCount ===
        (reconciliationMode === "post-adoption" ? 57 : 0) &&
      summary.complexityUnknownCount === 57 &&
      summary.rendererUnselectedCount === 57 &&
      summary.runtimeReachabilityUnresolvedCount === 57 &&
      summary.audioHumanDecisionPendingCount === 57 &&
      summary.canonicalStaticScriptInventoryCount ===
        (reconciliationMode === "post-adoption" ? 57 : 0) &&
      summary.canonicalStaticDependencyInventoryCount ===
        (reconciliationMode === "post-adoption" ? 57 : 0) &&
      summary.safeMachineCandidateWorkAvailableCount === 0 &&
      summary.safeMachineCandidateWorkMaterializedCount === 57 &&
      summary.remainingAutomaticallyAdvanceableTaskCount === 0 &&
      summary.implementationStartedCount === 0 &&
      summary.implementationSpecificationReadyCount === 0 &&
      summary.authoritativeRuntimeSessionCount === 0 &&
      summary.strictCompleteCount === 0 &&
      summary.publishedCount === 0,
    "G5 L5 specification report crossed an implementation or acceptance boundary",
  );
  const coreBindings = {
    releaseManifest: descriptor(releaseManifest),
    sourceScope: descriptor(sourceScope),
    workspaceReadiness: descriptor(workspaceReadiness),
    runtimePlanning: descriptor(runtimePlanning),
    candidateMaterializer: descriptor(candidateGenerator),
    candidateParser: descriptor(candidateParser),
  };
  const report = {
    schemaVersion: 1,
    reportType: "g5-l5-pre-implementation-specification-readiness",
    reconciliationMode,
    releaseId: RELEASE_ID,
    title: TITLE,
    scope:
      reconciliationMode === "post-adoption"
        ? "Read-only audit of the 57 canonical G5 L5 workspaces after machine-only M1 static reconciliation, with historical pre-adoption candidate lineage preserved"
        : "Read-only audit of the 57 canonical G5 L5 workspaces and their hash-bound, acceptance-neutral pre-runtime candidate packages against the flash-to-js pre-renderer specification contract",
    authority:
      reconciliationMode === "post-adoption"
        ? "Machine-only M1 static reconciliation verification. Canonical static facts and script/dependency inventories create no complexity, reachability, behavior, scenario, frame-domain, runtime, audio-listening, renderer, implementation, review, acceptance, strict-completion, or publication authority."
        : "Machine classification and candidate-materialization verification only. The candidates create no canonical reconciliation, scenario inventory, frame-domain disposition, runtime trace, baseline, renderer implementation, review, acceptance, strict-completion, or publication authority.",
    generator: {
      ...descriptor(generator),
      version: 1,
    },
    inputs: {
      ...coreBindings,
      coreInputSetSha256: sha256(stableJson(coreBindings)),
      workspaceInputSetSha256: sha256(stableJson(
        members.map(({ordinal, animationId, workspace}) => ({
          ordinal,
          animationId,
          workspaceInputSetSha256: workspace.inputSetSha256,
        })),
      )),
    },
    release: {
      expectedMemberCount: release.expectedCounts.members,
      activePageCount: release.expectedCounts.activeXmlReferencedPages,
      shellCount: release.expectedCounts.courseShells,
      publicationMode: release.publicationMode,
      orderedMemberIdentitySha256: sha256(stableJson(
        release.members.map(
          ({ordinal, animationId, assetId, releaseRole, shardId}) => ({
            ordinal,
            animationId,
            assetId,
            releaseRole,
            shardId,
          }),
        ),
      )),
    },
    taskDefinitions: {
      automaticallyAdvanceableCandidateWork: AUTOMATIC_TASK_DEFINITIONS,
      requiresOriginalRuntimeOrHumanDecision: RUNTIME_HUMAN_TASK_DEFINITIONS,
    },
    summary,
    members,
    failClosedConclusions:
      reconciliationMode === "post-adoption"
        ? [
            "All 57 workspaces have machine-only M1 static reconciliation receipts and canonical static script/dependency inventories, but implementation-specification readiness remains 0/57.",
            "Complexity remains unknown, renderer and routes remain unselected, scenarios and natural traces remain unresolved, canonical keyframes remain empty, coverage remains root-only and pending, and runtime reachability remains unresolved.",
            "Audio structural rows and fail-closed required flags do not establish language, cue reachability, synchronization, listening acceptance, or not-required disposition.",
            "The seven-file candidate packages remain immutable historical pre-adoption evidence bound through each static receipt; current canonical postimages are verified separately.",
            "No original-runtime, GUI, endpoint, implementation, human-review, owner-acceptance, strict-completion, or publication authority is created.",
          ]
        : [
            "All 57 workspaces now have seven hash-bound, acceptance-neutral pre-runtime candidate files (399 total), but none has a complete implementation specification.",
            "Canonical asset/keyframe inventories remain empty, canonical briefs remain templates, coverage remains root-only and pending, nested reachability remains unresolved, scenarios remain placeholders, and canonical scripts/dependencies remain unreconciled.",
            "The materialized candidates record static facts only. They do not decide reachability, behavior, keyframes, audio, renderer choice, baseline authority, implementation authorization, or acceptance.",
            "The 49 paired FLA members still require separate named-human read-only authoring audits; the 8 SWF-only members retain an authoring-source gap.",
            "Static absence of an external-call candidate is not proof that runtime dependencies are absent. The three members with candidates require explicit security/product disposition.",
          ],
    writeBoundary: {
      workspaceFilesModifiedByThisGenerator: 0,
      workspaceFilesCreatedByThisGenerator: 0,
      candidateFilesObservedByThisGenerator:
        summary.preRuntimeCandidateFileCount,
      candidateFilesCreatedByThisGenerator: 0,
      canonicalFilesModifiedByCandidateMaterializer: 0,
      scenarioInventoriesCreatedByThisGenerator: 0,
      frameDomainDispositionsCreatedByThisGenerator: 0,
      strictReadinessArtifactsCreatedByThisGenerator: 0,
      reportFilesOnly: true,
    },
    acceptanceEffects: {
      implementationAuthorized: false,
      authoritativeOriginalRuntime: false,
      currentJavaScriptCandidate: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  return {
    ...report,
    reportFingerprintSha256: sha256(stableJson(report)),
  };
}

function markdownStatus(value) {
  return value ? "yes" : "no";
}

export function renderMarkdown(report) {
  const highRisk = report.members.filter(
    (member) =>
      member.specificationAreas.scriptsAndDependencies.externalCallCandidates
        .length > 0,
  );
  const memberRows = report.members.map((member) => {
    const areas = member.specificationAreas;
    const calls = areas.scriptsAndDependencies.externalCallCandidates
      .map(({api, occurrences}) => `${api}:${occurrences}`)
      .join(", ") || "none";
    return `| ${member.ordinal} | \`${member.animationId}\` | ${member.sourceModel} | ${member.preRuntimeCandidatePackage.fileCount} | ${areas.assetInventory.rowCount} | ${areas.audioInventory.rowCount} | ${areas.keyframes.rowCount} | ${areas.fullFrameCoverage.requirementCount} pending | ${areas.frameDomains.nestedDefinitionCount}/${areas.frameDomains.unresolvedReachabilityCount} | ${areas.scriptsAndDependencies.materializedScriptCandidateCount}/${areas.scriptsAndDependencies.manifestScriptCount} | ${calls} | no |`;
  }).join("\n");
  const highRiskRows = highRisk.map((member) =>
    `- \`${member.animationId}\`: ${member.specificationAreas.scriptsAndDependencies.externalCallCandidates.map(({api, occurrences}) => `${api} (${occurrences})`).join(", ")}.`,
  ).join("\n");
  const summary = report.summary;
  return `# G5 L5 Pre-implementation Specification Readiness\n\n` +
    `> ${report.authority}\n\n` +
    `- Release: \`${report.releaseId}\` — ${report.title}\n` +
    `- Members: **${summary.memberCount}** (${summary.activePageCount} pages + ${summary.shellCount} shell)\n` +
    `- Pre-runtime candidate packages: **${summary.preRuntimeCandidatePackageMaterializedCount}/${summary.memberCount}** (${summary.preRuntimeCandidateFileCount} hash-bound files)\n` +
    `- M1 machine-only static reconciliations: **${summary.staticReconciliationCount}/${summary.memberCount}**\n` +
    `- Report fingerprint: \`${report.reportFingerprintSha256}\`\n` +
    `- Implementation-specification ready: **${summary.implementationSpecificationReadyCount}/${summary.memberCount}**\n` +
    `- Implementation started: **${summary.implementationStartedCount}/${summary.memberCount}**; authorized by this report: **${summary.implementationAuthorizedCount}**\n` +
    `- Strict complete: **${summary.strictCompleteCount}/${summary.memberCount}**; published: **false**\n\n` +
    `## Exact readiness counts\n\n` +
    `| Area | Current state |\n|---|---:|\n` +
    `| Source/root metadata machine-verified | ${summary.nativeRootMetadataMachineVerifiedCount}/57 |\n` +
    `| Acceptance-neutral candidate packages | ${summary.preRuntimeCandidatePackageMaterializedCount}/57 (${summary.preRuntimeCandidateFileCount} files; seven per member) |\n` +
    `| M1 machine-only static reconciliation receipts | ${summary.staticReconciliationCount}/57 |\n` +
    `| Candidate artifact classes | runtime facts ${summary.manifestRuntimeFactsCandidateCount}/57; asset census ${summary.assetDefinitionCensusCandidateCount}/57; definition CSV ${summary.definitionInventoryCandidateCount}/57; scripts ${summary.scriptInventoryCandidateCount}/57; dependencies ${summary.dependencyInventoryCandidateCount}/57; brief prefill ${summary.migrationBriefStaticPrefillCandidateCount}/57; receipts ${summary.preRuntimeCandidateReceiptCount}/57 |\n` +
    `| Manifest runtime facts fully reconciled | ${summary.manifestRuntimeFactsReconciledCount}/57 |\n` +
    `| Manifest exact static facts reconciled | ${summary.manifestStaticFactsReconciledCount}/57; complexity unknown ${summary.complexityUnknownCount}/57 |\n` +
    `| Asset inventories populated | ${summary.assetInventoryPopulatedCount}/57 canonical (${summary.assetInventoryRowCount} rows); ${summary.materializedDefinitionCandidateCount} machine definition candidates materialized |\n` +
    `| Audio inventories populated | ${summary.audioInventoryPopulatedCount}/57 (${summary.structuralAudioInventoryRowCount} structural rows; ${summary.audioSpecificationReadyCount} accepted/not-required dispositions; ${summary.audioHumanDecisionPendingCount}/57 human listening decisions pending) |\n` +
    `| Keyframe inventories populated | ${summary.keyframeInventoryPopulatedCount}/57 (${summary.keyframeRowCount} rows) |\n` +
    `| Coverage | ${summary.coverageRequirementCount} root-only requirements; ${summary.coverageMissingFrameCount}/${summary.coverageRequiredFrameCount} frames missing |\n` +
    `| Migration briefs substantively completed | ${summary.migrationBriefSubstantivelyCompletedCount}/57 (${summary.migrationBriefTemplateCount} templates; renderer unselected ${summary.rendererUnselectedCount}/57) |\n` +
    `| Machine audits complete | ${summary.machineAuditCompleteCount}/57 (${summary.machineAuditPartialCount} partial) |\n` +
    `| Frame-domain dispositions | ${summary.frameDomainDispositionPresentCount}/57 present; ${summary.completeFrameDomainDispositionCount}/57 complete; ${summary.unresolvedNestedReachabilityCount}/${summary.nestedDefinitionCount} nested reachability unresolved |\n` +
    `| Scenario inventories present | ${summary.scenarioInventoryPresentCount}/57 (${summary.defaultScenarioPlaceholderOnlyCount} default placeholders) |\n` +
    `| Script exports reconciled | ${summary.manifestScriptReconciledCount}/57 canonical; ${summary.materializedScriptCandidateCount} script candidates materialized |\n` +
    `| Dependency inventories present | ${summary.dependencyInventoryPresentCount}/57 canonical; ${summary.dependencyInventoryCandidateCount}/57 static candidates materialized |\n` +
    `| Canonical M1 static inventories | scripts ${summary.canonicalStaticScriptInventoryCount}/57; dependencies ${summary.canonicalStaticDependencyInventoryCount}/57; runtime reachability unresolved ${summary.runtimeReachabilityUnresolvedCount}/57 |\n` +
    `| External-call candidates | ${summary.externalCallCandidateMemberCount} members; ${summary.externalCallCandidateApiCount} API rows; ${summary.externalCallCandidateOccurrenceCount} occurrences |\n\n` +
    `## Routing boundary\n\n` +
    `The acceptance-neutral machine work is materialized for **${summary.safeMachineCandidateWorkMaterializedCount}/57** members (**${summary.materializedAutomaticallyAdvanceableTaskCount}/${summary.automaticallyAdvanceableTaskCount}** task instances); remaining automatically advanceable task instances: **${summary.remainingAutomaticallyAdvanceableTaskCount}**. All **${summary.originalRuntimeOrHumanDecisionRequiredCount}/57** still require original-runtime or human decisions before rendering can start. ${report.reconciliationMode === "post-adoption" ? "Machine-only static reconciliation cannot satisfy the second category." : "Candidate automation cannot satisfy the second category."}\n\n` +
    `### Materialized automatically advanceable candidate work\n\n` +
    Object.entries(report.taskDefinitions.automaticallyAdvanceableCandidateWork)
      .map(([id, statement]) => `- \`${id}\`: ${statement}`)
      .join("\n") +
    `\n\n### Requires original runtime or human decision\n\n` +
    Object.entries(report.taskDefinitions.requiresOriginalRuntimeOrHumanDecision)
      .map(([id, statement]) => `- \`${id}\`: ${statement}`)
      .join("\n") +
    `\n\n## External-call candidates requiring explicit disposition\n\n${highRiskRows}\n\n` +
    `These candidates were not executed. A static scan with no candidate is not a runtime dependency clearance.\n\n` +
    `## Per-member state\n\n` +
    `| # | Animation | Source | Candidate files | Canonical assets | Audio | Keyframes | Coverage | Nested unresolved | Candidate/canonical scripts | External calls | Spec ready |\n` +
    `|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|\n${memberRows}\n\n` +
    `## Write and acceptance boundary\n\n` +
    `- Workspace files modified/created: **${report.writeBoundary.workspaceFilesModifiedByThisGenerator}/${report.writeBoundary.workspaceFilesCreatedByThisGenerator}**.\n` +
    `- Candidate files observed/created by this report generator: **${report.writeBoundary.candidateFilesObservedByThisGenerator}/${report.writeBoundary.candidateFilesCreatedByThisGenerator}**; canonical files modified by the candidate materializer: **${report.writeBoundary.canonicalFilesModifiedByCandidateMaterializer}**.\n` +
    `- Scenario inventories, frame-domain dispositions, strict-readiness artifacts created: **${report.writeBoundary.scenarioInventoriesCreatedByThisGenerator}/${report.writeBoundary.frameDomainDispositionsCreatedByThisGenerator}/${report.writeBoundary.strictReadinessArtifactsCreatedByThisGenerator}**.\n` +
    `- Authoritative runtime sessions/baselines: **${summary.authoritativeRuntimeSessionCount}/${summary.authoritativeBaselineCount}**.\n` +
    `- Implementation authorized: **${markdownStatus(report.acceptanceEffects.implementationAuthorized)}**; strict complete: **${markdownStatus(report.acceptanceEffects.strictComplete)}**; published: **${markdownStatus(report.acceptanceEffects.published)}**.\n`;
}

function outputPaths(projectRoot, outputPrefix) {
  invariant(
    typeof outputPrefix === "string" &&
      outputPrefix.startsWith("reports/") &&
      !path.isAbsolute(outputPrefix) &&
      !outputPrefix.includes("\\") &&
      !outputPrefix.split("/").includes(".."),
    "--output-prefix must remain below reports/",
  );
  return {
    json: resolveProjectPath(projectRoot, `${outputPrefix}.json`, "JSON output"),
    markdown: resolveProjectPath(
      projectRoot,
      `${outputPrefix}.md`,
      "Markdown output",
    ),
  };
}

async function writeAtomic(absolutePath, contents) {
  await mkdir(path.dirname(absolutePath), {recursive: true});
  const temporary = `${absolutePath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, contents, {flag: "wx", mode: 0o644});
    await rename(temporary, absolutePath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export function parseArguments(argv) {
  const options = {
    outputPrefix: DEFAULT_OUTPUT_PREFIX,
    check: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--output-prefix") {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), "--output-prefix requires a value");
      options.outputPrefix = value;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  outputPaths(defaultProjectRoot, options.outputPrefix);
  return options;
}

async function run(options) {
  const report = await buildReport();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  const outputs = outputPaths(defaultProjectRoot, options.outputPrefix);
  if (options.check) {
    const [actualJson, actualMarkdown] = await Promise.all([
      readFile(outputs.json, "utf8"),
      readFile(outputs.markdown, "utf8"),
    ]);
    invariant(actualJson === json, `${options.outputPrefix}.json is stale`);
    invariant(actualMarkdown === markdown, `${options.outputPrefix}.md is stale`);
    return {status: "checked", report};
  }
  await Promise.all([
    writeAtomic(outputs.json, json),
    writeAtomic(outputs.markdown, markdown),
  ]);
  return {status: "written", report};
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-specification-readiness.mjs [--check]
  node scripts/build-g5-l5-specification-readiness.mjs [--output-prefix reports/<name>]

Reads the exact 57 G5 L5 workspaces and writes only a fail-closed
pre-implementation specification-readiness JSON/Markdown report. It never
modifies a workspace, generates scenario/frame-domain/strict-readiness
artifacts, launches a GUI/runtime, implements a renderer, or changes acceptance.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await run(options);
  const summary = result.report.summary;
  process.stdout.write(
    `${result.status === "checked" ? "PASS" : "WROTE"}: G5 L5 specification readiness ` +
      `${summary.implementationSpecificationReadyCount}/${summary.memberCount}; ` +
      `machine-candidate packages materialized ${summary.preRuntimeCandidatePackageMaterializedCount}/${summary.memberCount} (${summary.preRuntimeCandidateFileCount} files); ` +
      `runtime/human decisions ${summary.originalRuntimeOrHumanDecisionRequiredCount}/${summary.memberCount}; ` +
      `implementation authorized 0; strict 0/57; published false.\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
