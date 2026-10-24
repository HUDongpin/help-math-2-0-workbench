import {G4_L9_FINAL_QUIZ_AUDIO_ASSETS} from '../../../packages/demos/src/modern-lessons/generated/g4-l9-final-quiz-config';
import {isLocalLessonTypographyActivityAudioQa} from './lesson-typography-activity-audio-qa.server';

export const G4_L9_FINAL_QUIZ_AUDIO_PREFIX = '/flash-assets/typography-v1/g4-l9-final-quiz-audio/';
const sourceByPath = new Map<string, string>(G4_L9_FINAL_QUIZ_AUDIO_ASSETS.map(asset =>
  [asset.source.split('?')[0], asset.source]));

/** Exact original assets for the local typography candidate; no remote admission. */
export function isLocalG4L9FinalQuizAudioRequest(
  url: URL,
  host: string | null,
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return isLocalLessonTypographyActivityAudioQa(host, env)
    && url.protocol === 'http:'
    && isLocalLessonTypographyActivityAudioQa(url.host, env)
    // NextURL normalizes 127.0.0.1 to localhost; both ends must remain loopback.
    && url.port === new URL('http://' + host).port
    && url.username === '' && url.password === '' && url.hash === ''
    && url.pathname.startsWith(G4_L9_FINAL_QUIZ_AUDIO_PREFIX)
    && sourceByPath.get(url.pathname) === url.pathname + url.search;
}
