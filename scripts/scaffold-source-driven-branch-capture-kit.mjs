#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, mkdir, open, readFile, readdir, realpath, rename, rmdir, stat, unlink} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gzipSync} from "node:zlib";

import {canonicalJson, safeRequirementId} from "./build-course-trace-specs.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  projectionDescriptor,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {assertStrictFullDomainRequirement} from "./lib/strict-full-domain-requirement.mjs";
import {
  DEFAULT_PROJECTOR_APP,
  inspectProjectorRuntime,
  sha256File,
  verifyProjectorRuntimeBinding,
} from "./scaffold-audio-runtime-session-kit.mjs";
import {
  APPROVED_SOURCE_DRIVEN_RUNTIME,
  DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
  SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE,
  SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE,
  SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_PATH,
  SOURCE_DRIVEN_BRANCH_CURRENT_V2_MANIFEST_SHA256,
  SOURCE_DRIVEN_BRANCH_CURRENT_V2_TREE_SHA256,
  SOURCE_DRIVEN_BRANCH_LEGACY_V1_MANIFEST_SHA256,
  SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_MANIFEST_SHA256,
  SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_TREE_SHA256,
  SOURCE_DRIVEN_BRANCH_PROOF_MODE,
  SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT,
  SOURCE_DRIVEN_ENVIRONMENT_STATEMENT,
  SOURCE_DRIVEN_LAUNCH_STATEMENT,
} from "./source-driven-branch-capture-contracts.mjs";

export {
  DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
  SOURCE_DRIVEN_BRANCH_CURRENT_V2_MANIFEST_SHA256,
  SOURCE_DRIVEN_BRANCH_CURRENT_V2_TREE_SHA256,
  SOURCE_DRIVEN_BRANCH_LEGACY_V1_MANIFEST_SHA256,
  SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_MANIFEST_SHA256,
  SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_TREE_SHA256,
} from "./source-driven-branch-capture-contracts.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const INDEX_RELATIVE = "migrations/course-shell-pilot-trace-spec-index.json";
const SHA256 = /^[a-f0-9]{64}$/;
const TRACE_SPEC_GENERATOR_FILE = "scripts/build-course-trace-specs.mjs";
const TRACE_SPEC_GENERATOR_FIELD = "sourceBindings.scheduleDerivation.generator.sha256";
const TRACE_COVERAGE_INCLUDED_PATHS_FIELD = "sourceBindings.fullFrameCoverage.includedPaths";
const HISTORICAL_COURSE_HOST_FIXTURE_ROOT = "work/adobe-course-host-fixtures/generated";
const TRACE_SPEC_TECHNICAL_BINDINGS = Object.freeze([
  Object.freeze({indexKey: "manifest", sourceKey: "migrationManifest"}),
  Object.freeze({indexKey: "coverage", sourceKey: "fullFrameCoverage"}),
  Object.freeze({indexKey: "scenarioInventory", sourceKey: "scenarioInventory"}),
]);
const TRACE_SPEC_RECONSTRUCTION_TRANSFORMS = Object.freeze([
  "technical-binding-manifest-descriptor",
  "technical-binding-coverage-descriptor",
  "technical-binding-scenario-inventory-descriptor",
  "coverage-inventory-technical-projection-sha256",
  "coverage-inventory-file-sha256-at-spec-generation",
  "trace-spec-generator-sha256",
]);
const SOURCE_DRIVEN_CAPTURE_SANDBOX_BYTES = Buffer.from("(version 1)\n(allow default)\n(deny network*)\n(deny appleevent-send)\n(deny file-write*)\n");

export const DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT = "work/source-driven-branch-capture-kits";
export const SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS = "unsigned-empty-template-only-not-evidence";
export const SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT = `${DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT}/_stale-unsigned-template-archive`;
export const SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE = "archive-integrity-v1.json";
export const SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM = "sha256-canonical-json-code-unit-file-sorted-full-inventory-with-mode-v1";
export const SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS = Object.freeze([
  "requirementId",
  "scenario",
  "frameDomainId",
  "traceId",
  "language",
  "seed",
  "requiredRange",
  "entryState",
  "entryStateSha256",
  "baselineAuthorityRequirement",
]);
export const SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS = Object.freeze([
  ...TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
]);
const SOURCE_DRIVEN_BRANCH_V2_TEMPLATE_FILES = Object.freeze([
  "templates/adapter-launch-receipt.template.json",
  "templates/adapter-entry-log.schema.template.jsonl",
  "templates/random-trial-log.schema.template.jsonl",
  "templates/operation-log.schema.template.jsonl",
]);

