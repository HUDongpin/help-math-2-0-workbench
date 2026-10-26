import {algL12P010SourceAudio} from '@/lib/g678-alg-l12-p010-source-audio.server';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';

const AUDIO_PATH = '/flash-assets/g678-local/shared-alg001-l12-p010/source-audio.mp3';
const AUDIO_SHA = '2ab17de87e12c5f83c97ee15f95af50e5a9aa434977bfea970e60c087624482f';
const AUDIO_BYTES = 189020;
const denied = () => new Response(null, {status: 404, headers: {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
}});

export async function GET(request: Request) {
  const url = new URL(request.url), headers = request.headers;
  if (request.method !== 'GET' || !isG678LocalPreviewRequestUrl(url) ||
      !isG678LocalPreviewRequestHeaders(headers) || url.protocol !== 'http:' ||
      url.username || url.password || url.hash || url.pathname !== AUDIO_PATH ||
      url.search !== `?sha256=${AUDIO_SHA}` ||
      (headers.get('x-forwarded-host') !== null && headers.get('x-forwarded-host') !== headers.get('host')) ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      !['same-origin', 'cors', 'no-cors'].includes(headers.get('sec-fetch-mode') ?? '') ||
      !['empty', 'audio'].includes(headers.get('sec-fetch-dest') ?? '') || headers.get('range') !== null)
    return denied();
  try {
    // Next may normalize Request.url to localhost while the actual browser
    // Host/Referer remain 127.0.0.1. Bind their origin and the unmodified port.
    const browser = new URL(`http://${headers.get('host')}`), referer = new URL(headers.get('referer') ?? '');
    if (browser.host !== headers.get('host') || browser.port !== url.port ||
        browser.pathname !== '/' || browser.username || browser.password ||
        referer.origin !== browser.origin || referer.username || referer.password || referer.hash ||
        (headers.get('origin') !== null && headers.get('origin') !== browser.origin))
      return denied();
  } catch { return denied(); }
  let audio;
  try { audio = algL12P010SourceAudio(); } catch { return denied(); }
  if (audio.sha256 !== AUDIO_SHA || audio.bytes.length !== AUDIO_BYTES) return denied();
  return new Response(new Uint8Array(audio.bytes), {headers: {
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Length': String(audio.bytes.length),
    'Content-Type': 'audio/mpeg',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    'Vary': 'Host, X-Forwarded-Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
  }});
}
