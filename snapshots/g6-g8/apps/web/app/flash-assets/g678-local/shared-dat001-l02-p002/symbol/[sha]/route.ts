import {notFound} from 'next/navigation';
import {isDatL02P002SymbolRequest} from '@/lib/dat-l02-p002-symbol-access';
import {readDatL02P002Symbol} from '@/lib/g678-dat-l02-p002-candidate.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, {params}: {params: Promise<{sha: string}>}) {
  if (!isDatL02P002SymbolRequest({
    method: request.method, url: new URL(request.url), headers: request.headers,
  })) notFound();
  const {sha} = await params;
  let bytes: Buffer;
  try {bytes = readDatL02P002Symbol(sha);} catch {notFound();}
  return new Response(new Uint8Array(bytes), {headers: {
    'Content-Type': 'image/svg+xml',
    'Content-Length': String(bytes.length),
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    'Vary': 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
