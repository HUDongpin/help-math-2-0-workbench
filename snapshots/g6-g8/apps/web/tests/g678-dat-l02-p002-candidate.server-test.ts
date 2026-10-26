import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {test} from 'node:test';
import {hasLocalOnlyAnimationModule} from
  '../../../packages/demos/src/local-only-animation-registry-metadata';
import LAYOUT from '../../../migrations/shared-dat001-l02-p002/audit/source-visual-layout-v1.json';
import {loadDatL02P002CandidateAssets, readDatL02P002SourceAudio,
  readDatL02P002Symbol} from
  '../lib/g678-dat-l02-p002-candidate.server';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

test('P002 visual assets are exact-source-bound and remain unregistered', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = sourceRoot;
  try {
    const result = loadDatL02P002CandidateAssets();
    assert.equal(Object.keys(result.assetHrefs).length, 169);
    assert.equal(Object.keys(result.maskPaths).length, 68);
    assert.ok(result.totalBytes > 0 && result.totalBytes <= 6_000_000);
    assert.deepEqual(result.transcript, {
      title: 'Representing Data:  Real World Activity',
      assignment: 'Assignment:',
      steps: [
        'Download sunspot data.',
        'Represent the data on an appropriate graph.',
        'Interpret the data.',
      ],
    });
    assert.equal(hasLocalOnlyAnimationModule('shared-dat001-l02-p002'), false);
    for (const symbol of LAYOUT.symbols) {
      let entries: readonly {path: string; sha256: string}[];
      if (symbol.kind === 'morph') {
        assert.ok(symbol.states);
        entries = symbol.states;
      } else {
        assert.ok(symbol.path && symbol.sha256);
        entries = [{path: symbol.path, sha256: symbol.sha256}];
      }
      for (const entry of entries) {
        const href = result.assetHrefs[entry.path];
        assert.equal(href,
          `/flash-assets/g678-local/shared-dat001-l02-p002/symbol/${entry.sha256}`);
        const data = readDatL02P002Symbol(entry.sha256);
        assert.equal(createHash('sha256').update(data).digest('hex'), entry.sha256);
        assert.equal(Boolean(result.maskPaths[entry.path]),
          [1, 103, 106, 107, 109, 111].includes(symbol.characterId));
      }
    }
    assert.throws(() => readDatL02P002Symbol('0'.repeat(64)), /symbol membership/);
  } finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});

test('P002 decoded whole-stream WAV is bound to its physical SWF', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = sourceRoot;
  try {
    const bytes = readDatL02P002SourceAudio();
    assert.equal(bytes.length, 1_012_686);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),
      'dc8fc07f7066b76e781bab37cb09f5232bb3f3ac98c8690104d8acf1dcee9f8c');
  } finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
});

test('wrong physical source and production mode deny candidate assets', () => {
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = '/tmp/not-the-authorized-source';
  try {assert.throws(() => loadDatL02P002CandidateAssets(), /exact physical source root/);}
  finally {
    if (previous === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
  }
  const child = spawnSync(process.execPath,
    ['--conditions=react-server', '--import', 'tsx', '--input-type=module', '-e',
      `import {loadDatL02P002CandidateAssets} from './lib/g678-dat-l02-p002-candidate.server.ts';
       try { loadDatL02P002CandidateAssets(); process.exitCode = 1; }
       catch (error) { if (!String(error).includes('production closed')) process.exitCode = 1; }`],
    {cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8', timeout: 30_000,
      env: {...process.env, NODE_ENV: 'production', HELP_MATH_G678_SOURCE_ROOT: sourceRoot}});
  assert.equal(child.status, 0, child.stderr);
});
