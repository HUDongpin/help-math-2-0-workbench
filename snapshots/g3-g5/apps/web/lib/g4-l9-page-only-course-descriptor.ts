import {G4_L9_PAGE_ONLY_CURRENT_JS} from './g4-l9-page-only-current-js.generated';
import {buildSourceStaticPageOnlyCourseDescriptor} from
  './source-static-page-only-course-descriptor';

const descriptor = buildSourceStaticPageOnlyCourseDescriptor(G4_L9_PAGE_ONLY_CURRENT_JS);
const practicePages: Readonly<Record<string, string>> = Object.freeze({
  'g04-l09-placement-039': 'course-g04-l09-ts-007',
  'g04-l09-placement-040': 'course-g04-l09-ts-008',
});
const pages = Object.freeze(descriptor.pages.map(page => {
  const animationId = practicePages[page.placementId!];
  if (!animationId) return page;
  const renderer = page.rendererAvailability;
  if (page.animationId !== animationId || renderer.kind !== 'registered' || !renderer.runtimeQuery) {
    throw new Error('G4 L9 practice Replay requires its exact registered placement');
  }
  return Object.freeze({
    ...page,
    rendererAvailability: Object.freeze({
      ...renderer,
      // Each own L9 source host has three wrong and four correct branches.
      runtimeQuery: Object.freeze({...renderer.runtimeQuery, replaySeedCycle: 12}),
    }),
  });
}));

export const G4_L9_PAGE_ONLY_COURSE_DESCRIPTOR = Object.freeze({...descriptor, pages});
