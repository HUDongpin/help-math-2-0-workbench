/** Source drawing module; maintained audio/text host and formal admission are independent. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P025_DRAWING} from '../timelines/shared-alg001-l06-p025';
import {P025_TIMELINE,P025_NATIVE_PARAGRAPHS} from '../alg-l06-p025-timeline-v1';
import {P025_AUDIO_ASSETS,P025_SA_ASSET,P025_AUDIO_DISPOSITION} from '../alg-l06-p025-audio-schedule-v1';
import {P025_OPTIONAL_SPANISH_AUDIO_BINDING} from '../alg-l06-p025-optional-spanish-audio-v1';
const drawing=ALG_L06_P025_DRAWING,source=P025_TIMELINE;
if(source.animationId!==drawing.animationId||source.sourceSwfSha256!==drawing.sourceSwfSha256||
 source.frameDomain!==drawing.mainFrameDomain||source.mainFrameCount!==299||
 source.glossaryInstances.length!==4||P025_NATIVE_PARAGRAPHS.length!==2||
 P025_AUDIO_ASSETS.length!==1||P025_AUDIO_ASSETS[0].firstBlockFrame!==2||
 P025_AUDIO_ASSETS[0].lastBlockFrame!==299||P025_AUDIO_DISPOSITION.separateSaSpliced!==false||
 P025_AUDIO_DISPOSITION.localeStartsAudio!==false||
 P025_SA_ASSET.sourceSha256!==P025_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256)
 throw Error('P025_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P025:Object.freeze({version:1 as const,drawing,sourceAudio:P025_AUDIO_ASSETS,
  optionalSpanishAudio:P025_OPTIONAL_SPANISH_AUDIO_BINDING,textSource:source,
  nativeParagraphs:P025_NATIVE_PARAGRAPHS,glossaryInstances:source.glossaryInstances})});
