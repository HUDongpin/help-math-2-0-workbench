#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {comparePngFiles} from "./compare-images.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const SCENARIO = "manual-runtime-diagnostic-observation";
const REQUIREMENT_ID = "diagnostic:ts006:manual-runtime-observation:en";
const TRACE_ID = "diagnostic:ts005-to-ts006-natural:en:seed-0";
const ENTRY_STATE_SHA256 =
  "08f727387e57a543f8cecb9b7340c8822e393ee082caf1a3c69ecd3e581b5d8d";
const ORIGINAL_DIRECTORY =
  "artifacts/full-frame/g4-l3/ts006-en-manual-diagnostic-2026-07-26T04-44-43Z/evidence/raw-captures/natural-shell-continuation-2026-07-26T04-47-47Z";
const DEFAULT_ITERATION = "v5";
const ITERATION = /^[a-z0-9][a-z0-9-]*$/u;

export const DIAGNOSTIC_FRAME_PAIRS = Object.freeze([
  Object.freeze({sourceFrame: 1, originalCaptureOrdinal: 2032, kind: "static"}),
  Object.freeze({sourceFrame: 8, originalCaptureOrdinal: 2045, kind: "transition"}),
  Object.freeze({sourceFrame: 13, originalCaptureOrdinal: 2054, kind: "transition"}),
  Object.freeze({sourceFrame: 55, originalCaptureOrdinal: 2134, kind: "transition"}),
  Object.freeze({sourceFrame: 58, originalCaptureOrdinal: 2140, kind: "transition"}),
  Object.freeze({sourceFrame: 74, originalCaptureOrdinal: 2170, kind: "transition"}),
  Object.freeze({sourceFrame: 77, originalCaptureOrdinal: 2176, kind: "transition"}),
  Object.freeze({sourceFrame: 125, originalCaptureOrdinal: 2267, kind: "transition"}),
  Object.freeze({sourceFrame: 127, originalCaptureOrdinal: 2271, kind: "transition"}),
  Object.freeze({sourceFrame: 128, originalCaptureOrdinal: 2272, kind: "static"}),
]);

export function diagnosticComparisonPaths(iteration = DEFAULT_ITERATION) {
  invariant(ITERATION.test(iteration), "diagnostic comparison iteration must be a safe lowercase identifier");
  return {
    implementationDirectory:
      `output/playwright/g4-l3-ts006-diagnostic-composite-${iteration}/en-natural-entry-diagnostic`,
    diffDirectory:
      `artifacts/full-frame/comparisons/course-g04-l03-ts-006/manual-runtime-diagnostic-composite-${iteration}`,
    reportJson: `reports/g4-l3-ts006-diagnostic-composite-comparison-${iteration}.json`,
    reportMarkdown: `reports/g4-l3-ts006-diagnostic-composite-comparison-${iteration}.md`,
  };
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJson(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {bytes, value: JSON.parse(bytes.toString("utf8"))};
}

export function validateDiagnosticComparisonInputs({original, implementation}) {
  invariant(original?.status === "raw-capture-not-yet-bound-to-runtime-trace",
    "original input must remain an unpromoted raw diagnostic capture");
  invariant(original.runtimeAuthorityClaimed === false && original.acceptanceEffect === "none",
    "original diagnostic capture must not claim runtime authority or acceptance");
  invariant(Array.isArray(original.frames) && original.frames.length === 3564,
    "original diagnostic capture must contain all 3564 complete frames");
  invariant(original.frames.every((frame, index) =>
    frame.ordinal === index + 1 && frame.status === "complete" &&
    frame.width === 800 && frame.height === 600 && /^[a-f0-9]{64}$/.test(frame.sha256)),
  "original diagnostic frame inventory is incomplete or malformed");

  invariant(implementation?.status === "complete" &&
    implementation.animationId === ANIMATION_ID,
  "implementation capture identity or status is invalid");
  invariant(implementation.frameDomainId === "sprite-23" &&
    implementation.scenario === SCENARIO && implementation.language === "en" &&
    implementation.seed === "0" && implementation.requirementId === REQUIREMENT_ID &&
    implementation.traceId === TRACE_ID &&
    implementation.entryStateSha256 === ENTRY_STATE_SHA256,
  "implementation capture identity does not match the diagnostic comparison contract");
  invariant(Array.isArray(implementation.captured) &&
    implementation.captured.length === DIAGNOSTIC_FRAME_PAIRS.length,
  "implementation capture must contain the ten declared diagnostic keyframes");
  const expectedFrames = DIAGNOSTIC_FRAME_PAIRS.map(({sourceFrame}) => sourceFrame);
  invariant(implementation.captured.every((frame, index) =>
    frame.frame === expectedFrames[index] && frame.reportedFrame === expectedFrames[index] &&
    frame.reportedAnimationId === ANIMATION_ID && frame.frameDomainId === "sprite-23" &&
    frame.scenario === SCENARIO && frame.language === "en" && frame.seed === "0" &&
    frame.width === 800 && frame.height === 600 && /^[a-f0-9]{64}$/.test(frame.sha256)),
  "implementation diagnostic keyframe identity is incomplete or out of order");
  invariant((implementation.consoleErrors ?? []).length === 0 &&
    (implementation.failedRequests ?? []).length === 0 &&
    (implementation.httpErrors ?? []).length === 0 &&
    (implementation.unexpectedRequests ?? []).length === 0,
  "implementation diagnostic capture contains browser or network errors");
  return true;
}

function summarize(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: total / values.length,
  };
}

