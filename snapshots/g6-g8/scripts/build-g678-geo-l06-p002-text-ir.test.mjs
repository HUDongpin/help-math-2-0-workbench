import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const SCRIPT = fileURLToPath(new URL('./build-g678-geo-l06-p002-text-ir.mjs', import.meta.url));
const run = args => new Promise(resolve => {
  const child = spawn(process.execPath, [SCRIPT, ...args]);
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  child.on('close', code => resolve({code, output}));
});

test('source-bound text IR is reproducible and exclusive writers cannot overwrite', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geo-l06-p002-text-ir-'));
  const output = path.join(directory, 'text-ir.json');
  try {
    const attempts = await Promise.all([
      run(['--write', '--output', output]),
      run(['--write', '--output', output]),
    ]);
    assert.deepEqual(attempts.map(attempt => attempt.code).sort(), [0, 1]);
    assert.match(attempts.find(attempt => attempt.code === 1).output, /EEXIST/);
    const checked = await run(['--check', '--output', output]);
    assert.equal(checked.code, 0, checked.output);
  } finally {
    await rm(directory, {recursive: true});
  }
});
