"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_GS_002_DIRECTIONS, COURSE_G04_L11_GS_002_LEVELS} from
  "../source-static/g4-l11/course-g04-l11-gs-002-static";
import {COURSE_G04_L11_GS_002_INTERACTION_AUTHORITY,
  COURSE_G04_L11_GS_002_INTERACTION_SOURCE, createCourseG04L11Gs002State,
  reduceCourseG04L11Gs002State, type CourseG04L11Gs002Event,
  type CourseG04L11Gs002State} from
  "../timelines/course-g04-l11-gs-002-game-directions-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-227";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

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

function GameDirectionsControls({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11Gs002State;
  dispatch: React.Dispatch<CourseG04L11Gs002Event>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const es = lang === "es";
  const modal = state.phase === "directions-popup" || state.phase === "pair-glossary" ||
    state.phase === "launch-requested";
  return <section className="course-g04-l11-gs002-activity"
    aria-label={es ? "Instrucciones del juego de parejas" :
      "Coordinate Grid Match directions"}
    data-animation-internal-pedagogical-control-count="7"
    data-source-direction-and-launch-control-count="6"
    data-source-glossary-control-count="1" data-source-select-level-frame="728"
    data-source-audio-enabled="false" data-host-handoff-semantics-established="false"
    data-delegated-game-mounted="false" data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span>
      <h2>{es ? "Juego de parejas en la cuadrícula" : "Coordinate Grid Match"}</h2>
      <p>{es ? "Encuentra cada par que coincide para revelar una imagen y música." :
        COURSE_G04_L11_GS_002_DIRECTIONS.summary}</p></header>
    <div className="course-g04-l11-gs002-directions">
      <div><strong>{es ? "Cómo jugar" : "How to play"}</strong>
        <p>{es ? "Haz clic en una caja y después en la caja que coincide." :
          COURSE_G04_L11_GS_002_DIRECTIONS.interaction}</p></div>
      <div className="course-g04-l11-gs002-score">
        <div><span>{es ? "Par correcto" : "Correct match"}</span><strong>+10</strong></div>
        <div><span>{es ? "Par incorrecto" : "Incorrect match"}</span><strong>−2</strong></div>
      </div>
    </div>
    {state.phase === "directions" ? <button className="primary"
      data-source-control="mcSkip" onClick={() => dispatch({type: "skip-directions"})}
      type="button">{es ? "Continuar a los niveles" : "Skip Directions"}</button> : null}
    {state.phase !== "directions" ? <div className="course-g04-l11-gs002-levels">
      <strong>{es ? "Elige un nivel" : "Choose a level"}</strong>
      <div role="group" aria-label={es ? "Niveles" : "Levels"}>
        {COURSE_G04_L11_GS_002_LEVELS.map((level) => <button
          aria-pressed={state.selectedLevelId === level.id}
          data-source-control={level.sourceInstanceName}
          data-source-object-id={level.sourceObjectId} disabled={modal}
          key={level.id} onClick={() => dispatch({type: "select-level", levelId: level.id})}
          type="button">{es ? `Nivel ${level.level}` : level.label}</button>)}
      </div>
      <div className="course-g04-l11-gs002-actions">
        <button className="primary" data-source-control="mcStart" disabled={modal}
          onClick={() => dispatch({type: "start"})} type="button">
          {es ? "Comenzar" : "Start"}</button>
        <button data-source-control="mcRepeat" disabled={modal}
          onClick={() => dispatch({type: "repeat-directions"})} type="button">
          {es ? "Repetir instrucciones" : "Repeat Directions"}</button>
        <button data-source-key-attribute="Pair" data-source-object-id="99"
          disabled={modal} onClick={() => dispatch({type: "open-pair-glossary"})}
          type="button">{es ? "¿Qué es un par?" : "What is a pair?"}</button>
      </div>
      {state.message && state.phase === "select-level"
        ? <p aria-live="assertive" className="course-g04-l11-gs002-message"
          role="alert">{es ? "Elige Nivel 1 o Nivel 2 y después Comenzar." :
            state.message}</p> : null}
    </div> : null}
    {state.phase === "directions-popup" ? <div className="course-g04-l11-gs002-panel"
      aria-live="polite" role="status">
      <strong>{es ? "Instrucciones" : "Directions"}</strong>
      <p>{es ? "Cada par correcto suma 10 puntos. Cada par incorrecto resta 2 puntos. Elige un nivel y luego Comenzar." :
        `${COURSE_G04_L11_GS_002_DIRECTIONS.scoreRule} ${COURSE_G04_L11_GS_002_DIRECTIONS.launch}`}</p>
      <button data-source-control="BtnClose" onClick={() => dispatch({type: "close-directions"})}
        type="button">{es ? "Cerrar" : "Close"}</button>
    </div> : null}
    {state.phase === "pair-glossary" ? <div className="course-g04-l11-gs002-panel"
      aria-live="polite" role="status">
      <strong>{es ? "par" : "pair"}</strong>
      <p>{es ? "Un par contiene dos elementos que van juntos o coinciden." :
        "A pair contains two items that belong together or match."}</p>
      <button onClick={() => dispatch({type: "close-pair-glossary"})} type="button">
        {es ? "Cerrar" : "Close"}</button>
    </div> : null}
    {state.phase === "launch-requested" ? <div className="course-g04-l11-gs002-panel launch"
      aria-live="polite" role="status">
      <strong>{es ? "Nivel listo" : "Level ready"}</strong>
      <p>{es ? "El juego de parejas es la actividad GS003 separada. Esta candidata no ejecuta la llamada Flash antigua." :
        "The matching game is the separate GS003 activity. This candidate does not execute the unresolved legacy Flash host call."}</p>
      <code>course-g04-l11-gs-003 · L11GS03</code>
      <button onClick={() => dispatch({type: "back-to-level-selection"})} type="button">
        {es ? "Volver a los niveles" : "Back to levels"}</button>
    </div> : null}
    <div className="course-g04-l11-gs002-replay"><button onClick={replayLocally}
      type="button">{es ? "Repetir la actividad" : "Replay activity"}</button></div>
  </section>;
}

export function createCourseG04L11Gs002GameDirectionsCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11Gs002State,
      props.frame, createCourseG04L11Gs002State);
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-gs002-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="729-source-canvas-frames-seven-teaching-controls-and-separate-gs003-handoff"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <div className="course-g04-l11-gs002-source-stage">
        <SourceRenderer {...props} frame={interactionVisible ? state.sourceCanvasFrame : props.frame}
          state={undefined} />
        {interactionVisible ? <div aria-hidden="true"
          className="course-g04-l11-gs002-source-control-mask"
          data-modern-replaced-source-control-visual-count="6" /> : null}
      </div>
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}>
        <GameDirectionsControls state={state} dispatch={dispatch}
          lang={props.uiLanguage ?? props.lang} replayLocally={replayLocally} />
      </PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-gs002-candidate [data-source-replay-parity="unvalidated"]{display:none}
        .course-g04-l11-gs002-source-stage{position:relative}.course-g04-l11-gs002-source-control-mask{background:#b8d8f7;height:28%;left:21%;pointer-events:none;position:absolute;top:56%;width:63%;z-index:2}
        .course-g04-l11-gs002-activity{background:linear-gradient(145deg,#fffaf1,#e8f7ff);border:2px solid #256aa7;border-radius:18px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px;width:100%}
        .course-g04-l11-gs002-activity header span{color:#0758ba;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-gs002-activity h2{font-size:clamp(24px,4vw,34px);line-height:1.1;margin:3px 0}.course-g04-l11-gs002-activity p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0}
        .course-g04-l11-gs002-directions{display:grid;gap:12px;grid-template-columns:1.4fr 1fr}.course-g04-l11-gs002-directions>div{background:#fff;border:2px solid #81acd2;border-radius:14px;padding:13px}.course-g04-l11-gs002-score{display:grid;gap:8px;grid-template-columns:1fr 1fr}.course-g04-l11-gs002-score div{background:#f7fbff;border-radius:10px;padding:10px;text-align:center}.course-g04-l11-gs002-score span{display:block;font-size:12px}.course-g04-l11-gs002-score strong{color:#923b00;font-size:28px}
        .course-g04-l11-gs002-levels{background:#fff;border:2px solid #81acd2;border-radius:14px;display:grid;gap:10px;padding:14px}.course-g04-l11-gs002-levels>[role=group]{display:grid;gap:10px;grid-template-columns:1fr 1fr}.course-g04-l11-gs002-actions{display:grid;gap:9px;grid-template-columns:repeat(3,1fr)}
        .course-g04-l11-gs002-activity button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:48px;padding:9px 11px}.course-g04-l11-gs002-activity button.primary{background:linear-gradient(#7bd6ff,#3094db);border-color:#07508a;color:#082d58}.course-g04-l11-gs002-activity button[aria-pressed=true]{background:#0a61bc;color:#fff}.course-g04-l11-gs002-activity button:disabled{cursor:not-allowed;opacity:.62}.course-g04-l11-gs002-activity button:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
        .course-g04-l11-gs002-panel{background:#fff;border:3px solid #1c75bc;border-radius:14px;padding:14px}.course-g04-l11-gs002-panel strong{display:block;font-size:24px}.course-g04-l11-gs002-panel code{background:#eef6ff;border-radius:7px;display:block;margin:10px 0;padding:8px;word-break:break-word}.course-g04-l11-gs002-message{color:#9a3300;font-weight:800}.course-g04-l11-gs002-replay{display:flex;justify-content:flex-end}
        @media(max-width:650px){.course-g04-l11-gs002-directions,.course-g04-l11-gs002-actions{grid-template-columns:1fr}.course-g04-l11-gs002-replay button{width:100%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "729-source-canvas-frames-seven-teaching-controls-and-separate-gs003-handoff-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 728, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_GS_002_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_GS_002_INTERACTION_AUTHORITY,
    scoreRulePreserved: true, levelSelectionPreserved: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    delegatedGameRemainsSeparateMember: true, registeredCurrentJavascript: false,
    sourceAudioAccepted: false, behaviorParityEstablished: false,
    strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
