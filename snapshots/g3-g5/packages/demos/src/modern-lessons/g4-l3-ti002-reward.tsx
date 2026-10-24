import React from'react';
import source from'./generated/g4-l3-ti002-native-inputs.json';
import{getTi002Timeline,ti002ChildTimeline,composeTi002Color}from'./g4-l3-ti002-scene';
import{In012ShapePaints,type In012PaintShape,type In012ColorTransform}from'./g4-l3-in012-paints';
const shapes=new Map(([...source.paints.staticShapes,...source.paints.morphShapes]as unknown as readonly In012PaintShape[]).map(s=>[s.characterId,s]));
const noBitmaps=new Map();
const textIds=new Set(source.texts.map(t=>t.characterId));
export const TI002_REWARDS={'ti002-correct-1':{sprite:205,text:200,end:28},'ti002-correct-2':{sprite:252,text:250,end:33},'ti002-correct-3':{sprite:231,text:224,end:32},'ti002-correct-4':{sprite:217,text:211,end:25}}as const;
type RewardId=keyof typeof TI002_REWARDS;
function scene(timelineId:string,frame:number,prefix:string,parent?:In012ColorTransform):{nodes:React.ReactNode[];textVisible:boolean}{
 let textVisible=false;const nodes:React.ReactNode[]=[];
 for(const p of getTi002Timeline(timelineId,frame).placements){
  if(p.clipDepth!==undefined)throw Error('TI002 reward mask requires explicit policy');
  const color=composeTi002Color(parent,p.colorTransform),alpha=(color.multiply?.[3]??256)/256+(color.add?.[3]??0)/255;
  if(textIds.has(p.characterId)){textVisible ||= alpha>0;continue;}
  const shape=shapes.get(p.characterId),child=ti002ChildTimeline(p.characterId);let content:React.ReactNode;
  if(shape)content=<In012ShapePaints shape={shape} ratio={p.ratio} idPrefix={`${prefix}-${p.depth}`} colorTransform={color} bitmaps={noBitmaps}/>;
  else if(child){if(child.frameCount!==1)throw Error('TI002 reward child clock unresolved');const rendered=scene(child.timelineId,1,`${prefix}-${p.depth}`,color);content=rendered.nodes;textVisible ||= rendered.textVisible;}
  else throw Error(`TI002 reward source character unresolved:${p.characterId}`);
  nodes.push(<g key={p.instanceId} data-source-instance={p.instanceId} transform={`matrix(${p.matrix.join(' ')})`}>{content}</g>);
 }
 return{nodes,textVisible};
}
export function ti002RewardTextVisible(id:RewardId,frame:number){const d=TI002_REWARDS[id];if(!Number.isInteger(frame)||frame<2||frame>d.end)throw RangeError('TI002 reward frame invalid');return scene(`sprite-${d.sprite}`,frame,'visibility').textVisible;}
export function Ti002Reward({id,frame}:{id:RewardId;frame:number}){
 const d=TI002_REWARDS[id];if(!Number.isInteger(frame)||frame<2||frame>d.end)throw RangeError('TI002 reward frame invalid');
 const rendered=scene(`sprite-${d.sprite}`,frame,`ti002-reward-${d.sprite}`),placement=source.timelines.find(t=>t.timelineId==='sprite-272')!.events.find(e=>e.characterId===d.sprite&&e.frame===238)!;
 const root=source.timelines.find(t=>t.timelineId==='root')!.events.find(e=>e.characterId===272)!;
 return <div data-ti002-reward={id} data-ti002-reward-frame={frame}>
  {rendered.textVisible&&<p role="status" data-ti002-feedback-activity={id} data-lesson-text-block={`text-${d.text}`} style={{fontSize:'1.5rem',lineHeight:1.5}}>{source.texts.find(t=>t.characterId===d.text)!.text}</p>}
  <svg aria-hidden="true" viewBox="0 0 16000 12000" style={{width:'100%',maxWidth:'40rem',height:'auto',display:'block'}}><g transform={`matrix(${root.matrix!.join(' ')})`}><g transform={`matrix(${placement.matrix!.join(' ')})`}>{rendered.nodes}</g></g></svg>
 </div>;
}
