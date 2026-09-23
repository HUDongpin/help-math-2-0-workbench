"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_IN_009_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_009_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_009_TERMS,
  createCourseG04L11In009PracticeState,
  getCourseG04L11In009SelectedTerm,
  reduceCourseG04L11In009Practice,
  type CourseG04L11In009PracticeEvent,
  type CourseG04L11In009PracticeState,
  type CourseG04L11In009TermId,
} from "../timelines/course-g04-l11-in-009-line-practice-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-288";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const ES_TERMS: Readonly<Record<CourseG04L11In009TermId, string>> =
  Object.freeze({column: "Columna", plot: "Trazar", line: "Línea", point: "Punto"});
const ES_PROMPTS: Readonly<Record<CourseG04L11In009TermId, string>> =
  Object.freeze({
    column: "Una columna es un grupo vertical de valores en una tabla.",
    plot: "Para trazar un punto, ubica primero x y después y.",
    line: "Una línea conecta los puntos que siguen la misma regla.",
    point: "Un punto marca una ubicación exacta en la cuadrícula.",
  });

function PageCompanionPortal({children, targetId}: {
  children: React.ReactNode;
  targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  useEffect(() => {
    if (!targetId) {
      setTarget(null);
      setResolvedId(null);
      return;
    }
    setTarget(document.getElementById(targetId));
    setResolvedId(targetId);
  }, [targetId]);
  if (!targetId) return children;
  if (resolvedId !== targetId) return null;
  return target ? createPortal(children, target) : children;
}

function pointX(x: number) {
  return 46 + x * 34;
}
function pointY(y: number) {
  return 386 - y * 34;
}

function PracticeGraph({lang, state}: {
  lang: "en" | "es";
  state: CourseG04L11In009PracticeState;
}) {
  const ticks = [...Array(11).keys()];
  const completed = state.rows.filter((row) => row.completed);
  const points = completed.map((row) => `${pointX(row.x)},${pointY(row.expectedY)}`)
    .join(" ");
  return (
    <svg aria-label={lang === "es" ? "Puntos trazados" : "Plotted points"}
      className="course-g04-l11-in009-graph" role="img" viewBox="0 0 440 430">
      <rect fill="#fffef2" height="390" rx="18" width="390" x="28" y="18" />
      {ticks.map((tick) => (
        <React.Fragment key={tick}>
          <line className="grid" x1={pointX(tick)} x2={pointX(tick)} y1="46" y2="386" />
          <line className="grid" x1="46" x2="386" y1={pointY(tick)} y2={pointY(tick)} />
          <text className="tick" textAnchor="middle" x={pointX(tick)} y="410">{tick}</text>
          <text className="tick" dominantBaseline="middle" textAnchor="end"
            x="39" y={pointY(tick)}>{tick}</text>
        </React.Fragment>
      ))}
      <line className="axis" x1="46" x2="404" y1="386" y2="386" />
      <line className="axis" x1="46" x2="46" y1="404" y2="28" />
      {state.lineDrawn && completed.length === 5 ?
        <polyline className="answer-line" points={points} /> : null}
      {completed.map((row) => (
        <g className="point" key={row.row}>
          <circle cx={pointX(row.x)} cy={pointY(row.expectedY)} r="7" />
          <text x={pointX(row.x) + 9} y={pointY(row.expectedY) - 9}>
            ({row.x},{row.expectedY})
          </text>
        </g>
      ))}
    </svg>
  );
}

function PracticeCompanion({dispatch, hostFrame, lang, replayLocally, state}: {
  dispatch: React.Dispatch<CourseG04L11In009PracticeEvent>;
  hostFrame: number;
  lang: "en" | "es";
  replayLocally: () => void;
  state: CourseG04L11In009PracticeState;
}) {
  const selectedTerm = getCourseG04L11In009SelectedTerm(state);
  const active = state.phase !== "instruction";
  const label = (termId: CourseG04L11In009TermId, english: string) =>
    lang === "es" ? ES_TERMS[termId] : english;
  return (
    <section aria-label={lang === "es" ? "Práctica de líneas" : "Line practice"}
      className="course-g04-l11-in009-controls"
      data-animation-internal-pedagogical-control-count="10"
      data-draw-line-visible={state.drawLineVisible ? "true" : "false"}
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={state.frame}
      data-source-audio-enabled="false"
      data-source-quiz-stop-frame="407"
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "Traza puntos para formar una línea" :
          "Plot Points to Make a Line"}</strong>
        <p>{lang === "es"
          ? "Completa cada valor de y usando la regla. Luego traza los cinco puntos y dibuja la línea."
          : COURSE_G04_L11_IN_009_INTERACTION_SOURCE.equation === "x + 2 = y"
            ? "Complete each y-value using the rule. Plot all five points, then draw the line."
            : ""}</p>
      </header>
      <div className="course-g04-l11-in009-rule">
        <span>{lang === "es" ? "Regla de la fuente" : "Source rule"}</span>
        <strong>x + 2 = y</strong>
        <small>{lang === "es" ? "y es dos más que x" : "y is two more than x"}</small>
      </div>
      <div aria-label={lang === "es" ? "Términos matemáticos" : "Math terms"}
        className="course-g04-l11-in009-terms" role="group">
        {COURSE_G04_L11_IN_009_TERMS.map((term) => (
          <button aria-pressed={state.selectedTermId === term.id} key={term.id}
            onClick={() => dispatch({type: "select-term", termId: term.id,
              frame: state.frame})} type="button">{label(term.id, term.label)}</button>
        ))}
      </div>
      {selectedTerm ? (
        <div aria-live="polite" className="course-g04-l11-in009-term-panel" role="status">
          <div><strong>{label(selectedTerm.id, selectedTerm.label)}</strong>
            <p>{lang === "es" ? ES_PROMPTS[selectedTerm.id] : selectedTerm.prompt}</p></div>
          <div><button onClick={() => dispatch({type: "close-term"})} type="button">
            {lang === "es" ? "Cerrar" : "Close"}</button>
            <button onClick={() => dispatch({type: "resume", frame: hostFrame})}
              type="button">{lang === "es" ? "Continuar" : "Resume"}</button></div>
        </div>
      ) : null}
      <div className="course-g04-l11-in009-practice-layout">
        <PracticeGraph lang={lang} state={state} />
        <div className="course-g04-l11-in009-table-wrap">
          <table>
            <caption>{lang === "es" ? "Completa los valores de y" : "Complete the y-values"}</caption>
            <thead><tr><th scope="col">x</th><th scope="col">y</th>
              <th scope="col">{lang === "es" ? "Acción" : "Action"}</th></tr></thead>
            <tbody>{state.rows.map((row) => (
              <tr data-completed={row.completed ? "true" : "false"} key={row.row}>
                <th scope="row">{row.x}</th>
                <td><input aria-label={`${lang === "es" ? "Valor y para x" : "y-value for x"} ${row.x}`}
                  disabled={!active || row.completed || state.popupOpen || state.glossaryOpen}
                  inputMode="decimal" onChange={(event) => dispatch({type: "set-input",
                    row: row.row, value: event.target.value})} value={row.input} /></td>
                <td><button data-source-control={`plot${row.row}`}
                  disabled={!active || row.completed || state.popupOpen || state.glossaryOpen}
                  onClick={() => dispatch({type: "plot-row", row: row.row})} type="button">
                  {row.completed ? (lang === "es" ? "Trazado" : "Plotted") :
                    (lang === "es" ? "Trazar punto" : "Plot Point")}</button></td>
              </tr>
            ))}</tbody>
          </table>
          <div className="course-g04-l11-in009-progress">
            <span>{lang === "es" ? "Puntos completos" : "Points complete"}</span>
            <strong>{state.completedCount} / 5</strong>
          </div>
          <button className="draw-line" data-source-control="drawline_btn"
            disabled={!state.drawLineVisible || state.lineDrawn || state.popupOpen ||
              state.glossaryOpen}
            onClick={() => dispatch({type: "draw-line"})} type="button">
            {state.lineDrawn ? (lang === "es" ? "Línea dibujada" : "Line drawn") :
              (lang === "es" ? "Dibujar línea" : "Draw Line")}
          </button>
        </div>
      </div>
      {state.feedback ? (
        <div aria-live={state.popupOpen ? "assertive" : "polite"}
          className={`course-g04-l11-in009-feedback ${state.feedback.kind}`}
          role={state.popupOpen ? "alert" : "status"}>
          <div><strong>{state.feedback.kind === "correct"
            ? (lang === "es" ? "¡Correcto!" : state.feedback.message)
            : state.feedback.kind === "first-wrong"
              ? (lang === "es" ? "¡Inténtalo de nuevo!" : state.feedback.message)
              : state.feedback.message}</strong>
            {state.coachBranch ? <small data-coach-branch={state.coachBranch}>
              {lang === "es" ? "Guía visual silenciosa" : "Muted source coach branch"} {state.coachBranch}
            </small> : null}</div>
          {state.popupOpen ? <button onClick={() => dispatch({type: "close-feedback"})}
            type="button">{lang === "es" ? "Cerrar" : "Close"}</button> : null}
        </div>
      ) : null}
      <div className="course-g04-l11-in009-actions">
        <button onClick={replayLocally} type="button">
          {lang === "es" ? "Repetir la práctica" : "Replay practice"}</button>
      </div>
    </section>
  );
}

