#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, realpath, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const MACHINE_REPORT = "reports/g4-l3-machine-source-audits.json";
const DEFAULT_JSON = "reports/g4-l3-static-source-event-index.json";
const DEFAULT_MARKDOWN = "reports/g4-l3-static-source-event-index.md";
const SHA256 = /^[a-f0-9]{64}$/;

const POINTER_EVENTS = new Set([
  "release", "releaseoutside", "press", "rollover", "rollout", "dragover", "dragout",
]);
const KEYBOARD_EVENTS = new Set(["keypress", "keydown", "keyup"]);
const MACHINE_SIGNAL_FAMILIES = Object.freeze({
  "mouse-events": "pointer-handler-candidates",
  "clip-events": "clip-event-candidates",
  "keyboard-events": "keyboard-event-candidates",
  "input-fields": "input-state-candidates",
  "score-or-answer-state": "scoring-or-answer-state-candidates",
  "random-calls": "random-branch-candidates",
  "replay-or-reset": "replay-or-reset-candidates",
  "timeline-navigation": "timeline-navigation-candidates",
  "branch-statements": "conditional-branch-candidates",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

export function canonicalJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readArtifact(root, relativePath) {
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `${relativePath} escapes project root`);
  const bytes = await readFile(absolute);
  return {path: portable(relative), bytes: bytes.length, sha256: sha256(bytes), value: bytes};
}

async function physicalSourceBinding(root, record, label) {
  invariant(record && typeof record.path === "string" && Number.isSafeInteger(record.bytes) && SHA256.test(record.sha256 || ""),
    `${label}: invalid upstream source record`);
  const sourceRoot = await realpath(path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES"));
  const absolute = path.resolve(root, record.path);
  const resolved = await realpath(absolute);
  invariant(resolved.startsWith(`${sourceRoot}${path.sep}`), `${label}: source resolves outside preserved archive`);
  const information = await stat(resolved);
  invariant(information.isFile() && information.size === record.bytes, `${label}: physical byte count mismatch`);
  const bytes = await readFile(resolved);
  invariant(sha256(bytes) === record.sha256, `${label}: physical SHA-256 mismatch`);
  return {...record, physicalHashVerified: true};
}

function parseEvent(raw) {
  const match = raw.match(/\b(onClipEvent|on)\s*\(([^)]*)\)/i);
  if (!match) return null;
  const syntax = match[1] === "onClipEvent" ? "onClipEvent" : "on";
  const events = match[2].split(",").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    const type = entry.match(/^([A-Za-z]+)/)?.[1] || entry;
    const normalized = type.toLowerCase();
    return {
      raw: entry,
      type,
      family: POINTER_EVENTS.has(normalized) ? "pointer"
        : KEYBOARD_EVENTS.has(normalized) ? "keyboard"
          : syntax === "onClipEvent" ? "clip-event" : "other-handler-event",
    };
  });
  return {syntax, sourceExpression: match[0], events};
}

/**
 * Parse only identifiers made source-exact by FFDec's exported path. The path
 * does not prove stage bounds, placement matrices, instance reachability, or
 * runtime dispatch.
 */
