import {test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import {algL07P051Frame,algL07P052Frame,P051_DOMAINS,P052_DOMAINS,P051_TEXT_BINDING,P052_TEXT_BINDING,L7_GAME_MOVIE}from'./alg-l07-game-frame-v1';import{P052_CARDS}from'./alg-l07-p052-cards-v1';
const source=(n:number)=>JSON.parse(fs.readFileSync(`migrations/shared-alg001-l07-p${String(n).padStart(3,'0')}/native-v1/source-model-v1.json`,'utf8'));
test('declared root/main/feedback counts remain source counts, separately from reachable playback',()=>{
 const p51=source(51),p52=source(52);assert.equal(L7_GAME_MOVIE.frameCount,10);
 for(const[m,domains]of[[p51,P051_DOMAINS],[p52,P052_DOMAINS]]as const)for(const d of domains)assert.equal(d.frameCount,m.timelines.find((t:any)=>t.timelineId===d.id).declaredFrameCount);
 for(const [frame,ready]of[[681,true],[682,true],[683,false]]as const){const v=algL07P051Frame(frame);assert.equal(v.frame,frame);assert.equal(v.ready,ready);assert.equal(v.sourceDeclaredFrameCount,683);assert.equal(v.textSnapshot.status,'ready');}
 assert.equal(algL07P052Frame(1).ready,false);assert.equal(algL07P052Frame(6).ready,false);assert.equal(algL07P052Frame(4).state.level,2);assert.equal(algL07P052Frame(5).state.phase,'complete');
 assert.throws(()=>algL07P051Frame(684));assert.throws(()=>algL07P052Frame(7));
 for(const n of[1,5,7,10])assert.equal(algL07P051Frame(n,{frame:n,frameDomain:'root',scenario:'source-directions',lang:'en',seed:0}).ready,false);
});
test('each native content binding belongs to this source SWF; all admitted inspection frames produce complete identity',()=>{
 for(const [n,binding,domains,frameFn]of[[51,P051_TEXT_BINDING,P051_DOMAINS,algL07P051Frame],[52,P052_TEXT_BINDING,P052_DOMAINS,algL07P052Frame]]as const){const m=source(n),ids=new Set(m.texts.map((t:any)=>t.sourceTextId));assert.equal(binding.sourceSwfSha256,m.source.sha256);for(const b of binding.blocks)for(const id of b.sourceTextIds)assert.ok(ids.has(id),id);
 for(const d of domains)for(let f=1;f<=d.frameCount;f++){const scenario=d.id==='sprite-157'?'wrong-feedback':d.id==='sprite-170'?'right-feedback':n===51?'source-directions':'source-game',ctx={frame:f,frameDomain:d.id,scenario,lang:'en' as const,seed:0,replay:2};const v=frameFn(f,ctx);assert.equal(v.textSnapshot.status,'ready');assert.equal(v.textSnapshot.identity.frame,f);assert.equal(v.state.replay,2);assert.equal(v.state.lessonCompleted,false);}}
});
test('each revealed image piece remains nearest to its source card; crossed Img suffixes are preserved',()=>{
 const m=source(52);const ts=m.timelines.find((t:any)=>t.timelineId==='sprite-303');
 for(const level of P052_CARDS.levels){const row=ts.frames[level.frame-1];for(const card of level.cards){const placement=row.find((p:any)=>p.name?.text===card.name),pieces=row.filter((p:any)=>typeof p.name?.text==='string'&&p.name.text.startsWith(`Mc${card.pair}_Img`));assert.equal(pieces.length,2);const distance=(p:any)=>(p.matrix[4]-placement.matrix[4])**2+(p.matrix[5]-placement.matrix[5])**2;pieces.sort((a:any,b:any)=>distance(a)-distance(b));assert.equal(card.rewardInstance,pieces[0].name.text);assert.ok(distance(pieces[0])<5000);}}
 const l1=P052_CARDS.levels[0];assert.equal(l1.cards.find(c=>c.name==='Mc1_1')!.rewardInstance,'Mc1_Img2');assert.equal(l1.cards.find(c=>c.name==='Mc6_1')!.rewardInstance,'Mc6_Img2');
});
