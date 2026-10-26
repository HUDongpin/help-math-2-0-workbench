import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P054_CARDS} from '../src/generated/nms-l02-p054-cards-v1';
import {finishP054Feedback, initialP054State, selectP054Card} from
  '../src/nms-l02-p054-matching-state-candidate';
import {P054FeedbackClock, P054FeedbackSession, P054ProductBoardV1,
  p054FeedbackAudioStartFrame, type P054FeedbackDependencies,
  type P054FeedbackScheduler} from
  '../src/nms-l02-p054-product-board-v1';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}

class FakeClip {
  currentTime = 0;
  volume = 1;
  preload = '';
  onplay: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  paused = false;
  loaded = 0;
  removed = false;
  nextPlay: Promise<void> = Promise.resolve();
  pause() {this.paused = true; this.onpause?.();}
  load() {this.loaded++;}
  removeAttribute(name: string) {
    assert.equal(name, 'src'); this.removed = true;
  }
  play() {this.paused = false; this.onplay?.(); return this.nextPlay;}
}

function fakeAudio(load: P054FeedbackDependencies['load']) {
  const clips: FakeClip[] = [];
  const urls: string[] = [];
  const revoked: string[] = [];
  const dependencies: P054FeedbackDependencies = {
    load,
    createUrl: () => {const url = `blob:test-${urls.length}`; urls.push(url); return url;},
    revokeUrl: url => {revoked.push(url);},
    createAudio: () => {
      const clip = new FakeClip(); clips.push(clip);
      return clip as unknown as HTMLAudioElement;
    },
  };
  return {dependencies, clips, urls, revoked};
}

test('pending source feedback fetch is aborted on stop and stale resolution cannot create or play media',
  async () => {
    const pending = deferred<Blob>();
    const signals: AbortSignal[] = [];
    let round = 0;
    const media = fakeAudio((_kind, signal) => {
      signals.push(signal);
      return round === 0 ? pending.promise : Promise.resolve(new Blob(['audio']));
    });
    const states: string[] = [];
    const session = new P054FeedbackSession(media.dependencies,
      (status) => states.push(status));
    const first = session.start();
    assert.equal(session.status, 'loading');
    session.stop();
    assert.equal(signals.length, 2);
    assert.ok(signals.every(signal => signal.aborted));
    pending.resolve(new Blob(['stale']));
    await first;
    assert.equal(session.status, 'idle');
    assert.equal(media.urls.length, 0);
    assert.equal(media.clips.length, 0);
    assert.deepEqual(states, ['loading', 'idle']);

    round++;
    await session.start();
    assert.equal(session.status, 'ready');
    assert.equal(media.clips.length, 2);
    assert.equal(await session.play('correct'), true);
    assert.equal(session.playing, true);
    session.stop();
    assert.equal(session.playing, false);
    assert.ok(media.clips.every(clip => clip.removed && clip.loaded === 1 && clip.paused));
    assert.deepEqual(media.revoked, media.urls);
    await session.start();
    assert.equal(await session.resume('correct'), true);
    assert.equal(session.playing, true);
    assert.equal(media.clips.length, 4);
    session.close();
  });

test('unmount closes resource session and a late play promise cannot revive it', async () => {
  const media = fakeAudio(() => Promise.resolve(new Blob(['audio'])));
  const states: string[] = [];
  const session = new P054FeedbackSession(media.dependencies,
    (status, playing) => states.push(`${status}:${playing}`));
  await session.start();
  session.setVolume(2);
  assert.deepEqual(media.clips.map(clip => clip.volume), [1, 1]);
  session.setVolume(-4);
  assert.deepEqual(media.clips.map(clip => clip.volume), [0, 0]);
  const pending = deferred<void>();
  media.clips[0].nextPlay = pending.promise;
  const play = session.play('correct');
  const countBeforeClose = states.length;
  session.close();
  pending.resolve();
  assert.equal(await play, false);
  assert.equal(states.length, countBeforeClose + 1); // close publishes idle once.
  assert.equal(session.status, 'idle');
  assert.ok(media.clips.every(clip => clip.removed && clip.onplay === null));
  assert.deepEqual(media.revoked, media.urls);
  await session.start();
  assert.equal(media.urls.length, 2); // close forbids further network/resource work.
});

test('unmount during pending loads aborts both requests without allocating audio',
  async () => {
    const pending = deferred<Blob>();
    const signals: AbortSignal[] = [];
    const media = fakeAudio((_kind, signal) => {
      signals.push(signal);
      return pending.promise;
    });
    const session = new P054FeedbackSession(media.dependencies, () => {});
    const loading = session.start();
    session.close();
    assert.ok(signals.every(signal => signal.aborted));
    pending.resolve(new Blob(['late']));
    await loading;
    assert.equal(media.urls.length, 0);
    assert.equal(media.clips.length, 0);
  });

test('pause invalidates a pending play promise and old-kind pause cannot hide new playback',
  async () => {
    const media = fakeAudio(() => Promise.resolve(new Blob(['audio'])));
    const session = new P054FeedbackSession(media.dependencies, () => {});
    await session.start();
    const pending = deferred<void>();
    media.clips[0].nextPlay = pending.promise;
    const first = session.play('correct');
    session.pause();
    pending.resolve();
    assert.equal(await first, false);
    assert.equal(session.playing, false);
    assert.equal(await session.play('wrong'), true);
    assert.equal(session.playing, true);
    media.clips[0].onpause?.();
    assert.equal(session.playing, true);
    session.close();
  });

