import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P046PracticeView} from '../src/nms-l02-p046-practice-view-v1';
import * as p from '../src/nms-l02-p046-practice-v1';
const actions={onDone(){},onParts(){},onToggle(){},onInput(){},onCheck(){},onNew(){},onHelp(){},onCloseFeedback(){}};
const render=(state:p.P046Practice,language:'en'|'es'='en')=>renderToStaticMarkup(<P046PracticeView state={state} language={language} {...actions}/>);
test('both languages show source target, labelled input and native partition controls',()=>{
 for(const language of ['en','es']as const){const html=render(p.p046Enter(p.p046Initial(0)),language);assert(html.includes('2/4'));assert.equal((html.match(/<input /g)??[]).length,2);
  assert(html.includes(language==='en'?'Numerator':'Numerador'));assert(html.includes(language==='en'?'Denominator':'Denominador'));assert(html.includes('aria-pressed="false"'));assert(!html.includes('value="1"'));
 }
});
test('feedback and help lock the form, retain source example copy and show doubled reveal',()=>{
 let s=p.p046Enter(p.p046Initial(0));const wrong=p.p046Check(s),html=render(wrong);assert(html.includes('7/8 = 14/16'));assert(html.includes('Try again.'));assert.equal((html.match(/readOnly=""/g)??[]).length,2);
 const help=render(p.p046Help(s,true));assert(help.includes('2/4 = 1/2'));assert(help.replace(/<[^>]*>/g,'').includes('Equivalent fractions'));
 s=p.p046CloseFeedback(p.p046Check(p.p046CloseFeedback(wrong)));const reveal=render(s);assert(reveal.includes('value="4"'));assert(reveal.includes('value="8"'));assert(reveal.includes('Here is the requested fraction.'));
});

test('Done has an accessible button and early end does not claim all questions finished',()=>{
 for(const lang of ['en','es']as const){const ready=p.p046Enter(p.p046Initial(0)),html=render(ready,lang);assert(html.includes(lang==='en'?'>Done<':'>Terminar<'));const end=render(p.p046FinishContinuation(p.p046Done(ready)),lang);assert(end.includes(lang==='en'?'Practice ended.':'Práctica finalizada.'));assert(!end.includes('All three fractions finished.'));}
});
