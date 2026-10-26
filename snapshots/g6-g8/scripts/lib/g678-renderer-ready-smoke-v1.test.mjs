import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assessRendererReady, summarizeRendererReady, selectSmokeLessons, allSmokeWalksComplete, waitForRendererReady} from './g678-renderer-ready-smoke-v1.mjs';

const id = 'shared-nms002-l07-p005';
const ready = {animationId: id, rendererAnimationId: id, rendererSignalFound: true,
  rendererSignalCount: 1, canvas: 'ready', clockError: '', sessionError: '', rendererError: '', availability: 'registered'};

test('exact current renderer readiness earns only smoke credit', () => {
  const verdict = assessRendererReady(id, ready);
  assert.equal(verdict.rendererReady, true);
  assert.equal(verdict.status, 'ready');
  assert.equal(summarizeRendererReady([id], [{expectedAnimationId: id, ...verdict}]).gate, 'renderer-ready-smoke');
});

for (const canvas of ['blocked', 'updating', 'loading', 'timeout', 'error', 'failed', '']) {
  test(`a parent frame cannot rescue canvas status ${canvas || 'empty'}`, () => {
    const result = assessRendererReady(id, {...ready, canvas, frame: '1'});
    assert.equal(result.rendererReady, false);
    assert.equal(result.failed, true);
  });
}

test('DOM or parent-frame-only rendering without a ready signal is unsupported', () => {
  const result = assessRendererReady(id, {animationId: id, rendererSignalFound: false, frame: '157'});
  assert.equal(result.status, 'unsupported');
  assert.equal(result.rendererReady, false);
});

for (const delta of [
  {animationId: 'shared-nms002-l07-p004'}, {rendererAnimationId: 'shared-nms002-l07-p004'},
  {rendererSignalCount: 2}, {clockError: 'decode failed'}, {sessionError: 'VM_ERROR'},
  {rendererError: 'paint failed'}, {observationError: 'page closed'},
  {availability: 'unavailable'}, {settleTimedOut: true},
]) {
  test(`ready cannot hide ${Object.keys(delta)[0]}`, () => {
    assert.equal(assessRendererReady(id, {...ready, ...delta}).rendererReady, false);
  });
}

test('ready cannot hide browser/console errors', () => {
  assert.equal(assessRendererReady(id, ready, ['404 /required-data.json']).rendererReady, false);
});

test('summary keeps an earlier failure and a later ready observation as a failed page', () => {
  const rows = [
    {expectedAnimationId: id, ...assessRendererReady(id, {...ready, canvas: 'error'})},
    {expectedAnimationId: id, ...assessRendererReady(id, ready)},
  ];
  const summary = summarizeRendererReady([id, 'unvisited-page'], rows);
  assert.equal(summary.complete, false);
  assert.deepEqual(summary.failedIds, [id]);
  assert.deepEqual(summary.notRunIds, ['unvisited-page']);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].failed, true);
});

test('empty, partial, extra and duplicate expected sets cannot finish a walk', () => {
  assert.equal(summarizeRendererReady([], []).complete, false);
  const good = {expectedAnimationId: id, ...assessRendererReady(id, ready)};
  assert.equal(summarizeRendererReady([id, 'missing'], [good]).complete, false);
  assert.equal(summarizeRendererReady([id, id], [good]).complete, false);
  assert.equal(summarizeRendererReady([id], [good, {...good, expectedAnimationId: 'foreign-page'}]).complete, false);
  assert.equal(allSmokeWalksComplete([], 0), false);
  assert.equal(allSmokeWalksComplete([{complete: true}], 2), false);
  assert.equal(allSmokeWalksComplete([{complete: true}], 1), true);
});

test('unknown or empty lesson selection fails rather than selecting zero walks', () => {
  const lessons = [{module: 'nms002', lesson: '7', ids: [id]}];
  assert.throws(() => selectSmokeLessons(lessons, ['nms002/99']), /Unknown/);
  assert.throws(() => selectSmokeLessons(lessons, ['nms002/7', 'typo']), /Unknown/);
  assert.throws(() => selectSmokeLessons(lessons, []), /No lessons/);
  assert.throws(() => selectSmokeLessons([], ['all']), /nonempty/);
  assert.equal(selectSmokeLessons(lessons, ['nms002/7']).length, 1);
});

const sourceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function cliFixture(run) {
  const root = fs.mkdtempSync(path.join(sourceDir, '../smoke-cli-test-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts/lib'), {recursive: true});
    fs.mkdirSync(path.join(root, 'catalog'));
    fs.mkdirSync(path.join(root, 'node_modules/playwright'), {recursive: true});
    fs.copyFileSync(path.join(sourceDir, 'g678-course-playback-walk.mjs'), path.join(root, 'scripts/g678-course-playback-walk.mjs'));
    fs.copyFileSync(path.join(sourceDir, 'lib/g678-renderer-ready-smoke-v1.mjs'), path.join(root, 'scripts/lib/g678-renderer-ready-smoke-v1.mjs'));
    fs.writeFileSync(path.join(root, 'catalog/g678-page-only-release-manifest.v1.json'), JSON.stringify({releases: [{members: [{animationId: id}]}]}));
    fs.writeFileSync(path.join(root, 'node_modules/playwright/package.json'), JSON.stringify({type: 'module', exports: './index.js'}));
    fs.writeFileSync(path.join(root, 'node_modules/playwright/index.js'), 'import fs from "node:fs"; export const chromium = {launch() {fs.writeFileSync("BROWSER_LAUNCH_ATTEMPT", "unexpected"); throw Error("Browser forbidden in this test");}};');
    return run(root, (selection, env = {}) => spawnSync(process.execPath, ['scripts/g678-course-playback-walk.mjs', selection], {
      cwd: root, encoding: 'utf8', env: {...process.env, G678_WALK_LOCALES: 'en', G678_WALK_LOG: path.join(root, 'new-log.jsonl'), G678_WALK_SUMMARY: path.join(root, 'new-summary.json'), ...env},
    }));
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
}

test('CLI rejects an unknown lesson before browser launch or log creation', () => cliFixture((root, run) => {
  const result = run('nms002/99');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown lesson selection/);
  assert.equal(fs.existsSync(path.join(root, 'BROWSER_LAUNCH_ATTEMPT')), false);
  assert.equal(fs.existsSync(path.join(root, 'new-log.jsonl')), false);
}));

for (const file of ['new-log.jsonl', 'new-summary.json']) {
  test(`CLI preserves an existing ${file} and never starts a browser`, () => cliFixture((root, run) => {
    const target = path.join(root, file);
    fs.writeFileSync(target, 'immutable prior evidence\n');
    const result = run('nms002/7');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /EEXIST/);
    assert.equal(fs.readFileSync(target, 'utf8'), 'immutable prior evidence\n');
    assert.equal(fs.existsSync(path.join(root, 'BROWSER_LAUNCH_ATTEMPT')), false);
  }));
}


function observationFixture({frames = [{}], afterResolve, afterTimeout} = {}) {
  const defaultState = {animationId: id, canvas: 'ready', rendererAnimationId: id, availability: 'registered', frame: '15', errors: {}};
  let state = {...defaultState, ...frames[0]}, polls = 0, evaluations = 0, disposed = 0;
  const node = (attributes, owner = null) => ({getAttribute: key => attributes[key] ?? null, closest: () => owner});
  const document = {
    querySelector(selector) {
      if (selector === '[data-current-animation-id]') return node({'data-current-animation-id': state.animationId});
      if (selector === '[data-renderer-availability="unavailable"]') return state.availability === 'unavailable' ? node({}) : null;
      if (selector === '[data-renderer-availability]') return node({'data-renderer-availability': state.availability});
      if (selector === '[data-flash-frame]') return node({'data-flash-frame': state.frame});
      throw Error('Unexpected selector: ' + selector);
    },
    querySelectorAll(selector) {
      if (selector === '[data-canvas-status]') {
        const signals = state.signals ?? [{id: state.rendererAnimationId, status: state.canvas}];
        return signals.map(signal => node({'data-canvas-status': signal.status}, node({'data-hfr-page': signal.id})));
      }
      const attribute = selector.slice(1, -1), value = state.errors[attribute];
      return value ? [node({[attribute]: value})] : [];
    },
  };
  const sample = (callback, argument) => vm.runInNewContext(`(${callback.toString()})(argument)`, {document, argument});
  const page = {
    async waitForFunction(callback, argument) {
      for (const next of frames) {
        state = {...defaultState, ...next}; polls++;
        const value = sample(callback, argument);
        if (value) {
          const captured = structuredClone(value);
          if (afterResolve) state = {...state, ...afterResolve};
          return {async jsonValue() {return structuredClone(captured);}, async dispose() {disposed++;}};
        }
      }
      if (afterTimeout) state = {...state, ...afterTimeout};
      throw Error('Timeout while waiting for a settled renderer');
    },
    async evaluate(callback, argument) {evaluations++; return sample(callback, argument);},
  };
  return {page, counts: () => ({polls, evaluations, disposed})};
}

