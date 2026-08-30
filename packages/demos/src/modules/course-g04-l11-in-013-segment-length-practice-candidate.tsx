"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_IN_013_CHOICES} from
  "../source-static/g4-l11/course-g04-l11-in-013-static";
import {COURSE_G04_L11_IN_013_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_013_INTERACTION_SOURCE, COURSE_G04_L11_IN_013_TERMS,
  createCourseG04L11In013PracticeState, getCourseG04L11In013SelectedTerm,
  reduceCourseG04L11In013Practice, type CourseG04L11In013PracticeEvent,
  type CourseG04L11In013PracticeState, type CourseG04L11In013TermId} from
  "../timelines/course-g04-l11-in-013-segment-length-practice-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-224";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const ES_TERMS: Readonly<Record<CourseG04L11In013TermId, string>> = Object.freeze({
  length: "longitud", "line-segment": "segmento de línea",
});
const ES_TERM_PROMPTS: Readonly<Record<CourseG04L11In013TermId, string>> = Object.freeze({
  length: "La longitud indica la distancia de un extremo al otro.",
  "line-segment": "Un segmento de línea es la parte de una línea entre dos extremos.",
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

function PracticeControls({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11In013PracticeState;
  dispatch: React.Dispatch<CourseG04L11In013PracticeEvent>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const isSpanish = lang === "es";
  const selectedTerm = getCourseG04L11In013SelectedTerm(state);
  return <section className="course-g04-l11-in013-practice"
    aria-label={isSpanish ? "Práctica de longitud de un segmento" :
      "Line-segment length practice"}
    data-animation-internal-pedagogical-control-count="5"
    data-source-answer-control-count="3"
    data-source-glossary-control-count="2"
    data-source-quiz-stop-frame="49"
    data-source-audio-enabled="false"
    data-source-feedback-selection-established="false"
    data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span>
      <strong>{isSpanish ? "Longitud de un segmento" :
        "Length of a Line Segment"}</strong>
      <p>{isSpanish ? "Haz clic en la longitud de este segmento de línea." :
        COURSE_G04_L11_IN_013_INTERACTION_SOURCE.prompt}</p>
    </header>
    <div className="course-g04-l11-in013-facts">
      <div><span>{isSpanish ? "Extremos" : "Endpoints"}</span>
        <strong>(3,5) → (7,5)</strong>
        <p>{isSpanish ? "Los dos puntos comparten y = 5." :
          "Both endpoints share y = 5, so compare their x-values."}</p></div>
      <div><span>{isSpanish ? "Tu tarea" : "Your task"}</span>
        <strong>{isSpanish ? "Elige la longitud" : "Choose the length"}</strong>
        <p>{isSpanish ? "Selecciona una respuesta." :
          "Select one of the three source answers."}</p></div>
    </div>
    <div className="course-g04-l11-in013-choices" role="group"
      aria-label={isSpanish ? "Opciones de respuesta" : "Answer choices"}>
      {COURSE_G04_L11_IN_013_CHOICES.map((choice) => <button
        aria-pressed={state.selectedChoiceId === choice.id}
        data-source-answer-control={choice.sourceInstanceName}
        data-source-button-object-id={choice.sourceButtonObjectId}
        disabled={state.popupOpen || state.completed}
        key={choice.id} onClick={() => dispatch({type: "choose-answer",
          choiceId: choice.id})} type="button">{choice.label}</button>)}
    </div>
    <div className="course-g04-l11-in013-terms" role="group"
      aria-label={isSpanish ? "Términos matemáticos" : "Math terms"}>
      {COURSE_G04_L11_IN_013_TERMS.map((term) => <button
        aria-pressed={state.selectedTermId === term.id}
        data-source-glossary-button-object-id={term.sourceButtonObjectId}
        data-source-key-attribute={term.sourceKeyAttribute}
        disabled={state.popupOpen}
        key={term.id} onClick={() => dispatch({type: "select-term", termId: term.id})}
        type="button">{isSpanish ? ES_TERMS[term.id] : term.label}</button>)}
    </div>
    {state.popupOpen ? <div aria-live="assertive"
      className={`course-g04-l11-in013-feedback ${state.phase}`}
      data-feedback-variant={state.feedbackVariant} role="alert">
      <strong>{state.phase === "wrong-feedback"
        ? isSpanish ? "Inténtalo de nuevo" : "Try again"
        : isSpanish ? "¡Correcto!" : "Correct!"}</strong>
      <p>{state.phase === "wrong-feedback" && isSpanish
        ? "Resta las coordenadas x: 7 menos 3. Inténtalo de nuevo."
        : state.feedbackMessage}</p>
      {state.phase === "wrong-feedback"
        ? <button onClick={() => dispatch({type: "close-wrong-feedback"})} type="button">
          {isSpanish ? "Cerrar y volver a intentar" : "Close and try again"}</button>
        : <button onClick={() => dispatch({type: "continue-after-correct"})} type="button">
          {isSpanish ? "Continuar" : "Continue"}</button>}
    </div> : null}
    {state.completed ? <div aria-live="polite" className="course-g04-l11-in013-complete">
      <strong>7 − 3 = 4</strong>
      <p>{isSpanish ? "La longitud es 4 unidades." : "The length is 4 units."}</p>
    </div> : null}
    {selectedTerm ? <div aria-live="polite" className="course-g04-l11-in013-term-panel"
      role="status"><div><strong>{isSpanish ? ES_TERMS[selectedTerm.id] :
        selectedTerm.label}</strong><p>{isSpanish ? ES_TERM_PROMPTS[selectedTerm.id] :
        selectedTerm.prompt}</p></div><button onClick={() => dispatch({type: "close-term"})}
          type="button">{isSpanish ? "Cerrar" : "Close"}</button></div> : null}
    <div className="course-g04-l11-in013-playback">
      <button onClick={replayLocally} type="button">
        {isSpanish ? "Repetir la práctica" : "Replay practice"}</button>
    </div>
  </section>;
}

export function createCourseG04L11In013SegmentLengthPracticeCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11In013Practice,
      {frame: props.frame, seed: props.seed}, ({frame, seed}) =>
        createCourseG04L11In013PracticeState(frame, seed));
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-in013-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="67-source-canvas-frames-five-teaching-controls-and-modern-feedback"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <div className="course-g04-l11-in013-source-stage">
        <SourceRenderer {...props}
          frame={interactionVisible ? state.sourceCanvasFrame : props.frame}
          state={undefined} />
        {interactionVisible ? <div aria-hidden="true"
          className="course-g04-l11-in013-source-answer-mask"
          data-modern-replaced-source-answer-visual-count="3" /> : null}
      </div>
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}>
        <PracticeControls state={state} dispatch={dispatch}
          lang={props.uiLanguage ?? props.lang} replayLocally={replayLocally} />
      </PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-in013-candidate [data-source-replay-parity="unvalidated"]{display:none}
        .course-g04-l11-in013-source-stage{position:relative}.course-g04-l11-in013-source-answer-mask{background:#b8d8f7;height:9%;left:19%;pointer-events:none;position:absolute;top:68%;width:62%;z-index:2}
        .course-g04-l11-in013-practice{background:linear-gradient(145deg,#f5fbff,#e2f4ff);border:2px solid #2168a7;border-radius:18px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px;width:100%}
        .course-g04-l11-in013-practice header span,.course-g04-l11-in013-facts span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        .course-g04-l11-in013-practice header strong{display:block;font-size:clamp(23px,4vw,32px);line-height:1.1;margin-top:3px}.course-g04-l11-in013-practice p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0}
        .course-g04-l11-in013-facts{display:grid;gap:12px;grid-template-columns:1fr 1fr}.course-g04-l11-in013-facts>div{background:white;border:2px solid #75a6d5;border-radius:14px;padding:13px}.course-g04-l11-in013-facts strong{color:#8b3100;display:block;font-size:clamp(21px,4vw,32px);margin-top:4px}
        .course-g04-l11-in013-choices{display:grid;gap:10px;grid-template-columns:repeat(3,1fr)}.course-g04-l11-in013-terms{display:grid;gap:10px;grid-template-columns:repeat(2,1fr)}
        .course-g04-l11-in013-practice button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 16px ${UI_FONT};min-height:50px;padding:9px 11px}.course-g04-l11-in013-practice button[aria-pressed="true"]{background:#0a61bc;border-color:#063a73;color:white}.course-g04-l11-in013-practice button:disabled{cursor:not-allowed;opacity:.62}.course-g04-l11-in013-practice button:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
        .course-g04-l11-in013-feedback,.course-g04-l11-in013-complete,.course-g04-l11-in013-term-panel{background:white;border:3px solid #1c75bc;border-radius:14px;padding:14px}.course-g04-l11-in013-feedback.wrong-feedback{border-color:#c65100}.course-g04-l11-in013-feedback strong,.course-g04-l11-in013-complete strong{display:block;font-size:24px}.course-g04-l11-in013-term-panel{align-items:center;display:flex;gap:14px;justify-content:space-between}.course-g04-l11-in013-playback{display:flex;justify-content:flex-end}
        @media(max-width:600px){.course-g04-l11-in013-facts{grid-template-columns:1fr}.course-g04-l11-in013-choices{grid-template-columns:1fr}.course-g04-l11-in013-term-panel{align-items:stretch;flex-direction:column}.course-g04-l11-in013-playback button{width:100%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "67-source-canvas-frames-five-teaching-controls-and-modern-feedback-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 49, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_IN_013_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_IN_013_INTERACTION_AUTHORITY,
    answerChoiceOrderPreserved: true, wrongRetryPreserved: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
