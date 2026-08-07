#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

import { PILOT_MIGRATIONS } from "./scaffold-pilot-migrations.mjs";
import {
  FRAME_DOMAIN_DISPOSITION_RELATIVE_PATH,
  MIGRATION_VALIDATOR_VERSION,
  RENDERER_FRAME_DOMAIN_SUPPORT_RELATIVE_PATH,
  validateFrameDomainDisposition,
  validateMigration,
  validateRendererFrameDomainSupport,
} from "../skills/flash-to-js/scripts/validate_migration.mjs";
import { inspectPilotTraceEvidence } from "./validate-course-trace-evidence.mjs";
import {
  AUDIO_LISTENING_ACCEPTANCE_RELATIVE_PATH,
  validateStrictAudioEvidence,
} from "./audio-listening-acceptance.mjs";
import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";
import {
  deriveHumanReviewExpectations,
  deriveOwnerReviewEvidence,
  validateHumanVisualReviewRecord,
  validateOwnerReviewRecord,
} from "./human-owner-review-records.mjs";
import { verifyPerFileFlaAuthoringAudit } from "./build-course-strict-readiness.mjs";
import {
  classifyStrictFullDomainRequirement,
  validateSupplementalPartialRequirementBoundary,
} from "./lib/strict-full-domain-requirement.mjs";
import {validateRequirementCoverageGroups} from "./lib/trace-frame-selection.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(defaultProjectRoot, "migrations");
const defaultJsonOutput = path.join(defaultProjectRoot, "reports", "pilot-strict-acceptance.json");
const defaultMarkdownOutput = path.join(defaultProjectRoot, "reports", "pilot-strict-acceptance.md");
const validatorPath = path.join(defaultProjectRoot, "skills", "flash-to-js", "scripts", "validate_migration.mjs");

export const PILOT_ACCEPTANCE_SCHEMA_VERSION = 1;
export const PILOT_ACCEPTANCE_GENERATOR_VERSION = "1.7.0";

const AUDIO_START_SEMANTICS = Object.freeze([
  "timeline-frame",
  "host-user-activated",
  "interaction-state",
]);

export const PILOT_GATE_DEFINITIONS = Object.freeze([
  {
    id: "authoritative-baseline",
    label: "Authoritative baseline",
    requirement: "The manifest adopts source-hash-bound Adobe/original-runtime evidence at native size; when a paired FLA exists, a current recursive, hash-bound per-file Animate authoring audit is required so timeline coverage can be treated as exhaustive; every structurally reachable timeline has a complete hash-bound disposition; nested or interactive coverage-v2 requirements use exact natural-entry traces, while non-interactive root evidence may use a declared frame-accurate natural, direct-seek, or root-entry sequential-step baseline. Candidates, blocked/limited traces, shallow legacy authoring audits, and cross-domain baselines never qualify.",
  },
  {
    id: "implementation-route",
    label: "Implementation and route",
    requirement: "The renderer, product route, component, pure timeline, tests, and generated-registry module are declared and exist; explicit frame domains also require a current hash-bound pure getFrameState renderer-support audit.",
  },
  {
    id: "deterministic-frame-contract",
    label: "Deterministic frame contract",
    requirement: "frame/frameDomain/requirementId/trace/entryStateSha256/scenario/lang/seed parameters and data-flash-frame/data-flash-frame-domain/requirement/trace/state attributes are declared and proven by explicit canonical traces; direct pure getFrameState probes must return exact domain/frame/scenario/language identity and a non-blocked renderable state.",
  },
  {
    id: "full-frame-scenario-coverage",
    label: "Full-frame and all-scenario coverage",
    requirement: "Every structurally reachable timeline is dispositioned, every one-indexed frame exists for every explicit coverage-v2 frame-domain trace requirement (or the legacy v1 root scenario/language matrix), and every explicit requirement has renderable-exact pure-state probes at its first and last frame, with hashed capture and metrics manifests.",
  },
  {
    id: "rmse-thresholds",
    label: "RMSE thresholds",
    requirement: "Every canonical frame in every paired requirement/domain/trace/state record is within its static or transition threshold, or has a matching written owner-accepted exception.",
  },
  {
    id: "english-spanish-evidence",
    label: "English and Spanish evidence",
    requirement: "Both en and es are declared and have valid canonical frame evidence for every required frame-domain trace.",
  },
  {
    id: "audio-hash-listening-sync",
    label: "Audio hash, listening, and sync",
    requirement: "Audio files are hashed and inventoried, and authoritative listening, host-state traversal, language, and synchronization are accepted; no-audio claims are proved.",
  },
  {
    id: "replay-interaction-random",
    label: "Replay, interaction, and random branches",
    requirement: "A canonical behavior QA record proves Replay by mouse/Enter/Space/reset and every applicable interaction, scoring, completion, seeded/random outcome, and explicit coverage-v2 trace.",
  },
  {
    id: "product-qa",
    label: "Desktop/mobile/a11y/console/network QA",
    requirement: "Canonical product QA covers every explicit trace plus desktop, tablet, mobile, keyboard, names, reduced motion, overflow, localization, console, assets, and unexpected network activity.",
  },
  {
    id: "engineering-review",
    label: "Engineering review",
    requirement: "migration.json contains an accepted, dated engineering review; an engineering prereview does not count.",
  },
  {
    id: "human-review",
    label: "Human visual review",
    requirement: "A named human accepts every current requirement, frame diff, and contact-sheet page in an immutable hash-bound record; migration.json is only a matching acceptance mirror.",
  },
  {
    id: "owner-acceptance",
    label: "Owner acceptance",
    requirement: "The owner explicitly accepts the exact hash-bound human, audio, behavior, product, and exception evidence in an immutable record; Codex never infers or signs this gate.",
  },
  {
    id: "strict-validator",
    label: "Strict validator",
    requirement: "The current checked-in strict validator passes the migration without --allow-draft.",
  },
  {
    id: "regression-tests",
    label: "Regression tests",
    requirement: "A current, migration-manifest-bound verification record proves the required test suites passed.",
  },
  {
    id: "production-build",
    label: "Production build",
    requirement: "A current, migration-manifest-bound verification record proves the production build passed.",
  },
]);

const REQUIRED_BEHAVIOR_CHECKS = Object.freeze([
  "replay-mouse",
  "replay-enter",
  "replay-space",
  "replay-reset-frame-state-audio",
  "all-reachable-branches",
  "interaction-input-scoring",
  "completion-terminal-state",
  "random-seeded-outcomes",
]);

const REQUIRED_PRODUCT_CHECKS = Object.freeze([
  "native-stage",
  "desktop",
  "tablet",
  "mobile",
  "keyboard-focus",
  "accessible-names",
  "reduced-motion",
  "text-overflow",
  "localization",
  "console-errors",
  "asset-loads",
  "unexpected-network",
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort(compareText).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function coverageV2RequirementKey(requirement) {
  return [
    requirement?.requirementId,
    requirement?.language,
    requirement?.frameDomainId,
    requirement?.traceId,
    requirement?.entryStateSha256,
  ].map((value) => String(value || "")).join("\0");
}

function coverageV2RequirementLabel(requirement) {
  return `${requirement?.requirementId || "missing-requirement-id"} (${requirement?.frameDomainId || "unknown-domain"}/${requirement?.traceId || "unknown-trace"}/${requirement?.scenario || "unknown-scenario"}/${requirement?.language || "unknown-language"})`;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function projectRelative(projectRoot, filePath) {
  if (!filePath) return "";
  const absolute = path.resolve(filePath);
  const relative = path.relative(projectRoot, absolute);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative.split(path.sep).join("/")
    : absolute.split(path.sep).join("/");
}

function resolveEvidencePath(value, roots) {
  if (!value || typeof value !== "string") return null;
  if (path.isAbsolute(value)) return value;
  return path.resolve(roots[0], value);
}

async function resolveExistingPath(value, roots) {
  if (!value || typeof value !== "string") return null;
  const candidates = path.isAbsolute(value) ? [value] : roots.map((root) => path.resolve(root, value));
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  return null;
}

async function readJson(filePath) {
  try {
    const bytes = await readFile(filePath);
    return {
      ok: true,
      value: JSON.parse(bytes.toString("utf8")),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      error: null,
    };
  } catch (error) {
    const message = error.code === "ENOENT"
      ? "file does not exist"
      : error instanceof SyntaxError
        ? `invalid JSON (${error.message})`
        : error.message;
    return { ok: false, value: null, sha256: null, error: message };
  }
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(current);
      current = "";
    } else current += character;
  }
  values.push(current);
  return values;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    }),
  };
}

function makeGate(id, evidence, reasons, observations = []) {
  const definition = PILOT_GATE_DEFINITIONS.find((item) => item.id === id);
  if (!definition) throw new Error(`Unknown gate: ${id}`);
  const normalizedReasons = unique(reasons);
  return {
    id,
    label: definition.label,
    status: normalizedReasons.length ? "fail" : "pass",
    evidence: unique(evidence).sort(compareText),
    reasons: normalizedReasons,
    observations: unique(observations),
  };
}

async function analyzeFrameDomainDispositionAudit({ projectRoot, workspace, manifest }) {
  const errors = [];
  const result = await validateFrameDomainDisposition({
    root: workspace,
    manifest,
    errors,
    evidenceProjectRoot: projectRoot,
  });
  if (!result.applicable) return { applicable: false, evidence: [], reasons: [], observations: [] };
  const evidence = (result.evidencePaths?.length ? result.evidencePaths : [path.join(workspace, FRAME_DOMAIN_DISPOSITION_RELATIVE_PATH)])
    .map((filePath) => projectRelative(projectRoot, filePath));
  const summary = result.report?.summary;
  const observations = summary ? [
    `Frame-domain disposition enumerates ${summary.enumeratedTimelineCount ?? "unknown"} structurally reachable timeline(s): ${summary.dispositionCounts?.["declared-frame-domain"] ?? "unknown"} declared, ${summary.dispositionCounts?.["composite-child-with-parent"] ?? "unknown"} evidence-backed composite, and ${summary.dispositionCounts?.unresolved ?? "unknown"} unresolved. Composite disposition does not satisfy audio, behavior, or full-frame/RMSE acceptance.`,
  ] : [];
  return {
    applicable: true,
    evidence,
    reasons: errors.map((error) => `Frame-domain disposition: ${error}`),
    observations,
  };
}

function applyFrameDomainDispositionGate(gate, disposition) {
  if (!disposition.applicable) return gate;
  return makeGate(
    gate.id,
    [...gate.evidence, ...disposition.evidence],
    [...gate.reasons, ...disposition.reasons],
    [...gate.observations, ...disposition.observations],
  );
}

async function analyzeFlaAuthoringAudit({ projectRoot, workspace, manifest }) {
  if (!manifest.source?.fla) {
    return { applicable: false, evidence: [], reasons: [], observations: [] };
  }

  const manifestPath = path.join(workspace, "migration.json");
  const auditPath = path.join(workspace, "audit", "adobe-animate-2021-authoring-audit.json");
  const evidence = [
    projectRelative(projectRoot, manifestPath),
    projectRelative(projectRoot, auditPath),
  ];
  const observations = [
    "A current recursive Animate authoring audit is a required FLA-structure prerequisite only; it does not prove original-runtime behavior, audio, visual parity, human review, owner acceptance, or strict completion by itself.",
  ];

  try {
    const authoring = await verifyPerFileFlaAuthoringAudit({
      projectRoot,
      workspace,
      manifest,
      header: {
        widthPx: manifest.runtime?.stage?.width,
        heightPx: manifest.runtime?.stage?.height,
        frameRate: manifest.runtime?.fps,
        frameCount: manifest.runtime?.frameCount,
      },
    });
    for (const item of authoring.evidence || []) {
      const resolved = await resolveExistingPath(item.path, [workspace, projectRoot]);
      evidence.push(projectRelative(projectRoot, resolved || path.resolve(workspace, item.path || "")));
    }
    const state = authoring.state || {};
    const reasons = [];
    if (
      state.required !== true ||
      state.status !== "verified-current-recursive-authoring-audit" ||
      state.comprehensiveCurrentContract !== true
    ) {
      reasons.push(
        `FLA authoring audit is not current and comprehensive (${state.status || "missing"}): ${state.blocker || "schema-v2 recursive authoring evidence is required."}`,
      );
    }
    return { applicable: true, evidence: unique(evidence), reasons, observations };
  } catch (error) {
    return {
      applicable: true,
      evidence: unique(evidence),
      reasons: [`FLA authoring audit failed closed: ${error.message}`],
      observations,
    };
  }
}

function applyFlaAuthoringAuditGate(gate, authoring) {
  if (!authoring.applicable) return gate;
  return makeGate(
    gate.id,
    [...gate.evidence, ...authoring.evidence],
    [...gate.reasons, ...authoring.reasons],
    [...gate.observations, ...authoring.observations],
  );
}

async function analyzeRendererFrameDomainSupportAudit({ projectRoot, workspace, manifest }) {
  const errors = [];
  const result = await validateRendererFrameDomainSupport({
    root: workspace,
    manifest,
    errors,
    evidenceProjectRoot: projectRoot,
  });
  if (!result.applicable) return { applicable: false, evidence: [], reasons: [], observations: [] };
  const evidence = (result.evidencePaths?.length
    ? result.evidencePaths
    : [path.join(workspace, RENDERER_FRAME_DOMAIN_SUPPORT_RELATIVE_PATH)])
    .map((filePath) => projectRelative(projectRoot, filePath));
  const summary = result.report?.summary;
  const observations = [
    `Renderer frame-domain support audit SHA-256: ${result.reportSha256 || "unavailable"}.`,
    ...(summary ? [
      `Pure getFrameState audit reports ${summary.renderableCount ?? "unknown"}/${summary.probeCount ?? "unknown"} renderable-exact first/last probes across ${summary.declaredFrameDomainCount ?? "unknown"} explicit frame domain(s); blocked states never count as renderable.`,
    ] : []),
  ];
  const groupedReasons = [];
  for (const [label, prefix] of [
    ["pure-state probe", "renderer frame-domain support probe "],
    ["explicit requirement endpoint", "renderer frame-domain support requirement "],
  ]) {
    const matches = errors.filter((error) => error.startsWith(prefix));
    if (matches.length) {
      groupedReasons.push(`${matches.length} ${label} failure(s): ${matches.slice(0, 6).join("; ")}${matches.length > 6 ? `; … +${matches.length - 6}` : ""}`);
    }
  }
  const detailedPrefixes = [
    "renderer frame-domain support probe ",
    "renderer frame-domain support requirement ",
  ];
  groupedReasons.push(...errors.filter((error) => !detailedPrefixes.some((prefix) => error.startsWith(prefix))));
  return {
    applicable: true,
    evidence,
    reasons: groupedReasons.map((error) => `Renderer frame-domain support: ${error}`),
    observations,
  };
}

