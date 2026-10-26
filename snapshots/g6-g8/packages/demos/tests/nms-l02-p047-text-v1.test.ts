import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P047_SOURCE_TEXT as text} from '../src/generated/nms-l02-p047-text-v1';
const audit=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p047/audit/source-text-intro-roles-v1.json',import.meta.url),'utf8'));
test('all source definitions have dispositions; native text excludes private and clip labels',()=>{
 assert.equal(audit.definitions.length,26);assert.equal(Object.keys(text).length,23);for(const id of ['52','77','79'])assert.equal(Object.hasOwn(text,id),false);
 assert.deepEqual(text['40'].runs.map(r=>r.text),['3','4']);assert.deepEqual(text['55'].runs.map(r=>r.text),['5','8']);assert.equal(text['47'].runs[0].text,'5');
});
test('intro retains source duplicate and its frame57 replacement, with exact highlight intervals',()=>{
 const count=(frame:number,id:number)=>audit.mainFrames[frame-1].layers.filter((l:{characterId:number})=>l.characterId===id).length;
 assert.equal(count(56,43),2);assert.equal(count(57,43),1);assert.equal(count(56,55),0);assert.equal(count(57,55),1);
 for(const [id,frames]of [[56,[59,61,63]],[57,[75,77,79]],[58,[83,85,87,89,91]]]as const)assert.deepEqual(audit.mainFrames.filter((f:{frame:number})=>count(f.frame,id)>0).map((f:{frame:number})=>f.frame),frames);
});
