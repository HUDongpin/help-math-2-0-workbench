#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, lstat, realpath} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {readFrozenGlossaryPackage, FROZEN_GLOSSARY_FREEZE} from '../apps/web/lib/g678-frozen16-glossary-authority.server.ts';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='http://127.0.0.1:3326';
assert.equal(process.argv[2],'--run');assert.match(process.argv[3]??'',/^v[1-9][0-9]*$/);assert.equal(process.argv.length,4);
const OUT=path.join(ROOT,`output/playwright/frozen16-glossary-late-controls-my-lesson-${process.argv[3]}`);
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=v=>JSON.stringify(v,null,2)+'\n';
async function binding(file){const absolute=path.resolve(ROOT,file),s=await lstat(absolute,{bigint:true});assert(s.isFile()&&s.nlink===1n&&await realpath(absolute)===absolute);const b=await readFile(absolute),after=await lstat(absolute,{bigint:true});for(const k of ['ino','dev','mtimeNs','size'])assert.equal(s[k],after[k]);return{path:absolute,bytes:b.length,sha256:sha(b)};}
const checked=spawnSync(process.execPath,['scripts/activate-g678-frozen16-glossary-registration.mjs','--check'],{cwd:ROOT,encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
const physical=readFrozenGlossaryPackage(ROOT),entries=physical.entries;
assert.equal(entries.length,8);assert.equal(entries.reduce((s,e)=>s+e.controls.length,0),41);
const critical=[...new Set([...physical.physicalPaths,'packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts',
 'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v4.activation.json',
 'apps/web/lib/g678-frozen16-glossary-authority.server.ts','apps/web/lib/g678-calibration-product-bridge.server.ts',
 'apps/web/components/animation-runtime.tsx','apps/web/components/descriptor-driven-whole-lesson-player.tsx',
 'apps/web/components/legacy-responsive-lesson-shell.tsx','apps/web/lib/load-animation-module.client.ts',
 'packages/demos/src/source-static-canvas-candidate.tsx','packages/demos/src/frozen-calibration-glossary-candidate.tsx',
 'packages/demos/src/runtime.ts','packages/demos/src/contract.ts','packages/demos/src/lesson-host-contract.ts',
 'apps/web/app/globals.css','scripts/qa-g678-frozen16-glossary-late-controls-my-lesson.mjs','scripts/run-g678-frozen16-glossary-preview.mjs'])];
const inputs=await Promise.all(critical.map(binding));
await mkdir(OUT);const save=(name,b)=>writeFile(path.join(OUT,name),b,{flag:'wx'});
await save('inputs.json',json(inputs));await save('runner.mjs',await readFile(fileURLToPath(import.meta.url)));
const started=Date.now(),records=[],networkErrors=[];
const evidence={artifactType:'frozen16-glossary-actual-my-lesson-functional-audit-v1',startedAt:new Date().toISOString(),freeze:FROZEN_GLOSSARY_FREEZE,inputs,
 scope:'Only original shared-geo001-l11-p030, seven glossary buttons first visible at source frame 1208 and 1319. English and Spanish, two responsive widths each; real clocks with longer source-evidenced waiting.',
 boundary:'Canvas and timing unchanged. Source button companions implement exact typed glossary requests. No fixture injection, clock replacement, seek, audio playback or human/Owner acceptance.',
 productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false,records,networkErrors};
const browser=await chromium.launch({headless:true});evidence.browser={version:browser.version(),executable:await binding(chromium.executablePath())};
async function shot(page,name){const b=await page.screenshot({fullPage:true});await save(name+'.png',b);return{path:path.join(OUT,name+'.png'),bytes:b.length,sha256:sha(b)};}
async function geometry(locator){await locator.scrollIntoViewIfNeeded();return locator.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{left:r.left,right:r.right,width:r.width,height:r.height,fontSize:parseFloat(s.fontSize),inViewport:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,hit:hit===n||n.contains(hit),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};});}
async function runCase(entry,locale,index){
 const name=String(index+1).padStart(2,'0')+'-'+entry.key+'-'+locale;
 const rec={name,id:entry.key,locale,status:'running',errors:[],warnings:[],requests:[],sourceAssetResponses:[],interactions:[],screenshots:[]};records.push(rec);
 const context=await browser.newContext({viewport:{width:locale==='en'?1440:390,height:locale==='en'?1000:844},reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage();
 page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(90000);
 const tasks=[];
 await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());const allowed=u.origin===BASE&&['GET','HEAD','POST'].includes(r.method())&&(/\/migration-status\/g678-calibration\/shared-[a-z0-9-]+$/.test(u.pathname)||u.pathname.startsWith('/_next/')||u.pathname.startsWith('/flash-assets/')||['/favicon.ico','/learning-theme-bootstrap.js','/__nextjs_original-stack-frames'].includes(u.pathname));rec.requests.push({url:r.url(),method:r.method(),allowed});if(!allowed){networkErrors.push(r.url());return route.abort();}return route.continue();});
 await context.routeWebSocket('**/*',socket=>{const u=new URL(socket.url());if(u.origin==='ws://127.0.0.1:3326'&&u.pathname.startsWith('/_next/'))socket.connectToServer();else{networkErrors.push(socket.url());socket.close();}});
 page.on('pageerror',e=>rec.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')rec.errors.push(m.text());if(m.type()==='warning')rec.warnings.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)rec.errors.push(`HTTP ${r.status()} ${r.url()}`);if(new URL(r.url()).pathname===entry.runtime.canvasRenderer.url)tasks.push(r.body().then(b=>rec.sourceAssetResponses.push({url:r.url(),bytes:b.length,sha256:sha(b)})).catch(e=>rec.errors.push(e.message)));});
 const stage=page.locator('.runtime-stage[data-animation-module="'+entry.key+'"]'),shell=page.locator('.runtime-shell'),controlSection=page.locator('[data-frozen-glossary-controls="'+entry.key+'"]');
 const frame=async()=>Number(await stage.getAttribute('data-flash-frame'));
 async function openAndCheck(control,width,checkHold=false){
  const def=entry.glossaryEntries.find(e=>e.id===control.entryId),button=controlSection.locator('[data-source-character-id="'+control.sourceCharacterId+'"]');
  assert.equal(await button.textContent(),control.labels[locale]);assert.equal(await button.getAttribute('data-source-key-attribute'),control.sourceKeyAttribute);assert(await button.isEnabled());
  const g=await geometry(button);assert(g.height>=44&&g.fontSize>=14&&g.inViewport&&g.hit&&g.documentWidth<=g.viewport,JSON.stringify(g));
  const before=await frame();await button.click();
  const dialog=page.locator('[role="dialog"][data-glossary-entry-id="'+control.entryId+'"]');await dialog.waitFor({state:'visible'});
  assert.equal(await dialog.getAttribute('data-source-sha256'),def.source[locale].sha256);
  assert.equal(await dialog.getAttribute('data-source-key-attribute'),control.sourceKeyAttribute);
  assert.equal(await dialog.getAttribute('data-glossary-storage'),'memory-only');
  assert.equal(await dialog.locator('h2').textContent(),def.labels[locale]);assert.equal(await dialog.locator('p').nth(1).textContent(),def.definitions[locale]);
  await page.waitForFunction(()=>document.querySelector('.runtime-shell')?.getAttribute('data-runtime-paused')==='true');
  const held=await frame();if(checkHold){await page.waitForTimeout(550);assert.equal(await frame(),held,'Glossary must pause source time');}
  const close=dialog.getByRole('button',{name:locale==='es'?'Cerrar y continuar':'Close and continue',exact:true});const cg=await geometry(close);assert(cg.inViewport&&cg.hit&&cg.documentWidth<=cg.viewport,JSON.stringify(cg));
  if(rec.screenshots.length<2||width===390&&rec.screenshots.length<4)rec.screenshots.push(await shot(page,name+'-'+width+'-dialog-'+control.sourceCharacterId+'-interaction-'+rec.interactions.length));
  await close.click();await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.querySelector('.runtime-shell')?.getAttribute('data-runtime-paused')==='false');
  rec.interactions.push({characterId:control.sourceCharacterId,entryId:control.entryId,width,before,held,after:await frame(),geometry:g,definitionSha256:sha(Buffer.from(def.definitions[locale])),source: def.source[locale]});
 }
 try{
  const response=await page.goto(`${BASE}/${locale}/migration-status/g678-calibration/${entry.key}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/\bnoindex\b/);
  await stage.waitFor();await page.locator('canvas[data-course-canvas="'+entry.key+'"][data-render-state="ready"]').waitFor({timeout:90000});
  rec.firstObservedReadyFrame=await frame();rec.host=await page.locator('[data-lesson-player]').evaluate(n=>Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])));assert.equal(rec.host['data-renderer-availability'],'registered');
  await controlSection.locator('button:enabled').first().waitFor({timeout:180000});assert.equal(await controlSection.getAttribute('data-companion-placement'),'portal');
  assert.equal(await controlSection.evaluate(n=>Boolean(n.closest('.runtime-stage'))),false);
  const firstId=Number(await controlSection.locator('button').first().getAttribute('data-source-character-id'));const first=entry.controls.find(c=>c.sourceCharacterId===firstId);
  await openAndCheck(first,locale==='en'?1440:390,true);
  const afterClose=await frame();if(afterClose<entry.runtime.frameCount-2)await page.waitForFunction(({id,after})=>Number(document.querySelector('.runtime-stage[data-animation-module="'+id+'"]')?.getAttribute('data-flash-frame'))>after,{id:entry.key,after:afterClose},{timeout:10000});
  await page.waitForFunction(({id,end})=>Number(document.querySelector('.runtime-stage[data-animation-module="'+id+'"]')?.getAttribute('data-flash-frame'))===end,{id:entry.key,end:entry.runtime.frameCount},{timeout:180000});
  rec.naturalEndFrame=await frame();rec.end=await shell.evaluate(n=>Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])));
  assert.equal(rec.end['data-runtime-playback-complete'],'true');assert.equal(Number(await controlSection.getAttribute('data-source-visible-control-count')),entry.controls.length);
  for(const width of locale==='en'?[1440,390]:[390,1440]){
   await page.setViewportSize({width,height:width===390?844:1000});
   for(const c of entry.controls)await openAndCheck(c,width);
   rec.screenshots.push(await shot(page,name+'-'+width+'-final'));
  }
  const replay=page.locator('[data-responsive-focus-key="replay"]:visible').first();const oldReplay=await shell.getAttribute('data-runtime-replay');await replay.click();
  // My Lesson Replay deliberately remounts AnimationRuntime. Its internal
  // counter starts at zero again, so verify the visible frame reset instead.
  await page.waitForFunction(({id})=>{const s=document.querySelector('.runtime-stage[data-animation-module="'+id+'"]');const f=Number(s?.getAttribute('data-flash-frame'));return Boolean(s)&&f>=1&&f<20&&document.querySelector('.runtime-shell')?.getAttribute('data-runtime-playback-complete')==='false';},{id:entry.key});
  rec.replay={old:oldReplay,current:await shell.getAttribute('data-runtime-replay'),frame:await frame()};
  await Promise.all(tasks);assert.equal(rec.sourceAssetResponses.length,1);assert.equal(rec.sourceAssetResponses[0].sha256,entry.runtime.canvasRenderer.sha256);assert.equal(rec.sourceAssetResponses[0].bytes,entry.runtime.canvasRenderer.bytes);
  assert.deepEqual(rec.errors,[]);assert.deepEqual(rec.warnings,[]);rec.status='passed';
 }catch(e){rec.status='failed';rec.failure=e.stack??String(e);rec.screenshots.push(await shot(page,name+'-failure').catch(()=>null));await save(name+'-failure.html',await page.content().catch(()=>''));}
 finally{await Promise.all(tasks);await context.close();await save(name+'.json',json(rec));console.log(JSON.stringify({case:index+1,total:2,id:entry.key,locale,status:rec.status,firstReady:rec.firstObservedReadyFrame,interactions:rec.interactions.length,failure:rec.failure?.split('\n')[0]}));}
}
try{const cases=entries.filter(e=>e.key==='shared-geo001-l11-p030').flatMap(e=>['en','es'].map(locale=>({entry:e,locale})));let next=0;await Promise.all([0,1].map(async()=>{while(next<cases.length){const i=next++,c=cases[i];await runCase(c.entry,c.locale,i);}}));}
finally{await browser.close();evidence.inputsUnchanged=JSON.stringify(await Promise.all(critical.map(binding)))===JSON.stringify(inputs);evidence.passed=records.filter(r=>r.status==='passed').length;evidence.status=records.length===2&&evidence.passed===2&&evidence.inputsUnchanged&&networkErrors.length===0?'passed':'failed';evidence.elapsedMs=Date.now()-started;await save('evidence.json',json(evidence));console.log(JSON.stringify({output:OUT,status:evidence.status,passed:evidence.passed,inputsUnchanged:evidence.inputsUnchanged}));if(evidence.status!=='passed')process.exitCode=1;}
