import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {hasLessonTextPresentation,loadLessonTextPresentation} from '../lesson-text-registry';
import {getColumnTeachingState,getColumnShapePaths,type ColumnArithmeticConfig} from './g4-l4-column-arithmetic';
import {G4_L4_COLUMN_CONFIGS} from './generated/g4-l4-column-config';
const C=G4_L4_COLUMN_CONFIGS as readonly ColumnArithmeticConfig[];
const root=process.env.COLUMN_CANDIDATE_ROOT??process.cwd();
const labels=(i:number,f:number)=>getColumnTeachingState(C[i],f).blocks.filter(b=>b.role==='label'&&b.visible&&b.state);
const result=(i:number,f:number)=>labels(i,f).filter(b=>b.state!.baseline>(i===2?1100:2000)).sort((a,b)=>a.state!.x-b.state!.x).map(b=>b.text).join('');
test('actual registry loads all three own modules and rejects foreign source/frame identities',async()=>{
 for(const c of C){assert(hasLessonTextPresentation(c.animationId));const p=(await loadLessonTextPresentation(c.animationId))!;assert.equal(p.binding.placementId,c.placementId);const m=await import('../modules/'+c.animationId);const r={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:17,replay:0};const state=m.default.getFrameState(r.frame,r);assert.equal(p.getSnapshot(state,r).status,'ready');for(const delta of [{frame:0},{frame:r.frame-1},{seed:18},{rootFrame:5},{frameDomain:'root'},{lang:'es'},{entryStateSha256:'foreign'}])assert.equal(p.getSnapshot(state,{...r,...delta} as any).status,'blocked');assert.equal(p.getSnapshot({...state,sourceSwfSha256:'0'.repeat(64)},r).status,'blocked');const html=renderToStaticMarkup(React.createElement(p.Renderer,{...r,state}));assert.match(html,new RegExp('data-modern-text-page="'+c.animationId+'"'));assert.doesNotMatch(html,/<canvas|<foreignObject/);assert.equal(p.playbackEndFrameByDomain![c.frameDomain],c.frameCount);assert.equal(p.reducedMotionFrameByDomain![c.frameDomain],c.frameCount);}
 assert.equal(await loadLessonTextPresentation('course-g04-l04-in-999'),undefined);
});
test('98 + 48 shows temporary 16, moves its carry into tens, and ends 146',()=>{
 assert.equal(result(0,357),'16');assert.equal(result(0,530),'6');const carry=labels(0,530).find(b=>b.text==='1'&&b.state!.baseline<0)!;const tens=labels(0,530).find(b=>b.text==='9')!;assert(Math.abs(carry.state!.x-tens.state!.x)<50);assert.equal(result(0,914),'146');assert.equal(result(0,1),'');
});
test('73 - 49 borrows into 6 tens / 13 ones and retains both strikeout segments',()=>{
 assert(!labels(1,413).some(b=>b.text==='13'));const borrowed=labels(1,440).filter(b=>b.state!.baseline===-624).sort((a,b)=>a.state!.x-b.state!.x);assert.deepEqual(borrowed.map(b=>b.text),['6','13']);const morph=C[1].figure.shapes.find(s=>s.character===21)!;for(const ratio of [0,32768,65535]){const p=getColumnShapePaths(morph,ratio);assert.equal(p[0].d.match(/M /g)!.length,2);assert.match(p[0].stroke,/^rgba\(/);}assert.equal(result(1,714),'24');
});
test('decimal addition preserves three decimal points, two carries, source X marks and 10.07',()=>{
 assert.equal(result(2,437),'17');assert.equal(result(2,559),'7');assert.equal(result(2,734),'.107');const end=labels(2,1386),dots=end.filter(b=>b.text==='.');assert.equal(dots.length,3);assert(Math.max(...dots.map(b=>b.state!.x))-Math.min(...dots.map(b=>b.state!.x))<15);assert.equal(end.filter(b=>b.text==='1'&&b.state!.baseline<0).length,2);for(const id of [23,33])assert(C[2].figure.shapes.some(s=>s.character===id));assert.equal(result(2,1386),'10.07');
});
test('main narration and user-started Spanish Audio keep separate source identities and host access',async()=>{
 const host=fs.readFileSync(path.join(root,'apps/web/components/descriptor-driven-whole-lesson-player.tsx'),'utf8');
 for(const c of C){const p=(await loadLessonTextPresentation(c.animationId))!,m=(await import('../modules/'+c.animationId)).default;assert.equal(p.sourceTimelineAudioCues!.length,1);const cue=p.sourceTimelineAudioCues![0];assert.equal(cue.language,'en');assert.equal(cue.frameDomain,c.frameDomain);assert.deepEqual(m.audioCues,[]);assert.equal(m.audioTracks.length,1);const sa=m.audioTracks[0];assert.equal(sa.activation,'user');assert.deepEqual(sa.visibleWhen,['es']);assert.deepEqual(sa.frameDomains,[c.frameDomain]);assert.equal(sa.timelineBehavior,'pause-while-playing');assert.notEqual(sa.sha256,cue.sha256);for(const a of [cue,sa])assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'apps/web/public'+a.source))).digest('hex'),a.sha256);assert(host.includes("|| currentPage.animationId === '"+c.animationId+"'"));}
});
