"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G04_L11_IN_010_CHOICES} from
  "../source-static/g4-l11/course-g04-l11-in-010-static";
import {
  COURSE_G04_L11_IN_010_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_010_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_010_TERMS,
  createCourseG04L11In010PracticeState,
  getCourseG04L11In010SelectedTerm,
  reduceCourseG04L11In010Practice,
  type CourseG04L11In010ChoiceId,
  type CourseG04L11In010PracticeEvent,
  type CourseG04L11In010PracticeState,
  type CourseG04L11In010TermId,
} from "../timelines/course-g04-l11-in-010-point-choice-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

const SOURCE_SCENARIO = "source-static-frame";
const SOURCE_DOMAIN = "sprite-246";
const UI_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';

const ES_TERMS: Readonly<Record<CourseG04L11In010TermId, string>> =
  Object.freeze({equation: "Ecuación", point: "Punto", coordinate: "Coordenada", line: "Línea"});
const ES_PROMPTS: Readonly<Record<CourseG04L11In010TermId, string>> = Object.freeze({
  equation: "Una ecuación muestra que dos expresiones matemáticas son iguales.",
  point: "Un punto marca una ubicación exacta en la cuadrícula.",
  coordinate: "Un par ordenado nombra un punto con un valor de x y un valor de y.",
  line: "Una línea contiene todos los puntos que siguen su ecuación.",
});
const ES_CHOICES: Readonly<Record<CourseG04L11In010ChoiceId, string>> =
  Object.freeze({left: "(2,3)", middle: "(4,6)", right: "(4,8)"});

