import {algL12P006Audio} from '@/lib/g678-alg-l12-p006-audio.server';
import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';

const AUDIO_SHA = '801d34dc684341a2644a7fcc3373bea98cbc14bdf91f4364db0e37c30e7c1803';
const AUDIO_BYTES = 140920;
const AUDIO_PATH = '/flash-assets/g678-local/shared-alg001-l12-p006/source-audio';
const denied = () => new Response(null, {status: 404, headers: {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
}});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headers = request.headers;
  if (request.method !== 'GET' || !isG678LocalPreviewRequestUrl(url) ||
      !isG678LocalPreviewRequestHeaders(headers) ||
      url.protocol !== 'http:' || url.username || url.password || url.hash ||
      url.pathname !== AUDIO_PATH ||
      (headers.get('x-forwarded-host') !== null &&
        headers.get('x-forwarded-host') !== headers.get('host')) ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      !['cors', 'no-cors'].includes(headers.get('sec-fetch-mode') ?? '') ||
      !['empty', 'audio'].includes(headers.get('sec-fetch-dest') ?? '') ||
      headers.get('range') !== null) return denied();
  try {
    // Next normalizes Request.url to localhost, while Host/Referer retain the
    // actual loopback origin. Bind browser origin to Host and preserve the port.
    const browserOrigin = new URL(`http://${headers.get('host')}`);
    if (browserOrigin.host !== headers.get('host') || browserOrigin.port !== url.port ||
        browserOrigin.pathname !== '/' || browserOrigin.username || browserOrigin.password ||
        new URL(headers.get('referer') ?? '').origin !== browserOrigin.origin ||
        (headers.get('origin') !== null &&
          new URL(headers.get('origin')!).origin !== browserOrigin.origin)) return denied();
  } catch { return denied(); }
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0]?.[0] !== 'sha256' ||
      query[0]?.[1] !== AUDIO_SHA) return denied();
  let audio;
  try { audio = algL12P006Audio(); } catch { return denied(); }
  if (audio.sha256 !== AUDIO_SHA || audio.bytes.length !== AUDIO_BYTES) return denied();
  return new Response(new Uint8Array(audio.bytes), {headers: {
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Length': String(audio.bytes.length),
    'Content-Type': 'audio/mpeg',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    'Vary': 'Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
