import assert from 'node:assert/strict';
import test from 'node:test';

import {
  strictCaptureIdentityFailure,
  type AnimationRuntimeQuery
} from '../components/animation-runtime';

const entryStateSha256 = 'a'.repeat(64);
const query: AnimationRuntimeQuery = {
  capture: '1',
  entryStateSha256,
  frame: '128',
  frameDomain: 'sprite-23',
  lang: 'en',
  requirementId: 'req:sprite-23:lesson-shell-natural-entry:en',
  scenario: 'source-static-frame',
  seed: '0',
  trace: 'trace:sprite-23:lesson-shell-natural-entry:en:seed-0'
};
const context = {
  entryStateSha256,
  frame: 128,
  frameDomain: 'sprite-23',
  lang: 'en' as const,
  requirementId: query.requirementId!,
  scenario: 'source-static-frame',
  seed: 0,
  traceId: query.trace!
};
const state = {
  ...context,
  language: context.lang
};

test('TS006 strict capture identity accepts one exact query-state chain', () => {
  assert.equal(strictCaptureIdentityFailure(query, context, state, true), null);
  assert.equal(
    strictCaptureIdentityFailure({lang: 'en'}, context, {}, true),
    null,
    'normal playback keeps its compatibility defaults'
  );
});

test('capture mode fails closed when any query identity field is missing or invalid', () => {
  const invalid: Array<readonly [Partial<AnimationRuntimeQuery>, string]> = [
    [{duplicateCaptureIdentity: true}, 'duplicate-capture-identity-parameter'],
    [{frame: undefined}, 'invalid-or-missing-frame'],
    [{frame: '0128'}, 'invalid-or-missing-frame'],
    [{frameDomain: 'missing'}, 'invalid-or-mismatched-frame-domain'],
    [{requirementId: ''}, 'invalid-or-mismatched-requirement-id'],
    [{trace: 'bad trace'}, 'invalid-or-mismatched-trace-id'],
    [{entryStateSha256: 'A'.repeat(64)}, 'invalid-or-mismatched-entry-state-sha256'],
    [{scenario: 'missing'}, 'invalid-or-mismatched-scenario'],
    [{lang: 'fr'}, 'invalid-or-mismatched-language'],
    [{seed: '-1'}, 'invalid-or-missing-seed'],
    [{seed: '4294967296'}, 'seed-mismatch']
  ];
  for (const [override, expected] of invalid) {
    assert.equal(
      strictCaptureIdentityFailure({...query, ...override}, context, state, true),
      expected,
      JSON.stringify(override)
    );
  }
});

test('TS006 capture mode fails closed on pure-state identity drift', () => {
  assert.equal(
    strictCaptureIdentityFailure(query, context, undefined, true),
    'state-capture-identity-missing'
  );
  for (const [field, value] of [
    ['frame', 127],
    ['frameDomain', 'root'],
    ['requirementId', 'req:other'],
    ['traceId', 'trace:other'],
    ['entryStateSha256', 'b'.repeat(64)],
    ['scenario', 'root-unavailable'],
    ['language', 'es'],
    ['seed', 1]
  ] as const) {
    assert.equal(
      strictCaptureIdentityFailure(query, context, {...state, [field]: value}, true),
      'state-capture-identity-mismatch',
      field
    );
  }
});
