import React from 'react';
import {P052IntroGraphics} from './nms-l02-p052-intro-graphics-v1';
import {p052IntroScene,p052IntroDigits} from './nms-l02-p052-intro-scene-v1';
import {p052Copy,p052ShadeSummary,type P052Language} from './nms-l02-p052-copy-v1';

/** Pure semantic projection of source intro visibility; owns no elapsed-time clock. */
export function p052IntroText(frame:number,language:P052Language){
 const scene=p052IntroScene(frame),copy=p052Copy(language);
 const alpha=(id:number)=>scene.find(o=>o.characterId===id)?.alpha??0;
 // The source splits one instruction across two text fields with equal visibility.
 if(alpha(157)!==alpha(159))throw Error('P052_INTRO_PROMPT_VISIBILITY_DIVERGED');
 const digits=p052IntroDigits(frame);
 const labels=scene.filter(o=>o.kind==='text'&&(o.characterId===168||o.characterId===170||/^\d$/.test(o.text??''))).map(o=>({
  sourceId:o.characterId,path:o.path,alpha:o.alpha,
  text:o.characterId===168?copy.done:o.characterId===170?copy.reset:o.text!,
  left:o.stageMatrix[4]!/16000*100,top:o.stageMatrix[5]!/12000*100,
  kind:o.characterId===168||o.characterId===170?'control-label' as const:'digit' as const
 }));
 return {copy,questionAlpha:alpha(158),promptAlpha:alpha(157),digits,labels,
  summary:digits===null?null:p052ShadeSummary(Number(digits),language)};
}
/** Source-authored visual demonstration with live HTML text, not active practice controls. */
export function P052IntroView({frame,language}:{frame:number;language:P052Language}){
 const text=p052IntroText(frame,language),id=React.useId();
 return <section className="p052-intro" lang={language} data-p052-intro-frame={frame}>
  <h2 data-p052-source-text="154">{text.copy.title}</h2>
  <h3 data-p052-source-text="158" style={{opacity:text.questionAlpha}} aria-hidden={text.questionAlpha===0}>{text.copy.question}</h3>
  <p data-p052-source-text="157 159" style={{opacity:text.promptAlpha}} aria-hidden={text.promptAlpha===0}>{text.copy.prompt}</p>
  <div className="p052-intro-scroll" tabIndex={0} role="group" aria-labelledby={`${id}-description`}>
   <div className="p052-intro-plane">
    <P052IntroGraphics frame={frame}/>
    {text.labels.map(label=><span key={label.path} className={`p052-intro-${label.kind}`} data-p052-source-text={label.sourceId}
     aria-hidden="true" style={{left:`${label.left}%`,top:`${label.top}%`,opacity:label.alpha}}>{label.text}</span>)}
   </div>
  </div>
  <p id={`${id}-description`} className="p052-intro-description">{text.summary??text.copy.slider}</p>
 </section>;
}
