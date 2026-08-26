import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {PNG} from 'pngjs';

import {
  DEV_OVERLAY_CAPTURE_CSS,
  DEV_OVERLAY_CAPTURE_STYLE_ID,
  DEV_OVERLAY_CONTROL_SELECTOR,
  RE001_CANDIDATE_QA_MATRIX_CASES,
  allClaimsFalse,
  buildCandidateQaIdentity,
  devOverlaySuppressionPass,
  normalizeLoopbackBaseUrl,
  parseArguments,
  replayResetIdentityPass
} from './qa-re-001-candidate.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const animationId = 'course-g03-l08-re-001';
const reportPath = path.join(
  projectRoot,
  'migrations',
  animationId,
  'evidence',
  'native-canvas-candidate-qa.json'
);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

test('RE01 QA CLI accepts exact loopback origins and rejects remote or embellished URLs', () => {
  assert.equal(normalizeLoopbackBaseUrl('http://127.0.0.1:3213'), 'http://127.0.0.1:3213');
  assert.equal(normalizeLoopbackBaseUrl('http://localhost:3213/'), 'http://localhost:3213');
  assert.equal(normalizeLoopbackBaseUrl('http://[::1]:3213'), 'http://[::1]:3213');
  assert.equal(parseArguments(['--base-url', 'http://localhost:4444']).baseUrl, 'http://localhost:4444');
  assert.deepEqual(parseArguments(['--help']), {baseUrl: 'http://127.0.0.1:3213', help: true});
  assert.throws(() => normalizeLoopbackBaseUrl('https://example.com'), /loopback|localhost/);
  assert.throws(() => normalizeLoopbackBaseUrl('file:///tmp/server'), /http or https/);
  assert.throws(() => normalizeLoopbackBaseUrl('http://localhost:3213/subpath'), /without credentials/);
  assert.throws(() => normalizeLoopbackBaseUrl('http://user@localhost:3213'), /without credentials/);
  assert.throws(() => parseArguments(['--wat']), /Unknown option/);
});

test('RE01 candidate identities bind every deterministic field and remain stable', () => {
  const identity = buildCandidateQaIdentity({
    frame: 51,
    frameDomain: 'sprite-621',
    rootFrame: 51,
    scenario: 'host-review-unavailable',
    language: 'es',
    seed: 7
  });
  assert.equal(identity.frameDomain, 'sprite-621');
  assert.equal(identity.rootFrame, 51);
  assert.equal(identity.requirementId, 'qa:sprite-621:host-review-unavailable:es');
  assert.equal(identity.traceId, 'qa-trace:sprite-621:host-review-unavailable:es:seed-7');
  assert.deepEqual(identity.entryState, {
    kind: 'engineering-candidate-product-qa',
    animationId,
    frameDomain: 'sprite-621',
    frame: 51,
    rootFrame: 51,
    scenario: 'host-review-unavailable',
    language: 'es',
    seed: 7
  });
  assert.equal(identity.entryStateSha256, sha256(JSON.stringify(identity.entryState)));
  assert.equal(
    buildCandidateQaIdentity({
      frame: 51,
      frameDomain: 'sprite-621',
      rootFrame: 51,
      scenario: 'host-review-unavailable',
      language: 'es',
      seed: 7
    }).entryStateSha256,
    identity.entryStateSha256
  );
});

test('RE01 candidate authority claims can only pass the helper when every value is false', () => {
  assert.equal(allClaimsFalse({strictValidator: false, ownerAcceptance: false}), true);
  assert.equal(allClaimsFalse({strictValidator: true, ownerAcceptance: false}), false);
  assert.equal(allClaimsFalse({}), false);
  assert.equal(allClaimsFalse(null), false);
});

