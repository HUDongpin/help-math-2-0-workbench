import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {P005_ID,P005_SHA,createP005RuntimeAdapter,p005GlossaryIssues,p005TerminalHeld,p005CaptureGroups,p005AudioBoundaryReady,p005AudioAdvanced,p005GroupImageCoverage,readP005Destination} from './g678-nms-l07-p005-flow-v1.mjs';

const clone=value=>structuredClone(value);
const sample=(atMs=1000,frame=145,tick=150)=>({atMs,status:'ready',identity:{ownerKind:'source-vm',animationId:P005_ID,sourceSha256:P005_SHA,playerId:'p005-live-owner',leaseToken:'p005-live-lease',replay:0},source:{frameDomain:'sprite-40',frame,tick,errors:[],missing:[]},render:{status:'ready',commitId:'actual-commit'},host:{paused:true},dom:{documentHidden:false,rootFrame:6,focusButtonId:null,glossary:{entryId:null,sourceSha256:null,text:null}}});
function adapterFixture() {
 const value=sample(),resource={},actualOwner={...value.identity,animationId:'shared-nms002-l07-p006',playerId:'p006-live-owner'};
 const focused={closest:()=>focused,getAttribute:()=>38};
 const sentence={getAttribute:()=> 'en'},dialog={getAttribute:key=>key==='data-glossary-entry-id'?'comparison':'b'.repeat(64),innerText:'Comparison\nActual definition'};
 const root={contains:node=>node===focused,getAttribute:key=>key==='data-hfr-source-sha256'?value.identity.sourceSha256:'6',querySelector:()=>sentence};
 const document={hidden:false,activeElement:focused,querySelector:selector=>selector.startsWith('[data-hfr-page=')?root:dialog};
 const calls=[],base={read:()=>value,ownerForOperation:(kind,observed)=>{calls.push({kind,observed});return actualOwner;}};
 const window={__g678TechnicalObserver:{records:{contextOps:[]}},__g678SourceVmHtmlMediaObserver:{records:{operations:[],samples:[]}}};
 const adapter=vm.runInNewContext(`(${createP005RuntimeAdapter.toString()})(base)`,{base,document,window,structuredClone});
 return {value,resource,actualOwner,calls,base,adapter};
}
test('P005 decoration preserves actual producer state and known foreign resource ownership',()=>{
 const f=adapterFixture(),result=f.adapter.read();assert.strictEqual(result.source,f.value.source);assert.strictEqual(result.render,f.value.render);assert.strictEqual(result.identity,f.value.identity);
 assert.equal(result.dom.rootFrame,6);assert.equal(result.dom.contentLanguage,'en');assert.equal(result.dom.focusButtonId,38);
 assert.strictEqual(f.adapter.ownerForOperation,f.base.ownerForOperation);
 assert.strictEqual(f.adapter.ownerForOperation('html-media',f.resource),f.actualOwner,'known P006 must not become null and inherit a P005 callback owner');
 assert.strictEqual(f.calls[0].observed,f.resource);assert.equal(f.value.dom.focusButtonId,null,'producer result remains unmodified');
});
test('P005 cannot decorate a different animation or source hash into ready',()=>{
 for(const [key,value] of [['animationId','shared-nms002-l07-p006'],['sourceSha256','f'.repeat(64)]]){const f=adapterFixture();f.value.identity[key]=value;assert.equal(f.adapter.read().status,'unsupported');}
 const f=adapterFixture();f.value.status='loading';assert.strictEqual(f.adapter.read(),f.value);
});
function glossaryFixture(locale='en') {
 const control={entryId:'comparison',buttonId:38,definitions:{en:'Source English definition',es:'Definición española original'},dictionarySource:{en:{sha256:'b'.repeat(64)},es:{sha256:'c'.repeat(64)}}};
 const before=sample(900,144,149);before.host.paused=false;
 const opened=sample(1000);opened.dom.glossary={entryId:control.entryId,sourceSha256:control.dictionarySource[locale].sha256,text:control.definitions[locale]};
 const held=clone(opened);held.atMs=1400;
 const closed=sample(1500);closed.dom.focusButtonId=38;
 const resumed=sample(1600,146,151);resumed.host.paused=false;
 return {control,locale,before,opened,held,closed,resumed};
}
test('both exact locale definitions require held source, same owner, returned focus and explicit resume',()=>{
 for(const locale of ['en','es'])assert.deepEqual(p005GlossaryIssues(glossaryFixture(locale)),[]);
});
for(const [name,mutate,code] of [
 ['wrong glossary locale',f=>{f.opened.dom.glossary.text=f.control.definitions.es;},'source-glossary-content-mismatch'],
 ['wrong dictionary source',f=>{f.opened.dom.glossary.sourceSha256='0'.repeat(64);},'source-glossary-content-mismatch'],
 ['word opened after authored stop',f=>{f.opened.source.frame=157;},'glossary-outside-source-resumable-window'],
 ['tick advanced behind modal',f=>{f.held.source.tick++;},'glossary-did-not-hold-source'],
 ['insufficient hold',f=>{f.held.atMs=1100;},'glossary-did-not-hold-source'],
 ['close silently resumed',f=>{f.closed.host.paused=false;},'close-did-not-preserve-source-hold'],
 ['focus did not return',f=>{f.closed.dom.focusButtonId=39;},'close-did-not-return-focus-to-real-trigger'],
 ['Play did not advance source',f=>{f.resumed.source.frame=145;},'explicit-play-did-not-resume-source'],
 ['owner changed on close',f=>{f.closed.identity.leaseToken='foreign';},'exact-source-owner-changed'],
])test(name,()=>{const f=glossaryFixture();mutate(f);assert(p005GlossaryIssues(f).includes(code));});
test('authored terminal hold must remain unpaused and visible while actual runtime ticks advance',()=>{
 const first=sample(1000,157,162),last=sample(1400,157,166);first.host.paused=last.host.paused=false;
 assert.equal(p005TerminalHeld(first,last),true);
 for(const mutate of [s=>{s.host.paused=true;},s=>{s.dom.documentHidden=true;},s=>{s.source.frame=156;},s=>{s.source.tick=162;},s=>{s.atMs=1200;},s=>{s.dom.rootFrame=1;},s=>{s.source.errors=['draw failed'];},s=>{s.identity.leaseToken='foreign';}]){const bad=clone(last);mutate(bad);assert.equal(p005TerminalHeld(first,bad),false);}
});
test('capture planning retains every declared simultaneous target and separate stage',()=>{
 const parameters={layoutTargets:{stage:'canvas',sentence:'.sentence',comparison:'.comparison',proportion:'.proportion'}},contract={layout:{targetIds:['stage','sentence','comparison','proportion'],simultaneousGroups:{terminal:[['sentence','comparison','proportion']]}}};
 const groups=p005CaptureGroups(parameters,contract,'terminal');assert.deepEqual(groups.map(g=>g.targetIds),[['sentence','comparison','proportion'],['stage']]);
 assert.equal(groups[0].scope,'target');assert.equal(groups[1].scope,'stage');
 delete parameters.layoutTargets.proportion;assert.throws(()=>p005CaptureGroups(parameters,contract,'terminal'),/actual selectors/);
 parameters.layoutTargets.proportion='.proportion';contract.layout.simultaneousGroups.terminal[0].push('not-declared');assert.throws(()=>p005CaptureGroups(parameters,contract,'terminal'),/exact state targets/);
});
test('navigation reads exact destination producer and rejects a parent marker without real drawing',()=>{
 const animationId='shared-nms002-l07-p006',sourceSha256='a'.repeat(64),observed=sample();observed.identity.animationId=animationId;observed.identity.sourceSha256=sourceSha256;observed.source.frame=3;
 const surface={__g678TechnicalRead:()=>observed},root={getAttribute:()=>sourceSha256,querySelector:()=>surface},host={getAttribute:()=>animationId};
 const document={querySelector:selector=>selector.startsWith('[data-hfr-page=')?root:host},read=()=>vm.runInNewContext(`(${readP005Destination.toString()})(arg)`,{document,performance:{now:()=>1000},arg:{animationId,sourceSha256}});
 assert.equal(read().animationId,animationId);
 observed.render.status='blocked';assert.equal(read(),null);observed.render.status='ready';observed.source.frameDomain='root';assert.equal(read(),null);
 observed.source.frameDomain='sprite-186';observed.identity.sourceSha256=P005_SHA;assert.equal(read(),null);
});


