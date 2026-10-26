import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const SCRIPT = fileURLToPath(new URL('./render-g678-geo-l06-p002-svg-probe.ts', import.meta.url));
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
const run = (frame, output) => new Promise(resolve => {
  const child = spawn(process.execPath, ['--import', 'tsx', SCRIPT, '--frame', String(frame), '--output', output],
    {cwd: ROOT});
  let log = '';
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', chunk => { log += chunk; });
  child.on('close', code => resolve({code, log}));
});

test('source-vector inline probe is deterministic and cannot overwrite evidence', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geo-l06-p002-inline-svg-'));
  try {
    for (const [frame, expectedHash] of [
      [1, 'ceaa63c39418c8ccf92ab97e62a7874ccfb55ee78dede052650f4ad08f9cddaa'],
      [987, '902c18ef2b6ea8261bf75bfde5b8b1adcb2a5b4450cd392569b2ebdc8dbc0504'],
    ]) {
      const output = path.join(directory, `frame-${frame}.svg`);
      const result = await run(frame, output);
      assert.equal(result.code, 0, result.log);
      const bytes = await readFile(output);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash);
      assert.match(bytes.toString('utf8'), /data:image\/PNG;base64,/);
      assert.doesNotMatch(bytes.toString('utf8'), /data:image\/svg\+xml/);
      const overwrite = await run(frame, output);
      assert.equal(overwrite.code, 1);
      assert.match(overwrite.log, /EEXIST/);
    }
  } finally {
    await rm(directory, {recursive: true});
  }
});