test('RE01 future browser QA matrix requires both root languages ready and all six nested cases blocked', () => {
  assert.equal(RE001_CANDIDATE_QA_MATRIX_CASES.length, 8);
  assert.deepEqual(
    RE001_CANDIDATE_QA_MATRIX_CASES.map(
      ({blocker, frameDomain, language, scenario, visualLocalizationStatus}) => ({
        blocker,
        frameDomain,
        language,
        scenario,
        visualLocalizationStatus
      })
    ),
    [
      {
        blocker: null,
        frameDomain: 'root',
        language: 'en',
        scenario: 'root-standalone',
        visualLocalizationStatus: 'source-shared-untranslated-visual'
      },
      {
        blocker: null,
        frameDomain: 'root',
        language: 'es',
        scenario: 'root-standalone',
        visualLocalizationStatus: 'source-shared-untranslated-visual'
      },
      {
        blocker: 'reviewans-host-state-unavailable',
        frameDomain: 'sprite-621',
        language: 'en',
        scenario: 'default',
        visualLocalizationStatus: 'host-dependent-unresolved'
      },
      {
        blocker: 'spanish-host-state-not-source-proven',
        frameDomain: 'sprite-621',
        language: 'es',
        scenario: 'default',
        visualLocalizationStatus: 'host-dependent-unresolved'
      },
      {
        blocker: 'reviewans-host-state-unavailable',
        frameDomain: 'sprite-621',
        language: 'en',
        scenario: 'host-review-unavailable',
        visualLocalizationStatus: 'host-dependent-unresolved'
      },
      {
        blocker: 'spanish-host-state-not-source-proven',
        frameDomain: 'sprite-621',
        language: 'es',
        scenario: 'host-review-unavailable',
        visualLocalizationStatus: 'host-dependent-unresolved'
      },
      {
        blocker: 'javascript-history-side-effect-disabled',
        frameDomain: 'sprite-621',
        language: 'en',
        scenario: 'legacy-back-unavailable',
        visualLocalizationStatus: 'host-dependent-unresolved'
      },
      {
        blocker: 'spanish-host-state-not-source-proven',
        frameDomain: 'sprite-621',
        language: 'es',
        scenario: 'legacy-back-unavailable',
        visualLocalizationStatus: 'host-dependent-unresolved'
      }
    ]
  );
});

