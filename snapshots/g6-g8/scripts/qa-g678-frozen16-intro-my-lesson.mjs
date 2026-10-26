#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {readFrozenGlossaryPackage,FROZEN_GLOSSARY_FREEZE} from '../apps/web/lib/g678-frozen16-continuous-audio-authority.server.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TASK='/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f';
assert.equal(process.argv[2],'--run');assert.match(process.argv[3]??'',/^v[1-9]\d*$/);assert.equal(process.argv.length,4);
const OUT=path.join(TASK,'frozen16-intro-my-lesson-'+process.argv[3]),BASE='http://127.0.0.1:3326';
const audit=JSON.parse(await readFile(path.join(TASK,'frozen16-intro-linkages-v1/receipt.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const bind=async p=>{const file=path.resolve(ROOT,p),b=await readFile(file);return{path:file,bytes:b.length,sha256:sha(b)};};
const packet=readFrozenGlossaryPackage(ROOT);
const paths=[...new Set([...packet.physicalPaths,...audit.inputBindings.map(b=>b.path),'packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts',fileURLToPath(import.meta.url)])];
const inputs=await Promise.all(paths.map(bind));await mkdir(OUT);
const save=(name,v)=>writeFile(path.join(OUT,name),typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});
await save('runner.mjs',await readFile(fileURLToPath(import.meta.url)));await save('inputs.json',inputs);
const records=[],browser=await chromium.launch({headless:true});
try{for(const row of audit.records)for(const locale of ['en','es']){
 const name=row.animationId+'-'+locale,rec={animationId:row.animationId,locale,status:'running',errors:[],requests:[],sourceResponses:[],screenshots:[]};records.push(rec);
 const ctx=await browser.newContext({viewport:{width:locale==='en'?1440:390,height:locale==='en'?1000:844},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(90000);
 const pending=[];
 await page.addInitScript(id=>{const nodes=new WeakMap(),events=[];Object.defineProperty(window,'__INTRO_PAINTS',{value:events});let index=0;
  new MutationObserver(()=>{const c=document.querySelector('canvas[data-course-canvas="'+id+'"][data-render-state="ready"]');if(!c)return;const f=Number(c.getAttribute('data-flash-frame'));if(!nodes.has(c)){nodes.set(c,++index);events.push({kind:'first',index,frame:f,at:performance.now()});}const last=events.at(-1);if(last?.frame!==f)events.push({kind:'frame',index:nodes.get(c),frame:f,at:performance.now()});}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-render-state','data-flash-frame']});
 },row.animationId);
 await ctx.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());const allowed=url.origin===BASE&&['GET','HEAD','POST'].includes(req.method())&&(url.pathname.startsWith('/_next/')||url.pathname.startsWith('/flash-assets/')||/^\/(en|es)\/migration-status\/g678-calibration\/shared-[a-z0-9-]+$/.test(url.pathname)||['/favicon.ico','/learning-theme-bootstrap.js','/__nextjs_original-stack-frames'].includes(url.pathname));rec.requests.push({url:req.url(),allowed});if(!allowed)return route.abort();if(locale==='en'&&url.pathname===`/flash-assets/g678-local/${row.animationId}/canvas-renderer.js`)await new Promise(r=>setTimeout(r,2500));await route.continue();});
 page.on('pageerror',e=>rec.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')rec.errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)rec.errors.push(`HTTP ${r.status()} ${r.url()}`);if(new URL(r.url()).pathname===`/flash-assets/g678-local/${row.animationId}/canvas-renderer.js`)pending.push(r.body().then(b=>rec.sourceResponses.push({bytes:b.length,sha256:sha(b)})));});
 const lastFrame=row.audio.segments[0].lastBlockFrame;
 try{
  const res=await page.goto(BASE+'/'+locale+'/migration-status/g678-calibration/'+row.animationId,{waitUntil:'domcontentloaded'});assert.equal(res.status(),200);
  const canvas=page.locator(`canvas[data-course-canvas="${row.animationId}"]`);await canvas.waitFor();
  await page.waitForFunction(({id,last})=>document.querySelector(`canvas[data-course-canvas="${id}"]`)?.getAttribute('data-flash-frame')===String(last),{id:row.animationId,last:lastFrame});
  rec.naturalEndFrame=Number(await canvas.getAttribute('data-flash-frame'));const b=await page.screenshot({fullPage:true}),file=name+'-end.png';await save(file,b);rec.screenshots.push(await bind(path.join(OUT,file)));
  const replay=page.locator('[data-responsive-focus-key="replay"]:visible').first();await replay.click();
  await page.waitForFunction(()=>window.__INTRO_PAINTS.filter(e=>e.kind==='first').length>=2);await page.waitForTimeout(300);
  rec.paints=await page.evaluate(()=>window.__INTRO_PAINTS);rec.firstPaints=rec.paints.filter(e=>e.kind==='first');
  await pending.reduce((p,x)=>p.then(()=>x),Promise.resolve());
  assert.deepEqual(rec.errors,[]);assert(rec.requests.every(r=>r.allowed));assert(rec.sourceResponses.every(r=>r.bytes===row.canvas.bytes&&r.sha256===row.canvas.sha256));assert(rec.sourceResponses.length>0);
  rec.functionalStatus='passed';rec.openingFrameStatus=rec.firstPaints.length===2&&rec.firstPaints.every(p=>p.frame===1)?'passed':'failed';rec.status=rec.openingFrameStatus==='passed'?'passed':'failed-opening-frame';
 }catch(e){rec.status='failed';rec.failure=e.stack??String(e);}
 finally{await Promise.all(pending);await ctx.close();await save(name+'.json',rec);console.log(JSON.stringify({name,status:rec.status,firstPaints:rec.firstPaints,failure:rec.failure?.split('\n')[0]}));}
}}finally{await browser.close();const inputsUnchanged=JSON.stringify(await Promise.all(paths.map(bind)))===JSON.stringify(inputs);const evidence={scope:'Original three intro pages; actual v8 My Lesson renderer, no audio implementation, English source with English/Spanish host UI; 2500ms Canvas delay in English cases.',freeze:FROZEN_GLOSSARY_FREEZE,inputs,inputsUnchanged,records,status:records.length===6&&records.every(r=>r.status==='passed')&&inputsUnchanged?'passed':'failed',productCalibrationPassed:false,audioAccepted:false,originalRuntimeAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,scaleOutAuthorized:false};await save('receipt.json',evidence);console.log(JSON.stringify({output:OUT,status:evidence.status,inputsUnchanged}));if(evidence.status!=='passed')process.exitCode=1;}