function applyRendererFrameDomainSupportGate(gate, rendererSupport) {
  if (!rendererSupport.applicable) return gate;
  return makeGate(
    gate.id,
    [...gate.evidence, ...rendererSupport.evidence],
    [...gate.reasons, ...rendererSupport.reasons],
    [...gate.observations, ...rendererSupport.observations],
  );
}

function applyTraceEvidenceGate(gate, traceEvidence) {
  if (!traceEvidence?.applicable) return gate;
  return makeGate(
    gate.id,
    [...gate.evidence, ...traceEvidence.evidence],
    [...gate.reasons, ...traceEvidence.reasons],
    [...gate.observations, ...traceEvidence.observations],
  );
}

async function analyzeTraceEvidence({ projectRoot, migrationsRoot, manifest, coverage, inspectTraceEvidenceFn }) {
  if (!coverage.domainAware) return { applicable: false, evidence: [], reasons: [], observations: [], inspection: null };
  let inspection;
  try {
    inspection = await inspectTraceEvidenceFn({
      projectRoot,
      migrationsRoot,
      animationId: manifest.animationId,
    });
  } catch (error) {
    inspection = {
      applicable: true,
      index: "migrations/course-shell-pilot-trace-spec-index.json",
      requirements: [],
      failures: [{ animationId: manifest.animationId, requirementId: null, message: error.message }],
      readySpecCount: 0,
      unresolvedSpecCount: 0,
      absentSpecCount: coverage.expectedItems.length,
    };
  }
  const evidence = [];
  if (inspection.index) evidence.push(inspection.index);
  for (const item of inspection.requirements || []) {
    if (item.specFile) evidence.push(item.specFile);
    if (item.executionReportSha256 && item.executionReport) evidence.push(item.executionReport);
    for (const descriptor of Object.values(item.evidence || {})) if (descriptor?.file) evidence.push(descriptor.file);
  }
  const reasons = [];
  if (inspection.applicable === false) {
    reasons.push("Coverage v2 has no current indexed trace specification set; a renderer/capture record cannot substitute for source execution proof.");
  }
  const coverageStatusById = new Map((coverage.requirements || []).map((item) => [item.requirementId, item.status]));
  const resultById = new Map((inspection.requirements || []).map((item) => [item.requirementId, item]));
  for (const item of coverage.expectedItems) {
    const status = coverageStatusById.get(item.requirementId);
    const result = resultById.get(item.requirementId);
    if (status === "complete" && (
      result?.disposition !== "complete-evidence-verified" ||
      result?.traceSpecReadiness !== "ready" ||
      !result?.executionReportSha256 ||
      !result?.evidence?.originalRuntimeCaptureManifest
    )) {
      reasons.push(`${item.label} lacks a current ready trace spec plus a complete re-hashed original-runtime execution report bound to the exact coverage baseline.`);
    }
  }
  for (const failure of inspection.failures || []) {
    reasons.push(`Trace evidence${failure.requirementId ? ` ${failure.requirementId}` : ""} failed closed: ${failure.message}`);
  }
  const observations = [
    `Trace specifications: ${inspection.readySpecCount || 0} ready, ${inspection.unresolvedSpecCount || 0} unresolved, ${inspection.absentSpecCount || 0} absent. A spec is an execution instruction and never baseline authority by itself.`,
  ];
  for (const item of inspection.requirements || []) {
    const reportState = item.executionReportSha256 ? "execution report verified" : "execution report absent";
    observations.push(`${item.requirementId}: trace spec ${item.traceSpecReadiness || "absent"}; ${reportState}; coverage ${item.coverageStatus || "unknown"}.`);
  }
  return { applicable: true, evidence: unique(evidence), reasons: unique(reasons), observations: unique(observations), inspection };
}

function traceEvidenceReportSummary(traceEvidence) {
  const inspection = traceEvidence?.inspection;
  if (!inspection) return null;
  return {
    applicable: inspection.applicable !== false,
    status: inspection.status || (inspection.failures?.length ? "failed" : "unresolved"),
    index: inspection.index || null,
    indexSha256: inspection.indexSha256 || null,
    requirementCount: inspection.requirementCount ?? inspection.requirements?.length ?? 0,
    completeCount: inspection.completeCount || 0,
    readySpecCount: inspection.readySpecCount || 0,
    unresolvedSpecCount: inspection.unresolvedSpecCount || 0,
    absentSpecCount: inspection.absentSpecCount || 0,
    failureCount: inspection.failureCount ?? inspection.failures?.length ?? 0,
    requirements: (inspection.requirements || []).map((item) => ({
      requirementId: item.requirementId,
      coverageStatus: item.coverageStatus,
      traceSpecReadiness: item.traceSpecReadiness || "absent",
      executionReportStatus: item.executionReportSha256 ? "verified" : "absent",
      disposition: item.disposition,
      failure: item.failure || null,
    })),
    failures: inspection.failures || [],
    note: "A ready trace spec is an execution instruction; it is never baseline authority without a verified original-runtime execution report.",
  };
}

function matchingAcceptedException(manifest, evidenceId) {
  return (manifest.acceptance?.knownExceptions || []).some((exception) =>
    exception &&
    exception.id &&
    exception.reason &&
    exception.ownerDecision === "accepted" &&
    Array.isArray(exception.evidenceIds) &&
    exception.evidenceIds.includes(evidenceId),
  );
}

async function walkJsonFiles(root) {
  if (!(await exists(root))) return [];
  const output = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await walkJsonFiles(target));
    else if (entry.isFile() && entry.name.endsWith(".json")) output.push(target);
  }
  return output;
}

async function verifyPng(filePath, expectedWidth, expectedHeight) {
  try {
    const bytes = await readFile(filePath);
    const png = PNG.sync.read(bytes);
    return {
      ok: png.width === expectedWidth && png.height === expectedHeight,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      width: png.width,
      height: png.height,
      error: png.width === expectedWidth && png.height === expectedHeight
        ? null
        : `PNG is ${png.width}x${png.height}; expected ${expectedWidth}x${expectedHeight}`,
    };
  } catch (error) {
    return { ok: false, sha256: null, width: null, height: null, error: `PNG is not decodable (${error.message})` };
  }
}

async function analyzeAuthoritativeBaseline({ projectRoot, workspace, manifest, coverage }) {
  const manifestPath = path.join(workspace, "migration.json");
  const evidence = [projectRelative(projectRoot, manifestPath)];
  const reasons = [];
  const observations = [];
  const declaredAuthority = String(manifest.baseline?.authority || "");
  if (!declaredAuthority || ["unknown", "undecided"].includes(declaredAuthority.toLowerCase())) {
    reasons.push("migration.json baseline.authority is unresolved; candidate captures are not automatically adopted.");
  }
  if (!String(manifest.baseline?.route || "").startsWith("/")) reasons.push("migration.json baseline.route is missing.");
  const routeFile = await resolveExistingPath(manifest.baseline?.routeFile, [projectRoot, workspace]);
  if (!routeFile) reasons.push(`migration.json baseline.routeFile does not resolve (${manifest.baseline?.routeFile || "empty"}).`);
  else evidence.push(projectRelative(projectRoot, routeFile));

  if (coverage.domainAware) {
    evidence.push(...coverage.evidence);
    if (/candidate|direct[- ]?seek|root[- ]?only|standalone|limited|partial|blocked|engineering/i.test(declaredAuthority)) {
      reasons.push(`migration.json baseline.authority is limited or non-authoritative for explicit natural traces (${declaredAuthority}).`);
    }
    if (!coverage.expectedItems.length) reasons.push("Coverage v2 declares no explicit requirement that can carry an authoritative natural-trace baseline.");
    for (const item of coverage.expectedItems) if (!coverage.validAuthorityKeys.has(item.key)) {
      reasons.push(`${item.label} lacks a hash-bound metrics record paired to an authority-satisfying original-runtime baseline.`);
    }
    reasons.push(...coverage.authorityReasons);
    for (const missing of coverage.missingRequirementLabels) reasons.push(`${missing} has no explicit requirement and therefore no authoritative natural-trace baseline.`);
    observations.push("Implementation candidates, blocked/limited traces, and cross-domain captures are excluded; direct-seek and root-entry sequential frame-step are permitted only for a non-interactive root requirement that explicitly declares original-runtime-frame-accurate authority.");
    return makeGate("authoritative-baseline", evidence, reasons, observations);
  }

  const candidates = (await walkJsonFiles(path.join(workspace, "baseline")))
    .filter((filePath) => !path.basename(filePath).includes("invalidated"));
  let validCandidateCount = 0;
  for (const candidatePath of candidates) {
    const candidate = await readJson(candidatePath);
    if (!candidate.ok || candidate.value?.animationId !== manifest.animationId) continue;
    const report = candidate.value;
    if (report.authority?.kind !== "original-swf-adobe-flash-player-runtime" || !String(report.status || "").startsWith("authoritative")) continue;
    evidence.push(projectRelative(projectRoot, candidatePath));
    const candidateReasons = [];
    if (report.source?.swfSha256 !== manifest.source?.swfSha256) candidateReasons.push("source SHA-256 differs from migration.json");
    if (report.runtime?.stage?.width !== manifest.runtime?.stage?.width || report.runtime?.stage?.height !== manifest.runtime?.stage?.height) candidateReasons.push("native stage differs from migration.json");
    if (report.runtime?.fps !== manifest.runtime?.fps) candidateReasons.push("FPS differs from migration.json");
    if (report.runtime?.frameCount !== manifest.runtime?.frameCount) candidateReasons.push("frame count differs from migration.json");
    const frames = Array.isArray(report.frames) ? report.frames : [];
    if (frames.length !== manifest.runtime?.frameCount) candidateReasons.push(`report contains ${frames.length} frame rows, expected ${manifest.runtime?.frameCount}`);
    const frameNumbers = new Set(frames.map(({ frame }) => Number(frame)));
    for (let frame = 1; frame <= (manifest.runtime?.frameCount || 0); frame += 1) {
      if (!frameNumbers.has(frame)) {
        candidateReasons.push(`report omits frame ${frame}`);
        break;
      }
    }
    const archiveDirectory = resolveEvidencePath(report.capture?.archiveDirectory, [projectRoot]);
    if (!archiveDirectory || !(await exists(archiveDirectory))) candidateReasons.push(`capture archive does not exist (${report.capture?.archiveDirectory || "empty"})`);
    else {
      evidence.push(projectRelative(projectRoot, archiveDirectory));
      for (const frame of frames) {
        const imagePath = path.resolve(archiveDirectory, frame.file || "");
        if (!(await exists(imagePath))) {
          candidateReasons.push(`capture archive omits ${frame.file || `frame ${frame.frame}`}`);
          break;
        }
        const png = await verifyPng(imagePath, manifest.runtime.stage.width, manifest.runtime.stage.height);
        if (!png.ok || png.sha256 !== frame.sha256) {
          candidateReasons.push(`${projectRelative(projectRoot, imagePath)} ${png.error || "SHA-256 differs from baseline report"}`);
          break;
        }
      }
    }
    if (!candidateReasons.length) {
      validCandidateCount += 1;
      observations.push(`${projectRelative(projectRoot, candidatePath)} is a hash-verified authoritative standalone candidate for ${frames.length} root frames.`);
    } else observations.push(`${projectRelative(projectRoot, candidatePath)} is not strict-ready: ${candidateReasons.join("; ")}.`);
  }
  if (!validCandidateCount) reasons.push("No hash-verified Adobe/original-runtime baseline candidate covers the manifest root frame domain at native size.");
  if (validCandidateCount && (!declaredAuthority || ["unknown", "undecided"].includes(declaredAuthority.toLowerCase()))) {
    observations.push("At least one authoritative standalone candidate exists, but its parent-host, nested-timeline, branch, language, and audio limitations remain separate gates.");
  }
  return makeGate("authoritative-baseline", evidence, reasons, observations);
}

async function analyzeImplementation({ projectRoot, workspace, manifest }) {
  const evidence = [projectRelative(projectRoot, path.join(workspace, "migration.json"))];
  const reasons = [];
  const implementation = manifest.implementation || {};
  if (!implementation.rendering || ["unknown", "undecided"].includes(String(implementation.rendering).toLowerCase())) reasons.push("implementation.rendering is unresolved.");
  if (!String(implementation.route || "").startsWith("/animations/")) reasons.push(`implementation.route is not a product animation route (${implementation.route || "empty"}).`);
  for (const field of ["routeFile", "component", "timelineModule", "testFile"]) {
    const resolved = await resolveExistingPath(implementation[field], [projectRoot, workspace]);
    if (!resolved) reasons.push(`implementation.${field} does not resolve (${implementation[field] || "empty"}).`);
    else evidence.push(projectRelative(projectRoot, resolved));
  }
  if (!/^\.\/modules\/[a-z0-9][a-z0-9-]*$/.test(implementation.registryModule || "")) {
    reasons.push(`implementation.registryModule is not a generated-registry specifier (${implementation.registryModule || "empty"}).`);
  } else {
    const moduleBase = path.join(projectRoot, "packages", "demos", "src", implementation.registryModule.slice(2));
    const modulePath = (await exists(`${moduleBase}.tsx`)) ? `${moduleBase}.tsx` : (await exists(`${moduleBase}.ts`)) ? `${moduleBase}.ts` : null;
    if (!modulePath) reasons.push(`implementation.registryModule does not resolve (${implementation.registryModule}).`);
    else evidence.push(projectRelative(projectRoot, modulePath));
  }
  return makeGate("implementation-route", evidence, reasons);
}

