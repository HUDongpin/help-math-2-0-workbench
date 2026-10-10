import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {WholeLessonCoursePlayer} from '@/components/whole-lesson-course-player';
import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {findHfrSharedCourse} from '@/lib/hfr-shared-courses.server';
import {isHfrLessonPreviewEnabled} from '@/lib/hfr-preview-policy';
import {resolveNovaClientCapabilities} from '@/lib/nova-capabilities.server';
import {resolveNovaTutorMode} from '@/lib/tutor-integration';
import {
  isModernWideShellEnabled,
  resolveWholeLessonHostPresentation,
} from '@/lib/whole-lesson-host-presentation';
import {wholeLessonDescriptorMatchesNavigation} from '@/lib/whole-lesson-player-descriptor';

// HFR shared-lesson preview: `/courses/shared/<module>/<lesson>`. The URL's
// `[grade]` segment is the literal scope `shared` while the grade mapping is
// pending, `[lesson]` is the module and `[unit]` the lesson number. The route
// exists only on a local development server with HFR_LESSON_PREVIEW_ENABLED.

export const dynamic = 'force-dynamic';

const MODULE_SLUG = /^(nms002|geo001|alg001|dat001)$/u;

function courseKeyFor(scope: string, moduleSlug: string, unit: string): string | undefined {
  if (scope !== 'shared' || !MODULE_SLUG.test(moduleSlug) || !/^\d{1,2}$/u.test(unit)) {
    return undefined;
  }
  return `shared-${moduleSlug}-l${unit.padStart(2, '0')}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: 'en' | 'es'; grade: string; lesson: string; unit: string}>;
}): Promise<Metadata> {
  const {locale, lesson: moduleSlug, unit} = await params;
  return {
    title: locale === 'es'
      ? `Grados 6–8 · ${moduleSlug.toUpperCase()} · Lección ${unit}`
      : `Grades 6–8 · ${moduleSlug.toUpperCase()} · Lesson ${unit}`,
    robots: {index: false, follow: false, noarchive: true},
  };
}

export default async function HfrSharedCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: 'en' | 'es'; grade: string; lesson: string; unit: string}>;
  searchParams: Promise<{mode?: string | string[]}>;
}) {
  if (!isHfrLessonPreviewEnabled()) notFound();
  const {locale, grade: scope, lesson: moduleSlug, unit} = await params;
  const {mode} = await searchParams;
  const courseKey = courseKeyFor(scope, moduleSlug, unit);
  if (!courseKey) notFound();

  const course = findHfrSharedCourse(courseKey);
  if (
    !course ||
    !wholeLessonDescriptorMatchesNavigation(
      course.registration.descriptor,
      course.navigation,
    )
  ) {
    notFound();
  }

  const {descriptor} = course.registration;
  const hostPresentation = resolveWholeLessonHostPresentation({
    declared: descriptor.visualSkin.presentations,
    enabled: isModernWideShellEnabled(),
  });
  const novaCapabilities = resolveNovaClientCapabilities({
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    releaseId: descriptor.releaseId,
    hostPresentation,
  });
  const authSession = await readAuthSession();
  return <WholeLessonCoursePlayer
    // Local preview only: narration plays from the converted page's own media.
    audioEnabled
    authStatus={authSession.status}
    candidateMode={false}
    hostPresentation={hostPresentation}
    learningEventsEnabled={false}
    locale={locale}
    novaCapabilities={novaCapabilities}
    novaTutorMode={resolveNovaTutorMode(mode)}
    registration={course.registration}
    releasePublished={false}
    reviewerMode={false}
    strictCompleteMemberCount={0}
  />;
}
