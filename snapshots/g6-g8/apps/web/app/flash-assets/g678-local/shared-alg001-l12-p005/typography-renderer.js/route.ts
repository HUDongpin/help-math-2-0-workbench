import {algL12P005Typography} from '@/lib/g678-alg-l12-p005-typography.server';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
  Vary: 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'};
export async function GET(request: Request) {
  const deny = () => new Response(null, {status: 404, headers});
  const url = new URL(request.url), query = [...url.searchParams.entries()];
  if (request.method !== 'GET' || request.headers.has('range') ||
    url.pathname !== '/flash-assets/g678-local/shared-alg001-l12-p005/typography-renderer.js' ||
    !isG678LocalPreviewRequestUrl(url) || !isG678LocalPreviewRequestHeaders(request.headers) ||
    !isG678SameOriginCanvasAssetRequest(request.headers, url) ||
    query.length !== 1 || query[0]?.[0] !== 'sha256') return deny();
  try {
    const runtime = algL12P005Typography();
    if (query[0][1] !== runtime.sha256) return deny();
    return new Response(new Uint8Array(runtime.bytes), {headers: {...headers,
      'Content-Length': String(runtime.bytes.length), 'Content-Type': 'text/javascript; charset=utf-8'}});
  } catch {return deny();}
}