export function parseExportedScriptLocation(scriptFilePath) {
  const normalized = portable(scriptFilePath);
  const sprite = normalized.match(/(?:^|\/)DefineSprite_(\d+)(?:_[^/]*)?\/frame_(\d+)(?:\/|$)/);
  const rootFrame = normalized.match(/^frame_(\d+)(?:\/|$)/);
  const button = normalized.match(/(?:^|\/)DefineButton2?_(\d+)(?:_[^/]*)?(?:\/|$)/);
  const placement = normalized.match(/(?:^|\/)PlaceObject(?:2|3)?_(\d+)_(\d+)(?:_([^/]*))?(?:\/|$)/);
  const handler = parseEvent(normalized);
  const scope = sprite ? {
    kind: "sprite-frame",
    frameDomainCandidate: `sprite-${sprite[1]}`,
    spriteObjectId: Number(sprite[1]),
    frame: Number(sprite[2]),
    sourceExactFromExportPath: true,
  } : rootFrame ? {
    kind: "root-frame",
    frameDomainCandidate: "root",
    spriteObjectId: null,
    frame: Number(rootFrame[1]),
    sourceExactFromExportPath: true,
  } : button ? {
    kind: "button-definition",
    frameDomainCandidate: null,
    buttonObjectId: Number(button[1]),
    frame: null,
    sourceExactFromExportPath: true,
  } : {
    kind: "unresolved-exported-script-scope",
    frameDomainCandidate: null,
    frame: null,
    sourceExactFromExportPath: false,
  };
  const target = placement ? {
    kind: "placed-character-export-path",
    objectId: Number(placement[1]),
    depth: Number(placement[2]),
    exportedNameToken: placement[3] || null,
    ownerFrameDomainCandidate: scope.frameDomainCandidate,
    ownerFrame: scope.frame,
    sourceExactFromExportPath: true,
    stageBoundsResolved: false,
    runtimeDispatchEstablished: false,
  } : button ? {
    kind: "button-definition",
    objectId: Number(button[1]),
    sourceExactFromExportPath: true,
    stageBoundsResolved: false,
    runtimeDispatchEstablished: false,
  } : null;
  return {scope, handler: handler ? {...handler, target} : null};
}

function sourceEventRecord(machineItem, file, ordinal) {
  const signals = machineItem.scripts.signals
    .filter((signal) => signal.files.some((candidate) => candidate.path === file.path))
    .map((signal) => {
      const evidence = signal.files.find((candidate) => candidate.path === file.path);
      return {
        signalId: signal.id,
        occurrenceCount: evidence.occurrences,
        sourceLocation: {scriptPath: file.path, scriptSha256: file.sha256},
        upstreamPattern: signal.pattern,
        detailResolution: signal.id === "timeline-navigation" ? {
          exactOperationMethods: [],
          unresolvedPossibleMethods: ["gotoAndPlay", "gotoAndStop", "nextFrame", "prevFrame", "play", "stop"],
          reason: "The upstream machine audit retained only a category occurrence count, not script text, line numbers, call receiver, arguments, or the matched method.",
        } : null,
      };
    });
  const external = machineItem.scripts.externalApiCandidates
    .filter((signal) => signal.files.some((candidate) => candidate.path === file.path))
    .map((signal) => {
      const evidence = signal.files.find((candidate) => candidate.path === file.path);
      return {
        apiId: signal.id,
        kind: signal.kind,
        occurrenceCount: evidence.occurrences,
        sourceLocation: {scriptPath: file.path, scriptSha256: file.sha256},
        executedDuringAudit: false,
        exactCallArgumentsRetained: false,
      };
    });
  const parsed = parseExportedScriptLocation(file.path);
  const record = {
    sourceEventId: `source-event-${String(ordinal).padStart(4, "0")}`,
    script: {path: file.path, bytes: file.bytes, sha256: file.sha256},
    ...parsed,
    machineSignals: signals,
    externalApiCandidates: external,
    evidenceResolution: {
      scriptFileAndHashExact: true,
      eventExpressionExactWhenPresentInExportPath: Boolean(parsed.handler),
      targetIdentifierExactWhenPresentInExportPath: Boolean(parsed.handler?.target?.sourceExactFromExportPath),
      sourceLineNumbersRetainedUpstream: false,
      sourceBodyRetainedUpstream: false,
      runtimeReachabilityEstablished: false,
    },
  };
  record.sourceEventFingerprintSha256 = sha256(canonicalJson(record));
  return record;
}

