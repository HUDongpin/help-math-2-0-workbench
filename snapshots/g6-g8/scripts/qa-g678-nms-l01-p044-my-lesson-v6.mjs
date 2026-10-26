#!/usr/bin/env node
// Actual registered379 My Lesson, native controls and clocks. No module injection.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import ts from 'typescript';
import {activateP044RepairRegistration} from './activate-g678-nms-l01-p044-live-clock-registration.mjs';
import {readG678P044RepairPackage,validateG678P044RepairAuthority,validateG678P044RepairPhysicalClosure} from '../apps/web/lib/g678-nms-l01-p044-live-clock-authority.server.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),BASE='http://127.0.0.1:3326';
const ID='shared-nms002-l01-p044',HOST='[data-lesson-player][data-current-animation-id]',SEL='[data-p044-candidate-view="v1"]';
const STAGE=`${HOST} .runtime-stage`,RUNTIME=`${HOST} .runtime-shell`,CONTROLS='[data-p044-maintained-controls]';
const SELF='scripts/qa-g678-nms-l01-p044-my-lesson-v6.mjs',ACTIVATION='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.activation.json';
const sha=b=>createHash('sha256').update(b).digest('hex'),json=v=>JSON.stringify(v,null,2)+'\n';
export async function sourceImageHashes(){
  const file='packages/demos/src/generated/g678-nms-l01-p044-prepared-source-canvas-v2.ts',s=ts.createSourceFile(file,await readFile(path.join(ROOT,file),'utf8'),ts.ScriptTarget.Latest,true);let declaration;
  function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(s)==='P044_SOURCE_IMAGE_URIS')declaration=n;ts.forEachChild(n,walk);}walk(s);
  assert.ok(declaration&&ts.isCallExpression(declaration.initializer)&&declaration.initializer.expression.getText(s)==='Object.freeze');
  const object=declaration.initializer.arguments[0];assert.ok(ts.isObjectLiteralExpression(object));assert.equal(object.properties.length,11);
  return object.properties.map(p=>{assert.ok(ts.isPropertyAssignment(p)&&ts.isStringLiteral(p.initializer));return sha(p.initializer.text);});
}
export const CASES=Object.freeze([370,390,1440].flatMap(width=>['en','es'].map(locale=>({name:`${width}-${locale}-reduced`,width,height:width<500?844:1000,locale,reduced:true})))
  .concat([{name:'1440-en-natural',width:1440,height:1000,locale:'en',reduced:false}]));
