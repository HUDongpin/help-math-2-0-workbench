"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_TI_004_GLOSSARY, COURSE_G04_L11_TI_004_POINTS} from
  "../source-static/g4-l11/course-g04-l11-ti-004-static";
import {COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_004_INTERACTION_SOURCE,
  createCourseG04L11Ti004PointEntryState,
  getCourseG04L11Ti004SelectedGlossary,
  reduceCourseG04L11Ti004PointEntry, type CourseG04L11Ti004GlossaryId,
  type CourseG04L11Ti004PointEntryEvent,
  type CourseG04L11Ti004PointEntryState} from
  "../timelines/course-g04-l11-ti-004-point-entry-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-423";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const EN_GLOSSARY: Readonly<Record<CourseG04L11Ti004GlossaryId, string>> =
  Object.freeze({
    "ordered-pair": "Two coordinates written in a fixed order, such as (4,3).",
    "x-coordinate": "The first number in an ordered pair. It tells how far to move across.",
    "y-coordinate": "The second number in an ordered pair. It tells how far to move up.",
    point: "An exact location shown by a dot.",
    "coordinate-grid": "A grid whose axes locate points with ordered pairs.",
    zero: "The value at the origin where the two axes meet.",
    "x-axis": "The horizontal number line on a coordinate grid.",
    locate: "To find or describe an exact position.",
    unit: "One equal step used to measure distance on an axis.",
    "y-axis": "The vertical number line on a coordinate grid.",
    coordinate: "One number used to locate a point.",
    number: "A mathematical idea used to count, measure, or label.",
  });
const ES_LABELS: Readonly<Record<CourseG04L11Ti004GlossaryId, string>> =
  Object.freeze({"ordered-pair": "Par ordenado", "x-coordinate": "Coordenada x",
    "y-coordinate": "Coordenada y", point: "Punto",
    "coordinate-grid": "Cuadrícula de coordenadas", zero: "Cero",
    "x-axis": "Eje x", locate: "Ubicar", unit: "Unidad", "y-axis": "Eje y",
    coordinate: "Coordenada", number: "Número"});
