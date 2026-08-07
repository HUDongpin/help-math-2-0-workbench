#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  access,
  lstat,
  readFile,
  readdir,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {
  COURSE_TRACE_PILOT_IDS,
  canonicalJson,
  safeRequirementId,
  sha256Text,
  validateExecutionProof,
} from "./build-course-trace-specs.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {assertStrictFullDomainRequirement} from "./lib/strict-full-domain-requirement.mjs";
import {
  CAPTURE_SESSION_ATTESTATION_STATEMENT,
  CANDIDATE_AUTHORITY,
  CANDIDATE_STATUS,
  PROMOTION_REQUIRED,
  ROOT_PROJECTOR_LAUNCH_PROTOCOL,
  ROOT_SOURCE_OPEN_MENU_PATH,
  ROOT_SOURCE_OPEN_METHOD,
  ROOT_SOURCE_OPEN_STATEMENT,
  assertNoExistingSymlinkComponents,
  captureSessionAttestationSha256,
  displayListRecordSha256,
  operationEventSha256,
  recordHash,
  rootLaunchReceiptSha256,
  validateNamedHuman,
} from "./prepare-root-capture-candidate.mjs";
import {
  NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT,
  NATURAL_HOST_OPEN_MENU_PATH,
  NATURAL_HOST_OPEN_METHOD,
  NATURAL_LAUNCH_RECEIPT_STATEMENT,
  NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
  NATURAL_TRACE_PROOF_MODE,
  naturalCaptureSessionAttestationSha256,
  naturalLaunchReceiptSha256,
  naturalOperationEventSha256,
  naturalStateRecordSha256,
  naturalTargetResolutionSha256,
} from "./prepare-natural-trace-candidate.mjs";
import {
  inspectTraceRequirement,
  verifyExecutionReportArtifacts,
} from "./validate-course-trace-evidence.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const APPROVED_ROLES = new Set([
  "capture-operator",
  "human-evidence-reviewer",
  "owner-representative",
]);
const CANDIDATE_KINDS = Object.freeze({
  "attested-root-capture-candidate-manifest": {
    kind: "root",
    reportType: "attested-root-capture-candidate-report",
    pendingEvidenceDirectory: "pending-root-capture",
    pendingArchiveDirectory: "pending-human-owner",
  },
  "attested-natural-trace-candidate-manifest": {
    kind: "natural",
    reportType: "attested-natural-trace-candidate-report",
    pendingEvidenceDirectory: "pending-natural-trace-capture",
    pendingArchiveDirectory: "pending-human-owner-natural-trace",
  },
});

export const TRUST_REGISTRY_STATEMENT = "This content-addressed registry pre-registers named human roles and original-runtime identity evidence for fail-closed HELP Math evidence promotion; it is an operational trust record, not a cryptographic identity signature.";
export const HUMAN_REVIEW_STATEMENT = "I inspected the complete candidate evidence DAG, all native-stage frames and declared trace behavior, confirmed the exact current source/spec bindings, and accept this candidate only as original-runtime baseline evidence for the named requirement.";
export const OWNER_REVIEW_STATEMENT = "I reviewed the bound human evidence decision and authorize this exact candidate DAG to be promoted only into canonical original-runtime baseline evidence for the named requirement; this does not approve JavaScript fidelity or strict migration completion.";
export const PROMOTION_STATEMENT = "The exact pending candidate DAG was independently re-hashed and bound to pre-registered named operator/runtime identity plus distinct accepted human and owner decisions. Promotion establishes only original-runtime baseline authority; implementation capture, RMSE/diffs, product/audio/behavior gates, migration-wide reviews, and completion remain independently gated.";
export const PROMOTED_BLOCKING_REASON = "Accepted original-runtime evidence now supplies this requirement's canonical baseline authority. The requirement remains blocked until every other applicable gate is independently satisfied, including deterministic JavaScript capture, paired per-frame RMSE/diffs, product/audio/behavior checks, and migration-wide human/owner acceptance. This promotion does not mark the requirement or migration complete.";
export const PROMOTION_WRITES_ENABLED = false;
export const LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT = false;
export const PROMOTION_DISABLED_CODE = "ORIGINAL_RUNTIME_EVIDENCE_PROMOTION_DISABLED";
export const PROMOTION_DISABLED_MESSAGE = `${PROMOTION_DISABLED_CODE}: this legacy adopter is structurally read-only and contains no canonical writer; production promotion requires a separately reviewed signed-release-bundle, typed-causality, and durable-transaction integration`;
export const PROMOTION_REMAINING_GATES = Object.freeze([
  Object.freeze({
    code: "SIGNED_RELEASE_BUNDLE_INTEGRATION_REQUIRED",
    category: "authority",
    requirement: "Load a fixed owner-controlled trust root outside the project; verify signed registry/revocation history plus distinct capture, human, owner, and release identities; and bind the signed release bundle to the exact derived output plan.",
  }),
  Object.freeze({
    code: "TYPED_CAUSALITY_DAG_INTEGRATION_REQUIRED",
    category: "natural-trace-causality-dag",
    requirement: "Consume the branded canonical root/natural candidate result, complete immutable typed DAG closure, ordered action/checkpoint/Replay causality, runtime and host identity, and full archive closure in the production plan.",
  }),
  Object.freeze({
    code: "DURABLE_NONCE_AND_TRANSACTION_ENTRY_REQUIRED",
    category: "transaction",
    requirement: "Atomically reserve the signed one-time nonce before canonical writes and connect production execute and recovery to the private hash-bound transaction plan; the existing execute/recover exports remain hard-disabled.",
  }),
  Object.freeze({
    code: "KERNEL_ANCHORED_PATH_RACE_CLOSURE_REQUIRED",
    category: "path-transaction",
    requirement: "Close ancestor path races across check/create/link/rename/unlink with a reviewed kernel-anchored strategy (for example fixed directory descriptors/openat-style operations) and prove coverage CAS plus no-replace outputs under adversarial replacement.",
  }),
  Object.freeze({
    code: "REAL_CANDIDATE_E2E_AND_INDEPENDENT_REVIEW_REQUIRED",
    category: "qualification",
    requirement: "Pass a real immutable candidate end-to-end with crash recovery, replay, revocation, role-reuse, path-race, and manifest-drift negatives, followed by independent security review before any production writer is introduced.",
  }),
]);

export function originalRuntimePromotionBoundary(candidateKind = null) {
  return {
    candidateKind,
    legacyAdopter: "read-only-diagnostic-only",
    canonicalWriteImplementationPresent: LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT,
    promotionWritesEnabled: PROMOTION_WRITES_ENABLED,
    legacyRegistryAndReviewAuthority: "self-hash-operational-records-not-digital-signatures",
    typedNaturalCausalityIntegrated: false,
    signedReleaseBundleIntegrated: false,
    durablePromotionTransactionIntegrated: false,
    authoritative: false,
    strictAcceptanceEffect: false,
    remainingGates: PROMOTION_REMAINING_GATES,
  };
}

function usage() {
  return `Usage: node scripts/adopt-course-original-runtime-evidence.mjs [options]

Required:
  --candidate-manifest <file>  Fixed pending root/natural candidate manifest
  --candidate-report <file>    Matching fixed pending candidate report
  --trust-registry <file>      Content-addressed pre-registration of people/runtime
  --human-review <file>        Accepted per-requirement evidence review
  --owner-review <file>        Accepted per-requirement owner promotion decision

Options:
  --project-root <directory>   Project root (default: repository root)
  --dry-run                    Non-authoritative validation/derivation; never writes
  --check                      Non-authoritative check of exact existing outputs; never writes
  --json                       Print the machine-readable result
  -h, --help                   Show this help

Canonical write/promotion mode is intentionally disabled. Only --dry-run and
--check are available as non-authoritative, read-only diagnostics; neither can
promote evidence or change strict acceptance. They are mutually exclusive.`;
}

