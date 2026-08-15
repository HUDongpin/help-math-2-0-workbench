import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveG4L3LearningEntryAvailability,
} from '../lib/g4-l3-learning-entry';

test('G4 L3 workspace entry follows exact audit and runtime-asset showcase gates', () => {
  const unavailable = {
    descriptorBound: true,
    developmentAudit: false,
    showcaseEnabled: false,
  } as const;
  assert.equal(resolveG4L3LearningEntryAvailability(unavailable), false);
  assert.equal(resolveG4L3LearningEntryAvailability({
    ...unavailable,
    developmentAudit: true,
  }), true);
  assert.equal(resolveG4L3LearningEntryAvailability({
    ...unavailable,
    showcaseEnabled: true,
  }), true);
  assert.equal(resolveG4L3LearningEntryAvailability({
    ...unavailable,
    descriptorBound: false,
    developmentAudit: true,
    showcaseEnabled: true,
  }), false);
});
