import * as React from 'react';
import {P040_SOURCE} from './generated/nms-l02-p040-presentation-v1';
import type {P040Term} from './nms-l02-p040-state-v1';
export function p040InstructionAt(frame:number,reducedMotion=false){
 if(!Number.isInteger(frame)||frame<1||frame>440)throw Error('P040_FRAME');
 return P040_SOURCE.glyphs.map(g=>({offset:g.offset,text:g.text,visible:reducedMotion||g.text===' '||(g.firstFrame!==null&&frame>=g.firstFrame)}));
}
export function P040Instruction({frame,reducedMotion=false,interactive=true,onTerm}:{frame:number;reducedMotion?:boolean;interactive?:boolean;onTerm:(term:P040Term)=>void}){
 const glyphs=p040InstructionAt(frame,reducedMotion),parts:React.ReactNode[]=[];let offset=0;
 const span=(g:typeof glyphs[number])=><span key={g.offset} style={{visibility:g.visible?'visible':'hidden'}}>{g.text}</span>;
 for(const word of [...P040_SOURCE.wordBoundaries].sort((a,b)=>a.firstOffset-b.firstOffset)){
  if(offset<word.firstOffset)parts.push(<span key={`plain-${offset}`}>{glyphs.slice(offset,word.firstOffset).map(span)}</span>);
  const term=word.term as P040Term,ready=frame>=word.firstCompleteWordFrame;
  parts.push(<button key={term} type="button" data-p040-term={term} disabled={!interactive||!ready} onClick={()=>onTerm(term)} style={{font:'inherit',color:'inherit',border:0,padding:0,background:'transparent',textDecoration:'underline',cursor:interactive&&ready?'pointer':'default',minHeight:44}}>{glyphs.slice(word.firstOffset,word.lastOffset+1).map(span)}</button>);
  offset=word.lastOffset+1;
 }
 parts.push(<span key="tail">{glyphs.slice(offset).map(span)}</span>);
 return <p lang="en" data-lesson-text-block="instruction" data-p040-instruction-frame={frame} style={{lineHeight:1.6,overflowWrap:'anywhere'}}>{parts}</p>;
}
