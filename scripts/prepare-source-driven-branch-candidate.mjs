#!/usr/bin/env node

import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, link, lstat, mkdir, open, readFile, realpath, readdir, rmdir, stat, unlink} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {
  canonicalJson,
  safeRequirementId,
  sha256Text,
  validateExecutionProof,
} from "./build-course-trace-specs.mjs";
import {
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {assertStrictFullDomainRequirement} from "./lib/strict-full-domain-requirement.mjs";
import {
  CANDIDATE_AUTHORITY,
  CANDIDATE_STATUS,
  PROMOTION_REQUIRED,
  assertExactKeys,
  assertNoExistingSymlinkComponents,
  assertObject,
  assertRealSessionArtifactPath,
  assertSha256,
  assertString,
  digest,
  ensureRealOutputDirectory,
  exists,
  isLexicallyInside,
  orderedFrameSetSha256,
  parseSessionTime,
  portable,
  readJson,
  readJsonLines,
  recordHash,
  renderJson,
  requireProjection,
  resolveFixedOutputPath,
  resolveInputPath,
  validateNamedHuman,
  verifyReceipt,
} from "./prepare-root-capture-candidate.mjs";
import {buildSourceDrivenBranchCaptureKit} from "./scaffold-source-driven-branch-capture-kit.mjs";
import {
  APPROVED_SOURCE_DRIVEN_RUNTIME,
  DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
  SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE,
  SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE,
  SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_PATH,
  SOURCE_DRIVEN_BRANCH_PROOF_MODE,
  SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT,
  SOURCE_DRIVEN_ENVIRONMENT_STATEMENT,
  SOURCE_DRIVEN_LAUNCH_STATEMENT,
} from "./source-driven-branch-capture-contracts.mjs";

export {
  APPROVED_SOURCE_DRIVEN_RUNTIME,
  SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
  SOURCE_DRIVEN_BRANCH_PROOF_MODE,
  SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT,
  SOURCE_DRIVEN_ENVIRONMENT_STATEMENT,
  SOURCE_DRIVEN_LAUNCH_STATEMENT,
} from "./source-driven-branch-capture-contracts.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const TRACE_INDEX_PATH = "migrations/course-shell-pilot-trace-spec-index.json";
const KIT_ROOT = "work/source-driven-branch-capture-kits";
const KIT_STATUS = "unsigned-empty-template-only-not-evidence";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SOURCE_DRIVEN_CAPTURE_SANDBOX_BYTES = Buffer.from("(version 1)\n(allow default)\n(deny network*)\n(deny appleevent-send)\n(deny file-write*)\n");
const MAX_SOURCE_DRIVEN_FRAME_PNG_BYTES = 16 * 1024 * 1024;
const MAX_SOURCE_DRIVEN_FRAME_PNG_TOTAL_BYTES = 512 * 1024 * 1024;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function resolveApprovedRuntime(root, testOnlyApprovedRuntime) {
  if (testOnlyApprovedRuntime === undefined) return APPROVED_SOURCE_DRIVEN_RUNTIME;
  const [actualRoot, actualRepositoryRoot] = await Promise.all([realpath(root), realpath(repositoryRoot)]);
  invariant(actualRoot !== actualRepositoryRoot, "testOnlyApprovedRuntime is forbidden for the production repository root");
  assertExactKeys(testOnlyApprovedRuntime, ["runtimeId", "name", "version", "executableSha256"], "test-only approved source-driven runtime");
  for (const field of ["runtimeId", "name", "version"]) assertString(testOnlyApprovedRuntime[field], `test-only approved source-driven runtime.${field}`);
  assertSha256(testOnlyApprovedRuntime.executableSha256, "test-only approved source-driven runtime.executableSha256");
  return structuredClone(testOnlyApprovedRuntime);
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

function pathsOverlap(left, right) {
  return isLexicallyInside(left, right) || isLexicallyInside(right, left);
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function stateSha256(value) {
  return sha256Text(canonicalJson(value));
}

export function sourceDrivenEventRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

export function sourceDrivenFrameStateRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

export function sourceDrivenEnvironmentReceiptSha256(record) {
  return recordHash(record, "receiptSha256");
}

export function sourceDrivenSessionAttestationSha256(record) {
  return recordHash(record, "attestationSha256");
}

export function sourceDrivenLaunchReceiptSha256(record) {
  return recordHash(record, "receiptSha256");
}

export function sourceDrivenAdapterEntryRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

export function sourceDrivenRandomTrialRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

export function sourceDrivenOperationRecordSha256(record) {
  return recordHash(record, "recordSha256");
}

export function sourceDrivenMasterEvidenceChainBindingSha256(record) {
  return recordHash(record, "bindingSha256");
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

function validateMasterEvidenceChainShape(chain, label) {
  assertExactKeys(chain, ["algorithm", "root", "intermediates", "final", "bindingSha256"], label);
  invariant(chain.algorithm === SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.masterBindingAlgorithm, `${label} algorithm changed`);
  assertExactKeys(chain.root, ["source", "sha256"], `${label}.root`);
  invariant(chain.root.source === "adapterEntryLog.sequence-1.recordSha256", `${label} root source changed`);
  assertSha256(chain.root.sha256, `${label}.root.sha256`);
  invariant(Array.isArray(chain.intermediates) && chain.intermediates.length === MASTER_EVIDENCE_INTERMEDIATE_SOURCES.length, `${label} intermediate count changed`);
  for (const [index, item] of chain.intermediates.entries()) {
    assertExactKeys(item, ["sequence", "source", "sha256"], `${label}.intermediates[${index}]`);
    invariant(item.sequence === index + 1 && item.source === MASTER_EVIDENCE_INTERMEDIATE_SOURCES[index], `${label}.intermediates[${index}] identity changed`);
    assertSha256(item.sha256, `${label}.intermediates[${index}].sha256`);
  }
  assertExactKeys(chain.final, ["source", "sha256"], `${label}.final`);
  invariant(chain.final.source === "operationLog.sequence-145.recordSha256", `${label} final source changed`);
  assertSha256(chain.final.sha256, `${label}.final.sha256`);
  assertSha256(chain.bindingSha256, `${label}.bindingSha256`);
  invariant(chain.bindingSha256 === sourceDrivenMasterEvidenceChainBindingSha256(chain), `${label} binding SHA-256 mismatch`);
}

function candidateResultSha256(record) {
  return recordHash(record, "resultSha256");
}

function expectedSpecPath(spec) {
  return `migrations/${spec.animationId}/audit/trace-specs/${safeRequirementId(spec.requirementId)}.json`;
}

function expectedKitPath(spec) {
  return `${KIT_ROOT}/${spec.animationId}/${safeRequirementId(spec.requirementId)}/kit-manifest.json`;
}

function scheduleBinding(spec) {
  return {
    naturalEntrySha256: stateSha256(spec.schedule.naturalEntry),
    sourceDrivenEventsSha256: stateSha256(spec.schedule.sourceDrivenEvents),
    stateCheckpointsSha256: stateSha256(spec.schedule.stateCheckpoints),
    terminalSemanticsSha256: stateSha256(spec.schedule.terminalSemantics),
  };
}

function assertObservedState(expected, observed, label) {
  assertObject(expected, `${label} expected state`);
  assertObject(observed, `${label} observed state`);
  const visit = (wanted, actual, cursor) => {
    if (Array.isArray(wanted)) {
      if (!Array.isArray(actual) || !same(wanted, actual)) throw new Error(`${cursor} differs from the source-specified state`);
      return;
    }
    if (wanted && typeof wanted === "object") {
      if (!actual || typeof actual !== "object" || Array.isArray(actual)) throw new Error(`${cursor} must be an object`);
      for (const [key, value] of Object.entries(wanted)) {
        if (!Object.hasOwn(actual, key)) throw new Error(`${cursor}.${key} is missing`);
        visit(value, actual[key], `${cursor}.${key}`);
      }
      return;
    }
    if (!Object.is(wanted, actual)) throw new Error(`${cursor} differs from the source-specified state`);
  };
  visit(expected, observed, label);
}

function selectSharedProfile(spec) {
  const matches = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES.filter(({animationId}) => animationId === spec.animationId);
  invariant(matches.length === 1, `${spec.animationId || "unknown"}: source-driven branch preparer is not uniquely allowlisted`);
  const profile = matches[0];
  invariant(profile.captureEligible === true, `${profile.animationId}: source-driven branch capture is blocked — ${profile.captureBlocker || "shared profile is not capture-eligible"}`);
  const expected = profile.specs.filter(({requirementId}) => requirementId === spec.requirementId);
  invariant(expected.length === 1, `${spec.animationId}/${spec.requirementId || "unknown"}: source-driven requirement is not uniquely allowlisted`);
  return {profile, expected: expected[0]};
}

export function validateSourceDrivenBranchSpec(spec) {
  assertObject(spec, "source-driven trace spec");
  const {profile, expected} = selectSharedProfile(spec);
  invariant(spec.schemaVersion === 1 && spec.artifactType === "course-pilot-original-runtime-trace-specification", "source-driven trace spec schema/type is invalid");
  invariant(spec.traceSpecStatus === "source-schedule-ready-for-authoritative-execution", "source-driven trace spec is not ready for execution");
  invariant(spec.traceModel?.kind === "stateful-natural-trace" && spec.traceModel?.domainScope === "nested" && spec.traceModel?.naturalPlaybackClaimed === true, "source-driven trace model is not a nested natural trace");
  invariant(spec.identity?.frameDomainId === profile.frameDomainId && spec.frameDomain?.id === profile.frameDomainId, "source-driven frame-domain identity changed");
  invariant(spec.frameDomain?.kind === "nested" && spec.frameDomain?.parentEntryFrame === 6 && spec.frameDomain?.localEntryFrame === 1, "source-driven adapter entry must be root frame 6 / local frame 1");
  invariant(spec.frameDomain?.frameCount === 142 && spec.frameDomain?.nativeStage?.width === 800 && spec.frameDomain?.nativeStage?.height === 600 && spec.frameDomain?.fps === 12, "source-driven native frame-domain facts changed");
  invariant(spec.identity?.language === "en" && spec.identity?.seed === "0", "only the allowlisted English identity-seed-0 requirements are eligible");
  invariant(new Set(["sound-0", "sound-1"]).has(spec.identity?.scenario), "source-driven scenario must be sound-0 or sound-1");
  const outcome = Number(spec.identity.scenario.at(-1));
  invariant(spec.requirementId === `req:${profile.frameDomainId}:sound-${outcome}:en`, "source-driven requirement identity changed");
  invariant(same(spec.identity.requiredRange, {firstFrame: 1, lastFrame: 142}), "source-driven required range must be exactly 1..142");
  invariant(spec.identity.baselineAuthorityRequirement === "original-runtime-natural-trace", "source-driven baseline authority requirement changed");
  invariant(spec.sourceBindings?.sourceSwf?.sha256 === profile.childSha256, "source-driven preserved child SHA-256 changed");
  const derivation = spec.sourceBindings?.scheduleDerivation;
  invariant(derivation?.status === "hash-bound-static-source-derived-minimal-child-entry-candidate-not-runtime-execution", "source-driven schedule derivation status changed");
  invariant(derivation?.candidateScope === "isolated-minimal-child-entry-adapter-for-exact-preserved-child" && derivation?.executionEvidenceCreated === false, "source-driven derivation scope or execution boundary changed");
  invariant(same(derivation?.naturalRandomPolicy, {
    sourceCall: "random(2)",
    allowedMethod: "restart-untouched-child-and-classify-naturally-observed-outcome",
    seedInjectionAllowed: false,
    forcedBranchAllowed: false,
  }), "source-driven natural random policy changed");
  const schedule = spec.schedule;
  invariant(schedule?.status === "source-evidenced-executable", "source-driven schedule is not source-evidenced executable");
  invariant(schedule.noExternalActionsRequired === true && schedule.noActionsRequired === false, "source-driven external-action policy changed");
  invariant(Array.isArray(schedule.orderedSteps) && schedule.orderedSteps.length === 0, "source-driven schedule must not contain operator-dispatched steps");
  invariant(schedule.sourceProvenEventFreeFirstCycle === undefined, "source-driven event schedule conflicts with an event-free contract");
  invariant(schedule.naturalEntry?.status === "source-evidenced" && schedule.naturalEntry?.sourceTarget?.adapterScope === "minimal-hash-bound-child-entry-adapter", "source-driven natural adapter entry is absent");
  invariant(schedule.naturalEntry.sourceTarget.completeOriginalCourseShellClaimed === false, "source-driven adapter must not claim the complete original shell");
  const events = schedule.sourceDrivenEvents;
  invariant(Array.isArray(events) && events.length === 3, "source-driven schedule must contain exactly three source events");
  invariant(same(events.map(({order}) => order), [1, 2, 3]) && same(events.map(({trigger}) => trigger?.frame), [1, 5, 142]), "source-driven events must be ordered at frames 1, 5, and 142");
  invariant(events.every(({trigger}) => trigger?.timelineId === profile.frameDomainId), "source-driven event timeline changed");
  const selectedInstanceName = `Mc_Sound_${outcome}`;
  const selectedObjectId = outcome === 0 ? 7 : 8;
  invariant(events[0].trigger?.sourceExpression === "tempNum = random(2)" && events[0].trigger?.execution === "natural-avm1-random-observation-only", "frame-1 random event changed");
  invariant(events[0].sourceTarget?.requiredNaturallyObservedOutcome === outcome && events[0].sourceTarget?.seedInjectionAllowed === false, "frame-1 outcome/seed policy changed");
  invariant(events[0].postState?.branchSelection?.observedOutcome === outcome && events[0].postState?.branchSelection?.selectedInstanceName === selectedInstanceName && events[0].postState?.branchSelection?.selectedObjectId === selectedObjectId && events[0].postState?.branchSelection?.seedInjected === false, "frame-1 selected branch changed");
  invariant(events[1].sourceTarget?.selectedInstanceName === selectedInstanceName && events[1].sourceTarget?.selectedObjectId === selectedObjectId && events[1].sourceTarget?.command === "gotoAndPlay(2)", "frame-5 selected-audio event changed");
  invariant(events[2].sourceTarget?.command === "stop()" && events[2].postState?.localFrame === 142 && events[2].postState?.localPlayState === "stopped", "frame-142 stop event changed");
  invariant(events[2].postState?.naturallyObservedBranch === spec.identity.scenario, "terminal source-driven branch changed");
  invariant(Array.isArray(schedule.stateCheckpoints) && schedule.stateCheckpoints.length === 3 && same(schedule.stateCheckpoints.map(({expectedState}) => expectedState?.localFrame), [1, 5, 142]), "source-driven checkpoints must cover frames 1, 5, and 142");
  invariant(schedule.terminalSemantics?.status === "source-evidenced" && schedule.terminalSemantics?.kind === "stopped-terminal", "source-driven terminal semantics changed");
  invariant(same(schedule.terminalSemantics.expectedState, events[2].postState), "source-driven terminal state differs from frame-142 source event");
  invariant(spec.executionEvidence?.status === "not-executed-by-this-generator" && spec.executionEvidence?.executionReport === null && spec.executionEvidence?.originalRuntimeCaptureManifest === null, "source-driven spec already claims execution evidence");
  invariant(expected.outcome === outcome && expected.specFile === expectedSpecPath(spec), "source-driven shared profile requirement binding changed");
  return {profile, expected, outcome, selectedInstanceName, selectedObjectId, events};
}

async function readBoundFile({root, workspace, declared, label, bases = [root], outsideKit = false, type = "file"}) {
  if (outsideKit) assertRealSessionArtifactPath(declared, label);
  const candidate = await resolveInputPath({root, workspace, declared, label, bases, type});
  await assertNoExistingSymlinkComponents(root, candidate, label);
  if (outsideKit) {
    const actualRoot = await realpath(root);
    const actual = await realpath(candidate);
    const kit = path.join(actualRoot, KIT_ROOT);
    invariant(!isLexicallyInside(actual, kit), `${label} must be real session evidence outside the unsigned capture kit`);
  }
  return candidate;
}

async function loadBoundSpec({root, specPath}) {
  const specDocument = await readJson(specPath, "source-driven trace spec");
  const facts = validateSourceDrivenBranchSpec(specDocument.value);
  const spec = specDocument.value;
  const specRelative = portable(path.relative(root, specPath));
  invariant(specRelative === expectedSpecPath(spec), `source-driven trace spec path must be ${expectedSpecPath(spec)}`);
  const workspace = path.join(root, "migrations", spec.animationId);
  const [manifestDocument, coverageDocument, inventoryDocument, indexDocument] = await Promise.all([
    readJson(path.join(workspace, "migration.json"), "source-driven migration manifest"),
    readJson(path.join(workspace, "evidence", "full-frame-coverage.json"), "source-driven full-frame coverage"),
    readJson(path.join(workspace, "audit", "scenario-inventory.json"), "source-driven scenario inventory"),
    readJson(path.join(root, TRACE_INDEX_PATH), "source-driven trace-spec index"),
  ]);
  const manifest = manifestDocument.value;
  const coverage = coverageDocument.value;
  const inventory = inventoryDocument.value;
  invariant((manifest.animationId || manifest.id) === spec.animationId && coverage.animationId === spec.animationId && inventory.animationId === spec.animationId, "source-driven current evidence animation identities differ");
  requireProjection(spec.sourceBindings.migrationManifest, {
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    sha256: technicalManifestSha256(manifest),
    excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
  }, "source-driven technical manifest");
  requireProjection(spec.sourceBindings.fullFrameCoverage, {
    projection: TRACE_COVERAGE_PROJECTION.id,
    sha256: traceCoverageSha256(coverage),
    includedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
    excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
  }, "source-driven coverage");
  requireProjection(spec.sourceBindings.scenarioInventory, {
    projection: SCENARIO_INVENTORY_PROJECTION.id,
    sha256: scenarioInventorySha256(inventory),
    excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
  }, "source-driven scenario inventory");
  const requirements = (coverage.requirements || []).filter(({requirementId}) => requirementId === spec.requirementId);
  invariant(requirements.length === 1, "source-driven coverage must contain exactly one matching requirement");
  const requirement = requirements[0];
  assertStrictFullDomainRequirement(
    requirement,
    spec.frameDomain.frameCount,
    `${spec.animationId}/${spec.requirementId} source-driven original-runtime candidate`,
  );
  const identity = {
    requirementId: spec.requirementId,
    scenario: spec.identity.scenario,
    frameDomainId: spec.identity.frameDomainId,
    traceId: spec.identity.traceId,
    language: spec.identity.language,
    seed: spec.identity.seed,
    requiredRange: spec.identity.requiredRange,
    entryState: requirement.entryState,
    entryStateSha256: spec.identity.entryStateSha256,
    baselineAuthorityRequirement: spec.identity.baselineAuthorityRequirement,
  };
  const coverageIdentity = Object.fromEntries(TRACE_COVERAGE_PROJECTION.includedRequirementPaths.filter((key) => requirement[key] !== undefined).map((key) => [key, requirement[key]]));
  invariant(same(identity, coverageIdentity), "source-driven spec identity differs from current coverage");
  const pilots = (indexDocument.value.pilots || []).filter(({animationId}) => animationId === spec.animationId);
  const indexed = (pilots[0]?.traceSpecs || []).filter(({requirementId}) => requirementId === spec.requirementId);
  invariant(pilots.length === 1 && indexed.length === 1, "source-driven spec is not uniquely indexed");
  invariant(indexed[0].file === specRelative && indexed[0].sha256 === specDocument.sha256 && indexed[0].status === spec.traceSpecStatus && indexed[0].traceModel === "stateful-natural-trace", "source-driven trace-spec index binding is stale");
  invariant(indexed[0].expectedExecutionReport === `migrations/${spec.animationId}/${spec.executionEvidence.expectedExecutionReportPath}`, "source-driven indexed execution path changed");
  const sourcePath = await readBoundFile({root, workspace, declared: spec.sourceBindings.sourceSwf.path, label: "source-driven preserved child", bases: [root]});
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  invariant(isLexicallyInside(await realpath(sourcePath), await realpath(preservedRoot)), "source-driven child is outside the preserved archive");
  invariant(digest(await readFile(sourcePath)) === spec.sourceBindings.sourceSwf.sha256, "source-driven preserved child SHA-256 is stale");
  const generator = spec.sourceBindings.scheduleDerivation.generator;
  const generatorPath = await readBoundFile({root, workspace, declared: generator.path, label: "source-driven trace generator", bases: [root]});
  invariant(digest(await readFile(generatorPath)) === generator.sha256, "source-driven trace generator SHA-256 is stale");
  const immutableInputs = [
    {path: specPath, sha256: specDocument.sha256, label: "trace spec"},
    {path: path.join(root, TRACE_INDEX_PATH), sha256: indexDocument.sha256, label: "trace index"},
    {path: path.join(workspace, "migration.json"), sha256: manifestDocument.sha256, label: "migration manifest"},
    {path: path.join(workspace, "evidence", "full-frame-coverage.json"), sha256: coverageDocument.sha256, label: "full-frame coverage"},
    {path: path.join(workspace, "audit", "scenario-inventory.json"), sha256: inventoryDocument.sha256, label: "scenario inventory"},
    {path: sourcePath, sha256: spec.sourceBindings.sourceSwf.sha256, label: "preserved source"},
    {path: generatorPath, sha256: generator.sha256, label: "trace-spec generator"},
  ];
  return {
    root, workspace, spec, specDocument, specRelative, indexDocument, manifestDocument, coverageDocument, inventoryDocument,
    requirement, sourcePath, generatorPath, immutableInputs, ...facts,
  };
}

async function listKitFiles(kitRoot, directory = kitRoot, files = []) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const absolute = path.join(directory, entry.name);
    const relative = portable(path.relative(kitRoot, absolute));
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(), `source-driven deterministic v3 kit contains a symbolic link: ${relative}`);
    if (metadata.isDirectory()) await listKitFiles(kitRoot, absolute, files);
    else {
      invariant(metadata.isFile(), `source-driven deterministic v3 kit contains a non-file entry: ${relative}`);
      files.push(relative);
    }
  }
  return files;
}

async function validateAuthoritativeFixture({root, bound, fixtureManifestPath}) {
  const profile = bound.profile;
  const document = await readJson(fixtureManifestPath, "source-driven authoritative fixture manifest");
  invariant(document.sha256 === profile.fixtureManifestSha256, "source-driven fixture manifest is not the exact shared-profile identity");
  const fixture = document.value;
  invariant(fixture.schemaVersion === 1 && fixture.animationId === profile.animationId && fixture.fixtureDigest === profile.fixtureDigest, "source-driven fixture manifest identity/digest mismatch");
  invariant(fixture.directory === portable(path.dirname(profile.fixtureManifest)), "source-driven fixture manifest directory binding changed");
  invariant(fixture.generatedBy === "scripts/build-adobe-course-host-fixtures.mjs", "source-driven fixture generator path changed");
  invariant(fixture.compilation?.status === "compiled-deterministic-double-build" && fixture.compilation?.compilerDumpMarkerVerified === true && fixture.compilation?.hostSha256 === profile.hostSha256, "source-driven fixture compilation/host identity changed");
  invariant(fixture.source?.childSwf === bound.spec.sourceBindings.sourceSwf.path && fixture.source?.childSwfSha256 === profile.childSha256, "source-driven fixture child binding changed");
  invariant(fixture.source?.stage?.width === 800 && fixture.source?.stage?.height === 600 && fixture.source?.fps === 12, "source-driven fixture native stage/fps changed");
  invariant(fixture.sandbox?.networkDenied === true && fixture.sandbox?.localTcpDenied === true && fixture.sandbox?.appleEventsDenied === true && fixture.sandbox?.outsideWriteDenied === true && fixture.sandbox?.writesRestricted === true, "source-driven fixture sandbox semantics are not fail-closed");
  invariant(typeof fixture.strictAcceptanceEffect === "string" && fixture.strictAcceptanceEffect.startsWith("none;"), "source-driven fixture must have no strict-acceptance effect");
  invariant(fixture.evidenceHashes?.scenarioInventorySha256 === bound.inventoryDocument.sha256, "source-driven fixture scenario-inventory raw hash is stale");

  const generatedByPath = await readBoundFile({root, workspace: bound.workspace, declared: fixture.generatedBy, label: "source-driven fixture generator", bases: [root]});
  invariant(digest(await readFile(generatedByPath)) === fixture.generatedBySha256, "source-driven fixture generator SHA-256 is stale");
  const audioAuditPath = await readBoundFile({root, workspace: bound.workspace, declared: fixture.source.audioAudit, label: "source-driven fixture audio audit", bases: [root]});
  invariant(digest(await readFile(audioAuditPath)) === fixture.evidenceHashes?.audioAuditSha256, "source-driven fixture audio-audit SHA-256 is stale");

  const inventory = fixture.generatedFileHashes;
  invariant(Array.isArray(inventory) && inventory.length > 0, "source-driven fixture generated-file inventory is empty");
  const fixtureRoot = path.dirname(fixtureManifestPath);
  const seen = new Set();
  const files = new Map();
  for (const [index, descriptor] of inventory.entries()) {
    assertExactKeys(descriptor, ["path", "sha256"], `source-driven fixture inventory[${index}]`);
    assertString(descriptor.path, `source-driven fixture inventory[${index}].path`);
    assertSha256(descriptor.sha256, `source-driven fixture inventory[${index}].sha256`);
    invariant(!path.isAbsolute(descriptor.path) && !descriptor.path.split(/[\\/]/).includes("..") && portable(path.normalize(descriptor.path)) === descriptor.path && !seen.has(descriptor.path), `source-driven fixture inventory[${index}] path is unsafe or duplicated`);
    seen.add(descriptor.path);
    const absolute = path.join(fixtureRoot, descriptor.path);
    await assertNoExistingSymlinkComponents(root, absolute, `source-driven fixture inventory[${index}]`);
    const metadata = await lstat(absolute);
    invariant(metadata.isFile() && !metadata.isSymbolicLink(), `source-driven fixture inventory[${index}] is not a regular file`);
    const bytes = await readFile(absolute);
    invariant(digest(bytes) === descriptor.sha256, `source-driven fixture inventory hash is stale: ${descriptor.path}`);
    files.set(descriptor.path, {path: absolute, bytes, sha256: descriptor.sha256});
  }
  for (const [file, sha256] of [
    ["host.swf", profile.hostSha256],
    ["fixture-spec.json", profile.fixtureSpecSha256],
    ["sandbox.sb", profile.upstreamSandboxSha256],
    [profile.childRuntimePath, profile.childSha256],
  ]) invariant(files.get(file)?.sha256 === sha256, `source-driven authoritative fixture file hash mismatch: ${file}`);
  return {document, fixture, files, generatedByPath, audioAuditPath};
}

export async function validateSourceDrivenKitManifest({root, bound, kitManifestPath, approvedRuntime = APPROVED_SOURCE_DRIVEN_RUNTIME}) {
  const expectedRelative = expectedKitPath(bound.spec);
  invariant(portable(path.relative(root, kitManifestPath)) === expectedRelative, `source-driven kit manifest path must be ${expectedRelative}`);
  const document = await readJson(kitManifestPath, "source-driven kit manifest");
  const kit = document.value;
  invariant(kit.schemaVersion === 1 && kit.artifactType === "source-driven-natural-branch-capture-operator-kit" && kit.status === KIT_STATUS, "source-driven kit schema/type/status is invalid");
  const kitManifestInfo = await lstat(kitManifestPath);
  invariant(kitManifestInfo.isFile() && !kitManifestInfo.isSymbolicLink() && (kitManifestInfo.mode & 0o777) === 0o444, "source-driven kit manifest must be a read-only regular file");
  invariant(kit.animationId === bound.spec.animationId && kit.requirementId === bound.spec.requirementId && same(kit.identity, bound.spec.identity), "source-driven kit identity differs from the trace spec");
  invariant(kit.bindings?.schemaVersion === 1, "source-driven kit bindings schema is invalid");
  invariant(same(kit.bindings?.traceSpec, {file: bound.specRelative, sha256: bound.specDocument.sha256}), "source-driven kit trace-spec binding is stale");
  invariant(same(kit.bindings?.traceSpecIndex, {file: TRACE_INDEX_PATH, sha256: bound.indexDocument.sha256}), "source-driven kit trace-index binding is stale");
  invariant(same(kit.bindings?.sourceSwf, bound.spec.sourceBindings.sourceSwf), "source-driven kit source binding changed");
  invariant(same(kit.bindings?.projections, {
    migrationManifest: bound.spec.sourceBindings.migrationManifest,
    fullFrameCoverage: bound.spec.sourceBindings.fullFrameCoverage,
    scenarioInventory: bound.spec.sourceBindings.scenarioInventory,
  }), "source-driven kit technical projections differ from the trace spec");
  invariant(same(kit.scheduleContract, {
    sourceDrivenEventFrames: [1, 5, 142],
    naturallyObservedOutcome: bound.outcome,
    naturallyObservedBranch: bound.spec.identity.scenario,
    sourceCall: "random(2)",
    seedInjectionAllowed: false,
    forcedBranchAllowed: false,
    operatorActionsAllowed: 0,
    requiredFrameCount: 142,
    checkpointCount: 3,
    terminalKind: "stopped-terminal",
  }), "source-driven kit schedule contract changed");
  invariant(same(kit.runtime, {
    runtimeId: approvedRuntime.runtimeId,
    name: approvedRuntime.name,
    version: approvedRuntime.version,
    requestedAppPath: kit.runtime?.requestedAppPath,
    appPath: kit.runtime?.appPath,
    executablePath: kit.runtime?.executablePath,
    executableSha256: approvedRuntime.executableSha256,
  }), "source-driven kit does not bind the approved Adobe Projector");
  for (const field of ["requestedAppPath", "appPath", "executablePath"]) invariant(path.isAbsolute(kit.runtime[field] || ""), `source-driven kit runtime.${field} must be an absolute path`);
  assertExactKeys(kit.runtimeTree, ["file", "sha256"], "source-driven kit runtimeTree");
  invariant(kit.runtimeTree.file === "runtime-tree-manifest.json", "source-driven kit runtime-tree manifest path changed");
  assertSha256(kit.runtimeTree.sha256, "source-driven kit runtime-tree manifest SHA-256");
  assertExactKeys(kit.sandbox, ["file", "sha256", "networkDenied", "fileWritesDenied", "launcherIncluded"], "source-driven kit sandbox");
  invariant(kit.sandbox.file === "sandbox.sb", "source-driven kit sandbox path changed");
  assertSha256(kit.sandbox.sha256, "source-driven kit sandbox SHA-256");
  invariant(kit.sandbox?.networkDenied === true && kit.sandbox?.fileWritesDenied === true && kit.sandbox?.launcherIncluded === false, "source-driven kit sandbox boundary changed");
  invariant(kit.authority?.isolatedMinimalAdapterOnly === true && kit.authority?.originalShellAuthority === false && kit.authority?.audioOrLanguageAuthority === false && kit.authority?.runtimeLaunchedByFactory === false && kit.authority?.framesCapturedByFactory === 0 && kit.authority?.humanIdentityRecorded === false && kit.authority?.humanReviewRecorded === false && kit.authority?.ownerReviewRecorded === false && kit.authority?.strictAcceptanceEffect === false && kit.authority?.migrationStatusChanged === false, "source-driven kit authority boundary changed");
  const kitRoot = path.dirname(kitManifestPath);
  const contract = kit.templateContract;
  assertExactKeys(contract, ["schemaVersion", "candidateInputContract", "capturePlan", "files", "adapterEntry", "randomTrials", "sourceEvents", "frameStates", "unifiedOperations", "masterEvidenceChain", "authority"], "source-driven kit v3 template contract");
  invariant(contract.schemaVersion === 3, "source-driven kit template contract must be v3");
  assertExactKeys(contract.candidateInputContract, ["module", "export", "schemaVersion", "canonicalEncoding", "sha256", "exact"], "source-driven kit candidate input contract");
  assertExactKeys(contract.candidateInputContract.module, ["file", "sha256"], "source-driven kit candidate contract module");
  const projectContractModulePath = path.join(root, SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE);
  const [projectContractModuleBytes, importedContractModuleBytes] = await Promise.all([readFile(projectContractModulePath), readFile(SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_PATH)]);
  const contractModuleSha256 = digest(projectContractModuleBytes);
  invariant(contractModuleSha256 === digest(importedContractModuleBytes), "project shared source-driven branch contract module differs from the imported module");
  invariant(same(contract.candidateInputContract, {
    module: {file: SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE, sha256: contractModuleSha256},
    export: "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT",
    schemaVersion: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.schemaVersion,
    canonicalEncoding: "canonical-json-v1",
    sha256: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
    exact: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
  }), "source-driven kit candidate input contract/module/hash differs from the shared v3 contract");
  invariant(digest(Buffer.from(canonicalJson(contract.candidateInputContract.exact))) === SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256, "source-driven kit exact candidate input contract hash is stale");
  invariant(same(contract.adapterEntry, {preTraceActivationCount: 1, beginHandoffCount: 1, totalRecordCount: 2}), "source-driven kit adapter-entry template contract changed");
  invariant(same(contract.randomTrials, {acceptedSessionNaturalAttemptCount: 1, acceptedTrialCount: 1, acceptedTrialMustBeOnlyRecord: true, firstPreviousRecordSha256From: "adapterEntryLog.finalRecordSha256"}), "source-driven kit random-trial template contract changed");
  invariant(same(contract.sourceEvents, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.sourceEvents), "source-driven kit source-event causal contract changed");
  invariant(same(contract.frameStates, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.frameStates), "source-driven kit frame-state causal contract changed");
  invariant(same(contract.unifiedOperations, {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145, firstRecordPreviousRecordSha256From: "randomTrialLog.finalRecordSha256", everyRecordReferencesExactlyOneRawEventOrFrameRecord: true}), "source-driven kit unified-operation template contract changed");
  invariant(same(contract.masterEvidenceChain, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.masterEvidenceChain), "source-driven kit master-evidence contract changed");
  invariant(same(contract.authority, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority), "source-driven kit candidate authority contract changed");
  const expectedTemplatePaths = new Set(Object.values(SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.inputTemplatePaths).filter((file) => file !== "frames"));
  assertExactKeys(contract.capturePlan, ["file", "sha256"], "source-driven kit capture-plan descriptor");
  invariant(contract.capturePlan.file === "capture-plan.template.json", "source-driven kit capture-plan path changed");
  invariant(Array.isArray(contract.files) && contract.files.length === 10 && new Set(contract.files.map(({file}) => file)).size === 10 && contract.files.every(({file}) => expectedTemplatePaths.has(file)), "source-driven kit template contract must bind the exact ten v3 input templates");
  const templateFiles = [];
  for (const [index, descriptor] of [contract.capturePlan, ...contract.files].entries()) {
    assertExactKeys(descriptor, ["file", "sha256"], `source-driven kit template contract file ${index + 1}`);
    assertSha256(descriptor.sha256, `source-driven kit template contract file ${index + 1}.sha256`);
    const absolute = path.join(kitRoot, descriptor.file);
    await assertNoExistingSymlinkComponents(root, absolute, `source-driven kit template contract file ${index + 1}`);
    const metadata = await lstat(absolute);
    invariant(metadata.isFile() && !metadata.isSymbolicLink() && (metadata.mode & 0o777) === 0o444 && digest(await readFile(absolute)) === descriptor.sha256, `source-driven kit template contract file ${index + 1} differs or is not read-only`);
    templateFiles.push({path: absolute, descriptor});
  }
  const runtimeTreePath = path.join(kitRoot, kit.runtimeTree.file);
  await assertNoExistingSymlinkComponents(root, runtimeTreePath, "source-driven runtime-tree manifest");
  const runtimeTreeDocument = await readJson(runtimeTreePath, "source-driven runtime-tree manifest");
  const runtimeTreeInfo = await lstat(runtimeTreePath);
  invariant(runtimeTreeInfo.isFile() && !runtimeTreeInfo.isSymbolicLink() && (runtimeTreeInfo.mode & 0o777) === 0o444, "source-driven runtime-tree manifest must be read-only");
  invariant(runtimeTreeDocument.sha256 === kit.runtimeTree.sha256, "source-driven runtime-tree manifest SHA-256 mismatch");
  const tree = runtimeTreeDocument.value;
  invariant(tree.schemaVersion === 1 && tree.artifactType === "source-driven-branch-isolated-minimal-adapter-runtime-tree" && tree.status === KIT_STATUS, "source-driven runtime-tree schema/type/status is invalid");
  invariant(tree.animationId === bound.spec.animationId && tree.requirementId === bound.spec.requirementId, "source-driven runtime-tree identity mismatch");
  assertExactKeys(kit.bindings.fixtureManifest, ["file", "sha256", "fixtureDigest"], "source-driven kit fixtureManifest binding");
  invariant(same(kit.bindings.fixtureManifest, {file: bound.profile.fixtureManifest, sha256: bound.profile.fixtureManifestSha256, fixtureDigest: bound.profile.fixtureDigest}), "source-driven kit fixture binding is not the exact shared-profile identity");
  const fixtureManifestPath = await readBoundFile({root, workspace: bound.workspace, declared: kit.bindings.fixtureManifest.file, label: "source-driven fixture manifest", bases: [root]});
  const fixtureDocument = await validateAuthoritativeFixture({root, bound, fixtureManifestPath});
  invariant(same(tree.fixtureManifest, {sourceFile: kit.bindings.fixtureManifest.file, sourceSha256: kit.bindings.fixtureManifest.sha256, stagedFile: tree.fixtureManifest?.stagedFile}), "source-driven runtime-tree fixture binding changed");
  invariant(typeof tree.fixtureManifest.stagedFile === "string" && tree.fixtureManifest.stagedFile.startsWith("runtime-tree/") && !tree.fixtureManifest.stagedFile.includes(".."), "source-driven staged fixture-manifest path is unsafe");
  const stagedFixtureManifestPath = path.join(kitRoot, tree.fixtureManifest.stagedFile);
  await assertNoExistingSymlinkComponents(root, stagedFixtureManifestPath, "source-driven staged fixture manifest");
  const stagedFixtureInfo = await lstat(stagedFixtureManifestPath);
  invariant(stagedFixtureInfo.isFile() && !stagedFixtureInfo.isSymbolicLink() && (stagedFixtureInfo.mode & 0o777) === 0o444 && digest(await readFile(stagedFixtureManifestPath)) === kit.bindings.fixtureManifest.sha256, "source-driven staged fixture manifest differs or is not read-only");
  invariant(tree.isolation?.minimalAdapterOnly === true && tree.isolation?.originalCourseShellIncluded === false && tree.isolation?.sourceChildUntouched === true && tree.isolation?.stagedChildReadOnly === true && tree.isolation?.networkDenied === true && tree.isolation?.externalActionsRequired === false, "source-driven runtime-tree isolation boundary changed");
  const expectedRuntimeFiles = [
    {source: "host.swf", destination: "runtime-tree/host.swf", role: "minimal-safe-adapter-host"},
    {source: bound.profile.childRuntimePath, destination: `runtime-tree/${bound.profile.childRuntimePath}`, role: "exact-preserved-child"},
    {source: "fixture-spec.json", destination: "runtime-tree/fixture-spec.json", role: "safe-adapter-specification"},
    {source: "sandbox.sb", destination: "runtime-tree/upstream-sandbox.sb", role: "exact-upstream-sandbox-reference"},
  ].map((descriptor) => ({...descriptor, sha256: fixtureDocument.files.get(descriptor.source).sha256, bytes: fixtureDocument.files.get(descriptor.source).bytes.length, stagedMode: "0444"}));
  invariant(same(tree.files, expectedRuntimeFiles), "source-driven runtime-tree must contain the exact four authoritative fixture roles/files");
  const roles = new Map();
  const destinations = new Set();
  const files = [];
  for (const [index, descriptor] of tree.files.entries()) {
    assertExactKeys(descriptor, ["source", "destination", "role", "sha256", "bytes", "stagedMode"], `runtime-tree files[${index}]`);
    assertSha256(descriptor.sha256, `runtime-tree files[${index}].sha256`);
    invariant(descriptor.destination.startsWith("runtime-tree/") && !descriptor.destination.includes("..") && !path.isAbsolute(descriptor.destination), `runtime-tree files[${index}] destination is unsafe`);
    invariant(descriptor.stagedMode === "0444" && Number.isInteger(descriptor.bytes) && descriptor.bytes > 0, `runtime-tree files[${index}] mode/size is invalid`);
    invariant(!roles.has(descriptor.role), `duplicate runtime-tree role ${descriptor.role}`);
    invariant(!destinations.has(descriptor.destination), `duplicate runtime-tree destination ${descriptor.destination}`);
    roles.set(descriptor.role, descriptor);
    destinations.add(descriptor.destination);
    const absolute = path.join(kitRoot, descriptor.destination);
    await assertNoExistingSymlinkComponents(root, absolute, `runtime-tree files[${index}]`);
    const metadata = await lstat(absolute);
    invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.size === descriptor.bytes && (metadata.mode & 0o777) === 0o444, `runtime-tree files[${index}] bytes/mode/type changed`);
    invariant(digest(await readFile(absolute)) === descriptor.sha256, `runtime-tree files[${index}] SHA-256 mismatch`);
    files.push({descriptor, path: absolute});
  }
  for (const role of ["minimal-safe-adapter-host", "exact-preserved-child", "safe-adapter-specification", "exact-upstream-sandbox-reference"]) invariant(roles.has(role), `source-driven runtime-tree is missing ${role}`);
  const sandboxPath = path.join(kitRoot, kit.sandbox.file);
  await assertNoExistingSymlinkComponents(root, sandboxPath, "source-driven sandbox");
  const sandboxBytes = await readFile(sandboxPath);
  const sandboxInfo = await lstat(sandboxPath);
  invariant(sandboxInfo.isFile() && !sandboxInfo.isSymbolicLink() && (sandboxInfo.mode & 0o777) === 0o444, "source-driven sandbox must be a read-only regular file");
  invariant(sandboxBytes.equals(SOURCE_DRIVEN_CAPTURE_SANDBOX_BYTES) && kit.sandbox.sha256 === digest(SOURCE_DRIVEN_CAPTURE_SANDBOX_BYTES), "source-driven sandbox is not the exact authoritative v3 profile");

  const expectedKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: root,
    specFile: bound.specRelative,
    runtime: kit.runtime,
    ...(same(approvedRuntime, APPROVED_SOURCE_DRIVEN_RUNTIME) ? {} : {testOnlyApprovedRuntime: approvedRuntime}),
  });
  const expectedFiles = [...expectedKit.files.keys()].sort();
  const actualFiles = (await listKitFiles(kitRoot)).sort();
  invariant(same(actualFiles, expectedFiles), "source-driven capture kit file set differs from the deterministic v3 scaffold");
  for (const [relative, expected] of expectedKit.files) {
    const absolute = path.join(kitRoot, relative);
    const metadata = await lstat(absolute);
    const bytes = await readFile(absolute);
    invariant(metadata.isFile() && !metadata.isSymbolicLink() && permissionMode(metadata) === expected.mode && bytes.equals(expected.content), `source-driven deterministic v3 kit file differs: ${relative}`);
  }
  return {
    document, kit, kitRoot, runtimeTreeDocument, tree, files, roles, sandboxPath, sandboxBytes,
    fixtureManifestPath, stagedFixtureManifestPath, templateFiles, fixtureFiles: [...fixtureDocument.files.values()],
    fixtureGeneratedByPath: fixtureDocument.generatedByPath, fixtureAudioAuditPath: fixtureDocument.audioAuditPath,
  };
}

