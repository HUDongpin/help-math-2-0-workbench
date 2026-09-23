#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, readdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  CANONICAL_PROJECTION_ENCODING,
  FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  fqAudioSourceStructureSha256,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";

export const COURSE_SHELL_PILOT_IDS = Object.freeze([
  "course-g03-l01-ts-008",
  "course-g03-l01-vb-004",
  "course-g03-l06-fq-002-review",
  "course-g03-l06-ti-001",
  "course-g03-l08-re-001",
  "course-g04-l01-ir-001",
  "course-g04-l03-in-009",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
  "shell-course-g04-l01-index-local",
]);

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256 = /^[a-f0-9]{64}$/i;
const ROOT_PREFIXES = /^(?:apps|artifacts|catalog|components|docs|lib|migrations|output|outputs|packages|public|reports|schemas|scripts|skills|source-assets|templates|work)\//;
const WORKSPACE_PREFIXES = /^(?:audit|baseline|evidence)\//;
const CANDIDATE_QA_ARTIFACT = /^evidence\/(?:[^/]*(?:candidate|product)[^/]*qa[^/]*|keyterm-engineering-qa)\.json$/i;
const FILE_EXTENSION = /\.(?:as|css|fla|html?|jpe?g|js|json|log|mjs|mp3|png|svg|swf|ts|tsx|txt|xml|ya?ml)$/i;
const CANDIDATE_FILE_KEYS = new Set([
  "asset",
  "component",
  "file",
  "fla",
  "manifest",
  "module",
  "mp3",
  "renderer",
  "script",
  "swf",
  "test",
  "timeline",
  "xml",
]);

const CANDIDATE_QA_DEPENDENCY_TYPES = Object.freeze([
  "candidate-source-asset",
  "candidate-runtime-manifest",
  "candidate-public-asset",
  "candidate-renderer-module",
  "candidate-timeline-module",
  "candidate-test-module",
  "candidate-evidence-artifact",
  "candidate-implementation-artifact",
]);

const DEPENDENCY_TARGETS = Object.freeze({
  "migration.json": "migration-manifest",
  "audio-runtime-evidence.json": "audio-runtime-evidence",
  "scenario-inventory.json": "scenario-inventory",
  "strict-readiness.json": "strict-readiness",
  "static-frame-domain-disposition-evidence.json": "static-frame-domain-disposition-evidence",
  "frame-domain-disposition.json": "frame-domain-disposition",
  "full-frame-coverage.json": "full-frame-coverage",
});

const PROJECTION_TARGETS = Object.freeze({
  [TECHNICAL_MANIFEST_PROJECTION.id]: Object.freeze({
    type: "migration-technical-contract",
    sourceType: "migration-manifest",
    excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
    includedPaths: [],
    digest: technicalManifestSha256,
  }),
  [TRACE_COVERAGE_PROJECTION.id]: Object.freeze({
    type: "trace-coverage-identity",
    sourceType: "full-frame-coverage",
    excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
    includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
    digest: traceCoverageSha256,
  }),
  [SCENARIO_INVENTORY_PROJECTION.id]: Object.freeze({
    type: "scenario-inventory-technical",
    sourceType: "scenario-inventory",
    excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
    includedPaths: [],
    digest: scenarioInventorySha256,
  }),
  [FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.id]: Object.freeze({
    type: "fq-audio-source-structure",
    sourceType: "scenario-inventory",
    excludedPaths: FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.excludedPaths,
    includedPaths: FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.includedPaths,
    digest: fqAudioSourceStructureSha256,
  }),
});