async function analyzeCanonicalCoverageV1({ projectRoot, workspace, manifest }) {
  const coverageRelative = manifest.evidence?.fullFrameCoverageFile || "evidence/full-frame-coverage.json";
  const coveragePath = path.resolve(workspace, coverageRelative);
  const evidence = [projectRelative(projectRoot, coveragePath)];
  const coverageReasons = [];
  const captureReasons = [];
  const rmseReasons = [];
  const networkReasons = [];
  const validCaptureKeys = new Set();
  const validMetricKeys = new Set();
  const validRmseKeys = new Set();
  let currentImplementationArtifactClosure = null;
  try {
    currentImplementationArtifactClosure = await collectImplementationArtifactClosure({projectRoot, workspace, manifest});
  } catch (error) {
    captureReasons.push(`Current implementation artifact closure cannot be recomputed (${error.message}).`);
  }
  const parsed = await readJson(coveragePath);
  const scenarioIds = (manifest.scenarios || []).map(({ id }) => id).filter(Boolean);
  const languages = Array.isArray(manifest.localization?.languages) ? manifest.localization.languages : [];
  const expectedKeys = [];
  for (const scenario of scenarioIds) for (const language of languages) expectedKeys.push(`${scenario}\0${language}`);
  if (!parsed.ok) {
    coverageReasons.push(`Cannot read ${projectRelative(projectRoot, coveragePath)} (${parsed.error}).`);
    captureReasons.push("Canonical capture coverage is unavailable.");
    rmseReasons.push("Canonical RMSE metrics are unavailable.");
    return { evidence, coverageReasons, captureReasons, rmseReasons, networkReasons, validCaptureKeys, validMetricKeys, validRmseKeys, expectedKeys };
  }
  const coverage = parsed.value;
  if (coverage.schemaVersion !== 1) coverageReasons.push("full-frame coverage schemaVersion is not 1.");
  if (coverage.animationId !== manifest.animationId) coverageReasons.push("full-frame coverage animationId differs from migration.json.");
  if (coverage.frameCount !== manifest.runtime?.frameCount) coverageReasons.push(`full-frame coverage frameCount is ${coverage.frameCount ?? "missing"}; expected ${manifest.runtime?.frameCount}.`);
  const actualScenarios = [...(coverage.scenarios || [])].sort(compareText);
  const actualLanguages = [...(coverage.languages || [])].sort(compareText);
  if (JSON.stringify(actualScenarios) !== JSON.stringify([...scenarioIds].sort(compareText))) coverageReasons.push("full-frame coverage scenarios do not exactly match migration.json reachable scenarios.");
  if (JSON.stringify(actualLanguages) !== JSON.stringify([...languages].sort(compareText))) coverageReasons.push("full-frame coverage languages do not exactly match migration.json languages.");
  const combinations = Array.isArray(coverage.combinations) ? coverage.combinations : [];
  const byKey = new Map();
  for (const combination of combinations) {
    const key = `${combination.scenario}\0${combination.language}`;
    if (byKey.has(key)) coverageReasons.push(`Duplicate canonical combination ${combination.scenario}/${combination.language}.`);
    else byKey.set(key, combination);
  }
  for (const key of expectedKeys) {
    const [scenario, language] = key.split("\0");
    if (!byKey.has(key)) coverageReasons.push(`Missing canonical combination ${scenario}/${language}.`);
  }
  for (const key of byKey.keys()) if (!expectedKeys.includes(key)) {
    const [scenario, language] = key.split("\0");
    coverageReasons.push(`Unexpected canonical combination ${scenario}/${language}.`);
  }

  for (const key of expectedKeys) {
    const combination = byKey.get(key);
    if (!combination) continue;
    const [scenario, language] = key.split("\0");
    const label = `${scenario}/${language}`;
    let captureValid = true;
    let metricsValid = true;
    let rmseValid = true;
    if (combination.firstFrame !== 1 || combination.lastFrame !== manifest.runtime.frameCount || combination.capturedFrameCount !== manifest.runtime.frameCount || !Array.isArray(combination.missingFrames) || combination.missingFrames.length) {
      coverageReasons.push(`${label} does not declare complete frames 1..${manifest.runtime.frameCount} with no missing frames.`);
      captureValid = false;
    }
    if (combination.seed === undefined || combination.seed === null || combination.seed === "") {
      coverageReasons.push(`${label} has no deterministic seed.`);
      captureValid = false;
    }
    const capturePath = await resolveExistingPath(combination.captureManifest, [workspace]);
    if (!capturePath) {
      captureReasons.push(`${label} capture manifest does not exist (${combination.captureManifest || "empty"}).`);
      captureValid = false;
    } else {
      evidence.push(projectRelative(projectRoot, capturePath));
      const capture = await readJson(capturePath);
      if (!capture.ok) {
        captureReasons.push(`${label} capture manifest is invalid JSON (${capture.error}).`);
        captureValid = false;
      } else {
        if (capture.sha256 !== combination.captureManifestSha256) {
          captureReasons.push(`${label} capture manifest SHA-256 differs from full-frame coverage.`);
          captureValid = false;
        }
        const value = capture.value;
        if (value.schemaVersion !== IMPLEMENTATION_CAPTURE_SCHEMA_VERSION || value.status !== "complete") {
          const detail = value.schemaVersion < IMPLEMENTATION_CAPTURE_SCHEMA_VERSION
            ? `legacy schemaVersion ${value.schemaVersion ?? "missing"} capture is prereview-only because it has no capture-time implementation artifact closure`
            : `capture manifest is not schemaVersion ${IMPLEMENTATION_CAPTURE_SCHEMA_VERSION} complete`;
          captureReasons.push(`${label} ${detail}.`);
          captureValid = false;
        }
        if (value.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION) {
          const generatorErrors = implementationCaptureGeneratorProvenanceErrors(value.generatorProvenance);
          for (const reason of generatorErrors) captureReasons.push(`${label} ${reason}.`);
          const closureErrors = implementationArtifactClosureErrors(
            value.implementationArtifactClosure,
            currentImplementationArtifactClosure,
          );
          for (const reason of closureErrors) captureReasons.push(`${label} ${reason}.`);
          if (generatorErrors.length || closureErrors.length || !currentImplementationArtifactClosure) captureValid = false;
        }
        if (!isUnambiguousLoopbackHttpUrl(value.sourceUrl)) {
          captureReasons.push(`${label} capture sourceUrl is not an unambiguous credential-free loopback http URL.`);
          captureValid = false;
        }
        if (value.scenario !== scenario || value.language !== language || String(value.seed) !== String(combination.seed)) {
          captureReasons.push(`${label} capture identity differs from its canonical combination.`);
          captureValid = false;
        }
        if (value.reportedFrameAttribute !== "data-flash-frame") {
          captureReasons.push(`${label} capture does not report data-flash-frame.`);
          captureValid = false;
        }
        if (value.viewport?.width !== manifest.runtime.stage.width || value.viewport?.height !== manifest.runtime.stage.height || value.viewport?.deviceScaleFactor !== 1) {
          captureReasons.push(`${label} capture viewport is not the native stage at device scale 1.`);
          captureValid = false;
        }
        for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
          if (!Array.isArray(value[field]) || value[field].length) {
            networkReasons.push(`${label} capture ${field} is ${Array.isArray(value[field]) ? `non-empty (${value[field].length})` : "missing"}.`);
            captureValid = false;
          }
        }
        const captured = Array.isArray(value.captured) ? value.captured : [];
        if (captured.length !== manifest.runtime.frameCount) {
          captureReasons.push(`${label} capture has ${captured.length} frame rows; expected ${manifest.runtime.frameCount}.`);
          captureValid = false;
        }
        const seen = new Set(captured.map(({ frame }) => Number(frame)));
        const missing = [];
        for (let frame = 1; frame <= manifest.runtime.frameCount; frame += 1) if (!seen.has(frame)) missing.push(frame);
        if (missing.length) {
          captureReasons.push(`${label} capture omits ${missing.length} frame(s): ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", …" : ""}.`);
          captureValid = false;
        }
        for (const item of captured) {
          if (item.reportedFrame !== item.frame || item.scenario !== scenario || item.language !== language || String(item.seed) !== String(combination.seed)) {
            captureReasons.push(`${label} capture row ${item.frame ?? "unknown"} does not echo the requested frame/scenario/language/seed.`);
            captureValid = false;
            break;
          }
          const imagePath = await resolveExistingPath(item.file, [path.dirname(capturePath), workspace]);
          if (!imagePath) {
            captureReasons.push(`${label} capture image does not exist (${item.file || "empty"}).`);
            captureValid = false;
            break;
          }
          const png = await verifyPng(imagePath, manifest.runtime.stage.width, manifest.runtime.stage.height);
          if (!png.ok || png.sha256 !== item.sha256) {
            captureReasons.push(`${label} capture frame ${item.frame} ${png.error || "SHA-256 differs from capture manifest"}.`);
            captureValid = false;
            break;
          }
        }
      }
    }
    if (captureValid) validCaptureKeys.add(key);

    const metricsPath = await resolveExistingPath(combination.metricsFile, [workspace]);
    if (!metricsPath) {
      rmseReasons.push(`${label} metrics file does not exist (${combination.metricsFile || "empty"}).`);
      metricsValid = false;
      rmseValid = false;
    } else {
      evidence.push(projectRelative(projectRoot, metricsPath));
      const metrics = await readJson(metricsPath);
      if (!metrics.ok) {
        rmseReasons.push(`${label} metrics file is invalid JSON (${metrics.error}).`);
        metricsValid = false;
        rmseValid = false;
      } else {
        if (metrics.sha256 !== combination.metricsSha256) {
          rmseReasons.push(`${label} metrics SHA-256 differs from full-frame coverage.`);
          metricsValid = false;
          rmseValid = false;
        }
        const value = metrics.value;
        if (value.scenario !== scenario || value.language !== language || String(value.seed) !== String(combination.seed)) {
          rmseReasons.push(`${label} metrics identity differs from its canonical combination.`);
          metricsValid = false;
          rmseValid = false;
        }
        const frames = Array.isArray(value.frames) ? value.frames : [];
        if (frames.length !== manifest.runtime.frameCount) {
          rmseReasons.push(`${label} metrics contain ${frames.length} frame rows; expected ${manifest.runtime.frameCount}.`);
          metricsValid = false;
          rmseValid = false;
        }
        const seen = new Set(frames.map(({ frame }) => Number(frame)));
        const missing = [];
        for (let frame = 1; frame <= manifest.runtime.frameCount; frame += 1) if (!seen.has(frame)) missing.push(frame);
        if (missing.length) {
          rmseReasons.push(`${label} metrics omit ${missing.length} frame(s): ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", …" : ""}.`);
          metricsValid = false;
          rmseValid = false;
        }
        const failures = [];
        for (const metric of frames) {
          const rmse = Number(metric.normalizedRmse);
          const threshold = metric.kind === "transition"
            ? Number(manifest.fidelity?.transitionFrameMaxNormalizedRmse)
            : Number(manifest.fidelity?.staticFrameMaxNormalizedRmse);
          const evidenceId = `full-frame:${scenario}:${language}:${metric.frame}`;
          const excepted = metric.result === "accepted-exception" && matchingAcceptedException(manifest, evidenceId);
          if (!Number.isFinite(rmse) || rmse < 0 || rmse > 1 || !Number.isFinite(threshold)) failures.push(`${metric.frame}:invalid metric/threshold`);
          else if ((rmse > threshold || metric.result !== "pass") && !excepted) failures.push(`${metric.frame}:${rmse} > ${threshold} or result=${metric.result || "missing"}`);
        }
        if (failures.length) {
          rmseReasons.push(`${label} has ${failures.length} RMSE/result failure(s): ${failures.slice(0, 10).join(", ")}${failures.length > 10 ? ", …" : ""}.`);
          rmseValid = false;
        }
      }
    }
    if (metricsValid) validMetricKeys.add(key);
    if (rmseValid) validRmseKeys.add(key);
  }
  return { evidence, coverageReasons, captureReasons, rmseReasons, networkReasons, validCaptureKeys, validMetricKeys, validRmseKeys, expectedKeys };
}

