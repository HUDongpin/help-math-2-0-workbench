import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P046_TEXT_BINDING as binding} from '../src/nms-l02-p046-text-binding-v1';
test('text role bindings resolve to exact P046 source symbols and semantic input roles',()=>{
 const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p046/audit/source-text-catalog-v1.json',import.meta.url),'utf8'));
 assert.equal(binding.sourceSwfSha256,source.sourceSha256);
 const ids=new Set(source.textDefinitions.map((t:{characterId:number})=>`character-${t.characterId}`));
 assert.equal(new Set(binding.blocks.map(b=>b.id)).size,binding.blocks.length);
 for(const [i,b]of binding.blocks.entries()){assert.equal(b.readingOrder,i);assert(b.sourceTextIds.length);for(const id of b.sourceTextIds)assert(ids.has(id),b.id+':'+id);}
 const events=source.timelines.find((t:{timelineId:string})=>t.timelineId==='sprite-205').events;
 for(const [id,name]of [[136,'txtQDen'],[137,'txtQNum'],[140,'txtANum'],[141,'txtADen'],[163,'txtParts']]as const){const e=events.find((v:{characterId:number})=>v.characterId===id);assert.equal(e.frame,654);assert.equal(e.name.text,name);}
 const definition=binding.blocks.find(b=>b.id==='glossary-definition-quantity')!;assert.equal(definition.valueSource,'maintained-page-state');
});
