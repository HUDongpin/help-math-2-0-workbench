import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {
  animationModuleRegistration,
  loadAnimationModule,
} from '../src/animation-registry';
import {
  buildG4L9P4SeededOrder,
  createG4L9P4FeedbackHostRequest,
  createG4L9P4InteractionState,
  createG4L9P4ReplayHostRequests,
  g4L9P4DragOutcome,
  getG4L9P4FrameState,
  reduceG4L9P4Interaction,
} from '../src/g4-l9-p4-state-machines';
import {createMemoryOnlyLessonHost} from '../src/lesson-host-contract';
import module from '../src/modules/course-g04-l09-ti-004';
import comparisonModule from '../src/modules/course-g04-l09-ti-007';
import {COURSE_G04_L09_TI_004_CONFIG as config} from '../src/timelines/course-g04-l09-ti-004';
import {COURSE_G04_L09_TI_007_CONFIG as comparisonConfig} from '../src/timelines/course-g04-l09-ti-007';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const animationId = 'course-g04-l09-ti-004';
const calibrationId = 'g4-l9-p5-1-occurrence-29-bounded-v1';
const privateBridgeReleaseId = 'private-g4-l9-p5-f08-occurrence-32-stress-v1';
const coreActionDigest =
  '7c00b70187fffbb82726f74f2514ececbd530034120d6095efdba4729c544996';

const sha256 = (bytes: Buffer | string) =>
  createHash('sha256').update(bytes).digest('hex');

test('binds occurrence 29 to its unique SWF-only identity and private calibration', async () => {
  assert.deepEqual(animationModuleRegistration(animationId), {
    maturity: 'private-current-js',
    scope: 'private-engineering',
    calibrationId,
  });
  assert.equal((await loadAnimationModule(animationId))?.key, animationId);
  assert.equal(module.key, animationId);
  assert.equal(config.placementId, 'g04-l09-placement-029');
  assert.equal(config.sourceOccurrence, 29);
  assert.equal(config.sourceSwfPath, 'HELP_COURSES/ELMGR4/L9/TI/L9TI04.swf');
  assert.equal(
    config.sourceSwfSha256,
    'aab74a30241e71013cee75fa7e6224fd3e09acc7ca097f713c681b2dd6bec8eb',
  );
  assert.equal(config.sourceSwfBytes, 85562);
  assert.equal(config.frameDomain, 'sprite-134');
  assert.equal(config.frameCount, 119);
  assert.equal(config.rootFrameCount, 10);
  assert.equal(config.fps, 12);
  assert.equal(config.lane, 'advanced-manual');
  assert.equal(config.f08ScaleOut, false);
});

test('freezes the exact source closure and distinct 42-action core', async () => {
  const freeze = JSON.parse(await readFile(
    `${repositoryRoot}catalog/g4-l9-p5-1-occurrence-29-bounded-freeze-v1.json`,
    'utf8',
  ));
  const audit = JSON.parse(await readFile(
    `${repositoryRoot}migrations/course-g04-l09-ti-004/audit/p5-1-occurrence-29-source-comparison.json`,
    'utf8',
  ));
  assert.equal(freeze.exactSourceClosure.fileCount, 5);
  assert.equal(freeze.exactSourceClosure.totalBytes, 984291);
  assert.equal(freeze.exactSourceClosure.projection.bytes, 552);
  assert.equal(
    freeze.exactSourceClosure.projection.sha256,
    '094037293057a37c6b479131096e8008636545f471e97c3be169193a6505ece9',
  );
  assert.deepEqual(
    [
      audit.coreActionProjection.occurrence29.nonGlossaryCoreActionCount,
      audit.coreActionProjection.occurrence29.projectionBytes,
      audit.coreActionProjection.occurrence29.multisetSha256,
    ],
    [42, 2730, coreActionDigest],
  );
  assert.equal(audit.coreActionProjection.differsFromAllComparators, true);
  for (const occurrence of ['occurrence20', 'occurrence30', 'occurrence32']) {
    assert.notEqual(
      audit.coreActionProjection[occurrence].sha256,
      coreActionDigest,
      occurrence,
    );
  }
  assert.equal(audit.randomCycle.actionSha256,
    '35d1483d2e70fdaf3a4f73ab44fa89ccf9a867f02b23d9fee13950bd38756662');
  assert.equal(audit.randomCycle.terminalActionSha256,
    '8a2021341dfb52c1a619176e3c2a415f27e1e32d26816da29e250bca292ab9be');
});

