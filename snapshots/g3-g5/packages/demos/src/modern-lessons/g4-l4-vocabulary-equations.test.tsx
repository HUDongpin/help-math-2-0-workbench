import assert from 'node:assert/strict';
import {test} from 'node:test';
import {G4_L4_VOCABULARY_CONFIGS} from './generated/g4-l4-vocabulary-config';
import {getVocabularyTeachingState,getVocabularyTextSnapshot,vocabularySourceValue,type VocabularyConfig} from './g4-l4-vocabulary-equations';
const configs=G4_L4_VOCABULARY_CONFIGS as readonly VocabularyConfig[];
const config=(suffix:string)=>configs.find(c=>c.animationId.endsWith(suffix))!;
const text=(c:VocabularyConfig,frame:number,id:string)=>getVocabularyTeachingState(c,frame).blocks.find(b=>b.id===id)!.text;
for(const c of configs)test(`${c.animationId} requires its own source identity, frame and host context`,async()=>{
 const module=await import('../modules/'+c.animationId);const getter=module['getCourseG04L04Vb'+c.animationId.slice(-3)+'FrameState'];
 const context={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:17,replay:2};const state=getter(context.frame,context);
 assert.equal(getVocabularyTextSnapshot(c,state,context).status,'ready');
 for(const other of configs.filter(other=>other!==c))assert.equal(getVocabularyTextSnapshot(other,state,context).status,'blocked');
 for(const delta of [{frame:0},{frame:1.5},{frame:c.frameCount+1},{lang:'es' as const},{seed:18},{rootFrame:5},{frameDomain:'root'},{scenario:'other'},{entryStateSha256:'0'.repeat(64)}])assert.equal(getVocabularyTextSnapshot(c,state,{...context,...delta}).status,'blocked');
});
test('Sum exposes each complete source number in its original operand order',()=>{
 const c=config('003');assert.equal(text(c,87,'equation'),'');assert.equal(text(c,88,'equation'),'8');assert.equal(text(c,96,'equation'),'8+7');assert.equal(text(c,108,'equation'),'8+7=');assert.equal(text(c,109,'equation'),'8+7=15');
 assert(c.layout.kind==='annotated');assert.deepEqual(c.layout.targets,[4]);assert.equal(vocabularySourceValue(c.layout.arrows[0].alpha,110),0);assert.equal(vocabularySourceValue(c.layout.arrows[0].alpha,114),1);
});
test('Addend points at two operands and preserves independent source arrow growth',()=>{
 const c=config('004');assert(c.layout.kind==='annotated');assert.deepEqual(c.layout.targets,[0,2]);
 assert.equal(vocabularySourceValue(c.layout.arrows[0].growth,154),0);assert(vocabularySourceValue(c.layout.arrows[0].growth,155)>0);assert.equal(vocabularySourceValue(c.layout.arrows[0].growth,159),1);
 assert.equal(vocabularySourceValue(c.layout.arrows[1].growth,159),0);assert(vocabularySourceValue(c.layout.arrows[1].growth,160)>0);assert.equal(vocabularySourceValue(c.layout.arrows[1].growth,164),1);
});
test('Difference preserves its source en dash, whole answer and gradual arrow alpha',()=>{
 const c=config('007');assert.equal(text(c,119,'equation'),'15 – 7 = ');assert.equal(text(c,120,'equation'),'15 – 7 = 8 ');assert(c.layout.kind==='annotated');assert.deepEqual(c.layout.targets,[4]);assert.equal(vocabularySourceValue(c.layout.arrows[0].alpha,121),0);assert.equal(vocabularySourceValue(c.layout.arrows[0].alpha,122),43/256);assert.equal(vocabularySourceValue(c.layout.arrows[0].alpha,127),1);
});
test('Estimate distinguishes repeated words and never fills the unanswered original results',()=>{
 const c=config('009');assert.equal(text(c,39,'definition'),'Estimate means to find out about ');assert.equal(text(c,55,'definition'),'Estimate means to find out about how much or ');assert.equal(text(c,56,'definition'),'Estimate means to find out about how much or about ');
 assert.equal(text(c,120,'estimate-1-original'),'198 + 307 = ');assert.equal(text(c,120,'estimate-1-rounded'),'200 + 300 = 500');assert.equal(text(c,120,'estimate-2-original'),'492 – 104 = ');assert.equal(text(c,120,'estimate-2-rounded'),'500 – 100 = 400');assert(c.layout.kind==='estimation');for(const e of c.layout.estimates)assert.deepEqual(e.targets,[0,2]);
});
for(const [id,equations]of [['002',[['8','+','7','15'],['73.0','+','15.4','88.4'],['123','+','456','579']]],['006',[['15','–','7','8'],['88.1','–','14.5','73.6'],['579','–','456','123']]]] as const)test(`${id} retains each corresponding vertical arithmetic row`,()=>{
 const c=config(id);assert(c.layout.kind==='parallel-operations');for(const [index,card]of c.layout.cards.entries())assert.deepEqual(card.vertical.map(id=>text(c,c.frameCount,id).trim()),equations[index]);
});
