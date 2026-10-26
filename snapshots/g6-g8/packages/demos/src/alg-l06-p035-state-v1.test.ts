import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {P035_FEEDBACK, P035_SOURCE, p035AudioIntent, p035InitialState, p035Reduce,
  type P035Event, type P035State} from './alg-l06-p035-state-v1.js';

test('physical frame-145 placement and exported text bind B/51 to right button 55', () => {
  const root = 'output/alg-l06-p035-source-triage-20261001-v1/';
  const xml = readFileSync(root + 'source-structure.xml', 'utf8');
  for (const [instance, button] of [['AnsBtn1', 54], ['AnsBtn2', 55],
    ['AnsBtn3', 54], ['AnsBtn4', 54]] as const)
    assert.match(xml, new RegExp(`<PlaceObject2[^>]*objectID="${button}"[^>]*name="${instance}"`));
  const texts = [[45, 'A'], [46, '50'], [51, 'B'], [52, '51'],
    [48, 'C'], [49, '225'], [42, 'D'], [43, '226']] as const;
  for (const [id, expected] of texts)
    assert.equal(readFileSync(root + `ffdec-export/texts/${id}.txt`, 'utf8').trim(), expected);
  assert.match(readFileSync(root + 'ffdec-export/scripts/DefineButton2_55/BUTTONCONDACTION on(release).as', 'utf8'), /showRightFeed\(\)/);
  assert.match(readFileSync(root + 'ffdec-export/scripts/DefineButton2_54/BUTTONCONDACTION on(release).as', 'utf8'), /showWrongFeed\(\)/);
});

function step(state: P035State, event: P035Event): P035State {
  const result = p035Reduce(state, event);
  assert.equal(result.accepted, true, `${event.type}: ${result.reason}`);
  return result.state;
}
function atQuestion(): P035State {
  let state = p035InitialState();
  state = step(state, {type: 'play-main'});
  state = step(state, {type: 'advance-main', frame: 144});
  assert.equal(state.mainPlaying, true);
  state = step(state, {type: 'advance-main', frame: 150});
  assert.equal(state.mainFrame, 145);
  assert.equal(state.mainPlaying, false);
  assert.equal(state.quizSection, true);
  assert.equal(p035AudioIntent(state), null);
  return state;
}
function wrong(state: P035State, choice: 'A' | 'C' | 'D', characterId: 80 | 95 | 126): P035State {
  state = step(state, {type: 'choose', choice});
  assert.equal(state.pendingHostCall, '_root.showWrongFeed()');
  assert.equal(state.quizButtonsEnabled, false);
  state = step(state, {type: 'resolve-feedback', characterId});
  const token = state.feedback!.token;
  assert.equal(p035AudioIntent(state), null);
  state = step(state, {type: 'advance-feedback', frame: 2, token});
  assert.equal(p035AudioIntent(state)!.owner, 'feedback');
  const spec = P035_FEEDBACK[characterId];
  state = step(state, {type: 'advance-feedback', frame: spec.end, token});
  assert.equal(state.phase, 'feedback-held');
  assert.equal(state.feedback!.frame, spec.hold);
  assert.equal(p035AudioIntent(state), null);
  assert.equal(p035Reduce(state, {type: 'advance-feedback', frame: spec.end, token}).accepted, false);
  const close = p035Reduce(state, {type: 'close-wrong', token});
  assert.equal(close.source, `DefineButton2_${spec.closeButton}/BUTTONCONDACTION on(release).as`);
  state = close.state;
  assert.equal(state.feedback!.frame, spec.close);
  state = step(state, {type: 'advance-feedback', frame: spec.end, token});
  assert.equal(state.feedback, null);
  assert.equal(p035Reduce(state, {type: 'close-wrong', token}).accepted, false);
  return state;
}

