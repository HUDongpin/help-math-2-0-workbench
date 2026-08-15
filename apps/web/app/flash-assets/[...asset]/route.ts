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
  hasSafeFlashAssetSegments,
  hasExactG5L4RuntimeDigest,
  isG5L4PreviewAssetAuthorized,
  isG5L4ShowcaseAssetAuthorized,
  isG5L4ShowcaseAssetSegments,
} from '@/lib/g5-l4-preview-asset-policy';

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

export async function GET(
  request: Request,
  {params}: {params: Promise<{asset: string[]}>}
) {
  const {asset} = await params;
  if (!hasSafeFlashAssetSegments(asset)) notFound();
  const root = path.resolve(getWorkspaceRoot(), 'public/flash-assets');
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
    if (!isG5L4PreviewAssetAuthorized({
      developmentAudit: process.env.NODE_ENV !== 'production',
      showcaseEnabled: isG5L4ShowcaseAssetAuthorized(),
      showcaseAsset: g5L4ShowcaseAsset,
    })) {
      notFound();
    }
    if (
      policy.kind === 'runtime'
      && !hasExactG5L4RuntimeDigest(
        new URL(request.url),
        policy.expectedRuntimeSha256 as string
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
      && (policy.kind === 'runtime' || policy.kind === 'shell')
      && sha256(bytes) !== policy.expectedRuntimeSha256
    ) {
      notFound();
    }
    const extension = path.extname(target).toLowerCase();
    return new Response(bytes, {
      headers: {
        'Content-Type': types[extension] ?? 'application/octet-stream',
        'Cache-Control': policy.controlled
          || g4HostCompositePolicy.controlled
          ? 'private, no-store, max-age=0'
          : extension === '.html'
            ? 'no-store'
            : 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    notFound();
  }
}