function validateEnvironmentReceiptShape(receipt, bound) {
  assertExactKeys(receipt, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.environmentIsolationReceipt, "source-driven environment receipt");
  invariant(receipt.schemaVersion === 1 && receipt.evidenceType === "named-human-disposable-flash-runtime-environment-receipt", "source-driven environment receipt schema/type is invalid");
  invariant(receipt.animationId === bound.spec.animationId && receipt.requirementId === bound.spec.requirementId && UUID_PATTERN.test(receipt.sessionId || ""), "source-driven environment receipt identity is invalid");
  invariant(new Set(["restored-disposable-macos-vm-snapshot", "dedicated-one-time-macos-login-account"]).has(receipt.isolationMode), "source-driven environment is not disposable");
  assertExactKeys(receipt.operatingSystem, ["productVersion", "buildVersion", "architecture"], "source-driven environment operatingSystem");
  for (const value of Object.values(receipt.operatingSystem)) assertString(value, "source-driven environment operatingSystem field");
  assertExactKeys(receipt.account, ["userName", "uid", "homeDirectory", "realOsAccount", "dedicatedToCapture"], "source-driven environment account");
  invariant(Number.isInteger(receipt.account.uid) && receipt.account.uid >= 0 && path.isAbsolute(receipt.account.homeDirectory) && receipt.account.realOsAccount === true && receipt.account.dedicatedToCapture === true, "source-driven environment account is not a real dedicated account");
  assertExactKeys(receipt.profile, ["identifier", "createdForSession", "reused", "normalSharedObjectReadWriteSemantics", "resetOrDestroyedAfterSession"], "source-driven environment profile");
  invariant(typeof receipt.profile.identifier === "string" && receipt.profile.identifier && receipt.profile.createdForSession === true && receipt.profile.reused === false && receipt.profile.normalSharedObjectReadWriteSemantics === true && receipt.profile.resetOrDestroyedAfterSession === true, "source-driven Flash profile is not fresh, normal-semantics, and disposable");
  assertExactKeys(receipt.preflight, ["runningFlashProcessCount", "sharedObjectFileCount", "unexpectedFiles"], "source-driven environment preflight");
  invariant(receipt.preflight.runningFlashProcessCount === 0 && receipt.preflight.sharedObjectFileCount === 0 && Array.isArray(receipt.preflight.unexpectedFiles) && receipt.preflight.unexpectedFiles.length === 0, "source-driven environment preflight is not empty");
  assertExactKeys(receipt.postflight, ["unexpectedWrites", "unexpectedNetworkEvents", "profileResetOrDestroyed"], "source-driven environment postflight");
  invariant(Array.isArray(receipt.postflight.unexpectedWrites) && receipt.postflight.unexpectedWrites.length === 0 && Array.isArray(receipt.postflight.unexpectedNetworkEvents) && receipt.postflight.unexpectedNetworkEvents.length === 0 && receipt.postflight.profileResetOrDestroyed === true, "source-driven environment postflight contains unexpected effects");
  validateNamedHuman(receipt.operator);
  invariant(receipt.statement === SOURCE_DRIVEN_ENVIRONMENT_STATEMENT && receipt.receiptSha256 === sourceDrivenEnvironmentReceiptSha256(receipt), "source-driven environment receipt statement/hash is invalid");
  const startedAtMs = parseSessionTime(receipt.startedAt, "source-driven environment startedAt");
  const endedAtMs = parseSessionTime(receipt.endedAt, "source-driven environment endedAt");
  const signedAtMs = parseSessionTime(receipt.signedAt, "source-driven environment signedAt");
  invariant(endedAtMs > startedAtMs && signedAtMs >= endedAtMs && signedAtMs - endedAtMs <= 30 * 60 * 1000, "source-driven environment receipt timing is invalid");
  return {startedAtMs, endedAtMs, signedAtMs};
}

