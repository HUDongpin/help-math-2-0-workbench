import {DescriptorDrivenWholeLessonPlayer} from '@/components/descriptor-driven-whole-lesson-player';
import {G4L3WholeLessonPlayer} from '@/components/g4-l3-whole-lesson-player';
import type {PublicAuthStatus} from '@/lib/auth-session';
import type {
  LearningAssignmentLaunch,
  RecordAssignmentLearningEventsV2Action,
} from '@/lib/family/learning-events-v2-contract';
import type {WholeLessonCourseRegistration} from '@/lib/whole-lesson-course-registry';
import type {WholeLessonHostPresentation} from '@/lib/whole-lesson-host-presentation';
import type {NovaTutorMode} from '@/lib/tutor-integration';

export function WholeLessonCoursePlayer({
  audioEnabled = false,
  authStatus = 'disabled',
  candidateMode,
  familyLearningLaunch,
  hostPresentation = 'legacy-composite',
  learningEventsEnabled = false,
  locale,
  novaTutorMode = 'focus',
  onRecordFamilyLearningEventsAction,
  registration,
  releasePublished,
  reviewerMode = false,
  strictCompleteMemberCount,
}: {
  audioEnabled?: boolean;
  authStatus?: PublicAuthStatus;
  candidateMode: boolean;
  familyLearningLaunch?: LearningAssignmentLaunch;
  hostPresentation?: WholeLessonHostPresentation;
  learningEventsEnabled?: boolean;
  locale: 'en' | 'es';
  novaTutorMode?: NovaTutorMode;
  onRecordFamilyLearningEventsAction?: RecordAssignmentLearningEventsV2Action;
  registration: WholeLessonCourseRegistration;
  releasePublished: boolean;
  reviewerMode?: boolean;
  strictCompleteMemberCount: number;
}) {
  if (registration.player.kind === 'preserved-custom') {
    return <G4L3WholeLessonPlayer
      authStatus={authStatus}
      candidateMode={candidateMode}
      familyLearningLaunch={familyLearningLaunch}
      hostPresentation={hostPresentation}
      learningEventsEnabled={learningEventsEnabled}
      locale={locale}
      novaTutorMode={novaTutorMode}
      onRecordFamilyLearningEventsAction={onRecordFamilyLearningEventsAction}
      releasePublished={releasePublished}
      reviewerMode={reviewerMode}
      strictCompleteMemberCount={strictCompleteMemberCount}
    />;
  }

  return <DescriptorDrivenWholeLessonPlayer
    audioEnabled={audioEnabled}
    authStatus={authStatus}
    candidateMode={candidateMode}
    descriptor={registration.descriptor}
    hostPresentation={hostPresentation}
    locale={locale}
    novaTutorMode={novaTutorMode}
    releasePublished={releasePublished}
    reviewerMode={reviewerMode}
    strictCompleteMemberCount={strictCompleteMemberCount}
  />;
}
