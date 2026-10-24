import React from 'react';
import type {LessonTextBinding} from './lesson-text-contract';
import {P008_TEXT_STATE_SOURCE as SOURCE,p008TextState} from './alg-l06-p008-text-state-v1.generated';

/** Native companion to the preserved source artwork. No Canvas glyph is suppressed.
 * Prices restore a partially cropped invariant label/value pair; table answers wait
 * until both source members have completed their masked reveal. */
export const P008_NATIVE_TEXT_BINDING:LessonTextBinding={
 schemaVersion:1,version:'alg-l06-p008-native-text-v1',
 placementId:SOURCE.animationId,animationId:SOURCE.animationId,
 sourceSwfSha256:SOURCE.sourceSwfSha256,template:'complex-figure',
 blocks:[
  {id:'title',sourceTextIds:SOURCE.title.sourceTextIds,sourceShapeIds:SOURCE.title.sourceShapeIds,role:'title',language:'en',readingOrder:0,valueSource:'source-static'},
  ...SOURCE.prices.map((p,i)=>({id:p.id,sourceTextIds:[`character-${p.labelId}`,`character-${p.valueId}`],role:'label' as const,language:'en' as const,readingOrder:1+i,valueSource:'maintained-page-state' as const})),
  {id:'table-headers',sourceTextIds:['character-34','character-35'],role:'heading',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
  ...SOURCE.tableRows.map((r,i)=>({id:r.id,sourceTextIds:[`character-${r.cupsId}`,`character-${r.moneyId}`],
   sourceShapeIds:SOURCE.emphasis.filter(e=>e.rowId===r.id).flatMap(e=>[...e.sourceShapeIds]),
   role:'answer' as const,language:'en' as const,readingOrder:4+i,valueSource:'maintained-page-state' as const})),
 ],
};

export function P008NativeTextV1({frame,replay=0,language='en'}:{frame:number;replay?:number;language?:'en'|'es'}){
 if(!Number.isInteger(replay)||replay<0)throw Error('P008_INVALID_REPLAY');
 const state=p008TextState(frame);
 const headers=[34,35].map(id=>state.entries.find(e=>e.characterId===id)!);
 const tableVisible=headers.every(e=>e.visibility==='full');
 const cell:React.CSSProperties={padding:'0.5em',borderBottom:'1px solid #b6c4ce',textAlign:'start',overflowWrap:'anywhere'};
 return <section lang="en" aria-label="Lesson text" data-p008-native-text="true"
  data-p008-text-frame={frame} data-p008-text-replay={replay}
  data-p008-binding={P008_NATIVE_TEXT_BINDING.version} data-p008-canvas-suppression="none"
  data-p008-language-policy={language==='es'?'source-en-fallback':'source-en'}
  style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',lineHeight:1.5,color:'#15344c',minWidth:0,padding:'1rem',background:'#fff',borderRadius:'0.75rem'}}>
  <h2 data-source-text-ids={state.title.sourceTextIds.join(' ')} data-source-shape-ids={state.title.sourceShapeIds.join(' ')}
   style={{fontSize:'1.25em',lineHeight:1.35,margin:'0 0 0.75em',overflowWrap:'anywhere'}}>{state.title.text}</h2>
  <div style={{display:'flex',flexWrap:'wrap',gap:'0.75em 2em'}}>
   {state.prices.filter(p=>p.semanticVisible).map(p=><dl key={p.id} data-p008-price={p.id}
    data-source-text-ids={p.sourceTextIds.join(' ')} data-source-instance-ids={p.instanceIds.join(' ')}
    data-p008-reveal="partial-context-restoration" style={{margin:'0 0 0.75em'}}>
    <dt>{p.label}</dt><dd style={{margin:0,fontWeight:600}}>{p.value}</dd>
   </dl>)}
  </div>
  {tableVisible?<div role="region" aria-label="Lemonade sales table" tabIndex={0} style={{overflowX:'auto'}}>
   <table data-p008-table="lemonade" style={{borderCollapse:'collapse',tableLayout:'fixed',width:'100%',minWidth:'16em',fontVariantNumeric:'tabular-nums'}}>
   <thead><tr>{headers.map((h,i)=><th key={h.characterId} scope="col" data-source-text-ids={h.sourceTextIds.join(' ')} style={{...cell,textAlign:i===1?'end':'start'}}>{h.text}</th>)}</tr></thead>
   <tbody>{state.tableRows.filter(r=>r.semanticVisible).map(r=>{
    const emphasis=state.emphasis.filter(e=>e.rowId===r.id);
    return <tr key={r.id} data-p008-row={r.id} data-source-text-ids={r.sourceTextIds.join(' ')}
     data-source-instance-ids={r.instanceIds.join(' ')} data-p008-emphasis={emphasis.length?'source-outline':undefined}
     data-source-shape-ids={emphasis.flatMap(e=>[...e.sourceShapeIds]).join(' ')||undefined}
     style={emphasis.length?{background:'#fce7f3',fontWeight:700}:undefined}>
     <th scope="row" style={{...cell,fontWeight:emphasis.length?700:400,whiteSpace:'nowrap'}}>{r.cups}</th><td style={{...cell,whiteSpace:'nowrap',textAlign:'end'}}>{r.money}</td>
    </tr>;
   })}</tbody>
  </table></div>:null}
 </section>;
}
