import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access, readFile} from 'node:fs/promises';
import test from 'node:test';
import {gunzipSync} from 'node:zlib';

import {loadAnimationModule} from '@helpmath/demos/animation-registry';

import {
  buildG5L4WholeLessonPlayerDescriptor,
  G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR
} from '../lib/g5-l4-whole-lesson-player-descriptor';
import {
  resolveWholeLessonReleaseView,
  type WholeLessonKeyTermsMasterSource,
  wholeLessonDescriptorMatchesNavigation
} from '../lib/whole-lesson-player-descriptor';

const sourceScopeUrl = new URL(
  '../../../reports/g5-l4-source-scope-freeze.json',
  import.meta.url
);
const lessonsCatalogUrl = new URL(
  '../../../catalog/lessons.json',
  import.meta.url
);

const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

async function checkedInDocuments() {
  const [sourceScope, lessonsCatalog] = await Promise.all([
    readFile(sourceScopeUrl, 'utf8').then(JSON.parse),
    readFile(lessonsCatalogUrl, 'utf8').then(JSON.parse)
  ]);
  return {sourceScope, lessonsCatalog};
}

test('G5 L4 descriptor preserves the exact 54-page XML order and eight sections', async () => {
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);

  const {sourceScope, lessonsCatalog} = await checkedInDocuments();
  const sourcePages = sourceScope.members.filter(
    ({role}: {role: string}) => role === 'lesson-page'
  );
  const lesson = lessonsCatalog.lessons.find(
    ({grade, lesson}: {grade: number; lesson: number}) =>
      grade === 5 && lesson === 4
  );
  assert.ok(lesson);

  assert.equal(descriptor.releaseId, 'lesson-g05-l04-number-lines');
  assert.equal(descriptor.pages.length, 54);
  assert.equal(descriptor.sections.length, 8);
  assert.equal(descriptor.course.activePageCount, 54);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 55);
  assert.equal(
    descriptor.course.shellAnimationId,
    'shell-course-g05-l04-index-local'
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.animationId),
    sourcePages.map(({animationId}: {animationId: string}) => animationId)
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.source.assetId),
    sourcePages.map(({assetId}: {assetId: string}) => assetId)
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.source.sourceOccurrence),
    Array.from({length: 54}, (_, index) => index + 1)
  );
  assert.deepEqual(
    descriptor.sections.map((section) => [
      section.code,
      section.activePageCount
    ]),
    lesson.sections.map(
      ({
        code,
        pageReferenceCount
      }: {
        code: string;
        pageReferenceCount: number;
      }) => [code, pageReferenceCount]
    )
  );
  assert.equal(descriptor.pages[0]?.previousAnimationId, null);
  assert.equal(
    descriptor.pages[0]?.nextAnimationId,
    descriptor.pages[1]?.animationId
  );
  assert.equal(descriptor.pages.at(-1)?.nextAnimationId, null);
  assert.deepEqual(
    descriptor.pages
      .filter((page) => page.presentation)
      .map((page) => [
        page.animationId,
        page.presentation?.pageInteractionCompanionTargetIdSuffix,
      ]),
    [
      ['course-g05-l04-fq-002', 'fq23-question-controls'],
      ['course-g05-l04-fq-003', 'fq23-question-controls'],
    ],
  );
});

test('G5 L4 descriptor keeps checked-in localization labels source-bound', async () => {
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  const {sourceScope} = await checkedInDocuments();
  const sourcePages = sourceScope.members.filter(
    ({role}: {role: string}) => role === 'lesson-page'
  );

  assert.equal(descriptor.course.labels.en.text, 'Number Lines');
  assert.equal(descriptor.course.labels.en.sourceStatus, 'exact-course-xml');
  assert.equal(descriptor.course.labels.es.text, 'Number Lines');
  assert.equal(
    descriptor.course.labels.es.sourceStatus,
    'missing-lesson-level-spanish-title'
  );
  assert.equal(descriptor.course.labels.es.usesEnglishFallback, true);

  const spanishExact = descriptor.pages.filter(
    (page) => !page.labels.es.usesEnglishFallback
  );
  const spanishFallback = descriptor.pages.filter(
    (page) => page.labels.es.usesEnglishFallback
  );
  assert.equal(spanishExact.length, 38);
  assert.equal(spanishFallback.length, 16);
  assert.ok(
    spanishExact.every(
      (page) =>
        page.labels.es.sourceLanguage === 'es' &&
        page.labels.es.sourceStatus === 'exact-page-title'
    )
  );
  assert.ok(
    spanishFallback.every(
      (page) =>
        page.labels.es.sourceLanguage === 'en' &&
        page.labels.es.sourceStatus === 'missing-spanish-source-label'
    )
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.labels.en.text),
    sourcePages.map(({title}: {title: {english: string}}) => title.english)
  );
  assert.deepEqual(
    descriptor.pages.map((page) => page.labels.es.text),
    sourcePages.map(
      ({title}: {title: {english: string; spanish: string | null}}) =>
        title.spanish ?? title.english
    )
  );
});

