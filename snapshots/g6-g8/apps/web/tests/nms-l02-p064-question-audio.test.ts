import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isP064QuestionAudioRequest, isP064OptionAudioRequest,
  P064_OPTION_AUDIO_PREFIX, P064_QUESTION_AUDIO_PREFIX, P064_SOURCE_ROOT}
  from '../lib/nms-l02-p064-question-audio-access';
import {readP064QuestionAudio, readP064OptionAudio} from '../lib/nms-l02-p064-question-audio-source';
import {p064QuestionAudioResponse, p064OptionAudioResponse}
  from '../lib/nms-l02-p064-question-audio-response';

const workspaceRoot = process.cwd();
const env = {
  NODE_ENV: 'development', VERCEL_ENV: undefined,
  HELP_MATH_G678_LOCAL_PREVIEW: '1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT: P064_SOURCE_ROOT,
};
const url = new URL(`http://127.0.0.1:3231${P064_QUESTION_AUDIO_PREFIX}EA/9`);
const headers = new Headers({host: url.host,
  referer: 'http://127.0.0.1:3231/en/migration-status/g678-calibration/shared-nms002-l02-p064?seed=6',
  'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio'});
const allowed = (next: {url?: URL; headers?: Headers; method?: string; folder?: string;
  question?: string; env?: typeof env} = {}) => isP064QuestionAudioRequest({
  method: next.method ?? 'GET', url: next.url ?? url, headers: next.headers ?? headers,
}, next.folder ?? 'EA', next.question ?? '9', next.env ?? env);

test('P064 audio route accepts only exact local same-origin candidate media requests', () => {
  assert.equal(allowed(), true);
  const rewritten = new URL(url.href.replace('127.0.0.1', 'localhost'));
  const withForwarded = new Headers(headers);
  withForwarded.set('x-forwarded-host', url.host);
  assert.equal(allowed({url: rewritten, headers: withForwarded}), true);
  assert.equal(allowed({folder: 'SA', url: new URL(url.href.replace('/EA/', '/SA/'))}), true);
  assert.equal(allowed({folder: 'EN'}), false);
  assert.equal(allowed({question: '09'}), false);
  assert.equal(allowed({question: '36'}), false);
  assert.equal(allowed({method: 'HEAD'}), false);
  assert.equal(allowed({url: new URL(url.href + '?publish=1')}), false);
  assert.equal(allowed({env: {...env, NODE_ENV: 'production'}}), false);
  assert.equal(allowed({env: {...env, HELP_MATH_G678_SOURCE_ROOT: '/tmp/source'}}), false);
  const wrongOrigin = new Headers(headers);
  wrongOrigin.set('origin', 'https://helpmath.ai');
  assert.equal(allowed({headers: wrongOrigin}), false);
  const wrongReferer = new Headers(headers);
  wrongReferer.set('referer', 'http://127.0.0.1:3231/en/');
  assert.equal(allowed({headers: wrongReferer}), false);
  const forwarded = new Headers(headers);
  forwarded.set('x-forwarded-host', 'helpmath.ai');
  assert.equal(allowed({headers: forwarded}), false);
  const crossSite = new Headers(headers);
  crossSite.set('sec-fetch-site', 'cross-site');
  assert.equal(allowed({headers: crossSite}), false);
});

test('P064 Q9 question audio reads exact EA/SA source bytes, not answer media', () => {
  const ea = readP064QuestionAudio(workspaceRoot, 'EA', 9);
  const sa = readP064QuestionAudio(workspaceRoot, 'SA', 9);
  assert.deepEqual([ea.bytes.length, ea.sha256],
    [96029, '1923f516d1db96a371ce560860d023bdb054c42eed305d8a7f19920b9ba559f3']);
  assert.deepEqual([sa.bytes.length, sa.sha256],
    [131973, '1ea33a95480b14a9e1a0c05e7ad7ca89cc71f1902ebbe20f2fa60366435ff7fd']);
  assert.throws(() => readP064QuestionAudio(workspaceRoot, 'EA', 36));
  assert.throws(() => readP064QuestionAudio(workspaceRoot + '/..', 'EA', 9));
});

