import {DescriptorDrivenWholeLessonPlayer} from '@/components/descriptor-driven-whole-lesson-player';
import {G4L3WholeLessonPlayer} from '@/components/g4-l3-whole-lesson-player';
import type {WholeLessonCourseRegistration} from '@/lib/whole-lesson-course-registry';

export function WholeLessonCoursePlayer({
  candidateMode,
  controlledPreview,
  locale,
  registration,
  releasePublished,
  strictCompleteMemberCount,
}: {
  candidateMode: boolean;
  controlledPreview: boolean;
  locale: 'en' | 'es';
  registration: WholeLessonCourseRegistration;
  releasePublished: boolean;
  strictCompleteMemberCount: number;
}) {
  if (registration.player.kind === 'preserved-custom') {
    return <G4L3WholeLessonPlayer
      candidateMode={candidateMode}
      controlledPreview={controlledPreview}
      locale={locale}
      releasePublished={releasePublished}
      strictCompleteMemberCount={strictCompleteMemberCount}
    />;
  }

  return <DescriptorDrivenWholeLessonPlayer
    candidateMode={candidateMode}
    descriptor={registration.descriptor}
    locale={locale}
    releasePublished={releasePublished}
    strictCompleteMemberCount={strictCompleteMemberCount}
  />;
}
