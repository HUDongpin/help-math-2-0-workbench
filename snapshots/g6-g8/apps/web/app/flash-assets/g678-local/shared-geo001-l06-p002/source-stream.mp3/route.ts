import {notFound} from 'next/navigation';
import {isGeoL06P002StreamRequest} from '@/lib/g678-geo-l06-p002-asset-access';
import {readGeoL06P002Stream} from '@/lib/g678-geo-l06-p002-asset.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isGeoL06P002StreamRequest({method: request.method,
    url: new URL(request.url), headers: request.headers})) notFound();
  let stream: Buffer;
  try { stream = readGeoL06P002Stream(); } catch { notFound(); }
  return new Response(new Uint8Array(stream), {headers: {
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(stream.length),
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    Vary: 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
