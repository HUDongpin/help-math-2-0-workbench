#!/usr/bin/env node

import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = 'catalog/page-only-current-js-product-releases.json';
const CALIBRATION_PATH =
  'catalog/product-bridge-calibrations/g5-l5-page-only-current-js-56-v1.json';
const CHECK = process.argv.includes('--check');
const EXPECTED = Object.freeze({
  grade: 5,
  lesson: 5,
  count: 56,
  releaseOrder: 6,
  releaseId: 'lesson-g05-l05-add-subtract-negative-numbers',
});

function invariant(value, message) {
  if (!value) throw new Error(message);
}

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
}

function buildRelease(lessonCatalog, animationCatalog, calibration) {
  const lesson = lessonCatalog.lessons.find((candidate) =>
    candidate.grade === EXPECTED.grade && candidate.lesson === EXPECTED.lesson
  );
  invariant(
    lesson?.pageReferenceCount === EXPECTED.count,
    'G5 L5 lesson catalog denominator drifted',
  );
  invariant(
    calibration?.calibrationId === 'g5-l5-page-only-current-js-56-v1' &&
      calibration.status === 'page-only-private-current-js-registered-56-of-56' &&
      calibration.scope?.releaseId === EXPECTED.releaseId &&
      calibration.scope?.activePageCount === EXPECTED.count &&
      calibration.scope?.courseShellCount === 0 &&
      calibration.selectedPages?.length === EXPECTED.count &&
      Object.values(calibration.acceptanceEffects ?? {}).every(
        (value) => value === false,
      ),
    'G5 L5 private product-bridge calibration boundary drifted',
  );

  const ordered = animationCatalog.animations.flatMap((animation) =>
    (animation.references?.courseXml ?? [])
      .filter(({sourceXmlPath}) => sourceXmlPath === lesson.path)
      .map((reference) => ({
        occurrence: reference.occurrence,
        animation,
      }))
  ).sort((left, right) => left.occurrence - right.occurrence);
  invariant(
    ordered.length === EXPECTED.count &&
      ordered.every(({occurrence}, index) => occurrence === index + 1),
    'G5 L5 exact course-XML occurrence sequence drifted',
  );
  invariant(
    ordered.every(({animation}, index) =>
      calibration.selectedPages[index]?.animationId === animation.animationId &&
      calibration.selectedPages[index]?.globalPageOrdinal === index + 1 &&
      calibration.selectedPages[index]?.source?.swfSha256 ===
        animation.source?.sha256
    ),
    'G5 L5 calibration/source sequence binding drifted',
  );

  const shardId = 'g05-l05-page-only';
  const members = ordered.map(({animation, occurrence}) => {
    invariant(
      typeof animation.animationId === 'string' &&
        /^swf-[a-f0-9]{64}$/.test(animation.assetId ?? '') &&
        /^[a-f0-9]{64}$/.test(animation.source?.sha256 ?? ''),
      `G5 L5 occurrence ${occurrence}: source identity drifted`,
    );
    return Object.freeze({
      ordinal: occurrence,
      placementId:
        `g05-l05-placement-${String(occurrence).padStart(3, '0')}`,
      animationId: animation.animationId,
      assetId: animation.assetId,
      releaseRole: 'active-xml-referenced-page',
      batchId: shardId,
      shardId,
      source: Object.freeze({
        path: animation.source.path,
        sha256: animation.source.sha256,
      }),
      xmlOccurrence: occurrence,
    });
  });

  return Object.freeze({
    releaseOrder: EXPECTED.releaseOrder,
    releaseId: EXPECTED.releaseId,
    releaseType: 'complete-lesson',
    publicationMode: 'atomic',
    developmentMode: 'single-shard',
    queueId: `release-${EXPECTED.releaseId}`,
    grade: EXPECTED.grade,
    lesson: EXPECTED.lesson,
    titleDisplay: lesson.titleDisplay,
    domain: lesson.domain,
    sourceLesson: Object.freeze({
      path: lesson.path,
      bytes: lesson.bytes,
      sha256: lesson.sha256,
      sequenceAuthority: 'active-course-xml-global-page-order',
    }),
    expectedCounts: Object.freeze({
      activeXmlReferencedPages: EXPECTED.count,
      uniquePageAnimations: new Set(
        members.map(({animationId}) => animationId),
      ).size,
      courseShells: 0,
      members: EXPECTED.count,
      shards: 1,
    }),
    scope: Object.freeze({
      collection: 'course',
      grade: EXPECTED.grade,
      lesson: EXPECTED.lesson,
      excludeNonMembers: true,
      pageOnly: true,
      legacyFlashCourseShellExcluded: true,
      modernMyLessonHostRetained: true,
    }),
    shards: Object.freeze([
      Object.freeze({
        shardId,
        batchId: shardId,
        ordinal: 1,
        parallelGroup: 'g05-l05-page-only-integration',
        memberCount: EXPECTED.count,
        developmentPrerequisites: Object.freeze([]),
      }),
    ]),
    members: Object.freeze(members),
  });
}

const [current, lessonCatalog, animationCatalog, calibration] =
  await Promise.all([
    json(OUTPUT_PATH),
    json('catalog/lessons.json'),
    json('catalog/animations.json'),
    json(CALIBRATION_PATH),
  ]);
invariant(
  current.schemaVersion === 1 &&
    current.manifestKind === 'page-only-current-js-product-releases' &&
    Object.values(current.acceptanceEffects ?? {}).every(
      (value) => value === false,
    ),
  'Page-only product release manifest boundary drifted',
);
const release = buildRelease(lessonCatalog, animationCatalog, calibration);
const releases = [
  ...current.releases.filter(({releaseId}) =>
    releaseId !== EXPECTED.releaseId
  ),
  release,
].sort((left, right) =>
  left.releaseOrder - right.releaseOrder ||
  left.releaseId.localeCompare(right.releaseId)
);
const output = `${JSON.stringify({...current, releases}, null, 2)}\n`;
const previous = await readFile(path.join(ROOT, OUTPUT_PATH), 'utf8');
if (CHECK) {
  invariant(previous === output, `${OUTPUT_PATH} is stale`);
} else {
  await writeFile(path.join(ROOT, OUTPUT_PATH), output);
}

process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  check: CHECK,
  releaseId: release.releaseId,
  activePages: release.members.length,
  uniquePageAnimations: release.expectedCounts.uniquePageAnimations,
  courseShellCount: 0,
  acceptanceEffectsChanged: false,
}, null, 2)}\n`);
