import React from 'react';
import source from './generated/g4-l3-ti002-native-inputs.json';

const child=source.timelines.find(t=>t.timelineId==='sprite-174')!;
const popup=source.timelines.find(t=>t.timelineId==='sprite-175')!;
const shape=source.paints.staticShapes.find(s=>s.characterId===173)!;
const fixed=popup.events.find(e=>e.kind==='place'&&e.characterId===173)!;
const moving=popup.events.find(e=>e.kind==='place'&&e.characterId===174)!;
const placements=child.events.filter(e=>e.kind==='place');
const paints=shape.epochs.flatMap(e=>e.paints);
/** The caller supplies the local source frame. No timer, pause or Replay state is hidden here. */
export function getTi002DecreaseFrame(frame:number){
  if(!Number.isInteger(frame)||frame<1||frame>10)throw new RangeError('TI002 decrease picture requires source frame1..10');
  const placement=placements.find(e=>e.frame===frame);
  if(!placement?.matrix||placement.instanceId!=='sprite-174/depth-1/generation-1')throw new Error('TI002 circle source placement mismatch');
  return {frame,matrix:placement.matrix,sourceEventId:placement.eventId,sourceTagSha256:placement.sourceTagSha256};
}
const rgba=(color:readonly number[])=>`rgba(${color[0]},${color[1]},${color[2]},${color[3]/255})`;
function Circle(){return <>{paints.map((p,i)=>{
  if(p.style.kind&&p.style.kind!=='solid')throw new Error('Unsupported TI002 circle paint');
  return <path key={i} d={p.d} fill={p.kind==='fill'?rgba(p.style.rgba!):'none'} stroke={p.kind==='stroke'?rgba(p.style.rgba!):'none'} strokeWidth={p.kind==='stroke'?p.style.widthTwips:undefined} fillRule="evenodd"/>;
})}</>;}
export function Ti002DecreasePicture({frame}:{frame:number}){
  const state=getTi002DecreaseFrame(frame);
  return <svg role="img" aria-label="Two circles compare size. The circle on the right decreases." data-ti002-decrease-frame={frame} viewBox="-7250 1250 4070 2030" style={{display:'block',width:'100%',height:'auto',maxWidth:'36rem'}}>
    <g transform={`matrix(${fixed.matrix!.join(' ')})`} data-source-instance={fixed.instanceId}><Circle/></g>
    <g transform={`matrix(${moving.matrix!.join(' ')})`} data-source-instance={moving.instanceId}>
      <g transform={`matrix(${state.matrix.join(' ')})`} data-source-event={state.sourceEventId}><Circle/></g>
    </g>
  </svg>;
}

/** Static in-page illustration has its own authored geometry, distinct from the popup animation. */
export function Ti002DecreasePreview(){
 const preview=source.paints.staticShapes.find(s=>s.characterId===124)!;
 if(preview.sourceTagSha256!=='14c4a98f92bdd7efd848fee25283645c2b14551cbade9a0f1734d7ffcfb43c3a')throw new Error('TI002 inline circle source mismatch');
 const circles=preview.epochs.filter(e=>e.epoch===19||e.epoch===20);
 if(circles.length!==2||circles.some(e=>e.paints.length!==2))throw new Error('TI002 inline circle paints missing');
 return <svg role="img" aria-label="Two circles compare size. The circle on the right is smaller." data-ti002-decrease-preview="124" viewBox="-1245 -3487 2426 1230" style={{display:'block',width:'100%',height:'auto',maxWidth:'36rem'}}>
  {circles.map(e=><g key={e.epoch} data-ti002-preview-circle={e.epoch}>{e.paints.map((p,i)=><path key={i} d={p.d} fill={p.kind==='fill'?rgba(p.style.rgba!):'none'} stroke={p.kind==='stroke'?rgba(p.style.rgba!):'none'} strokeWidth={p.kind==='stroke'?p.style.widthTwips:undefined} fillRule="evenodd"/>)}</g>)}
 </svg>;
}