async function analyzeCoverageV2Baseline({
  projectRoot,
  workspace,
  manifest,
  requirement,
  label,
  firstFrame,
  lastFrame,
  requiredFrameCount,
}) {
  const evidence = [];
  const reasons = [];
  let valid = true;
  let frameHashes = new Map();
  const fail = (reason) => {
    reasons.push(reason);
    valid = false;
  };
  const baselinePath = await resolveExistingPath(requirement.baselineCaptureManifest, [workspace, projectRoot]);
  if (!baselinePath) {
    fail(`${label} baseline capture manifest does not exist (${requirement.baselineCaptureManifest || "empty"}).`);
    return { valid, frameHashes, evidence, reasons };
  }
  evidence.push(projectRelative(projectRoot, baselinePath));
  const baseline = await readJson(baselinePath);
  if (!baseline.ok) {
    fail(`${label} baseline capture manifest is invalid JSON (${baseline.error}).`);
    return { valid, frameHashes, evidence, reasons };
  }
  if (baseline.sha256 !== String(requirement.baselineCaptureManifestSha256 || "").toLowerCase()) {
    fail(`${label} baseline capture manifest SHA-256 differs from coverage v2.`);
  }
  const value = baseline.value;
  const baselineAuthoritySatisfied = requirement.baselineAuthorityRequirement === "original-runtime-natural-trace"
    ? requirement.baselineAuthority === "original-runtime-natural-trace"
    : requirement.baselineAuthorityRequirement === "original-runtime-frame-accurate"
      && ["original-runtime-natural-trace", "original-runtime-direct-seek", "original-runtime-frame-step"].includes(requirement.baselineAuthority);
  if (
    value.schemaVersion !== 2 || value.status !== "complete" ||
    value.evidenceType !== "original-runtime-frame-domain-baseline"
  ) fail(`${label} baseline is not schemaVersion 2 complete original-runtime-frame-domain-baseline evidence.`);
  if (
    value.animationId !== manifest.animationId || value.requirementId !== requirement.requirementId ||
    value.frameDomainId !== requirement.frameDomainId || value.traceId !== requirement.traceId ||
    value.entryStateSha256 !== requirement.entryStateSha256 || value.scenario !== requirement.scenario ||
    value.language !== requirement.language || String(value.seed) !== String(requirement.seed) ||
    value.baselineAuthority !== requirement.baselineAuthority || !baselineAuthoritySatisfied
  ) fail(`${label} baseline requirement/language/domain/trace/state/scenario/seed/authority identity differs from coverage v2.`);
  if (value.source?.swf !== manifest.source?.swf || value.source?.swfSha256 !== manifest.source?.swfSha256) {
    fail(`${label} baseline source SWF identity differs from migration.json.`);
  }
  const sourcePath = await resolveExistingPath(value.source?.swf, [workspace, projectRoot]);
  if (!sourcePath || await sha256File(sourcePath) !== value.source?.swfSha256) {
    fail(`${label} baseline source SWF is missing or its SHA-256 differs.`);
  }
  if (
    value.runtime?.stage?.width !== manifest.runtime.stage.width || value.runtime?.stage?.height !== manifest.runtime.stage.height ||
    value.runtime?.fps !== manifest.runtime.fps || value.runtime?.frameCount !== requiredFrameCount ||
    value.runtime?.frameNumbering !== "one-indexed"
  ) fail(`${label} baseline runtime metadata differs from the required native frame domain.`);
  if (
    !value.capturedAt || Number.isNaN(Date.parse(value.capturedAt)) ||
    value.capture?.traceEntryMode !== (
      requirement.baselineAuthority === "original-runtime-direct-seek"
        ? "original-runtime-direct-seek"
        : requirement.baselineAuthority === "original-runtime-frame-step"
          ? "original-runtime-root-entry"
          : "natural-runtime-navigation"
    ) ||
    value.capture?.frameCaptureMode !== (
      requirement.baselineAuthority === "original-runtime-direct-seek"
        ? "deterministic-direct-seek"
        : "deterministic-sequential-step"
    ) ||
    !String(value.capture?.operator || "").trim() || !String(value.capture?.tool || "").trim() ||
    !String(value.capture?.toolVersion || "").trim() || !String(value.capture?.entryProtocol || "").trim() ||
    !String(value.capture?.frameControlProtocol || "").trim()
  ) fail(`${label} baseline capture provenance or natural-entry/sequential-step protocol is incomplete.`);
  const entryTrace = Array.isArray(value.capture?.entryTrace) ? value.capture.entryTrace : [];
  if (
    !entryTrace.length || entryTrace.some((step, index) => step.order !== index + 1 || !String(step.action || "").trim()) ||
    entryTrace.at(-1)?.resultingFrameDomainId !== requirement.frameDomainId
  ) fail(`${label} baseline entryTrace does not prove a sequential natural entry into the required frame domain.`);
  const frames = Array.isArray(value.frames) ? value.frames : [];
  if (frames.length !== requiredFrameCount || new Set(frames.map(({ frame }) => Number(frame))).size !== frames.length) {
    fail(`${label} baseline does not contain exactly one unique image per required frame.`);
  }
  frameHashes = new Map(frames.map((frame) => [Number(frame.frame), frame.sha256]));
  for (let frame = firstFrame; frame <= lastFrame; frame += 1) if (!frameHashes.has(frame)) fail(`${label} baseline omits frame ${frame}.`);
  for (const item of frames) {
    if (
      item.animationId !== manifest.animationId || item.requirementId !== requirement.requirementId || item.frameDomainId !== requirement.frameDomainId ||
      item.traceId !== requirement.traceId || item.entryStateSha256 !== requirement.entryStateSha256
    ) {
      fail(`${label} baseline frame ${item.frame ?? "unknown"} identity differs from the requirement.`);
      break;
    }
    const imagePath = await resolveExistingPath(item.file, [path.dirname(baselinePath), workspace, projectRoot]);
    if (!imagePath) {
      fail(`${label} baseline image does not exist (${item.file || "empty"}).`);
      break;
    }
    const png = await verifyPng(imagePath, manifest.runtime.stage.width, manifest.runtime.stage.height);
    if (!png.ok || png.sha256 !== String(item.sha256 || "").toLowerCase()) {
      fail(`${label} baseline frame ${item.frame} ${png.error || "SHA-256 differs from baseline manifest"}.`);
      break;
    }
  }
  return { valid, frameHashes, evidence, reasons };
}

