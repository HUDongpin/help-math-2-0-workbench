import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  isG678LoopbackHostname,
  type G678PreviewEnvironment,
} from './g678-preview-policy';

export const DAT_L02_P002_SYMBOL_PREFIX =
  '/flash-assets/g678-local/shared-dat001-l02-p002/symbol/';

export function isDatL02P002SymbolRequest(request: {
  method: string;
  url: URL;
  headers: Pick<Headers, 'get'>;
}, env: G678PreviewEnvironment = process.env): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' || !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      url.protocol !== 'http:' || url.search !== '' ||
      !url.pathname.startsWith(DAT_L02_P002_SYMBOL_PREFIX) ||
      !/^[a-f0-9]{64}$/u.test(url.pathname.slice(DAT_L02_P002_SYMBOL_PREFIX.length)) ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('sec-fetch-mode') !== 'no-cors' ||
      headers.get('sec-fetch-dest') !== 'image' ||
      headers.get('range') !== null) return false;
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
