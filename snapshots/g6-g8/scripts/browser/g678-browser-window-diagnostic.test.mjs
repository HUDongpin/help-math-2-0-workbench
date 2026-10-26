import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {retainOwnedAudioBrowserInspection} from './g678-actual-audio-collector-v1.mjs';
import {readOwnedContextWindows} from './g678-course-technical-collector-v1.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
function fixture(t) {
 const outputDirectory=fs.mkdtempSync(path.join(here,'.test-owned-window-'));
 t.after(()=>fs.rmSync(outputDirectory,{recursive:true,force:true}));
 return {outputDirectory,profile:'/synthetic-owned-profile',mainPid:12345,audioPid:12346,args:['--inspect','--pid','12345','--audio-pid','12346'],
  inspection:{kind:'browser-audio-target-inspection-v1',identity:{pid:12345},audioProcess:{pid:12346,parentPID:12345},windows:[{windowID:101,pid:12345,width:1442,height:939}]}};
}
test('one exact owned window retains the existing successful receipt',t=>{
 const f=fixture(t),result=retainOwnedAudioBrowserInspection(f);
 assert.strictEqual(result.inspection,f.inspection);assert.equal(path.basename(result.receipt.path),'browser-inspection.json');
 assert.deepEqual(JSON.parse(fs.readFileSync(result.receipt.path)).windows,f.inspection.windows);
 assert(!fs.existsSync(path.join(f.outputDirectory,'browser-inspection-rejected.json')));
});
test('two native windows remain rejected and both identities survive the failed guard',t=>{
 const f=fixture(t);f.inspection.windows.push({windowID:102,pid:f.mainPid,width:420,height:70});let failure;
 try{retainOwnedAudioBrowserInspection(f);}catch(error){failure=error;}
 assert.match(String(failure),/one owned browser window/);assert.equal(failure.actual,2);assert.equal(failure.expected,1);
 const rejected=JSON.parse(fs.readFileSync(failure.inspectionPin.path));assert.equal(rejected.status,'rejected');assert.equal(rejected.acceptance,false);
 assert.deepEqual(rejected.windows,f.inspection.windows);assert.deepEqual(rejected.arguments,f.args);
 assert(!fs.existsSync(path.join(f.outputDirectory,'browser-inspection.json')));
});
for(const [label,mutate]of [
 ['browser PID',f=>f.inspection.identity.pid++],['audio PID',f=>f.inspection.audioProcess.pid++],
 ['audio parent',f=>f.inspection.audioProcess.parentPID++],['window owner',f=>f.inspection.windows[0].pid++],
])test('rejected '+label+' does not produce a success receipt',t=>{
 const f=fixture(t);mutate(f);assert.throws(()=>retainOwnedAudioBrowserInspection(f));
 assert.equal(JSON.parse(fs.readFileSync(path.join(f.outputDirectory,'browser-inspection-rejected.json'))).acceptance,false);
 assert(!fs.existsSync(path.join(f.outputDirectory,'browser-inspection.json')));
});
test('a rejected-receipt collision preserves both the old bytes and the identity error',t=>{
 const f=fixture(t);f.inspection.windows.push({windowID:102,pid:f.mainPid});
 const prior=path.join(f.outputDirectory,'browser-inspection-rejected.json');fs.writeFileSync(prior,'retained prior failure');let failure;
 try{retainOwnedAudioBrowserInspection(f);}catch(error){failure=error;}
 assert.match(String(failure),/one owned browser window/);assert.match(failure.inspectionRetentionError,/EEXIST/);
 assert.equal(fs.readFileSync(prior,'utf8'),'retained prior failure');assert(!failure.inspectionPin);
});
function contextFixture({failTarget=false,failDetach=false}={}) {
 const calls=[],pages=[0,1].map(i=>({url:()=>`http://127.0.0.1:3331/owned-${i}`,isClosed:()=>false}));
 const context={pages:()=>pages,newCDPSession:async page=>{
  const index=pages.indexOf(page);assert(index>=0,'only this context may be inspected');calls.push(['attach',index]);
  return {send:async(method,args)=>{calls.push([method,index,args]);
   if(method==='Target.getTargetInfo'){if(failTarget&&index===0)throw Error('target unavailable');return {targetInfo:{targetId:'target-'+index,type:'page',browserContextId:'owned-context'}};}
   assert.equal(method,'Browser.getWindowForTarget');assert.deepEqual(args,{targetId:'target-'+index});return {windowId:10+index,bounds:{width:800,height:600}};
  },detach:async()=>{calls.push(['detach',index]);if(failDetach&&index===0)throw Error('detach unavailable');}};
 }};
 return {calls,pages,context};
}
test('CDP mapping inspects only current context pages and detaches each read-only session',async()=>{
 const f=contextFixture(),observed=await readOwnedContextWindows(f.context,f.pages[1]);
 assert.equal(observed.acceptance,false);assert.equal(observed.readOnly,true);assert.equal(observed.pages.length,2);
 assert.deepEqual(observed.pages.map(p=>p.currentPage),[false,true]);assert.deepEqual(observed.pages.map(p=>p.target.browserContextId),['owned-context','owned-context']);
 assert.deepEqual(observed.pages.map(p=>p.window.windowId),[10,11]);
 assert.deepEqual(f.calls.map(c=>c[0]),['attach','Target.getTargetInfo','Browser.getWindowForTarget','detach','attach','Target.getTargetInfo','Browser.getWindowForTarget','detach']);
 assert.match(observed.windowIdScope,/correspondence.*not assumed/);
});
test('failed target inspection still detaches and retains the next owned page',async()=>{
 const f=contextFixture({failTarget:true}),observed=await readOwnedContextWindows(f.context,f.pages[0]);
 assert.match(observed.pages[0].error,/target unavailable/);assert.equal(observed.pages[1].window.windowId,11);
 assert.equal(f.calls.filter(c=>c[0]==='detach').length,2);
});
test('session-detach failure stays visible without dropping the window facts',async()=>{
 const f=contextFixture({failDetach:true}),observed=await readOwnedContextWindows(f.context,f.pages[0]);
 assert.equal(observed.pages[0].window.windowId,10);assert.match(observed.pages[0].detachError,/detach unavailable/);
 assert.equal(observed.pages[1].window.windowId,11);
});

