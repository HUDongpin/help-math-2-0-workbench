#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {safeRequirementId} from "./build-course-trace-specs.mjs";
import {captureKeyframes} from "./capture-animation-keyframes.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  IMPLEMENTATION_CAPTURE_SCHEMA_VERSION,
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  implementationCaptureGeneratorProvenanceErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";
import {
  normalizeRequirementSelection,
  validateRequirementCoverageGroups,
} from "./lib/trace-frame-selection.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_PROJECT_PATH = "scripts/capture-coverage-v2-requirements.mjs";
const COVERAGE_PROJECT_PATH = "evidence/full-frame-coverage.json";
const ORCHESTRATION_MANIFEST_NAME = "capture-orchestration.json";
const OUTPUT_BASE_PROJECT_PATH = "output/playwright";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SUPPORTED_LANGUAGES = new Set(["en", "es"]);
const ORCHESTRATION_STATUS = "complete-non-authoritative-implementation-capture-orchestration";

function usage() {
  return `Usage: node scripts/capture-coverage-v2-requirements.mjs [options]

Required:
  --id <animation-id>       Migration animation ID
  --base-url <url>          Credential-free loopback HTTP origin

Options:
  --project-root <path>     Project root (default: repository root)
  --output-root <path>      Fresh output root below output/playwright
                            (default: output/playwright/coverage-v2/<id>)
  --requirement <id>        Capture one exact coverage requirement; repeatable
                            (default: every coverage-v2 requirement)
  --check                   Validate inputs and print the capture plan only
  --json                    Print the plan/result as JSON
  -h, --help                Show this help

This command captures current JavaScript output only. It does not edit the
migration, coverage, adoption, approval, review, ledger, or status files, and
it does not claim original-runtime authority, RMSE parity, audio acceptance,
human review, owner acceptance, fidelity, or migration completion.`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  );
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requireStableId(value, label) {
  requireString(value, label);
  if (!STABLE_ID_PATTERN.test(value)) throw new Error(`${label} must be a stable identifier`);
  return value;
}

function requireAnimationId(value) {
  requireStableId(value, "--id");
  if (value.includes(":")) throw new Error("--id must be a path-safe animation identifier");
  return value;
}

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
  return value;
}

function requireSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function requirePlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value;
}

