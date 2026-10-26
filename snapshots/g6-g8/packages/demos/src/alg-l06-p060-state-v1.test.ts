import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {p060Initial, p060Identity, p060Reduce, p060Results, p060Review, p060SourceState, type P060State} from './alg-l06-p060-state-v1';
import {p060Question, p060Questions, p060AudioAsset, type P060Choice} from './alg-l06-p060-source-v1';
import {P060_NATIVE_SOURCE} from './generated/alg-l06-p060-native-v1';
import {selectAlgL09FinalAssessmentQuestions} from './g678-alg-l09-game-assessment';
const correctKeys = [2,4,3,1,2,1,3,4,3,1,4,2,2,3,4,1,3,1,2,4,2,4,3,3];
const sourceRoot = new URL('../../../migrations/shared-alg001-l06-p060/', import.meta.url);
const model = JSON.parse(readFileSync(new URL('native-v1/source-model-v1.json', sourceRoot), 'utf8'));
const answer = (s: P060State, choice: P060Choice, elapsedMs = (s.responses.length + 1) * 1000) => p060Reduce(s, {type:'answer', identity:p060Identity(s), choice, elapsedMs});
function finish(correct: number, seed = 18) {
  let s = p060Initial(seed);
  for (let i = 0; i < 10; i++) {
    const q = p060Question(p060Identity(s).questionId!);
    s = answer(s, q.options.find(o => o.correct === (i < correct))!.letter as P060Choice);
  }
  return s;
}
test('all 24 source answer keys and 96 handlers independently bind selected values', () => {
  const raw = model.scripts.find((s: {relative:string}) => s.relative === 'scripts/DefineSprite_973/frame_1/DoAction.as').text;
  assert.deepEqual(JSON.parse(raw.match(/_global.arrayAnswer = (\[[^;]+\]);/)[1]), correctKeys.map((n,i) => `A${i+1}Opt${n}`));
  const seeds = new Map<number,number>();
  for (let seed = 0; seed < 10000 && seeds.size < 24; seed++) seeds.set(p060Initial(seed).selection[0], seed);
  assert.equal(seeds.size, 24);
  for (let id = 1; id <= 24; id++) for (const choice of ['A','B','C','D'] as const) {
    const q = p060Question(id), o = q.options.find(o => o.letter === choice)!, next = answer(p060Initial(seeds.get(id)!), choice);
    const source = model.questions[id-1].options.find((o:{letter:string}) => o.letter === choice);
    const script = readFileSync(source.handler.path, 'utf8');
    assert.equal(next.responses[0].correct, 'ABCD'.indexOf(choice) + 1 === correctKeys[id-1]);
    assert.equal(next.responses[0].correct, script.includes('_global.arrayCorrectAnswer.push(this._name);'));
    assert.equal(next.responses[0].sourceInstance, source.sourceInstance);
    assert.equal(o.correct, source.correct);
  }
});
test('existing deterministic selector covers exactly 10 distinct members with replay identity reset', () => {
  for (let seed = 0; seed < 256; seed++) {
    const s = p060Initial(seed); assert.deepEqual(s.selection, selectAlgL09FinalAssessmentQuestions(seed));
    assert.equal(s.selection.length,10); assert.equal(new Set(s.selection).size,10); assert(s.selection.every(n => n >= 1 && n <= 24));
    const old = p060Identity(s), next = answer(s,'A'), replay = p060Reduce(next,{type:'replay',identity:p060Identity(next)});
    assert.deepEqual(replay.selection,s.selection); assert.equal(replay.responses.length,0); assert.equal(replay.replay,1);
    assert.strictEqual(p060Reduce(replay,{type:'answer',identity:old,choice:'B',elapsedMs:1000}),replay);
  }
  for (const seed of [-1,NaN,Infinity,0.5,0x100000000]) assert.throws(() => p060Initial(seed));
});
test('answer consumes once, freezes elapsed at ten and rejects result answers', () => {
  const s = p060Initial(3), identity=p060Identity(s), one=answer(s,'B');
  assert.strictEqual(p060Reduce(one,{type:'answer',identity,choice:'C',elapsedMs:1000}),one);
  for (const elapsedMs of [-1,NaN,Infinity]) assert.strictEqual(answer(s,'A',elapsedMs),s);
  assert.strictEqual(answer(one,'A',999),one); assert.equal(s.responses.length,0);
  const done=finish(7); assert.equal(done.phase,'result'); assert.equal(done.finishedElapsedMs,10000); assert.strictEqual(answer(done,'A'),done);
  assert(Object.isFrozen(done) && Object.isFrozen(done.responses) && done.responses.every(Object.isFrozen));
});
test('all source grade boundaries and exact score totals', () => {
  const expected=['Unsatisfactory','Unsatisfactory','Unsatisfactory','Unsatisfactory','Partially Proficient','Partially Proficient','Partially Proficient','Proficient','Proficient','Advanced','Advanced'];
  for (let correct=0; correct<=10; correct++) assert.deepEqual(p060Results(finish(correct)),{correct,wrong:10-correct,total:10,elapsedMs:10000,grade:expected[correct]});
  assert.equal(p060Results(p060Initial()),null);
});
test('review follows random presentation order and later correct marker wins', () => {
  const done=finish(5); let s=p060Reduce(done,{type:'review',identity:p060Identity(done)});
  for (let i=0;i<10;i++) {
    const r=p060Review(s)!; assert.equal(r.question.id,done.selection[i]);assert.equal(r.response.sourceInstance,done.responses[i].sourceInstance);
    assert.equal(r.options.filter(o=>o.feedback==='Correct').length,1);assert.equal(r.options.filter(o=>o.selected).length,1);
    for (const o of r.options) {assert.equal(o.sourceInstance,`R${r.question.id}Opt${'ABCD'.indexOf(o.letter)+1}`);assert.equal(o.feedback,o.correct?'Correct':o.selected?'Incorrect':'');}
    assert.equal(p060SourceState(s).frame,r.question.id+44); s=p060Reduce(s,{type:'review-next',identity:p060Identity(s)});
  }
  assert.equal(s.phase,'result'); assert.deepEqual(p060Results(s),p060Results(done));
  s=p060Reduce(s,{type:'close',identity:p060Identity(s)}); assert.equal(s.phase,'closed');assert.equal(p060SourceState(s).finishVisible,true);
  assert.strictEqual(p060Reduce(s,{type:'review',identity:p060Identity(s)}),s);
});
test('question content preserves all four values, table cells, E axes and exact graph curves', () => {
  assert.equal(p060Questions.length,24);assert.equal(P060_NATIVE_SOURCE.geometryChecks.length,16);
  assert(P060_NATIVE_SOURCE.geometryChecks.every(g=>g.allCurvesIndependentlyCrosschecked));
  for (const q of p060Questions) {
    assert.equal(q.questionFrame,q.id+1);assert.equal(q.reviewFrame,q.id+44);
    assert.equal(q.sourcePrompt,model.texts[q.promptTextId].text);
    for(const o of q.options)assert.equal(o.value,model.texts[o.textId].text.trim());
    for(const row of q.table?.rows??[])for(const cell of row)assert.equal(cell.value,model.texts[cell.textId].text);
    for(const label of q.graph?.labels??[])assert.equal(label.text,model.texts[label.textId].text);
  }
  for(const id of [22,24])assert(p060Question(id).graph!.labels.some(l=>l.text==='E'));
  assert.deepEqual(p060Question(5).formula,{prefix:'t = ',numerator:'P',denominator:'10',suffix:'+ 25',sourceTextIds:[120,124,125],inline:true});
});
test('240 question/option/language roles have separate exact source bindings', () => {
  const inventory=JSON.parse(readFileSync(new URL('audio-v1/source-role-inventory-v1.json',sourceRoot),'utf8'));
  const ids=new Set<string>();
  for(let q=1;q<=24;q++)for(const lang of ['en','es']as const)for(const choice of [null,'A','B','C','D']as const){
    const a=p060AudioAsset(q,lang,choice),row=inventory.assets.find((a:{id:string})=>a.id===`${lang}-Q${q}${choice??''}`);
    assert.equal(a.binding.sourceSha256,row.source.sha256);assert.equal(a.binding.sourceBytes,row.source.bytes);assert.equal(a.owner,row.owner);ids.add(a.id);
  }
  assert.equal(ids.size,240);assert.throws(()=>p060AudioAsset(25,'en',null));
});