test('G5 L4 descriptor exposes all 54 page renderers with no unavailable page', async () => {
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);

  const registered = descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered'
  );
  const unavailable = descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'unavailable'
  );
  assert.equal(registered.length, 54);
  assert.equal(unavailable.length, 0);
  assert.ok(
    unavailable.every(
      (page) =>
        page.rendererAvailability.kind === 'unavailable' &&
        page.rendererAvailability.reason ===
          'whole-lesson-renderer-not-source-bound'
    )
  );
  assert.ok(
    registered.every(
      (page) =>
        page.rendererAvailability.kind === 'registered' &&
        page.rendererAvailability.runtimeQuery?.language === 'fixed-en' &&
        page.rendererAvailability.runtimeQuery.frameDomain?.startsWith(
          'sprite-'
        ) === true &&
        page.rendererAvailability.runtimeQuery.scenario?.startsWith(
          'source-static-'
        ) === true &&
        page.rendererAvailability.runtimeQuery.seed === '0'
    )
  );

  const modules = await Promise.all(
    registered.map((page) => {
      assert.equal(page.rendererAvailability.kind, 'registered');
      assert.equal(page.rendererAvailability.moduleKey, page.animationId);
      return loadAnimationModule(page.rendererAvailability.moduleKey);
    })
  );
  assert.equal(modules.filter(Boolean).length, 54);
  for (const animationModule of modules) {
    assert.ok(animationModule);
    assert.deepEqual(animationModule.movie.stage, {width: 800, height: 600});
  }
});

test('G5 L4 shell skin and controls stay bound to G5 structural evidence', () => {
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);

  assert.deepEqual(descriptor.stage, {width: 800, height: 600});
  assert.equal(
    descriptor.source.navigationContractPath,
    'reports/g5-l4-source-scope-freeze.json'
  );
  assert.equal(
    descriptor.source.sourceXmlSha256,
    'b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36'
  );
  assert.equal(descriptor.source.shippedShellSequenceConflictResolved, false);
  assert.equal(
    descriptor.visualSkin.chromeAsset,
    '/flash-assets/courses/shell-course-g05-l04-index-local/root-frames/frame-0049.png'
  );
  assert.equal(descriptor.visualSkin.header.height, 109);
  assert.deepEqual(descriptor.visualSkin.footer, {height: 76});
  assert.equal(
    descriptor.visualSkin.controls.kind,
    'source-derived-diagnostic-candidate'
  );
  assert.equal(
    descriptor.visualSkin.controls.kind ===
      'source-derived-diagnostic-candidate'
      ? descriptor.visualSkin.controls.root
      : null,
    '/flash-assets/courses/shell-course-g05-l04-index-local/control-assets'
  );
  assert.equal(
    descriptor.visualSkin.evidence.kind,
    'ffdec-static-structural-candidate'
  );
  assert.equal(
    descriptor.visualSkin.evidence.sourceAnimationId,
    'shell-course-g05-l04-index-local'
  );
  assert.equal(
    descriptor.visualSkin.evidence.sourceSwfSha256,
    '7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301'
  );
});

