import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

export const GEO_L06_P002_SHEET_SHA256 =
  'ae5c6fb9ba4e7c5b4acb1ee1187739a2bf6c1c81ff6d0c9129c428a1f9094c7c';
export const GEO_L06_P002_SHEET_URL =
  `/flash-assets/g678-local/shared-geo001-l06-p002/symbol-sheet.svg?sha256=${GEO_L06_P002_SHEET_SHA256}`;
export const GEO_L06_P002_STREAM_SHA256 =
  '2109aaa85e801d9a5bddbf2c0f30184e078a9eab75785580f477d51147fe325e';
export const GEO_L06_P002_STREAM_URL =
  `/flash-assets/g678-local/shared-geo001-l06-p002/source-stream.mp3?sha256=${GEO_L06_P002_STREAM_SHA256}`;

/** Engineering-only, same-origin fetch from the exact P002 candidate or host-probe route. */
function isGeoL06P002AssetRequest(request: {
  method: string;
  url: URL;
  headers: Pick<Headers, 'get'>;
}, assetUrl: string, env: G678PreviewEnvironment): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' || url.protocol !== 'http:' ||
      !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      `${url.pathname}${url.search}` !== assetUrl ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('sec-fetch-mode') !== 'cors' ||
      headers.get('sec-fetch-dest') !== 'empty' ||
      headers.get('range') !== null) return false;
  try {
    const host = new URL(`http://${headers.get('host')}`);
    const referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    return host.port === url.port && referer.origin === host.origin &&
      /^\/(en|es)\/migration-status\/g678-calibration\/shared-geo001-l06-p002(?:\/host)?$/u.test(referer.pathname) &&
      (origin === null || origin === host.origin);
  } catch { return false; }
}

export function isGeoL06P002SheetRequest(request: {
  method: string; url: URL; headers: Pick<Headers, 'get'>;
}, env: G678PreviewEnvironment = process.env): boolean {
  return isGeoL06P002AssetRequest(request, GEO_L06_P002_SHEET_URL, env);
}

export function isGeoL06P002StreamRequest(request: {
  method: string; url: URL; headers: Pick<Headers, 'get'>;
}, env: G678PreviewEnvironment = process.env): boolean {
  return isGeoL06P002AssetRequest(request, GEO_L06_P002_STREAM_URL, env);
}
