import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

export const P031_AUDIO_SOURCES = Object.freeze({
  "68": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/68",
    "sha256": "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19"
  },
  "80": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/80",
    "sha256": "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec"
  },
  "108": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/108",
    "sha256": "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085"
  },
  "132": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/132",
    "sha256": "ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8"
  },
  "157": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/157",
    "sha256": "5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d"
  },
  "173": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/173",
    "sha256": "770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541"
  },
  "188": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/188",
    "sha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0"
  },
  "242": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p031/source-audio/242",
    "sha256": "023e27734ea7d0c466f08d03250f7c5aeb99caf2062e0fcb794dd78349f9d439"
  }
});

type AudioRequest = {method:string;url:URL;headers:Pick<Headers,'get'>};
export function isNmsL2P031AudioRequest(request:AudioRequest,resource:string,
  env:G678PreviewEnvironment=process.env):boolean {
  const {method, url, headers} = request;
  if(!Object.hasOwn(P031_AUDIO_SOURCES,resource))return false;
  const source=P031_AUDIO_SOURCES[resource as keyof typeof P031_AUDIO_SOURCES];
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
