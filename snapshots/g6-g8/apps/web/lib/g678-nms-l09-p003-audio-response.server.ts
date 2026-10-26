import 'server-only';

import {isNmsL09P003AudioRequest} from './g678-nms-l09-p003-audio-access';
import {resolveNmsL09P003CandidateAudio} from './g678-nms-l09-p003-candidate.server';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Vary': 'Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
};

export async function p003AudioResponse(request: Request): Promise<Response> {
  const denied = () => new Response(null, {status: 404, headers: privateHeaders});
  if (!isNmsL09P003AudioRequest({
    method: request.method, url: new URL(request.url), headers: request.headers,
  })) return denied();
  const source = await resolveNmsL09P003CandidateAudio();
  if (!source) return denied();
  return new Response(new Uint8Array(source.bytes), {headers: {
    ...privateHeaders,
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(source.bytes.length),
  }});
}
