import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P060_DISPLAY_META,p060SourceObjects,p060SourceSnapshot} from '../src/generated/nms-l02-p060-display-list-v1';
import {NmsL02P060ProductRendererV1,P060HintContent,type P060VisualProps} from '../src/nms-l02-p060-product-renderer-v1';

const html=(mainFrame:number,options:Partial<P060VisualProps>={})=>
 renderToStaticMarkup(<NmsL02P060ProductRendererV1 mainFrame={mainFrame} uiLanguage="en" {...options}/>);

test('P060 generated snapshots retain early alpha and three letter-pulse windows',()=>{
 assert.equal(P060_DISPLAY_META.sourceSwfSha256,'80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1');
 assert.equal(p060SourceObjects('391',1,17)[0]?.color[3],0);
 assert(p060SourceObjects('391',14,46).some(item=>item.color[3]>0));
 assert(p060SourceObjects('391',28,60).some(item=>item.color[3]>0));
 assert(p060SourceObjects('391',40,53).some(item=>item.color[3]>0));
 assert.equal(p060SourceObjects('391',262,64).length,0);
 assert.equal(p060SourceObjects('391',263,64).length,1);
 assert(p060SourceSnapshot('139',15).some(item=>item.characterId===138));
 assert(p060SourceSnapshot('190',103).some(item=>item.characterId===189));
});

test('main teaching stops preserve distinct question, rephrase, given and picture/calculator stages',()=>{
 const opening=html(14),first=html(262),rephrase=html(400),given=html(527),picture=html(528),calculator=html(647);
 assert.match(opening,/data-source-letter-pulses="true"/);
 assert.match(first,/data-source-stop-frame="262"/);
 assert.match(first,/data-source-interactive="false"/);
 assert.doesNotMatch(first,/data-source-hit-object-id="193"/);
 assert.match(rephrase,/Which decimal is equal to one-fifth\?/);
 assert.match(given,/Information given:/);
 assert.match(given,/equivalent decimal fraction/);
 assert.doesNotMatch(given,/data-p060-panel="picture"/);
 assert.match(picture,/data-p060-panel="picture"/);
 assert.match(picture,/data-source-grid-shaded="20"/);
 assert.match(picture,/20 out of 100 shaded/);
 assert.match(picture,/0\.20 = 0\.2/);
 assert.match(calculator,/data-p060-panel="calculator"/);
 assert.match(calculator,/Press the divide symbol/);
 assert.match(calculator,/MRC/);
 for(const sourceRightAngle of ['This angle measures','The angle looks like'])assert.doesNotMatch(calculator,new RegExp(sourceRightAngle));
});

test('nested picture/calculator timelines render at their source main stops',()=>{
 assert.match(html(527,{box:{kind:'picture',localFrame:15}}),/data-source-box-local-frame="15"/);
 const before=html(646,{box:{kind:'calculator',localFrame:35}});
 const one=html(646,{box:{kind:'calculator',localFrame:36}});
 const five=html(646,{box:{kind:'calculator',localFrame:74}});
 const answer=html(646,{box:{kind:'calculator',localFrame:90}});
 assert.match(before,/data-source-calculator-local-frame="35"/);
 assert.doesNotMatch(before,/<output[^>]*>1<\/output>/);
 assert.match(one,/<output[^>]*>1<\/output>/);
 assert.match(five,/<output[^>]*>5<\/output>/);
 assert.match(answer,/<output[^>]*>0\.2<\/output>/);
});

test('final quiz, hint popup, feedback and post-quiz terminal stay separate',()=>{
 const quiz=html(699),hint=html(699,{popupOpen:true}),wrong=html(699,{feedback:{spriteId:205,localFrame:11}}),terminal=html(718);
 const withNativeControls=html(699,{answerControls:<div data-native-answer-controls="true"><button type="button">A. 0.2</button></div>});
 assert.match(quiz,/data-source-interactive="true"/);
 assert.match(quiz,/data-source-answer="1" data-source-hit-object-id="193"/);
 assert.match(quiz,/data-source-answer="4" data-source-hit-object-id="192"/);
 assert.match(quiz,/Need More Help/);
 assert.match(withNativeControls,/data-native-answer-controls="true"/);
 assert.doesNotMatch(withNativeControls,/data-source-answer="4"/);
 assert.match(hint,/Fractions.*decimals.*equivalent.*represent.*value/);
 assert.match(hint,/0\.75/);
 assert.match(hint,/data-source-control-id="370"/);
 assert.match(renderToStaticMarkup(<P060HintContent/>),/data-source-popup-sprite="388"/);
 assert.match(wrong,/data-p060-feedback-sprite="205"/);
 assert.match(wrong,/Incorrect!/);
 assert.match(terminal,/data-source-terminal-frame="718"/);
 assert.doesNotMatch(terminal,/data-source-interactive="true"/);
});

test('Spanish chrome fallback is explicit and impossible box/popup states fail closed',()=>{
 assert.match(html(699,{uiLanguage:'es'}),/Texto original en inglés/);
 assert.match(html(400,{popupOpen:true}),/data-p060-status="invalid-source-state"/);
 assert.match(html(527,{box:{kind:'calculator',localFrame:90}}),/data-p060-status="invalid-source-state"/);
 assert.match(html(646,{box:{kind:'picture',localFrame:15}}),/data-p060-status="invalid-source-state"/);
 assert.match(html(719),/data-p060-status="invalid-source-state"/);
 assert.match(html(400,{answerControls:<span>early</span>}),/data-p060-status="invalid-source-state"/);
});
