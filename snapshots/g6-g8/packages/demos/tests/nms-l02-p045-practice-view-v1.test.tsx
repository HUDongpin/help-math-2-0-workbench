import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P045PracticeView} from '../src/nms-l02-p045-practice-view-v1';
import {p045Initial,p045Enter,p045Input,p045Check,p045CloseFeedback,p045FinishReveal,p045Question,p045Help} from '../src/nms-l02-p045-practice-v1';
const noop=()=>{};
function render(state:ReturnType<typeof p045Initial>,language:'en'|'es'='en'){return renderToStaticMarkup(<P045PracticeView state={state} language={language} onInput={noop} onCheck={noop} onNew={noop} onHelp={noop} onCloseFeedback={noop}/>);}
test('live form begins with blank labelled fields and no prefilled answer',()=>{
 for(const language of ['en','es']as const){const html=render(p045Enter(p045Initial()),language);assert.equal((html.match(/<input /g)??[]).length,2);assert.equal((html.match(/value=""/g)??[]).length,2);assert(!html.includes('readOnly=""'));assert(html.includes('<form>'));assert(html.includes('type="submit"'));assert(html.includes(language==='en'?'Numerator':'Numerador'));assert(!html.includes('2/10'));}
});
test('wrong feedback locks inputs, first Close retries, second Close reveals source answer',()=>{
 let s=p045Enter(p045Initial());s=p045Check(p045Input(s,'numerator','wrong'));let html=render(s);assert.equal((html.match(/readOnly=""/g)??[]).length,2);assert(html.includes('Try again.'));
 s=p045CloseFeedback(s);assert(!render(s).includes('readOnly=""'));s=p045Check(s);assert(!render(s).includes('Try again.'));s=p045CloseFeedback(s);html=render(s);assert(html.includes(`value="${p045Question(s).numerator}"`));assert(html.includes('value="10"'));assert(html.includes('Here is the requested fraction.'));s=p045FinishReveal(s);assert.equal(s.phase,'awaiting-new');assert.equal((render(p045Help(s,true)).match(/readOnly=""/g)??[]).length,2);
});
