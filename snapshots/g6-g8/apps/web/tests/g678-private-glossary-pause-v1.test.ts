import assert from 'node:assert/strict';
import test from 'node:test';
import {privateGlossaryClosePolicy, transitionDescriptorGlossaryPause as transition} from '../lib/g678-private-glossary-pause-v1';

test('private policy stays paused after close without changing ordinary resume or denied requests', () => {
  const base = {allowed: true, pageSessionId: 'p006', paused: false, seekRequest: null, session: null};
  const opened = transition({...base, requestType: 'open-glossary'});
  const close = {...base, ...opened, requestType: 'close-glossary' as const};
  assert.deepEqual(transition(close), {paused: false, seekRequest: null, session: null});
  assert.deepEqual(transition({...close, glossaryClosePolicy: 'stay-paused'}), {paused: true, seekRequest: null, session: null});
  assert.deepEqual(transition({...close, allowed: false, glossaryClosePolicy: 'stay-paused'}), opened);
  assert.deepEqual(transition({...close, pageSessionId: 'other', glossaryClosePolicy: 'stay-paused'}), {paused: true, seekRequest: null, session: null});
});

test('only the actual selected adapter can provide the private policy', () => {
  const ordinary = {animationId: 'other', audioEnabled: false, Component: () => null};
  assert.equal(privateGlossaryClosePolicy(undefined), undefined);
  assert.equal(privateGlossaryClosePolicy(ordinary), undefined);
  assert.equal(privateGlossaryClosePolicy({...ordinary, glossaryClosePolicy: 'stay-paused'} as typeof ordinary), 'stay-paused');
});
