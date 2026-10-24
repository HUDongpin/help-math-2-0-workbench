"use client";
import React,{useId} from 'react';
import type {P044Query} from './g678-nms-l01-p044-controller';
import {P044_READABLE_INSTRUCTION as SOURCE} from './generated/g678-nms-l01-p044-readable-instruction-v1';
type NumberLine = typeof SOURCE.jeans | typeof SOURCE.help;
export function p044ReadableSections(query:P044Query){
  const held=query.phase==='explanation-held',active=query.activeNestedFrames[0];
  if(query.phase==='popup')return Object.freeze({task:false,information:false,equation:false,numberLine:false,help:true});
  return Object.freeze({task:query.mainFrame>=SOURCE.reveal.questionTask,information:query.mainFrame>=SOURCE.reveal.information,
    equation:query.mainFrame>=SOURCE.reveal.equation||(held&&active?.sourceObjectId===106&&active.frame===15),
    numberLine:query.mainFrame>=SOURCE.reveal.numberLine||(held&&active?.sourceObjectId===139&&active.frame===49),help:false});
}
export function P044ReadableNumberLine({model}:{model:NumberLine}){
  const marker=`p044-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g,'_')}`;
  const x=(value:number)=>40+(value-model.axisMin)*480/(model.axisMax-model.axisMin);
  const summary=`${model.jumpCount} equal jumps of $${model.jumpValue}: ${model.jumpEndpoints.join(' → ')}. Number line from0 to130 dollars.`;
  return <figure data-p044-readable-number-line={model.jumpValue} data-jump-count={model.jumpCount}
    style={{margin:'16px 0',padding:0,color:'#13284c'}}>
    <svg role="img" aria-label={summary} viewBox="0 0 560 220" style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}>
      <defs><marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 Z" fill="#2459a9"/></marker></defs>
      <line x1={x(0)} x2={x(130)} y1={150} y2={150} stroke="#13284c" strokeWidth={3}/>
      {Array.from({length:14},(_,i)=>i*10).map(value=><line key={value} x1={x(value)} x2={x(value)} y1={144} y2={156} stroke="#13284c" strokeWidth={2}/>)}
      {model.jumpEndpoints.slice(1).map((to,index)=>{
        const from=model.jumpEndpoints[index];return <g key={index} data-jump-from={from} data-jump-to={to}>
          <path d={`M ${x(from)} 147 Q ${(x(from)+x(to))/2} 40 ${x(to)} 147`} fill="none" stroke="#2459a9" strokeWidth={4} markerEnd={`url(#${marker})`}/>
          <text x={(x(from)+x(to))/2} y={73} textAnchor="middle" fontSize={30} fill="#13284c" fontFamily="system-ui, sans-serif">${model.jumpValue}</text>
        </g>;
      })}
      {model.jumpEndpoints.map(value=><g key={value}><line x1={x(value)} x2={x(value)} y1={140} y2={161} stroke="#13284c" strokeWidth={3}/>
        <text data-number-line-label={value} x={x(value)} y={195} textAnchor="middle" fontSize={30} fill="#13284c" fontFamily="system-ui, sans-serif">{value}</text></g>)}
    </svg>
    <figcaption style={{fontSize:20,lineHeight:1.5}}>{model.jumpCount} equal jumps of ${model.jumpValue}. <span style={{display:'block'}}>Number line: 0–130 dollars.</span></figcaption>
    <p data-p044-readable-sum="true" style={{fontSize:20,lineHeight:1.5,margin:'8px 0 0',overflowWrap:'anywhere'}}>{Array.from({length:model.jumpCount},()=>`$${model.jumpValue}`).join(' + ')} = ${model.jumpEndpoints.at(-1)}</p>
  </figure>;
}
const sectionStyle:React.CSSProperties={margin:'16px 0',padding:'16px 0',borderTop:'1px solid #a4b2c5',fontSize:20,lineHeight:1.5,overflowWrap:'anywhere'};
const headingStyle:React.CSSProperties={fontSize:22,lineHeight:1.5,fontWeight:600,margin:'0 0 12px'};
const paragraphStyle:React.CSSProperties={margin:'8px 0',fontSize:20,lineHeight:1.5};
/** Readable mathematical equivalents supplement, never replace or recolor, the
 * fixed source plane. They are not an original-runtime capture or translation. */
export function P044ReadableInstruction({query}:{query:P044Query}){
  const show=p044ReadableSections(query),text=SOURCE.text;
  return <div data-p044-readable-instruction="v1" data-source-sha256={SOURCE.source.sha256} lang="en">
    {show.task?<section data-readable-section="task" style={sectionStyle}><h3 style={headingStyle}>1. {text[45]}</h3></section>:null}
    {show.information?<section data-readable-section="information" style={sectionStyle}><h3 style={headingStyle}>2. {text[86]}</h3>
      <p style={paragraphStyle}>{text[88]}</p><p style={paragraphStyle}>{text[89]}</p><p style={paragraphStyle}>{text[87]}</p></section>:null}
    {show.equation?<section data-readable-section="equation" style={sectionStyle}><h3 style={headingStyle}>3. {SOURCE.equation.label}</h3>
      <p data-p044-readable-equation="symbolic" style={paragraphStyle}>{SOURCE.equation.symbolic}</p>
      <p data-p044-readable-equation="numeric" style={{...paragraphStyle,fontWeight:600}}>{SOURCE.equation.numeric}</p></section>:null}
    {show.numberLine?<section data-readable-section="number-line" style={sectionStyle}><h3 style={headingStyle}>4. {text[109]}</h3>
      <P044ReadableNumberLine model={SOURCE.jeans}/></section>:null}
    {show.help?<section data-readable-section="help" style={sectionStyle}>
      <h3 style={headingStyle}>Help example</h3><p style={paragraphStyle}>{text[280]}</p><p style={paragraphStyle}>{text[282]}</p>
      <p style={paragraphStyle}>{text[281]}</p><p style={paragraphStyle}>{SOURCE.help.symbolic}</p>
      <p data-p044-readable-equation="help" style={{...paragraphStyle,fontWeight:600}}>{SOURCE.help.numeric}</p>
      <P044ReadableNumberLine model={SOURCE.help}/></section>:null}
  </div>;
}
