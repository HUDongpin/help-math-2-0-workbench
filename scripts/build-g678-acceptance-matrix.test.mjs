import test from 'node:test';
import assert from 'node:assert/strict';

import {buildMatrix} from './build-g678-acceptance-matrix.mjs';

const profile = {
  profileId: 'fixture',
  canonicalLessonXmlCount: 44,
  activePagePlacementCount: 2282,
  uniqueActiveSwfSha256Count: 2240,
  audit: {
    commentedPageCount: 315,
    bomXmlCount: 39,
    bareAmpersandCount: 7,
    canonicalFileCounts: {swf: 2776, mp3: 13353, fla: 0},
    missingSources: [],
    unknownSwfMagic: [],
    variantPlacements: 46,
    dependencyHolds: 92,
    audioCandidatePages: 2133,
  },
  modules: [
    {moduleCode: 'NMS002', lessons: [{lessonNumber: 1, activePageCount: 2}]},
    {moduleCode: 'GEO001', lessons: [{lessonNumber: 1, activePageCount: 1}]},
    {moduleCode: 'ALG001', lessons: [{lessonNumber: 1, activePageCount: 1}]},
    {moduleCode: 'DAT001', lessons: [{lessonNumber: 1, activePageCount: 1}]},
  ],
};
const mapping = {
  records: [
    {moduleCode: 'NMS002', lessonNumber: 1, primaryGrade: 6, gradeTags: [6], status: 'approved'},
  ],
};

test('acceptance matrix keeps all shared lessons and separates registration from acceptance', () => {
  const matrix = buildMatrix({
    profile,
    mapping,
    profileIdentity: {path: 'fixture-profile', sha256: 'a'.repeat(64)},
    mappingIdentity: {path: 'fixture-mapping', sha256: 'b'.repeat(64)},
  });
  assert.equal(matrix.lessons.length, 44);
  assert.equal(matrix.funnel.lessons, 44);
  assert.equal(matrix.funnel.registeredCurrentJsPages, 0);
  assert.equal(matrix.funnel.engineeringPreviewLessons, 0);
  assert.equal(matrix.sourceAudit.canonicalLessonXmlCount, 44);
  assert.equal(matrix.sourceAudit.activePagePlacementCount, 2282);
  assert.equal(matrix.sourceAudit.canonicalFlaCount, 0);
  assert.equal(matrix.sourceAudit.acceptanceNeutral, true);
  assert.equal(matrix.source.releaseManifestPath, null);
  assert.equal(matrix.acceptanceEffects.published, false);
  assert.equal(matrix.acceptanceEffects.strictComplete, false);
  const nms = matrix.lessons.find((entry) => entry.stableLessonKey === 'shared-nms002-l01');
  assert.equal(nms?.mappingStatus, 'approved');
  assert.equal(nms?.availability, 'locked');
  assert.equal(nms?.primaryGrade, 6);
});

test('acceptance matrix does not treat a registered page as downstream acceptance', () => {
  const matrix = buildMatrix({
    profile: {
      ...profile,
      lessons: [{
        moduleCode: 'NMS002', lessonNumber: 1, activePageCount: 2,
        pages: [{registered: true}, {registered: true}],
      }],
    },
    mapping: {
      records: [{moduleCode: 'NMS002', lessonNumber: 1, primaryGrade: 6, gradeTags: [6], status: 'approved'}],
    },
    profileIdentity: {path: 'fixture-profile', sha256: 'a'.repeat(64)},
    mappingIdentity: {path: 'fixture-mapping', sha256: 'b'.repeat(64)},
  });
  const nms = matrix.lessons.find((entry) => entry.stableLessonKey === 'shared-nms002-l01');
  assert.equal(nms?.registeredPageCount, 2);
  assert.equal(nms?.availability, 'engineering-preview');
  assert.equal(nms?.acceptance.fidelity, false);
  assert.equal(nms?.acceptance.audio, false);
  assert.equal(nms?.acceptance.humanVisual, false);
});