test('authored A/C/D wrong scripts use first then second text and only terminal feedback increments attempts', () => {
  let state = atQuestion();
  state = step(state, {type: 'choose', choice: 'A'});
  assert.equal(state.wrongFeedText, P035_SOURCE.wrongFirst);
  assert.equal(state.quizTryCount, 0);
  state = step(state, {type: 'resolve-feedback', characterId: 80});
  const firstToken = state.feedback!.token;
  state = step(state, {type: 'advance-feedback', frame: 20, token: firstToken});
  assert.equal(state.quizTryCount, 0);
  state = step(state, {type: 'close-wrong', token: firstToken});
  state = step(state, {type: 'advance-feedback', frame: 29, token: firstToken});
  assert.equal(state.phase, 'question');
  assert.equal(state.quizTryCount, 1);
  assert.equal(state.mainFrame, 145);
  assert.equal(state.quizButtonsEnabled, true);
  state = step(state, {type: 'choose', choice: 'D'});
  assert.equal(state.wrongFeedText, P035_SOURCE.wrongSecond);
  assert.equal(state.quizTryCount, 1);
  state = step(state, {type: 'resolve-feedback', characterId: 126});
  const secondToken = state.feedback!.token;
  assert.notEqual(firstToken, secondToken);
  assert.equal(p035Reduce(state, {type: 'advance-feedback', frame: 28, token: firstToken}).accepted, false);
  state = step(state, {type: 'advance-feedback', frame: 22, token: secondToken});
  state = step(state, {type: 'close-wrong', token: secondToken});
  state = step(state, {type: 'advance-feedback', frame: 28, token: secondToken});
  assert.equal(state.phase, 'postquiz');
  assert.equal(state.quizTryCount, 0);
  assert.equal(state.quizSection, false);
  assert.equal(state.mainPlaying, true);
  assert.equal(p035AudioIntent(state)?.owner, 'main');
});

test('source-visible Close opens at each first positive-alpha frame and never advances attempts early', () => {
  for (const [characterId, firstFrame, closeFrame, endFrame] of [
    [80, 14, 21, 29], [95, 15, 22, 28], [126, 16, 23, 28],
  ] as const) {
    let state = atQuestion();
    state = step(state, {type: 'choose', choice: 'A'});
    state = step(state, {type: 'resolve-feedback', characterId});
    const token = state.feedback!.token;
    state = step(state, {type: 'advance-feedback', frame: firstFrame - 1, token});
    assert.equal(p035Reduce(state, {type: 'close-wrong', token}).accepted, false);
    state = step(state, {type: 'advance-feedback', frame: firstFrame, token});
    assert.equal(state.phase, 'feedback-playing');
    const closed = p035Reduce(state, {type: 'close-wrong', token});
    assert.equal(closed.accepted, true, `${characterId} source-visible Close`);
    state = closed.state;
    assert.equal(state.feedback!.frame, closeFrame);
    assert.equal(state.quizTryCount, 0);
    assert.equal(p035Reduce(state, {type: 'close-wrong', token}).accepted, false);
    assert.equal(p035Reduce(state, {type: 'close-wrong', token: token - 1}).accepted, false);
    state = step(state, {type: 'advance-feedback', frame: endFrame, token});
    assert.equal(state.phase, 'question');
    assert.equal(state.quizTryCount, 1);
    const replay = step(state, {type: 'replay'});
    assert.equal(p035Reduce(replay, {type: 'close-wrong', token}).accepted, false);
  }
});

test('source B/51 is correct, but external variant must be resolved and sprite 179 remains unavailable', () => {
  let state = atQuestion();
  assert.deepEqual(P035_SOURCE.choices, {A: {text: '50', button: 54}, B: {text: '51', button: 55},
    C: {text: '225', button: 54}, D: {text: '226', button: 54}});
  state = step(state, {type: 'choose', choice: 'B'});
  assert.equal(state.pendingHostCall, '_root.showRightFeed()');
  assert.equal(p035Reduce(state, {type: 'resolve-feedback', characterId: 95}).accepted, false);
  const unresolved = p035Reduce(state, {type: 'resolve-feedback', characterId: 179});
  assert.equal(unresolved.accepted, false);
  assert.match(unresolved.reason, /tail unresolved/);
  assert.equal(unresolved.state, state);
  state = step(state, {type: 'resolve-feedback', characterId: 154});
  const token = state.feedback!.token;
  state = step(state, {type: 'advance-feedback', frame: 28, token});
  assert.equal(state.phase, 'postquiz');
  assert.equal(state.quizSection, false);
  assert.equal(state.mainPlaying, true);
  assert.equal(state.quizTryCount, 0);
});

