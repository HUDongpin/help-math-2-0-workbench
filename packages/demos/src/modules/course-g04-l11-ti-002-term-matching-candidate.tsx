"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_TI_002_GLOSSARY, COURSE_G04_L11_TI_002_MATCHES,
  COURSE_G04_L11_TI_002_TARGET_ROWS} from
  "../source-static/g4-l11/course-g04-l11-ti-002-static";
import {COURSE_G04_L11_TI_002_INTERACTION_AUTHORITY,
  COURSE_G04_L11_TI_002_INTERACTION_SOURCE,
  createCourseG04L11Ti002MatchingState, getCourseG04L11Ti002SelectedGlossary,
  getCourseG04L11Ti002SelectedMatch, reduceCourseG04L11Ti002Matching,
  type CourseG04L11Ti002MatchingEvent, type CourseG04L11Ti002MatchingState,
  type CourseG04L11Ti002TargetRow, type CourseG04L11Ti002TermId} from
  "../timelines/course-g04-l11-ti-002-term-matching-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule; readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}
const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-325";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const ES_TERMS: Readonly<Record<CourseG04L11Ti002TermId, string>> = Object.freeze({
  "coordinate-grid": "cuadrícula de coordenadas", coordinates: "coordenadas",
  plot: "representar", "x-axis": "eje x", "y-axis": "eje y",
});
const ES_DEFINITIONS: Readonly<Record<CourseG04L11Ti002TargetRow, string>> =
  Object.freeze({
    1: "un par de números que se usa para ubicar un punto en una cuadrícula de coordenadas; también se llama par ordenado",
    2: "ubicar puntos en una cuadrícula de coordenadas usando pares ordenados o coordenadas",
    3: "una cuadrícula formada por dos rectas numéricas que se cruzan: el eje x horizontal y el eje y vertical",
    4: "la recta numérica vertical de una cuadrícula de coordenadas",
    5: "la recta numérica horizontal de una cuadrícula de coordenadas",
  });
const GLOSSARY_PROMPTS = Object.freeze({
  pair: "Two objects or numbers considered together.",
  number: "A mathematical idea used to count, measure, or label.",
  locate: "To find or show where something is.",
  "coordinate-grid": "A grid made by a horizontal x-axis and a vertical y-axis.",
  "ordered-pair": "Two coordinates written in a fixed order, such as (3, 2).",
  point: "An exact location represented by a dot.",
  coordinate: "One number in an ordered pair that helps locate a point.",
  grid: "A pattern of intersecting horizontal and vertical lines.",
  "number-line": "A line on which numbers are placed in order.",
  intersect: "To cross or meet at one point.",
  horizontal: "Extending from left to right.",
  vertical: "Extending up and down.",
  "x-axis": "The horizontal number line of a coordinate grid.",
  "y-axis": "The vertical number line of a coordinate grid.",
  form: "To make or create something.",
} as const);
const ES_GLOSSARY_LABELS: Readonly<Record<keyof typeof GLOSSARY_PROMPTS, string>> =
  Object.freeze({pair: "Pareja", number: "Número", locate: "Ubicar",
    "coordinate-grid": "Cuadrícula de coordenadas", "ordered-pair": "Par ordenado",
    point: "Punto", coordinate: "Coordenada", grid: "Cuadrícula",
    "number-line": "Recta numérica", intersect: "Intersecar",
    horizontal: "Horizontal", vertical: "Vertical", "x-axis": "Eje x",
    "y-axis": "Eje y", form: "Formar"});