async function loadEnvironmentReceipt({root, bound, path: receiptPath}) {
  const document = await readJson(receiptPath, "source-driven environment receipt");
  const timing = validateEnvironmentReceiptShape(document.value, bound);
  return {...document, path: receiptPath, receipt: document.value, ...timing};
}

async function loadLaunchReceipt({root, bound, kitDocument, environmentDocument, receiptPath, approvedRuntime}) {
  const document = await readJson(receiptPath, "source-driven launch receipt");
  const receipt = document.value;
  assertExactKeys(receipt, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.launchReceipt, "source-driven launch receipt");
  invariant(receipt.schemaVersion === 1 && receipt.evidenceType === "named-human-source-driven-projector-launch-receipt", "source-driven launch receipt schema/type is invalid");
  invariant(receipt.sessionId === environmentDocument.receipt.sessionId && receipt.animationId === bound.spec.animationId && receipt.requirementId === bound.spec.requirementId, "source-driven launch receipt identity changed");
  validateNamedHuman(receipt.operator);
  invariant(same(receipt.operator, environmentDocument.receipt.operator), "source-driven launch operator differs from the environment operator");
  const relative = (candidate) => portable(path.relative(root, candidate));
  invariant(same(receipt.captureKit, {file: relative(path.join(kitDocument.kitRoot, "kit-manifest.json")), sha256: kitDocument.document.sha256}), "source-driven launch receipt kit binding changed");
  invariant(same(receipt.environmentIsolation, {file: relative(environmentDocument.path), sha256: environmentDocument.sha256}), "source-driven launch receipt environment binding changed");
  invariant(same(receipt.sandboxProfile, {file: relative(kitDocument.sandboxPath), sha256: kitDocument.kit.sandbox.sha256}), "source-driven launch receipt sandbox binding changed");
  invariant(same(receipt.runtime, {...approvedRuntime}), "source-driven launch receipt runtime binding changed");
  const adapter = kitDocument.roles.get("minimal-safe-adapter-host");
  const adapterPath = path.join(kitDocument.kitRoot, adapter.destination);
  invariant(same(receipt.adapter, {file: relative(adapterPath), sha256: adapter.sha256, readOnly: true, minimalAdapterOnly: true}), "source-driven launch receipt adapter binding changed");
  invariant(receipt.launchProtocol === "named-human-sandboxed-minimal-adapter-open", "source-driven launch protocol changed");
  assertExactKeys(receipt.projectorStart, ["executablePath", "processId", "startedAt", "launchedByNamedHuman", "launchedByCandidatePreparer"], "source-driven launch projectorStart");
  invariant(receipt.projectorStart.executablePath === kitDocument.kit.runtime.executablePath && Number.isInteger(receipt.projectorStart.processId) && receipt.projectorStart.processId > 1 && receipt.projectorStart.launchedByNamedHuman === true && receipt.projectorStart.launchedByCandidatePreparer === false, "source-driven Projector start was not a named-human external action");
  assertExactKeys(receipt.adapterOpen, ["file", "sha256", "openedAt", "playerWindowObserved", "sandboxProfileApplied", "networkDenied"], "source-driven launch adapterOpen");
  invariant(receipt.adapterOpen.file === receipt.adapter.file && receipt.adapterOpen.sha256 === adapter.sha256 && receipt.adapterOpen.playerWindowObserved === true && receipt.adapterOpen.sandboxProfileApplied === true && receipt.adapterOpen.networkDenied === true, "source-driven adapter open/sandbox observation is invalid");
  const startedAtMs = parseSessionTime(receipt.projectorStart.startedAt, "source-driven launch startedAt");
  const openedAtMs = parseSessionTime(receipt.adapterOpen.openedAt, "source-driven launch adapter openedAt");
  const signedAtMs = parseSessionTime(receipt.signedAt, "source-driven launch signedAt");
  invariant(environmentDocument.startedAtMs <= startedAtMs && openedAtMs >= startedAtMs && signedAtMs >= openedAtMs && environmentDocument.endedAtMs >= signedAtMs && signedAtMs - openedAtMs <= 30 * 60 * 1000, "source-driven launch receipt timing is invalid");
  invariant(receipt.statement === SOURCE_DRIVEN_LAUNCH_STATEMENT && receipt.receiptSha256 === sourceDrivenLaunchReceiptSha256(receipt), "source-driven launch receipt statement/hash is invalid");
  return {...document, path: receiptPath, receipt, startedAtMs, openedAtMs, signedAtMs};
}

async function loadToolchainReceipt({root, bound, receiptPath, expectedBinding, approvedRuntime}) {
  const document = await verifyReceipt({
    root,
    workspace: bound.workspace,
    receiptPath,
    captureSessionBindingFields: [
      "sessionId", "traceSpecSha256", "traceSpecIndexSha256", "sourceSwfSha256",
      "captureKitManifestSha256", "sandboxProfileSha256", "environmentIsolationReceiptSha256", "launchReceiptSha256",
    ],
  });
  invariant(same(document.receipt.runtime, {
    runtimeId: approvedRuntime.runtimeId,
    name: approvedRuntime.name,
    version: approvedRuntime.version,
  }), "source-driven toolchain receipt does not identify the approved Adobe Projector");
  invariant(same(document.receipt.captureSessionBinding, expectedBinding), "source-driven toolchain session binding differs from spec/kit/environment");
  invariant(document.receipt.identityArtifacts.some(({kind}) => kind === "executable-sha256-receipt"), "source-driven toolchain receipt lacks an executable SHA-256 artifact");
  let matched = false;
  const verifiedIdentityArtifacts = [];
  for (const [index, artifact] of document.receipt.identityArtifacts.entries()) {
    const artifactPath = await readBoundFile({root, workspace: bound.workspace, declared: artifact.file, label: `source-driven executable receipt ${index + 1}`, bases: [bound.workspace, root], outsideKit: true});
    const bytes = await readFile(artifactPath);
    const text = bytes.toString("utf8");
    if (artifact.kind === "executable-sha256-receipt" && text.split(/\r?\n/).includes(`executable_sha256=${approvedRuntime.executableSha256}`)) matched = true;
    verifiedIdentityArtifacts.push({path: artifactPath, sha256: digest(bytes), descriptor: artifact});
  }
  invariant(matched, "source-driven approved Projector executable SHA-256 was not observed");
  return {...document, path: receiptPath, identityArtifacts: verifiedIdentityArtifacts};
}

function commonRecordKeys() {
  return SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.commonRecord;
}

function commonRecordBinding(attestation) {
  return {
    animationId: attestation.animationId,
    requirementId: attestation.requirementId,
    proofMode: attestation.proofMode,
    sessionId: attestation.sessionId,
    acceptedAttemptId: attestation.naturalRandomObservation.acceptedAttemptId,
    traceSpecSha256: attestation.traceSpec.sha256,
    traceSpecIndexSha256: attestation.traceSpecIndex.sha256,
    sourceSwfSha256: attestation.sourceSwf.sha256,
    captureKitManifestSha256: attestation.captureKitManifest.sha256,
    sandboxProfileSha256: attestation.sandboxProfile.sha256,
    environmentIsolationReceiptSha256: attestation.environmentIsolation.sha256,
    launchReceiptSha256: attestation.launchReceipt.sha256,
    toolchainReceiptSha256: attestation.toolchainReceipt.sha256,
  };
}

