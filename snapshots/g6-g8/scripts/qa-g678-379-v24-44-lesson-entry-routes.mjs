#!/usr/bin/env node
// Exact 379 v4 successor of the retained 379 v2 entry runner; eight original glossary replacements. No earlier evidence is overwritten.
// Preparation alone never launches a browser; invocation requires exact activation pins.
// Entry-route audit only: no page traversal, source action, injected module,
// fake clock, product mutation, or acceptance promotion.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import ts from 'typescript';
import {G678_P042_AUTHORITY,G678_P042_BASE,G678_P042_READABLE,G678_P042_PREDECESSOR,
  readG678P042FileBinding,validateG678P042CompanionAuthority,validateG678P042PhysicalClosure}
  from '../apps/web/lib/g678-nms-l01-p042-companion-authority.server.ts';

import {G678_P044_AUTHORITY,G678_P044_CANDIDATE,G678_P044_FREEZE,G678_P044_GLOSSARY,G678_P044_PREDECESSOR,
  readG678P044FileBinding,validateG678P044Authority,validateG678P044PhysicalClosure}
  from '../apps/web/lib/g678-nms-l01-p044-authority.server.ts';

import {readG678P044RepairPackage,validateG678P044RepairAuthority,validateG678P044RepairPhysicalClosure} from '../apps/web/lib/g678-nms-l01-p044-live-clock-authority.server.ts';
import {readFrozenGlossaryPackage,FROZEN_GLOSSARY_IDS} from '../apps/web/lib/g678-frozen16-twelve-source-audio-v2-authority.server.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='http://127.0.0.1:3340';
export const APPROVED_REGISTRY='46adc0ee033b90c6338d6ad603d2457bbea6bfff2648a38940546af3daabc710';
export const APPROVED_ACTIVATION='b2a435b5740f6e1ff3e311ee33ccd1e38d157eeb91d932c25dead6253d237ca1';
const HOST='[data-lesson-player][data-current-animation-id]';
const STAGE=`${HOST} .runtime-stage[data-animation-module]`;
const FREEZE='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v24.json';
const FRAGMENT='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v24.fragment.json';
const ACTIVATION='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v24.activation.json';
const REGISTRY='packages/demos/private-current-js-registry.json';
const CATALOG='catalog/g678-shared-catalog.v1.json';
const PROFILE='catalog/g678-shared-source-profile.v1.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const readJson=async file=>JSON.parse(await readFile(path.resolve(ROOT,file),'utf8'));
async function binding(file){
  const absolute=path.resolve(ROOT,file),before=await lstat(absolute,{bigint:true});
  assert.ok(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n&&await realpath(absolute)===absolute,`Ordinary input required: ${file}`);
  const bytes=await readFile(absolute),after=await lstat(absolute,{bigint:true});
  for(const key of ['ino','dev','size','mtimeNs','mode','nlink'])assert.equal(before[key],after[key],`Read drift: ${file}`);
  return{path:file,bytes:bytes.length,sha256:sha(bytes)};
}
export function parse379EntryArgs(args){
  assert.ok(args.length===6&&args[0]==='--run'&&/^[a-z0-9-]+$/.test(args[1])&&args[2]==='--activated-registry-sha256'&&args[4]==='--activation-sha256','Exact --run/--activated-registry-sha256/--activation-sha256 arguments required');
  assert.equal(args[3],APPROVED_REGISTRY);assert.equal(args[5],APPROVED_ACTIVATION);return{run:args[1]};
}
export function build379EntrySelections({freeze,fragment,registry,catalog,activation}){
const calibration=registry.calibrations.find(c=>c.calibrationId===freeze.calibrationId);
assert.deepEqual(calibration,fragment.calibration);
assert.equal(activation.proposed.find(p=>p.path===REGISTRY).sha256,APPROVED_REGISTRY);
assert.equal(activation.registrationCount,379);assert.deepEqual(activation.changedIds,["shared-nms002-l11-p030"]);assert.equal(activation.preservedPageCount,378);assert.equal(activation.moduleEntriesChanged,1);assert.equal(activation.otherCalibrationsUnchanged,true);
assert.equal(activation.publicFilesWritten,0);assert.ok(Object.values(activation.acceptanceEffects).every(value=>value===false));
assert.equal(freeze.selectedPages.length,379);assert.equal(calibration.entries.length,379);
assert.equal(catalog.lessons.length,44);assert.equal(catalog.activePagePlacementCount,2282);
const sourcePages=new Map(catalog.lessons.flatMap(lesson=>lesson.pages.map(page=>[page.animationId,page])));
assert.equal(sourcePages.size,2282);
const registered=new Map(calibration.entries.map(entry=>[entry.key,entry]));
for(const page of freeze.selectedPages){
  const source=sourcePages.get(page.animationId);assert.ok(source);assert.ok(registered.has(page.animationId));
  for(const key of ['animationId','placementId','sourceSha256','assetId','stableLessonKey'])assert.equal(page[key],source[key]);
  assert.equal(page.globalPageOrdinal,source.globalOrdinal);
}
const selections=catalog.lessons.map(lesson=>{
  assert.equal(lesson.pages.length,lesson.activePageCount);
  assert.deepEqual(lesson.pages.map(page=>page.globalOrdinal),Array.from({length:lesson.activePageCount},(_,i)=>i+1));
  const pages=freeze.selectedPages.filter(page=>page.stableLessonKey===lesson.stableLessonKey).sort((a,b)=>a.globalPageOrdinal-b.globalPageOrdinal);
  assert.ok(pages.length>0,`No registered entry: ${lesson.stableLessonKey}`);
  return{stableLessonKey:lesson.stableLessonKey,moduleCode:lesson.moduleCode,titleEnglish:lesson.titleEnglish,
    activePageCount:lesson.activePageCount,registeredPageCount:pages.length,unavailablePageCount:lesson.activePageCount-pages.length,
    selected:pages[0],source:sourcePages.get(pages[0].animationId),
    orderedMap:lesson.pages.map(page=>({animationId:page.animationId,placementId:page.placementId,
      availability:registered.has(page.animationId)?'registered':'unavailable'}))};
});
assert.equal(selections.reduce((sum,item)=>sum+item.registeredPageCount,0),379);
assert.equal(selections.reduce((sum,item)=>sum+item.activePageCount,0),2282);
const completeLessons=selections.filter(item=>item.unavailablePageCount===0).map(item=>item.stableLessonKey);
assert.deepEqual(completeLessons,['shared-alg001-l09','shared-alg001-l11']);
assert.equal(selections.reduce((sum,item)=>sum+item.unavailablePageCount,0),1903);
const nms=selections.find(item=>item.stableLessonKey==='shared-nms002-l01');
assert.deepEqual([nms.activePageCount,nms.registeredPageCount,nms.unavailablePageCount],[47,12,35]);
assert.ok(selections.every(item=>item.selected.runtime.canvasRenderer),'All44 earliest entries must remain exact source Canvas');
return{selections,completeLessons,sourcePages,registered};
}

