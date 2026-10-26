import {isG678LocalPreviewRequestUrl, isG678LocalPreviewRequestHeaders, type G678PreviewEnvironment} from './g678-preview-policy';
import {CONTINUOUS_AUDIO_PHASE} from './continuous-source-audio-access';

const SOURCE_HASH = '90b4efedd2a6d49fa5c869d20269239e8b397293447a704753ab7fbe3d8933e4';
export function isP001AudioRequest(request: {method: string; url: URL; headers: Pick<Headers, 'get'>},
  env: G678PreviewEnvironment = process.env): boolean {
  const {method, url, headers} = request;
  if (method !== 'GET' || env.HELP_MATH_G678_CALIBRATION_PHASE !== CONTINUOUS_AUDIO_PHASE
    || !isG678LocalPreviewRequestUrl(url, env) || !isG678LocalPreviewRequestHeaders(headers, env)
    || url.protocol !== 'http:' || url.pathname !== '/flash-assets/g678-local/shared-nms002-l02-p001/source-audio'
    || headers.get('sec-fetch-site') !== 'same-origin' || headers.get('sec-fetch-mode') !== 'cors'
    || headers.get('sec-fetch-dest') !== 'empty' || headers.get('range') !== null) return false;
  const query = [...url.searchParams.entries()];
  if (query.length !== 1 || query[0][0] !== 'sha256' || query[0][1] !== SOURCE_HASH) return false;
  try {
    const host = new URL('http://' + headers.get('host')), referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    return host.port === url.port && referer.origin === host.origin && (origin === null || origin === host.origin)
      && /^\/(en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p001$/.test(referer.pathname);
  } catch {return false;}
}
