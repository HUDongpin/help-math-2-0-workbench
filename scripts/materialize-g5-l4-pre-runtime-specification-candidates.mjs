#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

import {collectSwfAssetDefinitions} from "./build-g4-l3-swf-asset-definition-census.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RELEASE_ID = "lesson-g05-l04-number-lines";
const GENERATOR_PATH =
  "scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs";
const PARSER_PATH = "scripts/build-g4-l3-swf-asset-definition-census.mjs";
const RELEASE_PATH = "catalog/lesson-releases.json";
const SOURCE_SCOPE_REPORT_PATH = "reports/g5-l4-source-scope-freeze.json";
const WORKSPACE_READINESS_PATH = "reports/g5-l4-workspace-readiness.json";
const STATIC_RECONCILIATION_RECEIPT_NAME =
  "g5-l4-m1-static-reconciliation-receipt.json";

export const OUTPUT_NAMES = Object.freeze({
  manifestRuntimeFacts: "g5-l4-pre-runtime-manifest-runtime-facts-candidate.json",
  assetDefinitionCensus: "g5-l4-pre-runtime-swf-asset-definition-census.json",
  definitionInventory: "g5-l4-pre-runtime-swf-definition-inventory.csv",
  scriptInventory: "g5-l4-pre-runtime-ffdec-script-inventory-candidate.json",
  dependencyInventory: "g5-l4-pre-runtime-static-dependency-inventory-candidate.json",
  briefStaticPrefill: "g5-l4-pre-runtime-migration-brief-static-prefill-candidate.md",
  receipt: "g5-l4-pre-runtime-specification-candidate-receipt.json",
});

const HISTORICAL_STATIC_RECEIPT_INPUTS = Object.freeze({
  manifestRuntimeFacts: "runtimeFactsCandidate",
  assetDefinitionCensus: "candidateAssetCensus",
  definitionInventory: "candidateDefinitionInventory",
  scriptInventory: "scriptCandidate",
  dependencyInventory: "dependencyCandidate",
  briefStaticPrefill: "briefCandidate",
  receipt: "candidateReceipt",
});

const CANONICAL_FILES = Object.freeze({
  migrationManifest: "migration.json",
  migrationBrief: "MIGRATION_BRIEF.md",
  assetInventory: "asset-inventory.csv",
  audioInventory: "audio-inventory.csv",
  keyframes: "keyframes.csv",
  fullFrameCoverage: "evidence/full-frame-coverage.json",
});

const MACHINE_INPUT_FILES = Object.freeze({
  sourceScopeBinding: "audit/machine/g5-l4-source-scope-binding.json",
  machineAudit: "audit/machine/report.json",
  frameDomainCandidates: "audit/machine/swf-frame-domain-candidates.json",
  swfmillSummary: "audit/machine/swfmill-summary.json",
  ffdecHeader: "audit/machine/ffdec-header.txt",
  ffdecScriptIndex: "audit/machine/ffdec-script-index.txt",
  ffdecScripts: "audit/machine/ffdec-scripts.txt.gz",
});

