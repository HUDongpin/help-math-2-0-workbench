import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
 P054_ADMISSION_ID,P054_ADMISSION_CALIBRATION,P054_ACCEPTANCE_EFFECTS,
 P054_REVIEWED_SOURCE_PINS,P054_AUDIO_MANIFEST,P054_SOURCE,P054_XML,
 P054_SOURCE_ROOT,P054_MOVIE_XML,
 P054_RUNTIME,validateP054SourceInventory,validateP054AdmissionSemantics,
 p054ExpectedResourcePins,validateP054ResourcePins,
} from './nms-l02-p054-admission-semantics.mjs';

const root=new URL('../',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readReviewed=pin=>{
 const bytes=readFileSync(new URL(pin.path,root));
 assert.equal(bytes.length,pin.bytes,`reviewed source length ${pin.path}`);
 assert.equal(hash(bytes),pin.sha256,`reviewed source SHA ${pin.path}`);
 return JSON.parse(bytes);
};
const sourceInventory=()=>({
 gameContract:readReviewed(P054_REVIEWED_SOURCE_PINS.gameContract),
 interaction:readReviewed(P054_REVIEWED_SOURCE_PINS.interaction),
 layout:readReviewed(P054_REVIEWED_SOURCE_PINS.layout),
 cardDisplay:readReviewed(P054_REVIEWED_SOURCE_PINS.cardDisplay),
 gameDisplay:readReviewed(P054_REVIEWED_SOURCE_PINS.gameDisplay),
 art:readReviewed(P054_REVIEWED_SOURCE_PINS.art),
 audioStructure:readReviewed(P054_REVIEWED_SOURCE_PINS.audioStructure),
 hostBinding:readReviewed(P054_REVIEWED_SOURCE_PINS.hostBinding),
 audioManifest:(()=>{
  const bytes=readFileSync(P054_AUDIO_MANIFEST.path);
  assert.equal(hash(bytes),P054_AUDIO_MANIFEST.sha256,'reviewed external audio manifest SHA');
  return JSON.parse(bytes);
 })(),
});
const mutation=(change)=>{
 const source=structuredClone(sourceInventory());
 change(source);
 assert.throws(()=>validateP054SourceInventory(source),/NMS_L02_P054_ADMISSION/u);
};

test('physical source pins and nine actual source inventories agree on 2 x 6 matching game',()=>{
 assert.equal(P054_ADMISSION_ID,'shared-nms002-l02-p054');
 assert.equal(P054_ADMISSION_CALIBRATION,'g678-nms-l02-p054-source-matching-current-js-v1');
 const physical=readFileSync(new URL(P054_REVIEWED_SOURCE_PINS.art.path,root));
 assert.equal(hash(physical),P054_REVIEWED_SOURCE_PINS.art.sha256);
 assert.equal(P054_SOURCE.sha256,'06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8');
 assert.equal(P054_XML.sha256,'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61');
 for(const pin of [P054_SOURCE,P054_XML]){
  const bytes=readFileSync(`${P054_SOURCE_ROOT}/${pin.path}`);
  assert.equal(bytes.length,pin.bytes,`physical source length ${pin.path}`);
  assert.equal(hash(bytes),pin.sha256,`physical source SHA ${pin.path}`);
 }
 const movie=readFileSync(P054_MOVIE_XML.path);
 assert.equal(movie.length,P054_MOVIE_XML.bytes);
 assert.equal(hash(movie),P054_MOVIE_XML.sha256);
 assert.equal(validateP054SourceInventory(sourceInventory()),true);
});

test('rejects source level, score and terminal promotion drift',()=>{
 mutation(source=>{source.gameContract.matching.actions.scoreWrong=0;});
 mutation(source=>{source.gameContract.controller.earlyTarget='L2GS03';});
 mutation(source=>{source.interaction.feedback.correct.terminalFrame=28;});
 mutation(source=>{source.interaction.feedback.correct.afterSix='parent result frame';});
});

test('rejects missing or remapped 24-card and 24-reveal source closure',()=>{
 mutation(source=>{source.layout.cards.pop();});
 mutation(source=>{source.cardDisplay.cards[0].sourceCharacterId=999;});
 mutation(source=>{source.art.export.items=source.art.export.items.filter(item=>item.file!=='shapes/110.svg');});
});

test('rejects substituting result/SA music for two feedback clips',()=>{
 mutation(source=>{source.audioManifest.streams[0].encoded=source.audioManifest.streams[2].encoded;});
 mutation(source=>{source.audioStructure.embeddedStreams[1].originalRuntimeAudible=true;});
 mutation(source=>{source.audioManifest.audioAccepted=true;});
 mutation(source=>{source.hostBinding.disposition='original-runtime-verified';});
});

test('all 24 reveal SVG and both selected feedback MP3s have exact source-manifest bytes',()=>{
 const {art,audioManifest}=sourceInventory();
 const resourcePins=p054ExpectedResourcePins(art,audioManifest);
 assert.equal(resourcePins.length,26);
 assert.equal(validateP054ResourcePins({art,audioManifest,resourcePins}),true);
 for(const pin of resourcePins){
  const bytes=readFileSync(pin.path);
  assert.equal(bytes.length,pin.bytes,`external resource length ${pin.path}`);
  assert.equal(hash(bytes),pin.sha256,`external resource SHA ${pin.path}`);
 }
 const wrong=structuredClone(resourcePins);
 wrong[0].sha256='0'.repeat(64);
 assert.throws(()=>validateP054ResourcePins({art,audioManifest,resourcePins:wrong}),
  /24 exact reveal SVG and two feedback MP3/u);
});

test('packet contract rejects an absent DOM run/member instead of accepting a source-only candidate',()=>{
 const base={schemaVersion:1,calibrationId:P054_ADMISSION_CALIBRATION,
  sourceRoot:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',
  scope:'private-engineering',deploymentScope:'local-only',source:P054_SOURCE,sourceXml:P054_XML,
  selectedPages:[{animationId:P054_ADMISSION_ID,placementId:P054_ADMISSION_ID,
   assetId:`swf-${P054_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
   sourceSha256:P054_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:54,sourceOccurrence:54,sectionCode:'GS',sectionPageOrdinal:2,
   complexityLane:'behavior-heavy',runtime:P054_RUNTIME}],
  entry:{key:P054_ADMISSION_ID,module:`./modules/${P054_ADMISSION_ID}`,
   maturity:'private-current-js',complexityLane:'behavior-heavy',
   artifacts:{kind:'maintained-dom-module-v1'}},
  acceptanceEffects:P054_ACCEPTANCE_EFFECTS,productCalibrationPassed:false,scaleOutAuthorized:false};
 assert.throws(()=>validateP054AdmissionSemantics(base,{}),/DOM artifact fields/u);
 // Once a real artifact producer exists, the entire packet must reach all
 // later checks; this test intentionally never invents a proof or fake seal.
});
