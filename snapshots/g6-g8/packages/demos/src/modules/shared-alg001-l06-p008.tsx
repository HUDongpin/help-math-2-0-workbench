'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P008_DRAWING} from '../timelines/shared-alg001-l06-p008';
import {P008_CONTINUOUS_AUDIO} from '../alg-l06-p008-audio-schedule-v1';
import {P008_OPTIONAL_SPANISH_AUDIO_BINDING} from '../alg-l06-p008-optional-spanish-audio-v1';
import {P008_NATIVE_TEXT_BINDING} from '../alg-l06-p008-native-text-v1';

if (P008_CONTINUOUS_AUDIO.animationId !== ALG_L06_P008_DRAWING.animationId ||
    P008_CONTINUOUS_AUDIO.sourceSwfSha256 !== ALG_L06_P008_DRAWING.sourceSwfSha256 ||
    P008_CONTINUOUS_AUDIO.frameDomain !== ALG_L06_P008_DRAWING.mainFrameDomain ||
    P008_CONTINUOUS_AUDIO.lastFrame !== ALG_L06_P008_DRAWING.mainFrameCount ||
    P008_CONTINUOUS_AUDIO.fps !== ALG_L06_P008_DRAWING.fps ||
    P008_NATIVE_TEXT_BINDING.sourceSwfSha256 !== ALG_L06_P008_DRAWING.sourceSwfSha256 ||
    P008_NATIVE_TEXT_BINDING.animationId !== ALG_L06_P008_DRAWING.animationId ||
    P008_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256 !== P008_CONTINUOUS_AUDIO.sourceSaSha256)
  throw Error('P008_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate = createSourceStaticCanvasCandidate(ALG_L06_P008_DRAWING);
/** Eligibility only; this does not insert a registry row or confer acceptance. */
export default Object.freeze({...candidate.module, maturity: 'private-current-js' as const,
  privateAlgL06P008: Object.freeze({version: 1 as const, drawing: ALG_L06_P008_DRAWING,
    sourceAudio: P008_CONTINUOUS_AUDIO, optionalSpanishAudio: P008_OPTIONAL_SPANISH_AUDIO_BINDING,
    nativeTextBinding: P008_NATIVE_TEXT_BINDING}),
});