function portable(value) {
  return value.split(path.sep).join("/");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonl(value) {
  return `${JSON.stringify(value)}\n`;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSha256(value, label) {
  assert(SHA256.test(value || ""), `${label} must be a lowercase SHA-256`);
}

function assertProjectRelative(value, label) {
  assert(typeof value === "string" && value, `${label} must be a non-empty path`);
  assert(!path.isAbsolute(value) && !value.includes("\\") && value !== ".." && !value.startsWith("../"), `${label} must be project-relative`);
  assert(portable(path.normalize(value)) === value, `${label} must be normalized and portable`);
  return value;
}

function inside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

async function resolveFile(root, relative, label) {
  assertProjectRelative(relative, label);
  const candidate = path.resolve(root, relative);
  assert(inside(candidate, root), `${label} escapes the project root`);
  const info = await lstat(candidate).catch(() => null);
  assert(info?.isFile() && !info.isSymbolicLink(), `${label} is missing, not a regular file, or a symlink: ${relative}`);
  const [realRoot, realCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
  assert(inside(realCandidate, realRoot), `${label} resolves outside the project root`);
  return candidate;
}

async function readJsonFile(candidate, label) {
  const bytes = await readFile(candidate);
  try {
    return {value: JSON.parse(bytes.toString("utf8")), bytes, sha256: digest(bytes)};
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function exact(left, right, label) {
  assert(canonicalJson(left) === canonicalJson(right), `${label} is stale or mismatched`);
}

function projectionBinding(expectedSha256, descriptor, binding, label) {
  const expected = projectionDescriptor({
    projection: descriptor.id,
    sha256: expectedSha256,
    excludedPaths: descriptor.excludedPaths || descriptor.excludedRequirementPaths || [],
    includedPaths: descriptor.includedRequirementPaths || [],
  });
  exact(binding, {...binding, ...expected}, label);
  assert(binding?.hashMode === CANONICAL_PROJECTION_ENCODING, `${label} encoding is not canonical-json-v1`);
  exact(binding, {...expected, path: binding.path}, label);
}

function profileEntries(profiles) {
  return profiles.flatMap((profile) => profile.specs.map((spec) => ({profile, spec})));
}

function selectEntry(specFile, profiles) {
  const normalized = assertProjectRelative(specFile, "trace spec");
  const matches = profileEntries(profiles).filter(({spec}) => spec.specFile === normalized);
  assert(matches.length === 1, `trace spec is not one of the four allowlisted EN source-driven branch specs: ${normalized}`);
  return matches[0];
}

export function validateSourceDrivenSpec(spec, profile, expected) {
  const label = `${profile.animationId}/${expected.requirementId}`;
  assert(spec?.animationId === profile.animationId, `${label}: animationId mismatch`);
  assert(spec?.requirementId === expected.requirementId, `${label}: requirementId mismatch`);
  assert(spec?.traceSpecStatus === "source-schedule-ready-for-authoritative-execution", `${label}: trace spec is not ready`);
  assert(spec?.traceModel?.kind === "stateful-natural-trace" && spec?.traceModel?.domainScope === "nested", `${label}: wrong trace model`);
  assert(spec?.identity?.frameDomainId === profile.frameDomainId, `${label}: wrong frame domain`);
  assert(spec?.identity?.scenario === `sound-${expected.outcome}`, `${label}: wrong natural branch`);
  assert(spec?.identity?.language === "en", `${label}: only EN is permitted`);
  assert(spec?.identity?.seed === "0", `${label}: indexed identity seed changed`);
  exact(spec?.identity?.requiredRange, {firstFrame: 1, lastFrame: 142}, `${label}: required range`);
  assert(spec?.identity?.baselineAuthorityRequirement === "original-runtime-natural-trace", `${label}: wrong baseline authority`);
  const derivation = spec?.sourceBindings?.scheduleDerivation;
  assert(derivation?.status === "hash-bound-static-source-derived-minimal-child-entry-candidate-not-runtime-execution", `${label}: wrong derivation status`);
  assert(derivation?.candidateScope === "isolated-minimal-child-entry-adapter-for-exact-preserved-child", `${label}: wrong candidate scope`);
  assert(derivation?.executionEvidenceCreated === false, `${label}: derivation must not claim execution evidence`);
  assert(derivation?.naturalRandomPolicy?.sourceCall === "random(2)", `${label}: source random call changed`);
  assert(derivation?.naturalRandomPolicy?.allowedMethod === "restart-untouched-child-and-classify-naturally-observed-outcome", `${label}: natural outcome policy changed`);
  assert(derivation?.naturalRandomPolicy?.seedInjectionAllowed === false, `${label}: seed injection is forbidden`);
  assert(derivation?.naturalRandomPolicy?.forcedBranchAllowed === false, `${label}: forced branch is forbidden`);
  const schedule = spec?.schedule;
  assert(schedule?.status === "source-evidenced-executable", `${label}: schedule is not executable`);
  assert(schedule?.noExternalActionsRequired === true && schedule?.noActionsRequired === false, `${label}: action policy mismatch`);
  assert(Array.isArray(schedule?.orderedSteps) && schedule.orderedSteps.length === 0, `${label}: external/operator actions must remain empty`);
  assert(schedule?.sourceProvenEventFreeFirstCycle === undefined, `${label}: event-free contract conflicts with source events`);
  const events = schedule?.sourceDrivenEvents;
  assert(Array.isArray(events) && events.length === 3, `${label}: exactly three source-driven events are required`);
  exact(events.map(({order}) => order), [1, 2, 3], `${label}: event order`);
  exact(events.map(({trigger}) => trigger?.frame), [1, 5, 142], `${label}: event frames`);
  for (const event of events) assert(event?.trigger?.timelineId === profile.frameDomainId, `${label}: event timeline mismatch`);
  const instanceName = `Mc_Sound_${expected.outcome}`;
  const objectId = expected.outcome === 0 ? 7 : 8;
  assert(events[0].trigger.execution === "natural-avm1-random-observation-only", `${label}: random event must be observation-only`);
  assert(events[0].sourceTarget?.requiredNaturallyObservedOutcome === expected.outcome, `${label}: random outcome mismatch`);
  assert(events[0].sourceTarget?.seedInjectionAllowed === false, `${label}: event permits seed injection`);
  const selection = events[0].postState?.branchSelection;
  assert(selection?.observedOutcome === expected.outcome && selection?.selectedInstanceName === instanceName && selection?.selectedObjectId === objectId && selection?.seedInjected === false, `${label}: natural selection mismatch`);
  assert(events[1].sourceTarget?.selectedInstanceName === instanceName && events[1].sourceTarget?.selectedObjectId === objectId && events[1].sourceTarget?.command === "gotoAndPlay(2)", `${label}: frame-5 selected audio mismatch`);
  assert(events[1].postState?.selectedAudio?.instanceName === instanceName && events[1].postState?.selectedAudio?.objectId === objectId, `${label}: frame-5 post-state mismatch`);
  assert(events[2].sourceTarget?.command === "stop()" && events[2].postState?.localFrame === 142 && events[2].postState?.localPlayState === "stopped", `${label}: frame-142 stop mismatch`);
  assert(events[2].postState?.naturallyObservedBranch === `sound-${expected.outcome}`, `${label}: terminal branch mismatch`);
  const checkpoints = schedule?.stateCheckpoints;
  assert(Array.isArray(checkpoints) && checkpoints.length === 3, `${label}: three checkpoints are required`);
  exact(checkpoints.map(({expectedState}) => expectedState?.localFrame), [1, 5, 142], `${label}: checkpoint frames`);
  assert(schedule?.terminalSemantics?.kind === "stopped-terminal" && schedule?.terminalSemantics?.expectedState?.localFrame === 142 && schedule?.terminalSemantics?.expectedState?.localPlayState === "stopped", `${label}: terminal semantics mismatch`);
  assert(spec?.executionEvidence?.status === "not-executed-by-this-generator", `${label}: execution evidence status changed`);
  assert(spec?.executionEvidence?.executionReport === null && spec?.executionEvidence?.originalRuntimeCaptureManifest === null, `${label}: execution evidence must be empty`);
}

async function loadCurrentBindings(root, specFile, profiles) {
  const {profile, spec: expected} = selectEntry(specFile, profiles);
  assert(profile.captureEligible === true, `${profile.animationId}/${expected.requirementId}: capture kit blocked — ${profile.captureBlocker || "shared profile is not explicitly capture-eligible"}`);
  const specPath = await resolveFile(root, specFile, "trace spec");
  const specDocument = await readJsonFile(specPath, "trace spec");
  validateSourceDrivenSpec(specDocument.value, profile, expected);
  const workspaceRelative = `migrations/${profile.animationId}`;
  const workspace = path.join(root, workspaceRelative);
  const manifestRelative = `${workspaceRelative}/${specDocument.value.sourceBindings.migrationManifest.path}`;
  const coverageRelative = `${workspaceRelative}/${specDocument.value.sourceBindings.fullFrameCoverage.path}`;
  const inventoryRelative = `${workspaceRelative}/${specDocument.value.sourceBindings.scenarioInventory.path}`;
  const [manifestDocument, coverageDocument, inventoryDocument, indexDocument] = await Promise.all([
    readJsonFile(await resolveFile(root, manifestRelative, "migration manifest"), "migration manifest"),
    readJsonFile(await resolveFile(root, coverageRelative, "full-frame coverage"), "full-frame coverage"),
    readJsonFile(await resolveFile(root, inventoryRelative, "scenario inventory"), "scenario inventory"),
    readJsonFile(await resolveFile(root, INDEX_RELATIVE, "trace-spec index"), "trace-spec index"),
  ]);
  assert(manifestDocument.value?.animationId === profile.animationId || manifestDocument.value?.id === profile.animationId, "migration manifest animation mismatch");
  assert(coverageDocument.value?.animationId === profile.animationId, "coverage animation mismatch");
  assert(inventoryDocument.value?.animationId === profile.animationId, "scenario inventory animation mismatch");
  projectionBinding(technicalManifestSha256(manifestDocument.value), TECHNICAL_MANIFEST_PROJECTION, specDocument.value.sourceBindings.migrationManifest, "technical manifest projection");
  projectionBinding(traceCoverageSha256(coverageDocument.value), TRACE_COVERAGE_PROJECTION, specDocument.value.sourceBindings.fullFrameCoverage, "trace coverage projection");
  projectionBinding(scenarioInventorySha256(inventoryDocument.value), SCENARIO_INVENTORY_PROJECTION, specDocument.value.sourceBindings.scenarioInventory, "scenario inventory projection");
  const source = specDocument.value.sourceBindings.sourceSwf;
  assert(source?.sha256 === profile.childSha256, "trace spec source child hash differs from the allowlisted fixture");
  const sourcePath = await resolveFile(root, source.path, "preserved source child");
  assert(await sha256File(sourcePath) === source.sha256, "preserved source child hash is stale");
  const generator = specDocument.value.sourceBindings.scheduleDerivation.generator;
  const generatorPath = await resolveFile(root, generator.path, "trace-spec generator");
  assert(await sha256File(generatorPath) === generator.sha256, "trace-spec generator hash is stale");
  const requirementMatches = (coverageDocument.value.requirements || []).filter(({requirementId}) => requirementId === expected.requirementId);
  assert(requirementMatches.length === 1, "coverage must contain exactly one matching requirement");
  assertStrictFullDomainRequirement(
    requirementMatches[0],
    specDocument.value.frameDomain.frameCount,
    `${profile.animationId}/${expected.requirementId} source-driven original-runtime kit`,
  );
  const coverageIdentity = Object.fromEntries(TRACE_COVERAGE_PROJECTION.includedRequirementPaths.filter((key) => requirementMatches[0][key] !== undefined).map((key) => [key, requirementMatches[0][key]]));
  const specIdentity = {
    requirementId: specDocument.value.requirementId,
    scenario: specDocument.value.identity.scenario,
    frameDomainId: specDocument.value.identity.frameDomainId,
    traceId: specDocument.value.identity.traceId,
    language: specDocument.value.identity.language,
    seed: specDocument.value.identity.seed,
    requiredRange: specDocument.value.identity.requiredRange,
    entryState: requirementMatches[0].entryState,
    entryStateSha256: specDocument.value.identity.entryStateSha256,
    baselineAuthorityRequirement: specDocument.value.identity.baselineAuthorityRequirement,
  };
  exact(coverageIdentity, specIdentity, "coverage/spec identity");
  const pilots = (indexDocument.value.pilots || []).filter(({animationId}) => animationId === profile.animationId);
  assert(pilots.length === 1, "trace-spec index must contain one animation entry");
  const indexed = (pilots[0].traceSpecs || []).filter(({requirementId}) => requirementId === expected.requirementId);
  assert(indexed.length === 1, "trace-spec index must contain one requirement entry");
  const indexEntry = indexed[0];
  assert(indexEntry.file === specFile && indexEntry.sha256 === specDocument.sha256, "trace-spec index file/hash binding is stale");
  assert(indexEntry.status === specDocument.value.traceSpecStatus && indexEntry.traceModel === "stateful-natural-trace", "trace-spec index status/model mismatch");
  assert(indexEntry.expectedExecutionReport === `${workspaceRelative}/${specDocument.value.executionEvidence.expectedExecutionReportPath}`, "trace-spec index execution-report path mismatch");
  assert(pilots[0].sourceSwfSha256 === source.sha256, "trace-spec index source hash mismatch");
  const {path: _manifestPath, ...manifestBinding} = specDocument.value.sourceBindings.migrationManifest;
  const {path: _coveragePath, ...coverageBinding} = specDocument.value.sourceBindings.fullFrameCoverage;
  const {path: _inventoryPath, ...inventoryBinding} = specDocument.value.sourceBindings.scenarioInventory;
  exact(pilots[0].technicalBindings.manifest, manifestBinding, "index manifest projection");
  exact(pilots[0].technicalBindings.coverage, coverageBinding, "index coverage projection");
  exact(pilots[0].technicalBindings.scenarioInventory, inventoryBinding, "index inventory projection");
  return {profile, expected, specFile, specPath, specDocument, indexDocument, sourcePath, manifestDocument, coverageDocument, inventoryDocument};
}

async function loadFixture(root, bound) {
  const manifestPath = await resolveFile(root, bound.profile.fixtureManifest, "safe adapter fixture manifest");
  const document = await readJsonFile(manifestPath, "safe adapter fixture manifest");
  assert(document.sha256 === bound.profile.fixtureManifestSha256, "safe adapter fixture manifest hash is not the exact allowlisted identity");
  const fixture = document.value;
  assert(fixture.animationId === bound.profile.animationId && fixture.fixtureDigest === bound.profile.fixtureDigest, "safe adapter fixture identity mismatch");
  assert(fixture.directory === portable(path.dirname(bound.profile.fixtureManifest)), "safe adapter fixture directory binding mismatch");
  assert(fixture.generatedBy === "scripts/build-adobe-course-host-fixtures.mjs", "safe adapter generator path mismatch");
  assert(fixture.sandbox?.networkDenied === true && fixture.sandbox?.localTcpDenied === true && fixture.sandbox?.appleEventsDenied === true && fixture.sandbox?.outsideWriteDenied === true, "safe adapter fixture sandbox is not fail-closed");
  assert(fixture.strictAcceptanceEffect?.startsWith("none;"), "safe adapter fixture must have no strict-acceptance effect");
  assert(fixture.source?.childSwf === bound.specDocument.value.sourceBindings.sourceSwf.path && fixture.source?.childSwfSha256 === bound.profile.childSha256, "safe adapter child binding mismatch");
  assert(fixture.evidenceHashes?.scenarioInventorySha256 === bound.inventoryDocument.sha256, "safe adapter fixture scenario-inventory raw hash is stale");
  const audioAuditPath = await resolveFile(root, fixture.source.audioAudit, "safe adapter audio audit");
  assert(await sha256File(audioAuditPath) === fixture.evidenceHashes?.audioAuditSha256, "safe adapter fixture audio-audit hash is stale");
  const generatedByPath = await resolveFile(root, fixture.generatedBy, "safe adapter fixture generator");
  assert(await sha256File(generatedByPath) === fixture.generatedBySha256, "safe adapter fixture generator hash is stale");
  const fixtureRoot = path.dirname(manifestPath);
  const entries = fixture.generatedFileHashes || [];
  assert(entries.length > 0 && new Set(entries.map(({path: file}) => file)).size === entries.length, "safe adapter generated file inventory is empty or duplicated");
  const files = new Map();
  for (const item of entries) {
    assertProjectRelative(item.path, "safe adapter generated file");
    assertSha256(item.sha256, `safe adapter ${item.path}`);
    const absolute = await resolveFile(root, portable(path.relative(root, path.join(fixtureRoot, item.path))), `safe adapter ${item.path}`);
    const bytes = await readFile(absolute);
    assert(digest(bytes) === item.sha256, `safe adapter generated file hash is stale: ${item.path}`);
    files.set(item.path, {absolute, bytes, sha256: item.sha256});
  }
  for (const required of ["host.swf", "fixture-spec.json", "sandbox.sb", bound.profile.childRuntimePath]) assert(files.has(required), `safe adapter runtime file is missing: ${required}`);
  assert(files.get("host.swf").sha256 === bound.profile.hostSha256, "safe adapter host hash mismatch");
  assert(files.get("fixture-spec.json").sha256 === bound.profile.fixtureSpecSha256, "safe adapter fixture-spec hash mismatch");
  assert(files.get("sandbox.sb").sha256 === bound.profile.upstreamSandboxSha256, "safe adapter upstream sandbox hash mismatch");
  assert(files.get(bound.profile.childRuntimePath).sha256 === bound.profile.childSha256, "safe adapter staged child hash mismatch");
  assert(files.get("sandbox.sb").bytes.toString("utf8").includes("(deny network*)"), "safe adapter upstream sandbox does not deny network");
  return {manifestPath, document, fixture, files};
}

function runtimeIdentity(runtime) {
  return {
    runtimeId: runtime.runtimeId,
    name: runtime.name,
    version: runtime.version,
    requestedAppPath: runtime.requestedAppPath,
    appPath: runtime.appPath,
    executablePath: runtime.executablePath,
    executableSha256: runtime.executableSha256,
  };
}

async function assertApprovedSourceDrivenRuntime(root, runtime, testOnlyApprovedRuntime) {
  const [realRoot, realProjectRoot] = await Promise.all([realpath(root), realpath(PROJECT_ROOT)]);
  if (testOnlyApprovedRuntime !== undefined) {
    assert(realRoot !== realProjectRoot, "test-only source-driven runtime approval is forbidden for the repository root");
    assert(testOnlyApprovedRuntime !== null && typeof testOnlyApprovedRuntime === "object" && !Array.isArray(testOnlyApprovedRuntime), "test-only source-driven runtime approval must be an object");
  }
  const approved = testOnlyApprovedRuntime ?? APPROVED_SOURCE_DRIVEN_RUNTIME;
  exact({
    runtimeId: runtime.runtimeId,
    name: runtime.name,
    version: runtime.version,
    executableSha256: runtime.executableSha256,
  }, {
    runtimeId: approved.runtimeId,
    name: approved.name,
    version: approved.version,
    executableSha256: approved.executableSha256,
  }, "source-driven approved Projector runtime");
}

function historicalV2OperatorCard(bound) {
  const branch = `sound-${bound.expected.outcome}`;
  return `# Source-driven branch capture operator card\n\n` +
    `Status: **unsigned empty template only — not evidence**.\n\n` +
    `This kit stages an **isolated minimal adapter** around the exact preserved child. It is not the original HELP Math course shell, does not prove course navigation, and has no authority for English/Spanish spoken content, listening quality, SoundStream synchronization, Replay, RMSE, strict completion, human review, or owner acceptance.\n\n` +
    `Target: \`${bound.specDocument.value.animationId}\` / \`${bound.specDocument.value.requirementId}\`; naturally observed target branch: \`${branch}\`.\n\n` +
    `The source executes untouched AVM1 \`random(2)\`. Never inject a seed, patch a variable, force a branch, edit the child, dispatch an operator action, or infer the outcome. A future separately authorized named-human session may restart the untouched staged child until \`${branch}\` occurs naturally, then classify that observed outcome. Frames 1, 5, and 142 are source-driven events; all 142 local frames must be naturally observed in order.\n\n` +
    `The scaffold and \`--check\` commands never launch Adobe Flash Player, open a SWF, capture a frame, listen to audio, fill identity fields, or approve anything. No launcher is included. The staged host and child are read-only, the supplied capture sandbox denies all network and file writes, and source-assets must never be opened directly. A separate reviewed runtime controller and disposable isolated environment are required before any real session.\n`;
}

function operatorCard(bound) {
  const branch = `sound-${bound.expected.outcome}`;
  return `# Source-driven branch capture operator card\n\n` +
    `Status: **unsigned empty template only — not evidence**.\n\n` +
    `This kit stages an **isolated minimal adapter** around the exact preserved child. It is not the original HELP Math course shell, does not prove course navigation, and has no authority for English/Spanish spoken content, listening quality, SoundStream synchronization, Replay, RMSE, strict completion, human review, or owner acceptance.\n\n` +
    `Target: \`${bound.specDocument.value.animationId}\` / \`${bound.specDocument.value.requirementId}\`; naturally observed target branch: \`${branch}\`.\n\n` +
    `The source executes untouched AVM1 \`random(2)\`. An accepted session contains exactly one natural random attempt. Never restart inside that accepted session, inject a seed, patch a variable, force a branch, edit the child, dispatch an operator action, or infer the outcome. A nonmatching outcome ends that session without acceptance; a future separately authorized session starts from a fresh adapter entry. Frames 1, 5, and 142 are source-driven events; all 142 local frames must be naturally observed in order.\n\n` +
    `The raw adapter, random, event, frame, and unified-operation records form the v3 cross-stream causal contract. The named-human attestation and candidate-input capture manifest bind its master root, intermediate, and final hashes. Only the separate candidate preparer may produce a pending candidate; these templates cannot create canonical evidence or any acceptance.\n\n` +
    `The scaffold and \`--check\` commands never launch Adobe Flash Player, open a SWF, capture a frame, listen to audio, fill identity fields, or approve anything. No launcher is included. The staged host and child are read-only, the supplied capture sandbox denies all network and file writes, and source-assets must never be opened directly. A separate reviewed runtime controller and disposable isolated environment are required before any real session.\n`;
}

function legacyV1SchemaTemplate(kind, bound, expectedCount) {
  return {
    schemaVersion: 1,
    templateStatus: SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS,
    recordKind: kind,
    expectedCount,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    traceSpecSha256: bound.specDocument.sha256,
    humanIdentity: {fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    sessionId: "",
    observedAt: null,
    records: [],
    strictAcceptanceEffect: false,
  };
}

function schemaTemplate(kind, bound, expectedCount, evidenceType = kind) {
  const legacy = legacyV1SchemaTemplate(kind, bound, expectedCount);
  return {
    schemaVersion: legacy.schemaVersion,
    templateStatus: legacy.templateStatus,
    recordKind: legacy.recordKind,
    evidenceType,
    expectedCount: legacy.expectedCount,
    animationId: legacy.animationId,
    requirementId: legacy.requirementId,
    traceSpecSha256: legacy.traceSpecSha256,
    humanIdentity: legacy.humanIdentity,
    sessionId: legacy.sessionId,
    observedAt: legacy.observedAt,
    records: legacy.records,
    strictAcceptanceEffect: legacy.strictAcceptanceEffect,
  };
}

function namedHumanTemplate() {
  return {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""};
}

function kitRelativeRoot(bound) {
  return `${DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT}/${bound.profile.animationId}/${safeRequirementId(bound.expected.requirementId)}`;
}

function environmentIsolationReceiptTemplate(bound) {
  return {
    schemaVersion: 1,
    evidenceType: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.environmentIsolationReceipt,
    sessionId: null,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    isolationMode: null,
    operatingSystem: {productVersion: null, buildVersion: null, architecture: null},
    account: {userName: null, uid: null, homeDirectory: null, realOsAccount: null, dedicatedToCapture: null},
    profile: {identifier: null, createdForSession: null, reused: null, normalSharedObjectReadWriteSemantics: null, resetOrDestroyedAfterSession: null},
    preflight: {runningFlashProcessCount: null, sharedObjectFileCount: null, unexpectedFiles: []},
    postflight: {unexpectedWrites: [], unexpectedNetworkEvents: [], profileResetOrDestroyed: null},
    operator: namedHumanTemplate(),
    startedAt: null,
    endedAt: null,
    signedAt: null,
    statement: SOURCE_DRIVEN_ENVIRONMENT_STATEMENT,
    receiptSha256: null,
  };
}

function runtimeToolchainReceiptTemplate(bound, runtime, sandboxSha256) {
  return {
    schemaVersion: 1,
    evidenceType: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.toolchainReceipt,
    runtime: {runtimeId: runtime.runtimeId, name: runtime.name, version: runtime.version},
    captureSessionBinding: {
      sessionId: null,
      traceSpecSha256: bound.specDocument.sha256,
      traceSpecIndexSha256: bound.indexDocument.sha256,
      sourceSwfSha256: bound.specDocument.value.sourceBindings.sourceSwf.sha256,
      captureKitManifestSha256: null,
      sandboxProfileSha256: sandboxSha256,
      environmentIsolationReceiptSha256: null,
      launchReceiptSha256: null,
    },
    capturedAt: null,
    identityArtifacts: [{kind: "executable-sha256-receipt", file: null, sha256: null}],
  };
}

function legacyV1CapturePlan(bound) {
  return {
    schemaVersion: 1,
    templateStatus: SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    humanIdentity: {fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    sessionId: "",
    startedAt: null,
    endedAt: null,
    runtimeLaunched: false,
    naturallyObservedOutcome: null,
    expectedNaturallyObservedOutcome: bound.expected.outcome,
    seedInjected: null,
    forcedBranch: null,
    operatorActions: [],
    observedSourceDrivenEvents: [],
    observedCheckpoints: [],
    capturedFrames: [],
    strictAcceptanceEffect: false,
  };
}

function adapterLaunchReceiptTemplateV2(bound, runtime, fixture) {
  return {
    schemaVersion: 1,
    evidenceType: "named-human-source-driven-projector-launch-receipt",
    templateStatus: SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS,
    inputRequiredFields: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.launchReceipt,
    nestedRequiredFields: {
      runtime: ["runtimeId", "name", "version", "executableSha256"],
      adapter: ["file", "sha256", "readOnly", "minimalAdapterOnly"],
      projectorStart: ["executablePath", "processId", "startedAt", "launchedByNamedHuman", "launchedByCandidatePreparer"],
      adapterOpen: ["file", "sha256", "openedAt", "playerWindowObserved", "sandboxProfileApplied", "networkDenied"],
      operator: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.namedHuman,
    },
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    sessionId: "",
    humanIdentity: {fullName: "", role: "", organizationOrOwnerId: "", contact: ""},
    runtime: runtimeIdentity(runtime),
    adapter: {
      fixtureManifestSha256: fixture.document.sha256,
      hostFile: "runtime-tree/host.swf",
      hostSha256: bound.profile.hostSha256,
      childFile: `runtime-tree/${bound.profile.childRuntimePath}`,
      childSha256: bound.profile.childSha256,
      originalCourseShell: false,
    },
    environmentIsolationReceipt: {file: null, sha256: null},
    runtimeToolchainReceipt: {file: null, sha256: null},
    process: {startedAt: null, processId: null, endedAt: null},
    preTraceActivation: {required: true, observed: false, operationSequence: null, occurredAt: null},
    beginHandoff: {expectedCount: 1, observedCount: 0, operationSequence: null, occurredAt: null},
    randomPolicy: {sourceCall: "random(2)", seedInjectionAllowed: false, forcedBranchAllowed: false},
    operatorDispatchCount: 0,
    receiptSha256: null,
    strictAcceptanceEffect: false,
  };
}

function adapterLaunchReceiptTemplate(bound, runtime, sandboxSha256) {
  const kitRoot = kitRelativeRoot(bound);
  const adapterFile = `${kitRoot}/runtime-tree/host.swf`;
  return {
    schemaVersion: 1,
    evidenceType: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.launchReceipt,
    sessionId: null,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    captureKit: {file: `${kitRoot}/kit-manifest.json`, sha256: null},
    environmentIsolation: {file: null, sha256: null},
    sandboxProfile: {file: `${kitRoot}/sandbox.sb`, sha256: sandboxSha256},
    runtime: {
      runtimeId: runtime.runtimeId,
      name: runtime.name,
      version: runtime.version,
      executableSha256: runtime.executableSha256,
    },
    adapter: {file: adapterFile, sha256: bound.profile.hostSha256, readOnly: true, minimalAdapterOnly: true},
    launchProtocol: "named-human-sandboxed-minimal-adapter-open",
    projectorStart: {
      executablePath: runtime.executablePath,
      processId: null,
      startedAt: null,
      launchedByNamedHuman: null,
      launchedByCandidatePreparer: false,
    },
    adapterOpen: {
      file: adapterFile,
      sha256: bound.profile.hostSha256,
      openedAt: null,
      playerWindowObserved: null,
      sandboxProfileApplied: null,
      networkDenied: null,
    },
    operator: namedHumanTemplate(),
    statement: SOURCE_DRIVEN_LAUNCH_STATEMENT,
    signedAt: null,
    receiptSha256: null,
  };
}

function adapterEntryLogTemplateV2(bound) {
  return {
    ...schemaTemplate("isolated-minimal-adapter-entry-log", bound, 2, "attested-source-driven-adapter-entry"),
    orderedContract: [
      {sequence: 1, eventKind: "pre-trace-activation", expectedCount: 1},
      {sequence: 2, eventKind: "unique-begin-handoff", expectedCount: 1, childRootLabel: "begin", childRootFrame: 6},
    ],
    invariants: [
      "pre-trace activation is observed before any trace frame or source-driven event",
      "exactly one begin handoff enters the exact staged child",
      "no original course-shell behavior is claimed",
    ],
  };
}

function randomTrialLogTemplateV2(bound) {
  return {
    ...schemaTemplate("natural-avm1-random-trial-log", bound, {minimum: 1, maximum: null}, "attested-source-driven-natural-random-trial"),
    targetOutcome: bound.expected.outcome,
    targetBranch: `sound-${bound.expected.outcome}`,
    trialRecordRequiredFields: [
      "trialSequence", "sessionId", "restartObserved", "randomCall", "naturallyObservedOutcome",
      "naturallyObservedBranch", "accepted", "seedInjected", "forcedBranch", "occurredAt",
      "previousRecordSha256", "recordSha256",
    ],
    invariants: [
      "record every attempt without omission in contiguous order",
      "randomCall is untouched AVM1 random(2)",
      "seedInjected and forcedBranch are false for every attempt",
      "exactly one accepted trial exists, is the final record, and naturally matches the target outcome",
      "all rejected attempts precede the accepted trial",
    ],
  };
}

function operationLogTemplateV2(bound) {
  return {
    ...schemaTemplate("unified-natural-branch-operation-log", bound, 145, "attested-source-driven-passive-operation"),
    composition: {frameStateRecords: 142, sourceDrivenEventRecords: 3, operatorDispatchRecords: 0},
    sourceDrivenEventInsertion: [
      {sourceEventOrder: 1, frame: 1, position: "immediately-before-frame-state"},
      {sourceEventOrder: 2, frame: 5, position: "immediately-before-frame-state"},
      {sourceEventOrder: 3, frame: 142, position: "immediately-before-frame-state"},
    ],
    recordRequiredFields: [
      "sequence", "eventKind", "sessionId", "frameDomainId", "localFrame", "occurredAt",
      "monotonicTimeMs", "details", "previousRecordSha256", "recordSha256",
    ],
    invariants: [
      "exactly 145 contiguous records form one append-only hash chain",
      "all 142 one-indexed frame states occur once in natural order",
      "the three source-driven events occur immediately before frame-state records 1, 5, and 142",
      "operator dispatch count is exactly zero",
      "pre-trace activation and unique begin handoff are bound from the adapter-entry log, not invented as operator dispatches",
    ],
  };
}

const MASTER_EVIDENCE_INTERMEDIATE_SOURCES = Object.freeze([
  "adapterEntryLog.finalRecordSha256",
  "randomTrialLog.finalRecordSha256",
  "sourceEventLog.event-1.recordSha256",
  "frameStateLog.frame-0001.recordSha256",
  "frameStateLog.frame-0004.recordSha256",
  "sourceEventLog.event-2.recordSha256",
  "frameStateLog.frame-0005.recordSha256",
  "frameStateLog.frame-0141.recordSha256",
  "sourceEventLog.event-3.recordSha256",
  "frameStateLog.frame-0142.recordSha256",
]);

function masterEvidenceChainTemplate() {
  return {
    algorithm: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.masterBindingAlgorithm,
    root: {source: "adapterEntryLog.sequence-1.recordSha256", sha256: null},
    intermediates: MASTER_EVIDENCE_INTERMEDIATE_SOURCES.map((source, index) => ({sequence: index + 1, source, sha256: null})),
    final: {source: "operationLog.sequence-145.recordSha256", sha256: null},
    bindingSha256: null,
  };
}

function commonRecordTemplate(bound, evidenceType, sandboxSha256) {
  return {
    schemaVersion: 1,
    evidenceType,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    proofMode: SOURCE_DRIVEN_BRANCH_PROOF_MODE,
    sessionId: null,
    acceptedAttemptId: "attempt-0001",
    traceSpecSha256: bound.specDocument.sha256,
    traceSpecIndexSha256: bound.indexDocument.sha256,
    sourceSwfSha256: bound.specDocument.value.sourceBindings.sourceSwf.sha256,
    captureKitManifestSha256: null,
    sandboxProfileSha256: sandboxSha256,
    environmentIsolationReceiptSha256: null,
    launchReceiptSha256: null,
    toolchainReceiptSha256: null,
    sequence: null,
    occurredAt: null,
    monotonicTimeMs: null,
    operator: namedHumanTemplate(),
  };
}

function adapterEntryLogTemplate(bound, sandboxSha256) {
  return {
    ...commonRecordTemplate(bound, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.adapterEntryRecord, sandboxSha256),
    phase: null,
    action: null,
    sourceTarget: null,
    observation: null,
    operatorDispatch: null,
    previousRecordSha256: null,
    recordSha256: null,
  };
}

function randomTrialLogTemplate(bound, sandboxSha256) {
  return {
    ...commonRecordTemplate(bound, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.randomTrialRecord, sandboxSha256),
    attemptId: "attempt-0001",
    restartObserved: null,
    randomCall: "random(2)",
    observedOutcome: null,
    naturallyObservedBranch: null,
    selectedInstanceName: null,
    selectedObjectId: null,
    disposition: null,
    identitySeedInjectedIntoAvm1: false,
    seedInjected: false,
    forcedBranch: false,
    randomOverridden: false,
    branchVariableWrittenByAdapter: false,
    operatorDispatch: false,
    acceptedTraceStarted: null,
    previousRecordSha256: null,
    recordSha256: null,
  };
}

function sourceEventLogTemplate(bound, sandboxSha256) {
  return {
    ...commonRecordTemplate(bound, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.sourceEventRecord, sandboxSha256),
    scheduledEventOrder: null,
    scheduledEventSha256: null,
    observedTrigger: null,
    resolvedSourceTarget: null,
    preState: null,
    preStateSha256: null,
    postState: null,
    postStateSha256: null,
    preStateObservationMethod: null,
    postStateObservationMethod: null,
    preScreenshotFrame: null,
    postScreenshotFrame: null,
    operatorDispatch: false,
    causalPredecessorRecordSha256: null,
    previousRecordSha256: null,
    recordSha256: null,
  };
}

function frameStateLogTemplate(bound, sandboxSha256) {
  return {
    ...commonRecordTemplate(bound, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.frameStateRecord, sandboxSha256),
    frameDomainId: bound.specDocument.value.identity.frameDomainId,
    observedRootFrame: null,
    observedLocalFrame: null,
    naturallyObservedOutcome: null,
    naturallyObservedBranch: null,
    observedState: null,
    observedStateSha256: null,
    screenshotFile: null,
    screenshotSha256: null,
    precedingSourceEventRecordSha256: null,
    previousRecordSha256: null,
    recordSha256: null,
  };
}

function operationLogTemplate(bound, sandboxSha256) {
  return {
    ...commonRecordTemplate(bound, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.operationRecord, sandboxSha256),
    operationKind: null,
    observedFrame: null,
    sourceEventOrder: null,
    referencedRecordSha256: null,
    operatorDispatch: false,
    previousRecordSha256: null,
    recordSha256: null,
  };
}

function sourceBindingSha256(value) {
  return digest(Buffer.from(canonicalJson(value)));
}

function sessionAttestationTemplate(bound, sandboxSha256) {
  const spec = bound.specDocument.value;
  const kitRoot = kitRelativeRoot(bound);
  const nullLog = (recordCount) => ({file: null, sha256: null, recordCount, finalRecordSha256: null});
  return {
    schemaVersion: 1,
    evidenceType: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.sessionAttestation,
    sessionId: null,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    proofMode: SOURCE_DRIVEN_BRANCH_PROOF_MODE,
    traceSpec: {file: bound.specFile, sha256: bound.specDocument.sha256},
    traceSpecIndex: {file: INDEX_RELATIVE, sha256: bound.indexDocument.sha256},
    sourceSwf: spec.sourceBindings.sourceSwf,
    captureKitManifest: {file: `${kitRoot}/kit-manifest.json`, sha256: null},
    sandboxProfile: {file: `${kitRoot}/sandbox.sb`, sha256: sandboxSha256},
    environmentIsolation: {file: null, sha256: null},
    launchReceipt: {file: null, sha256: null},
    toolchainReceipt: {file: null, sha256: null, runtime: null, captureSessionBinding: null},
    adapterEntry: {
      fixtureManifestSha256: bound.profile.fixtureManifestSha256,
      adapterHostSha256: bound.profile.hostSha256,
      childSwfSha256: bound.profile.childSha256,
      childLoadTrigger: null,
      childLoadTriggerCount: null,
      traceStartedAfterOnLoadInit: null,
      beginHandoff: null,
      beginHandoffCount: null,
      rootFrame: null,
      frameDomainId: spec.identity.frameDomainId,
      localFrame: null,
      operatorActionsAfterTraceStart: null,
      directSeekUsed: null,
      frameStepUsed: null,
      completeOriginalCourseShellClaimed: false,
    },
    naturalRandomObservation: {
      sourceCall: "random(2)",
      allowedMethod: "restart-untouched-child-and-classify-naturally-observed-outcome",
      identitySeed: "0",
      identitySeedInjectedIntoAvm1: false,
      seedInjected: false,
      forcedBranch: false,
      randomOverridden: false,
      branchVariableWrittenByAdapter: false,
      attempts: [{attemptId: "attempt-0001", sequence: 1, observedOutcome: null, selectedInstanceName: null, selectedObjectId: null, disposition: null}],
      acceptedAttemptId: "attempt-0001",
    },
    adapterEntryLog: nullLog(2),
    randomTrialLog: nullLog(1),
    operationLog: nullLog(145),
    sourceEventLog: nullLog(3),
    frameStateLog: nullLog(142),
    captureManifest: {file: null, sha256: null},
    frameSet: {
      algorithm: "ordered-frame-path-sha256-v1",
      frameCount: 142,
      frames: Array.from({length: 142}, (_, index) => ({frame: index + 1, file: null, sha256: null})),
      sha256: null,
    },
    scheduleBinding: {
      naturalEntrySha256: sourceBindingSha256(spec.schedule.naturalEntry),
      sourceDrivenEventsSha256: sourceBindingSha256(spec.schedule.sourceDrivenEvents),
      stateCheckpointsSha256: sourceBindingSha256(spec.schedule.stateCheckpoints),
      terminalSemanticsSha256: sourceBindingSha256(spec.schedule.terminalSemantics),
    },
    masterEvidenceChain: masterEvidenceChainTemplate(),
    authority: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority,
    startedAt: null,
    endedAt: null,
    signedAt: null,
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator: namedHumanTemplate(),
    unexpectedEvents: [],
    statement: SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT,
    notes: SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE,
    attestationSha256: null,
  };
}

function captureManifestTemplate(bound) {
  const spec = bound.specDocument.value;
  const kitRoot = kitRelativeRoot(bound);
  const nullLog = (recordCount, extra = {}) => ({file: null, sha256: null, recordCount, finalRecordSha256: null, ...extra});
  return {
    schemaVersion: 1,
    evidenceType: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.captureManifest,
    status: "candidate-input-not-canonical",
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    identity: {
      frameDomainId: spec.identity.frameDomainId,
      traceId: spec.identity.traceId,
      entryStateSha256: spec.identity.entryStateSha256,
      scenario: spec.identity.scenario,
      language: spec.identity.language,
      seed: spec.identity.seed,
    },
    traceSpec: {file: bound.specFile, sha256: bound.specDocument.sha256},
    traceSpecIndex: {file: INDEX_RELATIVE, sha256: bound.indexDocument.sha256},
    sourceSwf: spec.sourceBindings.sourceSwf,
    captureKitManifest: {file: `${kitRoot}/kit-manifest.json`, sha256: null},
    launchReceipt: {file: null, sha256: null},
    sessionId: null,
    acceptedAttemptId: "attempt-0001",
    stage: {width: 800, height: 600},
    fps: 12,
    frameNumbering: "one-indexed",
    frameCount: 142,
    adapterEntryLog: nullLog(2),
    randomTrialLog: nullLog(1),
    operationLog: nullLog(145, {operatorDispatchCount: 0}),
    sourceEventLog: nullLog(3),
    frameStateLog: nullLog(142),
    frames: Array.from({length: 142}, (_, index) => ({
      frame: index + 1,
      file: null,
      sha256: null,
      width: 800,
      height: 600,
      stateRecordSha256: null,
    })),
    orderedFrameSetSha256: null,
    masterEvidenceChain: masterEvidenceChainTemplate(),
    authority: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority,
    strictAcceptanceEffect: false,
  };
}

async function buildSourceDrivenBranchCaptureKitInternal({
  projectRoot = PROJECT_ROOT,
  specFile,
  runtime,
  profiles = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  testOnlyApprovedRuntime,
  historicalBound = null,
}) {
  const root = path.resolve(projectRoot);
  const normalizedRuntime = await verifyProjectorRuntimeBinding(runtime);
  const effectiveTestOnlyApprovedRuntime = testOnlyApprovedRuntime === undefined
    ? runtime?.testOnlyApprovedRuntime
    : testOnlyApprovedRuntime;
  await assertApprovedSourceDrivenRuntime(root, normalizedRuntime, effectiveTestOnlyApprovedRuntime);
  const bound = historicalBound ?? await loadCurrentBindings(root, specFile, profiles);
  const fixture = await loadFixture(root, bound);
  const contractModulePath = await resolveFile(root, SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE, "shared source-driven branch contract module");
  const [contractModuleSha256, importedContractModuleSha256] = await Promise.all([
    sha256File(contractModulePath),
    sha256File(SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_PATH),
  ]);
  assert(contractModuleSha256 === importedContractModuleSha256, "project shared source-driven branch contract module differs from the imported module");
  assert(digest(Buffer.from(canonicalJson(SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT))) === SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256, "shared candidate input contract hash is stale");
  const sandboxBytes = SOURCE_DRIVEN_CAPTURE_SANDBOX_BYTES;
  const sandboxSha256 = digest(sandboxBytes);
  const staged = [
    {source: "host.swf", destination: "runtime-tree/host.swf", role: "minimal-safe-adapter-host"},
    {source: bound.profile.childRuntimePath, destination: `runtime-tree/${bound.profile.childRuntimePath}`, role: "exact-preserved-child"},
    {source: "fixture-spec.json", destination: "runtime-tree/fixture-spec.json", role: "safe-adapter-specification"},
    {source: "sandbox.sb", destination: "runtime-tree/upstream-sandbox.sb", role: "exact-upstream-sandbox-reference"},
  ].map((item) => ({...item, sha256: fixture.files.get(item.source).sha256, bytes: fixture.files.get(item.source).bytes.length, stagedMode: "0444"}));
  const runtimeTreeManifest = {
    schemaVersion: 1,
    artifactType: "source-driven-branch-isolated-minimal-adapter-runtime-tree",
    status: SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    fixtureManifest: {sourceFile: bound.profile.fixtureManifest, sourceSha256: fixture.document.sha256, stagedFile: "runtime-tree/fixture-manifest.json"},
    files: staged,
    isolation: {minimalAdapterOnly: true, originalCourseShellIncluded: false, sourceChildUntouched: true, stagedChildReadOnly: true, networkDenied: true, externalActionsRequired: false},
    strictAcceptanceEffect: false,
  };
  const bindings = {
    schemaVersion: 1,
    traceSpec: {file: bound.specFile, sha256: bound.specDocument.sha256},
    traceSpecIndex: {file: INDEX_RELATIVE, sha256: bound.indexDocument.sha256},
    projections: {
      migrationManifest: bound.specDocument.value.sourceBindings.migrationManifest,
      fullFrameCoverage: bound.specDocument.value.sourceBindings.fullFrameCoverage,
      scenarioInventory: bound.specDocument.value.sourceBindings.scenarioInventory,
    },
    sourceSwf: bound.specDocument.value.sourceBindings.sourceSwf,
    fixtureManifest: {file: bound.profile.fixtureManifest, sha256: fixture.document.sha256, fixtureDigest: bound.profile.fixtureDigest},
  };
  const capturePlan = {
    ...legacyV1CapturePlan(bound),
    adapterLaunchReceipt: {file: "templates/adapter-launch-receipt.template.json", sha256: null},
    adapterEntryLog: {file: "templates/adapter-entry-log.schema.template.jsonl", sha256: null, expectedCount: 2},
    randomTrialLog: {file: "templates/random-trial-log.schema.template.jsonl", sha256: null, expectedCount: 1, acceptedSessionNaturalAttemptCount: 1},
    operationLog: {file: "templates/operation-log.schema.template.jsonl", sha256: null, expectedCount: 145, operatorDispatchCount: 0},
  };
  const templateContents = new Map([
    ["templates/environment-isolation-receipt.template.json", Buffer.from(json(environmentIsolationReceiptTemplate(bound)))],
    ["templates/runtime-toolchain-receipt.template.json", Buffer.from(json(runtimeToolchainReceiptTemplate(bound, normalizedRuntime, sandboxSha256)))],
    ["templates/session-attestation.template.json", Buffer.from(json(sessionAttestationTemplate(bound, sandboxSha256)))],
    ["templates/source-driven-event-log.schema.template.jsonl", Buffer.from(jsonl(sourceEventLogTemplate(bound, sandboxSha256)))],
    ["templates/frame-state-log.schema.template.jsonl", Buffer.from(jsonl(frameStateLogTemplate(bound, sandboxSha256)))],
    ["templates/capture-manifest.template.json", Buffer.from(json(captureManifestTemplate(bound)))],
    ["templates/adapter-launch-receipt.template.json", Buffer.from(json(adapterLaunchReceiptTemplate(bound, normalizedRuntime, sandboxSha256)))],
    ["templates/adapter-entry-log.schema.template.jsonl", Buffer.from(jsonl(adapterEntryLogTemplate(bound, sandboxSha256)))],
    ["templates/random-trial-log.schema.template.jsonl", Buffer.from(jsonl(randomTrialLogTemplate(bound, sandboxSha256)))],
    ["templates/operation-log.schema.template.jsonl", Buffer.from(jsonl(operationLogTemplate(bound, sandboxSha256)))],
  ]);
  for (const field of ["adapterLaunchReceipt", "adapterEntryLog", "randomTrialLog", "operationLog"]) {
    capturePlan[field].sha256 = digest(templateContents.get(capturePlan[field].file));
  }
  const capturePlanBytes = Buffer.from(json(capturePlan));
  const templateContract = {
    schemaVersion: 3,
    candidateInputContract: {
      module: {file: SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE, sha256: contractModuleSha256},
      export: "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT",
      schemaVersion: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.schemaVersion,
      canonicalEncoding: "canonical-json-v1",
      sha256: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
      exact: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
    },
    capturePlan: {file: "capture-plan.template.json", sha256: digest(capturePlanBytes)},
    files: [...templateContents.entries()].map(([file, content]) => ({file, sha256: digest(content)})),
    adapterEntry: {preTraceActivationCount: 1, beginHandoffCount: 1, totalRecordCount: 2},
    randomTrials: {acceptedSessionNaturalAttemptCount: 1, acceptedTrialCount: 1, acceptedTrialMustBeOnlyRecord: true, firstPreviousRecordSha256From: "adapterEntryLog.finalRecordSha256"},
    sourceEvents: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.sourceEvents,
    frameStates: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.frameStates,
    unifiedOperations: {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145, firstRecordPreviousRecordSha256From: "randomTrialLog.finalRecordSha256", everyRecordReferencesExactlyOneRawEventOrFrameRecord: true},
    masterEvidenceChain: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.masterEvidenceChain,
    authority: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority,
  };
  const manifest = {
    schemaVersion: 1,
    artifactType: "source-driven-natural-branch-capture-operator-kit",
    status: SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS,
    animationId: bound.profile.animationId,
    requirementId: bound.expected.requirementId,
    identity: bound.specDocument.value.identity,
    bindings,
    scheduleContract: {
      sourceDrivenEventFrames: [1, 5, 142],
      naturallyObservedOutcome: bound.expected.outcome,
      naturallyObservedBranch: `sound-${bound.expected.outcome}`,
      sourceCall: "random(2)",
      seedInjectionAllowed: false,
      forcedBranchAllowed: false,
      operatorActionsAllowed: 0,
      requiredFrameCount: 142,
      checkpointCount: 3,
      terminalKind: "stopped-terminal",
    },
    runtime: runtimeIdentity(normalizedRuntime),
    runtimeTree: {file: "runtime-tree-manifest.json", sha256: digest(Buffer.from(json(runtimeTreeManifest)))},
    sandbox: {file: "sandbox.sb", sha256: sandboxSha256, networkDenied: true, fileWritesDenied: true, launcherIncluded: false},
    templateContract,
    authority: {
      isolatedMinimalAdapterOnly: true,
      originalShellAuthority: false,
      audioOrLanguageAuthority: false,
      runtimeLaunchedByFactory: false,
      framesCapturedByFactory: 0,
      humanIdentityRecorded: false,
      humanReviewRecorded: false,
      ownerReviewRecorded: false,
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    },
  };
  const files = new Map();
  const add = (file, content, mode = 0o444) => files.set(file, {content: Buffer.from(content), mode});
  add("README.md", `# Unsigned source-driven branch capture kit\n\nThis deterministic, read-only scaffold is not evidence and never launches a runtime. Read OPERATOR_CARD.md before any future separately authorized session.\n`);
  add("OPERATOR_CARD.md", operatorCard(bound));
  add("kit-manifest.json", json(manifest));
  add("bindings/trace-spec.json", bound.specDocument.bytes);
  add("bindings/trace-spec-index.json", bound.indexDocument.bytes);
  add("bindings/projection-bindings.json", json(bindings));
  add("runtime-tree-manifest.json", json(runtimeTreeManifest));
  add("runtime-tree/fixture-manifest.json", fixture.document.bytes);
  for (const item of staged) add(item.destination, fixture.files.get(item.source).bytes);
  add("sandbox.sb", sandboxBytes);
  add("runtime/runtime-identity.json", json(runtimeIdentity(normalizedRuntime)));
  add("runtime/runtime-executable-sha256.txt", `${normalizedRuntime.executableSha256}\n`);
  add("capture-plan.template.json", capturePlanBytes);
  for (const [file, content] of templateContents) add(file, content);
  add("frames/README.md", "# Empty frame directory\n\nThe factory creates no PNGs. A future separately authorized accepted named-human session must contain exactly one natural random attempt and capture exactly 142 naturally reached native-size frames without restart, seed injection, or forced branching.\n");
  return {bound, fixture, runtime: normalizedRuntime, manifest, files};
}

export async function buildSourceDrivenBranchCaptureKit(options) {
  return buildSourceDrivenBranchCaptureKitInternal(options);
}

function applyHistoricalV2CommonFiles(files, kit) {
  files.set("OPERATOR_CARD.md", {content: Buffer.from(historicalV2OperatorCard(kit.bound)), mode: 0o444});
  files.set("frames/README.md", {content: Buffer.from("# Empty frame directory\n\nThe factory creates no PNGs. A future separately authorized named-human session must capture exactly 142 naturally reached native-size frames without seed injection or forced branching.\n"), mode: 0o444});
}

export function buildSourceDrivenBranchLegacyV1Files(kit) {
  assert(kit?.manifest?.artifactType === "source-driven-natural-branch-capture-operator-kit", "legacy-v1 rendering requires a source-driven branch kit");
  const files = new Map([...kit.files.entries()].map(([file, descriptor]) => [file, {...descriptor, content: Buffer.from(descriptor.content)}]));
  for (const file of SOURCE_DRIVEN_BRANCH_V2_TEMPLATE_FILES) files.delete(file);
  files.set("capture-plan.template.json", {content: Buffer.from(json(legacyV1CapturePlan(kit.bound))), mode: 0o444});
  files.set("templates/environment-isolation-receipt.template.json", {content: Buffer.from(json(legacyV1SchemaTemplate("environment-isolation-receipt", kit.bound, 1))), mode: 0o444});
  files.set("templates/runtime-toolchain-receipt.template.json", {content: Buffer.from(json(legacyV1SchemaTemplate("runtime-toolchain-receipt", kit.bound, 1))), mode: 0o444});
  files.set("templates/session-attestation.template.json", {content: Buffer.from(json(legacyV1SchemaTemplate("named-human-session-attestation", kit.bound, 1))), mode: 0o444});
  files.set("templates/source-driven-event-log.schema.template.jsonl", {content: Buffer.from(jsonl(legacyV1SchemaTemplate("source-driven-event-log", kit.bound, 3))), mode: 0o444});
  files.set("templates/frame-state-log.schema.template.jsonl", {content: Buffer.from(jsonl(legacyV1SchemaTemplate("natural-frame-state-log", kit.bound, 142))), mode: 0o444});
  files.set("templates/capture-manifest.template.json", {content: Buffer.from(json(legacyV1SchemaTemplate("lossless-native-frame-capture-manifest", kit.bound, 142))), mode: 0o444});
  const legacyManifest = structuredClone(kit.manifest);
  delete legacyManifest.templateContract;
  files.set("kit-manifest.json", {content: Buffer.from(json(legacyManifest)), mode: 0o444});
  applyHistoricalV2CommonFiles(files, kit);
  assert(files.size === 23, `legacy-v1 expected file count changed: ${files.size}`);
  return {
    variant: "legacy-v1-23-file",
    files,
    manifestSha256: digest(files.get("kit-manifest.json").content),
  };
}

function previousV2TemplateContents(kit) {
  const bound = kit.bound;
  const launch = adapterLaunchReceiptTemplateV2(bound, kit.runtime, kit.fixture);
  launch.evidenceType = "isolated-minimal-adapter-launch-receipt";
  const withoutEvidenceType = (value) => {
    const copy = structuredClone(value);
    delete copy.evidenceType;
    return copy;
  };
  return new Map([
    ["templates/environment-isolation-receipt.template.json", Buffer.from(json(legacyV1SchemaTemplate("environment-isolation-receipt", bound, 1)))],
    ["templates/runtime-toolchain-receipt.template.json", Buffer.from(json(legacyV1SchemaTemplate("runtime-toolchain-receipt", bound, 1)))],
    ["templates/session-attestation.template.json", Buffer.from(json(legacyV1SchemaTemplate("named-human-session-attestation", bound, 1)))],
    ["templates/source-driven-event-log.schema.template.jsonl", Buffer.from(jsonl(legacyV1SchemaTemplate("source-driven-event-log", bound, 3)))],
    ["templates/frame-state-log.schema.template.jsonl", Buffer.from(jsonl(legacyV1SchemaTemplate("natural-frame-state-log", bound, 142)))],
    ["templates/capture-manifest.template.json", Buffer.from(json(legacyV1SchemaTemplate("lossless-native-frame-capture-manifest", bound, 142)))],
    ["templates/adapter-launch-receipt.template.json", Buffer.from(json(launch))],
    ["templates/adapter-entry-log.schema.template.jsonl", Buffer.from(jsonl(withoutEvidenceType(adapterEntryLogTemplateV2(bound))))],
    ["templates/random-trial-log.schema.template.jsonl", Buffer.from(jsonl(withoutEvidenceType(randomTrialLogTemplateV2(bound))))],
    ["templates/operation-log.schema.template.jsonl", Buffer.from(jsonl(withoutEvidenceType(operationLogTemplateV2(bound))))],
  ]);
}

function currentV2TemplateContents(kit) {
  const bound = kit.bound;
  return new Map([
    ["templates/environment-isolation-receipt.template.json", Buffer.from(json(schemaTemplate("environment-isolation-receipt", bound, 1, "named-human-disposable-flash-runtime-environment-receipt")))],
    ["templates/runtime-toolchain-receipt.template.json", Buffer.from(json(schemaTemplate("runtime-toolchain-receipt", bound, 1)))],
    ["templates/session-attestation.template.json", Buffer.from(json(schemaTemplate("named-human-session-attestation", bound, 1, "named-human-source-driven-branch-capture-session-attestation")))],
    ["templates/source-driven-event-log.schema.template.jsonl", Buffer.from(jsonl(schemaTemplate("source-driven-event-log", bound, 3, "attested-source-driven-event-observation")))],
    ["templates/frame-state-log.schema.template.jsonl", Buffer.from(jsonl(schemaTemplate("natural-frame-state-log", bound, 142, "attested-source-driven-natural-frame-state")))],
    ["templates/capture-manifest.template.json", Buffer.from(json(schemaTemplate("lossless-native-frame-capture-manifest", bound, 142, "attested-source-driven-branch-capture-manifest")))],
    ["templates/adapter-launch-receipt.template.json", Buffer.from(json(adapterLaunchReceiptTemplateV2(bound, kit.runtime, kit.fixture)))],
    ["templates/adapter-entry-log.schema.template.jsonl", Buffer.from(jsonl(adapterEntryLogTemplateV2(bound)))],
    ["templates/random-trial-log.schema.template.jsonl", Buffer.from(jsonl(randomTrialLogTemplateV2(bound)))],
    ["templates/operation-log.schema.template.jsonl", Buffer.from(jsonl(operationLogTemplateV2(bound)))],
  ]);
}

function expectedFileMapTree(files) {
  const inventory = [...files.entries()]
    .map(([file, descriptor]) => ({
      file,
      bytes: descriptor.content.length,
      sha256: digest(descriptor.content),
      mode: descriptor.mode,
    }))
    .sort((left, right) => left.file < right.file ? -1 : left.file > right.file ? 1 : 0);
  return {inventory, treeSha256: digest(Buffer.from(canonicalJson(inventory)))};
}

export function buildSourceDrivenBranchCurrentV2Files(kit) {
  assert(kit?.manifest?.artifactType === "source-driven-natural-branch-capture-operator-kit", "current-v2 rendering requires a source-driven branch kit");
  const files = new Map([...kit.files.entries()].map(([file, descriptor]) => [file, {...descriptor, content: Buffer.from(descriptor.content)}]));
  const templateContents = currentV2TemplateContents(kit);
  const capturePlan = {
    ...legacyV1CapturePlan(kit.bound),
    adapterLaunchReceipt: {file: "templates/adapter-launch-receipt.template.json", sha256: digest(templateContents.get("templates/adapter-launch-receipt.template.json"))},
    adapterEntryLog: {file: "templates/adapter-entry-log.schema.template.jsonl", sha256: digest(templateContents.get("templates/adapter-entry-log.schema.template.jsonl")), expectedCount: 2},
    randomTrialLog: {file: "templates/random-trial-log.schema.template.jsonl", sha256: digest(templateContents.get("templates/random-trial-log.schema.template.jsonl")), expectedCount: "all-natural-attempts-through-one-final-accepted-trial"},
    operationLog: {file: "templates/operation-log.schema.template.jsonl", sha256: digest(templateContents.get("templates/operation-log.schema.template.jsonl")), expectedCount: 145, operatorDispatchCount: 0},
  };
  const capturePlanBytes = Buffer.from(json(capturePlan));
  const templateContract = {
    schemaVersion: 2,
    candidateInputContract: {module: "scripts/prepare-source-driven-branch-candidate.mjs", export: "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT", schemaVersion: 1},
    capturePlan: {file: "capture-plan.template.json", sha256: digest(capturePlanBytes)},
    files: [...templateContents.entries()].map(([file, content]) => ({file, sha256: digest(content)})),
    adapterEntry: {preTraceActivationCount: 1, beginHandoffCount: 1, totalRecordCount: 2},
    randomTrials: {recordEveryNaturalAttempt: true, acceptedTrialCount: 1, acceptedTrialMustBeLast: true},
    unifiedOperations: {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145},
  };
  const manifest = structuredClone(kit.manifest);
  manifest.templateContract = templateContract;
  files.set("kit-manifest.json", {content: Buffer.from(json(manifest)), mode: 0o444});
  files.set("capture-plan.template.json", {content: capturePlanBytes, mode: 0o444});
  for (const [file, content] of templateContents) files.set(file, {content, mode: 0o444});
  applyHistoricalV2CommonFiles(files, kit);
  assert(files.size === 27, `current-v2 expected file count changed: ${files.size}`);
  const tree = expectedFileMapTree(files);
  return {
    variant: "current-v2-complete-capture-contract",
    files,
    manifestSha256: digest(files.get("kit-manifest.json").content),
    treeSha256: tree.treeSha256,
    inventory: tree.inventory,
  };
}

export function buildSourceDrivenBranchPreviousV2Files(kit) {
  assert(kit?.manifest?.artifactType === "source-driven-natural-branch-capture-operator-kit", "previous-v2 rendering requires a source-driven branch kit");
  const files = new Map([...kit.files.entries()].map(([file, descriptor]) => [file, {...descriptor, content: Buffer.from(descriptor.content)}]));
  const templateContents = previousV2TemplateContents(kit);
  const capturePlan = {
    ...legacyV1CapturePlan(kit.bound),
    adapterLaunchReceipt: {file: "templates/adapter-launch-receipt.template.json", sha256: digest(templateContents.get("templates/adapter-launch-receipt.template.json"))},
    adapterEntryLog: {file: "templates/adapter-entry-log.schema.template.jsonl", sha256: digest(templateContents.get("templates/adapter-entry-log.schema.template.jsonl")), expectedCount: 2},
    randomTrialLog: {file: "templates/random-trial-log.schema.template.jsonl", sha256: digest(templateContents.get("templates/random-trial-log.schema.template.jsonl")), expectedCount: "all-natural-attempts-through-one-final-accepted-trial"},
    operationLog: {file: "templates/operation-log.schema.template.jsonl", sha256: digest(templateContents.get("templates/operation-log.schema.template.jsonl")), expectedCount: 145, operatorDispatchCount: 0},
  };
  const capturePlanBytes = Buffer.from(json(capturePlan));
  const templateContract = {
    schemaVersion: 2,
    capturePlan: {file: "capture-plan.template.json", sha256: digest(capturePlanBytes)},
    files: [...templateContents.entries()].map(([file, content]) => ({file, sha256: digest(content)})),
    adapterEntry: {preTraceActivationCount: 1, beginHandoffCount: 1, totalRecordCount: 2},
    randomTrials: {recordEveryNaturalAttempt: true, acceptedTrialCount: 1, acceptedTrialMustBeLast: true},
    unifiedOperations: {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145},
  };
  const manifest = structuredClone(kit.manifest);
  manifest.templateContract = templateContract;
  files.set("kit-manifest.json", {content: Buffer.from(json(manifest)), mode: 0o444});
  files.set("capture-plan.template.json", {content: capturePlanBytes, mode: 0o444});
  for (const [file, content] of templateContents) files.set(file, {content, mode: 0o444});
  applyHistoricalV2CommonFiles(files, kit);
  assert(files.size === 27, `previous-v2 expected file count changed: ${files.size}`);
  const tree = expectedFileMapTree(files);
  return {
    variant: "previous-v2-27-file-pre-candidate-contract-alignment",
    files,
    manifestSha256: digest(files.get("kit-manifest.json").content),
    treeSha256: tree.treeSha256,
    inventory: tree.inventory,
  };
}

async function listFiles(root) {
  const result = [];
  async function walk(directory, prefix = "") {
    for (const name of (await readdir(directory)).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const absolute = path.join(directory, name);
      const info = await lstat(absolute);
      assert(!info.isSymbolicLink(), `capture kit contains a symbolic link: ${relative}`);
      if (info.isDirectory()) await walk(absolute, relative);
      else {
        assert(info.isFile(), `capture kit contains a non-regular file: ${relative}`);
        result.push(relative);
      }
    }
  }
  await walk(root);
  return result.sort();
}

async function assertNoSymlinkComponents(root, candidate) {
  const absolute = path.resolve(candidate);
  assert(inside(absolute, root), "capture kit output escapes the project root");
  let current = root;
  for (const part of path.relative(root, absolute).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = await lstat(current).catch(() => null);
    if (!info) return;
    assert(!info.isSymbolicLink(), `capture kit output path contains a symbolic link: ${portable(path.relative(root, current))}`);
  }
}

function nodeIdentity(info) {
  return {dev: String(info.dev), ino: String(info.ino)};
}

function sameNodeIdentity(left, right) {
  return Boolean(left && right && left.dev === right.dev && left.ino === right.ino);
}

function permissionMode(info) {
  return info.mode & 0o777;
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function captureDirectoryIdentity(root, directory, label) {
  await assertNoSymlinkComponents(root, directory);
  const info = await lstat(directory);
  assert(info.isDirectory() && !info.isSymbolicLink(), `${label} must be a real directory`);
  const [actualRoot, actualDirectory] = await Promise.all([realpath(root), realpath(directory)]);
  const confirmed = await lstat(directory);
  assert(
    confirmed.isDirectory() && !confirmed.isSymbolicLink() && sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info)),
    `${label} identity changed while it was being inspected`,
  );
  assert(actualDirectory === path.resolve(actualRoot, path.relative(root, directory)), `${label} resolves outside its fixed path`);
  return {node: nodeIdentity(confirmed), mode: permissionMode(confirmed), realPath: actualDirectory};
}

async function assertDirectoryIdentity(root, directory, expected, label) {
  const observed = await captureDirectoryIdentity(root, directory, label);
  assert(observed.realPath === expected.realPath && sameNodeIdentity(observed.node, expected.node), `${label} identity changed during the transaction`);
  return observed;
}

async function ensureFixedDirectoryTree(root, directory, label) {
  const absoluteRoot = path.resolve(root);
  const absoluteDirectory = path.resolve(directory);
  assert(inside(absoluteDirectory, absoluteRoot), `${label} escapes the project root`);
  let cursor = absoluteRoot;
  let parentIdentity = await captureDirectoryIdentity(root, cursor, `${label} project root`);
  for (const part of path.relative(absoluteRoot, absoluteDirectory).split(path.sep).filter(Boolean)) {
    await assertDirectoryIdentity(root, cursor, parentIdentity, `${label} parent`);
    cursor = path.join(cursor, part);
    const existing = await lstatIfPresent(cursor);
    if (!existing) await mkdir(cursor, {recursive: false, mode: 0o755});
    else assert(existing.isDirectory() && !existing.isSymbolicLink(), `${label} component is not a real directory: ${portable(path.relative(root, cursor))}`);
    const childIdentity = await captureDirectoryIdentity(root, cursor, `${label} component`);
    await assertDirectoryIdentity(root, path.dirname(cursor), parentIdentity, `${label} parent`);
    parentIdentity = childIdentity;
  }
  return {path: absoluteDirectory, identity: parentIdentity};
}

async function captureRegularFile(root, candidate, label, {expectedSha256, expectedMode, expectedNode, requireSingleLink = true} = {}) {
  await assertNoSymlinkComponents(root, candidate);
  const info = await lstat(candidate);
  assert(info.isFile() && !info.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  const bytes = await readFile(candidate);
  const sha256 = digest(bytes);
  if (expectedSha256 !== undefined) assert(sha256 === expectedSha256, `${label} SHA-256 changed`);
  if (expectedMode !== undefined) assert(permissionMode(info) === expectedMode, `${label} mode changed`);
  if (requireSingleLink) assert(info.nlink === 1, `${label} must not be hard-linked`);
  if (expectedNode !== undefined) assert(sameNodeIdentity(nodeIdentity(info), expectedNode), `${label} inode changed`);
  const confirmed = await lstat(candidate);
  assert(
    confirmed.isFile() && !confirmed.isSymbolicLink() && sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info)) &&
      confirmed.size === info.size && permissionMode(confirmed) === permissionMode(info) && confirmed.nlink === info.nlink,
    `${label} identity changed while it was being inspected`,
  );
  return {node: nodeIdentity(confirmed), sha256, mode: permissionMode(confirmed), bytes: confirmed.size, nlink: confirmed.nlink};
}

async function writeOwnedExclusive({root, parent, parentIdentity, candidate, bytes, mode, label, registerOwnership}) {
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await assertNoSymlinkComponents(root, candidate);
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(candidate, flags, mode);
  let ownership;
  try {
    const initialInfo = await handle.stat();
    ownership = {node: nodeIdentity(initialInfo), sha256: null, mode: permissionMode(initialInfo), bytes: 0};
    registerOwnership?.(ownership);
    await handle.writeFile(bytes);
    await handle.chmod(mode);
    await handle.sync();
    const info = await handle.stat();
    assert(sameNodeIdentity(nodeIdentity(info), ownership.node), `${label} inode changed while it was open`);
    ownership.sha256 = digest(bytes);
    ownership.mode = mode;
    ownership.bytes = bytes.length;
  } finally {
    await handle.close();
  }
  await assertDirectoryIdentity(root, parent, parentIdentity, `${label} parent`);
  await captureRegularFile(root, candidate, label, {
    expectedSha256: ownership.sha256,
    expectedMode: mode,
    expectedNode: ownership.node,
    requireSingleLink: true,
  });
  return ownership;
}

async function removeOwnedFileIfUnchanged(candidate, ownership) {
  try {
    if (!ownership?.sha256) return false;
    const info = await lstatIfPresent(candidate);
    if (!info?.isFile() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.node)) return false;
    if (permissionMode(info) !== ownership.mode || info.nlink !== 1 || digest(await readFile(candidate)) !== ownership.sha256) return false;
    await unlink(candidate);
    return true;
  } catch {
    return false;
  }
}

async function removeOwnedEmptyDirectory(directory, ownership) {
  try {
    const info = await lstatIfPresent(directory);
    if (!info?.isDirectory() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.node)) return false;
    if ((await readdir(directory)).length !== 0) return false;
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function chmodOwnedDirectory(root, directory, ownership, mode, label) {
  await assertDirectoryIdentity(root, directory, ownership, label);
  const flags = fsConstants.O_RDONLY | (fsConstants.O_DIRECTORY || 0) | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(directory, flags);
  try {
    const before = await handle.stat();
    assert(before.isDirectory() && sameNodeIdentity(nodeIdentity(before), ownership.node), `${label} inode changed before chmod`);
    await handle.chmod(mode);
  } finally {
    await handle.close();
  }
  const observed = await assertDirectoryIdentity(root, directory, ownership, label);
  assert(observed.mode === mode, `${label} mode is not ${mode.toString(8).padStart(4, "0")}`);
  return observed;
}

function kitRootFor(root, kit) {
  return path.join(root, DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT, kit.manifest.animationId, safeRequirementId(kit.manifest.requirementId));
}

async function checkOne(root, kit) {
  const kitRoot = kitRootFor(root, kit);
  await checkExpectedKitFiles(root, kitRoot, kit.files, "source-driven branch kit");
  const child = path.join(kitRoot, `runtime-tree/${kit.bound.profile.childRuntimePath}`);
  assert(((await stat(child)).mode & 0o777) === 0o444, "staged child is not read-only");
  return {
    status: "verified-unsigned-empty-template-only",
    kitRoot,
    animationId: kit.manifest.animationId,
    requirementId: kit.manifest.requirementId,
    traceSpecSha256: kit.bound.specDocument.sha256,
    traceSpecIndexSha256: kit.bound.indexDocument.sha256,
    fixtureManifestSha256: kit.fixture.document.sha256,
    runtimeExecutableSha256: kit.runtime.executableSha256,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
}

async function checkExpectedKitFiles(root, kitRoot, expectedFiles, label) {
  await assertNoSymlinkComponents(root, kitRoot);
  const info = await lstat(kitRoot).catch(() => null);
  assert(info?.isDirectory() && !info.isSymbolicLink(), `${label} is missing: ${portable(path.relative(root, kitRoot))}`);
  exact(await listFiles(kitRoot), [...expectedFiles.keys()].sort(), `${label} file set`);
  for (const [relative, expected] of expectedFiles) {
    const absolute = path.join(kitRoot, relative);
    const fileInfo = await lstat(absolute);
    assert(fileInfo.isFile() && !fileInfo.isSymbolicLink(), `${label} file is not regular: ${relative}`);
    assert(fileInfo.nlink === 1, `${label} file must not be hard-linked: ${relative}`);
    assert((fileInfo.mode & 0o777) === expected.mode, `${label} mode drift: ${relative}`);
    const observed = await readFile(absolute);
    assert(observed.equals(expected.content), `${label} file is stale, edited, or filled: ${relative}`);
  }
}

function assertExpectedFileMapsEqual(left, right, label) {
  exact([...left.keys()].sort(), [...right.keys()].sort(), `${label} file set`);
  for (const [file, expected] of left) {
    const observed = right.get(file);
    assert(observed?.mode === expected.mode && Buffer.from(observed.content).equals(Buffer.from(expected.content)), `${label} differs: ${file}`);
  }
}

async function snapshotExpectedKit(root, kitRoot, expectedFiles, label) {
  await checkExpectedKitFiles(root, kitRoot, expectedFiles, label);
  const rootIdentity = await captureDirectoryIdentity(root, kitRoot, `${label} root`);
  const inventory = [];
  for (const file of [...expectedFiles.keys()].sort()) {
    const absolute = path.join(kitRoot, file);
    const [info, bytes] = await Promise.all([lstat(absolute), readFile(absolute)]);
    inventory.push({file, bytes: bytes.length, sha256: digest(bytes), mode: info.mode & 0o777});
  }
  return {
    rootIdentity,
    inventory,
    fileCount: inventory.length,
    treeSha256: digest(Buffer.from(canonicalJson(inventory))),
  };
}

async function readActiveKitManifest(root, kitRoot) {
  const manifestPath = path.join(kitRoot, "kit-manifest.json");
  await assertNoSymlinkComponents(root, manifestPath);
  const bytes = await readFile(manifestPath).catch(() => null);
  assert(bytes, `source-driven branch kit is missing: ${portable(path.relative(root, kitRoot))}`);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`active source-driven branch kit manifest is invalid JSON: ${error.message}`);
  }
  return {bytes, value, sha256: digest(bytes)};
}

function reconstructPreviousTraceSpec(currentKit, previousGeneratorSha256, declaredPreviousSpecSha256) {
  assertSha256(previousGeneratorSha256, "previous trace-spec generator SHA-256");
  assertSha256(declaredPreviousSpecSha256, "active kit previous trace-spec SHA-256");
  const currentDocument = currentKit.bound.specDocument;
  const currentGenerator = currentDocument.value?.sourceBindings?.scheduleDerivation?.generator;
  assert(
    currentGenerator?.path === TRACE_SPEC_GENERATOR_FILE && SHA256.test(currentGenerator?.sha256 || ""),
    `current trace specification lacks the exact ${TRACE_SPEC_GENERATOR_FIELD} binding`,
  );
  assert(
    currentDocument.bytes.equals(Buffer.from(json(currentDocument.value))),
    "current trace specification is not in the generator's exact JSON byte format",
  );
  assert(
    previousGeneratorSha256 !== currentGenerator.sha256,
    "previous trace-spec generator SHA-256 must differ from the current generator SHA-256",
  );
  const generatorOnlyValue = structuredClone(currentDocument.value);
  generatorOnlyValue.sourceBindings.scheduleDerivation.generator.sha256 = previousGeneratorSha256;
  let previousValue = generatorOnlyValue;
  let previousBytes = Buffer.from(json(previousValue));
  let previousSha256 = digest(previousBytes);
  let coverageProjectionSchemaUpgrade = null;
  if (previousSha256 !== declaredPreviousSpecSha256) {
    const currentCoverageBinding = currentDocument.value?.sourceBindings?.fullFrameCoverage;
    assert(
      currentCoverageBinding?.projection === TRACE_COVERAGE_PROJECTION.id,
      `current trace specification lacks the exact ${TRACE_COVERAGE_INCLUDED_PATHS_FIELD} projection identity`,
    );
    exact(
      currentCoverageBinding.includedPaths,
      SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
      `current ${TRACE_COVERAGE_INCLUDED_PATHS_FIELD}`,
    );
    previousValue = structuredClone(generatorOnlyValue);
    previousValue.sourceBindings.fullFrameCoverage.includedPaths = [
      ...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
    ];
    previousBytes = Buffer.from(json(previousValue));
    previousSha256 = digest(previousBytes);
    if (previousSha256 === declaredPreviousSpecSha256) {
      coverageProjectionSchemaUpgrade = {
        kind: "deterministic-trace-coverage-included-paths-v1-to-v2",
        path: TRACE_COVERAGE_INCLUDED_PATHS_FIELD,
        projection: TRACE_COVERAGE_PROJECTION.id,
        previousIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS],
        currentIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS],
        previousProjectionSha256: previousValue.sourceBindings.fullFrameCoverage.sha256,
        currentProjectionSha256: currentCoverageBinding.sha256,
        projectionSha256Unchanged:
          previousValue.sourceBindings.fullFrameCoverage.sha256 === currentCoverageBinding.sha256,
        allOtherTraceSpecBytesReconstructedFromCurrent: true,
      };
      assert(
        coverageProjectionSchemaUpgrade.projectionSha256Unchanged,
        "the deterministic coverage-v1 to coverage-v2 descriptor upgrade changed the bound projection SHA-256",
      );
    }
  }
  assert(
    previousSha256 === declaredPreviousSpecSha256,
    `previous generator SHA-256 plus the sole allowlisted deterministic ${TRACE_COVERAGE_INCLUDED_PATHS_FIELD} v1-to-v2 upgrade does not reconstruct the active kit trace specification; non-allowlisted drift or an incorrect witness is present`,
  );
  return {
    document: {value: previousValue, bytes: previousBytes, sha256: previousSha256},
    currentGeneratorSha256: currentGenerator.sha256,
    coverageProjectionSchemaUpgrade,
  };
}

function descriptorAtSourcePath(sourceBinding, technicalBinding, label) {
  assert(
    sourceBinding && typeof sourceBinding.path === "string" && sourceBinding.path.length > 0,
    `${label} source binding lacks its generator path`,
  );
  return {path: sourceBinding.path, ...structuredClone(technicalBinding)};
}

function assertAllowlistedTechnicalBindingTransition(indexKey, historicalBinding, currentBinding, label) {
  assert(
    historicalBinding && currentBinding,
    `${label} lacks historical/current ${indexKey} technical bindings`,
  );
  const historical = structuredClone(historicalBinding);
  const current = structuredClone(currentBinding);
  if (indexKey === "coverage") {
    const includedPathsChanged =
      canonicalJson(historical.includedPaths) !== canonicalJson(current.includedPaths);
    if (includedPathsChanged) {
      exact(
        historical.includedPaths,
        SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
        `${label} historical coverage included paths`,
      );
      exact(
        current.includedPaths,
        SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
        `${label} current coverage included paths`,
      );
      historical.includedPaths = [...current.includedPaths];
    }
  }
  if (historical.sha256 !== current.sha256) {
    assertSha256(historical.sha256, `${label} historical ${indexKey} projection SHA-256`);
    assertSha256(current.sha256, `${label} current ${indexKey} projection SHA-256`);
    historical.sha256 = current.sha256;
  }
  exact(
    historical,
    current,
    `${label} ${indexKey} technical binding outside the exact coverage-v1 path list and projection SHA-256 cascade`,
  );
}

export function reconstructHistoricalGeneratorDerivedTraceSpec({
  currentSpecValue,
  previousGeneratorSha256,
  currentGeneratorSha256,
  historicalTechnicalBindings,
  currentTechnicalBindings,
  previousInventoryFileSha256AtSpecGeneration,
}) {
  assertSha256(previousGeneratorSha256, "historical reconstruction previous generator SHA-256");
  assertSha256(currentGeneratorSha256, "historical reconstruction current generator SHA-256");
  assert(
    previousGeneratorSha256 !== currentGeneratorSha256,
    "historical reconstruction generator SHA-256 values must differ",
  );
  assertSha256(
    previousInventoryFileSha256AtSpecGeneration,
    "historical reconstruction scenario-inventory file SHA-256",
  );
  assert(
    currentSpecValue && typeof currentSpecValue === "object" && !Array.isArray(currentSpecValue),
    "historical reconstruction current trace specification must be an object",
  );
  const previousValue = structuredClone(currentSpecValue);
  const transforms = [];
  for (const {indexKey, sourceKey} of TRACE_SPEC_TECHNICAL_BINDINGS) {
    const currentSourceBinding = currentSpecValue?.sourceBindings?.[sourceKey];
    assertAllowlistedTechnicalBindingTransition(
      indexKey,
      historicalTechnicalBindings?.[indexKey],
      currentTechnicalBindings?.[indexKey],
      `${currentSpecValue.animationId}/${currentSpecValue.requirementId}`,
    );
    exact(
      currentSourceBinding,
      descriptorAtSourcePath(
        currentSourceBinding,
        currentTechnicalBindings[indexKey],
        `${currentSpecValue.animationId}/${currentSpecValue.requirementId} current ${sourceKey}`,
      ),
      `${currentSpecValue.animationId}/${currentSpecValue.requirementId} current ${sourceKey} generator binding`,
    );
    const historicalSourceBinding = descriptorAtSourcePath(
      currentSourceBinding,
      historicalTechnicalBindings[indexKey],
      `${currentSpecValue.animationId}/${currentSpecValue.requirementId} historical ${sourceKey}`,
    );
    if (canonicalJson(currentSourceBinding) !== canonicalJson(historicalSourceBinding)) {
      transforms.push(`technical-binding-${indexKey === "scenarioInventory" ? "scenario-inventory" : indexKey}-descriptor`);
    }
    previousValue.sourceBindings[sourceKey] = historicalSourceBinding;
  }

  const currentCoverageInventory = currentSpecValue?.sourceBindings?.coverageInventoryBinding;
  assert(
    currentCoverageInventory &&
      canonicalJson(Object.keys(currentCoverageInventory).sort()) ===
        canonicalJson([
          "fileSha256AtSpecGeneration",
          "status",
          "technicalProjectionSha256",
        ]),
    `${currentSpecValue.animationId}/${currentSpecValue.requirementId} coverage-inventory binding shape differs`,
  );
  assert(
    currentCoverageInventory.status ===
      "verified-current-file-at-spec-generation-not-part-of-execution-binding",
    `${currentSpecValue.animationId}/${currentSpecValue.requirementId} coverage-inventory binding status differs`,
  );
  assertSha256(
    currentCoverageInventory.fileSha256AtSpecGeneration,
    `${currentSpecValue.animationId}/${currentSpecValue.requirementId} current scenario-inventory file SHA-256`,
  );
  assert(
    currentCoverageInventory.technicalProjectionSha256 ===
      currentTechnicalBindings.scenarioInventory.sha256,
    `${currentSpecValue.animationId}/${currentSpecValue.requirementId} current scenario-inventory projection binding differs`,
  );
  const previousCoverageInventory =
    previousValue.sourceBindings.coverageInventoryBinding;
  if (
    previousCoverageInventory.technicalProjectionSha256 !==
      historicalTechnicalBindings.scenarioInventory.sha256
  ) {
    transforms.push("coverage-inventory-technical-projection-sha256");
  }
  previousCoverageInventory.technicalProjectionSha256 =
    historicalTechnicalBindings.scenarioInventory.sha256;
  if (
    previousCoverageInventory.fileSha256AtSpecGeneration !==
      previousInventoryFileSha256AtSpecGeneration
  ) {
    transforms.push("coverage-inventory-file-sha256-at-spec-generation");
  }
  previousCoverageInventory.fileSha256AtSpecGeneration =
    previousInventoryFileSha256AtSpecGeneration;

  const currentGenerator =
    currentSpecValue?.sourceBindings?.scheduleDerivation?.generator;
  if (currentGenerator !== undefined) {
    assert(
      currentGenerator?.path === TRACE_SPEC_GENERATOR_FILE &&
        currentGenerator?.sha256 === currentGeneratorSha256,
      `${currentSpecValue.animationId}/${currentSpecValue.requirementId} current generator binding differs`,
    );
    previousValue.sourceBindings.scheduleDerivation.generator.sha256 =
      previousGeneratorSha256;
    transforms.push("trace-spec-generator-sha256");
  }
  assert(
    transforms.length > 0 &&
      transforms.every((transform) =>
        TRACE_SPEC_RECONSTRUCTION_TRANSFORMS.includes(transform)
      ),
    `${currentSpecValue.animationId}/${currentSpecValue.requirementId} has no exact allowlisted historical reconstruction`,
  );
  const previousBytes = Buffer.from(json(previousValue));
  return {
    value: previousValue,
    bytes: previousBytes,
    sha256: digest(previousBytes),
    allowlistedTransforms: transforms,
  };
}

async function historicalInventoryFileWitnesses(root, pilot, currentSpecDocument) {
  const currentValue =
    currentSpecDocument.value?.sourceBindings?.coverageInventoryBinding
      ?.fileSha256AtSpecGeneration;
  assertSha256(
    currentValue,
    `${pilot.animationId} current scenario-inventory file SHA-256`,
  );
  const candidates = new Map([[currentValue, null]]);
  const fixtureParentRelative =
    `${HISTORICAL_COURSE_HOST_FIXTURE_ROOT}/${pilot.animationId}`;
  const fixtureParent = path.join(root, fixtureParentRelative);
  const parentInfo = await lstat(fixtureParent).catch(() => null);
  if (!parentInfo) return candidates;
  assert(
    parentInfo.isDirectory() && !parentInfo.isSymbolicLink(),
    `${pilot.animationId} historical fixture parent is not a regular directory`,
  );
  await assertNoSymlinkComponents(root, fixtureParent);
  for (const entry of (await readdir(fixtureParent, {withFileTypes: true}))
    .sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const relative =
      `${fixtureParentRelative}/${entry.name}/fixture-manifest.json`;
    const absolute = path.join(root, relative);
    const info = await lstat(absolute).catch(() => null);
    if (!info) continue;
    const document = await readJsonFile(
      await resolveFile(root, relative, `${pilot.animationId} historical fixture manifest`),
      `${pilot.animationId} historical fixture manifest`,
    );
    const value = document.value?.evidenceHashes?.scenarioInventorySha256;
    if (
      document.value?.animationId !== pilot.animationId ||
      document.value?.generatedBy !== "scripts/build-adobe-course-host-fixtures.mjs" ||
      document.value?.source?.childSwfSha256 !== pilot.sourceSwfSha256 ||
      document.value?.source?.scenarioInventory !==
        `migrations/${pilot.animationId}/audit/scenario-inventory.json`
    ) continue;
    assertSha256(value, `${pilot.animationId} historical fixture scenario-inventory SHA-256`);
    const witness = {
      kind: "historical-adobe-course-host-fixture-manifest",
      file: relative,
      sha256: document.sha256,
      field: "evidenceHashes.scenarioInventorySha256",
      value,
    };
    const existing = candidates.get(value);
    if (
      !candidates.has(value) ||
      (existing !== null && witness.file < existing.file)
    ) {
      candidates.set(value, witness);
    }
  }
  return candidates;
}

function buildTraceSpecReconstructionBundle(snapshots) {
  const ordered = [...snapshots].sort((left, right) =>
    left.file < right.file ? -1 : left.file > right.file ? 1 : 0
  );
  const payload = Buffer.from(`${canonicalJson(ordered)}\n`);
  const compressed = gzipSync(payload, {level: 9, mtime: 0});
  return {
    encoding: "gzip-base64-canonical-json-current-trace-spec-snapshots-v1",
    entryCount: ordered.length,
    uncompressedSha256: digest(payload),
    gzipSha256: digest(compressed),
    data: compressed.toString("base64"),
  };
}

async function verifyHistoricalTraceSpecIndex({
  root,
  currentKit,
  historicalIndexBytes,
  historicalIndexSha256,
  historicalTraceSpecSha256,
  previousGeneratorSha256,
}) {
  assertSha256(historicalIndexSha256, "active kit previous trace-spec index SHA-256");
  assert(digest(historicalIndexBytes) === historicalIndexSha256, "active kit embedded trace-spec index SHA-256 differs from its manifest binding");
  let historicalIndex;
  try {
    historicalIndex = JSON.parse(historicalIndexBytes.toString("utf8"));
  } catch (error) {
    throw new Error(`active kit embedded trace-spec index is invalid JSON: ${error.message}`);
  }
  assert(
    historicalIndexBytes.equals(Buffer.from(json(historicalIndex))),
    "active kit embedded trace-spec index is not in the generator's exact JSON byte format",
  );
  const currentIndexDocument = currentKit.bound.indexDocument;
  assert(
    currentIndexDocument.bytes.equals(Buffer.from(json(currentIndexDocument.value))),
    "current trace-spec index is not in the generator's exact JSON byte format",
  );

  const normalizedHistorical = structuredClone(historicalIndex);
  const currentIndex = currentIndexDocument.value;
  assert(
    Array.isArray(normalizedHistorical?.pilots) && Array.isArray(currentIndex?.pilots) &&
      normalizedHistorical.pilots.length === currentIndex.pilots.length,
    "historical trace-spec index pilot structure differs from the current index",
  );
  const currentGeneratorSha256 =
    currentKit.bound.specDocument.value?.sourceBindings?.scheduleDerivation
      ?.generator?.sha256;
  assertSha256(currentGeneratorSha256, "current trace-spec generator SHA-256");
  assertSha256(previousGeneratorSha256, "previous trace-spec generator SHA-256");
  const changedTechnicalBindings = [];
  const changedTraceSpecs = [];
  const snapshots = [];
  for (let pilotIndex = 0; pilotIndex < currentIndex.pilots.length; pilotIndex += 1) {
    const historicalPilot = normalizedHistorical.pilots[pilotIndex];
    const currentPilot = currentIndex.pilots[pilotIndex];
    assert(
      historicalPilot?.animationId === currentPilot?.animationId &&
        historicalPilot?.sourceSwfSha256 === currentPilot?.sourceSwfSha256,
      "historical trace-spec index pilot/source identity differs from the current index",
    );
    const historicalTechnicalBindings = structuredClone(
      historicalPilot.technicalBindings,
    );
    let pilotTechnicalBindingChanged = false;
    for (const {indexKey} of TRACE_SPEC_TECHNICAL_BINDINGS) {
      const historicalBinding = historicalPilot?.technicalBindings?.[indexKey];
      const currentBinding = currentPilot?.technicalBindings?.[indexKey];
      assertAllowlistedTechnicalBindingTransition(
        indexKey,
        historicalBinding,
        currentBinding,
        `${currentPilot.animationId} trace-spec index`,
      );
      if (
        indexKey === "coverage" &&
        canonicalJson(historicalBinding.includedPaths) !==
          canonicalJson(currentBinding.includedPaths)
      ) {
        pilotTechnicalBindingChanged = true;
        changedTechnicalBindings.push({
          kind: "coverage-included-paths-v1-to-v2",
          animationId: currentPilot.animationId,
          binding: "technicalBindings.coverage.includedPaths",
          previousIncludedPaths: [...historicalBinding.includedPaths],
          currentIncludedPaths: [...currentBinding.includedPaths],
        });
        historicalBinding.includedPaths = [...currentBinding.includedPaths];
      }
      if (historicalBinding.sha256 !== currentBinding.sha256) {
        pilotTechnicalBindingChanged = true;
        await verifyCurrentOtherPilotTechnicalBinding(
          root,
          currentPilot,
          indexKey,
        );
        changedTechnicalBindings.push({
          kind: "technical-binding-sha256",
          animationId: currentPilot.animationId,
          binding: `technicalBindings.${indexKey}.sha256`,
          previousSha256: historicalBinding.sha256,
          currentSha256: currentBinding.sha256,
        });
        historicalBinding.sha256 = currentBinding.sha256;
      }
    }
    assert(
      Array.isArray(historicalPilot?.traceSpecs) && Array.isArray(currentPilot?.traceSpecs) &&
        historicalPilot.traceSpecs.length === currentPilot.traceSpecs.length,
      "historical trace-spec index requirement structure differs from the current index",
    );
    let changedPilotTraceSpecCount = 0;
    let inventoryWitnesses = null;
    for (let specIndex = 0; specIndex < currentPilot.traceSpecs.length; specIndex += 1) {
      const historicalEntry = historicalPilot.traceSpecs[specIndex];
      const currentEntry = currentPilot.traceSpecs[specIndex];
      assertSha256(historicalEntry?.sha256, "historical trace-spec index entry SHA-256");
      assertSha256(currentEntry?.sha256, "current trace-spec index entry SHA-256");
      const normalizedHistoricalEntry = {...historicalEntry, sha256: currentEntry.sha256};
      exact(
        normalizedHistoricalEntry,
        currentEntry,
        `${currentPilot.animationId}/${currentEntry.requirementId} historical trace-spec index entry outside SHA-256`,
      );
      if (historicalEntry.sha256 !== currentEntry.sha256) {
        changedPilotTraceSpecCount += 1;
        const currentSpecPath = await resolveFile(root, currentEntry.file, "current generator-derived trace specification");
        const currentSpecDocument = await readJsonFile(currentSpecPath, "current generator-derived trace specification");
        assert(currentSpecDocument.sha256 === currentEntry.sha256, "current generator-derived trace specification differs from its index hash");
        assert(
          currentSpecDocument.bytes.equals(Buffer.from(json(currentSpecDocument.value))),
          "current generator-derived trace specification is not in the generator's exact JSON byte format",
        );
        assert(
          currentSpecDocument.value?.animationId === currentPilot.animationId &&
            currentSpecDocument.value?.requirementId === currentEntry.requirementId,
          "current generator-derived trace specification identity differs from its index entry",
        );
        if (!inventoryWitnesses) {
          inventoryWitnesses = await historicalInventoryFileWitnesses(
            root,
            currentPilot,
            currentSpecDocument,
          );
        }
        const matches = [];
        for (const [previousInventoryFileSha256AtSpecGeneration, witness] of
          inventoryWitnesses) {
          const reconstructed =
            reconstructHistoricalGeneratorDerivedTraceSpec({
              currentSpecValue: currentSpecDocument.value,
              previousGeneratorSha256,
              currentGeneratorSha256,
              historicalTechnicalBindings,
              currentTechnicalBindings: currentPilot.technicalBindings,
              previousInventoryFileSha256AtSpecGeneration,
            });
          if (reconstructed.sha256 === historicalEntry.sha256) {
            matches.push({
              previousInventoryFileSha256AtSpecGeneration,
              witness,
              reconstructed,
            });
          }
        }
        assert(
          matches.length === 1,
          `${currentPilot.animationId}/${currentEntry.requirementId} previous trace-spec SHA-256 cannot be uniquely reconstructed from current generator bytes through only the allowlisted prior generator, exact coverage-v1 descriptor, historical index technical bindings, and witnessed scenario-inventory file hash`,
        );
        const [match] = matches;
        changedTraceSpecs.push({
          animationId: currentPilot.animationId,
          requirementId: currentEntry.requirementId,
          file: currentEntry.file,
          previousSha256: historicalEntry.sha256,
          currentSha256: currentEntry.sha256,
          allowlistedTransforms: match.reconstructed.allowlistedTransforms,
          previousInventoryFileSha256AtSpecGeneration:
            match.previousInventoryFileSha256AtSpecGeneration,
          historicalInventoryFileWitness: match.witness,
        });
        snapshots.push({
          file: currentEntry.file,
          currentSpecUtf8: currentSpecDocument.bytes.toString("utf8"),
        });
      }
      historicalEntry.sha256 = currentEntry.sha256;
    }
    if (pilotTechnicalBindingChanged) {
      assert(
        changedPilotTraceSpecCount === currentPilot.traceSpecs.length,
        `${currentPilot.animationId} historical technical-binding cascade leaves an unchanged trace-spec hash`,
      );
    }
  }
  exact(
    normalizedHistorical,
    currentIndex,
    "historical trace-spec index outside the exact technical-binding and reconstructed traceSpecs[].sha256 cascade",
  );
  const selected = changedTraceSpecs.filter((entry) =>
    entry.animationId === currentKit.manifest.animationId &&
    entry.requirementId === currentKit.manifest.requirementId &&
    entry.file === currentKit.bound.specFile
  );
  assert(selected.length === 1, "historical trace-spec index does not contain exactly one changed selected requirement");
  assert(selected[0].previousSha256 === historicalTraceSpecSha256, "historical trace-spec index selected hash differs from the reconstructed previous specification");
  assert(selected[0].currentSha256 === currentKit.bound.specDocument.sha256, "current trace-spec index selected hash differs from the current specification");
  assert(
    changedTraceSpecs.length === snapshots.length && changedTraceSpecs.length > 0,
    "historical trace-spec index reconstruction snapshot coverage differs",
  );
  return {
    changedTechnicalBindings,
    changedTraceSpecs,
    reconstructionBundle: buildTraceSpecReconstructionBundle(snapshots),
  };
}

const INDEX_ONLY_OTHER_PILOT_TECHNICAL_BINDINGS = Object.freeze([
  "manifest",
  "coverage",
  "scenarioInventory",
]);

function indexOnlyChange({kind, animationId, requirementId = null, file = null, binding, previousSha256, currentSha256}) {
  assertSha256(previousSha256, `historical global-index ${binding} SHA-256`);
  assertSha256(currentSha256, `current global-index ${binding} SHA-256`);
  assert(previousSha256 !== currentSha256, `global-index ${binding} change must differ`);
  return {kind, animationId, requirementId, file, binding, previousSha256, currentSha256};
}

async function verifyCurrentOtherPilotTechnicalBinding(root, pilot, binding) {
  const definitions = {
    manifest: {
      relative: `migrations/${pilot.animationId}/migration.json`,
      descriptor: TECHNICAL_MANIFEST_PROJECTION,
      project: technicalManifestSha256,
      identity: (value) => value?.animationId === pilot.animationId || value?.id === pilot.animationId,
      label: "migration manifest",
    },
    coverage: {
      relative: `migrations/${pilot.animationId}/evidence/full-frame-coverage.json`,
      descriptor: TRACE_COVERAGE_PROJECTION,
      project: traceCoverageSha256,
      identity: (value) => value?.animationId === pilot.animationId,
      label: "full-frame coverage",
    },
    scenarioInventory: {
      relative: `migrations/${pilot.animationId}/audit/scenario-inventory.json`,
      descriptor: SCENARIO_INVENTORY_PROJECTION,
      project: scenarioInventorySha256,
      identity: (value) => value?.animationId === pilot.animationId,
      label: "scenario inventory",
    },
  };
  const definition = definitions[binding];
  assert(definition, `unsupported global-index technical binding: ${binding}`);
  const candidate = await resolveFile(root, definition.relative, `current other-pilot ${definition.label}`);
  const document = await readJsonFile(candidate, `current other-pilot ${definition.label}`);
  assert(definition.identity(document.value), `current other-pilot ${definition.label} animation identity differs`);
  const expectedBinding = projectionDescriptor({
    projection: definition.descriptor.id,
    sha256: definition.project(document.value),
    excludedPaths: definition.descriptor.excludedPaths || definition.descriptor.excludedRequirementPaths || [],
    includedPaths: definition.descriptor.includedRequirementPaths || [],
  });
  exact(
    pilot.technicalBindings[binding],
    expectedBinding,
    `current other-pilot ${binding} projection`,
  );
}

async function verifyHistoricalGlobalIndexOnlyDrift({
  root,
  currentKit,
  historicalIndexBytes,
  historicalIndexSha256,
}) {
  assertSha256(historicalIndexSha256, "active kit previous trace-spec index SHA-256");
  assert(
    digest(historicalIndexBytes) === historicalIndexSha256,
    "active kit embedded trace-spec index SHA-256 differs from its manifest binding",
  );
  let historicalIndex;
  try {
    historicalIndex = JSON.parse(historicalIndexBytes.toString("utf8"));
  } catch (error) {
    throw new Error(`active kit embedded trace-spec index is invalid JSON: ${error.message}`);
  }
  assert(
    historicalIndexBytes.equals(Buffer.from(json(historicalIndex))),
    "active kit embedded trace-spec index is not in the generator's exact JSON byte format",
  );
  const currentIndexDocument = currentKit.bound.indexDocument;
  assert(
    currentIndexDocument.bytes.equals(Buffer.from(json(currentIndexDocument.value))),
    "current trace-spec index is not in the generator's exact JSON byte format",
  );
  assert(
    historicalIndexSha256 !== currentIndexDocument.sha256,
    "index-only drift proof requires a stale global trace-spec index binding",
  );

  const normalizedHistorical = structuredClone(historicalIndex);
  const currentIndex = currentIndexDocument.value;
  assert(
    Array.isArray(normalizedHistorical?.pilots) && Array.isArray(currentIndex?.pilots) &&
      normalizedHistorical.pilots.length === currentIndex.pilots.length,
    "historical global trace-spec index pilot structure differs from the current index",
  );
  const changes = [];
  let selectedPilotCount = 0;
  for (let pilotIndex = 0; pilotIndex < currentIndex.pilots.length; pilotIndex += 1) {
    const historicalPilot = normalizedHistorical.pilots[pilotIndex];
    const currentPilot = currentIndex.pilots[pilotIndex];
    assert(
      historicalPilot?.animationId === currentPilot?.animationId,
      "historical global trace-spec index pilot order/identity differs from the current index",
    );
    if (currentPilot.animationId === currentKit.manifest.animationId) {
      selectedPilotCount += 1;
      exact(
        historicalPilot,
        currentPilot,
        "historical global trace-spec index selected pilot must remain byte-semantically current",
      );
      continue;
    }

    const historicalTechnical = historicalPilot?.technicalBindings;
    const currentTechnical = currentPilot?.technicalBindings;
    assert(
      historicalTechnical && currentTechnical,
      "historical global trace-spec index other pilot lacks technical bindings",
    );
    for (const binding of INDEX_ONLY_OTHER_PILOT_TECHNICAL_BINDINGS) {
      const previousSha256 = historicalTechnical?.[binding]?.sha256;
      const currentSha256 = currentTechnical?.[binding]?.sha256;
      assertSha256(previousSha256, `historical global-index technicalBindings.${binding} SHA-256`);
      assertSha256(currentSha256, `current global-index technicalBindings.${binding} SHA-256`);
      if (previousSha256 !== currentSha256) {
        await verifyCurrentOtherPilotTechnicalBinding(root, currentPilot, binding);
        changes.push(indexOnlyChange({
          kind: "technical-binding-sha256",
          animationId: currentPilot.animationId,
          binding: `technicalBindings.${binding}.sha256`,
          previousSha256,
          currentSha256,
        }));
        historicalTechnical[binding].sha256 = currentSha256;
      }
    }

    assert(
      Array.isArray(historicalPilot?.traceSpecs) && Array.isArray(currentPilot?.traceSpecs) &&
        historicalPilot.traceSpecs.length === currentPilot.traceSpecs.length,
      "historical global trace-spec index other-pilot requirement structure differs from the current index",
    );
    for (let specIndex = 0; specIndex < currentPilot.traceSpecs.length; specIndex += 1) {
      const historicalEntry = historicalPilot.traceSpecs[specIndex];
      const currentEntry = currentPilot.traceSpecs[specIndex];
      assertSha256(historicalEntry?.sha256, "historical global-index trace-spec SHA-256");
      assertSha256(currentEntry?.sha256, "current global-index trace-spec SHA-256");
      if (historicalEntry.sha256 !== currentEntry.sha256) {
        const currentSpecPath = await resolveFile(
          root,
          currentEntry.file,
          "current other-pilot changed trace specification",
        );
        assert(
          await sha256File(currentSpecPath) === currentEntry.sha256,
          "current other-pilot changed trace specification differs from its index hash",
        );
        changes.push(indexOnlyChange({
          kind: "trace-spec-sha256",
          animationId: currentPilot.animationId,
          requirementId: currentEntry.requirementId,
          file: currentEntry.file,
          binding: "traceSpecs[].sha256",
          previousSha256: historicalEntry.sha256,
          currentSha256: currentEntry.sha256,
        }));
        historicalEntry.sha256 = currentEntry.sha256;
      }
    }
    exact(
      historicalPilot,
      currentPilot,
      "historical global trace-spec index other pilot differs outside approved technical/spec SHA-256 fields",
    );
  }
  assert(selectedPilotCount === 1, "historical global trace-spec index must contain exactly one selected pilot");
  exact(
    normalizedHistorical,
    currentIndex,
    "historical global trace-spec index differs outside approved other-pilot SHA-256 fields",
  );
  assert(changes.length > 0, "index-only drift proof has no approved other-pilot SHA-256 changes");
  return changes;
}

async function reconstructGeneratorDriftHistoricalKit({
  root,
  currentKit,
  profiles,
  testOnlyApprovedRuntime,
  previousTraceSpecGeneratorSha256,
}) {
  const kitRoot = kitRootFor(root, currentKit);
  const activeManifest = await readActiveKitManifest(root, kitRoot);
  const traceSpecBinding = activeManifest.value?.bindings?.traceSpec;
  const traceSpecIndexBinding = activeManifest.value?.bindings?.traceSpecIndex;
  assert(
    traceSpecBinding?.file === currentKit.bound.specFile && SHA256.test(traceSpecBinding?.sha256 || ""),
    "active source-driven branch kit has an invalid or non-canonical trace-spec binding",
  );
  assert(
    traceSpecIndexBinding?.file === INDEX_RELATIVE && SHA256.test(traceSpecIndexBinding?.sha256 || ""),
    "active source-driven branch kit has an invalid or non-canonical trace-spec index binding",
  );
  assert(
    traceSpecBinding.sha256 !== currentKit.bound.specDocument.sha256,
    "previous trace-spec generator SHA-256 must be omitted when the active kit trace specification is current",
  );
  const previousTraceSpec = reconstructPreviousTraceSpec(
    currentKit,
    previousTraceSpecGeneratorSha256,
    traceSpecBinding.sha256,
  );
  const historicalIndexPath = path.join(kitRoot, "bindings", "trace-spec-index.json");
  await assertNoSymlinkComponents(root, historicalIndexPath);
  const historicalIndexBytes = await readFile(historicalIndexPath);
  const reconstructedIndexDrift = await verifyHistoricalTraceSpecIndex({
    root,
    currentKit,
    historicalIndexBytes,
    historicalIndexSha256: traceSpecIndexBinding.sha256,
    historicalTraceSpecSha256: previousTraceSpec.document.sha256,
    previousGeneratorSha256: previousTraceSpecGeneratorSha256,
  });
  const historicalIndexDocument = {
    value: JSON.parse(historicalIndexBytes.toString("utf8")),
    bytes: historicalIndexBytes,
    sha256: traceSpecIndexBinding.sha256,
  };
  const historicalBound = {
    ...currentKit.bound,
    specDocument: previousTraceSpec.document,
    indexDocument: historicalIndexDocument,
  };
  const historicalKit = await buildSourceDrivenBranchCaptureKitInternal({
    projectRoot: root,
    specFile: currentKit.bound.specFile,
    runtime: currentKit.runtime,
    profiles,
    testOnlyApprovedRuntime,
    historicalBound,
  });
  const proof = {
    kind: previousTraceSpec.coverageProjectionSchemaUpgrade
      ? "allowlisted-generator-and-coverage-projection-schema-upgrade"
      : "single-allowlisted-trace-spec-field-drift",
    path: TRACE_SPEC_GENERATOR_FIELD,
    generatorFile: TRACE_SPEC_GENERATOR_FILE,
    previousGeneratorSha256: previousTraceSpecGeneratorSha256,
    currentGeneratorSha256: previousTraceSpec.currentGeneratorSha256,
    reconstructedPreviousTraceSpecSha256: previousTraceSpec.document.sha256,
    currentTraceSpecSha256: currentKit.bound.specDocument.sha256,
    previousTraceSpecIndexSha256: traceSpecIndexBinding.sha256,
    currentTraceSpecIndexSha256: currentKit.bound.indexDocument.sha256,
    indexDrift: {
      kind: "exact-reconstructed-generator-output-trace-spec-and-index-cascade-v2",
      ...reconstructedIndexDrift,
    },
    ...(previousTraceSpec.coverageProjectionSchemaUpgrade
      ? {coverageProjectionSchemaUpgrade: previousTraceSpec.coverageProjectionSchemaUpgrade}
      : {}),
    allOtherSelectedTraceSpecBytesReconstructedFromCurrent: true,
  };
  return {historicalKit, proof};
}

async function reconstructGlobalIndexOnlyHistoricalKit({
  root,
  currentKit,
  profiles,
  testOnlyApprovedRuntime,
}) {
  const kitRoot = kitRootFor(root, currentKit);
  const activeManifest = await readActiveKitManifest(root, kitRoot);
  const traceSpecBinding = activeManifest.value?.bindings?.traceSpec;
  const traceSpecIndexBinding = activeManifest.value?.bindings?.traceSpecIndex;
  assert(
    traceSpecBinding?.file === currentKit.bound.specFile &&
      traceSpecBinding?.sha256 === currentKit.bound.specDocument.sha256,
    "index-only drift requires the active selected trace specification to remain exactly current",
  );
  assert(
    traceSpecIndexBinding?.file === INDEX_RELATIVE && SHA256.test(traceSpecIndexBinding?.sha256 || "") &&
      traceSpecIndexBinding.sha256 !== currentKit.bound.indexDocument.sha256,
    "index-only drift requires a stale canonical global trace-spec index binding",
  );
  const historicalIndexPath = path.join(kitRoot, "bindings", "trace-spec-index.json");
  await assertNoSymlinkComponents(root, historicalIndexPath);
  const historicalIndexBytes = await readFile(historicalIndexPath);
  const changedOtherPilotBindings = await verifyHistoricalGlobalIndexOnlyDrift({
    root,
    currentKit,
    historicalIndexBytes,
    historicalIndexSha256: traceSpecIndexBinding.sha256,
  });
  const historicalIndexDocument = {
    value: JSON.parse(historicalIndexBytes.toString("utf8")),
    bytes: historicalIndexBytes,
    sha256: traceSpecIndexBinding.sha256,
  };
  const historicalBound = {...currentKit.bound, indexDocument: historicalIndexDocument};
  const historicalKit = await buildSourceDrivenBranchCaptureKitInternal({
    projectRoot: root,
    specFile: currentKit.bound.specFile,
    runtime: currentKit.runtime,
    profiles,
    testOnlyApprovedRuntime,
    historicalBound,
  });
  return {
    historicalKit,
    proof: {
      kind: "selected-trace-spec-current-global-index-only-drift",
      selectedTraceSpec: {
        file: currentKit.bound.specFile,
        sha256: currentKit.bound.specDocument.sha256,
        bytesUnchanged: true,
        indexEntryUnchanged: true,
      },
      previousTraceSpecIndexSha256: traceSpecIndexBinding.sha256,
      currentTraceSpecIndexSha256: currentKit.bound.indexDocument.sha256,
      indexDrift: {
        kind: "same-index-structure-selected-pilot-unchanged-other-pilot-approved-sha256-fields-only",
        changedOtherPilotBindings,
      },
      selectedPilotCanonicalJsonUnchanged: true,
      topLevelAndStructureCanonicalJsonUnchanged: true,
    },
  };
}

async function inspectArchivableKit({
  root,
  kit,
  legacyManifestHashes,
  previousV2ManifestHashes,
  previousV2TreeHashes,
  currentV2ManifestHashes,
  currentV2TreeHashes,
}) {
  const kitRoot = kitRootFor(root, kit);
  let currentError;
  try {
    await checkExpectedKitFiles(root, kitRoot, kit.files, "current source-driven branch kit");
    return {
      kit,
      kitRoot,
      variant: "current-v3-causal-capture-contract",
      expectedFiles: kit.files,
      snapshot: await snapshotExpectedKit(root, kitRoot, kit.files, "current source-driven branch kit"),
    };
  } catch (error) {
    currentError = error;
  }
  const manifestPath = path.join(kitRoot, "kit-manifest.json");
  const actualManifest = await readFile(manifestPath).catch(() => null);
  const actualManifestSha256 = actualManifest ? digest(actualManifest) : null;
  const pinnedCurrentV2ManifestSha256 = currentV2ManifestHashes?.[kit.manifest.requirementId];
  if (pinnedCurrentV2ManifestSha256 && actualManifestSha256 === pinnedCurrentV2ManifestSha256) {
    assertSha256(pinnedCurrentV2ManifestSha256, `current-v2 pinned manifest for ${kit.manifest.requirementId}`);
    const pinnedCurrentV2TreeSha256 = currentV2TreeHashes?.[kit.manifest.requirementId];
    assertSha256(pinnedCurrentV2TreeSha256, `current-v2 pinned tree for ${kit.manifest.requirementId}`);
    const currentV2 = buildSourceDrivenBranchCurrentV2Files(kit);
    assert(currentV2.manifestSha256 === pinnedCurrentV2ManifestSha256, `current-v2 expected manifest reconstruction does not match its explicit archive-derived pin for ${kit.manifest.requirementId}`);
    assert(currentV2.treeSha256 === pinnedCurrentV2TreeSha256, `current-v2 expected tree reconstruction does not match its explicit archive-derived pin for ${kit.manifest.requirementId}`);
    await checkExpectedKitFiles(root, kitRoot, currentV2.files, "pinned current-v2 source-driven branch kit");
    const snapshot = await snapshotExpectedKit(root, kitRoot, currentV2.files, "pinned current-v2 source-driven branch kit");
    assert(snapshot.treeSha256 === pinnedCurrentV2TreeSha256, `active current-v2 tree differs from its explicit archive-derived pin for ${kit.manifest.requirementId}`);
    return {kit, kitRoot, variant: currentV2.variant, expectedFiles: currentV2.files, snapshot};
  }
  const pinnedPreviousV2ManifestSha256 = previousV2ManifestHashes?.[kit.manifest.requirementId];
  if (pinnedPreviousV2ManifestSha256 && actualManifestSha256 === pinnedPreviousV2ManifestSha256) {
    assertSha256(pinnedPreviousV2ManifestSha256, `previous-v2 pinned manifest for ${kit.manifest.requirementId}`);
    const pinnedPreviousV2TreeSha256 = previousV2TreeHashes?.[kit.manifest.requirementId];
    assertSha256(pinnedPreviousV2TreeSha256, `previous-v2 pinned tree for ${kit.manifest.requirementId}`);
    const previousV2 = buildSourceDrivenBranchPreviousV2Files(kit);
    assert(previousV2.manifestSha256 === pinnedPreviousV2ManifestSha256, `previous-v2 expected manifest reconstruction does not match its explicit pin for ${kit.manifest.requirementId}`);
    assert(previousV2.treeSha256 === pinnedPreviousV2TreeSha256, `previous-v2 expected tree reconstruction does not match its explicit pin for ${kit.manifest.requirementId}`);
    await checkExpectedKitFiles(root, kitRoot, previousV2.files, "pinned previous-v2 source-driven branch kit");
    const snapshot = await snapshotExpectedKit(root, kitRoot, previousV2.files, "pinned previous-v2 source-driven branch kit");
    assert(snapshot.treeSha256 === pinnedPreviousV2TreeSha256, `active previous-v2 tree differs from its explicit pin for ${kit.manifest.requirementId}`);
    return {kit, kitRoot, variant: previousV2.variant, expectedFiles: previousV2.files, snapshot};
  }
  const legacy = buildSourceDrivenBranchLegacyV1Files(kit);
  const pinnedManifestSha256 = legacyManifestHashes?.[kit.manifest.requirementId];
  assertSha256(pinnedManifestSha256, `legacy-v1 pinned manifest for ${kit.manifest.requirementId}`);
  assert(legacy.manifestSha256 === pinnedManifestSha256, `legacy-v1 expected manifest reconstruction does not match its explicit pin for ${kit.manifest.requirementId}`);
  assert(actualManifest && actualManifestSha256 === pinnedManifestSha256, `active kit is neither current-v3, pinned current-v2, pinned previous-v2, nor the explicitly pinned legacy-v1 tree (${currentError.message})`);
  await checkExpectedKitFiles(root, kitRoot, legacy.files, "pinned legacy-v1 source-driven branch kit");
  return {
    kit,
    kitRoot,
    variant: legacy.variant,
    expectedFiles: legacy.files,
    snapshot: await snapshotExpectedKit(root, kitRoot, legacy.files, "pinned legacy-v1 source-driven branch kit"),
  };
}

async function inspectArchivableKitWithGeneratorDrift({
  root,
  currentKit,
  profiles,
  testOnlyApprovedRuntime,
  previousTraceSpecGeneratorSha256,
  legacyManifestHashes,
  previousV2ManifestHashes,
  previousV2TreeHashes,
  currentV2ManifestHashes,
  currentV2TreeHashes,
}) {
  const inspectionOptions = {
    root,
    legacyManifestHashes,
    previousV2ManifestHashes,
    previousV2TreeHashes,
    currentV2ManifestHashes,
    currentV2TreeHashes,
  };
  try {
    const inspected = await inspectArchivableKit({...inspectionOptions, kit: currentKit});
    assert(
      previousTraceSpecGeneratorSha256 === undefined || previousTraceSpecGeneratorSha256 === null,
      "previous trace-spec generator SHA-256 must be omitted when the active kit trace specification is current",
    );
    return {
      ...inspected,
      replacementKit: currentKit,
      traceSpecDriftProof: null,
      traceSpecIndexDriftProof: null,
    };
  } catch (currentError) {
    const activeManifest = await readActiveKitManifest(root, kitRootFor(root, currentKit));
    const activeTraceSpec = activeManifest.value?.bindings?.traceSpec;
    const activeTraceSpecIndex = activeManifest.value?.bindings?.traceSpecIndex;
    const hasHistoricalTraceSpec =
      activeTraceSpec?.file === currentKit.bound.specFile && SHA256.test(activeTraceSpec?.sha256 || "") &&
      activeTraceSpec.sha256 !== currentKit.bound.specDocument.sha256;
    if (hasHistoricalTraceSpec) {
      assert(
        previousTraceSpecGeneratorSha256 !== undefined && previousTraceSpecGeneratorSha256 !== null,
        `trace specification changed; --previous-trace-spec-generator-sha256 is required to prove ${TRACE_SPEC_GENERATOR_FIELD}-only drift`,
      );
      const reconstructed = await reconstructGeneratorDriftHistoricalKit({
        root,
        currentKit,
        profiles,
        testOnlyApprovedRuntime,
        previousTraceSpecGeneratorSha256,
      });
      const inspected = await inspectArchivableKit({...inspectionOptions, kit: reconstructed.historicalKit});
      return {
        ...inspected,
        replacementKit: currentKit,
        traceSpecDriftProof: reconstructed.proof,
        traceSpecIndexDriftProof: null,
      };
    }
    const hasHistoricalGlobalIndex =
      activeTraceSpec?.file === currentKit.bound.specFile &&
      activeTraceSpec?.sha256 === currentKit.bound.specDocument.sha256 &&
      activeTraceSpecIndex?.file === INDEX_RELATIVE && SHA256.test(activeTraceSpecIndex?.sha256 || "") &&
      activeTraceSpecIndex.sha256 !== currentKit.bound.indexDocument.sha256;
    if (!hasHistoricalGlobalIndex) throw currentError;
    assert(
      previousTraceSpecGeneratorSha256 === undefined || previousTraceSpecGeneratorSha256 === null,
      "previous trace-spec generator SHA-256 must be omitted when the active selected trace specification is current",
    );
    const reconstructed = await reconstructGlobalIndexOnlyHistoricalKit({
      root,
      currentKit,
      profiles,
      testOnlyApprovedRuntime,
    });
    const inspected = await inspectArchivableKit({...inspectionOptions, kit: reconstructed.historicalKit});
    return {
      ...inspected,
      replacementKit: currentKit,
      traceSpecDriftProof: null,
      traceSpecIndexDriftProof: reconstructed.proof,
    };
  }
}

function archiveRecord(plan) {
  const archivedManifest = plan.expectedFiles.get("kit-manifest.json").content;
  const traceSpecDriftProof = plan.traceSpecDriftProof ?? null;
  const traceSpecIndexDriftProof = plan.traceSpecIndexDriftProof ?? null;
  assert(!(traceSpecDriftProof && traceSpecIndexDriftProof), "archive plan cannot contain two drift proof modes");
  return {
    schemaVersion: traceSpecIndexDriftProof ? 3 : traceSpecDriftProof ? 2 : 1,
    artifactType: "source-driven-branch-unsigned-template-stale-archive-record",
    status: "archived-current-checked-unsigned-template-only-not-evidence",
    sourceKit: portable(path.relative(plan.root, plan.kitRoot)),
    archivedKitRoot: "kit",
    animationId: plan.kit.manifest.animationId,
    requirementId: plan.kit.manifest.requirementId,
    templateVariant: plan.variant,
    bindings: {
      traceSpec: {file: plan.kit.bound.specFile, sha256: plan.kit.bound.specDocument.sha256},
      traceSpecIndex: {file: INDEX_RELATIVE, sha256: plan.kit.bound.indexDocument.sha256},
      fixtureManifest: {file: plan.kit.bound.profile.fixtureManifest, sha256: plan.kit.fixture.document.sha256},
      runtime: runtimeIdentity(plan.kit.runtime),
      archivedCaptureKitManifestSha256: digest(archivedManifest),
      currentSchemaCaptureKitManifestSha256: digest(plan.replacementKit.files.get("kit-manifest.json").content),
    },
    ...(traceSpecDriftProof ? {traceSpecDriftProof} : {}),
    ...(traceSpecIndexDriftProof ? {traceSpecIndexDriftProof} : {}),
    archivedTree: {
      algorithm: SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM,
      sha256: plan.snapshot.treeSha256,
      fileCount: plan.snapshot.fileCount,
    },
    authority: {
      runtimeLaunched: false,
      framesCaptured: 0,
      humanIdentityRecorded: false,
      humanReviewRecorded: false,
      ownerReviewRecorded: false,
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    },
    statement: "This append-only record preserves only an exactly checked empty unsigned source-driven branch capture-kit template. Atomic rename preserves its bytes; it is not runtime evidence, human review, owner acceptance, or strict completion.",
  };
}

function archiveIntegrity(recordBytes, plan) {
  return {
    schemaVersion: 1,
    artifactType: "source-driven-branch-unsigned-template-full-tree-integrity",
    status: "append-only-integrity-binding-not-evidence",
    animationId: plan.kit.manifest.animationId,
    requirementId: plan.kit.manifest.requirementId,
    archiveRecord: {file: "archive-record.json", sha256: digest(recordBytes)},
    archivedKit: {
      root: "kit",
      algorithm: SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM,
      sha256: plan.snapshot.treeSha256,
      fileCount: plan.snapshot.fileCount,
      inventory: plan.snapshot.inventory,
    },
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
  };
}

async function ensureArchiveRequirementParent(root, plan) {
  const archiveRoot = path.join(root, SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT);
  await ensureFixedDirectoryTree(root, archiveRoot, "source-driven branch stale archive root");
  const [realRoot, realArchive] = await Promise.all([realpath(root), realpath(archiveRoot)]);
  assert(realArchive === path.join(realRoot, SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT), "source-driven branch stale archive is not at its fixed project location");
  assert(!inside(realArchive, path.join(realRoot, "source-assets")), "source-driven branch stale archive must be outside source-assets");
  const requirementParent = path.join(archiveRoot, plan.kit.manifest.animationId, safeRequirementId(plan.kit.manifest.requirementId));
  return ensureFixedDirectoryTree(root, requirementParent, "source-driven branch archive requirement parent");
}

async function verifyArchiveSlot(root, archiveSlot, plan, recordBytes, integrityBytes, slotIdentity) {
  await assertNoSymlinkComponents(root, archiveSlot);
  if (slotIdentity) await assertDirectoryIdentity(root, archiveSlot, slotIdentity, "append-only source-driven branch archive slot");
  const expectedFiles = [
    "archive-record.json",
    SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE,
    ...[...plan.expectedFiles.keys()].map((file) => `kit/${file}`),
  ].sort();
  exact(await listFiles(archiveSlot), expectedFiles, "append-only source-driven branch archive file set");
  for (const [file, bytes] of [["archive-record.json", recordBytes], [SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE, integrityBytes]]) {
    const absolute = path.join(archiveSlot, file);
    const info = await lstat(absolute);
    assert(info.isFile() && !info.isSymbolicLink() && info.nlink === 1 && (info.mode & 0o777) === 0o444, `append-only archive metadata mode/link drift: ${file}`);
    assert((await readFile(absolute)).equals(bytes), `append-only archive metadata differs: ${file}`);
  }
  const archivedSnapshot = await snapshotExpectedKit(root, path.join(archiveSlot, "kit"), plan.expectedFiles, "append-only archived source-driven branch kit");
  assert(archivedSnapshot.treeSha256 === plan.snapshot.treeSha256, "append-only archived kit tree identity differs");
}

async function verifyOwnedArchiveMetadata(root, transaction) {
  await assertDirectoryIdentity(root, transaction.archiveSlot, transaction.slotIdentity, "source-driven branch archive slot");
  const entries = (await readdir(transaction.archiveSlot)).sort();
  const expected = [...transaction.metadata.keys()].sort();
  exact(entries, expected, "source-driven branch pre-move archive-slot inventory");
  for (const [basename, ownership] of transaction.metadata) {
    await captureRegularFile(root, path.join(transaction.archiveSlot, basename), `source-driven archive metadata ${basename}`, {
      expectedSha256: ownership.sha256,
      expectedMode: ownership.mode,
      expectedNode: ownership.node,
      requireSingleLink: true,
    });
  }
}

async function rollbackArchiveTransaction({root, plan, transaction}) {
  if (transaction.kitMoved) {
    const active = await lstatIfPresent(plan.kitRoot);
    assert(!active, "cannot safely roll back archived kit because the active kit path reappeared");
    await assertDirectoryIdentity(root, transaction.archiveSlot, transaction.slotIdentity, "source-driven branch rollback archive slot");
    const archivedIdentity = await captureDirectoryIdentity(root, transaction.archivedKitRoot, "source-driven branch rollback archived kit");
    assert(sameNodeIdentity(archivedIdentity.node, transaction.sourceKitIdentity.node), "cannot safely roll back archived kit because its inode changed");
    const snapshot = await snapshotExpectedKit(root, transaction.archivedKitRoot, plan.expectedFiles, "source-driven branch rollback archived kit");
    assert(snapshot.treeSha256 === plan.snapshot.treeSha256, "cannot safely roll back archived kit because its tree changed");
    await rename(transaction.archivedKitRoot, plan.kitRoot);
    const restored = await captureDirectoryIdentity(root, plan.kitRoot, "source-driven branch restored active kit");
    assert(sameNodeIdentity(restored.node, transaction.sourceKitIdentity.node), "restored source-driven branch kit inode changed");
    transaction.kitMoved = false;
  }
  for (const [basename, ownership] of [...transaction.metadata.entries()].reverse()) {
    await removeOwnedFileIfUnchanged(path.join(transaction.archiveSlot, basename), ownership);
  }
  await removeOwnedEmptyDirectory(transaction.archiveSlot, transaction.slotIdentity);
}

async function archiveOnePlan({
  plan,
  profiles,
  testOnlyApprovedRuntime,
  previousTraceSpecGeneratorSha256,
  legacyManifestHashes,
  previousV2ManifestHashes,
  previousV2TreeHashes,
  currentV2ManifestHashes,
  currentV2TreeHashes,
  transactionHooks,
}) {
  const currentKit = await buildSourceDrivenBranchCaptureKit({projectRoot: plan.root, specFile: plan.kit.bound.specFile, runtime: plan.kit.runtime, profiles, testOnlyApprovedRuntime});
  assertExpectedFileMapsEqual(plan.replacementKit.files, currentKit.files, "archive replacement current-schema derivation");
  const currentPlan = await inspectArchivableKitWithGeneratorDrift({
    root: plan.root,
    currentKit,
    profiles,
    testOnlyApprovedRuntime,
    previousTraceSpecGeneratorSha256,
    legacyManifestHashes,
    previousV2ManifestHashes,
    previousV2TreeHashes,
    currentV2ManifestHashes,
    currentV2TreeHashes,
  });
  assert(currentPlan.variant === plan.variant && currentPlan.snapshot.treeSha256 === plan.snapshot.treeSha256, "active kit changed after archive preflight; stale CAS refused");
  exact(currentPlan.traceSpecDriftProof, plan.traceSpecDriftProof, "archive trace-spec generator drift proof");
  exact(currentPlan.traceSpecIndexDriftProof, plan.traceSpecIndexDriftProof, "archive global index-only drift proof");

  assert(
    sameNodeIdentity(currentPlan.snapshot.rootIdentity.node, plan.snapshot.rootIdentity.node),
    "active kit root inode changed after archive preflight; stale CAS refused",
  );
  const requirementParent = await ensureArchiveRequirementParent(plan.root, plan);
  const archiveSlot = path.join(requirementParent.path, plan.snapshot.treeSha256);
  const archivedKitRoot = path.join(archiveSlot, "kit");
  await assertNoSymlinkComponents(plan.root, archiveSlot);
  const recordBytes = Buffer.from(`${canonicalJson(archiveRecord({...plan, root: plan.root}))}\n`);
  const integrityBytes = Buffer.from(`${canonicalJson(archiveIntegrity(recordBytes, plan))}\n`);
  const transaction = {
    archiveSlot,
    archivedKitRoot,
    slotIdentity: null,
    sourceKitIdentity: plan.snapshot.rootIdentity,
    metadata: new Map(),
    kitMoved: false,
  };
  let installed = false;
  try {
    await assertDirectoryIdentity(plan.root, requirementParent.path, requirementParent.identity, "source-driven branch archive requirement parent");
    await mkdir(archiveSlot, {recursive: false, mode: 0o700});
    transaction.slotIdentity = await captureDirectoryIdentity(plan.root, archiveSlot, "source-driven branch exclusive archive slot");
    for (const [basename, bytes] of [["archive-record.json", recordBytes], [SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE, integrityBytes]]) {
      const ownership = await writeOwnedExclusive({
        root: plan.root,
        parent: archiveSlot,
        parentIdentity: transaction.slotIdentity,
        candidate: path.join(archiveSlot, basename),
        bytes,
        mode: 0o444,
        label: `source-driven archive metadata ${basename}`,
        registerOwnership: (created) => transaction.metadata.set(basename, created),
      });
      transaction.metadata.set(basename, ownership);
    }
    await verifyOwnedArchiveMetadata(plan.root, transaction);
    if (typeof transactionHooks.beforeKitMove === "function") await transactionHooks.beforeKitMove({kitRoot: plan.kitRoot, staging: archiveSlot, archiveSlot});
    await verifyOwnedArchiveMetadata(plan.root, transaction);

    const casKit = await buildSourceDrivenBranchCaptureKit({projectRoot: plan.root, specFile: plan.kit.bound.specFile, runtime: plan.kit.runtime, profiles, testOnlyApprovedRuntime});
    assertExpectedFileMapsEqual(plan.replacementKit.files, casKit.files, "archive final replacement current-schema derivation");
    const casPlan = await inspectArchivableKitWithGeneratorDrift({
      root: plan.root,
      currentKit: casKit,
      profiles,
      testOnlyApprovedRuntime,
      previousTraceSpecGeneratorSha256,
      legacyManifestHashes,
      previousV2ManifestHashes,
      previousV2TreeHashes,
      currentV2ManifestHashes,
      currentV2TreeHashes,
    });
    assert(casPlan.variant === plan.variant && casPlan.snapshot.treeSha256 === plan.snapshot.treeSha256, "active kit changed immediately before atomic archive rename; stale CAS refused");
    exact(casPlan.traceSpecDriftProof, plan.traceSpecDriftProof, "archive final trace-spec generator drift proof");
    exact(casPlan.traceSpecIndexDriftProof, plan.traceSpecIndexDriftProof, "archive final global index-only drift proof");
    assert(sameNodeIdentity(casPlan.snapshot.rootIdentity.node, transaction.sourceKitIdentity.node), "active kit root inode changed immediately before archive move; stale CAS refused");
    await verifyOwnedArchiveMetadata(plan.root, transaction);
    assert(!(await lstatIfPresent(archivedKitRoot)), "append-only archive kit destination appeared during archive transaction; refusing overwrite");

    await rename(plan.kitRoot, archivedKitRoot);
    transaction.kitMoved = true;
    const movedIdentity = await captureDirectoryIdentity(plan.root, archivedKitRoot, "atomically archived source-driven branch kit");
    assert(sameNodeIdentity(movedIdentity.node, transaction.sourceKitIdentity.node), "atomically archived kit inode changed");
    if (typeof transactionHooks.afterKitMove === "function") await transactionHooks.afterKitMove({kitRoot: plan.kitRoot, stagedKit: archivedKitRoot, staging: archiveSlot, archiveSlot});
    await assertDirectoryIdentity(plan.root, archiveSlot, transaction.slotIdentity, "source-driven branch archive slot after kit move");
    const stagedSnapshot = await snapshotExpectedKit(plan.root, archivedKitRoot, plan.expectedFiles, "atomically archived source-driven branch kit");
    assert(stagedSnapshot.treeSha256 === plan.snapshot.treeSha256 && sameNodeIdentity(stagedSnapshot.rootIdentity.node, transaction.sourceKitIdentity.node), "active kit changed during atomic archive move; stale CAS refused");
    await chmodOwnedDirectory(plan.root, archiveSlot, transaction.slotIdentity, 0o755, "source-driven branch final archive slot");
    await verifyArchiveSlot(plan.root, archiveSlot, plan, recordBytes, integrityBytes, transaction.slotIdentity);
    installed = true;
    if (typeof transactionHooks.afterArchiveInstall === "function") await transactionHooks.afterArchiveInstall({kitRoot: plan.kitRoot, archiveSlot});
    await verifyArchiveSlot(plan.root, archiveSlot, plan, recordBytes, integrityBytes, transaction.slotIdentity);
    return {
      status: "archived-current-unsigned-template-only",
      kitRoot: plan.kitRoot,
      archiveRoot: archiveSlot,
      archivedKitRoot: path.join(archiveSlot, "kit"),
      archiveRecord: path.join(archiveSlot, "archive-record.json"),
      archiveIntegrity: path.join(archiveSlot, SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE),
      animationId: plan.kit.manifest.animationId,
      requirementId: plan.kit.manifest.requirementId,
      templateVariant: plan.variant,
      archivedTreeSha256: plan.snapshot.treeSha256,
      archivedFileCount: plan.snapshot.fileCount,
      traceSpecSha256: plan.kit.bound.specDocument.sha256,
      replacementTraceSpecSha256: plan.replacementKit.bound.specDocument.sha256,
      traceSpecIndexSha256: plan.kit.bound.indexDocument.sha256,
      replacementTraceSpecIndexSha256: plan.replacementKit.bound.indexDocument.sha256,
      traceSpecDriftProof: plan.traceSpecDriftProof,
      traceSpecIndexDriftProof: plan.traceSpecIndexDriftProof,
      runtimeExecutableSha256: plan.kit.runtime.executableSha256,
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    };
  } catch (error) {
    if (installed) throw new Error(`${error.message}; append-only archive was installed and preserved at ${portable(path.relative(plan.root, archiveSlot))}`);
    let rollbackError = null;
    try {
      if (transaction.slotIdentity) await rollbackArchiveTransaction({root: plan.root, plan, transaction});
    } catch (rollbackFailure) {
      rollbackError = rollbackFailure;
    }
    if (rollbackError) throw new Error(`${error.message}; archive rollback failed: ${rollbackError.message}`);
    throw error;
  }
}

export async function archiveCurrentSourceDrivenBranchCaptureKits({
  projectRoot = PROJECT_ROOT,
  specFiles = [],
  runtime,
  profiles = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  testOnlyApprovedRuntime,
  legacyManifestHashes = SOURCE_DRIVEN_BRANCH_LEGACY_V1_MANIFEST_SHA256,
  previousV2ManifestHashes = SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_MANIFEST_SHA256,
  previousV2TreeHashes = SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_TREE_SHA256,
  currentV2ManifestHashes = SOURCE_DRIVEN_BRANCH_CURRENT_V2_MANIFEST_SHA256,
  currentV2TreeHashes = SOURCE_DRIVEN_BRANCH_CURRENT_V2_TREE_SHA256,
  previousTraceSpecGeneratorSha256,
  transactionHooks = {},
}) {
  const root = path.resolve(projectRoot);
  const effectiveTestOnlyApprovedRuntime = testOnlyApprovedRuntime === undefined
    ? runtime?.testOnlyApprovedRuntime
    : testOnlyApprovedRuntime;
  const selected = specFiles.length ? specFiles : profileEntries(profiles).filter(({profile}) => profile.captureEligible === true).map(({spec}) => spec.specFile);
  assert(new Set(selected).size === selected.length, "duplicate --spec arguments are not allowed");
  const plans = [];
  for (const specFile of selected) {
    const currentKit = await buildSourceDrivenBranchCaptureKit({projectRoot: root, specFile, runtime, profiles, testOnlyApprovedRuntime: effectiveTestOnlyApprovedRuntime});
    const inspected = await inspectArchivableKitWithGeneratorDrift({
      root,
      currentKit,
      profiles,
      testOnlyApprovedRuntime: effectiveTestOnlyApprovedRuntime,
      previousTraceSpecGeneratorSha256,
      legacyManifestHashes,
      previousV2ManifestHashes,
      previousV2TreeHashes,
      currentV2ManifestHashes,
      currentV2TreeHashes,
    });
    plans.push({...inspected, root});
  }
  const results = [];
  for (const plan of plans) {
    results.push(await archiveOnePlan({
      plan,
      profiles,
      testOnlyApprovedRuntime: effectiveTestOnlyApprovedRuntime,
      previousTraceSpecGeneratorSha256,
      legacyManifestHashes,
      previousV2ManifestHashes,
      previousV2TreeHashes,
      currentV2ManifestHashes,
      currentV2TreeHashes,
      transactionHooks,
    }));
  }
  return results;
}

async function ensureOwnedKitSubdirectories({root, kitRoot, transaction, relativeDirectory}) {
  if (relativeDirectory === ".") return transaction.directories.get("");
  let cursor = kitRoot;
  let relativeCursor = "";
  for (const part of relativeDirectory.split(path.sep).filter(Boolean)) {
    const parentOwnership = transaction.directories.get(relativeCursor);
    assert(parentOwnership, `source-driven scaffold lost ownership of ${relativeCursor || "kit root"}`);
    await assertDirectoryIdentity(root, cursor, parentOwnership, `source-driven scaffold ${relativeCursor || "kit root"}`);
    cursor = path.join(cursor, part);
    relativeCursor = relativeCursor ? path.join(relativeCursor, part) : part;
    const existing = transaction.directories.get(relativeCursor);
    if (existing) {
      await assertDirectoryIdentity(root, cursor, existing, `source-driven scaffold ${portable(relativeCursor)}`);
      continue;
    }
    await assertNoSymlinkComponents(root, cursor);
    await mkdir(cursor, {recursive: false, mode: 0o755});
    const ownership = await captureDirectoryIdentity(root, cursor, `source-driven scaffold ${portable(relativeCursor)}`);
    transaction.directories.set(relativeCursor, ownership);
  }
  return transaction.directories.get(relativeCursor);
}

async function cleanupScaffoldTransaction(transaction) {
  for (const [relative, ownership] of [...transaction.files.entries()].reverse()) {
    await removeOwnedFileIfUnchanged(path.join(transaction.kitRoot, relative), ownership);
  }
  const depth = (relative) => relative ? relative.split(path.sep).length : 0;
  const directories = [...transaction.directories.entries()].sort(([left], [right]) => depth(right) - depth(left));
  for (const [relative, ownership] of directories) {
    await removeOwnedEmptyDirectory(relative ? path.join(transaction.kitRoot, relative) : transaction.kitRoot, ownership);
  }
}

export async function scaffoldSourceDrivenBranchCaptureKits({
  projectRoot = PROJECT_ROOT,
  specFiles = [],
  runtime,
  profiles = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  testOnlyApprovedRuntime,
  check = false,
  archiveCurrentUnsignedTemplate = false,
  legacyManifestHashes = SOURCE_DRIVEN_BRANCH_LEGACY_V1_MANIFEST_SHA256,
  previousV2ManifestHashes = SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_MANIFEST_SHA256,
  previousV2TreeHashes = SOURCE_DRIVEN_BRANCH_PREVIOUS_V2_TREE_SHA256,
  currentV2ManifestHashes = SOURCE_DRIVEN_BRANCH_CURRENT_V2_MANIFEST_SHA256,
  currentV2TreeHashes = SOURCE_DRIVEN_BRANCH_CURRENT_V2_TREE_SHA256,
  previousTraceSpecGeneratorSha256,
  transactionHooks = {},
}) {
  assert(!(check && archiveCurrentUnsignedTemplate), "--check and --archive-current-unsigned-template are mutually exclusive");
  if (previousTraceSpecGeneratorSha256 !== undefined && previousTraceSpecGeneratorSha256 !== null) {
    assertSha256(previousTraceSpecGeneratorSha256, "previous trace-spec generator SHA-256");
    assert(archiveCurrentUnsignedTemplate, "previous trace-spec generator SHA-256 is valid only with --archive-current-unsigned-template");
  }
  if (archiveCurrentUnsignedTemplate) {
    return archiveCurrentSourceDrivenBranchCaptureKits({
      projectRoot,
      specFiles,
      runtime,
      profiles,
      testOnlyApprovedRuntime,
      legacyManifestHashes,
      previousV2ManifestHashes,
      previousV2TreeHashes,
      currentV2ManifestHashes,
      currentV2TreeHashes,
      previousTraceSpecGeneratorSha256,
      transactionHooks,
    });
  }
  const root = path.resolve(projectRoot);
  const selected = specFiles.length ? specFiles : profileEntries(profiles).filter(({profile}) => profile.captureEligible === true).map(({spec}) => spec.specFile);
  assert(new Set(selected).size === selected.length, "duplicate --spec arguments are not allowed");
  const kits = [];
  for (const specFile of selected) kits.push(await buildSourceDrivenBranchCaptureKit({projectRoot: root, specFile, runtime, profiles, testOnlyApprovedRuntime}));
  if (check) return Promise.all(kits.map((kit) => checkOne(root, kit)));
  const created = [];
  try {
    for (const kit of kits) {
      const kitRoot = kitRootFor(root, kit);
      const kitParent = path.dirname(kitRoot);
      await assertNoSymlinkComponents(root, kitRoot);
      const {identity: parentIdentity} = await ensureFixedDirectoryTree(root, kitParent, "source-driven branch kit parent");
      await assertDirectoryIdentity(root, kitParent, parentIdentity, "source-driven branch kit parent");
      await mkdir(kitRoot, {recursive: false, mode: 0o755});
      const rootIdentity = await captureDirectoryIdentity(root, kitRoot, "source-driven branch kit root");
      const transaction = {kitRoot, parentIdentity, directories: new Map([["", rootIdentity]]), files: new Map()};
      created.push(transaction);
      if (typeof transactionHooks.afterKitRootCreated === "function") await transactionHooks.afterKitRootCreated({kitRoot});
      for (const [relative, descriptor] of kit.files) {
        assertProjectRelative(relative, `capture kit file ${relative}`);
        const destination = path.join(kitRoot, relative);
        const relativeParent = path.dirname(relative);
        const directoryOwnership = await ensureOwnedKitSubdirectories({root, kitRoot, transaction, relativeDirectory: relativeParent});
        const ownership = await writeOwnedExclusive({
          root,
          parent: path.dirname(destination),
          parentIdentity: directoryOwnership,
          candidate: destination,
          bytes: descriptor.content,
          mode: descriptor.mode,
          label: `source-driven scaffold ${relative}`,
          registerOwnership: (created) => transaction.files.set(relative, created),
        });
        transaction.files.set(relative, ownership);
        if (typeof transactionHooks.afterKitFileWritten === "function") await transactionHooks.afterKitFileWritten({kitRoot, relative, destination});
      }
    }
    return Promise.all(kits.map((kit) => checkOne(root, kit)));
  } catch (error) {
    for (const transaction of [...created].reverse()) await cleanupScaffoldTransaction(transaction);
    throw error;
  }
}

export function parseArguments(argv) {
  const options = {
    specFiles: [],
    playerApp: DEFAULT_PROJECTOR_APP,
    check: false,
    archiveCurrentUnsignedTemplate: false,
    previousTraceSpecGeneratorSha256: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const take = () => {
      const next = argv[index + 1];
      assert(next && !next.startsWith("--"), `${value} requires a value`);
      index += 1;
      return next;
    };
    if (value === "--spec") options.specFiles.push(take());
    else if (value === "--player-app") options.playerApp = path.resolve(take());
    else if (value === "--check") options.check = true;
    else if (value === "--archive-current-unsigned-template") options.archiveCurrentUnsignedTemplate = true;
    else if (value === "--previous-trace-spec-generator-sha256") options.previousTraceSpecGeneratorSha256 = take();
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  assert(new Set(options.specFiles).size === options.specFiles.length, "duplicate --spec arguments are not allowed");
  assert(!(options.check && options.archiveCurrentUnsignedTemplate), "--check and --archive-current-unsigned-template are mutually exclusive");
  assert(
    !options.previousTraceSpecGeneratorSha256 || options.archiveCurrentUnsignedTemplate,
    "--previous-trace-spec-generator-sha256 requires --archive-current-unsigned-template",
  );
  if (options.previousTraceSpecGeneratorSha256) {
    assert(
      SHA256.test(options.previousTraceSpecGeneratorSha256),
      "--previous-trace-spec-generator-sha256 must be a lowercase SHA-256",
    );
  }
  return options;
}

export function usage() {
  return `Usage: node scripts/scaffold-source-driven-branch-capture-kit.mjs [options]\n\nOptions:\n  --spec <file>        Repeatable exact allowlisted EN ready spec; omit for every currently eligible spec\n  --player-app <path>  Adobe Flash Player Projector .app to version/hash-bind\n  --check              Fail-closed byte/mode/tree/current-binding verification only\n  --archive-current-unsigned-template\n                       After a complete current-v3, archive-pinned current-v2, pinned previous-v2, or pinned legacy-v1 check, atomically move the exact empty kit into the fixed append-only stale archive\n  --previous-trace-spec-generator-sha256 <sha256>\n                       Required only when an active empty kit binds an older trace spec; reconstructs the generator drift and, when exact, the fixed coverage-v1 ten-field to coverage-v2 seventeen-field includedPaths schema upgrade before archival\n  -h, --help           Show this help\n\nOutput is fixed under ${DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT}/<animation>/<requirement>. Archives are fixed under ${SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT}/. The regenerated IR fixture is explicitly blocked pending a named-human GUI sandbox smoke approval and cannot yet produce a kit. The factory refuses overwrite and never launches a runtime, opens a SWF, captures frames, fills human identity, changes migrations/status/approval/source-assets, or grants strict/human/owner acceptance.\n`;
}

function portableResult(root, result) {
  const converted = {...result};
  for (const field of ["kitRoot", "archiveRoot", "archivedKitRoot", "archiveRecord", "archiveIntegrity"]) {
    if (typeof converted[field] === "string" && path.isAbsolute(converted[field])) converted[field] = portable(path.relative(root, converted[field]));
  }
  return converted;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const runtime = await inspectProjectorRuntime({playerApp: options.playerApp});
  const results = await scaffoldSourceDrivenBranchCaptureKits({
    projectRoot: PROJECT_ROOT,
    specFiles: options.specFiles,
    runtime,
    check: options.check,
    archiveCurrentUnsignedTemplate: options.archiveCurrentUnsignedTemplate,
    previousTraceSpecGeneratorSha256: options.previousTraceSpecGeneratorSha256,
  });
  process.stdout.write(`${JSON.stringify(results.map((result) => portableResult(PROJECT_ROOT, result)), null, 2)}\n`);
  process.stderr.write("Unsigned empty templates only; no runtime was launched and migration/status/review/approval remain unchanged.\n");
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
