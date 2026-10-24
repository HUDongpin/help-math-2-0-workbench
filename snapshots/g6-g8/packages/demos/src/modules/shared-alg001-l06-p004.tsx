/** Bounded module contract; proof and registry admission are separate operations. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {P004_CONTINUOUS_AUDIO} from '../alg-l06-p004-continuous-audio-schedule-v1';
import {P004_OPTIONAL_SPANISH_AUDIO_BINDING} from '../alg-l06-p004-optional-spanish-audio-v1';
import {P004_TEXT_PROVENANCE} from '../alg-l06-p004-text-v1';
import {P004_SOURCE_SHA256} from '../alg-l06-p004-glossary-state-v1';
import {P004_HIT_REGIONS} from '../alg-l06-p004-hit-regions.generated';
import {ALG_L06_P004_DRAWING} from '../timelines/shared-alg001-l06-p004';
import {createAlgL06P004TextPresentationV1} from '../alg-l06-p004-text-presentation-v1';
import {P004_SEMANTIC_TEXT_BINDING} from '../alg-l06-p004-semantic-text-v1';

if (P004_CONTINUOUS_AUDIO.animationId !== ALG_L06_P004_DRAWING.animationId ||
    P004_CONTINUOUS_AUDIO.sourceSwfSha256 !== ALG_L06_P004_DRAWING.sourceSwfSha256 ||
    P004_CONTINUOUS_AUDIO.frameDomain !== ALG_L06_P004_DRAWING.mainFrameDomain ||
    P004_CONTINUOUS_AUDIO.lastFrame !== ALG_L06_P004_DRAWING.mainFrameCount ||
    P004_CONTINUOUS_AUDIO.fps !== ALG_L06_P004_DRAWING.fps ||
    P004_TEXT_PROVENANCE.animationId !== ALG_L06_P004_DRAWING.animationId ||
    P004_TEXT_PROVENANCE.sourceSwfSha256 !== ALG_L06_P004_DRAWING.sourceSwfSha256 ||
    P004_TEXT_PROVENANCE.frameDomain !== ALG_L06_P004_DRAWING.mainFrameDomain ||
    P004_TEXT_PROVENANCE.frames !== ALG_L06_P004_DRAWING.mainFrameCount ||
    P004_SOURCE_SHA256 !== ALG_L06_P004_DRAWING.sourceSwfSha256 ||
    P004_HIT_REGIONS.length !== 9 ||
    P004_HIT_REGIONS.some(region => region.firstFrame < 1 ||
      region.lastFrame > ALG_L06_P004_DRAWING.mainFrameCount ||
      region.firstFrame > region.lastFrame))
  throw Error('P004_DRAWING_AUDIO_TEXT_GLOSSARY_IDENTITY_MISMATCH');

const candidate = createSourceStaticCanvasCandidate(ALG_L06_P004_DRAWING);
if (P004_SEMANTIC_TEXT_BINDING.animationId !== candidate.module.key ||
    P004_SEMANTIC_TEXT_BINDING.sourceSwfSha256 !== ALG_L06_P004_DRAWING.sourceSwfSha256)
  throw Error('P004_NATIVE_TEXT_DRAWING_IDENTITY_MISMATCH');

/** `private-current-js` describes module eligibility, never an active registry row. */
export default Object.freeze({
  ...candidate.module,
  // Preserve the original drawing Renderer for source capture. The opted-in
  // presentation composes that drawing with the same native snapshot as My Lesson.
  textPresentation: createAlgL06P004TextPresentationV1(candidate.module.Renderer),
  maturity: 'private-current-js' as const,
  privateAlgL06P004: Object.freeze({
    version: 1 as const,
    drawing: ALG_L06_P004_DRAWING,
    sourceAudio: P004_CONTINUOUS_AUDIO,
    optionalSpanishAudio: P004_OPTIONAL_SPANISH_AUDIO_BINDING,
    // Source text inventory only; native typography binding is still partial.
    sourceTextInventory: P004_TEXT_PROVENANCE,
    glossaryOccurrenceCount: P004_HIT_REGIONS.length,
  }),
});
