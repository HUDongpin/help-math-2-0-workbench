#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  lstat,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {inflateSync} from "node:zlib";

import {checkCompletionLedger} from "./build-completion-ledger.mjs";
import {sha256File} from "./create-flash-migration.mjs";
import {evaluateBatchScaffoldingGate} from "./scaffold-catalog-batch.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SOURCE_ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const RELEASE_QUEUE_ID = "release-g04-l03-negative-numbers";
const REPORT_VERSION = 1;

const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-automation-preflight.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-automation-preflight.md");

const NETWORK_API_NAMES = Object.freeze([
  "ExternalInterface",
  "FlashVars",
  "Loader",
  "NetConnection",
  "SharedObject",
  "Socket",
  "URLRequest",
  "XMLSocket",
  "fscommand",
  "getURL",
  "loadMovie",
  "loadMovieNum",
  "navigateToURL",
]);

const SECTION_REUSE_CANDIDATES = Object.freeze({
  IR: "course-g04-l01-ir-001",
  RW: "course-g05-l13-rw-002",
  VB: "course-g03-l01-vb-004",
  IN: "course-g04-l03-in-009",
  TI: "course-g03-l06-ti-001",
  GS: "course-g04-l09-gs-002",
  TS: "course-g03-l01-ts-008",
  FQ: "course-g03-l06-fq-002-review",
  SHELL: "shell-course-g04-l01-index-local",
});

const TAG_NAMES = Object.freeze({
  0: "End",
  7: "DefineButton",
  12: "DoAction",
  14: "DefineSound",
  15: "StartSound",
  17: "DefineButtonSound",
  18: "SoundStreamHead",
  19: "SoundStreamBlock",
  23: "DefineButtonCxform",
  26: "PlaceObject2",
  34: "DefineButton2",
  37: "DefineEditText",
  39: "DefineSprite",
  45: "SoundStreamHead2",
  59: "DoInitAction",
  69: "FileAttributes",
  70: "PlaceObject3",
  72: "DoABCDefine",
  82: "DoABC",
  89: "StartSound2",
});

const BLOCKER_DEFINITIONS = Object.freeze({
  "workspace-not-scaffolded-by-design":
    "No migration workspace exists yet; the open parallel-shard scaffold gate does not itself create one.",
  "paired-fla-missing":
    "No paired FLA is present, so authoring-timeline, library, script, font, and symbol confidence is reduced.",
  "source-audit-incomplete":
    "This machine triage is not the required FFDec/swfmill/Animate/runtime source audit.",
  "authoritative-baseline-pending":
    "An authorized original-runtime baseline and reachable scenario traversal are not established by this report.",
  "audio-cue-mapping-or-acceptance-pending":
    "Catalog audio association does not prove cue reachability, timing, bilingual listening quality, or acceptance.",
  "visual-behavior-human-owner-gates-pending":
    "Full-frame RMSE, behavior, product QA, engineering, strict human, and owner gates remain separate and pending.",
  "existing-js-is-non-authoritative":
    "The existing JavaScript implementation is reusable engineering work only; it is not original-runtime parity or strict completion.",
});

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

function assertLexicalReportOutput(filePath, {
  root = projectRoot,
  label = "report output",
} = {}) {
  const resolvedRoot = path.resolve(root);
  const reportsRoot = path.join(resolvedRoot, "reports");
  const output = path.resolve(filePath);
  if (!isWithin(reportsRoot, output)) {
    throw new Error(`${label} must be a file inside ${reportsRoot}`);
  }
  const protectedRoot = path.join(resolvedRoot, "source-assets");
  if (output === protectedRoot || isWithin(protectedRoot, output)) {
    throw new Error(`${label} must not be inside source-assets`);
  }
  return {resolvedRoot, reportsRoot, output};
}

export async function assertSafeReportOutput(filePath, {
  root = projectRoot,
  label = "report output",
} = {}) {
  const {resolvedRoot, reportsRoot, output} = assertLexicalReportOutput(filePath, {root, label});
  const relative = path.relative(resolvedRoot, output);
  let cursor = resolvedRoot;
  for (const component of relative.split(path.sep)) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (!information) continue;
    if (information.isSymbolicLink()) {
      throw new Error(`${label} has a symbolic-link path component: ${cursor}`);
    }
  }
  const outputInfo = await lstat(output).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (outputInfo?.isDirectory()) throw new Error(`${label} must be a file, not a directory`);
  if (outputInfo && outputInfo.nlink > 1) throw new Error(`${label} must not be a hard-linked file`);

  const realProjectRoot = await realpath(resolvedRoot);
  const realReportsRoot = await realpath(reportsRoot).catch((error) => {
    if (error.code === "ENOENT") return path.join(realProjectRoot, "reports");
    throw error;
  });
  if (!isWithin(realProjectRoot, realReportsRoot) && realReportsRoot !== path.join(realProjectRoot, "reports")) {
    throw new Error(`${label}: reports root resolves outside the project`);
  }
  const existingParent = await realpath(path.dirname(output)).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existingParent && existingParent !== realReportsRoot && !isWithin(realReportsRoot, existingParent)) {
    throw new Error(`${label} resolves outside the real reports directory`);
  }
  return output;
}

async function readJsonWithBinding(filePath) {
  const bytes = await readFile(filePath);
  return {
    value: JSON.parse(bytes.toString("utf8")),
    binding: {
      path: path.relative(projectRoot, filePath).split(path.sep).join("/"),
      sha256: sha256Bytes(bytes),
      bytes: bytes.length,
    },
  };
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
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
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, next));
    else if (entry.isFile()) files.push(next.split(path.sep).join("/"));
  }
  return files;
}

