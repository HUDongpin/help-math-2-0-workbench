import {G3_L9_PAGE_ONLY_CURRENT_JS} from './g3-l9-page-only-current-js.generated';
import {buildSourceStaticPageOnlyCourseDescriptor} from
  './source-static-page-only-course-descriptor';

const descriptor = buildSourceStaticPageOnlyCourseDescriptor(G3_L9_PAGE_ONLY_CURRENT_JS);
const pages = Object.freeze(descriptor.pages.map(page => {
  if (page.placementId !== 'g03-l09-placement-090') return page;
  const renderer = page.rendererAvailability;
  if (page.animationId !== 'course-g03-l09-ts-008' || renderer.kind !== 'registered' || !renderer.runtimeQuery) {
    throw new Error('G3 L9 TS008 Replay cycle requires its exact registered placement');
  }
  return Object.freeze({
    ...page,
    rendererAvailability: Object.freeze({
      ...renderer,
      // Same source-host branch set as G3 L6 TS008: three wrong, four correct.
      runtimeQuery: Object.freeze({...renderer.runtimeQuery, replaySeedCycle: 12}),
    }),
  });
}));

export const G3_L9_PAGE_ONLY_COURSE_DESCRIPTOR = Object.freeze({...descriptor, pages});
