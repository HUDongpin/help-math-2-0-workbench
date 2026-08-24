"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_TI_005_GLOSSARY, COURSE_G04_L11_TI_005_ROWS} from
  "../source-static/g4-l11/course-g04-l11-ti-005-static";
import {COURSE_G04_L11_TI_005_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_005_INTERACTION_SOURCE,
  createCourseG04L11Ti005EquationPlotState,
  getCourseG04L11Ti005SelectedGlossary,
  reduceCourseG04L11Ti005EquationPlot, type CourseG04L11Ti005EquationPlotEvent,
  type CourseG04L11Ti005EquationPlotState, type CourseG04L11Ti005GlossaryId} from
  "../timelines/course-g04-l11-ti-005-equation-plot-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_SCENARIO = "source-static-frame"; const SOURCE_DOMAIN = "sprite-342";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const EN_GLOSSARY: Readonly<Record<CourseG04L11Ti005GlossaryId, string>> = Object.freeze({
  value: "A number that a variable represents.", equation: "A statement that two expressions are equal.",
  connected: "Joined together without a gap.", "line-segment": "Part of a line with two endpoints.",
  coordinate: "One number used to locate a point.", grid: "A pattern of horizontal and vertical lines.",
  "ordered-pair": "Two coordinates in a fixed order, such as (1,4).",
  plot: "To mark a point on a coordinate grid.", column: "A vertical group of table entries.",
  line: "A straight path that continues in both directions.", point: "An exact location shown by a dot.",
});
const ES_LABELS: Readonly<Record<CourseG04L11Ti005GlossaryId, string>> = Object.freeze({
  value: "Valor", equation: "Ecuación", connected: "Conectado",
  "line-segment": "Segmento de recta", coordinate: "Coordenada", grid: "Cuadrícula",
  "ordered-pair": "Par ordenado", plot: "Representar", column: "Columna",
  line: "Recta", point: "Punto",
});
const ES_GLOSSARY: Readonly<Record<CourseG04L11Ti005GlossaryId, string>> = Object.freeze({
  value: "Un número representado por una variable.", equation: "Una igualdad entre dos expresiones.",
  connected: "Unido sin dejar un espacio.", "line-segment": "Parte de una recta con dos extremos.",
  coordinate: "Uno de los números que ubica un punto.", grid: "Líneas horizontales y verticales.",
  "ordered-pair": "Dos coordenadas en un orden fijo, como (1,4).",
  plot: "Marcar un punto en una cuadrícula.", column: "Un grupo vertical de datos.",
  line: "Un camino recto que continúa en ambas direcciones.", point: "Una ubicación exacta.",
});

