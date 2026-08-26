import {Link} from '@/i18n/navigation';
import {
  G4_L3_LESSON,
  canNavigateToG4L3Animation,
  findG4L3Page,
  findG4L3Section,
  getG4L3PageLabel,
  getG4L3SectionLabel,
  getVisibleG4L3Pages,
  isG4L3ReleaseOpen,
  isG4L3Shell,
  type G4L3Locale,
  type G4L3Page,
} from '@/lib/g4-l3-lesson-navigation';

type StatusById = Readonly<Record<string, string>>;

function statusFor(statusById: StatusById, animationId: string): string {
  return statusById[animationId] ?? 'discovered';
}

function PageTitle({locale, page}: {locale: G4L3Locale; page: G4L3Page}) {
  const label = getG4L3PageLabel(page, locale);
  return <span className="lesson-contract-page__title">
    <span lang={label.sourceLanguage}>{label.text}</span>
    {label.usesEnglishFallback ? <small lang="es">Sin título de página en español en la fuente; se conserva el inglés original.</small> : null}
  </span>;
}

export function G4L3LessonMap({
  auditPreview,
  completeAnimationIds,
  locale,
  releasePublished,
  statusById,
}: {
  auditPreview: boolean;
  completeAnimationIds: ReadonlySet<string>;
  locale: G4L3Locale;
  releasePublished: boolean;
  statusById: StatusById;
}) {
  const spanish = locale === 'es';
  const releaseOpen = isG4L3ReleaseOpen({auditPreview, completeAnimationIds, releasePublished});
  const visiblePages = getVisibleG4L3Pages({auditPreview, completeAnimationIds, releasePublished});
  const visiblePageIds = new Set(visiblePages.map((page) => page.animationId));
  const visibleSections = G4_L3_LESSON.sections
    .map((section) => ({section, pages: G4_L3_LESSON.pages.filter((page) => page.sectionCode === section.code && visiblePageIds.has(page.animationId))}))
    .filter(({pages}) => pages.length > 0);
  const shellVisible = auditPreview || releaseOpen;
  const shellComplete = completeAnimationIds.has(G4_L3_LESSON.shellAnimationId);
  const strictPageCount = G4_L3_LESSON.pages.filter((page) => completeAnimationIds.has(page.animationId)).length;
  const strictShellCount = completeAnimationIds.has(G4_L3_LESSON.shellAnimationId) ? 1 : 0;

  return <div
    className="lesson-contract"
    data-active-page-count={G4_L3_LESSON.activePageCount}
    data-audit-preview={auditPreview ? 'true' : 'false'}
    data-course-shell-count={G4_L3_LESSON.courseShellCount}
    data-current-strict-page-count={strictPageCount}
    data-current-strict-shell-count={strictShellCount}
    data-lesson-contract="g4-l3-active-xml-order-v1"
    data-release-open={releaseOpen ? 'true' : 'false'}
    data-release-published={releasePublished ? 'true' : 'false'}
  >
    <aside className="lesson-contract-boundary" role="note">
      <strong>{auditPreview
        ? (spanish ? 'Mapa de auditoría neutral respecto a la aceptación' : 'Acceptance-neutral audit map')
        : (spanish ? 'Lección publicada como una unidad completa' : 'Lesson published as one complete unit')}</strong>
      <p>{spanish
        ? `El contrato conserva 39 páginas activas y 1 shell. Solo ${strictPageCount} páginas y ${strictShellCount} shell están admitidos actualmente por el ledger estricto.`
        : `The contract preserves 39 active pages and 1 shell. Only ${strictPageCount} pages and ${strictShellCount} shell are currently admitted by the strict ledger.`}</p>
      {auditPreview ? <p>{spanish
          ? 'La presencia en este mapa de auditoría no significa paridad con Flash, aceptación humana o del propietario, aceptación de audio, finalización ni elegibilidad para la biblioteca pública.'
          : 'Presence in this audit map does not mean Flash parity, human or owner acceptance, audio acceptance, completion, or public-library eligibility.'}</p>
        : null}
    </aside>

    {shellVisible ? <section className="lesson-contract-shell" aria-labelledby="g4-l3-shell-heading">
      <div>
        <p className="eyebrow">{spanish ? 'Shell del curso · elemento 40' : 'Course shell · item 40'}</p>
        <h2 id="g4-l3-shell-heading">{spanish ? 'Navegación de la lección' : 'Lesson navigation shell'}</h2>
        <p><code>{G4_L3_LESSON.shellAnimationId}</code></p>
      </div>
      <div>
        <span className={`status-chip status-chip--${statusFor(statusById, G4_L3_LESSON.shellAnimationId)}`}>{statusFor(statusById, G4_L3_LESSON.shellAnimationId)}</span>
        <Link data-audit-placeholder={shellComplete ? undefined : 'true'} href={`/animations/${G4_L3_LESSON.shellAnimationId}${shellComplete ? '' : `?auditContext=g4-l3-lesson&lang=${locale}&seed=0&frame=50&scenario=lesson-map-audit`}`}>{spanish ? 'Abrir proyección de auditoría del shell' : 'Open shell audit projection'} →</Link>
      </div>
    </section> : null}

    {visibleSections.length ? <nav aria-label={spanish ? 'Secciones de la lección' : 'Lesson sections'} className="lesson-contract-section-nav">
      {visibleSections.map(({section}) => {
        const label = getG4L3SectionLabel(section, locale);
        return <a href={`#g4-l3-section-${section.code.toLowerCase()}`} key={section.code}><span>{section.code}</span>{label.text}</a>;
      })}
    </nav> : null}

    {visibleSections.map(({section, pages}) => {
      const sectionLabel = getG4L3SectionLabel(section, locale);
      return <section className="lesson-section lesson-contract-section" id={`g4-l3-section-${section.code.toLowerCase()}`} key={section.code}>
        <header>
          <span>{section.code}</span>
          <h2 lang={sectionLabel.sourceLanguage}>{sectionLabel.text}</h2>
          <p>{pages.length} / {section.activePageCount} {spanish ? 'páginas visibles' : 'visible pages'}</p>
        </header>
        <ol start={pages[0]!.globalPageOrdinal}>
          {pages.map((page) => {
            const status = statusFor(statusById, page.animationId);
            return <li
              data-animation-id={page.animationId}
              data-batch-id={page.batchId}
              data-global-page-ordinal={page.globalPageOrdinal}
              data-next-animation-id={page.nextAnimationId ?? ''}
              data-previous-animation-id={page.previousAnimationId ?? ''}
              data-spanish-title-status={page.spanishTitleStatus}
              key={page.animationId}
            >
              <div className="lesson-contract-page__main">
                <span className="lesson-contract-page__ordinal" aria-label={`${spanish ? 'Página' : 'Page'} ${page.globalPageOrdinal}`}>{page.globalPageOrdinal}</span>
                <Link data-audit-placeholder={status === 'complete' ? undefined : 'true'} href={`/animations/${page.animationId}${status === 'complete' ? '' : '?auditContext=g4-l3-lesson'}`}><PageTitle locale={locale} page={page} /></Link>
              </div>
              <div className="lesson-contract-page__meta">
                <span className={`status-chip status-chip--${status}`}>{status}</span>
                <small>{section.code}{String(page.sectionPageOrdinal).padStart(2, '0')} · {page.batchId}</small>
                {page.xmlNavigation === null ? null : <small>XML Navigation: {page.xmlNavigation}</small>}
              </div>
            </li>;
          })}
        </ol>
      </section>;
    })}
  </div>;
}

