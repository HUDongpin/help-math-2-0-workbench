#!/usr/bin/env node

import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CURRENT_FILE = fileURLToPath(import.meta.url);
export const PACKAGE_ROOT = path.resolve(path.dirname(CURRENT_FILE), '..');
export const CONTRACT_PATH = path.join(PACKAGE_ROOT, 'hosted-tests.v1.json');

const EXPECTED_RELEASE_ID = 'HELP_MATH_2_PUBLIC_LAUNCH_V1';
const EXPECTED_FULL_LOCAL_COMMAND =
  'npm run check:registry && tsx --test test/*.test.mjs tests/**/*.test.ts';
const EXPECTED_HOSTED_NODE_ARGUMENTS = Object.freeze([
  '--import',
  'tsx',
  '--test',
  '--test-concurrency=4',
  '--test-reporter=tap',
]);
const EXPECTED_TEST_SHAPED_FILE_COUNT = 172;
const EXPECTED_FULL_LOCAL_FILE_COUNT = 114;
const EXPECTED_HOSTED_FILE_COUNT = 66;
const EXPECTED_LOCAL_ONLY_FILE_COUNT = 48;
const EXPECTED_NOT_EXECUTED_FILE_COUNT = 58;
const EXPECTED_HOSTED_TEST_COUNT = 426;
const EXPECTED_TEST_SHAPED_PATH_SET_SHA256 =
  'd725ce66097c3badbfe0c58b1061401bab52d4181d7e560b5c0a42adca0f6dde';
const EXPECTED_FULL_LOCAL_PATH_SET_SHA256 =
  'bfac96f46c4419a9a7f8b6d7cb99e8b3757de92041762772a21e419dbb0cc76c';
const EXPECTED_HOSTED_PATH_SET_SHA256 =
  '9ea5f125946afd1857f6ca0398751248d5fa60294da1d237644cc0b25d7714bf';
const EXPECTED_LOCAL_ONLY_PATH_SET_SHA256 =
  '038edaa36c3fc13832b2f51643bcb0874db852a2333590c96e9785261b2b9c87';
const EXPECTED_NOT_EXECUTED_PATH_SET_SHA256 =
  'd0c1099a1ffa352c8863204c7587ae7bb0708fa8a460f460094d3bca3c38bec2';