test('public Pause waits for actual suspended context and settled operations; Play requires same advancing clock',()=>{
 const cue={transport:'web-audio-buffer'},held=sample();held.dom.pendingSourceMediaControls=0;held.media={contexts:[{contextId:'actual-context',state:'suspended',currentTime:2.5}]};
 assert.equal(p005AudioBoundaryReady(held,cue,true),true);
 for(const mutate of [s=>{s.media.contexts=[];},s=>{s.media.contexts[0].state='running';},s=>{s.media.contexts[0].currentTime=null;},s=>{s.dom.pendingSourceMediaControls=1;},s=>{delete s.dom.pendingSourceMediaControls;}]){const bad=clone(held);mutate(bad);assert.equal(p005AudioBoundaryReady(bad,cue,true),false);}
 const resumed=clone(held);resumed.host.paused=false;resumed.media.contexts[0]={contextId:'actual-context',state:'running',currentTime:2.6};assert.equal(p005AudioAdvanced(held,resumed,cue),true);
 resumed.media.contexts[0].contextId='replacement-context';assert.equal(p005AudioAdvanced(held,resumed,cue),false);
});
test('HTML control boundary requires fresh exact-owner/source state and continuous real media clock',()=>{
 const cue={transport:'html-media',sourceUrl:'http://127.0.0.1:3331/source-spanish.mp3'},held=sample();held.dom.pendingSourceMediaControls=0;
 held.dom.sourceHtmlMedia={atMs:995,owner:clone(held.identity),mediaElementId:'actual-html-element',state:{currentSrc:cue.sourceUrl,currentTime:2.5,paused:true,ended:false,seeking:false,muted:false,volume:1,playbackRate:1,defaultPlaybackRate:1,readyState:4}};
 assert.equal(p005AudioBoundaryReady(held,cue,true),true);
 for(const mutate of [s=>{s.dom.sourceHtmlMedia.atMs=900;},s=>{s.dom.sourceHtmlMedia.owner.playerId='foreign';},s=>{s.dom.sourceHtmlMedia.state.currentSrc='another-source';},s=>{s.dom.sourceHtmlMedia.state.paused=false;},s=>{s.dom.sourceHtmlMedia.state.ended=true;},s=>{s.dom.pendingSourceMediaControls=1;}]){const bad=clone(held);mutate(bad);assert.equal(p005AudioBoundaryReady(bad,cue,true),false);}
 const resumed=clone(held);resumed.host.paused=false;resumed.dom.sourceHtmlMedia.state.paused=false;resumed.dom.sourceHtmlMedia.state.currentTime=2.6;assert.equal(p005AudioAdvanced(held,resumed,cue),true);
 resumed.dom.sourceHtmlMedia.mediaElementId='replacement-element';assert.equal(p005AudioAdvanced(held,resumed,cue),false);
});


test('a screenshot of the first target must actually cover every group member rectangle',()=>{
 const group={targetId:'sentence',targetIds:['sentence','comparison','proportion']},rect=(left,top,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top});
 const observation={layout:{targets:[{id:'sentence',rect:rect(10,20,310,220)},{id:'comparison',rect:rect(20,100,80,130)},{id:'proportion',rect:rect(90,100,160,130)}]}};
 assert.equal(p005GroupImageCoverage(group,observation).complete,true);
 observation.layout.targets[2].rect=rect(320,100,390,130);const outside=p005GroupImageCoverage(group,observation);assert.equal(outside.complete,false);assert.deepEqual(outside.outsideImageTargetIds,['proportion']);
 observation.layout.targets.pop();const missing=p005GroupImageCoverage(group,observation);assert.equal(missing.complete,false);assert.deepEqual(missing.missingTargetIds,['proportion']);
});
