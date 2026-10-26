import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isNmsL09P003AudioRequest, NMS_L09_P003_AUDIO_PATH, NMS_L09_P003_AUDIO_SHA256,
} from '../lib/g678-nms-l09-p003-audio-access';

const origin = 'http://127.0.0.1:3233';
const env = {
  NODE_ENV: 'development',
  HELP_MATH_G678_LOCAL_PREVIEW: '1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  HELP_MATH_G678_P003_AUDIO_CANDIDATE: '1',
};

function candidate(locale = 'en') {
  return {
    method: 'GET',
    url: new URL(`${origin}${NMS_L09_P003_AUDIO_PATH}?sha256=${NMS_L09_P003_AUDIO_SHA256}`),
    headers: new Headers({
      host: '127.0.0.1:3233',
      referer: `${origin}/${locale}/migration-status/g678-calibration/shared-nms002-l09-p003`,
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
    }),
  };
}

test('P003 embedded audio admits only its exact English or Spanish local probe', () => {
  for (const locale of ['en', 'es']) {
    assert.equal(isNmsL09P003AudioRequest(candidate(locale), env), true);
  }
});

test('P003 embedded audio fails closed on production, missing opt-in, or wrong origin', () => {
  for (const patch of [
    {NODE_ENV: 'production'},
    {VERCEL_ENV: 'preview'},
    {HELP_MATH_G678_P003_AUDIO_CANDIDATE: undefined},
    {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'},
  ]) assert.equal(isNmsL09P003AudioRequest(candidate(), {...env, ...patch}), false);
  for (const [key, value] of [
    ['referer', `${origin}/en/migration-status/g678-calibration/shared-nms002-l09-p004`],
    ['referer', 'http://example.com/en/migration-status/g678-calibration/shared-nms002-l09-p003'],
    ['origin', 'http://example.com'],
    ['host', 'example.com:3233'],
    ['x-forwarded-host', 'example.com'],
    ['sec-fetch-site', 'cross-site'],
    ['sec-fetch-mode', 'navigate'],
    ['sec-fetch-dest', 'audio'],
    ['range', 'bytes=0-100'],
  ]) {
    const request = candidate();
    request.headers.set(key, value);
    assert.equal(isNmsL09P003AudioRequest(request, env), false, key);
  }
});

test('P003 embedded audio rejects method, path, and query drift', () => {
  for (const method of ['POST', 'HEAD', 'OPTIONS']) {
    const request = candidate();
    request.method = method;
    assert.equal(isNmsL09P003AudioRequest(request, env), false);
  }
  for (const pathname of [
    NMS_L09_P003_AUDIO_PATH + '/extra',
    NMS_L09_P003_AUDIO_PATH.replace('p003', 'p004'),
  ]) {
    const request = candidate();
    request.url.pathname = pathname;
    assert.equal(isNmsL09P003AudioRequest(request, env), false);
  }
  for (const query of [
    `sha256=${'0'.repeat(64)}`,
    `sha256=${NMS_L09_P003_AUDIO_SHA256}&sha256=${NMS_L09_P003_AUDIO_SHA256}`,
    `sha256=${NMS_L09_P003_AUDIO_SHA256}&preview=true`,
  ]) {
    const request = candidate();
    request.url.search = query;
    assert.equal(isNmsL09P003AudioRequest(request, env), false);
  }
});
