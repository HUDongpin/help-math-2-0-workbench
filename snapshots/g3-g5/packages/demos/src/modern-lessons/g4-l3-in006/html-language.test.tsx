import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
import {In006ModernRenderer} from './index';
import type {AnimationRendererProps} from '../../contract';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
test('English teaching and quiz retain their HTML language inside either host locale',()=>{
 for(const uiLanguage of ['en','es'] as const)for(const frame of [1,90,512,907,1054]){
  const runtime:AnimationRendererProps={frame,frameDomain:'sprite-151',rootFrame:6,scenario:'source-static-frame',lang:'en',uiLanguage,seed:0,replay:0};
  const html=renderToStaticMarkup(<In006ModernRenderer {...runtime}/>);
  const dom=new JSDOM(`<html lang="${uiLanguage}"><body><main lang="${uiLanguage}">${html}</main></body></html>`);
  const document=dom.window.document as Document;
  const content=document.querySelector('[data-modern-text-page="course-g04-l03-in-006"]')!;assert(content);
  const texts=content.querySelectorAll('p,.in006-teaching__axis-label,.in006-quiz__summary,button');assert(texts.length>0);
  for(const element of texts)assert.equal(element.closest('[lang]')?.getAttribute('lang'),'en',`${uiLanguage} host, frame${frame}: ${element.textContent}`);
  assert.equal(document.documentElement.lang,uiLanguage);assert.equal(document.querySelector('main')?.lang,uiLanguage);
  dom.window.close();
 }
});
