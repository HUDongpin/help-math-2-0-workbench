import {getCatalog} from './catalog';
import {currentJsShowcasePublication} from './current-js-showcase-publication';
import {resolveG4L3LearningEntryAvailability} from './g4-l3-learning-entry';
import {G4_L3_LESSON} from './g4-l3-lesson-navigation';
import {findLessonNavigationForRoute} from './lesson-navigation';
import {findWholeLessonCourseRegistration} from './whole-lesson-course-registry';
import {wholeLessonDescriptorMatchesNavigation} from './whole-lesson-player-descriptor';

/**
 * Mirrors the descriptor and current runtime-asset gates so the learning
 * workspace never advertises a link whose 39-page asset closure is blocked.
 * Strict publication remains a separate authority until the static-asset
 * policy is expanded to consume that ledger safely.
 */
export function isG4L3LearningEntryAvailable(
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  const catalog = getCatalog();
  const navigation = findLessonNavigationForRoute(catalog, '4', 3);
  const registration = findWholeLessonCourseRegistration('4', 3);
  const descriptorBound = Boolean(
    navigation
    && registration
    && wholeLessonDescriptorMatchesNavigation(registration.descriptor, navigation),
  );
  return resolveG4L3LearningEntryAvailability({
    descriptorBound,
    developmentAudit: env.NODE_ENV !== 'production',
    showcaseEnabled: currentJsShowcasePublication(
      G4_L3_LESSON.releaseId,
      env,
    ).enabled,
  });
}
