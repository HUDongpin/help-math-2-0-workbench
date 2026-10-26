import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const script = fileURLToPath(new URL('./extract-g678-geo-l06-p002-glossary.mjs', import.meta.url));

function run(mode, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, mode, '--output', output]);
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => {stdout += chunk;});
    child.stderr.on('data', chunk => {stderr += chunk;});
    child.on('error', reject);
    child.on('close', code => resolve({code, stdout, stderr}));
  });
}

test('four source buttons bind bilingual entries and preserve the Surface conflict without overwrite', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geo-l06-p002-glossary-'));
  const output = path.join(directory, 'source-glossary.json');
  try {
    const results = await Promise.all([run('--write', output), run('--write', output)]);
    assert.deepEqual(results.map(result => result.code).sort(), [0, 1]);
    assert.match(results.map(result => result.stderr).join(''), /EEXIST/);
    const check = await run('--check', output);
    assert.equal(check.code, 0, check.stderr);
    const record = JSON.parse(await readFile(output, 'utf8'));
    assert.deepEqual(record.controls.map(control => control.sourceCharacterId), [211, 212, 213, 214]);
    assert.deepEqual(record.entries.map(entry => entry.id), ['area', 'figure', 'surface', 'two-dimensional']);
    assert.equal(record.sourceConflicts[0].field, 'definitions.en');
    assert.equal(record.sourceConflicts[0].originalHostSelectionVerified, false);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
