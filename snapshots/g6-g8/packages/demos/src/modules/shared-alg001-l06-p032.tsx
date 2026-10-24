/** Source drawing module; maintained My Lesson independently owns native text/audio. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P032_DRAWING} from '../timelines/shared-alg001-l06-p032';
import {P032_TIMELINE} from '../alg-l06-p032-timeline-v1';
import {P032_MAIN_ASSET,P032_SA_ASSET} from '../alg-l06-p032-audio-schedule-v1';
const drawing=ALG_L06_P032_DRAWING,source=P032_TIMELINE;
if(source.animationId!==drawing.animationId||source.sourceSwfSha256!==drawing.sourceSwfSha256||
 source.frameDomain!==drawing.mainFrameDomain||source.mainFrameCount!==413||source.rootFrameCount!==10||
 source.definitions.length!==9||P032_MAIN_ASSET.sourceSha256!=='2584a692ee3936f02c3dc491872225f020744ce92710f890e1a31d468a75c85b'||
 P032_SA_ASSET.sourceSha256!=='9cdf2402eea05caebc190680eff4b15ee3baada80e366ed4e4ac96df7f3dd478')
 throw Error('P032_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P032:Object.freeze({version:1 as const,drawing,textSource:source,
  sourceAudio:P032_MAIN_ASSET,optionalSpanishAudio:P032_SA_ASSET,
  sourceGlyphSuppression:false,optionalSpanishTrigger:'explicit-user-only' as const})});
