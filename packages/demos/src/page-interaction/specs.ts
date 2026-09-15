import {
  UNPROVEN_FLASH_POINTER_POLICY,
  type DropTarget,
  type LocalizedText,
  type NativeRect,
  type PageInteractionSpec
} from './contract';

const DRAG_PROMPT: LocalizedText = Object.freeze({
  en: 'Click and drag the key terms to place them where they belong.',
  es: 'Haz clic y arrastra los términos clave para colocarlos donde correspondan.'
});

const GAME_PROMPT: LocalizedText = Object.freeze({
  en: 'Choose the correct answer to complete this Play It round.',
  es: 'Elige la respuesta correcta para completar esta ronda de Juégalo.'
});

const EVIDENCE_NOTE =
  'Catalog-backed vocabulary reconstruction for the cited lesson. Original Flash hit-test polygons and AVM1 pointer lifecycle are not established in this workbench snapshot; the overlay still exposes real DOM drag, drop, and keyboard placement.';

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

function dragPage(options: {
  animationId: string;
  suffix: string;
  sourceSwfPath: string;
  sourceSwfSha256?: string;
  problem: LocalizedText;
  tokens: PageInteractionSpec['tokens'];
  targets: PageInteractionSpec['targets'];
}): PageInteractionSpec {
  return Object.freeze({
    animationId: options.animationId,
    kind: 'drag-drop-key-terms',
    stageTargetIdSuffix: options.suffix,
    frameCount: 10,
    pointerLifecycle: UNPROVEN_FLASH_POINTER_POLICY,
    prompt: DRAG_PROMPT,
    problem: options.problem,
    tokens: options.tokens,
    targets: options.targets,
    evidence: Object.freeze({
      sourceSwfPath: options.sourceSwfPath,
      sourceSwfSha256: options.sourceSwfSha256,
      reconstruction: 'catalog-vocabulary-pending-swf-hit-test',
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
  choices: PageInteractionSpec['choices'];
}): PageInteractionSpec {
  return Object.freeze({
    animationId: options.animationId,
    kind: 'selectable-targets',
    stageTargetIdSuffix: options.suffix,
    frameCount: 10,
    pointerLifecycle: UNPROVEN_FLASH_POINTER_POLICY,
    prompt: GAME_PROMPT,
    problem: options.problem,
    choices: options.choices,
    evidence: Object.freeze({
      sourceSwfPath: options.sourceSwfPath,
      sourceSwfSha256: options.sourceSwfSha256,
      reconstruction: 'catalog-vocabulary-pending-swf-hit-test',
      notes: EVIDENCE_NOTE
    })
  });
}

const ADDEND = Object.freeze({en: 'addend', es: 'sumando'});
const SUM = Object.freeze({en: 'sum', es: 'suma'});
const DIFFERENCE = Object.freeze({en: 'difference', es: 'diferencia'});
const ADDITION = Object.freeze({en: 'addition', es: 'adición'});
const SUBTRACTION = Object.freeze({en: 'subtraction', es: 'sustracción'});
const POSITIVE = Object.freeze({en: 'positive', es: 'positivo'});
const NEGATIVE = Object.freeze({en: 'negative', es: 'negativo'});
const ZERO = Object.freeze({en: 'zero', es: 'cero'});
const OPPOSITE = Object.freeze({en: 'opposite', es: 'opuesto'});
const ADD = Object.freeze({en: 'add', es: 'sumar'});
const SUBTRACT = Object.freeze({en: 'subtract', es: 'restar'});
const SIGN = Object.freeze({en: 'sign', es: 'signo'});

const THREE_CELLS = Object.freeze([termCell('slot-a', 80), termCell('slot-b', 310), termCell('slot-c', 540)]);

function additionTokens(leftId: string, rightId: string, sumId: string) {
  return Object.freeze([
    Object.freeze({id: leftId, label: ADDEND, correctTargetIds: Object.freeze(['slot-a', 'slot-b'])}),
    Object.freeze({id: rightId, label: ADDEND, correctTargetIds: Object.freeze(['slot-a', 'slot-b'])}),
    Object.freeze({id: sumId, label: SUM, correctTargetIds: Object.freeze(['slot-c'])})
  ]);
}

function differenceWithDistractors(differenceId: string, addendId: string, sumId: string) {
  return Object.freeze([
    Object.freeze({id: differenceId, label: DIFFERENCE, correctTargetIds: Object.freeze(['slot-c'])}),
    Object.freeze({id: addendId, label: ADDEND, correctTargetIds: Object.freeze([])}),
    Object.freeze({id: sumId, label: SUM, correctTargetIds: Object.freeze([])})
  ]);
}

const G03_L02: readonly PageInteractionSpec[] = Object.freeze([
  dragPage({
    animationId: 'course-g03-l02-ti-002',
    suffix: 'ti002-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI02.swf'),
    sourceSwfSha256: 'a1535e6d0734aaa15250445ce40764eac7e0c9026f9ff72de9ac3628dd18244d',
    problem: Object.freeze({en: '8 + 5 = 13', es: '8 + 5 = 13'}),
    tokens: additionTokens('g3l2-ti002-addend-a', 'g3l2-ti002-addend-b', 'g3l2-ti002-sum'),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-003',
    suffix: 'ti003-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI03.swf'),
    sourceSwfSha256: '826acd1f4169d4f7881fd12b00957e6d19717c61c33dd800993c51553668fd3b',
    problem: Object.freeze({en: '9 + 6 = 15', es: '9 + 6 = 15'}),
    tokens: additionTokens('g3l2-ti003-addend-a', 'g3l2-ti003-addend-b', 'g3l2-ti003-sum'),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-004',
    suffix: 'ti004-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI04.swf'),
    problem: Object.freeze({en: '14 − 5 = 9', es: '14 − 5 = 9'}),
    tokens: differenceWithDistractors('g3l2-ti004-difference', 'g3l2-ti004-addend', 'g3l2-ti004-sum'),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-005',
    suffix: 'ti005-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI05.swf'),
    problem: Object.freeze({en: '20 − 8 = 12', es: '20 − 8 = 12'}),
    tokens: differenceWithDistractors('g3l2-ti005-difference', 'g3l2-ti005-addend', 'g3l2-ti005-sum'),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-006',
    suffix: 'ti006-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI06.swf'),
    problem: Object.freeze({en: '+  means  ___     −  means  ___', es: '+  significa  ___     −  significa  ___'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g3l2-ti006-addition', label: ADDITION, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g3l2-ti006-subtraction', label: SUBTRACTION, correctTargetIds: Object.freeze(['slot-b'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-007',
    suffix: 'ti007-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI07.swf'),
    problem: Object.freeze({en: '7 + 4 = 11 and 11 − 4 = 7', es: '7 + 4 = 11 y 11 − 4 = 7'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g3l2-ti007-addition', label: ADDITION, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g3l2-ti007-subtraction', label: SUBTRACTION, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g3l2-ti007-sum', label: SUM, correctTargetIds: Object.freeze([])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-008',
    suffix: 'ti008-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI08.swf'),
    problem: Object.freeze({en: '30 + 20 = 50', es: '30 + 20 = 50'}),
    tokens: additionTokens('g3l2-ti008-addend-a', 'g3l2-ti008-addend-b', 'g3l2-ti008-sum'),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-009',
    suffix: 'ti009-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI09.swf'),
    problem: Object.freeze({en: '6 + 7 = 13', es: '6 + 7 = 13'}),
    tokens: additionTokens('g3l2-ti009-addend-a', 'g3l2-ti009-addend-b', 'g3l2-ti009-sum'),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g03-l02-ti-010',
    suffix: 'ti010-key-terms',
    sourceSwfPath: swfPath(3, 2, 'TI', 'L2TI10.swf'),
    problem: Object.freeze({en: '18 − 9 = 9', es: '18 − 9 = 9'}),
    tokens: differenceWithDistractors('g3l2-ti010-difference', 'g3l2-ti010-addend', 'g3l2-ti010-sum'),
    targets: THREE_CELLS
  }),
  selectPage({
    animationId: 'course-g03-l02-gs-002',
    suffix: 'gs002-game',
    sourceSwfPath: swfPath(3, 2, 'GS', 'L2GS02.swf'),
    problem: Object.freeze({en: 'What is 8 + 5?', es: '¿Cuánto es 8 + 5?'}),
    choices: Object.freeze([
      Object.freeze({id: 'g3l2-gs002-a', label: Object.freeze({en: '12', es: '12'}), correct: false}),
      Object.freeze({id: 'g3l2-gs002-b', label: Object.freeze({en: '13', es: '13'}), correct: true}),
      Object.freeze({id: 'g3l2-gs002-c', label: Object.freeze({en: '14', es: '14'}), correct: false})
    ])
  }),
  selectPage({
    animationId: 'course-g03-l02-gs-003',
    suffix: 'gs003-game',
    sourceSwfPath: swfPath(3, 2, 'GS', 'L2GS03.swf'),
    problem: Object.freeze({en: 'What is 14 − 5?', es: '¿Cuánto es 14 − 5?'}),
    choices: Object.freeze([
      Object.freeze({id: 'g3l2-gs003-a', label: Object.freeze({en: '8', es: '8'}), correct: false}),
      Object.freeze({id: 'g3l2-gs003-b', label: Object.freeze({en: '9', es: '9'}), correct: true}),
      Object.freeze({id: 'g3l2-gs003-c', label: Object.freeze({en: '19', es: '19'}), correct: false})
    ])
  })
]);

const G04_L03: readonly PageInteractionSpec[] = Object.freeze([
  dragPage({
    animationId: 'course-g04-l03-ti-002',
    suffix: 'ti002-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI02.swf'),
    sourceSwfSha256: 'e640f8dcbfb6dd6945d97be67890e0015902702239e2bad4bd4283685fb0f807',
    problem: Object.freeze({en: '7    −4    0', es: '7    −4    0'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g4l3-ti002-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g4l3-ti002-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g4l3-ti002-zero', label: ZERO, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-003',
    suffix: 'ti003-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI03.swf'),
    problem: Object.freeze({
      en: 'On a number line: left of 0, right of 0, at 0',
      es: 'En una recta numérica: a la izquierda de 0, a la derecha de 0, en 0'
    }),
    tokens: Object.freeze([
      Object.freeze({id: 'g4l3-ti003-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g4l3-ti003-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g4l3-ti003-zero', label: ZERO, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-004',
    suffix: 'ti004-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI04.swf'),
    problem: Object.freeze({en: '+3    −3    0', es: '+3    −3    0'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g4l3-ti004-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g4l3-ti004-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g4l3-ti004-zero', label: ZERO, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-005',
    suffix: 'ti005-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI05.swf'),
    problem: Object.freeze({
      en: 'On a number line: −8, 0, and 7',
      es: 'En una recta numérica: −8, 0 y 7'
    }),
    tokens: Object.freeze([
      Object.freeze({id: 'g4l3-ti005-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g4l3-ti005-zero', label: ZERO, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g4l3-ti005-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g04-l03-ti-006',
    suffix: 'ti006-key-terms',
    sourceSwfPath: swfPath(4, 3, 'TI', 'L3TI06.swf'),
    problem: Object.freeze({en: 'The opposite of 5 is −5.', es: 'El opuesto de 5 es −5.'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g4l3-ti006-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g4l3-ti006-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g4l3-ti006-zero', label: ZERO, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  selectPage({
    animationId: 'course-g04-l03-gs-002',
    suffix: 'gs002-game',
    sourceSwfPath: swfPath(4, 3, 'GS', 'L3GS02.swf'),
    problem: Object.freeze({en: 'Which value is farthest left on the number line?', es: '¿Qué valor está más a la izquierda en la recta numérica?'}),
    choices: Object.freeze([
      Object.freeze({id: 'g4l3-gs002-a', label: Object.freeze({en: '−10', es: '−10'}), correct: true}),
      Object.freeze({id: 'g4l3-gs002-b', label: Object.freeze({en: '3', es: '3'}), correct: false}),
      Object.freeze({id: 'g4l3-gs002-c', label: Object.freeze({en: '0', es: '0'}), correct: false})
    ])
  })
]);

const G05_L05: readonly PageInteractionSpec[] = Object.freeze([
  dragPage({
    animationId: 'course-g05-l05-ti-002',
    suffix: 'ti002-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI02.swf'),
    sourceSwfSha256: '54edc245960ecb1847f0117393601f5ca5644777b1d22f28ab94fcdb195f2a38',
    problem: Object.freeze({en: '−3 + 5', es: '−3 + 5'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti002-add', label: ADD, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti002-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti002-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-003',
    suffix: 'ti003-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI03.swf'),
    problem: Object.freeze({en: 'The ___ of −7 is negative.', es: 'El ___ de −7 es negativo.'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti003-sign', label: SIGN, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti003-add', label: ADD, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti003-zero', label: ZERO, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-004',
    suffix: 'ti004-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI04.swf'),
    problem: Object.freeze({en: '−4 and +4', es: '−4 y +4'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti004-opposite', label: OPPOSITE, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti004-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti004-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-005',
    suffix: 'ti005-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI05.swf'),
    problem: Object.freeze({en: '6 − (−2)', es: '6 − (−2)'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti005-subtract', label: SUBTRACT, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti005-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti005-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-006',
    suffix: 'ti006-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI06.swf'),
    problem: Object.freeze({en: '−2 + −5', es: '−2 + −5'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti006-add', label: ADD, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti006-negative-a', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b', 'slot-c'])}),
      Object.freeze({id: 'g5l5-ti006-negative-b', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b', 'slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-007',
    suffix: 'ti007-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI07.swf'),
    problem: Object.freeze({en: 'Integer tiles that cancel make ___', es: 'Las fichas enteras que se cancelan forman ___'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti007-zero', label: ZERO, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti007-add', label: ADD, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti007-sign', label: SIGN, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-008',
    suffix: 'ti008-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI08.swf'),
    problem: Object.freeze({en: '−8 − 3', es: '−8 − 3'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti008-subtract', label: SUBTRACT, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti008-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti008-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-009',
    suffix: 'ti009-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI09.swf'),
    problem: Object.freeze({en: 'The opposite of −2 is +2.', es: 'El opuesto de −2 es +2.'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti009-opposite', label: OPPOSITE, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti009-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti009-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  dragPage({
    animationId: 'course-g05-l05-ti-010',
    suffix: 'ti010-key-terms',
    sourceSwfPath: swfPath(5, 5, 'TI', 'L5TI10.swf'),
    problem: Object.freeze({en: '−1 + 4 = 3', es: '−1 + 4 = 3'}),
    tokens: Object.freeze([
      Object.freeze({id: 'g5l5-ti010-add', label: ADD, correctTargetIds: Object.freeze(['slot-a'])}),
      Object.freeze({id: 'g5l5-ti010-negative', label: NEGATIVE, correctTargetIds: Object.freeze(['slot-b'])}),
      Object.freeze({id: 'g5l5-ti010-positive', label: POSITIVE, correctTargetIds: Object.freeze(['slot-c'])})
    ]),
    targets: THREE_CELLS
  }),
  selectPage({
    animationId: 'course-g05-l05-gs-002',
    suffix: 'gs002-game',
    sourceSwfPath: swfPath(5, 5, 'GS', 'L5GS02.swf'),
    problem: Object.freeze({en: 'What is −3 + 5?', es: '¿Cuánto es −3 + 5?'}),
    choices: Object.freeze([
      Object.freeze({id: 'g5l5-gs002-a', label: Object.freeze({en: '−8', es: '−8'}), correct: false}),
      Object.freeze({id: 'g5l5-gs002-b', label: Object.freeze({en: '2', es: '2'}), correct: true}),
      Object.freeze({id: 'g5l5-gs002-c', label: Object.freeze({en: '8', es: '8'}), correct: false})
    ])
  })
]);

export const CITED_PAGE_INTERACTIONS: readonly PageInteractionSpec[] = Object.freeze([
  ...G03_L02,
  ...G04_L03,
  ...G05_L05
]);
