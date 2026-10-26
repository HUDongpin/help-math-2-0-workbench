import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext, Script} from 'node:vm';
import test from 'node:test';
import {initialP050State, reduceP050, type P050State, type P050Event, type P050Choice} from './alg-l06-p050-state-v1';
import {P050_CANVAS_ASSET_SHA256, p050CommitCanvas, p050VisualRequest, type P050CanvasAssetV1} from './alg-l06-p050-canvas-commit-v1';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const bytes = fs.readFileSync(path.join(root, 'migrations/shared-alg001-l06-p050/canvas-v1/canvas-renderer-draft.js'));
assert.equal(createHash('sha256').update(bytes).digest('hex'), P050_CANVAS_ASSET_SHA256);
const context = createContext({document: {createElement: () => ({complete: false, naturalWidth: 0})}});
new Script(bytes.toString()).runInContext(context);
const asset = context.HELP_MATH_CANVAS_ASSETS['shared-alg001-l06-p050'] as P050CanvasAssetV1;
const answers: readonly P050Choice[] = ['D', 'A', 'B', 'D', 'C', 'A', 'B', 'C', 'D', 'B'];
function step(state: P050State, event: Omit<P050Event, 'epoch'>) {
  const result = reduceP050(state, {...event, epoch: state.epoch}); assert(result.accepted, result.reason); return result.state;
}
function resolve(state: P050State) {
  const frame = asset.resolveFrameState(p050VisualRequest(state));
  assert.equal(frame.localFrame, state.mainFrame); assert.equal(frame.rootFrame, 6);
  assert.equal(frame.game.score, state.score); assert.equal(frame.feedback?.wrongText ?? null, state.wrongText);
  return frame;
}
function start(seed = 0) {return step(step(initialP050State(seed), {type: 'start-game'}), {type: 'enter-frame'});}

test('source Canvas consumes complete correct and wrong reducer traces with all branch identities', () => {
  const branches = new Set<number>();
  for (const correct of [true, false]) for (let seed = 0; seed < 3; seed++) {
    let state = start(seed);
    for (let ordinal = 1; ordinal <= 10; ordinal++) {
      resolve(state);
      state = step(state, {type: 'open-directions', questionGeneration: state.questionGeneration}); resolve(state);
      state = step(state, {type: 'close-directions', questionGeneration: state.questionGeneration});
      const answer = answers[state.questionId! - 1]!;
      state = step(state, {type: 'choose', questionGeneration: state.questionGeneration,
        choice: correct ? answer : answer === 'A' ? 'B' : 'A'});
      if (state.feedback!.branch) branches.add(state.feedback!.branch);
      resolve(state);
      if (state.scoreAnimation) {
        state = step(state, {type: 'advance-score', token: state.scoreAnimation.token, frame: 3}); resolve(state);
        state = step(state, {type: 'advance-score', token: state.scoreAnimation!.token, frame: 20}); resolve(state);
      }
      if (!correct) {
        state = step(state, {type: 'advance-feedback', token: state.feedback!.token, frame: 23}); resolve(state);
        state = step(state, {type: 'close-wrong', token: state.feedback!.token}); resolve(state);
      }
      state = step(state, {type: 'advance-feedback', token: state.feedback!.token, frame: state.feedback!.endFrame});
    }
    resolve(state); assert.equal(state.phase, 'final');
    resolve(step(state, {type: 'replay'}));
  }
  assert.deepEqual([...branches].sort(), [1, 2, 3]);
});

test('inconsistent question, feedback, wrong text and source hold states are rejected', () => {
  const question = start();
  assert.throws(() => p050VisualRequest({...question, mainFrame: 664}));
  const answer = answers[question.questionId! - 1]!;
  const wrong = step(question, {type: 'choose', questionGeneration: question.questionGeneration,
    choice: answer === 'A' ? 'B' : 'A'});
  assert.throws(() => p050VisualRequest({...wrong, wrongText: 'Guess again.'}));
  assert.throws(() => p050VisualRequest({...wrong, phase: 'wrong-held'}));
  assert.throws(() => p050VisualRequest({...wrong, feedback: {...wrong.feedback!, spriteId: 432}}));
  assert.throws(() => asset.resolveFrameState({...p050VisualRequest(wrong),
    feedback: {...p050VisualRequest(wrong).feedback!, branch: 4}}));
  assert.throws(() => p050VisualRequest(step(question, {type: 'leave'})));
});

test('commit verifies game and feedback readback, including render-return drift', () => {
  const state = start(), request = p050VisualRequest(state), resolved = asset.resolveFrameState(request);
  const attributes = {'data-flash-frame': String(state.mainFrame), 'data-p050-game': JSON.stringify(resolved.game),
    'data-p050-feedback': JSON.stringify(resolved.feedback)} as Record<string, string>;
  const canvas = {width: 800, height: 600, getContext: () => ({}), getAttribute: (name: string) => attributes[name] ?? null} as unknown as HTMLCanvasElement;
  const bound = {...asset, render: () => resolved};
  assert.equal(p050CommitCanvas(bound, canvas, state), resolved);
  assert.throws(() => p050CommitCanvas({...bound, render: () => ({...resolved, game: {...resolved.game, score: 90}})}, canvas, state));
  attributes['data-p050-game'] = JSON.stringify({...resolved.game, ordinal: 7});
  assert.throws(() => p050CommitCanvas(bound, canvas, state));
});
