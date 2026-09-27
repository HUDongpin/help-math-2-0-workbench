"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_GS_003_INTERACTION_AUTHORITY,
  COURSE_G04_L11_GS_003_INTERACTION_SOURCE, createCourseG04L11Gs003State,
  getCourseG04L11Gs003Cards, reduceCourseG04L11Gs003State,
  type CourseG04L11Gs003Card, type CourseG04L11Gs003Event,
  type CourseG04L11Gs003State} from
  "../timelines/course-g04-l11-gs-003-match-game-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-231";
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

function PointDiagram({card}: {card: CourseG04L11Gs003Card}) {
  const coordinate = card.coordinate?.match(/^\((\d+),(\d+)\)$/);
  const x = Number(coordinate?.[1] ?? 0); const y = Number(coordinate?.[2] ?? 0);
  return <svg aria-hidden="true" className="gs003-mini-grid" viewBox="0 0 110 92">
    <rect fill="#f8fcff" height="82" rx="8" width="102" x="4" y="5" />
    {Array.from({length: 10}, (_, index) => <React.Fragment key={index}>
      <line stroke="#b7d6ea" x1={13 + index * 9} x2={13 + index * 9}
        y1="8" y2="80" />
      <line stroke="#b7d6ea" x1="13" x2="94" y1={80 - index * 8}
        y2={80 - index * 8} />
    </React.Fragment>)}
    <line stroke="#17395f" strokeWidth="2" x1="13" x2="98" y1="80" y2="80" />
    <line stroke="#17395f" strokeWidth="2" x1="13" x2="13" y1="4" y2="80" />
    <circle cx={13 + x * 9} cy={80 - y * 8} fill="#e64166" r="4.6" />
    <text fill="#17395f" fontSize="12" fontWeight="800" x={18 + x * 9}
      y={76 - y * 8}>{card.pointLabel}</text>
  </svg>;
}

function DistanceDiagram({card}: {card: CourseG04L11Gs003Card}) {
  const units = card.distanceUnits ?? 0;
  return <svg aria-hidden="true" className="gs003-mini-grid" viewBox="0 0 110 92">
    <rect fill="#f8fcff" height="82" rx="8" width="102" x="4" y="5" />
    {Array.from({length: 10}, (_, index) => <React.Fragment key={index}>
      <line stroke="#b7d6ea" x1={13 + index * 9} x2={13 + index * 9}
        y1="8" y2="80" />
      <line stroke="#b7d6ea" x1="13" x2="94" y1={80 - index * 8}
        y2={80 - index * 8} />
    </React.Fragment>)}
    <line stroke="#17395f" strokeWidth="2" x1="13" x2="98" y1="80" y2="80" />
    <line stroke="#17395f" strokeWidth="2" x1="13" x2="13" y1="4" y2="80" />
    <line stroke="#1168d6" strokeLinecap="round" strokeWidth="5" x1="22"
      x2={22 + units * 9} y1="44" y2="44" />
    <circle cx="22" cy="44" fill="#e64166" r="4" />
    <circle cx={22 + units * 9} cy="44" fill="#e64166" r="4" />
  </svg>;
}

function CardFace({card, lang}: {card: CourseG04L11Gs003Card; lang: "en" | "es"}) {
  const es = lang === "es";
  if (card.levelId === "level-1" && card.side === "diagram") {
    return <><PointDiagram card={card} /><span>{es ? `Punto ${card.pointLabel}` :
      `Point ${card.pointLabel}`}</span></>;
  }
  if (card.levelId === "level-1") return <strong>{card.coordinate}</strong>;
  if (card.side === "diagram") return <><DistanceDiagram card={card} />
    <span>{es ? "Mide el segmento" : "Measure the segment"}</span></>;
  return <strong>{card.distanceUnits} {es ? "unidades" : "units"}</strong>;
}

