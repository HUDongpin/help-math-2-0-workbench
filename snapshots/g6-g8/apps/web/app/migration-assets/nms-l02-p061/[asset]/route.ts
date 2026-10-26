import {isNmsL02SourceResourceHostPath} from '@/lib/nms-l02-source-resource-host';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl} from '@/lib/g678-preview-policy';
import {isP061AssetName, p061Asset} from '@/lib/nms-l02-p061-assets.server';

export const dynamic = 'force-dynamic';
const HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
  Vary: 'Host, X-Forwarded-Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest',
};
const deny = () => new Response(null, {status: 404, headers: HEADERS});

/** Local source-bound embedded MP3 only. No SA route or audio acceptance. */
export async function GET(request: Request, context: {params: Promise<{asset: string}>}) {
  try {
    const name = (await context.params).asset;
    const url = new URL(request.url);
    const headers = request.headers;
    const host = headers.get('host');
    const mode = headers.get('sec-fetch-mode');
    const dest = headers.get('sec-fetch-dest');
    if (request.method !== 'GET' || !isP061AssetName(name) ||
        !isG678LocalPreviewRequestUrl(url) || !isG678LocalPreviewRequestHeaders(headers) ||
        url.protocol !== 'http:' || url.username || url.password || url.hash ||
        headers.has('range') || headers.get('sec-fetch-site') !== 'same-origin' ||
        !host ||
        (headers.has('x-forwarded-host') && headers.get('x-forwarded-host') !== host) ||
        !['same-origin', 'cors', 'no-cors'].includes(mode ?? '') ||
        !['audio', 'empty'].includes(dest ?? '')) return deny();
    const browser = new URL(`http://${host}`);
    const referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    if (browser.host !== host || browser.port !== url.port || browser.pathname !== '/' ||
        browser.username || browser.password ||
        referer.origin !== browser.origin || referer.username || referer.password ||
        referer.search || referer.hash ||
        !isNmsL02SourceResourceHostPath(referer.pathname) ||
        (origin !== null && origin !== browser.origin)) return deny();
    const resource = p061Asset(name);
    if (url.pathname !== `/migration-assets/nms-l02-p061/${name}` ||
        url.search !== `?sha256=${resource.sha256}`) return deny();
    return new Response(new Uint8Array(resource.bytes), {headers: {...HEADERS,
      'Content-Type': resource.contentType,
      'Content-Length': String(resource.bytes.length)}});
  } catch { return deny(); }
}

export async function HEAD() { return deny(); }
