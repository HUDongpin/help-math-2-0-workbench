import * as React from 'react';
import {P045IntroFigure} from './nms-l02-p045-intro-figure-v1';
import {p045IntroFrame} from './nms-l02-p045-intro-v1';
import {P045Instruction} from './nms-l02-p045-instruction-v1';
import {P045_COPY} from './nms-l02-p045-copy-v1';
/** Demonstration only. Live inputs begin at source main450 in a separate view. */
export function P045IntroView({frame,language='en',onModalChange,reducedMotion=false,interactive=true}:{frame:number;language?:'en'|'es';onModalChange?:(open:boolean)=>void;reducedMotion?:boolean;interactive?:boolean}){
  const state=p045IntroFrame(frame),copy=P045_COPY[language],id=React.useId();
  if(frame<5)return null;
  return <section className="p045-activity" lang={language} data-p045-intro-frame={frame}>
    <h2>{copy.title}</h2><P045Instruction text={copy.instruction} language={language} enabled={interactive} onModalChange={onModalChange}/><p className="p045-demonstration-label">{copy.watch}</p>
    <div className="p045-chart-and-answer"><P045IntroFigure frame={frame} language={language} reducedMotion={reducedMotion}/>
      <div className="p045-fraction-fields" role="group" aria-label={copy.watch}>
        <label htmlFor={id+'-numerator'}>{copy.numerator}</label>
        <input id={id+'-numerator'} type="text" inputMode="numeric" value={state.numerator} readOnly tabIndex={-1} aria-readonly="true"/>
        <span className="p045-fraction-line" aria-hidden="true"/>
        <label htmlFor={id+'-denominator'}>{copy.denominator}</label>
        <input id={id+'-denominator'} type="text" inputMode="numeric" value={state.denominator} readOnly tabIndex={-1} aria-readonly="true"/>
      </div>
    </div>
    <div className="p045-actions"><button type="button" disabled>{copy.check}</button><button type="button" disabled>{copy.next}</button></div>
  </section>;
}
