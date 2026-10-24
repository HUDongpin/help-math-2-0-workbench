import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getTi005Introduction, Ti005Introduction, TI005_INTRODUCTION_DATA as data,
  TI005_INTRODUCTION_BINDING as binding, TI005_INTRODUCTION_KEY_TERMS as keyTerms} from '../src/modern-lessons/g4-l3-ti005-introduction';

const root = new URL('../../../', import.meta.url);
const source = JSON.parse(gunzipSync(readFileSync(new URL(
  `catalog/typography-v1/source-catalog/assets/${data.sourceSha256}.json.gz`, root))).toString());
const timeline = source.timelines.find((t: any) => t.timelineId === 'sprite-208');
const texts = new Map<number, any>(source.textDefinitions.map((t: any) => [t.characterId, t]));
const fullText = (id: number) => texts.get(id).runs.map((r: any) => r.text).join('');

test('hash-locked XML generation is reproducible and binding identifies exact placement', () => {
  execFileSync('python3', ['scripts/build-g4-l3-ti005-introduction.py', '--check'], {cwd: root});
  assert.equal(data.frames.length, 209);
  assert.equal(binding.placementId, 'g04-l03-placement-027');
  assert.equal(binding.sourceSwfSha256, 'c6c46c779084d0f4a7888e3061310f84461d4858ff32c34c5ff9ffab5435de06');
  const runs = new Set(source.textDefinitions.flatMap((t: any) => (t.runs ?? []).map((r: any) => r.sourceTextId)));
  for (const block of binding.blocks) for (const id of block.sourceTextIds) assert.ok(runs.has(id), id);
});

test('all 209 XML frames agree with independently parsed SWF masks, glyph cells, cue transforms and alpha', () => {
  const state = new Map<number, any>();
  for (const frame of data.frames) {
    for (const e of timeline.events.filter((e: any) => e.frame === frame.frame)) {
      if (e.kind === 'remove') state.delete(e.depth);
      if (e.kind === 'place') state.set(e.depth, {...(e.move ? state.get(e.depth) : {}), ...e});
    }
    for (const [key, cid] of Object.entries(data.fields)) {
      const placed = [...state.entries()].find(([, n]) => n.characterId === cid);
      let expected = '';
      if (placed) {
        const [depth, n] = placed;
        const masks = [...state.entries()].filter(([d,m]) => d < depth && depth <= m.clipDepth).map(([,m]) => m);
        let x = 0;
        for (const run of texts.get(cid).runs) {
          if (run.xOffsetTwips !== null) x = run.xOffsetTwips;
          for (const glyph of run.glyphs) {
            const end = x + glyph.advanceTwips;
            if (masks.every(m => n.matrix[4]+x >= m.matrix[4]-760*m.matrix[0] && n.matrix[4]+end <= m.matrix[4]+760*m.matrix[0])) expected += glyph.unicode;
            x = end;
          }
        }
      }
      assert.equal(frame[key as keyof typeof data.fields], expected, `${frame.frame}/${key}`);
    }
    const cue = state.get(28);
    const alpha = (node: any) => {
      if (!node) return 0;
      const transform = node.colorTransform;
      assert.equal(transform?.add?.[3] ?? 0, 0, 'This source has no additive cue alpha');
      return (transform?.multiply?.[3] ?? 256) / (transform?.divisor ?? 256);
    };
    assert.deepEqual(frame.cue, cue ? {characterId: cue.characterId, matrix: cue.matrix, alpha: alpha(cue)} : null, `cue at ${frame.frame}`);
    const questionMark = [...state.values()].find(n => n.characterId === 175);
    assert.equal(frame.questionMarkAlpha, alpha(questionMark), `question mark alpha at ${frame.frame}`);
    assert.equal(frame.questionMark, alpha(questionMark) > 0 ? fullText(175) : '', `question mark visibility at ${frame.frame}`);
    const markup = renderToStaticMarkup(<Ti005Introduction frame={frame.frame}/>);
    if (cue) assert.match(markup, new RegExp(`opacity="${alpha(cue)}"`), `rendered cue alpha at ${frame.frame}`);
    else assert.doesNotMatch(markup, /data-ti005-intro-cue=/);
    if (questionMark) assert.match(markup, new RegExp(`data-lesson-text-block="questionMark" style="opacity:${alpha(questionMark)}"`));
  }
});

