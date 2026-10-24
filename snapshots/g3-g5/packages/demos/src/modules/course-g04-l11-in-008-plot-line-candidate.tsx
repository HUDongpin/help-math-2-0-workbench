"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from
  "../contract";
import {COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY,
  COURSE_G04_L11_IN_008_PLAYBACK_SOURCE,
  createCourseG04L11In008PlaybackState, reduceCourseG04L11In008Playback,
  type CourseG04L11In008PlaybackEvent,
  type CourseG04L11In008PlaybackState,
  type CourseG04L11In008VisualPhase} from
  "../timelines/course-g04-l11-in-008-plot-line-playback";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-129";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const PHASE_LABELS: Readonly<Record<CourseG04L11In008VisualPhase,
Readonly<{en: string; es: string}>>> = Object.freeze({
  "initial-grid": {en: "Start with the coordinate grid", es: "Comienza con la cuadrícula"},
  "plot-and-connect-first-five": {en: "Plot and connect the first five points",
    es: "Traza y conecta los primeros cinco puntos"},
  "table-scaffold": {en: "Build the x and y table", es: "Construye la tabla de x e y"},
  "table-values": {en: "Record the coordinate pattern", es: "Registra el patrón de coordenadas"},
  equation: {en: "Write the rule x + 1 = y", es: "Escribe la regla x + 1 = y"},
  "extend-pattern": {en: "Extend the line and table", es: "Extiende la línea y la tabla"},
  "final-source-visual": {en: "Complete the line through (9,10)",
    es: "Completa la línea hasta (9,10)"},
});

