import {notFound} from 'next/navigation';
import {ALG_L6_P003_CANVAS_SHA256} from '@/lib/g678-alg-l06-p003-probe-access';
import {isG678LocalPreviewRequestUrl, isG678SameOriginCanvasAssetRequest} from '@/lib/g678-preview-policy';

const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  :import('@/lib/alg-l06-p003-canonical-resources-v1.server');

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const url = new URL(request.url), query = [...url.searchParams.entries()];
  if (process.env.NODE_ENV!=='development' ||
    !isG678LocalPreviewRequestUrl(url) || !isG678SameOriginCanvasAssetRequest(request.headers, url) ||
    query.length !== 1 || query[0][0] !== 'sha256' || query[0][1] !== ALG_L6_P003_CANVAS_SHA256) notFound();
  let bytes: Buffer;
  try {const source=await loadSource();if(!source)notFound();
    bytes=source.readP003CanonicalCanvas();} catch {notFound();}
  return new Response(new Uint8Array(bytes), {headers: {
    'Cache-Control': 'private, no-store, max-age=0', 'Content-Length': String(bytes.length),
    'Content-Type': 'text/javascript; charset=utf-8', 'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    Vary: 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
