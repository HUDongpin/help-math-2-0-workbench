"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_TI_006_CHOICES, COURSE_G04_L11_TI_006_GLOSSARY} from
  "../source-static/g4-l11/course-g04-l11-ti-006-static";
import {COURSE_G04_L11_TI_006_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_006_INTERACTION_SOURCE, createCourseG04L11Ti006State,
  getCourseG04L11Ti006SelectedGlossary, reduceCourseG04L11Ti006State,
  type CourseG04L11Ti006Event, type CourseG04L11Ti006GlossaryId,
  type CourseG04L11Ti006State} from
  "../timelines/course-g04-l11-ti-006-segment-length-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-259";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const ES_TERMS: Readonly<Record<CourseG04L11Ti006GlossaryId, string>> = Object.freeze({
  number: "número", unit: "unidad", length: "longitud",
  "line-segment": "segmento de línea", vertical: "vertical",
  subtract: "restar", "y-coordinate": "coordenada y",
  "coordinate-grid": "cuadrícula de coordenadas",
});
const ES_TERM_PROMPTS: Readonly<Record<CourseG04L11Ti006GlossaryId, string>> =
Object.freeze({
  number: "Un número indica cuántos o cuánto.",
  unit: "Una unidad es una cantidad fija que se usa para medir la longitud.",
  length: "La longitud indica la distancia de un extremo al otro.",
  "line-segment": "Un segmento de línea es la parte de una línea entre dos extremos.",
  vertical: "Un segmento vertical va recto hacia arriba y hacia abajo.",
  subtract: "Resta para hallar la diferencia entre dos valores.",
  "y-coordinate": "La coordenada y indica la posición vertical de un punto.",
  "coordinate-grid": "Una cuadrícula ubica puntos con coordenadas x e y.",
});

