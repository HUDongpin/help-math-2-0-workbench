import React from 'react';
import {p048Decimal} from './nms-l02-p048-practice-v1';
export function P048HundredGrid({value,language='en',byColumn=false,tone='blue'}:{value:number;language?:'en'|'es';byColumn?:boolean;tone?:'blue'|'red'}){
 const decimal=p048Decimal(value);
 const label=language==='es'?`${decimal}: ${value} de 100 cuadrados coloreados`:`${decimal}: ${value} of 100 squares shaded`;
 return <div role="img" aria-label={label} className={`p048-grid p048-grid-${tone}`} data-p048-grid-value={value}>
  {Array.from({length:100},(_,index)=>{
   const row=Math.floor(index/10),column=index%10,ordinal=byColumn?column*10+row:index;
   return <span key={index} aria-hidden="true" data-p048-cell={index} data-filled={ordinal<value?'true':'false'}/>;
  })}
 </div>;
}