async function analyzeCanonicalCoverageV2({ projectRoot, workspace, manifest, parsed, coveragePath }) {
  const evidence = [projectRelative(projectRoot, coveragePath)];
  const coverageReasons = [];
  const captureReasons = [];
  const rmseReasons = [];
  const networkReasons = [];
  const authorityReasons = [];
  const validCaptureKeys = new Set();
  const validMetricKeys = new Set();
  const validRmseKeys = new Set();
  const validAuthorityKeys = new Set();
  const expectedItems = [];
  const missingRequirementLabels = [];
  let currentImplementationArtifactClosure = null;
  try {
    currentImplementationArtifactClosure = await collectImplementationArtifactClosure({projectRoot, workspace, manifest});
  } catch (error) {
    captureReasons.push(`Current implementation artifact closure cannot be recomputed (${error.message}).`);
  }
  let expectedFrameCount = 0;
  const coverage = parsed.value;
  if (coverage.schemaVersion !== 2) coverageReasons.push("Explicit frame domains require full-frame coverage schemaVersion 2.");
  if (coverage.animationId !== manifest.animationId) coverageReasons.push("full-frame coverage animationId differs from migration.json.");

  const domains = Array.isArray(manifest.implementation?.frameDomains) ? manifest.implementation.frameDomains : [];
  const domainsById = new Map(domains.map((domain) => [domain.id, domain]));
  if (!domains.length || !manifest.implementation?.defaultFrameDomainId) {
    coverageReasons.push("Coverage v2 requires migration.json implementation.frameDomains and defaultFrameDomainId.");
  }
  const languages = Array.isArray(manifest.localization?.languages) ? manifest.localization.languages : [];
  const requirements = Array.isArray(coverage.requirements) ? coverage.requirements : [];
  if (!requirements.length) coverageReasons.push("Coverage v2 has no explicit trace requirements.");
  const seenKeys = new Set();
  const seenRequirementIds = new Set();
  const seenDomainTraceLanguages = new Set();
  const coveredSlots = new Set();
  const canonicalRequirements = [];
  let supplementalPartialRequirementCount = 0;

  try {
    validateRequirementCoverageGroups(
      requirements,
      Object.fromEntries(domains.map(({id, frameCount}) => [id, frameCount])),
    );
  } catch (error) {
    coverageReasons.push(`Coverage v2 requirement identity/group validation failed: ${error.message}`);
  }

  for (const [index, requirement] of requirements.entries()) {
    const key = coverageV2RequirementKey(requirement);
    const label = coverageV2RequirementLabel(requirement);
    const domain = domainsById.get(requirement.frameDomainId);

    if (!requirement.requirementId || typeof requirement.requirementId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(requirement.requirementId)) {
      coverageReasons.push(`Coverage v2 requirement ${index + 1} has no explicit non-empty requirementId.`);
      authorityReasons.push(`${label} cannot bind authority without a valid requirementId.`);
    } else if (seenRequirementIds.has(requirement.requirementId)) {
      coverageReasons.push(`Coverage v2 requirementId ${requirement.requirementId} is duplicated.`);
      authorityReasons.push(`${label} cannot bind authority because its requirementId is duplicated.`);
    } else seenRequirementIds.add(requirement.requirementId);
    if (seenKeys.has(key)) coverageReasons.push(`Duplicate coverage-v2 pairing key for ${label}.`);
    else seenKeys.add(key);
    const domainTraceLanguageKey = `${requirement.frameDomainId}\0${requirement.traceId}\0${requirement.language}`;
    if (seenDomainTraceLanguages.has(domainTraceLanguageKey)) coverageReasons.push(`${label} duplicates a frameDomainId/traceId/language requirement.`);
    else seenDomainTraceLanguages.add(domainTraceLanguageKey);
    if (!requirement.traceId || typeof requirement.traceId !== "string") coverageReasons.push(`${label} has no explicit traceId.`);
    if (!languages.includes(requirement.language)) coverageReasons.push(`${label} uses undeclared language ${requirement.language || "empty"}.`);
    if (!domain?.scenarioIds?.includes(requirement.scenario)) {
      coverageReasons.push(`${label} uses scenario ${requirement.scenario || "empty"}, which is not declared for ${requirement.frameDomainId || "the frame domain"}.`);
    }
    if (!requirement.entryState || typeof requirement.entryState !== "object" || Array.isArray(requirement.entryState) || !Object.keys(requirement.entryState).length) {
      coverageReasons.push(`${label} has no explicit entryState object.`);
    } else {
      const expectedStateHash = sha256Text(canonicalJson(requirement.entryState));
      if (requirement.entryStateSha256 !== expectedStateHash) coverageReasons.push(`${label} entryStateSha256 differs from canonical entryState JSON.`);
    }
    if (!["complete", "blocked", "pending"].includes(requirement.status)) {
      coverageReasons.push(`${label} status must be complete, blocked, or pending.`);
    }
    if (requirement.seed === undefined || requirement.seed === null || requirement.seed === "") coverageReasons.push(`${label} has no deterministic seed.`);

    if (!domain) {
      coverageReasons.push(`${label} references unknown frameDomainId ${requirement.frameDomainId || "empty"}.`);
      continue;
    }
    let classification;
    try {
      classification = classifyStrictFullDomainRequirement(
        requirement,
        domain.frameCount,
        `${label} strict-slot eligibility`,
      );
    } catch (error) {
      coverageReasons.push(error.message);
      continue;
    }
    if (!classification.eligible) {
      try {
        validateSupplementalPartialRequirementBoundary(
          requirement,
          classification.selection,
          label,
        );
      } catch (error) {
        coverageReasons.push(error.message);
      }
      supplementalPartialRequirementCount += 1;
      continue;
    }
    canonicalRequirements.push(requirement);
    const firstFrame = 1;
    const lastFrame = domain.frameCount;
    const rangeValid = true;
    const requiredFrameCount = domain.frameCount;
    expectedFrameCount += requiredFrameCount;
    expectedItems.push({
      key,
      label,
      requirementId: requirement.requirementId || "",
      language: requirement.language || "",
      scenario: requirement.scenario || "",
      frameDomainId: requirement.frameDomainId || "",
      traceId: requirement.traceId || "",
      entryStateSha256: requirement.entryStateSha256 || "",
      requiredFrameCount,
    });

    if (domain?.scenarioIds?.includes(requirement.scenario) && languages.includes(requirement.language)) {
      coveredSlots.add(`${requirement.frameDomainId}\0${requirement.scenario}\0${requirement.language}`);
    }
    if (requirement.status !== "complete") coverageReasons.push(`${label} status is ${requirement.status || "missing"}; blocked, pending, or missing traces are not canonical coverage.`);
    if (requirement.capturedFrameCount !== requiredFrameCount || !Array.isArray(requirement.missingFrames) || requirement.missingFrames.length) {
      coverageReasons.push(`${label} does not declare complete canonical full-domain coverage with no missing frames.`);
    }

    let authoritySatisfied = requirement.baselineAuthorityRequirement === "original-runtime-natural-trace"
      ? requirement.baselineAuthority === "original-runtime-natural-trace"
      : requirement.baselineAuthorityRequirement === "original-runtime-frame-accurate"
        && ["original-runtime-natural-trace", "original-runtime-direct-seek", "original-runtime-frame-step"].includes(requirement.baselineAuthority);
    const scenarioKind = (manifest.scenarios || []).find(({ id }) => id === requirement.scenario)?.kind;
    if ((domain?.kind === "nested" || scenarioKind === "interactive") && requirement.baselineAuthorityRequirement !== "original-runtime-natural-trace") {
      const reason = `${label} ${domain?.kind === "nested" ? "nested frame domain" : "interactive scenario"} requires original-runtime-natural-trace authority.`;
      coverageReasons.push(reason);
      authorityReasons.push(reason);
      authoritySatisfied = false;
    }
    if (!authoritySatisfied) {
      const reason = `${label} baseline authority is ${requirement.baselineAuthority || "missing"} and does not satisfy ${requirement.baselineAuthorityRequirement || "missing"}.`;
      coverageReasons.push(reason);
      authorityReasons.push(reason);
    }
    if (!rangeValid) continue;

    const baselineAnalysis = await analyzeCoverageV2Baseline({
      projectRoot,
      workspace,
      manifest,
      requirement,
      label,
      firstFrame,
      lastFrame,
      requiredFrameCount,
    });
    evidence.push(...baselineAnalysis.evidence);
    authorityReasons.push(...baselineAnalysis.reasons);
    const baselineValid = baselineAnalysis.valid;
    const baselineFrameHashes = baselineAnalysis.frameHashes;
    let captureValid = true;
    let implementationFrameHashes = new Map();
    let metricsValid = true;
    let rmseValid = true;
    let metricsAuthorityValid = authoritySatisfied && baselineValid && Boolean(requirement.requirementId) && requirement.status === "complete" && rangeValid;
    const capturePath = await resolveExistingPath(requirement.captureManifest, [workspace, projectRoot]);
    if (!capturePath) {
      captureReasons.push(`${label} capture manifest does not exist (${requirement.captureManifest || "empty"}).`);
      captureValid = false;
    } else {
      evidence.push(projectRelative(projectRoot, capturePath));
      const capture = await readJson(capturePath);
      if (!capture.ok) {
        captureReasons.push(`${label} capture manifest is invalid JSON (${capture.error}).`);
        captureValid = false;
      } else {
        if (capture.sha256 !== String(requirement.captureManifestSha256 || "").toLowerCase()) {
          captureReasons.push(`${label} capture manifest SHA-256 differs from coverage v2.`);
          captureValid = false;
        }
        const value = capture.value;
        if (value.schemaVersion !== IMPLEMENTATION_CAPTURE_SCHEMA_VERSION || value.status !== "complete") {
          const detail = value.schemaVersion < IMPLEMENTATION_CAPTURE_SCHEMA_VERSION
            ? `legacy schemaVersion ${value.schemaVersion ?? "missing"} capture is prereview-only because it has no capture-time implementation artifact closure`
            : `capture manifest is not schemaVersion ${IMPLEMENTATION_CAPTURE_SCHEMA_VERSION} complete`;
          captureReasons.push(`${label} ${detail}.`);
          captureValid = false;
        }
        if (value.schemaVersion === IMPLEMENTATION_CAPTURE_SCHEMA_VERSION) {
          const generatorErrors = implementationCaptureGeneratorProvenanceErrors(value.generatorProvenance);
          for (const reason of generatorErrors) captureReasons.push(`${label} ${reason}.`);
          const closureErrors = implementationArtifactClosureErrors(
            value.implementationArtifactClosure,
            currentImplementationArtifactClosure,
          );
          for (const reason of closureErrors) captureReasons.push(`${label} ${reason}.`);
          if (generatorErrors.length || closureErrors.length || !currentImplementationArtifactClosure) captureValid = false;
        }
        if (!isUnambiguousLoopbackHttpUrl(value.sourceUrl)) {
          captureReasons.push(`${label} capture sourceUrl is not an unambiguous credential-free loopback http URL.`);
          captureValid = false;
        }
        if (
          value.animationId !== manifest.animationId || value.requirementId !== requirement.requirementId || value.frameDomainId !== requirement.frameDomainId ||
          value.traceId !== requirement.traceId || value.entryStateSha256 !== requirement.entryStateSha256 ||
          value.scenario !== requirement.scenario || value.language !== requirement.language || String(value.seed) !== String(requirement.seed)
        ) {
          captureReasons.push(`${label} capture requirement/language/domain/trace/state/scenario/seed identity differs from coverage v2.`);
          captureValid = false;
        }
        for (const [field, expected] of Object.entries({
          reportedAnimationIdAttribute: "data-animation-id",
          reportedFrameAttribute: "data-flash-frame",
          reportedFrameDomainAttribute: "data-flash-frame-domain",
          reportedRequirementIdAttribute: "data-flash-requirement-id",
          reportedTraceAttribute: "data-flash-trace-id",
          reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
          captureStageAttribute: "data-capture-stage",
          reportedRenderStateAttribute: "data-render-state",
          reportedVisualTargetAttribute: "data-render-visual",
          requiredRenderState: "ready",
        })) if (value[field] !== expected) {
          captureReasons.push(`${label} capture ${field} is ${value[field] || "missing"}; expected ${expected}.`);
          captureValid = false;
        }
        if (value.viewport?.width !== manifest.runtime.stage.width || value.viewport?.height !== manifest.runtime.stage.height || value.viewport?.deviceScaleFactor !== 1) {
          captureReasons.push(`${label} capture viewport is not the native stage at device scale 1.`);
          captureValid = false;
        }
        for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
          if (!Array.isArray(value[field]) || value[field].length) {
            networkReasons.push(`${label} capture ${field} is ${Array.isArray(value[field]) ? `non-empty (${value[field].length})` : "missing"}.`);
            captureValid = false;
          }
        }
        const captured = Array.isArray(value.captured) ? value.captured : [];
        implementationFrameHashes = new Map(captured.map((frame) => [Number(frame.frame), frame.sha256]));
        if (captured.length !== requiredFrameCount) {
          captureReasons.push(`${label} capture has ${captured.length} frame rows; expected ${requiredFrameCount}.`);
          captureValid = false;
        }
        const seenFrames = new Set(captured.map(({ frame }) => Number(frame)));
        if (seenFrames.size !== captured.length) {
          captureReasons.push(`${label} capture contains duplicate frames.`);
          captureValid = false;
        }
        const missing = [];
        for (let frame = firstFrame; frame <= lastFrame; frame += 1) if (!seenFrames.has(frame)) missing.push(frame);
        if (missing.length) {
          captureReasons.push(`${label} capture omits ${missing.length} frame(s): ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", …" : ""}.`);
          captureValid = false;
        }
        for (const item of captured) {
          if (
            item.animationId !== manifest.animationId || item.requirementId !== requirement.requirementId || item.reportedFrame !== item.frame ||
            item.frameDomainId !== requirement.frameDomainId || item.reportedFrameDomainId !== requirement.frameDomainId ||
            item.traceId !== requirement.traceId || item.entryStateSha256 !== requirement.entryStateSha256 ||
            item.scenario !== requirement.scenario || item.language !== requirement.language || String(item.seed) !== String(requirement.seed)
          ) {
            captureReasons.push(`${label} capture row ${item.frame ?? "unknown"} does not preserve its requirement/language/domain/trace/state/scenario/seed pairing.`);
            captureValid = false;
            break;
          }
          const visual = item.visualTarget;
          if (
            item.reportedRenderState !== "ready" ||
            !visual || typeof visual !== "object" ||
            !String(visual.tagName || "").trim() ||
            visual.reportedRenderState !== "ready" ||
            visual.animationId !== manifest.animationId ||
            visual.reportedFrame !== item.frame ||
            visual.frameDomainId !== requirement.frameDomainId ||
            visual.requirementId !== requirement.requirementId ||
            visual.traceId !== requirement.traceId ||
            visual.entryStateSha256 !== requirement.entryStateSha256 ||
            visual.scenario !== requirement.scenario ||
            visual.language !== requirement.language ||
            String(visual.seed) !== String(requirement.seed)
          ) {
            captureReasons.push(`${label} capture row ${item.frame ?? "unknown"} does not prove a ready visual renderer with the exact capture identity.`);
            captureValid = false;
            break;
          }
          const imagePath = await resolveExistingPath(item.file, [path.dirname(capturePath), workspace, projectRoot]);
          if (!imagePath) {
            captureReasons.push(`${label} capture image does not exist (${item.file || "empty"}).`);
            captureValid = false;
            break;
          }
          const png = await verifyPng(imagePath, manifest.runtime.stage.width, manifest.runtime.stage.height);
          if (!png.ok || png.sha256 !== String(item.sha256 || "").toLowerCase()) {
            captureReasons.push(`${label} capture frame ${item.frame} ${png.error || "SHA-256 differs from capture manifest"}.`);
            captureValid = false;
            break;
          }
        }
      }
    }
    if (captureValid) validCaptureKeys.add(key);
    if (requirement.status !== "complete") continue;

    const metricsPath = await resolveExistingPath(requirement.metricsFile, [workspace, projectRoot]);
    if (!metricsPath) {
      rmseReasons.push(`${label} metrics file does not exist (${requirement.metricsFile || "empty"}).`);
      metricsValid = false;
      rmseValid = false;
      metricsAuthorityValid = false;
    } else {
      evidence.push(projectRelative(projectRoot, metricsPath));
      const metrics = await readJson(metricsPath);
      if (!metrics.ok) {
        rmseReasons.push(`${label} metrics file is invalid JSON (${metrics.error}).`);
        metricsValid = false;
        rmseValid = false;
        metricsAuthorityValid = false;
      } else {
        if (metrics.sha256 !== String(requirement.metricsSha256 || "").toLowerCase()) {
          rmseReasons.push(`${label} metrics SHA-256 differs from coverage v2.`);
          metricsValid = false;
          rmseValid = false;
          metricsAuthorityValid = false;
        }
        const value = metrics.value;
        if (value.schemaVersion !== 2 || value.status !== "complete" || value.animationId !== manifest.animationId) {
          rmseReasons.push(`${label} metrics identity/schema/status is not a schemaVersion 2 complete record.`);
          metricsValid = false;
          rmseValid = false;
          metricsAuthorityValid = false;
        }
        if (
          value.requirementId !== requirement.requirementId || value.frameDomainId !== requirement.frameDomainId ||
          value.traceId !== requirement.traceId || value.entryStateSha256 !== requirement.entryStateSha256 ||
          value.scenario !== requirement.scenario || value.language !== requirement.language || String(value.seed) !== String(requirement.seed)
        ) {
          rmseReasons.push(`${label} metrics requirement/language/domain/trace/state/scenario/seed identity differs from coverage v2.`);
          metricsValid = false;
          rmseValid = false;
          metricsAuthorityValid = false;
        }
        if (
          value.baselineAuthority !== requirement.baselineAuthority || !authoritySatisfied ||
          value.baselineFrameDomainId !== requirement.frameDomainId || value.baselineTraceId !== requirement.traceId ||
          value.baselineEntryStateSha256 !== requirement.entryStateSha256
        ) {
          const reason = `${label} metrics baseline authority/domain/trace/state is not its paired authority-satisfying original-runtime baseline.`;
          rmseReasons.push(reason);
          authorityReasons.push(reason);
          metricsValid = false;
          rmseValid = false;
          metricsAuthorityValid = false;
        }
        if (
          value.baselineCaptureManifestSha256 !== requirement.baselineCaptureManifestSha256 ||
          value.implementationCaptureManifestSha256 !== requirement.captureManifestSha256
        ) {
          const reason = `${label} metrics do not bind the exact baseline and implementation capture manifest hashes.`;
          rmseReasons.push(reason);
          authorityReasons.push(reason);
          metricsValid = false;
          rmseValid = false;
          metricsAuthorityValid = false;
        }
        const frames = Array.isArray(value.frames) ? value.frames : [];
        if (frames.length !== requiredFrameCount) {
          rmseReasons.push(`${label} metrics contain ${frames.length} frame rows; expected ${requiredFrameCount}.`);
          metricsValid = false;
          rmseValid = false;
        }
        const seenFrames = new Set(frames.map(({ frame }) => Number(frame)));
        if (seenFrames.size !== frames.length) {
          rmseReasons.push(`${label} metrics contain duplicate frames.`);
          metricsValid = false;
          rmseValid = false;
        }
        const missing = [];
        for (let frame = firstFrame; frame <= lastFrame; frame += 1) if (!seenFrames.has(frame)) missing.push(frame);
        if (missing.length) {
          rmseReasons.push(`${label} metrics omit ${missing.length} frame(s): ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", …" : ""}.`);
          metricsValid = false;
          rmseValid = false;
        }
        const failures = [];
        for (const metric of frames) {
          if (
            metric.requirementId !== requirement.requirementId || metric.frameDomainId !== requirement.frameDomainId ||
            metric.traceId !== requirement.traceId || metric.entryStateSha256 !== requirement.entryStateSha256
          ) {
            failures.push(`${metric.frame ?? "unknown"}:requirement/domain/trace/state mismatch`);
            metricsValid = false;
            rmseValid = false;
            continue;
          }
          if (metric.baselineSha256 !== baselineFrameHashes.get(Number(metric.frame))) {
            failures.push(`${metric.frame}:baseline frame hash is not bound to its baseline manifest`);
            metricsValid = false;
            rmseValid = false;
            metricsAuthorityValid = false;
            continue;
          }
          if (metric.implementationSha256 !== implementationFrameHashes.get(Number(metric.frame))) {
            failures.push(`${metric.frame}:implementation frame hash is not bound to its capture manifest`);
            metricsValid = false;
            rmseValid = false;
            metricsAuthorityValid = false;
            continue;
          }
          const rmse = Number(metric.normalizedRmse);
          const threshold = metric.kind === "transition"
            ? Number(manifest.fidelity?.transitionFrameMaxNormalizedRmse)
            : Number(manifest.fidelity?.staticFrameMaxNormalizedRmse);
          const evidenceId = `full-frame:${requirement.frameDomainId}:${requirement.traceId}:${requirement.scenario}:${requirement.language}:${metric.frame}`;
          const excepted = metric.result === "accepted-exception" && matchingAcceptedException(manifest, evidenceId);
          if (!Number.isFinite(rmse) || rmse < 0 || rmse > 1 || !Number.isFinite(threshold)) failures.push(`${metric.frame}:invalid metric/threshold`);
          else if ((rmse > threshold || metric.result !== "pass") && !excepted) failures.push(`${metric.frame}:${rmse} > ${threshold} or result=${metric.result || "missing"}`);
        }
        if (failures.length) {
          rmseReasons.push(`${label} has ${failures.length} RMSE/result failure(s): ${failures.slice(0, 10).join(", ")}${failures.length > 10 ? ", …" : ""}.`);
          rmseValid = false;
        }
      }
    }
    if (!metricsValid) metricsAuthorityValid = false;
    if (metricsValid) validMetricKeys.add(key);
    if (rmseValid) validRmseKeys.add(key);
    if (metricsAuthorityValid) validAuthorityKeys.add(key);
  }

  for (const domain of domains) for (const scenario of domain.scenarioIds || []) for (const language of languages) {
    const slot = `${domain.id}\0${scenario}\0${language}`;
    if (!coveredSlots.has(slot)) {
      const label = `${domain.id}/${scenario}/${language}`;
      missingRequirementLabels.push(label);
      coverageReasons.push(`Coverage v2 is missing an explicit trace requirement for ${label}.`);
    }
  }

  return {
    schemaVersion: 2,
    domainAware: true,
    evidence,
    coverageReasons,
    captureReasons,
    rmseReasons,
    networkReasons,
    authorityReasons,
    validCaptureKeys,
    validMetricKeys,
    validRmseKeys,
    validAuthorityKeys,
    expectedKeys: expectedItems.map(({ key }) => key),
    expectedItems,
    expectedFrameCount,
    missingRequirementLabels,
    requirements: canonicalRequirements,
    supplementalPartialRequirementCount,
  };
}

