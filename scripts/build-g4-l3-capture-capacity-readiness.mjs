#!/usr/bin/env node

import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {readFile, readdir, realpath, stat, statfs, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {inflateSync} from "node:zlib";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const REPORT_VERSION = 1;
const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-capture-capacity-readiness.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-capture-capacity-readiness.md");
const PREFLIGHT_PATH = path.join(projectRoot, "reports", "g4-l3-automation-preflight.json");
const CAPTURE_ROOT = path.join(projectRoot, "output", "playwright");
const OBSERVED_ROOTS = [
  path.join(projectRoot, "output", "playwright"),
  path.join(projectRoot, "artifacts", "full-frame"),
  path.join(projectRoot, "work"),
];
const GIB = 1024 ** 3;
const OPERATIONAL_RESERVE_BYTES = 100 * GIB;
const REMAINING_EVIDENCE_SAFETY_MULTIPLIER = 1.20;
const PNG_COPIES_PER_LOGICAL_FRAME = 3;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function walkFiles(root) {
  const files = [];
  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, {withFileTypes: true});
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile()) files.push(child);
    }
  }
  await visit(root);
  return files;
}

function decompressSwf(sourceBytes) {
  if (sourceBytes.length < 12) throw new Error("SWF is too short");
  const signature = sourceBytes.subarray(0, 3).toString("ascii");
  if (signature === "FWS") return Buffer.from(sourceBytes);
  if (signature === "CWS") {
    const result = Buffer.concat([
      Buffer.from("FWS"),
      sourceBytes.subarray(3, 8),
      inflateSync(sourceBytes.subarray(8)),
    ]);
    result.writeUInt32LE(result.length, 4);
    return result;
  }
  throw new Error(`Unsupported SWF signature ${signature}; ZWS capacity parsing is deliberately fail-closed`);
}

function swfHeaderFacts(bytes) {
  const nbits = bytes[8] >> 3;
  const rectBytes = Math.ceil((5 + 4 * nbits) / 8);
  const timelineHeaderOffset = 8 + rectBytes;
  if (timelineHeaderOffset + 4 > bytes.length) throw new Error("Truncated SWF timeline header");
  return {
    tagOffset: timelineHeaderOffset + 4,
    rootFrameCount: bytes.readUInt16LE(timelineHeaderOffset + 2),
  };
}

export function collectSwfTimelineFacts(sourceBytes) {
  const bytes = decompressSwf(sourceBytes);
  const header = swfHeaderFacts(bytes);
  const sprites = [];
  const parseRange = (start, end, definitionDepth) => {
    let offset = start;
    while (offset + 2 <= end) {
      const tagHeader = bytes.readUInt16LE(offset);
      offset += 2;
      const code = tagHeader >> 6;
      let length = tagHeader & 0x3f;
      if (length === 0x3f) {
        if (offset + 4 > end) throw new Error("Truncated long SWF tag length");
        length = bytes.readUInt32LE(offset);
        offset += 4;
      }
      const bodyStart = offset;
      const bodyEnd = bodyStart + length;
      if (bodyEnd > end) throw new Error(`Truncated SWF tag ${code}`);
      if (code === 39) {
        if (length < 4) throw new Error("Truncated DefineSprite tag");
        const spriteId = bytes.readUInt16LE(bodyStart);
        const frameCount = bytes.readUInt16LE(bodyStart + 2);
        sprites.push({spriteId, frameCount, definitionDepth});
        parseRange(bodyStart + 4, bodyEnd, definitionDepth + 1);
      }
      offset = bodyEnd;
      if (code === 0) break;
    }
  };
  parseRange(header.tagOffset, bytes.length, 1);
  const frameCounts = sprites.map((sprite) => sprite.frameCount);
  return {
    rootFrameCount: header.rootFrameCount,
    nestedDefinitionCount: sprites.length,
    nestedDeclaredFrameCountSum: frameCounts.reduce((sum, value) => sum + value, 0),
    nestedDeclaredFrameCountMax: frameCounts.length ? Math.max(...frameCounts) : 0,
    zeroFrameDefinitionCount: frameCounts.filter((value) => value === 0).length,
    sprites,
  };
}

