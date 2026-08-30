"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_TI_003_GLOSSARY} from
  "../source-static/g4-l11/course-g04-l11-ti-003-static";
import {COURSE_G04_L11_TI_003_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_003_INTERACTION_SOURCE,
  createCourseG04L11Ti003PlotState, getCourseG04L11Ti003SelectedGlossary,
  reduceCourseG04L11Ti003Plot, type CourseG04L11Ti003GlossaryId,
  type CourseG04L11Ti003PlotEvent, type CourseG04L11Ti003PlotState} from
  "../timelines/course-g04-l11-ti-003-coordinate-plot-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-346";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const EN_GLOSSARY: Readonly<Record<CourseG04L11Ti003GlossaryId, string>> =
  Object.freeze({
    "ordered-pair": "Two coordinates written in a fixed order, such as (3,5).",
    number: "A mathematical idea used to count, measure, or label.",
    unit: "One equal step used for measuring distance on an axis.",
    zero: "The starting value at the origin of this first-quadrant grid.",
    "x-axis": "The horizontal number line. Read it first in an ordered pair.",
    coordinates: "The two numbers that locate a point on a coordinate grid.",
    point: "An exact location shown by a dot.",
    coordinate: "One number in an ordered pair that locates a point.",
    grid: "A pattern of horizontal and vertical lines.",
    location: "The exact place where a point belongs.",
    "coordinate-grid": "A grid whose axes help locate points with ordered pairs.",
    plot: "To mark the location of a point on a coordinate grid.",
  });
const ES_LABELS: Readonly<Record<CourseG04L11Ti003GlossaryId, string>> =
  Object.freeze({
    "ordered-pair": "Par ordenado", number: "Número", unit: "Unidad", zero: "Cero",
    "x-axis": "Eje x", coordinates: "Coordenadas", point: "Punto",
    coordinate: "Coordenada", grid: "Cuadrícula", location: "Ubicación",
    "coordinate-grid": "Cuadrícula de coordenadas", plot: "Representar",
  });
