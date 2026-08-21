import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {animationModuleRegistration} from '@helpmath/demos/animation-registry';

import {
  buildG4L10ProductBridgeDescriptor,
  G4_L10_PRODUCT_BRIDGE_FREEZE_SHA256,
  G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
} from '../lib/g4-l10-product-bridge-descriptor';
import {loadCurrentGrade4CourseCatalogCoverage} from '../lib/g4-course-catalog-coverage.server';
import {resolveWholeLessonRuntimeSeed} from '../lib/whole-lesson-player-descriptor';

const freezeUrl = new URL(
  '../../../catalog/product-bridge-calibrations/g4-l10-page-only-current-js-46-v1.json',
  import.meta.url,
);
const routeUrl = new URL(
  '../app/[locale]/migration-status/g4-l10-product-bridge/page.tsx',
  import.meta.url,
);
const proxyUrl = new URL('../proxy.ts', import.meta.url);
const shellUrl = new URL(
  '../components/legacy-responsive-lesson-shell.tsx',
  import.meta.url,
);
const cssUrl = new URL('../app/globals.css', import.meta.url);

test('G4 L10 private descriptor projects all 46 Current-JS pages in exact source order', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );

  assert.equal(descriptor.schemaVersion, 2);
  assert.equal(descriptor.descriptorKind, 'private-page-only-product-bridge');
  assert.equal(descriptor.course.activePageCount, 46);
  assert.equal(descriptor.course.courseShellCount, 0);
  assert.equal(descriptor.course.expectedReleaseMemberCount, 46);
  assert.equal(descriptor.pages.length, 46);
  assert.equal(descriptor.sections.reduce(
    (sum, section) => sum + section.activePageCount,
    0,
  ), 46);

  assert.deepEqual(
    descriptor.pages
      .filter((page) => page.rendererAvailability.kind === 'registered')
      .map((page) => page.animationId),
    G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
  );
  assert.equal(
    descriptor.pages.filter(
      (page) => page.rendererAvailability.kind === 'unavailable',
    ).length,
    0,
  );
  assert.ok(descriptor.pages.every((page, index) =>
    page.globalPageOrdinal === index + 1 &&
    page.previousAnimationId === (descriptor.pages[index - 1]?.animationId ?? null) &&
    page.nextAnimationId === (descriptor.pages[index + 1]?.animationId ?? null)
  ));
  assert.deepEqual(
    descriptor.productBridge.selectedAnimationIds,
    G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
  );
  assert.equal(descriptor.productBridge.registeredAnimationCount, 46);
  assert.deepEqual(descriptor.productBridge.acceptanceEffects, {
    authoritativeOriginalRuntime: false,
    fidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  });
});

test('the descriptor is hash-bound to the freeze and private registry metadata', async () => {
  const bytes = await readFile(freezeUrl);
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    G4_L10_PRODUCT_BRIDGE_FREEZE_SHA256,
  );
  const freeze = JSON.parse(bytes.toString('utf8')) as {
    selectedPages: Array<{
      animationId: string;
      globalPageOrdinal?: number;
      sectionCode?: string;
      sectionPageOrdinal?: number;
      selectionStatus: string;
    }>;
  };
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  assert.deepEqual(
    freeze.selectedPages.map((page) => ({
      animationId: page.animationId,
      globalPageOrdinal: page.globalPageOrdinal,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: page.sectionPageOrdinal,
    })),
    descriptor.pages.map((page) => ({
      animationId: page.animationId,
      globalPageOrdinal: page.globalPageOrdinal,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: page.sectionPageOrdinal,
    })),
  );
  for (const animationId of G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS) {
    assert.deepEqual(animationModuleRegistration(animationId), {
      maturity: 'private-current-js',
      scope: 'private-engineering',
      calibrationId: 'g4-l10-page-only-current-js-46-v1',
    });
  }
});

test('TS006 uses the route locale for its explicit EN cue and ES host track', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[40]!;
  assert.equal(page.animationId, 'course-g04-l10-ts-006');
  assert.equal(page.globalPageOrdinal, 41);
  assert.equal(page.sectionPageOrdinal, 5);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('TS006 must remain registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-13');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'route-locale');
});

test('RW004 keeps the source visual fixed-English and binds its exact glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[3]!;
  assert.equal(page.animationId, 'course-g04-l10-rw-004');
  assert.equal(page.globalPageOrdinal, 4);
  assert.equal(page.sectionPageOrdinal, 3);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('RW004 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-109');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'rw004-glossary-controls',
  );
});