test('atomic ready result survives a later updating frame without a second browser sample', async () => {
  const fixture = observationFixture({afterResolve: {canvas: 'updating', frame: '16'}});
  const state = await waitForRendererReady(fixture.page, id);
  assert.equal(state.canvas, 'ready'); assert.equal(state.frame, '15'); assert.equal(state.settleTimedOut, false);
  assert.equal(assessRendererReady(id, state).rendererReady, true);
  assert.deepEqual(fixture.counts(), {polls: 1, evaluations: 0, disposed: 1});
});

test('updating is polled until an actual ready state is captured', async () => {
  const fixture = observationFixture({frames: [{canvas: 'updating'}, {canvas: 'ready', frame: '16'}]});
  const state = await waitForRendererReady(fixture.page, id);
  assert.equal(state.canvas, 'ready'); assert.equal(state.frame, '16'); assert.equal(fixture.counts().polls, 2);
});

test('an error in the settled sample cannot disappear before the result is read', async () => {
  const fixture = observationFixture({frames: [{errors: {'data-canvas-error': 'paint failed'}}], afterResolve: {errors: {}}});
  const state = await waitForRendererReady(fixture.page, id);
  assert.equal(state.rendererError, 'paint failed'); assert.equal(assessRendererReady(id, state).rendererReady, false);
  assert.equal(fixture.counts().evaluations, 0);
});

test('a renderer that stays updating times out and cannot earn ready credit', async () => {
  const fixture = observationFixture({frames: [{canvas: 'updating'}, {canvas: 'updating'}]});
  const state = await waitForRendererReady(fixture.page, id, 5), result = assessRendererReady(id, state);
  assert.equal(state.settleTimedOut, true); assert.equal(state.canvas, 'updating'); assert.equal(result.rendererReady, false);
  assert(result.reasons.includes('RENDERER_WAIT_TIMEOUT')); assert(result.reasons.includes('RENDERER_NOT_READY:updating'));
});

test('a later ready diagnostic after timeout remains a failed timeout', async () => {
  const fixture = observationFixture({frames: [{canvas: 'loading'}], afterTimeout: {canvas: 'ready'}});
  const state = await waitForRendererReady(fixture.page, id, 5);
  assert.equal(state.canvas, 'ready'); assert.equal(state.settleTimedOut, true);
  assert.equal(assessRendererReady(id, state).rendererReady, false);
});

test('wrong current page or renderer identity cannot resolve a ready wait', async () => {
  for (const delta of [{animationId: 'other-page'}, {rendererAnimationId: 'other-renderer'}]) {
    const fixture = observationFixture({frames: [delta]});
    const state = await waitForRendererReady(fixture.page, id, 5);
    assert.equal(state.settleTimedOut, true); assert.equal(assessRendererReady(id, state).rendererReady, false);
  }
});

test('DOM-only content stays unsupported when no renderer-ready signal exists', async () => {
  const fixture = observationFixture({frames: [{signals: [], frame: '157'}]});
  const state = await waitForRendererReady(fixture.page, id, 5), result = assessRendererReady(id, state);
  assert.equal(state.rendererSignalFound, false); assert.equal(result.status, 'unsupported'); assert.equal(result.rendererReady, false);
});

test('multiple ready signals remain ambiguous in the returned sample', async () => {
  const fixture = observationFixture({frames: [{signals: [{id, status: 'ready'}, {id, status: 'ready'}]}]});
  const state = await waitForRendererReady(fixture.page, id), result = assessRendererReady(id, state);
  assert.equal(state.rendererSignalCount, 2); assert(result.reasons.includes('AMBIGUOUS_RENDERER_READY_SIGNAL'));
  assert.equal(result.rendererReady, false);
});

test('blocked, failed and error states resolve promptly as failures, never readiness', async () => {
  for (const canvas of ['blocked', 'failed', 'error']) {
    const fixture = observationFixture({frames: [{canvas}]});
    const state = await waitForRendererReady(fixture.page, id, 5);
    assert.equal(state.settleTimedOut, false); assert.equal(assessRendererReady(id, state).rendererReady, false);
    assert.equal(fixture.counts().evaluations, 0);
  }
});
