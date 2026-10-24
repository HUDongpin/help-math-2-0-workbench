import React,{useId} from 'react';
import data from './generated/g4-l3-gs002-ending-paints.json';
import {getGs002EndingState,type Gs002EndingNode} from './g4-l3-gs002-ending';

type Style={kind?:string;rgba?:number[];widthTwips?:number;matrix?:number[];stops?:[number,number[]][];bitmapId?:number;repeat?:boolean};
type Paint={kind:string;d:string;style:Style};
type Shape={characterId:number;epochs:{paints:Paint[]}[]};
type Morph={characterId:number;decoded:{fills:unknown[];lines:{startWidthTwips:number;endWidthTwips:number;startRgba:number[];endRgba:number[]}[];startEdges:{points:number[]}[];endEdges:{points:number[]}[]}};
const shapes=new Map((data.staticShapes as unknown as Shape[]).map(s=>[s.characterId,s]));
const morphs=new Map((data.morphShapes as unknown as Morph[]).map(s=>[s.characterId,s]));
const bitmaps=new Map(data.bitmaps.map(b=>[b.characterId,b]));
const matrix=(m:number[])=>`matrix(${m.join(' ')})`;
const rgba=(c:number[])=>`rgba(${c[0]},${c[1]},${c[2]},${c[3]/255})`;
const lerp=(a:number,b:number,r:number)=>a+(b-a)*r;

/** No clock: vector-only source art consumes the same ending state as the game.
 * Source319 has no text. Dynamic score/status remain native DOM outside this SVG. */
export function Gs002EndingFigure({elapsedMs,reducedMotion=false}:{elapsedMs:number;reducedMotion?:boolean}){
  const id=useId().replace(/:/g,'_'),state=getGs002EndingState(elapsedMs,reducedMotion);
  function shape(cid:number,ratio:number,key:string,mask=false):React.ReactNode{
    const staticShape=shapes.get(cid);
    if(!staticShape){
      const m=morphs.get(cid);
      if(!m||m.decoded.fills.length||m.decoded.lines.length!==1||m.decoded.startEdges.length!==1)throw Error(`Unsupported ending shape ${cid}`);
      const r=ratio/65535,a=m.decoded.startEdges[0].points,b=m.decoded.endEdges[0].points,l=m.decoded.lines[0];
      if(a.length!==4||b.length!==4)throw Error('Ending morph must be a source straight segment');
      const p=a.map((v,i)=>lerp(v,b[i],r));
      return <path d={`M${p[0]} ${p[1]} L${p[2]} ${p[3]}`} fill="none" stroke={mask?'white':rgba(l.startRgba.map((v,i)=>lerp(v,l.endRgba[i],r)))}
        strokeWidth={lerp(l.startWidthTwips,l.endWidthTwips,r)} strokeLinecap="round"/>;
    }
    return staticShape.epochs.flatMap((e,ei)=>e.paints.map((p,pi)=>{
      const k=`${key}-${ei}-${pi}`,s=p.style;
      if(mask)return p.kind==='fill'?<path key={k} d={p.d} fill="white" fillRule="evenodd"/>:null;
      if(p.kind==='stroke')return <path key={k} d={p.d} fill="none" stroke={rgba(s.rgba!)} strokeWidth={s.widthTwips||1}
        vectorEffect={s.widthTwips===0?'non-scaling-stroke':undefined} strokeLinecap="round" strokeLinejoin="round"/>;
      if(s.kind==='solid')return <path key={k} d={p.d} fill={rgba(s.rgba!)} fillRule="evenodd"/>;
      if(s.kind==='radial-gradient')return <g key={k}><defs><radialGradient id={k} gradientUnits="userSpaceOnUse" gradientTransform={matrix(s.matrix!)} cx="0" cy="0" r="16384">
        {s.stops!.map(([offset,c],i)=><stop key={i} offset={offset/255} stopColor={rgba(c)}/>)}</radialGradient></defs><path d={p.d} fill={`url(#${k})`} fillRule="evenodd"/></g>;
      if(s.kind==='bitmap'){
        const b=bitmaps.get(s.bitmapId!);if(!b||s.repeat)throw Error('Unsupported ending bitmap');
        return <g key={k}><defs><clipPath id={k}><path d={p.d} clipRule="evenodd"/></clipPath></defs><g clipPath={`url(#${k})`}>
          <image href={b.dataUrl} width={b.width} height={b.height} transform={matrix(s.matrix!)} preserveAspectRatio="none"/></g></g>;
      }
      throw Error(`Unsupported ending paint ${s.kind}`);
    }));
  }
  function nodes(list:Gs002EndingNode[],prefix:string):React.ReactNode{
    const masks=list.filter(n=>n.clipDepth!==undefined);
    return <>{masks.map(n=><defs key={n.depth}><clipPath id={`${prefix}-mask-${n.depth}`} clipPathUnits="userSpaceOnUse" transform={matrix(n.matrix)}>
      {shape(n.characterId,n.ratio??0,`${prefix}-maskpaint-${n.depth}`,true)}</clipPath></defs>)}
      {list.filter(n=>n.clipDepth===undefined).map(n=>{
        const key=`${prefix}-${n.depth}`,c=n.colorTransform as {multiply:number[];add:number[];divisor:number}|undefined;
        if(c&&(c.divisor!==256||c.add.some(v=>v!==0)||c.multiply.slice(0,3).some(v=>v!==256)))throw Error('Unsupported ending color transform');
        let content:React.ReactNode=<g transform={matrix(n.matrix)} opacity={c?c.multiply[3]/256:1} data-source-shape={n.characterId}>
          {n.children?nodes(n.children,key):shape(n.characterId,n.ratio??0,key)}</g>;
        for(const mask of masks.filter(m=>m.depth<n.depth&&m.clipDepth!>=n.depth))content=<g clipPath={`url(#${prefix}-mask-${mask.depth})`}>{content}</g>;
        return <React.Fragment key={key}>{content}</React.Fragment>;
      })}</>;
  }
  return <svg aria-hidden="true" data-gs002-ending-frame={state.frame} viewBox="-6761 -3920 11363 7361"
    style={{display:'block',width:'100%',height:'auto',background:'#f7faff'}}>{nodes(state.nodes,id)}</svg>;
}
