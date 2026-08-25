import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {notFound} from 'next/navigation';

import {getWorkspaceRoot} from '@/lib/catalog';
import {
  classifyG4L3HostCompositeAsset,
  hasExactG4L3HostCompositeDigest,
} from '@/lib/g4-l3-host-composite-asset-policy';
import {
  isG4L3ShowcaseAssetAuthorized,
  isG4L3ShowcaseAssetSegments,
} from '@/lib/g4-l3-showcase-asset-policy';
import {
  classifyG5L4PreviewAsset,
  hasExactG5L4AudioDigest,
  hasSafeFlashAssetSegments,
  hasExactG5L4RuntimeDigest,
  isG5L4PreviewAssetAuthorized,
  isG5L4ShowcaseAudioAuthorized,
  isG5L4ShowcaseAssetAuthorized,
  isG5L4ShowcaseAssetSegments,
} from '@/lib/g5-l4-preview-asset-policy';
import {
  isPageOnlyCurrentJsShowcaseAssetAuthorized,
  isPageOnlyCurrentJsShowcaseAssetSegments,
} from '@/lib/page-only-current-js-showcase-asset-policy';
import {
  isContentAddressedCanvasAssetBranch,
  parseContentAddressedCanvasAssetSegments,
} from '@/lib/content-addressed-canvas-asset-policy';
import {
  loadActiveCurrentJsProductionAssetsV2,
  readContentAddressedCanvasAsset,
} from '@/lib/content-addressed-canvas-asset-profile.server';

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.js': 'text/javascript; charset=utf-8'
};

const sha256 = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

type ByteRange = Readonly<{start: number; end: number}>;

let activeCurrentJsProductionAssetsV2Promise: ReturnType<
  typeof loadActiveCurrentJsProductionAssetsV2
> | undefined;

function activeCurrentJsProductionAssetsV2() {
  activeCurrentJsProductionAssetsV2Promise ??=
    loadActiveCurrentJsProductionAssetsV2({
      workspaceRoot: getWorkspaceRoot(),
    });
  return activeCurrentJsProductionAssetsV2Promise;
}

function resolveByteRange(
  header: string | null,
  byteLength: number,
): ByteRange | null | 'unsatisfiable' {
  if (header === null) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header);
  if (!match || (!match[1] && !match[2]) || byteLength < 1) {
    return 'unsatisfiable';
  }
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength < 1) {
      return 'unsatisfiable';
    }
    return Object.freeze({
      start: Math.max(0, byteLength - suffixLength),
      end: byteLength - 1,
    });
  }
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : byteLength - 1;
  if (
    !Number.isSafeInteger(start)
    || !Number.isSafeInteger(requestedEnd)
    || start < 0
    || start >= byteLength
    || requestedEnd < start
  ) {
    return 'unsatisfiable';
  }
  return Object.freeze({
    start,
    end: Math.min(requestedEnd, byteLength - 1),
  });
}

