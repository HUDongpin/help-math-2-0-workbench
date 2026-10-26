import 'server-only';

import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat, open, realpath} from 'node:fs/promises';
import path from 'node:path';
import {isG678LocalPreviewEnabled, type G678PreviewEnvironment} from './g678-preview-policy';

// Delivery preparation only. No route or renderer imports this module yet.
// The bound source streams remain separate from playback/synchronization and
// listening acceptance. Never substitute the distinct external narration.
export const G678_P034_SOURCE_AUDIO_MANIFEST = Object.freeze({
  path: 'catalog/g678-alg-l11-p034-feedback-candidate-v1.json',
  bytes: 15183, sha256: 'e5c743a3bdb92a8babbd0bc4663d92de98d7732260063f7c294f51d415a98bd5',
});
export const G678_P034_SOURCE_AUDIO = Object.freeze({
  'sprite-105-stream': Object.freeze({
    path: 'work/g678-shared-page-factory/g678-alg-l11-p034-feedback-generated-v1/sprite-105-stream.mp3',
    bytes: 11050, sha256: '3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0',
  }),
  'sprite-118-stream': Object.freeze({
    path: 'work/g678-shared-page-factory/g678-alg-l11-p034-feedback-generated-v1/sprite-118-stream.mp3',
    bytes: 11050, sha256: '6b25fd9df2ad01bd22bf57d9b8e0d3d9114e2bde208ebe7b0b6322820a5ad741',
  }),
});
type Binding = Readonly<{path: string; bytes: number; sha256: string}>;
const encodeHash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const PREFIX = '/flash-assets/g678-local/shared-alg001-l11-p034/source-audio/';

function exactAsset(requestUrl: URL) {
  const key = requestUrl.pathname.startsWith(PREFIX)
    ? requestUrl.pathname.slice(PREFIX.length).replace(/\.mp3$/u, '') : '';
  if (!Object.hasOwn(G678_P034_SOURCE_AUDIO, key) || requestUrl.pathname !== `${PREFIX}${key}.mp3`) return;
  const binding = G678_P034_SOURCE_AUDIO[key as keyof typeof G678_P034_SOURCE_AUDIO];
  const query = [...requestUrl.searchParams];
  if (query.length !== 1 || query[0][0] !== 'sha256' || query[0][1] !== binding.sha256 || requestUrl.hash) return;
  return binding;
}

export function isExactG678P034SourceAudioRequest(request: Request, env: G678PreviewEnvironment): boolean {
  if (!isG678LocalPreviewEnabled(env) || env.HELP_MATH_G678_SOURCE_AUDIO_PREVIEW !== 'true' ||
    !['GET', 'HEAD'].includes(request.method)) return false;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || !exactAsset(url)) return false;
  const headers = request.headers;
  const mode = headers.get('sec-fetch-mode'), dest = headers.get('sec-fetch-dest');
  if (headers.get('sec-fetch-site') !== 'same-origin' || !['cors', 'no-cors'].includes(mode ?? '') ||
    !['audio', 'empty'].includes(dest ?? '') || dest === 'empty' && mode !== 'cors') return false;
  try {
    const referer = new URL(headers.get('referer') ?? '');
    if (referer.origin !== url.origin || referer.username || referer.password ||
      !/^\/(?:en\/|es\/)?migration-status\/g678-calibration\/shared-alg001-l11-p034$/u.test(referer.pathname)) return false;
    const origin = headers.get('origin');
    // Same-origin GET fetches and crossorigin audio can omit Origin. The exact
    // Fetch Metadata + referring page checks above remain mandatory; a present
    // Origin may never name a different host, protocol or port.
    if (origin !== null && origin !== url.origin) return false;
    for (const name of ['host', 'x-forwarded-host']) {
      const host = headers.get(name);
      if (host !== null && host !== url.host) return false;
    }
    return true;
  } catch {return false;}
}

