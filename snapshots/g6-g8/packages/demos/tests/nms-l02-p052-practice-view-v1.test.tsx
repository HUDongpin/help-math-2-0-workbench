import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {P052PracticeView,P052PercentGrid} from '../src/nms-l02-p052-practice-view-v1';
import {p052CaptureState,type P052CaptureScenario} from '../src/nms-l02-p052-capture-state-v1';
import {P052_COPY} from '../src/nms-l02-p052-copy-v1';
const state=(scenario:P052CaptureScenario)=>p052CaptureState({scenario,frame:115,seed:0,language:'en',frameDomain:'sprite-350'}).state;
const render=(scenario:P052CaptureScenario,language:'en'|'es'='en')=>renderToStaticMarkup(<P052PracticeView state={state(scenario)} language={language} interactive={false} onEvent={()=>{throw Error('SSR must not dispatch');}}/>);
test('all101 percentages render exactly100 source-ordered cells with exact shaded counts',()=>{
 for(let percent=0;percent<=100;percent++){
  const html=renderToStaticMarkup(<P052PercentGrid percent={percent} language="en"/>);
  assert.equal((html.match(/<rect /g)||[]).length,100);
  assert.equal((html.match(/data-p052-shaded="true"/g)||[]).length,percent);
  assert.ok(html.includes(`aria-label="${percent}% shaded: ${percent} of 100 squares."`));
 }
});
test('both languages use actual semantic range controls and source question text',()=>{
 for(const language of ['en','es'] as const){const html=render('practice-example',language);
  assert.ok(html.includes(`lang="${language}"`));assert.ok(html.includes(P052_COPY[language].question));
  assert.match(html,/type="range"/);assert.match(html,/min="0" max="100" step="1"/);
  assert.match(html,/value="35"/);assert.match(html,/035<span/);assert.match(html,/aria-describedby=/);
 }
});
test('wrong versus correct/revealed feedback stays distinct with explicit Close',()=>{
 assert.match(render('first-wrong'),/data-p052-source-text="321">Try Again\./);
 for(const scenario of ['first-correct','second-wrong-reveal'] as const){
  const html=render(scenario);assert.match(html,/data-p052-source-text="330">The figure is 75% shaded/);
  assert.match(html,/075<span/);assert.doesNotMatch(html,/type="range"/);
 }
});
test('nested glossary retains the help35percent example and source definition in both languages',()=>{
 for(const language of ['en','es'] as const){const html=render('glossary-column',language);
  assert.equal((html.match(/open=""/g)||[]).length,2);
  assert.ok(html.includes(P052_COPY[language].glossary.Column.definition));
  const example=html.split('data-p052-grid="example"')[1]!.split('</svg>')[0]!;
  assert.equal((example.match(/data-p052-shaded="true"/g)||[]).length,35);
 }
});
test('paused dialog offers a resume action; intro is not replaced by a generic exercise',()=>{
 assert.match(render('paused-help'),/>Resume<\/button>/);
 assert.match(render('paused-help','es'),/>Continuar<\/button>/);
 const intro=p052CaptureState({scenario:'intro',frame:1,seed:0,language:'en',frameDomain:'sprite-350'}).state;
 assert.throws(()=>renderToStaticMarkup(<P052PracticeView state={intro} language="en" onEvent={()=>{}}/>),/REQUIRES_EXERCISE_PHASE/);
});
