import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P047PracticeView} from '../src/nms-l02-p047-practice-view-v1';
import {P047_COPY} from '../src/nms-l02-p047-copy-v1';
import {P047_SOURCE_TEXT} from '../src/generated/nms-l02-p047-text-v1';
import {p047Initial,p047FinishPhase,p047Select,p047Drop,p047Help,type P047Practice} from '../src/nms-l02-p047-practice-v1';
const render=(state:P047Practice,language:'en'|'es'='en')=>renderToStaticMarkup(React.createElement(P047PracticeView,{state,language,onSelect(){},onDrop(){},onCancel(){},onHelp(){}}));
test('English teaching copy binds source glyph runs; help exposes7/8 and accessible dialog title',()=>{
 for(const [field,id]of [['instruction','45'],['guidance','51'],['helpDefinition','9'],['helpExample','22']]as const)assert.equal(P047_COPY.en[field],P047_SOURCE_TEXT[id].runs.map(r=>r.text).join('').trim());
 const initial=p047Initial(),state=p047Help(p047FinishPhase(initial,initial.phaseToken),true),html=render(state);
 const arrows=readFileSync(new URL('../../../migrations/shared-nms002-l02-p047/audit/shape-export-v1/24.svg',import.meta.url),'utf8').match(/fill="#ff0000"/g)||[];assert.equal(arrows.length,7);assert.equal((html.match(/data-p047-help-step=/g)||[]).length,arrows.length);
 assert(html.includes('<dialog'));assert(html.includes('aria-labelledby='));assert.equal((html.match(/aria-label="7\/8"/g)||[]).length,3);assert(html.includes('data-p047-help-title'));
 assert(render(state,'es').includes('Más ayuda'));
});
test('feedback has no manual dismissal and placed fractions appear in line description',()=>{
 const initial=p047Initial();const state=p047Drop(p047Select(p047FinishPhase(initial,initial.phaseToken),1),4),html=render(state);
 assert(html.includes('Correct!!!'));assert(html.includes('Mark D: 1/2'));assert(html.includes('Mark F: 3/4'));assert(!html.includes('onCloseFeedback'));assert.equal(render(initial),'');
});