test('VB002 keeps the source visual fixed-English and binds its eight-handler glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[5]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-002');
  assert.equal(page.globalPageOrdinal, 6);
  assert.equal(page.sectionPageOrdinal, 1);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB002 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-84');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb002-glossary-controls',
  );
});

test('VB008 keeps the source visual fixed-English and binds its eight-handler glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[11]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-008');
  assert.equal(page.globalPageOrdinal, 12);
  assert.equal(page.sectionPageOrdinal, 7);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB008 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-62');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb008-glossary-controls',
  );
});

test('VB011 keeps the source visual fixed-English while UI and host audio follow the route', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[14]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-011');
  assert.equal(page.globalPageOrdinal, 15);
  assert.equal(page.sectionPageOrdinal, 10);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB011 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-31');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb011-glossary-controls',
  );
});

test('IN016 binds its two answer handlers, 3+4 branch seed cycle, and practice companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[29]!;
  assert.equal(page.animationId, 'course-g04-l10-in-016');
  assert.equal(page.globalPageOrdinal, 30);
  assert.equal(page.sectionPageOrdinal, 15);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('IN016 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-209');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(page.rendererAvailability.runtimeQuery?.replaySeedCycle, 12);
  assert.deepEqual(
    Array.from({length: 12}, (_, replay) =>
      resolveWholeLessonRuntimeSeed(page.rendererAvailability, replay)
    ),
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  );
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'in016-practice-controls',
  );
});

test('IN009 binds its five glossary handlers and 953-frame fixed-English loop', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[22]!;
  assert.equal(page.animationId, 'course-g04-l10-in-009');
  assert.equal(page.globalPageOrdinal, 23);
  assert.equal(page.sectionPageOrdinal, 8);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('IN009 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-89');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'in009-glossary-controls',
  );
});

test('IN008 binds three source-stage answers, the 3+4 branch seed cycle, and its practice companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[21]!;
  assert.equal(page.animationId, 'course-g04-l10-in-008');
  assert.equal(page.globalPageOrdinal, 22);
  assert.equal(page.sectionPageOrdinal, 7);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('IN008 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-210');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(page.rendererAvailability.runtimeQuery?.replaySeedCycle, 12);
  assert.deepEqual(
    Array.from({length: 12}, (_, replay) =>
      resolveWholeLessonRuntimeSeed(page.rendererAvailability, replay)
    ),
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  );
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'in008-practice-controls',
  );
  assert.equal(
    page.presentation?.pageInteractionStageTargetIdSuffix,
    'in008-answer-handlers',
  );
});

test('VB006 binds source-stage answer handlers, 3+4 branch seed cycle, and practice companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[9]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-006');
  assert.equal(page.globalPageOrdinal, 10);
  assert.equal(page.sectionPageOrdinal, 5);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB006 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-213');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(page.rendererAvailability.runtimeQuery?.replaySeedCycle, 12);
  assert.deepEqual(
    Array.from({length: 12}, (_, replay) =>
      resolveWholeLessonRuntimeSeed(page.rendererAvailability, replay)
    ),
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  );
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb006-practice-controls',
  );
  assert.equal(
    page.presentation?.pageInteractionStageTargetIdSuffix,
    'vb006-arrow-handlers',
  );
});

test('VB007 binds source-stage answer handlers, 3+4 branch seed cycle, and practice companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[10]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-007');
  assert.equal(page.globalPageOrdinal, 11);
  assert.equal(page.sectionPageOrdinal, 6);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB007 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-204');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(page.rendererAvailability.runtimeQuery?.replaySeedCycle, 12);
  assert.deepEqual(
    Array.from({length: 12}, (_, replay) =>
      resolveWholeLessonRuntimeSeed(page.rendererAvailability, replay)
    ),
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  );
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb007-practice-controls',
  );
  assert.equal(
    page.presentation?.pageInteractionStageTargetIdSuffix,
    'vb007-arrow-handlers',
  );
});

test('VB010 keeps the source visual fixed-English and binds its five-handler glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[13]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-010');
  assert.equal(page.globalPageOrdinal, 14);
  assert.equal(page.sectionPageOrdinal, 9);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB010 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-36');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb010-glossary-controls',
  );
});

test('VB005 keeps the source visual fixed-English and binds its five-handler glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[8]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-005');
  assert.equal(page.globalPageOrdinal, 9);
  assert.equal(page.sectionPageOrdinal, 4);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB005 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-44');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb005-glossary-controls',
  );
});

test('VB004 keeps the source visual fixed-English and binds its exact glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[7]!;
  assert.equal(page.animationId, 'course-g04-l10-vb-004');
  assert.equal(page.globalPageOrdinal, 8);
  assert.equal(page.sectionPageOrdinal, 3);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('VB004 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-45');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'vb004-glossary-controls',
  );
});