async function analyzeCanonicalCoverage({ projectRoot, workspace, manifest }) {
  const coverageRelative = manifest.evidence?.fullFrameCoverageFile || "evidence/full-frame-coverage.json";
  const coveragePath = path.resolve(workspace, coverageRelative);
  const parsed = await readJson(coveragePath);
  const explicitDomains = manifest.implementation?.defaultFrameDomainId !== undefined || manifest.implementation?.frameDomains !== undefined;
  if (parsed.ok && (parsed.value?.schemaVersion === 2 || explicitDomains)) {
    return analyzeCanonicalCoverageV2({ projectRoot, workspace, manifest, parsed, coveragePath });
  }
  const legacy = await analyzeCanonicalCoverageV1({ projectRoot, workspace, manifest });
  const expectedItems = legacy.expectedKeys.map((key) => {
    const [scenario, language] = key.split("\0");
    return { key, label: `${scenario}/${language}`, scenario, language, requiredFrameCount: Number(manifest.runtime?.frameCount) || 0 };
  });
  return {
    ...legacy,
    schemaVersion: 1,
    domainAware: false,
    authorityReasons: [],
    validAuthorityKeys: new Set(),
    expectedItems,
    expectedFrameCount: expectedItems.reduce((sum, item) => sum + item.requiredFrameCount, 0),
    missingRequirementLabels: [],
    requirements: [],
  };
}

function analyzeDeterministicContract({ projectRoot, workspace, manifest, coverage }) {
  const contract = manifest.implementation?.captureContract || {};
  const reasons = [];
  const expectedContract = {
    frameParameter: "frame",
    scenarioParameter: "scenario",
    languageParameter: "lang",
    seedParameter: "seed",
    frameAttribute: "data-flash-frame",
    ...(coverage.domainAware ? {
      animationIdAttribute: "data-animation-id",
      frameDomainParameter: "frameDomain",
      requirementIdParameter: "requirementId",
      traceParameter: "trace",
      entryStateSha256Parameter: "entryStateSha256",
      frameDomainAttribute: "data-flash-frame-domain",
      requirementIdAttribute: "data-flash-requirement-id",
      traceAttribute: "data-flash-trace-id",
      entryStateSha256Attribute: "data-flash-entry-state-sha256",
    } : {}),
  };
  for (const [field, expected] of Object.entries(expectedContract)) {
    if (contract[field] !== expected) reasons.push(`implementation.captureContract.${field} is ${contract[field] || "missing"}; expected ${expected}.`);
  }
  if (!coverage.expectedItems.length) reasons.push(coverage.domainAware ? "No explicit coverage-v2 trace requirements are declared." : "No reachable scenario/language combinations are declared.");
  for (const item of coverage.expectedItems) if (!coverage.validCaptureKeys.has(item.key)) {
    reasons.push(`No valid deterministic canonical capture proves ${item.label}.`);
  }
  for (const missing of coverage.missingRequirementLabels) reasons.push(`No deterministic explicit trace requirement exists for ${missing}.`);
  reasons.push(...coverage.captureReasons);
  return makeGate(
    "deterministic-frame-contract",
    [projectRelative(projectRoot, path.join(workspace, "migration.json")), ...coverage.evidence],
    reasons,
  );
}

function analyzeFullCoverage(coverage) {
  const reasons = [...coverage.coverageReasons, ...coverage.captureReasons, ...coverage.rmseReasons];
  for (const item of coverage.expectedItems) if (!(coverage.validCaptureKeys.has(item.key) && coverage.validMetricKeys.has(item.key))) {
    reasons.push(`${item.label} is not a fully valid canonical capture+metrics pairing.`);
  }
  const observations = coverage.domainAware
    ? [`Coverage v2 declares ${coverage.expectedItems.length} explicit trace requirement(s) totaling ${coverage.expectedFrameCount} required frame captures.`]
    : [`Legacy coverage v1 expects ${coverage.expectedFrameCount} root-timeline frame captures across its scenario/language matrix.`];
  return makeGate("full-frame-scenario-coverage", coverage.evidence, reasons, observations);
}

function analyzeRmse(coverage) {
  const reasons = [...coverage.rmseReasons];
  for (const item of coverage.expectedItems) if (!coverage.validRmseKeys.has(item.key)) {
    reasons.push(`${item.label} lacks complete passing canonical RMSE evidence.`);
  }
  for (const missing of coverage.missingRequirementLabels) reasons.push(`${missing} has no explicit requirement and therefore no canonical RMSE evidence.`);
  return makeGate("rmse-thresholds", coverage.evidence, reasons);
}

async function findPartialVisualEvidence({ projectRoot, workspace }) {
  const evidenceDirectory = path.join(workspace, "evidence");
  const files = await walkJsonFiles(evidenceDirectory);
  return files
    .filter((filePath) => /full-frame-comparison.*\.json$/.test(path.basename(filePath)) || /contact-sheets.*manifest\.json$/.test(projectRelative(projectRoot, filePath)))
    .map((filePath) => projectRelative(projectRoot, filePath));
}

async function analyzeBilingual({ projectRoot, workspace, manifest, coverage }) {
  const reasons = [];
  const languages = manifest.localization?.languages || [];
  if (manifest.localization?.bilingualRequired !== true) reasons.push("localization.bilingualRequired is not true for this bilingual pilot.");
  for (const language of ["en", "es"]) if (!languages.includes(language)) reasons.push(`migration.json does not declare ${language}.`);
  for (const item of coverage.expectedItems.filter(({ language }) => ["en", "es"].includes(language))) {
    if (!(coverage.validCaptureKeys.has(item.key) && coverage.validMetricKeys.has(item.key))) reasons.push(`No valid canonical ${item.language} visual evidence exists for ${item.label}.`);
  }
  for (const missing of coverage.missingRequirementLabels.filter((label) => /\/(?:en|es)$/.test(label))) reasons.push(`No bilingual canonical trace requirement exists for ${missing}.`);
  const partial = await findPartialVisualEvidence({ projectRoot, workspace });
  const observations = partial.length ? ["Standalone or prereview visual reports are listed as partial evidence only; they do not replace canonical en/es scenario coverage."] : [];
  return makeGate(
    "english-spanish-evidence",
    [projectRelative(projectRoot, path.join(workspace, "migration.json")), ...coverage.evidence, ...partial],
    reasons,
    observations,
  );
}

async function analyzeAudio({ projectRoot, workspace, manifest }) {
  const inventoryRelative = manifest.audio?.inventoryFile || manifest.evidence?.audioInventory || "audio-inventory.csv";
  const inventoryPath = path.resolve(workspace, inventoryRelative);
  const auditPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
  const listeningPath = path.join(workspace, AUDIO_LISTENING_ACCEPTANCE_RELATIVE_PATH);
  const evidence = [projectRelative(projectRoot, inventoryPath), projectRelative(projectRoot, auditPath)];
  if (await exists(listeningPath)) evidence.push(projectRelative(projectRoot, listeningPath));
  const reasons = [];
  let rows = [];
  try {
    const csv = parseCsv(await readFile(inventoryPath, "utf8"));
    rows = csv.rows;
    for (const header of ["cue_id", "language", "source_file", "sha256", "start_frame", "start_frame_domain_id", "start_semantics", "duration_ms"]) {
      if (!csv.headers.includes(header)) reasons.push(`${inventoryRelative} is missing column ${header}.`);
    }
    const frameDomains = Array.isArray(manifest.implementation?.frameDomains) && manifest.implementation.frameDomains.length
      ? new Map(manifest.implementation.frameDomains.map((domain) => [domain.id, domain]))
      : new Map([["root", { id: "root", frameCount: manifest.runtime?.frameCount }]]);
    for (const [index, row] of rows.entries()) {
      const rowLabel = `${inventoryRelative} row ${index + 2}`;
      const sourcePath = await resolveExistingPath(row.source_file, [projectRoot, workspace]);
      if (!sourcePath) reasons.push(`${rowLabel} source_file does not exist (${row.source_file || "empty"}).`);
      else {
        evidence.push(projectRelative(projectRoot, sourcePath));
        if (!/^[a-f0-9]{64}$/i.test(row.sha256 || "") || (await sha256File(sourcePath)) !== row.sha256.toLowerCase()) reasons.push(`${rowLabel} SHA-256 is missing or mismatched.`);
      }
      if (!(Number(row.duration_ms) > 0)) reasons.push(`${rowLabel} duration_ms is not greater than zero.`);
      const startSemantics = row.start_semantics || "timeline-frame";
      if (!AUDIO_START_SEMANTICS.includes(startSemantics)) {
        reasons.push(`${rowLabel} start_semantics must be timeline-frame, host-user-activated, or interaction-state.`);
      }
      if (startSemantics === "timeline-frame") {
        const frameDomain = frameDomains.get(row.start_frame_domain_id);
        if (!frameDomain) reasons.push(`${rowLabel} start_frame_domain_id does not identify a declared frame domain for timeline-frame audio (${row.start_frame_domain_id || "empty"}).`);
        const frame = Number(row.start_frame);
        if (!Number.isInteger(frame) || frame < 1 || frame > (frameDomain?.frameCount || 0)) {
          reasons.push(`${rowLabel} start_frame is not a proven one-indexed frame in its declared frame domain for timeline-frame audio.`);
        }
      } else {
        if (row.start_frame !== "") reasons.push(`${rowLabel} start_frame must be blank when start_semantics is ${startSemantics}.`);
        if (row.start_frame_domain_id !== "") reasons.push(`${rowLabel} start_frame_domain_id must be blank when start_semantics is ${startSemantics}.`);
      }
    }
  } catch (error) {
    reasons.push(`Cannot read ${inventoryRelative} (${error.code === "ENOENT" ? "file does not exist" : error.message}).`);
  }
  if (manifest.audio?.required && !rows.length) reasons.push("Audio is required but audio-inventory.csv has no rows.");
  const audit = await readJson(auditPath);
  if (!audit.ok) reasons.push(`Cannot read authoritative audio audit (${audit.error}).`);
  else {
    const value = audit.value;
    if (value.animationId !== manifest.animationId) reasons.push("Audio audit animationId differs from migration.json.");
    if (value.source?.hashMatches !== true) reasons.push("Audio audit does not verify the source SWF hash.");
    if (value.acceptance?.structurallyAudited !== true) reasons.push("Audio structure is not marked audited.");
  }
  reasons.push(...await validateStrictAudioEvidence({projectRoot, workspace, manifest}));
  return makeGate("audio-hash-listening-sync", evidence, reasons);
}

async function validateCheckEvidence({ check, checkId, allowNotRequired, projectRoot, workspace }) {
  const reasons = [];
  const evidence = [];
  if (!check || typeof check !== "object") return { ok: false, reasons: [`check ${checkId} is missing.`], evidence };
  const resultAccepted = check.result === "pass" || (allowNotRequired && check.result === "not-required" && Boolean(check.reason));
  if (!resultAccepted) reasons.push(`check ${checkId} is not pass${allowNotRequired ? " or reasoned not-required" : ""}.`);
  const references = Array.isArray(check.evidence) ? check.evidence : check.evidence ? [check.evidence] : [];
  if (!references.length) reasons.push(`check ${checkId} has no hashed evidence reference.`);
  for (const [index, reference] of references.entries()) {
    if (!reference || typeof reference !== "object" || !reference.path || !/^[a-f0-9]{64}$/i.test(reference.sha256 || "")) {
      reasons.push(`check ${checkId} evidence[${index}] must contain path and SHA-256.`);
      continue;
    }
    const resolved = await resolveExistingPath(reference.path, [workspace, projectRoot]);
    if (!resolved) {
      reasons.push(`check ${checkId} evidence does not exist (${reference.path}).`);
      continue;
    }
    evidence.push(projectRelative(projectRoot, resolved));
    if ((await sha256File(resolved)) !== reference.sha256.toLowerCase()) reasons.push(`check ${checkId} evidence SHA-256 differs (${reference.path}).`);
  }
  return { ok: reasons.length === 0, reasons, evidence };
}

async function analyzeBehavior({ projectRoot, workspace, manifest, coverage }) {
  const behaviorPath = path.join(workspace, "evidence", "behavior-qa.json");
  const scenarioPath = path.join(workspace, "audit", "scenario-inventory.json");
  const evidence = [projectRelative(projectRoot, behaviorPath)];
  const reasons = [];
  if (await exists(scenarioPath)) evidence.push(projectRelative(projectRoot, scenarioPath));
  for (const [index, scenario] of (manifest.scenarios || []).entries()) {
    if (!scenario.id || !scenario.description || !["linear", "interactive"].includes(scenario.kind) || scenario.reachable !== true) reasons.push(`migration.json scenarios[${index}] is not a fully specified reachable scenario.`);
  }
  const behavior = await readJson(behaviorPath);
  if (!behavior.ok) reasons.push(`Canonical behavior QA is missing or invalid at ${projectRelative(projectRoot, behaviorPath)} (${behavior.error}).`);
  else {
    const value = behavior.value;
    if (value.schemaVersion !== 1 || value.animationId !== manifest.animationId || value.status !== "pass") reasons.push("behavior-qa.json identity/schema/status is not a passing record.");
    const checks = new Map((value.checks || []).map((check) => [check.id, check]));
    for (const checkId of REQUIRED_BEHAVIOR_CHECKS) {
      const allowNotRequired = ["interaction-input-scoring", "random-seeded-outcomes"].includes(checkId);
      const checked = await validateCheckEvidence({ check: checks.get(checkId), checkId, allowNotRequired, projectRoot, workspace });
      reasons.push(...checked.reasons.map((reason) => `behavior-qa.json ${reason}`));
      evidence.push(...checked.evidence);
    }
    if (!Array.isArray(value.scenarios) || JSON.stringify([...value.scenarios].sort(compareText)) !== JSON.stringify((manifest.scenarios || []).map(({ id }) => id).sort(compareText))) reasons.push("behavior-qa.json scenarios do not exactly match migration.json.");
  }
  for (const item of coverage.expectedItems) if (!(coverage.validCaptureKeys.has(item.key) && coverage.validMetricKeys.has(item.key))) {
    reasons.push(`Behavior trace ${item.label} lacks canonical frame coverage.`);
  }
  for (const missing of coverage.missingRequirementLabels) reasons.push(`Behavior coverage has no explicit trace requirement for ${missing}.`);
  return makeGate("replay-interaction-random", [...evidence, ...coverage.evidence], reasons);
}

