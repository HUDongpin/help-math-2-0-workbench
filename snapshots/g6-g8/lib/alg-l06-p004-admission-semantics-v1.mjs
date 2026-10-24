/** P004 source facts and one-page local Current-JS proof semantics. No writes. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p004';
export const CALIBRATION='g678-alg-l06-p004-current-js-20260928-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/RW/L6RW04.swf',bytes:1115626,
 sha256:'514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6RW04.mp3',bytes:667968,
 sha256:'08bb62e9c1d92235c2e3fb96c44d44fc16b92ca7d175274e4c809f06bcfda8a5'};
export const AUDIT={path:'migrations/shared-alg001-l06-p004/audit/source-audit-v1.json',bytes:125269,
 sha256:'89b22426969a3f288f1aef6043aed050d9eb6e4e8d092b45532e89a52ff37180'};
export const GLOSSARY={path:'migrations/shared-alg001-l06-p004/audit/source-glossary-v1.json',bytes:15869,
 sha256:'0cb0789f117db00855a5be1c1123121cdd64b7eba03b2f64ddce3d7f81f999e0'};
export const SA_AUDIT={path:'migrations/shared-alg001-l06-p004/audit/sa-host-disposition-v1.json',bytes:8479,
 sha256:'8a64cea0933e8a5d8d19f6807c5109de865bf64485639489466e863458247530'};
export const MAIN={path:'migrations/shared-alg001-l06-p004/audit/continuous-source-v1.mp3',bytes:329030,
 sha256:'e8f5307618bd63789f468c7a056cf80ae7828f17b665a24893fafc3ad8bb7f7e'};
export const CANVAS_SOURCE={path:'output/alg-l06-p004-canvas-candidate-v1/canvas-renderer.js',bytes:7342336,
 sha256:'6b6f124262c8b90517151ea77eee43a30843c170211d4cd76404e584c876c2d8'};
export const NATIVE_TEXT={path:'packages/demos/src/alg-l06-p004-semantic-text-v1.ts',bytes:8366,
 sha256:'b2afb8f1cbcbc3233303e48cb3d6b64c89c5ac911f3000b0eab0acf0132802bf'};
export const ARTIFACTS=Object.freeze({
 module:{path:`packages/demos/src/modules/${ID}.tsx`,bytes:2974,
  sha256:'d8bc6cfe4b2672d49fc51bb0a1c9a845b95c2e1b06e14535c5d7b94f5bf464ab'},
 timeline:{path:`packages/demos/src/timelines/${ID}.ts`,bytes:1234,
  sha256:'586818cdfe18b6afd22048825c17a1be6bf4610b1348c8f4497c5b42c06c0b06'},
 runtime:{...CANVAS_SOURCE,path:`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`},
});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const RUNTIME=Object.freeze({frameDomain:'sprite-95',frameCount:831,rootFrameCount:10,
 rootBeginFrame:6,fps:12,stage:{width:800,height:600},scenario:'source-static-frame',seed:'0',
 canvasRenderer:ARTIFACTS.runtime,hostPlaybackCompletion:false});
export const CONTINUOUS=Object.freeze({audit:AUDIT,mp3:MAIN,streamHeadCount:1,blockCount:796,
 sampleRate:22050,decodedSamples:1457856,initialSeekSamples:1673,firstAudioBlockFrame:1,
 twoRunPlayback:false,originalRuntimeAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,trigger:'explicit-user-only',
 localeAutoplay:false,mainStreamSpliced:false,mainPausedDuringPlayback:true,
 pendingLoadCancellation:true,returnMainSupported:true,startSample:0,audioAccepted:false});

const localOrExternal=(root,pin,localInputs,external)=>{
 const exact={path:pin.path,bytes:pin.bytes,sha256:pin.sha256};
 if(!path.isAbsolute(pin.path)){
  readPin(root,exact);localInputs.push(exact);
 }else if(pin.path.startsWith(`${root}/`)){
  const local={...exact,path:path.relative(root,pin.path)};
  readPin(root,local);localInputs.push(local);
 }else{
  const source=pin.path.startsWith(`${SOURCE_ROOT}/`)
   ? {root:SOURCE_ROOT,pin:{...exact,path:path.relative(SOURCE_ROOT,pin.path)}}
   : {root:path.dirname(pin.path),pin:{...exact,path:path.basename(pin.path)}};
  readPin(source.root,source.pin);external.push(source);
 }
};

/** Verify physical source and current maintained artifacts without asking whether
 * P004 is already registered. External pins retain their own physical roots. */
