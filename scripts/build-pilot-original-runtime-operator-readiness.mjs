#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, readdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  STRICT_FULL_DOMAIN_BOUNDARY,
  classifyStrictFullDomainRequirement,
  validateSupplementalPartialRequirementBoundary,
} from "./lib/strict-full-domain-requirement.mjs";
import {PILOT_MIGRATIONS} from "./scaffold-pilot-migrations.mjs";
import {DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES} from "./source-driven-branch-capture-contracts.mjs";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_FILE), "..");
const DEFAULT_JSON = path.join(PROJECT_ROOT, "reports", "pilot-original-runtime-operator-readiness.json");
const DEFAULT_MARKDOWN = path.join(PROJECT_ROOT, "reports", "pilot-original-runtime-operator-readiness.md");

const KIT_FAMILIES = Object.freeze([
  Object.freeze({kind: "root", root: "work/root-capture-kits"}),
  Object.freeze({kind: "natural", root: "work/natural-trace-capture-kits"}),
  Object.freeze({kind: "source-driven", root: "work/source-driven-branch-capture-kits"}),
]);

const EXPECTED_KIT_COUNTS = Object.freeze({
  courseRootLinear: 18,
  legacyRootLinear: 10,
  courseNatural: 2,
  legacyNatural: 2,
  sourceDriven: 2,
  total: 34,
});

const TRACE_SPEC_INDEX_FILES = Object.freeze([
  "migrations/course-shell-pilot-trace-spec-index.json",
  "migrations/legacy-pilot-trace-spec-index.json",
]);

const ROOT_CAPTURE_READY = "source-frame-accurate-root-ready-for-authoritative-capture";
const NATURAL_EXECUTION_READY = "source-schedule-ready-for-authoritative-execution";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort(compareCodeUnits).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectRelative(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `Path escapes project root: ${file}`);
  return portable(relative);
}

function displayPath(root, file) {
  const relative = path.relative(root, file);
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
    ? portable(relative)
    : file;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readHashedJson(file, label = file) {
  const bytes = await readFile(file);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return {bytes, value, descriptor: {bytes: bytes.length, sha256: sha256(bytes)}};
}

async function fileDescriptor(root, file) {
  const bytes = await readFile(file);
  return {file: projectRelative(root, file), bytes: bytes.length, sha256: sha256(bytes)};
}

async function walkFiles(root, directory, current = directory) {
  const entries = await readdir(current, {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) => compareCodeUnits(left.name, right.name))) {
    const file = path.join(current, entry.name);
    const info = await lstat(file);
    invariant(!info.isSymbolicLink(), `Operator kit contains a forbidden symbolic link: ${projectRelative(root, file)}`);
    if (info.isDirectory()) files.push(...await walkFiles(root, directory, file));
    else if (info.isFile()) {
      const bytes = await readFile(file);
      files.push({
        file: portable(path.relative(directory, file)),
        bytes: bytes.length,
        sha256: sha256(bytes),
        mode: info.mode & 0o777,
      });
    } else throw new Error(`Operator kit contains an unsupported node: ${projectRelative(root, file)}`);
  }
  return files;
}

export function classifyKitManifest(manifest) {
  if (manifest.artifactType === "root-frame-accurate-capture-operator-kit") {
    const index = manifest.bindings?.traceSpecIndex?.file;
    if (index === "migrations/course-shell-pilot-trace-spec-index.json") return "course-root-linear";
    if (index === "migrations/legacy-pilot-trace-spec-index.json") return "legacy-root-linear";
  }
  if (manifest.artifactType === "rw-natural-trace-capture-operator-kit") return "course-natural";
  if (manifest.artifactType === "legacy-root-natural-trace-capture-operator-kit") return "legacy-natural";
  if (manifest.artifactType === "source-driven-natural-branch-capture-operator-kit") return "source-driven";
  throw new Error(`Unsupported operator kit artifactType: ${manifest.artifactType || "<missing>"}`);
}

export function inspectKitPayloadInventory(inventory) {
  const pngFiles = inventory.filter(({file}) => file.toLowerCase().endsWith(".png"));
  const framePayloadFiles = inventory.filter(({file}) => file.startsWith("frames/") && file !== "frames/README.md");
  const nonTemplateSessionArtifacts = inventory.filter(({file}) => {
    if (file.startsWith("templates/") || file.includes(".template.")) return false;
    const base = path.posix.basename(file);
    return /(?:launch-receipt|session-attestation|capture-session|operation-log|state-log|source-target-log|host-entry-log|display-list-states)/i.test(base);
  });
  return {
    pngCount: pngFiles.length,
    framePayloadCount: framePayloadFiles.length,
    nonTemplateSessionArtifactCount: nonTemplateSessionArtifacts.length,
    pngFiles: pngFiles.map(({file}) => file),
    framePayloadFiles: framePayloadFiles.map(({file}) => file),
    nonTemplateSessionArtifacts: nonTemplateSessionArtifacts.map(({file}) => file),
    emptyUnsignedTemplateOnly: pngFiles.length === 0 && framePayloadFiles.length === 0 && nonTemplateSessionArtifacts.length === 0,
  };
}

async function inspectKit(root, kind, directory) {
  const manifestFile = path.join(directory, "kit-manifest.json");
  const document = await readHashedJson(manifestFile, projectRelative(root, manifestFile));
  const manifest = document.value;
  const classification = classifyKitManifest(manifest);
  invariant(manifest.strictAcceptanceEffect === false || classification === "source-driven", `${projectRelative(root, manifestFile)}: strictAcceptanceEffect must be false`);
  invariant(manifest.humanReviewRecorded !== true, `${projectRelative(root, manifestFile)}: kit unexpectedly claims human review`);
  invariant(manifest.ownerReviewRecorded !== true, `${projectRelative(root, manifestFile)}: kit unexpectedly claims owner review`);
  invariant(/unsigned.*template.*not-evidence/.test(manifest.status), `${projectRelative(root, manifestFile)}: kit is not an unsigned non-evidence template`);

  const inventory = await walkFiles(root, directory);
  const payload = inspectKitPayloadInventory(inventory);
  invariant(payload.emptyUnsignedTemplateOnly, `${projectRelative(root, directory)} contains session/PNG payload and cannot be indexed as an empty operator template`);
  const runtime = manifest.runtime || {};
  invariant(runtime.runtimeId === "adobe-flash-player-projector", `${projectRelative(root, manifestFile)}: unexpected runtime identity`);
  const executableBytes = await readFile(runtime.executablePath);
  invariant(sha256(executableBytes) === runtime.executableSha256, `${projectRelative(root, manifestFile)}: Projector executable hash drift`);

  return {
    kind,
    classification,
    animationId: manifest.animationId,
    requirementId: manifest.requirementId,
    language: manifest.identity?.language,
    scenario: manifest.identity?.scenario,
    frameDomainId: manifest.identity?.frameDomainId,
    requiredRange: manifest.identity?.requiredRange,
    expectedEvidenceCounts: manifest.expectedEvidenceCounts || manifest.templateContract?.candidateInputContract?.exact?.counts || null,
    directory: projectRelative(root, directory),
    manifest: {file: projectRelative(root, manifestFile), ...document.descriptor},
    traceSpec: manifest.bindings?.traceSpec || null,
    traceSpecIndex: manifest.bindings?.traceSpecIndex || null,
    runtime: {
      runtimeId: runtime.runtimeId,
      name: runtime.name,
      version: runtime.version,
      executablePath: runtime.executablePath,
      executableSha256: runtime.executableSha256,
    },
    launchReadiness: classification === "source-driven"
      ? {
          operatorLauncherIncluded: manifest.sandbox?.launcherIncluded === true,
          candidateWorkflowPreparedWithBundledLauncher: false,
          authoritativeEvidenceCreatedByLauncherAlone: false,
          blocker: "A separately reviewed runtime controller and disposable isolated environment are required before a real session.",
        }
      : classification === "course-natural" || classification === "legacy-natural"
        ? {
            operatorLauncherIncluded: true,
            candidateWorkflowPreparedWithBundledLauncher: manifest.originalHostLaunch?.authoritativeCapturePermittedByThisLauncher === true,
            authoritativeEvidenceCreatedByLauncherAlone: false,
            blocker: manifest.originalHostLaunch?.authoritativeCapturePermittedByThisLauncher === true
              ? null
              : manifest.originalHostLaunch?.authoritativeEnvironmentRequired || "A separately attested authoritative environment is required.",
          }
        : {
            operatorLauncherIncluded: true,
            candidateWorkflowPreparedWithBundledLauncher: true,
            authoritativeEvidenceCreatedByLauncherAlone: false,
            blocker: null,
          },
    payload: {
      fileCount: inventory.length,
      treeSha256: sha256(canonicalJson(inventory)),
      ...payload,
    },
    strictAcceptanceEffect: false,
  };
}

