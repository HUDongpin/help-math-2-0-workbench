import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {getCourseG03L09Ts008FrameState} from '../modules/course-g03-l09-ts-008';
import {G3_L9_TS008_SOURCE_DATA as S} from './generated/g3-l9-ts008-source-v1';
import {G3_L9_TS008_ACTIVITIES,G3_L9_TS008_TEXT_BINDING,G3_L9_TS008_TEXT_PRESENTATION,G3_L9_TS008_TERMS,createG3L9Ts008Session,synchronizeG3L9Ts008Session,chooseG3L9Ts008Answer,getG3L9Ts008Activity,getG3L9Ts008Teaching,getG3L9Ts008TextSnapshot,G3L9Ts008ModernRenderer} from './g3-l9-ts008';
import {getG3L9GeometryState,G3L9SourceGeometry,G3L9SourceLetter,G3L9SourceTableLetter,sourceMorphPath} from './g3-l9-ts008-geometry';
const context=(frame=703,seed=0):RuntimeContext=>({frame,seed,scenario:'source-static-frame',lang:'en',frameDomain:'sprite-343',rootFrame:6,replay:0});
const state=(c:RuntimeContext)=>getCourseG03L09Ts008FrameState(c.frame,c);
const source=JSON.parse(gunzipSync(readFileSync(new URL('../../../../catalog/typography-v1/source-catalog/assets/'+S.sourceSha256+'.json.gz',import.meta.url))).toString());
const scripts=gunzipSync(readFileSync(new URL('../../../../migrations/course-g03-l09-ts-008/audit/machine/ffdec-scripts.txt.gz',import.meta.url))).toString();
const section=(name:string)=>scripts.split(/^===== /m).find((s:string)=>s.startsWith(name))??'';

