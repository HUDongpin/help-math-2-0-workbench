import 'server-only';
import {isP001AudioRequest} from './g678-alg-l06-p001-audio-access';
import {loadP001LocalAudio} from './g678-alg-l06-p001-local-assets.server';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Vary': 'Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
};

export function p001AudioResponse(request: Request): Response {
  const denied = () => new Response(null, {status: 404, headers: privateHeaders});
  if (!isP001AudioRequest({
    method: request.method, url: new URL(request.url), headers: request.headers,
  })) return denied();
  let bytes: Buffer;
  try { bytes = loadP001LocalAudio(); } catch { return denied(); }
  return new Response(new Uint8Array(bytes), {headers: {
    ...privateHeaders, 'Content-Type': 'audio/mpeg',
    'Content-Length': String(bytes.length),
  }});
}
