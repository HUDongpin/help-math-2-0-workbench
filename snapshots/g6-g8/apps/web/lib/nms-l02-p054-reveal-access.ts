import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

export function isP054RevealRequest(request: {
  method: string; url: URL; headers: Pick<Headers, 'get'>;
}, level: string, order: string, env: G678PreviewEnvironment = process.env): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' || !/^[12]$/u.test(level) ||
      !/^(?:[1-9]|1[0-2])$/u.test(order) ||
      url.protocol !== 'http:' || url.search !== '' ||
      url.pathname !== `/flash-assets/g678-local/shared-nms002-l02-p054/reveal/${level}/${order}` ||
      !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('sec-fetch-mode') !== 'no-cors' ||
      headers.get('sec-fetch-dest') !== 'image') return false;
  try {
    const host = new URL(`http://${headers.get('host')}`);
    const referer = new URL(headers.get('referer') ?? '');
    // Next may normalize the route URL to localhost; bind the actual Host,
    // exact port, and page Referer while retaining the loopback guards above.
    const pageLevels = referer.searchParams.getAll('level');
    return host.port === url.port && referer.origin === host.origin &&
      /^\/(?:en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p054$/u.test(referer.pathname) &&
      (pageLevels.length === 0 ? level === '1' : pageLevels.length === 1 && pageLevels[0] === level) &&
      [...referer.searchParams.keys()].every(key => key === 'level');
  } catch {return false;}
}
