import {isG4L12PrivateAudioCalibrationAllowed} from '@/lib/g4-l12-private-audio-calibration-access.server';
import {resolveG4L12PrivateAudioByteRange} from '@/lib/g4-l12-private-audio-calibration-assets.server';
import {readG4L12Vb035PrivatePcm} from '@/lib/g4-l12-vb035-private-pcm.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PATHNAME = '/flash-assets/current-js-audio-calibration-v1/course-g04-l12-vb-035/source-pcm';
const QUERY = '?sha256=081fa3562e96948e31b940131c9f6ee5b1e954cfc8e49a194b29ddc7cc1ed089';

function privateHeaders() {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
  };
}

function notFoundResponse() {
  return new Response('Not Found', {status: 404, headers: {
    ...privateHeaders(), 'Content-Type': 'text/plain; charset=utf-8',
  }});
}

export async function GET(request: Request) {
  if (!isG4L12PrivateAudioCalibrationAllowed({headers: request.headers, url: request.url})) return notFoundResponse();
  const url = new URL(request.url);
  if (url.pathname !== PATHNAME || url.search !== QUERY || url.hash !== '') return notFoundResponse();
  const bytes = await readG4L12Vb035PrivatePcm();
  if (bytes === null) return notFoundResponse();
  const range = resolveG4L12PrivateAudioByteRange(request.headers.get('range'), bytes.length);
  if (range === 'unsatisfiable') {
    return new Response(null, {status: 416, headers: {
      ...privateHeaders(), 'Accept-Ranges': 'bytes', 'Content-Range': `bytes */${bytes.length}`,
    }});
  }
  const responseBytes = range ? bytes.subarray(range.start, range.end + 1) : bytes;
  const headers = new Headers({
    ...privateHeaders(), 'Accept-Ranges': 'bytes', 'Content-Length': String(responseBytes.length),
    'Content-Type': 'audio/wav', 'X-Helpmath-Audio-Authority': 'private-engineering-calibration-only',
  });
  if (range) headers.set('Content-Range', `bytes ${range.start}-${range.end}/${bytes.length}`);
  return new Response(new Uint8Array(responseBytes), {status: range ? 206 : 200, headers});
}
