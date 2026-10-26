import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P044IntroView} from '../src/nms-l02-p044-intro-view-v1';
test('both intro locales show authored demonstration counts and selected quarter',()=>{
  for(const language of ['en','es']as const)for(const [frame,parts,selected]of [[8,1,0],[72,2,0],[81,3,0],[86,5,0],[91,4,0],[132,4,1],[323,1,0]]){
    const html=renderToStaticMarkup(<P044IntroView frame={frame} language={language} interactive={false}/>);
    assert.ok(html.includes(`data-parts="${parts}"`));assert.ok(html.includes(`data-selected-count="${selected}"`));
    assert.ok(html.includes(frame<323?'1/4':'1/5'));
    for(const button of html.replace(/<dialog[\s\S]*?<\/dialog>/g,'').match(/<button[^>]*>/g)??[])assert.ok(button.includes('disabled=""'));
  }
});
test('pre-instruction frames stay blank and source check/new actions are emphasized',()=>{
  assert.equal(renderToStaticMarkup(<P044IntroView frame={4}/>),'');
  for(const frame of [292,323])assert.ok(renderToStaticMarkup(<P044IntroView frame={frame}/>).includes('data-emphasis="true"'));
});
