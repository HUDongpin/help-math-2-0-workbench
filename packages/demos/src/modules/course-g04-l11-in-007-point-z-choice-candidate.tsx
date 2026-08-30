"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_IN_007_CHOICES, COURSE_G04_L11_IN_007_POINT,
  COURSE_G04_L11_IN_007_STATIC_SOURCE_FACTS} from
  "../source-static/g4-l11/course-g04-l11-in-007-static";
import {COURSE_G04_L11_IN_007_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_007_TERMS, createCourseG04L11In007ChoiceState,
  reduceCourseG04L11In007Choice, type CourseG04L11In007ChoiceEvent,
  type CourseG04L11In007ChoiceState, type CourseG04L11In007TermId} from
  "../timelines/course-g04-l11-in-007-point-z-choice-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_DOMAIN = "sprite-232";
const SOURCE_SCENARIO = "source-static-frame";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const SPANISH_TERMS: Readonly<Record<CourseG04L11In007TermId, string>> =
  Object.freeze({"ordered-pair": "Par ordenado", point: "Punto",
    "coordinate-grid": "Cuadrícula de coordenadas", number: "Número",
    unit: "Unidad", zero: "Cero", "x-axis": "Eje x"});
const SPANISH_PROMPTS: Readonly<Record<CourseG04L11In007TermId, string>> =
  Object.freeze({"ordered-pair": "Un par ordenado nombra un punto como (x, y).",
    point: "Un punto marca una ubicación exacta en la cuadrícula.",
    "coordinate-grid": "La cuadrícula usa los ejes x e y para localizar puntos.",
    number: "Un número indica cuánto avanzar sobre un eje.",
    unit: "Una unidad es un paso igual sobre un eje.",
    zero: "Cero es el valor de origen donde empieza cada eje.",
    "x-axis": "El eje x mide la distancia horizontal desde cero."});

function CompanionPortal({children, targetId}: {children: React.ReactNode;
  targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(targetId ? document.getElementById(targetId) : null); },
    [targetId]);
  if (!targetId) return children;
  return target ? createPortal(children, target) : children;
}
function position(value: number) { return 58 + value * 39; }

function TermPanel({dispatch, lang, state}: {dispatch:
  React.Dispatch<CourseG04L11In007ChoiceEvent>; lang: "en" | "es";
  state: CourseG04L11In007ChoiceState}) {
  const selected = state.selectedTermId ? COURSE_G04_L11_IN_007_TERMS.find(
    (term) => term.id === state.selectedTermId) : null;
  if (!selected) return null;
  return <div aria-live="polite" className="course-g04-l11-in007-term" role="status">
    <div><strong>{lang === "es" ? SPANISH_TERMS[selected.id] : selected.label}</strong>
      <p>{lang === "es" ? SPANISH_PROMPTS[selected.id] : selected.prompt}</p></div>
    <button onClick={() => dispatch({type: "close-term"})} type="button">
      {lang === "es" ? "Cerrar" : "Close"}</button>
  </div>;
}