function NavigationTarget({
  animationId,
  auditPreview,
  children,
  completeAnimationIds,
  releasePublished,
}: {
  animationId: string | null;
  auditPreview: boolean;
  children: React.ReactNode;
  completeAnimationIds: ReadonlySet<string>;
  releasePublished: boolean;
}) {
  const complete = animationId !== null && completeAnimationIds.has(animationId);
  return canNavigateToG4L3Animation(animationId, {auditPreview, completeAnimationIds, releasePublished})
    ? <Link data-audit-placeholder={complete ? undefined : 'true'} href={`/animations/${animationId}${complete ? '' : '?auditContext=g4-l3-lesson'}`}>{children}</Link>
    : <span aria-disabled="true">{children}</span>;
}

export function G4L3LessonContextNavigation({
  animationId,
  auditPreview,
  completeAnimationIds,
  locale,
  releasePublished,
}: {
  animationId: string;
  auditPreview: boolean;
  completeAnimationIds: ReadonlySet<string>;
  locale: G4L3Locale;
  releasePublished: boolean;
}) {
  const page = findG4L3Page(animationId);
  const shell = isG4L3Shell(animationId);
  if (!page && !shell) return null;

  const spanish = locale === 'es';
  const currentSection = page ? findG4L3Section(page.sectionCode) : null;
  return <nav
    aria-label={spanish ? 'Navegación de la lección 3' : 'Lesson 3 navigation'}
    className="lesson-context-navigation"
    data-animation-id={animationId}
    data-lesson-placement={page ? String(page.globalPageOrdinal) : 'shell'}
  >
    <div className="lesson-context-navigation__primary">
      <Link href="/courses/4/3">← {spanish ? 'Mapa de la lección' : 'Lesson map'}</Link>
      <span>{shell
        ? (spanish ? 'Shell del curso' : 'Course shell')
        : `${spanish ? 'Página' : 'Page'} ${page!.globalPageOrdinal} / ${G4_L3_LESSON.activePageCount}`}</span>
      {page ? <span>{page.sectionCode}{String(page.sectionPageOrdinal).padStart(2, '0')}</span> : null}
    </div>
    {page ? <div className="lesson-context-navigation__adjacent">
      <NavigationTarget animationId={page.previousAnimationId} auditPreview={auditPreview} completeAnimationIds={completeAnimationIds} releasePublished={releasePublished}>← {spanish ? 'Anterior' : 'Previous'}</NavigationTarget>
      <NavigationTarget animationId={page.nextAnimationId} auditPreview={auditPreview} completeAnimationIds={completeAnimationIds} releasePublished={releasePublished}>{spanish ? 'Siguiente' : 'Next'} →</NavigationTarget>
    </div> : null}
    <div className="lesson-context-navigation__sections" aria-label={spanish ? 'Ir a la primera página de una sección' : 'Go to a section first page'}>
      {G4_L3_LESSON.sections.map((section) => {
        const label = getG4L3SectionLabel(section, locale);
        const enabled = canNavigateToG4L3Animation(section.firstActiveAnimationId, {auditPreview, completeAnimationIds, releasePublished});
        const current = currentSection?.code === section.code;
        return enabled
          ? <Link aria-current={current ? 'location' : undefined} data-audit-placeholder={completeAnimationIds.has(section.firstActiveAnimationId) ? undefined : 'true'} href={`/animations/${section.firstActiveAnimationId}${completeAnimationIds.has(section.firstActiveAnimationId) ? '' : '?auditContext=g4-l3-lesson'}`} key={section.code}><span>{section.code}</span>{label.text}</Link>
          : <span aria-disabled="true" key={section.code}><span>{section.code}</span>{label.text}</span>;
      })}
    </div>
  </nav>;
}
