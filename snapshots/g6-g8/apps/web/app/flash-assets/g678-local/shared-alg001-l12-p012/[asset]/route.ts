import {isP012AssetName, p012Asset, P012_ASSET_PINS} from '@/lib/g678-alg-l12-p012-assets.server';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';

const PREFIX = '/flash-assets/g678-local/shared-alg001-l12-p012/';
const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
  Vary: 'Host, X-Forwarded-Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
};
const deny = () => new Response(null, {status: 404, headers: PRIVATE_HEADERS});

function sameOriginHeaders(request: Request, url: URL, script: boolean): boolean {
  const headers = request.headers;
  if (!isG678LocalPreviewRequestUrl(url) || !isG678LocalPreviewRequestHeaders(headers) ||
      url.protocol !== 'http:' || url.username || url.password || url.hash ||
      headers.get('range') !== null || headers.get('sec-fetch-site') !== 'same-origin' ||
      (headers.get('x-forwarded-host') !== null && headers.get('x-forwarded-host') !== headers.get('host')))
    return false;
  const mode = headers.get('sec-fetch-mode');
  const dest = headers.get('sec-fetch-dest');
  if (script ? (!['cors', 'no-cors'].includes(mode ?? '') || dest !== 'script') :
      (!['same-origin', 'cors', 'no-cors'].includes(mode ?? '') || !['audio', 'empty'].includes(dest ?? '')))
    return false;
  try {
    // Next may normalize request.url to localhost while the browser actually
    // used 127.0.0.1. The Host/Referer/Origin still bind the exact port.
    const browser = new URL(`http://${headers.get('host')}`);
    const referer = new URL(headers.get('referer') ?? '');
    if (browser.host !== headers.get('host') || browser.port !== url.port ||
        browser.pathname !== '/' || browser.username || browser.password ||
        referer.origin !== browser.origin || referer.username || referer.password || referer.hash ||
        (headers.get('origin') !== null && headers.get('origin') !== browser.origin)) return false;
    if (script && mode === 'cors' && headers.get('origin') === null) return false;
    return true;
  } catch { return false; }
}

export async function GET(request: Request, context: {params: Promise<{asset: string}>}) {
  if (request.method !== 'GET') return deny();
  let name: string;
  try { name = (await context.params).asset; } catch { return deny(); }
  if (!isP012AssetName(name)) return deny();
  const url = new URL(request.url);
  const pin = P012_ASSET_PINS[name];
  if (url.pathname !== `${PREFIX}${name}` || url.search !== `?sha256=${pin.sha256}` ||
      !sameOriginHeaders(request, url, pin.contentType.startsWith('text/javascript')))
    return deny();
  try {
    const asset = p012Asset(name);
    if (asset.sha256 !== pin.sha256 || asset.bytes.length !== pin.bytes ||
        asset.contentType !== pin.contentType) return deny();
    return new Response(new Uint8Array(asset.bytes), {headers: {
      ...PRIVATE_HEADERS,
      'Content-Length': String(asset.bytes.length),
      'Content-Type': asset.contentType,
    }});
  } catch { return deny(); }
}