async function analyzeProductQa({ projectRoot, workspace, manifest, coverage }) {
  const productPath = path.join(workspace, "evidence", "product-qa.json");
  const evidence = [projectRelative(projectRoot, productPath), projectRelative(projectRoot, path.join(workspace, "migration.json")), ...coverage.evidence];
  const reasons = [...coverage.networkReasons];
  if (coverage.domainAware) {
    for (const item of coverage.expectedItems) if (!(coverage.validCaptureKeys.has(item.key) && coverage.validMetricKeys.has(item.key))) {
      reasons.push(`Product QA trace ${item.label} lacks canonical capture+metrics coverage.`);
    }
    for (const missing of coverage.missingRequirementLabels) reasons.push(`Product QA has no explicit trace requirement for ${missing}.`);
  }
  for (const [key, value] of Object.entries(manifest.accessibility || {})) if (value !== true) reasons.push(`accessibility.${key} is not true.`);
  const product = await readJson(productPath);
  if (!product.ok) reasons.push(`Canonical product QA is missing or invalid at ${projectRelative(projectRoot, productPath)} (${product.error}).`);
  else {
    const value = product.value;
    if (value.schemaVersion !== 1 || value.animationId !== manifest.animationId || value.status !== "pass") reasons.push("product-qa.json identity/schema/status is not a passing record.");
    const checks = new Map((value.checks || []).map((check) => [check.id, check]));
    for (const checkId of REQUIRED_PRODUCT_CHECKS) {
      const checked = await validateCheckEvidence({ check: checks.get(checkId), checkId, allowNotRequired: false, projectRoot, workspace });
      reasons.push(...checked.reasons.map((reason) => `product-qa.json ${reason}`));
      evidence.push(...checked.evidence);
    }
  }
  const partialAudioQa = path.join(workspace, "evidence", "product-audio-controls-qa.json");
  const observations = [];
  if (await exists(partialAudioQa)) {
    evidence.push(projectRelative(projectRoot, partialAudioQa));
    observations.push("Product audio-control QA is partial evidence; it is not the canonical all-viewport/accessibility/product QA record.");
  }
  return makeGate("product-qa", evidence, reasons, observations);
}

function reviewReasons(review, { label, scopeRequired = false }) {
  const reasons = [];
  if (review?.decision !== "accepted") reasons.push(`${label}.decision is ${review?.decision || "missing"}, not accepted.`);
  if (!review?.reviewer) reasons.push(`${label}.reviewer is missing.`);
  if (!review?.reviewedAt || Number.isNaN(Date.parse(review.reviewedAt))) reasons.push(`${label}.reviewedAt is missing or invalid.`);
  if (scopeRequired && review?.scope !== "all-keyframe-and-full-frame-diffs") reasons.push(`${label}.scope does not cover all keyframe and full-frame diffs.`);
  return reasons;
}

function reviewRecordPath(projectRoot, descriptor) {
  if (!descriptor || typeof descriptor !== "object" || typeof descriptor.path !== "string") return null;
  return path.resolve(projectRoot, descriptor.path);
}

function recordEvidencePaths(validation) {
  const paths = [
    validation?.descriptor?.path,
    validation?.input?.descriptor?.path,
    ...(validation?.input?.value?.artifactSet?.artifacts || []).map(({path: artifactPath}) => artifactPath),
  ];
  return unique(paths);
}

function acceptedRecordMirrorReasons(review, record, label, {owner = false} = {}) {
  const reasons = [];
  if (record?.decision !== "accepted") reasons.push(`${label}.record decision is ${record?.decision || "missing"}, not accepted.`);
  if (review?.reviewer !== record?.reviewer?.fullName) reasons.push(`${label}.reviewer does not mirror the immutable record reviewer fullName.`);
  if (review?.reviewedAt !== record?.reviewedAt) reasons.push(`${label}.reviewedAt does not mirror the immutable record timestamp.`);
  if (!owner && review?.scope !== record?.scope) reasons.push(`${label}.scope does not mirror the immutable record scope.`);
  if (owner && review?.reason !== record?.reason) reasons.push(`${label}.reason does not mirror the immutable owner record reason.`);
  return reasons;
}

async function analyzeHumanReview({projectRoot, workspace, manifest, manifestPath, prereviews, observation}) {
  const review = manifest.acceptance?.humanVisualReview;
  const reasons = reviewReasons(review, {
    label: "acceptance.humanVisualReview",
    scopeRequired: true,
  });
  const evidence = [manifestPath, ...prereviews];
  if (review?.decision !== "accepted") return makeGate("human-review", evidence, reasons, observation);
  if (!review.record) {
    reasons.push("acceptance.humanVisualReview is accepted legacy-unbound inline data; an immutable record descriptor is required.");
    return makeGate("human-review", evidence, reasons, observation);
  }
  try {
    const expectations = await deriveHumanReviewExpectations({projectRoot, workspace, manifest});
    const validation = await validateHumanVisualReviewRecord({
      projectRoot,
      workspace,
      manifest,
      recordPath: reviewRecordPath(projectRoot, review.record),
      expectedRecordDescriptor: review.record,
      ...expectations,
    });
    evidence.push(...recordEvidencePaths(validation));
    reasons.push(...acceptedRecordMirrorReasons(review, validation.value, "acceptance.humanVisualReview"));
  } catch (error) {
    reasons.push(`acceptance.humanVisualReview immutable record is invalid or stale (${error.message}).`);
    if (typeof review.record?.path === "string") evidence.push(review.record.path);
  }
  return makeGate("human-review", unique(evidence), reasons, observation);
}

async function analyzeOwnerReview({projectRoot, workspace, manifest, manifestPath, prereviews, observation}) {
  const review = manifest.acceptance?.ownerReview;
  const reasons = reviewReasons(review, {label: "acceptance.ownerReview"});
  const evidence = [manifestPath, ...prereviews];
  if (review?.decision !== "accepted") return makeGate("owner-acceptance", evidence, reasons, observation);
  if (!review.record) {
    reasons.push("acceptance.ownerReview is accepted legacy-unbound inline data; an immutable record descriptor is required.");
    return makeGate("owner-acceptance", evidence, reasons, observation);
  }
  try {
    const expectations = await deriveHumanReviewExpectations({projectRoot, workspace, manifest});
    const expectedOwnerEvidence = await deriveOwnerReviewEvidence({projectRoot, workspace, manifest});
    const validation = await validateOwnerReviewRecord({
      projectRoot,
      workspace,
      manifest,
      recordPath: reviewRecordPath(projectRoot, review.record),
      expectedRecordDescriptor: review.record,
      expectedOwnerEvidence,
      ...expectations,
    });
    evidence.push(
      validation.descriptor.path,
      validation.human.descriptor.path,
      validation.human.input?.descriptor?.path,
      ...validation.value.audioEvidence.map(({path: artifactPath}) => artifactPath),
      ...validation.value.behaviorEvidence.map(({path: artifactPath}) => artifactPath),
      ...validation.value.productEvidence.map(({path: artifactPath}) => artifactPath),
    );
    reasons.push(...acceptedRecordMirrorReasons(review, validation.value, "acceptance.ownerReview", {owner: true}));
    const mirroredHuman = manifest.acceptance?.humanVisualReview?.record;
    if (
      validation.value.humanVisualReview?.path !== mirroredHuman?.path
      || validation.value.humanVisualReview?.bytes !== mirroredHuman?.bytes
      || validation.value.humanVisualReview?.sha256 !== mirroredHuman?.sha256
    ) {
      reasons.push("acceptance.ownerReview.record does not bind the exact immutable human record mirrored by migration.json.");
    }
  } catch (error) {
    reasons.push(`acceptance.ownerReview immutable record is invalid or stale (${error.message}).`);
    if (typeof review.record?.path === "string") evidence.push(review.record.path);
  }
  return makeGate("owner-acceptance", unique(evidence), reasons, observation);
}

async function prereviewPaths({ projectRoot, workspace }) {
  return (await walkJsonFiles(path.join(workspace, "evidence")))
    .filter((filePath) => path.basename(filePath).includes("prereview"))
    .map((filePath) => projectRelative(projectRoot, filePath));
}

async function analyzeReviews({ projectRoot, workspace, manifest }) {
  const manifestPath = projectRelative(projectRoot, path.join(workspace, "migration.json"));
  const prereviews = await prereviewPaths({ projectRoot, workspace });
  const observation = prereviews.length ? ["Prereview files are deliberately excluded from signed review decisions."] : [];
  return [
    makeGate("engineering-review", [manifestPath, ...prereviews], reviewReasons(manifest.acceptance?.engineeringReview, { label: "acceptance.engineeringReview" }), observation),
    await analyzeHumanReview({projectRoot, workspace, manifest, manifestPath, prereviews, observation}),
    await analyzeOwnerReview({projectRoot, workspace, manifest, manifestPath, prereviews, observation}),
  ];
}

async function analyzeStrictValidator({ projectRoot, workspace, validateMigrationFn, validator }) {
  let result;
  try {
    result = await validateMigrationFn(workspace);
  } catch (error) {
    result = { ok: false, errors: [`Validator threw: ${error.message}`], warnings: [] };
  }
  return makeGate(
    "strict-validator",
    [projectRelative(projectRoot, path.join(workspace, "migration.json")), validator.path],
    result.ok === true ? [] : (result.errors?.length ? result.errors : ["Strict validator did not return ok=true."]),
    result.warnings || [],
  );
}

async function analyzeVerification({ projectRoot, workspace, manifestSha256 }) {
  const verificationPath = path.join(workspace, "evidence", "verification.json");
  const evidence = [projectRelative(projectRoot, verificationPath)];
  const parsed = await readJson(verificationPath);
  const commonReasons = [];
  if (!parsed.ok) commonReasons.push(`Current verification record is missing or invalid at ${projectRelative(projectRoot, verificationPath)} (${parsed.error}).`);
  else {
    if (parsed.value.schemaVersion !== 1) commonReasons.push("verification.json schemaVersion is not 1.");
    if (parsed.value.manifestSha256 !== manifestSha256) commonReasons.push("verification.json is stale: manifestSha256 differs from the current migration.json.");
  }
  async function commandGate(id, key, expectedCommand) {
    const reasons = [...commonReasons];
    const gateEvidence = [...evidence];
    if (parsed.ok) {
      const command = parsed.value.commands?.[key];
      if (!command || command.status !== "pass" || command.exitCode !== 0) reasons.push(`verification.json commands.${key} is not a zero-exit pass.`);
      if (command?.command !== expectedCommand) reasons.push(`verification.json commands.${key}.command is ${command?.command || "missing"}; expected ${expectedCommand}.`);
      if (!command?.outputSha256 || !/^[a-f0-9]{64}$/i.test(command.outputSha256)) reasons.push(`verification.json commands.${key}.outputSha256 is missing or invalid.`);
      const outputPath = await resolveExistingPath(command?.outputFile, [workspace, projectRoot]);
      if (!outputPath) reasons.push(`verification.json commands.${key}.outputFile does not resolve (${command?.outputFile || "empty"}).`);
      else {
        gateEvidence.push(projectRelative(projectRoot, outputPath));
        if ((await sha256File(outputPath)) !== String(command.outputSha256 || "").toLowerCase()) reasons.push(`verification.json commands.${key} output SHA-256 differs from the recorded output file.`);
      }
    }
    return makeGate(id, gateEvidence, reasons);
  }
  return [
    await commandGate("regression-tests", "test", "npm test"),
    await commandGate("production-build", "build", "npm run build"),
  ];
}

async function unreadablePilot({ projectRoot, workspace, pilotId, parseError, validator }) {
  const manifestPath = projectRelative(projectRoot, path.join(workspace, "migration.json"));
  const reason = `Cannot read migration.json for ${pilotId} (${parseError}).`;
  const gates = PILOT_GATE_DEFINITIONS.map(({ id }) => makeGate(id, [manifestPath, ...(id === "strict-validator" ? [validator.path] : [])], [reason]));
  return {
    animationId: pilotId,
    workspace: projectRelative(projectRoot, workspace),
    migrationStatus: "unreadable",
    manifestSha256: null,
    sourceSwfSha256: null,
    strictAccepted: false,
    passedGateCount: 0,
    failedGateCount: gates.length,
    gates,
  };
}

