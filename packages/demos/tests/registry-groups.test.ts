import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {loadAnimationModule} from '../src/animation-registry';
import {animationRegistryGroupForKey} from '../src/animation-registry-group';
import {registeredAnimationKeys} from '../src/animation-registry-metadata';
import {animationModuleLoaderGroups} from '../src/registry.generated';
import {animationRegistryGroupForKey as generatorGroupForKey} from '../scripts/generate-registry.mjs';

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

test('each lesson loader table holds only its own lesson and together they cover every registered key', async () => {
  const covered: string[] = [];
  for (const [group, load] of Object.entries(animationModuleLoaderGroups)) {
    const table = await load();
    assert.equal(table.animationRegistryGroup, group);
    for (const key of Object.keys(table.animationModuleLoaders)) {
      assert.equal(animationRegistryGroupForKey(key), group, `${key} in ${group}`);
      covered.push(key);
    }
  }
  assert.deepEqual(covered.sort(), [...registeredAnimationKeys].sort());
});

test('the generator and the runtime agree on the group for every key', () => {
  for (const key of [...registeredAnimationKeys, 'not-a-module', 'course-g9-l1-x']) {
    assert.equal(generatorGroupForKey(key), animationRegistryGroupForKey(key), key);
  }
});

test('client-loaded registry files carry no registration metadata', () => {
  const files = ['registry.generated.ts', ...readdirSync(path.join(srcDir, 'registry')).map((file) => `registry/${file}`)];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(path.join(srcDir, file), 'utf8'), /animationModuleRegistrations|maturity: '(?!private-current-js' as const)/u, file);
  }
  const registry = readFileSync(path.join(srcDir, 'animation-registry.ts'), 'utf8');
  assert.doesNotMatch(registry, /animation-registry-metadata/u);
  assert.match(registry, /export type \{[^}]*\} from '\.\/registry-metadata\.generated'/u);
  assert.doesNotMatch(registry, /^import \{[^}]*\} from '\.\/registry-metadata\.generated'/mu);
});

test('loading resolves registered keys and leaves unknown keys undefined', async () => {
  assert.equal((await loadAnimationModule('conversion-1-2'))?.key, 'conversion-1-2');
  assert.equal((await loadAnimationModule('course-g04-l03-fq-002'))?.key, 'course-g04-l03-fq-002');
  assert.equal(await loadAnimationModule('course-g09-l99-missing'), undefined);
  assert.equal(await loadAnimationModule('not-a-module'), undefined);
});