function validateRecordIdentity(record, {bound, attestation, label}) {
  const binding = commonRecordBinding(attestation);
  invariant(record.schemaVersion === 1, `${label} schemaVersion is invalid`);
  for (const [field, value] of Object.entries(binding)) invariant(record[field] === value, `${label}.${field} binding is invalid`);
  invariant(same(record.operator, attestation.operator), `${label} operator differs from the session attestation`);
}

function validateBoundTime(record, {label, attestation, previousMonotonic, previousWall}) {
  invariant(Number.isFinite(record.monotonicTimeMs) && record.monotonicTimeMs > previousMonotonic && record.monotonicTimeMs >= 0 && record.monotonicTimeMs <= attestation.durationMs, `${label}.monotonicTimeMs is invalid or non-increasing`);
  const wall = Date.parse(record.occurredAt || "");
  invariant(Number.isFinite(wall) && wall > previousWall && wall >= attestation.startedAtMs && wall <= attestation.endedAtMs, `${label}.occurredAt is invalid, non-increasing, or outside the session`);
  invariant(Math.abs((wall - attestation.startedAtMs) - record.monotonicTimeMs) <= 1, `${label} wall and monotonic times do not identify the same instant`);
  return wall;
}

function validateRandomObservation(attestation, bound) {
  const observation = attestation.naturalRandomObservation;
  assertExactKeys(observation, [
    "sourceCall", "allowedMethod", "identitySeed", "identitySeedInjectedIntoAvm1", "seedInjected", "forcedBranch",
    "randomOverridden", "branchVariableWrittenByAdapter", "attempts", "acceptedAttemptId",
  ], "source-driven naturalRandomObservation");
  invariant(observation.sourceCall === "random(2)" && observation.allowedMethod === "restart-untouched-child-and-classify-naturally-observed-outcome" && observation.identitySeed === "0", "source-driven natural random policy binding changed");
  invariant(observation.identitySeedInjectedIntoAvm1 === false && observation.seedInjected === false && observation.forcedBranch === false && observation.randomOverridden === false && observation.branchVariableWrittenByAdapter === false, "source-driven random branch was seeded, forced, overridden, or written by the adapter");
  invariant(Array.isArray(observation.attempts) && observation.attempts.length === 1, "source-driven accepted session must contain exactly one natural random attempt");
  for (const [index, attempt] of observation.attempts.entries()) {
    assertExactKeys(attempt, ["attemptId", "sequence", "observedOutcome", "selectedInstanceName", "selectedObjectId", "disposition"], `source-driven random attempt ${index + 1}`);
    invariant(attempt.sequence === index + 1 && attempt.attemptId === `attempt-${String(index + 1).padStart(4, "0")}`, `source-driven random attempt ${index + 1} identity/order is invalid`);
    invariant(new Set([0, 1]).has(attempt.observedOutcome) && attempt.selectedInstanceName === `Mc_Sound_${attempt.observedOutcome}` && attempt.selectedObjectId === (attempt.observedOutcome === 0 ? 7 : 8), `source-driven random attempt ${index + 1} outcome mapping is invalid`);
    invariant(attempt.disposition === "accepted-natural-match" && attempt.observedOutcome === bound.outcome && attempt.attemptId === observation.acceptedAttemptId, "source-driven only random attempt is not the exact accepted natural match");
  }
}

function validateAdapterEntry(attestation, bound, kitDocument) {
  const entry = attestation.adapterEntry;
  assertExactKeys(entry, [
    "fixtureManifestSha256", "adapterHostSha256", "childSwfSha256", "childLoadTrigger", "childLoadTriggerCount",
    "traceStartedAfterOnLoadInit", "beginHandoff", "beginHandoffCount", "rootFrame", "frameDomainId", "localFrame",
    "operatorActionsAfterTraceStart", "directSeekUsed", "frameStepUsed", "completeOriginalCourseShellClaimed",
  ], "source-driven adapterEntry");
  const adapter = kitDocument.roles.get("minimal-safe-adapter-host");
  invariant(entry.fixtureManifestSha256 === kitDocument.kit.bindings.fixtureManifest.sha256 && entry.adapterHostSha256 === adapter.sha256 && entry.childSwfSha256 === bound.spec.sourceBindings.sourceSwf.sha256, "source-driven adapter entry source/fixture hashes differ from the kit");
  invariant(entry.childLoadTrigger === "single-named-human-pre-trace-click" && entry.childLoadTriggerCount === 1 && entry.traceStartedAfterOnLoadInit === true, "source-driven child load/trace-start boundary is invalid");
  invariant(entry.beginHandoff === "target.gotoAndPlay(\"begin\")" && entry.beginHandoffCount === 1, "source-driven adapter did not perform exactly one source-bound begin handoff");
  invariant(entry.rootFrame === 6 && entry.frameDomainId === bound.spec.identity.frameDomainId && entry.localFrame === 1, "source-driven adapter nested entry identity changed");
  invariant(entry.operatorActionsAfterTraceStart === 0 && entry.directSeekUsed === false && entry.frameStepUsed === false && entry.completeOriginalCourseShellClaimed === false, "source-driven trace used forbidden actions/positioning or claimed original-shell authority");
}

async function loadSessionAttestation({
  root, bound, kitDocument, attestationPath, environmentDocument, launchDocument, toolchainDocument,
  adapterEntryLogPath, randomTrialLogPath, operationLogPath, eventLogPath, frameLogPath, captureManifestPath, framesDirectory,
}) {
  const document = await readJson(attestationPath, "source-driven session attestation");
  const attestation = document.value;
  assertExactKeys(attestation, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.sessionAttestation, "source-driven session attestation");
  invariant(attestation.schemaVersion === 1 && attestation.evidenceType === "named-human-source-driven-branch-capture-session-attestation" && attestation.proofMode === SOURCE_DRIVEN_BRANCH_PROOF_MODE, "source-driven session attestation schema/type/proofMode is invalid");
  invariant(UUID_PATTERN.test(attestation.sessionId || "") && attestation.animationId === bound.spec.animationId && attestation.requirementId === bound.spec.requirementId, "source-driven session identity is invalid");
  validateNamedHuman(attestation.operator);
  invariant(attestation.attestationSha256 === sourceDrivenSessionAttestationSha256(attestation), "source-driven session attestation SHA-256 mismatch");
  invariant(attestation.statement === SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT && attestation.notes === SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE, "source-driven session authority statement changed");
  invariant(same(attestation.authority, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority), "source-driven session candidate authority changed");
  validateMasterEvidenceChainShape(attestation.masterEvidenceChain, "source-driven session masterEvidenceChain");
  invariant(attestation.monotonicTimeOrigin === "milliseconds-since-session-start" && Array.isArray(attestation.unexpectedEvents) && attestation.unexpectedEvents.length === 0, "source-driven session monotonic origin or unexpectedEvents is invalid");
  const startedAtMs = parseSessionTime(attestation.startedAt, "source-driven session startedAt");
  const endedAtMs = parseSessionTime(attestation.endedAt, "source-driven session endedAt");
  const signedAtMs = parseSessionTime(attestation.signedAt, "source-driven session signedAt");
  invariant(endedAtMs > startedAtMs && signedAtMs >= endedAtMs && signedAtMs - endedAtMs <= 30 * 60 * 1000, "source-driven session timing/signature is invalid");
  const relative = (candidate) => portable(path.relative(root, candidate));
  invariant(same(attestation.traceSpec, {file: bound.specRelative, sha256: bound.specDocument.sha256}), "source-driven attestation trace-spec binding changed");
  invariant(same(attestation.traceSpecIndex, {file: TRACE_INDEX_PATH, sha256: bound.indexDocument.sha256}), "source-driven attestation trace-index binding changed");
  invariant(same(attestation.sourceSwf, bound.spec.sourceBindings.sourceSwf), "source-driven attestation source binding changed");
  invariant(same(attestation.captureKitManifest, {file: relative(path.join(kitDocument.kitRoot, "kit-manifest.json")), sha256: kitDocument.document.sha256}), "source-driven attestation kit binding changed");
  invariant(same(attestation.sandboxProfile, {file: relative(kitDocument.sandboxPath), sha256: kitDocument.kit.sandbox.sha256}), "source-driven attestation sandbox binding changed");
  invariant(same(attestation.environmentIsolation, {file: relative(environmentDocument.path), sha256: environmentDocument.sha256}), "source-driven attestation environment binding changed");
  invariant(same(attestation.launchReceipt, {file: relative(launchDocument.path), sha256: launchDocument.sha256}), "source-driven attestation launch-receipt binding changed");
  invariant(attestation.toolchainReceipt.file === relative(toolchainDocument.path) && attestation.toolchainReceipt.sha256 === toolchainDocument.sha256 && same(attestation.toolchainReceipt.runtime, toolchainDocument.receipt.runtime) && same(attestation.toolchainReceipt.captureSessionBinding, toolchainDocument.receipt.captureSessionBinding), "source-driven attestation toolchain binding changed");
  invariant(attestation.sessionId === environmentDocument.receipt.sessionId && attestation.sessionId === launchDocument.receipt.sessionId && same(attestation.operator, environmentDocument.receipt.operator) && same(attestation.operator, launchDocument.receipt.operator), "source-driven attestation differs from environment/launch operator or session");
  invariant(environmentDocument.startedAtMs <= startedAtMs && environmentDocument.endedAtMs >= endedAtMs, "source-driven environment receipt does not enclose the session");
  invariant(toolchainDocument.receipt.captureSessionBinding.sessionId === attestation.sessionId, "source-driven toolchain session UUID differs");
  const toolCapturedAt = parseSessionTime(toolchainDocument.receipt.capturedAt, "source-driven toolchain capturedAt");
  invariant(toolCapturedAt >= startedAtMs && toolCapturedAt <= endedAtMs, "source-driven toolchain receipt was not captured inside the session");
  invariant(launchDocument.startedAtMs <= launchDocument.openedAtMs && launchDocument.openedAtMs <= startedAtMs, "source-driven Projector/adapter launch must precede accepted trace recording");
  validateAdapterEntry(attestation, bound, kitDocument);
  validateRandomObservation(attestation, bound);
  const descriptors = [
    ["adapterEntryLog", adapterEntryLogPath, "recordCount", "finalRecordSha256", 2],
    ["randomTrialLog", randomTrialLogPath, "recordCount", "finalRecordSha256", attestation.naturalRandomObservation.attempts.length],
    ["operationLog", operationLogPath, "recordCount", "finalRecordSha256", 145],
    ["sourceEventLog", eventLogPath, "recordCount", "finalRecordSha256", 3],
    ["frameStateLog", frameLogPath, "recordCount", "finalRecordSha256", 142],
  ];
  for (const [field, candidate, countField, finalField, expectedCount] of descriptors) {
    assertExactKeys(attestation[field], ["file", "sha256", countField, finalField], `source-driven attestation ${field}`);
    invariant(attestation[field].file === relative(candidate) && attestation[field][countField] === expectedCount, `source-driven attestation ${field} path/count changed`);
    assertSha256(attestation[field].sha256, `source-driven attestation ${field}.sha256`);
    assertSha256(attestation[field][finalField], `source-driven attestation ${field}.${finalField}`);
  }
  invariant(same(attestation.captureManifest, {file: relative(captureManifestPath), sha256: digest(await readFile(captureManifestPath))}), "source-driven attestation capture-manifest binding changed");
  invariant(same(attestation.scheduleBinding, scheduleBinding(bound.spec)), "source-driven attestation schedule binding changed");
  assertExactKeys(attestation.frameSet, ["algorithm", "frameCount", "frames", "sha256"], "source-driven attestation frameSet");
  invariant(attestation.frameSet.algorithm === "ordered-frame-path-sha256-v1" && attestation.frameSet.frameCount === 142 && Array.isArray(attestation.frameSet.frames) && attestation.frameSet.frames.length === 142, "source-driven attestation frameSet count/algorithm changed");
  for (const [index, frame] of attestation.frameSet.frames.entries()) {
    assertExactKeys(frame, ["frame", "file", "sha256"], `source-driven attestation frame ${index + 1}`);
    invariant(frame.frame === index + 1, "source-driven attestation frameSet is missing, duplicated, or reordered");
    assertSha256(frame.sha256, `source-driven attestation frame ${index + 1}.sha256`);
    const framePath = await readBoundFile({root, workspace: bound.workspace, declared: frame.file, label: `source-driven attestation frame ${index + 1}`, bases: [root], outsideKit: true});
    invariant(isLexicallyInside(await realpath(framePath), await realpath(framesDirectory)), `source-driven attestation frame ${index + 1} escapes the frames directory`);
  }
  invariant(attestation.frameSet.sha256 === orderedFrameSetSha256(attestation.frameSet.frames), "source-driven attestation ordered frame-set hash changed");
  return {...document, attestation, startedAtMs, endedAtMs, signedAtMs, durationMs: endedAtMs - startedAtMs};
}

async function verifyAdapterEntryLog({bound, attestationDocument, logPath}) {
  const log = await readJsonLines(logPath, "source-driven adapter-entry log");
  invariant(log.records.length === 2, "source-driven adapter-entry log must contain exactly two records");
  const expected = [
    {
      phase: "pre-trace",
      action: "named-human-child-load-trigger",
      sourceTarget: "minimal-safe-adapter-host",
      operatorDispatch: true,
      observation: {
        childLoadTrigger: "single-named-human-pre-trace-click",
        childLoadTriggerCount: 1,
        onLoadInitObserved: true,
        rootFrame: 6,
        frameDomainId: bound.spec.identity.frameDomainId,
        localFrame: 1,
      },
    },
    {
      phase: "pre-trace",
      action: "adapter-begin-handoff",
      sourceTarget: "exact-preserved-child",
      operatorDispatch: false,
      observation: {
        beginHandoff: "target.gotoAndPlay(\"begin\")",
        beginHandoffCount: 1,
        traceStartedAfterOnLoadInit: true,
        rootFrame: 6,
        frameDomainId: bound.spec.identity.frameDomainId,
        localFrame: 1,
      },
    },
  ];
  let previousHash = null;
  let previousMonotonic = -Infinity;
  let previousWall = -Infinity;
  const items = [];
  for (const [index, item] of log.records.entries()) {
    const record = item.record;
    assertExactKeys(record, [...commonRecordKeys(), ...SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.adapterEntryRecord], `source-driven adapter-entry ${index + 1}`);
    validateRecordIdentity(record, {bound, attestation: attestationDocument.attestation, label: `source-driven adapter-entry ${index + 1}`});
    invariant(record.evidenceType === "attested-source-driven-adapter-entry" && record.sequence === index + 1, `source-driven adapter-entry ${index + 1} type/sequence is invalid`);
    for (const field of ["phase", "action", "sourceTarget", "operatorDispatch"]) invariant(record[field] === expected[index][field], `source-driven adapter-entry ${index + 1}.${field} changed`);
    invariant(same(record.observation, expected[index].observation), `source-driven adapter-entry ${index + 1} observation changed`);
    invariant(record.previousRecordSha256 === previousHash && record.recordSha256 === sourceDrivenAdapterEntryRecordSha256(record), `source-driven adapter-entry ${index + 1} hash chain is invalid`);
    const wall = validateBoundTime(record, {label: `source-driven adapter-entry ${index + 1}`, attestation: attestationDocument, previousMonotonic, previousWall});
    items.push({...item, wall});
    previousHash = record.recordSha256;
    previousMonotonic = record.monotonicTimeMs;
    previousWall = wall;
  }
  invariant(attestationDocument.attestation.adapterEntryLog.sha256 === log.sha256 && attestationDocument.attestation.adapterEntryLog.finalRecordSha256 === previousHash, "source-driven adapter-entry log bytes/final chain differ from the attestation");
  return {log, items, finalRecordSha256: previousHash};
}

async function verifyRandomTrialLog({bound, attestationDocument, adapterEvidence, logPath}) {
  const log = await readJsonLines(logPath, "source-driven random-trial log");
  const attempts = attestationDocument.attestation.naturalRandomObservation.attempts;
  invariant(attempts.length === 1 && log.records.length === 1, "source-driven accepted-session random-trial log must contain exactly one record");
  let previousHash = adapterEvidence.finalRecordSha256;
  let previousMonotonic = adapterEvidence.items.at(-1).record.monotonicTimeMs;
  let previousWall = adapterEvidence.items.at(-1).wall;
  const items = [];
  for (const [index, item] of log.records.entries()) {
    const record = item.record;
    const attempt = attempts[index];
    assertExactKeys(record, [...commonRecordKeys(), ...SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.randomTrialRecord], `source-driven random trial ${index + 1}`);
    validateRecordIdentity(record, {bound, attestation: attestationDocument.attestation, label: `source-driven random trial ${index + 1}`});
    invariant(record.evidenceType === "attested-source-driven-natural-random-trial" && record.sequence === index + 1, `source-driven random trial ${index + 1} type/sequence is invalid`);
    for (const field of ["attemptId", "observedOutcome", "selectedInstanceName", "selectedObjectId", "disposition"]) invariant(record[field] === attempt[field], `source-driven random trial ${index + 1}.${field} differs from the attestation`);
    invariant(record.restartObserved === true && record.randomCall === "random(2)" && record.naturallyObservedBranch === `sound-${record.observedOutcome}`, `source-driven random trial ${index + 1} lacks an untouched natural restart/random observation`);
    invariant(record.identitySeedInjectedIntoAvm1 === false && record.seedInjected === false && record.forcedBranch === false && record.randomOverridden === false && record.branchVariableWrittenByAdapter === false && record.operatorDispatch === false, `source-driven random trial ${index + 1} was manipulated or operator-dispatched`);
    invariant(record.disposition === "accepted-natural-match" && record.acceptedTraceStarted === true && record.observedOutcome === bound.outcome && record.naturallyObservedBranch === bound.spec.identity.scenario, `source-driven random trial ${index + 1} is not the only exact accepted natural match`);
    invariant(record.previousRecordSha256 === previousHash && record.recordSha256 === sourceDrivenRandomTrialRecordSha256(record), `source-driven random trial ${index + 1} hash chain is invalid`);
    const wall = validateBoundTime(record, {label: `source-driven random trial ${index + 1}`, attestation: attestationDocument, previousMonotonic, previousWall});
    items.push({...item, wall});
    previousHash = record.recordSha256;
    previousMonotonic = record.monotonicTimeMs;
    previousWall = wall;
  }
  invariant(items[0].record.attemptId === attestationDocument.attestation.naturalRandomObservation.acceptedAttemptId, "source-driven random-trial log does not contain the unique accepted attempt");
  invariant(attestationDocument.attestation.randomTrialLog.sha256 === log.sha256 && attestationDocument.attestation.randomTrialLog.finalRecordSha256 === previousHash, "source-driven random-trial log bytes/final chain differ from the attestation");
  return {log, items, finalRecordSha256: previousHash};
}

