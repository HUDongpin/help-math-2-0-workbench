import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {P044_CONFIG as C, createP044State, reduceP044, queryP044,
  type P044State, type P044Event, type P044StopFrame} from '../src/g678-nms-l01-p044-controller';

type Command<T = P044Event> = T extends unknown ? Omit<T, 'epoch'> : never;
const dispatch = (state: P044State, event: Command) => reduceP044(state, {...event, epoch: state.epoch} as P044Event);
function accept(state: P044State, event: Command) {
  const result = dispatch(state, event); assert.equal(result.accepted, true, result.reason ?? 'expected accepted source transition'); return result.state;
}
function reject(state: P044State, event: Command) {
  const result = dispatch(state, event); assert.equal(result.accepted, false); assert.equal(result.state, state);
  assert.deepEqual(result.intents, []); return result;
}
const observe = (state: P044State, frame: number) => accept(state, {type: 'main-frame', frame, clockToken: state.clockToken});
const nested = (state: P044State, frame: number) => accept(state, {type: 'nested-frame', frame,
  sourceObjectId: state.activeNestedFrames[0].sourceObjectId, clockToken: state.clockToken});
function toStop(target: P044StopFrame, seed = 0, mode: 'natural' | 'reduced-motion' = 'natural') {
  let state = createP044State({seed, mode});
  for (const stop of C.stops) {
    state = observe(state, stop.frame);
    if (stop.frame === target) return state;
    state = accept(state, {type: 'continue', stopFrame: stop.frame, sourceTarget: 43, input: 'mouse'});
    state = observe(state, stop.resumeFrame);
  }
  throw new Error('Unknown test target');
}
const answer = (state: P044State, instanceName: 'AnsBtn1' | 'AnsBtn2' | 'AnsBtn3' | 'AnsBtn4' = 'AnsBtn3') =>
  accept(state, {type: 'choose-answer', instanceName, input: 'Enter'});
const finishFeedback = (state: P044State) => nested(state, C.feedback.find(f => f.name === state.activeFeedback)!.terminalFrame);
const boxOpen = (frame: 575 | 697) => accept(toStop(frame), {type: 'open-explanation', stopFrame: frame, input: 'mouse'});

test('exact source configuration separates root10, entry6, main759 and authored live terminal756; acceptance remains false', () => {
  assert.equal(C.animationId, 'shared-nms002-l01-p044');
  assert.deepEqual([C.rootFrameCount, C.rootEntryFrame, C.mainFrameCount, C.liveTerminalFrame, C.fps], [10, 6, 759, 756, 12]);
  assert.deepEqual(C.stops.map(s => [s.frame, s.resumeFrame, s.rendererStateOnResume]),
    [[312, 313, 'preserve'], [449, 450, 'preserve'], [575, 576, 'preserve'], [697, 698, 'preserve'], [737, 738, 'preserve']]);
  assert.deepEqual(C.opaqueResidual, {domain: 'sprite-196', start: 517626, end: 518012, bytes: 386, nonzeroBytes: 17,
    sha256: 'd14a608f74eab33aa50401e45f0226b845a8b29aa02417254d15dc8675accaa0', semanticsEstablished: false});
  assert.equal(C.currentJavaScriptRegistered, false); assert.equal(C.originalRuntimeAccepted, false); assert.equal(C.audioIntegrated, false);
  assert.match(C.candidatePolicies.feedbackSelection, /not-original-random/);
  const state = createP044State(); assert.ok(Object.isFrozen(state)); assert.ok(Object.isFrozen(state.explanationUsed));
  assert.ok(Object.isFrozen(C.answers)); assert.ok(Object.isFrozen(queryP044(state).controls));
});

