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
import {createMemoryOnlyLessonHost} from '../src/lesson-host-contract';
import animationModule from '../src/modules/course-g04-l09-gs-002';
import {
  buildCourseG04L09Gs002QuestionOrder,
  COURSE_G04_L09_GS_002_MOVIE,
  COURSE_G04_L09_GS_002_RUNTIME,
  COURSE_G04_L09_GS_002_SCENARIOS,
  COURSE_G04_L09_GS_002_SOURCE,
  getCourseG04L09Gs002FrameState,
  normalizeCourseG04L09Gs002Frame,
} from '../src/timelines/course-g04-l09-gs-002';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const animationId = 'course-g04-l09-gs-002';

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('reuses the exact GS002 module/candidate while moving it from prototype to private Current-JS', async () => {
  assert.deepEqual(animationModuleRegistration(animationId), {
    maturity: 'private-current-js',
    scope: 'private-engineering',
    calibrationId: 'g4-l9-p4-representative-slice-14-v1',
  });
  const registeredModule = await loadAnimationModule(animationId);
  assert(registeredModule);
  assert.equal(registeredModule.key, animationModule.key);
  assert.equal(registeredModule.Renderer, animationModule.Renderer);
  assert.equal(registeredModule.maturity, 'private-current-js');
  assert.equal(animationModule.maturity, 'private-current-js');
  assert.equal(animationModule.runtime, COURSE_G04_L09_GS_002_RUNTIME);
  assert.equal(animationModule.movie, COURSE_G04_L09_GS_002_MOVIE);
  assert.equal(animationModule.playbackEndFrame, 653);
  assert.deepEqual(animationModule.playbackEndFrameByDomain, {
    root: 10,
    'sprite-787': 653,
  });
  assert.equal(
    sha256(await readFile(
      `${repositoryRoot}${COURSE_G04_L09_GS_002_SOURCE.externalSpanishAudio}`,
    )),
    COURSE_G04_L09_GS_002_SOURCE.externalSpanishAudioSha256,
  );
  assert.equal(animationModule.audioCues.length, 0);
  assert.equal(animationModule.audioTracks, undefined);
});

test('closes frames 642-653 as a deterministic engineering state without claiming original runtime', () => {
  assert.equal(normalizeCourseG04L09Gs002Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L09Gs002Frame(999), 653);
  assert.equal(normalizeCourseG04L09Gs002Frame(999, 'root'), 10);
  const start = getCourseG04L09Gs002FrameState(642, {
    frame: 642,
    frameDomain: 'sprite-787',
    scenario: 'gs002-advanced-product',
    lang: 'en',
    seed: 73,
  });
  assert.equal(start.status, 'ready');
  assert.equal(start.phase, 'start');
  for (let frame = 643; frame <= 652; frame += 1) {
    const question = getCourseG04L09Gs002FrameState(frame, {
      frame,
      frameDomain: 'sprite-787',
      scenario: 'gs002-advanced-product',
      lang: 'en',
      seed: 73,
    });
    assert.equal(question.status, 'ready');
    assert.equal(question.phase, 'question');
    assert.equal(question.questionIndex, frame - 643);
    assert.equal(question.scoringResolved, true);
    assert.equal(question.correctFeedbackResolved, true);
    assert.equal(question.wrongFeedbackResolved, true);
    assert.equal(question.avm1Executed, false);
    assert.equal(question.originalRuntimeValidated, false);
    assert.equal(question.fidelityAccepted, false);
    assert.equal(question.audioAccepted, false);
    assert.equal(question.networkCalls, 0);
  }
  const final = getCourseG04L09Gs002FrameState(653, {
    frame: 653,
    frameDomain: 'sprite-787',
    scenario: 'gs002-advanced-product',
    lang: 'en',
    seed: 73,
  });
  assert.equal(final.phase, 'final');
  assert.equal(final.finalResolved, true);
  assert.equal(final.replayResolved, true);
  assert.equal(final.glossaryIntentResolved, true);
  assert.equal(final.courseRoutingIntentResolved, true);
});

test('Q1-Q10 order is seeded, stable, complete, and changes for another seed', () => {
  const first = buildCourseG04L09Gs002QuestionOrder(4092026);
  const same = buildCourseG04L09Gs002QuestionOrder(4092026);
  const another = buildCourseG04L09Gs002QuestionOrder(4092027);
  assert.deepEqual(first, same);
  assert.deepEqual([...first].sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);
  assert.notDeepEqual(first, another);
});

test('keeps Spanish visual/audio and invalid scenario requests fail closed', () => {
  const spanish = getCourseG04L09Gs002FrameState(642, {
    frame: 642,
    frameDomain: 'sprite-787',
    scenario: 'gs002-advanced-product',
    lang: 'es',
    seed: 0,
  });
  assert.equal(spanish.status, 'blocked');
  assert.equal(spanish.blocker, 'spanish-visual-and-audio-not-source-proven');
  assert.equal(spanish.visualLocalizationStatus, 'english-source-only-spanish-unresolved');
  const mismatch = getCourseG04L09Gs002FrameState(1, {
    frame: 1,
    frameDomain: 'root',
    scenario: 'gs002-advanced-product',
    lang: 'en',
    seed: 0,
  });
  assert.equal(mismatch.blocker, 'frame-domain-scenario-mismatch');
});

test('declares Q1-Q10, feedback, Final, Repeat/Replay, glossary and course intents in the renderer', () => {
  const state = getCourseG04L09Gs002FrameState(642, {
    frame: 642,
    frameDomain: 'sprite-787',
    scenario: 'gs002-advanced-product',
    lang: 'en',
    seed: 4092026,
  });
  const markup = renderToStaticMarkup(createElement(animationModule.Renderer, {
    audioEnabled: true,
    frame: 642,
    frameDomain: 'sprite-787',
    scenario: 'gs002-advanced-product',
    lang: 'en',
    uiLanguage: 'en',
    seed: 4092026,
    state,
  }));
  assert.match(markup, /Q1 \/ Q10/);
  assert.match(markup, /Option A/);
  assert.match(markup, /Glossary/);
  assert.match(markup, /Course/);
  assert.match(markup, /Replay/);
  assert.match(markup, /Blocked report/);
  assert.match(markup, /data-network-calls="0"/);
  assert.match(markup, /data-original-runtime-validated="false"/);
  assert.deepEqual(
    animationModule.scenarios.map(({id}) => id),
    [...COURSE_G04_L09_GS_002_SCENARIOS],
  );
});

test('typed modern host scores in memory and denies all legacy reporting without a network adapter', () => {
  const host = createMemoryOnlyLessonHost({
    releaseId: 'private-g4-l9-p4-representative-slice-v1',
    releaseMemberIds: [animationId],
    currentAnimationId: animationId,
    enabledCapabilities: ['navigation', 'glossary', 'fq-scoring', 'practice-feedback'],
    mode: 'audit',
    releasePublished: false,
  });
  assert.equal(host.dispatch({
    type: 'record-fq-score',
    questionId: 'gs002-q1',
    correct: true,
    pointsAwarded: 1,
    pointsPossible: 1,
  }).status, 'allowed');
  assert.equal(host.snapshot().fqScore.pointsAwarded, 1);
  for (const operation of ['getURL', 'report', 'final-quiz-post'] as const) {
    const decision = host.dispatch({type: 'legacy', operation});
    assert.equal(decision.status, 'blocked');
    if (decision.status === 'blocked') {
      assert.equal(decision.code, 'legacy-operation-blocked');
    }
  }
  assert.equal(host.snapshot().storage, 'memory-only');
  assert.equal(host.snapshot().storesPersonalData, false);
});