const ASSET_HEADER = Object.freeze([
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

const EXTERNAL_API_PATTERNS = Object.freeze({
  SharedObject: /\bSharedObject\b/g,
  fscommand: /\bfscommand\s*\(/g,
  getURL: /\bgetURL\s*\(/g,
  loadMovie: /\bloadMovie\s*\(/g,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
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

function jsonBytes(value) {
  return Buffer.from(stableJson(value));
}

function withFingerprint(value) {
  const fingerprint = sha256(stableJson(value));
  return {
    ...value,
    artifactFingerprintSha256: fingerprint,
    generatedMarker: `sha256:${fingerprint}`,
  };
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text)
    ? `"${text.replaceAll("\"", "\"\"")}"`
    : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(contained(root, absolutePath), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(root, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

function statIdentity(info, {includeSize = false} = {}) {
  return {
    dev: info.dev,
    ino: info.ino,
    mode: info.mode,
    uid: info.uid,
    gid: info.gid,
    ...(includeSize
      ? {size: info.size, nlink: info.nlink, mtimeMs: info.mtimeMs}
      : {}),
  };
}

function identitiesEqual(left, right) {
  const keys = new Set([
    ...Object.keys(left || {}),
    ...Object.keys(right || {}),
  ]);
  return [...keys].every((key) => left?.[key] === right?.[key]);
}

async function exists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readRawBinding(root, relativePath, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  const rootReal = await realpath(root);
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1,
    `${label}: must be an ordinary single-link file`,
  );
  invariant(
    contained(rootReal, await realpath(absolutePath)),
    `${label}: resolves outside project root`,
  );
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  const identity = statIdentity(after, {includeSize: true});
  invariant(
    identitiesEqual(
      statIdentity(before, {includeSize: true}),
      identity,
    ) &&
      after.size === bytes.length,
    `${label}: changed while being read`,
  );
  return {
    absolutePath,
    bytes,
    value: null,
    binding: {
      path: relativePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    guard: {
      absolutePath,
      relativePath,
      identity,
      bytes,
      sha256: sha256(bytes),
    },
  };
}

async function readJsonBinding(root, relativePath, label) {
  const raw = await readRawBinding(root, relativePath, label);
  try {
    raw.value = JSON.parse(raw.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
  return raw;
}

async function assertInputGuardUnchanged(guard) {
  const before = await lstat(guard.absolutePath);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1 &&
      identitiesEqual(
        guard.identity,
        statIdentity(before, {includeSize: true}),
      ),
    `input identity changed after preflight: ${guard.relativePath}`,
  );
  const bytes = await readFile(guard.absolutePath);
  const after = await lstat(guard.absolutePath);
  invariant(
    identitiesEqual(
      guard.identity,
      statIdentity(after, {includeSize: true}),
    ) &&
      bytes.equals(guard.bytes) &&
      sha256(bytes) === guard.sha256,
    `input bytes changed after preflight: ${guard.relativePath}`,
  );
}

async function assertInputGuardIdentityUnchanged(guard) {
  const info = await lstat(guard.absolutePath);
  invariant(
    info.isFile() &&
      !info.isSymbolicLink() &&
      info.nlink === 1 &&
      identitiesEqual(
        guard.identity,
        statIdentity(info, {includeSize: true}),
      ),
    `input identity changed after preflight: ${guard.relativePath}`,
  );
}

async function assertAllInputGuardsIdentityUnchanged(inputGuards) {
  for (const guard of inputGuards) {
    await assertInputGuardIdentityUnchanged(guard);
  }
}

async function assertAllInputGuardsUnchanged(inputGuards) {
  for (const guard of inputGuards) {
    await assertInputGuardUnchanged(guard);
  }
}

function selectRelease(document) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release manifest is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, `${RELEASE_ID}: release is not unique`);
  const release = matches[0];
  invariant(
    release.titleDisplay === "Number Lines" &&
      release.grade === 5 &&
      release.lesson === 4 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 55 &&
      Array.isArray(release.members) &&
      release.members.length === 55,
    `${RELEASE_ID}: exact 54-page plus shell release shape drifted`,
  );
  invariant(
    release.members.every(
      (member, index) =>
        member.ordinal === index + 1 &&
        /^[a-z0-9][a-z0-9-]+$/.test(member.animationId) &&
        member.assetId === `swf-${member.source.sha256}`,
    ) &&
      new Set(release.members.map(({animationId}) => animationId)).size === 55,
    `${RELEASE_ID}: ordered member identity drifted`,
  );
  return release;
}

function validateReleaseReports(release, sourceScope, workspaceReadiness) {
  invariant(
    sourceScope?.schemaVersion === 1 &&
      sourceScope.releaseId === RELEASE_ID &&
      sourceScope.summary?.memberCount === 55 &&
      sourceScope.summary?.strictCompleteCount === 0 &&
      sourceScope.summary?.publishedCount === 0 &&
      Array.isArray(sourceScope.members) &&
      sourceScope.members.length === 55,
    "G5 L4 source-scope report drifted",
  );
  invariant(
    workspaceReadiness?.schemaVersion === 1 &&
      workspaceReadiness.releaseId === RELEASE_ID &&
      workspaceReadiness.summary?.presentWorkspaceCount === 55 &&
      workspaceReadiness.summary?.draftValidationPassCount === 55 &&
      workspaceReadiness.summary?.implementationStartedCount === 0 &&
      workspaceReadiness.summary?.strictCompleteCount === 0 &&
      workspaceReadiness.summary?.publishedCount === 0 &&
      Array.isArray(workspaceReadiness.workspaces) &&
      workspaceReadiness.workspaces.length === 55,
    "G5 L4 workspace-readiness report drifted",
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
      `${member.animationId}: workspace readiness drifted`,
    );
  }
}

function validateCanonicalInputs(member, inputs) {
  const manifest = inputs.migrationManifest.value;
  const machine = inputs.machineAudit.value;
  const frameDomains = inputs.frameDomainCandidates.value;
  const scope = inputs.sourceScopeBinding.value;
  const coverage = inputs.fullFrameCoverage.value;
  const swfmill = inputs.swfmillSummary.value;
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source.swf.endsWith(member.source.path) &&
      manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "",
    `${member.animationId}: canonical manifest crossed the pre-runtime boundary`,
  );
  invariant(
    machine?.schemaVersion === 1 &&
      machine.animationId === member.animationId &&
      machine.auditStatus === "partial" &&
      machine.source?.expectedSha256 === member.source.sha256 &&
      machine.source?.hashMatches === true &&
      machine.migrationStatusUnchanged === true &&
      machine.findings?.runtimeCrossCheck?.allMatch === true &&
      machine.findings?.actionScriptVersion === "AS1/2",
    `${member.animationId}: machine audit drifted`,
  );
  invariant(
    frameDomains?.schemaVersion === 1 &&
      frameDomains.animationId === member.animationId &&
      frameDomains.source?.sha256 === member.source.sha256 &&
      frameDomains.root?.frameCount === manifest.runtime.frameCount &&
      frameDomains.summary?.completeRootReachableDomainInventory === false &&
      frameDomains.summary?.unresolvedReachabilityCount ===
        frameDomains.summary?.nestedDefinitionCount &&
      frameDomains.acceptanceEffects?.strictComplete === false &&
      frameDomains.acceptanceEffects?.published === false,
    `${member.animationId}: frame-domain candidates promoted runtime reachability`,
  );
  invariant(
    scope?.schemaVersion === 1 &&
      scope.releaseId === RELEASE_ID &&
      scope.member?.ordinal === member.ordinal &&
      scope.member?.animationId === member.animationId &&
      scope.member?.assetId === member.assetId &&
      scope.member?.source?.swf?.sha256 === member.source.sha256 &&
      scope.acceptanceEffects?.currentJavaScriptCandidate === false &&
      scope.acceptanceEffects?.strictComplete === false &&
      scope.acceptanceEffects?.published === false,
    `${member.animationId}: source-scope binding drifted`,
  );
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length === 2 &&
      coverage.requirements.every(
        (requirement) =>
          requirement.frameDomainId === "root" &&
          requirement.requiredRange?.firstFrame === 1 &&
          requirement.requiredRange?.lastFrame === manifest.runtime.frameCount &&
          requirement.status === "pending" &&
          requirement.baselineAuthority === "unresolved" &&
          requirement.capturedFrameCount === 0 &&
          requirement.missingFrames?.length === manifest.runtime.frameCount &&
          [
            "baselineCaptureManifest",
            "baselineCaptureManifestSha256",
            "captureManifest",
            "captureManifestSha256",
            "metricsFile",
            "metricsSha256",
          ].every((field) => requirement[field] === ""),
      ),
    `${member.animationId}: coverage is not the exact pending root-only scaffold`,
  );
  invariant(
    swfmill?.actionScriptVersion === "AS1/2" &&
      Number(swfmill.header?.frames) === manifest.runtime.frameCount &&
      Number(swfmill.header?.framerate) === manifest.runtime.fps &&
      swfmill.document?.version === String(manifest.runtime.swfVersion) &&
      swfmill.tagCounts &&
      typeof swfmill.tagCounts === "object",
    `${member.animationId}: swfmill summary drifted`,
  );
  invariant(
    manifest.runtime.scripts.length === 0 &&
      manifest.runtime.externalDependencies.length === 0 &&
      manifest.scenarios.length === 1 &&
      manifest.scenarios[0].id === "default" &&
      manifest.scenarios[0].description === "" &&
      manifest.baseline?.authority === "undecided",
    `${member.animationId}: canonical specification is no longer the expected unresolved scaffold`,
  );
}

function verifyMachineOutputBindings(member, machine, machineOutputs) {
  invariant(
    Array.isArray(machine.outputs) && machine.outputs.length > 0,
    `${member.animationId}: machine report output bindings are missing`,
  );
  const byPath = new Map(
    Object.values(machineOutputs).map((input) => [
      input.binding.path.split(`migrations/${member.animationId}/`)[1],
      input.binding,
    ]),
  );
  for (const output of machine.outputs) {
    const observed = byPath.get(output.path);
    if (!observed) continue;
    invariant(
      observed.bytes === output.bytes && observed.sha256 === output.sha256,
      `${member.animationId}: machine output binding drifted: ${output.path}`,
    );
  }
  for (const required of [
    "audit/machine/ffdec-header.txt",
    "audit/machine/ffdec-script-index.txt",
    "audit/machine/ffdec-scripts.txt.gz",
    "audit/machine/swf-frame-domain-candidates.json",
    "audit/machine/swfmill-summary.json",
  ]) {
    invariant(
      machine.outputs.some(({path}) => path === required),
      `${member.animationId}: machine report omits ${required}`,
    );
  }
}

export function parseFfdecScriptBundle(compressedBytes, machineReport) {
  const output = machineReport.outputs.find(
    ({path}) => path === "audit/machine/ffdec-scripts.txt.gz",
  );
  invariant(output, `${machineReport.animationId}: FFDec script output binding is absent`);
  invariant(
    sha256(compressedBytes) === output.sha256 &&
      compressedBytes.length === output.bytes,
    `${machineReport.animationId}: compressed FFDec script bundle drifted`,
  );
  const expanded = gunzipSync(compressedBytes);
  invariant(
    expanded.length === output.uncompressedBytes &&
      sha256(expanded) === output.uncompressedSha256,
    `${machineReport.animationId}: expanded FFDec script bundle drifted`,
  );
  const text = expanded.toString("utf8");
  const records = [];
  const sections = text.split(/^===== ([^\r\n]+) =====\r?\n/gm);
  invariant(
    sections.length >= 3 &&
      sections.length % 2 === 1 &&
      sections[0].trim() === "",
    `${machineReport.animationId}: FFDec script bundle framing is malformed`,
  );
  for (let index = 1; index < sections.length; index += 2) {
    const sourcePath = sections[index];
    const source = sections[index + 1].replace(/\r?\n$/, "");
    const bytes = Buffer.from(source);
    const externalApiOccurrences = Object.entries(EXTERNAL_API_PATTERNS)
      .map(([api, pattern]) => {
        pattern.lastIndex = 0;
        return {api, occurrences: [...source.matchAll(pattern)].length};
      })
      .filter(({occurrences}) => occurrences > 0);
    records.push({
      scriptId: `ffdec-script-${String(records.length + 1).padStart(4, "0")}`,
      sourcePath,
      bytes: bytes.length,
      sha256: sha256(bytes),
      lineCount: source.length === 0 ? 0 : source.split(/\r?\n/).length,
      externalApiOccurrences,
      runtimeReachability: "unresolved",
      scenario: "unresolved",
      naturalTrace: "unresolved",
    });
  }
  invariant(
    records.length === machineReport.findings.exportedScriptFileCount,
    `${machineReport.animationId}: parsed script count ${records.length} differs from machine report ${machineReport.findings.exportedScriptFileCount}`,
  );
  return {
    expandedBinding: {
      bytes: expanded.length,
      sha256: sha256(expanded),
    },
    records,
  };
}

function assertExternalCallCandidateAgreement(member, scriptRecords, machineReport) {
  const detected = new Map();
  for (const record of scriptRecords) {
    for (const {api, occurrences} of record.externalApiOccurrences) {
      detected.set(api, (detected.get(api) || 0) + occurrences);
    }
  }
  const machine = new Map(
    machineReport.findings.externalCallCandidates.map(({api, occurrences}) => [
      api,
      occurrences,
    ]),
  );
  invariant(
    stableJson(Object.fromEntries([...detected].sort())) ===
      stableJson(Object.fromEntries([...machine].sort())),
    `${member.animationId}: script-level external-call scan differs from machine audit`,
  );
  return machineReport.findings.externalCallCandidates.map(({api, occurrences}) => ({
    api,
    occurrences,
    scriptIds: scriptRecords
      .filter((record) =>
        record.externalApiOccurrences.some((entry) => entry.api === api))
      .map(({scriptId}) => scriptId),
    endpointOrTarget: "withheld-unresolved-static-source-not-executed",
    runtimeReachability: "unresolved",
    securityDisposition: "pending-human-review",
  }));
}

function renderDefinitionInventory(sourcePath, census) {
  const fonts = new Map(
    census.fontFacts.map((font) => [font.characterId, font]),
  );
  const rows = [ASSET_HEADER];
  for (const definition of census.definitions) {
    const font = fonts.get(definition.characterId);
    const specific = definition.specificFacts || {};
    const notes = [
      `container=${definition.containerPath}`,
      `definitionDepth=${definition.definitionDepth}`,
      `tagOrdinal=${definition.ordinal}`,
      `payloadBytes=${definition.payloadLength}`,
      `rawTagPayloadSha256=${definition.rawTagPayloadSha256}`,
      `exactTagIdentitySha256=${definition.exactTagIdentitySha256}`,
      ...(specific.declaredFrameCount == null
        ? []
        : [`declaredFrameCount=${specific.declaredFrameCount}`]),
      ...(specific.sampleCount == null
        ? []
        : [`declaredSampleCount=${specific.sampleCount}`]),
      "runtime reachability unresolved",
      "placement and bounds unresolved",
      "renderer suitability unresolved",
    ];
    rows.push([
      `swf-definition-${String(definition.ordinal).padStart(5, "0")}`,
      definition.characterId,
      font?.exactName || "",
      definition.category,
      sourcePath,
      "",
      "",
      definition.rawTagPayloadSha256,
      definition.tagName,
      "",
      font?.glyphCount ?? "",
      "none; machine census only; no renderer export",
      "machine-extracted-definition-candidate",
      "owner-provided SWF",
      notes.join("; "),
    ]);
  }
  return csv(rows);
}

function generatedByDescriptor(generator, parser) {
  return {
    path: GENERATOR_PATH,
    version: 1,
    bytes: generator.binding.bytes,
    sha256: generator.binding.sha256,
    dependencies: {
      swfDefinitionParser: {
        path: PARSER_PATH,
        bytes: parser.binding.bytes,
        sha256: parser.binding.sha256,
        importedFunction: "collectSwfAssetDefinitions",
      },
    },
  };
}

function commonAcceptanceEffects() {
  return {
    authoritativeOriginalRuntime: false,
    currentJavaScriptCandidate: false,
    implementationAuthorized: false,
    fidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  };
}

function commonOwnership() {
  return {
    owner: "g5-l4-pre-runtime-specification-candidate-materializer",
    safeToReplaceOnlyWithThisMaterializer: true,
    canonicalFile: false,
    acceptanceEvidence: false,
  };
}

function buildCandidateDocuments({
  member,
  inputs,
  source,
  sourceFla,
  parsed,
  scriptBundle,
  dependencyCandidates,
  generatedBy,
}) {
  const manifest = inputs.migrationManifest.value;
  const machine = inputs.machineAudit.value;
  const frameDomains = inputs.frameDomainCandidates.value;
  const workspace = `migrations/${member.animationId}`;
  const inputBindings = {
    lessonReleaseCatalog: inputs.releaseCatalog.binding,
    migrationManifest: inputs.migrationManifest.binding,
    migrationBrief: inputs.migrationBrief.binding,
    canonicalAssetInventory: inputs.assetInventory.binding,
    canonicalAudioInventory: inputs.audioInventory.binding,
    canonicalKeyframes: inputs.keyframes.binding,
    canonicalCoverageV2: inputs.fullFrameCoverage.binding,
    sourceScopeBinding: inputs.sourceScopeBinding.binding,
    machineAudit: inputs.machineAudit.binding,
    frameDomainCandidates: inputs.frameDomainCandidates.binding,
    swfmillSummary: inputs.swfmillSummary.binding,
    ffdecHeader: inputs.ffdecHeader.binding,
    ffdecScriptIndex: inputs.ffdecScriptIndex.binding,
    ffdecScripts: inputs.ffdecScripts.binding,
  };
  const unresolved = {
    rootReachableNestedDomains: frameDomains.summary.unresolvedReachabilityCount,
    nestedPlacementEntryStates: frameDomains.summary.unresolvedReachabilityCount,
    reachableScenarios: true,
    naturalTraces: true,
    keyframeBehaviorMap: true,
    rendererSelection: true,
    audioListeningLanguageAndSynchronization: true,
    authoritativeBaseline: true,
    humanDecisions: true,
  };
  const runtimeFacts = withFingerprint({
    schemaVersion: 1,
    artifactType: "g5-l4-manifest-runtime-facts-candidate",
    releaseId: RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    ownership: commonOwnership(),
    inputs: inputBindings,
    source: {
      model: sourceFla ? "paired-fla-and-shipped-swf" : "shipped-swf-only",
      swf: {...source.binding, physicalHashVerified: true},
      fla: sourceFla
        ? {...sourceFla.binding, physicalHashVerified: true}
        : null,
    },
    canonicalManifestBefore: {
      actionScriptVersion: manifest.runtime.actionScriptVersion,
      backgroundColor: manifest.runtime.backgroundColor,
      complexity: manifest.runtime.complexity,
      scriptCount: manifest.runtime.scripts.length,
      externalDependencyCount: manifest.runtime.externalDependencies.length,
      rendering: manifest.implementation.rendering,
      changedByThisCandidate: false,
    },
    candidateRuntimeFacts: {
      swfSignature: parsed.sourceFormat.signature,
      swfVersion: parsed.sourceFormat.version,
      declaredUncompressedBytes: parsed.sourceFormat.declaredUncompressedBytes,
      stage: manifest.runtime.stage,
      fps: parsed.sourceFormat.fps,
      rootFrameCount: parsed.sourceFormat.rootFrameCount,
      durationMs: manifest.runtime.durationMs,
      backgroundColor: machine.findings.backgroundColor,
      actionScriptGeneration: machine.findings.actionScriptVersion,
      definitionCount: parsed.tagStream.definitionCount,
      exportedScriptFileCount: scriptBundle.records.length,
      externalCallCandidateCount: dependencyCandidates.length,
      toolVersions: machine.tools,
    },
    unresolved,
    canonicalPatchApplied: false,
    acceptanceEffects: commonAcceptanceEffects(),
  });

  const census = withFingerprint({
    schemaVersion: 1,
    artifactType: "g5-l4-swf-asset-definition-census-candidate",
    releaseId: RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    ownership: commonOwnership(),
    inputs: inputBindings,
    source: {
      ...source.binding,
      physicalHashVerified: true,
      sourceModel: sourceFla
        ? "paired-fla-and-shipped-swf"
        : "shipped-swf-only",
    },
    method: {
      parser:
        "Reusable direct binary SWF tag parser after lossless CWS inflation",
      recursion:
        "Root stream plus structurally nested DefineSprite streams",
      swfmillCrossCheck: true,
      establishesRuntimeVisibility: false,
      establishesAuthoringSemantics: false,
      exportsRendererAssets: false,
      authorizesRendererReuse: false,
    },
    sourceFormat: parsed.sourceFormat,
    tagStream: parsed.tagStream,
    definitions: parsed.definitions,
    companions: parsed.companions,
    fontFacts: parsed.fontFacts,
    fontCompanionFacts: parsed.fontCompanionFacts,
    textFacts: parsed.textFacts,
    exactTextOccurrences: parsed.exactTextOccurrences,
    summary: {
      definitionCount: parsed.tagStream.definitionCount,
      companionCount: parsed.tagStream.companionCount,
      categoryCounts: parsed.tagStream.categoryCounts,
      exactTextOccurrenceCount: parsed.exactTextOccurrences.length,
      rendererAssetExportCount: 0,
      runtimePlacementDispositionCount: 0,
      canonicalAssetInventoryRowsAdded: 0,
      finalCanonicalAssetSpecificationComplete: false,
    },
    unresolved,
    acceptanceEffects: commonAcceptanceEffects(),
  });

  const scriptInventory = withFingerprint({
    schemaVersion: 1,
    artifactType: "g5-l4-ffdec-script-inventory-candidate",
    releaseId: RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    ownership: commonOwnership(),
    inputs: {
      lessonReleaseCatalog: inputs.releaseCatalog.binding,
      migrationManifest: inputs.migrationManifest.binding,
      machineAudit: inputs.machineAudit.binding,
      ffdecScriptIndex: inputs.ffdecScriptIndex.binding,
      ffdecScripts: inputs.ffdecScripts.binding,
    },
    expandedBundle: scriptBundle.expandedBinding,
    scripts: scriptBundle.records,
    summary: {
      scriptCount: scriptBundle.records.length,
      scriptBytes: scriptBundle.records.reduce(
        (sum, {bytes}) => sum + bytes,
        0,
      ),
      scriptsWithExternalCallCandidates: scriptBundle.records.filter(
        ({externalApiOccurrences}) => externalApiOccurrences.length > 0,
      ).length,
      canonicalManifestScriptRecordsAdded: 0,
      completeReachableScriptInventory: false,
    },
    unresolved: {
      runtimeReachability: true,
      sourceTargetSemantics: true,
      scenarioAndTraceBinding: true,
      hostAndExternalDependencySemantics: true,
    },
    acceptanceEffects: commonAcceptanceEffects(),
  });

  const dependencyInventory = withFingerprint({
    schemaVersion: 1,
    artifactType: "g5-l4-static-dependency-inventory-candidate",
    releaseId: RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    ownership: commonOwnership(),
    inputs: {
      lessonReleaseCatalog: inputs.releaseCatalog.binding,
      migrationManifest: inputs.migrationManifest.binding,
      machineAudit: inputs.machineAudit.binding,
      ffdecScripts: inputs.ffdecScripts.binding,
    },
    scanMethod:
      "Static API-name occurrence scan over the hash-bound FFDec ActionScript bundle; no target was contacted or executed.",
    candidates: dependencyCandidates,
    noCandidateMeaning:
      "No machine candidate is not proof that runtime dependencies are absent.",
    summary: {
      apiCandidateCount: dependencyCandidates.length,
      occurrenceCount: dependencyCandidates.reduce(
        (sum, {occurrences}) => sum + occurrences,
        0,
      ),
      runtimeDependencyClearance: false,
      canonicalManifestDependencyRecordsAdded: 0,
      executedLegacyEndpointCount: 0,
    },
    unresolved: {
      runtimeReachability: true,
      endpointOrTarget: dependencyCandidates.length > 0,
      securityDisposition: dependencyCandidates.length > 0,
      reviewedReplacementApi: true,
      hostDependencyClosure: true,
    },
    acceptanceEffects: commonAcceptanceEffects(),
  });

  const definitionInventory = Buffer.from(
    renderDefinitionInventory(manifest.source.swf, census),
  );
  const brief = Buffer.from(
    `# ${member.animationId} Static Migration-Brief Prefill Candidate\n\n` +
      `> Machine-generated, acceptance-neutral candidate only. Canonical \`MIGRATION_BRIEF.md\` is unchanged.\n\n` +
      `- Release: \`${RELEASE_ID}\`; ordinal: **${member.ordinal}/55**; role: \`${member.releaseRole}\`; shard: \`${member.shardId}\`.\n` +
      `- Animation/asset: \`${member.animationId}\` / \`${member.assetId}\`.\n` +
      `- Generator SHA-256: \`${generatedBy.sha256}\`.\n\n` +
      `## Source identity\n\n` +
      `- SWF: \`${source.binding.path}\`; ${source.binding.bytes} bytes; SHA-256 \`${source.binding.sha256}\`.\n` +
      `- FLA: ${sourceFla ? `\`${sourceFla.binding.path}\`; ${sourceFla.binding.bytes} bytes; SHA-256 \`${sourceFla.binding.sha256}\`` : "**not present; shipped-SWF-only source gap**"}.\n` +
      `- Provenance: owner-provided preserved source; this candidate writes no source or canonical migration file.\n\n` +
      `## Static runtime facts\n\n` +
      `- Stage: **${manifest.runtime.stage.width} × ${manifest.runtime.stage.height}**; FPS: **${manifest.runtime.fps}**; root frames: **${manifest.runtime.frameCount}**; duration: **${manifest.runtime.durationMs} ms**.\n` +
      `- SWF signature/version: **${parsed.sourceFormat.signature}/${parsed.sourceFormat.version}**; ActionScript: **${machine.findings.actionScriptVersion}**; background: **${machine.findings.backgroundColor}**.\n` +
      `- Static definitions: **${parsed.tagStream.definitionCount}**; nested definitions: **${frameDomains.summary.nestedDefinitionCount}**; unresolved nested reachability: **${frameDomains.summary.unresolvedReachabilityCount}**.\n` +
      `- FFDec scripts: **${scriptBundle.records.length}**; static external-call API candidates: **${dependencyCandidates.length}**.\n\n` +
      `## Candidate artifact routing\n\n` +
      `- Runtime facts: \`${workspace}/audit/machine/${OUTPUT_NAMES.manifestRuntimeFacts}\`.\n` +
      `- Asset census/CSV: \`${workspace}/audit/machine/${OUTPUT_NAMES.assetDefinitionCensus}\`, \`${workspace}/audit/machine/${OUTPUT_NAMES.definitionInventory}\`.\n` +
      `- Script/dependency candidates: \`${workspace}/audit/machine/${OUTPUT_NAMES.scriptInventory}\`, \`${workspace}/audit/machine/${OUTPUT_NAMES.dependencyInventory}\`.\n\n` +
      `## Unresolved original-runtime and human decisions\n\n` +
      `- Reachable scenarios, natural traces, host entry, branches, terminal state, Replay, and random behavior: **unresolved**.\n` +
      `- Nested-domain reachability, placement, and entry-state identity: **unresolved**.\n` +
      `- Keyframes and instructional behavior map: **unresolved; canonical keyframes remain unchanged**.\n` +
      `- Audio cue reachability, spoken language/content, synchronization, loop/stop behavior, and not-required decision: **unresolved**.\n` +
      `- Renderer choice, rejected alternatives, accessibility, localization, asset transformations, and implementation map: **unresolved; no renderer selected**.\n` +
      `- Original-runtime authority, baselines, full-frame comparison, human review, owner acceptance, strict completion, and publication: **all false/pending**.\n`,
  );

  return {
    manifestRuntimeFacts: jsonBytes(runtimeFacts),
    assetDefinitionCensus: jsonBytes(census),
    definitionInventory,
    scriptInventory: jsonBytes(scriptInventory),
    dependencyInventory: jsonBytes(dependencyInventory),
    briefStaticPrefill: brief,
    metadata: {
      runtimeFacts,
      census,
      scriptInventory,
      dependencyInventory,
      inputBindings,
      unresolved,
    },
  };
}

function outputDescriptor(workspace, name, bytes, extra = {}) {
  return {
    path: `${workspace}/audit/machine/${OUTPUT_NAMES[name]}`,
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...extra,
  };
}

function buildReceipt({
  member,
  generatedBy,
  inputs,
  source,
  sourceFla,
  candidates,
}) {
  const workspace = `migrations/${member.animationId}`;
  const outputBindings = {
    manifestRuntimeFacts: outputDescriptor(
      workspace,
      "manifestRuntimeFacts",
      candidates.manifestRuntimeFacts,
    ),
    assetDefinitionCensus: outputDescriptor(
      workspace,
      "assetDefinitionCensus",
      candidates.assetDefinitionCensus,
      {definitionCount: candidates.metadata.census.summary.definitionCount},
    ),
    definitionInventory: outputDescriptor(
      workspace,
      "definitionInventory",
      candidates.definitionInventory,
      {rowCount: candidates.metadata.census.summary.definitionCount},
    ),
    scriptInventory: outputDescriptor(
      workspace,
      "scriptInventory",
      candidates.scriptInventory,
      {scriptCount: candidates.metadata.scriptInventory.summary.scriptCount},
    ),
    dependencyInventory: outputDescriptor(
      workspace,
      "dependencyInventory",
      candidates.dependencyInventory,
      {
        apiCandidateCount:
          candidates.metadata.dependencyInventory.summary.apiCandidateCount,
        occurrenceCount:
          candidates.metadata.dependencyInventory.summary.occurrenceCount,
      },
    ),
    briefStaticPrefill: outputDescriptor(
      workspace,
      "briefStaticPrefill",
      candidates.briefStaticPrefill,
    ),
  };
  return withFingerprint({
    schemaVersion: 1,
    artifactType: "g5-l4-pre-runtime-specification-candidate-receipt",
    releaseId: RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy,
    ownership: commonOwnership(),
    releaseMembership: {
      ordinal: member.ordinal,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
    },
    source: {
      swf: {...source.binding, physicalHashVerified: true},
      fla: sourceFla
        ? {...sourceFla.binding, physicalHashVerified: true}
        : null,
    },
    inputs: candidates.metadata.inputBindings,
    outputs: outputBindings,
    canonicalFiles: {
      migrationManifest: {
        ...inputs.migrationManifest.binding,
        changedByMaterializer: false,
      },
      migrationBrief: {
        ...inputs.migrationBrief.binding,
        changedByMaterializer: false,
      },
      assetInventory: {
        ...inputs.assetInventory.binding,
        changedByMaterializer: false,
      },
      audioInventory: {
        ...inputs.audioInventory.binding,
        changedByMaterializer: false,
      },
      keyframes: {
        ...inputs.keyframes.binding,
        changedByMaterializer: false,
      },
      fullFrameCoverage: {
        ...inputs.fullFrameCoverage.binding,
        changedByMaterializer: false,
      },
    },
    candidateReadiness: {
      manifestRuntimeFactsMaterialized: true,
      staticAssetDefinitionCensusMaterialized: true,
      machineDefinitionInventoryMaterialized: true,
      ffdecScriptInventoryMaterialized: true,
      staticDependencyInventoryMaterialized: true,
      migrationBriefStaticPrefillMaterialized: true,
      canonicalManifestReconciled: false,
      canonicalAssetInventoryFinal: false,
      canonicalKeyframesFinal: false,
      canonicalCoverageFinal: false,
      reachableScenarioInventoryComplete: false,
      frameDomainDispositionComplete: false,
      implementationSpecificationReady: false,
      implementationAuthorized: false,
    },
    unresolved: candidates.metadata.unresolved,
    runtimeSessionsExecuted: 0,
    guiApplicationsLaunched: 0,
    legacyEndpointsExecuted: 0,
    workspaceCanonicalFilesChanged: 0,
    sourceAssetsChanged: false,
    acceptanceEffects: commonAcceptanceEffects(),
  });
}

export function validatePriorReceipt(receipt, member) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.artifactType ===
        "g5-l4-pre-runtime-specification-candidate-receipt" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.animationId === member.animationId &&
      receipt.assetId === member.assetId &&
      receipt.generatedBy?.path === GENERATOR_PATH &&
      isSha256(receipt.generatedBy.sha256) &&
      receipt.ownership?.safeToReplaceOnlyWithThisMaterializer === true &&
      receipt.ownership?.canonicalFile === false &&
      receipt.runtimeSessionsExecuted === 0 &&
      receipt.guiApplicationsLaunched === 0 &&
      receipt.legacyEndpointsExecuted === 0 &&
      receipt.workspaceCanonicalFilesChanged === 0 &&
      receipt.sourceAssetsChanged === false &&
      Object.values(receipt.acceptanceEffects || {}).every(
        (value) => value === false,
      ),
    `${member.animationId}: prior receipt is foreign or crossed a protected boundary`,
  );
  const projected = structuredClone(receipt);
  delete projected.artifactFingerprintSha256;
  delete projected.generatedMarker;
  const fingerprint = sha256(stableJson(projected));
  invariant(
    receipt.artifactFingerprintSha256 === fingerprint &&
      receipt.generatedMarker === `sha256:${fingerprint}`,
    `${member.animationId}: prior receipt fingerprint is invalid`,
  );
  for (const name of Object.keys(OUTPUT_NAMES).filter(
    (key) => key !== "receipt",
  )) {
    const output = receipt.outputs?.[name];
    invariant(
      output?.path ===
        `migrations/${member.animationId}/audit/machine/${OUTPUT_NAMES[name]}` &&
        Number.isSafeInteger(output.bytes) &&
        output.bytes > 0 &&
        isSha256(output.sha256),
      `${member.animationId}: prior receipt does not own ${name}`,
    );
  }
  return receipt;
}

export async function assertPriorOwnership(root, member, outputPaths) {
  const receiptPath = outputPaths.receipt;
  if (!(await exists(resolveProjectPath(root, receiptPath, "prior receipt")))) {
    for (const [name, relativePath] of Object.entries(outputPaths)) {
      if (name === "receipt") continue;
      invariant(
        !(await exists(resolveProjectPath(root, relativePath, `${name} output`))),
        `${member.animationId}: foreign unowned output exists: ${relativePath}`,
      );
    }
    return null;
  }
  const priorInput = await readJsonBinding(
    root,
    receiptPath,
    `${member.animationId}: prior candidate receipt`,
  );
  const prior = validatePriorReceipt(priorInput.value, member);
  for (const [name, relativePath] of Object.entries(outputPaths)) {
    if (name === "receipt") continue;
    const binding = await readRawBinding(
      root,
      relativePath,
      `${member.animationId}: prior ${name}`,
    );
    const owned = prior.outputs[name];
    invariant(
      binding.binding.bytes === owned.bytes &&
        binding.binding.sha256 === owned.sha256,
      `${member.animationId}: refusing to replace modified or foreign ${relativePath}`,
    );
  }
  return priorInput;
}

async function assertNoForeignStages(root, outputPaths, member) {
  for (const relativePath of Object.values(outputPaths)) {
    const absolutePath = resolveProjectPath(root, relativePath, "output path");
    const directory = path.dirname(absolutePath);
    const basename = path.basename(absolutePath);
    const entries = await import("node:fs/promises").then(({readdir}) =>
      readdir(directory));
    const foreign = entries.filter(
      (entry) =>
        entry.startsWith(`${basename}.desired-`) ||
        entry.startsWith(`${basename}.backup-`),
    );
    invariant(
      foreign.length === 0,
      `${member.animationId}: foreign or stale transaction stage exists for ${relativePath}`,
    );
  }
}

async function assertSafeOutput(root, relativePath) {
  invariant(
    relativePath.startsWith("migrations/") &&
      relativePath.includes("/audit/machine/"),
    `output must remain under migrations/*/audit/machine/: ${relativePath}`,
  );
  const absolutePath = resolveProjectPath(root, relativePath, "output");
  const rootInfo = await lstat(root);
  invariant(
    rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    "project root must be a real directory",
  );
  const rootReal = await realpath(root);
  const ancestors = [{
    absolutePath: root,
    relativePath: ".",
    identity: statIdentity(rootInfo),
  }];
  let cursor = root;
  const parentRelative = path.relative(root, path.dirname(absolutePath));
  for (const component of parentRelative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    invariant(await exists(cursor), `output parent is absent: ${cursor}`);
    const info = await lstat(cursor);
    invariant(
      info.isDirectory() && !info.isSymbolicLink(),
      `output parent must be a real directory: ${portable(path.relative(root, cursor))}`,
    );
    invariant(
      contained(rootReal, await realpath(cursor)),
      `output parent resolves outside project root: ${portable(path.relative(root, cursor))}`,
    );
    ancestors.push({
      absolutePath: cursor,
      relativePath: portable(path.relative(root, cursor)),
      identity: statIdentity(info),
    });
  }
  let targetIdentity = null;
  if (await exists(absolutePath)) {
    const info = await lstat(absolutePath);
    invariant(
      info.isFile() && !info.isSymbolicLink() && info.nlink === 1,
      `output must be an ordinary single-link file: ${relativePath}`,
    );
    targetIdentity = statIdentity(info, {includeSize: true});
  }
  return {absolutePath, relativePath, ancestors, rootReal, targetIdentity};
}

export async function preflightOutput(root, relativePath, desiredBytes) {
  const safety = await assertSafeOutput(root, relativePath);
  if (safety.targetIdentity === null) {
    return {
      ...safety,
      priorBytes: null,
      priorSha256: null,
      desiredBytes,
    };
  }
  const priorBytes = await readFile(safety.absolutePath);
  const after = await lstat(safety.absolutePath);
  invariant(
    identitiesEqual(
      safety.targetIdentity,
      statIdentity(after, {includeSize: true}),
    ) &&
      priorBytes.length === safety.targetIdentity.size,
    `output changed during preflight: ${relativePath}`,
  );
  return {
    ...safety,
    priorBytes,
    priorSha256: sha256(priorBytes),
    desiredBytes,
  };
}

async function assertAncestorsUnchanged(output) {
  for (const ancestor of output.ancestors) {
    const info = await lstat(ancestor.absolutePath);
    invariant(
      info.isDirectory() &&
        !info.isSymbolicLink() &&
        identitiesEqual(ancestor.identity, statIdentity(info)),
      `output ancestor changed: ${ancestor.relativePath}`,
    );
    invariant(
      contained(output.rootReal, await realpath(ancestor.absolutePath)),
      `output ancestor resolves outside project root: ${ancestor.relativePath}`,
    );
  }
}

async function assertOutputUnchanged(output) {
  await assertAncestorsUnchanged(output);
  if (output.priorBytes === null) {
    invariant(
      !(await exists(output.absolutePath)),
      `output appeared after preflight: ${output.relativePath}`,
    );
    return;
  }
  const before = await lstat(output.absolutePath);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1 &&
      identitiesEqual(
        output.targetIdentity,
        statIdentity(before, {includeSize: true}),
      ),
    `output identity changed after preflight: ${output.relativePath}`,
  );
  const bytes = await readFile(output.absolutePath);
  const after = await lstat(output.absolutePath);
  invariant(
    identitiesEqual(
      output.targetIdentity,
      statIdentity(after, {includeSize: true}),
    ) &&
      bytes.equals(output.priorBytes) &&
      sha256(bytes) === output.priorSha256,
    `output bytes changed after preflight: ${output.relativePath}`,
  );
}

async function stageBytes(output, kind, bytes) {
  const stagedPath =
    `${output.absolutePath}.${kind}-${process.pid}-${randomUUID()}`;
  await writeFile(stagedPath, bytes, {flag: "wx", mode: 0o600});
  const info = await lstat(stagedPath);
  invariant(
    info.isFile() && !info.isSymbolicLink() && info.nlink === 1,
    `staged ${kind} is not an ordinary single-link file: ${output.relativePath}`,
  );
  return {
    path: stagedPath,
    kind,
    bytes,
    sha256: sha256(bytes),
    identity: statIdentity(info, {includeSize: true}),
  };
}

async function assertStageUnchanged(output, stage) {
  invariant(stage?.path && await exists(stage.path),
    `staged ${stage?.kind || "file"} disappeared: ${output.relativePath}`);
  const before = await lstat(stage.path);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1 &&
      identitiesEqual(
        stage.identity,
        statIdentity(before, {includeSize: true}),
      ),
    `staged ${stage.kind} identity changed: ${output.relativePath}`,
  );
  const bytes = await readFile(stage.path);
  const after = await lstat(stage.path);
  invariant(
    identitiesEqual(
      stage.identity,
      statIdentity(after, {includeSize: true}),
    ) &&
      bytes.equals(stage.bytes) &&
      sha256(bytes) === stage.sha256,
    `staged ${stage.kind} bytes changed: ${output.relativePath}`,
  );
}

