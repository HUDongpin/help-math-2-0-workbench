import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

export const P010_AUDIO_SOURCES = Object.freeze({
  "51": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/51",
    "sha256": "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e"
  },
  "67": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/67",
    "sha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0"
  },
  "99": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/99",
    "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1"
  },
  "127": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/127",
    "sha256": "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085"
  },
  "143": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/143",
    "sha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7"
  },
  "155": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/155",
    "sha256": "1cd830798de122ce36bc2393e258d602f323c1bb7674b9231d288fffc60bf4f7"
  },
  "175": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/175",
    "sha256": "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e"
  },
  "176": {
    "path": "/flash-assets/g678-local/shared-nms002-l02-p010/source-audio/176",
    "sha256": "3f830f7dc5452a1ae604b1d5d1c03f0326f1ccd85f2beccbdbce771597883c8b"
  }
});
type AudioRequest = {method:string;url:URL;headers:Pick<Headers,'get'>};
export function isNmsL2P010AudioRequest(request:AudioRequest,resource:string,
  env:G678PreviewEnvironment=process.env):boolean {
  const {method, url, headers} = request;
  if(!Object.hasOwn(P010_AUDIO_SOURCES,resource))return false;
  const source=P010_AUDIO_SOURCES[resource as keyof typeof P010_AUDIO_SOURCES];
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