function Feedback({dispatch, lang, state}: {dispatch:
  React.Dispatch<CourseG04L11In007ChoiceEvent>; lang: "en" | "es";
  state: CourseG04L11In007ChoiceState}) {
  if (state.feedback === "none") return null;
  if (state.feedback === "correct") return <div aria-live="assertive"
    className="course-g04-l11-in007-feedback correct" data-feedback-state="correct"
    role="alert"><strong>{lang === "es" ? "¡Correcto! Z está en (7,5)." :
      "Correct! Point Z is at (7,5)."}</strong>
    <button onClick={() => dispatch({type: "dismiss-feedback"})} type="button">
      {lang === "es" ? "Continuar" : "Continue"}</button></div>;
  const feedbackTerms = COURSE_G04_L11_IN_007_TERMS.filter((term) =>
    ["ordered-pair", "number", "unit", "zero", "x-axis"].includes(term.id));
  return <div aria-live="assertive" className="course-g04-l11-in007-feedback wrong"
    data-feedback-state="wrong" role="alert">
    <strong>{lang === "es" ? "Inténtalo otra vez" : "Try Again!"}</strong>
    <p>{lang === "es" ?
      "En un par ordenado, el primer número indica cuántas unidades avanzar desde cero sobre el eje x; el segundo indica cuántas unidades subir." :
      COURSE_G04_L11_IN_007_STATIC_SOURCE_FACTS.wrongFeedback}</p>
    <div className="course-g04-l11-in007-feedback-terms" role="group"
      aria-label={lang === "es" ? "Palabras matemáticas de la explicación" :
        "Math words in the explanation"}>
      {feedbackTerms.map((term) => <button data-feedback-term={term.id} key={term.id}
        onClick={() => dispatch({type: "select-term", termId: term.id})} type="button">
        {lang === "es" ? SPANISH_TERMS[term.id] : term.label}</button>)}</div>
    <button className="retry" onClick={() => dispatch({type: "dismiss-feedback"})}
      type="button">{lang === "es" ? "Volver a intentar" : "Try again"}</button>
  </div>;
}

function PointQuestion({dispatch, lang, state}: {dispatch:
  React.Dispatch<CourseG04L11In007ChoiceEvent>; lang: "en" | "es";
  state: CourseG04L11In007ChoiceState}) {
  return <section aria-label={lang === "es" ? "Pregunta del punto Z" : "Point Z question"}
    className="course-g04-l11-in007-question" data-source-choice-count="3"
    data-source-point="Z(7,5)" data-source-question-stop-frame="66">
    <header><span>{lang === "es" ? "Cuadrícula de coordenadas" : "Coordinate grid"}</span>
      <strong>{lang === "es" ? "Nombra el punto Z" : "Name Point Z"}</strong>
      <p>{lang === "es" ? "Haz clic en el par ordenado que nombra el punto Z." :
        COURSE_G04_L11_IN_007_STATIC_SOURCE_FACTS.instruction}</p></header>
    <svg aria-label={lang === "es" ? "Punto Z en una cuadrícula" :
      "Point Z on a coordinate grid"} role="img" viewBox="0 0 520 520">
      <rect fill="#fffde8" height="430" rx="18" width="430" x="42" y="40" />
      {[...Array(11).keys()].map((value) => <React.Fragment key={value}>
        <line className="minor" x1={position(value)} x2={position(value)} y1="58" y2="448" />
        <line className="minor" x1="58" x2="448" y1={position(10 - value)}
          y2={position(10 - value)} />
        <text className="tick" textAnchor="middle" x={position(value)} y="478">{value}</text>
        <text className="tick" dominantBaseline="middle" textAnchor="end" x="48"
          y={position(10 - value)}>{value}</text>
      </React.Fragment>)}
      <line className="axis" x1="58" x2="471" y1="448" y2="448" />
      <line className="axis" x1="58" x2="58" y1="470" y2="36" />
      <path className="arrow" d="M471 448l-13-8v16z" />
      <path className="arrow" d="M58 36l-8 13h16z" />
      <text className="axis-label" x="460" y="503">x</text>
      <text className="axis-label" x="21" y="47">y</text>
      <circle className="point" cx={position(COURSE_G04_L11_IN_007_POINT.x)}
        cy={position(10 - COURSE_G04_L11_IN_007_POINT.y)} r="18" />
      <text className="point-label" x={position(COURSE_G04_L11_IN_007_POINT.x) + 21}
        y={position(10 - COURSE_G04_L11_IN_007_POINT.y) - 13}>Z</text>
    </svg>
    <div className="course-g04-l11-in007-choices" role="group"
      aria-label={lang === "es" ? "Opciones de pares ordenados" : "Ordered-pair choices"}>
      {COURSE_G04_L11_IN_007_CHOICES.map((choice) => <button
        aria-pressed={state.selectedChoice === choice.id} data-choice-id={choice.id}
        data-choice-value={choice.label} disabled={!state.controlsEnabled || state.completed}
        key={choice.id} onClick={() => dispatch({type: "choose", choiceId: choice.id})}
        type="button">{choice.label}</button>)}</div>
    {state.completed && state.feedback === "none" ? <p aria-live="polite"
      className="course-g04-l11-in007-complete" role="status">
      {lang === "es" ? "Completado. Usa Repetir la lección para intentarlo de nuevo." :
        "Complete. Use Replay lesson to try again."}</p> : null}
    <Feedback dispatch={dispatch} lang={lang} state={state} />
  </section>;
}

