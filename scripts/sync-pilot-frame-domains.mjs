#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";
import {
  TRACE_COVERAGE_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  preserveLegalSupplementalRequirements,
} from "./build-gs002-partial-current-js-requirement.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");

export const PILOT_FRAME_DOMAIN_SPECS = Object.freeze({
  "course-g03-l01-ts-008": Object.freeze({objectId: "348", frameCount: 747, entryFrame: 6}),
  "course-g03-l01-vb-004": Object.freeze({objectId: "231", frameCount: 222, entryFrame: 6}),
  "course-g03-l06-fq-002-review": Object.freeze({objectId: "1168", frameCount: 82, entryFrame: 6}),
  "course-g03-l06-ti-001": Object.freeze({objectId: "21", frameCount: 142, entryFrame: 6}),
  "course-g03-l08-re-001": Object.freeze({objectId: "621", frameCount: 27, entryFrame: 51, defaultDomainId: "root", keyframeDomainId: "root"}),
  "course-g04-l01-ir-001": Object.freeze({objectId: "58", frameCount: 142, entryFrame: 6}),
  "course-g04-l03-in-009": Object.freeze({objectId: "200", frameCount: 637, entryFrame: 6}),
  "course-g04-l09-gs-002": Object.freeze({objectId: "787", frameCount: 653, entryFrame: 6}),
  "course-g05-l13-rw-002": Object.freeze({objectId: "334", frameCount: 1873, entryFrame: 6}),
  "shell-course-g04-l01-index-local": Object.freeze({shell: true, defaultDomainId: "root", keyframeDomainId: "root"}),
});

export const PILOT_FRAME_DOMAIN_IDS = Object.freeze(Object.keys(PILOT_FRAME_DOMAIN_SPECS));

const KEYFRAME_HEADERS = Object.freeze([
  "frame", "requirement_id", "frame_domain_id", "trace_id", "entry_state_sha256", "time_ms", "scenario", "language", "kind",
  "expected_state", "trigger", "baseline_file", "baseline_sha256", "implementation_file", "implementation_sha256",
  "diff_file", "diff_sha256", "normalized_rmse", "timing_result", "visual_result", "evidence_source", "reviewer", "notes",
]);

function usage() {
  return `Usage: node scripts/sync-pilot-frame-domains.mjs [options]\n\nOptions:\n  --id <animation-id>       Sync one pilot; repeatable\n  --migrations <directory>  Migration root (default: migrations)\n  --check                   Verify generated files without writing\n  --json                    Print the summary as JSON\n  -h, --help                Show this help`;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort(compareText).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else value += character;
  }
  if (quoted) throw new Error("Unterminated quoted CSV field");
  values.push(value);
  return values;
}

export function parseCsv(content) {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.length);
  if (!lines.length) return {headers: [], rows: []};
  const headers = parseCsvLine(lines[0]);
  if (new Set(headers).size !== headers.length) throw new Error("CSV headers must be unique");
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, position) => [header, values[position]]));
  });
  return {headers, rows};
}