function PageCompanionPortal({children, targetId}: {
  children: React.ReactNode;
  targetId?: string;
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

function PointChoiceCompanion({dispatch, lang, replayLocally, state}: {
  dispatch: React.Dispatch<CourseG04L11In010PracticeEvent>;
  lang: "en" | "es";
  replayLocally: () => void;
  state: CourseG04L11In010PracticeState;
}) {
  const selectedTerm = getCourseG04L11In010SelectedTerm(state);
  const quizVisible = state.frame >= 191 && !state.completed;
  const termLabel = (termId: CourseG04L11In010TermId, english: string) =>
    lang === "es" ? ES_TERMS[termId] : english;
  return (
    <section aria-label={lang === "es" ? "Pregunta de puntos y líneas" :
      "Point and line question"}
      className="course-g04-l11-in010-controls"
      data-animation-internal-pedagogical-control-count="8"
      data-correct-feedback-source-timing-established="false"
      data-legacy-course-shell-included="false"
      data-legacy-player-chrome-included="false"
      data-local-visual-frame={state.frame}
      data-source-audio-enabled="false"
      data-source-quiz-stop-frame="191">
      <header>
        <span>HELP Math 2.0</span>
        <strong>{lang === "es" ? "¿Qué punto está en la línea?" :
          "Which point belongs on the line?"}</strong>
        <p>{lang === "es"
          ? "La línea de 2x = y contiene (2,4), (3,6) y (5,10). Elige otro punto de la misma línea."
          : "The line for 2x = y includes (2,4), (3,6), and (5,10). Choose another point that belongs on the same line."}</p>
      </header>
      <div className="course-g04-l11-in010-rule">
        <span>{lang === "es" ? "Ecuación de la fuente" : "Source equation"}</span>
        <strong>2x = y</strong>
        <small>{lang === "es" ? "Duplica x para obtener y." :
          "Double x to find y."}</small>
      </div>
      <div aria-label={lang === "es" ? "Términos matemáticos" : "Math terms"}
        className="course-g04-l11-in010-terms" role="group">
        {COURSE_G04_L11_IN_010_TERMS.map((term) => (
          <button aria-pressed={state.selectedTermId === term.id} key={term.id}
            onClick={() => dispatch({type: "select-term", termId: term.id})}
            type="button">{termLabel(term.id, term.label)}</button>
        ))}
      </div>
      {selectedTerm ? (
        <div aria-live="polite" className="course-g04-l11-in010-term-panel" role="status">
          <div><strong>{termLabel(selectedTerm.id, selectedTerm.label)}</strong>
            <p>{lang === "es" ? ES_PROMPTS[selectedTerm.id] : selectedTerm.prompt}</p></div>
          <button onClick={() => dispatch({type: "close-term"})} type="button">
            {lang === "es" ? "Cerrar" : "Close"}</button>
        </div>
      ) : null}
      <fieldset className="course-g04-l11-in010-answers" disabled={!quizVisible ||
        state.popupOpen || state.glossaryOpen}>
        <legend>{lang === "es" ? "Elige un punto" : "Choose a point"}</legend>
        {COURSE_G04_L11_IN_010_CHOICES.map((choice) => (
          <button aria-pressed={state.selectedChoiceId === choice.id}
            data-source-answer-control={choice.sourceInstance}
            key={choice.id} onClick={() => dispatch({type: "choose-answer",
              choiceId: choice.id})} type="button">
            {lang === "es" ? ES_CHOICES[choice.id] : choice.label}
          </button>
        ))}
      </fieldset>
      {state.popupOpen ? (
        <div aria-live="assertive"
          className={`course-g04-l11-in010-feedback ${state.phase}`}
          data-feedback-variant={state.feedbackVariant ?? ""} role="alert">
          <div><strong>{state.phase === "wrong-feedback"
            ? (lang === "es" ? "¿Qué punto pertenece a la línea? Inténtalo de nuevo." :
              state.feedbackMessage)
            : (lang === "es" ? "¡Correcto! (4,8) está en la línea 2x = y." :
              state.feedbackMessage)}</strong>
            <small>{lang === "es" ? "La variante de audio de la fuente está silenciada." :
              "Source feedback audio variant is muted and not accepted."}</small></div>
          {state.phase === "wrong-feedback" ? (
            <button data-source-control="BtnClose"
              onClick={() => dispatch({type: "close-wrong-feedback"})} type="button">
              {lang === "es" ? "Cerrar" : "Close"}</button>
          ) : (
            <button data-modern-timing-substitute="true"
              onClick={() => dispatch({type: "continue-after-correct"})} type="button">
              {lang === "es" ? "Continuar" : "Continue"}</button>
          )}
        </div>
      ) : null}
      {state.completed ? (
        <div aria-live="polite" className="course-g04-l11-in010-complete" role="status">
          <strong>{lang === "es" ? "La práctica está completa." :
            "Practice complete."}</strong>
          <span>{lang === "es" ? "El punto correcto es (4,8)." :
            "The correct point is (4,8)."}</span>
        </div>
      ) : null}
      <div className="course-g04-l11-in010-actions">
        <button onClick={replayLocally} type="button">
          {lang === "es" ? "Repetir la práctica" : "Replay practice"}</button>
      </div>
    </section>
  );
}

export function createCourseG04L11In010PointChoiceCandidate<
  SourceContract extends object,
>(candidate: SourceCandidate<SourceContract>) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const frameDomain = props.frameDomain ?? SOURCE_DOMAIN;
    const deterministicCapture = Boolean(props.entryStateSha256);
    const interactionVisible = frameDomain === SOURCE_DOMAIN &&
      props.scenario === SOURCE_SCENARIO && !deterministicCapture;
    const [state, dispatch] = useReducer(
      reduceCourseG04L11In010Practice,
      {frame: props.frame, seed: props.seed},
      ({frame, seed}) => createCourseG04L11In010PracticeState(frame, seed),
    );
    useEffect(() => { dispatch({type: "synchronize-frame", frame: props.frame}); },
      [props.frame]);
    useEffect(() => {
      if ((props.replay ?? 0) > 0) dispatch({type: "replay", seed: props.seed});
    }, [props.replay, props.seed]);
    const replayLocally = () => { dispatch({type: "replay", seed: props.seed});
      props.onReplay?.(); };
    const sourceFrame = interactionVisible ? state.sourceCanvasFrame : props.frame;
    return (
      <div className="course-g04-l11-in010-candidate"
        data-authoritative-original-runtime-evidence="false"
        data-current-js-functional-candidate="true"
        data-current-js-functional-scope="source-canvas-build-and-modern-point-choice"
        data-legacy-course-shell-included="false"
        data-legacy-player-chrome-included="false"
        data-owner-accepted="false"
        data-registered-current-javascript="true"
        data-source-audio-enabled="false"
        data-strict-acceptance-effect="none"
        data-strict-migration-complete="false"
        style={{margin: "0 auto", maxWidth: candidate.movie.stage.width,
          position: "relative", width: "100%"}}>
        <SourceRenderer {...props} frame={sourceFrame} state={undefined} />
        {interactionVisible ? (
          <PageCompanionPortal targetId={props.pageInteractionCompanionTargetId}>
            <PointChoiceCompanion dispatch={dispatch}
              lang={props.uiLanguage ?? props.lang} replayLocally={replayLocally}
              state={state} />
          </PageCompanionPortal>
        ) : null}
        <style>{`
          .course-g04-l11-in010-controls{background:#f2faff;border:2px solid #176bb0;
            border-radius:20px;box-sizing:border-box;color:#15395f;font-family:${UI_FONT};
            margin-top:14px;padding:20px}.course-g04-l11-in010-controls>header span,
          .course-g04-l11-in010-rule span{color:#0966bc;display:block;font-size:12px;
            font-weight:900;letter-spacing:.08em;text-transform:uppercase}
          .course-g04-l11-in010-controls>header strong{display:block;
            font-size:clamp(24px,4vw,36px);line-height:1.05;margin-top:5px}
          .course-g04-l11-in010-controls p{font-family:system-ui,sans-serif}
          .course-g04-l11-in010-rule{background:#fff;border:2px solid #79afe0;
            border-radius:16px;margin:16px 0;padding:14px 16px}
          .course-g04-l11-in010-rule strong{display:block;font-size:38px;margin:4px 0}
          .course-g04-l11-in010-terms{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
          .course-g04-l11-in010-terms button,.course-g04-l11-in010-actions button{
            background:#fff;border:2px solid #2b78bd;border-radius:999px;color:#17558f;
            font:900 14px ${UI_FONT};min-height:42px;padding:8px 14px}
          .course-g04-l11-in010-term-panel,.course-g04-l11-in010-feedback,
          .course-g04-l11-in010-complete{align-items:center;background:#fff7ce;
            border:2px solid #d28a00;border-radius:16px;display:flex;gap:12px;
            justify-content:space-between;margin:12px 0;padding:14px}
          .course-g04-l11-in010-term-panel button,.course-g04-l11-in010-feedback button{
            background:#fff;border:2px solid #7a5300;border-radius:12px;font-weight:800;
            min-height:42px;padding:8px 14px}.course-g04-l11-in010-feedback small,
          .course-g04-l11-in010-complete span{display:block;font-family:system-ui,sans-serif;
            margin-top:5px}.course-g04-l11-in010-answers{background:#fff;border:2px solid #79afe0;
            border-radius:16px;display:grid;gap:12px;grid-template-columns:repeat(3,1fr);
            margin:0;padding:18px}.course-g04-l11-in010-answers legend{font-size:18px;
            font-weight:900;padding:0 8px}.course-g04-l11-in010-answers button{background:
            linear-gradient(#fff4b8,#ffc84d);border:3px solid #a85f00;border-radius:16px;
            color:#3d3100;font:900 26px ${UI_FONT};min-height:68px;padding:10px}
          .course-g04-l11-in010-answers button:disabled{opacity:.55}
          .course-g04-l11-in010-actions{display:flex;justify-content:flex-end;margin-top:14px}
          @media(max-width:560px){.course-g04-l11-in010-controls{padding:14px}
            .course-g04-l11-in010-answers{grid-template-columns:1fr}
            .course-g04-l11-in010-controls>header strong{font-size:27px}
            .course-g04-l11-in010-term-panel,.course-g04-l11-in010-feedback,
            .course-g04-l11-in010-complete{align-items:flex-start;flex-direction:column}}
        `}</style>
      </div>
    );
  }
  const privateModule: AnimationModule = Object.freeze({
    ...candidate.module,
    maturity: "private-current-js" as const,
    Renderer,
  });
  return Object.freeze({Renderer, module: privateModule, movie: candidate.movie,
    sourceContract: Object.freeze({source: candidate.sourceContract,
      interaction: COURSE_G04_L11_IN_010_INTERACTION_SOURCE,
      authority: COURSE_G04_L11_IN_010_INTERACTION_AUTHORITY})});
}
