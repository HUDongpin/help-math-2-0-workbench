'use client';
import {Fragment} from 'react';
import type {AnimationRendererProps} from './contract';
import type {FixedExitPresentationPropsV1} from './source-fixed-exit-help-player-v4';
import {FixedExitHelpPresentationV4} from './source-fixed-exit-help-presentation-v4';
import {ALG_L07_P050_SOURCE as S,type P050SourceTerm} from './alg-l07-p050-source-v1';
import {algL07P050Frame,type P050View} from './alg-l07-p050-frame-v1';
import './alg-l07-p050-v1.css';
function RichText({id,flashes=[]}:{id:number;flashes?:readonly P050SourceTerm[]}){
 const text=S.richTexts.find(t=>t.characterId===id)!;
 return <>{text.tokens.map((t,i)=>t.superscript?<sup key={i}>2</sup>:t.term?<span key={i} data-source-term-flash={flashes.includes(t.term)}>{t.text}</span>:<Fragment key={i}>{t.text}</Fragment>)}</>;
}
function Formula({id}:{id:number}){const text=S.richTexts.find(t=>t.characterId===id)!;return <span className="alg-l07-p050__formula" role="math" aria-label={text.text.replaceAll('²',' squared')}><span aria-hidden="true"><RichText id={id}/></span></span>;}
export function AlgL07P050Presentation(props:FixedExitPresentationPropsV1<P050SourceTerm,P050View>){
 const v=props.view.visual;
 return <FixedExitHelpPresentationV4 {...props} page="p050" source={S} compact={v.answerAlpha.C>0&&v.answerAlpha.A===0&&v.answerAlpha.B===0&&v.answerAlpha.D===0} move={v.correctMove}
  question={<>12 <RichText id={151} flashes={v.termFlash}/></>}
  beforeAnswers={v.tableAlpha>0&&<div className="alg-l07-p050__table" data-p050-table="true" style={{opacity:v.tableAlpha,transform:`translateY(${v.tableOffset}px)`}}><table><caption data-lesson-text-block="table-formula"><Formula id={152}/></caption><thead><tr><th scope="col" data-lesson-text-block="table-heading-r">r</th><th scope="col" data-lesson-text-block="table-heading-A">A</th></tr></thead><tbody>{S.table.rows.map(row=><tr key={row.input}><th scope="row" data-lesson-text-block={`table-input-${row.input}`}>{row.input}</th>{row.output===null?<td data-p050-missing-cell="true" aria-label="Missing value"/>:<td data-lesson-text-block={`table-output-${row.input}`}>{row.output}</td>}</tr>)}</tbody></table></div>}
  afterAnswers={<div className="alg-l07-p050__explanation">{v.postEquations.filter(p=>p.alpha>0).map(p=><p key={p.characterId} data-p050-post-equation={p.characterId} data-lesson-text-block={`post-equation-${p.characterId}`} style={{opacity:p.alpha,transform:`translateY(${p.offset}px)`}}><Formula id={p.characterId}/></p>)}</div>}
  renderHelpText={text=>[135,136].includes(text.characterId)?<Formula id={text.characterId}/>:<RichText id={text.characterId}/>}
  renderAnswer={answer=><span data-p050-number={answer.letter}>{answer.display}</span>}
 />;
}
export function AlgL07P050Renderer(props:AnimationRendererProps){return <AlgL07P050Presentation view={algL07P050Frame(props.frame,{...props,frame:props.frame})}/>;}
