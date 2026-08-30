"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_IN_005_POINTS} from
  "../source-static/g4-l11/course-g04-l11-in-005-static";
import {COURSE_G04_L11_IN_005_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_005_TERMS, createCourseG04L11In005HoverState,
  getCourseG04L11In005Point, reduceCourseG04L11In005Hover,
  type CourseG04L11In005HoverEvent, type CourseG04L11In005HoverState,
  type CourseG04L11In005TermId} from
  "../timelines/course-g04-l11-in-005-point-hover-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_DOMAIN = "sprite-137";
const SOURCE_SCENARIO = "source-static-frame";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const SPANISH_TERMS: Readonly<Record<CourseG04L11In005TermId, string>> =
  Object.freeze({point: "Punto", coordinate: "Coordenada",
    "coordinate-grid": "Cuadrícula de coordenadas"});
const SPANISH_PROMPTS: Readonly<Record<CourseG04L11In005TermId, string>> =
  Object.freeze({point: "Un punto marca una ubicación exacta en la cuadrícula.",
    coordinate: "Una coordenada indica la posición de un punto sobre un eje.",
    "coordinate-grid":
      "Una cuadrícula de coordenadas usa los ejes x e y para localizar puntos."});

function CompanionPortal({children, targetId}: {children: React.ReactNode;
  targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(targetId ? document.getElementById(targetId) : null); },
    [targetId]);
  if (!targetId) return children;
  return target ? createPortal(children, target) : children;
}
function position(value: number) { return 62 + value * 42; }

function PointPractice({dispatch, lang, state}: {dispatch:
  React.Dispatch<CourseG04L11In005HoverEvent>; lang: "en" | "es";
  state: CourseG04L11In005HoverState}) {
  const select = (label: (typeof COURSE_G04_L11_IN_005_POINTS)[number]["label"]) =>
    dispatch({type: "reveal-point", label});
  return <section aria-label={lang === "es" ? "Práctica de coordenadas" :
    "Point-coordinate practice"} className="course-g04-l11-in005-practice"
    data-source-hover-point-count="6" data-source-hover-stop-frame="647">
    <header><span>{lang === "es" ? "Explora la cuadrícula" : "Explore the grid"}</span>
      <strong>{lang === "es" ? "Nombra las coordenadas" : "Name the coordinates"}</strong>
      <p>{lang === "es" ? "Pasa el puntero, toca o enfoca cada punto para ver sus coordenadas." :
        "Hover over, tap, or focus each point to see its coordinates."}</p></header>
    <div className="course-g04-l11-in005-grid-layout">
      <svg aria-label={lang === "es" ? "Puntos A a F" : "Points A through F"}
        role="group" viewBox="0 0 544 544">
        <rect fill="#fffde8" height="462" rx="18" width="462" x="40" y="40" />
        {[...Array(11).keys()].map((value) => <React.Fragment key={value}>
          <line className="minor" x1={position(value)} x2={position(value)} y1="62" y2="482" />
          <line className="minor" x1="62" x2="482" y1={position(10 - value)}
            y2={position(10 - value)} />
          <text className="tick" textAnchor="middle" x={position(value)} y="510">{value}</text>
          <text className="tick" dominantBaseline="middle" textAnchor="end" x="49"
            y={position(10 - value)}>{value}</text>
        </React.Fragment>)}
        <line className="axis" x1="62" x2="502" y1="482" y2="482" />
        <line className="axis" x1="62" x2="62" y1="502" y2="42" />
        <path className="arrow" d="M502 482l-13-8v16z" />
        <path className="arrow" d="M62 42l-8 13h16z" />
        <text className="axis-label" x="490" y="532">x</text>
        <text className="axis-label" x="23" y="52">y</text>
        {COURSE_G04_L11_IN_005_POINTS.map((point) => <g key={point.label}
          className={state.selectedPoint === point.label ? "point selected" : "point"}
          data-coordinate={`${point.x},${point.y}`} data-point-label={point.label}
          onClick={() => select(point.label)} onFocus={() => select(point.label)}
          onMouseEnter={() => select(point.label)} role="button" tabIndex={0}
          aria-label={lang === "es" ?
            `Punto ${point.label}, mostrar coordenadas` :
            `Point ${point.label}, reveal coordinates`}>
          <circle cx={position(point.x)} cy={position(10 - point.y)} r="18" />
          <text x={position(point.x) + 20} y={position(10 - point.y) - 12}>{point.label}</text>
        </g>)}
      </svg>
      <table><caption>{lang === "es" ? "Coordenadas reveladas" : "Revealed coordinates"}</caption>
        <thead><tr><th>{lang === "es" ? "Punto" : "Point"}</th>
          <th>{lang === "es" ? "Coordenadas" : "Coordinates"}</th></tr></thead>
        <tbody>{COURSE_G04_L11_IN_005_POINTS.map((point) => {
          const revealed = state.revealedPoints.includes(point.label);
          return <tr data-revealed={revealed ? "true" : "false"} key={point.label}>
            <th>{point.label}</th><td>{revealed ? `(${point.x},${point.y})` : "(  ,  )"}</td>
          </tr>;
        })}</tbody></table>
    </div>
    <p aria-live="polite" className="course-g04-l11-in005-announcement" role="status">
      {state.selectedPoint ? (() => { const point = getCourseG04L11In005Point(state.selectedPoint);
        return lang === "es" ? `El punto ${point?.label} está en (${point?.x},${point?.y}).` :
          `Point ${point?.label} is at (${point?.x},${point?.y}).`; })() :
        (lang === "es" ? "Todavía no se ha revelado ningún punto." : "No point revealed yet.")}
    </p>
  </section>;
}

