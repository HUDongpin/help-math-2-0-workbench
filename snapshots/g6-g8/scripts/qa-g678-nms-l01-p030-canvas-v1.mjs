import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p030-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p030-behavior-source-v1',OUT=TASK+'/nms-l01-p030-canvas-v1',ID='shared-nms002-l01-p030';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p030-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p030-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_113/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_113/canvas.js';
const spec=JSON.parse(await readFile(specPath)),paths=[runtime,specPath,rawPath,helperPath,'scripts/qa-g678-nms-l01-p030-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n'),rawDefinitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
const definitions=rawDefinitions;const header=definitions.match(/function sprite113\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),283.3-Number(header[2])];
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All450 source main frames,784 valid partial assignments, all4 complete pair permutations,15 drags, Help449 and feedback. Independent raw source placements supply exact native/software matrices and paired destination coordinates; paired frame2 moves original tokens and fixed targets reveal authored text. No generated projector reused or ActionScript/Adobe runtime executed.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.evaluate(()=>document.getElementById('source').getContext('2d',{willReadFrequently:true}));
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+`
var rawSourcePlace=place,sourceChildren=[];
place=function(obj,canvas,ctx,matrix,ct,b,f,r,t){
 if(['sprite53','sprite54','sprite55','sprite56','sprite58','sprite59','sprite60','sprite61','sprite62','sprite63','sprite64','sprite65','sprite66','sprite67','sprite68','sprite69','sprite70','sprite71','sprite72','sprite73','sprite74','sprite79','sprite80','sprite99','sprite108','sprite103'].includes(obj)){var native=ctx.getTransform();sourceChildren.push({obj,matrix:matrix.slice(),parentNative:[native.a,native.b,native.c,native.d,native.e,native.f],parentSoftware:ctx._matrix.slice(),ct,b,f,r,t});return;}
 if(['sprite110','sprite112'].includes(obj))f=0;
 return rawSourcePlace(obj,canvas,ctx,matrix,ct,b,f,r,t);
};`});
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const blank={assignments:[],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 const capture=async(label,frame,interaction=null,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,internal,practice,blank})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   const s=interaction||blank;sourceChildren=[];ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite113(ctx,ctrans,frame-1,0,0);ctx.restore();
   ctx.save();ctx.transform(1,0,0,1,...offset);ctx.transform(1,0,0,1,...internal);
   for(const item of sourceChildren){
    const id=Number(item.obj.slice(6)),piece=practice.choices.find(c=>c.sourceCharacterId===id),targetChoice=practice.targets.find(t=>t.sourceCharacterId===id);
    let local=1,ct=item.ct,m=item.matrix.slice();
    if(piece){
     const assignment=s.assignments.find(a=>a.sourceIndex===piece.sourceIndex);
     if(assignment){
      if(!piece.paired)continue;
      const target=practice.targets.find(t=>t.targetIndex===assignment.targetIndex),sourceTarget=sourceChildren.find(c=>c.obj==='sprite'+target.sourceCharacterId);if(!sourceTarget)throw Error('missing authored paired target');
      m[4]=sourceTarget.matrix[4];m[5]=sourceTarget.matrix[5];local=2;
     }else if(s.drag?.index===piece.sourceIndex){m[4]+=s.drag.x;m[5]+=s.drag.y;}
    }
    if(targetChoice){if(targetChoice.paired||!s.assignments.some(a=>a.targetIndex===targetChoice.targetIndex))continue;ct=new cxform(ct.r_add,ct.g_add,ct.b_add,0,ct.r_mult,ct.g_mult,ct.b_mult,255);}
    if(id===99){if(!s.helpVisible)continue;local=1;}
    if(id===108){if(!s.wrongVisible)continue;local=s.wrongFrame;}
    if(id===103){if(s.correctFrame===1)continue;local=s.correctFrame;}
    ctx.save();ctx.setTransform(...item.parentNative);ctx._matrix=item.parentSoftware.slice();
    rawSourcePlace(item.obj,canvas,ctx,m,ct,item.b,local-1,item.r,item.t);ctx.restore();
   }
   ctx.restore();
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,internal:[Number(header[1]),Number(header[2])],practice:spec.practice,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-113');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 const complete=[1,2,3,4,5,6,7,8].map(n=>({sourceIndex:n,targetIndex:n}));
 for(let frame=1;frame<=450;frame++){await capture('main-'+frame,frame,null,[1,9,50,100,150,200,250,300,350,400,448,449,450].includes(frame));receipt.mainFrames++;}
 for(const [key,max]of [['wrongFrame',15],['coachFrame',20],['correctFrame',25]])for(let frame=2;frame<=max;frame++){
  await capture(key+'-'+frame,449,{...blank,[key]:frame,wrongVisible:key==='wrongFrame',assignments:key==='correctFrame'?complete:key==='coachFrame'?[{sourceIndex:2,targetIndex:4}]:[]},[2,Math.floor(max/2),max].includes(frame));receipt.dynamicStates++;
 }
 const valid=[];
 function enumerate(index,assignments){if(index===9){valid.push(assignments);return;}enumerate(index+1,assignments);for(const targetIndex of spec.practice.choices.find(c=>c.sourceIndex===index).permittedTargets){if(assignments.some(a=>a.targetIndex===targetIndex))continue;enumerate(index+1,[...assignments,{sourceIndex:index,targetIndex}]);}}
 enumerate(1,[]);assert.equal(valid.length,784);receipt.validAssignmentCount=valid.length;
 for(let i=0;i<valid.length;i++){
  const a=valid[i];await capture('assignment-'+i,449,{...blank,assignments:a},a.length===8||a.length===1&&[2,4,6,7].includes(a[0].sourceIndex));receipt.dynamicStates++;
 }
 const full=valid.filter(a=>a.length===8);assert.equal(full.length,4);receipt.fullPairPermutations=full;
 for(let i=0;i<full.length;i++){await capture('complete-'+i+'-main-450',450,{...blank,assignments:full[i]},true);receipt.dynamicStates++;}
 for(const [n,a]of [[],[{sourceIndex:2,targetIndex:4}],[{sourceIndex:7,targetIndex:6}],[{sourceIndex:2,targetIndex:2},{sourceIndex:4,targetIndex:4},{sourceIndex:7,targetIndex:7}]].entries()){
  await capture('help-'+n,449,{...blank,assignments:a,helpVisible:true},true);receipt.dynamicStates++;
 }
 for(let index=1;index<=15;index++)for(const [x,y]of [[70.25,-24.5],[-20,150]]){
  await capture(`drag-${index}-${x}`,449,{...blank,inputEnabled:true,selectedIndex:index,drag:{index,x,y}},true);receipt.dynamicStates++;
 }
 receipt.rejectedStates=await page.evaluate(({id,blank})=>[
  {frame:449,state:{...blank,assignments:[{sourceIndex:9,targetIndex:1}]}},
  {frame:449,state:{...blank,assignments:[{sourceIndex:2,targetIndex:6}]}},
  {frame:449,state:{...blank,assignments:[{sourceIndex:2,targetIndex:2},{sourceIndex:2,targetIndex:4}]}},
  {frame:449,state:{...blank,assignments:[{sourceIndex:2,targetIndex:2},{sourceIndex:4,targetIndex:2}]}},
  {frame:449,state:{...blank,assignments:[{sourceIndex:0,targetIndex:0}]}},
  {frame:449,state:{...blank,assignments:[{sourceIndex:1,targetIndex:0}]}},
  {frame:448,state:{...blank,helpVisible:true}},{frame:450,state:{...blank,helpVisible:true}},
  {frame:450,state:{...blank,inputEnabled:true}},{frame:449,state:{...blank,wrongVisible:true}},
  {frame:449,state:{...blank,wrongFrame:16,wrongVisible:true}},{frame:449,state:{...blank,correctFrame:26}},
  {frame:449,state:{...blank,coachFrame:21}},{frame:449,state:{...blank,inputEnabled:true,selectedIndex:1,drag:{index:2,x:0,y:0}}},
  {frame:449,state:{...blank,inputEnabled:true,selectedIndex:1,drag:{index:1,x:NaN,y:0}}},
  {frame:449,state:{...blank,inputEnabled:true,assignments:[{sourceIndex:2,targetIndex:4}],selectedIndex:2}}
 ].map(({frame,state})=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:state});return false;}catch{return true;}}),{id:ID,blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
