import {notFound} from 'next/navigation';

import {LessonMap} from '@/components/lesson-navigation';
import {Container} from '@/components/ui';
import {WholeLessonCoursePlayer} from '@/components/whole-lesson-course-player';
import {Link} from '@/i18n/navigation';
import {completeAnimations, getCatalog, isLessonReleasePublished, publishedAnimations} from '@/lib/catalog';
import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {
  currentJsShowcasePublication,
  G5_L4_SHOWCASE_RELEASE_ID,
} from '@/lib/current-js-showcase-publication';
import {isG5L4ShowcaseAudioAuthorized} from '@/lib/g5-l4-preview-asset-policy';
import {findLessonNavigationForRoute} from '@/lib/lesson-navigation';
import {findPageOnlyCurrentJsNavigationForRoute} from '@/lib/page-only-current-js-navigation.server';
import {protectedAtomicReleaseIdForScope} from '@/lib/lesson-release-publication';
import {
  isMigrationStatusAvailable,
  isMigrationStatusDesignerViewRequested,
} from '@/lib/migration-status-access';
import {isReviewerInstrumentationEnabled} from '@/lib/reviewer-instrumentation';
import {resolveNovaTutorMode} from '@/lib/tutor-integration';
import {
  isModernWideShellEnabled,
  resolveWholeLessonHostPresentation,
} from '@/lib/whole-lesson-host-presentation';
import {findWholeLessonCourseRegistration} from '@/lib/whole-lesson-course-registry';
import {
  resolveWholeLessonReleaseView,
  wholeLessonDescriptorMatchesNavigation,
} from '@/lib/whole-lesson-player-descriptor';

// Whole-lesson players mount only after descriptor/release cross-binding and
// the independent server publication or controlled-preview gate.

