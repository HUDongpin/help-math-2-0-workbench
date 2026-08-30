#!/usr/bin/env node

import {lstat, readdir} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

const webRoot = path.resolve(import.meta.dirname, '..');
const testsRoot = path.join(webRoot, 'tests');

const EXCLUDED_TEST_PATHS = Object.freeze([
  'tests/current-js-asset-profiles.test.ts',
  'tests/g4-l3-lesson-navigation.test.ts',
  'tests/g4-l3-showcase-asset-policy.test.ts',
  'tests/g4-l3-whole-lesson.test.ts',
  'tests/g5-l4-executive-preview-content.test.ts',
  'tests/g5-l4-whole-lesson-player-descriptor.test.ts',
  'tests/page-only-whole-lesson-availability.test.ts',
]);

const REQUIRED_DEPLOYMENT_TEST_PATHS = Object.freeze([
  'tests/private-preview-deployment-assets.test.ts',
  'tests/current-js-showcase-publication.test.ts',
  'tests/page-only-current-js-showcase-asset-policy.test.ts',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function collectTestPaths(directory) {
  const paths = [];
  const entries = await readdir(directory, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const metadata = await lstat(absolutePath);
    if (metadata.isDirectory()) {
      paths.push(...await collectTestPaths(absolutePath));
    } else if (metadata.isFile() && /\.test\.tsx?$/u.test(entry.name)) {
      paths.push(path.relative(webRoot, absolutePath).split(path.sep).join('/'));
    }
  }
  return paths;
}

async function validateExcludedTests() {
  invariant(
    new Set(EXCLUDED_TEST_PATHS).size === EXCLUDED_TEST_PATHS.length,
    'deployment-safe test exclusion list contains duplicates',
  );
  for (const relativePath of EXCLUDED_TEST_PATHS) {
    const metadata = await lstat(path.join(webRoot, relativePath));
    invariant(metadata.isFile(), `deployment-safe exclusion is not a file: ${relativePath}`);
  }
}

function runTests(testPaths) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', '--test', ...testPaths],
      {
        cwd: webRoot,
        env: process.env,
        stdio: 'inherit',
      },
    );
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) reject(new Error(`deployment-safe test runner received ${signal}`));
      else resolve(code ?? 1);
    });
  });
}

await validateExcludedTests();

const allTestPaths = await collectTestPaths(testsRoot);
const excluded = new Set(EXCLUDED_TEST_PATHS);
const selectedTestPaths = allTestPaths.filter((relativePath) => !excluded.has(relativePath));

for (const requiredPath of REQUIRED_DEPLOYMENT_TEST_PATHS) {
  invariant(
    selectedTestPaths.includes(requiredPath),
    `deployment-safe runner omitted required deployment test: ${requiredPath}`,
  );
}

invariant(selectedTestPaths.length > 0, 'deployment-safe test runner selected no tests');
process.stdout.write(
  `deployment-safe web tests: selected=${selectedTestPaths.length} excluded=${EXCLUDED_TEST_PATHS.length}\n`,
);
process.exitCode = await runTests(selectedTestPaths);
