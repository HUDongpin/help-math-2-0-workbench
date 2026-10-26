import assert from 'node:assert/strict';
import test from 'node:test';
import {validateReadableBoundary,validateReadableMeasurements} from './g678-nms-l01-p042-build-readable-companion-manifest.mjs';
function fixture(){const e={status:'passed',inputsUnchanged:true,inputs:[],inputsAfter:[],registered:false,actualMyLesson:false,
  records:['1440-natural','390-natural','370-reduced','844-landscape','390-text200','390-zoom-reflow-emulation200','390-target-lifecycle']
    .map(name=>({name,status:'passed',errors:[],requests:[]}))};
  for(const key of ['productCalibrationPassed','sourceAudioIntegrated','audioAccepted','authoritativeOriginalRuntime','visualFidelityAccepted',
    'humanVisualAccepted','ownerAccepted','strictComplete','released','published'])e[key]=false;return e;}
test('readable manifest accepts exact passed candidate-only evidence boundary',()=>validateReadableBoundary(fixture()));
test('readable manifest rejects hidden admission, omitted gates, failed cases and input or network drift',()=>{
  for(const mutate of [e=>e.registered=true,e=>delete e.actualMyLesson,e=>e.inputsUnchanged=false,e=>e.inputsAfter.push({}),
    e=>e.audioAccepted=true,e=>e.records.pop(),e=>e.records[0].status='failed',e=>e.records[0].errors.push('error'),e=>e.records[0].requests.push('request')]){
    const e=fixture();mutate(e);assert.throws(()=>validateReadableBoundary(e));}
});
test('readable measurements reject small text, low contrast, duplicate names, clips and a portal escaping modal containment',()=>{
  const literals=[{literal:'Title'},...['Step one','Step two','Step three','Step four'].map(literal=>({literal}))];
  const text=literals.map((item,index)=>({text:item.literal,sourceCharacterId:index?['16','18','20','22'][index-1]:null,
    fontSize:20,lineHeight:30,clips:[],box:{width:100,height:30},scrollWidth:100,clientWidth:100}));
  const item={contents:1,roots:1,language:'en',sourceAriaHidden:'true',insideSourcePlane:false,controls:0,
    orderedLists:1,labelledBy:'title',headingId:'title',duplicateNativeIds:0,text,
    foreground:'rgb(19, 40, 76)',background:'rgb(255, 255, 255)',source:{bottom:10,top:0},content:{top:11,bottom:200}};
  const labels=['without-id','restored-id','without-column','restored-column','modal-closed','actual-runtime-remount',
    ...['unmarked','button','duplicate','outside','missing','wrong-id'].flatMap(key=>[`target-${key}`,`target-restored-after-${key}`])];
  const valid={records:[{kind:'lifecycle',motion:'reduce',readable:labels.map(label=>({label,items:[item,item]})),screenshots:[{},{},{}],
    geometry:[{duplicateIds:[],badReferences:[],mediaElements:0,documentWidth:390,viewport:390,figures:[{},{}]}],final:{frame:125,requests:0},
    lifecycle:[{step:'modal-inert-stays-portal-no-escape',inert:true,hidden:true}]}]};
  validateReadableMeasurements(valid,literals);
  for(const mutate of [e=>e.records[0].readable[0].items[0].text[0].fontSize=19,e=>e.records[0].readable[0].items[0].background='rgb(19, 40, 76)',
    e=>e.records[0].readable[0].items[0].duplicateNativeIds=1,e=>e.records[0].readable[0].items[0].text[0].clips.push('clipped'),
    e=>e.records[0].lifecycle[0].inert=false]){const e=structuredClone(valid);mutate(e);assert.throws(()=>validateReadableMeasurements(e,literals));}
});
