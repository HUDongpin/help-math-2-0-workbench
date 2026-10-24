import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {hasLessonTextPresentation,loadLessonTextPresentation} from '../lesson-text-registry';
import {getColumnTeachingState,type ColumnArithmeticConfig} from './g4-l4-column-arithmetic';
import {G4_L4_PLACE_VALUE_CONFIGS} from './generated/g4-l4-place-value-config';
const C=G4_L4_PLACE_VALUE_CONFIGS as readonly ColumnArithmeticConfig[];
const root=process.env.COLUMN_CANDIDATE_ROOT??process.cwd();
const labels=(i:number,f:number)=>getColumnTeachingState(C[i],f).blocks.filter(b=>b.role==='label'&&b.visible&&b.state&&b.state.x>3800);
const result=(i:number,f:number)=>labels(i,f).filter(b=>b.state!.baseline>(i<2?1000:800)).sort((a,b)=>a.state!.x-b.state!.x).map(b=>b.text).join('');
test('registry loads four own-source base-ten pages and refuses mismatched snapshot identities',async()=>{
 for(const c of C){assert(hasLessonTextPresentation(c.animationId));const p=(await loadLessonTextPresentation(c.animationId))!;assert.equal(p.binding.placementId,c.placementId);const m=await import('../modules/'+c.animationId);const r={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:17,replay:0};const state=m.default.getFrameState(r.frame,r);assert.equal(p.getSnapshot(state,r).status,'ready');for(const delta of [{frame:0},{frame:r.frame-1},{seed:18},{rootFrame:5},{frameDomain:'root'},{lang:'es'},{entryStateSha256:'foreign'}])assert.equal(p.getSnapshot(state,{...r,...delta} as any).status,'blocked');assert.equal(p.getSnapshot({...state,sourceSwfSha256:'0'.repeat(64)},r).status,'blocked');const html=renderToStaticMarkup(React.createElement(p.Renderer,{...r,state}));assert.match(html,new RegExp('data-modern-text-page="'+c.animationId+'"'));assert.doesNotMatch(html,/<canvas|<foreignObject/);assert.equal(p.playbackEndFrameByDomain![c.frameDomain],c.frameCount);assert.equal(p.reducedMotionFrameByDomain![c.frameDomain],c.frameCount);}
});
test('523 + 298 keeps temporary 11, separate carry, and final 821',()=>{
 assert.equal(result(0,420),'');assert.equal(result(0,550),'11');assert.equal(result(0,650),'1');assert(labels(0,650).some(b=>b.text==='1'&&b.state!.baseline<-900&&b.state!.color==='rgba(255,0,255,1.0)'));assert.equal(result(0,1100),'21');assert.equal(result(0,1257),'821');assert.equal(labels(0,1257).filter(b=>b.text==='1'&&b.state!.baseline<-900).length,2);
});
test('337 - 128 preserves the borrowed 2 tens and 17 ones before 209',()=>{
 assert(!labels(1,280).some(b=>b.state!.baseline<-700));assert(labels(1,420).some(b=>b.text==='2'&&b.state!.baseline===-734));assert(labels(1,420).some(b=>b.text==='1'&&b.state!.baseline===-205));assert.equal(result(1,550),'9');assert.equal(result(1,650),'09');assert.equal(result(1,840),'209');assert(labels(1,840).some(b=>b.text==='−'));assert.deepEqual(C[1].figure.unitsPerEm,[280,360]);
});
test('decimal regrouping keeps separate decimal points, carries, and native glyph highlights',()=>{
 assert.equal(result(2,780),'3');assert.equal(result(2,1100),'23');assert.equal(result(2,1429),'3.23');assert.equal(labels(2,1429).filter(b=>b.text==='.').length,3);assert.equal(labels(2,1429).filter(b=>b.text==='1'&&b.state!.baseline<-900).length,2);assert(labels(2,1183).some(b=>b.text==='1'&&b.state!.baseline===-1009&&b.state!.color==='rgba(255,0,255,1.0)'));
 assert.equal(result(3,550),'6');assert.equal(result(3,650),'46');assert.equal(result(3,903),'2.46');assert(labels(3,420).some(b=>b.text==='5'&&b.state!.baseline===-890));assert(labels(3,420).some(b=>b.text==='1'&&b.state!.baseline===-525));assert.equal(labels(3,903).filter(b=>b.text==='.').length,3);assert(labels(3,903).some(b=>b.text==='−'));
 for(const [i,removed]of [[2,[88,92,93,94]],[3,[75,76,77]]] as const)assert(removed.every(id=>!C[i].figure.shapes.some(s=>s.character===id)));assert(C[2].figure.shapes.some(s=>s.character===90));assert.deepEqual(C[3].figure.unitsPerEm,[280,360]);
});
test('source narration begins at frame 4; original Spanish Audio is separate and user-triggered',async()=>{
 const host=fs.readFileSync(path.join(root,'apps/web/components/descriptor-driven-whole-lesson-player.tsx'),'utf8');
 for(const c of C){const p=(await loadLessonTextPresentation(c.animationId))!,m=(await import('../modules/'+c.animationId)).default;assert.equal(p.sourceTimelineAudioCues!.length,1);const cue=p.sourceTimelineAudioCues![0];assert.equal(cue.frame,4);assert.equal(cue.language,'en');assert.equal(cue.frameDomain,c.frameDomain);assert.deepEqual(m.audioCues,[]);assert.equal(m.audioTracks.length,1);const sa=m.audioTracks[0];assert.equal(sa.activation,'user');assert.deepEqual(sa.visibleWhen,['es']);assert.deepEqual(sa.frameDomains,[c.frameDomain]);assert.equal(sa.timelineBehavior,'pause-while-playing');assert.notEqual(sa.sha256,cue.sha256);for(const a of [cue,sa])assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'apps/web/public'+a.source))).digest('hex'),a.sha256);assert(host.includes("|| currentPage.animationId === '"+c.animationId+"'"));}
});
