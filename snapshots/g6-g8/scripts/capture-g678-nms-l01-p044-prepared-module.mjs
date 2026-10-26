#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,version as esbuildVersion} from 'esbuild';
import {chromium} from 'playwright';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SELF='scripts/capture-g678-nms-l01-p044-prepared-module.mjs';
const OUT='work/g678-shared-page-factory/g678-nms-l01-p044-prepared-module-metadata-v1';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function bind(p){const bytes=await readFile(path.resolve(ROOT,p));return{path:p,bytes:bytes.length,sha256:hash(bytes)};}
assert.equal(process.argv.length,2);await mkdir(path.join(ROOT,OUT));
const entry=`import module,{P044_MODULE_PREPARATION} from './packages/demos/src/g678-nms-l01-p044-prepared-module';
import {P044_COMPANION_SUFFIX} from './packages/demos/src/g678-nms-l01-p044-companion-target';
const {Renderer,getFrameState,...metadata}=module;
const context=frame=>({frame,frameDomain:'sprite-293',rootFrame:6,scenario:'nms-l01-p044-source-behavior-candidate',lang:'en',seed:0,replay:0});
const valid=Array.from({length:756},(_,i)=>getFrameState(i+1,context(i+1)));
const invalid=[{frameDomain:'root'},{rootFrame:1},{lang:'es'},{scenario:'other'},{seed:-1},{seed:4294967296},{replay:-1},{frame:3}].map(p=>getFrameState(1,{...context(1),...p}));
window.__P044_METADATA={metadata,rendererName:Renderer.name,preparation:P044_MODULE_PREPARATION,companionSuffix:P044_COMPANION_SUFFIX,
 validCount:valid.length,allValid:valid.every(s=>s.status==='ready'),allGatesFalse:valid.every(s=>s.currentJavaScriptRegistered===false&&s.productCalibrationPassed===false&&s.originalRuntimeAccepted===false&&s.audioIntegrated===false),
 invalidCount:invalid.length,allInvalid:invalid.every(s=>s.status==='blocked')};`;
const compiled=await build({stdin:{contents:entry,resolveDir:ROOT,loader:'js'},bundle:true,write:false,metafile:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const files=[SELF,...Object.keys(compiled.metafile.inputs).filter(p=>p!=='<stdin>')];
const inputs=await Promise.all(files.map(bind));
await writeFile(path.join(ROOT,OUT,'probe.mjs'),compiled.outputFiles[0].contents,{flag:'wx',mode:0o444});
let browser;const evidence={scope:'Actual browser-imported prepared module metadata; not registered or MyLesson QA',inputs,requests:[],errors:[],status:'running'};
try{
  browser=await chromium.launch({headless:true});evidence.browser=browser.version();const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',r=>{evidence.requests.push({scheme:r.request().url().split(':')[0],urlSha256:hash(r.request().url())});return r.abort();});
  const page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.setContent('<!doctype html><html><body>Private prepared-module metadata probe</body></html>');
  await page.addScriptTag({content:compiled.outputFiles[0].text,type:'module'});await page.waitForFunction(()=>Boolean(window.__P044_METADATA));
  evidence.actual=await page.evaluate(()=>window.__P044_METADATA);
  assert.equal(evidence.actual.metadata.key,'shared-nms002-l01-p044');assert.equal(evidence.actual.rendererName,'PreparedP044Renderer');
  assert.equal(evidence.actual.preparation.sourceImagesDecoded,11);assert.equal(evidence.actual.preparation.loaderAwaitedDecode,true);
  assert.equal(evidence.actual.allValid,true);assert.equal(evidence.actual.allInvalid,true);assert.equal(evidence.actual.allGatesFalse,true);
  assert.deepEqual(evidence.requests,[]);assert.deepEqual(evidence.errors,[]);evidence.status='passed';
}catch(error){evidence.status='failed';evidence.failure={message:error.message};process.exitCode=1;}
finally{
  if(browser)await browser.close();evidence.inputsAfter=await Promise.all(files.map(bind));evidence.inputsUnchanged=JSON.stringify(inputs)===JSON.stringify(evidence.inputsAfter);
  if(!evidence.inputsUnchanged){evidence.status='invalidated-input-drift';process.exitCode=1;}
  evidence.probe=await bind(`${OUT}/probe.mjs`);evidence.toolchain={nodeVersion:process.version,node:await bind(await realpath(process.execPath)),esbuildVersion,
    esbuildPackage:await bind(await realpath('node_modules/esbuild/package.json'))};
  await writeFile(path.join(ROOT,OUT,'metadata.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx',mode:0o444});
  console.log(JSON.stringify({status:evidence.status,evidence:await bind(`${OUT}/metadata.json`),metadataKey:evidence.actual?.metadata.key,inputs:evidence.inputs.length},null,2));
}
