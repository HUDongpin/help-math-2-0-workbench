import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {NmsL2P046Renderer} from '../src/nms-l02-p046-renderer-v1';
const render=(frame:number,scenario='source-inspection',lang:'en'|'es'='en',frameDomain='sprite-205')=>renderToStaticMarkup(<NmsL2P046Renderer frame={frame} scenario={scenario} lang={lang} seed={0} frameDomain={frameDomain}/>);
test('renderer exposes accurate capture identity and source introductory fractions',()=>{
 for(const lang of ['en','es'] as const){const html=render(512,'source-inspection',lang);assert(html.includes('data-flash-frame="512"'));assert(html.includes('data-flash-frame-domain="sprite-205"'));assert(html.includes('data-flash-root-frame="6"'));assert(html.includes('2/10'));assert(html.includes('value="1"'));assert(html.includes('value="5"'));assert.equal((html.match(/fill="#99cc33"/g)??[]).length,1);}
 assert(!render(5,'source-inspection','en','root').includes('p046-activity'));
});
test('inspection remains read-only and direct terminal seek does not finish practice',()=>{
 for(const lang of ['en','es'] as const){const html=render(706,'source-inspection',lang);assert(html.includes('data-post-stop-inspection="true"'));assert(html.includes('data-p046-practice-phase="ready"'));assert(html.includes('2/4'));assert(!html.includes('aria-pressed="true"'));for(const button of html.replace(/<dialog\b[\s\S]*?<\/dialog>/g,'').matchAll(/<button[^>]*>/g))assert(button[0].includes('disabled=""'));}
 assert(render(706,'three-questions-complete').includes('data-p046-practice-phase="complete"'));
 assert(render(2,'second-wrong-reveal','en','sprite-168').includes('value="8"'));
});