function rejectTraversalSpelling(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty path`);
  if (value.includes("\0")) throw new Error(`${label} contains a NUL byte`);
  if (value.includes("\\")) throw new Error(`${label} must use platform path separators without backslashes`);
  if (value.split("/").includes("..")) throw new Error(`${label} must not contain traversal segments`);
}

export function parseArguments(argv) {
  const options = {
    projectRoot: DEFAULT_PROJECT_ROOT,
    requirements: [],
    check: false,
    json: false,
  };
  const singleValueOptions = new Map([
    ["--id", "id"],
    ["--base-url", "baseUrl"],
    ["--project-root", "projectRoot"],
    ["--output-root", "outputRoot"],
  ]);
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--requirement") {
      const value = argv[index + 1];
      if (!value) throw new Error("--requirement requires a value");
      options.requirements.push(value);
      index += 1;
    } else if (singleValueOptions.has(argument)) {
      if (seen.has(argument)) throw new Error(`${argument} may be specified only once`);
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      options[singleValueOptions.get(argument)] = value;
      seen.add(argument);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  options.projectRoot = path.resolve(options.projectRoot);
  return options;
}

async function lstatIfPresent(candidate) {
  try {
    return await lstat(candidate);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function assertNoSymlinkComponents(root, candidate, label) {
  const absoluteRoot = path.resolve(root);
  const absoluteCandidate = path.resolve(candidate);
  if (!isInside(absoluteCandidate, absoluteRoot)) throw new Error(`${label} escapes the project root`);
  const rootInfo = await lstat(absoluteRoot);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error(`${label} project root must be a real directory`);
  let current = absoluteRoot;
  for (const component of path.relative(absoluteRoot, absoluteCandidate).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    const info = await lstatIfPresent(current);
    if (!info) return;
    if (info.isSymbolicLink()) {
      throw new Error(`${label} contains forbidden symbolic-link component ${portable(path.relative(absoluteRoot, current))}`);
    }
  }
}

async function readBoundJson(projectRoot, candidate, label) {
  await assertNoSymlinkComponents(projectRoot, candidate, label);
  const before = await lstat(candidate);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error(`${label} must be a regular non-symbolic-link file`);
  const bytes = await readFile(candidate);
  const after = await lstat(candidate);
  if (
    !after.isFile()
    || after.isSymbolicLink()
    || before.dev !== after.dev
    || before.ino !== after.ino
    || before.size !== after.size
  ) throw new Error(`${label} changed while it was being read`);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON (${error.message})`);
  }
  return {
    value,
    bytes,
    descriptor: {
      path: portable(path.relative(projectRoot, candidate)),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function collectGeneratorProvenance() {
  const bytes = await readFile(SCRIPT_PATH);
  return {
    schemaVersion: 1,
    script: {
      path: SCRIPT_PROJECT_PATH,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

function normalizeBaseUrl(value) {
  requireString(value, "--base-url");
  if (!isUnambiguousLoopbackHttpUrl(value)) {
    throw new Error("--base-url must be an unambiguous credential-free loopback HTTP URL");
  }
  const parsed = new URL(value);
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("--base-url must contain only a loopback HTTP origin, without a path, query, or fragment");
  }
  return parsed.origin;
}

function validateRoute(route, animationId) {
  requireString(route, "migration.implementation.route");
  if (
    !route.startsWith("/")
    || route.includes("\\")
    || route.includes("?")
    || route.includes("#")
    || route.includes("%")
    || route.split("/").includes("..")
    || route.split("/").includes(".")
    || route.includes("//")
  ) throw new Error("migration.implementation.route must be a normalized absolute application path");
  if (route !== `/animations/${animationId}`) {
    throw new Error(`migration.implementation.route must equal /animations/${animationId}`);
  }
  return route;
}

function localeUrl(baseUrl, route, language) {
  const target = new URL(`/${language}${route}`, `${baseUrl}/`);
  if (!isUnambiguousLoopbackHttpUrl(target.href)) throw new Error(`derived ${language} capture URL is not loopback HTTP`);
  return target.href;
}

function validateCaptureContract(value) {
  requirePlainObject(value, "migration.implementation.captureContract");
  const fields = [
    "frameParameter",
    "frameDomainParameter",
    "requirementIdParameter",
    "traceParameter",
    "entryStateSha256Parameter",
    "scenarioParameter",
    "languageParameter",
    "seedParameter",
  ];
  const result = {};
  for (const field of fields) {
    const parameter = requireString(value[field], `migration.implementation.captureContract.${field}`);
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(parameter)) {
      throw new Error(`migration.implementation.captureContract.${field} must be a stable query parameter name`);
    }
    result[field] = parameter;
  }
  if (new Set(Object.values(result)).size !== fields.length) {
    throw new Error("migration.implementation.captureContract query parameter names must be unique");
  }
  if (Object.values(result).includes("capture")) {
    throw new Error("migration.implementation.captureContract must not use the reserved capture query parameter");
  }
  return result;
}

function validateDomains(manifest) {
  const domains = manifest?.implementation?.frameDomains;
  if (!Array.isArray(domains) || !domains.length) throw new Error("migration.implementation.frameDomains must be a non-empty array");
  const runtimeDefinitions = manifest?.runtime?.timelineDefinitions;
  const runtimeDefinitionsDeclared = runtimeDefinitions !== undefined;
  if (runtimeDefinitionsDeclared && (!Array.isArray(runtimeDefinitions) || !runtimeDefinitions.length)) {
    throw new Error("declared migration.runtime.timelineDefinitions must be a non-empty array");
  }
  const runtimeById = new Map();
  for (const [index, definition] of (runtimeDefinitions || []).entries()) {
    const id = requireStableId(definition?.id, `migration.runtime.timelineDefinitions[${index}].id`);
    if (runtimeById.has(id)) throw new Error(`migration.runtime.timelineDefinitions contains duplicate ${id}`);
    runtimeById.set(id, requirePositiveInteger(definition.frameCount, `runtime timeline ${id} frameCount`));
  }
  const result = new Map();
  for (const [index, domain] of domains.entries()) {
    const id = requireStableId(domain?.id, `migration.implementation.frameDomains[${index}].id`);
    if (result.has(id)) throw new Error(`migration.implementation.frameDomains contains duplicate ${id}`);
    const frameCount = requirePositiveInteger(domain.frameCount, `frame domain ${id} frameCount`);
    if (runtimeDefinitionsDeclared && !runtimeById.has(id)) {
      throw new Error(`frame domain ${id} is missing from migration.runtime.timelineDefinitions`);
    }
    if (runtimeDefinitionsDeclared && runtimeById.get(id) !== frameCount) {
      throw new Error(`frame domain ${id} frameCount differs from migration.runtime.timelineDefinitions`);
    }
    if (!Array.isArray(domain.scenarioIds) || !domain.scenarioIds.length) {
      throw new Error(`frame domain ${id} must declare scenarioIds`);
    }
    const scenarioIds = domain.scenarioIds.map((scenario, scenarioIndex) =>
      requireStableId(scenario, `frame domain ${id} scenarioIds[${scenarioIndex}]`));
    if (new Set(scenarioIds).size !== scenarioIds.length) throw new Error(`frame domain ${id} contains duplicate scenarioIds`);
    result.set(id, {frameCount, scenarioIds: new Set(scenarioIds)});
  }
  if (result.get("root")?.frameCount !== manifest?.runtime?.frameCount) {
    throw new Error("root frame domain count differs from migration.runtime.frameCount");
  }
  // Some preserved course workspaces predate runtime.timelineDefinitions but
  // already carry the exact renderer-addressable contract in
  // implementation.frameDomains. That contract is sufficient for an
  // acceptance-neutral implementation capture; original-runtime adoption and
  // trace validators retain their separate source/runtime requirements.
  return result;
}

function validateRequirement(requirement, index, domains, animationId, baseUrl, route) {
  requirePlainObject(requirement, `coverage.requirements[${index}]`);
  const requirementId = requireStableId(requirement.requirementId, `coverage.requirements[${index}].requirementId`);
  const frameDomainId = requireStableId(requirement.frameDomainId, `${requirementId}.frameDomainId`);
  const domain = domains.get(frameDomainId);
  if (!domain) throw new Error(`${requirementId} references undeclared frame domain ${frameDomainId}`);
  const scenario = requireStableId(requirement.scenario, `${requirementId}.scenario`);
  if (!domain.scenarioIds.has(scenario)) throw new Error(`${requirementId} scenario ${scenario} is not declared by frame domain ${frameDomainId}`);
  const language = requireStableId(requirement.language, `${requirementId}.language`);
  if (!SUPPORTED_LANGUAGES.has(language)) throw new Error(`${requirementId}.language must be en or es`);
  const seed = String(requireString(String(requirement.seed ?? ""), `${requirementId}.seed`));
  if (!/^[A-Za-z0-9._:-]+$/.test(seed)) throw new Error(`${requirementId}.seed is not a stable deterministic seed`);
  const traceId = requireStableId(requirement.traceId, `${requirementId}.traceId`);
  const entryStateSha256 = requireSha256(requirement.entryStateSha256, `${requirementId}.entryStateSha256`);
  const entryState = requirePlainObject(requirement.entryState, `${requirementId}.entryState`);
  if (sha256(Buffer.from(canonicalJson(entryState))) !== entryStateSha256) {
    throw new Error(`${requirementId}.entryStateSha256 differs from its canonical entryState`);
  }
  for (const [field, expected] of [["scenario", scenario], ["language", language], ["seed", seed]]) {
    if (String(entryState[field] ?? "") !== expected) throw new Error(`${requirementId}.entryState.${field} differs from the requirement`);
  }
  const rootEntryFrame = requirePositiveInteger(entryState.rootEntryFrame, `${requirementId}.entryState.rootEntryFrame`);
  if (entryState.frameDomainId !== undefined && entryState.frameDomainId !== frameDomainId) {
    throw new Error(`${requirementId}.entryState.frameDomainId differs from the requirement`);
  }
  const selection = normalizeRequirementSelection(requirement, domain.frameCount);
  const frameList = [...selection.selectedPhysicalFrames];
  const coverageGroupId = selection.requirementSchemaVersion === 1
    ? `legacy-singleton:${requirementId}`
    : selection.coverageGroupId;
  return {
    animationId,
    requirementId,
    outputName: safeRequirementId(requirementId),
    locale: language,
    language,
    scenario,
    seed,
    traceId,
    entryStateSha256,
    rootEntryFrame,
    frameDomainId,
    domainFrameCount: domain.frameCount,
    frameCount: frameList.length,
    frameList,
    requirementSchemaVersion: selection.requirementSchemaVersion,
    coverageRole: selection.coverageRole,
    coverageGroupId,
    selectionKind: selection.selectionKind,
    selectionSha256: selection.selectionSha256,
    requiredUniverse: selection.requiredUniverse,
    selectedPhysicalFrames: frameList,
    url: localeUrl(baseUrl, route, language),
  };
}

function validateRequirementSelection(requested, requirements) {
  const available = new Map(requirements.map((requirement) => [requirement.requirementId, requirement]));
  if (!requested.length) return requirements;
  const seen = new Set();
  const selected = [];
  for (const requirementId of requested) {
    requireStableId(requirementId, "--requirement");
    if (seen.has(requirementId)) throw new Error(`--requirement ${requirementId} was specified more than once`);
    const requirement = available.get(requirementId);
    if (!requirement) throw new Error(`Unknown coverage requirement: ${requirementId}`);
    seen.add(requirementId);
    selected.push(requirement);
  }
  return requirements.filter((requirement) => seen.has(requirement.requirementId));
}

function validateCoverageCompleteness(domains, requirements) {
  const expected = new Set();
  for (const [frameDomainId, domain] of domains) {
    for (const scenario of domain.scenarioIds) {
      for (const language of SUPPORTED_LANGUAGES) {
        expected.add(`${frameDomainId}\0${scenario}\0${language}`);
      }
    }
  }
  const observed = new Set();
  const observedLegacySingletons = new Set();
  for (const requirement of requirements) {
    const key = `${requirement.frameDomainId}\0${requirement.scenario}\0${requirement.language}`;
    if (requirement.requirementSchemaVersion === 1 && observedLegacySingletons.has(key)) {
      throw new Error(`full-frame-coverage.json contains duplicate domain/scenario/language identity ${key.replaceAll("\0", "/")}`);
    }
    if (requirement.requirementSchemaVersion === 1) observedLegacySingletons.add(key);
    observed.add(key);
  }
  const missing = [...expected].filter((key) => !observed.has(key));
  const unexpected = [...observed].filter((key) => !expected.has(key));
  if (missing.length || unexpected.length) {
    const details = [
      ...missing.map((key) => `missing ${key.replaceAll("\0", "/")}`),
      ...unexpected.map((key) => `unexpected ${key.replaceAll("\0", "/")}`),
    ];
    throw new Error(`full-frame-coverage.json does not enumerate every declared domain/scenario/language requirement: ${details.join("; ")}`);
  }
}

function selectionBinding(requirement) {
  return {
    requirementSchemaVersion: requirement.requirementSchemaVersion,
    coverageRole: requirement.coverageRole,
    coverageGroupId: requirement.coverageGroupId,
    selectionKind: requirement.selectionKind,
    selectionSha256: requirement.selectionSha256,
    requiredUniverse: requirement.requiredUniverse,
    selectedPhysicalFrames: [...requirement.selectedPhysicalFrames],
  };
}

function frameSelectionSummary(requirement) {
  const frames = requirement.selectedPhysicalFrames;
  if (frames.length === requirement.domainFrameCount) return `frames 1..${requirement.domainFrameCount}`;
  if (frames.every((frame, index) => index === 0 || frame === frames[index - 1] + 1)) {
    return `frames ${frames[0]}..${frames.at(-1)} of 1..${requirement.domainFrameCount}`;
  }
  return `${frames.length} selected frame(s) of 1..${requirement.domainFrameCount}`;
}

function resolveOutputRoot(projectRoot, animationId, declared) {
  const raw = declared || `${OUTPUT_BASE_PROJECT_PATH}/coverage-v2/${animationId}`;
  rejectTraversalSpelling(raw, "--output-root");
  const outputBase = path.resolve(projectRoot, OUTPUT_BASE_PROJECT_PATH);
  const outputRoot = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(projectRoot, raw);
  if (outputRoot === outputBase || !isInside(outputRoot, outputBase)) {
    throw new Error("--output-root must be a child of output/playwright");
  }
  return {outputBase, outputRoot};
}

async function inspectFreshOutputPlan(projectRoot, outputBase, outputRoot, requirements) {
  await assertNoSymlinkComponents(projectRoot, outputBase, "output base");
  await assertNoSymlinkComponents(projectRoot, outputRoot, "output root");
  const outputInfo = await lstatIfPresent(outputRoot);
  if (!outputInfo) return;
  if (!outputInfo.isDirectory() || outputInfo.isSymbolicLink()) throw new Error("output root must be a real directory");
  const allowed = new Set(requirements.map((requirement) => requirement.outputName));
  for (const entry of await readdir(outputRoot, {withFileTypes: true})) {
    const candidate = path.join(outputRoot, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`output root contains forbidden symbolic link ${entry.name}`);
    if (!allowed.has(entry.name)) throw new Error(`output root is not fresh; unexpected existing entry ${entry.name}`);
    if (!entry.isDirectory()) throw new Error(`existing requirement output ${entry.name} is not a directory`);
    const children = await readdir(candidate);
    if (children.length) throw new Error(`existing requirement output ${entry.name} is nonempty`);
  }
}

async function ensureSafeDirectoryTree(projectRoot, target, label) {
  await assertNoSymlinkComponents(projectRoot, target, label);
  let current = path.resolve(projectRoot);
  for (const component of path.relative(projectRoot, target).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    const existing = await lstatIfPresent(current);
    if (!existing) {
      try {
        await mkdir(current, {mode: 0o755});
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    }
    const confirmed = await lstat(current);
    if (!confirmed.isDirectory() || confirmed.isSymbolicLink()) {
      throw new Error(`${label} component is not a real directory: ${portable(path.relative(projectRoot, current))}`);
    }
  }
}

async function ensureEmptyRequirementDirectory(projectRoot, directory, label) {
  await ensureSafeDirectoryTree(projectRoot, directory, label);
  const entries = await readdir(directory);
  if (entries.length) throw new Error(`${label} became nonempty before capture`);
}

function captureOptions(plan, requirement, output) {
  return {
    id: plan.animationId,
    projectRoot: plan.projectRoot,
    url: requirement.url,
    frameList: [...requirement.frameList],
    output,
    selector: '[data-capture-stage="true"]',
    frameParam: plan.captureContract.frameParameter,
    frameDomain: requirement.frameDomainId,
    frameDomainParam: plan.captureContract.frameDomainParameter,
    requirementId: requirement.requirementId,
    requirementIdParam: plan.captureContract.requirementIdParameter,
    trace: requirement.traceId,
    traceParam: plan.captureContract.traceParameter,
    entryStateSha256: requirement.entryStateSha256,
    entryStateSha256Param: plan.captureContract.entryStateSha256Parameter,
    scenario: requirement.scenario,
    scenarioParam: plan.captureContract.scenarioParameter,
    lang: requirement.language,
    langParam: plan.captureContract.languageParameter,
    seed: requirement.seed,
    seedParam: plan.captureContract.seedParameter,
    width: plan.viewport.width,
    height: plan.viewport.height,
    deviceScale: plan.viewport.deviceScaleFactor,
  };
}

function assertCaptureIdentity(capture, requirement, plan, label) {
  const expected = {
    animationId: plan.animationId,
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    const observed = field === "seed" ? String(capture?.[field]) : capture?.[field];
    if (observed !== expectedValue) throw new Error(`${label}.${field} differs from the planned coverage identity`);
  }
}

function expectedCaptureAttributes() {
  return {
    reportedAnimationIdAttribute: "data-animation-id",
    reportedFrameAttribute: "data-flash-frame",
    reportedFrameDomainAttribute: "data-flash-frame-domain",
    reportedRequirementIdAttribute: "data-flash-requirement-id",
    reportedTraceAttribute: "data-flash-trace-id",
    reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
    reportedFlashScenarioAttribute: "data-flash-scenario",
    reportedFlashLanguageAttribute: "data-flash-lang",
    reportedFlashSeedAttribute: "data-flash-seed",
    reportedScenarioAttribute: "data-runtime-scenario",
    reportedLanguageAttribute: "data-runtime-language",
    reportedSeedAttribute: "data-runtime-seed",
    flashContextIdentityComplete: true,
    captureStageAttribute: "data-capture-stage",
    reportedRenderStateAttribute: "data-render-state",
    reportedVisualTargetAttribute: "data-render-visual",
    requiredRenderState: "ready",
  };
}

function expectedQueryParameters(captureContract) {
  return {
    frame: captureContract.frameParameter,
    frameDomain: captureContract.frameDomainParameter,
    requirementId: captureContract.requirementIdParameter,
    trace: captureContract.traceParameter,
    entryStateSha256: captureContract.entryStateSha256Parameter,
    scenario: captureContract.scenarioParameter,
    language: captureContract.languageParameter,
    seed: captureContract.seedParameter,
  };
}

function assertExactCaptureUrl(value, requirement, plan, frame, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  const source = new URL(requirement.url);
  if (
    !isUnambiguousLoopbackHttpUrl(parsed.href)
    || parsed.origin !== source.origin
    || parsed.pathname !== source.pathname
    || parsed.hash
  ) throw new Error(`${label} differs from the planned credential-free loopback locale route`);
  const queryNames = expectedQueryParameters(plan.captureContract);
  const expected = new Map([
    [queryNames.frame, String(frame)],
    [queryNames.frameDomain, requirement.frameDomainId],
    [queryNames.requirementId, requirement.requirementId],
    [queryNames.trace, requirement.traceId],
    [queryNames.entryStateSha256, requirement.entryStateSha256],
    [queryNames.scenario, requirement.scenario],
    [queryNames.language, requirement.language],
    [queryNames.seed, requirement.seed],
    ["capture", "1"],
  ]);
  if (new Set(parsed.searchParams.keys()).size !== expected.size) throw new Error(`${label} has unexpected or duplicate query parameters`);
  for (const [name, expectedValue] of expected) {
    const values = parsed.searchParams.getAll(name);
    if (values.length !== 1 || values[0] !== expectedValue) throw new Error(`${label} query parameter ${name} differs from the coverage identity`);
  }
}

async function inspectCaptureOutput(projectRoot, outputDirectory, requirement, plan) {
  await assertNoSymlinkComponents(projectRoot, outputDirectory, `${requirement.requirementId} output`);
  const outputInfo = await lstat(outputDirectory);
  if (!outputInfo.isDirectory() || outputInfo.isSymbolicLink()) {
    throw new Error(`${requirement.requirementId} output is not a real directory`);
  }
  const entries = await readdir(outputDirectory, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.isSymbolicLink() || !entry.isFile()) {
      throw new Error(`${requirement.requirementId} output contains non-regular entry ${entry.name}`);
    }
  }
  const manifestPath = path.join(outputDirectory, "capture-manifest.json");
  const manifestRecord = await readBoundJson(projectRoot, manifestPath, `${requirement.requirementId} capture manifest`);
  const capture = manifestRecord.value;
  if (capture.schemaVersion !== IMPLEMENTATION_CAPTURE_SCHEMA_VERSION || capture.status !== "complete") {
    throw new Error(`${requirement.requirementId} capture must be complete schemaVersion ${IMPLEMENTATION_CAPTURE_SCHEMA_VERSION}`);
  }
  const generatorErrors = implementationCaptureGeneratorProvenanceErrors(capture.generatorProvenance);
  if (generatorErrors.length) {
    throw new Error(`${requirement.requirementId} capture generator provenance is invalid: ${generatorErrors.join("; ")}`);
  }
  const closureErrors = implementationArtifactClosureErrors(capture.implementationArtifactClosure);
  if (closureErrors.length) {
    throw new Error(`${requirement.requirementId} implementation artifact closure is invalid: ${closureErrors.join("; ")}`);
  }
  assertCaptureIdentity(capture, requirement, plan, `${requirement.requirementId} capture`);
  if (capture.requestedFrameDomain !== requirement.frameDomainId) {
    throw new Error(`${requirement.requirementId} requestedFrameDomain differs from the plan`);
  }
  if (capture.sourceUrl !== requirement.url) throw new Error(`${requirement.requirementId} sourceUrl differs from the locale route plan`);
  if (capture.selector !== '[data-capture-stage="true"]') {
    throw new Error(`${requirement.requirementId} capture selector differs from the strict stage selector`);
  }
  for (const [field, expected] of Object.entries(expectedCaptureAttributes())) {
    if (capture[field] !== expected) throw new Error(`${requirement.requirementId}.${field} must be ${expected}`);
  }
  if (canonicalJson(capture.queryParameters) !== canonicalJson(expectedQueryParameters(plan.captureContract))) {
    throw new Error(`${requirement.requirementId} capture queryParameters differ from migration.captureContract`);
  }
  if (
    capture.viewport?.width !== plan.viewport.width
    || capture.viewport?.height !== plan.viewport.height
    || capture.viewport?.deviceScaleFactor !== 1
  ) throw new Error(`${requirement.requirementId} capture viewport differs from the native stage`);
  for (const field of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    if (!Array.isArray(capture[field]) || capture[field].length) {
      throw new Error(`${requirement.requirementId}.${field} must be an empty array`);
    }
  }
  if (capture.error !== null) throw new Error(`${requirement.requirementId} capture reports an error`);
  if (!capture.generatorProvenance || typeof capture.generatorProvenance !== "object") {
    throw new Error(`${requirement.requirementId} capture is missing generator provenance`);
  }
  if (!capture.implementationArtifactClosure || typeof capture.implementationArtifactClosure !== "object") {
    throw new Error(`${requirement.requirementId} capture is missing the implementation artifact closure`);
  }
  if (!Array.isArray(capture.captured) || capture.captured.length !== requirement.frameList.length) {
    throw new Error(`${requirement.requirementId} capture does not contain exactly ${requirement.frameCount} frames`);
  }
  const expectedNames = new Set(["capture-manifest.json"]);
  const frameRows = [];
  for (let index = 0; index < capture.captured.length; index += 1) {
    const frame = requirement.frameList[index];
    const record = capture.captured[index];
    if (record.frame !== frame || record.reportedFrame !== frame) {
      throw new Error(`${requirement.requirementId} capture frame ${index} does not report exact frame ${frame}`);
    }
    assertCaptureIdentity({
      animationId: record.reportedAnimationId,
      requirementId: record.requirementId,
      frameDomainId: record.frameDomainId,
      traceId: record.traceId,
      entryStateSha256: record.entryStateSha256,
      scenario: record.scenario,
      language: record.language,
      seed: record.seed,
    }, requirement, plan, `${requirement.requirementId} frame ${frame}`);
    if (record.reportedRenderState !== "ready") {
      throw new Error(`${requirement.requirementId} frame ${frame} is not renderer-ready`);
    }
    if (record.flashContextIdentityComplete !== true) {
      throw new Error(`${requirement.requirementId} frame ${frame} lacks complete data-flash context identity`);
    }
    if (
      record.animationId !== plan.animationId
      || record.frameDomain !== requirement.frameDomainId
      || record.reportedFrameDomainId !== requirement.frameDomainId
    ) throw new Error(`${requirement.requirementId} frame ${frame} has inconsistent reported renderer identity`);
    const expectedRootFrame = requirement.frameDomainId === "root" ? frame : requirement.rootEntryFrame;
    if (record.rootFrame !== expectedRootFrame) {
      throw new Error(`${requirement.requirementId} frame ${frame} rootFrame differs from the declared entry state`);
    }
    const visual = record.visualTarget;
    assertCaptureIdentity({
      animationId: visual?.animationId,
      requirementId: visual?.requirementId,
      frameDomainId: visual?.frameDomainId,
      traceId: visual?.traceId,
      entryStateSha256: visual?.entryStateSha256,
      scenario: visual?.scenario,
      language: visual?.language,
      seed: visual?.seed,
    }, requirement, plan, `${requirement.requirementId} frame ${frame} visualTarget`);
    if (
      typeof visual.tagName !== "string"
      || !visual.tagName.trim()
      || visual.reportedRenderState !== "ready"
      || visual.flashContextIdentityComplete !== true
      || visual.reportedFrame !== frame
      || visual.rootFrame !== expectedRootFrame
    ) throw new Error(`${requirement.requirementId} frame ${frame} visualTarget is not exact and renderer-ready`);
    assertExactCaptureUrl(record.url, requirement, plan, frame, `${requirement.requirementId} frame ${frame} URL`);
    if (
      typeof record.file !== "string"
      || path.basename(record.file) !== record.file
      || !record.file.endsWith(".png")
      || expectedNames.has(record.file)
    ) throw new Error(`${requirement.requirementId} frame ${frame} has an unsafe or duplicate PNG filename`);
    expectedNames.add(record.file);
    const framePath = path.join(outputDirectory, record.file);
    const info = await lstat(framePath);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
      throw new Error(`${requirement.requirementId} frame ${frame} PNG must be a new regular file`);
    }
    const bytes = await readFile(framePath);
    if (sha256(bytes) !== record.sha256) throw new Error(`${requirement.requirementId} frame ${frame} PNG SHA-256 differs from the capture manifest`);
    let png;
    try {
      png = PNG.sync.read(bytes);
    } catch (error) {
      throw new Error(`${requirement.requirementId} frame ${frame} PNG is invalid (${error.message})`);
    }
    if (
      png.width !== plan.viewport.width
      || png.height !== plan.viewport.height
      || record.width !== plan.viewport.width
      || record.height !== plan.viewport.height
    ) throw new Error(`${requirement.requirementId} frame ${frame} PNG is not native-stage size`);
    frameRows.push({
      path: portable(path.relative(projectRoot, framePath)),
      bytes: bytes.length,
      sha256: record.sha256,
    });
  }
  if (entries.length !== expectedNames.size || entries.some((entry) => !expectedNames.has(entry.name))) {
    throw new Error(`${requirement.requirementId} output contains unexpected or missing files`);
  }
  const canonicalRows = [...frameRows].sort((left, right) => left.path.localeCompare(right.path));
  return {
    requirementId: requirement.requirementId,
    locale: requirement.locale,
    language: requirement.language,
    scenario: requirement.scenario,
    seed: requirement.seed,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    frameDomainId: requirement.frameDomainId,
    frameCount: requirement.frameCount,
    domainFrameCount: requirement.domainFrameCount,
    ...selectionBinding(requirement),
    directory: portable(path.relative(projectRoot, outputDirectory)),
    captureManifest: manifestRecord.descriptor,
    frameArchive: {
      fileCount: canonicalRows.length,
      totalBytes: canonicalRows.reduce((sum, row) => sum + row.bytes, 0),
      aggregateSha256: sha256(Buffer.from(canonicalJson(canonicalRows))),
    },
    captureGeneratorProvenance: capture.generatorProvenance,
    captureImplementationArtifactClosure: capture.implementationArtifactClosure,
  };
}

async function writeExclusive(candidate, bytes) {
  const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW || 0);
  const handle = await open(candidate, flags, 0o644);
  let complete = false;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    complete = true;
  } finally {
    await handle.close();
    if (!complete) await unlink(candidate).catch(() => {});
  }
}

