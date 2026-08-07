import assert from 'node:assert/strict';
import test from 'node:test';

import type {AnimationModule} from '@helpmath/demos/animation-registry';

import {moduleDeclaresLessonHostRequest} from '../components/animation-runtime';

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