export const dynamic = 'force-dynamic';

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: 'en' | 'es'; grade: string; lesson: string}>;
  searchParams: Promise<{
    mode?: string | string[];
    view?: string | string[];
  }>;
}) {
  const {locale, grade, lesson} = await params;
  const {mode, view} = await searchParams;
  const novaTutorMode = resolveNovaTutorMode(mode);
  const designerView = isMigrationStatusAvailable()
    && isMigrationStatusDesignerViewRequested(view);
  if (!/^[3-5]$/.test(grade) || !/^\d{1,2}$/.test(lesson)) notFound();

  const spanish = locale === 'es';
  const lessonNumber = Number(lesson);
  const developmentAuditPreview = process.env.NODE_ENV !== 'production';
  const catalog = getCatalog();
  const complete = completeAnimations(catalog);
  const published = publishedAnimations(catalog);

  const releaseDescriptor = findLessonNavigationForRoute(
    catalog,
    grade,
    lessonNumber,
  ) ?? findPageOnlyCurrentJsNavigationForRoute(grade, lessonNumber);
  const courseRegistration = findWholeLessonCourseRegistration(grade, lessonNumber);
  const protectedReleaseId = protectedAtomicReleaseIdForScope(Number(grade), lessonNumber);
  if (!releaseDescriptor && protectedReleaseId) notFound();
  if (courseRegistration) {
    if (
      !releaseDescriptor ||
      !wholeLessonDescriptorMatchesNavigation(
        courseRegistration.descriptor,
        releaseDescriptor,
      )
    ) {
      notFound();
    }

    const auditPreview = developmentAuditPreview;
    const releasePublished = isLessonReleasePublished(
      catalog,
      courseRegistration.descriptor.releaseId,
    );
    const showcasePublication = currentJsShowcasePublication(
      courseRegistration.descriptor.releaseId,
    );
    if (!auditPreview && !releasePublished && !showcasePublication.enabled) {
      notFound();
    }

    const releaseView = resolveWholeLessonReleaseView(
      courseRegistration.descriptor,
      {
        releaseId: releaseDescriptor.releaseId,
        releasePublished,
        strictCompleteAnimationIds: new Set(
          complete.map((animation) => animation.animationId),
        ),
      },
    );
    // Resolved on the server: a lesson renders the widescreen presentation only
    // when its own descriptor declares support for it and the deployment opts
    // in. Either missing falls back to the legacy composite.
    const hostPresentation = resolveWholeLessonHostPresentation({
      declared: courseRegistration.descriptor.visualSkin.presentations,
      enabled: isModernWideShellEnabled(),
    });
    const authSession = await readAuthSession();
    return <WholeLessonCoursePlayer
      audioEnabled={
        courseRegistration.descriptor.releaseId === G5_L4_SHOWCASE_RELEASE_ID
        && isG5L4ShowcaseAudioAuthorized()
      }
      authStatus={authSession.status}
      candidateMode={designerView && (auditPreview || !releasePublished)}
      hostPresentation={hostPresentation}
      learningEventsEnabled={process.env.LRS_ENABLED === 'true'}
      reviewerMode={isReviewerInstrumentationEnabled()}
      locale={locale}
      novaTutorMode={novaTutorMode}
      registration={courseRegistration}
      releasePublished={releasePublished}
      strictCompleteMemberCount={releaseView.strictCompleteMemberCount}
    />;
  }

  if (releaseDescriptor) {
    const auditPreview = developmentAuditPreview;
    const completeAnimationIds = new Set(complete.map((animation) => animation.animationId));
    const releasePublished = isLessonReleasePublished(catalog, releaseDescriptor.releaseId);
    if (!auditPreview && !releasePublished) notFound();
    const statusById = Object.fromEntries(catalog.animations
      .filter((animation) => releaseDescriptor.memberAnimationIds.includes(animation.animationId))
      .map((animation) => [animation.animationId, animation.migration.status]));

    return <main id="main-content">
      <header className="archive-page-header archive-page-header--course">
        <Container>
          <p className="eyebrow">{spanish
            ? `Grado ${releaseDescriptor.grade} · Lección ${releaseDescriptor.lesson}`
            : `Grade ${releaseDescriptor.grade} · Lesson ${releaseDescriptor.lesson}`}</p>
          <h1 lang={releaseDescriptor.titleSpanish && spanish ? 'es' : 'en'}>{
            releaseDescriptor.titleSpanish && spanish
              ? releaseDescriptor.titleSpanish
              : releaseDescriptor.titleEnglish
          }</h1>
          {spanish && !releaseDescriptor.titleSpanish
            ? <p className="lesson-source-caveat">El catálogo fuente no contiene un título de lección en español; se muestra el título original en inglés sin inventar una traducción.</p>
            : null}
          <p>{auditPreview
            ? (spanish
                ? `Entorno local de auditoría: orden XML exacto de ${releaseDescriptor.activePageCount} páginas activas y el shell del curso.`
                : `Local audit environment: exact XML order for ${releaseDescriptor.activePageCount} active pages and the course shell.`)
            : (spanish
                ? `La lección completa se publica de forma atómica solo después de que sus ${releaseDescriptor.activePageCount} páginas y el shell superen la admisión estricta.`
                : `The complete lesson is published atomically only after all ${releaseDescriptor.activePageCount} pages and the shell pass strict admission.`)}</p>
        </Container>
      </header>
      <section className="catalog-section">
        <Container>
          <LessonMap
            auditPreview={auditPreview}
            completeAnimationIds={completeAnimationIds}
            descriptor={releaseDescriptor}
            locale={locale}
            releasePublished={releasePublished}
            statusById={statusById}
          />
        </Container>
      </section>
    </main>;
  }

  const animations = published
    .filter((item) => String(item.classification.grade) === grade && String(item.classification.lesson) === String(lessonNumber))
    .sort((a, b) => (a.classification.page?.ordinal ?? 0) - (b.classification.page?.ordinal ?? 0));
  const title = animations[0]?.classification.lessonTitleDisplay ?? `${spanish ? 'Grado' : 'Grade'} ${grade} · ${spanish ? 'Lección' : 'Lesson'} ${lessonNumber}`;
  const sections = Map.groupBy(animations, (item) => item.classification.section?.code ?? 'OTHER');

  return <main id="main-content">
    <header className="archive-page-header archive-page-header--course">
      <Container>
        <p className="eyebrow">{spanish ? `Grado ${grade} · Lección ${lessonNumber}` : `Grade ${grade} · Lesson ${lessonNumber}`}</p>
        <h1>{title}</h1>
        <p>{spanish ? 'La secuencia conserva el orden de la lección original y solo enlaza contenido aprobado.' : 'The sequence preserves original lesson order and links only strict-complete content.'}</p>
      </Container>
    </header>
    <section className="catalog-section">
      <Container>
        {animations.length ? [...sections].map(([code, items]) => <section className="lesson-section" key={code}>
          <header><span>{code}</span><h2>{items[0]?.classification.section?.label ?? code}</h2></header>
          <ol>{items.map((animation) => <li key={animation.animationId}><Link href={`/animations/${animation.animationId}`}>{animation.classification.titleDisplay}</Link><small>{animation.classification.page?.number ?? '—'} · {animation.classification.domain}</small></li>)}</ol>
        </section>) : <div className="archive-empty">
          <h2>{spanish ? 'Esta lección aún no tiene páginas aprobadas.' : 'This lesson has no strict-complete pages yet.'}</h2>
          <p><Link href="/library">← {spanish ? 'Volver a la biblioteca' : 'Back to library'}</Link></p>
        </div>}
      </Container>
    </section>
  </main>;
}
