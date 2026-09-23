#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  scenarioInventorySha256,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  canonicalJson,
  selectTraceLessonRelease,
} from "./build-course-trace-specs.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,127}$/;
const SAFE_DOMAIN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const PRESERVED_SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const COVERAGE_RELATIVE_PATH = "evidence/full-frame-coverage.json";
const SCENARIO_RELATIVE_PATH = "audit/scenario-inventory.json";
const DISPOSITION_RELATIVE_PATH = "audit/frame-domain-disposition.json";
const CAPTURE_CONTRACT = Object.freeze({
  frameParameter: "frame",
  frameDomainParameter: "frameDomain",
  requirementIdParameter: "requirementId",
  traceParameter: "trace",
  entryStateSha256Parameter: "entryStateSha256",
  scenarioParameter: "scenario",
  languageParameter: "lang",
  seedParameter: "seed",
  frameAttribute: "data-flash-frame",
  animationIdAttribute: "data-animation-id",
  frameDomainAttribute: "data-flash-frame-domain",
  requirementIdAttribute: "data-flash-requirement-id",
  traceAttribute: "data-flash-trace-id",
  entryStateSha256Attribute: "data-flash-entry-state-sha256",
});
const REQUIREMENT_CAPTURE_FIELDS = Object.freeze([
  "capturedFrameCount",
  "missingFrames",
  "baselineCaptureManifest",
  "baselineCaptureManifestSha256",
  "captureManifest",
  "captureManifestSha256",
  "metricsFile",
  "metricsSha256",
]);
const REQUIREMENT_REFRESHABLE_FIELDS = new Set([
  "status",
  "blockingReason",
  "blockingEvidence",
  "strictAcceptanceEffect",
  "planningAuthority",
]);
const ALLOWED_COVERAGE_KEYS = new Set([
  "schemaVersion",
  "animationId",
  "materialization",
  "requirements",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function equalCanonical(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function projectRelative(root, candidate, label) {
  const relative = portable(path.relative(root, candidate));
  invariant(
    relative &&
      relative !== ".." &&
      !relative.startsWith("../") &&
      !path.isAbsolute(relative),
    `${label} must stay inside the project root`,
  );
  return relative;
}

function containedPath(root, candidate, label, {allowRoot = false} = {}) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolved);
  invariant(
    (allowRoot && relative === "") ||
      (relative &&
        relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)),
    `${label} must stay inside ${resolvedRoot}`,
  );
  return resolved;
}

function assertSafeId(value, label) {
  invariant(
    SAFE_ID_PATTERN.test(value || ""),
    `${label} is not a safe catalog ID: ${value}`,
  );
}

function assertSafeDomainId(value, label) {
  invariant(
    SAFE_DOMAIN_ID_PATTERN.test(value || ""),
    `${label} is not a stable frame-domain/scenario ID`,
  );
}

function assertSha256(value, label) {
  invariant(
    SHA256_PATTERN.test(value || ""),
    `${label} must be a lowercase SHA-256`,
  );
}

function assertPositiveNumber(value, label) {
  invariant(
    typeof value === "number" && Number.isFinite(value) && value > 0,
    `${label} must be a positive finite number`,
  );
}

function assertPositiveInteger(value, label) {
  invariant(
    Number.isSafeInteger(value) && value > 0,
    `${label} must be a positive safe integer`,
  );
}