test('all 70 EA/SA question candidates verify against the real source tree', () => {
  let count = 0;
  for (const folder of ['EA', 'SA']) {
    for (let questionId = 1; questionId <= 35; questionId += 1) {
      const source = readP064QuestionAudio(workspaceRoot, folder, questionId);
      assert.ok(source.bytes.length > 0);
      assert.match(source.sha256, /^[0-9a-f]{64}$/u);
      count += 1;
    }
  }
  assert.equal(count, 70);
});

test('P064 option-audio candidate access is exact and local-only', () => {
  const optionUrl = new URL(`http://127.0.0.1:3231${P064_OPTION_AUDIO_PREFIX}EA/9/B`);
  const candidate = (next: {url?: URL; folder?: string; question?: string;
    option?: string; headers?: Headers; env?: typeof env} = {}) => isP064OptionAudioRequest({
    method: 'GET', url: next.url ?? optionUrl, headers: next.headers ?? headers,
  }, next.folder ?? 'EA', next.question ?? '9', next.option ?? 'B', next.env ?? env);
  assert.equal(candidate(), true);
  assert.equal(candidate({folder: 'SA', url: new URL(optionUrl.href.replace('/EA/', '/SA/'))}), true);
  assert.equal(candidate({option: 'E'}), false);
  assert.equal(candidate({question: '09'}), false);
  assert.equal(candidate({url: new URL(optionUrl.href + '?extra=1')}), false);
  assert.equal(candidate({env: {...env, NODE_ENV: 'production'}}), false);
  const crossSite = new Headers(headers);
  crossSite.set('sec-fetch-site', 'cross-site');
  assert.equal(candidate({headers: crossSite}), false);
});

test('all 280 EA/SA option-file candidates verify without claiming host mapping', () => {
  let count = 0;
  for (const folder of ['EA', 'SA']) {
    for (let questionId = 1; questionId <= 35; questionId += 1) {
      for (const option of ['A', 'B', 'C', 'D']) {
        const source = readP064OptionAudio(workspaceRoot, folder, questionId, option);
        assert.ok(source.bytes.length > 0);
        assert.match(source.sha256, /^[0-9a-f]{64}$/u);
        count += 1;
      }
    }
  }
  assert.equal(count, 280);
  assert.deepEqual([readP064OptionAudio(workspaceRoot, 'EA', 9, 'B').bytes.length,
    readP064OptionAudio(workspaceRoot, 'EA', 9, 'B').sha256],
  [14232, 'f067e6d40b183ed4aaf832e66e4ec0afb12686644330d19b52f20e87a3e5bb3e']);
  assert.throws(() => readP064OptionAudio(workspaceRoot, 'EA', 9, 'E'));
});

test('P064 question audio response serves verified byte ranges and denies production', async () => {
  const ranged = new Headers(headers);
  ranged.set('range', 'bytes=0-1023');
  const request = new Request(url, {headers: ranged});
  const response = p064QuestionAudioResponse(request, 'EA', '9', () => workspaceRoot, env);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), 'bytes 0-1023/96029');
  assert.equal((await response.arrayBuffer()).byteLength, 1024);
  assert.equal(p064QuestionAudioResponse(request, 'EA', '9', () => workspaceRoot,
    {...env, NODE_ENV: 'production'}).status, 404);
  const invalid = new Headers(headers);
  invalid.set('range', 'bytes=96029-');
  assert.equal(p064QuestionAudioResponse(new Request(url, {headers: invalid}), 'EA', '9',
    () => workspaceRoot, env).status, 416);
});

test('P064 option audio serves exact source bytes locally and denies production', async () => {
  const optionUrl = new URL(`http://127.0.0.1:3231${P064_OPTION_AUDIO_PREFIX}EA/9/B`);
  const ranged = new Headers(headers);
  ranged.set('range', 'bytes=0-511');
  const request = new Request(optionUrl, {headers: ranged});
  const response = p064OptionAudioResponse(request, 'EA', '9', 'B', () => workspaceRoot, env);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), 'bytes 0-511/14232');
  assert.equal(response.headers.get('etag'), '"f067e6d40b183ed4aaf832e66e4ec0afb12686644330d19b52f20e87a3e5bb3e"');
  assert.equal((await response.arrayBuffer()).byteLength, 512);
  assert.equal(p064OptionAudioResponse(request, 'EA', '9', 'B', () => workspaceRoot,
    {...env, NODE_ENV: 'production'}).status, 404);
  assert.equal(p064OptionAudioResponse(request, 'EA', '9', 'E', () => workspaceRoot, env).status, 404);
});
