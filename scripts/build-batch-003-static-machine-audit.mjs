#!/usr/bin/env node

import {execFile} from "node:child_process";
import {constants as fsConstants} from "node:fs";
import {
  access,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
} from "node:fs/promises";
import {createHash} from "node:crypto";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

import {checkCompletionLedger} from "./build-completion-ledger.mjs";
import {
  parseSwfSourceFacts,
  summarizeScriptSources,
  writeOrCheckReport as writeSharedOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";
import {parseEmbeddedAudioPayloads} from "./build-g4-l3-embedded-audio-archive.mjs";
import {
  buildReuseGroups,
  collectSwfAssetDefinitions,
} from "./build-g4-l3-swf-asset-definition-census.mjs";
import {
  buildCandidateFamilies,
  canonicalJson,
  parseExportedScriptLocation,
} from "./build-g4-l3-static-source-event-index.mjs";
import {evaluateBatchScaffoldingGate, selectCatalogBatch} from "./scaffold-catalog-batch.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const BATCH_ID = "batch-003";
const QUEUE_ID = "grade-3-active";
const ARCHIVE_ONLY_PAYLOAD_FIELDS = new Set([
  "plannedArchivePath",
  "archivePath",
  "archiveWritten",
  "physicalHashVerified",
]);
const GRADE = 3;
const LESSON = 1;
const SOURCE_ROOT_RELATIVE = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "batch-003-static-machine-audit.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "batch-003-static-machine-audit.md");
const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export async function writeOrCheckReport(filePath, expected, options = {}) {
  const information = await lstat(path.resolve(filePath))
    .catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!information || information.isFile() || information.isSymbolicLink(),
    "Report output must be missing or an existing regular file");
  return writeSharedOrCheckReport(filePath, expected, options);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(filePath, root = projectRoot) {
  return portable(path.relative(root, filePath));
}

function countBy(values, selector) {
  const result = {};
  for (const value of values) {
    const key = String(selector(value));
    result[key] = (result[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => compareText(left, right)));
}

function sumBy(values, selector) {
  return values.reduce((total, value) => total + selector(value), 0);
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function boundFile(root, relativePath) {
  const absolute = path.resolve(root, relativePath);
  invariant(isWithin(path.resolve(root), absolute), `${relativePath}: input escapes project root`);
  const information = await lstat(absolute);
  invariant(information.isFile() && !information.isSymbolicLink(), `${relativePath}: input must be a regular non-symlink file`);
  const bytes = await readFile(absolute);
  return {
    bytes,
    binding: {
      path: portable(relativePath),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
  };
}

async function boundJson(root, relativePath) {
  const file = await boundFile(root, relativePath);
  return {...file, value: JSON.parse(file.bytes.toString("utf8"))};
}

function safeCatalogPath(value) {
  invariant(typeof value === "string" && value && !path.posix.isAbsolute(value), `Invalid catalog path: ${value}`);
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  invariant(normalized !== ".." && !normalized.startsWith("../") && normalized === value,
    `Catalog path escapes or is not normalized: ${value}`);
  return normalized;
}

function validateCatalogRecord(sourceFiles, record, label) {
  invariant(record && typeof record.path === "string" && Number.isSafeInteger(record.bytes) && SHA256.test(record.sha256 || ""),
    `${label}: invalid catalog source record`);
  const catalogRecord = sourceFiles.get(record.path);
  invariant(catalogRecord, `${label}: absent from catalog/source-files.json`);
  invariant(catalogRecord.bytes === record.bytes && catalogRecord.sha256 === record.sha256,
    `${label}: catalog/source-files.json identity mismatch`);
}

async function physicallyVerifiedSource({root, archiveReal, record, sourceFiles, label}) {
  validateCatalogRecord(sourceFiles, record, label);
  const relative = safeCatalogPath(record.path);
  const candidate = path.join(root, SOURCE_ROOT_RELATIVE, relative);
  const resolved = await realpath(candidate);
  invariant(isWithin(archiveReal, resolved), `${label}: source resolves outside frozen archive`);
  const information = await stat(resolved);
  invariant(information.isFile() && information.size === record.bytes, `${label}: physical byte count mismatch`);
  const bytes = await readFile(resolved);
  const observedSha256 = sha256(bytes);
  invariant(observedSha256 === record.sha256, `${label}: physical SHA-256 mismatch`);
  return {
    bytes,
    binding: {
      path: portable(path.relative(root, candidate)),
      bytes: bytes.length,
      sha256: observedSha256,
      physicalHashVerified: true,
    },
  };
}

async function walkFiles(directory, relative = "") {
  let entries;
  try {
    entries = await readdir(path.join(directory, relative), {withFileTypes: true});
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const next = relative ? path.join(relative, entry.name) : entry.name;
    invariant(!entry.isSymbolicLink(), `FFDec scratch output contains a symbolic link: ${next}`);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, next));
    else if (entry.isFile()) files.push(portable(next));
  }
  return files;
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean).map((entry) => path.join(entry, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return realpath(candidate);
    } catch {}
  }
  throw new Error(`Executable not found: ${command}`);
}

async function probeFfdec(command) {
  const launcher = await resolveExecutable(command);
  const {stdout, stderr} = await execFileAsync(command, ["-help"], {timeout: 30_000, maxBuffer: 4 * 1024 * 1024});
  const version = `${stdout}\n${stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  invariant(/^JPEXS Free Flash Decompiler v\.?\d/.test(version || ""), "Unrecognized FFDec version output");
  const launcherBytes = await readFile(launcher);
  const jarPath = path.join(path.dirname(launcher), "ffdec.jar");
  const jarBytes = await readFile(jarPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  return {
    command,
    version,
    launcherPath: launcher,
    launcherSha256: sha256(launcherBytes),
    ffdecJarSha256: jarBytes ? sha256(jarBytes) : null,
    executionPurpose: "static ActionScript export only",
    legacyCodeExecuted: false,
    networkEndpointsInvoked: 0,
  };
}

async function exportScriptsWithFfdec({command, sourcePath, outputRoot, assetSha256}) {
  invariant(SHA256.test(assetSha256), "FFDec export requires an exact source asset SHA-256");
  const target = path.join(outputRoot, assetSha256);
  await execFileAsync(command, [
    "-onerror", "abort",
    "-timeout", "30",
    "-exportTimeout", "120",
    "-exportFileTimeout", "30",
    "-export", "script",
    target,
    sourcePath,
  ], {timeout: 180_000, maxBuffer: 8 * 1024 * 1024}).catch((error) => {
    throw new Error(`FFDec static script export failed for ${sourcePath}: ${error.stderr || error.message}`);
  });
  const scriptsRoot = path.join(target, "scripts");
  const files = (await walkFiles(scriptsRoot)).filter((file) => file.toLowerCase().endsWith(".as"));
  return Promise.all(files.map(async (file) => ({
    path: file,
    text: await readFile(path.join(scriptsRoot, file), "utf8"),
  })));
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length);
  let next = 0;
  const workers = Array.from({length: Math.min(concurrency, values.length)}, async () => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= values.length) return;
      results[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function stripPrivatePayloads(value) {
  if (Buffer.isBuffer(value)) return undefined;
  if (Array.isArray(value)) return value.map(stripPrivatePayloads).filter((entry) => entry !== undefined);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !key.startsWith("_") && !ARCHIVE_ONLY_PAYLOAD_FIELDS.has(key))
    .map(([key, child]) => [key, stripPrivatePayloads(child)])
    .filter(([, child]) => child !== undefined));
}

function signalOccurrenceCount(signals, id) {
  return sumBy(signals.filter((signal) => signal.id === id), (signal) => signal.occurrences);
}

function buildStaticSourceCandidates(scripts) {
  const relevantPaths = new Set([
    ...scripts.signals.flatMap((signal) => signal.files.map((file) => file.path)),
    ...scripts.externalApiCandidates.flatMap((signal) => signal.files.map((file) => file.path)),
  ]);
  for (const file of scripts.files) {
    if (parseExportedScriptLocation(file.path).handler) relevantPaths.add(file.path);
  }
  const sourceEvents = scripts.files.filter((file) => relevantPaths.has(file.path)).map((file, index) => {
    const parsed = parseExportedScriptLocation(file.path);
    const record = {
      sourceEventId: `source-event-${String(index + 1).padStart(4, "0")}`,
      script: {path: file.path, bytes: file.bytes, sha256: file.sha256},
      ...parsed,
      machineSignals: scripts.signals.filter((signal) => signal.files.some((candidate) => candidate.path === file.path)).map((signal) => {
        const evidence = signal.files.find((candidate) => candidate.path === file.path);
        return {signalId: signal.id, occurrenceCount: evidence.occurrences};
      }),
      externalApiCandidates: scripts.externalApiCandidates
        .filter((api) => api.files.some((candidate) => candidate.path === file.path))
        .map((api) => {
          const evidence = api.files.find((candidate) => candidate.path === file.path);
          return {apiId: api.id, kind: api.kind, occurrenceCount: evidence.occurrences, executedDuringAudit: false};
        }),
      runtimeReachabilityEstablished: false,
    };
    record.sourceEventFingerprintSha256 = sha256(canonicalJson(record));
    return record;
  });
  const candidateFamilies = buildCandidateFamilies(sourceEvents);
  const handlerEvents = sourceEvents.flatMap((event) => event.handler?.events || []);
  return {
    sourceEvents,
    candidateFamilies,
    counts: {
      indexedSourceEventFiles: sourceEvents.length,
      handlerFiles: sourceEvents.filter((event) => event.handler).length,
      handlerEventTokens: handlerEvents.length,
      pointerEventTokens: handlerEvents.filter((event) => event.family === "pointer").length,
      keyboardEventTokens: handlerEvents.filter((event) => event.family === "keyboard").length,
      clipEventTokens: handlerEvents.filter((event) => event.family === "clip-event").length,
      timelineNavigationOccurrences: signalOccurrenceCount(scripts.signals, "timeline-navigation"),
      inputSignalOccurrences: signalOccurrenceCount(scripts.signals, "input-fields"),
      scoringSignalOccurrences: signalOccurrenceCount(scripts.signals, "score-or-answer-state"),
      randomCallOccurrences: signalOccurrenceCount(scripts.signals, "random-calls"),
      replayOrResetOccurrences: signalOccurrenceCount(scripts.signals, "replay-or-reset"),
      externalApiOccurrences: sumBy(scripts.externalApiCandidates, (api) => api.occurrences),
      candidateFamilyCount: candidateFamilies.length,
    },
    evidenceLimits: {
      runtimeReachabilityEstablished: false,
      runtimeScenarioIds: [],
      captureSchedules: [],
      deterministicSeedContracts: [],
      sourceBodiesRetained: false,
      sourceLineNumbersRetained: false,
    },
  };
}

function summarizeAssetDefinitions(parsed) {
  return {
    sourceFormat: parsed.sourceFormat,
    tagStream: parsed.tagStream,
    definitions: parsed.definitions,
    companions: parsed.companions,
    fontFacts: parsed.fontFacts,
    fontCompanionFacts: parsed.fontCompanionFacts,
    textFacts: parsed.textFacts,
    exactTextOccurrences: parsed.exactTextOccurrences,
    definitionManifestSha256: sha256(canonicalJson(parsed.definitions)),
    exactTextManifestSha256: sha256(canonicalJson(parsed.exactTextOccurrences)),
  };
}

function audioLanguageCounts(records) {
  return countBy(records, (record) => record.language || "und");
}

function batchSections(items) {
  return countBy(items, (item) => item.animation.classification.section?.code || "unresolved");
}

async function loadInputs(root) {
  const paths = {
    animations: "catalog/animations.json",
    batches: "catalog/batches.json",
    lessons: "catalog/lessons.json",
    audioGroups: "catalog/audio-groups.json",
    sourceFiles: "catalog/source-files.json",
    sourceFreeze: "catalog/source-freeze.json",
    completionLedger: "catalog/completion-ledger.json",
  };
  const loaded = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, relative]) => [
    key,
    await boundJson(root, relative),
  ])));
  loaded.sourceManifest = await boundFile(root, "catalog/source-manifest.sha256");
  return loaded;
}

export async function buildBatch003StaticMachineAudit({
  root = projectRoot,
  ffdec = "ffdec",
  concurrency = 4,
  toolProbe = probeFfdec,
  scriptExporter = exportScriptsWithFfdec,
  completionLedgerCheck = checkCompletionLedger,
} = {}) {
  root = path.resolve(root);
  invariant(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 8,
    "concurrency must be an integer from 1 through 8");
  const inputs = await loadInputs(root);
  const batch = selectCatalogBatch(inputs.batches.value, BATCH_ID);
  invariant(batch.queueId === QUEUE_ID && batch.canonicalAssetCount === 25 && batch.items.length === 25,
    "batch-003 must remain the 25-item grade-3-active slice");
  const lesson = inputs.lessons.value.lessons.find((candidate) => candidate.grade === GRADE && candidate.lesson === LESSON);
  invariant(lesson?.path === "HELP_COURSES/ELMGR3/L1/index.xml" && lesson.pageReferenceCount === 74,
    "catalog/lessons.json no longer contains the expected 74-page G3 L1 lesson");
  const sourceFiles = new Map(inputs.sourceFiles.value.files.map((file) => [file.path, file]));
  const canonicalById = new Map(inputs.animations.value.animations
    .filter((animation) => animation.isCanonical)
    .map((animation) => [animation.animationId, animation]));
  const allByAssetId = new Map();
  for (const animation of inputs.animations.value.animations) {
    if (!allByAssetId.has(animation.assetId)) allByAssetId.set(animation.assetId, []);
    allByAssetId.get(animation.assetId).push(animation);
  }
  const audioGroups = new Map((inputs.audioGroups.value.groups || []).map((group) => [group.groupId, group]));
  const selected = batch.items.map((batchItem) => {
    const animation = canonicalById.get(batchItem.canonicalAnimationId);
    invariant(animation, `Missing canonical animation ${batchItem.canonicalAnimationId}`);
    invariant(animation.assetId === batchItem.assetId && animation.assetId === `swf-${animation.source.sha256}`,
      `${animation.animationId}: batch/catalog asset identity mismatch`);
    invariant(animation.classification.collection === "course" && animation.classification.grade === GRADE &&
      animation.classification.lesson === LESSON && animation.flags.referenced && !animation.flags.variant && !animation.flags.shell,
    `${animation.animationId}: batch-003 classification scope changed`);
    const placements = [...(allByAssetId.get(animation.assetId) || [])].sort((left, right) => compareText(left.animationId, right.animationId));
    invariant(placements.length === batchItem.placementCount, `${animation.animationId}: placementCount differs from catalog`);
    const exactAudio = animation.audio?.exact || [];
    const groupedAudio = (animation.audio?.groupIds || []).flatMap((groupId) => {
      const group = audioGroups.get(groupId);
      invariant(group, `${animation.animationId}: missing audio group ${groupId}`);
      return group.files;
    });
    for (const record of [animation.source, ...(animation.pairedFla ? [animation.pairedFla] : []), ...exactAudio, ...groupedAudio]) {
      validateCatalogRecord(sourceFiles, record, `${animation.animationId} input`);
    }
    for (const placement of placements) {
      validateCatalogRecord(sourceFiles, placement.source, `${placement.animationId} placement SWF`);
      if (placement.pairedFla) validateCatalogRecord(sourceFiles, placement.pairedFla, `${placement.animationId} placement FLA`);
    }
    return {batchItem, animation, placements, exactAudio, groupedAudio};
  });
  invariant(new Set(selected.map(({animation}) => animation.assetId)).size === 25, "batch-003 canonical assets must remain unique");
  invariant(sumBy(selected, ({placements}) => placements.length) === 26, "batch-003 must retain 26 placement paths");
  invariant(batchSections(selected).IR === 1 && batchSections(selected).RW === 4 && batchSections(selected).VB === 16 &&
    batchSections(selected).IN === 3 && batchSections(selected).TI === 1,
  "batch-003 section composition changed");

  const ledgerCheck = await completionLedgerCheck({
    migrationsRoot: path.join(root, "migrations"),
    output: path.join(root, "catalog", "completion-ledger.json"),
  });
  invariant(ledgerCheck.ok === true, `completion ledger is ${ledgerCheck.reason || "not current"}`);
  const gate = evaluateBatchScaffoldingGate({
    batchDocument: inputs.batches.value,
    batchId: BATCH_ID,
    ledger: ledgerCheck.ledger,
    ledgerCurrent: true,
  });
  invariant(gate.open === false && gate.prerequisiteKind === "release-strict" &&
    gate.prerequisiteReleaseId === "lesson-g04-l03-negative-numbers" && gate.requiredAnimationIds.length === 40 &&
    gate.admittedAnimationIds.length === 0 && gate.missingAnimationIds.length === 40,
  "batch-003 complete-lesson strict prerequisite unexpectedly changed");
  invariant(inputs.completionLedger.value.summary?.strictComplete === 0 && inputs.completionLedger.value.entries?.length === 0,
    "batch-003 audit is permitted only while the bound ledger records zero strict completions");

  const archiveRoot = path.join(root, SOURCE_ROOT_RELATIVE);
  const archiveReal = await realpath(archiveRoot);
  const lessonXml = await physicallyVerifiedSource({
    root,
    archiveReal,
    record: {path: lesson.path, bytes: lesson.bytes, sha256: lesson.sha256},
    sourceFiles,
    label: "G3 L1 lesson XML",
  });
  const uniqueAudio = new Map();
  for (const selection of selected) {
    for (const record of [...selection.exactAudio, ...selection.groupedAudio]) uniqueAudio.set(record.path, record);
  }
  const audioRecords = [...uniqueAudio.values()].sort((left, right) => compareText(left.path, right.path));
  const physicallyVerifiedAudio = await mapWithConcurrency(audioRecords, concurrency, async (record) => {
    const verified = await physicallyVerifiedSource({root, archiveReal, record, sourceFiles, label: `catalog audio ${record.path}`});
    return {
      ...verified.binding,
      catalogLanguage: record.language || "und",
      association: record.association || "catalog",
      cueMappingEstablished: false,
      listeningAcceptanceEstablished: false,
    };
  });

  const scratchRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-batch-003-machine-audit-"));
  let ffdecEvidence;
  let audited;
  try {
    ffdecEvidence = await toolProbe(ffdec);
    audited = await mapWithConcurrency(selected, concurrency, async (selection) => {
      const {animation, placements} = selection;
      const canonicalSwf = await physicallyVerifiedSource({
        root, archiveReal, record: animation.source, sourceFiles, label: `${animation.animationId} canonical SWF`,
      });
      const [canonicalFla, placementBindings, exportedScripts] = await Promise.all([
        animation.pairedFla
          ? physicallyVerifiedSource({root, archiveReal, record: animation.pairedFla, sourceFiles, label: `${animation.animationId} canonical FLA`})
          : Promise.resolve(null),
        Promise.all(placements.map(async (placement) => {
          const [swf, fla] = await Promise.all([
            physicallyVerifiedSource({root, archiveReal, record: placement.source, sourceFiles, label: `${placement.animationId} placement SWF`}),
            placement.pairedFla
              ? physicallyVerifiedSource({root, archiveReal, record: placement.pairedFla, sourceFiles, label: `${placement.animationId} placement FLA`})
              : Promise.resolve(null),
          ]);
          return {
            animationId: placement.animationId,
            canonicalAnimationId: placement.canonicalAnimationId,
            isCanonical: placement.isCanonical,
            duplicateOf: placement.duplicateOf,
            referenced: placement.flags.referenced,
            variant: placement.flags.variant,
            variantKind: placement.flags.variantKind,
            source: {swf: swf.binding, fla: fla?.binding || null},
          };
        })),
        scriptExporter({
          command: ffdec,
          sourcePath: path.join(root, SOURCE_ROOT_RELATIVE, animation.source.path),
          outputRoot: scratchRoot,
          assetSha256: animation.source.sha256,
        }),
      ]);
      const structure = parseSwfSourceFacts(canonicalSwf.bytes);
      invariant(structure.header.signature === animation.source.swf.signature &&
        structure.header.version === animation.source.swf.version &&
        structure.header.stage.width === animation.source.swf.stage.width &&
        structure.header.stage.height === animation.source.swf.stage.height &&
        structure.header.fps === animation.source.swf.fps &&
        structure.header.rootFrameCount === animation.source.swf.frameCount,
      `${animation.animationId}: physical SWF metadata differs from catalog`);
      const scripts = summarizeScriptSources(exportedScripts, structure.actionScript);
      const staticSourceCandidates = buildStaticSourceCandidates(scripts);
      const assets = collectSwfAssetDefinitions(canonicalSwf.bytes);
      const embeddedAudio = stripPrivatePayloads(parseEmbeddedAudioPayloads(canonicalSwf.bytes));
      return {
        canonicalSwf,
        canonicalFla,
        placementBindings,
        structure,
        scripts,
        staticSourceCandidates,
        assets,
        embeddedAudio,
      };
    });
  } finally {
    await rm(scratchRoot, {recursive: true, force: true});
  }
  const scratchStillExists = await lstat(scratchRoot).then(() => true).catch((error) => error.code === "ENOENT" ? false : Promise.reject(error));
  invariant(scratchStillExists === false, "FFDec scratch directory was not removed");

  const audioByCatalogPath = new Map(physicallyVerifiedAudio.map((record) => [
    record.path.slice(`${SOURCE_ROOT_RELATIVE}/`.length),
    record,
  ]));
  const assetReuseItems = [];
  const items = selected.map((selection, index) => {
    const {batchItem, animation, exactAudio, groupedAudio} = selection;
    const evidence = audited[index];
    const associatedAudio = [...new Map([...exactAudio, ...groupedAudio].map((record) => [record.path, record])).values()]
      .sort((left, right) => compareText(left.path, right.path));
    const assets = summarizeAssetDefinitions(evidence.assets);
    assetReuseItems.push({
      sequence: index + 1,
      animationId: animation.animationId,
      source: {path: evidence.canonicalSwf.binding.path, sha256: evidence.canonicalSwf.binding.sha256},
      definitions: evidence.assets.definitions,
    });
    const item = {
      sequence: index + 1,
      batchOrdinal: index + 1,
      animationId: animation.animationId,
      assetId: animation.assetId,
      placementCount: batchItem.placementCount,
      classification: {
        collection: animation.classification.collection,
        grade: animation.classification.grade,
        lesson: animation.classification.lesson,
        lessonTitleRaw: animation.classification.lessonTitleRaw,
        lessonTitleDisplay: animation.classification.lessonTitleDisplay,
        section: animation.classification.section?.code || null,
        page: animation.classification.page?.number ?? null,
        titleRaw: animation.classification.titleRaw,
        titleDisplay: animation.classification.titleDisplay,
        domain: animation.classification.domain,
        status: animation.classification.status,
      },
      source: {
        sourceKind: animation.pairedFla ? "fla+swf" : "swf-only",
        canonical: {swf: evidence.canonicalSwf.binding, fla: evidence.canonicalFla?.binding || null},
        placements: evidence.placementBindings,
      },
      swf: evidence.structure,
      scripts: evidence.scripts,
      staticSourceCandidates: evidence.staticSourceCandidates,
      assetDefinitions: assets,
      embeddedAudio: evidence.embeddedAudio,
      catalogAudio: {
        associationCount: associatedAudio.length,
        groupIds: [...(animation.audio?.groupIds || [])].sort(compareText),
        catalogLanguageCounts: audioLanguageCounts(associatedAudio),
        allPhysicalHashesVerified: associatedAudio.every((record) => audioByCatalogPath.has(record.path)),
        files: associatedAudio.map((record) => audioByCatalogPath.get(record.path)),
        languageMappingEstablished: false,
        cueMappingEstablished: false,
        synchronizationEstablished: false,
        listeningAcceptanceEstablished: false,
      },
      evidenceLimits: {
        animateDocumentOpened: false,
        authoritativeRuntimeLaunched: false,
        runtimeReachabilityEstablished: false,
        frameDomainDispositionEstablished: false,
        visualBaselineEstablished: false,
        behavioralParityEstablished: false,
        bilingualAudioEstablished: false,
        humanVisualReviewEstablished: false,
        ownerAcceptanceEstablished: false,
        implementationAuthorized: false,
        strictCompletionEstablished: false,
      },
    };
    item.auditFingerprintSha256 = sha256(canonicalJson(item));
    return item;
  });
  const reuse = buildReuseGroups(assetReuseItems);
  const aliasRelationships = items.flatMap((item) => item.source.placements.length > 1 ? [{
    assetId: item.assetId,
    canonicalAnimationId: item.animationId,
    placementCount: item.source.placements.length,
    placements: item.source.placements.map((placement) => ({
      animationId: placement.animationId,
      isCanonical: placement.isCanonical,
      duplicateOf: placement.duplicateOf,
      swf: placement.source.swf,
      fla: placement.source.fla,
    })),
    sharedImplementationAllowed: true,
    placementRoutesAndContextRequireSeparateFutureValidation: true,
  }] : []);
  const categoryKeys = ["shape", "morph", "bitmap", "font", "text", "button", "sprite", "sound", "video", "binary"];
  const assetCategoryCounts = Object.fromEntries(categoryKeys.map((category) => [
    category,
    sumBy(items, (item) => item.assetDefinitions.tagStream.categoryCounts[category] || 0),
  ]));
  const eventCountKeys = Object.keys(items[0].staticSourceCandidates.counts);
  const staticEventCounts = Object.fromEntries(eventCountKeys.map((key) => [
    key,
    sumBy(items, (item) => item.staticSourceCandidates.counts[key]),
  ]));
  const embeddedTagNames = ["DefineSound", "SoundStreamHead", "SoundStreamHead2", "SoundStreamBlock"];
  const embeddedAudioTagCounts = Object.fromEntries(embeddedTagNames.map((name) => [
    name,
    sumBy(items, (item) => item.embeddedAudio.tagCounts[name]),
  ]));
  const sourceManifestSha256 = inputs.sourceManifest.binding.sha256;
  invariant(sourceManifestSha256 === inputs.sourceFreeze.value.manifestSha256,
    "catalog/source-manifest.sha256 no longer matches source-freeze manifestSha256");
  const generatorBytes = await readFile(scriptPath);
  const {launcherPath: _launcherPath, ...portableFfdecEvidence} = ffdecEvidence;
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "batch-003-static-machine-audit",
    generator: {
      path: projectPath(scriptPath, root),
      version: SCHEMA_VERSION,
      sha256: sha256(generatorBytes),
      reusedParsers: [
        "scripts/build-g4-l3-machine-source-audits.mjs#parseSwfSourceFacts",
        "scripts/build-g4-l3-machine-source-audits.mjs#summarizeScriptSources",
        "scripts/build-g4-l3-swf-asset-definition-census.mjs#collectSwfAssetDefinitions",
        "scripts/build-g4-l3-swf-asset-definition-census.mjs#buildReuseGroups",
        "scripts/build-g4-l3-embedded-audio-archive.mjs#parseEmbeddedAudioPayloads",
        "scripts/build-g4-l3-static-source-event-index.mjs#parseExportedScriptLocation",
        "scripts/build-g4-l3-static-source-event-index.mjs#buildCandidateFamilies",
        "scripts/scaffold-catalog-batch.mjs#evaluateBatchScaffoldingGate",
      ],
    },
    acceptance: {
      acceptanceNeutral: true,
      sourceAssetsChanged: 0,
      migrationsScaffoldedOrChanged: 0,
      migrationStatusChanges: 0,
      completionLedgerChanges: 0,
      routeOrRendererChanges: 0,
      reviewOrApprovalChanges: 0,
      strictGateChanges: 0,
      authoritativeRuntimeSessions: 0,
      animateDocumentsOpened: 0,
      ruffleSessions: 0,
      legacyEndpointInvocations: 0,
      implementationAuthorized: false,
      strictComplete: 0,
      statement:
        "This report is a deterministic acceptance-neutral static machine intake/audit for catalog batch-003 only. It physically re-hashes frozen inputs and statically parses SWF/FFDec evidence. It does not scaffold migrations, modify VB004 pins, open batch gates, launch Animate/Ruffle/original runtime, authorize renderer work, establish runtime reachability, prove bilingual audio, RMSE, behavior, human/owner review, parity, or completion.",
    },
    batchGate: {
      batchId: BATCH_ID,
      queueId: batch.queueId,
      open: gate.open,
      ledgerState: gate.ledgerState,
      reason: gate.reason,
      prerequisiteKind: gate.prerequisiteKind,
      prerequisiteBatchId: gate.prerequisiteBatchId,
      prerequisiteReleaseId: gate.prerequisiteReleaseId,
      requiredAnimationCount: gate.requiredAnimationIds.length,
      admittedAnimationCount: gate.admittedAnimationIds.length,
      missingAnimationCount: gate.missingAnimationIds.length,
      requiredAnimationIds: gate.requiredAnimationIds,
      admittedAnimationIds: gate.admittedAnimationIds,
      missingAnimationIds: gate.missingAnimationIds,
    },
    sourceBindings: {
      catalogs: Object.fromEntries(["animations", "batches", "lessons", "audioGroups", "sourceFiles", "sourceFreeze", "completionLedger"]
        .map((key) => [key, inputs[key].binding])),
      sourceManifest: inputs.sourceManifest.binding,
      sourceArchive: {
        path: SOURCE_ROOT_RELATIVE,
        fileCount: inputs.sourceFreeze.value.fileCount,
        totalBytes: inputs.sourceFreeze.value.totalBytes,
        manifestSha256: inputs.sourceFreeze.value.manifestSha256,
        checksumSetSha256: inputs.sourceFiles.value.checksumSetSha256,
        readOnlyEnforcedBySourceFreeze: inputs.sourceFreeze.value.readOnlyEnforced,
      },
      lessonXml: lessonXml.binding,
      ffdec: {
        ...portableFfdecEvidence,
        temporaryOutputRemoved: true,
      },
      completionLedgerCheck: {
        current: ledgerCheck.ok,
        reason: ledgerCheck.reason,
        generatedMarker: ledgerCheck.ledger.generatedMarker,
        strictComplete: ledgerCheck.ledger.summary.strictComplete,
      },
    },
    scope: {
      batchId: BATCH_ID,
      queueId: QUEUE_ID,
      grade: GRADE,
      lesson: LESSON,
      lessonTitleRaw: lesson.titleRaw,
      lessonTitleDisplay: lesson.titleDisplay,
      lessonDomain: lesson.domain,
      fullLessonActivePageReferences: lesson.pageReferenceCount,
      completeLessonAudit: false,
      canonicalAssets: items.length,
      placementPaths: sumBy(items, (item) => item.placementCount),
      sectionCounts: batchSections(selected),
      sectionAndPageSelection: items.map((item) => ({
        animationId: item.animationId,
        section: item.classification.section,
        page: item.classification.page,
      })),
    },
    aliasRelationships,
    audioInventory: {
      method: "catalog exact/group associations plus physical byte count and SHA-256 verification",
      associationCount: sumBy(items, (item) => item.catalogAudio.associationCount),
      uniqueFileCount: physicallyVerifiedAudio.length,
      totalBytes: sumBy(physicallyVerifiedAudio, (file) => file.bytes),
      catalogLanguageCounts: countBy(physicallyVerifiedAudio, (file) => file.catalogLanguage),
      allPhysicalHashesVerified: physicallyVerifiedAudio.every((file) => file.physicalHashVerified),
      languageMappingEstablished: false,
      cueMappingEstablished: false,
      synchronizationEstablished: false,
      listeningAcceptanceEstablished: false,
      files: physicallyVerifiedAudio,
    },
    assetReuse: {
      exactIdentityMethod: "tag code plus complete uncompressed raw tag payload",
      allIdentityCount: reuse.allIdentityCount,
      duplicateGroupCount: reuse.duplicateGroups.length,
      crossSwfReuseGroupCount: reuse.crossSwfReuseGroups.length,
      duplicateGroups: reuse.duplicateGroups,
      reuseManifestSha256: sha256(canonicalJson(reuse.duplicateGroups)),
    },
    summary: {
      canonicalAssets: items.length,
      placementPaths: sumBy(items, (item) => item.placementCount),
      physicallyRehashedCanonicalSwfs: items.filter((item) => item.source.canonical.swf.physicalHashVerified).length,
      physicallyRehashedPlacementSwfs: sumBy(items, (item) => item.source.placements.filter((placement) => placement.source.swf.physicalHashVerified).length),
      canonicalSwfBytes: sumBy(items, (item) => item.source.canonical.swf.bytes),
      rootFrameCountSum: sumBy(items, (item) => item.swf.header.rootFrameCount),
      flaBacked: items.filter((item) => item.source.canonical.fla).length,
      swfOnly: items.filter((item) => !item.source.canonical.fla).length,
      physicallyRehashedCanonicalFlas: items.filter((item) => item.source.canonical.fla?.physicalHashVerified).length,
      physicallyRehashedPlacementFlas: sumBy(items, (item) => item.source.placements.filter((placement) => placement.source.fla?.physicalHashVerified).length),
      canonicalFlaBytes: sumBy(items, (item) => item.source.canonical.fla?.bytes || 0),
      exportedScriptFileCount: sumBy(items, (item) => item.scripts.exportedScriptFileCount),
      assetDefinitionCount: sumBy(items, (item) => item.assetDefinitions.tagStream.definitionCount),
      assetDefinitionCategoryCounts: assetCategoryCounts,
      exactFontDefinitionFacts: sumBy(items, (item) => item.assetDefinitions.fontFacts.length),
      exactTextOccurrences: sumBy(items, (item) => item.assetDefinitions.exactTextOccurrences.length),
      staticSourceCandidateCounts: staticEventCounts,
      embeddedAudioTagCounts,
      itemsWithEmbeddedAudioTags: items.filter((item) => Object.values(item.embeddedAudio.tagCounts).some((count) => count > 0)).length,
      catalogAudioAssociations: sumBy(items, (item) => item.catalogAudio.associationCount),
      uniqueCatalogAudioFiles: physicallyVerifiedAudio.length,
      aliasRelationshipCount: aliasRelationships.length,
      selectedPilotWorkspacesExcludedFromWrites: items.filter(
        (item) => item.animationId === "course-g03-l01-vb-004",
      ).length,
      implementationAuthorized: 0,
      strictComplete: 0,
      itemSetSha256: sha256(canonicalJson(items.map((item) => ({
        animationId: item.animationId,
        assetId: item.assetId,
        auditFingerprintSha256: item.auditFingerprintSha256,
      })))),
    },
    evidenceLimitations: [
      "The 25 canonical assets are only the first fixed-size slice of the 74-page G3 L1 catalog lesson; this is not a complete-lesson audit.",
      "FFDec exports ActionScript statically into a temporary directory. No ActionScript, legacy endpoint, loader, or host bridge is executed.",
      "Static script paths and lexical candidates do not prove event dispatch, branch reachability, runtime scenarios, random schedules, frame-domain disposition, or original behavior.",
      "The 24 catalog MP3 records carry language=und. Their directory/name is not promoted to an English or Spanish claim.",
      "Embedded audio payload inventory does not establish language, cue mapping, synchronization, listening acceptance, Replay, or runtime reachability.",
      "The selected course-g03-l01-vb-004 pilot workspace and its protected reviewer pins are outside this report's write set and are not refreshed or promoted by it.",
      "No renderer, route, migration workspace, status, approval, completion ledger, source asset, or strict gate is changed.",
    ],
    items,
  };
  return validateBatch003StaticMachineAudit(report);
}

export function validateBatch003StaticMachineAudit(report) {
  invariant(report?.schemaVersion === SCHEMA_VERSION && report.reportType === "batch-003-static-machine-audit",
    "batch-003 static machine audit schema/type mismatch");
  invariant(report.generator?.path === "scripts/build-batch-003-static-machine-audit.mjs" && SHA256.test(report.generator.sha256 || ""),
    "invalid batch-003 generator binding");
  invariant(report.acceptance?.acceptanceNeutral === true, "batch-003 audit must remain acceptance-neutral");
  for (const [key, value] of Object.entries(report.acceptance)) {
    if (["acceptanceNeutral", "statement", "implementationAuthorized"].includes(key)) continue;
    invariant(value === 0, `acceptance.${key} must remain zero`);
  }
  invariant(report.acceptance.implementationAuthorized === false && report.acceptance.strictComplete === 0,
    "batch-003 audit cannot authorize implementation or strict completion");
  invariant(report.batchGate?.batchId === BATCH_ID && report.batchGate.queueId === QUEUE_ID && report.batchGate.open === false &&
    report.batchGate.prerequisiteKind === "release-strict" && report.batchGate.prerequisiteBatchId === null &&
    report.batchGate.prerequisiteReleaseId === "lesson-g04-l03-negative-numbers" && report.batchGate.requiredAnimationCount === 40 &&
    report.batchGate.admittedAnimationCount === 0 && report.batchGate.missingAnimationCount === 40,
  "batch-003 gate boundary changed");
  invariant(report.sourceBindings?.completionLedgerCheck?.current === true &&
    report.sourceBindings.completionLedgerCheck.strictComplete === 0,
  "completion ledger is not current and empty");
  invariant(report.sourceBindings?.ffdec?.legacyCodeExecuted === false &&
    report.sourceBindings.ffdec.networkEndpointsInvoked === 0 && report.sourceBindings.ffdec.temporaryOutputRemoved === true,
  "FFDec static/no-network/temporary-output boundary changed");
  invariant(report.scope?.grade === GRADE && report.scope.lesson === LESSON && report.scope.completeLessonAudit === false &&
    report.scope.fullLessonActivePageReferences === 74 && report.scope.canonicalAssets === 25 && report.scope.placementPaths === 26,
  "batch-003 scope changed");
  invariant(JSON.stringify(report.scope.sectionCounts) === JSON.stringify({IN: 3, IR: 1, RW: 4, TI: 1, VB: 16}),
    "batch-003 section composition changed");
  invariant(Array.isArray(report.items) && report.items.length === 25 &&
    new Set(report.items.map((item) => item.animationId)).size === 25 &&
    new Set(report.items.map((item) => item.assetId)).size === 25,
  "batch-003 canonical item identity changed");
  invariant(report.items.every((item) => item.swf.header.signature === "CWS" && item.swf.header.version === 6 &&
    item.swf.header.stage.width === 800 && item.swf.header.stage.height === 600 &&
    item.swf.header.fps === 12 && item.swf.header.rootFrameCount === 10),
  "batch-003 physical SWF metadata changed");
  invariant(report.summary?.canonicalAssets === 25 && report.summary.placementPaths === 26 &&
    report.summary.physicallyRehashedCanonicalSwfs === 25 && report.summary.physicallyRehashedPlacementSwfs === 26 &&
    report.summary.canonicalSwfBytes === 7_428_345 && report.summary.rootFrameCountSum === 250,
  "batch-003 SWF totals changed");
  invariant(report.summary.flaBacked === 18 && report.summary.swfOnly === 7 &&
    report.summary.physicallyRehashedCanonicalFlas === 18 && report.summary.physicallyRehashedPlacementFlas === 19 &&
    report.summary.canonicalFlaBytes === 38_204_416,
  "batch-003 FLA totals changed");
  invariant(report.audioInventory?.associationCount === 24 && report.audioInventory.uniqueFileCount === 24 &&
    report.audioInventory.totalBytes === 6_419_616 && report.audioInventory.allPhysicalHashesVerified === true &&
    JSON.stringify(report.audioInventory.catalogLanguageCounts) === JSON.stringify({und: 24}) &&
    report.audioInventory.languageMappingEstablished === false && report.audioInventory.cueMappingEstablished === false &&
    report.audioInventory.synchronizationEstablished === false && report.audioInventory.listeningAcceptanceEstablished === false,
  "batch-003 catalog audio boundary changed");
  invariant(report.aliasRelationships?.length === 1 &&
    report.aliasRelationships[0].canonicalAnimationId === "course-g03-l01-ir-001-f1ec7620" &&
    report.aliasRelationships[0].placementCount === 2 &&
    report.aliasRelationships[0].placements.some((placement) => placement.animationId === "course-g03-l01-rw-001"),
  "batch-003 exact alias placement relationship changed");
  invariant(report.items.every((item) => item.source.canonical.swf.physicalHashVerified &&
    item.source.placements.every((placement) => placement.source.swf.physicalHashVerified) &&
    item.evidenceLimits.implementationAuthorized === false && item.evidenceLimits.strictCompletionEstablished === false &&
    item.scripts.externalCallsExecutedDuringAudit === false),
  "batch-003 item physical/evidence boundary changed");
  invariant(report.summary.implementationAuthorized === 0 && report.summary.strictComplete === 0 &&
    report.summary.selectedPilotWorkspacesExcludedFromWrites === 1,
  "batch-003 implementation/protected-workspace boundary changed");
  for (const item of report.items) {
    const {auditFingerprintSha256, ...fingerprintedItem} = item;
    invariant(auditFingerprintSha256 === sha256(canonicalJson(fingerprintedItem)),
      `${item.animationId}: batch-003 item audit fingerprint is stale`);
  }
  const expectedItemSet = sha256(canonicalJson(report.items.map((item) => ({
    animationId: item.animationId,
    assetId: item.assetId,
    auditFingerprintSha256: item.auditFingerprintSha256,
  }))));
  invariant(report.summary.itemSetSha256 === expectedItemSet, "batch-003 item-set fingerprint is stale");
  return report;
}

export function renderBatch003StaticMachineAuditMarkdown(report) {
  validateBatch003StaticMachineAudit(report);
  const rows = report.items.map((item) => `| ${[
    item.sequence,
    `\`${item.animationId}\``,
    `${item.classification.section}/${item.classification.page}`,
    item.source.sourceKind,
    item.placementCount,
    item.scripts.exportedScriptFileCount,
    item.assetDefinitions.tagStream.definitionCount,
    Object.values(item.embeddedAudio.tagCounts).reduce((sum, count) => sum + count, 0),
    item.catalogAudio.associationCount,
  ].join(" | ")} |`);
  return [
    "# Batch-003 acceptance-neutral static machine audit",
    "",
    "> Static source intake/audit only. The batch gate remains closed; no migration, renderer, route, approval, ledger, protected pin, or source file is changed.",
    "",
    "## Exact scope",
    "",
    `- Catalog queue: \`${report.scope.queueId}\`, batch: \`${report.scope.batchId}\`.`,
    `- G3 L1 ${report.scope.lessonTitleDisplay}: **${report.scope.canonicalAssets} canonical assets / ${report.scope.placementPaths} placement paths**.`,
    `- This fixed-size batch is only part of the ${report.scope.fullLessonActivePageReferences}-page lesson; complete-lesson audit: **no**.`,
    `- Sections: IR ${report.scope.sectionCounts.IR}, RW ${report.scope.sectionCounts.RW}, VB ${report.scope.sectionCounts.VB}, IN ${report.scope.sectionCounts.IN}, TI ${report.scope.sectionCounts.TI}.`,
    "",
    "## Gate and acceptance boundary",
    "",
    `- Batch-003 gate: **closed**; prerequisite release \`${report.batchGate.prerequisiteReleaseId}\`: ${report.batchGate.admittedAnimationCount}/${report.batchGate.requiredAnimationCount} admitted.`,
    `- Reason: ${report.batchGate.reason}.`,
    "- Implementation authorizations: **0**; strict completions: **0**.",
    "- Animate/Ruffle/original-runtime sessions: **0 / 0 / 0**.",
    "",
    "## Verified machine evidence",
    "",
    `- SWFs: ${report.summary.physicallyRehashedCanonicalSwfs}/${report.summary.canonicalAssets} canonical and ${report.summary.physicallyRehashedPlacementSwfs}/${report.summary.placementPaths} placement paths physically re-hashed.`,
    `- FLA: ${report.summary.flaBacked} canonical FLA-backed, ${report.summary.swfOnly} SWF-only; ${report.summary.physicallyRehashedPlacementFlas} placement FLA paths physically re-hashed.`,
    `- Native SWF facts: CWS v6, 800×600, 12 FPS, ${report.summary.rootFrameCountSum} root frames total.`,
    `- FFDec normalized ActionScript exports: ${report.summary.exportedScriptFileCount} files; temporary output removed: ${report.sourceBindings.ffdec.temporaryOutputRemoved ? "yes" : "no"}.`,
    `- Asset definitions: ${report.summary.assetDefinitionCount}; exact font facts: ${report.summary.exactFontDefinitionFacts}; exact text occurrences: ${report.summary.exactTextOccurrences}.`,
    `- Embedded audio tags: ${Object.entries(report.summary.embeddedAudioTagCounts).map(([name, count]) => `${name}=${count}`).join(", ")}.`,
    `- Catalog audio: ${report.audioInventory.uniqueFileCount} files / ${report.audioInventory.totalBytes} bytes, all physically re-hashed; catalog language is \`und\` for all ${report.audioInventory.uniqueFileCount}.`,
    `- Exact asset reuse groups across SWFs: ${report.assetReuse.crossSwfReuseGroupCount}.`,
    "",
    "## Items",
    "",
    "| # | Animation | Section/page | Source | Placements | AS files | Definitions | Embedded tags | Catalog MP3 |",
    "| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
    "## Alias placement",
    "",
    `- \`${report.aliasRelationships[0].canonicalAnimationId}\` and \`course-g03-l01-rw-001\` retain two source placements over one exact SWF/FLA binary identity. Future route/context validation remains separate.`,
    "",
    "## Evidence limits",
    "",
    ...report.evidenceLimitations.map((limit) => `- ${limit}`),
    "",
    `Audit item-set SHA-256: \`${report.summary.itemSetSha256}\`.`,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {
    check: false,
    ffdec: "ffdec",
    concurrency: 4,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (["--ffdec", "--concurrency", "--json-output", "--markdown-output"].includes(argument)) {
      const value = argv[++index];
      invariant(value, `${argument} requires a value`);
      if (argument === "--ffdec") options.ffdec = value;
      else if (argument === "--concurrency") {
        options.concurrency = Number(value);
        invariant(Number.isInteger(options.concurrency) && options.concurrency >= 1 && options.concurrency <= 8,
          "--concurrency must be an integer from 1 through 8");
      } else if (argument === "--json-output") options.jsonOutput = path.resolve(value);
      else options.markdownOutput = path.resolve(value);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return "Usage: node scripts/build-batch-003-static-machine-audit.mjs [options]\n\n" +
    "  --check                    Re-extract and compare checked-in reports byte-for-byte\n" +
    "  --ffdec <command>          FFDec launcher (default: ffdec)\n" +
    "  --concurrency <1-8>        Concurrent static audits (default: 4)\n" +
    "  --json-output <path>       JSON output inside reports/\n" +
    "  --markdown-output <path>   Markdown output inside reports/\n";
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const report = await buildBatch003StaticMachineAudit({ffdec: options.ffdec, concurrency: options.concurrency});
  const json = canonicalJson(report);
  const markdown = renderBatch003StaticMachineAuditMarkdown(report);
  await Promise.all([
    writeOrCheckReport(options.jsonOutput, json, {root: projectRoot, extension: ".json", check: options.check}),
    writeOrCheckReport(options.markdownOutput, markdown, {root: projectRoot, extension: ".md", check: options.check}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: batch-003 acceptance-neutral static machine audit; ` +
    `${report.summary.canonicalAssets} canonical / ${report.summary.placementPaths} placements; ` +
    `${report.summary.exportedScriptFileCount} scripts; ${report.summary.assetDefinitionCount} definitions; gate closed\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
