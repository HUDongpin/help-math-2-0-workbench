import {ALG_L06_P001_GLYPHS} from '../../../packages/demos/src/alg-l06-p001-glyph-paths';
import {
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment,
} from './g678-preview-policy';

export function p001GlyphId(request: {
  method: string; url: URL; headers: Pick<Headers, 'get'>;
}, env: G678PreviewEnvironment = process.env): '140' | '141' | null {
  const {method, url, headers} = request;
  if (method !== 'GET' || !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      url.protocol !== 'http:' || url.username || url.password || url.hash ||
      url.search || headers.get('sec-fetch-site') !== 'same-origin' ||
      !((headers.get('sec-fetch-mode') === 'no-cors' &&
          headers.get('sec-fetch-dest') === 'image') ||
        (headers.get('sec-fetch-mode') === 'cors' &&
          headers.get('sec-fetch-dest') === 'empty')) ||
      headers.get('range') !== null) return null;
  const glyph = ALG_L06_P001_GLYPHS.find(value => value.href === url.pathname);
  if (!glyph) return null;
  try {
    const hostText = headers.get('host')!;
    const host = new URL(`http://${hostText}`);
    const referer = new URL(headers.get('referer') ?? '');
    const forwarded = headers.get('x-forwarded-host');
    const origin = headers.get('origin');
    return host.host === hostText && host.port === url.port &&
      (forwarded === null || forwarded === hostText) &&
      referer.origin === host.origin &&
      (origin === null || origin === host.origin) &&
      /^\/(en|es)\/migration-status\/g678-calibration\/shared-alg001-l06-p001$/u
        .test(referer.pathname) ? glyph.id : null;
  } catch { return null; }
}
