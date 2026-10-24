import React from 'react';
import {P051Fraction} from './nms-l02-p051-practice-view-v1';
import {P051_ITEMS} from './nms-l02-p051-practice-v1';
import {P051_TEXT,type P051Language} from './nms-l02-p051-text-v1';
/** Main frame 486 removes choice controls and feedback, retaining five revealed targets. */
export function P051OutroView({language,complete=false}:{language:P051Language;complete?:boolean}){
 const text=P051_TEXT[language];
 return <section lang={language} data-p051-outro={complete?'complete':'playing'}>
  <h2>{text.question}</h2><p>{text.instruction}</p>
  <table className="p051-matches"><thead><tr><th scope="col">{text.fraction}</th><th scope="col">{text.equivalentDecimal}</th></tr></thead><tbody>
   {P051_ITEMS.map(item=>item.fraction?<tr key={item.id}><th scope="row"><P051Fraction numerator={item.fraction[0]} denominator={item.fraction[1]}/></th><td>{item.decimal}</td></tr>:null)}
  </tbody></table>
 </section>;
}
