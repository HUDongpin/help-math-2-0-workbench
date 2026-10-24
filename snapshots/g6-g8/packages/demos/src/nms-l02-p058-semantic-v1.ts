import {P058_DISPLAY_SOURCE} from './generated/nms-l02-p058-display-list-v1';
import {P058_SOURCE_BUTTON_OCCURRENCES,P058_SOURCE_TERMS} from './generated/nms-l02-p058-terms-v1';
import {p058SourceSpriteFrame,type P058StaticLayer} from './timelines/shared-nms002-l02-p058-display-list';
import type {SourceGlossaryControlPage} from './source-glossary-controls';

export const P058_ID='shared-nms002-l02-p058';
export const P058_SOURCE_SHA='fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57';

/** Source text 26 (left) and text 24 (right), in their recorded reading order. */
export const P058_LEFT_STRATEGIES=Object.freeze([
 'write an equation and solve it','draw a picture','look for a pattern','systematically guess and check',
]);
export const P058_RIGHT_STRATEGIES=Object.freeze([
 'act it out','make a table','work a simpler problem','work backwards',
]);

/** Visible button lettering is distinct from the dictionary lookup key. */
const SOURCE_BUTTON_LABELS:Readonly<Record<number,string>>=Object.freeze({
 22:'Strategies',27:'equation',28:'pattern',29:'simpler',30:'table',33:'Show',36:'Show',
});

/** Each occurrence remains distinct, including the one-frame second Show.
 * Full opacity is a modern enabling policy, not a claim about Flash hit tests. */
export const P058_CONTROLS:SourceGlossaryControlPage=Object.freeze({
 animationId:P058_ID,sourceSha256:P058_SOURCE_SHA,frameDomain:'sprite-37',frameCount:274,
 controls:Object.freeze(P058_SOURCE_BUTTON_OCCURRENCES.map(occurrence=>{
  const term=P058_SOURCE_TERMS.find(row=>row.id===occurrence.entryId);
  const label=SOURCE_BUTTON_LABELS[occurrence.characterId];
  if(!term||term.sourceKeyAttribute!==occurrence.sourceKeyAttribute||!label)
   throw Error('P058 glossary source identity drift');
  return Object.freeze({id:occurrence.id,entryId:occurrence.entryId,
   sourceKeyAttribute:occurrence.sourceKeyAttribute,characterId:occurrence.characterId,
   firstFrame:occurrence.firstFullyOpaqueFrame,lastFrameExclusive:occurrence.lastFrameExclusive,
   label});
 })),
});

type P058TextPose=Readonly<{
 characterId:number;depth:number;placed:boolean;alpha256:number;alpha:number;
 sourceTransform:Readonly<{scaleX:number;scaleY:number;transX:number;transY:number}>|null;
 relativeToFinalTwips:Readonly<{x:number;y:number}>|null;
}>;

const TEXT_LAYERS=Object.freeze({
 stepOne9:Object.freeze({characterId:9,depth:12,finalFrame:274}),
 stepTwo12:Object.freeze({characterId:12,depth:14,finalFrame:274}),
 stepThree14:Object.freeze({characterId:14,depth:16,finalFrame:274}),
 stepFour15:Object.freeze({characterId:15,depth:17,finalFrame:274}),
 heading17:Object.freeze({characterId:17,depth:19,finalFrame:274}),
 strategies19:Object.freeze({characterId:19,depth:21,finalFrame:274}),
 rightStrategies24:Object.freeze({characterId:24,depth:26,finalFrame:274}),
 leftStrategies26:Object.freeze({characterId:26,depth:29,finalFrame:274}),
 show32:Object.freeze({characterId:32,depth:40,finalFrame:274}),
 flashing35:Object.freeze({characterId:35,depth:44,finalFrame:246}),
});

function layerAt(layers:readonly P058StaticLayer[],depth:number,characterId:number){
 const layer=layers.find(row=>row.depth===depth);
 if(layer&&layer.characterId!==characterId)
  throw Error(`P058 source character drift at depth ${depth}`);
 return layer;
}

