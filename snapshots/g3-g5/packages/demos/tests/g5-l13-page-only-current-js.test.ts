import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {animationModuleLoaders, animationModuleRegistrations} from '../src/registry.generated';

interface PlacementModuleKey {
  animationId: string;
  occurrence: number;
}

test('all 73 G5 L13 placements resolve to registered modules while retaining RW002', async () => {
  const catalog = JSON.parse(await readFile(new URL('../../../catalog/animations.json', import.meta.url), 'utf8'));
  const placementKeys: string[] = catalog.animations.flatMap((animation: {animationId: string; references?: {courseXml?: {occurrence: number; sourceXmlPath: string}[]}}): PlacementModuleKey[] =>
    (animation.references?.courseXml ?? []).filter(({sourceXmlPath}) => sourceXmlPath === 'HELP_COURSES/ELMGR5/L13/index.xml').map(({occurrence}) => ({animationId: animation.animationId, occurrence}))
  ).sort((left: PlacementModuleKey, right: PlacementModuleKey) => left.occurrence - right.occurrence).map(({animationId}: PlacementModuleKey) => animationId);
  assert.equal(placementKeys.length, 73);
  assert.equal(placementKeys[1], 'course-g05-l13-rw-002');
  for (const key of placementKeys) {
    const module = await animationModuleLoaders[key]!();
    assert.equal(module.key, key, key);
    assert.equal(animationModuleRegistrations[key]?.maturity, 'private-current-js', key);
    assert.equal(module.maturity, 'private-current-js', key);
  }
});
