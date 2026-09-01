import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isG678LocalPreviewEnabled,
  isG678ModuleCode,
  isG678ModuleCoursePath,
} from '../lib/g678-preview-policy';

test('G6-G8 module route policy is narrow and module-aware', () => {
  assert.equal(isG678ModuleCoursePath('/courses/6/nms002/1'), true);
  assert.equal(isG678ModuleCoursePath('/courses/8/DAT001/08'), true);
  assert.equal(isG678ModuleCoursePath('/courses/5/nms002/1'), false);
  assert.equal(isG678ModuleCoursePath('/courses/6/nms002'), false);
  assert.equal(isG678ModuleCoursePath('/courses/6/nms002/1/extra'), false);
  assert.equal(isG678ModuleCode('NMS002'), true);
  assert.equal(isG678ModuleCode('XYZ999'), false);
});

test('G6-G8 local preview requires an explicit non-production opt-in', () => {
  assert.equal(isG678LocalPreviewEnabled({NODE_ENV: 'development'}), false);
  assert.equal(isG678LocalPreviewEnabled({
    NODE_ENV: 'development',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  }), true);
  assert.equal(isG678LocalPreviewEnabled({
    NODE_ENV: 'production',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  }), false);
});
