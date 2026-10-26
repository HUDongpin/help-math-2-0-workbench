import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

const SOURCES = Object.freeze({
  page: {path:'/flash-assets/g678-local/shared-nms002-l02-p026/source-audio',sha256:'a153d93dd77d22747200de36ac1e2771c5a957398331f9641eb3e760907b6af9'},
});
type AudioRequest = {method:string;url:URL;headers:Pick<Headers,'get'>};
export function isNmsL2P026AudioRequest(request:AudioRequest,resource:keyof typeof SOURCES,
  env:G678PreviewEnvironment=process.env):boolean {
  const {method, url, headers} = request;
  if(!Object.hasOwn(SOURCES,resource))return false;
  const source=SOURCES[resource];
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
export function isP026AudioRequest(request:AudioRequest,env:G678PreviewEnvironment=process.env):boolean {
  return isNmsL2P026AudioRequest(request,'page',env);
}
