/** Bounded source-backed module entry; formal registry admission is separate. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P016_DRAWING} from '../timelines/shared-alg001-l06-p016';
import {P016_TIMELINE} from '../alg-l06-p016-timeline-v1';
import {P016_AUDIO_ASSETS,P016_SA_ASSET,P016_AUDIO_DISPOSITION}
  from '../alg-l06-p016-audio-schedule-v1';
import {P016_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p016-optional-spanish-audio-v1';
import {P016_TEXT_STATE_SOURCE} from '../generated/alg-l06-p016-text-state-v1';
import P016_CANVAS_V1 from '../../../../output/alg-l06-p016-canvas-v1/canvas-metadata-v1.json';

if(P016_TIMELINE.animationId!==ALG_L06_P016_DRAWING.animationId||
 P016_TIMELINE.sourceSwfSha256!==ALG_L06_P016_DRAWING.sourceSwfSha256||
 P016_TIMELINE.frameDomain!==ALG_L06_P016_DRAWING.mainFrameDomain||
 P016_TIMELINE.mainFrameCount!==ALG_L06_P016_DRAWING.mainFrameCount||
 P016_TIMELINE.rootEntryFrame!==ALG_L06_P016_DRAWING.rootBeginFrame||
 P016_TIMELINE.glossary.Function.buttonId!==10||
 P016_TIMELINE.glossary.Function.firstAvailableFrame!==72||
 P016_TIMELINE.glossary.Function.firstFullHitFrame!==null||
 P016_AUDIO_ASSETS.length!==2||
 P016_AUDIO_DISPOSITION.frameDomain!==ALG_L06_P016_DRAWING.mainFrameDomain||
 P016_AUDIO_DISPOSITION.lastVisualFrame!==ALG_L06_P016_DRAWING.mainFrameCount||
 P016_AUDIO_DISPOSITION.separateSaSpliced!==false||
 P016_AUDIO_DISPOSITION.originalRuntimeAccepted!==false||
 P016_AUDIO_DISPOSITION.listeningAccepted!==false||
 P016_SA_ASSET.sourceSha256!==P016_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 P016_TEXT_STATE_SOURCE.animationId!==ALG_L06_P016_DRAWING.animationId||
 P016_TEXT_STATE_SOURCE.sourceSwfSha256!==ALG_L06_P016_DRAWING.sourceSwfSha256||
 P016_TEXT_STATE_SOURCE.frameDomain!==ALG_L06_P016_DRAWING.mainFrameDomain||
 P016_TEXT_STATE_SOURCE.frameCount!==ALG_L06_P016_DRAWING.mainFrameCount||
 P016_TEXT_STATE_SOURCE.textDefinitions.length!==19||
 P016_TEXT_STATE_SOURCE.functionControl.sourceButtonId!==
  P016_TIMELINE.glossary.Function.buttonId||
 P016_TEXT_STATE_SOURCE.functionControl.firstCandidateFrame!==
  P016_TIMELINE.glossary.Function.firstAvailableFrame||
 P016_TEXT_STATE_SOURCE.functionControl.firstFullHitFrame!==null||
 P016_TEXT_STATE_SOURCE.functionControl.sourceActionSha256!==
  P016_TIMELINE.glossary.Function.sourceActionSha256||
 P016_TEXT_STATE_SOURCE.policy.canvasGlyphs!=='preserved'||
 P016_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted!==false||
 P016_CANVAS_V1.animationId!==ALG_L06_P016_DRAWING.animationId||
 P016_CANVAS_V1.sourceSwfSha256!==ALG_L06_P016_DRAWING.sourceSwfSha256||
 P016_CANVAS_V1.frameDomain!==ALG_L06_P016_DRAWING.mainFrameDomain||
 P016_CANVAS_V1.frameCount!==ALG_L06_P016_DRAWING.mainFrameCount||
 P016_CANVAS_V1.assetSha256!==ALG_L06_P016_DRAWING.assetSha256||
 P016_CANVAS_V1.sourceGlyphRendering.preserved!==true||
 P016_CANVAS_V1.sourceClipMasks.length!==7||
 P016_CANVAS_V1.sourceGlossaryButtons.length!==1||
 P016_CANVAS_V1.sourceGlossaryButtons[0].characterId!==10)
 throw Error('P016_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(ALG_L06_P016_DRAWING);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P016:Object.freeze({version:1 as const,drawing:ALG_L06_P016_DRAWING,
  sourceAudio:P016_AUDIO_ASSETS,
  optionalSpanishAudio:P016_OPTIONAL_SPANISH_AUDIO_BINDING,
  textSource:P016_TEXT_STATE_SOURCE,
  glossary:P016_TIMELINE.glossary}),
});
