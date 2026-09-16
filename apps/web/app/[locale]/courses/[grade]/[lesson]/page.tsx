import {notFound} from 'next/navigation';

import {LessonInteractionPlayer} from '@/components/lesson-interaction-player';
import {Container} from '@/components/ui';
import {Link} from '@/i18n/navigation';
import {completeAnimations, getCatalog} from '@/lib/catalog';
import {buildLessonDescriptor, isCitedInteractiveLesson} from '@/lib/lesson-descriptor';

export const dynamic = 'force-dynamic';

type Query = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function CoursePage({
  params,
  searchParams
}: {
  params: Promise<{locale: 'en' | 'es'; grade: string; lesson: string}>;
  searchParams: Promise<Query>;
}) {
  const [{locale, grade, lesson}, query] = await Promise.all([params, searchParams]);
  if (!/^[3-5]$/.test(grade) || !/^\d{1,2}$/.test(lesson)) notFound();
  const gradeNumber = Number(grade);
  const lessonNumber = Number(lesson);
  const spanish = locale === 'es';

  if (isCitedInteractiveLesson(gradeNumber, lessonNumber)) {
    const descriptor = buildLessonDescriptor(getCatalog().animations, gradeNumber, lessonNumber);
    if (!descriptor) notFound();
    return (
      <LessonInteractionPlayer
        descriptor={descriptor}
        frameQuery={first(query.frame)}
        locale={locale}
      />
    );
  }

  const animations = completeAnimations()
    .filter(
      (item) =>
        String(item.classification.grade) === grade &&
        String(item.classification.lesson) === String(lessonNumber)
    )
    .sort(
      (left, right) => (left.classification.page?.ordinal ?? 0) - (right.classification.page?.ordinal ?? 0)
    );
  const title =
    animations[0]?.classification.lessonTitleDisplay ??
    `${spanish ? 'Grado' : 'Grade'} ${grade} · ${spanish ? 'Lección' : 'Lesson'} ${lessonNumber}`;
  const sections = Map.groupBy(animations, (item) => item.classification.section?.code ?? 'OTHER');
  return (
    <main id="main-content">
      <header className="archive-page-header archive-page-header--course">
        <Container>
          <p className="eyebrow">
            {spanish ? `Grado ${grade} · Lección ${lessonNumber}` : `Grade ${grade} · Lesson ${lessonNumber}`}
          </p>
          <h1>{title}</h1>
          <p>
            {spanish
              ? 'La secuencia conserva el orden de la lección original y solo enlaza contenido aprobado.'
              : 'The sequence preserves original lesson order and links only strict-complete content.'}
          </p>
        </Container>
      </header>
      <section className="catalog-section">
        <Container>
          {animations.length ? (
            [...sections].map(([code, items]) => (
              <section className="lesson-section" key={code}>
                <header>
                  <span>{code}</span>
                  <h2>{items[0]?.classification.section?.label ?? code}</h2>
                </header>
                <ol>
                  {items.map((animation) => (
                    <li key={animation.animationId}>
                      <Link href={`/animations/${animation.animationId}`}>
                        {animation.classification.titleDisplay}
                      </Link>
                      <small>
                        {animation.classification.page?.number ?? '—'} · {animation.classification.domain}
                      </small>
                    </li>
                  ))}
                </ol>
              </section>
            ))
          ) : (
            <div className="archive-empty">
              <h2>
                {spanish
                  ? 'Esta lección aún no tiene páginas aprobadas.'
                  : 'This lesson has no strict-complete pages yet.'}
              </h2>
              <p>
                <Link href="/library">← {spanish ? 'Volver a la biblioteca' : 'Back to library'}</Link>
              </p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
