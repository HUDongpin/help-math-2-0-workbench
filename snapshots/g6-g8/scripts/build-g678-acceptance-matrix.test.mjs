import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMatrix,
  parseLocalOnlyRegistryMetadata,
} from './build-g678-acceptance-matrix.mjs';

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

test('calibration evidence reports partial page registration without inventing a whole-lesson preview', () => {
  const calibrationEvidence = {
    freeze: {path: 'freeze.json', sha256: 'c'.repeat(64)},
    privateRegistry: {path: 'private.json', sha256: 'd'.repeat(64)},
    localRegistry: {path: 'local.ts', sha256: 'e'.repeat(64)},
    advancedFragment: {path: 'advanced.json', sha256: 'f'.repeat(64)},
    summary: {
      calibrationId: 'g678-16-page-product-calibration-v1',
      frozenCalibrationPlacementCount: 16,
      sharedGeneratedCandidatePages: 13,
      advancedGeneratedCandidatePages: 3,
      registeredCurrentJsPages: 16,
      localPagePreviews: 16,
      wholeLessonEngineeringPreviews: 0,
      advancedRegisteredPages: 3,
      scaleOutAuthorized: false,
      productCalibrationPassed: false,
    },
  };
  const matrix = buildMatrix({
    profile,
    mapping,
    profileIdentity: {path: 'fixture-profile', sha256: 'a'.repeat(64)},
    mappingIdentity: {path: 'fixture-mapping', sha256: 'b'.repeat(64)},
    calibrationEvidence,
    registeredByLesson: new Map([['shared-nms002-l01', 1]]),
  });
  assert.equal(matrix.funnel.registeredCurrentJsPages, 1);
  assert.equal(matrix.funnel.engineeringPreviewLessons, 0);
  assert.equal(matrix.calibration?.advancedRegisteredPages, 3);
  assert.equal(matrix.source.calibrationFreezeSha256, 'c'.repeat(64));
  assert.equal(matrix.matrixId, 'g678-current-js-calibration-funnel-v1');
  assert.equal(matrix.source.scope,
    'canonical-active-page-only-with-private-local-calibration');
});

test('local registry parser ignores comments and requires exact key/metadata sets', () => {
  const key = 'shared-nms002-l01-p001';
  const source = `
    // shared-geo001-l01-p001 must not count as a registration.
    export const registeredLocalOnlyAnimationKeys: readonly string[] =
      process.env.NODE_ENV === 'production' ? Object.freeze([]) : Object.freeze([
        '${key}'
      ]);
    export const localOnlyAnimationModuleRegistrations =
      process.env.NODE_ENV === 'production' ? Object.freeze({}) : Object.freeze({
        '${key}': Object.freeze({maturity: 'private-current-js', scope: 'private-engineering', deploymentScope: 'local-only', calibrationId: 'g678-16-page-product-calibration-v1', freezeManifestSha256: '${'a'.repeat(64)}', moduleSha256: '${'b'.repeat(64)}', timelineSha256: '${'c'.repeat(64)}', runtimeSha256: '${'d'.repeat(64)}'})
      });
  `;
  const parsed = parseLocalOnlyRegistryMetadata(source);
  assert.deepEqual(parsed.keys, [key]);
  assert.equal(parsed.records.size, 1);
  assert.equal(parsed.records.get(key)?.runtimeSha256, 'd'.repeat(64));
  assert.throws(() => parseLocalOnlyRegistryMetadata(source.replace(
    `        '${key}'\n`,
    `        '${key}', '${key}'\n`,
  )), /repeats|key and metadata sets differ/u);
});
