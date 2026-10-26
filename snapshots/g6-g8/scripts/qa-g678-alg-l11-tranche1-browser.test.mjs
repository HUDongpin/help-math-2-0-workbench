import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  assertExactCompanionWindowSamples,
  assertExactCurrentHostReplaySet,
  assertDecodedMathDefinitions,
  assertExactInspectedGlossaryLiveIdentity,
  companionPortalExpectation,
  companionWindowFrames,
  createSeekReceipt,
  exactPredecessorReplayPlan,
  exactPredecessorSampleIds,
  explicitlyAllowedProductRequest,
  formatHistoricalAlreadyObservedDiagnostic,
  formatSeekTimeoutDiagnostic,
  assertExactHistoricalReplayFrames,
  assertExactRequestPolicyEvidence,
  historicalReplayFrameTargets,
  historicalAlreadyObservedReceipt,
  assertHistoricalAttainmentReceipt,
  historicalSeekInputReceipt,
  inlineLegacyReplayReceipt,
  replayStateReceipt,
  requestPolicyReceipt,
  seekPausePreconditionDecision,
  terminalCompanionReceipt,
} from './qa-g678-alg-l11-tranche1-browser.mjs';

const INTRO = new URL(
  '../catalog/g678-alg-l11-intro-terminal-tranche1-v1.json',
  import.meta.url);
const SIMPLE = new URL(
  '../catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json',
  import.meta.url);
const VB02 = new URL('../catalog/g678-vb02-l1-family-audit-v1.json',
  import.meta.url);
const IN02 = new URL('../catalog/g678-in02-l1-family-audit-v1.json',
  import.meta.url);
const PREDECESSOR_BROWSER = new URL(
  '../output/playwright/g678-current-js-342-v1/evidence.json', import.meta.url);
const COMPATIBILITY = new URL(
  '../catalog/g678-final342-current-bridge-successor-compatibility-v1.json',
  import.meta.url);