async function verifySourceEventLog({root, bound, attestationDocument, eventLogPath}) {
  const log = await readJsonLines(eventLogPath, "source-driven event log");
  invariant(log.records.length === 3, "source-driven event log must contain exactly three records");
  let previousHash = null;
  let previousMonotonic = -Infinity;
  let previousWall = -Infinity;
  const items = [];
  for (const [index, item] of log.records.entries()) {
    const record = item.record;
    const scheduled = bound.events[index];
    const expectedKeys = [...commonRecordKeys(), ...SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.sourceEventRecord];
    assertExactKeys(record, expectedKeys, `source-driven event ${index + 1}`);
    validateRecordIdentity(record, {bound, attestation: attestationDocument.attestation, label: `source-driven event ${index + 1}`});
    invariant(record.evidenceType === "attested-source-driven-event-observation" && record.sequence === index + 1 && record.scheduledEventOrder === index + 1, `source-driven event ${index + 1} sequence/type is invalid`);
    invariant(record.scheduledEventSha256 === stateSha256(scheduled) && same(record.observedTrigger, scheduled.trigger) && same(record.resolvedSourceTarget, scheduled.sourceTarget), `source-driven event ${index + 1} differs from the scheduled trigger/target`);
    invariant(record.preStateSha256 === stateSha256(record.preState) && record.postStateSha256 === stateSha256(record.postState), `source-driven event ${index + 1} pre/post state hash is invalid`);
    invariant(same(record.preState, scheduled.preState) && same(record.postState, scheduled.postState), `source-driven event ${index + 1} pre/post state differs from the source schedule`);
    invariant(record.preStateObservationMethod === "runtime-telemetry-before-source-script" && record.postStateObservationMethod === "runtime-telemetry-after-source-script" && record.operatorDispatch === false, `source-driven event ${index + 1} was not passive pre/post telemetry`);
    assertSha256(record.causalPredecessorRecordSha256, `source-driven event ${index + 1}.causalPredecessorRecordSha256`);
    const expectedPreFrames = [1, 5, 141];
    const expectedPostFrames = [1, 5, 142];
    invariant(record.preScreenshotFrame === expectedPreFrames[index] && record.postScreenshotFrame === expectedPostFrames[index], `source-driven event ${index + 1} frame evidence changed`);
    invariant(record.previousRecordSha256 === previousHash && record.recordSha256 === sourceDrivenEventRecordSha256(record), `source-driven event ${index + 1} hash chain is invalid`);
    const wall = validateBoundTime(record, {label: `source-driven event ${index + 1}`, attestation: attestationDocument, previousMonotonic, previousWall});
    items.push({...item, record, scheduled, wall});
    previousHash = record.recordSha256;
    previousMonotonic = record.monotonicTimeMs;
    previousWall = wall;
  }
  invariant(attestationDocument.attestation.sourceEventLog.sha256 === log.sha256 && attestationDocument.attestation.sourceEventLog.finalRecordSha256 === previousHash, "source-driven event log bytes/final chain differ from the attestation");
  return {log, items, finalRecordSha256: previousHash};
}

