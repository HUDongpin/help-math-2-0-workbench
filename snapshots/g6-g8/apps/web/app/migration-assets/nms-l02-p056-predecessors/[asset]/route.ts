import {isNmsL02SourceResourceHostPath} from '@/lib/nms-l02-source-resource-host';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl} from '@/lib/g678-preview-policy';
import {isP056PredecessorAssetName, p056PredecessorAsset} from '@/lib/nms-l02-p056-predecessor-assets.server';
import {CONTINUOUS_AUDIO_PHASE} from '@/lib/continuous-source-audio-access';

export const dynamic = 'force-dynamic';
const HEADERS = {'Cache-Control': 'private, no-store, max-age=0',
  'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
  Vary: 'Host, X-Forwarded-Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'};
const deny = () => new Response(null, {status: 404, headers: HEADERS});

/** Source-pinned resources for the 64-page NMS002 L2 host; the predecessor endpoints and guards stay intact. */
export async function GET(request: Request, context: {params: Promise<{asset: string}>}) {
  try {
    const name = (await context.params).asset;
    const url = new URL(request.url);
    const headers = request.headers;
    const host = headers.get('host');
    const mode = headers.get('sec-fetch-mode');
    const dest = headers.get('sec-fetch-dest');
    if (request.method !== 'GET' || !isP056PredecessorAssetName(name) ||
        !isG678LocalPreviewRequestUrl(url) || !isG678LocalPreviewRequestHeaders(headers) ||
        url.protocol !== 'http:' || url.username || url.password || url.hash ||
        headers.has('range') || headers.get('sec-fetch-site') !== 'same-origin' ||
        !host ||
        (headers.has('x-forwarded-host') && headers.get('x-forwarded-host') !== host)) return deny();
    const script = name === 'p055-typography.js';
    const p052 = name.startsWith('p052-');
    if (p052 && (process.env.HELP_MATH_G678_P052_AUDIO_CANDIDATE !== '1' ||
        process.env.HELP_MATH_G678_CALIBRATION_PHASE !== CONTINUOUS_AUDIO_PHASE)) return deny();
    if (script ? (!['cors', 'no-cors'].includes(mode ?? '') || dest !== 'script') :
      p052 ? (mode !== 'cors' || dest !== 'empty') :
      (!['same-origin', 'cors', 'no-cors'].includes(mode ?? '') ||
        !['audio', 'empty'].includes(dest ?? ''))) return deny();
    const browser = new URL(`http://${host}`);
    const referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    if (browser.host !== host || browser.port !== url.port || browser.pathname !== '/' ||
        browser.username || browser.password ||
        referer.origin !== browser.origin || referer.username || referer.password ||
        referer.search || referer.hash ||
        !isNmsL02SourceResourceHostPath(referer.pathname) ||
        (origin !== null && origin !== browser.origin) ||
        (script && mode === 'cors' && origin === null)) return deny();
    const resource = p056PredecessorAsset(name);
    if (url.pathname !== `/migration-assets/nms-l02-p056-predecessors/${name}` ||
        url.search !== `?sha256=${resource.sha256}`) return deny();
    return new Response(new Uint8Array(resource.bytes), {headers: {...HEADERS,
      'Content-Type': resource.contentType, 'Content-Length': String(resource.bytes.length)}});
  } catch {return deny();}
}