async function assertCommitted(output) {
  await assertAncestorsUnchanged(output);
  const info = await lstat(output.absolutePath);
  invariant(
    info.isFile() &&
      !info.isSymbolicLink() &&
      info.nlink === 1 &&
      identitiesEqual(
        output.desiredStage.identity,
        statIdentity(info, {includeSize: true}),
      ),
    `committed output identity changed: ${output.relativePath}`,
  );
  const bytes = await readFile(output.absolutePath);
  invariant(
    bytes.equals(output.desiredBytes) &&
      sha256(bytes) === output.desiredStage.sha256,
    `committed output bytes changed: ${output.relativePath}`,
  );
}

async function rollbackOutput(output) {
  await assertCommitted(output);
  if (output.priorBytes === null) {
    await unlink(output.absolutePath);
    return;
  }
  await assertStageUnchanged(output, output.backupStage);
  await rename(output.backupStage.path, output.absolutePath);
  output.backupStage.path = null;
  const bytes = await readFile(output.absolutePath);
  invariant(
    bytes.equals(output.priorBytes) && sha256(bytes) === output.priorSha256,
    `rollback bytes differ: ${output.relativePath}`,
  );
}

async function cleanupStage(output, stage) {
  if (!stage?.path || !(await exists(stage.path))) return;
  await assertStageUnchanged(output, stage);
  await unlink(stage.path);
}

