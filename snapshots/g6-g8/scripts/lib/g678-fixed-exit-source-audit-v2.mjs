import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

/** Source audit for the two real per-option-feedback consumers P048/P049.
 * Configuration names exact source symbols; it does not infer behavior from IDs. */
export function auditFixedExitSourceV2(M) {
 const sha=b=>createHash('sha256').update(b).digest('hex');
 const pin=p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:sha(b)};};
 const read=p=>JSON.parse(fs.readFileSync(p));
 const c=read(`${M}/generator-v1/source-config-v1.json`);
 const custody=read(`${M}/audit-v1/source-custody-v1.json`);
 for(const p of custody.sourceFiles){assert.equal(fs.realpathSync(p.source),p.source);assert.equal(pin(p.source).sha256,p.sha256);assert.equal(pin(p.source).bytes,p.bytes);assert.deepEqual(fs.readFileSync(p.copy),fs.readFileSync(p.source));}
 assert.equal(custody.sourceFiles[0].sha256,c.sourceSha256);
 const catalog=read(`${M}/source-v1/source-text-catalog-v1.json`);
 const timelines=catalog.timelines.map(t=>{const live=new Map(),frames=[];for(let f=1;f<=t.declaredFrameCount;f++){for(const e of t.events.filter(e=>e.frame===f)){if(e.kind==='remove'){assert(live.has(e.depth));live.delete(e.depth);}else if(e.kind==='place'){const p=e.move?{...live.get(e.depth)}:{matrix:[1,0,0,1,0,0],depth:e.depth,placedFrame:f};for(const k of ['characterId','matrix','colorTransform','ratio','name','clipDepth','instanceId'])if(k in e)p[k]=e[k];assert(p.characterId);live.set(e.depth,p);}}frames.push([...live.values()].map(p=>({...p})));}return {...t,frames};});
 const timeline=id=>timelines.find(t=>t.timelineId===(id==='root'?'root':`sprite-${id}`));
 assert.equal(timelines.length,c.domains);assert.equal(timeline('root').declaredFrameCount,10);assert.equal(timeline(c.main).declaredFrameCount,c.last);
 const dir=`${M}/source-v1/ffdec/scripts`,walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
 const scripts=walk(dir).filter(p=>p.endsWith('.as')).sort().map(p=>({file:pin(p),source:fs.readFileSync(p,'utf8')}));assert.equal(scripts.length,c.scripts);
 const squash=s=>s.replace(/\s/g,''),expect=(p,s)=>{const actual=scripts.find(x=>x.file.path===dir+'/'+p);assert(actual,p);assert.equal(squash(actual.source),squash(s),p);};
 expect('frame_1/DoAction.as','_level0.InternalPreloader.gotoAndPlay("jump_check");stop();');expect('frame_6/DoAction.as','stop();');
 expect(`DefineSprite_${c.main}/frame_1/DoAction.as`,'Mc_Popup._visible=false;CloseBtn._visible=false;');
 expect(`DefineSprite_${c.main}/frame_${c.quiz}/DoAction.as`,'stop();_global.quizSection=true;_global.quizTryCount=0;Mc_Popup._visible=false;CloseBtn._visible=false;');
 expect(`DefineSprite_${c.main}/frame_${c.quiz+1}/DoAction.as`,'_global.quizSection=false;');expect(`DefineSprite_${c.main}/frame_${c.last}/DoAction.as`,'stop();');
 const main=timeline(c.main),named=main.frames[c.quiz-1].filter(p=>p.name).map(p=>({characterId:p.characterId,name:p.name.text,depth:p.depth,matrix:p.matrix}));
 for(const a of c.answers){const b=named.find(p=>p.name===a.instance);assert.equal(b?.characterId,a.button);const label=main.frames[c.quiz-1].find(p=>p.characterId===a.label);assert(label);assert(Math.abs(b.matrix[4]-label.matrix[4])<450&&Math.abs(b.matrix[5]-label.matrix[5])<450,'answer label/hit region');}
 for(const a of c.answers){
  const p=`DefineButton2_${a.button}/BUTTONCONDACTION on(release).as`;
  if(a.correct)expect(p,'on(release){_root.disableQuizButton();Mc_Right_Feed4.gotoAndPlay(2);NMHBtn.enabled=false;}');
  else{const actual=scripts.find(x=>x.file.path===dir+'/'+p).source;
   assert.deepEqual([...actual.matchAll(/_global\.WrongFeed\s*=\s*"([^"]*)";/g)].map(m=>m[1]),[a.wrongLater,a.wrongFirst],'literal whitespace and punctuation in option-specific feedback');
   expect(p,`on(release){if(_global.quizTryCount==1){_global.WrongFeed="${a.wrongLater}";}else{_global.WrongFeed="${a.wrongFirst}";}_root.disableQuizButton();Mc_Wrong_Feed4.gotoAndPlay(2);NMHBtn.enabled=false;}`);
  }
 }
 assert.deepEqual(scripts.filter(x=>!x.source.trim()).map(x=>x.file.path.slice(dir.length+1)),c.emptyScripts,'retain and classify empty exported action records');
 expect(`DefineButton2_${c.helpButton}/BUTTONCONDACTION on(release).as`,'on(release){NMHBtn.enabled=false;_root.disableQuizButton();Mc_Popup._visible=true;CloseBtn._visible=true;}');
 expect(`DefineButton2_${c.helpClose}/BUTTONCONDACTION on(release).as`,'on(release){NMHBtn.enabled=true;_root.enableQuizButton();Mc_Popup._visible=false;CloseBtn._visible=false;}');
 for(const [id,end] of c.rightDomains){expect(`DefineSprite_${id}/frame_1/DoAction.as`,'stop();');expect(`DefineSprite_${id}/frame_${end}/DoAction.as`,'stop();_root.disableQuizButton();_global.quizSection=false;this.gotoAndStop(1);_parent.play();');assert.equal(timeline(id).declaredFrameCount,end);}
 for(const [id,hold,end,callback] of c.wrongDomains){expect(`DefineSprite_${id}/frame_1/DoAction.as`,'stop();'+(callback?'_parent.enableButton();':''));expect(`DefineSprite_${id}/frame_${hold}/DoAction.as`,'stop();');expect(`DefineSprite_${id}/frame_${end}/DoAction.as`,'stop();_root.enableQuizButton();this.gotoAndStop(1);_global.quizTryCount++;_parent.NMHBtn.enabled=true;if(_global.quizTryCount>=2){_global.quizTryCount=0;_global.quizSection=false;_parent.play();}'+(id===c.wrong?'9;':''));assert.equal(timeline(id).declaredFrameCount,end);}
 for(const [id,jump] of c.closeButtons)expect(`DefineButton2_${id}/BUTTONCONDACTION on(release).as`,`on(release){_parent.gotoAndPlay(${jump});i=1;while(i<=4){eval("AnsBtn"+i).gotoAndStop(1);i++;}}`);
 for(const id of c.dynamicDomains)expect(`DefineSprite_${id}/frame_1/DoAction.as`,'txtFeed.text=_global.WrongFeed;');
 const glossary=c.glossary.map(([characterId,term,q,v])=>{const p=`DefineButton2_${characterId}/BUTTONCONDACTION on(release).as`;expect(p,`on(release){${q?'q;':''}_global.KeyAttribute="${term}";_root.DoHyperLinks();${v?'v;':''}_root.animation_mc.animation.stop();}`);return {characterId,term,script:pin(dir+'/'+p),bareQStatement:!!q,bareVStatement:!!v};});
 for(const [name,id] of [['Mc_Right_Feed4',c.right],['Mc_Wrong_Feed4',c.wrong],['Mc_Popup',c.help],['NMHBtn',c.helpButton],['CloseBtn',c.helpClose]])assert.equal(named.find(p=>p.name===name)?.characterId,id);
 assert(main.frames[c.quiz].every(p=>!p.name));
 const answerBindings=c.answers.map(a=>({...a,...(!a.correct?{message:a.wrongLater}:{})}));
 const model={schemaVersion:1,animationId:custody.animationId,source:pin(custody.sourceFiles[0].source),spanishAudio:pin(custody.sourceFiles[1].source),placement:custody.placement,stage:{width:800,height:600},fps:12,rootEntryFrame:6,mainSpriteId:c.main,mainFrameCount:c.last,quizFrame:c.quiz,postQuizFrame:c.quiz+1,namedAtQuiz:named,answerBindings,glossary,scripts,timelines,texts:catalog.textDefinitions,shapes:catalog.shapeDefinitions,bitmaps:catalog.bitmapDefinitions,buttons:catalog.buttonDefinitions,risks:catalog.risks,findings:{sourceDomains:c.domains,correctLetter:c.answers.find(a=>a.correct).letter,correctInstance:c.answers.find(a=>a.correct).instance,correctButtonCharacterId:c.answers.find(a=>a.correct).button,wrongButtonCharacterIds:[...new Set(c.answers.filter(a=>!a.correct).map(a=>a.button))],activeSourceStreams:[c.right,c.wrong,c.main],dormantFeedbackStreams:[...c.rightDomains,...c.wrongDomains].map(a=>a[0]).filter(id=>id!==c.right&&id!==c.wrong),selection:'Direct named feedback4 only. No random dispatch.',wrongCounter:'Press reads current counter. Close resumes22; terminal28 increments. First exit enables retry; second resets0 and resumes main. Bare literal9 has no effect.',help:'Static help disables answers; Close restores them. Nested glossary preserves help, held main and trigger focus.',terminal:`Main${c.last} stops; no ordinary loop or lesson-completion call.`,unresolvedCallback:'_parent.enableButton() has no local definition; do not substitute _root.enableQuizButton or unlock controls.',visual:c.visual},emptyActionRecords:c.emptyScripts,sourceAuditScope:'P048/P049 share runtime behavior while preserving option-specific messages and explicit answer-instance mapping.',pending:['Native per-frame teaching visualization and source roles','Browser decode','Product/My Lesson/registry and independent acceptance'],registered:false,originalRuntimeAccepted:false};
 const output=`${M}/native-v1/source-model-v1.json`,bytes=Buffer.from(JSON.stringify(model,null,2)+'\n');if(fs.existsSync(output)||process.argv.includes('--check'))assert.deepEqual(fs.readFileSync(output),bytes);else fs.writeFileSync(output,bytes,{flag:'wx'});
 return {animationId:model.animationId,domains:timelines.length,scripts:scripts.length,mainFrames:c.last,quizFrame:c.quiz,activeStreams:model.findings.activeSourceStreams,model:pin(output),registered:false};
}
