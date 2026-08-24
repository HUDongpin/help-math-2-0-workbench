import {hasAnimationModule} from '@helpmath/demos/animation-registry';

import {
  G4_L3_LESSON,
  getG4L3PageLabel,
  getG4L3SectionLabel,
  type G4L3Locale,
} from './g4-l3-lesson-navigation';
import {G4_L3_PAGE_36_READABLE_VIEW_SPEC} from './g4-l3-readable-view';
import {G4_L3_WHOLE_LESSON_STORAGE_KEY} from './g4-l3-whole-lesson';
import type {
  SourceBoundLabel,
  WholeLessonPlayerDescriptor,
  WholeLessonRendererAvailability,
} from './whole-lesson-player-descriptor';

const G4_L3_SHELL_SWF_SHA256 =
  '817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e';

function sourceBoundPageLabel(
  page: (typeof G4_L3_LESSON.pages)[number],
  locale: G4L3Locale,
): SourceBoundLabel {
  return Object.freeze({...getG4L3PageLabel(page, locale)});
}

function sourceBoundSectionLabel(
  section: (typeof G4_L3_LESSON.sections)[number],
  locale: G4L3Locale,
): SourceBoundLabel {
  return Object.freeze({...getG4L3SectionLabel(section, locale)});
}

function rendererAvailability(
  animationId: string,
): WholeLessonRendererAvailability {
  return hasAnimationModule(animationId)
    ? Object.freeze({kind: 'registered' as const, moduleKey: animationId})
    : Object.freeze({
        kind: 'unavailable' as const,
        reason: 'animation-module-not-registered',
      });
}

const sections = G4_L3_LESSON.sections.map((section) => Object.freeze({
  order: section.order,
  code: section.code,
  activePageCount: section.activePageCount,
  firstActiveAnimationId: section.firstActiveAnimationId,
  labels: Object.freeze({
    en: sourceBoundSectionLabel(section, 'en'),
    es: sourceBoundSectionLabel(section, 'es'),
  }),
}));

const pages = G4_L3_LESSON.pages.map((page) => Object.freeze({
  globalPageOrdinal: page.globalPageOrdinal,
  sectionPageOrdinal: page.sectionPageOrdinal,
  sectionCode: page.sectionCode,
  animationId: page.animationId,
  previousAnimationId: page.previousAnimationId,
  nextAnimationId: page.nextAnimationId,
  labels: Object.freeze({
    en: sourceBoundPageLabel(page, 'en'),
    es: sourceBoundPageLabel(page, 'es'),
  }),
  rendererAvailability: rendererAvailability(page.animationId),
  // Reading support is declared here rather than decided by the player, so a
  // second lesson can offer it without editing a component. Only the page with
  // source-bound crop evidence carries it; nothing is invented for the rest.
  readableView: page.animationId === G4_L3_PAGE_36_READABLE_VIEW_SPEC.animationId
    ? Object.freeze({
        kind: 'source-bound-readable-view' as const,
        specId: G4_L3_PAGE_36_READABLE_VIEW_SPEC.animationId,
      })
    : undefined,
  source: Object.freeze({
    batchId: page.batchId,
    spanishTitleStatus: page.spanishTitleStatus,
    xmlBackgroundText: page.xmlBackgroundText,
    xmlNavigation: page.xmlNavigation,
  }),
}));

