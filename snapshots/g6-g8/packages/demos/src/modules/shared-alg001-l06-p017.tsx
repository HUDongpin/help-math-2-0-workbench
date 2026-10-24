/** Bounded source-backed module entry; formal registry admission is separate. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P017_DRAWING} from '../timelines/shared-alg001-l06-p017';
import {P017_TIMELINE} from '../alg-l06-p017-timeline-v1';
import {P017_AUDIO_ASSETS,P017_SA_ASSET,P017_AUDIO_DISPOSITION}
  from '../alg-l06-p017-audio-schedule-v1';
import {P017_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p017-optional-spanish-audio-v1';
import {P017_TEXT_STATE_SOURCE} from '../generated/alg-l06-p017-text-state-v1';
import P017_CANVAS_V1 from '../../../../output/alg-l06-p017-canvas-v1/canvas-metadata-v1.json';

if(P017_TIMELINE.animationId!==ALG_L06_P017_DRAWING.animationId||
 P017_TIMELINE.sourceSwfSha256!==ALG_L06_P017_DRAWING.sourceSwfSha256||
 P017_TIMELINE.frameDomain!==ALG_L06_P017_DRAWING.mainFrameDomain||
 P017_TIMELINE.mainFrameCount!==ALG_L06_P017_DRAWING.mainFrameCount||
 P017_TIMELINE.rootEntryFrame!==ALG_L06_P017_DRAWING.rootBeginFrame||
 Object.keys(P017_TIMELINE.glossary).length!==6||
 P017_AUDIO_ASSETS.length!==1||
 P017_AUDIO_DISPOSITION.frameDomain!==ALG_L06_P017_DRAWING.mainFrameDomain||
 P017_AUDIO_DISPOSITION.lastVisualFrame!==ALG_L06_P017_DRAWING.mainFrameCount||
 P017_AUDIO_DISPOSITION.separateSaSpliced!==false||
 P017_AUDIO_DISPOSITION.originalRuntimeAccepted!==false||
 P017_AUDIO_DISPOSITION.listeningAccepted!==false||
 P017_SA_ASSET.sourceSha256!==P017_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 P017_TEXT_STATE_SOURCE.animationId!==ALG_L06_P017_DRAWING.animationId||
 P017_TEXT_STATE_SOURCE.sourceSwfSha256!==ALG_L06_P017_DRAWING.sourceSwfSha256||
 P017_TEXT_STATE_SOURCE.frameDomain!==ALG_L06_P017_DRAWING.mainFrameDomain||
 P017_TEXT_STATE_SOURCE.frameCount!==ALG_L06_P017_DRAWING.mainFrameCount||
 P017_TEXT_STATE_SOURCE.textDefinitions.length!==20||
 P017_TEXT_STATE_SOURCE.glossaryControls.length!==6||
 P017_TEXT_STATE_SOURCE.glossaryControls.some(control=>{
  const expected=P017_TIMELINE.glossary[control.key];
  return !expected||control.sourceButtonId!==expected.buttonId||
   control.firstCandidateFrame!==expected.firstAvailableFrame||
   control.firstFullHitFrame!==expected.firstFullHitFrame||
   control.sourceActionSha256!==expected.sourceActionSha256;
 })||
 P017_TEXT_STATE_SOURCE.policy.canvasGlyphs!=='preserved'||
 P017_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted!==false||
 P017_CANVAS_V1.animationId!==ALG_L06_P017_DRAWING.animationId||
 P017_CANVAS_V1.sourceSwfSha256!==ALG_L06_P017_DRAWING.sourceSwfSha256||
 P017_CANVAS_V1.frameDomain!==ALG_L06_P017_DRAWING.mainFrameDomain||
 P017_CANVAS_V1.frameCount!==ALG_L06_P017_DRAWING.mainFrameCount||
 P017_CANVAS_V1.assetSha256!==ALG_L06_P017_DRAWING.assetSha256||
 P017_CANVAS_V1.sourceGlyphRendering.preserved!==true||
 P017_CANVAS_V1.sourceClipMasks.length!==5||
 P017_CANVAS_V1.sourceGlossaryButtons.length!==6||
 P017_CANVAS_V1.sourceGlossaryButtons.some(button=>
  !Object.values(P017_TIMELINE.glossary).some(term=>term.buttonId===button.characterId)))
 throw Error('P017_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(ALG_L06_P017_DRAWING);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P017:Object.freeze({version:1 as const,drawing:ALG_L06_P017_DRAWING,
  sourceAudio:P017_AUDIO_ASSETS,
  optionalSpanishAudio:P017_OPTIONAL_SPANISH_AUDIO_BINDING,
  textSource:P017_TEXT_STATE_SOURCE,
  glossary:P017_TIMELINE.glossary}),
});