function Controls({dispatch, lang, replay, state}: {dispatch:
  React.Dispatch<CourseG04L11In005HoverEvent>; lang: "en" | "es";
  replay: () => void; state: CourseG04L11In005HoverState}) {
  const selected = state.selectedTermId ? COURSE_G04_L11_IN_005_TERMS.find(
    (term) => term.id === state.selectedTermId) : null;
  return <section className="course-g04-l11-in005-controls"
    data-animation-internal-control-count="4" data-glossary-control-count="3"
    data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false"
    data-local-visual-frame={state.frame} data-local-visual-playing={state.playing}>
    <header><span>HELP Math 2.0</span>
      <strong>{lang === "es" ? "Nombra puntos en una cuadrícula" :
        "Name Points on a Coordinate Grid"}</strong>
      <p>{lang === "es" ? "Explora los puntos A–F y observa el orden x, y." :
        "Explore points A–F and notice the x, y order."}</p></header>
    <div className="course-g04-l11-in005-terms" role="group">
      {COURSE_G04_L11_IN_005_TERMS.map((term) => <button
        aria-pressed={state.selectedTermId === term.id}
        data-source-button-object-id={term.sourceButtonObjectId} key={term.id}
        onClick={() => dispatch({type: "select-term", termId: term.id})} type="button">
        {lang === "es" ? SPANISH_TERMS[term.id] : term.label}</button>)}
    </div>
    {selected ? <div aria-live="polite" className="course-g04-l11-in005-term" role="status">
      <div><strong>{lang === "es" ? SPANISH_TERMS[selected.id] : selected.label}</strong>
        <p>{lang === "es" ? SPANISH_PROMPTS[selected.id] : selected.prompt}</p></div>
      <button onClick={() => dispatch({type: "close-term"})} type="button">
        {lang === "es" ? "Cerrar" : "Close"}</button>
    </div> : null}
    <button className="course-g04-l11-in005-replay" onClick={replay} type="button">
      {lang === "es" ? "Repetir la lección" : "Replay lesson"}</button>
  </section>;
}

