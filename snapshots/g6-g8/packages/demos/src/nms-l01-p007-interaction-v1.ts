export type P007CardId='Scr_1'|'Scr_2'|'Scr_3'|'Scr_4';
export type P007TargetId='Mc_Tar_1'|'Mc_Tar_2'|'Mc_Tar_3'|'Mc_Tar_4';
export interface P007Point {readonly x:number;readonly y:number;}
export interface P007Bounds extends P007Point {readonly width:number;readonly height:number;}
export interface P007Card {
 readonly id:P007CardId;readonly targetId:P007TargetId;readonly value:number;readonly label:string;
 readonly sourceCharacterId:number;readonly targetCharacterId:number;readonly sourceDepth:number;readonly targetDepth:number;
 readonly accessibleLabels:Readonly<{en:string;es:string}>;readonly originTwips:P007Point;readonly targetTwips:P007Point;
 readonly sourceBounds:P007Bounds;readonly targetBounds:P007Bounds;readonly neighborValues:readonly number[];
}
export interface P007Interaction {
 readonly epoch:number;readonly selected:P007CardId|null;readonly locked:readonly P007CardId[];
 readonly positions:Readonly<Record<P007CardId,P007Point>>;readonly attempts:number;readonly result:'none'|'wrong'|'correct';
}
export type P007Action=Readonly<{type:'select';cardId:string}>|Readonly<{type:'move';point:P007Point}>|
 Readonly<{type:'drop';targetId:string|null}>|Readonly<{type:'cancel'}>|Readonly<{type:'clear-feedback'}>|Readonly<{type:'replay'}>;
function freeze(s:P007Interaction):P007Interaction {
 const positions=Object.fromEntries(Object.entries(s.positions).map(([k,p])=>[k,Object.freeze({...p})])) as P007Interaction['positions'];
 return Object.freeze({...s,locked:Object.freeze([...s.locked]),positions:Object.freeze(positions)});
}
export function validateP007Cards(cards:readonly P007Card[]){
 if(cards.length!==4||cards.some((c,i)=>c.id!==`Scr_${i+1}`||c.targetId!==`Mc_Tar_${i+1}`||c.value!==[-5,0,5,8][i]||
  ![c.originTwips.x,c.originTwips.y,c.targetTwips.x,c.targetTwips.y,c.sourceBounds.x,c.sourceBounds.y,c.sourceBounds.width,c.sourceBounds.height,c.targetBounds.x,c.targetBounds.y,c.targetBounds.width,c.targetBounds.height].every(Number.isFinite)))throw Error('P007_CARD_SOURCE_MISMATCH');
}
export function createP007Interaction(cards:readonly P007Card[],epoch=0):P007Interaction {
 validateP007Cards(cards);return freeze({epoch,selected:null,locked:[],positions:Object.fromEntries(cards.map(c=>[c.id,c.originTwips])) as P007Interaction['positions'],attempts:0,result:'none'});
}
export function reduceP007Interaction(cards:readonly P007Card[],s:P007Interaction,a:P007Action):P007Interaction {
 if(a.type==='replay')return createP007Interaction(cards,s.epoch+1);
 if(a.type==='clear-feedback')return s.result==='none'?s:freeze({...s,result:'none'});
 if(a.type==='select'){
  const c=cards.find(c=>c.id===a.cardId);if(!c||s.locked.includes(c.id))return s;
  const positions={...s.positions};if(s.selected)positions[s.selected]=cards.find(c=>c.id===s.selected)!.originTwips;
  return freeze({...s,positions,selected:c.id,result:'none'});
 }
 if(!s.selected)return s;const c=cards.find(c=>c.id===s.selected)!;
 if(a.type==='cancel')return freeze({...s,positions:{...s.positions,[c.id]:c.originTwips},selected:null,result:'none'});
 if(a.type==='move'){
  if(!Number.isFinite(a.point.x)||!Number.isFinite(a.point.y)||Math.abs(a.point.x)>32000||Math.abs(a.point.y)>32000)return s;
  return freeze({...s,positions:{...s.positions,[c.id]:a.point}});
 }
 const correct=a.targetId===c.targetId;
 return freeze({...s,selected:null,locked:correct?[...s.locked,c.id]:s.locked,positions:{...s.positions,[c.id]:correct?c.targetTwips:c.originTwips},attempts:s.attempts+1,result:correct?'correct':'wrong'});
}
export function p007TargetAtPoint(cards:readonly P007Card[],point:P007Point|null):P007TargetId|null {
 if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
 const hits=cards.filter(c=>point.x>=c.targetBounds.x&&point.x<=c.targetBounds.x+c.targetBounds.width&&point.y>=c.targetBounds.y&&point.y<=c.targetBounds.y+c.targetBounds.height);
 return hits.length===1?hits[0].targetId:null;
}
