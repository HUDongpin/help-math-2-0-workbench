import assert from 'node:assert/strict';import {test} from 'node:test';
import {encodeG678PreviewEntry,isSameG678PreviewEntry} from '../apps/web/lib/g678-preview-entry-v1.ts';
test('the same tab entry can restore its persisted current page after a full document refresh',()=>{
 const identity=JSON.stringify(['lesson-key','source-xml-sha','candidate-v3','shared-alg001-l10-p005','es']),path='/es/migration-status/g678-calibration/shared-alg001-l10-p005';
 const marker=encodeG678PreviewEntry(identity,path);assert.equal(isSameG678PreviewEntry(marker,identity,path),true);
 assert.equal(isSameG678PreviewEntry(marker,identity,path.replace('p005','p006')),false);
 assert.equal(isSameG678PreviewEntry(marker,identity.replace('candidate-v3','candidate-v4'),path),false);
 assert.equal(isSameG678PreviewEntry(marker,identity.replace('lesson-key','another-lesson'),path),false);
 assert.equal(isSameG678PreviewEntry(marker,identity.replace('"es"','"en"'),path),false);
 for(const invalid of [null,'broken','{}','{"version":2}'])assert.equal(isSameG678PreviewEntry(invalid,identity,path),false);
});
