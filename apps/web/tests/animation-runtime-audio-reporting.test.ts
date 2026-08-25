import assert from 'node:assert/strict';
import test from 'node:test';

import {reportAudioSoundingTransition} from '../components/animation-runtime';

test('timeline audio reports only real sounding transitions', () => {
  const notifications: boolean[] = [];
  let reported = false;
  const report = (sounding: boolean) => {
    reported = reportAudioSoundingTransition(
      reported,
      sounding,
      (next) => notifications.push(next),
    );
  };

  for (let frame = 0; frame < 120; frame += 1) report(false);
  assert.deepEqual(notifications, [], 'initial silence must not notify');

  report(true);
  for (let frame = 0; frame < 120; frame += 1) report(true);
  report(false);
  for (let frame = 0; frame < 120; frame += 1) report(false);

  assert.deepEqual(notifications, [true, false]);
});

test('timeline audio keeps every cue-draining path observable once', () => {
  const notifications: Array<{event: string; sounding: boolean}> = [];
  let reported = false;
  const report = (event: string, sounding: boolean) => {
    reported = reportAudioSoundingTransition(
      reported,
      sounding,
      (next) => notifications.push({event, sounding: next}),
    );
  };

  for (const event of [
    'cue-stop',
    'ended',
    'error',
    'autoplay-rejection',
    'explicit-stop',
    'replay-transition',
    'module-transition',
    'language-transition',
    'scenario-transition',
    'seed-transition',
    'frame-domain-transition',
  ]) {
    report(`${event}:cue-start`, true);
    report(`${event}:steady-frame`, true);
    report(event, false);
    report(`${event}:repeated-silence`, false);
  }

  assert.deepEqual(
    notifications,
    [
      'cue-stop',
      'ended',
      'error',
      'autoplay-rejection',
      'explicit-stop',
      'replay-transition',
      'module-transition',
      'language-transition',
      'scenario-transition',
      'seed-transition',
      'frame-domain-transition',
    ].flatMap((event) => [
      {event: `${event}:cue-start`, sounding: true},
      {event, sounding: false},
    ]),
  );
});

test('listener identity alone does not create a sounding notification', () => {
  const firstListener: boolean[] = [];
  const secondListener: boolean[] = [];
  let reported = false;

  reported = reportAudioSoundingTransition(
    reported,
    false,
    (next) => firstListener.push(next),
  );
  reported = reportAudioSoundingTransition(
    reported,
    false,
    (next) => secondListener.push(next),
  );

  assert.equal(reported, false);
  assert.deepEqual(firstListener, []);
  assert.deepEqual(secondListener, []);
});
