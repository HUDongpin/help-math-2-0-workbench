#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const FREEZE_PATH =
  'catalog/product-bridge-calibrations/g678-current-js-319-page-product-calibrated-registration-v1.json';

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
    bytes: bytes.length, sha256: sha256(bytes),
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
      'usage: check-g678-production-bundle-isolation.mjs [--next-root <path>] [--output <path>]');
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
  invariant(freeze.registrationCandidatePlacementCount === 319 &&
    ids.length === 319 && new Set(ids).size === 319,
  'G678 freeze must contain exactly 319 registration candidates');
  const nextRoot = projectPath(options.nextRoot, 'Next build root');
  const buildIdFile = await stableFile(path.join(nextRoot, 'BUILD_ID'),
    'Next BUILD_ID');
  const buildId = buildIdFile.bytes.toString('utf8').trim();
  invariant(buildId.length > 0, 'Next production BUILD_ID is missing');
  const roots = ['server', 'static'].map((name) => path.join(nextRoot, name));
  const files = (await Promise.all(roots.map((root) => walk(root)))).flat();
  const patterns = [
    ...ids,
    'registry.local-only.generated',
    'registry.local-only.metadata.generated',
    'private-current-js-registry.json',
    'g678-16-page-product-calibration-v1.fragment.json',
    'g678-16-page-product-calibration-v1.advanced-manual-3.fragment.json',
    'g678-16-page-product-calibration-v1.registered.fragment.json',
    'g678-16-page-product-calibration-v1.registered.json',
    'g678-current-js-172-page-registration-v1.fragment.json',
    'g678-current-js-172-page-registration-v1.json',
    'g678-current-js-216-page-registration-v1.fragment.json',
    'g678-current-js-216-page-registration-v1.json',
    'g678-current-js-231-page-registration-v1.fragment.json',
    'g678-current-js-231-page-registration-v1.json',
    'g678-current-js-246-page-registration-v1.fragment.json',
    'g678-current-js-246-page-registration-v1.json',
    'g678-current-js-261-page-registration-v1.fragment.json',
    'g678-current-js-261-page-registration-v1.json',
    'g678-current-js-261-page-product-calibrated-registration-v1.fragment.json',
    'g678-current-js-261-page-product-calibrated-registration-v1.json',
    'g678-current-js-276-page-registration-v1.fragment.json',
    'g678-current-js-276-page-registration-v1.json',
    'g678-current-js-276-page-product-calibrated-registration-v1.fragment.json',
    'g678-current-js-276-page-product-calibrated-registration-v1.json',
    'g678-current-js-277-page-registration-v1.fragment.json',
    'g678-current-js-277-page-registration-v1.json',
    'g678-current-js-277-page-product-calibrated-registration-v1.fragment.json',
    'g678-current-js-277-page-product-calibrated-registration-v1.json',
    'g678-current-js-290-page-registration-v1.fragment.json',
    'g678-current-js-290-page-registration-v1.json',
    'g678-current-js-290-page-product-calibrated-registration-v1.fragment.json',
    'g678-current-js-290-page-product-calibrated-registration-v1.json',
    'g678-current-js-301-page-registration-v1.fragment.json',
    'g678-current-js-301-page-registration-v1.json',
    'g678-current-js-301-page-product-calibrated-registration-v1.fragment.json',
    'g678-current-js-301-page-product-calibrated-registration-v1.json',
    'g678-current-js-310-page-registration-v1.fragment.json',
    'g678-current-js-310-page-registration-v1.json',
    'g678-current-js-310-page-product-calibrated-registration-v1.fragment.json',
    'g678-current-js-310-page-product-calibrated-registration-v1.json',
    'g678-current-js-319-page-registration-v1.fragment.json',
    'g678-current-js-319-page-registration-v1.json',
    'g678-current-js-319-page-product-calibrated-registration-v1.fragment.json',
    'g678-current-js-319-page-product-calibrated-registration-v1.json',
    'g678-in02-l1-family-audit-v1.json',
    'g678-in02-l1-current-js-13-v1.fragment.json',
    'g678-in02-l1-family-calibration-v1.json',
    'g678-vb02-l1-family-audit-v1.json',
    'g678-vb02-l1-current-js-11-v1.fragment.json',
    'g678-vb02-l1-family-calibration-v1.json',
    'g678-vb03-l1-family-audit-v1.json',
    'g678-vb03-l1-current-js-9-v1.fragment.json',
    'g678-vb03-l1-family-calibration-v1.json',
    'private-source-static-repeated-vocabulary-glossary-candidate',
    'g678-alg-l09-simple-glossary-family-audit-v1.json',
    'g678-alg-l09-simple-glossary-current-js-9-v1.fragment.json',
    'g678-alg-l09-simple-glossary-family-calibration-v1.json',
    'private-source-static-alg-l09-simple-glossary-candidate',
    'g678-ts03-family-audit-v1.json',
    'g678-ts03-l1-keyterm-recovery-v1.json',
    'g678-ts03-l1-current-js-15-v1.fragment.json',
    'g678-ts03-l1-family-calibration-v1.json',
    'g678-ts02-family-audit-v1.json',
    'g678-ts02-l1-keyterm-recovery-v1.json',
    'g678-ts02-l1-current-js-15-v1.fragment.json',
    'g678-ts02-l1-family-calibration-v1.json',
    'g678-ts04-family-audit-v1.json',
    'g678-ts04-l1-keyterm-recovery-v1.json',
    'g678-ts04-l1-current-js-15-v1.fragment.json',
    'g678-ts04-l1-family-calibration-v1.json',
    'g678-ts05-family-audit-v1.json',
    'g678-ts05-l1-keyterm-recovery-v1.json',
    'g678-ts05-l1-current-js-15-v1.fragment.json',
    'g678-ts05-l1-family-calibration-v1.json',
    'g678-ts07-family-audit-v1.json',
    'g678-ts07-l1-keyterm-recovery-v1.json',
    'g678-ts07-assessment-lane-routing-v1.json',
    'g678-ts07-nms-l1-current-js-1-v1.fragment.json',
    'g678-ts07-nms-l1-family-calibration-v1.json',
    'g678-fq01-current-js-calibration-1-v1.fragment.json',
    'g678-fq01-family-calibration-v1.json',
    'g678-fq01-current-js-scaleout-43-v1.fragment.json',
    'g678-shared-current-js-calibration-13-v1/members/',
    'g678-advanced-manual-current-js-3-v1/members/',
    'g678-pure-linear-current-js-scaleout-v1/members/',
    'g678-fq01-current-js-calibration-1-v1/members/',
    'g678-fq01-current-js-scaleout-43-v1/members/',
    'g678-ts03-l1-current-js-15-v1/members/',
    'g678-ts02-l1-current-js-15-v1/members/',
    'g678-ts04-l1-current-js-15-v1/members/',
    'g678-ts05-l1-current-js-15-v1/members/',
    'g678-ts07-nms-l1-current-js-1-v1/members/',
    'g678-in02-l1-current-js-13-v1/members/',
    'g678-vb02-l1-current-js-11-v1/members/',
    'g678-vb03-l1-current-js-9-v1/members/',
    'g678-alg-l09-simple-glossary-current-js-9-v1/members/',
  ];
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
      if (bytes.includes(Buffer.from(pattern))) matches.push({file: relative,
        pattern});
    }
  }
  invariant(matches.length === 0,
    `production bundle contains G678 local-only material: ${JSON.stringify(matches)}`);
  const scanner = await stableFile(SCRIPT_PATH, 'production scanner');
  const patternProjection = Buffer.from(patterns.map((pattern) =>
    `${pattern}\n`).join(''));
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
    forbiddenPatternCount: patterns.length,
    forbiddenPatternSetSha256: sha256(patternProjection),
    matchCount: 0,
    localOnlyG678MaterialAbsent: true,
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