async function verifyFrameStateLog({root, bound, attestationDocument, frameLogPath, framesDirectory}) {
  const log = await readJsonLines(frameLogPath, "source-driven frame-state log");
  invariant(log.records.length === 142, "source-driven frame-state log must contain exactly 142 records");
  const directoryEntries = await readdir(framesDirectory, {withFileTypes: true});
  invariant(directoryEntries.length === 142 && directoryEntries.every((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png")), "source-driven frames directory must contain exactly 142 regular PNG files and no extras");
  const expectedNames = Array.from({length: 142}, (_, index) => `frame-${String(index + 1).padStart(4, "0")}.png`);
  invariant(same(directoryEntries.map(({name}) => name).sort(), expectedNames), "source-driven frame filenames must be exactly frame-0001.png through frame-0142.png");
  const checkpointByFrame = new Map(bound.spec.schedule.stateCheckpoints.map((checkpoint) => [checkpoint.expectedState.localFrame, checkpoint]));
  let previousHash = null;
  let previousMonotonic = -Infinity;
  let previousWall = -Infinity;
  const realPaths = new Set();
  const inodeKeys = new Set();
  const items = [];
  let totalPngBytes = 0;
  for (let index = 0; index < 142; index += 1) {
    const frame = index + 1;
    const item = log.records[index];
    const record = item.record;
    const expectedKeys = [...commonRecordKeys(), ...SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.frameStateRecord];
    assertExactKeys(record, expectedKeys, `source-driven frame-state ${frame}`);
    validateRecordIdentity(record, {bound, attestation: attestationDocument.attestation, label: `source-driven frame-state ${frame}`});
    invariant(record.evidenceType === "attested-source-driven-natural-frame-state" && record.sequence === frame, `source-driven frame-state ${frame} sequence/type is invalid`);
    invariant(record.frameDomainId === bound.spec.identity.frameDomainId && record.observedRootFrame === 6 && record.observedLocalFrame === frame, `source-driven frame-state ${frame} playhead identity is invalid`);
    invariant(record.naturallyObservedOutcome === bound.outcome && record.naturallyObservedBranch === bound.spec.identity.scenario, `source-driven frame-state ${frame} branch identity changed`);
    invariant(record.observedStateSha256 === stateSha256(record.observedState), `source-driven frame-state ${frame} state hash is invalid`);
    invariant(record.observedState.rootFrame === 6 && record.observedState.localFrame === frame, `source-driven frame-state ${frame} observedState playheads changed`);
    if (record.precedingSourceEventRecordSha256 !== null) assertSha256(record.precedingSourceEventRecordSha256, `source-driven frame-state ${frame}.precedingSourceEventRecordSha256`);
    if (checkpointByFrame.has(frame)) assertObservedState(checkpointByFrame.get(frame).expectedState, record.observedState, `source-driven checkpoint frame ${frame}`);
    if (frame === 142) assertObservedState(bound.spec.schedule.terminalSemantics.expectedState, record.observedState, "source-driven terminal frame");
    invariant(record.previousRecordSha256 === previousHash && record.recordSha256 === sourceDrivenFrameStateRecordSha256(record), `source-driven frame-state ${frame} hash chain is invalid`);
    const wall = validateBoundTime(record, {label: `source-driven frame-state ${frame}`, attestation: attestationDocument, previousMonotonic, previousWall});
    const expectedFile = portable(path.join(portable(path.relative(root, framesDirectory)), expectedNames[index]));
    invariant(record.screenshotFile === expectedFile, `source-driven frame-state ${frame} screenshot path is not canonical`);
    const screenshotPath = await readBoundFile({root, workspace: bound.workspace, declared: record.screenshotFile, label: `source-driven frame ${frame} PNG`, bases: [root], outsideKit: true});
    const actual = await realpath(screenshotPath);
    invariant(isLexicallyInside(actual, await realpath(framesDirectory)) && !realPaths.has(actual), `source-driven frame ${frame} PNG escapes or reuses a path`);
    realPaths.add(actual);
    const metadata = await stat(screenshotPath);
    const inodeKey = `${metadata.dev}:${metadata.ino}`;
    invariant(!inodeKeys.has(inodeKey), `source-driven frame ${frame} reuses a hard-linked PNG inode`);
    inodeKeys.add(inodeKey);
    invariant(metadata.size > 0 && metadata.size <= MAX_SOURCE_DRIVEN_FRAME_PNG_BYTES, `source-driven frame ${frame} PNG exceeds the single-file byte limit`);
    totalPngBytes += metadata.size;
    invariant(totalPngBytes <= MAX_SOURCE_DRIVEN_FRAME_PNG_TOTAL_BYTES, "source-driven frame PNG set exceeds the total byte limit");
    const pngBytes = await readFile(screenshotPath);
    invariant(digest(pngBytes) === record.screenshotSha256, `source-driven frame ${frame} PNG SHA-256 mismatch`);
    let png;
    try {
      png = PNG.sync.read(pngBytes);
    } catch (error) {
      throw new Error(`source-driven frame ${frame} is not a decodable PNG: ${error.message}`);
    }
    invariant(png.width === 800 && png.height === 600, `source-driven frame ${frame} is ${png.width}x${png.height}; expected 800x600`);
    const attested = attestationDocument.attestation.frameSet.frames[index];
    invariant(attested.frame === frame && attested.file === record.screenshotFile && attested.sha256 === record.screenshotSha256, `source-driven frame ${frame} differs from the attested frame set`);
    items.push({...item, record, wall, screenshotPath});
    previousHash = record.recordSha256;
    previousMonotonic = record.monotonicTimeMs;
    previousWall = wall;
  }
  invariant(attestationDocument.attestation.frameStateLog.sha256 === log.sha256 && attestationDocument.attestation.frameStateLog.finalRecordSha256 === previousHash, "source-driven frame-state log bytes/final chain differ from the attestation");
  return {log, items, finalRecordSha256: previousHash};
}

function verifyCrossStreamCausality({bound, randomEvidence, eventEvidence, frameEvidence}) {
  const random = randomEvidence.items[0].record;
  const events = eventEvidence.items.map(({record}) => record);
  const frames = frameEvidence.items.map(({record}) => record);
  const causalPredecessors = [random, frames[3], frames[140]];
  const precedingEvents = new Map([[1, events[0]], [5, events[1]], [142, events[2]]]);
  for (const [index, event] of events.entries()) {
    const predecessor = causalPredecessors[index];
    invariant(event.causalPredecessorRecordSha256 === predecessor.recordSha256, `source-driven event ${index + 1} cross-stream causal predecessor changed`);
    invariant(event.monotonicTimeMs > predecessor.monotonicTimeMs && Date.parse(event.occurredAt) > Date.parse(predecessor.occurredAt), `source-driven event ${index + 1} does not strictly follow its causal predecessor`);
  }
  for (const [index, frame] of frames.entries()) {
    const localFrame = index + 1;
    const event = precedingEvents.get(localFrame);
    invariant(frame.precedingSourceEventRecordSha256 === (event?.recordSha256 ?? null), `source-driven frame-state ${localFrame} preceding source-event binding changed`);
    if (event) invariant(frame.monotonicTimeMs > event.monotonicTimeMs && Date.parse(frame.occurredAt) > Date.parse(event.occurredAt), `source-driven frame-state ${localFrame} does not strictly follow its source event`);
  }
  const firstEventSelection = events[0].postState?.branchSelection;
  invariant(random.observedOutcome === bound.outcome && random.naturallyObservedBranch === bound.spec.identity.scenario && firstEventSelection?.observedOutcome === random.observedOutcome && firstEventSelection?.selectedInstanceName === random.selectedInstanceName && firstEventSelection?.selectedObjectId === random.selectedObjectId, "source-driven accepted random outcome/branch differs from frame-1 source event");
  invariant(frames[0].naturallyObservedOutcome === random.observedOutcome && frames[0].naturallyObservedBranch === random.naturallyObservedBranch, "source-driven accepted random outcome/branch differs from frame 1");
}

function buildMasterEvidenceChain({adapterEvidence, randomEvidence, eventEvidence, frameEvidence, operationEvidence}) {
  const values = [
    adapterEvidence.finalRecordSha256,
    randomEvidence.finalRecordSha256,
    eventEvidence.items[0].record.recordSha256,
    frameEvidence.items[0].record.recordSha256,
    frameEvidence.items[3].record.recordSha256,
    eventEvidence.items[1].record.recordSha256,
    frameEvidence.items[4].record.recordSha256,
    frameEvidence.items[140].record.recordSha256,
    eventEvidence.items[2].record.recordSha256,
    frameEvidence.items[141].record.recordSha256,
  ];
  const chain = {
    algorithm: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.masterBindingAlgorithm,
    root: {source: "adapterEntryLog.sequence-1.recordSha256", sha256: adapterEvidence.items[0].record.recordSha256},
    intermediates: MASTER_EVIDENCE_INTERMEDIATE_SOURCES.map((source, index) => ({sequence: index + 1, source, sha256: values[index]})),
    final: {source: "operationLog.sequence-145.recordSha256", sha256: operationEvidence.finalRecordSha256},
  };
  chain.bindingSha256 = sourceDrivenMasterEvidenceChainBindingSha256(chain);
  return chain;
}

function expectedOperationSequence(eventEvidence, frameEvidence) {
  const eventsByFrame = new Map(eventEvidence.items.map((item) => [item.scheduled.trigger.frame, item]));
  const expected = [];
  for (let frame = 1; frame <= 142; frame += 1) {
    const sourceEvent = eventsByFrame.get(frame);
    if (sourceEvent) expected.push({
      operationKind: "source-event-observed",
      observedFrame: frame,
      sourceEventOrder: sourceEvent.record.scheduledEventOrder,
      referencedRecordSha256: sourceEvent.record.recordSha256,
      reference: sourceEvent.record,
    });
    const frameState = frameEvidence.items[frame - 1];
    expected.push({
      operationKind: "frame-state-observed",
      observedFrame: frame,
      sourceEventOrder: null,
      referencedRecordSha256: frameState.record.recordSha256,
      reference: frameState.record,
    });
  }
  return expected;
}

async function verifyOperationLog({bound, attestationDocument, randomEvidence, eventEvidence, frameEvidence, logPath}) {
  const log = await readJsonLines(logPath, "source-driven unified operation log");
  const expected = expectedOperationSequence(eventEvidence, frameEvidence);
  invariant(expected.length === 145 && log.records.length === 145, "source-driven unified operation log must contain exactly 145 ordered observations");
  let previousHash = randomEvidence.finalRecordSha256;
  let previousMonotonic = randomEvidence.items[0].record.monotonicTimeMs;
  let previousWall = randomEvidence.items[0].wall;
  const items = [];
  for (const [index, item] of log.records.entries()) {
    const record = item.record;
    const wanted = expected[index];
    assertExactKeys(record, [...commonRecordKeys(), ...SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.operationRecord], `source-driven operation ${index + 1}`);
    validateRecordIdentity(record, {bound, attestation: attestationDocument.attestation, label: `source-driven operation ${index + 1}`});
    invariant(record.evidenceType === "attested-source-driven-passive-operation" && record.sequence === index + 1, `source-driven operation ${index + 1} type/sequence is invalid`);
    invariant(record.operationKind === wanted.operationKind && record.observedFrame === wanted.observedFrame && record.sourceEventOrder === wanted.sourceEventOrder && record.referencedRecordSha256 === wanted.referencedRecordSha256, `source-driven operation ${index + 1} order/reference changed`);
    invariant(record.operatorDispatch === false, `source-driven operation ${index + 1} was operator-dispatched`);
    invariant(record.occurredAt === wanted.reference.occurredAt && record.monotonicTimeMs === wanted.reference.monotonicTimeMs, `source-driven operation ${index + 1} timestamp differs from its referenced raw observation`);
    invariant(record.previousRecordSha256 === previousHash && record.recordSha256 === sourceDrivenOperationRecordSha256(record), `source-driven operation ${index + 1} hash chain is invalid`);
    const wall = validateBoundTime(record, {label: `source-driven operation ${index + 1}`, attestation: attestationDocument, previousMonotonic, previousWall});
    items.push({...item, wall});
    previousHash = record.recordSha256;
    previousMonotonic = record.monotonicTimeMs;
    previousWall = wall;
  }
  invariant(attestationDocument.attestation.operationLog.sha256 === log.sha256 && attestationDocument.attestation.operationLog.finalRecordSha256 === previousHash, "source-driven operation log bytes/final chain differ from the attestation");
  return {log, items, finalRecordSha256: previousHash};
}

async function verifyCaptureManifest({
  root, bound, kitDocument, launchDocument, attestationDocument, captureManifestPath,
  adapterEvidence, randomEvidence, operationEvidence, eventEvidence, frameEvidence, masterEvidenceChain,
}) {
  const document = await readJson(captureManifestPath, "source-driven capture manifest");
  const manifest = document.value;
  assertExactKeys(manifest, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts.captureManifest, "source-driven capture manifest");
  invariant(manifest.schemaVersion === 1 && manifest.evidenceType === "attested-source-driven-branch-capture-manifest" && manifest.status === "candidate-input-not-canonical" && manifest.strictAcceptanceEffect === false, "source-driven capture manifest schema/type/status is invalid");
  invariant(same(manifest.authority, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority), "source-driven capture manifest candidate authority changed");
  validateMasterEvidenceChainShape(manifest.masterEvidenceChain, "source-driven capture manifest masterEvidenceChain");
  invariant(same(manifest.masterEvidenceChain, masterEvidenceChain) && same(attestationDocument.attestation.masterEvidenceChain, masterEvidenceChain), "source-driven attestation/capture manifest master evidence chain differs from verified records");
  invariant(manifest.animationId === bound.spec.animationId && manifest.requirementId === bound.spec.requirementId && same(manifest.identity, {
    frameDomainId: bound.spec.identity.frameDomainId,
    traceId: bound.spec.identity.traceId,
    entryStateSha256: bound.spec.identity.entryStateSha256,
    scenario: bound.spec.identity.scenario,
    language: bound.spec.identity.language,
    seed: bound.spec.identity.seed,
  }), "source-driven capture manifest identity changed");
  invariant(same(manifest.traceSpec, {file: bound.specRelative, sha256: bound.specDocument.sha256}) && same(manifest.traceSpecIndex, {file: TRACE_INDEX_PATH, sha256: bound.indexDocument.sha256}) && same(manifest.sourceSwf, bound.spec.sourceBindings.sourceSwf), "source-driven capture manifest source/spec/index binding changed");
  invariant(same(manifest.captureKitManifest, {file: portable(path.relative(root, path.join(kitDocument.kitRoot, "kit-manifest.json"))), sha256: kitDocument.document.sha256}), "source-driven capture manifest kit binding changed");
  invariant(same(manifest.launchReceipt, {file: portable(path.relative(root, launchDocument.path)), sha256: launchDocument.sha256}), "source-driven capture manifest launch-receipt binding changed");
  invariant(manifest.sessionId === attestationDocument.attestation.sessionId && manifest.acceptedAttemptId === attestationDocument.attestation.naturalRandomObservation.acceptedAttemptId, "source-driven capture manifest session/attempt changed");
  invariant(same(manifest.stage, {width: 800, height: 600}) && manifest.fps === 12 && manifest.frameNumbering === "one-indexed" && manifest.frameCount === 142, "source-driven capture manifest native frame facts changed");
  invariant(same(manifest.adapterEntryLog, {file: attestationDocument.attestation.adapterEntryLog.file, sha256: adapterEvidence.log.sha256, recordCount: 2, finalRecordSha256: adapterEvidence.finalRecordSha256}), "source-driven capture manifest adapter-entry log binding changed");
  invariant(same(manifest.randomTrialLog, {file: attestationDocument.attestation.randomTrialLog.file, sha256: randomEvidence.log.sha256, recordCount: randomEvidence.items.length, finalRecordSha256: randomEvidence.finalRecordSha256}), "source-driven capture manifest random-trial log binding changed");
  invariant(same(manifest.operationLog, {file: attestationDocument.attestation.operationLog.file, sha256: operationEvidence.log.sha256, recordCount: 145, finalRecordSha256: operationEvidence.finalRecordSha256, operatorDispatchCount: 0}), "source-driven capture manifest operation log binding changed");
  invariant(same(manifest.sourceEventLog, {file: attestationDocument.attestation.sourceEventLog.file, sha256: eventEvidence.log.sha256, recordCount: 3, finalRecordSha256: eventEvidence.finalRecordSha256}), "source-driven capture manifest event log binding changed");
  invariant(same(manifest.frameStateLog, {file: attestationDocument.attestation.frameStateLog.file, sha256: frameEvidence.log.sha256, recordCount: 142, finalRecordSha256: frameEvidence.finalRecordSha256}), "source-driven capture manifest state log binding changed");
  invariant(Array.isArray(manifest.frames) && manifest.frames.length === 142, "source-driven capture manifest must contain 142 frames");
  for (const [index, descriptor] of manifest.frames.entries()) {
    const item = frameEvidence.items[index].record;
    assertExactKeys(descriptor, ["frame", "file", "sha256", "width", "height", "stateRecordSha256"], `source-driven capture manifest frame ${index + 1}`);
    invariant(descriptor.frame === index + 1 && descriptor.file === item.screenshotFile && descriptor.sha256 === item.screenshotSha256 && descriptor.width === 800 && descriptor.height === 600 && descriptor.stateRecordSha256 === item.recordSha256, `source-driven capture manifest frame ${index + 1} differs from verified evidence`);
  }
  const frameSet = manifest.frames.map(({frame, file, sha256}) => ({frame, file, sha256}));
  invariant(manifest.orderedFrameSetSha256 === orderedFrameSetSha256(frameSet) && manifest.orderedFrameSetSha256 === attestationDocument.attestation.frameSet.sha256, "source-driven capture manifest ordered frame-set hash changed");
  return {...document, manifest};
}

function stateObservation({bound, state, frameItem, eventLogOffset}) {
  return {
    observedState: state,
    observedStateSha256: stateSha256(state),
    rootFrame: 6,
    frameDomainId: bound.spec.identity.frameDomainId,
    localFrame: state.localFrame,
    screenshotSha256: frameItem.record.screenshotSha256,
    eventLogOffset,
  };
}

function buildCandidateResults({bound, eventEvidence, frameEvidence}) {
  let previousResultSha256 = null;
  const sourceDrivenEventResults = eventEvidence.items.map((item, index) => {
    const preFrame = frameEvidence.items[item.record.preScreenshotFrame - 1];
    const postFrame = frameEvidence.items[item.record.postScreenshotFrame - 1];
    const result = {
      order: index + 1,
      scheduledEventSha256: item.record.scheduledEventSha256,
      eventSequence: item.record.sequence,
      rawEventLogLocator: {eventSequence: item.record.sequence, byteOffset: item.byteOffset},
      observedTrigger: item.record.observedTrigger,
      resolvedSourceTarget: item.record.resolvedSourceTarget,
      preState: stateObservation({bound, state: item.record.preState, frameItem: preFrame, eventLogOffset: item.byteOffset}),
      postState: stateObservation({bound, state: item.record.postState, frameItem: postFrame, eventLogOffset: item.byteOffset}),
      frameEvidence: [
        {frame: preFrame.record.observedLocalFrame, file: preFrame.record.screenshotFile, sha256: preFrame.record.screenshotSha256},
        ...(preFrame === postFrame ? [] : [{frame: postFrame.record.observedLocalFrame, file: postFrame.record.screenshotFile, sha256: postFrame.record.screenshotSha256}]),
      ],
      previousResultSha256,
      result: "pass",
    };
    result.resultSha256 = candidateResultSha256(result);
    previousResultSha256 = result.resultSha256;
    return result;
  });
  const stateCheckpointResults = bound.spec.schedule.stateCheckpoints.map((checkpoint) => {
    const frameItem = frameEvidence.items[checkpoint.expectedState.localFrame - 1];
    return {
      checkpointId: checkpoint.id,
      expectedStateSha256: stateSha256(checkpoint.expectedState),
      observation: stateObservation({bound, state: frameItem.record.observedState, frameItem, eventLogOffset: frameItem.byteOffset}),
      frameEvidence: [{frame: frameItem.record.observedLocalFrame, file: frameItem.record.screenshotFile, sha256: frameItem.record.screenshotSha256}],
      result: "pass",
    };
  });
  const terminalFrame = frameEvidence.items.at(-1);
  const terminalResult = {
    expectedSemanticsSha256: stateSha256(bound.spec.schedule.terminalSemantics),
    observation: stateObservation({bound, state: terminalFrame.record.observedState, frameItem: terminalFrame, eventLogOffset: terminalFrame.byteOffset}),
    frameEvidence: [{frame: 142, file: terminalFrame.record.screenshotFile, sha256: terminalFrame.record.screenshotSha256}],
    rawEventLogSha256: eventEvidence.log.sha256,
    result: "pass",
  };
  const firstFrame = frameEvidence.items[0];
  const zeroActionObservation = {
    status: "observed-no-dispatched-actions",
    rawEventLogSha256: eventEvidence.log.sha256,
    previousResultSha256,
    preState: stateObservation({bound, state: firstFrame.record.observedState, frameItem: firstFrame, eventLogOffset: firstFrame.byteOffset}),
    postState: stateObservation({bound, state: terminalFrame.record.observedState, frameItem: terminalFrame, eventLogOffset: terminalFrame.byteOffset}),
    frameEvidence: [
      {frame: 1, file: firstFrame.record.screenshotFile, sha256: firstFrame.record.screenshotSha256},
      {frame: 142, file: terminalFrame.record.screenshotFile, sha256: terminalFrame.record.screenshotSha256},
    ],
  };
  zeroActionObservation.resultSha256 = candidateResultSha256(zeroActionObservation);
  return {sourceDrivenEventResults, stateCheckpointResults, terminalResult, zeroActionObservation, sequenceChainSha256: zeroActionObservation.resultSha256};
}

async function captureDirectoryIdentity(root, directory, label) {
  await assertNoExistingSymlinkComponents(root, directory, label);
  const info = await lstat(directory);
  invariant(info.isDirectory() && !info.isSymbolicLink(), `${label} must be a real directory`);
  const [actualRoot, actualDirectory] = await Promise.all([realpath(root), realpath(directory)]);
  const confirmed = await lstat(directory);
  invariant(
    confirmed.isDirectory() && !confirmed.isSymbolicLink() && sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info)) && permissionMode(confirmed) === permissionMode(info),
    `${label} directory identity changed while it was being inspected`,
  );
  const expectedDirectory = path.resolve(actualRoot, path.relative(root, directory));
  invariant(actualDirectory === expectedDirectory, `${label} real path differs from its fixed lexical path`);
  return {
    node: nodeIdentity(confirmed),
    mode: permissionMode(confirmed),
    realPath: actualDirectory,
  };
}

async function assertDirectoryIdentity(root, directory, expected, label) {
  const observed = await captureDirectoryIdentity(root, directory, label);
  invariant(
    observed.realPath === expected.realPath && sameNodeIdentity(observed.node, expected.node),
    `${label} directory identity changed during candidate preparation`,
  );
  return observed;
}

async function captureRegularFile(root, candidate, label, {expectedSha256, expectedMode, requireSingleLink = false} = {}) {
  await assertNoExistingSymlinkComponents(root, candidate, label);
  const info = await lstat(candidate);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  const bytes = await readFile(candidate);
  const sha256 = digest(bytes);
  if (expectedSha256 !== undefined) invariant(sha256 === expectedSha256, `${label} SHA-256 changed`);
  if (expectedMode !== undefined) invariant(permissionMode(info) === expectedMode, `${label} mode must be ${expectedMode.toString(8).padStart(4, "0")}`);
  if (requireSingleLink) invariant(info.nlink === 1, `${label} must not be hard-linked`);
  const actual = await realpath(candidate);
  const confirmed = await lstat(candidate);
  invariant(
    confirmed.isFile() && !confirmed.isSymbolicLink() && sameNodeIdentity(nodeIdentity(confirmed), nodeIdentity(info)) &&
      confirmed.size === info.size && permissionMode(confirmed) === permissionMode(info) && confirmed.nlink === info.nlink,
    `${label} file identity changed while it was being inspected`,
  );
  return {
    node: nodeIdentity(confirmed),
    mode: permissionMode(confirmed),
    nlink: confirmed.nlink,
    bytes: confirmed.size,
    sha256,
    realPath: actual,
  };
}

async function snapshotProtectedInputs({root, inputs, framesDirectory}) {
  const uniquePaths = new Map();
  const occupiedNodes = new Map();
  for (const input of inputs) {
    const absolute = path.resolve(input.path);
    const existing = uniquePaths.get(absolute);
    if (existing) {
      invariant(existing.sha256 === input.sha256, `${input.label} duplicates a protected path with a different hash`);
      existing.labels.push(input.label);
      continue;
    }
    const observed = await captureRegularFile(root, absolute, input.label, {expectedSha256: input.sha256, requireSingleLink: true});
    const key = `${observed.node.dev}:${observed.node.ino}`;
    const prior = occupiedNodes.get(key);
    invariant(!prior || prior.realPath === observed.realPath, `${input.label} hard-links protected input ${prior?.label || "unknown"}`);
    const snapshot = {...observed, path: absolute, labels: [input.label]};
    uniquePaths.set(absolute, snapshot);
    occupiedNodes.set(key, {label: input.label, realPath: observed.realPath});
  }
  const frameDirectory = await captureDirectoryIdentity(root, framesDirectory, "source-driven frames directory");
  const entries = await readdir(framesDirectory, {withFileTypes: true});
  const expectedNames = Array.from({length: 142}, (_, index) => `frame-${String(index + 1).padStart(4, "0")}.png`);
  invariant(
    entries.length === expectedNames.length && entries.every((entry) => entry.isFile()) && same(entries.map(({name}) => name).sort(), expectedNames),
    "source-driven frames directory inventory changed before publication",
  );
  return {files: [...uniquePaths.values()], frameDirectory: {...frameDirectory, path: framesDirectory, entries: expectedNames}};
}

async function assertProtectedInputsUnchanged(root, snapshot, phase) {
  for (const input of snapshot.files) {
    const observed = await captureRegularFile(root, input.path, input.labels.join(" / "), {expectedSha256: input.sha256, requireSingleLink: true});
    invariant(
      observed.realPath === input.realPath && sameNodeIdentity(observed.node, input.node) && observed.mode === input.mode && observed.bytes === input.bytes,
      `${input.labels.join(" / ")} changed ${phase} candidate preparation`,
    );
  }
  const observedDirectory = await assertDirectoryIdentity(root, snapshot.frameDirectory.path, snapshot.frameDirectory, "source-driven frames directory");
  invariant(observedDirectory.mode === snapshot.frameDirectory.mode, `source-driven frames directory mode changed ${phase} candidate preparation`);
  const entries = await readdir(snapshot.frameDirectory.path, {withFileTypes: true});
  invariant(
    entries.length === snapshot.frameDirectory.entries.length && entries.every((entry) => entry.isFile()) && same(entries.map(({name}) => name).sort(), snapshot.frameDirectory.entries),
    `source-driven frames directory inventory changed ${phase} candidate preparation`,
  );
}

async function assertInputOutputDisjointness({root, protectedSnapshot, outputBoundaries}) {
  const actualRoot = await realpath(root);
  const inputs = [
    ...protectedSnapshot.files.map(({realPath, labels}) => ({path: realPath, label: labels.join(" / ")})),
    {path: protectedSnapshot.frameDirectory.realPath, label: "source-driven frames directory"},
  ];
  for (const output of outputBoundaries) {
    const intended = path.resolve(actualRoot, path.relative(root, output.path));
    for (const input of inputs) {
      invariant(!pathsOverlap(input.path, intended), `${input.label} overlaps ${output.label}`);
    }
  }
}

async function verifyOwnedRegularFile({root, candidate, ownership, label, expectedMode = 0o444, requireSingleLink = true}) {
  const observed = await captureRegularFile(root, candidate, label, {
    expectedSha256: ownership.sha256,
    expectedMode,
    requireSingleLink,
  });
  invariant(sameNodeIdentity(observed.node, ownership.node), `${label} inode changed after publication`);
  return observed;
}

async function unlinkOwnedRegularFile({root, candidate, ownership, label}) {
  await verifyOwnedRegularFile({root, candidate, ownership, label, expectedMode: ownership.mode, requireSingleLink: false});
  await unlink(candidate);
}

async function writeOwnedNewAtomic({root, parentDirectory, parentIdentity, candidate, bytes, label, transaction}) {
  await assertDirectoryIdentity(root, parentDirectory, parentIdentity, `${label} parent`);
  await assertNoExistingSymlinkComponents(root, candidate, label);
  invariant(!(await exists(candidate)), `${label} already exists; evidence is append-only`);
  const temporary = path.join(parentDirectory, `.${path.basename(candidate)}.tmp-${process.pid}-${Date.now()}-${transaction.sequence++}`);
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(temporary, flags, 0o444);
  let temporaryOwnership;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    const info = await handle.stat();
    temporaryOwnership = {node: nodeIdentity(info), sha256: digest(bytes), mode: 0o444};
  } finally {
    await handle.close();
  }
  transaction.temporaryFiles.set(temporary, temporaryOwnership);
  await verifyOwnedRegularFile({root, candidate: temporary, ownership: temporaryOwnership, label: `${label} temporary`, requireSingleLink: true});
  await assertDirectoryIdentity(root, parentDirectory, parentIdentity, `${label} parent`);
  await link(temporary, candidate);
  const ownership = {...temporaryOwnership};
  transaction.outputFiles.set(candidate, ownership);
  await verifyOwnedRegularFile({root, candidate, ownership, label, requireSingleLink: false});
  await assertDirectoryIdentity(root, parentDirectory, parentIdentity, `${label} parent`);
  await unlinkOwnedRegularFile({root, candidate: temporary, ownership: temporaryOwnership, label: `${label} temporary`});
  transaction.temporaryFiles.delete(temporary);
  await verifyOwnedRegularFile({root, candidate, ownership, label, requireSingleLink: true});
  return ownership;
}

async function verifyPublicationPathIdentity({
  root, workspace, pendingDirectory, pendingIdentity, archiveDirectory, archiveParentIdentity,
  candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
}) {
  for (const [candidate, label] of [
    [pendingDirectory, "source-driven pending directory"],
    [archiveDirectory, "source-driven pending archive"],
    [candidateManifestPath, "source-driven candidate manifest output"],
    [candidateReportPath, "source-driven candidate report output"],
  ]) await assertNoExistingSymlinkComponents(root, candidate, label);
  const [actualRoot, actualWorkspace] = await Promise.all([realpath(root), realpath(workspace)]);
  const actualPending = (await assertDirectoryIdentity(root, pendingDirectory, pendingIdentity, "source-driven pending directory")).realPath;
  const actualArchiveParent = (await assertDirectoryIdentity(root, path.dirname(archiveDirectory), archiveParentIdentity, "source-driven archive parent")).realPath;
  invariant(isLexicallyInside(actualPending, actualWorkspace), "source-driven pending directory escapes the migration workspace");
  for (const candidate of [candidateManifestPath, candidateReportPath]) {
    invariant(await realpath(path.dirname(candidate)) === actualPending, "source-driven candidate output parent identity changed");
  }
  const intendedArchive = path.join(actualArchiveParent, path.basename(archiveDirectory));
  for (const [canonicalDirectory, label] of [
    [path.dirname(canonicalBaseline), "canonical baseline"],
    [path.dirname(canonicalExecution), "canonical execution"],
    [path.join(path.dirname(archiveDirectory), "original-runtime"), "canonical original-runtime archive"],
  ]) {
    if (!(await exists(canonicalDirectory))) continue;
    await assertNoExistingSymlinkComponents(root, canonicalDirectory, label);
    const actualCanonical = await realpath(canonicalDirectory);
    invariant(!pathsOverlap(actualPending, actualCanonical), `source-driven pending directory overlaps ${label}`);
    invariant(!pathsOverlap(intendedArchive, actualCanonical), `source-driven pending archive overlaps ${label}`);
  }
}

