import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p019-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p019-behavior-source-v1',OUT=TASK+'/nms-l01-p019-canvas-v4',ID='shared-nms002-l01-p019';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p019-current-js-v2/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p019-source-spec-v2.json',rawPath=B+'/source/canvas/sprites/DefineSprite_71/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_71/canvas.js';
const spec=JSON.parse(await readFile(specPath)),eventPath=B+'/source-placement-events-v1.json',events=JSON.parse(await readFile(eventPath)).events;
const paths=[runtime,specPath,rawPath,helperPath,eventPath,'scripts/qa-g678-nms-l01-p019-canvas-v4.mjs',...spec.practice.libraries.map(l=>l.framesHtml.path)].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));const header=definitions.match(/function sprite71\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),280.3-Number(header[2])];
for(const oid of [42,53]){const a=definitions.indexOf('function shape'+oid+'('),z=definitions.indexOf('\n}',a)+2,mask=definitions.slice(a,z),fill=mask.match(/ctx.fillStyle=[^\n]+/u)[0];assert.equal((mask.match(/ctx.fillStyle=/gu)||[]).length,1);definitions=definitions.slice(0,a)+mask.replace(fill,'ctx.fillStyle="rgba(0,0,0,1)";')+definitions.slice(z);}
// Load raw additional definitions without invoking any source ActionScript or generated projector.
const rawFunctions=new Map([...html.matchAll(/^(function ((?:shape|sprite|morphshape|text|button|font)\d+)\([^\n]*\)\{[\s\S]*?^\})/gmu)].map(m=>[m[2],m[1]]));
let libraryDefinitions='';for(const l of spec.practice.libraries){const source=(await readFile(l.framesHtml.path,'utf8')).replace(/\r\n?/gu,'\n');for(const m of source.matchAll(/^(function ((?:shape|sprite|morphshape|text|button|font)\d+)\([^\n]*\)\{[\s\S]*?^\})/gmu)){if(rawFunctions.has(m[2])){assert.equal(rawFunctions.get(m[2]),m[1]);continue;}rawFunctions.set(m[2],m[1]);libraryDefinitions+='\n'+m[1];}}
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All555 raw source timeline frames and independently reconstructed dynamic source child placements, device-font values and ActionScript drawing equations. No generated projection reused by reference drawing, no AS or original Flash runtime executed.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false};
const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+libraryDefinitions});await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const capture=async(label,frame,interaction,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,practice,events})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite71(ctx,ctrans,frame-1,0,0);ctx.restore();
   if(interaction){
    const {x1,x2,questionIndex,pressed}=interaction,a=Math.round(x1/30*6/3)+1,b=Math.round(x2/30*6/3)+1;
    ctx.save();ctx.transform(1,0,0,1,412.4,280.3);
    for(const field of practice.fields){
     const t=field.sourceTransformTwips,v=field.name==='txtQuestion'?practice.questions[questionIndex]:String(field.name==='txtSum'?a+b:field.name==='txtTopVal'?a:b);
     ctx.save();ctx.transform((t.scaleX??1)/20,0,0,(t.scaleY??1)/20,t.transX/20,t.transY/20);ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font=field.sourceFontHeightTwips+'px Arial, sans-serif';ctx.textAlign=field.sourceAlign===2?'center':'left';ctx.textBaseline='alphabetic';ctx.fillText(v,field.sourceAlign===2?(field.boundsTwips.left+field.boundsTwips.right)/2:0,field.baselineTwips);ctx.restore();
    }
    // Source attachMovie coordinates, then original child transforms/colors from swfmill.
    for(const h of [{id:'h2',oid:13,x:x1,y:-30,value:a},{id:'h4',oid:11,x:x2,y:47,value:b},{id:'h6',oid:16,x:x1,y:95,value:a},{id:'h8',oid:15,x:x1+x2+15,y:150,value:b}]){
     ctx.save();ctx.transform(1,0,0,1,h.x,h.y);
     for(const e of events[String(h.oid)]){
      const id=Number(e.objectID);if(id===14)continue;if((id===8||id===10)&&h.value===0)continue;
      const t=e.transform,mat=[(t.scaleX??1)/20,0,0,(t.scaleY??1)/20,Number(t.transX??0)/20,Number(t.transY??0)/20];
      if(id===8&&h.value<0){mat[0]=-.05;mat[3]=-.05;mat[4]=10;}
      const c=e.color,color=c?ctrans.merge(new cxform(Number(c.offsetRed??0),Number(c.offsetGreen??0),Number(c.offsetBlue??0),Number(c.offsetAlpha??0),Number(c.factorRed??256),Number(c.factorGreen??256),Number(c.factorBlue??256),Number(c.factorAlpha??256))):ctrans;
      let fn=[4,12].includes(id)?'button'+id:id===6?'text6':'sprite'+id;
      // Source button4/12 down records retain the same exported identity cxform256.
      const isPressed=[4,12].includes(id)&&pressed===h.id;if(isPressed)fn='shape2';
      place(fn,canvas,ctx,mat,isPressed?color.merge(new cxform(0,0,0,0,256,256,256,256)):color,1,0,0,0);
     }ctx.restore();
    }
    const lines=[[-15,-30,x1,-30,'#0000ff'],[-15,47,x2,47,'#ff0000'],[-15,95,x1,95,'#0000ff'],[x1,150,x1+x2+15,150,'#ff0000']];
    for(const [x,y,endX,endY,color]of lines){ctx.save();ctx.lineWidth=2;ctx.strokeStyle=color;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(endX,endY);ctx.stroke();ctx.restore();}ctx.restore();
   }
   const compare=document.createElement('canvas');compare.width=800;compare.height=600;const cc=compare.getContext('2d',{willReadFrequently:true});cc.drawImage(target,0,0);const expected=ctx.getImageData(0,0,800,600).data,actual=cc.getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,practice:spec.practice,events});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-71');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let frame=1;frame<=555;frame++){await capture('main-'+frame,frame,null,[1,7,109,110,139,188,189,207,282,283,300,353,371,424,466,482,552,553,555].includes(frame));receipt.mainFrames++;}
 const x=n=>Math.max(-308,Math.min(282,(n-1)*15));
 for(const a of [-20,-13,-4,0,2,4,13,20])for(const b of [-20,-6,-1,0,2,6,17,20]){await capture(`dynamic-${a}-${b}`,553,{x1:x(a),x2:x(b),questionIndex:4,pressed:null},[[-4,6],[0,0],[4,2],[-20,-20],[20,20]].some(p=>p[0]===a&&p[1]===b));receipt.dynamicStates++;}
 for(let q=0;q<10;q++){await capture('question-'+q,553,{x1:45,x2:15,questionIndex:q,pressed:null},q===9);receipt.dynamicStates++;}
 for(const x1 of [-308,-22.501,-22.5,-15,-7.501,-7.5,7.5,282])for(const pressed of ['h2','h4']){await capture('drag-'+x1+'-'+pressed,553,{x1,x2:-60,questionIndex:1,pressed},x1===-7.5&&pressed==='h2');receipt.dynamicStates++;}
 receipt.rejectedStates=await page.evaluate(id=>[{x1:NaN,x2:0,questionIndex:0,pressed:null},{x1:283,x2:0,questionIndex:0,pressed:null},{x1:0,x2:-309,questionIndex:0,pressed:null},{x1:0,x2:0,questionIndex:10,pressed:null},{x1:0,x2:0,questionIndex:0,pressed:'h6'}].map(interaction=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame:553,lang:'en',scenario:'source-static-frame',seed:0,interaction});return false;}catch{return true;}}),ID);assert.deepEqual(receipt.rejectedStates,[true,true,true,true,true]);
 assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