function Controls({dispatch, lang, replay, state}: {dispatch:
  React.Dispatch<CourseG04L11In007ChoiceEvent>; lang: "en" | "es";
  replay: () => void; state: CourseG04L11In007ChoiceState}) {
  const principal = COURSE_G04_L11_IN_007_TERMS.filter((term) => term.principal);
  return <section className="course-g04-l11-in007-controls"
    data-animation-internal-control-count="4" data-glossary-control-count="3"
    data-wrong-feedback-term-count="5" data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false" data-local-visual-frame={state.frame}
    data-local-visual-playing={state.playing}>
    <header><span>HELP Math 2.0</span>
      <strong>{lang === "es" ? "Nombra puntos en una cuadrícula" :
        "Name Points on a Coordinate Grid"}</strong>
      <p>{lang === "es" ? "Usa las palabras matemáticas cuando necesites ayuda." :
        "Use the math words whenever you need a reminder."}</p></header>
    <div className="course-g04-l11-in007-terms" role="group">
      {principal.map((term) => <button aria-pressed={state.selectedTermId === term.id}
        data-source-button-object-id={term.sourceButtonObjectId ?? undefined} key={term.id}
        onClick={() => dispatch({type: "select-term", termId: term.id})} type="button">
        {lang === "es" ? SPANISH_TERMS[term.id] : term.label}</button>)}</div>
    <TermPanel dispatch={dispatch} lang={lang} state={state} />
    <button className="course-g04-l11-in007-replay" onClick={replay} type="button">
      {lang === "es" ? "Repetir la lección" : "Replay lesson"}</button>
  </section>;
}

