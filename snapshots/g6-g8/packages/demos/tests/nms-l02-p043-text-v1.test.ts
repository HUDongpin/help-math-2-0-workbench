import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P043_TEXT_BINDING, p043TextSnapshot} from '../src/nms-l02-p043-text-v1';
import {p043ModuleFrame} from '../src/nms-l02-p043-frame-v1';
import {P043_GLOSSARY} from '../src/generated/nms-l02-p043-glossary-v1';
test('every text reference exists in the exact SWF catalog and definitions preserve mathematical meaning', () => {
  const source = JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p043/audit/source-text-catalog-v1.json', import.meta.url), 'utf8'));
  assert.equal(source.sourceSha256, P043_TEXT_BINDING.sourceSwfSha256);
  const ids = new Set(source.textDefinitions.map((t: {sourceTextId: string}) => t.sourceTextId));
  for (const b of P043_TEXT_BINDING.blocks) for (const id of b.sourceTextIds) assert.ok(ids.has(id), id);
  const snap = p043TextSnapshot(p043ModuleFrame(223,{frame:223,scenario:'source-inspection',lang:'en',seed:0}));
  for (const [row, id] of [64,67,66,65].entries()) {
    const raw = source.textDefinitions.find((t: {characterId:number}) => t.characterId === id).runs.map((r:{text:string})=>r.text).join('');
    const actual = snap.blocks.find(b=>b.id === `row-${row+1}-definition`)!.text;
    assert.equal(actual.toLowerCase().replace(/[.]$/,''), raw.toLowerCase().replace(/[.]$/,''));
  }
});
test('diagram captions and explicit glossary overlays retain the displayed mathematical values and language',()=>{
  for(const lang of ['en','es'] as const) {
    const state=p043ModuleFrame(223,{frame:223,scenario:'source-inspection',lang,seed:0});
    const base=p043TextSnapshot(state);
    assert.equal(base.blocks.length,48);
    assert.equal(base.blocks.find(b=>b.id==='picture-fraction')!.text,'1/3 = 2/6');
    assert.equal(base.blocks.find(b=>b.id==='picture-equivalent')!.text,'2/4 = 1/2 = 0.50 = 50%');
    assert.ok(base.blocks.filter(b=>b.id.startsWith('glossary-definition-')).every(b=>!b.visible));
    for(const term of P043_GLOSSARY) {
      const snap=p043TextSnapshot(state,{kind:'glossary',id:term.id});
      const visible=snap.blocks.filter(b=>b.id.startsWith('glossary-definition-') && b.visible);
      assert.equal(visible.length,1);assert.equal(visible[0].text,term.definitions[lang]);
    }
    for(const picture of ['fraction','percent','equivalent'] as const) {
      const snap=p043TextSnapshot(state,{kind:'picture',picture});
      assert.equal(snap.blocks.filter(b=>b.id.startsWith('expanded-') && b.visible).length,1);
      assert.equal(snap.blocks.find(b=>b.id===`expanded-${picture}`)!.text,base.blocks.find(b=>b.id===`picture-${picture}`)!.text);
    }
    assert.throws(()=>p043TextSnapshot(p043ModuleFrame(11,{frame:11,scenario:'source-inspection',lang,seed:0}),{kind:'picture',picture:'fraction'}),/OVERLAY/);
  }
});
test('all root/main frames and feedback scenes have complete bilingual snapshots with state-correct visibility', () => {
  for (const lang of ['en','es'] as const) {
    for (const [frameDomain,count] of [['root',10],['sprite-250',225]] as const) for(let frame=1;frame<=count;frame++) {
      const snap=p043TextSnapshot(p043ModuleFrame(frame,{frame,frameDomain,scenario:'source-inspection',lang,seed:0}));
      assert.equal(snap.status,'ready'); assert.deepEqual(snap.blockers,[]);
      assert.equal(snap.blocks.find(b=>b.id==='course-title')!.visible,!(frameDomain==='root' && frame<6));
      assert.ok(snap.blocks.filter(b=>b.id.startsWith('completion-')).every(b=>!b.visible));
    }
    for(const [frameDomain,scenario,label] of [['sprite-245','wrong-fraction-row1','wrong'],['sprite-249','correct-fraction-row2','correct'],['sprite-143','four-matches-completion','completion-143']]) {
      const snap=p043TextSnapshot(p043ModuleFrame(1,{frame:1,frameDomain,scenario,lang,seed:0}));
      assert.equal(snap.status,'ready'); assert.equal(snap.blocks.find(b=>b.id===label)!.visible,true);
      if(label==='completion-143')assert.ok(snap.blocks.filter(b=>b.id.startsWith('term-')).every(b=>!b.visible));
    }
  }
});
