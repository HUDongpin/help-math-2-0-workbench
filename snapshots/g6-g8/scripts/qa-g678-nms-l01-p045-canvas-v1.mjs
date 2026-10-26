import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p045-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p045-behavior-source-v1',OUT=TASK+'/nms-l01-p045-canvas-v1',ID='shared-nms002-l01-p045';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p045-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p045-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_290/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_290/canvas.js';
const spec=JSON.parse(await readFile(specPath)),statePath=B+'/source-all-domain-state-audit-v1.json',states=JSON.parse(await readFile(statePath));
const paths=[runtime,specPath,rawPath,helperPath,statePath,'scripts/qa-g678-nms-l01-p045-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
const header=definitions.match(/function sprite290\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.35-Number(header[1]),282.9-Number(header[2])];
// Independent reference uses the raw source fill functions, validated exclusive mask roles and source geometry.
for(const mask of spec.clipMasks){const marker='function '+mask.functionKind+mask.characterId+'(ctx,ctrans,frame,ratio,time){',a=definitions.indexOf(marker),b=definitions.indexOf('\n}',a)+2;assert(a>=0&&b>a);const shape=definitions.slice(a,b);assert.equal(shape.split(mask.rawFill).length,2);if(mask.functionKind==='morphshape')assert(shape.includes(mask.rawTransparentStroke)&&mask.rawTransparentStroke.endsWith('((Math.round(0+ratio*(0)/65535))/255)]));'));else assert(!shape.includes('stroke'));definitions=definitions.slice(0,a)+shape.replace(mask.rawFill,'ctx.fillStyle="rgba(0,0,0,1)";')+definitions.slice(b);}
const named=Object.values(states.domains['290'].frames[812]).filter(p=>p.name),sourceNames=Object.fromEntries(named.map(p=>['sprite'+p.objectID,p.name]));
const imageNames=[...definitions.matchAll(/var (imageObj\d+) = /gu)].map(m=>m[1]);assert.equal(imageNames.length,1);
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'835 raw FFDec main frames,7active feedback domains before their terminal reset, both strategy children through their authored waits, all4 teaching holds, final choices and Help. Independent source-name projection and eight source masks; no production projector and no AS/Adobe runtime execution.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.evaluate(()=>document.getElementById('source').getContext('2d',{willReadFrequently:true}));
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+`
var sourceSelection={},sourceNames=${JSON.stringify(sourceNames)},originalPlace=place;
place=function(obj,canvas,ctx,m,ct,b,f,r,t){
 var name=sourceNames[obj];
 if(obj==='sprite88')return;
 if(name&&/^Mc_(Right|Wrong)_Feed/.test(name)){if(obj!=='sprite'+sourceSelection.feedbackCharacterId)return;m=m.slice();m[4]=5;f=sourceSelection.feedbackFrame-1;}
 if(obj==='sprite110'||obj==='sprite146'){if(obj!=='sprite'+sourceSelection.strategyCharacterId)return;f=sourceSelection.strategyFrame-1;}
 if(name==='Mc_Popup'){if(!sourceSelection.helpVisible)return;f=0;}
 return originalPlace(obj,canvas,ctx,m,ct,b,f,r,t);
};
`});
 await page.evaluate(async names=>Promise.all(names.map(n=>globalThis[n].decode())),imageNames);
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const blank={holdIndex:null,continueEnabled:false,strategyEnabled:false,strategyCharacterId:null,strategyFrame:1,wrongAttempts:0,choicesEnabled:false,helpEnabled:false,helpVisible:false,feedbackCharacterId:null,feedbackFrame:1};
 const capture=async(label,frame,interaction=null,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,blank})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   sourceSelection=interaction||blank;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite290(ctx,ctrans,frame-1,0,0);ctx.restore();
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-290');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let f=1;f<=835;f++){await capture('main-'+f,f,null,[1,9,76,152,180,387,388,389,525,526,651,652,773,774,813,814,829,832,833,834,835].includes(f));receipt.mainFrames++;}
 for(const b of spec.practice.branches)for(let f=2;f<b.frameCount;f++){
  await capture(`feedback-${b.sourceCharacterId}-${f}`,813,{...blank,feedbackCharacterId:b.sourceCharacterId,feedbackFrame:f},[2,Math.floor(b.frameCount/2),b.frameCount-1].includes(f));receipt.dynamicStates++;
 }
 for(const s of spec.practice.strategies)for(let f=1;f<=s.waitFrame;f++){
  await capture(`strategy-${s.sourceCharacterId}-${f}`,s.mainFrame,{...blank,holdIndex:s.index,strategyCharacterId:s.sourceCharacterId,strategyFrame:f},[1,2,Math.floor(s.waitFrame/2),s.waitFrame].includes(f));receipt.dynamicStates++;
 }
 for(const [index,f]of [388,525,651,773].entries()){await capture('hold-'+index,f,{...blank,holdIndex:index,continueEnabled:true,strategyEnabled:index>=2},true);receipt.dynamicStates++;}
 await capture('choices',813,{...blank,choicesEnabled:true,helpEnabled:true},true);receipt.dynamicStates++;
 await capture('help',813,{...blank,helpVisible:true},true);receipt.dynamicStates++;
 receipt.rejectedStates=await page.evaluate(({ID,blank})=>[
  {frame:813,state:{...blank,feedbackCharacterId:88,feedbackFrame:2}},
  {frame:813,state:{...blank,feedbackCharacterId:235,feedbackFrame:31}},
  {frame:813,state:{...blank,feedbackFrame:2}},
  {frame:813,state:{...blank,feedbackCharacterId:235,feedbackFrame:3,choicesEnabled:true,helpEnabled:true}},
  {frame:812,state:{...blank,helpVisible:true}},{frame:814,state:{...blank,choicesEnabled:true,helpEnabled:true}},
  {frame:813,state:{...blank,wrongAttempts:3}},{frame:813,state:{...blank,choicesEnabled:1}},
  {frame:813,state:{...blank,helpEnabled:true}},
  {frame:813,state:{...blank,helpVisible:true,feedbackCharacterId:185,feedbackFrame:2}},
  {frame:813,state:{...blank,holdIndex:4}},{frame:388,state:{...blank,holdIndex:1}},
  {frame:388,state:{...blank,holdIndex:0,strategyEnabled:true,continueEnabled:true}},
  {frame:388,state:{...blank,continueEnabled:true}},
  {frame:651,state:{...blank,holdIndex:2,strategyCharacterId:110,strategyFrame:16}},
  {frame:651,state:{...blank,holdIndex:2,strategyCharacterId:146,strategyFrame:1}},
  {frame:651,state:{...blank,holdIndex:2,strategyCharacterId:110,strategyFrame:15,continueEnabled:true}},
  {frame:773,state:{...blank,strategyCharacterId:146,strategyFrame:56}},
  {frame:773,state:{...blank,strategyFrame:2}},
 ].map(({frame,state})=>{try{window.HELP_MATH_CANVAS_ASSETS[ID].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:state});return false;}catch{return true;}}),{ID,blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
