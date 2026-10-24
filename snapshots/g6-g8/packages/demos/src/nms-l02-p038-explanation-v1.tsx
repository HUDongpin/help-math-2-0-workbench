'use client';
import {createElement,useId} from 'react';
import {P038_XML_PAGE_TITLE} from './generated/nms-l02-p038-page-title-source-v1';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {p038Teaching} from './nms-l02-p038-teaching-v1';
import type {P038SessionState,P038TermId} from './nms-l02-p038-state-v1';
import './nms-l02-p038-explanation-v1.css';
export function P038Explanation({state,language,reducedMotion=false,interactionEnabled=true,onTerm}:{
  state:P038SessionState;language:'en'|'es';reducedMotion?:boolean;interactionEnabled?:boolean;
  onTerm:(id:P038TermId,trigger:HTMLElement)=>void;
}) {
  const teaching=p038Teaching(state.mainFrame,reducedMotion),id=useId();
  return <section className="p038-explanation" lang="en" data-p038-frame={state.mainFrame} data-p038-phase={state.phase}>
    <LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>
    <h2 className="p038-explanation__title" data-p038-page-title data-lesson-xml-title={P038_XML_PAGE_TITLE.sourcePageReference} data-source-xml-sha256={P038_XML_PAGE_TITLE.sourceXml.sha256}>{P038_XML_PAGE_TITLE.title}</h2>
    {language==='es'&&<p className="p038-explanation__fallback" lang="es">Esta página conserva el texto original en inglés. Las definiciones están disponibles en español.</p>}
    <div className="p038-explanation__panel">
      <p className="p038-explanation__instruction" data-lesson-text-block="instruction">
        {teaching.runs.map((run,index)=><span key={run.sourceTextId} data-p038-run={run.sourceTextId}>
          {index===3&&run.text?' ':null}
          {run.termId&&run.termEnabled?<button type="button" data-p038-term={run.termId} disabled={!interactionEnabled||state.term!==null}
            onClick={e=>onTerm(run.termId as P038TermId,e.currentTarget)}>{run.text.trim()}</button>:run.text}
          {run.termId&&run.termEnabled&&/\s$/u.test(run.text)?' ':null}
        </span>)}
      </p>
      <div className="p038-explanation__models">
        <figure className="p038-explanation__grid" style={{visibility:teaching.grid.visible?'visible':'hidden'}} aria-hidden={!teaching.grid.visible||undefined}>
          <svg viewBox="-3 -3 206 206" role="img" aria-labelledby={id} data-p038-grid-count={teaching.grid.filled} data-p038-grid-emphasis={teaching.gridEmphasis}>
            <title id={id}>{language==='es'?`${teaching.grid.filled} de 100 casillas coloreadas`:`${teaching.grid.filled} of 100 squares shaded`}</title>
            {teaching.grid.cells.map(cell=><rect key={cell.row*10+cell.column} x={cell.column*20} y={cell.row*20} width="20" height="20" fill={cell.filled?'#ff0000':'#ffffff'} stroke="#111111" strokeWidth="1" data-p038-filled={cell.filled}/>)}
            {teaching.grid.cells.filter(c=>teaching.gridEmphasis==='all'||teaching.gridEmphasis==='filled'&&c.filled).map(cell=><rect key={'emphasis-'+cell.row*10+'-'+cell.column} x={cell.column*20} y={cell.row*20} width="20" height="20" fill="none" stroke="#0000cc" strokeWidth="5"/>) }
          </svg>
        </figure>
        <div className="p038-explanation__equation">
          <span style={{opacity:teaching.fractionAlpha}} aria-hidden={teaching.fractionAlpha===0||undefined} data-lesson-text-block="fraction-equation" data-p038-fraction-alpha={teaching.fractionAlpha}>
            {createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML'},createElement('mrow',null,createElement('mn',null,'75'),createElement('mo',null,'%'),createElement('mo',null,'='),createElement('mfrac',null,createElement('mn',null,'75'),createElement('mn',null,'100'))))}
          </span>
          <span style={{opacity:teaching.decimalAlpha}} aria-hidden={teaching.decimalAlpha===0||undefined} data-lesson-text-block="decimal-equation" data-p038-decimal-alpha={teaching.decimalAlpha}>
            {createElement('math',{xmlns:'http://www.w3.org/1998/Math/MathML'},createElement('mrow',null,createElement('mo',null,'='),createElement('mn',null,'0.75')))}
          </span>
        </div>
      </div>
    </div>
  </section>;
}
