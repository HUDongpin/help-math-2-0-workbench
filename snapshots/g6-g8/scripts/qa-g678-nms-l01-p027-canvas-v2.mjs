import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p027-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p027-behavior-source-v1',OUT=TASK+'/nms-l01-p027-canvas-v2',ID='shared-nms002-l01-p027';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p027-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p027-source-spec-v2.json',rawPath=B+'/source/canvas/sprites/DefineSprite_344/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_344/canvas.js';
const spec=JSON.parse(await readFile(specPath)),paths=[runtime,specPath,rawPath,helperPath,'scripts/qa-g678-nms-l01-p027-canvas-v2.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n'),definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));const header=definitions.match(/function sprite344\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),283.3-Number(header[2])];
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All357 source main frames and reachable four-term/picture/feedback display states. Reference collects untouched source placement arguments, then independently draws selected source children in original depth order with the original two parent transforms. No generated projector reused; no AS or original Flash runtime execution. Five dormant domains remain stopped1.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.evaluate(()=>document.getElementById('source').getContext('2d',{willReadFrequently:true}));
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+`
var rawSourcePlace=place,sourceChildren=[];
place=function(obj,canvas,ctx,matrix,ct,b,f,r,t){
 if(['sprite89','sprite90','sprite91','sprite92','sprite93','sprite94','sprite95','sprite96','sprite98','sprite100','sprite103','sprite106','sprite335','sprite339'].includes(obj)){sourceChildren.push({obj,matrix:matrix.slice(),ct,b,f,r,t});return;}
 if(['sprite159','sprite200','sprite219','sprite322','sprite341','sprite343'].includes(obj))f=0;
 return rawSourcePlace(obj,canvas,ctx,matrix,ct,b,f,r,t);
};`});
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const blank={solvedIndices:[],selectedIndex:null,drag:null,inputEnabled:false,expandedPictures:[],wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 const capture=async(label,frame,interaction=null,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,internal,practice,blank})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   const s=interaction||blank;sourceChildren=[];ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite344(ctx,ctrans,frame-1,0,0);ctx.restore();
   ctx.save();ctx.transform(1,0,0,1,...offset);ctx.transform(1,0,0,1,...internal);
   for(const item of sourceChildren){
    const id=Number(item.obj.slice(6)),piece=practice.choices.find(c=>c.sourceCharacterId===id),targetChoice=practice.choices.find(c=>c.target.sourceCharacterId===id),picture=practice.pictures.find(p=>p.sourceCharacterId===id);
    let local=1,ct=item.ct,m=item.matrix.slice();
    if(piece){if(s.solvedIndices.includes(piece.sourceIndex))continue;if(s.drag?.index===piece.sourceIndex){m[4]+=s.drag.x;m[5]+=s.drag.y;}}
    if(targetChoice){if(!s.solvedIndices.includes(targetChoice.sourceIndex))continue;ct=new cxform(ct.r_add,ct.g_add,ct.b_add,0,ct.r_mult,ct.g_mult,ct.b_mult,255);}
    if(picture)local=s.expandedPictures.includes(picture.index)?2:1;
    if(id===335){if(!s.wrongVisible)continue;local=s.wrongFrame;}
    if(id===339){if(s.correctFrame===1)continue;local=s.correctFrame;}
    rawSourcePlace(item.obj,canvas,ctx,m,ct,item.b,local-1,item.r,item.t);
   }
   ctx.restore();
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,internal:[Number(header[1]),Number(header[2])],practice:spec.practice,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-344');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let frame=1;frame<=357;frame++){await capture('main-'+frame,frame,null,[1,9,50,150,329,330,331,345,357].includes(frame));receipt.mainFrames++;}
 for(const [key,max] of [['wrongFrame',15],['coachFrame',20],['correctFrame',25]])for(let frame=2;frame<=max;frame++){
  await capture(key+'-'+frame,330,{...blank,[key]:frame,wrongVisible:key==='wrongFrame',solvedIndices:key==='correctFrame'?[1,2,3,4]:key==='coachFrame'?[1]:[]},[2,Math.floor(max/2),max].includes(frame));receipt.dynamicStates++;
 }
 for(let mask=0;mask<16;mask++){
  const indices=[1,2,3,4].filter(n=>(mask&(1<<(n-1)))!==0);
  for(const frame of [330,357]){
   await capture(`solved-${mask}-main-${frame}`,frame,{...blank,solvedIndices:indices},mask===15);receipt.dynamicStates++;
   await capture(`pictures-${mask}-main-${frame}`,frame,{...blank,expandedPictures:indices},[1,2,4,8,15].includes(mask));receipt.dynamicStates++;
  }
 }
 for(let index=1;index<=4;index++)for(const [x,y]of [[70.25,-24.5],[-20,150]]){
  await capture(`drag-${index}-${x}`,330,{...blank,inputEnabled:true,selectedIndex:index,drag:{index,x,y}},true);receipt.dynamicStates++;
 }
 receipt.rejectedStates=await page.evaluate(({id,blank})=>[
  {frame:330,state:{...blank,solvedIndices:[5]}},{frame:330,state:{...blank,solvedIndices:[1,1]}},
  {frame:330,state:{...blank,expandedPictures:[0]}},{frame:329,state:{...blank,expandedPictures:[1]}},
  {frame:331,state:{...blank,inputEnabled:true}},{frame:330,state:{...blank,wrongVisible:true}},
  {frame:330,state:{...blank,wrongFrame:16,wrongVisible:true}},{frame:330,state:{...blank,correctFrame:26}},
  {frame:330,state:{...blank,coachFrame:21}},{frame:330,state:{...blank,inputEnabled:true,selectedIndex:1,drag:{index:2,x:0,y:0}}},
  {frame:330,state:{...blank,inputEnabled:true,selectedIndex:1,drag:{index:1,x:NaN,y:0}}}
 ].map(({frame,state})=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:state});return false;}catch{return true;}}),{id:ID,blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