function familyIdsForRecord(record) {
  const families = new Set();
  for (const event of record.handler?.events || []) {
    if (event.family === "pointer") families.add("pointer-handler-candidates");
    else if (event.family === "keyboard") families.add("keyboard-event-candidates");
    else if (event.family === "clip-event") families.add("clip-event-candidates");
    else families.add("other-handler-event-candidates");
  }
  for (const signal of record.machineSignals) {
    const family = MACHINE_SIGNAL_FAMILIES[signal.signalId];
    if (family) families.add(family);
  }
  if (record.externalApiCandidates.length) families.add("external-api-candidates");
  return [...families].sort(compareText);
}

export function buildCandidateFamilies(records) {
  const byFamily = new Map();
  for (const record of records) {
    for (const familyId of familyIdsForRecord(record)) {
      if (!byFamily.has(familyId)) byFamily.set(familyId, []);
      byFamily.get(familyId).push(record.sourceEventId);
    }
  }
  return [...byFamily.entries()].sort(([left], [right]) => compareText(left, right)).map(([familyId, sourceEventIds]) => ({
    familyId,
    classification: "static-source-candidate-family-only",
    sourceEventIds,
    runtimeScenarioIds: [],
    runtimeReachabilityEstablished: false,
    captureScheduleEstablished: false,
    deterministicSeedContractEstablished: false,
    acceptanceEffect: "none",
  }));
}

function itemCounts(records, families) {
  const handlers = records.filter((record) => record.handler);
  const eventEntries = handlers.flatMap((record) => record.handler.events);
  const occurrenceCount = (signalId) => records.reduce((sum, record) => sum +
    record.machineSignals.filter((signal) => signal.signalId === signalId).reduce((inner, signal) => inner + signal.occurrenceCount, 0), 0);
  return {
    indexedSourceEventFiles: records.length,
    handlerFiles: handlers.length,
    handlerEventTokens: eventEntries.length,
    pointerEventTokens: eventEntries.filter((event) => event.family === "pointer").length,
    keyboardEventTokens: eventEntries.filter((event) => event.family === "keyboard").length,
    clipEventTokens: eventEntries.filter((event) => event.family === "clip-event").length,
    timelineNavigationOccurrences: occurrenceCount("timeline-navigation"),
    keyboardSignalOccurrences: occurrenceCount("keyboard-events"),
    inputSignalOccurrences: occurrenceCount("input-fields"),
    scoringSignalOccurrences: occurrenceCount("score-or-answer-state"),
    randomCallOccurrences: occurrenceCount("random-calls"),
    replayOrResetOccurrences: occurrenceCount("replay-or-reset"),
    externalApiOccurrences: records.reduce((sum, record) => sum + record.externalApiCandidates.reduce((inner, api) => inner + api.occurrenceCount, 0), 0),
    languageScriptSignalOccurrences: 0,
    candidateFamilyCount: families.length,
  };
}

function validateMachineReport(machine) {
  invariant(machine?.schemaVersion === 1 && machine.reportType === "g4-l3-machine-source-audits", "Unexpected machine audit schema");
  invariant(machine.acceptance?.acceptanceNeutral === true, "Upstream machine audit is not acceptance-neutral");
  invariant(machine.items?.length === 40 && machine.lesson?.activeXmlReferencedPages === 39 && machine.lesson?.courseShells === 1,
    "Upstream machine audit is not the 39-page plus one-shell G4 L3 set");
  invariant(machine.summary?.exportedScriptFileCount === 1809, "Upstream machine script inventory count changed");
  return machine;
}