const ALLOWED_LOCAL_REASON_CODES = new Set([
  'REQUIRES_PRIVATE_ADOBE_BASELINE',
  'REQUIRES_REPO_EXCLUDED_CANONICAL_SOURCE',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, keys, label) {
  invariant(isPlainObject(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(expected), `${label} keys drifted`);
}

function sortedUnique(values, label) {
  invariant(Array.isArray(values), `${label} must be an array`);
  invariant(values.every((value) => typeof value === 'string'), `${label} must contain strings`);
  invariant(new Set(values).size === values.length, `${label} must not contain duplicates`);
  const sorted = [...values].sort();
  invariant(
    values.every((value, index) => value === sorted[index]),
    `${label} must use deterministic sorted order`,
  );
  return sorted;
}

function safeRelativeTestPath(value, label) {
  invariant(typeof value === 'string' && value.length > 0, `${label} must be a path`);
  invariant(!value.includes('\0') && !value.includes('\\'), `${label} must be portable`);
  invariant(!path.posix.isAbsolute(value), `${label} must be relative`);
  invariant(!value.split('/').includes('..'), `${label} must not escape the package`);
  invariant(
    /^(?:src|test|tests)\/.+\.test\.(?:mjs|ts|tsx)$/.test(value),
    `${label} must identify a demo test file`,
  );
}

export function hashPathSet(paths) {
  return createHash('sha256').update(Buffer.from(`${paths.join('\0')}\0`)).digest('hex');
}

export function pathSetEncodedByteLength(paths) {
  return Buffer.byteLength(`${paths.join('\0')}\0`);
}

function discoverRecursively(root, relativeRoot, output) {
  for (const entry of readdirSync(root, {withFileTypes: true})) {
    const relativePath = path.posix.join(relativeRoot, entry.name);
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      discoverRecursively(absolutePath, relativePath, output);
    } else if (entry.isFile() && /\.test\.(?:mjs|ts|tsx)$/.test(entry.name)) {
      output.push(relativePath);
    }
  }
}

export function discoverTestShapedFiles(packageRoot = PACKAGE_ROOT) {
  const tests = [];
  for (const directory of ['src', 'test', 'tests']) {
    discoverRecursively(path.join(packageRoot, directory), directory, tests);
  }
  return tests.sort();
}

export function discoverFullLocalTests(packageRoot = PACKAGE_ROOT) {
  return discoverTestShapedFiles(packageRoot).filter((file) =>
    /^test\/[^/]+\.test\.mjs$/.test(file) ||
    /^tests\/.+\.test\.ts$/.test(file)
  );
}

export const discoverDemoTests = discoverFullLocalTests;

function validateMeasurement(label, paths, measurement) {
  invariant(measurement.fileCount === paths.length, `${label}.fileCount drifted`);
  invariant(
    measurement.encodedByteLength === pathSetEncodedByteLength(paths),
    `${label}.encodedByteLength drifted`,
  );
  invariant(
    measurement.sortedPathSetSha256 === hashPathSet(paths),
    `${label}.sortedPathSetSha256 drifted`,
  );
}

export function validateHostedDemoContract({
  contract,
  packageRoot = PACKAGE_ROOT,
  packageJson = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')),
  discoveredTestShapedFiles = discoverTestShapedFiles(packageRoot),
  discoveredFullLocalTests = discoverFullLocalTests(packageRoot),
} = {}) {
  exactKeys(
    contract,
    [
      'schemaVersion',
      'contractId',
      'releaseId',
      'pathSetEncoding',
      'fullLocalCommand',
      'trackedTestShapedUniverse',
      'fullLocalDiscovery',
      'hostedProfile',
      'localOnlyProfile',
      'notExecutedByFullLocalCommand',
      'boundary',
    ],
    'hosted demo contract',
  );
  invariant(contract.schemaVersion === 1, 'hosted demo schemaVersion must equal 1');
  invariant(
    contract.contractId === 'HELP_MATH_DEMOS_HOSTED_TESTS_V1',
    'hosted demo contractId mismatch',
  );
  invariant(contract.releaseId === EXPECTED_RELEASE_ID, 'hosted demo releaseId mismatch');
  invariant(
    contract.pathSetEncoding === 'sorted-utf8-nul-terminated',
    'hosted demo path-set encoding must remain unambiguous',
  );
  invariant(
    contract.fullLocalCommand === EXPECTED_FULL_LOCAL_COMMAND,
    'hosted demo contract must preserve the full-local command',
  );
  const repositoryPackageJson = JSON.parse(
    readFileSync(path.resolve(packageRoot, '../..', 'package.json'), 'utf8'),
  );
  invariant(
    packageJson?.scripts?.test === EXPECTED_FULL_LOCAL_COMMAND,
    'the demos npm test command must remain the full local evidence suite',
  );
  invariant(
    packageJson?.scripts?.['test:hosted'] === 'node scripts/run-hosted-tests.mjs',
    'the demos Hosted command drifted',
  );
  invariant(
    repositoryPackageJson?.scripts?.['test:demos'] ===
      'npm run test --workspace @helpmath/demos',
    'the root test:demos command must preserve the full local demos suite',
  );

  exactKeys(
    contract.trackedTestShapedUniverse,
    ['fileCount', 'encodedByteLength', 'sortedPathSetSha256'],
    'trackedTestShapedUniverse',
  );
  exactKeys(
    contract.fullLocalDiscovery,
    ['fileCount', 'encodedByteLength', 'sortedPathSetSha256'],
    'fullLocalDiscovery',
  );
  exactKeys(
    contract.hostedProfile,
    [
      'testFiles',
      'fileCount',
      'encodedByteLength',
      'sortedPathSetSha256',
      'expectedTestCount',
      'expectedPassCount',
      'expectedSkipCount',
      'nodeArguments',
    ],
    'hostedProfile',
  );
  exactKeys(
    contract.localOnlyProfile,
    [
      'entries',
      'fileCount',
      'encodedByteLength',
      'sortedPathSetSha256',
      'executionContract',
    ],
    'localOnlyProfile',
  );
  exactKeys(
    contract.notExecutedByFullLocalCommand,
    [
      'testFiles',
      'fileCount',
      'encodedByteLength',
      'sortedPathSetSha256',
      'executionContract',
    ],
    'notExecutedByFullLocalCommand',
  );

  const testShaped = sortedUnique(
    discoveredTestShapedFiles,
    'discovered test-shaped demo files',
  );
  const fullLocal = sortedUnique(
    discoveredFullLocalTests,
    'discovered full-local demo tests',
  );
  const hosted = sortedUnique(contract.hostedProfile.testFiles, 'hostedProfile.testFiles');
  const notExecuted = sortedUnique(
    contract.notExecutedByFullLocalCommand.testFiles,
    'notExecutedByFullLocalCommand.testFiles',
  );
  invariant(
    Array.isArray(contract.localOnlyProfile.entries),
    'localOnlyProfile.entries must be an array',
  );
  const localEntries = contract.localOnlyProfile.entries.map((entry, index) => {
    exactKeys(entry, ['path', 'reasonCode'], `localOnlyProfile.entries[${index}]`);
    safeRelativeTestPath(entry.path, `localOnlyProfile.entries[${index}].path`);
    invariant(
      ALLOWED_LOCAL_REASON_CODES.has(entry.reasonCode),
      `local-only reason code is not allowed: ${entry.reasonCode}`,
    );
    return entry;
  });
  const localPaths = sortedUnique(
    localEntries.map((entry) => entry.path),
    'localOnlyProfile entry paths',
  );
  invariant(
    localEntries.every((entry, index) => entry.path === localPaths[index]),
    'localOnlyProfile.entries must use deterministic path order',
  );

  for (const file of [...hosted, ...localPaths, ...notExecuted]) {
    safeRelativeTestPath(file, file);
  }
  const hostedSet = new Set(hosted);
  invariant(
    localPaths.every((file) => !hostedSet.has(file)),
    'Hosted and local-only demo partitions must be disjoint',
  );
  const fullLocalPartition = [...hosted, ...localPaths].sort();
  invariant(
    JSON.stringify(fullLocalPartition) === JSON.stringify(fullLocal),
    'Hosted and local-only demo partitions must cover the exact full-local test discovery',
  );
  const fullLocalSet = new Set(fullLocal);
  invariant(
    notExecuted.every((file) => !fullLocalSet.has(file)),
    'not-executed and full-local demo partitions must be disjoint',
  );
  const testShapedPartition = [...fullLocal, ...notExecuted].sort();
  invariant(
    JSON.stringify(testShapedPartition) === JSON.stringify(testShaped),
    'full-local and not-executed partitions must cover every tracked test-shaped file',
  );

  invariant(
    testShaped.length === EXPECTED_TEST_SHAPED_FILE_COUNT,
    'tracked test-shaped demo file count drifted from the reviewed floor',
  );
  invariant(
    fullLocal.length === EXPECTED_FULL_LOCAL_FILE_COUNT,
    'full-local demo test file count drifted from the reviewed floor',
  );
  invariant(
    hosted.length === EXPECTED_HOSTED_FILE_COUNT,
    'Hosted demo test file count cannot shrink or drift without review',
  );
  invariant(
    localPaths.length === EXPECTED_LOCAL_ONLY_FILE_COUNT,
    'local-only demo test file count drifted without review',
  );
  invariant(
    notExecuted.length === EXPECTED_NOT_EXECUTED_FILE_COUNT,
    'not-executed demo test-shaped file count drifted without review',
  );
  invariant(
    hashPathSet(testShaped) === EXPECTED_TEST_SHAPED_PATH_SET_SHA256,
    'reviewed test-shaped demo path set drifted',
  );
  invariant(
    hashPathSet(fullLocal) === EXPECTED_FULL_LOCAL_PATH_SET_SHA256,
    'reviewed full-local demo path set drifted',
  );
  invariant(
    hashPathSet(hosted) === EXPECTED_HOSTED_PATH_SET_SHA256,
    'reviewed Hosted demo path set drifted',
  );
  invariant(
    hashPathSet(localPaths) === EXPECTED_LOCAL_ONLY_PATH_SET_SHA256,
    'reviewed local-only demo path set drifted',
  );
  invariant(
    hashPathSet(notExecuted) === EXPECTED_NOT_EXECUTED_PATH_SET_SHA256,
    'reviewed not-executed demo path set drifted',
  );
  invariant(
    contract.hostedProfile.expectedTestCount === EXPECTED_HOSTED_TEST_COUNT &&
      contract.hostedProfile.expectedPassCount === EXPECTED_HOSTED_TEST_COUNT &&
      contract.hostedProfile.expectedSkipCount === 0,
    'Hosted demo capability floor drifted',
  );
  invariant(
    JSON.stringify(contract.hostedProfile.nodeArguments) ===
      JSON.stringify(EXPECTED_HOSTED_NODE_ARGUMENTS),
    'Hosted demo Node arguments drifted',
  );
  invariant(
    typeof contract.localOnlyProfile.executionContract === 'string' &&
      contract.localOnlyProfile.executionContract.includes('NOT_RUN_REQUIRES_LOCAL_EVIDENCE') &&
      contract.localOnlyProfile.executionContract.includes('not PASS'),
    'local-only execution boundary must remain fail-closed',
  );
  invariant(
    typeof contract.notExecutedByFullLocalCommand.executionContract === 'string' &&
      contract.notExecutedByFullLocalCommand.executionContract.includes(
        'NOT_EXECUTED_BY_FULL_LOCAL_COMMAND',
      ) &&
      contract.notExecutedByFullLocalCommand.executionContract.includes('not PASS'),
    'not-executed test-shaped boundary must remain explicit',
  );
  invariant(
    typeof contract.boundary === 'string' &&
      contract.boundary.includes('not a full demo-suite PASS'),
    'Hosted demo boundary must deny full-suite PASS semantics',
  );

  for (const file of testShapedPartition) {
    invariant(
      statSync(path.join(packageRoot, file)).isFile(),
      `classified demo test is not a regular file: ${file}`,
    );
  }

  validateMeasurement(
    'trackedTestShapedUniverse',
    testShaped,
    contract.trackedTestShapedUniverse,
  );
  validateMeasurement('fullLocalDiscovery', fullLocal, contract.fullLocalDiscovery);
  validateMeasurement('hostedProfile', hosted, contract.hostedProfile);
  validateMeasurement('localOnlyProfile', localPaths, contract.localOnlyProfile);
  validateMeasurement(
    'notExecutedByFullLocalCommand',
    notExecuted,
    contract.notExecutedByFullLocalCommand,
  );

  return Object.freeze({
    status: 'HOSTED_DEMO_CONTRACT_PASS',
    testShaped,
    fullLocal,
    hosted,
    localEntries,
    notExecuted,
    expectedTestCount: EXPECTED_HOSTED_TEST_COUNT,
    testShapedPathSetSha256: hashPathSet(testShaped),
    fullLocalPathSetSha256: hashPathSet(fullLocal),
    hostedPathSetSha256: hashPathSet(hosted),
    localOnlyPathSetSha256: hashPathSet(localPaths),
    notExecutedPathSetSha256: hashPathSet(notExecuted),
  });
}

export function loadAndValidateHostedDemoContract(packageRoot = PACKAGE_ROOT) {
  return validateHostedDemoContract({
    contract: JSON.parse(readFileSync(path.join(packageRoot, 'hosted-tests.v1.json'), 'utf8')),
    packageRoot,
  });
}

function readTapCount(output, label) {
  const matches = [...output.matchAll(new RegExp(`^# ${label} (\\d+)$`, 'gm'))];
  invariant(matches.length === 1, `Hosted demo TAP summary must contain one ${label} count`);
  return Number(matches[0][1]);
}

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  invariant(result.error === undefined, result.error?.message ?? `${command} could not start`);
  invariant(result.status === 0, `${command} exited ${result.status}`);
  return result;
}

