import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {test} from 'node:test';
import {hasLocalOnlyAnimationModule} from
  '../../../packages/demos/src/local-only-animation-registry-metadata';
import MANIFEST from '../../../migrations/shared-geo001-l07-p003/audit/source-visual-assets-v1.json';
import {loadGeoL07P003CandidateAssets} from '../lib/g678-geo-l07-p003-candidate.server';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

test('P003 local asset closure is exact-source-bound without private registration', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = sourceRoot;
  try {
    const assets = loadGeoL07P003CandidateAssets();
    assert.equal(Object.keys(assets).length, 135);
    assert.equal(hasLocalOnlyAnimationModule('shared-geo001-l07-p003'), false);
    for (const entry of MANIFEST.assets) {
      const href = assets[entry.path];
      if (entry.kind === 'button' && entry.buttonState !== 'up') {
        assert.equal(href, undefined);
        continue;
      }
      assert.ok(href?.startsWith('data:image/svg+xml;base64,'));
      const data = Buffer.from(href.slice('data:image/svg+xml;base64,'.length), 'base64');
      assert.equal(data.length, entry.bytes);
      assert.equal(createHash('sha256').update(data).digest('hex'), entry.sha256);
    }
  } finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});

test('wrong source root and production mode deny visual candidate assets', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = '/tmp/not-the-authorized-source';
  try {assert.throws(() => loadGeoL07P003CandidateAssets(), /exact physical source root/);}
  finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
  const child = spawnSync(process.execPath,
    ['--conditions=react-server', '--import', 'tsx', '--input-type=module', '-e',
      `import {loadGeoL07P003CandidateAssets} from './lib/g678-geo-l07-p003-candidate.server.ts';
       try { loadGeoL07P003CandidateAssets(); process.exitCode = 1; }
       catch (error) { if (!String(error).includes('production closed')) process.exitCode = 1; }`],
    {cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8', timeout: 30_000,
      env: {...process.env, NODE_ENV: 'production', HELP_MATH_G678_SOURCE_ROOT: sourceRoot}});
  assert.equal(child.status, 0, child.stderr);
});
