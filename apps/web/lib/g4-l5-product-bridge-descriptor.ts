import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';

import {
  animationModuleRegistration,
  hasAnimationModule,
} from '@helpmath/demos/animation-registry';

import type {
  Grade4CourseCatalogCoverage,
  Grade4CourseCoverageLesson,
} from './g4-course-catalog-coverage';
import {G4_L5_PAGE_ONLY_CURRENT_JS} from './g4-l5-page-only-current-js.generated';
import type {SourceBoundLabel} from './whole-lesson-player-descriptor';

export const G4_L5_PRODUCT_FACTORY_CALIBRATION_ID =
  'g4-l5-page-only-current-js-53-v1';
export const G4_L5_PRODUCT_FACTORY_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g4-l5-page-only-current-js-53-v1.json';

const selectedPages: ReadonlyMap<
  string,
  (typeof G4_L5_PAGE_ONLY_CURRENT_JS.pages)[number]
> = new Map(
  G4_L5_PAGE_ONLY_CURRENT_JS.pages.map((page) => [page.animationId, page]),
);

export const G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS = Object.freeze(
  G4_L5_PAGE_ONLY_CURRENT_JS.pages.map((page) => page.animationId),
);

export type G4L5ProductBridgeLocale = 'en' | 'es';

export interface G4L5ProductBridgePage {
  readonly globalPageOrdinal: number;
  readonly sectionPageOrdinal: number;
  readonly sectionCode: string;
  readonly animationId: string;
  readonly labels: Readonly<Record<G4L5ProductBridgeLocale, SourceBoundLabel>>;
  readonly source: Readonly<{
    assetId: string;
    swfSha256: string;
    sourceOccurrence: number;
  }>;
  readonly candidate:
    | Readonly<{
        status: 'private-current-js';
        moduleKey: string;
        frameDomain: string;
        frameCount: number;
        audio: boolean;
      }>
    | Readonly<{
        status: 'unavailable';
        reason: 'outside-current-private-product-bridge-freeze';
      }>;
}

export interface G4L5ProductBridgeDescriptor {
  readonly schemaVersion: 1;
  readonly descriptorKind: 'private-modern-my-lesson-product-bridge';
  readonly descriptorId: 'g4-l5-product-bridge-v3';
  readonly calibrationId: typeof G4_L5_PRODUCT_FACTORY_CALIBRATION_ID;
  readonly releaseId: 'private-g4-l5-product-bridge-v3';
  readonly course: Readonly<{
    grade: 4;
    lesson: 5;
    title: 'Multiplication';
    activePageCount: 53;
    legacyCourseShellCount: 0;
    selectedCurrentJsCount: 53;
    remainingCurrentJsCount: 0;
  }>;
  readonly source: Readonly<{
    sourceXmlPath: string;
    sourceXmlSha256: string;
    sequenceAuthority: 'course-xml-occurrence';
    candidateFreezeManifestPath:
      typeof G4_L5_PRODUCT_FACTORY_FREEZE_PATH;
    candidateFreezeManifestSha256: string;
  }>;
  readonly sections: readonly Readonly<{
    code: string;
    order: number;
    activePageCount: number;
    labels: Readonly<Record<G4L5ProductBridgeLocale, SourceBoundLabel>>;
  }>[];
  readonly pages: readonly G4L5ProductBridgePage[];
  readonly glossary: readonly Readonly<{
    id: 'array' | 'represent';
    sourceKeyAttribute: 'Array' | 'Represent';
    labels: Readonly<Record<G4L5ProductBridgeLocale, string>>;
    definitions: Readonly<Record<G4L5ProductBridgeLocale, string>>;
    source: Readonly<Record<G4L5ProductBridgeLocale, Readonly<{
      path: string;
      sha256: string;
    }>>>;
  }>[];
  readonly host: Readonly<{
    kind: 'modern-my-lesson-page-only';
    storage: 'memory-only';
    storesPersonalData: false;
    legacyOperations: 'blocked';
    capabilities: readonly ['audio', 'glossary', 'fq-scoring'];
  }>;
  readonly acceptanceEffects: Readonly<{
    authoritativeOriginalRuntime: false;
    fidelityAccepted: false;
    audioAccepted: false;
    humanVisualAccepted: false;
    ownerAccepted: false;
    strictComplete: false;
    released: false;
    published: false;
  }>;
}

function workspaceRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '../..')];
  const root = candidates.find((candidate) => {
    try {
      return readFileSync(
        path.join(candidate, G4_L5_PRODUCT_FACTORY_FREEZE_PATH),
      ).byteLength > 0;
    } catch {
      return false;
    }
  });
  if (!root) throw new Error('Unable to resolve G4 L5 product factory root');
  return root;
}

function freezeManifestSha256(): string {
  const bytes = readFileSync(
    path.join(workspaceRoot(), G4_L5_PRODUCT_FACTORY_FREEZE_PATH),
  );
  const manifest = JSON.parse(bytes.toString('utf8')) as {
    calibrationId?: unknown;
    scope?: {
      activePageCount?: unknown;
      courseShellCount?: unknown;
      selectedPageCount?: unknown;
    };
    acceptanceEffects?: Record<string, unknown>;
  };
  if (
    manifest.calibrationId !== G4_L5_PRODUCT_FACTORY_CALIBRATION_ID ||
    manifest.scope?.activePageCount !== 53 ||
    manifest.scope.courseShellCount !== 0 ||
    manifest.scope.selectedPageCount !== 53 ||
    !manifest.acceptanceEffects ||
    Object.values(manifest.acceptanceEffects).some((value) => value !== false)
  ) {
    throw new Error('G4 L5 product factory freeze manifest is not admissible');
  }
  return createHash('sha256').update(bytes).digest('hex');
}

