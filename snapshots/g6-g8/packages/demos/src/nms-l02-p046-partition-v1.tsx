import * as React from 'react';
export function p046PartitionWindow(parts:number,requested:number){
 if(!Number.isSafeInteger(parts)||parts<1||!Number.isSafeInteger(requested)||requested<1||requested>parts)throw Error('P046_PARTITION_WINDOW');
 const start=Math.floor((requested-1)/20)*20+1,count=Math.min(20,parts-start+1);
 return Object.freeze({start,end:start+count-1,indices:Object.freeze(Array.from({length:count},(_,i)=>start+i))});
}
/** A whole overview plus a bounded, labelled detail window; every source part
 * remains addressable. Large counts never allocate one DOM node per part.
 */
export function P046Partition({parts,selected,language='en',interactive=true,onToggle}:{parts:number;selected:readonly number[];language?:'en'|'es';interactive?:boolean;onToggle:(part:number)=>void}){
 const[requested,setRequested]=React.useState(1),[jump,setJump]=React.useState('1');
 const window=p046PartitionWindow(parts,Math.min(requested,parts)),chosen=new Set(selected),es=language==='es',id=React.useId();
 if(chosen.size!==selected.length||selected.some(n=>!Number.isSafeInteger(n)||n<1||n>parts))throw Error('P046_PARTITION_SELECTION');
 const description=es?`Un entero con ${parts} partes iguales; ${selected.length} seleccionadas.`:`One whole with ${parts} equal parts; ${selected.length} selected.`;
 const go=(part:number)=>{setRequested(part);setJump(String(part));};
 const jumpNumber=Number(jump),validJump=/^\d+$/.test(jump)&&Number.isSafeInteger(jumpNumber)&&jumpNumber>=1&&jumpNumber<=parts;
 return <div className="p046-partition">
  <figure className="p046-figure"><svg viewBox="0 0 324 203" role="img" aria-label={description}>
   <rect x="1" y="1" width="322" height="201" fill="#fff" stroke="#172c43"/>
   {selected.map(n=><rect key={n} x={1+(n-1)*322/parts} y="1" width={322/parts} height="201" fill="#0000ff"/>)}
   {parts<=128&&Array.from({length:parts-1},(_,i)=><path key={i} d={`M${1+(i+1)*322/parts} 1 V202`} stroke="#172c43"/>)}
  </svg><figcaption>{description}</figcaption></figure>
  {parts>128&&<p>{es?'Las divisiones son muy pequeñas en la vista completa. Usa el detalle para seleccionar cada parte.':'The divisions are very small in the whole view. Use the detail to select each part.'}</p>}
  <p>{es?`Detalle: partes ${window.start}–${window.end} de ${parts}`:`Detail: parts ${window.start}–${window.end} of ${parts}`}</p>
  <div className="p046-part-buttons" role="group" aria-label={es?'Seleccionar partes':'Select parts'}>
   {window.indices.map(n=><button type="button" key={n} disabled={!interactive} aria-pressed={chosen.has(n)} aria-label={es?`Parte ${n} de ${parts}`:`Part ${n} of ${parts}`} onClick={()=>onToggle(n)}>{n}</button>)}
  </div>
  {parts>20&&<div className="p046-part-navigation">
   <button type="button" disabled={!interactive||window.start===1} onClick={()=>go(Math.max(1,window.start-20))}>{es?'Partes anteriores':'Previous parts'}</button>
   <button type="button" disabled={!interactive||window.end===parts} onClick={()=>go(window.end+1)}>{es?'Partes siguientes':'Next parts'}</button>
   <label htmlFor={id}>{es?'Número de parte':'Part number'}</label><input id={id} type="text" inputMode="numeric" value={jump} disabled={!interactive} onChange={e=>setJump(e.currentTarget.value)}/>
   <button type="button" disabled={!interactive||!validJump} onClick={()=>go(jumpNumber)}>{es?'Mostrar parte':'Show part'}</button>
  </div>}
 </div>;
}
