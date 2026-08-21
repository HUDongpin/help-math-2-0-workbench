import assert from 'node:assert/strict';
import test from 'node:test';

import type {AnimationModule} from '@helpmath/demos/animation-registry';

import {
  isExactInteractiveAudioAsset,
  moduleDeclaresLessonHostRequest,
  moduleSupportsDirectRuntimeAudioHost,
} from '../components/animation-runtime';

const keytermModule = {
  lessonHost: {
    capabilities: ['keyterm'],
    legacyOperations: 'blocked',
    auditStorage: 'memory-only',
    storesPersonalData: false,
  },
} as unknown as AnimationModule;

test('runtime forwards only requests explicitly declared by the module', () => {
  assert.equal(
    moduleDeclaresLessonHostRequest(keytermModule, {
      type: 'open-keyterm',
      entryId: 'en-0496-498b59d01013',
    }),
    true,
  );
  assert.equal(
    moduleDeclaresLessonHostRequest(keytermModule, {
      type: 'navigate',
      targetAnimationId: 'course-g04-l03-rw-003',
    }),
    false,
  );
  assert.equal(
    moduleDeclaresLessonHostRequest({} as AnimationModule, {
      type: 'open-keyterm',
      entryId: 'en-0496-498b59d01013',
    }),
    false,
  );
  assert.equal(
    moduleDeclaresLessonHostRequest(keytermModule, {
      type: 'legacy',
      operation: 'getURL',
    }),
    false,
  );
});

test('runtime forwards the bounded practice-feedback contract only when declared', () => {
  const practiceModule = {
    lessonHost: {
      capabilities: ['practice-feedback'],
      legacyOperations: 'blocked',
      auditStorage: 'memory-only',
      storesPersonalData: false,
    },
  } as unknown as AnimationModule;
  assert.equal(moduleDeclaresLessonHostRequest(practiceModule, {
    type: 'record-practice-feedback',
    interactionId: 'same-area-or-perimeter',
    outcome: 'correct',
    branchIndex: 1,
    branchCount: 4,
  }), true);
  assert.equal(moduleDeclaresLessonHostRequest(keytermModule, {
    type: 'reset-practice-feedback',
    interactionId: 'same-area-or-perimeter',
  }), false);
});

test('runtime admits only exact hash-bound same-origin interactive audio', () => {
  const exact = {
    id: 'g5-l4-fq-en-q01-question',
    language: 'en' as const,
    source: `/flash-assets/courses/course-g05-l04-fq-audio/audio/EA/Q1.mp3?sha256=${'a'.repeat(64)}`,
    sha256: 'a'.repeat(64),
  };
  assert.equal(isExactInteractiveAudioAsset(exact), true);
  assert.equal(
    isExactInteractiveAudioAsset({...exact, source: 'https://example.com/Q1.mp3'}),
    false,
  );
  assert.equal(
    isExactInteractiveAudioAsset({...exact, source: `${exact.source}&extra=1`}),
    false,
  );
  assert.equal(
    isExactInteractiveAudioAsset({...exact, sha256: 'b'.repeat(64)}),
    false,
  );

  const audioModule = {
    lessonHost: {
      capabilities: ['audio'],
      legacyOperations: 'blocked',
      auditStorage: 'memory-only',
      storesPersonalData: false,
    },
  } as unknown as AnimationModule;
  assert.equal(moduleDeclaresLessonHostRequest(audioModule, {
    type: 'play-audio',
    cueId: exact.id,
  }), true);
});

test('standalone runtime host is available only for an audio-only exact interactive module', () => {
  const audioOnlyModule = {
    lessonHost: {
      capabilities: ['audio'],
      legacyOperations: 'blocked',
      auditStorage: 'memory-only',
      storesPersonalData: false,
    },
  } as unknown as AnimationModule;
  const mixedCapabilityModule = {
    lessonHost: {
      capabilities: ['audio', 'keyterm'],
      legacyOperations: 'blocked',
      auditStorage: 'memory-only',
      storesPersonalData: false,
    },
  } as unknown as AnimationModule;

  assert.equal(moduleSupportsDirectRuntimeAudioHost(audioOnlyModule, true, 1), true);
  assert.equal(moduleSupportsDirectRuntimeAudioHost(audioOnlyModule, false, 1), false);
  assert.equal(moduleSupportsDirectRuntimeAudioHost(audioOnlyModule, true, 0), false);
  assert.equal(moduleSupportsDirectRuntimeAudioHost(mixedCapabilityModule, true, 1), false);
  assert.equal(moduleSupportsDirectRuntimeAudioHost(keytermModule, true, 1), false);
  assert.equal(moduleSupportsDirectRuntimeAudioHost(undefined, true, 1), false);
});