export function createCourseG04L11In005PointHoverCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11In005Hover, props.frame,
      createCourseG04L11In005HoverState);
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); }, [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); }, [props.replay]);
    const replay = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    const practice = interactionVisible && state.phase === "hover-practice";
    const lang = props.uiLanguage ?? props.lang;
    return <div className="course-g04-l11-in005-candidate"
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
        .course-g04-l11-in005-practice{background:linear-gradient(145deg,#d9efff,#b9dcf7);border:2px solid #2168a7;border-radius:20px;box-sizing:border-box;color:#17395f;font-family:${UI_FONT};padding:20px}
        .course-g04-l11-in005-practice header{text-align:center}.course-g04-l11-in005-practice header>span,.course-g04-l11-in005-controls header>span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        .course-g04-l11-in005-practice header>strong,.course-g04-l11-in005-controls header>strong{display:block;font-size:clamp(24px,5vw,36px);margin-top:4px}.course-g04-l11-in005-practice p,.course-g04-l11-in005-controls p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0}
        .course-g04-l11-in005-grid-layout{align-items:center;display:grid;gap:16px;grid-template-columns:minmax(0,1.4fr) minmax(210px,.6fr);margin-top:12px}.course-g04-l11-in005-grid-layout svg{height:auto;width:100%}.course-g04-l11-in005-grid-layout .minor{stroke:#d6c97a;stroke-width:1.5}.course-g04-l11-in005-grid-layout .axis{stroke:#17395f;stroke-width:4}.course-g04-l11-in005-grid-layout .arrow{fill:#17395f}.course-g04-l11-in005-grid-layout .tick{fill:#17395f;font:700 15px system-ui,sans-serif}.course-g04-l11-in005-grid-layout .axis-label{fill:#17395f;font:900 24px ${UI_FONT}}
        .course-g04-l11-in005-grid-layout .point{cursor:pointer;outline:none}.course-g04-l11-in005-grid-layout .point circle{fill:#e84c3d;stroke:white;stroke-width:4}.course-g04-l11-in005-grid-layout .point text{fill:#8b210e;font:900 20px ${UI_FONT}}.course-g04-l11-in005-grid-layout .point:hover circle,.course-g04-l11-in005-grid-layout .point:focus circle,.course-g04-l11-in005-grid-layout .point.selected circle{fill:#0758ba;stroke:#ffdc4c;stroke-width:6}
        .course-g04-l11-in005-grid-layout table{background:white;border:2px solid #75a6d5;border-collapse:separate;border-radius:14px;border-spacing:0;font-family:system-ui,sans-serif;overflow:hidden;text-align:center;width:100%}.course-g04-l11-in005-grid-layout caption{font-weight:900;margin-bottom:6px}.course-g04-l11-in005-grid-layout th,.course-g04-l11-in005-grid-layout td{border-bottom:1px solid #b7d2ea;padding:8px}.course-g04-l11-in005-grid-layout thead{background:#d9ea69}.course-g04-l11-in005-grid-layout tbody tr[data-revealed=true] td{color:#9a280b;font-weight:900}.course-g04-l11-in005-announcement{background:white;border:2px solid #75a6d5;border-radius:12px;font-weight:800;padding:10px;text-align:center}
        .course-g04-l11-in005-controls{background:linear-gradient(145deg,#f5fbff,#e2f4ff);border:2px solid #2168a7;border-radius:18px;color:#17395f;display:grid;font-family:${UI_FONT};gap:13px;margin-top:12px;padding:16px}.course-g04-l11-in005-terms{display:flex;flex-wrap:wrap;gap:8px}.course-g04-l11-in005-controls button{background:white;border:2px solid #2168a7;border-radius:12px;color:#17395f;cursor:pointer;font:800 15px system-ui,sans-serif;min-height:44px;padding:8px 12px}.course-g04-l11-in005-controls button[aria-pressed=true]{background:#17395f;color:white}.course-g04-l11-in005-term{align-items:center;background:#fff7c8;border:2px solid #9a5d00;border-radius:14px;display:flex;gap:12px;justify-content:space-between;padding:12px}.course-g04-l11-in005-replay{justify-self:start}
        @media(max-width:620px){.course-g04-l11-in005-practice{padding:10px}.course-g04-l11-in005-grid-layout{grid-template-columns:1fr}.course-g04-l11-in005-term{align-items:stretch;flex-direction:column}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-instruction-and-modern-six-point-hover-functional-candidate",
    interactionAuthority: COURSE_G04_L11_IN_005_INTERACTION_AUTHORITY,
    sourcePointCoordinatesPreserved: true, sourcePointCountPreserved: 6,
    sourceGlossaryControlCountPreserved: 3,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    movie: candidate.movie, sourceContract,
    interactionAuthority: COURSE_G04_L11_IN_005_INTERACTION_AUTHORITY});
}
