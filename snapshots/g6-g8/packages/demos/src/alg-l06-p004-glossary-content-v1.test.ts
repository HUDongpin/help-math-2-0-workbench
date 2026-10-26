import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p004GlossaryContent,p004SelectedGlossaryContent} from './alg-l06-p004-glossary-content-v1';
import {p004VisibleGlossaryOccurrences,p004ActivateGlossaryOccurrence,p004CloseGlossary,p004ReplayGlossary} from './alg-l06-p004-glossary-state-v1';

test('all nine real button placements select the exact source bilingual definition',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../../migrations/shared-alg001-l06-p004/audit/source-glossary-v1.json',import.meta.url),'utf8'));
 for(const occurrence of p004VisibleGlossaryOccurrences(614)){
  const state=p004ActivateGlossaryOccurrence({frame:614,paused:false,selectedButton:null,keyAttribute:null},occurrence.occurrenceId);
  const expected=audit.entries.find((row:{sourceKeyAttribute:string})=>row.sourceKeyAttribute===occurrence.keyAttribute);
  assert(expected.occurrenceIds.includes(occurrence.occurrenceId));
  for(const lang of ['en','es'] as const){
   assert.deepEqual(p004SelectedGlossaryContent(state,lang),{key:occurrence.keyAttribute,
    canonicalDictionaryKey:expected.canonicalDictionaryKey,label:expected.labels[lang],definition:expected.definitions[lang]});
   assert.equal(p004SelectedGlossaryContent(p004CloseGlossary(state),lang),null);
   assert.equal(p004SelectedGlossaryContent(p004ReplayGlossary(),lang),null);
  }
 }
});
test('only explicitly bound casing is accepted and locale changes retain the selected source key',()=>{
 assert.equal(p004GlossaryContent('output','es').canonicalDictionaryKey,'Output');
 assert.equal(p004GlossaryContent('output','en').definition,p004GlossaryContent('Output','en').definition);
 for(const key of ['OUTPUT','input','function','Output ','unknown'])assert.throws(()=>p004GlossaryContent(key,'en'),/UNBOUND_GLOSSARY_KEY/);
 assert.throws(()=>p004GlossaryContent('Input','fr' as 'en'),/UNSUPPORTED_GLOSSARY_LOCALE/);
});