function contextualError(message, error) {
  const wrapped = new Error(`${message}: ${error.message}`);
  wrapped.cause = error;
  return wrapped;
}

export async function writeTransaction(
  outputs,
  {inputGuards = [], hooks = {}} = {},
) {
  invariant(
    Array.isArray(outputs) &&
      outputs.length > 0 &&
      new Set(outputs.map(({absolutePath}) => absolutePath)).size ===
        outputs.length,
    "transaction outputs are absent or duplicated",
  );
  for (const [name, hook] of Object.entries(hooks)) {
    invariant(
      ["afterStage", "beforeCommit", "beforeRollback"].includes(name) &&
        typeof hook === "function",
      `unsupported transaction hook: ${name}`,
    );
  }
  const staged = [];
  const committed = [];
  const rollbackErrors = [];
  const cleanupErrors = [];
  let primaryError = null;
  try {
    for (const output of outputs) {
      await assertOutputUnchanged(output);
      staged.push({
        ...output,
        desiredStage: await stageBytes(
          output,
          "desired",
          output.desiredBytes,
        ),
        backupStage: output.priorBytes === null
          ? null
          : await stageBytes(output, "backup", output.priorBytes),
      });
    }
    if (hooks.afterStage) await hooks.afterStage({outputs: staged});
    await assertAllInputGuardsUnchanged(inputGuards);
    for (const output of staged) {
      await assertOutputUnchanged(output);
      await assertStageUnchanged(output, output.desiredStage);
      if (output.backupStage) {
        await assertStageUnchanged(output, output.backupStage);
      }
    }
    for (const [index, output] of staged.entries()) {
      await assertAllInputGuardsIdentityUnchanged(inputGuards);
      await assertOutputUnchanged(output);
      if (hooks.beforeCommit) await hooks.beforeCommit({index, output});
      await assertAllInputGuardsIdentityUnchanged(inputGuards);
      await rename(output.desiredStage.path, output.absolutePath);
      output.desiredStage.path = null;
      committed.push(output);
      await assertCommitted(output);
    }
    await assertAllInputGuardsUnchanged(inputGuards);
  } catch (error) {
    primaryError = error;
    for (const [rollbackIndex, output] of [...committed].reverse().entries()) {
      try {
        if (hooks.beforeRollback) {
          await hooks.beforeRollback({
            rollbackIndex,
            output,
            primaryError,
          });
        }
        await rollbackOutput(output);
      } catch (rollbackError) {
        output.rollbackFailed = true;
        rollbackErrors.push(
          contextualError(
            `rollback failed for ${output.relativePath}`,
            rollbackError,
          ),
        );
      }
    }
  } finally {
    for (const output of staged) {
      for (const stage of [output.desiredStage, output.backupStage]) {
        if (output.rollbackFailed && stage === output.backupStage) continue;
        try {
          await cleanupStage(output, stage);
        } catch (cleanupError) {
          cleanupErrors.push(
            contextualError(
              `stage cleanup failed for ${output.relativePath}`,
              cleanupError,
            ),
          );
        }
      }
    }
  }
  if (primaryError) {
    if (rollbackErrors.length || cleanupErrors.length) {
      throw new AggregateError(
        [primaryError, ...rollbackErrors, ...cleanupErrors],
        `${outputs.length}-output transaction failed with rollback/cleanup errors`,
        {cause: primaryError},
      );
    }
    throw primaryError;
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `${outputs.length}-output transaction committed with cleanup errors`,
    );
  }
}

