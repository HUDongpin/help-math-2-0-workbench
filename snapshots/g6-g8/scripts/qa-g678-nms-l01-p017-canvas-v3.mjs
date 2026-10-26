import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p017-generator-v2.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p017-behavior-source-v1',OUT=TASK+'/nms-l01-p017-canvas-v3',ID='shared-nms002-l01-p017';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p017-current-js-v2/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p017-source-spec-v2.json',rawPath=B+'/source/canvas/sprites/DefineSprite_62/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_62/canvas.js';
const paths=[runtime,specPath,rawPath,helperPath,'scripts/qa-g678-nms-l01-p017-canvas-v3.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));const header=definitions.match(/function sprite62\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),280.3-Number(header[2])];for(const oid of [5,54]){const a=definitions.indexOf('function shape'+oid+'('),z=definitions.indexOf('\n}',a)+2,mask=definitions.slice(a,z),fill=mask.match(/ctx.fillStyle=[^\n]+/u)[0];assert.equal((mask.match(/ctx.fillStyle=/gu)||[]).length,1);definitions=definitions.slice(0,a)+mask.replace(fill,'ctx.fillStyle="rgba(0,0,0,1)";')+definitions.slice(z);}

await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'Every generated source frame compared with independently placed static FFDec drawing; source exclusive-mask alpha semantics normalized in each. No original ActionScript or Flash runtime executed.',inputs,mainFrames:0,pixelComparisons:[],screenshots:[],errors:[],registrationAssessed:false,registrationScope:"Drawing comparison only; product registration verified separately",originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions});await page.addScriptTag({path:runtime});await page.evaluate(id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const snapshots=[1,3,5,38,69,148,172,205,240,275,296,301,309,318,319,328,332,337,379,381,391,397,488,489,532,565,646];
 for(let frame=1;frame<=646;frame++){
  const row=await page.evaluate(({ID,frame,offset})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0});ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite62(ctx,ctrans,frame-1,0,0);ctx.restore();
   const compare=document.createElement('canvas');compare.width=800;compare.height=600;const cc=compare.getContext('2d',{willReadFrequently:true});cc.drawImage(target,0,0);const expected=ctx.getImageData(0,0,800,600).data,actual=cc.getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,frame,offset});assert.equal(row.domain,'sprite-62');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,`frame${frame}`);receipt.mainFrames++;receipt.pixelComparisons.push(row);
  if(snapshots.includes(frame)){const p=path.join(OUT,`frame-${frame}.png`);await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(error){receipt.status='failed';receipt.failure=error.stack;process.exitCode=1;}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
