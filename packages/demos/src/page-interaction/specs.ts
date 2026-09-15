import {
  UNPROVEN_FLASH_POINTER_POLICY,
  type DragDropToken,
  type DropTarget,
  type LocalizedText,
  type NativeRect,
  type PageInteractionSpec,
  type SelectableChoice
} from './contract';

const PRACTICE_PROMPT: LocalizedText = Object.freeze({
  en: 'Practice placing this lesson’s Important Words. This overlay is not a graded Flash answer key.',
  es: 'Practica colocando las Palabras importantes de esta lección. Este overlay no es una clave calificada del Flash original.'
});

const GAME_PROMPT: LocalizedText = Object.freeze({
  en: 'Choose a lesson term to continue. Answers are not graded until a SWF audit exists.',
  es: 'Elige un término de la lección para continuar. Las respuestas no se califican hasta que exista una auditoría del SWF.'
});

const EVIDENCE_NOTE =
  'The HELP MATH original SWF/FLA archive is not present in this workbench snapshot, and none of these page IDs has a migration intake/audit/baseline workspace. Tokens come from catalog Important Words titles only. Placement is ungraded practice, not a reconstructed AVM1 answer key.';

function rect(x: number, y: number, width: number, height: number): NativeRect {
  return Object.freeze({x, y, width, height});
}

function termCell(id: string, x: number): DropTarget {
  return Object.freeze({
    id,
    label: Object.freeze({en: 'Key Term', es: 'Término clave'}),
    rect: rect(x, 250, 180, 72)
  });
}

function swfPath(grade: 3 | 4 | 5, lesson: number, section: 'TI' | 'GS', file: string): string {
  return `HELP_COURSES/ELMGR${grade}/L${lesson}/${section}/${file}`;
}

function practiceToken(id: string, label: LocalizedText): DragDropToken {
  return Object.freeze({id, label, correctTargetIds: Object.freeze([])});
}

function practiceChoice(id: string, label: LocalizedText): SelectableChoice {
  return Object.freeze({id, label, correct: false});
}

function dragPage(options: {
  animationId: string;
  suffix: string;
  sourceSwfPath: string;
  sourceSwfSha256?: string;
  problem: LocalizedText;
  tokens: readonly DragDropToken[];
}): PageInteractionSpec {
  return Object.freeze({
    animationId: options.animationId,
    kind: 'drag-drop-key-terms',
    stageTargetIdSuffix: options.suffix,
    frameCount: 10,
    answerKey: 'ungraded-practice',
    pointerLifecycle: UNPROVEN_FLASH_POINTER_POLICY,
    prompt: PRACTICE_PROMPT,
    problem: options.problem,
    tokens: options.tokens,
    targets: THREE_CELLS,
    evidence: Object.freeze({
      sourceSwfPath: options.sourceSwfPath,
      sourceSwfSha256: options.sourceSwfSha256,
      reconstruction: 'catalog-vocabulary-ungraded-practice',
      notes: EVIDENCE_NOTE
    })
  });
}

function selectPage(options: {
  animationId: string;
  suffix: string;
  sourceSwfPath: string;
  sourceSwfSha256?: string;
  problem: LocalizedText;
  choices: readonly SelectableChoice[];
}): PageInteractionSpec {
  return Object.freeze({
    animationId: options.animationId,
    kind: 'selectable-targets',
    stageTargetIdSuffix: options.suffix,
    frameCount: 10,
    answerKey: 'ungraded-practice',
    pointerLifecycle: UNPROVEN_FLASH_POINTER_POLICY,
    prompt: GAME_PROMPT,
    problem: options.problem,
    choices: options.choices,
    evidence: Object.freeze({
      sourceSwfPath: options.sourceSwfPath,
      sourceSwfSha256: options.sourceSwfSha256,
      reconstruction: 'catalog-vocabulary-ungraded-practice',
      notes: EVIDENCE_NOTE
    })
  });
}

const ADDEND = Object.freeze({en: 'addend', es: 'sumando'});
const SUM = Object.freeze({en: 'sum', es: 'suma'});
const DIFFERENCE = Object.freeze({en: 'difference', es: 'diferencia'});
const POSITIVE = Object.freeze({en: 'positive', es: 'positivo'});
const NEGATIVE = Object.freeze({en: 'negative', es: 'negativo'});
const ZERO = Object.freeze({en: 'zero', es: 'cero'});
const ADD = Object.freeze({en: 'add', es: 'suma'});
const SUBTRACT = Object.freeze({en: 'subtract', es: 'sustraer'});
const OPPOSITES = Object.freeze({en: 'opposites', es: 'opuestos'});