async function kitDirectories(root, family) {
  const familyRoot = path.join(root, family.root);
  if (!(await exists(familyRoot))) return [];
  const directories = [];
  const animations = (await readdir(familyRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_") && !entry.name.startsWith("."))
    .sort((left, right) => compareCodeUnits(left.name, right.name));
  for (const animation of animations) {
    const animationRoot = path.join(familyRoot, animation.name);
    const requirements = (await readdir(animationRoot, {withFileTypes: true}))
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_") && !entry.name.startsWith("."))
      .sort((left, right) => compareCodeUnits(left.name, right.name));
    for (const requirement of requirements) directories.push(path.join(animationRoot, requirement.name));
  }
  return directories;
}

export async function inspectCurrentOperatorKits({root = PROJECT_ROOT, enforceExpectedCounts = true} = {}) {
  const kits = [];
  for (const family of KIT_FAMILIES) {
    for (const directory of await kitDirectories(root, family)) kits.push(await inspectKit(root, family.kind, directory));
  }
  kits.sort((left, right) => compareCodeUnits(left.directory, right.directory));
  const counts = {
    courseRootLinear: kits.filter(({classification}) => classification === "course-root-linear").length,
    legacyRootLinear: kits.filter(({classification}) => classification === "legacy-root-linear").length,
    courseNatural: kits.filter(({classification}) => classification === "course-natural").length,
    legacyNatural: kits.filter(({classification}) => classification === "legacy-natural").length,
    sourceDriven: kits.filter(({classification}) => classification === "source-driven").length,
    total: kits.length,
  };
  if (enforceExpectedCounts) invariant(canonicalJson(counts) === canonicalJson(EXPECTED_KIT_COUNTS), `Operator kit count mismatch: ${JSON.stringify(counts)}`);
  return {counts, kits};
}

function requirementKey(animationId, requirementId) {
  return `${animationId}\u0000${requirementId}`;
}

function requirementIdentity(requirement) {
  return {
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: String(requirement.seed),
    requiredRange: requirement.requiredRange,
    baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
  };
}

function indexedIdentity(specification) {
  return {
    frameDomainId: specification.frameDomainId,
    traceId: specification.traceId,
    entryStateSha256: specification.entryStateSha256,
    scenario: specification.scenario,
    language: specification.language,
    seed: String(specification.seed),
    requiredRange: specification.requiredRange,
    baselineAuthorityRequirement: specification.baselineAuthorityRequirement,
  };
}

function incrementCount(counts, key) {
  counts[key] = (counts[key] || 0) + 1;
}

function sortedCountObject(counts) {
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compareCodeUnits(left, right)));
}

function frameDomainForRequirement(manifest, requirement, label) {
  const domains = manifest.implementation?.frameDomains;
  invariant(Array.isArray(domains), `${label}: migration implementation.frameDomains must be an array`);
  const matches = domains.filter(({id}) => id === requirement.frameDomainId);
  invariant(matches.length === 1, `${label}: expected exactly one matching frame domain`);
  invariant(Number.isInteger(matches[0].frameCount) && matches[0].frameCount > 0, `${label}: frame-domain frameCount must be a positive integer`);
  return matches[0];
}

function supplementalPartialDescriptor({pilotId, requirement, selection, frameCount}) {
  return {
    animationId: pilotId,
    requirementId: requirement.requirementId,
    coverageRole: selection.coverageRole,
    coverageGroupId: selection.coverageGroupId,
    frameDomainId: requirement.frameDomainId,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: String(requirement.seed),
    frameDomainFrameCount: frameCount,
    selectedPhysicalFrameCount: selection.selectedPhysicalFrames.length,
    selectedFirstFrame: selection.selectedPhysicalFrames[0],
    selectedLastFrame: selection.selectedPhysicalFrames.at(-1),
    strictAcceptanceEffect: requirement.strictAcceptanceEffect,
    originalRuntimeIndexEligible: false,
    currentJavascriptCapture: requirement.captureManifest
      ? {file: requirement.captureManifest, sha256: requirement.captureManifestSha256}
      : null,
    boundary: STRICT_FULL_DOMAIN_BOUNDARY,
    reason: "Supplemental current-JavaScript partial-path evidence is intentionally excluded from trace indexes and original-runtime authority reconciliation; the separate full-domain requirement remains the strict evidence obligation.",
  };
}

