/** Maintained five-page source producer. The root caller owns installation,
 * host versions, registry admission, browser validation and acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire,builtinModules} from 'node:module';
import {pinFile,readPin,readJsonPin,uniquePins,verifyHostVersion,admissionArtifactPins,admissionSourcePins} from './g678-admission-proof.mjs';
import {verifyPageHostInputBoundary,partitionPageHostInputs} from '../scripts/lib/g678-page-host-input-boundary-v1.mjs';

export const NEXT_FIVE_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const NEXT_FIVE_IDS=Object.freeze([38,39,46,47,48].map(n=>`shared-alg001-l08-p${String(n).padStart(3,'0')}`));
const mutable=new Set(['packages/demos/private-current-js-registry.json','packages/demos/src/registry.local-only.generated.ts','packages/demos/src/registry.local-only.metadata.generated.ts','apps/web/lib/g678-admission-activation.ts']);
const self='lib/alg-l08-next-five-admission-v1.mjs';
const trigger=Object.freeze({kind:'explicit-user-only',localeAutoplay:false,timelineBehavior:'pause-and-return-held',splicedIntoNarration:false});
const acceptanceEffects=Object.freeze({originalRuntime:false,fidelity:false,listening:false,human:false,owner:false,fullTypography:false,fullAccessibility:false,performance:false,strict:false,release:false,publication:false,deployment:false});
const builtin=new Set([...builtinModules,...builtinModules.map(n=>'node:'+n)]);
const toOriginal=p=>({...p,path:path.relative(NEXT_FIVE_SOURCE_ROOT,p.path)});
const onlyPin=p=>({path:p.path,bytes:p.bytes,sha256:p.sha256});
const externalKey=e=>e.root+'\0'+e.pin.path;
const externals=pins=>[...new Map(pins.map(p=>[externalKey(p),p])).values()].sort((a,b)=>externalKey(a).localeCompare(externalKey(b)));
const absolutePin=file=>{const physical=fs.realpathSync(file),root=path.dirname(physical);return{root,pin:pinFile(root,path.basename(physical))};};
const immutable=(root,name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});if(fs.existsSync(file))assert.equal(fs.readFileSync(file,'utf8'),bytes,'immutable producer output '+name);else fs.writeFileSync(file,bytes,{flag:'wx'});return pinFile(root,name);};

/** Parse actual installed source, including re-exports, type imports, literal
 * require/import and the project's @/ alias. Unresolved/computed local edges
 * are errors. Shared-host edges terminate only at exact verified host pins. */