test('G5 L4 shell Key Terms candidate stays exact-source-bound and acceptance-neutral', async () => {
  const shell = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR?.shellImplementation;
  assert.ok(shell);
  assert.equal(
    shell.kind,
    'source-static-functional-current-javascript-candidate'
  );
  assert.equal(shell.component, 'descriptor-driven-whole-lesson-player');
  assert.equal(shell.sourceAnimationId, 'shell-course-g05-l04-index-local');
  assert.equal(
    shell.sourceSwfSha256,
    '7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301'
  );

  const actionScriptBundle = await readFile(
    new URL(`../../../${shell.actionScript.bundlePath}`, import.meta.url)
  );
  assert.equal(sha256(actionScriptBundle), shell.actionScript.bundleSha256);
  const actionScript = gunzipSync(actionScriptBundle).toString('utf8');
  assert.match(actionScript, /function doInitKeyTerms\(\)/);
  assert.match(
    actionScript,
    /function doInitKeyTerms\(\)[\s\S]*?XML\/ELKTEG4\.xml/
  );
  assert.match(actionScript, /function doSwitchSpanGloss\(\)/);
  assert.match(
    actionScript,
    /function doSwitchSpanGloss\(\)[\s\S]*?XML\/ELKTSG4\.xml/
  );
  assert.equal(shell.actionScript.rootFrame, 35);
  assert.equal(shell.actionScript.actionScriptExecuted, false);

  for (const language of ['en', 'es'] as const) {
    const lessonSource: Readonly<{path: string; present: false}> =
      shell.keyTerms.lessonDeclaredSources[language];
    const masterSource: WholeLessonKeyTermsMasterSource =
      shell.keyTerms.masterSources[language];
    await assert.rejects(
      access(
        new URL(
          `../../../source-assets/flash/HELP MATH_ORIGINAL FILES/${lessonSource.path}`,
          import.meta.url
        )
      ),
      (error: NodeJS.ErrnoException) => error.code === 'ENOENT'
    );
    assert.equal(lessonSource.present, false);

    const masterBytes = await readFile(
      new URL(`../../../${masterSource.sourcePath}`, import.meta.url)
    );
    assert.equal(sha256(masterBytes), masterSource.sourceSha256);
    assert.equal(masterSource.staticTargetStatus, 'exact-actionscript-string');
  }
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(shell.keyTerms.masterSources).map(([language, source]) => [
        language,
        {
          assetId: source.assetId,
          generatedDataUrl: source.generatedDataUrl,
          extractedEntryCount: source.extractedEntryCount
        }
      ])
    ),
    {
      en: {
        assetId: 'ELKTEG4.xml',
        generatedDataUrl:
          '/generated/g5-l4-elementary-keyterms-reference-en.json',
        extractedEntryCount: 761
      },
      es: {
        assetId: 'ELKTSG4.xml',
        generatedDataUrl:
          '/generated/g5-l4-elementary-keyterms-reference-es.json',
        extractedEntryCount: 753
      }
    }
  );
  assert.equal(
    shell.keyTerms.generatedDataScope,
    'shared-hash-bound-master-source-extraction-not-lesson-runtime-evidence'
  );
  assert.equal(shell.keyTerms.referenceUseAuthorized, true);
  assert.deepEqual(shell.keyTerms.referenceDirective, {
    evidenceClass: 'owner-relayed-content-manager-email',
    contentManager: 'Venky',
    relayedByOwner: 'Dr. Peter Hu',
    recordedDate: '2026-07-30',
    scope: 'combined-elementary-keyterms-product-reference-only',
    messageHeadersVerified: false
  });
  assert.equal(shell.keyTerms.declaredLessonSourcesRecovered, false);
  assert.equal(shell.keyTerms.runtimeLoadVerified, false);
  assert.equal(shell.keyTerms.runtimeParseVerified, false);
  assert.equal(shell.keyTerms.runtimeByteVariantVerified, false);
  assert.equal(shell.keyTerms.lessonSpecificSubstitutionAuthorized, false);
  assert.equal(shell.keyTerms.productDispositionAccepted, true);
  assert.deepEqual(shell.keyTermsStaticVisualReference, {
    kind: 'ffdec-static-root-frame-structural-reference',
    asset:
      '/flash-assets/courses/shell-course-g05-l04-index-local/root-frames/frame-0050.png',
    rootFrame: 50,
    width: 800,
    height: 600
  });
  assert.deepEqual(shell.acceptanceEffects, {
    authoritativeOriginalRuntime: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false
  });
});

