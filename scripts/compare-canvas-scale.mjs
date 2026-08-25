#!/usr/bin/env node

import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  COMPARISON_REPORT_ARTIFACT_TYPE,
  DOWNSAMPLE_ALGORITHM_ID,
  NORMALIZED_RGB_RMSE_ALGORITHM_ID,
  assertSameCaptureIdentity,
  authorityEffects,
  classifyNormalizedRgbRmse,
  downsampleRgba2xBoxPremultipliedSrgb,
  loadCaptureManifest,
  makeHashBoundDocument,
  normalizedRgbRmse,
  projectRelative,
  sha256,
  writeOrCheckHashBoundReport,
} from './canvas-backing-image.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), '..');

export function usage() {
  return `Usage:
  node scripts/compare-canvas-scale.mjs \\
    --baseline-manifest <k1/capture-manifest.json> \\
    --scaled-manifest <k2/capture-manifest.json> \\
    --threshold-class <static|transition> \\
    --output <comparison.json> [--check]

The two captures must bind the exact same animation/frame/trace identity and
stage dimensions. The scaled capture must be k=2 and the baseline k=1. k=2 is
reduced with the fixed 2x2 sRGB premultiplied-alpha box algorithm before the
normalized RGB RMSE is classified. --check performs no writes.`;
}

export function parseArguments(argv, {projectRoot = defaultProjectRoot} = {}) {
  const valueOptions = new Set([
    '--baseline-manifest',
    '--scaled-manifest',
    '--threshold-class',
    '--output',
  ]);
  const values = new Map();
  let check = false;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === '--help' || option === '-h') {
      if (help) throw new Error(`${option} may be supplied only once`);
      help = true;
      continue;
    }
    if (option === '--check') {
      if (check) throw new Error('--check may be supplied only once');
      check = true;
      continue;
    }
    if (!valueOptions.has(option)) throw new Error(`Unknown option: ${option}`);
    if (values.has(option)) throw new Error(`${option} may be supplied only once`);
    const value = argv[index + 1];
    if (value === undefined || value === '' || value.startsWith('--')) {
      throw new Error(`${option} requires a value`);
    }
    values.set(option, value);
    index += 1;
  }
  if (help) return {help: true, projectRoot: path.resolve(projectRoot)};
  for (const option of valueOptions) {
    if (!values.has(option)) throw new Error(`${option} is required`);
  }
  const thresholdClass = values.get('--threshold-class');
  if (thresholdClass !== 'static' && thresholdClass !== 'transition') {
    throw new Error('--threshold-class must be static or transition');
  }
  return {
    projectRoot: path.resolve(projectRoot),
    baselineManifestPath: values.get('--baseline-manifest'),
    scaledManifestPath: values.get('--scaled-manifest'),
    thresholdClass,
    outputPath: values.get('--output'),
    check,
  };
}

function manifestBinding(projectRoot, capture) {
  return {
    path: projectRelative(projectRoot, capture.path),
    bytes: capture.bytes.length,
    sha256: capture.sha256,
    contentSha256: capture.document.contentSha256,
    rgbaSha256: capture.rgba.sha256,
    pngSha256: capture.png.sha256,
  };
}

export async function compareCanvasScale(options) {
  const projectRoot = path.resolve(options.projectRoot);
  const baseline = await loadCaptureManifest({
    projectRoot,
    manifestPath: options.baselineManifestPath,
  });
  const scaled = await loadCaptureManifest({
    projectRoot,
    manifestPath: options.scaledManifestPath,
  });
  if (baseline.path === scaled.path) {
    throw new Error('baseline and scaled manifests must be different files');
  }
  assertSameCaptureIdentity(
    baseline.payload.identity,
    scaled.payload.identity,
  );
  if (baseline.payload.capture.scale !== 1) {
    throw new Error('baseline capture scale must be 1');
  }
  if (scaled.payload.capture.scale !== 2) {
    throw new Error('scaled capture scale must be 2');
  }
  const baselineStage = baseline.payload.capture.stage;
  const scaledStage = scaled.payload.capture.stage;
  if (baselineStage.width !== scaledStage.width ||
    baselineStage.height !== scaledStage.height) {
    throw new Error('baseline and scaled stage dimensions differ');
  }
  const downsampled = downsampleRgba2xBoxPremultipliedSrgb(scaled.image);
  if (downsampled.width !== baseline.image.width ||
    downsampled.height !== baseline.image.height) {
    throw new Error('downsampled k=2 dimensions do not match k=1 dimensions');
  }
  const metric = normalizedRgbRmse(baseline.image, downsampled);
  const classification = classifyNormalizedRgbRmse(
    metric.normalizedRmse,
    options.thresholdClass,
  );
  const payload = {
    evidenceClass: 'current-javascript-scale-equivalence-check',
    identity: baseline.payload.identity,
    stage: baselineStage,
    inputs: {
      baselineK1: manifestBinding(projectRoot, baseline),
      scaledK2: manifestBinding(projectRoot, scaled),
    },
    downsample: {
      algorithmId: DOWNSAMPLE_ALGORITHM_ID,
      inputScale: 2,
      outputScale: 1,
      kernel: '2x2-area-box',
      colorSpace: '8-bit-srgb-no-linearization',
      alphaMethod: 'premultiply-average-unpremultiply',
      integerRounding: 'round-half-up',
      transparentPixelRgb: [0, 0, 0],
      width: downsampled.width,
      height: downsampled.height,
      rgbaBytes: downsampled.data.length,
      rgbaSha256: sha256(downsampled.data),
    },
    metric: {
      algorithmId: NORMALIZED_RGB_RMSE_ALGORITHM_ID,
      channels: ['red', 'green', 'blue'],
      alphaExcluded: true,
      squaredError: metric.squaredError,
      channelCount: metric.channelCount,
      normalizedRmse: metric.normalizedRmse,
    },
    classification,
    status: classification.status,
    authorityEffects: authorityEffects(),
  };
  const document = makeHashBoundDocument(
    COMPARISON_REPORT_ARTIFACT_TYPE,
    payload,
  );
  const outputPath = path.resolve(projectRoot, options.outputPath);
  if (outputPath === baseline.path || outputPath === scaled.path) {
    throw new Error('output must not overwrite an input capture manifest');
  }
  const resolvedOutput = await writeOrCheckHashBoundReport({
    projectRoot,
    outputPath,
    document,
    check: options.check,
  });
  return {
    document,
    outputPath: resolvedOutput,
    status: classification.status,
    checked: Boolean(options.check),
  };
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const result = await compareCanvasScale(options);
    console.log(JSON.stringify({
      status: result.status,
      mode: options.check ? 'check' : 'write',
      output: path.relative(options.projectRoot, result.outputPath),
      contentSha256: result.document.contentSha256,
      normalizedRmse: result.document.payload.metric.normalizedRmse,
      threshold: result.document.payload.classification.threshold,
      thresholdClass: result.document.payload.classification.thresholdClass,
    }, null, 2));
    if (result.status !== 'pass') process.exitCode = 2;
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