// This registry describes producers, not consumers. A script which merely reads
// an artifact is deliberately not listed as its generator.
const GENERATOR_REGISTRY = Object.freeze([
  {pattern: /^audit\/strict-readiness\.json$/, script: "scripts/build-course-strict-readiness.mjs", deterministic: true},
  {pattern: /^audit\/scenario-inventory\.json$/, script: "scripts/build-course-scenario-inventories.mjs", deterministic: true},
  {pattern: /^audit\/static-frame-domain-disposition-evidence\.json$/, script: "scripts/build-static-frame-domain-disposition-evidence.mjs", deterministic: true},
  {pattern: /^audit\/frame-domain-disposition\.json$/, script: "scripts/build-frame-domain-dispositions.mjs", deterministic: true},
  {pattern: /^evidence\/full-frame-coverage\.json$/, script: "scripts/sync-pilot-frame-domains.mjs", deterministic: true},
  {pattern: /^evidence\/verification\.json$/, script: "scripts/refresh-pilot-verification.mjs", deterministic: false},
  {pattern: /^audit\/audio-runtime-evidence\.json$/, script: "scripts/audit-pilot-audio.mjs", deterministic: true},
  {pattern: /^audit\/adobe-course-frame-controller-(?:spec|engineering-report)\.json$/, script: "scripts/build-adobe-course-frame-controller-fixtures.mjs", deterministic: true},
  {pattern: /^audit\/renderer-frame-domain-support\.json$/, script: "scripts/build-renderer-frame-domain-support.mjs", deterministic: true},
  {pattern: /^evidence\/current-javascript-implementation-capture-adoption\.json$/, script: "scripts/adopt-course-implementation-captures.mjs", deterministic: true},
  {pattern: /^baseline\/original-runtime\/[^/]+\.json$/, script: "scripts/adopt-course-original-runtime-evidence.mjs", deterministic: true, disabled: true},
  {pattern: /^baseline\/trace-executions\/[^/]+\.json$/, script: "scripts/adopt-course-original-runtime-evidence.mjs", deterministic: true, disabled: true},
  {pattern: /^evidence\/original-runtime-promotions\/[^/]+\.json$/, script: "scripts/adopt-course-original-runtime-evidence.mjs", deterministic: true, disabled: true},
  {pattern: /^audit\/extracted-audio-assets\.json$/, script: "scripts/extract-ti-soundstreams.mjs", deterministic: true},
]);

const SPECIAL_GENERATORS = Object.freeze({
  "course-g03-l01-ts-008/evidence/nextjs-native-candidate-qa.json": {script: "scripts/qa-course-candidates.mjs", deterministic: false},
  "course-g03-l01-vb-004/evidence/nextjs-native-candidate-qa.json": {script: "scripts/qa-vb-004-candidate.mjs", deterministic: false},
  "course-g03-l06-fq-002-review/evidence/nextjs-structural-candidate-qa.json": {script: "scripts/qa-course-candidates.mjs", deterministic: false},
  "course-g03-l06-ti-001/evidence/nextjs-native-candidate-qa.json": {script: "scripts/qa-course-candidates.mjs", deterministic: false},
  "course-g04-l09-gs-002/evidence/nextjs-native-candidate-qa.json": {script: "scripts/qa-course-candidates.mjs", deterministic: false},
  "course-g05-l13-rw-002/evidence/nextjs-structural-candidate-qa.json": {script: "scripts/qa-course-candidates.mjs", deterministic: false},
  "course-g05-l13-rw-002/evidence/source-routed-spanish-audio-product-qa.json": {script: "scripts/qa-rw002-source-routed-spanish-audio.mjs", deterministic: false},
  "course-g04-l01-ir-001/evidence/nextjs-native-candidate-qa.json": {script: "scripts/qa-ir-001-candidate.mjs", deterministic: false},
  "course-g04-l01-ir-001/evidence/nextjs-native-candidate-visual-evidence.json": {script: "scripts/build-ir-001-candidate-visual-evidence.mjs", deterministic: false},
  "course-g04-l03-in-009/evidence/native-canvas-candidate-qa.json": {script: "scripts/qa-in-009-canvas-candidate.mjs", deterministic: false},
});

// These scripts consume the tracked specifications below. They generate
// renderer/fixture outputs, not the specification itself, so treating them as
// producers would make a stale spec appear automatically repairable when it is
// not. The report exposes the distinction for manual-revalidation planning.
const CONSUMER_REGISTRY = Object.freeze([
  {pattern: /^audit\/canvas-adapter-spec\.json$/, script: "scripts/build-safe-ffdec-canvas-adapter.mjs", consumesAs: "input specification; writes spec.output.script and spec.output.manifest"},
  {pattern: /^audit\/animate-createjs-adapter-spec\.json$/, script: "scripts/build-safe-animate-createjs-adapter.mjs", consumesAs: "input specification; writes the configured safe CreateJS adapter directory"},
  {pattern: /^audit\/canvas-candidate-spec\.json$/, script: "scripts/build-in-009-ffdec-canvas-candidate.mjs", consumesAs: "input specification; writes spec.output.script and spec.output.manifest"},
  {pattern: /^audit\/adobe-frame-controller-spec\.json$/, script: "scripts/build-adobe-ti-frame-controller-fixture.mjs", consumesAs: "tracked input specification; writes a materialized work fixture and adobe-frame-controller-engineering-report.json"},
]);

