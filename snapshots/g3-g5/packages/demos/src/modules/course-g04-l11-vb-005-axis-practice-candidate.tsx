"use client";

import React, {useEffect, useReducer} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  AnimationRuntimeMetadata,
  RuntimeContext,
} from "../contract";
import {
  COURSE_G04_L11_VB_005_AXIS_TOKENS,
  COURSE_G04_L11_VB_005_INTERACTION_AUTHORITY,
  COURSE_G04_L11_VB_005_INTERACTION_SOURCE,
  COURSE_G04_L11_VB_005_KEY_TERMS,
  createCourseG04L11Vb005AxisPracticeState,
  reduceCourseG04L11Vb005AxisPractice,
  type CourseG04L11Vb005AxisId,
  type CourseG04L11Vb005AxisPracticeEvent,
  type CourseG04L11Vb005AxisPracticeState,
  type CourseG04L11Vb005TargetId,
  type CourseG04L11Vb005TermId,
} from "../timelines/course-g04-l11-vb-005-axis-practice-interaction";

const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
const SOURCE_DOMAIN = "sprite-101";
const SOURCE_SCENARIO = "source-static-axis-practice-candidate";

const COPY = Object.freeze({
  en: Object.freeze({
    title: "Axis Practice",
    instruction: "Place each label on its correct axis.",
    xTarget: "Horizontal axis target",
    yTarget: "Vertical axis target",
    choose: "Choose an axis label, then choose its target. You can also drag it.",
    correct: "Correct! That label is in the right position.",
    wrongX: "Try again. The x-axis is the horizontal number line.",
    wrongY: "Try again. The y-axis is the vertical number line.",
    complete: "Great work! Both axes are labeled correctly.",
    close: "Close",
    replay: "Replay",
    terms: "Important words",
    modernHint: "Modern classroom hint; source glossary text is still unresolved.",
  }),
  es: Object.freeze({
    title: "Práctica de ejes",
    instruction: "Coloca cada etiqueta en el eje correcto.",
    xTarget: "Objetivo del eje horizontal",
    yTarget: "Objetivo del eje vertical",
    choose: "Elige una etiqueta y luego su objetivo. También puedes arrastrarla.",
    correct: "¡Correcto! La etiqueta está en la posición adecuada.",
    wrongX: "Inténtalo de nuevo. El eje x es la recta numérica horizontal.",
    wrongY: "Inténtalo de nuevo. El eje y es la recta numérica vertical.",
    complete: "¡Muy bien! Los dos ejes están correctamente etiquetados.",
    close: "Cerrar",
    replay: "Repetir",
    terms: "Palabras importantes",
    modernHint: "Ayuda moderna; el texto del glosario original sigue sin resolverse.",
  }),
});

const TERM_HELP: Readonly<Record<CourseG04L11Vb005TermId,
Readonly<{en: string; es: string}>>> = Object.freeze({
  "x-axis": Object.freeze({en: "The horizontal number line on a coordinate grid.",
    es: "La recta numérica horizontal de una cuadrícula de coordenadas."}),
  "y-axis": Object.freeze({en: "The vertical number line on a coordinate grid.",
    es: "La recta numérica vertical de una cuadrícula de coordenadas."}),
  position: Object.freeze({en: "A location described by its coordinates.",
    es: "Un lugar descrito por sus coordenadas."}),
  "coordinate-grid": Object.freeze({en: "A plane made by perpendicular x- and y-axes.",
    es: "Un plano formado por los ejes x e y perpendiculares."}),
  number: Object.freeze({en: "A value shown along an axis.",
    es: "Un valor que aparece a lo largo de un eje."}),
});

export const COURSE_G04_L11_VB_005_MOVIE = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 10,
  durationMs: 833.3333333333334,
});

export const COURSE_G04_L11_VB_005_RUNTIME: AnimationRuntimeMetadata =
  Object.freeze({
    ...COURSE_G04_L11_VB_005_MOVIE,
    defaultFrameDomain: SOURCE_DOMAIN,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: SOURCE_DOMAIN, frameCount: 142, fps: 12, rootFrame: 6}),
    ]),
  });

