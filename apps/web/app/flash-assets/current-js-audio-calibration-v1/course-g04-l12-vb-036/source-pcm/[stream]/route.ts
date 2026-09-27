import {isG4L12PrivateAudioCalibrationAllowed} from '@/lib/g4-l12-private-audio-calibration-access.server';
import {resolveG4L12PrivateAudioByteRange} from '@/lib/g4-l12-private-audio-calibration-assets.server';
import {g4L12Vb036PrivatePcmDescriptor, readG4L12Vb036PrivatePcm} from '@/lib/g4-l12-vb036-private-pcm.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE_PATH = '/flash-assets/current-js-audio-calibration-v1/course-g04-l12-vb-036/source-pcm';

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

function sameOriginRequest(request: Request, url: URL) {
  // The existing gate has already validated this Host as plain loopback authority.
  const host = new URL(`http://${request.headers.get('host')}`);
  const origin = request.headers.get('origin'), site = request.headers.get('sec-fetch-site');
  if (origin !== null && origin !== host.origin) return false;
  if (site !== null && site !== 'same-origin' && site !== 'none') return false;
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost !== null && new URL(`http://${forwardedHost}`).origin !== host.origin) return false;
  if (url.port !== host.port) return false;
  // Next's observed internal normalization is one-way only: incoming 127.0.0.1 -> localhost.
  // The client Origin is still checked against Host, never against this internal alias.
  return url.origin === host.origin || (host.hostname === '127.0.0.1' && url.hostname === 'localhost');
}

export async function GET(request: Request, context: {params: Promise<{stream: string}>}) {
  if (!isG4L12PrivateAudioCalibrationAllowed({headers: request.headers, url: request.url})) return notFoundResponse();
  const url = new URL(request.url);
  if (!sameOriginRequest(request, url)) return notFoundResponse();
  const {stream} = await context.params;
  const descriptor = g4L12Vb036PrivatePcmDescriptor(stream);
  if (!descriptor || url.pathname !== `${BASE_PATH}/${descriptor.stream}` ||
    url.search !== `?sha256=${descriptor.sha256}` || url.hash !== '') return notFoundResponse();
  const bytes = await readG4L12Vb036PrivatePcm(descriptor.stream);
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
