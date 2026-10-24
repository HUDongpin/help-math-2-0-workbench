/** Canonical source drawing artifact; the maintained P020 clock owns quiz/branch/SA behavior. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';
import {P020_TIMELINE} from '../alg-l06-p020-timeline-v1';
import canvas from '../../../../output/alg-l06-p020-canvas-v1/canvas-metadata-v1.json';

export const ALG_L06_P020_DRAWING={
 animationId:'shared-alg001-l06-p020',title:'Input and Output',
 sourceSwfSha256:'6d0df40af188c98b77a7419b89223c922200723ce106240a6d08e49891a5d25f',
 assetSource:'/flash-assets/g678-local/shared-alg001-l06-p020/canvas-renderer.js',
 assetSha256:'24223de75354e7d58dc197bf350ccea41af142b9eac715b28e449876f7548331',
 stage:{width:800,height:600,backgroundColor:'#b8d8f7'},
 nativeStage:{width:800,height:600,backgroundColor:'#b8d8f7'},
 backingStage:{width:800,height:600},
 fps:12,rootFrameCount:10,rootBeginFrame:6,mainFrameDomain:'sprite-162',
 mainFrameCount:172,livePlaybackEndFrame:172,playbackMode:'once',
 strictCaptureIdentity:true,companionDomains:[],blockedFrameRanges:[],
 visualMarkers:[{id:'sprite-162-source-drawing',firstFrame:1,lastFrame:172}],
 showEngineeringDisclosure:false,
} as const satisfies SourceStaticCanvasCandidateConfig;

if(P020_TIMELINE.animationId!==ALG_L06_P020_DRAWING.animationId||
 P020_TIMELINE.sourceSwfSha256!==ALG_L06_P020_DRAWING.sourceSwfSha256||
 P020_TIMELINE.frameDomain!==ALG_L06_P020_DRAWING.mainFrameDomain||
 P020_TIMELINE.mainFrameCount!==ALG_L06_P020_DRAWING.mainFrameCount||
 P020_TIMELINE.rootEntryFrame!==ALG_L06_P020_DRAWING.rootBeginFrame||
 P020_TIMELINE.quizHoldFrame!==58||
 Object.keys(P020_TIMELINE.glossary).length!==3||
 canvas.animationId!==ALG_L06_P020_DRAWING.animationId||
 canvas.sourceSwfSha256!==ALG_L06_P020_DRAWING.sourceSwfSha256||
 canvas.frameDomain!==ALG_L06_P020_DRAWING.mainFrameDomain||
 canvas.frameCount!==ALG_L06_P020_DRAWING.mainFrameCount||
 canvas.sourceMainStopFrame!==P020_TIMELINE.quizHoldFrame||
 canvas.assetSha256!==ALG_L06_P020_DRAWING.assetSha256||
 Object.keys(canvas.feedbackDomains).length!==7)
 throw Error('P020_CANONICAL_TIMELINE_SOURCE_MISMATCH');
