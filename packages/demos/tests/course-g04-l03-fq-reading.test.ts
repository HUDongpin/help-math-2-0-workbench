import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {G4_L3_FQ_AUDIO} from '../src/g4-l3-fq-audio.generated';
import {getFinalQuizReadingAsset} from '../src/timelines/course-g04-l03-fq-reading';
import {createCourseG04L03Fq002InteractionState} from '../src/timelines/course-g04-l03-fq-002-quiz-interaction';
import fq002 from '../src/modules/course-g04-l03-fq-002';
import fq003 from '../src/modules/course-g04-l03-fq-003';
const root=path.resolve(import.meta.dirname,'../../..');

test('all 25 question and choice recordings in both languages match admitted source bytes',async()=>{
 assert.equal(G4_L3_FQ_AUDIO.length,250);
 const ids=new Set<string>();
 for(const language of ['en','es'] as const)for(let q=1;q<=25;q++)for(const part of ['question','A','B','C','D'] as const){
  const asset=getFinalQuizReadingAsset(q,part,language);assert(asset);assert(!ids.has(asset.id));ids.add(asset.id);
  assert.equal(asset.language,language);assert.deepEqual(asset.visibleWhen,['en','es']);
  const suffix=part==='question'?'':part;const dir=language==='en'?'EA':'SA';
  const expected=`/flash-assets/courses/course-g04-l03-fq-audio/${dir}/Q${q}${suffix}.mp3`;
  assert.equal(asset.source,`${expected}?sha256=${asset.sha256}`);
  const source=await readFile(path.join(root,`source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/${dir}/Q${q}${suffix}.mp3`));
  const served=await readFile(path.join(root,'public',expected));
  assert.deepEqual(served,source);assert.equal(createHash('sha256').update(source).digest('hex'),asset.sha256);
 }
 for(const module of [fq002,fq003]){
  assert.equal(module.interactiveAudioAssets,G4_L3_FQ_AUDIO);
  assert.deepEqual(module.lessonHost.capabilities,['audio']);
  assert.equal(module.lessonHost.legacyOperations,'blocked');
 }
});

test('random quiz resolves audio by source identity, including review order, without changing scoring state',()=>{
 for(const seed of [0,1,42,2026]){
  const state=createCourseG04L03Fq002InteractionState(seed);const before=JSON.stringify(state);
  assert(state.currentQuestion);
  const asset=getFinalQuizReadingAsset(state.currentQuestion.id,'question','en');assert(asset);
  assert.equal(asset.questionId,state.questionOrder[0]);assert.equal(JSON.stringify(state),before);
 }
 for(const id of [-1,0,26,2.5,NaN,Infinity])assert.equal(getFinalQuizReadingAsset(id,'A','es'),null);
});
