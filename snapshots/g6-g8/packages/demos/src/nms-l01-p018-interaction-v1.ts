export type P018CardId='Scr_1'|'Scr_2'|'Scr_3'|'Scr_4'|'Scr_5'|'Scr_6'|'Scr_7'|'Scr_8'|'Scr_9';
export type P018TargetId='Mc_Tar_5'|'Mc_Tar_6'|'Mc_Tar_7'|'Mc_Tar_8'|'Mc_Tar_9';
export interface P018Point {readonly x:number;readonly y:number;}
export interface P018Bounds extends P018Point {readonly width:number;readonly height:number;}
export interface P018Card {
 readonly id:P018CardId;readonly targetId:P018TargetId|null;readonly value:number;readonly label:string;
 readonly sourceCharacterId:number;readonly targetCharacterId:number|null;readonly sourceDepth:number;readonly targetDepth:number|null;
 readonly accessibleLabels:Readonly<{en:string;es:string}>;readonly originTwips:P018Point;readonly targetTwips:P018Point|null;
 readonly sourceBounds:P018Bounds;readonly targetBounds:P018Bounds|null;
}
export interface P018Interaction {
 readonly epoch:number;readonly selected:P018CardId|null;readonly locked:readonly P018CardId[];
 readonly positions:Readonly<Record<P018CardId,P018Point>>;readonly attempts:number;readonly result:'none'|'wrong'|'correct';
}
export type P018Action=Readonly<{type:'select';cardId:string}>|Readonly<{type:'move';point:P018Point}>|
 Readonly<{type:'drop';targetId:string|null}>|Readonly<{type:'cancel'}>|Readonly<{type:'clear-feedback'}>|Readonly<{type:'replay'}>;
function freeze(s:P018Interaction):P018Interaction {
 const positions=Object.fromEntries(Object.entries(s.positions).map(([k,p])=>[k,Object.freeze({...p})])) as P018Interaction['positions'];
 return Object.freeze({...s,locked:Object.freeze([...s.locked]),positions:Object.freeze(positions)});
}
export function validateP018Cards(cards:readonly P018Card[]){
 if(cards.length!==9||cards.some((c,i)=>c.id!==`Scr_${i+1}`||c.value!==[-6,-5,-4,-2,0,2,4,5,6][i]||c.sourceCharacterId!==[37,38,39,40,41,42,45,43,44][i]||
  ![c.originTwips.x,c.originTwips.y,c.sourceBounds.x,c.sourceBounds.y,c.sourceBounds.width,c.sourceBounds.height].every(Number.isFinite)||
  (i<4?(c.targetId!==null||c.targetTwips!==null||c.targetBounds!==null):(c.targetId!==`Mc_Tar_${i+1}`||!c.targetTwips||!c.targetBounds||![c.targetTwips.x,c.targetTwips.y,c.targetBounds.x,c.targetBounds.y,c.targetBounds.width,c.targetBounds.height].every(Number.isFinite)))))throw Error('P018_CARD_SOURCE_MISMATCH');
}
export function createP018Interaction(cards:readonly P018Card[],epoch=0):P018Interaction {
 validateP018Cards(cards);return freeze({epoch,selected:null,locked:[],positions:Object.fromEntries(cards.map(c=>[c.id,c.originTwips])) as P018Interaction['positions'],attempts:0,result:'none'});
}
export function reduceP018Interaction(cards:readonly P018Card[],s:P018Interaction,a:P018Action):P018Interaction {
 if(a.type==='replay')return createP018Interaction(cards,s.epoch+1);
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
 const correct=c.targetId!==null&&a.targetId===c.targetId;
 return freeze({...s,selected:null,locked:correct?[...s.locked,c.id]:s.locked,positions:{...s.positions,[c.id]:correct?c.targetTwips!:c.originTwips},attempts:s.attempts+1,result:correct?'correct':'wrong'});
}
export function p018TargetAtPoint(cards:readonly P018Card[],point:P018Point|null):P018TargetId|null {
 if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
 const hits=cards.filter(c=>c.targetBounds&&point.x>=c.targetBounds.x&&point.x<=c.targetBounds.x+c.targetBounds.width&&point.y>=c.targetBounds.y&&point.y<=c.targetBounds.y+c.targetBounds.height);
 return hits.length===1?hits[0].targetId:null;
}
