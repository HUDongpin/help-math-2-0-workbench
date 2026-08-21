#!/usr/bin/env node

import {readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = 'catalog/page-only-current-js-product-releases.json';
const METADATA_OUTPUT_PATH =
  'apps/web/lib/g4-page-only-release-metadata.generated.ts';
const CHECK = process.argv.includes('--check');
const LESSONS = Object.freeze([
  Object.freeze({
    lesson: 5,
    count: 53,
    releaseOrder: 2,
    releaseId: 'lesson-g04-l05-multiplication-page-only',
  }),
  Object.freeze({
    lesson: 10,
    count: 46,
    releaseOrder: 3,
    releaseId: 'lesson-g04-l10-perimeter-area-page-only',
  }),
  Object.freeze({
    lesson: 11,
    count: 43,
    releaseOrder: 4,
    releaseId: 'lesson-g04-l11-coordinate-grid-page-only',
  }),
]);

function invariant(value, message) {
  if (!value) throw new Error(message);
}

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
}

function releaseFor(expected, lessonCatalog, animationCatalog) {
  const lesson = lessonCatalog.lessons.find((candidate) =>
    candidate.grade === 4 && candidate.lesson === expected.lesson
  );
  invariant(
    lesson?.pageReferenceCount === expected.count,
    `G4 L${expected.lesson}: lesson catalog denominator drifted`,
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
    ordered.length === expected.count &&
      ordered.every(({occurrence}, index) => occurrence === index + 1),
    `G4 L${expected.lesson}: exact course-XML occurrence sequence drifted`,
  );
  const lessonCode = String(expected.lesson).padStart(2, '0');
  const shardId = `g04-l${lessonCode}-page-only`;
  const members = ordered.map(({animation, occurrence}) => {
    invariant(
      typeof animation.animationId === 'string' &&
        /^swf-[a-f0-9]{64}$/.test(animation.assetId ?? '') &&
        /^[a-f0-9]{64}$/.test(animation.source?.sha256 ?? ''),
      `G4 L${expected.lesson} occurrence ${occurrence}: source identity drifted`,
    );
    return Object.freeze({
      ordinal: occurrence,
      placementId:
        `g04-l${lessonCode}-placement-${String(occurrence).padStart(3, '0')}`,
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
    releaseOrder: expected.releaseOrder,
    releaseId: expected.releaseId,
    releaseType: 'complete-lesson',
    publicationMode: 'atomic',
    developmentMode: 'single-shard',
    queueId: `release-${expected.releaseId}`,
    grade: 4,
    lesson: expected.lesson,
    titleDisplay: lesson.titleDisplay,
    domain: lesson.domain,
    sourceLesson: Object.freeze({
      path: lesson.path,
      bytes: lesson.bytes,
      sha256: lesson.sha256,
      sequenceAuthority: 'active-course-xml-global-page-order',
    }),
    expectedCounts: Object.freeze({
      activeXmlReferencedPages: expected.count,
      uniquePageAnimations: new Set(
        members.map(({animationId}) => animationId),
      ).size,
      courseShells: 0,
      members: expected.count,
      shards: 1,
    }),
    scope: Object.freeze({
      collection: 'course',
      grade: 4,
      lesson: expected.lesson,
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
        parallelGroup: 'g04-page-only-integration',
        memberCount: expected.count,
        developmentPrerequisites: Object.freeze([]),
      }),
    ]),
    members: Object.freeze(members),
  });
}

const [current, lessonCatalog, animationCatalog] = await Promise.all([
  json(OUTPUT_PATH),
  json('catalog/lessons.json'),
  json('catalog/animations.json'),
]);
invariant(
  current.schemaVersion === 1 &&
    current.manifestKind === 'page-only-current-js-product-releases' &&
    Object.values(current.acceptanceEffects ?? {}).every(
      (value) => value === false,
    ),
  'Page-only product release manifest boundary drifted',
);
const replacementIds = new Set(LESSONS.map(({releaseId}) => releaseId));
const generatedReleases = LESSONS.map((expected) =>
  releaseFor(expected, lessonCatalog, animationCatalog)
);
const releases = [
  ...current.releases.filter(({releaseId}) => !replacementIds.has(releaseId)),
  ...generatedReleases,
].sort((left, right) =>
  left.releaseOrder - right.releaseOrder ||
  left.releaseId.localeCompare(right.releaseId)
);
const output = `${JSON.stringify({...current, releases}, null, 2)}\n`;
const previous = await readFile(path.join(ROOT, OUTPUT_PATH), 'utf8');
const runtimeDirectoryNames = new Set(
  (await readdir(
    path.join(ROOT, 'apps/web/public/flash-assets/courses'),
    {withFileTypes: true},
  )).filter((entry) => entry.isDirectory()).map(({name}) => name),
);
const metadata = `/* Generated by scripts/build-g4-page-only-product-releases.mjs. Do not edit. */
export const G4_L5_PAGE_ONLY_RELEASE_ID =
  'lesson-g04-l05-multiplication-page-only';
export const G4_L10_PAGE_ONLY_RELEASE_ID =
  'lesson-g04-l10-perimeter-area-page-only';
export const G4_L11_PAGE_ONLY_RELEASE_ID =
  'lesson-g04-l11-coordinate-grid-page-only';

export const G4_PAGE_ONLY_RELEASE_METADATA = Object.freeze(${JSON.stringify(
  generatedReleases.map((release) => ({
    releaseId: release.releaseId,
    grade: release.grade,
    lesson: release.lesson,
    assetDirectories: release.members
      .map(({animationId}) => animationId)
      .filter((animationId) => runtimeDirectoryNames.has(animationId)),
  })),
  null,
  2,
)} as const);
`;
if (CHECK) {
  invariant(previous === output, `${OUTPUT_PATH} is stale`);
  const previousMetadata = await readFile(
    path.join(ROOT, METADATA_OUTPUT_PATH),
    'utf8',
  );
  invariant(
    previousMetadata === metadata,
    `${METADATA_OUTPUT_PATH} is stale`,
  );
} else {
  await Promise.all([
    writeFile(path.join(ROOT, OUTPUT_PATH), output),
    writeFile(path.join(ROOT, METADATA_OUTPUT_PATH), metadata),
  ]);
}
process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  check: CHECK,
  releases: LESSONS.map(({lesson, count, releaseId}) => ({
    grade: 4,
    lesson,
    releaseId,
    activePages: count,
    courseShellCount: 0,
  })),
  totalActivePages: 142,
}, null, 2)}\n`);
