#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

const ACCEPTED_BASELINE_AUTHORITIES = new Map([
  [
    "authoritative-standalone-runtime-baseline",
    "original-swf-adobe-flash-player-runtime",
  ],
  [
    "authoritative-source-composited-spanish-visual-baseline",
    "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
  ],
]);

const GLYPHS = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  "-": ["000", "000", "000", "111", "000", "000", "000"],
  ".": ["000", "000", "000", "000", "000", "110", "110"],
  "/": ["001", "001", "010", "010", "100", "100", "000"],
  ":": ["000", "110", "110", "000", "110", "110", "000"],
  "=": ["000", "111", "000", "111", "000", "000", "000"],
  "0": ["111", "101", "101", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "010", "010", "111"],
  "2": ["111", "001", "001", "111", "100", "100", "111"],
  "3": ["111", "001", "001", "111", "001", "001", "111"],
  "4": ["101", "101", "101", "111", "001", "001", "001"],
  "5": ["111", "100", "100", "111", "001", "001", "111"],
  "6": ["111", "100", "100", "111", "101", "101", "111"],
  "7": ["111", "001", "001", "010", "010", "100", "100"],
  "8": ["111", "101", "101", "111", "101", "101", "111"],
  "9": ["111", "101", "101", "111", "001", "001", "111"],
  A: ["010", "101", "101", "111", "101", "101", "101"],
  B: ["110", "101", "101", "110", "101", "101", "110"],
  C: ["111", "100", "100", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "101", "101", "110"],
  E: ["111", "100", "100", "110", "100", "100", "111"],
  F: ["111", "100", "100", "110", "100", "100", "100"],
  G: ["111", "100", "100", "101", "101", "101", "111"],
  H: ["101", "101", "101", "111", "101", "101", "101"],
  I: ["111", "010", "010", "010", "010", "010", "111"],
  J: ["111", "001", "001", "001", "101", "101", "111"],
  K: ["101", "101", "110", "100", "110", "101", "101"],
  L: ["100", "100", "100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["1001", "1101", "1101", "1011", "1011", "1001", "1001"],
  O: ["111", "101", "101", "101", "101", "101", "111"],
  P: ["110", "101", "101", "110", "100", "100", "100"],
  Q: ["1110", "1001", "1001", "1001", "1011", "1110", "0011"],
  R: ["110", "101", "101", "110", "101", "101", "101"],
  S: ["111", "100", "100", "111", "001", "001", "111"],
  T: ["111", "010", "010", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "101", "101", "010"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["101", "101", "101", "010", "101", "101", "101"],
  Y: ["101", "101", "101", "010", "010", "010", "010"],
  Z: ["111", "001", "001", "010", "100", "100", "111"],
};

function usage() {
  return `Usage:
  node scripts/build-engineering-contact-sheet.mjs \\
    --comparison <comparison.json> \\
    --baseline-report <adobe-baseline.json> \\
    --capture-manifest <capture-manifest.json> \\
    --output <contact-sheet-manifest.json> [options]

Options:
  --frames-per-page <positive integer>  Default: 10
  --page-columns <positive integer>     Default: 2
  --scenario-equivalence <from=to>     Explicit original-baseline to implementation scenario mapping
  --language-equivalence <from=to>     Explicit source-neutral baseline to implementation language mapping
  --generated-at <ISO timestamp>        Override for reproducible tests
  --help                                Show this help

The command verifies every baseline, implementation, and diff PNG against all
three machine-readable manifests before creating tracked, paginated contact
sheets. It does not perform or represent human or owner review.`;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} must be a positive integer`);
  return number;
}

function scenarioEquivalence(value) {
  const match = /^([A-Za-z0-9._-]+)=([A-Za-z0-9._-]+)$/.exec(value);
  if (!match) throw new Error("--scenario-equivalence must use <baseline>=<implementation>");
  return { baseline: match[1], implementation: match[2] };
}

function languageEquivalence(value) {
  const match = /^([A-Za-z0-9._-]+)=([A-Za-z0-9._-]+)$/.exec(value);
  if (!match) throw new Error("--language-equivalence must use <baseline>=<implementation>");
  return { baseline: match[1], implementation: match[2] };
}

function validateScenarioEquivalence({ baselineScenario, comparisonScenario, implementationScenario, mapping }) {
  if (baselineScenario === implementationScenario) {
    assert(mapping === null || mapping === undefined,
      "--scenario-equivalence is ambiguous when baseline and implementation scenarios are already identical");
    assert(comparisonScenario === baselineScenario,
      "comparison scenario differs from the identical baseline and implementation scenario");
    return;
  }

  assert(mapping,
    "baseline and implementation scenarios differ without an exact --scenario-equivalence mapping");
  assert(mapping.baseline !== mapping.implementation,
    "--scenario-equivalence is ambiguous because it maps a scenario label to itself");
  assert(mapping.baseline === baselineScenario && mapping.implementation === implementationScenario,
    "--scenario-equivalence does not exactly map the baseline scenario to the implementation scenario");
  assert(comparisonScenario === baselineScenario || comparisonScenario === implementationScenario,
    "comparison scenario matches neither side of the exact --scenario-equivalence mapping");
}

export function parseArguments(argumentsList) {
  const options = { framesPerPage: 10, pageColumns: 2 };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if ([
      "--comparison",
      "--baseline-report",
      "--capture-manifest",
      "--output",
      "--frames-per-page",
      "--page-columns",
      "--scenario-equivalence",
      "--language-equivalence",
      "--generated-at",
    ].includes(argument)) {
      const next = argumentsList[index + 1];
      if (next === undefined || next === "") throw new Error(`${argument} requires a value`);
      if (argument === "--comparison") options.comparisonFile = path.resolve(next);
      else if (argument === "--baseline-report") options.baselineReportFile = path.resolve(next);
      else if (argument === "--capture-manifest") options.captureManifestFile = path.resolve(next);
      else if (argument === "--output") options.outputFile = path.resolve(next);
      else if (argument === "--frames-per-page") options.framesPerPage = positiveInteger(next, argument);
      else if (argument === "--page-columns") options.pageColumns = positiveInteger(next, argument);
      else if (argument === "--scenario-equivalence") options.scenarioEquivalence = scenarioEquivalence(next);
      else if (argument === "--language-equivalence") options.languageEquivalence = languageEquivalence(next);
      else options.generatedAt = next;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.help) {
    for (const [key, label] of [
      ["comparisonFile", "--comparison"],
      ["baselineReportFile", "--baseline-report"],
      ["captureManifestFile", "--capture-manifest"],
      ["outputFile", "--output"],
    ]) {
      if (!options[key]) throw new Error(`${label} is required`);
    }
  }
  return options;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function directoryDigest(frames) {
  return sha256(frames.map(({ frame, sha256: digest }) => `${frame}\0${digest}\n`).join(""));
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

function evidencePath(candidate, projectRoot) {
  const absolute = path.resolve(candidate);
  const relative = path.relative(projectRoot, absolute);
  if (relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`))) return portable(relative);
  return portable(absolute);
}

