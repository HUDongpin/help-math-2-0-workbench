import {P031_MODEL_EMPHASIS}from'./generated/nms-l02-p031-model-emphasis-v1';
import {p031Teaching}from'./nms-l02-p031-teaching-v1';
import type {P031SessionState}from'./nms-l02-p031-state-v1';
import './nms-l02-p031-figures-v1.css';
export type P031FigureLanguage='en'|'es';
const columns=['Hundreds','Tens','Ones','Decimal Point','Tenths','Hundredths','Thousandths'];
/** Native equal-part model. Exact source emphasis paths remain in the model's
 * coordinate system; layout changes do not move a highlight to another strip. */
export function P031TenthsModel({state,language='en',reducedMotion=false}:{state:Pick<P031SessionState,'mainFrame'>;language?:P031FigureLanguage;reducedMotion?:boolean}){
 const t=p031Teaching(state);if(t.modelAlpha<=0)return null;
 return <svg className="p031-figure__model" viewBox="-4 -4 186 186" role="img" aria-label={language==='es'?'7 de 10 partes iguales sombreadas':'7 of 10 equal parts shaded'} data-p031-model="7/10">
  <g opacity={reducedMotion?1:t.modelAlpha}>{Array.from({length:10},(_,i)=><rect key={i} x={i*17.8} y={0} width={17.8} height={177.95} fill={i<7?'#3399ff':'#fff'} stroke="#41566b" strokeWidth=".7" data-strip={i} data-shaded={i<7?'true':'false'}/>)}</g>
  <g transform="translate(282.35 47.2)" aria-hidden="true">{t.highlightPoses.map(p=>{
   const id=String(p.characterId) as keyof typeof P031_MODEL_EMPHASIS;
   if(!Object.hasOwn(P031_MODEL_EMPHASIS,id))throw Error('P031_HIGHLIGHT_SOURCE');
   return <g key={p.depth+'-'+p.generation} transform={'matrix('+p.matrix.join(' ')+')'} opacity={p.color[3]} data-p031-highlight={p.characterId} dangerouslySetInnerHTML={{__html:P031_MODEL_EMPHASIS[id]}}/>;
  })}</g>
 </svg>;
}
/** Corrected help model retains the source23/100 grid. This is a distinct example. */
export function P031HundredthsHelpModel({language='en'}:{language?:P031FigureLanguage}){
 return <svg className="p031-figure__model" viewBox="0 0 202 202" role="img" aria-label={language==='es'?'23 de 100 partes iguales sombreadas':'23 of 100 equal parts shaded'} data-p031-model="23/100">{Array.from({length:10},(_,r)=>Array.from({length:10},(_,c)=><rect key={r+'-'+c} x={1+c*20} y={1+r*20} width={20} height={20} fill={c<2||(c===2&&r<3)?'#ffde00':'#fff'} stroke="#41566b" strokeWidth=".7" data-cell={r+'-'+c} data-shaded={c<2||(c===2&&r<3)?'true':'false'}/>))}</svg>;
}
export function P031PlaceValueTable({example,language='en',onTerm}:{example:'answer'|'help';language?:P031FigureLanguage;onTerm?:(id:string,trigger:HTMLButtonElement)=>void}){
 const term=(id:string,label:string)=>onTerm?<button type="button" className="p031-figure__term" data-p031-term={id} onClick={e=>onTerm(id,e.currentTarget)}>{label}</button>:<span>{label}</span>;
 // Source help table0.03 contradicts the source23/100 grid/prose/equation.
 // The deliberate teaching correction0.23 is recorded in the migration audit.
 const values=example==='help'?['','','0','.','2','3','']:['','','0','.','7','',''];
 return <div className="p031-figure__chart" lang="en" data-p031-chart={example}>
  <p className="p031-figure__chart-title" data-lesson-text-block="chart-title">{term('place-value-chart','Place Value Chart')}</p>
  <div className="p031-figure__scroll" role="region" aria-label={language==='es'?'Tabla de valor posicional':'Place value table'} tabIndex={0}>
   <table aria-label={example==='help'?'Place value of 0.23':'Place value of 0.7'}><thead data-lesson-text-block="chart-labels"><tr><th colSpan={3} scope="colgroup" className="ones">{term('ones-group','Ones')}</th><th aria-label="Decimal point separator"/><th colSpan={3} scope="colgroup" className="decimals">{term('decimal','Decimals')}</th></tr><tr>{columns.map((c,i)=><th key={c} scope="col" className={i<3?'ones':i>3?'decimals':''}>{c}</th>)}</tr></thead><tbody data-lesson-text-block="chart-number"><tr>{values.map((v,i)=><td key={i} className={i<3?'ones':i>3?'decimals':''} data-column={columns[i]}>{v}</td>)}</tr></tbody></table>
  </div>
 </div>;
}
export function P031AnswerChart({state,language='en',reducedMotion=false,onTerm}:{state:Pick<P031SessionState,'mainFrame'>;language?:P031FigureLanguage;reducedMotion?:boolean;onTerm?:(id:string,trigger:HTMLButtonElement)=>void}){
 const t=p031Teaching(state);return t.chartAlpha>0?<div style={{opacity:reducedMotion?1:t.chartAlpha}} data-p031-chart-alpha={t.chartAlpha}><P031PlaceValueTable example="answer" language={language} onTerm={onTerm}/></div>:null;
}
