'use client';

import {
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  LockKeyhole,
  Moon,
  Printer,
  Sun,
} from 'lucide-react';
import Image from 'next/image';
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';

import {Link} from '@/i18n/navigation';
import type {PublicAuthStatus} from '@/lib/auth-session';
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
import {
  HELP_MATH_1_CURRICULUM_SCOPE,
  HELP_MATH_1_GRADE_FILTERS,
  type HelpMath1GradeFilter,
} from '@/lib/help-math-1-curriculum-scope';
import {
  LEARNER_POWER_SAMPLE,
  LEARNER_SUMMARY_SAMPLE,
  LEARNING_HELPER_SAMPLE,
  LEARNING_PLATFORM_SAMPLE_BOUNDARY,
  LEARNING_SECTIONS,
  LESSON_CATALOG_SAMPLE,
  NOVA_CONTROL_SAMPLE,
  TEACHER_ATTENTION_SAMPLE,
  TEACHER_ROSTER_SAMPLE,
  WORDS_CONTEXT_SAMPLE,
  WORDS_G4_L3,
  WORDS_G5_L4,
  WORDS_WITH_SOURCE_GAPS,
  type LearningPlatformTint,
  type LearningWordSample,
} from '@/lib/learning-platform-sample-data';

import styles from './learning-platform-workspace.module.css';

type Role = 'student' | 'teacher';
type Screen = 'today' | 'practice' | 'words' | 'lessons' | 'class' | 'prep' | 'notes';
type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'helpmath:learning-workspace-theme:v1';

type ProgressSnapshot = Readonly<{
  currentPage: number;
  currentSectionCode: string;
  percent: number;
  reviewed: number;
  visited: number;
}>;

const EMPTY_PROGRESS: ProgressSnapshot = {
  currentPage: 1,
  currentSectionCode: 'IR',
  percent: 0,
  reviewed: 0,
  visited: 1,
};

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

function readProgress(locale: G4L3Locale): G4L3WholeLessonProgress {
  try {
    return parseG4L3WholeLessonProgress(
      window.localStorage.getItem(G4_L3_WHOLE_LESSON_STORAGE_KEY),
      locale,
    );
  } catch {
    return parseG4L3WholeLessonProgress(null, locale);
  }
}

function readThemePreference(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function storeThemePreference(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The selected theme still applies for this page when storage is unavailable.
  }
}

function pick(pair: readonly [string, string], spanish: boolean) {
  return pair[spanish ? 1 : 0];
}

function Emoji({children}: {children: string}) {
  return <span aria-hidden="true" className={styles.emoji}>{children}</span>;
}

function tintClass(tint: LearningPlatformTint | 'mint' | 'sun' | 'peach') {
  const names: Record<string, string> = {
    blue: styles.tintBlue,
    gold: styles.tintGold,
    grape: styles.tintGrape,
    mint: styles.tintMint,
    nova: styles.tintNova,
    peach: styles.tintPeach,
    sky: styles.tintSky,
    sun: styles.tintSun,
  };
  return names[tint] ?? styles.tintBlue;
}

