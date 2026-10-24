/** Bounded module eligibility; formal registry admission is a separate transaction. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P013_DRAWING} from '../timelines/shared-alg001-l06-p013';
import {P013_TIMELINE} from '../alg-l06-p013-timeline-v1';
import {P013_CONTINUOUS_AUDIO} from '../alg-l06-p013-audio-schedule-v1';
import {P013_OPTIONAL_SPANISH_AUDIO_BINDING} from '../alg-l06-p013-optional-spanish-audio-v1';
import {P013_TEXT_STATE_SOURCE} from '../generated/alg-l06-p013-text-state-v1';
import {P013_CANVAS_V1} from '../generated/alg-l06-p013-canvas-v1';

if (P013_TIMELINE.animationId !== ALG_L06_P013_DRAWING.animationId ||
    P013_TIMELINE.sourceSwfSha256 !== ALG_L06_P013_DRAWING.sourceSwfSha256 ||
    P013_TIMELINE.frameDomain !== ALG_L06_P013_DRAWING.mainFrameDomain ||
    P013_TIMELINE.mainFrameCount !== ALG_L06_P013_DRAWING.mainFrameCount ||
    P013_TIMELINE.rootEntryFrame !== ALG_L06_P013_DRAWING.rootBeginFrame ||
    P013_TIMELINE.glossary.Input.sourceFirstFrame !== 258 ||
    P013_TIMELINE.glossary.Input.firstFullHitFrame !== 296 ||
    P013_TIMELINE.glossary.Output.sourceFirstFrame !== 297 ||
    P013_TIMELINE.glossary.Output.firstFullHitFrame !== 365 ||
    P013_CONTINUOUS_AUDIO.animationId !== ALG_L06_P013_DRAWING.animationId ||
    P013_CONTINUOUS_AUDIO.sourceSwfSha256 !== ALG_L06_P013_DRAWING.sourceSwfSha256 ||
    P013_CONTINUOUS_AUDIO.frameDomain !== ALG_L06_P013_DRAWING.mainFrameDomain ||
    P013_CONTINUOUS_AUDIO.lastFrame !== ALG_L06_P013_DRAWING.mainFrameCount ||
    P013_CONTINUOUS_AUDIO.fps !== ALG_L06_P013_DRAWING.fps ||
    P013_CONTINUOUS_AUDIO.sourceHasNegativeSeek !== true ||
    P013_CONTINUOUS_AUDIO.negativeSeekSemanticsResolved !== false ||
    P013_CONTINUOUS_AUDIO.syntheticSilenceForAbsentBlocks !== false ||
    P013_CONTINUOUS_AUDIO.sourceSaSha256 !== P013_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256 ||
    P013_TEXT_STATE_SOURCE.animationId !== ALG_L06_P013_DRAWING.animationId ||
    P013_TEXT_STATE_SOURCE.sourceSwfSha256 !== ALG_L06_P013_DRAWING.sourceSwfSha256 ||
    P013_TEXT_STATE_SOURCE.frameDomain !== ALG_L06_P013_DRAWING.mainFrameDomain ||
    P013_TEXT_STATE_SOURCE.frameCount !== ALG_L06_P013_DRAWING.mainFrameCount ||
    P013_CANVAS_V1.animationId !== ALG_L06_P013_DRAWING.animationId ||
    P013_CANVAS_V1.sourceSwfSha256 !== ALG_L06_P013_DRAWING.sourceSwfSha256 ||
    P013_CANVAS_V1.assetSha256 !== ALG_L06_P013_DRAWING.assetSha256)
  throw Error('P013_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate = createSourceStaticCanvasCandidate(ALG_L06_P013_DRAWING);
export default Object.freeze({...candidate.module, maturity: 'private-current-js' as const,
  privateAlgL06P013: Object.freeze({version: 1 as const, drawing: ALG_L06_P013_DRAWING,
    sourceAudio: P013_CONTINUOUS_AUDIO,
    optionalSpanishAudio: P013_OPTIONAL_SPANISH_AUDIO_BINDING,
    textSource: P013_TEXT_STATE_SOURCE,
    conditionalHostTerminal: P013_TIMELINE.terminalPolicy}),
});