// Execute the actual collector guard block with process/CDP boundaries replaced.
// This tests propagation, retention and ordering without launching a browser or native tool.
const collector=fs.readFileSync(path.join(here,'g678-course-technical-collector-v1.mjs'),'utf8');
const start=collector.indexOf('    let inspected;'),end=collector.indexOf('    cell.audioIdentity=',start);
assert(start>0&&end>start,'actual collector guard source exists');
const guard=collector.slice(start,end);
async function exerciseGuard({attached=true,inspectError=null,preparedError=null,mappingError=null}={}) {
 const calls=[],cell={},diagnostics=[],inspection={kind:'synthetic-inspection'},receipt={path:'synthetic-success.json',bytes:1,sha256:'a'.repeat(64)};
 const sandbox={path,directory:'/synthetic-cell',audioTools:{},profile:'/synthetic-owned-profile',identity:{mainPid:12345},
  attachedBrowser:attached?{}:null,config:{browser:{}},attachmentFailure:null,context:{},page:{},cell,diagnostics,
  inspectOwnedAudioBrowser:async()=>{calls.push('inspect');if(inspectError)throw inspectError;return {inspection,receipt};},
  assertPreparedBrowser:()=>{calls.push('prepared');if(preparedError)throw preparedError;},
  readOwnedContextWindows:async()=>{calls.push('mapping');if(mappingError)throw mappingError;return {pages:[],acceptance:false};},
  put:(directory,name,value)=>{calls.push('retain');assert.equal(name,'audio-window-observation.json');assert.equal(value.acceptance,false);return {path:directory+'/'+name};},
 };
 let result,error;try{result=await vm.runInNewContext('(async()=>{'+guard+'return inspected;})()',sandbox);}catch(caught){error=caught;}
 return {sandbox,calls,cell,diagnostics,result,error};
}
test('native inspection failure marks the attached browser unusable before diagnostic retention',async()=>{
 const original=Object.assign(Error('one owned browser window'),{inspectionPin:{path:'rejected.json'}}),f=await exerciseGuard({inspectError:original});
 assert.strictEqual(f.error,original);assert.equal(f.sandbox.attachmentFailure,String(original));assert.strictEqual(f.cell.rejectedAudioInspection,original.inspectionPin);
 assert.deepEqual(f.calls,['inspect','mapping','retain']);assert(f.cell.audioWindowObservation);
});
test('prepared identity failure marks attachment failure and retains current owned mapping',async()=>{
 const original=Error('same actual browser launch'),f=await exerciseGuard({preparedError:original});
 assert.strictEqual(f.error,original);assert.equal(f.sandbox.attachmentFailure,String(original));assert.deepEqual(f.calls,['inspect','prepared','mapping','retain']);
});
test('diagnostic read failure never replaces the original rejected identity or clears attachment failure',async()=>{
 const original=Error('one owned browser window'),f=await exerciseGuard({inspectError:original,mappingError:Error('CDP diagnostic failed')});
 assert.strictEqual(f.error,original);assert.equal(f.sandbox.attachmentFailure,String(original));assert.equal(f.diagnostics[0].stage,'owned-window-observation');
 assert.match(f.diagnostics[0].reason,/CDP diagnostic failed/);assert.deepEqual(f.calls,['inspect','mapping']);
});
test('native evidence retention failure is explicit while the original guard still rejects',async()=>{
 const original=Object.assign(Error('one owned browser window'),{inspectionRetentionError:'EEXIST'}),f=await exerciseGuard({inspectError:original});
 assert.strictEqual(f.error,original);assert.equal(f.diagnostics[0].stage,'retain-rejected-audio-inspection');assert.equal(f.diagnostics[0].reason,'EEXIST');
});
test('separately launched cell retains failure without declaring another attachment unusable',async()=>{
 const original=Error('one owned browser window'),f=await exerciseGuard({attached:false,inspectError:original});
 assert.strictEqual(f.error,original);assert.equal(f.sandbox.attachmentFailure,null);assert.deepEqual(f.calls,['inspect','mapping','retain']);
});
test('successful inspected identity proceeds without failure mapping or attachment mutation',async()=>{
 const f=await exerciseGuard();assert.equal(f.error,undefined);assert.equal(f.sandbox.attachmentFailure,null);assert.deepEqual(f.calls,['inspect','prepared']);
 assert.equal(f.cell.audioWindowObservation,undefined);assert.equal(f.result.receipt.path,'synthetic-success.json');
});
