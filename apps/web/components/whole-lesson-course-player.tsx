import {DescriptorDrivenWholeLessonPlayer} from '@/components/descriptor-driven-whole-lesson-player';
import {G4L3WholeLessonPlayer} from '@/components/g4-l3-whole-lesson-player';
import type {PublicAuthStatus} from '@/lib/auth-session';
import type {PublicLessonTier} from '@/lib/public-launch-manifest.server';
import type {WholeLessonCourseRegistration} from '@/lib/whole-lesson-course-registry';
import type {WholeLessonHostPresentation} from '@/lib/whole-lesson-host-presentation';
import type {NovaTutorMode} from '@/lib/tutor-integration';

export type LessonPublicationTier = PublicLessonTier | 'local-audit';

export function LessonPublicationNotice({
  locale,
  publicationTier,
}: {
  locale: 'en' | 'es';
  publicationTier: LessonPublicationTier;
}) {
  const spanish = locale === 'es';
  const copy = publicationTier === 'preview'
    ? {
        label: 'Preview',
        detail: spanish
          ? 'Acceso Preview autorizado. La fidelidad Flash, el audio, la revisión humana, la aceptación del propietario y la finalización estricta siguen siendo puertas independientes.'
          : 'Preview access authorized. Flash fidelity, audio, human review, Owner acceptance, and strict completion remain separate gates.',
      }
    : publicationTier === 'released'
      ? {
          label: spanish ? 'Publicada' : 'Released',
          detail: spanish
            ? 'Acceso público autorizado para esta lección. Las afirmaciones de fidelidad, audio y finalización estricta siguen vinculadas a sus propias pruebas.'
            : 'Public access is authorized for this Lesson. Fidelity, audio, and strict-completion claims remain bound to their own evidence.',
        }
      : publicationTier === 'local-audit'
        ? {
            label: spanish ? 'Auditoría local' : 'Local audit',
            detail: spanish
              ? 'Superficie local de ingeniería; no es Preview, publicación ni aceptación.'
              : 'Local engineering surface; this is not Preview, release, or acceptance.',
          }
        : {
            label: spanish ? 'No disponible' : 'Unavailable',
            detail: spanish
              ? 'Esta lección no tiene autorización pública.'
              : 'This Lesson has no public authorization.',
          };
  return <aside
    aria-label={spanish ? 'Nivel de publicación' : 'Publication tier'}
    className="lesson-publication-notice"
    data-publication-tier={publicationTier}
  >
    <strong>{copy.label}</strong>
    <span>{copy.detail}</span>
  </aside>;
}

export function WholeLessonCoursePlayer({
  audioEnabled = false,
  authStatus = 'disabled',
  candidateMode,
  hostPresentation = 'legacy-composite',
  learningEventsEnabled = false,
  locale,
  novaTutorEnabled,
  novaTutorMode = 'focus',
  publicationTier,
  registration,
  releasePublished,
  reviewerMode = false,
  strictCompleteMemberCount,
}: {
  audioEnabled?: boolean;
  authStatus?: PublicAuthStatus;
  candidateMode: boolean;
  hostPresentation?: WholeLessonHostPresentation;
  learningEventsEnabled?: boolean;
  locale: 'en' | 'es';
  novaTutorEnabled: boolean;
  novaTutorMode?: NovaTutorMode;
  publicationTier: LessonPublicationTier;
  registration: WholeLessonCourseRegistration;
  releasePublished: boolean;
  reviewerMode?: boolean;
  strictCompleteMemberCount: number;
}) {
  if (registration.player.kind === 'preserved-custom') {
    return <>
      <LessonPublicationNotice locale={locale} publicationTier={publicationTier} />
      <G4L3WholeLessonPlayer
      authStatus={authStatus}
      candidateMode={candidateMode}
      hostPresentation={hostPresentation}
      learningEventsEnabled={learningEventsEnabled}
      locale={locale}
      novaTutorEnabled={novaTutorEnabled}
      novaTutorMode={novaTutorMode}
      releasePublished={releasePublished}
      reviewerMode={reviewerMode}
      strictCompleteMemberCount={strictCompleteMemberCount}
      />
    </>;
  }

  return <>
    <LessonPublicationNotice locale={locale} publicationTier={publicationTier} />
    <DescriptorDrivenWholeLessonPlayer
      audioEnabled={audioEnabled}
      authStatus={authStatus}
      candidateMode={candidateMode}
      descriptor={registration.descriptor}
      hostPresentation={hostPresentation}
      locale={locale}
      novaTutorEnabled={novaTutorEnabled}
      novaTutorMode={novaTutorMode}
      releasePublished={releasePublished}
      reviewerMode={reviewerMode}
      strictCompleteMemberCount={strictCompleteMemberCount}
    />
  </>;
}
