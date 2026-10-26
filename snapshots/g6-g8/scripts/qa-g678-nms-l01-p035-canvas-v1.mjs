import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p035-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p035-behavior-source-v1',OUT=TASK+'/nms-l01-p035-canvas-v1',ID='shared-nms002-l01-p035';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p035-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p035-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_246/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_246/canvas.js';
const spec=JSON.parse(await readFile(specPath)),statePath=B+'/source-all-domain-state-audit-v1.json',states=JSON.parse(await readFile(statePath));
const paths=[runtime,specPath,rawPath,helperPath,statePath,'scripts/qa-g678-nms-l01-p035-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
const header=definitions.match(/function sprite246\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),283.3-Number(header[2])];
// Independent source mask reference. Both source masks have only filled geometry.
for(const mask of spec.clipMasks){const marker='function shape'+mask.characterId+'(ctx,ctrans,frame,ratio,time){',a=definitions.indexOf(marker),b=definitions.indexOf('\n}',a)+2;assert(a>=0&&b>a);const shape=definitions.slice(a,b);assert(!shape.includes('stroke'));definitions=definitions.slice(0,a)+shape.replace(mask.rawFill,'ctx.fillStyle="rgba(0,0,0,1)";')+definitions.slice(b);}
const named=Object.values(states.domains['246'].frames[244]).filter(p=>p.name),sourceNames=Object.fromEntries(named.map(p=>['sprite'+p.objectID,p.name]));
const imageNames=[...definitions.matchAll(/var (imageObj\d+) = /gu)].map(m=>m[1]);assert.equal(imageNames.length,1);
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'623 raw FFDec main frames, all7 active feedback domains at every local frame, first-attempt and second-attempt wrong captions and Help. Reference uses independent source-name projection and explicit device-text fallback in source bounds. No generated projector or AS/Adobe runtime is executed by the reference.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.evaluate(()=>document.getElementById('source').getContext('2d',{willReadFrequently:true}));
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+`
var sourceSelection={},sourceNames=${JSON.stringify(sourceNames)},originalPlace=place;
place=function(obj,canvas,ctx,m,ct,b,f,r,t){
 var name=sourceNames[obj];
 if(name&&/^Mc_(Right|Wrong)_Feed/.test(name)){if(obj!=='sprite'+sourceSelection.feedbackCharacterId)return;m=m.slice();m[4]=5;f=sourceSelection.feedbackFrame-1;}
 if(name==='Mc_PopUp'){if(!sourceSelection.helpVisible)return;f=0;}
 return originalPlace(obj,canvas,ctx,m,ct,b,f,r,t);
};
function sourceDevice(ctx,ct,id){
 var value=[235,185,199].includes(sourceSelection.feedbackCharacterId)?'Use multiplication and subtraction to solve this problem.  Multiply 1 by the number of hours.  Subtract that number from 70 degrees, the temperature at 5:00 PM.'+(sourceSelection.wrongAttempts===1?' Try again.':''):'';
 if(!value)return;
 ctx.save();ctx.fillStyle=tocolor(ct.apply([0,0,0,1]));ctx.textBaseline='alphabetic';ctx.font='bold 300px Arial, sans-serif';
 var widths={181:9687,195:10426,212:11066,233:10362};
 ctx.textAlign='left';var y=300,line='',words=value.split(' ');for(var word of words){var trial=line?line+' '+word:word;if(line&&ctx.measureText(trial).width>widths[id]){ctx.fillText(line,-2802,y);line=word;y+=340;}else line=trial;}ctx.fillText(line,-2802,y);
 ctx.restore();
}
`+spec.practice.fields.map(f=>`text${f.sourceCharacterId}=function(ctx,ct){sourceDevice(ctx,ct,${f.sourceCharacterId});};`).join('\n')});
 await page.evaluate(async names=>Promise.all(names.map(n=>globalThis[n].decode())),imageNames);
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const blank={wrongAttempts:0,choicesEnabled:false,helpEnabled:false,helpVisible:false,feedbackCharacterId:null,feedbackFrame:1,popupVisible:false};
 const capture=async(label,frame,interaction=null,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,blank})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   sourceSelection=interaction||blank;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite246(ctx,ctrans,frame-1,0,0);ctx.restore();
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-246');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let f=1;f<=623;f++){await capture('main-'+f,f,null,[1,9,10,11,12,13,100,200,244,245,246,300,335,336,350,379,380,400,458,459,500,550,576,577,600,607,608,609,610,611,612,613,622,623].includes(f));receipt.mainFrames++;}
 for(const b of spec.practice.branches)for(let f=2;f<=b.frameCount;f++){
  const state={...blank,wrongAttempts:b.kind==='wrong'?1:0,feedbackCharacterId:b.sourceCharacterId,feedbackFrame:f,popupVisible:b.kind==='wrong'&&f>=b.popupEntryFrame&&f<=b.waitFrame};
  await capture(`feedback-${b.sourceCharacterId}-${f}`,245,state,[2,b.waitFrame??Math.floor(b.frameCount/2),b.frameCount].includes(f));receipt.dynamicStates++;
 }
 await capture('choices',245,{...blank,choicesEnabled:true,helpEnabled:true},true);receipt.dynamicStates++;
 await capture('help',245,{...blank,helpVisible:true},true);receipt.dynamicStates++;
 for(const b of spec.practice.branches.filter(b=>b.kind==='wrong')){await capture(`second-wrong-${b.sourceCharacterId}`,245,{...blank,wrongAttempts:2,feedbackCharacterId:b.sourceCharacterId,feedbackFrame:b.waitFrame,popupVisible:true},true);receipt.dynamicStates++;}
 receipt.rejectedStates=await page.evaluate(({ID,blank})=>[
  {frame:245,state:{...blank,feedbackCharacterId:214,feedbackFrame:2}},{frame:245,state:{...blank,feedbackCharacterId:143,feedbackFrame:2}},
  {frame:245,state:{...blank,feedbackCharacterId:235,feedbackFrame:30}},{frame:245,state:{...blank,feedbackFrame:2}},
  {frame:245,state:{...blank,feedbackCharacterId:235,feedbackFrame:23,choicesEnabled:true}},
  {frame:244,state:{...blank,helpVisible:true}},{frame:246,state:{...blank,choicesEnabled:true}},
  {frame:245,state:{...blank,wrongAttempts:3}},{frame:245,state:{...blank,choicesEnabled:1}},
  {frame:245,state:{...blank,popupVisible:true}},{frame:245,state:{...blank,feedbackCharacterId:235,feedbackFrame:2,popupVisible:true}},
 ].map(({frame,state})=>{try{window.HELP_MATH_CANVAS_ASSETS[ID].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:state});return false;}catch{return true;}}),{ID,blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
