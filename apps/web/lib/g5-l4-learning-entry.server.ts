import {getCatalog} from './catalog';
import {
  currentJsShowcasePublication,
  G5_L4_SHOWCASE_RELEASE_ID,
} from './current-js-showcase-publication';
import {resolveG5L4LearningEntryAvailability} from './g5-l4-learning-entry';
import {findLessonNavigationForRoute} from './lesson-navigation';
import {findWholeLessonCourseRegistration} from './whole-lesson-course-registry';
import {wholeLessonDescriptorMatchesNavigation} from './whole-lesson-player-descriptor';

export function isG5L4LearningEntryAvailable(
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  const catalog = getCatalog();
  const navigation = findLessonNavigationForRoute(catalog, '5', 4);
  const registration = findWholeLessonCourseRegistration('5', 4);
  const descriptorBound = Boolean(
    navigation
    && registration
    && wholeLessonDescriptorMatchesNavigation(registration.descriptor, navigation),
  );

  return resolveG5L4LearningEntryAvailability({
    descriptorBound,
    developmentAudit: env.NODE_ENV !== 'production',
    showcaseEnabled: currentJsShowcasePublication(
      G5_L4_SHOWCASE_RELEASE_ID,
      env,
    ).enabled,
  });
}