const THREE_CELLS = Object.freeze([termCell('slot-a', 80), termCell('slot-b', 310), termCell('slot-c', 540)]);

function g3PracticeTokens(prefix: string): readonly DragDropToken[] {
  return Object.freeze([
    practiceToken(`${prefix}-addend`, ADDEND),
    practiceToken(`${prefix}-sum`, SUM),
    practiceToken(`${prefix}-difference`, DIFFERENCE)
  ]);
}

function g4PracticeTokens(prefix: string): readonly DragDropToken[] {
  return Object.freeze([
    practiceToken(`${prefix}-positive`, POSITIVE),
    practiceToken(`${prefix}-negative`, NEGATIVE),
    practiceToken(`${prefix}-zero`, ZERO)
  ]);
}

function g5PracticeTokens(prefix: string): readonly DragDropToken[] {
  return Object.freeze([
    practiceToken(`${prefix}-add`, ADD),
    practiceToken(`${prefix}-subtract`, SUBTRACT),
    practiceToken(`${prefix}-opposites`, OPPOSITES)
  ]);
}

function catalogQuestion(n: number): LocalizedText {
  return Object.freeze({en: `Question ${n}`, es: `Pregunta ${n}`});
}

function catalogGame(n: number): LocalizedText {
  return Object.freeze({en: `Game ${n}`, es: `Juego ${n}`});
}

const G03_L02: readonly PageInteractionSpec[] = Object.freeze([
  dragPage({
    animationId: 'course-g03-l02-ti-002',
    suffix: 'ti002-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI02.swf'),
    sourceSwfSha256: 'a1535e6d0734aaa15250445ce40764eac7e0c9026f9ff72de9ac3628dd18244d',
    problem: catalogQuestion(1),
    tokens: g3PracticeTokens('g3l2-ti002')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-003',
    suffix: 'ti003-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI03.swf'),
    sourceSwfSha256: '826acd1f4169d4f7881fd12b00957e6d19717c61c33dd800993c51553668fd3b',
    problem: catalogQuestion(2),
    tokens: g3PracticeTokens('g3l2-ti003')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-004',
    suffix: 'ti004-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI04.swf'),
    problem: catalogQuestion(3),
    tokens: g3PracticeTokens('g3l2-ti004')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-005',
    suffix: 'ti005-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI05.swf'),
    problem: catalogQuestion(4),
    tokens: g3PracticeTokens('g3l2-ti005')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-006',
    suffix: 'ti006-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI06.swf'),
    problem: catalogQuestion(5),
    tokens: g3PracticeTokens('g3l2-ti006')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-007',
    suffix: 'ti007-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI07.swf'),
    problem: catalogQuestion(6),
    tokens: g3PracticeTokens('g3l2-ti007')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-008',
    suffix: 'ti008-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI08.swf'),
    problem: catalogQuestion(7),
    tokens: g3PracticeTokens('g3l2-ti008')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-009',
    suffix: 'ti009-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI09.swf'),
    problem: catalogQuestion(8),
    tokens: g3PracticeTokens('g3l2-ti009')
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-010',
    suffix: 'ti010-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI10.swf'),
    problem: catalogQuestion(9),
    tokens: g3PracticeTokens('g3l2-ti010')
  }),
  selectPage({
    animationId: 'course-g03-l02-gs-002',
    suffix: 'gs002-game',
    sourceSwfPath: swfPath(3, 2, 'GS', 'L2GS02.swf'),
    problem: catalogGame(1),
    choices: Object.freeze([
      practiceChoice('g3l2-gs002-addend', ADDEND),
      practiceChoice('g3l2-gs002-sum', SUM),
      practiceChoice('g3l2-gs002-difference', DIFFERENCE)
    ])
  }),
  selectPage({
    animationId: 'course-g03-l02-gs-003',
    suffix: 'gs003-game',
    sourceSwfPath: swfPath(3, 2, 'GS', 'L2GS03.swf'),
    problem: catalogGame(2),
    choices: Object.freeze([
      practiceChoice('g3l2-gs003-addend', ADDEND),
      practiceChoice('g3l2-gs003-sum', SUM),
      practiceChoice('g3l2-gs003-difference', DIFFERENCE)
    ])
  })
]);

