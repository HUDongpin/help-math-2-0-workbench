import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import type {
  FullConfig,
  FullResult,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

import CanvasResolutionHashReporter, {
  canonicalJson,
  makeHashBoundRunReport,
  verifyHashBoundRunReport,
} from '../e2e/canvas-resolution-hash-reporter';

function fakeConfig(argv: string[] = []) {
  return {
    argv,
    configFile: '/workspace/apps/web/playwright.canvas-resolution.config.ts',
    metadata: {
      canvasResolutionRun: {
        runScope: 'local-candidate',
        baseURL: 'http://127.0.0.1:3222',
        deploymentId: null,
        performanceScope: 'production-preview-full',
      },
    },
    projects: [{
      name: 'chromium-retina',
      outputDir: '/tmp/canvas-results',
      repeatEach: 1,
      retries: 0,
      use: {
        baseURL: 'http://127.0.0.1:3222',
        browserName: 'chromium',
        deviceScaleFactor: 2,
        locale: 'en-US',
        viewport: {width: 1280, height: 720},
      },
    }],
  } as unknown as FullConfig;
}

function fakeSuite(planned = 1) {
  return {
    allTests: () => Array.from({length: planned}, (_, index) => ({
      id: index === 0
        ? 'chromium-retina:canvas-contract'
        : `chromium-retina:canvas-contract-${index}`,
    })),
  } as unknown as Suite;
}

function fakeTest() {
  return {
    id: 'chromium-retina:canvas-contract',
    parent: {project: () => ({name: 'chromium-retina'})},
    titlePath: () => [
      'chromium-retina',
      'canvas-resolution.spec.ts',
      'adaptive Canvas contract',
    ],
    location: {
      file: '/workspace/apps/web/e2e/canvas-resolution.spec.ts',
      line: 10,
      column: 3,
    },
    expectedStatus: 'passed',
    outcome: () => 'expected',
  } as unknown as TestCase;
}

function fakeResult(attachment: Buffer) {
  return {
    status: 'passed',
    retry: 0,
    duration: 42,
    startTime: new Date('2026-08-23T12:00:00.000Z'),
    annotations: [],
    errors: [],
    attachments: [{
      name: 'backing',
      contentType: 'image/png',
      body: attachment,
    }, {
      name: 'canvas-resolution-browser-environment',
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify({
        schemaVersion: 1,
        artifactType: 'canvas-resolution-browser-environment',
        projectName: 'chromium-retina',
        baseURL: 'http://127.0.0.1:3222',
        browserName: 'chromium',
        browserVersion: 'test-browser-1',
        userAgent: 'test-user-agent',
        nodeVersion: process.versions.node,
        platform: process.platform,
        architecture: process.arch,
        performanceScope: 'production-preview-full',
      })),
    }],
  } as unknown as TestResult;
}

test('hash-bound report canonicalizes payload and detects mutation', () => {
  const document = makeHashBoundRunReport({z: 1, a: {b: 2, a: 1}});
  verifyHashBoundRunReport(document);
  assert.equal(document.contentSha256, createHash('sha256').update(
    canonicalJson({
      schemaVersion: 1,
      artifactType: 'canvas-resolution-playwright-run-report',
      payload: {z: 1, a: {b: 2, a: 1}},
    }),
  ).digest('hex'));
  assert.throws(() => verifyHashBoundRunReport({
    ...document,
    payload: {changed: true},
  }), /content hash/u);
});

test('reporter writes one exclusive hash-bound run receipt with attachment and input hashes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'canvas-e2e-reporter-'));
  try {
    const outputDirectory = path.join(root, 'reports');
    const input = path.join(root, 'required-input.json');
    await writeFile(input, '{"ok":true}\n', 'utf8');
    const reporter = new CanvasResolutionHashReporter({
      workspaceRoot: root,
      outputDirectory,
      requiredInputs: ['required-input.json'],
    });
    reporter.onBegin(fakeConfig(), fakeSuite());
    reporter.onTestEnd(fakeTest(), fakeResult(Buffer.from('png-bytes')));
    const result = await reporter.onEnd({
      status: 'passed',
      startTime: new Date('2026-08-23T12:00:00.000Z'),
      duration: 100,
    } satisfies FullResult);
    assert.deepEqual(result, {status: 'passed'});
    const files = await readdir(outputDirectory);
    assert.equal(files.length, 1);
    const document = JSON.parse(await readFile(
      path.join(outputDirectory, files[0]!),
      'utf8',
    ));
    verifyHashBoundRunReport(document);
    assert.equal(document.payload.run.effectiveStatus, 'passed');
    assert.equal(document.payload.requiredInputs[0].status, 'bound');
    assert.equal(document.payload.tests[0].attachments[0].sha256,
      createHash('sha256').update('png-bytes').digest('hex'));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('reporter does not fabricate a verification receipt for --list', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'canvas-e2e-list-'));
  try {
    const reporter = new CanvasResolutionHashReporter({
      workspaceRoot: root,
      outputDirectory: path.join(root, 'reports'),
      requiredInputs: ['missing.json'],
    });
    reporter.onBegin(fakeConfig(['--list']), fakeSuite());
    const result = await reporter.onEnd({
      status: 'passed',
      startTime: new Date('2026-08-23T12:00:00.000Z'),
      duration: 0,
    } satisfies FullResult);
    assert.equal(result, undefined);
    await assert.rejects(readdir(path.join(root, 'reports')), /ENOENT/u);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('missing required input overrides an otherwise passing run to failed', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'canvas-e2e-missing-'));
  try {
    const outputDirectory = path.join(root, 'reports');
    const reporter = new CanvasResolutionHashReporter({
      workspaceRoot: root,
      outputDirectory,
      requiredInputs: ['missing.json'],
    });
    reporter.onBegin(fakeConfig(), fakeSuite());
    reporter.onTestEnd(fakeTest(), fakeResult(Buffer.from('png-bytes')));
    const result = await reporter.onEnd({
      status: 'passed',
      startTime: new Date('2026-08-23T12:00:00.000Z'),
      duration: 100,
    } satisfies FullResult);
    assert.deepEqual(result, {status: 'failed'});
    const [file] = await readdir(outputDirectory);
    const document = JSON.parse(await readFile(
      path.join(outputDirectory, file!),
      'utf8',
    ));
    verifyHashBoundRunReport(document);
    assert.equal(document.payload.run.effectiveStatus, 'failed');
    assert.equal(document.payload.closure.requiredInputClosurePassed, false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
