import assert from 'node:assert/strict';import {mkdir,readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p021-generator-v2.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p021-behavior-source-v1',OUT=TASK+'/nms-l01-p021-canvas-v4',ID='shared-nms002-l01-p021';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p021-current-js-v2/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p021-source-spec-v2.json',rawPath=B+'/source/canvas/sprites/DefineSprite_160/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_160/canvas.js';
const referencePath=B+'/source-button150-states-reference-v2.json',buttonReference=JSON.parse(await readFile(referencePath));
const spec=JSON.parse(await readFile(specPath)),paths=[referencePath,B+'/source/source.xml',runtime,specPath,rawPath,helperPath,'scripts/qa-g678-nms-l01-p021-canvas-v4.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n'),definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));const header=definitions.match(/function sprite160\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const internal=[Number(header[1]),Number(header[2])],offset=[412.4-internal[0],280.3-internal[1]],jumpNames=Object.values(spec.practice.allJumpPlacements).map(p=>'sprite'+p.id);
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All572 raw main frames with source571 initialized hidden objects; all ten source normal-release card sets/partial equations/wrong states; independently reconstructed source placements and correct157/coach46/close149 frames. Retained source releaseOutside copy errors are repaired via documented normal-release authority. Real Button150 states reconstructed independently from source XML; no generated projector or button helper reused by reference; no source AS or original Flash runtime executed.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 const init=`var rawSourcePlace=place,referenceState=null;button150=function(ctx,ctrans,frame,ratio,time){const states=${JSON.stringify(buttonReference.states)};for(const r of states[frame]??[])place(r.object,canvas,ctx,r.matrix,ctrans.merge(new cxform(...r.color)),1,0,0,time);};place=function(obj,canvas,ctx,matrix,ct,b,f,r,t){if(${JSON.stringify(jumpNames.concat('sprite153'))}.includes(obj))return;if(['sprite157','sprite159'].includes(obj))f=0;if(obj==='sprite46')f=referenceState?referenceState.coachFrame-1:0;if(obj==='button150')f=referenceState&&referenceState.closePressed?2:0;if(obj==='sprite149')f=referenceState?referenceState.buttonFrame-1:0;return rawSourcePlace(obj,canvas,ctx,matrix,ct,b,f,r,t);};`;
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+init});await page.evaluate(async()=>{await Promise.all(Object.keys(window).filter(k=>/^imageObj\d+$/.test(k)).map(k=>window[k].decode()));});
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const capture=async(label,frame,interaction,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,internal,practice})=>{
   const target=document.getElementById('source'),state=window.HELP_MATH_CANVAS_ASSETS[ID].render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});referenceState=interaction;
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite160(ctx,ctrans,frame-1,0,0);ctx.restore();
   if(interaction){
    const problem=practice.problems[interaction.questionIndex],equation=interaction.step===0?problem.initialQuestion:interaction.step===1?problem.partialQuestion:problem.completedQuestion;
    ctx.save();ctx.transform(1,0,0,1,...offset);ctx.transform(1,0,0,1,...internal);
    const field=practice.fields.find(f=>f.sourceCharacterId===44);ctx.save();ctx.transform(.05,0,0,.05,136,-184.1);ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font='bold 480px Arial, sans-serif';ctx.textAlign='right';ctx.textBaseline='alphabetic';ctx.fillText(equation,field.boundsTwips.right-40,480);ctx.restore();
    for(const card of [...problem.cards].sort((a,b)=>a.sourceDepth-b.sourceDepth)){
     const p=interaction.positions[card.id];ctx.save();ctx.transform(.05,0,0,.05,p.x,p.y);window['sprite'+card.sourceCharacterId](ctx,ctrans,0,0,0);ctx.restore();
    }
    if(interaction.popup==='wrong'){
     const t=practice.popupPlacement.transform;ctx.save();ctx.transform(.05,0,0,.05,t.transX/20,t.transY/20);sprite153(ctx,ctrans,0,0,0);
     // Raw txtFeed is empty because device text is reconstructed independently here.
     ctx.save();ctx.transform(1,0,0,1,-4774,-501);ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font='400px Arial, sans-serif';ctx.textAlign='left';ctx.textBaseline='alphabetic';const width=practice.fields.find(f=>f.sourceCharacterId===152).boundsTwips.right-40;let line='',row=0;
     for(const word of problem.feedback.en.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){ctx.fillText(line,0,400+row*480);line=word;row++;}else line=next;}if(line)ctx.fillText(line,0,400+row*480);ctx.restore();ctx.restore();
    }
    if(interaction.correctFrame>1){const t=practice.correctPlacement.transform;ctx.save();ctx.transform(.05,0,0,.05,t.transX/20,t.transY/20);sprite157(ctx,ctrans,interaction.correctFrame-1,0,0);ctx.restore();}
    ctx.restore();
   }
   const compare=document.createElement('canvas');compare.width=800;compare.height=600;const cc=compare.getContext('2d',{willReadFrequently:true});cc.drawImage(target,0,0);const expected=ctx.getImageData(0,0,800,600).data,actual=cc.getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,internal,practice:spec.practice});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-160');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 const state=(index,step=0,extra={})=>{const p=spec.practice.problems[index];return {questionIndex:index,positions:Object.fromEntries(p.cards.map(c=>[c.id,step>=1&&c.role==='first'||step===2&&c.role==='second'?c.destination:c.origin])),step,popup:'none',correctFrame:1,coachFrame:1,closePressed:false,buttonFrame:1,...extra};};
 const dynamic=async(label,s,shot=false)=>{await capture(label,571,s,shot);receipt.dynamicStates++;};
 for(let frame=1;frame<=572;frame++){await capture('main-'+frame,frame,null,[1,9,50,100,150,200,250,300,350,400,450,500,540,550,569,570,571,572].includes(frame));receipt.mainFrames++;}
 for(let q=0;q<10;q++){
  for(const step of [0,1,2])await dynamic(`problem-${q}-step-${step}`,state(q,step),true);
  for(const step of [0,1])await dynamic(`problem-${q}-wrong-${step}`,state(q,step,{popup:'wrong'}),q<2);
  for(let correctFrame=1;correctFrame<=25;correctFrame++)await dynamic(`problem-${q}-correct-${correctFrame}`,state(q,2,{correctFrame}),correctFrame===2);
  for(let buttonFrame=1;buttonFrame<=5;buttonFrame++)await dynamic(`problem-${q}-close-down-${buttonFrame}`,state(q,0,{popup:'wrong',closePressed:true,buttonFrame}),q===0&&buttonFrame===5);
  for(const card of spec.practice.problems[q].cards){const s=state(q);s.positions[card.id]={x:card.origin.x+45.5,y:card.origin.y-123.25};await dynamic(`problem-${q}-drag-${card.id}`,s,q===0);}
 }
 // Each rejected card has its own authored reset position; several differ by0.5px from initial placement.
 for(let q=0;q<10;q++){
  const p=spec.practice.problems[q];
  for(const step of [0,1])for(const card of p.cards.filter(c=>c.role==='distractor'||step===0&&c.role==='second')){const s=state(q,step,{popup:'wrong'});s.positions[card.id]=card.reset;await dynamic(`problem-${q}-wrong-${step}-${card.id}`,s,q===0&&step===1);}
  for(const card of p.cards){const s=state(q);s.positions[card.id]=card.reset;await dynamic(`problem-${q}-outside-${card.id}`,s);}
  for(const card of p.cards.filter(c=>c.role==='distractor'))for(const correctFrame of [1,2]){const s=state(q,2,{correctFrame});s.positions[card.id]=card.reset;await dynamic(`problem-${q}-after-${card.id}-${correctFrame===1?'step-2':'correct-2'}`,s,q===0);}
 }
 for(let coachFrame=1;coachFrame<=55;coachFrame++)await dynamic('coach-frame-'+coachFrame,state(0,0,{coachFrame}));
 const old=JSON.parse(await readFile(TASK+'/nms-l01-p021-canvas-v3/receipt.json'));const unchanged=[],changed=[];
 for(const before of old.screenshots){const after=receipt.screenshots.find(a=>path.basename(a.path)===path.basename(before.path));assert(after);if(after.sha256===before.sha256)unchanged.push(path.basename(after.path));else changed.push(path.basename(after.path));}assert.deepEqual(changed,['problem-0-close-down-5.png']);receipt.predecessorVisualRegression={unchanged,changed,onlyActualButtonDownChanged:true};
 receipt.rejectedStates=await page.evaluate(({id,valid})=>[{...valid,questionIndex:10},{...valid,step:3},{...valid,positions:{}},{...valid,closePressed:true},{...valid,coachFrame:56},{...valid,correctFrame:2},{...valid,positions:{...valid.positions,[Object.keys(valid.positions)[0]]:{x:NaN,y:0}}}].map(interaction=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame:571,lang:'en',scenario:'source-static-frame',seed:0,interaction});return false;}catch{return true;}}),{id:ID,valid:state(0)});assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
