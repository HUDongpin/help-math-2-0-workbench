import {isG678CompiledLocalQaEnabled, isG678LocalPreviewEnabled, isG678LoopbackHostname, type G678PreviewEnvironment} from './g678-preview-policy';

export const HFR_PLACEMENT = /^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u;
const DOCUMENT = /^\/(en|es)\/migration-status\/g678-hfr\/(shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3})\/(candidate|registered)$/u;
const COURSE_PATH = /^\/(?:en|es)\/courses\/[6-8]\/([a-z]{3}\d{3})\/([1-9]|1[0-2])$/u;
const COURSE_QUERY_PATH = /^\/(?:en|es)\/courses\/[6-8]\/([1-9]|1[0-2])$/u;
const LOCAL_PLAYER_PATH = /^\/(?:en|es)\/migration-status\/g678-course\/([a-z]{3}\d{3})\/([1-9]|1[0-2])$/u;
const ASSET = /^\/flash-assets\/g678-local\/(shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3})\/hfr\/(.+)$/u;

function placementLesson(animationId: string): string | null {
  const match = /^shared-(nms002|geo001|alg001|dat001)-l(\d{2})-p\d{3}$/u.exec(animationId);
  return match ? `${match[1]}:${Number(match[2])}` : null;
}

/** Review documents name one page. The local lesson player names the whole lesson. */
function sameLessonReferer(ref: URL, animationId: string): boolean {
  const lesson = placementLesson(animationId);
  if (!lesson) return false;
  const review = DOCUMENT.exec(ref.pathname);
  if (review) {
    return ['', '?mode=focus'].includes(ref.search) && review[2]!.slice(0, -4) === animationId.slice(0, -4);
  }
  const course = COURSE_PATH.exec(ref.pathname);
  if (course) return ref.search === '' && `${course[1]}:${Number(course[2])}` === lesson;
  const player = LOCAL_PLAYER_PATH.exec(ref.pathname);
  if (player) return ['', '?mode=focus'].includes(ref.search) && `${player[1]}:${Number(player[2])}` === lesson;
  const queryPath = COURSE_QUERY_PATH.exec(ref.pathname);
  const moduleCode = ref.searchParams.get('moduleCode');
  return queryPath !== null && [...ref.searchParams].length === 1 && moduleCode !== null &&
    `${moduleCode.toLowerCase()}:${Number(queryPath[1])}` === lesson;
}

function localOrigin(url: URL, headers: Pick<Headers, 'get'>, env: G678PreviewEnvironment): string | null {
  if ((env.NODE_ENV !== 'development' && !isG678CompiledLocalQaEnabled(env)) || !isG678LocalPreviewEnabled(env) ||
      url.protocol !== 'http:' || !isG678LoopbackHostname(url.hostname) || url.username || url.password || url.hash) return null;
  const host = headers.get('host');
  if (!host || host.includes(',')) return null;
  try {
    const actual = new URL(`http://${host}`);
    if (!isG678LoopbackHostname(actual.hostname) || actual.username || actual.password ||
        actual.port !== url.port || actual.pathname !== '/' || actual.search || actual.hash) return null;
    const forwarded = headers.get('x-forwarded-host');
    if (forwarded !== null && forwarded !== host) return null;
    return actual.origin;
  } catch {return null;}
}

/** The existing My Lesson language link carries focus mode; Next adds its RSC nonce. */
function documentQuery(url: URL): boolean {
  return [...url.searchParams].every(([key, value]) =>
    (key === 'mode' && value === 'focus') || (key === '_rsc' && /^[A-Za-z0-9_-]{1,128}$/u.test(value))) &&
    url.searchParams.getAll('mode').length <= 1 && url.searchParams.getAll('_rsc').length <= 1;
}

/** One exact source placement, on the explicitly enabled loopback surface. */
export function hfrDocumentRequest(url: URL, headers: Pick<Headers, 'get'>, method: string,
  env: G678PreviewEnvironment = process.env) {
  const match = DOCUMENT.exec(url.pathname);
  // Compiled QA exercises registered placements. Unregistered review remains development-only.
  if (match?.[3] === 'candidate' && (env.NODE_ENV === 'production' || isG678CompiledLocalQaEnabled(env))) return null;
  if (!match || !['GET', 'HEAD'].includes(method) || !documentQuery(url) || !localOrigin(url, headers, env)) return null;
  return {locale: match[1] as 'en' | 'es', animationId: match[2]!, mode: match[3] as 'candidate' | 'registered'};
}

