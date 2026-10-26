import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { P062_DISPLAY_META, p062SourceObjects } from '../src/generated/nms-l02-p062-display-list-v1';
import { NmsL02P062ProductRendererV1, P062HintContent, type P062VisualProps } from '../src/nms-l02-p062-product-renderer-v1';
const html=(mainFrame:number,options:Partial<P062VisualProps>={})=>
 renderToStaticMarkup(<NmsL02P062ProductRendererV1 mainFrame={mainFrame} uiLanguage="en" {...options} />);

test('source placement reveals the corrected books problem at exact 10/100 frames',()=>{
 assert.equal(P062_DISPLAY_META.sourceSwfSha256,'5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50');
 assert.equal(p062SourceObjects('315',9,38).length,0);
 assert.equal(p062SourceObjects('315',10,38)[0]?.color[3],256);
 assert.equal(p062SourceObjects('315',99,41).length,0);
 assert.equal(p062SourceObjects('315',100,41)[0]?.color[3],256);
 assert.doesNotMatch(html(9),/Salvatore bought/);
 assert.match(html(10),/Salvatore bought 2 books/);
 assert.doesNotMatch(html(99),/price before tax\. What is the total cost/);
 const question=html(100);
 assert.match(question,/data-editorial-correction="tax-base"/);
 assert.match(question,/8% of the \$20\.00 price before tax/);
 assert.match(question,/Sales tax is calculated on the \$20\.00 before-tax price/);
 assert.doesNotMatch(question,/Teaching clarification/);
 assert.doesNotMatch(question,/8% of his total cost/);
 assert.doesNotMatch(question,/This angle measures|square corner|right angle/);
});

test('question, given information and two strategies enter in distinct source frames',()=>{
 assert.doesNotMatch(html(384),/data-p062-panel="rephrase"/);
 assert.match(html(385),/data-p062-panel="rephrase"/);
 assert.doesNotMatch(html(523),/data-p062-panel="given-needed"/);
 assert.match(html(524),/data-p062-panel="given-needed"/);
 assert.match(html(524),/data-p062-modern-diagram="source-derived-books-and-tax"/);
 assert.match(html(524),/Before-tax cost \+ sales tax = total cost/);
 assert.match(html(524),/total cost unknown/);
 assert.doesNotMatch(html(524),/\$21\.60|\$1\.60|twenty-one dollars|one dollar and sixty cents/);
 assert.doesNotMatch(html(650),/\$21\.60|\$1\.60/);
 assert.doesNotMatch(html(524),/not an extracted Flash shape/);
 assert.doesNotMatch(html(650),/data-p062-panel="equation-strategy"/);
 const equation=html(651);
 assert.match(equation,/data-p062-panel="equation-strategy"/);
 assert.match(equation,/Taxes = 8% × \$20\.00 = 0\.08 × \$20\.00 = \$1\.60/);
 assert.doesNotMatch(html(766),/data-p062-panel="backward-strategy"/);
 const backward=html(767);
 assert.match(backward,/data-p062-panel="backward-strategy"/);
 assert.match(backward,/Taxes = \$21\.60 − \$20\.00 = \$1\.60/);
});

test('independent source help domains and popup are bounded to their authored stops',()=>{
 const first=html(650,{box:{spriteId:106,localFrame:15}});
 assert.match(first,/data-source-box-sprite="106"/);
 assert.match(first,/data-source-box-local-frame="15"/);
 assert.match(first,/data-p062-panel="equation-strategy"/);
 const second=html(766,{box:{spriteId:122,localFrame:21}});
 assert.match(second,/data-source-box-sprite="122"/);
 assert.match(second,/data-p062-panel="backward-strategy"/);
 assert.match(html(650,{box:{spriteId:122,localFrame:1}}),/data-p062-status="invalid-source-state"/);
 assert.match(html(766,{box:{spriteId:106,localFrame:1}}),/data-p062-status="invalid-source-state"/);
 const popup=renderToStaticMarkup(<P062HintContent />);
 assert.match(popup,/data-source-popup-sprite="314"/);
 assert.match(popup,/data-editorial-correction="example-rate"/);
 assert.match(popup,/Taxes = 7\.5% of Original Cost/);
 assert.doesNotMatch(popup,/>Taxes = 8% of Original Cost</);
 assert.match(popup,/\$50 \+ \$3\.75 = \$53\.75/);
 assert.match(popup,/\$50\.00 \+ \$3\.75 = \$53\.75 at a 7\.5% tax rate/);
 assert.doesNotMatch(popup,/Teaching clarification/);
 assert.match(html(815,{popupOpen:true}),/role="dialog"/);
});

test('answer rows are source-ordered at 815, native slot replaces them and 816 removes controls',()=>{
 assert.doesNotMatch(html(814),/data-p062-panel="answers"/);
 const final=html(815);
 for(const [ordinal,value] of [[1,'$20.08'],[2,'$20.80'],[3,'$21.60'],[4,'$21.80']] as const){
  assert.match(final,new RegExp(`data-source-answer="${ordinal}"`));
  assert.match(final,new RegExp(value.replace('$','\\$').replace('.','\\.')));
 }
 assert.match(final,/data-source-answer="3" data-source-text-id="33 31" data-source-button-id="126"/);
 const slotted=html(815,{answerControls:<div data-native-answers="yes"><button type="button">C. $21.60</button></div>});
 assert.match(slotted,/data-native-answers="yes"/);
 assert.doesNotMatch(slotted,/data-source-answer="3"/);
 assert.doesNotMatch(html(816),/data-p062-panel="answers"/);
 assert.match(html(834),/data-source-terminal-frame="834"/);
});

test('feedback, Spanish fallback and impossible visual combinations stay bounded',()=>{
 assert.match(html(815,{feedback:{spriteId:138,localFrame:15}}),/Incorrect!/);
 assert.match(html(815,{feedback:{spriteId:288,localFrame:13}}),/Excellent!/);
 assert.match(html(815,{uiLanguage:'es'}),/Texto original en inglés/);
 assert.match(html(838),/data-p062-status="invalid-source-state"/);
 assert.match(html(815,{feedback:{spriteId:138,localFrame:1}}),/data-p062-status="invalid-source-state"/);
 assert.match(html(814,{popupOpen:true}),/data-p062-status="invalid-source-state"/);
 assert.match(html(650,{box:{spriteId:106,localFrame:15},popupOpen:true}),/data-p062-status="invalid-source-state"/);
 assert.match(html(816,{answerControls:<span>early</span>}),/data-p062-status="invalid-source-state"/);
});
