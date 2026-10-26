import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT, pin, encode} from './lib/g678-nms-l01-p011-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
const OUT=path.join(TASK,'nms-l01-p011-canvas-v1'),ID='shared-nms002-l01-p011';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p011-current-js-v1/members',ID,'canvas-renderer.js');
const specPath=path.join(TASK,'nms-l01-p011-source-spec-v1.json'),spec=JSON.parse(await readFile(specPath));
const inputs=await Promise.all([runtime,specPath].map(async p=>pin(p,await readFile(p))));
await mkdir(OUT);const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const receipt={status:'running',inputs,mainFrames:0,feedbackFrames:0,errors:[],screenshots:[],originalRuntimeAccepted:false,registered:false};
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
 for(let frame=1;frame<=145;frame++){
  const state=await render(frame,{feedbackCharacterId:null,feedbackFrame:1,choicesEnabled:frame===102,popupVisible:false});
  assert.deepEqual(state,{frame,domain:'sprite-214',actual:String(frame)});receipt.mainFrames++;
  if([1,33,102,103,145].includes(frame))await shot('main-'+frame);
 }
 for(const b of spec.practice.branches){
  for(let frame=2;frame<=b.frameCount;frame++){
   await render(102,{feedbackCharacterId:b.sourceCharacterId,feedbackFrame:frame,choicesEnabled:false,popupVisible:b.kind==='wrong'&&frame>=16&&frame<=22});receipt.feedbackFrames++;
   if(frame===(b.kind==='wrong'?22:12))await shot(b.kind+'-'+b.index+'-frame-'+frame);
  }
 }
 const rejected=await page.evaluate(id=>{
  const bad=[{feedbackCharacterId:109,feedbackFrame:2,choicesEnabled:false,popupVisible:false},{feedbackCharacterId:207,feedbackFrame:29,choicesEnabled:false,popupVisible:false},{feedbackCharacterId:92,feedbackFrame:22,choicesEnabled:true,popupVisible:true}];
  return bad.map(interaction=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame:102,lang:'en',scenario:'source-static-frame',seed:0,interaction});return false;}catch{return true;}});
 },ID);assert.deepEqual(rejected,[true,true,true]);assert.deepEqual(receipt.errors,[]);receipt.status='passed';await context.close();
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(inputs)===JSON.stringify(await Promise.all([runtime,specPath].map(async p=>pin(p,await readFile(p)))));await writeFile(path.join(OUT,'receipt.json'),encode(receipt),{flag:'wx'});console.log(encode(receipt));}
