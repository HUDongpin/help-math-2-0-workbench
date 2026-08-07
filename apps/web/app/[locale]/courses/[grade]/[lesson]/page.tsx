import {notFound} from 'next/navigation';

import {LessonMap} from '@/components/lesson-navigation';
import {Container} from '@/components/ui';
import {WholeLessonCoursePlayer} from '@/components/whole-lesson-course-player';
import {Link} from '@/i18n/navigation';
import {completeAnimations, getCatalog, isLessonReleasePublished, publishedAnimations} from '@/lib/catalog';
import {hasExecutivePreviewSession} from '@/lib/executive-preview-server';
import {findLessonNavigationForRoute} from '@/lib/lesson-navigation';
import {protectedAtomicReleaseIdForScope} from '@/lib/lesson-release-publication';
import {findWholeLessonCourseRegistration} from '@/lib/whole-lesson-course-registry';
import {wholeLessonDescriptorMatchesNavigation} from '@/lib/whole-lesson-player-descriptor';

// Whole-lesson players mount only after descriptor/release cross-binding and
// the independent server publication or controlled-preview gate.

export const dynamic = 'force-dynamic';

export default async function CoursePage({params}: {params: Promise<{locale: 'en' | 'es'; grade: string; lesson: string}>}) {
  const {locale, grade, lesson} = await params;
  if (!/^[3-5]$/.test(grade) || !/^\d{1,2}$/.test(lesson)) notFound();

  const spanish = locale === 'es';
  const lessonNumber = Number(lesson);
  const developmentAuditPreview = process.env.NODE_ENV !== 'production';
  const catalog = getCatalog();
  const complete = completeAnimations(catalog);
  const published = publishedAnimations(catalog);

  const releaseDescriptor = findLessonNavigationForRoute(catalog, grade, lessonNumber);
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

    const controlledPreview =
      courseRegistration.isControlledPreviewEnabled();
    if (
      process.env.NODE_ENV === 'production'
      && controlledPreview
      && !(await hasExecutivePreviewSession())
    ) {
      notFound();
    }
    const auditPreview = developmentAuditPreview || controlledPreview;
    const releasePublished = isLessonReleasePublished(
      catalog,
      courseRegistration.descriptor.releaseId,
    );
    if (!auditPreview && !releasePublished) notFound();

    const releaseMemberIds = new Set(releaseDescriptor.memberAnimationIds);
    const strictCompleteMemberCount = complete.filter(
      (animation) => releaseMemberIds.has(animation.animationId),
    ).length;
    return <WholeLessonCoursePlayer
      candidateMode={auditPreview || !releasePublished}
      controlledPreview={controlledPreview}
      locale={locale}
      registration={courseRegistration}
      releasePublished={releasePublished}
      strictCompleteMemberCount={strictCompleteMemberCount}
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
