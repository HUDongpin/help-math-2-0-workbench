/** Source-bound module; candidate host and formal admission are distinct. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P023_DRAWING} from '../timelines/shared-alg001-l06-p023';
import {P023_TIMELINE} from '../alg-l06-p023-timeline-v1';
import {P023_AUDIO_ASSETS,P023_SA_ASSET,P023_AUDIO_DISPOSITION} from '../alg-l06-p023-audio-schedule-v1';
import {P023_OPTIONAL_SPANISH_AUDIO_BINDING} from '../alg-l06-p023-optional-spanish-audio-v1';
import {P023_TEXT_STATE_SOURCE} from '../alg-l06-p023-native-text-v1';
import CANVAS from '../../../../output/alg-l06-p023-canvas-v1/canvas-metadata-v1.json';
const drawing=ALG_L06_P023_DRAWING,source=P023_TEXT_STATE_SOURCE;
if(P023_TIMELINE.animationId!==drawing.animationId||
 P023_TIMELINE.sourceSwfSha256!==drawing.sourceSwfSha256||
 P023_TIMELINE.frameDomain!==drawing.mainFrameDomain||P023_TIMELINE.mainFrameCount!==410||
 P023_AUDIO_ASSETS.length!==1||P023_AUDIO_ASSETS[0].firstBlockFrame!==11||
 P023_AUDIO_ASSETS[0].lastBlockFrame!==410||
 P023_AUDIO_DISPOSITION.frameDomain!==drawing.mainFrameDomain||
 P023_AUDIO_DISPOSITION.sourceHasNegativeSeek!==false||
 P023_AUDIO_DISPOSITION.separateSaSpliced!==false||P023_AUDIO_DISPOSITION.localeStartsAudio!==false||
 P023_SA_ASSET.sourceSha256!==P023_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 source.animationId!==drawing.animationId||source.sourceSwfSha256!==drawing.sourceSwfSha256||
 source.frameDomain!==drawing.mainFrameDomain||source.frameCount!==410||
 source.textDefinitions.length!==21||source.textInstances.length!==56||
 source.glossaryControls.length!==4||source.glossaryControls.some(control=>{
  const expected=P023_TIMELINE.glossaryInstances.find(i=>i.instanceId===control.sourceButtonInstanceId);
  return !expected||control.key!==expected.key||control.sourceButtonId!==expected.buttonId||
   control.firstCandidateFrame!==expected.availableSpans[0][0]||
   control.sourceLabelTextId!==expected.label.textId||control.sourceActionSha256!==expected.sourceActionSha256;
 })||source.policy.canvasGlyphs!=='preserved'||source.policy.originalRuntimeAccepted!==false||
 source.reading.tableFirstCompleteFrame!==173||source.reading.setFirstOrderedFrame!==401||
 source.reading.setTokenInstanceIds.length!==7||
 CANVAS.animationId!==drawing.animationId||CANVAS.sourceSwfSha256!==drawing.sourceSwfSha256||
 CANVAS.frameDomain!==drawing.mainFrameDomain||CANVAS.frameCount!==410||
 CANVAS.assetSha256!==drawing.assetSha256||CANVAS.sourceGlyphRendering.preserved!==true||
 CANVAS.sourceClipMasks.length!==1||CANVAS.sourceMorphCharacterIds.length!==0||
 CANVAS.sourceGlossaryButtons.length!==4)
 throw Error('P023_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P023:Object.freeze({version:1 as const,drawing,sourceAudio:P023_AUDIO_ASSETS,
  optionalSpanishAudio:P023_OPTIONAL_SPANISH_AUDIO_BINDING,textSource:source,
  glossaryInstances:P023_TIMELINE.glossaryInstances})});