async function copyIntoOwnedStage({
  root, archiveParent, archiveParentIdentity, stagedArchive, stagedIdentity,
  source, basename, expectedSha256, archiveRelative, transaction,
}) {
  await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "source-driven archive parent");
  await assertDirectoryIdentity(root, stagedArchive, stagedIdentity, "source-driven staged archive");
  const destination = path.join(stagedArchive, basename);
  await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
  const createdInfo = await lstat(destination);
  const ownership = {node: nodeIdentity(createdInfo), sha256: expectedSha256, mode: 0o444};
  transaction.staging.files.set(basename, ownership);
  await chmod(destination, 0o444);
  await verifyOwnedRegularFile({root, candidate: destination, ownership, label: `source-driven staged ${basename}`, requireSingleLink: true});
  const handle = await open(destination, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  await assertDirectoryIdentity(root, stagedArchive, stagedIdentity, "source-driven staged archive");
  await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "source-driven archive parent");
  return {file: `${archiveRelative}/${basename}`, sha256: expectedSha256};
}

async function verifyOwnedArchive({root, archiveDirectory, archiveOwnership, expectedNames}) {
  const observedDirectory = await assertDirectoryIdentity(root, archiveDirectory, archiveOwnership.identity, "source-driven candidate archive");
  invariant(observedDirectory.mode === 0o755, "source-driven candidate archive mode must be 0755");
  const entries = await readdir(archiveDirectory, {withFileTypes: true});
  invariant(
    entries.length === expectedNames.length && entries.every((entry) => entry.isFile()) && same(entries.map(({name}) => name).sort(), [...expectedNames].sort()),
    "source-driven candidate archive inventory changed after publication",
  );
  for (const basename of expectedNames) {
    const ownership = archiveOwnership.files.get(basename);
    invariant(ownership, `source-driven candidate archive ownership is missing ${basename}`);
    await verifyOwnedRegularFile({
      root,
      candidate: path.join(archiveDirectory, basename),
      ownership,
      label: `source-driven candidate archive ${basename}`,
      requireSingleLink: true,
    });
  }
}

async function publishOwnedArchive({root, archiveParent, archiveParentIdentity, stagedArchive, archiveDirectory, transaction}) {
  await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "source-driven archive parent");
  await assertDirectoryIdentity(root, stagedArchive, transaction.staging.identity, "source-driven staged archive");
  await assertNoExistingSymlinkComponents(root, archiveDirectory, "source-driven candidate archive");
  await mkdir(archiveDirectory, {recursive: false, mode: 0o700});
  transaction.archive.identity = await captureDirectoryIdentity(root, archiveDirectory, "source-driven candidate archive");
  await assertDirectoryIdentity(root, archiveParent, archiveParentIdentity, "source-driven archive parent");
  for (const [basename, stagingOwnership] of [...transaction.staging.files.entries()]) {
    await assertDirectoryIdentity(root, stagedArchive, transaction.staging.identity, "source-driven staged archive");
    await assertDirectoryIdentity(root, archiveDirectory, transaction.archive.identity, "source-driven candidate archive");
    const stagedFile = path.join(stagedArchive, basename);
    const archivedFile = path.join(archiveDirectory, basename);
    await verifyOwnedRegularFile({root, candidate: stagedFile, ownership: stagingOwnership, label: `source-driven staged ${basename}`, requireSingleLink: true});
    await link(stagedFile, archivedFile);
    transaction.archive.files.set(basename, stagingOwnership);
    await verifyOwnedRegularFile({root, candidate: archivedFile, ownership: stagingOwnership, label: `source-driven archived ${basename}`, requireSingleLink: false});
    await unlinkOwnedRegularFile({root, candidate: stagedFile, ownership: stagingOwnership, label: `source-driven staged ${basename}`});
    transaction.staging.files.delete(basename);
    await verifyOwnedRegularFile({root, candidate: archivedFile, ownership: stagingOwnership, label: `source-driven archived ${basename}`, requireSingleLink: true});
  }
  invariant((await readdir(stagedArchive)).length === 0, "source-driven staged archive is not empty after publication");
  await rmdir(stagedArchive);
  transaction.staging.removed = true;
  await assertDirectoryIdentity(root, archiveDirectory, transaction.archive.identity, "source-driven candidate archive");
  await chmod(archiveDirectory, 0o755);
  transaction.archive.committed = true;
  await verifyOwnedArchive({
    root,
    archiveDirectory,
    archiveOwnership: transaction.archive,
    expectedNames: [...transaction.archive.files.keys()],
  });
}

async function removeOwnedFileIfUnchanged(candidate, ownership) {
  try {
    const info = await lstatIfPresent(candidate);
    if (!info || !info.isFile() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.node)) return false;
    if (digest(await readFile(candidate)) !== ownership.sha256) return false;
    await unlink(candidate);
    return true;
  } catch {
    return false;
  }
}

async function cleanupOwnedDirectory(directory, ownership) {
  if (!ownership?.identity) return false;
  try {
    const info = await lstatIfPresent(directory);
    if (!info || !info.isDirectory() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), ownership.identity.node)) return false;
    await chmod(directory, 0o700);
    for (const [basename, fileOwnership] of ownership.files.entries()) {
      await removeOwnedFileIfUnchanged(path.join(directory, basename), fileOwnership);
    }
    const after = await lstatIfPresent(directory);
    if (!after || !after.isDirectory() || after.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(after), ownership.identity.node)) return false;
    const entries = await readdir(directory);
    if (entries.length) {
      await chmod(directory, ownership.committed ? 0o755 : ownership.identity.mode);
      return false;
    }
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function cleanupEmptyOwnedDirectory(directory, identity) {
  if (!identity) return false;
  try {
    const info = await lstatIfPresent(directory);
    if (!info || !info.isDirectory() || info.isSymbolicLink() || !sameNodeIdentity(nodeIdentity(info), identity.node)) return false;
    if ((await readdir(directory)).length) return false;
    await rmdir(directory);
    return true;
  } catch {
    return false;
  }
}

async function cleanupTransaction({transaction, pendingDirectory, pendingDirectoryCreated, archiveParent, archiveParentCreated}) {
  for (const [candidate, ownership] of [...transaction.outputFiles.entries()].reverse()) await removeOwnedFileIfUnchanged(candidate, ownership);
  for (const [candidate, ownership] of transaction.temporaryFiles.entries()) await removeOwnedFileIfUnchanged(candidate, ownership);
  await cleanupOwnedDirectory(transaction.archive.path, transaction.archive);
  if (!transaction.staging.removed) await cleanupOwnedDirectory(transaction.staging.path, transaction.staging);
  if (pendingDirectoryCreated) await cleanupEmptyOwnedDirectory(pendingDirectory, transaction.pendingIdentity);
  if (archiveParentCreated) await cleanupEmptyOwnedDirectory(archiveParent, transaction.archiveParentIdentity);
}

function helpText() {
  return `Usage: node scripts/prepare-source-driven-branch-candidate.mjs [options]\n\nRequired:\n  --spec <file>\n  --kit-manifest <file>\n  --environment-isolation-receipt <file>\n  --launch-receipt <file>\n  --toolchain-receipt <file>\n  --session-attestation <file>\n  --adapter-entry-log <file>\n  --random-trial-log <file>\n  --operation-log <file>\n  --source-event-log <file>\n  --frame-state-log <file>\n  --capture-manifest <file>\n  --frames <directory>\n\nOptions:\n  --project-root <directory>\n  -h, --help\n\nThis command validates and archives an append-only candidate only. It never launches Adobe, writes canonical baseline/execution evidence, changes coverage/status/reviews, or edits source-assets.\n`;
}

