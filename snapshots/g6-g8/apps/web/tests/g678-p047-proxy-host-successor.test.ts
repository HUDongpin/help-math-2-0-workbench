import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,writeFileSync,chmodSync,rmSync,realpathSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {composeP047DatL02Proxy,composeP006AdmissionProxy,resolveP047ProxyHostPins,P047_PROXY_SUCCESSOR,P047_DAT_L02_COMPOSED_SUCCESSOR,P006_ADMISSION_PROXY_SUCCESSOR} from '../lib/g678-p047-proxy-host-successor.server';
const ROOT=path.resolve(process.cwd(),'../..');
const DAT_IMPORTS="import {isDatL02P002SourceAudioRequest, DAT_L02_P002_AUDIO_PATH} from\n  './lib/dat-l02-p002-source-audio-access';\nimport {isDatL02P002SymbolRequest, DAT_L02_P002_SYMBOL_PREFIX} from\n  './lib/dat-l02-p002-symbol-access';\n";
const DAT_BRANCHES="  if (pathname.startsWith(DAT_L02_P002_AUDIO_PATH)) {\n    return isDatL02P002SourceAudioRequest({\n      method: request.method, url: request.nextUrl, headers: request.headers,\n    });\n  }\n  if (pathname.startsWith(DAT_L02_P002_SYMBOL_PREFIX)) {\n    return isDatL02P002SymbolRequest({\n      method: request.method, url: request.nextUrl, headers: request.headers,\n    });\n  }\n";
function datOnlyProxy(){
 const current=readFileSync(path.join(ROOT,'apps/web/proxy.ts'),'utf8');
 const manifest=JSON.parse(readFileSync(path.join(ROOT,P006_ADMISSION_PROXY_SUCCESSOR.path),'utf8'));
 const predecessor=readFileSync(path.join(ROOT,manifest.predecessorWitness.path),'utf8');
 assert.equal(createHash('sha256').update(predecessor).digest('hex'),manifest.predecessorProxy.sha256);
 assert.equal(composeP006AdmissionProxy(predecessor),current);
 return predecessor;
}
function p047OnlyProxy(){
 const current=datOnlyProxy();
 assert.equal(current.split(DAT_IMPORTS).length,2);
 assert.equal(current.split(DAT_BRANCHES).length,2);
 const predecessor=current.replace(DAT_IMPORTS,'').replace(DAT_BRANCHES,'');
 assert.equal(composeP047DatL02Proxy(predecessor),current);
 return predecessor;
}
test('proxy successor preserves old bytes as an explicit witness and rejects every drift',()=>{
 const env:Record<string,string|undefined>=process.env;
 const phase=env.HELP_MATH_G678_CALIBRATION_PHASE,node=env.NODE_ENV;
 process.env.HELP_MATH_G678_CALIBRATION_PHASE='frozen16-continuous-audio-provisional-browser-qa';env.NODE_ENV='test';
 const root=realpathSync(mkdtempSync(path.join(os.tmpdir(),'p047-proxy-test-')));
 try{
  const manifest=JSON.parse(readFileSync(path.join(ROOT,P047_PROXY_SUCCESSOR.path),'utf8'));
  const pins=[P047_PROXY_SUCCESSOR,manifest.witness,...manifest.currentFiles];
  for(const p of pins){const f=path.join(root,p.path);mkdirSync(path.dirname(f),{recursive:true});copyFileSync(path.join(ROOT,p.path),f);}
  writeFileSync(path.join(root,'apps/web/proxy.ts'),p047OnlyProxy());
  const witness=path.join(root,manifest.witness.path);chmodSync(witness,0o444);
  const current=path.join(root,'apps/web/proxy.ts');
  assert.notEqual(createHash('sha256').update(readFileSync(current)).digest('hex'),manifest.original.sha256);
  const expanded=resolveP047ProxyHostPins(root,[manifest.original]);assert.equal(expanded.length,6);assert.deepEqual(expanded[0],manifest.witness);
  for(const pin of expanded)assert.equal(createHash('sha256').update(readFileSync(path.join(root,pin.path))).digest('hex'),pin.sha256);
  assert.throws(()=>resolveP047ProxyHostPins(root,[]),/one predecessor/);
  assert.throws(()=>resolveP047ProxyHostPins(root,[manifest.original,manifest.original]),/one predecessor/);
  assert.throws(()=>resolveP047ProxyHostPins(root,[{...manifest.original,sha256:'0'.repeat(64)}]),/exact old caller/);
  for(const pin of manifest.currentFiles){const file=path.join(root,pin.path),bytes=readFileSync(file);writeFileSync(file,Buffer.concat([bytes,Buffer.from('\n')]));assert.throws(()=>resolveP047ProxyHostPins(root,[manifest.original]),/exact bytes/);writeFileSync(file,bytes);}
  chmodSync(witness,0o644);assert.throws(()=>resolveP047ProxyHostPins(root,[manifest.original]),/readonly/);chmodSync(witness,0o444);
  env.NODE_ENV='production';const original=[manifest.original];assert.equal(resolveP047ProxyHostPins(root,original),original);
 }finally{if(phase===undefined)delete process.env.HELP_MATH_G678_CALIBRATION_PHASE;else process.env.HELP_MATH_G678_CALIBRATION_PHASE=phase;if(node===undefined)delete env.NODE_ENV;else env.NODE_ENV=node;rmSync(root,{recursive:true,force:true});}
});

