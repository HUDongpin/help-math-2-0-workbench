import {algL12P006SpanishAudio} from '@/lib/g678-alg-l12-p006-spanish-audio.server';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';
const SHA = '86fdbdeb0fec8cd6b9682d75ec436e4db370d56ba23e48efc47cf00c374c64bf';
const AUDIO_PATH = '/flash-assets/g678-local/shared-alg001-l12-p006/spanish-audio';
const denied = () => new Response(null, {status: 404, headers: {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
}});

/** Local explicit-SA resource only. Locale does not request or start this audio. */
export async function GET(request: Request) {
  const url = new URL(request.url), headers = request.headers;
  if (request.method !== 'GET' || !isG678LocalPreviewRequestUrl(url) ||
      !isG678LocalPreviewRequestHeaders(headers) || url.protocol !== 'http:' ||
      url.username || url.password || url.hash || url.pathname !== AUDIO_PATH ||
      (headers.get('x-forwarded-host') !== null && headers.get('x-forwarded-host') !== headers.get('host')) ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      !['cors', 'no-cors'].includes(headers.get('sec-fetch-mode') ?? '') ||
      !['empty', 'audio'].includes(headers.get('sec-fetch-dest') ?? '') ||
      headers.has('range')) return denied();
  try {
    // Next may normalize Request.url; preserve the exact validated browser Host.
    const origin = new URL(`http://${headers.get('host')}`);
    if (origin.host !== headers.get('host') || origin.port !== url.port ||
        origin.pathname !== '/' || origin.username || origin.password ||
        new URL(headers.get('referer') ?? '').origin !== origin.origin ||
        (headers.has('origin') && new URL(headers.get('origin')!).origin !== origin.origin)) return denied();
  } catch { return denied(); }
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0]?.[0] !== 'sha256' || query[0]?.[1] !== SHA) return denied();
  try {
    const audio = algL12P006SpanishAudio();
    if (audio.sha256 !== SHA || audio.bytes.length !== 214704) return denied();
    return new Response(new Uint8Array(audio.bytes), {headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Length': String(audio.bytes.length), 'Content-Type': 'audio/mpeg',
      'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
      'Vary': 'Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
    }});
  } catch { return denied(); }
}