function lessonFive(
  coverage: Grade4CourseCatalogCoverage,
): Grade4CourseCoverageLesson {
  if (coverage.status !== 'valid') {
    throw new Error(
      `Cannot build G4 L5 descriptor from invalid catalog: ${coverage.diagnostics.join('; ')}`,
    );
  }
  const lesson = coverage.lessons.find((candidate) => candidate.lesson === 5);
  if (!lesson) throw new Error('Grade 4 Lesson 5 is absent from catalog');
  if (
    lesson.counts.activePages !== 53 ||
    lesson.pages.length !== 53 ||
    lesson.counts.catalogResolvedPages !== 53 ||
    !lesson.readiness.sourceCoverageComplete
  ) {
    throw new Error('G4 L5 page-only source coverage must remain 53/53');
  }
  return lesson;
}

function assertPrivateRegistration(animationId: string): void {
  const registration = animationModuleRegistration(animationId);
  if (
    !hasAnimationModule(animationId) ||
    !registration ||
    registration.scope !== 'private-engineering' ||
    registration.maturity !== 'private-current-js' ||
    registration.calibrationId !== G4_L5_PRODUCT_FACTORY_CALIBRATION_ID
  ) {
    throw new Error(
      `${animationId} is not bound to the frozen private Current-JS registry`,
    );
  }
}

const keyTermSource = Object.freeze({
  en: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
    sha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  }),
  es: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
    sha256: '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
  }),
});

const glossary = Object.freeze([
  Object.freeze({
    id: 'array' as const,
    sourceKeyAttribute: 'Array' as const,
    labels: Object.freeze({en: 'Array', es: 'Matriz'}),
    definitions: Object.freeze({
      en: 'An arrangement of objects in rows and columns.',
      es: 'La disposición de objetos en filas y columnas.',
    }),
    source: keyTermSource,
  }),
  Object.freeze({
    id: 'represent' as const,
    sourceKeyAttribute: 'Represent' as const,
    labels: Object.freeze({en: 'Represent', es: 'Representa'}),
    definitions: Object.freeze({
      en: 'This is where one thing stands for another. For example: x + 10 = 12; "x" represents 2.',
      es: 'Es cuando una letra se encuentra tomando el lugar de un número, expresando su valor. Por ejemplo: x + 10 = 12; la "x" representa a 2.',
    }),
    source: keyTermSource,
  }),
]);

export function buildG4L5ProductBridgeDescriptor(
  coverage: Grade4CourseCatalogCoverage,
): G4L5ProductBridgeDescriptor {
  const lesson = lessonFive(coverage);
  G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS.forEach(
    assertPrivateRegistration,
  );
  const pages = lesson.pages.map((page): G4L5ProductBridgePage => {
    const animationId = page.source.animationId;
    if (!animationId || !page.source.assetId || !page.source.swfSha256) {
      throw new Error(
        `G4 L5 occurrence ${page.globalPageOrdinal} lost source identity`,
      );
    }
    const selection = selectedPages.get(animationId);
    if (selection && selection.sourceOccurrence !== page.globalPageOrdinal) {
      throw new Error(`${animationId} moved in the source sequence`);
    }
    return Object.freeze({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId,
      labels: page.labels,
      source: Object.freeze({
        assetId: page.source.assetId,
        swfSha256: page.source.swfSha256,
        sourceOccurrence: page.source.sourceOccurrence,
      }),
      candidate: selection
        ? Object.freeze({
            status: 'private-current-js' as const,
            moduleKey: animationId,
            frameDomain: selection.frameDomain,
            frameCount: selection.frameCount,
            audio: selection.audioAvailable,
          })
        : Object.freeze({
            status: 'unavailable' as const,
            reason: 'outside-current-private-product-bridge-freeze' as const,
          }),
    });
  });
  const selectedInSourceOrder = pages
    .filter((page) => page.candidate.status === 'private-current-js')
    .map((page) => page.animationId);
  if (
    selectedInSourceOrder.join('\n') !==
      G4_L5_PRODUCT_FACTORY_SELECTED_ANIMATION_IDS.join('\n')
  ) {
    throw new Error('G4 L5 selected candidates moved out of frozen source order');
  }
  return Object.freeze({
    schemaVersion: 1,
    descriptorKind: 'private-modern-my-lesson-product-bridge',
    descriptorId: 'g4-l5-product-bridge-v3',
    calibrationId: G4_L5_PRODUCT_FACTORY_CALIBRATION_ID,
    releaseId: 'private-g4-l5-product-bridge-v3',
    course: Object.freeze({
      grade: 4,
      lesson: 5,
      title: 'Multiplication',
      activePageCount: 53,
      legacyCourseShellCount: 0,
      selectedCurrentJsCount: 53,
      remainingCurrentJsCount: 0,
    }),
    source: Object.freeze({
      sourceXmlPath: lesson.source.lessonXmlPath,
      sourceXmlSha256: lesson.source.lessonXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath: G4_L5_PRODUCT_FACTORY_FREEZE_PATH,
      candidateFreezeManifestSha256: freezeManifestSha256(),
    }),
    sections: Object.freeze(lesson.sections.map((section) => Object.freeze({
      code: section.code,
      order: section.order,
      activePageCount: section.activePageCount,
      labels: section.labels,
    }))),
    pages: Object.freeze(pages),
    glossary,
    host: Object.freeze({
      kind: 'modern-my-lesson-page-only',
      storage: 'memory-only',
      storesPersonalData: false,
      legacyOperations: 'blocked',
      capabilities: Object.freeze(
        ['audio', 'glossary', 'fq-scoring'] as const,
      ),
    }),
    acceptanceEffects: Object.freeze({
      authoritativeOriginalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    }),
  });
}
