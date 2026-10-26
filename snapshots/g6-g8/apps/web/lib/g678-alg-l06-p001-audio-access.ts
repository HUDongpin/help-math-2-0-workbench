import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment,
} from './g678-preview-policy';

export const P001_AUDIO_PATH =
  '/flash-assets/g678-local/shared-alg001-l06-p001/source-stream.mp3';
export const P001_AUDIO_SHA256 =
  'b214a1d96c7dadcf509fe1702e3f11694d50c1cfd584978d13ef30d39139633a';

/** Narrow opt-in for a browser fetch from this one loopback preview page. */
export function isP001AudioRequest(
  request: {method: string; url: URL; headers: Pick<Headers, 'get'>},
  env: G678PreviewEnvironment = process.env,
): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' || env.HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE !== '1' ||
      !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      url.protocol !== 'http:' || url.username || url.password || url.hash ||
      url.pathname !== P001_AUDIO_PATH ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('sec-fetch-mode') !== 'cors' ||
      headers.get('sec-fetch-dest') !== 'empty' ||
      headers.get('range') !== null ||
      url.searchParams.size !== 1 ||
      url.searchParams.get('sha256') !== P001_AUDIO_SHA256) return false;
  try {
    const hostText = headers.get('host')!;
    const host = new URL(`http://${hostText}`);
    const referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    const forwarded = headers.get('x-forwarded-host');
    return host.host === hostText && host.port === url.port &&
      (forwarded === null || forwarded === hostText) &&
      referer.origin === host.origin && referer.searchParams.get('play') === '1' &&
      /^\/(en|es)\/migration-status\/g678-calibration\/shared-alg001-l06-p001$/u
        .test(referer.pathname) &&
      (origin === null || origin === host.origin);
  } catch { return false; }
}
