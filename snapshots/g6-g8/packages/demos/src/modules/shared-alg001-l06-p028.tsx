/** Source-locked drawing module; maintained My Lesson owns text and audio. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P028_DRAWING} from '../timelines/shared-alg001-l06-p028';
import {P028_TIMELINE} from '../alg-l06-p028-timeline-v1';
import {P028_MAIN_ASSET,P028_SA_ASSET} from '../alg-l06-p028-audio-schedule-v1';
const drawing=ALG_L06_P028_DRAWING,source=P028_TIMELINE;
if(source.animationId!==drawing.animationId||source.sourceSwfSha256!==drawing.sourceSwfSha256||
 source.frameDomain!==drawing.mainFrameDomain||source.mainFrameCount!==134||source.rootFrameCount!==10||
 source.definitions.length!==21||P028_MAIN_ASSET.sourceSha256!=='4f6453056b67a9eb37859eba02a0f0c31d1619d50fd7c83863c55f0fd7c41a70'||
 P028_SA_ASSET.sourceSha256!=='f056221dc3c4251538c3a1d2c201bec5abe92c18a58f6ce1d185a8a6cf6703cf')
 throw Error('P028_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P028:Object.freeze({version:1 as const,drawing,textSource:source,
  sourceAudio:P028_MAIN_ASSET,optionalSpanishAudio:P028_SA_ASSET,
  sourceGlyphSuppression:false,optionalSpanishTrigger:'explicit-user-only' as const})});
