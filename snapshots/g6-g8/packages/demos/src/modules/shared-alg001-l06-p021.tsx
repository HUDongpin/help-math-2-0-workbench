/** Bounded source-backed module entry; formal registry admission is separate. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P021_DRAWING} from '../timelines/shared-alg001-l06-p021';
import {P021_TIMELINE} from '../alg-l06-p021-timeline-v1';
import {P021_AUDIO_ASSETS,P021_SA_ASSET,P021_AUDIO_DISPOSITION}
  from '../alg-l06-p021-audio-schedule-v1';
import {P021_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p021-optional-spanish-audio-v1';
import {P021_TEXT_STATE_SOURCE} from '../generated/alg-l06-p021-text-state-v1';
import P021_CANVAS_V1 from '../../../../output/alg-l06-p021-canvas-v1/canvas-metadata-v1.json';

if(P021_TIMELINE.animationId!==ALG_L06_P021_DRAWING.animationId||
 P021_TIMELINE.sourceSwfSha256!==ALG_L06_P021_DRAWING.sourceSwfSha256||
 P021_TIMELINE.frameDomain!==ALG_L06_P021_DRAWING.mainFrameDomain||
 P021_TIMELINE.mainFrameCount!==ALG_L06_P021_DRAWING.mainFrameCount||
 P021_TIMELINE.rootEntryFrame!==ALG_L06_P021_DRAWING.rootBeginFrame||
 P021_TIMELINE.glossaryInstances.length!==6||
 P021_AUDIO_ASSETS.length!==1||
 P021_AUDIO_DISPOSITION.frameDomain!==ALG_L06_P021_DRAWING.mainFrameDomain||
 P021_AUDIO_DISPOSITION.lastVisualFrame!==ALG_L06_P021_DRAWING.mainFrameCount||
 P021_AUDIO_DISPOSITION.separateSaSpliced!==false||
 P021_AUDIO_DISPOSITION.originalRuntimeAccepted!==false||
 P021_AUDIO_DISPOSITION.listeningAccepted!==false||
 P021_SA_ASSET.sourceSha256!==P021_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 P021_TEXT_STATE_SOURCE.animationId!==ALG_L06_P021_DRAWING.animationId||
 P021_TEXT_STATE_SOURCE.sourceSwfSha256!==ALG_L06_P021_DRAWING.sourceSwfSha256||
 P021_TEXT_STATE_SOURCE.frameDomain!==ALG_L06_P021_DRAWING.mainFrameDomain||
 P021_TEXT_STATE_SOURCE.frameCount!==ALG_L06_P021_DRAWING.mainFrameCount||
 P021_TEXT_STATE_SOURCE.textDefinitions.length!==21||
 P021_TEXT_STATE_SOURCE.glossaryControls.length!==6||
 P021_TEXT_STATE_SOURCE.glossaryControls.some(control=>{
  const expected=P021_TIMELINE.glossaryInstances.find(instance=>
   instance.instanceId===control.sourceButtonInstanceId);
  return !expected||control.key!==expected.key||control.sourceButtonId!==expected.buttonId||
   control.firstCandidateFrame!==expected.availableSpans[0][0]||
   control.sourceLabelTextId!==expected.label.textId||
   control.sourceActionSha256!==expected.sourceActionSha256;
 })||
 P021_TEXT_STATE_SOURCE.policy.canvasGlyphs!=='preserved'||
 P021_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted!==false||
 P021_CANVAS_V1.animationId!==ALG_L06_P021_DRAWING.animationId||
 P021_CANVAS_V1.sourceSwfSha256!==ALG_L06_P021_DRAWING.sourceSwfSha256||
 P021_CANVAS_V1.frameDomain!==ALG_L06_P021_DRAWING.mainFrameDomain||
 P021_CANVAS_V1.frameCount!==ALG_L06_P021_DRAWING.mainFrameCount||
 P021_CANVAS_V1.assetSha256!==ALG_L06_P021_DRAWING.assetSha256||
 P021_CANVAS_V1.sourceGlyphRendering.preserved!==true||
 P021_CANVAS_V1.sourceClipMasks.length!==2||
 P021_CANVAS_V1.sourceGlossaryButtons.length!==6||
 P021_CANVAS_V1.sourceGlossaryButtons.some(button=>
  !P021_TIMELINE.glossaryInstances.some(term=>term.buttonId===button.characterId)))
 throw Error('P021_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(ALG_L06_P021_DRAWING);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P021:Object.freeze({version:1 as const,drawing:ALG_L06_P021_DRAWING,
  sourceAudio:P021_AUDIO_ASSETS,
  optionalSpanishAudio:P021_OPTIONAL_SPANISH_AUDIO_BINDING,
  textSource:P021_TEXT_STATE_SOURCE,
  glossaryInstances:P021_TIMELINE.glossaryInstances}),
});
