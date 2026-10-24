import {P033_MODEL_EMPHASIS}from'./generated/nms-l02-p033-model-emphasis-v1';
import {p033Teaching,p033Highlights}from'./nms-l02-p033-teaching-v1';
import type {P033SessionState}from'./nms-l02-p033-state-v1';
import './nms-l02-p033-figures-v1.css';
export type P033FigureLanguage='en'|'es';
const columns=['Hundreds','Tens','Ones','Decimal Point','Tenths','Hundredths','Thousandths'];
export function P033HundredthsModel({state,language='en',reducedMotion=false}:{state:Pick<P033SessionState,'mainFrame'>;language?:P033FigureLanguage;reducedMotion?:boolean}){
 const t=p033Teaching(state);if(t.modelAlpha<=0)return null;
 return <svg className="p033-figure__model" viewBox="-4 -4 186 186" role="img" aria-label={language==='es'?'25 de 100 partes iguales sombreadas':'25 of 100 equal parts shaded'} data-p033-model="25/100">
  <g opacity={reducedMotion?1:t.modelAlpha}>{Array.from({length:100},(_,i)=><rect key={i} x={Math.floor(i/10)*17.8} y={(i%10)*17.795} width={17.8} height={17.795} fill={i<25?'#ff0000':'#fff'} stroke="#41566b" strokeWidth=".7" data-cell={i} data-shaded={String(i<25)}/>)}</g>
  <g aria-hidden="true">{p033Highlights(state,reducedMotion).map((p,i)=>{const id=String(p.characterId)as keyof typeof P033_MODEL_EMPHASIS;if(!Object.hasOwn(P033_MODEL_EMPHASIS,id))throw Error('P033_HIGHLIGHT_SOURCE');return <g key={i} transform={'matrix('+p.matrix.join(' ')+')'} opacity={p.alpha} data-p033-highlight={p.characterId} dangerouslySetInnerHTML={{__html:P033_MODEL_EMPHASIS[id]}}/>;})}</g>
 </svg>;
}
export function P033HundredthsHelpModel({language='en'}:{language?:P033FigureLanguage}){
 return <svg className="p033-figure__model" viewBox="0 0 202 202" role="img" aria-label={language==='es'?'23 de 100 partes iguales sombreadas':'23 of 100 equal parts shaded'} data-p033-model="23/100">{Array.from({length:100},(_,i)=><rect key={i} x={1+Math.floor(i/10)*20} y={1+(i%10)*20} width={20} height={20} fill={i<23?'#ff0000':'#fff'} stroke="#41566b" strokeWidth=".7" data-cell={i} data-shaded={String(i<23)}/>)}</svg>;
}
export function P033PlaceValueTable({example,language='en',onTerm}:{example:'answer'|'help';language?:P033FigureLanguage;onTerm?:(id:string,trigger:HTMLButtonElement)=>void}){
 const term=(id:string,label:string)=>onTerm?<button type="button" className="p033-figure__term" data-p033-term={id} onClick={e=>onTerm(id,e.currentTarget)}>{label}</button>:<span>{label}</span>;
 // Both values are independently verified against the source models and text.
 const values=example==='help'?['','','0','.','2','3','']:['','','0','.','2','5',''];
 return <div className="p033-figure__chart" lang="en" data-p033-chart={example}>
  <p className="p033-figure__chart-title" data-lesson-text-block="chart-title">{term('place-value-chart','Place Value Chart')}</p>
  <div className="p033-figure__scroll" role="region" aria-label={language==='es'?'Tabla de valor posicional':'Place value table'} tabIndex={0}>
   <table aria-label={example==='help'?'Place value of 0.23':'Place value of 0.25'}><thead data-lesson-text-block="chart-labels"><tr><th colSpan={3} scope="colgroup" className="ones">{term('ones-group','Ones')}</th><th aria-label="Decimal point separator"/><th colSpan={3} scope="colgroup" className="decimals">{term('decimal','Decimals')}</th></tr><tr>{columns.map((c,i)=><th key={c} scope="col" className={i<3?'ones':i>3?'decimals':''}>{c}</th>)}</tr></thead><tbody data-lesson-text-block="chart-number"><tr>{values.map((v,i)=><td key={i} className={i<3?'ones':i>3?'decimals':''} data-column={columns[i]}>{v}</td>)}</tr></tbody></table>
  </div>
 </div>;
}
export function P033AnswerChart({state,language='en',reducedMotion=false,onTerm}:{state:Pick<P033SessionState,'mainFrame'>;language?:P033FigureLanguage;reducedMotion?:boolean;onTerm?:(id:string,trigger:HTMLButtonElement)=>void}){
 const t=p033Teaching(state);return t.chartAlpha>0?<div style={{opacity:reducedMotion?1:t.chartAlpha}} data-p033-chart-alpha={t.chartAlpha}><P033PlaceValueTable example="answer" language={language} onTerm={t.chartTermsAvailable?onTerm:undefined}/></div>:null;
}
