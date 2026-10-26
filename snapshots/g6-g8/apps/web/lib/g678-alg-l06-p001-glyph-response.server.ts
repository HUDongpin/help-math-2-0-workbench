import 'server-only';
import {p001GlyphId} from './g678-alg-l06-p001-glyph-access';
import {loadP001LocalGlyphs} from './g678-alg-l06-p001-local-assets.server';

const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Vary': 'Host, Referer, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
};

export function p001GlyphResponse(request: Request): Response {
  const id = p001GlyphId({method: request.method,
    url: new URL(request.url), headers: request.headers});
  if (!id) return new Response(null, {status: 404, headers});
  let glyphs: readonly [string, string];
  try { glyphs = loadP001LocalGlyphs(); } catch {
    return new Response(null, {status: 404, headers});
  }
  const uri = glyphs[id === '140' ? 0 : 1];
  const bytes = Buffer.from(uri.slice('data:image/svg+xml;base64,'.length), 'base64');
  return new Response(new Uint8Array(bytes), {headers: {
    ...headers, 'Content-Type': 'image/svg+xml; charset=utf-8',
    'Content-Length': String(bytes.length),
  }});
}
