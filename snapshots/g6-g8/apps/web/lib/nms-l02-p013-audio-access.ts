import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

export const P013_AUDIO_SOURCES = Object.freeze({
  "99": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p013/source-audio/99",
    "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38"
  },
  "107": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p013/source-audio/107",
    "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf"
  },
  "111": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p013/source-audio/111",
    "sha256": "4de628d41cc6cd65d2ba576ba9a8bfd80a81249a2474c8a4ce0de64d40fa95e6"
  },
  "123": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p013/source-audio/123",
    "sha256": "2076c6286c0feb7b2a354043060abfaba6cfa7e4f8c76b1fd535b2060d3cb431"
  }
});
type AudioRequest = {method:string;url:URL;headers:Pick<Headers,'get'>};
export function isNmsL2P013AudioRequest(request:AudioRequest,resource:string,
  env:G678PreviewEnvironment=process.env):boolean {
  const {method, url, headers} = request;
  if(!Object.hasOwn(P013_AUDIO_SOURCES,resource))return false;
  const source=P013_AUDIO_SOURCES[resource as keyof typeof P013_AUDIO_SOURCES];
  if (method !== 'GET' || env.HELP_MATH_G678_CALIBRATION_PHASE !== CONTINUOUS_AUDIO_PHASE
    || !isG678LocalPreviewRequestUrl(url, env) || !isG678LocalPreviewRequestHeaders(headers, env)
    || url.protocol !== 'http:' || url.pathname !== source.path
    || headers.get('sec-fetch-site') !== 'same-origin' || headers.get('sec-fetch-mode') !== 'cors'
    || headers.get('sec-fetch-dest') !== 'empty' || headers.get('range') !== null) return false;
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0][0] !== 'sha256' || query[0][1] !== source.sha256) return false;
  try {
    const host = new URL('http://' + headers.get('host')), referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    return host.port === url.port && referer.origin === host.origin && (origin === null || origin === host.origin)
      && /^\/(en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p(00[1-9]|0[1-5][0-9]|06[0-4])$/.test(referer.pathname);
  } catch {return false;}
}