test('actual source AS bytes bind child Close and terminal reset, not an invented main-resume action', () => {
  const base = new URL('../../../work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v1/export/scripts/', import.meta.url);
  const checks = [
    ['DefineButton2_105/BUTTONCONDACTION on(release).as', '7a44bcb1c4c173e297e6102e0ccabc4df333cde3f7a236802332a001b0e97af5', '_parent.play();'],
    ['DefineButton2_130/BUTTONCONDACTION on(release).as', '7a44bcb1c4c173e297e6102e0ccabc4df333cde3f7a236802332a001b0e97af5', '_parent.play();'],
    ['DefineSprite_106/frame_20/DoAction.as', 'd83e9c769d6623082c98b20dbbc1e570133b9b991ffbd3d08c318816915160c4', 'gotoAndStop(1);'],
    ['DefineSprite_139/frame_55/DoAction.as', 'd83e9c769d6623082c98b20dbbc1e570133b9b991ffbd3d08c318816915160c4', 'gotoAndStop(1);'],
  ];
  for (const [path, sha, action] of checks) {
    const bytes = readFileSync(new URL(path, base)); assert.equal(createHash('sha256').update(bytes).digest('hex'), sha);
    assert.ok(bytes.toString().includes(action));
  }
});

test('migration specification rehashes source/XML/crosscheck/catalog and all60 source script exports; no a_text target is invented', () => {
  const root = new URL('../../../', import.meta.url);
  const spec = JSON.parse(readFileSync(new URL('migrations/shared-nms002-l01-p044/migration.json', root), 'utf8'));
  const bound = (pin: {path: string; bytes: number; sha256: string}) => {
    const bytes = readFileSync(new URL(pin.path, root)); assert.equal(bytes.length, pin.bytes, pin.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256, pin.path); return bytes;
  };
  for (const pin of Object.values(spec.source.sourceEvidence)) bound(pin as never);
  const source = readFileSync(spec.source.swf); assert.equal(source.length, 657348);
  assert.equal(createHash('sha256').update(source).digest('hex'), C.sourceSha256);
  assert.equal(spec.runtime.scripts.length, 60); for (const pin of spec.runtime.scripts) bound(pin);
  const xml = bound(spec.source.sourceEvidence.xml).toString();
  assert.doesNotMatch(xml, /\bname="a_text"|type="DefineEditTextTag"/);
  assert.equal(spec.implementation.candidateImplemented, false);
  assert.equal(spec.source.sourceBoundary.accepted, false);
});

test('observed main clock cannot bypass any source stop; Continue locks without pretending callback acknowledgement', () => {
  let state = createP044State(); reject(state, {type: 'main-frame', frame: 313, clockToken: 0});
  for (const stop of C.stops.slice(0, 4)) {
    state = observe(state, stop.frame);
    assert.equal(state.phase, 'guided'); assert.equal(state.quizSection, true); assert.equal(state.aTextVisible, false);
    reject(state, {type: 'main-frame', frame: stop.resumeFrame, clockToken: state.clockToken});
    const result = dispatch(state, {type: 'continue', stopFrame: stop.frame, sourceTarget: 43, input: ' '});
    assert.equal(result.accepted, true); assert.equal(result.state.mainFrame, stop.frame);
    assert.equal(result.state.resolvedStops.length, state.resolvedStops.length);
    assert.deepEqual(result.intents, [{epoch: state.epoch, kind: 'resolve-main-stop', stopId: stop.id,
      stopFrame: stop.frame, resumeFrame: stop.resumeFrame, cause: 'source-continue'}]);
    state = result.state; assert.equal(queryP044(state).mainPlaying, false);
    assert.deepEqual(queryP044(state).controls.continueTargets, []);
    reject(state, {type: 'continue', stopFrame: stop.frame, sourceTarget: 43, input: 'mouse'});
    reject(state, {type: 'main-frame', frame: stop.frame, clockToken: state.clockToken});
    state = observe(state, stop.resumeFrame); assert.equal(state.phase, 'teaching');
    assert.equal(state.pendingMainResume, null); assert.equal(state.resolvedStops.at(-1), stop.frame);
  }
  state = observe(state, 737); assert.equal(state.phase, 'quiz'); assert.equal(state.quizAttempts, 0);
  reject(state, {type: 'main-frame', frame: 738, clockToken: state.clockToken});
});