const ES_GLOSSARY_PROMPTS: Readonly<Record<keyof typeof GLOSSARY_PROMPTS, string>> =
  Object.freeze({
  pair: "Dos objetos o números que se consideran juntos.",
  number: "Una idea matemática que se usa para contar, medir o identificar.",
  locate: "Encontrar o mostrar dónde está algo.",
  "coordinate-grid": "Una cuadrícula formada por un eje x horizontal y un eje y vertical.",
  "ordered-pair": "Dos coordenadas escritas en un orden fijo, como (3, 2).",
  point: "Una ubicación exacta representada por un punto.",
  coordinate: "Un número de un par ordenado que ayuda a ubicar un punto.",
  grid: "Un patrón de líneas horizontales y verticales que se cruzan.",
  "number-line": "Una recta donde los números aparecen en orden.",
  intersect: "Cruzar o encontrarse en un punto.",
  horizontal: "Que se extiende de izquierda a derecha.",
  vertical: "Que se extiende de arriba abajo.",
  "x-axis": "La recta numérica horizontal de una cuadrícula de coordenadas.",
  "y-axis": "La recta numérica vertical de una cuadrícula de coordenadas.",
  form: "Hacer o crear algo.",
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

function PictureDiagram({row}: {row: CourseG04L11Ti002TargetRow}) {
  const highlightedAxis = row === 4 ? "y" : row === 5 ? "x" : null;
  const points = row === 1 ? [[124, 45]] : row === 2
    ? [[80, 75], [124, 45], [152, 99]] : [];
  return <svg aria-label={`Modern enlarged coordinate-grid illustration for row ${row}`}
    role="img" viewBox="0 0 220 150">
    <rect fill="#f8fcff" height="150" rx="14" width="220" />
    {[40, 68, 96, 124, 152, 180].map((x) => <line key={`x${x}`} x1={x}
      x2={x} y1="14" y2="136" stroke="#b7d5ed" strokeWidth="1" />)}
    {[19, 45, 71, 97, 123].map((y) => <line key={`y${y}`} x1="26" x2="194"
      y1={y} y2={y} stroke="#b7d5ed" strokeWidth="1" />)}
    <line x1="26" x2="194" y1="71" y2="71"
      stroke={highlightedAxis === "x" ? "#ef5b2a" : "#164f84"}
      strokeWidth={highlightedAxis === "x" ? "6" : "3"} />
    <line x1="110" x2="110" y1="14" y2="136"
      stroke={highlightedAxis === "y" ? "#ef5b2a" : "#164f84"}
      strokeWidth={highlightedAxis === "y" ? "6" : "3"} />
    <text fill="#164f84" fontSize="12" fontWeight="700" x="196" y="68">x</text>
    <text fill="#164f84" fontSize="12" fontWeight="700" x="115" y="14">y</text>
    {points.map(([x, y], index) => <g key={`${x}-${y}`}><circle cx={x} cy={y}
      fill="#ef5b2a" r="6" /><text fill="#87310e" fontSize="10" fontWeight="700"
      x={x + 8} y={y - 7}>{row === 1 ? "(1, 1)" : String.fromCharCode(65 + index)}</text></g>)}
    {row === 3 ? <text fill="#87310e" fontSize="15" fontWeight="800" x="43" y="145">
      x-axis + y-axis = coordinate grid</text> : null}
  </svg>;
}

function MatchingControls({state, dispatch, lang, replayLocally}: {
  state: CourseG04L11Ti002MatchingState;
  dispatch: React.Dispatch<CourseG04L11Ti002MatchingEvent>;
  lang: "en" | "es"; replayLocally: () => void;
}) {
  const isSpanish = lang === "es";
  const selectedMatch = getCourseG04L11Ti002SelectedMatch(state);
  const selectedGlossary = getCourseG04L11Ti002SelectedGlossary(state);
  const pictureMatch = state.enlargedPictureRow
    ? COURSE_G04_L11_TI_002_MATCHES.find((item) =>
      item.targetRow === state.enlargedPictureRow) ?? null : null;
  return <section aria-label={isSpanish ? "Actividad de vocabulario de coordenadas" :
    "Coordinate-grid vocabulary activity"}
    className="course-g04-l11-ti002-matching"
    data-source-term-control-count="5" data-source-target-control-count="5"
    data-source-picture-control-count="5" data-source-glossary-control-count="15"
    data-source-quiz-stop-frame="230" data-source-audio-enabled="false"
    data-source-drag-geometry-established="false"
    data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false">
    <header><span>HELP Math 2.0</span><strong>{isSpanish
      ? "Cuadrícula de coordenadas: ¡Inténtalo!" : "Coordinate Grid: Try It!"}</strong>
      <p>{isSpanish
        ? "Elige un término y después elige la definición y la imagen que mejor correspondan."
        : "Choose a key term, then choose the definition and picture that best match it."}</p>
      <div aria-label={isSpanish ? "Progreso" : "Progress"} className="progress">
        <b>{state.placedTermIds.length}</b> / 5 {isSpanish ? "completados" : "matched"}
      </div></header>
    <div aria-label={isSpanish ? "Términos" : "Key terms"}
      className="course-g04-l11-ti002-terms" role="group">
      {COURSE_G04_L11_TI_002_MATCHES.map((match) => <button
        aria-pressed={state.selectedTermId === match.id}
        data-source-instance-name={match.sourceInstanceName}
        data-source-object-id={match.sourceObjectId} disabled={state.popupOpen ||
          state.completed || state.placedTermIds.includes(match.id)} key={match.id}
        onClick={() => dispatch({type: "select-term", termId: match.id})}
        type="button">{state.placedTermIds.includes(match.id) ? "✓ " : ""}
        {isSpanish ? ES_TERMS[match.id] : match.term}</button>)}
    </div>
    <p aria-live="polite" className="selection-status">{selectedMatch
      ? isSpanish ? `Seleccionado: ${ES_TERMS[selectedMatch.id]}. Ahora elige una definición.`
        : `Selected: ${selectedMatch.term}. Now choose a definition.`
      : isSpanish ? "Primero elige un término." : "Select a key term first."}</p>
    <div className="course-g04-l11-ti002-targets">
      {COURSE_G04_L11_TI_002_TARGET_ROWS.map((target) => {
        const match = COURSE_G04_L11_TI_002_MATCHES.find((item) =>
          item.targetRow === target.row)!;
        const filled = state.filledTargetRows.includes(target.row);
        return <article data-source-picture-button-object-id={target.pictureButtonObjectId}
          data-source-target-instance-name={match.targetInstanceName}
          data-source-target-object-id={match.targetObjectId} key={target.row}>
          <div><span>{isSpanish ? `Definición ${target.row}` : `Definition ${target.row}`}</span>
            <p>{isSpanish ? ES_DEFINITIONS[target.row] : match.definition}</p>
            {filled ? <strong className="placed-term">✓ {isSpanish
              ? ES_TERMS[match.id] : match.term}</strong> : null}</div>
          <div className="target-actions"><button aria-label={isSpanish
            ? `Ver la imagen ampliada de la definición ${target.row}`
            : `View enlarged picture for definition ${target.row}`}
            disabled={state.popupOpen || state.completed}
            onClick={() => dispatch({type: "open-picture", row: target.row})}
            type="button">{isSpanish ? "Ver imagen" : "View picture"}</button>
            <button disabled={!state.selectedTermId || state.popupOpen || state.completed || filled}
              onClick={() => dispatch({type: "choose-target", row: target.row})}
              type="button">{isSpanish ? "Elegir esta definición" : "Choose this definition"}</button></div>
        </article>;
      })}
    </div>
    <details className="course-g04-l11-ti002-glossary"><summary>{isSpanish
      ? "Palabras matemáticas" : "Math words"}</summary><div role="group"
      aria-label={isSpanish ? "Glosario" : "Glossary"}>
      {COURSE_G04_L11_TI_002_GLOSSARY.map((term) => <button
        aria-pressed={state.selectedGlossaryId === term.id}
        data-source-glossary-button-object-id={term.sourceButtonObjectId}
        disabled={state.popupOpen || state.completed} key={term.id}
        onClick={() => dispatch({type: "open-glossary", glossaryId: term.id})}
        type="button">{isSpanish ? ES_GLOSSARY_LABELS[term.id] : term.label}</button>)}</div></details>
    {state.popupOpen ? <div aria-live="assertive"
      className={`course-g04-l11-ti002-feedback ${state.phase}`} role="alert">
      <strong>{state.phase === "wrong-feedback"
        ? isSpanish ? "¡Inténtalo de nuevo!" : "Try Again!"
        : isSpanish ? "¡Muy bien!" : "Great match!"}</strong>
      <p>{state.phase === "wrong-feedback" && isSpanish
        ? "Ese término corresponde a otra definición. Cierra este mensaje y vuelve a intentarlo."
        : state.feedbackMessage}</p>
      <button onClick={() => dispatch({type: "close-feedback"})} type="button">
        {state.pendingCompletion ? isSpanish ? "Terminar" : "Finish"
          : isSpanish ? "Cerrar" : "Close"}</button>
    </div> : null}
    {pictureMatch && state.enlargedPictureRow ? <div aria-modal="true"
      className="course-g04-l11-ti002-modal" role="dialog">
      <div><span>{isSpanish ? "Imagen matemática ampliada" : "Enlarged math picture"}</span>
        <strong>{isSpanish ? ES_TERMS[pictureMatch.id] : pictureMatch.term}</strong>
        <PictureDiagram row={state.enlargedPictureRow} />
        <p>{isSpanish ? ES_DEFINITIONS[state.enlargedPictureRow] :
          pictureMatch.pictureDescription}</p>
        <button onClick={() => dispatch({type: "close-picture"})} type="button">
          {isSpanish ? "Cerrar imagen" : "Close picture"}</button></div>
    </div> : null}
    {selectedGlossary ? <div aria-live="polite" className="course-g04-l11-ti002-glossary-panel"
      role="status"><div><strong>{isSpanish ? ES_GLOSSARY_LABELS[selectedGlossary.id] :
        selectedGlossary.label}</strong><p>{isSpanish
        ? ES_GLOSSARY_PROMPTS[selectedGlossary.id] : GLOSSARY_PROMPTS[selectedGlossary.id]}</p></div>
      <button onClick={() => dispatch({type: "close-glossary"})} type="button">
        {isSpanish ? "Cerrar" : "Close"}</button></div> : null}
    {state.completed ? <div aria-live="polite" className="course-g04-l11-ti002-complete">
      <strong>{isSpanish ? "¡Completaste las cinco parejas!" :
        "You matched all five coordinate-grid terms!"}</strong></div> : null}
    <div className="course-g04-l11-ti002-playback"><button onClick={replayLocally}
      type="button">{isSpanish ? "Repetir la actividad" : "Replay activity"}</button></div>
  </section>;
}

export function createCourseG04L11Ti002TermMatchingCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactionVisible = (props.frameDomain ?? SOURCE_DOMAIN) === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !props.entryStateSha256;
    const [state, dispatch] = useReducer(reduceCourseG04L11Ti002Matching,
      {frame: props.frame, seed: props.seed}, ({frame, seed}) =>
        createCourseG04L11Ti002MatchingState(frame, seed));
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => { if ((props.replay ?? 0) > 0) dispatch({type: "replay"}); },
      [props.replay]);
    const replayLocally = () => { dispatch({type: "replay"}); props.onReplay?.(); };
    return <div className="course-g04-l11-ti002-candidate"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-current-js-functional-scope="247-source-canvas-frames-five-match-controls-five-picture-controls-fifteen-glossary-terms"
      data-legacy-course-shell-included="false" data-legacy-player-chrome-included="false"
      data-owner-accepted="false" data-registered-current-javascript="false"
      data-source-picture-visual-fidelity-established="false"
      data-strict-acceptance-effect="none" data-strict-migration-complete="false"
      style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
        position: "relative", width: "100%"}}>
      <div className="course-g04-l11-ti002-source-stage"><SourceRenderer {...props}
        frame={interactionVisible ? state.sourceCanvasFrame : props.frame} state={undefined} /></div>
      {interactionVisible ? <PageCompanionPortal
        targetId={props.pageInteractionCompanionTargetId}><MatchingControls state={state}
          dispatch={dispatch} lang={props.uiLanguage ?? props.lang}
          replayLocally={replayLocally} /></PageCompanionPortal> : null}
      <style>{`
        .course-g04-l11-ti002-candidate [data-source-replay-parity="unvalidated"]{display:none}.course-g04-l11-ti002-source-stage{position:relative}
        .course-g04-l11-ti002-matching{background:linear-gradient(145deg,#f4fbff,#e5f5ff);border:2px solid #2168a7;border-radius:20px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:17px;width:100%}
        .course-g04-l11-ti002-matching header{position:relative}.course-g04-l11-ti002-matching header>span,.course-g04-l11-ti002-targets article span,.course-g04-l11-ti002-modal span{color:#0758ba;display:block;font-size:12px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.course-g04-l11-ti002-matching header>strong{display:block;font-size:clamp(23px,4vw,34px);line-height:1.1;margin:3px 100px 0 0}.course-g04-l11-ti002-matching p{font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0}.course-g04-l11-ti002-matching .progress{background:#fff;border:2px solid #75a6d5;border-radius:999px;padding:8px 12px;position:absolute;right:0;top:0}.course-g04-l11-ti002-matching .progress b{color:#8b3100;font-size:20px}
        .course-g04-l11-ti002-terms{display:grid;gap:9px;grid-template-columns:repeat(5,1fr)}.course-g04-l11-ti002-matching button{background:linear-gradient(#fff8ad,#ffc72f);border:2px solid #a95000;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:45px;padding:8px 10px}.course-g04-l11-ti002-matching button[aria-pressed="true"]{background:#0a61bc;border-color:#063a73;color:#fff}.course-g04-l11-ti002-matching button:disabled{cursor:not-allowed;opacity:.6}.course-g04-l11-ti002-matching button:focus-visible,.course-g04-l11-ti002-matching summary:focus-visible{outline:4px solid #0758ba;outline-offset:3px}.selection-status{background:#fff;border-radius:10px;color:#164f84;font-weight:750;padding:8px 11px}
        .course-g04-l11-ti002-targets{display:grid;gap:10px}.course-g04-l11-ti002-targets article{align-items:center;background:#fff;border:2px solid #75a6d5;border-radius:14px;display:grid;gap:12px;grid-template-columns:1fr minmax(180px,240px);padding:12px}.course-g04-l11-ti002-targets article p{margin-top:3px}.target-actions{display:grid;gap:7px}.target-actions button:first-child{background:#e7f6ff;border-color:#2168a7}.placed-term{color:#157240;display:block;font-size:17px;margin-top:7px;text-transform:capitalize}
        .course-g04-l11-ti002-glossary{background:#fff;border:2px solid #75a6d5;border-radius:14px;padding:11px}.course-g04-l11-ti002-glossary summary{color:#0758ba;cursor:pointer;font-weight:900}.course-g04-l11-ti002-glossary>div{display:grid;gap:7px;grid-template-columns:repeat(5,1fr);margin-top:10px}.course-g04-l11-ti002-glossary button{font-size:13px;min-height:38px;padding:6px}
        .course-g04-l11-ti002-feedback,.course-g04-l11-ti002-complete,.course-g04-l11-ti002-glossary-panel{background:#fff;border:3px solid #1c75bc;border-radius:14px;padding:14px}.course-g04-l11-ti002-feedback.wrong-feedback{border-color:#c65100}.course-g04-l11-ti002-feedback strong,.course-g04-l11-ti002-complete strong{display:block;font-size:23px}.course-g04-l11-ti002-glossary-panel{align-items:center;display:flex;gap:14px;justify-content:space-between}.course-g04-l11-ti002-playback{display:flex;justify-content:flex-end}
        .course-g04-l11-ti002-modal{align-items:center;background:rgba(7,45,82,.58);display:flex;inset:0;justify-content:center;padding:18px;position:fixed;z-index:100}.course-g04-l11-ti002-modal>div{background:#fff;border:4px solid #2168a7;border-radius:20px;box-shadow:0 18px 55px rgba(0,0,0,.3);max-width:520px;padding:18px;width:100%}.course-g04-l11-ti002-modal strong{display:block;font-size:27px;margin:3px 0 10px;text-transform:capitalize}.course-g04-l11-ti002-modal svg{display:block;height:auto;width:100%}.course-g04-l11-ti002-modal button{float:right;margin-top:12px}
        @media(max-width:700px){.course-g04-l11-ti002-matching header>strong{margin-right:0}.course-g04-l11-ti002-matching .progress{margin-top:10px;position:static;width:max-content}.course-g04-l11-ti002-terms{grid-template-columns:repeat(2,1fr)}.course-g04-l11-ti002-targets article{grid-template-columns:1fr}.course-g04-l11-ti002-glossary>div{grid-template-columns:repeat(2,1fr)}.course-g04-l11-ti002-glossary-panel{align-items:stretch;flex-direction:column}.course-g04-l11-ti002-playback button{width:100%}}
      `}</style>
    </div>;
  }
  const sourceContract = Object.freeze({...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "247-source-canvas-frames-five-term-matches-five-picture-controls-fifteen-glossary-terms-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({frameDomain: SOURCE_DOMAIN,
      frame: 230, scenario: SOURCE_SCENARIO, language: "en",
      deterministicCaptureOverlayEnabled: false}),
    interaction: COURSE_G04_L11_TI_002_INTERACTION_SOURCE,
    authority: COURSE_G04_L11_TI_002_INTERACTION_AUTHORITY,
    exactTermTargetMappingsPreserved: 5, accessiblePickThenPlaceProvided: true,
    pictureEnlargementFunctionsPreserved: 5, glossaryVocabularyPreserved: 15,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false, sourceAudioAccepted: false,
    behaviorParityEstablished: false, visualFidelityEstablished: false,
    strictAcceptanceEffect: "none"});
  return Object.freeze({Renderer, module: Object.freeze({...candidate.module, Renderer}),
    sourceContract});
}
