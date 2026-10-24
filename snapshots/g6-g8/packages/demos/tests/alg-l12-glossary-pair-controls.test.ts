import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';
import {ALG_L12_GLOSSARY_PAIR_CONTROLS as pages} from '../src/generated/alg-l12-glossary-pair-controls';
import {sourceGlossaryControlsAtFrame,validateSourceGlossaryControls} from '../src/source-glossary-controls';
import {pairControlsSource} from '../../../scripts/build-g678-alg-l12-glossary-pair-controls.mjs';
import {validatePairGlossaryAction} from '../../../scripts/build-g678-alg-l12-glossary-pair-inputs.mjs';

test('actual serialized source inputs regenerate both maintained configurations without drift',()=>{
 assert.equal(readFileSync(new URL('../src/generated/alg-l12-glossary-pair-controls.ts',import.meta.url),'utf8'),pairControlsSource());
 assert.equal(pages.length,2);assert.deepEqual(pages.map(p=>p.controls.length),[4,6]);
 for(const p of pages)assert.equal(validateSourceGlossaryControls(p),p);
});
test('P013 source appearance boundaries preserve the late Quadrant term',()=>{
 const p=pages[0];assert.equal(sourceGlossaryControlsAtFrame(p,1,'sprite-63').length,0);
 assert.deepEqual(sourceGlossaryControlsAtFrame(p,2,'sprite-63').map(c=>c.sourceKeyAttribute),['X-axis','Coordinate plane','Y-axis']);
 assert.equal(sourceGlossaryControlsAtFrame(p,71,'sprite-63').length,3);
 assert.equal(sourceGlossaryControlsAtFrame(p,72,'sprite-63').at(-1)?.sourceKeyAttribute,'Quadrant');
 assert.equal(sourceGlossaryControlsAtFrame(p,372,'sprite-63').length,4);
});
test('each real P015 occurrence follows its own source visibility through the complete timeline',()=>{
 const p=pages[1];for(let frame=1;frame<=474;frame++){
  const actual=sourceGlossaryControlsAtFrame(p,frame,'sprite-76');
  for(const c of p.controls)assert.equal(actual.includes(c),c.firstFrame<=frame&&frame<c.lastFrameExclusive);
 }
 assert.deepEqual(p.controls.map(c=>c.sourceKeyAttribute),['Plot','Locate','Point','Grid','Ordered pair','Coordinate']);
});
test('reused glossary entries remain separate controls while duplicate occurrences and foreign contexts fail',()=>{
 const p=pages[0],base=p.controls[0];
 const reused={...p,controls:[base,{...base,id:'sprite-63/depth-99/generation-1',characterId:99}]};
 assert.equal(sourceGlossaryControlsAtFrame(reused,72,'sprite-63').length,2);
 assert.throws(()=>validateSourceGlossaryControls({...p,controls:[base,base]}));
 assert.throws(()=>sourceGlossaryControlsAtFrame(p,373,'sprite-63'));
 assert.throws(()=>sourceGlossaryControlsAtFrame(p,1,'sprite-76'));
});
test('extra source actions cannot silently enter the reviewed glossary mechanism',()=>{
 const source='on(release){\n_global.KeyAttribute = "Plot";\n_root.DoHyperLinks();\n_root.animation_mc.animation.stop();\n}';
 assert.equal(validatePairGlossaryAction(source,'Plot').operation,'open-glossary');
 assert.throws(()=>validatePairGlossaryAction(source.replace('stop();','play();'),'Plot'));
 assert.throws(()=>validatePairGlossaryAction(source.replace('Plot','Quadrant'),'Plot'));
 assert.throws(()=>validatePairGlossaryAction(source.replace('\n}', '\n_root.someOtherEffect();\n}'),'Plot'));
});