test('reduced-motion observed jump acknowledges one stop then reaches the next, never bypassing a held stop', () => {
  let state = toStop(312, 0, 'reduced-motion');
  state = accept(state, {type: 'continue', stopFrame: 312, sourceTarget: 44, input: 'Enter'});
  reject(state, {type: 'main-frame', frame: 575, clockToken: state.clockToken});
  state = observe(state, 449); assert.equal(state.phase, 'guided'); assert.deepEqual(state.resolvedStops, [312]);
  assert.equal(state.mode, 'reduced-motion');
});

for (const stopFrame of [312, 449] as const) test(`source44 at ${stopFrame} is a second real Continue target`, () => {
  const state = toStop(stopFrame); assert.deepEqual(queryP044(state).controls.continueTargets, [43, 44]);
  const next = accept(state, {type: 'continue', stopFrame, sourceTarget: 44, input: 'mouse'});
  assert.equal(next.mainFrame, stopFrame); assert.equal(next.pendingMainResume?.resumeFrame, stopFrame + 1);
});

for (const spec of C.explanations) test(`explanation${spec.sourceObjectId} plays exact opening/held/close frames and leaves main${spec.stopFrame} held`, () => {
  let state = toStop(spec.stopFrame); assert.deepEqual(queryP044(state).controls.continueTargets, [43]);
  reject(state, {type: 'continue', stopFrame: spec.stopFrame, sourceTarget: 44, input: 'mouse'});
  state = accept(state, {type: 'open-explanation', stopFrame: spec.stopFrame, input: 'Enter'});
  const trigger = queryP044(state).sourceContexts.find(c => c.sourceObjectId === 44)!;
  assert.equal(trigger.visible, false); assert.equal(trigger.sourceInstanceName, null);
  assert.deepEqual(trigger.instancePath[1], {parentDomain: 'sprite-293', placementFrame: spec.stopFrame, sourceObjectId: 44, depth: 30, name: null});
  assert.equal(state.activeNestedFrames[0].frame, 1); assert.equal(queryP044(state).nestedPlaying, true);
  reject(state, {type: 'close-explanation', sourceObjectId: spec.sourceObjectId, input: 'mouse'});
  reject(state, {type: 'nested-frame', sourceObjectId: spec.sourceObjectId, frame: spec.heldFrame + 1, clockToken: state.clockToken});
  for (let frame = 2; frame <= spec.heldFrame; frame++) state = nested(state, frame);
  assert.equal(state.phase, 'explanation-held'); assert.equal(queryP044(state).controls.explanationClose, spec.closeButtonId);
  assert.equal(queryP044(state).nestedPlaying, false);
  const closing = dispatch(state, {type: 'close-explanation', sourceObjectId: spec.sourceObjectId, input: ' '});
  assert.deepEqual(closing.intents, []); state = closing.state; assert.equal(state.quizSection, false);
  for (let frame = spec.heldFrame + 1; frame <= spec.closeTerminalFrame; frame++) state = nested(state, frame);
  assert.equal(state.phase, 'guided'); assert.equal(state.mainFrame, spec.stopFrame); assert.equal(state.pendingMainResume, null);
  const source = queryP044(state).sourceContexts.find(c => c.sourceObjectId === spec.sourceObjectId)!;
  assert.equal(source.frame, 1); assert.equal(source.visible, true); assert.equal(source.playing, false);
  assert.equal(queryP044(state).controls.explanation, null); // source trigger this._visible=false
  reject(state, {type: 'open-explanation', stopFrame: spec.stopFrame, input: 'mouse'});
  state = accept(state, {type: 'continue', stopFrame: spec.stopFrame, sourceTarget: 43, input: 'mouse'});
  state = observe(state, spec.stopFrame + 1); assert.equal(state.phase, 'teaching');
  assert.ok(!queryP044(state).sourceContexts.some(c => c.sourceObjectId === spec.sourceObjectId));
});