function csvField(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeCsv(headers, rows) {
  return `${[headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((values) => values.map(csvField).join(","))
    .join("\n")}\n`;
}

function uniqueStrings(values, label) {
  if (!Array.isArray(values) || !values.length || values.some((value) => typeof value !== "string" || !value)) {
    throw new Error(`${label} must be a non-empty string array`);
  }
  if (new Set(values).size !== values.length) throw new Error(`${label} must not contain duplicates`);
  return values;
}

function artifactCandidates(workspace, artifactPath) {
  if (path.isAbsolute(artifactPath)) return [artifactPath];
  const projectRelativePrefixes = ["source-assets/", "artifacts/", "migrations/", "packages/", "apps/", "public/", "output/"];
  return projectRelativePrefixes.some((prefix) => artifactPath.startsWith(prefix))
    ? [path.join(projectRoot, artifactPath), path.join(workspace, artifactPath)]
    : [path.join(workspace, artifactPath), path.join(projectRoot, artifactPath)];
}

async function verifyScenarioInventoryEvidence({workspace, manifest, inventory}) {
  if (inventory.schemaVersion !== 1 || inventory.animationId !== manifest.animationId) {
    throw new Error(`${manifest.animationId}: scenario inventory identity/schema mismatch`);
  }
  if (inventory.inventoryStatus !== "static-exhaustive-runtime-unverified" || inventory.migrationStatusChanged !== false) {
    throw new Error(`${manifest.animationId}: scenario inventory must remain fail-closed and status-neutral`);
  }
  if (inventory.source?.swf !== manifest.source?.swf || inventory.source?.swfSha256 !== manifest.source?.swfSha256) {
    throw new Error(`${manifest.animationId}: scenario inventory source does not match migration manifest`);
  }
  if (inventory.source?.rootFrameCount !== manifest.runtime?.frameCount) {
    throw new Error(`${manifest.animationId}: scenario inventory root frame count does not match runtime.frameCount`);
  }
  if (inventory.source?.fps !== manifest.runtime?.fps || canonicalJson(inventory.source?.stage) !== canonicalJson(manifest.runtime?.stage)) {
    throw new Error(`${manifest.animationId}: scenario inventory stage/FPS does not match migration manifest`);
  }
  if (!Array.isArray(inventory.evidenceIndex) || !inventory.evidenceIndex.length) {
    throw new Error(`${manifest.animationId}: scenario inventory has no evidence index`);
  }
  const artifactIds = new Set();
  for (const artifact of inventory.evidenceIndex) {
    if (!artifact.artifactId || artifactIds.has(artifact.artifactId)) throw new Error(`${manifest.animationId}: duplicate or empty inventory artifactId`);
    artifactIds.add(artifact.artifactId);
    if (!artifact.path || !/^[a-f0-9]{64}$/.test(artifact.sha256 || "")) {
      throw new Error(`${manifest.animationId}: ${artifact.artifactId} lacks a path or SHA-256`);
    }
    let resolved = null;
    for (const candidate of artifactCandidates(workspace, artifact.path)) {
      if (await exists(candidate)) {
        resolved = candidate;
        break;
      }
    }
    if (!resolved) throw new Error(`${manifest.animationId}: inventory artifact is missing: ${artifact.path}`);
    if (artifact.artifactId === "migration-technical-contract") {
      if (
        artifact.path !== "migration.json" ||
        artifact.hashMode !== "canonical-json-v1" ||
        artifact.projection !== TECHNICAL_MANIFEST_PROJECTION.id ||
        canonicalJson(artifact.excludedPaths) !== canonicalJson(TECHNICAL_MANIFEST_PROJECTION.excludedPaths) ||
        artifact.sha256 !== technicalManifestSha256(manifest)
      ) {
        throw new Error(`${manifest.animationId}: inventory migration technical contract is stale or malformed`);
      }
    } else {
      const observed = await sha256File(resolved);
      if (observed !== artifact.sha256) throw new Error(`${manifest.animationId}: inventory artifact hash mismatch: ${artifact.artifactId}`);
    }
    if (artifact.uncompressedSha256) {
      const uncompressed = gunzipSync(await readFile(resolved));
      if (sha256Text(uncompressed) !== artifact.uncompressedSha256) {
        throw new Error(`${manifest.animationId}: uncompressed inventory artifact hash mismatch: ${artifact.artifactId}`);
      }
    }
  }
  for (const required of ["source-swf", "migration-technical-contract", "swfmill-xml"]) {
    if (!artifactIds.has(required)) throw new Error(`${manifest.animationId}: scenario inventory lacks ${required} evidence`);
  }
}

function timelineById(inventory, timelineId, animationId) {
  const matches = (inventory.timelineInventory || []).filter((timeline) => timeline.timelineId === timelineId);
  if (matches.length !== 1) throw new Error(`${animationId}: expected exactly one ${timelineId} timeline; found ${matches.length}`);
  return matches[0];
}

function deriveStructuralContract(manifest, inventory, spec) {
  const root = timelineById(inventory, "root", manifest.animationId);
  if (root.frameCount !== manifest.runtime.frameCount || root.structuralReachability !== "root") {
    throw new Error(`${manifest.animationId}: root timeline conflicts with shipped runtime metadata`);
  }
  const rootDefinition = {
    id: "root",
    kind: "root",
    sourceTimelineId: "root",
    sourceObjectId: null,
    frameCount: root.frameCount,
    indexing: "one-indexed",
    structuralReachability: root.structuralReachability,
    evidence: "audit/scenario-inventory.json",
  };
  const rootInstance = {
    id: "root",
    timelineDefinitionId: "root",
    parentInstanceId: null,
    placement: null,
  };
  if (spec.shell) {
    return {
      root,
      local: null,
      placement: null,
      timelineDefinitions: [rootDefinition],
      instances: [rootInstance],
    };
  }

  const timelineId = `sprite-${spec.objectId}`;
  const local = timelineById(inventory, timelineId, manifest.animationId);
  if (String(local.objectId) !== spec.objectId || local.frameCount !== spec.frameCount) {
    throw new Error(`${manifest.animationId}: ${timelineId} does not match the reviewed object/frame mapping`);
  }
  if (local.structuralReachability !== "reachable-from-root-placement-graph") {
    throw new Error(`${manifest.animationId}: ${timelineId} is not proven reachable from the root placement graph`);
  }
  const placements = (root.namedPlacements || []).filter((placement) =>
    placement.name === "animation" && String(placement.objectId) === spec.objectId,
  );
  if (placements.length !== 1) {
    throw new Error(`${manifest.animationId}: expected one root animation placement for object ${spec.objectId}; found ${placements.length}`);
  }
  const placement = placements[0];
  if (Number(placement.frame) !== spec.entryFrame) {
    throw new Error(`${manifest.animationId}: reviewed root entry frame ${spec.entryFrame} differs from inventory frame ${placement.frame}`);
  }
  return {
    root,
    local,
    placement,
    timelineDefinitions: [
      rootDefinition,
      {
        id: timelineId,
        kind: "movie-clip",
        sourceTimelineId: timelineId,
        sourceObjectId: spec.objectId,
        frameCount: local.frameCount,
        indexing: "one-indexed",
        structuralReachability: local.structuralReachability,
        role: "main-animation",
        evidence: "audit/scenario-inventory.json",
      },
    ],
    instances: [
      rootInstance,
      {
        id: "main-animation",
        timelineDefinitionId: timelineId,
        parentInstanceId: "root",
        placement: {
          parentTimelineId: "root",
          frame: Number(placement.frame),
          depth: String(placement.depth),
          instanceName: placement.name,
          sourceObjectId: spec.objectId,
        },
      },
    ],
  };
}

function rootStandaloneScenario(existing) {
  return {
    ...(existing || {}),
    id: "root-standalone",
    kind: "linear",
    description: existing?.description || "Original SWF root-shell and animation-placement direct-seek trace; renderer support and natural host execution are validated separately.",
    reachable: true,
  };
}

function normalizeReachableScenarioKind(scenario) {
  if (["linear", "interactive"].includes(scenario.kind)) return scenario;
  return {
    ...scenario,
    kind: "interactive",
    sourceScenarioKind: scenario.kind || "unclassified",
  };
}

function frameDomainsFor(structural, spec, mainScenarioIds) {
  if (spec.shell) {
    return [{
      id: "root",
      kind: "root",
      sourceTimelineId: "root",
      sourceInstanceId: "root",
      parentFrameDomainId: null,
      frameCount: structural.root.frameCount,
      scenarioIds: mainScenarioIds,
      role: "original-course-shell",
    }];
  }
  return [
    {
      id: "root",
      kind: "root",
      sourceTimelineId: "root",
      sourceInstanceId: "root",
      parentFrameDomainId: null,
      frameCount: structural.root.frameCount,
      scenarioIds: ["root-standalone"],
      role: "root-shell-placement",
    },
    {
      id: structural.local.timelineId,
      kind: "nested",
      sourceTimelineId: structural.local.timelineId,
      sourceInstanceId: "main-animation",
      parentFrameDomainId: "root",
      parentEntryFrame: Number(structural.placement.frame),
      localEntryFrame: 1,
      frameCount: structural.local.frameCount,
      scenarioIds: mainScenarioIds,
      role: "main-animation",
    },
  ];
}

function captureContract(previous = {}) {
  return {
    ...previous,
    frameParameter: previous.frameParameter || "frame",
    frameDomainParameter: "frameDomain",
    requirementIdParameter: "requirementId",
    traceParameter: "trace",
    entryStateSha256Parameter: "entryStateSha256",
    scenarioParameter: previous.scenarioParameter || "scenario",
    languageParameter: previous.languageParameter || "lang",
    seedParameter: previous.seedParameter || "seed",
    frameAttribute: "data-flash-frame",
    animationIdAttribute: "data-animation-id",
    frameDomainAttribute: "data-flash-frame-domain",
    requirementIdAttribute: "data-flash-requirement-id",
    traceAttribute: "data-flash-trace-id",
    entryStateSha256Attribute: "data-flash-entry-state-sha256",
  };
}

function buildEntryState({domain, scenario, language, structural, spec}) {
  if (domain.id === "root") {
    return {
      kind: spec.shell ? "original-shell-natural-entry" : "original-root-frame-accurate-entry",
      rootTimelineId: "root",
      rootEntryFrame: 1,
      scenario,
      language,
      seed: "0",
    };
  }
  return {
    kind: "natural-root-placement-entry",
    rootTimelineId: "root",
    rootEntryFrame: Number(structural.placement.frame),
    instanceId: "main-animation",
    frameDomainId: domain.id,
    localEntryFrame: 1,
    scenario,
    language,
    seed: "0",
  };
}

function buildRequirements({manifest, frameDomains, structural, spec, scenarioInventorySha256}) {
  const requirements = [];
  const scenariosById = new Map((manifest.scenarios || []).map((scenario) => [scenario.id, scenario]));
  for (const domain of frameDomains) {
    for (const scenario of domain.scenarioIds) {
      for (const language of manifest.localization.languages) {
        const requirementId = `req:${domain.id}:${scenario}:${language}`;
        const traceId = `trace:${domain.id}:${scenario}:${language}:seed-0`;
        const entryState = buildEntryState({domain, scenario, language, structural, spec});
        const shellReason = "The production course page is a native host replacement, while the original shell's natural root trace, navigation outcomes, disabled legacy endpoints, and per-language frame evidence are not captured or compared.";
        const rootReason = "No accepted frame-accurate original-runtime direct-seek baseline, deterministic implementation capture, and frame metrics cover this linear standalone root domain for the declared language.";
        const nestedReason = structural.placement
          ? `${domain.id} requires an original-runtime natural trace entered through root frame ${structural.placement.frame}; accepted per-frame capture and RMSE metrics are missing for this scenario/language.`
          : "A nested-domain requirement cannot be specified without a verified root placement.";
        const scenarioKind = scenariosById.get(scenario)?.kind;
        const requiresNaturalTrace = domain.kind === "nested" || scenarioKind === "interactive";
        requirements.push({
          requirementId,
          scenario,
          frameDomainId: domain.id,
          traceId,
          language,
          seed: "0",
          requiredRange: {firstFrame: 1, lastFrame: domain.frameCount},
          entryState,
          entryStateSha256: sha256Text(canonicalJson(entryState)),
          baselineAuthorityRequirement: requiresNaturalTrace
            ? "original-runtime-natural-trace"
            : "original-runtime-frame-accurate",
          baselineAuthority: "unresolved",
          status: "blocked",
          blockingReason: spec.shell ? shellReason : domain.id === "root" ? rootReason : nestedReason,
          blockingEvidence: [{
            file: "audit/scenario-inventory.json",
            sha256: scenarioInventorySha256,
          }],
          capturedFrameCount: 0,
          missingFrames: Array.from({length: domain.frameCount}, (_, index) => index + 1),
          baselineCaptureManifest: "",
          baselineCaptureManifestSha256: "",
          captureManifest: "",
          captureManifestSha256: "",
          metricsFile: "",
          metricsSha256: "",
        });
      }
    }
  }
  return requirements;
}

function requirementTechnicalIdentity(requirement) {
  return Object.fromEntries(TRACE_COVERAGE_PROJECTION.includedRequirementPaths
    .filter((field) => requirement?.[field] !== undefined)
    .map((field) => [field, requirement[field]]));
}

function preserveRequirementEvidence(generatedRequirements, existingCoverage) {
  if (existingCoverage?.schemaVersion !== 2 || !Array.isArray(existingCoverage.requirements)) {
    return generatedRequirements;
  }
  const existingById = new Map(existingCoverage.requirements
    .filter((requirement) => typeof requirement?.requirementId === "string")
    .map((requirement) => [requirement.requirementId, requirement]));
  return generatedRequirements.map((generated) => {
    const existing = existingById.get(generated.requirementId);
    if (!existing || canonicalJson(requirementTechnicalIdentity(existing)) !== canonicalJson(requirementTechnicalIdentity(generated))) {
      return generated;
    }
    const preserved = Object.fromEntries(TRACE_COVERAGE_PROJECTION.excludedRequirementPaths
      .filter((field) => field !== "blockingEvidence" && Object.hasOwn(existing, field))
      .map((field) => [field, existing[field]]));
    if (Object.hasOwn(existing, "blockingEvidence")) {
      const refreshedScenarioEvidence = (generated.blockingEvidence || [])
        .filter(({file}) => file === "audit/scenario-inventory.json");
      const preservedAdditionalEvidence = Array.isArray(existing.blockingEvidence)
        ? existing.blockingEvidence.filter(({file}) => file !== "audit/scenario-inventory.json")
        : [];
      preserved.blockingEvidence = [...refreshedScenarioEvidence, ...preservedAdditionalEvidence];
    }
    return {...generated, ...preserved};
  });
}

function migrateKeyframes({manifest, keyframesText, requirements, spec, structural}) {
  const parsed = parseCsv(keyframesText);
  const missingHeaders = [
    "frame", "time_ms", "scenario", "language", "kind", "expected_state", "trigger", "baseline_file", "baseline_sha256",
    "implementation_file", "implementation_sha256", "diff_file", "diff_sha256", "normalized_rmse", "timing_result", "visual_result",
    "evidence_source", "reviewer", "notes",
  ].filter((header) => !parsed.headers.includes(header));
  if (missingHeaders.length) throw new Error(`${manifest.animationId}: keyframes.csv lacks ${missingHeaders.join(", ")}`);
  const requirementByKey = new Map(requirements.map((requirement) => [
    `${requirement.frameDomainId}\0${requirement.scenario}\0${requirement.language}`,
    requirement,
  ]));
  const rows = parsed.rows.map((row, index) => {
    let frameDomainId = row.frame_domain_id || spec.keyframeDomainId || structural.local?.timelineId || "root";
    let scenario = row.scenario;
    let notes = row.notes;
    if (!spec.shell && frameDomainId === "root" && scenario !== "root-standalone") {
      notes = [notes, `Original scenario '${scenario}' was a root-domain row and is retained under root-standalone; no acceptance claim is added.`]
        .filter(Boolean).join(" ");
      scenario = "root-standalone";
    }
    const requirement = requirementByKey.get(`${frameDomainId}\0${scenario}\0${row.language}`);
    if (!requirement) {
      throw new Error(`${manifest.animationId}: keyframe row ${index + 2} has no requirement for ${frameDomainId}/${scenario}/${row.language}`);
    }
    const frame = Number(row.frame);
    const domain = frameDomainId === "root" ? structural.root : structural.local;
    if (!Number.isInteger(frame) || frame < 1 || frame > domain.frameCount) {
      throw new Error(`${manifest.animationId}: keyframe row ${index + 2} frame ${row.frame} is outside ${frameDomainId}`);
    }
    return {
      ...row,
      requirement_id: requirement.requirementId,
      frame_domain_id: frameDomainId,
      trace_id: requirement.traceId,
      entry_state_sha256: requirement.entryStateSha256,
      scenario,
      notes,
    };
  });
  return serializeCsv(KEYFRAME_HEADERS, rows);
}

function ensureStatusAndReviewsUnchanged(before, after) {
  if (before.status !== after.status) throw new Error(`${before.animationId}: sync must not change migration status`);
  if (canonicalJson(before.acceptance) !== canonicalJson(after.acceptance)) {
    throw new Error(`${before.animationId}: sync must not change acceptance reviews or exceptions`);
  }
}

export function derivePilotFrameDomainOutputs({manifest, inventory, existingCoverage, keyframesText, spec}) {
  uniqueStrings((manifest.scenarios || []).map((scenario) => scenario.id), `${manifest.animationId}.scenarios`);
  uniqueStrings(manifest.localization?.languages, `${manifest.animationId}.localization.languages`);
  const structural = deriveStructuralContract(manifest, inventory, spec);
  const previouslyDispositioned = manifest.audit?.unreachableScenarioRecords || [];
  const newlyUnreachable = manifest.scenarios.filter(({id, reachable}) => id !== "root-standalone" && reachable !== true);
  const unreachableById = new Map([...previouslyDispositioned, ...newlyUnreachable].map((scenario) => [scenario.id, {
    ...scenario,
    disposition: "excluded-from-reachable-frame-domain-contract",
  }]));
  const existingMainScenarios = manifest.scenarios
    .filter(({id, reachable}) => id !== "root-standalone" && reachable === true)
    .map(normalizeReachableScenarioKind);
  const mainScenarioIds = existingMainScenarios.map(({id}) => id);
  if (!mainScenarioIds.length) throw new Error(`${manifest.animationId}: no reachable scenario remains for the primary frame domain`);
  const existingRootScenario = manifest.scenarios.find(({id}) => id === "root-standalone");
  const scenarios = spec.shell
    ? existingMainScenarios
    : [...existingMainScenarios, rootStandaloneScenario(existingRootScenario)];
  const frameDomains = frameDomainsFor(structural, spec, mainScenarioIds);
  const defaultFrameDomainId = spec.defaultDomainId || structural.local?.timelineId || "root";
  const outputManifest = {
    ...manifest,
    audit: {
      ...manifest.audit,
      ...(unreachableById.size ? {unreachableScenarioRecords: [...unreachableById.values()].sort((left, right) => compareText(left.id, right.id))} : {}),
    },
    runtime: {
      ...manifest.runtime,
      rootTimelineId: "root",
      timelineDefinitions: structural.timelineDefinitions,
      instances: structural.instances,
    },
    scenarios,
    implementation: {
      ...manifest.implementation,
      defaultFrameDomainId,
      frameDomains,
      captureContract: captureContract(manifest.implementation?.captureContract),
    },
  };
  if (outputManifest.runtime.frameCount !== manifest.runtime.frameCount) {
    throw new Error(`${manifest.animationId}: runtime.frameCount is immutable and must remain the SWF root timeline`);
  }
  ensureStatusAndReviewsUnchanged(manifest, outputManifest);

  const provisionalManifestText = jsonText(outputManifest);
  const outputInventory = {
    ...inventory,
    evidenceIndex: inventory.evidenceIndex.map((artifact) => artifact.artifactId === "migration-technical-contract"
      ? {
          ...artifact,
          sha256: technicalManifestSha256(outputManifest),
          hashMode: "canonical-json-v1",
          projection: TECHNICAL_MANIFEST_PROJECTION.id,
          excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
        }
      : artifact),
  };
  const inventoryText = jsonText(outputInventory);
  const finalInventorySha256 = sha256Text(inventoryText);
  const canonicalRequirements = preserveRequirementEvidence(buildRequirements({
    manifest: outputManifest,
    frameDomains,
    structural,
    spec,
    scenarioInventorySha256: finalInventorySha256,
  }), existingCoverage);
  const supplementalRequirements = preserveLegalSupplementalRequirements({
    animationId: manifest.animationId,
    existingRequirements: existingCoverage?.requirements || [],
    canonicalRequirements,
  });
  const requirements = [...canonicalRequirements, ...supplementalRequirements];
  const coverage = {
    schemaVersion: 2,
    animationId: manifest.animationId,
    requirements,
  };
  const outputKeyframesText = migrateKeyframes({
    manifest: outputManifest,
    keyframesText,
    // A supplemental partial-path row intentionally shares its
    // domain/scenario/language tuple with the canonical full-domain row.
    // Keyframe rows must always retain the canonical requirement identity.
    requirements: canonicalRequirements,
    spec,
    structural,
  });
  return {
    manifest: outputManifest,
    manifestText: provisionalManifestText,
    inventory: outputInventory,
    inventoryText,
    inventorySha256: finalInventorySha256,
    coverage,
    coverageText: jsonText(coverage),
    keyframesText: outputKeyframesText,
    summary: {
      animationId: manifest.animationId,
      rootTimelineId: "root",
      rootFrameCount: structural.root.frameCount,
      localFrameDomainId: structural.local?.timelineId || null,
      localFrameCount: structural.local?.frameCount || null,
      rootEntryFrame: structural.placement ? Number(structural.placement.frame) : null,
      defaultFrameDomainId,
      frameDomainCount: frameDomains.length,
      scenarioCount: scenarios.length,
      requirementCount: canonicalRequirements.length,
      canonicalRequirementCount: canonicalRequirements.length,
      supplementalRequirementCount: supplementalRequirements.length,
      rootRequirementCount: canonicalRequirements.filter(({frameDomainId}) => frameDomainId === "root").length,
      localRequirementCount: canonicalRequirements.filter(({frameDomainId}) => frameDomainId !== "root").length,
      keyframeRowCount: parseCsv(outputKeyframesText).rows.length,
    },
  };
}

export function parseArguments(argumentsList) {
  const options = {ids: [], migrationsRoot: defaultMigrationsRoot, check: false, json: false, help: false};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--id" || value === "--migrations") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else options.migrationsRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function prepareOne(id, {migrationsRoot}) {
  const spec = PILOT_FRAME_DOMAIN_SPECS[id];
  if (!spec) throw new Error(`Unknown pilot frame-domain mapping: ${id}`);
  const workspace = path.join(migrationsRoot, id);
  const paths = {
    manifest: path.join(workspace, "migration.json"),
    inventory: path.join(workspace, "audit", "scenario-inventory.json"),
    coverage: path.join(workspace, "evidence", "full-frame-coverage.json"),
    keyframes: path.join(workspace, "keyframes.csv"),
  };
  const [manifestText, inventoryText, coverageText, keyframesText] = await Promise.all([
    readFile(paths.manifest, "utf8"),
    readFile(paths.inventory, "utf8"),
    readFile(paths.coverage, "utf8"),
    readFile(paths.keyframes, "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const inventory = JSON.parse(inventoryText);
  const existingCoverage = JSON.parse(coverageText);
  if (manifest.animationId !== id) throw new Error(`${id}: migration manifest identity mismatch`);
  await verifyScenarioInventoryEvidence({workspace, manifest, inventory});
  const output = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    existingCoverage,
    keyframesText,
    spec,
  });
  return {
    summary: output.summary,
    files: [
      {path: paths.manifest, observed: manifestText, expected: output.manifestText},
      {path: paths.inventory, observed: inventoryText, expected: output.inventoryText},
      {path: paths.coverage, observed: coverageText, expected: output.coverageText},
      {path: paths.keyframes, observed: keyframesText, expected: output.keyframesText},
    ],
  };
}

export async function syncPilotFrameDomains(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const ids = options.ids?.length ? options.ids : PILOT_FRAME_DOMAIN_IDS;
  const unknown = ids.filter((id) => !PILOT_FRAME_DOMAIN_SPECS[id]);
  if (unknown.length) throw new Error(`Unknown pilot frame-domain ID(s): ${unknown.join(", ")}`);
  // Prepare and validate every pilot before the first write. A stale hash or
  // reviewed placement mismatch therefore cannot leave a partially synced set.
  const prepared = [];
  for (const id of ids) prepared.push(await prepareOne(id, {migrationsRoot}));
  if (options.check) {
    const stale = prepared.flatMap(({summary, files}) => files
      .filter(({observed, expected}) => observed !== expected)
      .map(({path: candidate}) => `${summary.animationId}: ${path.relative(projectRoot, candidate)}`));
    if (stale.length) throw new Error(`Stale frame-domain outputs:\n${stale.join("\n")}`);
  } else {
    for (const {files} of prepared) {
      for (const {path: candidate, expected} of files) await writeFile(candidate, expected, "utf8");
    }
  }
  return prepared.map(({summary}) => summary);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const summaries = await syncPilotFrameDomains(options);
  if (options.json) console.log(JSON.stringify({mode: options.check ? "check" : "write", pilots: summaries}, null, 2));
  else {
    for (const summary of summaries) {
      const local = summary.localFrameDomainId ? `${summary.localFrameDomainId}/${summary.localFrameCount}` : "root-only";
      console.log(`${options.check ? "CHECK" : "SYNC"} ${summary.animationId}: root/${summary.rootFrameCount}, ${local}, ${summary.requirementCount} requirements`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
