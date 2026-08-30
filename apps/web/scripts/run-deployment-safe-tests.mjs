#!/usr/bin/env node

import {readdir, lstat} from 'node:fs/promises';
import {constants as osConstants} from 'node:os';
import path from 'node:path';
import {spawn as defaultSpawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const webRoot = path.resolve(import.meta.dirname, '..');
const testsRoot = path.join(webRoot, 'tests');

export const EXCLUDED_TEST_PATHS = Object.freeze([
  'tests/g4-l3-lesson-navigation.test.ts',
]);

export const DEPLOYMENT_SAFE_TEST_SKIP_NAMES = Object.freeze([
  'candidate profile holds 3 alternate runtime files and 204 frozen evidence files',
  'showcase asset policy binds exactly the 39 page packages and one shell',
  'source-bound resume prompt stays local, explicit, and acceptance-neutral',
  'source-bound Exit prompt preserves the shell visual and replaces legacy network behavior locally',
  'all 54 runtime files are exact-byte and exact-SHA bound to their manifests',
  'G5 L4 shell Key Terms candidate stays exact-source-bound and acceptance-neutral',
  'G4 L3 and G5 L4 formal adapters exclude both legacy shells',
]);

export const REQUIRED_DEPLOYMENT_TEST_PATHS = Object.freeze([
  'tests/private-preview-deployment-assets.test.ts',
  'tests/current-js-showcase-publication.test.ts',
  'tests/page-only-current-js-showcase-asset-policy.test.ts',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function escapeRegExp(value) {
  invariant(typeof value === 'string', 'test name must be a string');
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function buildExactTestSkipPattern(testNames = DEPLOYMENT_SAFE_TEST_SKIP_NAMES) {
  invariant(Array.isArray(testNames) && testNames.length > 0, 'test skip names must not be empty');
  invariant(
    new Set(testNames).size === testNames.length,
    'test skip names contain duplicates',
  );
  return `^(?:${testNames.map(escapeRegExp).join('|')})$`;
}

export const DEPLOYMENT_SAFE_TEST_SKIP_PATTERN = buildExactTestSkipPattern();

function assertExactList(actual, expected, label) {
  invariant(Array.isArray(actual), `${label} must be an array`);
  invariant(
    actual.length === expected.length
      && actual.every((value, index) => value === expected[index]),
    `${label} must match the exact approved list`,
  );
}

export function buildDeploymentSafeTestPlan(
  allTestPaths,
  {
    fileExclusions = EXCLUDED_TEST_PATHS,
    requiredTestPaths = REQUIRED_DEPLOYMENT_TEST_PATHS,
  } = {},
) {
  invariant(Array.isArray(allTestPaths), 'discovered test paths must be an array');
  invariant(
    new Set(allTestPaths).size === allTestPaths.length,
    'discovered test paths contain duplicates',
  );
  assertExactList(fileExclusions, EXCLUDED_TEST_PATHS, 'deployment-safe file exclusions');
  assertExactList(requiredTestPaths, REQUIRED_DEPLOYMENT_TEST_PATHS, 'required deployment tests');

  for (const relativePath of fileExclusions) {
    invariant(
      allTestPaths.includes(relativePath),
      `deployment-safe exclusion was not discovered: ${relativePath}`,
    );
  }

  const excluded = new Set(fileExclusions);
  const selectedTestPaths = allTestPaths.filter((relativePath) => !excluded.has(relativePath));
  for (const requiredPath of requiredTestPaths) {
    invariant(
      selectedTestPaths.includes(requiredPath),
      `deployment-safe runner omitted required deployment test: ${requiredPath}`,
    );
  }
  invariant(selectedTestPaths.length > 0, 'deployment-safe test runner selected no tests');

  return Object.freeze({
    allTestPaths: Object.freeze([...allTestPaths]),
    excludedTestPaths: Object.freeze([...fileExclusions]),
    requiredTestPaths: Object.freeze([...requiredTestPaths]),
    selectedTestPaths: Object.freeze([...selectedTestPaths]),
    testSkipNames: DEPLOYMENT_SAFE_TEST_SKIP_NAMES,
    testSkipPattern: DEPLOYMENT_SAFE_TEST_SKIP_PATTERN,
  });
}

async function collectTestPaths(directory, relativeRoot) {
  const paths = [];
  const entries = await readdir(directory, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const metadata = await lstat(absolutePath);
    if (metadata.isDirectory()) {
      paths.push(...await collectTestPaths(absolutePath, relativeRoot));
    } else if (metadata.isFile() && /\.test\.tsx?$/u.test(entry.name)) {
      paths.push(path.relative(relativeRoot, absolutePath).split(path.sep).join('/'));
    }
  }
  return paths;
}

export async function discoverDeploymentTestPaths(
  directory = testsRoot,
  relativeRoot = webRoot,
) {
  return collectTestPaths(directory, relativeRoot);
}

export async function validateDeploymentSafeFileExclusions(
  root = webRoot,
  fileExclusions = EXCLUDED_TEST_PATHS,
) {
  assertExactList(fileExclusions, EXCLUDED_TEST_PATHS, 'deployment-safe file exclusions');
  for (const relativePath of fileExclusions) {
    const metadata = await lstat(path.join(root, relativePath));
    invariant(metadata.isFile(), `deployment-safe exclusion is not a file: ${relativePath}`);
  }
}

export function buildDeploymentSafeTestInvocation(
  testPaths,
  {
    cwd = webRoot,
    env = process.env,
    testSkipPattern = DEPLOYMENT_SAFE_TEST_SKIP_PATTERN,
  } = {},
) {
  invariant(Array.isArray(testPaths) && testPaths.length > 0, 'test invocation requires test paths');
  invariant(
    new Set(testPaths).size === testPaths.length,
    'test invocation paths contain duplicates',
  );
  invariant(testSkipPattern === DEPLOYMENT_SAFE_TEST_SKIP_PATTERN, 'test invocation skip pattern drifted');
  return Object.freeze({
    command: process.execPath,
    args: Object.freeze([
      '--import',
      'tsx',
      '--test',
      '--test-skip-pattern',
      testSkipPattern,
      ...testPaths,
    ]),
    options: Object.freeze({
      cwd,
      env,
      shell: false,
      stdio: 'inherit',
    }),
  });
}

export function runDeploymentSafeTests(
  testPaths,
  {
    cwd = webRoot,
    env = process.env,
    spawnImpl = defaultSpawn,
  } = {},
) {
  const invocation = buildDeploymentSafeTestInvocation(testPaths, {cwd, env});
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnImpl(invocation.command, invocation.args, invocation.options);
    } catch (error) {
      reject(error);
      return;
    }
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      resolve(Object.freeze({
        code: code ?? null,
        signal: signal ?? null,
      }));
    });
  });
}

export function exitCodeFromChildStatus({code, signal}) {
  if (signal) {
    const signalNumber = osConstants.signals?.[signal];
    return typeof signalNumber === 'number' ? 128 + signalNumber : 1;
  }
  return code ?? 1;
}

export async function main() {
  await validateDeploymentSafeFileExclusions();
  const allTestPaths = await discoverDeploymentTestPaths();
  const plan = buildDeploymentSafeTestPlan(allTestPaths);
  process.stdout.write(
    `deployment-safe web tests: selected=${plan.selectedTestPaths.length} `
      + `file-excluded=${plan.excludedTestPaths.length} `
      + `test-skipped=${plan.testSkipNames.length}\n`,
  );
  const result = await runDeploymentSafeTests(plan.selectedTestPaths);
  if (result.signal) {
    process.stderr.write(`deployment-safe test runner child received ${result.signal}\n`);
  }
  return exitCodeFromChildStatus(result);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) process.exitCode = await main();