export function createCourseG04L11In007PointZChoiceCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11In007Choice, props.frame,
      createCourseG04L11In007ChoiceState);
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); }, [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); }, [props.replay]);
    const replay = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    const question = interactionVisible && state.phase === "point-z-question";
    const lang = props.uiLanguage ?? props.lang;
    return <div className="course-g04-l11-in007-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-registered-current-javascript="false" data-source-audio-enabled="false"
      data-strict-migration-complete="false" data-owner-accepted="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width, width: "100%"}}>
      {question ? <PointQuestion dispatch={dispatch} lang={lang} state={state} /> :
        <SourceRenderer {...props} frame={interactionVisible ? state.frame : props.frame}
          state={undefined} />}
      {interactionVisible ? <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
        <Controls dispatch={dispatch} lang={lang} replay={replay} state={state} />
      </CompanionPortal> : null}
      <style>{`
        .course-g04-l11-in007-question{background:linear-gradient(145deg,#dff2ff,#c3e7ff);border:2px solid #2168a7;border-radius:20px;box-sizing:border-box;color:#17395f;font-family:${UI_FONT};padding:20px;position:relative}.course-g04-l11-in007-question header{text-align:center}.course-g04-l11-in007-question header>span,.course-g04-l11-in007-controls header>span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-in007-question header>strong,.course-g04-l11-in007-controls header>strong{display:block;font-size:clamp(24px,5vw,36px);margin-top:4px}.course-g04-l11-in007-question p,.course-g04-l11-in007-controls p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0}.course-g04-l11-in007-question svg{display:block;height:auto;margin:8px auto;max-width:530px;width:100%}.course-g04-l11-in007-question .minor{stroke:#d6c97a;stroke-width:1.4}.course-g04-l11-in007-question .axis{stroke:#17395f;stroke-width:4}.course-g04-l11-in007-question .arrow{fill:#17395f}.course-g04-l11-in007-question .tick{fill:#17395f;font:700 14px system-ui,sans-serif}.course-g04-l11-in007-question .axis-label{fill:#17395f;font:900 23px ${UI_FONT}}.course-g04-l11-in007-question .point{fill:#2949df;stroke:#ffdc4c;stroke-width:6}.course-g04-l11-in007-question .point-label{fill:#17395f;font:900 22px ${UI_FONT}}
        .course-g04-l11-in007-choices{display:grid;gap:12px;grid-template-columns:repeat(3,1fr);margin:auto;max-width:620px}.course-g04-l11-in007-choices button{background:white;border:3px solid #2168a7;border-radius:15px;color:#17395f;cursor:pointer;font:900 clamp(21px,5vw,32px) ${UI_FONT};min-height:68px}.course-g04-l11-in007-choices button:focus,.course-g04-l11-in007-choices button:hover{background:#fff7c8;border-color:#9a5d00}.course-g04-l11-in007-choices button:disabled{cursor:not-allowed;opacity:.55}.course-g04-l11-in007-complete{background:white;border:2px solid #2168a7;border-radius:12px;font-weight:800;padding:10px;text-align:center}
        .course-g04-l11-in007-feedback{background:#fff7c8;border:3px solid #9a5d00;border-radius:18px;box-shadow:0 12px 30px #17395f44;display:grid;gap:10px;left:50%;max-height:90%;max-width:92%;overflow:auto;padding:18px;position:absolute;top:50%;transform:translate(-50%,-50%);width:580px;z-index:5}.course-g04-l11-in007-feedback.correct{background:#e8b7ff;border-color:#7b1fa2}.course-g04-l11-in007-feedback strong{font-size:clamp(22px,5vw,34px)}.course-g04-l11-in007-feedback button{background:white;border:2px solid #2168a7;border-radius:10px;min-height:44px;padding:8px 12px}.course-g04-l11-in007-feedback-terms{display:flex;flex-wrap:wrap;gap:7px}.course-g04-l11-in007-feedback .retry{justify-self:end}
        .course-g04-l11-in007-controls{background:linear-gradient(145deg,#f5fbff,#e2f4ff);border:2px solid #2168a7;border-radius:18px;color:#17395f;display:grid;font-family:${UI_FONT};gap:13px;margin-top:12px;padding:16px}.course-g04-l11-in007-terms{display:flex;flex-wrap:wrap;gap:8px}.course-g04-l11-in007-controls button,.course-g04-l11-in007-term button{background:white;border:2px solid #2168a7;border-radius:12px;color:#17395f;cursor:pointer;font:800 15px system-ui,sans-serif;min-height:44px;padding:8px 12px}.course-g04-l11-in007-controls button[aria-pressed=true]{background:#17395f;color:white}.course-g04-l11-in007-term{align-items:center;background:#fff7c8;border:2px solid #9a5d00;border-radius:14px;display:flex;gap:12px;justify-content:space-between;padding:12px}.course-g04-l11-in007-replay{justify-self:start}
        @media(max-width:600px){.course-g04-l11-in007-question{padding:10px}.course-g04-l11-in007-choices{grid-template-columns:1fr}.course-g04-l11-in007-choices button{min-height:52px}.course-g04-l11-in007-term{align-items:stretch;flex-direction:column}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-instruction-and-modern-point-z-choice-functional-candidate",
    interactionAuthority: COURSE_G04_L11_IN_007_INTERACTION_AUTHORITY,
    sourcePointZCoordinatePreserved: true, sourceChoiceCountPreserved: 3,
    sourcePrincipalGlossaryControlCountPreserved: 3,
    sourceWrongFeedbackTermCountPreserved: 5,
    sourceWrongExplanationAndRetryPreserved: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    movie: candidate.movie, sourceContract,
    interactionAuthority: COURSE_G04_L11_IN_007_INTERACTION_AUTHORITY});
}
