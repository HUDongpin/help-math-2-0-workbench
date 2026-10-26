import assert from 'node:assert/strict';
import test from 'node:test';
import {
 sourceGlossaryControlsAtFrame,
 validateSourceGlossaryControls,
} from '../../../packages/demos/src/source-glossary-controls';
import {
 P056_CONTROLS,
 P056_CONTROL_POLICY,
} from '../../../packages/demos/src/nms-l02-p056-product-controls-v1';
import {
 P056_GLOSSARY_SOURCE_DISPOSITION,
 P056_SOURCE_TERMS,
 p056SourceTerm,
} from '../../../packages/demos/src/generated/nms-l02-p056-terms-v1';

test('P056 exposes two source occurrence IDs only after full opacity',()=>{
 assert.equal(validateSourceGlossaryControls(P056_CONTROLS),P056_CONTROLS);
 assert.equal(P056_CONTROLS.frameDomain,'sprite-24');
 assert.equal(P056_CONTROLS.frameCount,234);
 assert.equal(P056_CONTROL_POLICY.sourceFirstPlacedFrame,9);
 assert.equal(P056_CONTROL_POLICY.modernInteractiveFirstFrame,17);
 for(const frame of [1,8,9,16])
  assert.deepEqual(sourceGlossaryControlsAtFrame(P056_CONTROLS,frame,'sprite-24'),[]);
 for(const frame of [17,234])
  assert.deepEqual(sourceGlossaryControlsAtFrame(P056_CONTROLS,frame,'sprite-24').map(control=>control.id),[
   'sprite-24/depth-16/generation-1','sprite-24/depth-18/generation-1',
  ]);
 assert.throws(()=>sourceGlossaryControlsAtFrame(P056_CONTROLS,235,'sprite-24'));
 assert.deepEqual(P056_CONTROLS.controls.map(control=>control.entryId),['organize','information']);
 assert.deepEqual(P056_CONTROLS.controls.map(control=>control.sourceKeyAttribute),['Organize','Information']);
});

test('conditional product terms preserve source keys and unresolved gates',()=>{
 assert.deepEqual(P056_SOURCE_TERMS.map(term=>term.id),['organize','information']);
 assert.equal(p056SourceTerm('information')?.labels.es,'Información');
 assert.equal(p056SourceTerm('Information'),undefined);
 assert.equal(P056_GLOSSARY_SOURCE_DISPOSITION.originalL2XmlResolved,false);
 assert.equal(P056_GLOSSARY_SOURCE_DISPOSITION.historicalHostAssociationEstablished,false);
 assert.equal(P056_GLOSSARY_SOURCE_DISPOSITION.originalRuntimeLookupVerified,false);
});