function CompanionPortal({children, targetId}: {children: React.ReactNode;
  targetId?: string}) {
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

function PlotLineCompanion({dispatch, hostFrame, lang, replayLocally, state}: {
  dispatch: React.Dispatch<CourseG04L11In008PlaybackEvent>;
  hostFrame: number; lang: "en" | "es"; replayLocally: () => void;
  state: CourseG04L11In008PlaybackState;
}) {
  const phase = PHASE_LABELS[state.phase][lang];
  const progress = Math.round((state.frame / 1_478) * 100);
  return <section aria-label={lang === "es" ? "Patrón de puntos" : "Plot points pattern"}
    className="course-g04-l11-in008-companion"
    data-animation-internal-pedagogical-control-count="0"
    data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false"
    data-modern-lesson-playback-control-count="2"
    data-source-audio-enabled="false">
    <header><span>HELP Math 2.0</span><strong>{lang === "es"
      ? "Traza puntos para formar una línea" : "Plot Points to Make a Line"}</strong>
      <p>{lang === "es" ? "Cada valor de y es uno más que x."
        : "Each y-value is one more than its x-value."}</p></header>
    <div className="course-g04-l11-in008-rule">
      <div><span>{lang === "es" ? "Regla de la fuente" : "Source rule"}</span>
        <strong>x + 1 = y</strong><p>{phase}</p></div>
      <div aria-label={lang === "es" ? "Progreso" : "Progress"}>
        <span>{lang === "es" ? "Fotograma" : "Frame"}</span>
        <strong>{state.frame.toLocaleString("en-US")} / 1,478</strong>
        <progress max={1_478} value={state.frame}>{progress}%</progress>
      </div>
    </div>
    <div className="course-g04-l11-in008-points">
      <div><strong>{lang === "es" ? "Puntos trazados" : "Plotted points"}</strong>
        <p>{COURSE_G04_L11_IN_008_PLAYBACK_SOURCE.plottedPoints.map(
          (point) => point.orderedPair).join(" · ")}</p></div>
      <table aria-label={lang === "es" ? "Filas de la tabla de la fuente" :
        "Source table rows"}><thead><tr><th scope="col">x</th><th scope="col">y</th>
        </tr></thead><tbody>{COURSE_G04_L11_IN_008_PLAYBACK_SOURCE.sourceTableRows
          .map((point) => <tr key={point.orderedPair}><td>{point.x}</td><td>{point.y}</td>
          </tr>)}</tbody></table>
    </div>
    <div className="course-g04-l11-in008-controls" role="group"
      aria-label={lang === "es" ? "Controles modernos de la lección" :
        "Modern Lesson playback controls"}>
      {state.playing ? <button onClick={() => dispatch({type: "pause"})} type="button">
        {lang === "es" ? "Pausar" : "Pause"}</button> : <button
        onClick={() => dispatch({type: "resume", frame: hostFrame})} type="button">
        {lang === "es" ? "Continuar" : "Resume"}</button>}
      <button onClick={replayLocally} type="button">{lang === "es" ? "Repetir" : "Replay"}</button>
    </div>
  </section>;
}

export function createCourseG04L11In008PlotLineCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>,
) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const domain = props.frameDomain ?? SOURCE_DOMAIN;
    const deterministicCapture = Boolean(props.entryStateSha256);
    const companionVisible = domain === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !deterministicCapture;
    const [state, dispatch] = useReducer(reduceCourseG04L11In008Playback,
      props.frame, createCourseG04L11In008PlaybackState);
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-in008-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="source-canvas-sequence-and-modern-lesson-playback"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <SourceRenderer {...props} frame={companionVisible ? state.frame : props.frame}
        state={undefined} />
      {companionVisible ? <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>
        <PlotLineCompanion dispatch={dispatch} hostFrame={props.frame}
          lang={props.uiLanguage ?? props.lang} replayLocally={replayLocally}
          state={state} /></CompanionPortal> : null}
      <style>{`
        .course-g04-l11-in008-candidate [data-source-replay-parity="unvalidated"]{display:none}
        .course-g04-l11-in008-companion{background:linear-gradient(145deg,#f5fbff,#e2f4ff);border:2px solid #2168a7;border-radius:18px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px;width:100%}
        .course-g04-l11-in008-companion header span,.course-g04-l11-in008-rule span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        .course-g04-l11-in008-companion header strong{display:block;font-size:clamp(23px,4vw,32px);line-height:1.1;margin-top:3px}.course-g04-l11-in008-companion p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0}
        .course-g04-l11-in008-rule,.course-g04-l11-in008-points{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}.course-g04-l11-in008-rule>div,.course-g04-l11-in008-points>div,.course-g04-l11-in008-points table{background:white;border:2px solid #75a6d5;border-radius:14px;padding:12px}.course-g04-l11-in008-rule strong{display:block;font-size:clamp(24px,5vw,38px);margin:4px 0}.course-g04-l11-in008-rule progress{accent-color:#0a61bc;width:100%}
        .course-g04-l11-in008-points table{border-collapse:separate;border-spacing:0;font-family:system-ui,sans-serif;text-align:center;width:100%}.course-g04-l11-in008-points th,.course-g04-l11-in008-points td{border-bottom:1px solid #b7d2ea;padding:3px 8px}.course-g04-l11-in008-points tbody tr:last-child td{border-bottom:0}
        .course-g04-l11-in008-controls{display:flex;flex-wrap:wrap;gap:10px}.course-g04-l11-in008-controls button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:48px;padding:9px 18px}.course-g04-l11-in008-controls button:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
        @media(max-width:600px){.course-g04-l11-in008-rule,.course-g04-l11-in008-points{grid-template-columns:1fr}.course-g04-l11-in008-controls{display:grid;grid-template-columns:1fr 1fr}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-sequence-and-modern-lesson-playback-functional-candidate",
    sourceInteraction: COURSE_G04_L11_IN_008_PLAYBACK_SOURCE,
    interactionAuthority: COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY,
    sourceEquationDisplayed: true, plottedPointCountDisplayed: 9,
    sourceTableRowCountDisplayed: 7, sourceAnimationInternalControlCount: 0,
    modernLessonPlaybackControlsProvided: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
