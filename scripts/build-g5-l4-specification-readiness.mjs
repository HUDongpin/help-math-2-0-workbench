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

import {
  classifyStaticReconciliationReceiptState,
  validateHistoricalCandidateDescriptor,
  validatePriorReceipt,
} from "./materialize-g5-l4-pre-runtime-specification-candidates.mjs";
import {
  G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES,
} from "./build-lesson-static-strict-readiness.mjs";
import {
  validateSuccessorReceipt as validateAssetSuccessorReceipt,
} from "./materialize-g5-l4-source-derived-asset-inventories.mjs";
import {
  validateSuccessorReceipt as validateKeyframeSuccessorReceipt,
} from "./materialize-g5-l4-source-derived-keyframe-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH = "scripts/build-g5-l4-specification-readiness.mjs";
const CANDIDATE_GENERATOR_PATH =
  "scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs";
const CANDIDATE_PARSER_PATH =
  "scripts/build-g4-l3-swf-asset-definition-census.mjs";
const STATIC_RECONCILIATION_RECEIPT_NAME =
  "g5-l4-m1-static-reconciliation-receipt.json";
const RELEASE_ID = "lesson-g05-l04-number-lines";
const TITLE = "Number Lines";
const DEFAULT_OUTPUT_PREFIX = "reports/g5-l4-specification-readiness";
const SHA256 = /^[a-f0-9]{64}$/;
const SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS = Object.freeze([
  "course-g05-l04-rw-002",
  "course-g05-l04-rw-003",
  "course-g05-l04-rw-004",
  "course-g05-l04-vb-002",
  "course-g05-l04-vb-005",
  "course-g05-l04-vb-006",
  "course-g05-l04-vb-007",
  "course-g05-l04-vb-008",
  "course-g05-l04-vb-009",
  "course-g05-l04-vb-010",
  "course-g05-l04-vb-011",
  "course-g05-l04-in-002",
  "course-g05-l04-in-003",
  "course-g05-l04-in-004",
  "course-g05-l04-in-005",
  "course-g05-l04-in-007",
  "course-g05-l04-in-009",
  "course-g05-l04-in-010",
  "course-g05-l04-in-012",
  "course-g05-l04-in-013",
  "course-g05-l04-in-014",
  "course-g05-l04-in-015",
  "course-g05-l04-in-016",
  "course-g05-l04-in-017",
  "course-g05-l04-in-018",
  "course-g05-l04-in-020",
  "course-g05-l04-ts-002",
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-004",
  "course-g05-l04-ts-005",
  "course-g05-l04-ts-006",
  "course-g05-l04-ts-007",
  "course-g05-l04-ts-008",
  "course-g05-l04-ir-001-a662633d",
  "course-g05-l04-vb-003",
  "course-g05-l04-vb-004",
  "course-g05-l04-in-006",
  "course-g05-l04-in-008",
  "course-g05-l04-in-011",
  "course-g05-l04-in-019",
  "course-g05-l04-in-021",
  "course-g05-l04-in-022",
  "course-g05-l04-ti-002",
  "course-g05-l04-ti-003",
  "course-g05-l04-ti-004",
  "course-g05-l04-ti-005",
  "course-g05-l04-ti-006",
  "course-g05-l04-ti-007",
  "course-g05-l04-ti-008",
  "course-g05-l04-ti-009",
  "course-g05-l04-gs-002",
  "course-g05-l04-fq-001",
]);
const SOURCE_STATIC_ENGINEERING_CANDIDATE_ID_SET = new Set(
  SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS,
);
const SOURCE_STATIC_ENGINEERING_CANDIDATES = Object.freeze(
  Object.fromEntries(
    SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.map((animationId) => {
      const profile = G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[animationId];
      if (!profile) {
        throw new Error(
          `${animationId}: shared engineering-candidate profile is missing`,
        );
      }
      const renderedFrameCount =
        profile.renderedFrameCount ?? profile.nestedFrameCount;
      return [animationId, Object.freeze({
        ...profile,
        frameCount: profile.nestedFrameCount,
        renderedFrameCount,
        blockedTailFrameCount:
          profile.nestedFrameCount - renderedFrameCount,
        manifestBound: profile.manifestBound !== false,
        nestedCoverageDeclared: profile.nestedCoverageDeclared !== false,
        candidateKind:
          profile.candidateKind ??
          (renderedFrameCount === profile.nestedFrameCount
            ? "single-sprite-full"
            : "single-sprite-safe-prefix"),
      })];
    }),
  ),
);

const CORE_INPUTS = Object.freeze({
  releaseManifest: "catalog/lesson-releases.json",
  sourceScope: "reports/g5-l4-source-scope-freeze.json",
  workspaceReadiness: "reports/g5-l4-workspace-readiness.json",
  runtimePlanning:
    "reports/g05-l04-number-lines-runtime-acquisition-planning-readiness.json",
  sourceDerivedKeyframeSuccessor:
    "reports/g5-l4-source-derived-keyframe-candidate-successor-receipt.json",
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
  sourceScopeBinding: "audit/machine/g5-l4-source-scope-binding.json",
  scriptIndex: "audit/machine/ffdec-script-index.txt",
  scriptExport: "audit/machine/ffdec-scripts.txt.gz",
  ffdecHeader: "audit/machine/ffdec-header.txt",
  swfmillSummary: "audit/machine/swfmill-summary.json",
  candidateRuntimeFacts:
    "audit/machine/g5-l4-pre-runtime-manifest-runtime-facts-candidate.json",
  candidateAssetCensus:
    "audit/machine/g5-l4-pre-runtime-swf-asset-definition-census.json",
  candidateDefinitionInventory:
    "audit/machine/g5-l4-pre-runtime-swf-definition-inventory.csv",
  candidateScriptInventory:
    "audit/machine/g5-l4-pre-runtime-ffdec-script-inventory-candidate.json",
  candidateDependencyInventory:
    "audit/machine/g5-l4-pre-runtime-static-dependency-inventory-candidate.json",
  candidateBrief:
    "audit/machine/g5-l4-pre-runtime-migration-brief-static-prefill-candidate.md",
  candidateReceipt:
    "audit/machine/g5-l4-pre-runtime-specification-candidate-receipt.json",
  sourceDerivedAssetSuccessor:
    "audit/machine/g5-l4-source-derived-asset-inventory-candidate-receipt.json",
});

const OPTIONAL_SPECIFICATION_FILES = Object.freeze({
  frameDomainDisposition: "audit/frame-domain-disposition.json",
  scenarioInventory: "audit/scenario-inventory.json",
  scriptInventory: "audit/script-inventory.json",
  dependencyInventory: "audit/dependency-inventory.json",
  strictReadiness: "audit/strict-readiness.json",
});
const OPTIONAL_AUDIO_RUNTIME_EVIDENCE =
  "audit/audio-runtime-evidence.json";