export async function buildStaticSourceEventIndex({root = projectRoot} = {}) {
  const machineArtifact = await readArtifact(root, MACHINE_REPORT);
  const machine = validateMachineReport(JSON.parse(machineArtifact.value.toString("utf8")));
  const items = [];
  for (const machineItem of machine.items) {
    const [swf, fla] = await Promise.all([
      physicalSourceBinding(root, machineItem.source.swf, `${machineItem.animationId} SWF`),
      machineItem.source.fla ? physicalSourceBinding(root, machineItem.source.fla, `${machineItem.animationId} FLA`) : null,
    ]);
    const signalPaths = new Set([
      ...machineItem.scripts.signals.flatMap((signal) => signal.files.map((file) => file.path)),
      ...machineItem.scripts.externalApiCandidates.flatMap((signal) => signal.files.map((file) => file.path)),
    ]);
    for (const file of machineItem.scripts.files) {
      if (parseExportedScriptLocation(file.path).handler) signalPaths.add(file.path);
    }
    const files = machineItem.scripts.files.filter((file) => signalPaths.has(file.path));
    const sourceEvents = files.map((file, index) => sourceEventRecord(machineItem, file, index + 1));
    const candidateScenarioFamilies = buildCandidateFamilies(sourceEvents);
    const item = {
      sequence: machineItem.sequence,
      animationId: machineItem.animationId,
      assetId: machineItem.assetId,
      releaseRole: machineItem.releaseRole,
      batch: machineItem.batch,
      classification: machineItem.classification,
      physicalSources: {swf, fla},
      upstreamMachineAudit: {
        auditFingerprintSha256: machineItem.auditFingerprintSha256,
        scriptEvidenceFingerprintSha256: machineItem.scripts.scriptEvidenceFingerprintSha256,
        scriptFileCount: machineItem.scripts.exportedScriptFileCount,
        scriptContentManifestSha256: machineItem.scripts.contentManifestSha256,
        normalizedScriptBundleSha256: machineItem.scripts.normalizedBundleSha256,
        fullScriptManifest: machineItem.scripts.files,
      },
      sourceEvents,
      candidateScenarioFamilies,
      counts: itemCounts(sourceEvents, candidateScenarioFamilies),
      parsingLimits: {
        upstreamScriptBodiesAvailable: false,
        upstreamSourceLineNumbersAvailable: false,
        exactTimelineOperationMethodsResolved: 0,
        languageScriptLexicalClassifierAvailable: false,
        languageScriptSignalsIndexed: 0,
        note: "The existing machine audit retained file hashes and category/file occurrence counts, but not ActionScript bodies, line numbers, exact timeline method matches, receivers, arguments, or a language lexical signal. Those details remain unresolved without a separately authorized source re-export.",
      },
      runtimeBoundary: {
        authoritativeRuntimeLaunched: false,
        runtimeReachabilityEstablished: false,
        runtimeScenarios: [],
        captureSchedules: [],
        deterministicSeedContracts: [],
        originalRuntimeBaselines: [],
        visualOrBehavioralParityEstablished: false,
        strictAcceptanceEstablished: false,
        humanOrOwnerAcceptanceEstablished: false,
      },
    };
    item.itemFingerprintSha256 = sha256(canonicalJson(item));
    items.push(item);
  }
  const sums = Object.keys(items[0].counts).reduce((result, key) => {
    result[key] = items.reduce((sum, item) => sum + item.counts[key], 0);
    return result;
  }, {});
  const generatorBytes = await readFile(scriptPath);
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "g4-l3-static-source-event-index",
    generator: {path: portable(path.relative(root, scriptPath)), version: SCHEMA_VERSION, sha256: sha256(generatorBytes)},
    sourceBindings: {
      machineAudit: {path: machineArtifact.path, bytes: machineArtifact.bytes, sha256: machineArtifact.sha256},
      machineAuditSetSha256: machine.summary.auditSetSha256,
      sourceArchive: machine.sourceBindings.sourceArchive,
      ffdecEvidenceCopiedFromMachineAudit: machine.sourceBindings.tools.ffdec,
      ffdecInvokedByThisGenerator: false,
      scriptBodiesReadByThisGenerator: false,
    },
    scope: {
      grade: 4,
      lesson: 3,
      activePages: 39,
      courseShells: 1,
      canonicalItems: 40,
      sourceScriptFilesBound: machine.summary.exportedScriptFileCount,
    },
    authority: {
      classification: "acceptance-neutral-static-source-candidate-index",
      statement: "The index binds static FFDec export paths, file hashes, upstream lexical-category counts, and source-exact identifiers encoded in paths. It does not establish event dispatch, runtime reachability, scenario schedules, random seeds, original-runtime behavior, parity, approval, or completion.",
      runtimeReachabilityEstablished: false,
      actualRuntimeScenarioCount: 0,
      captureScheduleCount: 0,
      deterministicSeedContractCount: 0,
      authoritativeRuntimeSessionCount: 0,
    },
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetsChanged: 0,
      migrationsChanged: 0,
      renderersChanged: 0,
      migrationStatusChanges: 0,
      completionLedgerChanges: 0,
      strictGateChanges: 0,
      reviewOrApprovalChanges: 0,
      runtimeSessions: 0,
    },
    summary: {
      canonicalItems: items.length,
      physicallyRehashedSwfs: items.filter((item) => item.physicalSources.swf.physicalHashVerified).length,
      physicallyRehashedFlas: items.filter((item) => item.physicalSources.fla?.physicalHashVerified).length,
      sourceScriptFilesBound: items.reduce((sum, item) => sum + item.upstreamMachineAudit.scriptFileCount, 0),
      ...sums,
      itemsWithCandidateFamilies: items.filter((item) => item.candidateScenarioFamilies.length).length,
      itemsWithRuntimeReachability: 0,
      exactTimelineOperationMethodsResolved: 0,
      itemSetSha256: sha256(canonicalJson(items.map((item) => ({animationId: item.animationId, itemFingerprintSha256: item.itemFingerprintSha256})))),
    },
    parsingLimitations: [
      "No FFDec process was run. The generator consumed only reports/g4-l3-machine-source-audits.json and physically rehashed its FLA/SWF source bindings.",
      "The upstream report has exact exported script paths/hashes and per-file category counts, but no ActionScript body or line numbers.",
      "Timeline-navigation occurrences cannot be separated into stop, play, gotoAndStop, gotoAndPlay, nextFrame, or prevFrame without script text; the method remains unresolved.",
      "No ActionScript-language lexical category was retained upstream. Language script signals therefore remain unresolved; catalog audio language counts are not substituted for code evidence.",
      "A source-exact handler/target identifier parsed from an export path is not proof of runtime placement, stage bounds, dispatch, reachability, or a scenario.",
    ],
    items,
  };
  return validateStaticSourceEventIndex(report);
}

