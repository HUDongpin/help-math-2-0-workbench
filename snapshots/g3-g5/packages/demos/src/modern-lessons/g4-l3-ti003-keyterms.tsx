import React from 'react';
import source from './generated/g4-l3-ti003-intro.json';
export const TI003_KEY_TERMS = {...source.keyTerms,indexLanguage:'en' as const};
export type Ti003OpenTerm = (entryId:string,trigger:HTMLButtonElement)=>void;
const labels:Readonly<Record<string,keyof typeof source.keyTerms.entries>>={
  'number line':'Number line',line:'Line',ordering:'Order',value:'Value',
  'negative numbers':'Negative number','positive numbers':'Positive number',position:'Position',
};
export function Ti003SourceText({text,onKeyTerm}:{text:string;onKeyTerm?:Ti003OpenTerm}){
 return <>{text.split(/(\bnumber line\b|\bnegative numbers\b|\bpositive numbers\b|\bposition\b|\bordering\b|\bvalue\b|\bline\b)/gi).map((part,i)=>{
  const key=labels[part.toLowerCase()];return key&&onKeyTerm?<button key={i} type="button" className="ti003-source-term" data-ti003-keyterm={source.keyTerms.entries[key]} onClick={e=>onKeyTerm(source.keyTerms.entries[key],e.currentTarget)} style={{font:'inherit',lineHeight:'inherit',color:'#153d8a',background:'transparent',border:0,borderRadius:0,minWidth:0,minHeight:0,padding:0,textDecoration:'underline'}}>{part}</button>:<React.Fragment key={i}>{part}</React.Fragment>;
 })}</>;
}
