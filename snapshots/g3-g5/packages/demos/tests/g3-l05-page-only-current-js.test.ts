import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import test from 'node:test';

import {animationModuleLoaders, animationModuleRegistrations} from
  '../src/registry.generated';

const moduleRoot = new URL('../src/modules/', import.meta.url);

test('all 62 G3 L5 registered module entries load without re-entering the factory', async () => {
  const files = (await readdir(moduleRoot))
    .filter((file) => /^course-g03-l05-.*\.tsx$/u.test(file))
    .sort();
  assert.equal(files.length, 62);
  const keys = [];
  for (const file of files) {
    const key = file.slice(0, -'.tsx'.length);
    const module = await animationModuleLoaders[key]!();
    assert.equal(module.key, key, key);
    assert.equal(animationModuleRegistrations[key]?.maturity, 'private-current-js', key);
    assert.equal(module.maturity, 'private-current-js', key);
    keys.push(key);
  }
  assert.equal(new Set(keys).size, 62);
});