test('all three wrong and supported right source branches retain their own local ends', () => {
  for (const characterId of [80, 95, 126] as const) {
    const state = wrong(atQuestion(), 'C', characterId);
    assert.equal(state.phase, 'question');
    assert.equal(state.quizTryCount, 1);
  }
  for (const characterId of [154, 195, 207] as const) {
    let state = atQuestion();
    state = step(state, {type: 'choose', choice: 'B'});
    state = step(state, {type: 'resolve-feedback', characterId});
    const token = state.feedback!.token;
    assert.equal(p035AudioIntent(state)?.owner, characterId === 207 ? 'feedback' : undefined);
    state = step(state, {type: 'advance-feedback', frame: 2, token});
    assert.equal(p035AudioIntent(state)?.codec, characterId === 207 ? 'swf-adpcm' : 'mp3');
    state = step(state, {type: 'advance-feedback', frame: P035_FEEDBACK[characterId].end, token});
    assert.equal(state.phase, 'postquiz');
  }
});

test('five authored glossary gates hold main on Close until explicit Play at the same buffer token', () => {
  let state = p035InitialState();
  state = step(state, {type: 'play-main'});
  assert.equal(p035Reduce(state, {type: 'open-glossary', key: 'Substitute'}).accepted, false);
  state = step(state, {type: 'advance-main', frame: 13});
  const mainToken = p035AudioIntent(state)!.epoch;
  for (const key of ['Substitute', 'Equation', 'Function'] as const) {
    const opened = p035Reduce(state, {type: 'open-glossary', key});
    assert.equal(opened.accepted, true);
    assert.equal(opened.retireAudio, false);
    assert.equal(opened.state.mainPlaying, false);
    assert.equal(p035AudioIntent(opened.state), null);
    state = step(opened.state, {type: 'close-glossary'});
    assert.equal(state.mainPlaying, false);
    assert.equal(state.mainFrame, 13);
    assert.equal(p035Reduce(state, {type: 'advance-main', frame: 14}).accepted, false);
    state = step(state, {type: 'play-main'});
    assert.equal(p035AudioIntent(state)?.epoch, mainToken);
  }
  assert.equal(p035Reduce(state, {type: 'open-glossary', key: 'Output'}).accepted, false);
  assert.equal(p035Reduce(state, {type: 'open-glossary', key: 'Input'}).accepted, false);
  state = step(state, {type: 'advance-main', frame: 89});
  state = step(state, {type: 'open-glossary', key: 'Output'});
  assert.equal(state.mainFrame, 89);
  state = step(state, {type: 'close-glossary'});
  assert.equal(state.mainPlaying, false);
  state = step(state, {type: 'play-main'});
  assert.equal(p035AudioIntent(state)?.epoch, mainToken);
  state = step(state, {type: 'open-glossary', key: 'Input'});
  state = step(state, {type: 'close-glossary'});
  assert.equal(state.mainFrame, 89);
  assert.equal(state.mainPlaying, false);
  state = step(state, {type: 'play-main'});
  state = step(state, {type: 'advance-main', frame: 145});
  state = step(state, {type: 'open-glossary', key: 'Function'});
  state = step(state, {type: 'close-glossary'});
  assert.equal(state.phase, 'question');
  assert.equal(state.mainPlaying, false);
});

