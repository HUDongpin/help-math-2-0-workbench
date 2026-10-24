import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';import React from'react';import{renderToStaticMarkup}from'react-dom/server';
import{G4_L4_PRACTICE_CONFIGS as C,G4_L4_PRACTICE_HOST_AUDIO_CANDIDATES as H}from'./generated/g4-l4-practice-config';
import{PracticeScene,getPracticeSnapshot}from'./g4-l4-practice';import{createPracticeState}from'./g4-l4-practice-state';import{loadLessonTextPresentation}from'../lesson-text-registry';import{LESSON_MANUAL_NARRATION_PCM as PCM}from'../generated/lesson-manual-narration-pcm';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
for(const c of C){test(c.animationId+' main narration, all child streams, silent openings and explicit Spanish track are bound',async()=>{
 const p=(await loadLessonTextPresentation(c.animationId))!;assert.equal(p.playbackEndFrameByDomain![c.frameDomain],c.steps[0].hold);assert.deepEqual(p.frameControl!.transitions,[...c.steps.map(s=>s.transition),c.finalTransition]);assert.equal(p.activityTimelines!.length,12);
 for(const cue of[...c.sourceAudio,...c.activities.flatMap(a=>a.audio?[a.audio]:[])]){assert.equal(sha(fs.readFileSync('apps/web/public'+cue.source)),cue.sha256);const pcm=PCM[cue.sha256];assert(pcm);assert.equal(sha(fs.readFileSync('apps/web/public'+pcm.source)),pcm.sha256);assert.equal(fs.statSync('apps/web/public'+pcm.source).size,pcm.frames*pcm.channels*4);}
 for(const step of c.steps.filter(s=>s.box)){const a=c.activities.find(a=>a.id===step.box!.id)!;assert.equal(a.audio,undefined);assert.equal(a.endFrame,15);assert.equal(a.parentLifetime!.firstFrame,step.hold);assert.equal(a.parentLifetime!.lastFrameExclusive,step.hold+1);}
 const tracks=H[c.animationId as keyof typeof H].audioTracks;assert.equal(tracks.length,c.animationId.endsWith('008')?1:0);for(const track of tracks){assert.equal(track.activation,'user');assert.equal(track.timelineBehavior,'pause-while-playing');assert.deepEqual(track.visibleWhen,['es']);assert.equal(sha(fs.readFileSync('apps/web/public'+track.source)),track.sha256);}
});
 test(c.animationId+' completed steps retain separately bound root instances, native math and exact question reveal',async()=>{
 const m=(await import('../modules/'+c.animationId)).default,r={frame:c.finalFrame,rootFrame:6,frameDomain:c.frameDomain,lang:'en' as const,scenario:'source-static-frame',seed:0,replay:0};
 const html=renderToStaticMarkup(<PracticeScene config={c} runtime={r} session={createPracticeState(r)}/>);assert.equal((html.match(/data-retained-panel=/g)??[]).length,2);assert.doesNotMatch(html,/<canvas|<foreignObject/);assert.match(html,/Need More Help/);
 for(const panel of c.completedPanels){for(const b of panel.column.blocks.slice(1)){assert(b.sourceInstances.every(i=>i.startsWith(c.frameDomain+'/')));assert(html.includes('data-lesson-text-block="'+b.id+'"'));}assert(html.includes('data-lesson-text-block="'+panel.heading.id+'"'));}
 const initial={...r,frame:1};const first=getPracticeSnapshot(c,m.getFrameState(1,initial),initial);assert.equal(first.status,'ready');assert(first.blocks.filter(b=>b.role==='question').every(b=>b.text===''));const end=getPracticeSnapshot(c,m.getFrameState(r.frame,r),r);assert(end.blocks.filter(b=>b.role==='question').every(b=>b.visible));
 for(const delta of[{rootFrame:5},{frameDomain:'root'},{lang:'es'},{seed:1},{frame:0},{entryStateSha256:'foreign'}])assert.equal(getPracticeSnapshot(c,m.getFrameState(r.frame,r),{...r,...delta}as any).status,'blocked');
 });}

test('ROCKET retains six own glyph curves in native word order',()=>{const f=C[0].feedbackViews.find(v=>v.id==='correct-1')!;assert.equal(f.labels.filter(v=>v.text.length===1).map(v=>v.text).join(''),'ROCKET');});