function toggleSet<T>(source: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(source);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function WordCard({
  flipped,
  onFlip,
  spanish,
  word,
}: {
  flipped: boolean;
  onFlip: () => void;
  spanish: boolean;
  word: LearningWordSample;
}) {
  const spanishWord = word.es?.trim() ? word.es : null;
  const primary = spanish && spanishWord ? spanishWord : word.en;
  const secondary = spanishWord ? (spanish ? word.en : spanishWord) : null;
  return (
    <button
      aria-pressed={flipped}
      className={`${styles.wordCard} ${flipped ? styles.wordCardFlipped : ''}`}
      onClick={onFlip}
      type="button"
    >
      <span className={styles.srOnly}>
        <span lang={spanish && spanishWord ? 'es' : 'en'}>{primary}</span>.
        {' '}{secondary
          ? <>{spanish ? 'inglés' : 'Spanish'}: <span lang={spanish ? 'en' : 'es'}>{secondary}</span></>
          : (spanish ? 'Sin español en la fuente' : 'No Spanish in the source')}
      </span>
      <span aria-hidden="true" className={styles.wordCardInner}>
        <span aria-hidden={flipped} className={styles.wordCardFront}>
          <Emoji>{word.emoji}</Emoji>
          <strong lang={spanish && spanishWord ? 'es' : 'en'}>{primary}</strong>
          <small>{spanish ? (spanishWord ? 'Español' : 'inglés') : 'English'}</small>
          <i>{spanish ? 'toca' : 'tap'}</i>
        </span>
        <span aria-hidden={!flipped} className={styles.wordCardBack}>
          <Emoji>{secondary ? word.emoji : '⚠️'}</Emoji>
          <strong lang={secondary && !spanish ? 'es' : 'en'}>{secondary ?? word.en}</strong>
          <small>{secondary
            ? (spanish ? 'inglés' : 'Español')
            : (spanish ? 'La fuente no tiene español' : 'No Spanish in the source')}</small>
        </span>
      </span>
    </button>
  );
}

function StudentToday({
  browserProgress,
  flippedWords,
  g4L3Available,
  locale,
  onFlipWord,
  onOpenWords,
  progress,
}: {
  browserProgress: G4L3WholeLessonProgress | null;
  flippedWords: ReadonlySet<string>;
  g4L3Available: boolean;
  locale: G4L3Locale;
  onFlipWord: (key: string) => void;
  onOpenWords: () => void;
  progress: ProgressSnapshot;
}) {
  const spanish = locale === 'es';
  const currentSection = G4_L3_LESSON.sections.find(
    (section) => section.code === progress.currentSectionCode,
  ) ?? G4_L3_LESSON.sections[0]!;
  const hasBrowserProgress = Boolean(
    browserProgress && (progress.currentPage > 1 || progress.reviewed > 0 || progress.visited > 1),
  );
  const samplePercent = Math.round(LEARNER_SUMMARY_SAMPLE.currentPage / LEARNER_SUMMARY_SAMPLE.totalPages * 1000) / 10;
  const copy = spanish ? {
    browser: `En este navegador: página ${progress.currentPage}, ${progress.reviewed} repasadas`,
    continue: hasBrowserProgress ? 'Continuar mi lección' : 'Comenzar mi lección',
    greeting: '¡Hola María! ¿Lista para seguir?',
    helper: 'Tu ayudante de matemáticas',
    helperBody: 'Pregúntame en inglés o en español. La lección puede compartir la página actual con Nova.',
    lessonUnavailable: 'Lección no disponible en este entorno',
    next: 'Tu siguiente paso',
    powers: 'Tus poderes matemáticos',
    powersNote: 'Cada respuesta hace crecer un poder matemático.',
    lessonProgress: 'Avance en esta lección',
    seeAll: 'Ver todas',
    stickers: 'Estampas de esta lección',
    stickersNote: 'Una estampa por cada uno de los ocho pasos. Sin puntos ni monedas.',
    talk: 'Hablar con Nova',
    today: 'Martes · Grado 4',
    words: 'Palabras de hoy',
    wordsHint: 'Toca una tarjeta para darle la vuelta.',
  } : {
    browser: `This browser: page ${progress.currentPage}, ${progress.reviewed} reviewed`,
    continue: hasBrowserProgress ? 'Continue my lesson' : 'Start my lesson',
    greeting: 'Hi Maria! Ready to keep going?',
    helper: 'Your math helper',
    helperBody: 'Ask in English or Spanish. The lesson can share the current page with Nova.',
    lessonUnavailable: 'Lesson unavailable in this environment',
    next: 'Your next step',
    powers: 'Your math powers',
    powersNote: 'Every answer grows a math power.',
    lessonProgress: 'Progress in this lesson',
    seeAll: 'See all',
    stickers: 'Stickers in this lesson',
    stickersNote: 'One sticker for each of the eight steps. No points or coins.',
    talk: 'Talk to Nova',
    today: 'Tuesday · Grade 4',
    words: "Today's words",
    wordsHint: 'Tap a card to flip it.',
  };

  return (
    <section aria-labelledby="today-title" className={styles.screen} data-workspace-screen="today">
      <div className={styles.greetingRow}>
        <div className={styles.greetingIdentity}>
          <span className={styles.greetingIcon}><Emoji>👋</Emoji></span>
          <div>
            <p className={styles.eyebrow}>{copy.today}</p>
            <h1 id="today-title">{copy.greeting}</h1>
          </div>
        </div>
        <div className={styles.chipRow}>
          <span className={`${styles.chip} ${styles.chipSun}`}>
            <Emoji>🔥</Emoji>{LEARNER_SUMMARY_SAMPLE.streakDays} {spanish ? 'días seguidos' : 'days in a row'}
          </span>
          <span className={`${styles.chip} ${styles.chipMint}`}>
            <Emoji>⭐</Emoji>{LEARNER_SUMMARY_SAMPLE.stickers} {spanish ? 'estampas' : 'stickers'}
          </span>
        </div>
      </div>

      <article className={`${styles.card} ${styles.nextCard}`}>
        <div className={styles.cardMetaRow}>
          <span className={`${styles.chip} ${styles.chipBlue}`}><Emoji>🎯</Emoji>{copy.next}</span>
        </div>
        <div className={styles.nextContent}>
          <span className={`${styles.sectionIconLarge} ${tintClass('sun')}`}><Emoji>💡</Emoji></span>
          <div className={styles.nextCopy}>
            <p className={styles.eyebrow}>Grade 4 · Lesson 3 · Learn It</p>
            <h2 lang="en">Negative Numbers</h2>
            {spanish && !G4_L3_LESSON.titleSpanish
              ? <span className={styles.sourceGapLabel}>⚠️ inglés · la fuente no tiene español</span>
              : null}
            <p>{spanish
              ? 'Te quedaste en el paso 4 de 8. Sigue justo ahí.'
              : 'You stopped at step 4 of 8. Pick up right there.'}</p>
            <span className={styles.browserResume}>{copy.browser} · {getG4L3SectionLabel(currentSection, locale).text}</span>
          </div>
          {g4L3Available
            ? <Link className={styles.primaryAction} href="/courses/4/3?mode=focus">
                {copy.continue}<ArrowRight aria-hidden="true" size={19} />
              </Link>
            : <span aria-disabled="true" className={`${styles.primaryAction} ${styles.actionDisabled}`}>
                {copy.lessonUnavailable}<LockKeyhole aria-hidden="true" size={18} />
              </span>}
        </div>
        <div className={styles.progressBlock}>
          <div className={styles.progressMeta}>
            <span>{copy.lessonProgress}</span>
            <strong>{LEARNER_SUMMARY_SAMPLE.currentPage} / {LEARNER_SUMMARY_SAMPLE.totalPages}</strong>
          </div>
          <div
            aria-label={`${samplePercent}% ${spanish ? 'avance en esta lección' : 'progress in this lesson'}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={samplePercent}
            className={styles.progressTrack}
            role="progressbar"
          ><i style={{width: `${samplePercent}%`}} /></div>
        </div>
      </article>

      <div className={styles.dashboardGrid}>
        <div className={styles.dashboardMain}>
          <article className={styles.card}>
            <div className={styles.panelHeader}>
              <div><Emoji>💪</Emoji><h2>{copy.powers}</h2></div>
            </div>
            <div className={styles.powerList}>
              {LEARNER_POWER_SAMPLE.map((power) => {
                const pips = Math.max(1, Math.min(5, Math.round(power.probability * 5)));
                const label = power.probability >= 0.8
                  ? (spanish ? '¡Fuerte!' : 'Strong!')
                  : power.probability >= 0.5
                    ? (spanish ? 'Ya casi' : 'Getting there')
                    : (spanish ? 'Empezando' : 'Just starting');
                const badge = power.probability >= 0.8 ? '💪' : power.probability >= 0.5 ? '🌤️' : '🌱';
                return <div className={`${styles.powerRow} ${tintClass(power.tint)}`} key={power.en}>
                  <div className={styles.powerHeading}>
                    <span className={styles.termPair}>
                      <strong lang={spanish ? 'es' : 'en'}>{spanish ? power.es : power.en}</strong>
                      <small data-language={spanish ? 'en' : 'es'} lang={spanish ? 'en' : 'es'}>{spanish ? power.en : power.es}</small>
                    </span>
                    <span className={styles.powerBand}><Emoji>{badge}</Emoji>{label}</span>
                  </div>
                  <div aria-label={`${pips} / 5`} className={styles.powerPips} role="img">
                    {Array.from({length: 5}, (_, index) => <i data-on={index < pips ? 'true' : 'false'} key={index} />)}
                  </div>
                </div>;
              })}
            </div>
            <p className={styles.panelNote}>{copy.powersNote}</p>
          </article>

          <article className={styles.card}>
            <div className={styles.panelHeader}>
              <div><Emoji>🏅</Emoji><h2>{copy.stickers}</h2></div>
              <span className={styles.chip}>{LEARNER_SUMMARY_SAMPLE.stickers} / {LEARNER_SUMMARY_SAMPLE.totalSteps}</span>
            </div>
            <div className={styles.stickerShelf}>
              {LEARNING_SECTIONS.map((section, index) => <span
                aria-label={`${pick(section.kid, spanish)} — ${index < LEARNER_SUMMARY_SAMPLE.stickers ? (spanish ? 'ganada' : 'earned') : (spanish ? 'todavía no' : 'not yet')}`}
                className={`${styles.sticker} ${tintClass(section.tint)}`}
                data-earned={index < LEARNER_SUMMARY_SAMPLE.stickers ? 'true' : 'false'}
                key={section.code}
                role="img"
              ><Emoji>{section.emoji}</Emoji></span>)}
            </div>
            <p className={styles.panelNote}>{copy.stickersNote}</p>
          </article>
        </div>

        <aside className={styles.dashboardSide}>
          <article className={`${styles.card} ${styles.novaCard}`} id="learning-help">
            <div className={styles.novaHeading}>
              <span className={styles.novaAvatar}><Emoji>🤖</Emoji></span>
              <div><h2>Nova</h2><p>{copy.helper}</p></div>
            </div>
            <p>{copy.helperBody}</p>
            {g4L3Available
              ? <Link className={styles.novaAction} href="/courses/4/3?mode=focus">
                  {copy.talk}<ArrowRight aria-hidden="true" size={18} />
                </Link>
              : <span aria-disabled="true" className={`${styles.novaAction} ${styles.actionDisabled}`}>
                  {copy.lessonUnavailable}<LockKeyhole aria-hidden="true" size={18} />
                </span>}
          </article>

          <article className={styles.card} id="today-words">
            <div className={styles.panelHeader}>
              <div><Emoji>🔤</Emoji><h2>{copy.words}</h2></div>
              <button className={styles.secondaryButton} onClick={onOpenWords} type="button">{copy.seeAll}</button>
            </div>
            <p className={styles.panelNote}>{copy.wordsHint}</p>
            <div className={styles.miniWordGrid}>
              {[WORDS_G4_L3[3], WORDS_G4_L3[4]].map((word) => <WordCard
                flipped={flippedWords.has(word.en)}
                key={word.en}
                onFlip={() => onFlipWord(word.en)}
                spanish={spanish}
                word={word}
              />)}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function PracticeScreen({locale}: {locale: G4L3Locale}) {
  const spanish = locale === 'es';
  const [value, setValue] = useState(0);
  const [checked, setChecked] = useState(false);
  const correct = value === -6;

  return <section aria-labelledby="practice-title" className={styles.screen} data-workspace-screen="practice">
    <div className={styles.screenHeading}>
      <p className={styles.eyebrow}>Try It · {spanish ? 'Pregunta 3 de 5' : 'Question 3 of 5'}</p>
      <h1 id="practice-title">{spanish ? '¿Dónde va −6?' : 'Where does −6 go?'}</h1>
      <p>{spanish
        ? 'Mueve el punto sobre la recta numérica. La ayuda te guía sin revelar la respuesta cuando te equivocas.'
        : 'Move the point on the number line. The support guides without revealing the answer when you miss.'}</p>
    </div>
    <div className={`${styles.card} ${styles.practiceCard}`}>
      <label className={styles.rangeLabel} htmlFor="negative-number-practice">
        <span>{spanish ? 'Tu punto' : 'Your point'}</span><strong>{value}</strong>
      </label>
      <input
        aria-valuetext={`${value}`}
        id="negative-number-practice"
        max={10}
        min={-10}
        onChange={(event) => { setValue(Number(event.target.value)); setChecked(false); }}
        step={1}
        type="range"
        value={value}
      />
      <div aria-hidden="true" className={styles.rangeTicks}>
        {[-10, -5, 0, 5, 10].map((tick) => <span key={tick}>{tick}</span>)}
      </div>
      <button className={styles.primaryButton} onClick={() => setChecked(true)} type="button">
        <Check aria-hidden="true" size={20} />{spanish ? 'Comprobar' : 'Check it'}
      </button>
      <div aria-live="polite" className={styles.practiceFeedback} data-correct={checked && correct ? 'true' : 'false'} hidden={!checked}>
        <Emoji>{correct ? '🎉' : '💡'}</Emoji>
        <div><strong>{correct ? (spanish ? '¡Eso es!' : "That's it!") : (spanish ? 'Casi — inténtalo otra vez' : 'Almost — try again')}</strong>
          <p>{correct
            ? (spanish ? '−6 está seis pasos a la izquierda del cero.' : '−6 is six steps to the left of zero.')
            : value === 0
              ? (spanish ? 'El cero es la frontera. Los números negativos están a su izquierda.' : 'Zero is the boundary. Negative numbers are to its left.')
              : value > 0
              ? (spanish ? 'Ese punto está a la derecha del cero. Los números negativos están a la izquierda.' : 'That point is right of zero. Negative numbers are on the left.')
              : (spanish ? 'Estás en el lado correcto. Cuenta los pasos desde cero, uno por uno.' : 'You are on the correct side. Count the steps from zero, one at a time.')}</p>
        </div>
      </div>
    </div>
    <div className={styles.practiceSupportGrid}>
      <article className={styles.card}><h2>{spanish ? 'Banco de palabras' : 'Word bank'}</h2><div className={styles.wordPills}>{WORDS_G4_L3.slice(2, 5).map((word) => <span key={word.en}>{spanish ? word.es : word.en}</span>)}</div></article>
      <article className={styles.card}><h2>{spanish ? 'Marco de oración' : 'Sentence frame'}</h2><p>−6 {spanish ? 'está a la ______ del cero.' : 'is to the ______ of zero.'}</p></article>
    </div>
  </section>;
}

function WordsScreen({
  designerToolsVisible,
  flippedWords,
  locale,
  onFlipWord,
}: {
  designerToolsVisible: boolean;
  flippedWords: ReadonlySet<string>;
  locale: G4L3Locale;
  onFlipWord: (key: string) => void;
}) {
  const spanish = locale === 'es';
  const currentLessonGroup = {
    emoji: '🌡️',
    label: 'Grade 4 · Lesson 3 — Negative Numbers',
    note: spanish ? 'Las ocho palabras de tu lección actual' : 'The eight words from your current lesson',
    words: WORDS_G4_L3,
  };
  const groups = designerToolsVisible
    ? [
        currentLessonGroup,
        {emoji: '📈', label: 'Grade 5 · Lesson 4 — Number Lines', note: spanish ? 'Conjunto de referencia · curso no disponible públicamente' : 'Reference set · course is not publicly runnable', words: WORDS_G5_L4},
        {emoji: '👆', label: spanish ? 'Tocadas dentro de la lección' : 'Tapped inside the lesson', note: spanish ? 'De esta lección' : 'From this lesson', words: WORDS_CONTEXT_SAMPLE},
        {emoji: '⚠️', label: spanish ? 'Sin español en la fuente' : 'No Spanish in the source', note: spanish ? 'No se inventa traducción' : 'No translation is invented', words: WORDS_WITH_SOURCE_GAPS},
      ]
    : [currentLessonGroup];

  return <section aria-labelledby="words-title" className={styles.screen} data-workspace-screen="words">
    <div className={styles.screenHeading}>
      <p className={styles.eyebrow}>{designerToolsVisible
        ? (spanish ? 'Mis palabras · datos de aprendizaje y fuente' : 'My words · learning and source data')
        : (spanish ? 'Mis palabras · Lección 3 de Grado 4' : 'My words · Grade 4 Lesson 3')}</p>
      <h1 id="words-title">{spanish ? 'Palabras que puedes ver y voltear' : 'Words you can see and flip'}</h1>
      <p>{designerToolsVisible
        ? (spanish ? 'El español solo aparece cuando la fuente lo contiene.' : 'Spanish appears only when the source contains it.')
        : (spanish ? 'Practica las ocho palabras de tu lección. Toca cada tarjeta para voltearla.' : 'Practice the eight words from your lesson. Tap each card to flip it.')}</p>
    </div>
    <div className={styles.wordGroups}>
      {groups.map((group) => <section className={styles.wordGroup} key={group.label}>
        <div className={styles.wordGroupHeading}><Emoji>{group.emoji}</Emoji><div><h2>{group.label}</h2><p>{group.note}</p></div></div>
        <div className={styles.wordGrid}>{group.words.map((word) => {
          const key = `${group.label}:${word.en}`;
          return <WordCard flipped={flippedWords.has(key)} key={key} onFlip={() => onFlipWord(key)} spanish={spanish} word={word} />;
        })}</div>
      </section>)}
    </div>
  </section>;
}

function LessonsScreen({
  g4L3Available,
  g5L4Available,
  locale,
}: {
  g4L3Available: boolean;
  g5L4Available: boolean;
  locale: G4L3Locale;
}) {
  const spanish = locale === 'es';
  const [filter, setFilter] = useState<HelpMath1GradeFilter>('all');
  const lessons = LESSON_CATALOG_SAMPLE.filter((lesson) => filter === 'all' || String(lesson.grade) === filter);
  const lessonEmoji = LEARNING_PLATFORM_SAMPLE_BOUNDARY.prototypeUi.lessonEmojiByTitle as Readonly<Record<string, string>>;
  const bothLessonsAvailable = g4L3Available && g5L4Available;
  const anyLessonAvailable = g4L3Available || g5L4Available;
  let availabilityMessage = spanish
    ? 'El currículo principal de HELP Math 1.0 abarca los grados 3–8. Las lecciones se abrirán aquí cuando sus versiones modernas estén disponibles.'
    : 'HELP Math 1.0’s main curriculum spans Grades 3–8. Lessons will open here as their modern versions become available.';
  if (bothLessonsAvailable) {
    availabilityMessage = spanish
      ? 'El currículo principal de HELP Math 1.0 abarca los grados 3–8. Las lecciones 3 de grado 4 y 4 de grado 5 están disponibles ahora; las demás se abrirán cuando sus versiones modernas estén listas.'
      : 'HELP Math 1.0’s main curriculum spans Grades 3–8. Grade 4 Lesson 3 and Grade 5 Lesson 4 are available now; the others will open as their modern versions are ready.';
  } else if (anyLessonAvailable) {
    availabilityMessage = spanish
      ? 'El currículo principal de HELP Math 1.0 abarca los grados 3–8. Abre una lección disponible; las demás aparecerán cuando sus versiones modernas estén listas.'
      : 'HELP Math 1.0’s main curriculum spans Grades 3–8. Open an available lesson; the others will appear as their modern versions are ready.';
  }

  return <section aria-labelledby="lessons-title" className={styles.screen} data-workspace-screen="lessons">
    <div className={styles.screenHeading}>
      <p className={styles.eyebrow}>{spanish ? 'Currículo de HELP Math' : 'HELP Math curriculum'}</p>
      <h1 id="lessons-title">
        {HELP_MATH_1_CURRICULUM_SCOPE.structuredMathLessonCount}{' '}
        {spanish ? 'lecciones de matemáticas · grados 3 a 8' : 'math lessons · grades 3 to 8'}
      </h1>
      <p>{availabilityMessage}</p>
    </div>
    <div aria-label={spanish ? 'Filtrar por grado' : 'Filter by grade'} className={styles.filterGroup} role="group">
      {(['all', ...HELP_MATH_1_GRADE_FILTERS] as const).map((value) => <button aria-pressed={filter === value} key={value} onClick={() => setFilter(value)} type="button">{value === 'all' ? (spanish ? 'Todos' : 'All') : `${spanish ? 'Grado' : 'Grade'} ${value}`}</button>)}
    </div>
    {lessons.length
      ? <div className={styles.lessonGrid}>
        {lessons.map((lesson) => {
        const key = `${lesson.grade}-${lesson.lesson}`;
        const g4Entry = key === LEARNING_PLATFORM_SAMPLE_BOUNDARY.lessonEvidenceBoundary.grade4Lesson3.lessonKey;
        const g5Entry = key === LEARNING_PLATFORM_SAMPLE_BOUNDARY.lessonEvidenceBoundary.grade5Lesson4.lessonKey;
        let lessonHref: '/courses/4/3?mode=focus' | '/courses/5/4?mode=focus' | null = null;
        if (g4Entry && g4L3Available) lessonHref = '/courses/4/3?mode=focus';
        if (g5Entry && g5L4Available) lessonHref = '/courses/5/4?mode=focus';
        const learnerRunnable = lessonHref !== null;
        const content = <>
          <span className={`${styles.lessonIcon} ${learnerRunnable ? styles.lessonIconOpen : ''}`}><Emoji>{lessonEmoji[lesson.title] ?? '🔢'}</Emoji></span>
          <span className={styles.lessonTileCopy} data-lesson-card-copy>
            <small>G{lesson.grade} · L{lesson.lesson}</small>
            <strong lang="en">{lesson.title}</strong>
            {spanish && ((g4Entry && !G4_L3_LESSON.titleSpanish) || g5Entry)
              ? <em className={styles.sourceGapLabel}>⚠️ inglés · sin título español en la fuente</em>
              : null}
            <span>{lesson.pages} {spanish ? 'páginas · 8 pasos' : 'pages · 8 steps'}</span>
          </span>
          <span className={`${styles.lessonStatus} ${learnerRunnable ? styles.lessonStatusOpen : ''}`} data-lesson-card-status>
            {learnerRunnable ? <><Check aria-hidden="true" size={15} />{spanish ? 'Abrir' : 'Open'}</> : <><LockKeyhole aria-hidden="true" size={15} />{spanish ? 'Muy pronto' : 'Coming soon'}</>}
          </span>
        </>;
        return lessonHref
          ? <Link className={styles.lessonTile} href={lessonHref} key={key}>{content}</Link>
          : <article aria-label={`${lesson.title}: ${spanish ? 'no disponible' : 'not available'}`} className={`${styles.lessonTile} ${styles.lessonTileLocked}`} key={key}>{content}</article>;
        })}
      </div>
      : <div className={styles.lessonEmptyState} role="status">
          <Emoji>🧭</Emoji>
          <div>
            <strong>{spanish ? `Grado ${filter} forma parte de HELP Math.` : `Grade ${filter} is part of HELP Math.`}</strong>
            <p>{spanish
              ? 'Sus lecciones aparecerán aquí a medida que se preparen las versiones de HELP Math 2.0.'
              : 'Its lessons will appear here as the HELP Math 2.0 versions are prepared.'}</p>
          </div>
        </div>}
  </section>;
}

function TeacherClassScreen({
  locale,
  onPlan,
}: {
  locale: G4L3Locale;
  onPlan: () => void;
}) {
  const spanish = locale === 'es';
  const [controlState, setControlState] = useState<Set<number>>(() => new Set(
    NOVA_CONTROL_SAMPLE.map((control, index) => control.enabled ? index : -1).filter((index) => index >= 0),
  ));
  const [notice, setNotice] = useState('');
  const skills = spanish
    ? ['Recta numérica', 'Números negativos', 'Cero', 'Patrones', 'Problemas verbales']
    : ['Number line', 'Negative numbers', 'Zero', 'Patterns', 'Word problems'];

  return <section aria-labelledby="class-title" className={`${styles.screen} ${styles.teacherScreen}`} data-workspace-screen="class">
    <div className={styles.teacherHeading}>
      <div><p className={styles.eyebrow}>{spanish ? 'Período 2 · Grado 4 · 24 estudiantes · 11 aprendices de inglés designados' : 'Period 2 · Grade 4 · 24 students · 11 designated EL'}</p><h1 id="class-title">{spanish ? 'Panel de clase' : 'Class board'}</h1></div>
      <div className={styles.teacherActions} data-teacher-actions>
        <button onClick={() => setNotice(spanish ? 'Vista previa solamente: no se creó ningún archivo IEP.' : 'Preview only: no IEP file was created.')} type="button">{spanish ? 'Vista previa de exportación IEP' : 'Preview IEP export'}</button>
        <button onClick={onPlan} type="button">{spanish ? 'Planificar mañana' : 'Plan tomorrow'}<ChevronRight aria-hidden="true" size={18} /></button>
      </div>
    </div>
    <p className={styles.teacherIntro}>{spanish ? 'La vista docente se mantiene tranquila a propósito: números exactos, tarjetas claras y sin emoji decorativo.' : 'The teacher view stays calm on purpose: exact numbers, clear cards, and no decorative emoji.'}</p>
    {notice ? <p aria-live="polite" className={styles.inlineNotice}>{notice}</p> : null}
    <div className={styles.teacherStats} data-teacher-stats>
      {[
        [spanish ? 'Trabajando ahora' : 'Working now', '19', spanish ? 'de 24' : 'of 24'],
        [spanish ? 'Te necesitan hoy' : 'Need you today', '4', spanish ? 'marcados por razón' : 'flagged by reason'],
        [spanish ? 'Dominio de la clase' : 'Class mastery', '0.61', spanish ? 'números negativos · BKT' : 'negative numbers · BKT'],
        [spanish ? 'Preguntas a Nova' : 'Nova questions', '37', spanish ? 'esta semana · 12 en español' : 'this week · 12 in Spanish'],
      ].map(([label, value, detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}
    </div>
    <div className={styles.teacherGrid}>
      <article className={styles.teacherPanel}>
        <div className={styles.teacherPanelHeader}><h2>{spanish ? 'Quién sabe qué' : 'Who knows what'}</h2><span>p(mastery)</span></div>
        <div
          aria-label={spanish ? 'Tabla de dominio' : 'Mastery table'}
          className={styles.tableScroll}
          role="region"
          tabIndex={0}
        >
          <table className={styles.masteryTable} data-teacher-mastery>
            <caption>{spanish ? 'Lista de clase y probabilidades de dominio.' : 'Class roster and mastery probabilities.'}</caption>
            <thead><tr><th>{spanish ? 'Estudiante' : 'Student'}</th>{skills.map((skill) => <th key={skill}>{skill}</th>)}</tr></thead>
            <tbody>{TEACHER_ROSTER_SAMPLE.map((student) => <tr key={student.name}>
              <th scope="row"><span className={styles.studentIdentity}><i>{student.name.split(' ').map((part) => part[0]).join('')}</i>{student.name}{student.englishLearner ? <small>EL</small> : null}</span></th>
              {student.values.map((value, index) => <td key={index}><span className={styles.masteryCell}><span aria-hidden="true" className={styles.masteryTrack}><i className={value >= 0.8 ? styles.masteryStrong : value >= 0.5 ? styles.masteryDeveloping : styles.masteryStarting} style={{width: `${Math.round(value * 100)}%`}} /></span><b>{value.toFixed(2)}</b></span></td>)}
            </tr>)}</tbody>
          </table>
        </div>
      </article>
      <div className={styles.teacherAside}>
        <article className={styles.teacherPanel}><h2>{spanish ? 'Te necesitan hoy' : 'Needs you today'}</h2><div className={styles.attentionList} data-teacher-attention>{TEACHER_ATTENTION_SAMPLE.map((item) => <div className={item.tone === 'peach' ? styles.attentionPeach : styles.attentionSun} key={item.name}><p><strong>{item.name}</strong> — {pick(item.why, spanish)}</p><small>→ {pick(item.action, spanish)}</small></div>)}</div></article>
        <article className={styles.teacherPanel}><h2>{spanish ? 'Controles de Nova' : 'Nova controls'}</h2><p className={styles.controlBoundary}>{spanish ? 'Controles de vista previa: no cambian una clase real.' : 'Preview controls: they do not change a real class.'}</p><div className={styles.toggleList}>{NOVA_CONTROL_SAMPLE.map((control, index) => <button aria-pressed={controlState.has(index)} key={control.title[0]} onClick={() => setControlState((current) => toggleSet(current, index))} type="button"><span><strong>{pick(control.title, spanish)}</strong><small>{pick(control.detail, spanish)}</small></span><i aria-hidden="true" /></button>)}</div></article>
      </div>
    </div>
  </section>;
}

function TeacherPrepScreen({locale}: {locale: G4L3Locale}) {
  const spanish = locale === 'es';
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['VB', 'IN', 'TI']));
  const [words, setWords] = useState<Set<string>>(() => new Set(['Number Line', 'Positive Numbers', 'Negative Numbers']));
  const [assigned, setAssigned] = useState(false);
  const pages = LEARNING_SECTIONS.filter((section) => selected.has(section.code)).reduce((sum, section) => sum + section.pages, 0);

  return <section aria-labelledby="prep-title" className={`${styles.screen} ${styles.teacherScreen}`} data-workspace-screen="prep">
    <div className={styles.teacherHeading}>
      <div>
        <p className={styles.eyebrow}>{spanish ? 'Preparación de la lección · Miércoles, 45 minutos' : 'Lesson prep · Wednesday, 45 minutes'}</p>
        <h1 id="prep-title" lang="en">Grade 4, Lesson 3 — Negative Numbers</h1>
        {spanish && !G4_L3_LESSON.titleSpanish
          ? <span className={styles.sourceGapLabel}>⚠️ inglés · la fuente no tiene título español</span>
          : null}
        <span className={styles.sampleLabel}>{spanish ? 'Selección temporal de vista previa' : 'Temporary preview selection'}</span>
      </div>
      <div className={styles.teacherActions}><button onClick={() => window.print()} type="button"><Printer aria-hidden="true" size={17} />{spanish ? 'Imprimir copia' : 'Print board copy'}</button><button aria-pressed={assigned} onClick={() => setAssigned((value) => !value)} type="button">{assigned ? (spanish ? 'Asignación lista' : 'Assignment ready') : (spanish ? 'Asignar al Período 2' : 'Assign to Period 2')}</button></div>
    </div>
    <div className={styles.prepGrid}>
      <div className={styles.teacherColumn}>
        <article className={styles.teacherPanel}><h2>{spanish ? 'Elige qué pasos ve la clase' : 'Choose which steps the class sees'}</h2><p>{spanish ? 'Los ocho pasos, en el orden de la fuente. Esta selección solo vive en la vista previa.' : 'All eight steps, in source order. This selection exists only in this preview.'}</p><div className={styles.prepToggles}>{LEARNING_SECTIONS.map((section) => <button aria-pressed={selected.has(section.code)} key={section.code} onClick={() => setSelected((current) => toggleSet(current, section.code))} type="button"><span className={`${styles.sectionIconSmall} ${tintClass(section.tint)}`}><Emoji>{section.emoji}</Emoji></span><span><strong>{spanish ? section.es : section.en}</strong><small>{section.pages} {spanish ? 'páginas' : 'pages'}{['TI', 'TS', 'FQ'].includes(section.code) ? ` · ${spanish ? 'Nova solo guía' : 'Nova scaffolds only'}` : ''}</small></span><i aria-hidden="true" /></button>)}</div><div className={styles.prepTotal}><span>{spanish ? 'Seleccionado' : 'Selected'}</span><strong>{pages} {spanish ? 'páginas · unos' : 'pages · about'} {Math.round(pages * 1.45)} min</strong></div></article>
        <article className={styles.teacherPanel}><h2>{spanish ? 'Plan de lección protegida' : 'Sheltered lesson plan'}</h2><div className={styles.objectiveGrid}><div><span>{spanish ? 'Objetivo de contenido' : 'Content objective'}</span><p>Students will locate positive and negative numbers on a number line and explain what zero separates.</p></div><div><span>{spanish ? 'Objetivo de lenguaje' : 'Language objective'}</span><p>Students will describe a temperature using <i>above zero</i> / <i>below zero</i> in a complete sentence.</p></div></div><div className={styles.sentenceFrames}><p>______ is <b>below</b> zero, so I write ______.<br /><small>______ está <b>bajo</b> cero, entonces escribo ______.</small></p><p>On the number line, ______ is to the <b>left of</b> zero.<br /><small>En la recta numérica, ______ está a la <b>izquierda</b> del cero.</small></p></div></article>
      </div>
      <div className={styles.teacherAside}>
        <article className={styles.teacherPanel}><h2>{spanish ? 'Enseña estas palabras antes' : 'Pre-teach these words'}</h2><p>{spanish ? 'Tomadas de Important Words. Puedes ajustar la selección para esta lección.' : 'Drawn from Important Words. Adjust the selection for this lesson.'}</p><div className={styles.toggleList}>{WORDS_G4_L3.filter((word) => !word.en.includes('Practice')).map((word) => <button aria-pressed={words.has(word.en)} key={word.en} onClick={() => setWords((current) => toggleSet(current, word.en))} type="button"><span><strong>{word.en}</strong><small>{word.es}</small></span><i aria-hidden="true" /></button>)}</div></article>
        <article className={styles.teacherPanel}><h2>{spanish ? 'Dónde le costará a esta clase' : 'Where this class will struggle'}</h2><div className={styles.attentionList}>
          <div className={styles.attentionMint}><p>{spanish ? <><strong>7 estudiantes</strong> ya tienen p ≥ 0.80 en <i>recta numérica</i>. Pueden comenzar en <b lang="en">Learn It</b>.</> : <><strong>7 students</strong> already hold p ≥ 0.80 on <i>number line</i>. Let them start at <b>Learn It</b>.</>}</p></div>
          <div className={styles.attentionSun}><p>{spanish ? <><strong>9 estudiantes</strong> confunden el signo menos con la resta. Las páginas de <i lang="en">Owing</i> lo abordan directamente.</> : <><strong>9 students</strong> confuse the minus sign with subtraction. The <i>Owing</i> pages address this directly.</>}</p></div>
          <div className={styles.attentionPeach}><p>{spanish ? <><strong>4 recién llegados</strong> todavía no conocen la palabra inglesa <i lang="en">below</i>. Enséñela antes con el termómetro.</> : <><strong>4 newcomers</strong> have no English word for <i>below</i> yet. Pre-teach with the thermometer.</>}</p></div>
        </div></article>
      </div>
    </div>
  </section>;
}

function DesignNotesScreen({
  locale,
  migrationStatusAvailable,
}: {
  locale: G4L3Locale;
  migrationStatusAvailable: boolean;
}) {
  const spanish = locale === 'es';
  return <section aria-labelledby="notes-title" className={`${styles.screen} ${styles.notesScreen}`} data-workspace-screen="notes">
    <div className={styles.screenHeading}><p className={styles.eyebrow}>Project · Design notes · current-JS evidence</p><h1 id="notes-title">Soft, friendly, and still honest</h1><p>{spanish ? 'Esta pantalla conserva las decisiones de diseño, los datos de muestra y los límites de evidencia que pidió el propietario.' : 'This screen preserves the design decisions, sample data, and evidence boundaries requested by the owner.'}</p></div>
    <div className={styles.evidenceActions}>
      <Link href="/courses/4/3?mode=focus&view=designer">
        {spanish ? 'Abrir evidencia de la lección' : 'Open lesson evidence'}
        <ExternalLink aria-hidden="true" size={17} />
      </Link>
      {migrationStatusAvailable
        ? <Link href="/migration-status?view=designer">{spanish ? 'Abrir estado de migración' : 'Open migration status'}<ExternalLink aria-hidden="true" size={17} /></Link>
        : <span aria-disabled="true">{spanish ? 'Estado de migración · no disponible en este entorno' : 'Migration status · unavailable in this environment'}<LockKeyhole aria-hidden="true" size={17} /></span>}
      <span>CURRENT-JS SHOWCASE · NOT A RELEASE VERDICT</span>
    </div>
    <article className={styles.notesPanel}><h2>Emoji as vocabulary, not as garnish</h2><p>Each of the eight sections keeps one picture, one word pair, and one pastel tint everywhere. A learner who cannot yet read <i>Important Words</i> can still find 💬 purple.</p><div aria-label="Section design reference table" className={styles.tableScroll} role="region" tabIndex={0}><table className={styles.notesTable}><thead><tr><th>Step</th><th>Picture</th><th>Code</th><th>English</th><th>Spanish</th><th>G4 L3 pages</th></tr></thead><tbody>{LEARNING_SECTIONS.map((section, index) => <tr key={section.code}><td>{index + 1}</td><td><Emoji>{section.emoji}</Emoji></td><td><code>{section.code}</code></td><td>{section.en}</td><td>{section.es}</td><td>{section.pages}</td></tr>)}</tbody></table></div><p className={styles.notesCallout}><strong>Accessibility rule:</strong> no control is labelled by emoji alone; picture, text, and state always travel together.</p></article>
    <article className={styles.notesPanel}><h2>The teacher view deliberately becomes calmer</h2><p>Student surfaces use picture-plus-word support. Teacher sample surfaces use exact numbers, quiet cards, explicit tables, and local preview controls. Switching the preview role is not authentication or authorization.</p></article>
    <article className={styles.notesPanel}><h2>Learner support controls stay visible as samples</h2><p>These prototype preferences are preserved from the design. They are not saved learner settings and do not claim verified audio or district consent.</p><div className={styles.boundaryGrid}>{LEARNING_HELPER_SAMPLE.map((helper) => <div key={helper.title[0]}><strong><Emoji>{helper.emoji}</Emoji> {pick(helper.title, spanish)} · {helper.enabled ? 'ON' : 'OFF'}</strong><p>{pick(helper.detail, spanish)}</p></div>)}</div></article>
    <article className={styles.notesPanel}><h2>Evidence and sample boundaries that remain visible</h2><div className={styles.boundaryGrid}>
      <div><strong>Sample learner state</strong><p>Maria, the four-day streak, five stickers, 21/39, powers, and Nova replies are invented UI data.</p></div>
      <div><strong>Sample teacher state</strong><p>The roster, EL markers, mastery values, attention notes, IEP export, lesson assignment, and controls are invented and produce no real record.</p></div>
      <div><strong>Current-JS learner access</strong><p>G4 L3 can open in local audit or its exact current-JS showcase mode. G5 L4 can open only through its exact local descriptor-bound gate; it is not publicly published. Current JavaScript access does not prove Flash fidelity, audio acceptance, original runtime, owner acceptance, strict completion, release, or wider publication.</p></div>
      <div><strong>Future and internal evidence</strong><p>All 29 source-catalog lessons remain visible. The G5 L4 learner tile opens only when its exact local catalog, registration, and descriptor gate passes; public publication remains closed.</p></div>
    </div></article>
    <article className={styles.notesPanel}><h2>Palette and type</h2><div className={styles.palette}>{LEARNING_SECTIONS.map((section) => <span className={tintClass(section.tint)} key={section.code}><i /><b>{section.en}</b></span>)}</div><p>Rounded display type, a readable system body stack, soft lavender ground, white cards, layered shadows, and separate high-contrast text tokens.</p></article>
    <p className={styles.finalBoundary}>Design prototype and local learning-platform implementation. Sample names, powers, stickers, teacher data, and Nova replies remain sample data. No fidelity, audio, original-runtime, owner, strict-completion, deployment, release, or publication acceptance is claimed or implied.</p>
  </section>;
}

export function LearningPlatformWorkspace({
  authStatus,
  designerToolsVisible,
  g4L3Available,
  g5L4Available,
  initialRole,
  initialScreen,
  locale,
  migrationStatusAvailable,
}: {
  authStatus: PublicAuthStatus;
  designerToolsVisible: boolean;
  g4L3Available: boolean;
  g5L4Available: boolean;
  initialRole: Role;
  initialScreen: Screen;
  locale: G4L3Locale;
  migrationStatusAvailable: boolean;
}) {
  const spanish = locale === 'es';
  const [role, setRole] = useState<Role>(initialRole);
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [theme, setTheme] = useState<Theme>('light');
  const [browserProgress, setBrowserProgress] = useState<G4L3WholeLessonProgress | null>(null);
  const [flippedWords, setFlippedWords] = useState<Set<string>>(() => new Set());
  const workspaceRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const documentTheme =
      document.documentElement.dataset.learningPlatformTheme;
    const saved = readThemePreference();
    const next = saved ?? (
      documentTheme === 'dark' || documentTheme === 'light'
        ? documentTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
    );
    document.documentElement.dataset.learningPlatformTheme = next;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setTheme(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const refresh = () => setBrowserProgress(readProgress(locale));
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [locale]);

  const progress = useMemo(
    () => browserProgress ? snapshotFor(browserProgress) : EMPTY_PROGRESS,
    [browserProgress],
  );
  const currentSection = G4_L3_LESSON.sections.find((section) => section.code === progress.currentSectionCode) ?? G4_L3_LESSON.sections[0]!;

  const focusWorkspace = () => {
    window.requestAnimationFrame(() => workspaceRef.current?.focus());
  };
  const changeRole = (next: Role) => {
    setRole(next);
    setScreen(next === 'student' ? 'today' : 'class');
    focusWorkspace();
  };
  const changeTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.learningPlatformTheme = next;
    setTheme(next);
    storeThemePreference(next);
  };
  const openScreen = (next: Screen) => {
    setScreen(next);
    focusWorkspace();
  };
  const flipWord = (key: string) => setFlippedWords((current) => toggleSet(current, key));
  const localeParameters = new URLSearchParams();
  if (role !== 'student' || screen !== 'today') {
    localeParameters.set('role', role);
    localeParameters.set('screen', screen);
  }
  if (designerToolsVisible) localeParameters.set('view', 'designer');
  const localeHref = localeParameters.size ? `/?${localeParameters}` : '/';

  const studentNav = [
    {screen: 'today' as const, emoji: '🏡', en: 'Today', es: 'Hoy', tail: spanish ? '2 pendientes' : '2 to do'},
    {screen: 'practice' as const, emoji: '✏️', en: 'Practice', es: 'Practicar'},
    {screen: 'words' as const, emoji: '🔤', en: 'My words', es: 'Mis palabras', tail: '8'},
    {
      screen: 'lessons' as const,
      emoji: '🗺️',
      en: 'All lessons',
      es: 'Todas las lecciones',
      tail: String(HELP_MATH_1_CURRICULUM_SCOPE.structuredMathLessonCount),
    },
  ];
  const teacherNav = [
    {screen: 'class' as const, emoji: '📊', en: 'Class board', es: 'Panel de clase'},
    {screen: 'prep' as const, emoji: '📝', en: 'Lesson prep', es: 'Preparación'},
  ];
  const crumbs: Record<Screen, string> = {
    class: spanish ? 'Docente · Panel de clase' : 'Teacher · Class board',
    lessons: spanish ? 'Todas las lecciones' : 'All lessons',
    notes: 'Project · Design notes',
    practice: spanish ? 'Práctica' : 'Practice',
    prep: spanish ? 'Docente · Preparación' : 'Teacher · Lesson prep',
    today: spanish ? 'Hoy' : 'Today',
    words: spanish ? 'Mis palabras' : 'My words',
  };

  return <div
    className={`${styles.platform} ${theme === 'dark' ? styles.themeDark : styles.themeLight}`}
    data-learning-platform-home
    data-designer-tools={designerToolsVisible ? 'visible' : 'hidden'}
    data-role-preview={role}
    data-theme={theme}
  >
    <div className={styles.appShell}>
      <nav aria-label={spanish ? 'Espacio de aprendizaje' : 'Learning workspace'} className={styles.rail}>
        <Link aria-label={spanish ? 'Inicio de HELP Math' : 'HELP Math home'} className={styles.workspaceBrand} href="/">
          <span className={styles.brandBadge}><Image alt="" aria-hidden="true" height={44} priority src="/brand/help-math-2-logo.png" width={44} /></span>
          <span className={styles.brandName}><span data-brand-word="help">HELP</span> <strong data-brand-word="math">Math</strong><small>2.0</small></span>
        </Link>
        <div className={styles.navScroller}>
          {role === 'student' ? <>
            <span className={styles.railGroup}>{spanish ? 'Aprender' : 'Learn'}</span>
            <button aria-current={screen === 'today' ? 'page' : undefined} className={styles.navItem} onClick={() => openScreen('today')} type="button"><span className={styles.navIcon}><Emoji>🏡</Emoji></span><span>{spanish ? 'Hoy' : 'Today'}</span><i>{spanish ? '2 pendientes' : '2 to do'}</i></button>
            {g4L3Available
              ? <Link className={styles.navItem} href="/courses/4/3?mode=focus"><span className={styles.navIcon}><Emoji>📺</Emoji></span><span>{spanish ? 'Mi lección' : 'My lesson'}</span></Link>
              : <span aria-disabled="true" className={`${styles.navItem} ${styles.navItemDisabled}`}><span className={styles.navIcon}><Emoji>📺</Emoji></span><span>{spanish ? 'Mi lección · no disponible' : 'My lesson · unavailable'}</span></span>}
            {studentNav.slice(1).map((item) => <button aria-current={screen === item.screen ? 'page' : undefined} className={styles.navItem} key={item.screen} onClick={() => openScreen(item.screen)} type="button"><span className={styles.navIcon}><Emoji>{item.emoji}</Emoji></span><span>{spanish ? item.es : item.en}</span>{item.tail ? <i>{item.tail}</i> : null}</button>)}
          </> : <>
            <span className={styles.railGroup}>{spanish ? 'Enseñar' : 'Teach'}</span>
            {teacherNav.map((item) => <button aria-current={screen === item.screen ? 'page' : undefined} className={styles.navItem} key={item.screen} onClick={() => openScreen(item.screen)} type="button"><span className={styles.navIcon}><Emoji>{item.emoji}</Emoji></span><span>{spanish ? item.es : item.en}</span></button>)}
          </>}
          {designerToolsVisible ? <>
            <span className={styles.railGroup}>Project</span>
            <button aria-current={screen === 'notes' ? 'page' : undefined} className={styles.navItem} onClick={() => openScreen('notes')} type="button"><span className={styles.navIcon}><Emoji>📐</Emoji></span><span>Design notes</span></button>
            {migrationStatusAvailable
              ? <Link className={styles.navItem} href="/migration-status?view=designer"><span className={styles.navIcon}><Emoji>🧭</Emoji></span><span>{spanish ? 'Estado de migración' : 'Migration status'}</span></Link>
              : <span aria-disabled="true" className={`${styles.navItem} ${styles.navItemDisabled}`}><span className={styles.navIcon}><Emoji>🧭</Emoji></span><span>{spanish ? 'Estado de migración · no disponible' : 'Migration status · unavailable'}</span></span>}
          </> : null}
        </div>
        <span aria-label={spanish ? 'Desliza para ver más navegación' : 'Swipe for more navigation'} className={styles.navScrollHint} role="img">↔</span>
        <div className={styles.railFooter}>
          <div className={styles.languageRow}>
            <span>{spanish ? 'Idioma del espacio' : 'Workspace language'}</span>
            <div aria-label={spanish ? 'Idioma del espacio de trabajo' : 'Workspace language'} className={styles.languageSwitch} role="group"><Link aria-current={!spanish ? 'true' : undefined} href={localeHref} locale="en">EN</Link><Link aria-current={spanish ? 'true' : undefined} href={localeHref} locale="es">ES</Link></div>
          </div>
        </div>
      </nav>

      <div className={styles.mainShell}>
        <header className={styles.topbar}>
          <span className={styles.crumb}>{crumbs[screen]}</span>
          <div aria-label={spanish ? 'Rol del espacio de aprendizaje' : 'Learning workspace role'} className={styles.roleSwitch} role="group">
            <button aria-pressed={role === 'student'} onClick={() => changeRole('student')} type="button">{spanish ? 'Estudiante' : 'Student'}</button>
            <button aria-pressed={role === 'teacher'} onClick={() => changeRole('teacher')} type="button">{spanish ? 'Docente' : 'Teacher'}</button>
          </div>
          {designerToolsVisible && screen === 'notes' ? <span className={styles.topbarStatus}>EVIDENCE</span> : null}
          {authStatus === 'signed-out' ? <nav
            aria-label={spanish ? 'Cuenta local' : 'Local account'}
            className={styles.authActions}
          >
            <Link href="/sign-in">{spanish ? 'Iniciar sesión' : 'Sign in'}</Link>
            <Link className={styles.authPrimary} href="/sign-up">
              {spanish ? 'Crear cuenta' : 'Create account'}
            </Link>
          </nav> : null}
          {authStatus === 'signed-in' ? <nav
            aria-label={spanish ? 'Cuenta local' : 'Local account'}
            className={styles.authActions}
          >
            <Link className={styles.authPrimary} href="/account">
              {spanish ? 'Mi cuenta' : 'My account'}
            </Link>
          </nav> : null}
          <button aria-label={theme === 'light' ? (spanish ? 'Cambiar a tema oscuro' : 'Switch to dark theme') : (spanish ? 'Cambiar a tema claro' : 'Switch to light theme')} className={styles.themeButton} onClick={changeTheme} type="button">{theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</button>
        </header>
        <main className={styles.workspace} id="main-content" ref={workspaceRef} tabIndex={-1}>
          {screen === 'today' ? <StudentToday browserProgress={browserProgress} flippedWords={flippedWords} g4L3Available={g4L3Available} locale={locale} onFlipWord={flipWord} onOpenWords={() => openScreen('words')} progress={progress} /> : null}
          {screen === 'practice' ? <PracticeScreen locale={locale} /> : null}
          {screen === 'words' ? <WordsScreen designerToolsVisible={designerToolsVisible} flippedWords={flippedWords} locale={locale} onFlipWord={flipWord} /> : null}
          {screen === 'lessons' ? <LessonsScreen g4L3Available={g4L3Available} g5L4Available={g5L4Available} locale={locale} /> : null}
          {screen === 'class' ? <TeacherClassScreen locale={locale} onPlan={() => openScreen('prep')} /> : null}
          {screen === 'prep' ? <TeacherPrepScreen locale={locale} /> : null}
          {designerToolsVisible && screen === 'notes' ? <DesignNotesScreen locale={locale} migrationStatusAvailable={migrationStatusAvailable} /> : null}
          <span className={styles.srOnly}>Browser progress: {progress.percent}% · current section {currentSection.code}</span>
        </main>
      </div>
    </div>
  </div>;
}