export interface CourseG04L11Vb005FrameState {
  readonly frameDomain: "root" | "sprite-101";
  readonly frame: number;
  readonly rootFrame: number;
  readonly functionalInteractionVisible: boolean;
  readonly sourceVisualSequenceReconstructed: false;
  readonly audioEnabled: false;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function getCourseG04L11Vb005FrameState(
  frame: number,
  context: RuntimeContext,
): CourseG04L11Vb005FrameState {
  const frameDomain = context.frameDomain ?? SOURCE_DOMAIN;
  invariant(frameDomain === "root" || frameDomain === SOURCE_DOMAIN,
    `unsupported VB005 frame domain: ${frameDomain}`);
  const limit = frameDomain === "root" ? 10 : 142;
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= limit,
    `invalid VB005 ${frameDomain} frame: ${frame}`);
  return Object.freeze({
    frameDomain,
    frame,
    rootFrame: frameDomain === "root" ? frame : 6,
    functionalInteractionVisible: frameDomain === SOURCE_DOMAIN && frame >= 102,
    sourceVisualSequenceReconstructed: false,
    audioEnabled: false,
  });
}

function GridArtwork({state}: {state: CourseG04L11Vb005AxisPracticeState}) {
  const lines = Array.from({length: 11}, (_, index) => 170 + index * 32);
  return (
    <svg
      aria-label="Coordinate grid from 0 to 10 on both axes"
      className="course-g04-l11-vb005-grid"
      role="img"
      viewBox="0 0 800 500"
    >
      <rect fill="#fffde8" height="360" rx="18" width="360" x="154" y="54" />
      <g stroke="#b8d8f7" strokeWidth="1.5">
        {lines.map((value) => <line key={`v-${value}`} x1={value} x2={value} y1="70" y2="390" />)}
        {lines.map((value) => <line key={`h-${value}`} x1="170" x2="490" y1={70 + (value - 170)} y2={70 + (value - 170)} />)}
      </g>
      <g fill="none" stroke="#132337" strokeLinecap="round" strokeWidth="5">
        <path d="M170 390 H525" />
        <path d="M170 390 V38" />
      </g>
      <g fill="#132337">
        <path d="M525 390 L508 380 V400 Z" />
        <path d="M170 38 L160 55 H180 Z" />
      </g>
      <g fill="#17395f" fontFamily={UI_FONT} fontSize="16" textAnchor="middle">
        {Array.from({length: 11}, (_, index) => (
          <text key={`x-${index}`} x={170 + index * 32} y="418">{index}</text>
        ))}
        {Array.from({length: 10}, (_, index) => (
          <text key={`y-${index + 1}`} x="145" y={394 - (index + 1) * 32}>{index + 1}</text>
        ))}
      </g>
      {state.placed["x-axis"] ? (
        <g data-placed-axis="x-axis">
          <rect fill="#61c9f5" height="46" rx="12" width="105" x="350" y="438" />
          <text fill="#062b55" fontFamily={UI_FONT} fontSize="24" fontWeight="900" textAnchor="middle" x="402" y="469">x-axis</text>
        </g>
      ) : null}
      {state.placed["y-axis"] ? (
        <g data-placed-axis="y-axis" transform="translate(88 245) rotate(-90)">
          <rect fill="#61c9f5" height="46" rx="12" width="105" x="-52" y="-23" />
          <text fill="#062b55" fontFamily={UI_FONT} fontSize="24" fontWeight="900" textAnchor="middle" x="0" y="8">y-axis</text>
        </g>
      ) : null}
    </svg>
  );
}

function AxisTarget({
  axis,
  dispatch,
  label,
  selectedAxis,
  target,
}: {
  axis: CourseG04L11Vb005AxisId;
  dispatch: React.Dispatch<CourseG04L11Vb005AxisPracticeEvent>;
  label: string;
  selectedAxis: CourseG04L11Vb005AxisId | null;
  target: CourseG04L11Vb005TargetId;
}) {
  const place = (candidate: CourseG04L11Vb005AxisId | null) => {
    if (candidate) dispatch({type: "place-axis", axis: candidate, target});
  };
  return (
    <button
      aria-label={label}
      className={`course-g04-l11-vb005-target ${target}`}
      data-axis-target={target}
      data-expected-axis={axis}
      onClick={() => place(selectedAxis)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const candidate = event.dataTransfer.getData("text/axis");
        place(candidate === "x-axis" || candidate === "y-axis" ? candidate : null);
      }}
      type="button"
    >
      <span aria-hidden="true">{target === "horizontal-axis" ? "↔" : "↕"}</span>
      <span>{label}</span>
    </button>
  );
}

