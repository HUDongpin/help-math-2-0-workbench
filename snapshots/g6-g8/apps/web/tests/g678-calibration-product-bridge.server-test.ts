import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {
  decodeG678GlossaryXmlText,
  g678PartialRegistrationCount,
  g678PartialCalibrationSnapshot,
  G678_CALIBRATION_FREEZE_PATH,
  G678_CALIBRATION_ID,
  G678_ALG_L11_TRANCHE1_PROVISIONAL_CALIBRATION_FREEZE_PATH,
  G678_SHARED_CATALOG_PATH,
  G678_SHARED_PROFILE_PATH,
} from '../lib/g678-calibration-product-bridge.server';
import {
  exactFrozen16RegistryScope,
  G678_FROZEN16_CONTINUOUS_FREEZE,
} from '../lib/g678-frozen16-default-scope.server';
import {allLearningLessons} from
  '../lib/learning-lesson-availability.server';
import {buildWholeLessonCourseRegistration} from
  '../lib/whole-lesson-course-registry';

const catalogBytes = readFileSync(
  new URL('../../../catalog/g678-shared-catalog.v1.json', import.meta.url),
);
const profileBytes = readFileSync(
  new URL('../../../catalog/g678-shared-source-profile.v1.json', import.meta.url),
);
const currentFreeze = JSON.parse(readFileSync(new URL(
  `../../../${G678_CALIBRATION_FREEZE_PATH}`,
  import.meta.url,
), 'utf8'));
// Small synthetic fixtures exercise the historical general-purpose projection,
// not V3's source-pinned two-page successor gate. Keep the live registry import
// above on its current phase; load a separate historical module instance here.
const originalPhase = process.env.HELP_MATH_G678_CALIBRATION_PHASE;
process.env.HELP_MATH_G678_CALIBRATION_PHASE = 'alg-l11-tranche1-provisional-browser-qa';
const historicalFixtureBridge = await import(new URL(
  '../lib/g678-calibration-product-bridge.server.ts?historical-fixtures', import.meta.url,
).href) as typeof import('../lib/g678-calibration-product-bridge.server');
if (originalPhase === undefined) delete process.env.HELP_MATH_G678_CALIBRATION_PHASE;
else process.env.HELP_MATH_G678_CALIBRATION_PHASE = originalPhase;
const catalog = JSON.parse(catalogBytes.toString('utf8'));
const profile = JSON.parse(profileBytes.toString('utf8'));
const sha256 = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

test('default frozen16 authority rejects short, mixed, and unknown registry lineages', () => {
  const exact = {
    calibrationId: G678_CALIBRATION_ID,
    freezeManifestSha256: G678_FROZEN16_CONTINUOUS_FREEZE.sha256,
  };
  const registrations = Array.from({length: 379}, () => exact);
  assert.equal(exactFrozen16RegistryScope(registrations), true);
  assert.equal(exactFrozen16RegistryScope(registrations.slice(1)), false);
  assert.equal(exactFrozen16RegistryScope([
    ...registrations.slice(1), {...exact, freezeManifestSha256: '0'.repeat(64)},
  ]), false);
  assert.equal(exactFrozen16RegistryScope([
    ...registrations.slice(1), {...exact, calibrationId: 'unreviewed'},
  ]), false);
});

test('ALG L11 tranche1 has a dedicated provisional354 product-bridge phase', () => {
  assert.equal(G678_ALG_L11_TRANCHE1_PROVISIONAL_CALIBRATION_FREEZE_PATH,
    'catalog/product-bridge-calibrations/' +
      'g678-current-js-354-page-registration-v1.json');
  const source = readFileSync(new URL(
    '../lib/g678-calibration-product-bridge.server.ts', import.meta.url),
  'utf8');
  assert.match(source, /alg-l11-tranche1-provisional-browser-qa/u);
  assert.match(source,
    /G678_ALG_L11_TRANCHE1_PROVISIONAL_CALIBRATION_FREEZE_PATH/u);
});