export async function buildCoverageV2CapturePlan(options) {
  if (options.help) return {help: true};
  const animationId = requireAnimationId(options.id);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const projectRoot = await realpath(path.resolve(options.projectRoot || DEFAULT_PROJECT_ROOT));
  const projectInfo = await lstat(projectRoot);
  if (!projectInfo.isDirectory() || projectInfo.isSymbolicLink()) throw new Error("project root must be a real directory");
  const workspace = path.join(projectRoot, "migrations", animationId);
  const migrationPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, COVERAGE_PROJECT_PATH);
  const [migrationRecord, coverageRecord, generatorProvenance] = await Promise.all([
    readBoundJson(projectRoot, migrationPath, "migration.json"),
    readBoundJson(projectRoot, coveragePath, "full-frame-coverage.json"),
    collectGeneratorProvenance(),
  ]);
  const manifest = migrationRecord.value;
  const coverage = coverageRecord.value;
  if (manifest.animationId !== animationId) throw new Error("migration.json animationId differs from --id");
  if (coverage.schemaVersion !== 2 || coverage.animationId !== animationId || !Array.isArray(coverage.requirements) || !coverage.requirements.length) {
    throw new Error("full-frame-coverage.json must be nonempty schemaVersion 2 evidence for --id");
  }
  const stage = manifest?.runtime?.stage;
  const viewport = {
    width: requirePositiveInteger(stage?.width, "migration.runtime.stage.width"),
    height: requirePositiveInteger(stage?.height, "migration.runtime.stage.height"),
    deviceScaleFactor: 1,
  };
  const route = validateRoute(manifest?.implementation?.route, animationId);
  const captureContract = validateCaptureContract(manifest?.implementation?.captureContract);
  const domains = validateDomains(manifest);
  const frameCountsByDomain = Object.fromEntries(
    [...domains.entries()].map(([frameDomainId, domain]) => [frameDomainId, domain.frameCount]),
  );
  validateRequirementCoverageGroups(coverage.requirements, frameCountsByDomain);
  const requirements = coverage.requirements.map((requirement, index) =>
    validateRequirement(requirement, index, domains, animationId, baseUrl, route));
  const ids = requirements.map((requirement) => requirement.requirementId);
  if (new Set(ids).size !== ids.length) throw new Error("full-frame-coverage.json contains duplicate requirementId values");
  const outputNames = requirements.map((requirement) => requirement.outputName);
  if (new Set(outputNames).size !== outputNames.length) {
    throw new Error("coverage requirement IDs collide after safe output-name normalization");
  }
  validateCoverageCompleteness(domains, requirements);
  const selected = validateRequirementSelection(options.requirements || [], requirements);
  const {outputBase, outputRoot} = resolveOutputRoot(projectRoot, animationId, options.outputRoot);
  await inspectFreshOutputPlan(projectRoot, outputBase, outputRoot, selected);
  return {
    schemaVersion: 2,
    evidenceType: "coverage-v2-current-javascript-capture-plan",
    animationId,
    projectRoot,
    workspace,
    baseUrl,
    route,
    viewport,
    captureContract,
    inputs: {
      migration: migrationRecord.descriptor,
      coverage: coverageRecord.descriptor,
      migrationTechnicalContract: {
        hashMode: "canonical-json-v1",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        sha256: technicalManifestSha256(manifest),
      },
      traceCoverageIdentity: {
        hashMode: "canonical-json-v1",
        projection: TRACE_COVERAGE_PROJECTION.id,
        sha256: traceCoverageSha256(coverage),
      },
    },
    generatorProvenance,
    outputBase,
    outputRoot,
    outputRootProjectPath: portable(path.relative(projectRoot, outputRoot)),
    selectedAllRequirements: selected.length === requirements.length,
    availableRequirementCount: requirements.length,
    selectedRequirementCount: selected.length,
    totalFrameCount: selected.reduce((sum, requirement) => sum + requirement.frameCount, 0),
    requirements: selected,
  };
}

