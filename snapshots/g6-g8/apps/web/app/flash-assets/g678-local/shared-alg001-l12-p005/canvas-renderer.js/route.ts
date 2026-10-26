import {notFound} from 'next/navigation';

import {algL12P005Canvas} from '@/lib/g678-alg-l12-p005.server';
import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest,
} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';

const RUNTIME_SHA = '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd';
const RUNTIME_BYTES = 19449678;

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!isG678LocalPreviewRequestUrl(url) ||
    !isG678LocalPreviewRequestHeaders(request.headers) ||
    !isG678SameOriginCanvasAssetRequest(request.headers, url)) notFound();
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0]?.[0] !== 'sha256' ||
    query[0]?.[1] !== RUNTIME_SHA) notFound();
  let runtime;
  try { runtime = algL12P005Canvas(); } catch { notFound(); }
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
