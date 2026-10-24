import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getTi006Introduction, Ti006Introduction, Ti006MainAxis,
  TI006_INTRODUCTION_DATA as data, TI006_MAIN_AXIS as axis,
  TI006_INTRODUCTION_BINDING as binding, TI006_INTRODUCTION_KEY_TERMS as keyTerms} from '../src/modern-lessons/g4-l3-ti006-introduction';

const root = new URL('../../../', import.meta.url);
const catalog = JSON.parse(gunzipSync(readFileSync(new URL(
  `catalog/typography-v1/source-catalog/assets/${data.sourceSha256}.json.gz`, root))).toString());
const timeline = catalog.timelines.find((t: any) => t.timelineId === 'sprite-269');
const texts = new Map<number, any>(catalog.textDefinitions.map((t: any) => [t.characterId, t]));
const fullText = (cid: number) => texts.get(cid).runs.map((r: any) => r.text).join('');
const alpha = (n: any) => n ? (n.colorTransform?.multiply?.[3] ?? 256)/256 : 0;

test('source-locked generation reproduces 166 frames and source-bound text roles', () => {
  execFileSync('python3', ['scripts/build-g4-l3-ti006-introduction.py', '--check'], {cwd: root});
  assert.equal(data.frames.length, 166);
  assert.equal(binding.placementId, 'g04-l03-placement-028');
  assert.equal(binding.sourceSwfSha256, '8b1b570cb14dc3fd8f5a73920d0661b8a14c971eb477d5bfb6d8579f5ce842e8');
  const ids = new Set(catalog.textDefinitions.flatMap((t: any) => (t.runs ?? []).map((r: any) => r.sourceTextId)));
  for (const b of binding.blocks) for (const id of b.sourceTextIds) assert.ok(ids.has(id), id);
});