test('all source contexts include concrete placement paths; repeated85 depths stay distinct; unbound a_text is never a guessed visual', () => {
  const state = toStop(575); const contexts = queryP044(state).sourceContexts;
  assert.deepEqual(contexts.map(c => [c.sourceObjectId, c.sourceDepth, c.instancePath[1].placementFrame]), [[85, 32, 450], [85, 74, 575], [44, 30, 575], [106, 120, 575]]);
  assert.equal(new Set(contexts.map(c => c.instanceKey)).size, 4);
  for (const c of [...contexts, ...queryP044(toStop(737)).sourceContexts]) {
    assert.deepEqual(c.instancePath[0], {parentDomain: 'root', placementFrame: 6, sourceObjectId: 293, depth: 3, name: 'animation'});
    assert.equal(c.instancePath[1].parentDomain, 'sprite-293'); assert.equal(c.instancePath[1].depth, c.sourceDepth);
    assert.equal(c.instancePath[1].sourceObjectId, c.sourceObjectId);
  }
  assert.deepEqual(queryP044(state).unboundLegacyWrites.a_text, {requestedVisible: false, sourceInstancePath: null, localVisualOverride: false});
  assert.equal(queryP044(toStop(737)).sourceContexts.length, 8);
});

test('four choice placements preserve visual order and reused143 identity, with $120 as the only correct source choice', () => {
  assert.deepEqual(C.answers.map(a => [a.instanceName, a.sourceCharacterId, a.depth, a.label, a.outcome]), [
    ['AnsBtn1', 143, 207, '$43.00', 'wrong'], ['AnsBtn3', 144, 205, '$120.00', 'right'],
    ['AnsBtn4', 143, 203, '$140.00', 'wrong'], ['AnsBtn2', 142, 201, '$160.00', 'wrong']]);
  for (const spec of C.answers) {
    const result = dispatch(toStop(737), {type: 'choose-answer', instanceName: spec.instanceName, input: 'mouse'});
    assert.equal(result.state.selectedAnswer, spec.instanceName); assert.equal(result.state.phase, 'feedback');
    assert.equal(result.intents[0].kind, 'practice-feedback');
    assert.deepEqual(Object.keys(result.intents[0]).sort(), ['epoch', 'feedbackVariant', 'kind', 'originalRandomAuthority', 'outcome', 'sourceButtonId', 'sourceInstanceName']);
    assert.ok(!JSON.stringify(result.intents).includes(spec.label));
    reject(result.state, {type: 'choose-answer', instanceName: spec.instanceName, input: 'Enter'});
    assert.deepEqual(queryP044(result.state).controls.answers, []);
  }
});

for (const [index, spec] of C.feedback.entries()) test(`source feedback ${spec.name} exact local1→${spec.terminalFrame}, candidate selection disclosed`, () => {
  const seed = spec.kind === 'right' ? index : index - 4;
  let state = answer(toStop(737, seed), spec.kind === 'right' ? 'AnsBtn3' : 'AnsBtn1');
  assert.equal(state.activeFeedback, spec.name); assert.equal(state.activeNestedFrames[0].frame, 1);
  assert.equal(state.activeNestedFrames[0].sourceDepth, spec.depth);
  assert.equal(state.activeNestedFrames[0].instancePath[1].placementFrame, 737);
  reject(state, {type: 'nested-frame', sourceObjectId: spec.sourceObjectId, frame: spec.terminalFrame + 1, clockToken: state.clockToken});
  for (let frame = 2; frame < spec.terminalFrame; frame++) state = nested(state, frame);
  const result = dispatch(state, {type: 'nested-frame', sourceObjectId: spec.sourceObjectId, frame: spec.terminalFrame, clockToken: state.clockToken});
  assert.equal(result.accepted, true); state = result.state; assert.equal(state.mainFrame, 737);
  if (spec.kind === 'right') {
    assert.equal(state.phase, 'awaiting-main-resume'); assert.equal(result.intents[0].kind, 'resolve-main-stop');
    state = observe(state, 738); assert.equal(state.quizSection, false);
    state = observe(state, 756); assert.equal(queryP044(state).completed, true);
    reject(state, {type: 'main-frame', frame: 759, clockToken: state.clockToken});
  } else {
    assert.equal(state.phase, 'quiz'); assert.equal(state.quizAttempts, 1); assert.equal(state.quizSection, true);
    assert.deepEqual(result.intents, []); assert.equal(queryP044(state).controls.answers.length, 4);
  }
});