function TermHelp({
  dispatch,
  lang,
  term,
}: {
  dispatch: React.Dispatch<CourseG04L11Vb005AxisPracticeEvent>;
  lang: "en" | "es";
  term: CourseG04L11Vb005TermId;
}) {
  const source = COURSE_G04_L11_VB_005_KEY_TERMS.find((item) => item.id === term);
  invariant(source, `missing VB005 term: ${term}`);
  return (
    <div aria-modal="false" className="course-g04-l11-vb005-term" role="dialog">
      <strong>{source.sourceKey}</strong>
      <p>{TERM_HELP[term][lang]}</p>
      <small>{COPY[lang].modernHint}</small>
      <button onClick={() => dispatch({type: "close-term"})} type="button">
        {COPY[lang].close}
      </button>
    </div>
  );
}

export function CourseG04L11Vb005AxisPracticeRenderer(
  props: AnimationRendererProps,
) {
  const frameState = getCourseG04L11Vb005FrameState(props.frame, props);
  const [state, dispatch] = useReducer(
    reduceCourseG04L11Vb005AxisPractice,
    undefined,
    createCourseG04L11Vb005AxisPracticeState,
  );
  useEffect(() => {
    if ((props.replay ?? 0) > 0) dispatch({type: "replay"});
  }, [props.replay]);
  const lang = props.uiLanguage ?? props.lang;
  const copy = COPY[lang];
  const interactionVisible = frameState.functionalInteractionVisible
    && props.scenario === SOURCE_SCENARIO;
  const feedbackText = state.feedback?.kind === "correct"
    ? copy.correct
    : state.feedback?.axis === "x-axis" ? copy.wrongX : copy.wrongY;
  const replay = () => {
    dispatch({type: "replay"});
    props.onReplay?.();
  };

  return (
    <section
      aria-label={copy.title}
      className="course-g04-l11-vb005-axis-practice"
      data-animation-id="course-g04-l11-vb-005"
      data-animation-internal-pedagogical-controls-preserved="true"
      data-audio-enabled="false"
      data-authoritative-original-runtime-evidence="false"
      data-current-js-functional-candidate="true"
      data-frame-domain={frameState.frameDomain}
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-registered-current-javascript="false"
      data-source-frame={frameState.frame}
      data-strict-acceptance-effect="none"
    >
      <header>
        <span>HELP Math 2.0</span>
        <h2>{copy.title}</h2>
        <p>{interactionVisible ? copy.instruction : copy.choose}</p>
      </header>
      {interactionVisible ? (
        <div className="course-g04-l11-vb005-stage">
          <GridArtwork state={state} />
          {!state.placed["x-axis"] ? (
            <AxisTarget axis="x-axis" dispatch={dispatch} label={copy.xTarget}
              selectedAxis={state.selectedAxis} target="horizontal-axis" />
          ) : null}
          {!state.placed["y-axis"] ? (
            <AxisTarget axis="y-axis" dispatch={dispatch} label={copy.yTarget}
              selectedAxis={state.selectedAxis} target="vertical-axis" />
          ) : null}
          <div aria-label={copy.choose} className="course-g04-l11-vb005-token-tray" role="group">
            {COURSE_G04_L11_VB_005_AXIS_TOKENS.map((axis) => state.placed[axis.id]
              ? null
              : (
                <button
                  aria-pressed={state.selectedAxis === axis.id}
                  data-source-instance={axis.sourceInstanceName}
                  draggable
                  key={axis.id}
                  onClick={() => dispatch({type: "select-axis", axis: axis.id})}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/axis", axis.id);
                    event.dataTransfer.effectAllowed = "move";
                    dispatch({type: "select-axis", axis: axis.id});
                  }}
                  type="button"
                >
                  {axis.label}
                </button>
              ))}
          </div>
          <p aria-live="polite" className="course-g04-l11-vb005-instruction">
            {state.completed ? copy.complete : copy.choose}
          </p>
          {state.feedback ? (
            <div aria-live="assertive" className={`course-g04-l11-vb005-feedback ${state.feedback.kind}`} role="status">
              <strong>{feedbackText}</strong>
              <button onClick={() => dispatch({type: "dismiss-feedback"})} type="button">
                {copy.close}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="course-g04-l11-vb005-unresolved">
          Source frame {frameState.frame} remains visually unresolved; the modern practice opens at source frame 102.
        </div>
      )}
      <div className="course-g04-l11-vb005-actions">
        <div aria-label={copy.terms} role="group">
          {COURSE_G04_L11_VB_005_KEY_TERMS.map((term) => (
            <button
              data-source-button-object-id={term.sourceButtonObjectId}
              key={term.id}
              onClick={() => dispatch({type: "open-term", term: term.id})}
              type="button"
            >
              {term.sourceKey}
            </button>
          ))}
        </div>
        <button className="course-g04-l11-vb005-replay" onClick={replay} type="button">
          {copy.replay}
        </button>
      </div>
      {state.openTerm ? <TermHelp dispatch={dispatch} lang={lang} term={state.openTerm} /> : null}
      <style>{`
        .course-g04-l11-vb005-axis-practice {
          background: linear-gradient(145deg, #eef8ff, #d8edff);
          border: 2px solid #27669f;
          border-radius: 22px;
          box-sizing: border-box;
          color: #17395f;
          font-family: ${UI_FONT};
          margin: 0 auto;
          max-width: 800px;
          overflow: hidden;
          padding: clamp(14px, 3vw, 24px);
          position: relative;
          width: 100%;
        }
        .course-g04-l11-vb005-axis-practice header span {color: #0758ba; font-size: 12px; font-weight: 900; letter-spacing: .08em;}
        .course-g04-l11-vb005-axis-practice h2 {font-size: clamp(25px, 5vw, 38px); margin: 4px 0;}
        .course-g04-l11-vb005-axis-practice p {font-family: system-ui, sans-serif; line-height: 1.45; margin: 6px 0;}
        .course-g04-l11-vb005-stage {background: #fff; border: 2px solid #6ea6d8; border-radius: 18px; min-height: 500px; overflow: hidden; position: relative;}
        .course-g04-l11-vb005-grid {display: block; height: auto; width: 100%;}
        .course-g04-l11-vb005-target {align-items: center; background: rgb(255 235 91 / 88%); border: 3px dashed #aa6100; border-radius: 12px; color: #17395f; display: flex; flex-direction: column; font: 900 12px ${UI_FONT}; justify-content: center; min-height: 62px; padding: 4px; position: absolute;}
        .course-g04-l11-vb005-target span:first-child {font-size: 28px; line-height: 1;}
        .course-g04-l11-vb005-target.horizontal-axis {bottom: 11%; left: 43%; width: 24%;}
        .course-g04-l11-vb005-target.vertical-axis {left: 2%; top: 35%; width: 20%;}
        .course-g04-l11-vb005-token-tray {bottom: 3%; display: flex; gap: 10px; justify-content: flex-end; position: absolute; right: 3%; width: 42%;}
        .course-g04-l11-vb005-token-tray button, .course-g04-l11-vb005-actions button, .course-g04-l11-vb005-feedback button, .course-g04-l11-vb005-term button {
          background: linear-gradient(#fff9aa, #ffc72f); border: 2px solid #a95000; border-radius: 10px; color: #102b70; cursor: pointer; font: 900 16px ${UI_FONT}; min-height: 46px; padding: 8px 13px;
        }
        .course-g04-l11-vb005-token-tray button[aria-pressed="true"] {background: #0a61bc; color: #fff;}
        .course-g04-l11-vb005-axis-practice button:focus-visible {outline: 4px solid #0758ba; outline-offset: 3px;}
        .course-g04-l11-vb005-instruction {background: rgb(236 248 255 / 92%); border-radius: 10px; left: 3%; padding: 9px 12px; position: absolute; top: 2%; width: min(70%, 500px);}
        .course-g04-l11-vb005-feedback {align-items: center; background: #fffde5; border: 3px solid #d67600; border-radius: 14px; box-shadow: 0 10px 30px rgb(17 53 87 / 20%); display: flex; gap: 14px; justify-content: space-between; left: 12%; padding: 14px; position: absolute; right: 4%; top: 22%;}
        .course-g04-l11-vb005-feedback.correct {border-color: #18804b;}
        .course-g04-l11-vb005-actions {align-items: center; display: flex; gap: 12px; justify-content: space-between; margin-top: 14px;}
        .course-g04-l11-vb005-actions > div {display: flex; flex-wrap: wrap; gap: 8px;}
        .course-g04-l11-vb005-actions button {font-size: 14px; min-height: 42px;}
        .course-g04-l11-vb005-replay {white-space: nowrap;}
        .course-g04-l11-vb005-term {background: #fff; border: 3px solid #2368a2; border-radius: 16px; box-shadow: 0 14px 40px rgb(15 45 78 / 26%); display: grid; gap: 8px; left: 10%; padding: 18px; position: absolute; right: 10%; top: 24%; z-index: 4;}
        .course-g04-l11-vb005-term strong {color: #0758ba; font-size: 25px;}
        .course-g04-l11-vb005-term small {font-family: system-ui, sans-serif;}
        .course-g04-l11-vb005-term button {justify-self: end;}
        .course-g04-l11-vb005-unresolved {background: #fff; border: 2px dashed #789; border-radius: 14px; font-family: system-ui, sans-serif; margin-top: 18px; padding: 40px 20px; text-align: center;}
        @media (max-width: 560px) {
          .course-g04-l11-vb005-stage {min-height: 430px;}
          .course-g04-l11-vb005-target span:last-child {font-size: 10px;}
          .course-g04-l11-vb005-token-tray {bottom: 2%; width: 50%;}
          .course-g04-l11-vb005-token-tray button {font-size: 14px; min-height: 42px; padding: 6px 9px;}
          .course-g04-l11-vb005-actions {align-items: stretch; flex-direction: column;}
          .course-g04-l11-vb005-actions > div {display: grid; grid-template-columns: 1fr 1fr;}
          .course-g04-l11-vb005-replay {align-self: start;}
          .course-g04-l11-vb005-feedback {align-items: stretch; flex-direction: column; left: 5%;}
        }
      `}</style>
    </section>
  );
}

