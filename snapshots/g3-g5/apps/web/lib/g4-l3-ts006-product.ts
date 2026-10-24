import {COURSE_G04_L03_RW_002_SOURCE} from '../../../packages/demos/src/timelines/course-g04-l03-rw-002';
import {COURSE_G04_L03_TS_006_SOURCE} from '../../../packages/demos/src/timelines/course-g04-l03-ts-006';

// Exact wording from the hash-bound TS006 SWF, cross-checked in Animate and
// after natural host entry in Ruffle. The Spanish host control changes audio,
// while this summary retains its original English wording.
export const G4_L3_TS006_PRODUCT = Object.freeze({
  animationId: 'course-g04-l03-ts-006',
  sourceSwfSha256: COURSE_G04_L03_TS_006_SOURCE.swfSha256,
  visualLanguage: 'en' as const,
  steps: Object.freeze([
    'Restate the question.',
    'Organize the information.',
    'Solve the problem.',
    'Check your answer.',
  ]),
});

// Ordinary My Lesson uses the source-proven English visuals with locale audio.
// This does not establish a verified Spanish translation of the animation.
export const G4_L3_RW002_PRODUCT = Object.freeze({
  animationId: 'course-g04-l03-rw-002',
  sourceSwfSha256: COURSE_G04_L03_RW_002_SOURCE.swfSha256,
  visualLanguage: 'en' as const,
});

export function g4L3ProductLanguages(animationId: string, locale: 'en' | 'es') {
  return {
    visualLanguage: (animationId === G4_L3_TS006_PRODUCT.animationId || animationId === G4_L3_RW002_PRODUCT.animationId || animationId === "course-g04-l03-fq-002" || animationId === "course-g04-l03-fq-003" || animationId === "course-g04-l03-rw-003")
      ? G4_L3_TS006_PRODUCT.visualLanguage
      : locale,
    audioLanguage: locale,
  };
}
