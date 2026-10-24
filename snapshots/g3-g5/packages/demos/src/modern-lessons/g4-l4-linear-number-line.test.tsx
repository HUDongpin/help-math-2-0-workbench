import assert from 'node:assert/strict';import {test}from'node:test';
import {G4_L4_LINEAR_NUMBER_LINE_CONFIGS as raw}from'./generated/g4-l4-linear-number-line-config';
import {getNumberLineTeachingState,numberLineValue,requestNumberLineContinuation,type NumberLineConfig}from'./g4-l4-number-line';
const configs=raw as readonly NumberLineConfig[],block=(c:NumberLineConfig,f:number,id:string)=>getNumberLineTeachingState(c,f).blocks.find(b=>b.id===id)!;
for(const [index,c]of configs.entries())test(`${c.animationId}: complete native equation, source-colored arc labels and no invented interaction`,()=>{
 assert.deepEqual(c.graph.axisValues,Array.from({length:17},(_,i)=>i));assert.equal(c.holdFrame,null);assert.deepEqual(c.terms,[]);assert.equal(requestNumberLineContinuation(c,{frame:358}as any),false);
 assert.equal(c.equation.map(id=>block(c,358,id).text).join(' '),index===0?'7 + 4 = 11':'12 – 9 = 3');assert(!c.blocks.some(b=>b.id==='definition'));assert.equal(block(c,358,'arc-26').text,index===0?'7':'12');assert.equal(block(c,358,'arc-30').text,index===0?'4':'9');assert.equal(numberLineValue(block(c,358,'arc-26').tokens[0].color!,358,''),'rgba(255,0,0,1)');assert.equal(numberLineValue(block(c,358,'arc-30').tokens[0].color!,358,''),'rgba(0,0,204,1)');assert(!c.graph.shapes.some(s=>s.character===27));
});
test('Source red operand emphasis ends independently of persistent addition/subtraction arcs',()=>{
 for(const [i,c]of configs.entries()){const first=i===0?197:143,last=i===0?248:160,t=block(c,first,'equation-expression').tokens[2];assert.equal(numberLineValue(t.stroke!,first-1,null),null);assert.equal(numberLineValue(t.stroke!,first,null),'1.5px rgb(255,0,0)');assert.equal(numberLineValue(t.stroke!,last,null),'1.5px rgb(255,0,0)');assert.equal(numberLineValue(t.stroke!,last+1,null),null);assert.equal(block(c,358,'arc-30').visible,true);}
});
test('Subtraction flashes alias one native equation while the result tick remains a distinct number',()=>{
 const c=configs[1];for(const f of [254,256,258,260,262,264])for(const token of block(c,f,'equation-expression').tokens){assert.equal(numberLineValue(token.color!,f,''),'rgb(255,0,255)');assert.equal(numberLineValue(token.color!,f+1,''),'black');}
 const tick=block(c,231,'tick-3').tokens[0];assert.equal(numberLineValue(tick.color!,231,''),'rgb(255,0,255)');assert.equal(numberLineValue(tick.color!,232,''),'black');assert.equal(c.blocks.filter(b=>b.id==='tick-3').length,1);
});
for(const c of configs)test(`${c.animationId}: real loader exposes linear playback and explicit original Spanish Audio`,async()=>{
 const {loadAnimationModuleForPresentation}=await import('../animation-registry');const m=await loadAnimationModuleForPresentation(c.animationId,{modernText:true});assert(m?.textPresentation);assert.equal(m.textPresentation.frameControl,undefined);assert.equal(m.textPresentation.keyTerms,undefined);assert.deepEqual(m.textPresentation.playbackEndFrameByDomain,{[c.frameDomain]:358});assert.deepEqual(m.textPresentation.sourceTimelineAudioCues,c.sourceAudio);assert.equal(m.audioTracks?.length,1);const t=m.audioTracks![0];assert.equal(t.activation,'user');assert.deepEqual(t.visibleWhen,['es']);assert.deepEqual(t.frameDomains,[c.frameDomain]);assert.equal(t.timelineBehavior,'pause-while-playing');
});

test('Every linear source audio cue resolves through the actual generated playback PCM index',async()=>{const {LESSON_MANUAL_NARRATION_PCM}=await import('../generated/lesson-manual-narration-pcm');for(const c of configs)for(const cue of c.sourceAudio){const asset=LESSON_MANUAL_NARRATION_PCM[cue.sha256];assert(asset,'Missing runtime PCM index for '+c.animationId);assert.equal(asset.sampleRate,22050);assert.equal(asset.channels,1);assert(asset.frames>600000);assert.equal(asset.source,'/lesson-typography-v1/audio/manual-pcm/'+cue.sha256+'.f32le');}});
