#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_FILE), '..');
const DEFAULT_JSON = 'reports/legacy-root-candidate-visual-diagnostics.json';
const DEFAULT_MARKDOWN = 'reports/legacy-root-candidate-visual-diagnostics.md';
const STATIC_THRESHOLD = 0.05;
const TRANSITION_THRESHOLD = 0.08;
const NEAR_THRESHOLD_RATIO = 0.9;
const FRAMES_PER_CONTACT_PAGE = 4;

const range = (first, last) => Array.from({length: last - first + 1}, (_, index) => first + index);

export const PILOTS = [
  {animationId: 'course-g03-l01-ts-008', frameCount: 10},
  {
    animationId: 'course-g03-l01-vb-004',
    frameCount: 10,
    semanticRegions: [
      {
        id: 'instruction-copy',
        category: 'text',
        frames: [7, 8, 9, 10],
        bounds: {x: 60, y: 105, width: 570, height: 75},
        signal: {kind: 'dark-rgb', maximumLuminance: 130},
        minimumBaselinePixels: 100,
        minimumImplementationToBaselineRatio: 0.65,
      },
      {
        id: 'place-value-chart-labels',
        category: 'label',
        frames: [7, 8, 9, 10],
        bounds: {x: 210, y: 170, width: 220, height: 200},
        signal: {kind: 'dark-rgb', maximumLuminance: 130},
        minimumBaselinePixels: 100,
        minimumImplementationToBaselineRatio: 0.65,
      },
      {
        id: 'place-value-chart-layer-coverage',
        category: 'layer',
        frames: [7, 8, 9, 10],
        bounds: {x: 150, y: 145, width: 420, height: 260},
        signal: {kind: 'distance-from-rgb', rgb: [184, 216, 247], minimumDistance: 24},
        minimumBaselinePixels: 1_000,
        minimumImplementationToBaselineRatio: 0.7,
      },
    ],
  },
  {animationId: 'course-g03-l06-fq-002-review', frameCount: 10},
  {
    animationId: 'course-g03-l08-re-001',
    frameCount: 55,
    semanticRegions: [
      {
        id: 'quiz-review-heading-label',
        category: 'label',
        frames: range(1, 55),
        bounds: {x: 0, y: 0, width: 500, height: 60},
        signal: {kind: 'dark-rgb', maximumLuminance: 130},
        minimumBaselinePixels: 100,
        minimumImplementationToBaselineRatio: 0.65,
      },
    ],
  },
  {animationId: 'course-g04-l01-ir-001', frameCount: 10},
  {animationId: 'course-g04-l03-in-009', frameCount: 10},
  {animationId: 'course-g05-l13-rw-002', frameCount: 10},
];

function usage() {
  return `Usage:
  node scripts/build-legacy-root-candidate-diagnostics.mjs [--check]

Re-hashes and compares the seven English root implementation captures against
the legacy schema-v1 Adobe standalone root reports. Output is explicitly
candidate-only: it cannot satisfy trace authority, visual acceptance, human
review, owner review, or strict migration completion.`;
}

export function parseArguments(args) {
  const options = {check: false};
  for (const argument of args) {
    if (argument === '--check') options.check = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function projectPath(root, absolute) {
  const relative = path.relative(root, absolute);
  invariant(relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)),
    `Path escapes project root: ${absolute}`);
  return portable(relative);
}

function resolveProjectPath(root, value, label) {
  const absolute = path.resolve(root, value);
  projectPath(root, absolute);
  invariant(absolute !== root, `${label} may not be the project root`);
  return absolute;
}

