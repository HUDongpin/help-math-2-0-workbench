import assert from 'node:assert/strict';
import test from 'node:test';

import {p003AudioResponse} from '../lib/g678-nms-l09-p003-audio-response.server';
import {
  NMS_L09_P003_AUDIO_PATH, NMS_L09_P003_AUDIO_SHA256,
} from '../lib/g678-nms-l09-p003-audio-access';
import {
  NMS_L09_P003_CANDIDATE_AUDIO,
  NMS_L09_P003_CANDIDATE_RUNTIME,
  resolveNmsL09P003CandidateAudio,
  resolveNmsL09P003CandidateRuntime,
} from '../lib/g678-nms-l09-p003-candidate.server';

const envKeys = [
  'NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT',
  'HELP_MATH_G678_P003_AUDIO_CANDIDATE',
] as const;
const sourceRoot =
  '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

async function inEnvironment(values: Record<string, string | undefined>,
  run: () => Promise<void>) {
  const saved = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  try {
    for (const key of envKeys) {
      const value = values[key];
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    await run();
  } finally {
    for (const key of envKeys) {
      const value = saved[key];
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

test('P003 runtime is byte-bound to real source and local preview only', async () => {
  const local = {
    NODE_ENV: 'development', VERCEL_ENV: undefined,
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
    HELP_MATH_G678_SOURCE_ROOT: sourceRoot,
  };
  await inEnvironment(local, async () => {
    const resolved = await resolveNmsL09P003CandidateRuntime();
    assert.equal(resolved?.bytes.length, NMS_L09_P003_CANDIDATE_RUNTIME.bytes);
    assert.equal(resolved?.sha256, NMS_L09_P003_CANDIDATE_RUNTIME.sha256);
  });
  await inEnvironment({...local, HELP_MATH_G678_SOURCE_ROOT: `${sourceRoot}/../AWS Grade-Classified Courseware`},
    async () => assert.equal(await resolveNmsL09P003CandidateRuntime(), undefined));
  await inEnvironment({...local, NODE_ENV: 'production'},
    async () => assert.equal(await resolveNmsL09P003CandidateRuntime(), undefined));
  await inEnvironment({...local, VERCEL_ENV: 'preview'},
    async () => assert.equal(await resolveNmsL09P003CandidateRuntime(), undefined));
});

test('P003 route returns only the exact locally opted-in whole source stream', async () => {
  const local = {
    NODE_ENV: 'development', VERCEL_ENV: undefined,
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
    HELP_MATH_G678_SOURCE_ROOT: sourceRoot,
    HELP_MATH_G678_P003_AUDIO_CANDIDATE: '1',
  };
  const origin = 'http://127.0.0.1:3233';
  const request = new Request(
    `${origin}${NMS_L09_P003_AUDIO_PATH}?sha256=${NMS_L09_P003_AUDIO_SHA256}`,
    {headers: {
      host: '127.0.0.1:3233',
      referer: `${origin}/en/migration-status/g678-calibration/shared-nms002-l09-p003`,
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
    }},
  );
  await inEnvironment(local, async () => {
    const response = await p003AudioResponse(request);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'audio/mpeg');
    assert.equal(response.headers.get('content-length'), '263120');
    assert.match(response.headers.get('cache-control') ?? '', /no-store/u);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
    const bytes = await response.arrayBuffer();
    assert.equal(bytes.byteLength, NMS_L09_P003_CANDIDATE_AUDIO.bytes);
  });
  await inEnvironment({...local, HELP_MATH_G678_P003_AUDIO_CANDIDATE: undefined},
    async () => assert.equal((await p003AudioResponse(request)).status, 404));
});

test('P003 embedded stream is byte-bound to the same source-gated local candidate', async () => {
  const local = {
    NODE_ENV: 'development', VERCEL_ENV: undefined,
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
    HELP_MATH_G678_SOURCE_ROOT: sourceRoot,
  };
  await inEnvironment(local, async () => {
    const resolved = await resolveNmsL09P003CandidateAudio();
    assert.equal(resolved?.bytes.length, NMS_L09_P003_CANDIDATE_AUDIO.bytes);
    assert.equal(resolved?.sha256, NMS_L09_P003_CANDIDATE_AUDIO.sha256);
  });
  await inEnvironment({...local, NODE_ENV: 'production'},
    async () => assert.equal(await resolveNmsL09P003CandidateAudio(), undefined));
  await inEnvironment({...local, HELP_MATH_G678_SOURCE_ROOT: `${sourceRoot}/../AWS Grade-Classified Courseware`},
    async () => assert.equal(await resolveNmsL09P003CandidateAudio(), undefined));
});
