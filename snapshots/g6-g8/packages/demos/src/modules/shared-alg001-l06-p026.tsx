/** Source-locked drawing module; local My Lesson owns audio/text interaction. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P026_DRAWING} from '../timelines/shared-alg001-l06-p026';
import {P026_TIMELINE} from '../alg-l06-p026-timeline-v1';
import {P026_AUDIO_ASSETS,P026_SA_ASSET,P026_AUDIO_DISPOSITION,P026_BROWSER_BINDINGS,
 P026_SA_BROWSER_BINDING} from '../alg-l06-p026-audio-schedule-v1';
const drawing=ALG_L06_P026_DRAWING,source=P026_TIMELINE;
if(source.animationId!==drawing.animationId||source.sourceSwfSha256!==drawing.sourceSwfSha256||
 source.frameDomain!==drawing.mainFrameDomain||source.mainFrameCount!==389||source.rootFrameCount!==10||
 source.glossary.length!==20||source.definitions.length!==31||P026_AUDIO_ASSETS.length!==2||
 P026_AUDIO_ASSETS[0].firstBlockFrame!==31||P026_AUDIO_ASSETS[0].lastBlockFrame!==158||
 P026_AUDIO_ASSETS[1].firstBlockFrame!==196||P026_AUDIO_ASSETS[1].lastBlockFrame!==389||
 P026_AUDIO_DISPOSITION.mainRangesConcatenated!==false||P026_AUDIO_DISPOSITION.syntheticSilenceAdded!==false||
 P026_AUDIO_DISPOSITION.separateSaSpliced!==false||P026_AUDIO_DISPOSITION.localeStartsAudio!==false||
 P026_SA_ASSET.sourceSha256!==P026_SA_BROWSER_BINDING.sourceSha256)
 throw Error('P026_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P026:Object.freeze({version:1 as const,drawing,sourceAudio:P026_AUDIO_ASSETS,
  browserBindings:P026_BROWSER_BINDINGS,optionalSpanishAudio:P026_SA_BROWSER_BINDING,
  textSource:source,glossaryInstances:source.glossary})});
