import type {Metadata} from 'next';
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
import {
  isG678GradeMappingAuthorityApproved,
  isG678LocalPreviewEnabled,
  isG678ModuleCode,
  sharedMiddleSchoolCourseKey,
} from '@/lib/g678-shared-course-catalog.server';
import {protectedAtomicReleaseIdForScope} from '@/lib/lesson-release-publication';
import {
  isMigrationStatusAvailable,
  isMigrationStatusDesignerViewRequested,
} from '@/lib/migration-status-access';
import {isReviewerInstrumentationEnabled} from '@/lib/reviewer-instrumentation';
import {resolveNovaClientCapabilities} from '@/lib/nova-capabilities.server';
import {resolveNovaTutorMode} from '@/lib/tutor-integration';
import {
  isModernWideShellEnabled,
  resolveWholeLessonHostPresentation,
} from '@/lib/whole-lesson-host-presentation';
import {
  findWholeLessonCourseRegistration,
  findWholeLessonCourseRegistrationByKey,
} from '@/lib/whole-lesson-course-registry';
import {
  resolveWholeLessonReleaseView,
  wholeLessonDescriptorMatchesNavigation,
} from '@/lib/whole-lesson-player-descriptor';

// Whole-lesson players mount only after descriptor/release cross-binding and
// the independent server publication or controlled-preview gate.

export const dynamic = 'force-dynamic';

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The public URL for a shared lesson is module-aware, but the proxy rewrites
 * it to this long-standing route with a server-only moduleCode query value.
 * Emit a second, document-level noindex boundary in addition to the proxy
 * response header. Legacy G3-G5 metadata continues to inherit from the page
 * hierarchy unchanged.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{locale: 'en' | 'es'; grade: string; lesson: string}>;
  searchParams: Promise<{moduleCode?: string | string[]}>;
}): Promise<Metadata> {
  const [{locale, grade, lesson}, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const moduleCode = firstQueryValue(query.moduleCode)?.trim().toUpperCase();
  if (!moduleCode || !/^[6-8]$/u.test(grade) || !isG678ModuleCode(moduleCode)) {
    return {};
  }
  return {
    title: locale === 'es'
      ? `Grado ${grade} · ${moduleCode} · Lección ${lesson}`
      : `Grade ${grade} · ${moduleCode} · Lesson ${lesson}`,
    robots: {
      index: false,
      follow: false,
      noarchive: true,
    },
  };
}

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{
    locale: 'en' | 'es';
    grade: string;
    lesson: string;
    moduleCode?: string;
  }>;
  searchParams: Promise<{
    mode?: string | string[];
    view?: string | string[];
    moduleCode?: string | string[];
  }>;
}) {
  const {locale, grade, lesson, moduleCode: rawModuleCode} = await params;
  const {mode, view, moduleCode: queryModuleCode} = await searchParams;
  const novaTutorMode = resolveNovaTutorMode(mode);
  const designerView = isMigrationStatusAvailable()
    && isMigrationStatusDesignerViewRequested(view);
  const moduleCode = (
    rawModuleCode ?? firstQueryValue(queryModuleCode)
  )?.trim().toUpperCase();
  const sharedRoute = moduleCode !== undefined;
  if (
    sharedRoute
      ? (!/^[6-8]$/u.test(grade) || !/^\d{1,2}$/u.test(lesson) ||
        !isG678ModuleCode(moduleCode ?? ''))
      : (!/^[3-5]$/u.test(grade) || !/^\d{1,2}$/u.test(lesson))
  ) notFound();
  if (sharedRoute && !isG678LocalPreviewEnabled()) notFound();
  if (sharedRoute && !isG678GradeMappingAuthorityApproved()) notFound();

  const spanish = locale === 'es';
  const lessonNumber = Number(lesson);
  const developmentAuditPreview = process.env.NODE_ENV !== 'production';
  const catalog = getCatalog();
  const complete = completeAnimations(catalog);
  const published = publishedAnimations(catalog);

  const courseRegistration = sharedRoute
    ? findWholeLessonCourseRegistrationByKey(
        sharedMiddleSchoolCourseKey(
          Number(grade) as 6 | 7 | 8,
          moduleCode!,
          lessonNumber,
        ) ?? '',
      )
    : findWholeLessonCourseRegistration(grade, lessonNumber);
  const catalogNavigation = findLessonNavigationForRoute(
    catalog,
    grade,
    lessonNumber,
    moduleCode,
  );
  const pageOnlyNavigation = findPageOnlyCurrentJsNavigationForRoute(
    grade,
    lessonNumber,
    moduleCode,
  );
  // Select the exact navigation that cross-binds to the registered course.
  // This admits a formal page-only manifest when a superseded catalog release
  // exists for the same grade/lesson without hiding schema-2 courses whose
  // current page-only release already lives in the catalog itself.
  const releaseDescriptor = courseRegistration
    ? [catalogNavigation, pageOnlyNavigation].find(
        (candidate) => candidate && wholeLessonDescriptorMatchesNavigation(
          courseRegistration.descriptor,
          candidate,
        ),
      )
    : catalogNavigation ?? pageOnlyNavigation;
  const protectedReleaseId = sharedRoute
    ? undefined
    : protectedAtomicReleaseIdForScope(Number(grade), lessonNumber);
  // A shared route is admitted only through an exact registered descriptor and
  // its source-order navigation binding.  Never fall through to the legacy
  // catalog renderer for a mapped-but-unregistered G6-G8 lesson.
  if (sharedRoute && (!courseRegistration || !releaseDescriptor)) notFound();
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
    const novaCapabilities = resolveNovaClientCapabilities({
      grade: Number(grade),
      lesson: lessonNumber,
      releaseId: courseRegistration.descriptor.releaseId,
      hostPresentation,
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
      novaCapabilities={novaCapabilities}
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
