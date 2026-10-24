import React from 'react';
import source from './generated/g4-l3-ti004-question.json';

/** Source sprite-271 places the complete signed −10..10 help diagram. */
export function Ti004HelpNumberLine() {
  return <div role="group" tabIndex={0} aria-label="Number line from negative ten through zero to ten. Scroll horizontally to explore all positions."
    className="ti004-help-axis" style={{maxWidth:'100%',overflowX:'auto',padding:'.5rem .25rem 1rem'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(21,minmax(2rem,1fr))',width:'100%',minWidth:'42rem',fontSize:'1.125rem',lineHeight:1.5}}>
      {source.helpAxis.map(({value,label})=><div key={value} style={{textAlign:'center',color:value<0?'#b91c1c':value>0?'#153d8a':'#111'}}>
        <div aria-hidden="true" style={{height:'1rem',borderBottom:'2px solid currentColor',position:'relative'}}>
          <span style={{position:'absolute',left:'50%',bottom:'-.375rem',height:'.75rem',borderLeft:'2px solid currentColor'}}/>
          {Math.abs(value)===10?<span style={{position:'absolute',bottom:'-.8em',...(value<0?{left:0}:{right:0})}}>{value<0?'◀':'▶'}</span>:null}
        </div>
        <span data-ti004-help-number-label={value} data-lesson-text-block={`help-tick-${value}`} style={{display:'block',paddingTop:'.5rem'}}>{label}</span>
      </div>)}
    </div>
  </div>;
}
