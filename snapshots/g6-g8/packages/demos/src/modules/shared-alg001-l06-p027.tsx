/** Source-locked drawing module; maintained My Lesson owns text and audio. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P027_DRAWING} from '../timelines/shared-alg001-l06-p027';
import {P027_TIMELINE} from '../alg-l06-p027-timeline-v1';
import {P027_MAIN_ASSET,P027_SA_ASSET} from '../alg-l06-p027-audio-schedule-v1';
const drawing=ALG_L06_P027_DRAWING,source=P027_TIMELINE;
if(source.animationId!==drawing.animationId||source.sourceSwfSha256!==drawing.sourceSwfSha256||
 source.frameDomain!==drawing.mainFrameDomain||source.mainFrameCount!==770||source.rootFrameCount!==10||
 source.definitions.length!==17||P027_MAIN_ASSET.sourceSha256!=='8b2d1bf09c88647b4799108ad85ff563e744cc899226d1bb1b07ee1cc5551929'||
 P027_SA_ASSET.sourceSha256!=='445005ae7c0a6f4896c686ad46c35e56847e4e977b991d5aa40add7a5e271cc0')
 throw Error('P027_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P027:Object.freeze({version:1 as const,drawing,textSource:source,
  sourceAudio:P027_MAIN_ASSET,optionalSpanishAudio:P027_SA_ASSET,
  sourceGlyphSuppression:false,optionalSpanishTrigger:'explicit-user-only' as const})});
