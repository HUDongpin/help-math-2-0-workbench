"use client";

import React, {useEffect, useRef, useState} from "react";
import type {AnimationModule, AnimationRendererProps} from "./contract";
import type {AlgL11Interactive10ChoicePage} from
  "./g678-alg-l11-interactive10-tranche-c-core";
import {G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP} from
  "./g678-alg-l11-interactive10-tranche-c-core";
import {G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATES} from
  "./g678-alg-l11-interactive10-tranche-c-candidates";
import {buildAlgL11Interactive10PracticeFeedbackRequest,
  buildAlgL11Interactive10PracticeFeedbackResetRequest,
  createAlgL11Interactive10ChoiceState, reduceAlgL11Interactive10Choice,
  type AlgL11Interactive10ChoiceSlot} from
  "./g678-alg-l11-interactive10-tranche-c-state";
import {AlgL11ASourceVectorStage, type AlgL11ASourceVectorBundle} from
  "./g678-alg-l11-tranche-a-source-vector-stage";

const LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'shared-alg001-l11-p008': {A: 'A: x > −3', B: 'B: −3 < x < 3', C: 'C: x < 3'},
  'shared-alg001-l11-p011': {A: 'A: x ≤ −2', B: 'B: x ≤ −10', C: 'C: x ≥ 2', D: 'D: x ≤ 10'},
  'shared-alg001-l11-p014': {A: 'A: age = 16', B: 'B: age < 16', C: 'C: 16 > age', D: 'D: age ≥ 16'},
  'shared-alg001-l11-p019': {A: 'A: x ≤ 2, closed endpoint at 2, ray left',
    B: 'B: x ≤ 5, closed endpoint at 5, ray left', C: 'C: x ≤ 9, closed endpoint at 9, ray left'},
  'shared-alg001-l11-p020': {A: 'A: x ≥ 6, closed endpoint at 6, ray right',
    B: 'B: x ≥ 2, closed endpoint at 2, ray right', C: 'C: x ≥ 3, closed endpoint at 3, ray right'},
  'shared-alg001-l11-p021': {A: 'A: x > 5, open endpoint at 5, ray right',
    B: 'B: x > −5, open endpoint at −5, ray right', C: 'C: x > 3, open endpoint at 3, ray right'},
  'shared-alg001-l11-p025': {A: 'A: x > −7', B: 'B: −7 < x < 7', C: 'C: x < 7'},
};
const PROMPTS: Readonly<Record<string, string>> = {
  'shared-alg001-l11-p008': 'Click the inequality that represents the graph shown. The graph has open endpoints at −3 and 3.',
  'shared-alg001-l11-p011': 'Simplify the inequality −10x ≤ −20.',
  'shared-alg001-l11-p014': 'To get a driver’s license you must be at least 16 years old. Choose the matching inequality.',
  'shared-alg001-l11-p019': 'Click the correct graph for the inequality x + 3 ≤ 5.',
  'shared-alg001-l11-p020': 'Click the correct graph for the inequality 3x ≥ 6.',
  'shared-alg001-l11-p021': 'Click the correct graph for the inequality −5x < 25.',
  'shared-alg001-l11-p025': 'Click the inequality that represents the graph shown, an open interval from −7 to 7.',
};

