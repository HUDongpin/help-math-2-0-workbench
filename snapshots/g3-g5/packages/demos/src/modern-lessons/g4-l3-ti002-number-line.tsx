import React from 'react';
import source from './generated/g4-l3-ti002-native-inputs.json';

export type Ti002NumberLineId = 'sprite-159' | 'sprite-169' | 'sprite-178' | 'sprite-182';
const axisIds = {'sprite-159':158,'sprite-169':168,'sprite-178':177,'sprite-182':181} as const;
const arrowIds = {'sprite-159':156,'sprite-169':160,'sprite-178':176,'sprite-182':180} as const;
const signed = (value:number) => value < 0 ? `−${-value}` : value > 0 ? `+${value}` : '0';
/** Native labels use reviewed source instances. Source axis strokes remain vector paths.
 * Horizontal reflow is an explicit modern typography adaptation, not pixel parity. */
export function Ti002NumberLine({diagram,scope='inline'}: {diagram:Ti002NumberLineId;scope?:'inline'|'popup'}) {
  const map = source.signedPictureLabels.diagrams.find(row=>row.timelineId===diagram);
  const inline=scope==='inline'?source.inlineSignedPictureLabels.diagrams.find(d=>d.timelineId===diagram):undefined;
  if(scope==='inline'&&(!inline||inline.labels.length!==17||inline.labels.some((r,i)=>r.signedValue!==i-8)))throw new Error('TI002 inline source binding mismatch');
  const axis = source.paints.staticShapes.find(row=>row.characterId===axisIds[diagram]);
  if (!map || !axis || map.labels.length!==17 || map.labels.some((row,i)=>row.signedValue!==i-8)) throw new Error('TI002 number-line source binding mismatch');
  const arrowShape=source.paints.staticShapes.find(row=>row.characterId===arrowIds[diagram])!;
  const arrows=arrowShape.epochs.flatMap(epoch=>epoch.paints).filter(p=>p.kind==='fill'&&p.style.rgba?.[3]===255&&p.style.rgba.some((v,i)=>i<3&&v!==255));
  if(arrows.length!==1||arrows[0].d.split('M').length!==3)throw new Error('TI002 two source arrows required');
  const arrowCoordinates=arrows[0].d.match(/-?\d+/g)!.map(Number);
  const arrowXs=arrowCoordinates.filter((_,i)=>i%2===0),arrowYs=arrowCoordinates.filter((_,i)=>i%2===1);
  const strokes = axis.epochs.flatMap(epoch=>epoch.paints).filter(paint=>paint.kind==='stroke');
  const segments=strokes.flatMap(paint=>[...paint.d.matchAll(/M(-?\d+) (-?\d+) L(-?\d+) (-?\d+)/g)].map(match=>match.slice(1).map(Number)));
  const ticks=[...new Set(segments.filter(([x,y,x2,y2])=>x===x2&&Math.abs(y-y2)>=100).map(([x])=>x))].sort((a,b)=>a-b);
  if(ticks.length!==17)throw new Error('TI002 source tick extraction mismatch');
  const gap=(ticks[16]-ticks[0])/16,left=Math.min(ticks[0]-gap/2,...arrowXs)-20,right=Math.max(ticks[16]+gap/2,...arrowXs)+20,width=right-left;
  const ys=[...segments.flatMap(([,y,,y2])=>[y,y2]),...arrowYs],top=Math.min(...ys),height=Math.max(...ys)-top;
  const rgba = (color:number[])=>`rgba(${color[0]},${color[1]},${color[2]},${color[3]/255})`;
  const labelColor=(row:typeof map.labels[number])=>{
    if('sourceTextIds' in row && row.sourceTextIds){
      const sourceId=row.sourceTextIds[0];
      const run=source.texts.flatMap(text=>text.runs).find(run=>run.sourceTextId===sourceId);
      if(!run)throw new Error('TI002 label color source missing');
      return rgba(run.colorRgba);
    }
    const shape=source.paints.staticShapes.find(shape=>shape.characterId===row.sourceShapeId)!;
    const paint=shape.epochs.find(epoch=>epoch.epoch===row.paintAddress.epoch)!.paints[row.paintAddress.paintIndex];
    return rgba(paint.style.rgba!);
  };
  return <div className="ti002-number-line" data-ti002-number-line={diagram} tabIndex={0} onKeyDown={event=>{
      if(event.target!==event.currentTarget||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
      const region=event.currentTarget;if(region.scrollWidth<=region.clientWidth)return;
      const step=region.clientWidth*.8;
      const next=event.key==='ArrowLeft'?region.scrollLeft-step:event.key==='ArrowRight'?region.scrollLeft+step:event.key==='Home'?0:event.key==='End'?region.scrollWidth:null;
      if(next===null)return;event.preventDefault();region.scrollLeft=next;
    }} role="group" aria-label="Number line from negative eight to positive eight. Scroll horizontally to explore all values.">
    <style>{`.ti002-number-line{max-width:100%;overflow-x:auto;overscroll-behavior-inline:contain;border:1px solid #718399;border-radius:.75rem;padding:1rem;color:#16364a;background:white}.ti002-number-line:focus-visible{outline:3px solid #005a9c;outline-offset:3px}.ti002-number-line-plane{position:relative;min-width:36rem;height:6rem}.ti002-number-line-values{position:absolute;inset:3rem 0 auto}.ti002-number-line-value{position:absolute;transform:translateX(-50%);text-align:center;font-family:var(--lesson-font-body,system-ui,sans-serif);font-size:1.25rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.5;white-space:nowrap}`}</style>
    <div className="ti002-number-line-plane">
      <svg aria-hidden="true" focusable="false" viewBox={`${left} ${top} ${width} ${height}`} preserveAspectRatio="none" style={{position:'absolute',left:'0',top:'1rem',width:'100%',height:'1.5rem',overflow:'visible'}}>
        {arrows.map((paint,i)=><path key={`arrow-${i}`} data-ti002-source-arrows={arrowIds[diagram]} d={paint.d} fill={rgba(paint.style.rgba!)} fillRule="evenodd"/>)}
        {strokes.map((paint,i)=><path key={i} d={paint.d} fill="none" stroke={rgba(paint.style.rgba!)} strokeWidth="2" vectorEffect="non-scaling-stroke"/>)}
      </svg>
      <div className="ti002-number-line-values">{map.labels.map((row,index)=><span key={row.signedValue} className="ti002-number-line-value" style={{left:`${(ticks[index]-left)/width*100}%`,color:inline?rgba(inline.labels[index].color):labelColor(row)}} data-ti002-value={row.signedValue} data-lesson-text-block={`${scope}-${diagram}-${row.signedValue}`} data-source-instance={inline?.labels[index].instanceId??row.instanceId}>{signed(row.signedValue)}</span>)}</div>
    </div>
  </div>;
}
