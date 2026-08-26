import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, stat} from 'node:fs/promises';
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
  expectedG4L9P4Option,
  g4L9P4DragOutcome,
  getG4L9P4FrameState,
  reduceG4L9P4Interaction,
} from '../src/g4-l9-p4-state-machines';
import {createMemoryOnlyLessonHost} from '../src/lesson-host-contract';
import module from '../src/modules/course-g04-l09-ti-007';
import {COURSE_G04_L09_TI_007_CONFIG as config} from '../src/timelines/course-g04-l09-ti-007';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const animationId = 'course-g04-l09-ti-007';
const calibrationId = 'g4-l9-p5-f08-occurrence-32-stress-v1';
const releaseId = 'private-g4-l9-p5-f08-occurrence-32-stress-v1';
const coreActionDigest =
  'c3188e59250e977dee0638de3ce00e8dc50850649e036e3d7018d0cc0b448e57';

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('binds occurrence 32 to one unique source identity and its own private calibration', async () => {
  assert.deepEqual(animationModuleRegistration(animationId), {
    maturity: 'private-current-js',
    scope: 'private-engineering',
    calibrationId,
  });
  assert.equal((await loadAnimationModule(animationId))?.key, animationId);
  assert.equal(module.key, animationId);
  assert.equal(config.placementId, 'g04-l09-placement-032');
  assert.equal(config.sourceOccurrence, 32);
  assert.equal(config.sourceSwfPath, 'HELP_COURSES/ELMGR4/L9/TI/L9TI07.swf');
  assert.equal(config.sourceSwfSha256,
    '469e14b63de51729334d56c1f51aba732968113b2630ab5b05e702fdc1979c25');
  assert.equal(config.sourceSwfBytes, 119871);
  assert.equal(config.frameDomain, 'sprite-149');
  assert.equal(config.frameCount, 189);
  assert.equal(config.lane, 'advanced-manual');
  assert.equal(config.f08ScaleOut, false);
});

