import {notFound} from 'next/navigation';

import {resolveG678LocalCanvasRuntime} from
  '@/lib/g678-local-runtime-asset.server';
import {
  isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest,
} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  {params}: {params: Promise<{animationId: string}>},
) {
  const requestUrl = new URL(request.url);
  if (
    !isG678LocalPreviewRequestUrl(requestUrl) ||
    !isG678SameOriginCanvasAssetRequest(request.headers, requestUrl)
  ) notFound();
  const {animationId} = await params;
  const runtime = await resolveG678LocalCanvasRuntime(animationId);
  if (!runtime) notFound();
  const query = [...requestUrl.searchParams.entries()];
  if (
    query.length !== 1 || query[0]?.[0] !== 'sha256' ||
    query[0]?.[1] !== runtime.sha256
  ) notFound();
  return new Response(new Uint8Array(runtime.bytes), {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Length': String(runtime.bytes.length),
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Helpmath-G678-Asset': 'local-calibration-only',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
      'Vary': 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
    },
  });
}
