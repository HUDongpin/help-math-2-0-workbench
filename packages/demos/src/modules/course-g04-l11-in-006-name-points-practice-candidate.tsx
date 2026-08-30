"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_IN_006_POINTS} from
  "../source-static/g4-l11/course-g04-l11-in-006-static";
import {COURSE_G04_L11_IN_006_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_006_TERMS, createCourseG04L11In006PracticeState,
  reduceCourseG04L11In006Practice, type CourseG04L11In006PracticeEvent,
  type CourseG04L11In006PracticeState, type CourseG04L11In006TermId} from
  "../timelines/course-g04-l11-in-006-name-points-practice-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_DOMAIN = "sprite-137";
const SOURCE_SCENARIO = "source-static-frame";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const SPANISH_TERMS: Readonly<Record<CourseG04L11In006TermId, string>> =
  Object.freeze({point: "Punto", "coordinate-grid": "Cuadrícula de coordenadas",
    "ordered-pair": "Par ordenado", number: "Número",
    "x-coordinate": "Coordenada x", "y-coordinate": "Coordenada y"});
const SPANISH_PROMPTS: Readonly<Record<CourseG04L11In006TermId, string>> =
  Object.freeze({point: "Un punto marca una ubicación exacta en la cuadrícula.",
    "coordinate-grid": "Una cuadrícula usa los ejes x e y para localizar puntos.",
    "ordered-pair": "Un par ordenado nombra un punto como (x, y).",
    number: "Un número indica cuánto avanzar sobre un eje.",
    "x-coordinate": "La coordenada x es el primer número del par ordenado.",
    "y-coordinate": "La coordenada y es el segundo número del par ordenado."});

function CompanionPortal({children, targetId}: {children: React.ReactNode;
  targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(targetId ? document.getElementById(targetId) : null); },
    [targetId]);
  if (!targetId) return children;
  return target ? createPortal(children, target) : children;
}
function position(value: number) { return 60 + value * 39; }

function Feedback({dispatch, lang, state}: {dispatch:
  React.Dispatch<CourseG04L11In006PracticeEvent>; lang: "en" | "es";
  state: CourseG04L11In006PracticeState}) {
  if (state.feedback === "none") return null;
  const text = state.feedback === "correct" ? (lang === "es" ? "¡Correcto!" : "Correct!!!") :
    state.feedback === "first-wrong" ? (lang === "es" ? "¡Ups! Inténtalo otra vez" :
      "Oops! Try again") : (lang === "es" ?
        `La respuesta del punto ${state.feedbackPoint} se mostró en la tabla.` :
        `The answer for point ${state.feedbackPoint} is now shown in the table.`);
  return <div aria-live="assertive" className={`course-g04-l11-in006-feedback ${state.feedback}`}
    data-feedback-state={state.feedback} role="alert">
    <strong>{text}</strong>
    <button onClick={() => dispatch({type: "dismiss-feedback"})} type="button">
      {lang === "es" ? "Cerrar" : "Close"}</button>
  </div>;
}