function deduplicateGuards(guards) {
  const byPath = new Map();
  for (const guard of guards) {
    const previous = byPath.get(guard.absolutePath);
    if (previous) {
      invariant(
        previous.sha256 === guard.sha256 &&
          identitiesEqual(previous.identity, guard.identity),
        `duplicate input guard differs: ${guard.relativePath}`,
      );
    } else {
      byPath.set(guard.absolutePath, guard);
    }
  }
  return [...byPath.values()];
}

async function prepareMember({
  root,
  member,
  releaseCatalog,
  generator,
  parser,
}) {
  const workspace = `migrations/${member.animationId}`;
  const canonicalEntries = await Promise.all(
    Object.entries(CANONICAL_FILES).map(async ([key, suffix]) => [
      key,
      suffix.endsWith(".json")
        ? await readJsonBinding(
          root,
          `${workspace}/${suffix}`,
          `${member.animationId}: ${key}`,
        )
        : await readRawBinding(
          root,
          `${workspace}/${suffix}`,
          `${member.animationId}: ${key}`,
        ),
    ]),
  );
  const machineEntries = await Promise.all(
    Object.entries(MACHINE_INPUT_FILES).map(async ([key, suffix]) => [
      key,
      suffix.endsWith(".json")
        ? await readJsonBinding(
          root,
          `${workspace}/${suffix}`,
          `${member.animationId}: ${key}`,
        )
        : await readRawBinding(
          root,
          `${workspace}/${suffix}`,
          `${member.animationId}: ${key}`,
        ),
    ]),
  );
  const inputs = {
    releaseCatalog,
    ...Object.fromEntries(canonicalEntries),
    ...Object.fromEntries(machineEntries),
  };
  validateCanonicalInputs(member, inputs);
  verifyMachineOutputBindings(
    member,
    inputs.machineAudit.value,
    Object.fromEntries(machineEntries),
  );
  const manifest = inputs.migrationManifest.value;
  const source = await readRawBinding(
    root,
    manifest.source.swf,
    `${member.animationId}: physical SWF`,
  );
  invariant(
    source.binding.sha256 === member.source.sha256 &&
      source.binding.sha256 === manifest.source.swfSha256 &&
      member.assetId === `swf-${source.binding.sha256}`,
    `${member.animationId}: physical SWF identity drifted`,
  );
  let sourceFla = null;
  if (manifest.source.fla) {
    sourceFla = await readRawBinding(
      root,
      manifest.source.fla,
      `${member.animationId}: physical FLA`,
    );
    invariant(
      sourceFla.binding.sha256 === manifest.source.flaSha256,
      `${member.animationId}: physical FLA identity drifted`,
    );
  } else {
    invariant(
      manifest.source.pairedFlaStatus === "missing" &&
        manifest.source.flaSha256 === "",
      `${member.animationId}: SWF-only source state drifted`,
    );
  }

  const parsed = collectSwfAssetDefinitions(source.bytes);
  const machine = inputs.machineAudit.value;
  invariant(
    parsed.sourceFormat.signature === manifest.runtime.swfSignature &&
      parsed.sourceFormat.version === manifest.runtime.swfVersion &&
      parsed.sourceFormat.rootFrameCount === manifest.runtime.frameCount &&
      parsed.sourceFormat.fps === manifest.runtime.fps &&
      Object.entries(parsed.tagStream.tagCounts).every(
        ([tag, count]) =>
          machine.findings.swfmill.tagCounts?.[tag] === count,
      ) &&
      parsed.tagStream.definitionCount ===
        Object.values(parsed.tagStream.categoryCounts)
          .reduce((sum, count) => sum + count, 0),
    `${member.animationId}: direct SWF census differs from manifest/machine audit`,
  );
  const scriptBundle = parseFfdecScriptBundle(
    inputs.ffdecScripts.bytes,
    machine,
  );
  const dependencyCandidates = assertExternalCallCandidateAgreement(
    member,
    scriptBundle.records,
    machine,
  );
  const generatedBy = generatedByDescriptor(generator, parser);
  const candidates = buildCandidateDocuments({
    member,
    inputs,
    source,
    sourceFla,
    parsed,
    scriptBundle,
    dependencyCandidates,
    generatedBy,
  });
  const receipt = buildReceipt({
    member,
    generatedBy,
    inputs,
    source,
    sourceFla,
    candidates,
  });
  validatePriorReceipt(receipt, member);
  const desiredByName = {
    manifestRuntimeFacts: candidates.manifestRuntimeFacts,
    assetDefinitionCensus: candidates.assetDefinitionCensus,
    definitionInventory: candidates.definitionInventory,
    scriptInventory: candidates.scriptInventory,
    dependencyInventory: candidates.dependencyInventory,
    briefStaticPrefill: candidates.briefStaticPrefill,
    receipt: jsonBytes(receipt),
  };
  const outputPaths = Object.fromEntries(
    Object.entries(OUTPUT_NAMES).map(([name, filename]) => [
      name,
      `${workspace}/audit/machine/${filename}`,
    ]),
  );
  await assertNoForeignStages(root, outputPaths, member);
  const priorReceipt = await assertPriorOwnership(
    root,
    member,
    outputPaths,
  );
  const outputs = [];
  for (const [name, relativePath] of Object.entries(outputPaths)) {
    outputs.push(
      await preflightOutput(root, relativePath, desiredByName[name]),
    );
  }
  const guards = [
    ...Object.values(inputs).map(({guard}) => guard),
    source.guard,
    ...(sourceFla ? [sourceFla.guard] : []),
    generator.guard,
    parser.guard,
  ];
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    sourceModel: sourceFla
      ? "paired-fla-and-shipped-swf"
      : "shipped-swf-only",
    definitionCount: parsed.tagStream.definitionCount,
    scriptCount: scriptBundle.records.length,
    dependencyApiCandidateCount: dependencyCandidates.length,
    dependencyOccurrenceCount: dependencyCandidates.reduce(
      (sum, {occurrences}) => sum + occurrences,
      0,
    ),
    outputCount: outputs.length,
    outputs,
    guards,
  };
}

