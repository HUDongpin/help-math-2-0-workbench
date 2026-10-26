import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {P052_COPY,P052_COPY_SOURCE_IDS,p052Copy,p052ShadeSummary,p052ExerciseSemantics,type P052Language} from '../src/nms-l02-p052-copy-v1';
import {createP052State,reduceP052} from '../src/nms-l02-p052-state-v1';
const catalog=JSON.parse(fs.readFileSync(new URL('../../../migrations/shared-nms002-l02-p052/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
const source=(id:number)=>{const t=catalog.textDefinitions.find((t:{characterId:number})=>t.characterId===id);assert.ok(t);return t.runs?.map((r:{text:string})=>r.text).join('')??t.initialText?.text;};
test('source identity and exact unadapted English text remain tied to source character IDs',()=>{
 assert.equal(catalog.sourceSha256,'5efa48905e74c0dd604b9e896bee1a1b4cfb1fe0839044686527fe96e1311638');
 for(const key of ['title','done','reset','help','close','retry','answer'] as const)for(const id of P052_COPY_SOURCE_IDS[key])assert.equal(P052_COPY.en[key],source(id));
 assert.equal(source(158),'10');assert.equal(source(339).replace(/\s+/g,' '),P052_COPY.en.example);
 assert.match(source(157),/75%/);assert.match(source(159),/Done button/);assert.match(source(340),/71, 72, 73, 74, 75/);
});
test('both languages preserve target75, denominator100 and distinct35percent help example',()=>{
 for(const language of ['en','es'] as const){const c=p052Copy(language);
  assert.match(c.prompt,/75%/);assert.match(c.answer,/75/);assert.match(c.answer,/100/);assert.match(c.example,/35%/);
  assert.match(c.helpExplanation,/10, 20, 30, 40, 50, 60, 70/);assert.match(c.helpExplanation,/71, 72, 73, 74, 75/);
  assert.deepEqual(Object.keys(c).sort(),Object.keys(P052_COPY.en).sort());assert.ok(c.glossary.Square.definition&&c.glossary.Column.definition);
 }
 assert.match(P052_COPY.en.rowColumnNote,/rows/);assert.match(P052_COPY.es.rowColumnNote,/filas/);
});
test('all202 language/value projections have exactly100 row-major cells and correct counts',()=>{
 const ready=reduceP052(createP052State(),{epoch:0,type:'intro-ready'});
 for(const language of ['en','es'] as const)for(let percent=0;percent<=100;percent++){
  const s=reduceP052(ready,{epoch:0,type:'value',percent}),v=p052ExerciseSemantics(s,language);
  assert.equal(v.cells.length,100);assert.equal(v.cells.filter(c=>c.shaded).length,percent);assert.equal(v.digits,String(percent).padStart(3,'0'));
  for(const c of v.cells){assert.equal(c.row*10+c.column,c.index);assert.equal(c.shaded,c.index<percent);}
  assert.equal(v.controlsDisabled,false);assert.match(v.summary,new RegExp(`${percent}%`));
 }
});
test('both languages project nested glossary and correct/revealed feedback without false first-try praise',()=>{
 for(const language of ['en','es'] as const){
  let s=reduceP052(createP052State(),{epoch:0,type:'intro-ready'});
  s=reduceP052(s,{epoch:0,type:'open-help'});s=reduceP052(s,{epoch:0,type:'open-glossary',term:'Square'});
  const v=p052ExerciseSemantics(s,language);assert.equal(v.controlsDisabled,true);assert.equal(v.glossary?.title,P052_COPY[language].glossary.Square.title);
  s=reduceP052(s,{epoch:0,type:'close-glossary'});s=reduceP052(s,{epoch:0,type:'close-help'});
  s=reduceP052(s,{epoch:0,type:'submit'});assert.equal(p052ExerciseSemantics(s,language).feedback,P052_COPY[language].retry);
  s=reduceP052(s,{epoch:0,type:'close-feedback'});s=reduceP052(s,{epoch:0,type:'submit'});
  assert.equal(s.outcome,'revealed');assert.equal(p052ExerciseSemantics(s,language).feedback,P052_COPY[language].answer);
 }
});
test('unsupported language and invalid percentage never fall back silently',()=>{
 assert.throws(()=>p052Copy('fr' as P052Language));for(const v of [-1,101,0.1,NaN,Infinity])assert.throws(()=>p052ShadeSummary(v,'en'));
});
test('both glossary definitions are exact source-derived bilingual entries, not authored paraphrases',()=>{
 const audit=JSON.parse(fs.readFileSync(new URL('../../../migrations/shared-nms002-l02-p052/audit/source-glossary-v1.json',import.meta.url),'utf8'));
 assert.equal(audit.entries.length,2);
 for(const e of audit.entries){const key=e.sourceKeyAttribute as 'Square'|'Column';for(const lang of ['en','es'] as const){
  assert.equal(P052_COPY[lang].glossary[key].title,e.labels[lang]);assert.equal(P052_COPY[lang].glossary[key].definition,e.definitions[lang]);
 }}
 assert.match(P052_COPY.en.glossary.Square.definition,/parallelogram/);
 assert.match(P052_COPY.es.glossary.Square.definition,/paralelogramo/);
});