export const G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR =
  Object.freeze({
    schemaVersion: 1,
    descriptorId: 'whole-lesson-player-g04-l03-v1',
    releaseId: G4_L3_LESSON.releaseId,
    course: Object.freeze({
      grade: G4_L3_LESSON.grade,
      lesson: G4_L3_LESSON.lesson,
      href: '/courses/4/3',
      domIdPrefix: 'g4-l3',
      activePageCount: G4_L3_LESSON.activePageCount,
      courseShellCount: G4_L3_LESSON.courseShellCount,
      expectedReleaseMemberCount:
        G4_L3_LESSON.activePageCount + G4_L3_LESSON.courseShellCount,
      shellAnimationId: G4_L3_LESSON.shellAnimationId,
      labels: Object.freeze({
        en: Object.freeze({
          text: G4_L3_LESSON.titleEnglish,
          sourceLanguage: 'en',
          sourceStatus: 'exact-course-xml',
          usesEnglishFallback: false,
        }),
        es: Object.freeze({
          text: G4_L3_LESSON.titleEnglish,
          sourceLanguage: 'en',
          sourceStatus: 'missing-lesson-level-spanish-title',
          usesEnglishFallback: true,
        }),
      }),
    }),
    source: Object.freeze({
      navigationContractPath: G4_L3_LESSON.sourceContract.path,
      sourceXmlPath: G4_L3_LESSON.sourceContract.sourceXmlPath,
      sourceXmlSha256: G4_L3_LESSON.sourceContract.sourceXmlSha256,
      sequenceAuthority: G4_L3_LESSON.sourceContract.sequenceAuthority,
      shippedShellSequenceConflictResolved:
        G4_L3_LESSON.sourceContract.shippedShellSequenceConflictResolved,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: G4_L3_WHOLE_LESSON_STORAGE_KEY,
      scope: 'local-device-only',
      legacyCompatible: true,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
    }),
    visualSkin: Object.freeze({
      kind: 'legacy-composite',
      layoutId: 'help-math-course-shell-800x600-v1',
      // Grade 4 Lesson 3 is the widescreen pilot. The authored content band is
      // 800 x 415, derived from this stage minus the 109px header and 76px
      // footer declared below. Declaring the presentation does not change page
      // content, provenance, or any acceptance gate.
      presentations: Object.freeze([
        'legacy-composite',
        'modern-wide',
      ] as const),
      chromeAsset:
        '/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/frame-0049.png',
      header: Object.freeze({
        height: 109,
        title: Object.freeze({
          kind: 'source-declared-lesson-title',
          sourceField: 'NewTitle1',
          fontFamily: 'Verdana',
          fontSize: 25,
          color: '#ffffff',
          bounds: Object.freeze({left: 82, top: 48, width: 712, height: 59}),
          boundsEvidence:
            'chrome asset rows 44-107 carry no painted glyph right of x=80, ' +
            'so the band is the clear header strip below the painted ' +
            '<CourseName> wordmark, inset to clear the HELP PROGRAM logo on ' +
            'the left and the header hit areas that end at row 47',
        }),
      }),
      footer: Object.freeze({height: 76}),
      controls: Object.freeze({
        kind: 'source-derived-diagnostic-candidate',
        root:
          '/flash-assets/courses/shell-course-g04-l03-index-local/control-assets',
        sourceAnimationId: G4_L3_LESSON.shellAnimationId,
        sourceSwfSha256: G4_L3_SHELL_SWF_SHA256,
        navigation: Object.freeze({
          kind: 'source-derived-ffdec-vector-states',
          authoredHitAreaSize: 48,
          renderedSize: 44,
          navigationFreeChromeFile:
            'lesson-shell-chrome-frame-0049-without-navigation.svg',
          hoverFps: 12,
          sourceButtonCharacterIds: Object.freeze([340, 342]),
          files: Object.freeze({
            up: 'lesson-shell-navigation-up.svg',
            down: 'lesson-shell-navigation-down.svg',
            overFrames: Object.freeze([
              'lesson-shell-navigation-over.svg',
              'lesson-shell-navigation-over-frame-02.svg',
              'lesson-shell-navigation-over-frame-03.svg',
              'lesson-shell-navigation-over-frame-04.svg',
              'lesson-shell-navigation-over-frame-05.svg',
              'lesson-shell-navigation-over-frame-06.svg',
              'lesson-shell-navigation-over-frame-07.svg',
              'lesson-shell-navigation-over-frame-08.svg',
              'lesson-shell-navigation-over-frame-09.svg',
              'lesson-shell-navigation-over-frame-10.svg',
              'lesson-shell-navigation-over-frame-11.svg',
              'lesson-shell-navigation-over-frame-12.svg',
              'lesson-shell-navigation-over-frame-13.svg',
            ]),
          }),
          next: Object.freeze({
            sourceSpriteCharacterId: 341,
            mirrorX: false,
            scaleX: 0.8,
            scaleY: 0.8,
          }),
          previous: Object.freeze({
            sourceSpriteCharacterId: 343,
            mirrorX: true,
            scaleX: -0.8,
            scaleY: 0.8,
          }),
        }),
      }),
      resumePrompt: Object.freeze({
        kind: 'source-derived-ffdec-static-nested-timeline',
        asset:
          '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-549/visual-002-6632508343f7.png',
        assetSha256:
          '6632508343f77058ce9ef012e08de4cec5917eba79ebd481376852691f6a5a86',
        manifestPath:
          'public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-549/manifest.json',
        manifestSha256:
          'ccdb8493c107edc5c29dfc0193579a4ea0440bb6a6e56aafed7f35c1ea5be38e',
        sourceAnimationId: G4_L3_LESSON.shellAnimationId,
        sourceSwfSha256: G4_L3_SHELL_SWF_SHA256,
        sourceCharacterId: 549,
        sourceInstanceName: 'bookmark_mc',
        rootFrame: 49,
        localFrame: 2,
        exporterCanvas: Object.freeze({width: 1417, height: 596}),
        rootCompositionOffset: Object.freeze({x: -617.9, y: 2.25}),
        sourceEnglishText:
          'Do you want to return to where you stopped in the lesson? Click Yes to return. Click No to start at the beginning of the lesson.',
        spanishTranslationSupplied: false,
        runtimeAuthority:
          'static-structural-candidate-original-runtime-not-established',
      }),
      exitPrompt: Object.freeze({
        kind: 'source-derived-ffdec-static-nested-timeline',
        asset:
          '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-562/visual-002-a1ea76c78f66.png',
        assetSha256:
          'a1ea76c78f664442e1e3270affb9ec6a74a11dab889e30d111916d716b663d33',
        manifestPath:
          'public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-562/manifest.json',
        manifestSha256:
          'debf670d5e480a19bbfd67110f9ebcd9cbcf87edb6da4202a3536eaadbe477ff',
        sourceAnimationId: G4_L3_LESSON.shellAnimationId,
        sourceSwfSha256: G4_L3_SHELL_SWF_SHA256,
        sourceCharacterId: 562,
        sourceInstanceName: 'quit',
        rootFrame: 49,
        rootDepth: 448,
        localFrame: 2,
        exporterCanvas: Object.freeze({width: 1392, height: 596}),
        rootCompositionOffset: Object.freeze({x: -594.65, y: -3.85}),
        sourceButtonCharacterIds: Object.freeze({yes: 556, no: 560}),
        hitTargets: Object.freeze({
          yes: Object.freeze({
            x: 277.7,
            y: 304.45,
            width: 98.5,
            height: 30.6,
          }),
          no: Object.freeze({
            x: 417.7,
            y: 304.45,
            width: 98.5,
            height: 30.6,
          }),
        }),
        sourceEnglishText: 'Are you sure want to close ?',
        spanishTranslationSupplied: false,
        runtimeAuthority:
          'static-structural-candidate-original-runtime-not-established',
      }),
      backgroundCompanion: Object.freeze({
        kind: 'source-derived-ffdec-vector-static-host-companion',
        asset:
          '/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/lesson-shell-mc-back-text.svg',
        assetSha256:
          '102f0ddeec5ede8843149c3c5621fb5a6632a5edc191b768823fbce691740355',
        manifestPath:
          'public/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/manifest.json',
        sourceAnimationId: G4_L3_LESSON.shellAnimationId,
        sourceSwfSha256: G4_L3_SHELL_SWF_SHA256,
        sourceCharacterId: 584,
        sourceInstanceName: 'Mc_BackText',
        rootFrame: 50,
        rootDepth: 5,
        pagePlaneRootDepth: 47,
        pagePlaneRootPlacementPixels: Object.freeze({
          x: -12.5,
          y: 33.3,
        }),
        visibility: 'source-page-xml-background-text',
        loadedSwfHostRequired: true,
        loadedSwfHostAsset: Object.freeze({
          registryKey:
            'course-g04-l03-ir-001-341242cc-loaded-swf-host',
          assetSource:
            '/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
          assetSha256:
            '3240f36c8ad7f11f906f3d4be9a16461ae1e1a4699691c16fb371a5476e1eab0',
          sourceProvenLanguage: 'en',
          backgroundDisposition:
            'ignore-loaded-child-swf-standalone-stage-background',
        }),
      }),
      evidence: Object.freeze({
        kind: 'ffdec-static-structural-candidate',
        sourceAnimationId: G4_L3_LESSON.shellAnimationId,
        sourceSwfSha256: G4_L3_SHELL_SWF_SHA256,
      }),
    }),
    sections: Object.freeze(sections),
    pages: Object.freeze(pages),
  } satisfies WholeLessonPlayerDescriptor);
