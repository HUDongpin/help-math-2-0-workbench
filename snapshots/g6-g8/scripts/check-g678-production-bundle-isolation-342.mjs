#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json';
const FIXED_PATTERNS = Object.freeze([
  'registry.local-only.generated',
  'registry.local-only.metadata.generated',
  'private-current-js-registry.json',
  'g678-16-page-product-calibration-v1.fragment.json',
  'g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json',
  'g678-current-js-342-page-registration-v1.fragment.json',
  'g678-current-js-342-page-registration-v1.json',
  'g678-current-js-342-page-product-calibrated-registration-v1.fragment.json',
  'g678-current-js-342-page-product-calibrated-registration-v1.json',
  'g678-alg-l09-game-assessment-family-audit-v1.json',
  'g678-alg-l09-game-assessment-current-js-3-v1.fragment.json',
  'g678-alg-l09-game-assessment-family-calibration-v1.json',
  'g678-alg-l09-game-assessment-current-js-3-v1/members/',
  'private-source-static-glossary-candidate',
  'private-source-static-instruction-glossary-candidate',
  'private-source-static-repeated-vocabulary-glossary-candidate',
  'private-source-static-vocabulary-glossary-candidate',
  'private-source-static-alg-l09-simple-glossary-candidate',
  'private-source-static-alg-l09-terminal-stop-candidate',
  'private-source-static-alg-l09-vb06-drag-candidate',
  'private-source-static-alg-l09-vb02-glossary-candidate',
  'private-source-static-alg-l09-in04-numeric-candidate',
  'private-source-static-alg-l09-in06-choice-candidate',
  'private-source-static-alg-l09-in08-choice-candidate',
  'private-source-static-alg-l09-in10-choice-candidate',
  'private-source-static-alg-l09-ti-choice-candidate',
  'private-source-static-alg-l09-guided-tutorial-candidate',
  'private-source-static-alg-l09-game-assessment-candidate',
  'g678-alg-l09-game-assessment',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function projectPath(relativePath, label) {
  invariant(typeof relativePath === 'string' && relativePath.length > 0 &&
    !path.isAbsolute(relativePath), `${label} must be project-relative`);
  const absolute = path.resolve(PROJECT_ROOT, relativePath);
  invariant(absolute.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `${label} escapes the project root`);
  return absolute;
}

async function stableFile(absolute, label) {
  const [canonical, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${label} must be one canonical ordinary file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${label} changed during read`);
  return Object.freeze({bytes, binding: Object.freeze({
    path: portable(path.relative(PROJECT_ROOT, absolute)),
    bytes: bytes.length,
    sha256: sha256(bytes),
  })});
}

async function walk(root, current = root, files = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const metadata = await lstat(absolute);
    invariant(!metadata.isSymbolicLink(),
      `production bundle contains a symlink: ${absolute}`);
    if (metadata.isDirectory()) await walk(root, absolute, files);
    else if (metadata.isFile()) files.push(absolute);
  }
  return files;
}

function allFalse(value) {
  const entries = Object.entries(value ?? {});
  return entries.length > 0 && entries.every(([, item]) => item === false);
}

function addPattern(patterns, value) {
  if (typeof value === 'string' && value.length > 0) patterns.add(value);
}

function forbiddenPatterns(freeze) {
  const patterns = new Set(FIXED_PATTERNS);
  for (const page of freeze.selectedPages ?? []) {
    addPattern(patterns, page.animationId);
    addPattern(patterns, page.assetId);
    addPattern(patterns, page.runtime?.canvasRenderer?.path);
    addPattern(patterns, page.runtime?.canvasRenderer?.url);
    const rendererPath = page.runtime?.canvasRenderer?.path;
    if (typeof rendererPath === 'string') {
      const membersAt = rendererPath.indexOf('/members/');
      if (membersAt >= 0) addPattern(patterns,
        rendererPath.slice(0, membersAt + '/members/'.length));
    }
  }
  return [...patterns].sort();
}

export function parseArguments(argv) {
  const options = {nextRoot: 'apps/web/.next', output: null, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--check') {
      invariant(!options.check, '--check may appear only once');
      options.check = true;
      continue;
    }
    const key = {'--next-root': 'nextRoot', '--output': 'output'}[flag];
    invariant(key && index + 1 < argv.length,
      'usage: check-g678-production-bundle-isolation-342.mjs [--next-root <path>] [--output <path>] [--check]');
    options[key] = argv[++index];
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  invariant(!options.check || options.output,
    '--check requires an existing --output receipt');
  const freezeFile = await stableFile(projectPath(FREEZE_PATH, 'freeze'),
    'freeze');
  const freeze = JSON.parse(freezeFile.bytes.toString('utf8'));
  const ids = (freeze.selectedPages ?? []).map((page) => page.animationId);
  invariant(freeze.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    freeze.deploymentScope === 'local-only' &&
    freeze.registrationCandidatePlacementCount === 342 &&
    ids.length === 342 && new Set(ids).size === 342 &&
    freeze.productHostCalibration?.familyCalibratedPlacementCount === 126 &&
    freeze.productHostCalibration?.familyCalibrationCount === 21 &&
    freeze.productHostCalibration?.browserSampleCount === 92 &&
    freeze.productHostCalibration?.screenshotCount === 96 &&
    freeze.productHostCalibration?.wholeLessonEngineeringPreviewCount === 1 &&
    freeze.productHostCalibration?.overallG678ProductCalibrationPassed === false &&
    allFalse(freeze.acceptanceEffects),
  'G678 freeze must be the exact fail-closed final342 engineering calibration');
  const nextRoot = projectPath(options.nextRoot, 'Next build root');
  const buildIdFile = await stableFile(path.join(nextRoot, 'BUILD_ID'),
    'Next BUILD_ID');
  const buildId = buildIdFile.bytes.toString('utf8').trim();
  invariant(buildId.length > 0, 'Next production BUILD_ID is missing');
  const roots = ['server', 'static'].map((name) => path.join(nextRoot, name));
  const files = (await Promise.all(roots.map((root) => walk(root)))).flat();
  const patterns = forbiddenPatterns(freeze);
  const matches = [];
  let totalBytes = 0;
  const checksumRows = [];
  for (const file of files) {
    const current = await stableFile(file, `Next production file ${file}`);
    const bytes = current.bytes;
    totalBytes += bytes.length;
    const relative = portable(path.relative(nextRoot, file));
    const digest = sha256(bytes);
    checksumRows.push(`${digest}  ${relative}\n`);
    for (const pattern of patterns) {
      if (bytes.includes(Buffer.from(pattern))) {
        matches.push({file: relative, pattern});
      }
    }
  }
  invariant(matches.length === 0,
    `production bundle contains G678 local-only material: ${JSON.stringify(matches)}`);
  const scanner = await stableFile(SCRIPT_PATH, 'production scanner');
  const patternProjection = Buffer.from(patterns.map((pattern) =>
    `${pattern}\n`).join(''));
  const acceptanceEffects = Object.freeze({
    authoritativeOriginalRuntime: false,
    behaviorAccepted: false,
    visualFidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    releaseEligible: false,
    released: false,
    published: false,
  });
  const receipt = {
    schemaVersion: 1,
    artifactType: 'g678-production-bundle-isolation-receipt-v1',
    generatedAt: new Date().toISOString(),
    scanner: scanner.binding,
    freeze: freezeFile.binding,
    buildIdFile: buildIdFile.binding,
    buildId,
    nextRoot: portable(path.relative(PROJECT_ROOT, nextRoot)),
    scannedRoots: ['server', 'static'],
    fileCount: files.length,
    totalBytes,
    checksumSetSha256: sha256(Buffer.from(checksumRows.join(''))),
    frozenCandidateCount: ids.length,
    wholeLessonEngineeringPreviewCount: 1,
    forbiddenPatternCount: patterns.length,
    forbiddenPatternSetSha256: sha256(patternProjection),
    matchCount: 0,
    localOnlyG678MaterialAbsent: true,
    acceptanceEffects,
  };
  let resultReceipt = receipt;
  const outputBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  if (options.output) {
    const outputPath = projectPath(options.output, 'receipt output');
    if (options.check) {
      const current = await stableFile(outputPath, 'production receipt');
      const parsed = JSON.parse(current.bytes.toString('utf8'));
      const expected = {...receipt, generatedAt: parsed.generatedAt};
      invariant(JSON.stringify(parsed) === JSON.stringify(expected),
        'production isolation receipt drifted');
      resultReceipt = expected;
    } else {
      await mkdir(path.dirname(outputPath), {recursive: true});
      await writeFile(outputPath, outputBytes, {flag: 'wx'});
    }
  }
  process.stdout.write(Buffer.from(`${JSON.stringify({...resultReceipt,
    mode: options.check ? 'check' : 'build'}, null, 2)}\n`));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
