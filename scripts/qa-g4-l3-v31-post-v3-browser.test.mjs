import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  findEphemeralLoopbackPort,
  parseBrowserArguments,
  SCREENSHOT_ROOT,
  validateEphemeralPort,
} from './qa-g4-l3-v31-post-v3-browser.mjs';

test('browser CLI exposes exactly one immutable run or read-only check mode', () => {
  assert.equal(parseBrowserArguments(['--run']), 'run');
  assert.equal(parseBrowserArguments(['--check']), 'check');
  assert.throws(() => parseBrowserArguments([]), /exactly one/);
  assert.throws(
    () => parseBrowserArguments(['--run', '--check']),
    /exactly one/,
  );
  assert.throws(() => parseBrowserArguments(['--port', '3216']), /exactly one/);
});

test('browser QA always rejects frozen v3 port 3216', () => {
  assert.equal(validateEphemeralPort(3217), 3217);
  assert.throws(() => validateEphemeralPort(3216), /refuses frozen v3/);
  assert.throws(() => validateEphemeralPort(0), /valid TCP port/);
});

test('ephemeral allocation returns a distinct loopback port', async () => {
  const port = await findEphemeralLoopbackPort([3217]);
  assert.notEqual(port, 3216);
  assert.notEqual(port, 3217);
  assert(port > 0 && port <= 65_535);
});

test('browser runner encodes bilingual whole-lesson, feature, viewport, and isolation checks', async () => {
  const source = await readFile(
    new URL('./qa-g4-l3-v31-post-v3-browser.mjs', import.meta.url),
    'utf8',
  );
  assert.equal(
    SCREENSHOT_ROOT,
    'output/playwright/g4-l3-v31-post-v3-current-js-regression',
  );
  for (const expected of [
    'g4-l3-v31-post-v3-browser-qa',
    'ephemeral-exclusive-loopback-preflight',
    'expectedCount: 39',
    'expectedCount: 54',
    'course-g04-l03-rw-003',
    'course-g04-l03-vb-005',
    'course-g04-l03-vb-006',
    'data-current-js-functional-entry',
    'data-host-selection-resolution="matched-local-entry"',
    'ignoredAbortedSameOriginKeyTermsRequests',
    'superseded-by-whole-lesson-page-navigation',
    'sourceStopHeldAfterClose',
    'standaloneHostIsolation',
    'g5Isolation',
    'externalRequests',
    'reducedMotion',
    "width: 390",
    "width: 700",
    "width: 1024",
    "width: 1366",
    "width: 1600",
    "open(absolute(BROWSER_QA_JSON), 'wx', 0o444)",
  ]) {
    assert(source.includes(expected), expected);
  }
  assert.doesNotMatch(source, /localhost:3216|127\.0\.0\.1:3216/);
});