function MatchGame({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11Gs003State;
  dispatch: React.Dispatch<CourseG04L11Gs003Event>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const es = lang === "es"; const cards = getCourseG04L11Gs003Cards(state.selectedLevelId);
  const modal = state.directionsOpen;
  return <section aria-label={es ? "Juego de parejas de cuadrícula de coordenadas" :
    "Coordinate Grid Match Game"} className="course-g04-l11-gs003-activity"
    data-animation-internal-pedagogical-controls-preserved="true"
    data-exact-source-pair-count="6" data-source-audio-enabled="false"
    data-source-audio-accepted="false" data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span>
      <h2>{es ? "Juego de parejas en la cuadrícula" : "Coordinate Grid Match Game"}</h2>
      <p>{es ? "Encuentra las seis parejas. Una respuesta correcta suma 10 puntos y una incorrecta resta 2." :
        "Find all six matching pairs. A correct match adds 10 points; an incorrect match subtracts 2."}</p>
    </header>
    <div className="gs003-toolbar">
      <div aria-live="polite" className="gs003-score"><span>{es ? "Puntuación" : "Score"}</span>
        <strong>{state.score}</strong></div>
      <div className="gs003-progress"><span>{es ? "Parejas" : "Pairs"}</span>
        <strong>{state.completedPairCount}/6</strong></div>
      <button data-source-control="BtnRepeat" disabled={modal}
        onClick={() => dispatch({type: "repeat-directions"})} type="button">
        {es ? "Repetir instrucciones" : "Repeat Directions"}</button>
    </div>
    {state.phase === "directions" ? <div className="gs003-directions">
      <strong>{es ? "Cómo jugar" : "How to play"}</strong>
      <ol><li>{es ? "Selecciona Nivel 1 o Nivel 2." : "Choose Level 1 or Level 2."}</li>
        <li>{es ? "Selecciona dos tarjetas que coinciden." : "Choose two cards that match."}</li>
        <li>{es ? "Completa las seis parejas para revelar la imagen." :
          "Complete all six pairs to reveal the picture."}</li></ol>
      <button className="primary" onClick={() => dispatch({type: "continue-to-levels"})}
        type="button">{es ? "Elegir nivel" : "Choose a level"}</button>
    </div> : null}
    {state.phase === "select-level" ? <div className="gs003-levels">
      <strong>{es ? "Elige un nivel" : "Choose a level"}</strong>
      <div role="group" aria-label={es ? "Niveles" : "Levels"}>
        {(["level-1", "level-2"] as const).map((levelId, index) => <button
          aria-pressed={state.selectedLevelId === levelId}
          data-source-control={index === 0 ? "mcL1" : "mcL2"} key={levelId}
          onClick={() => dispatch({type: "select-level", levelId})} type="button">
          {es ? `Nivel ${index + 1}` : `Level ${index + 1}`}</button>)}</div>
      <button className="primary" data-source-control="BtnStart"
        onClick={() => dispatch({type: "start"})} type="button">
        {es ? "Comenzar" : "Start"}</button>
    </div> : null}
    {state.phase === "playing" || state.phase === "complete" ? <>
      <div className="gs003-level-heading"><strong>{state.selectedLevelId === "level-1" ?
        (es ? "Nivel 1 · Punto y coordenada" : "Level 1 · Point and coordinate") :
        (es ? "Nivel 2 · Segmento y distancia" : "Level 2 · Segment and distance")}</strong>
        <button onClick={() => dispatch({type: "back-to-levels"})} type="button">
          {es ? "Cambiar nivel" : "Change level"}</button></div>
      <div aria-label={es ? "Tarjetas para emparejar" : "Matching cards"}
        className="gs003-card-grid" role="group">
        {cards.map((card) => {
          const matched = state.matchedPairIds.includes(card.pairId);
          const selected = state.selectedCardId === card.id;
          const label = card.levelId === "level-1" ? (card.side === "diagram" ?
            `${es ? "Punto" : "Point"} ${card.pointLabel}` : `${card.coordinate}`) :
            (card.side === "diagram" ? `${es ? "Diagrama de distancia" : "Distance diagram"} ${card.pairId.slice(2)}` :
              `${card.distanceUnits} ${es ? "unidades" : "units"}`);
          return <button aria-label={label} aria-pressed={selected}
            className="gs003-card" data-matched={matched} data-pair-id={card.pairId}
            data-source-instance={card.sourceInstanceName}
            data-source-object-id={card.sourceObjectId} disabled={matched || state.phase === "complete"}
            key={card.id} onClick={() => dispatch({type: "select-card", cardId: card.id})}
            type="button"><CardFace card={card} lang={lang} />
            {matched ? <span className="gs003-check">✓</span> : null}</button>;
        })}
      </div>
      <p aria-live="assertive" className="gs003-feedback" data-feedback={state.feedback}>
        {state.feedback === "correct" ? (es ? "¡Excelente! +10" : "Excellent! +10") :
          state.feedback === "incorrect" ? (es ? "Inténtalo otra vez. −2" : "Try again. −2") :
            (es ? "Selecciona dos tarjetas." : "Choose two cards.")}</p>
      <div aria-label={es ? "Imagen de recompensa" : "Reward picture"}
        className="gs003-reveal" data-revealed-count={state.completedPairCount}>
        {["🗺️", "🧭", "⭐", "📐", "🌎", "🎯"].map((symbol, index) => <span
          aria-hidden={index >= state.completedPairCount} data-revealed={index < state.completedPairCount}
          key={symbol}>{index < state.completedPairCount ? symbol : "?"}</span>)}</div>
    </> : null}
    {state.phase === "complete" ? <div aria-live="polite" className="gs003-complete"
      role="status"><strong>{es ? "¡Nivel completo!" : "Level complete!"}</strong>
      <p>{es ? `Terminaste con ${state.score} puntos.` :
        `You finished with ${state.score} points.`}</p>
      <button className="primary" onClick={replayLocally} type="button">
        {es ? "Repetir la actividad" : "Replay activity"}</button></div> : null}
    {modal && state.phase !== "directions" ? <div aria-modal="true"
      className="gs003-modal" role="dialog"><strong>{es ? "Instrucciones" : "Directions"}</strong>
      <p>{es ? "Selecciona una tarjeta y después su pareja. Cada pareja correcta suma 10; una pareja incorrecta resta 2." :
        "Choose one card and then its match. Each correct pair adds 10; an incorrect pair subtracts 2."}</p>
      <button data-source-control="BtnClose" onClick={() => dispatch({type: "close-directions"})}
        type="button">{es ? "Cerrar" : "Close"}</button></div> : null}
    {state.phase !== "complete" ? <div className="gs003-replay"><button onClick={replayLocally}
      type="button">{es ? "Reiniciar" : "Replay"}</button></div> : null}
    <p className="gs003-audio-boundary">{es ?
      "La música original aún no está aprobada; esta candidata permanece en silencio." :
      "Original music is not yet accepted; this candidate remains silent."}</p>
  </section>;
}

export function createCourseG04L11Gs003GameCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11Gs003State, undefined,
      createCourseG04L11Gs003State);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-gs003-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="two-level-six-pair-game-modern-controls-no-source-audio"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      {!interactionVisible ? <div className="gs003-source-evidence-stage">
        <SourceRenderer {...props} state={undefined} /></div> : null}
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}>
        <MatchGame state={state} dispatch={dispatch} lang={props.uiLanguage ?? props.lang}
          replayLocally={replayLocally} />
      </PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-gs003-activity{background:linear-gradient(150deg,#fffaf0,#e7f7ff);border:2px solid #246ca8;border-radius:20px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;padding:17px;width:100%}
        .course-g04-l11-gs003-activity header span{color:#0758ba;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.course-g04-l11-gs003-activity h2{font-size:clamp(25px,4vw,36px);line-height:1.05;margin:4px 0}.course-g04-l11-gs003-activity p,.course-g04-l11-gs003-activity li{font-family:system-ui,sans-serif;line-height:1.4}
        .gs003-toolbar{align-items:stretch;display:grid;gap:10px;grid-template-columns:1fr 1fr 1.5fr}.gs003-score,.gs003-progress{align-items:center;background:#fff;border:2px solid #7fabd0;border-radius:13px;display:flex;justify-content:space-between;padding:9px 13px}.gs003-score strong,.gs003-progress strong{font-size:25px}
        .course-g04-l11-gs003-activity button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:48px;padding:9px 11px}.course-g04-l11-gs003-activity button.primary{background:linear-gradient(#7bd6ff,#3094db);border-color:#07508a;color:#082d58}.course-g04-l11-gs003-activity button:focus-visible{outline:4px solid #0758ba;outline-offset:3px}.course-g04-l11-gs003-activity button:disabled{cursor:default;opacity:.72}
        .gs003-directions,.gs003-levels,.gs003-complete{background:#fff;border:2px solid #81acd2;border-radius:15px;display:grid;gap:11px;padding:15px}.gs003-directions>strong,.gs003-levels>strong,.gs003-complete>strong{font-size:23px}.gs003-levels>[role=group]{display:grid;gap:10px;grid-template-columns:1fr 1fr}.gs003-levels button[aria-pressed=true]{background:#0a61bc;color:#fff}
        .gs003-level-heading{align-items:center;display:flex;gap:12px;justify-content:space-between}.gs003-level-heading strong{font-size:20px}.gs003-card-grid{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr))}.course-g04-l11-gs003-activity .gs003-card{align-items:center;background:#fff;border-color:#5b8db8;display:flex;flex-direction:column;justify-content:center;min-height:125px;overflow:hidden;position:relative}.course-g04-l11-gs003-activity .gs003-card[aria-pressed=true]{background:#fff3b8;border-color:#d15b00;box-shadow:0 0 0 3px #ffcc43}.course-g04-l11-gs003-activity .gs003-card[data-matched=true]{background:#dcf7e6;border-color:#248650;opacity:1}.gs003-card strong{font-size:24px}.gs003-card span{font-size:12px}.gs003-check{background:#248650;border-radius:999px;color:#fff;font-size:18px!important;height:28px;line-height:28px;position:absolute;right:6px;top:6px;width:28px}.gs003-mini-grid{height:82px;max-width:110px;width:100%}
        .gs003-feedback{background:#fff;border-radius:10px;font-weight:800;margin:0;padding:10px;text-align:center}.gs003-feedback[data-feedback=correct]{color:#16733f}.gs003-feedback[data-feedback=incorrect]{color:#a33420}.gs003-reveal{display:grid;gap:7px;grid-template-columns:repeat(6,1fr)}.gs003-reveal span{align-items:center;aspect-ratio:1.4;background:#d9e7f1;border:2px solid #85a8c3;border-radius:12px;display:flex;font-size:clamp(25px,6vw,48px);justify-content:center}.gs003-reveal span[data-revealed=true]{background:linear-gradient(145deg,#fff4aa,#a8ebff);border-color:#d66c00}.gs003-modal{background:#fff;border:3px solid #1c75bc;border-radius:15px;box-shadow:0 12px 40px #17395f55;display:grid;gap:10px;inset:18% 8% auto;max-width:620px;padding:18px;position:fixed;z-index:20}.gs003-modal strong{font-size:25px}.gs003-replay{display:flex;justify-content:flex-end}.gs003-audio-boundary{color:#526b82;font-size:12px;margin:0;text-align:center}
        @media(max-width:680px){.gs003-toolbar{grid-template-columns:1fr 1fr}.gs003-toolbar button{grid-column:1/-1}.gs003-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gs003-reveal{grid-template-columns:repeat(3,1fr)}.gs003-level-heading{align-items:stretch;flex-direction:column}.gs003-replay button{width:100%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "two-level-six-pair-modern-matching-game-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 3, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_GS_003_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_GS_003_INTERACTION_AUTHORITY,
    exactSourcePairIdentityPreserved: true, exactSourceScoreDeltasPreserved: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
