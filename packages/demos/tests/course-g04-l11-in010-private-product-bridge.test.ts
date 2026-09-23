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
