import assert from 'node:assert/strict';
import {test} from 'node:test';

import {buildReport, parseArguments, validateCaptureManifest} from './qa-vb-004-candidate.mjs';

test('parseArguments is fail-closed and normalizes the base URL', () => {
  assert.deepEqual(parseArguments(['--base-url', 'http://127.0.0.1:3214/', '--check']), {
    baseUrl: 'http://127.0.0.1:3214',
    check: true
  });
  assert.throws(() => parseArguments(['--unknown']), /Unknown option/);
  assert.throws(() => parseArguments(['--base-url', 'file:\/\/\/tmp']), /HTTP/);
});

test('validateCaptureManifest requires exact identity, native pixels, and clean diagnostics', () => {
  const definition = {requirementId: 'req:root:root-standalone:en', frames: [1, 10]};
  const requirement = {
    frameDomainId: 'root',
    traceId: 'trace:root:root-standalone:en:seed-0',
    entryStateSha256: 'a'.repeat(64),
    scenario: 'root-standalone',
    language: 'en',
    seed: '0'
  };
  const captured = definition.frames.map((frame) => ({
    frame,
    reportedFrame: frame,
    reportedFrameDomainId: 'root',
    requirementId: definition.requirementId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    width: 800,
    height: 600,
    visualTarget: {reportedRenderState: 'ready'}
  }));
  const manifest = {
    schemaVersion: 3,
    status: 'complete',
    animationId: 'course-g03-l01-vb-004',
    requirementId: definition.requirementId,
    frameDomainId: 'root',
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
    captured,
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
    error: null
  };
  assert.equal(validateCaptureManifest(manifest, definition, requirement), true);
  assert.throws(() => validateCaptureManifest({...manifest, consoleErrors: ['boom']}, definition, requirement), /consoleErrors/);
  assert.throws(() => validateCaptureManifest({...manifest, captured: captured.map((entry) => ({...entry, width: 799}))}, definition, requirement), /800x600/);
});

test('buildReport never promotes engineering QA to strict, human, or owner acceptance', () => {
  const binding = {path: 'x', sha256: 'a'.repeat(64)};
  const captures = [{
    definition: {requirementId: 'req', frames: [1, 2]},
    requirement: {frameDomainId: 'root', scenario: 'default', language: 'en'},
    manifest: {captured: [{}, {}]},
    manifestBinding: binding
  }];
  const bindings = Object.fromEntries([
    'fla', 'swf', 'renderer', 'timeline', 'tests', 'adapterGenerator', 'adapterGeneratorTests',
    'adapterSpec', 'adapterManifest', 'rendererSupport', 'coverage', 'producer', 'producerTests'
  ].map((key) => [key, binding]));
  const report = buildReport({captures, visualSanity: {}, bindings, reviewedAt: '2026-07-22T00:00:00.000Z'});
  assert.equal(report.status, 'pass');
  assert.equal(report.strictAcceptanceEffect, false);
  assert.equal(report.humanVisualReview.decision, 'pending');
  assert.equal(report.ownerAcceptance.decision, 'pending');
  assert.equal(report.implementation.migrationStatusUnchanged, 'preserved');
});
