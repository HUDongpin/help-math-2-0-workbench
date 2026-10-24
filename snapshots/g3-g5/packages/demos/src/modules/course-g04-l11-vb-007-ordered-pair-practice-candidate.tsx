"use client";

import React, {useEffect, useReducer} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_VB_007_CHOICES,
  COURSE_G04_L11_VB_007_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_007_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_007_TERMS,
  createCourseG04L11Vb007InteractionState,
  getCourseG04L11Vb007SelectedChoice,
  getCourseG04L11Vb007SelectedTerm,
  reduceCourseG04L11Vb007Interaction,
  type CourseG04L11Vb007InteractionEvent,
  type CourseG04L11Vb007InteractionState,
  type CourseG04L11Vb007TermId,
} from "../timelines/course-g04-l11-vb-007-ordered-pair-practice";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-254";
const SOURCE_PROMPT_FRAME = 69;
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const HELP: Readonly<Record<CourseG04L11Vb007TermId,
Readonly<{en: string; es: string}>>> = Object.freeze({
  point: Object.freeze({en: "A point marks one exact location on the grid.",
    es: "Un punto marca una ubicación exacta en la cuadrícula."}),
  "coordinate-grid": Object.freeze({
    en: "The x-axis and y-axis form the coordinate grid.",
    es: "El eje x y el eje y forman la cuadrícula de coordenadas.",
  }),
  "ordered-pair": Object.freeze({
    en: "An ordered pair writes the x-coordinate first and the y-coordinate second.",
    es: "Un par ordenado escribe primero la coordenada x y después la coordenada y.",
  }),
  number: Object.freeze({en: "Each number tells a distance from zero on one axis.",
    es: "Cada número indica una distancia desde cero en un eje."}),
  unit: Object.freeze({en: "A unit is one equal step along an axis.",
    es: "Una unidad es un paso igual a lo largo de un eje."}),
  "x-axis": Object.freeze({en: "Read the horizontal x-axis first.",
    es: "Lee primero el eje horizontal x."}),
  "y-axis": Object.freeze({en: "Read the vertical y-axis second.",
    es: "Lee después el eje vertical y."}),
});

function Feedback({
  dispatch,
  lang,
  state,
}: {
  dispatch: React.Dispatch<CourseG04L11Vb007InteractionEvent>;
  lang: "en" | "es";
  state: CourseG04L11Vb007InteractionState;
}) {
  const selected = getCourseG04L11Vb007SelectedChoice(state);
  if (state.phase === "prompt" || state.phase === "glossary") return null;
  if (state.phase === "feedback-correct") {
    return <div aria-live="polite" className="vb007-feedback vb007-correct"
      data-feedback-state="correct" role="status">
      <strong>{lang === "es" ? "¡Correcto!" : "Correct!"}</strong>
      <p>{lang === "es"
        ? "El punto B está a 2 unidades en x y 4 unidades en y, por eso es (2,4)."
        : "Point B is 2 units along x and 4 units along y, so its ordered pair is (2,4)."}</p>
      <button onClick={() => dispatch({type: "continue-correct"})} type="button">
        {lang === "es" ? "Continuar" : "Continue"}
      </button>
    </div>;
  }
  if (state.phase === "feedback-incorrect") {
    return <div aria-live="polite" className="vb007-feedback vb007-incorrect"
      data-feedback-state="incorrect-first" role="alert">
      <strong>{lang === "es" ? "Inténtalo otra vez" : "Try again"}</strong>
      <p>{lang === "es"
        ? `${selected?.label ?? ""} invierte x e y. Lee primero el eje x.`
        : `${selected?.label ?? ""} reverses x and y. Read the x-axis first.`}</p>
      <button onClick={() => dispatch({type: "try-again"})} type="button">
        {lang === "es" ? "Volver a intentar" : "Try Again"}
      </button>
    </div>;
  }
  if (state.phase === "remediation") {
    return <div aria-live="polite" className="vb007-feedback vb007-remediation"
      data-feedback-state="remediation" role="alert">
      <strong>{lang === "es" ? "Primero x, después y" : "x first, then y"}</strong>
      <p>{lang === "es"
        ? "Desde cero, avanza 2 unidades a la derecha y después 4 unidades hacia arriba. El punto B es (2,4)."
        : "From zero, move 2 units right, then 4 units up. Point B is (2,4)."}</p>
      <button onClick={() => dispatch({type: "review-coordinate-order"})}
        type="button">{lang === "es" ? "Revisar y responder" : "Review and answer"}</button>
    </div>;
  }
  return <div aria-live="polite" className="vb007-feedback vb007-complete"
    data-feedback-state="completed" role="status">
    <strong>{lang === "es" ? "Actividad completada" : "Activity complete"}</strong>
    <p>{lang === "es" ? "El punto B se nombra con (2,4)."
      : "Point B is named by the ordered pair (2,4)."}</p>
  </div>;
}

