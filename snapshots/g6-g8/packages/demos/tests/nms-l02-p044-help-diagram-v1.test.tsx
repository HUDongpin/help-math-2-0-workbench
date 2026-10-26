import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P044HelpDiagram} from '../src/nms-l02-p044-help-diagram-v1';
test('source help circle keeps six sectors and four selected in both locales',()=>{
  for(const language of ['en','es']as const){const html=renderToStaticMarkup(<P044HelpDiagram language={language}/>);
    assert.equal((html.match(/<path /g)??[]).length,6);assert.equal((html.match(/data-selected="true"/g)??[]).length,4);
    assert.ok(html.includes('4/6'));assert.ok(html.includes('role="img"'));assert.ok(html.includes(language==='es'?'círculo':'circle'));
  }
});