export function readP004CanonicalSource(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 const audit=readJsonPin(root,AUDIT),glossary=readJsonPin(root,GLOSSARY),
  saAudit=readJsonPin(root,SA_AUDIT);
 assert.equal(audit.kind,'alg-l06-p004-source-audit-v1');assert.equal(audit.animationId,ID);
 assert.deepEqual(audit.source,SOURCE);
 assert.deepEqual(audit.placement,{globalOrdinal:4,sectionCode:'RW',sectionPageOrdinal:3});
 assert.equal(audit.header.signature,'CWS');assert.equal(audit.header.stage.width,800);
 assert.equal(audit.header.stage.height,600);assert.equal(audit.header.fps,12);
 assert.equal(audit.header.rootFrameCount,10);
 assert.equal(audit.frameDomains.longestStaticallyRootReachableDomain.domainId,'sprite-95');
 assert.equal(audit.frameDomains.longestStaticallyRootReachableDomain.declaredFrameCount,831);
 assert.equal(audit.buttons,8);assert.deepEqual(audit.stream.mp3,{bytes:MAIN.bytes,sha256:MAIN.sha256});
 assert.equal(audit.stream.heads.length,1);assert.equal(audit.stream.heads[0].domain,'sprite-95');
 assert.equal(audit.stream.heads[0].frame,1);assert.equal(audit.stream.blocks.length,796);
 assert.equal(audit.stream.blocks[0].seek,1673);assert.equal(audit.stream.packetGapsAreNotAudibleSilence,true);
 assert.equal(audit.optionalSpanish.path,SA.path);assert.equal(audit.optionalSpanish.sha256,SA.sha256);
 assert(Object.values(audit.acceptance).every(value=>value===false));
 assert.equal(glossary.kind,'alg-l06-p004-source-glossary-v1');assert.equal(glossary.animationId,ID);
 assert.equal(glossary.sourceSwf.sha256,SOURCE.sha256);assert.equal(glossary.sourceSwf.bytes,SOURCE.bytes);
 assert.deepEqual(glossary.entries.map(item=>item.sourceKeyAttribute),
  ['Input','Output','Function','Relation','Value','Rule','output']);
 assert.equal(glossary.entries.flatMap(item=>item.occurrenceIds).length,9);
 assert.equal(new Set(glossary.entries.flatMap(item=>item.buttonIds)).size,8);
 assert(glossary.modernDecisions.includes('output explicitly mapped to unique Output dictionary entry'));
 assert(glossary.modernDecisions.includes('close keeps paused state until explicit resume'));
 assert.equal(saAudit.kind,'alg-l06-p004-separate-sa-host-disposition-v1');
 assert.equal(saAudit.animationId,ID);
 assert.equal(saAudit.status,'verified-static-host-algorithm-conditional-page-application-not-runtime-or-listening');
 assert.equal(saAudit.inputs.lessonXml.sha256,XML.sha256);
 assert.equal(saAudit.inputs.pageSwf.sha256,SOURCE.sha256);
 assert.equal(saAudit.inputs.separateSa.sha256,SA.sha256);
 assert(Object.values(saAudit.acceptanceEffects).every(value=>value===false));
 for(const pin of [AUDIT,GLOSSARY,SA_AUDIT,MAIN,CANVAS_SOURCE,...Object.values(ARTIFACTS)])readPin(root,pin);
 assert.match(readPin(root,NATIVE_TEXT).toString(),/version:'alg-l06-p004-substitution-v5'/u);
 const localInputs=[AUDIT,GLOSSARY,SA_AUDIT,MAIN,CANVAS_SOURCE,NATIVE_TEXT,...Object.values(ARTIFACTS)];
 const external=[SOURCE,XML,SA].map(pin=>({root:SOURCE_ROOT,pin}));
 for(const pin of [audit.catalog,glossary.parser,glossary.geometry,...glossary.buttonSources,
  ...Object.values(glossary.dictionaries),...Object.values(saAudit.inputs)]){
  localOrExternal(root,pin,localInputs,external);
 }
 const sorted=uniquePins(localInputs);
 const seen=new Map();for(const item of external){const key=`${item.root}/${item.pin.path}`;
  const previous=seen.get(key);if(previous)assert.deepEqual(previous,item);else seen.set(key,item);}
 return {audit,glossary,saAudit,localInputs:sorted,external:[...seen.values()]};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
/** Exact packet/registration validator. Never use future transaction outputs
 * as the page's own frozen evidence. */
export function validateP004AdmissionSemantics(packet,registration){
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:4,sourceOccurrence:4,sectionCode:'RW',
  sectionPageOrdinal:3,complexityLane:'behavior-heavy',runtime:RUNTIME}]);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts:ARTIFACTS});
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert(Number.isSafeInteger(packet.freezeManifest.bytes)&&packet.freezeManifest.bytes>0);
 assert(/^[a-f0-9]{64}$/u.test(packet.freezeManifest.sha256));
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert(!('canonicalRun' in packet)&&!('canonicalMember' in packet));
 assert(Array.isArray(packet.integrity?.files));
 const evidence=new Map(packet.integrity.files.map(pin=>[pin.path,pin]));
 for(const required of [AUDIT,GLOSSARY,SA_AUDIT,MAIN,CANVAS_SOURCE,NATIVE_TEXT,...Object.values(ARTIFACTS)])
  assert.deepEqual(evidence.get(required.path),required,`exact P004 evidence: ${required.path}`);
 for(const pin of packet.integrity.files){
  assert(!FORBIDDEN.has(pin.path)&&pin.path!==PROOF_PATH&&pin.path!==FREEZE_PATH&&
   !/^catalog\/g678-admission-v1\/index-v\d+\.json$/u.test(pin.path),
  `no registry-dependent page evidence: ${pin.path}`);
 }
 return true;
}