const ES_GLOSSARY: Readonly<Record<CourseG04L11Ti003GlossaryId, string>> =
  Object.freeze({
    "ordered-pair": "Dos coordenadas escritas en un orden fijo, como (3,5).",
    number: "Una idea matemática que se usa para contar, medir o identificar.",
    unit: "Un paso igual que se usa para medir distancia en un eje.",
    zero: "El valor inicial en el origen de esta cuadrícula del primer cuadrante.",
    "x-axis": "La recta numérica horizontal. Se lee primero en un par ordenado.",
    coordinates: "Los dos números que ubican un punto en una cuadrícula.",
    point: "Una ubicación exacta que se muestra con un punto.",
    coordinate: "Un número de un par ordenado que ubica un punto.",
    grid: "Un patrón de líneas horizontales y verticales.",
    location: "El lugar exacto donde pertenece un punto.",
    "coordinate-grid": "Una cuadrícula cuyos ejes ubican puntos con pares ordenados.",
    plot: "Marcar la ubicación de un punto en una cuadrícula de coordenadas.",
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

function CoordinateGrid({state, isSpanish}: {
  state: CourseG04L11Ti003PlotState; isSpanish: boolean;
}) {
  const originX = 62; const originY = 398; const unit = 31.5;
  const cursorX = originX + state.cursor.x * unit;
  const cursorY = originY - state.cursor.y * unit;
  const plotted = state.plottedPair;
  return <svg aria-label={isSpanish
    ? `Cuadrícula de coordenadas. Selección actual ${state.cursor.x}, ${state.cursor.y}`
    : `Coordinate grid. Current selection ${state.cursor.x}, ${state.cursor.y}`}
    className="course-g04-l11-ti003-grid" role="img" viewBox="0 0 430 440">
    <rect fill="#fbfdff" height="430" rx="18" stroke="#75a6d5" strokeWidth="3"
      width="420" x="5" y="5" />
    {Array.from({length: 11}, (_, value) => {
      const position = originX + value * unit;
      const yPosition = originY - value * unit;
      return <g key={value}>
        <line stroke={value === 0 ? "#174c7e" : "#bfd8eb"}
          strokeWidth={value === 0 ? 3 : 1} x1={position} x2={position}
          y1={originY - 10 * unit} y2={originY} />
        <line stroke={value === 0 ? "#174c7e" : "#bfd8eb"}
          strokeWidth={value === 0 ? 3 : 1} x1={originX}
          x2={originX + 10 * unit} y1={yPosition} y2={yPosition} />
        <text fill="#17395f" fontFamily="system-ui, sans-serif" fontSize="13"
          textAnchor="middle" x={position} y={originY + 22}>{value}</text>
        {value > 0 ? <text fill="#17395f" fontFamily="system-ui, sans-serif"
          fontSize="13" textAnchor="end" x={originX - 10} y={yPosition + 5}>
          {value}</text> : null}
      </g>;
    })}
    <path d={`M ${originX + 10 * unit} ${originY} l -10 -6 v 12 z`}
      fill="#174c7e" /><path d={`M ${originX} ${originY - 10 * unit} l -6 10 h 12 z`}
      fill="#174c7e" />
    <text fill="#174c7e" fontFamily={UI_FONT} fontSize="17" fontWeight="800"
      x={originX + 10 * unit + 12} y={originY + 5}>x</text>
    <text fill="#174c7e" fontFamily={UI_FONT} fontSize="17" fontWeight="800"
      x={originX - 3} y={originY - 10 * unit - 13}>y</text>
    <line stroke="#ef7b25" strokeDasharray="7 5" strokeWidth="2"
      x1={cursorX} x2={cursorX} y1={cursorY} y2={originY} />
    <line stroke="#ef7b25" strokeDasharray="7 5" strokeWidth="2"
      x1={originX} x2={cursorX} y1={cursorY} y2={cursorY} />
    <circle aria-hidden="true" cx={cursorX} cy={cursorY} fill="#fff"
      r="10" stroke="#d65300" strokeWidth="4" />
    {plotted ? <g><circle cx={originX + plotted.x * unit}
      cy={originY - plotted.y * unit} fill="#087f5b" r="9" />
      <text fill="#075a42" fontFamily={UI_FONT} fontSize="15" fontWeight="800"
        x={originX + plotted.x * unit + 12} y={originY - plotted.y * unit - 11}>
        ({plotted.x},{plotted.y})</text></g> : null}
  </svg>;
}

function PlotControls({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11Ti003PlotState;
  dispatch: React.Dispatch<CourseG04L11Ti003PlotEvent>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const isSpanish = lang === "es";
  const glossary = getCourseG04L11Ti003SelectedGlossary(state);
  const disabled = state.phase !== "plotting" || state.popupOpen ||
    state.nextOrderedPairEnabled;
  return <section aria-label={isSpanish ? "Actividad para representar pares ordenados" :
    "Plot ordered pairs activity"} className="course-g04-l11-ti003-plot"
    data-animation-internal-pedagogical-control-count="17"
    data-source-grid-point-count="121" data-source-initial-pool-count="14"
    data-source-replacement-pool-count="18" data-source-glossary-control-count="12"
    data-source-help-control-count="1" data-source-quiz-stop-frame="235"
    data-source-audio-enabled="false" data-source-point-hit-geometry-established="false"
    data-source-replacement-pool-repair-applied="false"
    data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span><strong>{isSpanish
      ? "Cuadrícula de coordenadas: ¡Inténtalo!" : "Coordinate Grid: Try It!"}</strong>
      <p>{isSpanish
        ? "Representa el par ordenado en la ubicación exacta de la cuadrícula."
        : COURSE_G04_L11_TI_003_INTERACTION_SOURCE.prompt}</p>
      <div className="course-g04-l11-ti003-pair"><small>{isSpanish
        ? "Par ordenado" : "Ordered pair"}</small><b>({state.currentPair.x},
        {state.currentPair.y})</b></div></header>
    <div className="course-g04-l11-ti003-workspace">
      <CoordinateGrid isSpanish={isSpanish} state={state} />
      <aside><div className="course-g04-l11-ti003-axis"><label htmlFor="ti003-x">
        {isSpanish ? "Primero: unidades sobre el eje x" : "First: units over on the x-axis"}
        <strong>x = {state.cursor.x}</strong></label><input disabled={disabled}
          id="ti003-x" max="10" min="0" onChange={(event) => dispatch({type: "set-cursor",
            x: Number(event.currentTarget.value), y: state.cursor.y})} step="1" type="range"
          value={state.cursor.x} /></div>
        <div className="course-g04-l11-ti003-axis"><label htmlFor="ti003-y">
          {isSpanish ? "Después: unidades hacia arriba en el eje y" :
            "Then: units up on the y-axis"}<strong>y = {state.cursor.y}</strong></label>
        <input disabled={disabled} id="ti003-y" max="10" min="0"
          onChange={(event) => dispatch({type: "set-cursor", x: state.cursor.x,
            y: Number(event.currentTarget.value)})} step="1" type="range"
          value={state.cursor.y} /></div>
        <div aria-live="polite" className="course-g04-l11-ti003-selection">
          {isSpanish ? "Ubicación seleccionada" : "Selected location"}
          <strong>({state.cursor.x},{state.cursor.y})</strong></div>
        <button className="primary" disabled={disabled}
          onClick={() => dispatch({type: "submit-point"})} type="button">
          {isSpanish ? "Representar este punto" : "Plot this point"}</button>
        <button disabled={!state.nextOrderedPairEnabled || state.popupOpen}
          onClick={() => dispatch({type: "next-ordered-pair"})} type="button">
          {isSpanish ? "Siguiente par ordenado" : "Next Ordered Pair"}</button>
        <button disabled={state.phase !== "plotting" || state.popupOpen}
          onClick={() => dispatch({type: "open-help"})} type="button">
          {isSpanish ? "Necesito más ayuda" : "Need More Help"}</button>
      </aside>
    </div>
    <details className="course-g04-l11-ti003-glossary"><summary>{isSpanish
      ? "Palabras matemáticas" : "Math words"}</summary><div role="group"
      aria-label={isSpanish ? "Glosario" : "Glossary"}>
      {COURSE_G04_L11_TI_003_GLOSSARY.map((term) => <button
        data-source-glossary-button-object-ids={term.sourceButtonObjectIds.join(",")}
        disabled={state.phase !== "plotting" || state.popupOpen}
        key={term.id} onClick={() => dispatch({type: "open-glossary",
          glossaryId: term.id})} type="button">{isSpanish ? ES_LABELS[term.id] :
          term.label}</button>)}</div></details>
    {state.popupOpen ? <div aria-live="assertive"
      className={`course-g04-l11-ti003-feedback ${state.phase}`} role="alert">
      <strong>{state.phase === "correct-feedback"
        ? isSpanish ? "¡Correcto!" : "Correct!"
        : isSpanish ? "Inténtalo de nuevo" : "Try again"}</strong>
      <p>{state.phase === "wrong-feedback" && isSpanish
        ? "El primer número indica cuántas unidades avanzar en el eje x. El segundo indica cuántas unidades subir."
        : state.feedbackMessage}</p>
      <button onClick={() => dispatch({type: "close-feedback"})} type="button">
        {isSpanish ? "Continuar" : "Continue"}</button></div> : null}
    {state.helpOpen ? <div aria-modal="true" className="course-g04-l11-ti003-modal"
      role="dialog"><div><span>{isSpanish ? "Ejemplo guiado" : "Guided example"}</span>
      <strong>{isSpanish ? "Representa (3,5)" : "Plot (3,5)"}</strong>
      <p>{isSpanish
        ? "Empieza en cero. Avanza 3 unidades en el eje x y después sube 5 unidades."
        : "Start at zero. Move 3 units over on the x-axis, then move 5 units up."}</p>
      <div aria-hidden="true" className="example">0 → <b>3 over</b> → <b>5 up</b> → (3,5)</div>
      <button onClick={() => dispatch({type: "close-help"})} type="button">
        {isSpanish ? "Cerrar ayuda" : "Close help"}</button></div></div> : null}
    {glossary ? <div aria-live="polite" className="course-g04-l11-ti003-term-panel"
      role="status"><div><strong>{isSpanish ? ES_LABELS[glossary.id] :
        glossary.label}</strong><p>{isSpanish ? ES_GLOSSARY[glossary.id] :
        EN_GLOSSARY[glossary.id]}</p></div><button
        onClick={() => dispatch({type: "close-glossary"})} type="button">
        {isSpanish ? "Cerrar" : "Close"}</button></div> : null}
    {state.sourceDefectReached ? <div aria-live="assertive"
      className="course-g04-l11-ti003-source-defect" role="alert"><strong>{isSpanish
        ? "La fuente necesita revisión" : "Source behavior needs review"}</strong>
      <p>{isSpanish
        ? "Se completaron los 14 pares originales. La siguiente rama del archivo fuente contiene arr.lenght y no se reparó sin autorización."
        : state.feedbackMessage}</p></div> : null}
    <div className="course-g04-l11-ti003-playback"><span>{isSpanish
      ? `${state.usedInitialPairIds.length} de 14 pares originales usados` :
      `${state.usedInitialPairIds.length} of 14 source pairs used`}</span>
      <button onClick={replayLocally} type="button">{isSpanish
        ? "Repetir la actividad" : "Replay activity"}</button></div>
  </section>;
}

export function createCourseG04L11Ti003CoordinatePlotCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11Ti003Plot,
      {frame: props.frame, seed: props.seed}, ({frame, seed}) =>
        createCourseG04L11Ti003PlotState(frame, seed));
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-ti003-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="236-source-canvas-frames-coordinate-picker-next-help-twelve-glossary-controls"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-source-replacement-pool-repair-authorized="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <div aria-hidden={interactionVisible ? true : undefined}
        className="course-g04-l11-ti003-source-stage" hidden={interactionVisible}>
        <SourceRenderer {...props}
        frame={interactionVisible ? state.sourceCanvasFrame : props.frame} state={undefined} />
        {interactionVisible ? <div aria-hidden="true"
          className="course-g04-l11-ti003-source-interaction-mask"
          data-modern-replaced-source-control-surface="true" /> : null}</div>
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}><PlotControls state={state}
        dispatch={dispatch} lang={props.uiLanguage ?? props.lang}
        replayLocally={replayLocally} /></PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-ti003-candidate [data-source-replay-parity="unvalidated"]{display:none}.course-g04-l11-ti003-source-stage{position:relative}.course-g04-l11-ti003-source-stage[hidden]{display:none}.course-g04-l11-ti003-source-interaction-mask{background:#b8d8f7;inset:0;position:absolute;z-index:2}
        .course-g04-l11-ti003-plot{background:linear-gradient(145deg,#f5fbff,#e3f5ff);border:2px solid #2168a7;border-radius:20px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:17px;width:100%}.course-g04-l11-ti003-plot header{position:relative}.course-g04-l11-ti003-plot header>span,.course-g04-l11-ti003-modal span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-ti003-plot header>strong{display:block;font-size:clamp(23px,4vw,34px);line-height:1.1;margin:3px 160px 0 0}.course-g04-l11-ti003-plot p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0}.course-g04-l11-ti003-pair{background:#fff8ad;border:3px solid #a95000;border-radius:16px;padding:8px 15px;position:absolute;right:0;text-align:center;top:0}.course-g04-l11-ti003-pair small{display:block;font-family:system-ui,sans-serif;font-weight:700}.course-g04-l11-ti003-pair b{color:#8b3100;display:block;font-size:27px}
        .course-g04-l11-ti003-workspace{align-items:start;display:grid;gap:17px;grid-template-columns:minmax(300px,1.3fr) minmax(230px,.7fr)}.course-g04-l11-ti003-grid{display:block;height:auto;width:100%}.course-g04-l11-ti003-workspace aside{display:grid;gap:11px}.course-g04-l11-ti003-axis,.course-g04-l11-ti003-selection{background:#fff;border:2px solid #75a6d5;border-radius:14px;padding:12px}.course-g04-l11-ti003-axis label{font-family:system-ui,sans-serif;font-weight:750}.course-g04-l11-ti003-axis label strong{color:#8b3100;display:block;font:800 25px ${UI_FONT};margin-top:5px}.course-g04-l11-ti003-axis input{accent-color:#0758ba;width:100%}.course-g04-l11-ti003-selection{font-family:system-ui,sans-serif;font-weight:750;text-align:center}.course-g04-l11-ti003-selection strong{color:#8b3100;display:block;font:800 29px ${UI_FONT};margin-top:3px}
        .course-g04-l11-ti003-plot button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:46px;padding:8px 11px}.course-g04-l11-ti003-plot button.primary{background:linear-gradient(#45c896,#087f5b);border-color:#075a42;color:#fff}.course-g04-l11-ti003-plot button:disabled{cursor:not-allowed;opacity:.55}.course-g04-l11-ti003-plot button:focus-visible,.course-g04-l11-ti003-plot summary:focus-visible,.course-g04-l11-ti003-plot input:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
        .course-g04-l11-ti003-glossary{background:#fff;border:2px solid #75a6d5;border-radius:14px;padding:11px}.course-g04-l11-ti003-glossary summary{color:#0758ba;cursor:pointer;font-weight:900}.course-g04-l11-ti003-glossary>div{display:grid;gap:7px;grid-template-columns:repeat(4,1fr);margin-top:10px}.course-g04-l11-ti003-glossary button{font-size:13px;min-height:38px;padding:6px}
        .course-g04-l11-ti003-feedback,.course-g04-l11-ti003-term-panel,.course-g04-l11-ti003-source-defect{background:#fff;border:3px solid #1c75bc;border-radius:14px;padding:14px}.course-g04-l11-ti003-feedback.wrong-feedback,.course-g04-l11-ti003-source-defect{border-color:#c65100}.course-g04-l11-ti003-feedback strong,.course-g04-l11-ti003-source-defect strong{display:block;font-size:23px}.course-g04-l11-ti003-term-panel{align-items:center;display:flex;gap:14px;justify-content:space-between}.course-g04-l11-ti003-playback{align-items:center;display:flex;font-family:system-ui,sans-serif;font-weight:750;justify-content:space-between}
        .course-g04-l11-ti003-modal{align-items:center;background:rgba(7,45,82,.58);display:flex;inset:0;justify-content:center;padding:18px;position:fixed;z-index:100}.course-g04-l11-ti003-modal>div{background:#fff;border:4px solid #2168a7;border-radius:20px;box-shadow:0 18px 55px rgba(0,0,0,.3);max-width:520px;padding:20px;width:100%}.course-g04-l11-ti003-modal strong{display:block;font-size:28px;margin:3px 0 10px}.course-g04-l11-ti003-modal .example{background:#e8f6ff;border-radius:12px;color:#174c7e;font-size:20px;margin:14px 0;padding:14px;text-align:center}
        @media(max-width:700px){.course-g04-l11-ti003-plot header>strong{margin-right:0}.course-g04-l11-ti003-pair{margin-top:10px;position:static;width:max-content}.course-g04-l11-ti003-workspace{grid-template-columns:1fr}.course-g04-l11-ti003-glossary>div{grid-template-columns:repeat(2,1fr)}.course-g04-l11-ti003-term-panel{align-items:stretch;flex-direction:column}.course-g04-l11-ti003-playback{align-items:stretch;flex-direction:column;gap:9px}.course-g04-l11-ti003-playback button{width:100%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "236-source-canvas-frames-coordinate-picker-next-help-twelve-glossary-controls-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 235, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_TI_003_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_TI_003_INTERACTION_AUTHORITY,
    initialCoordinatePoolPreserved: 14, replacementCoordinatePoolRecorded: 18,
    replacementPoolRepairApplied: false, accessibleCoordinatePickerProvided: true,
    correctFeedbackThenNextGatePreserved: true, wrongRetryPreserved: true,
    helpFunctionPreserved: true, glossaryVocabularyPreserved: 12,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, visualFidelityEstablished: false,
    strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