export function validateStaticSourceEventIndex(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION && report.reportType === "g4-l3-static-source-event-index", "Static source-event schema mismatch");
  invariant(report.generator?.path === "scripts/build-g4-l3-static-source-event-index.mjs" && SHA256.test(report.generator.sha256 || ""),
    "Invalid generator binding");
  invariant(report.acceptance?.acceptanceNeutral === true, "Index must remain acceptance-neutral");
  for (const [field, value] of Object.entries(report.acceptance || {})) {
    if (field !== "acceptanceNeutral") invariant(value === 0, `acceptance.${field} must remain zero`);
  }
  invariant(report.sourceBindings?.ffdecInvokedByThisGenerator === false && report.sourceBindings.scriptBodiesReadByThisGenerator === false,
    "Index crossed its no-re-extraction boundary");
  invariant(report.scope?.canonicalItems === 40 && report.scope.activePages === 39 && report.scope.courseShells === 1,
    "Index must contain 39 pages plus one shell");
  invariant(Array.isArray(report.items) && report.items.length === 40 && new Set(report.items.map((item) => item.animationId)).size === 40,
    "Index must contain 40 unique canonical items");
  invariant(report.authority?.runtimeReachabilityEstablished === false && report.authority.actualRuntimeScenarioCount === 0 &&
    report.authority.captureScheduleCount === 0 && report.authority.deterministicSeedContractCount === 0,
  "Static candidate index must not claim runtime scenarios, schedules, or seeds");
  for (const item of report.items) {
    invariant(item.physicalSources?.swf?.physicalHashVerified === true && SHA256.test(item.physicalSources.swf.sha256 || ""),
      `${item.animationId}: invalid physical SWF binding`);
    if (item.physicalSources.fla) invariant(item.physicalSources.fla.physicalHashVerified === true,
      `${item.animationId}: invalid physical FLA binding`);
    invariant(item.upstreamMachineAudit?.scriptFileCount === item.upstreamMachineAudit.fullScriptManifest.length,
      `${item.animationId}: full script manifest count mismatch`);
    const manifest = new Map(item.upstreamMachineAudit.fullScriptManifest.map((file) => [file.path, file]));
    for (const event of item.sourceEvents) {
      const file = manifest.get(event.script.path);
      invariant(file?.sha256 === event.script.sha256 && file.bytes === event.script.bytes,
        `${item.animationId}: source event is not bound to the upstream script manifest`);
      invariant(event.evidenceResolution.runtimeReachabilityEstablished === false,
        `${item.animationId}: source event crossed runtime reachability boundary`);
      const copy = structuredClone(event);
      delete copy.sourceEventFingerprintSha256;
      invariant(event.sourceEventFingerprintSha256 === sha256(canonicalJson(copy)),
        `${item.animationId}: stale source-event fingerprint`);
    }
    invariant(item.candidateScenarioFamilies.every((family) => family.classification === "static-source-candidate-family-only" &&
      family.runtimeScenarioIds.length === 0 && family.runtimeReachabilityEstablished === false &&
      family.captureScheduleEstablished === false && family.deterministicSeedContractEstablished === false &&
      family.acceptanceEffect === "none"), `${item.animationId}: candidate family was promoted beyond static source evidence`);
    invariant(Object.values(item.runtimeBoundary).every((value) => value === false || (Array.isArray(value) && value.length === 0)),
      `${item.animationId}: runtime boundary contains promoted evidence`);
    invariant(item.parsingLimits.exactTimelineOperationMethodsResolved === 0 && item.parsingLimits.languageScriptSignalsIndexed === 0,
      `${item.animationId}: unavailable script detail was invented`);
    const copy = structuredClone(item);
    delete copy.itemFingerprintSha256;
    invariant(item.itemFingerprintSha256 === sha256(canonicalJson(copy)), `${item.animationId}: stale item fingerprint`);
  }
  const expectedSet = sha256(canonicalJson(report.items.map((item) => ({animationId: item.animationId, itemFingerprintSha256: item.itemFingerprintSha256}))));
  invariant(report.summary?.itemSetSha256 === expectedSet, "Stale item-set fingerprint");
  invariant(report.summary.sourceScriptFilesBound === 1809 && report.summary.physicallyRehashedSwfs === 40 &&
    report.summary.physicallyRehashedFlas === 29 && report.summary.itemsWithRuntimeReachability === 0 &&
    report.summary.exactTimelineOperationMethodsResolved === 0 && report.summary.languageScriptSignalOccurrences === 0,
  "Static source-event summary crossed a fixed evidence boundary");
  return report;
}