function fakeClock() {
  let next = 1;
  const queued = new Map<number, () => void>();
  const scheduler: P054FeedbackScheduler = {
    set: (callback, delay) => {
      assert.equal(delay, 1000 / 12);
      const id = next++;
      queued.set(id, callback);
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clear: handle => {queued.delete(handle as unknown as number);},
  };
  const tick = () => {
    const first = queued.entries().next().value;
    assert.ok(first, 'expected one scheduled source-frame tick');
    queued.delete(first[0]); first[1]();
  };
  return {scheduler, tick, queued};
}

test('source feedback sprites advance exactly 12 fps from frame 2 to 27 or 31', () => {
  assert.equal(p054FeedbackAudioStartFrame('correct'), 2);
  assert.equal(p054FeedbackAudioStartFrame('wrong'), 3);
  for (const [kind, terminal] of [['correct', 27], ['wrong', 31]] as const) {
    const timer = fakeClock();
    const frames: Array<number | null> = [];
    let finished = 0;
    const clock = new P054FeedbackClock(frame => frames.push(frame),
      () => finished++, timer.scheduler);
    clock.start(kind);
    assert.equal(clock.frame, 2);
    for (let frame = 3; frame <= terminal; frame++) {
      timer.tick();
      assert.equal(clock.frame, frame);
      assert.equal(finished, frame === terminal ? 1 : 0);
    }
    assert.equal(timer.queued.size, 0);
    assert.deepEqual(frames, [null, ...Array.from({length: terminal - 1},
      (_, index) => index + 2)]);
  }
});

test('pause and stop hold source feedback frame; explicit resume continues one clock', () => {
  const timer = fakeClock();
  const frames: Array<number | null> = [];
  let finished = 0;
  const clock = new P054FeedbackClock(frame => frames.push(frame),
    () => finished++, timer.scheduler);
  clock.start('correct');
  timer.tick();
  assert.equal(clock.frame, 3);
  clock.pause();
  assert.equal(timer.queued.size, 0);
  clock.resume();
  assert.equal(timer.queued.size, 1);
  timer.tick();
  assert.equal(clock.frame, 4);
  clock.stop();
  assert.equal(clock.frame, null);
  assert.equal(timer.queued.size, 0);
  clock.start('wrong');
  for (let frame = 3; frame <= 31; frame++) timer.tick();
  assert.equal(finished, 1);
  assert.equal(frames.at(-1), 31);
});

test('both source levels score +10/−2 and reach unresolved six-pair terminal; remount resets', () => {
  for (const level of [1, 2] as const) {
    const cards = P054_CARDS.filter(card => card.level === level);
    let state = initialP054State(level);
    state = selectP054Card(state, cards, 'Mc1_1');
    state = selectP054Card(state, cards, 'Mc2_2');
    assert.equal(state.phase, 'feedback-wrong');
    assert.equal(state.score, -2);
    state = finishP054Feedback(state);
    assert.equal(state.phase, 'selecting');
    for (let pair = 1; pair <= 6; pair++) {
      state = selectP054Card(state, cards, `Mc${pair}_1`);
      state = selectP054Card(state, cards, `Mc${pair}_2`);
      assert.equal(state.score, pair * 10 - 2);
      state = finishP054Feedback(state);
    }
    assert.equal(state.phase, 'terminal-unresolved');
    assert.equal(state.matchedPairIds.length, 6);
    assert.equal(state.score, 58);
    assert.equal(state.quizSection, false);
    const remounted = initialP054State(level);
    assert.equal(remounted.score, 0);
    assert.equal(remounted.phase, 'selecting');
    assert.deepEqual(remounted.matchedPairIds, []);
  }
});

test('product board exposes source cards, help, score and an unresolved terminal policy', () => {
  for (const level of [1, 2] as const) {
    const html = renderToStaticMarkup(<P054ProductBoardV1 level={level}
      uiLanguage={level === 1 ? 'en' : 'es'}/>);
    assert.equal((html.match(/data-source-instance=/gu) ?? []).length, 12);
    assert.match(html, /data-p054-phase="selecting"/u);
    assert.match(html, /data-p054-score="0"/u);
    assert.match(html, /data-p054-matched-pairs="0"/u);
    assert.match(html, /data-source-text-id="97"/u);
    assert.match(html, /data-source-text-id="100"/u);
    assert.doesNotMatch(html, /Continue after feedback/u);
  }
});

test('default browser scheduler calls timers with the Window receiver', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const scheduled: Array<() => void> = [];
  const cleared: number[] = [];
  const fakeWindow = {
    setTimeout(callback: () => void, delay: number) {
      assert.equal(this, fakeWindow, 'browser timers require the Window receiver');
      assert.equal(delay, 1000 / 12);
      scheduled.push(callback);
      return scheduled.length;
    },
    clearTimeout(handle: number) {
      assert.equal(this, fakeWindow, 'browser timer cancellation retains Window');
      cleared.push(handle);
    },
  };
  Object.defineProperty(globalThis, 'window', {value: fakeWindow, configurable: true});
  try {
    const frames: Array<number | null> = [];
    const clock = new P054FeedbackClock(frame => frames.push(frame), () => {});
    clock.start('correct');scheduled[0]();clock.pause();
    assert.deepEqual(frames, [null, 2, 3]);
    assert.deepEqual(cleared, [2]);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
