import React from 'react';
import source from './generated/g4-l3-ti004-question.json';
export const TI004_KEY_TERMS={...source.keyTerms,indexLanguage:'en' as const};
export type Ti004OpenTerm=(entryId:string,trigger:HTMLButtonElement)=>void;
const labels:Readonly<Record<string,keyof typeof source.keyTerms.entries>>={order:'Order',least:'Least',greatest:'Greatest',value:'Value','negative numbers':'Negative number',decreases:'Decrease','positive numbers':'Positive number',increases:'Increase'};
export function Ti004SourceText({text,onKeyTerm}:{text:string;onKeyTerm?:Ti004OpenTerm}){
 return <>{text.split(/(\bnegative numbers\b|\bpositive numbers\b|\bdecreases\b|\bincreases\b|\border\b|\bleast\b|\bgreatest\b|\bvalue\b)/gi).map((part,i)=>{
  const key=labels[part.toLowerCase()];return key&&onKeyTerm?<button key={i} type="button" data-ti004-keyterm={source.keyTerms.entries[key]} onClick={e=>onKeyTerm(source.keyTerms.entries[key],e.currentTarget)} style={{font:'inherit',lineHeight:'inherit',color:'#153d8a',background:'transparent',border:0,borderRadius:0,minWidth:0,minHeight:0,padding:0,textDecoration:'underline'}}>{part}</button>:<React.Fragment key={i}>{part}</React.Fragment>;
 })}</>;
}
