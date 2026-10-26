import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

export const P033_AUDIO_SOURCES = Object.freeze({
  "58": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/58",
    "sha256": "5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d"
  },
  "73": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/73",
    "sha256": "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e"
  },
  "94": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/94",
    "sha256": "1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5"
  },
  "138": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/138",
    "sha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b"
  },
  "150": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/150",
    "sha256": "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec"
  },
  "167": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/167",
    "sha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7"
  },
  "181": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/181",
    "sha256": "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11"
  },
  "221": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p033/source-audio/221",
    "sha256": "9710ba13fe2cddb852286ca11c94fd2a3d0d9095a38d2bd662582495e7157e9e"
  }
});

type AudioRequest = {method:string;url:URL;headers:Pick<Headers,'get'>};
export function isNmsL2P033AudioRequest(request:AudioRequest,resource:string,
  env:G678PreviewEnvironment=process.env):boolean {
  const {method, url, headers} = request;
  if(!Object.hasOwn(P033_AUDIO_SOURCES,resource))return false;
  const source=P033_AUDIO_SOURCES[resource as keyof typeof P033_AUDIO_SOURCES];
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