export type HfrAssetRequest = Readonly<{animationId: string; resource: string; contentType: string; range: string | null}>;
/** Filenames are later resolved exclusively through the verified closure's pins. */
export function hfrAssetRequest(url: URL, headers: Pick<Headers, 'get'>, method: string,
  env: G678PreviewEnvironment = process.env): HfrAssetRequest | null {
  const match = ASSET.exec(url.pathname), origin = localOrigin(url, headers, env);
  if (!match || !origin || !['GET', 'HEAD'].includes(method) || url.search || headers.get('sec-fetch-site') !== 'same-origin') return null;
  const animationId = match[1]!, resource = match[2]!;
  const isData = resource === `${animationId}.data.json`;
  const media = /^media\/[A-Za-z0-9][A-Za-z0-9._-]*\.(mp3|wav|png|jpg|jpeg)$/u.exec(resource);
  if (!isData && !media) return null;
  const extension = media?.[1];
  const audio = extension === 'mp3' || extension === 'wav';
  const image = extension === 'png' || extension === 'jpg' || extension === 'jpeg';
  const dest = headers.get('sec-fetch-dest'), mode = headers.get('sec-fetch-mode');
  if (isData && (dest !== 'empty' || !['cors', 'same-origin'].includes(mode ?? ''))) return null;
  if (audio && !((dest === 'empty' && mode === 'cors') || (dest === 'audio' && ['cors', 'no-cors'].includes(mode ?? '')))) return null;
  if (image && !(dest === 'image' && ['cors', 'no-cors'].includes(mode ?? ''))) return null;
  try {
    const ref = new URL(headers.get('referer') ?? '');
    if (ref.origin !== origin || ref.username || ref.password || ref.hash || !sameLessonReferer(ref, animationId)) return null;
    const suppliedOrigin = headers.get('origin');
    if (suppliedOrigin !== null && suppliedOrigin !== origin) return null;
  } catch {return null;}
  const range = headers.get('range');
  if (range && (!audio || !/^bytes=(?:\d+-\d*|-\d+)$/u.test(range))) return null;
  const contentType = isData ? 'application/json; charset=utf-8' : extension === 'mp3' ? 'audio/mpeg' :
    extension === 'wav' ? 'audio/wav' : extension === 'png' ? 'image/png' : 'image/jpeg';
  return {animationId, resource, contentType, range};
}

/** Apply a single audio byte range only after the complete file's SHA-256 passed. */
export function hfrAssetResponse(bytes: Uint8Array, request: HfrAssetRequest, method: 'GET' | 'HEAD'): Response {
  const headers = new Headers({'Content-Type': request.contentType, 'Cache-Control': 'private, no-store, max-age=0',
    'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
    'Vary': 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest, Range'});
  let start = 0, end = bytes.length - 1, status = 200;
  if (request.contentType.startsWith('audio/')) headers.set('Accept-Ranges', 'bytes');
  if (request.range) {
    const [left, right] = request.range.slice(6).split('-');
    const parsedLeft = left ? Number(left) : null, parsedRight = right ? Number(right) : null;
    const invalid = (parsedLeft !== null && !Number.isSafeInteger(parsedLeft)) ||
      (parsedRight !== null && !Number.isSafeInteger(parsedRight));
    if (left) {start = parsedLeft!; end = right ? Math.min(parsedRight!, end) : end;}
    else {const length = parsedRight!; start = Math.max(0, bytes.length - length); if (length <= 0) start = bytes.length;}
    if (invalid || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.length) {
      headers.set('Content-Range', `bytes */${bytes.length}`); return new Response(null, {status: 416, headers});
    }
    status = 206; headers.set('Content-Range', `bytes ${start}-${end}/${bytes.length}`);
  }
  const body = bytes.slice(start, end + 1); headers.set('Content-Length', String(body.length));
  return new Response(method === 'HEAD' ? null : body, {status, headers});
}
