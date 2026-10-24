import {
  isG4L12PrivateAudioCalibrationAllowed,
} from '@/lib/g4-l12-private-audio-calibration-access.server';
import {
  readG4L12PrivateAudioCalibrationAsset,
  resolveG4L12PrivateAudioByteRange,
} from '@/lib/g4-l12-private-audio-calibration-assets.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    headers: {
      ...privateHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export async function GET(
  request: Request,
  {params}: {
    params: Promise<{animationId: string; assetFile: string}>;
  },
) {
  if (!isG4L12PrivateAudioCalibrationAllowed({
    headers: request.headers,
    url: request.url,
  })) {
    return notFoundResponse();
  }

  const {animationId, assetFile} = await params;
  if (
    !/^course-g04-l12-vb-03[56]$/u.test(animationId) ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\.mp3$/u.test(assetFile)
  ) {
    return notFoundResponse();
  }
  const requestUrl = new URL(request.url);
  const expectedPathname =
    `/flash-assets/current-js-audio-calibration-v1/${animationId}/${assetFile}`;
  if (requestUrl.pathname !== expectedPathname) return notFoundResponse();

  const loaded = await readG4L12PrivateAudioCalibrationAsset(
    animationId,
    assetFile,
  );
  if (!loaded || requestUrl.search !== `?sha256=${loaded.asset.sha256}`) {
    return notFoundResponse();
  }

  const range = resolveG4L12PrivateAudioByteRange(
    request.headers.get('range'),
    loaded.bytes.length,
  );
  if (range === 'unsatisfiable') {
    return new Response(null, {
      status: 416,
      headers: {
        ...privateHeaders(),
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes */${loaded.bytes.length}`,
      },
    });
  }
  const responseBytes = range
    ? loaded.bytes.subarray(range.start, range.end + 1)
    : loaded.bytes;
  const responseBody = new Uint8Array(responseBytes);
  const responseHeaders = new Headers({
    ...privateHeaders(),
    'Accept-Ranges': 'bytes',
    'Content-Length': String(responseBytes.length),
    'Content-Type': 'audio/mpeg',
    'X-Helpmath-Audio-Authority': 'private-engineering-calibration-only',
  });
  if (range) {
    responseHeaders.set(
      'Content-Range',
      `bytes ${range.start}-${range.end}/${loaded.bytes.length}`,
    );
  }
  return new Response(responseBody, {
    status: range ? 206 : 200,
    headers: responseHeaders,
  });
}
