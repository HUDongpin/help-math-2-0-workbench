/** Bounded module eligibility; formal registry admission is a separate transaction. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P010_DRAWING} from '../timelines/shared-alg001-l06-p010';
import {P010_TIMELINE} from '../alg-l06-p010-timeline-v1';
import {P010_CONTINUOUS_AUDIO} from '../alg-l06-p010-audio-schedule-v1';
import {P010_OPTIONAL_SPANISH_AUDIO_BINDING} from '../alg-l06-p010-optional-spanish-audio-v1';
import {P010_TEXT_STATE_SOURCE} from '../generated/alg-l06-p010-text-state-v1';
import {P010_CANVAS_V1} from '../generated/alg-l06-p010-canvas-v1';

if (P010_TIMELINE.animationId !== ALG_L06_P010_DRAWING.animationId ||
    P010_TIMELINE.sourceSwfSha256 !== ALG_L06_P010_DRAWING.sourceSwfSha256 ||
    P010_TIMELINE.frameDomain !== ALG_L06_P010_DRAWING.mainFrameDomain ||
    P010_TIMELINE.mainFrameCount !== ALG_L06_P010_DRAWING.mainFrameCount ||
    P010_TIMELINE.rootEntryFrame !== ALG_L06_P010_DRAWING.rootBeginFrame ||
    P010_CONTINUOUS_AUDIO.animationId !== ALG_L06_P010_DRAWING.animationId ||
    P010_CONTINUOUS_AUDIO.sourceSwfSha256 !== ALG_L06_P010_DRAWING.sourceSwfSha256 ||
    P010_CONTINUOUS_AUDIO.frameDomain !== ALG_L06_P010_DRAWING.mainFrameDomain ||
    P010_CONTINUOUS_AUDIO.sourceCycleFrames !== ALG_L06_P010_DRAWING.mainFrameCount ||
    P010_CONTINUOUS_AUDIO.fps !== ALG_L06_P010_DRAWING.fps ||
    P010_CONTINUOUS_AUDIO.sourceSaSha256 !== P010_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256 ||
    P010_TEXT_STATE_SOURCE.animationId !== ALG_L06_P010_DRAWING.animationId ||
    P010_TEXT_STATE_SOURCE.sourceSwfSha256 !== ALG_L06_P010_DRAWING.sourceSwfSha256 ||
    P010_TEXT_STATE_SOURCE.frameDomain !== ALG_L06_P010_DRAWING.mainFrameDomain ||
    P010_TEXT_STATE_SOURCE.frameCount !== ALG_L06_P010_DRAWING.mainFrameCount ||
    P010_CANVAS_V1.animationId !== ALG_L06_P010_DRAWING.animationId ||
    P010_CANVAS_V1.sourceSwfSha256 !== ALG_L06_P010_DRAWING.sourceSwfSha256 ||
    P010_CANVAS_V1.assetSha256 !== ALG_L06_P010_DRAWING.assetSha256)
  throw Error('P010_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate = createSourceStaticCanvasCandidate(ALG_L06_P010_DRAWING);
export default Object.freeze({...candidate.module, maturity: 'private-current-js' as const,
  privateAlgL06P010: Object.freeze({version: 1 as const, drawing: ALG_L06_P010_DRAWING,
    sourceAudio: P010_CONTINUOUS_AUDIO,
    optionalSpanishAudio: P010_OPTIONAL_SPANISH_AUDIO_BINDING,
    textSource: P010_TEXT_STATE_SOURCE,
    conditionalHostTerminal: P010_TIMELINE.terminalPolicy}),
});