test('G678 glossary XML text decodes only the exact observed entity set', () => {
  assert.equal(decodeG678GlossaryXmlText(
    '&#x003C; &#x00B0; &#x00B3; &#x2260; &#x2264; &#x2265; &gt; &quot;',
  ), '< ° ³ ≠ ≤ ≥ > "');
  assert.throws(() => decodeG678GlossaryXmlText('&#60;'),
    /G678_CALIBRATION_GLOSSARY_XML_ENTITY_INVALID/u);
  assert.throws(() => decodeG678GlossaryXmlText('&#x003E;'),
    /G678_CALIBRATION_GLOSSARY_XML_ENTITY_INVALID/u);
  assert.throws(() => decodeG678GlossaryXmlText('&lt;'),
    /G678_CALIBRATION_GLOSSARY_XML_ENTITY_INVALID/u);
  assert.throws(() => decodeG678GlossaryXmlText('&amp;'),
    /G678_CALIBRATION_GLOSSARY_XML_ENTITY_INVALID/u);
});

function binding(path: string, bytes: Buffer, value: unknown) {
  return Object.freeze({
    bytes: bytes.length,
    path,
    sha256: sha256(bytes),
    value,
  });
}

function partialFixture(
  count = 13,
  options: Readonly<{
    profileValue?: typeof profile;
    selections?: typeof profile.calibrationSet;
    selectionAuthorities?: readonly ReturnType<typeof binding>[];
  }> = {},
) {
  const profileValue = options.profileValue ?? profile;
  const effectiveProfileBytes = profileValue === profile
    ? profileBytes
    : Buffer.from(`${JSON.stringify(profileValue)}\n`);
  const calibrationSelections = options.selections ??
    profileValue.calibrationSet.slice(0, count);
  const selectionAuthorities = options.selectionAuthorities ?? [];
  const catalogBinding = binding(
    G678_SHARED_CATALOG_PATH,
    catalogBytes,
    catalog,
  );
  const profileBinding = binding(
    G678_SHARED_PROFILE_PATH,
    effectiveProfileBytes,
    profileValue,
  );
  const selectedPages = calibrationSelections.map(
    (selection: {
      moduleCode: string;
      lessonNumber: number;
      ordinal: number;
      selectionRole: string;
    }) => {
      const lesson = catalog.lessons.find((candidate: {
        moduleCode: string;
        lessonNumber: number;
      }) => candidate.moduleCode === selection.moduleCode &&
        candidate.lessonNumber === selection.lessonNumber);
      const page = lesson.pages[selection.ordinal - 1];
      const sectionPageOrdinal = lesson.pages.slice(0, selection.ordinal)
        .filter((candidate: {sectionCode: string}) =>
          candidate.sectionCode === page.sectionCode).length;
      const staticPage = selection.selectionRole === 'low-candidate';
      return {
        animationId: page.animationId,
        placementId: page.placementId,
        stableLessonKey: lesson.stableLessonKey,
        moduleCode: lesson.moduleCode,
        lessonNumber: lesson.lessonNumber,
        globalPageOrdinal: page.globalOrdinal,
        sectionCode: page.sectionCode,
        sectionPageOrdinal,
        complexityLane: staticPage ? 'low' : 'interactive-understood',
        sourceSha256: page.sourceSha256,
        assetId: page.assetId,
        runtime: {
          frameDomain: 'root',
          language: 'fixed-en',
          scenario: 'calibration-fixture',
          seed: '0',
          stage: {width: 800, height: 600},
          canvasRenderer: {
            path: `work/g678-shared-page-factory/product-v1/${page.animationId}/canvas-renderer.js`,
            bytes: 32,
            sha256: 'a'.repeat(64),
            url: `/flash-assets/g678-local/${page.animationId}/canvas-renderer.js`,
          },
        },
        runtimeEvidenceBoundary: {
          runtimeKind: staticPage
            ? 'source-static-current-js-candidate'
            : 'source-script-bound-product-behavior-current-js-candidate',
          actionScriptExecution: 'not-executed',
          naturalTraceValidation: 'not-established',
          audioAcceptance: 'not-established',
          replaySemantics: staticPage
            ? 'renderer-restart-only-source-behavior-not-established'
            : 'product-complete-state-reset-original-runtime-parity-not-established',
        },
      };
    },
  );
  const freezeValue = {
    schemaVersion: 1,
    calibrationId: G678_CALIBRATION_ID,
    deploymentScope: 'local-only',
    status: 'private-current-js-calibration-candidates-generated',
    frozenCalibrationPlacementCount: 16,
    registrationCandidatePlacementCount: count,
    scaleOutAuthorized: false,
    inputs: {
      sharedCatalog: {
        path: catalogBinding.path,
        bytes: catalogBinding.bytes,
        sha256: catalogBinding.sha256,
      },
      sourceProfile: {
        path: profileBinding.path,
        bytes: profileBinding.bytes,
        sha256: profileBinding.sha256,
      },
      ...(selectionAuthorities.length > 0 ? {
        selectionAuthorities: selectionAuthorities.map((authority) => ({
          path: authority.path,
          bytes: authority.bytes,
          sha256: authority.sha256,
        })),
      } : {}),
    },
    selectedPages,
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      behaviorParityAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      releaseEligible: false,
      published: false,
    },
  };
  const freezeBytes = Buffer.from(`${JSON.stringify(freezeValue)}\n`);
  const freezeBinding = binding(
    historicalFixtureBridge.G678_CALIBRATION_FREEZE_PATH,
    freezeBytes,
    freezeValue,
  );
  const registered = new Set(selectedPages.map((page: {animationId: string}) =>
    page.animationId));
  return historicalFixtureBridge.buildG678PartialCalibrationSnapshot({
    catalog: catalogBinding,
    freeze: freezeBinding,
    profile: profileBinding,
    selectionAuthorities,
    registry: {
      hasModule: (animationId) => registered.has(animationId),
      registrationFor: (animationId) => {
        const page = selectedPages.find(
          (candidate: {animationId: string}) =>
            candidate.animationId === animationId,
        );
        return {
          maturity: 'private-current-js',
          scope: 'private-engineering',
          deploymentScope: 'local-only',
          calibrationId: G678_CALIBRATION_ID,
          freezeManifestSha256: freezeBinding.sha256,
          moduleSha256: 'a'.repeat(64),
          timelineSha256: 'b'.repeat(64),
          runtimeSha256: page?.runtime.canvasRenderer.sha256,
        };
      },
    },
  });
}

