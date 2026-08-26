#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  extractSwfmillEvidence,
  parseScriptBundle,
  summarizeFfdecTags,
} from "./build-course-scenario-inventories.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const preservedSourceRoot = path.join(projectRoot, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const LEGACY_PILOT_IDS = Object.freeze([
  "formula-elementary-conversion-01-01",
  "formula-elementary-conversion-01-02",
  "formula-elementary-conversion-01-03",
  "formula-elementary-conversion-01-04",
  "keyterm-elementary-acute-angle",
  "keyterm-elementary-computeghgh",
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256Bytes(value) {
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

function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSha256(value, label) {
  assert(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256 digest`);
}

export function canonicalLegacyBlockingEvidence(requirement, inventorySha256) {
  assertSha256(inventorySha256, `${requirement.requirementId || "coverage requirement"}: scenario inventory`);
  const evidence = Array.isArray(requirement.blockingEvidence) ? requirement.blockingEvidence : [];
  const capturePath = typeof requirement.captureManifest === "string" && requirement.captureManifest
    ? requirement.captureManifest
    : null;
  const captureEntries = capturePath
    ? evidence.filter(({file}) => file === capturePath)
    : [];
  assert(
    captureEntries.length <= 1,
    `${requirement.requirementId || "coverage requirement"}: blockingEvidence contains duplicate current capture entries`,
  );
  const retained = evidence.filter(({file}) => (
    file !== "audit/scenario-inventory.json"
    && (!capturePath || file !== capturePath)
  ));
  return [
    ...retained,
    {file: "audit/scenario-inventory.json", sha256: inventorySha256},
    ...captureEntries,
  ];
}

function requiredOutput(report, suffix, animationId) {
  const matches = (report.outputs || []).filter((item) => item.path?.endsWith(suffix));
  assert(matches.length === 1, `${animationId}: machine report must identify exactly one ${suffix}`);
  assertSha256(matches[0].sha256, `${animationId}: ${suffix} compressed SHA-256`);
  assertSha256(matches[0].uncompressedSha256, `${animationId}: ${suffix} uncompressed SHA-256`);
  return matches[0];
}

function addControlState(map, frame, reason, evidence) {
  if (!Number.isInteger(frame) || frame < 1) return;
  if (!map.has(frame)) map.set(frame, {frame, reasons: [], evidence: []});
  const state = map.get(frame);
  state.reasons.push(reason);
  if (evidence) state.evidence.push(evidence);
}

export function buildLegacyTimelineInventory(blocks, swfmill) {
  const blocksByTimeline = new Map();
  for (const block of blocks) {
    if (!Number.isInteger(block.scope?.frame)) continue;
    const timelineId = block.scope.kind === "root"
      ? "root"
      : block.scope.kind === "sprite"
        ? `sprite-${block.scope.objectId}`
        : null;
    if (!timelineId) continue;
    if (!blocksByTimeline.has(timelineId)) blocksByTimeline.set(timelineId, []);
    blocksByTimeline.get(timelineId).push(block);
  }
  return swfmill.timelines.map((timeline) => {
    const frameCount = timeline.declaredFrameCount || timeline.observedShowFrameCount;
    assert(Number.isInteger(frameCount) && frameCount > 0, `${timeline.timelineId}: invalid source frame count`);
    const controlStates = new Map();
    const structuralEvidence = {artifactId: "swfmill-xml", timelineId: timeline.timelineId};
    addControlState(controlStates, 1, "initial-one-indexed-frame", structuralEvidence);
    addControlState(controlStates, frameCount, "terminal-structural-frame", structuralEvidence);
    for (const label of timeline.frameLabels || []) {
      addControlState(controlStates, label.frame, `frame-label:${label.label}`, structuralEvidence);
    }
    for (const action of timeline.actionFrames || []) {
      addControlState(controlStates, action.frame, `structural-action:${action.tag}`, structuralEvidence);
    }
    for (const block of blocksByTimeline.get(timeline.timelineId) || []) {
      addControlState(
        controlStates,
        block.scope.frame,
        block.event?.length ? `event-handler:${block.event.join("+")}` : "exported-action-script",
        block.evidence,
      );
      if (block.signals?.calls?.some(({target}) => /(?:^|\.)stop$/.test(target))) {
        addControlState(controlStates, block.scope.frame, "script-stop-state", block.evidence);
      }
    }
    return {
      timelineId: timeline.timelineId,
      objectId: timeline.objectId,
      frameCount,
      frameDomain: {
        indexing: "one-indexed",
        start: 1,
        endInclusive: frameCount,
        captureRequirement: "every-frame-for-every-reachable-runtime-scenario",
      },
      structuralReachability: timeline.structuralReachability,
      controlStates: [...controlStates.values()]
        .sort((left, right) => left.frame - right.frame)
        .map((state) => ({
          ...state,
          reasons: [...new Set(state.reasons)].sort(compareText),
        })),
      frameLabels: timeline.frameLabels || [],
      namedPlacements: timeline.namedPlacements || [],
      evidence: structuralEvidence,
    };
  });
}

function handlerGroups(blocks) {
  const groups = new Map();
  for (const block of blocks.filter((item) => item.event?.length)) {
    const key = `${block.bodySha256}:${block.event.join(",")}`;
    if (!groups.has(key)) {
      groups.set(key, {
        bodySha256: block.bodySha256,
        events: block.event,
        categories: new Set(),
        targets: [],
      });
    }
    const group = groups.get(key);
    for (const category of block.categories || []) group.categories.add(category);
    group.targets.push({
      scriptId: block.id,
      script: block.script,
      scope: block.scope,
      evidence: block.evidence,
    });
  }
  return [...groups.values()]
    .sort((left, right) => compareText(left.bodySha256, right.bodySha256))
    .map((group, index) => ({
      scenarioId: `handler-group-${String(index + 1).padStart(3, "0")}`,
      purpose: "Execute every source target; equal handler bodies share expected behavior but never erase placement-specific coverage.",
      events: group.events,
      categories: [...group.categories].sort(compareText),
      bodySha256: group.bodySha256,
      executionRule: "each-target",
      targets: group.targets,
      expectedEvidenceSource: "hash-bound FFDec ActionScript block",
    }));
}

function sideEffects(blocks) {
  return blocks.flatMap((block) => (block.signals?.sideEffects || []).map((item) => ({
    ...item,
    scriptId: block.id,
  })));
}

function dependencies(blocks) {
  const references = new Map();
  for (const block of blocks) {
    for (const reference of block.signals?.scopeReferences || []) {
      const match = reference.match(/^(_(?:root|parent|global|level\d+))(?:\.([A-Za-z_$][\w$]*))?/);
      const binding = match ? `${match[1]}${match[2] ? `.${match[2]}` : ""}` : reference;
      if (!references.has(binding)) references.set(binding, {binding, references: new Set(), evidence: []});
      const item = references.get(binding);
      item.references.add(reference);
      item.evidence.push(block.evidence);
    }
  }
  return [...references.values()].sort((left, right) => compareText(left.binding, right.binding)).map((item) => ({
    binding: item.binding,
    references: [...item.references].sort(compareText),
    originalDefaultStatus: "unresolved-static-reference-only",
    fixtureRequirement: "do-not-inject-without-source-evidenced-host-default",
    safeFixture: {
      mode: "unresolved-no-fixture",
      originalBehaviorClaimed: false,
    },
    evidence: item.evidence,
  }));
}

function replayAndTerminal(blocks, timelineInventory) {
  const replayCandidates = blocks.filter((block) => (
    block.categories?.includes("replay-explicit")
    || block.signals?.transitions?.some(({target, arguments: argumentsValue}) => (
      /gotoAnd(?:Play|Stop)$/.test(target) && /^\s*1\s*$/.test(argumentsValue)
    ))
  )).map((block) => ({
    scriptId: block.id,
    script: block.script,
    event: block.event,
    scope: block.scope,
    transitions: block.signals.transitions,
    evidence: block.evidence,
  }));
  const stopCandidates = blocks.flatMap((block) => (block.signals?.calls || [])
    .filter(({target}) => /(?:^|\.)stop$/.test(target))
    .map((call) => ({
      scriptId: block.id,
      script: block.script,
      scope: block.scope,
      call,
      evidence: block.evidence,
    })));
  return {
    replayCandidates,
    stopCandidates,
    terminalStructuralFrames: timelineInventory.map(({timelineId, frameCount, evidence}) => ({
      timelineId,
      frame: frameCount,
      evidence,
    })),
    runtimeExecutionStatus: "unverified-static-candidates-only",
  };
}

function declaredScenarioObligations(manifest) {
  return (manifest.implementation?.frameDomains || []).flatMap((domain) => (
    (domain.scenarioIds || []).flatMap((scenarioId) => (
      (manifest.localization?.languages || []).map((language) => {
        const scenario = (manifest.scenarios || []).find(({id}) => id === scenarioId);
        return {
          frameDomainId: domain.id,
          sourceTimelineId: domain.sourceTimelineId,
          scenario: scenarioId,
          scenarioKind: scenario?.kind || "unresolved",
          language,
          seed: "0",
          requiredRange: {firstFrame: 1, lastFrame: domain.frameCount},
          baselineAuthorityRequirement: domain.kind === "root" && scenario?.kind === "linear"
            ? "original-runtime-frame-accurate"
            : "original-runtime-natural-trace",
          authorityStatus: "unresolved",
        };
      })
    ))
  ));
}

function scenarioUnknowns({manifest, timelineInventory, blocks}) {
  const reachableChildren = timelineInventory.filter(({structuralReachability}) => (
    structuralReachability === "reachable-from-root-placement-graph"
  ));
  const unknowns = [{
    id: "authoritative-original-runtime-traversal",
    statement: "Static SWF structure and ActionScript extraction do not prove original-runtime scenario reachability, event order, timing, terminal behavior, or Replay reset semantics.",
    resolution: "Execute every declared requirement in an authorized original runtime and retain hash-chained event, state, frame, and capture evidence.",
    evidence: {artifactId: "source-swf"},
  }];
  if (reachableChildren.length) {
    unknowns.push({
      id: "root-reachable-child-timeline-dispositions",
      statement: `${reachableChildren.length} child timeline(s) are structurally reachable from root and require hash-bound declared/composite/independent/nonvisual disposition evidence.`,
      timelineIds: reachableChildren.map(({timelineId}) => timelineId),
      resolution: "Run the frame-domain disposition audit; unsupported child classifications must remain unresolved.",
      evidence: {artifactId: "swfmill-xml"},
    });
  }
  for (const scenario of manifest.scenarios || []) {
    if (scenario.kind !== "interactive") continue;
    unknowns.push({
      id: `interactive-source-schedule-${scenario.id}`,
      statement: `The ${scenario.id} interaction scenario has no complete source-evidenced natural event/target/checkpoint schedule in this static inventory.`,
      resolution: "Derive an ordered schedule exclusively from source event targets and authorized-runtime state observations; do not copy product behavior.",
      evidence: blocks.find((block) => block.event?.length)?.evidence || {artifactId: "swfmill-xml"},
    });
  }
  if (manifest.runtime?.externalDependencies?.length) {
    unknowns.push({
      id: "original-host-context",
      statement: "One or more source-declared host dependencies remain separate from this standalone SWF structural inventory.",
      resolution: "Prove host defaults, language state, and externally triggered behavior from source or authorized original-host execution.",
      evidence: {artifactId: "migration-technical-contract"},
    });
  }
  return unknowns;
}

export function validateLegacyScenarioInventory(inventory) {
  assert(inventory.schemaVersion === 1, `${inventory.animationId}: scenario inventory schemaVersion must be 1`);
  assert(LEGACY_PILOT_IDS.includes(inventory.animationId), `${inventory.animationId}: unsupported legacy pilot`);
  assert(inventory.inventoryStatus === "static-exhaustive-runtime-unverified", `${inventory.animationId}: inventory must fail closed`);
  assert(inventory.migrationStatusChanged === false, `${inventory.animationId}: inventory cannot change migration status`);
  assertSha256(inventory.source?.swfSha256, `${inventory.animationId}: source SWF`);
  assert(Array.isArray(inventory.evidenceIndex) && inventory.evidenceIndex.length >= 6, `${inventory.animationId}: evidence index is incomplete`);
  for (const item of inventory.evidenceIndex) assertSha256(item.sha256, `${inventory.animationId}: ${item.artifactId}`);
  assert(inventory.timelineInventory?.[0]?.timelineId === "root", `${inventory.animationId}: root timeline must be first`);
  assert(inventory.timelineInventory[0].frameCount === inventory.source.rootFrameCount, `${inventory.animationId}: root frame count mismatch`);
  assert(Array.isArray(inventory.coverage?.declaredScenarioObligations) && inventory.coverage.declaredScenarioObligations.length > 0, `${inventory.animationId}: declared scenario obligations are missing`);
  assert(Array.isArray(inventory.unknowns) && inventory.unknowns.length > 0, `${inventory.animationId}: fail-closed unknowns are missing`);
  return true;
}

async function readWorkspace(id, {migrationsRoot, python}) {
  const workspace = path.join(migrationsRoot, id);
  const paths = {
    manifest: path.join(workspace, "migration.json"),
    report: path.join(workspace, "audit", "machine", "report.json"),
    scripts: path.join(workspace, "audit", "machine", "ffdec-scripts.txt.gz"),
    tags: path.join(workspace, "audit", "machine", "ffdec-tags.txt.gz"),
    swfmill: path.join(workspace, "audit", "machine", "swfmill.xml.gz"),
    inventory: path.join(workspace, "audit", "scenario-inventory.json"),
    coverage: path.join(workspace, "evidence", "full-frame-coverage.json"),
  };
  for (const candidate of Object.values(paths).filter((candidate) => candidate !== paths.inventory)) {
    assert(await exists(candidate), `${id}: required input is missing: ${portable(path.relative(projectRoot, candidate))}`);
  }
  const [manifestText, reportText, scriptsGzip, tagsGzip, swfmillGzip, coverageText] = await Promise.all([
    readFile(paths.manifest, "utf8"),
    readFile(paths.report, "utf8"),
    readFile(paths.scripts),
    readFile(paths.tags),
    readFile(paths.swfmill),
    readFile(paths.coverage, "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const report = JSON.parse(reportText);
  const coverage = JSON.parse(coverageText);
  assert(manifest.animationId === id && report.animationId === id && coverage.animationId === id, `${id}: document identity mismatch`);
  assert(coverage.schemaVersion === 2 && Array.isArray(coverage.requirements), `${id}: coverage must be schema v2`);
  const sourcePath = path.resolve(projectRoot, manifest.source.swf);
  const relativeSource = path.relative(preservedSourceRoot, sourcePath);
  assert(!relativeSource.startsWith("..") && !path.isAbsolute(relativeSource), `${id}: source SWF escapes preserved archive`);
  assert(await sha256File(sourcePath) === manifest.source.swfSha256, `${id}: preserved SWF hash differs from manifest`);

  const reportScripts = requiredOutput(report, "ffdec-scripts.txt.gz", id);
  const reportTags = requiredOutput(report, "ffdec-tags.txt.gz", id);
  const reportSwfmill = requiredOutput(report, "swfmill.xml.gz", id);
  for (const [bytes, descriptor, label] of [
    [scriptsGzip, reportScripts, "FFDec scripts"],
    [tagsGzip, reportTags, "FFDec tags"],
    [swfmillGzip, reportSwfmill, "swfmill XML"],
  ]) assert(sha256Bytes(bytes) === descriptor.sha256, `${id}: ${label} compressed SHA-256 mismatch`);
  const scriptText = gunzipSync(scriptsGzip).toString("utf8");
  const tagsText = gunzipSync(tagsGzip).toString("utf8");
  const swfmillText = gunzipSync(swfmillGzip);
  assert(sha256Bytes(scriptText) === reportScripts.uncompressedSha256, `${id}: FFDec scripts uncompressed SHA-256 mismatch`);
  assert(sha256Bytes(tagsText) === reportTags.uncompressedSha256, `${id}: FFDec tags uncompressed SHA-256 mismatch`);
  assert(sha256Bytes(swfmillText) === reportSwfmill.uncompressedSha256, `${id}: swfmill XML uncompressed SHA-256 mismatch`);

  const swfmill = await extractSwfmillEvidence(paths.swfmill, {python});
  const parsedScripts = parseScriptBundle(scriptText, {
    compressedSha256: reportScripts.sha256,
    contentSha256: reportScripts.uncompressedSha256,
  });
  const blocks = parsedScripts.blocks;
  const timelineInventory = buildLegacyTimelineInventory(blocks, swfmill);
  assert(timelineInventory[0]?.frameCount === manifest.runtime.frameCount, `${id}: SWF root frame count differs from migration runtime`);
  const replay = replayAndTerminal(blocks, timelineInventory);
  const safeSideEffects = sideEffects(blocks);
  const inventory = {
    schemaVersion: 1,
    artifactType: "legacy-pilot-static-scenario-inventory",
    animationId: id,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    authorityStatement: [
      "This inventory exhaustively indexes the hash-bound swfmill timeline graph and currently exported FFDec ActionScript for one formula or key-term pilot.",
      "Manifest scenarios are coverage obligations, not claims that static extraction proved original-runtime reachability or event ordering.",
      "No original-runtime endpoint, host bridge, network operation, current JavaScript output, approval, or migration status is executed or promoted by this generator.",
    ],
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: manifest.source.fla || null,
      flaSha256: manifest.source.flaSha256 || null,
      pairedFlaStatus: manifest.source.pairedFlaStatus,
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      actionScriptVersion: manifest.runtime.actionScriptVersion,
    },
    sourceContext: {
      collection: manifest.classification?.collection || "unknown",
      activeCoursePlacementRequired: false,
      hostDependencies: manifest.runtime.externalDependencies || [],
      note: "Formula and key-term pilots are inventoried from their preserved standalone SWF; any original host language/audio behavior remains a separate evidence obligation.",
    },
    evidenceIndex: [
      {artifactId: "source-swf", path: manifest.source.swf, sha256: manifest.source.swfSha256},
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: technicalManifestSha256(manifest),
        hashMode: "canonical-json-v1",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      {artifactId: "machine-report", path: "audit/machine/report.json", sha256: sha256Bytes(reportText)},
      {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: reportScripts.sha256, uncompressedSha256: reportScripts.uncompressedSha256},
      {artifactId: "ffdec-tags", path: "audit/machine/ffdec-tags.txt.gz", sha256: reportTags.sha256, uncompressedSha256: reportTags.uncompressedSha256},
      {artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: reportSwfmill.sha256, uncompressedSha256: reportSwfmill.uncompressedSha256},
    ],
    authoritativeRuntimeEvidence: [],
    staticExtraction: {
      ffdecExportedScriptCount: report.findings?.exportedScriptFileCount ?? blocks.length,
      indexedScriptBlockCount: blocks.length,
      ffdecTagDump: summarizeFfdecTags(tagsText),
      swfmillParser: swfmill.parser,
      definitionTypeCounts: Object.values(swfmill.definitionTypes || {}).reduce((counts, name) => ({
        ...counts,
        [name]: (counts[name] || 0) + 1,
      }), {}),
      structurallyReachableObjectCount: swfmill.structurallyReachableObjectIds.length,
      exportedSymbols: swfmill.exports,
    },
    timelineInventory,
    interactions: {
      handlers: blocks.filter((block) => block.event.length),
      nonEventScripts: blocks.filter((block) => !block.event.length),
      buttonDefinitions: swfmill.buttons,
      editTexts: swfmill.editTexts,
      replayAndTerminal: replay,
    },
    dependencies: {
      bindings: dependencies(blocks),
      flashVarsCandidates: [],
      safeSideEffectPolicy: safeSideEffects,
      fixtureRule: "Do not inject host variables, execute URLs, or infer defaults. Resolve every required binding from source or authorized original-host execution.",
    },
    coverage: {
      declaredScenarioObligations: declaredScenarioObligations(manifest),
      timelineStateCoverage: timelineInventory,
      handlerBehaviorGroups: handlerGroups(blocks),
      buttonTargetObligations: swfmill.buttons.map((button) => ({
        buttonObjectId: button.objectId,
        eventsEncodedByConditions: button.conditions,
        hitRecords: button.hitRecords,
        placements: button.placements,
        executionRule: "exercise every encoded event at every reachable placement in an authorized original runtime",
        evidence: {artifactId: "swfmill-xml", objectId: button.objectId},
      })),
      inputObligations: swfmill.editTexts,
      dragObligations: [],
      correctWrongObligations: [],
      conditionalBranchObligations: [],
      randomObligations: [],
      labeledStateObligations: timelineInventory.flatMap((timeline) => timeline.frameLabels.map((label) => ({
        timelineId: timeline.timelineId,
        ...label,
        evidence: timeline.evidence,
      }))),
      glossaryAndHyperlinkObligations: [],
      sectionMenuObligations: [],
      courseRouteObligations: [],
      replayAndTerminalObligations: replay,
      sideEffectObligations: safeSideEffects,
      dependencyFixtureObligations: dependencies(blocks),
      authoritativeRuntimeCoverage: [],
      minimumSetRule: [
        "Capture every one-indexed frame in every declared frame-domain requirement.",
        "Interactive scenarios require a source-evidenced natural trace; root direct seek proves only linear root visuals.",
        "Every structurally root-reachable child timeline must receive a hash-bound disposition; unresolved children block strict acceptance.",
        "Replay, pointer states, host language/audio controls, and terminal behavior remain separate behavior obligations.",
      ],
    },
    conflicts: [],
    unknowns: scenarioUnknowns({manifest, timelineInventory, blocks}),
    strictAcceptanceEffect: "none; this static inventory neither proves original-runtime behavior nor advances visual, RMSE, audio, human-review, owner-review, or migration-completion gates",
  };
  validateLegacyScenarioInventory(inventory);
  const inventoryText = renderJson(inventory);
  const inventorySha256 = sha256Bytes(inventoryText);
  const patchedCoverage = {
    ...coverage,
    requirements: coverage.requirements.map((requirement) => ({
      ...requirement,
      blockingEvidence: canonicalLegacyBlockingEvidence(requirement, inventorySha256),
    })),
  };
  const coverageOutputText = renderJson(patchedCoverage);
  const patchedManifest = {
    ...manifest,
    evidence: {
      ...manifest.evidence,
      evidenceHashes: {
        ...manifest.evidence?.evidenceHashes,
        fullFrameCoverage: sha256Bytes(coverageOutputText),
      },
    },
  };
  assert(patchedManifest.status === manifest.status, `${id}: generator cannot change migration status`);
  assert(JSON.stringify(patchedManifest.acceptance) === JSON.stringify(manifest.acceptance), `${id}: generator cannot change acceptance`);
  assert(technicalManifestSha256(patchedManifest) === technicalManifestSha256(manifest), `${id}: evidence refresh changed the technical manifest projection`);
  return {
    id,
    workspace,
    summary: {
      animationId: id,
      rootFrameCount: manifest.runtime.frameCount,
      timelineCount: timelineInventory.length,
      reachableChildTimelineCount: timelineInventory.filter(({structuralReachability}) => structuralReachability === "reachable-from-root-placement-graph").length,
      scenarioObligationCount: inventory.coverage.declaredScenarioObligations.length,
      interactionHandlerCount: inventory.interactions.handlers.length,
    },
    files: [
      {path: paths.inventory, expected: inventoryText},
      {path: paths.coverage, expected: coverageOutputText},
      {path: paths.manifest, expected: renderJson(patchedManifest)},
    ],
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    help: false,
    ids: [],
    migrationsRoot: defaultMigrationsRoot,
    python: "python3",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--id", "--migrations", "--python"].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      if (argument === "--id") options.ids.push(value);
      else if (argument === "--migrations") options.migrationsRoot = path.resolve(value);
      else options.python = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export async function buildLegacyScenarioInventories(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const ids = options.ids?.length ? options.ids : LEGACY_PILOT_IDS;
  const unknown = ids.filter((id) => !LEGACY_PILOT_IDS.includes(id));
  if (unknown.length) throw new Error(`Unknown legacy pilot ID(s): ${unknown.join(", ")}`);
  const prepared = [];
  for (const id of ids) prepared.push(await readWorkspace(id, {
    migrationsRoot,
    python: options.python || "python3",
  }));

  const results = [];
  for (const item of prepared) {
    for (const file of item.files) {
      if (options.check) {
        assert(await exists(file.path), `${item.id}: generated file is missing: ${portable(path.relative(projectRoot, file.path))}`);
        assert(await readFile(file.path, "utf8") === file.expected, `${item.id}: generated file is stale: ${portable(path.relative(projectRoot, file.path))}`);
      } else {
        await mkdir(path.dirname(file.path), {recursive: true});
        await writeFile(file.path, file.expected, "utf8");
      }
    }
    results.push({
      action: options.check ? "verified" : "written",
      ...item.summary,
    });
  }
  return results;
}

function usage() {
  return `Usage: node scripts/build-legacy-scenario-inventories.mjs [options]\n\nOptions:\n  --id <animation-id>       Build one of the six formula/key-term pilots; repeatable\n  --migrations <directory>  Migration root (default: migrations)\n  --python <command>        Python with xml.etree.ElementTree (default: python3)\n  --check                   Verify checked-in outputs without writing\n  --help                    Show this help\n\nThe command writes only audit/scenario-inventory.json, the inventory hash binding in coverage blockingEvidence, and the corresponding evidenceHashes.fullFrameCoverage digest. It never changes source assets, technical manifest identity, status, reviews, approvals, or baseline authority.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else {
      const results = await buildLegacyScenarioInventories(options);
      for (const result of results) {
        process.stdout.write(`${result.action}: ${result.animationId} (${result.timelineCount} timelines, ${result.reachableChildTimelineCount} reachable children, ${result.scenarioObligationCount} scenario obligations)\n`);
      }
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
