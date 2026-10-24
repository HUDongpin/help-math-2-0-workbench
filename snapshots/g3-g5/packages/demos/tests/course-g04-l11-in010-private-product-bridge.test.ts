import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  animationModuleRegistration,
  privateRegisteredAnimationKeys,
} from '../src/animation-registry';
import module, {
  COURSE_G04_L11_IN_010_SOURCE_CONTRACT,
} from '../src/modules/course-g04-l11-in-010';

test('IN010 is admitted only to the frozen private Current-JS factory registry', () => {
  assert.equal(module.key, 'course-g04-l11-in-010');
  assert.equal(module.maturity, 'private-current-js');
  assert.ok(privateRegisteredAnimationKeys.includes(module.key));
  assert.deepEqual(animationModuleRegistration(module.key), {
    maturity: 'private-current-js',
    scope: 'private-engineering',
    calibrationId: 'g4-l11-page-only-current-js-43-v1',
  });
  assert.equal(
    COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority
      .registeredCurrentJavascript,
    true,
  );
  assert.equal(
    COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority
      .authoritativeOriginalRuntimeAccepted,
    false,
  );
  assert.equal(
    COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority.behaviorParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority.visualFidelityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority.sourceAudioAccepted,
    false,
  );
  assert.equal(COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority.ownerAccepted,
    false);
  assert.equal(
    COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority.strictMigrationComplete,
    false,
  );
  assert.equal(COURSE_G04_L11_IN_010_SOURCE_CONTRACT.authority.published, false);
});

test('private registry supports independent lesson calibrations without widening authority', async () => {
  const document = JSON.parse(await readFile(new URL(
    '../private-current-js-registry.json',
    import.meta.url,
  ), 'utf8'));
  assert.equal(document.schemaVersion, 2);
  assert.equal(document.registryScope, 'private-engineering');
  assert.deepEqual(document.calibrations.map(
    (calibration: {calibrationId: string}) => calibration.calibrationId,
  ), [
    'g4-l5-page-only-current-js-53-v1',
    'g4-l10-page-only-current-js-46-v1',
    'g4-l11-page-only-current-js-43-v1',
    'g3-l5-page-only-current-js-62-v1',
    'g3-l6-page-only-current-js-56-v1',
    'g3-l8-page-only-current-js-61-v1',
    'g3-l1-page-only-current-js-74-v1',
    'g3-l3-page-only-current-js-63-v1',
    'g3-l4-page-only-current-js-67-v1',
    'g3-l9-page-only-current-js-93-v1',
    'g4-l1-page-only-current-js-80-v1',
    'g4-l2-page-only-current-js-67-v1',
    'g4-l4-page-only-current-js-54-v1',
    'g4-l6-page-only-current-js-49-v1',
    'g4-l7-page-only-current-js-48-v1',
    'g4-l8-page-only-current-js-46-v1',
    'g4-l9-page-only-current-js-43-v1',
    'g4-l12-page-only-current-js-77-v1',
    'g5-l1-page-only-current-js-82-v1',
    'g5-l2-page-only-current-js-64-v1',
    'g5-l6-page-only-current-js-40-v1',
    'g5-l7-page-only-current-js-55-v1',
    'g5-l8-page-only-current-js-71-v1',
    'g5-l13-page-only-current-js-73-v1',
  ]);
  const l11 = document.calibrations.find(
    (calibration: {calibrationId: string}) =>
      calibration.calibrationId === 'g4-l11-page-only-current-js-43-v1',
  );
  assert.equal(l11.entries.length, 43);
  assert.ok(l11.entries.some(
    (entry: {key: string}) => entry.key === 'course-g04-l11-in-010',
  ));
});
