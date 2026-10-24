import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {animationModuleLoaders, animationModuleRegistrations} from '../src/registry.generated';

const moduleRoot = new URL('../src/modules/', import.meta.url);

test('all 64 G5 L2 registered module entries load without re-entering the factory', async () => {
  const catalog = JSON.parse(await readFile(new URL('../../../catalog/animations.json', import.meta.url), 'utf8'));
  const expectedKeys: string[] = catalog.animations.flatMap((animation: {animationId: string; references?: {courseXml?: {sourceXmlPath: string}[]}}) =>
    (animation.references?.courseXml ?? []).filter(({sourceXmlPath}) => sourceXmlPath === 'HELP_COURSES/ELMGR5/L2/index.xml').map(() => animation.animationId)
  ).sort();
  assert.equal(expectedKeys.length, 64);
  const files = (await readdir(moduleRoot)).filter((file) => expectedKeys.includes(file.slice(0, -'.tsx'.length))).sort();
  assert.deepEqual(files, expectedKeys.map((key: string) => `${key}.tsx`));
  for (const file of files) {
    const key = file.slice(0, -'.tsx'.length);
    const module = await animationModuleLoaders[key]!();
    assert.equal(module.key, key, key);
    assert.equal(animationModuleRegistrations[key]?.maturity, 'private-current-js', key);
    assert.equal(module.maturity, 'private-current-js', key);
  }
});
