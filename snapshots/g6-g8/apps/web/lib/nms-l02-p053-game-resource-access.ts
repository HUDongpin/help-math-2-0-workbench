import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P054_FEEDBACK_AUDIO, type P054FeedbackKind}
  from '../../../packages/demos/src/nms-l02-p054-feedback-audio-v1';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const P053_PAGE = /^\/(?:en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p053$/u;
const P054_ASSET_ROOT = '/flash-assets/g678-local/shared-nms002-l02-p054';
const P053_GAME_ROOT = '/flash-assets/g678-local/shared-nms002-l02-p053/game';

type GameRequest = {
  readonly method: string;
  readonly url: URL;
  readonly headers: Pick<Headers, 'get'>;
};

function isP053GamePageRequest(request: GameRequest,
  env: G678PreviewEnvironment): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' || env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      url.protocol !== 'http:' || url.username || url.password || url.hash ||
      !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('range') !== null) return false;
  try {
    const hostValue = headers.get('host');
    const forwarded = headers.get('x-forwarded-host');
    const host = new URL(`http://${hostValue}`);
    const referer = new URL(headers.get('referer') ?? '');
    return host.host === hostValue && host.port === url.port &&
      (forwarded === null || forwarded === hostValue) &&
      referer.origin === host.origin && !referer.username && !referer.password &&
      referer.search === '' && referer.hash === '' &&
      P053_PAGE.test(referer.pathname);
  } catch {return false;}
}

/**
 * A Next beforeFiles rewrite may expose either the browser's P054 URL or the
 * P053 destination URL to the route handler. Both exact paths are accepted;
 * neither changes the required P053 page Referer or the hash-bound reader.
 */
function matchesRewrittenPath(pathname: string, suffix: string): boolean {
  return pathname === `${P054_ASSET_ROOT}/${suffix}` ||
    pathname === `${P053_GAME_ROOT}/${suffix}`;
}

export function isP053GameRevealRequest(request: GameRequest, level: string,
  order: string, env: G678PreviewEnvironment = process.env): boolean {
  const {url, headers} = request;
  return /^[12]$/u.test(level) && /^(?:[1-9]|1[0-2])$/u.test(order) &&
    matchesRewrittenPath(url.pathname, `reveal/${level}/${order}`) &&
    url.search === '' && isP053GamePageRequest(request, env) &&
    headers.get('sec-fetch-mode') === 'no-cors' &&
    headers.get('sec-fetch-dest') === 'image' &&
    headers.get('origin') === null;
}

export function isP053GameFeedbackAudioRequest(request: GameRequest, kind: string,
  env: G678PreviewEnvironment = process.env): kind is P054FeedbackKind {
  if (!Object.hasOwn(P054_FEEDBACK_AUDIO, kind)) return false;
  const {url, headers} = request;
  const source = P054_FEEDBACK_AUDIO[kind as P054FeedbackKind];
  return matchesRewrittenPath(url.pathname, `feedback-audio/${kind}`) &&
    url.search === `?sha256=${source.sha256}` &&
    isP053GamePageRequest(request, env) &&
    headers.get('sec-fetch-mode') === 'cors' &&
    headers.get('sec-fetch-dest') === 'empty' &&
    (headers.get('origin') === null || headers.get('origin') ===
      new URL(`http://${headers.get('host')}`).origin);
}