function parseJson(snapshot, label) {
  try {
    return JSON.parse(snapshot.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

async function assertDirectory(candidate, containmentRoot, label) {
  const resolved = containedPath(containmentRoot, candidate, label, {
    allowRoot: true,
  });
  const information = await lstat(resolved);
  invariant(
    information.isDirectory() && !information.isSymbolicLink(),
    `${label} must be a real non-symlink directory`,
  );
  const [physicalRoot, physicalCandidate] = await Promise.all([
    realpath(containmentRoot),
    realpath(resolved),
  ]);
  containedPath(physicalRoot, physicalCandidate, `Physical ${label}`, {
    allowRoot: true,
  });
  invariant(
    path.resolve(physicalCandidate) === path.resolve(resolved),
    `${label} must not traverse a symlinked directory`,
  );
  return resolved;
}

async function readStableOrdinaryFile(candidate, containmentRoot, label) {
  const resolved = containedPath(containmentRoot, candidate, label);
  const information = await lstat(resolved);
  invariant(
    information.isFile() && !information.isSymbolicLink(),
    `${label} must be an ordinary non-symlink file`,
  );
  invariant(
    information.nlink === 1,
    `${label} must have exactly one hard link`,
  );
  const [physicalRoot, physicalCandidate] = await Promise.all([
    realpath(containmentRoot),
    realpath(resolved),
  ]);
  containedPath(physicalRoot, physicalCandidate, `Physical ${label}`);
  invariant(
    path.resolve(physicalCandidate) === path.resolve(resolved),
    `${label} must not traverse a symlinked path`,
  );
  const bytes = await readFile(resolved);
  return {
    path: resolved,
    bytes,
    sha256: digest(bytes),
    device: information.dev,
    inode: information.ino,
    mode: information.mode,
    mtimeMs: information.mtimeMs,
    size: information.size,
  };
}

function sameSnapshot(left, right) {
  return (
    left.path === right.path &&
    left.device === right.device &&
    left.inode === right.inode &&
    left.mode === right.mode &&
    left.mtimeMs === right.mtimeMs &&
    left.size === right.size &&
    left.sha256 === right.sha256
  );
}

async function assertSnapshotCurrent(snapshot, containmentRoot, label) {
  const current = await readStableOrdinaryFile(
    snapshot.path,
    containmentRoot,
    label,
  );
  invariant(sameSnapshot(snapshot, current), `${label} changed after preflight`);
}

function mergeReadSet(records) {
  const byPath = new Map();
  for (const record of records) {
    const prior = byPath.get(record.snapshot.path);
    if (prior) {
      invariant(
        sameSnapshot(prior.snapshot, record.snapshot),
        `${record.label} changed during preflight`,
      );
      continue;
    }
    byPath.set(record.snapshot.path, record);
  }
  return [...byPath.values()];
}

async function assertReadSetCurrent(readSet) {
  for (const record of readSet) {
    await assertSnapshotCurrent(
      record.snapshot,
      record.containmentRoot,
      record.label,
    );
  }
}

function rawBinding(root, snapshot, extra = {}) {
  return {
    path: projectRelative(root, snapshot.path, "Evidence path"),
    bytes: snapshot.bytes.length,
    sha256: snapshot.sha256,
    ...extra,
  };
}

function catalogRelativeSourcePath(value) {
  const normalized = portable(value || "");
  if (!normalized.startsWith(PRESERVED_SOURCE_PREFIX)) return "";
  return normalized.slice(PRESERVED_SOURCE_PREFIX.length);
}

function releaseIdentity(release) {
  return release.members.map((member) => ({
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    sourcePath: member.source.path,
    sourceSha256: member.source.sha256,
  }));
}

function validateManifest({id, manifest, member}) {
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.id === id &&
      manifest.animationId === id,
    `${id}: migration manifest identity/schema drifted`,
  );
  invariant(
    manifest.assetId === member.assetId,
    `${id}: migration assetId differs from the release member`,
  );
  invariant(
    manifest.source?.swfSha256 === member.source.sha256 &&
      catalogRelativeSourcePath(manifest.source.swf) === member.source.path,
    `${id}: migration source SWF path/hash differs from the release member`,
  );
  if (manifest.source.placementPath) {
    invariant(
      catalogRelativeSourcePath(manifest.source.placementPath) ===
        member.source.path,
      `${id}: migration placementPath differs from the release member`,
    );
  }

  const stage = manifest.runtime?.stage;
  assertPositiveNumber(stage?.width, `${id}: runtime.stage.width`);
  assertPositiveNumber(stage?.height, `${id}: runtime.stage.height`);
  assertPositiveInteger(
    manifest.runtime?.frameCount,
    `${id}: runtime.frameCount`,
  );
  invariant(
    manifest.implementation?.defaultFrameDomainId === "root",
    `${id}: default frame domain must remain root`,
  );
  invariant(
    equalCanonical(
      manifest.implementation?.captureContract,
      CAPTURE_CONTRACT,
    ),
    `${id}: capture contract is not the canonical deterministic contract; regenerate scenario/disposition evidence after any manifest repair`,
  );

  const domains = manifest.implementation?.frameDomains;
  invariant(
    Array.isArray(domains) && domains.length > 0,
    `${id}: implementation.frameDomains must be non-empty`,
  );
  const domainIds = new Set();
  for (const [index, domain] of domains.entries()) {
    assertSafeDomainId(domain?.id, `${id}: frameDomains[${index}].id`);
    invariant(
      !domainIds.has(domain.id),
      `${id}: duplicate frame domain ${domain.id}`,
    );
    domainIds.add(domain.id);
    invariant(
      domain.kind === "root" || domain.kind === "nested",
      `${id}/${domain.id}: unsupported frame-domain kind`,
    );
    assertSafeDomainId(
      domain.sourceTimelineId,
      `${id}/${domain.id}: sourceTimelineId`,
    );
    assertPositiveInteger(
      domain.frameCount,
      `${id}/${domain.id}: frameCount`,
    );
    invariant(
      Array.isArray(domain.scenarioIds) && domain.scenarioIds.length > 0,
      `${id}/${domain.id}: scenarioIds must be non-empty`,
    );
    const scenarioIds = new Set();
    for (const scenarioId of domain.scenarioIds) {
      assertSafeDomainId(scenarioId, `${id}/${domain.id}: scenarioId`);
      invariant(
        !scenarioIds.has(scenarioId),
        `${id}/${domain.id}: duplicate scenarioId ${scenarioId}`,
      );
      scenarioIds.add(scenarioId);
    }
    if (domain.kind === "root") {
      invariant(
        index === 0 &&
          domain.id === "root" &&
          domain.sourceTimelineId === "root" &&
          domain.parentFrameDomainId === null &&
          domain.frameCount === manifest.runtime.frameCount,
        `${id}: root frame domain differs from the source root timeline`,
      );
    } else {
      invariant(
        typeof domain.parentFrameDomainId === "string" &&
          domain.parentFrameDomainId.length > 0,
        `${id}/${domain.id}: nested parentFrameDomainId is missing`,
      );
    }
  }
  invariant(
    domains.filter(({kind}) => kind === "root").length === 1,
    `${id}: exactly one root frame domain is required`,
  );
  for (const domain of domains.filter(({kind}) => kind === "nested")) {
    invariant(
      domainIds.has(domain.parentFrameDomainId),
      `${id}/${domain.id}: parent frame domain is not declared`,
    );
  }

  const scenarios = manifest.scenarios;
  invariant(
    Array.isArray(scenarios) && scenarios.length > 0,
    `${id}: manifest scenarios are missing`,
  );
  const scenarioById = new Map();
  for (const scenario of scenarios) {
    assertSafeDomainId(scenario?.id, `${id}: scenario.id`);
    invariant(
      !scenarioById.has(scenario.id),
      `${id}: duplicate scenario ${scenario.id}`,
    );
    invariant(
      typeof scenario.kind === "string" && scenario.kind.length > 0,
      `${id}/${scenario.id}: scenario.kind is missing`,
    );
    invariant(
      scenario.reachable === true,
      `${id}/${scenario.id}: a declared coverage scenario must be explicitly reachable`,
    );
    scenarioById.set(scenario.id, scenario);
  }
  for (const domain of domains) {
    for (const scenarioId of domain.scenarioIds) {
      invariant(
        scenarioById.has(scenarioId),
        `${id}/${domain.id}: unknown scenario ${scenarioId}`,
      );
    }
  }

  const languages = manifest.localization?.languages;
  invariant(
    manifest.localization?.bilingualRequired === true &&
      Array.isArray(languages) &&
      languages.length === 2 &&
      languages[0] === "en" &&
      languages[1] === "es",
    `${id}: exact ordered EN/ES localization scope is required`,
  );
  return {stage, domains, scenarioById, languages};
}

function uniqueEvidence(inventory, artifactId, id) {
  const matches = (inventory.evidenceIndex || []).filter(
    (entry) => entry?.artifactId === artifactId,
  );
  invariant(
    matches.length === 1,
    `${id}: scenario inventory must bind exactly one ${artifactId}`,
  );
  return matches[0];
}

function validateScenarioInventory({
  root,
  id,
  inventory,
  inventorySnapshot,
  manifest,
  manifestTechnicalSha256,
  member,
  catalogSnapshot,
  release,
  domains,
}) {
  invariant(
    inventory?.schemaVersion === 1 &&
      inventory.animationId === id &&
      inventory.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      inventory.migrationStatusChanged === false,
    `${id}: scenario inventory identity/status drifted`,
  );
  invariant(
    inventory.source?.swf === manifest.source.swf &&
      inventory.source?.swfSha256 === manifest.source.swfSha256 &&
      equalCanonical(inventory.source?.stage, manifest.runtime.stage) &&
      inventory.source?.fps === manifest.runtime.fps &&
      inventory.source?.rootFrameCount === manifest.runtime.frameCount,
    `${id}: scenario inventory source/runtime binding is stale`,
  );
  const sourceArtifact = uniqueEvidence(inventory, "source-swf", id);
  invariant(
    sourceArtifact.path === manifest.source.swf &&
      sourceArtifact.sha256 === member.source.sha256,
    `${id}: scenario inventory source artifact is stale`,
  );
  const manifestArtifact = uniqueEvidence(
    inventory,
    "migration-technical-contract",
    id,
  );
  invariant(
    manifestArtifact.path === "migration.json" &&
      manifestArtifact.hashMode === CANONICAL_PROJECTION_ENCODING &&
      manifestArtifact.projection === TECHNICAL_MANIFEST_PROJECTION.id &&
      manifestArtifact.sha256 === manifestTechnicalSha256,
    `${id}: scenario inventory technical-manifest binding is stale`,
  );
  const releaseArtifact = uniqueEvidence(
    inventory,
    "lesson-release-membership",
    id,
  );
  invariant(
    releaseArtifact.path === projectRelative(
      root,
      catalogSnapshot.path,
      `${id}: release catalog path`,
    ),
    `${id}: scenario inventory release-catalog path is stale`,
  );
  invariant(
    releaseArtifact.sha256 === catalogSnapshot.sha256 &&
      releaseArtifact.bytes === catalogSnapshot.bytes.length &&
      releaseArtifact.releaseId === release.releaseId &&
      releaseArtifact.publicationMode === "atomic" &&
      releaseArtifact.expectedMemberCount === release.expectedCounts.members &&
      releaseArtifact.ordinal === member.ordinal &&
      releaseArtifact.animationId === id &&
      releaseArtifact.assetId === member.assetId &&
      releaseArtifact.sourcePath === member.source.path &&
      releaseArtifact.sourceSha256 === member.source.sha256,
    `${id}: scenario inventory exact release-member binding is stale`,
  );

  invariant(
    Array.isArray(inventory.timelineInventory) &&
      inventory.timelineInventory.length > 0,
    `${id}: scenario inventory timelineInventory is missing`,
  );
  for (const domain of domains) {
    const matches = inventory.timelineInventory.filter(
      (timeline) =>
        timeline.timelineId === domain.sourceTimelineId &&
        timeline.frameCount === domain.frameCount,
    );
    invariant(
      matches.length === 1,
      `${id}/${domain.id}: scenario inventory has no unique matching source timeline`,
    );
  }
  return {
    rawSha256: inventorySnapshot.sha256,
    technicalProjectionSha256: scenarioInventorySha256(inventory),
  };
}

function validateDisposition({
  root,
  id,
  disposition,
  dispositionSnapshot,
  manifest,
  manifestTechnicalSha256,
  member,
  catalogSnapshot,
  release,
  inventorySnapshot,
  domains,
}) {
  invariant(
    disposition?.schemaVersion === 1 &&
      disposition.animationId === id &&
      disposition.migrationStatusChanged === false,
    `${id}: frame-domain disposition identity/status drifted`,
  );
  invariant(
    disposition.generatedFrom?.scenarioInventory?.path ===
      SCENARIO_RELATIVE_PATH &&
      disposition.generatedFrom.scenarioInventory.sha256 ===
        inventorySnapshot.sha256,
    `${id}: frame-domain disposition does not bind the exact scenario inventory`,
  );
  invariant(
    disposition.generatedFrom?.migrationManifest?.path === "migration.json" &&
      disposition.generatedFrom.migrationManifest.hashMode ===
        CANONICAL_PROJECTION_ENCODING &&
      disposition.generatedFrom.migrationManifest.technicalProjection ===
        TECHNICAL_MANIFEST_PROJECTION.id &&
      disposition.generatedFrom.migrationManifest
        .technicalProjectionSha256 === manifestTechnicalSha256,
    `${id}: frame-domain disposition technical-manifest binding is stale`,
  );
  invariant(
    disposition.generatedFrom?.sourceSwf?.path === manifest.source.swf &&
      disposition.generatedFrom.sourceSwf.sha256 === member.source.sha256,
    `${id}: frame-domain disposition source binding is stale`,
  );
  const releaseBinding = disposition.generatedFrom?.lessonReleaseCatalog;
  invariant(
    releaseBinding?.releaseId === release.releaseId &&
      releaseBinding.path === projectRelative(
        root,
        catalogSnapshot.path,
        `${id}: release catalog path`,
      ) &&
      releaseBinding.bytes === catalogSnapshot.bytes.length &&
      releaseBinding.sha256 === catalogSnapshot.sha256 &&
      releaseBinding.member?.animationId === id &&
      releaseBinding.member.ordinal === member.ordinal &&
      releaseBinding.member.assetId === member.assetId &&
      releaseBinding.member.sourcePath === member.source.path &&
      releaseBinding.member.sourceSha256 === member.source.sha256 &&
      releaseBinding.bindingStatus === "verified-exact-release-member",
    `${id}: frame-domain disposition exact release-member binding is stale`,
  );
  invariant(
    Array.isArray(disposition.timelines) && disposition.timelines.length > 0,
    `${id}: frame-domain disposition timelines are missing`,
  );
  const allowedDispositions = new Set([
    "declared-frame-domain",
    "composite-child-with-parent",
    "independent-required",
    "nonvisual",
    "unresolved",
  ]);
  const counts = Object.fromEntries(
    [...allowedDispositions].map((name) => [name, 0]),
  );
  const timelineIds = new Set();
  for (const timeline of disposition.timelines) {
    assertSafeDomainId(
      timeline?.sourceTimelineId,
      `${id}: disposition sourceTimelineId`,
    );
    invariant(
      !timelineIds.has(timeline.sourceTimelineId),
      `${id}: duplicate disposition timeline ${timeline.sourceTimelineId}`,
    );
    timelineIds.add(timeline.sourceTimelineId);
    assertPositiveInteger(
      timeline.frameCount,
      `${id}/${timeline.sourceTimelineId}: disposition frameCount`,
    );
    invariant(
      allowedDispositions.has(timeline.disposition),
      `${id}/${timeline.sourceTimelineId}: unknown disposition ${timeline.disposition}`,
    );
    counts[timeline.disposition] += 1;
  }
  for (const [name, count] of Object.entries(counts)) {
    invariant(
      disposition.summary?.dispositionCounts?.[name] === count,
      `${id}: disposition summary count for ${name} is stale`,
    );
  }

  const declaredDomainIds = new Set(domains.map(({id: domainId}) => domainId));
  for (const domain of domains) {
    const matches = disposition.timelines.filter(
      (timeline) =>
        timeline.sourceTimelineId === domain.sourceTimelineId &&
        timeline.frameCount === domain.frameCount &&
        timeline.disposition === "declared-frame-domain" &&
        timeline.declaredFrameDomains?.some(
          (declared) =>
            declared.frameDomainId === domain.id &&
            declared.sourceTimelineId === domain.sourceTimelineId &&
            declared.frameCount === domain.frameCount,
        ),
    );
    invariant(
      matches.length === 1,
      `${id}/${domain.id}: disposition does not uniquely bind the declared frame domain`,
    );
  }
  const undeclaredIndependent = disposition.timelines.filter(
    (timeline) =>
      timeline.disposition === "independent-required" &&
      !(timeline.declaredFrameDomains || []).some((declared) =>
        declaredDomainIds.has(declared.frameDomainId),
      ),
  );
  invariant(
    undeclaredIndependent.length === 0,
    `${id}: independently required timeline(s) are absent from the manifest: ${undeclaredIndependent
      .map(({sourceTimelineId}) => sourceTimelineId)
      .join(", ")}`,
  );
  const unresolved = disposition.timelines
    .filter(({disposition: kind}) => kind === "unresolved")
    .map((timeline) => ({
      sourceTimelineId: timeline.sourceTimelineId,
      sourceObjectId: timeline.sourceObjectId ?? null,
      frameCount: timeline.frameCount,
      structuralReachability: timeline.structuralReachability,
      rootPlacementStatus: timeline.rootPlacement?.status || "unknown",
      independentFrameDomainCandidate:
        timeline.riskAssessment?.independentFrameDomainCandidate === true,
      riskLevel: timeline.riskAssessment?.level || "unknown",
    }));
  return {
    rawSha256: dispositionSnapshot.sha256,
    status: disposition.status,
    counts,
    unresolved,
  };
}

function requirementEntryState({id, releaseId, domain, scenario, language}) {
  if (domain.kind === "root" && scenario.kind === "linear") {
    return {
      kind: "initial-load",
      language,
    };
  }
  return {
    kind:
      domain.kind === "root"
        ? "declared-root-entry-unresolved"
        : "declared-domain-entry-unresolved",
    animationId: id,
    releaseId,
    frameDomainId: domain.id,
    sourceTimelineId: domain.sourceTimelineId,
    scenario: scenario.id,
    language,
    seed: "0",
    runtimeReachabilityEstablished: false,
  };
}

function requirementFor({
  id,
  releaseId,
  domain,
  scenario,
  language,
  inventoryRawSha256,
}) {
  const entryState = requirementEntryState({
    id,
    releaseId,
    domain,
    scenario,
    language,
  });
  const linearRoot = domain.kind === "root" && scenario.kind === "linear";
  const legacyRootDefault = domain.id === "root" && scenario.id === "default";
  return {
    requirementId: legacyRootDefault
      ? `req-default-root-${language}`
      : `req:${domain.id}:${scenario.id}:${language}`,
    scenario: scenario.id,
    frameDomainId: domain.id,
    traceId: legacyRootDefault
      ? `default-root-${language}`
      : `trace:${domain.id}:${scenario.id}:${language}:seed-0`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: domain.frameCount},
    entryState,
    entryStateSha256: digest(Buffer.from(canonicalJson(entryState))),
    baselineAuthorityRequirement: linearRoot
      ? "original-runtime-frame-accurate"
      : "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason:
      "Static source evidence declares this full frame domain, but no authoritative original-runtime baseline has been adopted; natural runtime reachability and schedules are not inferred.",
    blockingEvidence: [
      {
        file: SCENARIO_RELATIVE_PATH,
        sha256: inventoryRawSha256,
      },
    ],
    capturedFrameCount: 0,
    missingFrames: Array.from(
      {length: domain.frameCount},
      (_, index) => index + 1,
    ),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    strictAcceptanceEffect: "none",
    planningAuthority:
      "source-evidenced-declared-domain-only-runtime-and-acceptance-unresolved",
  };
}

export function validateCoveragePreimage({id, current, expected}) {
  invariant(
    current?.schemaVersion === 2 && current.animationId === id,
    `${id}: coverage preimage identity/schema drifted`,
  );
  for (const key of Object.keys(current)) {
    invariant(
      ALLOWED_COVERAGE_KEYS.has(key),
      `${id}: coverage preimage contains an unsupported overlay field ${key}`,
    );
  }
  invariant(
    Array.isArray(current.requirements) &&
      current.requirements.length <= expected.requirements.length,
    `${id}: coverage preimage has more requirements than the conservative declared-domain contract`,
  );
  const currentById = new Map(
    current.requirements.map((requirement) => [
      requirement?.requirementId,
      requirement,
    ]),
  );
  invariant(
    currentById.size === current.requirements.length,
    `${id}: coverage preimage has duplicate requirement IDs`,
  );
  const expectedById = new Map(
    expected.requirements.map((requirement) => [
      requirement.requirementId,
      requirement,
    ]),
  );
  invariant(
    expectedById.size === expected.requirements.length,
    `${id}: conservative declared-domain contract has duplicate requirement IDs`,
  );
  const previouslyMaterializedDomainIds = new Set(
    Array.isArray(current.materialization?.declaredFrameDomains)
      ? current.materialization.declaredFrameDomains.map(({id: domainId}) =>
          domainId,
        )
      : [],
  );
  for (const expectedRequirement of expected.requirements) {
    const wasAlreadyRequired =
      expectedRequirement.frameDomainId === "root" ||
      previouslyMaterializedDomainIds.has(expectedRequirement.frameDomainId);
    invariant(
      !wasAlreadyRequired ||
        currentById.has(expectedRequirement.requirementId),
      `${id}: coverage preimage is missing previously required ${expectedRequirement.requirementId}`,
    );
  }
  for (const currentRequirement of current.requirements) {
    const expectedRequirement = expectedById.get(
      currentRequirement.requirementId,
    );
    invariant(
      expectedRequirement,
      `${id}: coverage preimage contains orphaned requirement ${currentRequirement.requirementId}`,
    );
    for (const key of Object.keys(currentRequirement)) {
      invariant(
        Object.hasOwn(expectedRequirement, key),
        `${id}/${expectedRequirement.requirementId}: unsupported coverage overlay field ${key}`,
      );
      if (REQUIREMENT_REFRESHABLE_FIELDS.has(key)) continue;
      invariant(
        equalCanonical(currentRequirement[key], expectedRequirement[key]),
        `${id}/${expectedRequirement.requirementId}: non-refreshable requirement field ${key} drifted`,
      );
    }
    invariant(
      currentRequirement.status === "pending" ||
        currentRequirement.status === "blocked",
      `${id}/${expectedRequirement.requirementId}: coverage preimage was promoted beyond pending/blocked`,
    );
    for (const key of REQUIREMENT_CAPTURE_FIELDS) {
      invariant(
        equalCanonical(currentRequirement[key], expectedRequirement[key]),
        `${id}/${expectedRequirement.requirementId}: capture/metric field ${key} is not acceptance-neutral`,
      );
    }
    if (currentRequirement.blockingEvidence !== undefined) {
      invariant(
        Array.isArray(currentRequirement.blockingEvidence) &&
          currentRequirement.blockingEvidence.every(
            (evidence) =>
              evidence?.file === SCENARIO_RELATIVE_PATH &&
              SHA256_PATTERN.test(evidence.sha256 || ""),
          ) &&
          currentRequirement.blockingEvidence.length <= 1,
        `${id}/${expectedRequirement.requirementId}: coverage preimage contains non-refreshable blocking evidence`,
      );
    }
  }
}

function coverageDocument({
  root,
  workspace,
  id,
  release,
  member,
  catalogSnapshot,
  manifest,
  manifestTechnicalSha256,
  manifestSnapshot,
  inventory,
  inventorySnapshot,
  inventoryTechnicalProjectionSha256,
  dispositionSnapshot,
  dispositionResult,
  domains,
  scenarioById,
  languages,
  stage,
}) {
  const requirements = domains.flatMap((domain) =>
    domain.scenarioIds.flatMap((scenarioId) =>
      languages.map((language) =>
        requirementFor({
          id,
          releaseId: release.releaseId,
          domain,
          scenario: scenarioById.get(scenarioId),
          language,
          inventoryRawSha256: inventorySnapshot.sha256,
        }),
      ),
    ),
  );
  return {
    schemaVersion: 2,
    animationId: id,
    materialization: {
      schemaVersion: 1,
      status:
        "declared-frame-domains-only-original-runtime-and-reachability-unresolved",
      migrationStatusChanged: false,
      lessonRelease: {
        releaseId: release.releaseId,
        publicationMode: release.publicationMode,
        expectedAtomicMemberCount: release.expectedCounts.members,
        releaseFingerprintSha256: digest(
          Buffer.from(canonicalJson(release)),
        ),
        orderedMemberIdentitySha256: digest(
          Buffer.from(canonicalJson(releaseIdentity(release))),
        ),
        catalog: rawBinding(root, catalogSnapshot, {
          schemaVersion: 1,
        }),
        member: {
          ordinal: member.ordinal,
          animationId: member.animationId,
          assetId: member.assetId,
          releaseRole: member.releaseRole,
          shardId: member.shardId,
          sourcePath: member.source.path,
          sourceSha256: member.source.sha256,
        },
      },
      workspace: {
        path: projectRelative(root, workspace, `${id}: workspace path`),
        animationId: id,
        assetId: member.assetId,
      },
      sourceSwf: {
        path: manifest.source.swf,
        sha256: member.source.sha256,
      },
      migrationTechnicalContract: {
        path: "migration.json",
        fileSha256AtMaterialization: manifestSnapshot.sha256,
        hashMode: CANONICAL_PROJECTION_ENCODING,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        sha256: manifestTechnicalSha256,
      },
      scenarioInventory: {
        path: SCENARIO_RELATIVE_PATH,
        bytes: inventorySnapshot.bytes.length,
        sha256: inventorySnapshot.sha256,
        hashMode: "raw-file-sha256",
        technicalProjection: SCENARIO_INVENTORY_PROJECTION.id,
        technicalProjectionSha256: inventoryTechnicalProjectionSha256,
        inventoryStatus: inventory.inventoryStatus,
      },
      frameDomainDisposition: {
        path: DISPOSITION_RELATIVE_PATH,
        bytes: dispositionSnapshot.bytes.length,
        sha256: dispositionSnapshot.sha256,
        status: dispositionResult.status,
        dispositionCounts: dispositionResult.counts,
      },
      nativeStage: {
        width: stage.width,
        height: stage.height,
        preservedExactly: true,
        rasterRoundingApplied: false,
      },
      declaredFrameDomains: domains.map((domain) => ({
        id: domain.id,
        kind: domain.kind,
        sourceTimelineId: domain.sourceTimelineId,
        parentFrameDomainId: domain.parentFrameDomainId,
        frameCount: domain.frameCount,
        scenarioIds: [...domain.scenarioIds],
      })),
      excludedUnresolvedTimelines: {
        count: dispositionResult.unresolved.length,
        timelines: dispositionResult.unresolved,
        effect:
          "excluded-from-coverage-requirements-until-a-reviewed-frame-domain-disposition-and-regenerated-technical-manifest-prove-a-non-unresolved-contract",
      },
      authorityBoundary: [
        "Only frame domains already declared in the exact hash-bound migration technical contract are enumerated as coverage requirements.",
        "Unresolved child timelines remain explicitly excluded; structural reachability is not natural runtime reachability and is not promoted to an independent frame domain.",
        "Every requirement remains blocked with zero captured frames and an unresolved original-runtime authority.",
        "This materialization does not establish a natural schedule, terminal semantics, Replay behavior, language/audio fidelity, visual parity, RMSE, human review, owner acceptance, strict completion, or publication.",
      ],
      strictAcceptanceEffect: "none",
      publicationAuthorized: false,
    },
    requirements,
  };
}

async function preflightMember({
  root,
  migrationsRoot,
  preservedSourceRoot,
  release,
  member,
  catalogSnapshot,
}) {
  const id = member.animationId;
  assertSafeId(id, `${release.releaseId}: member animationId`);
  const workspace = await assertDirectory(
    path.join(migrationsRoot, id),
    migrationsRoot,
    `${id}: migration workspace`,
  );
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(
    workspace,
    ...COVERAGE_RELATIVE_PATH.split("/"),
  );
  const inventoryPath = path.join(
    workspace,
    ...SCENARIO_RELATIVE_PATH.split("/"),
  );
  const dispositionPath = path.join(
    workspace,
    ...DISPOSITION_RELATIVE_PATH.split("/"),
  );
  const sourcePath = path.join(
    preservedSourceRoot,
    ...member.source.path.split("/"),
  );
  const [
    manifestSnapshot,
    coverageSnapshot,
    inventorySnapshot,
    dispositionSnapshot,
    sourceSnapshot,
  ] = await Promise.all([
    readStableOrdinaryFile(manifestPath, workspace, `${id}: migration.json`),
    readStableOrdinaryFile(
      coveragePath,
      workspace,
      `${id}: ${COVERAGE_RELATIVE_PATH}`,
    ),
    readStableOrdinaryFile(
      inventoryPath,
      workspace,
      `${id}: ${SCENARIO_RELATIVE_PATH}`,
    ),
    readStableOrdinaryFile(
      dispositionPath,
      workspace,
      `${id}: ${DISPOSITION_RELATIVE_PATH}`,
    ),
    readStableOrdinaryFile(sourcePath, preservedSourceRoot, `${id}: source SWF`),
  ]);
  invariant(
    sourceSnapshot.sha256 === member.source.sha256,
    `${id}: physical source SWF hash differs from the release member`,
  );
  const manifest = parseJson(manifestSnapshot, `${id}: migration.json`);
  const currentCoverage = parseJson(
    coverageSnapshot,
    `${id}: ${COVERAGE_RELATIVE_PATH}`,
  );
  const inventory = parseJson(
    inventorySnapshot,
    `${id}: ${SCENARIO_RELATIVE_PATH}`,
  );
  const disposition = parseJson(
    dispositionSnapshot,
    `${id}: ${DISPOSITION_RELATIVE_PATH}`,
  );
  const manifestContract = validateManifest({id, manifest, member});
  const manifestTechnicalDigest = technicalManifestSha256(manifest);
  const inventoryResult = validateScenarioInventory({
    root,
    id,
    inventory,
    inventorySnapshot,
    manifest,
    manifestTechnicalSha256: manifestTechnicalDigest,
    member,
    catalogSnapshot,
    release,
    domains: manifestContract.domains,
  });
  const dispositionResult = validateDisposition({
    root,
    id,
    disposition,
    dispositionSnapshot,
    manifest,
    manifestTechnicalSha256: manifestTechnicalDigest,
    member,
    catalogSnapshot,
    release,
    inventorySnapshot,
    domains: manifestContract.domains,
  });
  const expectedCoverage = coverageDocument({
    root,
    workspace,
    id,
    release,
    member,
    catalogSnapshot,
    manifest,
    manifestTechnicalSha256: manifestTechnicalDigest,
    manifestSnapshot,
    inventory,
    inventorySnapshot,
    inventoryTechnicalProjectionSha256:
      inventoryResult.technicalProjectionSha256,
    dispositionSnapshot,
    dispositionResult,
    ...manifestContract,
  });
  validateCoveragePreimage({id, current: currentCoverage, expected: expectedCoverage});
  const expectedBytes = Buffer.from(pretty(expectedCoverage));
  return {
    id,
    member,
    workspace,
    target: coveragePath,
    targetSnapshot: coverageSnapshot,
    expectedCoverage,
    expectedBytes,
    changed: !expectedBytes.equals(coverageSnapshot.bytes),
    requirementCount: expectedCoverage.requirements.length,
    declaredDomainCount: manifestContract.domains.length,
    unresolvedTimelineCount: dispositionResult.unresolved.length,
    readRecords: [
      {
        snapshot: manifestSnapshot,
        containmentRoot: workspace,
        label: `${id}: migration.json`,
      },
      {
        snapshot: coverageSnapshot,
        containmentRoot: workspace,
        label: `${id}: ${COVERAGE_RELATIVE_PATH}`,
      },
      {
        snapshot: inventorySnapshot,
        containmentRoot: workspace,
        label: `${id}: ${SCENARIO_RELATIVE_PATH}`,
      },
      {
        snapshot: dispositionSnapshot,
        containmentRoot: workspace,
        label: `${id}: ${DISPOSITION_RELATIVE_PATH}`,
      },
      {
        snapshot: sourceSnapshot,
        containmentRoot: preservedSourceRoot,
        label: `${id}: source SWF`,
      },
    ],
  };
}

async function stageFile(plan, nonce, index) {
  const temporary = path.join(
    path.dirname(plan.target),
    `.full-frame-coverage.${nonce}.${index}.stage`,
  );
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(plan.expectedBytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(temporary, plan.targetSnapshot.mode & 0o777);
  return temporary;
}

async function commitTransaction({
  plans,
  readSet,
  migrationsRoot,
  testHooks = {},
}) {
  const changed = plans.filter((plan) => plan.changed);
  if (!changed.length) return 0;
  const lockPath = path.join(
    migrationsRoot,
    ".release-source-evidenced-coverage-v2.lock",
  );
  let lock;
  try {
    lock = await open(lockPath, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(
        "Another release coverage-v2 materialization is active",
      );
    }
    throw error;
  }
  const nonce = `${process.pid}-${randomUUID()}`;
  const staged = [];
  const committed = [];
  try {
    await assertReadSetCurrent(readSet);
    for (const [index, plan] of changed.entries()) {
      staged.push({
        plan,
        temporary: await stageFile(plan, nonce, index),
        backup: `${plan.target}.coverage-v2-${nonce}.backup`,
      });
    }
    await assertReadSetCurrent(readSet);
    if (typeof testHooks.afterStaging === "function") {
      await testHooks.afterStaging({staged, changed});
    }
    await assertReadSetCurrent(readSet);
    for (const [index, item] of staged.entries()) {
      await rename(item.plan.target, item.backup);
      try {
        await rename(item.temporary, item.plan.target);
      } catch (error) {
        await rename(item.backup, item.plan.target);
        throw error;
      }
      committed.push(item);
      if (typeof testHooks.afterCommit === "function") {
        await testHooks.afterCommit({index, item});
      }
    }
    for (const item of committed) await unlink(item.backup);
    return changed.length;
  } catch (error) {
    const rollbackErrors = [];
    for (const item of [...committed].reverse()) {
      const displaced = `${item.temporary}.rollback`;
      try {
        await rename(item.plan.target, displaced);
        await rename(item.backup, item.plan.target);
        await unlink(displaced);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    for (const item of staged) {
      try {
        await unlink(item.temporary);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") rollbackErrors.push(cleanupError);
      }
      try {
        await unlink(item.backup);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") rollbackErrors.push(cleanupError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "Coverage-v2 transaction failed and rollback was incomplete",
      );
    }
    throw error;
  } finally {
    try {
      await lock?.close();
    } finally {
      await unlink(lockPath).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
}

export function parseArguments(argumentsList) {
  const options = {ids: [], check: false};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (
      value === "--release-id" ||
      value === "--id" ||
      value === "--migrations" ||
      value === "--lesson-releases"
    ) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--release-id") options.releaseId = next;
      else if (value === "--id") options.ids.push(next);
      else if (value === "--migrations") options.migrationsRoot = next;
      else options.lessonReleasesPath = next;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return options;
}

export function usage() {
  return `Usage: node scripts/materialize-release-source-evidenced-coverage-v2.mjs --release-id <release-id> [options]\n\nOptions:\n  --release-id <release-id>       Required exact atomic lesson release\n  --id <animation-id>             Optional verified release subset; repeatable\n  --migrations <directory>        Migration root (default: migrations)\n  --lesson-releases <file>        Release catalog (default: catalog/lesson-releases.json)\n  --check                         Verify exact generated coverage without writing\n  --help                          Show this help\n\nThe command preflights every selected member before any write. It writes only\nevidence/full-frame-coverage.json, enumerates only frame domains already declared\nby the exact technical manifest and disposition, binds each requirement to the\nraw scenario-inventory SHA-256, and leaves all runtime, review, acceptance, and\npublication authority unresolved. Unresolved child timelines remain explicitly\nexcluded and recorded; they are never promoted from static reachability.`;
}

export async function materializeReleaseSourceEvidencedCoverageV2(
  options = {},
) {
  const root = await realpath(
    path.resolve(options.projectRoot || defaultProjectRoot),
  );
  const migrationsRoot = path.resolve(
    options.migrationsRoot || path.join(root, "migrations"),
  );
  const lessonReleasesPath = path.resolve(
    options.lessonReleasesPath ||
      path.join(root, "catalog", "lesson-releases.json"),
  );
  const preservedSourceRoot = path.join(
    root,
    "source-assets",
    "flash",
    "HELP MATH_ORIGINAL FILES",
  );
  assertSafeId(options.releaseId, "Requested lesson release ID");
  await assertDirectory(root, root, "Project root");
  await assertDirectory(migrationsRoot, root, "Migration root");
  await assertDirectory(
    preservedSourceRoot,
    root,
    "Preserved source root",
  );
  const catalogSnapshot = await readStableOrdinaryFile(
    lessonReleasesPath,
    root,
    "Lesson release catalog",
  );
  const catalog = parseJson(catalogSnapshot, "Lesson release catalog");
  const selection = selectTraceLessonRelease(catalog, {
    releaseId: options.releaseId,
    ids: options.ids || [],
  });
  const release = selection.release;
  const plans = [];
  for (const member of selection.members) {
    plans.push(
      await preflightMember({
        root,
        migrationsRoot,
        preservedSourceRoot,
        release,
        member,
        catalogSnapshot,
      }),
    );
  }
  const readSet = mergeReadSet([
    {
      snapshot: catalogSnapshot,
      containmentRoot: root,
      label: "Lesson release catalog",
    },
    ...plans.flatMap(({readRecords}) => readRecords),
  ]);
  await assertReadSetCurrent(readSet);
  const stale = plans.filter(({changed}) => changed);
  if (options.check) {
    invariant(
      stale.length === 0,
      `Stale release coverage-v2 output(s):\n${stale
        .map(({id}) => `migrations/${id}/${COVERAGE_RELATIVE_PATH}`)
        .join("\n")}`,
    );
  }
  const changedCount = options.check
    ? 0
    : await commitTransaction({
        plans,
        readSet,
        migrationsRoot,
        testHooks: options.testHooks,
      });
  return {
    releaseId: release.releaseId,
    selectionScope: selection.selectionIdentity.scope,
    selectionSha256: selection.selectionSha256,
    selectedMemberCount: plans.length,
    changedMemberCount: changedCount,
    requirementCount: plans.reduce(
      (sum, plan) => sum + plan.requirementCount,
      0,
    ),
    declaredFrameDomainCount: plans.reduce(
      (sum, plan) => sum + plan.declaredDomainCount,
      0,
    ),
    excludedUnresolvedTimelineCount: plans.reduce(
      (sum, plan) => sum + plan.unresolvedTimelineCount,
      0,
    ),
    migrationManifestChangedCount: 0,
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none",
    checked: options.check === true,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!options.releaseId) throw new Error("--release-id is required");
  if (options.migrationsRoot) {
    options.migrationsRoot = path.resolve(options.migrationsRoot);
  }
  if (options.lessonReleasesPath) {
    options.lessonReleasesPath = path.resolve(options.lessonReleasesPath);
  }
  const result = await materializeReleaseSourceEvidencedCoverageV2(options);
  process.stdout.write(
    `${result.checked ? "Verified" : "Materialized"} ${result.releaseId}: ` +
      `${result.selectedMemberCount} member(s), ${result.requirementCount} blocked requirement(s), ` +
      `${result.declaredFrameDomainCount} declared domain(s), ` +
      `${result.excludedUnresolvedTimelineCount} unresolved timeline(s) explicitly excluded, ` +
      `${result.changedMemberCount} file(s) changed; migration/review/acceptance status unchanged.\n`,
  );
}

if (process.argv[1] === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
