import * as React from 'react';
export interface P044PartitionProps {
  parts:number; selected:readonly number[]; language?:'en'|'es'; disabled?:boolean;
  onToggle:(part:number)=>void;
}
export function p044PartsLabel(parts:number,language:'en'|'es') {return language==='es'?`${parts} ${parts===1?'parte igual':'partes iguales'}`:`${parts} equal ${parts===1?'part':'parts'}`;}
/** Equal-area source strips; horizontal rows keep all twenty touch targets usable. */
export function P044Partition({parts,selected,language='en',disabled=false,onToggle}:P044PartitionProps){
  if(!Number.isInteger(parts)||parts<1||parts>20||new Set(selected).size!==selected.length
    ||selected.some(p=>!Number.isInteger(p)||p<1||p>parts))throw Error('P044_PARTITION_IDENTITY');
  const title=language==='es'?`Un todo dividido en ${p044PartsLabel(parts,language)}`:`One whole divided into ${p044PartsLabel(parts,language)}`;
  return <figure className="p044-partition" data-parts={parts} data-selected-count={selected.length}>
    <div className="p044-partition__whole" role="group" aria-label={title}>
      {Array.from({length:parts},(_,i)=>i+1).map(part=><button key={part} type="button" className="p044-partition__part"
        data-source-instance={`Mc_${part}`} aria-pressed={selected.includes(part)} disabled={disabled}
        aria-label={language==='es'?`Parte ${part} de ${parts}`:`Part ${part} of ${parts}`} onClick={()=>onToggle(part)}>
        <span aria-hidden="true">{selected.includes(part)?'✓':'\u00a0'}</span>
      </button>)}
    </div>
    <figcaption>{language==='es'?`${selected.length} de ${parts} ${parts===1?'parte seleccionada':'partes seleccionadas'}`:`${selected.length} of ${parts} ${parts===1?'part':'parts'} selected`}
      <span className="p044-partition__fraction">{selected.length}/{parts}</span>
    </figcaption>
  </figure>;
}
