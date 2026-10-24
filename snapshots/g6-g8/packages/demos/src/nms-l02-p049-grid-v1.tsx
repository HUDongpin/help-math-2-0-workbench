import React from 'react';
/** Source63 uses a vertical ten-part bar; source104/122/136/146 fill hundred grids by column. */
export function P049DecimalGrid({parts,total,language='en'}:{parts:number;total:10|100;language?:'en'|'es'}){
 if(!Number.isInteger(parts)||parts<0||parts>total)throw Error('P049_GRID_PARTS');
 const label=language==='es'?`${parts} de ${total} partes iguales coloreadas`:`${parts} of ${total} equal parts shaded`;
 return <div role="img" aria-label={label} className={`p049-grid p049-grid-${total}`} data-p049-grid-parts={parts}>
  {Array.from({length:total},(_,i)=>{const ordinal=total===10?i:(i%10)*10+Math.floor(i/10);return <span key={i} aria-hidden="true" data-p049-cell={i} data-filled={ordinal<parts?'true':'false'}/>;})}
 </div>;
}
