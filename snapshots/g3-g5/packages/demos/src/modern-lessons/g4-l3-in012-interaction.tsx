'use client';
import React, {useEffect, useReducer, useRef} from 'react';
import type {Dispatch, ReactNode} from 'react';
import {
  createCourseG04L03In012OwingDragState,
  reduceCourseG04L03In012OwingDrag,
  COURSE_G04_L03_IN_012_CURRENT_JS_TIMING as TIMING,
  type CourseG04L03In012OwingDragAction as Action,
  type CourseG04L03In012OwingDragState as State,
} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';

type Props = Readonly<{
  replay: number; seed: number; paused: boolean; reducedMotion: boolean;
  children: (state: State, dispatch: Dispatch<Action>) => ReactNode;
}>;

function Session({paused, reducedMotion, children}: Omit<Props, 'replay' | 'seed'>) {
  const [state, dispatch] = useReducer(reduceCourseG04L03In012OwingDrag, undefined, createCourseG04L03In012OwingDragState);
  const clock = useRef({phase: '', remainingMs: 0});
  useEffect(() => {
    const outcome = state.outcome;
    if (outcome !== 'correct-feedback' && outcome !== 'final-correct-feedback') {
      clock.current = {phase: '', remainingMs: 0};
      return;
    }
    const phase = `${outcome}:${state.lastPlacedCardId}`;
    if (clock.current.phase !== phase) {
      clock.current = {phase, remainingMs: outcome === 'correct-feedback' ? TIMING.perCardCorrectFeedbackMs : TIMING.finalCorrectFeedbackMs};
    }
    const action: Action = {type: outcome === 'correct-feedback' ? 'feedback-complete' : 'final-feedback-complete'};
    // Retain existing IN012 reduced-motion policy: settle feedback immediately,
    // including when the host is paused. This does not start audio or playback.
    if (reducedMotion) { dispatch(action); return; }
    if (paused) return;
    const startedAt = performance.now();
    let fired = false;
    const timeout = window.setTimeout(() => {
      fired = true;
      clock.current.remainingMs = 0;
      dispatch(action);
    }, clock.current.remainingMs);
    return () => {
      window.clearTimeout(timeout);
      if (!fired && clock.current.phase === phase) {
        clock.current.remainingMs = Math.max(0, clock.current.remainingMs - (performance.now() - startedAt));
      }
    };
  }, [state.outcome, state.lastPlacedCardId, paused, reducedMotion]);
  return <>{children(state, dispatch)}</>;
}

/** Replay/seed changes discard reducer state and cancel the previous timer. */
export function In012Interaction({replay, seed, ...props}: Props) {
  return <Session key={`${seed}:${replay}`} {...props}/>;
}