function Controls({
  dispatch,
  lang,
  replay,
  state,
}: {
  dispatch: React.Dispatch<CourseG04L11Vb007InteractionEvent>;
  lang: "en" | "es";
  replay: () => void;
  state: CourseG04L11Vb007InteractionState;
}) {
  const selectedTerm = getCourseG04L11Vb007SelectedTerm(state);
  return <section aria-label={lang === "es" ? "Práctica de pares ordenados"
    : "Ordered pair practice"} className="course-g04-l11-vb007-controls"
    data-answer-control-count="2" data-glossary-term-count="7"
    data-incorrect-attempt-count={state.incorrectAttemptCount}
    data-interaction-phase={state.phase}
    data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false">
    <header>
      <span>HELP Math 2.0</span>
      <strong>{lang === "es" ? "Práctica de pares ordenados"
        : "Ordered Pair Practice"}</strong>
      <p>{lang === "es"
        ? "¿Qué par ordenado nombra el punto B?"
        : "Which ordered pair names Point B?"}</p>
    </header>
    <div aria-label={lang === "es" ? "Respuestas" : "Answers"}
      className="vb007-answers" role="group">
      {COURSE_G04_L11_VB_007_CHOICES.map((choice) => <button
        aria-pressed={state.selectedChoiceId === choice.id}
        data-answer-outcome={choice.outcome}
        data-source-button-object-id={choice.sourceButtonObjectId}
        disabled={!state.quizEnabled}
        key={choice.id}
        onClick={() => dispatch({type: "choose-answer", choiceId: choice.id})}
        type="button">{choice.label}</button>)}
    </div>
    <Feedback dispatch={dispatch} lang={lang} state={state} />
    <div aria-label={lang === "es" ? "Palabras importantes"
      : "Important words"} className="vb007-terms" role="group">
      {COURSE_G04_L11_VB_007_TERMS.map((term) => <button
        aria-pressed={state.selectedTermId === term.id}
        data-source-button-object-id={term.sourceButtonObjectIds.join(",")}
        disabled={state.phase === "glossary"}
        key={term.id}
        onClick={() => dispatch({type: "open-term", termId: term.id})}
        type="button">{term.label}</button>)}
    </div>
    {selectedTerm ? <div aria-live="polite" className="vb007-glossary"
      data-modern-glossary-term={selectedTerm.id} role="status">
      <strong>{selectedTerm.label}</strong>
      <p>{HELP[selectedTerm.id][lang]}</p>
      <small>{lang === "es"
        ? "Ayuda moderna; no afirma paridad con el glosario Flash ni con su audio."
        : "Modern help; this does not claim parity with the Flash glossary or its audio."}</small>
      <button onClick={() => dispatch({type: "close-term"})} type="button">
        {lang === "es" ? "Cerrar" : "Close"}
      </button>
    </div> : null}
    <button className="vb007-replay" onClick={replay} type="button">
      {lang === "es" ? "Repetir" : "Replay"}
    </button>
  </section>;
}

