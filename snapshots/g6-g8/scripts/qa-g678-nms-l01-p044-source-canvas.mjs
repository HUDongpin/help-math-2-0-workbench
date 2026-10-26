#!/usr/bin/env node
// Isolated drawing comparison only. No test or official AnimationRuntime mounted.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {file,GATES} from './g678-nms-l01-p044-extract-visual-slice.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),SELF='scripts/qa-g678-nms-l01-p044-source-canvas.mjs';
const GEN='packages/demos/src/generated/g678-nms-l01-p044-source-canvas-v1.ts',RUN='work/g678-shared-page-factory/g678-nms-l01-p044-source-canvas-v1';
const SHA='a2c12a7265bdc6f7df923abd966af471d05b36987b1deaa5baf521b8128bc80e';
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.argv.length,4);assert.equal(process.argv[2],'--run');assert.match(process.argv[3],/^[a-z0-9-]+$/);
const output=`output/playwright/g678-nms-l01-p044-source-canvas-${process.argv[3]}`;await mkdir(path.join(ROOT,output));
const save=(p,b)=>writeFile(path.join(ROOT,output,p),b,{flag:'wx'});
const receipt=JSON.parse(await readFile(`${RUN}/run.json`,'utf8'));assert.equal((await file(GEN)).sha256,SHA);
const inputPaths=[SELF,GEN,`${RUN}/raw-ffdec-probe.mjs`,`${RUN}/run.json`,...receipt.inputs.map(i=>i.path)];
const inputs=await Promise.all([...new Set(inputPaths)].map(file));for(const b of receipt.inputs)assert.deepEqual(await file(b.path),b);
await save('qa-runner-source.mjs',await readFile(SELF));
const evidence={schemaVersion:1,scope:'Isolated private exact-p044 drawing compiler comparison; no AnimationRuntime/host/MyLesson/registration claim.',inputs,records:[],requests:[],errors:[],screenshots:[],gates:GATES};
let browser,page;
const shot=async name=>{const b=await page.screenshot({fullPage:true});await save(name,b);evidence.screenshots.push({path:`${output}/${name}`,bytes:b.length,sha256:hash(b)});};
try {browser=await chromium.launch({headless:true});evidence.browser=browser.version();const context=await browser.newContext({viewport:{width:1660,height:760},serviceWorkers:'block'});
  await context.route('**/*',async r=>{const u=r.request().url();evidence.requests.push({scheme:u.split(':')[0],urlSha256:hash(u)});await r.abort();});
  page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());});
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"><style>body{margin:12px;font:16px system-ui;background:#eef2f7}main{display:flex;gap:12px}canvas{width:800px;height:600px;border:1px solid #345}h1{font-size:18px}</style></head><body><h1>Unregistered p044 source drawing comparison — not MyLesson or acceptance</h1><main><section><h2>Raw FFDec drawing functions</h2><canvas id="raw" width="800" height="600"></canvas></section><section><h2>Maintained exact-source adapter</h2><canvas id="maintained" width="800" height="600"></canvas></section></main></body></html>');
  const maintained=await readFile(GEN),raw=await readFile(`${RUN}/raw-ffdec-probe.mjs`);evidence.executedModules={maintained:{bytes:maintained.length,sha256:hash(maintained)},rawProbe:{bytes:raw.length,sha256:hash(raw)},method:'Verbatim bound source bytes imported as data: JavaScript modules; no rewritten/bundled duplicate saved.'};
  await page.evaluate(async({maintained,raw})=>{const a=await import(`data:text/javascript;base64,${maintained}`),b=await import(`data:text/javascript;base64,${raw}`);const p=document.querySelector('#maintained'),q=document.querySelector('#raw');window.p044qa={adapter:a.createP044SourceCanvasAdapter(p),raw:b.createP044RawCanvasProbe(q),p,q};await Promise.all([window.p044qa.adapter.ready(),window.p044qa.raw.ready()]);},{maintained:maintained.toString('base64'),raw:raw.toString('base64')});
  for(const frame of [1,2,3,6,7,8,12,20,70,71,72,73,76,77,120,240,311,312,449,575,697,737,756]){
    const result=await page.evaluate(frame=>{const{adapter,raw,p,q}=window.p044qa;const state=adapter.render({rootFrame:6,mainFrame:frame,instances:[]});raw.render(frame);const a=p.getContext('2d').getImageData(0,0,800,600).data,b=q.getContext('2d').getImageData(0,0,800,600).data;let differingBytes=0,maxChannelDifference=0;for(let i=0;i<a.length;i++){if(a[i]!==b[i])differingBytes++;maxChannelDifference=Math.max(maxChannelDifference,Math.abs(a[i]-b[i]));}return{frame,state,differingBytes,maxChannelDifference,actualGeometry:{width:p.getBoundingClientRect().width,height:p.getBoundingClientRect().height},rawPng:q.toDataURL('image/png'),maintainedPng:p.toDataURL('image/png')};},frame);
    const rawPng=Buffer.from(result.rawPng.split(',')[1],'base64'),maintainedPng=Buffer.from(result.maintainedPng.split(',')[1],'base64');delete result.rawPng;delete result.maintainedPng;result.rawPngSha256=hash(rawPng);result.maintainedPngSha256=hash(maintainedPng);evidence.records.push(result);
    assert.equal(result.differingBytes,0,`Raw-default pixel mismatch:${frame}`);if([1,7,20,70,71,312,737].includes(frame)){await save(`source-default-${frame}.png`,maintainedPng);evidence.screenshots.push({path:`${output}/source-default-${frame}.png`,bytes:maintainedPng.length,sha256:hash(maintainedPng)});}
  }
  await shot('raw-versus-maintained-final.png');
  // Raw737 has the unexecuted-AS popup over the answer controls. Hide that
  // exact source instance in BOTH baselines before testing button visibility.