function promotionDisabledError() {
  const error = new Error(PROMOTION_DISABLED_MESSAGE);
  error.code = PROMOTION_DISABLED_CODE;
  return error;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertObject(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be an object`);
  return value;
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function assertExactKeys(value, expected, label) {
  const observed = Object.keys(assertObject(value, label)).sort();
  const wanted = [...expected].sort();
  if (!same(observed, wanted)) throw new Error(`${label} fields must be exactly: ${wanted.join(", ")}`);
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function readJsonDocument(candidate, label) {
  let bytes;
  try {
    bytes = await readFile(candidate);
  } catch (error) {
    throw new Error(`${label} is unreadable: ${error.message}`);
  }
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {value, bytes, sha256: digest(bytes)};
}

async function readJsonLinesDocument(candidate, label) {
  const bytes = await readFile(candidate);
  const text = bytes.toString("utf8");
  if (!text.endsWith("\n")) throw new Error(`${label} must end with a newline`);
  const records = [];
  let byteOffset = 0;
  for (const [index, line] of text.split("\n").slice(0, -1).entries()) {
    if (!line.trim()) throw new Error(`${label} line ${index + 1} is empty`);
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      throw new Error(`${label} line ${index + 1} is invalid JSON: ${error.message}`);
    }
    records.push({record, byteOffset, lineNumber: index + 1});
    byteOffset += Buffer.byteLength(`${line}\n`);
  }
  return {bytes, sha256: digest(bytes), records};
}

async function assertRegularProjectFile(root, declared, label) {
  assertString(declared, label);
  if (path.isAbsolute(declared) || declared.includes("\\")) throw new Error(`${label} must be a portable project-relative path`);
  const resolved = path.resolve(root, declared);
  if (!isInside(resolved, root) || portable(path.relative(root, resolved)) !== declared) {
    throw new Error(`${label} must be a normalized project-relative path`);
  }
  await assertNoExistingSymlinkComponents(root, resolved, label);
  const info = await lstat(resolved).catch((error) => {
    throw new Error(`${label} is missing: ${error.message}`);
  });
  if (info.isSymbolicLink() || !info.isFile()) throw new Error(`${label} must be a regular non-symlink file`);
  const [actualRoot, actual] = await Promise.all([realpath(root), realpath(resolved)]);
  if (!isInside(actual, actualRoot)) throw new Error(`${label} resolves outside the project root`);
  return resolved;
}

async function resolveCliFile(root, candidate, label) {
  assertString(candidate, label);
  const resolved = path.isAbsolute(candidate) ? path.resolve(candidate) : path.resolve(root, candidate);
  if (!isInside(resolved, root)) throw new Error(`${label} escapes the project root`);
  const declared = portable(path.relative(root, resolved));
  await assertRegularProjectFile(root, declared, label);
  return {path: resolved, relative: declared};
}

function descriptor(value, label) {
  assertObject(value, label);
  assertString(value.file, `${label}.file`);
  assertSha256(value.sha256, `${label}.sha256`);
  return {file: value.file, sha256: value.sha256};
}

function sourceDescriptor(value, label) {
  assertObject(value, label);
  assertString(value.path, `${label}.path`);
  assertSha256(value.sha256, `${label}.sha256`);
  return {path: value.path, sha256: value.sha256};
}

function visitDescriptors(value, visit, cursor = "root") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitDescriptors(item, visit, `${cursor}[${index}]`));
    return;
  }
  if (!isPlainObject(value)) return;
  if (typeof value.file === "string" && typeof value.sha256 === "string") visit(value, cursor);
  for (const [key, item] of Object.entries(value)) visitDescriptors(item, visit, `${cursor}.${key}`);
}

async function verifyEvidenceDag(root, seeds) {
  const queue = [];
  const queued = new Map();
  const add = (value, label) => {
    const item = descriptor(value, label);
    const prior = queued.get(item.file);
    if (prior && prior.sha256 !== item.sha256) throw new Error(`${label} conflicts with another SHA-256 for ${item.file}`);
    if (!prior) {
      queued.set(item.file, {...item, roles: [label]});
      queue.push(item.file);
    } else if (!prior.roles.includes(label)) prior.roles.push(label);
  };
  for (const [label, value] of seeds) visitDescriptors(value, add, label);
  const verified = new Map();
  while (queue.length) {
    const file = queue.shift();
    const item = queued.get(file);
    const resolved = await assertRegularProjectFile(root, file, `evidence DAG node ${file}`);
    const bytes = await readFile(resolved);
    const observed = digest(bytes);
    if (observed !== item.sha256) throw new Error(`evidence DAG SHA-256 mismatch: ${file}`);
    const node = {...item, resolved, bytes};
    verified.set(file, node);
    const text = bytes.toString("utf8").trim();
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        node.json = JSON.parse(text);
      } catch {
        // JSONL and non-JSON evidence are validated by their dedicated consumers.
      }
      if (node.json !== undefined) visitDescriptors(node.json, add, `evidence DAG node ${file}`);
    }
  }
  return verified;
}

function requireProjection(binding, {projection, sha256, includedPaths = [], excludedPaths = []}, label) {
  if (
    binding?.hashMode !== CANONICAL_PROJECTION_ENCODING || binding?.projection !== projection || binding?.sha256 !== sha256 ||
    !same(binding.includedPaths || [], includedPaths) || !same(binding.excludedPaths || [], excludedPaths)
  ) throw new Error(`${label} projection binding is stale`);
}

function coverageIdentity(requirement) {
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

function specIdentity(spec) {
  return {
    frameDomainId: spec.identity?.frameDomainId,
    traceId: spec.identity?.traceId,
    entryStateSha256: spec.identity?.entryStateSha256,
    scenario: spec.identity?.scenario,
    language: spec.identity?.language,
    seed: String(spec.identity?.seed),
    requiredRange: spec.identity?.requiredRange,
    baselineAuthorityRequirement: spec.identity?.baselineAuthorityRequirement,
  };
}

function proofIdentity(spec) {
  return {
    frameDomainId: spec.identity.frameDomainId,
    traceId: spec.identity.traceId,
    entryStateSha256: spec.identity.entryStateSha256,
    scenario: spec.identity.scenario,
    language: spec.identity.language,
    seed: String(spec.identity.seed),
  };
}

async function loadBoundCandidate(root, candidateManifestInput, candidateReportInput) {
  const [manifestDocument, reportDocument] = await Promise.all([
    readJsonDocument(candidateManifestInput.path, "candidate manifest"),
    readJsonDocument(candidateReportInput.path, "candidate report"),
  ]);
  const candidateManifest = manifestDocument.value;
  const candidateReport = reportDocument.value;
  const definition = CANDIDATE_KINDS[candidateManifest.evidenceType];
  if (!definition) throw new Error("candidate manifest evidenceType is not a supported root/natural preparer output");
  const manifestKeys = [
    "schemaVersion", "evidenceType", "status", "authority", "strictAcceptanceEffect", "promotionRequired",
    "animationId", "requirementId", "frameDomainId", "traceId", "entryStateSha256", "scenario", "language", "seed",
    "capturedAtClaim", "source", "declaredRuntimeFacts", "attestedCaptureClaim", "frames",
  ];
  if (definition.kind === "natural") manifestKeys.push("scheduleBinding");
  assertExactKeys(candidateManifest, manifestKeys, "candidate manifest");
  const reportKeys = definition.kind === "root" ? [
    "schemaVersion", "evidenceType", "status", "authority", "strictAcceptanceEffect", "promotionRequired", "proofMode",
    "animationId", "requirementId", "identity", "traceSpecBinding", "captureKit", "launchReceipt",
    "captureSessionAttestation", "claimedRuntime", "rawEventLog", "sourceTargetResolutionLog", "stateSnapshotArchive",
    "candidateManifest", "frameResults", "unexpectedEvents", "candidateSequenceChainSha256",
  ] : [
    "schemaVersion", "evidenceType", "status", "authority", "strictAcceptanceEffect", "promotionRequired", "proofMode",
    "animationId", "requirementId", "identity", "traceSpecBinding", "originalHostEvidence", "archivedOriginalHostEvidence",
    "runtimeTreeManifest", "captureKit", "environmentIsolation", "launchReceipt", "hostEntryLog", "scheduleBinding",
    "captureSessionAttestation", "claimedRuntime", "rawEventLog", "sourceTargetResolutionLog", "stateSnapshotArchive",
    "candidateManifest", "frameResults", "orderedStepResults", "checkpointResults", "terminalResult", "unexpectedEvents",
    "candidateSequenceChainSha256",
  ];
  assertExactKeys(candidateReport, reportKeys, "candidate report");
  if (
    candidateManifest.schemaVersion !== 1 || candidateManifest.status !== CANDIDATE_STATUS ||
    candidateManifest.authority !== CANDIDATE_AUTHORITY || candidateManifest.strictAcceptanceEffect !== false ||
    !same(candidateManifest.promotionRequired, PROMOTION_REQUIRED)
  ) throw new Error("candidate manifest is not the exact pending, non-authoritative preparer contract");
  if (
    candidateReport.schemaVersion !== 1 || candidateReport.evidenceType !== definition.reportType ||
    candidateReport.status !== CANDIDATE_STATUS || candidateReport.authority !== CANDIDATE_AUTHORITY ||
    candidateReport.strictAcceptanceEffect !== false || !same(candidateReport.promotionRequired, PROMOTION_REQUIRED)
  ) throw new Error("candidate report is not the exact pending, non-authoritative preparer contract");
  if (candidateManifest.animationId !== candidateReport.animationId || candidateManifest.requirementId !== candidateReport.requirementId) {
    throw new Error("candidate manifest/report animation or requirement identity differs");
  }
  const animationId = assertString(candidateManifest.animationId, "candidate animationId");
  if (!COURSE_TRACE_PILOT_IDS.includes(animationId)) {
    throw new Error(`candidate animationId is not in the fixed course/shell trace pilot allowlist: ${animationId}`);
  }
  const requirementId = assertString(candidateManifest.requirementId, "candidate requirementId");
  const safeId = safeRequirementId(requirementId);
  const expectedManifest = portable(path.join("migrations", animationId, "evidence", definition.pendingEvidenceDirectory, safeId, "candidate-manifest.json"));
  const expectedReport = portable(path.join("migrations", animationId, "evidence", definition.pendingEvidenceDirectory, safeId, "candidate-report.json"));
  if (candidateManifestInput.relative !== expectedManifest || candidateReportInput.relative !== expectedReport) {
    throw new Error(`candidate inputs must use fixed pending paths ${expectedManifest} and ${expectedReport}`);
  }
  if (!same(candidateReport.candidateManifest, {file: expectedManifest, sha256: manifestDocument.sha256})) {
    throw new Error("candidate report does not bind the exact candidate manifest bytes");
  }
  const specBinding = descriptor(candidateReport.traceSpecBinding, "candidate report traceSpecBinding");
  const expectedSpecFile = portable(path.join("migrations", animationId, "audit", "trace-specs", `${safeId}.json`));
  if (specBinding.file !== expectedSpecFile) throw new Error(`candidate trace spec path must be ${expectedSpecFile}`);
  const specPath = await assertRegularProjectFile(root, specBinding.file, "candidate trace spec");
  const specDocument = await readJsonDocument(specPath, "candidate trace spec");
  if (specDocument.sha256 !== specBinding.sha256) throw new Error("candidate trace spec SHA-256 is stale");
  const spec = specDocument.value;
  const expectedReady = definition.kind === "root"
    ? spec.traceSpecStatus === "source-frame-accurate-root-ready-for-authoritative-capture" && spec.traceModel?.kind === "frame-accurate-root-exhaustive" && spec.schedule?.status === "not-required-frame-accurate-root"
    : spec.traceSpecStatus === "source-schedule-ready-for-authoritative-execution" && spec.traceModel?.kind === "stateful-natural-trace" && spec.schedule?.status === "source-evidenced-executable";
  if (
    spec.schemaVersion !== 1 || spec.artifactType !== "course-pilot-original-runtime-trace-specification" ||
    spec.animationId !== animationId || spec.requirementId !== requirementId || !expectedReady
  ) throw new Error("candidate is not bound to a current ready root/natural trace specification");
  const migrationsRoot = path.join(root, "migrations");
  const workspace = path.join(migrationsRoot, animationId);
  if (!isInside(workspace, migrationsRoot) || portable(path.relative(migrationsRoot, workspace)) !== animationId) {
    throw new Error("candidate migration workspace is not the fixed allowlisted migrations/<animationId> directory");
  }
  const migrationRelative = portable(path.join("migrations", animationId, "migration.json"));
  const coverageRelative = portable(path.join("migrations", animationId, "evidence", "full-frame-coverage.json"));
  const inventoryRelative = portable(path.join("migrations", animationId, "audit", "scenario-inventory.json"));
  const indexRelative = "migrations/course-shell-pilot-trace-spec-index.json";
  const [migrationPath, coveragePath, inventoryPath, indexPath] = await Promise.all([
    assertRegularProjectFile(root, migrationRelative, "migration manifest"),
    assertRegularProjectFile(root, coverageRelative, "full-frame coverage"),
    assertRegularProjectFile(root, inventoryRelative, "scenario inventory"),
    assertRegularProjectFile(root, indexRelative, "course/shell trace-spec index"),
  ]);
  const [migrationDocument, coverageDocument, inventoryDocument, indexDocument] = await Promise.all([
    readJsonDocument(migrationPath, "migration manifest"),
    readJsonDocument(coveragePath, "full-frame coverage"),
    readJsonDocument(inventoryPath, "scenario inventory"),
    readJsonDocument(indexPath, "course/shell trace-spec index"),
  ]);
  const migration = migrationDocument.value;
  const coverage = coverageDocument.value;
  const inventory = inventoryDocument.value;
  const index = indexDocument.value;
  if (migration.animationId !== animationId || coverage.animationId !== animationId || inventory.animationId !== animationId) {
    throw new Error("current migration, coverage, inventory, and candidate identities differ");
  }
  requireProjection(spec.sourceBindings?.migrationManifest, {
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
    sha256: technicalManifestSha256(migration),
    excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
  }, "trace spec migration manifest");
  requireProjection(spec.sourceBindings?.fullFrameCoverage, {
    projection: TRACE_COVERAGE_PROJECTION.id,
    sha256: traceCoverageSha256(coverage),
    includedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
    excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
  }, "trace spec full-frame coverage");
  requireProjection(spec.sourceBindings?.scenarioInventory, {
    projection: SCENARIO_INVENTORY_PROJECTION.id,
    sha256: scenarioInventorySha256(inventory),
    excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
  }, "trace spec scenario inventory");
  const requirements = (coverage.requirements || []).filter((item) => item.requirementId === requirementId);
  if (requirements.length === 1) {
    assertStrictFullDomainRequirement(
      requirements[0],
      spec.frameDomain?.frameCount,
      `${animationId}/${requirementId} original-runtime promotion`,
    );
  }
  if (requirements.length !== 1 || !same(coverageIdentity(requirements[0]), specIdentity(spec))) {
    throw new Error("candidate trace identity differs from the unique current coverage requirement");
  }
  const requirement = requirements[0];
  const indexedPilot = (index.pilots || []).find((item) => item.animationId === animationId);
  const indexed = (indexedPilot?.traceSpecs || []).filter((item) => item.requirementId === requirementId);
  const expectedExecutionSuffix = `baseline/trace-executions/${safeId}.json`;
  if (spec.executionEvidence?.expectedExecutionReportPath !== expectedExecutionSuffix) {
    throw new Error(`candidate trace spec execution report path must be ${expectedExecutionSuffix}`);
  }
  const expectedExecutionFile = portable(path.join("migrations", animationId, expectedExecutionSuffix));
  if (
    indexed.length !== 1 || indexed[0].file !== expectedSpecFile || indexed[0].sha256 !== specDocument.sha256 ||
    indexed[0].status !== spec.traceSpecStatus || indexed[0].traceModel !== spec.traceModel.kind ||
    indexed[0].expectedExecutionReport !== expectedExecutionFile
  ) throw new Error("candidate trace specification is not the exact current indexed spec");
  const source = sourceDescriptor(spec.sourceBindings?.sourceSwf, "trace spec sourceSwf");
  if (migration.source?.swf !== source.path || migration.source?.swfSha256 !== source.sha256) {
    throw new Error("migration source binding differs from trace spec");
  }
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const sourcePath = await assertRegularProjectFile(root, source.path, "preserved source SWF");
  if (!isInside(sourcePath, preservedRoot) || digest(await readFile(sourcePath)) !== source.sha256) {
    throw new Error("source SWF is outside the preserved HELP Math archive or its SHA-256 changed");
  }
  const expectedCandidateIdentity = {
    frameDomainId: candidateManifest.frameDomainId,
    traceId: candidateManifest.traceId,
    entryStateSha256: candidateManifest.entryStateSha256,
    scenario: candidateManifest.scenario,
    language: candidateManifest.language,
    seed: String(candidateManifest.seed),
  };
  if (!same(expectedCandidateIdentity, proofIdentity(spec)) || !same(candidateReport.identity, proofIdentity(spec))) {
    throw new Error("candidate manifest/report composite identity differs from the current trace spec");
  }
  const candidateSource = definition.kind === "root"
    ? {path: candidateManifest.source?.swf, sha256: candidateManifest.source?.swfSha256}
    : {path: candidateManifest.source?.swf, sha256: candidateManifest.source?.swfSha256};
  if (!same(candidateSource, source)) throw new Error("candidate source path/hash differs from current trace spec");
  const first = requirement.requiredRange?.firstFrame;
  const last = requirement.requiredRange?.lastFrame;
  if (first !== 1 || !Number.isInteger(last) || last < first || last !== spec.frameDomain?.frameCount) {
    throw new Error("current requirement range does not exhaust trace frames 1..N");
  }
  const pendingArchiveRelative = portable(path.join("artifacts", "full-frame", "pilot-baselines", animationId, safeId, definition.pendingArchiveDirectory));
  const pendingArchivePath = path.join(root, pendingArchiveRelative);
  const pendingArchiveInfo = await lstat(pendingArchivePath).catch(() => null);
  if (!pendingArchiveInfo?.isDirectory() || pendingArchiveInfo.isSymbolicLink()) throw new Error("fixed pending candidate archive is missing or not a real directory");
  await assertNoExistingSymlinkComponents(root, pendingArchivePath, "pending candidate archive");
  return {
    root,
    workspace,
    definition,
    animationId,
    requirementId,
    safeId,
    candidateManifest,
    candidateManifestDocument: manifestDocument,
    candidateManifestInput,
    candidateReport,
    candidateReportDocument: reportDocument,
    candidateReportInput,
    spec,
    specDocument,
    specFile: expectedSpecFile,
    migration,
    coverage,
    coverageDocument,
    inventory,
    index,
    indexed: indexed[0],
    requirement,
    source,
    sourcePath,
    controlPaths: {
      migrationPath,
      coveragePath,
      inventoryPath,
      indexPath,
    },
    pendingArchiveRelative,
    pendingArchivePath,
    expectedExecutionFile,
    technicalHashes: {
      sourceSwfSha256: source.sha256,
      manifestTechnicalSha256: technicalManifestSha256(migration),
      coverageTechnicalSha256: traceCoverageSha256(coverage),
      inventoryTechnicalSha256: scenarioInventorySha256(inventory),
    },
  };
}

function humanIdentity(value, label, {withId = false} = {}) {
  const expected = withId
    ? ["identityId", "kind", "fullName", "role", "organizationOrOwnerId", "contact"]
    : ["kind", "fullName", "role", "organizationOrOwnerId", "contact"];
  assertExactKeys(value, expected, label);
  const plain = withId ? {
    kind: value.kind,
    fullName: value.fullName,
    role: value.role,
    organizationOrOwnerId: value.organizationOrOwnerId,
    contact: value.contact,
  } : value;
  validateNamedHuman(plain);
  if (withId) assertString(value.identityId, `${label}.identityId`);
  return value;
}

function parseTime(value, label) {
  const observed = Date.parse(value || "");
  if (!Number.isFinite(observed) || observed > Date.now() + 5 * 60 * 1000) throw new Error(`${label} is invalid or in the future`);
  return observed;
}

async function validateTrustRegistry({root, input, document, capturedAt, toolchainReceipt, claimedRuntime, executableSha256}) {
  const registry = document.value;
  assertExactKeys(registry, [
    "schemaVersion", "evidenceType", "registryId", "issuedAt", "issuer", "identities", "runtimes", "statement", "registrySha256",
  ], "trust registry");
  if (registry.schemaVersion !== 1 || registry.evidenceType !== "course-original-runtime-promotion-trust-registry") {
    throw new Error("trust registry schema/type is invalid");
  }
  assertString(registry.registryId, "trust registry registryId");
  humanIdentity(registry.issuer, "trust registry issuer");
  if (registry.statement !== TRUST_REGISTRY_STATEMENT || registry.registrySha256 !== recordHash(registry, "registrySha256")) {
    throw new Error("trust registry statement or canonical self-hash is invalid");
  }
  const issuedAt = parseTime(registry.issuedAt, "trust registry issuedAt");
  if (issuedAt > capturedAt) throw new Error("trust registry must have been issued before the candidate capture completed");
  if (!Array.isArray(registry.identities) || registry.identities.length < 3) throw new Error("trust registry must pre-register at least operator, human reviewer, and owner identities");
  const identities = new Map();
  for (const [index, identity] of registry.identities.entries()) {
    assertExactKeys(identity, [
      "identityId", "kind", "fullName", "role", "organizationOrOwnerId", "contact", "authorizedRoles", "status", "registeredAt",
    ], `trust registry identities[${index}]`);
    humanIdentity({
      identityId: identity.identityId,
      kind: identity.kind,
      fullName: identity.fullName,
      role: identity.role,
      organizationOrOwnerId: identity.organizationOrOwnerId,
      contact: identity.contact,
    }, `trust registry identities[${index}]`, {withId: true});
    if (identities.has(identity.identityId)) throw new Error(`duplicate trust registry identityId ${identity.identityId}`);
    if (identity.status !== "active" || !Array.isArray(identity.authorizedRoles) || !identity.authorizedRoles.length || identity.authorizedRoles.some((role) => !APPROVED_ROLES.has(role))) {
      throw new Error(`trust registry identities[${index}] roles/status are invalid`);
    }
    const registeredAt = parseTime(identity.registeredAt, `trust registry identities[${index}].registeredAt`);
    if (registeredAt > issuedAt || registeredAt > capturedAt) throw new Error(`trust registry identities[${index}] was not pre-registered`);
    identities.set(identity.identityId, identity);
  }
  if (!Array.isArray(registry.runtimes) || !registry.runtimes.length) throw new Error("trust registry must pre-register at least one runtime");
  const runtimes = new Map();
  for (const [index, runtime] of registry.runtimes.entries()) {
    assertExactKeys(runtime, [
      "runtimeId", "name", "version", "executableSha256", "status", "registeredAt", "provenanceArtifacts",
    ], `trust registry runtimes[${index}]`);
    for (const field of ["runtimeId", "name", "version"]) assertString(runtime[field], `trust registry runtimes[${index}].${field}`);
    if (runtime.executableSha256 !== null) assertSha256(runtime.executableSha256, `trust registry runtimes[${index}].executableSha256`);
    if (runtime.status !== "approved") throw new Error(`trust registry runtimes[${index}] must be approved`);
    const registeredAt = parseTime(runtime.registeredAt, `trust registry runtimes[${index}].registeredAt`);
    if (registeredAt > issuedAt || registeredAt > capturedAt) throw new Error(`trust registry runtimes[${index}] was not pre-registered`);
    if (!Array.isArray(runtime.provenanceArtifacts) || !runtime.provenanceArtifacts.length) {
      throw new Error(`trust registry runtimes[${index}] needs provenanceArtifacts`);
    }
    for (const [artifactIndex, artifact] of runtime.provenanceArtifacts.entries()) {
      assertExactKeys(artifact, ["kind", "file", "sha256"], `trust registry runtimes[${index}].provenanceArtifacts[${artifactIndex}]`);
      assertString(artifact.kind, `trust registry runtimes[${index}].provenanceArtifacts[${artifactIndex}].kind`);
      const artifactPath = await assertRegularProjectFile(root, artifact.file, `runtime provenance ${runtime.runtimeId}/${artifactIndex}`);
      if (digest(await readFile(artifactPath)) !== assertSha256(artifact.sha256, `runtime provenance ${runtime.runtimeId}/${artifactIndex}.sha256`)) {
        throw new Error(`runtime provenance SHA-256 mismatch for ${runtime.runtimeId}/${artifactIndex}`);
      }
    }
    if (runtimes.has(runtime.runtimeId)) throw new Error(`duplicate trust registry runtimeId ${runtime.runtimeId}`);
    runtimes.set(runtime.runtimeId, runtime);
  }
  const trustedRuntime = runtimes.get(claimedRuntime.runtimeId);
  if (!trustedRuntime || trustedRuntime.name !== claimedRuntime.name || trustedRuntime.version !== claimedRuntime.version) {
    throw new Error("candidate runtime is not the exact pre-registered approved runtime identity");
  }
  if (executableSha256 && trustedRuntime.executableSha256 !== executableSha256) {
    throw new Error("candidate runtime executable SHA-256 differs from the pre-registered runtime");
  }
  const receiptArtifacts = toolchainReceipt.identityArtifacts || [];
  const matchingProvenance = trustedRuntime.provenanceArtifacts.some((trusted) => receiptArtifacts.some((observed) => (
    trusted.kind === observed.kind && trusted.sha256 === observed.sha256
  )));
  if (!matchingProvenance) throw new Error("pre-registered runtime provenance does not overlap the candidate toolchain identity artifacts");
  return {
    registry,
    descriptor: {file: input.relative, sha256: document.sha256},
    issuedAt,
    identities,
    runtime: trustedRuntime,
  };
}

function registeredHuman(registry, presented, role, label) {
  humanIdentity(presented, label, {withId: true});
  const trusted = registry.identities.get(presented.identityId);
  if (!trusted) throw new Error(`${label} is not pre-registered`);
  const trustedFields = {
    identityId: trusted.identityId,
    kind: trusted.kind,
    fullName: trusted.fullName,
    role: trusted.role,
    organizationOrOwnerId: trusted.organizationOrOwnerId,
    contact: trusted.contact,
  };
  if (!same(presented, trustedFields) || !trusted.authorizedRoles.includes(role)) {
    throw new Error(`${label} does not match the pre-registered identity/role ${role}`);
  }
  return trusted;
}

function expectedBindings(bound, registryDescriptor) {
  return {
    candidateManifest: {file: bound.candidateManifestInput.relative, sha256: bound.candidateManifestDocument.sha256},
    candidateReport: {file: bound.candidateReportInput.relative, sha256: bound.candidateReportDocument.sha256},
    traceSpec: {file: bound.specFile, sha256: bound.specDocument.sha256},
    sourceSwf: {path: bound.source.path, sha256: bound.source.sha256},
    trustRegistry: registryDescriptor,
  };
}

function validateReviewDocument({kind, input, document, bound, registry, captureOperatorIdentityId, runtimeId, capturedAt, humanReview}) {
  const review = document.value;
  const isOwner = kind === "owner";
  const hashField = isOwner ? "decisionSha256" : "reviewSha256";
  const type = isOwner
    ? "course-original-runtime-evidence-owner-promotion-decision"
    : "course-original-runtime-evidence-human-review";
  const keys = [
    "schemaVersion", "evidenceType", "decision", "animationId", "requirementId", "candidateManifest", "candidateReport",
    "traceSpec", "sourceSwf", "trustRegistry", "captureOperatorIdentityId", "runtimeId", "reviewer", "reviewedAt",
    "scope", "statement", "notes", hashField,
  ];
  if (isOwner) keys.push("humanReview", "decisionReason");
  assertExactKeys(review, keys, `${kind} review`);
  if (
    review.schemaVersion !== 1 || review.evidenceType !== type || review.decision !== "accepted" ||
    review.animationId !== bound.animationId || review.requirementId !== bound.requirementId
  ) throw new Error(`${kind} review schema/type/decision/identity is invalid`);
  const bindings = expectedBindings(bound, registry.descriptor);
  for (const field of ["candidateManifest", "candidateReport", "traceSpec", "sourceSwf", "trustRegistry"]) {
    if (!same(review[field], bindings[field])) throw new Error(`${kind} review ${field} binding differs from immutable input bytes`);
  }
  if (review.captureOperatorIdentityId !== captureOperatorIdentityId || review.runtimeId !== runtimeId) {
    throw new Error(`${kind} review operator/runtime binding differs from the candidate`);
  }
  registeredHuman(registry, review.reviewer, isOwner ? "owner-representative" : "human-evidence-reviewer", `${kind} reviewer`);
  const reviewedAt = parseTime(review.reviewedAt, `${kind} review reviewedAt`);
  if (reviewedAt < capturedAt || reviewedAt < registry.issuedAt) throw new Error(`${kind} review predates its bound evidence or trust registry`);
  const expectedScope = isOwner
    ? "promote-exact-candidate-to-original-runtime-baseline-only"
    : "complete-candidate-dag-native-frames-and-trace-semantics";
  const expectedStatement = isOwner ? OWNER_REVIEW_STATEMENT : HUMAN_REVIEW_STATEMENT;
  if (review.scope !== expectedScope || review.statement !== expectedStatement || review[hashField] !== recordHash(review, hashField)) {
    throw new Error(`${kind} review scope/statement/canonical self-hash is invalid`);
  }
  if (typeof review.notes !== "string") throw new Error(`${kind} review notes must be a string`);
  if (isOwner) {
    if (!same(review.humanReview, {file: humanReview.input.relative, sha256: humanReview.document.sha256})) {
      throw new Error("owner review does not bind the exact accepted human review bytes");
    }
    assertString(review.decisionReason, "owner review decisionReason");
    if (reviewedAt < humanReview.reviewedAt) throw new Error("owner review must not predate the accepted human review");
  }
  return {
    review,
    input,
    document,
    reviewedAt,
    descriptor: {file: input.relative, sha256: document.sha256},
  };
}

function findRuntimeExecutableSha256(candidateManifest, dag) {
  const declared = candidateManifest.attestedCaptureClaim?.claimedExecutableSha256;
  if (declared) return assertSha256(declared, "candidate claimedExecutableSha256");
  const observed = new Set();
  for (const node of dag.values()) {
    const visit = (value) => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!isPlainObject(value)) return;
      if (isPlainObject(value.runtime) && SHA256_PATTERN.test(value.runtime.executableSha256 || "")) {
        observed.add(value.runtime.executableSha256);
      }
      Object.values(value).forEach(visit);
    };
    if (node.json) visit(node.json);
  }
  if (observed.size > 1) throw new Error("candidate evidence DAG contains conflicting runtime executable SHA-256 identities");
  return observed.size ? [...observed][0] : null;
}

function validateCandidateAttestation(bound, dag) {
  const claim = assertObject(bound.candidateManifest.attestedCaptureClaim, "candidate attestedCaptureClaim");
  const claimKeys = bound.definition.kind === "root" ? [
    "sessionId", "namedHuman", "claimedTool", "proofMode", "entryProtocolClaim", "operationSequenceChainSha256",
    "displayListSequenceChainSha256", "captureKit", "launchReceipt", "toolchainReceipt", "captureSessionAttestation", "limitation",
  ] : [
    "sessionId", "namedHuman", "claimedTool", "claimedExecutableSha256", "proofMode", "entryProtocolClaim",
    "operationSequenceChainSha256", "stateSequenceChainSha256", "sourceTargetSequenceChainSha256", "hostEntrySequenceChainSha256",
    "environmentIsolation", "launchReceipt", "hostEntryLog", "toolchainReceipt", "captureSessionAttestation", "limitation",
  ];
  assertExactKeys(claim, claimKeys, "candidate attestedCaptureClaim");
  validateNamedHuman(claim.namedHuman);
  assertString(claim.sessionId, "candidate sessionId");
  const attestationDescriptor = descriptor(claim.captureSessionAttestation, "candidate captureSessionAttestation");
  const attestationNode = dag.get(attestationDescriptor.file);
  const attestation = attestationNode?.json;
  if (!attestation) throw new Error("candidate capture-session attestation is not valid JSON");
  const natural = bound.definition.kind === "natural";
  const attestationKeys = natural ? [
    "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "proofMode", "traceSpec", "sourceSwf",
    "originalHostSwf", "originalHostEvidence", "runtimeTreeManifest", "captureKit", "environmentIsolation", "launchReceipt",
    "hostEntryLog", "toolchainReceipt", "operationLog", "sourceTargetResolutions", "stateSnapshots", "frameSet", "scheduleBinding",
    "startedAt", "endedAt", "signedAt", "monotonicTimeOrigin", "operator", "unexpectedEvents", "statement", "notes",
    "attestationSha256",
  ] : [
    "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "proofMode", "traceSpec", "sourceSwf",
    "launchReceipt", "toolchainReceipt", "operationLog", "displayListRecords", "frameSet", "startedAt", "endedAt", "signedAt",
    "monotonicTimeOrigin", "operator", "statement", "notes", "attestationSha256",
  ];
  assertExactKeys(attestation, attestationKeys, "candidate capture-session attestation");
  const expectedType = natural ? "named-human-natural-trace-capture-session-attestation" : "named-human-root-capture-session-attestation";
  const expectedStatement = natural ? NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT : CAPTURE_SESSION_ATTESTATION_STATEMENT;
  const expectedHash = natural ? naturalCaptureSessionAttestationSha256(attestation) : captureSessionAttestationSha256(attestation);
  if (
    attestation.schemaVersion !== 1 || attestation.evidenceType !== expectedType || attestation.sessionId !== claim.sessionId ||
    attestation.animationId !== bound.animationId || attestation.requirementId !== bound.requirementId ||
    attestation.proofMode !== claim.proofMode || attestation.statement !== expectedStatement ||
    attestation.attestationSha256 !== expectedHash || !same(attestation.operator, claim.namedHuman)
  ) throw new Error("candidate capture-session attestation identity, statement, operator, or self-hash is invalid");
  validateNamedHuman(attestation.operator);
  if (!same(attestation.traceSpec, {file: bound.specFile, sha256: bound.specDocument.sha256}) || !same(attestation.sourceSwf, bound.source)) {
    throw new Error("capture-session attestation source/spec binding is stale");
  }
  const startedAt = parseTime(attestation.startedAt, "capture-session startedAt");
  const endedAt = parseTime(attestation.endedAt, "capture-session endedAt");
  const signedAt = parseTime(attestation.signedAt, "capture-session signedAt");
  if (endedAt <= startedAt || signedAt < endedAt || signedAt - endedAt > 30 * 60 * 1000) {
    throw new Error("capture-session attestation timestamps are not ordered within the signing window");
  }
  if (parseTime(bound.candidateManifest.capturedAtClaim, "candidate capturedAtClaim") !== endedAt) {
    throw new Error("candidate capturedAtClaim differs from the attested session end");
  }
  const toolchainDescriptor = descriptor(claim.toolchainReceipt, "candidate toolchainReceipt");
  const toolchainReceipt = dag.get(toolchainDescriptor.file)?.json;
  if (
    toolchainReceipt?.schemaVersion !== 1 || toolchainReceipt?.evidenceType !== "human-attested-adobe-runtime-toolchain-receipt" ||
    !same(toolchainReceipt.runtime, claim.claimedTool) || toolchainReceipt.captureSessionBinding?.sessionId !== claim.sessionId ||
    toolchainReceipt.captureSessionBinding?.traceSpecSha256 !== bound.specDocument.sha256 ||
    toolchainReceipt.captureSessionBinding?.sourceSwfSha256 !== bound.source.sha256 ||
    !Array.isArray(toolchainReceipt.identityArtifacts) || !toolchainReceipt.identityArtifacts.length
  ) throw new Error("candidate toolchain receipt runtime/session/source/spec identity is invalid");
  const toolchainCapturedAt = parseTime(toolchainReceipt.capturedAt, "toolchain receipt capturedAt");
  if (toolchainCapturedAt < startedAt || toolchainCapturedAt > endedAt) throw new Error("toolchain receipt was not captured inside the attested session");
  for (const [index, artifact] of toolchainReceipt.identityArtifacts.entries()) {
    descriptor(artifact, `toolchain receipt identityArtifacts[${index}]`);
    assertString(artifact.kind, `toolchain receipt identityArtifacts[${index}].kind`);
    if (!dag.has(artifact.file)) throw new Error(`toolchain identity artifact ${artifact.file} is outside the revalidated evidence DAG`);
  }
  const launchDescriptor = descriptor(claim.launchReceipt, "candidate launchReceipt");
  const launchReceipt = dag.get(launchDescriptor.file)?.json;
  const launchHash = natural ? naturalLaunchReceiptSha256(launchReceipt || {}) : rootLaunchReceiptSha256(launchReceipt || {});
  if (!launchReceipt || launchReceipt.receiptSha256 !== launchHash || launchReceipt.sessionId !== claim.sessionId || !same(launchReceipt.operator, claim.namedHuman)) {
    throw new Error("candidate launch receipt session/operator/self-hash is invalid");
  }
  const captureKitDescriptor = natural
    ? descriptor(bound.candidateReport.captureKit?.kitManifest, "natural candidate captureKit.kitManifest")
    : descriptor(claim.captureKit?.manifest, "root candidate captureKit.manifest");
  const captureKitManifest = dag.get(captureKitDescriptor.file)?.json;
  if (!captureKitManifest) throw new Error("candidate capture-kit manifest is not valid JSON");
  if (natural) {
    assertExactKeys(launchReceipt, [
      "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "proofMode", "captureKit",
      "environmentIsolation", "runtime", "workingDirectory", "kitCheck", "launchProtocol", "projectorStart", "hostOpen",
      "endedAt", "operator", "statement", "receiptSha256",
    ], "natural launch receipt");
    if (
      launchReceipt.schemaVersion !== 2 || launchReceipt.evidenceType !== "named-human-hash-bound-original-host-launch-receipt" ||
      launchReceipt.animationId !== bound.animationId || launchReceipt.requirementId !== bound.requirementId ||
      launchReceipt.proofMode !== NATURAL_TRACE_PROOF_MODE || launchReceipt.statement !== NATURAL_LAUNCH_RECEIPT_STATEMENT ||
      launchReceipt.launchProtocol !== NATURAL_PROJECTOR_LAUNCH_PROTOCOL || launchReceipt.projectorStart?.swfArgument !== null ||
      !Number.isInteger(launchReceipt.projectorStart?.processId) || launchReceipt.projectorStart.processId <= 0 ||
      launchReceipt.hostOpen?.method !== NATURAL_HOST_OPEN_METHOD || !same(launchReceipt.hostOpen?.menuPath, NATURAL_HOST_OPEN_MENU_PATH) ||
      launchReceipt.hostOpen?.playerWindowObserved !== true || !same(launchReceipt.runtime, toolchainReceipt.runtime)
    ) throw new Error("natural launch receipt does not revalidate the exact empty-Projector + named-human GUI host-open contract");
  } else {
    assertExactKeys(launchReceipt, [
      "schemaVersion", "evidenceType", "sessionId", "animationId", "requirementId", "captureKit", "runtime", "kitCheck",
      "launchProtocol", "projectorStart", "sourceOpen", "endedAt", "operator", "statement", "receiptSha256",
    ], "root launch receipt");
    if (
      launchReceipt.schemaVersion !== 2 || launchReceipt.evidenceType !== "named-human-hash-bound-root-source-open-receipt" ||
      launchReceipt.animationId !== bound.animationId || launchReceipt.requirementId !== bound.requirementId ||
      launchReceipt.statement !== ROOT_SOURCE_OPEN_STATEMENT || launchReceipt.launchProtocol !== ROOT_PROJECTOR_LAUNCH_PROTOCOL ||
      launchReceipt.projectorStart?.swfArgument !== null || !Number.isInteger(launchReceipt.projectorStart?.processId) ||
      launchReceipt.projectorStart.processId <= 0 || launchReceipt.sourceOpen?.method !== ROOT_SOURCE_OPEN_METHOD ||
      !same(launchReceipt.sourceOpen?.menuPath, ROOT_SOURCE_OPEN_MENU_PATH) || launchReceipt.sourceOpen?.playerWindowObserved !== true ||
      launchReceipt.runtime?.runtimeId !== toolchainReceipt.runtime.runtimeId || launchReceipt.runtime?.name !== toolchainReceipt.runtime.name ||
      launchReceipt.runtime?.version !== toolchainReceipt.runtime.version
    ) throw new Error("root launch receipt does not revalidate the exact empty-Projector + named-human GUI source-open contract");
  }
  return {
    claim,
    attestation,
    attestationDescriptor,
    toolchainReceipt,
    toolchainDescriptor,
    launchReceipt,
    launchDescriptor,
    captureKitManifest,
    captureKitDescriptor,
    startedAt,
    endedAt,
    signedAt,
    operator: claim.namedHuman,
    runtime: claim.claimedTool,
    executableSha256: findRuntimeExecutableSha256(bound.candidateManifest, dag),
  };
}

async function verifyCandidateFrames(bound, dag) {
  const {spec, candidateManifest} = bound;
  const frames = candidateManifest.frames;
  const expectedCount = spec.frameDomain.frameCount;
  if (!Array.isArray(frames) || frames.length !== expectedCount) throw new Error(`candidate frames must exhaust 1..${expectedCount}`);
  const verified = [];
  for (const [index, frame] of frames.entries()) {
    const number = index + 1;
    if (
      frame.animationId !== bound.animationId || frame.requirementId !== bound.requirementId ||
      frame.frameDomainId !== spec.identity.frameDomainId || frame.traceId !== spec.identity.traceId ||
      frame.entryStateSha256 !== spec.identity.entryStateSha256 || frame.frame !== number
    ) throw new Error(`candidate frame ${number} identity/order differs from the current trace spec`);
    const node = dag.get(frame.file);
    if (!node || node.sha256 !== frame.sha256) throw new Error(`candidate frame ${number} is absent from the revalidated evidence DAG`);
    let png;
    try {
      png = PNG.sync.read(node.bytes);
    } catch (error) {
      throw new Error(`candidate frame ${number} is not a decodable PNG: ${error.message}`);
    }
    if (
      png.width !== spec.frameDomain.nativeStage.width || png.height !== spec.frameDomain.nativeStage.height ||
      frame.width !== png.width || frame.height !== png.height
    ) throw new Error(`candidate frame ${number} dimensions differ from the native stage`);
    verified.push({...frame, node});
  }
  return verified;
}

function validateCommonLogRecord(record, {bound, attestation, label}) {
  if (
    record.schemaVersion !== 1 || record.animationId !== bound.animationId || record.requirementId !== bound.requirementId ||
    record.proofMode !== attestation.claim.proofMode || record.sessionId !== attestation.claim.sessionId ||
    record.traceSpecSha256 !== bound.specDocument.sha256 || record.sourceSwfSha256 !== bound.source.sha256 ||
    !same(record.operator, attestation.operator)
  ) throw new Error(`${label} candidate/session/spec/source/operator identity is invalid`);
}

async function validateRootCandidateEvidence(bound, dag, attestation, frames) {
  const report = bound.candidateReport;
  if (!["direct-seek-root-exhaustive", "sequential-step-root-exhaustive"].includes(report.proofMode) || report.proofMode !== attestation.claim.proofMode) {
    throw new Error("root candidate proofMode is invalid or inconsistent");
  }
  const raw = descriptor(report.rawEventLog, "candidate rawEventLog");
  const states = descriptor(report.stateSnapshotArchive, "candidate stateSnapshotArchive");
  const [rawLog, stateLog] = await Promise.all([
    readJsonLinesDocument(dag.get(raw.file).resolved, "candidate root operation log"),
    readJsonLinesDocument(dag.get(states.file).resolved, "candidate root display-list log"),
  ]);
  if (rawLog.sha256 !== raw.sha256 || stateLog.sha256 !== states.sha256 || rawLog.records.length !== frames.length || stateLog.records.length !== frames.length) {
    throw new Error("root candidate log hashes/counts differ from the candidate report");
  }
  if (!Array.isArray(report.frameResults) || report.frameResults.length !== frames.length) throw new Error("root candidate report frameResults are incomplete");
  let priorEvent = null;
  let priorState = null;
  let priorCandidateResult = null;
  for (let index = 0; index < frames.length; index += 1) {
    const frame = index + 1;
    const eventItem = rawLog.records[index];
    const stateItem = stateLog.records[index];
    const event = eventItem.record;
    const state = stateItem.record;
    validateCommonLogRecord(event, {bound, attestation, label: `root event ${frame}`});
    validateCommonLogRecord(state, {bound, attestation, label: `root state ${frame}`});
    const expectedOperation = report.proofMode === "direct-seek-root-exhaustive" ? "direct-seek" : index === 0 ? "rewind" : "step-forward";
    if (
      event.evidenceType !== "attested-root-frame-operation" || event.sequence !== frame || event.operation !== expectedOperation ||
      event.operationCountSincePrevious !== 1 || event.requestedRootFrame !== frame || event.observedRootFrame !== frame ||
      event.previousEventSha256 !== priorEvent || event.eventSha256 !== operationEventSha256(event) ||
      event.screenshotSha256 !== frames[index].sha256
    ) throw new Error(`root operation record ${frame} breaks identity/frame/hash chain`);
    if (
      state.evidenceType !== "attested-display-list-state" || state.sequence !== frame || state.frameDomainId !== bound.spec.frameDomain.id ||
      state.observedRootFrame !== frame || state.previousRecordSha256 !== priorState || state.recordSha256 !== displayListRecordSha256(state) ||
      state.displayListStateSha256 !== sha256Text(canonicalJson(state.displayListState)) ||
      event.displayListRecordSha256 !== state.recordSha256 || state.screenshotSha256 !== frames[index].sha256
    ) throw new Error(`root display-list record ${frame} breaks identity/frame/hash chain`);
    const result = report.frameResults[index];
    if (
      result.frame !== frame || result.positioningOperation !== expectedOperation || result.operationCountSincePrevious !== 1 ||
      result.requestSequence !== event.sequence || result.captureLogLocator?.requestSequence !== event.sequence ||
      result.captureLogLocator?.byteOffset !== eventItem.byteOffset || result.observedRootFrame !== frame ||
      result.observedDisplayListStateSha256 !== state.displayListStateSha256 || result.displayListRecordSha256 !== state.recordSha256 ||
      result.screenshotFile !== frames[index].file || result.screenshotSha256 !== frames[index].sha256 ||
      result.width !== frames[index].width || result.height !== frames[index].height ||
      result.previousResultSha256 !== priorCandidateResult || result.result !== "candidate-observation-bound" ||
      result.resultSha256 !== recordHash(result, "resultSha256")
    ) throw new Error(`root candidate frame result ${frame} is not bound to the revalidated event/state/PNG evidence`);
    priorEvent = event.eventSha256;
    priorState = state.recordSha256;
    priorCandidateResult = result.resultSha256;
  }
  if (
    report.candidateSequenceChainSha256 !== priorCandidateResult ||
    attestation.claim.operationSequenceChainSha256 !== priorEvent ||
    attestation.claim.displayListSequenceChainSha256 !== priorState ||
    !same(attestation.attestation.operationLog, {
      file: attestation.attestation.operationLog.file,
      sha256: raw.sha256,
      finalEventSha256: priorEvent,
      eventCount: frames.length,
    }) || attestation.attestation.operationLog.file === "" ||
    !same(attestation.attestation.displayListRecords, {
      file: attestation.attestation.displayListRecords.file,
      sha256: states.sha256,
      finalRecordSha256: priorState,
      recordCount: frames.length,
    }) || attestation.attestation.displayListRecords.file === "" ||
    attestation.attestation.toolchainReceipt?.sha256 !== attestation.toolchainDescriptor.sha256 ||
    attestation.attestation.launchReceipt?.sha256 !== attestation.launchDescriptor.sha256 ||
    report.rawEventLog.eventCount !== frames.length || report.rawEventLog.dispatchedActionCount !== 0 ||
    !Array.isArray(report.unexpectedEvents) || report.unexpectedEvents.length
  ) throw new Error("root candidate terminal chains/counts/unexpected-events contract is invalid");
  if (
    attestation.attestation.frameSet?.frameCount !== frames.length ||
    !Array.isArray(attestation.attestation.frameSet?.frames) || attestation.attestation.frameSet.frames.length !== frames.length ||
    attestation.attestation.frameSet.frames.some((item, index) => item.frame !== index + 1 || item.sha256 !== frames[index].sha256)
  ) throw new Error("root capture-session frameSet differs from the revalidated candidate frames");
  const targetDescriptor = descriptor(report.sourceTargetResolutionLog, "candidate sourceTargetResolutionLog");
  const targetLog = dag.get(targetDescriptor.file)?.json;
  if (
    targetLog?.schemaVersion !== 1 || targetLog?.evidenceType !== "attested-root-capture-candidate-source-target-resolution-log" ||
    targetLog?.status !== "not-applicable-no-source-or-user-actions" || targetLog?.animationId !== bound.animationId ||
    targetLog?.requirementId !== bound.requirementId || targetLog?.proofMode !== report.proofMode ||
    !same(targetLog?.traceSpecBinding, {file: bound.specFile, sha256: bound.specDocument.sha256}) ||
    !same(targetLog?.rawEventLog, {file: raw.file, sha256: raw.sha256}) ||
    !Array.isArray(targetLog?.resolvedTargets) || targetLog.resolvedTargets.length || targetLog?.dispatchedActionCount !== 0
  ) throw new Error("root candidate source-target log does not prove the no-source/no-user-action contract");
  return {rawLog, stateLog, targetDescriptor};
}

function scheduleBinding(spec) {
  return {
    orderedStepsSha256: sha256Text(canonicalJson(spec.schedule.orderedSteps)),
    stateCheckpointsSha256: sha256Text(canonicalJson(spec.schedule.stateCheckpoints)),
    playbackSegmentsSha256: sha256Text(canonicalJson(spec.schedule.playbackSegments)),
    terminalExpectedStateSha256: sha256Text(canonicalJson(spec.schedule.terminalSemantics.expectedState)),
  };
}

function stateContains(observed, expected) {
  if (Array.isArray(expected)) return Array.isArray(observed) && observed.length === expected.length && expected.every((item, index) => stateContains(observed[index], item));
  if (isPlainObject(expected)) return isPlainObject(observed) && Object.entries(expected).every(([key, value]) => Object.hasOwn(observed, key) && stateContains(observed[key], value));
  return Object.is(observed, expected);
}

async function validateNaturalCandidateEvidence(bound, dag, attestation, frames) {
  const report = bound.candidateReport;
  if (report.proofMode !== NATURAL_TRACE_PROOF_MODE || attestation.claim.proofMode !== NATURAL_TRACE_PROOF_MODE) throw new Error("natural candidate proofMode is invalid");
  if (!same(bound.candidateManifest.scheduleBinding, scheduleBinding(bound.spec)) || !same(report.scheduleBinding, scheduleBinding(bound.spec))) {
    throw new Error("natural candidate schedule binding differs from the current trace specification");
  }
  const raw = descriptor(report.rawEventLog, "candidate rawEventLog");
  const states = descriptor(report.stateSnapshotArchive, "candidate stateSnapshotArchive");
  const targets = descriptor(report.sourceTargetResolutionLog, "candidate sourceTargetResolutionLog");
  const [rawLog, stateLog, targetLog] = await Promise.all([
    readJsonLinesDocument(dag.get(raw.file).resolved, "candidate natural operation log"),
    readJsonLinesDocument(dag.get(states.file).resolved, "candidate natural state log"),
    readJsonLinesDocument(dag.get(targets.file).resolved, "candidate natural target log"),
  ]);
  const steps = bound.spec.schedule.orderedSteps;
  if (
    rawLog.sha256 !== raw.sha256 || stateLog.sha256 !== states.sha256 || targetLog.sha256 !== targets.sha256 ||
    stateLog.records.length !== frames.length || targetLog.records.length !== steps.length || rawLog.records.length !== frames.length + steps.length
  ) throw new Error("natural candidate log hashes/counts differ from current frames/schedule");
  const stateByRecord = new Map();
  let priorState = null;
  for (const [index, item] of stateLog.records.entries()) {
    const frame = index + 1;
    const state = item.record;
    validateCommonLogRecord(state, {bound, attestation, label: `natural state ${frame}`});
    if (
      state.evidenceType !== "attested-natural-trace-state-snapshot" || state.sequence !== frame ||
      state.frameDomainId !== bound.spec.frameDomain.id || state.observedLocalFrame !== frame ||
      state.observedRootFrame !== bound.spec.frameDomain.parentEntryFrame || state.previousRecordSha256 !== priorState ||
      state.recordSha256 !== naturalStateRecordSha256(state) || state.observedStateSha256 !== sha256Text(canonicalJson(state.observedState)) ||
      state.screenshotSha256 !== frames[index].sha256 || state.observedState?.localFrame !== frame ||
      String(state.observedState?.seed) !== String(bound.spec.identity.seed) || state.observedState?.language !== bound.spec.identity.language
    ) throw new Error(`natural state record ${frame} breaks identity/frame/state/hash chain`);
    stateByRecord.set(state.recordSha256, {...item, state});
    priorState = state.recordSha256;
  }
  let priorTarget = null;
  const targetByOrder = new Map();
  for (const [index, item] of targetLog.records.entries()) {
    const target = item.record;
    const step = steps[index];
    validateCommonLogRecord(target, {bound, attestation, label: `natural target ${index + 1}`});
    if (
      target.evidenceType !== "attested-natural-source-target-resolution" || target.sequence !== index + 1 ||
      target.scheduleStepOrder !== step.order || !same(target.action, step.action) ||
      !same(target.expectedSourceTarget, step.sourceTarget) || !same(target.resolvedSourceTarget, step.sourceTarget) ||
      target.resolution !== "resolved-exactly-to-bound-source-target" || target.previousRecordSha256 !== priorTarget ||
      target.recordSha256 !== naturalTargetResolutionSha256(target)
    ) throw new Error(`natural source-target record ${index + 1} differs from current schedule/hash chain`);
    targetByOrder.set(step.order, {...item, target});
    priorTarget = target.recordSha256;
  }
  const stepsAfterFrame = new Map();
  for (const step of steps) {
    const frame = step.preStateCheckpoint.expectedState.localFrame;
    const list = stepsAfterFrame.get(frame) || [];
    list.push(step);
    stepsAfterFrame.set(frame, list);
  }
  const expectedPlan = [];
  for (let frame = 1; frame <= frames.length; frame += 1) {
    expectedPlan.push({kind: "frame-observation", frame});
    for (const step of stepsAfterFrame.get(frame) || []) expectedPlan.push({kind: "source-action-dispatch", step});
  }
  let priorEvent = null;
  const actionEvents = new Map();
  for (const [index, item] of rawLog.records.entries()) {
    const event = item.record;
    const expected = expectedPlan[index];
    validateCommonLogRecord(event, {bound, attestation, label: `natural event ${index + 1}`});
    if (
      event.evidenceType !== "attested-natural-trace-operation" || event.eventKind !== expected.kind || event.sequence !== index + 1 ||
      event.previousEventSha256 !== priorEvent || event.eventSha256 !== naturalOperationEventSha256(event)
    ) throw new Error(`natural operation event ${index + 1} breaks plan/identity/hash chain`);
    if (expected.kind === "frame-observation") {
      const state = stateLog.records[expected.frame - 1].record;
      if (
        event.observedLocalFrame !== expected.frame || event.observedRootFrame !== state.observedRootFrame ||
        event.stateSnapshotRecordSha256 !== state.recordSha256 || event.screenshotSha256 !== state.screenshotSha256
      ) throw new Error(`natural frame event ${expected.frame} differs from state/PNG evidence`);
    } else {
      const target = targetByOrder.get(expected.step.order).target;
      if (
        event.scheduleStepOrder !== expected.step.order || !same(event.action, expected.step.action) ||
        !same(event.sourceTarget, expected.step.sourceTarget) || event.sourceTargetResolutionRecordSha256 !== target.recordSha256 ||
        !stateByRecord.has(event.preStateSnapshotRecordSha256) || !stateByRecord.has(event.postStateSnapshotRecordSha256)
      ) throw new Error(`natural action event ${expected.step.order} differs from schedule/state/target evidence`);
      actionEvents.set(expected.step.order, {...item, event});
    }
    priorEvent = event.eventSha256;
  }
  if (!Array.isArray(report.frameResults) || report.frameResults.length !== frames.length) throw new Error("natural candidate frameResults are incomplete");
  let priorCandidateResult = null;
  for (const [index, result] of report.frameResults.entries()) {
    const frame = index + 1;
    const stateItem = stateLog.records[index];
    const state = stateItem.record;
    const frameEvent = rawLog.records.find((item) => item.record.eventKind === "frame-observation" && item.record.observedLocalFrame === frame);
    if (
      result.frame !== frame || result.observedLocalFrame !== frame || result.observedRootFrame !== state.observedRootFrame ||
      result.operationSequence !== frameEvent.record.sequence || result.stateSnapshotRecordSha256 !== state.recordSha256 ||
      result.observedStateSha256 !== state.observedStateSha256 || result.screenshotFile !== frames[index].file ||
      result.screenshotSha256 !== frames[index].sha256 || result.previousResultSha256 !== priorCandidateResult ||
      result.result !== "candidate-natural-observation-bound" || result.resultSha256 !== recordHash(result, "resultSha256")
    ) throw new Error(`natural candidate frame result ${frame} is not bound to revalidated logs/PNG`);
    priorCandidateResult = result.resultSha256;
  }
  if (!Array.isArray(report.orderedStepResults) || report.orderedStepResults.length !== steps.length) throw new Error("natural candidate orderedStepResults are incomplete");
  for (const [index, result] of report.orderedStepResults.entries()) {
    const step = steps[index];
    const event = actionEvents.get(step.order)?.event;
    const target = targetByOrder.get(step.order)?.target;
    if (
      result.order !== step.order || result.result !== "candidate-exact-source-step-observed" ||
      !same(result.action, step.action) || !same(result.sourceTarget, step.sourceTarget) ||
      result.operationSequence !== event?.sequence || result.operationEventSha256 !== event?.eventSha256 ||
      result.sourceTargetResolutionRecordSha256 !== target?.recordSha256 ||
      result.preCheckpointId !== step.preStateCheckpoint.checkpointId || result.postCheckpointId !== step.postStateCheckpoint.checkpointId
    ) throw new Error(`natural candidate ordered step ${step.order} differs from current schedule/logs`);
  }
  if (!Array.isArray(report.checkpointResults) || report.checkpointResults.length !== bound.spec.schedule.stateCheckpoints.length) {
    throw new Error("natural candidate checkpointResults are incomplete");
  }
  for (const [index, result] of report.checkpointResults.entries()) {
    const checkpoint = bound.spec.schedule.stateCheckpoints[index];
    const state = stateLog.records[checkpoint.expectedState.localFrame - 1]?.record;
    if (
      result.checkpointId !== checkpoint.id || result.localFrame !== checkpoint.expectedState.localFrame ||
      result.expectedStateSha256 !== sha256Text(canonicalJson(checkpoint.expectedState)) ||
      !same(result.observedState, state?.observedState) || result.observedStateSha256 !== state?.observedStateSha256 ||
      result.stateSnapshotRecordSha256 !== state?.recordSha256 || !stateContains(state?.observedState, checkpoint.expectedState) ||
      result.result !== "candidate-expected-state-semantics-observed"
    ) throw new Error(`natural candidate checkpoint ${checkpoint.id} differs from current semantics/state log`);
  }
  const terminalState = stateLog.records.at(-1).record;
  if (
    report.terminalResult?.expectedStateSha256 !== sha256Text(canonicalJson(bound.spec.schedule.terminalSemantics.expectedState)) ||
    !same(report.terminalResult?.observedState, terminalState.observedState) ||
    report.terminalResult?.observedStateSha256 !== terminalState.observedStateSha256 ||
    report.terminalResult?.stateSnapshotRecordSha256 !== terminalState.recordSha256 ||
    !stateContains(terminalState.observedState, bound.spec.schedule.terminalSemantics.expectedState) ||
    report.terminalResult?.result !== "candidate-terminal-semantics-observed"
  ) throw new Error("natural candidate terminal semantics differ from current trace/state log");
  if (
    report.candidateSequenceChainSha256 !== priorCandidateResult || attestation.claim.operationSequenceChainSha256 !== priorEvent ||
    attestation.claim.stateSequenceChainSha256 !== priorState || attestation.claim.sourceTargetSequenceChainSha256 !== priorTarget ||
    attestation.attestation.operationLog?.sha256 !== raw.sha256 || attestation.attestation.operationLog?.finalEventSha256 !== priorEvent ||
    attestation.attestation.operationLog?.eventCount !== rawLog.records.length ||
    attestation.attestation.stateSnapshots?.sha256 !== states.sha256 || attestation.attestation.stateSnapshots?.finalRecordSha256 !== priorState ||
    attestation.attestation.stateSnapshots?.recordCount !== stateLog.records.length ||
    attestation.attestation.sourceTargetResolutions?.sha256 !== targets.sha256 ||
    attestation.attestation.sourceTargetResolutions?.finalRecordSha256 !== priorTarget ||
    attestation.attestation.sourceTargetResolutions?.recordCount !== targetLog.records.length ||
    attestation.attestation.toolchainReceipt?.sha256 !== attestation.toolchainDescriptor.sha256 ||
    attestation.attestation.launchReceipt?.sha256 !== attestation.launchDescriptor.sha256 ||
    report.rawEventLog.eventCount !== rawLog.records.length || report.rawEventLog.dispatchedActionCount !== steps.length ||
    !Array.isArray(report.unexpectedEvents) || report.unexpectedEvents.length
  ) throw new Error("natural candidate terminal chains/counts/unexpected-events contract is invalid");
  if (
    attestation.attestation.frameSet?.frameCount !== frames.length ||
    !Array.isArray(attestation.attestation.frameSet?.frames) || attestation.attestation.frameSet.frames.length !== frames.length ||
    attestation.attestation.frameSet.frames.some((item, index) => item.frame !== index + 1 || item.sha256 !== frames[index].sha256)
  ) throw new Error("natural capture-session frameSet differs from the revalidated candidate frames");
  return {rawLog, stateLog, targetLog, actionEvents, targetByOrder};
}

async function walkRegularTree(root, directory, label) {
  const output = [];
  async function visit(current) {
    for (const entry of (await readdir(current, {withFileTypes: true})).sort((left, right) => left.name.localeCompare(right.name))) {
      const candidate = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`${label} contains forbidden symbolic link ${portable(path.relative(root, candidate))}`);
      if (entry.isDirectory()) await visit(candidate);
      else if (entry.isFile()) output.push(candidate);
      else throw new Error(`${label} contains unsupported filesystem entry ${portable(path.relative(root, candidate))}`);
    }
  }
  await visit(directory);
  return output;
}

function remapArchiveFile(bound, acceptedArchiveRelative, file, label) {
  const prefix = `${bound.pendingArchiveRelative}/`;
  if (!file.startsWith(prefix)) throw new Error(`${label} must be inside the fixed pending candidate archive`);
  return `${acceptedArchiveRelative}/${file.slice(prefix.length)}`;
}

function canonicalFrameDescriptors(bound, frames, acceptedArchiveRelative) {
  return frames.map((item) => ({
    animationId: bound.animationId,
    requirementId: bound.requirementId,
    frameDomainId: bound.spec.identity.frameDomainId,
    traceId: bound.spec.identity.traceId,
    entryStateSha256: bound.spec.identity.entryStateSha256,
    frame: item.frame,
    file: remapArchiveFile(bound, acceptedArchiveRelative, item.file, `candidate frame ${item.frame}`),
    sha256: item.sha256,
    width: item.width,
    height: item.height,
  }));
}

function observationFromState(item, spec, eventLogOffset = item.byteOffset) {
  const state = item.record;
  return {
    observedState: state.observedState,
    observedStateSha256: state.observedStateSha256,
    rootFrame: state.observedRootFrame,
    frameDomainId: spec.identity.frameDomainId,
    localFrame: state.observedLocalFrame,
    screenshotSha256: state.screenshotSha256,
    eventLogOffset,
  };
}

export function buildCanonicalReport({bound, attestation, evidence, canonicalFrames, acceptedArchiveRelative, baselineDescriptor}) {
  const remap = (value, label) => ({
    ...value,
    file: remapArchiveFile(bound, acceptedArchiveRelative, value.file, label),
  });
  const common = {
    schemaVersion: 1,
    status: "complete-pass",
    proofMode: bound.candidateReport.proofMode,
    animationId: bound.animationId,
    requirementId: bound.requirementId,
    identity: proofIdentity(bound.spec),
    traceSpecBinding: {file: bound.specFile, sha256: bound.specDocument.sha256},
    authorizedRuntime: {
      name: attestation.runtime.name,
      version: attestation.runtime.version,
      build: attestation.runtime.version,
      launchProtocol: attestation.claim.entryProtocolClaim,
      authority: bound.spec.identity.baselineAuthorityRequirement,
      sourceSwfSha256: bound.source.sha256,
    },
    rawEventLog: remap(bound.candidateReport.rawEventLog, "rawEventLog"),
    sourceTargetResolutionLog: remap(bound.candidateReport.sourceTargetResolutionLog, "sourceTargetResolutionLog"),
    stateSnapshotArchive: remap(bound.candidateReport.stateSnapshotArchive, "stateSnapshotArchive"),
    originalRuntimeCaptureManifest: baselineDescriptor,
    zeroActionObservation: null,
    unexpectedEvents: [],
  };
  if (bound.definition.kind === "root") {
    const positioningAuthority = common.proofMode === "direct-seek-root-exhaustive"
      ? "original-runtime-direct-seek"
      : "original-runtime-frame-step";
    common.authorizedRuntime.framePositioningAuthority = positioningAuthority;
    let previousResultSha256 = null;
    const frameResults = bound.candidateReport.frameResults.map((candidate, index) => {
      const frame = canonicalFrames[index];
      const result = {
        frame: frame.frame,
        positioningOperation: candidate.positioningOperation,
        operationCountSincePrevious: candidate.operationCountSincePrevious,
        requestSequence: candidate.requestSequence,
        captureLogLocator: candidate.captureLogLocator,
        observedRootFrame: candidate.observedRootFrame,
        observedDisplayListStateSha256: candidate.observedDisplayListStateSha256,
        displayListRecordSha256: candidate.displayListRecordSha256,
        screenshotFile: frame.file,
        screenshotSha256: frame.sha256,
        width: frame.width,
        height: frame.height,
        previousResultSha256,
        result: "pass",
      };
      result.resultSha256 = recordHash(result, "resultSha256");
      previousResultSha256 = result.resultSha256;
      return result;
    });
    return {
      ...common,
      frameResults,
      orderedStepResults: [],
      stateCheckpointResults: [],
      terminalResult: null,
      sequenceChainSha256: previousResultSha256,
    };
  }
  common.authorizedRuntime.executableSha256 = attestation.executableSha256;
  const frameEvidence = canonicalFrames.map(({frame, file, sha256}) => ({frame, file, sha256}));
  const stateByFrame = new Map(evidence.stateLog.records.map((item) => [item.record.observedLocalFrame, item]));
  const eventOffsetByFrame = new Map((evidence.rawLog?.records || [])
    .filter((item) => item.record.eventKind === "frame-observation")
    .map((item) => [item.record.observedLocalFrame, item.byteOffset]));
  const observe = (item) => observationFromState(item, bound.spec, eventOffsetByFrame.get(item.record.observedLocalFrame));
  let previousResultSha256 = null;
  const orderedStepResults = bound.spec.schedule.orderedSteps.map((step) => {
    const eventItem = evidence.actionEvents.get(step.order);
    const event = eventItem.event;
    const preState = stateByFrame.get(step.preStateCheckpoint.expectedState.localFrame);
    const postState = stateByFrame.get(step.postStateCheckpoint.expectedState.localFrame);
    const frames = [...new Set([preState.record.observedLocalFrame, postState.record.observedLocalFrame])]
      .sort((left, right) => left - right)
      .map((frame) => frameEvidence[frame - 1]);
    const result = {
      order: step.order,
      scheduledStepSha256: sha256Text(canonicalJson(step)),
      eventSequence: event.sequence,
      rawEventLogLocator: {eventSequence: event.sequence, byteOffset: eventItem.byteOffset},
      dispatchedAction: event.action,
      resolvedSourceTarget: evidence.targetByOrder.get(step.order).target.resolvedSourceTarget,
      preState: observe(preState),
      postState: observe(postState),
      frameEvidence: frames,
      previousResultSha256,
      result: "pass",
    };
    result.resultSha256 = recordHash(result, "resultSha256");
    previousResultSha256 = result.resultSha256;
    return result;
  });
  const stateCheckpointResults = bound.spec.schedule.stateCheckpoints.map((checkpoint) => {
    const state = stateByFrame.get(checkpoint.expectedState.localFrame);
    return {
      checkpointId: checkpoint.id,
      expectedStateSha256: sha256Text(canonicalJson(checkpoint.expectedState)),
      observation: observe(state),
      frameEvidence: [frameEvidence[checkpoint.expectedState.localFrame - 1]],
      result: "pass",
    };
  });
  const terminalState = evidence.stateLog.records.at(-1);
  return {
    ...common,
    frameResults: [],
    orderedStepResults,
    stateCheckpointResults,
    terminalResult: {
      expectedSemanticsSha256: sha256Text(canonicalJson(bound.spec.schedule.terminalSemantics)),
      observation: observe(terminalState),
      frameEvidence,
      rawEventLogSha256: common.rawEventLog.sha256,
      result: "pass",
    },
    sequenceChainSha256: previousResultSha256,
  };
}

async function buildArchiveInventory(bound, promotionInputs, acceptedArchiveRelative) {
  const sourceFiles = await walkRegularTree(bound.root, bound.pendingArchivePath, "pending candidate archive");
  const inventory = [];
  const copies = [];
  for (const source of sourceFiles) {
    const suffix = portable(path.relative(bound.pendingArchivePath, source));
    const bytes = await readFile(source);
    const destination = `${acceptedArchiveRelative}/${suffix}`;
    inventory.push({file: destination, sha256: digest(bytes), source: portable(path.relative(bound.root, source))});
    copies.push({source, suffix});
  }
  for (const item of promotionInputs) {
    const destination = `${acceptedArchiveRelative}/promotion-inputs/${item.basename}`;
    inventory.push({file: destination, sha256: item.sha256, source: item.relative});
    copies.push({source: item.path, suffix: `promotion-inputs/${item.basename}`});
  }
  inventory.sort((left, right) => left.file.localeCompare(right.file));
  const duplicate = inventory.find((item, index) => index && item.file === inventory[index - 1].file);
  if (duplicate) throw new Error(`canonical archive inventory path collision: ${duplicate.file}`);
  return {inventory, copies, sha256: sha256Text(canonicalJson(inventory))};
}

function dedupeBlockingEvidence(items, replacements) {
  const replaced = new Set(replacements.map((item) => item.file));
  const output = [];
  const seen = new Set();
  for (const item of [...(Array.isArray(items) ? items : []), ...replacements]) {
    if (!item?.file || !item?.sha256) continue;
    if (replaced.has(item.file) && !replacements.some((replacement) => same(replacement, item))) continue;
    const key = `${item.file}\0${item.sha256}`;
    if (!seen.has(key)) {
      seen.add(key);
      output.push(item);
    }
  }
  return output;
}

function deriveCoverage(bound, {authority, baselineDescriptor, executionDescriptor, promotionDescriptor}) {
  const coverage = structuredClone(bound.coverage);
  const requirements = coverage.requirements.filter((item) => item.requirementId === bound.requirementId);
  if (requirements.length !== 1) throw new Error("coverage requirement disappeared during promotion derivation");
  const requirement = requirements[0];
  requirement.baselineAuthority = authority;
  requirement.baselineCaptureManifest = baselineDescriptor.file;
  requirement.baselineCaptureManifestSha256 = baselineDescriptor.sha256;
  if (requirement.status !== "complete") requirement.blockingReason = PROMOTED_BLOCKING_REASON;
  requirement.blockingEvidence = dedupeBlockingEvidence(requirement.blockingEvidence, [
    baselineDescriptor,
    executionDescriptor,
    promotionDescriptor,
  ]);
  return coverage;
}

function actualAuthority(bound) {
  if (bound.definition.kind === "natural") return "original-runtime-natural-trace";
  return bound.candidateReport.proofMode === "direct-seek-root-exhaustive"
    ? "original-runtime-direct-seek"
    : "original-runtime-frame-step";
}

async function derivePromotion({bound, dag, attestation, evidence, frames, registry, humanReview, ownerReview}) {
  const acceptedArchiveRelative = portable(path.join("artifacts", "full-frame", "pilot-baselines", bound.animationId, bound.safeId, "accepted-original-runtime"));
  const acceptedArchivePath = path.join(bound.root, acceptedArchiveRelative);
  const baselineRelative = portable(path.join("migrations", bound.animationId, "baseline", "original-runtime", `${bound.safeId}.json`));
  const baselinePath = path.join(bound.root, baselineRelative);
  const executionRelative = bound.expectedExecutionFile;
  const executionPath = path.join(bound.root, executionRelative);
  const promotionRelative = portable(path.join("migrations", bound.animationId, "evidence", "original-runtime-promotions", `${bound.safeId}.json`));
  const promotionPath = path.join(bound.root, promotionRelative);
  const promotionInputs = [
    {...bound.candidateManifestInput, sha256: bound.candidateManifestDocument.sha256, basename: "candidate-manifest.json"},
    {...bound.candidateReportInput, sha256: bound.candidateReportDocument.sha256, basename: "candidate-report.json"},
    {...registry.input, sha256: registry.document.sha256, basename: "trust-registry.json"},
    {...humanReview.input, sha256: humanReview.document.sha256, basename: "human-review.json"},
    {...ownerReview.input, sha256: ownerReview.document.sha256, basename: "owner-review.json"},
  ];
  const archive = await buildArchiveInventory(bound, promotionInputs, acceptedArchiveRelative);
  const canonicalFrames = canonicalFrameDescriptors(bound, frames, acceptedArchiveRelative);
  const authority = actualAuthority(bound);
  const baseline = {
    schemaVersion: 2,
    evidenceType: "original-runtime-frame-domain-baseline",
    status: "complete",
    animationId: bound.animationId,
    requirementId: bound.requirementId,
    frameDomainId: bound.spec.identity.frameDomainId,
    traceId: bound.spec.identity.traceId,
    entryStateSha256: bound.spec.identity.entryStateSha256,
    scenario: bound.spec.identity.scenario,
    language: bound.spec.identity.language,
    seed: String(bound.spec.identity.seed),
    baselineAuthority: authority,
    source: {swf: bound.source.path, swfSha256: bound.source.sha256},
    runtime: {
      stage: bound.spec.frameDomain.nativeStage,
      fps: bound.spec.frameDomain.fps,
      frameCount: bound.spec.frameDomain.frameCount,
      frameNumbering: "one-indexed",
    },
    frames: canonicalFrames,
  };
  const baselineText = jsonText(baseline);
  const baselineDescriptor = {file: baselineRelative, sha256: digest(Buffer.from(baselineText))};
  const report = buildCanonicalReport({bound, attestation, evidence, canonicalFrames, acceptedArchiveRelative, baselineDescriptor});
  validateExecutionProof(bound.spec, report, {traceSpecFile: bound.specFile, traceSpecSha256: bound.specDocument.sha256});
  const reportText = jsonText(report);
  const executionDescriptor = {file: executionRelative, sha256: digest(Buffer.from(reportText))};
  const scriptSha256 = digest(await readFile(scriptPath));
  const dagNodes = [...dag.values()].map((item) => ({file: item.file, sha256: item.sha256, roles: [...item.roles].sort()}))
    .sort((left, right) => left.file.localeCompare(right.file));
  const promotion = {
    schemaVersion: 1,
    evidenceType: "course-original-runtime-evidence-promotion",
    status: "complete-original-runtime-baseline-only",
    animationId: bound.animationId,
    requirementId: bound.requirementId,
    identity: proofIdentity(bound.spec),
    promotedAt: ownerReview.review.reviewedAt,
    candidate: {
      manifest: {file: bound.candidateManifestInput.relative, sha256: bound.candidateManifestDocument.sha256},
      report: {file: bound.candidateReportInput.relative, sha256: bound.candidateReportDocument.sha256},
      archive: bound.pendingArchiveRelative,
    },
    immutableBindings: {
      traceSpec: {file: bound.specFile, sha256: bound.specDocument.sha256},
      sourceSwf: {path: bound.source.path, sha256: bound.source.sha256},
      traceCoverageProjection: {
        hashMode: CANONICAL_PROJECTION_ENCODING,
        projection: TRACE_COVERAGE_PROJECTION.id,
        sha256: traceCoverageSha256(bound.coverage),
        includedPaths: [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
        excludedPaths: [...TRACE_COVERAGE_PROJECTION.excludedRequirementPaths],
      },
    },
    trustedIdentity: {
      registry: {file: registry.input.relative, sha256: registry.document.sha256},
      captureOperatorIdentityId: humanReview.review.captureOperatorIdentityId,
      captureOperator: attestation.operator,
      runtimeId: attestation.runtime.runtimeId,
      runtime: attestation.runtime,
      executableSha256: attestation.executableSha256,
    },
    acceptedDecisions: {
      humanReview: {file: humanReview.input.relative, sha256: humanReview.document.sha256},
      ownerReview: {file: ownerReview.input.relative, sha256: ownerReview.document.sha256},
    },
    independentlyRevalidatedDag: {
      algorithm: "recursive-file-descriptor-sha256-v1",
      nodeCount: dagNodes.length,
      nodes: dagNodes,
      sha256: sha256Text(canonicalJson(dagNodes)),
    },
    canonicalArchive: {
      directory: acceptedArchiveRelative,
      fileCount: archive.inventory.length,
      inventory: archive.inventory,
      inventorySha256: archive.sha256,
    },
    canonicalOutputs: {
      baseline: baselineDescriptor,
      executionReport: executionDescriptor,
      baselineAuthority: authority,
    },
    generatedBy: {script: "scripts/adopt-course-original-runtime-evidence.mjs", sha256: scriptSha256},
    statement: PROMOTION_STATEMENT,
    strictAcceptanceEffect: "original-runtime-baseline-only-no-completion",
    promotionSha256: "",
  };
  promotion.promotionSha256 = recordHash(promotion, "promotionSha256");
  const promotionText = jsonText(promotion);
  const promotionDescriptor = {file: promotionRelative, sha256: digest(Buffer.from(promotionText))};
  const coverage = deriveCoverage(bound, {authority, baselineDescriptor, executionDescriptor, promotionDescriptor});
  return {
    acceptedArchiveRelative,
    acceptedArchivePath,
    baselineRelative,
    baselinePath,
    baseline,
    baselineText,
    baselineDescriptor,
    executionRelative,
    executionPath,
    report,
    reportText,
    executionDescriptor,
    promotionRelative,
    promotionPath,
    promotion,
    promotionText,
    promotionDescriptor,
    coverage,
    coverageText: jsonText(coverage),
    archive,
    authority,
  };
}

async function compareExactFile(root, candidate, expected, label) {
  const relative = portable(path.relative(root, candidate));
  await assertRegularProjectFile(root, relative, label);
  const observed = await readFile(candidate);
  const bytes = Buffer.isBuffer(expected) ? expected : Buffer.from(expected);
  if (!observed.equals(bytes)) throw new Error(`${label} differs from the deterministic promoted output`);
}

async function verifyCanonicalArchive(bound, derived) {
  await assertNoExistingSymlinkComponents(bound.root, derived.acceptedArchivePath, "canonical accepted archive");
  const info = await lstat(derived.acceptedArchivePath).catch(() => null);
  if (!info?.isDirectory() || info.isSymbolicLink()) throw new Error("canonical accepted archive is missing or not a real directory");
  const [actualRoot, actualArchive] = await Promise.all([realpath(bound.root), realpath(derived.acceptedArchivePath)]);
  if (!isInside(actualArchive, actualRoot)) throw new Error("canonical accepted archive resolves outside the project root");
  const files = await walkRegularTree(bound.root, derived.acceptedArchivePath, "canonical accepted archive");
  const observed = [];
  for (const file of files) observed.push({file: portable(path.relative(bound.root, file)), sha256: digest(await readFile(file))});
  observed.sort((left, right) => left.file.localeCompare(right.file));
  const expected = derived.archive.inventory.map(({file, sha256}) => ({file, sha256}));
  if (!same(observed, expected)) throw new Error("canonical accepted archive files/hashes differ from the deterministic inventory");
}

function assertCanonicalOutputLayout(bound, derived, coveragePath) {
  const expected = {
    acceptedArchiveRelative: portable(path.join("artifacts", "full-frame", "pilot-baselines", bound.animationId, bound.safeId, "accepted-original-runtime")),
    baselineRelative: portable(path.join("migrations", bound.animationId, "baseline", "original-runtime", `${bound.safeId}.json`)),
    executionRelative: portable(path.join("migrations", bound.animationId, "baseline", "trace-executions", `${bound.safeId}.json`)),
    promotionRelative: portable(path.join("migrations", bound.animationId, "evidence", "original-runtime-promotions", `${bound.safeId}.json`)),
  };
  for (const field of Object.keys(expected)) {
    if (derived[field] !== expected[field]) throw new Error(`${field} is not the fixed canonical course evidence path`);
  }
  const workspace = path.join(bound.root, "migrations", bound.animationId);
  const archiveRoot = path.join(bound.root, "artifacts", "full-frame", "pilot-baselines", bound.animationId, bound.safeId);
  for (const [candidate, allowedRoot, label] of [
    [derived.acceptedArchivePath, archiveRoot, "canonical archive"],
    [derived.baselinePath, workspace, "canonical baseline"],
    [derived.executionPath, workspace, "canonical execution report"],
    [derived.promotionPath, workspace, "canonical promotion receipt"],
    [coveragePath, workspace, "full-frame coverage"],
  ]) {
    if (!isInside(candidate, allowedRoot) || isInside(candidate, path.join(bound.root, "source-assets"))) {
      throw new Error(`${label} escapes its fixed output root or targets source-assets`);
    }
  }
}

async function inspectWrittenEvidence(bound, derived) {
  const requirement = derived.coverage.requirements.find((item) => item.requirementId === bound.requirementId);
  await verifyExecutionReportArtifacts({root: bound.root, spec: bound.spec, requirement, report: derived.report});
  return inspectTraceRequirement({
    root: bound.root,
    workspace: bound.workspace,
    id: bound.animationId,
    requirement,
    specIndex: bound.indexed,
    hashes: {
      ...bound.technicalHashes,
      coverageTechnicalSha256: traceCoverageSha256(derived.coverage),
    },
  });
}

export function parseArguments(argumentsList) {
  const options = {
    projectRoot: repositoryRoot,
    candidateManifest: "",
    candidateReport: "",
    trustRegistry: "",
    humanReview: "",
    ownerReview: "",
    dryRun: false,
    check: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (["--project-root", "--candidate-manifest", "--candidate-report", "--trust-registry", "--human-review", "--owner-review"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--project-root") options.projectRoot = path.resolve(next);
      else options[value.slice(2).replaceAll(/-([a-z])/g, (_, character) => character.toUpperCase())] = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (options.dryRun && options.check) throw new Error("--dry-run and --check are mutually exclusive");
  if (!options.help && !options.dryRun && !options.check) throw promotionDisabledError();
  return options;
}

export async function adoptCourseOriginalRuntimeEvidence(options = {}) {
  for (const field of ["dryRun", "check"]) {
    if (options[field] !== undefined && typeof options[field] !== "boolean") {
      throw new Error(`${field} must be a boolean when called as a module`);
    }
  }
  if (options.dryRun && options.check) throw new Error("--dry-run and --check are mutually exclusive");
  if (!options.dryRun && !options.check) throw promotionDisabledError();
  const root = path.resolve(options.projectRoot || repositoryRoot);
  for (const [field, flag] of [
    ["candidateManifest", "--candidate-manifest"],
    ["candidateReport", "--candidate-report"],
    ["trustRegistry", "--trust-registry"],
    ["humanReview", "--human-review"],
    ["ownerReview", "--owner-review"],
  ]) assertString(options[field], flag);
  const inputs = {};
  for (const [field, label] of [
    ["candidateManifest", "candidate manifest"],
    ["candidateReport", "candidate report"],
    ["trustRegistry", "trust registry"],
    ["humanReview", "human review"],
    ["ownerReview", "owner review"],
  ]) inputs[field] = await resolveCliFile(root, options[field], label);
  const bound = await loadBoundCandidate(root, inputs.candidateManifest, inputs.candidateReport);
  const dag = await verifyEvidenceDag(root, [
    ["candidate manifest", bound.candidateManifest],
    ["candidate report", bound.candidateReport],
  ]);
  const attestation = validateCandidateAttestation(bound, dag);
  const frames = await verifyCandidateFrames(bound, dag);
  const evidence = bound.definition.kind === "root"
    ? await validateRootCandidateEvidence(bound, dag, attestation, frames)
    : await validateNaturalCandidateEvidence(bound, dag, attestation, frames);
  const [registryDocument, humanReviewDocument, ownerReviewDocument] = await Promise.all([
    readJsonDocument(inputs.trustRegistry.path, "trust registry"),
    readJsonDocument(inputs.humanReview.path, "human review"),
    readJsonDocument(inputs.ownerReview.path, "owner review"),
  ]);
  const capturedAt = attestation.endedAt;
  const registry = await validateTrustRegistry({
    root,
    input: inputs.trustRegistry,
    document: registryDocument,
    capturedAt,
    toolchainReceipt: attestation.toolchainReceipt,
    claimedRuntime: attestation.runtime,
    executableSha256: attestation.executableSha256,
  });
  const operatorMatches = [...registry.identities.values()].filter((identity) => {
    const presented = {
      kind: identity.kind,
      fullName: identity.fullName,
      role: identity.role,
      organizationOrOwnerId: identity.organizationOrOwnerId,
      contact: identity.contact,
    };
    return same(presented, attestation.operator) && identity.authorizedRoles.includes("capture-operator");
  });
  if (operatorMatches.length !== 1) throw new Error("candidate named capture operator must resolve to exactly one pre-registered capture-operator identity");
  const captureOperatorIdentityId = operatorMatches[0].identityId;
  const registryContext = {...registry, input: inputs.trustRegistry, document: registryDocument};
  const humanReview = validateReviewDocument({
    kind: "human",
    input: inputs.humanReview,
    document: humanReviewDocument,
    bound,
    registry: registryContext,
    captureOperatorIdentityId,
    runtimeId: attestation.runtime.runtimeId,
    capturedAt,
  });
  const ownerReview = validateReviewDocument({
    kind: "owner",
    input: inputs.ownerReview,
    document: ownerReviewDocument,
    bound,
    registry: registryContext,
    captureOperatorIdentityId,
    runtimeId: attestation.runtime.runtimeId,
    capturedAt,
    humanReview,
  });
  const distinct = new Set([
    captureOperatorIdentityId,
    humanReview.review.reviewer.identityId,
    ownerReview.review.reviewer.identityId,
  ]);
  if (distinct.size !== 3) throw new Error("capture operator, human evidence reviewer, and owner representative must be three distinct pre-registered identities");
  const derived = await derivePromotion({bound, dag, attestation, evidence, frames, registry: registryContext, humanReview, ownerReview});
  const targets = [derived.acceptedArchivePath, derived.baselinePath, derived.executionPath, derived.promotionPath];
  const coveragePath = bound.controlPaths.coveragePath;
  assertCanonicalOutputLayout(bound, derived, coveragePath);
  if (options.check) {
    await verifyCanonicalArchive(bound, derived);
    await Promise.all([
      compareExactFile(bound.root, derived.baselinePath, derived.baselineText, "canonical baseline"),
      compareExactFile(bound.root, derived.executionPath, derived.reportText, "canonical execution report"),
      compareExactFile(bound.root, derived.promotionPath, derived.promotionText, "promotion receipt"),
      compareExactFile(bound.root, coveragePath, derived.coverageText, "full-frame coverage promotion binding"),
    ]);
    const inspection = await inspectWrittenEvidence(bound, derived);
    return {
      mode: "check",
      ok: true,
      animationId: bound.animationId,
      requirementId: bound.requirementId,
      baselineAuthority: derived.authority,
      frameCount: frames.length,
      evidenceDagNodeCount: dag.size,
      coverageStatus: bound.requirement.status,
      authoritative: false,
      promotionWritesEnabled: PROMOTION_WRITES_ENABLED,
      promotionBoundary: originalRuntimePromotionBoundary(bound.definition.kind),
      strictAcceptanceChanged: false,
      sourceChanged: false,
      pendingCandidateChanged: false,
      inspection,
    };
  }
  for (const target of targets) {
    if (await exists(target)) throw new Error(`canonical promotion target already exists; use --check: ${portable(path.relative(root, target))}`);
  }
  if (bound.requirement.status !== "blocked" || bound.requirement.baselineAuthority !== "unresolved" || bound.requirement.baselineCaptureManifest || bound.requirement.baselineCaptureManifestSha256) {
    throw new Error("append-only promotion requires a blocked requirement with unresolved/empty original-runtime baseline fields");
  }
  if (options.dryRun) {
    return {
      mode: "dry-run",
      ok: true,
      animationId: bound.animationId,
      requirementId: bound.requirementId,
      baselineAuthority: derived.authority,
      frameCount: frames.length,
      evidenceDagNodeCount: dag.size,
      canonicalArchiveFileCount: derived.archive.inventory.length,
      plannedOutputs: [derived.acceptedArchiveRelative, derived.baselineRelative, derived.executionRelative, derived.promotionRelative, portable(path.relative(root, coveragePath))],
      coverageStatusBefore: bound.requirement.status,
      coverageStatusAfter: bound.requirement.status,
      authoritative: false,
      promotionWritesEnabled: PROMOTION_WRITES_ENABLED,
      promotionBoundary: originalRuntimePromotionBoundary(bound.definition.kind),
      strictAcceptanceChanged: false,
      sourceChanged: false,
      pendingCandidateChanged: false,
    };
  }
  // Defense in depth: the public argument/module gates above admit only
  // --dry-run or --check.  This legacy module deliberately has no canonical
  // mutation implementation, so changing a boolean cannot resurrect the old
  // pathname-based writer.
  throw promotionDisabledError();
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else {
      const result = await adoptCourseOriginalRuntimeEvidence(options);
      if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else process.stdout.write(`READ-ONLY DIAGNOSTIC: ${result.mode} ${result.animationId}/${result.requirementId} (${result.baselineAuthority}, ${result.frameCount} frames; promotion disabled)\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