const DESCRIPTOR_PLAYER = new URL(
  '../apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  import.meta.url);
const GLOSSARY_PAUSE_HELPER = new URL(
  '../apps/web/lib/descriptor-driven-glossary-pause.ts', import.meta.url);
const GLOSSARY_PAUSE_HELPER_TEST = new URL(
  '../apps/web/tests/descriptor-driven-glossary-pause.test.ts',
  import.meta.url);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('ALG L11 browser contract binds exact48 buttons and decoded math terms',
  async () => {
    const [intro, simple] = await Promise.all([
      readFile(INTRO, 'utf8').then(JSON.parse),
      readFile(SIMPLE, 'utf8').then(JSON.parse),
    ]);
    assert.doesNotThrow(() => assertDecodedMathDefinitions(intro, simple));
    assert.equal(intro.scope.exactButtonScripts, 8);
    assert.equal(simple.scope.exactButtonScripts, 40);
    assert.equal(intro.terms.length, 6);
    assert.equal(simple.terms.length, 17);
    assert.deepEqual(intro.records.flatMap((record) =>
      record.behavior.buttons.map((button) => [record.animationId,
        button.characterId, button.firstFrame, button.lastFrame])), [
      ['shared-alg001-l11-p002', 181, 584, 780],
      ['shared-alg001-l11-p003', 228, 697, 994],
      ['shared-alg001-l11-p003', 229, 697, 994],
      ['shared-alg001-l11-p003', 233, 737, 994],
      ['shared-alg001-l11-p003', 234, 737, 994],
      ['shared-alg001-l11-p003', 237, 771, 994],
      ['shared-alg001-l11-p004', 332, 1290, 1353],
      ['shared-alg001-l11-p004', 333, 1290, 1353],
    ]);
    const absoluteValue = simple.terms.find((term) =>
      term.id === 'absolute-value');
    assert.deepEqual(absoluteValue.sourceCollisionResolution
      .rejectedMismatchedEntries.en.map((entry) => entry.elementLabel),
    ['Accurate']);
    assert.doesNotMatch(JSON.stringify([...intro.terms, ...simple.terms]),
      /&#x|&gt;|&lt;/iu);
  });

test('ALG L11 companion portal follows exact active and terminal windows',
  async () => {
    const intro = JSON.parse(await readFile(INTRO, 'utf8'));
    const records = new Map(intro.records.map((record) =>
      [record.animationId, record]));
    const record = (id) => records.get(id);
    assert.deepEqual(companionPortalExpectation(record(
      'shared-alg001-l11-p001'), 1),
    {visibleButtonCount: 0, expectedPortalCount: 0});
    assert.deepEqual(companionPortalExpectation(record(
      'shared-alg001-l11-p002'), 780),
    {visibleButtonCount: 1, expectedPortalCount: 1});
    assert.deepEqual(companionPortalExpectation(record(
      'shared-alg001-l11-p003'), 994),
    {visibleButtonCount: 5, expectedPortalCount: 1});
    assert.deepEqual(companionPortalExpectation(record(
      'shared-alg001-l11-p003'), 995),
    {visibleButtonCount: 0, expectedPortalCount: 0});
    assert.deepEqual(companionPortalExpectation(record(
      'shared-alg001-l11-p003'), 1701),
    {visibleButtonCount: 0, expectedPortalCount: 0});
    assert.deepEqual(companionPortalExpectation(record(
      'shared-alg001-l11-p004'), 1354),
    {visibleButtonCount: 0, expectedPortalCount: 0});
    assert.deepEqual(terminalCompanionReceipt(record(
      'shared-alg001-l11-p003'), 1701, 0, 0), {
      terminalExpectedGlossaryButtonCount: 0,
      terminalCompanionPortalCount: 0,
      terminalButtonCount: 0,
      terminalCompanionPortalMatched: true,
    });
    assert.deepEqual(terminalCompanionReceipt(record(
      'shared-alg001-l11-p002'), 780, 1, 1), {
      terminalExpectedGlossaryButtonCount: 1,
      terminalCompanionPortalCount: 1,
      terminalButtonCount: 1,
      terminalCompanionPortalMatched: true,
    });
    assert.equal(terminalCompanionReceipt(record(
      'shared-alg001-l11-p003'), 1701, 1, 0)
      .terminalCompanionPortalMatched, false);
    const p003 = record('shared-alg001-l11-p003');
    const exactSamples = companionWindowFrames(p003).map((frame) => {
      const expectation = companionPortalExpectation(p003, frame);
      return {frame, expectedButtonCount: expectation.visibleButtonCount,
        actualButtonCount: expectation.visibleButtonCount,
        expectedPortalCount: expectation.expectedPortalCount,
        actualPortalCount: expectation.expectedPortalCount};
    });
    assert.equal(exactSamples.length > 0, true);
    assert.equal(assertExactCompanionWindowSamples(p003, exactSamples), true);
    assert.throws(() => assertExactCompanionWindowSamples(p003, []),
      /companion window samples drifted/u);
    assert.throws(() => assertExactCompanionWindowSamples(p003,
      exactSamples.slice(1)), /companion window samples drifted/u);
    assert.throws(() => assertExactCompanionWindowSamples(p003,
      exactSamples.map((sample) => sample.frame === 995
        ? {...sample, actualPortalCount: 1}
        : sample)), /companion window samples drifted/u);
  });

test('ALG L11 Replay reset receipt follows source frame windows', async () => {
  const [intro, simple] = await Promise.all([
    readFile(INTRO, 'utf8').then(JSON.parse),
    readFile(SIMPLE, 'utf8').then(JSON.parse),
  ]);
  const p001 = intro.records.find((record) =>
    record.animationId === 'shared-alg001-l11-p001');
  const p007 = simple.records.find((record) =>
    record.animationId === 'shared-alg001-l11-p007');
  assert.deepEqual(replayStateReceipt(p001, {replayFrame: 1,
    actualButtonCount: 0, actualPortalCount: 0, renderState: 'ready',
    blockedAlertOrOverlayCount: 0}), {
    replayResetFrame: 1,
    replayExpectedButtonCount: 0,
    replayActualButtonCount: 0,
    replayExpectedPortalCount: 0,
    replayActualPortalCount: 0,
    replayRenderState: 'ready',
    replayBlockedAlertOrOverlayCount: 0,
    replayStateResetPassed: true,
  });
  const simpleReset = replayStateReceipt(p007, {replayFrame: 1,
    actualButtonCount: 5, actualPortalCount: 1, renderState: 'ready',
    blockedAlertOrOverlayCount: 0});
  assert.deepEqual([simpleReset.replayExpectedButtonCount,
    simpleReset.replayExpectedPortalCount,
    simpleReset.replayStateResetPassed], [5, 1, true]);
  assert.equal(replayStateReceipt(p007, {replayFrame: 1,
    actualButtonCount: 5, actualPortalCount: 0, renderState: 'ready',
    blockedAlertOrOverlayCount: 0}).replayStateResetPassed, false);
  assert.equal(replayStateReceipt(p001, {replayFrame: 1,
    actualButtonCount: 0, actualPortalCount: 0, renderState: 'ready',
    blockedAlertOrOverlayCount: 1}).replayStateResetPassed, false);
  assert.throws(() => replayStateReceipt(p001, {replayFrame: 1,
    actualButtonCount: 0, actualPortalCount: 0, renderState: 'ready'}),
  /replay state receipt input drifted/u);
});

test('ALG L11 browser request allowlist rejects drift and legacy operations',
  () => {
    const id = 'shared-alg001-l11-p001';
    const hash = 'a'.repeat(64);
    const pages = new Map([[id, {animationId: id, runtime: {
      canvasRenderer: {sha256: hash},
    }}]]);
    const allowed = (url, resourceType = 'script', method = 'GET') =>
      explicitlyAllowedProductRequest({url, resourceType, method}, pages);
    assert.equal(allowed(`http://127.0.0.1:3324/flash-assets/g678-local/${
      id}/canvas-renderer.js?sha256=${hash}`), true);
    assert.equal(allowed(`http://127.0.0.1:3324/flash-assets/g678-local/${
      id}/canvas-renderer.js?sha256=${'b'.repeat(64)}`), false);
    assert.equal(allowed(`http://127.0.0.1:3324/flash-assets/g678-local/${
      id}/canvas-renderer.js?sha256=${hash}`, 'script', 'POST'), false);
    assert.equal(allowed('http://127.0.0.1:3324/report/result', 'fetch'), false);
    assert.equal(allowed('https://example.com/runtime.js'), false);
    assert.equal(allowed('http://127.0.0.1:3324/_next/static/chunk.js'), true);
    assert.equal(allowed('http://127.0.0.1:3324/_next/arbitrary', 'fetch'),
      false);
    const observedRequests = [{method: 'GET', resourceType: 'script',
      url: `http://127.0.0.1:3324/flash-assets/g678-local/${
        id}/canvas-renderer.js?sha256=${hash}`}];
    const policy = requestPolicyReceipt({observedRequestCount: 1,
      allRequestsLoopback: true, unallowlistedRequestCount: 0,
      legacyNetworkOperationCount: 0});
    assert.equal(assertExactRequestPolicyEvidence(observedRequests, policy,
      pages), true);
    assert.throws(() => assertExactRequestPolicyEvidence(observedRequests,
      {...policy, allRequestsLoopback: true}, pages),
    /durable request policy evidence drifted/u);
    assert.throws(() => assertExactRequestPolicyEvidence(observedRequests,
      {...policy, unexpected: 0}, pages),
    /durable request policy evidence drifted/u);
  });

test('ALG L11 request policy receipt uses the live constructor fields', () => {
  const input = {observedRequestCount: 17, allRequestsLoopback: true,
    unallowlistedRequestCount: 0, legacyNetworkOperationCount: 0};
  assert.deepEqual(requestPolicyReceipt(input), {
    observedRequestCount: 17,
    allObservedRequestsLoopback: true,
    allObservedRequestsExplicitlyAllowed: true,
    legacyNetworkOperationsObserved: 0,
  });
  const {allRequestsLoopback: _missing, ...missing} = input;
  assert.throws(() => requestPolicyReceipt(missing),
    /request policy receipt input drifted/u);
  assert.throws(() => requestPolicyReceipt({observedRequestCount: 17,
    allObservedRequestsLoopback: true, unallowlistedRequestCount: 0,
    legacyNetworkOperationCount: 0}),
  /request policy receipt input drifted/u);
});

test('ALG L11 seek timeout diagnostic binds every runtime field', () => {
  const snapshot = {
    animationId: 'shared-alg001-l11-p018',
    target: 285,
    actualFrame: '284',
    renderState: 'ready',
    timelineValue: '285',
    runtimePaused: 'true',
    inspectionAction: 'resume-current-js-from-inspected-frame',
  };
  assert.equal(formatSeekTimeoutDiagnostic(snapshot),
    'seek target was not reached: ' + JSON.stringify(snapshot));
  const {inspectionAction: _missing, ...missing} = snapshot;
  assert.throws(() => formatSeekTimeoutDiagnostic(missing),
    /seek timeout diagnostic fields drifted/u);
  assert.throws(() => formatSeekTimeoutDiagnostic({...snapshot,
    target: '285'}), /seek timeout diagnostic fields drifted/u);
});

test('ALG L11 deterministic seek pause precondition is exact', () => {
  assert.equal(seekPausePreconditionDecision({
    ariaPressed: 'false', runtimePaused: 'false',
    inspectionAction: 'toggle-pause',
  }), 'pause-running');
  assert.equal(seekPausePreconditionDecision({
    ariaPressed: 'true', runtimePaused: 'true',
    inspectionAction: 'resume-current-js-from-inspected-frame',
  }), 'keep-paused');
  assert.equal(seekPausePreconditionDecision({
    ariaPressed: 'true', runtimePaused: 'true',
    inspectionAction: 'toggle-pause',
  }), 'keep-paused');
  assert.throws(() => seekPausePreconditionDecision({
    ariaPressed: 'false', runtimePaused: 'true',
    inspectionAction: 'toggle-pause',
  }), /seek pause precondition state drifted/u);
  assert.throws(() => seekPausePreconditionDecision({
    ariaPressed: 'false', runtimePaused: 'false',
  }), /seek pause precondition fields drifted/u);
  assert.deepEqual(createSeekReceipt({
    pausePreconditionDecision: 'pause-running',
    pausedForInspection: true,
    eventDispatchReturn: true,
    productHandlerObserved: true,
  }), {
    pausedForInspection: true,
    pausePreconditionDecision: 'pause-running',
    pauseControlClicked: true,
    inputEventDispatched: true,
    inputEventType: 'input',
    eventDispatchReturn: true,
    productHandlerObserved: true,
    exactTargetReached: true,
  });
  assert.deepEqual(createSeekReceipt({
    pausePreconditionDecision: 'keep-paused',
    pausedForInspection: true,
    eventDispatchReturn: true,
    productHandlerObserved: true,
  }).pauseControlClicked, false);
  assert.throws(() => createSeekReceipt({
    pausePreconditionDecision: 'keep-paused',
    pausedForInspection: true,
    eventDispatchReturn: false,
    productHandlerObserved: true,
  }), /seek receipt input drifted/u);
  assert.throws(() => createSeekReceipt({
    pausePreconditionDecision: 'keep-paused',
    pausedForInspection: true,
    eventDispatchReturn: true,
    productHandlerObserved: false,
  }), /seek receipt input drifted/u);
});

test('ALG L11 historical already-observed frame stays distinct from seek input',
  () => {
    const input = {target: 3, actualFrame: 3, timelineValue: '3',
      renderState: 'ready', pausedForInspection: true,
      inspectionAction: 'toggle-pause',
      pausePreconditionDecision: 'pause-running'};
    const receipt = historicalAlreadyObservedReceipt(input);
    assert.deepEqual(receipt, {
      attainment: 'already-observed', target: 3, actualFrame: 3,
      timelineValue: '3', renderState: 'ready', pausedForInspection: true,
      inspectionAction: 'toggle-pause',
      pausePreconditionDecision: 'pause-running', pauseControlClicked: true,
      inputEventDispatched: false, inputEventType: null,
      eventDispatchReturn: null, productHandlerObserved: false,
      exactTargetReached: true,
    });
    const wrapped = {frame: 3, renderState: 'ready',
      frameDomain: 'sprite-43', ...receipt};
    assert.equal(assertHistoricalAttainmentReceipt(wrapped, 3,
      'sprite-43'), true);
    assert.throws(() => historicalAlreadyObservedReceipt({...input,
      actualFrame: 2}), /historical already-observed frame receipt drifted/u);
    assert.throws(() => historicalAlreadyObservedReceipt({...input,
      timelineValue: '2'}),
    /historical already-observed frame receipt drifted/u);
    assert.throws(() => historicalAlreadyObservedReceipt({...input,
      inspectionAction: 'resume-current-js-from-inspected-frame'}),
    /historical already-observed frame receipt drifted/u);
    assert.throws(() => assertHistoricalAttainmentReceipt({...wrapped,
      pausePreconditionDecision: 'invalid'}, 3, 'sprite-43'),
    /historical already-observed frame receipt drifted/u);
    assert.throws(() => assertHistoricalAttainmentReceipt({...wrapped,
      pauseControlClicked: false}, 3, 'sprite-43'),
    /historical attainment durable core drifted/u);
    assert.throws(() => assertHistoricalAttainmentReceipt({...wrapped,
      unexpected: true}, 3, 'sprite-43'),
    /historical smoke frame wrapper drifted/u);
    assert.throws(() => assertHistoricalAttainmentReceipt({...wrapped,
      frame: 4}, 3, 'sprite-43'),
    /historical smoke frame wrapper drifted/u);
    assert.throws(() => assertHistoricalAttainmentReceipt({...wrapped,
      frameDomain: 'sprite-44'}, 3, 'sprite-43'),
    /historical smoke frame wrapper drifted/u);
    assert.throws(() => assertHistoricalAttainmentReceipt({...wrapped,
      target: 4}, 3, 'sprite-43'),
    /historical already-observed frame receipt drifted/u);
    const strictSeek = createSeekReceipt({
      pausePreconditionDecision: 'keep-paused',
      pausedForInspection: true, eventDispatchReturn: true,
      productHandlerObserved: true});
    const seekCore = historicalSeekInputReceipt({target: 4, actualFrame: 4,
      timelineValue: '4', renderState: 'ready',
      inspectionAction: 'resume-current-js-from-inspected-frame',
      seekReceipt: strictSeek});
    const seekWrapped = {frame: 4, renderState: 'ready',
      frameDomain: 'sprite-43', ...seekCore};
    assert.equal(assertHistoricalAttainmentReceipt(seekWrapped, 4,
      'sprite-43'), true);
    assert.throws(() => assertHistoricalAttainmentReceipt({...seekWrapped,
      actualFrame: 5}, 4, 'sprite-43'),
    /historical seek-input receipt fields drifted/u);
    assert.throws(() => assertHistoricalAttainmentReceipt({...seekWrapped,
      unexpected: true}, 4, 'sprite-43'),
    /historical smoke frame wrapper drifted/u);
  });

test('ALG L11 historical already-observed failure binds exact live diagnostic',
  () => {
    const diagnostic = {
      animationId: 'shared-nms002-l03-p051', target: 3, actualFrame: 3,
      timelineValue: '3', renderState: 'ready', runtimePaused: 'true',
      ariaPressed: 'true',
      inspectionAction: 'resume-current-js-from-inspected-frame',
      pausePreconditionDecision: 'pause-running', pauseControlClicked: true,
    };
    assert.equal(formatHistoricalAlreadyObservedDiagnostic(diagnostic),
      'historical already-observed frame receipt drifted: ' +
        JSON.stringify(diagnostic));
    const {animationId: _missing, ...missing} = diagnostic;
    assert.throws(() => formatHistoricalAlreadyObservedDiagnostic(missing),
      /historical already-observed diagnostic fields drifted/u);
    assert.throws(() => formatHistoricalAlreadyObservedDiagnostic({
      ...diagnostic, pauseControlClicked: 'true'}),
    /historical already-observed diagnostic fields drifted/u);
  });

test('ALG L11 inspected glossary binds before open while open and after identity',
  () => {
  const beforeOpen = {
    animationId: 'shared-alg001-l11-p003', frame: 697,
    frameDomain: 'root', timelineValue: '697',
    ariaPressed: 'true', runtimePaused: 'true',
    inspectionAction: 'resume-current-js-from-inspected-frame',
  };
  const whileOpen = {...beforeOpen};
  const afterClose = {...beforeOpen};
  assert.equal(assertExactInspectedGlossaryLiveIdentity(beforeOpen,
    whileOpen, afterClose), true);
  for (const [field, value] of [
    ['animationId', 'shared-alg001-l11-p004'],
    ['frame', 698],
    ['frameDomain', 'nested'],
    ['timelineValue', '698'],
  ]) {
    assert.throws(() => assertExactInspectedGlossaryLiveIdentity(beforeOpen,
      {...whileOpen, [field]: value}, afterClose),
    /inspected glossary live seek identity drifted/u);
  }
});

test('ALG L11 browser contract selects exact prior-host glossary regressions',
  async () => {
    const [vb02, in02] = await Promise.all([
      readFile(VB02, 'utf8').then(JSON.parse),
      readFile(IN02, 'utf8').then(JSON.parse),
    ]);
    const selections = [
      ['shared-alg001-l11-p005', vb02, 15, 117],
      ['shared-alg001-l11-p012', in02, 21, 247],
    ];
    for (const [animationId, audit, characterId, firstFrame] of selections) {
      const record = audit.records.find((item) =>
        item.animationId === animationId);
      const inequality = record.behavior.buttons.find((button) =>
        button.sourceKeyAttribute === 'Inequality');
      assert.deepEqual([inequality.characterId, inequality.firstFrame],
        [characterId, firstFrame]);
      assert.equal(record.structure.mainFrameCount > firstFrame, true);
    }
  });

test('ALG L11 old regression Replay remains inline and not companion',
  async () => {
    const [vb02, in02] = await Promise.all([
      readFile(VB02, 'utf8').then(JSON.parse),
      readFile(IN02, 'utf8').then(JSON.parse),
    ]);
    const record = (audit, id) => audit.records.find((item) =>
      item.animationId === id);
    const base = (actualGlobalButtons) => ({replayFrame: 1,
      actualGlobalButtons, companionButtonCount: 0,
      companionSurfaceCount: 0, renderState: 'ready', timelineValue: '1',
      ariaPressed: 'false', runtimePaused: 'false',
      inspectionAction: 'toggle-pause', blockedAlertOrOverlayCount: 0});
    const p005 = inlineLegacyReplayReceipt(record(vb02,
      'shared-alg001-l11-p005'), base([]));
    assert.deepEqual([p005.expectedGlobalButtons.length,
      p005.inlineLegacyPresentation, p005.notCompanion,
      p005.replayStateResetPassed], [0, true, true, true]);
    const p012Buttons = [
      {characterId: 7, sourceKeyAttribute: 'Equation', disabled: false,
        inCompanion: false},
      {characterId: 8, sourceKeyAttribute: 'Expression', disabled: false,
        inCompanion: false},
      {characterId: 9, sourceKeyAttribute: 'Equal sign', disabled: false,
        inCompanion: false},
    ];
    const p012Record = record(in02, 'shared-alg001-l11-p012');
    const p012 = inlineLegacyReplayReceipt(p012Record, base(p012Buttons));
    assert.deepEqual(p012.expectedGlobalButtons, p012Buttons);
    assert.equal(p012.replayStateResetPassed, true);
    assert.equal(inlineLegacyReplayReceipt(p012Record,
      base(p012Buttons.slice(1))).replayStateResetPassed, false);
    assert.equal(inlineLegacyReplayReceipt(p012Record,
      base(p012Buttons.map((button, index) => index === 0
        ? {...button, disabled: true}
        : button))).replayStateResetPassed, false);
    assert.equal(inlineLegacyReplayReceipt(p012Record,
      {...base(p012Buttons), companionButtonCount: 1})
      .replayStateResetPassed, false);
  });

test('ALG L11 browser contract requires all 92 predecessor samples live',
  async () => {
    const [predecessor, compatibility] = await Promise.all([
      readFile(PREDECESSOR_BROWSER, 'utf8').then(JSON.parse),
      readFile(COMPATIBILITY, 'utf8').then(JSON.parse),
    ]);
    const ids = exactPredecessorSampleIds(predecessor, compatibility);
    const plan = exactPredecessorReplayPlan(predecessor, compatibility);
    assert.equal(ids.length, 92);
    assert.equal(new Set(ids).size, 92);
    assert.equal(assertExactCurrentHostReplaySet(ids,
      ids.map((animationId) => ({animationId}))), true);
    assert.throws(() => assertExactCurrentHostReplaySet(ids,
      ids.slice(1).map((animationId) => ({animationId}))),
    /current-host predecessor sample replay set drifted/u);
    assert.throws(() => assertExactCurrentHostReplaySet(ids,
      ids.map((animationId, index) => ({animationId:
        index === 0 ? ids[1] : animationId}))),
    /current-host predecessor sample replay set drifted/u);
    assert.equal(plan.historicalFrameSamples.length, 89);
    assert.deepEqual(plan.specialReadySamples.map((sample) =>
      sample.animationId), [
      'shared-alg001-l09-p030',
      'shared-alg001-l09-p031',
      'shared-alg001-l09-p041',
    ]);
    const p043 = plan.historicalFrameSamples.find((sample) =>
      sample.animationId === 'shared-nms002-l01-p043');
    const p005 = plan.historicalFrameSamples.find((sample) =>
      sample.animationId === 'shared-alg001-l11-p005');
    assert.deepEqual(historicalReplayFrameTargets(p005), [3, 4]);
    assert.deepEqual(historicalReplayFrameTargets(p043), [6, 7]);
    assert.equal(assertExactHistoricalReplayFrames(p043,
      [{frame: 6}, {frame: 7}]), true);
    assert.throws(() => assertExactHistoricalReplayFrames(p043,
      [{frame: 6}, {frame: 779}]),
    /historical replay frame set drifted/u);
  });

test('ALG L11 successor binds exact glossary pause repair contracts',
  async () => {
    const [compatibility, descriptorPlayer, helper, helperTest] =
      await Promise.all([
        readFile(COMPATIBILITY, 'utf8').then(JSON.parse),
        readFile(DESCRIPTOR_PLAYER), readFile(GLOSSARY_PAUSE_HELPER),
        readFile(GLOSSARY_PAUSE_HELPER_TEST),
      ]);
    assert.deepEqual(compatibility.requiredProvisional354BrowserAssertions
      .glossaryPauseTransitions, {
      runningOpenCloseResumes: true,
      inspectedOpenCloseRemainsPaused: true,
      inspectedSeekRequestIdentityPreserved: true,
      blockedAndNestedRequestsMustNotOverwriteSnapshot: true,
      navigationReplayAndResetMustClearSnapshot: true,
    });
    assert.equal(sha256(descriptorPlayer),
      compatibility.inputs.currentDescriptorPlayer.sha256);
    assert.equal(sha256(helper),
      compatibility.inputs.currentGlossaryPauseHelper.sha256);
    assert.equal(sha256(helperTest),
      compatibility.inputs.currentGlossaryPauseHelperTest.sha256);
    assert.match(helperTest.toString('utf8'),
      /assert\.strictEqual\(closed\.seekRequest, inspected\)/u);
    assert.match(helperTest.toString('utf8'),
      /blocked requests cannot create, replace, close, or resume a session/u);
    assert.match(helperTest.toString('utf8'),
      /nested glossary opens retain the original pre-open playback snapshot/u);
  });