const CASCADE = Object.freeze([
  {order: 1, command: "node scripts/build-course-strict-readiness.mjs", produces: ["audit/strict-readiness.json"], reason: "Readiness is an upstream input to scenario inventory."},
  {order: 2, command: "node scripts/build-course-scenario-inventories.mjs", produces: ["audit/scenario-inventory.json"], reason: "Inventory binds current readiness and manifest evidence."},
  {order: 3, command: "node scripts/sync-pilot-frame-domains.mjs", produces: ["migration.json", "evidence/full-frame-coverage.json"], reason: "Frame-domain sync changes the manifest and coverage together and refreshes their inventory pins."},
  {order: 4, command: "node scripts/build-static-frame-domain-disposition-evidence.mjs", produces: ["audit/static-frame-domain-disposition-evidence.json"], reason: "Reviewed static composite evidence is rebuilt from the stabilized manifest, inventory, swfmill, and FFDec scripts before disposition consumes it."},
  {order: 5, command: "node scripts/build-frame-domain-dispositions.mjs", produces: ["audit/frame-domain-disposition.json"], reason: "Disposition consumes the stabilized manifest, inventory, and any verified static composite evidence."},
  {order: 6, command: "node scripts/build-course-trace-specs.mjs", produces: ["audit/trace-specs/*.json"], reason: "Trace specifications consume stabilized coverage and inventory."},
  {order: 7, command: "node scripts/build-adobe-course-frame-controller-fixtures.mjs", produces: ["audit/adobe-course-frame-controller-spec.json", "audit/adobe-course-frame-controller-engineering-report.json"], reason: "Controller artifacts pin readiness and scenario inventory."},
  {order: 8, command: "node scripts/build-renderer-frame-domain-support.mjs, then rerun each artifact-specific candidate/QA generator; manually revalidate artifacts reported withoutGenerator", produces: ["renderer support plus candidate and QA evidence"], reason: "Downstream evidence must bind the final upstream hashes; no-generator records require explicit revalidation, not hash editing."},
  {order: 9, command: "node scripts/refresh-pilot-verification.mjs", produces: ["evidence/verification.json"], reason: "Strict command verification is last because it binds the final migration manifest and command outputs."},
  {order: 10, command: "node scripts/audit-course-evidence-dependencies.mjs --check", produces: ["dependency audit result"], reason: "The final fail-closed check must observe zero stale, missing, unpinned, or ambiguous dependencies."},
]);

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function jsonPointer(parts) {
  if (!parts.length) return "";
  return `/${parts.map((part) => String(part).replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`;
}

function targetType(value) {
  const basename = path.posix.basename(String(value).replaceAll("\\", "/"));
  return DEPENDENCY_TARGETS[basename] || null;
}

function semanticHashKeys(key, type) {
  const keys = [];
  if (key === "path" || key === "file") keys.push("sha256");
  keys.push(`${key}Sha256`);
  if (key.endsWith("Path")) keys.push(`${key.slice(0, -4)}Sha256`, `${key}Sha256`);
  if (type === "migration-manifest") keys.push("migrationManifestSha256", "expectedSha256FromScenarioInventory");
  if (type === "scenario-inventory") keys.push("scenarioInventorySha256", "inventorySha256");
  if (type === "strict-readiness") keys.push("strictReadinessSha256", "readinessSha256");
  if (type === "static-frame-domain-disposition-evidence") keys.push("staticFrameDomainDispositionEvidenceSha256", "staticDispositionEvidenceSha256", "evidenceSha256");
  if (type === "frame-domain-disposition") keys.push("frameDomainDispositionSha256", "dispositionSha256");
  if (type === "full-frame-coverage") keys.push("fullFrameCoverageSha256", "coverageSha256");
  return [...new Set(keys)];
}

function findDeclaredHash(object, key, type) {
  const candidates = semanticHashKeys(key, type)
    .filter((candidate) => typeof object[candidate] === "string" && SHA256.test(object[candidate]))
    .map((candidate) => ({key: candidate, value: object[candidate].toLowerCase()}));
  if (candidates.length === 1) return {...candidates[0], ambiguous: false};
  if (candidates.length > 1) {
    const distinct = [...new Set(candidates.map(({value}) => value))];
    if (distinct.length === 1) return {...candidates[0], ambiguous: false};
    return {key: candidates.map(({key: candidate}) => candidate).join(","), value: null, ambiguous: true};
  }
  return {key: null, value: null, ambiguous: false};
}

