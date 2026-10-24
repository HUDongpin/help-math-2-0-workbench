import type {SourceStaticCanvasCandidateConfig} from './source-static-canvas-candidate';
import {ALG_L12_GLOSSARY_PAIR_CONTROLS} from './generated/alg-l12-glossary-pair-controls';
import assets from './generated/alg-l12-glossary-pair-native-assets.json';
import type {PairAnimationId} from './alg-l12-p013-p015-native-text';
export function pairTimelineConfig(id:PairAnimationId):SourceStaticCanvasCandidateConfig{
 const page=ALG_L12_GLOSSARY_PAIR_CONTROLS.find(p=>p.animationId===id)!,asset=assets.find(p=>p.animationId===id)!;
 if(!page||!asset||asset.sourceSha256!==page.sourceSha256)throw Error('Pair timeline source mismatch');
 return Object.freeze({animationId:id,title:id.endsWith('p013')?'Quadrants':'Plot Ordered Pairs',sourceSwfSha256:page.sourceSha256,
  assetSource:`/flash-assets/g678-local/${id}/typography.js`,assetSha256:asset.runtimeSha256,
  stage:{width:800,height:600,backgroundColor:'#b8d8f7'},fps:12,rootFrameCount:10,rootBeginFrame:6,
  mainFrameDomain:page.frameDomain,mainFrameCount:page.frameCount,livePlaybackEndFrame:page.frameCount,
  playbackMode:'once',strictCaptureIdentity:true,companionDomains:[],blockedFrameRanges:[],
  visualMarkers:[{id:'source-glossary-instruction',firstFrame:1,lastFrame:page.frameCount}],
  sourceControlBehaviorLabel:'Source glossary pause; modern full-frame terminal hold; original-runtime parity pending.',showEngineeringDisclosure:false});
}
