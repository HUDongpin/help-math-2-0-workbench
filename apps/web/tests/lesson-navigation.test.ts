import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import type {AnimationCatalog, CatalogAnimation} from '../lib/catalog';
import {
  buildLessonNavigationDescriptor,
  canNavigateToLessonAnimation,
  findLessonNavigationForAnimation,
  findLessonNavigationForRoute,
  getLessonPageLabel,
  getVisibleLessonPages,
  isLessonReleaseOpen,
} from '../lib/lesson-navigation';
import {
  G5_L4_ATOMIC_RELEASE_ID,
  G5_L5_ATOMIC_RELEASE_ID,
  type LessonReleaseDefinition,
} from '../lib/lesson-release-publication';

const sectionCounts = [
  ['IR', 1],
  ['RW', 3],
  ['VB', 10],
  ['IN', 21],
  ['TI', 8],
  ['GS', 1],
  ['TS', 7],
  ['FQ', 3],
] as const;

const pageCoordinates = sectionCounts.flatMap(([code, count]) =>
  Array.from({length: count}, (_, index) => ({code, sectionOrdinal: index + 1})),
);

function pageAnimation(index: number): CatalogAnimation {
  const coordinate = pageCoordinates[index]!;
  const animationId = `course-g05-l04-${coordinate.code.toLowerCase()}-${String(coordinate.sectionOrdinal).padStart(3, '0')}`;
  return {
    animationId,
    assetId: `swf-${String(index + 1).padStart(64, '0')}`,
    canonicalAnimationId: animationId,
    isCanonical: true,
    source: {path: `HELP_COURSES/ELMGR5/L4/${coordinate.code}/page-${index + 1}.swf`, swf: {}},
    pairedFla: null,
    classification: {
      collection: 'course',
      grade: 5,
      lesson: 4,
      lessonTitleDisplay: 'Number Lines',
      section: {
        code: coordinate.code,
        label: coordinate.code,
        titleEnglish: `Source ${coordinate.code}`,
        titleSpanish: coordinate.code === 'VB' ? 'Palabras importantes' : undefined,
      },
      page: {number: coordinate.sectionOrdinal, ordinal: coordinate.sectionOrdinal},
      domain: 'negative-numbers-number-line',
      titleRaw: `Page ${index + 1}`,
      titleDisplay: `Page ${index + 1}`,
      titleEnglish: `Page ${index + 1}`,
      titleSpanish: index === 4 ? 'Recta numérica' : undefined,
      evidence: [],
      status: 'confirmed',
    },
    references: {
      courseXml: [{
        sourceXmlPath: 'HELP_COURSES/ELMGR5/L4/index.xml',
        expectedPath: `HELP_COURSES/ELMGR5/L4/${coordinate.code}/page-${index + 1}.swf`,
        occurrence: index + 1,
      }],
      keytermXml: [],
    },
    audio: [],
    audioGroupIds: [],
    flags: {referenced: true, unreferenced: false, variant: false, shell: false},
    migration: {status: 'discovered'},
  };
}

function shellAnimation(): CatalogAnimation {
  return {
    animationId: 'shell-course-g05-l04-index-local',
    assetId: `swf-${'f'.repeat(64)}`,
    canonicalAnimationId: 'shell-course-g05-l04-index-local',
    isCanonical: true,
    source: {path: 'HELP_COURSES/ELMGR5/L4/index_local.swf', swf: {}},
    pairedFla: null,
    classification: {
      collection: 'course',
      grade: 5,
      lesson: 4,
      lessonTitleDisplay: 'Number Lines',
      section: null,
      page: {number: null, ordinal: null},
      domain: 'platform-shell',
      titleRaw: 'Number Lines',
      titleDisplay: 'Number Lines',
      titleEnglish: 'Number Lines',
      evidence: [],
      status: 'inferred',
    },
    references: {courseXml: [], keytermXml: []},
    audio: [],
    audioGroupIds: [],
    flags: {referenced: false, unreferenced: true, variant: false, shell: true},
    migration: {status: 'discovered'},
  };
}

