'use client';

import {
  PageInteractionStage,
  pageInteractionFor,
  parseCaptureFrame,
  stageTargetId
} from '@helpmath/demos/page-interaction';
import {useState} from 'react';

import {LessonCalculator} from '@/components/lesson-calculator';
import {
  LESSON_PLAYER_ID,
  pageHasRegisteredInteraction,
  pageRequiresInteraction,
  type LessonDescriptor,
  type LessonDescriptorPage
} from '@/lib/lesson-descriptor';

function copy(locale: 'en' | 'es') {
  return locale === 'es'
    ? {
        previous: 'Anterior',
        next: 'Siguiente',
        pause: 'Pausar',
        resume: 'Reanudar',
        replay: 'Repetir',
        map: 'Mapa',
        help: 'Ayuda',
        calculator: 'Calculadora',
        closeMap: 'Cerrar mapa',
        closeHelp: 'Cerrar ayuda',
        closeCalculator: 'Cerrar calculadora',
        paused: 'Pausado.',
        pageOnly:
          'Esta página es visual de solo lectura en este workbench. El candidato current-JS de producción no está empaquetado aquí.',
        missingInteraction:
          'Esta pantalla de Try It / Play It todavía muestra instrucciones de arrastre o juego, pero este workbench aún no registró un overlay interactivo.',
        helpBody:
          'Usa Anterior y Siguiente para recorrer la lección. Try It y Play It incluyen controles reales cuando hay un overlay registrado. La calculadora es una herramienta de apoyo y no ejecuta ActionScript heredado.',
        reconstruction:
          'Overlay interactivo reconstruido. No hay clave calificada: el archivo SWF original no está en este snapshot y no existe un workspace de migración.'
      }
    : {
        previous: 'Previous',
        next: 'Next',
        pause: 'Pause',
        resume: 'Resume',
        replay: 'Replay',
        map: 'Map',
        help: 'Help',
        calculator: 'Calculator',
        closeMap: 'Close course map',
        closeHelp: 'Close help',
        closeCalculator: 'Close calculator',
        paused: 'Paused.',
        pageOnly:
          'This page is visual-only in this workbench. Production current-JS artwork is not bundled in this snapshot.',
        missingInteraction:
          'This Try It / Play It screen still shows drag or game instructions, but this workbench has not registered an interaction overlay yet.',
        helpBody:
          'Use Previous and Next to move through this lesson. Try It and Play It expose real controls when an overlay is registered. The calculator is a support tool and does not execute legacy ActionScript.',
        reconstruction:
          'Reconstructed interaction overlay. Not a graded Flash answer key: the original SWF archive is missing here and no migration workspace exists yet.'
      };
}

function sectionLabel(descriptor: LessonDescriptor, code: string, locale: 'en' | 'es'): string {
  const section = descriptor.sections.find((item) => item.code === code);
  return locale === 'es' ? (section?.label.es ?? code) : (section?.label.en ?? code);
}

function localizedTitle(title: {en: string; es: string}, locale: 'en' | 'es'): string {
  return locale === 'es' ? title.es : title.en;
}

function pageFlashFrame(
  page: LessonDescriptorPage,
  captureFrame: number | undefined,
  completed: boolean
): number {
  if (captureFrame != null) return captureFrame;
  return completed ? Math.max(1, page.frameCount) : 1;
}

function completeIfViewed(
  current: ReadonlySet<string>,
  page: LessonDescriptorPage | undefined
): ReadonlySet<string> {
  // Completion contract: page-only screens count when viewed. Registered
  // Try It / Play It screens count when the learner finishes the ungraded
  // practice (every token placed, or a Play It choice selected).
  if (!page || pageHasRegisteredInteraction(page) || current.has(page.animationId)) {
    return current;
  }
  const nextSet = new Set(current);
  nextSet.add(page.animationId);
  return nextSet;
}

