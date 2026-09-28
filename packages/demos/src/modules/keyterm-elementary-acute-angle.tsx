'use client';

import React from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  bindLegacyFrameStateIdentity,
  buildLegacyCaptureAttributes
} from '../legacy-capture-identity';
import {
  ACUTE_ANGLE_MOVIE,
  getAcuteAngleFrameState,
  type AcuteAngleFrameState
} from '../timelines/keyterm-acute-angle';

const scenarios = Object.freeze([
  Object.freeze({id: 'default', label: 'Source linear timeline'})
]);
const ANIMATION_ID = 'keyterm-elementary-acute-angle';

function isAcuteAngleState(value: unknown): value is AcuteAngleFrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'frameAsset' in value
  );
}

export function AcuteAngleRenderer({
  entryStateSha256,
  frame,
  frameDomain,
  lang,
  requirementId,
  rootFrame,
  scenario,
  seed,
  traceId,
  state
}: AnimationRendererProps) {
  const frameState = isAcuteAngleState(state)
    ? state
    : getAcuteAngleFrameState(frame, {lang});
  const captureAttributes = buildLegacyCaptureAttributes({
    animationId: ANIMATION_ID,
    entryStateSha256,
    frame,
    frameDomain,
    lang,
    renderedFrame: frameState.frame,
    renderedLanguage: frameState.language,
    requirementId,
    rootFrame,
    scenario,
    seed,
    traceId
  });

  return (
    <div className="faithful-conversion" data-keyterm="acute-angle">
      <div
        {...captureAttributes.stage}
        className="faithful-stage-wrap"
        data-flash-frame={frameState.frame}
        data-runtime-language={frameState.language}
        style={{aspectRatio: '1 / 1', background: '#ffffff'}}
      >
        <svg
          {...captureAttributes.visual}
          aria-labelledby="acute-angle-title acute-angle-description"
          className="faithful-stage"
          role="img"
          viewBox="0 0 225 225"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title id="acute-angle-title">{frameState.accessibleTitle}</title>
          <desc id="acute-angle-description">
            {lang === 'es'
              ? 'El diagrama bilingüe gira el rayo AC alrededor del punto A mientras el rayo AB permanece horizontal.'
              : 'The bilingual source diagram rotates ray AC around point A while ray AB remains horizontal.'}
          </desc>
          <image
            height="225"
            href={frameState.frameAsset}
            preserveAspectRatio="none"
            width="225"
          />
        </svg>
      </div>
    </div>
  );
}

const animationModule: AnimationModule<AcuteAngleFrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: ACUTE_ANGLE_MOVIE,
  // The source root timeline has 60 frames and no stop(), so Flash wraps 60 -> 1.
  playbackMode: 'loop',
  scenarios,
  // The catalog-associated MP3 has no proven source start frame yet.
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: AcuteAngleRenderer,
  getFrameState(frame: number, context: RuntimeContext) {
    return bindLegacyFrameStateIdentity(
      getAcuteAngleFrameState(frame, context),
      frame,
      context
    );
  }
});

export default animationModule;
