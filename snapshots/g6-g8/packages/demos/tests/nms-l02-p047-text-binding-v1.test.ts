import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P047_TEXT_BINDING} from '../src/nms-l02-p047-text-binding-v1';
import {validateLessonTextBinding} from '../src/lesson-text-snapshot';
test('every declared semantic role binds existing source text or shape identities',()=>{
 validateLessonTextBinding(P047_TEXT_BINDING);
 const catalog=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p047/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
 assert.equal(P047_TEXT_BINDING.sourceSwfSha256,catalog.sourceSha256);const texts=new Set(catalog.textDefinitions.map((t:{sourceTextId:string})=>t.sourceTextId)),shapes=new Set(catalog.shapeDefinitions.map((t:{characterId:number})=>t.characterId));
 for(const block of P047_TEXT_BINDING.blocks){for(const id of block.sourceTextIds){assert(texts.has(id));assert(!['character-52','character-77','character-79'].includes(id));}for(const id of block.sourceShapeIds??[])assert(shapes.has(id));}
 assert.deepEqual(P047_TEXT_BINDING.blocks.find(b=>b.id==='course-title')?.sourceShapeIds,[38]);
 assert.equal(P047_TEXT_BINDING.blocks.filter(b=>b.id.startsWith('help-fraction-')).length,3);
 assert.equal(new Set(P047_TEXT_BINDING.blocks.map(b=>b.readingOrder)).size,P047_TEXT_BINDING.blocks.length);
});
