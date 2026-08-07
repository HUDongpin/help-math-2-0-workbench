'use client';

// @ts-ignore This adapter deliberately reuses the preserved JavaScript prototype.
import {LiterConversionAnimation} from '../../../../components/LiterConversionAnimation.jsx';
// @ts-ignore These pure functions remain the evidence-backed workbench timeline.
import {getLiterFrameState, LITER_FLASH_MOVIE} from '../../../../lib/conversionTimeline.js';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {formulaAudioTracks} from '../formula-audio';
import {AccessibleLegacyFrame} from '../legacy-accessible-frame';
import {
  bindLegacyFrameStateIdentity,
  buildLegacyCaptureAttributes
} from '../legacy-capture-identity';
import {frameToElapsedMs} from '../runtime';

const scenarios = Object.freeze([{id: 'default', label: 'Default timeline'}]);
const ANIMATION_ID = 'formula-elementary-conversion-01-04';

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
    <AccessibleLegacyFrame kind="liter" lang={lang} onReplay={onReplay}>
      <LiterConversionAnimation
        captureFrame={frame}
        captureStageAttributes={captureAttributes.stage}
        captureVisualAttributes={captureAttributes.visual}
        spanishFormulaFlag={lang === 'es' ? 'on' : 'off'}
      />
    </AccessibleLegacyFrame>
  );
}

const animationModule: AnimationModule = Object.freeze({
  key: 'conversion-1-4',
  movie: LITER_FLASH_MOVIE,
  scenarios,
  audioCues: Object.freeze([]),
  audioTracks: formulaAudioTracks('conversion-1-4'),
  maturity: 'legacy-prototype',
  Renderer,
  getFrameState(frame: number, context: RuntimeContext) {
    return bindLegacyFrameStateIdentity(
      getLiterFrameState(frameToElapsedMs(frame, LITER_FLASH_MOVIE), {
        spanishFormulaFlag: context.lang === 'es' ? 'on' : 'off'
      }),
      frame,
      context
    );
  }
});

export default animationModule;