test('13 registered calibration pages remain partial full-source-order descriptors', () => {
  const snapshot = partialFixture(13);
  assert.equal(snapshot.status, 'ready');
  assert.equal(
    snapshot.registrationStatus,
    'private-current-js-calibration-partial',
  );
  assert.equal(snapshot.registeredPlacementCount, 13);
  assert.equal(snapshot.frozenCalibrationPlacementCount, 16);
  assert.equal(snapshot.scaleOutAuthorized, false);
  assert.equal(snapshot.descriptors.length, 13);
  assert.equal(snapshot.runtimeAssets.length, 13);
  for (const descriptor of snapshot.descriptors) {
    assert.equal(descriptor.descriptorKind, 'private-page-only-product-bridge');
    assert.equal(descriptor.course.grade, 0);
    assert.equal(descriptor.course.gradeScope, 'G6-G8-shared');
    assert.equal(descriptor.pages.length, descriptor.course.activePageCount);
    assert.equal(
      descriptor.pages.filter((page) =>
        page.rendererAvailability.kind === 'registered').length,
      1,
    );
    assert.deepEqual(
      descriptor.pages.map((page) => page.globalPageOrdinal),
      Array.from({length: descriptor.pages.length}, (_, index) => index + 1),
    );
    assert.equal(buildWholeLessonCourseRegistration({
      descriptor,
      player: {kind: 'descriptor-driven'},
    }), undefined);
  }
});

test('calibration bridge accepts the real partial range through final 16-of-16', () => {
  const first = partialFixture(1);
  const final = partialFixture(16);
  assert.equal(first.descriptors.length, 1);
  assert.equal(first.runtimeAssets.length, 1);
  assert.equal(first.registeredPlacementCount, 1);
  assert.equal(
    first.registrationStatus,
    'private-current-js-calibration-partial',
  );
  assert.equal(final.descriptors.length, 16);
  assert.equal(final.runtimeAssets.length, 16);
  assert.equal(final.registeredPlacementCount, 16);
  assert.equal(
    final.registrationStatus,
    'private-current-js-calibration-registered-frozen-set',
  );
  assert.equal(
    final.descriptors.every((descriptor) =>
      descriptor.productBridge.registeredAnimationCount === 1),
    true,
  );
  assert.throws(() => partialFixture(0), /G678_CALIBRATION_FREEZE_INVALID/u);
});