export function renderStaticSourceEventIndexMarkdown(report) {
  const rows = report.items.map((item) => `| ${item.sequence} | ${item.batch.batchId} | \`${item.animationId}\` | ` +
    `${item.upstreamMachineAudit.scriptFileCount} | ${item.counts.indexedSourceEventFiles} | ${item.counts.handlerFiles} | ` +
    `${item.counts.pointerEventTokens}/${item.counts.keyboardEventTokens}/${item.counts.clipEventTokens} | ` +
    `${item.counts.timelineNavigationOccurrences}/${item.counts.randomCallOccurrences}/${item.counts.externalApiOccurrences} | ` +
    `${item.counts.candidateFamilyCount} |`);
  return [
    "# G4 L3 Static Source-Event Candidate Index",
    "",
    "> Acceptance-neutral static source evidence only. Candidate families are not runtime scenarios, schedules, seeds, or acceptance evidence.",
    "",
    "## Result",
    "",
    `- Scope: **${report.summary.canonicalItems}** canonical items (39 active pages + 1 shell).`,
    `- Physical source rehash: **${report.summary.physicallyRehashedSwfs}/40 SWFs** and **${report.summary.physicallyRehashedFlas}/29 FLAs**.`,
    `- Bound upstream ActionScript manifest: **${report.summary.sourceScriptFilesBound}** exact exported file paths/hashes.`,
    `- Indexed event/signal files: **${report.summary.indexedSourceEventFiles}**; handler files: **${report.summary.handlerFiles}**.`,
    `- Exact handler tokens from export paths: pointer **${report.summary.pointerEventTokens}**, keyboard **${report.summary.keyboardEventTokens}**, clip-event **${report.summary.clipEventTokens}**.`,
    `- Upstream category occurrences: timeline-navigation **${report.summary.timelineNavigationOccurrences}**, keyboard **${report.summary.keyboardSignalOccurrences}**, input **${report.summary.inputSignalOccurrences}**, scoring/answer **${report.summary.scoringSignalOccurrences}**, random **${report.summary.randomCallOccurrences}**, Replay/reset **${report.summary.replayOrResetOccurrences}**, external API **${report.summary.externalApiOccurrences}**.`,
    `- Actual runtime scenarios/reachability: **0 / false**. Exact timeline methods resolved: **0**. Language code signals resolved: **0**.`,
    "",
    "## Per-item index",
    "",
    "`Events` is pointer/keyboard/clip-event handler tokens. `Signals` is timeline-navigation/random/external-API upstream occurrence counts.",
    "",
    "| # | Batch | Animation | AS files | Indexed | Handlers | Events | Signals | Candidate families |",
    "|---:|---|---|---:|---:|---:|---|---|---:|",
    ...rows,
    "",
    "## Parsing limitations",
    "",
    ...report.parsingLimitations.map((item) => `- ${item}`),
    "",
    "## Authority boundary",
    "",
    report.authority.statement,
    "",
  ].join("\n");
}