function looksLikeCandidateFileReference(key, value) {
  if (typeof value !== "string" || !value || value.startsWith("/") || /^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return false;
  const normalized = value.replaceAll("\\", "/");
  const keyLooksFileLike = CANDIDATE_FILE_KEYS.has(key)
    || /(?:Asset|Component|File|Manifest|Module|Path|Renderer|Script|Test|Timeline)$/i.test(key);
  return keyLooksFileLike
    && (ROOT_PREFIXES.test(normalized) || WORKSPACE_PREFIXES.test(normalized) || FILE_EXTENSION.test(normalized));
}

function candidateDependencyType(key, declaredPath, parts) {
  const normalized = declaredPath.replaceAll("\\", "/");
  const context = [...parts, key].map(String).join(".").toLowerCase();
  if (normalized.startsWith("source-assets/") || /(?:^|\.)(?:source|sources)(?:\.|$)/.test(context) || /\.(?:fla|mp3|swf|xml)$/i.test(normalized)) {
    return "candidate-source-asset";
  }
  if (/manifest/i.test(key) || /(?:^|\/)capture-manifest\.json$/i.test(normalized) || /(?:^|\/)manifest\.json$/i.test(normalized)) {
    return "candidate-runtime-manifest";
  }
  if (normalized.startsWith("public/")) return "candidate-public-asset";
  if (/timeline/i.test(key) || /\/timelines\//i.test(normalized)) return "candidate-timeline-module";
  if (/test/i.test(key) || /\/tests?\//i.test(normalized) || /\.test\.[cm]?[jt]sx?$/i.test(normalized)) return "candidate-test-module";
  if (/renderer|component|module/i.test(key) || /\/modules\//i.test(normalized)) return "candidate-renderer-module";
  if (/^(?:artifacts|output|outputs)\//.test(normalized) || WORKSPACE_PREFIXES.test(normalized) || normalized.startsWith("migrations/")) {
    return "candidate-evidence-artifact";
  }
  return "candidate-implementation-artifact";
}

function collectCandidateQaDependencies(value, parts = [], output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectCandidateQaDependencies(item, [...parts, index], output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    if (looksLikeCandidateFileReference(key, child) && !targetType(child)) {
      const hash = findDeclaredHash(value, key, "candidate-artifact-file");
      output.push({
        type: candidateDependencyType(key, child, parts),
        sourceType: "candidate-artifact-file",
        declaredPath: child,
        pathPointer: jsonPointer([...parts, key]),
        hashPointer: hash.key ? jsonPointer([...parts, hash.key]) : null,
        declaredSha256: hash.value,
        ambiguousHashPin: hash.ambiguous,
        projection: null,
        hashMode: "file-bytes-sha256",
        projectionDescriptorValid: true,
        implicit: false,
        candidateQaPin: true,
      });
    }
    collectCandidateQaDependencies(child, [...parts, key], output);
  }
  return output;
}

function resolveDependencyPath(projectRoot, workspace, declaredPath) {
  const normalized = String(declaredPath).replaceAll("\\", "/");
  if (path.isAbsolute(normalized)) return normalized;
  if (ROOT_PREFIXES.test(normalized)) return path.resolve(projectRoot, normalized);
  return path.resolve(workspace, normalized);
}

function collectExplicitDependencies(value, parts = [], output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectExplicitDependencies(item, [...parts, index], output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string" && targetType(child)) {
      const sourceType = targetType(child);
      const projectionId = value.projection || value.technicalProjection || null;
      const projection = projectionId ? PROJECTION_TARGETS[projectionId] : null;
      const hash = projectionId
        ? (() => {
            for (const candidate of ["sha256", "technicalProjectionSha256", "projectionSha256"]) {
              if (typeof value[candidate] === "string" && SHA256.test(value[candidate])) {
                return {key: candidate, value: value[candidate].toLowerCase(), ambiguous: false};
              }
            }
            return {key: null, value: null, ambiguous: false};
          })()
        : findDeclaredHash(value, key, sourceType);
      const excludedPaths = Array.isArray(value.excludedPaths) ? value.excludedPaths : [];
      const includedPaths = Array.isArray(value.includedPaths) ? value.includedPaths : [];
      const projectionDescriptorValid = !projectionId || Boolean(
        projection &&
        projection.sourceType === sourceType &&
        value.hashMode === CANONICAL_PROJECTION_ENCODING &&
        JSON.stringify(excludedPaths) === JSON.stringify(projection.excludedPaths) &&
        JSON.stringify(includedPaths) === JSON.stringify(projection.includedPaths)
      );
      output.push({
        type: projection?.type || sourceType,
        sourceType,
        declaredPath: child,
        pathPointer: jsonPointer([...parts, key]),
        hashPointer: hash.key ? jsonPointer([...parts, hash.key]) : null,
        declaredSha256: hash.value,
        ambiguousHashPin: hash.ambiguous,
        projection: projectionId,
        hashMode: projectionId ? value.hashMode || null : "file-bytes-sha256",
        projectionDescriptorValid,
        implicit: false,
      });
    }
    collectExplicitDependencies(child, [...parts, key], output);
  }
  return output;
}

function declaredGenerator(record, projectRoot) {
  const raw = record?.generatedBy ?? record?.generator;
  const script = typeof raw === "string" ? raw : raw?.script || raw?.path;
  if (typeof script !== "string" || !script.endsWith(".mjs")) return null;
  return {
    source: "declared",
    script,
    deterministic: raw?.deterministic === true,
    scriptExists: path.isAbsolute(script) ? null : null,
  };
}

async function artifactGenerator({record, artifactRelative, animationId, projectRoot}) {
  const declared = declaredGenerator(record, projectRoot);
  const special = SPECIAL_GENERATORS[`${animationId}/${artifactRelative}`];
  const registered = GENERATOR_REGISTRY.find(({pattern}) => pattern.test(artifactRelative));
  const selected = declared || (special ? {...special, source: "registry"} : registered ? {...registered, source: "registry"} : null);
  if (!selected) return {availability: "none-known", script: null, deterministic: false, source: null, scriptExists: false};
  const scriptPath = path.isAbsolute(selected.script) ? selected.script : path.resolve(projectRoot, selected.script);
  const scriptExists = await exists(scriptPath);
  const securityDisabled = selected.disabled === true || selected.script === "scripts/adopt-course-original-runtime-evidence.mjs";
  return {
    availability: securityDisabled ? "disabled-security-hold" : scriptExists ? "available" : "declared-but-missing",
    script: portable(path.relative(projectRoot, scriptPath)),
    deterministic: selected.deterministic === true,
    source: selected.source,
    scriptExists,
    disabledReason: securityDisabled
      ? "canonical original-runtime evidence writes are disabled pending P1 remediation and independent review"
      : null,
  };
}

async function artifactConsumers({artifactRelative, projectRoot}) {
  const consumers = [];
  for (const item of CONSUMER_REGISTRY.filter(({pattern}) => pattern.test(artifactRelative))) {
    const scriptPath = path.resolve(projectRoot, item.script);
    consumers.push({
      script: item.script,
      scriptExists: await exists(scriptPath),
      role: "consumer-not-producer",
      consumesAs: item.consumesAs,
    });
  }
  return consumers;
}

function deduplicateDependencies(dependencies) {
  const byIdentity = new Map();
  for (const dependency of dependencies) {
    const key = [dependency.type, dependency.resolvedPath, dependency.declaredSha256 || "", dependency.projection || "", dependency.ambiguousHashPin].join("|");
    const existing = byIdentity.get(key);
    if (existing) existing.references.push({pathPointer: dependency.pathPointer, hashPointer: dependency.hashPointer});
    else byIdentity.set(key, {...dependency, references: [{pathPointer: dependency.pathPointer, hashPointer: dependency.hashPointer}]});
  }
  return [...byIdentity.values()];
}

function findFullArtifactDependencyCycles(pilots) {
  const artifacts = pilots
    .flatMap(({artifacts: pilotArtifacts}) => pilotArtifacts)
    .filter(({status}) => status !== "excluded-invalidated");
  const byPath = new Map(artifacts.map((artifact) => [artifact.path, artifact]));
  const adjacency = new Map(artifacts.map((artifact) => [
    artifact.path,
    [...new Set(artifact.dependencies
      .filter(({projection, resolvedPath}) => !projection && byPath.has(resolvedPath))
      .map(({resolvedPath}) => resolvedPath))].sort(),
  ]));
  const indices = new Map();
  const lowLinks = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];
  let nextIndex = 0;

  function visit(node) {
    indices.set(node, nextIndex);
    lowLinks.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);
    for (const target of adjacency.get(node) || []) {
      if (!indices.has(target)) {
        visit(target);
        lowLinks.set(node, Math.min(lowLinks.get(node), lowLinks.get(target)));
      } else if (onStack.has(target)) lowLinks.set(node, Math.min(lowLinks.get(node), indices.get(target)));
    }
    if (lowLinks.get(node) !== indices.get(node)) return;
    const component = [];
    while (stack.length) {
      const member = stack.pop();
      onStack.delete(member);
      component.push(member);
      if (member === node) break;
    }
    const selfCycle = component.length === 1 && (adjacency.get(component[0]) || []).includes(component[0]);
    if (component.length > 1 || selfCycle) components.push(component.sort());
  }

  for (const node of [...adjacency.keys()].sort()) if (!indices.has(node)) visit(node);
  return components
    .sort((left, right) => left.join("\u0000").localeCompare(right.join("\u0000")))
    .map((artifactPaths) => ({
      artifactPaths,
      edgeKind: "full-file-sha256",
      rationale: "Canonical projections are terminal content identities and are deliberately excluded from full-artifact cycle edges.",
    }));
}

async function inspectArtifact({projectRoot, workspace, animationId, artifactPath}) {
  const artifactRelative = portable(path.relative(workspace, artifactPath));
  const text = await readFile(artifactPath, "utf8");
  let record;
  try {
    record = JSON.parse(text);
  } catch (error) {
    return {
      path: portable(path.relative(projectRoot, artifactPath)),
      artifactRelative,
      sha256: sha256Text(text),
      jsonStatus: "invalid",
      jsonError: error.message,
      generator: {availability: "unknown-invalid-json", script: null, deterministic: false, source: null, scriptExists: false},
      dependencies: [],
      status: "invalid-json",
    };
  }

  const found = collectExplicitDependencies(record);
  if (CANDIDATE_QA_ARTIFACT.test(artifactRelative)) collectCandidateQaDependencies(record, [], found);
  if (artifactRelative === "evidence/verification.json" && typeof record.manifestSha256 === "string") {
    found.push({
      type: "migration-manifest",
      declaredPath: "migration.json",
      pathPointer: "(implicit verification manifest)",
      hashPointer: "/manifestSha256",
      declaredSha256: SHA256.test(record.manifestSha256) ? record.manifestSha256.toLowerCase() : null,
      ambiguousHashPin: false,
      implicit: true,
    });
  }

  const evaluated = [];
  for (const dependency of found) {
    const absolute = resolveDependencyPath(projectRoot, workspace, dependency.declaredPath);
    const targetExists = await exists(absolute);
    const targetBytes = targetExists ? await readFile(absolute) : null;
    const observedFileSha256 = targetBytes === null ? null : sha256Text(targetBytes);
    let observedSha256 = observedFileSha256;
    let projectionParseError = null;
    if (targetExists && dependency.projection && dependency.projectionDescriptorValid) {
      try {
        observedSha256 = PROJECTION_TARGETS[dependency.projection].digest(JSON.parse(targetBytes.toString("utf8")));
      } catch (error) {
        projectionParseError = error.message;
        observedSha256 = null;
      }
    }
    const status = dependency.ambiguousHashPin
      ? "ambiguous-pin"
      : dependency.projection && (!dependency.projectionDescriptorValid || projectionParseError)
        ? "invalid-projection"
      : !dependency.declaredSha256
        ? "missing-pin"
        : !targetExists
          ? "missing-target"
          : dependency.declaredSha256 === observedSha256
            ? "current"
            : "stale";
    evaluated.push({
      ...dependency,
      resolvedPath: portable(path.relative(projectRoot, absolute)),
      targetExists,
      observedFileSha256,
      observedSha256,
      projectionParseError,
      status,
    });
  }
  const dependencies = deduplicateDependencies(evaluated).sort((left, right) =>
    `${left.type}:${left.resolvedPath}`.localeCompare(`${right.type}:${right.resolvedPath}`)
  );
  const generator = await artifactGenerator({record, artifactRelative, animationId, projectRoot});
  const knownConsumers = await artifactConsumers({artifactRelative, projectRoot});
  const invalidation = record.evidenceKind === "formal-evidence-invalidation"
    && record.status === "invalidated"
    && record.animationId === animationId
    && typeof record.invalidates?.path === "string"
    && typeof record.invalidates?.sha256 === "string"
    && SHA256.test(record.invalidates.sha256)
    ? {
        targetPath: record.invalidates.path,
        targetSha256: record.invalidates.sha256.toLowerCase(),
      }
    : null;
  const status = dependencies.every(({status: dependencyStatus}) => dependencyStatus === "current") ? "current" : "blocked";
  return {
    path: portable(path.relative(projectRoot, artifactPath)),
    artifactRelative,
    sha256: sha256Text(text),
    jsonStatus: "valid",
    generator,
    knownConsumers,
    invalidation,
    dependencyCount: dependencies.length,
    dependencies,
    status,
  };
}

export async function buildEvidenceDependencyReport({
  projectRoot = PROJECT_ROOT,
  migrationsRoot = path.join(projectRoot, "migrations"),
  pilotIds = COURSE_SHELL_PILOT_IDS,
} = {}) {
  const pilots = [];
  for (const animationId of [...pilotIds].sort()) {
    const workspace = path.join(migrationsRoot, animationId);
    const artifacts = [];
    for (const directory of ["audit", "evidence"]) {
      const root = path.join(workspace, directory);
      if (!(await exists(root))) continue;
      for (const entry of (await readdir(root, {withFileTypes: true})).sort((left, right) => left.name.localeCompare(right.name))) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
        artifacts.push(await inspectArtifact({projectRoot, workspace, animationId, artifactPath: path.join(root, entry.name)}));
      }
    }
    const formalInvalidations = [];
    for (const sidecar of artifacts.filter(({invalidation}) => invalidation)) {
      const targetAbsolute = resolveDependencyPath(projectRoot, workspace, sidecar.invalidation.targetPath);
      const targetRelative = portable(path.relative(projectRoot, targetAbsolute));
      const target = artifacts.find(({path: artifactPath}) => artifactPath === targetRelative);
      const valid = Boolean(target)
        && target.path !== sidecar.path
        && target.sha256 === sidecar.invalidation.targetSha256
        && (target.artifactRelative.startsWith("audit/") || target.artifactRelative.startsWith("evidence/"));
      formalInvalidations.push({
        sidecar: sidecar.path,
        target: targetRelative,
        declaredTargetSha256: sidecar.invalidation.targetSha256,
        observedTargetSha256: target?.sha256 || null,
        status: valid ? "valid" : "invalid",
      });
      if (valid) {
        target.formallyInvalidatedBy = sidecar.path;
        target.statusBeforeInvalidation = target.status;
        target.status = "excluded-invalidated";
      }
    }
    const invalidInvalidations = formalInvalidations.filter(({status}) => status !== "valid");
    const dependencyArtifacts = artifacts.filter(({dependencyCount, status}) => dependencyCount > 0 && status !== "excluded-invalidated");
    const blocked = dependencyArtifacts.filter(({status}) => status !== "current");
    const staleWithoutGenerator = blocked.filter(({generator}) => generator.availability !== "available");
    pilots.push({
      animationId,
      artifactCount: artifacts.length,
      dependencyArtifactCount: dependencyArtifacts.length,
      status: blocked.length ? "blocked" : "current",
      blockedArtifactCount: blocked.length,
      staleWithoutGeneratorCount: staleWithoutGenerator.length,
      formallyInvalidatedArtifactCount: artifacts.filter(({status}) => status === "excluded-invalidated").length,
      formalInvalidations,
      invalidInvalidationCount: invalidInvalidations.length,
      artifacts,
    });
  }

  const artifacts = pilots.flatMap(({artifacts}) => artifacts);
  const dependencyArtifacts = artifacts.filter(({dependencyCount}) => dependencyCount > 0);
  const activeDependencyArtifacts = dependencyArtifacts.filter(({status}) => status !== "excluded-invalidated");
  const blocked = activeDependencyArtifacts.filter(({status}) => status !== "current");
  const staleWithGenerator = blocked.filter(({generator}) => generator.availability === "available");
  const staleWithoutGenerator = blocked.filter(({generator}) => generator.availability !== "available");
  const dependencyPins = dependencyArtifacts.flatMap(({dependencies}) => dependencies);
  const activeDependencyPins = activeDependencyArtifacts.flatMap(({dependencies}) => dependencies);
  const invalidInvalidations = pilots.flatMap(({formalInvalidations}) => formalInvalidations).filter(({status}) => status !== "valid");
  const dependencyCycles = findFullArtifactDependencyCycles(pilots);
  const statusCounts = Object.fromEntries(
    ["current", "stale", "missing-pin", "missing-target", "ambiguous-pin", "invalid-projection"].map((status) => [
      status,
      activeDependencyPins.filter((dependency) => dependency.status === status).length,
    ])
  );
  return {
    schemaVersion: 1,
    evidenceKind: "course-shell-evidence-dependency-audit",
    authority: "Read-only path/SHA dependency integrity audit. It does not prove fidelity, approve reviews, or change migration status.",
    scope: {
      pilotIds: pilots.map(({animationId}) => animationId),
      directories: ["audit/*.json", "evidence/*.json"],
      dependencyTargets: [
        ...Object.values(DEPENDENCY_TARGETS),
        ...Object.values(PROJECTION_TARGETS).map(({type}) => type),
        ...CANDIDATE_QA_DEPENDENCY_TYPES,
      ],
    },
    summary: {
      status: blocked.length || invalidInvalidations.length || dependencyCycles.length ? "blocked" : "current",
      pilotCount: pilots.length,
      artifactCount: artifacts.length,
      dependencyArtifactCount: dependencyArtifacts.length,
      dependencyPinCount: dependencyPins.length,
      activeDependencyPinCount: activeDependencyPins.length,
      dependencyStatusCounts: statusCounts,
      blockedArtifactCount: blocked.length,
      staleWithGeneratorCount: staleWithGenerator.length,
      staleWithoutGeneratorCount: staleWithoutGenerator.length,
      formallyInvalidatedArtifactCount: artifacts.filter(({status}) => status === "excluded-invalidated").length,
      invalidInvalidationCount: invalidInvalidations.length,
      dependencyCycleCount: dependencyCycles.length,
    },
    cascadeNotes: [
      "Upstream source/runtime evidence binds stable technical projections, not mutable migration status/reviews or mutable coverage result fields; do not hand-edit projection hashes.",
      "Run the frame-domain sync only after readiness and scenario inventory are stable, then regenerate downstream disposition, traces, candidate evidence, QA, and verification.",
      "An available generator means a reproducible rebuild path exists; it does not mean the artifact is currently valid or that the generator supplies authoritative runtime evidence.",
      "Artifacts reported withoutGenerator require an explicit producer or documented manual revalidation. Copying a current SHA into a stale record is forbidden.",
    ],
    recommendedCascade: CASCADE,
    blockedArtifacts: blocked.map(({path: artifactPath, generator, dependencies}) => ({
      path: artifactPath,
      generator,
      failingDependencies: dependencies.filter(({status}) => status !== "current").map(({type, resolvedPath, status}) => ({type, resolvedPath, status})),
    })),
    staleWithGenerator: staleWithGenerator.map(({path: artifactPath, generator}) => ({path: artifactPath, generator})),
    withoutGenerator: staleWithoutGenerator.map(({path: artifactPath, generator, knownConsumers}) => ({path: artifactPath, generator, knownConsumers})),
    formalInvalidations: pilots.flatMap(({formalInvalidations}) => formalInvalidations),
    dependencyCycles,
    pilots,
  };
}

