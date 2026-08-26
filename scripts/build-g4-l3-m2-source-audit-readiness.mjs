#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-m2-source-audit-readiness";
const DEFAULT_JSON_OUTPUT = path.join(PROJECT_ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN_OUTPUT = path.join(PROJECT_ROOT, "reports", `${REPORT_BASENAME}.md`);
const RELEASE_MANIFEST_PATH = "catalog/lesson-releases.json";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const WORKSPACE_ARTIFACT_RELATIVE_PATH = "audit/machine/g4-l3-source-audit.json";
const WORKSPACE_INVENTORY_RECEIPT_RELATIVE_PATH = "audit/machine/g4-l3-inventory-materialization.json";
const WORKSPACE_MACHINE_ASSET_RELATIVE_PATH = "audit/machine/g4-l3-swf-definition-inventory.csv";
const WORKSPACE_MACHINE_AUDIO_RELATIVE_PATH = "audit/machine/g4-l3-audio-source-candidates.csv";
const WORKSPACE_CANONICAL_ASSET_RELATIVE_PATH = "asset-inventory.csv";
const WORKSPACE_CANONICAL_AUDIO_RELATIVE_PATH = "audio-inventory.csv";
const SOURCE_AUDIT_MATERIALIZER_PATH = "scripts/materialize-g4-l3-workspace-source-audits.mjs";
const INVENTORY_MATERIALIZER_PATH = "scripts/materialize-g4-l3-workspace-inventories.mjs";
const CANONICAL_ASSET_INVENTORY_TEMPLATE_PATH = "templates/flash-migration/asset-inventory.csv";
const SOURCE_AUDIT_OWNED_EVIDENCE = "g4-l3-static-machine-source-audit";

const REQUIRED_REPORTS = Object.freeze([
  {
    key: "machineSourceAudits",
    file: "reports/g4-l3-machine-source-audits.json",
    reportType: "g4-l3-machine-source-audits",
    schemaVersion: 1,
  },
  {
    key: "sourceOperationIndexV2",
    file: "reports/g4-l3-source-operation-index-v2.json",
    reportType: "g4-l3-actionscript-source-operation-index",
    schemaVersion: 2,
  },
  {
    key: "staticSourceEventIndex",
    file: "reports/g4-l3-static-source-event-index.json",
    reportType: "g4-l3-static-source-event-index",
    schemaVersion: 1,
  },
  {
    key: "embeddedAudioArchive",
    file: "reports/g4-l3-embedded-audio-archive.json",
    reportType: "g4-l3-embedded-audio-archive",
    schemaVersion: 1,
  },
  {
    key: "assetDefinitionCensus",
    file: "reports/g4-l3-swf-asset-definition-census.json",
    reportType: "g4-l3-swf-asset-definition-census",
    schemaVersion: 1,
  },
  {
    key: "pairedAuthoringSourceBindings",
    file: "reports/g4-l3-paired-authoring-source-bindings.json",
    reportType: "g4-l3-paired-authoring-source-bindings",
    schemaVersion: 1,
  },
  {
    key: "animateAuthoringAuditIndex",
    file: "reports/g4-l3-animate-authoring-audit-index.json",
    reportType: "g4-l3-adobe-animate-authoring-audit-result-index",
    schemaVersion: 1,
    generator: "scripts/build-g4-l3-animate-authoring-audit-index.mjs",
  },
  {
    key: "catalogAudioMediaProbe",
    file: "reports/g4-l3-catalog-audio-media-probe.json",
    reportType: "g4-l3-catalog-audio-technical-media-probe",
    schemaVersion: 1,
  },
  {
    key: "audioCasMediaProbe",
    file: "reports/g4-l3-audio-cas-media-probe.json",
    reportType: "g4-l3-audio-cas-technical-media-probe",
    schemaVersion: 1,
  },
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function exact(value) {
  return JSON.stringify(value);
}

function posixRelative(root, absolutePath) {
  const candidate = path.relative(root, absolutePath).split(path.sep).join("/");
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate),
    `${absolutePath} escapes the project root`);
  return candidate;
}

function resolveProjectPath(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `${label}: expected a non-empty project-relative path`);
  const absolutePath = path.resolve(root, relativePath);
  invariant(absolutePath.startsWith(`${root}${path.sep}`), `${label}: path escapes the project root`);
  return absolutePath;
}

