'use client';
import {createSourceStaticCanvasCandidate} from './source-static-canvas-candidate';
import {pairTimelineConfig} from './alg-l12-glossary-pair-timeline';
import {ALG_L12_GLOSSARY_PAIR_CONTROLS} from './generated/alg-l12-glossary-pair-controls';
import assets from './generated/alg-l12-glossary-pair-native-assets.json';
import {PairNativeRenderer} from './alg-l12-glossary-pair-renderer';
import {loadPairNativeAsset} from './alg-l12-glossary-pair-assets';
import {pairTextBinding,pairTextSnapshot,type PairAnimationId} from './alg-l12-p013-p015-native-text';
import type {AnimationRendererProps,RuntimeContext} from './contract';
export function createGlossaryPairModule(id:PairAnimationId){
 const page=ALG_L12_GLOSSARY_PAIR_CONTROLS.find(p=>p.animationId===id)!;
 const assetConfig=assets.find(p=>p.animationId===id)!;
 if(!page||!assetConfig||assetConfig.sourceSha256!==page.sourceSha256)throw Error('Pair module configuration mismatch');
 const config=pairTimelineConfig(id);
 const candidate=createSourceStaticCanvasCandidate(config);
 const Renderer=(props:AnimationRendererProps)=><PairNativeRenderer {...props} assetConfig={assetConfig}/>;
 return Object.freeze({...candidate.module,Renderer,reducedMotionFrame:page.frameCount,
  textPresentation:Object.freeze({schemaVersion:1 as const,binding:pairTextBinding(id),Renderer,
   reducedMotionFrameByDomain:{[page.frameDomain]:page.frameCount},prepare:async()=>{await loadPairNativeAsset(assetConfig);},
   getSnapshot:(_state:unknown,context:RuntimeContext)=>pairTextSnapshot(id,context)})});
}