test('composed successor proves only the DAT L02 guards above the exact P047 proxy',()=>{
 const env:Record<string,string|undefined>=process.env;
 const phase=env.HELP_MATH_G678_CALIBRATION_PHASE,node=env.NODE_ENV;
 process.env.HELP_MATH_G678_CALIBRATION_PHASE='frozen16-continuous-audio-provisional-browser-qa';env.NODE_ENV='test';
 const root=realpathSync(mkdtempSync(path.join(os.tmpdir(),'p047-dat-proxy-test-')));
 try{
  const prior=JSON.parse(readFileSync(path.join(ROOT,P047_PROXY_SUCCESSOR.path),'utf8'));
  const combined=JSON.parse(readFileSync(path.join(ROOT,P047_DAT_L02_COMPOSED_SUCCESSOR.path),'utf8'));
  const pins=[P047_PROXY_SUCCESSOR,prior.witness,...prior.currentFiles.slice(1),
    P047_DAT_L02_COMPOSED_SUCCESSOR,combined.currentProxy,...combined.newGuardModules];
  for(const pin of pins){const file=path.join(root,pin.path);mkdirSync(path.dirname(file),{recursive:true});copyFileSync(path.join(ROOT,pin.path),file);}
  writeFileSync(path.join(root,'apps/web/proxy.ts'),datOnlyProxy());
  chmodSync(path.join(root,prior.witness.path),0o444);
  assert.equal(createHash('sha256').update(p047OnlyProxy()).digest('hex'),combined.predecessorProxy.sha256);
  const expanded=resolveP047ProxyHostPins(root,[prior.original]);
  assert.equal(expanded.length,9);
  assert.deepEqual(expanded.find(pin=>pin.path==='apps/web/proxy.ts'),combined.currentProxy);
  assert.ok(expanded.some(pin=>pin.path===P047_DAT_L02_COMPOSED_SUCCESSOR.path));
  for(const pin of expanded)assert.equal(createHash('sha256').update(readFileSync(path.join(root,pin.path))).digest('hex'),pin.sha256);
  for(const pin of [combined.currentProxy,...combined.newGuardModules,P047_DAT_L02_COMPOSED_SUCCESSOR]){
   const file=path.join(root,pin.path),bytes=readFileSync(file);
   writeFileSync(file,Buffer.concat([bytes,Buffer.from('\n')]));
   assert.throws(()=>resolveP047ProxyHostPins(root,[prior.original]),/exact bytes/);
   writeFileSync(file,bytes);
  }
  assert.throws(()=>composeP047DatL02Proxy('not a P047 proxy'),/single DAT import anchor/);
 }finally{if(phase===undefined)delete process.env.HELP_MATH_G678_CALIBRATION_PHASE;else process.env.HELP_MATH_G678_CALIBRATION_PHASE=phase;if(node===undefined)delete env.NODE_ENV;else env.NODE_ENV=node;rmSync(root,{recursive:true,force:true});}
});

