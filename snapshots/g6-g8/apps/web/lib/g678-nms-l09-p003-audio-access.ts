import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment,
} from './g678-preview-policy';

export const NMS_L09_P003_AUDIO_PATH =
  '/flash-assets/g678-local/shared-nms002-l09-p003/embedded-stream.mp3';
export const NMS_L09_P003_AUDIO_SHA256 =
  'a8ca1683d3f7848f16f9be96e3472c41594485a853778defc96cebfe6243307f';

/** Local engineering audio access only; no Current-JS or listening admission. */
export function isNmsL09P003AudioRequest(
  request: {method: string; url: URL; headers: Pick<Headers, 'get'>},
  env: G678PreviewEnvironment = process.env,
): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' ||
      env.HELP_MATH_G678_P003_AUDIO_CANDIDATE !== '1' ||
      !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      url.protocol !== 'http:' || url.username || url.password || url.hash ||
      url.pathname !== NMS_L09_P003_AUDIO_PATH ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('sec-fetch-mode') !== 'cors' ||
      headers.get('sec-fetch-dest') !== 'empty' ||
      headers.get('range') !== null) return false;
  const query = [...url.searchParams];
  if (query.length !== 1 || query[0]?.[0] !== 'sha256' ||
      query[0]?.[1] !== NMS_L09_P003_AUDIO_SHA256) return false;
  try {
    const hostText = headers.get('host')!;
    const host = new URL(`http://${hostText}`);
    const referer = new URL(headers.get('referer') ?? '');
    const forwarded = headers.get('x-forwarded-host');
    const origin = headers.get('origin');
    return host.host === hostText && host.port === url.port &&
      (forwarded === null || forwarded === hostText) &&
      referer.origin === host.origin && !referer.username && !referer.password &&
      (origin === null || origin === host.origin) &&
      /^\/(en|es)\/migration-status\/g678-calibration\/shared-nms002-l09-p003$/u
        .test(referer.pathname);
  } catch {
    return false;
  }
}