const pages = pageCoordinates.map((_, index) => pageAnimation(index));
const shell = shellAnimation();
const definition: LessonReleaseDefinition = {
  releaseId: G5_L4_ATOMIC_RELEASE_ID,
  publicationMode: 'atomic',
  expectedMemberCount: 55,
  scope: {collection: 'course', grade: 5, lesson: 4, excludeNonMembers: true},
  members: [
    ...pages.map((animation) => ({
      animationId: animation.animationId,
      assetId: animation.assetId,
      releaseRole: 'active-xml-referenced-page' as const,
    })),
    {
      animationId: shell.animationId,
      assetId: shell.assetId,
      releaseRole: 'course-shell',
    },
  ],
};

function fixtureCatalog(animations: CatalogAnimation[] = [...pages, shell]): AnimationCatalog {
  return {
    schemaVersion: 1,
    animations,
    missingReferences: [],
    origin: 'generated',
    completionLedger: {generatedMarker: `sha256:${'0'.repeat(64)}`, entries: [], diagnostics: []},
    publication: {
      definitions: [definition],
      releases: [{
        releaseId: definition.releaseId,
        publicationMode: 'atomic',
        requiredMemberCount: 55,
        strictCompleteMemberCount: 0,
        published: false,
        promotionGateSatisfied: false,
        evidenceReceiptSha256: null,
        state: 'unpublished',
        admittedMemberIds: [],
        missingMemberIds: definition.members.map((member) => member.animationId),
        diagnostics: [],
      }],
      diagnostics: [],
      artifactSha256: {releaseManifest: null, releaseLedger: null, completionLedger: null},
    },
  };
}

test('G5 L4 navigation is derived from the exact release and XML occurrence order', () => {
  const descriptor = buildLessonNavigationDescriptor(definition, [...pages, shell]);
  assert.ok(descriptor);
  assert.equal(descriptor.releaseId, G5_L4_ATOMIC_RELEASE_ID);
  assert.equal(descriptor.titleEnglish, 'Number Lines');
  assert.equal(descriptor.titleSpanish, null);
  assert.equal(descriptor.activePageCount, 54);
  assert.equal(descriptor.expectedMemberCount, 55);
  assert.equal(descriptor.schemaVersion, 1);
  if (descriptor.schemaVersion !== 1) {
    throw new Error('legacy G5 L4 fixture unexpectedly built page-only navigation');
  }
  assert.equal(descriptor.shell.animationId, shell.animationId);
  assert.equal(descriptor.shell.memberOrdinal, 55);
  assert.deepEqual(descriptor.sections.map((section) => [section.code, section.activePageCount]), sectionCounts);
  assert.deepEqual(descriptor.pages.map((page) => page.sourceOccurrence), Array.from({length: 54}, (_, index) => index + 1));
  assert.equal(descriptor.pages[0]?.previousAnimationId, null);
  assert.equal(descriptor.pages[0]?.nextAnimationId, descriptor.pages[1]?.animationId);
  assert.equal(descriptor.pages.at(-1)?.nextAnimationId, null);
});

test('page-only atomic navigation uses every XML page and has no shell member', () => {
  const pageOnlyDefinition: LessonReleaseDefinition = {
    ...definition,
    releaseId: 'lesson-g05-l04-page-only-test',
    expectedMemberCount: pages.length,
    members: definition.members.slice(0, -1),
  };
  const descriptor = buildLessonNavigationDescriptor(
    pageOnlyDefinition,
    pages,
  );
  assert.ok(descriptor);
  assert.equal(descriptor.schemaVersion, 2);
  assert.equal(descriptor.courseShellCount, 0);
  assert.equal(descriptor.expectedMemberCount, 54);
  assert.equal(descriptor.activePageCount, 54);
  assert.equal(descriptor.memberAnimationIds.length, 54);
  assert.equal('shell' in descriptor, false);

  const strictPages = new Set(descriptor.memberAnimationIds);
  assert.equal(isLessonReleaseOpen(descriptor, {
    auditPreview: false,
    completeAnimationIds: new Set(descriptor.memberAnimationIds.slice(0, -1)),
    releasePublished: true,
  }), false);
  assert.equal(isLessonReleaseOpen(descriptor, {
    auditPreview: false,
    completeAnimationIds: strictPages,
    releasePublished: true,
  }), true);
});

