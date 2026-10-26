import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';import{ALG_L08_P022_SOURCE as S,p022Visual}from'./alg-l08-p022-state-v1';import{algL08P022Frame,P022_DOMAINS,P022_TEXT_BINDING}from'./alg-l08-p022-frame-v1';
const source=JSON.parse(fs.readFileSync(new URL('../../../migrations/shared-alg001-l08-p022/native-v1/source-model-v1.json',import.meta.url),'utf8')),main=source.timelines.find((t:{timelineId:string})=>t.timelineId==='sprite-47');
test('DefineText matrices and continuing glyph pens survive offset-free color changes across all546 frames',()=>{
 for(let frame=1;frame<=546;frame++)for(const text of p022Visual(frame).texts){
  const definition=source.texts.find((d:{characterId:number})=>d.characterId===text.sourceCharacterId);assert.deepEqual(text.textMatrix,definition.matrix);let x=0,y=0;
  definition.runs.forEach((r:{changed:{xOffset:boolean;yOffset:boolean};xOffsetTwips:number;yOffsetTwips:number;glyphs:{unicode:string;advanceTwips:number}[]},i:number)=>{
   if(r.changed.xOffset)x=r.xOffsetTwips;if(r.changed.yOffset)y=r.yOffsetTwips;
   assert.equal(text.runs[i].x,x);assert.equal(text.runs[i].y,y);
   r.glyphs.forEach((g,j)=>{assert.equal(text.runs[i].glyphs[j].x,x);assert.equal(text.runs[i].glyphs[j].text,g.unicode);x+=g.advanceTwips;});
  });
 }
 const t=p022Visual(546).texts.find(t=>t.sourceCharacterId===13)!;assert.equal(t.textMatrix[4],-6321);assert.equal(t.runs[0].x,60);for(let i=1;i<t.runs.length;i++)assert.equal(t.runs[i].x,t.runs[i-1].x+t.runs[i-1].advanceTwips);
});
test('all546 authored masks clip only their original depth intervals at exact rectangle coordinates',()=>{
 for(let frame=1;frame<=546;frame++){
  const visual=p022Visual(frame),raw=main.frames[frame-1],expected=raw.filter((p:{clipDepth?:number})=>p.clipDepth);
  assert.equal(visual.masks.length,expected.length);
  visual.masks.forEach((m,i)=>{const p=expected[i],[a,b,c,d,x,y]=p.matrix;assert.equal(p.characterId,2);assert.equal(b,0);assert.equal(c,0);assert.equal(m.instanceId,p.instanceId);assert.equal(m.depth,p.depth);assert.equal(m.clipDepth,p.clipDepth);assert.deepEqual(m.matrix,p.matrix);assert.deepEqual(m.bounds,[x-2412*a,x+2411*a,y-250*d,y+250*d]);});
  for(const node of [...visual.texts,...visual.vectors])assert.deepEqual(node.clipDepths,expected.filter((m:{depth:number;clipDepth:number})=>m.depth<node.depth&&node.depth<=m.clipDepth).map((m:{depth:number})=>m.depth));
 }
 assert.equal(p022Visual(546).masks.length,7);
});
test('equation steps, fractions, conclusion and overlay preserve authored source entry frames',()=>{
 for(const[id,first]of[[4,10],[5,46],[7,52],[8,58],[10,64],[13,76],[19,169],[20,189],[21,198],[22,205],[24,230],[27,276],[31,276],[33,284],[35,291],[37,401],[41,459],[45,519]]){assert(!p022Visual(first-1).texts.some(t=>t.sourceCharacterId===id));assert(p022Visual(first).texts.some(t=>t.sourceCharacterId===id));}
 assert.equal(p022Visual(546).texts.length,37);
 assert(p022Visual(546).texts.some(t=>t.text==='3y + 2x – 2x = 5 – 2x'));
 assert(p022Visual(546).texts.some(t=>t.text==='3y = –2x + 5'));
 assert(p022Visual(546).texts.some(t=>t.text==='Slope-intercept form: y = mx + b'));
});
test('native glossary waits for complete authored hit-area reveal; main audio keeps3 source runs',()=>{
 for(const[term,first]of Object.entries(S.termVisibility)){assert(!p022Visual(first-1).terms.includes(term as typeof S.terms[number]['sourceKeyAttribute']));assert(p022Visual(first).terms.includes(term as typeof S.terms[number]['sourceKeyAttribute']));}
 assert.deepEqual(S.termVisibility,{Equation:130,Term:142,Opposite:154,'Side of an equation':169,Coefficient:256,'Linear equation':421,Slope:408,'Slope-intercept form':480});
 assert.deepEqual(S.clockPlan.segments.map(s=>s.firstFrame),[1,3,207]);assert.equal(S.clockPlan.decoder.decodedSamples,988416);assert.equal(S.sa.decodedSamples,1292544);
 for(const f of[0,547,NaN])assert.throws(()=>algL08P022Frame(f));assert.throws(()=>algL08P022Frame(1,{frame:1,frameDomain:'sprite-70',scenario:'source-slope',lang:'en',seed:0}));
});
test('all1112 domain/language queries retain root6 entry, deterministic identity and complete text snapshot',()=>{let count=0;for(const d of P022_DOMAINS)for(const lang of['en','es']as const)for(let frame=1;frame<=d.frameCount;frame++){const v=algL08P022Frame(frame,{frame,frameDomain:d.id,scenario:'source-slope',lang,seed:0});assert.equal(v.frame,frame);assert.equal(v.language,lang);assert.equal(v.ready,d.id!=='root'||frame>=6);for(const id of v.sourceTextIds)assert(S.sourceTexts.some(t=>t.sourceTextId===id));assert.deepEqual(Object.keys(v.values),P022_TEXT_BINDING.blocks.map(b=>b.id));assert.deepEqual(v,algL08P022Frame(frame,{frame,frameDomain:d.id,scenario:'source-slope',lang,seed:0}));count++;}assert.equal(count,1112);});
test('every native text run and all546 display states preserve original depth, matrix, alpha and glyph advances',()=>{const ids=new Set(S.sourceTexts.map(t=>t.characterId));for(let f=1;f<=546;f++){const raw=main.frames[f-1].filter((p:{characterId:number})=>ids.has(p.characterId)),v=p022Visual(f);assert.equal(v.texts.length,raw.length);v.texts.forEach((t,i)=>{const p=raw[i],definition=source.texts.find((d:{characterId:number})=>d.characterId===p.characterId);assert.equal(t.instanceId,p.instanceId);assert.equal(t.depth,p.depth);assert.deepEqual(t.matrix,p.matrix);assert.equal(t.alpha,p.colorTransform?p.colorTransform.multiply[3]/256:1);assert.equal(t.text,definition.text);assert.deepEqual(t.runs.map(r=>r.colorRgba),definition.runs.map((r:{colorRgba:number[]})=>r.colorRgba));t.runs.forEach((r,j)=>assert.equal(r.advanceTwips,definition.runs[j].glyphs.reduce((n:number,g:{advanceTwips:number})=>n+g.advanceTwips,0)));});}});
test('10 static vectors retain every authored ratio and layer, including zero alpha',()=>{const ids=new Set([...S.diagram.shapes,...S.diagram.morphs].map(s=>s.sourceShapeId));assert.equal(S.diagram.shapes.length,10);assert.equal(S.diagram.morphs.length,0);for(let f=1;f<=546;f++){const raw=main.frames[f-1].filter((p:{characterId:number})=>ids.has(p.characterId)),v=p022Visual(f);assert.equal(v.vectors.length,raw.length);v.vectors.forEach((t,i)=>{const p=raw[i];assert.equal(t.instanceId,p.instanceId);assert.equal(t.depth,p.depth);assert.deepEqual(t.matrix,p.matrix);assert.equal(t.alpha,p.colorTransform?p.colorTransform.multiply[3]/256:1);assert.equal(t.ratio,S.diagram.morphs.some(m=>m.sourceShapeId===p.characterId)?p.ratio??0:null);});}});
