import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

type SourceMediaRow = {
  folderCode: string;
  languageCandidate: string;
  questionId: number;
  role: string;
  option: string | null;
  relativePath: string;
  bytes: number;
  sha256: string;
};
const bytes = readFileSync(new URL('../../../migrations/shared-nms002-l02-p064/audit/audio-source-candidates-v1.json', import.meta.url));
const inventory = JSON.parse(bytes.toString('utf8')) as {
  authority: string;
  questionContentIrSha256: string;
  folders: {folderCode: string; fileCount: number; totalBytes: number}[];
  sourceMediaRows: SourceMediaRow[];
  limitations: string[];
};

test('P064 audio is a hash-bound candidate index, not an accepted cue manifest', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '60937f89ba02f67723dc534d5e6316517e82325053d3bacafe903c28b1510e58');
  assert.equal(inventory.authority, 'source-media-candidate-index-only');
  assert.equal(inventory.questionContentIrSha256,
    'ecc84d6053005e5d34f9f1dd615144a6a1c5638bf650bf572ff071f42169c350');
  assert.deepEqual(inventory.folders, [
    {folderCode: 'EA', languageCandidate: 'en', fileCount: 175, totalBytes: 7417266},
    {folderCode: 'SA', languageCandidate: 'es', fileCount: 175, totalBytes: 8517350},
  ]);
  assert.equal(inventory.sourceMediaRows.length, 350);
  assert.ok(inventory.limitations.some(value => value.includes('not verified spoken-language')));
});

test('each folder has exactly one question and four option files for every source question', () => {
  for (const folderCode of ['EA', 'SA']) {
    const rows = inventory.sourceMediaRows.filter(row => row.folderCode === folderCode);
    assert.equal(rows.length, 175);
    for (let questionId = 1; questionId <= 35; questionId++) {
      const questionRows = rows.filter(row => row.questionId === questionId);
      assert.deepEqual(questionRows.map(row => [row.role, row.option]),
        [['question', null], ['option', 'A'], ['option', 'B'], ['option', 'C'], ['option', 'D']]);
      for (const row of questionRows) {
        assert.match(row.relativePath, new RegExp(`/FQ/${folderCode}/Q${questionId}[A-D]?\\.mp3$`));
        assert.ok(row.bytes > 0);
        assert.match(row.sha256, /^[a-f0-9]{64}$/);
      }
    }
  }
});
