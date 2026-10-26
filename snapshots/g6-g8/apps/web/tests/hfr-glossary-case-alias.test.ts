import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {hfrGlossaryCaseAlias} from '../lib/hfr-glossary-case-alias';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const prior = {id: 'rational-numbers', sourceKeyAttribute: 'rational numbers'};
const entry = {id: 'rational-numbers', sourceKeyAttribute: 'Rational Numbers'};
const request = (sourceKeyAttribute: string | undefined, dictionaryEntryId = 'rational-numbers') => ({dictionaryEntryId, sourceKeyAttribute});

test('a key that differs only by letter case aliases the prior entry', () => {
  assert.equal(hfrGlossaryCaseAlias(prior, entry, [request('Rational numbers')]), true);
  // P014 binds two source buttons to the same entry.
  assert.equal(hfrGlossaryCaseAlias(prior, entry, [request('Rational numbers'), request('Rational numbers'), request('Ratio', 'ratio')]), true);
});

test('anything beyond letter case is a conflict', () => {
  assert.equal(hfrGlossaryCaseAlias(prior, entry, []), false, 'no source request for the entry');
  assert.equal(hfrGlossaryCaseAlias(prior, entry, [request('Ratio', 'ratio')]), false, 'requests only for other entries');
  assert.equal(hfrGlossaryCaseAlias(prior, entry, [request('Rational numbers'), request('Rational number')]), false, 'one request differs');
  assert.equal(hfrGlossaryCaseAlias(prior, entry, [request(undefined)]), false, 'request without a key');
  assert.equal(hfrGlossaryCaseAlias({...prior, sourceKeyAttribute: 'rational number'}, entry, [request('Rational numbers')]), false, 'prior key differs');
  assert.equal(hfrGlossaryCaseAlias({...prior, id: 'ratio'}, entry, [request('Rational numbers')]), false, 'different dictionary id');
  assert.equal(hfrGlossaryCaseAlias(prior, {...entry, sourceKeyAttribute: ''}, [request('')]), false, 'empty key');
});

// The twelve replaced page blocks each accepted exactly this L11 alias.
const REVIEWED = ['p005', 'p007', 'p009', 'p010', 'p012', 'p013', 'p014', 'p015', 'p019', 'p020', 'p022', 'p023'].map(p => `shared-nms002-l11-${p}`);

test('every reviewed L11 Rational Numbers page still aliases through its pinned packet', () => {
  const server = read('apps/web/lib/hfr-local-pages.server.ts');
  for (const id of REVIEWED) {
    const pin = new RegExp(`'${id}': Object\\.freeze\\((\\{"path":"[^"]+","bytes":\\d+,"sha256":"[0-9a-f]{64}"\\})\\)`).exec(server);
    assert(pin, `${id} candidate pin`);
    const packet = JSON.parse(read(JSON.parse(pin[1]).path));
    const own = packet.glossary.descriptorEntries.find((e: {id: string}) => e.id === 'rational-numbers');
    assert.equal(own.sourceKeyAttribute, 'Rational Numbers', id);
    assert.equal(own.source.en.sha256, '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b', id);
    assert.equal(own.source.es.sha256, '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407', id);
    assert.equal(hfrGlossaryCaseAlias({...own, sourceKeyAttribute: 'rational numbers'}, own, packet.glossary.sourceGlossary.terms), true, id);
  }
});
