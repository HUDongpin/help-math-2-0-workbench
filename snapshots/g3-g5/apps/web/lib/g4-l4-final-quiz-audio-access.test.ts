import assert from 'node:assert/strict';
import test from 'node:test';
import {NextRequest} from 'next/server';
import {G4_L4_FINAL_QUIZ_AUDIO_ASSETS} from '../../../packages/demos/src/modern-lessons/generated/g4-l4-final-quiz-config';
import {isLocalG4L4FinalQuizAudioRequest} from './g4-l4-final-quiz-audio-access';
import {proxyForRequest} from '../proxy';
const env = {NODE_ENV: 'production', NEXT_PUBLIC_HELP_MATH_LESSON_TYPOGRAPHY: 'candidate-v1',
  HELP_MATH_CURRENT_JS_CANDIDATE_QA: 'current-js-candidate-profile-v1',
  HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW: 'current-js-1751-controlled-preview-v1',
  HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_LOCAL: 'current-js-1751-controlled-preview-v1'};
const host = '127.0.0.1:3399', origin = 'http://' + host;
const source = G4_L4_FINAL_QUIZ_AUDIO_ASSETS[0].source;
test('all 250 source-bound original URLs are admitted only for exact local candidate QA', () => {
  assert.equal(G4_L4_FINAL_QUIZ_AUDIO_ASSETS.length, 250);
  for (const asset of G4_L4_FINAL_QUIZ_AUDIO_ASSETS) {
    assert.equal(isLocalG4L4FinalQuizAudioRequest(new URL(asset.source, origin), host, env), true);
    for (const suffix of ['', '?sha256=' + '0'.repeat(64), '?sha256=' + asset.sha256 + '&extra=1', '?sha256=' + asset.sha256 + '&sha256=' + asset.sha256]) {
      assert.equal(isLocalG4L4FinalQuizAudioRequest(new URL(asset.source.split('?')[0] + suffix, origin), host, env), false);
    }
  }
});
test('unknown assets, URL/host mismatch, remote environments and missing QA flags stay denied', () => {
  const url = new URL(source, origin);
  assert.equal(isLocalG4L4FinalQuizAudioRequest(new URL(source, 'http://localhost:3399'), host, env), true);
  for (const key of Object.keys(env)) assert.equal(isLocalG4L4FinalQuizAudioRequest(url, host, {...env, [key]: undefined}), false);
  for (const VERCEL_ENV of ['preview', 'production', 'development', '']) assert.equal(isLocalG4L4FinalQuizAudioRequest(url, host, {...env, VERCEL_ENV}), false);
  for (const badHost of [null, '127.0.0.1:3400', 'helpmath.ai', 'preview.vercel.app']) assert.equal(isLocalG4L4FinalQuizAudioRequest(url, badHost, env), false);
  for (const bad of [new URL(source, 'https://' + host), new URL(source, 'http://helpmath.ai'), new URL('/flash-assets/typography-v1/g4-l4-final-quiz-audio/unknown.mp3?sha256=' + '0'.repeat(64), origin), new URL('/en' + source, origin), new URL(source + '#x', origin)]) assert.equal(isLocalG4L4FinalQuizAudioRequest(bad, host, env), false);
});
test('actual proxy preserves locale-free asset, noindex and private response and rejects remote or invalid request', async () => {
  const keys = [...Object.keys(env), 'VERCEL_ENV', 'HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_BUILD'];
  const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  try {
    Object.assign(process.env, env); delete process.env.VERCEL_ENV; delete process.env.HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_BUILD;
    const request = (path: string, requestHost = host) => new NextRequest(new URL(path, origin), {headers: {host: requestHost}});
    const accepted = await proxyForRequest(request(source));
    assert.equal(accepted.headers.get('x-middleware-next'), '1'); assert.equal(accepted.headers.get('x-middleware-rewrite'), null);
    assert.match(accepted.headers.get('X-Robots-Tag') || '', /noindex/); assert.match(accepted.headers.get('Cache-Control') || '', /private, no-store/);
    for (const path of [source.split('?')[0], source + '&extra=1', '/en' + source]) assert.equal((await proxyForRequest(request(path))).status, 404);
    assert.equal((await proxyForRequest(request(source, 'helpmath.ai'))).status, 404);
    process.env.VERCEL_ENV = 'preview'; assert.equal((await proxyForRequest(request(source))).status, 404);
  } finally { for (const k of keys) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; } }
});
