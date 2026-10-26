import assert from 'node:assert/strict';
import {test} from 'node:test';
import {P054_FEEDBACK_AUDIO} from '../../../packages/demos/src/nms-l02-p054-feedback-audio-v1';
import {isP053GameFeedbackAudioRequest, isP053GameRevealRequest}
  from '../lib/nms-l02-p053-game-resource-access';

const origin = 'http://127.0.0.1:3331';
const page = `${origin}/en/migration-status/g678-calibration/shared-nms002-l02-p053`;
const source = '/flash-assets/g678-local/shared-nms002-l02-p054';
const destination = '/flash-assets/g678-local/shared-nms002-l02-p053/game';
const env = {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: '1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT:
    '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};

function imageHeaders(overrides: Record<string, string> = {}): Headers {
  return new Headers({host: '127.0.0.1:3331', referer: page,
    'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'no-cors',
    'sec-fetch-dest': 'image', ...overrides});
}

function audioHeaders(overrides: Record<string, string> = {}): Headers {
  return new Headers({host: '127.0.0.1:3331', referer: page,
    'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty', ...overrides});
}

test('P053 reveal accepts exact browser-source and Next-destination path forms for both game levels', () => {
  for (const root of [source, destination]) {
    for (const level of ['1', '2']) {
      const url = new URL(`${origin}${root}/reveal/${level}/12`);
      assert.equal(isP053GameRevealRequest({method: 'GET', url,
        headers: imageHeaders()}, level, '12', env), true);
      const normalized = new URL(url.href.replace('127.0.0.1', 'localhost'));
      assert.equal(isP053GameRevealRequest({method: 'GET', url: normalized,
        headers: imageHeaders()}, level, '12', env), true);
    }
  }
});

test('P053 reveal rejects cross-page, query, source drift, and non-image fetches', () => {
  const url = new URL(`${origin}${source}/reveal/2/7`);
  const allowed = (candidate = url, headers = imageHeaders(), candidateEnv = env) =>
    isP053GameRevealRequest({method: 'GET', url: candidate, headers}, '2', '7', candidateEnv);
  assert.equal(allowed(new URL(url.href + '?level=2')), false);
  assert.equal(allowed(new URL(url.href.replace('p054', 'p052'))), false);
  assert.equal(allowed(url, imageHeaders({referer: page.replace('p053', 'p054')})), false);
  assert.equal(allowed(url, imageHeaders({referer: page + '?level=2'})), false);
  assert.equal(allowed(url, imageHeaders({'sec-fetch-dest': 'empty'})), false);
  assert.equal(allowed(url, imageHeaders({'x-forwarded-host': 'localhost:3331'})), false);
  assert.equal(allowed(url, imageHeaders({origin})), false);
  assert.equal(allowed(url, imageHeaders(), {...env, NODE_ENV: 'production'}), false);
  assert.equal(allowed(url, imageHeaders(), {...env, HELP_MATH_G678_SOURCE_ROOT: '/tmp'}), false);
  assert.equal(isP053GameRevealRequest({method: 'HEAD', url,
    headers: imageHeaders()}, '2', '7', env), false);
  assert.equal(isP053GameRevealRequest({method: 'GET', url,
    headers: imageHeaders()}, '1', '7', env), false);
  assert.equal(isP053GameRevealRequest({method: 'GET', url,
    headers: imageHeaders()}, '2', '13', env), false);
});

test('P053 feedback audio binds exact hash, P053 referer, and same-origin fetch', () => {
  const sha = P054_FEEDBACK_AUDIO.correct.sha256;
  for (const root of [source, destination]) {
    const url = new URL(`${origin}${root}/feedback-audio/correct?sha256=${sha}`);
    const request = (candidate = url, headers = audioHeaders()) =>
      isP053GameFeedbackAudioRequest({method: 'GET', url: candidate,
        headers}, 'correct', env);
    assert.equal(request(), true);
    assert.equal(request(url, audioHeaders({origin})), true);
    assert.equal(request(new URL(url.href.replace('127.0.0.1', 'localhost'))), true);
    assert.equal(request(new URL(url.href.replace(sha, P054_FEEDBACK_AUDIO.wrong.sha256))), false);
    assert.equal(request(new URL(url.href + '&extra=1')), false);
    assert.equal(request(url, audioHeaders({referer: page.replace('/en/', '/es/') + '?level=2'})), false);
    assert.equal(request(url, audioHeaders({origin: 'http://example.com'})), false);
    assert.equal(request(url, audioHeaders({range: 'bytes=0-'})), false);
    assert.equal(request(url, audioHeaders({'sec-fetch-dest': 'audio'})), false);
    assert.equal(isP053GameFeedbackAudioRequest({method: 'GET', url,
      headers: audioHeaders()}, 'result', env), false);
  }
});
