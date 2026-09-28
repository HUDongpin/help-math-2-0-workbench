import Link from 'next/link';
import {ArrowRight, BookOpen} from 'lucide-react';

import type {Locale} from '@/content/types';
import {CONTROLLED_PREVIEW_COURSES} from '@/lib/controlled-current-js-preview';
import {isPublic1751Production} from '@/lib/current-js-1751-public-production';
import styles from './controlled-preview-home.module.css';

export function ControlledPreviewHome({locale}: {locale: Locale}) {
  const spanish = locale === 'es';
  const publicCourses = isPublic1751Production();
  const pageCount = CONTROLLED_PREVIEW_COURSES.reduce((sum, course) => sum + course.pageCount, 0);
  const groups = [3, 4, 5].map((grade) => ({
    grade,
    courses: CONTROLLED_PREVIEW_COURSES.filter((course) => course.grade === grade),
  }));
  return <div className={styles.preview} data-controlled-preview-home="true" data-public-courses-home={publicCourses ? 'true' : undefined}>
    <header className={styles.header}>
      <Link className={styles.brand} href={spanish ? '/es' : '/'} aria-label="HELP Math">
        <BookOpen aria-hidden="true" size={26} />
        <span>HELP <strong>Math</strong></span>
      </Link>
      <nav className={styles.languages} aria-label={spanish ? 'Idioma' : 'Language'}>
        <Link href="/" lang="en" aria-current={!spanish ? 'page' : undefined}>EN</Link>
        <Link href="/es" lang="es" aria-current={spanish ? 'page' : undefined}>ES</Link>
      </nav>
    </header>
    <main id="main-content" className={styles.content}>
      <section className={styles.introduction} aria-labelledby="preview-title">
        <span className={styles.label}>{publicCourses ? (spanish ? 'APRENDE MATEMÁTICAS' : 'LEARN MATH') : (spanish ? 'VISTA PREVIA CONTROLADA' : 'CONTROLLED PREVIEW')}</span>
        <h1 id="preview-title">{publicCourses ? (spanish ? 'Explora tus lecciones.' : 'Explore your lessons.') : (spanish ? 'Revisa todas las lecciones.' : 'Review every lesson.')}</h1>
        <p>{publicCourses ? (spanish ? 'Elige una lección y aprende a tu ritmo con ejemplos y actividades.' : 'Choose a lesson and learn at your own pace with examples and activities.') : spanish
          ? 'Abre una lección para revisar sus páginas, los controles de reproducción y el audio disponible.'
          : 'Open a lesson to review its pages, playback controls, and available audio.'}</p>
        <div className={styles.scope} aria-label={spanish ? 'Lecciones disponibles' : 'Available lessons'}>
          <span><strong>{CONTROLLED_PREVIEW_COURSES.length}</strong> {spanish ? 'lecciones' : 'lessons'}</span>
          <span><strong>{pageCount.toLocaleString(locale)}</strong> {spanish ? 'páginas' : 'pages'}</span>
          <span><strong>3–5</strong> {spanish ? 'grados' : 'grades'}</span>
        </div>
      </section>
      <nav className={styles.gradeNavigation} aria-label={spanish ? 'Ir a un grado' : 'Jump to a grade'}>
        {groups.map(({grade}) => <a key={grade} href={`#grade-${grade}`}>
          {spanish ? 'Grado' : 'Grade'} {grade}
        </a>)}
      </nav>
      <div className={styles.grades}>
        {groups.map(({grade, courses}) => <section id={`grade-${grade}`} key={grade} className={styles.grade} aria-labelledby={`grade-title-${grade}`}>
          <header className={styles.gradeHeader}>
            <h2 id={`grade-title-${grade}`}>{spanish ? 'Grado' : 'Grade'} {grade}</h2>
            <p>{courses.length} {spanish ? 'lecciones' : 'lessons'} · {courses.reduce((sum, course) => sum + course.pageCount, 0)} {spanish ? 'páginas' : 'pages'}</p>
          </header>
          <ol className={styles.lessons}>
            {courses.map((course) => <li key={course.releaseId}>
              <Link className={styles.courseLink} href={`${spanish ? '/es' : ''}${course.href}`} prefetch={false}
                data-preview-course={`${grade}/${course.lesson}`} data-page-count={course.pageCount}>
                <span className={styles.lessonNumber} aria-label={`${spanish ? 'Lección' : 'Lesson'} ${course.lesson}`}>{String(course.lesson).padStart(2, '0')}</span>
                <span className={styles.courseName}><strong>{course.title}</strong><span>{course.pageCount} {spanish ? 'páginas' : 'pages'}</span></span>
                <ArrowRight aria-hidden="true" size={19} />
              </Link>
            </li>)}
          </ol>
        </section>)}
      </div>
      <footer className={styles.note}>
        <p>{publicCourses ? (spanish ? 'Puedes repetir los ejemplos cuando lo necesites.' : 'Replay examples whenever you need.') : spanish
          ? 'Esta vista previa reúne las páginas actuales en JavaScript. La revisión del comportamiento didáctico, del audio y la aprobación para publicar siguen siendo decisiones independientes.'
          : 'This preview brings together the current JavaScript pages. Teaching-behavior review, audio review, and approval to publish remain separate decisions.'}</p>
      </footer>
    </main>
  </div>;
}
