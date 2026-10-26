import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P045HelpDiagram} from '../src/nms-l02-p045-help-diagram-v1';
import {P045PracticeView} from '../src/nms-l02-p045-practice-view-v1';
import {p045Initial,p045Enter,p045Help,p045Input,p045Check,p045CloseFeedback,p045Question} from '../src/nms-l02-p045-practice-v1';
const noop=()=>{};
test('help preserves original orange paths and equivalent bilingual four-of-six description',()=>{
 for(const language of ['en','es']as const){const html=renderToStaticMarkup(<P045HelpDiagram language={language}/>);assert(html.includes('#cc6600'));assert(html.includes('4/6'));assert(html.includes('role="img"'));assert(html.includes(language==='es'?'círculo':'circle'));assert(!html.includes('<script'));}
});
test('help locks ready form and preserves awaiting-new state independently of feedback',()=>{
 for(const language of ['en','es']as const){let s=p045Help(p045Enter(p045Initial()),true);let html=renderToStaticMarkup(<P045PracticeView state={s} language={language} onInput={noop} onCheck={noop} onNew={noop} onHelp={noop} onCloseFeedback={noop}/>);assert(html.includes('4/6'));assert.equal((html.match(/readOnly=""/g)??[]).length,2);s=p045Help(s,false);assert.equal(s.phase,'ready');const q=p045Question(s);s=p045Input(p045Input(s,'numerator',q.numerator),'denominator',q.denominator);s=p045CloseFeedback(p045Check(s));const helped=p045Help(s,true);assert.equal(p045Help(helped,false).phase,'awaiting-new');}
});
