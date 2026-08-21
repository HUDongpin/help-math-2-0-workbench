'use client';

import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  CircleHelp,
  Check,
  Gauge,
  Globe2,
  Headphones,
  Languages,
  Lightbulb,
  LockKeyhole,
  PencilLine,
  Sparkles,
  Target,
  Volume2,
} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';

import {Link} from '@/i18n/navigation';
import {
  G4_L3_WHOLE_LESSON_STORAGE_KEY,
  g4L3CompletionPercent,
  parseG4L3WholeLessonProgress,
  type G4L3WholeLessonProgress,
} from '@/lib/g4-l3-whole-lesson';
import {
  G4_L3_LESSON,
  getG4L3SectionLabel,
  type G4L3Locale,
} from '@/lib/g4-l3-lesson-navigation';

import styles from './learning-platform-home.module.css';

const STEP_ICONS = [
  Gauge,
  Globe2,
  BookOpenText,
  Lightbulb,
  PencilLine,
  Target,
  BrainCircuit,
  BadgeCheck,
] as const;

type ProgressSnapshot = Readonly<{
  currentPage: number;
  currentSectionCode: string;
  percent: number;
  reviewed: number;
  visited: number;
}>;

function snapshotFor(progress: G4L3WholeLessonProgress): ProgressSnapshot {
  const page = G4_L3_LESSON.pages.find(
    (candidate) => candidate.animationId === progress.currentAnimationId,
  ) ?? G4_L3_LESSON.pages[0]!;
  return {
    currentPage: page.globalPageOrdinal,
    currentSectionCode: page.sectionCode,
    percent: g4L3CompletionPercent(progress),
    reviewed: progress.completedAnimationIds.length,
    visited: progress.visitedAnimationIds.length,
  };
}

function readProgress(locale: G4L3Locale): ProgressSnapshot {
  try {
    return snapshotFor(parseG4L3WholeLessonProgress(
      window.localStorage.getItem(G4_L3_WHOLE_LESSON_STORAGE_KEY),
      locale,
    ));
  } catch {
    return snapshotFor(parseG4L3WholeLessonProgress(null, locale));
  }
}

function NumberLinePreview({spanish}: {spanish: boolean}) {
  return <div
    aria-label={spanish
      ? 'Vista previa de una recta numérica de menos cinco a cinco, con menos tres resaltado'
      : 'Preview of a number line from negative five to five, with negative three highlighted'}
    className={styles.numberLine}
    role="img"
  >
    <div aria-hidden="true" className={styles.numberLineTrack}>
      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((number) => <span
        className={number === -3 ? styles.numberLineActive : undefined}
        key={number}
      >
        <i />
        <b>{number}</b>
      </span>)}
    </div>
    <p><strong>−3</strong>{spanish ? ' está tres pasos a la izquierda de cero.' : ' is three steps left of zero.'}</p>
  </div>;
}

