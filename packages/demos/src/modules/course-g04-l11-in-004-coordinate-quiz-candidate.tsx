"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationModule,
  AnimationRendererProps,
  MovieMetadata,
} from "../contract";
import {
  COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_004_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_004_TERMS,
  createCourseG04L11In004QuizState,
  getCourseG04L11In004SelectedTerm,
  reduceCourseG04L11In004Quiz,
  type CourseG04L11In004QuizEvent,
  type CourseG04L11In004QuizState,
  type CourseG04L11In004TermId,
} from "../timelines/course-g04-l11-in-004-coordinate-quiz-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-127";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const SPANISH_LABELS: Readonly<Record<CourseG04L11In004TermId, string>> =
  Object.freeze({
    location: "Ubicación",
    "ordered-pair-instruction": "Par ordenado",
    "coordinate-grid": "Cuadrícula de coordenadas",
    "ordered-pair-feedback": "Par ordenado",
    number: "Número",
    unit: "Unidad",
    zero: "Cero",
    "x-axis": "Eje x",
  });

const SPANISH_PROMPTS: Readonly<Record<CourseG04L11In004TermId, string>> =
  Object.freeze({
    location: "Una ubicación indica el lugar exacto de un punto en la cuadrícula.",
    "ordered-pair-instruction":
      "Lee un par ordenado en orden: primero avanza por x y después por y.",
    "coordinate-grid":
      "El eje x horizontal y el eje y vertical forman la cuadrícula de coordenadas.",
    "ordered-pair-feedback":
      "El primer número indica la distancia en x y el segundo la distancia en y.",
    number: "Un número indica cuántas unidades debes avanzar sobre un eje.",
    unit: "Una unidad es la distancia entre dos líneas consecutivas de la cuadrícula.",
    zero: "Cero significa que no debes alejarte del origen sobre ese eje.",
    "x-axis": "El eje x es horizontal y corresponde a la primera coordenada.",
  });

