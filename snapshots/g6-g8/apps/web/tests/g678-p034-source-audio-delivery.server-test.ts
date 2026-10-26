import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {copyFile, link, mkdir, mkdtemp, readFile, realpath, rename, rm, symlink, unlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {G678_P034_SOURCE_AUDIO as ASSETS, G678_P034_SOURCE_AUDIO_MANIFEST as MANIFEST,
  g678P034AudioByteRange, g678P034SourceAudioResponse, isExactG678P034SourceAudioRequest}
  from '../lib/g678-p034-source-audio-delivery.server';
const ROOT = fileURLToPath(new URL('../../../', import.meta.url)).replace(/\/$/u, '');
const env = {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1', HELP_MATH_G678_SOURCE_AUDIO_PREVIEW: 'true'};
const prefix = 'http://127.0.0.1:3324/flash-assets/g678-local/shared-alg001-l11-p034/source-audio/';
const headers = {'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio',
  referer: 'http://127.0.0.1:3324/en/migration-status/g678-calibration/shared-alg001-l11-p034'};
function request(key: keyof typeof ASSETS = 'sprite-105-stream', init?: RequestInit) {
  return new Request(`${prefix}${key}.mp3?sha256=${ASSETS[key].sha256}`, {...init, headers: {...headers, ...init?.headers}});
}
const response = (req: Request, workspaceRoot = ROOT) => g678P034SourceAudioResponse(req, {workspaceRoot, env});

test('unrouted audio delivery requires exact loopback page, payload hash, request metadata and explicit second opt-in', () => {
  assert.equal(isExactG678P034SourceAudioRequest(request(), env), true);
  for (const changes of [{NODE_ENV: 'production'}, {VERCEL_ENV: 'preview'}, {HELP_MATH_G678_LOCAL_PREVIEW: 'false'},
    {HELP_MATH_G678_SOURCE_AUDIO_PREVIEW: undefined}, {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'}])
    assert.equal(isExactG678P034SourceAudioRequest(request(), {...env, ...changes}), false);
  const headerChanges: Record<string, string>[] = [{referer: headers.referer.replace('p034', 'p044')},
    {referer: headers.referer.replace('127.0.0.1', 'localhost')}, {referer: headers.referer.replace('3324', '3325')},
    {origin: 'http://localhost:3324'}, {'sec-fetch-site': 'cross-site'}, {'sec-fetch-site': 'same-site'},
    {'sec-fetch-dest': 'script'}, {'sec-fetch-mode': 'navigate'},
    {'x-forwarded-host': 'www.helpmath.ai'}, {host: '127.0.0.1:3325'}];
  for (const change of headerChanges)
    assert.equal(isExactG678P034SourceAudioRequest(request(undefined, {headers: change}), env), false);
  assert.equal(isExactG678P034SourceAudioRequest(request(undefined, {headers: {'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty', origin: 'http://127.0.0.1:3324'}}), env), true);
  for (const dest of ['empty', 'audio']) {
    // Actual same-origin Chromium GET fetch()/crossorigin audio request shape:
    // the browser sends Fetch Metadata and Referer but omits Origin.
    assert.equal(isExactG678P034SourceAudioRequest(request(undefined, {headers: {
      'sec-fetch-mode': 'cors', 'sec-fetch-dest': dest}}), env), true);
  }
  for (const url of [request().url.replace('p034', 'p044'), request().url.replace('sprite-105', 'sprite-999'),
    request().url.replace(ASSETS['sprite-105-stream'].sha256, 'f'.repeat(64)), `${request().url}&extra=1`,
    `${request().url}&sha256=${ASSETS['sprite-105-stream'].sha256}`, request().url.replace('http:', 'https:')])
    assert.equal(isExactG678P034SourceAudioRequest(new Request(url, {headers}), env), false);
  assert.equal(isExactG678P034SourceAudioRequest(request(undefined, {method: 'POST'}), env), false);
});

test('single byte ranges clamp safely and reject multiple, reversed, huge or malformed ranges', () => {
  assert.equal(g678P034AudioByteRange(null, 11050), null);
  assert.deepEqual(g678P034AudioByteRange('bytes=0-9', 11050), {start: 0, end: 9});
  assert.deepEqual(g678P034AudioByteRange('bytes=11000-', 11050), {start: 11000, end: 11049});
  assert.deepEqual(g678P034AudioByteRange('bytes=-10', 11050), {start: 11040, end: 11049});
  assert.deepEqual(g678P034AudioByteRange('bytes=10-99999', 11050), {start: 10, end: 11049});
  for (const value of ['bytes=-', 'bytes=-0', 'bytes=10-9', 'bytes=11050-', 'bytes=0-1,4-5',
    'bytes=1e3-2e3', 'bytes=9007199254740992-', 'items=0-9'])
    assert.equal(g678P034AudioByteRange(value, 11050), 'unsatisfiable');
});

test('both actual hash-bound streams deliver exact full/range bytes and private fail-closed headers', async () => {
  for (const [key, binding] of Object.entries(ASSETS)) {
    const full = await response(request(key as keyof typeof ASSETS));
    assert.equal(full.status, 200);
    const bytes = Buffer.from(await full.arrayBuffer());
    assert.equal(bytes.length, binding.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), binding.sha256);
    assert.equal(full.headers.get('content-type'), 'audio/mpeg');
    assert.match(full.headers.get('cache-control')!, /private, no-store/u);
    assert.match(full.headers.get('x-robots-tag')!, /noindex/u);
    assert.equal(full.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.equal(full.headers.has('access-control-allow-origin'), false);
    const part = await response(request(key as keyof typeof ASSETS, {headers: {range: 'bytes=4-13'}}));
    assert.equal(part.status, 206); assert.equal(part.headers.get('content-range'), 'bytes 4-13/11050');
    assert.deepEqual(Buffer.from(await part.arrayBuffer()), bytes.subarray(4, 14));
    const head = await response(request(key as keyof typeof ASSETS, {method: 'HEAD', headers: {range: 'bytes=4-13'}}));
    assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), '11050');
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
});

test('unsatisfiable requests and If-Range never leak stale or ambiguous partial data', async () => {
  const invalid = await response(request(undefined, {headers: {range: 'bytes=20000-'}}));
  assert.equal(invalid.status, 416); assert.equal(invalid.headers.get('content-range'), 'bytes */11050');
  assert.equal((await invalid.arrayBuffer()).byteLength, 0);
  const full = await response(request(undefined, {headers: {range: 'bytes=0-1', 'if-range': '"old"'}}));
  assert.equal(full.status, 200); assert.equal((await full.arrayBuffer()).byteLength, 11050);
  const part = await response(request(undefined, {headers: {range: 'bytes=0-1', 'if-range': `"${ASSETS['sprite-105-stream'].sha256}"`}}));
  assert.equal(part.status, 206); assert.equal((await part.arrayBuffer()).byteLength, 2);
});

test('source/manifest drift, symlinks, hardlinks, oversized files and noncanonical roots fail closed', async t => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'g678-p034-audio-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  const files = [MANIFEST, ASSETS['sprite-105-stream']];
  for (const file of files) {
    await mkdir(path.dirname(path.join(root, file.path)), {recursive: true});
    await copyFile(path.join(ROOT, file.path), path.join(root, file.path));
  }
  const target = path.join(root, ASSETS['sprite-105-stream'].path), manifest = path.join(root, MANIFEST.path);
  assert.equal((await response(request(), root)).status, 200);
  const original = await readFile(target);
  const corrupt = Buffer.from(original); corrupt[0] ^= 1;
  await writeFile(target, corrupt); assert.equal((await response(request(), root)).status, 404);
  await writeFile(target, Buffer.concat([original, Buffer.from('extra')]));
  assert.equal((await response(request(), root)).status, 404);
  await writeFile(target, original);
  await link(target, `${target}.link`); assert.equal((await response(request(), root)).status, 404); await unlink(`${target}.link`);
  await rename(target, `${target}.real`); await symlink(`${target}.real`, target);
  assert.equal((await response(request(), root)).status, 404); await unlink(target); await rename(`${target}.real`, target);
  await rename(path.dirname(target), `${path.dirname(target)}-real`);
  await symlink(`${path.dirname(target)}-real`, path.dirname(target));
  assert.equal((await response(request(), root)).status, 404);
  await unlink(path.dirname(target)); await rename(`${path.dirname(target)}-real`, path.dirname(target));
  await writeFile(manifest, '{}'); assert.equal((await response(request(), root)).status, 404);
  assert.equal((await response(request(), `${root}/.`)).status, 404);
});

test('flag-off request is rejected without needing a readable workspace', async () => {
  const result = await g678P034SourceAudioResponse(request(), {workspaceRoot: '/definitely-not-a-workspace', env: {}});
  assert.equal(result.status, 404); assert.equal((await result.arrayBuffer()).byteLength, 0);
});