export async function run379EntryAudit(args){
const options=parse379EntryArgs(args);
const OUTPUT=`output/playwright/g678-379-v24-44-lesson-entry-routes-${options.run}`;
const critical=new Set(['apps/web/next.config.ts','apps/web/tests/g678-local-async-runtime-target.test.ts',FREEZE,FRAGMENT,ACTIVATION,REGISTRY,CATALOG,PROFILE,
  'scripts/qa-g678-379-v24-44-lesson-entry-routes.mjs','scripts/run-frozen16-twelve-source-audio-preview-v2.mjs',
  'apps/web/app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx',
  'apps/web/lib/g678-calibration-product-bridge.server.ts','apps/web/lib/g678-instructional-behavior-delta-authority.server.ts',
  'apps/web/lib/g678-math-companion-authority.server.ts','apps/web/lib/g678-nms-l01-p042-companion-authority.server.ts',
  'scripts/qa-g678-379-v2-44-lesson-entry-routes-v3.test.mjs',
  'apps/web/lib/g678-preview-policy.ts','apps/web/lib/g678-shared-course-catalog.server.ts','apps/web/lib/g678-local-runtime-asset.server.ts',
  'apps/web/lib/load-animation-module.client.ts','apps/web/lib/whole-lesson-player-descriptor.ts','apps/web/lib/whole-lesson-host-presentation.ts',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx','apps/web/components/legacy-responsive-lesson-shell.tsx',
  'apps/web/components/animation-runtime.tsx','apps/web/app/globals.css','apps/web/public/learning-theme-bootstrap.js',
  'apps/web/i18n/routing.ts','packages/demos/src/contract.ts','packages/demos/src/runtime.ts','packages/demos/src/lesson-host-contract.ts',
  'packages/demos/src/registry.generated.ts','packages/demos/src/registry.metadata.generated.ts',
  'packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts',
  'package.json','package-lock.json','packages/demos/package.json','apps/web/package.json']);
const pins=new Map([[FREEZE,'f2b6073d47c41e8b6d102b4a0598f88608669b0ec4ebfe6c2af73cdb54cb6a8c'],
  [FRAGMENT,'12f7018a7f1fc36e7f16662948a0c62908c24e84ddf90653d75e65d1c73db355'],
  [ACTIVATION,APPROVED_ACTIVATION],[REGISTRY,APPROVED_REGISTRY],
  [CATALOG,'a1692c2a86c6771dcb104f59195b5bfdd2b5281cceff0aaeb63a3aabcf4a5657'],
  [PROFILE,'46a0b496139cb1faef2c6401c309db1c3badde15f2291549458fa6572c84e88f'],
  ['apps/web/app/globals.css','2f8129887a8151d871484e4426e481c712048e44eeb73c94c68e9e21e025e2bc']]);
for(const[file,hash]of pins)assert.equal((await binding(file)).sha256,hash,`Approved input drift: ${file}`);
const[freeze,fragment,registry,catalog,activation]=await Promise.all([FREEZE,FRAGMENT,REGISTRY,CATALOG,ACTIVATION].map(readJson));
const{selections,completeLessons,sourcePages,registered}=build379EntrySelections({freeze,fragment,registry,catalog,activation});
const frozenGlossary=readFrozenGlossaryPackage(ROOT);
for(const file of frozenGlossary.physicalPaths)critical.add(file);
const p042Authority=validateG678P042CompanionAuthority({authority:readG678P042FileBinding(ROOT,G678_P042_AUTHORITY),
  baseCandidate:readG678P042FileBinding(ROOT,G678_P042_BASE),readableCandidate:readG678P042FileBinding(ROOT,G678_P042_READABLE),
  predecessorFreeze:readG678P042FileBinding(ROOT,G678_P042_PREDECESSOR),freeze:readG678P044FileBinding(ROOT,G678_P044_PREDECESSOR).value});
const p042PhysicalPaths=validateG678P042PhysicalClosure(ROOT,p042Authority);
assert.equal(p042PhysicalPaths.length,322,'Exact p042 canonical physical closure');
for(const file of p042PhysicalPaths)critical.add(file);
const p044Authority=validateG678P044RepairAuthority(readG678P044RepairPackage(ROOT));
for(const file of validateG678P044RepairPhysicalClosure(ROOT,p044Authority))critical.add(file);
const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;
assert.ok(sourceRoot&&path.isAbsolute(sourceRoot)&&await realpath(sourceRoot)===sourceRoot);
for(const item of selections){
  const entry=registered.get(item.selected.animationId),runtime=item.selected.runtime.canvasRenderer;
  assert.ok(runtime,'This frozen entry audit expects source Canvas, not a maintained DOM successor');
  assert.deepEqual(entry.artifacts.runtime,{path:runtime.path,bytes:runtime.bytes,sha256:runtime.sha256});
  for(const artifact of Object.values(entry.artifacts)){
    assert.deepEqual(await binding(artifact.path),artifact);critical.add(artifact.path);
  }
  const sourcePath=path.join(sourceRoot,item.source.viewPath),sourceBinding=await binding(sourcePath);
  assert.equal(sourceBinding.bytes,item.source.sourceBytes);assert.equal(sourceBinding.sha256,item.source.sourceSha256);
  assert.equal((await stat(sourcePath)).mode&0o222,0);critical.add(sourcePath);
}
// Bind static project import closure. Dynamic registry imports are deliberately
// not executed or expanded: the exact 44 selected module artifacts are roots.
const demosPackage=await readJson('packages/demos/package.json'),queue=[...critical],scanned=new Set(),externalImports=new Set();
async function resolveImport(from,specifier){
  let stem;
  if(specifier.startsWith('.'))stem=path.resolve(path.dirname(from),specifier);
  else if(specifier.startsWith('@/'))stem=path.join(ROOT,'apps/web',specifier.slice(2));
  else if(specifier==='@helpmath/demos'||specifier.startsWith('@helpmath/demos/')){
    const key=specifier==='@helpmath/demos'?'.':'./'+specifier.slice('@helpmath/demos/'.length);
    const target=demosPackage.exports[key];assert.ok(target,`Unresolved package export: ${specifier}`);
    stem=path.join(ROOT,'packages/demos',typeof target==='string'?target:target.import);
  }else{externalImports.add(specifier);return null;}
  const candidates=[stem,...['.ts','.tsx','.js','.mjs','.json'].map(ext=>stem+ext),path.join(stem,'index.ts'),path.join(stem,'index.tsx')];
  if(/\.js$/.test(stem))candidates.push(stem.slice(0,-3)+'.ts',stem.slice(0,-3)+'.tsx');
  for(const file of candidates)if(await stat(file).then(info=>info.isFile()).catch(()=>false))return path.relative(ROOT,file);
  throw Error(`Unresolved static project import ${specifier} from ${from}`);
}
while(queue.length){
  const file=queue.shift();if(scanned.has(file)||!/[.](?:[cm]?js|tsx?)$/.test(file)||path.isAbsolute(file))continue;
  scanned.add(file);assert.ok(scanned.size<1200,'Bounded static closure exceeded');
  const text=await readFile(path.join(ROOT,file),'utf8'),ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
  for(const statement of ast.statements)if((ts.isImportDeclaration(statement)||ts.isExportDeclaration(statement))&&statement.moduleSpecifier&&ts.isStringLiteral(statement.moduleSpecifier)){
    const dependency=await resolveImport(path.join(ROOT,file),statement.moduleSpecifier.text);
    if(dependency&&!critical.has(dependency)){critical.add(dependency);queue.push(dependency);}
  }
}
const inputFiles=[...critical].sort(),inputs=await Promise.all(inputFiles.map(binding));
for(const[file,hash]of pins)assert.equal(inputs.find(input=>input.path===file)?.sha256,hash,`Approved input changed during preparation: ${file}`);
await mkdir(path.join(ROOT,OUTPUT));
const save=(file,bytes)=>writeFile(path.join(ROOT,OUTPUT,file),bytes,{flag:'wx'});
await save('inputs.json',json(inputs));await save('entry-plan.json',json(selections));
await save('qa-runner-source.mjs',await readFile(fileURLToPath(import.meta.url)));
const records=[],network=[],errors=[],started=Date.now();
const evidence={artifactType:'g678-379-v24-44-lesson-actual-my-lesson-entry-route-audit-v1',generatedAt:new Date().toISOString(),
  baseUrl:BASE,inputs,staticImportClosure:{scannedProjectFiles:scanned.size,externalImports:[...externalImports].sort(),dynamicRegistryImports:'not-expanded-selected44-artifacts-separately-bound'},
  scope:'44 earliest registered lesson-entry routes only; no whole-lesson traversal or instructional action acceptance',
  selectionRule:'Source catalog lesson order; minimum registered globalPageOrdinal within each stableLessonKey',
  catalogLessonCount:44,catalogActivePageCount:2282,registeredPageCount:379,unregisteredPageCount:1903,
  p042PhysicalClosure:{canonicalFiles:p042PhysicalPaths.length,sourceAuthority:G678_P042_AUTHORITY},
  registeredCompleteLessonCount:completeLessons.length,registeredCompleteLessonIds:completeLessons,
  historicalProductCalibratedWholeLessonEngineeringPreviewCount:freeze.productHostCalibration.productCalibratedWholeLessonEngineeringPreviewCount,
  historicalWholeLessonPreviewRevalidated:false,wholeLessonCompletionAudited:false,fullInstructionalTimelineAudited:false,
  boundary:'Actual private registered loader, fresh browser context per lesson, reduced motion and real clocks; no fixture/module injection, arbitrary seek, provider or product writes.',
  records,network,errors,productCalibrationPassed:false,engineeringPreviewReady:false,authoritativeOriginalRuntime:false,
  visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false};
const browser=await chromium.launch({headless:true});
evidence.browser={version:browser.version(),executable:await binding(chromium.executablePath()),viewport:{width:1440,height:1000},reducedMotion:'reduce'};
async function shot(page,name){const bytes=await page.screenshot({fullPage:true});await save(`${name}.png`,bytes);return{path:`${OUTPUT}/${name}.png`,bytes:bytes.length,sha256:sha(bytes)};}
async function geometry(locator){return locator.evaluate(node=>{
  const box=n=>{const r=n.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const b=box(node),clipping=[],ancestorScrollPositions=[];
  for(let a=node.parentElement;a&&a!==document.body&&a!==document.documentElement;a=a.parentElement){
    const s=getComputedStyle(a),r=box(a);
    ancestorScrollPositions.push({tag:a.tagName,className:typeof a.className==='string'?a.className:'',scrollTop:a.scrollTop,scrollLeft:a.scrollLeft});
    if((['hidden','clip','auto','scroll'].includes(s.overflowX)&&(b.left<r.left-1||b.right>r.right+1))||
      (['hidden','clip','auto','scroll'].includes(s.overflowY)&&(b.top<r.top-1||b.bottom>r.bottom+1)))clipping.push({tag:a.tagName,className:a.className,box:r,overflowX:s.overflowX,overflowY:s.overflowY});
  }
  const hit=document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);
  return{box:b,clipping,ancestorScrollPositions,documentScroll:{x:scrollX,y:scrollY},fullyInViewport:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,
    hitMatches:Boolean(hit&&(hit===node||node.contains(hit))),documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
});}
async function runEntry(item,index){
  const id=item.selected.animationId,name=`${String(index+1).padStart(2,'0')}-${id}`;
  const record={name,id,stableLessonKey:item.stableLessonKey,status:'running',requests:[],warnings:[],errors:[],sourceAssetResponses:[],geometry:[],screenshots:[]};records.push(record);
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(60000);const responseTasks=[];
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    const allowed=url.origin===BASE&&['GET','HEAD','POST'].includes(request.method())&&
      (/^\/(?:en\/|es\/)?migration-status\/g678-calibration\/shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/.test(url.pathname)||
       url.pathname.startsWith('/_next/')||url.pathname.startsWith('/flash-assets/')||['/favicon.ico','/learning-theme-bootstrap.js','/__nextjs_original-stack-frames'].includes(url.pathname));
    const row={case:name,url:request.url(),method:request.method(),allowed};network.push(row);record.requests.push(row);
    if(!allowed){errors.push(`Unexpected outbound: ${request.url()}`);return route.abort();}return route.continue();
  });
  await context.routeWebSocket('**/*',socket=>{const url=new URL(socket.url()),allowed=url.origin==='ws://127.0.0.1:3340'&&url.pathname.startsWith('/_next/');
    const row={case:name,url:socket.url(),method:'WEBSOCKET',allowed};network.push(row);record.requests.push(row);
    if(allowed)socket.connectToServer();else{errors.push(`Unexpected WebSocket: ${socket.url()}`);socket.close();}});
  page.on('pageerror',error=>record.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')record.errors.push(message.text());if(message.type()==='warning'){if(message.text().startsWith('The AudioContext was not allowed to start.')){record.expectedAutoplayWarnings??=[];record.expectedAutoplayWarnings.push(message.text());}else record.warnings.push(message.text());}});
  page.on('response',response=>{
    if(response.status()>=400)record.errors.push(`HTTP ${response.status()} ${response.url()}`);
    if(new URL(response.url()).pathname===item.selected.runtime.canvasRenderer.url)responseTasks.push((async()=>{
      const bytes=await response.body();record.sourceAssetResponses.push({url:response.url(),status:response.status(),bytes:bytes.length,sha256:sha(bytes)});
    })().catch(error=>record.errors.push(`Source asset response: ${error.message}`)));
  });
  try{
    const response=await page.goto(`${BASE}/en/migration-status/g678-calibration/${id}`,{waitUntil:'domcontentloaded'});
    record.http={status:response.status(),url:response.url()};assert.equal(response.status(),200);
    const robots=await page.locator('meta[name="robots"]').getAttribute('content');record.http.robots=robots;assert.match(robots,/\bnoindex\b/);
    await page.waitForFunction(({HOST,STAGE,id})=>document.querySelector(HOST)?.getAttribute('data-hydrated')==='true'&&
      document.querySelector(HOST)?.getAttribute('data-current-animation-id')===id&&document.querySelector(STAGE)?.getAttribute('data-animation-module')===id,{HOST,STAGE,id});
    const canvas=page.locator(`${STAGE} canvas[data-course-canvas="${id}"][data-render-state="ready"]`);await canvas.waitFor({state:'visible'});
    record.host=await page.locator(HOST).evaluate(node=>Object.fromEntries([...node.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])));
    record.runtime=await page.locator(STAGE).evaluate(node=>Object.fromEntries([...node.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])));
    assert.equal(record.host['data-renderer-availability'],'registered');assert.equal(Number(record.host['data-current-page']),item.selected.globalPageOrdinal);
    assert.equal(Number(record.host['data-unavailable-pages']),item.unavailablePageCount);
    assert.equal(record.runtime['data-flash-frame-domain'],item.selected.runtime.frameDomain);assert.equal(record.runtime['data-runtime-scenario'],item.selected.runtime.scenario);
    record.noInjection=await page.evaluate(()=>!document.querySelector('[data-test-loader]')&&!Object.keys(window).some(key=>/^__(?:A7|B10|P034|P042|D_SCORE|SPECIAL).*MODULES$/.test(key)));
    assert.equal(record.noInjection,true);
    const stageGeometry=await geometry(page.locator(STAGE)),canvasGeometry=await geometry(canvas);
    record.geometry.push({kind:'runtime-stage',...stageGeometry},{kind:'source-canvas',...canvasGeometry});
    assert.ok(stageGeometry.box.width>0&&stageGeometry.box.height>0);assert.ok(canvasGeometry.box.width>0&&canvasGeometry.box.height>0);
    assert.deepEqual(canvasGeometry.clipping,[]);assert.ok(canvasGeometry.documentWidth<=canvasGeometry.viewportWidth);
    const expectedRatio=item.selected.runtime.stage.width/item.selected.runtime.stage.height;
    assert.ok(Math.abs(canvasGeometry.box.width/canvasGeometry.box.height-expectedRatio)<0.02,'Source canvas aspect ratio changed');
    record.canvas=await canvas.evaluate(node=>{
      const attrs=Object.fromEntries([...node.attributes].map(a=>[a.name,a.value]));
      try{const data=node.getContext('2d').getImageData(0,0,node.width,node.height).data,colors=new Set();let nonTransparent=0;
        for(let i=0;i<data.length;i+=4){if(data[i+3])nonTransparent++;if(i%(4*97)===0)colors.add(`${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`);}
        return{attrs,intrinsicWidth:node.width,intrinsicHeight:node.height,nonTransparentPixels:nonTransparent,sampledColorCount:colors.size};
      }catch(error){return{attrs,intrinsicWidth:node.width,intrinsicHeight:node.height,pixelReadError:String(error)};}
    });
    record.svg=await page.locator(`${STAGE} svg`).evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{width:r.width,height:r.height,viewBox:node.getAttribute('viewBox'),primitiveCount:node.querySelectorAll('path,text,rect,circle,line,use,image,polygon,polyline').length};}));
    await Promise.all(responseTasks);assert.equal(record.sourceAssetResponses.length,1,'Exactly one actual source runtime response required');
    const asset=record.sourceAssetResponses[0],expected=item.selected.runtime.canvasRenderer;
    assert.equal(asset.status,200);assert.equal(asset.bytes,expected.bytes);assert.equal(asset.sha256,expected.sha256);
    assert.equal(new URL(asset.url).searchParams.get('sha256'),expected.sha256);
    record.screenshots.push(await shot(page,`${name}-entry`));
    const trigger=page.locator(`${HOST} button[data-course-map-trigger]:visible`).first();await trigger.waitFor({state:'visible'});
    let triggerGeometry=await geometry(trigger);record.geometry.push({kind:'map-trigger-before-document-scroll',...triggerGeometry});
    assert.deepEqual(triggerGeometry.clipping,[]);
    if(!triggerGeometry.fullyInViewport){
      const beforeScroll=triggerGeometry.ancestorScrollPositions;
      await page.evaluate(({top,height})=>window.scrollBy(0,top+height/2-innerHeight/2),triggerGeometry.box);
      triggerGeometry=await geometry(trigger);assert.deepEqual(triggerGeometry.ancestorScrollPositions,beforeScroll,'Document scroll must not move overflow ancestors');
    }
    record.geometry.push({kind:'map-trigger-before-click',...triggerGeometry});
    assert.deepEqual(triggerGeometry.clipping,[]);assert.equal(triggerGeometry.fullyInViewport,true);assert.equal(triggerGeometry.hitMatches,true);
    if(await trigger.getAttribute('aria-expanded')!=='true')await page.mouse.click((triggerGeometry.box.left+triggerGeometry.box.right)/2,(triggerGeometry.box.top+triggerGeometry.box.bottom)/2);
    const mapId=await trigger.getAttribute('aria-controls');assert.ok(mapId);
    const map=page.locator(`${HOST} [id="${mapId}"]`);await map.waitFor({state:'visible'});
    record.sourceOrderedMap=await map.locator('button[data-placement-id]').evaluateAll(nodes=>nodes.map(node=>({animationId:node.getAttribute('data-animation-id'),placementId:node.getAttribute('data-placement-id'),availability:node.getAttribute('data-renderer-availability')})));
    assert.deepEqual(record.sourceOrderedMap,item.orderedMap);
    record.counts={active:record.sourceOrderedMap.length,registered:record.sourceOrderedMap.filter(row=>row.availability==='registered').length,unavailable:record.sourceOrderedMap.filter(row=>row.availability==='unavailable').length};
    assert.deepEqual(record.counts,{active:item.activePageCount,registered:item.registeredPageCount,unavailable:item.unavailablePageCount});
    record.screenshots.push(await shot(page,`${name}-source-map`));
    assert.deepEqual(record.errors,[]);assert.deepEqual(record.warnings,[]);assert.ok(record.requests.every(row=>row.allowed));record.status='passed';
  }catch(error){record.status='failed';record.failure=error.stack??String(error);record.failureScreenshot=await shot(page,`${name}-failure`).catch(()=>null);await save(`${name}-failure.html`,await page.content().catch(()=>''));}
  finally{await Promise.all(responseTasks);await context.close();await save(`${name}.json`,json(record));
    console.log(JSON.stringify({entry:index+1,total:44,id,status:record.status,failure:record.failure?.split('\n')[0]}));}
}
try{for(const[itemIndex,item]of selections.entries())await runEntry(item,itemIndex);}
finally{
  await browser.close();const after=await Promise.all(inputFiles.map(binding));evidence.inputsUnchanged=JSON.stringify(after)===JSON.stringify(inputs);
  evidence.visitedPlacementCount=records.length;evidence.auditedLessonEntryRouteCount=new Set(records.map(record=>record.stableLessonKey)).size;
  evidence.passedEntryCount=records.filter(record=>record.status==='passed').length;evidence.failedEntryCount=records.filter(record=>record.status==='failed').length;
  evidence.elapsedMs=Date.now()-started;evidence.status=records.length===44&&records.every(record=>record.status==='passed'&&record.errors.length===0)&&evidence.inputsUnchanged&&errors.length===0?'passed':'failed';
  await save('evidence.json',json(evidence));console.log(JSON.stringify({output:OUTPUT,status:evidence.status,entries:records.length,passed:evidence.passedEntryCount,inputsUnchanged:evidence.inputsUnchanged,wholeLessonCompletionAudited:false}));
}
return evidence;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.slice(2).join(' ')==='--help')console.log('After root browser GO: --run <exclusive> --activated-registry-sha256 <exact379sha> --activation-sha256 <exactactivationSha>');
  else run379EntryAudit(process.argv.slice(2)).then(e=>{process.exitCode=e.status==='passed'?0:1;}).catch(error=>{console.error(error);process.exitCode=1;});
}