export function parseArgs(args){assert.ok(args.length===2&&args[0]==='--run'&&/^[a-z0-9-]+$/.test(args[1]));return args[1];}
export function allowedRequest(raw,ws=false){const u=new URL(raw);return ws?u.origin==='ws://127.0.0.1:3326'&&u.pathname.startsWith('/_next/'):
  u.origin===BASE&&(/^\/(?:en|es)\/migration-status\/g678-calibration\/shared-nms002-l01-p(?:043|044)$/.test(u.pathname)||
  /^\/(?:_next|flash-assets)\//.test(u.pathname)||['/favicon.ico','/learning-theme-bootstrap.js','/__nextjs_original-stack-frames'].includes(u.pathname));}
async function binding(file){const full=path.resolve(ROOT,file),a=await lstat(full,{bigint:true});assert.ok(a.isFile()&&!a.isSymbolicLink()&&a.nlink===1n&&await realpath(full)===full);
  const b=await readFile(full),z=await lstat(full,{bigint:true});for(const k of['dev','ino','size','mtimeNs','ctimeNs','mode'])assert.equal(a[k],z[k]);return{path:file,bytes:b.length,sha256:sha(b)};}
export async function run(args){const runName=parseArgs(args),output=`output/playwright/g678-nms-l01-p044-my-lesson-${runName}`;
  await activateP044RepairRegistration({check:true});assert.equal((await binding(ACTIVATION)).sha256,'974800685b70f958bdf7e49c197ef254cc5b4b270254f7e91408fc3da2cae0bb');
  const packet=validateG678P044RepairAuthority(readG678P044RepairPackage(ROOT));
  const activation=JSON.parse(await readFile(path.join(ROOT,ACTIVATION),'utf8'));
  const files=[...new Set(['apps/web/next.config.ts','apps/web/tests/g678-local-async-runtime-target.test.ts','apps/web/lib/g678-preview-policy.ts',SELF,'scripts/qa-g678-nms-l01-p044-my-lesson-v6.test.mjs',ACTIVATION,...activation.inputBindings.map(p=>p.path),
    ...validateG678P044RepairPhysicalClosure(ROOT,packet),...activation.proposed.generated.map(p=>p.path),'packages/demos/private-current-js-registry.json',
    'apps/web/components/animation-runtime.tsx','apps/web/components/descriptor-driven-whole-lesson-player.tsx','apps/web/components/legacy-responsive-lesson-shell.tsx',
    'apps/web/app/globals.css','apps/web/app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx',
    'apps/web/lib/load-animation-module.client.ts','apps/web/lib/whole-lesson-player-descriptor.ts','apps/web/lib/whole-lesson-host-presentation.ts'])].sort();
  const inputs=await Promise.all(files.map(binding)),expectedImageHashes=await sourceImageHashes();await mkdir(path.join(ROOT,output));
  const save=(p,b)=>writeFile(path.join(ROOT,output,p),b,{flag:'wx'});
  const evidence={artifactType:'g678-p044-registered379-v2-my-lesson-functional-qa-v6',createdAt:new Date().toISOString(),inputs,records:[],
    localProductRegressionIssues:[],
    productCalibrationPassed:false,engineeringPreviewReady:false,originalRuntimeAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false};
  await save('inputs.json',json(inputs));await save('runner.mjs',await readFile(path.join(ROOT,SELF)));
  const browser=await chromium.launch({headless:true});evidence.browser=browser.version();let page,record,step;
  async function shot(label){const bytes=await page.screenshot({fullPage:true}),file=`${record.name}-${label}.png`;await save(file,bytes);record.screenshots.push({path:`${output}/${file}`,bytes:bytes.length,sha256:sha(bytes)});}
  async function wait(frame,phase){await page.waitForFunction(({SEL,frame,phase})=>{const n=document.querySelector(SEL);return n?.dataset.visualStatus==='ready'&&n.dataset.sourceFrame===String(frame)&&n.dataset.sourcePhase===phase;},{SEL,frame,phase},{timeout:40000});}
  async function snap(label){const s=await page.evaluate(({HOST,SEL,STAGE,RUNTIME,CONTROLS,label})=>{
    const h=document.querySelector(HOST),n=document.querySelector(SEL),stage=document.querySelector(STAGE),rt=document.querySelector(RUNTIME),c=document.querySelector(CONTROLS);
    return{label,host:Object.fromEntries([...h.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])),
      candidate:Object.fromEntries([...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])),frame:Number(n.dataset.sourceFrame),phase:n.dataset.sourcePhase,
      nested:n.dataset.sourceNestedFrames,runtimeFrame:Number(stage.dataset.flashFrame),runtimeDomain:stage.dataset.flashFrameDomain,paused:rt.dataset.runtimePaused,
      complete:rt.dataset.runtimePlaybackComplete,audioAvailable:rt.dataset.audioAvailable,mathLang:stage.dataset.flashLang,uiLang:h.querySelector('.lesson-shell2')?.lang,
      controlsCount:document.querySelectorAll(CONTROLS).length,portal:c.dataset.p044CompanionPlacement,slot:c.closest('[data-page-interaction-companion-host]')?.id,
      outsideStage:!c.closest('.runtime-stage'),sameColumn:c.closest('.lesson-shell2__learning-column')===n.closest('.lesson-shell2__learning-column'),
      alerts:[...h.querySelectorAll('[role="alert"]')].map(x=>x.textContent),overflow:document.documentElement.scrollWidth>innerWidth,
      readonlyCandidateLabel:c.querySelector('p')?.textContent,
      readable:[...c.querySelectorAll('[data-p044-readable-instruction] p,[data-p044-readable-instruction] h3,[data-p044-readable-instruction] figcaption')].map(t=>({text:t.textContent,font:parseFloat(getComputedStyle(t).fontSize),line:parseFloat(getComputedStyle(t).lineHeight)})),
      diagrams:[...c.querySelectorAll('svg')].map(svg=>({aria:svg.getAttribute('aria-label'),labels:[...svg.querySelectorAll('text')].map(t=>({text:t.textContent,font:parseFloat(getComputedStyle(t).fontSize)*Math.abs(t.getScreenCTM().a)})),
        jumps:[...svg.querySelectorAll('[data-jump-from]')].map(g=>({from:Number(g.dataset.jumpFrom),to:Number(g.dataset.jumpTo)}))})),
      trace:window.__P044_MY_LESSON_TRACE,injectedLoader:Boolean(document.querySelector('[data-test-loader]'))};
  },{HOST,SEL,STAGE,RUNTIME,CONTROLS,label});
    record.observations.push({...s,label});assert.equal(s.host['data-current-animation-id'],ID);assert.equal(s.host['data-renderer-availability'],'registered');
    assert.equal(s.candidate['data-registration-authority'],'modern-lesson-host');assert.doesNotMatch(s.readonlyCandidateLabel,/Unregistered|sin registrar/);assert.equal(s.host['data-unavailable-pages'],'35');assert.equal(s.controlsCount,1);assert.equal(s.portal,'portal');assert.ok(s.slot.endsWith('-nms-l01-p044-readable-instruction'));
    assert.equal(s.outsideStage,true);assert.equal(s.sameColumn,true);assert.equal(s.injectedLoader,false);assert.equal(s.runtimeDomain,'sprite-293');assert.equal(s.mathLang,'en');assert.equal(s.uiLang,record.locale);
    assert.equal(s.audioAvailable,'false');assert.equal(s.overflow,false);assert.deepEqual(s.alerts,[]);
    assert.equal(s.host['data-lesson-host-fq-attempted'],'0');assert.equal(s.host['data-lesson-host-fq-points-awarded'],'0');
    for(const t of s.readable){assert.ok(t.font>=20);assert.ok(t.line>=30);}for(const d of s.diagrams)for(const t of d.labels)assert.ok(t.font>=16,`Number-line screen text below16px: ${t.font}`);
    return s;
  }
  async function click(selector){const b=typeof selector==='string'?page.locator(selector):selector;await b.scrollIntoViewIfNeeded();await b.click();}
  const ui=key=>page.locator(`${HOST} button[data-responsive-focus-key="${key}"]:visible`).first();
  async function glossary(term){step=`glossary-${term}`;await click(`[data-p044-glossary="${term}"]`);const d=page.locator(`[data-glossary-entry-id="${term}"]`);await d.waitFor();
    assert.equal(await d.getAttribute('data-glossary-storage'),'memory-only');assert.match(await page.locator(RUNTIME).getAttribute('data-runtime-paused'),/^true$/);
    record.glossary.push({term,text:await d.innerText(),sourceSha256:await d.getAttribute('data-source-sha256')});
    await click(d.getByRole('button',{name:record.locale==='es'?'Cerrar y continuar':'Close and continue',exact:true}));await d.waitFor({state:'detached'});
    await page.waitForFunction(RUNTIME=>document.querySelector(RUNTIME)?.dataset.runtimePaused==='false',RUNTIME);
  }
  async function toQuiz(){await wait(312,'guided');await snap('312-guided');await glossary('total');
    step='continue449';await click('[data-p044-continue]');await wait(449,'guided');await snap('449-guided');
    await click('[data-p044-continue]');await wait(575,'guided');await click('[data-p044-explanation]');await wait(575,'explanation-held');await snap('575-explanation106');await shot('explanation106');
    await click('[data-p044-explanation-close]');await wait(575,'guided');await click('[data-p044-continue]');await wait(697,'guided');
    await click('[data-p044-explanation]');await wait(697,'explanation-held');await snap('697-explanation139');await shot('explanation139');
    await click('[data-p044-explanation-close]');await wait(697,'guided');await click('[data-p044-continue]');await wait(737,'quiz');
    await click('[data-p044-help]');await wait(737,'popup');await snap('737-help');await shot('help');await glossary('multiplication');await glossary('solve');
    await click('[data-p044-help-close]');await wait(737,'quiz');await snap('737-quiz');
  }
  try{for(const config of CASES){record={...config,status:'running',errors:[],warnings:[],network:[],screenshots:[],observations:[],glossary:[],support:[]};evidence.records.push(record);step='initial';
    const context=await browser.newContext({viewport:{width:config.width,height:config.height},hasTouch:config.width<500,reducedMotion:config.reduced?'reduce':'no-preference',serviceWorkers:'block'});
    await context.route('**/*',r=>{const allowed=allowedRequest(r.request().url());record.network.push({url:r.request().url(),allowed});return allowed?r.continue():r.abort();});
    await context.routeWebSocket('**/*',s=>{const allowed=allowedRequest(s.url(),true);record.network.push({url:s.url(),allowed});if(allowed)s.connectToServer();else s.close();});
    await context.addInitScript(()=>{const trace={decodeCalls:0,decoded:0,decodedSourceHashes:[],firstRuntimeFrame:null,firstVisualFrame:null};window.__P044_MY_LESSON_TRACE=trace;
      const original=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=async function(){trace.decodeCalls++;
        const digest=crypto.subtle.digest('SHA-256',new TextEncoder().encode(this.src));const r=await original.call(this);
        trace.decodedSourceHashes.push([...new Uint8Array(await digest)].map(n=>n.toString(16).padStart(2,'0')).join(''));trace.decoded++;return r;};
      new MutationObserver(()=>{const s=document.querySelector('.runtime-stage'),v=document.querySelector('[data-p044-candidate-view]');
        if(s?.dataset.animationModule==='shared-nms002-l01-p044'&&trace.firstRuntimeFrame===null)trace.firstRuntimeFrame=Number(s.dataset.flashFrame);
        if(v?.dataset.visualStatus==='ready'&&trace.firstVisualFrame===null)trace.firstVisualFrame=Number(v.dataset.sourceFrame);}).observe(document,{subtree:true,childList:true,attributes:true});});
    page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());if(m.type()==='warning')record.warnings.push(m.text());});
    try{const response=await page.goto(`${BASE}/${config.locale}/migration-status/g678-calibration/${ID}`,{waitUntil:'domcontentloaded',timeout:90000});assert.equal(response.status(),200);assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
      await page.locator(`${SEL}[data-visual-status="ready"]`).waitFor();await snap('initial');await shot('initial');
      await toQuiz();step='wrong-feedback';await click('[data-p044-answer="AnsBtn1"]');
      if(!config.reduced){await wait(737,'feedback');await page.waitForTimeout(350);await click(page.getByRole('button',{name:'Pause animation',exact:true}));const held=await snap('feedback-paused');
        await page.waitForTimeout(350);assert.equal((await snap('feedback-still-paused')).nested,held.nested);await click(page.getByRole('button',{name:'Play animation',exact:true}));}
      await wait(737,'quiz');await snap('wrong-retry');step='right-feedback';await click('[data-p044-answer="AnsBtn3"]');await wait(756,'complete');const done=await snap('complete');assert.equal(done.complete,'true');await shot('complete');
      const previousStage=await page.locator(SEL).elementHandle();await click('[data-p044-replay]');await page.waitForFunction(n=>!n.isConnected,previousStage);await previousStage.dispose();await page.locator(`${SEL}[data-visual-status="ready"]`).waitFor();if(config.reduced)await wait(312,'guided');await snap('replay');
      if(!config.reduced)await wait(312,'guided');
      step='keyterms';await click(ui('key-terms'));const panel=page.locator('[data-key-terms-authority="source-bound-g678-bilingual-keyterms-xml"]');await panel.waitFor();assert.equal(await panel.locator('dl > div').count(),22);
      record.support.push({kind:'key-terms',count:22,text:await panel.innerText()});await click(page.getByRole('button',{name:config.locale==='es'?'Cerrar herramienta':'Close tool',exact:true}));
      step='map';await click(ui('map'));const rows=await page.locator(`${HOST} button[data-placement-id]`).evaluateAll(ns=>ns.filter(n=>n.closest('[data-course-map]')||n.getAttribute('data-renderer-availability')).map(n=>({id:n.dataset.placementId,availability:n.dataset.rendererAvailability})));
      const unique=[...new Map(rows.map(r=>[r.id,r])).values()];assert.equal(unique.length,47);assert.equal(unique.filter(r=>r.availability==='registered').length,12);record.support.push({kind:'map',rows:unique});
      await click(page.locator(`${HOST} [data-course-map-close-control]:visible`).first());
      step='neighbors';await click(ui('previous'));await page.waitForFunction(H=>document.querySelector(H)?.dataset.currentAnimationId==='shared-nms002-l01-p043',HOST);assert.equal(await page.locator(CONTROLS).count(),0);
      await click(ui('next'));await page.locator(`${SEL}[data-visual-status="ready"]`).waitFor();await snap('return-from-p043');
      const trace=await page.evaluate(()=>window.__P044_MY_LESSON_TRACE),sourceDecodes=trace.decodedSourceHashes.filter(h=>expectedImageHashes.includes(h));
      assert.deepEqual(sourceDecodes.slice().sort(),expectedImageHashes.slice().sort(),'Each exact p044 source image decodes once, without counting unrelated product images');
      assert.equal(trace.firstRuntimeFrame,config.reduced?312:1);assert.equal(trace.firstVisualFrame,config.reduced?312:1);record.loader={...trace,sourceDecodeCount:sourceDecodes.length,otherProductDecodeCount:trace.decoded-sourceDecodes.length};
      assert.deepEqual(record.errors,[]);assert.deepEqual(record.warnings,[]);assert.ok(record.network.every(r=>r.allowed));record.status='functional-checks-passed-calibration-not-adopted';
    }catch(error){record.status='failed';record.failure={step,message:error.message,stack:error.stack};await shot('failure');record.failureDom=await page.locator('body').innerText();}
    finally{await context.close();await save(`${record.name}.json`,json(record));console.log(JSON.stringify({case:record.name,status:record.status,failure:record.failure?.message}));}
  }}finally{await browser.close();evidence.inputsAfter=await Promise.all(files.map(binding));evidence.inputsUnchanged=JSON.stringify(inputs)===JSON.stringify(evidence.inputsAfter);
    evidence.functionalPassed=evidence.records.length===CASES.length&&evidence.records.every(r=>r.status==='functional-checks-passed-calibration-not-adopted')&&evidence.inputsUnchanged;
    evidence.status=evidence.functionalPassed?'functional-checks-passed-calibration-not-adopted':'failed';await activateP044RepairRegistration({check:true});
    await save('evidence.json',json(evidence));console.log(JSON.stringify({output,status:evidence.status,records:evidence.records.length,inputsUnchanged:evidence.inputsUnchanged}));}
  return evidence;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))run(process.argv.slice(2)).then(e=>{process.exitCode=e.functionalPassed?0:1;}).catch(e=>{console.error(e);process.exitCode=1;});
