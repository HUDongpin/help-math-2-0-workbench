/** Source drawing entry for P020. Quiz, branch audio and SA remain in the maintained player. */
'use client';
import {createSourceStaticCanvasCandidate, type SourceStaticCanvasCandidateConfig}
  from '../source-static-canvas-candidate';
import {P020_TIMELINE} from '../alg-l06-p020-timeline-v1';
import {P020_AUDIO_ASSETS,P020_SA_ASSET,P020_AUDIO_DISPOSITION}
  from '../alg-l06-p020-audio-schedule-v1';
import {P020_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p020-optional-spanish-audio-v1';
import {P020_TEXT_STATE_SOURCE} from '../generated/alg-l06-p020-text-state-v1';
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
 P020_TIMELINE.quizHoldFrame!==58||
 P020_AUDIO_ASSETS.length!==8||
 P020_AUDIO_DISPOSITION.mainDomain!=='sprite-162'||
 P020_AUDIO_DISPOSITION.quizStopFrame!==58||
 P020_AUDIO_DISPOSITION.mainResumeFrame!==59||
 P020_AUDIO_DISPOSITION.feedbackStreamsConcatenated!==false||
 P020_AUDIO_DISPOSITION.separateSaSpliced!==false||
 P020_SA_ASSET.sourceSha256!==P020_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
 P020_TEXT_STATE_SOURCE.animationId!==ALG_L06_P020_DRAWING.animationId||
 P020_TEXT_STATE_SOURCE.sourceSwfSha256!==ALG_L06_P020_DRAWING.sourceSwfSha256||
 P020_TEXT_STATE_SOURCE.frameDomain!==ALG_L06_P020_DRAWING.mainFrameDomain||
 P020_TEXT_STATE_SOURCE.frameCount!==172||
 P020_TEXT_STATE_SOURCE.glossaryControls.length!==3||
 P020_TEXT_STATE_SOURCE.feedback.domains.length!==7||
 P020_TEXT_STATE_SOURCE.policy.canvasGlyphs!=='preserved'||
 P020_TEXT_STATE_SOURCE.policy.originalRuntimeAccepted!==false||
 canvas.animationId!==ALG_L06_P020_DRAWING.animationId||
 canvas.sourceSwfSha256!==ALG_L06_P020_DRAWING.sourceSwfSha256||
 canvas.assetSha256!==ALG_L06_P020_DRAWING.assetSha256||
 canvas.frameDomain!=='sprite-162'||canvas.frameCount!==172||
 canvas.sourceMainStopFrame!==58||
 canvas.sourceGlyphRendering.preservedStatic!==true||
 Object.keys(canvas.feedbackDomains).length!==7)
 throw Error('P020_DRAWING_BRANCH_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(ALG_L06_P020_DRAWING);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P020:Object.freeze({version:1 as const,drawing:ALG_L06_P020_DRAWING,
  sourceAudio:P020_AUDIO_ASSETS,optionalSpanishAudio:P020_OPTIONAL_SPANISH_AUDIO_BINDING,
  textSource:P020_TEXT_STATE_SOURCE,glossary:P020_TIMELINE.glossary,
  quiz:P020_TIMELINE.answers,acknowledgmentActions:P020_TIMELINE.acknowledgmentActions}),
});
