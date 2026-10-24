import assert from 'node:assert/strict';
import test from 'node:test';
import {NextRequest} from 'next/server';
import {G4_L9_FINAL_QUIZ_AUDIO_ASSETS} from '../../../packages/demos/src/modern-lessons/generated/g4-l9-final-quiz-config';
import {G4_L8_FINAL_QUIZ_AUDIO_ASSETS} from '../../../packages/demos/src/modern-lessons/generated/g4-l8-final-quiz-audio';
import {G4_L4_FINAL_QUIZ_AUDIO_ASSETS} from '../../../packages/demos/src/modern-lessons/generated/g4-l4-final-quiz-config';
import {isLocalG4L9FinalQuizAudioRequest} from './g4-l9-final-quiz-audio-access';
import {proxyForRequest} from '../proxy';

const env = {NODE_ENV: 'production', NEXT_PUBLIC_HELP_MATH_LESSON_TYPOGRAPHY: 'candidate-v1',
  HELP_MATH_CURRENT_JS_CANDIDATE_QA: 'current-js-candidate-profile-v1',
  HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW: 'current-js-1751-controlled-preview-v1',
  HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_LOCAL: 'current-js-1751-controlled-preview-v1'};
const host = '127.0.0.1:3802', origin = 'http://' + host;
const source = G4_L9_FINAL_QUIZ_AUDIO_ASSETS[0].source;
const failedSource = '/flash-assets/typography-v1/g4-l9-final-quiz-audio/5707dd0d34b9830e00c39711676142a28496e73e6706c1d3861bcc198eee53d4.mp3?sha256=5707dd0d34b9830e00c39711676142a28496e73e6706c1d3861bcc198eee53d4';
const unknownSource = '/flash-assets/typography-v1/g4-l9-final-quiz-audio/' + '0'.repeat(64) + '.mp3?sha256=' + '0'.repeat(64);

test('all124 declared L9 assets admit only their exact path and full source query', () => {
  assert.equal(G4_L9_FINAL_QUIZ_AUDIO_ASSETS.length, 124);
  assert(G4_L9_FINAL_QUIZ_AUDIO_ASSETS.some(a => a.source === failedSource));
  for (const asset of G4_L9_FINAL_QUIZ_AUDIO_ASSETS) {
    assert.equal(isLocalG4L9FinalQuizAudioRequest(new URL(asset.source, origin), host, env), true);
    for (const suffix of ['', '?sha256=' + '0'.repeat(64), '?sha256=' + asset.sha256 + '&extra=1', '?sha256=' + asset.sha256 + '&sha256=' + asset.sha256]) {
      assert.equal(isLocalG4L9FinalQuizAudioRequest(new URL(asset.source.split('?')[0] + suffix, origin), host, env), false);
    }
  }
});
test('QA stays default-off and refuses every remote environment', () => {
  const url = new URL(source, origin);
  for (const key of Object.keys(env)) {
    assert.equal(isLocalG4L9FinalQuizAudioRequest(url, host, {...env, [key]: undefined}), false);
    assert.equal(isLocalG4L9FinalQuizAudioRequest(url, host, {...env, [key]: ''}), false);
  }
  for (const VERCEL_ENV of ['preview', 'production', 'development', '']) assert.equal(isLocalG4L9FinalQuizAudioRequest(url, host, {...env, VERCEL_ENV}), false);
  assert.equal(isLocalG4L9FinalQuizAudioRequest(url, host, {...env, NODE_ENV: 'test'}), false);
  assert.equal(isLocalG4L9FinalQuizAudioRequest(url, host, {...env, NODE_ENV: 'development'}), true);
});
test('both URL and header must stay loopback at the same port without credentials or fragments', () => {
  const url = new URL(source, origin);
  for (const allowedHost of ['127.0.0.1:3802', 'localhost:3802', '[::1]:3802']) {
    assert.equal(isLocalG4L9FinalQuizAudioRequest(url, allowedHost, env), true);
    assert.equal(isLocalG4L9FinalQuizAudioRequest(new URL(source, 'http://' + allowedHost), host, env), true);
  }
  for (const badHost of [null, '', '127.0.0.1:3803', 'localhost:0', '[::1]:65536', '127.0.0.1:3802,helpmath.ai', 'user@localhost:3802', 'helpmath.ai', 'preview.vercel.app']) assert.equal(isLocalG4L9FinalQuizAudioRequest(url, badHost, env), false);
  for (const bad of [new URL(source, 'https://' + host), new URL(source, 'http://helpmath.ai:3802'), new URL(source, 'http://127.0.0.1:3803'), new URL(source, 'http://user:password@localhost:3802'), new URL(source + '#x', origin)]) assert.equal(isLocalG4L9FinalQuizAudioRequest(bad, host, env), false);
});
test('unknown hashes and alternate paths never become available assets', () => {
  for (const bad of [unknownSource, '/en' + source, '/es' + source, source.replace('.mp3?', '.mp3/?'), source.replace('g4-l9-final-quiz-audio/', 'g4-l9-final-quiz-audio-other/'), source.replace('?sha256=', '?SHA256='), source.replace('?sha256=', '?extra=1&sha256=')]) {
    assert.equal(isLocalG4L9FinalQuizAudioRequest(new URL(bad, origin), host, env), false);
  }
});
test('actual proxy admits all124 declared assets without locale rewrite and preserves private noindex responses', async () => {
  const keys = [...Object.keys(env), 'VERCEL_ENV', 'HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_BUILD'];
  const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  try {
    Object.assign(process.env, env); delete process.env.VERCEL_ENV; delete process.env.HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_BUILD;
    const request = (path: string, requestHost = host, requestOrigin = origin) => new NextRequest(new URL(path, requestOrigin), {headers: {host: requestHost}});
    for (const asset of G4_L9_FINAL_QUIZ_AUDIO_ASSETS) {
      const accepted = await proxyForRequest(request(asset.source));
      assert.equal(accepted.headers.get('x-middleware-next'), '1');
      assert.equal(accepted.headers.get('x-middleware-rewrite'), null);
      assert.equal(accepted.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive, noimageindex');
      assert.equal(accepted.headers.get('Cache-Control'), 'private, no-store, max-age=0');
    }
    for (const path of [failedSource.split('?')[0], failedSource.replace(/sha256=.*/, 'sha256=' + '0'.repeat(64)), failedSource + '&extra=1', failedSource + '&sha256=' + '0'.repeat(64), '/en' + failedSource, '/es' + failedSource, unknownSource]) assert.equal((await proxyForRequest(request(path))).status, 404);
    for (const badHost of ['helpmath.ai', 'localhost:3803']) assert.equal((await proxyForRequest(request(failedSource, badHost))).status, 404);
    assert.equal((await proxyForRequest(request(failedSource, host, 'http://helpmath.ai:3802'))).status, 404);
    for (const previous of [G4_L4_FINAL_QUIZ_AUDIO_ASSETS[0].source, G4_L8_FINAL_QUIZ_AUDIO_ASSETS[0].source]) {
      assert.equal((await proxyForRequest(request(previous))).headers.get('x-middleware-next'), '1');
      assert.equal((await proxyForRequest(request(previous.split('?')[0]))).status, 404);
    }
    process.env.VERCEL_ENV = 'preview'; assert.equal((await proxyForRequest(request(failedSource))).status, 404);
    delete process.env.VERCEL_ENV; delete process.env.HELP_MATH_CURRENT_JS_CANDIDATE_QA;
    assert.equal((await proxyForRequest(request(failedSource))).status, 404);
  } finally { for (const k of keys) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; } }
});