test('all text blocks bind exact source text records; dynamic X/Z fields are read-only',()=>{
 const ids=new Set(source.textDefinitions.flatMap((t:any)=>[t.sourceTextId,...(t.runs??[]).map((r:any)=>r.sourceTextId)]));
 assert.equal(source.textDefinitions.length,71);
 for(const block of G3_L9_TS008_TEXT_BINDING.blocks)for(const id of block.sourceTextIds)assert(ids.has(id),id);
 for(const id of[105,108]){const d=source.textDefinitions.find((t:any)=>t.characterId===id);assert(d.flags.readOnly);assert(['X','Z'].includes(d.initialText.text.trim()));}
 assert.equal(G3_L9_TS008_TEXT_BINDING.placementId,'g03-l09-placement-090');
});
test('source hold/continue edges and helper start/stop/Close semantics stay independently bound',()=>{
 assert.deepEqual(S.stops,[266,406,522,631,703]);
 assert.deepEqual(S.transitions.map(e=>[e.fromFrame,e.toFrame,e.stopFrame]),[[266,267,406],[406,407,522],[522,523,631],[631,632,703],[703,704,725]]);
 for(const h of S.helpers){assert(section(`DefineSprite_${h.sprite}/frame_${h.endFrame}/DoAction.as`).includes('stop();'));const a=G3_L9_TS008_ACTIVITIES.find(a=>a.id===`help-${h.id}`)!;assert.deepEqual(a.parentLifetime,{firstFrame:h.parentFrame,lastFrameExclusive:h.parentFrame+1});}
 assert(section('DefineSprite_126/frame_1/').includes('stop();'));assert(section('DefineSprite_142/frame_1/').includes('stop();'));assert.equal(section('DefineSprite_162/frame_1/'),'');
 assert.deepEqual(S.helpers.map(h=>h.closeRange),[[18,18],[15,180],[1,77]]);
 assert(section('DefineButton2_125/').includes('_parent.play();'));assert(section('DefineButton2_151/').includes('this._visible = false;'));assert(!section('DefineButton2_151/').includes('_parent.play();'));
 validateLessonTextFrameControl(G3_L9_TS008_TEXT_PRESENTATION.frameControl!,725);validateLessonTextActivities(G3_L9_TS008_ACTIVITIES,725,12);
});
test('the authored answer is C/X and only source-host 3 wrong and 4 right variants are active',()=>{
 assert.deepEqual(S.choices.filter(c=>c.correct).map(c=>[c.letter,c.value,c.button]),[['C','X',147]]);
 assert(section('DefineButton2_147/').includes('_root.showRightFeed()'));
 for(let seed=0;seed<4;seed++){const s=createG3L9Ts008Session(seed);assert.equal(chooseG3L9Ts008Answer(s,703,'X')!.feedback!.id,`correct-${seed+1}`);assert.equal(chooseG3L9Ts008Answer(s,703,'P')!.feedback!.id,`wrong-${seed%3+1}`);}
 assert.equal(S.feedback.filter(f=>f.kind==='wrong').length,3);assert.equal(S.feedback.filter(f=>f.kind==='correct').length,4);
 assert.equal(chooseG3L9Ts008Answer(createG3L9Ts008Session(),702,'X'),null);assert.equal(chooseG3L9Ts008Answer(createG3L9Ts008Session(),703,'R'),null);
});
test('helpers and feedback reject stale revisions or foreign instances, and Replay resets all source session state',()=>{
 const s={...createG3L9Ts008Session(),helpFloors:{symmetry:3},passiveStarted:true};const d=G3_L9_TS008_ACTIVITIES.find(a=>a.id==='help-symmetry')!;
 const a={id:d.id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:77,revision:4,status:'completed' as const};
 assert.equal(getG3L9Ts008Activity(s,d.id,[a]),a);assert.equal(getG3L9Ts008Activity(s,d.id,[{...a,revision:3}]),undefined);assert.equal(getG3L9Ts008Activity(s,d.id,[{...a,sourceInstanceId:'wrong-instance'}]),undefined);
 assert.deepEqual(synchronizeG3L9Ts008Session(s,{...context(),replay:1}),createG3L9Ts008Session(0,1));
 assert.equal(synchronizeG3L9Ts008Session({...s,help:'symmetry'},context(704)).help,null);
});
test('source reveal boundaries expose steps in teaching order and no hidden helper text appears early',()=>{
 for(const [key,first] of [['step1',267],['step2',407],['step3',523],['step4',632]] as const){assert.equal(getG3L9Ts008Teaching(first-1)[key],false);assert.equal(getG3L9Ts008Teaching(first)[key],true);}
 for(const frame of S.stops){const c=context(frame),s=getG3L9Ts008TextSnapshot(state(c),c);assert.equal(s.status,'ready');assert(!s.blocks.some(b=>b.id==='symmetry-definition'&&b.visible));}
 const c=context(631),session={...createG3L9Ts008Session(),help:'fold' as const},d=G3_L9_TS008_ACTIVITIES.find(a=>a.id==='help-fold')!;
 for(const f of[169,170]){const snap=getG3L9Ts008TextSnapshot(state(c),c,session,[{id:d.id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:f,revision:1,status:'playing'}]);assert.equal(snap.blocks.find(b=>b.id==='fold-caption')!.visible,f>=170);}
});
test('geometry timeline keeps authored masks, discrete glyphs, half-shapes, and source offsets',()=>{
 assert(getG3L9GeometryState('fold',15).objects.some(o=>o.characterId===130));
 assert(getG3L9GeometryState('fold',27).objects.some(o=>o.characterId===134));assert(getG3L9GeometryState('fold',27).objects.some(o=>o.characterId===135));
 assert(getG3L9GeometryState('fold',113).objects.some(o=>o.characterId===138));assert(getG3L9GeometryState('fold',113).objects.some(o=>o.characterId===139));
 assert(getG3L9GeometryState('symmetry',4).objects.some(o=>'clipDepth'in o&&o.characterId===160));
 assert.equal(getG3L9GeometryState('symmetry',99).frame,77);
 assert.equal(sourceMorphPath('M 0 10 0 20 L 10 20 20 30',0),'M 0 0 L 10 20');assert.equal(sourceMorphPath('M 0 10 0 20 L 10 20 20 30',65535),'M 10 20 L 20 30');
 const clipped=renderToStaticMarkup(<G3L9SourceGeometry kind="fold" frame={40} label="Source axis"/>);assert(/<clipPath[^>]*><path /.test(clipped),'SVG clipPath needs a directly rendered shape, not an unsupported group');
 assert(S.geometry.shapes['135'].paths[0].path.includes('-16471'));assert(S.geometry.shapes['132'].paths[0].path.includes('-16491'));
});
test('the source subset font is byte-bound and used for one explicit SVG glyph at a time',()=>{
 const b=readFileSync(new URL('../../../../'+S.geometry.font.path,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),S.geometry.font.sha256);assert(S.geometry.font.singleExplicitlyPositionedGlyphOnly);
 const markup=renderToStaticMarkup(<><G3L9SourceLetter letter="X"/><G3L9SourceGeometry kind="fold" frame={15} label="Fold"/></>);assert(markup.includes('<text'));assert(!/<(?:canvas|img)\b/.test(markup));assert(markup.includes('data-source-geometric-glyph="x"'));assert(markup.includes('data-ttf-glyph-index="9"'));
});
test('all nine active audio assets bind source streams with correct source-only boundaries',()=>{
 assert.equal(S.audio.length,9);for(const a of S.audio){const b=readFileSync(new URL('../../../../'+a.path,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);}
 const main=S.audio.find(a=>a.id==='main')!;assert.deepEqual([main.firstFrame,main.lastFrame],[13,716]);assert.equal(S.audio.find(a=>a.id==='correct-4')!.path.endsWith('.wav'),true);
 assert.equal(G3_L9_TS008_ACTIVITIES.filter(a=>a.buttonPress).length,3);for(const h of S.helpers){const b=source.buttonDefinitions.find((b:any)=>b.characterId===h.closeButtonId),r=b.statePlacements.find((r:any)=>r.recordIndex===10);assert.equal(r.characterId,124);assert.deepEqual(r.states,{up:false,over:false,down:true,hitTest:false});assert(h.closeSourceInstanceId.endsWith(`/button-${h.closeButtonId}/record-10`));}
});
test('native ordinary text uses no canvas, raster surrogate, or editable Flash fields; source identity and language fail closed',()=>{
 const c=context(),html=renderToStaticMarkup(<G3L9Ts008ModernRenderer {...c} state={state(c)} onLessonActivityRequest={()=>true}/>);assert(html.includes('Which letter'));assert(html.includes('X has two lines'));assert(!/<(?:canvas|img|input|textarea)\b/.test(html));assert.equal(new Set(Object.values(G3_L9_TS008_TERMS).map(t=>t.entryId)).size,7);
 assert.equal(getG3L9Ts008TextSnapshot({...state(c),sourceSwfSha256:'0'.repeat(64)},c).status,'blocked');const es={...c,lang:'es' as const};assert.equal(getG3L9Ts008TextSnapshot(state(es),es).status,'blocked');assert.equal(getG3L9Ts008TextSnapshot(state(c),{...c,entryStateSha256:'1'.repeat(64)}).status,'blocked');
});


test('actual product loader admits the source-bound p90 capability and all three exact Close generations',async()=>{
 const {loadAnimationModuleForPresentation}=await import('../animation-registry');
 const loaded=await loadAnimationModuleForPresentation(S.animationId,{modernText:true});
 assert.equal(loaded?.textPresentation?.binding.placementId,S.placementId);
 const buttons=loaded!.textPresentation!.activityTimelines!.filter(a=>a.buttonPress);assert.equal(buttons.length,3);assert.equal(new Set(buttons.map(a=>a.sourceInstanceId)).size,3);assert.deepEqual(buttons.map(a=>a.buttonPress!.sourceButtonId),[125,125,151]);
});

// Shape117 table comparison regression checks.
test('table rows keep all five authored axes and each sampled glyph/axis relative placement',()=>{
 const safe=readFileSync(new URL('../../../../apps/web/public/current-js-preview-assets/courses/course-g03-l09-ts-008/canvas-renderer.js',import.meta.url),'utf8');
 const start=safe.indexOf('function shape117('),end=safe.indexOf('\nfunction ',start+1),paths=[...safe.slice(start,end).matchAll(/var pathData="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(S.geometry.shapes['117'].paths.map(p=>p.path),paths);
 assert.deepEqual(S.geometry.tableRows.map(r=>[r.row,r.letter,r.characterId,[...r.pathIndexes]]),[['A','P',113,[4]],['B','Q',111,[3]],['C','X',108,[0,1]],['D','Z',105,[2]]]);
 const sourceObjects=(domain:string,frame:number)=>{const depths=new Map<number,any>();for(const e of source.timelines.find((t:any)=>t.timelineId===domain).events){if(e.frame>frame)continue;if(e.kind==='remove')depths.delete(e.depth);if(e.kind==='place')depths.set(e.depth,{...(e.move?depths.get(e.depth):{}),...e});}return [...depths.values()];};
 const project=(m:readonly number[],x:number,y:number)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
 for(const row of S.geometry.tableRows){
  assert.deepEqual(G3_L9_TS008_TEXT_BINDING.blocks.find(b=>b.id===`table-${row.row}`)!.sourceShapeIds,[117]);
  for(const variant of ['main','help'] as const){const p=row.placements[variant],objects=sourceObjects(p.frameDomain,p.frame),axis=objects.find(o=>o.characterId===117),letter=objects.find(o=>o.characterId===row.characterId);assert.deepEqual(p.sourceLetterMatrix,letter.matrix);assert.deepEqual(p.sourceAxisMatrix,axis.matrix);
   for(const index of row.pathIndexes){const numbers=paths[index].match(/-?\d+/g)!.map(Number);for(let i=0;i<numbers.length;i+=2){const local=project(p.axisMatrix,numbers[i],numbers[i+1]),actual=project(p.sourceLetterMatrix,local[0],local[1]),expected=project(p.sourceAxisMatrix,numbers[i],numbers[i+1]);for(let n=0;n<2;n++)assert(Math.abs(actual[n]-expected[n])<1e-8,'axis/letter relative placement drift');}}
   const html=renderToStaticMarkup(<G3L9SourceTableLetter row={row.row} variant={variant}/>);assert.equal((html.match(/data-source-axis-path=/g)??[]).length,row.pathIndexes.length);assert(html.includes(`data-source-table-variant="${variant}"`));assert(html.includes('<text'));assert(!/<(?:canvas|img)\b/.test(html));assert(html.includes(row.letter==='X'?'vertical and horizontal':'halves do not match'));
  }
  if(row.glyph.sourceFontId===104){assert.equal(row.glyph.renderFontId,35);assert.equal(row.glyph.fontPolicy,'modern35-substitute-system104-baseline820-not-original-runtime');}
 }
});
test('the main comparison appears at523 and Help uses the same four source-bound table blocks at522',()=>{
 for(const frame of [522,523]){const c=context(frame),html=renderToStaticMarkup(<G3L9Ts008ModernRenderer {...c} state={state(c)} onLessonActivityRequest={()=>true}/>);assert.equal((html.match(/data-source-table-row=/g)??[]).length,frame===523?4:0);assert.equal((html.match(/data-source-axis-path=/g)??[]).length,frame===523?5:0);}
 const c=context(522),closed=getG3L9Ts008TextSnapshot(state(c),c),opened=getG3L9Ts008TextSnapshot(state(c),c,{...createG3L9Ts008Session(),help:'table'});
 for(const row of ['A','B','C','D']){assert.equal(closed.blocks.find(b=>b.id===`table-${row}`)!.visible,false);assert.equal(opened.blocks.find(b=>b.id===`table-${row}`)!.visible,true);}
});
