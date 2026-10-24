import {createSceneReader,type Inputs,type Display,type SceneNode,type Matrix} from './scene';
export interface NativeTextDefinition {runs:{sourceTextId:string;text:string;colorRgba:number[]}[];characterId:number;text:string;boundsTwips:{left:number;top:number;right:number;bottom:number};rgba:number[];fontHeightTwips:number;sourceTagSha256:string}
interface Card {targetCenter:{x:number;y:number};sourceName:string;sourceInstance:Display;targetName:string;targetInstance:Display;sourceTextId:number;targetTextId:number;expectedTemperature:number}
export interface PackedInputs {sourceSha256:string;displayPool:Display[];frameIndices:Record<string,number[][]>;timelines:Inputs['timelines'];shapes:number[];morphs:number[];texts:NativeTextDefinition[];buttons:number[];cards:Card[]}
export interface FigureState {placements?:Readonly<Record<string,string|null>>}
export interface TextLabel {id:string;characterId:number;text:string;x:number;y:number;fontSize:number;rgba:number[];alpha:number;sourceMatrix:Matrix;sourceTagSha256:string;emphasis:boolean}
export interface PositionMarker {id:string;position:number;targetName:string;x:number;y:number;labelX:number;labelY:number;answerRevealed:boolean}
const transform=(m:Matrix,x:number,y:number)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const alpha=(n:SceneNode,a=255)=>Math.max(0,Math.min(1,(a*n.worldColor.multiply[3]/256+n.worldColor.add[3])/255));
export function createIn010FigureReader(input:PackedInputs){
 const frames=Object.fromEntries(Object.entries(input.frameIndices).map(([tid,rows])=>[tid,rows.map((indices,i)=>({frame:i+1,displayList:indices.map(index=>{const d=input.displayPool[index];if(!d)throw Error('Invalid pooled display index');return d})}))]));
 const source=createSceneReader({...input,frames,texts:input.texts.map(t=>t.characterId)}),defs=new Map(input.texts.map(t=>[t.characterId,t])),cards=new Map(input.cards.map(c=>[c.sourceInstance.instanceId,c])),targets=new Map(input.cards.map(c=>[c.targetInstance.instanceId,c]));
 return(frame:number,state:FigureState={})=>{
  const scene=source(frame),placements=state.placements??{};for(const[key,value]of Object.entries(placements)){const card=input.cards.find(c=>c.sourceName===key);if(!card||value!==null&&value!==card.targetName)throw Error('Invalid controlled correct-placement state')}
  if(frame!==264&&Object.values(placements).some(Boolean))throw Error('Question placements before authored question frame');
  const labels:TextLabel[]=[],positions:PositionMarker[]=[];
  function label(node:SceneNode){const d=defs.get(node.characterId);if(!d)throw Error('Unknown text');if([2,88].includes(d.characterId))return;let text=d.text;if(d.characterId===11&&node.sourceInstanceId==='sprite-90/depth-18/generation-1')text='−10';if(d.characterId===19)text='−20';if(d.characterId===24)text=text.replace('  18',' −18');if(d.characterId===29)text=text.replace('  4',' −4');if([57,60].includes(d.characterId))text=text.replace('-','−');const b=d.boundsTwips,[x,y]=transform(node.worldMatrix,(b.left+b.right)/2,(b.top+b.bottom)/2),a=alpha(node,d.rgba[3]);if(a<=0)return;labels.push({id:node.id,characterId:d.characterId,text,x:x/20,y:y/20,fontSize:Math.max(18,d.fontHeightTwips*Math.hypot(node.worldMatrix[0],node.worldMatrix[1])/20),rgba:d.rgba.map((v,i)=>Math.max(0,Math.min(255,v*node.worldColor.multiply[i]/256+node.worldColor.add[i]))),alpha:a,sourceMatrix:node.worldMatrix,sourceTagSha256:d.sourceTagSha256,emphasis:[41,42].includes(d.characterId)})}
  function walk(nodes:readonly SceneNode[]):SceneNode[]{const out:SceneNode[]=[];for(const node of nodes){
   if(node.characterId===18&&['sprite-90/depth-17/generation-1','sprite-90/depth-19/generation-1'].includes(node.sourceInstanceId))continue;
   if(node.characterId===30&&['sprite-90/depth-35/generation-1','sprite-71/depth-3/generation-1','sprite-75/depth-3/generation-1'].includes(node.sourceInstanceId))continue;
   if(node.kind==='button')continue; // Host owns exact source keyword/Close actions; no decorative fake controls.
   if(frame===264){if(['sprite-90/depth-56/generation-1','sprite-90/depth-103/generation-1','sprite-90/depth-114/generation-1'].includes(node.sourceInstanceId))continue;const card=cards.get(node.sourceInstanceId);if(card&&placements[card.sourceName]===card.targetName)continue;const target=targets.get(node.sourceInstanceId);if(target){const m=node.worldMatrix;positions.push({id:node.id,position:0,targetName:target.targetName,x:target.targetCenter.x,y:target.targetCenter.y,labelX:0,labelY:0,answerRevealed:placements[target.sourceName]===target.targetName});if(placements[target.sourceName]===target.targetName){for(const child of node.children??[])if(child.kind==='text')label(child);}continue}}
   if(node.kind==='text'){label(node);continue}out.push(node.children?{...node,children:walk(node.children)}:node)
  }return out}
  const nodes=walk(scene.nodes);positions.sort((a,b)=>a.y-b.y);positions.forEach((p,i)=>{p.position=i+1;p.labelX=p.x+(i===2?-72:40);p.labelY=p.y});
  return{frame,nodes,labels,positions,question:frame===264,policy:'Source geometry; native labels anchor to source text-bounds centers with minimum18px. Position1..6 assistive annotations are modern policy. Feedback/keyword action ownership remains caller.'};
 }
}
