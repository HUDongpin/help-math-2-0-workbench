/** Bounded source-backed module entry; formal registry admission is separate. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P018_DRAWING} from '../timelines/shared-alg001-l06-p018';
import {P018_TIMELINE} from '../alg-l06-p018-timeline-v1';
import {P018_AUDIO_ASSETS,P018_SA_ASSET,P018_AUDIO_DISPOSITION}
  from '../alg-l06-p018-audio-schedule-v1';
import {P018_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p018-optional-spanish-audio-v1';
import {P018_TEXT_STATE_SOURCE} from '../generated/alg-l06-p018-text-state-v1';
import P018_CANVAS_V1 from '../../../../output/alg-l06-p018-canvas-v1/canvas-metadata-v1.json';

if(P018_TIMELINE.animationId!==ALG_L06_P018_DRAWING.animationId||
 P018_TIMELINE.sourceSwfSha256!==ALG_L06_P018_DRAWING.sourceSwfSha256||
 P018_TIMELINE.frameDomain!==ALG_L06_P018_DRAWING.mainFrameDomain||
 P018_TIMELINE.mainFrameCount!==ALG_L06_P018_DRAWING.mainFrameCount||
 P018_TIMELINE.rootEntryFrame!==ALG_L06_P018_DRAWING.rootBeginFrame||
 P018_TIMELINE.glossaryInstances.length!==7||
 P018_AUDIO_ASSETS.length!==1||
 P018_AUDIO_DISPOSITION.frameDomain!==ALG_L06_P018_DRAWING.mainFrameDomain||
 P018_AUDIO_DISPOSITION.lastVisualFrame!==ALG_L06_P018_DRAWING.mainFrameCount||
 P018_AUDIO_DISPOSITION.separateSaSpliced!==false||
 P018_AUDIO_DISPOSITION.originalRuntimeAccepted!==false||
 P018_AUDIO_DISPOSITION.listeningAccepted!==false||
 P018_SA_ASSET.sourceSha256!==P018_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 P018_TEXT_STATE_SOURCE.animationId!==ALG_L06_P018_DRAWING.animationId||
 P018_TEXT_STATE_SOURCE.sourceSwfSha256!==ALG_L06_P018_DRAWING.sourceSwfSha256||
 P018_TEXT_STATE_SOURCE.frameDomain!==ALG_L06_P018_DRAWING.mainFrameDomain||
 P018_TEXT_STATE_SOURCE.frameCount!==ALG_L06_P018_DRAWING.mainFrameCount||
 P018_TEXT_STATE_SOURCE.textDefinitions.length!==17||
 P018_TEXT_STATE_SOURCE.glossaryControls.length!==7||
 P018_TEXT_STATE_SOURCE.glossaryControls.some(control=>{
  const expected=P018_TIMELINE.glossaryInstances.find(instance=>
   instance.instanceId===control.sourceButtonInstanceId);
  return !expected||control.key!==expected.key||control.sourceButtonId!==expected.buttonId||
   control.firstCandidateFrame!==expected.availableSpans[0][0]||
   control.sourceLabelTextId!==expected.label.textId||
   control.sourceActionSha256!==expected.sourceActionSha256;
 })||
 P018_TEXT_STATE_SOURCE.policy.canvasGlyphs!=='preserved'||
 P018_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted!==false||
 P018_CANVAS_V1.animationId!==ALG_L06_P018_DRAWING.animationId||
 P018_CANVAS_V1.sourceSwfSha256!==ALG_L06_P018_DRAWING.sourceSwfSha256||
 P018_CANVAS_V1.frameDomain!==ALG_L06_P018_DRAWING.mainFrameDomain||
 P018_CANVAS_V1.frameCount!==ALG_L06_P018_DRAWING.mainFrameCount||
 P018_CANVAS_V1.assetSha256!==ALG_L06_P018_DRAWING.assetSha256||
 P018_CANVAS_V1.sourceGlyphRendering.preserved!==true||
 P018_CANVAS_V1.sourceClipMasks.length!==4||
 P018_CANVAS_V1.sourceGlossaryButtons.length!==5||
 P018_CANVAS_V1.sourceGlossaryButtons.some(button=>
  !P018_TIMELINE.glossaryInstances.some(term=>term.buttonId===button.characterId)))
 throw Error('P018_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(ALG_L06_P018_DRAWING);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P018:Object.freeze({version:1 as const,drawing:ALG_L06_P018_DRAWING,
  sourceAudio:P018_AUDIO_ASSETS,
  optionalSpanishAudio:P018_OPTIONAL_SPANISH_AUDIO_BINDING,
  textSource:P018_TEXT_STATE_SOURCE,
  glossaryInstances:P018_TIMELINE.glossaryInstances}),
});