test('G5 L4 release view identifies the 55-member JS candidate while strict remains 0 of 55 and unpublished', () => {
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  const view = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: false,
    strictCompleteAnimationIds: new Set()
  });

  assert.equal(view.currentJsCandidate, true);
  assert.equal(view.currentJsPageCount, 54);
  assert.equal(view.requiredMemberCount, 55);
  assert.equal(view.strictCompleteMemberCount, 0);
  assert.equal(view.strictCompletion, false);
  assert.equal(view.publicRelease, false);

  const publicationWithoutStrict = resolveWholeLessonReleaseView(descriptor, {
    releaseId: descriptor.releaseId,
    releasePublished: true,
    strictCompleteAnimationIds: new Set()
  });
  assert.equal(publicationWithoutStrict.strictCompletion, false);
  assert.equal(publicationWithoutStrict.publicRelease, false);

  const wrongReleaseAuthority = resolveWholeLessonReleaseView(descriptor, {
    releaseId: 'lesson-g04-l03-negative-numbers',
    releasePublished: true,
    strictCompleteAnimationIds: new Set([
      ...descriptor.pages.map((page) => page.animationId),
      descriptor.course.shellAnimationId
    ])
  });
  assert.equal(wrongReleaseAuthority.strictCompleteMemberCount, 0);
  assert.equal(wrongReleaseAuthority.strictCompletion, false);
  assert.equal(wrongReleaseAuthority.publicRelease, false);
});

test('G5 L4 player must exactly match the server navigation before mounting', () => {
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  const navigation = {
    releaseId: descriptor.releaseId,
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    expectedMemberCount: descriptor.course.expectedReleaseMemberCount,
    activePageCount: descriptor.course.activePageCount,
    courseShellCount: 1 as const,
    shell: {animationId: descriptor.course.shellAnimationId},
    pages: descriptor.pages.map((page) => ({
      animationId: page.animationId,
      assetId: page.source.assetId!,
      globalPageOrdinal: page.globalPageOrdinal,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sourceOccurrence: page.source.sourceOccurrence!
    }))
  };

  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, navigation),
    true
  );
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, {
      ...navigation,
      pages: [
        navigation.pages[1]!,
        navigation.pages[0]!,
        ...navigation.pages.slice(2)
      ]
    }),
    false
  );
  assert.equal(
    wholeLessonDescriptorMatchesNavigation(descriptor, {
      ...navigation,
      pages: navigation.pages.map((page, index) =>
        index === 0 ? {...page, assetId: `swf-${'0'.repeat(64)}`} : page
      )
    }),
    false
  );
});

test('G5 L4 descriptor builder fails closed on source or acceptance drift', async () => {
  const documents = await checkedInDocuments();
  const wrongShellHash = structuredClone(documents.sourceScope);
  wrongShellHash.members[54].source.swf.sha256 = '0'.repeat(64);
  assert.equal(
    buildG5L4WholeLessonPlayerDescriptor({
      sourceScope: wrongShellHash,
      lessonsCatalog: documents.lessonsCatalog
    }),
    undefined
  );

  const promotedWithoutAuthority = structuredClone(documents.sourceScope);
  promotedWithoutAuthority.acceptanceEffects.published = true;
  assert.equal(
    buildG5L4WholeLessonPlayerDescriptor({
      sourceScope: promotedWithoutAuthority,
      lessonsCatalog: documents.lessonsCatalog
    }),
    undefined
  );

  const reorderedPages = structuredClone(documents.sourceScope);
  [reorderedPages.members[0], reorderedPages.members[1]] = [
    reorderedPages.members[1],
    reorderedPages.members[0]
  ];
  assert.equal(
    buildG5L4WholeLessonPlayerDescriptor({
      sourceScope: reorderedPages,
      lessonsCatalog: documents.lessonsCatalog
    }),
    undefined
  );
});

test('the G5 L4 header chrome carries the lesson title as a source-declared text band', () => {
  const descriptor = G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR;
  assert.ok(descriptor);
  const band = descriptor.visualSkin.header.title;

  assert.ok(band, 'the header must declare a live lesson title band');
  assert.equal(band.kind, 'source-declared-lesson-title');
  assert.equal(band.sourceField, 'NewTitle1');
  assert.equal(band.fontFamily, 'Verdana');
  assert.equal(band.fontSize, 25);
  assert.equal(band.color, '#ffffff');
  assert.ok(
    band.bounds.top + band.bounds.height <= descriptor.visualSkin.header.height,
  );
  assert.ok(band.bounds.left + band.bounds.width <= descriptor.stage.width);

  // This chrome paints the same "Counting on Numbers" wordmark as every other
  // lesson, because it is <CourseName>. The live title is this lesson's own.
  assert.equal(descriptor.course.labels.en.text, 'Number Lines');
  assert.notEqual(descriptor.course.labels.en.text, 'Counting on Numbers');
  assert.notEqual(descriptor.course.labels.es.text, 'Counting on Numbers');
});