test('RE01 evidence capture rejects every visible or incompletely hidden Next dev overlay state', () => {
  assert.match(DEV_OVERLAY_CAPTURE_STYLE_ID, /capture|overlay/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /script\[data-nextjs-dev-overlay/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /nextjs-portal/);
  assert.match(DEV_OVERLAY_CAPTURE_CSS, /,/);
  assert.match(DEV_OVERLAY_CONTROL_SELECTOR, /button/);
  const hidden = {
    scriptOverlayCount: 1,
    hiddenScriptOverlayCount: 1,
    portalCount: 1,
    hiddenPortalCount: 1,
    shadowRootCount: 1,
    controlCount: 2,
    visibleControlCount: 0
  };
  const clean = {
    capturePageOnly: true,
    styleInstalled: true,
    afterSuppression: hidden,
    afterCapture: hidden
  };
  assert.equal(devOverlaySuppressionPass(clean), true);
  assert.equal(
    devOverlaySuppressionPass({
      ...clean,
      afterSuppression: {...hidden, visibleControlCount: 1}
    }),
    false
  );
  assert.equal(
    devOverlaySuppressionPass({
      ...clean,
      afterCapture: {...hidden, visibleControlCount: 1}
    }),
    false
  );
  assert.equal(
    devOverlaySuppressionPass({
      ...clean,
      afterCapture: {...hidden, hiddenPortalCount: 0}
    }),
    false
  );
  assert.equal(
    devOverlaySuppressionPass({
      ...clean,
      afterCapture: {...hidden, hiddenScriptOverlayCount: 0}
    }),
    false
  );
  assert.equal(devOverlaySuppressionPass({...clean, styleInstalled: false}), false);
  assert.equal(devOverlaySuppressionPass({...clean, capturePageOnly: false}), false);
  assert.equal(devOverlaySuppressionPass({...clean, afterCapture: null}), false);
});

test('RE01 Replay acceptance rejects drift in any host or candidate identity field', () => {
  const scenario = 'root-standalone';
  const language = 'en';
  const seed = 7;
  const identity = buildCandidateQaIdentity({frame: 1, scenario, language, seed});
  const runtime = (frame) => ({
    animationId,
    frame: String(frame),
    rootFrame: String(frame),
    frameDomain: identity.frameDomain,
    requirementId: identity.requirementId,
    traceId: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario,
    language,
    seed: String(seed)
  });
  const candidate = (frame, phase, localFrame) => ({
    frame: String(frame),
    phase,
    localFrame,
    scenario,
    language,
    seed: String(seed)
  });
  const proof = {
    identity,
    scenario,
    language,
    seed,
    before: {replay: 0, runtime: runtime(7), candidate: candidate(7, 'pre-begin', 'not-placed')},
    reset: {replay: 1, runtime: runtime(1), candidate: candidate(1, 'pre-begin', 'not-placed')},
    resumed: {replay: 1, runtime: runtime(2), candidate: candidate(2, 'pre-begin', 'not-placed')}
  };
  assert.equal(replayResetIdentityPass(proof), true);
  for (const [part, field, value] of [
    ['reset', 'frameDomain', 'sprite-621'],
    ['reset', 'requirementId', 'wrong-requirement'],
    ['reset', 'traceId', 'wrong-trace'],
    ['reset', 'entryStateSha256', 'f'.repeat(64)],
    ['resumed', 'scenario', 'host-review-unavailable'],
    ['resumed', 'language', 'es'],
    ['before', 'seed', '8']
  ]) {
    const changed = {
      ...proof,
      [part]: {
        ...proof[part],
        runtime: {...proof[part].runtime, [field]: value}
      }
    };
    assert.equal(replayResetIdentityPass(changed), false, `${part}.${field}`);
  }
});

test('RE01 browser QA is either current eight-case output or the pinned pre-disposition report remains explicitly stale', async () => {
  const reportBytes = await readFile(reportPath);
  const report = JSON.parse(reportBytes.toString('utf8'));
  assert.equal(report.schemaVersion, 3);
  assert.equal(report.animationId, animationId);
  assert.equal(report.status, 'pass');
  assert.equal(report.acceptanceEffect, 'none');
  assert.equal(report.strictAcceptanceEffect, false);
  assert.equal(report.generatedBy.script, 'scripts/qa-re-001-candidate.mjs');
  assert.equal(report.generatedBy.deterministic, false);
  assert.equal(allClaimsFalse(report.claims), true);
  assert.equal(allClaimsFalse(report.authorityBoundary), true);
  assert.equal(report.migrationStatusAfter, report.migrationStatusBefore);
  assert.ok(report.assertions.length >= 13);
  assert.ok(report.assertions.every((entry) => entry.pass === true));

  const currentModuleBytes = await readFile(
    path.join(
      projectRoot,
      'packages/demos/src/modules/course-g03-l08-re-001.tsx'
    )
  );
  const recordedModule = report.implementation.find(
    ({path: relativePath}) =>
      relativePath === 'packages/demos/src/modules/course-g03-l08-re-001.tsx'
  );
  const currentProducerBytes = await readFile(
    path.join(projectRoot, 'scripts/qa-re-001-candidate.mjs')
  );
  const browserQaIsCurrent =
    recordedModule?.sha256 === sha256(currentModuleBytes) &&
    report.generatedBy.scriptSha256 === sha256(currentProducerBytes);
  if (!browserQaIsCurrent) {
    assert.equal(
      sha256(reportBytes),
      '41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025',
      'only the exact pre-disposition QA report may remain as stale history'
    );
    assert.equal(report.deterministicContract.caseCount, 6);
    assert.equal(report.deterministicContract.matrix.length, 6);
    assert.equal(
      report.deterministicContract.matrix.filter(
        (entry) => entry.expected.status === 'ready'
      ).length,
      1
    );
    assert.equal(
      report.deterministicContract.matrix.filter(
        (entry) => entry.expected.status === 'blocked'
      ).length,
      5
    );
    assert.notEqual(recordedModule?.sha256, sha256(currentModuleBytes));
    assert.notEqual(report.generatedBy.scriptSha256, sha256(currentProducerBytes));
    return;
  }

  for (const entry of [report.source, report.generatedBy, ...report.implementation]) {
    const relativePath = entry.path ?? entry.script;
    const expectedHash = entry.sha256 ?? entry.scriptSha256;
    const bytes = await readFile(path.join(projectRoot, relativePath));
    assert.equal(sha256(bytes), expectedHash, relativePath);
  }
  assert.equal(report.source.sha256, report.source.expectedSha256);

  const matrix = report.deterministicContract.matrix;
  assert.equal(report.deterministicContract.caseCount, 8);
  assert.deepEqual(new Set(report.deterministicContract.frameDomains), new Set(['root', 'sprite-621']));
  assert.equal(matrix.length, 8);
  assert.deepEqual(
    new Set(
      matrix.map(
        (entry) =>
          `${entry.requested.frameDomain}:${entry.requested.language}:${entry.requested.scenario}`
      )
    ),
    new Set([
      'root:en:root-standalone',
      'root:es:root-standalone',
      'sprite-621:en:default',
      'sprite-621:es:default',
      'sprite-621:en:host-review-unavailable',
      'sprite-621:es:host-review-unavailable',
      'sprite-621:en:legacy-back-unavailable',
      'sprite-621:es:legacy-back-unavailable'
    ])
  );
  assert.equal(matrix.filter((entry) => entry.expected.status === 'ready').length, 2);
  assert.equal(matrix.filter((entry) => entry.expected.status === 'blocked').length, 6);
  for (const entry of matrix) {
    assert.equal(entry.pass, true);
    assert.equal(entry.frozen, true);
    assert.equal(entry.identityMatched, true);
    assert.equal(entry.dispositionMatched, true);
    assert.equal(entry.capture.width, 800);
    assert.equal(entry.capture.height, 600);
    assert.equal(entry.before.runtime.frame, String(entry.requested.frame));
    assert.equal(entry.before.runtime.frameDomain, entry.requested.frameDomain);
    assert.equal(entry.before.runtime.rootFrame, String(entry.requested.rootFrame));
    assert.equal(entry.before.runtime.requirementId, entry.requested.requirementId);
    assert.equal(entry.before.runtime.traceId, entry.requested.traceId);
    assert.equal(entry.before.runtime.entryStateSha256, entry.requested.entryStateSha256);
  }

  const structural = report.deterministicContract.frame55Structural;
  assert.equal(structural.pass, true);
  assert.equal(structural.before.runtime.frame, '55');
  assert.equal(structural.before.candidate.naturalFrame, '51');
  assert.equal(structural.before.candidate.phase, 'post-stop-structural-frame');
  assert.match(structural.authority, /engineering structural probe only/);

  assert.equal(report.browserQa.nativeStage.exact, true);
  assert.equal(report.browserQa.nativeStage.capture.width, 800);
  assert.equal(report.browserQa.nativeStage.capture.height, 600);
  assert.equal(report.browserQa.replay.length, 6);
  assert.deepEqual(
    new Set(report.browserQa.replay.map((entry) => `${entry.control}:${entry.input}`)),
    new Set([
      'host:pointer',
      'host:Enter',
      'host:Space',
      'candidate:pointer',
      'candidate:Enter',
      'candidate:Space'
    ])
  );
  assert.ok(report.browserQa.replay.every((entry) => entry.pass));
  for (const entry of report.browserQa.replay) {
    assert.equal(
      replayResetIdentityPass({
        before: entry.before,
        reset: entry.reset,
        resumed: entry.resumed,
        identity: entry.identity,
        scenario: entry.expectedContext.scenario,
        language: entry.expectedContext.language,
        seed: entry.expectedContext.seed
      }),
      true,
      `${entry.control}:${entry.input}`
    );
  }
  assert.equal(report.browserQa.mobile.length, 2);
  assert.ok(report.browserQa.mobile.every((entry) => entry.pass && !entry.horizontalOverflow));
  assert.equal(report.browserQa.reducedMotion.pass, true);
  assert.equal(report.browserQa.accessibility.pass, true);
  assert.deepEqual(report.browserQa.diagnostics.console.errors, []);
  assert.deepEqual(report.browserQa.diagnostics.console.warnings, []);
  assert.deepEqual(report.browserQa.diagnostics.pageErrors, []);
  assert.deepEqual(report.browserQa.diagnostics.network.failedRequests, []);
  assert.deepEqual(report.browserQa.diagnostics.network.httpErrors, []);
  assert.deepEqual(report.browserQa.diagnostics.network.unexpectedRequests, []);
  assert.ok(
    report.browserQa.diagnostics.network.observedOrigins.every((origin) =>
      ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)
    )
  );

  const captures = [
    ...matrix.map((entry) => entry.capture),
    structural.capture,
    ...report.browserQa.mobile.map((entry) => entry.capture),
    report.browserQa.reducedMotion.capture
  ];
  assert.ok(captures.length >= 12);
  for (const capture of captures) {
    assert.match(capture.path, /^output\/playwright\/course-g03-l08-re-001-candidate-qa\//);
    const bytes = await readFile(path.join(projectRoot, capture.path));
    assert.equal(sha256(bytes), capture.sha256, capture.path);
    const png = PNG.sync.read(bytes);
    assert.equal(png.width, capture.width, capture.path);
    assert.equal(png.height, capture.height, capture.path);
    assert.equal(devOverlaySuppressionPass(capture.devOverlaySuppression), true, capture.path);
    assert.equal(capture.devOverlaySuppression.afterSuppression.visibleControlCount, 0);
    assert.equal(capture.devOverlaySuppression.afterCapture.visibleControlCount, 0);
  }
  assert.equal(
    report.assertions.find((entry) =>
      entry.id === 'next-dev-overlay-suppressed-before-and-after-every-screenshot'
    )?.pass,
    true
  );
});
