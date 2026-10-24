'use client';

// @ts-ignore This candidate renderer is maintained in the repository workbench.
import {QuartGallonConversionAnimation} from '../../../../components/QuartGallonConversionAnimation.jsx';
// @ts-ignore The timeline is pure JavaScript with node:test coverage.
import {
  QUART_GALLON_FLASH_MOVIE,
  getQuartGallonFrameStateAtFrame,
} from '../../../../lib/conversion13Timeline.js';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {formulaAudioTracks} from '../formula-audio';
import {
  bindLegacyFrameStateIdentity,
  buildLegacyCaptureAttributes
} from '../legacy-capture-identity';

const scenarios = Object.freeze([{id: 'default', label: 'Default timeline'}]);
const ANIMATION_ID = 'formula-elementary-conversion-01-03';

function Renderer({
  entryStateSha256,
  frame,
  frameDomain,
  lang,
  onReplay,
  requirementId,
  rootFrame,
  scenario,
  seed,
  traceId
}: AnimationRendererProps) {
  const captureAttributes = buildLegacyCaptureAttributes({
    animationId: ANIMATION_ID,
    entryStateSha256,
    frame,
    frameDomain,
    lang,
    renderedFrame: frame,
    requirementId,
    rootFrame,
    scenario,
    seed,
    traceId
  });
  return (
    <QuartGallonConversionAnimation
      captureStageAttributes={captureAttributes.stage}
      captureVisualAttributes={captureAttributes.visual}
      captureFrame={frame}
      onReplay={onReplay}
      spanishFormulaFlag={lang === 'es' ? 'on' : 'off'}
    />
  );
}

const animationModule: AnimationModule = Object.freeze({
  key: 'conversion-1-3',
  movie: QUART_GALLON_FLASH_MOVIE,
  scenarios,
  // The preserved MP3s are user-triggered by the legacy host shell.
  audioCues: Object.freeze([]),
  audioTracks: formulaAudioTracks('conversion-1-3'),
  maturity: 'legacy-prototype',
  Renderer,
  getFrameState(frame: number, context: RuntimeContext) {
    return bindLegacyFrameStateIdentity(
      getQuartGallonFrameStateAtFrame(frame, {
        spanishFormulaFlag: context.lang === 'es' ? 'on' : 'off'
      }),
      frame,
      context
    );
  }
});

export default animationModule;