export function createCourseG04L11Vb007OrderedPairPracticeCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN
      && props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(
      reduceCourseG04L11Vb007Interaction,
      undefined,
      createCourseG04L11Vb007InteractionState,
    );
    useEffect(() => {
      if ((props.replay ?? 0) > 0) dispatch({type: "replay"});
    }, [props.replay]);
    const replay = () => {
      dispatch({type: "replay"});
      props.onReplay?.();
    };
    const visualFrame = interactionVisible ? SOURCE_PROMPT_FRAME : props.frame;
    return <div className="course-g04-l11-vb007-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="source-canvas-plus-local-quiz-controls"
      data-registered-current-javascript="false"
      data-strict-acceptance-effect="none"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <SourceRenderer {...props} frame={visualFrame} state={undefined} />
      {interactionVisible ? <Controls dispatch={dispatch}
        lang={props.uiLanguage ?? props.lang} replay={replay} state={state} /> : null}
      <style>{`
        .course-g04-l11-vb007-candidate [data-source-replay-parity="unvalidated"] {display:none}
        .course-g04-l11-vb007-controls {background:linear-gradient(145deg,#f8fcff,#e4f2ff);border:2px solid #185b9d;border-radius:16px;color:#18385c;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px}
        .course-g04-l11-vb007-controls header span {color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em}
        .course-g04-l11-vb007-controls header strong {display:block;font-size:clamp(21px,4vw,30px);line-height:1.1;margin-top:3px}
        .course-g04-l11-vb007-controls p {font-family:system-ui,sans-serif;line-height:1.45;margin:6px 0 0}
        .course-g04-l11-vb007-controls button {border-radius:10px;cursor:pointer;font:800 15px ${UI_FONT};min-height:46px;padding:8px 12px}
        .course-g04-l11-vb007-controls button:focus-visible {outline:4px solid #0758ba;outline-offset:3px}
        .course-g04-l11-vb007-controls button:disabled {cursor:not-allowed;opacity:.55}
        .vb007-answers {display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
        .vb007-answers button {background:linear-gradient(#c6f5ff,#50c7ed);border:3px solid #0877a7;color:#092953;font-size:clamp(22px,5vw,36px)}
        .vb007-answers button[aria-pressed="true"] {background:#0a61bc;color:#fff}
        .vb007-feedback,.vb007-glossary {background:#fff;border:2px solid #5d8fc0;border-radius:12px;padding:14px}
        .vb007-feedback strong,.vb007-glossary strong {font-size:20px}
        .vb007-feedback button,.vb007-glossary button,.vb007-replay {background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;color:#102b70;margin-top:10px}
        .vb007-correct {border-color:#188b48}.vb007-incorrect,.vb007-remediation {border-color:#d46a00}
        .vb007-terms {display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}
        .vb007-terms button {background:#fff;border:2px solid #5d8fc0;color:#17395f}
        .vb007-terms button[aria-pressed="true"] {background:#0a61bc;color:#fff}
        .vb007-glossary small {display:block;font-family:system-ui,sans-serif;margin-top:7px}
        .vb007-replay {justify-self:start}
        @media(max-width:480px){.vb007-answers{grid-template-columns:1fr}.course-g04-l11-vb007-controls{padding:12px}}
      `}</style>
    </div>;
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-plus-local-ordered-pair-quiz-and-glossary-controls",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: SOURCE_DOMAIN,
      frame: SOURCE_PROMPT_FRAME,
      scenario: SOURCE_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    sourceInteraction: COURSE_G04_L11_VB_007_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_VB_007_INTERACTION_AUTHORITY,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    sourceBranchCausalityEstablished: false,
    sourceFeedbackVariantParityEstablished: false,
    sourceAudioEnabled: false,
    registeredCurrentJavascript: false,
    strictAcceptanceEffect: "none",
  });
  return Object.freeze({
    Renderer,
    sourceContract,
    module: Object.freeze({...candidate.module, Renderer}),
  });
}
