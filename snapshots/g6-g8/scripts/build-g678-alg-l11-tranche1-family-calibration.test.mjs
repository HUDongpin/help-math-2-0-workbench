import assert from 'node:assert/strict';
import test from 'node:test';

import {
  familyPrerequisiteCheckEnvironment,
  familyPrerequisiteEnvironment,
} from './build-g678-alg-l11-tranche1-family-calibration.mjs';

const SOURCE_ROOT = '/private/authorized/source-root';
const RECOVERY_ROOT = '/private/authorized/recovery-containers';

test('ALG L11 family prerequisites propagate explicit caller roots', () => {
  const caller = {
    PATH: '/usr/bin',
    HELP_MATH_G678_SOURCE_ROOT: SOURCE_ROOT,
    PRIVATE_RECOVERY_CONTAINERS: RECOVERY_ROOT,
    HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:9999',
  };
  assert.deepEqual(familyPrerequisiteEnvironment(caller), {
    HELP_MATH_G678_SOURCE_ROOT: SOURCE_ROOT,
    PRIVATE_RECOVERY_CONTAINERS: RECOVERY_ROOT,
    HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3324',
  });
  assert.deepEqual(familyPrerequisiteCheckEnvironment(caller), {
    ...caller,
    HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3324',
  });
});

test('ALG L11 family prerequisites fail closed when a root is absent', () => {
  assert.throws(() => familyPrerequisiteEnvironment({
    PRIVATE_RECOVERY_CONTAINERS: RECOVERY_ROOT,
  }), /HELP_MATH_G678_SOURCE_ROOT is required/u);
  assert.throws(() => familyPrerequisiteEnvironment({
    HELP_MATH_G678_SOURCE_ROOT: SOURCE_ROOT,
  }), /PRIVATE_RECOVERY_CONTAINERS is required/u);
  assert.throws(() => familyPrerequisiteEnvironment({
    HELP_MATH_G678_SOURCE_ROOT: '',
    PRIVATE_RECOVERY_CONTAINERS: RECOVERY_ROOT,
  }), /HELP_MATH_G678_SOURCE_ROOT is required/u);
  assert.throws(() => familyPrerequisiteEnvironment({
    HELP_MATH_G678_SOURCE_ROOT: 'relative/source',
    PRIVATE_RECOVERY_CONTAINERS: RECOVERY_ROOT,
  }), /HELP_MATH_G678_SOURCE_ROOT is required/u);
});
