import {Link} from '@/i18n/navigation';
import {
  canNavigateToLessonAnimation,
  findLessonPage,
  findLessonSection,
  getLessonPageLabel,
  getLessonSectionLabel,
  getVisibleLessonPages,
  isLessonReleaseOpen,
  type LessonLocale,
  type LessonNavigationDescriptor,
  type LessonNavigationPage,
} from '@/lib/lesson-navigation';

type StatusById = Readonly<Record<string, string>>;

function statusFor(statusById: StatusById, animationId: string): string {
  return statusById[animationId] ?? 'discovered';
}

function auditHref(animationId: string, releaseId: string, complete: boolean): string {
  return `/animations/${animationId}${complete ? '' : `?auditContext=${encodeURIComponent(releaseId)}`}`;
}

function PageTitle({locale, page}: {locale: LessonLocale; page: LessonNavigationPage}) {
  const label = getLessonPageLabel(page, locale);
  return <span className="lesson-contract-page__title">
    <span lang={label.sourceLanguage}>{label.text}</span>
    {label.usesEnglishFallback
      ? <small lang="es">Sin etiqueta en español en la fuente; se conserva el inglés original.</small>
      : null}
  </span>;
}

export function LessonMap({
  auditPreview,
  completeAnimationIds,
  descriptor,
  locale,
  releasePublished,
  statusById,
}: {
  auditPreview: boolean;
  completeAnimationIds: ReadonlySet<string>;
  descriptor: LessonNavigationDescriptor;
  locale: LessonLocale;
  releasePublished: boolean;
  statusById: StatusById;
}) {
  const spanish = locale === 'es';
  const releaseOpen = isLessonReleaseOpen(descriptor, {
    auditPreview,
    completeAnimationIds,
    releasePublished,
  });
  const visiblePages = getVisibleLessonPages(descriptor, {
    auditPreview,
    completeAnimationIds,
    releasePublished,
  });
  const visiblePageIds = new Set(visiblePages.map((page) => page.animationId));
  const visibleSections = descriptor.sections
    .map((section) => ({
      section,
      pages: descriptor.pages.filter(
        (page) => page.sectionCode === section.code && visiblePageIds.has(page.animationId),
      ),
    }))
    .filter(({pages}) => pages.length > 0);
  const strictPageCount = descriptor.pages.filter(
    (page) => completeAnimationIds.has(page.animationId),
  ).length;
  const strictShellCount = completeAnimationIds.has(descriptor.shell.animationId) ? 1 : 0;
  const shellVisible = auditPreview || releaseOpen;
  const shellComplete = completeAnimationIds.has(descriptor.shell.animationId);
  const idPrefix = descriptor.releaseId.replace(/[^a-z0-9_-]/gi, '-');

  return <div
    className="lesson-contract"
    data-active-page-count={descriptor.activePageCount}
    data-audit-preview={auditPreview ? 'true' : 'false'}
    data-course-shell-count={descriptor.courseShellCount}
    data-current-strict-page-count={strictPageCount}
    data-current-strict-shell-count={strictShellCount}
    data-lesson-contract="release-driven-active-xml-order-v1"
    data-release-id={descriptor.releaseId}
    data-release-open={releaseOpen ? 'true' : 'false'}
    data-release-published={releasePublished ? 'true' : 'false'}
  >
    <aside className="lesson-contract-boundary" role="note">
      <strong>{auditPreview
        ? (spanish ? 'Mapa de auditoría neutral respecto a la aceptación' : 'Acceptance-neutral audit map')
        : (spanish ? 'Lección publicada como una unidad completa' : 'Lesson published as one complete unit')}</strong>
      <p>{spanish
        ? `El release conserva ${descriptor.activePageCount} páginas activas y 1 shell. Solo ${strictPageCount} páginas y ${strictShellCount} shell están admitidos actualmente por el ledger estricto.`
        : `The release preserves ${descriptor.activePageCount} active pages and 1 shell. Only ${strictPageCount} pages and ${strictShellCount} shell are currently admitted by the strict ledger.`}</p>
      {auditPreview ? <p>{spanish
        ? 'La presencia en este mapa no significa paridad con Flash, aceptación de audio, revisión humana o del propietario, finalización estricta ni publicación.'
        : 'Presence in this map does not mean Flash parity, audio acceptance, human or owner review, strict completion, or publication.'}</p> : null}
    </aside>

    {shellVisible ? <section className="lesson-contract-shell" aria-labelledby={`${idPrefix}-shell-heading`}>
      <div>
        <p className="eyebrow">{spanish
          ? `Shell del curso · elemento ${descriptor.shell.memberOrdinal}`
          : `Course shell · item ${descriptor.shell.memberOrdinal}`}</p>
        <h2 id={`${idPrefix}-shell-heading`}>{spanish ? 'Navegación de la lección' : 'Lesson navigation shell'}</h2>
        <p><code>{descriptor.shell.animationId}</code></p>
      </div>
      <div>
        <span className={`status-chip status-chip--${statusFor(statusById, descriptor.shell.animationId)}`}>{statusFor(statusById, descriptor.shell.animationId)}</span>
        <Link
          data-audit-placeholder={shellComplete ? undefined : 'true'}
          href={auditHref(descriptor.shell.animationId, descriptor.releaseId, shellComplete)}
        >{spanish ? 'Abrir proyección de auditoría del shell' : 'Open shell audit projection'} →</Link>
      </div>
    </section> : null}

    {visibleSections.length ? <nav aria-label={spanish ? 'Secciones de la lección' : 'Lesson sections'} className="lesson-contract-section-nav">
      {visibleSections.map(({section}) => {
        const label = getLessonSectionLabel(section, locale);
        return <a href={`#${idPrefix}-section-${section.code.toLowerCase()}`} key={section.code}>
          <span>{section.code}</span>{label.text}
        </a>;
      })}
    </nav> : null}

    {visibleSections.map(({section, pages}) => {
      const sectionLabel = getLessonSectionLabel(section, locale);
      return <section className="lesson-section lesson-contract-section" id={`${idPrefix}-section-${section.code.toLowerCase()}`} key={section.code}>
        <header>
          <span>{section.code}</span>
          <h2 lang={sectionLabel.sourceLanguage}>{sectionLabel.text}</h2>
          <p>{pages.length} / {section.activePageCount} {spanish ? 'páginas visibles' : 'visible pages'}</p>
        </header>
        <ol start={pages[0]!.globalPageOrdinal}>
          {pages.map((page) => {
            const status = statusFor(statusById, page.animationId);
            const complete = completeAnimationIds.has(page.animationId);
            return <li
              data-animation-id={page.animationId}
              data-global-page-ordinal={page.globalPageOrdinal}
              data-next-animation-id={page.nextAnimationId ?? ''}
              data-previous-animation-id={page.previousAnimationId ?? ''}
              data-source-occurrence={page.sourceOccurrence}
              key={page.animationId}
            >
              <div className="lesson-contract-page__main">
                <span className="lesson-contract-page__ordinal" aria-label={`${spanish ? 'Página' : 'Page'} ${page.globalPageOrdinal}`}>{page.globalPageOrdinal}</span>
                <Link
                  data-audit-placeholder={complete ? undefined : 'true'}
                  href={auditHref(page.animationId, descriptor.releaseId, complete)}
                ><PageTitle locale={locale} page={page} /></Link>
              </div>
              <div className="lesson-contract-page__meta">
                <span className={`status-chip status-chip--${status}`}>{status}</span>
                <small>{section.code}{String(page.sectionPageOrdinal).padStart(2, '0')}</small>
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
  descriptor,
  releasePublished,
}: {
  animationId: string | null;
  auditPreview: boolean;
  children: React.ReactNode;
  completeAnimationIds: ReadonlySet<string>;
  descriptor: LessonNavigationDescriptor;
  releasePublished: boolean;
}) {
  const complete = animationId !== null && completeAnimationIds.has(animationId);
  return canNavigateToLessonAnimation(descriptor, animationId, {
    auditPreview,
    completeAnimationIds,
    releasePublished,
  })
    ? <Link data-audit-placeholder={complete ? undefined : 'true'} href={auditHref(animationId!, descriptor.releaseId, complete)}>{children}</Link>
    : <span aria-disabled="true">{children}</span>;
}

export function LessonContextNavigation({
  animationId,
  auditPreview,
  completeAnimationIds,
  descriptor,
  locale,
  releasePublished,
}: {
  animationId: string;
  auditPreview: boolean;
  completeAnimationIds: ReadonlySet<string>;
  descriptor: LessonNavigationDescriptor;
  locale: LessonLocale;
  releasePublished: boolean;
}) {
  const page = findLessonPage(descriptor, animationId);
  const shell = animationId === descriptor.shell.animationId;
  if (!page && !shell) return null;

  const spanish = locale === 'es';
  const currentSection = page ? findLessonSection(descriptor, page.sectionCode) : undefined;
  return <nav
    aria-label={spanish ? `Navegación de la lección ${descriptor.lesson}` : `Lesson ${descriptor.lesson} navigation`}
    className="lesson-context-navigation"
    data-animation-id={animationId}
    data-lesson-placement={page ? String(page.globalPageOrdinal) : 'shell'}
    data-release-id={descriptor.releaseId}
  >
    <div className="lesson-context-navigation__primary">
      <Link href={`/courses/${descriptor.grade}/${descriptor.lesson}`}>← {spanish ? 'Mapa de la lección' : 'Lesson map'}</Link>
      <span>{shell
        ? (spanish ? 'Shell del curso' : 'Course shell')
        : `${spanish ? 'Página' : 'Page'} ${page!.globalPageOrdinal} / ${descriptor.activePageCount}`}</span>
      {page ? <span>{page.sectionCode}{String(page.sectionPageOrdinal).padStart(2, '0')}</span> : null}
    </div>
    {page ? <div className="lesson-context-navigation__adjacent">
      <NavigationTarget animationId={page.previousAnimationId} auditPreview={auditPreview} completeAnimationIds={completeAnimationIds} descriptor={descriptor} releasePublished={releasePublished}>← {spanish ? 'Anterior' : 'Previous'}</NavigationTarget>
      <NavigationTarget animationId={page.nextAnimationId} auditPreview={auditPreview} completeAnimationIds={completeAnimationIds} descriptor={descriptor} releasePublished={releasePublished}>{spanish ? 'Siguiente' : 'Next'} →</NavigationTarget>
    </div> : null}
    <div className="lesson-context-navigation__sections" aria-label={spanish ? 'Ir a la primera página de una sección' : 'Go to a section first page'}>
      {descriptor.sections.map((section) => {
        const label = getLessonSectionLabel(section, locale);
        const enabled = canNavigateToLessonAnimation(descriptor, section.firstActiveAnimationId, {
          auditPreview,
          completeAnimationIds,
          releasePublished,
        });
        const complete = completeAnimationIds.has(section.firstActiveAnimationId);
        const current = currentSection?.code === section.code;
        return enabled
          ? <Link
              aria-current={current ? 'location' : undefined}
              data-audit-placeholder={complete ? undefined : 'true'}
              href={auditHref(section.firstActiveAnimationId, descriptor.releaseId, complete)}
              key={section.code}
            ><span>{section.code}</span>{label.text}</Link>
          : <span aria-disabled="true" key={section.code}><span>{section.code}</span>{label.text}</span>;
      })}
    </div>
  </nav>;
}
