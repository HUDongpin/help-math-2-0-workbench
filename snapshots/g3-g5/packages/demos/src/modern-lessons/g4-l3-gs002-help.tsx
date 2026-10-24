import React from 'react';
import source from './generated/g4-l3-gs002-help.json';
import {Gs002Instructions} from './g4-l3-gs002-copy';

export const GS002_HELP_FIGURE=source;
const color=(rgba:number[])=>`rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3]/255})`;

/** Independent help scene: original vector artwork/arrows, native readable labels. */
export function Gs002Help(){
  return <div data-gs002-native-help="true" lang="en" style={{display:'grid',gap:'1rem',minWidth:0}}>
    <Gs002Instructions kind="help"/>
    <div role="group" aria-label="Help diagram: positive numbers move the space coupe up; negative numbers move it down. Labels run from seven to negative seven. Scroll horizontally to explore."
      tabIndex={0} style={{overflowX:'auto',maxWidth:'100%',border:'1px solid #8d9bb0',borderRadius:'.5rem'}}>
      <div style={{position:'relative',width:'100%',minWidth:'38rem',aspectRatio:'7000 / 4500',background:'#f7faff'}}>
        <svg aria-hidden="true" data-source-shape="161" viewBox={source.viewBox.join(' ')}
          style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
          {source.epochs.map((paints,index)=><g key={index}>{paints.map((paint,i)=><path key={i} d={paint.d}
            fill={paint.kind==='fill'?color(paint.rgba):'none'} fillRule="evenodd"
            stroke={paint.kind==='stroke'?('role' in paint&&paint.role==='guide-lines'?'#64748b':color(paint.rgba)):undefined}
            strokeWidth={'widthTwips' in paint?paint.widthTwips:undefined} strokeLinecap="round" strokeLinejoin="round"/>)}</g>)}
        </svg>
        {source.labels.map(label=><span key={label.value} data-source-text={label.sourceTextId}
          data-lesson-text-block={`help-tick-${label.value}`} data-gs002-help-value={label.value}
          style={{position:'absolute',left:'2rem',top:`${(label.centerY-3500)/4500*100}%`,transform:'translateY(-50%)',
            fontSize:'1.125rem',lineHeight:1.3,fontWeight:label.value===0?800:600,
            color:label.value<0?'#9f2222':label.value>0?'#153d8a':'#172033'}}>{label.label}</span>)}
      </div>
    </div>
  </div>;
}
