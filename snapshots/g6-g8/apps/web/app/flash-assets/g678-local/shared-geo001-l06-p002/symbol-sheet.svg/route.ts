import {notFound} from 'next/navigation';
import {isGeoL06P002SheetRequest} from '@/lib/g678-geo-l06-p002-asset-access';
import {readGeoL06P002Sheet} from '@/lib/g678-geo-l06-p002-asset.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isGeoL06P002SheetRequest({method: request.method, url: new URL(request.url),
    headers: request.headers})) notFound();
  let sheet: Buffer;
  try { sheet = readGeoL06P002Sheet(); } catch { notFound(); }
  return new Response(new Uint8Array(sheet), {headers: {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename="geo-l06-p002-symbol-sheet.svg"',
    'Content-Length': String(sheet.length),
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    Vary: 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