function PointPractice({dispatch, lang, state}: {dispatch:
  React.Dispatch<CourseG04L11In006PracticeEvent>; lang: "en" | "es";
  state: CourseG04L11In006PracticeState}) {
  const selected = state.selectedPoint;
  return <section aria-label={lang === "es" ? "Práctica para nombrar puntos" :
    "Name points practice"} className="course-g04-l11-in006-practice"
    data-source-coordinate-field-count="8" data-source-practice-point-count="4"
    data-source-practice-stop-frame="275">
    <header><span>{lang === "es" ? "Cuadrícula de coordenadas" : "Coordinate grid"}</span>
      <strong>{lang === "es" ? "Nombra los puntos" : "Name the points"}</strong>
      <p>{lang === "es" ?
        "Selecciona un punto, escribe su par ordenado y pulsa Listo. Después usa Borrar para intentar otro punto." :
        "Select a point, type its ordered pair, and choose Done. Then use Clear to try another point."}</p>
    </header>
    <div className="course-g04-l11-in006-grid-layout">
      <svg aria-label={lang === "es" ? "Puntos A a D" : "Points A through D"}
        role="group" viewBox="0 0 520 520">
        <rect fill="#fffde8" height="430" rx="18" width="430" x="42" y="40" />
        {[...Array(11).keys()].map((value) => <React.Fragment key={value}>
          <line className="minor" x1={position(value)} x2={position(value)} y1="60" y2="450" />
          <line className="minor" x1="60" x2="450" y1={position(10 - value)}
            y2={position(10 - value)} />
          <text className="tick" textAnchor="middle" x={position(value)} y="480">{value}</text>
          <text className="tick" dominantBaseline="middle" textAnchor="end" x="49"
            y={position(10 - value)}>{value}</text>
        </React.Fragment>)}
        <line className="axis" x1="60" x2="473" y1="450" y2="450" />
        <line className="axis" x1="60" x2="60" y1="470" y2="38" />
        <path className="arrow" d="M473 450l-13-8v16z" />
        <path className="arrow" d="M60 38l-8 13h16z" />
        <text className="axis-label" x="460" y="505">x</text>
        <text className="axis-label" x="23" y="48">y</text>
        {COURSE_G04_L11_IN_006_POINTS.map((point) => <g key={point.label}
          aria-label={lang === "es" ? `Seleccionar punto ${point.label}` :
            `Select point ${point.label}`}
          aria-pressed={selected === point.label}
          className={selected === point.label ? "point selected" : "point"}
          data-coordinate={`${point.x},${point.y}`} data-point-label={point.label}
          onClick={() => dispatch({type: "select-point", label: point.label})}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") {
            event.preventDefault(); dispatch({type: "select-point", label: point.label});
          } }} role="button" tabIndex={state.controlsEnabled ? 0 : -1}>
          <circle cx={position(point.x)} cy={position(10 - point.y)} r="17" />
          <text x={position(point.x) + 18} y={position(10 - point.y) - 12}>{point.label}</text>
        </g>)}
      </svg>
      <div className="course-g04-l11-in006-table-wrap">
        <table><caption>{lang === "es" ? "Escribe las coordenadas" : "Enter coordinates"}</caption>
          <thead><tr><th>{lang === "es" ? "Punto" : "Point"}</th>
            <th>{lang === "es" ? "Par ordenado" : "Ordered pair"}</th></tr></thead>
          <tbody>{COURSE_G04_L11_IN_006_POINTS.map((point) =>
            <tr data-selected={selected === point.label ? "true" : "false"} key={point.label}>
              <th><button aria-pressed={selected === point.label}
                data-table-point={point.label} disabled={!state.controlsEnabled}
                onClick={() => dispatch({type: "select-point", label: point.label})}
                type="button">{point.label}</button></th>
              <td><span aria-hidden="true">(</span><input aria-label={lang === "es" ?
                `Coordenada x del punto ${point.label}` : `Point ${point.label} x-coordinate`}
                data-coordinate-axis="x" data-coordinate-field={`${point.label.toLowerCase()}1`}
                disabled={!state.controlsEnabled} inputMode="numeric" maxLength={8}
                onChange={(event) => dispatch({type: "update-field", label: point.label,
                  axis: "x", value: event.currentTarget.value})}
                value={state.fields[point.label].x} /><span aria-hidden="true">,</span>
                <input aria-label={lang === "es" ? `Coordenada y del punto ${point.label}` :
                  `Point ${point.label} y-coordinate`} data-coordinate-axis="y"
                data-coordinate-field={`${point.label.toLowerCase()}2`}
                disabled={!state.controlsEnabled} inputMode="numeric" maxLength={8}
                onChange={(event) => dispatch({type: "update-field", label: point.label,
                  axis: "y", value: event.currentTarget.value})}
                value={state.fields[point.label].y} /><span aria-hidden="true">)</span></td>
            </tr>)}</tbody>
        </table>
        <div className="course-g04-l11-in006-actions">
          <button className="done" disabled={!selected || !state.controlsEnabled}
            onClick={() => dispatch({type: "submit"})} type="button">
            {lang === "es" ? "Listo" : "Done"}</button>
          <button className="clear" disabled={!state.controlsEnabled}
            onClick={() => dispatch({type: "clear"})} type="button">
            {lang === "es" ? "Borrar" : "Clear button"}</button>
        </div>
      </div>
    </div>
    <p aria-live="polite" className="course-g04-l11-in006-announcement" role="status">
      {selected ? (lang === "es" ? `Punto ${selected} seleccionado.` :
        `Point ${selected} selected. Enter its x-coordinate first and y-coordinate second.`) :
        (lang === "es" ? "Selecciona un punto para comenzar." : "Select a point to begin.")}
    </p>
    <Feedback dispatch={dispatch} lang={lang} state={state} />
  </section>;
}

