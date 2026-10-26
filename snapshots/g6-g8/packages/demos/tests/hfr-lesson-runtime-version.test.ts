import assert from 'node:assert/strict';
import test from 'node:test';
import {LessonRuntime, type LessonPageBinding} from '../src/hfr/lesson-runtime';
import type {PageData} from '../src/hfr/types';

const sha = 'a'.repeat(64);

function page(version: number, ordinal: number): PageData {
  const animationId = `shared-nms002-l07-p${String(ordinal).padStart(3, '0')}`;
  return {
    schema: 'hfr-page/1',
    compiler: 'version-fixture',
    placement: {
      animationId,
      module: 'NMS002',
      course: 'fixture',
      lesson: 7,
      lessonTitle: 'fixture',
      sectionCode: 'RW',
      ordinal,
    },
    source: {path: 'fixture.swf', sha256: sha, bytes: 0, swfVersion: version},
    stage: {width: 800, height: 600, fps: 12, background: [255, 255, 255]},
    module: 'fixture.js',
    dictionary: {},
    root: {frameCount: 2, labels: {}, frames: [[], []]},
    exports: {},
    streams: [],
    stats: {scripts: 0, codeBodies: 0, fallbackBodies: 0, characters: 0, mediaFiles: 0},
  };
}

function binding(data: PageData, seed = 4): LessonPageBinding {
  return {
    lessonKey: 'shared-nms002-l07',
    pageKey: data.placement.animationId,
    sourceSha256: data.source.sha256,
    compiler: data.compiler,
    seed,
  };
}

function vm(lesson: LessonRuntime): {version: number; shell: {get(name: string): unknown; set(name: string, value: unknown): void}} {
  return (lesson as unknown as {rt: {version: number; shell: {get(name: string): unknown; set(name: string, value: unknown): void}}}).rt;
}

test('a later SWF version opens a new movie and leaves the previous VM behind', () => {
  const lesson = new LessonRuntime();
  const first = page(6, 1);
  const opened = lesson.enter(binding(first), first, () => ({}));
  assert.equal(opened.disposition, 'new-lesson');
  const movie = vm(lesson);
  movie.shell.set('KeptMarker', 'old');
  const second = page(6, 2);
  const navigated = lesson.enter(binding(second), second, () => ({}));
  assert.equal(navigated.disposition, 'navigation');
  assert.equal(vm(lesson), movie);
  assert.equal(movie.shell.get('KeptMarker'), 'old');
  const third = page(7, 3);
  const replaced = lesson.enter(binding(third), third, () => ({}));
  assert.equal(replaced.disposition, 'new-lesson');
  const next = vm(lesson);
  assert.notEqual(next, movie);
  assert.equal(next.version, 7);
  assert.equal(next.shell.get('KeptMarker'), undefined);
  assert.equal(lesson.failures.length, 0);
});

test('the same SWF version still rejects a seed change', () => {
  const lesson = new LessonRuntime();
  const first = page(6, 1);
  lesson.enter(binding(first), first, () => ({}));
  const second = page(6, 2);
  assert.throws(() => lesson.enter(binding(second, 9), second, () => ({})), /HFR_LESSON_VM_BINDING_CHANGED/u);
});

for (const changed of ['source', 'compiler', 'seed'] as const) {
  test(`a SWF version change cannot hide a same-page ${changed} change`, () => {
    const lesson = new LessonRuntime();
    const first = page(6, 1);
    const factory = () => ({});
    const opened = lesson.enter(binding(first), first, factory);
    const original = lesson.active(opened);
    const replacement = page(7, 1);
    if (changed === 'source') replacement.source.sha256 = 'b'.repeat(64);
    if (changed === 'compiler') replacement.compiler = 'other-compiler';
    assert.throws(() => lesson.enter(binding(replacement, changed === 'seed' ? 9 : 4), replacement, factory),
      changed === 'seed' ? /HFR_LESSON_VM_BINDING_CHANGED/u : /HFR_REPLAY_ENTRY_BINDING_CHANGED/u);
    assert.equal(lesson.active(opened), original, 'rejected input must leave the current VM active');
    assert.equal(lesson.enter(binding(first), first, factory).disposition, 'replay');
  });
}

for (const changed of ['factory', 'data', 'version-data', 'version-data-and-factory'] as const) {
  test(`same-page replay rejects replacing ${changed}`, () => {
    const lesson = new LessonRuntime();
    const first = page(6, 1);
    const factory = () => ({});
    const opened = lesson.enter(binding(first), first, factory);
    const original = lesson.active(opened);
    const replacement = changed === 'factory' ? first : page(changed.startsWith('version') ? 7 : 6, 1);
    const replacementFactory = changed.endsWith('factory') ? () => ({}) : factory;
    assert.throws(() => lesson.enter(binding(replacement), replacement, replacementFactory), /HFR_REPLAY_PAYLOAD_IDENTITY_CHANGED/u);
    assert.equal(lesson.active(opened), original);
  });
}

test('same-page replay rejects an in-place SWF version change', () => {
  const lesson = new LessonRuntime();
  const data = page(6, 1);
  const factory = () => ({});
  const opened = lesson.enter(binding(data), data, factory);
  const original = lesson.active(opened);
  data.source.swfVersion = 7;
  assert.throws(() => lesson.enter(binding(data), data, factory), /HFR_REPLAY_PAYLOAD_IDENTITY_CHANGED/u);
  assert.equal(lesson.active(opened), original);
});

test('cross-version navigation cannot change the lesson seed', () => {
  const lesson = new LessonRuntime();
  const first = page(6, 1);
  const opened = lesson.enter(binding(first), first, () => ({}));
  const original = lesson.active(opened);
  const next = page(7, 2);
  assert.throws(() => lesson.enter(binding(next, 9), next, () => ({})), /HFR_LESSON_VM_BINDING_CHANGED/u);
  assert.equal(lesson.active(opened), original);
});

test('cross-version navigation invalidates old callbacks before stopping audio and permits new-page replay', () => {
  const lesson = new LessonRuntime();
  const first = page(6, 1);
  const next = page(7, 2);
  const nextFactory = () => ({});
  let stopped = 0;
  let stopping = false;
  let oldCallbackInactive = false;
  let oldTickAccepted = true;
  let reentryBlocked = false;
  const opened = lesson.enter(binding(first), first, () => ({}), {audio: {
    streamFrame: () => null, streamStop: () => {}, playEvent: () => {},
    stopAll() {
      if (!stopping) return;
      stopped++;
      oldCallbackInactive = lesson.active(opened) === null;
      oldTickAccepted = lesson.tick(opened);
      if (oldCallbackInactive) {
        try {lesson.enter(binding(next), next, nextFactory);}
        catch (error) {reentryBlocked = /HFR_LESSON_VM_UNAVAILABLE/u.test(String(error));}
      }
    },
  }});
  const original = lesson.active(opened);
  stopping = true;
  const replaced = lesson.enter(binding(next), next, nextFactory);
  assert.equal(stopped, 1);
  assert.equal(oldCallbackInactive, true);
  assert.equal(oldTickAccepted, false);
  assert.equal(reentryBlocked, true);
  assert.equal(replaced.disposition, 'new-lesson');
  assert.notEqual(lesson.active(replaced), original);
  assert.equal(lesson.active(opened), null);
  assert.equal(lesson.release(opened), false);
  assert.equal(lesson.tick(opened), false);
  const replayed = lesson.enter(binding(next), next, nextFactory);
  assert.equal(replayed.disposition, 'replay');
  assert.equal(lesson.active(replaced), null);
  assert.ok(lesson.active(replayed));
});
