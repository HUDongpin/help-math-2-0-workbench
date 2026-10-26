import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {hfrSourceGlossaryRequests} from '../lib/hfr-source-glossary-requests';
import {hfrP009SourceGlossaryRequests} from '../lib/hfr-p009-source-html-glossary';
import {hfrP010SourceGlossaryRequests} from '../lib/hfr-p010-source-html-glossary';
import {hfrP014SourceGlossaryRequests} from '../lib/hfr-p014-source-glossary';
import {P009_NATIVE} from '../../../packages/demos/src/hfr/nms-l11-p009-native-binding';
import {P010_NATIVE} from '../../../packages/demos/src/hfr/nms-l11-p010-native-binding';
import {P014_META} from '../../../packages/demos/src/hfr/nms-l11-p014-meta';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const ids = (requests: readonly {dictionaryEntryId: string}[]) => requests.map(r => r.dictionaryEntryId).sort();
const term = (dictionaryEntryId: string, sourceKeyAttribute: string, sourceButtonCharacterId: number) => ({dictionaryEntryId, sourceKeyAttribute, sourceButtonCharacterId});

test('a reviewed page must equal its own source binding exactly', () => {
  for (const own of [P009_NATIVE, P010_NATIVE]) {
    const addition = {sourceGlossary: clone(own.sourceGlossary), sourceHtmlLinks: clone(own.sourceHtmlLinks)} as any;
    assert.deepEqual(ids(hfrSourceGlossaryRequests(own.animationId, own.sourceSha256, addition)), ['express', 'integers', 'ratio', 'rational-numbers']);
    assert.throws(() => hfrSourceGlossaryRequests(own.animationId, '0'.repeat(64), addition), /source identity/);
    assert.throws(() => hfrSourceGlossaryRequests(own.animationId, own.sourceSha256, {...addition, sourceHtmlLinks: undefined}), /HTML function links/);
    const moved = clone(addition); moved.sourceHtmlLinks[0].sourceActionSha256 = '0'.repeat(64);
    assert.throws(() => hfrSourceGlossaryRequests(own.animationId, own.sourceSha256, moved), /HTML function links/);
    const button = clone(addition); button.sourceGlossary.terms[0].sourceButtonCharacterId += 1;
    assert.throws(() => hfrSourceGlossaryRequests(own.animationId, own.sourceSha256, button), /button releases/);
  }
  const p014 = {sourceGlossary: clone(P014_META.sourceGlossary)} as any;
  assert.deepEqual(ids(hfrSourceGlossaryRequests(P014_META.key, P014_META.sourceSha256, p014)), ['expression', 'integers', 'number-line', 'position', 'ratio', 'rational-numbers']);
  assert.throws(() => hfrSourceGlossaryRequests(P014_META.key, P014_META.sourceSha256, {...p014, sourceHtmlLinks: clone(P009_NATIVE.sourceHtmlLinks)}), /HTML function links/);
});

test('any other page gets one request per entry, and requests for one entry must agree on the key', () => {
  const page = 'shared-nms002-l11-p099', sha = 'a'.repeat(64);
  const glossary = (terms: object[]) => ({sourceGlossary: {pageKey: page, sourceSha256: sha, terms}}) as any;
  assert.deepEqual(hfrSourceGlossaryRequests(page, sha, glossary([term('ratio', 'Ratio', 7), term('integers', 'Integers', 8)])),
    [term('ratio', 'Ratio', 7), term('integers', 'Integers', 8)]);
  // Two source buttons for one dictionary entry, as on P014.
  assert.deepEqual(ids(hfrSourceGlossaryRequests(page, sha, glossary([term('ratio', 'Ratio', 7), term('ratio', 'Ratio', 9)]))), ['ratio']);
  assert.throws(() => hfrSourceGlossaryRequests(page, sha, glossary([term('ratio', 'Ratio', 7), term('ratio', 'Ratios', 9)])), /agree on the source key/);
  assert.throws(() => hfrSourceGlossaryRequests(page, sha, {...glossary([term('ratio', 'Ratio', 7)]), sourceHtmlLinks: clone(P009_NATIVE.sourceHtmlLinks)}), /exact reviewed page/);
});

test('every pinned HFR packet keeps exactly the requests of the replaced per-page dispatch', () => {
  const server = read('apps/web/lib/hfr-local-pages.server.ts');
  const pins = [...new Set([...server.slice(server.indexOf('const CANDIDATES'), server.indexOf('type HfrReadContext')).matchAll(/catalog\/product-bridge-calibrations\/[^'"]+\.json/g)].map(m => m[0]))];
  assert.equal(pins.length, 34);
  let withGlossary = 0;
  for (const pin of pins) {
    const packet = JSON.parse(read(pin)), key = packet.entry.key;
    if (!packet.glossary) continue;
    withGlossary++;
    const maintained = (key === 'shared-nms002-l11-p014' ? hfrP014SourceGlossaryRequests : key === 'shared-nms002-l11-p010' ? hfrP010SourceGlossaryRequests : hfrP009SourceGlossaryRequests)(key, packet.source.sha256, packet.glossary);
    assert.deepEqual(hfrSourceGlossaryRequests(key, packet.source.sha256, packet.glossary), maintained, key);
  }
  assert(withGlossary >= 20, `${withGlossary} pinned glossary packets`);
});
