import assert from 'node:assert/strict';
import test from 'node:test';
import {applyCompletionLedger, normalizeClassificationEvidence, normalizeMissingReference, normalizeXmlReferences, strictCompletionSummaryMatchesEntries, type MigrationStatus} from '../lib/catalog-overlays';

test('classification evidence stays structured', () => assert.deepEqual(normalizeClassificationEvidence([{source: 'xml', path: 'a.xml', value: 'Title'}, 'manual']), [{source: 'xml', path: 'a.xml', value: 'Title'}, {source: 'catalog', value: 'manual'}]));
test('course and keyterm references preserve distinct fields', () => {
  assert.deepEqual(normalizeXmlReferences([{sourceXmlPath: 'a.xml', expectedPath: 'a.swf', occurrence: 1}]), [{sourceXmlPath: 'a.xml', expectedPath: 'a.swf', occurrence: 1}]);
  assert.deepEqual(normalizeXmlReferences([{sourceXmlPath: 'k.xml', filename: 'k.swf', syntax: 'canonical'}]), [{sourceXmlPath: 'k.xml', filename: 'k.swf', syntax: 'canonical'}]);
});
test('only asset-matching ledger entries unlock complete', () => {
  const targets: Array<{animationId: string; assetId: string; migration: {status: MigrationStatus; [key: string]: unknown}}> = [{animationId: 'a', assetId: 'swf-a', migration: {status: 'complete'}}, {animationId: 'b', assetId: 'swf-b', migration: {status: 'complete'}}, {animationId: 'c', assetId: 'swf-c', migration: {status: 'discovered'}}];
  const result = applyCompletionLedger(targets, [{animationId: 'a', assetId: 'swf-a', workspace: 'm/a', manifestSha256: '1', route: '/a', registryModule: './modules/a'}, {animationId: 'b', assetId: 'wrong', workspace: 'm/b', manifestSha256: '2', route: '/b', registryModule: './modules/b'}], [{animationId: 'c', status: 'preserved'}]);
  assert.deepEqual(result.map((item) => item.migration.status), ['complete', 'discovered', 'preserved']);
});
test('strict completion summary must equal the exact entry count', () => {
  assert.equal(strictCompletionSummaryMatchesEntries({strictComplete: 2}, [{}, {}]), true);
  assert.equal(strictCompletionSummaryMatchesEntries({strictComplete: 1}, [{}, {}]), false);
  assert.equal(strictCompletionSummaryMatchesEntries({}, []), false);
});
test('missing keyterms keep bilingual titles and shared grade', () => {
  const value = normalizeMissingReference({expectedPath: 'a.swf', occurrences: [{titleEnglish: 'Accurate', titleSpanish: 'Exacto'}, {}]}, 0, 'keyterm');
  assert.equal(value.grade, 'elementary'); assert.equal(value.titleSpanish, 'Exacto'); assert.equal(value.occurrenceCount, 2);
});
