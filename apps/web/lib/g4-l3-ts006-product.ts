import {COURSE_G04_L03_TS_006_SOURCE} from '../../../packages/demos/src/timelines/course-g04-l03-ts-006';
import {findG4L3Page} from './g4-l3-lesson-navigation';

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

export function g4L3ProductLanguages(animationId: string, locale: 'en' | 'es') {
  // The 38 source-static pages reject Spanish visual requests. Keep their
  // original English drawing while the host independently selects Spanish
  // controls and recordings. IN009 has a supported Spanish visual branch.
  const sourceEnglishVisual = findG4L3Page(animationId) !== undefined
    && animationId !== 'course-g04-l03-in-009';
  return {
    visualLanguage: sourceEnglishVisual
      ? G4_L3_TS006_PRODUCT.visualLanguage
      : locale,
    audioLanguage: locale,
  };
}