function Controls({dispatch, lang, replay, state}: {dispatch:
  React.Dispatch<CourseG04L11In006PracticeEvent>; lang: "en" | "es";
  replay: () => void; state: CourseG04L11In006PracticeState}) {
  const selected = state.selectedTermId ? COURSE_G04_L11_IN_006_TERMS.find(
    (term) => term.id === state.selectedTermId) : null;
  return <section className="course-g04-l11-in006-controls"
    data-animation-internal-control-count="9" data-glossary-control-count="6"
    data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
    data-local-visual-frame={state.frame} data-local-visual-playing={state.playing}>
    <header><span>HELP Math 2.0</span>
      <strong>{lang === "es" ? "Nombra puntos en una cuadrícula" :
        "Name Points on a Coordinate Grid"}</strong>
      <p>{lang === "es" ? "Usa las palabras matemáticas cuando necesites ayuda." :
        "Use the math words whenever you need a reminder."}</p></header>
    <div className="course-g04-l11-in006-terms" role="group">
      {COURSE_G04_L11_IN_006_TERMS.map((term) => <button
        aria-pressed={state.selectedTermId === term.id}
        data-source-button-object-id={term.sourceButtonObjectId} key={term.id}
        onClick={() => dispatch({type: "select-term", termId: term.id})} type="button">
        {lang === "es" ? SPANISH_TERMS[term.id] : term.label}</button>)}</div>
    {selected ? <div aria-live="polite" className="course-g04-l11-in006-term" role="status">
      <div><strong>{lang === "es" ? SPANISH_TERMS[selected.id] : selected.label}</strong>
        <p>{lang === "es" ? SPANISH_PROMPTS[selected.id] : selected.prompt}</p></div>
      <button onClick={() => dispatch({type: "close-term"})} type="button">
        {lang === "es" ? "Cerrar" : "Close"}</button></div> : null}
    <button className="course-g04-l11-in006-replay" onClick={replay} type="button">
      {lang === "es" ? "Repetir la lección" : "Replay lesson"}</button>
  </section>;
}

