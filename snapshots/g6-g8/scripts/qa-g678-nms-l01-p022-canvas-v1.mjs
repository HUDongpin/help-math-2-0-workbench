import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p022-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p022-behavior-source-v1',OUT=TASK+'/nms-l01-p022-canvas-v1',ID='shared-nms002-l01-p022';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p022-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p022-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_342/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_342/canvas.js';
const buttonReferencePath=B+'/source-button-states-reference-v1.json';const buttonReference=JSON.parse(await readFile(buttonReferencePath));const paths=[runtime,specPath,rawPath,helperPath,buttonReferencePath,B+'/source/source.xml','scripts/qa-g678-nms-l01-p022-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));const header=definitions.match(/function sprite342\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),280.3-Number(header[2])];for(const oid of [22]){const a=definitions.indexOf('function shape'+oid+'('),z=definitions.indexOf('\n}',a)+2,mask=definitions.slice(a,z),fill=mask.match(/ctx.fillStyle=[^\n]+/u)[0];assert.equal((mask.match(/ctx.fillStyle=/gu)||[]).length,1);definitions=definitions.slice(0,a)+mask.replace(fill,'ctx.fillStyle="rgba(0,0,0,1)";')+definitions.slice(z);}

const spec=JSON.parse(await readFile(specPath)),cards=spec.practice.cards,correct=cards.filter(c=>c.targetId!==null),origins=Object.fromEntries(cards.map(c=>[c.id,c.originTwips]));
const sourceProjection=`var probe={positions:${JSON.stringify(origins)},locked:[],popup:'none',feedbackFrame:1,rightFrame:1,coachFrame:1,closePressed:false};var expectedSourcePlace=place;
button330=function(ctx,ctrans,frame,ratio,time){const states=${JSON.stringify(buttonReference.states)};for(const r of states[frame]??[])expectedSourcePlace(r.object,canvas,ctx,r.matrix,ctrans.merge(new cxform(...r.color)),1,0,0,time);};
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 const drags=${JSON.stringify(Object.fromEntries(cards.map(c=>['sprite'+c.sourceCharacterId,c.id])))},targets=${JSON.stringify(Object.fromEntries(correct.map(c=>['sprite'+c.targetCharacterId,c.id])))};
 if(obj in drags){const id=drags[obj];if(probe.locked.includes(id))return;const p=probe.positions[id];matrix=matrix.slice();matrix[4]=p.x/20;matrix[5]=p.y/20;}
 if(obj in targets){if(!probe.locked.includes(targets[obj]))return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,ctrans.a_add,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,256);}
 if(['sprite129','sprite169','sprite210','sprite256','sprite320','sprite339'].includes(obj))frame=0;
 if(obj==='sprite333'){if(probe.popup!=='wrong')return;frame=probe.feedbackFrame-1;}
 if(obj==='sprite337')frame=probe.rightFrame-1;
 if(obj==='sprite341')frame=probe.coachFrame-1;
 if(obj==='button330')frame=probe.closePressed?2:0;
 return expectedSourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};`;
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All523 main frames,64 six-target subsets,16 moving cards, wrong333/correct337/coach341 states and real Button330 UP/DOWN reconstructed independently from raw source XML. Exclusive mask22 normalized. Source projector/helper not reused by reference; no AS or original Flash runtime executed.',inputs,mainFrames:0,subsetStates:0,movingStates:0,feedbackFrames:0,pixelComparisons:[],screenshots:[],errors:[],registrationAssessed:false,originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+sourceProjection});await page.addScriptTag({path:runtime});await page.evaluate(async id=>{await window.HELP_MATH_CANVAS_ASSETS[id].ready();await Promise.all(Object.keys(window).filter(k=>/^imageObj\d+$/.test(k)).map(k=>window[k].decode()));},ID);
 const capture=async(label,frame,interaction,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,interaction});probe=interaction;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite342(ctx,ctrans,frame-1,0,0);ctx.restore();
   const compare=document.createElement('canvas');compare.width=800;compare.height=600;const cc=compare.getContext('2d',{willReadFrequently:true});cc.drawImage(target,0,0);const expected=ctx.getImageData(0,0,800,600).data,actual=cc.getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset});assert.equal(row.domain,'sprite-342');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 const base=(locked=[])=>({positions:origins,locked,popup:'none',feedbackFrame:1,rightFrame:1,coachFrame:1,closePressed:false}),all=correct.map(c=>c.id);
 for(let frame=1;frame<=523;frame++){await capture('main-'+frame,frame,base(frame>480?all:[]),[1,6,9,30,50,67,68,92,93,100,150,160,200,300,400,478,479,480,481,490,523].includes(frame));receipt.mainFrames++;}
 for(let mask=0;mask<64;mask++){const locked=all.filter((_,i)=>mask&(1<<i));await capture('subset-'+mask,480,base(locked),[1,31,63].includes(mask));receipt.subsetStates++;}
 for(const c of cards){await capture('moving-'+c.id,480,{...base(),positions:{...origins,[c.id]:{x:origins[c.id].x-1600,y:origins[c.id].y+500}}},c.value===-6);receipt.movingStates++;}
 for(let frame=2;frame<=15;frame++){await capture('wrong-'+frame,480,{...base(all.slice(0,2)),popup:'wrong',feedbackFrame:frame},[2,15].includes(frame));receipt.feedbackFrames++;}
 for(let frame=2;frame<=25;frame++){await capture('right-'+frame,480,{...base(all),rightFrame:frame},[2,24,25].includes(frame));receipt.feedbackFrames++;}
 for(let frame=2;frame<=20;frame++){await capture('coach-'+frame,480,{...base(all.slice(0,2)),coachFrame:frame},[2,20].includes(frame));receipt.feedbackFrames++;}
 await capture('wrong-close-up',480,{...base(),popup:'wrong',feedbackFrame:5},true);const up=await page.locator('#source').screenshot();
 await capture('wrong-close-down',480,{...base(),popup:'wrong',feedbackFrame:5,closePressed:true},true);const down=await page.locator('#source').screenshot();assert(!up.equals(down),'source UP and DOWN must draw different pixels');receipt.realButtonStateDifference=true;
 receipt.rejectedStates=await page.evaluate(({ID,origins})=>{const b={positions:origins,locked:[],popup:'none',feedbackFrame:1,rightFrame:1,coachFrame:1,closePressed:false};return[{...b,locked:['Scr_7']},{...b,locked:['Scr_1','Scr_1']},{...b,popup:'help'},{...b,popup:'wrong',feedbackFrame:16},{...b,rightFrame:26},{...b,coachFrame:21},{...b,closePressed:true},{...b,positions:{}},{...b,rightFrame:2}].map(interaction=>{try{window.HELP_MATH_CANVAS_ASSETS[ID].render(document.getElementById('source'),{frame:480,lang:'en',scenario:'source-static-frame',seed:0,interaction});return false;}catch{return true;}});},{ID,origins});assert(receipt.rejectedStates.every(Boolean));
 assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(error){receipt.status='failed';receipt.failure=error.stack;process.exitCode=1;}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