function PageCompanionPortal({children, targetId}: {children: React.ReactNode; targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  useEffect(() => { if (!targetId) { setTarget(null); setResolvedId(null); return; }
    setTarget(document.getElementById(targetId)); setResolvedId(targetId); }, [targetId]);
  if (!targetId) return children; if (resolvedId !== targetId) return null;
  return target ? createPortal(children, target) : children;
}

function EquationGrid({state, isSpanish}: {state: CourseG04L11Ti005EquationPlotState;
  isSpanish: boolean}) {
  const ox = 54; const oy = 394; const unit = 32;
  const points = COURSE_G04_L11_TI_005_ROWS.filter((row) => state.rows[row.id].completed);
  const linePoints = COURSE_G04_L11_TI_005_ROWS.map((row) =>
    `${ox + row.x * unit},${oy - row.y * unit}`).join(" ");
  return <svg aria-label={isSpanish ? "Gráfica de x más 3 igual a y" :
    "Graph of x plus 3 equals y"} className="course-g04-l11-ti005-grid" role="img"
    viewBox="0 0 430 430"><rect fill="#fbfdff" height="420" rx="18"
    stroke="#75a6d5" strokeWidth="3" width="420" x="5" y="5" />
    {Array.from({length: 11}, (_, value) => { const x = ox + value * unit;
      const y = oy - value * unit; return <g key={value}><line
        stroke={value === 0 ? "#174c7e" : "#c6ddec"} strokeWidth={value === 0 ? 3 : 1}
        x1={x} x2={x} y1={oy - 10 * unit} y2={oy} /><line
        stroke={value === 0 ? "#174c7e" : "#c6ddec"} strokeWidth={value === 0 ? 3 : 1}
        x1={ox} x2={ox + 10 * unit} y1={y} y2={y} /><text fill="#17395f"
        fontFamily="system-ui,sans-serif" fontSize="12" textAnchor="middle" x={x}
        y={oy + 21}>{value}</text>{value > 0 ? <text fill="#17395f"
        fontFamily="system-ui,sans-serif" fontSize="12" textAnchor="end" x={ox - 8}
        y={y + 4}>{value}</text> : null}</g>; })}
    {state.lineDrawn ? <polyline fill="none" points={linePoints} stroke="#087f5b"
      strokeLinecap="round" strokeWidth="6" /> : null}
    {points.map((row) => <g key={row.id}><circle cx={ox + row.x * unit}
      cy={oy - row.y * unit} fill={state.rows[row.id].completionOrigin ===
      "source-second-attempt-reveal" ? "#ef7b25" : "#087f5b"} r="8" />
      <text fill="#17395f" fontFamily={UI_FONT} fontSize="13" fontWeight="800"
        x={ox + row.x * unit + 9} y={oy - row.y * unit - 9}>({row.x},{row.y})</text></g>)}
  </svg>;
}

function EquationControls({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11Ti005EquationPlotState;
  dispatch: React.Dispatch<CourseG04L11Ti005EquationPlotEvent>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const es = lang === "es"; const glossary = getCourseG04L11Ti005SelectedGlossary(state);
  const modal = state.phase === "feedback" || state.phase === "help" || state.phase === "glossary";
  return <section aria-label={es ? "Actividad de tabla y gráfica" : "Equation table and graph activity"}
    className="course-g04-l11-ti005-plot" data-animation-internal-pedagogical-control-count="18"
    data-source-row-count="5" data-source-plot-point-control-count="5"
    data-source-draw-line-threshold="5" data-source-glossary-control-count="11"
    data-source-question-stop-frame="419" data-source-audio-enabled="false"
    data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span><h2>{es ? "Cuadrícula de coordenadas: ¡Inténtalo!" :
      "Coordinate Grid: Try It!"}</h2><p>{es
      ? "Completa la columna y, representa los cinco puntos y después dibuja la línea."
      : COURSE_G04_L11_TI_005_INTERACTION_SOURCE.sourceEquation +
        " — Enter each y-value, plot all five points, then draw the line."}</p>
      <b className="equation">x + 3 = y</b></header>
    <div className="course-g04-l11-ti005-workspace"><div className="table-side"><table>
      <caption>{es ? "Tabla de valores" : "Value table"}</caption><thead><tr><th>x</th><th>y</th><th>{es
        ? "Acción" : "Action"}</th></tr></thead><tbody>{COURSE_G04_L11_TI_005_ROWS.map((row) => {
        const current = state.rows[row.id]; return <tr className={current.completed ? "completed" : ""}
          key={row.id}><th scope="row">{row.x}</th><td><label><span className="sr-only">{es
          ? `Valor y cuando x es ${row.x}` : `y-value when x is ${row.x}`}</span><input
          aria-label={es ? `Valor y para x igual a ${row.x}` : `y-value for x equals ${row.x}`}
          disabled={modal || current.completed || state.phase !== "working"} inputMode="numeric"
          maxLength={2} onChange={(event) => dispatch({type: "set-row-input", rowId: row.id,
            value: event.currentTarget.value})} pattern="(?:0|[1-9]|10)" value={current.input} /></label></td>
          <td><button data-source-plot-button-object-id={row.sourcePlotButtonObjectId}
          disabled={modal || current.completed || state.phase !== "working" || current.input === ""}
          onClick={() => dispatch({type: "plot-row", rowId: row.id})} type="button">{current.completed
            ? es ? "Representado" : "Plotted" : es ? "Representar punto" : "Plot Point"}</button></td></tr>;
      })}</tbody></table><div aria-live="polite" className="progress">{es
        ? `${state.completedRowIds.length} de 5 puntos representados` :
          `${state.completedRowIds.length} of 5 points plotted`}</div>
      <button className="draw" disabled={state.phase !== "ready-line"}
        onClick={() => dispatch({type: "draw-line"})} type="button">{state.lineDrawn
          ? es ? "Línea dibujada" : "Line drawn" : es ? "Dibujar línea" : "Draw Line"}</button>
      <button disabled={modal} onClick={() => dispatch({type: "open-help"})} type="button">{es
        ? "Necesito más ayuda" : "Need More Help"}</button></div>
      <EquationGrid isSpanish={es} state={state} /></div>
    <details className="course-g04-l11-ti005-glossary"><summary>{es ? "Palabras matemáticas" :
      "Math words"}</summary><div role="group" aria-label={es ? "Glosario" : "Glossary"}>
      {COURSE_G04_L11_TI_005_GLOSSARY.map((term) => <button
        data-source-glossary-button-object-ids={term.sourceButtonObjectIds.join(",")}
        disabled={modal} key={term.id} onClick={() => dispatch({type: "open-glossary",
          glossaryId: term.id})} type="button">{es ? ES_LABELS[term.id] : term.label}</button>)}</div></details>
    {state.phase === "feedback" ? <div aria-live="assertive"
      className={`course-g04-l11-ti005-feedback ${state.feedbackKind}`} role="alert"><strong>{
      state.feedbackKind === "retry" ? es ? "Inténtalo de nuevo" : "Try again" : es
        ? "Revisa el valor" : "Review the value"}</strong><p>{state.feedbackKind === "retry" && es
        ? "Comprueba la ecuación x + 3 = y e inténtalo otra vez." : state.feedbackMessage}</p>
      <button onClick={() => dispatch({type: "close-feedback"})} type="button">{es
        ? "Continuar" : "Continue"}</button></div> : null}
    {state.phase === "help" ? <div aria-modal="true" className="course-g04-l11-ti005-modal"
      role="dialog"><div><span>{es ? "Ejemplo guiado" : "Guided example"}</span><strong>
      x + 1 = y</strong><p>{es ? "Los pares (1,2), (2,3), (3,4), (4,5) y (5,6) forman un segmento."
        : "The ordered pairs (1,2), (2,3), (3,4), (4,5), and (5,6) form a line segment."}</p>
      <button onClick={() => dispatch({type: "close-help"})} type="button">{es
        ? "Cerrar ayuda" : "Close help"}</button></div></div> : null}
    {glossary ? <div className="course-g04-l11-ti005-term-panel" role="status"><div><strong>{es
      ? ES_LABELS[glossary.id] : glossary.label}</strong><p>{es ? ES_GLOSSARY[glossary.id] :
      EN_GLOSSARY[glossary.id]}</p></div><button onClick={() => dispatch({type: "close-glossary"})}
      type="button">{es ? "Cerrar" : "Close"}</button></div> : null}
    <div className="course-g04-l11-ti005-playback"><span>{es
      ? "Los controles matemáticos se conservan sin el reproductor antiguo."
      : "Mathematical controls are preserved without the old course player."}</span>
      <button onClick={replayLocally} type="button">{es ? "Repetir la actividad" :
        "Replay activity"}</button></div></section>;
}

export function createCourseG04L11Ti005EquationPlotCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11Ti005EquationPlot,
      {frame: props.frame}, ({frame}) => createCourseG04L11Ti005EquationPlotState(frame));
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); }, [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); }, [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-ti005-candidate"
      data-authoritative-original-runtime-evidence="false" data-current-js-functional-candidate="true"
      data-current-js-functional-scope="433-source-canvas-frames-five-y-inputs-five-plot-controls-draw-line-help-eleven-glossary-controls"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-duplicate-old-and-modern-controls-included="false" data-owner-accepted="false"
      data-registered-current-javascript="false" data-strict-acceptance-effect="none"
      data-strict-migration-complete="false" style={{margin: "0 auto",
        maxWidth: candidate.movie.stage.width, position: "relative", width: "100%"}}>
      <div aria-hidden={interactionVisible ? true : undefined}
        className="course-g04-l11-ti005-source-stage" hidden={interactionVisible}>
        <SourceRenderer {...props} frame={interactionVisible ? state.sourceCanvasFrame : props.frame}
          state={undefined} />{interactionVisible ? <div aria-hidden="true"
          className="course-g04-l11-ti005-source-interaction-mask"
          data-modern-replaced-source-control-surface="true" /> : null}</div>
      {interactionVisible ? <PageCompanionPortal targetId={props.pageInteractionCompanionTargetId}>
        <EquationControls state={state} dispatch={dispatch} lang={props.uiLanguage ?? props.lang}
          replayLocally={replayLocally} /></PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-ti005-source-stage{position:relative}.course-g04-l11-ti005-source-stage[hidden]{display:none}.course-g04-l11-ti005-source-interaction-mask{background:#b8d8f7;inset:0;position:absolute;z-index:2}.course-g04-l11-ti005-plot{background:linear-gradient(145deg,#f5fbff,#e3f5ff);border:2px solid #2168a7;border-radius:20px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:17px;width:100%}.course-g04-l11-ti005-plot header{position:relative}.course-g04-l11-ti005-plot header>span,.course-g04-l11-ti005-modal span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-ti005-plot header>h2{display:block;font-size:clamp(23px,4vw,34px);margin:0}.course-g04-l11-ti005-plot p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0}.course-g04-l11-ti005-plot .equation{background:#fff8ad;border:3px solid #a95000;border-radius:14px;color:#8b3100;font-size:28px;padding:7px 14px;position:absolute;right:0;top:0}.course-g04-l11-ti005-workspace{align-items:start;display:grid;gap:15px;grid-template-columns:minmax(290px,.9fr) minmax(310px,1.1fr)}.course-g04-l11-ti005-grid{display:block;height:auto;width:100%}.table-side{display:grid;gap:9px}.course-g04-l11-ti005-plot table{background:#fff;border:2px solid #75a6d5;border-collapse:separate;border-radius:14px;border-spacing:0;overflow:hidden;width:100%}.course-g04-l11-ti005-plot caption{font-size:18px;font-weight:900;padding:8px}.course-g04-l11-ti005-plot th,.course-g04-l11-ti005-plot td{border-top:1px solid #bfd8eb;padding:7px;text-align:center}.course-g04-l11-ti005-plot thead th{background:#e8f6ff}.course-g04-l11-ti005-plot tr.completed{background:#e1f7ee}.course-g04-l11-ti005-plot input{border:2px solid #75a6d5;border-radius:8px;color:#8b3100;font:900 22px ${UI_FONT};padding:5px;text-align:center;width:48px}.sr-only{height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}.progress{background:#fff;border:2px solid #75a6d5;border-radius:11px;font-family:system-ui,sans-serif;font-weight:800;padding:9px;text-align:center}
        .course-g04-l11-ti005-plot button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:10px;color:#102b70;cursor:pointer;font:800 14px ${UI_FONT};min-height:40px;padding:7px 9px}.course-g04-l11-ti005-plot button.draw{background:linear-gradient(#45c896,#087f5b);border-color:#075a42;color:#fff}.course-g04-l11-ti005-plot button:disabled{cursor:not-allowed;opacity:.55}.course-g04-l11-ti005-plot button:focus-visible,.course-g04-l11-ti005-plot input:focus-visible,.course-g04-l11-ti005-plot summary:focus-visible{outline:4px solid #0758ba;outline-offset:2px}.course-g04-l11-ti005-glossary{background:#fff;border:2px solid #75a6d5;border-radius:14px;padding:11px}.course-g04-l11-ti005-glossary summary{color:#0758ba;cursor:pointer;font-weight:900}.course-g04-l11-ti005-glossary>div{display:grid;gap:7px;grid-template-columns:repeat(4,1fr);margin-top:9px}.course-g04-l11-ti005-feedback,.course-g04-l11-ti005-term-panel{background:#fff;border:3px solid #1c75bc;border-radius:14px;padding:14px}.course-g04-l11-ti005-feedback.retry{border-color:#c65100}.course-g04-l11-ti005-term-panel{align-items:center;display:flex;gap:14px;justify-content:space-between}.course-g04-l11-ti005-playback{align-items:center;display:flex;font-family:system-ui,sans-serif;font-weight:750;justify-content:space-between}.course-g04-l11-ti005-modal{align-items:center;background:rgba(7,45,82,.58);display:flex;inset:0;justify-content:center;padding:18px;position:fixed;z-index:100}.course-g04-l11-ti005-modal>div{background:#fff;border:4px solid #2168a7;border-radius:20px;max-width:540px;padding:20px;width:100%}.course-g04-l11-ti005-modal strong{display:block;font-size:30px}
        @media(max-width:700px){.course-g04-l11-ti005-plot .equation{display:inline-block;margin-top:9px;position:static;width:max-content}.course-g04-l11-ti005-workspace{grid-template-columns:1fr}.course-g04-l11-ti005-glossary>div{grid-template-columns:repeat(2,1fr)}.course-g04-l11-ti005-term-panel,.course-g04-l11-ti005-playback{align-items:stretch;flex-direction:column;gap:9px}}
      `}</style></div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "433-source-canvas-frames-five-y-inputs-five-plot-controls-draw-line-help-eleven-glossary-controls-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN, frame: 419,
      scenario: SOURCE_SCENARIO, language: "en", deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_TI_005_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_TI_005_INTERACTION_AUTHORITY,
    exactEquationPreserved: "x + 3 = y", fiveRowsPreserved: true,
    firstWrongRetryAndSecondWrongRevealPreserved: true, drawLineThresholdPreserved: 5,
    helpFunctionPreserved: true, glossaryVocabularyPreserved: 11,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    duplicateOldAndModernControlsExcluded: true, registeredCurrentJavascript: false,
    sourceAudioAccepted: false, behaviorParityEstablished: false,
    visualFidelityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