test('TS002 keeps the source visual fixed-English and binds its exact glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[36]!;
  assert.equal(page.animationId, 'course-g04-l10-ts-002');
  assert.equal(page.globalPageOrdinal, 37);
  assert.equal(page.sectionPageOrdinal, 1);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('TS002 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-29');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'ts002-glossary-controls',
  );
});

test('TS005 keeps the source visual fixed-English and binds its five-handler glossary companion', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[39]!;
  assert.equal(page.animationId, 'course-g04-l10-ts-005');
  assert.equal(page.globalPageOrdinal, 40);
  assert.equal(page.sectionPageOrdinal, 4);
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('TS005 must be registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.frameDomain, 'sprite-32');
  assert.equal(page.rendererAvailability.runtimeQuery?.language, 'fixed-en');
  assert.equal(
    page.presentation?.pageInteractionCompanionTargetIdSuffix,
    'ts005-glossary-controls',
  );
});

test('all selected glossary pages retain exact bilingual host data', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  assert.deepEqual(descriptor.glossary.map((entry) => ({
    id: entry.id,
    sourceKeyAttribute: entry.sourceKeyAttribute,
    en: entry.definitions.en,
    es: entry.definitions.es,
  })), [
    {
      id: 'perimeter',
      sourceKeyAttribute: 'Perimeter',
      en: 'The distance around a shape.',
      es: 'La distancia alrededor de una figura.',
    },
    {
      id: 'triangle',
      sourceKeyAttribute: 'Triangle',
      en: 'A geometric figure with three sides and three angles, in which the sum of 2 sides is greater than the third side. Triangles can be classified according to the measure of its sides or the measure of its angles.',
      es: 'Figura geométrica que tiene tres lados y tres ángulos, en el cual la suma de dos lados es mayor que el tercer lado. Los triángulos se pueden clasificar según la medida de sus lados o la medida de sus ángulos.',
    },
    {
      id: 'sum',
      sourceKeyAttribute: 'Sum',
      en: 'The answer to an addition problem. For example: the sum of 2 + 3 is 5.',
      es: 'Es la operación de adición. Es también el resultado que obtenemos. Decimos que la suma de 2 + 3 es 5.',
    },
    {
      id: 'foot-feet',
      sourceKeyAttribute: 'Foot/Feet',
      en: 'A standard unit of measure for length; 1 ft = 12 in.',
      es: 'Unidad estándar de medición de longitud; 1 pie= 12 pulgadas.',
    },
    {
      id: 'area',
      sourceKeyAttribute: 'Area',
      en: 'The amount of surface a shape covers; is found by counting the square units or by using an area formula.',
      es: 'La cantidad de superficie que una figura cubre; se determina contando las unidades cuadradas o usando la fórmula.',
    },
    {
      id: 'surface',
      sourceKeyAttribute: 'Surface',
      en: 'The outer or top space of an object.',
      es: 'El espacio superior o externo de un objeto.',
    },
    {
      id: 'square-unit',
      sourceKeyAttribute: 'Square unit',
      en: 'The unit used to measure area; a square that measures one unit on each side.',
      es: 'La unidad usada para medir área; un cuadrado que mide una unidad en cada lado.',
    },
    {
      id: 'square',
      sourceKeyAttribute: 'Square',
      en: 'A parallelogram with four equal sides and four right angles.',
      es: 'Un paralelogramo con cuatro lados iguales y cuatro ángulos rectos.',
    },
    {
      id: 'unit',
      sourceKeyAttribute: 'Unit',
      en: 'Another name for one; another name for the Ones place in a place value chart.',
      es: 'Otro nombre para uno: otro nombre para indicar las unidades en la tabla de valor posicional.',
    },
    {
      id: 'unit-of-measurement',
      sourceKeyAttribute: 'Unit of measurement',
      en: 'A standard amount or quantity.',
      es: 'Una cantidad o monto estándar.',
    },
    {
      id: 'time',
      sourceKeyAttribute: 'Time',
      en: 'Each number or object in an equation, pattern or sequence is called a term. A term can be a number, a variable, or a product or quotient of numbers and variables.',
      es: 'Período de una experiencia en la cual los eventos pasan del pasado al presente y al futuro; ejemplos de tiempo son segundos, minutos, horas, días, semanas, años, siglos.',
    },
    {
      id: 'quantity',
      sourceKeyAttribute: 'Quantity',
      en: 'A number measure.',
      es: 'La medida de un número.',
    },
    {
      id: 'length',
      sourceKeyAttribute: 'Length',
      en: 'A measure of the distance between two shapes or the distance from one end to the other; often the distance of the longest side of a shape.',
      es: 'una medida de la distancia entre dos figuras o la distancia del inicio al final, por lo general es la distancia más larga de una figura.',
    },
    {
      id: 'formula',
      sourceKeyAttribute: 'Formula',
      en: 'An equation that states a mathematical rule.',
      es: 'Una ecuación que establece una regla matemática.',
    },
    {
      id: 'width',
      sourceKeyAttribute: 'Width',
      en: 'A measure of distance from side to side of a shape; often a measure of the short or shorter side of a shape.',
      es: 'Una medida de distancia de un lado a otro lado de una figura; por lo general es la medida del lado más corto de una figura.',
    },
    {
      id: 'weight',
      sourceKeyAttribute: 'Weight',
      en: 'A measure of how heavy something is.',
      es: 'Una medida de qué tan pesado es algo.',
    },
    {
      id: 'capacity',
      sourceKeyAttribute: 'Capacity',
      en: 'The amount a container can hold.',
      es: 'La cantidad que un envase puede contener.',
    },
    {
      id: 'measurement',
      sourceKeyAttribute: 'Measurement',
      en: 'Find the size and quantity of something using standard units. For example: you can measure time using the “standard units of measurement”: hours, minutes, seconds; you can measure length using the “standard units of measurement” meters, centimeters, kilometers, inches, feet and yards, etc.',
      es: 'Encontrar el tamaño y la cantidad de algo usando unidades estándares. Por  ejemplo: usted puede medir el tiempo usando “unidades estándares de medición”: como horas, minutos, segundos; usted puede medir la longitud usando metros, centímetros, pulgadas, pies, yardas, etc.',
    },
    {
      id: 'measure',
      sourceKeyAttribute: 'Measure',
      en: 'To find the size or amount of something using a unit of measurement.',
      es: 'Encontrar el tamaño o cantidad de algo usando una unidad de medición.',
    },
    {
      id: 'distance',
      sourceKeyAttribute: 'Distance',
      en: 'The length of space between one point and another. For example: the distance from the school to the park is 1 mile.',
      es: 'Es la longitud del espacio entre dos puntos. Por ejemplo: la distancia entre 1 pulgada y 3 pulgadas es 2 pulgadas. ',
    },
    {
      id: 'around',
      sourceKeyAttribute: 'Around',
      en: 'In circumference or perimeter. For example, a circle that is 2 feet around has a circumference of 2 feet.',
      es: 'Es la circunferencia o perímetro. Por ejemplo: un círculo que tiene 2 pies alrededor tiene una circunferencia de dos pies.',
    },
    {
      id: 'side',
      sourceKeyAttribute: 'Side',
      en: 'One of the straight line segments that makes up a polygon. One of the faces of a solid figure.',
      es: 'Uno de los segmentos de línea recta que componen un polígono. Una de las caras de un cuerpo sólido.',
    },
    {
      id: 'shape',
      sourceKeyAttribute: 'Shape',
      en: 'A form or figure; a mold or pattern used to give form.',
      es: 'Una forma o figura; un molde o patrón usado para dar forma.',
    },
    {
      id: 'statement',
      sourceKeyAttribute: 'Statement',
      en: 'This is a summary of what we can say about something. For example: a statement about triangles is that “they have 3 sides”.',
      es: 'Es un concepto resumido de lo que decimos acerca de algo. Por ejemplo: un enunciado acerca del triángulo es “que tiene tres lados”.',
    },
    {
      id: 'compare',
      sourceKeyAttribute: 'Compare',
      en: 'To describe numbers as greater than, less than, or equal to each other.',
      es: 'Describir números como mayor que, menor que o igual que otro número.',
    },
    {
      id: 'rectangle',
      sourceKeyAttribute: 'Rectangle',
      en: 'A four-sided geometric figure with four right angles and two pairs of equal parallel sides.',
      es: 'Figura geométrica de 4 ángulos rectos y dos pares de lados paralelos iguales.',
    },
    {
      id: 'equation',
      sourceKeyAttribute: 'Equation',
      en: 'A mathematical sentence that shows that two expressions are equal.',
      es: 'Un enunciado matemático que muestra que dos expresiones son iguales.',
    },
    {
      id: 'strategy',
      sourceKeyAttribute: 'strategy',
      en: 'A plan of action to meet a goal.',
      es: 'Un plan de acción para alcanzar un objetivo.',
    },
    {
      id: 'pattern',
      sourceKeyAttribute: 'Pattern',
      en: 'A repeated set or sequence of numbers, shapes or designs arranged according to a rule. For example: the pattern 10, 20, 30, 40, etc. is a set of numbers following the rule “count by 10’s starting at 10”.',
      es: 'Una secuencia o conjunto de números que se repiten, las formas o diseños ordenados de acuerdo a alguna regla. Por ejemplo: el patrón 10,  20, 30, 40, etc es un conjunto de números que siguen la regla de “contar de 10 en 10 empezando en el 10”.',
    },
    {
      id: 'simple-simpler-simplest',
      sourceKeyAttribute: 'Simple / Simpler / Simplest',
      en: 'To put something in its easiest form to understand.  For example: the simplest form of the fraction 8/32 is 1/4, that is 4/16 = 2/8 = 1/4.',
      es: 'Es poner algo en su forma más fácil de entender. Por ejemplo: la forma más simple de la fracción 8/32 es 1/4, a la que se llega por la simplificación 8/32 = 4/16 = 2/8 = 1/4.',
    },
    {
      id: 'table',
      sourceKeyAttribute: 'Table',
      en: 'A diagram, graph or table showing information in an ordered way.',
      es: 'Un diagrama, gráfica o tabla que presenta información en una manera ordenada.',
    },
    {
      id: 'restate',
      sourceKeyAttribute: 'Restate',
      en: 'To repeat again; To say again',
      es: 'Volver a repetir; decir de nuevo.',
    },
    {
      id: 'question',
      sourceKeyAttribute: 'question',
      en: 'A problem to solve. For example:  Find the mean of this set of numbers {1, 2, 5, 10}',
      es: 'Un problema para resolver. Por ejemplo: Encontrar la mediana de este conjunto de números {1,2,5,10}',
    },
    {
      id: 'problem',
      sourceKeyAttribute: 'problem',
      en: 'A question to solve or answer. For example:  Evaluate the equation y = 2x + 3',
      es: 'Una pregunta para resolver  o contestar. Por ejemplo: Evalúa la ecuación y = 2x + 3 ',
    },
  ]);
  assert.deepEqual(descriptor.support.lessonHostCapabilities, [
    'audio',
    'glossary',
    'practice-feedback',
  ]);
});

