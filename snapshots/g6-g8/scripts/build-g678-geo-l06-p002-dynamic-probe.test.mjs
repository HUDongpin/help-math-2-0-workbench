import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const SCRIPT = fileURLToPath(new URL('./build-g678-geo-l06-p002-dynamic-probe.mjs', import.meta.url));
const EXPECTED = '838f07c9315d9174d1eebdedaf85a2aa5f11d3ddedc365e5bba4678b6681171c';
const run = (mode, output) => new Promise(resolve => {
  const child = spawn(process.execPath, [SCRIPT, mode, '--output', output]);
  let log = '';
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', chunk => { log += chunk; });
  child.on('close', code => resolve({code, log}));
});

test('dynamic local probe rebuilds exactly and refuses a concurrent overwrite', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geo-l06-p002-dynamic-'));
  const output = path.join(directory, 'probe.html');
  try {
    const attempts = await Promise.all([run('--write', output), run('--write', output)]);
    assert.deepEqual(attempts.map(attempt => attempt.code).sort(), [0, 1]);
    assert.match(attempts.find(attempt => attempt.code === 1).log, /EEXIST/);
    const bytes = await readFile(output);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), EXPECTED);
    assert.match(bytes.toString('utf8'), /data-flash-frame-domain="sprite-230"/);
    const checked = await run('--check', output);
    assert.equal(checked.code, 0, checked.log);
  } finally {
    await rm(directory, {recursive: true});
  }
});
