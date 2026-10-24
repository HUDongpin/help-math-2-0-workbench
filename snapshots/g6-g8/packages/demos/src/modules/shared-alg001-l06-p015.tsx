/** Bounded module eligibility; formal registry admission is a separate transaction. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P015_DRAWING} from '../timelines/shared-alg001-l06-p015';
import {P015_TIMELINE} from '../alg-l06-p015-timeline-v1';
import {P015_AUDIO_ASSETS, P015_SA_ASSET, P015_AUDIO_DISPOSITION}
  from '../alg-l06-p015-audio-schedule-v1';
import {P015_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p015-optional-spanish-audio-v1';
import {P015_TEXT_STATE_SOURCE} from '../generated/alg-l06-p015-text-state-v1';
import {P015_CANVAS_V1} from '../generated/alg-l06-p015-canvas-v1';

if (P015_TIMELINE.animationId !== ALG_L06_P015_DRAWING.animationId ||
    P015_TIMELINE.sourceSwfSha256 !== ALG_L06_P015_DRAWING.sourceSwfSha256 ||
    P015_TIMELINE.frameDomain !== ALG_L06_P015_DRAWING.mainFrameDomain ||
    P015_TIMELINE.mainFrameCount !== ALG_L06_P015_DRAWING.mainFrameCount ||
    P015_TIMELINE.rootEntryFrame !== ALG_L06_P015_DRAWING.rootBeginFrame ||
    P015_AUDIO_ASSETS.length !== 4 ||
    P015_AUDIO_DISPOSITION.frameDomain !== ALG_L06_P015_DRAWING.mainFrameDomain ||
    P015_AUDIO_DISPOSITION.lastVisualFrame !== ALG_L06_P015_DRAWING.mainFrameCount ||
    P015_AUDIO_DISPOSITION.separateSaSpliced !== false ||
    P015_AUDIO_DISPOSITION.originalRuntimeAccepted !== false ||
    P015_SA_ASSET.sourceSha256 !== P015_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256 ||
    P015_TEXT_STATE_SOURCE.animationId !== ALG_L06_P015_DRAWING.animationId ||
    P015_TEXT_STATE_SOURCE.sourceSwfSha256 !== ALG_L06_P015_DRAWING.sourceSwfSha256 ||
    P015_TEXT_STATE_SOURCE.frameDomain !== ALG_L06_P015_DRAWING.mainFrameDomain ||
    P015_TEXT_STATE_SOURCE.frameCount !== ALG_L06_P015_DRAWING.mainFrameCount ||
    P015_TEXT_STATE_SOURCE.controls.length !== 6 ||
    Object.entries(P015_TIMELINE.glossary).some(([key, gate]) =>
      !P015_TEXT_STATE_SOURCE.controls.some(control =>
        control.key === key && control.buttonId === gate.buttonId &&
        control.fullHitFrame === gate.firstFullHitFrame)) ||
    P015_CANVAS_V1.animationId !== ALG_L06_P015_DRAWING.animationId ||
    P015_CANVAS_V1.sourceSwfSha256 !== ALG_L06_P015_DRAWING.sourceSwfSha256 ||
    P015_CANVAS_V1.frameDomain !== ALG_L06_P015_DRAWING.mainFrameDomain ||
    P015_CANVAS_V1.frameCount !== ALG_L06_P015_DRAWING.mainFrameCount ||
    P015_CANVAS_V1.assetSha256 !== ALG_L06_P015_DRAWING.assetSha256)
  throw Error('P015_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate = createSourceStaticCanvasCandidate(ALG_L06_P015_DRAWING);
export default Object.freeze({...candidate.module, maturity: 'private-current-js' as const,
  privateAlgL06P015: Object.freeze({version: 1 as const, drawing: ALG_L06_P015_DRAWING,
    sourceAudio: P015_AUDIO_ASSETS,
    optionalSpanishAudio: P015_OPTIONAL_SPANISH_AUDIO_BINDING,
    textSource: P015_TEXT_STATE_SOURCE,
    glossary: P015_TIMELINE.glossary}),
});
