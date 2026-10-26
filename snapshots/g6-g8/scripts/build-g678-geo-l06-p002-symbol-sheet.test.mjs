import assert from 'node:assert/strict';
import {execFileSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const SCRIPT = fileURLToPath(new URL('./build-g678-geo-l06-p002-symbol-sheet.mjs', import.meta.url));
const AUDITOR = fileURLToPath(new URL('./verify_g678_geo_l06_p002_symbol_sheet.py', import.meta.url));
const EXPECTED = 'ae5c6fb9ba4e7c5b4acb1ee1187739a2bf6c1c81ff6d0c9129c428a1f9094c7c';
const run = (mode, output) => new Promise(resolve => {
  const child = spawn(process.execPath, [SCRIPT, mode, '--output', output]);
  let log = '';
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', chunk => { log += chunk; });
  child.on('close', code => resolve({code, log}));
});

test('207 source symbols rebuild identically and concurrent writers cannot overwrite', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geo-l06-p002-symbols-'));
  const output = path.join(directory, 'symbols.svg');
  try {
    const attempts = await Promise.all([run('--write', output), run('--write', output)]);
    assert.deepEqual(attempts.map(attempt => attempt.code).sort(), [0, 1]);
    assert.match(attempts.find(attempt => attempt.code === 1).log, /EEXIST/);
    const bytes = await readFile(output);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), EXPECTED);
    const checked = await run('--check', output);
    assert.equal(checked.code, 0, checked.log);
    assert.equal((bytes.toString('utf8').match(/id="geo-p002-character-\d+"/g) ?? []).length, 207);
    const audit = JSON.parse(execFileSync('python3', [AUDITOR], {encoding: 'utf8'}));
    assert.equal(audit.sheetSha256, EXPECTED);
    assert.equal(audit.characters, 207);
    assert.equal(audit.externalResources, 0);
    assert.equal(audit.executableElementsOrAttributes, 0);
  } finally {
    await rm(directory, {recursive: true});
  }
});