async function generatedFixtureFile(root, directory, manifest, relative, label) {
  const declared = (manifest.generatedFileHashes || []).filter(({path: itemPath}) => itemPath === relative);
  invariant(declared.length === 1, `${label}: fixture manifest must declare exactly one ${relative}`);
  const file = path.join(directory, relative);
  const descriptor = await fileDescriptor(root, file);
  invariant(descriptor.sha256 === declared[0].sha256, `${label}: ${relative} hash drift`);
  const info = await lstat(file);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label}: ${relative} must be a regular non-symbolic-link file`);
  return {...descriptor, mode: info.mode & 0o777};
}

export async function inspectSourceDrivenPreflightGaps({root = PROJECT_ROOT, readyTraceSpecsWithoutOperatorKit} = {}) {
  invariant(Array.isArray(readyTraceSpecsWithoutOperatorKit), "Ready-without-kit requirements are required for source-driven preflight inspection");
  const pendingKeys = new Set(readyTraceSpecsWithoutOperatorKit.map(({animationId, requirementId}) => requirementKey(animationId, requirementId)));
  const gaps = [];

  for (const profile of DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES) {
    const requirements = profile.specs.filter(({requirementId}) => pendingKeys.has(requirementKey(profile.animationId, requirementId)));
    if (!requirements.length) continue;
    invariant(requirements.length === profile.specs.length, `${profile.animationId}: source-driven preflight gap must cover the complete profile requirement set`);
    invariant(profile.captureEligible === false, `${profile.animationId}: capture-eligible profile is missing a machine-scaffoldable kit`);
    invariant(typeof profile.captureBlocker === "string" && profile.captureBlocker.length > 0, `${profile.animationId}: capture blocker is missing`);

    const manifestFile = path.resolve(root, profile.fixtureManifest);
    invariant(projectRelative(root, manifestFile) === portable(profile.fixtureManifest), `${profile.animationId}: fixture manifest path escapes or is not canonical`);
    const manifestDocument = await readHashedJson(manifestFile, profile.fixtureManifest);
    const manifest = manifestDocument.value;
    invariant(manifestDocument.descriptor.sha256 === profile.fixtureManifestSha256, `${profile.animationId}: fixture manifest profile hash drift`);
    invariant(manifest.animationId === profile.animationId, `${profile.animationId}: fixture manifest animation identity drift`);
    invariant(manifest.fixtureDigest === profile.fixtureDigest, `${profile.animationId}: fixture digest drift`);
    const directory = path.dirname(manifestFile);
    const smoke = manifest.guiSmokeAuthorization;
    invariant(smoke?.requiredApproval === "capture/sandbox-gui-smoke-test.json", `${profile.animationId}: unsupported GUI smoke approval path`);
    invariant(smoke?.template === "sandbox-gui-smoke-test.template.json", `${profile.animationId}: unsupported GUI smoke template path`);
    invariant(smoke?.smokeLauncher === "smoke-sandboxed.sh", `${profile.animationId}: unsupported GUI smoke launcher path`);
    invariant(smoke?.rule === "do not click the lazy pre-load stage during smoke", `${profile.animationId}: GUI smoke no-click rule drift`);

    const [template, smokeLauncher, launchLauncher] = await Promise.all([
      generatedFixtureFile(root, directory, manifest, smoke.template, profile.animationId),
      generatedFixtureFile(root, directory, manifest, smoke.smokeLauncher, profile.animationId),
      generatedFixtureFile(root, directory, manifest, "launch-sandboxed.sh", profile.animationId),
    ]);
    invariant((smokeLauncher.mode & 0o111) !== 0 && (launchLauncher.mode & 0o111) !== 0, `${profile.animationId}: fixture launchers must remain executable`);

    const approvalFile = path.join(directory, smoke.requiredApproval);
    const approvalPresent = await exists(approvalFile);
    const approval = approvalPresent ? await fileDescriptor(root, approvalFile) : null;
    const captureDirectory = path.join(directory, "capture");
    const captureFiles = (await collectFilesIfPresent(root, captureDirectory))
      .filter(({file}) => file !== projectRelative(root, approvalFile));

    gaps.push({
      animationId: profile.animationId,
      status: "blocked-pending-named-human-gui-sandbox-smoke-and-explicit-profile-eligibility-review",
      captureEligibleByCurrentContract: false,
      captureBlocker: profile.captureBlocker,
      requirements: requirements.map(({requirementId, specFile, outcome}) => ({requirementId, specFile, naturallyObservedOutcome: outcome})),
      fixture: {
        manifest: {file: profile.fixtureManifest, ...manifestDocument.descriptor},
        fixtureDigest: profile.fixtureDigest,
        template,
        smokeLauncher,
        launchLauncher,
        requiredApproval: {file: projectRelative(root, approvalFile), present: approvalPresent, descriptor: approval},
        unboundCaptureFiles: captureFiles,
        unboundCaptureFilesAuthority: "Files in capture/ do not satisfy the smoke gate without the named-human approval JSON that binds reviewer, time, observation, MIME type, exact evidence path, and SHA-256.",
      },
      exactRunbook: {
        fixtureIntegrityCheck: `node scripts/build-adobe-course-host-fixtures.mjs --verify-fixture ${profile.fixtureManifest}`,
        namedHumanSmokeLauncher: smokeLauncher.file,
        namedHumanRule: "Run the smoke launcher, do not click the stage, verify only the fixture pre-load screen, and preserve the exact app-window screenshot bytes.",
        humanRecordTemplate: template.file,
        requiredHumanRecord: projectRelative(root, approvalFile),
        postRecordReadOnlyCheck: `node scripts/build-adobe-course-host-fixtures.mjs --verify-launch ${profile.fixtureManifest}`,
        laterEngineeringReview: "After a valid named-human smoke record exists, independently review it and explicitly update the hash-pinned source-driven profile eligibility; no report generator may auto-enable capture.",
        laterKitScaffoldCommands: requirements.map(({specFile}) => `node scripts/scaffold-source-driven-branch-capture-kit.mjs --spec ${specFile}`),
      },
      machineOnlyCompletableNow: false,
      originalRuntimeExecuted: false,
      operatorKitCreated: false,
      strictAcceptanceEffect: false,
    });
  }

  const described = new Set(gaps.flatMap((gap) => gap.requirements.map(({requirementId}) => requirementKey(gap.animationId, requirementId))));
  for (const pending of pendingKeys) invariant(described.has(pending), `Ready trace spec without an operator kit lacks an exact preflight diagnostic: ${pending.replace("\u0000", "/")}`);
  return gaps;
}

export async function inspectOriginalRuntimeRequirementReadiness({root = PROJECT_ROOT, kits} = {}) {
  invariant(kits && Array.isArray(kits.kits), "Current operator-kit inspection is required");
  const pilotIds = new Set(PILOT_MIGRATIONS.map(({id}) => id));
  const indexed = new Map();
  const indexPilots = new Set();
  const indexes = [];

  for (const relative of TRACE_SPEC_INDEX_FILES) {
    const file = path.join(root, relative);
    const document = await readHashedJson(file, relative);
    const index = document.value;
    invariant(index.schemaVersion === 1 && Array.isArray(index.pilots), `${relative}: unsupported trace-spec index`);
    for (const pilot of index.pilots) {
      invariant(pilotIds.has(pilot.animationId), `${relative}: unexpected pilot ${pilot.animationId}`);
      invariant(!indexPilots.has(pilot.animationId), `${pilot.animationId}: appears in more than one trace-spec index`);
      indexPilots.add(pilot.animationId);
      invariant(Array.isArray(pilot.traceSpecs), `${pilot.animationId}: traceSpecs must be an array`);
      for (const item of pilot.traceSpecs) {
        const key = requirementKey(pilot.animationId, item.requirementId);
        invariant(!indexed.has(key), `${pilot.animationId}/${item.requirementId}: duplicate indexed trace spec`);
        const specFile = path.join(root, item.file);
        invariant(projectRelative(root, specFile) === portable(item.file), `${pilot.animationId}/${item.requirementId}: trace-spec path escapes or is not canonical`);
        const specDocument = await readHashedJson(specFile, item.file);
        const spec = specDocument.value;
        invariant(specDocument.descriptor.sha256 === item.sha256, `${item.file}: indexed SHA-256 drift`);
        invariant(spec.animationId === pilot.animationId && spec.requirementId === item.requirementId, `${item.file}: indexed identity drift`);
        invariant(spec.traceSpecStatus === item.status, `${item.file}: indexed status drift`);
        invariant(canonicalJson({
          frameDomainId: item.frameDomainId,
          traceId: item.traceId,
          scenario: item.scenario,
          language: item.language,
          seed: String(item.seed),
          traceModel: item.traceModel,
        }) === canonicalJson({
          frameDomainId: spec.identity?.frameDomainId,
          traceId: spec.identity?.traceId,
          scenario: spec.identity?.scenario,
          language: spec.identity?.language,
          seed: String(spec.identity?.seed),
          traceModel: spec.traceModel?.kind,
        }), `${item.file}: indexed trace identity drift`);
        const executionFile = item.expectedExecutionReport ? path.join(root, item.expectedExecutionReport) : null;
        const executionReport = executionFile && await exists(executionFile) ? await fileDescriptor(root, executionFile) : null;
        indexed.set(key, {
          animationId: pilot.animationId,
          requirementId: item.requirementId,
          status: item.status,
          traceModel: item.traceModel,
          file: item.file,
          sha256: item.sha256,
          identity: spec.identity,
          expectedExecutionReport: item.expectedExecutionReport || null,
          executionReport,
        });
      }
    }
    indexes.push({file: relative, ...document.descriptor});
  }

  invariant(indexPilots.size === pilotIds.size, `Trace-spec indexes cover ${indexPilots.size}/${pilotIds.size} pilots`);
  for (const pilotId of pilotIds) invariant(indexPilots.has(pilotId), `${pilotId}: absent from trace-spec indexes`);

  const kitByRequirement = new Map();
  for (const kit of kits.kits) {
    const key = requirementKey(kit.animationId, kit.requirementId);
    invariant(!kitByRequirement.has(key), `${kit.animationId}/${kit.requirementId}: duplicate operator kit`);
    const traceSpec = indexed.get(key);
    invariant(traceSpec, `${kit.animationId}/${kit.requirementId}: operator kit has no indexed trace spec`);
    invariant(traceSpec.sha256 === kit.traceSpec?.sha256 && traceSpec.file === kit.traceSpec?.file, `${kit.animationId}/${kit.requirementId}: operator-kit trace-spec binding drift`);
    invariant(traceSpec.status === ROOT_CAPTURE_READY || traceSpec.status === NATURAL_EXECUTION_READY, `${kit.animationId}/${kit.requirementId}: operator kit binds a non-ready trace spec`);
    kitByRequirement.set(key, kit);
  }

  const traceSpecStatusCounts = {};
  for (const item of indexed.values()) incrementCount(traceSpecStatusCounts, item.status);
  const coverageRequirementKeys = new Set();
  const baselineAuthorityCounts = {};
  const coverageRequirementsWithoutIndexedTraceSpec = [];
  const supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex = [];
  const pilots = [];
  let allCoverageRequirements = 0;
  let totalCoverageRequirements = 0;
  let resolvedBaselineAuthorityRequirements = 0;
  let baselineCaptureManifestDeclaredCount = 0;
  let metricsFileDeclaredCount = 0;

  for (const pilot of PILOT_MIGRATIONS) {
    const coverageFile = path.join(root, "migrations", pilot.id, "evidence", "full-frame-coverage.json");
    const migrationFile = path.join(root, "migrations", pilot.id, "migration.json");
    const [coverageDocument, migrationDocument] = await Promise.all([
      readHashedJson(coverageFile, projectRelative(root, coverageFile)),
      readHashedJson(migrationFile, projectRelative(root, migrationFile)),
    ]);
    const coverage = coverageDocument.value;
    const migration = migrationDocument.value;
    invariant(coverage.schemaVersion === 2 && coverage.animationId === pilot.id && Array.isArray(coverage.requirements), `${pilot.id}: unsupported coverage-v2 document`);
    invariant(migration.animationId === pilot.id, `${pilot.id}: migration identity drift`);
    const seen = new Set();
    const pilotSummary = {
      animationId: pilot.id,
      migration: {file: projectRelative(root, migrationFile), ...migrationDocument.descriptor},
      coverage: {file: projectRelative(root, coverageFile), ...coverageDocument.descriptor},
      coverageRequirementCount: coverage.requirements.length,
      originalRuntimeObligationCount: 0,
      supplementalPartialRequirementCount: 0,
      supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex: [],
      indexedTraceSpecCount: 0,
      rootCaptureReadyCount: 0,
      naturalExecutionReadyCount: 0,
      unresolvedTraceSpecCount: 0,
      readyWithOperatorKitCount: 0,
      readyWithoutOperatorKit: [],
      coverageRequirementsWithoutIndexedTraceSpec: [],
      resolvedBaselineAuthorityCount: 0,
      baselineCaptureManifestDeclaredCount: 0,
      metricsFileDeclaredCount: 0,
    };
    for (const requirement of coverage.requirements) {
      invariant(typeof requirement.requirementId === "string" && !seen.has(requirement.requirementId), `${pilot.id}: duplicate/missing coverage requirementId`);
      seen.add(requirement.requirementId);
      allCoverageRequirements += 1;
      const label = `${pilot.id}/${requirement.requirementId}`;
      const domain = frameDomainForRequirement(migration, requirement, label);
      const classification = classifyStrictFullDomainRequirement(requirement, domain.frameCount, label);
      const key = requirementKey(pilot.id, requirement.requirementId);
      if (!classification.eligible) {
        validateSupplementalPartialRequirementBoundary(requirement, classification.selection, label);
        invariant(!indexed.has(key), `${label}: ${STRICT_FULL_DOMAIN_BOUNDARY}`);
        const supplemental = supplementalPartialDescriptor({
          pilotId: pilot.id,
          requirement,
          selection: classification.selection,
          frameCount: domain.frameCount,
        });
        pilotSummary.supplementalPartialRequirementCount += 1;
        pilotSummary.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex.push(supplemental);
        supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex.push(supplemental);
        continue;
      }
      totalCoverageRequirements += 1;
      pilotSummary.originalRuntimeObligationCount += 1;
      coverageRequirementKeys.add(key);
      incrementCount(baselineAuthorityCounts, requirement.baselineAuthority || "<missing>");
      if (requirement.baselineAuthority && requirement.baselineAuthority !== "unresolved") {
        resolvedBaselineAuthorityRequirements += 1;
        pilotSummary.resolvedBaselineAuthorityCount += 1;
      }
      if (requirement.baselineCaptureManifest) {
        baselineCaptureManifestDeclaredCount += 1;
        pilotSummary.baselineCaptureManifestDeclaredCount += 1;
      }
      if (requirement.metricsFile) {
        metricsFileDeclaredCount += 1;
        pilotSummary.metricsFileDeclaredCount += 1;
      }
      const traceSpec = indexed.get(key);
      if (!traceSpec) {
        const missing = {
          animationId: pilot.id,
          requirementId: requirement.requirementId,
          coverageRole: requirement.coverageRole,
          baselineAuthority: requirement.baselineAuthority,
          reason: "coverage-v2 requirement has no indexed original-runtime trace specification",
        };
        pilotSummary.coverageRequirementsWithoutIndexedTraceSpec.push(missing);
        coverageRequirementsWithoutIndexedTraceSpec.push(missing);
        continue;
      }
      pilotSummary.indexedTraceSpecCount += 1;
      invariant(canonicalJson(requirementIdentity(requirement)) === canonicalJson(indexedIdentity(traceSpec.identity)), `${pilot.id}/${requirement.requirementId}: coverage/trace-spec identity drift`);
      if (traceSpec.status === ROOT_CAPTURE_READY) pilotSummary.rootCaptureReadyCount += 1;
      else if (traceSpec.status === NATURAL_EXECUTION_READY) pilotSummary.naturalExecutionReadyCount += 1;
      else if (traceSpec.status === "unresolved") pilotSummary.unresolvedTraceSpecCount += 1;
      if (traceSpec.status === ROOT_CAPTURE_READY || traceSpec.status === NATURAL_EXECUTION_READY) {
        if (kitByRequirement.has(key)) pilotSummary.readyWithOperatorKitCount += 1;
        else pilotSummary.readyWithoutOperatorKit.push({
          animationId: pilot.id,
          requirementId: requirement.requirementId,
          status: traceSpec.status,
          traceSpec: {file: traceSpec.file, sha256: traceSpec.sha256},
          blocker: "No current operator kit; the source-driven factory requires the named-human GUI sandbox smoke approval recorded by its contract before this family can be admitted.",
        });
      }
    }
    pilots.push(pilotSummary);
  }

  for (const [key, traceSpec] of indexed) invariant(coverageRequirementKeys.has(key), `${traceSpec.animationId}/${traceSpec.requirementId}: indexed trace spec has no coverage-v2 requirement`);
  const readyTraceSpecs = [...indexed.values()].filter(({status}) => status === ROOT_CAPTURE_READY || status === NATURAL_EXECUTION_READY);
  const readyTraceSpecsWithoutOperatorKit = pilots.flatMap(({readyWithoutOperatorKit}) => readyWithoutOperatorKit);
  const sourceDrivenPreflightGaps = await inspectSourceDrivenPreflightGaps({root, readyTraceSpecsWithoutOperatorKit});
  const traceExecutionReportsPresent = [...indexed.values()].filter(({executionReport}) => executionReport).map(({animationId, requirementId, executionReport}) => ({animationId, requirementId, executionReport}));
  return {
    indexes,
    summary: {
      allCoverageRequirements,
      coverageRequirements: totalCoverageRequirements,
      indexedTraceSpecs: indexed.size,
      coverageRequirementsWithoutIndexedTraceSpec: coverageRequirementsWithoutIndexedTraceSpec.length,
      supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex: supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex.length,
      traceSpecStatusCounts: sortedCountObject(traceSpecStatusCounts),
      sourceReadyTraceSpecs: readyTraceSpecs.length,
      sourceReadyTraceSpecsWithOperatorKit: readyTraceSpecs.length - readyTraceSpecsWithoutOperatorKit.length,
      sourceReadyTraceSpecsWithoutOperatorKit: readyTraceSpecsWithoutOperatorKit.length,
      unresolvedTraceSpecs: traceSpecStatusCounts.unresolved || 0,
      operatorKitBindings: kitByRequirement.size,
      baselineAuthorityCounts: sortedCountObject(baselineAuthorityCounts),
      resolvedBaselineAuthorityRequirements,
      baselineCaptureManifestDeclaredCount,
      metricsFileDeclaredCount,
      traceExecutionReportsPresent: traceExecutionReportsPresent.length,
      strictAcceptanceEffect: false,
    },
    pilots,
    readyTraceSpecsWithoutOperatorKit,
    coverageRequirementsWithoutIndexedTraceSpec,
    supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex,
    sourceDrivenPreflightGaps,
    traceExecutionReportsPresent,
    authorityStatement: "A ready trace specification and an empty operator kit are execution preparation only. Neither is an original-runtime run, baseline image, RMSE result, human review, owner decision, or strict acceptance.",
    strictAcceptanceEffect: false,
  };
}

async function inspectAuthoring(root) {
  const reportFile = path.join(root, "reports", "pilot-animate-authoring-audit.json");
  const report = await readHashedJson(reportFile);
  invariant(report.value.summary?.pilots === 16, "Animate authoring index must cover 16 pilots");
  invariant(report.value.summary?.flaBacked === 8 && report.value.summary?.verifiedAuthoringAudits === 8, "Eight FLA-backed pilots must have verified authoring audits");
  invariant(report.value.summary?.pendingAuthoringAudits === 0, "No pilot authoring audit may remain pending");
  const audits = [];
  for (const pilot of report.value.pilots) {
    if (!pilot.authoringAudit) continue;
    const file = path.join(root, pilot.authoringAudit.file);
    const descriptor = await fileDescriptor(root, file);
    invariant(descriptor.sha256 === pilot.authoringAudit.sha256, `${pilot.animationId}: authoring audit hash drift`);
    audits.push({
      animationId: pilot.animationId,
      status: pilot.status,
      audit: descriptor,
      authoringFrame: pilot.authoringAudit.authoringFrame,
      readOnlyWorkingCopy: pilot.workingCopy,
    });
  }
  return {
    index: {file: projectRelative(root, reportFile), ...report.descriptor},
    summary: report.value.summary,
    animateProbe: report.value.animateProbe,
    audits,
    remainingLegacyFlaPopupAcknowledgements: 0,
    nextAction: "Do not reopen any pilot FLA unless the current schema-v2 authoring binding becomes stale.",
    strictAcceptanceEffect: false,
  };
}

async function jsonFilesIfPresent(directory) {
  if (!(await exists(directory))) return [];
  return (await readdir(directory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map(({name}) => name)
    .sort(compareCodeUnits);
}

async function collectFilesIfPresent(root, directory) {
  if (!(await exists(directory))) return [];
  return (await walkFiles(root, directory)).map((item) => ({...item, file: `${projectRelative(root, directory)}/${item.file}`}));
}

async function collectFilesFromPendingDirectories(root, directory) {
  if (!(await exists(directory))) return [];
  const files = [];
  async function visit(current) {
    const entries = await readdir(current, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => compareCodeUnits(left.name, right.name))) {
      if (!entry.isDirectory()) continue;
      const child = path.join(current, entry.name);
      if (entry.name.startsWith("pending-human-owner")) files.push(...await collectFilesIfPresent(root, child));
      else await visit(child);
    }
  }
  await visit(directory);
  return files;
}

async function inspectPendingOriginalRuntimeCandidates(root) {
  const files = [];
  for (const pilot of PILOT_MIGRATIONS) {
    for (const name of ["pending-root-capture", "pending-natural-trace-capture", "pending-source-driven-branch-capture"]) {
      files.push(...await collectFilesIfPresent(root, path.join(root, "migrations", pilot.id, "evidence", name)));
    }
  }
  files.push(...await collectFilesFromPendingDirectories(root, path.join(root, "artifacts", "full-frame", "pilot-baselines")));
  files.sort((left, right) => compareCodeUnits(left.file, right.file));
  return {
    fileCount: files.length,
    treeSha256: sha256(canonicalJson(files)),
    files,
    note: "Pending candidates are non-authoritative even when present; current canonical promotion remains hard-disabled.",
    strictAcceptanceEffect: false,
  };
}

async function inspectPilotHumanGates(root) {
  const pilots = [];
  for (const pilot of PILOT_MIGRATIONS) {
    const migrationFile = path.join(root, "migrations", pilot.id, "migration.json");
    const migration = await readHashedJson(migrationFile);
    const value = migration.value;
    const audioAcceptanceFile = path.join(root, "migrations", pilot.id, "evidence", "audio-listening-acceptance.json");
    const audioAcceptance = await exists(audioAcceptanceFile) ? await readHashedJson(audioAcceptanceFile) : null;
    const listeningSessions = await jsonFilesIfPresent(path.join(root, "migrations", pilot.id, "evidence", "audio-listening-sessions"));
    const runtimeSessions = await jsonFilesIfPresent(path.join(root, "migrations", pilot.id, "evidence", "audio-runtime-sessions"));
    const reviewInputs = await jsonFilesIfPresent(path.join(root, "migrations", pilot.id, "evidence", "review-inputs"));
    const humanRecords = await jsonFilesIfPresent(path.join(root, "migrations", pilot.id, "evidence", "reviews", "human"));
    const ownerRecords = await jsonFilesIfPresent(path.join(root, "migrations", pilot.id, "evidence", "reviews", "owner"));
    pilots.push({
      animationId: pilot.id,
      migration: {file: projectRelative(root, migrationFile), ...migration.descriptor},
      audio: {
        required: value.audio?.required === true,
        declaredCueCount: Array.isArray(value.audio?.cues) ? value.audio.cues.length : 0,
        acceptance: audioAcceptance ? {file: projectRelative(root, audioAcceptanceFile), ...audioAcceptance.descriptor, status: audioAcceptance.value.status, cueReviewCount: audioAcceptance.value.cueReviews?.length || 0} : null,
        listeningSessionFiles: listeningSessions,
        runtimeSessionFiles: runtimeSessions,
      },
      humanVisualReview: {
        decision: value.acceptance?.humanVisualReview?.decision || null,
        reviewInputFiles: reviewInputs,
        recordFiles: humanRecords,
      },
      ownerReview: {
        decision: value.acceptance?.ownerReview?.decision || null,
        recordFiles: ownerRecords,
      },
    });
  }
  const audioRequired = pilots.filter(({audio}) => audio.required);
  const audioTemplates = pilots.filter(({audio}) => audio.acceptance);
  const totalCueReviews = audioTemplates.reduce((sum, {audio}) => sum + audio.acceptance.cueReviewCount, 0);
  return {
    summary: {
      pilots: pilots.length,
      audioRequiredPilots: audioRequired.length,
      audioNotRequiredPilots: pilots.length - audioRequired.length,
      audioAcceptanceTemplates: audioTemplates.length,
      audioCueReviewsPending: totalCueReviews,
      audioListeningSessionsPresent: pilots.reduce((sum, {audio}) => sum + audio.listeningSessionFiles.length, 0),
      audioRuntimeSessionArtifactsPresent: pilots.reduce((sum, {audio}) => sum + audio.runtimeSessionFiles.length, 0),
      audioRequiredWithoutStableCueTemplate: audioRequired.filter(({audio}) => !audio.acceptance).map(({animationId}) => animationId),
      humanVisualReviewsAccepted: pilots.filter(({humanVisualReview}) => humanVisualReview.decision === "accepted" && humanVisualReview.recordFiles.length > 0).length,
      ownerReviewsAccepted: pilots.filter(({ownerReview}) => ownerReview.decision === "accepted" && ownerReview.recordFiles.length > 0).length,
      reviewInputsPresent: pilots.reduce((sum, {humanVisualReview}) => sum + humanVisualReview.reviewInputFiles.length, 0),
      humanReviewRecordsPresent: pilots.reduce((sum, {humanVisualReview}) => sum + humanVisualReview.recordFiles.length, 0),
      ownerReviewRecordsPresent: pilots.reduce((sum, {ownerReview}) => sum + ownerReview.recordFiles.length, 0),
    },
    pilots,
    strictAcceptanceEffect: false,
  };
}

function manualObligations(kits, humanGates) {
  const rootKits = kits.kits.filter(({classification}) => classification === "course-root-linear" || classification === "legacy-root-linear");
  const naturalKits = kits.kits.filter(({classification}) => classification === "course-natural" || classification === "legacy-natural");
  const sourceDrivenKits = kits.kits.filter(({classification}) => classification === "source-driven");
  return {
    note: "Counts are evidence obligations, not necessarily additive operator sessions. A same-session artifact may satisfy more than one schema only when every schema independently validates it.",
    legacyFlaPopupAcknowledgementsRemaining: 0,
    projectorFileOpenRequirementsPrepared: rootKits.length + naturalKits.length,
    rootCaptureRequirementsPrepared: rootKits.length,
    courseRootCaptureRequirementsPrepared: rootKits.filter(({classification}) => classification === "course-root-linear").length,
    legacyRootCaptureRequirementsPrepared: rootKits.filter(({classification}) => classification === "legacy-root-linear").length,
    naturalTraceRequirementsPreparedButRequiringAuthoritativeDisposableEnvironment: naturalKits.length,
    sourceDrivenBranchRequirementsPreparedButMissingReviewedLauncher: sourceDrivenKits.length,
    audioCueReviewsPending: humanGates.summary.audioCueReviewsPending,
    audioRequiredPilotBlockedBeforeCueTemplate: humanGates.summary.audioRequiredWithoutStableCueTemplate,
    humanVisualReviewDecisionsPending: 16 - humanGates.summary.humanVisualReviewsAccepted,
    ownerDecisionsPending: 16 - humanGates.summary.ownerReviewsAccepted,
  };
}

export async function buildReport({root = PROJECT_ROOT} = {}) {
  const [script, authoring, kits, humanGates, pendingCandidates] = await Promise.all([
    fileDescriptor(root, path.join(root, "scripts", "build-pilot-original-runtime-operator-readiness.mjs")),
    inspectAuthoring(root),
    inspectCurrentOperatorKits({root}),
    inspectPilotHumanGates(root),
    inspectPendingOriginalRuntimeCandidates(root),
  ]);
  const originalRuntimeRequirements = await inspectOriginalRuntimeRequirementReadiness({root, kits});
  const projectorHashes = [...new Set(kits.kits.map(({runtime}) => runtime.executableSha256))];
  invariant(projectorHashes.length === 1, "All operator kits must bind one Projector executable hash");
  const projector = kits.kits[0].runtime;
  return {
    schemaVersion: 2,
    evidenceKind: "pilot-original-runtime-operator-readiness-index",
    generatedBy: script,
    snapshotContract: "deterministic-content-addressed-no-wall-clock",
    scope: "Acceptance-neutral operator readiness for the current 16 pilots. This is not original-runtime evidence or a human/owner decision.",
    authorityBoundary: {
      sourceAndKitIntegrityCheck: true,
      authoringStructureCoverageIndex: true,
      originalRuntimeExecuted: false,
      authoritativeBaselineCaptured: false,
      audioListeningAccepted: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptanceEffect: false,
    },
    runtime: {
      adobeProjector: projector,
      adobeAnimate: {
        executablePath: authoring.animateProbe.executable,
        executableSha256: authoring.animateProbe.executableSha256,
        version: authoring.animateProbe.animateVersion,
      },
    },
    summary: {
      pilots: 16,
      flaBackedPilots: authoring.summary.flaBacked,
      currentAuthoringAudits: authoring.summary.verifiedAuthoringAudits,
      remainingLegacyFlaPopupAcknowledgements: authoring.remainingLegacyFlaPopupAcknowledgements,
      operatorKits: kits.counts,
      allOperatorKitsEmptyUnsignedTemplates: kits.kits.every(({payload}) => payload.emptyUnsignedTemplateOnly),
      operatorKitPngFiles: kits.kits.reduce((sum, {payload}) => sum + payload.pngCount, 0),
      operatorKitFramePayloadFiles: kits.kits.reduce((sum, {payload}) => sum + payload.framePayloadCount, 0),
      operatorKitNonTemplateSessionArtifacts: kits.kits.reduce((sum, {payload}) => sum + payload.nonTemplateSessionArtifactCount, 0),
      pendingOriginalRuntimeCandidateFiles: pendingCandidates.fileCount,
      originalRuntimeRequirements: originalRuntimeRequirements.summary,
      ...humanGates.summary,
      strictAcceptanceEffect: false,
    },
    authoring,
    originalRuntimeRequirements,
    operatorKits: kits.kits,
    pendingOriginalRuntimeCandidates: pendingCandidates,
    humanGates,
    manualObligations: manualObligations(kits, humanGates),
    minimumNextNamedHumanOperation: {
      recommendedRequirement: "course-g04-l03-in-009 / req:root:root-standalone:en",
      reason: "Ten-frame G4 L3 IN009 root requirement is the smallest currently prepared root session aligned with the first full-lesson target.",
      operatorCard: "work/root-capture-kits/course-g04-l03-in-009/req-root-root-standalone-en/OPERATOR_CARD.md",
      kitCheckCommand: "node scripts/scaffold-root-capture-kit.mjs --check --spec migrations/course-g04-l03-in-009/audit/trace-specs/req-root-root-standalone-en.json",
      steps: [
        "Save the exact JSON kit-check output outside the immutable kit.",
        "The named human starts the checked empty-Projector launcher; no SWF argument is permitted.",
        "The named human personally uses File -> Open File... and selects runtime-source/source.swf from the kit.",
        "Record the real PID/start time, GUI-open time, selected staged path/hash, and playerWindowObserved=true in a same-session launch receipt.",
        "Use one declared exhaustive proof mode for root frames 1..10 and record every 800x600 PNG plus both append-only log chains.",
        "The same named operator signs the session attestation after capture; keep all completed artifacts outside the immutable kit.",
        "Prepare only a pending candidate. Canonical original-runtime promotion remains hard-disabled.",
      ],
      prohibited: [
        "Do not reopen or save a pilot FLA.",
        "Do not pass the SWF on the Projector command line or open it through Finder, open, or LaunchServices.",
        "Do not fill a human identity before the real same-session observation.",
        "Do not treat launcher output, PID, templates, Ruffle, or JavaScript output as original-runtime evidence.",
      ],
      strictAcceptanceEffect: false,
    },
    currentMachineOnlyClosureBoundary: {
      authoritativeRuntimeSessionsMachineCreatableWithoutNamedHuman: 0,
      sourceReadyTraceSpecsWithoutOperatorKit: originalRuntimeRequirements.summary.sourceReadyTraceSpecsWithoutOperatorKit,
      unresolvedTraceSpecifications: originalRuntimeRequirements.summary.unresolvedTraceSpecs,
      coverageRequirementsWithoutIndexedTraceSpec: originalRuntimeRequirements.summary.coverageRequirementsWithoutIndexedTraceSpec,
      supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex: originalRuntimeRequirements.summary.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex,
      note: "All deterministic integrity and current-binding checks available to this readiness factory pass. The remaining authority transitions require source-evidenced schedule resolution, a specifically approved GUI sandbox/controller, a real named-human Projector session, or later human/owner decisions; this report cannot perform or impersonate them.",
      strictAcceptanceEffect: false,
    },
  };
}

export function renderMarkdown(report) {
  const lines = [
    "# 16 pilots original-runtime operator readiness",
    "",
    `This is an acceptance-neutral, content-addressed readiness index. **Strict acceptance effect: ${report.authorityBoundary.strictAcceptanceEffect}.**`,
    "",
    "## Current result",
    "",
    `- Adobe Animate authoring audits: ${report.summary.currentAuthoringAudits}/${report.summary.flaBackedPilots} current; remaining legacy-FLA popup acknowledgements: ${report.summary.remainingLegacyFlaPopupAcknowledgements}.`,
    `- Root kits: ${report.summary.operatorKits.courseRootLinear} course-indexed + ${report.summary.operatorKits.legacyRootLinear} legacy linear = ${report.manualObligations.rootCaptureRequirementsPrepared}.`,
    `- Natural kits: ${report.summary.operatorKits.courseNatural} course + ${report.summary.operatorKits.legacyNatural} legacy = ${report.manualObligations.naturalTraceRequirementsPreparedButRequiringAuthoritativeDisposableEnvironment}.`,
    `- TI source-driven kits: ${report.summary.operatorKits.sourceDriven}; both require a separately reviewed controller/environment before a real session.`,
    `- All ${report.summary.operatorKits.total} kits are unsigned empty templates: ${report.summary.allOperatorKitsEmptyUnsignedTemplates}; PNG ${report.summary.operatorKitPngFiles}, frame payload ${report.summary.operatorKitFramePayloadFiles}, non-template session artifacts ${report.summary.operatorKitNonTemplateSessionArtifacts}.`,
    `- Pending root/natural/source-driven candidate files outside the kits: ${report.summary.pendingOriginalRuntimeCandidateFiles}.`,
    `- Coverage-v2 rows: ${report.summary.originalRuntimeRequirements.allCoverageRequirements}; strict/full-domain original-runtime obligations: ${report.summary.originalRuntimeRequirements.coverageRequirements}; indexed trace specs: ${report.summary.originalRuntimeRequirements.indexedTraceSpecs}; supplemental partial-path rows intentionally excluded from trace authority: ${report.summary.originalRuntimeRequirements.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex}.`,
    `- Source-ready trace specs: ${report.summary.originalRuntimeRequirements.sourceReadyTraceSpecs}; ready with a current kit: ${report.summary.originalRuntimeRequirements.sourceReadyTraceSpecsWithOperatorKit}.`,
    `- Still upstream of a runnable kit: ${report.summary.originalRuntimeRequirements.unresolvedTraceSpecs} unresolved trace specs, ${report.summary.originalRuntimeRequirements.sourceReadyTraceSpecsWithoutOperatorKit} ready specs without a kit, and ${report.summary.originalRuntimeRequirements.coverageRequirementsWithoutIndexedTraceSpec} coverage requirement without an indexed trace spec.`,
    `- Canonical authority evidence declared by coverage: resolved baseline authorities ${report.summary.originalRuntimeRequirements.resolvedBaselineAuthorityRequirements}, original-runtime baseline manifests ${report.summary.originalRuntimeRequirements.baselineCaptureManifestDeclaredCount}, metrics files ${report.summary.originalRuntimeRequirements.metricsFileDeclaredCount}; indexed trace execution reports present ${report.summary.originalRuntimeRequirements.traceExecutionReportsPresent}.`,
    `- Audio: ${report.summary.audioRequiredPilots} pilots require listening; ${report.summary.audioAcceptanceTemplates} unsigned templates contain ${report.summary.audioCueReviewsPending} pending cue reviews; current listening sessions: ${report.summary.audioListeningSessionsPresent}.`,
    `- Human visual review: ${report.summary.humanVisualReviewsAccepted}/16 accepted; owner: ${report.summary.ownerReviewsAccepted}/16 accepted.`,
    "",
    "## Runtime bindings",
    "",
    `- Projector ${report.runtime.adobeProjector.version}: \`${report.runtime.adobeProjector.executablePath}\``,
    `  SHA-256: \`${report.runtime.adobeProjector.executableSha256}\``,
    `- Animate ${report.runtime.adobeAnimate.version}: \`${report.runtime.adobeAnimate.executablePath}\``,
    `  SHA-256: \`${report.runtime.adobeAnimate.executableSha256}\``,
    "",
    "## Prepared operator kits",
    "",
    "| Class | Animation / requirement | Lang | Range | Path | Human launch readiness |",
    "|---|---|---:|---:|---|---|",
  ];
  for (const kit of report.operatorKits) {
    const range = kit.requiredRange ? `${kit.requiredRange.firstFrame}-${kit.requiredRange.lastFrame}` : "-";
    const readiness = kit.launchReadiness.candidateWorkflowPreparedWithBundledLauncher ? "named-human File -> Open prepared" : kit.launchReadiness.operatorLauncherIncluded ? "needs authoritative disposable environment" : "needs reviewed controller/launcher";
    lines.push(`| ${kit.classification} | \`${kit.animationId}\` / \`${kit.requirementId}\` | ${kit.language || "-"} | ${range} | \`${kit.directory}\` | ${readiness} |`);
  }
  lines.push(
    "",
    "## Requirement reconciliation",
    "",
    "| Animation | All coverage | Original-runtime obligations | Supplemental partial | Indexed specs | Root-ready | Natural-ready | Unresolved | Ready with kit | Ready without kit | Missing spec | Resolved baseline |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );
  for (const pilot of report.originalRuntimeRequirements.pilots) {
    lines.push(`| \`${pilot.animationId}\` | ${pilot.coverageRequirementCount} | ${pilot.originalRuntimeObligationCount} | ${pilot.supplementalPartialRequirementCount} | ${pilot.indexedTraceSpecCount} | ${pilot.rootCaptureReadyCount} | ${pilot.naturalExecutionReadyCount} | ${pilot.unresolvedTraceSpecCount} | ${pilot.readyWithOperatorKitCount} | ${pilot.readyWithoutOperatorKit.length} | ${pilot.coverageRequirementsWithoutIndexedTraceSpec.length} | ${pilot.resolvedBaselineAuthorityCount} |`);
  }
  lines.push(
    "",
    "Source-ready specifications without a current kit:",
    "",
  );
  if (report.originalRuntimeRequirements.readyTraceSpecsWithoutOperatorKit.length === 0) lines.push("- none");
  else for (const item of report.originalRuntimeRequirements.readyTraceSpecsWithoutOperatorKit) lines.push(`- \`${item.animationId}\` / \`${item.requirementId}\`: ${item.blocker}`);
  lines.push(
    "",
    "Coverage requirements without an indexed trace specification:",
    "",
  );
  if (report.originalRuntimeRequirements.coverageRequirementsWithoutIndexedTraceSpec.length === 0) lines.push("- none");
  else for (const item of report.originalRuntimeRequirements.coverageRequirementsWithoutIndexedTraceSpec) lines.push(`- \`${item.animationId}\` / \`${item.requirementId}\` (${item.coverageRole || "role not declared"}): ${item.reason}.`);
  lines.push(
    "",
    "Supplemental partial-path rows intentionally excluded from original-runtime trace authority:",
    "",
  );
  if (report.originalRuntimeRequirements.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex.length === 0) lines.push("- none");
  else for (const item of report.originalRuntimeRequirements.supplementalPartialRequirementsExcludedFromOriginalRuntimeIndex) {
    lines.push(`- \`${item.animationId}\` / \`${item.requirementId}\`: ${item.reason} Boundary: ${item.boundary}.`);
  }
  lines.push(
    "",
    "## Source-driven preflight gaps",
    "",
  );
  if (report.originalRuntimeRequirements.sourceDrivenPreflightGaps.length === 0) lines.push("- none");
  for (const gap of report.originalRuntimeRequirements.sourceDrivenPreflightGaps) {
    lines.push(
      `### \`${gap.animationId}\``,
      "",
      `- Current status: \`${gap.status}\`; strict acceptance effect: \`${gap.strictAcceptanceEffect}\`.`,
      `- Bound fixture: \`${gap.fixture.manifest.file}\` (manifest SHA-256 \`${gap.fixture.manifest.sha256}\`; content-addressed fixture digest \`${gap.fixture.fixtureDigest}\`).`,
      `- Required named-human smoke record: \`${gap.fixture.requiredApproval.file}\`; present: \`${gap.fixture.requiredApproval.present}\`.`,
      `- No GUI smoke, runtime launch, child load, frame capture, or human action is recorded as completed by this readiness report.`,
      `- Unbound files already in \`capture/\`: ${gap.fixture.unboundCaptureFiles.length}. They do not satisfy the gate without the named-human record.`,
    );
    for (const file of gap.fixture.unboundCaptureFiles) lines.push(`- Unbound capture file: \`${file.file}\` (SHA-256 \`${file.sha256}\`; ${file.bytes} bytes).`);
    lines.push(
      `- Verify fixture: \`${gap.exactRunbook.fixtureIntegrityCheck}\``,
      `- Named-human smoke launcher: \`${gap.exactRunbook.namedHumanSmokeLauncher}\` — ${gap.exactRunbook.namedHumanRule}`,
      `- Human record template: \`${gap.exactRunbook.humanRecordTemplate}\``,
      `- After the human record exists, run the read-only gate check: \`${gap.exactRunbook.postRecordReadOnlyCheck}\``,
      `- Later engineering review: ${gap.exactRunbook.laterEngineeringReview}`,
      "",
      "The two kit scaffold commands remain intentionally ineligible until that separate human and engineering gate is complete:",
      "",
    );
    for (const command of gap.exactRunbook.laterKitScaffoldCommands) lines.push(`- \`${command}\``);
  }
  lines.push(
    "",
    "## Minimum next named-human operation",
    "",
    `Start with \`${report.minimumNextNamedHumanOperation.recommendedRequirement}\`.`,
    "",
    `Operator card: \`${report.minimumNextNamedHumanOperation.operatorCard}\``,
    "",
  );
  report.minimumNextNamedHumanOperation.steps.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  lines.push("", "Prohibited:", "");
  report.minimumNextNamedHumanOperation.prohibited.forEach((step) => lines.push(`- ${step}`));
  lines.push(
    "",
    "## Later human gates",
    "",
    `- Audio listening obligations: ${report.manualObligations.audioCueReviewsPending} currently declared cues across ${report.summary.audioAcceptanceTemplates} pilots. \`${report.manualObligations.audioRequiredPilotBlockedBeforeCueTemplate.join(", ") || "none"}\` remains blocked before a stable cue template.`,
    `- Human all-diff visual decisions pending: ${report.manualObligations.humanVisualReviewDecisionsPending}. Review inputs currently present: ${report.summary.reviewInputsPresent}.`,
    `- Owner decisions pending: ${report.manualObligations.ownerDecisionsPending}. Owner records currently present: ${report.summary.ownerReviewRecordsPresent}.`,
    "",
    "Do not start visual/owner signing until every upstream technical gate is current and the immutable review inputs exist.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

export async function materializeReport({root = PROJECT_ROOT, jsonPath = DEFAULT_JSON, markdownPath = DEFAULT_MARKDOWN, check = false} = {}) {
  const report = await buildReport({root});
  const jsonBytes = prettyJson(report);
  const markdownBytes = renderMarkdown(report);
  if (check) {
    const [currentJson, currentMarkdown] = await Promise.all([readFile(jsonPath, "utf8"), readFile(markdownPath, "utf8")]);
    invariant(currentJson === jsonBytes, `${displayPath(root, jsonPath)} is stale`);
    invariant(currentMarkdown === markdownBytes, `${displayPath(root, markdownPath)} is stale`);
    return report;
  }
  await Promise.all([mkdir(path.dirname(jsonPath), {recursive: true}), mkdir(path.dirname(markdownPath), {recursive: true})]);
  await Promise.all([writeFile(jsonPath, jsonBytes), writeFile(markdownPath, markdownBytes)]);
  return report;
}

function parseArguments(argv) {
  const options = {check: false, jsonPath: DEFAULT_JSON, markdownPath: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.jsonPath = path.resolve(argv[++index]);
    else if (argument === "--markdown") options.markdownPath = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const report = await materializeReport(options);
    process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${displayPath(PROJECT_ROOT, options.jsonPath)} and ${displayPath(PROJECT_ROOT, options.markdownPath)}; kits=${report.summary.operatorKits.total}, PNG=${report.summary.operatorKitPngFiles}, sessions=${report.summary.operatorKitNonTemplateSessionArtifacts}, strictAcceptanceEffect=false\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