export async function evaluatePilot({
  projectRoot,
  migrationsRoot,
  pilotId,
  validateMigrationFn = validateMigration,
  inspectTraceEvidenceFn = inspectPilotTraceEvidence,
  validator,
}) {
  const workspace = path.join(migrationsRoot, pilotId);
  const manifestPath = path.join(workspace, "migration.json");
  const parsed = await readJson(manifestPath);
  if (!parsed.ok) return unreadablePilot({ projectRoot, workspace, pilotId, parseError: parsed.error, validator });
  const manifest = parsed.value;
  const coverage = await analyzeCanonicalCoverage({ projectRoot, workspace, manifest });
  const traceEvidence = await analyzeTraceEvidence({
    projectRoot,
    migrationsRoot,
    manifest,
    coverage,
    inspectTraceEvidenceFn,
  });
  const flaAuthoringAudit = await analyzeFlaAuthoringAudit({ projectRoot, workspace, manifest });
  const frameDomainDisposition = await analyzeFrameDomainDispositionAudit({ projectRoot, workspace, manifest });
  const rendererFrameDomainSupport = await analyzeRendererFrameDomainSupportAudit({ projectRoot, workspace, manifest });
  const authoritativeBaselineGate = applyFlaAuthoringAuditGate(
    applyTraceEvidenceGate(applyFrameDomainDispositionGate(
      await analyzeAuthoritativeBaseline({ projectRoot, workspace, manifest, coverage }),
      frameDomainDisposition,
    ), traceEvidence),
    flaAuthoringAudit,
  );
  const deterministicContractGate = applyTraceEvidenceGate(applyRendererFrameDomainSupportGate(
    applyFrameDomainDispositionGate(
      analyzeDeterministicContract({ projectRoot, workspace, manifest, coverage }),
      frameDomainDisposition,
    ),
    rendererFrameDomainSupport,
  ), traceEvidence);
  const fullCoverageGate = applyTraceEvidenceGate(
    applyRendererFrameDomainSupportGate(
      applyFrameDomainDispositionGate(analyzeFullCoverage(coverage), frameDomainDisposition),
      rendererFrameDomainSupport,
    ),
    traceEvidence,
  );
  const behaviorGate = applyTraceEvidenceGate(
    await analyzeBehavior({ projectRoot, workspace, manifest, coverage }),
    traceEvidence,
  );
  const gates = [
    authoritativeBaselineGate,
    applyRendererFrameDomainSupportGate(
      await analyzeImplementation({ projectRoot, workspace, manifest }),
      rendererFrameDomainSupport,
    ),
    deterministicContractGate,
    fullCoverageGate,
    analyzeRmse(coverage),
    await analyzeBilingual({ projectRoot, workspace, manifest, coverage }),
    await analyzeAudio({ projectRoot, workspace, manifest }),
    behaviorGate,
    await analyzeProductQa({ projectRoot, workspace, manifest, coverage }),
    ...await analyzeReviews({ projectRoot, workspace, manifest }),
    await analyzeStrictValidator({ projectRoot, workspace, validateMigrationFn, validator }),
    ...await analyzeVerification({ projectRoot, workspace, manifestSha256: parsed.sha256 }),
  ];
  const order = new Map(PILOT_GATE_DEFINITIONS.map(({ id }, index) => [id, index]));
  gates.sort((left, right) => order.get(left.id) - order.get(right.id));
  const passedGateCount = gates.filter(({ status }) => status === "pass").length;
  const strictAccepted = manifest.status === "complete" && passedGateCount === PILOT_GATE_DEFINITIONS.length;
  return {
    animationId: manifest.animationId || manifest.id || pilotId,
    workspace: projectRelative(projectRoot, workspace),
    migrationStatus: manifest.status || "missing",
    manifestSha256: parsed.sha256,
    sourceSwfSha256: manifest.source?.swfSha256 || null,
    implementationRoute: manifest.implementation?.route || null,
    traceEvidence: traceEvidenceReportSummary(traceEvidence),
    strictAccepted,
    passedGateCount,
    failedGateCount: gates.length - passedGateCount,
    gates,
  };
}

function buildMarkerPayload(report) {
  const { generatedMarker: _generatedMarker, ...withoutMarker } = report;
  return withoutMarker;
}

export async function generatePilotStrictAcceptance({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  pilots = PILOT_MIGRATIONS,
  validateMigrationFn = validateMigration,
  inspectTraceEvidenceFn = inspectPilotTraceEvidence,
  validatorVersion = MIGRATION_VALIDATOR_VERSION,
  validatorAbsolutePath = validatorPath,
} = {}) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedMigrationsRoot = path.resolve(migrationsRoot);
  const pilotIds = pilots.map(({ id }) => id);
  if (pilotIds.length !== 16) throw new Error(`Strict pilot ledger requires exactly 16 pilots; received ${pilotIds.length}`);
  if (new Set(pilotIds).size !== pilotIds.length) throw new Error("Strict pilot ledger pilot IDs must be unique");
  const validator = {
    path: projectRelative(resolvedProjectRoot, validatorAbsolutePath),
    version: validatorVersion,
    sha256: (await exists(validatorAbsolutePath)) ? await sha256File(validatorAbsolutePath) : null,
  };
  const entries = [];
  for (const pilotId of [...pilotIds].sort(compareText)) {
    entries.push(await evaluatePilot({ projectRoot: resolvedProjectRoot, migrationsRoot: resolvedMigrationsRoot, pilotId, validateMigrationFn, inspectTraceEvidenceFn, validator }));
  }
  const gatePassCounts = Object.fromEntries(PILOT_GATE_DEFINITIONS.map(({ id }) => [id, entries.filter((entry) => entry.gates.find((gate) => gate.id === id)?.status === "pass").length]));
  const report = {
    schemaVersion: PILOT_ACCEPTANCE_SCHEMA_VERSION,
    generatedMarker: null,
    generator: {
      path: projectRelative(resolvedProjectRoot, scriptPath),
      version: PILOT_ACCEPTANCE_GENERATOR_VERSION,
      sha256: (await exists(scriptPath)) ? await sha256File(scriptPath) : null,
    },
    validator,
    source: {
      migrationsRoot: projectRelative(resolvedProjectRoot, resolvedMigrationsRoot),
      approvedPilotList: projectRelative(resolvedProjectRoot, path.join(resolvedProjectRoot, "scripts", "scaffold-pilot-migrations.mjs")),
      pilotCount: pilotIds.length,
    },
    policy: {
      admissionRule: "strictAccepted is true only when migration status is complete and every listed gate passes",
      failClosed: true,
      changesMigrationStatus: false,
      infersHumanReview: false,
      infersOwnerAcceptance: false,
      partialOrPrereviewEvidenceIsAcceptance: false,
    },
    gateDefinitions: PILOT_GATE_DEFINITIONS,
    summary: {
      pilots: entries.length,
      strictAccepted: entries.filter(({ strictAccepted }) => strictAccepted).length,
      notStrictAccepted: entries.filter(({ strictAccepted }) => !strictAccepted).length,
      totalGates: entries.length * PILOT_GATE_DEFINITIONS.length,
      passedGates: entries.reduce((sum, entry) => sum + entry.passedGateCount, 0),
      failedGates: entries.reduce((sum, entry) => sum + entry.failedGateCount, 0),
      gatePassCounts,
    },
    pilots: entries,
  };
  report.generatedMarker = `sha256:${sha256Text(JSON.stringify(buildMarkerPayload(report)))}`;
  return report;
}

function markdownEscape(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function compactReasons(gate, limit = 4) {
  if (!gate.reasons.length) return "—";
  const selected = gate.reasons.slice(0, limit).map(markdownEscape);
  if (gate.reasons.length > limit) selected.push(`… JSON 中另有 ${gate.reasons.length - limit} 项`);
  return selected.join("<br>");
}

function compactEvidence(gate, limit = 4) {
  if (!gate.evidence.length) return "—";
  const selected = gate.evidence.slice(0, limit).map((item) => `\`${markdownEscape(item)}\``);
  if (gate.evidence.length > limit) selected.push(`… +${gate.evidence.length - limit}`);
  return selected.join("<br>");
}

export function renderPilotStrictAcceptanceMarkdown(report) {
  const lines = [
    "# HELP Math 16 项试点严格验收台账",
    "",
    `结论：**${report.summary.strictAccepted}/${report.summary.pilots} 项通过严格验收**。本报告默认拒绝缺失或含糊证据，不修改 migration 状态，不代签人工审核或 owner 验收。`,
    "",
    `可复现标记：\`${report.generatedMarker}\``,
    "",
    "## 汇总",
    "",
    "| 动画 | migration 状态 | 已通过门禁 | 严格验收 |",
    "|---|---:|---:|---:|",
  ];
  for (const pilot of report.pilots) lines.push(`| \`${markdownEscape(pilot.animationId)}\` | ${markdownEscape(pilot.migrationStatus)} | ${pilot.passedGateCount}/${PILOT_GATE_DEFINITIONS.length} | ${pilot.strictAccepted ? "PASS" : "FAIL"} |`);
  lines.push("", "## 门禁定义", "");
  for (const [index, gate] of report.gateDefinitions.entries()) lines.push(`${index + 1}. **${gate.label}**：${gate.requirement}`);
  for (const pilot of report.pilots) {
    lines.push(
      "",
      `## ${pilot.animationId}`,
      "",
      `- 工作区：\`${pilot.workspace}\``,
      `- migration 状态：\`${pilot.migrationStatus}\``,
      `- manifest SHA-256：\`${pilot.manifestSha256 || "unavailable"}\``,
      ...(pilot.traceEvidence ? [
        `- Trace spec / execution：${pilot.traceEvidence.readySpecCount} ready、${pilot.traceEvidence.unresolvedSpecCount} unresolved、${pilot.traceEvidence.absentSpecCount} absent；${pilot.traceEvidence.completeCount}/${pilot.traceEvidence.requirementCount} 份 execution report + baseline 绑定完成复核。spec 本身不计作 baseline authority。`,
      ] : []),
      `- 结果：**${pilot.strictAccepted ? "PASS" : "FAIL"}**（${pilot.passedGateCount}/${PILOT_GATE_DEFINITIONS.length} 门禁通过）`,
      "",
      "| 门禁 | 结果 | 证据路径 | 未通过原因 |",
      "|---|---:|---|---|",
    );
    for (const gate of pilot.gates) lines.push(`| ${markdownEscape(gate.label)} | ${gate.status.toUpperCase()} | ${compactEvidence(gate)} | ${compactReasons(gate)} |`);
  }
  lines.push(
    "",
    "## 使用说明",
    "",
    "JSON 报告保留每个门禁的完整原因、候选证据和观察项；Markdown 为便于人工浏览而对单元格中的长原因做了截断。重新运行生成器即可更新两份报告；`--check` 用于检测报告是否过期。",
    "",
  );
  return lines.join("\n");
}

async function atomicWrite(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.tmp`);
  try {
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function writePilotStrictAcceptance({
  projectRoot = defaultProjectRoot,
  migrationsRoot = path.join(projectRoot, "migrations"),
  jsonOutput = path.join(projectRoot, "reports", "pilot-strict-acceptance.json"),
  markdownOutput = path.join(projectRoot, "reports", "pilot-strict-acceptance.md"),
  pilots = PILOT_MIGRATIONS,
  validateMigrationFn = validateMigration,
  inspectTraceEvidenceFn = inspectPilotTraceEvidence,
  validatorVersion = MIGRATION_VALIDATOR_VERSION,
  validatorAbsolutePath = validatorPath,
} = {}) {
  const report = await generatePilotStrictAcceptance({ projectRoot, migrationsRoot, pilots, validateMigrationFn, inspectTraceEvidenceFn, validatorVersion, validatorAbsolutePath });
  const json = stableJson(report);
  const markdown = renderPilotStrictAcceptanceMarkdown(report);
  await atomicWrite(path.resolve(jsonOutput), json);
  await atomicWrite(path.resolve(markdownOutput), markdown);
  return { report, json, markdown, jsonOutput: path.resolve(jsonOutput), markdownOutput: path.resolve(markdownOutput) };
}

export async function checkPilotStrictAcceptance(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const jsonOutput = path.resolve(options.jsonOutput || path.join(projectRoot, "reports", "pilot-strict-acceptance.json"));
  const markdownOutput = path.resolve(options.markdownOutput || path.join(projectRoot, "reports", "pilot-strict-acceptance.md"));
  const report = await generatePilotStrictAcceptance({ ...options, projectRoot });
  const expectedJson = stableJson(report);
  const expectedMarkdown = renderPilotStrictAcceptanceMarkdown(report);
  const actualJson = (await exists(jsonOutput)) ? await readFile(jsonOutput, "utf8") : null;
  const actualMarkdown = (await exists(markdownOutput)) ? await readFile(markdownOutput, "utf8") : null;
  return {
    ok: actualJson === expectedJson && actualMarkdown === expectedMarkdown,
    jsonCurrent: actualJson === expectedJson,
    markdownCurrent: actualMarkdown === expectedMarkdown,
    report,
  };
}

export function parseArguments(argv) {
  const options = {
    projectRoot: defaultProjectRoot,
    migrationsRoot: defaultMigrationsRoot,
    jsonOutput: defaultJsonOutput,
    markdownOutput: defaultMarkdownOutput,
    check: false,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (["--migrations", "--output-json", "--output-markdown"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--output-json") options.jsonOutput = path.resolve(next);
      else options.markdownOutput = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-pilot-strict-acceptance.mjs [--check] [--json]
    [--migrations <directory>] [--output-json <file>] [--output-markdown <file>]

Generates a deterministic, fail-closed 16-pilot strict-acceptance ledger and
human-readable report. It never changes migration status or review decisions.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    if (options.check) {
      const result = await checkPilotStrictAcceptance(options);
      if (options.json) console.log(JSON.stringify({ ok: result.ok, jsonCurrent: result.jsonCurrent, markdownCurrent: result.markdownCurrent, summary: result.report.summary }, null, 2));
      else console.log(`${result.ok ? "PASS" : "FAIL"}: pilot strict-acceptance reports ${result.ok ? "are current" : "are missing or stale"}`);
      if (!result.ok) process.exitCode = 1;
      return;
    }
    const result = await writePilotStrictAcceptance(options);
    if (options.json) console.log(JSON.stringify({ jsonOutput: result.jsonOutput, markdownOutput: result.markdownOutput, generatedMarker: result.report.generatedMarker, summary: result.report.summary }, null, 2));
    else console.log(`Wrote ${result.jsonOutput} and ${result.markdownOutput}: ${result.report.summary.strictAccepted}/${result.report.summary.pilots} strict accepted`);
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
