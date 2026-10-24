import React from 'react';
import {P050NumberLine} from './nms-l02-p050-practice-view-v1';
import {P050_ITEMS} from './nms-l02-p050-practice-v1';
import {P050_TEXT,type P050Language} from './nms-l02-p050-text-v1';
/** Source210 removes practice controls but retains question, instructions and revealed targets. */
export function P050OutroView({language,complete=false}:{language:P050Language;complete?:boolean}){
 const text=P050_TEXT[language];
 return <section lang={language}>
  <h2>{text.question}</h2><p>{text.instruction}</p><p>{text.helpInstruction}</p>
  <P050NumberLine language={language}>{P050_ITEMS.map(item=><span key={item.id} className="p050-example" style={{left:`${8+item.tenths*2.7}%`}}>{item.decimal}</span>)}</P050NumberLine>
  {complete&&<p role="status">{text.complete}</p>}
 </section>;
}
