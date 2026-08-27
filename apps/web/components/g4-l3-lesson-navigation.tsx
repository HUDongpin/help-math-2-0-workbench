import {Link} from '@/i18n/navigation';
import {
  G4_L3_LESSON,
  canNavigateToG4L3Animation,
  findG4L3Page,
  findG4L3Section,
  getG4L3SectionLabel,
  isG4L3Shell,
  type G4L3Locale,
} from '@/lib/g4-l3-lesson-navigation';

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