test('SA Pause/Play retains its buffer; Return holds main until explicit Play with original main token', () => {
  let state = p035InitialState();
  assert.equal(p035AudioIntent(state), null);
  state = step(state, {type: 'play-main'});
  state = step(state, {type: 'advance-main', frame: 20});
  const main = p035AudioIntent(state)!;
  assert.equal(main.owner, 'main');
  const originalEpoch = state.epoch;
  const started = p035Reduce(state, {type: 'start-supplemental'});
  assert.equal(started.retireAudio, false);
  state = started.state;
  assert.equal(state.epoch, originalEpoch);
  assert.equal(state.mainAudioToken, main.epoch);
  assert.equal(state.mainFrame, 20);
  assert.equal(state.mainPlaying, false);
  const sa = p035AudioIntent(state)!;
  assert.equal(sa.owner, 'supplemental');
  assert.equal(p035Reduce(state, {type: 'advance-main', frame: 21}).accepted, false);
  const paused = p035Reduce(state, {type: 'pause-supplemental'});
  assert.equal(paused.retireAudio, false);
  state = paused.state;
  assert.equal(p035AudioIntent(state), null);
  state = step(state, {type: 'resume-supplemental'});
  assert.equal(p035AudioIntent(state)?.owner, 'supplemental');
  assert.equal(p035AudioIntent(state)?.epoch, sa.epoch);
  const returned = p035Reduce(state, {type: 'return-supplemental'});
  assert.equal(returned.retireAudio, true);
  state = returned.state;
  assert.equal(state.epoch, originalEpoch);
  assert.equal(state.mainFrame, 20);
  assert.equal(state.mainPlaying, false);
  assert.equal(p035AudioIntent(state), null);
  assert.equal(p035Reduce(state, {type: 'advance-main', frame: 21}).accepted, false);
  state = step(state, {type: 'play-main'});
  assert.equal(p035AudioIntent(state)?.owner, 'main');
  assert.equal(p035AudioIntent(state)?.epoch, main.epoch);
  state = step(state, {type: 'advance-main', frame: 145});
  state = step(state, {type: 'choose', choice: 'A'});
  state = step(state, {type: 'resolve-feedback', characterId: 80});
  const token = state.feedback!.token;
  const replayed = p035Reduce(state, {type: 'replay'});
  assert.equal(replayed.retireAudio, true);
  assert.deepEqual(replayed.state, {...p035InitialState(state.epoch + 1),
    mainAudioToken: state.mainAudioToken + 1,
    supplementalAudioToken: state.supplementalAudioToken + 1});
  assert.equal(p035Reduce(replayed.state, {type: 'advance-feedback', frame: 29, token}).accepted, false);
});

test('SA natural EOF cannot restart main and stale EOF cannot end a new SA buffer', () => {
  let state = p035InitialState();
  state = step(state, {type: 'play-main'});
  state = step(state, {type: 'advance-main', frame: 40});
  const mainToken = p035AudioIntent(state)!.epoch;
  state = step(state, {type: 'start-supplemental'});
  const saToken = state.supplementalAudioToken;
  const ended = p035Reduce(state, {type: 'supplemental-ended', token: saToken});
  assert.equal(ended.retireAudio, true);
  state = ended.state;
  assert.equal(state.supplemental, 'ended');
  assert.equal(state.mainPlaying, false);
  assert.equal(p035AudioIntent(state), null);
  assert.equal(p035Reduce(state, {type: 'play-main'}).accepted, false);
  state = step(state, {type: 'return-supplemental'});
  assert.equal(state.mainPlaying, false);
  state = step(state, {type: 'start-supplemental'});
  assert.notEqual(state.supplementalAudioToken, saToken);
  assert.equal(p035Reduce(state, {type: 'supplemental-ended', token: saToken}).accepted, false);
  state = step(state, {type: 'return-supplemental'});
  state = step(state, {type: 'play-main'});
  assert.equal(p035AudioIntent(state)?.epoch, mainToken);
  assert.equal(state.mainFrame, 40);
});

test('no authored completion at source main frame 534', () => {
  let state = atQuestion();
  state = step(state, {type: 'choose', choice: 'B'});
  state = step(state, {type: 'resolve-feedback', characterId: 195});
  state = step(state, {type: 'advance-feedback', frame: 28, token: state.feedback!.token});
  state = step(state, {type: 'advance-main', frame: 534});
  assert.equal(state.mainFrame, 534);
  assert.equal(state.mainPlaying, false);
  assert.equal(state.phase, 'postquiz');
  assert.equal(p035Reduce(state, {type: 'play-main'}).accepted, false);
});