function markdown(report) {
  const rows = report.comparisons.map((item) =>
    `| ${item.sourceFrame} | ${item.originalCaptureOrdinal} | ${item.kind} | ${item.normalizedRmse.toFixed(6)} | ${item.mismatchedPixelRatio.toFixed(6)} |`).join("\n");
  return `# G4 L3 TS006 diagnostic-composite comparison\n\n` +
    `This report compares a browser engineering candidate with manually annotated frames from an unpromoted English Flash Player diagnostic. It is useful for iteration only and has no strict-acceptance effect.\n\n` +
    `## Result\n\n` +
    `- Compared keyframes: ${report.summary.comparedFrames}\n` +
    `- Normalized RMSE mean: ${report.summary.normalizedRmse.mean.toFixed(6)}\n` +
    `- Normalized RMSE min/max: ${report.summary.normalizedRmse.min.toFixed(6)} / ${report.summary.normalizedRmse.max.toFixed(6)}\n` +
    `- Static threshold passes: ${report.summary.staticThresholdPasses}/${report.summary.staticFrames}\n` +
    `- Transition target passes: ${report.summary.transitionThresholdPasses}/${report.summary.transitionFrames}\n` +
    `- Strict acceptance effect: **none**\n\n` +
    `| Source frame | Diagnostic capture ordinal | Kind | RMSE | Mismatch ratio |\n|---:|---:|---|---:|---:|\n${rows}\n\n` +
    `## Boundary\n\nThe frame pairing is a manual diagnostic calibration, not an authoritative source-frame mapping. EN/ES independent promotable captures, audio timing and listening review, full 128-frame identity-aligned comparison, independent human review, Owner acceptance, and strict completion remain pending.\n`;
}