export function LearningPlatformHome({locale}: {locale: G4L3Locale}) {
  const spanish = locale === 'es';
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    const refresh = () => setProgress(readProgress(locale));
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [locale]);

  const currentSection = useMemo(() => G4_L3_LESSON.sections.find(
    (section) => section.code === progress?.currentSectionCode,
  ) ?? G4_L3_LESSON.sections[0]!, [progress?.currentSectionCode]);
  const hasProgress = Boolean(
    progress && (progress.currentPage > 1 || progress.reviewed > 0 || progress.visited > 1),
  );

  const labels = spanish ? {
    eyebrow: 'TU ESPACIO DE APRENDIZAJE · GRADO 4',
    title: 'Las matemáticas se entienden mejor cuando puedes verlas.',
    intro: 'Explora los números negativos con modelos visuales, palabras claras y ayuda cuando la necesites.',
    start: hasProgress ? 'Continuar la lección' : 'Comenzar la lección',
    support: 'Ver apoyos de aprendizaje',
    courseEyebrow: hasProgress ? 'CONTINÚA DONDE TERMINASTE' : 'TU PRIMERA LECCIÓN',
    courseMeta: 'Grado 4 · Lección 3',
    courseTitle: 'Negative Numbers',
    courseSummary: 'Muestra de 39 páginas completamente navegable en JavaScript actual · interfaz bilingüe + Nova',
    reviewed: 'páginas repasadas',
    visited: 'visitadas',
    current: 'Ahora',
    pathEyebrow: 'TU RECORRIDO',
    pathTitle: 'Ocho pasos, a tu ritmo',
    pathIntro: 'Cada paso conserva el orden de la lección. Puedes volver, repetir y continuar en este navegador.',
    supportsEyebrow: 'APOYOS PARA TODOS',
    supportsTitle: 'Elige la ayuda que te sirva',
    supportsIntro: 'Los apoyos son opciones privadas de aprendizaje. No muestran ni requieren etiquetas personales.',
    novaTitle: 'Pregunta a Nova Tutor',
    novaBody: 'Pide una explicación, una pista paso a paso o una revisión de tu razonamiento.',
    languageTitle: 'Interfaz en English y Español',
    languageBody: 'Cambia el idioma de la interfaz y de Nova sin perder tu lugar. Los medios y las interacciones de origen varían según la página; no forman una experiencia completa ni validada en español.',
    accessTitle: 'Mira, lee y usa los apoyos disponibles',
    accessBody: 'Usa texto legible, palabras clave y los controles disponibles. La narración y otros medios de origen varían según la página y no cuentan con aceptación estricta de fidelidad de audio.',
    progressTitle: 'Tu progreso te pertenece',
    progressBody: 'El progreso local se guarda en este navegador. Los eventos de aprendizaje sincronizados usan un identificador seudónimo y nunca incluyen preguntas de Nova, voz, fotos ni etiquetas estudiantiles.',
    nextEyebrow: 'BIBLIOTECA DE CURSOS',
    nextTitle: 'Empezamos con una muestra navegable de 39 páginas',
    nextBody: 'Grade 4 Lesson 3 es una muestra de 39 páginas completamente navegable en JavaScript actual. Es acceso funcional a la plataforma educativa, pero no demuestra fidelidad estricta a Flash, aceptación del propietario ni publicación del currículo más amplio.',
    preparing: 'En preparación',
    privacy: 'Privacidad y datos',
  } : {
    eyebrow: 'YOUR LEARNING SPACE · GRADE 4',
    title: 'Math makes more sense when you can see it.',
    intro: 'Explore negative numbers with visual models, clear language, and help whenever you need it.',
    start: hasProgress ? 'Continue your lesson' : 'Start your lesson',
    support: 'See learning supports',
    courseEyebrow: hasProgress ? 'PICK UP WHERE YOU LEFT OFF' : 'YOUR FIRST LESSON',
    courseMeta: 'Grade 4 · Lesson 3',
    courseTitle: 'Negative Numbers',
    courseSummary: 'Fully navigable 39-page current-JavaScript showcase · bilingual interface + Nova',
    reviewed: 'pages reviewed',
    visited: 'visited',
    current: 'Now',
    pathEyebrow: 'YOUR LESSON JOURNEY',
    pathTitle: 'Eight steps, at your pace',
    pathIntro: 'Each step keeps the source lesson order. You can go back, replay, and continue on this browser.',
    supportsEyebrow: 'SUPPORTS FOR EVERY LEARNER',
    supportsTitle: 'Choose the help that works for you',
    supportsIntro: 'Supports are private learning choices. They do not display or require personal labels.',
    novaTitle: 'Ask Nova Tutor',
    novaBody: 'Ask for a concept explanation, a step-by-step hint, or a check of your reasoning.',
    languageTitle: 'English and Español interface',
    languageBody: 'Switch the interface and Nova without losing your place. Source media and interactions vary by page; they are not a complete or validated Spanish experience.',
    accessTitle: 'See it, read it, use available supports',
    accessBody: 'Use readable text, key words, and available controls. Narration and other source media vary by page and do not have strict audio-fidelity acceptance.',
    progressTitle: 'Your progress belongs to you',
    progressBody: 'Local progress stays in this browser. Synced learning events use a pseudonymous identifier and never include Nova questions, voice, photos, or student labels.',
    nextEyebrow: 'COURSE LIBRARY',
    nextTitle: 'We are starting with a navigable 39-page showcase',
    nextBody: 'Grade 4 Lesson 3 is a fully navigable 39-page current-JavaScript showcase. It is runnable learning-platform access, but it does not establish strict Flash fidelity, Owner acceptance, or publication of the wider curriculum.',
    preparing: 'In preparation',
    privacy: 'Privacy & data',
  };

  return <div className={styles.platform}>
    <section className={styles.hero}>
      <div aria-hidden="true" className={styles.orbOne} />
      <div aria-hidden="true" className={styles.orbTwo} />
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{labels.eyebrow}</p>
        <h1>{labels.title}</h1>
        <p className={styles.heroIntro}>{labels.intro}</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} href="/courses/4/3?mode=focus">
            {labels.start}<ArrowRight aria-hidden="true" size={19} />
          </Link>
          <a className={styles.secondaryAction} href="#learning-supports">{labels.support}</a>
        </div>
        <ul className={styles.trustList}>
          <li><Check aria-hidden="true" size={15} /> {spanish ? 'Interfaz English + Español' : 'English + Español interface'}</li>
          <li><Check aria-hidden="true" size={15} /> Nova Tutor</li>
          <li><Check aria-hidden="true" size={15} /> {spanish ? 'Progreso continuo' : 'Continue progress'}</li>
        </ul>
      </div>

      <article aria-labelledby="featured-course-title" className={styles.courseCard}>
        <div className={styles.courseCardTop}>
          <p>{labels.courseEyebrow}</p>
          <span><BookOpenText aria-hidden="true" size={17} /> {labels.courseMeta}</span>
        </div>
        <div className={styles.lessonPreview}>
          <div>
            <span>{spanish ? 'MUESTRA JS ACTUAL' : 'CURRENT-JS SHOWCASE'}</span>
            <h2 id="featured-course-title">{labels.courseTitle}</h2>
          </div>
          <NumberLinePreview spanish={spanish} />
          <div className={styles.novaPeek}>
            <Sparkles aria-hidden="true" size={18} />
            <p><strong>Nova Tutor</strong>{spanish
              ? 'Puedo explicarlo de otra manera.'
              : 'I can explain it another way.'}</p>
          </div>
        </div>
        <p className={styles.courseSummary}>{labels.courseSummary}</p>
        <div className={styles.progressBlock} id="progress">
          <div>
            <span>{progress?.percent ?? 0}%</span>
            <p>{progress?.reviewed ?? 0} / 39 {labels.reviewed} · {progress?.visited ?? 1} {labels.visited}</p>
          </div>
          <div
            aria-label={`${progress?.percent ?? 0}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress?.percent ?? 0}
            className={styles.progressTrack}
            role="progressbar"
          ><i style={{width: `${progress?.percent ?? 0}%`}} /></div>
          <p><strong>{labels.current}:</strong>{' '}{getG4L3SectionLabel(currentSection, locale).text} · {spanish ? 'Página' : 'Page'} {progress?.currentPage ?? 1}</p>
        </div>
        <Link className={styles.cardAction} href="/courses/4/3?mode=focus">
          {labels.start}<ArrowRight aria-hidden="true" size={18} />
        </Link>
      </article>
    </section>

    <section aria-labelledby="journey-title" className={styles.journey}>
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>{labels.pathEyebrow}</p>
        <h2 id="journey-title">{labels.pathTitle}</h2>
        <p>{labels.pathIntro}</p>
      </div>
      <ol className={styles.stepGrid}>
        {G4_L3_LESSON.sections.map((section, index) => {
          const active = section.code === currentSection.code;
          const StepIcon = STEP_ICONS[index] ?? CircleHelp;
          return <li className={active ? styles.stepActive : undefined} key={section.code}>
            <span><StepIcon aria-hidden="true" /></span>
            <div>
              <small>{String(index + 1).padStart(2, '0')} · {section.activePageCount} {spanish ? 'pág.' : 'pg.'}</small>
              <strong>{getG4L3SectionLabel(section, locale).text}</strong>
            </div>
            {active ? <i>{labels.current}</i> : null}
          </li>;
        })}
      </ol>
    </section>

    <section aria-labelledby="supports-title" className={styles.supports} id="learning-supports">
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>{labels.supportsEyebrow}</p>
        <h2 id="supports-title">{labels.supportsTitle}</h2>
        <p>{labels.supportsIntro}</p>
      </div>
      <div className={styles.supportGrid}>
        <article>
          <span className={styles.supportIcon}><Sparkles aria-hidden="true" /></span>
          <h3>{labels.novaTitle}</h3>
          <p>{labels.novaBody}</p>
          <Link href="/courses/4/3?mode=focus">{spanish ? 'Abrir la lección' : 'Open the lesson'}<ArrowRight aria-hidden="true" size={16} /></Link>
        </article>
        <article>
          <span className={styles.supportIcon}><Languages aria-hidden="true" /></span>
          <h3>{labels.languageTitle}</h3>
          <p>{labels.languageBody}</p>
          <span className={styles.supportPills}><i>EN UI</i><i>ES UI</i></span>
        </article>
        <article>
          <span className={styles.supportIcon}><Headphones aria-hidden="true" /></span>
          <h3>{labels.accessTitle}</h3>
          <p>{labels.accessBody}</p>
          <span className={styles.supportPills}><i><Volume2 aria-hidden="true" size={13} /> {spanish ? 'Audio según página' : 'Audio varies by page'}</i><i>{spanish ? 'Texto' : 'Text'}</i></span>
        </article>
      </div>
      <aside className={styles.privacyNote}>
        <LockKeyhole aria-hidden="true" size={22} />
        <div><strong>{labels.progressTitle}</strong><p>{labels.progressBody}</p></div>
        <Link href="/privacy">{labels.privacy}<ArrowRight aria-hidden="true" size={16} /></Link>
      </aside>
    </section>

    <section aria-labelledby="library-title" className={styles.libraryPreview}>
      <div>
        <p className={styles.eyebrow}>{labels.nextEyebrow}</p>
        <h2 id="library-title">{labels.nextTitle}</h2>
        <p>{labels.nextBody}</p>
      </div>
      <div className={styles.libraryCards}>
        <Link className={styles.availableCourse} href="/courses/4/3?mode=focus">
          <span>04</span><div><small>{labels.courseMeta}</small><strong>{labels.courseTitle}</strong><p>39 / 39 {spanish ? 'páginas navegables · muestra JS actual' : 'navigable pages · current-JS showcase'}</p></div><ArrowRight aria-hidden="true" />
        </Link>
        {[4, 5].map((lesson) => <article className={styles.futureCourse} key={lesson}>
          <span>{String(lesson).padStart(2, '0')}</span><div><small>{spanish ? 'Próxima lección' : 'Next lesson'}</small><strong>{labels.preparing}</strong></div><LockKeyhole aria-hidden="true" size={19} />
        </article>)}
      </div>
    </section>
  </div>;
}
