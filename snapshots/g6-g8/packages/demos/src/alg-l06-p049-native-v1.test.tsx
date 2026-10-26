import React from 'react';import test from 'node:test';import assert from 'node:assert/strict';import {renderToStaticMarkup} from 'react-dom/server';
import {P049NativeV1} from './alg-l06-p049-native-v1';import {initialP049State,type P049State} from './alg-l06-p049-state-v1';
import model from '../../../migrations/shared-alg001-l06-p049/native-v1/source-model-v2.json';
const render=(frame:number,extra:Partial<P049State>={},reducedMotion=false)=>renderToStaticMarkup(<P049NativeV1 state={{...initialP049State(),mainFrame:frame,...extra}} reducedMotion={reducedMotion} onEvent={()=>{}}/>);
test('P049 exposes real table rows and answer B association, excluding unrelated library charts',()=>{
 const html=render(159,{phase:'quiz-held',quizButtonsEnabled:true,nmhButtonEnabled:true});
 for(const v of ['Miles','Yards','8,800','17,600','26,400','Y = M ÷ 1,760','Y = 1,760 ∙ M','Y = M ÷ 36','Y = 36 ∙ M'])assert(html.includes(v),v);
 assert(html.includes('data-source-choice="B" data-source-instance="AnsBtn2" data-source-text-id="163" data-source-button-id="170"'));
 assert(!html.includes('Hurricane'));assert.equal((html.match(/<th /g)??[]).length,2);assert.equal((html.match(/<td /g)??[]).length,6);
});
test('P049 preserves alpha-positive option/reveal boundaries and paired 8,800 emphasis',()=>{
 assert(!render(149).includes('data-source-choice="A"'));assert(render(150).includes('data-source-choice="A"'));
 assert.equal((render(199).match(/data-source-choice=/g)??[]).length,1);assert(render(199).includes('data-source-choice="B"'));
 assert(!render(275).includes('Y = 1,760 ∙ 5'));assert(render(276).includes('Y = 1,760 ∙ 5'));
 assert(!render(330).includes('data-source-text-id="325"'));assert(render(331).includes('data-source-text-id="325"'));
 assert.equal((render(374).match(/data-p049-source-value-emphasis="true"/g)??[]).length,2);
 assert.equal((render(375).match(/data-p049-source-value-emphasis="true"/g)??[]).length,0);
 assert.equal((render(375,{},true).match(/data-p049-source-value-emphasis="true"/g)??[]).length,2);
 assert.equal((render(383,{},true).match(/data-p049-source-value-emphasis="true"/g)??[]).length,0);
});
test('P049 right4 native message is supported by source text186',()=>{assert.equal(model.texts['186'].text,'Great Job!');assert(render(159,{phase:'right-feedback-playing'}).includes('Great Job!'));});