export function createAlgL11AChoiceInstructionalModule(
  config: AlgL11Interactive10ChoicePage, vectors: AlgL11ASourceVectorBundle,
): AnimationModule {
  const prior = G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CANDIDATES.find(
    (candidate) => candidate.config.animationId === config.animationId)?.module;
  if (!prior || !LABELS[config.animationId] || vectors.animationId !== config.animationId ||
    vectors.source.sha256 !== config.source.sha256 ||
    vectors.frameCount !== config.mainTimeline.frameCount ||
    vectors.choiceControls.length !== config.sourceContract.optionSlots.filter((slot) => slot.present).length ||
    (config.animationId.endsWith('p011') && !vectors.helpControls)) {
    throw new Error('A source-choice vectors do not match their source behavior');
  }
  const stop = Object.freeze({id: `${config.animationId}-source-choice`,
    frameDomain: `sprite-${config.mainTimeline.objectId}`,
    stopFrame: config.sourceContract.quizFrame,
    resumeFrame: config.sourceContract.quizFrame + 1,
    resolution: 'explicit-source-feedback-finished' as const,
    completionDisposition: 'blocked-while-unresolved' as const,
    requiresHostInteractiveStop: true as const, strictAcceptanceEffect: 'none' as const});
  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(() => createAlgL11Interactive10ChoiceState(props.replay ?? 0));
    const [hostBlocked, setHostBlocked] = useState<boolean | null>(null);
    const sent = useRef(false);
    useEffect(() => {
      const reset = props.onLessonHostRequest?.(buildAlgL11Interactive10PracticeFeedbackResetRequest(config.animationId));
      setHostBlocked(reset?.status !== 'allowed');
      if (reset?.status === 'allowed') {
        setState(createAlgL11Interactive10ChoiceState(props.replay ?? 0));
        sent.current = false;
      }
    }, [props.replay]);
    useEffect(() => {
      if (state.phase !== 'complete' || hostBlocked !== false || state.hostResetStatus !== 'allowed' ||
        sent.current || !props.onInteractiveStopResolved) return;
      sent.current = true;
      props.onInteractiveStopResolved({stopId: stop.id, frameDomain: stop.frameDomain,
        resolution: stop.resolution, source: 'maintained-source-derived-interaction'});
    }, [state.phase, state.hostResetStatus, hostBlocked, props.onInteractiveStopResolved]);
    const atQuiz = props.frame === stop.stopFrame;
    const choose = (slot: string, input: 'mouse' | 'Enter' | ' ') => {
      if (!atQuiz || props.paused || hostBlocked !== false || state.phase !== 'choosing' || state.helpOpen) return;
      const next = reduceAlgL11Interactive10Choice(config, state,
        {type: 'select', slot: slot as AlgL11Interactive10ChoiceSlot, input, seed: props.seed});
      if (next.feedbackBranchIndex === null || next.feedbackBranchCount === null) return;
      const decision = props.onLessonHostRequest?.(buildAlgL11Interactive10PracticeFeedbackRequest(
        config.animationId, next.phase === 'right-feedback' ? 'correct' : 'incorrect',
        next.feedbackBranchIndex, next.feedbackBranchCount));
      setHostBlocked(decision?.status !== 'allowed');
      setState(reduceAlgL11Interactive10Choice(config, next,
        {type: 'host-result', status: decision?.status === 'allowed' ? 'allowed' : 'blocked'}));
    };
    const dismiss = () => {
      if (props.paused || hostBlocked !== false || state.hostFeedbackStatus !== 'allowed') return;
      const decision = props.onLessonHostRequest?.(buildAlgL11Interactive10PracticeFeedbackResetRequest(config.animationId));
      setHostBlocked(decision?.status !== 'allowed');
      setState((current) => reduceAlgL11Interactive10Choice(config, current,
        {type: 'dismiss-feedback', input: 'mouse', resetStatus: decision?.status === 'allowed' ? 'allowed' : 'blocked'}));
    };
    return <section data-animation-id={config.animationId}
      data-instructional-successor="source-vector-choice"
      data-current-javascript-registered="false" data-product-calibration-passed="false"
      data-source-quiz-frame={stop.stopFrame} data-choice-phase={state.phase}
      style={{position: 'relative', width: '100%'}}>
      <AlgL11ASourceVectorStage bundle={vectors} frame={props.frame}
        choiceLabels={LABELS[config.animationId]} description={PROMPTS[config.animationId]}
        helpOpen={state.helpOpen} paused={props.paused}
        choicesEnabled={atQuiz && hostBlocked === false && state.phase === 'choosing'} onChoice={choose}
        helpEnabled={atQuiz && state.phase === 'choosing'} onHelpChange={(open, input) => {
          if (props.paused) return;
          setState((current) => reduceAlgL11Interactive10Choice(config, current,
            {type: open ? 'open-help' : 'close-help', input}));
        }}/>
      {state.helpOpen ? <div aria-live="polite" role="status"
        style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)'}}>
        {G678_ALG_L11_INTERACTIVE10_TRANCHE_C_CHOICE_HELP['shared-alg001-l11-p011']
          .textPlacements.map((placement) => <p key={placement.objectId}>{placement.text.visibleText}</p>)}
      </div> : null}
      {state.feedbackText ? <aside aria-live="assertive" role="status"
        style={{background: 'white', border: '2px solid #2459a9', borderRadius: 10,
          bottom: 20, left: '10%', padding: 18, position: 'absolute', width: '75%'}}>
        <p>{state.feedbackText}</p>
        {hostBlocked === true ? <p role="alert" style={{color: '#9f241b'}}>
          The lesson host could not process this answer. Use Replay to try again.
        </p> : null}
        <button disabled={props.paused || hostBlocked !== false} onClick={dismiss} type="button"
          style={{minHeight: 44, padding: '8px 18px'}}>{state.phase === 'wrong-feedback' && state.wrongAttempt === 1
            ? 'Try again' : 'Continue'}</button>
      </aside> : null}
      {hostBlocked === true && !state.feedbackText ? <p role="alert">The lesson host could not process this answer.</p> : null}
      <button disabled={props.paused || !props.onReplay} onClick={() => {
        const reset = props.onLessonHostRequest?.(buildAlgL11Interactive10PracticeFeedbackResetRequest(config.animationId));
        setHostBlocked(reset?.status !== 'allowed');
        if (reset?.status === 'allowed') props.onReplay?.();
      }}
        type="button" style={{minHeight: 44, padding: '8px 18px'}}>Replay</button>
    </section>;
  }
  return Object.freeze({...prior, Renderer, reducedMotionFrame: stop.stopFrame,
    interactiveStops: Object.freeze([stop])});
}