export function parseArguments(argv) {
  const options = {projectRoot: repositoryRoot};
  const valueOptions = new Map([
    ["--spec", "spec"],
    ["--kit-manifest", "kitManifest"],
    ["--environment-isolation-receipt", "environmentIsolationReceipt"],
    ["--launch-receipt", "launchReceipt"],
    ["--toolchain-receipt", "toolchainReceipt"],
    ["--session-attestation", "sessionAttestation"],
    ["--adapter-entry-log", "adapterEntryLog"],
    ["--random-trial-log", "randomTrialLog"],
    ["--operation-log", "operationLog"],
    ["--source-event-log", "sourceEventLog"],
    ["--frame-state-log", "frameStateLog"],
    ["--capture-manifest", "captureManifest"],
    ["--frames", "frames"],
    ["--project-root", "projectRoot"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (valueOptions.has(value)) {
      const next = argv[index + 1];
      invariant(next && !next.startsWith("--"), `${value} requires a value`);
      options[valueOptions.get(value)] = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

export async function prepareSourceDrivenBranchCandidate(options, {hooks = {}, testOnlyApprovedRuntime} = {}) {
  for (const field of [
    "archiveOutput", "candidateManifestOutput", "candidateReportOutput", "baselineOutput", "executionOutput",
    "updateCoverage", "promote", "adopt", "ownerReview", "humanReview", "seed", "branch",
  ]) invariant(!Object.hasOwn(options, field), `${field} is unsupported; source-driven candidate outputs and authority are fixed`);
  const root = path.resolve(options.projectRoot || repositoryRoot);
  const approvedRuntime = await resolveApprovedRuntime(root, testOnlyApprovedRuntime);
  for (const [field, label] of [
    ["spec", "--spec"], ["kitManifest", "--kit-manifest"], ["environmentIsolationReceipt", "--environment-isolation-receipt"],
    ["launchReceipt", "--launch-receipt"],
    ["toolchainReceipt", "--toolchain-receipt"], ["sessionAttestation", "--session-attestation"],
    ["adapterEntryLog", "--adapter-entry-log"], ["randomTrialLog", "--random-trial-log"], ["operationLog", "--operation-log"],
    ["sourceEventLog", "--source-event-log"], ["frameStateLog", "--frame-state-log"],
    ["captureManifest", "--capture-manifest"], ["frames", "--frames"],
  ]) assertString(options[field], label);
  const specPath = await readBoundFile({root, workspace: root, declared: options.spec, label: "--spec", bases: [root]});
  const bound = await loadBoundSpec({root, specPath});
  const kitManifestPath = await readBoundFile({root, workspace: bound.workspace, declared: options.kitManifest, label: "--kit-manifest", bases: [root]});
  const kitDocument = await validateSourceDrivenKitManifest({root, bound, kitManifestPath, approvedRuntime});
  const environmentPath = await readBoundFile({root, workspace: bound.workspace, declared: options.environmentIsolationReceipt, label: "--environment-isolation-receipt", bases: [root], outsideKit: true});
  const launchPath = await readBoundFile({root, workspace: bound.workspace, declared: options.launchReceipt, label: "--launch-receipt", bases: [root], outsideKit: true});
  const toolchainPath = await readBoundFile({root, workspace: bound.workspace, declared: options.toolchainReceipt, label: "--toolchain-receipt", bases: [root], outsideKit: true});
  const attestationPath = await readBoundFile({root, workspace: bound.workspace, declared: options.sessionAttestation, label: "--session-attestation", bases: [root], outsideKit: true});
  const adapterEntryLogPath = await readBoundFile({root, workspace: bound.workspace, declared: options.adapterEntryLog, label: "--adapter-entry-log", bases: [root], outsideKit: true});
  const randomTrialLogPath = await readBoundFile({root, workspace: bound.workspace, declared: options.randomTrialLog, label: "--random-trial-log", bases: [root], outsideKit: true});
  const operationLogPath = await readBoundFile({root, workspace: bound.workspace, declared: options.operationLog, label: "--operation-log", bases: [root], outsideKit: true});
  const eventLogPath = await readBoundFile({root, workspace: bound.workspace, declared: options.sourceEventLog, label: "--source-event-log", bases: [root], outsideKit: true});
  const frameLogPath = await readBoundFile({root, workspace: bound.workspace, declared: options.frameStateLog, label: "--frame-state-log", bases: [root], outsideKit: true});
  const captureManifestPath = await readBoundFile({root, workspace: bound.workspace, declared: options.captureManifest, label: "--capture-manifest", bases: [root], outsideKit: true});
  const framesDirectory = await readBoundFile({root, workspace: bound.workspace, declared: options.frames, label: "--frames", bases: [root], outsideKit: true, type: "directory"});
  const environmentDocument = await loadEnvironmentReceipt({root, bound, path: environmentPath});
  const launchDocument = await loadLaunchReceipt({root, bound, kitDocument, environmentDocument, receiptPath: launchPath, approvedRuntime});
  const toolchainBinding = {
    sessionId: environmentDocument.receipt.sessionId,
    traceSpecSha256: bound.specDocument.sha256,
    traceSpecIndexSha256: bound.indexDocument.sha256,
    sourceSwfSha256: bound.spec.sourceBindings.sourceSwf.sha256,
    captureKitManifestSha256: kitDocument.document.sha256,
    sandboxProfileSha256: kitDocument.kit.sandbox.sha256,
    environmentIsolationReceiptSha256: environmentDocument.sha256,
    launchReceiptSha256: launchDocument.sha256,
  };
  const toolchainDocument = await loadToolchainReceipt({root, bound, receiptPath: toolchainPath, expectedBinding: toolchainBinding, approvedRuntime});
  const attestationDocument = await loadSessionAttestation({
    root, bound, kitDocument, attestationPath, environmentDocument, launchDocument, toolchainDocument,
    adapterEntryLogPath, randomTrialLogPath, operationLogPath, eventLogPath, frameLogPath, captureManifestPath, framesDirectory,
  });
  const adapterEvidence = await verifyAdapterEntryLog({bound, attestationDocument, logPath: adapterEntryLogPath});
  const randomEvidence = await verifyRandomTrialLog({bound, attestationDocument, adapterEvidence, logPath: randomTrialLogPath});
  const frameEvidence = await verifyFrameStateLog({root, bound, attestationDocument, frameLogPath, framesDirectory});
  const eventEvidence = await verifySourceEventLog({root, bound, attestationDocument, eventLogPath});
  verifyCrossStreamCausality({bound, randomEvidence, eventEvidence, frameEvidence});
  const operationEvidence = await verifyOperationLog({bound, attestationDocument, randomEvidence, eventEvidence, frameEvidence, logPath: operationLogPath});
  const masterEvidenceChain = buildMasterEvidenceChain({adapterEvidence, randomEvidence, eventEvidence, frameEvidence, operationEvidence});
  invariant(same(attestationDocument.attestation.masterEvidenceChain, masterEvidenceChain), "source-driven session master evidence chain differs from verified records");
  const captureDocument = await verifyCaptureManifest({root, bound, kitDocument, launchDocument, attestationDocument, captureManifestPath, adapterEvidence, randomEvidence, operationEvidence, eventEvidence, frameEvidence, masterEvidenceChain});
  const results = buildCandidateResults({bound, eventEvidence, frameEvidence});
  const proofProjection = {
    schemaVersion: 1,
    status: "complete-pass",
    proofMode: SOURCE_DRIVEN_BRANCH_PROOF_MODE,
    animationId: bound.spec.animationId,
    requirementId: bound.spec.requirementId,
    identity: {
      frameDomainId: bound.spec.identity.frameDomainId,
      traceId: bound.spec.identity.traceId,
      entryStateSha256: bound.spec.identity.entryStateSha256,
      scenario: bound.spec.identity.scenario,
      language: bound.spec.identity.language,
      seed: bound.spec.identity.seed,
    },
    traceSpecBinding: {file: bound.specRelative, sha256: bound.specDocument.sha256},
    authorizedRuntime: {
      name: approvedRuntime.name,
      version: approvedRuntime.version,
      build: approvedRuntime.version,
      launchProtocol: "named-human-pre-trace-adapter-entry-then-passive-natural-observation",
      authority: "original-runtime-natural-trace",
      sourceSwfSha256: bound.spec.sourceBindings.sourceSwf.sha256,
    },
    rawEventLog: {file: attestationDocument.attestation.sourceEventLog.file, sha256: eventEvidence.log.sha256, eventCount: 3, dispatchedActionCount: 0},
    sourceTargetResolutionLog: {file: attestationDocument.attestation.sourceEventLog.file, sha256: eventEvidence.log.sha256},
    stateSnapshotArchive: {file: attestationDocument.attestation.frameStateLog.file, sha256: frameEvidence.log.sha256},
    originalRuntimeCaptureManifest: {file: attestationDocument.attestation.captureManifest.file, sha256: captureDocument.sha256},
    frameResults: [],
    orderedStepResults: [],
    sourceDrivenEventResults: results.sourceDrivenEventResults,
    stateCheckpointResults: results.stateCheckpointResults,
    terminalResult: results.terminalResult,
    zeroActionObservation: results.zeroActionObservation,
    unexpectedEvents: [],
    sequenceChainSha256: results.sequenceChainSha256,
  };
  validateExecutionProof(bound.spec, proofProjection, {traceSpecFile: bound.specRelative, traceSpecSha256: bound.specDocument.sha256});

  const realEvidenceInputs = [
    {path: environmentPath, sha256: environmentDocument.sha256, label: "environment receipt"},
    {path: launchPath, sha256: launchDocument.sha256, label: "launch receipt"},
    {path: toolchainPath, sha256: toolchainDocument.sha256, label: "toolchain receipt"},
    {path: attestationPath, sha256: attestationDocument.sha256, label: "session attestation"},
    {path: adapterEntryLogPath, sha256: adapterEvidence.log.sha256, label: "adapter-entry log"},
    {path: randomTrialLogPath, sha256: randomEvidence.log.sha256, label: "random-trial log"},
    {path: operationLogPath, sha256: operationEvidence.log.sha256, label: "operation log"},
    {path: eventLogPath, sha256: eventEvidence.log.sha256, label: "source event log"},
    {path: frameLogPath, sha256: frameEvidence.log.sha256, label: "frame-state log"},
    {path: captureManifestPath, sha256: captureDocument.sha256, label: "capture manifest"},
    ...toolchainDocument.identityArtifacts.map((artifact, index) => ({path: artifact.path, sha256: artifact.sha256, label: `toolchain identity artifact ${index + 1}`})),
  ];
  const kitInputs = [
    {path: kitManifestPath, sha256: kitDocument.document.sha256, label: "capture-kit manifest"},
    {path: path.join(kitDocument.kitRoot, kitDocument.kit.runtimeTree.file), sha256: kitDocument.runtimeTreeDocument.sha256, label: "runtime-tree manifest"},
    {path: kitDocument.sandboxPath, sha256: kitDocument.kit.sandbox.sha256, label: "capture-kit sandbox"},
    {path: kitDocument.fixtureManifestPath, sha256: kitDocument.kit.bindings.fixtureManifest.sha256, label: "fixture manifest"},
    {path: kitDocument.stagedFixtureManifestPath, sha256: kitDocument.kit.bindings.fixtureManifest.sha256, label: "staged fixture manifest"},
    ...kitDocument.files.map((file, index) => ({path: file.path, sha256: file.descriptor.sha256, label: `runtime-tree file ${index + 1}`})),
    ...kitDocument.templateFiles.map((file, index) => ({path: file.path, sha256: file.descriptor.sha256, label: `capture-kit template ${index + 1}`})),
    ...kitDocument.fixtureFiles.map((file, index) => ({path: file.path, sha256: file.sha256, label: `authoritative fixture inventory ${index + 1}`})),
    {path: kitDocument.fixtureGeneratedByPath, sha256: digest(await readFile(kitDocument.fixtureGeneratedByPath)), label: "fixture generator"},
    {path: kitDocument.fixtureAudioAuditPath, sha256: digest(await readFile(kitDocument.fixtureAudioAuditPath)), label: "fixture audio audit"},
    {path: path.join(root, SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE), sha256: digest(await readFile(path.join(root, SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_FILE))), label: "shared source-driven capture contract"},
  ];
  const frameInputs = frameEvidence.items.map((item) => ({path: item.screenshotPath, sha256: item.record.screenshotSha256, label: `source frame ${item.record.observedLocalFrame}`}));
  const protectedInputs = [...bound.immutableInputs, ...kitInputs, ...realEvidenceInputs, ...frameInputs];
  const safeId = safeRequirementId(bound.spec.requirementId);
  const pendingDirectory = path.join(bound.workspace, "evidence", "pending-source-driven-branch-capture", safeId);
  const candidateManifestPath = await resolveFixedOutputPath(root, path.join(pendingDirectory, "candidate-manifest.json"), "source-driven candidate manifest output");
  const candidateReportPath = await resolveFixedOutputPath(root, path.join(pendingDirectory, "candidate-report.json"), "source-driven candidate report output");
  const archiveDirectory = await resolveFixedOutputPath(root, path.join(root, "artifacts", "full-frame", "pilot-baselines", bound.spec.animationId, safeId, "pending-human-owner-source-driven-branch"), "source-driven archive output");
  const canonicalBaseline = path.join(bound.workspace, "baseline", "original-runtime", `${safeId}.json`);
  const canonicalExecution = path.join(bound.workspace, bound.spec.executionEvidence.expectedExecutionReportPath);
  const expectedCanonicalExecution = path.join(bound.workspace, "baseline", "trace-executions", `${safeId}.json`);
  invariant(canonicalExecution === expectedCanonicalExecution, "source-driven expected execution path is not the fixed canonical trace-execution path");
  for (const output of [pendingDirectory, archiveDirectory]) {
    for (const canonical of [path.dirname(canonicalBaseline), path.dirname(canonicalExecution)]) {
      invariant(!pathsOverlap(output, canonical), "source-driven candidate output overlaps canonical baseline/execution evidence");
    }
  }
  for (const [candidate, label] of [[candidateManifestPath, "candidate manifest"], [candidateReportPath, "candidate report"], [archiveDirectory, "candidate archive"]]) invariant(!(await exists(candidate)), `source-driven ${label} already exists; evidence is append-only`);
  const pendingDirectoryExisted = await exists(pendingDirectory);
  const archiveParent = path.dirname(archiveDirectory);
  const archiveParentExisted = await exists(archiveParent);
  const archiveRelative = portable(path.relative(root, archiveDirectory));
  const stagedArchive = path.join(archiveParent, `.tmp-${path.basename(archiveDirectory)}-${process.pid}-${Date.now()}`);
  const protectedSnapshot = await snapshotProtectedInputs({root, inputs: protectedInputs, framesDirectory});
  await assertInputOutputDisjointness({
    root,
    protectedSnapshot,
    outputBoundaries: [
      {path: pendingDirectory, label: "source-driven pending output"},
      {path: archiveDirectory, label: "source-driven archive output"},
      {path: stagedArchive, label: "source-driven archive staging output"},
    ],
  });
  await assertProtectedInputsUnchanged(root, protectedSnapshot, "before");
  const transaction = {
    sequence: 0,
    pendingIdentity: null,
    archiveParentIdentity: null,
    temporaryFiles: new Map(),
    outputFiles: new Map(),
    staging: {path: stagedArchive, identity: null, files: new Map(), removed: false, committed: false},
    archive: {path: archiveDirectory, identity: null, files: new Map(), removed: false, committed: false},
  };
  try {
    await ensureRealOutputDirectory(root, pendingDirectory, "source-driven pending directory");
    await ensureRealOutputDirectory(root, archiveParent, "source-driven archive parent");
    transaction.pendingIdentity = await captureDirectoryIdentity(root, pendingDirectory, "source-driven pending directory");
    transaction.archiveParentIdentity = await captureDirectoryIdentity(root, archiveParent, "source-driven archive parent");
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await hooks.afterPathPreparation?.({pendingDirectory, archiveParent, archiveDirectory});
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await mkdir(stagedArchive, {recursive: false});
    transaction.staging.identity = await captureDirectoryIdentity(root, stagedArchive, "source-driven staged archive");
    await assertDirectoryIdentity(root, archiveParent, transaction.archiveParentIdentity, "source-driven archive parent");
    const copy = async (source, basename, expectedSha256) => {
      return copyIntoOwnedStage({
        root,
        archiveParent,
        archiveParentIdentity: transaction.archiveParentIdentity,
        stagedArchive,
        stagedIdentity: transaction.staging.identity,
        source,
        basename,
        expectedSha256,
        archiveRelative,
        transaction,
      });
    };
    const dependencies = {
      traceSpec: await copy(specPath, "trace-spec.json", bound.specDocument.sha256),
      traceSpecIndex: await copy(path.join(root, TRACE_INDEX_PATH), "trace-spec-index.json", bound.indexDocument.sha256),
      migrationManifest: await copy(path.join(bound.workspace, "migration.json"), "migration-manifest.json", bound.manifestDocument.sha256),
      fullFrameCoverage: await copy(path.join(bound.workspace, "evidence", "full-frame-coverage.json"), "full-frame-coverage.json", bound.coverageDocument.sha256),
      scenarioInventory: await copy(path.join(bound.workspace, "audit", "scenario-inventory.json"), "scenario-inventory.json", bound.inventoryDocument.sha256),
      traceSpecGenerator: await copy(bound.generatorPath, "trace-spec-generator.mjs", bound.spec.sourceBindings.scheduleDerivation.generator.sha256),
      preservedSourceSwf: await copy(bound.sourcePath, "exact-preserved-source.swf", bound.spec.sourceBindings.sourceSwf.sha256),
      kitManifest: await copy(kitManifestPath, "capture-kit-manifest.json", kitDocument.document.sha256),
      runtimeTreeManifest: await copy(path.join(kitDocument.kitRoot, kitDocument.kit.runtimeTree.file), "runtime-tree-manifest.json", kitDocument.runtimeTreeDocument.sha256),
      fixtureManifestSource: await copy(kitDocument.fixtureManifestPath, "fixture-manifest-source.json", kitDocument.kit.bindings.fixtureManifest.sha256),
      stagedFixtureManifest: await copy(kitDocument.stagedFixtureManifestPath, "runtime-tree-fixture-manifest.json", kitDocument.kit.bindings.fixtureManifest.sha256),
      sandbox: await copy(kitDocument.sandboxPath, "capture-kit-sandbox.sb", kitDocument.kit.sandbox.sha256),
      environmentReceipt: await copy(environmentPath, "environment-isolation-receipt.json", environmentDocument.sha256),
      launchReceipt: await copy(launchPath, "projector-launch-receipt.json", launchDocument.sha256),
      toolchainReceipt: await copy(toolchainPath, "runtime-toolchain-receipt.json", toolchainDocument.sha256),
      sessionAttestation: await copy(attestationPath, "session-attestation.json", attestationDocument.sha256),
      adapterEntryLog: await copy(adapterEntryLogPath, "adapter-entry-log.jsonl", adapterEvidence.log.sha256),
      randomTrialLog: await copy(randomTrialLogPath, "random-trial-log.jsonl", randomEvidence.log.sha256),
      operationLog: await copy(operationLogPath, "operation-log.jsonl", operationEvidence.log.sha256),
      sourceEventLog: await copy(eventLogPath, "source-driven-event-log.jsonl", eventEvidence.log.sha256),
      frameStateLog: await copy(frameLogPath, "frame-state-log.jsonl", frameEvidence.log.sha256),
      captureManifestInput: await copy(captureManifestPath, "capture-manifest-input.json", captureDocument.sha256),
    };
    const toolchainIdentityArchive = [];
    for (const [index, artifact] of toolchainDocument.identityArtifacts.entries()) toolchainIdentityArchive.push({
      kind: artifact.descriptor.kind,
      ...await copy(artifact.path, `toolchain-identity-${String(index + 1).padStart(2, "0")}-${path.basename(artifact.path)}`, artifact.sha256),
    });
    const runtimeTreeArchive = [];
    for (const [index, file] of kitDocument.files.entries()) runtimeTreeArchive.push(await copy(file.path, `runtime-tree-${String(index + 1).padStart(2, "0")}-${path.basename(file.path)}`, file.descriptor.sha256));
    const kitTemplateArchive = [];
    for (const [index, file] of kitDocument.templateFiles.entries()) kitTemplateArchive.push(await copy(file.path, `capture-kit-template-${String(index + 1).padStart(2, "0")}-${path.basename(file.path)}`, file.descriptor.sha256));
    const archivedFrames = [];
    for (const [index, item] of frameEvidence.items.entries()) {
      const basename = `frame-${String(index + 1).padStart(4, "0")}.png`;
      const descriptor = await copy(item.screenshotPath, basename, item.record.screenshotSha256);
      archivedFrames.push({
        animationId: bound.spec.animationId,
        requirementId: bound.spec.requirementId,
        frameDomainId: bound.spec.identity.frameDomainId,
        traceId: bound.spec.identity.traceId,
        entryStateSha256: bound.spec.identity.entryStateSha256,
        scenario: bound.spec.identity.scenario,
        language: bound.spec.identity.language,
        seed: bound.spec.identity.seed,
        frame: index + 1,
        ...descriptor,
        width: 800,
        height: 600,
        stateRecordSha256: item.record.recordSha256,
      });
    }
    const candidateManifest = {
      schemaVersion: 1,
      evidenceType: "attested-source-driven-branch-candidate-manifest",
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      animationId: bound.spec.animationId,
      requirementId: bound.spec.requirementId,
      identity: proofProjection.identity,
      capturedAtClaim: attestationDocument.attestation.endedAt,
      declaredRuntimeFacts: {stage: {width: 800, height: 600}, fps: 12, rootEntryFrame: 6, localFrameCount: 142, frameNumbering: "one-indexed"},
      source: {swf: bound.spec.sourceBindings.sourceSwf, isolatedMinimalAdapterOnly: true, completeOriginalShellClaimed: false},
      dependencies: {...dependencies, runtimeTree: runtimeTreeArchive, kitTemplates: kitTemplateArchive, toolchainIdentityArtifacts: toolchainIdentityArchive},
      scheduleBinding: scheduleBinding(bound.spec),
      naturalRandomObservation: attestationDocument.attestation.naturalRandomObservation,
      masterEvidenceChain,
      frameSetSha256: orderedFrameSetSha256(archivedFrames.map(({frame, file, sha256}) => ({frame, file, sha256}))),
      frames: archivedFrames,
    };
    const candidateManifestBytes = Buffer.from(renderJson(candidateManifest));
    const candidateManifestDescriptor = {file: portable(path.relative(root, candidateManifestPath)), sha256: digest(candidateManifestBytes)};
    const candidateReport = {
      schemaVersion: 1,
      evidenceType: "attested-source-driven-branch-candidate-report",
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      promotionRequired: structuredClone(PROMOTION_REQUIRED),
      proofMode: SOURCE_DRIVEN_BRANCH_PROOF_MODE,
      animationId: bound.spec.animationId,
      requirementId: bound.spec.requirementId,
      identity: proofProjection.identity,
      traceSpecBinding: {file: bound.specRelative, sha256: bound.specDocument.sha256},
      candidateManifest: candidateManifestDescriptor,
      captureSessionAttestation: dependencies.sessionAttestation,
      claimedRuntime: {
        ...toolchainDocument.receipt.runtime,
        claimedExecutableSha256: approvedRuntime.executableSha256,
        authority: CANDIDATE_AUTHORITY,
        authorityStatement: "Named-human accountability claim only; candidate preparation does not independently prove original-runtime provenance.",
      },
      scheduleBinding: scheduleBinding(bound.spec),
      masterEvidenceChain,
      rawEventLog: {...dependencies.sourceEventLog, eventCount: 3, dispatchedActionCount: 0},
      adapterEntryLog: {...dependencies.adapterEntryLog, recordCount: 2, preTraceHumanDispatchCount: 1},
      randomTrialLog: {...dependencies.randomTrialLog, recordCount: randomEvidence.items.length, acceptedCount: 1},
      operationLog: {...dependencies.operationLog, recordCount: 145, operatorDispatchCount: 0},
      stateSnapshotArchive: {...dependencies.frameStateLog, recordCount: 142},
      frameResults: [],
      sourceDrivenEventResults: results.sourceDrivenEventResults,
      orderedStepResults: [],
      stateCheckpointResults: results.stateCheckpointResults,
      terminalResult: results.terminalResult,
      zeroActionObservation: results.zeroActionObservation,
      unexpectedEvents: [],
      sequenceChainSha256: results.sequenceChainSha256,
      authorityBoundary: {
        canonicalBaselineCreated: false,
        canonicalExecutionCreated: false,
        coverageChanged: false,
        migrationStatusChanged: false,
        reviewsChanged: false,
        rmseOrFidelityProven: false,
        audioListeningOrSynchronizationAccepted: false,
        humanReviewRecorded: false,
        ownerAcceptanceRecorded: false,
      },
    };
    const candidateReportBytes = Buffer.from(renderJson(candidateReport));
    const expectedArchiveNames = [...transaction.staging.files.keys()];
    await assertProtectedInputsUnchanged(root, protectedSnapshot, "during");
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await hooks.beforeArchivePublish?.({stagedArchive, archiveDirectory, pendingDirectory, archiveParent});
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await publishOwnedArchive({
      root,
      archiveParent,
      archiveParentIdentity: transaction.archiveParentIdentity,
      stagedArchive,
      archiveDirectory,
      transaction,
    });
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    await hooks.afterArchive?.({archiveDirectory, pendingDirectory, canonicalBaseline, canonicalExecution});
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    const manifestOwnership = await writeOwnedNewAtomic({
      root,
      parentDirectory: pendingDirectory,
      parentIdentity: transaction.pendingIdentity,
      candidate: candidateManifestPath,
      bytes: candidateManifestBytes,
      label: "source-driven candidate manifest",
      transaction,
    });
    await hooks.afterManifest?.({candidateManifestPath, pendingDirectory, canonicalBaseline, canonicalExecution});
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await verifyOwnedRegularFile({root, candidate: candidateManifestPath, ownership: manifestOwnership, label: "source-driven candidate manifest", requireSingleLink: true});
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    const reportOwnership = await writeOwnedNewAtomic({
      root,
      parentDirectory: pendingDirectory,
      parentIdentity: transaction.pendingIdentity,
      candidate: candidateReportPath,
      bytes: candidateReportBytes,
      label: "source-driven candidate report",
      transaction,
    });
    await hooks.afterReport?.({candidateReportPath, pendingDirectory, canonicalBaseline, canonicalExecution});
    await verifyPublicationPathIdentity({
      root, workspace: bound.workspace, pendingDirectory, pendingIdentity: transaction.pendingIdentity,
      archiveDirectory, archiveParentIdentity: transaction.archiveParentIdentity,
      candidateManifestPath, candidateReportPath, canonicalBaseline, canonicalExecution,
    });
    await verifyOwnedRegularFile({root, candidate: candidateManifestPath, ownership: manifestOwnership, label: "source-driven candidate manifest", requireSingleLink: true});
    await verifyOwnedRegularFile({root, candidate: candidateReportPath, ownership: reportOwnership, label: "source-driven candidate report", requireSingleLink: true});
    await verifyOwnedArchive({root, archiveDirectory, archiveOwnership: transaction.archive, expectedNames: expectedArchiveNames});
    await assertProtectedInputsUnchanged(root, protectedSnapshot, "after");
    return {
      animationId: bound.spec.animationId,
      requirementId: bound.spec.requirementId,
      proofMode: SOURCE_DRIVEN_BRANCH_PROOF_MODE,
      status: CANDIDATE_STATUS,
      authority: CANDIDATE_AUTHORITY,
      strictAcceptanceEffect: false,
      candidateManifest: candidateManifestDescriptor,
      candidateReport: {file: portable(path.relative(root, candidateReportPath)), sha256: digest(candidateReportBytes)},
      archiveDirectory: archiveRelative,
      frameCount: 142,
      sourceDrivenEventCount: 3,
      adapterEntryRecordCount: 2,
      randomTrialCount: randomEvidence.items.length,
      operationRecordCount: 145,
      operatorDispatchCount: 0,
      coverageChanged: false,
      migrationStatusChanged: false,
      reviewsChanged: false,
      sourceChanged: false,
    };
  } catch (error) {
    await cleanupTransaction({
      transaction,
      pendingDirectory,
      pendingDirectoryCreated: !pendingDirectoryExisted,
      archiveParent,
      archiveParentCreated: !archiveParentExisted,
    });
    throw error;
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  process.stdout.write(`${JSON.stringify(await prepareSourceDrivenBranchCandidate(options), null, 2)}\n`);
}

if (path.resolve(process.argv[1] || "") === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
