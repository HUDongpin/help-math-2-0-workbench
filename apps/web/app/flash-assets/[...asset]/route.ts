import {createHash} from 'node:crypto';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';

import {notFound} from 'next/navigation';

import {getCatalog, getWorkspaceRoot, isAnimationPublished} from '@/lib/catalog';
import {
  classifyG4L3HostCompositeAsset,
  hasExactG4L3HostCompositeDigest,
} from '@/lib/g4-l3-host-composite-asset-policy';
import {isG5L4ExecutivePreviewEnabled} from '@/lib/g5-l4-executive-preview';
import {
  classifyG5L4PreviewAsset,
  hasSafeFlashAssetSegments,
  hasExactG5L4RuntimeDigest,
  isG5L4PreviewAssetAuthorized
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
  const policy = classifyG5L4PreviewAsset(canonicalAsset);

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
    let published = false;
    try {
      published = isAnimationPublished(
        getCatalog(),
        policy.animationId as string
      );
    } catch {
      notFound();
    }
    if (!isG5L4PreviewAssetAuthorized({
      developmentAudit: process.env.NODE_ENV !== 'production',
      previewEnabled: isG5L4ExecutivePreviewEnabled(),
      published
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
    if (!(await stat(target)).isFile()) notFound();
    const bytes = await readFile(target);
    if (
      g4HostCompositePolicy.controlled
      && sha256(bytes) !== g4HostCompositePolicy.expectedSha256
    ) {
      notFound();
    }
    if (
      policy.controlled
      && policy.kind === 'runtime'
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
