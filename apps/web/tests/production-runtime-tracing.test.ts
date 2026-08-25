import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig, {
  productionAdaptiveCanvasTracingPaths,
} from '../next.config';

test('production server traces contain the exact external runtime closure', () => {
  assert.deepEqual(nextConfig.outputFileTracingIncludes, {
    '/*': [
      '../../catalog/animations.json',
      '../../catalog/missing-references.json',
      '../../catalog/completion-ledger.json',
      '../../catalog/lesson-releases.json',
      '../../catalog/lesson-release-ledger.json',
      '../../catalog/lessons.json',
      '../../reports/g5-l4-source-scope-freeze.json',
      '../../apps/web/config/current-js-production-assets.v2.json',
      ...productionAdaptiveCanvasTracingPaths,
      '../../apps/web/server-assets/flash-assets/courses/**/*.mp3',
    ],
  });
  assert.equal(productionAdaptiveCanvasTracingPaths.length, 284);
  assert.equal(new Set(productionAdaptiveCanvasTracingPaths).size, 284);
  assert.equal(
    productionAdaptiveCanvasTracingPaths.filter((assetPath) =>
      assetPath.endsWith('/canvas-renderer.js')).length,
    283,
  );
  assert.equal(
    productionAdaptiveCanvasTracingPaths.filter((assetPath) =>
      /course-g04-l(?:05|10|11)-/.test(assetPath)).length,
    0,
  );
  assert.equal(
    productionAdaptiveCanvasTracingPaths.filter((assetPath) =>
      assetPath.includes(
        'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
      )).length,
    1,
  );
});
