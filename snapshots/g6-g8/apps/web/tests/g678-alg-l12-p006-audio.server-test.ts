import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {GET} from '../app/flash-assets/g678-local/shared-alg001-l12-p006/source-audio/route';
import {algL12P006Audio} from '../lib/g678-alg-l12-p006-audio.server';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const RECEIPT_SHA = 'c3f1c26102fb9b7e0cb41a60a0de764b8cc68da559a7d20be7ccb42f557f4f78';
const AUDIO_SHA = '801d34dc684341a2644a7fcc3373bea98cbc14bdf91f4364db0e37c30e7c1803';
const AUDIO_URL = `http://127.0.0.1:3134/flash-assets/g678-local/shared-alg001-l12-p006/source-audio?sha256=${AUDIO_SHA}`;
const testEnv: Record<string, string | undefined> = process.env;
const digest = (bytes: Buffer | Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

async function withPreviewEnv(run: () => Promise<void>) {
  const keys = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
    'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    testEnv.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    process.env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    await run();
  } finally {
    for (const key of keys) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else testEnv[key] = value;
    }
  }
}

function request(url = AUDIO_URL, overrides: Record<string, string> = {}) {
  return new Request(url, {headers: {
    host: '127.0.0.1:3134',
    referer: 'http://127.0.0.1:3134/en/migration-status/g678-calibration/shared-alg001-l12-p006',
    origin: 'http://127.0.0.1:3134',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    ...overrides,
  }});
}

test('P006 reader returns the exact private MP3 after physical source and receipt checks', async () => {
  await withPreviewEnv(async () => {
    assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT);
    assert.ok(lstatSync(SOURCE_ROOT).isDirectory());
    const pins = [
      [`${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/RW/L12RW06.swf`, 708053, SOURCE_SHA],
      [fileURLToPath(new URL('../../../migrations/shared-alg001-l12-p006/audio-source-v1/stream-source-receipt.json', import.meta.url)), 142839, RECEIPT_SHA],
      [fileURLToPath(new URL('../../../migrations/shared-alg001-l12-p006/audio-source-v1/sprite-53-source-stream.mp3', import.meta.url)), 140920, AUDIO_SHA],
    ] as const;
    for (const [file, size, sha256] of pins) {
      assert.equal(realpathSync(file), file);
      const stat = lstatSync(file);
      assert.ok(stat.isFile());
      assert.equal(stat.nlink, 1);
      assert.equal(stat.size, size);
      assert.equal(digest(readFileSync(file)), sha256);
    }
    const audio = algL12P006Audio();
    assert.equal(audio.bytes.length, 140920);
    assert.equal(audio.sha256, AUDIO_SHA);
    assert.equal(digest(audio.bytes), AUDIO_SHA);
  });
});

test('P006 route serves exact MP3 with private same-origin headers', async () => {
  await withPreviewEnv(async () => {
    const response = await GET(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'audio/mpeg');
    assert.equal(response.headers.get('content-length'), '140920');
    assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
    assert.equal(digest(new Uint8Array(await response.arrayBuffer())), AUDIO_SHA);
    const audioElement = await GET(request(AUDIO_URL, {
      'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio',
    }));
    assert.equal(audioElement.status, 200);
    const normalized = await GET(request(AUDIO_URL.replace('127.0.0.1', 'localhost')));
    assert.equal(normalized.status, 200, 'Next may normalize URL but preserve the browser Host');
  });
});

test('P006 route rejects wrong query and cross-origin or non-audio fetch metadata', async () => {
  await withPreviewEnv(async () => {
    const denied = async (candidate: Request) => {
      const response = await GET(candidate);
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
      assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
    };
    for (const query of ['', '?sha256=wrong', `?sha256=${AUDIO_SHA}&x=1`,
      `?x=1&sha256=${AUDIO_SHA}`, `?sha256=${AUDIO_SHA}&sha256=${AUDIO_SHA}`]) {
      await denied(request(AUDIO_URL.split('?')[0] + query));
    }
    const deniedHeaders: Array<Record<string, string>> = [
      {'sec-fetch-site': 'cross-site'}, {'sec-fetch-mode': 'navigate'},
      {'sec-fetch-dest': 'script'}, {host: 'helpmath.ai'},
      {'x-forwarded-host': 'helpmath.ai'}, {origin: 'https://example.com'},
      {referer: 'https://example.com/'}, {range: 'bytes=0-10'},
      {referer: 'http://localhost:3134/'}, {host: '127.0.0.1:9999'},
    ];
    for (const headers of deniedHeaders) await denied(request(AUDIO_URL, headers));
    await denied(request(AUDIO_URL.replace('127.0.0.1', 'example.com')));
    await denied(request(AUDIO_URL.replace('http:', 'https:')));
    await denied(new Request(AUDIO_URL, {method: 'POST', headers: request().headers}));
  });
});

test('P006 reader and route fail closed without local opt-in, physical source, or in production', async () => {
  await withPreviewEnv(async () => {
    const denied = async () => assert.equal((await GET(request())).status, 404);
    process.env.HELP_MATH_G678_SOURCE_ROOT = '/nonexistent';
    assert.throws(() => algL12P006Audio(), /P006 local source required/u);
    await denied();
    process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    delete process.env.HELP_MATH_G678_LOCAL_PREVIEW;
    await denied();
    process.env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '0.0.0.0';
    await denied();
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    testEnv.NODE_ENV = 'production';
    assert.throws(() => algL12P006Audio(), /P006 local source required/u);
    await denied();
    testEnv.NODE_ENV = 'development';
    process.env.VERCEL_ENV = 'preview';
    assert.throws(() => algL12P006Audio(), /P006 local source required/u);
    await denied();
  });
});