test('four standalone minus rectangles bind to the four digits, never to the answer boxes', () => {
  assert.deepEqual(getTi005Introduction(8).pattern, ['−3,','−5,','−7,','−9,']);
  for (const [i,cid] of [161,162,163,164].entries()) {
    assert.equal(fullText(cid), `${3+2*i},`);
    const sign = timeline.events.find((e: any) => e.frame === 8 && e.depth === 12+2*i);
    assert.equal(sign.characterId, 146);
    assert.equal(sign.clipDepth, undefined);
    assert.ok(sign.matrix[0] > sign.matrix[3]);
    assert.deepEqual(binding.blocks.find(b => b.id === `pattern-${i}`)?.sourceShapeIds, [146]);
  }
  assert.deepEqual(data.audit.blankBoxes.map(b => [b.left,b.width,b.height]), [[-595,1000,1000],[842,1000,1000]]);
});

test('pointer, caret, placeholder, button press and New Problem flash preserve source beats', () => {
  assert.equal(getTi005Introduction(35).cue, null);
  assert.equal(getTi005Introduction(36).cue?.characterId, 173);
  assert.equal(getTi005Introduction(36).cue?.alpha, 0);
  assert.equal(getTi005Introduction(37).cue?.alpha, 18/256);
  assert.equal(getTi005Introduction(43).cue?.alpha, 0.5);
  assert.equal(getTi005Introduction(50).cue?.alpha, 1);
  assert.equal(getTi005Introduction(82).cue?.alpha, 213/256);
  assert.equal(getTi005Introduction(87).cue?.alpha, 0);
  assert.equal(getTi005Introduction(52).cue?.characterId, 174);
  assert.equal(getTi005Introduction(54).questionMark, '');
  assert.equal(getTi005Introduction(55).questionMark, '?');
  assert.equal(getTi005Introduction(75).checkState, 'pressed');
  assert.equal(getTi005Introduction(77).checkState, 'hover');
  assert.equal(getTi005Introduction(78).questionMark, '');
  assert.equal(getTi005Introduction(79).checkState, 'normal');
  assert.equal(getTi005Introduction(88).cue, null);
  for (const n of [100,102,104]) {
    assert.equal(getTi005Introduction(n).cue?.characterId, 181);
    assert.equal(getTi005Introduction(n+1).cue, null);
  }
});

test('question transition preserves prose and punctuation sources; Replay reconstructs the empty entry', () => {
  const final = getTi005Introduction(209);
  for (const [key,cid] of Object.entries(data.fields)) assert.equal(final[key as keyof typeof data.fields], fullText(cid));
  assert.equal(getTi005Introduction(208).exampleVisible, true);
  assert.equal(final.exampleVisible, false);
  assert.equal(final.questionPhase, true);
  assert.deepEqual(final.pattern, []);
  assert.equal(data.texts['165'], ',');
  assert.equal(data.texts['166'], ', ...');
  assert.equal(getTi005Introduction(1).number, '');
  assert.equal(getTi005Introduction(1).exampleVisible, false);
  assert.equal(getTi005Introduction(0).frame, 1);
  assert.equal(getTi005Introduction(250).frame, 209);
  assert.equal(getTi005Introduction(NaN).frame, 1);
  assert.equal(getTi005Introduction(55.9).frame, 55);
});

test('native markup presents both missing terms and punctuation without premature working controls', () => {
  const markup = renderToStaticMarkup(<Ti005Introduction frame={55} onKeyTerm={() => assert.fail('No source glossary in intro')}/>);
  assert.equal((markup.match(/data-ti005-intro-blank=/g) ?? []).length, 2);
  for (const value of ['−3,','−5,','−7,','−9,',', ...','Check Answer','New Problem']) assert.ok(markup.includes(value), value);
  assert.match(markup, /data-source-text="165"[^>]*>,<\/span>/);
  assert.match(markup, /data-lesson-text-block="questionMark" style="opacity:1">\?<\/span>/);
  assert.doesNotMatch(markup, /<canvas|<button|<input/);
  assert.deepEqual(keyTerms.entryIds, []);
  assert.deepEqual(keyTerms.entries, {});
  assert.ok(!data.audit.introReachableCharacterIds.includes(147));
  assert.doesNotMatch(renderToStaticMarkup(<Ti005Introduction frame={209}/>), /data-ti005-intro-example/);
});
