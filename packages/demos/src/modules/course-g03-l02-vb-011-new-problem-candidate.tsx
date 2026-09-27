"use client";

import React, {useEffect, useReducer, useState} from "react";
import {createPortal} from "react-dom";
import type {AnimationModule, AnimationRendererProps, MovieMetadata} from "../contract";
import {COURSE_G03_L02_VB_011_NEW_PROBLEM_SOURCE,
  createCourseG03L02Vb011NewProblemState,
  getCourseG03L02Vb011SelectedProblem,
  reduceCourseG03L02Vb011NewProblem} from
  "../timelines/course-g03-l02-vb-011-new-problem-interaction";

interface SourceCandidate<SourceContract extends object> {
  readonly Renderer: React.ComponentType<AnimationRendererProps>;
  readonly module: AnimationModule;
  readonly movie: MovieMetadata;
  readonly sourceContract: SourceContract;
}

function Companion({children, targetId}: {children: React.ReactNode; targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(targetId ? document.getElementById(targetId) : null); }, [targetId]);
  return target ? createPortal(children, target) : children;
}

export function createCourseG03L02Vb011NewProblemCandidate<SourceContract extends object>(
  candidate: SourceCandidate<SourceContract>,
) {
  const SourceRenderer = candidate.Renderer;
  function Renderer(props: AnimationRendererProps) {
    const interactive = (props.frameDomain ?? "sprite-65") === "sprite-65" &&
      props.scenario === "source-static-frame" && props.lang === "en" && !props.entryStateSha256;
    const presentationFrame = props.reducedMotion ? Math.max(166, props.frame) : props.frame;
    const [state, dispatch] = useReducer(reduceCourseG03L02Vb011NewProblem,
      {frame: interactive ? presentationFrame : 1, seed: props.seed},
      ({frame, seed}) => createCourseG03L02Vb011NewProblemState(frame, seed));
    useEffect(() => {
      if ((props.replay ?? 0) > 0) dispatch({type: "replay", seed: props.seed});
    }, [props.replay, props.seed]);
    useEffect(() => {
      if (interactive) dispatch({type: "synchronize-frame", frame: presentationFrame});
    }, [interactive, presentationFrame, props.replay, props.seed]);
    const ready = state.sourceFrame >= 166;
    const problem = getCourseG03L02Vb011SelectedProblem(state);
    const spanish = props.uiLanguage === "es";
    const nextProblem = () => dispatch({type: "new-problem"});
    const label = spanish ? "Nuevo problema" : "New Problem";
    const bounds = COURSE_G03_L02_VB_011_NEW_PROBLEM_SOURCE.nativeButtonBounds;
    return <div className="course-g03-l02-vb011-new-problem"
      data-new-problem-source-frame={interactive ? state.sourceFrame : undefined}
      data-new-problem-id={interactive ? state.selectedProblemId ?? "example" : undefined}
      data-new-problem-draw-count={interactive ? state.drawCount : undefined}
      data-new-problem-pool-remaining={interactive ? state.remaining.length : undefined}
      data-original-runtime-accepted="false" data-strict-migration-complete="false">
      <div className="course-g03-l02-vb011-drawing">
        <SourceRenderer {...props} frame={interactive ? state.sourceFrame : props.frame}
          state={interactive ? undefined : props.state} />
        {interactive ? <button className="course-g03-l02-vb011-source-button"
          aria-label={spanish ? "Nuevo problema en el dibujo" : "New Problem on the diagram"}
          data-source-new-problem-control="BtnNewProblem" disabled={!ready}
          onClick={nextProblem} type="button"
          style={{left: `${bounds.x / 8}%`, top: `${bounds.y / 6}%`,
            width: `${bounds.width / 8}%`, height: `${bounds.height / 6}%`}} /> : null}
      </div>
      {interactive ? <Companion targetId={props.pageInteractionCompanionTargetId}>
        <div className="course-g03-l02-vb011-actions">
          <button data-new-problem-action="next" disabled={!ready}
            onClick={nextProblem} type="button">{label}</button>
          <p aria-live="polite" role="status">{!ready
            ? spanish ? "Mira el ejemplo y después elige Nuevo problema."
              : "Watch the example, then choose New Problem."
            : problem ? `${problem.minuend} − ${problem.subtrahend} = ${problem.difference}`
              : spanish ? "Elige Nuevo problema para ver otro ejemplo de resta."
                : "Choose New Problem to see another subtraction example."}</p>
        </div>
      </Companion> : null}
      <style>{`
        .course-g03-l02-vb011-new-problem{margin:0 auto;max-width:800px;width:100%}
        .course-g03-l02-vb011-drawing{position:relative}
        .course-g03-l02-vb011-drawing [data-source-replay-parity="unvalidated"]{display:none}
        .course-g03-l02-vb011-source-button{background:transparent;border:0;cursor:pointer;margin:0;padding:0;position:absolute}
        .course-g03-l02-vb011-source-button:disabled{cursor:default}
        .course-g03-l02-vb011-source-button:focus-visible{outline:3px solid #0758ba;outline-offset:3px}
        .course-g03-l02-vb011-actions{align-items:center;display:flex;flex-wrap:wrap;gap:12px;padding:12px 0}
        .course-g03-l02-vb011-actions button{background:#167344;border:2px solid #0b4f2c;border-radius:10px;color:white;cursor:pointer;font:700 16px system-ui,sans-serif;min-height:44px;padding:10px 18px}
        .course-g03-l02-vb011-actions button:disabled{background:#d9e2dc;border-color:#91a699;color:#385243;cursor:not-allowed}
        .course-g03-l02-vb011-actions button:focus-visible{outline:3px solid #0758ba;outline-offset:3px}
        .course-g03-l02-vb011-actions p{color:#17395f;font:16px/1.5 system-ui,sans-serif;margin:0}
      `}</style>
    </div>;
  }
  return Object.freeze({Renderer,
    module: Object.freeze({...candidate.module, Renderer}),
    sourceContract: Object.freeze({...candidate.sourceContract,
      newProblemInteraction: COURSE_G03_L02_VB_011_NEW_PROBLEM_SOURCE,
      currentJavascriptInteractionStatus: "source-drawing-with-five-problem-pool",
      reducedMotionPresentation: "show-example-stop-frame-with-functional-controls",
      behaviorParityEstablished: false, strictAcceptanceEffect: "none"}),
  });
}
