import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, pin, encode} from './lib/g678-nms-l01-p013-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p013-behavior-source-v1';
const OUT=path.join(TASK,'nms-l01-p013-canvas-v1'),ID='shared-nms002-l01-p013';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p013-current-js-v1/members',ID,'canvas-renderer.js');
const specPath=path.join(TASK,'nms-l01-p013-source-spec-v1.json'),spec=JSON.parse(await readFile(specPath));
const inputs=await Promise.all([runtime,specPath].map(async p=>pin(p,await readFile(p))));
await mkdir(OUT);const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const receipt={status:'running',inputs,mainFrames:0,feedbackFrames:0,errors:[],screenshots:[],pixelComparisons:[],originalRuntimeAccepted:false,registered:false};
const initial=()=>({solvedIndices:[],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1});
try{
 const context=await browser.newContext({viewport:{width:820,height:660},serviceWorkers:'block'});
 await context.route('**/*',r=>{receipt.errors.push('Unexpected request:'+r.request().url());return r.abort();});
 const page=await context.newPage();page.on('pageerror',e=>receipt.errors.push(e.message));
 await page.setContent('<html><body style="margin:10px;background:white"><canvas id="source" width="800" height="600"></canvas><p id="state"></p></body></html>');
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const render=async(frame,interaction)=>page.evaluate(({ID,frame,interaction})=>{
  const canvas=document.getElementById('source'),state=window.HELP_MATH_CANVAS_ASSETS[ID].render(canvas,{frame,scenario:'source-static-frame',lang:'en',seed:0,interaction});
  document.getElementById('state').textContent=JSON.stringify({frame,interaction});
  return {frame:state.localFrame,domain:state.frameDomain,actual:canvas.dataset.flashFrame};
 },{ID,frame,interaction});
 const shot=async label=>{const p=path.join(OUT,label+'.png');await page.screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));};
 const compare=async label=>{
  const png=(await readFile(B+'/static-source-drawing-v1/'+label+'.png')).toString('base64');
  const value=await page.evaluate(async b=>{const image=new Image();image.src='data:image/png;base64,'+b;await image.decode();const c=document.createElement('canvas');c.width=800;c.height=600;c.getContext('2d').drawImage(image,0,0);const a=c.getContext('2d').getImageData(0,0,800,600).data,p=document.getElementById('source').getContext('2d').getImageData(0,0,800,600).data;let differences=0;for(let i=0;i<a.length;i++)if(a[i]!==p[i])differences++;return {differences};},png);receipt.pixelComparisons.push({label,...value});assert.equal(value.differences,0,label);
 };
 for(let frame=1;frame<=243;frame++){
  const state=await render(frame,{...initial(),inputEnabled:frame===196});assert.deepEqual(state,{frame,domain:'sprite-112',actual:String(frame)});receipt.mainFrames++;
  if([1,100,171,196,197,243].includes(frame)){await shot('main-'+frame);if(frame!==197)await compare('main-'+frame+'-base');}
 }
 for(const field of ['wrongFrame','correctFrame','coachFrame']){
  const count={wrongFrame:15,correctFrame:25,coachFrame:20}[field];
  for(let frame=2;frame<=count;frame++){
   await render(196,{...initial(),[field]:frame,wrongVisible:field==='wrongFrame',solvedIndices:field==='correctFrame'?[1,2,3,4,5,6,7,8]:[]});receipt.feedbackFrames++;
   if(frame===2||frame===count)await shot(field+'-'+frame);
  }
 }
 await render(196,{...initial(),wrongVisible:true,wrongFrame:15});await compare('main-196-wrong');
 await render(196,{...initial(),helpVisible:true});await compare('main-196-help');await shot('help196');
 await render(171,{...initial(),helpVisible:true});await shot('help171');
 for(const c of spec.practice.choices){
  await render(196,{...initial(),inputEnabled:true,selectedIndex:c.sourceIndex,drag:{index:c.sourceIndex,x:c.target.bounds.x-c.bounds.x,y:c.target.bounds.y-c.bounds.y}});await shot('drag-'+c.sourceIndex);
 }
 await render(196,{...initial(),solvedIndices:[1,2,3,4,5,6,7,8]});await shot('all-targets');
 const rejected=await page.evaluate(({ID,base})=>{
  const bad=[{...base,solvedIndices:[1,1]},{...base,selectedIndex:9},{...base,wrongVisible:true,wrongFrame:1},{...base,inputEnabled:true,helpVisible:true},{...base,drag:{index:1,x:NaN,y:0}},{...base,correctFrame:26}];
  return bad.map(interaction=>{try{window.HELP_MATH_CANVAS_ASSETS[ID].render(document.getElementById('source'),{frame:196,lang:'en',scenario:'source-static-frame',seed:0,interaction});return false;}catch{return true;}});
 },{ID,base:initial()});assert.deepEqual(rejected,Array(6).fill(true));assert.deepEqual(receipt.errors,[]);receipt.status='passed';await context.close();
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(inputs)===JSON.stringify(await Promise.all([runtime,specPath].map(async p=>pin(p,await readFile(p)))));await writeFile(path.join(OUT,'receipt.json'),encode(receipt),{flag:'wx'});console.log(encode(receipt));}
