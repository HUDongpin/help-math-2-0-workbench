import {notFound} from 'next/navigation';
import {nmsL1P029Canvas} from '@/lib/g678-nms-l01-p029.server';
import {isG678LocalPreviewRequestUrl, isG678SameOriginCanvasAssetRequest} from '@/lib/g678-preview-policy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!isG678LocalPreviewRequestUrl(url) || !isG678SameOriginCanvasAssetRequest(request.headers, url)) notFound();
  let runtime;
  try {runtime = nmsL1P029Canvas();} catch {notFound();}
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0][0] !== 'sha256' || query[0][1] !== runtime.sha256) notFound();
  return new Response(new Uint8Array(runtime.bytes), {headers: {
    'Cache-Control': 'private, no-store, max-age=0', 'Content-Length': String(runtime.bytes.length),
    'Content-Type': 'text/javascript; charset=utf-8', 'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    'Vary': 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
