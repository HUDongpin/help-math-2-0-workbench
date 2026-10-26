import {notFound} from 'next/navigation';
import {isP001AudioRequest} from '@/lib/nms-l02-p001-audio-access';
import {readNmsL2P001Audio} from '@/lib/g678-nms-l02-p001.server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!isP001AudioRequest({method: request.method, url: new URL(request.url), headers: request.headers})) notFound();
  let bytes;
  try {bytes = readNmsL2P001Audio();} catch {notFound();}
  return new Response(new Uint8Array(bytes), {headers: {'Content-Type': 'audio/mpeg', 'Content-Length': String(bytes.length),
    'Cache-Control': 'private, no-store, max-age=0', 'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Vary': 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'}});
}