export function collectNextFiveCodeClosure(root,seeds,hostPin,{verifyWholeHost=true}={}){
 const host=verifyWholeHost?verifyHostVersion(root,hostPin):readJsonPin(root,hostPin),covered=new Map(host.files.map(p=>[p.path,p]));
 const req=createRequire(path.join(root,'package.json')),tsPath=req.resolve('typescript'),ts=req('typescript');
 const files=new Map(),external=[absolutePin(tsPath)],edges=[],packages=new Map();
 const packageFor=(resolved,specifier)=>{
  let dir=path.dirname(fs.realpathSync(resolved));while(!fs.existsSync(path.join(dir,'package.json'))){const next=path.dirname(dir);assert.notEqual(next,dir,'external package manifest '+specifier);dir=next;}
  if(!packages.has(dir)){const manifest=absolutePin(path.join(dir,'package.json'));packages.set(dir,{name:JSON.parse(readPin(manifest.root,manifest.pin)).name,root:dir,manifest});external.push(manifest);}
  return dir;
 };
 packageFor(tsPath,'typescript');
 const resolveLocal=(from,specifier)=>{
  const base=specifier.startsWith('@/')?'apps/web/'+specifier.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(from),specifier));
  assert(!base.startsWith('../')&&!path.isAbsolute(base),'bounded local module '+from+' -> '+specifier);
  const attempts=[base,...['.ts','.tsx','.mjs','.js','.cjs','.json','.css','.d.ts','/index.ts','/index.tsx','/index.mjs','/index.js'].map(ext=>base+ext)];
  if(/\.[cm]?jsx?$/.test(base))attempts.push(base.replace(/\.[cm]?jsx?$/,'.ts'),base.replace(/\.[cm]?jsx?$/,'.tsx'));
  const found=attempts.find(n=>fs.existsSync(path.join(root,n))&&fs.statSync(path.join(root,n)).isFile());assert(found,'resolved local module '+from+' -> '+specifier);assert(!mutable.has(found),'mutable admission input cannot become fixed producer evidence: '+found);return found;
 };
 const queue=[...new Set(seeds)];
 while(queue.length){
  const name=queue.shift();if(files.has(name))continue;assert(!mutable.has(name));const pin=pinFile(root,name);files.set(name,pin);
  if(covered.has(name)){assert.deepEqual(pin,covered.get(name),'current host import '+name);continue;}
  if(!/\.[cm]?[jt]sx?$/.test(name))continue;
  const text=readPin(root,pin).toString(),tree=ts.createSourceFile(name,text,ts.ScriptTarget.Latest,true,name.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS),specifiers=[];
  assert.equal(tree.parseDiagnostics.length,0,'parse installed source '+name);
  const visit=node=>{
   if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier){assert(ts.isStringLiteralLike(node.moduleSpecifier),'literal import/export');specifiers.push(node.moduleSpecifier.text);}
   if(ts.isImportEqualsDeclaration(node)&&ts.isExternalModuleReference(node.moduleReference)){const expression=node.moduleReference.expression;assert(expression&&ts.isStringLiteralLike(expression),'literal import-equals module');specifiers.push(expression.text);}
   if(ts.isImportTypeNode(node)&&ts.isLiteralTypeNode(node.argument)&&ts.isStringLiteralLike(node.argument.literal))specifiers.push(node.argument.literal.text);
   if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||(ts.isIdentifier(node.expression)&&node.expression.text==='require'))){assert(node.arguments.length===1&&ts.isStringLiteralLike(node.arguments[0]),'computed import is not admitted: '+name);specifiers.push(node.arguments[0].text);}
   ts.forEachChild(node,visit);
  };visit(tree);
  for(const specifier of [...new Set(specifiers)].sort()){
   if(builtin.has(specifier)){edges.push({from:name,specifier,kind:'node-builtin'});continue;}
   if(specifier.startsWith('.')||specifier.startsWith('@/')){const target=resolveLocal(name,specifier);edges.push({from:name,specifier,kind:covered.has(target)?'host':'local',target});queue.push(target);}
   else{let resolved;try{resolved=createRequire(path.join(root,name)).resolve(specifier);}catch{resolved=req.resolve(specifier);}const binding=absolutePin(resolved),packageRoot=packageFor(resolved,specifier);external.push(binding);edges.push({from:name,specifier,kind:'package-entry',binding,packageRoot});}
  }
 }
 // The producer's JavaScript engine and resolution metadata are actual inputs.
 for(const n of ['package.json','pnpm-lock.yaml','packages/demos/package.json','apps/web/package.json'])if(fs.existsSync(path.join(root,n)))files.set(n,pinFile(root,n));
 return{seeds:[...new Set(seeds)].sort(),files:uniquePins([...files.values()]),external:externals(external),edges,packages:[...packages.values()].sort((a,b)=>a.root.localeCompare(b.root)),nodeRuntime:{version:process.version,platform:process.platform,architecture:process.arch},localImportsComplete:true,externalEntryBindingsComplete:true,externalExecutionClosure:false,externalExecutionBoundary:'Resolved installed package entries, manifests and TypeScript are pinned. Complete web compiler/runtime package reads are a required later observed host-preflight gate; the Node/OS runtime is environmental, and this source producer does not claim execution closure.'};
}