export function parseArguments(argv) {
  const options = {check: false, ids: [], json: false, output: null, migrations: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--id") options.ids.push(argv[++index]);
    else if (argument === "--migrations") options.migrations = argv[++index];
    else if (argument === "--output") options.output = argv[++index];
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (options.ids.some((id) => !id)) throw new Error("--id requires a value");
  if (options.migrations === undefined || options.output === undefined) throw new Error("A path option requires a value");
  return options;
}

function usage() {
  return `Usage: node scripts/audit-course-evidence-dependencies.mjs [options]\n\nOptions:\n  --id <animation-id>       Audit one course/shell pilot; repeatable\n  --migrations <directory>  Migration root (default: migrations)\n  --output <file>           Also write the machine-readable report\n  --json                    Print the complete JSON report\n  --check                   Exit nonzero unless every discovered dependency pin is current\n  --help                    Show this help\n\nThis command never rewrites migration evidence, manifests, status, sources, or reviews.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const migrationsRoot = options.migrations ? path.resolve(options.migrations) : path.join(PROJECT_ROOT, "migrations");
  const report = await buildEvidenceDependencyReport({
    projectRoot: PROJECT_ROOT,
    migrationsRoot,
    pilotIds: options.ids.length ? options.ids : COURSE_SHELL_PILOT_IDS,
  });
  const reportText = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) await writeFile(path.resolve(options.output), reportText, "utf8");
  if (options.json) process.stdout.write(reportText);
  else console.log(JSON.stringify(report.summary));
  if (options.check && report.summary.status !== "current") process.exitCode = 1;
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