test('calibration bridge groups multiple registered pages into one source-order lesson descriptor', () => {
  const nmsLessonOne = profile.calibrationSet.find(
    (selection: {moduleCode: string; lessonNumber: number}) =>
      selection.moduleCode === 'NMS002' && selection.lessonNumber === 1,
  );
  assert.ok(nmsLessonOne);
  const second = {...nmsLessonOne, ordinal: 2};
  const remaining = profile.calibrationSet.filter(
    (selection: {moduleCode: string; lessonNumber: number}) =>
      selection.moduleCode !== 'NMS002' || selection.lessonNumber !== 1,
  ).slice(0, 14);
  const calibrationSet = [nmsLessonOne, second, ...remaining];
  assert.equal(calibrationSet.length, 16);
  const snapshot = partialFixture(2, {
    profileValue: {...profile, calibrationSet},
    selections: calibrationSet.slice(0, 2),
  });
  assert.equal(snapshot.registeredPlacementCount, 2);
  assert.equal(snapshot.descriptors.length, 1);
  const descriptor = snapshot.descriptors[0]!;
  assert.deepEqual(descriptor.productBridge.selectedAnimationIds, [
    'shared-nms002-l01-p001',
    'shared-nms002-l01-p002',
  ]);
  assert.equal(descriptor.productBridge.registeredAnimationCount, 2);
  assert.equal(descriptor.pages.filter((page) =>
    page.rendererAvailability.kind === 'registered').length, 2);
  assert.equal(g678PartialRegistrationCount(
    snapshot.descriptors,
    'NMS002',
    1,
  ), 2);
});

test('reviewed placement authority can extend beyond the original sixteen-page profile without broadening membership', () => {
  const first = profile.calibrationSet.find(
    (selection: {moduleCode: string; lessonNumber: number}) =>
      selection.moduleCode === 'NMS002' && selection.lessonNumber === 1,
  );
  assert.ok(first);
  const selections = [first, {...first, ordinal: 2}];
  const authorityValue = {
    schemaVersion: 1,
    artifactType: 'g678-pure-linear-reviewed-inventory-v1',
    status: 'exact-compiled-root-action-review-complete',
    authorizedPlacementIds: [
      'shared-nms002-l01-p001',
      'shared-nms002-l01-p002',
    ],
    scaleOutAuthorization: {authorized: true},
  };
  const authorityBytes = Buffer.from(`${JSON.stringify(authorityValue)}\n`);
  const authority = binding(
    'catalog/g678-pure-linear-reviewed-inventory-fixture.json',
    authorityBytes,
    authorityValue,
  );
  const snapshot = partialFixture(2, {
    selections,
    selectionAuthorities: [authority],
  });
  assert.equal(snapshot.descriptors.length, 1);
  assert.equal(snapshot.descriptors[0]?.productBridge.registeredAnimationCount, 2);
  const unauthorizedValue = {...authorityValue,
    authorizedPlacementIds: ['shared-nms002-l01-p001']};
  const unauthorizedBytes = Buffer.from(
    `${JSON.stringify(unauthorizedValue)}\n`,
  );
  const unauthorized = binding(
    authority.path,
    unauthorizedBytes,
    unauthorizedValue,
  );
  assert.throws(() => partialFixture(2, {
    selections,
    selectionAuthorities: [unauthorized],
  }), /G678_CALIBRATION_REGISTRATION_INVALID/u);
});