async function readBinding(root, relativePath, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  const bytes = await readFile(absolutePath);
  return {
    file: posixRelative(root, absolutePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    raw: bytes,
  };
}

async function readJsonBinding(root, relativePath, label) {
  const binding = await readBinding(root, relativePath, label);
  let value;
  try {
    value = JSON.parse(binding.raw.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON: ${error.message}`);
  }
  return {...binding, value};
}

async function assertDeclaredBinding(root, declaration, label, {pathKey} = {}) {
  invariant(declaration && typeof declaration === "object", `${label}: binding declaration is missing`);
  const declaredPath = pathKey ? declaration[pathKey] : declaration.path ?? declaration.file;
  const physical = await readBinding(root, declaredPath, label);
  invariant(declaration.sha256 === physical.sha256, `${label}: SHA-256 binding is stale`);
  if (declaration.bytes !== undefined) {
    invariant(declaration.bytes === physical.bytes, `${label}: byte-count binding is stale`);
  }
  return physical;
}

async function readRequiredReport(root, definition) {
  const artifact = await readJsonBinding(root, definition.file, definition.key);
  invariant(artifact.value.schemaVersion === definition.schemaVersion,
    `${definition.key}: expected schemaVersion ${definition.schemaVersion}`);
  invariant(artifact.value.reportType === definition.reportType,
    `${definition.key}: expected reportType ${definition.reportType}`);
  const generatorPath = artifact.value.generator?.path ?? artifact.value.generator?.file ?? definition.generator;
  invariant(typeof generatorPath === "string" && generatorPath.startsWith("scripts/") && !generatorPath.includes(".."),
    `${definition.key}: missing safe generator path`);
  const generator = await readBinding(root, generatorPath, `${definition.key} generator`);
  if (artifact.value.generator) {
    invariant(artifact.value.generator.sha256 === generator.sha256,
      `${definition.key}: generator SHA-256 is stale`);
    if (artifact.value.generator.bytes !== undefined) {
      invariant(artifact.value.generator.bytes === generator.bytes,
        `${definition.key}: generator byte count is stale`);
    }
  }
  return {
    definition,
    value: artifact.value,
    binding: {
      file: artifact.file,
      bytes: artifact.bytes,
      sha256: artifact.sha256,
      reportType: artifact.value.reportType,
      schemaVersion: artifact.value.schemaVersion,
      generator: {
        file: generator.file,
        bytes: generator.bytes,
        sha256: generator.sha256,
      },
    },
  };
}

function assertOrderedIdentity(members, items, label) {
  invariant(Array.isArray(items) && items.length === members.length,
    `${label}: expected exactly ${members.length} ordered items`);
  for (let index = 0; index < members.length; index += 1) {
    const member = members[index];
    const item = items[index];
    invariant(item.sequence === member.ordinal, `${label}: item ${index + 1} sequence drifted`);
    invariant(item.animationId === member.animationId, `${label}: item ${index + 1} animationId drifted`);
    invariant(item.assetId === member.assetId, `${label}: item ${index + 1} assetId drifted`);
    invariant(item.releaseRole === member.releaseRole, `${label}: item ${index + 1} releaseRole drifted`);
    invariant((item.batchId ?? item.batch?.batchId) === member.batchId,
      `${label}: item ${index + 1} batchId drifted`);
  }
}

function expectedSourcePath(member) {
  return `${SOURCE_PREFIX}${member.source.path}`;
}

export function validateReleaseManifest(releaseManifest) {
  invariant(releaseManifest.schemaVersion === 1, "Lesson release manifest schema drifted");
  invariant(Array.isArray(releaseManifest.releases), "Lesson release manifest releases are missing");
  const matches = releaseManifest.releases.filter(({releaseId}) => releaseId === RELEASE_ID);
  invariant(matches.length === 1, `Expected exactly one declared ${RELEASE_ID} release`);
  const release = matches[0];
  invariant(release.releaseId === RELEASE_ID && release.releaseType === "complete-lesson",
    "G4 L3 release identity drifted");
  invariant(release.publicationMode === "atomic" && release.developmentMode === "parallel-shards",
    "G4 L3 release mode drifted");
  invariant(release.queueId === "release-g04-l03-negative-numbers" && release.grade === 4 && release.lesson === 3,
    "G4 L3 grade, lesson, or queue identity drifted");
  invariant(exact(release.expectedCounts) === exact({
    activeXmlReferencedPages: 39,
    courseShells: 1,
    members: 40,
    shards: 2,
  }), "G4 L3 expected-count contract drifted");
  invariant(Array.isArray(release.shards) && release.shards.length === 2
    && release.shards[0].batchId === "batch-001" && release.shards[0].memberCount === 25
    && release.shards[1].batchId === "batch-002" && release.shards[1].memberCount === 15,
  "G4 L3 25+15 shard contract drifted");
  invariant(Array.isArray(release.members) && release.members.length === 40,
    "G4 L3 release must contain exactly 40 members");
  invariant(new Set(release.members.map((member) => member.animationId)).size === 40,
    "G4 L3 release animation IDs are not unique");
  invariant(new Set(release.members.map((member) => member.assetId)).size === 40,
    "G4 L3 release asset IDs are not unique");
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const ordinal = index + 1;
    invariant(member.ordinal === ordinal, `Release member ${ordinal}: ordinal drifted`);
    invariant(member.assetId === `swf-${member.source.sha256}`,
      `Release member ${ordinal}: asset/source SHA identity drifted`);
    invariant(member.batchId === (ordinal <= 25 ? "batch-001" : "batch-002"),
      `Release member ${ordinal}: batch assignment drifted`);
    invariant(member.shardId === (ordinal <= 25 ? "shard-01" : "shard-02"),
      `Release member ${ordinal}: shard assignment drifted`);
    invariant(member.releaseRole === (ordinal === 40 ? "course-shell" : "active-xml-referenced-page"),
      `Release member ${ordinal}: release role drifted`);
    invariant(typeof member.source.path === "string" && member.source.path.startsWith("HELP_COURSES/ELMGR4/L3/"),
      `Release member ${ordinal}: source path is outside G4 L3`);
    invariant(isSha256(member.source.sha256), `Release member ${ordinal}: source SHA-256 is invalid`);
  }
  return release;
}

function assertClosedRuntimeBoundary(boundary, label) {
  invariant(boundary && typeof boundary === "object", `${label}: runtime boundary missing`);
  for (const key of [
    "runtimeReachabilityEstablished",
    "authoritativeRuntimeLaunched",
    "humanOrOwnerAcceptanceEstablished",
    "strictAcceptanceEstablished",
    "visualOrBehavioralParityEstablished",
  ]) {
    if (Object.hasOwn(boundary, key)) invariant(boundary[key] === false, `${label}.${key} unexpectedly opened`);
  }
  for (const key of ["runtimeScenarios", "captureSchedules", "deterministicSeedContracts", "originalRuntimeBaselines"]) {
    if (Object.hasOwn(boundary, key)) {
      invariant(Array.isArray(boundary[key]) && boundary[key].length === 0, `${label}.${key} unexpectedly contains runtime evidence`);
    }
  }
}

function assertAllFalse(object, label) {
  invariant(object && typeof object === "object" && !Array.isArray(object), `${label}: expected an object`);
  for (const [key, value] of Object.entries(object)) {
    invariant(value === false, `${label}.${key} unexpectedly opened`);
  }
}

async function validateUpstreamInputBindings(root, byKey) {
  const machine = byKey.machineSourceAudits;
  // catalog/batches.json now contains the later atomic lesson-release queue contract.
  // The machine audit predates that queue-only edit, so its legacy batches hash is
  // deliberately not treated as source evidence. Exact current order/batch/shard
  // identity is revalidated above against catalog/lesson-releases.json instead.
  for (const key of ["animations", "lessons", "audioGroups", "sourceFiles", "sourceFreeze"]) {
    await assertDeclaredBinding(root, machine.sourceBindings[key], `machineSourceAudits.sourceBindings.${key}`);
  }

  const machinePhysical = await readBinding(root, REQUIRED_REPORTS[0].file, "machine source audit report");
  const staticEvents = byKey.staticSourceEventIndex;
  invariant(staticEvents.sourceBindings.machineAudit.sha256 === machinePhysical.sha256
    && staticEvents.sourceBindings.machineAudit.bytes === machinePhysical.bytes,
  "Static source-event index machine-audit binding is stale");

  const operations = byKey.sourceOperationIndexV2;
  invariant(operations.sourceBindings.machineAudit.sha256 === machinePhysical.sha256
    && operations.sourceBindings.machineAudit.bytes === machinePhysical.bytes,
  "Source-operation index machine-audit binding is stale");
  const staticPhysical = await readBinding(root, "reports/g4-l3-static-source-event-index.json", "static source-event index");
  invariant(operations.sourceBindings.staticSourceEventIndex.sha256 === staticPhysical.sha256
    && operations.sourceBindings.staticSourceEventIndex.bytes === staticPhysical.bytes,
  "Source-operation index static-event binding is stale");
  await assertDeclaredBinding(root, operations.sourceBindings.shellLegacyHostDependencyContract,
    "sourceOperationIndexV2.sourceBindings.shellLegacyHostDependencyContract");

  const embedded = byKey.embeddedAudioArchive;
  invariant(embedded.sourceBindings.machineSourceAudit.sha256 === machinePhysical.sha256
    && embedded.sourceBindings.machineSourceAudit.bytes === machinePhysical.bytes,
  "Embedded-audio archive machine-audit binding is stale");
  invariant(embedded.archive.archiveWritten === true && embedded.archive.allArchivedPayloadHashesVerified === true,
    "Embedded-audio archive is not recorded as written and hash verified");
  invariant(Array.isArray(embedded.archive.casObjects)
    && embedded.archive.casObjects.length === embedded.archive.archivedFileCount,
  "Embedded-audio archive CAS inventory count drifted");
  let archivedBytes = 0;
  for (const [index, object] of embedded.archive.casObjects.entries()) {
    const physical = await readBinding(root, object.path, `embedded CAS object ${index + 1}`);
    invariant(physical.sha256 === object.sha256 && physical.bytes === object.byteLength,
      `Embedded CAS object ${index + 1}: physical binding drifted`);
    invariant(object.physicalHashVerified === true,
      `Embedded CAS object ${index + 1}: physicalHashVerified is not true`);
    archivedBytes += physical.bytes;
  }
  invariant(archivedBytes === embedded.archive.archivedBytes,
    "Embedded-audio archive byte total drifted");

  const paired = byKey.pairedAuthoringSourceBindings;
  // Work-card and batch-readiness reports are workflow snapshots. Their hashes
  // legitimately changed when the 40 workspaces were scaffolded/materialized;
  // they are not reused as current M2 source facts. The current release manifest,
  // exact per-item source identities, and every prepared physical file are
  // independently revalidated by this builder.
  const historicalRunner = paired.inputBindings.historicalPairedSourcePreparationRunner;
  invariant(historicalRunner?.file === "scripts/run-assisted-animate-authoring-audit.mjs"
    && isSha256(historicalRunner.sha256),
  "Paired-source preparation is missing its historical runner provenance");
  const currentRunner = paired.inputBindings.pairedSourceRunner;
  invariant(currentRunner?.file === historicalRunner.file && isSha256(currentRunner.sha256)
    && Number.isSafeInteger(currentRunner.bytes) && currentRunner.bytes > 0
    && paired.inputBindings.preparationRunnerIsCurrent ===
      (historicalRunner.sha256 === currentRunner.sha256),
  "Paired-source preparation is missing its current runner provenance");
}

async function validateUpstreamReports(root, release, reports) {
  const byKey = Object.fromEntries(reports.map((entry) => [entry.definition.key, entry.value]));
  const machine = byKey.machineSourceAudits;
  const operations = byKey.sourceOperationIndexV2;
  const staticEvents = byKey.staticSourceEventIndex;
  const embedded = byKey.embeddedAudioArchive;
  const assets = byKey.assetDefinitionCensus;
  const paired = byKey.pairedAuthoringSourceBindings;
  const authoring = byKey.animateAuthoringAuditIndex;
  const catalogAudio = byKey.catalogAudioMediaProbe;
  const audioCas = byKey.audioCasMediaProbe;
  const members = release.members;

  assertOrderedIdentity(members, machine.items, "machine source audits");
  assertOrderedIdentity(members, operations.items, "source-operation index v2");
  assertOrderedIdentity(members, staticEvents.items, "static source-event index");
  assertOrderedIdentity(members, embedded.items, "embedded-audio archive");
  assertOrderedIdentity(members, assets.items, "asset-definition census");

  invariant(machine.summary.canonicalItems === 40 && machine.summary.activePages === 39
    && machine.summary.courseShells === 1 && machine.summary.flaBacked === 29 && machine.summary.swfOnly === 11,
  "Machine source-audit scope summary drifted");
  invariant(machine.acceptance.acceptanceNeutral === true
    && machine.acceptance.sourceAssetsChanged === 0
    && machine.acceptance.migrationStatusChanges === 0
    && machine.acceptance.strictGateChanges === 0
    && machine.acceptance.reviewOrApprovalChanges === 0
    && machine.acceptance.authoritativeRuntimeSessions === 0
    && machine.acceptance.animateDocumentsOpened === 0,
  "Machine source audit crossed its acceptance-neutral boundary");

  const pairedMembers = [];
  for (let index = 0; index < members.length; index += 1) {
    const member = members[index];
    const expectedSwfPath = expectedSourcePath(member);
    const machineItem = machine.items[index];
    invariant(machineItem.source.swf.path === expectedSwfPath
      && machineItem.source.swf.sha256 === member.source.sha256
      && machineItem.source.swf.physicalHashVerified === true,
    `${member.animationId}: machine SWF provenance drifted`);
    invariant(machineItem.auditFingerprintSha256 && isSha256(machineItem.auditFingerprintSha256),
      `${member.animationId}: machine audit fingerprint is missing`);
    const hasFla = machineItem.source.sourceKind === "fla+swf";
    invariant(hasFla || machineItem.source.sourceKind === "swf-only",
      `${member.animationId}: unsupported machine source kind`);
    if (hasFla) {
      invariant(machineItem.source.fla?.physicalHashVerified === true
        && machineItem.source.fla.authoringAuditPerformed === false,
      `${member.animationId}: FLA machine provenance or authoring boundary drifted`);
      pairedMembers.push({member, machineItem});
    } else {
      invariant(machineItem.source.fla === null, `${member.animationId}: SWF-only item unexpectedly has an FLA`);
    }

    const staticItem = staticEvents.items[index];
    invariant(staticItem.physicalSources.swf.path === expectedSwfPath
      && staticItem.physicalSources.swf.sha256 === member.source.sha256
      && staticItem.physicalSources.swf.physicalHashVerified === true,
    `${member.animationId}: static source-event SWF provenance drifted`);
    invariant(staticItem.upstreamMachineAudit.auditFingerprintSha256 === machineItem.auditFingerprintSha256,
      `${member.animationId}: static source-event machine fingerprint drifted`);
    assertClosedRuntimeBoundary(staticItem.runtimeBoundary, `${member.animationId} static source-event runtimeBoundary`);

    const operationItem = operations.items[index];
    invariant(operationItem.source.swf.path === expectedSwfPath
      && operationItem.source.swf.sha256 === member.source.sha256
      && operationItem.source.swf.physicalHashVerified === true
      && operationItem.source.swf.physicalHashVerifiedNow === true,
    `${member.animationId}: source-operation SWF provenance drifted`);
    invariant(operationItem.reexport.fullManifestMatchesMachineAudit === true
      && operationItem.reexport.normalizedBundleMatchesMachineAudit === true
      && operationItem.reexport.temporaryExportRetained === false,
    `${member.animationId}: source-operation re-export binding drifted`);
    invariant(operationItem.upstreamBindings.machineAuditFingerprintSha256 === machineItem.auditFingerprintSha256
      && operationItem.upstreamBindings.staticSourceEventItemFingerprintSha256 === staticItem.itemFingerprintSha256,
    `${member.animationId}: source-operation upstream item binding drifted`);
    assertClosedRuntimeBoundary(operationItem.runtimeBoundary, `${member.animationId} source-operation runtimeBoundary`);

    const embeddedItem = embedded.items[index];
    invariant(embeddedItem.source.swf.path === expectedSwfPath
      && embeddedItem.source.swf.expectedSha256 === member.source.sha256
      && embeddedItem.source.swf.observedSha256 === member.source.sha256
      && embeddedItem.source.swf.physicalHashVerified === true,
    `${member.animationId}: embedded-audio SWF provenance drifted`);
    assertAllFalse(embeddedItem.evidenceLimits, `${member.animationId} embedded-audio evidenceLimits`);

    const assetItem = assets.items[index];
    invariant(assetItem.source.path === expectedSwfPath
      && assetItem.source.sha256 === member.source.sha256
      && assetItem.source.physicalHashVerified === true,
    `${member.animationId}: asset-definition SWF provenance drifted`);
    invariant(isSha256(assetItem.definitionInventorySha256),
      `${member.animationId}: asset-definition inventory fingerprint is invalid`);
  }

  invariant(pairedMembers.length === 29 && paired.items.length === 29
    && paired.summary.expectedBindings === 29 && paired.summary.verifiedBindings === 29,
  "Paired authoring binding coverage drifted");
  for (let index = 0; index < pairedMembers.length; index += 1) {
    const {member, machineItem} = pairedMembers[index];
    const item = paired.items[index];
    invariant(item.sequence === member.ordinal && item.animationId === member.animationId
      && item.batchId === member.batchId,
    `${member.animationId}: paired authoring item identity drifted`);
    invariant(item.source.swf.file === machineItem.source.swf.path
      && item.source.swf.sha256 === machineItem.source.swf.sha256
      && item.source.swf.bytes === machineItem.source.swf.bytes,
    `${member.animationId}: paired SWF source binding drifted`);
    invariant(item.source.fla.file === machineItem.source.fla.path
      && item.source.fla.sha256 === machineItem.source.fla.sha256
      && item.source.fla.bytes === machineItem.source.fla.bytes,
    `${member.animationId}: paired FLA source binding drifted`);
    for (const [key, prepared] of Object.entries({
      sourceBinding: item.prepared.sourceBinding,
      fla: item.prepared.fla,
      swf: item.prepared.swf,
    })) {
      const physical = await assertDeclaredBinding(root, prepared, `${member.animationId} prepared ${key}`);
      const mode = (await stat(resolveProjectPath(root, prepared.file, `${member.animationId} prepared ${key}`))).mode & 0o777;
      invariant(prepared.mode === "0444" && mode === 0o444,
        `${member.animationId}: prepared ${key} is not exact mode 0444`);
      invariant(physical.bytes === prepared.bytes, `${member.animationId}: prepared ${key} byte count drifted`);
    }
    invariant(item.prepared.exactTreeFileCount === 3
      && item.prepared.coreBindingFileCount === 3
      && item.prepared.runArtifactFileCount > 0
      && item.prepared.totalEvidenceFileCount === 3 + item.prepared.runArtifactFileCount
      && item.boundedRerunCommand.dialogAutomationAllowed === false
      && item.boundedRerunCommand.sourceSwfExecuted === false
      && item.boundedRerunCommand.strictAcceptanceEffect === false
      && item.observedAuthoringAudit.status === "verified-work-only-authoring-audit"
      && item.observedAuthoringAudit.originalRuntimeBaselineEstablished === false
      && item.observedAuthoringAudit.acceptanceEffect === false,
    `${member.animationId}: paired authoring-evidence authority boundary drifted`);
  }

  invariant(authoring.summary.queueItems === 29
    && authoring.summary.sourcePairsReverified === 29
    && authoring.summary.verifiedWorkOnlyAuthoringAudits === 29
    && authoring.summary.pendingAuthoringAudits === 0
    && authoring.summary.authoringCoverageComplete === true
    && authoring.summary.originalRuntimeBaselinesEstablished === 0
    && authoring.summary.humanVisualReviewsEstablished === 0
    && authoring.summary.ownerAcceptancesEstablished === 0
    && authoring.summary.strictAcceptancesEstablished === 0
    && authoring.summary.strictAcceptanceEffect === false,
  "Animate authoring result index is incomplete or promoted beyond work-only evidence");
  invariant(authoring.items.length === pairedMembers.length,
    "Animate authoring result index coverage drifted");
  for (let index = 0; index < pairedMembers.length; index += 1) {
    const {member, machineItem} = pairedMembers[index];
    const result = authoring.items[index];
    invariant(result.queueOrdinal === index + 1
      && result.animationId === member.animationId
      && result.status === "verified-work-only-authoring-audit"
      && result.sourcePair?.sourceKind === "fla+swf"
      && result.sourcePair.bothSourceFilesReverified === true
      && result.sourcePair.shippedSwfExecutedByTheseAudits === false
      && result.sourcePair.flaSwfEquivalenceProven === false,
    `${member.animationId}: work-only authoring result identity or authority drifted`);
    invariant(result.sourcePair.fla.file === machineItem.source.fla.path
      && result.sourcePair.fla.sha256 === machineItem.source.fla.sha256
      && result.sourcePair.fla.bytes === machineItem.source.fla.bytes
      && result.sourcePair.swf.file === machineItem.source.swf.path
      && result.sourcePair.swf.sha256 === machineItem.source.swf.sha256
      && result.sourcePair.swf.bytes === machineItem.source.swf.bytes,
    `${member.animationId}: work-only authoring source pair drifted`);
    invariant(result.selectedPassingAudit
      && result.selectedPassingAudit.acceptanceEffect === false
      && result.selectedPassingAudit.authority === "work-only Adobe Animate authoring structure"
      && result.originalRuntimeBehaviorEstablished === false
      && result.humanVisualReviewEstablished === false
      && result.ownerAcceptanceEstablished === false
      && result.strictAcceptanceEffect === false,
    `${member.animationId}: work-only authoring result crossed a runtime or acceptance boundary`);
    for (const [key, record] of Object.entries({
      receipt: result.selectedPassingAudit.receipt,
      workEvidence: result.selectedPassingAudit.workEvidence,
      marker: result.selectedPassingAudit.artifacts?.marker,
      report: result.selectedPassingAudit.artifacts?.report,
      png: result.selectedPassingAudit.artifacts?.png,
    })) {
      await assertDeclaredBinding(root, record, `${member.animationId} selected authoring ${key}`);
    }
  }

  invariant(operations.summary.canonicalItems === 40
    && operations.summary.completeFfdecReexports === 40
    && operations.summary.itemsWithRuntimeReachability === 0
    && operations.summary.authoritativeScenarioInventories === 0
    && operations.summary.authoritativeTraceSpecs === 0,
  "Source-operation index coverage or runtime boundary drifted");
  invariant(staticEvents.summary.canonicalItems === 40
    && staticEvents.summary.physicallyRehashedSwfs === 40
    && staticEvents.summary.physicallyRehashedFlas === 29
    && staticEvents.summary.itemsWithRuntimeReachability === 0,
  "Static source-event coverage or runtime boundary drifted");
  invariant(embedded.summary.canonicalItems === 40 && embedded.summary.audioUnitCount === 359
    && embedded.archive.archivedFileCount === 88 && embedded.archive.archivedBytes === 5710816,
  "Embedded-audio archive scope drifted");
  invariant(assets.scope.releaseId === RELEASE_ID && assets.scope.canonicalItems === 40
    && assets.summary.structuralCountCrossChecksPassed === 40,
  "Asset-definition census scope drifted");
  invariant(paired.summary.authoringAuditsCompleted === 29
    && paired.summary.animateGuiExecutionsRecordedByThesePreparedTrees >= 29
    && paired.summary.implementationAuthorizations === 0
    && paired.summary.strictComplete === 0,
  "Paired authoring report crossed runtime or acceptance authority");
  invariant(paired.acceptance.authoringEvidenceReady === true
    && paired.acceptance.authoritativeRuntimeReady === false
    && paired.acceptance.implementationAuthorized === false
    && paired.acceptance.strictMigrationComplete === false,
  "Paired authoring acceptance state was promoted");
  assertAllFalse(assets.acceptance.gates, "asset-definition acceptance gates");
  invariant(operations.authority.runtimeReachabilityEstablished === false
    && operations.authority.originalRuntimeBaselineEstablished === false
    && operations.authority.visualOrBehavioralParityEstablished === false
    && operations.authority.audioSynchronizationOrListeningEstablished === false
    && operations.authority.humanReviewEstablished === false
    && operations.authority.ownerAcceptanceEstablished === false
    && operations.authority.strictCompletionEstablished === false,
  "Source-operation authority was promoted");
  invariant(catalogAudio.summary.sourceFileCount === 143
    && catalogAudio.summary.sourceReferenceCount === 359
    && catalogAudio.summary.ffprobeParsedCount === 143
    && catalogAudio.summary.ffmpegDecodeCheckPassedCount === 143
    && catalogAudio.summary.listeningReviews === 0
    && catalogAudio.summary.acceptedAudioFiles === 0
    && catalogAudio.summary.strictComplete === 0,
  "Catalog-audio technical probe coverage or acceptance boundary drifted");
  invariant(catalogAudio.acceptance.spokenLanguageAccepted === false
    && catalogAudio.acceptance.cueMappingAccepted === false
    && catalogAudio.acceptance.synchronizationAccepted === false
    && catalogAudio.acceptance.listeningAccepted === false
    && catalogAudio.acceptance.ownerAccepted === false
    && catalogAudio.acceptance.strictMigrationComplete === false,
  "Catalog-audio technical probe promoted acceptance");
  invariant(audioCas.summary.casObjectCount === 88
    && audioCas.summary.casObjectBytes === 5710816
    && audioCas.summary.sourceAudioUnitReferenceCount === 359,
  "Audio CAS technical probe coverage drifted");
  invariant(audioCas.acceptance.languageEstablished === false
    && audioCas.acceptance.cueMappingEstablished === false
    && audioCas.acceptance.runtimeSynchronizationEstablished === false
    && audioCas.acceptance.listeningAcceptanceEstablished === false
    && audioCas.acceptance.authoritativeRuntimeEstablished === false
    && audioCas.acceptance.humanReviewEstablished === false
    && audioCas.acceptance.ownerAcceptanceEstablished === false
    && audioCas.acceptance.strictCompletionEstablished === false,
  "Audio CAS technical probe promoted acceptance");
  await validateUpstreamInputBindings(root, byKey);
  return {byKey, pairedMembers};
}

function artifactFingerprint(artifact) {
  const projection = structuredClone(artifact);
  delete projection.artifactFingerprintSha256;
  return sha256(`${JSON.stringify(projection, null, 2)}\n`);
}

function inventoryReceiptFingerprint(receipt) {
  const projection = structuredClone(receipt);
  delete projection.reportFingerprintSha256;
  return sha256(`${JSON.stringify(projection, null, 2)}\n`);
}

function manifestInventoryIdentity(manifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    animationId: manifest.animationId,
    assetId: manifest.assetId,
    status: manifest.status,
    source: {
      placementPath: manifest.source?.placementPath,
      fla: manifest.source?.fla,
      flaSha256: manifest.source?.flaSha256,
      swf: manifest.source?.swf,
      swfSha256: manifest.source?.swfSha256,
      pairedFlaStatus: manifest.source?.pairedFlaStatus,
    },
    catalogExactAssociations: manifest.audio?.catalogExactAssociations || [],
  };
}

function csvDataRowCount(bytes, expectedHeader, label) {
  const text = bytes.toString("utf8");
  invariant(text.startsWith(`${expectedHeader}\n`), `${label}: CSV header drifted`);
  invariant(text.endsWith("\n"), `${label}: CSV must end with a newline`);
  return text.split("\n").length - 2;
}

export function validateWorkspaceInventoryBinding({
  member,
  receipt,
  receiptPhysical,
  machineAssetPhysical,
  machineAudioPhysical,
  canonicalAssetPhysical,
  canonicalAudioPhysical,
  manifest,
  expectedBindings,
  generatorPhysical,
  censusItem,
  embeddedItem,
}) {
  const label = member.animationId;
  invariant(receipt.schemaVersion === 2
    && receipt.reportType === "g4-l3-workspace-inventory-materialization",
  `${label}: workspace inventory receipt identity drifted`);
  invariant(receipt.animationId === member.animationId && receipt.assetId === member.assetId
    && receipt.ordinal === member.ordinal && receipt.releaseRole === member.releaseRole
    && receipt.batchId === member.batchId,
  `${label}: workspace inventory receipt release identity drifted`);
  invariant(receipt.generatedBy.path === generatorPhysical.file
    && receipt.generatedBy.sha256 === generatorPhysical.sha256
    && receipt.generatedBy.bytes === generatorPhysical.bytes
    && receipt.generatedBy.version === 2,
  `${label}: workspace inventory materializer binding drifted`);
  for (const [key, expected] of Object.entries(expectedBindings)) {
    const actual = receipt.sourceBindings[key];
    invariant(actual && (actual.path ?? actual.file) === expected.file
      && actual.sha256 === expected.sha256 && actual.bytes === expected.bytes,
    `${label}: workspace inventory ${key} binding drifted`);
  }
  invariant(Object.keys(receipt.sourceBindings).length === Object.keys(expectedBindings).length,
    `${label}: workspace inventory has an unexpected source binding`);

  const identity = manifestInventoryIdentity(manifest);
  invariant(exact(receipt.manifestIdentity.projection) === exact(identity)
    && receipt.manifestIdentity.projectionSha256 === sha256(`${JSON.stringify(identity, null, 2)}\n`),
  `${label}: workspace inventory manifest-identity binding drifted`);

  const assetOutput = receipt.outputs?.assetDefinitionInventory;
  const audioOutput = receipt.outputs?.audioSourceCandidateInventory;
  invariant(exact(Object.keys(receipt.outputs || {}).sort())
      === exact(["assetDefinitionInventory", "audioSourceCandidateInventory"]),
  `${label}: workspace inventory machine-output set drifted`);
  invariant(assetOutput?.path === machineAssetPhysical.file
    && assetOutput.path === `migrations/${member.animationId}/${WORKSPACE_MACHINE_ASSET_RELATIVE_PATH}`
    && assetOutput.sha256 === machineAssetPhysical.sha256
    && assetOutput.bytes === machineAssetPhysical.bytes,
  `${label}: machine SWF-definition inventory physical binding drifted`);
  invariant(audioOutput?.path === machineAudioPhysical.file
    && audioOutput.path === `migrations/${member.animationId}/${WORKSPACE_MACHINE_AUDIO_RELATIVE_PATH}`
    && audioOutput.sha256 === machineAudioPhysical.sha256
    && audioOutput.bytes === machineAudioPhysical.bytes,
  `${label}: machine audio-candidate inventory physical binding drifted`);

  const canonicalAsset = receipt.canonicalInventoryFiles?.assetInventory;
  const canonicalAudio = receipt.canonicalInventoryFiles?.audioInventory;
  invariant(exact(Object.keys(receipt.canonicalInventoryFiles || {}).sort())
      === exact(["assetInventory", "audioInventory"]),
  `${label}: canonical inventory read-only binding set drifted`);
  invariant(canonicalAsset?.path === canonicalAssetPhysical.file
    && canonicalAsset.path === `migrations/${member.animationId}/${WORKSPACE_CANONICAL_ASSET_RELATIVE_PATH}`
    && canonicalAsset.sha256 === canonicalAssetPhysical.sha256
    && canonicalAsset.bytes === canonicalAssetPhysical.bytes
    && canonicalAsset.changedByMaterializer === false,
  `${label}: canonical asset-inventory.csv read-only binding drifted`);
  invariant(canonicalAudio?.path === canonicalAudioPhysical.file
    && canonicalAudio.path === `migrations/${member.animationId}/${WORKSPACE_CANONICAL_AUDIO_RELATIVE_PATH}`
    && canonicalAudio.sha256 === canonicalAudioPhysical.sha256
    && canonicalAudio.bytes === canonicalAudioPhysical.bytes
    && canonicalAudio.changedByMaterializer === false,
  `${label}: canonical audio-inventory.csv read-only binding drifted`);
  const canonicalAssetMatchesTemplate =
    canonicalAsset.sha256 === expectedBindings.canonicalAssetInventoryTemplate.sha256
      && canonicalAsset.bytes === expectedBindings.canonicalAssetInventoryTemplate.bytes;
  const canonicalAssetRows = csvDataRowCount(
    canonicalAssetPhysical.raw,
    "asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes",
    `${label} canonical asset inventory`,
  );
  invariant(canonicalAssetMatchesTemplate || canonicalAssetRows > 0,
    `${label}: canonical asset inventory is neither the preserved empty template nor a nonempty adopted-asset inventory`);

  const assetRows = csvDataRowCount(
    machineAssetPhysical.raw,
    "asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes",
    `${label} machine SWF-definition inventory`,
  );
  const audioRows = csvDataRowCount(
    machineAudioPhysical.raw,
    "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes",
    `${label} machine audio-candidate inventory`,
  );
  invariant(assetRows === assetOutput.rowCount
    && assetRows === censusItem.definitions.length
    && assetOutput.definitionInventorySha256 === censusItem.definitionInventorySha256,
  `${label}: machine asset-definition row or census binding drifted`);
  invariant(audioRows === audioOutput.catalogAssociationRows
      + audioOutput.embeddedAudioRows
    && audioOutput.embeddedAudioRows
      === embeddedItem.embeddedAudio.defineSounds.length + embeddedItem.embeddedAudio.soundStreams.length
    && audioOutput.embeddedAudioItemFingerprintSha256 === embeddedItem.itemFingerprintSha256,
  `${label}: machine audio-candidate row or embedded-audio binding drifted`);
  invariant(receipt.machineEvidence.assetDefinitionsInventoried === true
    && receipt.machineEvidence.catalogAudioTechnicallyProbed === true
    && receipt.machineEvidence.embeddedAudioPayloadsArchivedAndTechnicallyProbed === true
    && receipt.machineEvidence.canonicalInventoryFilesChanged === false
    && receipt.machineEvidence.sourceAssetsChanged === false,
  `${label}: workspace inventory machine-evidence boundary drifted`);
  assertAllFalse(receipt.acceptance, `${label} workspace inventory acceptance`);
  invariant(receipt.strictAcceptanceEffect === "none"
    && Array.isArray(receipt.limitations) && receipt.limitations.length > 0,
  `${label}: workspace inventory acceptance boundary or limitations drifted`);
  invariant(isSha256(receipt.reportFingerprintSha256)
    && receipt.reportFingerprintSha256 === inventoryReceiptFingerprint(receipt),
  `${label}: workspace inventory receipt fingerprint drifted`);
  return {
    receipt: {
      file: receiptPhysical.file,
      bytes: receiptPhysical.bytes,
      sha256: receiptPhysical.sha256,
      schemaVersion: receipt.schemaVersion,
      reportFingerprintSha256: receipt.reportFingerprintSha256,
    },
    machineOutputs: {
      assetDefinitions: {
        file: machineAssetPhysical.file,
        bytes: machineAssetPhysical.bytes,
        sha256: machineAssetPhysical.sha256,
        rowCount: assetRows,
      },
      audioSourceCandidates: {
        file: machineAudioPhysical.file,
        bytes: machineAudioPhysical.bytes,
        sha256: machineAudioPhysical.sha256,
        rowCount: audioRows,
        embeddedAudioRows: audioOutput.embeddedAudioRows,
        catalogAssociationRows: audioOutput.catalogAssociationRows,
      },
    },
    canonicalReadOnlyBindings: {
      assetInventory: {
        file: canonicalAssetPhysical.file,
        bytes: canonicalAssetPhysical.bytes,
        sha256: canonicalAssetPhysical.sha256,
        changedByMaterializer: false,
      },
      audioInventory: {
        file: canonicalAudioPhysical.file,
        bytes: canonicalAudioPhysical.bytes,
        sha256: canonicalAudioPhysical.sha256,
        changedByMaterializer: false,
      },
    },
  };
}

export function validateWorkspaceAuditBinding({member, machineItem, artifact, artifactPhysical, manifest, manifestPhysical}) {
  const label = member.animationId;
  invariant(artifact.schemaVersion === 1 && artifact.artifactType === "g4-l3-workspace-source-audit",
    `${label}: workspace source-audit artifact identity drifted`);
  invariant(exact(artifact.identity) === exact({
    releaseId: RELEASE_ID,
    queueId: "release-g04-l03-negative-numbers",
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    batchId: member.batchId,
    shardId: member.shardId,
  }), `${label}: workspace source-audit release identity drifted`);
  invariant(isSha256(artifact.artifactFingerprintSha256)
    && artifact.artifactFingerprintSha256 === artifactFingerprint(artifact),
  `${label}: workspace source-audit artifact fingerprint drifted`);
  invariant(artifact.provenance.lessonReleaseManifest.path === RELEASE_MANIFEST_PATH,
    `${label}: workspace source-audit release-manifest path drifted`);
  invariant(artifact.provenance.upstreamMachineAudit.path === REQUIRED_REPORTS[0].file
    && artifact.provenance.upstreamMachineAudit.auditSetSha256 === machineItem.__auditSetSha256
    && artifact.provenance.upstreamMachineAudit.itemJsonPointer === `/items/${member.ordinal - 1}`
    && artifact.provenance.upstreamMachineAudit.itemFingerprintSha256 === machineItem.auditFingerprintSha256,
  `${label}: workspace source-audit upstream item binding drifted`);
  invariant(artifact.provenance.source.swf.path === machineItem.source.swf.path
    && artifact.provenance.source.swf.bytes === machineItem.source.swf.bytes
    && artifact.provenance.source.swf.sha256 === machineItem.source.swf.sha256
    && artifact.provenance.source.swf.physicalHashVerified === true,
  `${label}: workspace source-audit SWF provenance drifted`);
  if (machineItem.source.sourceKind === "fla+swf") {
    invariant(artifact.provenance.source.fla.path === machineItem.source.fla.path
      && artifact.provenance.source.fla.bytes === machineItem.source.fla.bytes
      && artifact.provenance.source.fla.sha256 === machineItem.source.fla.sha256
      && artifact.provenance.source.fla.physicalHashVerified === true,
    `${label}: workspace source-audit FLA provenance drifted`);
  } else {
    invariant(artifact.provenance.source.fla === null,
      `${label}: SWF-only workspace source audit unexpectedly binds an FLA`);
  }
  invariant(Array.isArray(artifact.limitations) && artifact.limitations.length > 0
    && artifact.limitations.every((entry) => typeof entry === "string" && entry.length > 0),
  `${label}: workspace source-audit limitations are missing`);
  invariant(artifact.machineFindings && typeof artifact.machineFindings === "object",
    `${label}: workspace source-audit machine findings are missing`);
  invariant(artifact.acceptance.acceptanceNeutral === true
    && artifact.acceptance.migrationStatusChanges === 0
    && artifact.acceptance.reviewOrApprovalChanges === 0
    && artifact.acceptance.completionLedgerChanges === 0
    && artifact.acceptance.lessonPublicationChanges === 0
    && artifact.acceptance.originalRuntimeSessions === 0
    && artifact.acceptance.animateDocumentsOpened === 0
    && artifact.acceptance.acceptanceEffect === "none"
    && artifact.acceptance.migrationManifestBindings === 0,
  `${label}: workspace source-audit acceptance boundary was promoted`);
  invariant(exact(artifact.machineFindings.scripts) === exact(machineItem.scripts)
    && exact(artifact.machineFindings.evidenceLimits) === exact(machineItem.evidenceLimits),
  `${label}: workspace source-audit script or evidence-limit projection drifted`);
  invariant(artifact.machineFindings.runtime.swfSignature === machineItem.swf.header.signature
    && artifact.machineFindings.runtime.swfVersion === machineItem.swf.header.version
    && artifact.machineFindings.runtime.declaredFileLength === machineItem.swf.header.declaredUncompressedBytes
    && artifact.machineFindings.runtime.stage.width === machineItem.swf.header.stage.width
    && artifact.machineFindings.runtime.stage.height === machineItem.swf.header.stage.height
    && artifact.machineFindings.runtime.fps === machineItem.swf.header.fps
    && artifact.machineFindings.runtime.rootFrameCount === machineItem.swf.header.rootFrameCount
    && artifact.machineFindings.runtime.actionScriptVersion === machineItem.swf.actionScript.version
    && artifact.machineFindings.runtime.structureFingerprintSha256 === machineItem.swf.structureFingerprintSha256,
  `${label}: workspace source-audit runtime projection drifted`);
  for (const key of ["masks", "morphs", "filters", "networkCalls"]) {
    const candidates = artifact.machineFindings.auditCandidates[key];
    invariant(candidates?.candidateOnly === true && Array.isArray(candidates.items),
      `${label}: ${key} are not marked as static candidates`);
    invariant(candidates.items.every((entry) => entry.source === SOURCE_AUDIT_OWNED_EVIDENCE),
      `${label}: ${key} include an unowned candidate`);
  }
  invariant(artifact.machineFindings.auditCandidates.networkCalls.legacyEndpointInvocationsDuringAudit === 0,
    `${label}: a legacy endpoint was unexpectedly executed`);

  invariant(manifest.schemaVersion === 2 && manifest.id === member.animationId
    && manifest.animationId === member.animationId && manifest.assetId === member.assetId,
    `${label}: migration manifest identity drifted`);
  invariant(manifest.status === "preserved", `${label}: machine audit unexpectedly changed migration status`);
  invariant(manifest.source?.placementPath === machineItem.source.swf.path
    && manifest.source?.swf === machineItem.source.swf.path
    && manifest.source?.swfSha256 === machineItem.source.swf.sha256,
  `${label}: migration manifest SWF identity drifted`);
  if (machineItem.source.sourceKind === "fla+swf") {
    invariant(manifest.source?.fla === machineItem.source.fla.path
      && manifest.source?.flaSha256 === machineItem.source.fla.sha256
      && manifest.source?.pairedFlaStatus === "present",
    `${label}: migration manifest FLA identity drifted`);
  } else {
    invariant(!manifest.source?.fla && !manifest.source?.flaSha256
      && manifest.source?.pairedFlaStatus === "missing",
    `${label}: SWF-only migration manifest unexpectedly binds an FLA`);
  }
  invariant(manifest.runtime?.swfSignature === machineItem.swf.header.signature
    && manifest.runtime?.swfVersion === machineItem.swf.header.version
    && manifest.runtime?.declaredFileLength === machineItem.swf.header.declaredUncompressedBytes
    && manifest.runtime?.stage?.width === machineItem.swf.header.stage.width
    && manifest.runtime?.stage?.height === machineItem.swf.header.stage.height
    && manifest.runtime?.fps === machineItem.swf.header.fps
    && manifest.runtime?.frameCount === machineItem.swf.header.rootFrameCount,
  `${label}: migration manifest intake runtime identity drifted`);

  const sourceAuditBinding = manifest.audit?.machineEvidence?.g4L3SourceAudit;
  invariant(sourceAuditBinding === undefined,
    `${label}: artifact-only source audit found an owned migration manifest binding`);
  const ownedScriptEntries = (manifest.runtime?.scripts || [])
    .filter((entry) => entry?.source === SOURCE_AUDIT_OWNED_EVIDENCE);
  const ownedAuditEntries = ["masks", "morphs", "filters", "networkCalls"]
    .flatMap((key) => (manifest.audit?.[key] || [])
      .filter((entry) => entry?.source === SOURCE_AUDIT_OWNED_EVIDENCE));
  invariant(ownedScriptEntries.length === 0 && ownedAuditEntries.length === 0,
    `${label}: artifact-only source audit found owned migration manifest evidence`);
  invariant(manifest.acceptance?.engineeringReview?.decision !== "accepted"
    && manifest.acceptance?.humanVisualReview?.decision !== "accepted"
    && manifest.acceptance?.ownerReview?.decision !== "accepted",
  `${label}: a review gate is unexpectedly accepted`);

  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    batchId: member.batchId,
    shardId: member.shardId,
    sourceKind: machineItem.source.sourceKind,
    workspace: `migrations/${member.animationId}`,
    migrationStatus: manifest.status,
    machineAuditSetSha256: machineItem.__auditSetSha256,
    machineAuditFingerprintSha256: machineItem.auditFingerprintSha256,
    workspaceArtifact: {
      file: artifactPhysical.file,
      bytes: artifactPhysical.bytes,
      sha256: artifactPhysical.sha256,
      artifactFingerprintSha256: artifact.artifactFingerprintSha256,
      materializer: artifact.provenance.materializer,
    },
    migrationManifestBoundary: {
      file: manifestPhysical.file,
      bytes: manifestPhysical.bytes,
      sha256: manifestPhysical.sha256,
      inspectionMode: "read-only-identity-and-ownership-boundary",
      sourceAuditBindingExpected: false,
      sourceAuditBindingObserved: false,
      sourceAuditOwnedEvidenceEntries: 0,
      acceptanceEffect: "none",
    },
    readiness: {
      machineAuditComplete: true,
      machineAuditMeaning: "static-artifact-completeness-only",
      workOnlyAuthoringAuditEstablished: false,
      authoringAuditDispositionComplete: false,
      authoritativeRuntimeComplete: false,
      finalSpecificationReady: false,
      implementationAuthorized: false,
      strictComplete: false,
    },
  };
}

async function readWorkspaceItems({
  root,
  release,
  machineReport,
  releaseBinding,
  machineBinding,
  reportBindingsByKey,
  byKey,
  sourceAuditMaterializer,
  inventoryMaterializer,
  canonicalAssetInventoryTemplate,
}) {
  const items = [];
  const machineItems = machineReport.items.map((item) => ({
    ...item,
    __auditSetSha256: machineReport.summary.auditSetSha256,
  }));
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const machineItem = machineItems[index];
    const workspace = `migrations/${member.animationId}`;
    const [
      artifactPhysical,
      manifestPhysical,
      inventoryReceiptPhysical,
      machineAssetPhysical,
      machineAudioPhysical,
      canonicalAssetPhysical,
      canonicalAudioPhysical,
    ] = await Promise.all([
      readJsonBinding(root, `${workspace}/${WORKSPACE_ARTIFACT_RELATIVE_PATH}`,
        `${member.animationId} workspace source audit`),
      readJsonBinding(root, `${workspace}/migration.json`, `${member.animationId} migration manifest`),
      readJsonBinding(root, `${workspace}/${WORKSPACE_INVENTORY_RECEIPT_RELATIVE_PATH}`,
        `${member.animationId} workspace inventory receipt`),
      readBinding(root, `${workspace}/${WORKSPACE_MACHINE_ASSET_RELATIVE_PATH}`,
        `${member.animationId} machine SWF-definition inventory`),
      readBinding(root, `${workspace}/${WORKSPACE_MACHINE_AUDIO_RELATIVE_PATH}`,
        `${member.animationId} machine audio-source-candidate inventory`),
      readBinding(root, `${workspace}/${WORKSPACE_CANONICAL_ASSET_RELATIVE_PATH}`,
        `${member.animationId} canonical asset inventory`),
      readBinding(root, `${workspace}/${WORKSPACE_CANONICAL_AUDIO_RELATIVE_PATH}`,
        `${member.animationId} canonical audio inventory`),
    ]);
    invariant(artifactPhysical.value.provenance.lessonReleaseManifest.sha256 === releaseBinding.sha256
      && artifactPhysical.value.provenance.lessonReleaseManifest.bytes === releaseBinding.bytes,
    `${member.animationId}: workspace release-manifest physical binding drifted`);
    invariant(artifactPhysical.value.provenance.upstreamMachineAudit.sha256 === machineBinding.sha256
      && artifactPhysical.value.provenance.upstreamMachineAudit.bytes === machineBinding.bytes,
    `${member.animationId}: workspace machine-audit physical binding drifted`);
    const materializer = artifactPhysical.value.provenance.materializer;
    invariant(materializer?.path === sourceAuditMaterializer.file
      && materializer.sha256 === sourceAuditMaterializer.sha256
      && materializer.version === 2,
    `${member.animationId}: workspace source-audit materializer binding is stale`);
    const sourceAuditItem = validateWorkspaceAuditBinding({
      member,
      machineItem,
      artifact: artifactPhysical.value,
      artifactPhysical,
      manifest: manifestPhysical.value,
      manifestPhysical,
    });
    sourceAuditItem.workspaceInventory = validateWorkspaceInventoryBinding({
      member,
      receipt: inventoryReceiptPhysical.value,
      receiptPhysical: inventoryReceiptPhysical,
      machineAssetPhysical,
      machineAudioPhysical,
      canonicalAssetPhysical,
      canonicalAudioPhysical,
      manifest: manifestPhysical.value,
      expectedBindings: {
        lessonRelease: {
          file: releaseBinding.file,
          bytes: releaseBinding.bytes,
          sha256: releaseBinding.sha256,
        },
        assetDefinitionCensus: reportBindingsByKey.assetDefinitionCensus,
        embeddedAudioArchive: reportBindingsByKey.embeddedAudioArchive,
        catalogAudioMediaProbe: reportBindingsByKey.catalogAudioMediaProbe,
        audioCasMediaProbe: reportBindingsByKey.audioCasMediaProbe,
        canonicalAssetInventoryTemplate,
      },
      generatorPhysical: inventoryMaterializer,
      censusItem: byKey.assetDefinitionCensus.items[index],
      embeddedItem: byKey.embeddedAudioArchive.items[index],
    });
    items.push(sourceAuditItem);
  }
  return items;
}

function evidenceSetProjection(inputBindings, items) {
  return {
    inputBindings,
    workspaceArtifactSet: items.map((item) => ({
      ordinal: item.ordinal,
      animationId: item.animationId,
      assetId: item.assetId,
      machineAuditSetSha256: item.machineAuditSetSha256,
      machineAuditFingerprintSha256: item.machineAuditFingerprintSha256,
      workspaceArtifact: {
        file: item.workspaceArtifact.file,
        bytes: item.workspaceArtifact.bytes,
        sha256: item.workspaceArtifact.sha256,
        artifactFingerprintSha256: item.workspaceArtifact.artifactFingerprintSha256,
      },
      migrationManifestBoundary: {
        file: item.migrationManifestBoundary.file,
        bytes: item.migrationManifestBoundary.bytes,
        sha256: item.migrationManifestBoundary.sha256,
        sourceAuditBindingObserved: item.migrationManifestBoundary.sourceAuditBindingObserved,
        sourceAuditOwnedEvidenceEntries: item.migrationManifestBoundary.sourceAuditOwnedEvidenceEntries,
      },
      workspaceInventory: item.workspaceInventory,
      workOnlyAuthoringEvidence: item.workOnlyAuthoringEvidence,
    })),
  };
}

export async function buildM2SourceAuditReadinessReport({root = PROJECT_ROOT} = {}) {
  const resolvedRoot = path.resolve(root);
  const releaseBinding = await readJsonBinding(resolvedRoot, RELEASE_MANIFEST_PATH, "lesson release manifest");
  const release = validateReleaseManifest(releaseBinding.value);
  const reports = [];
  for (const definition of REQUIRED_REPORTS) reports.push(await readRequiredReport(resolvedRoot, definition));
  const {byKey} = await validateUpstreamReports(resolvedRoot, release, reports);
  const machineEntry = reports.find((entry) => entry.definition.key === "machineSourceAudits");
  const reportBindingsByKey = Object.fromEntries(reports.map((entry) => [entry.definition.key, entry.binding]));
  const [sourceAuditMaterializer, inventoryMaterializer, canonicalAssetInventoryTemplate] = await Promise.all([
    readBinding(resolvedRoot, SOURCE_AUDIT_MATERIALIZER_PATH, "workspace source-audit materializer"),
    readBinding(resolvedRoot, INVENTORY_MATERIALIZER_PATH, "workspace inventory materializer"),
    readBinding(resolvedRoot, CANONICAL_ASSET_INVENTORY_TEMPLATE_PATH, "canonical asset-inventory template"),
  ]);
  const canonicalAssetTemplateBinding = {
    file: canonicalAssetInventoryTemplate.file,
    bytes: canonicalAssetInventoryTemplate.bytes,
    sha256: canonicalAssetInventoryTemplate.sha256,
  };
  const items = await readWorkspaceItems({
    root: resolvedRoot,
    release,
    machineReport: byKey.machineSourceAudits,
    releaseBinding,
    machineBinding: machineEntry.binding,
    reportBindingsByKey,
    byKey,
    sourceAuditMaterializer,
    inventoryMaterializer,
    canonicalAssetInventoryTemplate: canonicalAssetTemplateBinding,
  });
  const authoringByAnimationId = new Map(
    byKey.animateAuthoringAuditIndex.items.map((item) => [item.animationId, item]),
  );
  for (const item of items) {
    const result = authoringByAnimationId.get(item.animationId) ?? null;
    const required = item.sourceKind === "fla+swf";
    invariant(Boolean(result) === required,
      `${item.animationId}: work-only authoring applicability drifted`);
    item.workOnlyAuthoringEvidence = required ? {
      applicability: "required-fla-backed",
      status: "verified-work-only-authoring-audit",
      sourcePairReverified: true,
      selectedPassingAudit: {
        evidenceId: result.selectedPassingAudit.evidenceId,
        runId: result.selectedPassingAudit.runId,
        receipt: result.selectedPassingAudit.receipt,
        workEvidence: result.selectedPassingAudit.workEvidence,
        artifacts: result.selectedPassingAudit.artifacts,
        animateVersion: result.selectedPassingAudit.animateVersion,
        nativeMovie: result.selectedPassingAudit.nativeMovie,
      },
      originalRuntimeEvidence: false,
      authoringAcceptance: false,
      strictAcceptanceEffect: false,
    } : {
      applicability: "not-applicable-swf-only",
      status: "not-applicable-swf-only",
      sourcePairReverified: false,
      selectedPassingAudit: null,
      originalRuntimeEvidence: false,
      authoringAcceptance: false,
      strictAcceptanceEffect: false,
    };
    item.readiness.workOnlyAuthoringAuditEstablished = required;
    item.readiness.authoringAuditDispositionComplete = true;
  }
  const generator = await readBinding(resolvedRoot, posixRelative(resolvedRoot, GENERATOR_PATH), "M2 readiness generator");
  const inputBindings = {
    lessonReleaseManifest: {
      file: releaseBinding.file,
      bytes: releaseBinding.bytes,
      sha256: releaseBinding.sha256,
      schemaVersion: releaseBinding.value.schemaVersion,
    },
    reports: reportBindingsByKey,
    materializers: {
      workspaceSourceAudits: {
        file: sourceAuditMaterializer.file,
        bytes: sourceAuditMaterializer.bytes,
        sha256: sourceAuditMaterializer.sha256,
        version: 2,
      },
      workspaceInventories: {
        file: inventoryMaterializer.file,
        bytes: inventoryMaterializer.bytes,
        sha256: inventoryMaterializer.sha256,
        version: 2,
      },
    },
    canonicalAssetInventoryTemplate: canonicalAssetTemplateBinding,
  };
  const evidenceSetSha256 = sha256(stableJson(evidenceSetProjection(inputBindings, items)));
  const report = {
    schemaVersion: 2,
    reportType: REPORT_BASENAME,
    generator: {
      file: generator.file,
      bytes: generator.bytes,
      sha256: generator.sha256,
      version: 2,
    },
    scope: {
      releaseId: RELEASE_ID,
      queueId: release.queueId,
      grade: 4,
      lesson: 3,
      titleRaw: release.titleDisplay,
      canonicalMembers: 40,
      activePages: 39,
      courseShells: 1,
      flaBacked: 29,
      swfOnly: 11,
      batchSizes: [25, 15],
      publicationMode: "atomic",
    },
    inputBindings,
    bindingPolicy: {
      currentScopeAuthority: RELEASE_MANIFEST_PATH,
      exactCurrentScopeRevalidated: true,
      workspaceSourceAuditArchitecture: "artifact-only",
      migrationManifestSourceAuditBindingsExpected: 0,
      machineInventoryOutputsRestrictedToAuditMachine: true,
      canonicalInventoryFilesAreReadOnlyBindings: true,
      supersededWorkflowSnapshotsNotUsedAsM2SourceAuthority: [
        "reports/g4-l3-machine-source-audits.json#/sourceBindings/batches",
        "reports/g4-l3-swf-asset-definition-census.json#/sourceBindings/workCards",
        "reports/g4-l3-paired-authoring-source-bindings.json#/inputBindings/batchSpecificationReadiness",
      ],
      statement: "Those workflow hashes predate the 40-workspace/release-framework materialization. This report replaces their scope role with exact current release/order checks and independently re-hashes each artifact-only source audit, v2 inventory receipt, machine inventory output, and canonical read-only inventory binding. A migration.json source-audit binding is forbidden, not required.",
    },
    evidenceSetSha256,
    summary: {
      canonicalMembers: 40,
      orderedReleaseMembersValidated: 40,
      upstreamEvidenceReportsValidated: REQUIRED_REPORTS.length,
      workspaceSourceAuditArtifactsValidated: items.length,
      migrationManifestsInspectedReadOnly: items.length,
      migrationSourceAuditBindingsExpected: 0,
      migrationSourceAuditBindingsObserved: items.filter((item) =>
        item.migrationManifestBoundary.sourceAuditBindingObserved).length,
      sourceAuditOwnedManifestEntriesObserved: items.reduce((sum, item) =>
        sum + item.migrationManifestBoundary.sourceAuditOwnedEvidenceEntries, 0),
      workspaceInventoryReceiptsValidated: items.length,
      workspaceMachineInventoryOutputsValidated: items.length * 2,
      workspaceCanonicalInventoryReadOnlyBindingsValidated: items.length * 2,
      workspaceInventoryArtifactsValidated: items.length * 3,
      machineAuditCompleteMembers: items.filter((item) => item.readiness.machineAuditComplete).length,
      machineAuditSetSha256: byKey.machineSourceAudits.summary.auditSetSha256,
      verifiedWorkOnlyAuthoringAudits: items.filter((item) =>
        item.readiness.workOnlyAuthoringAuditEstablished).length,
      pendingApplicableAuthoringAudits: items.filter((item) =>
        item.sourceKind === "fla+swf" && !item.readiness.workOnlyAuthoringAuditEstablished).length,
      authoringAuditNotApplicableMembers: items.filter((item) =>
        item.sourceKind === "swf-only").length,
      authoringAuditDispositionCompleteMembers: items.filter((item) =>
        item.readiness.authoringAuditDispositionComplete).length,
      authoritativeRuntimeCompleteMembers: 0,
      finalSpecificationReadyMembers: 0,
      implementationAuthorizedMembers: 0,
      strictCompleteMembers: 0,
      exactSourceOperations: byKey.sourceOperationIndexV2.summary.exactOperationCount,
      staticSourceEventFiles: byKey.staticSourceEventIndex.summary.indexedSourceEventFiles,
      embeddedAudioUnits: byKey.embeddedAudioArchive.summary.audioUnitCount,
      embeddedAudioCasObjects: byKey.embeddedAudioArchive.archive.archivedFileCount,
      assetDefinitions: byKey.assetDefinitionCensus.summary.totalDefinitions,
      pairedAuthoringBindingsPrepared: byKey.pairedAuthoringSourceBindings.summary.verifiedBindings,
      completedAuthoringAudits: byKey.animateAuthoringAuditIndex.summary.verifiedWorkOnlyAuthoringAudits,
      workspaceMachineAssetDefinitionRows: items.reduce((sum, item) =>
        sum + item.workspaceInventory.machineOutputs.assetDefinitions.rowCount, 0),
      workspaceMachineEmbeddedAudioCandidateRows: items.reduce((sum, item) =>
        sum + item.workspaceInventory.machineOutputs.audioSourceCandidates.embeddedAudioRows, 0),
      workspaceMachineCatalogAudioCandidateRows: items.reduce((sum, item) =>
        sum + item.workspaceInventory.machineOutputs.audioSourceCandidates.catalogAssociationRows, 0),
    },
    readiness: {
      machineAuditComplete: true,
      machineAuditMeaning: "static-artifact-completeness-only",
      workOnlyAuthoringAuditCoverageComplete: true,
      authoringAccepted: false,
      authoritativeRuntimeComplete: false,
      finalSpecificationReady: false,
      implementationAuthorized: false,
      strictComplete: false,
    },
    authorityBoundary: {
      acceptanceNeutral: true,
      staticMachineEvidenceBound: true,
      workOnlyAuthoringEvidenceBound: true,
      authoringAuditIsOriginalRuntimeProof: false,
      sourceAssetsModified: false,
      migrationStatusesModifiedByThisAggregate: false,
      migrationManifestSourceAuditBindings: 0,
      sourceAuditOwnedManifestMutations: 0,
      canonicalInventoryFilesModifiedByMaterializer: false,
      authoringAuthorityEstablished: false,
      authoritativeRuntimeEstablished: false,
      finalSpecificationAuthorityEstablished: false,
      implementationAuthorityEstablished: false,
      reviewOrApprovalEstablished: false,
      productRegistryModified: false,
      strictAcceptanceEffect: false,
    },
    items,
    acceptance: {
      acceptanceNeutral: true,
      machineAuditCompletenessEstablished: true,
      authoringAccepted: false,
      authoritativeRuntimeAccepted: false,
      finalSpecificationAccepted: false,
      implementationAccepted: false,
      visualOrBehaviorParityAccepted: false,
      audioAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "This report binds 40 current static source-audit artifacts, their hash-bound v2 machine-inventory evidence, and 29/29 applicable work-only Adobe Animate authoring-structure audits. It creates no migration.json binding. The Animate audits are not authoring acceptance, shipped-SWF execution, FLA/SWF equivalence, authoritative original-runtime evidence, final specification, implementation authorization, fidelity or audio acceptance, human/owner review, or strict migration completion.",
    },
  };
  return validateM2SourceAuditReadinessReport(report);
}

export function validateM2SourceAuditReadinessReport(report) {
  invariant(report.schemaVersion === 2 && report.reportType === REPORT_BASENAME
    && report.generator?.file === `scripts/build-${REPORT_BASENAME}.mjs`
    && report.generator?.version === 2 && isSha256(report.generator?.sha256),
    "M2 source-audit readiness report identity drifted");
  invariant(report.scope.releaseId === RELEASE_ID && report.scope.canonicalMembers === 40
    && report.scope.activePages === 39 && report.scope.courseShells === 1
    && report.scope.flaBacked === 29 && report.scope.swfOnly === 11
    && exact(report.scope.batchSizes) === exact([25, 15]) && report.scope.publicationMode === "atomic",
  "M2 source-audit readiness scope drifted");
  invariant(report.summary.canonicalMembers === 40
    && report.summary.orderedReleaseMembersValidated === 40
    && report.summary.upstreamEvidenceReportsValidated === REQUIRED_REPORTS.length
    && report.summary.workspaceSourceAuditArtifactsValidated === 40
    && report.summary.migrationManifestsInspectedReadOnly === 40
    && report.summary.migrationSourceAuditBindingsExpected === 0
    && report.summary.migrationSourceAuditBindingsObserved === 0
    && report.summary.sourceAuditOwnedManifestEntriesObserved === 0
    && report.summary.workspaceInventoryReceiptsValidated === 40
    && report.summary.workspaceMachineInventoryOutputsValidated === 80
    && report.summary.workspaceCanonicalInventoryReadOnlyBindingsValidated === 80
    && report.summary.workspaceInventoryArtifactsValidated === 120
    && report.summary.machineAuditCompleteMembers === 40
    && isSha256(report.summary.machineAuditSetSha256),
  "M2 source-audit completeness summary drifted");
  invariant(report.summary.workspaceMachineAssetDefinitionRows === 8068
    && report.summary.workspaceMachineEmbeddedAudioCandidateRows === 359
    && report.summary.workspaceMachineCatalogAudioCandidateRows === 359,
  "M2 workspace inventory totals drifted");
  invariant(report.summary.verifiedWorkOnlyAuthoringAudits === 29
    && report.summary.completedAuthoringAudits === 29
    && report.summary.pendingApplicableAuthoringAudits === 0
    && report.summary.authoringAuditNotApplicableMembers === 11
    && report.summary.authoringAuditDispositionCompleteMembers === 40
    && report.summary.authoritativeRuntimeCompleteMembers === 0
    && report.summary.finalSpecificationReadyMembers === 0
    && report.summary.implementationAuthorizedMembers === 0
    && report.summary.strictCompleteMembers === 0,
  "M2 source-audit report promoted a later gate count");
  invariant(report.readiness.machineAuditComplete === true
    && report.readiness.machineAuditMeaning === "static-artifact-completeness-only"
    && report.readiness.workOnlyAuthoringAuditCoverageComplete === true
    && report.readiness.authoringAccepted === false,
  "M2 machine/authoring evidence coverage drifted");
  assertAllFalse({
    authoritativeRuntimeComplete: report.readiness.authoritativeRuntimeComplete,
    finalSpecificationReady: report.readiness.finalSpecificationReady,
    implementationAuthorized: report.readiness.implementationAuthorized,
    strictComplete: report.readiness.strictComplete,
  }, "M2 later readiness gates");
  invariant(Array.isArray(report.items) && report.items.length === 40,
    "M2 source-audit item ledger must contain exactly 40 items");
  invariant(new Set(report.items.map((item) => item.animationId)).size === 40
    && new Set(report.items.map((item) => item.assetId)).size === 40,
  "M2 source-audit item identities are not unique");
  for (let index = 0; index < report.items.length; index += 1) {
    const item = report.items[index];
    const workspace = `migrations/${item.animationId}`;
    invariant(item.ordinal === index + 1 && item.workspace === workspace
      && item.machineAuditSetSha256 === report.summary.machineAuditSetSha256
      && isSha256(item.machineAuditFingerprintSha256)
      && item.readiness.machineAuditComplete === true
      && item.readiness.machineAuditMeaning === "static-artifact-completeness-only",
      `M2 item ${index + 1}: identity or machine-audit readiness drifted`);
    const authoringRequired = item.sourceKind === "fla+swf";
    invariant(item.readiness.workOnlyAuthoringAuditEstablished === authoringRequired
      && item.readiness.authoringAuditDispositionComplete === true
      && item.workOnlyAuthoringEvidence.applicability
        === (authoringRequired ? "required-fla-backed" : "not-applicable-swf-only")
      && item.workOnlyAuthoringEvidence.status
        === (authoringRequired ? "verified-work-only-authoring-audit" : "not-applicable-swf-only")
      && Boolean(item.workOnlyAuthoringEvidence.selectedPassingAudit) === authoringRequired
      && item.workOnlyAuthoringEvidence.originalRuntimeEvidence === false
      && item.workOnlyAuthoringEvidence.authoringAcceptance === false
      && item.workOnlyAuthoringEvidence.strictAcceptanceEffect === false,
    `${item.animationId}: work-only authoring disposition drifted`);
    if (authoringRequired) {
      const selected = item.workOnlyAuthoringEvidence.selectedPassingAudit;
      invariant(typeof selected.evidenceId === "string" && typeof selected.runId === "string"
        && isSha256(selected.receipt?.sha256) && isSha256(selected.workEvidence?.sha256)
        && isSha256(selected.artifacts?.marker?.sha256)
        && isSha256(selected.artifacts?.report?.sha256) && isSha256(selected.artifacts?.png?.sha256)
        && typeof selected.animateVersion === "string" && selected.nativeMovie?.fps === 12,
      `${item.animationId}: selected work-only authoring evidence is incomplete`);
    }
    assertAllFalse({
      authoritativeRuntimeComplete: item.readiness.authoritativeRuntimeComplete,
      finalSpecificationReady: item.readiness.finalSpecificationReady,
      implementationAuthorized: item.readiness.implementationAuthorized,
      strictComplete: item.readiness.strictComplete,
    }, `${item.animationId} later readiness gates`);
    invariant(item.migrationStatus === "preserved"
      && item.migrationManifestBoundary.file === `${workspace}/migration.json`
      && item.migrationManifestBoundary.inspectionMode === "read-only-identity-and-ownership-boundary"
      && item.migrationManifestBoundary.sourceAuditBindingExpected === false
      && item.migrationManifestBoundary.sourceAuditBindingObserved === false
      && item.migrationManifestBoundary.sourceAuditOwnedEvidenceEntries === 0
      && item.migrationManifestBoundary.acceptanceEffect === "none",
    `${item.animationId}: artifact-only migration-manifest boundary drifted`);
    invariant(item.workspaceArtifact.file === `${workspace}/${WORKSPACE_ARTIFACT_RELATIVE_PATH}`
      && item.workspaceArtifact.materializer?.path === SOURCE_AUDIT_MATERIALIZER_PATH
      && item.workspaceArtifact.materializer?.version === 2
      && item.workspaceArtifact.materializer?.sha256
        === report.inputBindings.materializers.workspaceSourceAudits.sha256,
    `${item.animationId}: source-audit artifact path or materializer drifted`);
    invariant(item.workspaceInventory.receipt.file === `${workspace}/${WORKSPACE_INVENTORY_RECEIPT_RELATIVE_PATH}`
      && item.workspaceInventory.receipt.schemaVersion === 2
      && item.workspaceInventory.machineOutputs.assetDefinitions.file
        === `${workspace}/${WORKSPACE_MACHINE_ASSET_RELATIVE_PATH}`
      && item.workspaceInventory.machineOutputs.audioSourceCandidates.file
        === `${workspace}/${WORKSPACE_MACHINE_AUDIO_RELATIVE_PATH}`
      && item.workspaceInventory.canonicalReadOnlyBindings.assetInventory.file
        === `${workspace}/${WORKSPACE_CANONICAL_ASSET_RELATIVE_PATH}`
      && item.workspaceInventory.canonicalReadOnlyBindings.audioInventory.file
        === `${workspace}/${WORKSPACE_CANONICAL_AUDIO_RELATIVE_PATH}`,
    `${item.animationId}: workspace inventory path architecture drifted`);
    invariant(item.workspaceInventory.canonicalReadOnlyBindings.assetInventory.changedByMaterializer === false
      && item.workspaceInventory.canonicalReadOnlyBindings.audioInventory.changedByMaterializer === false,
    `${item.animationId}: canonical inventory was represented as a generated output`);
    const assetOutput = item.workspaceInventory.machineOutputs.assetDefinitions;
    const audioOutput = item.workspaceInventory.machineOutputs.audioSourceCandidates;
    invariant(Number.isInteger(assetOutput.rowCount) && assetOutput.rowCount >= 0
      && Number.isInteger(audioOutput.rowCount) && audioOutput.rowCount >= 0
      && audioOutput.rowCount === audioOutput.embeddedAudioRows + audioOutput.catalogAssociationRows,
    `${item.animationId}: workspace machine-inventory row counts drifted`);
    invariant(isSha256(item.workspaceArtifact.sha256)
      && isSha256(item.workspaceArtifact.artifactFingerprintSha256)
      && isSha256(item.migrationManifestBoundary.sha256)
      && isSha256(item.workspaceInventory.receipt.sha256)
      && isSha256(item.workspaceInventory.receipt.reportFingerprintSha256)
      && isSha256(assetOutput.sha256)
      && isSha256(audioOutput.sha256)
      && isSha256(item.workspaceInventory.canonicalReadOnlyBindings.assetInventory.sha256)
      && isSha256(item.workspaceInventory.canonicalReadOnlyBindings.audioInventory.sha256),
    `${item.animationId}: ledger hashes are invalid`);
  }
  invariant(report.authorityBoundary.acceptanceNeutral === true
    && report.authorityBoundary.staticMachineEvidenceBound === true
    && report.authorityBoundary.workOnlyAuthoringEvidenceBound === true
    && report.authorityBoundary.authoringAuditIsOriginalRuntimeProof === false
    && report.authorityBoundary.sourceAssetsModified === false
    && report.authorityBoundary.migrationStatusesModifiedByThisAggregate === false
    && report.authorityBoundary.migrationManifestSourceAuditBindings === 0
    && report.authorityBoundary.sourceAuditOwnedManifestMutations === 0
    && report.authorityBoundary.canonicalInventoryFilesModifiedByMaterializer === false
    && report.authorityBoundary.authoringAuthorityEstablished === false
    && report.authorityBoundary.authoritativeRuntimeEstablished === false
    && report.authorityBoundary.finalSpecificationAuthorityEstablished === false
    && report.authorityBoundary.implementationAuthorityEstablished === false
    && report.authorityBoundary.reviewOrApprovalEstablished === false
    && report.authorityBoundary.productRegistryModified === false
    && report.authorityBoundary.strictAcceptanceEffect === false,
  "M2 source-audit authority boundary was promoted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.machineAuditCompletenessEstablished === true
    && report.acceptance.authoringAccepted === false
    && report.acceptance.authoritativeRuntimeAccepted === false
    && report.acceptance.finalSpecificationAccepted === false
    && report.acceptance.implementationAccepted === false
    && report.acceptance.visualOrBehaviorParityAccepted === false
    && report.acceptance.audioAccepted === false
    && report.acceptance.humanReviewAccepted === false
    && report.acceptance.ownerAccepted === false
    && report.acceptance.strictMigrationComplete === false,
  "M2 source-audit acceptance boundary was promoted");
  invariant(report.inputBindings.lessonReleaseManifest.file === RELEASE_MANIFEST_PATH
    && isSha256(report.inputBindings.lessonReleaseManifest.sha256)
    && exact(Object.keys(report.inputBindings.reports).sort())
      === exact(REQUIRED_REPORTS.map(({key}) => key).sort())
    && report.inputBindings.materializers.workspaceSourceAudits.file === SOURCE_AUDIT_MATERIALIZER_PATH
    && report.inputBindings.materializers.workspaceSourceAudits.version === 2
    && isSha256(report.inputBindings.materializers.workspaceSourceAudits.sha256)
    && report.inputBindings.materializers.workspaceInventories.file === INVENTORY_MATERIALIZER_PATH
    && report.inputBindings.materializers.workspaceInventories.version === 2
    && isSha256(report.inputBindings.materializers.workspaceInventories.sha256)
    && report.inputBindings.canonicalAssetInventoryTemplate.file === CANONICAL_ASSET_INVENTORY_TEMPLATE_PATH
    && isSha256(report.inputBindings.canonicalAssetInventoryTemplate.sha256),
  "M2 source-audit input bindings are incomplete");
  invariant(report.bindingPolicy.currentScopeAuthority === RELEASE_MANIFEST_PATH
    && report.bindingPolicy.exactCurrentScopeRevalidated === true
    && report.bindingPolicy.workspaceSourceAuditArchitecture === "artifact-only"
    && report.bindingPolicy.migrationManifestSourceAuditBindingsExpected === 0
    && report.bindingPolicy.machineInventoryOutputsRestrictedToAuditMachine === true
    && report.bindingPolicy.canonicalInventoryFilesAreReadOnlyBindings === true
    && report.bindingPolicy.supersededWorkflowSnapshotsNotUsedAsM2SourceAuthority.length === 3,
  "M2 source-audit binding policy drifted");
  invariant(isSha256(report.evidenceSetSha256)
    && report.evidenceSetSha256 === sha256(stableJson(evidenceSetProjection(report.inputBindings, report.items))),
  "M2 source-audit evidence-set SHA-256 is missing or stale");
  return report;
}

export function renderMarkdown(report) {
  validateM2SourceAuditReadinessReport(report);
  const rows = report.items.map((item) => {
    const authoring = item.readiness.workOnlyAuthoringAuditEstablished
      ? "verified work-only"
      : "n/a (SWF-only)";
    return `| ${item.ordinal} | \`${item.animationId}\` | ${item.sourceKind} | \`${item.workspaceArtifact.sha256}\` | v2 / 2 machine / 2 canonical RO | 0 | ${item.readiness.machineAuditComplete ? "yes" : "no"} | ${authoring} | no | no | no | no |`;
  }).join("\n");
  const bindings = Object.entries(report.inputBindings.reports).map(([key, binding]) =>
    `| ${key} | \`${binding.file}\` | \`${binding.sha256}\` |`,
  ).join("\n");
  return `# G4 L3 M2 Source-Audit Readiness\n\n`
    + `This deterministic, acceptance-neutral ledger validates the exact **40-member** Grade 4 Lesson 3 release in source order: **39 active pages + 1 course shell**, split **25 + 15**.\n\n`
    + `## Result\n\n`
    + `- Machine audit complete: **40/40 (true, static artifact completeness only)**. Every workspace has a current, hash-bound \`${WORKSPACE_ARTIFACT_RELATIVE_PATH}\` artifact.\n`
    + `- \`migration.json\` source-audit bindings: **0 expected / 0 observed**. All 40 manifests were inspected only as read-only identity and ownership boundaries; source-audit-owned manifest evidence entries: **0**.\n`
    + `- Machine inventories: **40/40 schema-v2 receipts**, **80/80 machine CSV outputs** below \`audit/machine/\`, and **120/120 generated inventory artifacts** including receipts. Machine rows: **${report.summary.workspaceMachineAssetDefinitionRows.toLocaleString("en-US")}** asset definitions, **${report.summary.workspaceMachineEmbeddedAudioCandidateRows}** embedded-audio candidates, and **${report.summary.workspaceMachineCatalogAudioCandidateRows}** catalog-audio candidates.\n`
    + `- Canonical inventories: **80/80 read-only bindings** for \`asset-inventory.csv\` and \`audio-inventory.csv\`; they are preserved files, not machine outputs.\n`
    + `- Adobe Animate work-only authoring coverage: **29/29 applicable verified; 11 SWF-only n/a; 0 pending**. This is authoring-structure evidence, not authoring acceptance or runtime proof.\n`
    + `- Authoritative original runtime complete: **0/40 (false)**.\n`
    + `- Final specification ready: **0/40 (false)**.\n`
    + `- Implementation authorized: **0/40 (false)**.\n`
    + `- Strict complete: **0/40 (false)**.\n\n`
    + `Machine-audit completeness in this report still means static artifact completeness only. Separately, the current work-only Animate index proves 29/29 applicable authoring-structure audits. Neither evidence class proves original-runtime reachability, FLA/SWF equivalence, visual or behavioral parity, audio listening/synchronization, human review, owner acceptance, or migration completion.\n\n`
    + `Current scope authority is \`${report.bindingPolicy.currentScopeAuthority}\`. Three older workflow-snapshot bindings are explicitly excluded from M2 source authority and replaced by exact current release/order plus physical artifact checks; they are listed in the JSON report rather than silently treated as current.\n\n`
    + `## Evidence snapshot\n\n`
    + `- Exact static source operations: **${report.summary.exactSourceOperations.toLocaleString("en-US")}**.\n`
    + `- Indexed static source-event files: **${report.summary.staticSourceEventFiles.toLocaleString("en-US")}**.\n`
    + `- Embedded audio: **${report.summary.embeddedAudioUnits}** source units / **${report.summary.embeddedAudioCasObjects}** CAS objects.\n`
    + `- SWF asset definitions: **${report.summary.assetDefinitions.toLocaleString("en-US")}**.\n`
    + `- Paired FLA/SWF prepare-only bindings: **${report.summary.pairedAuthoringBindingsPrepared}/29**; verified work-only authoring audits: **${report.summary.completedAuthoringAudits}/29**.\n`
    + `- Evidence-set SHA-256: \`${report.evidenceSetSha256}\`.\n`
    + `- Upstream machine-audit set SHA-256: \`${report.summary.machineAuditSetSha256}\`.\n\n`
    + `## Bound upstream reports\n\n`
    + `| Key | File | SHA-256 |\n| --- | --- | --- |\n${bindings}\n\n`
    + `## Per-workspace ledger\n\n`
    + `| # | Animation | Source | Artifact SHA-256 | Inventory | Manifest binding | Machine artifact | Authoring | Runtime | Spec | Implement | Strict |\n`
    + `| ---: | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |\n${rows}\n\n`
    + `## Acceptance boundary\n\n${report.acceptance.statement}\n`;
}

export function parseArguments(argv) {
  const options = {
    check: false,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") {
      invariant(argv[index + 1], "--json-output requires a path");
      options.jsonOutput = path.resolve(PROJECT_ROOT, argv[++index]);
    } else if (argument === "--markdown-output") {
      invariant(argv[index + 1], "--markdown-output requires a path");
      options.markdownOutput = path.resolve(PROJECT_ROOT, argv[++index]);
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildM2SourceAuditReadinessReport();
  const jsonText = stableJson(report);
  const markdownText = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    invariant(currentJson === jsonText, `${posixRelative(PROJECT_ROOT, options.jsonOutput)} is stale`);
    invariant(currentMarkdown === markdownText, `${posixRelative(PROJECT_ROOT, options.markdownOutput)} is stale`);
    process.stdout.write(`PASS ${posixRelative(PROJECT_ROOT, options.jsonOutput)} and ${posixRelative(PROJECT_ROOT, options.markdownOutput)} are current\n`);
    return;
  }
  await Promise.all([
    writeFile(options.jsonOutput, jsonText),
    writeFile(options.markdownOutput, markdownText),
  ]);
  process.stdout.write(`Wrote ${posixRelative(PROJECT_ROOT, options.jsonOutput)} and ${posixRelative(PROJECT_ROOT, options.markdownOutput)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