function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function safeOutput(root, relativePath, extension) {
  const reportsRoot = path.resolve(root, "reports");
  const output = path.resolve(root, relativePath);
  invariant(inside(reportsRoot, output) && path.extname(output) === extension, `Output must be a ${extension} file inside reports/`);
  let cursor = path.resolve(root);
  for (const part of path.relative(root, output).split(path.sep)) {
    cursor = path.join(cursor, part);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(!information?.isSymbolicLink(), `Output path contains symbolic link: ${cursor}`);
  }
  return output;
}

async function writeOrCheck(root, relativePath, expected, extension, check) {
  const output = await safeOutput(root, relativePath, extension);
  if (check) {
    const actual = await readFile(output, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(actual === expected, `${relativePath} is missing or stale`);
  } else {
    await mkdir(path.dirname(output), {recursive: true});
    await writeFile(output, expected);
  }
}

export function parseArguments(argv) {
  const options = {check: false, root: projectRoot, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--root", "--json-output", "--markdown-output"].includes(value)) {
      const next = argv[++index];
      invariant(next, `${value} requires a path`);
      if (value === "--root") options.root = path.resolve(next);
      else if (value === "--json-output") options.jsonOutput = next;
      else options.markdownOutput = next;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return "Usage: node scripts/build-g4-l3-static-source-event-index.mjs [--check] [--root path] [--json-output reports/file.json] [--markdown-output reports/file.md]\n";
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) return void process.stdout.write(usage());
  const report = await buildStaticSourceEventIndex({root: options.root});
  const json = canonicalJson(report);
  const markdown = renderStaticSourceEventIndexMarkdown(report);
  await Promise.all([
    writeOrCheck(options.root, options.jsonOutput, json, ".json", options.check),
    writeOrCheck(options.root, options.markdownOutput, markdown, ".md", options.check),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: G4 L3 static source-event index; ` +
    `${report.summary.canonicalItems} items; ${report.summary.indexedSourceEventFiles} indexed files; ` +
    `${report.summary.handlerFiles} handlers; runtime scenarios 0\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