export function classifyStaticReconciliationReceiptState(
  receiptPresence,
) {
  invariant(
    Array.isArray(receiptPresence) &&
      receiptPresence.length === 55 &&
      receiptPresence.every((value) => typeof value === "boolean"),
    "static reconciliation receipt presence must contain 55 booleans",
  );
  const count = receiptPresence.filter(Boolean).length;
  invariant(
    count === 0 || count === 55,
    `G5 L4 static reconciliation receipt set is partial (${count}/55)`,
  );
  return count === 55 ? "historical-post-adoption" : "pre-adoption";
}

async function staticReceiptState(root, release) {
  const presence = [];
  for (const member of release.members) {
    const relativePath =
      `migrations/${member.animationId}/audit/machine/` +
      STATIC_RECONCILIATION_RECEIPT_NAME;
    presence.push(
      await exists(
        resolveProjectPath(
          root,
          relativePath,
          `${member.animationId}: static reconciliation receipt`,
        ),
      ),
    );
  }
  return classifyStaticReconciliationReceiptState(presence);
}

export function validateHistoricalCandidateDescriptor({
  member,
  actualBinding,
  expected,
  expectedPath,
  label,
}) {
  invariant(
    expected?.path === expectedPath &&
      expected.bytes === actualBinding?.bytes &&
      expected.sha256 === actualBinding?.sha256,
    `${member.animationId}: historical ${label} differs from its static reconciliation receipt`,
  );
  return expected;
}