export function createCourseG04L11In009LinePracticeCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const frameDomain = props.frameDomain ?? SOURCE_DOMAIN;
    const deterministicCapture = Boolean(props.entryStateSha256);
    const interactionVisible = frameDomain === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !deterministicCapture;
    const [state, dispatch] = useReducer(
      reduceCourseG04L11In009Practice,
      {frame: props.frame, seed: props.seed},
      ({frame, seed}) => createCourseG04L11In009PracticeState(frame, seed),
    );
    useEffect(() => {
      dispatch({type: "synchronize-frame", frame: props.frame});
    }, [props.frame]);
    useEffect(() => {
      if ((props.replay ?? 0) > 0) dispatch({type: "replay", seed: props.seed});
    }, [props.replay, props.seed]);
    const replayLocally = () => {
      dispatch({type: "replay", seed: props.seed});
      props.onReplay?.();
    };
    const sourceFrame = interactionVisible ? state.sourceCanvasFrame : props.frame;
    return (
      <div className="course-g04-l11-in009-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-canvas-build-and-modern-five-row-line-practice"
        data-legacy-course-shell-included="false"
        data-legacy-player-chrome-included="false"
        data-owner-accepted="false"
        data-registered-current-javascript="false"
        data-source-audio-enabled="false"
        data-strict-acceptance-effect="none"
        data-strict-migration-complete="false"
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
          position: "relative", width: "100%"}}>
        <SourceRenderer {...props} frame={sourceFrame} state={undefined} />
        {interactionVisible ? (
          <PageCompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            <PracticeCompanion dispatch={dispatch} hostFrame={props.frame}
              lang={props.uiLanguage ?? props.lang} replayLocally={replayLocally}
              state={state} />
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-in009-controls{background:#f3fbff;border:2px solid #1c69aa;
            border-radius:20px;box-sizing:border-box;color:#15395f;font-family:${UI_FONT};
            margin-top:14px;padding:20px;}
          .course-g04-l11-in009-controls>header span,.course-g04-l11-in009-rule span{
            color:#0966bc;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;
            text-transform:uppercase;}
          .course-g04-l11-in009-controls>header strong{display:block;font-size:clamp(24px,4vw,36px);
            line-height:1.05;margin-top:5px;}.course-g04-l11-in009-controls p{font-family:system-ui,sans-serif;}
          .course-g04-l11-in009-rule{background:#fff;border:2px solid #79afe0;border-radius:16px;
            margin:16px 0;padding:14px 16px;}.course-g04-l11-in009-rule strong{display:block;
            font-size:34px;margin:4px 0;}.course-g04-l11-in009-rule small{font-family:system-ui,sans-serif;}
          .course-g04-l11-in009-terms{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
          .course-g04-l11-in009-terms button,.course-g04-l11-in009-actions button{
            background:#fff;border:2px solid #2b78bd;border-radius:999px;color:#17558f;
            font:900 14px ${UI_FONT};min-height:42px;padding:8px 14px;}
          .course-g04-l11-in009-term-panel,.course-g04-l11-in009-feedback{align-items:center;
            background:#fff7ce;border:2px solid #d28a00;border-radius:16px;display:flex;
            gap:12px;justify-content:space-between;margin:12px 0;padding:14px;}
          .course-g04-l11-in009-term-panel button,.course-g04-l11-in009-feedback button{
            background:#fff;border:2px solid #7a5300;border-radius:12px;font-weight:800;
            margin-left:6px;min-height:40px;padding:7px 12px;}
          .course-g04-l11-in009-practice-layout{display:grid;gap:16px;
            grid-template-columns:minmax(0,1fr) minmax(310px,.9fr);}
          .course-g04-l11-in009-graph{height:auto;width:100%;}.course-g04-l11-in009-graph .grid{
            stroke:#b8d7ee;stroke-width:1}.course-g04-l11-in009-graph .axis{stroke:#183c5f;stroke-width:3}
          .course-g04-l11-in009-graph .tick{fill:#315473;font:10px system-ui,sans-serif}
          .course-g04-l11-in009-graph .point{fill:#e31b23}.course-g04-l11-in009-graph .point text{
            font:700 11px system-ui,sans-serif}.course-g04-l11-in009-graph .answer-line{
            fill:none;stroke:#e31b23;stroke-linecap:round;stroke-width:5}
          .course-g04-l11-in009-table-wrap{background:#fff;border:2px solid #79afe0;
            border-radius:16px;padding:12px;}.course-g04-l11-in009-table-wrap table{border-collapse:collapse;
            width:100%}.course-g04-l11-in009-table-wrap caption{font-size:17px;font-weight:900;
            padding:4px 0 10px}.course-g04-l11-in009-table-wrap td,
          .course-g04-l11-in009-table-wrap th{border-bottom:1px solid #b7d5ef;padding:7px;
            text-align:center}.course-g04-l11-in009-table-wrap input{border:2px solid #5799d3;
            border-radius:9px;box-sizing:border-box;font-size:18px;min-height:42px;text-align:center;
            width:72px}.course-g04-l11-in009-table-wrap button{background:linear-gradient(#fff0a8,#ffc547);
            border:2px solid #a65d00;border-radius:11px;color:#3d3100;font-weight:900;
            min-height:42px;padding:7px 10px}.course-g04-l11-in009-table-wrap button:disabled{opacity:.55}
          .course-g04-l11-in009-progress{display:flex;justify-content:space-between;margin:14px 0;
            padding:0 4px}.course-g04-l11-in009-progress strong{font-size:20px}
          .course-g04-l11-in009-table-wrap .draw-line{font-size:18px;width:100%}
          .course-g04-l11-in009-feedback small{display:block;margin-top:4px}.course-g04-l11-in009-actions{
            display:flex;justify-content:flex-end;margin-top:14px}
          @media(max-width:700px){.course-g04-l11-in009-controls{padding:14px}
            .course-g04-l11-in009-practice-layout{grid-template-columns:1fr}
            .course-g04-l11-in009-controls>header strong{font-size:27px}
            .course-g04-l11-in009-table-wrap td,.course-g04-l11-in009-table-wrap th{padding:5px 3px}
            .course-g04-l11-in009-table-wrap input{width:60px}}
        `}</style>
      </div>
    );
  }
  return Object.freeze({
    Renderer,
    module: candidate.module,
    movie: candidate.movie,
    sourceContract: Object.freeze({
      source: candidate.sourceContract,
      interaction: COURSE_G04_L11_IN_009_INTERACTION_SOURCE,
      authority: COURSE_G04_L11_IN_009_INTERACTION_AUTHORITY,
    }),
  });
}