test('implements a deterministic four-choice cycle with source drag and terminal state', () => {
  assert.deepEqual(config.randomCycle, {
    adapter: 'rndAudio-source-array-seeded-cycle-v1',
    sourceChoices: ['S1', 'S2', 'S3', 'S4'],
    actionSha256:
      '35d1483d2e70fdaf3a4f73ab44fa89ccf9a867f02b23d9fee13950bd38756662',
    terminalActionSha256:
      '8a2021341dfb52c1a619176e3c2a415f27e1e32d26816da29e250bca292ab9be',
    terminalCorrectCount: 4,
  });
  assert.equal(config.randomQuestionAdapter, undefined);
  for (const seed of [-1, 0, 1, 4092026, 2147483646]) {
    const first = buildG4L9P4SeededOrder(4, seed + 29);
    const second = buildG4L9P4SeededOrder(4, seed + 29);
    assert.deepEqual(first, second, String(seed));
    assert.deepEqual([...first].sort((a, b) => a - b), [0, 1, 2, 3]);
  }

  assert.deepEqual(config.dragBindings, [
    {sourceInstance: 'Scr1', outcome: 'incorrect'},
    {sourceInstance: 'Scr2', outcome: 'correct'},
    {sourceInstance: 'Scr3', outcome: 'correct'},
    {sourceInstance: 'Scr4', outcome: 'correct'},
    {sourceInstance: 'Scr5', outcome: 'correct'},
    {sourceInstance: 'Scr6', outcome: 'incorrect'},
  ]);
  for (const binding of config.dragBindings) {
    assert.equal(g4L9P4DragOutcome(config, binding.sourceInstance), binding.outcome);
  }
  assert.equal(g4L9P4DragOutcome(config, 'Scr7'), undefined);

  let state = createG4L9P4InteractionState(config, 4092026);
  const initial = state;
  state = reduceG4L9P4Interaction(config, state, {
    type: 'drag', sourceInstance: 'Scr1',
  });
  assert.equal(state.feedback, 'incorrect');
  assert.equal(state.score, 0);
  assert.equal(state.tryCount, 1);
  assert.equal(state.phase, 'feedback');
  state = reduceG4L9P4Interaction(config, state, {type: 'next'});
  for (const [index, sourceInstance] of ['Scr2', 'Scr3', 'Scr4', 'Scr5'].entries()) {
    state = reduceG4L9P4Interaction(config, state, {type: 'drag', sourceInstance});
    assert.equal(state.feedback, 'correct');
    assert.equal(state.score, index + 1);
    assert.equal(state.tryCount, index + 2);
    if (index < 3) {
      assert.equal(state.phase, 'feedback');
      state = reduceG4L9P4Interaction(config, state, {type: 'next'});
    }
  }
  assert.equal(state.phase, 'final');
  assert.equal(state.score, 4);
  assert.deepEqual(state.placedCorrect, ['Scr2', 'Scr3', 'Scr4', 'Scr5']);
  assert.equal(state.networkCalls, 0);

  state = reduceG4L9P4Interaction(config, state, {type: 'replay', replay: 1});
  assert.equal(state.phase, 'question');
  assert.equal(state.seed, initial.seed);
  assert.deepEqual(state.choiceOrder, initial.choiceOrder);
  assert.equal(state.choiceLabel, initial.choiceLabel);
  assert.equal(state.score, 0);
  assert.equal(state.attempts, 0);
  assert.equal(state.tryCount, 0);
  assert.deepEqual(state.placedCorrect, []);
  assert.equal(state.lastDragSourceInstance, null);
  assert.equal(state.feedback, 'idle');
  assert.equal(state.audioLifecycle, 'idle');
});