const G04_L03: readonly PageInteractionSpec[] = Object.freeze([
  dragPage({
    animationId: 'course-g04-l03-ti-002',
    suffix: 'ti002-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI02.swf'),
    sourceSwfSha256: 'e640f8dcbfb6dd6945d97be67890e0015902702239e2bad4bd4283685fb0f807',
    problem: catalogQuestion(1),
    tokens: g4PracticeTokens('g4l3-ti002')
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-003',
    suffix: 'ti003-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI03.swf'),
    problem: catalogQuestion(2),
    tokens: g4PracticeTokens('g4l3-ti003')
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-004',
    suffix: 'ti004-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI04.swf'),
    problem: catalogQuestion(3),
    tokens: g4PracticeTokens('g4l3-ti004')
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-005',
    suffix: 'ti005-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI05.swf'),
    problem: catalogQuestion(4),
    tokens: g4PracticeTokens('g4l3-ti005')
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-006',
    suffix: 'ti006-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI06.swf'),
    problem: catalogQuestion(5),
    tokens: g4PracticeTokens('g4l3-ti006')
  }),
  selectPage({
    animationId: 'course-g04-l03-gs-002',
    suffix: 'gs002-game',
    sourceSwfPath: swfPath(4, 3, 'GS', 'L3GS02.swf'),
    problem: catalogGame(1),
    choices: Object.freeze([
      practiceChoice('g4l3-gs002-positive', POSITIVE),
      practiceChoice('g4l3-gs002-negative', NEGATIVE),
      practiceChoice('g4l3-gs002-zero', ZERO)
    ])
  })
]);

const G05_L05: readonly PageInteractionSpec[] = Object.freeze([
  dragPage({
    animationId: 'course-g05-l05-ti-002',
    suffix: 'ti002-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI02.swf'),
    sourceSwfSha256: '54edc245960ecb1847f0117393601f5ca5644777b1d22f28ab94fcdb195f2a38',
    problem: catalogQuestion(1),
    tokens: g5PracticeTokens('g5l5-ti002')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-003',
    suffix: 'ti003-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI03.swf'),
    problem: catalogQuestion(2),
    tokens: g5PracticeTokens('g5l5-ti003')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-004',
    suffix: 'ti004-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI04.swf'),
    problem: catalogQuestion(3),
    tokens: g5PracticeTokens('g5l5-ti004')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-005',
    suffix: 'ti005-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI05.swf'),
    problem: catalogQuestion(4),
    tokens: g5PracticeTokens('g5l5-ti005')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-006',
    suffix: 'ti006-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI06.swf'),
    problem: catalogQuestion(5),
    tokens: g5PracticeTokens('g5l5-ti006')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-007',
    suffix: 'ti007-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI07.swf'),
    problem: catalogQuestion(6),
    tokens: g5PracticeTokens('g5l5-ti007')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-008',
    suffix: 'ti008-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI08.swf'),
    problem: catalogQuestion(7),
    tokens: g5PracticeTokens('g5l5-ti008')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-009',
    suffix: 'ti009-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI09.swf'),
    problem: catalogQuestion(8),
    tokens: g5PracticeTokens('g5l5-ti009')
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-010',
    suffix: 'ti010-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI10.swf'),
    problem: catalogQuestion(9),
    tokens: g5PracticeTokens('g5l5-ti010')
  }),
  selectPage({
    animationId: 'course-g05-l05-gs-002',
    suffix: 'gs002-game',
    sourceSwfPath: swfPath(5, 5, 'GS', 'L5GS02.swf'),
    problem: catalogGame(1),
    choices: Object.freeze([
      practiceChoice('g5l5-gs002-add', ADD),
      practiceChoice('g5l5-gs002-subtract', SUBTRACT),
      practiceChoice('g5l5-gs002-opposites', OPPOSITES)
    ])
  })
]);

export const CITED_PAGE_INTERACTIONS: readonly PageInteractionSpec[] = Object.freeze([
  ...G03_L02,
  ...G04_L03,
  ...G05_L05
]);