const ES_GLOSSARY: Readonly<Record<CourseG04L11Ti004GlossaryId, string>> =
  Object.freeze({
    "ordered-pair": "Dos coordenadas escritas en un orden fijo, como (4,3).",
    "x-coordinate": "El primer número. Indica cuántas unidades avanzar horizontalmente.",
    "y-coordinate": "El segundo número. Indica cuántas unidades subir.",
    point: "Una ubicación exacta que se muestra con un punto.",
    "coordinate-grid": "Una cuadrícula cuyos ejes ubican puntos con pares ordenados.",
    zero: "El valor en el origen donde se cruzan los ejes.",
    "x-axis": "La recta numérica horizontal de una cuadrícula.",
    locate: "Encontrar o describir una posición exacta.",
    unit: "Un paso igual que mide distancia en un eje.",
    "y-axis": "La recta numérica vertical de una cuadrícula.",
    coordinate: "Uno de los números que ubica un punto.",
    number: "Una idea matemática para contar, medir o identificar.",
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

function CoordinateGrid({state, dispatch, isSpanish}: {
  state: CourseG04L11Ti004PointEntryState;
  dispatch: React.Dispatch<CourseG04L11Ti004PointEntryEvent>; isSpanish: boolean;
}) {
  const originX = 62; const originY = 418; const unit = 34;
  return <div className="course-g04-l11-ti004-grid-wrap"><svg
    aria-label={isSpanish ? "Cuadrícula de coordenadas con cinco puntos" :
      "Coordinate grid with five selectable points"}
    className="course-g04-l11-ti004-grid" role="img" viewBox="0 0 460 460">
    <rect fill="#fbfdff" height="450" rx="18" stroke="#75a6d5" strokeWidth="3"
      width="450" x="5" y="5" />
    {Array.from({length: 11}, (_, value) => {
      const x = originX + value * unit; const y = originY - value * unit;
      return <g key={value}><line stroke={value === 0 ? "#174c7e" : "#c6ddec"}
        strokeWidth={value === 0 ? 3 : 1} x1={x} x2={x} y1={originY - 10 * unit}
        y2={originY} /><line stroke={value === 0 ? "#174c7e" : "#c6ddec"}
        strokeWidth={value === 0 ? 3 : 1} x1={originX} x2={originX + 10 * unit}
        y1={y} y2={y} /><text fill="#17395f" fontFamily="system-ui,sans-serif"
        fontSize="12" textAnchor="middle" x={x} y={originY + 22}>{value}</text>
        {value > 0 ? <text fill="#17395f" fontFamily="system-ui,sans-serif"
          fontSize="12" textAnchor="end" x={originX - 9} y={y + 4}>{value}</text> : null}
      </g>;
    })}
    <text fill="#174c7e" fontFamily={UI_FONT} fontSize="17" fontWeight="800"
      x={originX + 10 * unit + 12} y={originY + 5}>x</text>
    <text fill="#174c7e" fontFamily={UI_FONT} fontSize="17" fontWeight="800"
      x={originX - 2} y={originY - 10 * unit - 12}>y</text>
  </svg>{COURSE_G04_L11_TI_004_POINTS.filter((point) =>
    state.visiblePointIds.includes(point.id)).map((point) => <button
      aria-label={isSpanish ? `Seleccionar punto ${point.id}` : `Select point ${point.id}`}
      className={state.selectedPointId === point.id ? "selected" : ""}
      data-source-point-timeline-id={point.sourceTimelineId} disabled={state.phase !== "selecting"}
      key={point.id} onClick={() => dispatch({type: "select-point", pointId: point.id})}
      style={{left: `${((originX + point.x * unit) / 460) * 100}%`,
        top: `${((originY - point.y * unit) / 460) * 100}%`}} type="button">
      {point.id}</button>)}</div>;
}

function PointEntryControls({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11Ti004PointEntryState;
  dispatch: React.Dispatch<CourseG04L11Ti004PointEntryEvent>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const isSpanish = lang === "es"; const selected = state.selectedPointId;
  const entry = selected ? state.fields[selected] : {x: "", y: ""};
  const glossary = getCourseG04L11Ti004SelectedGlossary(state);
  const fieldDisabled = state.phase !== "answering";
  const clearEnabled = state.phase === "clearable" || state.phase === "revealed";
  return <section aria-label={isSpanish ? "Actividad de coordenadas de puntos" :
    "Point coordinate entry activity"} className="course-g04-l11-ti004-entry"
    data-animation-internal-pedagogical-control-count="30"
    data-source-point-count="5" data-source-coordinate-input-count="10"
    data-source-glossary-control-count="12" data-source-help-control-count="1"
    data-source-question-stop-frame="274" data-source-audio-enabled="false"
    data-source-clear-field-reset-established="false"
    data-modern-bounded-selected-row-reset-applied="true"
    data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span><strong>{isSpanish
      ? "Cuadrícula de coordenadas: ¡Inténtalo!" : "Coordinate Grid: Try It!"}</strong>
      <p>{isSpanish
        ? "Selecciona un punto, escribe sus coordenadas y comprueba tu respuesta."
        : COURSE_G04_L11_TI_004_INTERACTION_SOURCE.prompt}</p></header>
    <div className="course-g04-l11-ti004-workspace"><CoordinateGrid dispatch={dispatch}
      isSpanish={isSpanish} state={state} /><aside><div className="point-card">
      <small>{isSpanish ? "Punto seleccionado" : "Selected point"}</small>
      <strong>{selected ?? "—"}</strong><p>{selected ? isSpanish
        ? "Escribe primero x y después y." : "Enter x first, then y." : isSpanish
        ? "Selecciona A, B, C, D o E en la cuadrícula." :
          "Select A, B, C, D, or E on the grid."}</p></div>
      <div className="coordinate-fields"><label htmlFor="ti004-x">{isSpanish
        ? "Coordenada x" : "x-coordinate"}<input autoComplete="off"
        disabled={fieldDisabled} id="ti004-x" inputMode="numeric" maxLength={2}
        onChange={(event) => dispatch({type: "set-field", axis: "x",
          value: event.currentTarget.value})} pattern="(?:0|[1-9]|10)" value={entry.x} /></label>
      <label htmlFor="ti004-y">{isSpanish ? "Coordenada y" : "y-coordinate"}
        <input autoComplete="off" disabled={fieldDisabled} id="ti004-y"
        inputMode="numeric" maxLength={2} onChange={(event) => dispatch({type: "set-field",
          axis: "y", value: event.currentTarget.value})} pattern="(?:0|[1-9]|10)"
        value={entry.y} /></label></div>
      <button className="primary" disabled={fieldDisabled || entry.x === "" || entry.y === ""}
        onClick={() => dispatch({type: "submit-answer"})} type="button">
        {isSpanish ? "Comprobar respuesta" : "Done — check answer"}</button>
      <button disabled={!clearEnabled} onClick={() => dispatch({type: "clear-selected"})}
        type="button">{isSpanish ? "Borrar y elegir otro punto" :
          "Clear — choose another point"}</button>
      <button disabled={state.phase !== "selecting" && state.phase !== "answering" &&
        state.phase !== "clearable" && state.phase !== "revealed"}
        onClick={() => dispatch({type: "open-help"})} type="button">
        {isSpanish ? "Necesito más ayuda" : "Need More Help"}</button>
      {state.phase === "revealed" ? <div className="reveal" role="status"><strong>{isSpanish
        ? "Mira las coordenadas" : "Review the coordinates"}</strong><p>{isSpanish
        ? `El punto ${selected} es (${entry.x},${entry.y}).` : state.feedbackMessage}</p></div> : null}
    </aside></div>
    <details className="course-g04-l11-ti004-glossary"><summary>{isSpanish
      ? "Palabras matemáticas" : "Math words"}</summary><div role="group"
      aria-label={isSpanish ? "Glosario" : "Glossary"}>
      {COURSE_G04_L11_TI_004_GLOSSARY.map((term) => <button
        data-source-glossary-button-object-ids={term.sourceButtonObjectIds.join(",")}
        disabled={state.phase === "wrong-feedback" || state.phase === "correct-feedback" ||
          state.phase === "help" || state.phase === "glossary"}
        key={term.id} onClick={() => dispatch({type: "open-glossary",
          glossaryId: term.id})} type="button">{isSpanish ? ES_LABELS[term.id] :
          term.label}</button>)}</div></details>
    {state.phase === "wrong-feedback" || state.phase === "correct-feedback" ?
      <div aria-live="assertive" className={`course-g04-l11-ti004-feedback ${state.phase}`}
        role="alert"><strong>{state.phase === "correct-feedback" ? isSpanish
          ? "¡Correcto!" : "Correct!" : isSpanish ? "Inténtalo de nuevo" : "Try again"}</strong>
        <p>{state.phase === "wrong-feedback" && isSpanish
          ? "El primer número es x. El segundo número es y. Inténtalo otra vez."
          : state.feedbackMessage}</p><button onClick={() => dispatch({type: "close-feedback"})}
          type="button">{isSpanish ? "Continuar" : "Continue"}</button></div> : null}
    {state.phase === "help" ? <div aria-modal="true" className="course-g04-l11-ti004-modal"
      role="dialog"><div><span>{isSpanish ? "Ejemplo guiado" : "Guided example"}</span>
      <strong>{isSpanish ? "El punto M es (4,3)" : "Point M is (4,3)"}</strong><p>{isSpanish
        ? "Empieza en cero. Avanza 4 unidades en el eje x y sube 3 unidades en el eje y."
        : "Start at zero. Move 4 units over on the x-axis, then 3 units up on the y-axis."}</p>
      <div aria-hidden="true" className="example">0 → <b>4 over</b> → <b>3 up</b> → M(4,3)</div>
      <button onClick={() => dispatch({type: "close-help"})} type="button">{isSpanish
        ? "Cerrar ayuda" : "Close help"}</button></div></div> : null}
    {glossary ? <div aria-live="polite" className="course-g04-l11-ti004-term-panel"
      role="status"><div><strong>{isSpanish ? ES_LABELS[glossary.id] : glossary.label}</strong>
      <p>{isSpanish ? ES_GLOSSARY[glossary.id] : EN_GLOSSARY[glossary.id]}</p></div>
      <button onClick={() => dispatch({type: "close-glossary"})} type="button">{isSpanish
        ? "Cerrar" : "Close"}</button></div> : null}
    <div className="course-g04-l11-ti004-playback"><span>{isSpanish
      ? "La actividad conserva los controles matemáticos del recurso original."
      : "The mathematical controls are preserved without the old course player."}</span>
      <button onClick={replayLocally} type="button">{isSpanish
        ? "Repetir la actividad" : "Replay activity"}</button></div>
  </section>;
}

export function createCourseG04L11Ti004PointEntryCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11Ti004PointEntry,
      {frame: props.frame}, ({frame}) => createCourseG04L11Ti004PointEntryState(frame));
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-ti004-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="275-source-canvas-frames-five-points-ten-inputs-done-clear-help-twelve-glossary-controls"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-duplicate-old-and-modern-controls-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <div aria-hidden={interactionVisible ? true : undefined}
        className="course-g04-l11-ti004-source-stage" hidden={interactionVisible}>
        <SourceRenderer {...props}
          frame={interactionVisible ? state.sourceCanvasFrame : props.frame} state={undefined} />
        {interactionVisible ? <div aria-hidden="true"
          className="course-g04-l11-ti004-source-interaction-mask"
          data-modern-replaced-source-control-surface="true" /> : null}</div>
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}><PointEntryControls state={state}
        dispatch={dispatch} lang={props.uiLanguage ?? props.lang}
        replayLocally={replayLocally} /></PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-ti004-candidate [data-source-replay-parity="unvalidated"]{display:none}.course-g04-l11-ti004-source-stage{position:relative}.course-g04-l11-ti004-source-stage[hidden]{display:none}.course-g04-l11-ti004-source-interaction-mask{background:#b8d8f7;inset:0;position:absolute;z-index:2}
        .course-g04-l11-ti004-entry{background:linear-gradient(145deg,#f5fbff,#e3f5ff);border:2px solid #2168a7;border-radius:20px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:17px;width:100%}.course-g04-l11-ti004-entry header>span,.course-g04-l11-ti004-modal span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-ti004-entry header>strong{display:block;font-size:clamp(23px,4vw,34px);line-height:1.1;margin-top:3px}.course-g04-l11-ti004-entry p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0}
        .course-g04-l11-ti004-workspace{align-items:start;display:grid;gap:17px;grid-template-columns:minmax(310px,1.25fr) minmax(240px,.75fr)}.course-g04-l11-ti004-grid-wrap{position:relative}.course-g04-l11-ti004-grid{display:block;height:auto;width:100%}.course-g04-l11-ti004-grid-wrap>button{align-items:center;background:#fff8ad;border:3px solid #a95000;border-radius:50%;color:#8b3100;display:flex;font:900 17px ${UI_FONT};height:34px;justify-content:center;min-height:0;padding:0;position:absolute;transform:translate(-50%,-50%);width:34px}.course-g04-l11-ti004-grid-wrap>button.selected{background:#087f5b;border-color:#075a42;color:#fff}.course-g04-l11-ti004-workspace aside{display:grid;gap:10px}.point-card,.coordinate-fields,.reveal{background:#fff;border:2px solid #75a6d5;border-radius:14px;padding:12px}.point-card small{display:block;font-family:system-ui,sans-serif;font-weight:700}.point-card strong{color:#8b3100;display:block;font-size:34px}.coordinate-fields{display:grid;gap:10px;grid-template-columns:1fr 1fr}.coordinate-fields label{font-family:system-ui,sans-serif;font-weight:800}.coordinate-fields input{border:2px solid #75a6d5;border-radius:9px;box-sizing:border-box;color:#8b3100;display:block;font:900 26px ${UI_FONT};margin-top:5px;padding:7px;text-align:center;width:100%}.reveal{border-color:#087f5b}.reveal strong{color:#075a42}
        .course-g04-l11-ti004-entry button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:46px;padding:8px 11px}.course-g04-l11-ti004-entry button.primary{background:linear-gradient(#45c896,#087f5b);border-color:#075a42;color:#fff}.course-g04-l11-ti004-entry button:disabled{cursor:not-allowed;opacity:.55}.course-g04-l11-ti004-entry button:focus-visible,.course-g04-l11-ti004-entry summary:focus-visible,.course-g04-l11-ti004-entry input:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
        .course-g04-l11-ti004-glossary{background:#fff;border:2px solid #75a6d5;border-radius:14px;padding:11px}.course-g04-l11-ti004-glossary summary{color:#0758ba;cursor:pointer;font-weight:900}.course-g04-l11-ti004-glossary>div{display:grid;gap:7px;grid-template-columns:repeat(4,1fr);margin-top:10px}.course-g04-l11-ti004-glossary button{font-size:13px;min-height:38px;padding:6px}.course-g04-l11-ti004-feedback,.course-g04-l11-ti004-term-panel{background:#fff;border:3px solid #1c75bc;border-radius:14px;padding:14px}.course-g04-l11-ti004-feedback.wrong-feedback{border-color:#c65100}.course-g04-l11-ti004-feedback strong{display:block;font-size:23px}.course-g04-l11-ti004-term-panel{align-items:center;display:flex;gap:14px;justify-content:space-between}.course-g04-l11-ti004-playback{align-items:center;display:flex;font-family:system-ui,sans-serif;font-weight:750;justify-content:space-between}
        .course-g04-l11-ti004-modal{align-items:center;background:rgba(7,45,82,.58);display:flex;inset:0;justify-content:center;padding:18px;position:fixed;z-index:100}.course-g04-l11-ti004-modal>div{background:#fff;border:4px solid #2168a7;border-radius:20px;box-shadow:0 18px 55px rgba(0,0,0,.3);max-width:520px;padding:20px;width:100%}.course-g04-l11-ti004-modal strong{display:block;font-size:28px;margin:3px 0 10px}.course-g04-l11-ti004-modal .example{background:#e8f6ff;border-radius:12px;color:#174c7e;font-size:20px;margin:14px 0;padding:14px;text-align:center}
        @media(max-width:700px){.course-g04-l11-ti004-workspace{grid-template-columns:1fr}.course-g04-l11-ti004-glossary>div{grid-template-columns:repeat(2,1fr)}.course-g04-l11-ti004-term-panel,.course-g04-l11-ti004-playback{align-items:stretch;flex-direction:column;gap:9px}.course-g04-l11-ti004-playback button{width:100%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "275-source-canvas-frames-five-points-ten-inputs-done-clear-help-twelve-glossary-controls-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 274, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_TI_004_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY,
    fiveSourcePointsPreserved: true, tenCoordinateInputsPreserved: true,
    firstWrongRetryAndSecondWrongRevealPreserved: true,
    sourceClearFieldResetEstablished: false,
    modernBoundedSelectedRowResetApplied: true,
    helpFunctionPreserved: true, glossaryVocabularyPreserved: 12,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    duplicateOldAndModernControlsExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, visualFidelityEstablished: false,
    strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