function assetResponse({
  request,
  bytes,
  extension,
  cacheControl,
  etag,
}: {
  request: Request;
  bytes: Buffer;
  extension: string;
  cacheControl: string;
  etag?: string;
}) {
  const range = resolveByteRange(request.headers.get('range'), bytes.length);
  if (range === 'unsatisfiable') {
    return new Response(null, {
      status: 416,
      headers: {
        'Accept-Ranges': 'bytes',
        'Cache-Control': cacheControl,
        'Content-Range': `bytes */${bytes.length}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  const responseBytes = range
    ? bytes.subarray(range.start, range.end + 1)
    : bytes;
  const responseHeaders = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl,
    'Content-Length': String(responseBytes.length),
    'Content-Type': types[extension] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  if (etag) responseHeaders.set('ETag', etag);
  if (range) {
    responseHeaders.set(
      'Content-Range',
      `bytes ${range.start}-${range.end}/${bytes.length}`,
    );
  }
  const responseBody = responseBytes.buffer instanceof ArrayBuffer
    ? new Uint8Array(
        responseBytes.buffer,
        responseBytes.byteOffset,
        responseBytes.byteLength,
      )
    : Uint8Array.from(responseBytes);
  return new Response(responseBody, {
    status: range ? 206 : 200,
    headers: responseHeaders,
  });
}

export async function GET(
  request: Request,
  {params}: {params: Promise<{asset: string[]}>}
) {
  const {asset} = await params;
  const contentAddressedCanvas =
    parseContentAddressedCanvasAssetSegments(asset);
  if (isContentAddressedCanvasAssetBranch(asset)) {
    if (!contentAddressedCanvas || new URL(request.url).search !== '') {
      notFound();
    }
    // The historical host-composite digest governs only the legacy query URL.
    // A v2 host URL is authorized by its exact parsed path, the G4 L3
    // publication gate, and the active profile's path/hash/bytes closure below.
    if (
      contentAddressedCanvas.kind === 'ir001-loaded-host'
      && process.env.NODE_ENV === 'production'
      && !isG4L3ShowcaseAssetAuthorized()
    ) {
      notFound();
    }
    const profile = await activeCurrentJsProductionAssetsV2();
    if (!profile) notFound();
    const resolved = await readContentAddressedCanvasAsset({
      workspaceRoot: getWorkspaceRoot(),
      request: contentAddressedCanvas,
      profile,
    });
    if (!resolved) notFound();
    return assetResponse({
      request,
      bytes: resolved.bytes,
      extension: '.js',
      cacheControl: 'public, max-age=31536000, immutable',
      etag: `"sha256-${resolved.sha256}"`,
    });
  }
  if (!hasSafeFlashAssetSegments(asset)) notFound();
  const requestedG5Policy = classifyG5L4PreviewAsset(asset);
  const root = path.resolve(
    getWorkspaceRoot(),
    requestedG5Policy.kind === 'audio'
      ? 'apps/web/server-assets/flash-assets'
      : 'public/flash-assets',
  );
  const target = path.resolve(root, ...asset);
  if (
    target === root
    || !target.startsWith(`${root}${path.sep}`)
  ) {
    notFound();
  }
  const canonicalAsset = path.relative(root, target).split(path.sep);
  const g4HostCompositePolicy =
    classifyG4L3HostCompositeAsset(canonicalAsset);
  const g4L3ShowcaseAsset = isG4L3ShowcaseAssetSegments(canonicalAsset);
  const policy = classifyG5L4PreviewAsset(canonicalAsset);
  const g5L4ShowcaseAsset = isG5L4ShowcaseAssetSegments(canonicalAsset);
  const pageOnlyCurrentJsShowcaseAsset =
    isPageOnlyCurrentJsShowcaseAssetSegments(canonicalAsset);

  if (
    pageOnlyCurrentJsShowcaseAsset
    && process.env.NODE_ENV === 'production'
    && !isPageOnlyCurrentJsShowcaseAssetAuthorized(canonicalAsset)
  ) {
    notFound();
  }

  if (
    g4L3ShowcaseAsset
    && process.env.NODE_ENV === 'production'
    && !isG4L3ShowcaseAssetAuthorized()
  ) {
    notFound();
  }

  if (
    g4HostCompositePolicy.controlled
    && !hasExactG4L3HostCompositeDigest(
      new URL(request.url),
      g4HostCompositePolicy.expectedSha256 as string
    )
  ) {
    notFound();
  }

  if (policy.controlled) {
    const assetAuthorized = policy.kind === 'audio'
      ? isG5L4ShowcaseAudioAuthorized()
      : isG5L4PreviewAssetAuthorized({
          developmentAudit: process.env.NODE_ENV !== 'production',
          showcaseEnabled: isG5L4ShowcaseAssetAuthorized(),
          showcaseAsset: g5L4ShowcaseAsset,
        });
    if (!assetAuthorized) {
      notFound();
    }
    const requestUrl = new URL(request.url);
    if (
      (
        policy.kind === 'runtime'
        && !hasExactG5L4RuntimeDigest(
          requestUrl,
          policy.expectedSha256 as string
        )
      )
      || (
        policy.kind === 'audio'
        && !hasExactG5L4AudioDigest(
          requestUrl,
          policy.expectedSha256 as string
        )
      )
    ) {
      notFound();
    }
  }

  try {
    const [realRoot, targetEntry] = await Promise.all([
      realpath(root),
      lstat(target),
    ]);
    if (targetEntry.isSymbolicLink() || !targetEntry.isFile()) notFound();
    const realTarget = await realpath(target);
    if (
      realTarget === realRoot
      || !realTarget.startsWith(`${realRoot}${path.sep}`)
    ) {
      notFound();
    }
    const bytes = await readFile(realTarget);
    if (
      g4HostCompositePolicy.controlled
      && sha256(bytes) !== g4HostCompositePolicy.expectedSha256
    ) {
      notFound();
    }
    if (
      policy.controlled
      && (
        policy.kind === 'runtime'
        || policy.kind === 'shell'
        || policy.kind === 'audio'
      )
      && sha256(bytes) !== policy.expectedSha256
    ) {
      notFound();
    }
    const extension = path.extname(target).toLowerCase();
    const cacheControl = policy.controlled || g4HostCompositePolicy.controlled
      ? 'private, no-store, max-age=0'
      : extension === '.html'
        ? 'no-store'
        : 'public, max-age=31536000, immutable';
    return assetResponse({
      request,
      bytes,
      extension,
      cacheControl,
    });
  } catch {
    notFound();
  }
}