test('default registry binds the exact frozen16 v26 private host without accepting downstream gates', () => {
  assert.equal(G678_CALIBRATION_FREEZE_PATH,
    G678_FROZEN16_CONTINUOUS_FREEZE.path);
  const expected = {registered: 379, maintainedDom: 25, nmsL1: 12};
  const snapshot = g678PartialCalibrationSnapshot();
  assert.equal(snapshot.status, 'ready', snapshot.error ?? 'snapshot not ready');
  assert.equal(snapshot.registeredPlacementCount, expected.registered);
  assert.equal(snapshot.frozenCalibrationPlacementCount, 2282);
  assert.equal(snapshot.descriptors.length, 44);
  assert.equal(snapshot.runtimeAssets.length, 354);
  assert.equal(snapshot.maintainedDomRenderers.length, expected.maintainedDom);
  assert.equal(new Set(snapshot.maintainedDomRenderers.map((renderer) =>
    renderer.animationId)).size, expected.maintainedDom);
  assert.equal(snapshot.registrationStatus,
    'private-current-js-calibration-partial');
  assert.equal(snapshot.scaleOutAuthorized, false);
  assert.equal(snapshot.descriptors.every((descriptor) =>
    buildWholeLessonCourseRegistration({
      descriptor,
      player: {kind: 'descriptor-driven'},
    }) === undefined), true);
  const cards = allLearningLessons(
    {NODE_ENV: 'development'},
    {g678PartialDescriptors: snapshot.descriptors},
  ).filter((card) => card.moduleCode !== null);
  assert.equal(cards.length, 44);
  assert.equal(cards.reduce((sum, card) =>
    sum + card.registeredPageCount, 0), expected.registered);
  assert.equal(cards.every((card) => card.registeredPageCount > 0), true);
  assert.equal(cards.filter((card) =>
    card.registeredPageCount === card.activePageCount).length, 2);
  assert.equal(cards.find((card) =>
    card.stableLessonKey === 'shared-alg001-l09')?.registeredPageCount, 41);
  assert.equal(cards.find((card) =>
    card.stableLessonKey === 'shared-alg001-l11')?.registeredPageCount, 44);
  const nmsL1 = cards.find((card) => card.stableLessonKey === 'shared-nms002-l01');
  assert.equal(nmsL1?.registeredPageCount, expected.nmsL1);
  assert.equal(nmsL1?.activePageCount, 47);
  const algL11 = snapshot.descriptors.find((descriptor) =>
    descriptor.course.moduleCode === 'ALG001' &&
    descriptor.course.lesson === 11);
  assert.ok(algL11);
  const tranchePages = algL11.pages.filter((page) =>
    /^shared-alg001-l11-p(?:001|002|003|004|007|013|016|017|018|022|023|024)$/u
      .test(page.animationId));
  assert.equal(tranchePages.length, 12);
  assert.equal(tranchePages.find((page) =>
    page.animationId === 'shared-alg001-l11-p001')?.presentation, undefined);
  assert.equal(tranchePages.filter((page) =>
    page.presentation?.pageInteractionCompanionTargetIdSuffix ===
      `alg-l11-${page.animationId.slice(-4)}-glossary-controls`).length, 11);
  assert.equal(cards.every((card) => card.href === null), true);
  const glossaryDescriptors = snapshot.descriptors.filter((descriptor) =>
    descriptor.glossary.length > 0);
  assert.equal(glossaryDescriptors.length, 24);
  assert.equal(glossaryDescriptors.every((descriptor) =>
    descriptor.support.lessonHostCapabilities.includes('glossary')), true);
  const baseGlossaryLessons = new Set([
    ...Array.from({length: 12}, (_, index) => `ALG001-${index + 1}`),
    'DAT001-1', 'GEO001-1', 'NMS002-1',
  ]);
  for (const descriptor of glossaryDescriptors) {
    const hasBaseGlossary = baseGlossaryLessons.has(
      `${descriptor.course.moduleCode}-${descriptor.course.lesson}`);
    const expectedGlossaryIds = hasBaseGlossary ? [
      'restate', 'question', 'problem', 'solve', 'strategies', 'data-tables',
      'equation', 'pattern', 'table', 'simple-simpler-simplest', 'organize',
      'information',
    ] : [];
    if (hasBaseGlossary && (descriptor.course.moduleCode !== 'ALG001' ||
      descriptor.course.lesson !== 1)) {
      expectedGlossaryIds.splice(expectedGlossaryIds.indexOf('data-tables'), 1);
    }
    if ((descriptor.course.moduleCode === 'ALG001' &&
      descriptor.course.lesson === 1) ||
      (descriptor.course.moduleCode === 'NMS002' &&
        descriptor.course.lesson === 1)) {
      expectedGlossaryIds.push('show');
    }
    if (descriptor.course.moduleCode === 'NMS002' &&
      descriptor.course.lesson === 1) {
      expectedGlossaryIds.push('difference');
    }
    const glossaryPages = currentFreeze.selectedPages.filter((page: {
      glossaryEntries?: readonly unknown[];
      moduleCode: string;
      lessonNumber: number;
    }) => Array.isArray(page.glossaryEntries) &&
      page.moduleCode === descriptor.course.moduleCode &&
      page.lessonNumber === descriptor.course.lesson);
    const sourceGlossaryEntries = glossaryPages.flatMap((page: {
      glossaryEntries?: readonly {
        id: string;
        sourceKeyAttribute: string;
        labels: unknown;
        definitions: unknown;
        source: unknown;
      }[];
    }) => page.glossaryEntries ?? []);
    const additionalIds = sourceGlossaryEntries
      .map((entry: {id: string}) => entry.id)
      .filter((id: string) => !expectedGlossaryIds.includes(id))
      .filter((id: string, index: number, ids: readonly string[]) =>
        ids.indexOf(id) === index)
      .sort((left: string, right: string) => left.localeCompare(right));
    const allExpectedIds = new Set([...expectedGlossaryIds, ...additionalIds]);
    const preferredIds = [
      'restate', 'question', 'problem', 'solve', 'strategies', 'data-tables',
      'equation', 'pattern', 'table', 'simple-simpler-simplest', 'organize',
      'information', 'show', 'difference',
    ].filter((id) => allExpectedIds.has(id));
    const remainingIds = [...allExpectedIds]
      .filter((id) => !preferredIds.includes(id))
      .sort((left, right) => left.localeCompare(right));
    const projectedIds = descriptor.glossary.map((entry) => entry.id);
    assert.deepEqual(projectedIds.slice(0, preferredIds.length), preferredIds);
    assert.deepEqual(projectedIds.slice(preferredIds.length),
      [...projectedIds.slice(preferredIds.length)].sort((left, right) =>
        left.localeCompare(right)));
    assert.equal(new Set(projectedIds).size, projectedIds.length);
    assert.equal(remainingIds.every((id) => projectedIds.includes(id)), true);
    const glossary = new Map(descriptor.glossary.map((entry) =>
      [entry.id, entry]));
    if (hasBaseGlossary) {
      assert.equal(glossary.get('restate')?.definitions.en,
        'To repeat again; to say again');
      assert.equal(glossary.get('restate')?.definitions.es,
        'Volver a repetir; decir de nuevo.');
      assert.equal(glossary.get('question')?.definitions.en,
        'A problem to solve. For example: Find the mean of this set of numbers {1, 2, 5, 10}');
      assert.equal(glossary.get('question')?.definitions.es,
        'Un problema para resolver. Por ejemplo: Encontrar el promedio de este conjunto de números: {1,2,5,10}');
      assert.equal(glossary.get('problem')?.definitions.en,
        'A question to solve or answer. For example: Evaluate the equation y = 2x + 3');
      assert.equal(glossary.get('problem')?.definitions.es,
        'Una pregunta para resolver o contestar. Por ejemplo: Evalúe la ecuación y = 2x + 3');
    }
    if (descriptor.course.moduleCode === 'ALG001' &&
      descriptor.course.lesson === 1) {
      assert.equal(glossary.get('data-tables')?.definitions.en,
        'Data tables are organized by columns and rows created to easily view information.');
      assert.equal(glossary.get('data-tables')?.definitions.es,
        'Las tablas de datos están organizadas en columnas y filas creadas para visualizar la información más fácilmente.');
    }
    if (hasBaseGlossary) {
      assert.equal(glossary.get('organize')?.definitions.en,
        'To organize means to put into order; to arrange in a desired pattern.');
      assert.equal(glossary.get('organize')?.definitions.es,
        'Organizar significa poner en orden, ordenar de acuerdo a un patrón deseado.');
      assert.equal(glossary.get('information')?.definitions.en,
        'A collection of facts or data. For example: José is 15 years old. José has a cell phone.');
      assert.equal(glossary.get('information')?.definitions.es,
        'Colección de datos o hechos. Por ejemplo: José tiene 15 años. José tiene un teléfono celular.');
    }
    if (allExpectedIds.has('show')) {
      assert.equal(glossary.get('show')?.definitions.en,
        'To show means to be visible or to be displayed or seen.');
      assert.equal(glossary.get('show')?.definitions.es,
        'Mostrar significa enseñar o ser visto.');
    }
    if (allExpectedIds.has('difference')) {
      assert.equal(glossary.get('difference')?.definitions.en,
        'The answer to a subtraction problem. For example: 5 – 3 = 2; 2 is the difference.');
      assert.equal(glossary.get('difference')?.definitions.es,
        'Es lo que obtenemos en una resta o problema de substracción. En el ejemplo: 5 – 3 = 2, el 2 es la diferencia.');
    }
    if (allExpectedIds.has('inequality')) {
      assert.equal(glossary.get('inequality')?.definitions.en.includes(
        '&#'), false);
      assert.match(glossary.get('inequality')?.definitions.en ?? '',
        /<.*≥.*≤.*≠/u);
      assert.equal(glossary.get('inequality')?.definitions.es.includes(
        '&#'), false);
    }
    for (const id of additionalIds) {
      const sourceEntry = sourceGlossaryEntries.find(
        (entry: {id: string}) => entry.id === id,
      );
      assert.ok(sourceEntry, `${id}: source glossary entry is missing`);
      const projectedEntry = glossary.get(id);
      const labels = sourceEntry.labels as {en: string; es: string};
      const definitions = sourceEntry.definitions as {en: string; es: string};
      assert.deepEqual(projectedEntry, {
        id: sourceEntry.id,
        sourceKeyAttribute: sourceEntry.sourceKeyAttribute,
        labels: {
          en: decodeG678GlossaryXmlText(labels.en),
          es: decodeG678GlossaryXmlText(labels.es),
        },
        definitions: {
          en: decodeG678GlossaryXmlText(definitions.en),
          es: decodeG678GlossaryXmlText(definitions.es),
        },
        source: sourceEntry.source,
      });
    }
  }
});

