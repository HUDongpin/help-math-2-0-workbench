import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {animationModuleLoaders, animationModuleRegistrations} from '../src/registry.generated';

interface PlacementModuleKey {
  animationId: string;
  occurrence: number;
}

test('all 71 G5 L8 placements resolve to registered modules without re-entering the factory', async () => {
  const catalog = JSON.parse(await readFile(new URL('../../../catalog/animations.json', import.meta.url), 'utf8'));
  const placementKeys: string[] = catalog.animations.flatMap((animation: {canonicalAnimationId: string; references?: {courseXml?: {occurrence: number; sourceXmlPath: string}[]}}): PlacementModuleKey[] =>
    (animation.references?.courseXml ?? []).filter(({sourceXmlPath}) => sourceXmlPath === 'HELP_COURSES/ELMGR5/L8/index.xml').map(({occurrence}) => ({animationId: animation.canonicalAnimationId, occurrence}))
  ).sort((left: PlacementModuleKey, right: PlacementModuleKey) => left.occurrence - right.occurrence).map(({animationId}: PlacementModuleKey) => animationId);
  assert.equal(placementKeys.length, 71);
  assert.equal(placementKeys[68], 'course-g05-l05-fq-001');
  for (const key of new Set(placementKeys)) {
    const module = await animationModuleLoaders[key]!();
    assert.equal(module.key, key, key);
    assert.equal(animationModuleRegistrations[key]?.maturity, 'private-current-js', key);
    assert.equal(module.maturity, 'private-current-js', key);
  }
});