test('preserves all 12 source glossary handlers and only the explicit typo alias', () => {
  assert.deepEqual(config.glossaryHandlers?.map(({sourceIntent}) => sourceIntent), [
    'Equation',
    'Mathematical aentence',
    'Show',
    'Expression',
    'Equal',
    'Expression',
    'Equation',
    'Equal',
    'Expression',
    'Sentence',
    'Equation',
    'Show',
  ]);
  assert.equal(new Set(config.glossaryHandlers?.map(({entryId}) => entryId)).size, 5);
  assert.deepEqual(config.glossaryHandlers?.filter(
    ({resolution}) => resolution === 'explicit-source-bound-alias',
  ), [{
    handlerIndex: 2,
    sourceIntent: 'Mathematical aentence',
    resolvedKeyAttribute: 'Sentence',
    entryId: 'sentence',
    resolution: 'explicit-source-bound-alias',
  }]);
  const markup = renderToStaticMarkup(createElement(module.Renderer, {
    audioEnabled: true,
    frame: 1,
    frameDomain: config.frameDomain,
    lang: 'en',
    scenario: config.scenarioId!,
    seed: 4092026,
  }));
  assert.equal((markup.match(/aria-label="Glossary /gu) ?? []).length, 12);
  assert.match(markup, /Glossary 2: Mathematical aentence/u);
  assert.match(markup, /data-random-cycle-adapter="rndAudio-source-array-seeded-cycle-v1"/u);
  assert.match(markup, /data-drag-correct="Scr2,Scr3,Scr4,Scr5"/u);
  assert.match(markup, /data-drag-incorrect="Scr1,Scr6"/u);
  assert.match(markup, /data-try-count="0"/u);
  assert.match(markup, /data-terminal="false"/u);
});

test('keeps the occurrence-29 source canvas and required controls in exact flow regions', async () => {
  const markup = renderToStaticMarkup(createElement(module.Renderer, {
    audioEnabled: true,
    frame: 1,
    frameDomain: config.frameDomain,
    lang: 'en',
    scenario: config.scenarioId!,
    seed: 4092026,
  }));
  assert.match(markup, /data-product-layout="source-controls-flow-v2"/u);
  assert.match(markup, /data-source-controls-layout="separate-flow-regions"/u);
  assert.match(markup, /data-source-safe-region="true"/u);
  assert.match(markup, /data-interaction-panel="true"/u);
  assert.match(markup, /data-required-control-surface="true"/u);
  assert.equal(
    (markup.match(/data-p5-1-required-control=/gu) ?? []).length,
    14,
  );
  const requiredControlProjection = [...markup.matchAll(
    /data-p5-1-required-control="([^"]+)"/gu,
  )].map((match) => match[1]);
  assert.deepEqual(requiredControlProjection, [
    ...Array.from(
      {length: 12},
      (_, index) => `glossary-${String(index + 1).padStart(2, '0')}`,
    ),
    'audio',
    'replay',
  ]);
  assert.equal(new Set(requiredControlProjection).size, 14);
  assert.ok(
    markup.indexOf('data-source-safe-region="true"') <
      markup.indexOf('data-interaction-panel="true"'),
    'source-safe canvas precedes the interaction panel in document flow',
  );
  assert.ok(
    markup.indexOf('data-interaction-panel="true"') <
      markup.indexOf('data-required-control-surface="true"'),
    'interaction panel precedes required page controls in document flow',
  );

  const comparisonMarkup = renderToStaticMarkup(createElement(
    comparisonModule.Renderer,
    {
      audioEnabled: true,
      frame: 1,
      frameDomain: comparisonConfig.frameDomain,
      lang: 'en',
      scenario: comparisonConfig.scenarioId!,
      seed: 4092026,
    },
  ));
  assert.doesNotMatch(comparisonMarkup, /source-controls-flow-v2/u);
  assert.doesNotMatch(comparisonMarkup, /data-source-safe-region/u);
  assert.doesNotMatch(comparisonMarkup, /data-interaction-panel/u);
  assert.doesNotMatch(comparisonMarkup, /data-p5-1-required-control/u);

  const hostCss = await readFile(
    `${repositoryRoot}apps/web/app/globals.css`,
    'utf8',
  );
  const exactIdentity =
    ".g4-l9-p4[data-animation-id='course-g04-l09-ti-004'][data-source-occurrence='29'][data-random-cycle-adapter='rndAudio-source-array-seeded-cycle-v1'][data-product-layout='source-controls-flow-v2']";
  assert.ok(hostCss.includes(exactIdentity));
  assert.match(hostCss, /aspect-ratio: auto;/u);
  assert.match(hostCss, /overflow: visible;/u);
  assert.match(hostCss, /\.reduced-motion-note \{/u);
});

test('binds exact machine-decoded audio while keeping listening acceptance false', async () => {
  assert.equal(config.audio?.durationMs, 9696);
  assert.equal(module.audioTracks?.length, 1);
  assert.equal(module.audioTracks?.[0]?.durationMs, 9696);
  assert.equal(module.audioTracks?.[0]?.sha256,
    '52fe9807f186b5c50ae485bc1d818551290c59204df7d0dda3783b61321d4810');
  assert.deepEqual(module.interactiveAudioAssets, ['en', 'es'].map((language) => ({
    id: `${animationId}-narration`,
    language,
    spokenLanguage: 'undetermined',
    source:
      '/flash-assets/courses/course-g04-l09-ti-004/audio/source-narration-undetermined.mp3?sha256=52fe9807f186b5c50ae485bc1d818551290c59204df7d0dda3783b61321d4810',
    sha256:
      '52fe9807f186b5c50ae485bc1d818551290c59204df7d0dda3783b61321d4810',
  })));
  const candidate = await readFile(
    `${repositoryRoot}apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g04-l09-ti-004/audio/source-narration-undetermined.mp3`,
  );
  assert.equal(candidate.length, 135744);
  assert.equal(sha256(candidate), config.audio?.sourceSha256);
  assert.equal(getG4L9P4FrameState(config, 119, {
    frameDomain: config.frameDomain,
    lang: 'en',
    scenario: config.scenarioId!,
    seed: 4092026,
  }).audioAccepted, false);
});

test('covers feedback, audio start-stop, Replay, navigation, and unmount cleanup contracts', () => {
  const host = createMemoryOnlyLessonHost({
    releaseId: privateBridgeReleaseId,
    releaseMemberIds: [animationId, 'course-g04-l09-ti-005'],
    currentAnimationId: animationId,
    enabledCapabilities: [
      'audio',
      'glossary',
      'navigation',
      'fq-scoring',
      'practice-feedback',
    ],
    mode: 'audit',
    releasePublished: false,
  });
  let state = createG4L9P4InteractionState(config, 4092026);
  const feedbackRequest = createG4L9P4FeedbackHostRequest(config, state, false);
  assert.deepEqual(feedbackRequest, {
    type: 'record-practice-feedback',
    interactionId: `${animationId}-${state.choiceLabel.toLowerCase()}-try1`,
    outcome: 'incorrect',
    branchIndex: state.choiceIndex + 1,
    branchCount: 4,
  });
  assert.equal(host.dispatch(feedbackRequest).status, 'allowed');
  const cueId = `${animationId}-narration`;
  assert.equal(host.dispatch({type: 'play-audio', cueId}).status, 'allowed');
  state = reduceG4L9P4Interaction(config, state, {type: 'audio-request'});
  assert.equal(state.audioLifecycle, 'requested');
  assert.equal(host.snapshot().activeAudioCueId, cueId);

  const replayOrUnmountRequests = createG4L9P4ReplayHostRequests(
    config,
    state,
    cueId,
  );
  assert.deepEqual(replayOrUnmountRequests, [
    {type: 'stop-audio', cueId},
    {type: 'reset-practice-feedback'},
  ]);
  for (const request of replayOrUnmountRequests) {
    assert.equal(host.dispatch(request).status, 'allowed');
  }
  assert.equal(host.snapshot().activeAudioCueId, null);
  assert.equal(host.snapshot().practiceFeedback, null);

  assert.equal(host.dispatch({
    type: 'navigate', targetAnimationId: 'course-g04-l09-ti-005',
  }).status, 'allowed');
  assert.equal(host.dispatch({type: 'play-audio', cueId}).status, 'allowed');
  const navigationUnmountRequests = createG4L9P4ReplayHostRequests(
    config,
    state,
    cueId,
  );
  assert.equal(navigationUnmountRequests[0]?.type, 'stop-audio');
  for (const request of navigationUnmountRequests) host.dispatch(request);
  assert.equal(host.snapshot().activeAudioCueId, null);

  state = reduceG4L9P4Interaction(config, state, {type: 'audio-stop'});
  state = reduceG4L9P4Interaction(config, state, {type: 'replay', replay: 1});
  assert.equal(state.audioLifecycle, 'idle');
  assert.equal(state.tryCount, 0);
  assert.equal(state.networkCalls, 0);
  assert.equal(config.legacyNetworkPolicy, 'deny-by-default');
  assert.equal(config.hostContractSymbols?.length, 20);
  assert.equal(config.hostContractSymbols?.includes('_parent.doGetRndQuest'), false);
});