function PageCompanionPortal({
  children,
  targetId,
}: {
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

function coordinatePosition(value: number) {
  return 62 + value * 42;
}

function ModernCoordinateGrid({
  dispatch,
  lang,
  state,
}: {
  dispatch: React.Dispatch<CourseG04L11In004QuizEvent>;
  lang: "en" | "es";
  state: CourseG04L11In004QuizState;
}) {
  const coordinates = [...Array(11).keys()];
  const selected = state.selectedCoordinate;
  const [selectX, setSelectX] = useState(0);
  const [selectY, setSelectY] = useState(0);
  useEffect(() => {
    setSelectX(0);
    setSelectY(0);
  }, [state.cycle, state.target.index]);
  const clickCoordinate = (x: number, y: number) => {
    if (state.gridEnabled) dispatch({type: "select-coordinate", x, y});
  };
  return (
    <section
      aria-label={lang === "es" ? "Práctica de pares ordenados" : "Ordered-pair practice"}
      className="course-g04-l11-in004-modern-stage"
      data-grid-hit-target-count="121"
      data-source-quiz-stop-frame="228"
    >
      <header>
        <span>{lang === "es" ? "Traza el punto" : "Plot the point"}</span>
        <strong>{state.target.orderedPair}</strong>
        <p>
          {lang === "es"
            ? "Selecciona la ubicación exacta: primero x y después y."
            : "Select the exact location: x first, then y."}
        </p>
      </header>
      <div className="course-g04-l11-in004-grid-wrap">
        <svg
          aria-label={lang === "es"
            ? `Cuadrícula de coordenadas para ${state.target.orderedPair}`
            : `Coordinate grid for ${state.target.orderedPair}`}
          role="group"
          viewBox="0 0 544 544"
        >
          <rect fill="#fffde8" height="462" rx="18" width="462" x="40" y="40" />
          {coordinates.map((value) => (
            <React.Fragment key={`lines-${value}`}>
              <line className="minor" x1={coordinatePosition(value)}
                x2={coordinatePosition(value)} y1="62" y2="482" />
              <line className="minor" x1="62" x2="482"
                y1={coordinatePosition(10 - value)} y2={coordinatePosition(10 - value)} />
              <text className="tick" textAnchor="middle"
                x={coordinatePosition(value)} y="510">{value}</text>
              <text className="tick" dominantBaseline="middle" textAnchor="end"
                x="49" y={coordinatePosition(10 - value)}>{value}</text>
            </React.Fragment>
          ))}
          <line className="axis" x1="62" x2="502" y1="482" y2="482" />
          <line className="axis" x1="62" x2="62" y1="502" y2="42" />
          <path className="axis-arrow" d="M502 482l-13-8v16z" />
          <path className="axis-arrow" d="M62 42l-8 13h16z" />
          <text className="axis-label" x="490" y="532">x</text>
          <text className="axis-label" x="23" y="52">y</text>
          {coordinates.flatMap((x) => coordinates.map((y) => (
            <circle
              aria-label={lang === "es" ? `Punto ${x}, ${y}` : `Point ${x}, ${y}`}
              aria-disabled={!state.gridEnabled}
              className="hit-target"
              cx={coordinatePosition(x)}
              cy={coordinatePosition(10 - y)}
              data-coordinate={`${x},${y}`}
              key={`${x}-${y}`}
              onClick={() => clickCoordinate(x, y)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  clickCoordinate(x, y);
                }
              }}
              r="17"
              role="button"
              tabIndex={state.gridEnabled ? 0 : -1}
            />
          )))}
          {selected ? (
            <g className={state.feedback === "correct" ? "selected correct" : "selected wrong"}>
              <circle cx={coordinatePosition(selected.x)}
                cy={coordinatePosition(10 - selected.y)} r="11" />
              <text x={coordinatePosition(selected.x) + 16}
                y={coordinatePosition(10 - selected.y) - 14}>
                ({selected.x},{selected.y})
              </text>
            </g>
          ) : null}
        </svg>
        <div className="course-g04-l11-in004-coordinate-selectors">
          <label>
            x
            <select
              aria-label={lang === "es" ? "Coordenada x" : "x-coordinate"}
              disabled={!state.gridEnabled}
              id="course-g04-l11-in004-x"
              onChange={(event) => setSelectX(Number(event.target.value))}
              value={selectX}
            >
              {coordinates.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label>
            y
            <select
              aria-label={lang === "es" ? "Coordenada y" : "y-coordinate"}
              disabled={!state.gridEnabled}
              id="course-g04-l11-in004-y"
              onChange={(event) => setSelectY(Number(event.target.value))}
              value={selectY}
            >
              {coordinates.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <button
            disabled={!state.gridEnabled}
            onClick={() => {
              dispatch({type: "select-coordinate", x: selectX, y: selectY});
            }}
            type="button"
          >
            {lang === "es" ? "Trazar" : "Plot"}
          </button>
        </div>
      </div>
      {state.feedback === "correct" ? (
        <p aria-live="polite" className="course-g04-l11-in004-correct" role="status">
          {lang === "es"
            ? `¡Correcto! ${state.target.orderedPair} está en esa ubicación.`
            : `Correct! ${state.target.orderedPair} is at that location.`}
        </p>
      ) : null}
    </section>
  );
}

function QuizCompanion({
  dispatch,
  hostFrame,
  lang,
  replayLocally,
  state,
}: {
  dispatch: React.Dispatch<CourseG04L11In004QuizEvent>;
  hostFrame: number;
  lang: "en" | "es";
  replayLocally: () => void;
  state: CourseG04L11In004QuizState;
}) {
  const selectedTerm = getCourseG04L11In004SelectedTerm(state);
  const instructionTerms = COURSE_G04_L11_IN_004_TERMS.filter(
    (term) => term.context === "instruction",
  );
  const feedbackTerms = COURSE_G04_L11_IN_004_TERMS.filter(
    (term) => term.context === "wrong-feedback",
  );
  const label = (id: CourseG04L11In004TermId, english: string) =>
    lang === "es" ? SPANISH_LABELS[id] : english;
  return (
    <section
      aria-label={lang === "es" ? "Ayuda para trazar puntos" : "Plotting help"}
      className="course-g04-l11-in004-controls"
      data-animation-internal-control-count="10"
      data-glossary-control-count="8"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={state.frame}
      data-local-visual-playing={state.playing ? "true" : "false"}
      data-source-post-exhaustion-typo-preserved="false"
      data-spanish-source-visual-parity-established="false"
    >
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "Trazar pares ordenados" : "Plot Ordered Pairs"}</strong>
        <p>
          {lang === "es"
            ? "Haz clic en la ubicación exacta del par ordenado. Usa Siguiente par ordenado para practicar con otro punto."
            : COURSE_G04_L11_IN_004_INTERACTION_SOURCE.instruction}
        </p>
      </header>
      <div aria-label={lang === "es" ? "Términos de la instrucción" : "Instruction terms"}
        className="course-g04-l11-in004-terms" role="group">
        {instructionTerms.map((term) => (
          <button
            aria-pressed={state.selectedTermId === term.id}
            data-source-button-object-id={term.sourceButtonObjectId}
            key={term.id}
            onClick={() => dispatch({type: "select-term", termId: term.id,
              frame: state.frame})}
            type="button"
          >{label(term.id, term.label)}</button>
        ))}
      </div>
      <div className="course-g04-l11-in004-progress">
        <div><span>{lang === "es" ? "Objetivo" : "Target"}</span>
          <strong>{state.target.orderedPair}</strong></div>
        <div><span>{lang === "es" ? "Correctas" : "Correct"}</span>
          <strong>{state.correctCount}</strong></div>
        <div><span>{lang === "es" ? "Intentos" : "Attempts"}</span>
          <strong>{state.attemptCount}</strong></div>
      </div>
      {selectedTerm ? (
        <div aria-live="polite" className="course-g04-l11-in004-term-panel" role="status">
          <div><strong>{label(selectedTerm.id, selectedTerm.label)}</strong>
            <p>{lang === "es" ? SPANISH_PROMPTS[selectedTerm.id] :
              selectedTerm.modernPedagogicalPrompt}</p></div>
          <div>
            <button onClick={() => dispatch({type: "close-term"})} type="button">
              {lang === "es" ? "Cerrar" : "Close"}
            </button>
            <button onClick={() => dispatch({type: "resume", frame: hostFrame})}
              type="button">{lang === "es" ? "Continuar" : "Resume"}</button>
          </div>
        </div>
      ) : null}
      {state.wrongPopupOpen ? (
        <div aria-live="assertive" className="course-g04-l11-in004-wrong" role="alert">
          <div>
            <strong>{lang === "es" ? "Inténtalo de nuevo" : "Try again"}</strong>
            <p>{lang === "es"
              ? "En un par ordenado, el primer número indica cuántas unidades debes avanzar sobre el eje x y el segundo indica cuántas unidades debes subir."
              : "In an ordered pair, the first number tells how many units to move on the x-axis and the second tells how many units to move up."}</p>
          </div>
          <div aria-label={lang === "es" ? "Términos de ayuda" : "Feedback terms"}
            className="course-g04-l11-in004-terms" role="group">
            {feedbackTerms.map((term) => (
              <button data-source-button-object-id={term.sourceButtonObjectId}
                key={term.id}
                onClick={() => dispatch({type: "select-term", termId: term.id,
                  frame: state.frame})} type="button">
                {label(term.id, term.label)}
              </button>
            ))}
          </div>
          <button onClick={() => dispatch({type: "close-wrong-feedback"})}
            type="button">{lang === "es" ? "Cerrar y volver a intentar" : "Close and try again"}</button>
        </div>
      ) : null}
      <div className="course-g04-l11-in004-actions">
        <button data-source-control="next-ordered-pair"
          disabled={!state.nextEnabled}
          onClick={() => dispatch({type: "next-target"})} type="button">
          {lang === "es" ? "Siguiente par ordenado" : "Next ordered pair"}
        </button>
        <button onClick={replayLocally} type="button">
          {lang === "es" ? "Repetir la lección" : "Replay lesson"}
        </button>
      </div>
    </section>
  );
}

export function createCourseG04L11In004CoordinateQuizCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const frameDomain = props.frameDomain ?? SOURCE_DOMAIN;
    const deterministicCapture = Boolean(props.entryStateSha256);
    const interactionVisible = frameDomain === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !deterministicCapture;
    const [state, dispatch] = useReducer(
      reduceCourseG04L11In004Quiz,
      {frame: props.frame, seed: props.seed},
      ({frame, seed}) => createCourseG04L11In004QuizState(frame, seed),
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
    const quizVisible = interactionVisible && state.phase === "quiz";
    const sourceFrame = interactionVisible ? state.frame : props.frame;
    return (
      <div
        className="course-g04-l11-in004-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-canvas-instruction-and-modern-18-target-coordinate-quiz"
        data-legacy-course-shell-included="false"
        data-legacy-player-chrome-included="false"
        data-owner-accepted="false"
        data-registered-current-javascript="false"
        data-source-audio-enabled="false"
        data-strict-acceptance-effect="none"
        data-strict-migration-complete="false"
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
          position: "relative", width: "100%"}}
      >
        {quizVisible ? <ModernCoordinateGrid dispatch={dispatch}
          lang={props.uiLanguage ?? props.lang} state={state} /> :
          <div className="course-g04-l11-in004-source-stage">
            <SourceRenderer {...props} frame={sourceFrame} state={undefined} />
            {interactionVisible ? (
              <button aria-label="Next ordered pair becomes available after the example"
                className="course-g04-l11-in004-source-next-cover"
                disabled type="button">Next ordered pair</button>
            ) : null}
          </div>}
        {interactionVisible ? (
          <PageCompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            <QuizCompanion dispatch={dispatch} hostFrame={props.frame}
              lang={props.uiLanguage ?? props.lang} replayLocally={replayLocally}
              state={state} />
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-in004-source-stage {position:relative;}
          .course-g04-l11-in004-source-next-cover {
            background:linear-gradient(180deg,#fff7bd,#ffce54);border:2px solid #704300;
            border-radius:14px;box-shadow:0 3px 0 #704300;color:#473100;
            font:900 clamp(12px,2vw,17px) ${UI_FONT};left:9.5%;min-height:44px;
            padding:8px 14px;position:absolute;top:53%;z-index:3;
          }
          .course-g04-l11-in004-source-next-cover:disabled {opacity:1;}
          .course-g04-l11-in004-modern-stage {
            background:linear-gradient(145deg,#d9efff,#b9dcf7);border:2px solid #2168a7;
            border-radius:20px;box-sizing:border-box;color:#17395f;font-family:${UI_FONT};
            min-height:600px;padding:22px;
          }
          .course-g04-l11-in004-modern-stage header {text-align:center;}
          .course-g04-l11-in004-modern-stage header span,
          .course-g04-l11-in004-progress span {color:#0758ba;display:block;font-size:12px;
            font-weight:900;letter-spacing:.08em;text-transform:uppercase;}
          .course-g04-l11-in004-modern-stage header strong {color:#8b3100;display:block;
            font-size:clamp(30px,7vw,54px);line-height:1.05;margin-top:4px;}
          .course-g04-l11-in004-modern-stage p,
          .course-g04-l11-in004-controls p {font-family:system-ui,sans-serif;line-height:1.45;margin:5px 0 0;}
          .course-g04-l11-in004-grid-wrap {align-items:center;display:grid;gap:16px;
            grid-template-columns:minmax(0,1fr) 132px;margin-top:12px;}
          .course-g04-l11-in004-grid-wrap svg {display:block;height:auto;max-height:450px;width:100%;}
          .course-g04-l11-in004-grid-wrap .minor {stroke:#d6c97a;stroke-width:1.5;}
          .course-g04-l11-in004-grid-wrap .axis {stroke:#17395f;stroke-width:4;}
          .course-g04-l11-in004-grid-wrap .axis-arrow {fill:#17395f;}
          .course-g04-l11-in004-grid-wrap .tick {fill:#17395f;font:700 15px system-ui,sans-serif;}
          .course-g04-l11-in004-grid-wrap .axis-label {fill:#17395f;font:900 24px ${UI_FONT};}
          .course-g04-l11-in004-grid-wrap .hit-target {cursor:pointer;fill:transparent;stroke:transparent;}
          .course-g04-l11-in004-grid-wrap .hit-target:hover,
          .course-g04-l11-in004-grid-wrap .hit-target:focus {fill:#ffda4588;stroke:#945400;stroke-width:3;outline:none;}
          .course-g04-l11-in004-grid-wrap .selected circle {fill:#e84c3d;stroke:white;stroke-width:4;}
          .course-g04-l11-in004-grid-wrap .selected.correct circle {fill:#168347;}
          .course-g04-l11-in004-grid-wrap .selected text {fill:#7e210f;font:900 18px ${UI_FONT};}
          .course-g04-l11-in004-coordinate-selectors {display:grid;gap:10px;}
          .course-g04-l11-in004-coordinate-selectors label {font-size:18px;font-weight:900;}
          .course-g04-l11-in004-coordinate-selectors select {background:white;border:2px solid #2168a7;
            border-radius:10px;font:800 18px system-ui,sans-serif;margin-left:8px;min-height:44px;padding:5px;}
          .course-g04-l11-in004-coordinate-selectors button,
          .course-g04-l11-in004-controls button {background:#fff;border:2px solid #2168a7;
            border-radius:12px;color:#17395f;cursor:pointer;font:800 15px system-ui,sans-serif;min-height:44px;padding:8px 12px;}
          .course-g04-l11-in004-coordinate-selectors button {background:#ffcc38;border-color:#8b4f00;}
          .course-g04-l11-in004-controls button:disabled,
          .course-g04-l11-in004-coordinate-selectors button:disabled {cursor:not-allowed;opacity:.5;}
          .course-g04-l11-in004-correct {background:#dcf8e8;border:2px solid #168347;
            border-radius:14px;color:#0d5c31;font-weight:800;padding:10px;text-align:center;}
          .course-g04-l11-in004-controls {background:linear-gradient(145deg,#f5fbff,#e2f4ff);
            border:2px solid #2168a7;border-radius:18px;box-sizing:border-box;color:#17395f;
            display:grid;font-family:${UI_FONT};gap:14px;margin-top:12px;padding:16px;width:100%;}
          .course-g04-l11-in004-controls header>span {color:#0758ba;display:block;font-size:12px;
            font-weight:900;letter-spacing:.08em;}
          .course-g04-l11-in004-controls header>strong {display:block;font-size:clamp(23px,4vw,32px);margin-top:3px;}
          .course-g04-l11-in004-terms,.course-g04-l11-in004-actions {display:flex;flex-wrap:wrap;gap:8px;}
          .course-g04-l11-in004-terms button[aria-pressed="true"] {background:#17395f;color:white;}
          .course-g04-l11-in004-progress {display:grid;gap:10px;grid-template-columns:repeat(3,1fr);}
          .course-g04-l11-in004-progress>div {background:white;border:2px solid #75a6d5;
            border-radius:14px;padding:10px;text-align:center;}
          .course-g04-l11-in004-progress strong {display:block;font-size:22px;margin-top:3px;}
          .course-g04-l11-in004-term-panel,.course-g04-l11-in004-wrong {background:#fff7c8;
            border:2px solid #9a5d00;border-radius:14px;display:grid;gap:10px;padding:12px;}
          .course-g04-l11-in004-term-panel>div:last-child {display:flex;flex-wrap:wrap;gap:8px;}
          .course-g04-l11-in004-wrong {background:#fff1dd;border-color:#b24a21;}
          .course-g04-l11-in004-actions button:first-child {background:#ffcc38;border-color:#8b4f00;}
          @media (max-width:620px) {
            .course-g04-l11-in004-modern-stage {min-height:0;padding:12px;}
            .course-g04-l11-in004-grid-wrap {grid-template-columns:1fr;}
            .course-g04-l11-in004-coordinate-selectors {grid-template-columns:repeat(3,1fr);}
            .course-g04-l11-in004-coordinate-selectors label {font-size:14px;}
            .course-g04-l11-in004-coordinate-selectors select {font-size:16px;margin-left:4px;}
            .course-g04-l11-in004-progress {grid-template-columns:1fr 1fr 1fr;}
            .course-g04-l11-in004-source-next-cover {left:9%;top:52%;}
          }
        `}</style>
      </div>
    );
  }
  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-canvas-instruction-and-modern-18-target-coordinate-quiz-functional-candidate",
    currentJavascriptFunctionalEntry: Object.freeze({
      frameDomain: SOURCE_DOMAIN,
      frame: 1,
      scenario: SOURCE_SCENARIO,
      language: "en",
      deterministicCaptureOverlayEnabled: false,
    }),
    sourceInteraction: COURSE_G04_L11_IN_004_INTERACTION_SOURCE,
    interactionAuthority: COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY,
    sourceTargetCountPreserved: 18,
    sourceGridHitTargetCountPreserved: 121,
    sourceGlossaryControlCountPreserved: 8,
    sourceCorrectWrongNextAndReplayFunctionsImplemented: true,
    sourcePostExhaustionTypoPreservedAsBug: false,
    modernBoundedPostExhaustionResetProvided: true,
    animationInternalPedagogicalControlsPreserved: true,
    legacyCourseShellNavigationAndPlayerChromeExcluded: true,
    registeredCurrentJavascript: false,
    sourceAudioAccepted: false,
    spanishSourceVisualParityEstablished: false,
    behaviorParityEstablished: false,
    strictAcceptanceEffect: "none",
  });
  const module = Object.freeze({...candidate.module, Renderer});
  return Object.freeze({Renderer, movie: candidate.movie, module,
    sourceContract, interactionAuthority: COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY});
}
