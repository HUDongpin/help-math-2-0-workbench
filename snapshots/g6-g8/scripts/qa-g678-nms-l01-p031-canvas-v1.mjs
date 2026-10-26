import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p031-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p031-behavior-source-v1',OUT=TASK+'/nms-l01-p031-canvas-v1',ID='shared-nms002-l01-p031';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p031-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p031-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_374/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_374/canvas.js';
const spec=JSON.parse(await readFile(specPath)),statePath=B+'/source-all-domain-state-audit-v1.json',states=JSON.parse(await readFile(statePath));
const paths=[runtime,specPath,rawPath,helperPath,statePath,'scripts/qa-g678-nms-l01-p031-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
const header=definitions.match(/function sprite374\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),283.3-Number(header[2])];
// Raw mask alpha is ignored by Flash clip geometry: explicit opaque vector mask for source-only comparator.
for(const mask of spec.clipMasks){const re=new RegExp(`function shape${mask.characterId}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?\\n\\}`,'u'),f=definitions.match(re);assert(f);definitions=definitions.replace(f[0],f[0].replace(mask.rawFill,'ctx.fillStyle="rgba(0,0,0,1)";'));}
const named=Object.values(states.domains['374'].frames[541]).filter(p=>p.name),sourceNames=Object.fromEntries(named.map(p=>['sprite'+p.id,p.name]));
const imageNames=[...definitions.matchAll(/var (imageObj\d+) = /gu)].map(m=>m[1]);assert.equal(imageNames.length,2);
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'605 raw FFDec main frames, all7 active feedback domains at every local frame,3 coaching clocks, all4 typed-input states and Help. Reference uses independent source-name projection and explicit device-text fallback in source bounds. No generated projector or AS/Adobe runtime is executed by the reference.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
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
 if(['sprite336','sprite349','sprite361'].includes(obj))f=obj==='sprite'+sourceSelection.nextCharacterId?sourceSelection.nextFrame-1:0;
 return originalPlace(obj,canvas,ctx,m,ct,b,f,r,t);
};
function sourceDevice(ctx,ct,id){
 var isWrong=[129,145,167,190].includes(id),value=id===373?'54':isWrong?(sourceSelection.feedbackCharacterId===null?'':'Remember to add each unit cube, tens rod to find the solution.'+(sourceSelection.wrongAttempts===1?' Try again.':'')):sourceSelection.inputText;
 if(!value)return;
 ctx.save();ctx.fillStyle=tocolor(ct.apply([0,0,0,1]));ctx.textBaseline='alphabetic';ctx.font=(isWrong||id===108?'bold ':'')+(isWrong?300:440)+'px Arial, sans-serif';
 if(isWrong){ctx.textAlign='left';var y=300,line='',words=value.split(' ');for(var word of words){var trial=line?line+' '+word:word;if(line&&ctx.measureText(trial).width>9687){ctx.fillText(line,-2802,y);line=word;y+=340;}else line=trial;}ctx.fillText(line,-2802,y);}
 else{ctx.textAlign='right';ctx.fillText(value,1017,440,1017);}
 ctx.restore();
}
`+spec.practice.fields.map(f=>`text${f.sourceCharacterId}=function(ctx,ct){sourceDevice(ctx,ct,${f.sourceCharacterId});};`).join('\n')});
 await page.evaluate(async names=>Promise.all(names.map(n=>globalThis[n].decode())),imageNames);
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const blank={questionIndex:0,inputText:'',wrongAttempts:0,inputEnabled:false,helpEnabled:false,helpVisible:false,newProblemEnabled:false,feedbackCharacterId:null,feedbackFrame:1,popupVisible:false,nextCharacterId:null,nextFrame:1};
 const capture=async(label,frame,interaction=null,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,blank})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   sourceSelection=interaction||blank;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite374(ctx,ctrans,frame-1,0,0);ctx.restore();
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-374');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let f=1;f<=605;f++){await capture('main-'+f,f,null,[1,4,100,200,300,400,500,542,543,544,545,546,547,548,549,575,604,605].includes(f));receipt.mainFrames++;}
 for(const b of spec.practice.branches)for(let f=2;f<=b.frameCount;f++){
  const state={...blank,inputText:'0',wrongAttempts:1,feedbackCharacterId:b.sourceCharacterId,feedbackFrame:f,popupVisible:b.kind==='wrong'&&f>=b.popupEntryFrame&&f<=b.waitFrame};
  await capture(`feedback-${b.sourceCharacterId}-${f}`,542,state,[2,b.waitFrame??Math.floor(b.frameCount/2),b.frameCount].includes(f));receipt.dynamicStates++;
 }
 for(let index=0;index<4;index++){
  const p=spec.practice.problems[index];
  for(const value of ['',String(p.result),'0','-1','15.5','123456789012']){await capture(`input-${index}-${value||'empty'}`,p.questionFrame,{...blank,questionIndex:index,inputText:value,inputEnabled:true,helpEnabled:true,newProblemEnabled:index<3},true);receipt.dynamicStates++;}
  await capture(`help-${index}`,p.questionFrame,{...blank,questionIndex:index,inputText:String(p.result),helpVisible:true},true);receipt.dynamicStates++;
  for(let f=2;f<=42;f++){await capture(`coaching-${index}-${f}`,p.questionFrame,{...blank,questionIndex:index,inputText:String(p.result),nextCharacterId:p.nextCharacterId,nextFrame:f},[2,20,42].includes(f));receipt.dynamicStates++;}
  for(const b of spec.practice.branches.filter(b=>b.kind==='wrong')){await capture(`second-wrong-${index}-${b.sourceCharacterId}`,p.questionFrame,{...blank,questionIndex:index,inputText:'0',wrongAttempts:2,feedbackCharacterId:b.sourceCharacterId,feedbackFrame:b.waitFrame,popupVisible:true},true);receipt.dynamicStates++;}
 }
 receipt.rejectedStates=await page.evaluate(({ID,blank})=>[
  {frame:542,state:{...blank,feedbackCharacterId:149,feedbackFrame:2}},{frame:542,state:{...blank,feedbackCharacterId:278,feedbackFrame:2}},
  {frame:542,state:{...blank,feedbackCharacterId:169,feedbackFrame:29}},{frame:542,state:{...blank,feedbackFrame:2}},
  {frame:542,state:{...blank,nextCharacterId:349,nextFrame:2}},{frame:542,state:{...blank,nextCharacterId:336,nextFrame:43}},
  {frame:542,state:{...blank,feedbackCharacterId:169,feedbackFrame:23,inputEnabled:true}},
  {frame:542,state:{...blank,feedbackCharacterId:169,feedbackFrame:23,nextCharacterId:336,nextFrame:2}},
  {frame:541,state:{...blank,helpVisible:true}},{frame:543,state:{...blank,inputEnabled:true}},
  {frame:542,state:{...blank,inputText:'1'.repeat(13)}},{frame:542,state:{...blank,wrongAttempts:3}},
  {frame:542,state:{...blank,questionIndex:4}},{frame:542,state:{...blank,popupVisible:true}},
  {frame:542,state:{...blank,feedbackCharacterId:169,feedbackFrame:2,popupVisible:true}},
 ].map(({frame,state})=>{try{window.HELP_MATH_CANVAS_ASSETS[ID].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:state});return false;}catch{return true;}}),{ID,blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
