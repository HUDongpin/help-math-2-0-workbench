import {notFound} from 'next/navigation';
import {isP054RevealRequest} from '@/lib/nms-l02-p054-reveal-access';
const loadSource=()=>process.env.NODE_ENV==='production'?Promise.resolve(null)
  : import('@/lib/nms-l02-p054-reveal.server');

export const dynamic = 'force-dynamic';

export async function GET(request: Request, {params}: {
  params: Promise<{level: string; order: string}>;
}) {
  if(process.env.NODE_ENV!=='development')notFound();
  const {level, order} = await params;
  if (!isP054RevealRequest({method: request.method, url: new URL(request.url),
    headers: request.headers}, level, order)) notFound();
  let tile: Buffer;
  try {const source=await loadSource();if(!source)notFound();
    tile = source.readP054RevealTile(Number(level) as 1 | 2, Number(order));}
  catch {notFound();}
  return new Response(new Uint8Array(tile), {headers: {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Content-Length': String(tile.length),
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    Vary: 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
