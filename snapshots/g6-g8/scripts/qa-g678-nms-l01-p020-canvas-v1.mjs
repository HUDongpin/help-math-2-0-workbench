import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p020-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p020-behavior-source-v1',OUT=TASK+'/nms-l01-p020-canvas-v1',ID='shared-nms002-l01-p020';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p020-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p020-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_114/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_114/canvas.js';
const spec=JSON.parse(await readFile(specPath)),paths=[runtime,specPath,rawPath,helperPath,'scripts/qa-g678-nms-l01-p020-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n'),definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));const header=definitions.match(/function sprite114\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),280.3-Number(header[2])];
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All570 raw main frames with source569 hidden-answer initialization; ten source questions and every1..20 frame of each of ten answer clips drawn independently from source placements and raw definitions. Device font geometry reconstructed from source fields. No generated projector reused by reference and no AS or original Flash runtime executed.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+`var rawSourcePlace=place;place=function(obj,canvas,ctx,matrix,ct,b,f,r,t){if(['sprite70','sprite75','sprite80','sprite83','sprite88','sprite93','sprite96','sprite101','sprite105','sprite109','sprite113'].includes(obj))return;return rawSourcePlace(obj,canvas,ctx,matrix,ct,b,f,r,t);};`});await page.evaluate(async()=>{await Promise.all(Object.keys(window).filter(k=>/^imageObj\d+$/.test(k)).map(k=>window[k].decode()));});
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const capture=async(label,frame,interaction,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,practice})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite114(ctx,ctrans,frame-1,0,0);ctx.restore();
   if(interaction){
    const problem=practice.problems[interaction.questionIndex],parts=problem.question.split('-'),negative=interaction.revealed&&problem.result<0,values=[parts[0],parts[1]+(interaction.revealed&&!negative?' '+problem.result:''),negative?String(-problem.result):''];
    ctx.save();ctx.transform(1,0,0,1,412.4,280.3);
    for(let i=0;i<3;i++){
     const field=practice.fields[i],t=field.sourceTransformTwips,x=i===2?(parts[1].length===4?272.5:289.5):t.transX/20;
     ctx.save();ctx.transform(.05,0,0,.05,x,t.transY/20);ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font='bold '+field.sourceFontHeightTwips+'px Arial, sans-serif';ctx.textAlign=field.sourceAlign===1?'right':'left';ctx.textBaseline='alphabetic';ctx.fillText(values[i],field.sourceAlign===1?field.boundsTwips.right-40:0,field.baselineTwips);ctx.restore();
    }
    if(negative){ctx.save();ctx.transform(.05,0,0,.05,parts[1].length===4?263.7:280.7,-68.9);sprite70(ctx,ctrans,0,0,0);ctx.restore();}
    if(interaction.revealed){const t=problem.sourcePlacement.transform;ctx.save();ctx.transform(.05,0,0,.05,t.transX/20,t.transY/20);window['sprite'+problem.answerCharacterId](ctx,ctrans,interaction.answerFrame-1,0,0);ctx.restore();}
    ctx.restore();
   }
   const compare=document.createElement('canvas');compare.width=800;compare.height=600;const cc=compare.getContext('2d',{willReadFrequently:true});cc.drawImage(target,0,0);const expected=ctx.getImageData(0,0,800,600).data,actual=cc.getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,practice:spec.practice});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-114');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let frame=1;frame<=570;frame++){await capture('main-'+frame,frame,null,[1,10,50,100,150,211,212,223,260,300,350,400,442,443,464,500,550,568,569,570].includes(frame));receipt.mainFrames++;}
 for(let questionIndex=0;questionIndex<10;questionIndex++){
  await capture('question-'+questionIndex,569,{questionIndex,revealed:false,answerFrame:1},true);receipt.dynamicStates++;
  for(let answerFrame=1;answerFrame<=20;answerFrame++){await capture(`answer-${questionIndex}-${answerFrame}`,569,{questionIndex,revealed:true,answerFrame},[2,19,20].includes(answerFrame));receipt.dynamicStates++;}
 }
 receipt.rejectedStates=await page.evaluate(id=>[{questionIndex:NaN,revealed:false,answerFrame:1},{questionIndex:10,revealed:false,answerFrame:1},{questionIndex:0,revealed:'yes',answerFrame:1},{questionIndex:0,revealed:true,answerFrame:21},{questionIndex:0,revealed:false,answerFrame:2}].map(interaction=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame:569,lang:'en',scenario:'source-static-frame',seed:0,interaction});return false;}catch{return true;}}),ID);assert.deepEqual(receipt.rejectedStates,[true,true,true,true,true]);assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