function textPose(layers:readonly P058StaticLayer[],spec:typeof TEXT_LAYERS[keyof typeof TEXT_LAYERS]):P058TextPose{
 const layer=layerAt(layers,spec.depth,spec.characterId);
 const final=layerAt(p058SourceSpriteFrame(spec.finalFrame),spec.depth,spec.characterId);
 if(!final||final.alpha256!==256)throw Error('P058 final text pose drift');
 const transform=layer?Object.freeze({...layer.transform}):null;
 return Object.freeze({characterId:spec.characterId,depth:spec.depth,placed:!!layer,
  alpha256:layer?.alpha256??0,alpha:(layer?.alpha256??0)/256,
  sourceTransform:transform,
  relativeToFinalTwips:layer?Object.freeze({
   x:layer.transform.transX-final.transform.transX,
   y:layer.transform.transY-final.transform.transY,
  }):null});
}

/** A pure query of the extracted child-sprite frame. Translation is relative
 * to each text's final source pose so a maintained layout can retain source
 * entry motion without inheriting Flash's absolute stage coordinates. */
export function p058SemanticSnapshot(frame:number){
 if(P058_DISPLAY_SOURCE.animationId!==P058_ID||P058_DISPLAY_SOURCE.sourceSwfSha256!==P058_SOURCE_SHA||
  P058_DISPLAY_SOURCE.frameDomain!=='sprite-37'||P058_DISPLAY_SOURCE.frameCount!==274||
  P058_DISPLAY_SOURCE.rootPlacement.frame!==6||P058_SOURCE_BUTTON_OCCURRENCES.length!==7)
  throw Error('P058 source identity drift');
 const layers=p058SourceSpriteFrame(frame);
 const stepOne9=textPose(layers,TEXT_LAYERS.stepOne9);
 const stepTwo12=textPose(layers,TEXT_LAYERS.stepTwo12);
 const stepThree14=textPose(layers,TEXT_LAYERS.stepThree14);
 if(stepOne9.alpha256!==256||stepTwo12.alpha256!==256||stepThree14.alpha256!==256)
  throw Error('P058 persistent source plan missing');
 const controlStates=Object.freeze(P058_SOURCE_BUTTON_OCCURRENCES.map((occurrence,index)=>{
  const control=P058_CONTROLS.controls[index];
  if(control.id!==occurrence.id||control.characterId!==occurrence.characterId||
   control.firstFrame!==occurrence.firstFullyOpaqueFrame||
   control.lastFrameExclusive!==occurrence.lastFrameExclusive)
   throw Error('P058 source control contract drift');
  const layer=layerAt(layers,occurrence.depth,occurrence.characterId);
  const expectedPlaced=frame>=occurrence.firstPlacedFrame&&frame<occurrence.lastFrameExclusive;
  if(Boolean(layer)!==expectedPlaced||
   (frame===occurrence.firstPlacedFrame&&layer?.alpha256!==occurrence.firstPlacedAlpha256))
   throw Error('P058 source button placement drift');
  const enabled=frame>=occurrence.firstFullyOpaqueFrame&&frame<occurrence.lastFrameExclusive;
  if((layer?.alpha256===256)!==enabled)
   throw Error('P058 source button opacity drift');
  return Object.freeze({id:occurrence.id,entryId:occurrence.entryId,
   sourceKeyAttribute:occurrence.sourceKeyAttribute,characterId:occurrence.characterId,
   depth:occurrence.depth,firstPlacedFrame:occurrence.firstPlacedFrame,
   firstFullyOpaqueFrame:occurrence.firstFullyOpaqueFrame,
   lastFrameExclusive:occurrence.lastFrameExclusive,placed:!!layer,
   alpha256:layer?.alpha256??0,enabled});
 }));
 const flashing35=textPose(layers,TEXT_LAYERS.flashing35);
 return Object.freeze({frame,sourceLayerCount:layers.length,
  stepOne9,stepTwo12,stepThree14,
  stepFour15:textPose(layers,TEXT_LAYERS.stepFour15),
  heading17:textPose(layers,TEXT_LAYERS.heading17),
  strategies19:textPose(layers,TEXT_LAYERS.strategies19),
  leftStrategies26:textPose(layers,TEXT_LAYERS.leftStrategies26),
  rightStrategies24:textPose(layers,TEXT_LAYERS.rightStrategies24),
  show32:textPose(layers,TEXT_LAYERS.show32),flashing35,
  flashActive:flashing35.placed&&flashing35.alpha256>0,
  controlStates,
  availableControlIds:Object.freeze(controlStates.filter(row=>row.enabled).map(row=>row.id)),
  sourceChildStopPresent:false as const,sourceTerminalStopPresent:false as const,
  originalRuntimeEstablished:false as const});
}
