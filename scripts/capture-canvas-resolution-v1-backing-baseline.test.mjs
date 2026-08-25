import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalJson,
  expandRuntimeStates,
  parseArguments,
  stateId,
  stateIdentity,
} from './capture-canvas-resolution-v1-backing-baseline.mjs';

const requirement = Object.freeze({
  requirementId: 'req:root:en',
  frameDomainId: 'root',
  traceId: 'trace:root:en:seed-0',
  entryStateSha256: 'a'.repeat(64),
  scenario: 'source-static-frame',
  language: 'en',
  seed: '0',
  firstFrame: 1,
  lastFrame: 3,
  thresholdClass: 'static',
});

test('compact v1 backing CLI requires explicit no-apply modes', () => {
  assert.deepEqual(parseArguments(['--plan']), {mode: 'plan', lessonId: null});
  assert.deepEqual(parseArguments(['--check-plan']), {
    mode: 'check-plan',
    lessonId: null,
  });
  assert.deepEqual(parseArguments(['--execute', '--lesson', 'g04-l03']), {
    mode: 'execute',
    lessonId: 'g04-l03',
  });
  assert.deepEqual(parseArguments(['--check', '--lesson', 'g05-l05']), {
    mode: 'check',
    lessonId: 'g05-l05',
  });
  assert.deepEqual(parseArguments(['--aggregate']), {
    mode: 'aggregate',
    lessonId: null,
  });
  for (const argv of [
    [],
    ['--apply'],
    ['--execute'],
    ['--plan', '--lesson', 'g03-l02'],
    ['--execute', '--lesson', 'g04-l10'],
    ['--plan', '--check'],
  ]) assert.throws(() => parseArguments(argv));
});

test('state expansion is exact, ordered, and identity-bound', () => {
  const runtime = {
    animationId: 'course-g04-l03-in-002',
    requirements: [requirement],
  };
  const states = expandRuntimeStates(runtime);
  assert.equal(states.length, 3);
  assert.deepEqual(states.map(({identity}) => identity.frame), [1, 2, 3]);
  assert.deepEqual(states[0].request, {
    frame: 1,
    frameDomain: 'root',
    scenario: 'source-static-frame',
    lang: 'en',
    seed: 0,
  });
  const identity = stateIdentity(runtime.animationId, requirement, 1);
  assert.equal(states[0].stateId, stateId(identity));
  assert.match(states[0].stateId, /^state-[a-f0-9]{20}-f000001$/u);
  assert.equal(canonicalJson(states[0].identity), canonicalJson(identity));
});

test('state IDs change for frame, language, and placement identity fields', () => {
  const base = stateIdentity('course-g04-l03-in-002', requirement, 1);
  const identities = [
    base,
    {...base, frame: 2},
    {...base, language: 'es'},
    {...base, requirementId: 'req:root:es'},
  ];
  assert.equal(new Set(identities.map(stateId)).size, identities.length);
});
