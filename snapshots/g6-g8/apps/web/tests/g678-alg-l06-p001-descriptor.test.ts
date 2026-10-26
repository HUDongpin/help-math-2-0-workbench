import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';
import {
  ALG_L6_P001_FREEZE, ALG_L6_P001_ID, extendAlgL6P001Descriptor,
  readAlgL6P001Packet,
} from '../lib/g678-alg-l06-p001.server';
import {g678RegisteredDescriptorsWithExtensions} from '../lib/g678-current-js-extensions.server';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

function packet() {
  const old = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = sourceRoot;
  try { return readAlgL6P001Packet(); }
  finally {
    if (old === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = old;
  }
}

function base(sourceXmlSha256: string): PageOnlyLessonPlayerDescriptor {
  return {
    course: {moduleCode: 'ALG001', lesson: 6, activePageCount: 60,
      courseShellCount: 0, href: '/migration-status/g678-calibration/shared-alg001-l06-p002'},
    source: {sourceXmlPath: 'G6-G8-shared/ALG001/L6/index.xml', sourceXmlSha256},
    pages: Array.from({length: 60}, (_, index) => {
      const first = index === 0, second = index === 1;
      const id = `shared-alg001-l06-p${String(index + 1).padStart(3, '0')}`;
      return {animationId: id, placementId: id, globalPageOrdinal: index + 1,
        sectionCode: first ? 'IR' : 'RW', sectionPageOrdinal: first ? 1 : index,
        source: {assetId: first
          ? 'swf-9daa5ffe3a1ea275d9467eadafc7addbbb26d14ad1c289e84b3f66f6b0ab9d35'
          : `swf-test-${index}`},
        rendererAvailability: second ? {kind: 'registered', moduleKey: id}
          : {kind: 'unavailable', reason: 'test-only fixture'}};
    }),
    productBridge: {registeredAnimationCount: 1,
      selectedAnimationIds: ['shared-alg001-l06-p002']},
  } as unknown as PageOnlyLessonPlayerDescriptor;
}

function registration(p: ReturnType<typeof packet>) {
  return {calibrationId: p.calibrationId, deploymentScope: 'local-only',
    maturity: 'private-current-js', rendererBindingKind: 'maintained-dom-module-v1',
    freezeManifestSha256: ALG_L6_P001_FREEZE.sha256,
    moduleSha256: p.entry.artifacts.module.sha256,
    timelineSha256: p.entry.artifacts.timeline.sha256,
    memberManifestSha256: p.entry.artifacts.memberManifest.sha256,
    sourceRunSha256: p.entry.artifacts.sourceRun.sha256,
  } as Parameters<typeof extendAlgL6P001Descriptor>[2];
}

test('P001 packet rehashes the exact source, module, and 32 frozen inputs/outputs', () => {
  const p = packet();
  assert.equal(p.entry.key, ALG_L6_P001_ID);
  assert.equal(p.inputs.length + p.outputs.length, 32);
  assert.equal(p.selectedPages[0].runtime.frameDomain, 'sprite-142');
  assert.equal(p.productCalibrationPassed, false);
});

test('P001 descriptor extension adds only source-ordered first page', () => {
  const p = packet(), predecessor = base(p.sourceXml.sha256);
  const next = extendAlgL6P001Descriptor(predecessor, p, registration(p));
  assert.equal(next.pages.length, 60);
  assert.equal(next.pages[0].rendererAvailability.kind, 'registered');
  assert.equal(next.pages[0].rendererAvailability.runtimeQuery?.frameDomain, 'sprite-142');
  assert.equal(next.pages[1], predecessor.pages[1]);
  assert.equal(next.productBridge.registeredAnimationCount, 2);
  assert.deepEqual(next.productBridge.selectedAnimationIds,
    [ALG_L6_P001_ID, 'shared-alg001-l06-p002']);
  assert.equal(next.source.candidateFreezeManifestSha256, ALG_L6_P001_FREEZE.sha256);
});

test('P001 descriptor extension rejects drifted source and unregistered P002', () => {
  const p = packet();
  const wrong = base('0'.repeat(64));
  assert.throws(() => extendAlgL6P001Descriptor(wrong, p, registration(p)),
    /exact unavailable source page/u);
  const unregistered = base(p.sourceXml.sha256);
  const pages = unregistered.pages.map((page, index) => index === 1
    ? {...page, rendererAvailability: {kind: 'unavailable' as const,
        reason: 'test-only fixture'}} : page);
  assert.throws(() => extendAlgL6P001Descriptor(
    {...unregistered, pages}, p, registration(p)), /registered P002 predecessor/u);
});

test('the generic My Lesson listing selects the admitted P001 extension', {timeout: 120_000}, () => {
  const old = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = sourceRoot;
  try {
    const lesson = g678RegisteredDescriptorsWithExtensions().find(descriptor =>
      descriptor.course.moduleCode === 'ALG001' && descriptor.course.lesson === 6);
    assert.equal(lesson?.pages.length, 60);
    assert.equal(lesson.productBridge.registeredAnimationCount, 19);
    assert.equal(lesson.pages[0].rendererAvailability.kind, 'registered');
    assert.equal(lesson.pages[0].rendererAvailability.moduleKey, ALG_L6_P001_ID);
    assert.equal(lesson.course.href,
      '/migration-status/g678-calibration/shared-alg001-l06-p001?host=1');
  } finally {
    if (old === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = old;
  }
});
