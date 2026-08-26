import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  CONTRACT_PATH,
  PACKAGE_ROOT,
  discoverFullLocalTests,
  discoverTestShapedFiles,
  hashPathSet,
  pathSetEncodedByteLength,
  validateHostedDemoContract,
} from '../scripts/run-hosted-tests.mjs';

const packageJson = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
const contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
const testShaped = discoverTestShapedFiles(PACKAGE_ROOT);
const fullLocal = discoverFullLocalTests(PACKAGE_ROOT);

function clone(value) {
  return structuredClone(value);
}

function validate(candidate, {
  discoveredTestShapedFiles = testShaped,
  discoveredFullLocalTests = fullLocal,
} = {}) {
  return validateHostedDemoContract({
    contract: candidate,
    packageRoot: PACKAGE_ROOT,
    packageJson,
    discoveredTestShapedFiles,
    discoveredFullLocalTests,
  });
}

function updateMeasurement(measurement, paths) {
  measurement.fileCount = paths.length;
  measurement.encodedByteLength = pathSetEncodedByteLength(paths);
  measurement.sortedPathSetSha256 = hashPathSet(paths);
}

test('Hosted demo contract exactly partitions every test without weakening npm test', () => {
  const result = validate(contract);
  assert.equal(result.status, 'HOSTED_DEMO_CONTRACT_PASS');
  assert.equal(result.testShaped.length, 172);
  assert.equal(result.fullLocal.length, 114);
  assert.equal(result.hosted.length, 66);
  assert.equal(result.localEntries.length, 48);
  assert.equal(result.notExecuted.length, 58);
  assert.equal(result.expectedTestCount, 427);
  assert.equal(
    packageJson.scripts.test,
    'npm run check:registry && tsx --test test/*.test.mjs tests/**/*.test.ts',
  );
});

test('a newly discovered demo test fails closed until it is classified', () => {
  const newTest = 'tests/unclassified-new.test.ts';
  assert.throws(
    () => validate(contract, {
      discoveredTestShapedFiles: [...testShaped, newTest].sort(),
      discoveredFullLocalTests: [...fullLocal, newTest].sort(),
    }),
    /exact full-local test discovery/,
  );
});

test('Hosted and local-only classifications cannot overlap', () => {
  const candidate = clone(contract);
  candidate.hostedProfile.testFiles = [
    ...candidate.hostedProfile.testFiles,
    candidate.localOnlyProfile.entries[0].path,
  ].sort();
  assert.throws(() => validate(candidate), /must be disjoint/);
});

test('local-only files require one approved evidence-boundary reason', () => {
  const candidate = clone(contract);
  candidate.localOnlyProfile.entries[0].reasonCode = 'UNREVIEWED_SKIP';
  assert.throws(() => validate(candidate), /reason code is not allowed/);
});

test('the reviewed Hosted file and capability floors cannot silently shrink', () => {
  const candidate = clone(contract);
  const [removed] = candidate.hostedProfile.testFiles.splice(-1, 1);
  candidate.localOnlyProfile.entries.push({
    path: removed,
    reasonCode: 'REQUIRES_REPO_EXCLUDED_CANONICAL_SOURCE',
  });
  candidate.localOnlyProfile.entries.sort((left, right) => left.path.localeCompare(right.path));
  assert.throws(() => validate(candidate), /cannot shrink or drift/);
});

test('a same-count Hosted and local-only swap fails after self-consistent hash updates', () => {
  const candidate = clone(contract);
  const removedHosted = candidate.hostedProfile.testFiles.pop();
  const promotedLocal = candidate.localOnlyProfile.entries.shift();
  candidate.hostedProfile.testFiles.push(promotedLocal.path);
  candidate.hostedProfile.testFiles.sort();
  candidate.localOnlyProfile.entries.push({
    path: removedHosted,
    reasonCode: 'REQUIRES_REPO_EXCLUDED_CANONICAL_SOURCE',
  });
  candidate.localOnlyProfile.entries.sort((left, right) => left.path.localeCompare(right.path));
  updateMeasurement(candidate.hostedProfile, candidate.hostedProfile.testFiles);
  updateMeasurement(
    candidate.localOnlyProfile,
    candidate.localOnlyProfile.entries.map((entry) => entry.path),
  );
  assert.throws(() => validate(candidate), /reviewed Hosted demo path set drifted/);
});