function publicPlan(plan) {
  return {
    schemaVersion: plan.schemaVersion,
    evidenceType: plan.evidenceType,
    animationId: plan.animationId,
    baseUrl: plan.baseUrl,
    route: plan.route,
    viewport: plan.viewport,
    inputs: plan.inputs,
    outputRoot: plan.outputRootProjectPath,
    selectedAllRequirements: plan.selectedAllRequirements,
    availableRequirementCount: plan.availableRequirementCount,
    selectedRequirementCount: plan.selectedRequirementCount,
    totalFrameCount: plan.totalFrameCount,
    requirements: plan.requirements.map((requirement) => ({
      requirementId: requirement.requirementId,
      locale: requirement.locale,
      language: requirement.language,
      scenario: requirement.scenario,
      seed: requirement.seed,
      traceId: requirement.traceId,
      entryStateSha256: requirement.entryStateSha256,
      frameDomainId: requirement.frameDomainId,
      domainFrameCount: requirement.domainFrameCount,
      frameCount: requirement.frameCount,
      ...selectionBinding(requirement),
      url: requirement.url,
      output: portable(path.join(plan.outputRootProjectPath, requirement.outputName)),
    })),
  };
}

export async function captureCoverageV2Requirements(options, {
  capture = captureKeyframes,
  collectCurrentArtifactClosure = collectImplementationArtifactClosure,
  logger = (line) => console.log(line),
} = {}) {
  const plan = await buildCoverageV2CapturePlan(options);
  if (plan.help) return plan;
  if (options.check) {
    for (const [index, requirement] of plan.requirements.entries()) {
      logger(`[plan ${index + 1}/${plan.requirements.length}] ${requirement.requirementId}: ${frameSelectionSummary(requirement)}, locale/lang ${requirement.locale}/${requirement.language}`);
    }
    return {mode: "check", plan: publicPlan(plan)};
  }
  await ensureSafeDirectoryTree(plan.projectRoot, plan.outputBase, "output base");
  await ensureSafeDirectoryTree(plan.projectRoot, plan.outputRoot, "output root");
  const outputs = [];
  let commonCaptureGeneratorProvenance = null;
  let commonImplementationArtifactClosure = null;
  let commonImplementationArtifactClosureValue = null;
  for (const [index, requirement] of plan.requirements.entries()) {
    const outputDirectory = path.join(plan.outputRoot, requirement.outputName);
    await ensureEmptyRequirementDirectory(plan.projectRoot, outputDirectory, `${requirement.requirementId} output`);
    logger(`[capture ${index + 1}/${plan.requirements.length}] ${requirement.requirementId}: ${frameSelectionSummary(requirement)}, locale/lang ${requirement.locale}/${requirement.language}`);
    await capture(captureOptions(plan, requirement, outputDirectory));
    const inspected = await inspectCaptureOutput(plan.projectRoot, outputDirectory, requirement, plan);
    const serializedGenerator = canonicalJson(inspected.captureGeneratorProvenance);
    if (commonCaptureGeneratorProvenance === null) commonCaptureGeneratorProvenance = serializedGenerator;
    else if (serializedGenerator !== commonCaptureGeneratorProvenance) {
      throw new Error("capture generator provenance differs between requirement outputs");
    }
    const serializedClosure = canonicalJson(inspected.captureImplementationArtifactClosure);
    if (commonImplementationArtifactClosure === null) {
      commonImplementationArtifactClosure = serializedClosure;
      commonImplementationArtifactClosureValue = inspected.captureImplementationArtifactClosure;
    }
    else if (serializedClosure !== commonImplementationArtifactClosure) {
      throw new Error("implementation artifact closure differs between requirement outputs");
    }
    const descriptor = {...inspected};
    delete descriptor.captureGeneratorProvenance;
    delete descriptor.captureImplementationArtifactClosure;
    outputs.push(descriptor);
    logger(`[captured ${index + 1}/${plan.requirements.length}] ${requirement.requirementId}: ${descriptor.frameCount} native-stage PNGs`);
  }
  const [migrationAfter, coverageAfter, generatorAfter] = await Promise.all([
    readBoundJson(plan.projectRoot, path.join(plan.projectRoot, plan.inputs.migration.path), "migration.json after capture"),
    readBoundJson(plan.projectRoot, path.join(plan.projectRoot, plan.inputs.coverage.path), "full-frame-coverage.json after capture"),
    collectGeneratorProvenance(),
  ]);
  if (canonicalJson(migrationAfter.descriptor) !== canonicalJson(plan.inputs.migration)) {
    throw new Error("migration.json changed during capture orchestration");
  }
  if (canonicalJson(coverageAfter.descriptor) !== canonicalJson(plan.inputs.coverage)) {
    throw new Error("full-frame-coverage.json changed during capture orchestration");
  }
  if (canonicalJson(generatorAfter) !== canonicalJson(plan.generatorProvenance)) {
    throw new Error("capture orchestration generator changed during capture");
  }
  const currentImplementationArtifactClosure = await collectCurrentArtifactClosure({
    projectRoot: plan.projectRoot,
    workspace: plan.workspace,
    manifest: migrationAfter.value,
  });
  const finalClosureErrors = implementationArtifactClosureErrors(
    commonImplementationArtifactClosureValue,
    currentImplementationArtifactClosure,
  );
  if (finalClosureErrors.length) {
    throw new Error(`implementation artifact closure is stale after capture orchestration: ${finalClosureErrors.join("; ")}`);
  }
  for (const [index, requirement] of plan.requirements.entries()) {
    const outputDirectory = path.join(plan.outputRoot, requirement.outputName);
    const finalInspection = await inspectCaptureOutput(plan.projectRoot, outputDirectory, requirement, plan);
    if (canonicalJson(finalInspection.captureGeneratorProvenance) !== commonCaptureGeneratorProvenance) {
      throw new Error(`${requirement.requirementId} capture generator provenance changed before orchestration finalization`);
    }
    if (canonicalJson(finalInspection.captureImplementationArtifactClosure) !== commonImplementationArtifactClosure) {
      throw new Error(`${requirement.requirementId} implementation artifact closure changed before orchestration finalization`);
    }
    const finalDescriptor = {...finalInspection};
    delete finalDescriptor.captureGeneratorProvenance;
    delete finalDescriptor.captureImplementationArtifactClosure;
    if (canonicalJson(finalDescriptor) !== canonicalJson(outputs[index])) {
      throw new Error(`${requirement.requirementId} capture output changed before orchestration finalization`);
    }
  }
  const manifest = {
    schemaVersion: 2,
    evidenceType: "coverage-v2-current-javascript-capture-orchestration",
    status: ORCHESTRATION_STATUS,
    animationId: plan.animationId,
    authority: {
      currentJavascriptImplementationCaptureOnly: true,
      originalRuntimeBaseline: false,
      visualOrBehavioralParity: false,
      rmseAcceptance: false,
      audioAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      migrationCompletion: false,
    },
    generatorProvenance: plan.generatorProvenance,
    inputs: plan.inputs,
    application: {
      baseUrl: plan.baseUrl,
      route: plan.route,
      localeRouting: "explicit-en-or-es-prefix-matching-requirement-language",
    },
    viewport: plan.viewport,
    selection: {
      schemaVersion: 2,
      contract: "normalized-requirement-physical-frame-selection-v1",
      selectedAllRequirements: plan.selectedAllRequirements,
      availableRequirementCount: plan.availableRequirementCount,
      selectedRequirementCount: plan.selectedRequirementCount,
      requirementIds: plan.requirements.map((requirement) => requirement.requirementId),
      totalFrameCount: plan.totalFrameCount,
      requirements: plan.requirements.map((requirement) => ({
        requirementId: requirement.requirementId,
        frameDomainId: requirement.frameDomainId,
        scenario: requirement.scenario,
        language: requirement.language,
        seed: requirement.seed,
        entryStateSha256: requirement.entryStateSha256,
        ...selectionBinding(requirement),
      })),
    },
    outputs,
    notes: [
      "This manifest binds only deterministic current-JavaScript implementation capture outputs.",
      "It does not alter or satisfy original-runtime, RMSE, audio, human-review, owner-review, fidelity, or completion gates.",
    ],
  };
  const manifestPath = path.join(plan.outputRoot, ORCHESTRATION_MANIFEST_NAME);
  await assertNoSymlinkComponents(plan.projectRoot, manifestPath, "orchestration manifest");
  await writeExclusive(manifestPath, Buffer.from(jsonText(manifest)));
  const manifestBytes = await readFile(manifestPath);
  logger(`[orchestration complete] ${outputs.length} requirement(s), ${plan.totalFrameCount} frame(s), ${portable(path.relative(plan.projectRoot, manifestPath))}`);
  return {
    mode: "capture",
    manifest,
    manifestPath,
    manifestDescriptor: {
      path: portable(path.relative(plan.projectRoot, manifestPath)),
      bytes: manifestBytes.length,
      sha256: sha256(manifestBytes),
    },
  };
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const result = await captureCoverageV2Requirements(options, options.json ? {
      logger: (line) => console.error(line),
    } : undefined);
    if (options.json) console.log(JSON.stringify(result.mode === "check" ? result.plan : {
      mode: result.mode,
      manifest: result.manifestDescriptor,
      selection: result.manifest.selection,
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