test('IR001 Replay cycles both source-proven random(2) branches', () => {
  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  const page = descriptor.pages[0]!;
  assert.equal(page.animationId, 'course-g04-l10-ir-001');
  assert.equal(page.rendererAvailability.kind, 'registered');
  if (page.rendererAvailability.kind !== 'registered') {
    assert.fail('IR001 must remain registered inside the private bridge');
  }
  assert.equal(page.rendererAvailability.runtimeQuery?.replaySeedCycle, 2);
  assert.equal(resolveWholeLessonRuntimeSeed(page.rendererAvailability, 0), '0');
  assert.equal(resolveWholeLessonRuntimeSeed(page.rendererAvailability, 1), '1');
  assert.equal(resolveWholeLessonRuntimeSeed(page.rendererAvailability, 2), '0');
});

test('the calibration route is local-only and bypasses public course registration', async () => {
  const [route, proxy] = await Promise.all([
    readFile(routeUrl, 'utf8'),
    readFile(proxyUrl, 'utf8'),
  ]);
  assert.match(route, /process\.env\.NODE_ENV === 'production'/);
  assert.match(route, /notFound\(\)/);
  assert.match(route, /buildG4L10ProductBridgeDescriptor/);
  assert.match(route, /releasePublished=\{false\}/);
  assert.match(route, /strictCompleteMemberCount=\{0\}/);
  assert.doesNotMatch(route, /whole-lesson-course-registry|release-descriptor/);
  assert.match(
    proxy,
    /pathname === '\/migration-status\/g4-l10-product-bridge'[\s\S]*?return process\.env\.NODE_ENV !== 'production'/,
  );
  assert.doesNotMatch(proxy, /pathname\.startsWith\('\/migration-status\/'\)/);
});

test('modern-wide Focus keeps an actionable narration control for bridge audio', async () => {
  const [shell, css] = await Promise.all([
    readFile(shellUrl, 'utf8'),
    readFile(cssUrl, 'utf8'),
  ]);
  assert.match(
    shell,
    /modernWide && novaTutorMode === 'focus' &&\s*narrationStatus === 'unavailable'[\s\S]*?\? null\s*: <LessonNarrationControl/,
  );
  assert.doesNotMatch(
    css,
    /lesson-shell2__modern-toolbar > :is\(\s*\.lesson-shell2__narration,/,
  );
});
