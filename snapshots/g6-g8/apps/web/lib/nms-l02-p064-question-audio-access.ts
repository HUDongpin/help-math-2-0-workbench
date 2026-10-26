import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

export const P064_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P064_QUESTION_AUDIO_PREFIX =
  '/flash-assets/g678-local/shared-nms002-l02-p064/question-audio/';
export const P064_OPTION_AUDIO_PREFIX =
  '/flash-assets/g678-local/shared-nms002-l02-p064/option-audio/';

type AudioRequest = {
  readonly method: string;
  readonly url: URL;
  readonly headers: Pick<Headers, 'get'>;
};

function isP064AudioRequest(request: AudioRequest, folder: string, question: string,
  expectedPath: string, env: G678PreviewEnvironment): boolean {
  const {url, headers} = request;
  if (request.method !== 'GET' || !['EA', 'SA'].includes(folder)
    || !/^(?:[1-9]|[12]\d|3[0-5])$/u.test(question)
    || env.HELP_MATH_G678_SOURCE_ROOT !== P064_SOURCE_ROOT
    || !isG678LocalPreviewRequestUrl(url, env)
    || !isG678LocalPreviewRequestHeaders(headers, env)
    || url.protocol !== 'http:' || url.username || url.password || url.hash || url.search
    || url.pathname !== expectedPath
    || headers.get('sec-fetch-site') !== 'same-origin') return false;
  const mode = headers.get('sec-fetch-mode');
  const dest = headers.get('sec-fetch-dest');
  if (!(mode === 'no-cors' && dest === 'audio') && !(mode === 'cors' && dest === 'empty')) return false;
  try {
    const host = headers.get('host');
    const forwarded = headers.get('x-forwarded-host');
    const referer = new URL(headers.get('referer') ?? '');
    const origin = headers.get('origin');
    const hostUrl = new URL(`http://${host}`);
    return hostUrl.host === host && hostUrl.port === url.port
      && (forwarded === null || forwarded === host)
      && referer.origin === hostUrl.origin && !referer.username && !referer.password
      && /^\/(?:en|es)\/migration-status\/g678-calibration\/shared-nms002-l02-p064$/u.test(referer.pathname)
      && (origin === null || origin === hostUrl.origin);
  } catch {return false;}
}

export function isP064QuestionAudioRequest(request: AudioRequest, folder: string,
  question: string, env: G678PreviewEnvironment = process.env): boolean {
  return isP064AudioRequest(request, folder, question,
    `${P064_QUESTION_AUDIO_PREFIX}${folder}/${question}`, env);
}

export function isP064OptionAudioRequest(request: AudioRequest, folder: string,
  question: string, option: string, env: G678PreviewEnvironment = process.env): boolean {
  return /^[A-D]$/u.test(option) && isP064AudioRequest(request, folder, question,
    `${P064_OPTION_AUDIO_PREFIX}${folder}/${question}/${option}`, env);
}
