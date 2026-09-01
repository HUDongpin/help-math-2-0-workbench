import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('a source-catalog candidate with pending fields satisfies the shared contract', () => {
  const catalog = JSON.parse(readFileSync(
    new URL('../../../catalog/g678-shared-catalog.v1.json', import.meta.url),
    'utf8',
  )) as {lessons: Array<{pages: Array<{audioCueCandidates?: unknown[]}>}>};
  const candidate = catalog.lessons
    .flatMap((lesson) => lesson.pages)
    .flatMap((page) => page.audioCueCandidates ?? [])
    .find((entry) => entry && typeof entry === 'object') ?? null;
  assert.ok(candidate, 'the source catalog should expose at least one candidate');
  assert.equal(isPageAudioCandidate(candidate), true);
});
