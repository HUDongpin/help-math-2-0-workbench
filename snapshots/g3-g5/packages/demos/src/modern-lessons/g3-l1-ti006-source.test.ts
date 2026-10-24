import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {G3_L1_TI006_SOURCE_DATA as source} from './generated/g3-l1-ti006-source-v1';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const read=(path:string)=>readFileSync(new URL('../../../../'+path,import.meta.url));
const artifact=JSON.parse(gunzipSync(read('catalog/typography-v1/source-catalog/assets/'+source.sourceSha256+'.json.gz')).toString());
const scripts=gunzipSync(read('migrations/course-g03-l01-ti-006/audit/machine/ffdec-scripts.txt.gz')).toString();
const evidence=JSON.parse(read('work/typography-v1/g3-l1-ti006/source-evidence.json').toString());
const main=artifact.timelines.find((t:any)=>t.timelineId===source.frameDomain);

test('the fixed page 63 binds the exact SWF, FLA and six independently rounded questions',()=>{
 assert.equal(source.placementId,'g03-l01-placement-063');
 assert.equal(source.sourceSha256,'c70acf111952af6f3495d42f472a0c396fb7d20b3c97d0ea7f7610fc614c5bcd');
 assert.equal(evidence.fla.sha256,'85e74a4de76069d026455c5b954962f24407a235706a90038d4a0dbc85402348');
 assert.deepEqual(source.questions.map(q=>q.prompt),['Round 35,103 to the ten thousands place','Round 68,280 to the thousands place','Round 12,337 to the hundreds place.','Round 1,725 to the tens place.','Round 75 to the tens place.','Round 32 to the tens place.']);
 assert.deepEqual(source.questions.map(q=>q.answers.find(a=>a.correct)?.text),['40,000','68,000','12,300','1,730','80','30']);
 assert.deepEqual(source.questions.map(q=>q.answers.findIndex(a=>a.correct)),[2,2,1,0,2,1]);
 for(const q of source.questions){const value=Number(q.prompt.match(/[\d][\d,]*/)?.[0].replaceAll(',',''));assert.equal(Math.round(value/q.roundUnit)*q.roundUnit,q.rounded);}
});

test('the third left choice remains the authored 12 and every correct hit area is the relocated button 46',()=>{
 assert.equal(source.questions[2].answers[0].text,'12');
 assert.equal(source.questions[2].answers[0].characterId,290);
 for(const q of source.questions){const a=q.answers.find(a=>a.correct)!;assert.equal(a.sourceButton,46);const e=main.events.find((e:any)=>e.frame===q.frame&&e.instanceId===a.sourceButtonInstanceId);assert.equal(e.characterId,46);assert.equal(e.name.text,'AnsBtn4');assert.equal(e.matrix[4],a.x);}
});

test('source word reveal and six authored holds are explicit, and only correct child completion advances',()=>{
 assert.deepEqual(source.instructionFrames,[{frame:1,text:''},{frame:55,text:'Click'},{frame:60,text:'Click the'},{frame:66,text:'Click the correct'},{frame:73,text:'Click the correct answer.'}]);
 assert.deepEqual(source.sourceStops,[79,81,83,85,87,89]);
 assert.deepEqual(source.transitions.map(x=>[x.fromFrame,x.toFrame,x.stopFrame]),[[79,80,81],[81,82,83],[83,84,85],[85,86,87],[87,88,89],[89,90,90]]);
 const actions=scripts.split(/^===== /m);
 for(const feedback of source.feedback){const action=actions.find(a=>a.startsWith(`DefineSprite_${feedback.sprite}/frame_${feedback.endFrame}/DoAction.as`));assert(action);assert.equal(action.includes('_parent.play()'),feedback.kind==='correct');if(feedback.kind==='wrong'){assert(action.includes('_root.enableQuizButton()'));assert(actions.some(a=>a.startsWith(`DefineSprite_${feedback.sprite}/frame_22/DoAction.as`)&&a.includes('stop();')));}}
 assert(!/quizTryCount\s*(\+\+|\+=)|quizTryCount\s*==/.test(scripts));
 assert(scripts.includes('_parent.gotoAndPlay(23);'));
});

test('same-lesson host selects only the exact three wrong and four correct instances',()=>{
 assert.deepEqual(source.feedback.map(f=>[f.id,f.sprite,f.endFrame]),[['wrong-1',118,31],['wrong-2',94,28],['wrong-3',106,29],['correct-1',149,26],['correct-2',189,27],['correct-3',247,25],['correct-4',215,31]]);
 assert(evidence.host.functions.find((f:any)=>f.name==='showWrongFeed').text.includes('random(3)'));
 assert(evidence.host.functions.find((f:any)=>f.name==='showRightFeed').text.includes('random(4)'));
 for(const feedback of source.feedback){assert.deepEqual(feedback.parentLifetime,{firstFrame:79,lastFrameExclusive:90});const name=`Mc_${feedback.kind==='wrong'?'Wrong':'Right'}_Feed${feedback.variant}`;assert(main.events.some((e:any)=>e.characterId===feedback.sprite&&e.name?.text===name));}
 assert.deepEqual(source.feedback.filter(f=>f.kind==='wrong').map(f=>f.popupFrames),[[[14,22]],[[17,22]],[[15,22]]]);
});

test('ten active streams retain exact bytes and two dormant streams are excluded from runtime',()=>{
 assert.equal(source.audio.length,10);
 for(const a of source.audio){assert.equal(hash(read(a.path)),a.sha256);assert(a.firstFrame<=a.lastFrame);}
 assert.equal(source.audio.find(a=>a.id==='main')?.sha256,'9a521640485e922ceed20bf9c004038d3486c0bbe8063ffdab95d2f7f7e34bad');
 assert.equal(source.audio.find(a=>a.id==='help-close-click')?.sha256,source.audio.find(a=>a.id==='wrong-close-click')?.sha256);
 assert.deepEqual(evidence.dormantAudio.map((a:any)=>a.frameDomain),['sprite-83','sprite-280']);
 for(const a of evidence.audio)assert.equal(a.decodeToEofPassed,true);
});

test('read-only feedback, help arrows and the two bitmap objects retain explicit source facts',()=>{
 const field=artifact.textDefinitions.find((d:any)=>d.characterId===67);assert.equal(field.flags.readOnly,true);assert.equal(field.flags.html,true);assert(scripts.includes('txtFeed.text = _global.WrongFeed;'));
 assert.equal(artifact.textDefinitions.length,56);assert.equal(artifact.bitmapDefinitions.length,2);
 assert.deepEqual(artifact.bitmapDefinitions.map((b:any)=>b.characterId),[156,208]);
 assert.equal(source.helpRuns.length,29);assert(source.helpRuns.some(r=>r.text.includes('50,000')));assert(source.helpRuns.some(r=>r.text.includes('460')));
 assert(evidence.sourceGeometry.sourceCode206Glyph.includes('map="206"'));
});