test('all XML frame projections agree with independent binary-catalog masks, text matrices, alpha and replacement states', () => {
  const state = new Map<number, any>();
  for (const frame of data.frames) {
    for (const e of timeline.events.filter((e: any) => e.frame === frame.frame)) {
      if (e.kind === 'remove') state.delete(e.depth);
      if (e.kind === 'place') state.set(e.depth, {...(e.move ? state.get(e.depth) : {}), ...e});
    }
    const projections = [...Object.entries(data.fields).map(([key,cid]) => [cid,frame.prose[key as keyof typeof data.fields]] as const),
      ...frame.cards.map(c => [c.characterId,c] as const)];
    for (const [cid, actual] of projections) {
      const placed = [...state.entries()].find(([,n]) => n.characterId === cid);
      if (!placed) {
        assert.equal(actual.text, ''); assert.equal(actual.alpha, 0); assert.deepEqual(actual.lines, []);
        continue;
      }
      const [depth, n] = placed;
      const masks = [...state.entries()].filter(([d,m]) => d < depth && depth <= m.clipDepth).map(([d,m]) => ({
        depth:d, left:m.matrix[4]-1152*m.matrix[0], right:m.matrix[4]-1012*m.matrix[0],
        top:m.matrix[5]+176*m.matrix[3], bottom:m.matrix[5]+196*m.matrix[3],
      }));
      assert.equal(actual.depth, depth);
      assert.equal(actual.alpha, alpha(n));
      assert.deepEqual(actual.matrix, n.matrix);
      assert.deepEqual(actual.masks, masks);
      const t = texts.get(cid), lines: string[] = [];
      let x=0, lastY: number|undefined;
      for (const run of t.runs) {
        if (run.xOffsetTwips !== null) x = run.xOffsetTwips;
        if (run.yOffsetTwips !== lastY) {lines.push(''); lastY = run.yOffsetTwips;}
        for (const glyph of run.glyphs) {
          const end = x+glyph.advanceTwips;
          if (alpha(n) > 0 && masks.every(m => n.matrix[4]+t.matrix[4]+x >= m.left && n.matrix[4]+t.matrix[4]+end <= m.right)) {
            lines[lines.length-1] += glyph.unicode;
          }
          x = end;
        }
      }
      assert.deepEqual(actual.lines, lines, `${frame.frame}/${cid}`);
      assert.equal(actual.text, lines.join(''), `${frame.frame}/${cid}`);
    }
    assert.equal(frame.axisVisible, state.has(32));
    assert.equal(frame.axisAlpha, alpha(state.get(32)));
    if (frame.axisVisible) {
      for (const a of axis) {
        const digit = state.get(a.depth);
        assert.equal(digit.characterId,a.characterId);
        assert.deepEqual(digit.matrix,a.textMatrix);
        assert.equal(alpha(digit),1);
        if (a.sign) {
          const sign = state.get(a.sign.depth === 74 && frame.frame < 166 ? 75 : a.sign.depth);
          assert.equal(sign.characterId,frame.frame < 166 ? a.introSignShapeId : a.sign.characterId);
          assert.deepEqual(sign.matrix,a.sign.matrix);
          assert.equal(alpha(sign),1);
          assert.equal(sign.clipDepth,undefined);
        }
      }
    }
    const markup = renderToStaticMarkup(<Ti006Introduction frame={frame.frame}/>);
    assert.equal((markup.match(/data-ti006-axis-value=/g) ?? []).length, frame.axisVisible && !frame.questionPhase ? 17 : 0);
    assert.equal((markup.match(/data-lesson-text-block="card-/g) ?? []).length, frame.frame >= 8 && frame.frame < 166 ? 5 : 0);
  }
});

test('compound +8 has intersecting positive strokes; all 17 signed labels and exact tick positions survive', () => {
  assert.deepEqual(axis.map(a => a.label), ['−8','−7','−6','−5','−4','−3','−2','−1','0','+1','+2','+3','+4','+5','+6','+7','+8']);
  assert.deepEqual(axis.map(a => a.tickXTwips), [-6017,-5294,-4571,-3848,-3125,-2402,-1679,-956,-233,490,1213,1936,2659,3382,4105,4828,5551]);
  assert.equal(axis[16]!.introSignShapeId,180);
  assert.equal(axis[16]!.sign?.characterId,199);
  assert.deepEqual(data.audit.plus8.rectangles,[{left:5353,right:5493,top:176,bottom:196},{left:5413,right:5433,top:116,bottom:256}]);
  assert.equal(axis[0]!.introSignShapeId,165);
  for (const a of axis) assert.equal(fullText(a.characterId),String(Math.abs(a.value)));
  assert.equal((renderToStaticMarkup(<Ti006MainAxis/>).match(/data-ti006-axis-value=/g) ?? []).length,17);
  assert.equal(renderToStaticMarkup(<Ti006MainAxis alpha={0}/>),'');
});

test('all five target sprites contain the matching card source, cover the correct tick, and retain authored offsets', () => {
  assert.deepEqual(data.cards.map(c => c.plainText),['Sapna Has $5','Alex Owes $6','Lola Has $8','Nestor Owes $3','Sue Has $3']);
  assert.deepEqual(data.audit.targets.map(t => t.registrationOffsetFromTickTwips),[0,153,71,4,66]);
  for (const target of data.audit.targets) {
    const placement = timeline.events.find((e: any) => e.frame === 166 && e.name?.text === target.id);
    assert.deepEqual(placement.matrix,target.matrix);
    assert.equal(alpha(placement),0);
    const child = catalog.timelines.find((t: any) => t.timelineId === `sprite-${target.characterId}`);
    assert.ok(child.events.some((e: any) => e.characterId === target.textCharacterId));
    assert.ok(target.leftTwips <= target.tickXTwips && target.tickXTwips <= target.rightTwips);
    assert.equal(axis.find(a => a.value === target.value)?.tickXTwips,target.tickXTwips);
  }
});

test('handoff keeps complete prose, hides demonstration, supports replay and uses only resolved parent glossary', () => {
  const final = getTi006Introduction(166);
  for (const [key,cid] of Object.entries(data.fields)) assert.equal(final[key as keyof typeof data.fields],fullText(cid));
  assert.equal(getTi006Introduction(7).axisVisible,false);
  assert.equal(getTi006Introduction(8).axisVisible,true);
  assert.equal(getTi006Introduction(4).prose.number.alpha,102/256);
  assert.equal(getTi006Introduction(114).instructionEnding,'');
  assert.equal(getTi006Introduction(115).instructionEnding,'n');
  assert.equal(final.questionPhase,true);
  assert.equal(getTi006Introduction(1).instruction,'');
  assert.equal(getTi006Introduction(0).frame,1);
  assert.equal(getTi006Introduction(NaN).frame,1);
  assert.equal(getTi006Introduction(Infinity).frame,1);
  assert.equal(getTi006Introduction(999).frame,166);
  assert.equal(getTi006Introduction(8.9).frame,8);
  for (const node of [<Ti006Introduction frame={166}/>,<Ti006Introduction frame={165} questionPhase/>]) {
    const markup = renderToStaticMarkup(node);
    assert.doesNotMatch(markup,/data-ti006-main-axis|data-ti006-intro-cards|<canvas|<input|<button/);
    assert.match(markup,/number line based on the amount of money each one has or owes/);
  }
  const links = renderToStaticMarkup(<Ti006Introduction frame={166} onKeyTerm={() => {}}/>);
  for (const name of ['Position','Number line','Owe'] as const) assert.ok(links.includes(`data-ti006-keyterm="${keyTerms.entries[name]}"`));
  assert.equal((links.match(/data-ti006-keyterm=/g) ?? []).length,3);
  assert.doesNotMatch(renderToStaticMarkup(<Ti006Introduction frame={8} onKeyTerm={() => {}}/>),/data-ti006-keyterm=/);
});