const HISTORICAL_CANDIDATE_INPUTS = Object.freeze({
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
  "machine-structural-audio-audit":
    "Audit exact external and embedded audio bytes, routing candidates, metadata, and ActionScript operations while leaving spoken language, runtime reachability, synchronization, listening, and acceptance unresolved.",
  "machine-reconcile-static-canonical-specification":
    "Adopt only machine-proven runtime facts, static brief sections, script inventory, and dependency inventory through the reviewed M1 reconciliation transaction; do not modify asset, keyframe, coverage, status, or acceptance state.",
  "machine-build-static-strict-readiness":
    "Build a fail-closed strict-readiness artifact from current static evidence after canonical M1 reconciliation; retain every runtime, implementation, review, and acceptance gate as blocked.",
  "machine-build-scenario-inventory":
    "Enumerate source-derived scenario and interaction obligations from current static evidence without asserting runtime reachability or natural execution.",
  "machine-build-frame-domain-disposition":
    "Materialize a source-backed frame-domain disposition that preserves unresolved nested reachability and entry states until authorized runtime evidence exists.",
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

function hasExactSourceStaticFrameBoundary(candidate, nested) {
  if (
    !Number.isSafeInteger(candidate?.renderedFrameCount) ||
    candidate.renderedFrameCount <= 0 ||
    candidate.renderedFrameCount > nested?.frameCount
  ) {
    return false;
  }
  if (candidate.renderedFrameCount === nested.frameCount) {
    return candidate.sourceStaticRenderableFrames === undefined &&
      candidate.blockedLocalFrameRanges === undefined;
  }
  const renderable = candidate.sourceStaticRenderableFrames;
  const blocked = candidate.blockedLocalFrameRanges;
  return renderable?.firstFrame === 1 &&
    renderable.lastFrame === candidate.renderedFrameCount &&
    renderable.frameCount === candidate.renderedFrameCount &&
    Array.isArray(blocked) &&
    blocked.length === 1 &&
    blocked[0]?.firstFrame === candidate.renderedFrameCount + 1 &&
    blocked[0]?.lastFrame === nested.frameCount;
}

function sourceStaticCandidateFor(animationId) {
  return SOURCE_STATIC_ENGINEERING_CANDIDATES[animationId] ?? null;
}

function independentFq001CandidateIsBound(migration, candidate) {
  const implementation = migration?.implementation;
  const maturity = implementation?.candidateMaturity;
  const root = implementation?.frameDomains?.[0];
  return (
    migration.id === "course-g05-l04-fq-001" &&
    candidate?.manifestBound === false &&
    candidate.candidateKind === "dual-sprite-composite-prefix" &&
    implementation.rendering === "undecided" &&
    implementation.route === "" &&
    implementation.routeFile === "" &&
    implementation.component === "" &&
    implementation.registryModule === "" &&
    implementation.timelineModule === "" &&
    implementation.testFile === "" &&
    implementation.standalonePackage === "" &&
    implementation.defaultFrameDomainId === "root" &&
    implementation.frameDomains?.length === 1 &&
    root?.id === "root" &&
    root.kind === "root" &&
    root.frameCount === migration.runtime?.frameCount &&
    implementation.candidateState === undefined &&
    implementation.capturePlanning === undefined &&
    maturity?.status === "current-javascript-engineering-candidate-only" &&
    maturity.candidateKind === "dual-sprite-composite-prefix" &&
    maturity.bindingAuthority ===
      "independent-fq001-composite-evidence-only" &&
    maturity.route === `/animations/${migration.id}` &&
    maturity.publicComposite?.frameDomain === candidate.frameDomainId &&
    maturity.publicComposite?.firstFrame === 1 &&
    maturity.publicComposite?.lastFrame === candidate.renderedFrameCount &&
    maturity.publicComposite?.openFrameCount ===
      candidate.renderedFrameCount &&
    maturity.publicComposite?.fixedCompanionFrameDomain ===
      candidate.companionFrameDomainId &&
    maturity.publicComposite?.fixedCompanionFrame === 1 &&
    maturity.canonicalDefaultFrameDomainId === "root" &&
    maturity.canonicalFrameDomainsChanged === false &&
    maturity.canonicalFrameDomainDisposition === "unresolved" &&
    maturity.canonicalNestedCoverageDeclared === false &&
    maturity.rootEnabled === false &&
    maturity.companionStandaloneEnabled === false &&
    maturity.spanishEnabled === false &&
    maturity.audioEnabled === false &&
    maturity.sourceControlsEnabled === false &&
    maturity.replayParityEstablished === false &&
    maturity.originalRuntimeBaselineUsed === false &&
    maturity.rmseComputed === false &&
    maturity.humanVisualReviewPerformed === false &&
    maturity.ownerReviewPerformed === false &&
    maturity.implementationAuthorized === false &&
    maturity.strictAcceptanceEffect === "none"
  );
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

async function optionalJsonState(projectRoot, relativePath, label) {
  try {
    const record = await readJsonRecord(projectRoot, relativePath, label);
    return {
      present: true,
      path: relativePath,
      bytes: record.bytes,
      sha256: record.sha256,
      document: record.document,
    };
  } catch (error) {
    if (error?.code === "ENOENT") return {present: false, path: relativePath};
    throw error;
  }
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
      release.lesson === 4 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 55 &&
      Array.isArray(release.members) &&
      release.members.length === 55,
    `${RELEASE_ID}: release identity or scope drifted`,
  );
  invariant(
    release.members.every((member, index) => member.ordinal === index + 1) &&
      new Set(release.members.map(({animationId}) => animationId)).size === 55 &&
      new Set(release.members.map(({assetId}) => assetId)).size === 55,
    `${RELEASE_ID}: ordered member identity drifted`,
  );
  return release;
}

function validateReleaseReports(release, sourceScope, workspaceReadiness, runtimePlanning) {
  invariant(
    sourceScope?.schemaVersion === 1 &&
      sourceScope.releaseId === RELEASE_ID &&
      sourceScope.summary?.memberCount === 55 &&
      sourceScope.summary?.strictCompleteCount === 0 &&
      sourceScope.summary?.publishedCount === 0 &&
      Array.isArray(sourceScope.members) &&
      sourceScope.members.length === 55,
    "G5 L4 source-scope report drifted or crossed an acceptance boundary",
  );
  invariant(
    workspaceReadiness?.schemaVersion === 1 &&
      workspaceReadiness.releaseId === RELEASE_ID &&
      workspaceReadiness.summary?.expectedWorkspaceCount === 55 &&
      workspaceReadiness.summary?.presentWorkspaceCount === 55 &&
      workspaceReadiness.summary?.draftValidationPassCount === 55 &&
      workspaceReadiness.summary?.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      workspaceReadiness.summary?.strictCompleteCount === 0 &&
      workspaceReadiness.summary?.publishedCount === 0 &&
      Array.isArray(workspaceReadiness.workspaces) &&
      workspaceReadiness.workspaces.length === 55,
    "G5 L4 workspace-readiness report drifted or crossed an implementation boundary",
  );
  invariant(
    runtimePlanning?.schemaVersion === 2 &&
      runtimePlanning.identity?.releaseId === RELEASE_ID &&
      runtimePlanning.scope?.releaseMemberCount === 55 &&
      runtimePlanning.summary?.selectedMemberCount === 55 &&
      runtimePlanning.summary?.runtimeSessionCount === 0 &&
      runtimePlanning.summary?.authoritativeBaselineCount === 0 &&
      runtimePlanning.gates?.implementationAuthorized === false &&
      runtimePlanning.gates?.strictCompletionAffected === false &&
      runtimePlanning.gates?.publicationAffected === false,
    "G5 L4 runtime-planning report drifted or crossed a runtime/implementation boundary",
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
        workspace?.implementationStatus ===
          (sourceStaticCandidateFor(member.animationId)
            ? sourceStaticCandidateFor(member.animationId).manifestBound
              ? "source-static-engineering-candidate"
              : "dual-sprite-composite-engineering-candidate"
            : "not-started") &&
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
        "g5-l4-pre-runtime-specification-candidate-materializer" &&
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
  historicalStaticReceipt = null,
  historicalManifestSuccessor = false,
  sourceDerivedAssetSuccessor = null,
  sourceDerivedKeyframeSuccessorMember = null,
}) {
  invariant(
    historicalManifestSuccessor
      ? Boolean(historicalStaticReceipt) &&
        SOURCE_STATIC_ENGINEERING_CANDIDATE_ID_SET.has(member.animationId)
      : true,
    `${member.animationId}: historical manifest successor is not bounded to the source-static allowlist`,
  );
  const documents = {
    candidateRuntimeFacts: {
      artifactType: "g5-l4-manifest-runtime-facts-candidate",
      document: records.candidateRuntimeFacts.document,
    },
    candidateAssetCensus: {
      artifactType: "g5-l4-swf-asset-definition-census-candidate",
      document: records.candidateAssetCensus.document,
    },
    candidateScriptInventory: {
      artifactType: "g5-l4-ffdec-script-inventory-candidate",
      document: records.candidateScriptInventory.document,
    },
    candidateDependencyInventory: {
      artifactType: "g5-l4-static-dependency-inventory-candidate",
      document: records.candidateDependencyInventory.document,
    },
    candidateReceipt: {
      artifactType:
        "g5-l4-pre-runtime-specification-candidate-receipt",
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
  const expectedFullBindings = historicalStaticReceipt
    ? structuredClone(receipt.inputs)
    : {
        lessonReleaseCatalog: releaseManifestBinding,
        migrationManifest: descriptor(records.migrationManifest),
        migrationBrief: descriptor(records.migrationBrief),
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
      (historicalStaticReceipt
        ? historicalStaticReceipt.outputs?.migrationManifest?.before
            ?.path === receipt.canonicalFiles?.migrationManifest?.path &&
          historicalStaticReceipt.outputs.migrationManifest.before
            .bytes ===
            receipt.canonicalFiles.migrationManifest.bytes &&
          historicalStaticReceipt.outputs.migrationManifest.before
            .sha256 ===
            receipt.canonicalFiles.migrationManifest.sha256
        : runtimeFacts.canonicalManifestBefore?.actionScriptVersion ===
            migration.runtime.actionScriptVersion &&
          runtimeFacts.canonicalManifestBefore?.backgroundColor ===
            migration.runtime.backgroundColor) &&
      runtimeFacts.canonicalManifestBefore?.complexity ===
        migration.runtime.complexity &&
      (historicalStaticReceipt
        ? runtimeFacts.canonicalManifestBefore?.scriptCount === 0
        : runtimeFacts.canonicalManifestBefore?.scriptCount ===
          migration.runtime.scripts.length) &&
      runtimeFacts.canonicalManifestBefore?.externalDependencyCount ===
        migration.runtime.externalDependencies.length &&
      runtimeFacts.canonicalManifestBefore?.rendering ===
        (historicalManifestSuccessor
          ? "undecided"
          : migration.implementation.rendering) &&
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
    if (
      historicalStaticReceipt &&
      ["assetInventory", "keyframes"].includes(receiptKey)
    ) {
      const historicalBinding = receiptKey === "assetInventory"
        ? historicalStaticReceipt.inputs?.canonicalAssetInventory
        : historicalStaticReceipt.inputs?.canonicalKeyframes;
      const successorBinding = receiptKey === "assetInventory"
        ? sourceDerivedAssetSuccessor?.output?.assetInventory
        : sourceDerivedKeyframeSuccessorMember?.output?.after;
      invariant(
        binding?.path === historicalBinding?.path &&
          binding.bytes === historicalBinding.bytes &&
          binding.sha256 === historicalBinding.sha256 &&
          binding.changedByMaterializer === false &&
          successorBinding?.path === record.path &&
          successorBinding.bytes === record.bytes &&
          successorBinding.sha256 === record.sha256 &&
          record.sha256 !== historicalBinding.sha256,
        `${member.animationId}: historical candidate/current ${receiptKey} successor binding drifted`,
      );
      continue;
    }
    if (
      historicalStaticReceipt &&
      historicalManifestSuccessor &&
      sourceStaticCandidateFor(member.animationId)?.manifestBound === true &&
      receiptKey === "fullFrameCoverage"
    ) {
      const historicalCoverage =
        historicalStaticReceipt.inputs?.canonicalCoverage;
      invariant(
        binding?.path === historicalCoverage?.path &&
          binding.bytes === historicalCoverage.bytes &&
          binding.sha256 === historicalCoverage.sha256 &&
          binding.changedByMaterializer === false &&
          record.path === historicalCoverage.path &&
          record.bytes > 0 &&
          SHA256.test(record.sha256) &&
          record.sha256 !== historicalCoverage.sha256,
        `${member.animationId}: historical candidate/current coverage successor binding drifted`,
      );
      continue;
    }
    if (
      historicalStaticReceipt &&
      ["migrationManifest", "migrationBrief"].includes(receiptKey)
    ) {
      const transition =
        historicalStaticReceipt.outputs?.[receiptKey];
      const isHistoricalManifestSuccessor =
        receiptKey === "migrationManifest" &&
        historicalManifestSuccessor;
      invariant(
        binding?.path === transition?.before?.path &&
          binding.bytes === transition.before.bytes &&
          binding.sha256 === transition.before.sha256 &&
          binding.changedByMaterializer === false &&
          record.path === transition.after?.path &&
          (isHistoricalManifestSuccessor
            ? record.bytes > 0 &&
              SHA256.test(record.sha256) &&
              record.sha256 !== transition.after.sha256
            : record.bytes === transition.after.bytes &&
              record.sha256 === transition.after.sha256),
        `${member.animationId}: historical candidate/canonical transition binding drifted for ${receiptKey}`,
      );
      continue;
    }
    invariant(
      binding?.path === record.path &&
        binding.bytes === record.bytes &&
        binding.sha256 === record.sha256 &&
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
    historicalPostAdoption: Boolean(historicalStaticReceipt),
    historicalManifestSuccessor,
    sourceStaticEngineeringCandidate: historicalManifestSuccessor,
    sourceDerivedAssetCandidateRows:
      sourceDerivedAssetSuccessor?.output?.assetInventory?.rowCount ?? 0,
    sourceDerivedAssetFinalSpecificationComplete:
      sourceDerivedAssetSuccessor?.projection?.finalAssetSpecificationComplete ?? false,
    sourceDerivedKeyframeCandidateRows:
      sourceDerivedKeyframeSuccessorMember?.derivation?.rowCount ?? 0,
    sourceDerivedAuthoritativeBaselineKeyframeCount:
      sourceDerivedKeyframeSuccessorMember?.derivation
        ?.authoritativeBaselineKeyframeCount ?? 0,
    staticReconciliationReceipt: historicalStaticReceipt
      ? `migrations/${member.animationId}/audit/machine/${STATIC_RECONCILIATION_RECEIPT_NAME}`
      : null,
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
}) {
  const label = member.animationId;
  const engineeringCandidate = sourceStaticCandidateFor(label);
  const sourceStaticEngineeringCandidate = Boolean(engineeringCandidate);
  const manifestBoundSourceStaticCandidate =
    engineeringCandidate?.manifestBound === true;
  const audioRuntimeEvidencePresent =
    audioRuntimeEvidence?.present === true;
  const audioRuntimeEvidenceDocument =
    audioRuntimeEvidencePresent ? audioRuntimeEvidence.document : null;
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
      candidatePackage.dependencyOccurrenceCount >= 0 &&
      Boolean(candidatePackage.sourceStaticEngineeringCandidate) ===
        sourceStaticEngineeringCandidate,
    `${label}: complete acceptance-neutral candidate package is required`,
  );
  const commonManifestIdentity =
    migration?.schemaVersion === 2 &&
      migration.id === label &&
      migration.animationId === label &&
      migration.assetId === member.assetId &&
      migration.status === "preserved" &&
      migration.source?.swfSha256 === member.source.sha256 &&
      migration.source?.swf?.endsWith(member.source.path);
  invariant(
    commonManifestIdentity,
    `${label}: migration manifest identity or pre-implementation state drifted`,
  );
  let sourceStaticRootDomain = null;
  let sourceStaticNestedDomain = null;
  if (manifestBoundSourceStaticCandidate) {
    const implementation = migration.implementation;
    const frameDomains = implementation?.frameDomains;
    sourceStaticRootDomain = frameDomains?.find(({id}) => id === "root");
    sourceStaticNestedDomain = frameDomains?.find(
      ({kind}) => kind === "nested",
    );
    const candidate = implementation?.candidateState;
    invariant(
      typeof implementation?.rendering === "string" &&
        implementation.rendering.startsWith(
          "source-static Canvas engineering candidate;",
        ) &&
        implementation.route === `/animations/${label}` &&
        Array.isArray(frameDomains) &&
        frameDomains.length === 2 &&
        sourceStaticRootDomain?.kind === "root" &&
        sourceStaticRootDomain.frameCount === migration.runtime?.frameCount &&
        sourceStaticNestedDomain?.id === engineeringCandidate.frameDomainId &&
        sourceStaticNestedDomain?.parentFrameDomainId === "root" &&
        sourceStaticNestedDomain.sourceInstanceId ===
          (engineeringCandidate.sourceInstanceId ?? "animation") &&
        sourceStaticNestedDomain.frameCount ===
          engineeringCandidate.frameCount &&
        implementation.defaultFrameDomainId === sourceStaticNestedDomain.id &&
        candidate?.status ===
          "current-javascript-engineering-candidate-only" &&
        candidate.sourceStaticFrameDomain === sourceStaticNestedDomain.id &&
        candidate.sourceStaticFrames?.firstFrame === 1 &&
        candidate.sourceStaticFrames.lastFrame ===
          sourceStaticNestedDomain.frameCount &&
        hasExactSourceStaticFrameBoundary(
          candidate,
          sourceStaticNestedDomain,
        ) &&
        candidate.rootEnabled === false &&
        candidate.spanishEnabled === false &&
        candidate.audioEnabled === false &&
        candidate.sourceControlsEnabled === false &&
        candidate.replayParityEstablished === false &&
        candidate.originalRuntimeBaselineUsed === false &&
        candidate.rmseComputed === false &&
        candidate.humanVisualReviewPerformed === false &&
        candidate.ownerReviewPerformed === false &&
        candidate.strictAcceptanceEffect === "none" &&
        implementation.capturePlanning
          ?.authoritativeRuntimeFrameDomainDispositionEstablished === false &&
        implementation.capturePlanning.runtimeReachabilityEstablished ===
          false &&
        implementation.capturePlanning.strictAcceptanceEffect === "none" &&
        migration.evidence?.currentJavascriptCandidateAuthority ===
          "non-authoritative-current-javascript-source-static-output" &&
        migration.evidence
          ?.currentJavascriptCandidateStrictAcceptanceEffect === "none",
      `${label}: source-static engineering-candidate manifest drifted or crossed an authority boundary`,
    );
  } else if (sourceStaticEngineeringCandidate) {
    invariant(
      independentFq001CandidateIsBound(migration, engineeringCandidate),
      `${label}: independent dual-sprite engineering candidate drifted or altered canonical domains`,
    );
    sourceStaticRootDomain = migration.implementation.frameDomains[0];
  } else {
    invariant(
      migration.implementation?.rendering === "undecided" &&
        migration.implementation?.route === "",
      `${label}: migration manifest identity or pre-implementation state drifted`,
    );
  }
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
    audioRuntimeEvidencePresent
      ? audioRuntimeEvidenceDocument?.schemaVersion === 2 &&
        audioRuntimeEvidenceDocument.animationId === label &&
        audioRuntimeEvidenceDocument.source?.expectedSha256 ===
          member.source.sha256 &&
        audioRuntimeEvidenceDocument.source?.hashMatches === true &&
        audioRuntimeEvidenceDocument.acceptance?.structurallyAudited === true &&
        audioRuntimeEvidenceDocument.acceptance
          ?.authoritativeListeningComplete === false &&
        audioRuntimeEvidenceDocument.acceptance?.strictAudioAcceptance ===
          "pending" &&
        audioRuntimeEvidenceDocument.acceptance?.releaseBoundary
          ?.authoritativeOriginalRuntimeListeningComplete === false &&
        audioRuntimeEvidenceDocument.acceptance?.releaseBoundary
          ?.strictMigrationComplete === false &&
        audioRuntimeEvidenceDocument.acceptance?.releaseBoundary
          ?.publicationAuthorized === false
      : audioRuntimeEvidence?.present === false &&
        audioRuntimeEvidence.path?.endsWith(
          OPTIONAL_AUDIO_RUNTIME_EVIDENCE,
        ),
    `${label}: optional audio structural evidence drifted or claims listening acceptance`,
  );
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === label &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length > 0,
    `${label}: coverage-v2 document is malformed`,
  );
  const rootFrameCount = migration.runtime.frameCount;
  const expectedCoverageDomains = manifestBoundSourceStaticCandidate
    ? [sourceStaticRootDomain, sourceStaticNestedDomain]
    : [{id: "root", frameCount: rootFrameCount}];
  invariant(
    coverage.requirements.length === expectedCoverageDomains.length * 2 &&
      (manifestBoundSourceStaticCandidate
        ? coverage.planningState ===
          "valid-root-and-conservative-nested-requirements-pending-authoritative-runtime"
        : true),
    `${label}: coverage requirement set does not match the bounded engineering state`,
  );
  let coverageRequiredFrameCount = 0;
  for (const frameDomain of expectedCoverageDomains) {
    for (const language of ["en", "es"]) {
      const matches = coverage.requirements.filter(
        (requirement) =>
          requirement.frameDomainId === frameDomain.id &&
          requirement.language === language,
      );
      invariant(
        matches.length === 1,
        `${label}: expected one pending ${frameDomain.id}/${language} coverage requirement`,
      );
      const [requirement] = matches;
      invariant(
        requirement.requiredRange?.firstFrame === 1 &&
          requirement.requiredRange?.lastFrame === frameDomain.frameCount &&
          requirement.baselineAuthority === "unresolved" &&
          requirement.status === "pending" &&
          requirement.capturedFrameCount === 0 &&
          Array.isArray(requirement.missingFrames) &&
          requirement.missingFrames.length === frameDomain.frameCount &&
          requirement.missingFrames.every(
            (frame, index) => frame === index + 1,
          ) &&
          [
            "baselineCaptureManifest",
            "baselineCaptureManifestSha256",
            "captureManifest",
            "captureManifestSha256",
            "metricsFile",
            "metricsSha256",
          ].every((key) =>
            requirement[key] === "" || requirement[key] === undefined),
        `${label}: current coverage promoted or narrowed ${frameDomain.id}/${language}`,
      );
      if (manifestBoundSourceStaticCandidate) {
        invariant(
          requirement.requirementId ===
            `req:${frameDomain.id}:lesson-shell-natural-entry:${language}` &&
            requirement.scenario ===
              (frameDomain.id === "root"
                ? "root-unavailable"
                : "source-static-frame"),
          `${label}: source-static coverage identity drifted for ${frameDomain.id}/${language}`,
        );
      }
      coverageRequiredFrameCount += frameDomain.frameCount;
    }
  }
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
  const staticReconciliationApplied =
    candidatePackage.historicalPostAdoption === true;
  const manifestRuntimeFactsReconciled =
    staticReconciliationApplied &&
    migration.runtime.actionScriptVersion ===
      machineAudit.findings.actionScriptVersion &&
    migration.runtime.backgroundColor === machineAudit.findings.backgroundColor &&
    migration.toolVersions.ffdec !== "unavailable" &&
    migration.toolVersions.swfmill !== "unavailable";
  const sourceDerivedAssetCandidateOnly =
    candidatePackage.historicalPostAdoption === true &&
    candidatePackage.sourceDerivedAssetCandidateRows === assetRows.length &&
    candidatePackage.sourceDerivedAssetFinalSpecificationComplete === false;
  const sourceDerivedKeyframeCandidateOnly =
    candidatePackage.historicalPostAdoption === true &&
    candidatePackage.sourceDerivedKeyframeCandidateRows === keyframeRows.length &&
    candidatePackage.sourceDerivedAuthoritativeBaselineKeyframeCount === 0;
  const assetSpecificationReady =
    (!sourceDerivedAssetCandidateOnly && assetRows.length > 0) ||
    (migration.audit.assetsRequired === false &&
      migration.audit.assetsNotRequiredReason.length > 0);
  const audioSpecificationReady =
    audioRuntimeEvidencePresent &&
    audioRuntimeEvidenceDocument.acceptance.strictAudioAcceptance !== "pending";
  const keyframeSpecificationReady =
    !sourceDerivedKeyframeCandidateOnly && keyframeRows.length > 0;
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
  const briefStaticReconciled = staticReconciliationApplied;
  const scenarioSpecified =
    !sourceStaticEngineeringCandidate &&
    migration.scenarios.length > 0 &&
    migration.scenarios.every(
      ({description}) => typeof description === "string" && description.length > 0,
    ) &&
    optionalSpecificationFiles.scenarioInventory.present;
  const scriptDependencySpecificationReady =
    migration.runtime.scripts.length > 0 &&
    optionalSpecificationFiles.scriptInventory.present &&
    optionalSpecificationFiles.dependencyInventory.present;
  const frameDomainSpecificationReady =
    optionalSpecificationFiles.frameDomainDisposition.present &&
    frameDomains.summary.completeRootReachableDomainInventory === true;
  const machineAuditComplete = machineAudit.auditStatus === "complete";

  const specificationAreas = {
    migrationManifest: {
      state: sourceStaticEngineeringCandidate
        ? "machine-proven-static-runtime-facts-reconciled-source-static-engineering-successor-present-runtime-authority-pending"
        : manifestRuntimeFactsReconciled
          ? "machine-proven-static-runtime-facts-reconciled-human-complexity-decisions-pending"
          : "hash-bound-runtime-facts-candidate-materialized-canonical-reconciliation-pending",
      sourceStaticEngineeringCandidate,
      staticReconciliationApplied,
      identityAndSourceBound: true,
      nativeRootMetadataCrossChecked: true,
      actionScriptManifestValue: migration.runtime.actionScriptVersion,
      actionScriptMachineValue: machineAudit.findings.actionScriptVersion,
      backgroundManifestValue: migration.runtime.backgroundColor,
      backgroundMachineValue: machineAudit.findings.backgroundColor,
      candidateArtifact:
        candidatePackage.artifacts.candidateRuntimeFacts,
      candidateMaterialized: true,
      manifestRuntimeFactsReconciled,
    },
    assetInventory: {
      state: sourceDerivedAssetCandidateOnly
        ? "source-derived-definition-candidate-rows-present-final-placement-visual-and-renderer-disposition-pending"
        : assetSpecificationReady
          ? "specified"
        : "canonical-empty-machine-definition-candidates-materialized",
      rowCount: assetRows.length,
      sourceDerivedCandidateOnly: sourceDerivedAssetCandidateOnly,
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
      state: audioRuntimeEvidencePresent
        ? audioRows.length > 0
          ? "structural-candidates-and-static-audio-evidence-present-original-runtime-listening-required"
          : "static-audio-evidence-present-original-runtime-not-required-or-missing-disposition-required"
        : audioRows.length > 0
          ? "structural-candidates-present-static-audio-evidence-absent-original-runtime-listening-required"
          : "static-audio-evidence-absent-original-runtime-not-required-or-missing-disposition-required",
      rowCount: audioRows.length,
      staticEvidenceArtifact: {
        present: audioRuntimeEvidence.present,
        path: audioRuntimeEvidence.path,
        ...(audioRuntimeEvidencePresent
          ? {
            bytes: audioRuntimeEvidence.bytes,
            sha256: audioRuntimeEvidence.sha256,
          }
          : {}),
      },
      structurallyAudited:
        audioRuntimeEvidenceDocument?.acceptance?.structurallyAudited === true,
      authoritativeListeningComplete: false,
      specificationReady: audioSpecificationReady,
    },
    keyframes: {
      state: sourceDerivedKeyframeCandidateOnly
        ? "source-derived-static-candidate-rows-present-authoritative-runtime-and-human-validation-required"
        : keyframeRows.length > 0
          ? "candidate-rows-present-human-runtime-validation-required"
        : "empty-original-runtime-and-human-behavior-map-required",
      rowCount: keyframeRows.length,
      sourceDerivedCandidateOnly: sourceDerivedKeyframeCandidateOnly,
      specificationReady: keyframeSpecificationReady,
    },
    fullFrameCoverage: {
      state: manifestBoundSourceStaticCandidate
        ? "provisional-root-and-source-static-nested-bilingual-all-pending-no-authoritative-baseline"
        : sourceStaticEngineeringCandidate
          ? "canonical-root-only-bilingual-all-pending-independent-dual-sprite-candidate-has-no-canonical-nested-coverage"
        : "provisional-root-only-bilingual-all-pending",
      requirementCount: coverage.requirements.length,
      rootOnlyRequirementCount: coverage.requirements.filter(
        ({frameDomainId}) => frameDomainId === "root",
      ).length,
      nestedRequirementCount: coverage.requirements.filter(
        ({frameDomainId}) => frameDomainId !== "root",
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
        : briefStaticReconciled
          ? "machine-static-section-reconciled-human-decisions-required"
          : "canonical-template-static-prefill-candidate-materialized-human-decisions-required",
      templateDetected: briefIsTemplate(migrationBrief),
      rendererSelected: migration.implementation.rendering !== "undecided",
      staticReconciliationApplied,
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
      state: manifestBoundSourceStaticCandidate
        ? "source-static-nested-domain-declared-structurally-runtime-reachability-and-entry-authority-unresolved"
        : sourceStaticEngineeringCandidate
          ? "independent-dual-sprite-candidate-present-canonical-frame-domain-disposition-unresolved"
        : "structural-candidates-present-reachability-and-entry-state-unresolved",
      rootFrameCount: frameDomains.root.frameCount,
      sourceStaticDeclaredFrameDomainId:
        sourceStaticNestedDomain?.id ?? null,
      sourceStaticDeclaredFrameCount:
        sourceStaticNestedDomain?.frameCount ?? 0,
      nestedDefinitionCount: frameDomains.summary.nestedDefinitionCount,
      nestedLongerThanRootCount:
        frameDomains.summary.nestedLongerThanRootCount,
      unresolvedReachabilityCount:
        frameDomains.summary.unresolvedReachabilityCount,
      dispositionArtifact: optionalSpecificationFiles.frameDomainDisposition,
      specificationReady: frameDomainSpecificationReady,
    },
    scenarios: {
      state: manifestBoundSourceStaticCandidate
        ? "source-static-diagnostic-identities-present-natural-traces-and-runtime-reachability-unresolved"
        : sourceStaticEngineeringCandidate
          ? "independent-dual-sprite-diagnostic-candidate-present-canonical-natural-traces-and-runtime-reachability-unresolved"
        : "default-placeholder-only-natural-traces-unresolved",
      manifestScenarioCount: migration.scenarios.length,
      describedScenarioCount: migration.scenarios.filter(
        ({description}) => description.length > 0,
      ).length,
      inventoryArtifact: optionalSpecificationFiles.scenarioInventory,
      specificationReady: scenarioSpecified,
    },
    scriptsAndDependencies: {
      state: externalCalls.length > 0
        ? "hash-bound-script-and-static-dependency-candidates-materialized-runtime-disposition-required"
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
    "machine-structural-audio-audit",
    "machine-reconcile-static-canonical-specification",
    "machine-build-static-strict-readiness",
    "machine-build-scenario-inventory",
    "machine-build-frame-domain-disposition",
  ];
  const materializedAutomaticallyAdvanceableTasks = [
    "machine-sync-manifest-runtime-facts",
    ...(assetDefinitionCandidateCount > 0
      ? ["machine-materialize-asset-candidates"]
      : []),
    "machine-materialize-script-candidates",
    "machine-materialize-static-dependency-candidates",
    "machine-prefill-brief-static-sections",
    ...(audioRuntimeEvidencePresent &&
      audioRuntimeEvidenceDocument.acceptance.structurallyAudited === true
      ? ["machine-structural-audio-audit"]
      : []),
    ...(manifestRuntimeFactsReconciled &&
      briefStaticReconciled &&
      optionalSpecificationFiles.scriptInventory.present &&
      optionalSpecificationFiles.dependencyInventory.present
      ? ["machine-reconcile-static-canonical-specification"]
      : []),
    ...(optionalSpecificationFiles.strictReadiness.present
      ? ["machine-build-static-strict-readiness"]
      : []),
    ...(optionalSpecificationFiles.scenarioInventory.present
      ? ["machine-build-scenario-inventory"]
      : []),
    ...(optionalSpecificationFiles.frameDomainDisposition.present
      ? ["machine-build-frame-domain-disposition"]
      : []),
  ];
  const materializedTaskSet = new Set(
    materializedAutomaticallyAdvanceableTasks,
  );
  const remainingAutomaticallyAdvanceableTasks =
    automaticallyAdvanceableTasks.filter(
      (task) => !materializedTaskSet.has(task),
    );
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
    implementationState: {
      started: sourceStaticEngineeringCandidate,
      state: sourceStaticEngineeringCandidate
        ? engineeringCandidate.manifestBound
          ? "source-static-engineering-candidate"
          : "dual-sprite-composite-engineering-candidate"
        : "not-started",
      sourceStaticEngineeringCandidate,
      currentJavaScriptOutputPresent: sourceStaticEngineeringCandidate,
      candidateKind: engineeringCandidate?.candidateKind ?? null,
      manifestBound: engineeringCandidate?.manifestBound ?? false,
      canonicalNestedCoverageDeclared:
        engineeringCandidate?.nestedCoverageDeclared ?? false,
      openFrameCount: engineeringCandidate?.renderedFrameCount ?? 0,
      blockedTailFrameCount:
        engineeringCandidate?.blockedTailFrameCount ?? 0,
      implementationAuthorizedByThisReport: false,
      authoritativeRuntimeReachabilityEstablished: false,
      spanishEnabled: false,
      audioEnabled: false,
      rmseComputed: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
    },
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
    implementationStartedCount: count(
      ({implementationState}) => implementationState.started,
    ),
    sourceStaticEngineeringCandidateCount: count(
      ({implementationState}) =>
        implementationState.sourceStaticEngineeringCandidate,
    ),
    manifestBoundSingleSpriteCandidateCount: count(
      ({implementationState}) =>
        implementationState.sourceStaticEngineeringCandidate &&
        implementationState.manifestBound,
    ),
    fullSingleSpriteCandidateCount: count(
      ({implementationState}) =>
        implementationState.candidateKind === "single-sprite-full",
    ),
    safePrefixSingleSpriteCandidateCount: count(
      ({implementationState}) =>
        implementationState.candidateKind === "single-sprite-safe-prefix",
    ),
    independentDualSpriteCompositeCandidateCount: count(
      ({implementationState}) =>
        implementationState.candidateKind ===
          "dual-sprite-composite-prefix",
    ),
    canonicalNestedCoverageCandidateCount: count(
      ({implementationState}) =>
        implementationState.canonicalNestedCoverageDeclared,
    ),
    sourceStaticOpenFrameCount: sum(
      ({implementationState}) => implementationState.openFrameCount,
    ),
    sourceStaticBlockedTailFrameCount: sum(
      ({implementationState}) => implementationState.blockedTailFrameCount,
    ),
    currentJavaScriptOutputPresentCount: count(
      ({implementationState}) =>
        implementationState.currentJavaScriptOutputPresent,
    ),
    authoritativeRuntimeReachabilityEstablishedCount: count(
      ({implementationState}) =>
        implementationState.authoritativeRuntimeReachabilityEstablished,
    ),
    spanishEnabledCount: count(
      ({implementationState}) => implementationState.spanishEnabled,
    ),
    sourceStaticAudioEnabledCount: count(
      ({implementationState}) => implementationState.audioEnabled,
    ),
    rmseComputedCount: count(
      ({implementationState}) => implementationState.rmseComputed,
    ),
    humanVisualReviewPerformedCount: count(
      ({implementationState}) =>
        implementationState.humanVisualReviewPerformed,
    ),
    ownerReviewPerformedCount: count(
      ({implementationState}) => implementationState.ownerReviewPerformed,
    ),
    implementationSpecificationReadyCount: count(
      ({implementationSpecificationReady}) => implementationSpecificationReady,
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
    audioRuntimeEvidencePresentCount: count(
      (item) => area(item, "audioInventory").staticEvidenceArtifact.present,
    ),
    audioStructurallyAuditedCount: count(
      (item) => area(item, "audioInventory").structurallyAudited,
    ),
    audioSpecificationReadyCount: count(
      (item) => area(item, "audioInventory").specificationReady,
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
    coverageNestedRequirementCount: sum(
      (item) => area(item, "fullFrameCoverage").nestedRequirementCount,
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
    strictReadinessPresentCount: count(
      (item) =>
        item.workspace.optionalSpecificationFiles.strictReadiness.present,
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
  historicalPostAdoption,
  sourceDerivedKeyframeSuccessor,
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
  const audioRuntimeEvidence = await optionalJsonState(
    projectRoot,
    `${workspace}/${OPTIONAL_AUDIO_RUNTIME_EVIDENCE}`,
    `${member.animationId} audioRuntimeEvidence`,
  );
  const audioRuntimeEvidenceBinding = {
    present: audioRuntimeEvidence.present,
    path: audioRuntimeEvidence.path,
    ...(audioRuntimeEvidence.present
      ? {
        bytes: audioRuntimeEvidence.bytes,
        sha256: audioRuntimeEvidence.sha256,
      }
      : {}),
  };
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
  const sourceDerivedAssetSuccessor = validateAssetSuccessorReceipt(
    records.sourceDerivedAssetSuccessor.document,
    member,
  );
  const sourceDerivedKeyframeSuccessorMember =
    sourceDerivedKeyframeSuccessor.members.find(
      ({animationId}) => animationId === member.animationId,
    );
  invariant(
    sourceDerivedKeyframeSuccessorMember,
    `${member.animationId}: source-derived keyframe successor member is absent`,
  );
  let historicalStaticReceipt = null;
  let historicalManifestSuccessor = false;
  let effectiveCandidateGenerator = candidateGenerator;
  let effectiveCandidateParser = candidateParser;
  if (historicalPostAdoption) {
    const {
      readG5L4M1StaticReconciliationReceipt,
    } = await import(
      "./reconcile-lesson-m1-static-specification.mjs"
    );
    const historicalReceiptState =
      await readG5L4M1StaticReconciliationReceipt({
        root: projectRoot,
        animationId: member.animationId,
        member,
      });
    historicalStaticReceipt = historicalReceiptState.receipt;
    historicalManifestSuccessor =
      historicalReceiptState.postOutputs?.migrationManifest?.sha256 !==
        historicalStaticReceipt.outputs?.migrationManifest?.after?.sha256;
    invariant(
      historicalManifestSuccessor ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_ID_SET.has(member.animationId),
      `${member.animationId}: historical manifest successor set drifted`,
    );
    invariant(
      historicalStaticReceipt.inputBindingSemantics?.candidateArtifacts ===
        "historical-at-adoption-do-not-require-current-path-byte-identity",
      `${member.animationId}: static reconciliation receipt does not declare historical candidate semantics`,
    );
    for (const [recordKey, receiptKey] of Object.entries(
      HISTORICAL_CANDIDATE_INPUTS,
    )) {
      validateHistoricalCandidateDescriptor({
        member,
        actualBinding: descriptor(records[recordKey]),
        expected: historicalStaticReceipt.inputs?.[receiptKey],
        expectedPath: records[recordKey].path,
        label: recordKey,
      });
    }
    const historicalCandidateReceipt = validatePriorReceipt(
      records.candidateReceipt.document,
      member,
    );
    effectiveCandidateGenerator = {
      path: historicalCandidateReceipt.generatedBy.path,
      bytes: historicalCandidateReceipt.generatedBy.bytes,
      sha256: historicalCandidateReceipt.generatedBy.sha256,
    };
    effectiveCandidateParser = {
      path:
        historicalCandidateReceipt.generatedBy.dependencies
          .swfDefinitionParser.path,
      bytes:
        historicalCandidateReceipt.generatedBy.dependencies
          .swfDefinitionParser.bytes,
      sha256:
        historicalCandidateReceipt.generatedBy.dependencies
          .swfDefinitionParser.sha256,
    };
  }
  const candidatePackage = validateCandidatePackage({
    member,
    migration: records.migrationManifest.document,
    machineAudit: records.machineAudit.document,
    frameDomains: records.frameDomainCandidates.document,
    records,
    candidateGenerator: effectiveCandidateGenerator,
    candidateParser: effectiveCandidateParser,
    releaseManifestBinding,
    historicalStaticReceipt,
    historicalManifestSuccessor,
    sourceDerivedAssetSuccessor,
    sourceDerivedKeyframeSuccessorMember,
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
    audioRuntimeEvidence,
    optionalSpecificationFiles,
    candidatePackage,
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
      audioRuntimeEvidence: audioRuntimeEvidenceBinding,
      inputSetSha256: sha256(stableJson({
        files: boundFiles,
        optionalSpecificationFiles,
        audioRuntimeEvidence: audioRuntimeEvidenceBinding,
      })),
    },
  };
}

async function staticReconciliationState(projectRoot, release) {
  const receiptStates = await Promise.all(
    release.members.map((member) =>
      optionalJsonState(
        projectRoot,
        `migrations/${member.animationId}/audit/machine/${STATIC_RECONCILIATION_RECEIPT_NAME}`,
        `${member.animationId} static reconciliation receipt`,
      ),
    ),
  );
  return classifyStaticReconciliationReceiptState(
    receiptStates.map(({present}) => present),
  );
}

export async function buildReport({projectRoot = defaultProjectRoot} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const [
    releaseManifest,
    sourceScope,
    workspaceReadiness,
    runtimePlanning,
    sourceDerivedKeyframeSuccessor,
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
      readJsonRecord(
        resolvedRoot,
        CORE_INPUTS.sourceDerivedKeyframeSuccessor,
        "source-derived keyframe successor",
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
  validateKeyframeSuccessorReceipt(
    sourceDerivedKeyframeSuccessor.document,
  );
  const reconciliationState = await staticReconciliationState(
    resolvedRoot,
    release,
  );
  validateReleaseReports(
    release,
    sourceScope.document,
    workspaceReadiness.document,
    runtimePlanning.document,
  );
  const members = await Promise.all(
    release.members.map((member) =>
      buildMember(
        resolvedRoot,
        member,
        descriptor(candidateGenerator),
        descriptor(candidateParser),
        descriptor(releaseManifest),
        reconciliationState === "historical-post-adoption",
        sourceDerivedKeyframeSuccessor.document,
      )),
  );
  const summary = summarize(members);
  invariant(
    summary.memberCount === 55 &&
      summary.preRuntimeCandidatePackageMaterializedCount === 55 &&
      summary.preRuntimeCandidateFileCount === 385 &&
      summary.materializedDefinitionCandidateCount === 12066 &&
      summary.materializedScriptCandidateCount === 2332 &&
      summary.materializedDependencyApiCandidateCount === 6 &&
      summary.materializedDependencyOccurrenceCount === 17 &&
      summary.audioRuntimeEvidencePresentCount === 55 &&
      summary.audioStructurallyAuditedCount === 55 &&
      summary.audioSpecificationReadyCount === 0 &&
      summary.manifestRuntimeFactsReconciledCount === 55 &&
      summary.assetInventoryPopulatedCount === 55 &&
      summary.assetInventoryRowCount === 12066 &&
      summary.keyframeInventoryPopulatedCount === 55 &&
      summary.keyframeRowCount === 802 &&
      summary.strictReadinessPresentCount === 55 &&
      summary.scenarioInventoryPresentCount === 55 &&
      summary.frameDomainDispositionPresentCount === 55 &&
      summary.materializedAutomaticallyAdvanceableTaskCount ===
        summary.automaticallyAdvanceableTaskCount &&
      summary.safeMachineCandidateWorkAvailableCount === 0 &&
      summary.safeMachineCandidateWorkMaterializedCount === 55 &&
      summary.remainingAutomaticallyAdvanceableTaskCount === 0 &&
      summary.implementationStartedCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.sourceStaticEngineeringCandidateCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.manifestBoundSingleSpriteCandidateCount === 51 &&
      summary.fullSingleSpriteCandidateCount === 20 &&
      summary.safePrefixSingleSpriteCandidateCount === 31 &&
      summary.independentDualSpriteCompositeCandidateCount === 1 &&
      summary.canonicalNestedCoverageCandidateCount === 51 &&
      summary.sourceStaticOpenFrameCount === 13696 &&
      summary.sourceStaticBlockedTailFrameCount === 3020 &&
      summary.currentJavaScriptOutputPresentCount ===
        SOURCE_STATIC_ENGINEERING_CANDIDATE_IDS.length &&
      summary.coverageRequirementCount === 212 &&
      summary.coverageRootOnlyRequirementCount === 110 &&
      summary.coverageNestedRequirementCount === 102 &&
      summary.coverageRequiredFrameCount === 34508 &&
      summary.coverageMissingFrameCount === 34508 &&
      summary.authoritativeRuntimeReachabilityEstablishedCount === 0 &&
      summary.spanishEnabledCount === 0 &&
      summary.sourceStaticAudioEnabledCount === 0 &&
      summary.rmseComputedCount === 0 &&
      summary.humanVisualReviewPerformedCount === 0 &&
      summary.ownerReviewPerformedCount === 0 &&
      summary.implementationSpecificationReadyCount === 0 &&
      summary.authoritativeRuntimeSessionCount === 0 &&
      summary.strictCompleteCount === 0 &&
      summary.publishedCount === 0,
    "G5 L4 specification report crossed an implementation or acceptance boundary",
  );
  const coreBindings = {
    releaseManifest: descriptor(releaseManifest),
    sourceScope: descriptor(sourceScope),
    workspaceReadiness: descriptor(workspaceReadiness),
    runtimePlanning: descriptor(runtimePlanning),
    sourceDerivedKeyframeSuccessor:
      descriptor(sourceDerivedKeyframeSuccessor),
    candidateMaterializer: descriptor(candidateGenerator),
    candidateParser: descriptor(candidateParser),
  };
  const report = {
    schemaVersion: 1,
    reportType: "g5-l4-pre-implementation-specification-readiness",
    releaseId: RELEASE_ID,
    title: TITLE,
    scope:
      "Read-only audit of the 55 canonical G5 L4 workspaces, their historical hash-bound pre-runtime packages, current source-derived asset/keyframe candidate successors, 51 manifest-bound single-sprite current-JavaScript engineering candidates, and the independently evidenced FQ001 dual-sprite composite candidate against the flash-to-js specification contract",
    authority:
      "Machine classification and report-only verification. All 55 workspaces have source-derived asset and keyframe candidate rows, but those rows are not final asset specifications or authoritative observed-runtime keyframes. Fifty-two bounded canonical current-JavaScript engineering outputs are observed, including one independently evidenced FQ001 dual-sprite composite whose canonical frame-domain disposition and nested coverage remain unresolved. Product-only FQ002/FQ003 question atlases are deliberately excluded from this canonical source-static count; this report creates no runtime reachability, authoritative baseline, Spanish/audio completeness, RMSE, human/owner review, fidelity acceptance, strict-completion, or publication authority.",
    generator: {
      ...descriptor(generator),
      version: 3,
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
    failClosedConclusions: [
      "All 55 workspaces now have seven hash-bound, acceptance-neutral pre-runtime candidate files (385 total), but none has a complete implementation specification.",
      "Exactly 52 bounded canonical current-JavaScript engineering candidates are present: 20 full single-sprite candidates, 31 safe-prefix single-sprite candidates, and one independently evidenced FQ001 dual-sprite composite candidate. Their 13,696 open frames do not authorize the 3,020 blocked tail frames.",
      "The 51 manifest-bound single-sprite candidates declare conservative nested coverage. FQ001 remains canonical root-only with unresolved frame-domain disposition; its dual-sprite evidence does not create canonical nested coverage. Product-only FQ002/FQ003 question atlases remain outside this canonical count.",
      `Static audio evidence is present for ${summary.audioRuntimeEvidencePresentCount}/55 members, but spoken language, runtime reachability, synchronization, named-human listening, and acceptance remain unresolved.`,
      `Canonical M1 reconciliation is complete for ${summary.manifestRuntimeFactsReconciledCount}/55 manifests; strict-readiness/scenario/frame-domain planning artifacts remain present for ${summary.strictReadinessPresentCount}/${summary.scenarioInventoryPresentCount}/${summary.frameDomainDispositionPresentCount} members.`,
      "All 55 canonical asset/keyframe CSVs now contain source-derived candidate rows (12,066 definition rows and 802 static keyframe candidates). They remain non-final: asset placement/visual/renderer dispositions and authoritative runtime keyframes are unresolved. Coverage has 110 pending root requirements plus 102 conservative pending nested requirements; none has authoritative baseline evidence.",
      "The historical pre-runtime packages and current source-static engineering outputs record static facts only. They do not decide runtime reachability, behavior, Spanish parity, audio, baseline authority, RMSE, human/owner review, strict completion, or publication.",
      "The 44 paired FLA members still require separate named-human read-only authoring audits; the 11 SWF-only members retain an authoring-source gap.",
      "Static absence of an external-call candidate is not proof that runtime dependencies are absent. The three members with candidates require explicit security/product disposition.",
    ],
    writeBoundary: {
      workspaceFilesModifiedByThisGenerator: 0,
      workspaceFilesCreatedByThisGenerator: 0,
      candidateFilesObservedByThisGenerator:
        summary.preRuntimeCandidateFileCount,
      candidateFilesCreatedByThisGenerator: 0,
      sourceStaticEngineeringCandidatesObserved:
        summary.sourceStaticEngineeringCandidateCount,
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
    return `| ${member.ordinal} | \`${member.animationId}\` | ${member.sourceModel} | ${member.preRuntimeCandidatePackage.fileCount} | ${areas.assetInventory.rowCount} | ${areas.audioInventory.rowCount} | ${areas.keyframes.rowCount} | ${areas.fullFrameCoverage.requirementCount} pending | ${areas.frameDomains.nestedDefinitionCount}/${areas.frameDomains.unresolvedReachabilityCount} | ${areas.scriptsAndDependencies.materializedScriptCandidateCount}/0 | ${calls} | ${member.implementationState.state} | no |`;
  }).join("\n");
  const highRiskRows = highRisk.map((member) =>
    `- \`${member.animationId}\`: ${member.specificationAreas.scriptsAndDependencies.externalCallCandidates.map(({api, occurrences}) => `${api} (${occurrences})`).join(", ")}.`,
  ).join("\n");
  const summary = report.summary;
  return `# G5 L4 Specification Readiness\n\n` +
    `> ${report.authority}\n\n` +
    `- Release: \`${report.releaseId}\` — ${report.title}\n` +
    `- Members: **${summary.memberCount}** (${summary.activePageCount} pages + ${summary.shellCount} shell)\n` +
    `- Pre-runtime candidate packages: **${summary.preRuntimeCandidatePackageMaterializedCount}/${summary.memberCount}** (${summary.preRuntimeCandidateFileCount} hash-bound files)\n` +
    `- Report fingerprint: \`${report.reportFingerprintSha256}\`\n` +
    `- Implementation-specification ready: **${summary.implementationSpecificationReadyCount}/${summary.memberCount}**\n` +
    `- Implementation started: **${summary.implementationStartedCount}/${summary.memberCount}**; authorized by this report: **${summary.implementationAuthorizedCount}**\n` +
    `- Source-static current-JavaScript engineering candidates observed: **${summary.sourceStaticEngineeringCandidateCount}/${summary.memberCount}**; authoritative runtime reachability: **${summary.authoritativeRuntimeReachabilityEstablishedCount}/${summary.memberCount}**\n` +
    `- Candidate split: **${summary.fullSingleSpriteCandidateCount} full single-sprite + ${summary.safePrefixSingleSpriteCandidateCount} safe-prefix single-sprite + ${summary.independentDualSpriteCompositeCandidateCount} independently evidenced dual-sprite composite**; open/blocked-tail frames: **${summary.sourceStaticOpenFrameCount}/${summary.sourceStaticBlockedTailFrameCount}**; canonical nested coverage declared by **${summary.canonicalNestedCoverageCandidateCount}** candidates\n` +
    `- Strict complete: **${summary.strictCompleteCount}/${summary.memberCount}**; published: **false**\n\n` +
    `## Exact readiness counts\n\n` +
    `| Area | Current state |\n|---|---:|\n` +
    `| Source/root metadata machine-verified | ${summary.nativeRootMetadataMachineVerifiedCount}/55 |\n` +
    `| Acceptance-neutral candidate packages | ${summary.preRuntimeCandidatePackageMaterializedCount}/55 (${summary.preRuntimeCandidateFileCount} files; seven per member) |\n` +
    `| Candidate artifact classes | runtime facts ${summary.manifestRuntimeFactsCandidateCount}/55; asset census ${summary.assetDefinitionCensusCandidateCount}/55; definition CSV ${summary.definitionInventoryCandidateCount}/55; scripts ${summary.scriptInventoryCandidateCount}/55; dependencies ${summary.dependencyInventoryCandidateCount}/55; brief prefill ${summary.migrationBriefStaticPrefillCandidateCount}/55; receipts ${summary.preRuntimeCandidateReceiptCount}/55 |\n` +
    `| Manifest runtime facts fully reconciled | ${summary.manifestRuntimeFactsReconciledCount}/55 |\n` +
    `| Asset inventories populated | ${summary.assetInventoryPopulatedCount}/55 canonical (${summary.assetInventoryRowCount} rows); ${summary.materializedDefinitionCandidateCount} machine definition candidates materialized |\n` +
    `| Audio inventories populated | ${summary.audioInventoryPopulatedCount}/55 (${summary.structuralAudioInventoryRowCount} structural rows); static audio evidence ${summary.audioRuntimeEvidencePresentCount}/55 present and ${summary.audioStructurallyAuditedCount}/55 structurally audited; ${summary.audioSpecificationReadyCount}/55 accepted/not-required dispositions |\n` +
    `| Keyframe inventories populated | ${summary.keyframeInventoryPopulatedCount}/55 (${summary.keyframeRowCount} rows) |\n` +
    `| Coverage | ${summary.coverageRequirementCount} pending requirements (${summary.coverageRootOnlyRequirementCount} root + ${summary.coverageNestedRequirementCount} conservative nested); ${summary.coverageMissingFrameCount}/${summary.coverageRequiredFrameCount} frames missing |\n` +
    `| Engineering-candidate fidelity gates | ${summary.spanishEnabledCount}/${summary.sourceStaticEngineeringCandidateCount} Spanish enabled; ${summary.sourceStaticAudioEnabledCount}/${summary.sourceStaticEngineeringCandidateCount} audio enabled; ${summary.rmseComputedCount}/${summary.sourceStaticEngineeringCandidateCount} RMSE computed; ${summary.humanVisualReviewPerformedCount}/${summary.sourceStaticEngineeringCandidateCount} human reviewed; ${summary.ownerReviewPerformedCount}/${summary.sourceStaticEngineeringCandidateCount} owner reviewed |\n` +
    `| Migration briefs substantively completed | ${summary.migrationBriefSubstantivelyCompletedCount}/55 (${summary.migrationBriefTemplateCount} templates) |\n` +
    `| Machine audits complete | ${summary.machineAuditCompleteCount}/55 (${summary.machineAuditPartialCount} partial) |\n` +
    `| Frame-domain dispositions | ${summary.frameDomainDispositionPresentCount}/55 present; ${summary.completeFrameDomainDispositionCount}/55 complete; ${summary.unresolvedNestedReachabilityCount}/${summary.nestedDefinitionCount} nested reachability unresolved |\n` +
    `| Scenario inventories present | ${summary.scenarioInventoryPresentCount}/55 (${summary.defaultScenarioPlaceholderOnlyCount} default placeholders) |\n` +
    `| Script exports reconciled | ${summary.manifestScriptReconciledCount}/55 canonical; ${summary.materializedScriptCandidateCount} script candidates materialized |\n` +
    `| Dependency inventories present | ${summary.dependencyInventoryPresentCount}/55 canonical; ${summary.dependencyInventoryCandidateCount}/55 static candidates materialized |\n` +
    `| External-call candidates | ${summary.externalCallCandidateMemberCount} members; ${summary.externalCallCandidateApiCount} API rows; ${summary.externalCallCandidateOccurrenceCount} occurrences |\n\n` +
    `## Routing boundary\n\n` +
    `The candidate-only machine work is materialized for **${summary.safeMachineCandidateWorkMaterializedCount}/55** members (**${summary.materializedAutomaticallyAdvanceableTaskCount}/${summary.automaticallyAdvanceableTaskCount}** task instances); remaining automatically advanceable task instances: **${summary.remainingAutomaticallyAdvanceableTaskCount}**. All **${summary.originalRuntimeOrHumanDecisionRequiredCount}/55** still require original-runtime or human decisions before a complete implementation specification or fidelity claim can be established. Candidate automation cannot satisfy the second category.\n\n` +
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
    `| # | Animation | Source | Candidate files | Canonical assets | Audio | Keyframes | Coverage | Nested unresolved | Candidate/canonical scripts | External calls | Implementation state | Spec ready |\n` +
    `|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|\n${memberRows}\n\n` +
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
  node scripts/build-g5-l4-specification-readiness.mjs [--check]
  node scripts/build-g5-l4-specification-readiness.mjs [--output-prefix reports/<name>]

Reads the exact 55 G5 L4 workspaces and writes only a fail-closed
specification-readiness JSON/Markdown report, including bounded observation of
the 52 bounded canonical current-JavaScript engineering candidates. It never modifies a workspace,
generates scenario/frame-domain/strict-readiness artifacts, launches a
GUI/runtime, implements a renderer, or changes acceptance.`;
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
    `${result.status === "checked" ? "PASS" : "WROTE"}: G5 L4 specification readiness ` +
      `${summary.implementationSpecificationReadyCount}/${summary.memberCount}; ` +
      `source-static engineering candidates ${summary.sourceStaticEngineeringCandidateCount}/${summary.memberCount}; ` +
      `machine-candidate packages materialized ${summary.preRuntimeCandidatePackageMaterializedCount}/${summary.memberCount} (${summary.preRuntimeCandidateFileCount} files); ` +
      `runtime/human decisions ${summary.originalRuntimeOrHumanDecisionRequiredCount}/${summary.memberCount}; ` +
      `implementation authorized 0; strict 0/55; published false.\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
