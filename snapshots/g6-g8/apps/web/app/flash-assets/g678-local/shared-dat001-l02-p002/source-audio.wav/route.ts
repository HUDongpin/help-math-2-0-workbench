import {notFound} from 'next/navigation';
import {isDatL02P002SourceAudioRequest} from
  '@/lib/dat-l02-p002-source-audio-access';
import {readDatL02P002SourceAudio} from
  '@/lib/g678-dat-l02-p002-candidate.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isDatL02P002SourceAudioRequest({
    method: request.method, url: new URL(request.url), headers: request.headers,
  })) notFound();
  let bytes: Buffer;
  try { bytes = readDatL02P002SourceAudio(); } catch { notFound(); }
  const range = request.headers.get('range');
  const common = {
    'Content-Type': 'audio/wav',
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Accept-Ranges': 'bytes',
    'Vary': 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest, Range',
  };
  if (range === null) {
    return new Response(new Uint8Array(bytes), {
      headers: {...common, 'Content-Length': String(bytes.length)},
    });
  }
  const match = /^bytes=(\d+)-(\d*)$/u.exec(range);
  if (!match) return new Response(null, {
    status: 416,
    headers: {...common, 'Content-Range': `bytes */${bytes.length}`},
  });
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : bytes.length - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start >= bytes.length || end < start || end >= bytes.length) {
    return new Response(null, {
      status: 416,
      headers: {...common, 'Content-Range': `bytes */${bytes.length}`},
    });
  }
  const slice = bytes.subarray(start, end + 1);
  return new Response(new Uint8Array(slice), {status: 206, headers: {
    ...common, 'Content-Length': String(slice.length),
    'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
  }});
}
