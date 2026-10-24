'use client';
import type {AnimationRendererProps} from './contract';
import type {FixedExitPresentationPropsV1} from './source-fixed-exit-help-player-v3';
import {FixedExitHelpPresentationV3} from './source-fixed-exit-help-presentation-v3';
import {ALG_L07_P048_SOURCE as S,type P048SourceTerm} from './alg-l07-p048-source-v1';
import {algL07P048Frame,type P048View} from './alg-l07-p048-frame-v1';
import './alg-l07-p048-p049-v1.css';
export function AlgL07P048Presentation(props:FixedExitPresentationPropsV1<P048SourceTerm,P048View>){
 const v=props.view.visual;
 const token=(text:string)=><span data-p048-emphasis={text} data-source-emphasis={v.emphasis.some(e=>e.token===text&&e.alpha>0)}>{text}</span>;
 return <FixedExitHelpPresentationV3 {...props} page="p048" source={S} compact={v.answerAlpha.B>0&&v.answerAlpha.A===0&&v.answerAlpha.C===0&&v.answerAlpha.D===0} move={v.bMove}
  question={<>10 {S.question.split('linear function')[0]}<span data-source-term-flash={v.termFlash.includes('Linear function')}>linear function</span>{S.question.split('linear function')[1]}</>}
  renderAnswer={answer=>answer.letter==='B'?<span role="math" aria-label="M equals 7.75 L plus 15" data-p048-equation-text="M = 7.75L + 15"><span aria-hidden="true">{token('M')} {token('=')} <span className="alg-l07-p048__number">{token('7')}.{token('75')}</span>{token('L')} {token('+')} {token('15')}</span></span>:<span role="math" aria-label={answer.display}>{answer.display}</span>}
 />;
}
export function AlgL07P048Renderer(props:AnimationRendererProps){return <AlgL07P048Presentation view={algL07P048Frame(props.frame,{...props,frame:props.frame})}/>;}