test('two wrong completions advance only after the second; right after first wrong preserves the source count until Replay', () => {
  const initial = toStop(737, 2);
  let state = finishFeedback(answer(initial, 'AnsBtn4')); assert.equal(state.quizAttempts, 1);
  assert.equal(state.selections.wrong, 1); state = answer(state, 'AnsBtn2'); assert.equal(state.activeFeedback, 'Mc_Wrong_Feed1');
  state = finishFeedback(state); assert.equal(state.quizAttempts, 0); assert.equal(state.mainFrame, 737);
  assert.equal(state.phase, 'awaiting-main-resume'); state = observe(state, 738); assert.equal(state.resolvedStops.length, 5);
  const rightAfterWrong = finishFeedback(answer(finishFeedback(answer(initial, 'AnsBtn1'))));
  assert.equal(rightAfterWrong.quizAttempts, 1); assert.equal(rightAfterWrong.phase, 'awaiting-main-resume');
});

test('source popup292 blocks choices, supports exact glossary IDs, and closes without scoring or main advancement', () => {
  let state = toStop(737); state = accept(state, {type: 'open-popup', input: ' '});
  assert.equal(state.phase, 'popup'); assert.equal(queryP044(state).sourceContexts.find(c => c.sourceObjectId === 292)!.visible, true);
  assert.deepEqual(queryP044(state).controls.glossary.map(t => t.id), ['total', 'multiplication', 'solve']);
  reject(state, {type: 'choose-answer', instanceName: 'AnsBtn3', input: 'mouse'});
  for (const term of ['multiplication', 'solve'] as const) {
    const request = dispatch(state, {type: 'open-glossary', term, input: 'Enter'}); assert.equal(request.accepted, true);
    assert.equal(request.intents[1].kind, 'glossary-open'); state = request.state;
    reject(state, {type: 'close-popup', input: 'mouse'});
    state = accept(state, {type: 'glossary-result', requestToken: state.glossary!.requestToken, allowed: true});
    reject(state, {type: 'glossary-result', requestToken: state.glossary!.requestToken, allowed: true});
    state = accept(state, {type: 'close-glossary', requestToken: state.glossary!.requestToken}); assert.equal(state.phase, 'popup');
  }
  const close = dispatch(state, {type: 'close-popup', input: 'mouse'}); assert.deepEqual(close.intents, []);
  state = close.state; assert.equal(state.mainFrame, 737); assert.equal(state.quizAttempts, 0);
  assert.equal(queryP044(state).sourceContexts.find(c => c.sourceObjectId === 292)!.visible, false);
});

test('invisible Total is not keyboard-active at frame1; source host glossary closes/denies with matching token and transport only', () => {
  let state = createP044State(); assert.deepEqual(queryP044(state).controls.glossary, []);
  reject(state, {type: 'open-glossary', term: 'total', input: 'Enter'});
  state = observe(state, 2); reject(state, {type: 'open-glossary', term: 'solve', input: 'mouse'});
  const request = dispatch(state, {type: 'open-glossary', term: 'total', input: 'mouse'}); state = request.state;
  assert.deepEqual(request.intents, [{epoch: 0, kind: 'transport', action: 'pause', frame: 2},
    {epoch: 0, kind: 'glossary-open', term: 'total', sourceButtonId: 20, requestToken: 1}]);
  reject(state, {type: 'main-frame', frame: 3, clockToken: state.clockToken});
  reject(state, {type: 'close-glossary', requestToken: 9});
  const denied = dispatch(state, {type: 'glossary-result', requestToken: 1, allowed: false});
  assert.deepEqual(denied.intents, [{epoch: 0, kind: 'glossary-close', requestToken: 1, disposition: 'denied'},
    {epoch: 0, kind: 'transport', action: 'play', frame: 2}]);
  state = denied.state; assert.equal(state.mainFrame, 2); assert.equal(state.glossary, null);
  state = accept(state, {type: 'open-glossary', term: 'total', input: 'mouse'});
  state = accept(state, {type: 'pause', paused: true});
  const closed = dispatch(state, {type: 'close-glossary', requestToken: state.glossary!.requestToken});
  assert.equal(closed.state.paused, true); assert.equal(closed.intents.length, 1);
});