function resolveRecordedPath(recorded, projectRoot) {
  return path.isAbsolute(recorded) ? recorded : path.resolve(projectRoot, recorded);
}

async function readJsonWithHash(file) {
  const bytes = await readFile(file);
  return { bytes, sha256: sha256(bytes), value: JSON.parse(bytes.toString("utf8")) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameNumber(actual, expected, label, epsilon = 1e-12) {
  assert(Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon, `${label} does not recompute`);
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return {
    min: sorted[0],
    max: sorted.at(-1),
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle],
    p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)],
  };
}

async function inspectPng(file, expectedHash, stage, label, requireOpaque = false) {
  const bytes = await readFile(file);
  const actualHash = sha256(bytes);
  assert(actualHash === expectedHash, `${label} SHA-256 mismatch: expected ${expectedHash}, observed ${actualHash}`);
  let image;
  try {
    image = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} is not a decodable PNG: ${error.message}`);
  }
  assert(image.width === stage.width && image.height === stage.height,
    `${label} is ${image.width}x${image.height}; expected ${stage.width}x${stage.height}`);
  if (requireOpaque) {
    for (let index = 3; index < image.data.length; index += 4) {
      assert(image.data[index] === 255, `${label} contains non-opaque alpha after baseline normalization`);
    }
  }
  return image;
}

function setPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const offset = (y * image.width + x) * 4;
  image.data[offset] = color[0];
  image.data[offset + 1] = color[1];
  image.data[offset + 2] = color[2];
  image.data[offset + 3] = color[3] ?? 255;
}

function fill(image, x, y, width, height, color) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) setPixel(image, column, row, color);
  }
}

function drawText(image, value, x, y, { scale = 2, color = [20, 20, 20, 255] } = {}) {
  let cursor = x;
  for (const rawCharacter of value.toUpperCase()) {
    const glyph = GLYPHS[rawCharacter] ?? GLYPHS[" "];
    const glyphWidth = glyph[0].length;
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyph[row].length; column += 1) {
        if (glyph[row][column] !== "1") continue;
        fill(image, cursor + column * scale, y + row * scale, scale, scale, color);
      }
    }
    cursor += (glyphWidth + 1) * scale;
  }
}

function copyImage(source, destination, x, y) {
  for (let row = 0; row < source.height; row += 1) {
    const sourceStart = row * source.width * 4;
    const destinationStart = ((y + row) * destination.width + x) * 4;
    source.data.copy(destination.data, destinationStart, sourceStart, sourceStart + source.width * 4);
  }
}

async function writeAtomically(destination, bytes) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}

function validateSummary(comparison) {
  const rmse = summarize(comparison.frames.map((frame) => frame.normalizedRmse));
  const mismatch = summarize(comparison.frames.map((frame) => frame.mismatchedPixelRatio));
  for (const key of ["min", "max", "mean", "median", "p95"]) {
    sameNumber(comparison.summary.normalizedRmse[key], rmse[key], `summary.normalizedRmse.${key}`);
    sameNumber(comparison.summary.mismatchedPixelRatio[key], mismatch[key], `summary.mismatchedPixelRatio.${key}`);
  }
  const staticThreshold = comparison.contract.thresholds.staticNormalizedRmse;
  const transitionThreshold = comparison.contract.thresholds.transitionNormalizedRmse;
  const staticPass = comparison.frames.filter((frame) => frame.normalizedRmse <= staticThreshold).length;
  const transitionPass = comparison.frames.filter((frame) => frame.normalizedRmse <= transitionThreshold).length;
  const assignedFailures = comparison.frames
    .filter((frame) => frame.normalizedRmse > frame.assignedThreshold)
    .map((frame) => frame.frame);
  assert(comparison.summary.atOrBelowStaticThreshold.count === staticPass, "static-threshold count does not recompute");
  assert(comparison.summary.atOrBelowTransitionThreshold.count === transitionPass,
    "transition-threshold count does not recompute");
  assert(JSON.stringify(comparison.summary.outliers.failingAssignedThreshold) === JSON.stringify(assignedFailures),
    "assigned-threshold outliers do not recompute");
  assert(comparison.summary.allAssignedThresholdsPass === (assignedFailures.length === 0),
    "allAssignedThresholdsPass does not recompute");
}

function validateTopLevelContracts(comparison, baselineReport, captureManifest, scenarioMapping, languageMapping) {
  assert(comparison.evidenceType === "full-frame-directory-comparison", "comparison evidence type is not full-frame");
  assert(!comparison.inputs.baseline.directory.includes("invalidated-"), "comparison points to an invalidated baseline");
  assert(baselineReport.animationId === comparison.animationId, "baseline report animationId differs from comparison");
  assert(captureManifest.status === "complete", "implementation capture manifest is not complete");
  const expectedAuthority = ACCEPTED_BASELINE_AUTHORITIES.get(baselineReport.status);
  assert(expectedAuthority,
    `baseline report has unsupported authority status: ${baselineReport.status ?? "missing"}`);
  assert(baselineReport.authority?.kind === expectedAuthority,
    `baseline authority ${baselineReport.authority?.kind ?? "missing"} does not match status ${baselineReport.status}`);
  assert(baselineReport.capture?.alphaComposite?.outputAlpha === 255,
    "baseline report does not record alpha-normalized opaque output");
  assert(comparison.inputs.baseline.directory === baselineReport.capture.archiveDirectory,
    "comparison baseline directory differs from Adobe report archiveDirectory");
  validateScenarioEquivalence({
    baselineScenario: baselineReport.runtime.scenario,
    comparisonScenario: comparison.scenario,
    implementationScenario: captureManifest.scenario,
    mapping: scenarioMapping,
  });
  const sameLanguage = comparison.language === baselineReport.runtime.lang;
  const explicitlyEquivalentLanguage = languageMapping?.baseline === baselineReport.runtime.lang
    && languageMapping?.implementation === comparison.language;
  assert(sameLanguage || explicitlyEquivalentLanguage,
    "baseline language differs from comparison without an exact --language-equivalence mapping");
  assert(comparison.language === captureManifest.language, "implementation language differs from comparison");
  assert(String(comparison.seed) === String(captureManifest.seed), "implementation seed differs from comparison");
  assert(comparison.contract.expectedFrameCount === baselineReport.runtime.frameCount,
    "baseline frame count differs from comparison contract");
  assert(comparison.contract.stage.width === baselineReport.runtime.stage.width
    && comparison.contract.stage.height === baselineReport.runtime.stage.height,
  "baseline stage differs from comparison contract");
}

function validateCaptureErrors(captureManifest) {
  for (const key of ["consoleErrors", "failedRequests", "httpErrors", "unexpectedRequests"]) {
    assert(Array.isArray(captureManifest[key]) && captureManifest[key].length === 0,
      `implementation capture has ${key}`);
  }
  assert(captureManifest.error === null, "implementation capture manifest contains an error");
}

export async function buildEngineeringContactSheet({
  comparisonFile,
  baselineReportFile,
  captureManifestFile,
  outputFile,
  projectRoot = defaultProjectRoot,
  framesPerPage = 10,
  pageColumns = 2,
  scenarioEquivalence = null,
  languageEquivalence = null,
  generatedAt = new Date().toISOString(),
  generatorScriptFile = scriptPath,
}) {
  framesPerPage = positiveInteger(framesPerPage, "framesPerPage");
  pageColumns = positiveInteger(pageColumns, "pageColumns");
  const comparisonSource = await readJsonWithHash(comparisonFile);
  const baselineSource = await readJsonWithHash(baselineReportFile);
  const captureSource = await readJsonWithHash(captureManifestFile);
  const generatorBytes = await readFile(generatorScriptFile);
  const comparison = comparisonSource.value;
  const baselineReport = baselineSource.value;
  const captureManifest = captureSource.value;

  validateTopLevelContracts(comparison, baselineReport, captureManifest, scenarioEquivalence, languageEquivalence);
  validateCaptureErrors(captureManifest);
  validateSummary(comparison);

  const expectedFrameCount = comparison.contract.expectedFrameCount;
  const stage = comparison.contract.stage;
  assert(comparison.frames.length === expectedFrameCount, "comparison frame array is incomplete");
  assert(baselineReport.frames.length === expectedFrameCount, "baseline report frame array is incomplete");
  assert(captureManifest.captured.length === expectedFrameCount, "implementation capture array is incomplete");

  const baselineByFrame = new Map(baselineReport.frames.map((frame) => [frame.frame, frame]));
  const captureByFrame = new Map(captureManifest.captured.map((frame) => [frame.frame, frame]));
  assert(baselineByFrame.size === expectedFrameCount, "baseline report contains duplicate frame identities");
  assert(captureByFrame.size === expectedFrameCount, "implementation capture contains duplicate frame identities");

  const decodedFrames = [];
  for (let index = 0; index < expectedFrameCount; index += 1) {
    const expectedFrame = index + 1;
    const frame = comparison.frames[index];
    assert(frame.frame === expectedFrame, `comparison frame coverage is not sequential at ${expectedFrame}`);
    const baselineRecord = baselineByFrame.get(expectedFrame);
    const captureRecord = captureByFrame.get(expectedFrame);
    assert(baselineRecord, `baseline report is missing frame ${expectedFrame}`);
    assert(captureRecord, `implementation capture is missing frame ${expectedFrame}`);
    assert(captureRecord.reportedFrame === expectedFrame,
      `implementation frame ${expectedFrame} reported data-flash-frame=${captureRecord.reportedFrame}`);
    assert(captureRecord.scenario === captureManifest.scenario,
      `implementation frame ${expectedFrame} scenario differs from its capture manifest`);
    assert(captureRecord.language === comparison.language, `implementation frame ${expectedFrame} language differs`);
    assert(String(captureRecord.seed) === String(comparison.seed), `implementation frame ${expectedFrame} seed differs`);
    assert(baselineRecord.sha256 === frame.baselineSha256, `baseline report hash differs at frame ${expectedFrame}`);
    assert(captureRecord.sha256 === frame.implementationSha256,
      `implementation capture hash differs at frame ${expectedFrame}`);
    assert(path.basename(frame.baselineFile) === baselineRecord.file,
      `baseline report filename differs at frame ${expectedFrame}`);
    assert(path.basename(frame.implementationFile) === captureRecord.file,
      `implementation capture filename differs at frame ${expectedFrame}`);

    const baselineImage = await inspectPng(
      resolveRecordedPath(frame.baselineFile, projectRoot), frame.baselineSha256, stage,
      `baseline frame ${expectedFrame}`, true,
    );
    const implementationImage = await inspectPng(
      resolveRecordedPath(frame.implementationFile, projectRoot), frame.implementationSha256, stage,
      `implementation frame ${expectedFrame}`,
    );
    const diffImage = await inspectPng(
      resolveRecordedPath(frame.diffFile, projectRoot), frame.diffSha256, stage,
      `diff frame ${expectedFrame}`,
    );
    decodedFrames.push({ frame, baselineImage, implementationImage, diffImage });
  }

  const baselineDigest = directoryDigest(comparison.frames.map((frame) => ({
    frame: frame.frame,
    sha256: frame.baselineSha256,
  })));
  const implementationDigest = directoryDigest(comparison.frames.map((frame) => ({
    frame: frame.frame,
    sha256: frame.implementationSha256,
  })));
  const diffDigest = directoryDigest(comparison.frames.map((frame) => ({
    frame: frame.frame,
    sha256: frame.diffSha256,
  })));
  assert(baselineDigest === comparison.inputs.baseline.directorySha256, "baseline directory digest mismatch");
  assert(implementationDigest === comparison.inputs.implementation.directorySha256,
    "implementation directory digest mismatch");
  assert(diffDigest === comparison.diffArchive.directorySha256, "diff directory digest mismatch");

  const rowsPerPage = Math.ceil(framesPerPage / pageColumns);
  const imageGap = 4;
  const cellGap = 12;
  const pageMargin = 12;
  const pageHeaderHeight = 34;
  const cellLabelHeight = 22;
  const cellWidth = stage.width * 3 + imageGap * 2;
  const cellHeight = cellLabelHeight + stage.height;
  const pageWidth = pageMargin * 2 + pageColumns * cellWidth + (pageColumns - 1) * cellGap;
  const pageHeight = pageMargin * 2 + pageHeaderHeight + rowsPerPage * cellHeight
    + (rowsPerPage - 1) * cellGap;
  const pageCount = Math.ceil(expectedFrameCount / framesPerPage);
  const outputDirectory = path.dirname(outputFile);
  const pages = [];

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const image = new PNG({ width: pageWidth, height: pageHeight });
    fill(image, 0, 0, pageWidth, pageHeight, [242, 244, 247, 255]);
    drawText(
      image,
      `${comparison.animationId}  page ${pageIndex + 1}/${pageCount}`,
      pageMargin,
      pageMargin,
      { scale: 2, color: [18, 30, 52, 255] },
    );
    const pageFrames = decodedFrames.slice(pageIndex * framesPerPage, (pageIndex + 1) * framesPerPage);
    for (let localIndex = 0; localIndex < pageFrames.length; localIndex += 1) {
      const column = localIndex % pageColumns;
      const row = Math.floor(localIndex / pageColumns);
      const x = pageMargin + column * (cellWidth + cellGap);
      const y = pageMargin + pageHeaderHeight + row * (cellHeight + cellGap);
      const item = pageFrames[localIndex];
      fill(image, x, y, cellWidth, cellHeight, [255, 255, 255, 255]);
      drawText(
        image,
        `F${String(item.frame.frame).padStart(4, "0")} RMSE=${item.frame.normalizedRmse.toFixed(5)}`,
        x + 4,
        y + 4,
        { scale: 2, color: [20, 20, 20, 255] },
      );
      const imageY = y + cellLabelHeight;
      const baselineX = x;
      const implementationX = x + stage.width + imageGap;
      const diffX = x + (stage.width + imageGap) * 2;
      copyImage(item.baselineImage, image, baselineX, imageY);
      copyImage(item.implementationImage, image, implementationX, imageY);
      copyImage(item.diffImage, image, diffX, imageY);
      fill(image, baselineX, imageY, 18, 16, [29, 78, 216, 230]);
      fill(image, implementationX, imageY, 18, 16, [18, 145, 83, 230]);
      fill(image, diffX, imageY, 18, 16, [203, 42, 42, 230]);
      drawText(image, "B", baselineX + 5, imageY + 1, { scale: 2, color: [255, 255, 255, 255] });
      drawText(image, "I", implementationX + 5, imageY + 1, { scale: 2, color: [255, 255, 255, 255] });
      drawText(image, "D", diffX + 5, imageY + 1, { scale: 2, color: [255, 255, 255, 255] });
    }
    const pageNumber = String(pageIndex + 1).padStart(2, "0");
    const pageFile = path.join(outputDirectory, `page-${pageNumber}.png`);
    const bytes = PNG.sync.write(image);
    await writeAtomically(pageFile, bytes);
    pages.push({
      page: pageIndex + 1,
      file: evidencePath(pageFile, projectRoot),
      sha256: sha256(bytes),
      width: image.width,
      height: image.height,
      frames: pageFrames.map((item) => item.frame.frame),
    });
  }

  const manifest = {
    schemaVersion: 1,
    evidenceType: "full-frame-contact-sheet",
    animationId: comparison.animationId,
    generatedAt,
    generator: {
      name: "build-engineering-contact-sheet",
      script: evidencePath(generatorScriptFile, projectRoot),
      scriptSha256: sha256(generatorBytes),
    },
    sourceEvidence: {
      comparison: { file: evidencePath(comparisonFile, projectRoot), sha256: comparisonSource.sha256 },
      baselineReport: { file: evidencePath(baselineReportFile, projectRoot), sha256: baselineSource.sha256 },
      ...(baselineReport.authority.kind === "original-swf-adobe-flash-player-runtime" ? {
        adobeBaselineReport: { file: evidencePath(baselineReportFile, projectRoot), sha256: baselineSource.sha256 },
      } : {}),
      implementationCaptureManifest: {
        file: evidencePath(captureManifestFile, projectRoot),
        sha256: captureSource.sha256,
      },
    },
    contract: {
      baselineAuthority: baselineReport.authority.kind,
      baselineScenario: baselineReport.runtime.scenario,
      comparisonScenario: comparison.scenario,
      implementationScenario: captureManifest.scenario,
      scenarioEquivalence,
      baselineLanguage: baselineReport.runtime.lang,
      languageEquivalence,
      language: comparison.language,
      seed: String(comparison.seed),
      frameNumbering: "one-indexed",
      frameCount: expectedFrameCount,
      stage,
      columnsWithinEachFrame: ["baseline", "implementation", "diff"],
      framesPerPage,
      pageColumns,
      pageCount,
    },
    verification: {
      comparisonSummaryRecomputed: true,
      completeSequentialFrameCoverage: true,
      everyFrameRepresentedExactlyOnce: true,
      baselineReportHashesMatchActualPngs: true,
      baselinePngsAreOpaqueAfterAlphaNormalization: true,
      implementationCaptureHashesMatchActualPngs: true,
      implementationReportedFramesMatchRequests: true,
      diffHashesMatchActualPngs: true,
      directoryDigestsMatchComparison: true,
      nativeStageDimensionsMatch: true,
      captureStatusComplete: true,
      consoleErrors: 0,
      failedRequests: 0,
      httpErrors: 0,
      unexpectedRequests: 0,
    },
    pages,
    limitations: [
      "The contact sheet is an engineering review aid, not a human visual-review signature or owner acceptance.",
      "Silent PNG evidence does not establish audio presence, language correctness, cue timing, or synchronization.",
      "Only the scenario and language named in this manifest are represented.",
      ...(scenarioEquivalence ? [`The explicit scenario mapping ${scenarioEquivalence.baseline}=${scenarioEquivalence.implementation} only identifies the standalone default child timeline with the modern default scenario; it does not establish any other host or interaction branch.`] : []),
      ...(languageEquivalence ? [`The explicit language mapping ${languageEquivalence.baseline}=${languageEquivalence.implementation} is valid only because the audited child SWF has no language-dependent visual input or text; it does not prove parent-host titles, definitions, or audio.`] : []),
    ],
  };
  await writeAtomically(outputFile, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const manifest = await buildEngineeringContactSheet(options);
  process.stdout.write(
    `Verified ${manifest.contract.frameCount} frames and wrote ${manifest.contract.pageCount} contact-sheet pages to ${path.dirname(options.outputFile)}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
