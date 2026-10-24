import {P058_DISPLAY_EVENTS,P058_DISPLAY_SOURCE,P058_NESTED_BUTTONS} from '../generated/nms-l02-p058-display-list-v1';

export type P058StaticLayer = Readonly<{
 depth:number;
 characterId:number;
 sourceKind:string;
 sourceDefinitionSha256:string;
 placementTagSha256:string;
 stateTagSha256:string;
 transform:Readonly<{scaleX:number;scaleY:number;transX:number;transY:number}>;
 alpha256:number;
 morph?:number;
 nestedHitCharacterId?:number;
 nestedHitDefinitionSha256?:string;
 nestedHitTransform?:Readonly<{scaleX:number;scaleY:number;transX:number;transY:number}>;
 nestedHitAlpha256?:number;
}>;

/** Source-static sprite-37 display list after all tags for a one-indexed frame.
 * Root translation is separately pinned in P058_DISPLAY_SOURCE.rootPlacement.
 * This does not execute button actions, dynamic text, or embedded audio. */
export function p058SourceSpriteFrame(frame:number):readonly P058StaticLayer[]{
 if(!Number.isInteger(frame)||frame<1||frame>P058_DISPLAY_SOURCE.frameCount)
  throw new RangeError('P058 frame is outside sprite-37');
 const active=new Map<number,P058StaticLayer>();
 for(const event of P058_DISPLAY_EVENTS){
  if(event.frame>frame)break;
  if(event.kind==='remove'){
   if(!active.delete(event.depth))throw new Error('P058 removal has no active layer');
   continue;
  }
  if(event.kind==='place'){
   if(active.has(event.depth)||event.characterId===undefined||!event.sourceKind||
    !event.sourceDefinitionSha256||!event.sourceTagSha256||!event.transform||event.alpha256===undefined)
    throw new Error('P058 placement is incomplete or overlaps a depth');
   const nested=(P058_NESTED_BUTTONS as Record<string,{
    hitCharacterId:number;hitDefinitionSha256:string;
    hitTransform:Readonly<{scaleX:number;scaleY:number;transX:number;transY:number}>;
    hitAlpha256:number}>)[String(event.characterId)];
   active.set(event.depth,Object.freeze({depth:event.depth,characterId:event.characterId,
    sourceKind:event.sourceKind,sourceDefinitionSha256:event.sourceDefinitionSha256,
    placementTagSha256:event.sourceTagSha256,stateTagSha256:event.sourceTagSha256,
    transform:Object.freeze({...event.transform}),alpha256:event.alpha256,
    ...(event.morph===undefined?{}:{morph:event.morph}),
    ...(nested?{nestedHitCharacterId:nested.hitCharacterId,
     nestedHitDefinitionSha256:nested.hitDefinitionSha256,
     nestedHitTransform:Object.freeze({...nested.hitTransform}),
     nestedHitAlpha256:nested.hitAlpha256}:{})}));
   continue;
  }
  const prior=active.get(event.depth);
  if(!prior||!event.sourceTagSha256||(!event.transform&&event.alpha256===undefined))
   throw new Error('P058 update has no active layer or state change');
  active.set(event.depth,Object.freeze({...prior,
   transform:event.transform?Object.freeze({...event.transform}):prior.transform,
   alpha256:event.alpha256??prior.alpha256,stateTagSha256:event.sourceTagSha256}));
 }
 return Object.freeze([...active.values()].sort((a,b)=>a.depth-b.depth));
}