test('pause invalidates pending clocks in every phase; Replay resets complete vector and rejects old epoch/host callbacks', () => {
  const open = boxOpen(575); const held = nested(open, 15);
  const closing = accept(held, {type: 'close-explanation', sourceObjectId: 106, input: 'mouse'});
  const quiz = toStop(737); const feedback = answer(quiz);
  const popup = accept(quiz, {type: 'open-popup', input: 'mouse'});
  const pending = finishFeedback(feedback); const complete = observe(observe(pending, 738), 756);
  const glossary = accept(observe(createP044State(), 2), {type: 'open-glossary', term: 'total', input: 'mouse'});
  const phases = [createP044State(), toStop(312), open, held, closing, quiz, feedback, popup, pending, complete, glossary];
  assert.equal(new Set(phases.map(s => s.phase)).size, 10);
  for (const before of phases) {
    const state = accept(before, {type: 'pause', paused: true}); const q = queryP044(state);
    assert.equal(q.mainPlaying, false); assert.equal(q.nestedPlaying, false);
    assert.ok(q.activeNestedFrames.every(c => !c.playing)); assert.deepEqual(q.controls.answers, []);
    reject(state, {type: 'main-frame', frame: state.mainFrame + 1, clockToken: before.clockToken});
    reject(state, {type: 'open-popup', input: 'mouse'});
    const unpaused = accept(state, {type: 'pause', paused: false});
    reject(unpaused, {type: 'main-frame', frame: unpaused.mainFrame + 1, clockToken: before.clockToken});
    const replay = dispatch(state, {type: 'replay', input: 'Enter'}); assert.equal(replay.accepted, true);
    assert.deepEqual(replay.state, createP044State({seed: state.seed, epoch: state.epoch + 1, mode: state.mode}));
    assert.deepEqual(replay.intents, [{epoch: state.epoch + 1, kind: 'transport', action: 'reset', frame: 1}]);
    assert.equal(reduceP044(replay.state, {type: 'glossary-result', epoch: state.epoch, requestToken: 1, allowed: true}).accepted, false);
  }
});

test('deterministic candidate seed/Replay and invalid context/event gates do not invent source clock or host authority', () => {
  for (const seed of [0, 1, 2, 3, 0xffffffff]) {
    const one = answer(toStop(737, seed)); const two = answer(toStop(737, seed)); assert.deepEqual(one, two);
    const reset = accept(one, {type: 'replay', input: ' ', seed, paused: true});
    assert.equal(reset.seed, seed); assert.equal(reset.paused, true); assert.equal(reset.epoch, 1);
  }
  for (const options of [{seed: -1}, {seed: 2 ** 32}, {seed: 1.5}, {epoch: -1}, {mode: 'borrowed-calibration'}, {paused: 1}])
    assert.throws(() => createP044State(options as never), /invalid/);
  const state = createP044State();
  for (const patch of [{sourceSha256: 'bad'}, {mainFrame: 760}, {phase: 'fake'}, {resolvedStops: [449]}, {pendingMainResume: {stopFrame: 312, resumeFrame: 314}}])
    assert.throws(() => queryP044({...state, ...patch} as never), /invalid/);
  for (const frame of [0, -1, 1.5, NaN, Infinity, 760]) reject(state, {type: 'main-frame', frame, clockToken: 0});
  reject(state, {type: 'nested-frame', frame: 2, sourceObjectId: 85, clockToken: 0});
  const quiz = toStop(737);
  for (const bad of [{type: 'open-popup'}, {type: 'open-popup', input: 'Escape'}, {type: 'choose-answer', instanceName: '143', input: 'Enter'}, {type: 'unsupported'}])
    assert.equal(reduceP044(quiz, {...bad, epoch: 0} as never).accepted, false);
  const source = readFileSync(new URL('../src/g678-nms-l01-p044-controller.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|Math\.random)\s*\(/);
  assert.doesNotMatch(source, /^import /m);
});