async function runCommand(command, args, {cwd = projectRoot, timeoutMs = 120_000} = {}) {
  let stdout = "";
  let stderr = "";
  let timedOut = false;
  let spawnError = "";
  const result = await new Promise((resolve) => {
    const child = spawn(command, args, {cwd, stdio: ["ignore", "pipe", "pipe"]});
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.once("error", (error) => {
      spawnError = error.message;
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      resolve({code, signal});
    });
  });
  return {
    ...result,
    stdout: stdout.replace(/\u001b\[[0-9;]*m/g, ""),
    stderr: stderr.replace(/\u001b\[[0-9;]*m/g, ""),
    timedOut,
    spawnError,
    ok: result.code === 0 && !timedOut && !spawnError,
  };
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function candidateCounts(text, names) {
  const candidates = [];
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const occurrences = countMatches(text, new RegExp(`\\b${escaped}\\b`, "gi"));
    if (occurrences) candidates.push({name, occurrences});
  }
  const xmlLoad = countMatches(text, /\bXML\s*\.\s*load\b/gi);
  if (xmlLoad) candidates.push({name: "XML.load", occurrences: xmlLoad});
  return candidates;
}

function normalizeActionScriptSource(source) {
  return {
    path: source.path.split(path.sep).join("/"),
    text: source.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
  };
}

export function summarizeActionScriptSources(sources, tagSummary, {
  rootFrameCount = 1,
  shell = false,
} = {}) {
  const normalized = sources.map(normalizeActionScriptSource).sort((left, right) => compareText(left.path, right.path));
  const text = normalized.map((source) => `/* ${source.path} */\n${source.text}`).join("\n");
  const paths = normalized.map((source) => source.path);
  const buttonHandlers = paths.filter((sourcePath) => /DefineButton|BUTTONCONDACTION/i.test(sourcePath)).length;
  const clipEventHandlers = paths.filter((sourcePath) => /CLIPACTION|onClipEvent/i.test(sourcePath)).length +
    countMatches(text, /\bonClipEvent\s*\(/gi);
  const frameScripts = paths.filter((sourcePath) => /(?:^|\/)frame_\d+\//i.test(sourcePath)).length;
  const branchStatements = countMatches(text, /\b(?:if|switch)\s*\(/gi);
  const randomCalls = countMatches(text, /\b(?:Math\s*\.\s*)?random\s*\(/gi);
  const interactionSignals = [
    {name: "button-handlers", occurrences: buttonHandlers},
    {name: "clip-event-handlers", occurrences: clipEventHandlers},
    {name: "mouse-events", occurrences: countMatches(text, /\bon\s*\(\s*(?:release|press|rollOver|rollOut|dragOver|dragOut)\b/gi)},
    {name: "keyboard-events", occurrences: countMatches(text, /\b(?:Key\s*\.|keyCode|onKey(?:Down|Up)?)\b/gi)},
    {name: "input-fields", occurrences: countMatches(text, /\b(?:TextField|Selection|onChanged|input)\b/gi)},
    {name: "score-or-answer-state", occurrences: countMatches(text, /\b(?:score|correct|incorrect|answer|attempt)\b/gi)},
    {name: "replay-or-reset", occurrences: countMatches(text, /\b(?:replay|reset)\b|gotoAndPlay\s*\(\s*(?:1|\"1\")/gi)},
  ].filter((candidate) => candidate.occurrences > 0);
  const externalCallCandidates = candidateCounts(text, NETWORK_API_NAMES);
  const avm1 = tagSummary.scriptTags.DoAction > 0 ||
    tagSummary.scriptTags.DoInitAction > 0 ||
    normalized.length > 0;
  const avm2 = tagSummary.scriptTags.DoABC > 0 || tagSummary.scriptTags.DoABCDefine > 0 || tagSummary.actionScript3Flag;
  const actionScriptVersion = avm1 && avm2
    ? "hybrid-avm1-avm2"
    : avm2
      ? "AS3"
      : avm1
        ? "AS1/2"
        : "none-detected";
  let score = 0;
  if (normalized.length) score += 1;
  if (normalized.length >= 6) score += 1;
  if (buttonHandlers || clipEventHandlers || interactionSignals.length) score += 2;
  if (branchStatements) score += 1;
  if (randomCalls) score += 2;
  if (externalCallCandidates.length) score += 2;
  if (tagSummary.buttonDefinitionCount) score += 1;
  if (tagSummary.editTextDefinitionCount) score += 1;
  if (rootFrameCount > 10) score += 1;
  if (shell) score += 2;
  const level = score >= 7 ? "high" : score >= 3 ? "medium" : "low";
  return {
    basis: "deterministic-machine-triage; requires full source and runtime audit",
    level,
    score,
    actionScript: {
      version: actionScriptVersion,
      exportedScriptFileCount: normalized.length,
      frameScriptFileCount: frameScripts,
      buttonHandlerFileCount: buttonHandlers,
      clipEventHandlerCount: clipEventHandlers,
      branchStatementCandidates: branchStatements,
      scriptTags: tagSummary.scriptTags,
    },
    interaction: {
      detected: Boolean(
        buttonHandlers ||
        clipEventHandlers ||
        interactionSignals.length ||
        tagSummary.buttonDefinitionCount ||
        tagSummary.editTextDefinitionCount
      ),
      buttonDefinitionTags: tagSummary.buttonDefinitionCount,
      editTextDefinitionTags: tagSummary.editTextDefinitionCount,
      signals: interactionSignals,
    },
    random: {
      detected: randomCalls > 0,
      callCandidates: randomCalls,
    },
    externalCalls: {
      detected: externalCallCandidates.length > 0,
      candidates: externalCallCandidates,
    },
  };
}

function decompressSwf(bytes) {
  const signature = bytes.subarray(0, 3).toString("ascii");
  if (signature === "FWS") return Buffer.from(bytes);
  if (signature === "CWS") {
    const result = Buffer.concat([Buffer.from("FWS"), bytes.subarray(3, 8), inflateSync(bytes.subarray(8))]);
    result.writeUInt32LE(result.length, 4);
    return result;
  }
  throw new Error(`Unsupported SWF signature for preflight tag scan: ${signature}`);
}

function swfTagOffset(bytes) {
  const nbits = bytes[8] >> 3;
  const rectBytes = Math.ceil((5 + 4 * nbits) / 8);
  return 8 + rectBytes + 4;
}

export function parseSwfTagSummary(sourceBytes) {
  const bytes = decompressSwf(sourceBytes);
  const counts = new Map();
  let actionScript3Flag = false;
  const parseRange = (start, end) => {
    let offset = start;
    while (offset + 2 <= end) {
      const header = bytes.readUInt16LE(offset);
      offset += 2;
      const code = header >> 6;
      let length = header & 0x3f;
      if (length === 0x3f) {
        if (offset + 4 > end) throw new Error("Truncated long SWF tag length");
        length = bytes.readUInt32LE(offset);
        offset += 4;
      }
      const bodyStart = offset;
      const bodyEnd = bodyStart + length;
      if (bodyEnd > end) throw new Error(`Truncated SWF tag ${code}`);
      counts.set(code, (counts.get(code) || 0) + 1);
      if (code === 69 && length >= 4) actionScript3Flag ||= Boolean(bytes.readUInt32LE(bodyStart) & 0x08);
      if (code === 39 && length >= 4) parseRange(bodyStart + 4, bodyEnd);
      offset = bodyEnd;
      if (code === 0) break;
    }
  };
  parseRange(swfTagOffset(bytes), bytes.length);
  const namedCounts = Object.fromEntries([...counts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([code, count]) => [TAG_NAMES[code] || `Tag${code}`, count]));
  return {
    actionScript3Flag,
    tagCounts: namedCounts,
    scriptTags: {
      DoAction: counts.get(12) || 0,
      DoInitAction: counts.get(59) || 0,
      DoABCDefine: counts.get(72) || 0,
      DoABC: counts.get(82) || 0,
    },
    buttonDefinitionCount: (counts.get(7) || 0) + (counts.get(34) || 0),
    editTextDefinitionCount: counts.get(37) || 0,
    embeddedAudioTags: {
      DefineSound: counts.get(14) || 0,
      StartSound: counts.get(15) || 0,
      SoundStreamHead: (counts.get(18) || 0) + (counts.get(45) || 0),
      SoundStreamBlock: counts.get(19) || 0,
      StartSound2: counts.get(89) || 0,
    },
  };
}

async function ffdecVersion(ffdec) {
  const result = await runCommand(ffdec, ["-help"], {timeoutMs: 30_000});
  if (!result.ok) throw new Error(`FFDec is required for G4 L3 preflight: ${result.spawnError || result.stderr || result.stdout}`);
  const version = `${result.stdout}\n${result.stderr}`.split("\n").map((line) => line.trim()).find(Boolean);
  return version || "unknown";
}

async function probeActionScriptWithFfdec(sourcePath, scratchRoot, ffdec) {
  const outputRoot = path.join(scratchRoot, sha256Bytes(sourcePath).slice(0, 16));
  const result = await runCommand(ffdec, [
    "-onerror", "abort",
    "-timeout", "30",
    "-exportTimeout", "120",
    "-exportFileTimeout", "30",
    "-export", "script",
    outputRoot,
    sourcePath,
  ], {timeoutMs: 180_000});
  if (!result.ok) {
    throw new Error(
      `FFDec script export failed for ${sourcePath}: ` +
      `${result.spawnError || (result.timedOut ? "timed out" : result.stderr || result.stdout)}`,
    );
  }
  const scriptRoot = path.join(outputRoot, "scripts");
  const files = (await walkFiles(scriptRoot)).filter((relativePath) => relativePath.toLowerCase().endsWith(".as"));
  return Promise.all(files.map(async (relativePath) => ({
    path: relativePath,
    text: await readFile(path.join(scriptRoot, relativePath), "utf8"),
  })));
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function normalizedAudioLanguage(file) {
  if (file.language === "en" || file.language === "es") return file.language;
  if (/\/(?:EAD|EA)\//i.test(file.path)) return "en";
  if (/\/(?:SAD|SA)\//i.test(file.path)) return "es";
  return "und";
}

function countLanguages(files) {
  const counts = {en: 0, es: 0, und: 0};
  for (const file of files) counts[normalizedAudioLanguage(file)] += 1;
  return counts;
}

function uniqueFiles(files) {
  return [...new Map(files.map((file) => [file.path, file])).values()]
    .sort((left, right) => compareText(left.path, right.path));
}

function reuseCandidatesFor(animation) {
  const sectionCode = animation.flags.shell ? "SHELL" : animation.classification.section?.code;
  const candidates = [];
  if (animation.animationId === "course-g04-l03-in-009") {
    candidates.push({
      animationId: animation.animationId,
      relation: "existing same-asset JavaScript candidate and source-audit experience",
    });
  } else {
    candidates.push({
      animationId: "course-g04-l03-in-009",
      relation: "same-lesson stage, host, bilingual-audio, capture-contract, and Canvas adapter experience",
    });
  }
  const sectionCandidate = SECTION_REUSE_CANDIDATES[sectionCode];
  if (sectionCandidate && !candidates.some((candidate) => candidate.animationId === sectionCandidate)) {
    candidates.push({
      animationId: sectionCandidate,
      relation: animation.flags.shell ? "existing course-shell pilot archetype" : `${sectionCode} pilot archetype`,
    });
  }
  return candidates;
}

function projectRelative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

async function existingImplementationStatus(animationId) {
  const workspace = path.join(projectRoot, "migrations", animationId);
  const manifestPath = path.join(workspace, "migration.json");
  if (!await exists(manifestPath)) {
    return {
      workspaceExists: false,
      workspace: `migrations/${animationId}`,
      migrationStatus: "not-scaffolded",
      fidelityClaim: "none",
      route: null,
      renderer: {
        declared: false,
        implementationFilesPresent: false,
        component: null,
        timelineModule: null,
        testFile: null,
      },
    };
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const fileFields = ["component", "timelineModule", "testFile"];
  const declaredFiles = fileFields.map((field) => manifest.implementation?.[field]).filter(Boolean);
  const implementationFilesPresent = declaredFiles.length > 0 &&
    (await Promise.all(declaredFiles.map((file) => exists(path.resolve(projectRoot, file))))).every(Boolean);
  return {
    workspaceExists: true,
    workspace: projectRelative(workspace),
    migrationStatus: manifest.status || "unknown",
    fidelityClaim: manifest.fidelityClaim || "not-declared",
    route: manifest.implementation?.route || null,
    renderer: {
      declared: Boolean(manifest.implementation?.component),
      implementationFilesPresent,
      component: manifest.implementation?.component || null,
      timelineModule: manifest.implementation?.timelineModule || null,
      testFile: manifest.implementation?.testFile || null,
    },
  };
}

function gateSummary(gate) {
  return {
    open: gate.open,
    ledgerState: gate.ledgerState,
    prerequisiteKind: gate.prerequisiteKind,
    prerequisiteBatchId: gate.prerequisiteBatchId,
    requiredCount: gate.requiredAnimationIds.length,
    admittedCount: gate.admittedAnimationIds.length,
    missingAnimationIds: gate.missingAnimationIds,
    reason: gate.reason,
  };
}

function itemBlockers(item, gate) {
  const blockers = [];
  if (!gate.open) throw new Error(`${item.animationId}: expected the parallel-shard scaffold gate to be open`);
  if (!item.existing.workspaceExists) blockers.push("workspace-not-scaffolded-by-design");
  if (item.source.sourceKind === "swf-only") blockers.push("paired-fla-missing");
  blockers.push("source-audit-incomplete", "authoritative-baseline-pending");
  if (item.audio.associatedFileCount || item.complexity.actionScript.exportedScriptFileCount) {
    blockers.push("audio-cue-mapping-or-acceptance-pending");
  }
  blockers.push("visual-behavior-human-owner-gates-pending");
  if (item.existing.renderer.declared) blockers.push("existing-js-is-non-authoritative");
  return blockers;
}

function validateSourceRecord(sourceFilesByPath, source) {
  const catalogRecord = sourceFilesByPath.get(source.path);
  if (!catalogRecord) throw new Error(`Source file is absent from catalog/source-files.json: ${source.path}`);
  if (catalogRecord.bytes !== source.bytes || catalogRecord.sha256 !== source.sha256) {
    throw new Error(`Source binding mismatch for ${source.path}`);
  }
}

export function validateG4L3PreflightReport(report) {
  if (report.schemaVersion !== REPORT_VERSION) throw new Error("G4 L3 preflight schemaVersion mismatch");
  if (report.acceptance?.acceptanceNeutral !== true) throw new Error("G4 L3 preflight must be acceptance-neutral");
  for (const field of ["migrationStatusChanges", "completionLedgerChanges", "reviewOrAcceptanceChanges", "sourceAssetChanges"]) {
    if (report.acceptance[field] !== 0) throw new Error(`G4 L3 preflight acceptance.${field} must be zero`);
  }
  if (
    report.generator?.path !== "scripts/build-g4-l3-automation-preflight.mjs" ||
    report.generator?.version !== REPORT_VERSION
  ) {
    throw new Error("G4 L3 preflight generator binding is invalid");
  }
  const requiredBindings = [
    "animations",
    "batches",
    "lessons",
    "audioGroups",
    "sourceFiles",
    "sourceFreeze",
    "completionLedger",
    "pilotAcceptance",
    "lessonReleases",
  ];
  for (const key of requiredBindings) {
    const binding = report.sourceBindings?.[key];
    if (
      !binding ||
      typeof binding.path !== "string" ||
      !/^([a-f0-9]{64})$/.test(binding.sha256) ||
      !Number.isSafeInteger(binding.bytes) ||
      binding.bytes < 1
    ) {
      throw new Error(`G4 L3 preflight source binding ${key} is invalid`);
    }
  }
  if (
    report.sourceBindings?.sourceArchive?.path !== SOURCE_ARCHIVE_PREFIX ||
    !Number.isSafeInteger(report.sourceBindings?.sourceArchive?.fileCount) ||
    report.sourceBindings.sourceArchive.fileCount < 1 ||
    !Number.isSafeInteger(report.sourceBindings?.sourceArchive?.totalBytes) ||
    report.sourceBindings.sourceArchive.totalBytes < 1 ||
    !/^[a-f0-9]{64}$/.test(report.sourceBindings?.sourceArchive?.manifestSha256 || "") ||
    !/^[a-f0-9]{64}$/.test(report.sourceBindings?.sourceArchive?.checksumSetSha256 || "")
  ) {
    throw new Error("G4 L3 preflight source archive binding is invalid");
  }
  if (!/^JPEXS Free Flash Decompiler v\.?\d/.test(report.sourceBindings?.tools?.ffdec || "")) {
    throw new Error("G4 L3 preflight FFDec tool binding is invalid");
  }
  if (!Array.isArray(report.items) || report.items.length !== 40) throw new Error("G4 L3 preflight must contain 40 canonical items");
  const ids = report.items.map((item) => item.animationId);
  if (new Set(ids).size !== 40) throw new Error("G4 L3 preflight canonical IDs must be unique");
  const assetIds = report.items.map((item) => item.assetId);
  if (new Set(assetIds).size !== 40 || assetIds.some((assetId) => !/^swf-[a-f0-9]{64}$/.test(assetId))) {
    throw new Error("G4 L3 preflight asset IDs must be 40 unique SHA-256 identities");
  }
  for (const item of report.items) {
    if (
      !item.source?.swf?.path?.startsWith(`${SOURCE_ARCHIVE_PREFIX}/`) ||
      !/^[a-f0-9]{64}$/.test(item.source.swf.sha256 || "") ||
      item.source.swf.physicalHashVerified !== true
    ) {
      throw new Error(`${item.animationId}: invalid or unverified SWF source binding`);
    }
    if (
      item.source.fla &&
      (
        !item.source.fla.path?.startsWith(`${SOURCE_ARCHIVE_PREFIX}/`) ||
        !/^[a-f0-9]{64}$/.test(item.source.fla.sha256 || "") ||
        item.source.fla.physicalHashVerified !== true
      )
    ) {
      throw new Error(`${item.animationId}: invalid or unverified FLA source binding`);
    }
    if (
      item.runtime?.fps !== 12 ||
      !Number.isSafeInteger(item.runtime?.rootFrameCount) ||
      item.runtime.rootFrameCount < 1 ||
      !Number.isFinite(item.runtime?.stage?.width) ||
      !Number.isFinite(item.runtime?.stage?.height)
    ) {
      throw new Error(`${item.animationId}: invalid stage/FPS/root-frame binding`);
    }
    if (!["batch-001", "batch-002"].includes(item.batch?.batchId)) {
      throw new Error(`${item.animationId}: invalid batch assignment`);
    }
  }
  const pageCount = report.items.filter((item) => item.releaseRole === "active-xml-referenced-page").length;
  const shellCount = report.items.filter((item) => item.releaseRole === "course-shell").length;
  if (pageCount !== 39 || shellCount !== 1) throw new Error(`G4 L3 preflight expected 39 pages and 1 shell, got ${pageCount} and ${shellCount}`);
  const batchCounts = Object.fromEntries(report.batches.map((batch) => [batch.batchId, batch.canonicalAssetCount]));
  if (batchCounts["batch-001"] !== 25 || batchCounts["batch-002"] !== 15) {
    throw new Error("G4 L3 preflight must preserve batch-001=25 and batch-002=15");
  }
  for (const batch of report.batches) {
    const gate = batch.gate;
    if (typeof gate.open !== "boolean") throw new Error(`${batch.batchId}: gate.open must be boolean`);
    if (
      gate.open !== true ||
      gate.prerequisiteKind !== "none" ||
      gate.prerequisiteBatchId !== null ||
      gate.requiredCount !== 0 ||
      gate.admittedCount !== 0 ||
      gate.missingAnimationIds.length !== 0 ||
      gate.ledgerState !== "current"
    ) {
      throw new Error(`${batch.batchId}: parallel-shard scaffold gate is not open with an empty prerequisite`);
    }
  }
  if (
    report.lesson.publicationMode !== "atomic" ||
    report.lesson.developmentMode !== "parallel-shards" ||
    report.lesson.shards?.length !== 2 ||
    report.summary.batchGatesOpen !== 2 ||
    report.acceptance.implementationAuthorized !== false ||
    report.acceptance.publicationAuthorized !== false
  ) {
    throw new Error("G4 L3 preflight did not preserve the parallel-shard/atomic-publication boundary");
  }
  if (report.summary.flaBacked !== 29 || report.summary.swfOnly !== 11) {
    throw new Error(`G4 L3 preflight expected 29 FLA-backed and 11 SWF-only items`);
  }
  if (report.audio.uniqueLessonFiles !== 143 || report.audio.languages.en !== 60 || report.audio.languages.es !== 83) {
    throw new Error("G4 L3 preflight lesson audio inventory must remain 143 files: 60 en and 83 es");
  }
  return report;
}

export async function buildG4L3AutomationPreflight({
  ffdec = "ffdec",
  concurrency = 4,
  probeActionScript = probeActionScriptWithFfdec,
  completionLedgerCheck = checkCompletionLedger,
} = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
    throw new Error("concurrency must be an integer from 1 to 8");
  }
  const inputPaths = {
    animations: path.join(projectRoot, "catalog", "animations.json"),
    batches: path.join(projectRoot, "catalog", "batches.json"),
    lessons: path.join(projectRoot, "catalog", "lessons.json"),
    audioGroups: path.join(projectRoot, "catalog", "audio-groups.json"),
    sourceFiles: path.join(projectRoot, "catalog", "source-files.json"),
    sourceFreeze: path.join(projectRoot, "catalog", "source-freeze.json"),
    completionLedger: path.join(projectRoot, "catalog", "completion-ledger.json"),
    pilotAcceptance: path.join(projectRoot, "reports", "pilot-strict-acceptance.json"),
    lessonReleases: path.join(projectRoot, "catalog", "lesson-releases.json"),
  };
  const loaded = Object.fromEntries(await Promise.all(Object.entries(inputPaths).map(async ([key, filePath]) => {
    return [key, await readJsonWithBinding(filePath)];
  })));
  const animations = loaded.animations.value.animations;
  const batchDocument = loaded.batches.value;
  const queue = batchDocument.queues.find((candidate) => candidate.queueId === RELEASE_QUEUE_ID);
  if (!queue) throw new Error(`Missing release queue ${RELEASE_QUEUE_ID}`);
  if (queue.canonicalAssetCount !== 40 || queue.activeXmlReferencedPageAssetCount !== 39 || queue.courseShellAssetCount !== 1) {
    throw new Error(`${RELEASE_QUEUE_ID}: expected 40 canonical assets, 39 pages, and 1 shell`);
  }
  const lesson = loaded.lessons.value.lessons.find((candidate) => candidate.grade === 4 && candidate.lesson === 3);
  if (!lesson || lesson.pageReferenceCount !== 39) throw new Error("Expected the 39-page G4 L3 lesson record");
  const lessonRelease = loaded.lessonReleases.value.releases.find((candidate) => candidate.releaseId === queue.releaseId);
  if (
    !lessonRelease ||
    lessonRelease.queueId !== queue.queueId ||
    lessonRelease.publicationMode !== "atomic" ||
    lessonRelease.developmentMode !== "parallel-shards" ||
    lessonRelease.expectedCounts?.members !== 40 ||
    lessonRelease.expectedCounts?.shards !== 2 ||
    lessonRelease.members?.length !== 40 ||
    lessonRelease.shards?.length !== 2
  ) {
    throw new Error("Expected the exact two-shard atomic G4 L3 lesson release manifest");
  }
  const canonicalById = new Map(animations.filter((animation) => animation.isCanonical)
    .map((animation) => [animation.animationId, animation]));
  const audioGroupsById = new Map(loaded.audioGroups.value.groups.map((group) => [group.groupId, group]));
  const sourceFilesByPath = new Map(loaded.sourceFiles.value.files.map((file) => [file.path, file]));
  const queueItems = queue.batches.flatMap((batch) => batch.items.map((item, batchIndex) => ({
    ...item,
    batchId: batch.batchId,
    batchIndex: batchIndex + 1,
    releasePart: batch.releasePart,
    releasePartCount: batch.releasePartCount,
  })));
  const releaseMemberIds = lessonRelease.members.map((member) => member.animationId);
  const queueAnimationIds = queueItems.map((item) => item.canonicalAnimationId);
  if (JSON.stringify(releaseMemberIds) !== JSON.stringify(queueAnimationIds)) {
    throw new Error("G4 L3 lesson release member order drifted from the release queue");
  }
  const sourceAnimations = queueItems.map((item) => {
    const animation = canonicalById.get(item.canonicalAnimationId);
    if (!animation) throw new Error(`Missing canonical animation ${item.canonicalAnimationId}`);
    if (animation.assetId !== item.assetId) throw new Error(`Asset mismatch for ${animation.animationId}`);
    validateSourceRecord(sourceFilesByPath, animation.source);
    if (animation.pairedFla) validateSourceRecord(sourceFilesByPath, animation.pairedFla);
    return {item, animation};
  });

  const scratchRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-g4-l3-preflight-"));
  let toolVersion;
  let probed;
  try {
    toolVersion = probeActionScript === probeActionScriptWithFfdec ? await ffdecVersion(ffdec) : "injected-test-probe";
    probed = await mapWithConcurrency(sourceAnimations, concurrency, async ({animation}) => {
      const swfPath = path.join(projectRoot, SOURCE_ARCHIVE_PREFIX, animation.source.path);
      const swfBytes = await readFile(swfPath);
      const observedSwfSha256 = sha256Bytes(swfBytes);
      if (observedSwfSha256 !== animation.source.sha256) {
        throw new Error(`${animation.animationId}: physical SWF hash does not match catalog`);
      }
      const tagSummary = parseSwfTagSummary(swfBytes);
      const sources = await probeActionScript(swfPath, scratchRoot, ffdec);
      let observedFlaSha256 = null;
      if (animation.pairedFla) {
        const flaPath = path.join(projectRoot, SOURCE_ARCHIVE_PREFIX, animation.pairedFla.path);
        observedFlaSha256 = await sha256File(flaPath);
        if (observedFlaSha256 !== animation.pairedFla.sha256) {
          throw new Error(`${animation.animationId}: physical FLA hash does not match catalog`);
        }
      }
      return {
        tagSummary,
        observedSwfSha256,
        observedFlaSha256,
        complexity: summarizeActionScriptSources(sources, tagSummary, {
          rootFrameCount: animation.source.swf.frameCount,
          shell: animation.flags.shell,
        }),
      };
    });
  } finally {
    await rm(scratchRoot, {recursive: true, force: true});
  }

  const ledgerCheck = await completionLedgerCheck({
    migrationsRoot: path.join(projectRoot, "migrations"),
    output: inputPaths.completionLedger,
  });
  const gates = Object.fromEntries(queue.batches.map((batch) => [
    batch.batchId,
    evaluateBatchScaffoldingGate({
      batchDocument,
      batchId: batch.batchId,
      ledger: ledgerCheck.ledger,
      ledgerCurrent: ledgerCheck.ok,
      ledgerReason: ledgerCheck.reason,
    }),
  ]));
  const existing = await Promise.all(sourceAnimations.map(({animation}) => existingImplementationStatus(animation.animationId)));
  const items = sourceAnimations.map(({item, animation}, index) => {
    const exactFiles = animation.audio.exact || [];
    const sharedGroupFiles = (animation.audio.groupIds || []).flatMap((groupId) => {
      const group = audioGroupsById.get(groupId);
      if (!group) throw new Error(`${animation.animationId}: missing audio group ${groupId}`);
      return group.files;
    });
    const associatedFiles = uniqueFiles([...exactFiles, ...sharedGroupFiles]);
    const sourceKind = animation.pairedFla ? "fla+swf" : "swf-only";
    const entry = {
      sequence: index + 1,
      animationId: animation.animationId,
      assetId: animation.assetId,
      releaseRole: item.releaseRole,
      classification: {
        section: animation.classification.section,
        page: animation.classification.page,
        titleRaw: animation.classification.titleRaw,
        titleDisplay: animation.classification.titleDisplay,
        domain: animation.classification.domain,
        status: animation.classification.status,
      },
      batch: {
        batchId: item.batchId,
        batchOrdinal: item.batchIndex,
        releasePart: item.releasePart,
        releasePartCount: item.releasePartCount,
      },
      source: {
        sourceKind,
        swf: {
          path: `${SOURCE_ARCHIVE_PREFIX}/${animation.source.path}`,
          bytes: animation.source.bytes,
          sha256: animation.source.sha256,
          physicalHashVerified: probed[index].observedSwfSha256 === animation.source.sha256,
        },
        fla: animation.pairedFla ? {
          path: `${SOURCE_ARCHIVE_PREFIX}/${animation.pairedFla.path}`,
          bytes: animation.pairedFla.bytes,
          sha256: animation.pairedFla.sha256,
          physicalHashVerified: probed[index].observedFlaSha256 === animation.pairedFla.sha256,
        } : null,
      },
      runtime: {
        stage: {
          width: animation.source.swf.stage.width,
          height: animation.source.swf.stage.height,
        },
        fps: animation.source.swf.fps,
        rootFrameCount: animation.source.swf.frameCount,
        durationMs: animation.source.swf.durationMs,
        swfVersion: animation.source.swf.version,
        swfSignature: animation.source.swf.signature,
        nestedFrameDomains: "not-audited-by-preflight",
        embeddedAudioTags: probed[index].tagSummary.embeddedAudioTags,
      },
      audio: {
        associationScope: exactFiles.length && sharedGroupFiles.length
          ? "matching-basename-and-section-shared-group"
          : exactFiles.length
            ? "matching-basename"
            : sharedGroupFiles.length
              ? "section-shared-group; page-level cue mapping unresolved"
              : "none-catalog-associated",
        exactFileCount: exactFiles.length,
        sharedGroupFileCount: uniqueFiles(sharedGroupFiles).length,
        associatedFileCount: associatedFiles.length,
        languages: countLanguages(associatedFiles),
        exactFiles: exactFiles.map((file) => ({
          path: `${SOURCE_ARCHIVE_PREFIX}/${file.path}`,
          sha256: file.sha256,
          catalogLanguage: file.language,
          normalizedLanguage: normalizedAudioLanguage(file),
        })),
        groupIds: animation.audio.groupIds || [],
      },
      complexity: probed[index].complexity,
      reuseCandidates: reuseCandidatesFor(animation),
      existing: {
        catalogMigrationStatus: animation.migration.status,
        catalogFidelityClaim: animation.migration.fidelityClaim,
        ...existing[index],
      },
    };
    entry.blockerCodes = itemBlockers(entry, gates[item.batchId]);
    return entry;
  });

  const lessonAudioFiles = loaded.sourceFiles.value.files.filter((file) =>
    file.extension === "mp3" && file.path.startsWith("HELP_COURSES/ELMGR4/L3/"));
  const associatedLessonAudioFiles = uniqueFiles(items.flatMap((item) => [
    ...item.audio.exactFiles.map((file) => {
      const relativePath = file.path.slice(`${SOURCE_ARCHIVE_PREFIX}/`.length);
      return sourceFilesByPath.get(relativePath);
    }).filter(Boolean),
    ...((canonicalById.get(item.animationId)?.audio.groupIds || []).flatMap((groupId) => audioGroupsById.get(groupId)?.files || [])),
  ]));
  if (associatedLessonAudioFiles.length !== lessonAudioFiles.length) {
    throw new Error(
      `G4 L3 catalog audio association covers ${associatedLessonAudioFiles.length}/${lessonAudioFiles.length} lesson MP3 files`,
    );
  }

  const report = {
    schemaVersion: REPORT_VERSION,
    reportType: "g4-l3-complete-lesson-automation-preflight",
    generator: {
      path: projectRelative(scriptPath),
      version: REPORT_VERSION,
    },
    acceptance: {
      acceptanceNeutral: true,
      implementationAuthorized: false,
      publicationAuthorized: false,
      migrationStatusChanges: 0,
      completionLedgerChanges: 0,
      reviewOrAcceptanceChanges: 0,
      sourceAssetChanges: 0,
      statement:
        "This report inventories and triages work only. Its open scaffold gates permit workspace creation for two parallel shards, but do not authorize implementation, publish the atomic lesson, accept evidence, or establish fidelity, parity, human/owner approval, or completion.",
    },
    sourceBindings: {
      ...Object.fromEntries(Object.entries(loaded).map(([key, value]) => [key, value.binding])),
      sourceArchive: {
        path: SOURCE_ARCHIVE_PREFIX,
        fileCount: loaded.sourceFreeze.value.fileCount,
        totalBytes: loaded.sourceFreeze.value.totalBytes,
        manifestSha256: loaded.sourceFreeze.value.manifestSha256,
        checksumSetSha256: loaded.sourceFiles.value.checksumSetSha256,
      },
      tools: {
        ffdec: toolVersion,
      },
    },
    lesson: {
      releaseId: queue.releaseId,
      queueId: queue.queueId,
      grade: 4,
      lesson: 3,
      titleRaw: lesson.titleRaw,
      titleDisplay: lesson.titleDisplay,
      domain: lesson.domain,
      lessonXml: {
        path: `${SOURCE_ARCHIVE_PREFIX}/${lesson.path}`,
        sha256: lesson.sha256,
      },
      activeXmlReferencedPages: 39,
      courseShells: 1,
      canonicalItems: 40,
      publicationMode: lessonRelease.publicationMode,
      developmentMode: lessonRelease.developmentMode,
      shards: lessonRelease.shards,
    },
    strictGateSnapshot: {
      completionLedgerCurrent: ledgerCheck.ok,
      completionLedgerReason: ledgerCheck.reason,
      generatedMarker: ledgerCheck.ledger.generatedMarker,
      strictComplete: ledgerCheck.ledger.summary.strictComplete,
      strictFailed: ledgerCheck.ledger.summary.strictFailed,
      pilotStrictAccepted: loaded.pilotAcceptance.value.summary.strictAccepted,
      pilotCount: loaded.pilotAcceptance.value.summary.pilots,
    },
    batches: queue.batches.map((batch) => ({
      batchId: batch.batchId,
      canonicalAssetCount: batch.canonicalAssetCount,
      releasePart: batch.releasePart,
      releasePartCount: batch.releasePartCount,
      releaseComplete: batch.releaseComplete,
      shard: lessonRelease.shards.find((shard) => shard.batchId === batch.batchId),
      gate: gateSummary(gates[batch.batchId]),
    })),
    audio: {
      uniqueLessonFiles: lessonAudioFiles.length,
      associatedByCatalogPreflight: associatedLessonAudioFiles.length,
      languages: countLanguages(lessonAudioFiles),
      note:
        "35 basename-matched files under lesson SA are normalized to Spanish from the preserved path convention; 108 FQ files retain catalog en/es labels. Association is not cue or listening acceptance.",
    },
    blockerDefinitions: BLOCKER_DEFINITIONS,
    summary: {
      canonicalItems: items.length,
      activePages: items.filter((item) => item.releaseRole === "active-xml-referenced-page").length,
      courseShells: items.filter((item) => item.releaseRole === "course-shell").length,
      flaBacked: items.filter((item) => item.source.sourceKind === "fla+swf").length,
      swfOnly: items.filter((item) => item.source.sourceKind === "swf-only").length,
      existingMigrationWorkspaces: items.filter((item) => item.existing.workspaceExists).length,
      existingDeclaredRenderers: items.filter((item) => item.existing.renderer.declared).length,
      behaviorSensitiveMachineTriage: items.filter((item) =>
        item.complexity.interaction.detected ||
        item.complexity.random.detected ||
        item.complexity.externalCalls.detected ||
        item.releaseRole === "course-shell").length,
      complexityLevels: {
        low: items.filter((item) => item.complexity.level === "low").length,
        medium: items.filter((item) => item.complexity.level === "medium").length,
        high: items.filter((item) => item.complexity.level === "high").length,
      },
      batchGatesOpen: queue.batches.filter((batch) => gates[batch.batchId].open).length,
    },
    items,
  };
  return validateG4L3PreflightReport(report);
}

function compactSignals(item) {
  const values = [];
  if (item.complexity.interaction.detected) values.push("I");
  if (item.complexity.random.detected) values.push("R");
  if (item.complexity.externalCalls.detected) values.push("X");
  return values.join("") || "—";
}

export function renderG4L3PreflightMarkdown(report) {
  const lines = [
    "# G4 L3 Complete-Lesson Automation Preflight",
    "",
    "> Acceptance-neutral inventory only. This report does not scaffold migrations, change status, accept evidence, or establish Flash/JavaScript parity or completion.",
    "",
    "## Scope",
    "",
    `- Release: \`${report.lesson.releaseId}\` — ${report.lesson.titleDisplay}`,
    `- Canonical scope: ${report.summary.canonicalItems} (${report.summary.activePages} active XML pages + ${report.summary.courseShells} shell)`,
    `- Sources: ${report.summary.flaBacked} FLA+SWF; ${report.summary.swfOnly} SWF-only`,
    `- Existing work: ${report.summary.existingMigrationWorkspaces} migration workspace; ${report.summary.existingDeclaredRenderers} declared renderer`,
    `- Audio inventory: ${report.audio.uniqueLessonFiles} unique MP3 (${report.audio.languages.en} en, ${report.audio.languages.es} es)`,
    `- Machine behavior triage: ${report.summary.behaviorSensitiveMachineTriage}/40 items have interaction, random, external-call, or shell signals`,
    "",
    "## Parallel shard scaffold gates",
    "",
    "| Batch | Items | Gate | Prerequisite | Admitted | Reason |",
    "|---|---:|---|---|---:|---|",
    ...report.batches.map((batch) => `| ${[
      batch.batchId,
      batch.canonicalAssetCount,
      batch.gate.open ? "OPEN" : "CLOSED",
      batch.gate.prerequisiteKind === "none"
        ? "none (parallel shard)"
        : batch.gate.prerequisiteBatchId,
      `${batch.gate.admittedCount}/${batch.gate.requiredCount}`,
      batch.gate.reason.replaceAll("|", "\\|"),
    ].join(" | ")} |`),
    "",
    `Both shard scaffold gates are open. Renderer implementation remains unauthorized, and \`${report.lesson.publicationMode}\` lesson publication remains outside this preflight until all 40 release members satisfy strict completion.`,
    "",
    "## Canonical items",
    "",
    "Complexity signals: `I` interaction, `R` random, `X` external-call candidate. They are machine triage, not behavior proof.",
    "",
    "| # | Batch | Canonical ID | Section/page | Source | Stage / FPS / root frames | Audio (exact/shared; en/es) | AS scripts | Risk | Reuse lead | Existing |",
    "|---:|---|---|---|---|---|---|---:|---|---|---|",
    ...report.items.map((item) => {
      const section = item.releaseRole === "course-shell"
        ? "shell"
        : `${item.classification.section?.code || "?"}/${item.classification.page?.number ?? "?"}`;
      const runtime = `${item.runtime.stage.width}×${item.runtime.stage.height} / ${item.runtime.fps} / ${item.runtime.rootFrameCount}`;
      const audio = `${item.audio.exactFileCount}/${item.audio.sharedGroupFileCount}; ${item.audio.languages.en}/${item.audio.languages.es}`;
      const existing = item.existing.renderer.declared
        ? `${item.existing.migrationStatus}; renderer`
        : item.existing.workspaceExists
          ? item.existing.migrationStatus
          : "not scaffolded";
      return `| ${[
        item.sequence,
        item.batch.batchId,
        `\`${item.animationId}\``,
        section,
        item.source.sourceKind,
        runtime,
        audio,
        `${item.complexity.actionScript.version} (${item.complexity.actionScript.exportedScriptFileCount})`,
        `${item.complexity.level} ${compactSignals(item)}`,
        `\`${item.reuseCandidates[0].animationId}\``,
        existing,
      ].join(" | ")} |`;
    }),
    "",
    "## Acceptance boundary and blockers",
    "",
    ...Object.entries(report.blockerDefinitions).map(([code, definition]) => `- \`${code}\`: ${definition}`),
    "",
    `Source bindings and all ${report.items.length} item-level blocker-code lists are in \`reports/g4-l3-automation-preflight.json\`.`,
    "",
  ];
  return lines.join("\n");
}

export async function writeOrCheck(filePath, expected, check, {
  root = projectRoot,
} = {}) {
  const safePath = await assertSafeReportOutput(filePath, {root});
  if (check) {
    const actual = await readFile(safePath, "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (actual !== expected) {
      throw new Error(`${path.relative(path.resolve(root), safePath).split(path.sep).join("/")} is missing or stale`);
    }
    return;
  }
  await mkdir(path.dirname(safePath), {recursive: true});
  await assertSafeReportOutput(safePath, {root});
  await writeFile(safePath, expected);
}

function usage() {
  return `Usage:
  node scripts/build-g4-l3-automation-preflight.mjs [--check]
      [--ffdec <command>] [--concurrency <1-8>]
      [--json-output <path>] [--markdown-output <path>]

Builds a deterministic, acceptance-neutral preflight for the 39 active G4 L3
pages plus index_local shell. It verifies physical FLA/SWF hashes, exports
ActionScript to triage interaction/random/external-call complexity, inventories
audio and implementation status, and reports the two parallel-shard scaffold
gates plus the atomic publication boundary. It never scaffolds migrations or changes sources, the completion ledger,
reviews, acceptance, or migration status. --check performs no report writes.`;
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
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--check") options.check = true;
    else if (["--ffdec", "--concurrency", "--json-output", "--markdown-output"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--ffdec") options.ffdec = next;
      else if (value === "--concurrency") options.concurrency = Number(next);
      else if (value === "--json-output") options.jsonOutput = path.resolve(next);
      else options.markdownOutput = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  assertLexicalReportOutput(options.jsonOutput, {label: "JSON report output"});
  assertLexicalReportOutput(options.markdownOutput, {label: "Markdown report output"});
  if (options.jsonOutput === options.markdownOutput) throw new Error("JSON and Markdown report outputs must differ");
  if (path.extname(options.jsonOutput).toLowerCase() !== ".json") throw new Error("JSON report output must end in .json");
  if (path.extname(options.markdownOutput).toLowerCase() !== ".md") throw new Error("Markdown report output must end in .md");
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const report = await buildG4L3AutomationPreflight({
    ffdec: options.ffdec,
    concurrency: options.concurrency,
  });
  const json = stableJson(report);
  const markdown = renderG4L3PreflightMarkdown(report);
  await Promise.all([
    writeOrCheck(options.jsonOutput, json, options.check),
    writeOrCheck(options.markdownOutput, markdown, options.check),
  ]);
  console.log(
    `${options.check ? "PASS" : "WROTE"}: G4 L3 preflight; ` +
    `${report.summary.canonicalItems} canonical items; ` +
    `${report.summary.flaBacked} FLA-backed; ${report.summary.swfOnly} SWF-only; ` +
    `${report.summary.batchGatesOpen}/2 batch gates open.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
