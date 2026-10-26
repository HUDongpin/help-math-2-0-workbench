import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {p004InitialGlossaryState,p004VisibleGlossaryButtons,p004ActivateGlossary,
 p004CloseGlossary,p004ReplayGlossary,P004_GLOSSARY_BUTTONS,
 p004VisibleGlossaryOccurrences,p004ActivateGlossaryOccurrence} from './alg-l06-p004-glossary-state-v1';
test('every button boundary matches the independently extracted source occurrence',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../../migrations/shared-alg001-l06-p004/audit/button-occurrences-v1.json',import.meta.url),'utf8'));
 assert.equal(audit.buttons.length,8);
 for(const button of P004_GLOSSARY_BUTTONS){
  const original=audit.buttons.find((row:{buttonId:number})=>row.buttonId===button.buttonId);
  assert.deepEqual(original.sourceVisibleFrameRanges,[[button.firstFrame,831]]);
  assert.equal(original.keyAttribute,button.keyAttribute);
  assert(!p004VisibleGlossaryButtons(button.firstFrame-1).some(row=>row.buttonId===button.buttonId));
  assert(p004VisibleGlossaryButtons(button.firstFrame).some(row=>row.buttonId===button.buttonId));
 }
});
test('learner activation pauses, preserves authored case and closes without invented resume',()=>{
 const start={frame:614,paused:false,selectedButton:null,keyAttribute:null};
 const selected=p004ActivateGlossary(start,86);
 assert.deepEqual(selected,{frame:614,paused:true,selectedButton:86,keyAttribute:'output'});
 assert.equal(start.paused,false);
 assert.deepEqual(p004CloseGlossary(selected),{frame:614,paused:true,selectedButton:null,keyAttribute:null});
 assert.deepEqual(p004ReplayGlossary(),p004InitialGlossaryState());
 assert.throws(()=>p004ActivateGlossary({...start,frame:613},86));
 for(const invalid of [0,832,1.5,NaN])assert.throws(()=>p004VisibleGlossaryButtons(invalid));
});
test('both Function placements remain independently addressable at frame614',()=>{
 assert.equal(p004VisibleGlossaryOccurrences(613).length,5);
 const rows=p004VisibleGlossaryOccurrences(614);assert.equal(rows.length,9);
 const functions=rows.filter(row=>row.buttonId===79);assert.equal(functions.length,2);
 assert.notEqual(functions[0].rect[1],functions[1].rect[1]);
 for(const row of functions){const state=p004ActivateGlossaryOccurrence({frame:614,paused:false,selectedButton:null,keyAttribute:null},row.occurrenceId);
  assert.equal(state.selectedOccurrence,row.occurrenceId);assert.equal(state.keyAttribute,'Function');assert.equal(state.paused,true);
  assert(!('selectedOccurrence' in p004CloseGlossary(state)));}
 assert.throws(()=>p004ActivateGlossaryOccurrence({frame:613,paused:false,selectedButton:null,keyAttribute:null},'79@95'));
});
