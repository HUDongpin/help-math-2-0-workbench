import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p029-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p029-behavior-source-v1',OUT=TASK+'/nms-l01-p029-canvas-v1',ID='shared-nms002-l01-p029';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p029-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p029-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_327/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_327/canvas.js';
const spec=JSON.parse(await readFile(specPath)),paths=[runtime,specPath,rawPath,helperPath,'scripts/qa-g678-nms-l01-p029-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n'),rawDefinitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
const mask=rawDefinitions.match(/function shape40\(ctx,ctrans,frame,ratio,time\)\{[\s\S]*?\n\}/u)[0];assert.equal((mask.match(/ctx\.fillStyle=/gu)||[]).length,1);assert(!/stroke/u.test(mask));assert(mask.includes('ctx.fillStyle=tocolor(ctrans.apply([0,0,204,0.24313726]));'));const definitions=rawDefinitions.replace(mask,mask.replace('ctx.fillStyle=tocolor(ctrans.apply([0,0,204,0.24313726]));','ctx.fillStyle="rgba(0,0,0,1)";'));const header=definitions.match(/function sprite327\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),283.3-Number(header[2])];
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All437 source main frames, all32 subsets of five correct targets, all13 source drags including suffix0, Help396 and feedback states. Two exclusive mask40 instances use opaque source coverage, independently from the generated normalizer. Reference collects untouched source placement arguments, then independently draws selected source children in original depth order with the original two parent transforms. No generated projector reused; no AS or original Flash runtime execution. Six dormant domains and coach326 remain stopped1;13 embedded images are decoded before drawing.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.evaluate(()=>document.getElementById('source').getContext('2d',{willReadFrequently:true}));
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+`
var rawSourcePlace=place,sourceChildren=[];
place=function(obj,canvas,ctx,matrix,ct,b,f,r,t){
 if(['sprite46','sprite47','sprite48','sprite49','sprite50','sprite51','sprite52','sprite53','sprite54','sprite55','sprite56','sprite57','sprite58','sprite59','sprite60','sprite61','sprite62','sprite63','sprite97','sprite318','sprite322'].includes(obj)){sourceChildren.push({obj,matrix:matrix.slice(),ct,b,f,r,t});return;}
 if(['sprite118','sprite158','sprite199','sprite245','sprite309','sprite324','sprite326'].includes(obj))f=0;
 return rawSourcePlace(obj,canvas,ctx,matrix,ct,b,f,r,t);
};`});
 await page.evaluate(async()=>{const names=Object.keys(window).filter(k=>/^imageObj\d+$/.test(k));if(names.length!==13)throw Error('13 source bitmap definitions required');await Promise.all(names.map(k=>window[k].decode()));});
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const blank={solvedIndices:[],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 const capture=async(label,frame,interaction=null,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,internal,practice,blank})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   const s=interaction||blank;sourceChildren=[];ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite327(ctx,ctrans,frame-1,0,0);ctx.restore();
   ctx.save();ctx.transform(1,0,0,1,...offset);ctx.transform(1,0,0,1,...internal);
   for(const item of sourceChildren){
    const id=Number(item.obj.slice(6)),piece=practice.choices.find(c=>c.sourceCharacterId===id),targetChoice=practice.targets.find(t=>t.sourceCharacterId===id);
    let local=1,ct=item.ct,m=item.matrix.slice();
    if(piece){if(s.solvedIndices.includes(piece.sourceIndex))continue;if(s.drag?.index===piece.sourceIndex){m[4]+=s.drag.x;m[5]+=s.drag.y;}}
    if(targetChoice){if(!s.solvedIndices.includes(targetChoice.sourceIndex))continue;ct=new cxform(ct.r_add,ct.g_add,ct.b_add,0,ct.r_mult,ct.g_mult,ct.b_mult,255);}
    if(id===97){if(!s.helpVisible)continue;local=1;}
    if(id===318){if(!s.wrongVisible)continue;local=s.wrongFrame;}
    if(id===322){if(s.correctFrame===1)continue;local=s.correctFrame;}
    rawSourcePlace(item.obj,canvas,ctx,m,ct,item.b,local-1,item.r,item.t);
   }
   ctx.restore();
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,internal:[Number(header[1]),Number(header[2])],practice:spec.practice,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-327');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let frame=1;frame<=437;frame++){await capture('main-'+frame,frame,null,[1,9,17,169,170,171,200,221,232,247,250,255,300,350,395,396,397,410,437].includes(frame));receipt.mainFrames++;}
 for(const [key,max] of [['wrongFrame',15],['coachFrame',20],['correctFrame',25]])for(let frame=2;frame<=max;frame++){
  await capture(key+'-'+frame,396,{...blank,[key]:frame,wrongVisible:key==='wrongFrame',solvedIndices:key==='correctFrame'?[0,1,2,3,4]:key==='coachFrame'?[0]:[]},[2,Math.floor(max/2),max].includes(frame));receipt.dynamicStates++;
 }
 for(let mask=0;mask<32;mask++)for(const frame of [396,437]){
  const indices=[0,1,2,3,4].filter(n=>(mask&(1<<n))!==0);
  await capture(`solved-${mask}-main-${frame}`,frame,{...blank,solvedIndices:indices},[1,3,7,15,31].includes(mask));receipt.dynamicStates++;
 }
 for(const indices of [[],[0],[0,4],[0,1,2,3]]){await capture('help-'+indices.join('-'),396,{...blank,solvedIndices:indices,helpVisible:true},true);receipt.dynamicStates++;}
 for(let index=0;index<13;index++)for(const [x,y]of [[70.25,-24.5],[-20,150]]){
  await capture(`drag-${index}-${x}`,396,{...blank,inputEnabled:true,selectedIndex:index,drag:{index,x,y}},true);receipt.dynamicStates++;
 }
 receipt.rejectedStates=await page.evaluate(({id,blank})=>[
  {frame:396,state:{...blank,solvedIndices:[5]}},{frame:396,state:{...blank,solvedIndices:[0,0]}},
  {frame:395,state:{...blank,helpVisible:true}},{frame:437,state:{...blank,helpVisible:true}},
  {frame:437,state:{...blank,inputEnabled:true}},{frame:396,state:{...blank,wrongVisible:true}},
  {frame:396,state:{...blank,wrongFrame:16,wrongVisible:true}},{frame:396,state:{...blank,correctFrame:26}},
  {frame:396,state:{...blank,coachFrame:21}},{frame:396,state:{...blank,inputEnabled:true,selectedIndex:0,drag:{index:1,x:0,y:0}}},
  {frame:396,state:{...blank,inputEnabled:true,selectedIndex:0,drag:{index:0,x:NaN,y:0}}},
  {frame:396,state:{...blank,inputEnabled:true,selectedIndex:13}},
  {frame:396,state:{...blank,inputEnabled:true,solvedIndices:[0],selectedIndex:0,drag:{index:0,x:0,y:0}}}
 ].map(({frame,state})=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:state});return false;}catch{return true;}}),{id:ID,blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
