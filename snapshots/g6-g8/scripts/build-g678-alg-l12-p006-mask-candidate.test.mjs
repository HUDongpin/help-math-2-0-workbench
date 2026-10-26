import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {maskBody, correctP006Masks, auditP006Masks} from './build-g678-alg-l12-p006-mask-candidate.mjs';
import {validateRuntime} from './build-g678-alg-l12-p006-candidate.mjs';

const work = new URL('../migrations/shared-alg001-l12-p006/', import.meta.url);
const old = readFileSync(new URL('candidate-v1/canvas-renderer.js', work), 'utf8');
const current = readFileSync(new URL('candidate-v2/canvas-renderer.js', work), 'utf8');
const names = ['shape1', 'morphshape43', 'shape52'];

test('only three exclusive mask functions change; other source drawing remains byte-identical', () => {
  assert.equal(correctP006Masks(old), current);
  const strip = text => names.reduce((value, name) => {
    const body = maskBody(value, name);
    return value.slice(0, body.start) + `/* ${name} */` + value.slice(body.end);
  }, text);
  assert.equal(strip(old), strip(current));
  for (const name of names) {
    const before = maskBody(old, name).text, after = maskBody(current, name).text;
    assert.equal(after.match(/var pathData="([^"]+)"/)[1], before.match(/var pathData="([^"]+)"/)[1]);
    assert(!after.includes('stroke'));
  }
  validateRuntime(current);
});

test('mask geometry is opaque across representative morph ratios without stroke calls', () => {
  for (const name of names) for (const ratio of [0, 1, 32767, 65535]) {
    const calls = [], ctx = {fill(rule) {calls.push(['fill', this.fillStyle, rule]);}};
    const scope = {ctx, ratio, drawPath(...args) {calls.push(['path', args[1], args[2]]);},
      drawMorphPath(...args) {calls.push(['morph', args[1], args[2], args[3]]);}};
    runInNewContext(maskBody(current, name).text + `\n${name}(ctx,null,0,ratio,0);`, scope);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], ['fill', 'rgba(255,255,255,1)', 'evenodd']);
    assert.equal(calls[0].at(-1), false);
  }
});

test('source audit proves exact clipDepth uses and transparent zero-width morph stroke', () => {
  const audit = auditP006Masks(fileURLToPath(new URL('audit/ffdec-26.2.1/movie.xml', work)));
  assert.deepEqual(audit.uses.map(x => x.characterId), ['1', '43', '52']);
  assert.equal(audit.definitions[1].stroke, 'zero-width-zero-alpha');
  assert.throws(() => correctP006Masks(current));
  assert.throws(() => correctP006Masks(old.replace('[0,0,204,0.2]', '[0,0,204,0.3]')));
});

test('v2 build is reproducible without changing v1', () => {
  const result = spawnSync(process.execPath, ['scripts/build-g678-alg-l12-p006-mask-candidate.mjs', '--check'],
    {cwd: new URL('../', import.meta.url), encoding: 'utf8', timeout: 30000});
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(new URL('candidate-v1/canvas-renderer.js', work), 'utf8'), old);
});
