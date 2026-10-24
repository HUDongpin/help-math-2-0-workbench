import {G4_L4_PAGE_ONLY_CURRENT_JS} from './g4-l4-page-only-current-js.generated';
import {buildSourceStaticPageOnlyCourseDescriptor} from
  './source-static-page-only-course-descriptor';

const sourceDescriptor = buildSourceStaticPageOnlyCourseDescriptor(G4_L4_PAGE_ONLY_CURRENT_JS);

export const G4_L4_PAGE_ONLY_COURSE_DESCRIPTOR = Object.freeze({
  ...sourceDescriptor,
  pages: Object.freeze(sourceDescriptor.pages.map(page => {
    if (page.animationId !== 'course-g04-l04-ts-007'
      && page.animationId !== 'course-g04-l04-ts-008') return page;
    if (page.rendererAvailability.kind !== 'registered'
      || !page.rendererAvailability.runtimeQuery) return page;
    // The source host selects among three wrong and four correct feedbacks.
    // Each practice run allows only two attempts, so public Replay rotates
    // the deterministic seed through their least common multiple.
    return Object.freeze({...page, rendererAvailability: Object.freeze({
      ...page.rendererAvailability,
      runtimeQuery: Object.freeze({...page.rendererAvailability.runtimeQuery,
        seed: '0', replaySeedCycle: 12}),
    })});
  })),
});
