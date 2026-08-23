import {
  animationModuleRegistration,
  hasAnimationModule,
} from '@helpmath/demos/animation-registry';

import type {
  Grade4CourseCatalogCoverage,
  Grade4CourseCoverageLesson,
} from './g4-course-catalog-coverage';
import type {
  PageOnlyLessonGlossaryEntry,
  PageOnlyLessonPlayerDescriptor,
  SourceBoundLabel,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

export const G4_L10_PRODUCT_BRIDGE_CALIBRATION_ID =
  'g4-l10-candidate-to-product-v33';
export const G4_L10_PRODUCT_BRIDGE_FREEZE_PATH =
  'catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v33.json';
export const G4_L10_PRODUCT_BRIDGE_FREEZE_SHA256 =
  '48a7a8fa4ba2e6fef39cd2c6af097dbdc2e5797d2d10cb2a5fb703bc45902853';

const selectedPages = Object.freeze({
  'course-g04-l10-ir-001': Object.freeze({
    frameDomain: 'sprite-31',
    lane: 'behavior-heavy',
    replaySeedCycle: 2,
    seed: '0',
  }),
  'course-g04-l10-rw-004': Object.freeze({
    frameDomain: 'sprite-109',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'rw004-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-vb-002': Object.freeze({
    frameDomain: 'sprite-84',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb002-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-vb-003': Object.freeze({
    frameDomain: 'sprite-120',
    lane: 'interactive-understood',
    pageInteractionCompanionTargetIdSuffix: 'vb003-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-vb-004': Object.freeze({
    frameDomain: 'sprite-45',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb004-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-vb-005': Object.freeze({
    frameDomain: 'sprite-44',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb005-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-vb-006': Object.freeze({
    frameDomain: 'sprite-213',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb006-practice-controls',
    pageInteractionStageTargetIdSuffix: 'vb006-arrow-handlers',
    replaySeedCycle: 12,
    seed: '0',
  }),
  'course-g04-l10-vb-007': Object.freeze({
    frameDomain: 'sprite-204',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb007-practice-controls',
    pageInteractionStageTargetIdSuffix: 'vb007-arrow-handlers',
    replaySeedCycle: 12,
    seed: '0',
  }),
  'course-g04-l10-vb-008': Object.freeze({
    frameDomain: 'sprite-62',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb008-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-vb-010': Object.freeze({
    frameDomain: 'sprite-36',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb010-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-vb-011': Object.freeze({
    frameDomain: 'sprite-31',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'vb011-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-in-008': Object.freeze({
    frameDomain: 'sprite-210',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'in008-practice-controls',
    pageInteractionStageTargetIdSuffix: 'in008-answer-handlers',
    replaySeedCycle: 12,
    seed: '0',
  }),
  'course-g04-l10-in-009': Object.freeze({
    frameDomain: 'sprite-89',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'in009-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-in-016': Object.freeze({
    frameDomain: 'sprite-209',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'in016-practice-controls',
    replaySeedCycle: 12,
    seed: '0',
  }),
  'course-g04-l10-ts-002': Object.freeze({
    frameDomain: 'sprite-29',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'ts002-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-ts-005': Object.freeze({
    frameDomain: 'sprite-32',
    lane: 'interactive-understood',
    language: 'fixed-en' as const,
    pageInteractionCompanionTargetIdSuffix: 'ts005-glossary-controls',
    seed: '0',
  }),
  'course-g04-l10-ts-006': Object.freeze({
    frameDomain: 'sprite-13',
    lane: 'low',
    language: 'route-locale' as const,
    seed: '0',
  }),
  'course-g04-l10-fq-001': Object.freeze({
    frameDomain: 'sprite-50',
    lane: 'low',
    seed: '0',
  }),
} as const);

export const G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS = Object.freeze([
  'course-g04-l10-ir-001',
  'course-g04-l10-rw-004',
  'course-g04-l10-vb-002',
  'course-g04-l10-vb-003',
  'course-g04-l10-vb-004',
  'course-g04-l10-vb-005',
  'course-g04-l10-vb-006',
  'course-g04-l10-vb-007',
  'course-g04-l10-vb-008',
  'course-g04-l10-vb-010',
  'course-g04-l10-vb-011',
  'course-g04-l10-in-008',
  'course-g04-l10-in-009',
  'course-g04-l10-in-016',
  'course-g04-l10-ts-002',
  'course-g04-l10-ts-005',
  'course-g04-l10-ts-006',
  'course-g04-l10-fq-001',
] as const);

const keyTermsSource = Object.freeze({
  en: Object.freeze({
    assetId: 'ELKTEG4.xml' as const,
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
    sha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  }),
  es: Object.freeze({
    assetId: 'ELKTSG4.xml' as const,
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
    sha256: '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
  }),
});

const glossary: readonly PageOnlyLessonGlossaryEntry[] = Object.freeze([
  Object.freeze({
    id: 'perimeter',
    sourceKeyAttribute: 'Perimeter',
    labels: Object.freeze({en: 'Perimeter', es: 'Perímetro'}),
    definitions: Object.freeze({
      en: 'The distance around a shape.',
      es: 'La distancia alrededor de una figura.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'triangle',
    sourceKeyAttribute: 'Triangle',
    labels: Object.freeze({en: 'Triangle', es: 'Triángulo'}),
    definitions: Object.freeze({
      en: 'A geometric figure with three sides and three angles, in which the sum of 2 sides is greater than the third side. Triangles can be classified according to the measure of its sides or the measure of its angles.',
      es: 'Figura geométrica que tiene tres lados y tres ángulos, en el cual la suma de dos lados es mayor que el tercer lado. Los triángulos se pueden clasificar según la medida de sus lados o la medida de sus ángulos.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'sum',
    sourceKeyAttribute: 'Sum',
    labels: Object.freeze({en: 'Sum', es: 'Suma'}),
    definitions: Object.freeze({
      en: 'The answer to an addition problem. For example: the sum of 2 + 3 is 5.',
      es: 'Es la operación de adición. Es también el resultado que obtenemos. Decimos que la suma de 2 + 3 es 5.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'foot-feet',
    sourceKeyAttribute: 'Foot/Feet',
    labels: Object.freeze({en: 'Foot/Feet', es: 'Pie (pies)'}),
    definitions: Object.freeze({
      en: 'A standard unit of measure for length; 1 ft = 12 in.',
      es: 'Unidad estándar de medición de longitud; 1 pie= 12 pulgadas.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'area',
    sourceKeyAttribute: 'Area',
    labels: Object.freeze({en: 'Area', es: 'Área'}),
    definitions: Object.freeze({
      en: 'The amount of surface a shape covers; is found by counting the square units or by using an area formula.',
      es: 'La cantidad de superficie que una figura cubre; se determina contando las unidades cuadradas o usando la fórmula.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'surface',
    sourceKeyAttribute: 'Surface',
    labels: Object.freeze({en: 'Surface', es: 'Superficie'}),
    definitions: Object.freeze({
      en: 'The outer or top space of an object.',
      es: 'El espacio superior o externo de un objeto.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'square-unit',
    sourceKeyAttribute: 'Square unit',
    labels: Object.freeze({en: 'Square unit', es: 'Unidad cuadrada'}),
    definitions: Object.freeze({
      en: 'The unit used to measure area; a square that measures one unit on each side.',
      es: 'La unidad usada para medir área; un cuadrado que mide una unidad en cada lado.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'square',
    sourceKeyAttribute: 'Square',
    labels: Object.freeze({en: 'Square', es: 'Cuadrado'}),
    definitions: Object.freeze({
      en: 'A parallelogram with four equal sides and four right angles.',
      es: 'Un paralelogramo con cuatro lados iguales y cuatro ángulos rectos.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'unit',
    sourceKeyAttribute: 'Unit',
    labels: Object.freeze({en: 'Unit', es: 'Unidad'}),
    definitions: Object.freeze({
      en: 'Another name for one; another name for the Ones place in a place value chart.',
      es: 'Otro nombre para uno: otro nombre para indicar las unidades en la tabla de valor posicional.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'unit-of-measurement',
    sourceKeyAttribute: 'Unit of measurement',
    labels: Object.freeze({
      en: 'Unit of measurement',
      es: 'Unidad de medición',
    }),
    definitions: Object.freeze({
      en: 'A standard amount or quantity.',
      es: 'Una cantidad o monto estándar.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'time',
    sourceKeyAttribute: 'Time',
    labels: Object.freeze({en: 'Time', es: 'Tiempo'}),
    definitions: Object.freeze({
      en: 'Each number or object in an equation, pattern or sequence is called a term. A term can be a number, a variable, or a product or quotient of numbers and variables.',
      es: 'Período de una experiencia en la cual los eventos pasan del pasado al presente y al futuro; ejemplos de tiempo son segundos, minutos, horas, días, semanas, años, siglos.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'quantity',
    sourceKeyAttribute: 'Quantity',
    labels: Object.freeze({en: 'Quantity', es: 'Cantidad'}),
    definitions: Object.freeze({
      en: 'A number measure.',
      es: 'La medida de un número.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'length',
    sourceKeyAttribute: 'Length',
    labels: Object.freeze({en: 'Length', es: 'Longitud'}),
    definitions: Object.freeze({
      en: 'A measure of the distance between two shapes or the distance from one end to the other; often the distance of the longest side of a shape.',
      es: 'una medida de la distancia entre dos figuras o la distancia del inicio al final, por lo general es la distancia más larga de una figura.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'formula',
    sourceKeyAttribute: 'Formula',
    labels: Object.freeze({en: 'Formula', es: 'Fórmula'}),
    definitions: Object.freeze({
      en: 'An equation that states a mathematical rule.',
      es: 'Una ecuación que establece una regla matemática.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'width',
    sourceKeyAttribute: 'Width',
    labels: Object.freeze({en: 'Width', es: 'Anchura'}),
    definitions: Object.freeze({
      en: 'A measure of distance from side to side of a shape; often a measure of the short or shorter side of a shape.',
      es: 'Una medida de distancia de un lado a otro lado de una figura; por lo general es la medida del lado más corto de una figura.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'weight',
    sourceKeyAttribute: 'Weight',
    labels: Object.freeze({en: 'Weight', es: 'Peso'}),
    definitions: Object.freeze({
      en: 'A measure of how heavy something is.',
      es: 'Una medida de qué tan pesado es algo.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'capacity',
    sourceKeyAttribute: 'Capacity',
    labels: Object.freeze({en: 'Capacity', es: 'Capacidad'}),
    definitions: Object.freeze({
      en: 'The amount a container can hold.',
      es: 'La cantidad que un envase puede contener.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'measurement',
    sourceKeyAttribute: 'Measurement',
    labels: Object.freeze({en: 'Measurement', es: 'Medición'}),
    definitions: Object.freeze({
      en: 'Find the size and quantity of something using standard units. For example: you can measure time using the “standard units of measurement”: hours, minutes, seconds; you can measure length using the “standard units of measurement” meters, centimeters, kilometers, inches, feet and yards, etc.',
      es: 'Encontrar el tamaño y la cantidad de algo usando unidades estándares. Por  ejemplo: usted puede medir el tiempo usando “unidades estándares de medición”: como horas, minutos, segundos; usted puede medir la longitud usando metros, centímetros, pulgadas, pies, yardas, etc.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'measure',
    sourceKeyAttribute: 'Measure',
    labels: Object.freeze({en: 'Measure', es: 'Medir'}),
    definitions: Object.freeze({
      en: 'To find the size or amount of something using a unit of measurement.',
      es: 'Encontrar el tamaño o cantidad de algo usando una unidad de medición.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'distance',
    sourceKeyAttribute: 'Distance',
    labels: Object.freeze({en: 'Distance', es: 'Distancia'}),
    definitions: Object.freeze({
      en: 'The length of space between one point and another. For example: the distance from the school to the park is 1 mile.',
      es: 'Es la longitud del espacio entre dos puntos. Por ejemplo: la distancia entre 1 pulgada y 3 pulgadas es 2 pulgadas. ',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'around',
    sourceKeyAttribute: 'Around',
    labels: Object.freeze({en: 'Around', es: 'Alrededor'}),
    definitions: Object.freeze({
      en: 'In circumference or perimeter. For example, a circle that is 2 feet around has a circumference of 2 feet.',
      es: 'Es la circunferencia o perímetro. Por ejemplo: un círculo que tiene 2 pies alrededor tiene una circunferencia de dos pies.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'side',
    sourceKeyAttribute: 'Side',
    labels: Object.freeze({en: 'Side', es: 'Lado'}),
    definitions: Object.freeze({
      en: 'One of the straight line segments that makes up a polygon. One of the faces of a solid figure.',
      es: 'Uno de los segmentos de línea recta que componen un polígono. Una de las caras de un cuerpo sólido.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'shape',
    sourceKeyAttribute: 'Shape',
    labels: Object.freeze({en: 'Shape', es: 'Forma'}),
    definitions: Object.freeze({
      en: 'A form or figure; a mold or pattern used to give form.',
      es: 'Una forma o figura; un molde o patrón usado para dar forma.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'statement',
    sourceKeyAttribute: 'Statement',
    labels: Object.freeze({en: 'Statement', es: 'Enunciado'}),
    definitions: Object.freeze({
      en: 'This is a summary of what we can say about something. For example: a statement about triangles is that “they have 3 sides”.',
      es: 'Es un concepto resumido de lo que decimos acerca de algo. Por ejemplo: un enunciado acerca del triángulo es “que tiene tres lados”.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'compare',
    sourceKeyAttribute: 'Compare',
    labels: Object.freeze({en: 'Compare', es: 'Comparar'}),
    definitions: Object.freeze({
      en: 'To describe numbers as greater than, less than, or equal to each other.',
      es: 'Describir números como mayor que, menor que o igual que otro número.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'rectangle',
    sourceKeyAttribute: 'Rectangle',
    labels: Object.freeze({en: 'Rectangle', es: 'Rectángulo'}),
    definitions: Object.freeze({
      en: 'A four-sided geometric figure with four right angles and two pairs of equal parallel sides.',
      es: 'Figura geométrica de 4 ángulos rectos y dos pares de lados paralelos iguales.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'equation',
    sourceKeyAttribute: 'Equation',
    labels: Object.freeze({en: 'Equation', es: 'Ecuaciòn'}),
    definitions: Object.freeze({
      en: 'A mathematical sentence that shows that two expressions are equal.',
      es: 'Un enunciado matemático que muestra que dos expresiones son iguales.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'strategy',
    sourceKeyAttribute: 'strategy',
    labels: Object.freeze({en: 'Strategy', es: 'Estrategia'}),
    definitions: Object.freeze({
      en: 'A plan of action to meet a goal.',
      es: 'Un plan de acción para alcanzar un objetivo.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'pattern',
    sourceKeyAttribute: 'Pattern',
    labels: Object.freeze({en: 'Pattern', es: 'Patrón'}),
    definitions: Object.freeze({
      en: 'A repeated set or sequence of numbers, shapes or designs arranged according to a rule. For example: the pattern 10, 20, 30, 40, etc. is a set of numbers following the rule “count by 10’s starting at 10”.',
      es: 'Una secuencia o conjunto de números que se repiten, las formas o diseños ordenados de acuerdo a alguna regla. Por ejemplo: el patrón 10,  20, 30, 40, etc es un conjunto de números que siguen la regla de “contar de 10 en 10 empezando en el 10”.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'simple-simpler-simplest',
    sourceKeyAttribute: 'Simple / Simpler / Simplest',
    labels: Object.freeze({
      en: 'Simple / Simpler / Simplest',
      es: 'Simple / Más Simple / El Más Simple',
    }),
    definitions: Object.freeze({
      en: 'To put something in its easiest form to understand.  For example: the simplest form of the fraction 8/32 is 1/4, that is 4/16 = 2/8 = 1/4.',
      es: 'Es poner algo en su forma más fácil de entender. Por ejemplo: la forma más simple de la fracción 8/32 es 1/4, a la que se llega por la simplificación 8/32 = 4/16 = 2/8 = 1/4.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'table',
    sourceKeyAttribute: 'Table',
    labels: Object.freeze({en: 'Table', es: 'Cuadro'}),
    definitions: Object.freeze({
      en: 'A diagram, graph or table showing information in an ordered way.',
      es: 'Un diagrama, gráfica o tabla que presenta información en una manera ordenada.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'restate',
    sourceKeyAttribute: 'Restate',
    labels: Object.freeze({en: 'Restate', es: 'Replantear'}),
    definitions: Object.freeze({
      en: 'To repeat again; To say again',
      es: 'Volver a repetir; decir de nuevo.',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'question',
    sourceKeyAttribute: 'question',
    labels: Object.freeze({en: 'Question', es: 'Pregunta'}),
    definitions: Object.freeze({
      en: 'A problem to solve. For example:  Find the mean of this set of numbers {1, 2, 5, 10}',
      es: 'Un problema para resolver. Por ejemplo: Encontrar la mediana de este conjunto de números {1,2,5,10}',
    }),
    source: keyTermsSource,
  }),
  Object.freeze({
    id: 'problem',
    sourceKeyAttribute: 'problem',
    labels: Object.freeze({en: 'Problem', es: 'Problema'}),
    definitions: Object.freeze({
      en: 'A question to solve or answer. For example:  Evaluate the equation y = 2x + 3',
      es: 'Una pregunta para resolver  o contestar. Por ejemplo: Evalúa la ecuación y = 2x + 3 ',
    }),
    source: keyTermsSource,
  }),
]);

function courseLabel(text: string, locale: 'en' | 'es'): SourceBoundLabel {
  return locale === 'en'
    ? Object.freeze({
        text,
        sourceLanguage: 'en',
        sourceStatus: 'exact-course-xml',
        usesEnglishFallback: false,
      })
    : Object.freeze({
        text,
        sourceLanguage: 'en',
        sourceStatus: 'missing-lesson-level-spanish-title',
        usesEnglishFallback: true,
      });
}

function lessonTen(
  coverage: Grade4CourseCatalogCoverage,
): Grade4CourseCoverageLesson {
  if (coverage.status !== 'valid') {
    throw new Error(
      `Cannot build the G4 L10 product bridge from invalid catalog coverage: ${coverage.diagnostics.join('; ')}`,
    );
  }
  const lesson = coverage.lessons.find((candidate) => candidate.lesson === 10);
  if (!lesson) throw new Error('Grade 4 Lesson 10 is absent from catalog coverage');
  if (
    lesson.counts.activePages !== 46 ||
    lesson.pages.length !== 46 ||
    !lesson.readiness.sourceCoverageComplete ||
    lesson.counts.catalogResolvedPages !== 46
  ) {
    throw new Error('G4 L10 page-only source coverage must remain exactly 46/46');
  }
  return lesson;
}

function assertPrivateRegistration(animationId: string): void {
  const registration = animationModuleRegistration(animationId);
  if (
    !hasAnimationModule(animationId) ||
    registration?.scope !== 'private-engineering' ||
    registration.maturity !== 'private-current-js' ||
    registration.calibrationId !== G4_L10_PRODUCT_BRIDGE_CALIBRATION_ID
  ) {
    throw new Error(
      `${animationId} is not bound to the frozen private product-bridge registry`,
    );
  }
}

export function buildG4L10ProductBridgeDescriptor(
  coverage: Grade4CourseCatalogCoverage,
): PageOnlyLessonPlayerDescriptor {
  const lesson = lessonTen(coverage);
  G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS.forEach(
    assertPrivateRegistration,
  );

  const selectedIdSet = new Set<string>(
    G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
  );
  const pages = lesson.pages.map((page, index): WholeLessonPlayerPage => {
    const animationId = page.source.animationId;
    if (!animationId || !page.source.assetId || !page.source.swfSha256) {
      throw new Error(`G4 L10 page ${page.globalPageOrdinal} lost canonical source identity`);
    }
    const selection = selectedPages[
      animationId as keyof typeof selectedPages
    ];
    if (selectedIdSet.has(animationId) && !selection) {
      throw new Error(`${animationId} is selected without a frozen lane`);
    }
    return Object.freeze({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId,
      previousAnimationId: index > 0
        ? lesson.pages[index - 1]!.source.animationId
        : null,
      nextAnimationId: index < lesson.pages.length - 1
        ? lesson.pages[index + 1]!.source.animationId
        : null,
      labels: page.labels,
      rendererAvailability: selection
        ? Object.freeze({
            kind: 'registered' as const,
            moduleKey: animationId,
            runtimeQuery: Object.freeze({
              frameDomain: selection.frameDomain,
              language: 'language' in selection
                ? selection.language
                : 'fixed-en' as const,
              replaySeedCycle: 'replaySeedCycle' in selection
                ? selection.replaySeedCycle
                : undefined,
              seed: selection.seed,
            }),
          })
        : Object.freeze({
            kind: 'unavailable' as const,
            reason: 'outside-frozen-eighteen-page-product-bridge',
          }),
      presentation: selection &&
          'pageInteractionCompanionTargetIdSuffix' in selection
        ? Object.freeze({
            pageInteractionCompanionTargetIdSuffix:
              selection.pageInteractionCompanionTargetIdSuffix,
            pageInteractionStageTargetIdSuffix:
              'pageInteractionStageTargetIdSuffix' in selection
                ? selection.pageInteractionStageTargetIdSuffix
                : undefined,
          })
        : undefined,
      source: Object.freeze({
        assetId: page.source.assetId,
        sourceOccurrence: page.source.sourceOccurrence,
      }),
    });
  });

  const selectedInSourceOrder = pages
    .filter((page) => page.rendererAvailability.kind === 'registered')
    .map((page) => page.animationId);
  if (
    selectedInSourceOrder.join('\n') !==
      G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS.join('\n')
  ) {
    throw new Error('Frozen G4 L10 pages no longer occupy ordinals 1, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 22, 23, 30, 37, 40, 41, and 44');
  }

  return Object.freeze({
    schemaVersion: 2,
    descriptorKind: 'private-page-only-product-bridge',
    descriptorId: 'g4-l10-page-only-product-bridge-v1',
    calibrationId: G4_L10_PRODUCT_BRIDGE_CALIBRATION_ID,
    releaseId: 'private-g4-l10-product-bridge-v1',
    course: Object.freeze({
      grade: 4,
      lesson: 10,
      href: '/migration-status/g4-l10-product-bridge',
      domIdPrefix: 'g4-l10-product-bridge',
      activePageCount: 46,
      courseShellCount: 0,
      expectedReleaseMemberCount: 46,
      labels: Object.freeze({
        en: courseLabel(lesson.titleEnglish, 'en'),
        es: courseLabel(lesson.titleEnglish, 'es'),
      }),
    }),
    source: Object.freeze({
      navigationContractPath: 'apps/web/lib/g4-course-catalog-coverage.server.ts',
      sourceXmlPath: lesson.source.lessonXmlPath,
      sourceXmlSha256: lesson.source.lessonXmlSha256,
      sequenceAuthority: 'course-xml-occurrence',
      candidateFreezeManifestPath: G4_L10_PRODUCT_BRIDGE_FREEZE_PATH,
      candidateFreezeManifestSha256: G4_L10_PRODUCT_BRIDGE_FREEZE_SHA256,
    }),
    persistence: Object.freeze({
      schemaVersion: 1,
      storageKey: 'helpmath:g4-l10-product-bridge:v1',
      scope: 'local-device-only',
      legacyCompatible: false,
    }),
    stage: Object.freeze({width: 800, height: 600}),
    support: Object.freeze({
      locales: Object.freeze(['en', 'es'] as const),
      rendererRegistrySnapshot: 'current-javascript-module-registry',
      lessonHostCapabilities: Object.freeze([
        'audio',
        'glossary',
        'practice-feedback',
      ] as const),
    }),
    visualSkin: Object.freeze({
      kind: 'modern-my-lesson-page-only',
      layoutId: 'help-math-modern-my-lesson-page-only-v1',
      presentations: Object.freeze(['modern-wide'] as const),
      chromeAsset: '' as const,
      header: Object.freeze({height: 0 as const}),
      footer: Object.freeze({height: 0 as const}),
      controls: Object.freeze({
        kind: 'unresolved-modern-functional-equivalent',
        reason: 'The retained modern My Lesson host owns navigation and playback controls; the excluded legacy course-shell is not a page-only member.',
      }),
      evidence: Object.freeze({
        kind: 'product-owned-modern-my-lesson',
        calibrationId: G4_L10_PRODUCT_BRIDGE_CALIBRATION_ID,
      }),
    }),
    glossary,
    productBridge: Object.freeze({
      selectedAnimationIds: G4_L10_PRODUCT_BRIDGE_SELECTED_ANIMATION_IDS,
      registeredAnimationCount: 18,
      pageOnlyDescriptorMemberCount: 46,
      acceptanceEffects: Object.freeze({
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      }),
    }),
    sections: Object.freeze(lesson.sections.map((section) => Object.freeze({
      order: section.order,
      code: section.code,
      activePageCount: section.activePageCount,
      firstActiveAnimationId: lesson.pages.find(
        (page) => page.sourceKey === section.firstActiveSourceKey,
      )?.source.animationId ?? (() => {
        throw new Error(`Section ${section.code} lost its first active page`);
      })(),
      labels: section.labels,
    }))),
    pages: Object.freeze(pages),
  });
}