export const COURSE_G04_L11_VB_005_SOURCE_CONTRACT = Object.freeze({
  schemaVersion: 1,
  animationId: "course-g04-l11-vb-005",
  releaseId: "lesson-g04-l11-coordinate-grid",
  status: "unregistered-functional-engineering-candidate",
  functionalEntry: Object.freeze({
    frameDomain: SOURCE_DOMAIN,
    frame: 102,
    scenario: SOURCE_SCENARIO,
  }),
  sourceInteraction: COURSE_G04_L11_VB_005_INTERACTION_SOURCE,
  interactionAuthority: COURSE_G04_L11_VB_005_INTERACTION_AUTHORITY,
  currentJavascriptInteractionScope: Object.freeze([
    "two-source-two-target-axis-placement",
    "pointer-drag-and-keyboard-equivalent-placement",
    "correct-wrong-feedback-and-full-replay",
    "five-source-key-term-local-modern-help-controls",
    "legacy-course-shell-navigation-and-player-chrome-excluded",
    "legacy-global-eval-host-and-audio-effects-disabled",
  ]),
  sourceVisualSequenceReconstructed: false,
  sourceAudioEnabled: false,
  sourceAudioAccepted: false,
  sourceSpanishParityEstablished: false,
  registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false,
  visualFidelityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonReleased: false,
  published: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_VB_005_SCENARIOS = Object.freeze([
  Object.freeze({
    id: SOURCE_SCENARIO,
    label: "Source-static axis-practice engineering candidate",
    description: "Modern local interaction at source frame 102; no legacy host or audio effects.",
  }),
]);

const moduleValue: AnimationModule<CourseG04L11Vb005FrameState> = Object.freeze({
  key: "course-g04-l11-vb-005",
  movie: COURSE_G04_L11_VB_005_MOVIE,
  runtime: COURSE_G04_L11_VB_005_RUNTIME,
  playbackMode: "once",
  playbackEndFrame: 142,
  playbackEndFrameByDomain: Object.freeze({root: 1, [SOURCE_DOMAIN]: 142}),
  reducedMotionFrame: 102,
  scenarios: COURSE_G04_L11_VB_005_SCENARIOS,
  defaultScenarioByFrameDomain: Object.freeze({
    root: SOURCE_SCENARIO,
    [SOURCE_DOMAIN]: SOURCE_SCENARIO,
  }),
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: CourseG04L11Vb005AxisPracticeRenderer,
  getFrameState: getCourseG04L11Vb005FrameState,
});

export default moduleValue;