function PageCompanionPortal({children, targetId}: {
  children: React.ReactNode; targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  useEffect(() => {
    if (!targetId) { setTarget(null); setResolvedId(null); return; }
    setTarget(document.getElementById(targetId)); setResolvedId(targetId);
  }, [targetId]);
  if (!targetId) return children;
  if (resolvedId !== targetId) return null;
  return target ? createPortal(children, target) : children;
}

function SegmentLengthControls({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11Ti006State;
  dispatch: React.Dispatch<CourseG04L11Ti006Event>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const isSpanish = lang === "es";
  const selectedGlossary = getCourseG04L11Ti006SelectedGlossary(state);
  const modal = state.phase === "wrong-feedback" ||
    state.phase === "correct-feedback" || state.phase === "help" ||
    state.phase === "glossary";
  return <section className="course-g04-l11-ti006-practice"
    aria-label={isSpanish ? "Práctica de longitud vertical" :
      "Vertical line-segment length practice"}
    data-animation-internal-pedagogical-control-count="12"
    data-source-answer-control-count="3" data-source-help-control-count="1"
    data-source-glossary-control-count="8" data-source-quiz-stop-frame="76"
    data-source-audio-enabled="false" data-source-feedback-selection-established="false"
    data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span>
      <h2>{isSpanish ? "Longitud de un segmento vertical" :
        "Length of a Vertical Line Segment"}</h2>
      <p>{isSpanish ? "Haz clic en el número de unidades de longitud." :
        COURSE_G04_L11_TI_006_INTERACTION_SOURCE.prompt}</p>
    </header>
    <div className="course-g04-l11-ti006-facts">
      <div><span>{isSpanish ? "Extremos" : "Endpoints"}</span>
        <strong>(2,5) → (2,8)</strong>
        <p>{isSpanish ? "Los puntos comparten x = 2; compara sus valores de y." :
          "The points share x = 2, so compare their y-values."}</p></div>
      <div><span>{isSpanish ? "Tu tarea" : "Your task"}</span>
        <strong>{isSpanish ? "Elige la longitud" : "Choose the length"}</strong>
        <p>{isSpanish ? "Selecciona una de las tres respuestas." :
          "Select one of the three source answers."}</p></div>
    </div>
    <div className="course-g04-l11-ti006-choices" role="group"
      aria-label={isSpanish ? "Opciones de respuesta" : "Answer choices"}>
      {COURSE_G04_L11_TI_006_CHOICES.map((choice) => <button
        aria-pressed={state.selectedChoiceId === choice.id}
        data-source-answer-control={choice.sourceInstanceName}
        data-source-button-object-id={choice.sourceButtonObjectId}
        disabled={modal || state.completed} key={choice.id}
        onClick={() => dispatch({type: "choose-answer", choiceId: choice.id})}
        type="button">{isSpanish ? choice.label.replace("units", "unidades") :
          choice.label}</button>)}
    </div>
    <div className="course-g04-l11-ti006-support">
      <button data-source-help-control="NMHBtn" data-source-button-object-id="55"
        disabled={modal || state.completed} onClick={() => dispatch({type: "open-help"})}
        type="button">{isSpanish ? "Necesito más ayuda" : "Need More Help"}</button>
    </div>
    <div className="course-g04-l11-ti006-terms" role="group"
      aria-label={isSpanish ? "Términos matemáticos" : "Math terms"}>
      {COURSE_G04_L11_TI_006_GLOSSARY.map((term) => <button
        aria-pressed={state.selectedGlossaryId === term.id}
        data-source-glossary-button-object-id={term.sourceButtonObjectId}
        data-source-key-attribute={term.sourceKeyAttribute}
        disabled={modal || state.completed} key={term.id}
        onClick={() => dispatch({type: "open-glossary", glossaryId: term.id})}
        type="button">{isSpanish ? ES_TERMS[term.id] : term.label}</button>)}
    </div>
    {state.phase === "wrong-feedback" || state.phase === "correct-feedback"
      ? <div aria-live="assertive"
        className={`course-g04-l11-ti006-panel ${state.phase}`}
        data-feedback-variant={state.feedbackVariant} role="alert">
        <strong>{state.phase === "wrong-feedback"
          ? isSpanish ? "Inténtalo de nuevo" : "Try again"
          : isSpanish ? "¡Correcto!" : "Correct!"}</strong>
        <p>{state.phase === "wrong-feedback" && isSpanish
          ? "Lee la segunda parte de la regla. Inténtalo de nuevo."
          : state.feedbackMessage}</p>
        {state.phase === "wrong-feedback"
          ? <button onClick={() => dispatch({type: "close-wrong-feedback"})}
            type="button">{isSpanish ? "Cerrar y volver a intentar" :
              "Close and try again"}</button>
          : <button onClick={() => dispatch({type: "continue-after-correct"})}
            type="button">{isSpanish ? "Continuar" : "Continue"}</button>}
      </div> : null}
    {state.phase === "help" ? <div aria-live="polite"
      className="course-g04-l11-ti006-panel help" role="status">
      <strong>{isSpanish ? "Cómo hallar la longitud" : "How to find the length"}</strong>
      <p>{isSpanish ? "Resta las coordenadas y: 8 menos 5. La diferencia es la longitud." :
        COURSE_G04_L11_TI_006_INTERACTION_SOURCE.visibleCoaching}</p>
      <button onClick={() => dispatch({type: "close-help"})} type="button">
        {isSpanish ? "Cerrar ayuda" : "Close help"}</button>
    </div> : null}
    {selectedGlossary ? <div aria-live="polite"
      className="course-g04-l11-ti006-panel glossary" role="status">
      <div><strong>{isSpanish ? ES_TERMS[selectedGlossary.id] :
        selectedGlossary.label}</strong><p>{isSpanish ?
        ES_TERM_PROMPTS[selectedGlossary.id] : selectedGlossary.prompt}</p></div>
      <button onClick={() => dispatch({type: "close-glossary"})} type="button">
        {isSpanish ? "Cerrar" : "Close"}</button>
    </div> : null}
    {state.completed ? <div aria-live="polite"
      className="course-g04-l11-ti006-complete">
      <strong>8 − 5 = 3</strong>
      <p>{isSpanish ? "La longitud es 3 unidades." :
        "The length is 3 units."}</p>
    </div> : null}
    <div className="course-g04-l11-ti006-playback">
      <button onClick={replayLocally} type="button">
        {isSpanish ? "Repetir la práctica" : "Replay practice"}</button>
    </div>
  </section>;
}

export function createCourseG04L11Ti006SegmentLengthCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11Ti006State,
      {frame: props.frame, seed: props.seed}, ({frame, seed}) =>
        createCourseG04L11Ti006State(frame, seed));
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-ti006-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="95-source-canvas-frames-twelve-teaching-controls-and-modern-feedback"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <div className="course-g04-l11-ti006-source-stage">
        <SourceRenderer {...props}
          frame={interactionVisible ? state.sourceCanvasFrame : props.frame}
          state={undefined} />
        {interactionVisible ? <div aria-hidden="true"
          className="course-g04-l11-ti006-source-answer-mask"
          data-modern-replaced-source-answer-visual-count="3" /> : null}
      </div>
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}>
        <SegmentLengthControls state={state} dispatch={dispatch}
          lang={props.uiLanguage ?? props.lang} replayLocally={replayLocally} />
      </PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-ti006-candidate [data-source-replay-parity="unvalidated"]{display:none}
        .course-g04-l11-ti006-source-stage{position:relative}.course-g04-l11-ti006-source-answer-mask{background:#b8d8f7;height:42%;left:61%;pointer-events:none;position:absolute;top:27%;width:18%;z-index:2}
        .course-g04-l11-ti006-practice{background:linear-gradient(145deg,#f5fbff,#e4f6ff);border:2px solid #2168a7;border-radius:18px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px;width:100%}
        .course-g04-l11-ti006-practice header span,.course-g04-l11-ti006-facts span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-ti006-practice header h2{font-size:clamp(23px,4vw,32px);line-height:1.1;margin:3px 0 0}.course-g04-l11-ti006-practice p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0}
        .course-g04-l11-ti006-facts{display:grid;gap:12px;grid-template-columns:1fr 1fr}.course-g04-l11-ti006-facts>div{background:#fff;border:2px solid #75a6d5;border-radius:14px;padding:13px}.course-g04-l11-ti006-facts strong{color:#8b3100;display:block;font-size:clamp(21px,4vw,32px);margin-top:4px}
        .course-g04-l11-ti006-choices{display:grid;gap:10px;grid-template-columns:repeat(3,1fr)}.course-g04-l11-ti006-support{display:flex}.course-g04-l11-ti006-terms{display:grid;gap:8px;grid-template-columns:repeat(4,1fr)}
        .course-g04-l11-ti006-practice button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:48px;padding:9px 11px}.course-g04-l11-ti006-practice button[aria-pressed="true"]{background:#0a61bc;border-color:#063a73;color:#fff}.course-g04-l11-ti006-practice button:disabled{cursor:not-allowed;opacity:.62}.course-g04-l11-ti006-practice button:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
        .course-g04-l11-ti006-panel,.course-g04-l11-ti006-complete{background:#fff;border:3px solid #1c75bc;border-radius:14px;padding:14px}.course-g04-l11-ti006-panel.wrong-feedback{border-color:#c65100}.course-g04-l11-ti006-panel strong,.course-g04-l11-ti006-complete strong{display:block;font-size:24px}.course-g04-l11-ti006-panel.glossary{align-items:center;display:flex;gap:14px;justify-content:space-between}.course-g04-l11-ti006-playback{display:flex;justify-content:flex-end}
        @media(max-width:700px){.course-g04-l11-ti006-terms{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.course-g04-l11-ti006-facts,.course-g04-l11-ti006-choices{grid-template-columns:1fr}.course-g04-l11-ti006-panel.glossary{align-items:stretch;flex-direction:column}.course-g04-l11-ti006-playback button,.course-g04-l11-ti006-support button{width:100%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "95-source-canvas-frames-twelve-teaching-controls-and-modern-feedback-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 76, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_TI_006_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_TI_006_INTERACTION_AUTHORITY,
    answerChoiceOrderPreserved: true, wrongRetryPreserved: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
