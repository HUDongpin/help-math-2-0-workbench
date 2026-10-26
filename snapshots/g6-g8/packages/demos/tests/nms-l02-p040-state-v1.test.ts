import assert from 'node:assert/strict';
import test from 'node:test';
import {p040Initial,p040Play,p040Advance,p040OpenTerm,p040CloseTerm,p040Replay,p040EquationAt} from '../src/nms-l02-p040-state-v1';
test('source word boundary gates glossary; closing never silently resumes',()=>{
 let s=p040Advance(p040Play(p040Initial()),58);assert.equal(s.frame,59);assert.equal(p040OpenTerm(s,'percent'),s);
 s=p040Advance(s,1);s=p040OpenTerm(s,'percent');assert.equal(s.term,'percent');assert.equal(p040Advance(s,200),s);
 s=p040CloseTerm(s);assert.equal(s.playing,false);s=p040Advance(p040Play(s),380);assert.equal(s.frame,440);assert.equal(s.completed,false);
 s=p040Advance(s,1);assert.equal(s.completed,true);const r=p040Replay(s);assert.deepEqual(r,{...p040Initial(),replay:1});
});
test('equation retains source fades, moving percent symbol and flashing overlays',()=>{
 assert.equal(p040EquationAt(127).find(x=>x.characterId===32)!.alpha,0);
 assert.equal(p040EquationAt(154).find(x=>x.characterId===32)!.alpha,1);
 assert.notDeepEqual(p040EquationAt(159).find(x=>x.characterId===35)!.matrix,p040EquationAt(167).find(x=>x.characterId===35)!.matrix);
 for(let f=243;f<=252;f++)assert.equal(p040EquationAt(f).some(x=>x.characterId===38),f<=251&&f%2===1);
 assert.equal(p040EquationAt(380).find(x=>x.characterId===41)!.alpha,0);assert.equal(p040EquationAt(440).find(x=>x.characterId===42)!.alpha,1);
});
