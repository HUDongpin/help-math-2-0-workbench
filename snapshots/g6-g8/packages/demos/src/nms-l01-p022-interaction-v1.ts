export type P022CardId='Scr_1'|'Scr_2'|'Scr_3'|'Scr_4'|'Scr_5'|'Scr_6'|'Scr_7'|'Scr_8'|'Scr_9'|'Scr_10'|'Scr_11'|'Scr_12'|'Scr_13'|'Scr_14'|'Scr_15'|'Scr_16';
export type P022TargetId='Mc_Tar_1'|'Mc_Tar_2'|'Mc_Tar_3'|'Mc_Tar_4'|'Mc_Tar_5'|'Mc_Tar_6';
export interface P022Point {readonly x:number;readonly y:number;}
export interface P022Bounds extends P022Point {readonly width:number;readonly height:number;}
export interface P022Card {
 readonly id:P022CardId;readonly targetId:P022TargetId|null;readonly value:number;readonly label:string;
 readonly sourceCharacterId:number;readonly targetCharacterId:number|null;readonly sourceDepth:number;readonly targetDepth:number|null;
 readonly accessibleLabels:Readonly<{en:string;es:string}>;readonly originTwips:P022Point;readonly targetTwips:P022Point|null;
 readonly sourceBounds:P022Bounds;readonly targetBounds:P022Bounds|null;
}
export interface P022Interaction {
 readonly epoch:number;readonly selected:P022CardId|null;readonly locked:readonly P022CardId[];
 readonly positions:Readonly<Record<P022CardId,P022Point>>;readonly attempts:number;readonly result:'none'|'wrong'|'correct';
}
export type P022Action=Readonly<{type:'select';cardId:string}>|Readonly<{type:'move';point:P022Point}>|
 Readonly<{type:'drop';targetId:string|null}>|Readonly<{type:'cancel'}>|Readonly<{type:'clear-feedback'}>|Readonly<{type:'replay'}>;
function freeze(s:P022Interaction):P022Interaction {
 const positions=Object.fromEntries(Object.entries(s.positions).map(([k,p])=>[k,Object.freeze({...p})])) as P022Interaction['positions'];
 return Object.freeze({...s,locked:Object.freeze([...s.locked]),positions:Object.freeze(positions)});
}
export function validateP022Cards(cards:readonly P022Card[]){
 if(cards.length!==16||cards.some((c,i)=>c.id!==`Scr_${i+1}`||c.value!==[-6,9,7,4,-3,8,-5,-4,-2,-1,0,1,2,3,5,6][i]||c.sourceCharacterId!==[92,108,106,103,95,107,93,94,96,97,99,100,101,102,104,105][i]||
  ![c.originTwips.x,c.originTwips.y,c.sourceBounds.x,c.sourceBounds.y,c.sourceBounds.width,c.sourceBounds.height].every(Number.isFinite)||
  (i>=6?(c.targetId!==null||c.targetTwips!==null||c.targetBounds!==null):(c.targetId!==`Mc_Tar_${i+1}`||!c.targetTwips||!c.targetBounds||![c.targetTwips.x,c.targetTwips.y,c.targetBounds.x,c.targetBounds.y,c.targetBounds.width,c.targetBounds.height].every(Number.isFinite)))))throw Error('P022_CARD_SOURCE_MISMATCH');
}
export function createP022Interaction(cards:readonly P022Card[],epoch=0):P022Interaction {
 validateP022Cards(cards);return freeze({epoch,selected:null,locked:[],positions:Object.fromEntries(cards.map(c=>[c.id,c.originTwips])) as P022Interaction['positions'],attempts:0,result:'none'});
}
export function reduceP022Interaction(cards:readonly P022Card[],s:P022Interaction,a:P022Action):P022Interaction {
 if(a.type==='replay')return createP022Interaction(cards,s.epoch+1);
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
export function p022TargetAtPoint(cards:readonly P022Card[],point:P022Point|null):P022TargetId|null {
 if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
 const hits=cards.filter(c=>c.targetBounds&&point.x>=c.targetBounds.x&&point.x<=c.targetBounds.x+c.targetBounds.width&&point.y>=c.targetBounds.y&&point.y<=c.targetBounds.y+c.targetBounds.height);
 return hits.sort((a,b)=>(b.targetDepth??0)-(a.targetDepth??0))[0]?.targetId??null;
}
