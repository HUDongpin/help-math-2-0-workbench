import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Ti006Help, TI006_HELP_DATA as data, Ti006SourceText} from '../src/modern-lessons/g4-l3-ti006-help';
import {Ti006Activity} from '../src/modern-lessons/g4-l3-ti006-activity';
import {createCourseG04L03Ti006NumberLineDragState as initial,
  reduceCourseG04L03Ti006NumberLineDrag as reduce,
  COURSE_G04_L03_TI_006_CARDS as cards} from '../src/timelines/course-g04-l03-ti-006-number-line-drag-interaction';

const root = new URL('../../../', import.meta.url);
const catalog = JSON.parse(gunzipSync(readFileSync(new URL(`catalog/typography-v1/source-catalog/assets/${data.sourceSha256}.json.gz`, root))).toString());
test('help generation checks immutable source and every printed signed label', () => {
  execFileSync('python3', ['-B','scripts/build-g4-l3-ti006-help.py','--check'], {cwd: root});
  assert.deepEqual(data.labels.map(l => l.value), Array.from({length: 21}, (_, i) => i-10));
  const timeline = catalog.timelines.find((t: any) => t.timelineId === 'sprite-263');
  for (const label of data.labels) {
    const text = catalog.textDefinitions.find((t: any) => t.characterId === label.characterId);
    assert.equal(text.runs.map((r: any) => r.text).join(''), label.sourceText);
    assert.equal(label.label, label.sourceText.replace('–','−'));
    assert.equal(label.tickXTwips, -8249 + label.value*480);
    assert.ok(timeline.events.some((e: any) => e.kind === 'place' && e.characterId === label.characterId));
  }
  for (const prose of data.prose) assert.equal(prose.text, catalog.textDefinitions.find((t: any) => t.characterId === prose.characterId).runs.map((r: any) => r.text).join(''));
});
test('help renders all 21 labels as text and exact authored glossary targets', () => {
  const markup = renderToStaticMarkup(<Ti006Help onKeyTerm={() => {}}/>);
  for (const l of data.labels) assert.ok(markup.includes(`>${l.label}</span>`), l.label);
  assert.equal((markup.match(/data-lesson-text-block="help-tick-/g) ?? []).length, 21);
  assert.doesNotMatch(markup, /<canvas|<img/);
  const dictionary = JSON.parse(readFileSync(new URL('apps/web/public/generated/g4-grade-wide-keyterms-en.json', root),'utf8'));
  for (const [title, id] of Object.entries(data.keyTerms.entries)) assert.equal(dictionary.entries.find((e: any) => e.id === id)?.titles.en, title);
  const text = renderToStaticMarkup(<Ti006SourceText text="position number line owes Owing negative numbers positive numbers" onKeyTerm={() => {}}/>);
  for (const id of data.keyTerms.entryIds) assert.ok(text.includes(id));
  assert.doesNotMatch(renderToStaticMarkup(<Ti006SourceText text="position"/>), /<button/);
});

const ref = {current: null};
const axis = Array.from({length: 17}, (_, i) => ({value: i-8,label: i < 8 ? `−${8-i}` : i === 8 ? '0' : `+${i-8}`}));
const markup = (interaction = initial(), helpOpen = false) => renderToStaticMarkup(<Ti006Activity
  axis={axis} interaction={interaction} helpOpen={helpOpen} dispatch={() => {}}
  onOpenHelp={() => {}} onCloseHelp={() => {}} onCloseWrong={() => {}}
  helpButtonRef={ref} helpCloseRef={ref} wrongCloseRef={ref}/>);
test('native activity shows full main axis, cards and no premature help or correct assignments', () => {
  const html = markup();
  assert.equal((html.match(/data-lesson-text-block="axis-/g) ?? []).length, 17);
  assert.doesNotMatch(html, /data-ti006-native-help|aria-label="placed"|Correct!!!/);
  for (const c of cards) assert.ok(html.includes(`Select ${c.accessibleLabel} to move`));
  assert.equal((html.match(/draggable="true"/g) ?? []).length, 5);
});
test('help, wrong retry, five placements and Replay keep source state and native visible content separate', () => {
  let state = reduce(initial(), {type: 'select-card', cardId: 'Scr_1'});
  assert.match(markup(state, true), /data-ti006-native-help="true"/);
  assert.doesNotMatch(markup(state, true), /draggable="true"/);
  state = reduce(state, {type: 'drop-card', targetId: 'Mc_Tar_2'});
  assert.match(markup(state), /source-static-221-host-assignment-unresolved/);
  assert.ok(markup(state).includes(data.wrongFeedback.text));
  assert.match(markup(state), /role="alertdialog"/);
  state = reduce(state, {type: 'close-wrong'});
  for (const c of cards) {
    state = reduce(state, {type: 'drop-card', cardId: c.id, targetId: c.targetId});
    assert.equal(state.outcome, 'correct-feedback');
    assert.match(markup(state), /aria-label="placed"/);
    state = reduce(state, {type: 'feedback-complete'});
  }
  assert.equal(state.outcome, 'complete');
  assert.match(markup(state), /Correct!!!/);
  assert.doesNotMatch(markup(state), /Select Sapna/);
  assert.equal(markup(reduce(state, {type: 'replay'})), markup());
});
