import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from '../next.config';

test('production server traces contain the exact external catalog closure', () => {
  assert.deepEqual(nextConfig.outputFileTracingIncludes, {
    '/*': [
      '../../catalog/animations.json',
      '../../catalog/missing-references.json',
      '../../catalog/completion-ledger.json',
      '../../catalog/lesson-releases.json',
      '../../catalog/lesson-release-ledger.json',
      '../../catalog/lessons.json',
      '../../reports/g5-l4-source-scope-freeze.json',
      '../../apps/web/server-assets/flash-assets/courses/**/*.mp3',
    ],
  });
});
