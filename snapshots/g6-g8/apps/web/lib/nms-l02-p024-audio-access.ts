import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

export const P024_AUDIO_SOURCES = Object.freeze({
  "93": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p024/source-audio/93",
    "sha256": "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04"
  },
  "95": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p024/source-audio/95",
    "sha256": "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7"
  },
  "97": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p024/source-audio/97",
    "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf"
  },
  "98": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p024/source-audio/98",
    "sha256": "7860ffdad0d0edfb7a08d5bb04f264c2c1a9c6d4ec110669d941ee91ac6e2011"
  }
});

type AudioRequest = {method:string;url:URL;headers:Pick<Headers,'get'>};
export function isNmsL2P024AudioRequest(request:AudioRequest,resource:string,
  env:G678PreviewEnvironment=process.env):boolean {
  const {method, url, headers} = request;
  if(!Object.hasOwn(P024_AUDIO_SOURCES,resource))return false;
  const source=P024_AUDIO_SOURCES[resource as keyof typeof P024_AUDIO_SOURCES];
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
