import assert from 'node:assert/strict';
import test from 'node:test';
import {validateMounted} from './g678-nms-l01-p042-build-candidate-manifest.mjs';
function fixture() {
  const value={status:'passed',inputsUnchanged:true,inputs:[],inputsAfter:[],registered:false,actualMyLesson:false,
    pure:{validFrameStates:125,distinctVisualStateHashes:1,invalidContextsBlocked:14}};
  for(const key of ['productCalibrationPassed','sourceAudioIntegrated','audioAccepted','authoritativeOriginalRuntime','visualFidelityAccepted',
    'humanVisualAccepted','ownerAccepted','strictComplete','released','published'])value[key]=false;
  value.records=[1440,390].flatMap(width=>['no-preference','reduce'].map(motion=>({width,motion,status:'passed',errors:[],requests:[],
    final:{frame:125,replay:3,requests:0,complete:'true',completions:motion==='reduce'?4:2},screenshots:[{},{},{}],
    geometry:Array.from({length:6},()=>({duplicateIds:[],badReferences:[],mediaElements:0,documentWidth:width,viewport:width,
      figures:[{lang:'en',controls:0,clips:[]},{lang:'en',controls:0,clips:[]}]})),
    firstNaturalClock:{expectedFirstToTerminalMs:124*1000/12,activeMs:10400,actuallyObservedFrames:[1,125]}})));
  return value;
}
test('mounted validator accepts exact candidate-only four-case terminal evidence',()=>{validateMounted(fixture());});
test('mounted validator rejects false admission, drift, omitted fields, network, incomplete timeline, duplicate SVG refs and fabricated clock',()=>{
  for(const mutate of [e=>e.registered=true,e=>delete e.actualMyLesson,e=>e.inputsUnchanged=false,e=>e.inputsAfter.push({}),
    e=>e.records[0].requests.push('https://example.invalid'),e=>e.records[0].final.frame=124,
    e=>e.records[0].geometry[0].badReferences.push('missing'),e=>e.records[0].firstNaturalClock.activeMs=100,
    e=>e.records[0].geometry[0].figures[0].lang='es',e=>e.records[0].geometry[0].figures[0].controls=1]){
    const evidence=fixture();mutate(evidence);assert.throws(()=>validateMounted(evidence));
  }
});