export function createCourseG04L11In006NamePointsPracticeCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11In006Practice, props.frame,
      createCourseG04L11In006PracticeState);
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); }, [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); }, [props.replay]);
    const replay = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    const practice = interactionVisible && state.phase === "name-points-practice";
    const lang = props.uiLanguage ?? props.lang;
    return <div className="course-g04-l11-in006-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-registered-current-javascript="false" data-source-audio-enabled="false"
      data-strict-migration-complete="false" data-owner-accepted="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width, width: "100%"}}>
      {practice ? <PointPractice dispatch={dispatch} lang={lang} state={state} /> :
        <SourceRenderer {...props} frame={interactionVisible ? state.frame : props.frame}
          state={undefined} />}
      {interactionVisible ? <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
        <Controls dispatch={dispatch} lang={lang} replay={replay} state={state} />
      </CompanionPortal> : null}
      <style>{`
        .course-g04-l11-in006-practice{background:linear-gradient(145deg,#dff2ff,#c1e5ff);border:2px solid #2168a7;border-radius:20px;box-sizing:border-box;color:#17395f;font-family:${UI_FONT};padding:20px;position:relative}
        .course-g04-l11-in006-practice header{text-align:center}.course-g04-l11-in006-practice header>span,.course-g04-l11-in006-controls header>span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-in006-practice header>strong,.course-g04-l11-in006-controls header>strong{display:block;font-size:clamp(24px,5vw,36px);margin-top:4px}.course-g04-l11-in006-practice p,.course-g04-l11-in006-controls p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0}
        .course-g04-l11-in006-grid-layout{align-items:center;display:grid;gap:16px;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);margin-top:12px}.course-g04-l11-in006-grid-layout svg{height:auto;width:100%}.course-g04-l11-in006-grid-layout .minor{stroke:#d6c97a;stroke-width:1.4}.course-g04-l11-in006-grid-layout .axis{stroke:#17395f;stroke-width:4}.course-g04-l11-in006-grid-layout .arrow{fill:#17395f}.course-g04-l11-in006-grid-layout .tick{fill:#17395f;font:700 14px system-ui,sans-serif}.course-g04-l11-in006-grid-layout .axis-label{fill:#17395f;font:900 23px ${UI_FONT}}.course-g04-l11-in006-grid-layout .point{cursor:pointer;outline:none}.course-g04-l11-in006-grid-layout .point circle{fill:#2949df;stroke:white;stroke-width:4}.course-g04-l11-in006-grid-layout .point text{fill:#17395f;font:900 20px ${UI_FONT}}.course-g04-l11-in006-grid-layout .point:focus circle,.course-g04-l11-in006-grid-layout .point:hover circle,.course-g04-l11-in006-grid-layout .point.selected circle{fill:#e84c3d;stroke:#ffdc4c;stroke-width:7}
        .course-g04-l11-in006-table-wrap{display:grid;gap:12px}.course-g04-l11-in006-table-wrap table{background:white;border:2px solid #75a6d5;border-collapse:separate;border-radius:14px;border-spacing:0;font-family:system-ui,sans-serif;overflow:hidden;text-align:center;width:100%}.course-g04-l11-in006-table-wrap caption{font-weight:900;margin-bottom:6px}.course-g04-l11-in006-table-wrap th,.course-g04-l11-in006-table-wrap td{border-bottom:1px solid #b7d2ea;padding:7px}.course-g04-l11-in006-table-wrap thead{background:#d9ea69}.course-g04-l11-in006-table-wrap tr[data-selected=true]{background:#fff7c8}.course-g04-l11-in006-table-wrap th button{background:#edf6ff;border:2px solid #2168a7;border-radius:50%;color:#17395f;font-weight:900;height:38px;width:38px}.course-g04-l11-in006-table-wrap th button[aria-pressed=true]{background:#17395f;color:white}.course-g04-l11-in006-table-wrap input{border:2px solid #75a6d5;border-radius:8px;font:800 18px system-ui,sans-serif;margin:0 4px;padding:5px;text-align:center;width:50px}.course-g04-l11-in006-actions{display:flex;gap:10px;justify-content:center}.course-g04-l11-in006-actions button{border:2px solid #765d00;border-radius:12px;cursor:pointer;font:900 17px ${UI_FONT};min-height:46px;padding:8px 16px}.course-g04-l11-in006-actions .done{background:#ffe04c}.course-g04-l11-in006-actions .clear{background:#fff7c8}.course-g04-l11-in006-actions button:disabled{cursor:not-allowed;opacity:.45}.course-g04-l11-in006-announcement{background:white;border:2px solid #75a6d5;border-radius:12px;font-weight:800;padding:10px;text-align:center}
        .course-g04-l11-in006-feedback{align-items:center;background:#fff7c8;border:3px solid #9a5d00;border-radius:18px;box-shadow:0 12px 30px #17395f44;display:flex;gap:16px;justify-content:space-between;left:50%;max-width:90%;padding:18px;position:absolute;top:50%;transform:translate(-50%,-50%);width:440px;z-index:5}.course-g04-l11-in006-feedback.correct{background:#e8b7ff;border-color:#7b1fa2}.course-g04-l11-in006-feedback strong{font-size:clamp(22px,5vw,35px)}.course-g04-l11-in006-feedback button{background:white;border:2px solid currentColor;border-radius:10px;min-height:44px;padding:8px 12px}
        .course-g04-l11-in006-controls{background:linear-gradient(145deg,#f5fbff,#e2f4ff);border:2px solid #2168a7;border-radius:18px;color:#17395f;display:grid;font-family:${UI_FONT};gap:13px;margin-top:12px;padding:16px}.course-g04-l11-in006-terms{display:flex;flex-wrap:wrap;gap:8px}.course-g04-l11-in006-controls button{background:white;border:2px solid #2168a7;border-radius:12px;color:#17395f;cursor:pointer;font:800 15px system-ui,sans-serif;min-height:44px;padding:8px 12px}.course-g04-l11-in006-controls button[aria-pressed=true]{background:#17395f;color:white}.course-g04-l11-in006-term{align-items:center;background:#fff7c8;border:2px solid #9a5d00;border-radius:14px;display:flex;gap:12px;justify-content:space-between;padding:12px}.course-g04-l11-in006-replay{justify-self:start}
        @media(max-width:650px){.course-g04-l11-in006-practice{padding:10px}.course-g04-l11-in006-grid-layout{grid-template-columns:1fr}.course-g04-l11-in006-term,.course-g04-l11-in006-feedback{align-items:stretch;flex-direction:column}.course-g04-l11-in006-feedback{width:86%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-instruction-and-modern-four-point-name-practice-functional-candidate",
    interactionAuthority: COURSE_G04_L11_IN_006_INTERACTION_AUTHORITY,
    sourcePointCoordinatesPreserved: true, sourcePointCountPreserved: 4,
    sourceEditableCoordinateFieldCountPreserved: 8,
    sourceGlossaryControlCountPreserved: 6,
    sourceDoneClearAndTwoStepRemediationPreserved: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    movie: candidate.movie, sourceContract,
    interactionAuthority: COURSE_G04_L11_IN_006_INTERACTION_AUTHORITY});
}