export function readNextFiveContract(root,contractPin,{installed=true}={}){
 const c=readJsonPin(root,contractPin),p=c.page,id=c.animationId;assert.equal(c.schemaVersion,1);assert(NEXT_FIVE_IDS.includes(id));assert.equal(p.animationId,id);
 for(const pin of c.evidenceFiles)readPin(root,pin);for(const x of c.external)readPin(x.root,x.pin);
 for(const h of c.historicalInputMappings){assert.equal(h.original.bytes,h.snapshot.bytes);assert.equal(h.original.sha256,h.snapshot.sha256);readPin(root,h.snapshot);assert(c.evidenceFiles.some(p=>p.path===h.snapshot.path&&p.sha256===h.snapshot.sha256));}
 if(installed)for(const pin of [...c.installedFiles,...c.sharedFiles])readPin(root,pin);
 const review=readJsonPin(root,p.independentReview);assert(review.pass_&&review.preparedOnly,'exact independent product review');assert.deepEqual(review.subjectManifest,p.manifest);
 const m=readJsonPin(root,p.model),s=readJsonPin(root,c.semantic);assert.equal(m.animationId,id);assert.equal(m.sourceSha256,p.source.sha256);let clocks=m.clocks??[],sa=m.sa;
 const behavior=p.ordinal===38?readJsonPin(root,c.evidenceFiles.find(x=>x.path===`migrations/${id}/native-v1/behavior-model-v1.json`)):m.behavior;
 assert.deepEqual(s.behavior,behavior,'exact authored behavior');assert.deepEqual(s.sourceAnomalies,p.ordinal===38?behavior.sourceAnomalies:m.sourceAnomalies??null);
 for(const k of ['clocks','sa','visualStates','answers','branches'])assert.deepEqual(s[k],m[k]??null,'exact source model '+k);
 if(p.ordinal===38){
  assert.deepEqual([behavior.mainSpriteId,behavior.mainFrames,behavior.quizFrame,behavior.resumeFrame],[585,525,208,209]);assert.equal(behavior.literalAcceptedPointNames,'PT_2,PT_3,PT_4,PT_5');assert.equal(behavior.sourceAnomalies.length,12);assert.deepEqual(behavior.modernRepair,{id:'restore-first-wrong-fixed-point-visibility',onlyOnAttempt:1,preserveSelectedFrames:true,preserveCounter:true,sourceRuntimeFidelity:false});
  const nativePin=c.evidenceFiles.find(x=>x.path==='output/g678-alg-l08-p038-integration-20261008-v2/decode-native-v1.json'),native=readJsonPin(root,nativePin);assert(native.pass&&native.nativeBrowserDecoded&&native.isolatedContextClosed&&!native.sourceAlignmentAccepted&&!native.listeningAccepted);assert.deepEqual(native.streams.map(x=>x.spriteId),[585,'SA']);
  const fields=['sourceBytes','sourceSha256','sampleRate','channels','decodedSamples','pcmSha256'],decoder=x=>Object.fromEntries(fields.map(k=>[k,x[k]]));
  clocks=[{spriteId:585,decoder:decoder(native.streams[0]),segments:[{firstFrame:20,firstDecodedSample:1673,endDecodedSample:3456},{firstFrame:22,firstDecodedSample:3510,endDecodedSample:929088}]}];sa=decoder(native.streams[1]);
  const audioPin=c.installedFiles.find(x=>x.path.endsWith('/alg-l08-p038-audio-source-v1.ts'));if(installed){const audio=readPin(root,audioPin).toString(),match=/main:Object\.freeze\(\{decoder:([\s\S]*?) as const,segments:([\s\S]*?),emptyNegativeBlocks:\[\]\}\),sa:([\s\S]*?) as const\}\);/.exec(audio);assert(match,'literal generated native clock binding');assert.deepEqual(JSON.parse(match[1]),clocks[0].decoder);assert.deepEqual(JSON.parse(match[2]),clocks[0].segments);assert.deepEqual(JSON.parse(match[3]),sa);}
 }
 else if(p.ordinal===39){
  assert.deepEqual([m.mainSpriteId,m.mainFrameCount,m.quizFrame,m.resumeFrame,m.correctAnswer],[308,790,224,225,3]);assert.deepEqual(m.clocks.map(c=>c.spriteId),[308,161,269]);assert.equal(m.answers.find(a=>a.answer===3).letter,'B');assert.equal(m.sourceAnomalies.length,12);
  let total=0,masked=0;for(const span of m.visualStates){assert.equal(span.first,total+1);assert(span.last>=span.first);total=span.last;const masks=span.value.nodes.filter(n=>n.clipDepth);for(let f=span.first;f<=span.last;f++){assert.equal(masks.length,f>=674?1:0,'source mask frame '+f);if(masks.length){assert.equal(masks[0].clipDepth,104);masked++;}}}assert.equal(total,790);assert.equal(masked,117);
  const finalMask=m.visualStates.at(-1).value.nodes.find(n=>n.kind==='vector'&&n.sourceShapeId===299),revealed=m.visualStates.filter(span=>{const nodes=span.value.nodes,mask=nodes.find(n=>n.kind==='vector'&&n.sourceShapeId===299);return mask&&mask.matrix.every((v,i)=>v===finalMask.matrix[i])&&[301,302,303,304,305,306,307].every(id=>nodes.some(n=>n.kind==='text'&&n.sourceCharacterId===id&&n.alpha>0));});assert.equal(revealed[0].first,782,'first complete source formula reveal');
  const presentation=c.installedFiles.find(p=>p.path.endsWith('/alg-l08-p039-presentation-v1.tsx'));if(installed){const text=readPin(root,presentation).toString();assert(text.includes('function MaskVector'));assert(text.includes('<MaskVector'),'maintained direct-path clip geometry');assert(text.includes('mask.matrix.every((value,index)=>value===finalMask.matrix[index])'),'actual source-mask reveal predicate');}
 }else{
  const e={46:[329,804,787,788,[302,462,600,733],[138,154],'A',312,[268,279,290,213,254,181,246]],47:[337,791,774,775,[291,451,589,727],[280,300],'B',321,[84,100,59,112,164,124,136]],48:[332,823,806,807,[317,478,617,752],[248,285],'C',316,[100,79,65,39,132,118,143]]}[p.ordinal],b=behavior;
  assert.deepEqual([m.mainSpriteId,m.mainFrameCount,m.quizFrame,b.postQuizFrame,b.steps.map(x=>x.frame),b.steps.filter(x=>x.box).map(x=>x.box.spriteId),b.options.find(x=>x.right).letter,b.help.spriteId,b.feedback.map(x=>x.spriteId)],e);
  assert.equal(b.options.filter(o=>o.right).length,1);assert.equal(b.feedback.filter(o=>o.kind==='right').length,4);assert.equal(b.feedback.filter(o=>o.kind==='wrong').length,3);
  assert(m.answers.find(a=>a.letter===e[6]).instance==='AnsBtn1');assert.equal(m.clocks.length,8);assert(b.glossary.length>0);
 }
 for(const[token,resource]of Object.entries(p.resourcePins)){const pin=onlyPin(resource);assert(c.installedFiles.some(x=>JSON.stringify(x)===JSON.stringify(pin)),'every routed audio member is an installed page input');if(installed)readPin(root,pin);assert.equal(resource.originalPath,`/flash-assets/g678-local/${id}/${token}`);assert.equal(resource.mode,'cors');assert.equal(resource.destination,'empty');}
 for(const clock of clocks){assert(clock.decoder.decodedSamples>0);const resource=Object.values(p.resourcePins).find(x=>x.bytes===clock.decoder.sourceBytes&&x.sha256===clock.decoder.sourceSha256);assert(resource,'measured decoder source is the routed physical recording');assert(/^[a-f0-9]{64}$/.test(clock.decoder.pcmSha256));}
 assert.equal(p.resourcePins['optional-spanish-audio'].sha256,p.spanishAudio.sha256);readPin(NEXT_FIVE_SOURCE_ROOT,toOriginal(p.source));readPin(NEXT_FIVE_SOURCE_ROOT,c.sourceXml);readPin(NEXT_FIVE_SOURCE_ROOT,toOriginal(p.spanishAudio));
 assert.equal(sa.sourceBytes,p.spanishAudio.bytes);assert.equal(sa.sourceSha256,p.spanishAudio.sha256);assert(sa.decodedSamples>0&&/^[a-f0-9]{64}$/.test(sa.pcmSha256));
 return{contract:c,page:p,model:m,semantic:s,behavior,clocks,sa};
}