async function inspectHistoricalCandidatePackages({
  root,
  release,
  check,
  dryRun,
}) {
  invariant(
    check || dryRun,
    "G5 L4 candidate packages are immutable historical pre-adoption evidence after 55/55 static reconciliation; use --check or --dry-run",
  );
  const {
    readG5L4M1StaticReconciliationReceipt,
  } = await import("./reconcile-lesson-m1-static-specification.mjs");
  const prepared = [];
  for (const member of release.members) {
    const staticRecord =
      await readG5L4M1StaticReconciliationReceipt({
        root,
        animationId: member.animationId,
        member,
      });
    const staticReceipt = staticRecord.receipt;
    invariant(
      staticReceipt.inputBindingSemantics?.candidateArtifacts ===
        "historical-at-adoption-do-not-require-current-path-byte-identity",
      `${member.animationId}: static receipt does not declare historical candidate semantics`,
    );
    const workspace = `migrations/${member.animationId}/audit/machine`;
    const records = {};
    for (const [name, filename] of Object.entries(OUTPUT_NAMES)) {
      const relativePath = `${workspace}/${filename}`;
      const record = await readRawBinding(
        root,
        relativePath,
        `${member.animationId}: historical ${name}`,
      );
      validateHistoricalCandidateDescriptor({
        member,
        actualBinding: record.binding,
        expected:
          staticReceipt.inputs?.[HISTORICAL_STATIC_RECEIPT_INPUTS[name]],
        expectedPath: relativePath,
        label: name,
      });
      records[name] = record;
    }
    let candidateReceipt;
    let assetCensus;
    try {
      candidateReceipt = JSON.parse(
        records.receipt.bytes.toString("utf8"),
      );
      assetCensus = JSON.parse(
        records.assetDefinitionCensus.bytes.toString("utf8"),
      );
    } catch (error) {
      throw new Error(
        `${member.animationId}: historical candidate package contains invalid JSON (${error.message})`,
      );
    }
    validatePriorReceipt(candidateReceipt, member);
    for (const name of Object.keys(OUTPUT_NAMES).filter(
      (key) => key !== "receipt",
    )) {
      const expected = candidateReceipt.outputs?.[name];
      invariant(
        expected?.path === records[name].binding.path &&
          expected.bytes === records[name].binding.bytes &&
          expected.sha256 === records[name].binding.sha256,
        `${member.animationId}: historical candidate receipt/output binding drifted for ${name}`,
      );
    }
    invariant(
      Number.isSafeInteger(assetCensus.summary?.definitionCount) &&
        assetCensus.summary.definitionCount >= 0,
      `${member.animationId}: historical asset census definition count is invalid`,
    );
    prepared.push({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      sourceModel: candidateReceipt.source?.fla
        ? "paired-fla-and-shipped-swf"
        : "shipped-swf-only",
      definitionCount: assetCensus.summary.definitionCount,
      scriptCount: staticReceipt.summary.scriptCount,
      dependencyApiCandidateCount:
        staticReceipt.summary.dependencyApiCandidateCount,
      dependencyOccurrenceCount:
        staticReceipt.summary.dependencyOccurrenceCount,
      outputCount: 7,
      historicalCandidatePackage: true,
      staticReconciliationReceipt:
        `migrations/${member.animationId}/audit/machine/${STATIC_RECONCILIATION_RECEIPT_NAME}`,
    });
  }
  const summary = {
    memberCount: 55,
    outputCount: 385,
    definitionCount: prepared.reduce(
      (sum, {definitionCount}) => sum + definitionCount,
      0,
    ),
    scriptCount: prepared.reduce(
      (sum, {scriptCount}) => sum + scriptCount,
      0,
    ),
    dependencyApiCandidateCount: prepared.reduce(
      (sum, {dependencyApiCandidateCount}) =>
        sum + dependencyApiCandidateCount,
      0,
    ),
    dependencyOccurrenceCount: prepared.reduce(
      (sum, {dependencyOccurrenceCount}) =>
        sum + dependencyOccurrenceCount,
      0,
    ),
    candidatePackageCompleteCount: 55,
    staticReconciliationCount: 55,
    canonicalFilesChanged: 0,
    runtimeSessionsExecuted: 0,
    guiApplicationsLaunched: 0,
    legacyEndpointsExecuted: 0,
    implementationReadyCount: 0,
    implementationAuthorizedCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
  };
  return {
    mode: check ? "checked-historical" : "dry-run-historical",
    releaseId: RELEASE_ID,
    summary,
    members: prepared,
    acceptanceEffects: commonAcceptanceEffects(),
  };
}

