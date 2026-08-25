#!/usr/bin/env node

import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  K1_PARITY_REPORT_ARTIFACT_TYPE,
  assertSameCaptureIdentity,
  authorityEffects,
  loadCaptureManifest,
  makeHashBoundDocument,
  projectRelative,
  writeOrCheckHashBoundReport,
} from './canvas-backing-image.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), '..');

export function usage() {
  return `Usage:
  node scripts/verify-canvas-k1-parity.mjs \\
    --baseline-manifest <baseline-k1/capture-manifest.json> \\
    --candidate-manifest <candidate-k1/capture-manifest.json> \\
    --output <k1-parity.json> [--check]

Both manifests must bind the exact same identity, k=1 scale, and dimensions.
The gate passes only when both raw RGBA bytes and encoded PNG bytes are exactly
identical. A mismatch still produces a hash-bound report and exits nonzero.
--check performs a byte-for-byte freshness check without writing.`;
}

export function parseArguments(argv, {projectRoot = defaultProjectRoot} = {}) {
  const valueOptions = new Set([
    '--baseline-manifest',
    '--candidate-manifest',
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
  return {
    projectRoot: path.resolve(projectRoot),
    baselineManifestPath: values.get('--baseline-manifest'),
    candidateManifestPath: values.get('--candidate-manifest'),
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

function firstMismatchedByte(left, right) {
  const commonLength = Math.min(left.length, right.length);
  for (let index = 0; index < commonLength; index += 1) {
    if (left[index] !== right[index]) return index;
  }
  return left.length === right.length ? null : commonLength;
}

function byteParity(left, right) {
  const byteIdentical = left.bytes.equals(right.bytes);
  return {
    byteIdentical,
    baselineBytes: left.bytes.length,
    candidateBytes: right.bytes.length,
    baselineSha256: left.sha256,
    candidateSha256: right.sha256,
    sha256Identical: left.sha256 === right.sha256,
    firstMismatchedByte: firstMismatchedByte(left.bytes, right.bytes),
  };
}

export async function verifyCanvasK1Parity(options) {
  const projectRoot = path.resolve(options.projectRoot);
  const baseline = await loadCaptureManifest({
    projectRoot,
    manifestPath: options.baselineManifestPath,
  });
  const candidate = await loadCaptureManifest({
    projectRoot,
    manifestPath: options.candidateManifestPath,
  });
  if (baseline.path === candidate.path) {
    throw new Error('baseline and candidate manifests must be different files');
  }
  assertSameCaptureIdentity(
    baseline.payload.identity,
    candidate.payload.identity,
  );
  if (baseline.payload.capture.scale !== 1 ||
    candidate.payload.capture.scale !== 1) {
    throw new Error('baseline and candidate capture scales must both be 1');
  }
  if (baseline.payload.capture.stage.width !==
      candidate.payload.capture.stage.width ||
    baseline.payload.capture.stage.height !==
      candidate.payload.capture.stage.height ||
    baseline.payload.capture.backing.width !==
      candidate.payload.capture.backing.width ||
    baseline.payload.capture.backing.height !==
      candidate.payload.capture.backing.height) {
    throw new Error('baseline and candidate dimensions differ');
  }
  const rgba = byteParity(baseline.rgba, candidate.rgba);
  const png = byteParity(baseline.png, candidate.png);
  const status = rgba.byteIdentical && rgba.sha256Identical &&
    png.byteIdentical && png.sha256Identical ? 'pass' : 'fail';
  const payload = {
    evidenceClass: 'current-javascript-k1-byte-parity-check',
    identity: baseline.payload.identity,
    stage: baseline.payload.capture.stage,
    scale: 1,
    inputs: {
      baseline: manifestBinding(projectRoot, baseline),
      candidate: manifestBinding(projectRoot, candidate),
    },
    parity: {
      requiredArtifacts: ['rgba', 'png'],
      comparison: 'byte-for-byte-and-sha256',
      rgba,
      png,
    },
    status,
    authorityEffects: authorityEffects(),
  };
  const document = makeHashBoundDocument(
    K1_PARITY_REPORT_ARTIFACT_TYPE,
    payload,
  );
  const outputPath = path.resolve(projectRoot, options.outputPath);
  if (outputPath === baseline.path || outputPath === candidate.path) {
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
    status,
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
    const result = await verifyCanvasK1Parity(options);
    console.log(JSON.stringify({
      status: result.status,
      mode: options.check ? 'check' : 'write',
      output: path.relative(options.projectRoot, result.outputPath),
      contentSha256: result.document.contentSha256,
      rgbaSha256Identical:
        result.document.payload.parity.rgba.sha256Identical,
      pngSha256Identical:
        result.document.payload.parity.png.sha256Identical,
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
