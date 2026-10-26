import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {ROOT,pin,encode} from './lib/g678-nms-l01-p037-generator-v1.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=TASK+'/nms-l01-p037-behavior-source-v1',OUT=TASK+'/nms-l01-p037-canvas-v1',ID='shared-nms002-l01-p037';
const runtime=path.join(ROOT,'work/g678-shared-page-factory/g678-nms-l01-p037-current-js-v1/members',ID,'canvas-renderer.js'),specPath=TASK+'/nms-l01-p037-source-spec-v1.json',rawPath=B+'/source/canvas/sprites/DefineSprite_636/frames.html',helperPath=B+'/source/canvas/sprites/DefineSprite_636/canvas.js';
const spec=JSON.parse(await readFile(specPath)),paths=[runtime,specPath,rawPath,helperPath,'scripts/qa-g678-nms-l01-p037-canvas-v1.mjs'].map(p=>path.resolve(ROOT,p)),bind=()=>Promise.all(paths.map(async p=>pin(p,await readFile(p)))),inputs=await bind();
const html=(await readFile(rawPath,'utf8')).replace(/\r\n?/gu,'\n');let definitions=html.slice(html.indexOf('var scalingGrids = {};'),html.indexOf('\nvar frame = -1;'));
// Independent, explicit source mask coverage qualification. No production normalizer/projector imported.
for(const [id,fill]of [[26,'ctx.fillStyle=tocolor(ctrans.apply([51,0,255,1]));'],[473,'ctx.fillStyle=tocolor(ctrans.apply([1,199,248,0.47058824]));'],[574,'ctx.fillStyle=tocolor(ctrans.apply([255,255,255,0.2]));']]){
 const start=definitions.indexOf(`function shape${id}(`),end=definitions.indexOf('\n}',start)+2,raw=definitions.slice(start,end);assert(raw.includes(fill)&&!raw.includes('stroke'));definitions=definitions.slice(0,start)+raw.replace(fill,'ctx.fillStyle="rgba(0,0,0,1)";')+definitions.slice(end);
}
const header=definitions.match(/function sprite636\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);/u);assert(header);const offset=[412.4-Number(header[1]),283.3-Number(header[2])];
const images=[...definitions.matchAll(/var (imageObj\d+) = document.createElement\("img"\);/gu)].map(m=>m[1]);assert.equal(images.length,2);
await mkdir(OUT);const receipt={schemaVersion:1,animationId:ID,status:'running',scope:'All601 raw main frames;101 hover positions;14 correct tableaux and arrow motion;14 wrong texts at every15 source feedback frames;13 next-play tableaux; independent111frame child635 after main601. Source definitions and explicit semantic policies independently redraw source-native matrices, source device-field bounds with declared Arial product fallback, exclusive-mask coverage and79 dynamic duplicate sites. No generated projector reused. No ActionScript or Adobe runtime executed.',inputs,mainFrames:0,dynamicStates:0,pixelComparisons:[],screenshots:[],errors:[],originalRuntimeAccepted:false,audioAccepted:false,originalDeviceFontMetricsAccepted:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});await page.route('**/*',r=>{receipt.errors.push('unexpected:'+r.request().url());return r.abort();});page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))receipt.errors.push(m.text());});
 await page.setContent('<body style="margin:0"><canvas id="source" width="800" height="600"></canvas><canvas id="myCanvas" width="800" height="600" style="display:none"></canvas></body>');
 await page.evaluate(()=>document.getElementById('source').getContext('2d',{willReadFrequently:true}));
 await page.addScriptTag({path:helperPath});await page.addScriptTag({content:'var canvas=document.getElementById("myCanvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});enhanceContext(ctx);var ctrans=new cxform(0,0,0,0,255,255,255,255);'+definitions+`
var rawSourcePlace=place,referenceState=null,referencePractice=null,referenceMain=1;
place=function(obj,canvas,ctx,matrix,ct,b,f,r,t){
 const s=referenceState,p=referencePractice,id=Number(obj.replace(/^[a-z]+/,''));
 if(obj==='sprite635')f=s.endChildFrame-1;
 if(['sprite524','sprite527','sprite573'].includes(obj))f=0;
 if(referenceMain===596){
  const picture=p.correctPictures.find(c=>c.sourceCharacterId===id);if(picture&&picture.play!==s.correctPicture)return;
  if(id===532||id===569)return;
  if([426,429,432].includes(id)){const site=p.clickSites.find(c=>c.origin==='original'&&c.sourceCharacterId===id&&Math.abs(c.sourceX-matrix[4])<1e-6&&Math.abs(c.sourceY-matrix[5])<1e-6);if(!site)throw new Error('REFERENCE_SITE_UNBOUND');f=s.hoverIndex===site.clickIndex?1:0;}
  if(id===565)f=s.nextEnabled?1:0;
 }
 if(referenceMain===597){if(id===532)return;if([426,429,432,565].includes(id))f=0;}
 return rawSourcePlace(obj,canvas,ctx,matrix,ct,b,f,r,t);
};
function referenceText(c,ct,id){
 const p=referencePractice,s=referenceState,d=p.deviceFields.find(f=>f.sourceCharacterId===id),row=p.rows[s.roundIndex];
 let value;if(id===529)value=row.question;else if(id===530)value=row.expression+(s.correctPicture===row.play?row.answer:'?');else if(id===568)value=row.wrongFeedback;else value=s.correctPicture?p.rows[s.correctPicture-1].answer:0;
 const bounds=d.sourceBoundsTwips,h=d.sourceFontHeightTwips,width=bounds.right-bounds.left-80,lines=[];c.save();c.beginPath();c.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);c.clip();
 c.font=[d.sourceBold?'bold':null,h+'px','Arial, sans-serif'].filter(Boolean).join(' ');c.textBaseline='alphabetic';c.textAlign=['left','right','center'][d.sourceAlign];c.fillStyle=tocolor(ct.apply([+d.color.red,+d.color.green,+d.color.blue,+d.color.alpha/255]));
 const x=d.sourceAlign===2?(bounds.left+bounds.right)/2:d.sourceAlign===1?bounds.right-40:bounds.left+40;let y=bounds.top+40+h;
 if(d.wordWrap){let line='';for(const word of String(value).split(' ')){const candidate=[line,word].filter(Boolean).join(' ');if(line&&c.measureText(candidate).width>width){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);for(const line of lines){c.fillText(line,x,y);y+=h+d.leadingTwips;}}
 else c.fillText(String(value),x,y,width);c.restore();
}
text529=(c,ct)=>referenceText(c,ct,529);text530=(c,ct)=>referenceText(c,ct,530);text531=(c,ct)=>referenceText(c,ct,531);text568=(c,ct)=>referenceText(c,ct,568);
`});
 await page.evaluate(async names=>{for(const name of names)await window[name].decode();},images);
 await page.addScriptTag({path:runtime});await page.evaluate(async id=>window.HELP_MATH_CANVAS_ASSETS[id].ready(),ID);
 const blank={roundIndex:0,solvedCount:0,correctPicture:0,hoverIndex:null,inputEnabled:false,startEnabled:false,skipEnabled:false,nextEnabled:false,wrongVisible:false,wrongFrame:1,arrowFrame:1,counterFrame:1,endChildFrame:1};
 const capture=async(label,frame,interaction=null,shot=false)=>{
  const row=await page.evaluate(({ID,label,frame,interaction,offset,internal,practice,blank})=>{
   const target=document.getElementById('source'),asset=window.HELP_MATH_CANVAS_ASSETS[ID],state=asset.render(target,{frame,scenario:'source-static-frame',lang:'en',seed:0,...(interaction?{interaction}:{})});
   const s=interaction||{...blank,endChildFrame:Math.max(1,frame-597)};referenceState=s;referencePractice=practice;referenceMain=frame;
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8d8f7';ctx.fillRect(0,0,800,600);ctx.save();ctx.transform(1,0,0,1,...offset);sprite636(ctx,ctrans,frame-1,0,0);ctx.restore();
   if(frame===596){
    ctx.save();ctx.transform(1,0,0,1,...offset);ctx.transform(1,0,0,1,...internal);
    const layers=practice.clickSites.filter(c=>c.origin!=='original').map(c=>({d:c.sourceDrawOrderDepth,site:c}));layers.push({d:1280,arrow:true});if(s.wrongVisible)layers.push({d:1282,wrong:true});layers.sort((a,b)=>a.d-b.d);
    for(const layer of layers){let id,x,y,f=0;if(layer.site){const c=layer.site;id=c.sourceCharacterId;x=c.sourceX;y=c.sourceY;f=c.clickIndex===s.hoverIndex?1:0;}else if(layer.arrow){id=532;const yard=s.correctPicture?practice.rows[s.correctPicture-1].answer:0;x=practice.clickSites.find(c=>c.lineNumber===yard).sourceX-(s.correctPicture?1:0);y=+practice.arrow.placement.transform.transY/20;f=s.arrowFrame-1;}else{id=569;x=+practice.wrong.placement.transform.transX/20;y=+practice.wrong.placement.transform.transY/20;f=s.wrongFrame-1;}
     rawSourcePlace('sprite'+id,canvas,ctx,[.05,0,0,.05,x,y],ctrans,1,f,0,0);
    }
    ctx.restore();
   }
   const expected=ctx.getImageData(0,0,800,600).data,actual=target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,800,600).data;let differentChannels=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differentChannels++;
   return {label,frame,domain:state.frameDomain,localFrame:state.localFrame,domFrame:target.dataset.flashFrame,differentChannels};
  },{ID,label,frame,interaction,offset,internal:[Number(header[1]),Number(header[2])],practice:spec.practice,blank});
  if(row.differentChannels){await page.locator('#source').screenshot({path:OUT+'/failed-actual.png'});await page.evaluate(()=>{document.getElementById('source').style.display='none';document.getElementById('myCanvas').style.display='block';});await page.locator('#myCanvas').screenshot({path:OUT+'/failed-expected.png'});}
  assert.equal(row.domain,'sprite-636');assert.equal(row.localFrame,frame);assert.equal(row.domFrame,String(frame));assert.equal(row.differentChannels,0,label);receipt.pixelComparisons.push(row);
  if(shot){const p=path.join(OUT,label+'.png');await page.locator('#source').screenshot({path:p});receipt.screenshots.push(pin(p,await readFile(p)));}
 };
 for(let frame=1;frame<=601;frame++){await capture('main-'+frame,frame,null,[1,2,82,100,200,229,300,400,500,594,595,596,597,598,601].includes(frame));receipt.mainFrames++;if(frame%100===0)console.log('main',frame);}
 for(let hoverIndex=1;hoverIndex<=101;hoverIndex++){await capture('hover-'+hoverIndex,596,{...blank,inputEnabled:true,hoverIndex},[1,21,101].includes(hoverIndex));receipt.dynamicStates++;}
 for(let roundIndex=0;roundIndex<14;roundIndex++){
  const base={...blank,roundIndex,solvedCount:roundIndex,correctPicture:roundIndex};
  if(roundIndex){await capture('next-question-'+(roundIndex+1),596,{...base,inputEnabled:true},true);receipt.dynamicStates++;}
  for(let wrongFrame=1;wrongFrame<=15;wrongFrame++){await capture(`wrong-${roundIndex+1}-${wrongFrame}`,596,{...base,wrongVisible:true,wrongFrame},[1,2,15].includes(wrongFrame)&&[0,1,12,13].includes(roundIndex));receipt.dynamicStates++;}
  for(let arrowFrame=1;arrowFrame<=6;arrowFrame++){await capture(`correct-${roundIndex+1}-${arrowFrame}`,596,{...base,solvedCount:roundIndex+1,correctPicture:roundIndex+1,arrowFrame,nextEnabled:arrowFrame===1&&roundIndex<13},arrowFrame===1);receipt.dynamicStates++;}
 }
 for(let endChildFrame=1;endChildFrame<=111;endChildFrame++){await capture('celebration-'+endChildFrame,601,{...blank,roundIndex:13,solvedCount:14,correctPicture:14,endChildFrame},[1,4,6,30,60,90,111].includes(endChildFrame));receipt.dynamicStates++;}
 receipt.rejectedStates=await page.evaluate(({id,b})=>[
  [596,{roundIndex:-1}],[596,{roundIndex:14}],[596,{solvedCount:15}],[596,{correctPicture:15}],[596,{solvedCount:1}],
  [596,{inputEnabled:true,hoverIndex:0}],[596,{inputEnabled:true,hoverIndex:102}],[596,{hoverIndex:21}],
  [595,{inputEnabled:true}],[594,{startEnabled:true}],[595,{skipEnabled:true}],[81,{skipEnabled:true}],[597,{wrongVisible:true}],
  [596,{wrongFrame:16}],[596,{arrowFrame:7}],[596,{counterFrame:21}],[601,{endChildFrame:112}],
  [596,{inputEnabled:true,wrongVisible:true}],[596,{inputEnabled:true,counterFrame:2}],[596,{nextEnabled:true}],
 ].map(([frame,changes])=>{try{window.HELP_MATH_CANVAS_ASSETS[id].render(document.getElementById('source'),{frame,lang:'en',scenario:'source-static-frame',seed:0,interaction:{...b,...changes}});return false;}catch{return true;}}),{id:ID,b:blank});
 assert(receipt.rejectedStates.every(Boolean));assert.deepEqual(receipt.errors,[]);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}
finally{await browser.close();receipt.inputsUnchanged=JSON.stringify(await bind())===JSON.stringify(inputs);if(!receipt.inputsUnchanged){receipt.status='failed';process.exitCode=1;}await writeFile(OUT+'/receipt.json',encode(receipt),{flag:'wx'});console.log(encode({out:OUT,status:receipt.status,frames:receipt.mainFrames,dynamicStates:receipt.dynamicStates,comparisons:receipt.pixelComparisons.length,screenshots:receipt.screenshots.length,failure:receipt.failure}));}