export async function materializeG5L4PreRuntimeSpecificationCandidates({
  root = defaultProjectRoot,
  check = false,
  dryRun = false,
  transactionHooks = {},
} = {}) {
  invariant(!(check && dryRun), "--check and --dry-run are mutually exclusive");
  const resolvedRoot = path.resolve(root);
  const releaseCatalog = await readJsonBinding(
    resolvedRoot,
    RELEASE_PATH,
    "lesson release catalog",
  );
  const release = selectRelease(releaseCatalog.value);
  const reconciliationState = await staticReceiptState(
    resolvedRoot,
    release,
  );
  if (reconciliationState === "historical-post-adoption") {
    return inspectHistoricalCandidatePackages({
      root: resolvedRoot,
      release,
      check,
      dryRun,
    });
  }
  const [sourceScope, workspaceReadiness, generator, parser] =
    await Promise.all([
      readJsonBinding(
        resolvedRoot,
        SOURCE_SCOPE_REPORT_PATH,
        "G5 L4 source-scope report",
      ),
      readJsonBinding(
        resolvedRoot,
        WORKSPACE_READINESS_PATH,
        "G5 L4 workspace-readiness report",
      ),
      readRawBinding(resolvedRoot, GENERATOR_PATH, "candidate materializer"),
      readRawBinding(resolvedRoot, PARSER_PATH, "SWF definition parser"),
    ]);
  validateReleaseReports(
    release,
    sourceScope.value,
    workspaceReadiness.value,
  );
  const prepared = [];
  for (const member of release.members) {
    prepared.push(
      await prepareMember({
        root: resolvedRoot,
        member,
        releaseCatalog,
        generator,
        parser,
      }),
    );
  }
  const outputs = prepared.flatMap(({outputs: memberOutputs}) => memberOutputs);
  const guards = deduplicateGuards([
    sourceScope.guard,
    workspaceReadiness.guard,
    ...prepared.flatMap(({guards: memberGuards}) => memberGuards),
  ]);
  invariant(
    prepared.length === 55 && outputs.length === 55 * 7,
    "full 55-member preflight did not produce exactly 385 outputs",
  );
  if (check) {
    for (const output of outputs) {
      invariant(
        output.priorBytes !== null &&
          output.priorBytes.equals(output.desiredBytes),
        `${output.relativePath} is missing or stale`,
      );
    }
  } else if (!dryRun) {
    await writeTransaction(outputs, {
      inputGuards: guards,
      hooks: transactionHooks,
    });
  }
  const summary = {
    memberCount: prepared.length,
    outputCount: outputs.length,
    definitionCount: prepared.reduce(
      (sum, {definitionCount}) => sum + definitionCount,
      0,
    ),
    scriptCount: prepared.reduce(
      (sum, {scriptCount}) => sum + scriptCount,
      0,
    ),
    dependencyApiCandidateCount: prepared.reduce(
      (sum, {dependencyApiCandidateCount}) =>
        sum + dependencyApiCandidateCount,
      0,
    ),
    dependencyOccurrenceCount: prepared.reduce(
      (sum, {dependencyOccurrenceCount}) =>
        sum + dependencyOccurrenceCount,
      0,
    ),
    candidatePackageCompleteCount: check || !dryRun ? 55 : 0,
    canonicalFilesChanged: 0,
    runtimeSessionsExecuted: 0,
    guiApplicationsLaunched: 0,
    legacyEndpointsExecuted: 0,
    implementationReadyCount: 0,
    implementationAuthorizedCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
  };
  return {
    mode: check ? "checked" : dryRun ? "dry-run" : "materialized",
    releaseId: RELEASE_ID,
    summary,
    members: prepared.map(({outputs: _outputs, guards: _guards, ...member}) =>
      member),
    acceptanceEffects: commonAcceptanceEffects(),
  };
}

export function parseArguments(argv) {
  const options = {
    root: defaultProjectRoot,
    check: false,
    dryRun: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--root") {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), "--root requires a value");
      options.root = path.resolve(value);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown option: ${argument}`);
    }
  }
  invariant(
    !(options.check && options.dryRun),
    "--check and --dry-run are mutually exclusive",
  );
  return options;
}

function usage() {
  return `Usage:
  node scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs
  node scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs --dry-run
  node scripts/materialize-g5-l4-pre-runtime-specification-candidates.mjs --check

Preflights all 55 G5 L4 release members, then atomically writes or rolls back
seven acceptance-neutral files below each audit/machine directory. It never
modifies migration.json, MIGRATION_BRIEF.md, canonical inventories, keyframes,
coverage, source-assets, scenario/frame-domain/strict evidence, runtime state,
reviews, acceptance, or publication. It launches no GUI or runtime. After
55/55 M1 static reconciliation, candidate packages are immutable historical
evidence: --check and --dry-run verify receipt-bound bytes; write mode refuses.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result =
    await materializeG5L4PreRuntimeSpecificationCandidates(options);
  const modeLabel =
    result.mode === "checked" ||
    result.mode === "checked-historical"
      ? "PASS"
      : result.mode === "dry-run" ||
          result.mode === "dry-run-historical"
        ? "DRY-RUN"
        : "WROTE";
  process.stdout.write(
    `${modeLabel}: ` +
      `${result.summary.memberCount}/55 G5 L4 candidate packages; ` +
      `${result.summary.outputCount} outputs; ${result.summary.definitionCount} definitions; ` +
      `${result.summary.scriptCount} scripts; ${result.summary.dependencyApiCandidateCount} dependency API candidates / ` +
      `${result.summary.dependencyOccurrenceCount} occurrences; canonical writes 0; runtime/GUI 0; ` +
      `implementation-ready 0/55; strict 0/55; published false.\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
