import {getCatalog, isLessonReleasePublished} from './catalog';
import {
  currentJsShowcasePublication,
  type CurrentJsShowcaseEnvironment,
} from './current-js-showcase-publication';
import {findLessonNavigationForRoute} from './lesson-navigation';
import {findPageOnlyCurrentJsNavigationForRoute} from './page-only-current-js-navigation.server';
import {wholeLessonCourseRegistrations} from './whole-lesson-course-registry';
import {wholeLessonDescriptorMatchesNavigation} from './whole-lesson-player-descriptor';

export interface AvailableLearningLesson {
  readonly activePageCount: number;
  readonly grade: number;
  readonly href: string;
  readonly lesson: number;
  readonly releaseId: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
}

/**
 * Derives learner-visible lesson links from the same descriptor, source-order,
 * and publication gates used by the course route. All Lessons therefore has
 * no independent hardcoded allowlist that can drift from runnable My Lesson.
 */
export function availableLearningLessons(
  env: CurrentJsShowcaseEnvironment = process.env,
): readonly AvailableLearningLesson[] {
  const catalog = getCatalog();
  const developmentAudit = env.NODE_ENV !== 'production';

  return Object.freeze(wholeLessonCourseRegistrations().flatMap(
    ({descriptor}) => {
      const navigation = findLessonNavigationForRoute(
        catalog,
        descriptor.course.grade,
        descriptor.course.lesson,
      ) ?? findPageOnlyCurrentJsNavigationForRoute(
        descriptor.course.grade,
        descriptor.course.lesson,
      );
      const descriptorBound = Boolean(
        navigation && wholeLessonDescriptorMatchesNavigation(
          descriptor,
          navigation,
        ),
      );
      const releasePublished = isLessonReleasePublished(
        catalog,
        descriptor.releaseId,
      );
      const showcaseEnabled = currentJsShowcasePublication(
        descriptor.releaseId,
        env,
      ).enabled;
      if (
        !descriptorBound ||
        (!developmentAudit && !releasePublished && !showcaseEnabled)
      ) {
        return [];
      }

      return [Object.freeze({
        activePageCount: descriptor.course.activePageCount,
        grade: descriptor.course.grade,
        href: `${descriptor.course.href}?mode=focus`,
        lesson: descriptor.course.lesson,
        releaseId: descriptor.releaseId,
        titleEnglish: descriptor.course.labels.en.text,
        titleSpanish: descriptor.course.labels.es.usesEnglishFallback
          ? null
          : descriptor.course.labels.es.text,
      })];
    },
  ).sort((left, right) =>
    left.grade - right.grade || left.lesson - right.lesson
  ));
}
