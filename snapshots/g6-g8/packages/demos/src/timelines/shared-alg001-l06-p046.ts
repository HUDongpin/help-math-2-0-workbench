/** P046 source drawing contract; the maintained page owns quiz and audio state. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P046_DRAWING = {
  animationId:'shared-alg001-l06-p046',
  title:'Understanding Functions: Try It! — Question 5',
  sourceSwfSha256:'c69f1f0fdaff0201af171aaee6b9b90a33b483e8c93ffef406c31cf0853a54b8',
  assetSource:'/flash-assets/g678-local/shared-alg001-l06-p046-candidate/canvas-renderer.js',
  assetSha256:'888a3e9f41e236eda7b4d0fe9c04a0aaa38d9e12bdbdbe844cc6d1e12a5272d6',
  stage:{width:800,height:600,backgroundColor:'#b8d8f7'},
  nativeStage:{width:800,height:600,backgroundColor:'#b8d8f7'},
  backingStage:{width:800,height:600},
  fps:12,rootFrameCount:10,rootBeginFrame:6,
  mainFrameDomain:'sprite-123',mainFrameCount:743,livePlaybackEndFrame:743,
  playbackMode:'once',strictCaptureIdentity:true,
  companionDomains:[],blockedFrameRanges:[],
  visualMarkers:[{id:'sprite-123-source-drawing',firstFrame:1,lastFrame:743}],
  sourceControlBehaviorLabel:'P046 maintained state owns five-value matching hold 163, independent wrong/right coaches, NMH, glossary and three embedded source audio streams; original-runtime timing remains unverified.',
  showEngineeringDisclosure:false,
} as const satisfies SourceStaticCanvasCandidateConfig;
