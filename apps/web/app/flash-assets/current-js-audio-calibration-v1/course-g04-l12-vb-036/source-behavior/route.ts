import {isG4L12PrivateAudioCalibrationAllowed} from '@/lib/g4-l12-private-audio-calibration-access.server';
import {readG4L12Vb036PrivateBehaviorScript} from '@/lib/g4-l12-vb036-private-behavior.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PATHNAME = '/flash-assets/current-js-audio-calibration-v1/course-g04-l12-vb-036/source-behavior';
const QUERY = '?sha256=0e957d8c210cb8bea7fb284055e38381c45bb9d08aa261e46bcd8a351c66eb9f';

function privateHeaders() {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
  };
}

function notFoundResponse() {
  return new Response('Not Found', {
    status: 404,
    headers: {...privateHeaders(), 'Content-Type': 'text/plain; charset=utf-8'},
  });
}

export async function GET(request: Request) {
  if (!isG4L12PrivateAudioCalibrationAllowed({headers: request.headers, url: request.url})) {
    return notFoundResponse();
  }
  const url = new URL(request.url);
  if (url.pathname !== PATHNAME || url.search !== QUERY || url.hash !== '') return notFoundResponse();
  const loaded = await readG4L12Vb036PrivateBehaviorScript();
  if (loaded === null || loaded.bytes.length > 2 * 1024 * 1024) return notFoundResponse();
  return new Response(new Uint8Array(loaded.bytes), {
    status: 200,
    headers: {
      ...privateHeaders(),
      'Content-Length': String(loaded.bytes.length),
      'Content-Type': 'application/javascript; charset=utf-8',
      'X-Helpmath-Behavior-Authority': 'private-engineering-source-composite-only',
    },
  });
}
