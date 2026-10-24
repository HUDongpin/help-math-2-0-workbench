/** Source-bound module; candidate host and formal admission are distinct. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P022_DRAWING} from '../timelines/shared-alg001-l06-p022';
import {P022_TIMELINE} from '../alg-l06-p022-timeline-v1';
import {P022_AUDIO_ASSETS,P022_SA_ASSET,P022_AUDIO_DISPOSITION} from '../alg-l06-p022-audio-schedule-v1';
import {P022_OPTIONAL_SPANISH_AUDIO_BINDING} from '../alg-l06-p022-optional-spanish-audio-v1';
import {P022_TEXT_STATE_SOURCE} from '../generated/alg-l06-p022-text-state-v1';
import CANVAS from '../../../../output/alg-l06-p022-canvas-v1/canvas-metadata-v1.json';
const drawing=ALG_L06_P022_DRAWING,source=P022_TEXT_STATE_SOURCE;
if(P022_TIMELINE.animationId!==drawing.animationId||
 P022_TIMELINE.sourceSwfSha256!==drawing.sourceSwfSha256||
 P022_TIMELINE.frameDomain!==drawing.mainFrameDomain||P022_TIMELINE.mainFrameCount!==422||
 P022_AUDIO_ASSETS.length!==2||P022_AUDIO_ASSETS[0].firstBlockFrame!==2||
 P022_AUDIO_ASSETS[1].firstBlockFrame!==150||
 P022_AUDIO_DISPOSITION.frameDomain!==drawing.mainFrameDomain||
 P022_AUDIO_DISPOSITION.sourceNegativeSeek.frame!==132||
 P022_AUDIO_DISPOSITION.separateSaSpliced!==false||P022_AUDIO_DISPOSITION.localeStartsAudio!==false||
 P022_SA_ASSET.sourceSha256!==P022_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 source.animationId!==drawing.animationId||source.sourceSwfSha256!==drawing.sourceSwfSha256||
 source.frameDomain!==drawing.mainFrameDomain||source.frameCount!==422||
 source.textDefinitions.length!==36||source.textInstances.length!==87||
 source.glossaryControls.length!==6||source.glossaryControls.some(control=>{
  const expected=P022_TIMELINE.glossaryInstances.find(i=>i.instanceId===control.sourceButtonInstanceId);
  return !expected||control.key!==expected.key||control.sourceButtonId!==expected.buttonId||
   control.firstCandidateFrame!==expected.availableSpans[0][0]||
   control.sourceLabelTextId!==expected.label.textId||control.sourceActionSha256!==expected.sourceActionSha256;
 })||source.policy.canvasGlyphs!=='preserved'||source.policy.originalRuntimeAccepted!==false||
 CANVAS.animationId!==drawing.animationId||CANVAS.sourceSwfSha256!==drawing.sourceSwfSha256||
 CANVAS.frameDomain!==drawing.mainFrameDomain||CANVAS.frameCount!==422||
 CANVAS.assetSha256!==drawing.assetSha256||CANVAS.sourceGlyphRendering.preserved!==true||
 CANVAS.sourceClipMasks.length!==3||CANVAS.sourceGlossaryButtons.length!==6)
 throw Error('P022_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P022:Object.freeze({version:1 as const,drawing,sourceAudio:P022_AUDIO_ASSETS,
  optionalSpanishAudio:P022_OPTIONAL_SPANISH_AUDIO_BINDING,textSource:source,
  glossaryInstances:P022_TIMELINE.glossaryInstances})});