test('checked-in G5 L5 navigation preserves 56 XML pages, section order, and a terminal shell', async () => {
  const [releaseDocument, animationDocument] = await Promise.all([
    readFile(new URL('../../../catalog/lesson-releases.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../../catalog/animations.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  const rawRelease = releaseDocument.releases.find(
    ({releaseId}: {releaseId: string}) => releaseId === G5_L5_ATOMIC_RELEASE_ID,
  );
  assert.ok(rawRelease);
  const release: LessonReleaseDefinition = {
    releaseId: rawRelease.releaseId,
    publicationMode: rawRelease.publicationMode,
    expectedMemberCount: rawRelease.expectedCounts.members,
    scope: rawRelease.scope,
    members: rawRelease.members.map((member: LessonReleaseDefinition['members'][number]) => ({
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
    })),
  };
  const descriptor = buildLessonNavigationDescriptor(release, animationDocument.animations);
  assert.ok(descriptor);
  assert.equal(descriptor.releaseId, G5_L5_ATOMIC_RELEASE_ID);
  assert.equal(descriptor.titleEnglish, 'Add & Subtract Negative Numbers');
  assert.equal(descriptor.activePageCount, 56);
  assert.equal(descriptor.expectedMemberCount, 57);
  assert.equal(descriptor.schemaVersion, 1);
  if (descriptor.schemaVersion !== 1) {
    throw new Error('checked-in legacy G5 L5 release unexpectedly became page-only');
  }
  assert.equal(descriptor.shell.animationId, 'shell-course-g05-l05-index-local');
  assert.equal(descriptor.shell.memberOrdinal, 57);
  assert.deepEqual(
    descriptor.sections.map((section) => [section.code, section.activePageCount]),
    [
      ['IR', 1],
      ['RW', 3],
      ['VB', 13],
      ['IN', 19],
      ['TI', 9],
      ['GS', 1],
      ['TS', 7],
      ['FQ', 3],
    ],
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.sourceOccurrence),
    Array.from({length: 56}, (_, index) => index + 1),
  );

  const partial = new Set(descriptor.memberAnimationIds.slice(0, 56));
  assert.equal(
    isLessonReleaseOpen(descriptor, {
      auditPreview: false,
      completeAnimationIds: partial,
      releasePublished: true,
    }),
    false,
  );
  const all = new Set(descriptor.memberAnimationIds);
  assert.equal(
    isLessonReleaseOpen(descriptor, {
      auditPreview: false,
      completeAnimationIds: all,
      releasePublished: true,
    }),
    true,
  );

  const pageOnlyRelease: LessonReleaseDefinition = {
    ...release,
    expectedMemberCount: 56,
    members: release.members.slice(0, 56),
  };
  const pageOnlyDescriptor = buildLessonNavigationDescriptor(
    pageOnlyRelease,
    animationDocument.animations,
  );
  assert.ok(pageOnlyDescriptor);
  assert.equal(pageOnlyDescriptor.schemaVersion, 2);
  assert.equal(pageOnlyDescriptor.courseShellCount, 0);
  assert.equal(pageOnlyDescriptor.expectedMemberCount, 56);
  assert.equal(pageOnlyDescriptor.memberAnimationIds.length, 56);
  assert.equal('shell' in pageOnlyDescriptor, false);
  assert.deepEqual(
    pageOnlyDescriptor.pages.map((page) => page.animationId),
    descriptor.pages.map((page) => page.animationId),
  );
  assert.equal(
    isLessonReleaseOpen(pageOnlyDescriptor, {
      auditPreview: false,
      completeAnimationIds: partial,
      releasePublished: true,
    }),
    true,
  );
});

test('Spanish navigation uses only exact catalog labels and preserves English otherwise', () => {
  const descriptor = buildLessonNavigationDescriptor(definition, [...pages, shell])!;
  assert.deepEqual(getLessonPageLabel(descriptor.pages[4]!, 'es'), {
    text: 'Recta numérica',
    sourceLanguage: 'es',
    sourceStatus: 'exact-page-title',
    usesEnglishFallback: false,
  });
  assert.deepEqual(getLessonPageLabel(descriptor.pages[0]!, 'es'), {
    text: 'Page 1',
    sourceLanguage: 'en',
    sourceStatus: 'missing-spanish-source-label',
    usesEnglishFallback: true,
  });
});

test('atomic navigation stays hidden until all exact members and the release ledger agree', () => {
  const descriptor = buildLessonNavigationDescriptor(definition, [...pages, shell])!;
  const empty = new Set<string>();
  assert.equal(isLessonReleaseOpen(descriptor, {auditPreview: false, completeAnimationIds: empty, releasePublished: false}), false);
  assert.equal(getVisibleLessonPages(descriptor, {auditPreview: false, completeAnimationIds: empty, releasePublished: false}).length, 0);
  assert.equal(getVisibleLessonPages(descriptor, {auditPreview: true, completeAnimationIds: empty, releasePublished: false}).length, 54);

  const partial = new Set(descriptor.memberAnimationIds.slice(0, 54));
  assert.equal(isLessonReleaseOpen(descriptor, {auditPreview: false, completeAnimationIds: partial, releasePublished: true}), false);
  assert.equal(canNavigateToLessonAnimation(descriptor, descriptor.pages[0]!.animationId, {auditPreview: false, completeAnimationIds: partial, releasePublished: true}), false);

  const all = new Set(descriptor.memberAnimationIds);
  assert.equal(isLessonReleaseOpen(descriptor, {auditPreview: false, completeAnimationIds: all, releasePublished: false}), false);
  assert.equal(isLessonReleaseOpen(descriptor, {auditPreview: false, completeAnimationIds: all, releasePublished: true}), true);
  assert.equal(canNavigateToLessonAnimation(descriptor, 'historical-g5-l4-variant', {auditPreview: false, completeAnimationIds: all, releasePublished: true}), false);
});

test('route and animation lookup use the release descriptor, never nearby nonmembers', () => {
  const historicalVariant = {...pageAnimation(0), animationId: 'historical-g5-l4-variant', assetId: `swf-${'e'.repeat(64)}`};
  const catalog = fixtureCatalog([...pages, shell, historicalVariant]);
  assert.equal(findLessonNavigationForRoute(catalog, 5, '04')?.releaseId, definition.releaseId);
  assert.equal(findLessonNavigationForAnimation(catalog, pages[10]!.animationId)?.releaseId, definition.releaseId);
  assert.equal(findLessonNavigationForAnimation(catalog, historicalVariant.animationId), undefined);
});

test('stale asset identity, duplicate source occurrence, and a nonterminal shell fail closed', () => {
  assert.equal(buildLessonNavigationDescriptor({
    ...definition,
    members: definition.members.map((member, index) => index === 0 ? {...member, assetId: `swf-${'a'.repeat(64)}`} : member),
  }, [...pages, shell]), undefined);

  const duplicateOccurrence = pages.map((animation, index) => index === 1 ? {
    ...animation,
    references: {...animation.references, courseXml: [{...animation.references.courseXml[0]!, occurrence: 1}]},
  } : animation);
  assert.equal(buildLessonNavigationDescriptor(definition, [...duplicateOccurrence, shell]), undefined);

  const shellFirst: LessonReleaseDefinition = {
    ...definition,
    members: [definition.members.at(-1)!, ...definition.members.slice(0, -1)],
  };
  assert.equal(buildLessonNavigationDescriptor(shellFirst, [...pages, shell]), undefined);
});
