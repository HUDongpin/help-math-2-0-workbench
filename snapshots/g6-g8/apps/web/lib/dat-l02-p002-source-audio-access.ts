import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  isG678LoopbackHostname,
  type G678PreviewEnvironment,
} from './g678-preview-policy';

export const DAT_L02_P002_AUDIO_PATH =
  '/flash-assets/g678-local/shared-dat001-l02-p002/source-audio.wav';
export const DAT_L02_P002_AUDIO_SHA =
  'dc8fc07f7066b76e781bab37cb09f5232bb3f3ac98c8690104d8acf1dcee9f8c';
export const DAT_L02_P002_AUDIO_URL =
  `${DAT_L02_P002_AUDIO_PATH}?sha256=${DAT_L02_P002_AUDIO_SHA}`;

export function isDatL02P002SourceAudioRequest(request: {
  method: string;
  url: URL;
  headers: Pick<Headers, 'get'>;
}, env: G678PreviewEnvironment = process.env): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' || !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      url.protocol !== 'http:' || url.pathname !== DAT_L02_P002_AUDIO_PATH ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('sec-fetch-mode') !== 'no-cors' ||
      headers.get('sec-fetch-dest') !== 'audio') return false;
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0]?.[0] !== 'sha256' ||
      query[0][1] !== DAT_L02_P002_AUDIO_SHA) return false;
  try {
    const host = new URL(`http://${headers.get('host')}`);
    const referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    return isG678LoopbackHostname(host.hostname) && host.port === url.port &&
      referer.origin === host.origin &&
      /^\/(en|es)\/migration-status\/g678-calibration\/shared-dat001-l02-p002-candidate$/u
        .test(referer.pathname) &&
      (origin === null || origin === host.origin);
  } catch { return false; }
}
