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

export function g4L3ProductLanguages(animationId: string, locale: 'en' | 'es') {
  // The source quiz keeps its English question artwork while the host routes
  // EN/EA and SP/SA speaker controls to separate recordings. Reuse that same
  // visual page for Spanish audio instead of requesting an absent ES renderer.
  const sourceEnglishVisual = animationId === G4_L3_TS006_PRODUCT.animationId
    || animationId === 'course-g04-l03-fq-001'
    || animationId === 'course-g04-l03-fq-002'
    || animationId === 'course-g04-l03-fq-003';
  return {
    visualLanguage: sourceEnglishVisual
      ? G4_L3_TS006_PRODUCT.visualLanguage
      : locale,
    audioLanguage: locale,
  };
}