function main() {
  const allowedArguments = new Set(['--check-contract']);
  const argumentsSeen = process.argv.slice(2);
  invariant(
    argumentsSeen.every((argument) => allowedArguments.has(argument)) &&
      new Set(argumentsSeen).size === argumentsSeen.length,
    'usage: node scripts/run-hosted-tests.mjs [--check-contract]',
  );
  const validated = loadAndValidateHostedDemoContract();
  process.stdout.write(
    `${validated.status}: ${validated.hosted.length}/${validated.fullLocal.length} full-local test files; ` +
      `${validated.localEntries.length} local-evidence files remain NOT_RUN; ` +
      `${validated.notExecuted.length} additional test-shaped files are not executed by npm test\n`,
  );
  if (process.argv.includes('--check-contract')) return;

  runChecked(process.execPath, ['scripts/generate-registry.mjs', '--check']);
  const result = runChecked(process.execPath, [
    ...EXPECTED_HOSTED_NODE_ARGUMENTS,
    ...validated.hosted,
  ]);
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const summary = {
    tests: readTapCount(output, 'tests'),
    pass: readTapCount(output, 'pass'),
    fail: readTapCount(output, 'fail'),
    cancelled: readTapCount(output, 'cancelled'),
    skipped: readTapCount(output, 'skipped'),
    todo: readTapCount(output, 'todo'),
  };
  invariant(
    summary.tests === validated.expectedTestCount &&
      summary.pass === validated.expectedTestCount &&
      summary.fail === 0 &&
      summary.cancelled === 0 &&
      summary.skipped === 0 &&
      summary.todo === 0,
    `Hosted demo TAP summary drifted: ${JSON.stringify(summary)}`,
  );
  const reasonCounts = Object.groupBy(
    validated.localEntries,
    (entry) => entry.reasonCode,
  );
  process.stdout.write(
    `HOSTED_DEMO_TESTS_PASS: ${summary.pass}/${summary.tests}; ` +
      `local evidence NOT_RUN_REQUIRES_LOCAL_EVIDENCE=${validated.localEntries.length}; ` +
      `${Object.entries(reasonCounts).map(([reason, entries]) => `${reason}=${entries.length}`).join(', ')}\n`,
  );
  process.stdout.write('Boundary: this is not a full demo-suite PASS and changes no Current-JS or release gate.\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === CURRENT_FILE) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
