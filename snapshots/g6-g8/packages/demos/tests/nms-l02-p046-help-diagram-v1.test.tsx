import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P046HelpDiagram} from '../src/nms-l02-p046-help-diagram-v1';
test('source two-circle geometry and gradients are labelled in both languages',()=>{
 for(const language of ['en','es']as const){const html=renderToStaticMarkup(<P046HelpDiagram language={language}/>);assert(html.includes('2/4 = 1/2'));assert(html.includes('role="img"'));assert(html.includes(language==='es'?'Dos círculos iguales':'Two equal circles'));assert(html.includes('Gradient'));assert(!html.includes('__P046_HELP__'));}
});
test('two help figures isolate gradient ids and references',()=>{
 const html=renderToStaticMarkup(<><P046HelpDiagram/><P046HelpDiagram/></>),ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]),refs=[...html.matchAll(/url\(#([^)]+)\)/g)].map(m=>m[1]);assert.equal(ids.length,6);assert.equal(new Set(ids).size,ids.length);assert(refs.every(id=>ids.includes(id)));
});