evidence.overrideChecks=await page.evaluate(()=>{const{adapter,p}=window.p044qa,query={rootFrame:6,mainFrame:737,instances:[]},all=adapter.listInstances(query),choice=all.filter(c=>c.sourceObjectId===143&&c.path.length===2);const popup=all.find(c=>c.sourceObjectId===292&&c.path.length===2);query.instances=[{path:popup.path,frame:1,visible:false}];adapter.render(query);const before=p.toDataURL();const target={path:choice[0].path,frame:1,visible:false};adapter.render({...query,instances:[...query.instances,target]});const after=p.toDataURL();const changes=adapter.listInstances({...query,instances:[...query.instances,target]}).filter(c=>c.sourceObjectId===143&&c.path.length===2);let rejected=0;for(const instances of [[{...target,path:target.path.slice(1)}],[{...target,path:[target.path[0],{...target.path[1],placementFrame:738}]}],[{...target,frame:2}],[target,target]]){try{adapter.render({...query,instances:[...query.instances,...instances]});}catch{rejected++;}}adapter.render(query);return {comparisonFrame:737,baselinePopupHidden:true,paths:choice.map(c=>c.path),differentImageWhenOneHidden:before!==after,visibility:changes.map(c=>c.visible),negativeCasesRejected:rejected,defaultRestored:p.toDataURL()===before};});
  const xmlPath='work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v2/ffdec-source.xml';
  const xml=await readFile(xmlPath,'utf8');assert.equal(hash(xml),'3a3338eacd66b788cdda556128e0ff4715eb5647f3dfb16d1e5a2e0243d5a1fa');
  const button143=xml.match(/<item type="DefineButton2Tag" buttonId="143"[\s\S]*?<\/characters>/g);assert.equal(button143.length,1);
  const records143=[...button143[0].matchAll(/<item type="BUTTONRECORD"[^>]*>/g)].map(x=>x[0]);assert.equal(records143.length,1);
  for(const record of records143){assert.ok(record.includes('buttonStateHitTest="true"'));for(const key of ['Up','Over','Down'])assert.ok(record.includes('buttonState'+key+'="false"'));}
  evidence.hitOnlySourceProof={sourceXml:await file(xmlPath),buttonId:143,recordCount:1,hitTest:true,up:false,over:false,down:false};
  // The reused answer symbol is source hit-test-only. Hiding it must change
  // instance state without inventing visible ink or changing the default image.
  assert.equal(evidence.overrideChecks.differentImageWhenOneHidden,false);assert.deepEqual(evidence.overrideChecks.visibility,[false,true]);assert.equal(evidence.overrideChecks.negativeCasesRejected,4);assert.equal(evidence.overrideChecks.defaultRestored,true);
  evidence.visibleInkOverride=await page.evaluate(()=>{const{adapter,p}=window.p044qa,query={rootFrame:6,mainFrame:20,instances:[]};adapter.render(query);const before=p.toDataURL(),target=adapter.listInstances(query).find(c=>c.sourceObjectId===17&&c.path.length===2);if(!target)throw Error('Missing exact source question17');adapter.render({...query,instances:[{path:target.path,frame:1,visible:false}]});const different=p.toDataURL()!==before;adapter.render(query);return {path:target.path,visibleInkChanged:different,restored:p.toDataURL()===before};});
  assert.equal(evidence.visibleInkOverride.visibleInkChanged,true);assert.equal(evidence.visibleInkOverride.restored,true);
  assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.requests,[]);evidence.status='source-drawing-comparison-passed-not-candidate-behavior';
}catch(e){evidence.status='failed';evidence.failure={message:e.message,stack:e.stack};if(page)await shot('failed-state.png');process.exitCode=1;}
finally{if(browser)await browser.close();evidence.inputsAfter=await Promise.all([...new Set(inputPaths)].map(file));evidence.inputsUnchanged=JSON.stringify(evidence.inputsAfter)===JSON.stringify(inputs);assert.equal(evidence.inputsUnchanged,true);await save('evidence.json',`${JSON.stringify(evidence,null,2)}\n`);console.log(JSON.stringify({status:evidence.status,records:evidence.records.length,errors:evidence.errors,failure:evidence.failure,output,evidence:await file(`${output}/evidence.json`)},null,2));}
