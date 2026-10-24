import React from 'react';
import source from './generated/g4-l3-gs002-hit.json';

const rgba=(c:readonly number[])=>`rgba(${c[0]},${c[1]},${c[2]},${c[3]/255})`;
const shapes=new Map(source.staticShapes.map(s=>[s.characterId,s]));
const morph=source.morphShapes[0].decoded;

/** Exact child-frame view, no timer/audio/score. Modern reduced motion retains
 * the resting virus; the host activity must still run its full audio lifecycle. */
export function Gs002HitFigure({frame,reducedMotion=false,rowTarget=false}:{frame:number;reducedMotion?:boolean;rowTarget?:boolean}){
  if(!Number.isInteger(frame)||frame<1||frame>35)throw new RangeError('GS002 hit frame outside1–35');
  const visualFrame=reducedMotion?1:frame;
  return <svg aria-hidden="true" data-gs002-hit-frame={visualFrame} data-source-activity-frame={frame}
    viewBox={rowTarget?'-380 -125 994 625':'-2610 -125 3234 625'} style={{display:'block',width:'100%',height:'auto',overflow:'visible'}}>
    {source.frames[visualFrame-1].filter(n=>!rowTarget||![64,65].includes(n.characterId)).map(n=>{
      let content:React.ReactNode;
      if(n.characterId===64){
        const r=n.ratio/65535,a=morph.startEdges[0].points,b=morph.endEdges[0].points,l=morph.lines[0];
        const p=a.map((v,i)=>v+(b[i]-v)*r);
        content=<path d={`M${p[0]} ${p[1]} L${p[2]} ${p[3]}`} fill="none" stroke={rgba(l.startRgba)}
          strokeWidth={l.startWidthTwips} strokeLinecap="round"/>;
      }else{
        const s=shapes.get(n.characterId);if(!s)throw Error(`Missing source hit shape${n.characterId}`);
        content=s.epochs.flatMap((ep,ei)=>ep.paints.map((p,pi)=>{
          const style=p.style as {rgba:number[];widthTwips?:number};
          return p.kind==='fill'?<path key={`${ei}-${pi}`} d={p.d} fill={rgba(style.rgba)} fillRule="evenodd"/>
            :<path key={`${ei}-${pi}`} d={p.d} fill="none" stroke={rgba(style.rgba)} strokeWidth={style.widthTwips||1}
              vectorEffect={style.widthTwips===0?'non-scaling-stroke':undefined} strokeLinecap="round" strokeLinejoin="round"/>;
        }));
      }
      return <g key={n.instanceId} data-source-shape={n.characterId} transform={`matrix(${n.matrix.join(' ')})`}>{content}</g>;
    })}
  </svg>;
}

/** Responsive actor row: source target geometry remains uniformly scaled to a
 * 32px resting virus; only the beam's horizontal travel fits modern column gaps. */
export function Gs002HitRow({frame,reducedMotion=false,ship,row}:{frame:number;reducedMotion?:boolean;ship:string;row:number}){
  if(!Number.isInteger(frame)||frame<1||frame>35)throw new RangeError('GS002 hit frame outside1–35');
  const beam=reducedMotion?undefined:source.frames[frame-1].find(n=>n.characterId===64||n.characterId===65);
  const points=beam?.characterId===64?morph.startEdges[0].points.map((v,i)=>v+(morph.endEdges[0].points[i]-v)*beam.ratio/65535):[-190,140,-4,140];
  return <span data-gs002-hit-row={row} style={{position:'relative',display:'block',height:48,minWidth:0,gridColumn:'2 / 4'}}>
    <img src={ship} alt="Space coupe" data-gs002-ship-row={row} width={39} height={26}
      style={{position:'absolute',left:'25%',top:'50%',transform:'translate(-50%,-50%)',width:39,height:26,maxWidth:'none'}}/>
    {beam&&<svg aria-hidden="true" data-gs002-row-beam={beam.characterId} viewBox="-2600 130 2606 20" preserveAspectRatio="none"
      style={{position:'absolute',left:'calc(25% + 19.5px)',width:'calc(50% - 35.5px)',top:'calc(50% - 3.9px)',height:1.36,overflow:'visible'}}>
      <path d={`M${points[0]} ${points[1]} L${points[2]} ${points[3]}`} fill="none" stroke="rgb(255,255,0)" strokeWidth={20} strokeLinecap="round"/>
    </svg>}
    <span data-gs002-virus-row={row} style={{position:'absolute',left:'calc(75% - 41.763px)',top:'calc(50% - 21.186px)',width:67.39,height:42.373}}>
      <Gs002HitFigure frame={frame} reducedMotion={reducedMotion} rowTarget/>
    </span>
  </span>;
}
