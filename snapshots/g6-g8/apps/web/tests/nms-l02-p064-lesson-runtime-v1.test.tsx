import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {LessonRuntimeAdapterProps} from '../lib/lesson-runtime-adapter';
import {
  NmsL02P064LessonRuntimeV1, P064_QUIZ_TOOLBAR_STATE,
  cancelP064NativeAudio, createP064LessonControls, reconcileP064NativeAudioNodes,
  setP064NativeAudioVolume,
} from '../components/nms-l02-p064-lesson-runtime-v1';

function fakeAudio() {
  const events: string[] = [];
  let source: string | null = '/flash-assets/g678-local/shared-nms002-l02-p064/question-audio/EA/1';
  const audio = {
    preload: 'auto', volume: 1,
    pause() {events.push('pause');},
    load() {events.push('load');},
    getAttribute(key: string) {assert.equal(key, 'src'); return source;},
    removeAttribute(key: string) {assert.equal(key, 'src'); source = null; events.push('remove');},
    setAttribute(key: string, value: string) {assert.equal(key, 'src'); source = value; events.push('restore');},
  } as unknown as HTMLAudioElement;
  const root = {querySelectorAll: () => [audio]} as unknown as ParentNode;
  return {audio, root, events, get source() {return source;}};
}

test('native audio cancellation aborts a pending load and preserves explicit replay URL', () => {
  const media = fakeAudio();
  cancelP064NativeAudio(media.root);
  assert.deepEqual(media.events, ['pause', 'remove', 'load', 'restore']);
  assert.equal(media.audio.preload, 'none');
  assert.equal(media.source,
    '/flash-assets/g678-local/shared-nms002-l02-p064/question-audio/EA/1');
  setP064NativeAudioVolume(media.root, 2);
  assert.equal(media.audio.volume, 1);
  setP064NativeAudioVolume(media.root, -1);
  assert.equal(media.audio.volume, 0);
  cancelP064NativeAudio(null, [media.audio]); // retained node after unmount
  assert.equal(media.events.filter(value => value === 'load').length, 2);
});

test('host controls never auto-play; Replay returns false for host epoch reset', () => {
  let canceled = 0; let paused = 0;
  const controls = createP064LessonControls(() => {canceled++;}, () => {paused++;});
  controls.setPaused(false);
  controls.narration('play');
  assert.equal(canceled, 0);
  assert.equal(paused, 2);
  controls.setPaused(true);
  controls.narration('stop');
  controls.stop();
  assert.equal(controls.replay(), false);
  assert.equal(canceled, 4);
  assert.deepEqual(P064_QUIZ_TOOLBAR_STATE, {
    audioAvailable: false, frame: 1, frameCount: 1, frameDomain: 'interaction-state',
    fps: 0, narration: 'unavailable', playbackProgress: null, seekAvailable: false,
    stepFrames: 0, transportMode: 'none',
  });
});

test('question replacement aborts detached audio while retaining the active URL', () => {
  const oldQuestion = fakeAudio();
  const nextQuestion = fakeAudio();
  const retained = new Set<HTMLAudioElement>();
  let current = [oldQuestion.audio];
  const root = {querySelectorAll: () => current} as unknown as ParentNode;
  reconcileP064NativeAudioNodes(root, retained);
  assert.deepEqual([...retained], [oldQuestion.audio]);
  current = [nextQuestion.audio];
  reconcileP064NativeAudioNodes(root, retained);
  assert.deepEqual(oldQuestion.events, ['pause', 'remove', 'load', 'restore']);
  assert.deepEqual(nextQuestion.events, []);
  assert.deepEqual([...retained], [nextQuestion.audio]);
  assert.equal(nextQuestion.source,
    '/flash-assets/g678-local/shared-nms002-l02-p064/question-audio/EA/1');
});

test('adapter requires source context and uses hosted score gate, not local score host', () => {
  const base = {
    animationId: 'shared-nms002-l02-p064',
    moduleKey: 'shared-nms002-l02-p064',
    query: {frameDomain: 'sprite-1258', scenario: 'source-quiz-seeded',
      lang: 'en', seed: '9713'},
    uiLanguage: 'es',
    onLessonHostRequest: () => undefined,
  } as unknown as LessonRuntimeAdapterProps;
  const hosted = renderToStaticMarkup(<NmsL02P064LessonRuntimeV1 {...base}/>);
  assert.match(hosted, /data-p064-runtime-status="contextual-candidate"/);
  assert.match(hosted, /data-p064-host-score-gate="initializing"/);
  assert.match(hosted, /data-p064-toolbar-domain="interaction-state"/);
  const blocked = renderToStaticMarkup(<NmsL02P064LessonRuntimeV1 {...base}
    query={{...base.query, seed: '-1'}}/>);
  assert.match(blocked, /data-p064-runtime-status="blocked"/);
});
