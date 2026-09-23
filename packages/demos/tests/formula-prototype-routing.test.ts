import assert from 'node:assert/strict';
import test from 'node:test';

import {loadAnimationModule} from '../src/animation-registry';
import {matchPrototype} from '../src/prototype-manifest';

const formulaRoutes = Object.freeze([
  Object.freeze({
    animationId: 'formula-elementary-conversion-01-01',
    basename: 'Conversion_1_1.swf',
    aliasBasename: 'Copy of Conversion_1_1.swf',
    key: 'conversion-1-1',
    frameCount: 94
  }),
  Object.freeze({
    animationId: 'formula-elementary-conversion-01-03',
    basename: 'Conversion_1_3.swf',
    aliasBasename: 'Copy of Conversion_1_3.swf',
    key: 'conversion-1-3',
    frameCount: 170
  })
]);

test('formula placement IDs resolve to the shared prototype module keys', () => {
  for (const route of formulaRoutes) {
    const byId = matchPrototype({animationId: route.animationId});
    const bySource = matchPrototype({sourcePath: `HELP_FORMULAS/ELEMENTARY/SWF/${route.basename}`});
    const byAlias = matchPrototype({sourcePath: `HELP_FORMULAS/ELEMENTARY/SWF/${route.aliasBasename}`});
    assert.equal(byId?.key, route.key);
    assert.equal(bySource?.key, route.key);
    assert.equal(byAlias?.key, route.key);
    assert.equal(byId?.movie.frameCount, route.frameCount);
  }
});

test('formula prototype route keys lazily load their candidate modules', async () => {
  for (const route of formulaRoutes) {
    const module = await loadAnimationModule(route.key);
    assert.equal(module?.key, route.key);
    assert.equal(module?.movie.frameCount, route.frameCount);
    assert.equal(module?.maturity, 'legacy-prototype');
  }
});
