import assert from 'node:assert/strict';
import {test} from 'node:test';
import {NextRequest} from 'next/server';
import {
  DAT_L02_P002_AUDIO_URL,
  isDatL02P002SourceAudioRequest,
} from '../lib/dat-l02-p002-source-audio-access';
import {proxyForRequest} from '../proxy';

const origin = 'http://127.0.0.1:3318';
const env = {
  NODE_ENV: 'development',
  HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
};
const headers = () => new Headers({
  host: '127.0.0.1:3318',
  referer: `${origin}/en/migration-status/g678-calibration/shared-dat001-l02-p002-candidate`,
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-dest': 'audio',
});
function request() {
  return {method: 'GET', url: new URL(origin + DAT_L02_P002_AUDIO_URL), headers: headers()};
}

test('source WAV is available only to the exact loopback candidate', () => {
  for (const locale of ['en', 'es']) {
    const candidate = request();
    candidate.headers.set('referer', `${origin}/${locale}/migration-status/g678-calibration/shared-dat001-l02-p002-candidate`);
    assert.equal(isDatL02P002SourceAudioRequest(candidate, env), true);
    candidate.headers.set('range', 'bytes=0-');
    assert.equal(isDatL02P002SourceAudioRequest(candidate, env), true);
  }
  for (const patch of [
    {NODE_ENV: 'production'}, {VERCEL_ENV: 'preview'},
    {HELP_MATH_G678_LOCAL_PREVIEW: undefined},
    {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'},
  ]) assert.equal(isDatL02P002SourceAudioRequest(request(), {...env, ...patch}), false);
  for (const [name, value] of [
    ['host', 'example.com:3318'],
    ['x-forwarded-host', 'www.helpmath.ai'],
    ['referer', `${origin}/en/courses/6/dat001/2`],
    ['referer', 'https://evil.example/page'],
    ['origin', 'https://evil.example'],
    ['sec-fetch-site', 'cross-site'],
    ['sec-fetch-mode', 'cors'],
    ['sec-fetch-dest', 'empty'],
  ]) {
    const candidate = request();
    candidate.headers.set(name!, value!);
    assert.equal(isDatL02P002SourceAudioRequest(candidate, env), false, name);
  }
  for (const method of ['HEAD', 'POST']) {
    const candidate = request(); candidate.method = method;
    assert.equal(isDatL02P002SourceAudioRequest(candidate, env), false);
  }
  for (const path of ['source-audio.wav/extra', 'source-audio.mp3']) {
    const candidate = request();
    candidate.url.pathname = candidate.url.pathname.replace('source-audio.wav', path);
    assert.equal(isDatL02P002SourceAudioRequest(candidate, env), false);
  }
  const duplicate = request();
  duplicate.url.searchParams.append('sha256', duplicate.url.searchParams.get('sha256')!);
  assert.equal(isDatL02P002SourceAudioRequest(duplicate, env), false);
});

test('proxy denies the private WAV before generic flash-asset fallback', async () => {
  const candidate = request();
  const previous = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  try {
    Object.assign(process.env, env);
    const allowed = await proxyForRequest(new NextRequest(candidate.url, {headers: candidate.headers}));
    assert.equal(allowed.status, 200);
    const denied = request(); denied.headers.set('sec-fetch-site', 'cross-site');
    assert.equal((await proxyForRequest(new NextRequest(denied.url, {headers: denied.headers}))).status, 404);
    Reflect.set(process.env, 'NODE_ENV', 'production');
    assert.equal((await proxyForRequest(new NextRequest(candidate.url, {headers: candidate.headers}))).status, 404);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
