import {DescriptorDrivenWholeLessonPlayer} from '@/components/descriptor-driven-whole-lesson-player';
import {G4L3WholeLessonPlayer} from '@/components/g4-l3-whole-lesson-player';
import type {WholeLessonCourseRegistration} from '@/lib/whole-lesson-course-registry';
import type {WholeLessonHostPresentation} from '@/lib/whole-lesson-host-presentation';
import type {NovaTutorMode} from '@/lib/tutor-integration';

export function WholeLessonCoursePlayer({
  candidateMode,
  hostPresentation = 'legacy-composite',
  learningEventsEnabled = false,
  locale,
  novaTutorMode = 'focus',
  registration,
  releasePublished,
  reviewerMode = false,
  strictCompleteMemberCount,
}: {
  candidateMode: boolean;
  hostPresentation?: WholeLessonHostPresentation;
  learningEventsEnabled?: boolean;
  locale: 'en' | 'es';
  novaTutorMode?: NovaTutorMode;
  registration: WholeLessonCourseRegistration;
  releasePublished: boolean;
  reviewerMode?: boolean;
  strictCompleteMemberCount: number;
}) {
  if (registration.player.kind === 'preserved-custom') {
    return <G4L3WholeLessonPlayer
      candidateMode={candidateMode}
      hostPresentation={hostPresentation}
      learningEventsEnabled={learningEventsEnabled}
      locale={locale}
      novaTutorMode={novaTutorMode}
      releasePublished={releasePublished}
      reviewerMode={reviewerMode}
      strictCompleteMemberCount={strictCompleteMemberCount}
    />;
  }

  return <DescriptorDrivenWholeLessonPlayer
    candidateMode={candidateMode}
    descriptor={registration.descriptor}
    hostPresentation={hostPresentation}
    locale={locale}
    releasePublished={releasePublished}
    reviewerMode={reviewerMode}
    strictCompleteMemberCount={strictCompleteMemberCount}
  />;
}