export async function compareG4L3Ts006DiagnosticComposite({iteration = DEFAULT_ITERATION} = {}) {
  const {
    implementationDirectory,
    diffDirectory,
    reportJson,
    reportMarkdown,
  } = diagnosticComparisonPaths(iteration);
  const originalManifestPath = `${ORIGINAL_DIRECTORY}/capture-manifest.json`;
  const implementationManifestPath = `${implementationDirectory}/capture-manifest.json`;
  const [{bytes: originalBytes, value: original}, {bytes: implementationBytes, value: implementation}] =
    await Promise.all([readJson(originalManifestPath), readJson(implementationManifestPath)]);
  validateDiagnosticComparisonInputs({original, implementation});
  await mkdir(projectPath(diffDirectory), {recursive: true});
  const comparisons = [];
  for (const pair of DIAGNOSTIC_FRAME_PAIRS) {
    const originalFile = `${ORIGINAL_DIRECTORY}/frames/frame-${String(pair.originalCaptureOrdinal).padStart(6, "0")}.png`;
    const implementationFile = `${implementationDirectory}/frame-${String(pair.sourceFrame).padStart(3, "0")}.png`;
    const diffFile = `${diffDirectory}/source-${String(pair.sourceFrame).padStart(3, "0")}-diagnostic-${String(pair.originalCaptureOrdinal).padStart(6, "0")}.png`;
    const metrics = await comparePngFiles(
      projectPath(originalFile),
      projectPath(implementationFile),
      {diff: projectPath(diffFile), pixelThreshold: 0.1},
    );
    comparisons.push({
      ...pair,
      originalFile,
      originalSha256: original.frames[pair.originalCaptureOrdinal - 1].sha256,
      implementationFile,
      implementationSha256: implementation.captured.find(
        (frame) => frame.frame === pair.sourceFrame,
      ).sha256,
      diffFile,
      normalizedRmse: metrics.normalizedRmse,
      mismatchedPixels: metrics.mismatchedPixels,
      mismatchedPixelRatio: metrics.mismatchedPixelRatio,
      informationalThreshold: pair.kind === "static" ? 0.05 : 0.08,
      informationalThresholdPassed:
        metrics.normalizedRmse <= (pair.kind === "static" ? 0.05 : 0.08),
    });
  }
  const staticItems = comparisons.filter((item) => item.kind === "static");
  const transitionItems = comparisons.filter((item) => item.kind === "transition");
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-diagnostic-composite-comparison",
    animationId: ANIMATION_ID,
    iteration,
    classification: "diagnostic-engineering-comparison-not-strict-evidence",
    authority: {
      originalRuntime: "manual-current-admin-account-diagnostic-only",
      sourceFrameMapping: "manual-observation-calibration-not-authoritative",
      implementation: "engineering-candidate",
      runtimeAuthorityClaimed: false,
      visualParityClaimed: false,
      strictAcceptanceEffect: "none",
    },
    identity: {
      frameDomain: "sprite-23",
      scenario: SCENARIO,
      language: "en",
      seed: "0",
      requirementId: REQUIREMENT_ID,
      traceId: TRACE_ID,
      entryStateSha256: ENTRY_STATE_SHA256,
    },
    bindings: {
      originalCaptureManifest: {path: originalManifestPath, bytes: originalBytes.length, sha256: sha256(originalBytes)},
      implementationCaptureManifest: {path: implementationManifestPath, bytes: implementationBytes.length, sha256: sha256(implementationBytes)},
      generator: {path: portable(path.relative(ROOT, SCRIPT_PATH)), sha256: sha256(await readFile(SCRIPT_PATH))},
    },
    comparisons,
    summary: {
      comparedFrames: comparisons.length,
      staticFrames: staticItems.length,
      transitionFrames: transitionItems.length,
      normalizedRmse: summarize(comparisons.map((item) => item.normalizedRmse)),
      staticThresholdPasses: staticItems.filter((item) => item.informationalThresholdPassed).length,
      transitionThresholdPasses: transitionItems.filter((item) => item.informationalThresholdPassed).length,
      browserCaptureClean: true,
    },
    unresolved: [
      "The original frames come from an unpromoted current-admin-account diagnostic capture.",
      "The source-frame pairing is a manual calibration rather than an authoritative frame identity.",
      "Spanish, audio timing/listening, full 128-frame comparison, independent review, Owner acceptance, and strict completion remain pending.",
    ],
    strictAcceptanceEffect: "none",
  };
  await Promise.all([
    writeFile(projectPath(reportJson), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(projectPath(reportMarkdown), markdown(report)),
  ]);
  return report;
}

export function parseArguments(argv) {
  const options = {iteration: DEFAULT_ITERATION};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--iteration") options.iteration = argv[++index];
    else throw new Error(`Unknown option: ${argument}`);
  }
  diagnosticComparisonPaths(options.iteration);
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  compareG4L3Ts006DiagnosticComposite(parseArguments(process.argv.slice(2))).then((report) => {
    console.log(JSON.stringify(report.summary, null, 2));
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
