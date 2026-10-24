/** Bounded source-backed module entry; formal registry admission is separate. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P019_DRAWING} from '../timelines/shared-alg001-l06-p019';
import {P019_TIMELINE} from '../alg-l06-p019-timeline-v1';
import {P019_AUDIO_ASSETS,P019_SA_ASSET,P019_AUDIO_DISPOSITION}
  from '../alg-l06-p019-audio-schedule-v1';
import {P019_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p019-optional-spanish-audio-v1';
import {P019_TEXT_STATE_SOURCE} from '../generated/alg-l06-p019-text-state-v1';
import P019_CANVAS_V1 from '../../../../output/alg-l06-p019-canvas-v1/canvas-metadata-v1.json';

if(P019_TIMELINE.animationId!==ALG_L06_P019_DRAWING.animationId||
 P019_TIMELINE.sourceSwfSha256!==ALG_L06_P019_DRAWING.sourceSwfSha256||
 P019_TIMELINE.frameDomain!==ALG_L06_P019_DRAWING.mainFrameDomain||
 P019_TIMELINE.mainFrameCount!==ALG_L06_P019_DRAWING.mainFrameCount||
 P019_TIMELINE.rootEntryFrame!==ALG_L06_P019_DRAWING.rootBeginFrame||
 P019_TIMELINE.glossaryInstances.length!==6||
 P019_AUDIO_ASSETS.length!==1||
 P019_AUDIO_DISPOSITION.frameDomain!==ALG_L06_P019_DRAWING.mainFrameDomain||
 P019_AUDIO_DISPOSITION.lastVisualFrame!==ALG_L06_P019_DRAWING.mainFrameCount||
 P019_AUDIO_DISPOSITION.separateSaSpliced!==false||
 P019_AUDIO_DISPOSITION.originalRuntimeAccepted!==false||
 P019_AUDIO_DISPOSITION.listeningAccepted!==false||
 P019_SA_ASSET.sourceSha256!==P019_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 P019_TEXT_STATE_SOURCE.animationId!==ALG_L06_P019_DRAWING.animationId||
 P019_TEXT_STATE_SOURCE.sourceSwfSha256!==ALG_L06_P019_DRAWING.sourceSwfSha256||
 P019_TEXT_STATE_SOURCE.frameDomain!==ALG_L06_P019_DRAWING.mainFrameDomain||
 P019_TEXT_STATE_SOURCE.frameCount!==ALG_L06_P019_DRAWING.mainFrameCount||
 P019_TEXT_STATE_SOURCE.textDefinitions.length!==15||
 P019_TEXT_STATE_SOURCE.glossaryControls.length!==6||
 P019_TEXT_STATE_SOURCE.glossaryControls.some(control=>{
  const expected=P019_TIMELINE.glossaryInstances.find(instance=>
   instance.instanceId===control.sourceButtonInstanceId);
  return !expected||control.key!==expected.key||control.sourceButtonId!==expected.buttonId||
   control.firstCandidateFrame!==expected.availableSpans[0][0]||
   control.sourceLabelTextId!==expected.label.textId||
   control.sourceActionSha256!==expected.sourceActionSha256;
 })||
 P019_TEXT_STATE_SOURCE.policy.canvasGlyphs!=='preserved'||
 P019_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted!==false||
 P019_CANVAS_V1.animationId!==ALG_L06_P019_DRAWING.animationId||
 P019_CANVAS_V1.sourceSwfSha256!==ALG_L06_P019_DRAWING.sourceSwfSha256||
 P019_CANVAS_V1.frameDomain!==ALG_L06_P019_DRAWING.mainFrameDomain||
 P019_CANVAS_V1.frameCount!==ALG_L06_P019_DRAWING.mainFrameCount||
 P019_CANVAS_V1.assetSha256!==ALG_L06_P019_DRAWING.assetSha256||
 P019_CANVAS_V1.sourceGlyphRendering.preserved!==true||
 P019_CANVAS_V1.sourceClipMasks.length!==4||
 P019_CANVAS_V1.sourceGlossaryButtons.length!==6||
 P019_CANVAS_V1.sourceGlossaryButtons.some(button=>
  !P019_TIMELINE.glossaryInstances.some(term=>term.buttonId===button.characterId)))
 throw Error('P019_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(ALG_L06_P019_DRAWING);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P019:Object.freeze({version:1 as const,drawing:ALG_L06_P019_DRAWING,
  sourceAudio:P019_AUDIO_ASSETS,
  optionalSpanishAudio:P019_OPTIONAL_SPANISH_AUDIO_BINDING,
  textSource:P019_TEXT_STATE_SOURCE,
  glossaryInstances:P019_TIMELINE.glossaryInstances}),
});