test('All Lessons reports truthful 1/N partial counts without opening a learner route', () => {
  const descriptors = partialFixture(13).descriptors;
  const cards = allLearningLessons(
    {NODE_ENV: 'development'},
    {g678PartialDescriptors: descriptors},
  );
  const shared = cards.filter((card) => card.moduleCode !== null);
  assert.equal(shared.length, 44);
  assert.equal(shared.filter((card) => card.registeredPageCount === 1).length, 13);
  assert.equal(shared.filter((card) => card.registeredPageCount === 0).length, 31);
  assert.equal(shared.every((card) => card.href === null), true);
  assert.equal(
    shared.every((card) => card.status === 'source-mapping-pending'),
    true,
  );
});

test('calibration product route is local-only and bypasses course registration', () => {
  const route = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx',
    import.meta.url,
  ), 'utf8');
  const proxy = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8');
  assert.match(route, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(route, /isG678LocalPreviewRequestHeaders/u);
  assert.match(route, /await headers\(\)/u);
  assert.match(route, /findG678PartialCalibrationDescriptor/u);
  assert.match(route, /initialPlacementId=\{placementId\}/u);
  assert.match(route, /releasePublished=\{false\}/u);
  assert.match(route, /strictCompleteMemberCount=\{0\}/u);
  const assetRoute = readFileSync(new URL(
    '../app/flash-assets/g678-local/[animationId]/canvas-renderer.js/route.ts',
    import.meta.url,
  ), 'utf8');
  assert.match(assetRoute, /Cross-Origin-Resource-Policy/u);
  assert.match(assetRoute, /same-origin/u);
  assert.match(assetRoute, /query\[0\].*sha256/su);
  assert.doesNotMatch(route, /whole-lesson-course-registry/u);
  assert.match(proxy, /isG678CalibrationProductPath/u);
});
