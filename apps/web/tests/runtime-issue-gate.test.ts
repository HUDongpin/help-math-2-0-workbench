import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {classifyConsoleIssue} from '../e2e/runtime-issue-gate';

const webRoot = path.resolve(import.meta.dirname, '..');
const e2eRoot = path.join(webRoot, 'e2e');
const ordinaryExcludedSpecs = new Set([
  'clerk-synthetic-lifecycle.spec.ts',
  'production-smoke.spec.ts',
]);

test('the shared runtime classifier is fail-closed for release-blocking signals', () => {
  assert.equal(classifyConsoleIssue('error', 'arbitrary console error'), 'console-error');
  assert.equal(
    classifyConsoleIssue('warning', 'Maximum update depth exceeded. warning canary'),
    'maximum-update-depth',
  );
  assert.equal(
    classifyConsoleIssue('log', 'Maximum update depth exceeded. log canary'),
    'maximum-update-depth',
  );
  assert.equal(classifyConsoleIssue('warning', 'ordinary non-blocking warning'), null);
  assert.equal(classifyConsoleIssue('log', 'ordinary diagnostic'), null);
});

test('every ordinary Site spec imports the shared runtime test fixture', async () => {
  const names = (await readdir(e2eRoot))
    .filter((name) => name.endsWith('.spec.ts') && !ordinaryExcludedSpecs.has(name))
    .toSorted();
  assert.deepEqual(names, [
    'canvas-sharpness.spec.ts',
    'g4-l9-p5-1-occurrence-29-bounded.spec.ts',
    'g4-l9-p5-f08-occurrence-32-stress.spec.ts',
    'g4-l9-product-bridge.spec.ts',
    'g5-l4-audio.spec.ts',
    'learning-experience-polish.spec.ts',
    'legacy-lesson-shell-responsive.spec.ts',
    'modern-wide-geometry.spec.ts',
    'prototype-acceptance.spec.ts',
    'site.spec.ts',
  ]);

  for (const name of names) {
    const source = await readFile(path.join(e2eRoot, name), 'utf8');
    assert.match(source, /from ['"]\.\/runtime-issue-gate['"]/u, name);
    assert.doesNotMatch(
      source,
      /import\s*\{[^}]*\btest\b[^}]*\}\s*from ['"]@playwright\/test['"]/su,
      `${name} must not bypass the shared runtime fixture`,
    );
  }
});

test('every ordinary browser.newContext page is explicitly attached to the gate', async () => {
  const expected = new Set([
    'g4-l9-p5-1-occurrence-29-bounded.spec.ts',
    'g4-l9-p5-f08-occurrence-32-stress.spec.ts',
    'g4-l9-product-bridge.spec.ts',
  ]);
  const observed = new Set<string>();

  for (const name of await readdir(e2eRoot)) {
    if (!name.endsWith('.spec.ts') || ordinaryExcludedSpecs.has(name)) continue;
    const source = await readFile(path.join(e2eRoot, name), 'utf8');
    if (!source.includes('browser.newContext(')) continue;
    observed.add(name);
    assert.match(
      source,
      /runtimeIssueGate\.attachPage\(page\)/u,
      `${name} creates an unattached BrowserContext page`,
    );
  }

  assert.deepEqual(observed, expected);
});

test('the shared fixture contains no message allowlist and CI fails on flaky tests', async () => {
  const [fixture, config] = await Promise.all([
    readFile(path.join(e2eRoot, 'runtime-issue-gate.ts'), 'utf8'),
    readFile(path.join(webRoot, 'playwright.config.ts'), 'utf8'),
  ]);
  assert.doesNotMatch(fixture, /ERR_BLOCKED_BY_CLIENT|CheckoutProvider/u);
  assert.match(fixture, /consoleType === 'error'/u);
  assert.match(fixture, /message\.includes\(MAXIMUM_UPDATE_DEPTH\)/u);
  assert.match(fixture, /page\.on\('pageerror'/u);
  assert.match(config, /failOnFlakyTests: Boolean\(process\.env\.CI\)/u);
});
