import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {P045Instruction,p045InstructionParts} from '../src/nms-l02-p045-instruction-v1';
import {P045_COPY} from '../src/nms-l02-p045-copy-v1';
import {P045_GLOSSARY} from '../src/generated/nms-l02-p045-glossary-v1';
test('all six source targets resolve in both instruction languages without changing the text',()=>{
 const ids=P045_GLOSSARY.map(e=>e.id).sort();assert.equal(ids.length,6);
 for(const language of ['en','es']as const){const text=P045_COPY[language].instruction,parts=p045InstructionParts(text,language);assert.equal(parts.map(p=>p.text).join(''),text);assert.deepEqual(parts.filter(p=>p.id).map(p=>p.id).sort(),ids);for(const entry of P045_GLOSSARY)assert(entry.labels[language]&&entry.definitions[language]);}
 assert.throws(()=>p045InstructionParts('Missing source words','en'),/P045_GLOSSARY_WORD/);
});
test('word links expose native dialog semantics and can all be disabled under feedback',()=>{
 for(const language of ['en','es']as const){const html=renderToStaticMarkup(<P045Instruction text={P045_COPY[language].instruction} language={language} enabled={false}/>);assert.equal((html.match(/data-source-term=/g)??[]).length,6);assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,6);assert.equal((html.match(/disabled=""/g)??[]).length,6);}
});
