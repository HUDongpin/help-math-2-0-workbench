import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p033-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p033-behavior-source-v1',OUT=TASK+'/nms-l01-p033-canvas-v2',ID='shared-nms002-l01-p033';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p033-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p033-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_257/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_257/canvas.js';
const spec=JSON.parse(await readFile(specPath)),statePath=B+'/source-all-domain-state-audit-v1.json',states=JSON.parse(await readFile(statePath));
const paths=[runtime,specPath,rawPath,helperPath,statePath,'scripts/qa-g678-nms-l01-p033-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
const header=definitions.match(/function sprite257\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),283.3-Number(header[2])];
// Independent source mask reference. Both source masks have only filled geometry.
for(const mask of spec.clipMasks){const marker='function shape'+mask.characterId+'(ctx,ctrans,frame,ratio,time){',a=definitions.indexOf(marker),b=definitions.indexOf('\n}',a)+2;assert(a>=0&&b>a);const shape=definitions.slice(a,b);assert(!shape.includes('stroke'));definitions=definitions.slice(0,a)+shape.replace(mask.rawFill,'ctx.fillStyle="rgba(0,0,0,1)";')+definitions.slice(b);}
const named=Object.values(states.domains['257'].frames[252]).filter(p=>p.name),sourceNames=Object.fromEntries(named.map(p=>['sprite'+p.objectID,p.name]));
const imageNames=[...definitions.matchAll(/var (imageObj\d+) = /gu)].map(m=>m[1]);assert.equal(imageNames.length,1);
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'511 raw FFDec main frames, all7 active feedback domains at every local frame, first-attempt and second-attempt wrong captions and Help. Reference uses independent source-name projection and explicit device-text fallback in source bounds. No generated projector or AS/Adobe runtime is executed by the reference.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
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
 function shifted(m){m=m.slice();m[4]-=100.85;m[5]+=50;return m;}
 function eq(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
 if(obj==='shape250'){
  originalPlace(obj,canvas,ctx,m,ct,b,f,r,t);
  return originalPlace(obj,canvas,ctx,shifted(m),ct,b,f,r,t);
 }
 if(obj==='text23'&&eq(m,[.05,0,0,.05,-62.45,36.65])){
  originalPlace(obj,canvas,ctx,m,ct,b,f,r,t);
  return originalPlace(obj,canvas,ctx,shifted(m),ct,b,f,r,t);
 }
 const move=[['text251',[.05,0,0,.05,27.95,36.65]],['text255',[.05,0,0,.05,.45,36.65]],['text29',[.05,0,0,.05,53.4,36.65]],['shape256',[.05,0,0,.05,14.85,24.05]]];
 if(move.some(([o,expected])=>o===obj&&eq(m,expected)))m=shifted(m);
 return originalPlace(obj,canvas,ctx,m,ct,b,f,r,t);
};
function sourceDevice(ctx,ct,id){
 var value=[249,199,213].includes(sourceSelection.feedbackCharacterId)?'You can use multiplication and subtraction to solve this problem.  Multiply the number of lawns mowed by the amount Tyler earns per lawn. Then subtract the amount Tyler had to pay for gas.'+(sourceSelection.wrongAttempts===1?' Try again.':''):'';
 if(!value)return;
 ctx.save();ctx.fillStyle=tocolor(ct.apply([0,0,0,1]));ctx.textBaseline='alphabetic';ctx.font='bold 300px Arial, sans-serif';
 var widths={195:9687,209:10426,226:11066,247:10362};
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
   sourceSelection=interaction||blank;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite257(ctx,ctrans,frame-1,0,0);ctx.restore();
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-257');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let f=1;f<=511;f++){await capture('main-'+f,f,null,[1,9,100,200,252,253,254,300,330,332,350,375,400,425,450,475,496,510,511].includes(f));receipt.mainFrames++;}
 for(const b of spec.practice.branches)for(let f=2;f<=b.frameCount;f++){
  const state={...blank,wrongAttempts:b.kind==='wrong'?1:0,feedbackCharacterId:b.sourceCharacterId,feedbackFrame:f,popupVisible:b.kind==='wrong'&&f>=b.popupEntryFrame&&f<=b.waitFrame};
  await capture(`feedback-${b.sourceCharacterId}-${f}`,253,state,[2,b.waitFrame??Math.floor(b.frameCount/2),b.frameCount].includes(f));receipt.dynamicStates++;
 }
 await capture('choices',253,{...blank,choicesEnabled:true,helpEnabled:true},true);receipt.dynamicStates++;
 await capture('help',253,{...blank,helpVisible:true},true);receipt.dynamicStates++;
 for(const b of spec.practice.branches.filter(b=>b.kind==='wrong')){await capture(`second-wrong-${b.sourceCharacterId}`,253,{...blank,wrongAttempts:2,feedbackCharacterId:b.sourceCharacterId,feedbackFrame:b.waitFrame,popupVisible:true},true);receipt.dynamicStates++;}
 receipt.rejectedStates=await page.evaluate(({ID,blank})=>[
  {frame:253,state:{...blank,feedbackCharacterId:228,feedbackFrame:2}},{frame:253,state:{...blank,feedbackCharacterId:157,feedbackFrame:2}},
  {frame:253,state:{...blank,feedbackCharacterId:249,feedbackFrame:30}},{frame:253,state:{...blank,feedbackFrame:2}},
  {frame:253,state:{...blank,feedbackCharacterId:249,feedbackFrame:23,choicesEnabled:true}},
  {frame:252,state:{...blank,helpVisible:true}},{frame:254,state:{...blank,choicesEnabled:true}},
  {frame:253,state:{...blank,wrongAttempts:3}},{frame:253,state:{...blank,choicesEnabled:1}},
  {frame:253,state:{...blank,popupVisible:true}},{frame:253,state:{...blank,feedbackCharacterId:249,feedbackFrame:2,popupVisible:true}},
 ].map(({frame,state})=>{try{window.HELP_MATH_CANVAS_ASSETS[ID].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:state});return false;}catch{return true;}}),{ID,blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