async function readJsonWithHash(file, label) {
  const bytes = await readFile(file);
  let value;
  try {
    value = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return {bytes, sha256: sha256(bytes), value};
}

async function readPng(file, label, expectedStage, expectedHash, requireOpaque = true) {
  const bytes = await readFile(file);
  const observedHash = sha256(bytes);
  invariant(observedHash === expectedHash,
    `${label} hash mismatch: manifest ${expectedHash}, current PNG ${observedHash}`);
  let image;
  try {
    image = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} is not a decodable PNG: ${error.message}`);
  }
  invariant(image.width === expectedStage.width && image.height === expectedStage.height,
    `${label} is ${image.width}x${image.height}; expected ${expectedStage.width}x${expectedStage.height}`);
  if (requireOpaque) {
    for (let index = 3; index < image.data.length; index += 4) {
      invariant(image.data[index] === 255, `${label} contains non-opaque pixels`);
    }
  }
  return {bytes, image, sha256: observedHash};
}

function summarize(values) {
  invariant(values.length > 0, 'Cannot summarize an empty metric array');
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return {
    min: sorted[0],
    max: sorted.at(-1),
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle],
    p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)],
  };
}

export function computeNormalizedRgbMetrics(baseline, implementation) {
  invariant(baseline.width === implementation.width && baseline.height === implementation.height,
    'Images must have identical dimensions');
  let squaredError = 0;
  let mismatchedPixels = 0;
  let minimumX = baseline.width;
  let minimumY = baseline.height;
  let maximumX = -1;
  let maximumY = -1;
  for (let y = 0; y < baseline.height; y += 1) {
    for (let x = 0; x < baseline.width; x += 1) {
      const offset = (y * baseline.width + x) * 4;
      let changed = false;
      for (let channel = 0; channel < 3; channel += 1) {
        const difference = baseline.data[offset + channel] - implementation.data[offset + channel];
        squaredError += difference * difference;
        if (difference !== 0) changed = true;
      }
      if (!changed) continue;
      mismatchedPixels += 1;
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
  }
  const normalizedRmse = Math.sqrt(squaredError / (baseline.width * baseline.height * 3)) / 255;
  return {
    normalizedRmse,
    exactRgbMismatchedPixels: mismatchedPixels,
    exactRgbMismatchedPixelRatio: mismatchedPixels / (baseline.width * baseline.height),
    differenceBounds: mismatchedPixels === 0 ? null : {
      x: minimumX,
      y: minimumY,
      width: maximumX - minimumX + 1,
      height: maximumY - minimumY + 1,
    },
  };
}

function regionRgbMetrics(baseline, implementation, bounds) {
  invariant(Number.isInteger(bounds.x) && Number.isInteger(bounds.y)
    && Number.isInteger(bounds.width) && Number.isInteger(bounds.height)
    && bounds.x >= 0 && bounds.y >= 0 && bounds.width > 0 && bounds.height > 0
    && bounds.x + bounds.width <= baseline.width && bounds.y + bounds.height <= baseline.height,
  `Semantic bounds are outside the ${baseline.width}x${baseline.height} stage`);
  let squaredError = 0;
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const offset = (y * baseline.width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const difference = baseline.data[offset + channel] - implementation.data[offset + channel];
        squaredError += difference * difference;
      }
    }
  }
  return Math.sqrt(squaredError / (bounds.width * bounds.height * 3)) / 255;
}

function signalPixelCount(image, bounds, signal) {
  let count = 0;
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const offset = (y * image.width + x) * 4;
      const red = image.data[offset];
      const green = image.data[offset + 1];
      const blue = image.data[offset + 2];
      if (signal.kind === 'dark-rgb') {
        const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        if (luminance <= signal.maximumLuminance) count += 1;
      } else if (signal.kind === 'distance-from-rgb') {
        const distance = Math.sqrt(
          (red - signal.rgb[0]) ** 2 + (green - signal.rgb[1]) ** 2 + (blue - signal.rgb[2]) ** 2,
        );
        if (distance >= signal.minimumDistance) count += 1;
      } else throw new Error(`Unsupported semantic signal: ${signal.kind}`);
    }
  }
  return count;
}

export function evaluateSemanticRegions({regions = [], framesByNumber}) {
  const evaluations = [];
  for (const region of regions) {
    invariant(['formula', 'text', 'label', 'layer'].includes(region.category),
      `Unsupported semantic category: ${region.category}`);
    for (const frame of region.frames) {
      const pair = framesByNumber.get(frame);
      invariant(pair, `Semantic region ${region.id} references missing frame ${frame}`);
      const baselinePixels = signalPixelCount(pair.baselineImage, region.bounds, region.signal);
      if (baselinePixels < region.minimumBaselinePixels) {
        evaluations.push({
          regionId: region.id,
          category: region.category,
          frame,
          bounds: region.bounds,
          signal: region.signal,
          baselineSignalPixels: baselinePixels,
          implementationSignalPixels: null,
          implementationToBaselineRatio: null,
          regionNormalizedRmse: regionRgbMetrics(pair.baselineImage, pair.implementationImage, region.bounds),
          result: 'not-evaluated-baseline-signal-below-minimum',
          semanticRisk: false,
        });
        continue;
      }
      const implementationPixels = signalPixelCount(pair.implementationImage, region.bounds, region.signal);
      const ratio = implementationPixels / baselinePixels;
      const risk = ratio < region.minimumImplementationToBaselineRatio;
      evaluations.push({
        regionId: region.id,
        category: region.category,
        frame,
        bounds: region.bounds,
        signal: region.signal,
        baselineSignalPixels: baselinePixels,
        implementationSignalPixels: implementationPixels,
        implementationToBaselineRatio: ratio,
        minimumImplementationToBaselineRatio: region.minimumImplementationToBaselineRatio,
        regionNormalizedRmse: regionRgbMetrics(pair.baselineImage, pair.implementationImage, region.bounds),
        result: risk ? 'candidate-content-or-layer-loss-risk' : 'no-large-signal-occupancy-loss-detected',
        semanticRisk: risk,
      });
    }
  }
  return evaluations;
}

function explicitFrameKind(baselineFrame, implementationFrame) {
  const explicitKinds = [baselineFrame.kind, baselineFrame.frameType, implementationFrame.kind,
    implementationFrame.frameType].filter(Boolean);
  return explicitKinds.includes('transition') ? 'transition' : 'static';
}

function makeDifferenceImage(baseline, implementation) {
  const diff = new PNG({width: baseline.width, height: baseline.height});
  for (let index = 0; index < baseline.data.length; index += 4) {
    const changed = baseline.data[index] !== implementation.data[index]
      || baseline.data[index + 1] !== implementation.data[index + 1]
      || baseline.data[index + 2] !== implementation.data[index + 2];
    if (changed) {
      diff.data[index] = 235;
      diff.data[index + 1] = 36;
      diff.data[index + 2] = 36;
      diff.data[index + 3] = 255;
    } else {
      const gray = Math.round(
        (baseline.data[index] + baseline.data[index + 1] + baseline.data[index + 2]) / 3,
      );
      const faint = Math.round(246 + (gray / 255) * 9);
      diff.data[index] = faint;
      diff.data[index + 1] = faint;
      diff.data[index + 2] = faint;
      diff.data[index + 3] = 255;
    }
  }
  return PNG.sync.write(diff);
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

function copyImage(source, destination, x, y) {
  for (let row = 0; row < source.height; row += 1) {
    const sourceStart = row * source.width * 4;
    const destinationStart = ((y + row) * destination.width + x) * 4;
    source.data.copy(destination.data, destinationStart, sourceStart, sourceStart + source.width * 4);
  }
}

const TINY_GLYPHS = {
  ' ': ['000', '000', '000', '000', '000'],
  A: ['010', '101', '111', '101', '101'],
  F: ['111', '100', '110', '100', '100'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '100', '100'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
};

function drawTinyText(image, value, x, y, scale = 3) {
  let cursor = x;
  for (const character of value) {
    const glyph = TINY_GLYPHS[character] ?? TINY_GLYPHS[' '];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyph[row].length; column += 1) {
        if (glyph[row][column] === '1') {
          fill(image, cursor + column * scale, y + row * scale, scale, scale, [25, 33, 46, 255]);
        }
      }
    }
    cursor += 4 * scale;
  }
}

function buildContactPage(items, stage, pageNumber, pageCount) {
  const margin = 12;
  const gap = 6;
  const labelHeight = 28;
  const headerHeight = 32;
  const rowGap = 12;
  const width = margin * 2 + stage.width * 3 + gap * 2;
  const rowHeight = labelHeight + stage.height;
  const height = margin * 2 + headerHeight + items.length * rowHeight + Math.max(0, items.length - 1) * rowGap;
  const page = new PNG({width, height});
  fill(page, 0, 0, width, height, [241, 244, 248, 255]);
  drawTinyText(page, `A0 F${String(pageNumber).padStart(4, '0')}`, margin, margin, 3);
  items.forEach((item, rowIndex) => {
    const y = margin + headerHeight + rowIndex * (rowHeight + rowGap);
    fill(page, margin, y, width - margin * 2, rowHeight, [255, 255, 255, 255]);
    drawTinyText(page, `A${item.animationIndex} F${String(item.frame).padStart(4, '0')}`, margin + 4, y + 6, 3);
    const imageY = y + labelHeight;
    copyImage(item.baselineImage, page, margin, imageY);
    copyImage(item.implementationImage, page, margin + stage.width + gap, imageY);
    copyImage(item.diffImage, page, margin + (stage.width + gap) * 2, imageY);
  });
  return PNG.sync.write(page);
}

function groupMetricTies(frames) {
  const groups = new Map();
  for (const frame of frames) {
    const key = frame.normalizedRmse.toPrecision(15);
    const group = groups.get(key) ?? {normalizedRmse: frame.normalizedRmse, frames: []};
    group.frames.push(frame.frame);
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((left, right) => right.normalizedRmse - left.normalizedRmse)
    .map((group) => ({...group, count: group.frames.length}));
}

async function writeAtomically(destination, bytes) {
  await mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}

function latestIso(values) {
  const filtered = values.filter((value) => typeof value === 'string' && Number.isFinite(Date.parse(value)));
  invariant(filtered.length > 0, 'No deterministic input timestamp is available');
  return filtered.sort((left, right) => Date.parse(left) - Date.parse(right)).at(-1);
}

function semanticSummary(animations) {
  const categories = {};
  for (const category of ['formula', 'text', 'label', 'layer']) {
    const evaluations = animations.flatMap((animation) => animation.semanticRegionEvaluations
      .filter((evaluation) => evaluation.category === category));
    const findings = evaluations.filter((evaluation) => evaluation.semanticRisk);
    categories[category] = {
      configuredRegionFrameEvaluations: evaluations.length,
      semanticRiskFindingCount: findings.length,
      semanticRiskFrames: findings.map((finding) => ({
        animationId: finding.animationId,
        frame: finding.frame,
        regionId: finding.regionId,
        result: finding.result,
      })),
      result: evaluations.length === 0
        ? 'not-automatable-no-declared-semantic-region'
        : findings.length > 0
          ? 'candidate-risk-found-independent-of-rmse-threshold'
          : 'no-large-signal-occupancy-loss-detected',
    };
  }
  return categories;
}

function buildMarkdown(report) {
  const lines = [
    '# Legacy Adobe root vs current JavaScript: candidate-only diagnostics',
    '',
    '> This is an engineering diagnostic only. The schema-v1 Adobe standalone reports are not current coverage-v2 trace-bound baseline authority. Nothing here changes coverage, acceptance, human review, owner review, migration status, or strict completion.',
    '',
    `- Animations: ${report.summary.animationCount}`,
    `- Exact 800x600 frame pairs: ${report.summary.pairedFrameCount}/${report.summary.expectedFrameCount}`,
    `- Numeric RMSE passes: ${report.summary.metricPassCount}/${report.summary.expectedFrameCount}`,
    `- Numeric threshold failures: ${report.summary.metricFailureCount}`,
    `- Near-threshold review outliers (>= ${report.contract.nearThresholdNormalizedRmse.toFixed(3)}): ${report.summary.nearThresholdCount}`,
    `- Independent semantic-risk frames: ${report.summary.semanticRiskFrameCount}`,
    `- Numeric RMSE range: ${report.summary.normalizedRmse.min.toFixed(6)}–${report.summary.normalizedRmse.max.toFixed(6)}`,
    `- Candidate visual acceptance: **not granted**`,
    '',
    '## Per-animation results',
    '',
    '| Animation | Frames | RMSE max | <= threshold | Exact RGB | Semantic risks |',
    '|---|---:|---:|---:|---:|---:|',
  ];
  for (const animation of report.animations) {
    lines.push(`| ${animation.animationId} | ${animation.summary.frameCount} | ${animation.summary.normalizedRmse.max.toFixed(6)} | ${animation.summary.metricPassCount}/${animation.summary.frameCount} | ${animation.summary.exactRgbFrameCount}/${animation.summary.frameCount} | ${animation.summary.semanticRiskFrameCount} |`);
  }
  lines.push('', '## Largest mismatch groups', '');
  for (const animation of report.animations
    .filter((entry) => entry.summary.normalizedRmse.max > 0)
    .sort((left, right) => right.summary.normalizedRmse.max - left.summary.normalizedRmse.max)) {
    const groups = animation.largestMismatchGroups.slice(0, 4)
      .map((group) => `${group.normalizedRmse.toFixed(6)} at ${group.count === 1 ? `frame ${group.frames[0]}` : `${group.count} frames (${group.frames[0]}–${group.frames.at(-1)})`}`)
      .join('; ');
    lines.push(`- ${animation.animationId}: ${groups}`);
  }
  lines.push('', '## Independent semantic checks', '');
  for (const [category, result] of Object.entries(report.semanticChecks)) {
    lines.push(`- ${category}: ${result.result}; ${result.semanticRiskFindingCount} risk finding(s) across ${result.configuredRegionFrameEvaluations} configured region-frame evaluation(s).`);
  }
  const risks = report.animations.flatMap((animation) => animation.semanticRegionEvaluations
    .filter((evaluation) => evaluation.semanticRisk));
  if (risks.length) {
    lines.push('', 'The automated source-annotated foreground-occupancy check found:');
    for (const risk of risks) {
      lines.push(`- ${risk.animationId} frame ${risk.frame}, ${risk.category}/${risk.regionId}: baseline ${risk.baselineSignalPixels} pixels, implementation ${risk.implementationSignalPixels}, ratio ${risk.implementationToBaselineRatio.toFixed(4)} (minimum ${risk.minimumImplementationToBaselineRatio}).`);
    }
  }
  lines.push('', '## Review artifacts', '');
  lines.push(`- Diff archive: \`${report.artifactArchive.directory}\``);
  lines.push(`- Selected review frames: ${report.artifactArchive.selectedFrameCount}`);
  lines.push(`- Contact-sheet pages: ${report.artifactArchive.contactSheets.length}`);
  for (const page of report.artifactArchive.contactSheets) {
    lines.push(`  - \`${page.path}\` (SHA-256 \`${page.sha256}\`)`);
  }
  lines.push('', '## Evidence boundary', '');
  lines.push('- The old Adobe reports remain useful hash-bound standalone visual inputs, but their schema does not bind the current requirement, trace, entry state, scenario, and execution evidence required by coverage-v2.');
  lines.push('- A frame can pass aggregate RMSE while containing a serious text, number, formula, label, or layering defect; the separate region checks prevent numeric threshold passage from silently deciding those categories.');
  lines.push('- Raster occupancy can detect large missing-content risk in configured regions; it cannot prove wording, formulas, font fidelity, depth order, interaction behavior, audio, or natural runtime execution. Named human review remains required.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export async function buildCandidateDiagnostics({
  root = PROJECT_ROOT,
  pilots = PILOTS,
  jsonFile = path.join(root, DEFAULT_JSON),
  markdownFile = path.join(root, DEFAULT_MARKDOWN),
  write = true,
} = {}) {
  root = path.resolve(root);
  jsonFile = path.resolve(jsonFile);
  markdownFile = path.resolve(markdownFile);
  projectPath(root, jsonFile);
  projectPath(root, markdownFile);
  const generatorBytes = await readFile(SCRIPT_FILE);
  const inputTimes = [];
  const animations = [];
  const decodedByKey = new Map();

  for (const [animationIndex, pilot] of pilots.entries()) {
    const baselineReportFile = resolveProjectPath(
      root,
      pilot.baselineReport ?? `migrations/${pilot.animationId}/baseline/adobe-flash-player-32-standalone-default.json`,
      'baseline report',
    );
    const implementationManifestFile = resolveProjectPath(
      root,
      pilot.implementationManifest ?? `artifacts/full-frame/pilot-implementation/${pilot.animationId}/req-root-root-standalone-en/capture-manifest.json`,
      'implementation manifest',
    );
    const baselineSource = await readJsonWithHash(baselineReportFile, `${pilot.animationId} baseline report`);
    const implementationSource = await readJsonWithHash(
      implementationManifestFile,
      `${pilot.animationId} implementation manifest`,
    );
    const baseline = baselineSource.value;
    const implementation = implementationSource.value;
    inputTimes.push(baseline.generatedAt, implementation.capturedAt);
    invariant(baseline.schemaVersion === 1, `${pilot.animationId}: expected legacy baseline schemaVersion 1`);
    invariant(baseline.animationId === pilot.animationId, `${pilot.animationId}: baseline animationId mismatch`);
    invariant(baseline.status === 'authoritative-standalone-runtime-baseline',
      `${pilot.animationId}: unexpected legacy baseline status`);
    invariant(baseline.authority?.kind === 'original-swf-adobe-flash-player-runtime',
      `${pilot.animationId}: unexpected legacy baseline authority kind`);
    invariant(implementation.schemaVersion === 3 && implementation.status === 'complete',
      `${pilot.animationId}: implementation manifest is not schemaVersion 3 complete`);
    invariant(implementation.animationId === pilot.animationId,
      `${pilot.animationId}: implementation animationId mismatch`);
    invariant(implementation.frameDomainId === 'root' && implementation.scenario === 'root-standalone'
      && implementation.language === 'en' && String(implementation.seed) === '0',
    `${pilot.animationId}: implementation capture is not the English root-standalone seed-0 requirement`);
    invariant(implementation.requirementId === 'req:root:root-standalone:en',
      `${pilot.animationId}: implementation requirementId mismatch`);
    for (const diagnostic of ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests']) {
      invariant(Array.isArray(implementation[diagnostic]) && implementation[diagnostic].length === 0,
        `${pilot.animationId}: implementation capture has ${diagnostic}`);
    }
    invariant(implementation.error === null, `${pilot.animationId}: implementation capture has an error`);
    const stage = baseline.runtime?.stage;
    invariant(stage?.width === 800 && stage?.height === 600,
      `${pilot.animationId}: legacy baseline stage is not 800x600`);
    invariant(implementation.viewport?.width === stage.width && implementation.viewport?.height === stage.height
      && implementation.viewport?.deviceScaleFactor === 1,
    `${pilot.animationId}: implementation viewport does not match native 800x600 at device scale 1`);
    invariant(baseline.runtime?.frameCount === pilot.frameCount,
      `${pilot.animationId}: baseline frame count differs from configured ${pilot.frameCount}`);
    invariant(Array.isArray(baseline.frames) && baseline.frames.length === pilot.frameCount,
      `${pilot.animationId}: baseline manifest is not exhaustive`);
    invariant(Array.isArray(implementation.captured) && implementation.captured.length === pilot.frameCount,
      `${pilot.animationId}: implementation manifest is not exhaustive`);
    const baselineByFrame = new Map(baseline.frames.map((frame) => [Number(frame.frame), frame]));
    const implementationByFrame = new Map(implementation.captured.map((frame) => [Number(frame.frame), frame]));
    invariant(baselineByFrame.size === pilot.frameCount && implementationByFrame.size === pilot.frameCount,
      `${pilot.animationId}: duplicate frame identity in a manifest`);
    const frames = [];
    const framesByNumber = new Map();
    for (let frameNumber = 1; frameNumber <= pilot.frameCount; frameNumber += 1) {
      const baselineRecord = baselineByFrame.get(frameNumber);
      const implementationRecord = implementationByFrame.get(frameNumber);
      invariant(baselineRecord && implementationRecord,
        `${pilot.animationId}: exact frame pairing is missing frame ${frameNumber}`);
      invariant(implementationRecord.reportedFrame === frameNumber
        && implementationRecord.frameDomainId === implementation.frameDomainId
        && implementationRecord.requirementId === implementation.requirementId
        && implementationRecord.traceId === implementation.traceId
        && implementationRecord.entryStateSha256 === implementation.entryStateSha256
        && implementationRecord.scenario === implementation.scenario
        && implementationRecord.language === implementation.language
        && String(implementationRecord.seed) === String(implementation.seed),
      `${pilot.animationId}: implementation frame ${frameNumber} identity does not match its manifest`);
      invariant(implementationRecord.width === stage.width && implementationRecord.height === stage.height,
        `${pilot.animationId}: implementation record ${frameNumber} dimensions are not 800x600`);
      const baselineFile = resolveProjectPath(
        root,
        path.join(baseline.capture.archiveDirectory, baselineRecord.file),
        'baseline PNG',
      );
      const implementationFile = path.resolve(path.dirname(implementationManifestFile), implementationRecord.file);
      projectPath(root, implementationFile);
      const baselinePng = await readPng(
        baselineFile,
        `${pilot.animationId} baseline frame ${frameNumber}`,
        stage,
        baselineRecord.sha256,
      );
      const implementationPng = await readPng(
        implementationFile,
        `${pilot.animationId} implementation frame ${frameNumber}`,
        stage,
        implementationRecord.sha256,
      );
      const metrics = computeNormalizedRgbMetrics(baselinePng.image, implementationPng.image);
      const kind = explicitFrameKind(baselineRecord, implementationRecord);
      const threshold = kind === 'transition' ? TRANSITION_THRESHOLD : STATIC_THRESHOLD;
      const key = `${pilot.animationId}:${frameNumber}`;
      decodedByKey.set(key, {
        baselineImage: baselinePng.image,
        implementationImage: implementationPng.image,
        animationIndex: animationIndex + 1,
      });
      framesByNumber.set(frameNumber, {
        baselineImage: baselinePng.image,
        implementationImage: implementationPng.image,
      });
      frames.push({
        frame: frameNumber,
        kind,
        assignedThreshold: threshold,
        baseline: {path: projectPath(root, baselineFile), sha256: baselinePng.sha256},
        implementation: {path: projectPath(root, implementationFile), sha256: implementationPng.sha256},
        ...metrics,
        metricResult: metrics.normalizedRmse <= threshold ? 'pass' : 'fail',
        nearThreshold: metrics.normalizedRmse > 0 && metrics.normalizedRmse >= threshold * NEAR_THRESHOLD_RATIO,
        semanticRiskFlags: [],
        reviewSelectionReasons: [],
        diff: null,
      });
    }
    const semanticRegionEvaluations = evaluateSemanticRegions({
      regions: pilot.semanticRegions,
      framesByNumber,
    }).map((evaluation) => ({animationId: pilot.animationId, ...evaluation}));
    for (const finding of semanticRegionEvaluations.filter((evaluation) => evaluation.semanticRisk)) {
      frames[finding.frame - 1].semanticRiskFlags.push({
        category: finding.category,
        regionId: finding.regionId,
        result: finding.result,
      });
    }
    const values = frames.map((frame) => frame.normalizedRmse);
    animations.push({
      animationId: pilot.animationId,
      animationIndex: animationIndex + 1,
      inputs: {
        legacyAdobeStandaloneReport: {
          path: projectPath(root, baselineReportFile),
          sha256: baselineSource.sha256,
          schemaVersion: baseline.schemaVersion,
          status: baseline.status,
          currentTraceAuthorityEligible: false,
        },
        currentJavascriptCaptureManifest: {
          path: projectPath(root, implementationManifestFile),
          sha256: implementationSource.sha256,
          schemaVersion: implementation.schemaVersion,
          status: implementation.status,
          requirementId: implementation.requirementId,
          traceId: implementation.traceId,
          entryStateSha256: implementation.entryStateSha256,
        },
      },
      pairing: {
        frameNumbering: 'one-indexed',
        stage,
        baselineScenario: baseline.runtime.scenario,
        implementationScenario: implementation.scenario,
        scenarioMapping: 'standalone-default visual root input compared to root-standalone current-JavaScript output; candidate diagnostic only',
        language: 'en',
        pairedFrameCount: frames.length,
        exactManifestAndPngRehash: true,
      },
      summary: {
        frameCount: frames.length,
        normalizedRmse: summarize(values),
        metricPassCount: frames.filter((frame) => frame.metricResult === 'pass').length,
        metricFailureCount: frames.filter((frame) => frame.metricResult === 'fail').length,
        nearThresholdCount: frames.filter((frame) => frame.nearThreshold).length,
        exactRgbFrameCount: frames.filter((frame) => frame.exactRgbMismatchedPixels === 0).length,
        semanticRiskFrameCount: frames.filter((frame) => frame.semanticRiskFlags.length > 0).length,
      },
      largestMismatchGroups: groupMetricTies(frames),
      semanticRegionEvaluations,
      frames,
    });
  }

  for (const animation of animations) {
    const positiveFrames = animation.frames.filter((frame) => frame.normalizedRmse > 0)
      .sort((left, right) => right.normalizedRmse - left.normalizedRmse || left.frame - right.frame);
    const representative = positiveFrames[0]?.frame;
    for (const frame of animation.frames) {
      if (frame.metricResult === 'fail') frame.reviewSelectionReasons.push('assigned-threshold-failure');
      if (frame.nearThreshold) frame.reviewSelectionReasons.push('near-threshold-at-least-90-percent');
      if (frame.semanticRiskFlags.length) frame.reviewSelectionReasons.push('independent-semantic-risk');
      if (frame.frame === representative) frame.reviewSelectionReasons.push('largest-nonzero-mismatch-representative');
    }
  }

  const inputBinding = animations.map((animation) => ({
    animationId: animation.animationId,
    baselineManifestSha256: animation.inputs.legacyAdobeStandaloneReport.sha256,
    implementationManifestSha256: animation.inputs.currentJavascriptCaptureManifest.sha256,
    baselinePngs: animation.frames.map((frame) => frame.baseline.sha256),
    implementationPngs: animation.frames.map((frame) => frame.implementation.sha256),
  }));
  const runDigest = sha256(JSON.stringify({
    inputBinding,
    thresholds: {static: STATIC_THRESHOLD, transition: TRANSITION_THRESHOLD, nearRatio: NEAR_THRESHOLD_RATIO},
    semanticRegions: pilots.map((pilot) => ({animationId: pilot.animationId, regions: pilot.semanticRegions ?? []})),
  }));
  const archiveDirectory = resolveProjectPath(
    root,
    `artifacts/full-frame/candidate-diagnostics/legacy-adobe-root-vs-current-js/${runDigest.slice(0, 20)}`,
    'candidate diagnostic archive',
  );
  const artifactBytes = new Map();
  const selected = [];
  for (const animation of animations) {
    for (const frame of animation.frames.filter((entry) => entry.reviewSelectionReasons.length > 0)) {
      const key = `${animation.animationId}:${frame.frame}`;
      const decoded = decodedByKey.get(key);
      const diffBytes = makeDifferenceImage(decoded.baselineImage, decoded.implementationImage);
      const diffFile = path.join(
        archiveDirectory,
        'diffs',
        animation.animationId,
        `frame-${String(frame.frame).padStart(4, '0')}.png`,
      );
      artifactBytes.set(diffFile, diffBytes);
      frame.diff = {path: projectPath(root, diffFile), sha256: sha256(diffBytes)};
      selected.push({
        animationId: animation.animationId,
        animationIndex: animation.animationIndex,
        frame: frame.frame,
        normalizedRmse: frame.normalizedRmse,
        reasons: frame.reviewSelectionReasons,
        baselineImage: decoded.baselineImage,
        implementationImage: decoded.implementationImage,
        diffImage: PNG.sync.read(diffBytes),
      });
    }
  }
  selected.sort((left, right) => left.animationIndex - right.animationIndex || left.frame - right.frame);
  const contactSheets = [];
  const stage = animations[0].pairing.stage;
  invariant(animations.every((animation) => animation.pairing.stage.width === stage.width
    && animation.pairing.stage.height === stage.height), 'Contact-sheet stages differ');
  const pageCount = Math.ceil(selected.length / FRAMES_PER_CONTACT_PAGE);
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageItems = selected.slice(
      pageIndex * FRAMES_PER_CONTACT_PAGE,
      (pageIndex + 1) * FRAMES_PER_CONTACT_PAGE,
    );
    const bytes = buildContactPage(pageItems, stage, pageIndex + 1, pageCount);
    const file = path.join(archiveDirectory, 'contact-sheets', `page-${String(pageIndex + 1).padStart(2, '0')}.png`);
    artifactBytes.set(file, bytes);
    contactSheets.push({
      page: pageIndex + 1,
      path: projectPath(root, file),
      sha256: sha256(bytes),
      width: PNG.sync.read(bytes).width,
      height: PNG.sync.read(bytes).height,
      frames: pageItems.map((item) => ({
        animationId: item.animationId,
        frame: item.frame,
        normalizedRmse: item.normalizedRmse,
        reasons: item.reasons,
      })),
    });
  }

  const allFrames = animations.flatMap((animation) => animation.frames
    .map((frame) => ({animationId: animation.animationId, ...frame})));
  const semanticChecks = semanticSummary(animations);
  const semanticRiskFrames = allFrames.filter((frame) => frame.semanticRiskFlags.length > 0);
  const report = {
    schemaVersion: 1,
    evidenceType: 'candidate-only-legacy-root-visual-diagnostics',
    status: semanticRiskFrames.length > 0
      ? 'complete-candidate-only-metric-pass-with-semantic-risk'
      : 'complete-candidate-only',
    generatedAt: latestIso(inputTimes),
    generator: {
      path: projectPath(root, SCRIPT_FILE),
      sha256: sha256(generatorBytes),
    },
    authorityBoundary: {
      candidateOnly: true,
      currentTraceBoundOriginalRuntimeAuthority: false,
      strictAcceptanceEffect: false,
      coverageModified: false,
      migrationStatusModified: false,
      humanReviewModified: false,
      ownerReviewModified: false,
      statement: 'The schema-v1 Adobe standalone root reports are legacy hash-bound visual inputs, not current coverage-v2 requirement/trace/entry-state execution evidence. Numeric and semantic diagnostics here are engineering prereview only.',
    },
    contract: {
      frameNumbering: 'one-indexed',
      stage: {width: 800, height: 600},
      deviceScaleFactor: 1,
      language: 'en',
      normalizedRmse: 'sqrt(mean((baselineRGB-implementationRGB)^2))/255',
      alphaExcludedFromRmse: true,
      staticNormalizedRmse: STATIC_THRESHOLD,
      transitionNormalizedRmse: TRANSITION_THRESHOLD,
      transitionAssignment: 'Only an explicit frame-level kind/frameType=transition in an input manifest receives 0.08; no such metadata exists in this seven-animation input set, so all 115 frames use 0.05.',
      nearThresholdNormalizedRmse: STATIC_THRESHOLD * NEAR_THRESHOLD_RATIO,
      semanticHeuristic: 'Source-annotated raster regions compare foreground-signal occupancy; a ratio below the region minimum is a review risk independent of aggregate RMSE, not an automated finding of semantic correctness.',
    },
    inputBindingSha256: sha256(JSON.stringify(inputBinding)),
    runDigest,
    summary: {
      animationCount: animations.length,
      expectedFrameCount: pilots.reduce((sum, pilot) => sum + pilot.frameCount, 0),
      pairedFrameCount: allFrames.length,
      metricPassCount: allFrames.filter((frame) => frame.metricResult === 'pass').length,
      metricFailureCount: allFrames.filter((frame) => frame.metricResult === 'fail').length,
      nearThresholdCount: allFrames.filter((frame) => frame.nearThreshold).length,
      exactRgbFrameCount: allFrames.filter((frame) => frame.exactRgbMismatchedPixels === 0).length,
      semanticRiskFrameCount: semanticRiskFrames.length,
      normalizedRmse: summarize(allFrames.map((frame) => frame.normalizedRmse)),
      numericMetricAllPass: allFrames.every((frame) => frame.metricResult === 'pass'),
      candidateVisualAcceptanceGranted: false,
    },
    largestIndividualMismatches: [...allFrames]
      .sort((left, right) => right.normalizedRmse - left.normalizedRmse
        || left.animationId.localeCompare(right.animationId) || left.frame - right.frame)
      .slice(0, 12)
      .map(({animationId, frame, normalizedRmse, assignedThreshold, metricResult, semanticRiskFlags}) => ({
        animationId,
        frame,
        normalizedRmse,
        assignedThreshold,
        metricResult,
        semanticRiskFlags,
      })),
    semanticChecks,
    animations,
    artifactArchive: {
      directory: projectPath(root, archiveDirectory),
      trackedInGit: false,
      selectedFrameCount: selected.length,
      selectionRule: 'All assigned-threshold failures, >=90%-of-threshold near outliers, independent semantic risks, and one largest positive-mismatch representative per nonzero animation; de-duplicated.',
      selectedFrames: selected.map(({animationId, frame, normalizedRmse, reasons}) => ({
        animationId,
        frame,
        normalizedRmse,
        reasons,
      })),
      diffCount: selected.length,
      contactSheets,
    },
    limitations: [
      'The old baseline report schema does not bind the current requirementId, traceId, entryStateSha256, or execution report and therefore is not adopted as current trace authority.',
      'Standalone root frames do not prove nested timelines, interaction branches, scoring, Replay, host variables, language switching, audio, or natural runtime traversal.',
      'Aggregate RMSE passing does not override independent formula, number, text, label, or layer review. Raster occupancy is only a bounded risk detector.',
      'No formula-bearing root region is declared in this seven-animation diagnostic; formula correctness is not automatable from these unannotated root raster pairs.',
      'Named human visual review and owner acceptance remain unchanged and required.',
    ],
  };
  invariant(report.summary.pairedFrameCount === report.summary.expectedFrameCount,
    'Paired frame count differs from configured total');
  const jsonBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  const markdownBytes = Buffer.from(buildMarkdown(report));
  if (write) {
    for (const [file, bytes] of artifactBytes) await writeAtomically(file, bytes);
    await writeAtomically(jsonFile, jsonBytes);
    await writeAtomically(markdownFile, markdownBytes);
  }
  return {report, jsonBytes, markdownBytes, artifactBytes, jsonFile, markdownFile};
}

export async function checkCandidateDiagnostics(options = {}) {
  const result = await buildCandidateDiagnostics({...options, write: false});
  const currentJson = await readFile(result.jsonFile);
  const currentMarkdown = await readFile(result.markdownFile);
  invariant(currentJson.equals(result.jsonBytes), `${projectPath(options.root ?? PROJECT_ROOT, result.jsonFile)} is stale`);
  invariant(currentMarkdown.equals(result.markdownBytes), `${projectPath(options.root ?? PROJECT_ROOT, result.markdownFile)} is stale`);
  for (const [file, expectedBytes] of result.artifactBytes) {
    const current = await readFile(file);
    invariant(current.equals(expectedBytes), `${projectPath(options.root ?? PROJECT_ROOT, file)} is stale`);
  }
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = options.check
    ? await checkCandidateDiagnostics()
    : await buildCandidateDiagnostics();
  process.stdout.write(`${options.check ? 'Verified' : 'Wrote'} ${result.report.summary.pairedFrameCount} candidate-only paired-frame diagnostics; ${result.report.summary.metricFailureCount} numeric failures, ${result.report.summary.semanticRiskFrameCount} semantic-risk frames.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