function runtimeFor(p,s,artifacts){return{frameDomain:p.frameDomain,frameCount:p.frameCount,rootFrameCount:10,rootBeginFrame:6,beginFrame:1,fps:12,stage:{width:800,height:600},scenario:p.scenario,seed:'0',language:'source-en',quizFrame:p.ordinal===38?s.behavior.quizFrame:p.ordinal===39?224:s.behavior.quizFrame,postQuizFrame:p.ordinal===38?s.behavior.resumeFrame:p.ordinal===39?225:s.behavior.postQuizFrame,playbackMode:'terminal-stop',terminalFrame:p.frameCount,hostPlaybackCompletion:false,originalRuntimeTimingAccepted:false,rendererBinding:artifacts};}

export function buildNextFiveCandidate(root,{contract:contractPin,calibration,version,host,additionalFiles=[],browserEvidence={status:'not-frozen'}}){
 assert(/^[a-z0-9-]+$/.test(calibration));assert(/^(draft|final)-v\d+$/.test(version));assert.equal(fs.realpathSync(root),root);
 const {contract:c,page:p,model:m,semantic:s,behavior,clocks,sa}=readNextFiveContract(root,contractPin),id=c.animationId,short=id.slice(-4),producer=`scripts/lib/g678-alg-l08-${short}-candidate-v1.mjs`,validator=`lib/alg-l08-${short}-admission-semantics-v1.mjs`;
 const hostObject=verifyHostVersion(root,host),hostMap=new Map(hostObject.files.map(x=>[x.path,x]));for(const x of c.sharedFiles)assert.deepEqual(hostMap.get(x.path),x,'selected shared successor belongs to actual host');
 const base=`work/g678-shared-page-factory/alg-l08-${short}-maintained-${calibration}-${version}`;
 const moduleFiles=c.installedFiles.filter(x=>x.path.startsWith('packages/demos/src/'));
 const code=collectNextFiveCodeClosure(root,[...c.installedFiles.map(x=>x.path),producer,validator,self,...additionalFiles],host);
 const member={schemaVersion:1,artifactType:'g678-maintained-native-source-member-v1',animationId:id,source:toOriginal(p.source),reviewedProduct:p.manifest,independentProductReview:p.independentReview,files:moduleFiles,currentJsRegistered:false,acceptance:false};
 const memberPin=immutable(root,`${base}/members/${id}/member-manifest.json`,member);
 const runPin=immutable(root,`${base}/run-manifest.json`,{schemaVersion:1,artifactType:'g678-maintained-native-source-run-v1',animationId:id,implementationLane:'advanced-manual',source:toOriginal(p.source),members:[memberPin],producer:pinFile(root,producer),semanticValidator:pinFile(root,validator),contract:contractPin,additionalFiles:[...additionalFiles].sort(),codeClosure:code,currentJsRegistered:false,acceptance:false});
 const entry={key:id,module:`./modules/${id}`,maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts:{kind:'maintained-dom-module-v1',module:moduleFiles.find(x=>x.path===`packages/demos/src/modules/${id}.tsx`),timeline:moduleFiles.find(x=>x.path===`packages/demos/src/timelines/${id}.ts`),memberManifest:memberPin,sourceRun:runPin}};
 const inputs=uniquePins([...c.evidenceFiles,...c.installedFiles,...c.sharedFiles,...code.files,contractPin,memberPin,runPin]);for(const x of inputs)assert(!mutable.has(x.path),'fixed input excludes mutable admission state');
 const boundary=verifyPageHostInputBoundary(root,host,inputs),external=externals([...c.external,...code.external]);for(const x of external)readPin(x.root,x.pin);
 const packet={schemaVersion:1,calibrationId:calibration,sourceRoot:NEXT_FIVE_SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',source:toOriginal(p.source),sourceXml:c.sourceXml,optionalSpanishAudio:{source:toOriginal(p.spanishAudio),trigger,decoder:sa},entry,selectedPages:[{animationId:id,placementId:id,assetId:`swf-${p.source.sha256}`,sourceSha256:p.source.sha256,moduleCode:'ALG001',lessonNumber:8,globalPageOrdinal:p.ordinal,sourceOccurrence:p.ordinal,sectionCode:p.sectionCode,sectionPageOrdinal:p.sectionPageOrdinal,complexityLane:'behavior-heavy',runtime:runtimeFor(p,s,entry.artifacts)}],behavior,sourceAnomalies:s.sourceAnomalies,embeddedSourceAudio:clocks.map(x=>({spriteId:x.spriteId,decoder:x.decoder,segments:x.segments})),sourceEvidenceContract:contractPin,sourceEvidenceReview:p.independentReview,implementationLane:'advanced-manual',laneSelectionReason:'The exact reviewed source-owned interactions, authored timeline and native audio behavior require the maintained state/session implementation.',browserEvidence,hostInputBoundary:{host,files:boundary.hostManaged},integrity:{scope:c.closureScope,completeTransitiveClosure:false,sourceEvidenceClosure:true,maintainedLocalImportClosure:true,externalEntryBindings:true,externalExecutionClosure:false,files:boundary.pageOwned},acceptanceEffects,productCalibrationPassed:false,scaleOutAuthorized:false,registeredAtProofPreparation:false};
 const freeze=immutable(root,`catalog/product-bridge-calibrations/${calibration}.freeze-${version}.json`,packet);packet.freezeManifest=freeze;
 const registration={calibrationId:calibration,freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,deploymentScope:'local-only',entries:[entry]};
 validateNextFiveCandidate(root,contractPin,packet,registration,calibration);
 return{packet,registration,external,pageOwnedFiles:boundary.pageOwned.length,hostManagedFiles:boundary.hostManaged.length,codeClosure:code,registered:false};
}

export function validateNextFiveCandidate(root,contractPin,packet,registration,calibration){
 const {contract:c,page:p,model:m,semantic:s,behavior,clocks,sa}=readNextFiveContract(root,contractPin),id=c.animationId,e=packet.entry;
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.sourceRoot,packet.scope,packet.deploymentScope],[1,calibration,NEXT_FIVE_SOURCE_ROOT,'private-engineering','local-only']);assert.deepEqual(packet.sourceEvidenceContract,contractPin);assert.deepEqual(packet.sourceEvidenceReview,p.independentReview);assert.deepEqual(admissionSourcePins(packet),[toOriginal(p.source),c.sourceXml,toOriginal(p.spanishAudio)]);
 assert.deepEqual([e.key,e.module,e.maturity,e.complexityLane,e.artifacts.kind],[id,`./modules/${id}`,'private-current-js','behavior-heavy','maintained-dom-module-v1']);for(const x of admissionArtifactPins(e))readPin(root,x);
 const member=readJsonPin(root,e.artifacts.memberManifest),run=readJsonPin(root,e.artifacts.sourceRun);assert.equal(member.animationId,id);assert.deepEqual(member.source,toOriginal(p.source));assert.deepEqual(member.reviewedProduct,p.manifest);assert.deepEqual(member.independentProductReview,p.independentReview);assert.deepEqual(member.files,c.installedFiles.filter(x=>x.path.startsWith('packages/demos/src/')));assert.deepEqual(run.members,[e.artifacts.memberManifest]);assert.deepEqual(run.contract,contractPin);assert(!member.currentJsRegistered&&!member.acceptance&&!run.currentJsRegistered&&!run.acceptance);
 // The common reader independently owns current-host transitions. The semantic
 // validator reconstructs the frozen partition from its immutable host document
 // and verifies every dependency actually read by this page/producer; an
 // unrelated later loader transition is not a new source identity.
 const historicalHost=readJsonPin(root,packet.hostInputBoundary.host),short=id.slice(-4),seeds=[...c.installedFiles.map(x=>x.path),`scripts/lib/g678-alg-l08-${short}-candidate-v1.mjs`,`lib/alg-l08-${short}-admission-semantics-v1.mjs`,self,...run.additionalFiles];
 assert.deepEqual(run.codeClosure.seeds,[...new Set(seeds)].sort(),'complete producer seed set');const freshCode=collectNextFiveCodeClosure(root,seeds,packet.hostInputBoundary.host,{verifyWholeHost:false});assert.deepEqual(freshCode,run.codeClosure,'independently recomputed transitive local and external-entry graph');
 const boundary=partitionPageHostInputs(uniquePins([...c.evidenceFiles,...c.installedFiles,...c.sharedFiles,...run.codeClosure.files,contractPin,e.artifacts.memberManifest,e.artifacts.sourceRun]),historicalHost.files);assert.deepEqual(packet.integrity.files,boundary.pageOwned,'complete exact page input closure');assert.deepEqual(packet.hostInputBoundary.files,boundary.hostManaged,'complete exact shared-host partition');for(const x of run.codeClosure.files)readPin(root,x);for(const x of run.codeClosure.external)readPin(x.root,x.pin);
 assert.equal(packet.selectedPages.length,1);const page=packet.selectedPages[0];assert.deepEqual(page,{animationId:id,placementId:id,assetId:`swf-${p.source.sha256}`,sourceSha256:p.source.sha256,moduleCode:'ALG001',lessonNumber:8,globalPageOrdinal:p.ordinal,sourceOccurrence:p.ordinal,sectionCode:p.sectionCode,sectionPageOrdinal:p.sectionPageOrdinal,complexityLane:'behavior-heavy',runtime:runtimeFor(p,s,e.artifacts)});assert.deepEqual(packet.behavior,behavior);assert.deepEqual(packet.sourceAnomalies,s.sourceAnomalies);assert.deepEqual(packet.embeddedSourceAudio,clocks.map(x=>({spriteId:x.spriteId,decoder:x.decoder,segments:x.segments})));assert.deepEqual(packet.optionalSpanishAudio.trigger,trigger);assert.deepEqual(packet.optionalSpanishAudio.decoder,sa);
 assert.equal(registration.calibrationId,calibration);assert.deepEqual(registration.entries,[e]);assert(!packet.productCalibrationPassed&&!packet.scaleOutAuthorized&&!packet.registeredAtProofPreparation);assert.deepEqual(packet.acceptanceEffects,acceptanceEffects);assert.equal(packet.integrity.completeTransitiveClosure,false);assert(packet.integrity.sourceEvidenceClosure&&packet.integrity.maintainedLocalImportClosure&&packet.integrity.externalEntryBindings&&!packet.integrity.externalExecutionClosure);
 if(packet.freezeManifest){const {freezeManifest,...frozen}=packet;assert.deepEqual(readJsonPin(root,freezeManifest),frozen);assert.equal(registration.freezeManifest,freezeManifest.path);assert.equal(registration.freezeManifestSha256,freezeManifest.sha256);assert.equal(registration.freezeManifestBytes,freezeManifest.bytes);}
 return{status:'source-native-installed-input-contract-passed',animationId:id,registered:false,sourceEvidenceFiles:c.evidenceFiles.length,physicalInstalledFiles:c.installedFiles.length};
}