test('freezes the exact five-file source closure and reproduced core-action equivalence projection', async () => {
  const freeze = JSON.parse(await readFile(
    `${repositoryRoot}catalog/g4-l9-p5-f08-occurrence-32-stress-freeze-v1.json`,
    'utf8',
  ));
  const audit = JSON.parse(await readFile(
    `${repositoryRoot}migrations/course-g04-l09-ti-007/audit/p5-f08-occurrence-32-equivalence.json`,
    'utf8',
  ));
  assert.equal(freeze.exactSourceClosure.fileCount, 5);
  assert.equal(freeze.exactSourceClosure.totalBytes, 1185928);
  assert.equal(freeze.exactSourceClosure.projection.bytes, 553);
  assert.equal(freeze.exactSourceClosure.projection.sha256,
    '020e7f49fe0d9b9663690051472bc9d130f1ec9df0caacc71e4c9ecfab227a65');
  let projection = '';
  for (const file of [...freeze.exactSourceClosure.files].sort(
    (left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  )) {
    const sourcePath = `${repositoryRoot}source-assets/flash/HELP MATH_ORIGINAL FILES/${file.path}`;
    const bytes = await readFile(sourcePath);
    assert.equal((await stat(sourcePath)).size, file.bytes, file.path);
    assert.equal(sha256(bytes), file.sha256, file.path);
    projection += `${file.path}\0${file.bytes}\0${file.sha256}\0`;
  }
  assert.equal(Buffer.byteLength(projection), 553);
  assert.equal(sha256(projection), freeze.exactSourceClosure.projection.sha256);
  assert.equal(audit.projectionDefinition.coreSelection,
    "exclude an action when any descendant value attribute equals 'DoHyperLinks'");
  assert.equal(audit.coreActionProjection.occurrence30.nonGlossaryCoreActionCount, 44);
  assert.equal(audit.coreActionProjection.occurrence32.nonGlossaryCoreActionCount, 44);
  assert.equal(audit.coreActionProjection.occurrence30.multisetSha256, coreActionDigest);
  assert.equal(audit.coreActionProjection.occurrence32.multisetSha256, coreActionDigest);
  assert.equal(audit.coreActionProjection.exactSortedHashMultiset.length, 44);
  assert.equal(audit.coreActionProjection.identical, true);
  assert.equal(audit.admission, 'not-exact-equivalence-admission');
});

test('keeps deterministic seed, random order, and doGetRndQuest adapter semantics', () => {
  assert.equal(config.randomQuestionAdapter,
    'doGetRndQuest-maintained-seeded-order-v1');
  for (const seed of [-1, 0, 1, 4092026, 2147483646]) {
    const first = buildG4L9P4SeededOrder(9, seed);
    const second = buildG4L9P4SeededOrder(9, seed);
    assert.deepEqual(first, second, String(seed));
    assert.deepEqual([...first].sort((a, b) => a - b), [0,1,2,3,4,5,6,7,8]);
  }
  assert.notDeepEqual(
    buildG4L9P4SeededOrder(9, 4092026),
    buildG4L9P4SeededOrder(9, 4092027),
  );
});

test('maps all six exact drag instances and completes question-feedback-score-final-Replay', () => {
  assert.deepEqual(config.dragBindings, [
    {sourceInstance: 'Scr1', outcome: 'correct'},
    {sourceInstance: 'Scr2', outcome: 'correct'},
    {sourceInstance: 'Scr3', outcome: 'correct'},
    {sourceInstance: 'Scr4', outcome: 'incorrect'},
    {sourceInstance: 'Scr5', outcome: 'incorrect'},
    {sourceInstance: 'Scr6', outcome: 'correct'},
  ]);
  for (const binding of config.dragBindings) {
    assert.equal(g4L9P4DragOutcome(config, binding.sourceInstance), binding.outcome);
  }
  assert.equal(g4L9P4DragOutcome(config, 'Scr7'), undefined);

  let state = createG4L9P4InteractionState(config, 4092026);
  for (let question = 0; question < config.questionCount; question += 1) {
    const expected = expectedG4L9P4Option(config, question, state.seed);
    const answer = question === 1 ? (expected + 1) % 3 : expected;
    state = reduceG4L9P4Interaction(config, state, {type: 'answer', option: answer});
    assert.equal(state.phase, 'feedback');
    assert.equal(state.feedback, question === 1 ? 'incorrect' : 'correct');
    state = reduceG4L9P4Interaction(config, state, {type: 'next'});
  }
  assert.equal(state.phase, 'final');
  assert.equal(state.score, 2);
  assert.equal(state.attempts, 3);
  assert.equal(state.networkCalls, 0);
  state = reduceG4L9P4Interaction(config, state, {type: 'replay', replay: 1});
  assert.equal(state.phase, 'question');
  assert.equal(state.questionIndex, 0);
  assert.equal(state.score, 0);
  assert.equal(state.attempts, 0);
  assert.equal(state.feedback, 'idle');
});

test('resolves 19 source handlers to 16 glossary entries with only the bound typo alias', () => {
  assert.equal(config.glossaryHandlers?.length, 19);
  assert.equal(new Set(config.glossaryHandlers?.map(({entryId}) => entryId)).size, 16);
  const aliases = config.glossaryHandlers?.filter(
    ({resolution}) => resolution === 'explicit-source-bound-alias',
  );
  assert.deepEqual(aliases, [{
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
  assert.equal((markup.match(/aria-label="Glossary /gu) ?? []).length, 19);
  assert.match(markup, /aria-label="Glossary 2: Mathematical aentence"/u);
  assert.match(markup, /data-drag-correct="Scr1,Scr2,Scr3,Scr6"/u);
  assert.match(markup, /data-drag-incorrect="Scr4,Scr5"/u);
});

test('uses the exact source MP3 duration and keeps audio acceptance false', async () => {
  assert.equal(config.audio?.durationMs, 21648);
  assert.equal(module.audioTracks?.length, 1);
  assert.equal(module.audioTracks?.[0]?.durationMs, 21648);
  assert.equal(module.audioTracks?.[0]?.sha256,
    '2f5e5d447f2659acec7a67ce8cc4ced1875ce99f5a9385227b1ec4ee0fab4d8c');
  assert.deepEqual(module.interactiveAudioAssets, ['en', 'es'].map((language) => ({
    id: `${animationId}-narration`,
    language,
    spokenLanguage: 'undetermined',
    source:
      '/flash-assets/courses/course-g04-l09-ti-007/audio/source-narration-undetermined.mp3?sha256=2f5e5d447f2659acec7a67ce8cc4ced1875ce99f5a9385227b1ec4ee0fab4d8c',
    sha256:
      '2f5e5d447f2659acec7a67ce8cc4ced1875ce99f5a9385227b1ec4ee0fab4d8c',
  })));
  assert.notEqual(
    module.audioTracks?.[0]?.durationMs,
    Math.round((config.frameCount / config.fps) * 1000),
  );
  const candidate = await readFile(
    `${repositoryRoot}apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g04-l09-ti-007/audio/source-narration-undetermined.mp3`,
  );
  assert.equal(candidate.length, 303072);
  assert.equal(sha256(candidate), config.audio?.sourceSha256);
  assert.equal(getG4L9P4FrameState(config, 189, {
    frameDomain: config.frameDomain,
    lang: 'en',
    scenario: config.scenarioId!,
    seed: 4092026,
  }).audioAccepted, false);
});

test('preserves the identical 21-symbol host boundary with memory-only intents and zero network permission', () => {
  assert.equal(config.hostContractSymbols?.length, 21);
  assert.equal(new Set(config.hostContractSymbols).size, 21);
  assert.ok(config.hostContractSymbols?.includes('_parent.doGetRndQuest'));
  assert.ok(config.hostContractSymbols?.includes('_root.DoHyperLinks'));
  assert.ok(module.lessonHost?.capabilities.includes('navigation'));
  const host = createMemoryOnlyLessonHost({
    releaseId,
    releaseMemberIds: [animationId],
    currentAnimationId: animationId,
    enabledCapabilities: [
      'audio',
      'fq-scoring',
      'glossary',
      'navigation',
      'practice-feedback',
    ],
    mode: 'audit',
    releasePublished: false,
  });
  assert.equal(host.dispatch({type: 'navigate', targetAnimationId: animationId}).status,
    'allowed');
  assert.equal(host.dispatch({type: 'open-glossary', entryId: 'sentence'}).status,
    'allowed');
  assert.equal(host.dispatch({type: 'play-audio', cueId: `${animationId}-narration`}).status,
    'allowed');
  for (const operation of ['getURL', 'report'] as const) {
    const decision = host.dispatch({type: 'legacy', operation});
    assert.equal(decision.status, 'blocked');
    if (decision.status === 'blocked') {
      assert.equal(decision.code, 'legacy-operation-blocked');
    }
  }
  assert.equal(host.snapshot().storage, 'memory-only');
  assert.equal(host.snapshot().storesPersonalData, false);
  assert.equal(config.legacyNetworkPolicy, 'deny-by-default');
});

test('uses one-based practice branches and clears practice/audio host state for both Replay paths', () => {
  const host = createMemoryOnlyLessonHost({
    releaseId,
    releaseMemberIds: [animationId],
    currentAnimationId: animationId,
    enabledCapabilities: [
      'audio',
      'fq-scoring',
      'glossary',
      'navigation',
      'practice-feedback',
    ],
    mode: 'audit',
    releasePublished: false,
  });
  let state = createG4L9P4InteractionState(config, 4092026);
  const firstRequest = createG4L9P4FeedbackHostRequest(config, state, true);
  assert.deepEqual(firstRequest, {
    type: 'record-practice-feedback',
    interactionId: `${animationId}-q1`,
    outcome: 'correct',
    branchIndex: 1,
    branchCount: 3,
  });
  assert.equal(host.dispatch(firstRequest).status, 'allowed');
  assert.equal(host.snapshot().practiceFeedback?.branchIndex, 1);
  assert.equal(host.dispatch({type: 'reset-practice-feedback'}).status, 'allowed');
  state = reduceG4L9P4Interaction(config, state, {type: 'answer', option:
    expectedG4L9P4Option(config, state.questionIndex, state.seed)});
  state = reduceG4L9P4Interaction(config, state, {type: 'next'});

  const secondRequest = createG4L9P4FeedbackHostRequest(config, state, false);
  assert.equal(secondRequest.type, 'record-practice-feedback');
  if (secondRequest.type === 'record-practice-feedback') {
    assert.equal(secondRequest.branchIndex, 2);
    assert.equal(secondRequest.interactionId, `${animationId}-q2`);
  }
  assert.equal(host.dispatch(secondRequest).status, 'allowed');
  const cueId = `${animationId}-narration`;
  assert.equal(host.dispatch({type: 'play-audio', cueId}).status, 'allowed');
  state = reduceG4L9P4Interaction(config, state, {type: 'audio-request'});
  state = reduceG4L9P4Interaction(config, state, {type: 'answer', option:
    (expectedG4L9P4Option(config, state.questionIndex, state.seed) + 1) % 3});
  const replayRequests = createG4L9P4ReplayHostRequests(config, state, cueId);
  assert.deepEqual(replayRequests, [
    {type: 'stop-audio', cueId},
    {type: 'reset-practice-feedback'},
  ]);
  for (const request of replayRequests) {
    assert.equal(host.dispatch(request).status, 'allowed');
  }
  assert.equal(host.snapshot().practiceFeedback, null);
  assert.equal(host.snapshot().activeAudioCueId, null);

  state = reduceG4L9P4Interaction(config, state, {type: 'replay', replay: 1});
  const replayedFirstRequest = createG4L9P4FeedbackHostRequest(config, state, true);
  assert.equal(host.dispatch(replayedFirstRequest).status, 'allowed');
  assert.equal(host.snapshot().practiceFeedback?.branchIndex, 1);

  const finalQuizConfig = Object.freeze({...config, behavior: 'final-quiz' as const});
  assert.deepEqual(
    createG4L9P4ReplayHostRequests(
      finalQuizConfig,
      createG4L9P4InteractionState(finalQuizConfig, 4092026),
    ),
    [{type: 'reset-fq-score'}],
  );
});