test('the third successor admits only P006 evidence access above both unchanged predecessor deltas',()=>{
 const env:Record<string,string|undefined>=process.env;
 const phase=env.HELP_MATH_G678_CALIBRATION_PHASE,node=env.NODE_ENV;
 process.env.HELP_MATH_G678_CALIBRATION_PHASE='frozen16-continuous-audio-provisional-browser-qa';env.NODE_ENV='test';
 const root=realpathSync(mkdtempSync(path.join(os.tmpdir(),'p006-admission-proxy-test-')));
 try{
  const prior=JSON.parse(readFileSync(path.join(ROOT,P047_PROXY_SUCCESSOR.path),'utf8'));
  const dat=JSON.parse(readFileSync(path.join(ROOT,P047_DAT_L02_COMPOSED_SUCCESSOR.path),'utf8'));
  const admission=JSON.parse(readFileSync(path.join(ROOT,P006_ADMISSION_PROXY_SUCCESSOR.path),'utf8'));
  const pins=[P047_PROXY_SUCCESSOR,prior.witness,...prior.currentFiles.slice(1),
   P047_DAT_L02_COMPOSED_SUCCESSOR,...dat.newGuardModules,
   P006_ADMISSION_PROXY_SUCCESSOR,admission.predecessorWitness,admission.newGuardModule,admission.currentProxy];
  for(const pin of pins){const file=path.join(root,pin.path);mkdirSync(path.dirname(file),{recursive:true});copyFileSync(path.join(ROOT,pin.path),file);}
  for(const pin of [prior.witness,admission.predecessorWitness])chmodSync(path.join(root,pin.path),0o444);
  assert.equal(composeP047DatL02Proxy(p047OnlyProxy()),datOnlyProxy());
  const expanded=resolveP047ProxyHostPins(root,[prior.original]);
  assert.equal(expanded.length,12);
  assert.deepEqual(expanded[0],prior.witness);
  assert.deepEqual(expanded.find(pin=>pin.path==='apps/web/proxy.ts'),admission.currentProxy);
  assert.ok(expanded.some(pin=>pin.path===P047_DAT_L02_COMPOSED_SUCCESSOR.path));
  assert.ok(expanded.some(pin=>pin.path===P006_ADMISSION_PROXY_SUCCESSOR.path));
  assert.ok(expanded.some(pin=>pin.path===admission.predecessorWitness.path));
  for(const pin of expanded)assert.equal(createHash('sha256').update(readFileSync(path.join(root,pin.path))).digest('hex'),pin.sha256);
  assert.notEqual(admission.currentProxy.sha256,prior.original.sha256);
  assert.notEqual(admission.currentProxy.sha256,dat.currentProxy.sha256);
  for(const pin of [admission.currentProxy,admission.newGuardModule,P006_ADMISSION_PROXY_SUCCESSOR,admission.predecessorWitness]){
   const file=path.join(root,pin.path),bytes=readFileSync(file);
   const witness=pin.path===admission.predecessorWitness.path;
   if(witness)chmodSync(file,0o644);
   writeFileSync(file,Buffer.concat([bytes,Buffer.from('\n')]));
   if(witness)chmodSync(file,0o444);
   assert.throws(()=>resolveP047ProxyHostPins(root,[prior.original]),/exact bytes/);
   if(witness)chmodSync(file,0o644);
   writeFileSync(file,bytes);if(witness)chmodSync(file,0o444);
  }
  const witness=path.join(root,admission.predecessorWitness.path);
  chmodSync(witness,0o644);assert.throws(()=>resolveP047ProxyHostPins(root,[prior.original]),/readonly P006 admission witness/);chmodSync(witness,0o444);
  assert.throws(()=>composeP006AdmissionProxy('not the composed predecessor'),/single P006 admission import anchor/);
  assert.throws(()=>composeP006AdmissionProxy(datOnlyProxy()+datOnlyProxy()),/single P006 admission import anchor/);
  const missingDat=path.join(root,P047_DAT_L02_COMPOSED_SUCCESSOR.path),datBytes=readFileSync(missingDat);
  rmSync(missingDat);assert.throws(()=>resolveP047ProxyHostPins(root,[prior.original]),/exact P006 admission composed successor scope/);writeFileSync(missingDat,datBytes);
  env.NODE_ENV='production';const original=[prior.original];assert.equal(resolveP047ProxyHostPins(root,original),original);
 }finally{if(phase===undefined)delete process.env.HELP_MATH_G678_CALIBRATION_PHASE;else process.env.HELP_MATH_G678_CALIBRATION_PHASE=phase;if(node===undefined)delete env.NODE_ENV;else env.NODE_ENV=node;rmSync(root,{recursive:true,force:true});}
});
