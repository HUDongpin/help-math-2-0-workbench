'use client';
import type{ComponentProps}from'react';
import type{AnimationRendererProps}from'./contract';
import{FixedExitHelpPresentationV1,FixedExitFractionV1}from'./source-fixed-exit-help-presentation-v1';
import{ALG_L07_P045_SOURCE as S,type P045SourceTerm,type P045Visual}from'./alg-l07-p045-source-v1';
import{algL07P045Frame}from'./alg-l07-p045-frame-v1';
import './alg-l07-p045-v1.css';
type Props=Omit<ComponentProps<typeof FixedExitHelpPresentationV1<P045SourceTerm,317|399,P045Visual>>,'page'|'source'|'question'|'beforeAnswers'|'afterAnswers'|'compact'|'move'>;
export function AlgL07P045Presentation(props:Props){const v=props.view.visual;return <FixedExitHelpPresentationV1 {...props} page="p045" source={S} compact={v.answerAlpha.B>0&&v.answerAlpha.A===0&&v.answerAlpha.C===0&&v.answerAlpha.D===0} move={v.bMove}
 question={<>7 What is the <span data-source-term-flash={v.termFlash.includes('Y-intercept')}>y-intercept</span> of the <span data-source-term-flash={v.termFlash.includes('Linear function')}>linear function</span> <span className="fixed-exit-help__question-equation" role="math" aria-label="y equals negative three fourths x minus two fifths"><span aria-hidden="true" className="fixed-exit-help__math-flow"><span className="fixed-exit-help__math-term">y = −</span><FixedExitFractionV1 numerator="3" denominator="4"/><span>x</span><span className="alg-l07-p045__constant" data-p045-question-constant="true" data-source-white-halo={v.whiteHaloTargets.includes('question-constant')}><span data-p045-negative-sign="true" data-source-negative-highlight={v.negativeSignHighlight} data-source-overlay-minus={v.overlayMinus}>−</span><FixedExitFractionV1 numerator="2" denominator="5"/></span><span>?</span></span></span></>}
 afterAnswers={v.paragraphs.some(p=>p.length>0)&&<div className="fixed-exit-help__explanation">{v.paragraphs.map((text,i)=>text&&<p key={i} data-lesson-text-block="post-402" data-source-text-id="character-402">{text}</p>)}</div>}/>;}
export function AlgL07P045Renderer(props:AnimationRendererProps){return <AlgL07P045Presentation view={algL07P045Frame(props.frame,{...props,frame:props.frame})}/>;}
