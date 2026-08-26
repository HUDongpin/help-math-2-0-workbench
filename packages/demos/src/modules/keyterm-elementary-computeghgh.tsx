'use client';

import React, {useEffect, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  bindLegacyFrameStateIdentity,
  buildLegacyCaptureAttributes
} from '../legacy-capture-identity';
import {
  COMPUTEGHGH_MOVIE,
  getComputeghghFrameState,
  replayButtonStateForScenario,
  transitionReplayButton,
  type ComputeghghFrameState,
  type ReplayButtonEvent,
  type ReplayButtonState
} from '../timelines/keyterm-computeghgh';

const scenarios = Object.freeze([
  Object.freeze({id: 'default', label: 'Source timeline and interactive Replay control'})
]);
const ANIMATION_ID = 'keyterm-elementary-computeghgh';

function isComputeghghState(value: unknown): value is ComputeghghFrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'buttonState' in value &&
      'sceneAsset' in value
  );
}

export function ComputeghghRenderer({
  entryStateSha256,
  frame,
  frameDomain,
  lang,
  onReplay,
  requirementId,
  rootFrame,
  scenario,
  seed,
  state,
  traceId
}: AnimationRendererProps) {
  const deterministicState = isComputeghghState(state)
    ? state
    : getComputeghghFrameState(frame, {lang, scenario});
  const scenarioButtonState = replayButtonStateForScenario(scenario);
  const [buttonState, setButtonState] = useState<ReplayButtonState>(scenarioButtonState);

  useEffect(() => setButtonState(scenarioButtonState), [scenarioButtonState]);

  const applyButtonEvent = (event: ReplayButtonEvent) => {
    const transition = transitionReplayButton(buttonState, event);
    setButtonState(transition.buttonState);
    if (transition.replayRequested) onReplay?.();
  };

  const visibleButtonState = scenario === 'default' ? buttonState : deterministicState.buttonState;
  const buttonAsset = `/flash-assets/keyterms/computeghgh/buttons/${visibleButtonState}.svg`;
  const captureAttributes = buildLegacyCaptureAttributes({
    animationId: ANIMATION_ID,
    entryStateSha256,
    frame,
    frameDomain,
    lang,
    renderedFrame: deterministicState.frame,
    renderedLanguage: deterministicState.language,
    requirementId,
    rootFrame,
    scenario,
    seed,
    traceId
  });

  return (
    <div className="faithful-conversion" data-keyterm="computeghgh">
      <div
        {...captureAttributes.stage}
        className="faithful-stage-wrap"
        data-flash-frame={deterministicState.frame}
        data-replay-state={visibleButtonState}
        data-runtime-language={deterministicState.language}
        style={{aspectRatio: '1 / 1', background: '#ffffff'}}
      >
        <svg
          {...captureAttributes.visual}
          aria-labelledby="computeghgh-title computeghgh-description"
          className="faithful-stage"
          role="img"
          viewBox="0 0 225 225"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title id="computeghgh-title">{deterministicState.accessibleTitle}</title>
          <desc id="computeghgh-description">
            {lang === 'es'
              ? 'La fuente muestra a un estudiante sosteniendo el número 13 y un control para repetir.'
              : 'The source shows a student holding the number 13 and a Replay control.'}
          </desc>
          <image
            height="225"
            href={deterministicState.sceneAsset}
            preserveAspectRatio="none"
            width="225"
          />
          <rect fill="#ffffff" height="19" width="74" x="151" y="190" />
          <image height="16.5" href={buttonAsset} width="71.15" x="152.1" y="191.75" />
        </svg>
        <button
          aria-label={lang === 'es' ? 'Repetir animación' : 'Replay animation'}
          className="flash-replay"
          onBlur={() => applyButtonEvent('blur')}
          onClick={() => applyButtonEvent('activate')}
          onPointerDown={() => applyButtonEvent('pointer-down')}
          onPointerEnter={() => applyButtonEvent('pointer-enter')}
          onPointerLeave={() => applyButtonEvent('pointer-leave')}
          onPointerUp={() => applyButtonEvent('pointer-up')}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 0,
            bottom: '7.444444%',
            cursor: 'pointer',
            height: '7.333333%',
            margin: 0,
            padding: 0,
            position: 'absolute',
            right: '0.777778%',
            width: '31.622222%'
          }}
          type="button"
        />
      </div>
    </div>
  );
}

const animationModule: AnimationModule<ComputeghghFrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COMPUTEGHGH_MOVIE,
  scenarios,
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: ComputeghghRenderer,
  getFrameState(frame: number, context: RuntimeContext) {
    return bindLegacyFrameStateIdentity(
      getComputeghghFrameState(frame, context),
      frame,
      context
    );
  }
});

export default animationModule;
