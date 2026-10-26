import assert from 'node:assert/strict';
import test from 'node:test';
import {isP001AudioRequest} from '../lib/nms-l02-p001-audio-access';
import {CONTINUOUS_AUDIO_PHASE} from '../lib/continuous-source-audio-access';

const env = {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1', HELP_MATH_G678_CALIBRATION_PHASE: CONTINUOUS_AUDIO_PHASE};
const origin = 'http://127.0.0.1:3343';
function request() {
  return {method: 'GET', url: new URL(origin + '/flash-assets/g678-local/shared-nms002-l02-p001/source-audio'
    + '?sha256=90b4efedd2a6d49fa5c869d20269239e8b397293447a704753ab7fbe3d8933e4'),
  headers: new Headers({host: '127.0.0.1:3343', referer: origin + '/en/migration-status/g678-calibration/shared-nms002-l02-p001',
    'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty'})};
}
test('the exact locally activated introduction may read its one hash-bound stream', () => {
  assert.equal(isP001AudioRequest(request(), env), true);
  const es = request(); es.headers.set('referer', origin + '/es/migration-status/g678-calibration/shared-nms002-l02-p001');
  assert.equal(isP001AudioRequest(es, env), true);
  const normalized = request(); normalized.url.hostname = 'localhost';
  assert.equal(isP001AudioRequest(normalized, env), true);
});
test('production, missing opt-in, external origins and unrelated pages cannot read the stream', () => {
  for (const patch of [{NODE_ENV: 'production'}, {VERCEL_ENV: 'preview'}, {HELP_MATH_G678_LOCAL_PREVIEW: undefined},
    {HELP_MATH_G678_CALIBRATION_PHASE: undefined}, {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'}]) {
    assert.equal(isP001AudioRequest(request(), {...env, ...patch}), false);
  }
  for (const [key, value] of [['host', 'example.com:3343'], ['x-forwarded-host', 'example.com'],
    ['referer', origin + '/en/migration-status/g678-calibration/shared-nms002-l02-p005'],
    ['referer', 'http://localhost:3343/en/migration-status/g678-calibration/shared-nms002-l02-p001'],
    ['origin', 'https://example.com'], ['sec-fetch-site', 'cross-site'], ['sec-fetch-mode', 'navigate'],
    ['sec-fetch-dest', 'audio'], ['range', 'bytes=0-100']]) {
    const changed = request(); changed.headers.set(key, value); assert.equal(isP001AudioRequest(changed, env), false, key);
  }
});
test('wrong methods, paths, digests and duplicate query entries fail closed', () => {
  const post = request(); post.method = 'POST'; assert.equal(isP001AudioRequest(post, env), false);
  const path = request(); path.url.pathname += '/extra'; assert.equal(isP001AudioRequest(path, env), false);
  const hash = request(); hash.url.searchParams.set('sha256', '0'.repeat(64)); assert.equal(isP001AudioRequest(hash, env), false);
  const duplicate = request(); duplicate.url.searchParams.append('sha256', duplicate.url.searchParams.get('sha256')!);
  assert.equal(isP001AudioRequest(duplicate, env), false);
});