async function readExactSingleFile(root: string, binding: Binding): Promise<Buffer | undefined> {
  let handle;
  try {
    if (!path.isAbsolute(root) || path.resolve(root) !== root || await realpath(root) !== root) return;
    let target = root;
    const parts = binding.path.split('/');
    for (const part of parts.slice(0, -1)) {
      if (!part || part === '.' || part === '..') return;
      target = path.join(target, part);
      const stat = await lstat(target);
      if (!stat.isDirectory() || stat.isSymbolicLink()) return;
    }
    target = path.join(root, binding.path);
    const before = await lstat(target, {bigint: true});
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n ||
      before.size !== BigInt(binding.bytes) || await realpath(target) !== target) return;
    handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = await handle.stat({bigint: true});
    const same = (stat: typeof before) => stat.isFile() && stat.nlink === 1n &&
      ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs'].every(key =>
        stat[key as keyof typeof before] === before[key as keyof typeof before]);
    if (!same(opened)) return;
    // Fixed-size read bounds memory even if another process grows the file.
    const bytes = Buffer.alloc(binding.bytes);
    let position = 0;
    while (position < bytes.length) {
      const read = await handle.read(bytes, position, bytes.length - position, position);
      if (!read.bytesRead) return;
      position += read.bytesRead;
    }
    if (!same(await handle.stat({bigint: true})) || !same(await lstat(target, {bigint: true})) ||
      await realpath(target) !== target || encodeHash(bytes) !== binding.sha256) return;
    return bytes;
  } catch {return;}
  finally {await handle?.close();}
}

export function g678P034AudioByteRange(header: string | null, byteLength: number) {
  if (header === null) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header);
  if (!Number.isSafeInteger(byteLength) || byteLength < 1 || !match || !match[1] && !match[2]) return 'unsatisfiable';
  if (!match[1]) {
    const length = Number(match[2]);
    return Number.isSafeInteger(length) && length > 0
      ? {start: Math.max(0, byteLength - length), end: byteLength - 1} : 'unsatisfiable';
  }
  const start = Number(match[1]), end = match[2] ? Number(match[2]) : byteLength - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start < byteLength && end >= start
    ? {start, end: Math.min(end, byteLength - 1)} : 'unsatisfiable';
}

/** Unrouted candidate handler: exact two payloads only, independent of the
 * product's audio-enabled state. A future route must keep these gates intact. */
export async function g678P034SourceAudioResponse(request: Request, {
  workspaceRoot, env = process.env,
}: {workspaceRoot: string; env?: G678PreviewEnvironment}): Promise<Response> {
  const headers = new Headers({
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    'Vary': 'Origin, Referer, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  });
  if (!isExactG678P034SourceAudioRequest(request, env)) return new Response(null, {status: 404, headers});
  const asset = exactAsset(new URL(request.url))!;
  const manifestBytes = await readExactSingleFile(workspaceRoot, G678_P034_SOURCE_AUDIO_MANIFEST);
  if (!manifestBytes) return new Response(null, {status: 404, headers});
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (manifest.animationId !== 'shared-alg001-l11-p034' || manifest.audio.integrated !== false ||
    !manifest.audio.assets.some((value: Binding) => JSON.stringify(value) === JSON.stringify(asset)))
    return new Response(null, {status: 404, headers});
  const bytes = await readExactSingleFile(workspaceRoot, asset);
  if (!bytes) return new Response(null, {status: 404, headers});
  headers.set('Accept-Ranges', 'bytes'); headers.set('Content-Type', 'audio/mpeg');
  headers.set('ETag', `"${asset.sha256}"`);
  headers.set('X-Helpmath-G678-Asset', 'local-source-audio-candidate-only');
  // Ignore Range if If-Range does not exactly name this strong entity tag.
  const rangeHeader = request.method === 'HEAD' || request.headers.get('if-range') !== null && request.headers.get('if-range') !== headers.get('etag')
    ? null : request.headers.get('range');
  const range = g678P034AudioByteRange(rangeHeader, bytes.length);
  if (range === 'unsatisfiable') {
    headers.set('Content-Range', `bytes */${bytes.length}`);
    return new Response(null, {status: 416, headers});
  }
  const body = range ? bytes.subarray(range.start, range.end + 1) : bytes;
  headers.set('Content-Length', String(body.length));
  if (range) headers.set('Content-Range', `bytes ${range.start}-${range.end}/${bytes.length}`);
  return new Response(request.method === 'HEAD' ? null : new Uint8Array(body), {status: range ? 206 : 200, headers});
}
