import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P046Instruction,p046InstructionParts} from '../src/nms-l02-p046-instruction-v1';
import {P046_COPY} from '../src/nms-l02-p046-copy-v1';
test('context-specific links preserve every character without overlapping fraction phrases',()=>{
 for(const lang of ['en','es']as const)for(const [text,context,expected]of [[P046_COPY[lang].instruction,'main',4],[P046_COPY[lang].helpText,'definition',3],[P046_COPY[lang].wrongFirst,'definition',3]]as const){
  const parts=p046InstructionParts(text,lang,context);assert.equal(parts.map(p=>p.text).join(''),text);assert.equal(parts.filter(p=>p.id).length,expected);assert.equal(new Set(parts.filter(p=>p.id).map(p=>p.id)).size,expected);
 }
 assert.throws(()=>p046InstructionParts('fraction only','en'),/GLOSSARY_WORD/);
});
test('native glossary triggers declare dialogs and support disabled inspection',()=>{
 const html=renderToStaticMarkup(<P046Instruction text={P046_COPY.en.instruction} language="en" enabled={false}/>);
 assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,4);assert.equal((html.match(/disabled=""/g)??[]).length,4);assert(html.includes('data-source-term="equivalent-fraction"'));assert(html.includes('<dialog'));
});