export function quantile(values, probability) {
  if (!Array.isArray(values) || values.length === 0) return null;
  if (!(probability >= 0 && probability <= 1)) throw new Error("quantile probability must be between zero and one");
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function summarizeNumbers(values, {round = true} = {}) {
  if (!values.length) throw new Error("Cannot summarize an empty numeric sample");
  const total = values.reduce((sum, value) => sum + value, 0);
  const project = (value) => round ? Math.round(value) : Number(value.toFixed(6));
  return {
    count: values.length,
    total: project(total),
    min: Math.min(...values),
    p25: project(quantile(values, 0.25)),
    p50: project(quantile(values, 0.50)),
    p75: project(quantile(values, 0.75)),
    p90: project(quantile(values, 0.90)),
    p95: project(quantile(values, 0.95)),
    max: Math.max(...values),
    mean: project(total / values.length),
  };
}

async function captureManifestSample() {
  const files = (await walkFiles(CAPTURE_ROOT))
    .filter((filePath) => path.basename(filePath) === "capture-manifest.json")
    .sort();
  const manifests = [];
  const pngBytes = [];
  let rejectedManifestCount = 0;
  for (const filePath of files) {
    let manifest;
    try {
      manifest = await readJson(filePath);
    } catch {
      rejectedManifestCount += 1;
      continue;
    }
    if (
      manifest.schemaVersion !== 4 ||
      manifest.viewport?.width !== 800 ||
      manifest.viewport?.height !== 600 ||
      manifest.viewport?.deviceScaleFactor !== 1 ||
      !Array.isArray(manifest.captured) ||
      manifest.captured.length === 0
    ) {
      rejectedManifestCount += 1;
      continue;
    }
    const sizes = [];
    let valid = true;
    for (const frame of manifest.captured) {
      if (frame.width !== 800 || frame.height !== 600 || typeof frame.file !== "string") {
        valid = false;
        break;
      }
      try {
        const frameStat = await stat(path.join(path.dirname(filePath), frame.file));
        if (!frameStat.isFile() || frameStat.size <= 0) {
          valid = false;
          break;
        }
        sizes.push(frameStat.size);
      } catch {
        valid = false;
        break;
      }
    }
    if (!valid) {
      rejectedManifestCount += 1;
      continue;
    }
    pngBytes.push(...sizes);
    const capturedAtMs = Date.parse(manifest.capturedAt);
    manifests.push({
      path: relative(filePath),
      capturedAtMs: Number.isFinite(capturedAtMs) ? capturedAtMs : null,
      frameCount: sizes.length,
      batchRoot: relative(path.dirname(path.dirname(filePath))),
    });
  }
  if (!pngBytes.length) throw new Error("No valid schema-v4 800x600 implementation capture PNG sample exists");

  // Capture manifests record only their completion time. Consecutive manifests
  // in the same capture root therefore provide a coarse, explicitly inferred
  // seconds/frame observation. Long pauses and implausible rates are excluded.
  const secondsPerFrame = [];
  const grouped = Map.groupBy(manifests.filter((entry) => entry.capturedAtMs !== null), (entry) => entry.batchRoot);
  for (const entries of grouped.values()) {
    entries.sort((left, right) => left.capturedAtMs - right.capturedAtMs);
    for (let index = 1; index < entries.length; index += 1) {
      const elapsedSeconds = (entries[index].capturedAtMs - entries[index - 1].capturedAtMs) / 1000;
      const rate = elapsedSeconds / entries[index].frameCount;
      if (elapsedSeconds > 0 && elapsedSeconds <= 3600 && rate >= 0.15 && rate <= 5) secondsPerFrame.push(rate);
    }
  }

  return {
    selection: {
      root: relative(CAPTURE_ROOT),
      schemaVersion: 4,
      nativeStage: {width: 800, height: 600, deviceScaleFactor: 1},
      rule: "manifest parses; captured is non-empty; every listed 800x600 PNG exists and has positive bytes",
    },
    discoveredManifestCount: files.length,
    admittedManifestCount: manifests.length,
    rejectedManifestCount,
    actualPngFrameCount: pngBytes.length,
    actualPngBytes: summarizeNumbers(pngBytes),
    inferredCaptureSecondsPerFrame: secondsPerFrame.length ? summarizeNumbers(secondsPerFrame, {round: false}) : null,
    timingCaveat:
      "capturedAt is a manifest completion timestamp, not per-frame instrumentation; consecutive same-root deltas are a coarse throughput inference and exclude pauses over one hour",
  };
}

async function commandDurationSample() {
  const root = path.join(projectRoot, "reports", "pilot-verification-runs");
  const files = (await walkFiles(root)).filter((filePath) => filePath.endsWith(".json"));
  const tests = [];
  const builds = [];
  for (const filePath of files) {
    let value;
    try {
      value = await readJson(filePath);
    } catch {
      continue;
    }
    const commandRecords = [
      ...(Array.isArray(value.commands) ? value.commands : []),
      ...(value.commands && !Array.isArray(value.commands) ? Object.values(value.commands) : []),
    ];
    for (const record of commandRecords) {
      if (!Number.isFinite(record?.durationMs) || record.durationMs <= 0) continue;
      if (record.command === "npm test") tests.push(record.durationMs);
      if (record.command === "npm run build") builds.push(record.durationMs);
    }
  }
  return {
    sourceRoot: relative(root),
    npmTestDurationMs: tests.length ? summarizeNumbers(tests) : null,
    npmBuildDurationMs: builds.length ? summarizeNumbers(builds) : null,
    caveat: "Historical pilot verification receipts measure the current repository, not a finished 40-renderer G4 L3 tree; future suite duration can grow.",
  };
}

async function diskUsageBytes(directory) {
  try {
    const {stdout} = await execFileAsync("du", ["-sk", directory], {encoding: "utf8"});
    const kib = Number.parseInt(stdout.trim().split(/\s+/)[0], 10);
    if (!Number.isFinite(kib)) throw new Error(`Unable to parse du output for ${directory}`);
    return kib * 1024;
  } catch (error) {
    if (error?.code === "ENOENT") return 0;
    throw error;
  }
}

async function filesystemSnapshot(snapshotAt) {
  const [resolvedRoot, fsStats, rootStat] = await Promise.all([
    realpath(projectRoot),
    statfs(projectRoot, {bigint: true}),
    stat(projectRoot),
  ]);
  let df = null;
  try {
    const {stdout} = await execFileAsync("df", ["-kP", resolvedRoot], {encoding: "utf8"});
    const lines = stdout.trim().split("\n");
    const fields = lines.at(-1).trim().split(/\s+/);
    if (fields.length >= 6) {
      df = {
        filesystem: fields[0],
        capacityPercent: fields[4],
        mountPoint: fields.slice(5).join(" "),
      };
    }
  } catch {
    // statfs remains the byte authority when df metadata is unavailable.
  }
  const blockSize = Number(fsStats.bsize);
  const totalBytes = Number(fsStats.blocks) * blockSize;
  const freeBytes = Number(fsStats.bfree) * blockSize;
  const availableBytes = Number(fsStats.bavail) * blockSize;
  return {
    capturedAt: snapshotAt,
    host: {
      platform: os.platform(),
      release: os.release(),
      architecture: os.arch(),
      nodeVersion: process.version,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    filesystem: {
      inspectedPath: resolvedRoot,
      deviceId: String(rootStat.dev),
      filesystem: df?.filesystem || null,
      mountPoint: df?.mountPoint || null,
      capacityPercent: df?.capacityPercent || null,
      blockSizeBytes: blockSize,
      totalBytes,
      freeBytes,
      availableBytes,
      usedBytes: totalBytes - freeBytes,
      availabilityAuthority: "node:fs statfs bavail times bsize; df metadata is descriptive only",
    },
    observedRoots: await Promise.all(OBSERVED_ROOTS.map(async (directory) => ({
      path: relative(directory),
      bytes: await diskUsageBytes(directory),
    }))),
  };
}

function sourceTimelineSummary(itemFacts) {
  const sum = (selector) => itemFacts.reduce((total, item) => total + selector(item), 0);
  return {
    itemCount: itemFacts.length,
    rootFrameCountSum: sum((item) => item.rootFrameCount),
    nestedDefinitionCount: sum((item) => item.nestedDefinitionCount),
    nestedDeclaredFrameCountSum: sum((item) => item.nestedDeclaredFrameCountSum),
    principalTimelineFrameCountSum: sum((item) => item.rootFrameCount + item.nestedDeclaredFrameCountMax),
    allDeclaredTimelineFrameCountSum: sum((item) => item.rootFrameCount + item.nestedDeclaredFrameCountSum),
    maximumSingleNestedDefinitionFrameCount: Math.max(...itemFacts.map((item) => item.nestedDeclaredFrameCountMax)),
    sourceBundleBytes: sum((item) => item.sourceBytes),
    behaviorSensitiveItems: itemFacts.filter((item) => item.behaviorSensitive).length,
    caveat:
      "DefineSprite counts are static SWF definition facts. They do not prove root reachability, scenario count, independent frame-domain disposition, or runtime execution.",
  };
}

function projectedLogicalFrames(itemFacts, mode) {
  return itemFacts.reduce((total, item) => {
    const principal = item.rootFrameCount + item.nestedDeclaredFrameCountMax;
    const allDefined = item.rootFrameCount + item.nestedDeclaredFrameCountSum;
    if (mode === "low") return total + principal * 2;
    if (mode === "expected") {
      const scenarioMultiplier = item.shell ? 10 : item.behaviorSensitive ? 2 : 1;
      return total + principal * 2 * scenarioMultiplier;
    }
    if (mode === "high") {
      const scenarioMultiplier = item.shell ? 12 : item.behaviorSensitive ? 3 : 1;
      return total + allDefined * 2 * scenarioMultiplier;
    }
    throw new Error(`Unknown projection mode ${mode}`);
  }, 0);
}

export function buildCapacityModel({itemFacts, captureSample, availableBytes}) {
  const png = captureSample.actualPngBytes;
  const captureSeconds = captureSample.inferredCaptureSecondsPerFrame;
  if (!png || !captureSeconds) throw new Error("Capacity model requires PNG byte and capture throughput samples");
  const settings = {
    low: {pngBytesPerObject: png.p50, archiveOverheadMultiplier: 1.15, fixedWorkingBytes: 1 * GIB, secondsPerFrame: captureSeconds.p50},
    expected: {pngBytesPerObject: png.p75, archiveOverheadMultiplier: 1.35, fixedWorkingBytes: 2 * GIB, secondsPerFrame: captureSeconds.p75},
    high: {pngBytesPerObject: png.p95, archiveOverheadMultiplier: 1.60, fixedWorkingBytes: 4 * GIB, secondsPerFrame: captureSeconds.p90},
  };
  const scenarios = Object.fromEntries(Object.entries(settings).map(([name, setting]) => {
    const logicalEvidenceFrames = projectedLogicalFrames(itemFacts, name);
    const pngObjectCount = logicalEvidenceFrames * PNG_COPIES_PER_LOGICAL_FRAME;
    const rawPngBytes = pngObjectCount * setting.pngBytesPerObject;
    const incrementalBytes = Math.ceil(rawPngBytes * setting.archiveOverheadMultiplier + setting.fixedWorkingBytes);
    return [name, {
      logicalEvidenceFrames,
      pngObjectCount,
      pngCopiesPerLogicalFrame: PNG_COPIES_PER_LOGICAL_FRAME,
      pngCopyRoles: ["original-runtime-baseline", "javascript-implementation", "difference-image"],
      pngBytesPerObject: setting.pngBytesPerObject,
      rawPngBytes,
      archiveOverheadMultiplier: setting.archiveOverheadMultiplier,
      fixedWorkingBytes: setting.fixedWorkingBytes,
      incrementalBytes,
      implementationCaptureSecondsPerFrame: setting.secondsPerFrame,
      implementationCaptureWallClockSecondsSingleStream: Math.ceil(logicalEvidenceFrames * setting.secondsPerFrame),
    }];
  }));
  const withSafetyMarginAndReserve = (bytes) =>
    Math.ceil(bytes * REMAINING_EVIDENCE_SAFETY_MULTIPLIER) + OPERATIONAL_RESERVE_BYTES;
  const minimumSafeFreeBytes = withSafetyMarginAndReserve(scenarios.high.incrementalBytes);
  const expectedWithReserve = withSafetyMarginAndReserve(scenarios.expected.incrementalBytes);
  const lowWithReserve = withSafetyMarginAndReserve(scenarios.low.incrementalBytes);
  let admission;
  if (availableBytes >= minimumSafeFreeBytes) {
    admission = "admit-full-lesson-capture-capacity";
  } else if (availableBytes >= expectedWithReserve) {
    admission = "conditional-admit-expected-case-only; use bounded sub-batches and re-snapshot before each capture";
  } else if (availableBytes >= lowWithReserve) {
    admission = "do-not-admit-full-lesson; capacity supports only the low projection with reserve";
  } else {
    admission = "do-not-admit-capture; available space is below even the low projection plus reserve";
  }
  return {
    modelVersion: 1,
    languageCount: 2,
    languages: ["en", "es"],
    pngCopiesPerLogicalFrame: PNG_COPIES_PER_LOGICAL_FRAME,
    scenarioDefinitions: {
      low: "two languages over root plus the single longest nested DefineSprite per item; one scenario; this is a capacity floor and is not strict-complete coverage",
      expected: "low timeline basis; two scenarios for each behavior-sensitive page and ten shell contexts",
      high: "root plus every statically defined nested sprite frame; three scenarios for behavior-sensitive pages and twelve shell contexts",
    },
    nonFrameAllowance:
      "Fixed 1/2/4 GiB allowances cover extraction, manifests, metrics, contact sheets, builds, and temporary browser output; 15/35/60 percent archive multipliers cover retries and file-system overhead.",
    scenarios,
    remainingEvidenceSafetyMultiplier: REMAINING_EVIDENCE_SAFETY_MULTIPLIER,
    operationalReserveBytes: OPERATIONAL_RESERVE_BYTES,
    minimumSafeFreeBytes,
    availableBytes,
    headroomBytesAtMinimumSafeThreshold: availableBytes - minimumSafeFreeBytes,
    admission,
    admissionIsFidelityEvidence: false,
  };
}

function buildAutomationEstimate({model, commandSample}) {
  const capture = Object.fromEntries(Object.entries(model.scenarios).map(([name, scenario]) => [name, {
    singleCaptureStreamHours: Number((scenario.implementationCaptureWallClockSecondsSingleStream / 3600).toFixed(1)),
    twoCaptureStreamsIdealizedHours: Number((scenario.implementationCaptureWallClockSecondsSingleStream / 7200).toFixed(1)),
  }]));
  return {
    estimateType: "rough Codex-automation wall-clock range; not a completion promise",
    parallelism: {
      maximumUsefulPipelines: 3,
      pipelines: ["next-batch-source-audit", "current-batch-implementation", "previous-batch-validation"],
      recommendedConcurrentCaptureStreams: 1,
      idealizedMaximumCaptureStreams: 2,
      reason: "four-agent coordination can overlap audit/code/validation, but browser capture and PNG writes share one high-utilization APFS volume",
    },
    measuredAnchors: {
      implementationCapture: capture,
      npmTestDurationMs: commandSample.npmTestDurationMs,
      npmBuildDurationMs: commandSample.npmBuildDurationMs,
    },
    phases: [
      {
        phase: "static source audit, extraction, scaffolding, and specification drafts",
        codexAutomatable: true,
        roughWallClock: "4-12 hours with bounded parallel extraction; authoritative runtime ambiguities remain human-gated",
      },
      {
        phase: "40 JavaScript renderers, pure timelines, bilingual wiring, and behavior tests",
        codexAutomatable: true,
        roughWallClock: "4-10 continuous Codex days after behavior specifications are available; high-risk random/quiz/shell pages can extend this",
      },
      {
        phase: "implementation full-frame capture, diff, contact sheets, tests, and builds",
        codexAutomatable: true,
        roughWallClock: "use the measured capture-hour scenarios above plus 2-8 hours for repeated test/build/report cycles",
      },
      {
        phase: "named-human original-runtime operation, bilingual listening, strict visual review, and owner acceptance",
        codexAutomatable: false,
        roughWallClock: "not estimated as machine time; scheduling and review findings determine elapsed time",
      },
    ],
    aggregateCodexRange: {
      javascriptConversionOnly: "about 5-10 continuous Codex days",
      automatedEngineeringAndValidation: "about 8-18 continuous Codex days, excluding named-human gates and fidelity repair triggered by them",
      highUncertaintyCase: "about 18-30 Codex days if behavior branches, fonts, audio timing, or shell integration require repeated reconstruction",
    },
    namedHumanBoundary: [
      "acknowledge Animate legacy-conversion warnings and personally operate any required authorized original runtime or Projector session",
      "execute/sign same-session original-runtime trace and baseline artifacts where the runbook requires a named operator",
      "listen to English and Spanish audio for identity, quality, timing, and synchronization acceptance",
      "perform strict human visual review and owner acceptance; Codex cannot sign or impersonate these roles",
    ],
    caveat:
      "The repository measures capture/test/build throughput, not autonomous renderer-reconstruction time. Calendar ranges are planning estimates and must not be promoted to acceptance evidence.",
  };
}

export function validateCapacityReport(report) {
  if (report.schemaVersion !== REPORT_VERSION) throw new Error("capacity report schemaVersion mismatch");
  if (report.reportType !== "g4-l3-capture-capacity-readiness") throw new Error("capacity report type mismatch");
  if (report.acceptance?.acceptanceNeutral !== true || report.capacityModel?.admissionIsFidelityEvidence !== false) {
    throw new Error("capacity report must remain acceptance-neutral");
  }
  if (report.lessonScope?.canonicalItems !== 40 || report.lessonScope?.activePages !== 39 || report.lessonScope?.courseShells !== 1) {
    throw new Error("capacity report must retain the 39-page plus shell scope");
  }
  if (report.sourceTimelineFacts?.summary?.rootFrameCountSum !== 440) {
    throw new Error("capacity report root frame sum must remain 440");
  }
  if (report.sourceTimelineFacts?.items?.length !== 40) throw new Error("capacity report requires 40 source timeline records");
  if (!report.captureSample?.actualPngBytes?.count || !report.captureSample?.actualPngBytes?.p95) {
    throw new Error("capacity report requires actual PNG byte samples");
  }
  const fs = report.environmentSnapshot?.filesystem;
  if (!Number.isFinite(fs?.availableBytes) || fs.availableBytes < 0 || !fs.inspectedPath) {
    throw new Error("capacity report requires a valid dynamic filesystem snapshot");
  }
  if (report.capacityModel.remainingEvidenceSafetyMultiplier !== REMAINING_EVIDENCE_SAFETY_MULTIPLIER
    || report.capacityModel.operationalReserveBytes !== OPERATIONAL_RESERVE_BYTES
    || report.capacityModel.minimumSafeFreeBytes
      !== Math.ceil(report.capacityModel.scenarios.high.incrementalBytes * REMAINING_EVIDENCE_SAFETY_MULTIPLIER)
        + report.capacityModel.operationalReserveBytes) {
    throw new Error("minimum safe free-space calculation mismatch");
  }
  if (report.automationWallClock?.namedHumanBoundary?.length !== 4) {
    throw new Error("capacity report must preserve the named-human boundary");
  }
  return report;
}

function stableProjection(report) {
  return {
    schemaVersion: report.schemaVersion,
    reportType: report.reportType,
    generator: report.generator,
    acceptance: report.acceptance,
    sourceBindings: report.sourceBindings,
    lessonScope: report.lessonScope,
    sourceTimelineFacts: report.sourceTimelineFacts,
    capacityMethod: {
      modelVersion: report.capacityModel.modelVersion,
      languageCount: report.capacityModel.languageCount,
      languages: report.capacityModel.languages,
      pngCopiesPerLogicalFrame: report.capacityModel.pngCopiesPerLogicalFrame,
      scenarioDefinitions: report.capacityModel.scenarioDefinitions,
      nonFrameAllowance: report.capacityModel.nonFrameAllowance,
      remainingEvidenceSafetyMultiplier: report.capacityModel.remainingEvidenceSafetyMultiplier,
      operationalReserveBytes: report.capacityModel.operationalReserveBytes,
      admissionIsFidelityEvidence: report.capacityModel.admissionIsFidelityEvidence,
    },
    automationMethod: {
      estimateType: report.automationWallClock.estimateType,
      parallelism: report.automationWallClock.parallelism,
      phases: report.automationWallClock.phases,
      aggregateCodexRange: report.automationWallClock.aggregateCodexRange,
      namedHumanBoundary: report.automationWallClock.namedHumanBoundary,
      caveat: report.automationWallClock.caveat,
    },
  };
}

function formatBytes(bytes) {
  const sign = bytes < 0 ? "-" : "";
  const absolute = Math.abs(bytes);
  if (absolute >= GIB) return `${sign}${(absolute / GIB).toFixed(2)} GiB`;
  if (absolute >= 1024 ** 2) return `${sign}${(absolute / 1024 ** 2).toFixed(1)} MiB`;
  if (absolute >= 1024) return `${sign}${(absolute / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

export function renderCapacityMarkdown(report) {
  const fs = report.environmentSnapshot.filesystem;
  const sample = report.captureSample;
  const facts = report.sourceTimelineFacts.summary;
  const model = report.capacityModel;
  const testSample = report.commandDurationSample.npmTestDurationMs;
  const buildSample = report.commandDurationSample.npmBuildDurationMs;
  const rows = Object.entries(model.scenarios).map(([name, scenario]) =>
    `| ${name} | ${scenario.logicalEvidenceFrames.toLocaleString("en-US")} | ${scenario.pngObjectCount.toLocaleString("en-US")} | ${formatBytes(scenario.incrementalBytes)} | ${(scenario.implementationCaptureWallClockSecondsSingleStream / 3600).toFixed(1)} h |`,
  );
  return [
    "# G4 L3 Capture Capacity Readiness",
    "",
    "> Dynamic workstation snapshot and acceptance-neutral planning estimate only. Capacity does not prove baseline authority, RMSE, behavior, audio, human/owner acceptance, parity, or migration completion.",
    "",
    "## Current environment snapshot",
    "",
    `- Snapshot time: \`${report.environmentSnapshot.capturedAt}\``,
    `- Filesystem: \`${fs.filesystem || "unreported"}\` mounted at \`${fs.mountPoint || "unreported"}\`; inspected path \`${fs.inspectedPath}\``,
    `- Available bytes: ${fs.availableBytes.toLocaleString("en-US")} (${formatBytes(fs.availableBytes)}); total ${formatBytes(fs.totalBytes)}; df capacity ${fs.capacityPercent || "unreported"}`,
    ...report.environmentSnapshot.observedRoots.map((root) => `- Existing \`${root.path}\`: ${formatBytes(root.bytes)}`),
    "",
    "## Evidence basis",
    "",
    `- Lesson scope: 40 canonical items (39 active pages + 1 shell); ${report.lessonScope.behaviorSensitiveItems}/40 machine-triaged behavior-sensitive.`,
    `- Source root frames: ${facts.rootFrameCountSum.toLocaleString("en-US")}. Static nested DefineSprite definitions: ${facts.nestedDefinitionCount.toLocaleString("en-US")} definitions / ${facts.nestedDeclaredFrameCountSum.toLocaleString("en-US")} declared frames; longest single nested definition ${facts.maximumSingleNestedDefinitionFrameCount.toLocaleString("en-US")} frames.`,
    `- Actual capture sample: ${sample.admittedManifestCount.toLocaleString("en-US")} schema-v4 manifests and ${sample.actualPngFrameCount.toLocaleString("en-US")} existing 800×600 PNG frames. Bytes/frame p50 ${formatBytes(sample.actualPngBytes.p50)}, p75 ${formatBytes(sample.actualPngBytes.p75)}, p95 ${formatBytes(sample.actualPngBytes.p95)}.`,
    `- Coarse implementation-capture throughput: p50 ${sample.inferredCaptureSecondsPerFrame.p50.toFixed(2)} s/frame, p75 ${sample.inferredCaptureSecondsPerFrame.p75.toFixed(2)}, p90 ${sample.inferredCaptureSecondsPerFrame.p90.toFixed(2)}. This is inferred from consecutive manifest completion times, not per-frame instrumentation.`,
    `- Historical commands: npm test p50 ${testSample ? (testSample.p50 / 1000).toFixed(1) : "n/a"} s / p90 ${testSample ? (testSample.p90 / 1000).toFixed(1) : "n/a"} s; build p50 ${buildSample ? (buildSample.p50 / 1000).toFixed(1) : "n/a"} s / p90 ${buildSample ? (buildSample.p90 / 1000).toFixed(1) : "n/a"} s.`,
    "",
    "Static nested-definition totals are storage-sizing inputs only. They are not proof of runtime reachability or required independent frame domains.",
    "",
    "## Capacity projection",
    "",
    "Each logical evidence frame reserves three PNGs: authoritative original-runtime baseline, JavaScript implementation, and diff. Fixed working allowances plus retry/archive overhead are included.",
    "",
    "| Scenario | Logical evidence frames | PNG objects | Incremental storage | One implementation-capture stream |",
    "|---|---:|---:|---:|---:|",
    ...rows,
    "",
    `Recommended minimum safe free space: **${formatBytes(model.minimumSafeFreeBytes)}** (high remaining-evidence projection ${formatBytes(model.scenarios.high.incrementalBytes)} × ${model.remainingEvidenceSafetyMultiplier.toFixed(2)} + ${formatBytes(model.operationalReserveBytes)} operational reserve).`,
    "",
    `Admission recommendation at snapshot time: **${model.admission}**. Current headroom against that safe threshold: ${formatBytes(model.headroomBytesAtMinimumSafeThreshold)}.`,
    "",
    "No evidence was deleted, moved, compressed, or reclassified to reach this recommendation. Re-run the snapshot immediately before every capture sub-batch because free space is dynamic.",
    "",
    "## Codex automation wall-clock",
    "",
    `- Useful parallelism: ${report.automationWallClock.parallelism.maximumUsefulPipelines} pipelines (next audit / current implementation / previous validation); keep browser capture at one stream on the current high-utilization volume, with two only as an idealized ceiling.`,
    `- JavaScript conversion only: ${report.automationWallClock.aggregateCodexRange.javascriptConversionOnly}.`,
    `- Automated engineering plus validation: ${report.automationWallClock.aggregateCodexRange.automatedEngineeringAndValidation}.`,
    `- High-uncertainty case: ${report.automationWallClock.aggregateCodexRange.highUncertaintyCase}.`,
    "- The measured capture-hour values are in the table. Renderer reconstruction time is not instrumented by the repository, so the day ranges are planning estimates, not promises.",
    "",
    "Codex can automate static extraction, source inventories, renderer/timeline generation, deterministic implementation captures, diffs, tests, builds, and report assembly. A named human must still personally operate/sign required original-runtime sessions, listen to both language tracks, perform strict visual review, and provide owner acceptance. Those gates are excluded from machine wall-clock estimates.",
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export async function buildCapacityReport({snapshotAt = new Date().toISOString()} = {}) {
  const [preflightBytes, preflight, environmentSnapshot, captureSample, commandSample] = await Promise.all([
    readFile(PREFLIGHT_PATH),
    readJson(PREFLIGHT_PATH),
    filesystemSnapshot(snapshotAt),
    captureManifestSample(),
    commandDurationSample(),
  ]);
  if (preflight.summary?.canonicalItems !== 40 || preflight.lesson?.activeXmlReferencedPages !== 39) {
    throw new Error("G4 L3 preflight scope is not the expected 39 pages plus shell");
  }
  const itemFacts = [];
  for (const item of preflight.items) {
    const swfBytes = await readFile(path.join(projectRoot, item.source.swf.path));
    if (sha256(swfBytes) !== item.source.swf.sha256) throw new Error(`${item.animationId}: source SWF hash mismatch`);
    const parsed = collectSwfTimelineFacts(swfBytes);
    if (parsed.rootFrameCount !== item.runtime.rootFrameCount) throw new Error(`${item.animationId}: root frame mismatch`);
    itemFacts.push({
      animationId: item.animationId,
      sourceSwfPath: item.source.swf.path,
      sourceSwfSha256: item.source.swf.sha256,
      sourceBytes: item.source.swf.bytes + (item.source.fla?.bytes || 0),
      shell: item.releaseRole === "course-shell",
      behaviorSensitive: Boolean(
        item.complexity.interaction.detected ||
        item.complexity.random.detected ||
        item.complexity.externalCalls.detected ||
        item.releaseRole === "course-shell"
      ),
      rootFrameCount: parsed.rootFrameCount,
      nestedDefinitionCount: parsed.nestedDefinitionCount,
      nestedDeclaredFrameCountSum: parsed.nestedDeclaredFrameCountSum,
      nestedDeclaredFrameCountMax: parsed.nestedDeclaredFrameCountMax,
      zeroFrameDefinitionCount: parsed.zeroFrameDefinitionCount,
    });
  }
  const sourceFacts = sourceTimelineSummary(itemFacts);
  const capacityModel = buildCapacityModel({
    itemFacts,
    captureSample,
    availableBytes: environmentSnapshot.filesystem.availableBytes,
  });
  const report = {
    schemaVersion: REPORT_VERSION,
    reportType: "g4-l3-capture-capacity-readiness",
    generatedAt: snapshotAt,
    generator: {path: relative(scriptPath), version: REPORT_VERSION},
    acceptance: {
      acceptanceNeutral: true,
      migrationStatusChanges: 0,
      reviewOrApprovalChanges: 0,
      baselineOrCoverageChanges: 0,
      sourceAssetChanges: 0,
      statement:
        "This readiness report is an environment and planning snapshot only. It does not establish original-runtime authority, visual or behavioral parity, RMSE acceptance, audio acceptance, human/owner approval, or migration completion.",
    },
    sourceBindings: {
      preflight: {
        path: relative(PREFLIGHT_PATH),
        sha256: sha256(preflightBytes),
        bytes: preflightBytes.length,
        generator: preflight.generator,
      },
    },
    environmentSnapshot,
    lessonScope: {
      releaseId: preflight.lesson.releaseId,
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
      behaviorSensitiveItems: sourceFacts.behaviorSensitiveItems,
      flaBacked: preflight.summary.flaBacked,
      swfOnly: preflight.summary.swfOnly,
    },
    sourceTimelineFacts: {
      method: "direct parse of hash-verified SWF root FrameCount and every recursive DefineSprite FrameCount",
      summary: sourceFacts,
      items: itemFacts,
    },
    captureSample,
    commandDurationSample: commandSample,
    capacityModel,
    automationWallClock: buildAutomationEstimate({model: capacityModel, commandSample}),
  };
  return validateCapacityReport(report);
}

export function parseArguments(argv) {
  const options = {
    check: false,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") options.jsonOutput = path.resolve(argv[++index]);
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(argv[++index]);
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown option ${argument}`);
  }
  return options;
}

async function assertSafeOutput(filePath, extension) {
  if (path.extname(filePath) !== extension) throw new Error(`Output must end in ${extension}`);
  const reportsRoot = path.join(projectRoot, "reports");
  const relativePath = path.relative(reportsRoot, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) throw new Error("Output must remain inside reports/");
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write("node scripts/build-g4-l3-capture-capacity-readiness.mjs [--check] [--json-output reports/file.json] [--markdown-output reports/file.md]\n");
    return;
  }
  await Promise.all([
    assertSafeOutput(options.jsonOutput, ".json"),
    assertSafeOutput(options.markdownOutput, ".md"),
  ]);
  const report = await buildCapacityReport();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderCapacityMarkdown(report);
  if (options.check) {
    const existing = validateCapacityReport(await readJson(options.jsonOutput));
    if (JSON.stringify(stableProjection(existing)) !== JSON.stringify(stableProjection(report))) {
      throw new Error("G4 L3 capacity report static/source projection is missing or stale");
    }
    const existingMarkdown = await readFile(options.markdownOutput, "utf8");
    if (!existingMarkdown.includes("Dynamic workstation snapshot") || !existingMarkdown.includes("Capacity does not prove")) {
      throw new Error("G4 L3 capacity markdown is missing its dynamic acceptance boundary");
    }
    process.stdout.write(
      `PASS: G4 L3 capacity report static projection; current free ${report.environmentSnapshot.filesystem.availableBytes} bytes; checked-in snapshot ${existing.environmentSnapshot.filesystem.availableBytes} bytes\n`,
    );
    return;
  }
  await Promise.all([
    writeFile(options.jsonOutput, json),
    writeFile(options.markdownOutput, markdown),
  ]);
  process.stdout.write(
    `WROTE: G4 L3 capacity report; free ${report.environmentSnapshot.filesystem.availableBytes} bytes; recommendation ${report.capacityModel.admission}\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
