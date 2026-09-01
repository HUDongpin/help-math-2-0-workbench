import assert from 'node:assert/strict';
import test from 'node:test';

import {isPageAudioCandidate, type PageAudioCandidate} from '../src/contract';

const base: PageAudioCandidate = {
  id: 'shared-nms002-l01-p002-a01',
  source: 'HELP_COURSES/NMS002/L1/FQ/EA/L1RW02.mp3',
  sha256: 'a'.repeat(64),
  language: 'undetermined',
  durationMs: 1200,
  frameDomain: 'root',
  startSemantics: 'source-host-trigger',
  hostTrigger: 'fq-question-activate',
  stopOrCompleteSemantics: 'source-complete',
  replayBehavior: 'reset-and-restart',
  binding: 'FQ/EA',
  required: true,
  acceptance: 'candidate-index-only',
};

test('page audio candidates accept each shared source binding without granting acceptance', () => {
  for (const binding of ['FQ/EA', 'FQ/SA', 'lesson-SA'] as const) {
    assert.equal(isPageAudioCandidate({...base, binding}), true);
  }
  assert.equal(base.acceptance, 'candidate-index-only');
});

test('page audio candidate guard rejects malformed identity or timing fields', () => {
  assert.equal(isPageAudioCandidate({...base, sha256: 'not-a-sha'}), false);
  assert.equal(isPageAudioCandidate({...base, durationMs: -1}), false);
  assert.equal(isPageAudioCandidate({...base, binding: 'EAD'}), false);
  assert.equal(isPageAudioCandidate({...base, hostTrigger: ''}), false);
  assert.equal(isPageAudioCandidate({...base, required: 'yes'}), false);
  assert.equal(isPageAudioCandidate({...base, required: null, durationMs: null, frameDomain: null}), true);
});
