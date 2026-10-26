import assert from'node:assert/strict';import test from'node:test';
import{p031Teaching,p031QuestionText,p031QuestionDecimalReadable}from'../src/nms-l02-p031-teaching-v1';
import{p031Initial,p031Advance,p031Answer,p031CloseFeedback}from'../src/nms-l02-p031-state-v1';
const at=(mainFrame:number)=>({mainFrame});
test('question mask reveals source glyphs only30..49 and never exposes a future full question',()=>{
 const text='What is the name of this decimal?';
 for(let f=1;f<30;f++)assert.equal(p031QuestionText(at(f)),'');
 assert(p031Teaching(at(30)).questionRuns.some(r=>r.fractions.some(v=>v>0&&v<1)));
 for(let f=30;f<49;f++){assert(text.startsWith(p031QuestionText(at(f))));assert.notEqual(p031QuestionText(at(f)),text);}
 assert.equal(p031QuestionText(at(49)),text);assert(p031QuestionDecimalReadable(at(49)));
 for(let f=1;f<=339;f++){const t=p031Teaching(at(f));assert(Object.isFrozen(t));for(const r of t.questionRuns){assert.equal(r.text.length,r.fractions.length);assert(r.fractions.every(v=>Number.isFinite(v)&&v>=0&&v<=1));}}
 assert.throws(()=>p031Teaching(at(0)));assert.throws(()=>p031Teaching(at(340)));
});
test('feedback freezes teaching main147 and returning from first error preserves the question',()=>{
 let s=p031Advance(p031Initial(0),146);const q=p031Teaching(s);assert.deepEqual(q.optionAlphas,[1,1,1,1]);s=p031Answer(s,0);s=p031Advance(s,100);assert.equal(p031Teaching(s),q);s=p031CloseFeedback(s);s=p031Advance(s,100);assert.equal(s.phase,'question');assert.equal(p031Teaching(s),q);
});
test('explanation numbers and late chart follow independent source timing',()=>{
 assert.equal(p031Teaching(at(209)).sevenDigitAlpha,0);assert(p031Teaching(at(210)).sevenDigitAlpha>0);assert.equal(p031Teaching(at(219)).sevenDigitAlpha,0);
 assert.equal(p031Teaching(at(306)).chartAlpha,0);assert(p031Teaching(at(307)).chartAlpha>0);assert.equal(p031Teaching(at(311)).chartAlpha,1);
 const last=p031Teaching(at(339));assert(last.chartTextPoses.some(p=>p.characterId===241));assert(last.chartTextPoses.some(p=>p.characterId===228));
});
