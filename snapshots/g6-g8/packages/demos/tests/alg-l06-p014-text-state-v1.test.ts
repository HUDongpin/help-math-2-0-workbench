import assert from 'node:assert/strict';
import test from 'node:test';
import {P014_TEXT_STATE_SOURCE,p014TextState}
  from '../src/generated/alg-l06-p014-text-state-v1';

test('P014 source prompt, choices and stacked fraction reveal without early answer interaction',()=>{
  assert.equal(P014_TEXT_STATE_SOURCE.sourceSwfSha256,
    'aed0f7755d4f691cefcc28c815acc6b9d083fdfaae88ff385f22d3b32ba07603');
  assert.equal(p014TextState(2).prompt.visible,false);
  assert.equal(p014TextState(6).options.some(o=>o.visible),false);
  assert.equal(p014TextState(7).prompt.visible,true);
  assert.deepEqual(p014TextState(7).options.map(o=>[o.letter,o.value,o.sourceInteractive]),
    [['A','57°F',false],['B','70°F',false],['C','72°F',false],['D','77°F',false]]);
  assert.equal(p014TextState(10).formula.visible,false);
  assert.equal(p014TextState(11).formula.text,'F = (9/5) × C + 32');
  assert.deepEqual(P014_TEXT_STATE_SOURCE.formula.fractionSourceRuns.map(r=>r.text),['9','5']);
  assert(P014_TEXT_STATE_SOURCE.formula.fractionSourceRuns[1].yOffsetTwips>
    P014_TEXT_STATE_SOURCE.formula.fractionSourceRuns[0].yOffsetTwips);
  assert.equal(p014TextState(119).options.every(o=>!o.sourceInteractive),true);
  assert.equal(p014TextState(120).options.every(o=>o.sourceInteractive),true);
  assert.equal(p014TextState(121).options.every(o=>!o.sourceInteractive),true);
});

test('four visual options map to disjoint exact hit areas and source behavior',()=>{
  assert.deepEqual(P014_TEXT_STATE_SOURCE.options.map(o=>
    [o.letter,o.value,o.sourceInstance,o.buttonId,o.role]),[
    ['A','57°F','AnsBtn1',214,'wrong'],
    ['B','70°F','AnsBtn4',214,'wrong'],
    ['C','72°F','AnsBtn3',214,'wrong'],
    ['D','77°F','AnsBtn2',213,'right']]);
  for(const o of P014_TEXT_STATE_SOURCE.options){
    const r=o.hitStageBoundsTwips;
    assert(r.left<o.labelStageBoundsTwips.right&&r.right>o.labelStageBoundsTwips.left);
    assert(r.top<o.valueStageBoundsTwips.bottom&&r.bottom>o.valueStageBoundsTwips.top);
  }
  assert.equal(P014_TEXT_STATE_SOURCE.policy.xmlScope.includes('sprite-83-tail-unresolved'),true);
});

test('glossary, diagram, dynamic feedback and result retain separate source gates',()=>{
  assert.equal(p014TextState(6).glossary.every(c=>!c.available),true);
  assert.deepEqual(p014TextState(7).glossary.map(c=>[c.key,c.buttonId,c.available]),
    [['Input',32,true],['Output',33,true]]);
  assert.equal(p014TextState(108).diagram.every(d=>!d.visible),true);
  assert.equal(p014TextState(114).diagram.every(d=>d.visible),true);
  assert.equal(p014TextState(424).result.visible,false);
  assert.equal(p014TextState(425).result.text,'= 77°F');
  assert.deepEqual(P014_TEXT_STATE_SOURCE.feedback.dynamicFieldIds,[24,168,183]);
  assert.equal(P014_TEXT_STATE_SOURCE.feedback.wrongStrings.length,2);
  assert.deepEqual(P014_TEXT_STATE_SOURCE.feedback.domains.map(d=>
    [d.domain,d.title,d.titleFirstVisibleFrame,d.titleSemanticFrame,
      d.dynamicSemanticFrame??null,d.frameCount]),[
    [28,'incorrect!',2,6,20,28],[173,'OH! NO',9,9,22,31],
    [187,'Try Again!',7,7,23,29],[83,'YOU GOT IT!',6,6,null,31],
    [115,'Excellent!',9,9,null,25],[148,'Awesome!',12,12,null,27],
    [156,'Excellent!',5,5,null,27]]);
  assert.deepEqual(P014_TEXT_STATE_SOURCE.feedback.acknowledgments.map(a=>
    [a.domain,a.popup,a.buttonId,a.placedFrame,a.fullAlphaFrame,a.holdFrame,a.nextFrame,a.label]),[
    [28,25,21,13,20,20,21,'Close'],
    [173,169,167,16,22,22,23,'Close'],
    [187,184,182,16,23,23,24,'Close']]);
  assert(P014_TEXT_STATE_SOURCE.feedback.acknowledgments.every(a=>
    a.hitShapes.map(s=>s.characterId).join(',')==='11,20'));
  for(const frame of [0,450,1.5,NaN])
    assert.throws(()=>p014TextState(frame),/P014_TEXT_FRAME_OUT_OF_RANGE/);
  assert.deepEqual(p014TextState(1),p014TextState(1));
});

test('source substitution, intermediate arithmetic and resolved output replace stale question',()=>{
  const at=(frame:number)=>p014TextState(frame);
  assert.deepEqual(P014_TEXT_STATE_SOURCE.formula.stages.map(stage=>
    [stage.key,stage.fromFrame,stage.text]),[
    ['general',11,'F = (9/5) × C + 32'],
    ['substitution',254,'F = (9/5) × 25 + 32'],
    ['intermediate',311,'F = 45 + 32']]);
  assert.equal(at(187).diagramValues.input.visible,false);
  assert.deepEqual([at(188).diagramValues.input.text,at(188).diagramValues.input.visible],
    ['25°C',true]);
  assert.equal(at(253).formula.stage,'general');
  assert.equal(at(254).formula.stage,'substitution');
  assert.equal(at(301).formula.stage,'substitution');
  assert.equal(at(304).formula.stage,'substitution');
  assert.equal(at(310).formula.stage,'substitution');
  assert.equal(at(311).formula.stage,'intermediate');
  assert.equal(at(421).diagramValues.output.visible,false);
  assert.equal(at(422).diagramValues.output.visible,false);
  assert.equal(at(424).diagram.find(item=>item.characterId===210)?.visible,true);
  assert.equal(at(425).diagram.find(item=>item.characterId===210)?.visible,false);
  assert.equal(at(425).diagramValues.output.visible,true);
  assert.equal(at(449).diagramValues.output.text,'77°F');
  assert.deepEqual(at(449).diagramValues.output.sourceTextIds,[224,226]);
  assert.equal(P014_TEXT_STATE_SOURCE.policy.output.includes('covered'),true);
});
