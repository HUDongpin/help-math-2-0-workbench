import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

export const P021_AUDIO_SOURCES = Object.freeze({
  "29": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p021/source-audio/29",
    "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38"
  },
  "557": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p021/source-audio/557",
    "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38"
  },
  "575": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p021/source-audio/575",
    "sha256": "60a0282805dc064fee56e28c5832f7cc965ca813c63cd10a4f9fb3450545b35e"
  },
  "577": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p021/source-audio/577",
    "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf"
  },
  "578": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p021/source-audio/578",
    "sha256": "50b5ab29703fbf5630e2039076dfddae8f72593df607b61659fa30bb855a9c00"
  }
});

type AudioRequest = {method:string;url:URL;headers:Pick<Headers,'get'>};
export function isNmsL2P021AudioRequest(request:AudioRequest,resource:string,
  env:G678PreviewEnvironment=process.env):boolean {
  const {method, url, headers} = request;
  if(!Object.hasOwn(P021_AUDIO_SOURCES,resource))return false;
  const source=P021_AUDIO_SOURCES[resource as keyof typeof P021_AUDIO_SOURCES];
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
