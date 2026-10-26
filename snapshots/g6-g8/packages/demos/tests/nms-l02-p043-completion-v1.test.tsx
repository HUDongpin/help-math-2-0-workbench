import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { P043_COMPLETION_TEXT, P043CompletionFeedback } from '../src/nms-l02-p043-completion-v1';
import { p043CompletionDomain, p043ClockDomain, p043ClockInitial } from '../src/nms-l02-p043-clock-v1';
test('four authored praise labels match the extracted source text exactly', () => {
  const source = JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p043/audit/source-text-catalog-v1.json', import.meta.url), 'utf8'));
  const texts = new Map(source.textDefinitions.map((d: {characterId: number; runs?: {text: string}[]}) => [d.characterId, (d.runs ?? []).map(r => r.text ?? '').join('')]));
  for (const item of Object.values(P043_COMPLETION_TEXT)) for (const id of item.sourceTextIds) assert.equal(item.en, texts.get(id));
  const structure = JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p043/audit/source-structure-v1.json', import.meta.url), 'utf8'));
  for (const [domain, item] of Object.entries(P043_COMPLETION_TEXT)) {
    const timeline = structure.timelines.find((t: {timelineId:string}) => t.timelineId === `sprite-${domain}`);
    const placed = Object.values(timeline.changes).flat() as {kind:string; characterId?:number}[];
    for (const id of item.sourceTextIds) assert.ok(placed.some(e => e.kind === 'place' && e.characterId === id), `${domain}/${id}`);
  }
});
test('all five seeds select the same completion identity for visual and audio paths', () => {
  for (let seed = 0; seed < 10; seed++) {
    const domain = p043CompletionDomain(seed), initial = p043ClockInitial(seed);
    assert.equal(p043ClockDomain({ ...initial, state: { ...initial.state, phase: 'completion-feedback' } }), domain);
    for (const language of ['en', 'es'] as const) {
      const html = renderToStaticMarkup(<P043CompletionFeedback domain={domain} language={language} />);
      assert.ok(html.includes(P043_COMPLETION_TEXT[domain][language]));
      assert.ok(html.includes(`data-feedback-domain="${domain}"`));
      assert.ok(html.includes('role="status"'));
    }
  }
});