export function LessonInteractionPlayer({
  descriptor,
  frameQuery,
  locale
}: {
  descriptor: LessonDescriptor;
  frameQuery?: string;
  locale: 'en' | 'es';
}) {
  const labels = copy(locale);
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState<ReadonlySet<string>>(() =>
    completeIfViewed(new Set(), descriptor.pages[0])
  );
  const [replayNonce, setReplayNonce] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const page = descriptor.pages[Math.min(index, Math.max(0, descriptor.pages.length - 1))];

  if (!page) {
    return (
      <main className="lesson-player" id="main-content">
        <p>Missing lesson pages.</p>
      </main>
    );
  }

  const spec = pageInteractionFor(page.animationId);
  const targetId = spec ? stageTargetId(descriptor.course.domIdPrefix, spec) : undefined;
  const previous = descriptor.pages[index - 1];
  const next = descriptor.pages[index + 1];
  const percent = Math.round((completed.size / descriptor.pages.length) * 100);
  const missingRequired = pageRequiresInteraction(page) && !pageHasRegisteredInteraction(page);
  const captureFrame = parseCaptureFrame(frameQuery, page.frameCount);
  const flashFrame = pageFlashFrame(page, captureFrame, completed.has(page.animationId));
  const interactive = !paused && captureFrame == null;
  const pageTitle = localizedTitle(page.title, locale);

  const goTo = (animationId: string) => {
    const nextIndex = descriptor.pages.findIndex((item) => item.animationId === animationId);
    if (nextIndex >= 0) {
      setIndex(nextIndex);
      setReplayNonce((value) => value + 1);
      setMapOpen(false);
      setCompleted((current) => completeIfViewed(current, descriptor.pages[nextIndex]));
    }
  };

  const markSolved = () => {
    setCompleted((current) => {
      if (current.has(page.animationId)) return current;
      const nextSet = new Set(current);
      nextSet.add(page.animationId);
      return nextSet;
    });
  };

  return (
    <div
      data-current-animation-id={page.animationId}
      data-hydrated="true"
      data-lesson-player={LESSON_PLAYER_ID}
      data-original-flash-pointer-lifecycle-established={
        spec?.pointerLifecycle.originalFlashPointerLifecycleEstablished ? 'true' : 'false'
      }
      data-section-code={page.sectionCode}
    >
      <main
        className="lesson-player"
        data-current-animation-id={page.animationId}
        data-section-code={page.sectionCode}
        id="main-content"
        lang={locale}
      >
        <section aria-label={locale === 'es' ? 'Sesión de aprendizaje' : 'Learning session'} className="lesson-player__session">
          <div>
            <strong>{percent}%</strong>
            <span>
              {completed.size} {locale === 'es' ? 'de' : 'of'} {descriptor.pages.length}{' '}
              {locale === 'es' ? 'páginas completas' : 'pages complete'}
            </span>
          </div>
          <progress aria-label={locale === 'es' ? 'Progreso de la lección' : 'Lesson completion'} max={100} value={percent} />
          <span>
            {locale === 'es' ? 'Página' : 'Page'} {page.globalPageOrdinal} {locale === 'es' ? 'de' : 'of'}{' '}
            {descriptor.pages.length}
          </span>
        </section>

        <div className="lesson-player__layout">
          <aside className="lesson-player__spine" aria-label={locale === 'es' ? 'Directorio de la lección' : 'Lesson directory'}>
            <p className="lesson-player__spine-mark">
              L{descriptor.course.lesson} · {localizedTitle(descriptor.course.title, locale)}
            </p>
            <nav aria-label={locale === 'es' ? 'Navegación de la lección' : 'Lesson navigation'}>
              <ol>
                {descriptor.sections.map((section) => (
                  <li key={section.code}>
                    <button
                      aria-current={section.code === page.sectionCode ? 'step' : undefined}
                      data-section-code={section.code}
                      onClick={() => goTo(section.firstAnimationId)}
                      type="button"
                    >
                      {locale === 'es' ? section.label.es : section.label.en}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            <button
              aria-expanded={calculatorOpen}
              aria-pressed={calculatorOpen}
              onClick={() => setCalculatorOpen((value) => !value)}
              type="button"
            >
              {labels.calculator}
            </button>
            <LessonCalculator locale={locale} open={calculatorOpen} />
            {calculatorOpen ? (
              <button onClick={() => setCalculatorOpen(false)} type="button">
                {labels.closeCalculator}
              </button>
            ) : null}
          </aside>

          <article className="lesson-player__column">
            <header className="lesson-player__heading">
              <p>{sectionLabel(descriptor, page.sectionCode, locale)}</p>
              <h1>{pageTitle}</h1>
            </header>
            <div
              aria-label={`Grade ${descriptor.course.grade} · Lesson ${descriptor.course.lesson} · 800 by 600 stage`}
              className="lesson-player__stage-frame"
            >
              <div
                className="lesson-shell2__stage lesson-player__stage"
                data-authored-stage="800x600"
                data-capture={captureFrame != null ? 'true' : 'false'}
                data-flash-frame={String(flashFrame)}
                data-paused={paused ? 'true' : 'false'}
              >
                {paused ? (
                  <p className="lesson-player__paused" role="status">
                    {labels.paused}
                  </p>
                ) : null}
                {spec && targetId ? (
                  <PageInteractionStage
                    captureFrame={captureFrame}
                    interactive={interactive}
                    key={`${page.animationId}:${replayNonce}`}
                    lang={locale}
                    onSolved={markSolved}
                    replayNonce={replayNonce}
                    spec={spec}
                    stageTargetId={targetId}
                  />
                ) : (
                  <div
                    className="lesson-player__page-only"
                    data-flash-frame={String(flashFrame)}
                    data-page-interaction-missing={missingRequired ? 'true' : 'false'}
                  >
                    <p className="lesson-player__page-kicker">
                      {sectionLabel(descriptor, page.sectionCode, locale)} · {pageTitle}
                    </p>
                    <p>{missingRequired ? labels.missingInteraction : labels.pageOnly}</p>
                    <p>
                      <code>{page.animationId}</code>
                    </p>
                  </div>
                )}
                {spec ? <p className="lesson-player__reconstruction">{labels.reconstruction}</p> : null}
              </div>
            </div>
            <div
              aria-label={locale === 'es' ? 'Controles de la lección' : 'Modern lesson controls'}
              className="lesson-player__toolbar"
              role="group"
            >
              <button disabled={!previous} onClick={() => previous && goTo(previous.animationId)} type="button">
                ← {labels.previous}
              </button>
              <button aria-pressed={paused} onClick={() => setPaused((value) => !value)} type="button">
                {paused ? labels.resume : labels.pause}
              </button>
              <button disabled={!next} onClick={() => next && goTo(next.animationId)} type="button">
                {labels.next} →
              </button>
              <button
                onClick={() => {
                  setReplayNonce((value) => value + 1);
                  setPaused(false);
                }}
                type="button"
              >
                {labels.replay}
              </button>
              <button aria-expanded={mapOpen} onClick={() => setMapOpen((value) => !value)} type="button">
                {labels.map}
              </button>
              <button aria-expanded={helpOpen} onClick={() => setHelpOpen((value) => !value)} type="button">
                {labels.help}
              </button>
            </div>
          </article>
        </div>

        {mapOpen ? (
          <div aria-label={locale === 'es' ? 'Mapa del curso' : 'Course map'} className="lesson-player__overlay" role="dialog">
            <header>
              <h2>{locale === 'es' ? 'Mapa del curso' : 'Course map'}</h2>
              <button onClick={() => setMapOpen(false)} type="button">
                {labels.closeMap}
              </button>
            </header>
            {descriptor.sections.map((section) => (
              <section key={section.code}>
                <h3>
                  <button data-section-code={section.code} onClick={() => goTo(section.firstAnimationId)} type="button">
                    {locale === 'es' ? section.label.es : section.label.en}
                  </button>
                </h3>
                <ol>
                  {descriptor.pages
                    .filter((item) => item.sectionCode === section.code)
                    .map((item) => (
                      <li key={item.animationId}>
                        <button
                          aria-current={item.animationId === page.animationId ? 'step' : undefined}
                          data-animation-id={item.animationId}
                          onClick={() => goTo(item.animationId)}
                          type="button"
                        >
                          {item.globalPageOrdinal}. {localizedTitle(item.title, locale)}
                        </button>
                      </li>
                    ))}
                </ol>
              </section>
            ))}
          </div>
        ) : null}

        {helpOpen ? (
          <div aria-label={labels.help} className="lesson-player__overlay" role="dialog">
            <header>
              <h2>{labels.help}</h2>
              <button onClick={() => setHelpOpen(false)} type="button">
                {labels.closeHelp}
              </button>
            </header>
            <p>{labels.helpBody}</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
