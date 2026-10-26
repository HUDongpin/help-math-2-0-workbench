import {notFound} from 'next/navigation';

import {algL12P006Canvas} from '@/lib/g678-alg-l12-p006.server';
import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest,
} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';

const RUNTIME_SHA = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
const RUNTIME_BYTES = 11507597;

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!isG678LocalPreviewRequestUrl(url) ||
    !isG678LocalPreviewRequestHeaders(request.headers) ||
    !isG678SameOriginCanvasAssetRequest(request.headers, url)) notFound();
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0]?.[0] !== 'sha256' ||
    query[0]?.[1] !== RUNTIME_SHA) notFound();
  let runtime;
  try { runtime = algL12P006Canvas(); } catch { notFound(); }
  if (runtime.sha256 !== RUNTIME_SHA ||
    runtime.bytes.length !== RUNTIME_BYTES) notFound();
  return new Response(new Uint8Array(runtime.bytes), {headers: {
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Length': String(runtime.bytes.length),
    'Content-Type': 'text/javascript; charset=utf-8',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    'Vary': 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
