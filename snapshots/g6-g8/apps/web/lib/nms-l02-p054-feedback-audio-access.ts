import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P054_FEEDBACK_AUDIO, type P054FeedbackKind}
  from '../../../packages/demos/src/nms-l02-p054-feedback-audio-v1';

export function isP054FeedbackAudioRequest(request: {
  method: string; url: URL; headers: Pick<Headers, 'get'>;
}, kind: string, env: G678PreviewEnvironment = process.env): kind is P054FeedbackKind {
  const {method, url, headers} = request;
  if (!Object.hasOwn(P054_FEEDBACK_AUDIO, kind)) return false;
  const source = P054_FEEDBACK_AUDIO[kind as P054FeedbackKind];
  const query = [...url.searchParams.entries()];
  if (method !== 'GET' || url.protocol !== 'http:' || url.username || url.password || url.hash ||
      url.pathname !== `/flash-assets/g678-local/shared-nms002-l02-p054/feedback-audio/${kind}` ||
      query.length !== 1 || query[0][0] !== 'sha256' || query[0][1] !== source.sha256 ||
      !isG678LocalPreviewRequestUrl(url, env) ||
      !isG678LocalPreviewRequestHeaders(headers, env) ||
      headers.get('sec-fetch-site') !== 'same-origin' ||
      headers.get('sec-fetch-mode') !== 'cors' ||
      headers.get('sec-fetch-dest') !== 'empty' || headers.get('range') !== null) return false;
  try {
    const host = new URL(`http://${headers.get('host')}`);
    const referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    const pageLevels = referer.searchParams.getAll('level');
    return host.port === url.port && referer.origin === host.origin &&
      (origin === null || origin === host.origin) &&
      /^\/(?:en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p054$/u.test(referer.pathname) &&
      (pageLevels.length === 0 || pageLevels.length === 1 && /^[12]$/u.test(pageLevels[0])) &&
      [...referer.searchParams.keys()].every(key => key === 'level');
  } catch {return false;}
}
